#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  buildCostBoundedOpenRouterRequest,
  estimateInputTokens,
  estimateManagedProviderCostUsd,
  hasBillingGradeManagedCost,
  normalizeManagedLlmRequestForCost,
  providerReportedUsageCostUsd,
  resolveManagedResponseCost,
  resolveEffectiveModel,
  resolveExplicitOpenRouterExecution,
  resolveExplicitOpenRouterModel,
  resolveExplicitOpenRouterTarget,
  verifiedFixedManagedProviderCostUsd,
} from "./managedCostPolicy";

assert.equal(estimateManagedProviderCostUsd({ provider: "brave_search", action: "search" }), 0.005);
assert.equal(estimateManagedProviderCostUsd({ provider: "github", action: "search_repos" }), 0);
assert.equal(estimateManagedProviderCostUsd({ provider: "replicate", action: "run" }), 0.05);
assert.equal(estimateManagedProviderCostUsd({ provider: "stability", action: "generate" }), 0.04);
assert.equal(estimateManagedProviderCostUsd({ provider: "e2b", action: "run_code" }), 0.02);
assert.equal(estimateManagedProviderCostUsd({ provider: "genprd", action: "providerAction" }), 0.04);
assert.equal(hasBillingGradeManagedCost({ provider: "genprd", action: "providerAction" }), false);
assert.equal(hasBillingGradeManagedCost({ provider: "genprd", action: "generate_prd" }), true);
assert.equal(estimateManagedProviderCostUsd({ provider: "openrouter", action: "chat" }), undefined);
assert.equal(estimateManagedProviderCostUsd({
  provider: "openrouter",
  action: "chat",
  model: "unknown/frontier-model",
  estimatedInputTokens: 2_000,
  maxOutputTokens: 2_000,
}), undefined);
assert.equal(estimateManagedProviderCostUsd({
  provider: "openai",
  action: "chat",
  model: "gpt-5.6-sol",
  estimatedInputTokens: 2_000,
}), undefined);
assert.ok((estimateManagedProviderCostUsd({
  provider: "openai",
  action: "chat",
  model: "gpt-5.6-sol",
  estimatedInputTokens: 2_000,
  maxOutputTokens: 2_000,
}) ?? 0) > 0.05);
assert.equal(estimateInputTokens("12345678"), 8);
assert.equal(estimateInputTokens("🦞"), 4);
const cyclic: { self?: unknown } = {};
cyclic.self = cyclic;
assert.equal(estimateInputTokens(cyclic), Number.MAX_SAFE_INTEGER);
assert.equal(hasBillingGradeManagedCost({ provider: "openrouter", action: "chat" }), true);
assert.equal(hasBillingGradeManagedCost({ provider: "openrouter", action: "embeddings" }), false);
assert.equal(hasBillingGradeManagedCost({ provider: "openai", action: "chat" }), true);
assert.equal(hasBillingGradeManagedCost({ provider: "anthropic", action: "messages" }), true);
assert.equal(hasBillingGradeManagedCost({ provider: "groq", action: "chat" }), true);
assert.equal(hasBillingGradeManagedCost({ provider: "voyage", action: "embeddings" }), true);
assert.equal(hasBillingGradeManagedCost({ provider: "serper", action: "search" }), true);
assert.equal(hasBillingGradeManagedCost({ provider: "brave_search", action: "search" }), true);
assert.equal(hasBillingGradeManagedCost({ provider: "github", action: "search_repos" }), true);
assert.equal(hasBillingGradeManagedCost({ provider: "apilayer", action: "exchange_rates" }), true);
assert.equal(hasBillingGradeManagedCost({ provider: "apilayer", action: "weatherstack_current" }), true);
assert.equal(hasBillingGradeManagedCost({ provider: "apilayer", action: "verify_number" }), false);
assert.equal(estimateManagedProviderCostUsd({ provider: "apilayer", action: "scrape" }), 0.01);
assert.equal(verifiedFixedManagedProviderCostUsd({ provider: "apilayer", action: "fixer_latest" }), 0.01);
assert.equal(verifiedFixedManagedProviderCostUsd({ provider: "apilayer", action: "world_news" }), undefined);

