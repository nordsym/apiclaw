import { resolveFrontierModelCost } from "./modelPricing";

// Reservations are intentionally conservative. Fixed/near-fixed providers can
// participate in the free activation allowance. Variable-cost actions remain
// fail-closed until PAYG is active or a request-specific estimate is supplied.
const FIXED_PROVIDER_RESERVATIONS_USD: Record<string, number> = {
  brave_search: 0.005,
  serper: 0.001,
  firecrawl: 0.02,
  deepgram: 0.01,
  assemblyai: 0.01,
  github: 0,
  nasa: 0,
  apilayer: 0.01,
  coingecko: 0,
  resend: 0.001,
  genprd: 0.04,
};

const LLM_PROVIDERS = new Set([
  "llm",
  "auto",
  "openrouter",
  "groq",
  "mistral",
  "together",
  "deepinfra",
  "openai",
  "xai",
  "anthropic",
]);

const LLM_ACTIONS = new Set([
  "chat",
  "chat_completions",
  "responses",
  "messages",
]);

// These are realized per-call costs, not reservation guesses. Keep this list
// deliberately small: adding an adapter here makes it eligible for customer
// PAYG after the activation allowance is exhausted.
const VERIFIED_FIXED_PROVIDER_COSTS_USD: Record<string, Record<string, number>> = {
  brave_search: { search: 0.005 },
};

const VERIFIED_ZERO_COST_PROVIDERS = new Set([
  "coingecko",
  "github",
  "nasa",
  "openai-codex",
]);

export const APICLAW_OPENROUTER_DEFAULT_MODEL = "anthropic/claude-sonnet-4-6";

export function resolveExplicitOpenRouterModel(requestedModel: unknown): string | undefined {
  if (typeof requestedModel !== "string") return undefined;
  const value = requestedModel.trim();
  const match = value.match(/^(?:apiclaw\/)?openrouter\/(.+)$/i);
  if (!match) return undefined;
  const model = match[1].trim();
  if (!model) return undefined;
  // APIClaw's documented `openrouter/auto` is a stable priced default, not
  // OpenRouter's dynamic router. Dynamic auto remains disabled until APIClaw
  // can enforce a provider-side maximum price before activation spend.
  return model.toLowerCase() === "auto"
    ? APICLAW_OPENROUTER_DEFAULT_MODEL
    : model;
}

export function resolveExplicitOpenRouterTarget(
  requestedModel: unknown,
): { provider: "openrouter"; model: string } | undefined {
  const model = resolveExplicitOpenRouterModel(requestedModel);
  return model ? { provider: "openrouter", model } : undefined;
}

export function resolveExplicitOpenRouterExecution(input: {
  provider: unknown;
  action: unknown;
  requestedModel: unknown;
}): { provider: "openrouter"; model: string; routingModel: string } | undefined {
  if (input.action !== "chat") return undefined;
  const explicitTarget = resolveExplicitOpenRouterTarget(input.requestedModel);
  if (input.provider !== "openrouter" && !explicitTarget) return undefined;

  const requested = typeof input.requestedModel === "string"
    ? input.requestedModel.trim()
    : "";
  const model = explicitTarget?.model ||
    (!requested || requested.toLowerCase() === "auto"
      ? APICLAW_OPENROUTER_DEFAULT_MODEL
      : requested);
  return {
    provider: "openrouter",
    model,
    // routeLLMRequest treats this prefix as a hard provider binding and then
    // strips it before dispatch. The billing ledger stores the underlying
    // model so finalization matches the authorization exactly.
    routingModel: `openrouter/${model}`,
  };
}

export type ManagedCostEstimateInput = {
  provider: string;
  action: string;
  model?: string;
  estimatedInputTokens?: number;
  maxOutputTokens?: number;
};

