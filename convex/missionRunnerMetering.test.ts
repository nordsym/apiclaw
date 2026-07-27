#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  resolveMissionProviderAction,
  resolveMissionProviderById,
  runExecuteForTest,
  runTransformForTest,
} from "./missionRunner";

type MutationArgs = Record<string, unknown>;

const originalFetch = globalThis.fetch;
const originalEncryptionSecret = process.env.APICLAW_KEY_ENCRYPTION_SECRET;
const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;
const originalPseudonymSecret = process.env.APICLAW_PSEUDONYM_SECRET;
const originalBraveKey = process.env.BRAVE_API_KEY;

const encryptionSecret = "11".repeat(32);
process.env.APICLAW_KEY_ENCRYPTION_SECRET = encryptionSecret;
process.env.OPENROUTER_API_KEY = "unit-test-openrouter-key";
process.env.APICLAW_PSEUDONYM_SECRET = "unit-test-pseudonym-secret";
delete process.env.BRAVE_API_KEY;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function encryptManagedKey(plaintext: string): Promise<string> {
  const keyBytes = Uint8Array.from(
    encryptionSecret.match(/.{2}/g)!.map((value) => Number.parseInt(value, 16)),
  );
  const iv = new Uint8Array(12).fill(7);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
  const encrypted = new Uint8Array(await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  ));
  const tag = encrypted.slice(-16);
  const data = encrypted.slice(0, -16);
  return `${bytesToHex(iv)}:${bytesToHex(tag)}:${bytesToHex(data)}`;
}

function makeCtx(queryResult?: unknown, customerChargeMicros = 0) {
  const mutationArgs: MutationArgs[] = [];
  return {
    mutationArgs,
    ctx: {
      runQuery: async () => queryResult,
      runMutation: async (_reference: unknown, args: MutationArgs) => {
        mutationArgs.push(args);
        if ("workspaceId" in args && "requestId" in args) {
          return {
            allowed: true,
            ledgerId: "ledger-test",
            billingClass: "payg",
            trafficClass: "customer",
          };
        }
        return { success: args.success, customerChargeMicros };
      },
    },
  };
}

function finalization(mutations: MutationArgs[]): MutationArgs {
  const value = mutations.find((args) => args.ledgerId === "ledger-test");
  assert.ok(value, "expected the managed-call ledger to be finalized");
  return value;
}

function braveRouting(encryptedMasterKey: string) {
  return {
    providerName: "brave_search",
    baseUrl: "https://api.search.brave.com/res/v1",
    authType: "header",
    authHeader: "X-Subscription-Token",
    authPrefix: "",
    encryptedMasterKey,
    action: {
      name: "search",
      method: "GET",
      path: "/res/v1/web/search",
      params: [
        { name: "q", in: "query" },
        { name: "count", in: "query" },
      ],
      requiresConfirmation: false,
    },
  };
}

function executeArgs(ctx: unknown) {
  return {
    ctx: {
      missionId: "mission-test" as any,
      workspaceId: "workspace-test" as any,
      trafficClass: "customer" as const,
    },
    convexCtx: ctx,
    config: { providerId: "brave_search", actionName: "search" },
    inputs: { query: "agent infrastructure", count: 3 },
  };
}

function transformArgs(ctx: unknown) {
  return {
    ctx: {
      missionId: "mission-test" as any,
      workspaceId: "workspace-test" as any,
      trafficClass: "customer" as const,
    },
    convexCtx: ctx,
    config: {
      model: "anthropic/claude-haiku-4-5",
      systemPrompt: "Return a short answer.",
      userPromptTemplate: "{{input.prompt}}",
      maxTokens: 64,
    },
    inputs: { prompt: "hello" },
  };
}

