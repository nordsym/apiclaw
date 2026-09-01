/**
 * `apiclaw acp` - APIClaw as an ACP (Agent Client Protocol) agent over stdio.
 *
 * Lets Buzz (block/buzz) and other ACP clients spawn APIClaw as an agent.
 * Reuses the exact business logic the MCP server (src/index.ts) and the
 * direct CLI (src/cli/commands/direct.ts) already expose - this file is a
 * thin deterministic-grammar dispatcher over the same gateway primitives.
 *
 * stdio hygiene: stdout carries ONLY ndjson-framed JSON-RPC traffic (written
 * by acp.ndJsonStream). Never console.log here. Diagnostics go to stderr.
 */

import { randomUUID } from "node:crypto";
import { Readable, Writable } from "node:stream";
import * as acp from "@zed-industries/agent-client-protocol";

import { AUTH_CONFIG_PATH, readAuthConfig } from "./auth-config.js";
import { readExecuteSessionHeaders } from "./execute-auth.js";
import { unsignedExecuteMessage } from "./first-run.js";
import {
  buildCallGatewayRequest,
  GatewayNonRetryableError,
  GatewayOutcomeUnknownError,
  sendGatewayRequest,
  type DirectGatewayRequest,
} from "./cli/commands/direct.js";
import { GRAMMAR_HELP_TEXT, parseAcpCommand, type ParsedAcpCommand } from "./acp-grammar.js";

const AUTH_METHOD_ID = "apiclaw-session";

function authRequiredText(): string {
  return unsignedExecuteMessage();
}

interface AcpSession {
  pendingPrompt: AbortController | null;
}

function isTextBlock(block: acp.ContentBlock): block is Extract<acp.ContentBlock, { type: "text" }> {
  return block.type === "text";
}

function formatGatewayError(err: unknown): string {
  if (err instanceof GatewayOutcomeUnknownError) {
    return `Request failed: ${err.message} Do not retry with a new key; retain idempotency key ${err.idempotencyKey}.`;
  }
  if (err instanceof GatewayNonRetryableError) {
    return `Request failed: ${err.message}`;
  }
  const message = err instanceof Error ? err.message : String(err);
  return `Request failed: ${message}`;
}

function formatDiscover(data: any): string {
  const apis = Array.isArray(data?.apis) ? data.apis : [];
  const managed = Array.isArray(data?.managedProviders) ? data.managedProviders : [];
  const lines: string[] = [];
  if (managed.length) {
    lines.push("Managed providers:");
    for (const m of managed.slice(0, 5)) {
      lines.push(`  ${m.providerId} - ${m.name}${m.description ? `: ${m.description}` : ""}`);
    }
    lines.push("");
  }
  lines.push(`${apis.length} APIs:`);
  for (const a of apis.slice(0, 10)) {
    lines.push(`  ${a.callable ? "[callable]" : "[catalog]"} ${a.name}${a.category ? ` (${a.category})` : ""}`);
  }
  if (data?.hasMore) lines.push(`  ...${data.total - apis.length} more - refine your query`);
  return lines.join("\n");
}

function formatBalance(data: any): string {
  const lines = ["Workspace balance"];
  if (data?.email) lines.push(`  email: ${data.email}`);
  if (data?.tier) lines.push(`  tier:  ${data.tier}`);
  if (typeof data?.managedUsageCount === "number" || typeof data?.usageCount === "number") {
    const used = data.managedUsageCount ?? data.usageCount;
    const limit = data.managedUsageLimit ?? data.usageLimit ?? 0;
    lines.push(`  managed: ${used}${limit > 0 ? ` / ${limit}` : ""}`);
  }
  if (data?.creditBalance !== undefined) {
    lines.push(`  credits: $${(data.creditBalance / 100).toFixed(2)}`);
  }
  return lines.join("\n");
}

class ApiclawAcpAgent implements acp.Agent {
  private connection: acp.AgentSideConnection;
  private sessions = new Map<string, AcpSession>();

  constructor(connection: acp.AgentSideConnection) {
    this.connection = connection;
  }

  async initialize(_params: acp.InitializeRequest): Promise<acp.InitializeResponse> {
    return {
      protocolVersion: acp.PROTOCOL_VERSION,
      agentCapabilities: { loadSession: false },
      authMethods: [
        {
          id: AUTH_METHOD_ID,
          name: "APIClaw account",
          description:
            "Session-token auth written by `apiclaw auth login`. The CLI prints a clickable " +
            "https://apiclaw.cloud/auth/cli?authId=… URL. Show that URL to the human. " +
            "After whoami prints an email, retry this command.",
        },
      ],
    };
  }

  async authenticate(_params: acp.AuthenticateRequest): Promise<acp.AuthenticateResponse | void> {
    if (readAuthConfig()) return {};
    throw acp.RequestError.authRequired({
      detail: authRequiredText(),
    });
  }

