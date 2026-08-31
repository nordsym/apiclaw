/**
 * APIClaw Funnel — canonical conversion truth
 *
 * Canon events (ordered):
 *   install            — package installed (postinstall hook, once per fingerprint)
 *   first_run          — MCP server first successful startup
 *   workspace_authenticated — workspace completed any supported auth path
 *   register_owner     — user called register_owner (OTP sent)
 *   verify_code        — user verified OTP, workspace active (legacy)
 *   first_call_api_success — workspace's first successful call_api (non-discover)
 *   workspace_reactivated — existing workspace returned and made a successful call
 *
 * Classification (source):
 *   human    — real user, reasonable UA, interactive MCP client
 *   ci       — CI/CD runner (CI env var family, GITHUB_ACTIONS, :runner fingerprints)
 *   bot      — scanner/crawler (UA list, scan-/detonation-server-/instance: fingerprints)
 *   internal — NordSym test traffic (fingerprint prefix, allowlisted emails)
 *
 * Truth metrics are built from (event=workspace_authenticated AND source=human) and
 * (event=first_call_api_success AND source=human). Vanity = install count.
 */
import { mutation, internalQuery, internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { findUsableAgentSession } from "./sessionSecurity";

export const FUNNEL_EVENTS = [
  "install",
  "first_run",
  // One semantic, server-side auth event across Clerk web, CLI browser, and
  // legacy OTP/magic-link auth. Deduped exactly once per workspace.
  "workspace_authenticated",
  // Agent-native auth (A-22, canonical from v2.8). Primary activation event.
  // Kept for historical compatibility; workspace_authenticated is canonical.
  "cli_browser_callback_success",
  // Legacy email magic-link path — kept for back-compat reporting.
  "register_owner",
  "verify_code",
  "first_call_api_success",
  "workspace_reactivated",
] as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

// Diagnostic events — reasoning, errors, retries, drop-off causes.
// Stored in the same table but excluded from the canonical funnel rollup.
export const DIAGNOSTIC_EVENTS = [
  "register_owner_failed", // props: { reason: "invalid_email" | "email_send_failed" }
  "verify_code_failed", // props: { reason: "invalid" | "expired" | "attempts_exceeded" }
  // CLI browser-loopback failures (A-22). Track drop-off causes for the
  // canonical auth path so we can debug regressions in conversion.
  "cli_browser_callback_failed", // props: { reason: "port_collision" | "state_mismatch" | "pkce_mismatch" | "timeout" | "browser_open_failed" | "code_not_found" | "expired" }
  "call_api_blocked", // props: { reason: "no_session" | "pending_verification" | "quota_exceeded" | "not_verified" }
  "call_api_error", // props: { provider, action, errorCode }
  "quota_hit", // props: { tier, limit }
  "gateway_retry", // props: { attempt, reason }
] as const;

export type DiagnosticEvent = (typeof DIAGNOSTIC_EVENTS)[number];
export type AnyEvent = FunnelEvent | DiagnosticEvent;

const ALL_EVENTS = [...FUNNEL_EVENTS, ...DIAGNOSTIC_EVENTS] as readonly string[];

export type Classification = "human" | "ci" | "bot" | "internal";

export type WorkspaceAuthMethod =
  | "clerk_web"
  | "cli_browser"
  | "otp"
  | "legacy_magic_link";

// Keep these predicates pure and exported so tests can hit them directly.
const CI_ENV_KEYS = [
  "CI",
  "GITHUB_ACTIONS",
  "GITLAB_CI",
  "CIRCLECI",
  "BUILDKITE",
  "JENKINS_URL",
  "TEAMCITY_VERSION",
  "TRAVIS",
  "BITBUCKET_BUILD_NUMBER",
];

// UA substrings (lower-cased) that flag known bots/scanners.
const BOT_UA_MARKERS = [
  "bot",
  "crawl",
  "spider",
  "scanner",
  "curl/",
  "wget/",
  "httpclient",
  "python-requests",
  "go-http-client",
  "okhttp",
  "java/",
  "httrack",
  "headlesschrome",
  "phantomjs",
];

// Emails that are considered internal NordSym traffic.
const INTERNAL_EMAIL_DOMAINS = ["nordsym.com", "apiclaw.cloud"];
const INTERNAL_EMAIL_EXACT = ["gustav@nordsym.com", "gustavnordsync@gmail.com"];

// Fingerprint prefix(es) used by internal test machines.
const INTERNAL_FINGERPRINT_PREFIXES: string[] = [];

/**
 * hostname:username from getMachineFingerprint. Username is after the last
 * colon so IPv6-ish hostnames still parse.
 */
export function splitFingerprint(fingerprint: string): {
  hostname: string;
  username: string;
} {
  const i = fingerprint.lastIndexOf(":");
  if (i === -1) return { hostname: fingerprint, username: "" };
  return { hostname: fingerprint.slice(0, i), username: fingerprint.slice(i + 1) };
}

/**
 * Classify scanner / GitHub Actions fingerprints that have no CI=true and no
 * bot UA. Live 7d rows labeled "human" that are not people:
 *   scan-<hex>:scan
 *   detonation-server-*:nonroot
 *   <hex>:runner
 *   instance:<id>
 * DESKTOP-*:devuser is a real machine — do not mark bot.
 */
export function classifyFingerprint(
  fingerprint?: string | null,
): Classification | null {
  const raw = (fingerprint || "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const { hostname, username } = splitFingerprint(raw);
  const host = hostname.toLowerCase();
  const user = username.toLowerCase();

  if (lower.startsWith("scan-") || host === "scan" || user === "scan") {
    return "bot";
  }
  if (host.startsWith("detonation-server-")) return "bot";
  if (host === "instance") return "bot";

  if (user === "runner" || lower.endsWith(":runner")) return "ci";
  if (
    host === "runner" ||
    host.startsWith("runner-") ||
    host.startsWith("github-runner") ||
    host.startsWith("actions-runner") ||
    host.startsWith("github-actions")
  ) {
    return "ci";
  }

  return null;
}

export function classifySource(input: {
  userAgent?: string | null;
  envFlags?: Record<string, string | undefined>;
  email?: string | null;
  fingerprint?: string | null;
  forcedInternal?: boolean;
}): Classification {
  if (input.forcedInternal) return "internal";

  const email = (input.email || "").toLowerCase().trim();
  if (email) {
    if (INTERNAL_EMAIL_EXACT.includes(email)) return "internal";
    const domain = email.split("@")[1] || "";
    if (INTERNAL_EMAIL_DOMAINS.includes(domain)) return "internal";
  }

  const fp = input.fingerprint || "";
  if (fp && INTERNAL_FINGERPRINT_PREFIXES.some((p) => fp.startsWith(p))) {
    return "internal";
  }

  const env = input.envFlags || {};
  for (const key of CI_ENV_KEYS) {
    const val = env[key];
    if (val && val !== "false" && val !== "0") return "ci";
  }

  const fromFingerprint = classifyFingerprint(fp);
  if (fromFingerprint) return fromFingerprint;

  const ua = (input.userAgent || "").toLowerCase();
  if (ua) {
    for (const m of BOT_UA_MARKERS) {
      if (ua.includes(m)) return "bot";
    }
  }

  return "human";
}

/**
 * Recompute classification so a stale stored "human" on a scanner fingerprint
 * cannot inflate scorecard / getFunnel. Stored ci/bot/internal is kept when
 * the fingerprint has no scanner signal (e.g. 100.64.x.x:root already ci).
 */
export function resolvedClassification(event: {
  classification?: string | null;
  fingerprint?: string | null;
  userAgent?: string | null;
  email?: string | null;
}): Classification {
  const recomputed = classifySource({
    fingerprint: event.fingerprint,
    userAgent: event.userAgent,
    email: event.email,
  });
  if (recomputed !== "human") return recomputed;
  const stored = event.classification;
  if (stored === "ci" || stored === "bot" || stored === "internal") return stored;
  return "human";
}

/**
 * Record the canonical auth event once per workspace, regardless of which
 * auth door was used or how often the user signs in again.
 *
 * This helper runs in the caller's mutation transaction. Callers should catch
 * telemetry errors so auth itself remains available if event recording fails.
 */
export async function recordWorkspaceAuthenticated(
  ctx: Pick<MutationCtx, "db">,
  args: {
    workspaceId: Id<"workspaces">;
    email: string;
    authMethod: WorkspaceAuthMethod;
    fingerprint?: string;
    isNew?: boolean;
    tier?: string;
  }
) {
  const dedupeKey = `workspace_authenticated:${args.workspaceId}`;
  const existing = await ctx.db
    .query("funnelEvents")
    .withIndex("by_dedupeKey", (q) => q.eq("dedupeKey", dedupeKey))
    .first();

  if (existing) {
    return { id: existing._id, deduped: true };
  }

  const id = await ctx.db.insert("funnelEvents", {
    event: "workspace_authenticated",
    classification: classifySource({
      email: args.email,
      fingerprint: args.fingerprint,
    }),
    workspaceId: args.workspaceId,
    fingerprint: args.fingerprint,
    email: args.email,
    dedupeKey,
    props: {
      auth_method: args.authMethod,
      is_new: args.isNew ?? false,
      tier: args.tier,
    },
    timestamp: Date.now(),
  });

  return { id, deduped: false };
}

// Record a funnel event. Idempotent per (workspaceId|fingerprint, event) for
// first-time events (install, first_run, workspace_authenticated,
// first_call_api_success) via
// dedupeKey. register_owner and verify_code can recur legitimately.
export const recordEvent = mutation({
  args: {
    event: v.string(), // validated against FUNNEL_EVENTS below
    classification: v.string(),
    workspaceId: v.optional(v.id("workspaces")),
    fingerprint: v.optional(v.string()),
    email: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    mcpClient: v.optional(v.string()),
    platform: v.optional(v.string()),
    version: v.optional(v.string()),
    dedupeKey: v.optional(v.string()), // if set, no-op when duplicate exists
    props: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    if (!ALL_EVENTS.includes(args.event)) {
      return { success: false, error: `unknown_event:${args.event}` };
    }
    if (
      args.event === "workspace_authenticated" ||
      args.event === "first_call_api_success" ||
      args.event === "workspace_reactivated"
    ) {
      return { success: false, error: `server_managed_event:${args.event}` };
    }
    const allowedClass: Classification[] = ["human", "ci", "bot", "internal"];
    if (!allowedClass.includes(args.classification as Classification)) {
      return { success: false, error: `unknown_classification:${args.classification}` };
    }
    const classification = resolvedClassification({
      classification: args.classification,
      fingerprint: args.fingerprint,
      userAgent: args.userAgent,
      email: args.email,
    });

    if (args.dedupeKey) {
      const existing = await ctx.db
        .query("funnelEvents")
        .withIndex("by_dedupeKey", (q) => q.eq("dedupeKey", args.dedupeKey!))
        .first();
      if (existing) {
        return { success: true, deduped: true, id: existing._id };
      }
    }

    const id = await ctx.db.insert("funnelEvents", {
      event: args.event,
      classification,
      workspaceId: args.workspaceId,
      fingerprint: args.fingerprint,
      email: args.email,
      userAgent: args.userAgent,
      mcpClient: args.mcpClient,
      platform: args.platform,
      version: args.version,
      dedupeKey: args.dedupeKey,
      props: args.props,
      timestamp: Date.now(),
    });

    return { success: true, deduped: false, id };
  },
});

// Internal variant callable from other Convex functions (e.g. verifyOTP).
export const recordEventInternal = internalMutation({
  args: {
    event: v.string(),
    classification: v.string(),
    workspaceId: v.optional(v.id("workspaces")),
    fingerprint: v.optional(v.string()),
    email: v.optional(v.string()),
    dedupeKey: v.optional(v.string()),
    props: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    if (!ALL_EVENTS.includes(args.event)) return null;
    const dedupeKey = args.event === "workspace_authenticated" && args.workspaceId
      ? `workspace_authenticated:${args.workspaceId}`
      : args.dedupeKey;
    if (dedupeKey) {
      const existing = await ctx.db
        .query("funnelEvents")
        .withIndex("by_dedupeKey", (q) => q.eq("dedupeKey", dedupeKey))
        .first();
      if (existing) return existing._id;
    }
    return await ctx.db.insert("funnelEvents", {
      ...args,
      classification: resolvedClassification({
        classification: args.classification,
        fingerprint: args.fingerprint,
        email: args.email,
      }),
      dedupeKey,
      timestamp: Date.now(),
    });
  },
});

/**
 * One-time migration for workspaces authenticated before
 * workspace_authenticated existed. It only considers active workspaces that
 * already have an agent session, uses the earliest session as event time, and
 * never overwrites or duplicates an existing canonical event.
 *
 * Run with dryRun=true first. This mutation is internal and is not scheduled or
 * invoked automatically.
 */
export const backfillWorkspaceAuthenticated = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, { dryRun = true }) => {
    const workspaces = await ctx.db.query("workspaces").collect();
    let eligible = 0;
    let inserted = 0;
    let skippedAlreadyAuthenticated = 0;
    let skippedInactive = 0;
    let skippedNoSession = 0;

    for (const workspace of workspaces) {
      if (workspace.status !== "active") {
        skippedInactive++;
        continue;
      }

      const existingEvents = await ctx.db
        .query("funnelEvents")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id))
        .collect();
      if (existingEvents.some((event) => event.event === "workspace_authenticated")) {
        skippedAlreadyAuthenticated++;
        continue;
      }

      const sessions = await ctx.db
        .query("agentSessions")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id))
        .collect();
      if (sessions.length === 0) {
        skippedNoSession++;
        continue;
      }

      const earliestSession = sessions.reduce((earliest, session) =>
        session.createdAt < earliest.createdAt ? session : earliest
      );
      eligible++;

      if (!dryRun) {
        await ctx.db.insert("funnelEvents", {
          event: "workspace_authenticated",
          classification: classifySource({
            email: workspace.email,
            fingerprint: earliestSession.fingerprint,
          }),
          workspaceId: workspace._id,
          fingerprint: earliestSession.fingerprint,
          email: workspace.email,
          dedupeKey: `workspace_authenticated:${workspace._id}`,
          props: {
            auth_method: "legacy_backfill",
            backfilled: true,
            is_new: false,
            tier: workspace.tier,
          },
          timestamp: earliestSession.createdAt,
        });
        inserted++;
      }
    }

    return {
      dryRun,
      scanned: workspaces.length,
      eligible,
      inserted,
      skippedAlreadyAuthenticated,
      skippedInactive,
      skippedNoSession,
    };
  },
});

