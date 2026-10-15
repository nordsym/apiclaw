import { isSafePublicApiBaseUrl, type WorkspacePublicApi } from "./workspace-public-apis.js";

const MAX_REDIRECTS = 3;
const REQUEST_BUDGET_MS = 20_000;
const MAX_RETRY_DELAY_MS = 2_000;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/** Redirect destinations are part of the reviewed registry, never caller input. */
export function getSafePublicRedirectUrl(
  api: WorkspacePublicApi,
  current: URL,
  location: string,
): URL | undefined {
  try {
    const next = isSafePublicApiBaseUrl(new URL(location, current).toString());
    if (!next || ![api.origin, ...(api.redirectOrigins ?? [])].includes(next.origin)) return undefined;
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
  if (!isSafePublicApiBaseUrl(initial.toString()) || initial.origin !== api.origin) {
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
      headers: { Accept: accept, "Accept-Encoding": "identity", "User-Agent": "APIClaw/1.0 (+https://apiclaw.cloud; contact: support_apiclaw@nordsym.com)" },
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
    return response;
  }
}
