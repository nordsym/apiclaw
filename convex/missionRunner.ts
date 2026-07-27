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
import { resolveBindings, getAllowedEnv } from "./missionPrimitives";
import {
  estimateInputTokens,
  estimateManagedProviderCostUsd,
  hasBillingGradeManagedCost,
  providerReportedUsageCostUsd,
  resolveManagedResponseCost,
  verifiedFixedManagedProviderCostUsd,
} from "./managedCostPolicy";
import { decorateOpenRouterRequest } from "./openRouterAttribution";
import {
  deriveRequestFingerprint,
  normalizeMaxOutputTokens,
} from "./httpTrust";

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
  trafficClass?: "customer" | "internal";
};

type PrimitiveArgs = {
  ctx: PrimitiveCtx;
  // The real Convex action context, needed by primitives that call
  // runQuery / runMutation (currently just execute). Optional so simple
  // primitives can be invoked from harness code without one.
  convexCtx?: any;
  config: any;
  inputs: any;
};

const MAX_MISSION_PROVIDER_INPUT_BYTES = 64 * 1024;
const MAX_MISSION_PROVIDER_RESPONSE_BYTES = 2 * 1024 * 1024;
const MANAGED_MISSION_PROVIDER_ORIGINS: Record<string, string> = {
  brave_search: "https://api.search.brave.com",
  genprd: "https://genprd.se",
};
const MANAGED_MISSION_PROVIDER_ALIASES: Record<string, string[]> = {
  brave_search: ["brave_search", "brave_software"],
};

type ManagedCostSource =
  | "provider_response"
  | "token_price_table"
  | "fixed_price_policy"
  | "reservation"
  | "zero_cost";

function finalizedCustomerChargeUsd(value: unknown): number {
  const micros = (value as { customerChargeMicros?: unknown } | null)?.customerChargeMicros;
  return typeof micros === "number" &&
      Number.isSafeInteger(micros) &&
      micros >= 0
    ? micros / 1_000_000
    : 0;
}

class MissionResponseTooLargeError extends RangeError {}

function canonicalProviderId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function resolveMissionProviderById<T extends { name: string }>(
  providers: T[],
  requestedProviderId: string,
): T | undefined {
  const providerId = canonicalProviderId(requestedProviderId);
  const acceptedNames = new Set(
    MANAGED_MISSION_PROVIDER_ALIASES[providerId] ?? [providerId],
  );
  return providers.find((provider) => acceptedNames.has(canonicalProviderId(provider.name)));
}

type MissionProviderAction = {
  name: string;
  method: string;
  path: string;
  params: Array<{ name: string; in: string }>;
  requiresConfirmation: boolean;
};

export function resolveMissionProviderAction(
  requestedProviderId: string,
  requestedActionName: string,
  registeredAction: {
    name: string;
    method: string;
    path: string;
    params?: unknown;
    requiresConfirmation?: boolean;
    enabled?: boolean;
  } | null,
): MissionProviderAction | null {
  if (registeredAction) {
    if (!registeredAction.enabled) return null;
    return {
      name: registeredAction.name,
      method: registeredAction.method,
      path: registeredAction.path,
      params: Array.isArray(registeredAction.params)
        ? registeredAction.params as Array<{ name: string; in: string }>
        : [],
      requiresConfirmation: registeredAction.requiresConfirmation ?? false,
    };
  }

  if (
    canonicalProviderId(requestedProviderId) === "brave_search" &&
    requestedActionName === "search"
  ) {
    return {
      name: "search",
      method: "GET",
      path: "/res/v1/web/search",
      params: [
        { name: "query", in: "query" },
        { name: "q", in: "query" },
        { name: "count", in: "query" },
        { name: "offset", in: "query" },
        { name: "safesearch", in: "query" },
        { name: "freshness", in: "query" },
      ],
      requiresConfirmation: false,
    };
  }

  return null;
}

async function readMissionResponseTextCapped(response: Response): Promise<string> {
  const declaredHeader = response.headers.get("content-length");
  if (declaredHeader !== null) {
    const declaredLength = Number(declaredHeader);
    if (
      Number.isFinite(declaredLength) &&
      declaredLength > MAX_MISSION_PROVIDER_RESPONSE_BYTES
    ) {
      throw new MissionResponseTooLargeError("mission_provider_response_too_large");
    }
  }

  const reader = response.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_MISSION_PROVIDER_RESPONSE_BYTES) {
        await reader.cancel("mission_provider_response_too_large");
        throw new MissionResponseTooLargeError("mission_provider_response_too_large");
      }
      chunks.push(value);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // The stream may already be canceled and unlocked.
    }
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function runFetch(args: PrimitiveArgs): Promise<StepResult> {
  const { config, inputs } = args;
  const source: string = config?.source ?? "http";

  if (source === "http") {
    return {
      ok: false,
      error: "fetch_http:disabled_use_registered_provider_action",
      costUsd: 0,
      latencyMs: 0,
    };
  }

  if (source === "providerAction") {
    return runExecute({
      ...args,
      config: {
        providerId: config?.providerId,
        actionName: config?.actionName,
      },
      inputs,
    });
  }

  return {
    ok: false,
    error: `fetch:unknown_source:${source}`,
    costUsd: 0,
    latencyMs: 0,
  };
}

