// Canonical MCP tool surface — single source of truth for the Remote MCP
// runtime served from /mcp. Local MCP (src/index.ts in @nordsym/apiclaw)
// today maintains its own list; converging the two is tracked separately.
//
// Tools are deliberately scoped to what makes sense over an OAuth-gated
// remote runtime. Workspace bootstrap (register_owner, verify_code,
// purchase_access, add_credits, setup_metered_billing, remind_owner) is
// out — that flow belongs to the dashboard / CLI login. Everything else
// the local MCP exposes lives here.

import { CONVEX_BASE_URL } from "./convex";

const SITE_URL = CONVEX_BASE_URL.replace(".convex.cloud", ".convex.site");

export const CANONICAL_MCP_TOOLS = [
  // ----- INTRO -----
  {
    name: "apiclaw_help",
    description:
      "Get help and a tour of APIClaw's tool surface. Start here if you are new to APIClaw.",
    inputSchema: { type: "object", properties: {} },
  },
  // ----- DISCOVERY -----
  {
    name: "discover_apis",
    description:
      "Search APIClaw's catalog of 26,000+ APIs by capability. Use when the user asks 'what API can do X?' or needs provider recommendations.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language query (e.g., 'send SMS to Sweden')" },
        category: { type: "string", description: "Optional category filter" },
        callable_only: { type: "boolean", description: "Only return APIs APIClaw can execute right now", default: false },
        max_results: { type: "number", description: "Max results to return", default: 5 },
      },
      required: ["query"],
    },
  },
  {
    name: "get_api_details",
    description: "Full specs, pricing, auth, and usage examples for a specific API.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "API or provider name" } },
      required: ["name"],
    },
  },
  {
    name: "list_categories",
    description: "Browse APIClaw's API catalog by category.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_connected",
    description: "List managed provider adapters ready for execution. Provider keys stay server-side with APIClaw.",
    inputSchema: { type: "object", properties: {} },
  },
  // ----- MODELS -----
  {
    name: "list_models",
    description:
      "List the live APIClaw model catalog. Entries identify the model owner, serving source, and compatible gateway endpoint. Catalog presence does not prove execution readiness.",
    inputSchema: {
      type: "object",
      properties: {
        provider: { type: "string", description: "Optional: filter to one provider (anthropic, openai, xai, groq, mistral, openrouter, etc.)" },
      },
    },
  },
  // ----- EXECUTION -----
  {
    name: "call_api",
    description:
      "Execute a managed provider action through APIClaw's gateway. Provider auth stays server-side.",
    inputSchema: {
      type: "object",
      properties: {
        provider: { type: "string", description: "Managed provider ID (e.g., brave_search, openrouter, github, nasa, apilayer)" },
        action: { type: "string", description: "Provider action (e.g., search, chat, search_repos)" },
        params: { type: "object", description: "Parameters for the selected provider action" },
        idempotency_key: { type: "string", description: "Required caller-owned operation key. Keep it with the result. If the outcome is ambiguous, do not submit the operation again; retain this key and the request ID for reconciliation." },
      },
      required: ["provider", "action", "idempotency_key"],
    },
  },
  // ----- BILLING / OBSERVABILITY -----
  {
    name: "check_balance",
    description: "Check workspace tier, lifetime activation allowance, and verified PAYG status.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "check_workspace_status",
    description: "Health check for the current workspace (auth state, tier, gating, blockers).",
    inputSchema: { type: "object", properties: {} },
  },
  // ----- CONTROL PLANE — MISSIONS -----
  {
    name: "list_mission_templates",
    description: "List available mission templates and the parameters each accepts.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "start_mission",
    description:
      "Start a mission — a structured, observable orchestration that runs on APIClaw's runtime. Use for multi-step tasks (e.g. 'generate a PRD'). Returns a missionId you can poll with mission_status. Legacy templates run through the hand-coded path; data-driven templates run through the v2 composition runner when template_version is pinned.",
    inputSchema: {
      type: "object",
      properties: {
        template: { type: "string", description: "Template slug — call list_mission_templates to see what is available." },
        template_version: { type: "number", description: "Optional pinned version for data-driven (v2) templates. Omit to use latest enabled." },
        params: { type: "object", description: "Template-specific parameters" },
        idempotency_key: { type: "string", description: "Required caller-owned mission operation key. If the outcome is ambiguous, do not submit again; retain this key and the request ID for reconciliation." },
      },
      required: ["template", "idempotency_key"],
    },
  },
  {
    name: "discover_missions",
    description:
      "Search mission templates by natural-language query. Returns ranked templates with slug, version, title, description, paramSchema, and match reasons. Ranking combines keyword relevance with live success-rate signal from providerHealth — templates whose steps call providers that have been degrading in the last 30 days slide down automatically. Use this to find the right template by intent before calling start_mission.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural-language description of what the agent wants done." },
        max_results: { type: "number", description: "Default 5, max 25.", default: 5 },
      },
      required: ["query"],
    },
  },
  {
    name: "mission_status",
    description: "Check status, audit events, cost, and final result for a mission started via start_mission.",
    inputSchema: {
      type: "object",
      properties: { mission_id: { type: "string", description: "Mission id from start_mission" } },
      required: ["mission_id"],
    },
  },
  {
    name: "list_missions",
    description: "List recent missions in the current workspace (most recent first).",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number", description: "Max rows (default 20, max 200)" } },
    },
  },
] as const;

