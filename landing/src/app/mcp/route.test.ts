#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  jsonByteLength,
  mapWithConcurrency,
  McpRequestBodyError,
  MCP_BATCH_CONCURRENCY,
  MCP_BATCH_MAX_ITEMS,
  MCP_BATCH_RESULT_MAX_BYTES,
  MCP_REQUEST_BODY_MAX_BYTES,
  MCP_RESULT_MAX_BYTES,
  readMcpJsonBodyCapped,
  validateMcpBatchSize,
} from "./limits";
import {
  CANONICAL_MCP_TOOLS,
  createBestEffortMcpToolBudget,
  dispatchCanonicalTool,
  McpGatewayOutcomeUnknownError,
  McpUpstreamResponseError,
  MCP_UPSTREAM_RESPONSE_MAX_BYTES,
  MCP_UPSTREAM_TIMEOUT_MS,
  readGatewayResponseTextCapped,
} from "../../lib/mcp-tools-canon";

async function main() {
  const valid = new Request("https://apiclaw.cloud/mcp", {
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
  });
  assert.deepEqual(await readMcpJsonBodyCapped(valid), {
    jsonrpc: "2.0",
    id: 1,
    method: "ping",
  });

  await assert.rejects(
    readMcpJsonBodyCapped(
      new Request("https://apiclaw.cloud/mcp", { method: "POST", body: "" }),
    ),
    (error: unknown) =>
      error instanceof McpRequestBodyError && error.status === 400,
  );

  const declaredOversize = new Request("https://apiclaw.cloud/mcp", {
    method: "POST",
    headers: { "Content-Length": String(MCP_REQUEST_BODY_MAX_BYTES + 1) },
    body: "{}",
  });
  await assert.rejects(
    readMcpJsonBodyCapped(declaredOversize),
    (error: unknown) =>
      error instanceof McpRequestBodyError && error.status === 413,
  );

  const chunk = new Uint8Array(64 * 1024).fill(97);
  const chunkCount = Math.ceil(
    (MCP_REQUEST_BODY_MAX_BYTES + 1) / chunk.byteLength,
  );
  const streamedOversize = new Request("https://apiclaw.cloud/mcp", {
    method: "POST",
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < chunkCount; i++) controller.enqueue(chunk);
        controller.close();
      },
    }),
    duplex: "half",
  } as RequestInit & { duplex: "half" });
  await assert.rejects(
    readMcpJsonBodyCapped(streamedOversize),
    (error: unknown) =>
      error instanceof McpRequestBodyError && error.status === 413,
  );

  let active = 0;
  let peak = 0;
  const mapped = await mapWithConcurrency(
    Array.from({ length: MCP_BATCH_MAX_ITEMS }, (_, index) => index),
    MCP_BATCH_CONCURRENCY,
    async (value) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise<void>((resolve) => setTimeout(resolve, 2));
      active--;
      return value * 2;
    },
  );
  assert.deepEqual(
    mapped,
    Array.from({ length: MCP_BATCH_MAX_ITEMS }, (_, index) => index * 2),
  );
  assert.ok(
    peak <= MCP_BATCH_CONCURRENCY,
    "batch work must never exceed bounded concurrency",
  );
  assert.deepEqual(validateMcpBatchSize([]), {
    ok: false,
    status: 400,
    rpcCode: -32600,
    message: "Empty JSON-RPC batches are invalid",
  });
  assert.equal(
    validateMcpBatchSize(Array(MCP_BATCH_MAX_ITEMS).fill(null)).ok,
    true,
  );
  const tooManyBatchItems = validateMcpBatchSize(
    Array(MCP_BATCH_MAX_ITEMS + 1).fill(null),
  );
  assert.equal(tooManyBatchItems.ok, false);
  assert.equal(tooManyBatchItems.ok ? 0 : tooManyBatchItems.status, 413);

  assert.ok(
    jsonByteLength({
      jsonrpc: "2.0",
      id: 7,
      result: "x".repeat(MCP_RESULT_MAX_BYTES),
    }).bytes > MCP_RESULT_MAX_BYTES,
  );
  assert.ok(
    jsonByteLength([
      { jsonrpc: "2.0", id: 1, result: "x".repeat(MCP_BATCH_RESULT_MAX_BYTES) },
    ]).bytes > MCP_BATCH_RESULT_MAX_BYTES,
  );

  const validGatewayBody = JSON.stringify({ ok: true, source: "bounded" });
  assert.equal(
    await readGatewayResponseTextCapped(new Response(validGatewayBody)),
    validGatewayBody,
  );

  const oversizedChunk = new Uint8Array(MCP_UPSTREAM_RESPONSE_MAX_BYTES + 1).fill(97);
  const missingLengthOversize = new Response(new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(oversizedChunk);
      controller.close();
    },
  }));
  await assert.rejects(
    readGatewayResponseTextCapped(missingLengthOversize),
    (error: unknown) =>
      error instanceof McpUpstreamResponseError && error.code === "response_too_large",
  );

  const lyingLengthOversize = new Response(new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(oversizedChunk);
      controller.close();
    },
  }), { headers: { "Content-Length": "1" } });
  await assert.rejects(
    readGatewayResponseTextCapped(lyingLengthOversize),
    (error: unknown) =>
      error instanceof McpUpstreamResponseError && error.code === "response_too_large",
  );

  await assert.rejects(
    readGatewayResponseTextCapped(new Response("{}", {
      headers: { "Content-Length": String(MCP_UPSTREAM_RESPONSE_MAX_BYTES + 1) },
    })),
    (error: unknown) =>
      error instanceof McpUpstreamResponseError && error.code === "response_too_large",
  );

  const budget = createBestEffortMcpToolBudget({
    maxCalls: 2,
    windowMs: 1_000,
    maxConcurrent: 1,
    maxTrackedKeys: 2,
  });
  const firstLease = budget.acquire("token-a", 0);
  assert.equal(firstLease.ok, true);
  assert.deepEqual(budget.acquire("token-a", 0), {
    ok: false,
    reason: "concurrency_limit",
  });
  if (firstLease.ok) firstLease.release();
  const secondLease = budget.acquire("token-a", 1);
  assert.equal(secondLease.ok, true);
  if (secondLease.ok) secondLease.release();
  assert.deepEqual(budget.acquire("token-a", 2), {
    ok: false,
    reason: "rate_limit",
  });
  const resetLease = budget.acquire("token-a", 1_001);
  assert.equal(resetLease.ok, true, "fixed window must reset after its bound");
  if (resetLease.ok) resetLease.release();

  const originalFetch = globalThis.fetch;
  const gatewayCalls: Array<{ url: string; init?: RequestInit }> = [];
  try {
    let managedAttempts = 0;
    let simulatedProviderDispatches = 0;
    let managedResponseMode: "normal" | "stream_error" | "oversize" = "normal";
    const acceptedOperationKeys = new Set<string>();
    globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      gatewayCalls.push({ url, init });
      assert.ok(init?.signal instanceof AbortSignal, "every gateway fetch must be abort-bounded");
      assert.equal(init.signal.aborted, false);
      if (url.endsWith("/v1/execute") && managedAttempts++ === 0) {
        throw new TypeError("simulated transport reset");
      }
      if (url.endsWith("/v1/execute")) {
        const operationKey = new Headers(init?.headers).get("Idempotency-Key") ?? "";
        if (!acceptedOperationKeys.has(operationKey)) {
          acceptedOperationKeys.add(operationKey);
          simulatedProviderDispatches++;
        }
        if (managedResponseMode === "stream_error") {
          return new Response(new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('{"success":'));
              controller.error(new Error("response stream reset"));
            },
          }), {
            status: 200,
            headers: { "X-APIClaw-Request-Id": "remote-stream-request" },
          });
        }
        if (managedResponseMode === "oversize") {
          return new Response("x".repeat(MCP_UPSTREAM_RESPONSE_MAX_BYTES + 1), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      return new Response(JSON.stringify({ success: true, provider: "brave_search", action: "search" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    await assert.rejects(
      dispatchCanonicalTool("call_api", {
        provider: "brave_search",
        action: "search",
        params: { query: "APIClaw" },
        idempotency_key: "test-managed-rail",
      }, { bearer: "sk-mcp-redacted" }),
      (error: unknown) =>
        error instanceof McpGatewayOutcomeUnknownError &&
        error.code === "outcome_unknown" &&
        error.idempotencyKey === "test-managed-rail",
    );
    const executeCalls = gatewayCalls.filter((call) => call.url.endsWith("/v1/execute"));
    assert.equal(executeCalls.length, 1, "managed rail must not retry an ambiguous transport failure");
    for (const call of executeCalls) {
      assert.equal(new Headers(call.init?.headers).get("Idempotency-Key"), "test-managed-rail");
      assert.deepEqual(JSON.parse(String(call.init?.body)), {
        provider: "brave_search",
        action: "search",
        params: { query: "APIClaw" },
      });
    }

    const callApiTool = CANONICAL_MCP_TOOLS.find((tool) => tool.name === "call_api");
    const startMissionTool = CANONICAL_MCP_TOOLS.find((tool) => tool.name === "start_mission");
    assert.ok(callApiTool?.inputSchema.required.includes("idempotency_key"));
    assert.ok(startMissionTool?.inputSchema.required.includes("idempotency_key"));
    await assert.rejects(
      dispatchCanonicalTool("call_api", {
        provider: "brave_search",
        action: "search",
        params: { query: "APIClaw" },
      }, { bearer: "sk-mcp-redacted" }),
      /idempotency_key is required/,
    );

    gatewayCalls.length = 0;
    const repeatedPayload = {
      provider: "brave_search",
      action: "search",
      params: { query: "same logical operation" },
      idempotency_key: "caller-owned-operation-42",
    };
    await dispatchCanonicalTool("call_api", repeatedPayload, { bearer: "sk-mcp-redacted" });
    await dispatchCanonicalTool("call_api", repeatedPayload, { bearer: "sk-mcp-redacted" });
    const repeatedCalls = gatewayCalls.filter((call) => call.url.endsWith("/v1/execute"));
    assert.equal(repeatedCalls.length, 2, "MCP retransmission may reach the gateway twice");
    assert.ok(repeatedCalls.every((call) =>
      new Headers(call.init?.headers).get("Idempotency-Key") === "caller-owned-operation-42"
    ));
    assert.equal(
      simulatedProviderDispatches,
      1,
      "the simulated gateway must dispatch only once for a retransmitted operation key",
    );

    managedResponseMode = "stream_error";
    await assert.rejects(
      dispatchCanonicalTool("call_api", {
        provider: "brave_search",
        action: "search",
        params: { query: "stream reset" },
        idempotency_key: "remote-stream-operation",
      }, { bearer: "sk-mcp-redacted" }),
      (error: unknown) =>
        error instanceof McpGatewayOutcomeUnknownError &&
        error.idempotencyKey === "remote-stream-operation" &&
        error.requestId === "remote-stream-request",
    );

    managedResponseMode = "oversize";
    await assert.rejects(
      dispatchCanonicalTool("call_api", {
        provider: "brave_search",
        action: "search",
        params: { query: "oversized response" },
        idempotency_key: "remote-oversize-operation",
      }, { bearer: "sk-mcp-redacted" }),
      (error: unknown) =>
        error instanceof McpGatewayOutcomeUnknownError &&
        error.idempotencyKey === "remote-oversize-operation" &&
        error.gatewayCode === "response_too_large",
    );
    managedResponseMode = "normal";

    gatewayCalls.length = 0;
    await dispatchCanonicalTool("discover_apis", {
      query: "web search",
      callable_only: true,
      max_results: 3,
    }, { bearer: "sk-mcp-redacted" });
    assert.equal(gatewayCalls.length, 1);
    assert.ok(gatewayCalls[0].url.endsWith("/v1/discover"), "discovery route must stay intact");
    assert.equal(new Headers(gatewayCalls[0].init?.headers).get("X-APIClaw-Source"), "remote-mcp");

    await assert.rejects(
      dispatchCanonicalTool("call_api", {
        api: "legacy-arbitrary-proxy",
        path: "/private",
      }, { bearer: "sk-mcp-redacted" }),
      /provider is required/,
    );
    assert.equal(MCP_UPSTREAM_TIMEOUT_MS, 30_000);
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log("remote MCP enforces bounded IO, managed execution routing, and local abuse guards");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
