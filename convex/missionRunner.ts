/**
 * Mission Runner — v2 executor.
 *
 * Walks a data-driven mission template (from the missionTemplates table)
 * step by step, dispatching each step to the primitive handler keyed by
 * step.kind, threading outputs through mission.state via mustache-style
 * bindings, and persisting one missionEvents row per step.
 *
 * v2 missions opt in by setting missions.templateVersion when created.
 * Missions without templateVersion still resolve through the legacy
 * TEMPLATE_REGISTRY switch in missions.ts (currently: GenPRD).
 *
 * Primitives are stubbed in Spike 1 except `transform` (Spike 2). Stubs
 * return {ok: false, error: "not_implemented"} so a mission that includes
 * an unimplemented primitive halts cleanly with a clear error event.
 */

import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { Step, StepResult } from "./missionPrimitives";
import { resolveBindings } from "./missionPrimitives";

// ─────────────────────────────────────────────────────────────────────────────
// Primitive handlers
//
// All five primitives present; only those needed for the current spike are
// implemented. Stubs surface a clean error so a half-built template fails
// loudly instead of silently producing junk.
// ─────────────────────────────────────────────────────────────────────────────

type PrimitiveCtx = {
  missionId: Id<"missions">;
  workspaceId: Id<"workspaces">;
};

type PrimitiveArgs = {
  ctx: PrimitiveCtx;
  config: any;
  inputs: any;
};

async function runFetch(_: PrimitiveArgs): Promise<StepResult> {
  return {
    ok: false,
    error: "primitive_not_implemented:fetch",
    costUsd: 0,
    latencyMs: 0,
  };
}

// Pricing per million tokens. Defaults to Sonnet numbers if the model
// slug isn't listed. Source of truth long-term: modelCatalog. Inlined
// for spike 2 so transform is self-contained.
const TRANSFORM_PRICING: Record<string, { input: number; output: number }> = {
  "anthropic/claude-sonnet-4-5": { input: 3, output: 15 },
  "anthropic/claude-sonnet-4-6": { input: 3, output: 15 },
  "anthropic/claude-opus-4-7": { input: 15, output: 75 },
  "anthropic/claude-haiku-4-5": { input: 0.8, output: 4 },
  "openai/gpt-4o": { input: 2.5, output: 10 },
  "openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
};

function estimateTransformCost(model: string, inTok: number, outTok: number): number {
  const p = TRANSFORM_PRICING[model] ?? { input: 3, output: 15 };
  return (inTok * p.input + outTok * p.output) / 1_000_000;
}

async function runTransform(args: PrimitiveArgs): Promise<StepResult> {
  const { config, inputs } = args;
  const model: string = config?.model ?? "anthropic/claude-sonnet-4-5";
  const systemPrompt: string = config?.systemPrompt ?? "";
  const userPromptTemplate: string = config?.userPromptTemplate ?? "";
  const outputSchema = config?.outputSchema;
  const temperature: number = config?.temperature ?? 0.4;
  const maxTokens: number | undefined = config?.maxTokens;

  // userPromptTemplate is template-author copy; bind it against the
  // step's runtime inputs. Bindings use the same {{path}} syntax as
  // missionPrimitives.resolveBindings but rooted at `input` for clarity.
  const promptBindingContext = { input: inputs };
  const userPrompt = resolveBindings(userPromptTemplate, promptBindingContext);
  const userText = typeof userPrompt === "string" ? userPrompt : JSON.stringify(userPrompt);

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "OPENROUTER_API_KEY missing on Convex",
      costUsd: 0,
      latencyMs: 0,
      model,
    };
  }

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userText },
    ],
    temperature,
  };
  if (maxTokens) body.max_tokens = maxTokens;

  // Strict structured output when the template author declared a schema.
  // OpenRouter forwards json_schema to providers that support it natively
  // (Anthropic, OpenAI, etc); for the rest it falls back to json_object
  // + best-effort prompt nudging.
  if (outputSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: "transform_output",
        strict: true,
        schema: outputSchema,
      },
    };
  }

  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://apiclaw.cloud",
        "X-Title": "APIClaw Mission Runner",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch_failed";
    return {
      ok: false,
      error: `openrouter_network:${msg}`,
      costUsd: 0,
      latencyMs: Date.now() - startedAt,
      model,
    };
  }
  const latency = Date.now() - startedAt;

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return {
      ok: false,
      error: `openrouter_${res.status}: ${txt.slice(0, 200)}`,
      costUsd: 0,
      latencyMs: latency,
      model,
    };
  }

  const json = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    model?: string;
  };

  const content = json.choices?.[0]?.message?.content ?? "";
  const inTok = json.usage?.prompt_tokens ?? 0;
  const outTok = json.usage?.completion_tokens ?? 0;
  const cost = estimateTransformCost(model, inTok, outTok);

  // If a schema was requested, parse the returned JSON. Parse failure is
  // a primitive-level failure so the template author finds out immediately
  // rather than getting a string masquerading as structured output.
  let output: unknown = content;
  if (outputSchema) {
    try {
      output = JSON.parse(content);
    } catch {
      return {
        ok: false,
        error: "structured_output_parse_failed",
        costUsd: cost,
        latencyMs: latency,
        model: json.model ?? model,
        meta: {
          tokens: { input: inTok, output: outTok },
          rawContentSample: content.slice(0, 500),
        },
      };
    }
  }

  return {
    ok: true,
    output,
    costUsd: cost,
    latencyMs: latency,
    model: json.model ?? model,
    meta: { tokens: { input: inTok, output: outTok } },
  };
}

