import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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
      free: 100,
      usage_based: 999999999, // Effectively unlimited
      starter: 1000,
      pro: 10000,
      scale: 100000,
    };

    const newLimit = planLimits[args.billingPlan] || 100;

    await ctx.db.patch(args.workspaceId, {
      stripeSubscriptionId: args.stripeSubscriptionId,
      billingPlan: args.billingPlan,
      tier: args.billingPlan === "free" ? "free" : "pro",
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

    // Calculate estimated cost (for usage-based billing)
    const FREE_CALLS = 100;
    const COST_PER_CALL = 1; // 1 cent = $0.01
    const billableCalls = Math.max(0, callCount - FREE_CALLS);
    const estimatedCost = billableCalls * COST_PER_CALL;

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
