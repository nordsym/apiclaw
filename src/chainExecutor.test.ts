#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  deriveChainStepIdempotencyKey,
  executeChain,
} from "./chainExecutor.js";

let attempts = 0;
const result = await executeChain({
  steps: [{
    id: "ambiguous",
    provider: "brave_search",
    action: "search",
    params: { query: "APIClaw" },
    onError: {
      retry: { attempts: 2, backoff: [0, 0] },
      fallback: {
        id: "fallback",
        provider: "nasa",
        action: "apod",
      },
      abort: false,
    },
  }],
  errorPolicy: { mode: "best-effort" },
}, {}, {}, {
  operationKey: "caller-owned-chain-operation",
  executeCall: async (_provider, _action, _params, operation) => {
    attempts += 1;
    assert.equal(
      operation.idempotencyKey,
      deriveChainStepIdempotencyKey("caller-owned-chain-operation", "ambiguous", 0),
    );
    return {
      success: false,
      error: "The upstream outcome is unknown.",
      code: "outcome_unknown",
      outcomeUnknown: true,
      retryable: false,
      idempotencyKey: operation.idempotencyKey,
      requestId: "request-redacted",
    };
  },
});

assert.equal(attempts, 1, "an ambiguous chain step must not retry or run its fallback");
assert.equal(result.success, false);
assert.equal(result.error?.code, "outcome_unknown");
assert.equal(
  result.failedStep?.idempotencyKey,
  deriveChainStepIdempotencyKey("caller-owned-chain-operation", "ambiguous", 0),
);
assert.equal(result.canResume, false, "an ambiguous chain must not offer replay-based resume");
assert.deepEqual(result.completedSteps, []);

console.log("chain executor stops retries, fallback, best-effort, and resume on ambiguous outcomes");
