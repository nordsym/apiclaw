import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Daily Usage Reporting to Stripe
 * Runs at 00:05 UTC every day
 * Reports metered usage for all active subscriptions
 */
crons.daily(
  "report-usage-to-stripe",
  { hourUTC: 0, minuteUTC: 5 },
  internal.billing.reportAllUsageToStripe
);

/**
 * Monthly Spend Reset
 * Runs at 00:01 UTC on the 1st of each month
 * Resets monthlySpendCents and budgetAlertSentAt for all workspaces
 */
crons.monthly(
  "reset-monthly-spend",
  { day: 1, hourUTC: 0, minuteUTC: 1 },
  internal.spendAlerts.resetMonthlySpend
);

/**
 * Weekly Usage Report
 * Runs every Monday at 08:00 UTC (10:00 CEST)
 * Sends usage summary email to all workspaces with activity
 */
crons.weekly(
  "weekly-usage-report",
  { dayOfWeek: "monday", hourUTC: 8, minuteUTC: 0 },
  internal.usageReports.sendWeeklyReports
);

/**
 * Monthly Usage Report
 * Runs on the 1st of each month at 09:00 UTC
 * Sends full monthly summary to all workspaces
 */
crons.monthly(
  "monthly-usage-report",
  { day: 1, hourUTC: 9, minuteUTC: 0 },
  internal.usageReports.sendMonthlyReports
);

// Nurture classifier — daily at 06:00 UTC, upserts each workspace's lifecycle stage
crons.daily(
  "nurture-classify",
  { hourUTC: 6, minuteUTC: 0 },
  internal.nurture.classifyAllWorkspaces
);

// Nurture sender — daily at 09:30 UTC (11:30 CEST), caps at 12 emails/day
crons.daily(
  "nurture-send",
  { hourUTC: 9, minuteUTC: 30 },
  internal.nurture.sendDailyNurture,
  { maxSends: 12 }
);

export default crons;
