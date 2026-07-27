import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

const PROCESSING_LEASE_MS = 5 * 60 * 1000;
const PAYG_ACTIVATION_LEASE_MS = 30 * 60 * 1000;

export type WebhookClaimState = {
  status: "processing" | "succeeded" | "failed";
  attempts?: number;
  processingStartedAt: number;
} | null;

type WebhookLeaseState = {
  status: "processing" | "succeeded" | "failed";
  attempts: number;
  processingStartedAt: number;
};

export function decideWebhookClaim(
  existing: WebhookClaimState,
  now: number,
): "claim" | "already_succeeded" | "already_processing" {
  if (existing?.status === "succeeded") return "already_succeeded";
  if (
    existing?.status === "processing" &&
    now - existing.processingStartedAt < PROCESSING_LEASE_MS
  ) {
    return "already_processing";
  }
  return "claim";
}

export function ownsWebhookLease(
  event: WebhookLeaseState,
  attempt: number,
  processingStartedAt: number,
): boolean {
  return event.status === "processing" &&
    event.attempts === attempt &&
    event.processingStartedAt === processingStartedAt;
}

export function shouldApplyReconciledSubscription(
  workspaceSubscriptionId: string | undefined,
  workspaceSubscriptionStatus: string | undefined,
  eventSubscriptionId: string,
  billable: boolean,
): boolean {
  if (workspaceSubscriptionId && workspaceSubscriptionId !== eventSubscriptionId) return false;
  if (billable && !workspaceSubscriptionId && workspaceSubscriptionStatus !== undefined) return false;
  if (!billable && workspaceSubscriptionId !== eventSubscriptionId) return false;
  return true;
}

export function canActivatePaygWorkspace(workspace: {
  tier: string;
  billingPlan?: string;
}): boolean {
  return workspace.tier === "free" &&
    (workspace.billingPlan === undefined || workspace.billingPlan === "free");
}

export function decidePaygActivationClaim(
  workspace: {
    tier: string;
    billingPlan?: string;
    paygActivationId?: string;
    paygActivationStartedAt?: number;
  },
  activationId: string,
  now: number,
): "claim" | "resume" | "busy" | "not_eligible" {
  if (!canActivatePaygWorkspace(workspace)) return "not_eligible";
  if (!workspace.paygActivationId) return "claim";
  if (workspace.paygActivationId === activationId) return "resume";
  if (
    workspace.paygActivationStartedAt &&
    now - workspace.paygActivationStartedAt < PAYG_ACTIVATION_LEASE_MS
  ) {
    return "busy";
  }
  return "claim";
}

const PRESERVED_WORKSPACE_TIERS = new Set(["founder", "partner", "enterprise"]);

export function resolveTierAfterBillingTransition(
  currentTier: string,
  currentUsageLimit: number,
  nextBillingPlan: string,
  nextUsageLimit: number,
): { tier: string; usageLimit: number } {
  if (PRESERVED_WORKSPACE_TIERS.has(currentTier)) {
    return { tier: currentTier, usageLimit: currentUsageLimit };
  }
  return {
    tier: nextBillingPlan === "free" ? "free" : nextBillingPlan,
    usageLimit: nextUsageLimit,
  };
}

export function paygSubscriptionIdempotencyKey(
  workspaceId: string,
  priceId: string,
  activationId: string,
): string {
  return `apiclaw_payg:${workspaceId}:${priceId}:${activationId}`;
}

export function isPaidInvoiceState(invoice: {
  status?: string | null;
  paid?: boolean;
}): boolean {
  return invoice.status === "paid" || invoice.paid === true;
}

export function resolveProtectedSubscriptionStatus(
  currentStatus: string | undefined,
  reconciledStatus: string | undefined,
  recoverPaymentFailedHold: boolean,
): string | undefined {
  // A managed-cost anomaly requires explicit operator reconciliation. No
  // Stripe lifecycle event, including cancellation, may erase that circuit.
  if (currentStatus === "managed_cost_hold") return currentStatus;
  if (reconciledStatus === "canceled") return reconciledStatus;
  if (currentStatus === "payment_failed" && !recoverPaymentFailedHold) return currentStatus;
  return reconciledStatus;
}

