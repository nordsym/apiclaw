import { v } from "convex/values";
import { internalMutation, internalAction, internalQuery, query, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import Stripe from "stripe";
import {
  FREE_MANAGED_CALLS_LIFETIME,
  FREE_MANAGED_PROVIDER_COST_CAP_USD,
} from "../src/product-truth";
import {
  canActivatePaygWorkspace,
  countInvoicePaygCalls,
  decidePaygActivationClaim,
  resolveProtectedSubscriptionStatus,
  resolveTierAfterBillingTransition,
} from "./stripeWebhookEvents";
import { findUsableAgentSession } from "./sessionSecurity";

const PAYG_USAGE_LIMIT = 999_999_999;

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
export const linkCustomer = internalMutation({
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

export const claimPaygActivation = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    activationId: v.string(),
  },
  handler: async (ctx, args) => {
    const activationId = args.activationId.trim();
    if (!activationId || activationId.length > 128) {
      throw new Error("Invalid PAYG activation ID");
    }
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");
    if (workspace.managedCostHoldAt !== undefined || workspace.stripeSubscriptionStatus === "managed_cost_hold") {
      return { claimed: false as const, reason: "managed_cost_hold" as const };
    }

    const now = Date.now();
    const decision = decidePaygActivationClaim(workspace, activationId, now);
    if (decision === "busy" || decision === "not_eligible") {
      return { claimed: false as const, reason: decision };
    }

    await ctx.db.patch(args.workspaceId, {
      paygActivationId: activationId,
      paygActivationStartedAt: now,
      updatedAt: now,
    });
    return { claimed: true as const, resumed: decision === "resume" };
  },
});

export const releasePaygActivation = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    activationId: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");
    if (workspace.paygActivationId !== args.activationId) {
      return { released: false as const, reason: "activation_mismatch" as const };
    }
    await ctx.db.patch(args.workspaceId, {
      paygActivationId: undefined,
      paygActivationStartedAt: undefined,
      updatedAt: Date.now(),
    });
    return { released: true as const };
  },
});

export const completePaygActivation = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    activationId: v.string(),
    stripeSubscriptionId: v.string(),
    stripeSubscriptionStatus: v.string(),
    paygMeterReadyAt: v.number(),
    paygMeterPriceId: v.string(),
    paygMeterId: v.string(),
    paygMeterEventName: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");
    if (workspace.managedCostHoldAt !== undefined || workspace.stripeSubscriptionStatus === "managed_cost_hold") {
      return { applied: false as const, reason: "managed_cost_hold" as const };
    }
    if (!args.stripeSubscriptionId.trim() ||
      !["active", "trialing"].includes(args.stripeSubscriptionStatus)) {
      throw new Error("PAYG activation requires an active Stripe subscription");
    }
    if (workspace.paygActivationId !== args.activationId) {
      const alreadyCompleted = workspace.stripeSubscriptionId === args.stripeSubscriptionId &&
        workspace.billingPlan === "usage_based" &&
        ["active", "trialing"].includes(workspace.stripeSubscriptionStatus || "") &&
        !!workspace.paygMeterReadyAt &&
        !!workspace.paygMeterPriceId &&
        !!workspace.paygMeterId &&
        !!workspace.paygMeterEventName;
      if (!alreadyCompleted) {
        return { applied: false as const, reason: "activation_mismatch" as const };
      }
      await ctx.db.patch(args.workspaceId, {
        hasPaymentMethod: true,
        hasCardAttached: true,
        updatedAt: Date.now(),
      });
      return { applied: true as const, alreadyCompleted: true as const };
    }
    if (!canActivatePaygWorkspace(workspace)) {
      return { applied: false as const, reason: "not_eligible" as const };
    }

    const transition = resolveTierAfterBillingTransition(
      workspace.tier,
      workspace.usageLimit,
      "usage_based",
      PAYG_USAGE_LIMIT,
    );
    await ctx.db.patch(args.workspaceId, {
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeSubscriptionStatus: args.stripeSubscriptionStatus,
      billingPlan: "usage_based",
      tier: transition.tier,
      usageLimit: transition.usageLimit,
      paygMeterReadyAt: args.paygMeterReadyAt,
      paygMeterPriceId: args.paygMeterPriceId,
      paygMeterId: args.paygMeterId,
      paygMeterEventName: args.paygMeterEventName,
      hasPaymentMethod: true,
      hasCardAttached: true,
      paygActivationId: undefined,
      paygActivationStartedAt: undefined,
      updatedAt: Date.now(),
    });
    return { applied: true as const, alreadyCompleted: false as const };
  },
});