// Roll up the canonical funnel for a time window. Default: last 7d, human only.
export const getFunnel = internalQuery({
  args: {
    hoursBack: v.optional(v.number()),
    includeClassifications: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const hoursBack = args.hoursBack ?? 24 * 7;
    const since = Date.now() - hoursBack * 3600000;
    const includes = args.includeClassifications ?? ["human"];

    const events = await ctx.db
      .query("funnelEvents")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", since))
      .collect();

    const filtered = events.filter((e) =>
      includes.includes(resolvedClassification(e)),
    );

    const rollup = rollupCanonicalFunnel(filtered);

    // Classification breakdown across all events in window.
    const byClass: Record<string, number> = { human: 0, ci: 0, bot: 0, internal: 0 };
    for (const e of events) {
      const cls = resolvedClassification(e);
      byClass[cls] = (byClass[cls] || 0) + 1;
    }

    return {
      windowHours: hoursBack,
      includeClassifications: includes,
      totalEvents: rollup.totalCanonicalEvents,
      diagnosticEvents: rollup.diagnosticEvents,
      funnel: rollup.funnel,
      ratios: rollup.ratios,
      classificationBreakdown: byClass,
    };
  },
});

function safeRatio(num: number, denom: number): number {
  if (!denom) return 0;
  return Math.round((num / denom) * 10000) / 10000;
}