export function shouldHoldPaygForFailedInvoice(
  workspaceSubscriptionId: string | undefined,
  invoiceSubscriptionId: string | undefined,
  invoicePriceIds: string[],
  configuredPriceId: string,
  invoicePaid = false,
): boolean {
  return !invoicePaid &&
    !!workspaceSubscriptionId &&
    workspaceSubscriptionId === invoiceSubscriptionId &&
    invoicePriceIds.includes(configuredPriceId);
}

type InvoicePaygLedgerRow = {
  status: string;
  billingClass: string;
  createdAt: number;
  completedAt?: number;
  stripeSubscriptionIdSnapshot?: string;
  stripePriceIdSnapshot?: string;
};

export function countInvoicePaygCalls(
  rows: InvoicePaygLedgerRow[],
  context: {
    periodStart: number;
    periodEnd: number;
    subscriptionId: string;
    priceId: string;
  },
): number {
  return rows.filter((row) => {
    const timestamp = row.completedAt ?? row.createdAt;
    return row.status === "succeeded" &&
      row.billingClass === "payg" &&
      timestamp >= context.periodStart &&
      timestamp < context.periodEnd &&
      row.stripeSubscriptionIdSnapshot === context.subscriptionId &&
      row.stripePriceIdSnapshot === context.priceId;
  }).length;
}

export const claim = internalMutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    receivedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripeWebhookEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .unique();

    const decision = decideWebhookClaim(existing, args.receivedAt);
    if (decision !== "claim") {
      return { claimed: false as const, reason: decision };
    }

    if (existing) {
      const attempt = existing.attempts + 1;
      await ctx.db.patch(existing._id, {
        eventType: args.eventType,
        status: "processing",
        attempts: attempt,
        processingStartedAt: args.receivedAt,
        completedAt: undefined,
        lastError: undefined,
        updatedAt: args.receivedAt,
      });
      return {
        claimed: true as const,
        replay: true,
        eventRecordId: existing._id,
        attempt,
        processingStartedAt: args.receivedAt,
      };
    }

    const eventRecordId = await ctx.db.insert("stripeWebhookEvents", {
      eventId: args.eventId,
      eventType: args.eventType,
      status: "processing",
      attempts: 1,
      receivedAt: args.receivedAt,
      processingStartedAt: args.receivedAt,
      updatedAt: args.receivedAt,
    });
    return {
      claimed: true as const,
      replay: false,
      eventRecordId,
      attempt: 1,
      processingStartedAt: args.receivedAt,
    };
  },
});

export const succeed = internalMutation({
  args: {
    eventId: v.string(),
    attempt: v.number(),
    processingStartedAt: v.number(),
    completedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("stripeWebhookEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .unique();
    if (!event) throw new Error("Stripe webhook event was not claimed");
    if (event.status === "succeeded") return { alreadySucceeded: true };
    if (!ownsWebhookLease(event, args.attempt, args.processingStartedAt)) {
      return { alreadySucceeded: false, completed: false, reason: "lease_lost" as const };
    }
    await ctx.db.patch(event._id, {
      status: "succeeded",
      completedAt: args.completedAt,
      lastError: undefined,
      updatedAt: args.completedAt,
    });
    return { alreadySucceeded: false, completed: true };
  },
});

export const fail = internalMutation({
  args: {
    eventId: v.string(),
    attempt: v.number(),
    processingStartedAt: v.number(),
    failedAt: v.number(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("stripeWebhookEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .unique();
    if (!event || event.status === "succeeded") return { recorded: false };
    if (!ownsWebhookLease(event, args.attempt, args.processingStartedAt)) {
      return { recorded: false, reason: "lease_lost" as const };
    }
    await ctx.db.patch(event._id, {
      status: "failed",
      completedAt: args.failedAt,
      lastError: args.error.slice(0, 500),
      updatedAt: args.failedAt,
    });
    return { recorded: true };
  },
});
