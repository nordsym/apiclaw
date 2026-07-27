/**
 * Control Plane — Missions
 *
 * A mission is an orchestration unit. Templates declare the steps; the
 * runtime executes them through APIClaw's existing gateway (so Managed
 * APIs, billing, audit, and rate limits all work the same way they do for
 * a one-shot /v1/call). Same auth layer, same logs.
 *
 * Pricing canon: internal NordSym workspaces (gustav@nordsym.com,
 * molle@nordsym.com, *@nordsym.com) run missions at zero margin. External
 * workspaces pay underlying compute + 15%.
 */
import { v } from "convex/values";
import { findUsableAgentSession } from "./sessionSecurity";
import {
  query,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  estimateManagedProviderCostUsd,
  hasBillingGradeManagedCost,
} from "./managedCostPolicy";
import { normalizeMaxOutputTokens } from "./httpTrust";
import { isCustomerExecutableManagedAction } from "./providerBoundaries";

// ============================================
// MISSION TEMPLATES
// ============================================
//
// TEMPLATE_REGISTRY is the legacy in-process catalogue. Every entry that
// used to live here has been migrated to a data-driven row in the
// missionTemplates table. The registry stays as a typed shell so legacy
// callers compile and so future temporary registry-only templates have a
// place to land if needed.

const TEMPLATE_REGISTRY: Record<
  string,
  {
    title: string;
    description: string;
    paramSchema: Record<string, { type: string; required?: boolean; description: string }>;
  }
> = {};

// Old template slugs continue to work via this alias map. createMission
// rewrites args.template before any lookup, then the mission row stores
// the canonical slug + the resolved v2 templateVersion. New work should
// use the canonical slug directly.
const TEMPLATE_SLUG_ALIASES: Record<string, string> = {
  genprd: "prd-generation",
};

export function isCustomerRunnableMissionTemplate(stepsValue: unknown): boolean {
  if (!Array.isArray(stepsValue)) return false;
  return stepsValue.every((stepValue) => {
    const step = stepValue as {
      kind?: unknown;
      config?: Record<string, unknown>;
    };
    const config = step.config ?? {};

    if (step.kind === "fetch" || step.kind === "execute") {
      if (step.kind === "fetch" && config.source !== "providerAction") return false;
      const provider = typeof config.providerId === "string" ? config.providerId : "";
      const action = typeof config.actionName === "string" ? config.actionName : "";
      return provider.length > 0 &&
        action.length > 0 &&
        isCustomerExecutableManagedAction(provider, action) &&
        hasBillingGradeManagedCost({ provider, action }) &&
        estimateManagedProviderCostUsd({ provider, action }) !== undefined;
    }

    if (step.kind === "transform" || step.kind === "decide" ||
        (step.kind === "validate" && config.mode === "llm")) {
      const model = typeof config.model === "string"
        ? config.model
        : "anthropic/claude-haiku-4-5";
      let maxOutputTokens: number;
      try {
        maxOutputTokens = normalizeMaxOutputTokens(config.maxTokens, 2_000);
      } catch {
        return false;
      }
      return estimateManagedProviderCostUsd({
        provider: "openrouter",
        action: "chat",
        model,
        estimatedInputTokens: 0,
        maxOutputTokens,
      }) !== undefined && isCustomerExecutableManagedAction("openrouter", "chat");
    }

    return step.kind === "validate" && config.mode === "rules";
  });
}

// ============================================
// DISCOVER MISSIONS
// ============================================
//
// Ranks publicly-available mission templates against a natural-language
// query. Mirrors discover_apis' shape so agents have a single mental
// model: query in, ranked list out, with reasons. Ranking layers a
// keyword score with the same providerHealth-derived multiplier that
// discover_apis uses, applied to each step's attributed provider; the
// weakest step's health drives the multiplier (weakest-link semantics).

