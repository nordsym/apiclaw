import assert from "node:assert/strict";
import { getFunctionName } from "convex/server";
import http from "./http";
import { checkWorkspacePublic } from "./ratelimit";
import { executeWorkspacePublicApi } from "./workspacePublicExecute";
import { getWorkspacePublicApi } from "../src/workspace-public-apis";

const frankfurter = getWorkspacePublicApi("open:frankfurter")!;
assert.ok(frankfurter, "open:frankfurter resolves to the pinned free rail");
assert.equal(frankfurter.id, "frankfurter");
const route = http.lookup("/v1/execute", "POST")![0] as any;
const originalFetch = globalThis.fetch;
const originalMode = process.env.APICLAW_AUTH_ENFORCEMENT;
process.env.APICLAW_AUTH_ENFORCEMENT = "enforce";
const calls: Array<{ name: string; args: any }> = [];
const upstream: Array<{ url: string; options: RequestInit }> = [];
let authenticated = true;
let allowed = true;
let upstreamStatus = 200;
const ctx = {
  runMutation: async (reference: any, args: any) => {
    const name = getFunctionName(reference);
    calls.push({ name, args });
    if (name === "workspaces:verifySession") return authenticated
      ? { workspaceId: "workspace_test", tier: "free", usageCount: 999, usageLimit: 25 } : null;
    if (name === "ratelimit:checkWorkspacePublic") return { allowed, retryAfterSeconds: 9 };
    if (name === "activation:recordFirstCallApiSuccess") return { event: "first_call_api_success", deduped: false };
    if (name === "funnel:recordEvent") return null;
    throw new Error(`Free rail must not call ${name}`);
  },
  runQuery: async () => { throw new Error("Free rail must not load billing settings"); },
};
const invoke = async (provider: string, params: Record<string, unknown> = {}, withSession = true) => {
  calls.length = 0;
  upstream.length = 0;
  return route._handler(ctx, new Request("https://gateway.example/v1/execute", {
    method: "POST", headers: { "Content-Type": "application/json", ...(withSession ? { "X-APIClaw-Session": "synthetic-test-session" } : {}) },
    body: JSON.stringify({ provider, action: "call", params }),
  }));
};
try {
  globalThis.fetch = (async (url: any, options: RequestInit) => {
    upstream.push({ url: String(url), options });
    return new Response(JSON.stringify({ rates: { USD: 1.12 } }), { status: upstreamStatus });
  }) as typeof fetch;
  const success = await invoke("open:frankfurter", { path: "/latest" });
  assert.equal(success.status, 200);
  assert.equal((await success.json()).success, true);
  assert.equal(upstream[0].url, "https://api.frankfurter.dev/v1/latest");
  assert.equal(upstream[0].options.method, "GET");
  assert.equal(upstream[0].options.redirect, "error");
  assert.equal(new Headers(upstream[0].options.headers).has("Authorization"), false);
  assert.ok(calls.some((call) => call.name === "activation:recordFirstCallApiSuccess"));
  assert.ok(calls.every((call) => !/managedUsage|billing|stripe/.test(call.name)), "exhausted free trial still gets free calls without reservations");
  const anonymous = await invoke("open:frankfurter", {}, false);
  assert.equal(anonymous.status, 401);
  assert.equal(upstream.length, 0);
  authenticated = false;
  assert.equal((await invoke("frankfurter")).status, 401);
  assert.equal(upstream.length, 0);
  authenticated = true;
  for (const path of ["https://evil.example/steal", "//127.0.0.1", "https://user:password@api.frankfurter.dev/v1/latest"]) {
    const result = await invoke("frankfurter", { path });
    assert.equal(result.status, 400, path);
    assert.equal(upstream.length, 0);
  }
  assert.equal((await invoke("frankfurter", { method: "POST" })).status, 405);
  assert.equal(upstream.length, 0);
  allowed = false;
  const limited = await invoke("frankfurter");
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("Retry-After"), "9");
  assert.equal(upstream.length, 0);
  allowed = true;
  upstreamStatus = 503;
  const unavailable = await invoke("frankfurter");
  assert.equal(unavailable.status, 502);
  assert.equal((await unavailable.json()).error.code, "public_api_unavailable");
  assert.equal(calls.some((call) => call.name === "activation:recordFirstCallApiSuccess"), false);
  assert.equal((await invoke("listing:synthetic")).status, 403);
  assert.equal(upstream.length, 0);
  assert.equal((await invoke("open:unknown-private-api-fixture")).status, 501);
  assert.equal(upstream.length, 0);
} finally {
  globalThis.fetch = originalFetch;
  if (originalMode === undefined) delete process.env.APICLAW_AUTH_ENFORCEMENT;
  else process.env.APICLAW_AUTH_ENFORCEMENT = originalMode;
}

let successful = 0;
const defaults = await executeWorkspacePublicApi({ ...frankfurter, smokePath: "/latest?from=EUR" }, "call", {}, {
  fetch: (async (url: string) => { assert.equal(url, "https://api.frankfurter.dev/v1/latest?from=EUR"); return new Response("{}"); }) as typeof fetch,
  readText: (response) => response.text(), recordSuccess: async () => { successful++; },
});
assert.equal(defaults.status, 200);
assert.equal(successful, 1);

let bucket: any = null;
const rateCtx: any = { db: {
  query: () => ({ withIndex: () => ({ first: async () => bucket }) }),
  insert: async (table: string, row: any) => { assert.equal(table, "rateLimits"); bucket = { _id: "rate", ...row }; },
  patch: async (id: string, patch: any) => { assert.equal(id, "rate"); Object.assign(bucket, patch); },
} };
for (let i = 0; i < 60; i++) assert.equal((await (checkWorkspacePublic as any)._handler(rateCtx, { workspaceId: "workspace_test" })).allowed, true);
assert.equal((await (checkWorkspacePublic as any)._handler(rateCtx, { workspaceId: "workspace_test" })).allowed, false);
assert.equal(bucket.count, 60);
assert.equal(bucket.action, "workspace_public");
console.log("Workspace public execution: authenticated free reads, pinned origins, no billing ledger, first-call event, friendly errors and independent rate limit passed");