/**
 * Update subscription status for a workspace
 */
export const updateSubscription = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    stripeSubscriptionId: v.optional(v.string()),
    billingPlan: v.string(),
    stripeSubscriptionStatus: v.optional(v.string()),
    paygMeterReadyAt: v.optional(v.number()),
    paygMeterPriceId: v.optional(v.string()),
    paygMeterId: v.optional(v.string()),
    paygMeterEventName: v.optional(v.string()),
    expectedCurrentSubscriptionId: v.optional(v.string()),
    recoverPaymentFailedHold: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }
    if (
      args.expectedCurrentSubscriptionId !== undefined &&
      workspace.stripeSubscriptionId !== args.expectedCurrentSubscriptionId
    ) {
      return { success: false, applied: false, reason: "subscription_mismatch" as const };
    }

    // Update tier and usage limit based on plan
    const planLimits: Record<string, number> = {
      free: FREE_MANAGED_CALLS_LIFETIME,
      usage_based: PAYG_USAGE_LIMIT, // Effectively unlimited
      starter: 1000,
      pro: 10000,
      scale: 100000,
    };

    const requestedLimit = planLimits[args.billingPlan] || FREE_MANAGED_CALLS_LIFETIME;
    const transition = resolveTierAfterBillingTransition(
      workspace.tier,
      workspace.usageLimit,
      args.billingPlan,
      requestedLimit,
    );

    const stripeSubscriptionStatus = resolveProtectedSubscriptionStatus(
      workspace.stripeSubscriptionStatus,
      args.stripeSubscriptionStatus,
      args.recoverPaymentFailedHold === true,
    );

    await ctx.db.patch(args.workspaceId, {
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripeSubscriptionStatus,
      paygMeterReadyAt: args.billingPlan === "usage_based" ? args.paygMeterReadyAt : undefined,
      paygMeterPriceId: args.billingPlan === "usage_based" ? args.paygMeterPriceId : undefined,
      paygMeterId: args.billingPlan === "usage_based" ? args.paygMeterId : undefined,
      paygMeterEventName: args.billingPlan === "usage_based" ? args.paygMeterEventName : undefined,
      billingPlan: args.billingPlan,
      tier: transition.tier,
      usageLimit: transition.usageLimit,
      ...(args.stripeSubscriptionId ? {
        paygActivationId: undefined,
        paygActivationStartedAt: undefined,
      } : {}),
      updatedAt: Date.now(),
    });

    return { success: true, applied: true, newLimit: transition.usageLimit };
  },
});

/**
 * Fail closed for new PAYG authorizations without erasing the subscription or
 * immutable ledger snapshots needed to collect already-incurred usage.
 */
export const putPaygOnHold = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    expectedSubscriptionId: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new Error("Workspace not found");
    if (
      args.expectedSubscriptionId !== undefined &&
      workspace.stripeSubscriptionId !== args.expectedSubscriptionId
    ) {
      return { success: false, applied: false, reason: "subscription_mismatch" as const };
    }
    await ctx.db.patch(args.workspaceId, {
      stripeSubscriptionStatus: workspace.stripeSubscriptionStatus === "managed_cost_hold"
        ? "managed_cost_hold"
        : args.status,
      updatedAt: Date.now(),
    });
    return { success: true, applied: true };
  },
});

