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

export default crons;
