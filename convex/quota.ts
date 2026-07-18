export const FREE_WEEKLY_LIMIT = 50;
export const FREE_HOURLY_LIMIT = 10;

export type QuotaWorkspace = {
  tier: string;
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

export function isPaidTier(tier: string): boolean {
  return ["pro", "scale", "usage_based", "partner", "founder", "enterprise"].includes(tier);
}

export function getQuotaState(workspace: QuotaWorkspace, amount = 1, nowMs = Date.now()) {
  const weekStart = getWeekStart(nowMs);
  const hourStart = getHourStart(nowMs);
  const isPaid = isPaidTier(workspace.tier);

  let weeklyCount = workspace.weeklyUsageCount || 0;
  let hourlyCount = workspace.hourlyUsageCount || 0;

  if (!workspace.lastWeeklyResetAt || workspace.lastWeeklyResetAt < weekStart) {
    weeklyCount = 0;
  }

  if (!workspace.lastHourlyResetAt || workspace.lastHourlyResetAt < hourStart) {
    hourlyCount = 0;
  }

  const meteredFreeTier = !isPaid;
  const weeklyRemaining = isPaid ? -1 : Math.max(0, FREE_WEEKLY_LIMIT - weeklyCount);
  const hourlyRemaining = isPaid ? -1 : Math.max(0, FREE_HOURLY_LIMIT - hourlyCount);

  if (meteredFreeTier && hourlyCount + amount > FREE_HOURLY_LIMIT) {
    return {
      allowed: false,
      reason: "hourly_quota_exceeded",
      message: `Hourly rate limit exceeded (${FREE_HOURLY_LIMIT}/hour). Keep going at API cost + 15% with pay-as-you-go: https://apiclaw.cloud/upgrade`,
      weeklyCount,
      weeklyLimit: FREE_WEEKLY_LIMIT,
      weeklyRemaining,
      hourlyCount,
      hourlyLimit: FREE_HOURLY_LIMIT,
      hourlyRemaining,
      upgradeUrl: "https://apiclaw.cloud/upgrade",
    };
  }

  if (meteredFreeTier && weeklyCount + amount > FREE_WEEKLY_LIMIT) {
    return {
      allowed: false,
      reason: "weekly_quota_exceeded",
      message: `Weekly limit exceeded (${FREE_WEEKLY_LIMIT}/week). Keep going at API cost + 15% with pay-as-you-go: https://apiclaw.cloud/upgrade`,
      weeklyCount,
      weeklyLimit: FREE_WEEKLY_LIMIT,
      weeklyRemaining,
      hourlyCount,
      hourlyLimit: FREE_HOURLY_LIMIT,
      hourlyRemaining,
      upgradeUrl: "https://apiclaw.cloud/upgrade",
    };
  }

  return {
    allowed: true,
    reason: null,
    message: null,
    weeklyCount,
    weeklyLimit: isPaid ? -1 : FREE_WEEKLY_LIMIT,
    weeklyRemaining,
    hourlyCount,
    hourlyLimit: isPaid ? -1 : FREE_HOURLY_LIMIT,
    hourlyRemaining,
    upgradeUrl: "https://apiclaw.cloud/upgrade",
  };
}