// Weekly scorecard — the canonical KPI snapshot.
// Returns truth metrics (human-only by default) with optional comparison
// against the previous period of equal length.
export const getScorecard = internalQuery({
  args: {
    hoursBack: v.optional(v.number()),
    classification: v.optional(v.string()), // "human" by default
    compare: v.optional(v.boolean()), // compare to prior equal window
  },
  handler: async (ctx, args) => {
    const windowH = args.hoursBack ?? 24 * 7;
    const cls = args.classification ?? "human";
    const now = Date.now();
    const since = now - windowH * 3600000;
    const priorSince = now - windowH * 2 * 3600000;

    const events = await ctx.db
      .query("funnelEvents")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", args.compare ? priorSince : since))
      .collect();

    const window = events.filter(
      (e) => e.timestamp >= since && resolvedClassification(e) === cls,
    );
    const prior = args.compare
      ? events.filter(
          (e) =>
            e.timestamp >= priorSince &&
            e.timestamp < since &&
            resolvedClassification(e) === cls
        )
      : null;

    const metrics = computeMetrics(window);
    const priorMetrics = prior ? computeMetrics(prior) : null;

    // Diagnostic breakdown for the current window.
    const diagnostics: Record<string, Record<string, number>> = {};
    for (const e of window) {
      if (!DIAGNOSTIC_EVENTS.includes(e.event as DiagnosticEvent)) continue;
      const reason = ((e.props as any)?.reason ?? "unknown") as string;
      diagnostics[e.event] = diagnostics[e.event] || {};
      diagnostics[e.event][reason] = (diagnostics[e.event][reason] || 0) + 1;
    }

    return {
      windowHours: windowH,
      classification: cls,
      generatedAt: now,
      truth: {
        installs: metrics.unique.install,
        authenticatedWorkspaces: metrics.unique.activated_owners,
        // Compatibility alias for current admin/scorecard consumers.
        activatedOwners: metrics.unique.activated_owners,
        activatedUsers: metrics.unique.first_call_api_success,
      },
      vanity: {
        installEvents: metrics.counts.install,
      },
      ratios: metrics.ratios,
      diagnostics,
      previous: priorMetrics
          ? {
            installs: priorMetrics.unique.install,
            authenticatedWorkspaces: priorMetrics.unique.activated_owners,
            activatedOwners: priorMetrics.unique.activated_owners,
            activatedUsers: priorMetrics.unique.first_call_api_success,
            ratios: priorMetrics.ratios,
          }
        : null,
    };
  },
});