  async newSession(_params: acp.NewSessionRequest): Promise<acp.NewSessionResponse> {
    const sessionId = randomUUID();
    this.sessions.set(sessionId, { pendingPrompt: null });
    return { sessionId };
  }

  async cancel(params: acp.CancelNotification): Promise<void> {
    this.sessions.get(params.sessionId)?.pendingPrompt?.abort();
  }

  async prompt(params: acp.PromptRequest): Promise<acp.PromptResponse> {
    const session = this.sessions.get(params.sessionId);
    if (!session) {
      throw acp.RequestError.invalidParams({ detail: `Unknown session ${params.sessionId}` });
    }

    session.pendingPrompt?.abort();
    const controller = new AbortController();
    session.pendingPrompt = controller;

    const text = params.prompt.filter(isTextBlock).map((b) => b.text).join("");

    let reply: string;
    try {
      reply = await this.dispatch(text);
    } finally {
      if (session.pendingPrompt === controller) session.pendingPrompt = null;
    }

    if (controller.signal.aborted) {
      return { stopReason: "cancelled" };
    }

    await this.connection.sessionUpdate({
      sessionId: params.sessionId,
      update: {
        sessionUpdate: "agent_message_chunk",
        content: { type: "text", text: reply },
      },
    });

    return { stopReason: "end_turn" };
  }

  private async dispatch(text: string): Promise<string> {
    const parsed = parseAcpCommand(text);
    switch (parsed.kind) {
      case "help":
      case "unparseable":
        if (!readAuthConfig()) {
          return `${authRequiredText()}\n\n${GRAMMAR_HELP_TEXT}`;
        }
        return GRAMMAR_HELP_TEXT;
      case "status":
        return this.statusReply();
      case "discover":
        return this.discoverReply(parsed.query);
      case "details":
        return this.detailsReply(parsed.provider, parsed.action);
      case "call":
        return this.callReply(parsed);
      case "balance":
        return this.balanceReply();
    }
  }

  private statusReply(): string {
    const cfg = readAuthConfig();
    if (!cfg) return authRequiredText();
    return [
      "Signed in.",
      `  email:        ${cfg.email}`,
      `  workspace id: ${cfg.workspaceId}`,
      `  config:       ${AUTH_CONFIG_PATH}`,
    ].join("\n");
  }

  private async runGatewayRequest(
    request: DirectGatewayRequest,
    headers: Record<string, string>,
    format: (data: any) => string,
  ): Promise<string> {
    const idempotencyKey = request.method === "POST" ? `apiclaw-acp-${randomUUID()}` : undefined;
    try {
      const data = await sendGatewayRequest<any>(request, true, { authHeaders: headers, idempotencyKey });
      return format(data);
    } catch (err) {
      return formatGatewayError(err);
    }
  }

  private async discoverReply(query: string): Promise<string> {
    const headers = readExecuteSessionHeaders();
    if (!headers) return authRequiredText();
    const request: DirectGatewayRequest = {
      path: "/v1/discover",
      method: "POST",
      body: { query, callable_only: false, limit: 10 },
    };
    return this.runGatewayRequest(request, headers, formatDiscover);
  }

  private async detailsReply(provider: string, action?: string): Promise<string> {
    const headers = readExecuteSessionHeaders();
    if (!headers) return authRequiredText();
    const name = action ? `${provider}/${action}` : provider;
    const request: DirectGatewayRequest = { path: "/api/details", method: "POST", body: { name } };
    return this.runGatewayRequest(request, headers, (data) => JSON.stringify(data, null, 2));
  }

  private async callReply(parsed: Extract<ParsedAcpCommand, { kind: "call" }>): Promise<string> {
    if (parsed.paramsError) return `Invalid call: ${parsed.paramsError}`;
    const headers = readExecuteSessionHeaders();
    if (!headers) return authRequiredText();
    let request: DirectGatewayRequest;
    try {
      request = buildCallGatewayRequest(parsed.target, { params: parsed.params });
    } catch (err) {
      return `Invalid call: ${(err as Error).message}`;
    }
    return this.runGatewayRequest(request, headers, (data) => JSON.stringify(data, null, 2));
  }

  private async balanceReply(): Promise<string> {
    const headers = readExecuteSessionHeaders();
    if (!headers) return authRequiredText();
    const request: DirectGatewayRequest = { path: "/api/balance", method: "POST", body: {} };
    return this.runGatewayRequest(request, headers, formatBalance);
  }
}

/** Wire an AgentSideConnection over stdio and start serving ACP requests. */
export function runAcpServer(): void {
  const output = Writable.toWeb(process.stdout) as WritableStream<Uint8Array>;
  const input = Readable.toWeb(process.stdin) as ReadableStream<Uint8Array>;
  const stream = acp.ndJsonStream(output, input);
  new acp.AgentSideConnection((conn) => new ApiclawAcpAgent(conn), stream);
}