async function runTransform(args: PrimitiveArgs): Promise<StepResult> {
  const { config, inputs } = args;
  const model: string = config?.model ?? "anthropic/claude-sonnet-4-5";
  const systemPrompt: string = config?.systemPrompt ?? "";
  const userPromptTemplate: string = config?.userPromptTemplate ?? "";
  const outputSchema = config?.outputSchema;
  const temperature: number = config?.temperature ?? 0.4;
  let maxTokens: number;
  try {
    maxTokens = normalizeMaxOutputTokens(config?.maxTokens, 2_000);
  } catch (e) {
    return {
      ok: false,
      error: `transform:invalid_max_tokens:${e instanceof Error ? e.message : "invalid"}`,
      costUsd: 0,
      latencyMs: 0,
      model,
    };
  }

  // userPromptTemplate is template-author copy; bind it against the
  // step's runtime inputs. Bindings use the same {{path}} syntax as
  // missionPrimitives.resolveBindings but rooted at `input` for clarity.
  const promptBindingContext = { input: inputs };
  const userPrompt = resolveBindings(userPromptTemplate, promptBindingContext);
  const userText = typeof userPrompt === "string" ? userPrompt : JSON.stringify(userPrompt);

  if (!args.convexCtx) {
    return {
      ok: false,
      error: "transform:convex_ctx_missing",
      costUsd: 0,
      latencyMs: 0,
      model,
    };
  }

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
  body.max_tokens = maxTokens;

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

  const pseudonymSecret = process.env.APICLAW_PSEUDONYM_SECRET;
  if (!pseudonymSecret) {
    return {
      ok: false,
      error: "transform:pseudonym_secret_missing",
      costUsd: 0,
      latencyMs: 0,
      model,
    };
  }

  let requestBody: string;
  let requestFingerprint: string;
  let meteredRequestBody: Record<string, unknown>;
  let preparedRequest: Request;
  try {
    const attributedBody = await decorateOpenRouterRequest(
      body,
      String(args.ctx.workspaceId),
      pseudonymSecret,
    );
    meteredRequestBody = attributedBody;
    requestBody = JSON.stringify(attributedBody);
    requestFingerprint = await deriveRequestFingerprint({
      method: "POST",
      url: "https://openrouter.ai/api/v1/chat/completions",
      body: attributedBody,
    });
    // Construct and validate the full credentialed request before reserving a
    // customer call. Invalid local headers/configuration therefore cannot burn
    // activation allowance without any possibility of upstream dispatch.
    preparedRequest = new Request("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://apiclaw.cloud",
        "X-Title": "APIClaw Mission Runner",
      },
      body: requestBody,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "request_prepare_failed";
    return {
      ok: false,
      error: `transform:request_prepare:${msg}`,
      costUsd: 0,
      latencyMs: 0,
      model,
    };
  }

  const reservationUsd = estimateManagedProviderCostUsd({
    provider: "openrouter",
    action: "chat",
    model,
    estimatedInputTokens: estimateInputTokens(meteredRequestBody),
    maxOutputTokens: maxTokens,
  });
  const authorization = await args.convexCtx.runMutation(
    (internal as any).managedUsage.authorizeManagedCall,
    {
      workspaceId: args.ctx.workspaceId,
      requestId: crypto.randomUUID(),
      requestFingerprint,
      provider: "openrouter",
      // All customer mission LLM primitives use the canonical public
      // OpenRouter chat rail. Primitive kind remains in path/apiLog metadata.
      action: "chat",
      model,
      path: `/missions/${String(args.ctx.missionId)}/transform`,
      estimatedProviderCostUsd: reservationUsd,
      billingGradeCost: true,
      trafficClass: args.ctx.trafficClass,
    },
  );
  if (!authorization?.allowed) {
    return {
      ok: false,
      error: `managed_usage_blocked:${authorization?.reason || "unknown"}`,
      costUsd: 0,
      latencyMs: 0,
      model,
      meta: { managedUsage: authorization?.reason || "blocked" },
    };
  }

  const finalize = async (
    success: boolean,
    providerCostUsd: number | undefined,
    details: {
      inputTokens?: number;
      outputTokens?: number;
      upstreamRequestId?: string;
      costSource: ManagedCostSource;
    },
  ) => {
    return await args.convexCtx.runMutation((internal as any).managedUsage.finalizeManagedCall, {
      ledgerId: authorization.ledgerId,
      success,
      provider: "openrouter",
      model,
      ...(providerCostUsd === undefined ? {} : { providerCostUsd }),
      ...details,
    });
  };

  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch(preparedRequest, { signal: AbortSignal.timeout(60_000) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch_failed";
    await finalize(true, undefined, { costSource: "reservation" });
    return {
      ok: false,
      error: `openrouter_network:${msg}`,
      costUsd: 0,
      latencyMs: Date.now() - startedAt,
      model,
      apiLog: { provider: "openrouter", action: "transform" },
    };
  }
  const latency = Date.now() - startedAt;

  if (!res.ok) {
    const txt = await readMissionResponseTextCapped(res).catch(() => "");
    await finalize(false, 0, { costSource: "zero_cost" });
    return {
      ok: false,
      error: `openrouter_${res.status}: ${txt.slice(0, 200)}`,
      costUsd: 0,
      latencyMs: latency,
      model,
      apiLog: { provider: "openrouter", action: "transform" },
    };
  }

  let json: {
    id?: string;
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: unknown; completion_tokens?: unknown; cost?: unknown };
    model?: string;
  };
  try {
    const responseText = await readMissionResponseTextCapped(res);
    json = JSON.parse(responseText) as typeof json;
  } catch (e) {
    await finalize(true, undefined, { costSource: "reservation" });
    return {
      ok: false,
      error: e instanceof MissionResponseTooLargeError
        ? "openrouter_response_too_large"
        : `openrouter_parse:${e instanceof Error ? e.message : "invalid_json"}`,
      costUsd: 0,
      latencyMs: latency,
      model,
      apiLog: { provider: "openrouter", action: "transform" },
    };
  }

  const content = json.choices?.[0]?.message?.content ?? "";
  const inTok = typeof json.usage?.prompt_tokens === "number" &&
    Number.isFinite(json.usage.prompt_tokens) && json.usage.prompt_tokens >= 0
    ? json.usage.prompt_tokens
    : 0;
  const outTok = typeof json.usage?.completion_tokens === "number" &&
    Number.isFinite(json.usage.completion_tokens) && json.usage.completion_tokens >= 0
    ? json.usage.completion_tokens
    : 0;
  const costDecision = resolveManagedResponseCost({
    provider: "openrouter",
    responseOk: true,
    providerReportedCostUsd: providerReportedUsageCostUsd(json.usage),
  });
  if (
    costDecision.costSource !== "provider_response" ||
    costDecision.providerCostUsd === undefined
  ) {
    await finalize(true, undefined, {
      inputTokens: inTok,
      outputTokens: outTok,
      upstreamRequestId: json.id,
      costSource: "reservation",
    });
    return {
      ok: false,
      error: "openrouter_exact_cost_missing",
      costUsd: 0,
      latencyMs: latency,
      model: json.model ?? model,
      meta: { tokens: { input: inTok, output: outTok } },
      apiLog: { provider: "openrouter", action: "transform" },
    };
  }
  const cost = costDecision.providerCostUsd;
  const reservedCostMicros = Math.round((reservationUsd ?? 0) * 1_000_000);
  const exactCostMicros = Math.round(cost * 1_000_000);
  if (exactCostMicros > reservedCostMicros) {
    await finalize(true, cost, {
      inputTokens: inTok,
      outputTokens: outTok,
      upstreamRequestId: json.id,
      costSource: "provider_response",
    });
    return {
      ok: false,
      error: "openrouter_exact_cost_exceeds_reservation",
      costUsd: 0,
      latencyMs: latency,
      model: json.model ?? model,
      meta: { tokens: { input: inTok, output: outTok } },
      apiLog: { provider: "openrouter", action: "transform" },
    };
  }
  const finalization = await finalize(true, cost, {
    inputTokens: inTok,
    outputTokens: outTok,
    upstreamRequestId: json.id,
    costSource: "provider_response",
  });
  const chargedCostUsd = finalizedCustomerChargeUsd(finalization);

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
        chargedCostUsd,
        latencyMs: latency,
        model: json.model ?? model,
        meta: {
          tokens: { input: inTok, output: outTok },
          rawContentSample: content.slice(0, 500),
        },
        // openrouter responded, schema enforcement failed downstream.
        // Counts as a transform-step failure for the step's ok=false but
        // we still tag the apiLog so analytics reflect the real call.
        apiLog: { provider: "openrouter", action: "transform" },
      };
    }
  }

  return {
    ok: true,
    output,
    costUsd: cost,
    chargedCostUsd,
    latencyMs: latency,
    model: json.model ?? model,
    meta: { tokens: { input: inTok, output: outTok } },
    apiLog: { provider: "openrouter", action: "transform" },
  };
}

