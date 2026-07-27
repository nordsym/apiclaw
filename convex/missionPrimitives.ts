/**
 * Mission Primitives — typed building blocks for mission templates.
 *
 * Every mission template composes a graph of five primitives:
 *
 *   fetch      — pull data from an external source (HTTP/API/file). No LLM.
 *   transform  — LLM call with input + output-schema; produces typed data.
 *   decide     — LLM call constrained to an enum; branches the pipeline.
 *   validate   — typed pass/fail check of accumulated state against a contract.
 *   execute    — perform a side-effect through a registered provider/action.
 *
 * Composition is expressed via three combinators applied at the step level:
 *
 *   parallel   — set of step ids to run concurrently before continuing.
 *   branchOn   — switch by a key in mission.state.
 *   onFail     — halt | retry | spawn_fix.
 *
 * Step inputs use mustache-style references into mission.state:
 *   "{{params.topic}}", "{{steps.fetchCompetitors.output}}"
 *
 * This file is the *contract*. The runner in missionRunner.ts walks
 * templates against these shapes and dispatches per primitive kind.
 */

import { v, Infer } from "convex/values";

// ─────────────────────────────────────────────────────────────────────────────
// Primitive identifiers
// ─────────────────────────────────────────────────────────────────────────────

export const PRIMITIVE_KINDS = [
  "fetch",
  "transform",
  "decide",
  "validate",
  "execute",
] as const;