type FunnelBucket = {
  counts: Record<string, number>;
  unique: Record<string, number>;
  ratios: Record<string, number>;
};

type FunnelRollupInput = {
  event: string;
  workspaceId?: unknown;
  fingerprint?: unknown;
  _id: unknown;
};

export function rollupCanonicalFunnel(events: FunnelRollupInput[]) {
  const countsByEvent: Record<string, number> = {};
  const uniqByEvent: Record<string, Set<string>> = {};
  for (const e of FUNNEL_EVENTS) {
    countsByEvent[e] = 0;
    uniqByEvent[e] = new Set<string>();
  }

  let diagnosticEvents = 0;
  for (const e of events) {
    if (!FUNNEL_EVENTS.includes(e.event as FunnelEvent)) {
      diagnosticEvents++;
      continue;
    }

    countsByEvent[e.event]++;
    const k = String(e.workspaceId || e.fingerprint || e._id);
    uniqByEvent[e.event].add(k);
  }

  const get = (n: string) => uniqByEvent[n]?.size || 0;
  const activatedOwners = authenticatedWorkspaceKeys(uniqByEvent).size;

  return {
    totalCanonicalEvents: FUNNEL_EVENTS.reduce((sum, event) => sum + countsByEvent[event], 0),
    diagnosticEvents,
    authenticatedWorkspaces: activatedOwners,
    funnel: FUNNEL_EVENTS.map((name) => ({
      event: name,
      count: countsByEvent[name],
      unique: uniqByEvent[name].size,
    })),
    ratios: {
      install_to_first_run: safeRatio(get("first_run"), get("install")),
      first_run_to_register: safeRatio(get("register_owner"), get("first_run")),
      register_to_verify: safeRatio(activatedOwners, get("register_owner")),
      verify_to_first_call: safeRatio(get("first_call_api_success"), activatedOwners),
      install_to_verify: safeRatio(activatedOwners, get("install")),
      install_to_first_call: safeRatio(get("first_call_api_success"), get("install")),
    },
  };
}

