#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { resolveFrontierModelCost } from "./modelPricing";

assert.deepEqual(resolveFrontierModelCost("openai/gpt-5.6-sol"), { input: 5, output: 30 });
assert.deepEqual(resolveFrontierModelCost("stealth/ox-alpha"), { input: 0, output: 0 });
assert.deepEqual(resolveFrontierModelCost("openai/gpt-5.6"), { input: 5, output: 30 });
assert.deepEqual(resolveFrontierModelCost("openai/gpt-5.4-mini"), { input: 0.75, output: 4.5 });
assert.deepEqual(resolveFrontierModelCost("gpt-5.5-pro-2026-04-23"), { input: 30, output: 180 });
assert.deepEqual(resolveFrontierModelCost("gpt-5.5", 272_001), { input: 10, output: 45 });
assert.deepEqual(resolveFrontierModelCost("anthropic/claude-opus-4-8"), { input: 5, output: 25 });
assert.deepEqual(resolveFrontierModelCost("claude-fable-5"), { input: 10, output: 50 });
assert.deepEqual(
  resolveFrontierModelCost("claude-sonnet-5", 0, Date.UTC(2026, 7, 31)),
  { input: 2, output: 10 },
);
assert.deepEqual(
  resolveFrontierModelCost("claude-sonnet-5", 0, Date.UTC(2026, 8, 1)),
  { input: 3, output: 15 },
);
assert.deepEqual(resolveFrontierModelCost("x-ai/grok-4.5"), { input: 2, output: 6 });
assert.deepEqual(resolveFrontierModelCost("mistralai/mistral-medium-3-5"), { input: 1.5, output: 7.5 });
assert.equal(resolveFrontierModelCost("openai/future-unknown-frontier"), undefined);

console.log("model pricing: current direct frontier prices resolve before generic fallback");
