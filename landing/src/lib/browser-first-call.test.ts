import assert from "node:assert/strict";
import { runBrowserNasaCall } from "./browser-first-call";

async function main() {
let called = 0;
const response = { title: "A sky full of stars", date: "2026-10-15", explanation: "NASA result" };
const fakeFetch: typeof fetch = async (url, options) => {
  called++;
  assert.match(String(url), /https:\/\/api\.apiclaw\.cloud\/v1\/execute$/);
  assert.deepEqual(JSON.parse(String(options?.body)), { provider: "nasa", action: "apod", params: {} });
  assert.equal((options?.headers as Record<string, string>)["X-APIClaw-Session"], "test-browser-session");
  assert.ok((options?.headers as Record<string, string>)["Idempotency-Key"].startsWith("web-nasa-"));
  return Response.json({ success: true, data: response });
};
assert.deepEqual(await runBrowserNasaCall("test-browser-session", fakeFetch), response);
assert.equal(called, 1);
await assert.rejects(runBrowserNasaCall("test-browser-session", async () => Response.json({ error: "raw upstream exception" }, { status: 503 })), /NASA could not return/);
await assert.rejects(runBrowserNasaCall("test-browser-session", async () => Response.json({}, { status: 429 })), /NASA is busy/);
await assert.rejects(runBrowserNasaCall("test-browser-session", async () => Response.json({ success: true, data: {} })), /NASA could not return/);
const originalFetch = globalThis.fetch;
try {
  let attempts = 0;
  const renewed = "renewed-browser-child-token-for-test";
  globalThis.fetch = async () => Response.json({ browserToken: renewed, browserExpiresAt: Date.now() + 60_000 });
  const recovered = await runBrowserNasaCall("expired-browser-session", async (_url, options) => {
    attempts++;
    if (attempts === 1) return Response.json({}, { status: 401 });
    assert.equal((options?.headers as Record<string, string>)["X-APIClaw-Session"], renewed);
    return Response.json({ success: true, data: response });
  });
  assert.deepEqual(recovered, response);
  assert.equal(attempts, 2);
} finally { globalThis.fetch = originalFetch; }
console.log("browser first call: customer session, NASA result, safe failure and rate-limit feedback passed");

}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
