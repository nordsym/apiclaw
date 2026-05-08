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
  dispatchCanonicalTool,
} from "@/lib/mcp-tools-canon";

export const runtime = "nodejs";

const PROTOCOL_VERSION = "2025-03-26";
const MCP_RESOURCE = "https://apiclaw.cloud/mcp";
const RESOURCE_METADATA_URL = "https://apiclaw.cloud/.well-known/oauth-protected-resource";

type JsonRpcId = string | number | null;
type JsonRpcRequest = { jsonrpc: "2.0"; id: JsonRpcId; method: string; params?: unknown };

type WorkspaceContext = {
  ok: true;
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

function jsonRpcResult(id: JsonRpcId, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result }, {
    headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
  });
}

function jsonRpcError(id: JsonRpcId, code: number, message: string, data?: unknown) {
  return NextResponse.json({
    jsonrpc: "2.0",
    id,
    error: { code, message, ...(data ? { data } : {}) },
  }, {
    headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
  });
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
        "APIClaw — the Control Plane for AI Agents. Discover 26,000+ APIs (discover_apis), execute managed providers (call_api), route by capability (capability), or run full multi-step missions (start_mission). Workspace observability lives in get_usage_summary, check_balance, and mission_status. All state belongs to the email-verified workspace this token authorized.",
    });
  }

  if (method === "notifications/initialized") {
    return new NextResponse(null, { status: 202 });
  }

  if (method === "tools/list") {
    return jsonRpcResult(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const p = (params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
    const toolName = typeof p.name === "string" ? p.name : "";
    if (!toolName) return jsonRpcError(id, -32602, "tool name required");
    const t0 = Date.now();
    try {
      const result = await dispatchTool(toolName, p.arguments ?? {}, ctx);
      logToolCallFireAndForget(ctx, toolName, Date.now() - t0, true);
      return jsonRpcResult(id, {
        content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }],
      });
    } catch (e) {
      logToolCallFireAndForget(ctx, toolName, Date.now() - t0, false, e instanceof Error ? e.message : "unknown");
      return jsonRpcResult(id, {
        isError: true,
        content: [{ type: "text", text: e instanceof Error ? e.message : "Tool execution failed." }],
      });
    }
  }

  if (method === "ping") {
    return jsonRpcResult(id, {});
  }

  return jsonRpcError(id, -32601, `Method not found: ${method}`);
}

export async function POST(req: NextRequest) {
  const ctx = await resolveContext(req);
  if (!ctx.ok) return unauthorized("invalid_or_missing_bearer");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonRpcError(null, -32700, "Parse error");
  }

  // Spec allows batch requests as arrays.
  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map(async (rpc) => {
        try {
          const r = await handleRpc(rpc as JsonRpcRequest, ctx);
          if (r instanceof NextResponse) return await r.json().catch(() => null);
          return null;
        } catch { return null; }
      })
    );
    return NextResponse.json(responses.filter((x) => x !== null), {
      headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
    });
  }

  const rpc = body as JsonRpcRequest;
  if (!rpc || rpc.jsonrpc !== "2.0" || typeof rpc.method !== "string") {
    return jsonRpcError((rpc as { id?: JsonRpcId })?.id ?? null, -32600, "Invalid Request");
  }

  return handleRpc(rpc, ctx);
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
