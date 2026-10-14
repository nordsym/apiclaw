import { FREE_MANAGED_CALLS_LIFETIME } from "../src/product-truth";
import {
  evaluateManagedUsage,
  hasActiveContractEntitlement,
  hasActivePaygEntitlement,
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
    return workspaceOrTier === "enterprise" || workspaceOrTier === "pro" || workspaceOrTier === "scale";
  }
  return hasActivePaygEntitlement(workspaceOrTier) ||
    hasActiveContractEntitlement(workspaceOrTier);
}

// This is a display/status shim, not the real gate. Zero-cost open rails remain
// unlimited, while the returned lifetime fields deliberately show the separate
// managed trial so the workspace UI does not hide the 25-call boundary.
export function getQuotaState(
  workspace: QuotaWorkspace,
  amount = 1,
  _nowMs = Date.now(),
  options: { configuredPaygEntitlement?: boolean } = {},
) {
  const decision = evaluateManagedUsage(workspace, {
    amount,
    estimatedProviderCostUsd: 0,
    billingGradeCost: true,
  });
  const isPaid = hasActiveContractEntitlement(workspace) ||
    (options.configuredPaygEntitlement ?? hasActivePaygEntitlement(workspace));
  const lifetimeLimit = isPaid ? -1 : FREE_MANAGED_CALLS_LIFETIME;
  const lifetimeRemaining = isPaid
    ? -1
    : Math.max(0, lifetimeLimit - decision.activationManagedCallCount);

  return {
    allowed: decision.allowed,
    reason: decision.reason,
    message: decision.reason === "managed_cost_hold"
      ? "Managed execution is temporarily paused because realized provider cost did not match the authorized ceiling."
      : null,
    billingClass: decision.billingClass,
    trafficClass: decision.trafficClass,
    lifetimeCount: decision.activationManagedCallCount,
    lifetimeLimit,
    lifetimeRemaining,
    providerCostUsd: decision.activationProviderCostUsd,
    providerCostCapUsd: decision.activationProviderCostCapUsd,
    providerCostRemainingUsd: decision.activationProviderCostRemainingUsd,
    // Deprecated response aliases retained so older CLI/MCP builds degrade
    // safely while all current UI uses the lifetime fields above.
    weeklyCount: decision.activationManagedCallCount,
    weeklyLimit: lifetimeLimit,
    weeklyRemaining: lifetimeRemaining,
    hourlyCount: workspace.hourlyUsageCount ?? 0,
    hourlyLimit: isPaid ? -1 : FREE_HOURLY_LIMIT,
    hourlyRemaining: isPaid ? -1 : Math.max(0, FREE_HOURLY_LIMIT - (workspace.hourlyUsageCount ?? 0)),
    upgradeUrl: "https://apiclaw.cloud/upgrade",
  };
}
