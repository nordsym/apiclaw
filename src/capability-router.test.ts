#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { executeCapability } from "./capability-router.js";

const originalFetch = globalThis.fetch;
let providerAttempts = 0;

globalThis.fetch = (async (input: string | URL | Request) => {
  const url = String(input);
  if (url.endsWith("/api/query")) {
    return new Response(JSON.stringify({
      value: [
        {
          providerId: "brave_search",
          capabilityId: "search",
          priority: 1,
          regions: [],
          pricePerUnit: 0.001,
          currency: "USD",
          avgLatencyMs: 100,
          paramMapping: {},
          enabled: true,
          healthStatus: "healthy",
        },
        {
          providerId: "nasa",
          capabilityId: "search",
          priority: 2,
          regions: [],
          pricePerUnit: 0,
          currency: "USD",
          avgLatencyMs: 200,
          paramMapping: {},
          enabled: true,
          healthStatus: "healthy",
        },
      ],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}) as typeof fetch;

try {
  const result = await executeCapability(
    "search",
    "search",
    { query: "APIClaw" },
    "test-user",
    { fallback: true },
    async () => {
      providerAttempts += 1;
      return {
        success: false,
        error: "The upstream outcome is unknown.",
        code: "outcome_unknown",
        outcomeUnknown: true,
        retryable: false,
        idempotencyKey: "capability-operation-1",
      };
    },
  );

  assert.equal(providerAttempts, 1, "an ambiguous capability call must not try another provider");
  assert.equal(result.success, false);
  assert.equal(result.code, "outcome_unknown");
  assert.equal(result.outcomeUnknown, true);
  assert.equal(result.retryable, false);
  assert.equal(result.idempotencyKey, "capability-operation-1");
  assert.equal(result.fallbackAttempted, false);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("capability routing stops provider fallback on ambiguous outcomes");