try {
  const encryptedMasterKey = await encryptManagedKey("fake-brave-key");

  assert.equal(
    resolveMissionProviderById(
      [{ name: "GenPRD" }, { name: "Brave Software" }],
      "brave_search",
    )?.name,
    "Brave Software",
  );
  assert.deepEqual(
    resolveMissionProviderAction("brave_search", "search", null),
    {
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
    },
  );
  assert.equal(
    resolveMissionProviderAction("brave_search", "search", {
      name: "search",
      method: "GET",
      path: "/res/v1/web/search",
      enabled: false,
    }),
    null,
    "an explicit operator disable must override the Brave fallback",
  );

  {
    const harness = makeCtx(braveRouting(encryptedMasterKey));
    let dispatchedUrl = "";
    globalThis.fetch = async (input) => {
      dispatchedUrl = input instanceof Request ? input.url : String(input);
      return new Response(JSON.stringify({ web: { results: [] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    const result = await runExecuteForTest(executeArgs(harness.ctx));
    assert.equal(result.ok, true);
    assert.equal(result.costUsd, 0.005);
    const url = new URL(dispatchedUrl);
    assert.equal(url.pathname, "/res/v1/web/search");
    assert.equal(url.searchParams.get("q"), "agent infrastructure");
    assert.equal(url.searchParams.has("query"), false);
    assert.deepEqual(finalization(harness.mutationArgs), {
      ledgerId: "ledger-test",
      success: true,
      provider: "brave_search",
      providerCostUsd: 0.005,
      costSource: "fixed_price_policy",
    });
  }

  {
    const harness = makeCtx(braveRouting(encryptedMasterKey));
    const body = new ReadableStream<Uint8Array>({
      pull() {
        throw new Error("stream interrupted");
      },
    });
    globalThis.fetch = async () => new Response(body, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    const result = await runExecuteForTest(executeArgs(harness.ctx));
    assert.equal(result.ok, false);
    assert.equal(result.error, "execute_parse:stream interrupted");
    assert.deepEqual(finalization(harness.mutationArgs), {
      ledgerId: "ledger-test",
      success: true,
      provider: "brave_search",
      providerCostUsd: 0.005,
      costSource: "fixed_price_policy",
    });
  }

  for (const response of [
    new Response("not-json", {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
    new Response("{}", {
      status: 200,
      headers: {
        "content-type": "application/json",
        "content-length": String(2 * 1024 * 1024 + 1),
      },
    }),
  ]) {
    const harness = makeCtx(braveRouting(encryptedMasterKey));
    globalThis.fetch = async () => response;
    const result = await runExecuteForTest(executeArgs(harness.ctx));
    assert.equal(result.ok, false);
    assert.equal(result.costUsd, 0.005);
    assert.deepEqual(finalization(harness.mutationArgs), {
      ledgerId: "ledger-test",
      success: true,
      provider: "brave_search",
      providerCostUsd: 0.005,
      costSource: "fixed_price_policy",
    });
  }

  {
    const harness = makeCtx(braveRouting(encryptedMasterKey));
    let canceled = false;
    let readIndex = 0;
    const chunks = [
      new Uint8Array(1024 * 1024),
      new Uint8Array(1024 * 1024 + 1),
    ];
    const response = {
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      body: {
        getReader: () => ({
          read: async () => readIndex < chunks.length
            ? { done: false, value: chunks[readIndex++] }
            : { done: true, value: undefined },
          cancel: async () => {
            canceled = true;
          },
          releaseLock: () => undefined,
        }),
      },
      arrayBuffer: async () => {
        throw new Error("mission responses must not use unbounded arrayBuffer()");
      },
    } as unknown as Response;
    globalThis.fetch = async () => response;
    const result = await runExecuteForTest(executeArgs(harness.ctx));
    assert.equal(result.ok, false);
    assert.equal(result.error, "execute:response_too_large");
    assert.equal(canceled, true, "oversized response streams must be canceled immediately");
    assert.deepEqual(finalization(harness.mutationArgs), {
      ledgerId: "ledger-test",
      success: true,
      provider: "brave_search",
      providerCostUsd: 0.005,
      costSource: "fixed_price_policy",
    });
  }

  {
    const harness = makeCtx(braveRouting(encryptedMasterKey));
    globalThis.fetch = async () => {
      throw new TypeError("connection reset");
    };
    const result = await runExecuteForTest(executeArgs(harness.ctx));
    assert.equal(result.ok, false);
    assert.match(result.error ?? "", /^execute:network:/);
    assert.deepEqual(finalization(harness.mutationArgs), {
      ledgerId: "ledger-test",
      success: true,
      provider: "brave_search",
      costSource: "reservation",
    });
  }

  {
    const invalidRouting = {
      ...braveRouting(encryptedMasterKey),
      baseUrl: "https://attacker.invalid",
    };
    const harness = makeCtx(invalidRouting);
    let dispatched = false;
    globalThis.fetch = async () => {
      dispatched = true;
      return new Response("{}", { status: 200 });
    };
    const result = await runExecuteForTest(executeArgs(harness.ctx));
    assert.equal(result.error, "execute:provider_origin_not_approved");
    assert.equal(dispatched, false);
    assert.equal(harness.mutationArgs.length, 0, "pre-dispatch rejection must not retain a reservation");
  }

  {
    const harness = makeCtx();
    globalThis.fetch = async () => new Response(JSON.stringify({
      id: "or-zero",
      model: "anthropic/claude-haiku-4-5",
      choices: [{ message: { content: "ok" } }],
      usage: { prompt_tokens: 4, completion_tokens: 1, cost: 0 },
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    const result = await runTransformForTest(transformArgs(harness.ctx));
    assert.equal(result.ok, true);
    assert.equal(result.costUsd, 0);
    assert.equal(finalization(harness.mutationArgs).providerCostUsd, 0);
    assert.equal(finalization(harness.mutationArgs).costSource, "provider_response");
  }

  {
    const harness = makeCtx(undefined, 115);
    globalThis.fetch = async () => new Response(JSON.stringify({
      id: "or-exact",
      model: "anthropic/claude-haiku-4-5",
      choices: [{ message: { content: "ok" } }],
      usage: { prompt_tokens: 4, completion_tokens: 1, cost: 0.0001 },
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    const result = await runTransformForTest(transformArgs(harness.ctx));
    assert.equal(result.ok, true);
    assert.equal(result.costUsd, 0.0001);
    assert.equal(result.chargedCostUsd, 0.000115);
    const authorization = harness.mutationArgs.find((args) => "workspaceId" in args);
    assert.equal(typeof authorization?.requestFingerprint, "string");
    assert.ok(
      Number(authorization?.estimatedProviderCostUsd) >= 0.0001,
      "the enforced request bound must cover the exact OpenRouter cost",
    );
    assert.deepEqual(finalization(harness.mutationArgs), {
      ledgerId: "ledger-test",
      success: true,
      provider: "openrouter",
      model: "anthropic/claude-haiku-4-5",
      providerCostUsd: 0.0001,
      inputTokens: 4,
      outputTokens: 1,
      upstreamRequestId: "or-exact",
      costSource: "provider_response",
    });
  }

  {
    process.env.OPENROUTER_API_KEY = "invalid\nkey";
    const harness = makeCtx();
    let dispatched = false;
    globalThis.fetch = async () => {
      dispatched = true;
      return new Response("{}", { status: 200 });
    };
    const result = await runTransformForTest(transformArgs(harness.ctx));
    assert.equal(result.ok, false);
    assert.match(result.error ?? "", /^transform:request_prepare:/);
    assert.equal(dispatched, false);
    assert.equal(
      harness.mutationArgs.length,
      0,
      "invalid local OpenRouter headers must fail before reserving a managed call",
    );
    process.env.OPENROUTER_API_KEY = "unit-test-openrouter-key";
  }

  {
    const invalidHeaderKey = await encryptManagedKey("invalid\nkey");
    const harness = makeCtx(braveRouting(invalidHeaderKey));
    let dispatched = false;
    globalThis.fetch = async () => {
      dispatched = true;
      return new Response("{}", { status: 200 });
    };
    const result = await runExecuteForTest(executeArgs(harness.ctx));
    assert.equal(result.ok, false);
    assert.match(result.error ?? "", /^execute:request_prepare:/);
    assert.equal(dispatched, false);
    assert.equal(
      harness.mutationArgs.length,
      0,
      "invalid managed-provider headers must fail before reserving a managed call",
    );
  }

  for (const usage of [
    { prompt_tokens: 4, completion_tokens: 1 },
    { prompt_tokens: 4, completion_tokens: 1, cost: -0.01 },
    { prompt_tokens: 4, completion_tokens: 1, cost: "0.01" },
  ]) {
    const harness = makeCtx();
    globalThis.fetch = async () => new Response(JSON.stringify({
      id: "or-missing-cost",
      choices: [{ message: { content: "must-not-escape" } }],
      usage,
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    const result = await runTransformForTest(transformArgs(harness.ctx));
    assert.equal(result.ok, false);
    assert.equal(result.error, "openrouter_exact_cost_missing");
    assert.equal(result.output, undefined);
    assert.equal(result.costUsd, 0);
    assert.deepEqual(finalization(harness.mutationArgs), {
      ledgerId: "ledger-test",
      success: true,
      provider: "openrouter",
      model: "anthropic/claude-haiku-4-5",
      inputTokens: 4,
      outputTokens: 1,
      upstreamRequestId: "or-missing-cost",
      costSource: "reservation",
    });
  }

  {
    const harness = makeCtx();
    globalThis.fetch = async () => new Response(JSON.stringify({
      id: "or-over-bound",
      choices: [{ message: { content: "must-not-escape" } }],
      usage: { prompt_tokens: 4, completion_tokens: 1, cost: 1 },
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    const result = await runTransformForTest(transformArgs(harness.ctx));
    assert.equal(result.ok, false);
    assert.equal(result.error, "openrouter_exact_cost_exceeds_reservation");
    assert.equal(result.output, undefined);
    assert.equal(result.costUsd, 0);
    assert.deepEqual(finalization(harness.mutationArgs), {
      ledgerId: "ledger-test",
      success: true,
      provider: "openrouter",
      model: "anthropic/claude-haiku-4-5",
      providerCostUsd: 1,
      inputTokens: 4,
      outputTokens: 1,
      upstreamRequestId: "or-over-bound",
      costSource: "provider_response",
    });
  }

  {
    const harness = makeCtx();
    globalThis.fetch = async () => new Response("not-json", {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    const result = await runTransformForTest(transformArgs(harness.ctx));
    assert.equal(result.ok, false);
    assert.match(result.error ?? "", /^openrouter_parse:/);
    assert.deepEqual(finalization(harness.mutationArgs), {
      ledgerId: "ledger-test",
      success: true,
      provider: "openrouter",
      model: "anthropic/claude-haiku-4-5",
      costSource: "reservation",
    });
  }

  {
    const harness = makeCtx();
    globalThis.fetch = async () => {
      throw new TypeError("socket closed");
    };
    const result = await runTransformForTest(transformArgs(harness.ctx));
    assert.equal(result.ok, false);
    assert.match(result.error ?? "", /^openrouter_network:/);
    assert.deepEqual(finalization(harness.mutationArgs), {
      ledgerId: "ledger-test",
      success: true,
      provider: "openrouter",
      model: "anthropic/claude-haiku-4-5",
      costSource: "reservation",
    });
  }

  console.log("mission runner metering: fixed prices, exact OpenRouter cost, reservations, and stream caps pass");
} finally {
  globalThis.fetch = originalFetch;
  if (originalEncryptionSecret === undefined) delete process.env.APICLAW_KEY_ENCRYPTION_SECRET;
  else process.env.APICLAW_KEY_ENCRYPTION_SECRET = originalEncryptionSecret;
  if (originalOpenRouterKey === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = originalOpenRouterKey;
  if (originalPseudonymSecret === undefined) delete process.env.APICLAW_PSEUDONYM_SECRET;
  else process.env.APICLAW_PSEUDONYM_SECRET = originalPseudonymSecret;
  if (originalBraveKey === undefined) delete process.env.BRAVE_API_KEY;
  else process.env.BRAVE_API_KEY = originalBraveKey;
}