export function estimateManagedProviderCostUsd(input: ManagedCostEstimateInput): number | undefined {
  const provider = input.provider.toLowerCase();
  if (provider === "openai-codex") return 0;
  if (provider === "mission") return 0.04;
  if (input.action === "embeddings") return 0.02;

  if (LLM_PROVIDERS.has(provider) || input.action === "chat" || input.action === "chat_completions" || input.action === "responses" || input.action === "messages") {
    const model = input.model || "";
    const prices = model ? resolveFrontierModelCost(model, input.estimatedInputTokens ?? 0) : undefined;
    if (!prices) return undefined;
    if (
      input.estimatedInputTokens === undefined ||
      !Number.isSafeInteger(input.estimatedInputTokens) ||
      input.estimatedInputTokens < 0 ||
      input.maxOutputTokens === undefined ||
      !Number.isSafeInteger(input.maxOutputTokens) ||
      input.maxOutputTokens <= 0
    ) {
      return undefined;
    }
    const inputTokens = input.estimatedInputTokens;
    // maxOutputTokens must be the limit enforced on the upstream request. It is
    // intentionally required instead of defaulted so this reservation remains
    // a real upper bound rather than a typical-cost guess.
    const outputTokens = input.maxOutputTokens;
    return (inputTokens * prices.input + outputTokens * prices.output) / 1_000_000;
  }

  return FIXED_PROVIDER_RESERVATIONS_USD[provider];
}

// PAYG can only charge from adapters that produce a billing-grade actual
// provider cost. Conservative activation reservations are deliberately not
// treated as customer-billable truth.
export function hasBillingGradeManagedCost(input: ManagedCostEstimateInput): boolean {
  const provider = input.provider.toLowerCase();
  if (input.action === "embeddings") return false;
  if (VERIFIED_ZERO_COST_PROVIDERS.has(provider)) return true;
  if (verifiedFixedManagedProviderCostUsd(input) !== undefined) return true;
  // OpenRouter is the only customer LLM rail whose response contract reports
  // realized provider spend as usage.cost. Direct token-table calculations are
  // estimates because caching and provider-specific discounts are ambiguous.
  return provider === "openrouter" && LLM_ACTIONS.has(input.action);
}

export function verifiedFixedManagedProviderCostUsd(
  input: Pick<ManagedCostEstimateInput, "provider" | "action">,
): number | undefined {
  const provider = input.provider.toLowerCase();
  if (VERIFIED_ZERO_COST_PROVIDERS.has(provider)) return 0;
  return VERIFIED_FIXED_PROVIDER_COSTS_USD[provider]?.[input.action];
}

export type ManagedResponseCostDecision = {
  providerCostUsd?: number;
  costSource:
    | "provider_response"
    | "token_price_table"
    | "fixed_price_policy"
    | "reservation"
    | "zero_cost";
};

export function providerReportedUsageCostUsd(usage: unknown): number | undefined {
  const cost = (usage as { cost?: unknown } | null | undefined)?.cost;
  return typeof cost === "number" && Number.isFinite(cost) && cost >= 0
    ? cost
    : undefined;
}

export function resolveManagedResponseCost(input: {
  provider: string;
  responseOk: boolean;
  fixedProviderCostUsd?: number;
  providerReportedCostUsd?: number;
  tokenTableCostUsd?: number;
}): ManagedResponseCostDecision {
  if (!input.responseOk) {
    return { providerCostUsd: 0, costSource: "zero_cost" };
  }
  if (input.fixedProviderCostUsd !== undefined) {
    return {
      providerCostUsd: input.fixedProviderCostUsd,
      costSource: input.fixedProviderCostUsd === 0 ? "zero_cost" : "fixed_price_policy",
    };
  }
  if (input.providerReportedCostUsd !== undefined) {
    return {
      providerCostUsd: input.providerReportedCostUsd,
      costSource: "provider_response",
    };
  }
  // OpenRouter is billing-grade only when its response includes usage.cost.
  // Token-table math cannot reconstruct caching, routing, or discounts, so a
  // missing actual cost must remain a reconciliation item and never reach
  // Stripe as customer usage.
  if (input.provider.toLowerCase() === "openrouter") {
    return { costSource: "reservation" };
  }
  if (input.tokenTableCostUsd !== undefined) {
    return {
      providerCostUsd: input.tokenTableCostUsd,
      costSource: "token_price_table",
    };
  }
  return { costSource: "reservation" };
}