// ============================================
// DISPATCH
// ============================================
// Maps a tool name to the gateway HTTP call. All routes accept the bearer
// the remote-MCP runtime forwards via Authorization header, so workspace
// resolution + billing + observability happens server-side.

type DispatchContext = { bearer: string };

export const MCP_UPSTREAM_RESPONSE_MAX_BYTES = 512 * 1024;
export const MCP_UPSTREAM_TIMEOUT_MS = 30_000;

export class McpUpstreamResponseError extends Error {
  constructor(message: string, readonly code: "response_too_large" | "invalid_response") {
    super(message);
    this.name = "McpUpstreamResponseError";
  }
}

export class McpGatewayOutcomeUnknownError extends Error {
  readonly code = "outcome_unknown";

  constructor(
    readonly idempotencyKey: string,
    readonly path: string,
    readonly requestId?: string,
    readonly gatewayCode = "outcome_unknown",
  ) {
    super(
      `The gateway response was lost for ${path}. The operation may already have been accepted. ` +
      `Do not retry it with a new key. Check Activity using idempotency key ${idempotencyKey}.`,
    );
    this.name = "McpGatewayOutcomeUnknownError";
  }
}

export class McpGatewayNonRetryableError extends Error {
  readonly outcomeUnknown = false;

  constructor(
    readonly code: string,
    readonly idempotencyKey: string,
    readonly path: string,
    readonly requestId?: string,
    message = "The gateway rejected this operation as non-retryable.",
  ) {
    super(`${message} Do not submit it again with a new key. Operation key: ${idempotencyKey}.`);
    this.name = "McpGatewayNonRetryableError";
  }
}

/**
 * Read a gateway response without ever materializing more than the configured
 * byte cap. Content-Length is an early rejection only; the stream count is the
 * authority, so missing and falsely small declarations cannot bypass the cap.
 */
export async function readGatewayResponseTextCapped(
  response: Pick<Response, "headers" | "body">,
  maxBytes = MCP_UPSTREAM_RESPONSE_MAX_BYTES,
): Promise<string> {
  const declaredRaw = response.headers.get("content-length");
  if (declaredRaw !== null && /^\d+$/.test(declaredRaw)) {
    const declared = Number(declaredRaw);
    if (!Number.isSafeInteger(declared) || declared > maxBytes) {
      throw new McpUpstreamResponseError(
        "Gateway response exceeds the remote MCP upstream limit",
        "response_too_large",
      );
    }
  }

  const reader = response.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        try { await reader.cancel(); } catch { /* already closing */ }
        throw new McpUpstreamResponseError(
          "Gateway response exceeds the remote MCP upstream limit",
          "response_too_large",
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new McpUpstreamResponseError(
      "Gateway response is not valid UTF-8",
      "invalid_response",
    );
  }
}

type BestEffortBudgetOptions = {
  maxCalls: number;
  windowMs: number;
  maxConcurrent: number;
  maxTrackedKeys: number;
};

type BestEffortBudgetLease =
  | { ok: true; release: () => void }
  | { ok: false; reason: "rate_limit" | "concurrency_limit" | "capacity_limit" };