async function runDecide(args: PrimitiveArgs): Promise<StepResult> {
  const { config, inputs } = args;
  const model: string = config?.model ?? "anthropic/claude-haiku-4-5";
  const systemPrompt: string = config?.systemPrompt ?? "";
  const userPromptTemplate: string = config?.userPromptTemplate ?? "";
  const choices: string[] = Array.isArray(config?.choices) ? config.choices : [];

  if (choices.length === 0) {
    return {
      ok: false,
      error: "decide:no_choices_configured",
      costUsd: 0,
      latencyMs: 0,
    };
  }

  // decide is a constrained-output transform: the model picks exactly one
  // value from `choices`. We delegate to runTransform with a forced enum
  // schema and unwrap the .choice field on the way out. The branch logic
  // in runV2 expects a primitive value (string), so we surface the
  // chosen value as `result.output` directly rather than the wrapper.
  const judge = await runTransform({
    ctx: args.ctx,
    convexCtx: args.convexCtx,
    config: {
      model,
      systemPrompt:
        (systemPrompt ? systemPrompt + "\n\n" : "") +
        `Return only the JSON shape required. Choose exactly one value from the enum.`,
      userPromptTemplate,
      outputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["choice"],
        properties: {
          choice: { type: "string", enum: choices },
        },
      },
      temperature: 0.0,
    },
    inputs,
  });

  if (!judge.ok || typeof judge.output !== "object" || judge.output == null) {
    return {
      ok: false,
      error: judge.error ?? "decide_classifier_failed",
      costUsd: judge.costUsd,
      chargedCostUsd: judge.chargedCostUsd,
      latencyMs: judge.latencyMs,
      model: judge.model,
      meta: judge.meta,
      apiLog: judge.apiLog
        ? { provider: judge.apiLog.provider, action: "decide" }
        : undefined,
    };
  }

  const verdict = judge.output as { choice: string };
  if (!choices.includes(verdict.choice)) {
    return {
      ok: false,
      error: `decide:choice_not_in_enum:${verdict.choice}`,
      costUsd: judge.costUsd,
      chargedCostUsd: judge.chargedCostUsd,
      latencyMs: judge.latencyMs,
      model: judge.model,
      meta: judge.meta,
      apiLog: { provider: "openrouter", action: "decide" },
    };
  }

  return {
    ok: true,
    output: verdict.choice,                  // surface raw string so branchOn matches it
    costUsd: judge.costUsd,
    chargedCostUsd: judge.chargedCostUsd,
    latencyMs: judge.latencyMs,
    model: judge.model,
    meta: { ...(judge.meta ?? {}), choices },
    apiLog: { provider: "openrouter", action: "decide" },
  };
}

function getByPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function evaluateRule(rule: any, input: any): { pass: boolean; reason: string } {
  const type = rule?.type;
  if (type === "field_present") {
    const path = rule.field;
    const val = getByPath(input, path);
    return val != null && val !== ""
      ? { pass: true, reason: "" }
      : { pass: false, reason: `field "${path}" missing or empty` };
  }
  if (type === "min_length") {
    const path = rule.field;
    const val = getByPath(input, path);
    const len =
      typeof val === "string"
        ? val.length
        : Array.isArray(val)
          ? val.length
          : 0;
    const min = rule.min ?? 1;
    return len >= min
      ? { pass: true, reason: "" }
      : { pass: false, reason: `"${path}" length ${len} < ${min}` };
  }
  if (type === "contains_substring") {
    const path = rule.field;
    const val = getByPath(input, path);
    const sub = rule.substring;
    return typeof val === "string" && val.includes(sub)
      ? { pass: true, reason: "" }
      : { pass: false, reason: `"${path}" missing substring "${sub}"` };
  }
  if (type === "regex_match") {
    const path = rule.field;
    const val = getByPath(input, path);
    try {
      const re = new RegExp(rule.pattern, rule.flags ?? "");
      return typeof val === "string" && re.test(val)
        ? { pass: true, reason: "" }
        : { pass: false, reason: `"${path}" fails pattern /${rule.pattern}/` };
    } catch (e) {
      return { pass: false, reason: `invalid regex pattern "${rule.pattern}"` };
    }
  }
  return { pass: false, reason: `unknown rule type: ${type}` };
}