/**
 * Record daily usage for billing
 */
export const recordUsage = internalMutation({
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
export const processPayment = internalMutation({
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
      if (existing.workspaceId !== args.workspaceId) {
        throw new Error("Stripe invoice is already linked to a different workspace");
      }
      const alreadyProcessed = existing.status === "paid";
      await ctx.db.patch(existing._id, {
        amount: args.amount,
        status: "paid",
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        callCount: args.callCount,
        pdfUrl: args.pdfUrl,
      });
      if (!alreadyProcessed) {
        await ctx.db.patch(args.workspaceId, {
          lastBillingDate: Date.now(),
          updatedAt: Date.now(),
        });
      }
      return { id: existing._id, alreadyProcessed };
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
export const incrementCredits = internalMutation({
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
export const decrementCredits = internalMutation({
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
export const updateInvoiceStatus = internalMutation({
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

    if (invoice.status === "paid" && args.status !== "paid") {
      return { found: true, applied: false, id: invoice._id, reason: "paid_terminal" as const };
    }

    await ctx.db.patch(invoice._id, {
      status: args.status,
    });

    return { found: true, applied: true, id: invoice._id };
  },
});

export const getInvoiceCallCount = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    periodStart: v.number(),
    periodEnd: v.number(),
    subscriptionId: v.string(),
    priceId: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.periodEnd <= args.periodStart) return 0;
    const authorizationLookbackMs = 15 * 60 * 1000;
    const rows = await ctx.db
      .query("managedCallLedger")
      .withIndex("by_workspaceId_createdAt", (q) =>
        q
          .eq("workspaceId", args.workspaceId)
          .gte("createdAt", Math.max(0, args.periodStart - authorizationLookbackMs))
          .lt("createdAt", args.periodEnd)
      )
      .collect();
    return countInvoicePaygCalls(rows, args);
  },
});

/**
 * Legacy cancellation hook retained for callers without resetting lifetime usage.
 */
export const resetUsageOnCancellation = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Lifetime activation allowance never resets on cancellation. Clearing it
    // would let a workspace cycle a subscription to mint another allowance.
    await ctx.db.patch(args.workspaceId, { updatedAt: Date.now() });

    return { success: true, previousUsage: workspace.usageCount };
  },
});

/**
 * Update payment method info (from webhook)
 */
export const updatePaymentMethodInfo = internalMutation({
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
      hasCardAttached: args.hasPaymentMethod,
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
 * Shared handler for billing info, reused by the internal query (trusted
 * server-side callers that already resolved a workspaceId) and the public
 * session-authenticated query below. Do not add secret/Stripe-key fields
 * here; this is exposed to the client via getBillingInfo.
 */
async function buildBillingInfo(ctx: QueryCtx, workspaceId: Id<"workspaces">) {
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Get recent invoices
  const invoices = await ctx.db
    .query("invoices")
    .withIndex("by_workspaceId_createdAt", (q) =>
      q.eq("workspaceId", workspaceId)
    )
    .order("desc")
    .take(12);

  // Calculate current period usage
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const ledger = await ctx.db
    .query("managedCallLedger")
    .withIndex("by_workspaceId_createdAt", (q) =>
      q.eq("workspaceId", workspaceId).gte("createdAt", periodStart.getTime()),
    )
    .collect();
  const currentPeriodUsage = ledger.filter((row) => row.status === "succeeded").length;

  // Determine plan limits
  const plan = workspace.billingPlan || "free";
  const managedUsageCount = workspace.managedUsageCount ?? workspace.usageCount ?? 0;
  const activationProviderCostUsd = (workspace.activationProviderCostMicros ?? 0) / 1_000_000;

  return {
    plan,
    tier: workspace.tier,
    usage: managedUsageCount,
    currentPeriodUsage,
    limit: plan === "free" ? FREE_MANAGED_CALLS_LIFETIME : -1,
    activationProviderCostUsd,
    activationProviderCostCapUsd: FREE_MANAGED_PROVIDER_COST_CAP_USD,
    creditBalance: workspace.creditBalance || 0,
    stripeCustomerId: workspace.stripeCustomerId,
    stripeSubscriptionId: workspace.stripeSubscriptionId,
    lastBillingDate: workspace.lastBillingDate,
    currentPeriodStart: periodStart.getTime(),
    monthlySpendCents: Math.round((workspace.monthlySpendCents ?? 0)),
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
    paymentMethod: workspace.hasPaymentMethod
      ? {
          brand: workspace.cardBrand ?? null,
          last4: workspace.cardLast4 ?? null,
          type: workspace.paymentMethodType ?? null,
        }
      : null,
    // Check if payment method needed
    needsPaymentMethod:
      plan === "free" && (
        managedUsageCount >= FREE_MANAGED_CALLS_LIFETIME ||
        activationProviderCostUsd >= FREE_MANAGED_PROVIDER_COST_CAP_USD
      ),
  };
}

/**
 * Get billing info for a workspace (trusted internal callers).
 */
export const getInfo = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => buildBillingInfo(ctx, args.workspaceId),
});

