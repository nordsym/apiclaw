import assert from "node:assert/strict";
import { GatewayClient } from "./gateway-client.js";

const originalFetch = globalThis.fetch;
const originalSecret = process.env.APICLAW_INTERNAL_SECRET;
const captured: Array<Record<string, string>> = [];
let failNextTransport = false;

globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
  captured.push(init?.headers as Record<string, string>);
  if (failNextTransport) {
    failNextTransport = false;
    throw new TypeError("simulated transport failure");
  }
  return new Response(
    JSON.stringify({ success: true, provider: "brave_search", action: "search", data: {} }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}) as typeof fetch;

try {
  process.env.APICLAW_INTERNAL_SECRET = "test-internal-secret";
  const client = new GatewayClient();

  await client.execute("brave_search", "search", { q: "test" }, {
    workspaceId: "workspace-public",
    sessionToken: "session-public",
    idempotencyKey: "managed-request-public-1",
  });
  assert.equal(captured[0]["X-APIClaw-Session"], "session-public");
  assert.equal(captured[0]["X-APIClaw-Internal"], undefined);
  assert.equal(captured[0]["X-APIClaw-Workspace"], undefined);
  assert.equal(captured[0]["Idempotency-Key"], "managed-request-public-1");

  await client.execute("brave_search", "search", { q: "internal" }, {
    workspaceId: "workspace-internal",
    idempotencyKey: "managed-request-internal-1",
  });
  assert.equal(captured[1]["X-APIClaw-Internal"], "test-internal-secret");
  assert.equal(captured[1]["X-APIClaw-Workspace"], "workspace-internal");
  assert.equal(captured[1]["X-APIClaw-Session"], undefined);
  assert.equal(captured[1]["Idempotency-Key"], "managed-request-internal-1");

  await client.execute("brave_search", "search", { q: "generated-key" }, {
    workspaceId: "workspace-internal",
  });
  assert.match(captured[2]["Idempotency-Key"], /^apiclaw-[0-9a-f-]{36}$/);

  failNextTransport = true;
  const ambiguous = await client.execute("brave_search", "search", { q: "no-retry" }, {
    workspaceId: "workspace-public",
    sessionToken: "session-public",
  });
  assert.equal(captured.length, 4, "an ambiguous transport failure must not retry automatically");
  assert.match(captured[3]["Idempotency-Key"], /^apiclaw-[0-9a-f-]{36}$/);
  assert.equal(ambiguous.success, false);
  assert.equal(ambiguous.code, "outcome_unknown");
  assert.equal(ambiguous.outcomeUnknown, true);
  assert.equal(ambiguous.retryable, false);
  assert.equal(ambiguous.idempotencyKey, captured[3]["Idempotency-Key"]);
  assert.match(ambiguous.error ?? "", /Do not rerun it with a new key/);
} finally {
  globalThis.fetch = originalFetch;
  if (originalSecret === undefined) delete process.env.APICLAW_INTERNAL_SECRET;
  else process.env.APICLAW_INTERNAL_SECRET = originalSecret;
}

console.log("gateway auth: public sessions and internal workspaces stay on separate rails");
