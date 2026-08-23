// Remote MCP endpoint — Streamable HTTP transport per MCP spec (2025-03).
// Accepts JSON-RPC 2.0 over POST. Bearer-token gated (sk-mcp-*).
//
// On 401 we emit a WWW-Authenticate header pointing at the protected-resource
// metadata document, so MCP clients (Grok, Cursor, ChatGPT, Claude Desktop)
// can auto-discover the auth server and run the OAuth flow without manual
// configuration.
import { NextRequest, NextResponse } from "next/server";
import { convexQuery, convexMutation } from "@/lib/convex";
import {
  CANONICAL_MCP_TOOLS,
  createBestEffortMcpToolBudget,
  dispatchCanonicalTool,
} from "@/lib/mcp-tools-canon";
import {
  filterMcpToolsForScope,
  mcpScopeAllowsTool,
  requiredMcpCapabilityForTool,
} from "@apiclaw/mcp-scope-policy";
import {
  jsonByteLength,
  mapWithConcurrency,
  McpRequestBodyError,
  MCP_BATCH_CONCURRENCY,
  MCP_BATCH_RESULT_MAX_BYTES,
  MCP_RESULT_MAX_BYTES,
  parseDeclaredContentLength,
  readMcpJsonBodyCapped,
  validateMcpBatchSize,
} from "./limits";

export const runtime = "nodejs";

const PROTOCOL_VERSION = "2025-03-26";
const MCP_RESOURCE = "https://apiclaw.cloud/mcp";
const RESOURCE_METADATA_URL = "https://apiclaw.cloud/.well-known/oauth-protected-resource";

type JsonRpcId = string | number | null;
type JsonRpcRequest = { jsonrpc: "2.0"; id: JsonRpcId; method: string; params?: unknown };

type WorkspaceContext = {
  ok: true;
  tokenId: string;
  workspaceId: string;
  clientId: string;
  scope: string;
  email?: string;
  tier?: string;
  usageCount?: number;
  usageLimit?: number;
  bearer: string;
};

type ContextDenial = { ok: false; status: number; body: unknown; headers?: Record<string, string> };

// Tool surface lives in mcp-tools-canon.ts so /mcp and any future sibling
// routes (e.g. /mcp/sse) read from one definition and stay drift-free.
const TOOLS = CANONICAL_MCP_TOOLS;

// Best-effort instance-local protection against one OAuth token monopolizing a
// warm route instance. Authoritative distributed execution limits remain in
// the Convex gateway and are applied again by /v1/execute.
const bestEffortToolBudget = createBestEffortMcpToolBudget({
  maxCalls: 60,
  windowMs: 60_000,
  maxConcurrent: 4,
  maxTrackedKeys: 10_000,
});

const JSON_RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

function jsonRpcResult(id: JsonRpcId, result: unknown) {
  try {
    const payload = { jsonrpc: "2.0", id, result };
    const encoded = jsonByteLength(payload);
    if (encoded.bytes > MCP_RESULT_MAX_BYTES) {
      return jsonRpcError(id, -32005, "Result exceeds the remote MCP response limit");
    }
    return new NextResponse(encoded.json, { headers: JSON_RESPONSE_HEADERS });
  } catch {
    return jsonRpcError(id, -32603, "Result could not be serialized safely");
  }
}

function jsonRpcError(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown,
  status = 200,
) {
  return NextResponse.json({
    jsonrpc: "2.0",
    id,
    error: { code, message, ...(data !== undefined ? { data } : {}) },
  }, {
    status,
    headers: JSON_RESPONSE_HEADERS,
  });
}

function batchJsonRpcResponse(payloads: unknown[]): NextResponse {
  const encoded = jsonByteLength(payloads);
  if (encoded.bytes > MCP_BATCH_RESULT_MAX_BYTES) {
    return jsonRpcError(
      null,
      -32005,
      "Batch result exceeds the remote MCP response limit",
      undefined,
      413,
    );
  }
  return new NextResponse(encoded.json, { headers: JSON_RESPONSE_HEADERS });
}

