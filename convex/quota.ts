import { FREE_MANAGED_CALLS_LIFETIME, PAYG_MARGIN_RATE } from "../src/product-truth";
import {
  evaluateManagedUsage,
  hasActiveContractEntitlement,
  hasActivePaygEntitlement,
  isInternalTier,
  type ManagedUsageWorkspace,
} from "./managedUsagePolicy";

// Compatibility exports for older clients. They now describe the lifetime
// allowance and must not be used to schedule a reset.
export const FREE_LIFETIME_LIMIT = FREE_MANAGED_CALLS_LIFETIME;
export const FREE_WEEKLY_LIMIT = FREE_MANAGED_CALLS_LIFETIME;
export const FREE_HOURLY_LIMIT = 10;

export type QuotaWorkspace = ManagedUsageWorkspace & {
  weeklyUsageCount?: number;
  hourlyUsageCount?: number;
  lastWeeklyResetAt?: number;
  lastHourlyResetAt?: number;
};

export function getWeekStart(nowMs = Date.now()): number {
  const now = new Date(nowMs);
  const dayOfWeek = now.getUTCDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.getTime();
}

export function getHourStart(nowMs = Date.now()): number {
  const now = new Date(nowMs);
  now.setUTCMinutes(0, 0, 0);
  return now.getTime();
}

export function isPaidTier(workspaceOrTier: QuotaWorkspace | string): boolean {
  if (typeof workspaceOrTier === "string") {
    return isInternalTier(workspaceOrTier);
  }
  return isInternalTier(workspaceOrTier.tier) ||
    hasActivePaygEntitlement(workspaceOrTier) ||
    hasActiveContractEntitlement(workspaceOrTier);
}

export function getQuotaState(workspace: QuotaWorkspace, amount = 1, _nowMs = Date.now()) {
  const decision = evaluateManagedUsage(workspace, {
    amount,
    estimatedProviderCostUsd: 0,
    billingGradeCost: true,
  });
  const isPaid = decision.billingClass !== "activation";

  return {
    allowed: decision.allowed,
    reason: decision.reason,
    message: decision.reason
      ? decision.reason === "provider_cost_cap_exceeded"
        ? "Free activation provider-cost cap reached. Add a payment method to continue."
        : `Lifetime managed-call limit reached (${FREE_MANAGED_CALLS_LIFETIME}). Add a payment method to continue at provider cost + ${Math.round(PAYG_MARGIN_RATE * 100)}%.`
      : null,
    billingClass: decision.billingClass,
    trafficClass: decision.trafficClass,
    lifetimeCount: decision.activationManagedCallCount,
    lifetimeLimit: isPaid ? -1 : FREE_MANAGED_CALLS_LIFETIME,
    lifetimeRemaining: decision.managedUsageRemaining,
    providerCostUsd: decision.activationProviderCostUsd,
    providerCostCapUsd: decision.activationProviderCostCapUsd,
    providerCostRemainingUsd: decision.activationProviderCostRemainingUsd,
    // Deprecated response aliases retained so older CLI/MCP builds degrade
    // safely while all current UI uses the lifetime fields above.
    weeklyCount: decision.activationManagedCallCount,
    weeklyLimit: isPaid ? -1 : FREE_MANAGED_CALLS_LIFETIME,
    weeklyRemaining: decision.managedUsageRemaining,
    hourlyCount: workspace.hourlyUsageCount ?? 0,
    hourlyLimit: isPaid ? -1 : FREE_HOURLY_LIMIT,
    hourlyRemaining: isPaid ? -1 : Math.max(0, FREE_HOURLY_LIMIT - (workspace.hourlyUsageCount ?? 0)),
    upgradeUrl: "https://apiclaw.cloud/upgrade",
  };
}
