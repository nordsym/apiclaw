import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { fetchWorkspacePublicGet } from "./workspace-public-transport.js";
import type { WorkspacePublicApi } from "./workspace-public-apis.js";
const api = { id: "gzip-fixture", name: "Compressed API", baseUrl: "https://fixture.org", origin: "https://fixture.org", acceptEncoding: "gzip" } as WorkspacePublicApi & { acceptEncoding: "gzip" };
const payload = '{"items":[{"id":1,"label":"A useful response"}]}';
for (const encoded of [true, false]) {
  const response = await fetchWorkspacePublicGet(api, new URL(api.baseUrl), { fetch: async (_url, options) => {
    assert.equal(new Headers(options?.headers).get("Accept-Encoding"), "gzip");
    assert.equal(new Headers(options?.headers).has("X-APIClaw-Session"), false);
    return new Response(encoded ? gzipSync(payload) : payload, { headers: { "Content-Type": "application/json", ...(encoded ? {} : { "Content-Encoding": "gzip" }) } });
  } });
  assert.equal(await response.text(), payload, "raw gzip and fetch-decoded gzip both return plain data");
  assert.equal(response.headers.get("Content-Encoding"), null);
}
for (const body of [gzipSync('"' + "A".repeat(262_145) + '"'), Buffer.alloc(262_145), Buffer.from([31, 139, 8, 0]), gzipSync(payload).subarray(0, -6)]) {
  await assert.rejects(fetchWorkspacePublicGet(api, new URL(api.baseUrl), { fetch: async () => new Response(body) }), /public API|Public API|gzip|data/i);
}
const split = gzipSync(payload);
const corrupted = Buffer.from(split);
corrupted[corrupted.length - 8] ^= 1;
await assert.rejects(fetchWorkspacePublicGet(api, new URL(api.baseUrl), { fetch: async () => new Response(corrupted) }), /checksum/);
await assert.rejects(fetchWorkspacePublicGet(api, new URL(api.baseUrl), { fetch: async () => new Response(Buffer.concat([gzipSync('{"items":'), gzipSync('[1]}')])) }), /Multiple/);
const response = await fetchWorkspacePublicGet(api, new URL(api.baseUrl), { fetch: async () => new Response(new ReadableStream({ start(controller) { for (const byte of split) controller.enqueue(Uint8Array.of(byte)); controller.close(); } })) });
assert.equal(await response.text(), payload, "one-byte input chunks retain gzip magic and framing");
console.log("Public compression: gzip negotiation, cross-runtime decoding, bounded encoded/decoded bodies, malformed data and no credential forwarding passed");