/**
 * Public, session-authenticated billing info for the workspace UI.
 * Returns null on an invalid/expired session instead of throwing, matching
 * the fail-soft convention used by getWorkspaceDashboard/getLogs.
 */
export const getBillingInfo = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await findUsableAgentSession(ctx.db, token);
    if (!session) return null;
    return await buildBillingInfo(ctx, session.workspaceId);
  },
});

/**
 * Get current period usage
 */
export const getCurrentUsage = internalQuery({
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
    const ledger = await ctx.db
      .query("managedCallLedger")
      .withIndex("by_workspaceId_createdAt", (q) =>
        q.eq("workspaceId", args.workspaceId).gte("createdAt", periodStart.getTime()),
      )
      .collect();
    const succeeded = ledger.filter((row) => row.status === "succeeded");
    const callCount = succeeded.length;
    const billableCalls = succeeded.filter((row) => row.billingClass === "payg").length;
    const customerChargeMicros = succeeded.reduce(
      (sum, row) => sum + (row.customerChargeMicros ?? 0),
      0,
    );
    const managedUsageCount = workspace.managedUsageCount ?? workspace.usageCount ?? 0;
    const limit = workspace.billingPlan === "usage_based" ? -1 : FREE_MANAGED_CALLS_LIFETIME;
    const daily = new Map<string, { calls: number; reported: boolean }>();
    for (const row of succeeded) {
      const date = new Date(row.createdAt).toISOString().slice(0, 10);
      const current = daily.get(date) ?? { calls: 0, reported: true };
      current.calls += 1;
      current.reported = current.reported && row.stripeStatus !== "pending" && row.stripeStatus !== "claiming";
      daily.set(date, current);
    }

    return {
      callCount,
      periodStart: periodStart.getTime(),
      periodEnd: periodEnd.getTime(),
      limit,
      remaining: limit < 0 ? -1 : Math.max(0, limit - managedUsageCount),
      percentUsed: limit < 0 ? 0 : Math.min(100, Math.round((managedUsageCount / limit) * 100)),
      billableCalls,
      customerChargeMicros,
      customerChargeUsd: customerChargeMicros / 1_000_000,
      dailyBreakdown: [...daily.entries()].map(([date, row]) => ({
        date,
        calls: row.calls,
        reportedToStripe: row.reported,
      })),
    };
  },
});

/**
 * Get invoices for a workspace
 */
export const getInvoices = internalQuery({
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
export const getUnreportedUsage = internalQuery({
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
export const getByStripeCustomerId = internalQuery({
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
export const getWorkspace = internalQuery({
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