export type PrimitiveKind = (typeof PRIMITIVE_KINDS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Per-primitive config validators
//
// `config` is the static, template-author-provided part of a step.
// `inputs` (defined on the step wrapper below) is the dynamic part that
// gets resolved at runtime against mission.state.
// ─────────────────────────────────────────────────────────────────────────────

// fetch — wraps an HTTP GET/POST or a provider action that has no side effect.
export const fetchConfig = v.object({
  source: v.union(
    v.literal("http"),                // raw HTTP — `url`, `method`, `headers`, `body` from inputs
    v.literal("providerAction"),      // call_api into a registered managed-provider action
  ),
  // For providerAction:
  providerId: v.optional(v.string()),
  actionName: v.optional(v.string()),
  // For http:
  method: v.optional(v.string()),     // "GET" | "POST"; default GET
  expect: v.optional(v.union(v.literal("json"), v.literal("text"))),
  // Override the auto-derived provider tag used when writing the apiLogs
  // row. Defaults to the URL hostname for http source, providerId for
  // providerAction source. Set this to "genprd" (etc) when fetching a
  // managed provider's endpoint directly so analytics line up with the
  // existing inbound-attribution side.
  attributeAs: v.optional(v.string()),
});

// transform — LLM call that produces structured output matching outputSchema.
export const transformConfig = v.object({
  model: v.string(),                  // OpenRouter slug, e.g. "anthropic/claude-sonnet-4-5"
  systemPrompt: v.string(),
  userPromptTemplate: v.string(),     // mustache template; bindings resolve against inputs
  outputSchema: v.any(),              // JSON-schema; runtime requests structured output
  temperature: v.optional(v.number()),
  maxTokens: v.optional(v.number()),
});

// decide — transform variant constrained to a discrete enum choice.
export const decideConfig = v.object({
  model: v.string(),                  // typically fast model: "anthropic/claude-haiku-4-5"
  systemPrompt: v.string(),
  userPromptTemplate: v.string(),
  choices: v.array(v.string()),       // closed-set; LLM must return exactly one
});

// validate — contract check. Either rule-based (cheap) or LLM-based (powerful).
export const validateConfig = v.object({
  mode: v.union(
    v.literal("rules"),               // pure JS rules against inputs; no LLM
    v.literal("llm"),                 // LLM acts as judge against contract text
  ),
  // For rules mode: list of assertion descriptors (e.g. "field_present", "min_length")
  rules: v.optional(v.array(v.any())),
  // For llm mode:
  model: v.optional(v.string()),
  judgePromptTemplate: v.optional(v.string()),
  contract: v.optional(v.string()),   // human-readable contract description for the judge
});

// execute — side-effect through a registered provider action (send_email, etc).
export const executeConfig = v.object({
  providerId: v.string(),
  actionName: v.string(),
  // Optional confirmation gate. Required when actionName creates external state
  // that is hard to reverse (charges, notifications, etc.).
  requiresConfirmation: v.optional(v.boolean()),
});

// ─────────────────────────────────────────────────────────────────────────────
// Step wrapper
//
// Every step in a template carries the same wrapper shape regardless of
// primitive. `kind` tells the runner which config validator applies.
// ─────────────────────────────────────────────────────────────────────────────

export const stepValidator = v.object({
  id: v.string(),                     // unique within template; referenced by other steps
  kind: v.union(
    v.literal("fetch"),
    v.literal("transform"),
    v.literal("decide"),
    v.literal("validate"),
    v.literal("execute"),
  ),
  inputs: v.any(),                    // mustache-bound values; shape primitive-specific
  config: v.any(),                    // matches one of the *Config validators above
  parallelWith: v.optional(v.array(v.string())),  // run concurrently with these step ids
  branchOn: v.optional(v.object({
    sourceStepId: v.string(),         // which decide-step's output drives the branch
    cases: v.record(v.string(), v.array(v.string())), // value → step ids to run for that case
  })),
  onFail: v.optional(v.union(
    v.literal("halt"),                // default: stop mission
    v.literal("retry"),               // retry this step once
    v.literal("spawn_fix"),           // spawn a fix sub-mission and continue
  )),
});

export type Step = Infer<typeof stepValidator>;

// ─────────────────────────────────────────────────────────────────────────────
// Step-run result envelope
//
// Each primitive handler returns this. The runner persists it into
// mission.state[stepId] and emits a missionEvents row.
// ─────────────────────────────────────────────────────────────────────────────

export interface StepResult {
  ok: boolean;
  output?: unknown;
  costUsd: number;
  // Customer charge returned by the managed ledger finalizer. Activation,
  // contract, and internal calls are zero; PAYG is the exact metered charge.
  // The mission runner must aggregate this value instead of re-pricing calls.
  chargedCostUsd?: number;
  latencyMs: number;
  model?: string;                     // present for transform / decide / validate-llm
  failures?: string[];                // present when validate returns ok=false
  error?: string;
  meta?: Record<string, unknown>;     // primitive-specific extras (token counts, http status, etc.)
  // When a primitive performed an external call, it sets apiLog so the
  // runner can persist a row to the apiLogs table. That makes the call
  // visible to providerHealth aggregation, workspace analytics, and the
  // existing /v1/* analytics surfaces. Validators in rules-mode have no
  // external call and leave this undefined.
  apiLog?: { provider: string; action: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mustache-style binding resolver
//
// Resolves a value or object against mission.state. Used to compute the
// runtime inputs of a step from its template-declared bindings.
//
// Examples:
//   "{{params.topic}}"  → state.params.topic
//   "{{steps.fetchA.output.title}}" → state.steps.fetchA.output.title
//   { url: "{{steps.fetchA.output.url}}" } → object with bindings resolved
// ─────────────────────────────────────────────────────────────────────────────

// Templates may reference selected environment variables via {{env.NAME}}.
// The allowlist is intentionally narrow — every entry here is something
// any template can pull, so adding to it grants ambient access to every
// future template author. Workspace-scoped secrets land in their own
// table when that lifts off the backlog.
const ENV_BINDING_ALLOWLIST = new Set<string>();

export function getAllowedEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of ENV_BINDING_ALLOWLIST) {
    const v = process.env[k];
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

const BINDING_RE = /\{\{\s*([^}]+?)\s*\}\}/g;

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

export function resolveBindings(value: unknown, state: Record<string, unknown>): unknown {
  if (typeof value === "string") {
    // If the whole string is a single binding, return the resolved value
    // (preserves type — number, object, etc.). Otherwise, do string-template
    // substitution (always returns a string).
    const wholeMatch = value.match(/^\{\{\s*([^}]+?)\s*\}\}$/);
    if (wholeMatch) return getByPath(state, wholeMatch[1]);
    return value.replace(BINDING_RE, (_m, path) => {
      const v = getByPath(state, path);
      return v == null ? "" : String(v);
    });
  }
  if (Array.isArray(value)) {
    return value.map((v) => resolveBindings(v, state));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, vv] of Object.entries(value)) {
      out[k] = resolveBindings(vv, state);
    }
    return out;
  }
  return value;
}