async function runValidate(args: PrimitiveArgs): Promise<StepResult> {
  const { config, inputs } = args;
  const mode: string = config?.mode ?? "rules";
  const startedAt = Date.now();

  if (mode === "rules") {
    const rules: any[] = config?.rules ?? [];
    const failures: string[] = [];
    for (const rule of rules) {
      const result = evaluateRule(rule, inputs);
      if (!result.pass) failures.push(result.reason);
    }
    return {
      ok: failures.length === 0,
      output: { pass: failures.length === 0, failures },
      failures: failures.length > 0 ? failures : undefined,
      costUsd: 0,
      latencyMs: Date.now() - startedAt,
    };
  }

  if (mode === "llm") {
    const model: string = config?.model ?? "anthropic/claude-haiku-4-5";
    const contract: string = config?.contract ?? "";
    const judgePromptTemplate: string = config?.judgePromptTemplate ?? "";

    // The judge prompt has access to the validate-step's resolved inputs
    // (the candidate output) plus the contract text under {{contract}}.
    const promptCtx = { input: inputs, contract };
    const userText = String(resolveBindings(judgePromptTemplate, promptCtx) ?? "");

    const judge = await runTransform({
      ctx: args.ctx,
      convexCtx: args.convexCtx,
      config: {
        model,
        systemPrompt:
          "You are a strict quality judge. Return only the JSON shape required. " +
          "Set pass=true if every contract requirement is met; otherwise pass=false " +
          "and list specific, actionable failure messages in failures[].",
        userPromptTemplate: userText,
        outputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["pass", "failures"],
          properties: {
            pass: { type: "boolean" },
            failures: { type: "array", items: { type: "string" } },
          },
        },
        temperature: 0.0,
      },
      inputs: {},
    });

    if (!judge.ok || typeof judge.output !== "object" || judge.output == null) {
      return {
        ok: false,
        error: judge.error ?? "validate_llm_judge_failed",
        costUsd: judge.costUsd,
        chargedCostUsd: judge.chargedCostUsd,
        latencyMs: judge.latencyMs,
        model: judge.model,
        meta: judge.meta,
      };
    }

    const verdict = judge.output as { pass: boolean; failures: string[] };
    return {
      ok: verdict.pass === true,
      output: verdict,
      failures: verdict.failures && verdict.failures.length > 0 ? verdict.failures : undefined,
      costUsd: judge.costUsd,
      chargedCostUsd: judge.chargedCostUsd,
      latencyMs: judge.latencyMs,
      model: judge.model,
      meta: judge.meta,
    };
  }

  return {
    ok: false,
    error: `validate:unknown_mode:${mode}`,
    costUsd: 0,
    latencyMs: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Web Crypto AES-256-GCM decryption helper
//
// Mirrors src/crypto.ts on the npm side. Format: "ivHex:tagHex:dataHex" with
// IV=16 bytes, tag=16 bytes, AES-256-GCM, key=32-byte hex from
// APICLAW_KEY_ENCRYPTION_SECRET. Web Crypto expects ciphertext || tag
// concatenated, so we splice the auth tag onto the data before calling
// crypto.subtle.decrypt.
// ─────────────────────────────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

async function decryptManagedKey(encryptedKey: string): Promise<string> {
  const secret = process.env.APICLAW_KEY_ENCRYPTION_SECRET;
  if (!secret) throw new Error("APICLAW_KEY_ENCRYPTION_SECRET_missing");
  if (secret.length !== 64) {
    throw new Error("APICLAW_KEY_ENCRYPTION_SECRET_invalid_length");
  }

  const parts = encryptedKey.split(":");
  if (parts.length !== 3) throw new Error("invalid_encrypted_key_format");
  const [ivHex, tagHex, dataHex] = parts;
  if (!ivHex || !tagHex || !dataHex) throw new Error("invalid_encrypted_key_format");

  const keyBytes = hexToBytes(secret);
  const iv = hexToBytes(ivHex);
  const tag = hexToBytes(tagHex);
  const data = hexToBytes(dataHex);

  const combined = new Uint8Array(data.length + tag.length);
  combined.set(data, 0);
  combined.set(tag, data.length);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes as BufferSource,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    cryptoKey,
    combined as BufferSource,
  );

  return new TextDecoder().decode(plaintextBuffer);
}

// Replace {token} placeholders in a path with values from params. Returns
// the modified path plus the set of param keys that were consumed by the
// path so the caller can omit them from query/body.
function substitutePathParams(
  path: string,
  params: Record<string, unknown>,
): { path: string; consumed: Set<string> } {
  const consumed = new Set<string>();
  const out = path.replace(/\{([^}]+)\}/g, (_m, name) => {
    consumed.add(name);
    const v = params[name];
    return v == null ? "" : encodeURIComponent(String(v));
  });
  return { path: out, consumed };
}

// Lookup the providerDirectCall config + matching providerAction for a
// (providerName, actionName) pair. Public-ish surface kept on the action
// itself; the internal query just reads rows.
// ─────────────────────────────────────────────────────────────────────────────
// IV-format migration (one-shot)
//
// Existing encryptedMasterKey rows were written by src/crypto.ts when it
// used 16-byte IVs. Web Crypto on Convex enforces 12-byte IVs for AES-GCM,
// so the on-Convex execute primitive can't decrypt those rows. These two
// helpers let a local Node script re-encrypt every row using the new
// 12-byte IV format without ever decoding plaintext on the wire:
//   1. listEncryptedRoutingForMigration returns (_id, encryptedMasterKey)
//      pairs to the script
//   2. script decrypts with Node (handles 16-byte IVs), re-encrypts with
//      the updated src/crypto.ts (12-byte IV), and patches each row via
//   3. patchEncryptedMasterKey
// Internal-only; both remove themselves from the public surface after.

export const listEncryptedRoutingForMigration = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("providerDirectCall").collect();
    return rows.map((r) => ({
      _id: r._id,
      providerId: r.providerId,
      encryptedMasterKey: r.encryptedMasterKey,
    }));
  },
});

