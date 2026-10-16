import { isSafePublicApiBaseUrl, isAllowedPublicApiPath, type WorkspacePublicApi } from "./workspace-public-apis.js";
import { Gunzip } from "fflate";

const MAX_REDIRECTS = 3;
const REQUEST_BUDGET_MS = 20_000;
const MAX_RETRY_DELAY_MS = 2_000;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_RESPONSE_BYTES = 262_144;
const CRC32 = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

/** Some runtimes expose raw gzip, others already decode it. Bound both representations. */
async function decodeGzipResponse(response: Response): Promise<Response> {
  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (reader) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) throw new Error("Public API encoded response exceeds size limit");
      chunks.push(value);
    }
  } catch (error) { await reader?.cancel(); throw error; }
  const encoded = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { encoded.set(chunk, offset); offset += chunk.length; }
  let body = encoded;
  if (encoded[0] === 31 && encoded[1] === 139) {
    if (encoded.length < 18) throw new Error("Invalid public API gzip response");
    const output: Uint8Array[] = [];
    let decodedSize = 0;
    let finished = false;
    let checksum = 0xffffffff;
    const decoder = new Gunzip((chunk, final) => {
      decodedSize += chunk.length;
      if (decodedSize > MAX_RESPONSE_BYTES) throw new Error("Public API decoded response exceeds size limit");
      for (const byte of chunk) checksum = CRC32[(checksum ^ byte) & 255] ^ (checksum >>> 8);
      output.push(chunk.slice());
      finished = final;
    });
    // Reviewed JSON/XML endpoints use a single member, with a verifiable trailer.
    decoder.onmember = () => { throw new Error("Multiple public API gzip members are not supported"); };
    // Small compressed slices bound transient expansion before each size check.
    for (let index = 0; index < encoded.length; index += 1024) {
      decoder.push(encoded.subarray(index, index + 1024), index + 1024 >= encoded.length);
    }
    if (!finished) throw new Error("Incomplete public API gzip response");
    const trailer = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength);
    const expectedSize = trailer.getUint32(encoded.length - 4, true);
    if (expectedSize !== decodedSize) throw new Error("Invalid public API gzip size");
    if (trailer.getUint32(encoded.length - 8, true) !== ((checksum ^ 0xffffffff) >>> 0)) throw new Error("Invalid public API gzip checksum");
    body = new Uint8Array(decodedSize);
    offset = 0;
    for (const chunk of output) { body.set(chunk, offset); offset += chunk.length; }
  }
  const headers = new Headers(response.headers);
  headers.delete("Content-Encoding"); headers.delete("Content-Length");
  return new Response(body.length ? body : null, { status: response.status, statusText: response.statusText, headers });
}

/** Redirect destinations are part of the reviewed registry, never caller input. */
export function getSafePublicRedirectUrl(
  api: WorkspacePublicApi,
  current: URL,
  location: string,
): URL | undefined {
  try {
    const next = isSafePublicApiBaseUrl(new URL(location, current).toString());
    if (!next || ![api.origin, ...(api.redirectOrigins ?? [])].includes(next.origin) || !isAllowedPublicApiPath(api, next)) return undefined;
    return next;
  } catch { return undefined; }
}

/** A long Retry-After means return the failure, rather than retrying too early. */
export function publicApiRetryDelay(value: string | null, now = Date.now()): number | undefined {
  if (value === null) return 250;
  const delay = /^\d+(\.\d+)?$/.test(value.trim())
    ? Number(value) * 1000
    : Date.parse(value) - now;
  if (!Number.isFinite(delay) || delay > MAX_RETRY_DELAY_MS) return undefined;
  return Math.max(0, delay);
}

/** Fixed headers only; every hop is HTTPS, registry-approved, and credential-free. */
export async function fetchWorkspacePublicGet(
  api: WorkspacePublicApi,
  initial: URL,
  dependencies: { fetch?: typeof fetch; sleep?: (milliseconds: number) => Promise<void> } = {},
): Promise<Response> {
  if (!isSafePublicApiBaseUrl(initial.toString()) || initial.origin !== api.origin || !isAllowedPublicApiPath(api, initial)) {
    throw new Error("Unsafe public API URL");
  }
  const request = dependencies.fetch ?? fetch;
  const accept = api.responseKind === "xml" ? "application/xml, text/xml"
    : api.responseKind === "csv" ? "text/csv"
    : api.responseKind === "text" ? "text/plain" : "application/json";
  const sleep = dependencies.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const deadline = Date.now() + REQUEST_BUDGET_MS;
  const signal = AbortSignal.timeout(REQUEST_BUDGET_MS);
  let current = initial;
  let redirects = 0;
  let retried = false;
  while (true) {
    if (Date.now() >= deadline) throw new Error("Public API timeout");
    const response = await request(current.toString(), {
      method: "GET", redirect: "manual", credentials: "omit", signal,
      // Convex may expose compressed bytes without a Content-Encoding header.
      // Request the uncompressed representation so the shared decoder sees text.
      headers: { Accept: accept, "Accept-Encoding": api.acceptEncoding === "gzip" ? "gzip" : "identity", "User-Agent": "APIClaw/1.0 (+https://apiclaw.cloud; contact: support_apiclaw@nordsym.com)" },
    });
    if (REDIRECT_STATUSES.has(response.status)) {
      const location = response.headers.get("Location");
      const next = location && getSafePublicRedirectUrl(api, current, location);
      await response.body?.cancel();
      if (!next || redirects >= MAX_REDIRECTS) throw new Error("Public API redirect is not approved");
      current = next;
      redirects++;
      continue;
    }
    if (!retried && (response.status === 429 || (response.status >= 500 && response.status <= 599))) {
      const delay = publicApiRetryDelay(response.headers.get("Retry-After"));
      if (delay !== undefined && Date.now() + delay < deadline) {
        retried = true;
        await response.body?.cancel();
        await sleep(delay);
        continue;
      }
    }
    return api.acceptEncoding === "gzip" ? decodeGzipResponse(response) : response;
  }
}
