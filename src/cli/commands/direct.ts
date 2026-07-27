/**
 * Direct CLI parity with the MCP tool surface — `apiclaw discover|call|
 * details|balance`. Thin wrappers over the gateway so a CLI user has the
 * same control plane as the MCP user.
 */

import { readSession } from "../../session.js";
import { randomUUID } from "node:crypto";

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";

const GATEWAY =
  process.env.APICLAW_GATEWAY_URL || "https://adventurous-avocet-799.convex.site";

function color(c: string, s: string): string { return `${c}${s}${RESET}`; }

function authHeader(): Record<string, string> {
  const s = readSession();
  if (!s?.sessionToken) {
    console.error(color(RED, "✗ Not signed in.") + " Run: " + color(CYAN, "apiclaw login"));
    process.exit(1);
  }
  return { "X-APIClaw-Session": s.sessionToken };
}

function parseJson(s: string | undefined, label: string): unknown {
  if (!s) return undefined;
  try { return JSON.parse(s); }
  catch { console.error(color(RED, `✗ --${label} must be valid JSON`)); process.exit(1); }
}

export interface DirectGatewayRequest {
  path: string;
  method: "GET" | "POST";
  body?: unknown;
}

interface GatewayTransportOptions {
  fetchImpl?: typeof fetch;
  gatewayUrl?: string;
  authHeaders?: Record<string, string>;
  idempotencyKey?: string;
}

export class GatewayOutcomeUnknownError extends Error {
  readonly code = "outcome_unknown";

  constructor(
    readonly idempotencyKey: string,
    readonly requestPath: string,
    readonly requestId?: string,
    readonly gatewayCode = "outcome_unknown",
  ) {
    super(
      `The gateway response was lost for ${requestPath}. The operation may already have been accepted. ` +
      `Do not submit it again. Retain operation key ${idempotencyKey}` +
      `${requestId ? ` and request ID ${requestId}` : ""} for reconciliation.`,
    );
    this.name = "GatewayOutcomeUnknownError";
  }
}

export class GatewayNonRetryableError extends Error {
  readonly outcomeUnknown = false;

  constructor(
    readonly code: string,
    readonly idempotencyKey: string,
    readonly requestPath: string,
    readonly requestId?: string,
    message = "The gateway rejected this operation as non-retryable.",
  ) {
    super(`${message} Do not submit it again with a new key. Operation key: ${idempotencyKey}.`);
    this.name = "GatewayNonRetryableError";
  }
}

const SAFE_PROVIDER_ACTION = /^([A-Za-z0-9][A-Za-z0-9._-]*)\/([A-Za-z0-9][A-Za-z0-9._-]*)$/;

function asParamsRecord(value: unknown): Record<string, unknown> {
  if (value === undefined) return {};
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error("--params must be a JSON object for provider/action calls");
  }
  return value as Record<string, unknown>;
}

/**
 * Map the public CLI call contract to the correct gateway endpoint. An exact,
 * traversal-safe `provider/action` target is a managed execution request;
 * catalog API names retain the legacy `/v1/call` shape.
 */
export function buildCallGatewayRequest(
  api: string,
  opts: { path?: string; method?: string; params?: unknown; body?: unknown },
): DirectGatewayRequest {
  const managed = SAFE_PROVIDER_ACTION.exec(api);
  if (managed) {
    if (opts.path !== undefined || opts.method !== undefined || opts.body !== undefined) {
      throw new Error("provider/action calls accept --params only; omit --path, --method, and --body");
    }
    return {
      path: "/v1/execute",
      method: "POST",
      body: {
        provider: managed[1],
        action: managed[2],
        params: asParamsRecord(opts.params),
      },
    };
  }

  return {
    path: "/v1/call",
    method: "POST",
    body: {
      api,
      path: opts.path ?? "/",
      method: (opts.method ?? "GET").toUpperCase(),
      params: opts.params,
      body: opts.body,
    },
  };
}

