import {
  FREE_MANAGED_CALLS_LIFETIME,
  FREE_MANAGED_PROVIDER_COST_CAP_USD,
  FREE_MANAGED_WARNING_AT,
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
  reason: null | "managed_call_limit_exceeded" | "provider_cost_cap_exceeded" | "payg_not_active" | "unpriced_managed_call" | "payg_cost_adapter_missing" | "managed_cost_hold";
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
export function activationManagedCallCount(workspace: ManagedUsageWorkspace): number {
  const explicit = workspace.activationManagedCallCount;
  if (explicit !== undefined) return Math.max(0, Math.min(FREE_MANAGED_CALLS_LIFETIME, explicit));
  return Math.max(0, Math.min(FREE_MANAGED_CALLS_LIFETIME, managedUsageCount(workspace)));
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
    managedUsageLimit: billingClass === "activation" ? FREE_MANAGED_CALLS_LIFETIME : -1,
    managedUsageRemaining: billingClass === "activation"
      ? Math.max(0, FREE_MANAGED_CALLS_LIFETIME - activationUsed)
      : -1,
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

  const activationBase = baseDecision(workspace, "activation", trafficClass);
  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    estimatedProviderCostUsd === undefined ||
    !Number.isFinite(estimatedProviderCostUsd) ||
    estimatedProviderCostUsd < 0
  ) {
    return { ...activationBase, allowed: false, reason: "unpriced_managed_call", warning: null };
  }

  const activationCallAvailable = activationBase.activationManagedCallCount + amount <= FREE_MANAGED_CALLS_LIFETIME;
  const activationCostAvailable = activationBase.activationProviderCostUsd + estimatedProviderCostUsd <=
    FREE_MANAGED_PROVIDER_COST_CAP_USD + Number.EPSILON;

  // The lifetime activation allowance is always the first customer rail. A
  // card/subscription only takes over after the call or provider-cost cap is
  // exhausted, so attaching a card can never burn or silently skip free calls.
  if (activationCallAvailable && activationCostAvailable) {
    // A numeric reservation is not enough. Customer activation traffic is
    // allowed only when the adapter can prove realized cost or enforces a
    // request-specific upper bound. This keeps the advertised lifetime
    // provider-cost cap from being bypassed by variable-cost guesses.
    if (options.billingGradeCost !== true) {
      return { ...activationBase, allowed: false, reason: "unpriced_managed_call", warning: null };
    }
    const nextUsed = activationBase.activationManagedCallCount + amount;
    const nextRemaining = Math.max(0, FREE_MANAGED_CALLS_LIFETIME - nextUsed);
    const warning = nextUsed >= FREE_MANAGED_WARNING_AT
      ? {
          type: "managed_allowance_warning" as const,
          used: nextUsed,
          limit: FREE_MANAGED_CALLS_LIFETIME,
          remaining: nextRemaining,
          message: `${nextRemaining} free managed calls remain. Add a payment method to continue at provider cost + ${Math.round(PAYG_MARGIN_RATE * 100)}%.`,
          upgradeUrl: "https://apiclaw.cloud/upgrade",
        }
      : null;

    return {
      ...activationBase,
      allowed: true,
      reason: null,
      managedUsageRemaining: nextRemaining,
      warning,
    };
  }

  if (hasActivePaygEntitlement(workspace)) {
    const paygBase = baseDecision(workspace, "payg", trafficClass);
    if (options.billingGradeCost !== true) {
      return { ...paygBase, allowed: false, reason: "payg_cost_adapter_missing", warning: null };
    }
    return { ...paygBase, allowed: true, reason: null, warning: null };
  }

  if (!activationCallAvailable) {
    return { ...activationBase, allowed: false, reason: "managed_call_limit_exceeded", warning: null };
  }
  if (!activationCostAvailable) {
    return { ...activationBase, allowed: false, reason: "provider_cost_cap_exceeded", warning: null };
  }

  // Unreachable for valid finite estimates, kept fail-closed for future policy
  // changes that add another activation constraint.
  return { ...activationBase, allowed: false, reason: "payg_not_active", warning: null };
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
  if (reason === "provider_cost_cap_exceeded") {
    return `The free activation provider-cost cap ($${FREE_MANAGED_PROVIDER_COST_CAP_USD.toFixed(2)} lifetime) has been reached. Add a payment method to continue at provider cost + ${Math.round(PAYG_MARGIN_RATE * 100)}%.`;
  }
  if (reason === "unpriced_managed_call") {
    return "This managed action does not yet have a billing-grade cost adapter and is unavailable for customer traffic.";
  }
  if (reason === "payg_cost_adapter_missing") {
    return "This managed action does not yet have an exact provider-cost adapter, so PAYG is blocked rather than estimated.";
  }
  return `The free managed allowance is ${FREE_MANAGED_CALLS_LIFETIME} lifetime calls. Add a payment method to continue at provider cost + ${Math.round(PAYG_MARGIN_RATE * 100)}%.`;
}
