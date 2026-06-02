import { v } from "convex/values";
import { mutation, query, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import Stripe from "stripe";

// Initialize Stripe
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  return new Stripe(key);
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Link a Stripe customer to a workspace
 */
export const linkCustomer = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    await ctx.db.patch(args.workspaceId, {
      stripeCustomerId: args.stripeCustomerId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update subscription status for a workspace
 */
export const updateSubscription = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    stripeSubscriptionId: v.optional(v.string()),
    billingPlan: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Update tier and usage limit based on plan
    const planLimits: Record<string, number> = {
      free: 50,
      usage_based: 999999999, // Effectively unlimited
      starter: 1000,
      pro: 10000,
      scale: 100000,
    };

    const newLimit = planLimits[args.billingPlan] || 50;

    // Determine tier
    let newTier = args.billingPlan === "free" ? "free" : args.billingPlan;

    await ctx.db.patch(args.workspaceId, {
      stripeSubscriptionId: args.stripeSubscriptionId,
      billingPlan: args.billingPlan,
      tier: newTier,
      usageLimit: newLimit,
      updatedAt: Date.now(),
    });

    return { success: true, newLimit };
  },
});

/**
 * Record daily usage for billing
 */
export const recordUsage = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    callCount: v.number(),
    date: v.string(), // "2026-02-28" format
  },
  handler: async (ctx, args) => {
    // Check if record exists for this date
    const existing = await ctx.db
      .query("usageRecords")
      .withIndex("by_workspaceId_date", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("date", args.date)
      )
      .unique();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        callCount: existing.callCount + args.callCount,
        updatedAt: Date.now(),
      });
      return { id: existing._id, callCount: existing.callCount + args.callCount };
    } else {
      // Create new record
      const id = await ctx.db.insert("usageRecords", {
        workspaceId: args.workspaceId,
        date: args.date,
        callCount: args.callCount,
        reportedToStripe: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { id, callCount: args.callCount };
    }
  },
});

/**
 * Log actual cost for a single API call (called by gateway after response)
 * Accumulates into daily usageRecords for Stripe reporting
 */
export const logCallCost = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    provider: v.string(),
    model: v.string(),
    providerCostUsd: v.float64(),
    apiclawCostUsd: v.float64(),
    inputTokens: v.number(),
    outputTokens: v.number(),
  },
  handler: async (ctx, args) => {
    const date = new Date().toISOString().split("T")[0]; // "2026-04-11"

    const existing = await ctx.db
      .query("usageRecords")
      .withIndex("by_workspaceId_date", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("date", date)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        callCount: existing.callCount + 1,
        providerCostUsd: (existing.providerCostUsd || 0) + args.providerCostUsd,
        apiclawCostUsd: (existing.apiclawCostUsd || 0) + args.apiclawCostUsd,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("usageRecords", {
        workspaceId: args.workspaceId,
        date,
        callCount: 1,
        providerCostUsd: args.providerCostUsd,
        apiclawCostUsd: args.apiclawCostUsd,
        reportedToStripe: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Process a successful payment (from webhook)
 */
export const processPayment = mutation({
  args: {
    stripeInvoiceId: v.string(),
    workspaceId: v.id("workspaces"),
    amount: v.number(), // in cents
    periodStart: v.number(),
    periodEnd: v.number(),
    callCount: v.number(),
    pdfUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check for idempotency - don't process same invoice twice
    const existing = await ctx.db
      .query("invoices")
      .withIndex("by_stripeInvoiceId", (q) =>
        q.eq("stripeInvoiceId", args.stripeInvoiceId)
      )
      .unique();

    if (existing) {
      // Already processed, return existing
      return { id: existing._id, alreadyProcessed: true };
    }

    // Create invoice record
    const id = await ctx.db.insert("invoices", {
      workspaceId: args.workspaceId,
      stripeInvoiceId: args.stripeInvoiceId,
      amount: args.amount,
      status: "paid",
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      callCount: args.callCount,
      pdfUrl: args.pdfUrl,
      createdAt: Date.now(),
    });

    // Update workspace last billing date
    await ctx.db.patch(args.workspaceId, {
      lastBillingDate: Date.now(),
      updatedAt: Date.now(),
    });

    return { id, alreadyProcessed: false };
  },
});

/**
 * Increment credit balance (for prepaid credits)
 */
export const incrementCredits = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    amount: v.number(), // in cents
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const currentBalance = workspace.creditBalance || 0;
    const newBalance = currentBalance + args.amount;

    await ctx.db.patch(args.workspaceId, {
      creditBalance: newBalance,
      updatedAt: Date.now(),
    });

    return { previousBalance: currentBalance, newBalance };
  },
});

/**
 * Decrement credit balance (when using prepaid credits)
 */
export const decrementCredits = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    amount: v.number(), // in cents
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const currentBalance = workspace.creditBalance || 0;
    if (currentBalance < args.amount) {
      throw new Error("Insufficient credit balance");
    }

    const newBalance = currentBalance - args.amount;

    await ctx.db.patch(args.workspaceId, {
      creditBalance: newBalance,
      updatedAt: Date.now(),
    });

    return { previousBalance: currentBalance, newBalance };
  },
});