/**
 * Instance-local defense in depth for the Vercel route. This deliberately does
 * not claim distributed enforcement: managed execution still relies on the
 * Convex gateway's authoritative auth, quota, cost, and idempotency gates.
 */
export function createBestEffortMcpToolBudget(
  options: BestEffortBudgetOptions,
): { acquire: (key: string, now?: number) => BestEffortBudgetLease } {
  type Bucket = {
    windowStartedAt: number;
    calls: number;
    inFlight: number;
    lastSeenAt: number;
  };
  const buckets = new Map<string, Bucket>();

  function prune(now: number) {
    buckets.forEach((bucket, key) => {
      if (bucket.inFlight === 0 && now - bucket.lastSeenAt >= options.windowMs) {
        buckets.delete(key);
      }
    });
  }

  return {
    acquire(key: string, now = Date.now()): BestEffortBudgetLease {
      let bucket = buckets.get(key);
      if (!bucket) {
        if (buckets.size >= options.maxTrackedKeys) prune(now);
        if (buckets.size >= options.maxTrackedKeys) {
          return { ok: false, reason: "capacity_limit" };
        }
        bucket = { windowStartedAt: now, calls: 0, inFlight: 0, lastSeenAt: now };
        buckets.set(key, bucket);
      }

      if (now - bucket.windowStartedAt >= options.windowMs) {
        bucket.windowStartedAt = now;
        bucket.calls = 0;
      }
      bucket.lastSeenAt = now;
      if (bucket.calls >= options.maxCalls) {
        return { ok: false, reason: "rate_limit" };
      }
      if (bucket.inFlight >= options.maxConcurrent) {
        return { ok: false, reason: "concurrency_limit" };
      }

      bucket.calls += 1;
      bucket.inFlight += 1;
      let released = false;
      return {
        ok: true,
        release: () => {
          if (released) return;
          released = true;
          bucket!.inFlight = Math.max(0, bucket!.inFlight - 1);
        },
      };
    },
  };
}

