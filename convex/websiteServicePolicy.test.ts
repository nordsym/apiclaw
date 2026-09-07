import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { provisionWebsiteServiceKey, generateKey, resolveKey } from "./apiKeys";
import gateway from "./http";
import { WEBSITE_WORKSPACE_ID, WEBSITE_MODEL, WEBSITE_SERVICE_SCOPE, isWebsiteServiceScope, websiteServiceEndpointAllowed, websiteServiceBodyAllowed, websiteServiceRouteAllowed } from "./websiteServicePolicy";

assert.equal((provisionWebsiteServiceKey as any).isInternal, true);
const request = (path = "/v1/chat/completions", method = "POST", headers: Record<string, string> = {}) => new Request(`https://api.apiclaw.cloud${path}`, { method, headers });
assert.equal(websiteServiceEndpointAllowed(WEBSITE_WORKSPACE_ID, WEBSITE_SERVICE_SCOPE, request()), true);
assert.equal(isWebsiteServiceScope("other-workspace", WEBSITE_SERVICE_SCOPE), false);
for (const scope of [undefined, {}, { ...WEBSITE_SERVICE_SCOPE, managedOpenAI: false }, { ...WEBSITE_SERVICE_SCOPE, model: "openai/gpt-5.6-terra" }]) assert.equal(isWebsiteServiceScope(WEBSITE_WORKSPACE_ID, scope), false);
for (const path of ["/v1/responses", "/v1/call", "/api/balance", "/v1/messages", "/v1/missions", "/v1/models", "/v1/chat/completions/", "/v1/chat/completions/extra"]) assert.equal(websiteServiceEndpointAllowed(WEBSITE_WORKSPACE_ID, WEBSITE_SERVICE_SCOPE, request(path)), false);
assert.equal(websiteServiceEndpointAllowed(WEBSITE_WORKSPACE_ID, WEBSITE_SERVICE_SCOPE, request(undefined, "GET")), false);
for (const header of ["X-APIClaw-OAuth", "X-APIClaw-Route"]) assert.equal(websiteServiceEndpointAllowed(WEBSITE_WORKSPACE_ID, WEBSITE_SERVICE_SCOPE, request(undefined, "POST", { [header]: "synthetic" })), false);
const body = { model: WEBSITE_MODEL, stream: false, messages: [{ role: "user", content: "synthetic" }], max_tokens: 1500, reasoning_effort: "low" };
assert.equal(websiteServiceBodyAllowed(body), true);
for (const override of [{ model: "gpt-5.6-sol" }, { model: "openai/gpt-5.6-terra" }, { model: "auto" }, { stream: true }, { max_tokens: 1501 }, { max_tokens: 0 }, { max_completion_tokens: 1500 }, { tools: [] }, { provider: "openrouter" }]) assert.equal(websiteServiceBodyAllowed({ ...body, ...override }), false);
const route = { provider: "openai", model: "gpt-5.6-sol", baseUrl: "https://api.openai.com/v1/chat/completions" };
assert.equal(websiteServiceRouteAllowed(route), true);
for (const override of [{ provider: "openrouter" }, { model: "gpt-5.6-terra" }, { baseUrl: "https://example.com" }]) assert.equal(websiteServiceRouteAllowed({ ...route, ...override }), false);

