import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Report each successful PAYG managed call from the immutable request ledger.
// The reporter claims one ledger row at a time and uses its deterministic
// meter-event identifier for retry safety. Legacy daily usageRecords are never
// submitted by this cron because aggregating them can double bill calls.
crons.interval(
  "report-managed-usage-to-stripe",
  { minutes: 10 },
  internal.managedMetering.reportPendingToStripe,
  {},
);

// Release pre-call reservations that never reached a finalizer because the
// request was abandoned, validation failed, or the action crashed.
crons.interval(
  "release-stale-managed-reservations",
  { minutes: 15 },
  internal.managedUsage.releaseStaleAuthorizations,
  { olderThanMs: 15 * 60 * 1000, limit: 200 },
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

// Daily operator mail. 07:00 UTC = 09:00 Europe/Stockholm summer.
// The old Monday operator mail is off so this is not a double send.
crons.daily(
  "daily-scorecard-email",
  { hourUTC: 7, minuteUTC: 0 },
  internal.scorecardEmail.sendDailyScorecard,
);

// Fallback for Gustav's plaintext founder signup note. The honest send is
// getOrCreateForClerk first mint. This cron covers a temporary Resend miss.
// Success is recorded in the shared nurture ledger so daily spacing and
// the three-email cap stay authoritative.
crons.interval(
  "post-verify-nudge",
  { minutes: 10 },
  internal.postVerifyNudge.sendPostVerifyNudges,
  {},
);

// Activation watchdog - every 15 minutes, reports a new human workspace once
// when it remains without first_call_api_success for at least 60 minutes.
// Backfills, internal/test traffic, partner tiers, and rows older than 48h are
// excluded so deployment cannot produce a retroactive alert storm.
crons.interval(
  "activation-stalled-watchdog",
  { minutes: 15 },
  internal.activationWatchdog.checkForStalledActivations,
  {},
);

export default crons;