export const discover = query({
  args: { query: v.string(), maxResults: v.optional(v.number()) },
  handler: async (ctx, { query, maxResults }) => {
    const limit = Math.min(Math.max(maxResults ?? 5, 1), 25);

    const publicRows = await ctx.db
      .query("missionTemplates")
      .withIndex("by_visibility_enabled", (q) =>
        q.eq("visibility", "public").eq("enabled", true),
      )
      .collect();

    const marketplaceRows = await ctx.db
      .query("missionTemplates")
      .withIndex("by_visibility_enabled", (q) =>
        q.eq("visibility", "marketplace").eq("enabled", true),
      )
      .collect();

    const candidates = [...publicRows, ...marketplaceRows]
      .filter((row) => isCustomerRunnableMissionTemplate(row.steps));

    const healthRows = await ctx.db.query("providerHealth").collect();
    const healthMap = new Map(healthRows.map((h) => [h.providerId, h]));
    const MIN_CALLS = 5;

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);

    type Scored = {
      slug: string;
      version: number;
      title: string;
      description: string;
      visibility: string;
      paramSchema: any;
      relevanceScore: number;
      matchReasons: string[];
    };

    const scored: Scored[] = [];
    for (const tmpl of candidates) {
      let raw = 0;
      const reasons: string[] = [];

      for (const word of queryWords) {
        if (tmpl.slug.toLowerCase().includes(word)) {
          raw += 20;
          reasons.push(`slug:${word}`);
        }
        if (tmpl.title.toLowerCase().includes(word)) {
          raw += 15;
          reasons.push(`title:${word}`);
        }
        if (tmpl.description.toLowerCase().includes(word)) {
          raw += 5;
          reasons.push(`desc:${word}`);
        }
        const propNames = Object.keys(
          (tmpl.inputSchema && (tmpl.inputSchema as any).properties) ?? {},
        )
          .join(" ")
          .toLowerCase();
        if (propNames.includes(word)) {
          raw += 3;
          reasons.push(`param:${word}`);
        }
      }

      // Weakest-link health multiplier across this template's steps.
      // If no step is attributed to a known managed provider, multiplier
      // stays at 1.0 (no penalty).
      let minMult = 1.0;
      const steps = (tmpl.steps as any[]) ?? [];
      for (const step of steps) {
        const providerName: string | undefined =
          step?.config?.attributeAs ?? step?.config?.providerId;
        if (!providerName) continue;
        const h = healthMap.get(providerName);
        if (!h || h.callCount < MIN_CALLS) continue;
        const successComponent =
          0.5 + 0.5 * Math.max(0, Math.min(1, h.successRate));
        const latencyPenalty = h.p50LatencyMs > 2000 ? 0.9 : 1.0;
        const stepMult = successComponent * latencyPenalty;
        if (stepMult < minMult) minMult = stepMult;
      }
      if (minMult < 1.0) {
        reasons.push(`health:${Math.round(minMult * 100) / 100}`);
      }

      const finalScore = raw * minMult;
      if (finalScore > 0) {
        scored.push({
          slug: tmpl.slug,
          version: tmpl.version,
          title: tmpl.title,
          description: tmpl.description,
          visibility: tmpl.visibility,
          paramSchema: tmpl.inputSchema,
          relevanceScore: Math.round(finalScore * 100) / 100,
          matchReasons: [...new Set(reasons)],
        });
      }
    }

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return scored.slice(0, limit);
  },
});

export const listTemplates = query({
  args: {},
  handler: async (ctx) => {
    // Legacy hand-coded templates from the in-process registry.
    const legacy = Object.entries(TEMPLATE_REGISTRY).map(([id, t]) => ({
      id,
      version: undefined as number | undefined,
      runtime: "legacy" as const,
      title: t.title,
      description: t.description,
      paramSchema: t.paramSchema,
    }));

    // v2 templates from the missionTemplates table. Surface every enabled
    // version so agents can pin if they want; latest is what start_mission
    // uses by default when template_version is omitted.
    const v2Rows = await ctx.db
      .query("missionTemplates")
      .withIndex("by_visibility_enabled", (q) =>
        q.eq("visibility", "public").eq("enabled", true),
      )
      .collect();

    const v2 = v2Rows
      .filter((row) => isCustomerRunnableMissionTemplate(row.steps))
      .map((row) => ({
      id: row.slug,
      version: row.version,
      runtime: "v2" as const,
      title: row.title,
      description: row.description,
      paramSchema: row.inputSchema,
      }));

    return [...legacy, ...v2];
  },
});