/**
 * Mark usage as reported to Stripe
 */
export const markUsageReported = internalMutation({
  args: {
    usageRecordId: v.id("usageRecords"),
    stripeUsageRecordId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.usageRecordId, {
      reportedToStripe: true,
      stripeUsageRecordId: args.stripeUsageRecordId,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update invoice status (from webhook)
 */
export const updateInvoiceStatus = mutation({
  args: {
    stripeInvoiceId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db
      .query("invoices")
      .withIndex("by_stripeInvoiceId", (q) =>
        q.eq("stripeInvoiceId", args.stripeInvoiceId)
      )
      .unique();

    if (!invoice) {
      return { found: false };
    }

    await ctx.db.patch(invoice._id, {
      status: args.status,
    });

    return { found: true, id: invoice._id };
  },
});

/**
 * Reset usage count on subscription cancellation
 * Gives user a clean slate when downgrading to free
 */
export const resetUsageOnCancellation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    await ctx.db.patch(args.workspaceId, {
      usageCount: 0,
      updatedAt: Date.now(),
    });

    return { success: true, previousUsage: workspace.usageCount };
  },
});

/**
 * Update payment method info (from webhook)
 */
export const updatePaymentMethodInfo = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    hasPaymentMethod: v.boolean(),
    paymentMethodType: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
    cardLast4: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    await ctx.db.patch(args.workspaceId, {
      hasPaymentMethod: args.hasPaymentMethod,
      paymentMethodType: args.paymentMethodType,
      cardBrand: args.cardBrand,
      cardLast4: args.cardLast4,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============================================
// QUERIES
// ============================================

/**
 * Get billing info for a workspace
 */
export const getInfo = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Get recent invoices
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_workspaceId_createdAt", (q) =>
        q.eq("workspaceId", args.workspaceId)
      )
      .order("desc")
      .take(10);

    // Calculate current period usage
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodStartStr = periodStart.toISOString().split("T")[0];

    const usageRecords = await ctx.db
      .query("usageRecords")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const currentPeriodUsage = usageRecords
      .filter((r) => r.date >= periodStartStr)
      .reduce((sum, r) => sum + r.callCount, 0);

    // Determine plan limits
    const plan = workspace.billingPlan || "free";
    const planLimits: Record<string, number> = {
      free: 100,
      usage_based: 999999999,
      starter: 1000,
      pro: 10000,
      scale: 100000,
    };

    return {
      plan,
      tier: workspace.tier,
      usage: workspace.usageCount,
      currentPeriodUsage,
      limit: workspace.usageLimit,
      creditBalance: workspace.creditBalance || 0,
      stripeCustomerId: workspace.stripeCustomerId,
      stripeSubscriptionId: workspace.stripeSubscriptionId,
      lastBillingDate: workspace.lastBillingDate,
      invoices: invoices.map((inv) => ({
        id: inv._id,
        stripeInvoiceId: inv.stripeInvoiceId,
        amount: inv.amount,
        status: inv.status,
        periodStart: inv.periodStart,
        periodEnd: inv.periodEnd,
        callCount: inv.callCount,
        pdfUrl: inv.pdfUrl,
        createdAt: inv.createdAt,
      })),
      // Check if payment method needed
      needsPaymentMethod:
        plan === "free" && workspace.usageCount >= workspace.usageLimit,
    };
  },
});

/**
 * Get current period usage
 */