assert.equal(verifiedFixedManagedProviderCostUsd({ provider: "brave_search", action: "search" }), 0.005);
assert.equal(verifiedFixedManagedProviderCostUsd({ provider: "github", action: "get_repo" }), 0);
assert.equal(verifiedFixedManagedProviderCostUsd({ provider: "serper", action: "search" }), 0.001);
assert.equal(verifiedFixedManagedProviderCostUsd({ provider: "firecrawl", action: "scrape" }), 0.02);
assert.equal(verifiedFixedManagedProviderCostUsd({ provider: "voyage", action: "embeddings" }), 0.02);
assert.equal(verifiedFixedManagedProviderCostUsd({ provider: "apilayer", action: "exchange_rates" }), 0.01);

assert.deepEqual(resolveManagedResponseCost({
  provider: "openrouter",
  responseOk: true,
  providerReportedCostUsd: 0,
  tokenTableCostUsd: 0.42,
}), { providerCostUsd: 0, costSource: "provider_response" });
assert.equal(providerReportedUsageCostUsd({ cost: 0 }), 0);
for (const missingExactCost of [undefined, Number.NaN, -1, "0.42"] as const) {
  const providerReportedCostUsd = providerReportedUsageCostUsd({ cost: missingExactCost });
  assert.deepEqual(resolveManagedResponseCost({
    provider: "openrouter",
    responseOk: true,
    providerReportedCostUsd,
    tokenTableCostUsd: 0.42,
  }), { costSource: "reservation" });
}
assert.deepEqual(resolveManagedResponseCost({
  provider: "brave_search",
  responseOk: true,
  fixedProviderCostUsd: 0.005,
}), { providerCostUsd: 0.005, costSource: "fixed_price_policy" });

const documentedOpenRouterModel = resolveExplicitOpenRouterModel("apiclaw/openrouter/auto");
assert.equal(documentedOpenRouterModel, "anthropic/claude-sonnet-4-6");
assert.deepEqual(resolveExplicitOpenRouterTarget("apiclaw/openrouter/auto"), {
  provider: "openrouter",
  model: "anthropic/claude-sonnet-4-6",
});
assert.equal(resolveExplicitOpenRouterModel("openrouter/openai/gpt-5.4"), "openai/gpt-5.4");
assert.equal(resolveExplicitOpenRouterModel("anthropic/claude-sonnet-4-6"), undefined);
assert.deepEqual(resolveExplicitOpenRouterExecution({
  provider: "openrouter",
  action: "chat",
  requestedModel: "auto",
}), {
  provider: "openrouter",
  model: "anthropic/claude-sonnet-4-6",
  routingModel: "openrouter/anthropic/claude-sonnet-4-6",
});
assert.deepEqual(resolveExplicitOpenRouterExecution({
  provider: "auto",
  action: "chat",
  requestedModel: "apiclaw/openrouter/openai/gpt-5.4",
}), {
  provider: "openrouter",
  model: "openai/gpt-5.4",
  routingModel: "openrouter/openai/gpt-5.4",
});
assert.equal(resolveExplicitOpenRouterExecution({
  provider: "auto",
  action: "chat",
  requestedModel: "anthropic/claude-sonnet-4-6",
}), undefined);
assert.equal(hasBillingGradeManagedCost({
  provider: "openrouter",
  action: "chat_completions",
  model: documentedOpenRouterModel,
}), true);

const auxiliarySchema = "x".repeat(64_000);
const normalized = normalizeManagedLlmRequestForCost({
  messages: [{ role: "user", content: "hello" }],
  tools: [{
    type: "function",
    function: {
      name: "large_tool",
      description: "Large schema regression",
      parameters: { type: "object", properties: { payload: { const: auxiliarySchema } } },
    },
  }],
  instructions: "Always use the supplied schema.",
  max_tokens: 999_999,
}, {
  model: "anthropic/claude-sonnet-4-6",
  maxOutputTokens: 2_000,
  outputField: "max_tokens",
});
assert.equal(normalized.max_tokens, 2_000);
assert.equal(normalized.max_completion_tokens, undefined);
assert.ok(estimateInputTokens(normalized) > 64_000);
assert.ok(
  estimateInputTokens(normalized) >
  estimateInputTokens((normalized.messages as unknown[])),
  "tools, instructions, and schemas must be part of the reservation estimate",
);

