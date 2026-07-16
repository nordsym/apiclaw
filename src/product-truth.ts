export const FREE_MANAGED_CALLS_PER_WEEK = 50;

export function nextWeeklyResetUtc(nowMs = Date.now()): string {
  const now = new Date(nowMs);
  const daysUntilMonday = ((8 - now.getUTCDay()) % 7) || 7;
  const nextMonday = new Date(now);
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
  nextMonday.setUTCHours(0, 0, 0, 0);
  return nextMonday.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}