export const getCurrentUsage = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Current billing period (month)
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const periodStartStr = periodStart.toISOString().split("T")[0];

    // Get usage records for this period
    const usageRecords = await ctx.db
      .query("usageRecords")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const periodRecords = usageRecords.filter((r) => r.date >= periodStartStr);
    const callCount = periodRecords.reduce((sum, r) => sum + r.callCount, 0);

    // Calculate cost from actual tracked costs (or estimate from call count)
    const FREE_CALLS = 100;
    const totalApiclawCost = periodRecords.reduce((sum: number, r: any) => sum + (r.apiclawCostUsd || 0), 0);
    const billableCalls = Math.max(0, callCount - FREE_CALLS);
    // Use actual tracked cost if available, otherwise estimate at $0.01/call
    const estimatedCost = totalApiclawCost > 0
      ? Math.round(totalApiclawCost * 100) // convert USD to cents
      : billableCalls * 1;

    return {
      callCount,
      periodStart: periodStart.getTime(),
      periodEnd: periodEnd.getTime(),
      limit: workspace.usageLimit,
      remaining: Math.max(0, workspace.usageLimit - workspace.usageCount),
      percentUsed: Math.round((workspace.usageCount / workspace.usageLimit) * 100),
      billableCalls,
      estimatedCostCents: estimatedCost,
      dailyBreakdown: periodRecords.map((r) => ({
        date: r.date,
        calls: r.callCount,
        reportedToStripe: r.reportedToStripe,
      })),
    };
  },
});

/**
 * Get invoices for a workspace
 */
export const getInvoices = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_workspaceId_createdAt", (q) =>
        q.eq("workspaceId", args.workspaceId)
      )
      .order("desc")
      .take(limit);

    return invoices.map((inv) => ({
      id: inv._id,
      stripeInvoiceId: inv.stripeInvoiceId,
      amount: inv.amount,
      amountFormatted: `$${(inv.amount / 100).toFixed(2)}`,
      status: inv.status,
      periodStart: inv.periodStart,
      periodEnd: inv.periodEnd,
      callCount: inv.callCount,
      pdfUrl: inv.pdfUrl,
      createdAt: inv.createdAt,
    }));
  },
});

/**
 * Get unreported usage records (for cron job)
 */
export const getUnreportedUsage = query({
  args: {},
  handler: async (ctx) => {
    const unreported = await ctx.db
      .query("usageRecords")
      .withIndex("by_reportedToStripe", (q) => q.eq("reportedToStripe", false))
      .collect();

    return unreported;
  },
});

/**
 * Get workspace by Stripe customer ID
 */
export const getByStripeCustomerId = query({
  args: {
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workspaces")
      .withIndex("by_stripeCustomerId", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .unique();
  },
});

/**
 * Get workspace by ID
 */
export const getWorkspace = query({
  args: {
    id: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ============================================
// STRIPE USAGE REPORTING (Internal Actions)
// ============================================

/**
 * Get all workspaces with active Stripe subscriptions (internal)
 */
export const getActiveSubscriptions = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all workspaces with a subscription ID
    const workspaces = await ctx.db
      .query("workspaces")
      .filter((q) => q.neq(q.field("stripeSubscriptionId"), undefined))
      .collect();

    // Filter to only those with billing plan that requires reporting
    return workspaces.filter(
      (w) => w.billingPlan === "usage_based" && w.stripeSubscriptionId
    );
  },
});

/**
 * Get unreported usage records for a specific workspace (internal)
 */
export const getUnreportedUsageForWorkspace = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("usageRecords")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("reportedToStripe"), false))
      .collect();
  },
});

/**
 * Mark multiple usage records as reported (internal)
 */
export const markUsageRecordsReported = internalMutation({
  args: {
    usageRecordIds: v.array(v.id("usageRecords")),
    stripeUsageRecordId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const recordId of args.usageRecordIds) {
      await ctx.db.patch(recordId, {
        reportedToStripe: true,
        stripeUsageRecordId: args.stripeUsageRecordId,
        updatedAt: now,
      });
    }
  },
});

/**
 * Report usage to Stripe for a single workspace
 * Internal action - called by the daily cron
 */