const boundedOpenRouterRequest = buildCostBoundedOpenRouterRequest({
  model: "attacker/override",
  messages: [{ role: "user", content: "hello" }],
  max_tokens: 999_999,
  plugins: [{ id: "web" }],
  service_tier: "priority",
  provider: { sort: "throughput", max_price: { prompt: 999 } },
  route: "fallback",
  models: ["premium/fallback"],
  temperature: 0.2,
}, {
  model: "anthropic/claude-sonnet-4-6",
  maxOutputTokens: 1_024,
  maxInputPriceUsdPerMillion: 3,
  maxOutputPriceUsdPerMillion: 15,
});
assert.equal(boundedOpenRouterRequest.model, "anthropic/claude-sonnet-4-6");
assert.equal(boundedOpenRouterRequest.max_tokens, 1_024);
assert.equal(boundedOpenRouterRequest.stream, false);
assert.equal(boundedOpenRouterRequest.service_tier, "default");
assert.equal(boundedOpenRouterRequest.plugins, undefined);
assert.equal(boundedOpenRouterRequest.route, undefined);
assert.equal(boundedOpenRouterRequest.models, undefined);
assert.deepEqual(boundedOpenRouterRequest.provider, {
  max_price: { prompt: 3, completion: 15, request: 0, image: 0 },
});
assert.throws(
  () => buildCostBoundedOpenRouterRequest({
    messages: [{ role: "user", content: [{ type: "image_url", image_url: { url: "https://example.test/x" } }] }],
  }, {
    model: "anthropic/claude-sonnet-4-6",
    maxOutputTokens: 100,
    maxInputPriceUsdPerMillion: 3,
    maxOutputPriceUsdPerMillion: 15,
  }),
  /text content only/,
);
assert.throws(
  () => buildCostBoundedOpenRouterRequest({
    messages: [{ role: "user", content: "search" }],
    tools: [{ type: "web_search", search_context_size: "high" }],
  }, {
    model: "anthropic/claude-sonnet-4-6",
    maxOutputTokens: 100,
    maxInputPriceUsdPerMillion: 3,
    maxOutputPriceUsdPerMillion: 15,
  }),
  /function tools only/,
);

// BYOH B2 (2026-08-24): resolveEffectiveModel fallback order is
// explicit request model > agent.defaultModel > workspace defaultModel. An
// explicit model always wins outright, no matter what agent/workspace
// defaults are set — this is a hard requirement (zero behavior change for
// any request that already passes an explicit model).
assert.equal(
  resolveEffectiveModel("anthropic/claude-sonnet-4-6", "openai/gpt-5.4", "mistral/mistral-large"),
  "anthropic/claude-sonnet-4-6",
  "explicit request model always wins",
);
assert.equal(
  resolveEffectiveModel("apiclaw/auto", "openai/gpt-5.4", "mistral/mistral-large"),
  "openai/gpt-5.4",
  "apiclaw/auto model falls through to the agent default",
);
assert.equal(
  resolveEffectiveModel(undefined, "openai/gpt-5.4", "mistral/mistral-large"),
  "openai/gpt-5.4",
  "unset model falls through to the agent default",
);
assert.equal(
  resolveEffectiveModel("", null, "mistral/mistral-large"),
  "mistral/mistral-large",
  "no agent default falls through to the workspace default",
);
assert.equal(
  resolveEffectiveModel(null, null, null),
  null,
  "no explicit model, agent default, or workspace default resolves to null",
);
assert.equal(
  resolveEffectiveModel("apiclaw/auto", null, undefined),
  null,
  "apiclaw/auto with nothing configured resolves to null, not the literal string",
);

console.log("managed cost policy: fixed providers are priced and variable providers fail closed, model resolution order is explicit > agent default > workspace default");
