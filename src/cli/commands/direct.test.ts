#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  buildCallGatewayRequest,
  GatewayOutcomeUnknownError,
  sendGatewayRequest,
} from "./direct.js";

const brave = buildCallGatewayRequest("brave_search/search", {
  params: { query: "AI agent infrastructure news", count: 3 },
});
assert.deepEqual(brave, {
  path: "/v1/execute",
  method: "POST",
  body: {
    provider: "brave_search",
    action: "search",
    params: { query: "AI agent infrastructure news", count: 3 },
  },
});

const attempts: Array<{ url: string; init?: RequestInit }> = [];
await assert.rejects(
  sendGatewayRequest<{ success: boolean }>(brave, true, {
    gatewayUrl: "https://gateway.test",
    authHeaders: { "X-APIClaw-Session": "test-session" },
    idempotencyKey: "apiclaw-cli-contract-test",
    fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
      attempts.push({ url: String(url), init });
      throw new TypeError("ambiguous transport failure");
    }) as typeof fetch,
  }),
  (error: unknown) =>
    error instanceof GatewayOutcomeUnknownError &&
    error.code === "outcome_unknown" &&
    error.idempotencyKey === "apiclaw-cli-contract-test",
);

assert.equal(attempts.length, 1, "ambiguous transport failures must never retry automatically");
for (const attempt of attempts) {
  assert.equal(attempt.url, "https://gateway.test/v1/execute");
  assert.equal(
    (attempt.init?.headers as Record<string, string>)["Idempotency-Key"],
    "apiclaw-cli-contract-test",
  );
  assert.deepEqual(JSON.parse(String(attempt.init?.body)), brave.body);
}

await assert.rejects(
  sendGatewayRequest<{ success: boolean }>(brave, true, {
    gatewayUrl: "https://gateway.test",
    authHeaders: { "X-APIClaw-Session": "test-session" },
    idempotencyKey: "apiclaw-cli-body-stream-test",
    fetchImpl: (async () => new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"success":'));
        controller.error(new Error("response stream reset"));
      },
    }), {
      status: 200,
      headers: { "X-APIClaw-Request-Id": "request-body-stream-test" },
    })) as typeof fetch,
  }),
  (error: unknown) =>
    error instanceof GatewayOutcomeUnknownError &&
    error.idempotencyKey === "apiclaw-cli-body-stream-test" &&
    error.requestId === "request-body-stream-test",
);

assert.equal(
  buildCallGatewayRequest("github", { params: { owner: "nordsym" } }).path,
  "/v1/call",
);
assert.equal(
  buildCallGatewayRequest("github/repos/list", { params: {} }).path,
  "/v1/call",
);
assert.equal(
  buildCallGatewayRequest("../secrets", { params: {} }).path,
  "/v1/call",
);
assert.throws(
  () => buildCallGatewayRequest("brave_search/search", { params: ["not", "an", "object"] }),
  /JSON object/,
);

console.log("CLI provider/action calls map to /v1/execute and stop on ambiguous outcomes");