// Audit query for the security cleanup: joins providerDirectCall against
// providers so the audit script can show provider name + status alongside
// the encryptedMasterKey format. The actual secret value is returned so
// the local script can decide if a plaintext value should be re-encrypted
// before deletion — plaintext keys never leave the developer's machine.
export const auditEncryptedRouting = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("providerDirectCall").collect();
    const providers = await ctx.db.query("providers").collect();
    const providerById = new Map(providers.map((p) => [p._id, p]));

    return rows.map((r) => {
      const p = providerById.get(r.providerId);
      return {
        rowId: r._id,
        providerId: r.providerId,
        providerName: p?.name ?? "(unknown)",
        providerStatus: p?.status ?? "(unknown)",
        routingStatus: r.status,
        baseUrl: r.baseUrl,
        encryptedMasterKey: r.encryptedMasterKey,
        keyLength: r.encryptedMasterKey?.length ?? 0,
      };
    });
  },
});

// Re-encrypt a row's encryptedMasterKey with a fresh ciphertext built by
// the local audit script. Same shape as patchEncryptedMasterKey but
// distinct name so the audit log shows the security-cleanup origin.
export const reencryptRoutingKey = internalMutation({
  args: {
    rowId: v.id("providerDirectCall"),
    newEncryptedMasterKey: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.rowId, {
      encryptedMasterKey: args.newEncryptedMasterKey,
      updatedAt: Date.now(),
    });
  },
});

// Delete a row outright. Used for the placeholder cleanup path. The row's
// providerAPIs neighbour stays — it may still be discovery-listed; only
// the routing config goes away.
export const deleteRoutingRow = internalMutation({
  args: { rowId: v.id("providerDirectCall") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.rowId);
  },
});