async function runDecide(_: PrimitiveArgs): Promise<StepResult> {
  return {
    ok: false,
    error: "primitive_not_implemented:decide",
    costUsd: 0,
    latencyMs: 0,
  };
}

async function runValidate(_: PrimitiveArgs): Promise<StepResult> {
  return {
    ok: false,
    error: "primitive_not_implemented:validate",
    costUsd: 0,
    latencyMs: 0,
  };
}

async function runExecute(_: PrimitiveArgs): Promise<StepResult> {
  return {
    ok: false,
    error: "primitive_not_implemented:execute",
    costUsd: 0,
    latencyMs: 0,
  };
}

const PRIMITIVE_HANDLERS: Record<
  string,
  (args: PrimitiveArgs) => Promise<StepResult>
> = {
  fetch: runFetch,
  transform: runTransform,
  decide: runDecide,
  validate: runValidate,
  execute: runExecute,
};

// ─────────────────────────────────────────────────────────────────────────────
// Margin helper — duplicated from missions.ts to keep the runner self-contained.
// 15% margin on external workspaces; 0% on NordSym workspaces.
// ─────────────────────────────────────────────────────────────────────────────

function applyMargin(underlyingUsd: number, isInternal: boolean): number {
  if (isInternal) return 0;
  return Math.round(underlyingUsd * 1.15 * 1_000_000) / 1_000_000;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal queries + mutations the executor relies on
// ─────────────────────────────────────────────────────────────────────────────

export const getMissionForRun = internalQuery({
  args: { missionId: v.id("missions") },
  handler: async (ctx, { missionId }) => {
    const m = await ctx.db.get(missionId);
    if (!m) return null;
    return {
      _id: m._id,
      workspaceId: m.workspaceId,
      template: m.template,
      templateVersion: m.templateVersion,
      params: m.params,
      status: m.status,
      budgetUsd: m.budgetUsd,
      isInternal: m.isInternal,
    };
  },
});

export const getTemplate = internalQuery({
  args: { slug: v.string(), version: v.optional(v.number()) },
  handler: async (ctx, { slug, version }) => {
    if (version != null) {
      return await ctx.db
        .query("missionTemplates")
        .withIndex("by_slug_version", (q) =>
          q.eq("slug", slug).eq("version", version),
        )
        .first();
    }
    // No version pinned: pick the highest-version enabled row for this slug.
    const all = await ctx.db
      .query("missionTemplates")
      .withIndex("by_slug_enabled", (q) =>
        q.eq("slug", slug).eq("enabled", true),
      )
      .collect();
    if (all.length === 0) return null;
    return all.sort((a, b) => b.version - a.version)[0];
  },
});

export const markStarted = internalMutation({
  args: { missionId: v.id("missions") },
  handler: async (ctx, { missionId }) => {
    await ctx.db.patch(missionId, {
      status: "running",
      startedAt: Date.now(),
      state: { params: {}, steps: {} },
    });
  },
});

export const patchState = internalMutation({
  args: { missionId: v.id("missions"), state: v.any() },
  handler: async (ctx, { missionId, state }) => {
    await ctx.db.patch(missionId, { state });
  },
});

export const markComplete = internalMutation({
  args: {
    missionId: v.id("missions"),
    status: v.string(),
    result: v.optional(v.any()),
    underlyingCostUsd: v.number(),
    chargedCostUsd: v.number(),
  },
  handler: async (
    ctx,
    { missionId, status, result, underlyingCostUsd, chargedCostUsd },
  ) => {
    await ctx.db.patch(missionId, {
      status,
      result,
      underlyingCostUsd,
      chargedCostUsd,
      completedAt: Date.now(),
    });
  },
});

export const markFailed = internalMutation({
  args: {
    missionId: v.id("missions"),
    error: v.string(),
    underlyingCostUsd: v.number(),
    chargedCostUsd: v.number(),
  },
  handler: async (
    ctx,
    { missionId, error, underlyingCostUsd, chargedCostUsd },
  ) => {
    await ctx.db.patch(missionId, {
      status: "failed",
      error,
      underlyingCostUsd,
      chargedCostUsd,
      completedAt: Date.now(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Smoke-test harness for the transform primitive
//
// Invokes runTransform with a self-contained config and no mission state,
// useful for verifying the OpenRouter wiring + structured-output parsing
// after a Convex deploy. Not part of the production execution path.
//
// Run: npx convex run missionRunner:smokeTransform --prod '{"topic":"test"}'
// ─────────────────────────────────────────────────────────────────────────────

export const smokeTransform = internalAction({
  args: { topic: v.string() },
  handler: async (_ctx, { topic }): Promise<StepResult> => {
    return await runTransform({
      ctx: {
        missionId: "smoke" as unknown as Id<"missions">,
        workspaceId: "smoke" as unknown as Id<"workspaces">,
      },
      config: {
        model: "anthropic/claude-haiku-4-5",
        systemPrompt:
          "You return a short structured summary. Output strictly matches the schema.",
        userPromptTemplate: "Topic: {{input.topic}}\n\nReturn a one-line headline and a tag list.",
        outputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["headline", "tags"],
          properties: {
            headline: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
          },
        },
        temperature: 0.3,
      },
      inputs: { topic },
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Executor entry point
// ─────────────────────────────────────────────────────────────────────────────

export const runV2 = internalAction({
  args: { missionId: v.id("missions") },
  handler: async (
    ctx,
    { missionId },
  ): Promise<{
    ok: boolean;
    status: string;
    underlyingCostUsd: number;
    chargedCostUsd: number;
    error?: string;
  }> => {
    const mission = await ctx.runQuery(
      internal.missionRunner.getMissionForRun,
      { missionId },
    );
    if (!mission) throw new Error("mission_not_found");

    const template = await ctx.runQuery(internal.missionRunner.getTemplate, {
      slug: mission.template,
      version: mission.templateVersion,
    });
    if (!template || !template.enabled) {
      const charged = 0;
      await ctx.runMutation(internal.missionRunner.markFailed, {
        missionId,
        error: `template_not_found:${mission.template}@${mission.templateVersion ?? "latest"}`,
        underlyingCostUsd: 0,
        chargedCostUsd: charged,
      });
      return {
        ok: false,
        status: "failed",
        underlyingCostUsd: 0,
        chargedCostUsd: charged,
        error: "template_not_found",
      };
    }

    await ctx.runMutation(internal.missionRunner.markStarted, { missionId });

    const state: Record<string, any> = {
      params: mission.params ?? {},
      steps: {},
    };

    let underlyingCost = 0;
    let needsRevision = false;
    const skipSet = new Set<string>();
    const steps = (template.steps as Step[]) ?? [];

    // Pre-emit a step_start for the run as a whole so the events index has
    // a clear anchor even for templates that never enter a primitive.
    await ctx.runMutation(internal.missions.recordEvent, {
      missionId,
      type: "log",
      label: `mission v2 start: ${template.slug}@${template.version}`,
      data: { templateSlug: template.slug, version: template.version, stepCount: steps.length },
    });

    for (const step of steps) {
      if (skipSet.has(step.id)) continue;

      const handler = PRIMITIVE_HANDLERS[step.kind];
      if (!handler) {
        await ctx.runMutation(internal.missions.recordEvent, {
          missionId,
          type: "step_failed",
          label: `unknown primitive ${step.kind} (step ${step.id})`,
          data: { stepId: step.id, kind: step.kind },
        });
        const charged = applyMargin(underlyingCost, mission.isInternal);
        await ctx.runMutation(internal.missionRunner.markFailed, {
          missionId,
          error: `unknown_primitive:${step.kind}`,
          underlyingCostUsd: underlyingCost,
          chargedCostUsd: charged,
        });
        return {
          ok: false,
          status: "failed",
          underlyingCostUsd: underlyingCost,
          chargedCostUsd: charged,
          error: `unknown_primitive:${step.kind}`,
        };
      }

      const resolvedInputs = resolveBindings(step.inputs, state);

      const result: StepResult = await handler({
        ctx: { missionId, workspaceId: mission.workspaceId },
        config: step.config,
        inputs: resolvedInputs,
      });

      // Track step output in mission.state.steps[stepId] so later steps can
      // reference {{steps.<id>.output.<field>}}.
      state.steps[step.id] = {
        ok: result.ok,
        output: result.output,
        failures: result.failures,
      };
      underlyingCost += result.costUsd;

      await ctx.runMutation(internal.missions.recordEvent, {
        missionId,
        type: result.ok ? "step_complete" : "step_failed",
        label: `${step.kind} ${step.id}`,
        data: {
          stepId: step.id,
          kind: step.kind,
          ok: result.ok,
          output: result.output,
          failures: result.failures,
          error: result.error,
          model: result.model,
          meta: result.meta,
        },
        durationMs: result.latencyMs,
        costUsd: result.costUsd,
      });

      await ctx.runMutation(internal.missionRunner.patchState, {
        missionId,
        state,
      });

      // Budget check
      if (
        mission.budgetUsd != null &&
        underlyingCost > mission.budgetUsd
      ) {
        const charged = applyMargin(underlyingCost, mission.isInternal);
        await ctx.runMutation(internal.missionRunner.markFailed, {
          missionId,
          error: "budget_exceeded",
          underlyingCostUsd: underlyingCost,
          chargedCostUsd: charged,
        });
        return {
          ok: false,
          status: "failed",
          underlyingCostUsd: underlyingCost,
          chargedCostUsd: charged,
          error: "budget_exceeded",
        };
      }

      // Validate semantics: ok=false from a validate-step is *not* a hard
      // failure — it flags the mission for revision but the run continues
      // so downstream steps can react (e.g. spawn a fix sub-mission).
      if (step.kind === "validate" && !result.ok) {
        needsRevision = true;
      } else if (!result.ok) {
        const policy = step.onFail ?? "halt";
        if (policy === "halt") {
          const charged = applyMargin(underlyingCost, mission.isInternal);
          await ctx.runMutation(internal.missionRunner.markFailed, {
            missionId,
            error: result.error ?? `step_failed:${step.id}`,
            underlyingCostUsd: underlyingCost,
            chargedCostUsd: charged,
          });
          return {
            ok: false,
            status: "failed",
            underlyingCostUsd: underlyingCost,
            chargedCostUsd: charged,
            error: result.error ?? `step_failed:${step.id}`,
          };
        }
        // retry / spawn_fix policies land in a later spike.
      }

      // Branching: if any *subsequent* step declares branchOn.sourceStepId
      // === step.id, the value just produced selects which case-target step
      // ids execute. Targets not in the selected case go on the skip list.
      const decidedValue =
        typeof result.output === "string"
          ? result.output
          : String(result.output ?? "");
      for (const other of steps) {
        if (other.branchOn?.sourceStepId === step.id) {
          const cases = other.branchOn.cases ?? {};
          const selected = new Set(cases[decidedValue] ?? []);
          const allCaseTargets = new Set<string>();
          for (const ids of Object.values(cases)) {
            for (const id of ids) allCaseTargets.add(id);
          }
          for (const id of allCaseTargets) {
            if (!selected.has(id)) skipSet.add(id);
          }
        }
      }
    }

    // Final result: by convention, the last step's output unless an
    // explicit `result` step id is named on the template (TBD).
    const finalStepId = steps.length > 0 ? steps[steps.length - 1].id : null;
    const finalResult =
      finalStepId && state.steps[finalStepId]
        ? state.steps[finalStepId].output
        : state.steps;

    const charged = applyMargin(underlyingCost, mission.isInternal);
    const finalStatus = needsRevision ? "needs_revision" : "completed";

    await ctx.runMutation(internal.missionRunner.markComplete, {
      missionId,
      status: finalStatus,
      result: finalResult,
      underlyingCostUsd: underlyingCost,
      chargedCostUsd: charged,
    });

    return {
      ok: true,
      status: finalStatus,
      underlyingCostUsd: underlyingCost,
      chargedCostUsd: charged,
    };
  },
});