// ============================================
// HELPERS
// ============================================

const INTERNAL_DOMAINS = ["nordsym.com", "nordsym.se"];

function isInternalEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return Boolean(domain && INTERNAL_DOMAINS.includes(domain));
}

export function classifyMissionReplay(
  existing: { requestFingerprint?: string } | null,
  requestFingerprint: string,
): "create" | "replay" | "conflict" {
  if (!existing) return "create";
  return existing.requestFingerprint === requestFingerprint ? "replay" : "conflict";
}

// ============================================
// CREATE / READ
// ============================================

export const createMission = internalMutation({
  args: {
    sessionToken: v.optional(v.string()),
    apiKeyHash: v.optional(v.string()), // pre-resolved when invoked from /mcp or /v1
    workspaceIdOverride: v.optional(v.id("workspaces")),
    requestId: v.string(),
    requestFingerprint: v.string(),
    template: v.string(),
    templateVersion: v.optional(v.number()), // when set, runs through v2 missionRunner
    params: v.any(),
    initiator: v.string(),
    clientId: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Normalise legacy slugs to their canonical counterparts before any
    // lookup. Old "genprd" calls land on the new prd-generation template
    // without the caller having to know about the migration.
    const canonicalSlug = TEMPLATE_SLUG_ALIASES[args.template] ?? args.template;
    args = { ...args, template: canonicalSlug };

    // Resolve the template definition from either path so we fail-fast on
    // an unknown slug before inserting a mission row.
    let legacyTmpl: { title: string } | null = TEMPLATE_REGISTRY[args.template] ?? null;
    let v2Tmpl: { title: string; version: number; customerRunnable: boolean } | null = null;

    if (args.templateVersion != null) {
      const row = await ctx.db
        .query("missionTemplates")
        .withIndex("by_slug_version", (q) =>
          q.eq("slug", args.template).eq("version", args.templateVersion!),
        )
        .first();
      if (!row || !row.enabled) {
        throw new Error(`unknown_template: ${args.template}@v${args.templateVersion}`);
      }
      v2Tmpl = {
        title: row.title,
        version: row.version,
        customerRunnable: isCustomerRunnableMissionTemplate(row.steps),
      };
    } else if (!legacyTmpl) {
      // Caller did not pin a version. Try v2 latest before bailing.
      const latest = await ctx.db
        .query("missionTemplates")
        .withIndex("by_slug_enabled", (q) =>
          q.eq("slug", args.template).eq("enabled", true),
        )
        .collect();
      if (latest.length === 0) {
        throw new Error(`unknown_template: ${args.template}`);
      }
      const picked = latest.sort((a, b) => b.version - a.version)[0];
      v2Tmpl = {
        title: picked.title,
        version: picked.version,
        customerRunnable: isCustomerRunnableMissionTemplate(picked.steps),
      };
    }

    let workspaceId: Id<"workspaces"> | null = args.workspaceIdOverride ?? null;
    if (!workspaceId && args.sessionToken) {
      const session = await findUsableAgentSession(ctx.db, args.sessionToken!);
      if (!session) throw new Error("invalid_session");
      workspaceId = session.workspaceId;
    }
    if (!workspaceId) throw new Error("no_workspace_resolved");

    const ws = await ctx.db.get(workspaceId);
    if (!ws) throw new Error("workspace_not_found");
    if (ws.status !== "active") throw new Error("workspace_inactive");

    const existingMission = await ctx.db
      .query("missions")
      .withIndex("by_workspaceId_requestId", (q) =>
        q.eq("workspaceId", workspaceId!).eq("requestId", args.requestId),
      )
      .unique();
    const replayDecision = classifyMissionReplay(existingMission, args.requestFingerprint);
    if (replayDecision !== "create") {
      if (replayDecision === "conflict") {
        throw new Error("idempotency_conflict: mission key reused with different input");
      }
      if (!existingMission) throw new Error("idempotency_state_invalid");
      return {
        missionId: existingMission._id,
        status: existingMission.status,
        isInternal: existingMission.isInternal,
        templateVersion: existingMission.templateVersion,
        duplicate: true,
      };
    }

    const summary =
      args.title ?? deriveTitle(args.template, args.params, v2Tmpl?.title);
    const isInternal = isInternalEmail(ws.email);
    if (!isInternal && v2Tmpl && !v2Tmpl.customerRunnable) {
      throw new Error(`template_not_customer_runnable: ${args.template}`);
    }
    const resolvedVersion = v2Tmpl?.version;

    const missionId = await ctx.db.insert("missions", {
      workspaceId,
      requestId: args.requestId,
      requestFingerprint: args.requestFingerprint,
      template: args.template,
      templateVersion: resolvedVersion,
      title: summary,
      status: "queued",
      params: args.params ?? {},
      initiator: args.initiator,
      clientId: args.clientId,
      isInternal,
      createdAt: Date.now(),
    });

    await ctx.db.insert("missionEvents", {
      missionId,
      workspaceId,
      type: "step_start",
      label: `mission queued: ${v2Tmpl?.title ?? legacyTmpl?.title ?? args.template}`,
      data: {
        template: args.template,
        templateVersion: resolvedVersion,
        params: args.params,
      },
      timestamp: Date.now(),
    });

    // Scheduling is part of the same serialized mutation as idempotent
    // creation. A lost HTTP response can therefore neither duplicate work nor
    // strand a queued mission before execution is scheduled.
    await ctx.scheduler.runAfter(0, internal.missions.runMission, { missionId });

    return {
      missionId,
      status: "queued",
      isInternal,
      templateVersion: resolvedVersion,
      duplicate: false,
    };
  },
});

