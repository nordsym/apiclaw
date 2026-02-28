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

export default crons;
