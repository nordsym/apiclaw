const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]+$/;
export const IDEMPOTENCY_KEY_MAX_LENGTH = 128;
export const MANAGED_REQUEST_BODY_MAX_BYTES = 1_048_576;
export const MAX_MANAGED_OUTPUT_TOKENS = 128_000;
const GITHUB_SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/;
const GITHUB_SEGMENT_MAX_LENGTH = 100;
const GITHUB_CONTENT_PATH_MAX_LENGTH = 1_024;

export class InvalidIdempotencyKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidIdempotencyKeyError";
  }
}

export function validateIdempotencyKey(value: string): void {
  if (value.length < 1 || value.length > IDEMPOTENCY_KEY_MAX_LENGTH) {
    throw new InvalidIdempotencyKeyError(
      `Idempotency-Key must be between 1 and ${IDEMPOTENCY_KEY_MAX_LENGTH} characters.`,
    );
  }
  if (!IDEMPOTENCY_KEY_PATTERN.test(value)) {
    throw new InvalidIdempotencyKeyError(
      "Idempotency-Key may only contain letters, numbers, dot, underscore, colon, and hyphen.",
    );
  }
}

export function requireManagedIdempotencyKey(
  value: string | null,
  trafficClass: "customer" | "internal",
): string | null {
  if (value === null) {
    if (trafficClass === "customer") {
      throw new InvalidIdempotencyKeyError(
        "Idempotency-Key is required for customer managed calls.",
      );
    }
    return null;
  }
  validateIdempotencyKey(value);
  return value;
}

export function hasCustomerManagedCredential(headers: Headers): boolean {
  if (headers.get("X-APIClaw-Session") || headers.get("X-APIClaw-Api-Key")) return true;
  const authorization = headers.get("Authorization") ?? "";
  return /^(Bearer|Api-Key)\s+sk-(claw|mcp)-/i.test(authorization);
}

export function synthesizeLegacyIdempotencyKey(): string {
  return `legacy-${crypto.randomUUID()}`;
}

export const LEGACY_CLIENT_MINIMUM_VERSION = "2.8.7";
export const LEGACY_CLIENT_UPGRADE_COMMANDS = [
  "npm install -g @nordsym/apiclaw@2.8.7",
  "apiclaw auth login --force",
] as const;

export function rewriteLegacyProviderActionCall(body: unknown): {
  provider: string;
  action: string;
  params: Record<string, unknown>;
} | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;
  const provider = typeof record.provider === "string" ? record.provider.trim() : "";
  const action = typeof record.action === "string" ? record.action.trim() : "";
  const api = typeof record.api === "string" ? record.api.trim() : "";
  if (!provider || !action || api) return null;
  const params =
    record.params && typeof record.params === "object" && !Array.isArray(record.params)
      ? record.params as Record<string, unknown>
      : {};
  return { provider, action, params };
}

/**
 * Block only the forgeable 2.8.6 local-MCP shape: an empty X-APIClaw-Internal
 * header with no customer credential. Published latest must still complete a
 * first managed call on /v1/execute (and /v1/call rewritten to execute).
 * Workspace-header-only Internal traffic stays fail-closed.
 */
export function requiresLegacyClientUpgrade(
  _path: "/v1/execute" | "/v1/call",
  headers: Headers,
): boolean {
  if (headers.get("Idempotency-Key") !== null) return false;
  if (hasCustomerManagedCredential(headers)) return false;
  const internal = headers.get("X-APIClaw-Internal");
  return internal !== null && internal.trim() === "";
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const item = (value as Record<string, unknown>)[key];
      if (item !== undefined) result[key] = canonicalize(item);
    }
    return result;
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function deriveRequestFingerprint(payload: unknown): Promise<string> {
  return `fp_${await sha256(canonicalJson(payload ?? null))}`;
}

export async function deriveManagedRequestId(args: {
  idempotencyKey: string | null;
  workspaceId: string;
  provider: string;
  action: string;
  path: string;
  model?: string;
  payload?: unknown;
}): Promise<string> {
  if (args.idempotencyKey === null) return crypto.randomUUID();
  validateIdempotencyKey(args.idempotencyKey);

  const scopedHash = await sha256(canonicalJson({
    workspaceId: args.workspaceId,
    key: args.idempotencyKey,
  }));
  return `idem_${scopedHash}`;
}

export function normalizeMaxOutputTokens(value: unknown, fallback = 2_000): number {
  const normalized = value === undefined || value === null ? fallback : Number(value);
  if (!Number.isSafeInteger(normalized) || normalized < 1 || normalized > MAX_MANAGED_OUTPUT_TOKENS) {
    throw new RangeError(`Maximum output tokens must be an integer from 1 to ${MAX_MANAGED_OUTPUT_TOKENS}.`);
  }
  return normalized;
}

function encodeGitHubSegment(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new TypeError(`${label} must be a string.`);
  }
  const normalized = value.trim();
  if (
    normalized.length < 1 ||
    normalized.length > GITHUB_SEGMENT_MAX_LENGTH ||
    normalized === "." ||
    normalized === ".." ||
    !GITHUB_SEGMENT_PATTERN.test(normalized)
  ) {
    throw new RangeError(`${label} contains an unsafe GitHub path segment.`);
  }
  return encodeURIComponent(normalized);
}

export function githubRepositoryApiUrl(owner: unknown, repo: unknown): string {
  return `https://api.github.com/repos/${encodeGitHubSegment(owner, "owner")}/${encodeGitHubSegment(repo, "repo")}`;
}

export function githubContentsApiUrl(owner: unknown, repo: unknown, path: unknown): string {
  if (typeof path !== "string" || path.length < 1 || path.length > GITHUB_CONTENT_PATH_MAX_LENGTH) {
    throw new RangeError("path must be a non-empty GitHub content path of at most 1024 characters.");
  }
  const encodedPath = path.split("/").map((segment) => {
    if (
      segment.length < 1 ||
      segment.length > 255 ||
      segment === "." ||
      segment === ".." ||
      segment.includes("\\") ||
      segment.includes("%") ||
      /[\u0000-\u001f\u007f]/.test(segment)
    ) {
      throw new RangeError("path contains an unsafe GitHub content segment.");
    }
    return encodeURIComponent(segment);
  }).join("/");
  return `${githubRepositoryApiUrl(owner, repo)}/contents/${encodedPath}`;
}