export function computeMetrics(events: { event: string; workspaceId?: any; fingerprint?: any; _id: any }[]): FunnelBucket {
  const counts: Record<string, number> = {};
  const uniq: Record<string, Set<string>> = {};
  for (const e of FUNNEL_EVENTS) {
    counts[e] = 0;
    uniq[e] = new Set<string>();
  }
  for (const e of events) {
    if (!FUNNEL_EVENTS.includes(e.event as FunnelEvent)) continue;
    counts[e.event]++;
    const k = (e.workspaceId as string | undefined) || (e.fingerprint as string | undefined) || String(e._id);
    uniq[e.event].add(k);
  }
  const u = (n: string) => uniq[n]?.size || 0;
  const activatedSet = authenticatedWorkspaceKeys(uniq);
  const activatedOwners = activatedSet.size;
  return {
    counts,
    unique: {
      install: u("install"),
      first_run: u("first_run"),
      workspace_authenticated: u("workspace_authenticated"),
      register_owner: u("register_owner"),
      verify_code: u("verify_code"),
      cli_browser_callback_success: u("cli_browser_callback_success"),
      activated_owners: activatedOwners,
      first_call_api_success: u("first_call_api_success"),
    },
    ratios: {
      install_to_first_run: safeRatio(u("first_run"), u("install")),
      first_run_to_register: safeRatio(u("register_owner"), u("first_run")),
      register_to_verify: safeRatio(activatedOwners, u("register_owner")),
      verify_to_first_call: safeRatio(u("first_call_api_success"), activatedOwners),
      install_to_verify: safeRatio(activatedOwners, u("install")),
      install_to_first_call: safeRatio(u("first_call_api_success"), u("install")),
    },
  };
}