// Mark a row as draft so /v1/call won't route through it. Used to retire
// placeholder routing rows that hold neither a real key nor a sentinel
// without deleting them — keeps the providerAPIs row's history intact.
export const setRoutingStatus = internalMutation({
  args: { rowId: v.id("providerDirectCall"), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.rowId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const patchEncryptedMasterKey = internalMutation({
  args: {
    rowId: v.id("providerDirectCall"),
    encryptedMasterKey: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.rowId, {
      encryptedMasterKey: args.encryptedMasterKey,
      updatedAt: Date.now(),
    });
  },
});

export const lookupManagedAction = internalQuery({
  args: { providerName: v.string(), actionName: v.string() },
  handler: async (ctx, { providerName, actionName }) => {
    // Find the provider row by name. Convex doesn't store the provider
    // slug separately from "name" so we match case-insensitive.
    const allProviders = await ctx.db.query("providers").collect();
    const provider = resolveMissionProviderById(allProviders, providerName);
    if (!provider) return null;

    const dc = await ctx.db
      .query("providerDirectCall")
      .withIndex("by_providerId", (q) => q.eq("providerId", provider._id))
      .first();
    if (!dc || dc.status !== "live") return null;

    const registeredAction = await ctx.db
      .query("providerActions")
      .withIndex("by_directCallId_name", (q) =>
        q.eq("directCallId", dc._id).eq("name", actionName),
      )
      .first();
    const action = resolveMissionProviderAction(
      providerName,
      actionName,
      registeredAction,
    );
    if (!action) return null;

    return {
      providerName: provider.name,
      baseUrl: dc.baseUrl,
      authType: dc.authType,
      authHeader: dc.authHeader,
      authPrefix: dc.authPrefix,
      encryptedMasterKey: dc.encryptedMasterKey,
      action,
    };
  },
});

async function runExecute(args: PrimitiveArgs): Promise<StepResult> {
  const { config, inputs } = args;
  const requestedProviderName: string = config?.providerId ?? "";
  const actionName: string = config?.actionName ?? "";
  const providerId = canonicalProviderId(requestedProviderName);

  if (!providerId || !actionName) {
    return {
      ok: false,
      error: "execute:missing_providerId_or_actionName",
      costUsd: 0,
      latencyMs: 0,
    };
  }
  if (!args.convexCtx) {
    return {
      ok: false,
      error: "execute:convex_ctx_missing",
      costUsd: 0,
      latencyMs: 0,
    };
  }

  const apiLog = { provider: providerId, action: actionName };
  const cfg = await args.convexCtx.runQuery(
    internal.missionRunner.lookupManagedAction,
    { providerName: requestedProviderName, actionName },
  );
  if (!cfg) {
    return {
      ok: false,
      error: `execute:managed_action_not_found:${providerId}.${actionName}`,
      costUsd: 0,
      latencyMs: 0,
    };
  }

  let plainKey: string;
  try {
    const environmentKey = providerId === "brave_search"
      ? process.env.BRAVE_API_KEY
      : undefined;
    plainKey = environmentKey || await decryptManagedKey(cfg.encryptedMasterKey);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "decrypt_failed";
    return {
      ok: false,
      error: `execute:decrypt:${msg}`,
      costUsd: 0,
      latencyMs: 0,
      apiLog,
    };
  }

  const inputParams: Record<string, unknown> =
    inputs && typeof inputs === "object" ? inputs as Record<string, unknown> : {};
  let serializedInputs: string;
  try {
    serializedInputs = JSON.stringify(inputParams);
  } catch (e) {
    return {
      ok: false,
      error: `execute:inputs_not_serializable:${e instanceof Error ? e.message : "invalid"}`,
      costUsd: 0,
      latencyMs: 0,
      apiLog,
    };
  }
  if (new TextEncoder().encode(serializedInputs).byteLength > MAX_MISSION_PROVIDER_INPUT_BYTES) {
    return {
      ok: false,
      error: "execute:input_too_large",
      costUsd: 0,
      latencyMs: 0,
      apiLog,
    };
  }

  const { path: substitutedPath, consumed } = substitutePathParams(
    cfg.action.path,
    inputParams,
  );
  const paramSpec: Array<{ name: string; in: string }> = Array.isArray(cfg.action.params)
    ? cfg.action.params
    : [];
  const paramByName = new Map(paramSpec.map((param) => [param.name, param.in]));
  const queryParams: Record<string, string> = {};
  const bodyParams: Record<string, unknown> = {};
  const method = (cfg.action.method ?? "POST").toUpperCase();

  for (const [name, value] of Object.entries(inputParams)) {
    if (consumed.has(name)) continue;
    const bucket = paramByName.get(name) ?? (method === "GET" ? "query" : "body");
    if (bucket === "query") {
      if (value != null) {
        const upstreamName = providerId === "brave_search" &&
          actionName === "search" && name === "query"
          ? "q"
          : name;
        queryParams[upstreamName] = String(value);
      }
    } else {
      bodyParams[name] = value;
    }
  }

  let url: URL;
  try {
    url = substitutedPath.startsWith("/")
      ? new URL(substitutedPath, cfg.baseUrl)
      : new URL(
          substitutedPath,
          cfg.baseUrl.endsWith("/") ? cfg.baseUrl : `${cfg.baseUrl}/`,
        );
  } catch {
    return {
      ok: false,
      error: `execute:bad_url:${cfg.baseUrl}${substitutedPath}`,
      costUsd: 0,
      latencyMs: 0,
      apiLog,
    };
  }
  const expectedOrigin = MANAGED_MISSION_PROVIDER_ORIGINS[providerId];
  if (!expectedOrigin || url.origin !== expectedOrigin) {
    return {
      ok: false,
      error: "execute:provider_origin_not_approved",
      costUsd: 0,
      latencyMs: 0,
      apiLog,
    };
  }
  for (const [name, value] of Object.entries(queryParams)) {
    url.searchParams.set(name, value);
  }

  const hasRequestBody = method !== "GET" && method !== "DELETE";
  const authHeader = cfg.authHeader || (providerId === "brave_search"
    ? "X-Subscription-Token"
    : "Authorization");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    [authHeader]: `${cfg.authPrefix ?? ""}${plainKey}`,
  };
  let requestBody: string | undefined;
  let requestFingerprint: string;
  let preparedRequest: Request;
  try {
    requestBody = hasRequestBody ? JSON.stringify(bodyParams) : undefined;
    requestFingerprint = await deriveRequestFingerprint({
      provider: providerId,
      action: actionName,
      method,
      url: url.toString(),
      body: hasRequestBody ? bodyParams : null,
    });
    preparedRequest = new Request(url, {
      method,
      headers,
      redirect: "error",
      body: requestBody,
    });
  } catch (e) {
    return {
      ok: false,
      error: `execute:request_prepare:${e instanceof Error ? e.message : "invalid"}`,
      costUsd: 0,
      latencyMs: 0,
      apiLog,
    };
  }

  const reservationUsd = estimateManagedProviderCostUsd({
    provider: providerId,
    action: actionName,
    estimatedInputTokens: estimateInputTokens(inputParams),
  });
  const fixedProviderCostUsd = verifiedFixedManagedProviderCostUsd({
    provider: providerId,
    action: actionName,
  });
  const authorization = await args.convexCtx.runMutation(
    (internal as any).managedUsage.authorizeManagedCall,
    {
      workspaceId: args.ctx.workspaceId,
      requestId: crypto.randomUUID(),
      requestFingerprint,
      provider: providerId,
      action: actionName,
      path: `/missions/${String(args.ctx.missionId)}/execute`,
      estimatedProviderCostUsd: reservationUsd,
      billingGradeCost: hasBillingGradeManagedCost({ provider: providerId, action: actionName }),
      trafficClass: args.ctx.trafficClass,
    },
  );
  if (!authorization?.allowed) {
    return {
      ok: false,
      error: `managed_usage_blocked:${authorization?.reason || "unknown"}`,
      costUsd: 0,
      latencyMs: 0,
      apiLog,
      meta: { managedUsage: authorization?.reason || "blocked" },
    };
  }

  const finalize = async (details: {
    success: boolean;
    providerCostUsd?: number;
    costSource: ManagedCostSource;
  }) => {
    return await args.convexCtx.runMutation((internal as any).managedUsage.finalizeManagedCall, {
      ledgerId: authorization.ledgerId,
      provider: providerId,
      ...details,
    });
  };
  const successfulCost = resolveManagedResponseCost({
    provider: providerId,
    responseOk: true,
    fixedProviderCostUsd,
  });
  const realizedCostUsd = successfulCost.providerCostUsd ?? 0;
  const finalizeSuccessfulResponse = async () => finalize({
    success: true,
    providerCostUsd: successfulCost.providerCostUsd,
    costSource: successfulCost.costSource,
  });

  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch(preparedRequest, { signal: AbortSignal.timeout(60_000) });
  } catch (e) {
    await finalize({ success: true, costSource: "reservation" });
    return {
      ok: false,
      error: `execute:network:${e instanceof Error ? e.message : "fetch_failed"}`,
      costUsd: 0,
      latencyMs: Date.now() - startedAt,
      apiLog,
    };
  }
  const latency = Date.now() - startedAt;

  if (!res.ok) {
    const responseText = await readMissionResponseTextCapped(res).catch(() => "");
    await finalize({ success: false, providerCostUsd: 0, costSource: "zero_cost" });
    return {
      ok: false,
      error: `execute_${res.status}:${responseText.slice(0, 200)}`,
      costUsd: 0,
      latencyMs: latency,
      meta: { status: res.status },
      apiLog,
    };
  }

  let output: unknown;
  try {
    const responseText = await readMissionResponseTextCapped(res);
    const contentType = res.headers.get("content-type") ?? "";
    output = contentType.includes("application/json")
      ? JSON.parse(responseText)
      : responseText;
  } catch (e) {
    const finalization = await finalizeSuccessfulResponse();
    return {
      ok: false,
      error: e instanceof MissionResponseTooLargeError
        ? "execute:response_too_large"
        : `execute_parse:${e instanceof Error ? e.message : "parse_failed"}`,
      costUsd: realizedCostUsd,
      chargedCostUsd: finalizedCustomerChargeUsd(finalization),
      latencyMs: latency,
      meta: { status: res.status },
      apiLog,
    };
  }

  const finalization = await finalizeSuccessfulResponse();
  return {
    ok: true,
    output,
    costUsd: realizedCostUsd,
    chargedCostUsd: finalizedCustomerChargeUsd(finalization),
    latencyMs: latency,
    meta: { status: res.status },
    apiLog,
  };
}