export const reportUsageToStripe = internalAction({
  args: {
    workspaceId: v.id("workspaces"),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; callCount: number; error?: string }> => {
    try {
      // Get unreported usage records
      const usageRecords = await ctx.runQuery(
        internal.billing.getUnreportedUsageForWorkspace,
        { workspaceId: args.workspaceId }
      );

      if (usageRecords.length === 0) {
        return { success: true, callCount: 0 };
      }

      // Sum up all unreported calls and costs
      const totalCalls = usageRecords.reduce(
        (sum: number, r: { callCount: number }) => sum + r.callCount,
        0
      );
      const totalCostUsd = usageRecords.reduce(
        (sum: number, r: any) => sum + (r.apiclawCostUsd || r.callCount * 0.002),
        0
      );

      if (totalCalls === 0) {
        // Mark as reported even if 0 calls (to prevent re-processing)
        await ctx.runMutation(internal.billing.markUsageRecordsReported, {
          usageRecordIds: usageRecords.map((r: { _id: Id<"usageRecords"> }) => r._id),
          stripeUsageRecordId: "zero_usage",
        });
        return { success: true, callCount: 0 };
      }

      const stripe = getStripe();

      // Get subscription to find the metered subscription item
      const subscription = await stripe.subscriptions.retrieve(args.stripeSubscriptionId);

      // Find the metered price item (usage_based price)
      const meteredItem = subscription.items.data.find((item) => {
        return item.price.recurring?.usage_type === "metered";
      });

      if (!meteredItem) {
        console.error(
          `No metered subscription item found for subscription ${args.stripeSubscriptionId}`
        );
        return {
          success: false,
          callCount: totalCalls,
          error: "No metered subscription item found",
        };
      }

      // Report usage via Stripe Meter Events API.
      // The metered price `price_1TL038RtJYK3aJTqODoFAiVT` is bound to meter
      // `mtr_61UFEGojJ0b2awh1441RtJYK3aJTqS9g` (event_name="api_call", sum of payload.value).
      // Stripe deprecated the legacy /v1/subscription_items/.../usage_records endpoint
      // for meter-bound prices -- it returns an error there. Use /v1/billing/meter_events.
      // 1 unit = $0.01, so we send the dollar cost in cents.
      const costInCents = Math.ceil(totalCostUsd * 100);
      const customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

      if (!customerId) {
        throw new Error(`Subscription ${args.stripeSubscriptionId} has no customer`);
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      const usageRecordKey = usageRecords
        .map((r: { _id: Id<"usageRecords"> }) => r._id)
        .sort()
        .join("_");
      const idempotencyKey = `apiclaw_${args.workspaceId}_${usageRecordKey}`;

      const meterEventResponse = await fetch(
        `https://api.stripe.com/v1/billing/meter_events`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            event_name: "api_call",
            "payload[stripe_customer_id]": customerId,
            "payload[value]": String(costInCents),
            identifier: idempotencyKey,
            timestamp: String(Math.floor(Date.now() / 1000)),
          }),
        }
      );

      if (!meterEventResponse.ok) {
        const errorData = await meterEventResponse.text();
        throw new Error(`Stripe meter event error: ${meterEventResponse.status} - ${errorData}`);
      }

      // Meter events don't return an `id`; the idempotency identifier is the reference.
      await ctx.runMutation(internal.billing.markUsageRecordsReported, {
        usageRecordIds: usageRecords.map((r: { _id: Id<"usageRecords"> }) => r._id),
        stripeUsageRecordId: idempotencyKey,
      });

      console.log(
        `Reported ${totalCalls} calls (${costInCents}¢) for workspace ${args.workspaceId} via meter event ${idempotencyKey}`
      );

      return { success: true, callCount: totalCalls };
    } catch (error: any) {
      console.error(
        `Failed to report usage for workspace ${args.workspaceId}:`,
        error
      );
      return {
        success: false,
        callCount: 0,
        error: error.message || "Unknown error",
      };
    }
  },
});

// Type for workspace with active subscription
type ActiveWorkspace = {
  _id: Id<"workspaces">;
  email: string;
  stripeSubscriptionId?: string;
};

// Type for cron results
type CronResults = {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  totalCallsReported: number;
  errors: string[];
};

/**
 * Daily cron job: Report all unreported usage to Stripe
 * Runs at 00:05 UTC
 */
export const reportAllUsageToStripe = internalAction({
  args: {},
  handler: async (ctx): Promise<CronResults> => {
    console.log("[Cron] Starting daily usage reporting to Stripe...");

    // Get all workspaces with active subscriptions
    const workspaces: ActiveWorkspace[] = await ctx.runQuery(
      internal.billing.getActiveSubscriptions,
      {}
    );

    console.log(`[Cron] Found ${workspaces.length} workspaces with active subscriptions`);

    const results: CronResults = {
      total: workspaces.length,
      success: 0,
      failed: 0,
      skipped: 0,
      totalCallsReported: 0,
      errors: [],
    };

    // Process each workspace
    for (const workspace of workspaces) {
      if (!workspace.stripeSubscriptionId) {
        results.skipped++;
        continue;
      }

      try {
        const result = await ctx.runAction(internal.billing.reportUsageToStripe, {
          workspaceId: workspace._id,
          stripeSubscriptionId: workspace.stripeSubscriptionId,
        });

        if (result.success) {
          results.success++;
          results.totalCallsReported += result.callCount;
        } else {
          results.failed++;
          results.errors.push(
            `${workspace.email}: ${result.error || "Unknown error"}`
          );
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${workspace.email}: ${error.message || "Unknown error"}`);
        console.error(`[Cron] Error processing workspace ${workspace._id}:`, error);
        // Continue with next workspace
      }
    }

    console.log("[Cron] Daily usage reporting complete:", JSON.stringify(results));

    return results;
  },
});
