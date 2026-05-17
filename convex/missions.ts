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
import { mutation, query, action, internalAction, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ============================================
// MISSION TEMPLATES
// ============================================

const TEMPLATE_REGISTRY: Record<
  string,
  {
    title: string;
    description: string;
    paramSchema: Record<string, { type: string; required?: boolean; description: string }>;
  }
> = {
  genprd: {
    title: "Generate PRD",
    description:
      "Generate a structured product requirements document for a feature or product. Uses APIClaw's Managed LLM gateway (advisor routing) to produce a Markdown PRD with goals, user stories, requirements, and success metrics.",
    paramSchema: {
      topic: { type: "string", required: true, description: "What the PRD is about (one sentence is enough)" },
      audience: { type: "string", required: false, description: "Who the product is for" },
      constraints: { type: "string", required: false, description: "Hard constraints (timeline, stack, budget)" },
      model: { type: "string", required: false, description: "Override LLM model (default: anthropic/claude-sonnet-4-6)" },
    },
  },
};

export const listTemplates = query({
  args: {},
  handler: async () =>
    Object.entries(TEMPLATE_REGISTRY).map(([id, t]) => ({
      id,
      title: t.title,
      description: t.description,
      paramSchema: t.paramSchema,
    })),
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

function applyMargin(underlyingUsd: number, isInternal: boolean): number {
  if (isInternal) return 0;
  return Math.round(underlyingUsd * 1.15 * 1_000_000) / 1_000_000;
}

// ============================================
// CREATE / READ
// ============================================

export const createMission = mutation({
  args: {
    sessionToken: v.optional(v.string()),
    apiKeyHash: v.optional(v.string()), // pre-resolved when invoked from /mcp or /v1
    workspaceIdOverride: v.optional(v.id("workspaces")),
    template: v.string(),
    params: v.any(),
    initiator: v.string(),
    clientId: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!TEMPLATE_REGISTRY[args.template]) {
      throw new Error(`unknown_template: ${args.template}`);
    }

    let workspaceId: Id<"workspaces"> | null = args.workspaceIdOverride ?? null;
    if (!workspaceId && args.sessionToken) {
      const session = await ctx.db
        .query("agentSessions")
        .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken!))
        .first();
      if (!session) throw new Error("invalid_session");
      workspaceId = session.workspaceId;
    }
    if (!workspaceId) throw new Error("no_workspace_resolved");

    const ws = await ctx.db.get(workspaceId);
    if (!ws) throw new Error("workspace_not_found");
    if (ws.status !== "active") throw new Error("workspace_inactive");

    const tmpl = TEMPLATE_REGISTRY[args.template];
    const summary = args.title ?? deriveTitle(args.template, args.params);
    const isInternal = isInternalEmail(ws.email);

    const missionId = await ctx.db.insert("missions", {
      workspaceId,
      template: args.template,
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
      label: `mission queued: ${tmpl.title}`,
      data: { template: args.template, params: args.params },
      timestamp: Date.now(),
    });

    return { missionId, status: "queued", isInternal };
  },
});

function deriveTitle(template: string, params: Record<string, unknown>): string {
  const tmpl = TEMPLATE_REGISTRY[template];
  if (!tmpl) return template;
  if (template === "genprd") {
    const t = (params?.topic as string) || "untitled";
    return `PRD: ${t.slice(0, 60)}`;
  }
  return tmpl.title;
}