export function normalizeManagedLlmRequestForCost(
  payload: unknown,
  options: {
    model: string;
    maxOutputTokens: number;
    outputField: "max_tokens" | "max_completion_tokens" | "max_output_tokens";
  },
): Record<string, unknown> {
  const source = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : { input: payload };
  const normalized: Record<string, unknown> = {
    ...source,
    model: options.model,
  };
  delete normalized.max_tokens;
  delete normalized.max_completion_tokens;
  delete normalized.max_output_tokens;
  normalized[options.outputField] = options.maxOutputTokens;
  return normalized;
}

export class UnsafeManagedOpenRouterRequestError extends Error {
  readonly code = "unsafe_openrouter_request";

  constructor(message: string) {
    super(message);
    this.name = "UnsafeManagedOpenRouterRequestError";
  }
}

function textOnlyOpenRouterContent(content: unknown): unknown {
  if (typeof content === "string" || content === null) return content;
  if (!Array.isArray(content)) {
    throw new UnsafeManagedOpenRouterRequestError(
      "Managed OpenRouter chat currently accepts text content only.",
    );
  }
  return content.map((part) => {
    if (
      !part ||
      typeof part !== "object" ||
      (part as Record<string, unknown>).type !== "text" ||
      typeof (part as Record<string, unknown>).text !== "string"
    ) {
      throw new UnsafeManagedOpenRouterRequestError(
        "Managed OpenRouter chat currently accepts text content only.",
      );
    }
    return { type: "text", text: (part as Record<string, unknown>).text };
  });
}

function boundedOpenRouterMessages(messages: unknown): Record<string, unknown>[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new UnsafeManagedOpenRouterRequestError("Managed OpenRouter chat requires messages.");
  }
  return messages.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new UnsafeManagedOpenRouterRequestError("Each OpenRouter message must be an object.");
    }
    const message = value as Record<string, unknown>;
    if (
      typeof message.role !== "string" ||
      !["system", "user", "assistant", "tool"].includes(message.role)
    ) {
      throw new UnsafeManagedOpenRouterRequestError("Unsupported OpenRouter message role.");
    }
    const normalized: Record<string, unknown> = { role: message.role };
    if (message.content !== undefined) normalized.content = textOnlyOpenRouterContent(message.content);
    if (typeof message.name === "string") normalized.name = message.name;
    if (message.role === "tool" && typeof message.tool_call_id === "string") {
      normalized.tool_call_id = message.tool_call_id;
    }
    if (message.role === "assistant" && message.tool_calls !== undefined) {
      if (!Array.isArray(message.tool_calls)) {
        throw new UnsafeManagedOpenRouterRequestError("Invalid OpenRouter tool_calls payload.");
      }
      normalized.tool_calls = message.tool_calls.map((call) => {
        const candidate = call as Record<string, unknown> | null;
        const fn = candidate?.function as Record<string, unknown> | undefined;
        if (
          !candidate ||
          candidate.type !== "function" ||
          typeof candidate.id !== "string" ||
          !fn ||
          typeof fn.name !== "string" ||
          typeof fn.arguments !== "string"
        ) {
          throw new UnsafeManagedOpenRouterRequestError("Invalid OpenRouter function tool call.");
        }
        return {
          id: candidate.id,
          type: "function",
          function: { name: fn.name, arguments: fn.arguments },
        };
      });
    }
    if (normalized.content === undefined && normalized.tool_calls === undefined) {
      throw new UnsafeManagedOpenRouterRequestError("OpenRouter messages require text or tool calls.");
    }
    return normalized;
  });
}

function boundedOpenRouterTools(tools: unknown): Record<string, unknown>[] | undefined {
  if (tools === undefined) return undefined;
  if (!Array.isArray(tools)) {
    throw new UnsafeManagedOpenRouterRequestError("OpenRouter tools must be an array.");
  }
  return tools.map((tool) => {
    const candidate = tool as Record<string, unknown> | null;
    const fn = candidate?.function as Record<string, unknown> | undefined;
    if (
      !candidate ||
      candidate.type !== "function" ||
      !fn ||
      typeof fn.name !== "string" ||
      (fn.description !== undefined && typeof fn.description !== "string") ||
      !fn.parameters ||
      typeof fn.parameters !== "object" ||
      Array.isArray(fn.parameters)
    ) {
      throw new UnsafeManagedOpenRouterRequestError(
        "Managed OpenRouter supports client-declared function tools only.",
      );
    }
    return {
      type: "function",
      function: {
        name: fn.name,
        ...(fn.description === undefined ? {} : { description: fn.description }),
        parameters: fn.parameters,
        ...(typeof fn.strict === "boolean" ? { strict: fn.strict } : {}),
      },
    };
  });
}

