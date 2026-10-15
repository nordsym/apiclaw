import assert from "node:assert/strict";
import { fetchWorkspacePublicGet, getSafePublicRedirectUrl, publicApiRetryDelay } from "./workspace-public-transport.js";
import { decodePublicApiResponse } from "./workspace-public-response.js";
import { buildPinnedPublicApiUrl, isSafePublicApiBaseUrl, type WorkspacePublicApi } from "./workspace-public-apis.js";
const api: WorkspacePublicApi = { id: "fixture", name: "Fixture", baseUrl: "https://api.fixture.org/v1", origin: "https://api.fixture.org", redirectOrigins: ["https://v2.fixture.org"] };
assert.equal(buildPinnedPublicApiUrl({ ...api, baseUrl: "https://api.fixture.org" }, "/john+3:16")?.href, "https://api.fixture.org/john+3:16");
assert.equal(buildPinnedPublicApiUrl({ ...api, baseUrl: "https://api.fixture.org/data?format=json" }, "/")?.href, "https://api.fixture.org/data?format=json");
assert.equal(buildPinnedPublicApiUrl({ ...api, baseUrl: "https://api.fixture.org/v1?format=json" }, "/child?limit=1")?.href, "https://api.fixture.org/v1/child?limit=1");
const initial = new URL(`${api.baseUrl}/data?limit=1`);
for (const url of ["https://127.0.0.2/x", "https://0x7f000001/x", "https://100.64.0.1", "https://[::1]", "https://[::ffff:127.0.0.1]", "https://localhost./x", "https://sub.localhost/x", "https://169.254.169.254/x", "https://user:pass@v2.fixture.org/x", "http://api.fixture.org/x"]) {
  assert.equal(getSafePublicRedirectUrl(api, initial, url), undefined, url);
}
assert.equal(getSafePublicRedirectUrl(api, initial, "https://evil.org/x"), undefined);
assert.equal(getSafePublicRedirectUrl(api, initial, "/v2/data")?.href, "https://api.fixture.org/v2/data");
assert.equal(getSafePublicRedirectUrl(api, initial, "https://v2.fixture.org/data")?.href, "https://v2.fixture.org/data");
assert.equal(isSafePublicApiBaseUrl("https://127.9.8.7"), undefined);
assert.equal(publicApiRetryDelay("2"), 2000);
assert.equal(publicApiRetryDelay("30"), undefined, "do not retry before a long provider Retry-After");
assert.equal(publicApiRetryDelay("Thu, 15 Oct 2026 12:00:01 GMT", Date.parse("2026-10-15T12:00:00Z")), 1000);
assert.equal(publicApiRetryDelay("not-a-date"), undefined);
assert.equal(publicApiRetryDelay(null), 250);
let attempts = 0;
const delays: number[] = [];
const destinations: string[] = [];
const request = async (url: string | URL | Request, options?: RequestInit) => {
  attempts++;
  destinations.push(String(url));
  assert.equal(options?.method, "GET");
  assert.equal(options?.redirect, "manual");
  assert.equal(options?.credentials, "omit");
  assert.deepEqual(Object.keys(options?.headers ?? {}).sort(), ["Accept", "Accept-Encoding", "User-Agent"]);
  assert.equal((options?.headers as Record<string, string>)["Accept-Encoding"], "identity");
  if (attempts === 1) return new Response(null, { status: 302, headers: { Location: "https://v2.fixture.org/data" } });
  if (attempts === 2) return new Response("{}", { status: 503, headers: { "Retry-After": "1" } });
  return new Response('{"items":[1]}');
};
const response = await fetchWorkspacePublicGet(api, initial, { fetch: request as typeof fetch, sleep: async (ms) => { delays.push(ms); } });
assert.equal(response.status, 200);
assert.equal(attempts, 3);
assert.deepEqual(delays, [1000]);
assert.deepEqual(destinations, [initial.href, "https://v2.fixture.org/data", "https://v2.fixture.org/data"]);
attempts = 0;
const failed = await fetchWorkspacePublicGet(api, initial, { fetch: (async () => { attempts++; return new Response("{}", { status: 429 }); }) as typeof fetch, sleep: async () => {} });
assert.equal(failed.status, 429);
assert.equal(attempts, 2, "at most one retry");
attempts = 0;
await fetchWorkspacePublicGet(api, initial, { fetch: (async () => { attempts++; return new Response("{}", { status: 429, headers: { "Retry-After": "60" } }); }) as typeof fetch });
assert.equal(attempts, 1);
attempts = 0;
await assert.rejects(fetchWorkspacePublicGet(api, initial, { fetch: (async () => { attempts++; return new Response(null, { status: 302, headers: { Location: "/loop" } }); }) as typeof fetch }), /redirect/);
assert.equal(attempts, 4, "three approved redirect hops maximum");
attempts = 0;
await assert.rejects(fetchWorkspacePublicGet(api, initial, { fetch: (async () => { attempts++; return new Response(null, { status: 302, headers: { Location: "https://169.254.169.254/latest" } }); }) as typeof fetch }), /redirect/);
assert.equal(attempts, 1, "never dispatch an unsafe redirect");
for (const [responseKind, accept] of [["xml", "application/xml, text/xml"], ["csv", "text/csv"], ["text", "text/plain"]] as const) {
  await fetchWorkspacePublicGet({ ...api, responseKind }, initial, { fetch: (async (_url, options) => { assert.equal((options?.headers as any).Accept, accept); return new Response("ok"); }) as typeof fetch });
}
for (const body of ['{}', '[]', '{"error":"denied"}', '{"success":false}', '<!DOCTYPE html><html>Sign in</html>', '', 'null']) {
  assert.equal(decodePublicApiResponse({}, body).valid, false, body);
}
for (const body of ['{"Errors":[{"description":"bad query"}]}', '{"errors":["invalid"]}', '{"Error":"bad"}', '{"Fault":{"message":"denied"}}', '{"status":"error","message":"bad"}', '{"code":422,"message":"Invalid query"}', '{"status":500,"message":"Server error"}', '{"response_code":1,"results":[]}']) {
  assert.equal(decodePublicApiResponse({}, body).valid, false, body);
}
assert.equal(decodePublicApiResponse({}, '{"errors":[],"results":[1]}').valid, true);
assert.equal(decodePublicApiResponse({}, '{"code":1234,"message":"Portfolio summary","value":10}').valid, true);
assert.equal(decodePublicApiResponse({}, '{"response_code":0,"results":[]}').valid, true);
assert.equal(decodePublicApiResponse({}, '"pong"').valid, true);
assert.equal(decodePublicApiResponse({}, '0').valid, true);
assert.equal(decodePublicApiResponse({ responseKind: "xml" }, '<?xml version="1.0"?><rates><rate>1</rate></rates>', 'application/xml').valid, true);
assert.equal(decodePublicApiResponse({ responseKind: "xml" }, '<error>denied</error>').valid, false);
assert.equal(decodePublicApiResponse({ responseKind: "csv" }, 'base,rate\nEUR,1.1', 'text/csv').valid, true);
assert.equal(decodePublicApiResponse({ responseKind: "text" }, 'healthy', 'text/plain').valid, true);
assert.equal(decodePublicApiResponse({ responseKind: "text" }, '<html>Login</html>').valid, false);
assert.equal(decodePublicApiResponse({ responseKind: "image" }, 'binary').valid, false);
console.log("Free public transport: approved redirects, SSRF rejection every hop, no credentials, bounded retry and reviewed response formats passed");