function deriveTitle(
  template: string,
  params: Record<string, unknown>,
  v2Title?: string,
): string {
  if (template === "genprd" || template === "prd-generation") {
    const t = (params?.topic as string) || "untitled";
    return `PRD: ${t.slice(0, 60)}`;
  }
  return TEMPLATE_REGISTRY[template]?.title ?? v2Title ?? template;
}

export const getMission = internalQuery({
  args: { missionId: v.id("missions") },
  handler: async (ctx, args) => {
    const mission = await ctx.db.get(args.missionId);
    if (!mission) return null;
    const events = await ctx.db
      .query("missionEvents")
      .withIndex("by_missionId_timestamp", (q) => q.eq("missionId", args.missionId))
      .collect();
    return { mission, events };
  },
});

export const listForWorkspace = internalQuery({
  args: { workspaceId: v.id("workspaces"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);
    const rows = await ctx.db
      .query("missions")
      .withIndex("by_workspaceId_createdAt", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .take(limit);
    return rows;
  },
});

export const listForSession = internalQuery({
  args: { sessionToken: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const session = await findUsableAgentSession(ctx.db, args.sessionToken);
    if (!session) return [];
    const limit = Math.min(args.limit ?? 50, 200);
    const rows = await ctx.db
      .query("missions")
      .withIndex("by_workspaceId_createdAt", (q) => q.eq("workspaceId", session.workspaceId))
      .order("desc")
      .take(limit);
    return rows;
  },
});

// ============================================
// EVENT LOG
// ============================================

export const recordEvent = internalMutation({
  args: {
    missionId: v.id("missions"),
    type: v.string(),
    label: v.string(),
    data: v.optional(v.any()),
    durationMs: v.optional(v.number()),
    costUsd: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const mission = await ctx.db.get(args.missionId);
    if (!mission) return;
    await ctx.db.insert("missionEvents", {
      missionId: args.missionId,
      workspaceId: mission.workspaceId,
      type: args.type,
      label: args.label,
      data: args.data,
      durationMs: args.durationMs,
      costUsd: args.costUsd,
      timestamp: Date.now(),
    });
  },
});

// ============================================
// EXECUTION
// ============================================

export const setStatus = internalMutation({
  args: {
    missionId: v.id("missions"),
    status: v.string(),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    underlyingCostUsd: v.optional(v.float64()),
    chargedCostUsd: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const mission = await ctx.db.get(args.missionId);
    if (!mission) return;
    const patch: Record<string, unknown> = { status: args.status };
    if (args.status === "running" && !mission.startedAt) patch.startedAt = Date.now();
    if (args.status === "completed" || args.status === "failed" || args.status === "cancelled") {
      patch.completedAt = Date.now();
    }
    if (args.result !== undefined) patch.result = args.result;
    if (args.error !== undefined) patch.error = args.error;
    if (args.underlyingCostUsd !== undefined) {
      patch.underlyingCostUsd = args.underlyingCostUsd;
    }
    if (args.chargedCostUsd !== undefined) patch.chargedCostUsd = args.chargedCostUsd;
    await ctx.db.patch(args.missionId, patch);
  },
});

export const runMission = internalAction({
  args: { missionId: v.id("missions") },
  handler: async (ctx, args): Promise<{ ok: boolean; result?: unknown; error?: string }> => {
    const data = await ctx.runQuery(internal.missions.getMission, { missionId: args.missionId });
    if (!data || !data.mission) return { ok: false, error: "mission_not_found" };
    const m = data.mission;
    if (m.status !== "queued") return { ok: false, error: `not_queued: ${m.status}` };

    await ctx.runMutation(internal.missions.setStatus, {
      missionId: args.missionId,
      status: "running",
    });
    await ctx.runMutation(internal.missions.recordEvent, {
      missionId: args.missionId,
      type: "step_start",
      label: `executing template ${m.template}`,
    });

    try {
      // v2 missions (those that pin templateVersion) route through the
      // data-driven runner. It writes its own missionEvents + apiLogs and
      // sets the final status/cost on the missions row, so we just early-
      // return here to avoid double-finalising.
      if (m.templateVersion != null) {
        await ctx.runAction(internal.missionRunner.runV2, { missionId: args.missionId });
        return { ok: true };
      }

      // Legacy in-process templates have all been migrated to v2. A
      // mission without templateVersion at this point is either an
      // unaliased unknown slug or an in-flight row from before migration.
      throw new Error(`template_runtime_missing: ${m.template}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "execution_failed";
      await ctx.runMutation(internal.missions.recordEvent, {
        missionId: args.missionId,
        type: "log",
        label: "mission failed",
        data: { error: msg },
      });
      await ctx.runMutation(internal.missions.setStatus, {
        missionId: args.missionId,
        status: "failed",
        error: msg,
      });
      return { ok: false, error: msg };
    }
  },
});


// ============================================
// CANCEL
// ============================================

export const cancelMission = internalMutation({
  args: { sessionToken: v.string(), missionId: v.id("missions") },
  handler: async (ctx, args) => {
    const session = await findUsableAgentSession(ctx.db, args.sessionToken);
    if (!session) throw new Error("invalid_session");
    const mission = await ctx.db.get(args.missionId);
    if (!mission || mission.workspaceId !== session.workspaceId) throw new Error("not_found");
    if (mission.status === "completed" || mission.status === "failed" || mission.status === "cancelled") {
      return { ok: true, note: "already_terminal" };
    }
    await ctx.db.patch(args.missionId, { status: "cancelled", completedAt: Date.now() });
    await ctx.db.insert("missionEvents", {
      missionId: args.missionId,
      workspaceId: mission.workspaceId,
      type: "log",
      label: "cancelled by workspace owner",
      timestamp: Date.now(),
    });
    return { ok: true };
  },
});