export const getMission = query({
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

export const listForWorkspace = query({
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

export const listForSession = query({
  args: { sessionToken: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
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
      patch.chargedCostUsd = applyMargin(args.underlyingCostUsd, mission.isInternal);
    }
    await ctx.db.patch(args.missionId, patch);
  },
});

export const runMission = action({
  args: { missionId: v.id("missions") },
  handler: async (ctx, args): Promise<{ ok: boolean; result?: unknown; error?: string }> => {
    const data = await ctx.runQuery(api.missions.getMission, { missionId: args.missionId });
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
      let result: unknown;
      let costUsd = 0;
      const t0 = Date.now();

      if (m.template === "genprd") {
        const out = await runGenPRD(ctx, args.missionId, m, m.params as Record<string, unknown>);
        result = out.result;
        costUsd = out.costUsd;
      } else {
        throw new Error(`template_runtime_missing: ${m.template}`);
      }

      await ctx.runMutation(internal.missions.recordEvent, {
        missionId: args.missionId,
        type: "step_complete",
        label: "mission complete",
        durationMs: Date.now() - t0,
        costUsd,
      });
      await ctx.runMutation(internal.missions.setStatus, {
        missionId: args.missionId,
        status: "completed",
        result,
        underlyingCostUsd: costUsd,
      });
      return { ok: true, result };
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
// TEMPLATE: GenPRD
// Routes to genprd.se/api/generate — GenPRD is the quality engine.
// APIClaw orchestrates, observes, and attributes usage.
// ============================================

export const logGenPRDCall = internalMutation({
  args: {
    callerWorkspaceId: v.id("workspaces"),
    status: v.union(v.literal("success"), v.literal("error")),
    latencyMs: v.number(),
    action: v.string(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Log inbound entry to GenPRD's provider workspace (Gustav's) so analytics
    // attribute the call to the workspace that listed GenPRD.
    const ownerWs = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", "gustav@nordsym.com"))
      .first();
    if (!ownerWs) return;

    await ctx.db.insert("apiLogs", {
      workspaceId: ownerWs._id,
      sessionToken: "",
      provider: "genprd",
      action: args.action,
      status: args.status,
      latencyMs: args.latencyMs,
      direction: "inbound",
      callerWorkspaceId: args.callerWorkspaceId.toString(),
      errorMessage: args.errorMessage,
      createdAt: Date.now(),
    });

    // Also log outbound entry on the calling workspace for their own audit trail.
    if (args.callerWorkspaceId !== ownerWs._id) {
      await ctx.db.insert("apiLogs", {
        workspaceId: args.callerWorkspaceId,
        sessionToken: "",
        provider: "genprd",
        action: args.action,
        status: args.status,
        latencyMs: args.latencyMs,
        direction: "outbound",
        errorMessage: args.errorMessage,
        createdAt: Date.now(),
      });
    }
  },
});

async function runGenPRD(
  ctx: any,
  missionId: Id<"missions">,
  mission: { workspaceId: Id<"workspaces"> },
  params: Record<string, unknown>
): Promise<{ result: { markdown: string; model: string; tokens: { input: number; output: number } }; costUsd: number }> {
  const topic = String(params.topic ?? "").trim();
  if (!topic) throw new Error("topic_required");
  const audience = params.audience ? String(params.audience) : null;
  const constraints = params.constraints ? String(params.constraints) : null;
  const model = (params.model as string) || "anthropic/claude-sonnet-4-5";
  const format = (params.format as string) || "standard";

  await ctx.runMutation(internal.missions.recordEvent, {
    missionId,
    type: "log",
    label: `routing to genprd.se: "${topic}"`,
    data: { audience, constraints, model, format },
  });

  const genprdKey = process.env.GENPRD_API_KEY;
  if (!genprdKey) throw new Error("GENPRD_API_KEY missing on Convex");

  const t0 = Date.now();
  let res: Response;
  try {
    res = await fetch("https://genprd.se/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-GenPRD-Key": genprdKey,
        "X-APIClaw-Mission": missionId,
      },
      body: JSON.stringify({ topic, audience, constraints, model, format }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch_failed";
    await ctx.runMutation(internal.missions.logGenPRDCall, {
      callerWorkspaceId: mission.workspaceId,
      status: "error",
      latencyMs: Date.now() - t0,
      action: "generate_prd",
      errorMessage: msg,
    });
    throw new Error(`genprd_network: ${msg}`);
  }

  const latencyMs = Date.now() - t0;

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    await ctx.runMutation(internal.missions.logGenPRDCall, {
      callerWorkspaceId: mission.workspaceId,
      status: "error",
      latencyMs,
      action: "generate_prd",
      errorMessage: `http_${res.status}`,
    });
    throw new Error(`genprd_${res.status}: ${txt.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    prd: string;
    model: string;
    tokens: { input: number; output: number };
    metadata?: { generatedAt?: string; durationMs?: number; version?: string };
  };

  const markdown = json.prd ?? "";
  const inTok = json.tokens?.input ?? 0;
  const outTok = json.tokens?.output ?? 0;

  // Cost estimate: Sonnet-4.5 ~$3/M input + $15/M output.
  const costUsd = (inTok * 3 + outTok * 15) / 1_000_000;

  await ctx.runMutation(internal.missions.recordEvent, {
    missionId,
    type: "tool_call",
    label: `genprd.se → ${json.model}`,
    data: {
      tokens: { input: inTok, output: outTok },
      durationMs: latencyMs,
      genprdVersion: json.metadata?.version,
    },
    durationMs: latencyMs,
    costUsd,
  });

  // Attribute this call to GenPRD's workspace in analytics.
  await ctx.runMutation(internal.missions.logGenPRDCall, {
    callerWorkspaceId: mission.workspaceId,
    status: "success",
    latencyMs,
    action: "generate_prd",
  });

  return { result: { markdown, model: json.model, tokens: { input: inTok, output: outTok } }, costUsd };
}

// ============================================
// CANCEL
// ============================================

export const cancelMission = mutation({
  args: { sessionToken: v.string(), missionId: v.id("missions") },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
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
