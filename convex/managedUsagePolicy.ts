import {
  FREE_MANAGED_CALLS_LIFETIME,
  FREE_MANAGED_PROVIDER_COST_CAP_USD,
  FREE_MANAGED_WARNING_AT,
  PAYG_MARGIN_RATE,
} from "../src/product-truth";
import { PAYMENT_REQUIRED_MESSAGE } from "../src/first-call-nudge";

export type ManagedTrafficClass = "customer" | "internal" | "byok";
export type ManagedBillingClass = "activation" | "payg" | "internal" | "contract" | "byok";

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

function hasNonEmptyString(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function isInternalTier(tier: string): boolean {
  return tier === "founder" || tier === "partner";
}

export function hasActivePaygEntitlement(
  workspace: ManagedUsageWorkspace,
  expectedMeter?: { priceId: string; meterId: string; eventName: string },
): boolean {
  const planIsPayg = workspace.billingPlan === "usage_based" || workspace.tier === "usage_based";
  const subscriptionActive = hasNonEmptyString(workspace.stripeCustomerId) &&
    hasNonEmptyString(workspace.stripeSubscriptionId) &&
    ACTIVE_SUBSCRIPTION_STATES.has(workspace.stripeSubscriptionStatus || "");
  const paymentMethodActive = workspace.hasPaymentMethod === true || workspace.hasCardAttached === true;
  const exactMeterReady = typeof workspace.paygMeterReadyAt === "number" &&
    Number.isFinite(workspace.paygMeterReadyAt) &&
    workspace.paygMeterReadyAt > 0 &&
    hasNonEmptyString(workspace.paygMeterPriceId) &&
    hasNonEmptyString(workspace.paygMeterId) &&
    hasNonEmptyString(workspace.paygMeterEventName) &&
    (!expectedMeter || (
      workspace.paygMeterPriceId === expectedMeter.priceId &&
      workspace.paygMeterId === expectedMeter.meterId &&
      workspace.paygMeterEventName === expectedMeter.eventName
    ));
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
  const trafficClass = trafficClassOverride === "byok"
    ? "byok"
    : trafficClassOverride === "internal"
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
  const trafficClass = options.trafficClass === "byok"
    ? "byok"
    : options.trafficClass === "internal"
    ? "internal"
    : "customer";
  // BYOK: the workspace attached its own provider key for this call, so it
  // pays the provider directly and never touches our billing. Evaluated
  // before the card-required gate below — no card, no cost to the user,
  // and unaffected by managedCostHold (that hold is about NordSym-managed
  // spend, not the workspace's own key). Decision date 2026-08-24 (BYOH).
  if (trafficClass === "byok") {
    const base = baseDecision(workspace, "byok", trafficClass);
    return { ...base, allowed: true, reason: null, warning: null };
  }
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

  // A call whose provider cost is provably zero is free forever and does not
  // depend on activation or Stripe. A zero-valued guess does not qualify.
  const isProvenZeroCost = estimatedProviderCostUsd === 0 && options.billingGradeCost === true;
  if (isProvenZeroCost) {
    const base = baseDecision(workspace, "activation", trafficClass);
    return {
      ...base,
      allowed: true,
      reason: null,
      managedUsageLimit: -1,
      managedUsageRemaining: -1,
      warning: null,
    };
  }

  const activationBase = baseDecision(workspace, "activation", trafficClass);
  const activationCallAvailable = activationBase.activationManagedCallCount + amount <=
    FREE_MANAGED_CALLS_LIFETIME;
  const activationCostAvailable = activationBase.activationProviderCostUsd + estimatedProviderCostUsd <=
    FREE_MANAGED_PROVIDER_COST_CAP_USD + Number.EPSILON;

  if (activationCallAvailable && activationCostAvailable) {
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

  // After either activation cap is exhausted, only the complete active Stripe
  // micro-USD entitlement may open PAYG. A stored card boolean is insufficient.
  if (!hasActivePaygEntitlement(workspace)) {
    return { ...activationBase, allowed: false, reason: "payment_required", warning: null };
  }

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
    return PAYMENT_REQUIRED_MESSAGE;
  }
  if (reason === "unpriced_managed_call") {
    return "This managed action does not yet have a billing-grade cost adapter and is unavailable for customer traffic.";
  }
  if (reason === "payg_cost_adapter_missing") {
    return "This managed action does not yet have an exact provider-cost adapter, so it is blocked rather than estimated.";
  }
  return "Free APIs are free forever, no card. Paid APIs bill provider cost plus 15 percent after you add a card.";
}
