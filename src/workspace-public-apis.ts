/**
 * Workspace-authenticated public / no-key API execution.
 *
 * This is not the anonymous keyless proxy. Anonymous
 * `keylessPublicExecutionAvailable` stays false. These origins are executed
 * only after workspace auth, with HTTPS origin pinning, private-network
 * rejection, and explicitly approved redirects. Harvested apiKey/unknown rows stay out.
 *
 * scripts/refresh-callable.mjs compiles measured, approved audit results into
 * compact JSON plus a JSON.parse data module. The landing catalog reads the
 * JSON from disk to avoid bundling a large TypeScript literal.
 */

import { getManagedProviderAdapter } from "./product-truth.js";
import { WORKSPACE_PUBLIC_APIS_JSON } from "./workspace-public-apis.data.js";

export type WorkspacePublicApi = {
  id: string;
  name: string;
  baseUrl: string;
  origin: string;
  smokePath?: string;
  redirectOrigins?: readonly string[];
  responseKind?: "json" | "xml" | "csv" | "text" | "image";
  acceptEncoding?: "gzip";
  /** When present, only these resolved metadata endpoint paths are reviewed. */
  allowedPaths?: readonly string[];
};

export const WORKSPACE_PUBLIC_APIS = JSON.parse(
  WORKSPACE_PUBLIC_APIS_JSON,
) as readonly WorkspacePublicApi[];

const DOCS_OR_SPEC_HOSTS = new Set([
  "api.apis.guru",
  "api.swaggerhub.com",
  "virtserver.swaggerhub.com",
  "documenter.getpostman.com",
  "github.com",
  "www.github.com",
  "gitlab.com",
  "www.gitlab.com",
  "raw.githubusercontent.com",
  "developers.google.com",
  "developer.mozilla.org",
  "developer.amazon.com",
  "developer.apple.com",
  "developer.bitcoin.org",
  "developers.adidas.com",
]);

const DOCS_HOST_SUFFIXES = [
  ".github.io",
  ".readme.io",
  ".gitbook.io",
  ".notion.site",
];

export const CURATED_WORKSPACE_PUBLIC_APIS: readonly WorkspacePublicApi[] = [
  {
    id: "frankfurter",
    name: "Frankfurter",
    baseUrl: "https://api.frankfurter.dev/v1",
    origin: "https://api.frankfurter.dev",
  },
  {
    id: "coingecko",
    name: "CoinGecko",
    baseUrl: "https://api.coingecko.com/api/v3",
    origin: "https://api.coingecko.com",
  },
  {
    id: "kroki",
    name: "Kroki",
    baseUrl: "https://kroki.io",
    origin: "https://kroki.io",
  },
];

