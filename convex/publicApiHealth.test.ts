import assert from "node:assert/strict";
import { getFunctionName } from "convex/server";
import { isHealthy, record, snapshot, recheck, probePublicApiHealth } from "./publicApiHealth";
import { WORKSPACE_PUBLIC_APIS, getWorkspacePublicApi } from "../src/workspace-public-apis";
const frankfurter = getWorkspacePublicApi("frankfurter")!;
assert.ok(frankfurter);
const rows = new Map<string, any>();
let apiId = "";
const ctx: any = { db: {
  query: (table: string) => { assert.equal(table, "publicApiHealth"); return {
    withIndex: (index: string, apply: any) => { assert.equal(index, "by_apiId"); apply({ eq: (_field: string, id: string) => { apiId = id; } }); const id = apiId; return { unique: async () => rows.get(id) ?? null }; },
  }; },
  insert: async (table: string, row: any) => { assert.equal(table, "publicApiHealth"); rows.set(row.apiId, { _id: row.apiId, ...row }); },
  patch: async (id: string, patch: any) => { Object.assign(rows.get(id), patch); },
} };
const run = (fn: any, args: any = {}) => fn._handler(ctx, args);
assert.equal(await run(isHealthy, { apiId: frankfurter.id }), true, "reviewed baseline works before first sweep");
assert.equal(await run(isHealthy, { apiId: "unapproved" }), false);
assert.deepEqual(await run(snapshot), { approvedIds: WORKSPACE_PUBLIC_APIS.map((api) => api.id), disabledIds: [], checkedAt: null });
await run(record, { apiId: frankfurter.id, healthy: false, status: 503, checkedAt: 100 });
assert.equal(await run(isHealthy, { apiId: frankfurter.id }), false);
assert.deepEqual((await run(snapshot)).disabledIds, [frankfurter.id]);
await run(record, { apiId: frankfurter.id, healthy: true, status: 200, checkedAt: 99 });
assert.equal(await run(isHealthy, { apiId: frankfurter.id }), false, "late older checks cannot override failures");
await run(record, { apiId: frankfurter.id, healthy: true, status: 200, checkedAt: 101 });
assert.equal(await run(isHealthy, { apiId: frankfurter.id }), true, "only an already approved API can recover");
await assert.rejects(run(record, { apiId: "unapproved", healthy: true, status: 200, checkedAt: 102 }), /not approved/);
assert.equal(rows.has("unapproved"), false);
const fake = (text: string, status = 200, headers = {}) => (async () => new Response(text, { status, headers })) as typeof fetch;
assert.deepEqual(await probePublicApiHealth(frankfurter, fake('{"rates":{"USD":1}}')), { healthy: true, status: 200 });
for (const body of ['<html>Sign in</html>', '{"error":"invalid"}', '{"success":false}', 'not-json']) {
  assert.equal((await probePublicApiHealth(frankfurter, fake(body))).healthy, false);
}
assert.equal((await probePublicApiHealth({ ...frankfurter, responseKind: "xml" }, fake('<rates><USD>1.2</USD></rates>', 200, { "Content-Type": "application/xml" }))).healthy, true);
assert.equal((await probePublicApiHealth(frankfurter, fake('"' + "x".repeat(262_145) + '"'))).healthy, false, "response reads are bounded");
assert.equal((await probePublicApiHealth(frankfurter, fake('{}', 429, { "Retry-After": "60" }))).healthy, false);

const originalFetch = globalThis.fetch;
let active = 0, maxActive = 0;
const origins = new Set<string>();
const scheduled: Array<any> = [];
try {
  globalThis.fetch = (async (url) => {
    const origin = new URL(String(url)).origin;
    assert.equal(origins.has(origin), false, "origin probes are serialized");
    origins.add(origin); active++; maxActive = Math.max(maxActive, active);
    assert.ok(WORKSPACE_PUBLIC_APIS.some((api) => api.origin === origin), "never probe unapproved APIs");
    await new Promise((resolve) => setTimeout(resolve, 1));
    origins.delete(origin); active--;
    const api = WORKSPACE_PUBLIC_APIS.find((api) => api.origin === origin)!;
    return api.responseKind === "xml"
      ? new Response("<catalog><item>Public data</item></catalog>", { headers: { "Content-Type": "application/xml" } })
      : Response.json({ ok: true });
  }) as typeof fetch;
  ctx.runMutation = async (reference: any, args: any) => {
    assert.equal(getFunctionName(reference), "publicApiHealth:record", "no usage, billing or secret mutation");
    return run(record, args);
  };
  ctx.scheduler = { runAfter: async (delay: number, reference: any, args: any) => {
    assert.equal(delay, 0); assert.equal(getFunctionName(reference), "publicApiHealth:recheck"); scheduled.push(args);
  } };
  const result = await run(recheck, { offset: 0 });
  assert.equal(result.checked, Math.min(20, WORKSPACE_PUBLIC_APIS.length));
  assert.equal(maxActive <= 4, true);
  assert.equal(scheduled.length, WORKSPACE_PUBLIC_APIS.length > 20 ? 1 : 0);
  if (scheduled.length) assert.equal(scheduled[0].offset, 20);
  assert.equal((await run(snapshot)).disabledIds.length, 0);
  await assert.rejects(run(recheck, { offset: -1 }), /offset/);
} finally { globalThis.fetch = originalFetch; }
console.log("Public health overlay: demotion, safe recovery, no promotion, bounded canonical probes, concurrency and snapshot passed");