/** Send one gateway request without retrying an ambiguous transport failure. */
export async function sendGatewayRequest<T = any>(
  request: DirectGatewayRequest,
  auth = true,
  transport: GatewayTransportOptions = {},
): Promise<T> {
  const { path, method, body } = request;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) Object.assign(headers, transport.authHeaders ?? authHeader());
  const idempotencyKey = method === "POST"
    ? transport.idempotencyKey ?? `apiclaw-cli-${randomUUID()}`
    : undefined;
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const init: RequestInit = { method, headers };
  if (method === "POST") init.body = JSON.stringify(body ?? {});
  const fetchImpl = transport.fetchImpl ?? fetch;
  const gatewayUrl = transport.gatewayUrl ?? GATEWAY;
  let res: Response;
  try {
    res = await fetchImpl(`${gatewayUrl}${path}`, init);
  } catch {
    if (idempotencyKey) throw new GatewayOutcomeUnknownError(idempotencyKey, path);
    throw new Error(`Gateway unreachable for ${path}`);
  }
  let text: string;
  try {
    text = await res.text();
  } catch {
    if (idempotencyKey) {
      throw new GatewayOutcomeUnknownError(
        idempotencyKey,
        path,
        res.headers.get("X-APIClaw-Request-Id") ?? undefined,
      );
    }
    throw new Error(`Gateway response body was unreadable for ${path}`);
  }
  let parsed: any;
  let parsedJson = true;
  try { parsed = JSON.parse(text); } catch { parsed = text; parsedJson = false; }
  if (!parsedJson && idempotencyKey) {
    throw new GatewayOutcomeUnknownError(idempotencyKey, path);
  }
  if (!res.ok) {
    const errorCode = typeof parsed?.error?.code === "string"
      ? parsed.error.code
      : typeof parsed?.code === "string"
        ? parsed.code
        : undefined;
    const retryable = typeof parsed?.error?.retryable === "boolean"
      ? parsed.error.retryable
      : typeof parsed?.retryable === "boolean"
        ? parsed.retryable
        : undefined;
    const explicitTerminalFailure = retryable === false &&
      errorCode !== "outcome_unknown" &&
      errorCode !== "idempotency_conflict";
    const outcomeUnknown = errorCode === "outcome_unknown" ||
      errorCode === "idempotency_conflict" ||
      (res.status >= 500 && !explicitTerminalFailure);
    if (idempotencyKey && (outcomeUnknown || explicitTerminalFailure)) {
      const requestId = typeof parsed?.error?.requestId === "string"
        ? parsed.error.requestId
        : typeof parsed?.requestId === "string"
          ? parsed.requestId
          : undefined;
      if (outcomeUnknown) {
        throw new GatewayOutcomeUnknownError(idempotencyKey, path, requestId, errorCode);
      }
      throw new GatewayNonRetryableError(
        errorCode || "non_retryable_gateway_error",
        idempotencyKey,
        path,
        requestId,
        parsed?.error?.message || "The gateway rejected this operation as non-retryable.",
      );
    }
    console.error(color(RED, `✗ ${path}`) + ` — ${parsed?.error?.message ?? parsed}`);
    process.exit(1);
  }
  return parsed as T;
}

async function gateway<T = any>(path: string, method: "GET" | "POST", body?: unknown, auth = true): Promise<T> {
  return sendGatewayRequest<T>({ path, method, body }, auth);
}

// ============================================
// COMMANDS
// ============================================

export async function discoverCommand(query: string, opts: { category?: string; callable?: boolean; limit?: number }) {
  const data = await gateway<any>("/v1/discover", "POST", {
    query,
    category: opts.category,
    callable_only: opts.callable ?? false,
    limit: opts.limit ?? 10,
  });
  const apis = data.apis ?? [];
  const managed = data.managedProviders ?? [];
  if (managed.length) {
    console.log(color(BOLD, "Managed providers:"));
    for (const m of managed.slice(0, 5)) {
      console.log(`  ${color(CYAN, m.providerId.padEnd(16))} ${m.name} ${color(DIM, "— " + (m.description ?? ""))}`);
    }
    console.log("");
  }
  console.log(color(BOLD, `${apis.length} APIs:`));
  for (const a of apis.slice(0, opts.limit ?? 10)) {
    const flag = a.callable ? color(GREEN, "✓") : color(DIM, "○");
    console.log(`  ${flag} ${color(CYAN, a.name.padEnd(28))} ${color(DIM, a.category ?? "")}`);
  }
  if ((data.hasMore ?? false)) console.log(color(DIM, `  …${data.total - apis.length} more — refine with --category or --callable`));
}

export async function callCommand(api: string, opts: { path?: string; method?: string; params?: string; body?: string; async?: boolean; idempotencyKey?: string }) {
  const idempotencyKey = opts.idempotencyKey?.trim();
  if (!idempotencyKey) {
    console.error(color(RED, "✗ --idempotency-key is required for API execution"));
    process.exit(1);
  }
  let request: DirectGatewayRequest;
  try {
    request = buildCallGatewayRequest(api, {
      path: opts.path,
      method: opts.method,
      params: parseJson(opts.params, "params"),
      body: parseJson(opts.body, "body"),
    });
  } catch (error) {
    console.error(color(RED, `✗ ${(error as Error).message}`));
    process.exit(1);
  }
  const data = await sendGatewayRequest<any>(request, true, { idempotencyKey });
  console.log(JSON.stringify(data, null, 2));
}

export async function detailsCommand(api: string) {
  const data = await gateway<any>("/api/details", "POST", { name: api });
  console.log(JSON.stringify(data, null, 2));
}

export async function balanceCommand() {
  const data = await gateway<any>("/api/balance", "POST", {});
  console.log("");
  console.log(color(BOLD, "Workspace balance"));
  if (data.email) console.log("  " + color(DIM, "email:    ") + data.email);
  if (data.tier) console.log("  " + color(DIM, "tier:     ") + color(CYAN, data.tier));
  if (typeof data.managedUsageCount === "number" || typeof data.usageCount === "number") {
    const used = data.managedUsageCount ?? data.usageCount;
    const limit = data.managedUsageLimit ?? data.usageLimit ?? 0;
    const suffix = limit > 0 ? ` / ${limit} lifetime` : "";
    console.log("  " + color(DIM, "managed:  ") + `${used}${suffix}`);
  }
  if (data.creditBalance !== undefined) {
    console.log("  " + color(DIM, "credits:  ") + `$${(data.creditBalance / 100).toFixed(2)}`);
  }
  console.log("");
}