// Exercise the actual Convex mutation handlers against a synthetic transactional DB facade.
const keys: any[] = Array.from({ length: 5 }, (_, i) => ({ _id: `general-${i}`, workspaceId: WEBSITE_WORKSPACE_ID, name: `general ${i}`, keyHash: `synthetic-hash-${i}` }));
const before = structuredClone(keys);
const db = {
  get: async (id: string) => id === WEBSITE_WORKSPACE_ID ? { _id: id, status: "active" } : null,
  query: (table: string) => ({ withIndex: (_index: string, select: any) => {
    let field = "", value: any;
    select({ eq: (f: string, v: any) => { field = f; value = v; return {}; } });
    const rows = () => table === "agentSessions" ? [{ workspaceId: WEBSITE_WORKSPACE_ID, sessionKind: "owner" }] : keys.filter(k => k[field] === value);
    return { first: async () => rows()[0] ?? null, collect: async () => rows() };
  } }),
  insert: async (_table: string, value: any) => { const row = { _id: `key-${keys.length}`, ...value }; keys.push(row); return row._id; },
};
const handler = (provisionWebsiteServiceKey as any)._handler;
const rawKey = `sk-claw-${"s".repeat(48)}`;
const created = await handler({ db }, { workspaceId: WEBSITE_WORKSPACE_ID, rawKey });
assert.equal(created.created, true);
assert.equal(keys.length, 6, "dedicated one-key slot does not consume or revoke five existing general keys");
assert.deepEqual(keys.slice(0, 5), before);
assert.equal(keys[5].key, "");
assert.equal(keys[5].keyHash.length, 64);
assert.equal(JSON.stringify(keys).includes(rawKey), false, "raw credential never persisted");
assert.equal(JSON.stringify(created).includes(rawKey), false, "operator retains supplied key; response metadata contains no secret");
assert.deepEqual(await handler({ db }, { workspaceId: WEBSITE_WORKSPACE_ID, rawKey }), { ...created, created: false }, "lost acknowledgement may safely replay identical key");
await assert.rejects(handler({ db }, { workspaceId: WEBSITE_WORKSPACE_ID, rawKey: `sk-claw-${"x".repeat(48)}` }), /website_service_slot_occupied/);
await assert.rejects(handler({ db }, { workspaceId: "other-workspace", rawKey }), /website_key_scope_invalid/);
await assert.rejects(handler({ db }, { workspaceId: WEBSITE_WORKSPACE_ID, rawKey: "weak" }), /website_key_scope_invalid/);
await assert.rejects((generateKey as any)._handler({ db }, { token: "synthetic", name: "sixth general" }), /Maximum 5 active keys/);
const resolved = await (resolveKey as any)._handler({ db }, { rawKey });
assert.deepEqual(resolved.serviceScope, WEBSITE_SERVICE_SCOPE);
keys[5].revokedAt = Date.now();
assert.equal(await (resolveKey as any)._handler({ db }, { rawKey }), null);
await assert.rejects(handler({ db }, { workspaceId: WEBSITE_WORKSPACE_ID, rawKey }), /website_key_conflict/);

// Integration wiring: every resolver caller returns denials instead of dropping into anonymous/shadow execution.
const http = readFileSync(new URL("./http.ts", import.meta.url), "utf8");
const resolutions = [...http.matchAll(/const auth = await resolveWorkspaceFromRequest\(ctx, request\);/g)];
assert.ok(resolutions.length >= 8);
for (const occurrence of resolutions) assert.match(http.slice(occurrence.index! + occurrence[0].length, occurrence.index! + occurrence[0].length + 80), /if \(auth instanceof Response\) return auth;/);
assert.match(http, /codexSubscriptionModel && !websiteService/);
assert.ok(http.indexOf("websiteServiceBodyAllowed(body)") < http.indexOf("const quotaGate = await enforcePreCallQuota", http.indexOf('http.route({\n  path: "/v1/chat/completions"')));
assert.match(http, /if \(websiteService && !websiteServiceRouteAllowed\(route\)\)/);

let resolutionsCount = 0;
const gatewayCtx = {
  runQuery: async () => { resolutionsCount++; return { workspaceId: WEBSITE_WORKSPACE_ID, keyId: "synthetic-key", serviceScope: WEBSITE_SERVICE_SCOPE }; },
  runMutation: async () => null,
};
for (const [path, payload] of [["/api/balance", {}], ["/v1/responses", {}], ["/v1/chat/completions", { ...body, model: "openai/gpt-5.6-terra" }]] as const) {
  const routeHandler = gateway.lookup(path, "POST")![0] as any;
  const response = await routeHandler._handler(gatewayCtx, new Request(`https://api.apiclaw.cloud${path}`, { method: "POST", headers: { Authorization: `Bearer ${rawKey}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) }));
  assert.equal(response.status, 403, `${path} must deny scoped credentials before routing or quota`);
  assert.equal((await response.json()).error.code, "service_key_scope_denied");
}
assert.equal(resolutionsCount, 3, "only credential resolution ran; no quota/settings/provider reads for forbidden requests");
console.log("website service policy: exact workspace/endpoint/model, one admin-only slot, no fallback, revocation and lost-ack replay passed");
