/**
 * APIClaw Funnel — canonical conversion truth
 *
 * Canon events (ordered):
 *   install            — package installed (postinstall hook, once per fingerprint)
 *   first_run          — MCP server first successful startup
 *   register_owner     — user called register_owner (OTP sent)
 *   verify_code        — user verified OTP, workspace active
 *   first_call_api_success — workspace's first successful call_api (non-discover)
 *
 * Classification (source):
 *   human    — real user, reasonable UA, interactive MCP client
 *   ci       — CI/CD runner (CI env var family, GITHUB_ACTIONS, headless UAs)
 *   bot      — scanner/crawler (User-Agent matches crawler list)
 *   internal — NordSym test traffic (fingerprint prefix, allowlisted emails)
 *
 * Truth metrics are built from (event=verify_code AND source=human) and
 * (event=first_call_api_success AND source=human). Vanity = install count.
 */
import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const FUNNEL_EVENTS = [
  "install",
  "first_run",
  // Agent-native auth (A-22, canonical from v2.8). Primary activation event.
  "cli_browser_callback_success",
  // Legacy email magic-link path — kept for back-compat reporting.
  "register_owner",
  "verify_code",
  "first_call_api_success",
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

  const ua = (input.userAgent || "").toLowerCase();
  if (ua) {
    for (const m of BOT_UA_MARKERS) {
      if (ua.includes(m)) return "bot";
    }
  }

  return "human";
}

// Record a funnel event. Idempotent per (workspaceId|fingerprint, event) for
// first-time events (install, first_run, first_call_api_success) via
// dedupeKey. register_owner and verify_code can recur legitimately.
export const recordEvent = mutation({
  args: {
    event: v.string(), // validated against FUNNEL_EVENTS below
    classification: v.string(),
    workspaceId: v.optional(v.id("workspaces")),
    fingerprint: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
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
    const allowedClass: Classification[] = ["human", "ci", "bot", "internal"];
    if (!allowedClass.includes(args.classification as Classification)) {
      return { success: false, error: `unknown_classification:${args.classification}` };
    }

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
      classification: args.classification,
      workspaceId: args.workspaceId,
      fingerprint: args.fingerprint,
      sessionToken: args.sessionToken,
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
    if (args.dedupeKey) {
      const existing = await ctx.db
        .query("funnelEvents")
        .withIndex("by_dedupeKey", (q) => q.eq("dedupeKey", args.dedupeKey!))
        .first();
      if (existing) return existing._id;
    }
    return await ctx.db.insert("funnelEvents", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Roll up the canonical funnel for a time window. Default: last 7d, human only.
export const getFunnel = query({
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

    const filtered = events.filter((e) => includes.includes(e.classification));

    const countsByEvent: Record<string, number> = {};
    const uniqByEvent: Record<string, Set<string>> = {};
    for (const e of FUNNEL_EVENTS) {
      countsByEvent[e] = 0;
      uniqByEvent[e] = new Set<string>();
    }

    for (const e of filtered) {
      countsByEvent[e.event] = (countsByEvent[e.event] || 0) + 1;
      const k = (e.workspaceId as string | undefined) || e.fingerprint || e._id;
      uniqByEvent[e.event].add(k);
    }

    // Classification breakdown across all events in window.
    const byClass: Record<string, number> = { human: 0, ci: 0, bot: 0, internal: 0 };
    for (const e of events) {
      byClass[e.classification] = (byClass[e.classification] || 0) + 1;
    }

    const funnel = FUNNEL_EVENTS.map((name) => ({
      event: name,
      count: countsByEvent[name],
      unique: uniqByEvent[name].size,
    }));

    // Conversion ratios (unique-based).
    const get = (n: string) => uniqByEvent[n]?.size || 0;
    const ratios = {
      install_to_first_run: safeRatio(get("first_run"), get("install")),
      first_run_to_register: safeRatio(get("register_owner"), get("first_run")),
      register_to_verify: safeRatio(get("verify_code"), get("register_owner")),
      verify_to_first_call: safeRatio(get("first_call_api_success"), get("verify_code")),
      install_to_verify: safeRatio(get("verify_code"), get("install")),
      install_to_first_call: safeRatio(get("first_call_api_success"), get("install")),
    };

    return {
      windowHours: hoursBack,
      includeClassifications: includes,
      totalEvents: filtered.length,
      funnel,
      ratios,
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
export const getScorecard = query({
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

    const window = events.filter((e) => e.timestamp >= since && e.classification === cls);
    const prior = args.compare
      ? events.filter(
          (e) =>
            e.timestamp >= priorSince &&
            e.timestamp < since &&
            e.classification === cls
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

function computeMetrics(events: { event: string; workspaceId?: any; fingerprint?: any; _id: any }[]): FunnelBucket {
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
  // Activated owners = union of (verify_code) and (cli_browser_callback_success).
  // The first is the legacy OTP flow; the second is the A-22 agent-native
  // browser-loopback flow (canonical since 2026-05-18). Scorecard ratios
  // need to count both to reflect reality.
  const activatedSet = new Set<string>([
    ...(uniq.verify_code ?? new Set<string>()),
    ...(uniq.cli_browser_callback_success ?? new Set<string>()),
  ]);
  const activatedOwners = activatedSet.size;
  return {
    counts,
    unique: {
      install: u("install"),
      first_run: u("first_run"),
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

// Diagnostics-only query — reasons for drop-off and errors.
export const getDiagnostics = query({
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
      (e) => e.classification === cls && DIAGNOSTIC_EVENTS.includes(e.event as DiagnosticEvent)
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
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 100 }) => {
    return await ctx.db.query("funnelEvents").order("desc").take(limit);
  },
});
