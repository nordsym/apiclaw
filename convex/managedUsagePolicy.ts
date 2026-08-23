import {
  FREE_MANAGED_CALLS_LIFETIME,
  FREE_MANAGED_PROVIDER_COST_CAP_USD,
  PAYG_MARGIN_RATE,
} from "../src/product-truth";

export type ManagedTrafficClass = "customer" | "internal";
export type ManagedBillingClass = "activation" | "payg" | "internal" | "contract";

export type ManagedUsageWorkspace = {
  tier: string;
  billingPlan?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: string;
  managedCostHoldAt?: number;
  managedCostHoldReason?: string;
  hasPaymentMethod?: boolean;
  hasCardAttached?: boolean;
  paygMeterReadyAt?: number;
  paygMeterPriceId?: string;
  paygMeterId?: string;
  paygMeterEventName?: string;
  usageCount?: number;
  managedUsageCount?: number;
  activationManagedCallCount?: number;
  activationProviderCostMicros?: number;
};

export type ManagedUsageDecision = {
  allowed: boolean;
  reason: null | "payment_required" | "unpriced_managed_call" | "payg_cost_adapter_missing" | "managed_cost_hold";
  billingClass: ManagedBillingClass;
  trafficClass: ManagedTrafficClass;
  managedUsageCount: number;
  activationManagedCallCount: number;
  managedUsageLimit: number;
  managedUsageRemaining: number;
  activationProviderCostUsd: number;
  activationProviderCostCapUsd: number;
  activationProviderCostRemainingUsd: number;
  warning: null | {
    type: "managed_allowance_warning";
    used: number;
    limit: number;
    remaining: number;
    message: string;
    upgradeUrl: string;
  };
};

const ACTIVE_SUBSCRIPTION_STATES = new Set(["active", "trialing"]);
const CONTRACT_TIERS = new Set(["pro", "scale", "enterprise"]);

export function isInternalTier(tier: string): boolean {
  return tier === "founder" || tier === "partner";
}

export function hasActivePaygEntitlement(workspace: ManagedUsageWorkspace): boolean {
  const planIsPayg = workspace.billingPlan === "usage_based" || workspace.tier === "usage_based";
  const subscriptionActive = !!workspace.stripeCustomerId &&
    !!workspace.stripeSubscriptionId &&
    ACTIVE_SUBSCRIPTION_STATES.has(workspace.stripeSubscriptionStatus || "");
  const paymentMethodActive = workspace.hasPaymentMethod === true || workspace.hasCardAttached === true;
  const exactMeterReady = !!workspace.paygMeterReadyAt &&
    !!workspace.paygMeterPriceId &&
    !!workspace.paygMeterId &&
    !!workspace.paygMeterEventName;
  return planIsPayg && subscriptionActive && paymentMethodActive && exactMeterReady;
}

export function hasActiveContractEntitlement(workspace: ManagedUsageWorkspace): boolean {
  // A tier label alone is not a billing entitlement. The reconciled Stripe
  // plan must be the same contract product, otherwise an enterprise-labelled
  // workspace with an exact-meter PAYG subscription would be charged zero.
  return CONTRACT_TIERS.has(workspace.tier) &&
    workspace.billingPlan === workspace.tier &&
    !!workspace.stripeSubscriptionId &&
    ACTIVE_SUBSCRIPTION_STATES.has(workspace.stripeSubscriptionStatus || "");
}

export function managedUsageCount(workspace: ManagedUsageWorkspace): number {
  return workspace.managedUsageCount ?? workspace.usageCount ?? 0;
}

// Existing workspaces predate the activation-only counter. Falling back to the
// lifetime managed/legacy count is deliberately conservative: a migration can
// never accidentally grant a second free allowance. The value is capped at the
// activation limit because paid/internal history must not grow this counter.
// This counter is informational only now (see evaluateManagedUsage below);
// it is kept for analytics/back-compat display, not for gating.
export function activationManagedCallCount(workspace: ManagedUsageWorkspace): number {
  const explicit = workspace.activationManagedCallCount;
  if (explicit !== undefined) return Math.max(0, Math.min(FREE_MANAGED_CALLS_LIFETIME, explicit));
  return Math.max(0, Math.min(FREE_MANAGED_CALLS_LIFETIME, managedUsageCount(workspace)));
}

function hasStoredPaymentMethod(workspace: ManagedUsageWorkspace): boolean {
  return workspace.hasPaymentMethod === true || workspace.hasCardAttached === true;
}