function boundedOpenRouterResponseFormat(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new UnsafeManagedOpenRouterRequestError("Invalid OpenRouter response_format.");
  }
  const format = value as Record<string, unknown>;
  if (format.type === "json_object") return { type: "json_object" };
  if (
    format.type === "json_schema" &&
    format.json_schema &&
    typeof format.json_schema === "object" &&
    !Array.isArray(format.json_schema)
  ) {
    return { type: "json_schema", json_schema: format.json_schema };
  }
  throw new UnsafeManagedOpenRouterRequestError(
    "Managed OpenRouter response_format must be json_object or json_schema.",
  );
}

/**
 * Build the only customer-billable OpenRouter request shape APIClaw sends.
 * Cost-amplifying OpenRouter extensions are absent by construction, output is
 * capped, and provider routing is rejected upstream if its per-unit prices
 * exceed the same prices used for APIClaw's reservation.
 */
export function buildCostBoundedOpenRouterRequest(
  payload: unknown,
  options: {
    model: string;
    maxOutputTokens: number;
    maxInputPriceUsdPerMillion: number;
    maxOutputPriceUsdPerMillion: number;
  },
): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new UnsafeManagedOpenRouterRequestError("Managed OpenRouter body must be an object.");
  }
  if (
    !Number.isSafeInteger(options.maxOutputTokens) ||
    options.maxOutputTokens <= 0 ||
    !Number.isFinite(options.maxInputPriceUsdPerMillion) ||
    options.maxInputPriceUsdPerMillion < 0 ||
    !Number.isFinite(options.maxOutputPriceUsdPerMillion) ||
    options.maxOutputPriceUsdPerMillion < 0
  ) {
    throw new UnsafeManagedOpenRouterRequestError("OpenRouter cost bounds are invalid.");
  }

  const source = payload as Record<string, unknown>;
  const request: Record<string, unknown> = {
    model: options.model,
    messages: boundedOpenRouterMessages(source.messages),
    max_tokens: options.maxOutputTokens,
    stream: false,
    service_tier: "default",
    provider: {
      max_price: {
        prompt: options.maxInputPriceUsdPerMillion,
        completion: options.maxOutputPriceUsdPerMillion,
        request: 0,
        image: 0,
      },
    },
  };

  for (const key of ["temperature", "top_p", "frequency_penalty", "presence_penalty"] as const) {
    if (typeof source[key] === "number" && Number.isFinite(source[key])) request[key] = source[key];
  }
  if (Number.isSafeInteger(source.seed)) request.seed = source.seed;
  if (
    typeof source.stop === "string" ||
    (Array.isArray(source.stop) && source.stop.every((item) => typeof item === "string"))
  ) {
    request.stop = source.stop;
  }

  const tools = boundedOpenRouterTools(source.tools);
  if (tools !== undefined) request.tools = tools;
  if (
    source.tool_choice === "auto" ||
    source.tool_choice === "none" ||
    source.tool_choice === "required"
  ) {
    request.tool_choice = source.tool_choice;
  }
  if (typeof source.parallel_tool_calls === "boolean") {
    request.parallel_tool_calls = source.parallel_tool_calls;
  }
  const responseFormat = boundedOpenRouterResponseFormat(source.response_format);
  if (responseFormat !== undefined) request.response_format = responseFormat;

  return request;
}

export function estimateInputTokens(value: unknown): number {
  if (value === undefined || value === null) return 0;
  try {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    if (serialized === undefined) return Number.MAX_SAFE_INTEGER;
    // UTF-8 bytes are a conservative token upper bound for supported text
    // model tokenizers. Character-count / 4 is only a typical estimate and can
    // under-reserve heavily for code, identifiers, or non-ASCII input.
    return new TextEncoder().encode(serialized).byteLength;
  } catch {
    // Cyclic or otherwise non-serializable input must fail closed downstream.
    return Number.MAX_SAFE_INTEGER;
  }
}