function unauthorized(reason: string) {
  return new NextResponse(
    JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32001, message: "Unauthorized", data: { reason } },
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer realm="apiclaw", resource_metadata="${RESOURCE_METADATA_URL}", error="invalid_token", error_description="${reason}"`,
        "Cache-Control": "no-store",
      },
    }
  );
}

async function resolveContext(req: NextRequest): Promise<WorkspaceContext | ContextDenial> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return { ok: false, status: 401, body: null, headers: {} };
  }
  const token = auth.slice(7).trim();
  if (!token.startsWith("sk-mcp-")) {
    return { ok: false, status: 401, body: null };
  }
  try {
    const resolved = await convexQuery<
      | { ok: true; tokenId: string; workspaceId: string; clientId: string; scope: string; email?: string; tier?: string; usageCount?: number; usageLimit?: number }
      | { ok: false; reason: string }
    >("mcpOAuth:resolveBearerToken", { token });
    if (!resolved?.ok) {
      return { ok: false, status: 401, body: null };
    }
    return {
      ok: true,
      tokenId: resolved.tokenId,
      workspaceId: resolved.workspaceId,
      clientId: resolved.clientId,
      scope: resolved.scope,
      email: resolved.email,
      tier: resolved.tier,
      usageCount: resolved.usageCount,
      usageLimit: resolved.usageLimit,
      bearer: token,
    };
  } catch {
    return { ok: false, status: 401, body: null };
  }
}

function logToolCallFireAndForget(
  ctx: WorkspaceContext,
  tool: string,
  durationMs: number,
  success: boolean,
  errorCode?: string
) {
  // Don't await — keeps the tool-call latency unaffected.
  convexMutation("mcpOAuth:logToolCall", {
    workspaceId: ctx.workspaceId,
    clientId: ctx.clientId,
    tool,
    durationMs,
    success,
    errorCode,
  }).catch(() => {});
}

async function dispatchTool(name: string, args: Record<string, unknown>, ctx: WorkspaceContext): Promise<unknown> {
  return await dispatchCanonicalTool(name, args, { bearer: ctx.bearer });
}

function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<JsonRpcRequest>;
  return candidate.jsonrpc === "2.0" && typeof candidate.method === "string";
}

function boundedErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Tool execution failed.";
  return message.length <= 2_048 ? message : `${message.slice(0, 2_048)}...`;
}

async function responsePayload(response: NextResponse): Promise<unknown | null> {
  if (response.status === 202 || response.body === null) return null;
  const raw = await response.text();
  if (new TextEncoder().encode(raw).byteLength > MCP_RESULT_MAX_BYTES) {
    return {
      jsonrpc: "2.0",
      id: null,
      error: { code: -32005, message: "Result exceeds the remote MCP response limit" },
    };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {
      jsonrpc: "2.0",
      id: null,
      error: { code: -32603, message: "Internal response serialization failed" },
    };
  }
}

async function handleRpc(rpc: JsonRpcRequest, ctx: WorkspaceContext) {
  const { id, method, params } = rpc;

  if (method === "initialize") {
    return jsonRpcResult(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {
        tools: { listChanged: false },
      },
      serverInfo: {
        name: "apiclaw-remote-mcp",
        version: "1.0.0",
      },
      instructions:
        "APIClaw: authenticated execution and discovery layer for agents. Discover 26,000+ APIs (discover_apis), execute managed providers (call_api), or run full multi-step missions (start_mission). Workspace observability lives in check_balance and mission_status. All state belongs to the email-verified workspace this token authorized.",
    });
  }

  if (method === "notifications/initialized") {
    return new NextResponse(null, { status: 202 });
  }

  if (method === "tools/list") {
    return jsonRpcResult(id, { tools: filterMcpToolsForScope(ctx.scope, TOOLS) });
  }

  if (method === "tools/call") {
    const p = (params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
    const toolName = typeof p.name === "string" ? p.name : "";
    if (!toolName) return jsonRpcError(id, -32602, "tool name required");
    if (!TOOLS.some((tool) => tool.name === toolName)) {
      return jsonRpcError(id, -32601, `Unknown tool: ${toolName}`);
    }
    if (!mcpScopeAllowsTool(ctx.scope, toolName)) {
      const required = requiredMcpCapabilityForTool(toolName);
      return jsonRpcError(id, -32003, "Insufficient OAuth scope", {
        error: "insufficient_scope",
        required_scope: required ? `mcp:${required}` : undefined,
      });
    }
    const t0 = Date.now();
    const budgetLease = bestEffortToolBudget.acquire(ctx.tokenId);
    if (!budgetLease.ok) {
      const message = budgetLease.reason === "concurrency_limit"
        ? "Remote MCP concurrent tool-call limit reached. Retry after an in-flight call completes."
        : "Remote MCP tool-call rate limit reached. Retry later.";
      logToolCallFireAndForget(ctx, toolName, Date.now() - t0, false, budgetLease.reason);
      return jsonRpcResult(id, {
        isError: true,
        content: [{ type: "text", text: message }],
      });
    }
    try {
      const result = await dispatchTool(toolName, p.arguments ?? {}, ctx);
      logToolCallFireAndForget(ctx, toolName, Date.now() - t0, true);
      return jsonRpcResult(id, {
        content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }],
      });
    } catch (e) {
      const message = boundedErrorMessage(e);
      logToolCallFireAndForget(ctx, toolName, Date.now() - t0, false, message);
      return jsonRpcResult(id, {
        isError: true,
        content: [{ type: "text", text: message }],
      });
    } finally {
      budgetLease.release();
    }
  }

  if (method === "ping") {
    return jsonRpcResult(id, {});
  }

  return jsonRpcError(id, -32601, `Method not found: ${method}`);
}

export async function POST(req: NextRequest) {
  try {
    parseDeclaredContentLength(req.headers);
  } catch (error) {
    if (error instanceof McpRequestBodyError) {
      return jsonRpcError(null, error.rpcCode, error.message, undefined, error.status);
    }
    return jsonRpcError(null, -32600, "Invalid Request", undefined, 400);
  }

  const ctx = await resolveContext(req);
  if (!ctx.ok) return unauthorized("invalid_or_missing_bearer");

  let body: unknown;
  try {
    body = await readMcpJsonBodyCapped(req);
  } catch (error) {
    if (error instanceof McpRequestBodyError) {
      return jsonRpcError(null, error.rpcCode, error.message, undefined, error.status);
    }
    return jsonRpcError(null, -32700, "Parse error", undefined, 400);
  }

  // Spec allows batch requests as arrays.
  if (Array.isArray(body)) {
    const batchSize = validateMcpBatchSize(body);
    if (!batchSize.ok) {
      return jsonRpcError(null, batchSize.rpcCode, batchSize.message, undefined, batchSize.status);
    }

    const responses = await mapWithConcurrency(
      body,
      MCP_BATCH_CONCURRENCY,
      async (candidate): Promise<unknown | null> => {
        if (!isJsonRpcRequest(candidate)) {
          return responsePayload(jsonRpcError(null, -32600, "Invalid Request"));
        }
        try {
          return await responsePayload(await handleRpc(candidate, ctx));
        } catch {
          return responsePayload(jsonRpcError(candidate.id ?? null, -32603, "Internal error"));
        }
      },
    );
    const payloads = responses.filter((value): value is unknown => value !== null);
    if (payloads.length === 0) return new NextResponse(null, { status: 202 });
    return batchJsonRpcResponse(payloads);
  }

  if (!isJsonRpcRequest(body)) {
    const id = body && typeof body === "object" && "id" in body
      ? (body as { id?: JsonRpcId }).id ?? null
      : null;
    return jsonRpcError(id, -32600, "Invalid Request", undefined, 400);
  }

  return handleRpc(body, ctx);
}

export async function GET(req: NextRequest) {
  // SSE connection check or browser visit. Most MCP HTTP clients only POST.
  const ctx = await resolveContext(req);
  if (!ctx.ok) return unauthorized("invalid_or_missing_bearer");
  return NextResponse.json(
    {
      service: "APIClaw Remote MCP",
      protocol: PROTOCOL_VERSION,
      resource: MCP_RESOURCE,
      docs: "https://apiclaw.cloud/docs",
    },
    { headers: { "Access-Control-Allow-Origin": "*" } }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, MCP-Protocol-Version",
      "Access-Control-Expose-Headers": "WWW-Authenticate",
    },
  });
}