function baseDecision(
  workspace: ManagedUsageWorkspace,
  billingClass: ManagedBillingClass,
  trafficClassOverride?: ManagedTrafficClass,
): Omit<ManagedUsageDecision, "allowed" | "reason" | "warning"> & { billingClass: ManagedBillingClass } {
  const totalUsed = managedUsageCount(workspace);
  const activationUsed = activationManagedCallCount(workspace);
  const activationCost = (workspace.activationProviderCostMicros ?? 0) / 1_000_000;
  const trafficClass = trafficClassOverride === "internal" || isInternalTier(workspace.tier)
    ? "internal"
    : "customer";
  return {
    billingClass,
    trafficClass,
    managedUsageCount: totalUsed,
    activationManagedCallCount: activationUsed,
    // The lifetime call count and the $1 provider-cost cap no longer gate
    // access. A call with provably zero provider cost is free forever and
    // uncapped; a call with real cost is gated on hasPaymentMethod instead.
    // These fields stay populated (as -1 / informational counters) for
    // display and analytics back-compat, never for enforcement.
    managedUsageLimit: -1,
    managedUsageRemaining: -1,
    activationProviderCostUsd: activationCost,
    activationProviderCostCapUsd: FREE_MANAGED_PROVIDER_COST_CAP_USD,
    activationProviderCostRemainingUsd: Math.max(0, FREE_MANAGED_PROVIDER_COST_CAP_USD - activationCost),
  };
}

export function evaluateManagedUsage(
  workspace: ManagedUsageWorkspace,
  options: {
    amount?: number;
    estimatedProviderCostUsd?: number;
    billingGradeCost?: boolean;
    trafficClass?: ManagedTrafficClass;
  } = {},
): ManagedUsageDecision {
  const amount = options.amount ?? 1;
  const estimatedProviderCostUsd = options.estimatedProviderCostUsd;
  const trafficClass = options.trafficClass === "internal" || isInternalTier(workspace.tier)
    ? "internal"
    : "customer";
  if (trafficClass === "internal") {
    const base = baseDecision(workspace, "internal", trafficClass);
    return { ...base, allowed: true, reason: null, warning: null };
  }
  if (workspace.managedCostHoldAt !== undefined || workspace.stripeSubscriptionStatus === "managed_cost_hold") {
    const base = baseDecision(workspace, "activation", trafficClass);
    return { ...base, allowed: false, reason: "managed_cost_hold", warning: null };
  }
  if (hasActiveContractEntitlement(workspace)) {
    const base = baseDecision(workspace, "contract", trafficClass);
    return { ...base, allowed: true, reason: null, warning: null };
  }

  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    estimatedProviderCostUsd === undefined ||
    !Number.isFinite(estimatedProviderCostUsd) ||
    estimatedProviderCostUsd < 0
  ) {
    const base = baseDecision(workspace, "activation", trafficClass);
    return { ...base, allowed: false, reason: "unpriced_managed_call", warning: null };
  }

  // A call whose provider cost is provably zero is free forever, no card
  // required, uncapped: a verified-zero provider (VERIFIED_ZERO_COST_PROVIDERS),
  // the workspace-public keyless-origin path, or an explicit {input:0,output:0}
  // model row. A zero-valued reservation/guess (billingGradeCost !== true)
  // does not qualify; unknown or unproven cost is treated as paid.
  const isProvenZeroCost = estimatedProviderCostUsd === 0 && options.billingGradeCost === true;
  if (isProvenZeroCost) {
    const base = baseDecision(workspace, "activation", trafficClass);
    return { ...base, allowed: true, reason: null, warning: null };
  }

  // Any call with real (or unproven) provider cost requires a card on file.
  // The stored boolean is trusted here; there is no live Stripe check in
  // this hot path.
  if (!hasStoredPaymentMethod(workspace)) {
    const base = baseDecision(workspace, "payg", trafficClass);
    return { ...base, allowed: false, reason: "payment_required", warning: null };
  }

  // A numeric reservation is not enough once a card is on file either. The
  // adapter must prove realized cost or enforce a request-specific upper
  // bound before the call can be charged.
  if (options.billingGradeCost !== true) {
    const base = baseDecision(workspace, "payg", trafficClass);
    return { ...base, allowed: false, reason: "payg_cost_adapter_missing", warning: null };
  }

  const base = baseDecision(workspace, "payg", trafficClass);
  return { ...base, allowed: true, reason: null, warning: null };
}

export function customerChargeForProviderCost(
  providerCostUsd: number,
  billingClass: ManagedBillingClass,
): { customerChargeUsd: number; marginUsd: number } {
  if (billingClass !== "payg") {
    return { customerChargeUsd: 0, marginUsd: 0 };
  }
  const customerChargeUsd = providerCostUsd * (1 + PAYG_MARGIN_RATE);
  return { customerChargeUsd, marginUsd: customerChargeUsd - providerCostUsd };
}

export function managedQuotaMessage(reason: ManagedUsageDecision["reason"]): string {
  if (reason === "managed_cost_hold") {
    return "Managed execution is temporarily paused because realized provider cost did not match the authorized ceiling.";
  }
  if (reason === "payment_required") {
    return "This API has real provider cost. Add a card to continue; you pay provider cost plus 15 percent.";
  }
  if (reason === "unpriced_managed_call") {
    return "This managed action does not yet have a billing-grade cost adapter and is unavailable for customer traffic.";
  }
  if (reason === "payg_cost_adapter_missing") {
    return "This managed action does not yet have an exact provider-cost adapter, so it is blocked rather than estimated.";
  }
  return "Free APIs are free forever, no card. Paid APIs bill provider cost plus 15 percent after you add a card.";
}
