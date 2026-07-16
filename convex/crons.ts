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

// MCP OAuth garbage collection — daily at 04:15 UTC. Drops expired auth
// codes and revoked/expired access+refresh tokens older than 30 days.
crons.daily(
  "mcp-oauth-sweep",
  { hourUTC: 4, minuteUTC: 15 },
  internal.mcpOAuth.sweepExpired
);

// Model catalog refresh — every 6h. Pulls /models from each managed provider,
// upserts to modelCatalog table, marks stale entries deprecated. /v1/models reads from this table.
crons.interval(
  "model-catalog-refresh",
  { hours: 6 },
  internal.modelCatalog.refresh,
  {}
);

// Provider health aggregate — every 1h. Rolls 30d of outbound apiLogs into
// per-provider success-rate + p50 latency. Discovery reads this to down-rank
// providers whose recent reliability has degraded.
crons.interval(
  "provider-health-aggregate",
  { hours: 1 },
  internal.providerHealth.aggregate,
  {}
);

// Catalog sweep — every 30min. GET-only reachability probe over a rotating
// 100-provider batch of the Open (keyless, free) tier of providerAPIs, least-
// recently-checked first. Feeds the existing circuit-breaker fields
// (healthStatus/consecutiveFailures/circuitOpenUntil) so cold open-catalog
// providers get a health signal without waiting for real user traffic to
// hit a dead endpoint. Never touches Managed providers (they cost money or
// have side effects) — passive providerHealth.aggregate covers those from
// real usage instead.
crons.interval(
  "catalog-sweep",
  { minutes: 30 },
  internal.catalogSweep.sweep,
  {}
);

// Hot-path lastActiveAt refresh — every 5min. Rolls workspaces.lastActiveAt
// and subagents.lastActiveAt forward from apiLogs.createdAt. Replaces the
// synchronous patches in createProxyLog that were causing 88 OCC retries
// per 9h window against the workspaces table (Convex Insights 2026-05-27).
crons.interval(
  "hot-path-last-active-refresh",
  { minutes: 5 },
  internal.hotPathRefresh.refreshLastActiveFromLogs,
  {}
);

// A-13 — Weekly scorecard email. Mondays 08:00 UTC (10:00 CEST summer /
// 09:00 CEST winter). Reads funnel:getScorecard for the last 168h with
// WoW comparison and mails the rendered table to gustav@nordsym.com.
crons.weekly(
  "weekly-scorecard-email",
  { dayOfWeek: "monday", hourUTC: 8, minuteUTC: 0 },
  internal.scorecardEmail.sendWeeklyScorecard,
);

// A-15 - Post-auth welcome. Every 10 min, scans for new canonical
// workspace_authenticated events and sends one activation-aware welcome.
// The successful send is recorded in the shared nurture ledger so daily
// lifecycle spacing, frequency caps, and opt-out rules remain authoritative.
crons.interval(
  "post-verify-nudge",
  { minutes: 10 },
  internal.postVerifyNudge.sendPostVerifyNudges,
  {},
);

export default crons;