/**
 * workspace_authenticated is the primary semantic event. Legacy events are a
 * fallback for workspaces authenticated before it existed. A Set union keeps a
 * workspace that has both canonical and legacy events from being counted twice.
 */
function authenticatedWorkspaceKeys(
  uniqueByEvent: Record<string, Set<string>>
): Set<string> {
  return new Set<string>([
    ...(uniqueByEvent.workspace_authenticated ?? new Set<string>()),
    ...(uniqueByEvent.verify_code ?? new Set<string>()),
    ...(uniqueByEvent.cli_browser_callback_success ?? new Set<string>()),
  ]);
}

// Diagnostics-only query — reasons for drop-off and errors.
export const getDiagnostics = internalQuery({
  args: {
    hoursBack: v.optional(v.number()),
    classification: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const windowH = args.hoursBack ?? 24 * 7;
    const since = Date.now() - windowH * 3600000;
    const cls = args.classification ?? "human";

    const events = await ctx.db
      .query("funnelEvents")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", since))
      .collect();

    const filtered = events.filter(
      (e) =>
        resolvedClassification(e) === cls &&
        DIAGNOSTIC_EVENTS.includes(e.event as DiagnosticEvent)
    );

    const breakdown: Record<string, Record<string, number>> = {};
    for (const e of filtered) {
      breakdown[e.event] = breakdown[e.event] || {};
      const reason = ((e.props as any)?.reason ?? (e.props as any)?.errorCode ?? "unknown") as string;
      breakdown[e.event][reason] = (breakdown[e.event][reason] || 0) + 1;
    }

    return {
      windowHours: windowH,
      classification: cls,
      total: filtered.length,
      byEvent: breakdown,
    };
  },
});

// Quick listing for debugging.
export const getRecent = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 100 }) => {
    return await ctx.db.query("funnelEvents").order("desc").take(limit);
  },
});

/**
 * One-time security migration for legacy funnel rows that stored bearer
 * credentials. Returns counts only and never returns token or customer data.
 * Keep the schema field until this mutation has scrubbed production, then
 * remove the deprecated field in the final schema deployment.
 */
export const scrubStoredSessionTokens = internalMutation({
  args: {
    dryRun: v.boolean(),
    revokeSessions: v.boolean(),
  },
  handler: async (ctx, { dryRun, revokeSessions }) => {
    const events = await ctx.db.query("funnelEvents").collect();
    const exposed = events.filter((event) => Boolean(event.sessionToken));
    let revokedSessions = 0;
    let revokedBrowserChildren = 0;
    let scrubbedRows = 0;

    if (!dryRun) {
      for (const event of exposed) {
        const token = event.sessionToken;
        if (revokeSessions && token) {
          const session = await findUsableAgentSession(ctx.db, token);
          if (session) {
            const children = await ctx.db
              .query("agentSessions")
              .withIndex("by_parentSessionId", (q) => q.eq("parentSessionId", session._id))
              .collect();
            for (const child of children) {
              await ctx.db.delete(child._id);
              revokedBrowserChildren++;
            }
            await ctx.db.delete(session._id);
            revokedSessions++;
          }
        }
        await ctx.db.patch(event._id, { sessionToken: undefined });
        scrubbedRows++;
      }
    }

    return {
      scannedRows: events.length,
      exposedRows: exposed.length,
      revokedSessions,
      revokedBrowserChildren,
      scrubbedRows,
    };
  },
});