export function normalizePublicApiReference(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function isNoKeyPublicAuth(auth: unknown): boolean {
  const value = String(auth ?? "").trim().toLowerCase();
  return value === "" || value === "none" || value === "no" || value === "nokey" ||
    value === "no key" || value === "no-auth" || value === "noauth" ||
    value === "public" || value === "open";
}

export function isJunkPublicApiName(name: unknown): boolean {
  const value = String(name ?? "").trim();
  if (value.length < 2 || value.length > 120) return true;
  if (value.includes("${") || value.includes("{")) return true;
  if (/^\(?title\)?$/i.test(value)) return true;
  if (/\bdeprecated\b/i.test(value)) return true;
  return false;
}

function isBlockedPublicHost(host: string): boolean {
  if (DOCS_OR_SPEC_HOSTS.has(host)) return true;
  if (DOCS_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  if (host.startsWith("docs.") || host.startsWith("developer.") || host.startsWith("developers.")) {
    return true;
  }
  return false;
}

export function isSafePublicApiBaseUrl(value: unknown): URL | undefined {
  if (typeof value !== "string" || value.includes("${") || value.includes("{")) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:" || url.username || url.password) return undefined;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.startsWith("[") ||
    /^(0|10|127)\./.test(host) ||
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host) ||
    /^192\.0\.(0|2)\./.test(host) ||
    /^198\.1[89]\./.test(host) ||
    /^198\.51\.100\./.test(host) ||
    /^203\.0\.113\./.test(host) ||
    /^(22[4-9]|2[3-5]\d)\./.test(host) ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    return undefined;
  }
  if (isBlockedPublicHost(host)) return undefined;
  return url;
}

export function shouldUnlockHarvestedPublicApi(entry: {
  name?: string;
  auth?: string;
  baseUrl?: string;
  docsUrl?: string;
  verificationTier?: string;
}): boolean {
  if (!isNoKeyPublicAuth(entry.auth)) return false;
  if (isJunkPublicApiName(entry.name)) return false;
  if (entry.verificationTier === "dead") return false;
  if (getManagedProviderAdapter(entry.name)) return false;
  return isSafePublicApiBaseUrl(entry.baseUrl) !== undefined;
}

const byExactName = new Map<string, WorkspacePublicApi>();
const byNormalizedId = new Map<string, WorkspacePublicApi>();
for (const api of WORKSPACE_PUBLIC_APIS) {
  byExactName.set(api.name.toLowerCase().trim(), api);
  byNormalizedId.set(normalizePublicApiReference(api.id), api);
}

export const WORKSPACE_PUBLIC_EXECUTABLE_COUNT = WORKSPACE_PUBLIC_APIS.length;

const WORKSPACE_PUBLIC_CATALOG_NAMES = new Set(
  WORKSPACE_PUBLIC_APIS.map((api) => api.name.toLowerCase().trim()),
);

/** Exact catalog-card name match. Does not treat Disney+ as Disney. */
export function isWorkspacePublicCatalogCard(name: string | undefined): boolean {
  return typeof name === "string" && WORKSPACE_PUBLIC_CATALOG_NAMES.has(name.toLowerCase().trim());
}

export function getWorkspacePublicApi(
  reference: string | undefined,
): WorkspacePublicApi | undefined {
  if (!reference) return undefined;
  const candidate = reference.trim().replace(/^open:/i, "");
  const exact = byExactName.get(candidate.toLowerCase());
  if (exact) return exact;
  // Id tokens only. Do not collapse "Disney+" onto "Disney".
  if (!/^[a-z0-9_-]+$/i.test(candidate)) return undefined;
  return byNormalizedId.get(normalizePublicApiReference(candidate));
}

export function isWorkspacePublicExecutableApi(reference: string | undefined): boolean {
  const api = getWorkspacePublicApi(reference);
  // Raw CoinGecko redistribution requires a custom license. Discovery stays available.
  return api !== undefined && api.origin !== "https://api.coingecko.com";
}

export function isWorkspacePublicExecutableAction(
  reference: string | undefined,
  action: string | undefined,
): boolean {
  if (!isWorkspacePublicExecutableApi(reference) || !action) return false;
  const normalized = action.trim().toLowerCase();
  return normalized.length > 0 && normalized.length <= 64 && /^[a-z0-9_./-]+$/.test(normalized);
}

/**
 * Pin a caller path onto a cataloged public origin. Relative paths resolve
 * against the cataloged HTTPS baseUrl (not origin), so CoinGecko
 * `/simple/price` keeps `/api/v3`. Absolute https URLs stay origin-pinned.
 * Rejects origin changes, credentials, and private/docs hosts. Used by
 * /v1/execute.
 */
export function isAllowedPublicApiPath(api: WorkspacePublicApi, url: URL): boolean {
  return api.allowedPaths === undefined || api.allowedPaths.includes(url.pathname);
}

export function buildPinnedPublicApiUrl(
  api: WorkspacePublicApi,
  path: unknown,
): URL | undefined {
  const pinned = isSafePublicApiBaseUrl(api.baseUrl);
  if (!pinned || pinned.origin !== api.origin) return undefined;
  const rawPath = typeof path === "string" && path.trim() ? path.trim() : "/";
  if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
    let absolute: URL;
    try {
      absolute = new URL(rawPath);
    } catch {
      return undefined;
    }
    if (absolute.origin !== pinned.origin) return undefined;
    return isAllowedPublicApiPath(api, absolute) ? isSafePublicApiBaseUrl(absolute.toString()) : undefined;
  }
  if (!rawPath.startsWith("/") || rawPath.startsWith("//")) return undefined;
  try {
    // A leading "/" is an absolute-path URL and would drop baseUrl's prefix
    // (`/api/v3`). Treat the cataloged base as a directory and join.
    // The default path keeps a configured endpoint and query exactly. For a
    // child path, make the base a directory and force URL-relative parsing:
    // without './', a resource such as 'john+3:16' is read as a URL scheme.
    if (rawPath === "/") { pinned.hash = ""; return isAllowedPublicApiPath(api, pinned) ? pinned : undefined; }
    const base = new URL(pinned);
    base.pathname = base.pathname.endsWith("/") ? base.pathname : `${base.pathname}/`;
    base.search = "";
    base.hash = "";
    const resolved = new URL(`./${rawPath.slice(1)}`, base);
    if (resolved.origin !== pinned.origin) return undefined;
    return isAllowedPublicApiPath(api, resolved) ? isSafePublicApiBaseUrl(resolved.toString()) : undefined;
  } catch {
    return undefined;
  }
}
