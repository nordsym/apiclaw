#!/usr/bin/env npx tsx
/**
 * Spawns the real `apiclaw acp` process (via the CLI entrypoint, exactly how
 * an ACP client like Buzz would run it) and drives it with the SDK's own
 * ClientSideConnection over the child's real stdio pipes. HOME points at a
 * fresh empty temp dir so readAuthConfig()/readExecuteSessionHeaders() see
 * "not signed in" - no network call is possible from this test.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable, Writable } from "node:stream";
import * as acp from "@zed-industries/agent-client-protocol";

const scratchHome = mkdtempSync(join(tmpdir(), "apiclaw-acp-test-"));

let sink: string[] = [];

class TestClient implements acp.Client {
  async requestPermission(): Promise<acp.RequestPermissionResponse> {
    return { outcome: { outcome: "cancelled" } };
  }
  async sessionUpdate(params: acp.SessionNotification): Promise<void> {
    if (params.update.sessionUpdate === "agent_message_chunk" && params.update.content.type === "text") {
      sink.push(params.update.content.text);
    }
  }
}

const tsxBin = join(process.cwd(), "node_modules", ".bin", "tsx");
const cliEntry = join(process.cwd(), "src", "cli", "index.ts");

const child = spawn(tsxBin, [cliEntry, "acp"], {
  cwd: process.cwd(),
  env: { ...process.env, HOME: scratchHome },
  stdio: ["pipe", "pipe", "pipe"],
});

let stderr = "";
child.stderr.on("data", (chunk) => { stderr += String(chunk); });

const output = Writable.toWeb(child.stdin) as WritableStream<Uint8Array>;
const input = Readable.toWeb(child.stdout) as ReadableStream<Uint8Array>;
const stream = acp.ndJsonStream(output, input);
const connection = new acp.ClientSideConnection(() => new TestClient(), stream);

async function main() {
  // (a) initialize returns protocolVersion 1 and non-empty authMethods
  const initResult = await connection.initialize({ protocolVersion: acp.PROTOCOL_VERSION });
  assert.equal(initResult.protocolVersion, 1);
  assert.ok(Array.isArray(initResult.authMethods) && initResult.authMethods.length > 0, "authMethods must be non-empty");

  const session = await connection.newSession({ cwd: process.cwd(), mcpServers: [] });
  assert.ok(session.sessionId);

  // (b) "help" returns a reply containing the grammar keywords
  const helpReply = await promptText(session.sessionId, "help");
  for (const keyword of ["discover", "details", "call", "balance", "status"]) {
    assert.ok(helpReply.includes(keyword), `help reply must mention "${keyword}"`);
  }
  assert.match(helpReply, /Open this login URL:\n\s+https:\/\/apiclaw\.cloud\/auth\//, "unsigned ACP help must show a clickable https login URL");

  // (c) "call nasa/apod" against the unauthenticated scratch HOME returns
  // auth-required guidance and never touches the network.
  const callReply = await promptText(session.sessionId, "call nasa/apod");
  assert.ok(callReply.includes("apiclaw auth login"), "unauthenticated call must guide toward apiclaw auth login");
  assert.match(callReply, /Open this login URL:\n\s+https:\/\/apiclaw\.cloud\/auth\//, "unsigned ACP call must show a clickable https login URL");

  console.log("acp-server: initialize/newSession/prompt handshake verified over real stdio, no network call made");
}

async function promptText(sessionId: string, text: string): Promise<string> {
  sink = [];
  const result = await connection.prompt({
    sessionId,
    prompt: [{ type: "text", text }],
  });
  assert.equal(result.stopReason, "end_turn");
  return sink.join("");
}

main()
  .catch((err) => {
    console.error(stderr);
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    child.kill();
    rmSync(scratchHome, { recursive: true, force: true });
  });
