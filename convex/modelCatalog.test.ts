#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { classifyModelEndpoint, modelSourceMatchesProvider, MODEL_STALE_AFTER_MS } from "./modelCatalog";

assert.equal(MODEL_STALE_AFTER_MS, 24 * 60 * 60 * 1000);

for (const id of [
  "x-ai/grok-imagine-image",
  "x-ai/grok-imagine-video-1.5",
  "openai/gpt-5-image",
  "openai/sora-2",
  "google/veo-3.1",
  "bytedance/seedance-1.5-pro",
]) {
  assert.equal(classifyModelEndpoint(id, id.split("/")[0]), null, `${id} is not a chat model`);
}

assert.equal(
  classifyModelEndpoint("vendor/generic-media", "vendor", undefined, ["image"]),
  null,
);
assert.equal(
  classifyModelEndpoint("openai/text-embedding-3-large", "openai"),
  "/v1/embeddings",
);
assert.equal(
  classifyModelEndpoint("openai/gpt-5.6-sol", "openai", undefined, ["text"]),
  "/v1/chat/completions",
);
assert.equal(modelSourceMatchesProvider("anthropic-hardcoded", "anthropic"), true);
assert.equal(modelSourceMatchesProvider("openrouter", "openrouter"), true);
assert.equal(modelSourceMatchesProvider("openrouter", "anthropic"), false);

console.log("model catalog: non-chat generation models stay out of chat inventory");