export const runTransformForTest = runTransform;
export const runExecuteForTest = runExecute;

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
      result: m.result,
      error: m.error,
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

// One apiLogs row per primitive call. This is what providerHealth
// aggregates and what workspace analytics surfaces — without it, mission
// steps would be invisible to every existing stats pipeline. Direction
// is parameterised so the same mutation handles both the outbound row on
// the caller workspace and the inbound row on the provider-owner
// workspace for managed providers.
export const writeStepApiLog = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    provider: v.string(),
    action: v.string(),
    status: v.union(v.literal("success"), v.literal("error")),
    latencyMs: v.number(),
    errorMessage: v.optional(v.string()),
    direction: v.optional(v.union(v.literal("outbound"), v.literal("inbound"))),
    callerWorkspaceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("apiLogs", {
      workspaceId: args.workspaceId,
      sessionToken: "",
      provider: args.provider,
      action: args.action,
      status: args.status,
      latencyMs: args.latencyMs,
      errorMessage: args.errorMessage,
      direction: args.direction ?? "outbound",
      callerWorkspaceId: args.callerWorkspaceId,
      createdAt: Date.now(),
    });
  },
});

// Resolve the owner workspace of a managed provider by name. Returns
// null when the provider isn't registered (e.g. raw third-party hostnames
// from fetch http with no attributeAs override). The runner uses this to
// dual-log inbound traffic on the provider-owner side automatically.
export const lookupProviderOwnerWorkspace = internalQuery({
  args: { providerName: v.string() },
  handler: async (ctx, { providerName }) => {
    const providers = await ctx.db.query("providers").collect();
    const provider = providers.find(
      (p) => p.name.toLowerCase() === providerName.toLowerCase(),
    );
    if (!provider || !(provider as any).workspaceId) return null;
    return (provider as any).workspaceId as string;
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
// Template seed: prd-generation
//
// First template that exercises the full v2 path:
//   registered GenPRD provider action -> validate (rules check on returned PRD)
//
// Provider credentials stay behind the managed-action boundary. Idempotent via
// slug + version.
// ─────────────────────────────────────────────────────────────────────────────

export const seedPRDTemplate = internalMutation({
  args: {},
  handler: async (ctx) => {
    const ownerWs = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", "gustav@nordsym.com"))
      .first();
    if (!ownerWs) throw new Error("owner_workspace_not_found");

    const now = Date.now();
    const tmpl = {
      slug: "prd-generation",
      version: 1,
      ownerWorkspaceId: ownerWs._id,
      // Internal until GenPRD exposes a verified exact/fixed cost contract.
      visibility: "private" as const,
      title: "Generate PRD",
      description:
        "Generate a structured Markdown PRD via genprd.se with a rule-based quality gate.",
      inputSchema: {
        type: "object",
        required: ["topic"],
        properties: {
          topic: { type: "string" },
          audience: { type: "string" },
          constraints: { type: "string" },
          model: { type: "string" },
          format: { type: "string", enum: ["lean", "standard", "detailed"] },
        },
      },
      outputSchema: {
        type: "object",
        required: ["prd"],
        properties: {
          prd: { type: "string" },
          model: { type: "string" },
          tokens: {
            type: "object",
            properties: {
              input: { type: "number" },
              output: { type: "number" },
            },
          },
        },
      },
      contractAssertions: [],
      resultStepId: "generate",
      steps: [
        {
          id: "generate",
          kind: "fetch",
          inputs: {
            topic: "{{params.topic}}",
            audience: "{{params.audience}}",
            constraints: "{{params.constraints}}",
            model: "{{params.model}}",
            format: "{{params.format}}",
          },
          config: {
            source: "providerAction",
            providerId: "GenPRD",
            actionName: "generate_prd",
            attributeAs: "genprd",
          },
        },
        {
          id: "qualityCheck",
          kind: "validate",
          inputs: {
            prd: "{{steps.generate.output.prd}}",
          },
          config: {
            mode: "rules",
            rules: [
              { type: "field_present", field: "prd" },
              { type: "min_length", field: "prd", min: 500 },
              { type: "contains_substring", field: "prd", substring: "Goals" },
              { type: "contains_substring", field: "prd", substring: "User Stories" },
            ],
          },
        },
      ],
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    const existing = await ctx.db
      .query("missionTemplates")
      .withIndex("by_slug_version", (q) =>
        q.eq("slug", "prd-generation").eq("version", 1),
      )
      .first();

    if (existing) {
      const { createdAt: _omit, ...rest } = tmpl;
      await ctx.db.patch(existing._id, rest);
      return { ok: true, id: existing._id, note: "patched" };
    }
    const id = await ctx.db.insert("missionTemplates", tmpl);
    return { ok: true, id, note: "created" };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Smoke harness for the full v2 pipeline against the prd-generation template
//
// Creates an ephemeral mission row, runs it through runV2, returns the
// final status + cost + result snippet. Owner workspace (Gustav) so margin
// is zero and isInternal=true.
//
// Run: npx convex run missionRunner:smokePRDTemplate '{"topic":"AI agents for SMEs"}'
// ─────────────────────────────────────────────────────────────────────────────

export const createSmokeMission = internalMutation({
  args: { topic: v.string() },
  handler: async (ctx, { topic }) => {
    const ownerWs = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", "gustav@nordsym.com"))
      .first();
    if (!ownerWs) throw new Error("owner_workspace_not_found");

    const id = await ctx.db.insert("missions", {
      workspaceId: ownerWs._id,
      template: "prd-generation",
      templateVersion: 1,
      title: `[smoke] PRD for ${topic.slice(0, 40)}`,
      status: "queued",
      params: { topic, format: "lean" },
      initiator: "cli",
      isInternal: true,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const smokePRDTemplate = internalAction({
  args: { topic: v.string() },
  handler: async (
    ctx,
    { topic },
  ): Promise<{
    missionId: Id<"missions">;
    run: {
      ok: boolean;
      status: string;
      underlyingCostUsd: number;
      chargedCostUsd: number;
      error?: string;
    };
    finalResultSample: string;
  }> => {
    const missionId: Id<"missions"> = await ctx.runMutation(
      internal.missionRunner.createSmokeMission,
      { topic },
    );
    const run = await ctx.runAction(internal.missionRunner.runV2, { missionId });
    const finalMission = await ctx.runQuery(internal.missionRunner.getMissionForRun, {
      missionId,
    });
    const result = (finalMission as any)?.result ?? null;
    const sample =
      result && typeof result === "object" && typeof (result as any).prd === "string"
        ? ((result as any).prd as string).slice(0, 240) + "..."
        : JSON.stringify(result).slice(0, 240);
    return { missionId, run, finalResultSample: sample };
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

// Smoke harness for the execute primitive against a real managed
// provider. Confirms the on-Convex Web Crypto decryption path matches
// the npm-side src/crypto.ts format and that managed routing works
// end-to-end through providerDirectCall + providerActions.
//
// Run: npx convex run missionRunner:smokeExecute '{"topic":"smoke"}'
export const smokeExecute = internalAction({
  args: { topic: v.string() },
  handler: async (ctx, { topic }): Promise<StepResult> => {
    return await runExecute({
      ctx: {
        missionId: "smoke" as unknown as Id<"missions">,
        workspaceId: "smoke" as unknown as Id<"workspaces">,
      },
      convexCtx: ctx,
      config: { providerId: "GenPRD", actionName: "generate_prd" },
      inputs: { topic, format: "lean" },
    });
  },
});

export const smokeTransform = internalAction({
  args: { topic: v.string() },
  handler: async (ctx, { topic }): Promise<StepResult> => {
    return await runTransform({
      ctx: {
        missionId: "smoke" as unknown as Id<"missions">,
        workspaceId: "smoke" as unknown as Id<"workspaces">,
      },
      convexCtx: ctx,
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
    let chargedCost = 0;
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
        await ctx.runMutation(internal.missionRunner.markFailed, {
          missionId,
          error: `unknown_primitive:${step.kind}`,
          underlyingCostUsd: underlyingCost,
          chargedCostUsd: chargedCost,
        });
        return {
          ok: false,
          status: "failed",
          underlyingCostUsd: underlyingCost,
          chargedCostUsd: chargedCost,
          error: `unknown_primitive:${step.kind}`,
        };
      }

      // env is injected fresh per step from the process.env allowlist; it
      // is never persisted into mission.state so secrets stay off the DB.
      const bindCtx = { ...state, env: getAllowedEnv() };
      const resolvedInputs = resolveBindings(step.inputs, bindCtx);

      const result: StepResult = await handler({
        ctx: {
          missionId,
          workspaceId: mission.workspaceId,
          trafficClass: mission.isInternal ? "internal" : "customer",
        },
        convexCtx: ctx,
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
      chargedCost += result.chargedCostUsd ?? 0;

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

      // Persist an apiLogs row whenever the primitive made an external call.
      // This is the bridge from mission-events (internal observability) to
      // apiLogs (the stats substrate shared by providerHealth, workspace
      // analytics, and every other consumer of the /v1/* surfaces).
      if (result.apiLog) {
        // Outbound row on the caller workspace.
        await ctx.runMutation(internal.missionRunner.writeStepApiLog, {
          workspaceId: mission.workspaceId,
          provider: result.apiLog.provider,
          action: result.apiLog.action,
          status: result.ok ? "success" : "error",
          latencyMs: result.latencyMs,
          errorMessage: result.error,
          direction: "outbound",
        });

        // If the provider tag matches a registered managed provider,
        // mirror the call onto the provider-owner workspace as inbound.
        // This is the same dual-logging contract logGenPRDCall implemented
        // by hand for GenPRD, but generalised to every managed provider.
        const ownerWsId: string | null = await ctx.runQuery(
          internal.missionRunner.lookupProviderOwnerWorkspace,
          { providerName: result.apiLog.provider },
        );
        if (ownerWsId && ownerWsId !== (mission.workspaceId as unknown as string)) {
          await ctx.runMutation(internal.missionRunner.writeStepApiLog, {
            workspaceId: ownerWsId as any,
            provider: result.apiLog.provider,
            action: result.apiLog.action,
            status: result.ok ? "success" : "error",
            latencyMs: result.latencyMs,
            errorMessage: result.error,
            direction: "inbound",
            callerWorkspaceId: mission.workspaceId as unknown as string,
          });
        }
      }

      // Budget check
      if (
        mission.budgetUsd != null &&
        underlyingCost > mission.budgetUsd
      ) {
        await ctx.runMutation(internal.missionRunner.markFailed, {
          missionId,
          error: "budget_exceeded",
          underlyingCostUsd: underlyingCost,
          chargedCostUsd: chargedCost,
        });
        return {
          ok: false,
          status: "failed",
          underlyingCostUsd: underlyingCost,
          chargedCostUsd: chargedCost,
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
          await ctx.runMutation(internal.missionRunner.markFailed, {
            missionId,
            error: result.error ?? `step_failed:${step.id}`,
            underlyingCostUsd: underlyingCost,
            chargedCostUsd: chargedCost,
          });
          return {
            ok: false,
            status: "failed",
            underlyingCostUsd: underlyingCost,
            chargedCostUsd: chargedCost,
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

    // Final result: prefer the template's declared resultStepId; otherwise
    // fall back to the last step's output. validate-as-last-step is the
    // common case but it returns {pass, failures} rather than the payload
    // a caller actually wants, so authors almost always want to point at
    // the producing step explicitly.
    const declaredResultStepId = (template as any).resultStepId as string | undefined;
    const finalStepId =
      declaredResultStepId && state.steps[declaredResultStepId]
        ? declaredResultStepId
        : steps.length > 0
          ? steps[steps.length - 1].id
          : null;
    const finalResult =
      finalStepId && state.steps[finalStepId]
        ? state.steps[finalStepId].output
        : state.steps;

    const finalStatus = needsRevision ? "needs_revision" : "completed";

    await ctx.runMutation(internal.missionRunner.markComplete, {
      missionId,
      status: finalStatus,
      result: finalResult,
      underlyingCostUsd: underlyingCost,
      chargedCostUsd: chargedCost,
    });

    return {
      ok: true,
      status: finalStatus,
      underlyingCostUsd: underlyingCost,
      chargedCostUsd: chargedCost,
    };
  },
});
