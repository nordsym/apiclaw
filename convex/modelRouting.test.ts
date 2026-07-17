#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { resolveDirectModelRoute } from "./modelRouting";

const exactFrontierRoutes = [
  ["openai/gpt-5.6-sol", "openai", "gpt-5.6-sol"],
  ["gpt-5.5-pro", "openai", "gpt-5.5-pro"],
  ["openai/gpt-4o-mini", "openai", "gpt-4o-mini"],
  ["anthropic/claude-opus-4-8", "anthropic", "claude-opus-4-8"],
  ["claude-fable-5", "anthropic", "claude-fable-5"],
  ["x-ai/grok-4.5", "xai", "grok-4.5"],
  ["grok-4.3", "xai", "grok-4.3"],
  ["mistralai/mistral-large-2512", "mistral", "mistral-large-2512"],
  ["groq/meta-llama/llama-4-scout-17b-16e-instruct", "groq", "meta-llama/llama-4-scout-17b-16e-instruct"],
] as const;

for (const [requested, provider, model] of exactFrontierRoutes) {
  assert.deepEqual(
    resolveDirectModelRoute(requested),
    { provider, model, reason: `direct_${provider}_passthrough` },
    `${requested} must reach ${provider} without being rewritten`,
  );
}

assert.deepEqual(resolveDirectModelRoute("deepseek-r1"), {
  provider: "together",
  model: "deepseek-ai/DeepSeek-R1",
  reason: "direct_together_alias",
});

assert.deepEqual(resolveDirectModelRoute("groq/llama-3.3-70b"), {
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  reason: "direct_groq_alias",
});
assert.deepEqual(resolveDirectModelRoute("mistralai/mistral-large"), {
  provider: "mistral",
  model: "mistral-large-latest",
  reason: "direct_mistral_alias",
});
assert.deepEqual(resolveDirectModelRoute("meta-llama/Llama-3.3-70B"), {
  provider: "together",
  model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  reason: "direct_together_alias",
});

assert.equal(resolveDirectModelRoute("google/gemini-3.5-flash"), null);
assert.equal(resolveDirectModelRoute("cohere/command-a-plus-05-2026"), null);

console.log("model routing: frontier slugs preserve exact provider model IDs");