async function callGateway<T = unknown>(
  path: string,
  method: "GET" | "POST",
  ctx: DispatchContext,
  body?: unknown,
  options: { idempotencyKey?: string } = {},
): Promise<T> {
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ctx.bearer}`,
      "X-APIClaw-Source": "remote-mcp",
      ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
    },
  };
  if (method === "POST") init.body = JSON.stringify(body ?? {});
  let res: Response;
  try {
    res = await fetch(`${SITE_URL}${path}`, {
      ...init,
      signal: AbortSignal.timeout(MCP_UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    if (options.idempotencyKey) {
      throw new McpGatewayOutcomeUnknownError(options.idempotencyKey, path);
    }
    throw error;
  }
  let text: string;
  try {
    text = await readGatewayResponseTextCapped(res);
  } catch (error) {
    if (options.idempotencyKey) {
      throw new McpGatewayOutcomeUnknownError(
        options.idempotencyKey,
        path,
        res.headers.get("X-APIClaw-Request-Id") ?? undefined,
        error instanceof McpUpstreamResponseError ? error.code : "outcome_unknown",
      );
    }
    throw error;
  }
  let parsed: unknown = text;
  let parsedJson = true;
  try { parsed = JSON.parse(text); } catch { parsedJson = false; }
  if (!parsedJson && options.idempotencyKey) {
    throw new McpGatewayOutcomeUnknownError(options.idempotencyKey, path);
  }
  if (!res.ok) {
    const payload = typeof parsed === "object" && parsed !== null
      ? parsed as { code?: unknown; requestId?: unknown; retryable?: unknown; error?: { code?: unknown; requestId?: unknown; retryable?: unknown } }
      : undefined;
    const errorCode = typeof payload?.error?.code === "string"
      ? payload.error.code
      : typeof payload?.code === "string"
        ? payload.code
        : undefined;
    const retryable = typeof payload?.error?.retryable === "boolean"
      ? payload.error.retryable
      : typeof payload?.retryable === "boolean"
        ? payload.retryable
        : undefined;
    const explicitTerminalFailure = retryable === false &&
      errorCode !== "outcome_unknown" &&
      errorCode !== "idempotency_conflict";
    const outcomeUnknown = errorCode === "idempotency_conflict" ||
      errorCode === "outcome_unknown" ||
      (res.status >= 500 && !explicitTerminalFailure);
    if (options.idempotencyKey && (outcomeUnknown || explicitTerminalFailure)) {
      const requestId = typeof payload?.error?.requestId === "string"
        ? payload.error.requestId
        : typeof payload?.requestId === "string"
          ? payload.requestId
          : undefined;
      if (outcomeUnknown) {
        throw new McpGatewayOutcomeUnknownError(options.idempotencyKey, path, requestId, errorCode);
      }
      const message = typeof (parsed as any)?.error?.message === "string"
        ? (parsed as any).error.message
        : "The gateway rejected this operation as non-retryable.";
      throw new McpGatewayNonRetryableError(
        errorCode || "non_retryable_gateway_error",
        options.idempotencyKey,
        path,
        requestId,
        message,
      );
    }
    throw new Error(typeof parsed === "string" ? parsed : JSON.stringify(parsed));
  }
  return parsed as T;
}

export async function dispatchCanonicalTool(
  name: string,
  args: Record<string, unknown>,
  ctx: DispatchContext
): Promise<unknown> {
  switch (name) {
    case "apiclaw_help":
      return {
        name: "APIClaw: authenticated execution and discovery layer for agents.",
        tools: CANONICAL_MCP_TOOLS.map((t) => ({ name: t.name, description: t.description })),
        docs: "https://apiclaw.cloud/docs",
        catalog: "https://apiclaw.cloud/catalog",
      };

    // Models
    case "list_models": {
      const q = args.provider ? `?provider=${encodeURIComponent(String(args.provider))}` : "";
      return callGateway(`/v1/models${q}`, "GET", ctx);
    }

    // Discovery
    case "discover_apis":
      return callGateway("/v1/discover", "POST", ctx, {
        query: args.query ?? "",
        category: args.category,
        callable_only: args.callable_only ?? false,
        limit: args.max_results ?? 5,
      });
    case "get_api_details":
      return callGateway("/api/details", "POST", ctx, { name: args.name });
    case "list_categories":
      return callGateway("/v1/discover", "POST", ctx, { query: "", limit: 1 });
    case "list_connected":
      return callGateway("/v1/discover", "POST", ctx, {
        query: "",
        tier: "managed",
        callable_only: true,
        limit: 100,
      });
    // Execution
    case "call_api": {
      const provider = typeof args.provider === "string" ? args.provider.trim() : "";
      const action = typeof args.action === "string" ? args.action.trim() : "";
      if (!provider) throw new Error("provider is required");
      if (!action) throw new Error("action is required");
      const idempotencyKey = typeof args.idempotency_key === "string"
        ? args.idempotency_key.trim()
        : "";
      if (!idempotencyKey) throw new Error("idempotency_key is required for managed execution");
      return callGateway("/v1/execute", "POST", ctx, {
        provider,
        action,
        params: args.params ?? {},
      }, { idempotencyKey });
    }
    // Billing / observability
    case "check_balance":
      return callGateway("/api/balance", "POST", ctx);
    case "check_workspace_status":
      return callGateway("/api/balance", "POST", ctx);

    // Missions
    case "list_mission_templates":
      return callGateway("/v1/missions/templates", "GET", ctx);
    case "start_mission": {
      const idempotencyKey = typeof args.idempotency_key === "string"
        ? args.idempotency_key.trim()
        : "";
      if (!idempotencyKey) throw new Error("idempotency_key is required to start a mission");
      return callGateway("/v1/missions/start", "POST", ctx, {
        template: args.template,
        templateVersion: typeof args.template_version === "number" ? args.template_version : undefined,
        params: args.params ?? {},
      }, { idempotencyKey });
    }
    case "mission_status":
      return callGateway(`/v1/missions/${encodeURIComponent(String(args.mission_id))}`, "GET", ctx);
    case "list_missions":
      return callGateway(`/v1/missions?limit=${Math.min(Number(args.limit ?? 20), 200)}`, "GET", ctx);
    case "discover_missions": {
      const q = encodeURIComponent(String(args.query ?? ""));
      const max = Math.min(Math.max(Number(args.max_results ?? 5), 1), 25);
      return callGateway(`/v1/missions/discover?query=${q}&max_results=${max}`, "GET", ctx);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export const CANONICAL_TOOL_NAMES = CANONICAL_MCP_TOOLS.map((t) => t.name);
