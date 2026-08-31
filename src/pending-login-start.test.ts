#!/usr/bin/env npx tsx
/**
 * Unsigned MCP/CLI first_run must mint a live /auth/cli?authId= URL
 * without a TTY, persist the PKCE verifier, and reuse an open pending.
 */
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "apiclaw-pending-start-"));
process.env.HOME = tmpHome;
process.env.USERPROFILE = tmpHome;

const { clearPendingLoginUrl, readPendingLogin, writePendingLogin } = await import("./execute-auth.js");
const {
  agentAuthRequiredPayload,
  agentAuthRequiredPayloadAfterMint,
  completeFirstRunAuth,
  firstRunIncompleteMessage,
  unsignedExecuteMessage,
  unsignedFirstRunToolResult,
} = await import("./first-run.js");
const { ensurePendingLogin } = await import("./pending-login-start.js");

clearPendingLoginUrl();

const now = Date.now();
let startCalls = 0;
const minted = await ensurePendingLogin({
  openBrowser: false,
  now,
  fingerprint: "fp-test",
  start: async (args) => {
    startCalls += 1;
    assert.ok(args.state.length >= 16);
    assert.ok(args.challenge.length >= 32);
    assert.equal(args.port, 41789);
    assert.equal(args.fingerprint, "fp-test");
    return {
      authId: "mintedauthidmintedauthidmint12",
      browserUrl: "https://apiclaw.cloud/auth/cli?authId=mintedauthidmintedauthidmint12",
      expiresAt: now + 5 * 60 * 1000,
    };
  },
});
assert.ok(minted);
assert.equal(minted.reused, false);
assert.equal(minted.browserUrl, "https://apiclaw.cloud/auth/cli?authId=mintedauthidmintedauthidmint12");
assert.equal(minted.authId, "mintedauthidmintedauthidmint12");
assert.ok(minted.codeVerifier);
assert.ok(minted.state);
assert.equal(startCalls, 1);
const stored = readPendingLogin();
assert.equal(stored?.authId, "mintedauthidmintedauthidmint12");
assert.equal(stored?.codeVerifier, minted.codeVerifier);

const reused = await ensurePendingLogin({
  openBrowser: false,
  now: now + 1_000,
  start: async () => {
    throw new Error("must reuse an open pending login");
  },
});
assert.ok(reused);
assert.equal(reused.reused, true);
assert.equal(reused.authId, minted.authId);
assert.equal(reused.browserUrl, minted.browserUrl);
assert.equal(startCalls, 1);

const payload = agentAuthRequiredPayload({ login_url: minted.browserUrl });
assert.equal(Object.keys(payload)[0], "login_url", "login_url is the primary visible field");
assert.equal(payload.login_url, minted.browserUrl);
assert.match(String(payload.login_url), /\/auth\/cli\?authId=/);
assert.equal(payload.status, "auth_required");
assert.notEqual(payload.status, "success");
assert.match(String(payload.instruction), /auth\/cli\?authId=mintedauthidmintedauthidmint12/);
assert.match(String(payload.instruction), /one action/);
assert.doesNotMatch(String(payload.instruction), /must click Authorize after Clerk/);
assert.doesNotMatch(JSON.stringify(payload), /apiclaw\.cloud\/sign-in/);

const afterMint = await agentAuthRequiredPayloadAfterMint(
  { tool: "call_api" },
  { ensurePending: async () => minted },
);
assert.equal(Object.keys(afterMint)[0], "login_url");
assert.equal(afterMint.login_url, minted.browserUrl);
assert.match(String(afterMint.login_url), /\/auth\/cli\?authId=/);
assert.equal(afterMint.status, "auth_required");
assert.notEqual(afterMint.status, "success");
assert.match(String(afterMint.instruction), /Show the human this login URL/);

const firstRunTool = await unsignedFirstRunToolResult(
  { tool: "apiclaw_help" },
  { ensurePending: async () => minted },
);
assert.equal(firstRunTool.isError, true, "unsigned first_run must be an error the host must show");
const firstRunPayload = JSON.parse(firstRunTool.content[0].text) as Record<string, unknown>;
assert.equal(Object.keys(firstRunPayload)[0], "login_url");
assert.equal(firstRunPayload.login_url, minted.browserUrl);
assert.match(String(firstRunPayload.login_url), /\/auth\/cli\?authId=/);
assert.equal(firstRunPayload.status, "auth_required");
assert.notEqual(firstRunPayload.status, "success");

const unsigned = unsignedExecuteMessage(minted.browserUrl);
assert.match(unsigned, /Open this login URL: https:\/\/apiclaw\.cloud\/auth\/cli\?authId=/);
assert.match(unsigned, /one action/);
assert.doesNotMatch(unsigned, /After Clerk, click Authorize/);

const incomplete = firstRunIncompleteMessage(minted.browserUrl);
assert.match(incomplete, /Open this login URL: https:\/\/apiclaw\.cloud\/auth\/cli\?authId=/);
assert.ok(
  incomplete.indexOf("Open this login URL") < incomplete.indexOf("npx @nordsym/apiclaw auth login"),
  "URL must be the primary line, not only the login command",
);

let mintedOnFirstRun = false;
const headless = await completeFirstRunAuth({
  whoami: () => false,
  canLaunch: () => false,
  ensurePending: async () => {
    mintedOnFirstRun = true;
    return minted;
  },
  launch: async () => {
    throw new Error("must not block on login wait when there is no TTY");
  },
});
assert.equal(mintedOnFirstRun, true, "first_run must mint without TTY");
assert.equal(headless.complete, false);
assert.equal(headless.launched, false);

clearPendingLoginUrl();
const failedMint = await ensurePendingLogin({
  now,
  start: async () => {
    throw new Error("convex down");
  },
});
assert.equal(failedMint, null);

writePendingLogin({
  browserUrl: "https://apiclaw.cloud/auth/cli?authId=waittestwaittestwaittestwait12",
  authId: "waittestwaittestwaittestwait12",
  codeVerifier: "verifier-from-this-machine",
  state: "csrf-state",
  fingerprint: "fp-1",
  startedAt: now,
  expiresAt: now + 5 * 60 * 1000,
});
const fromFile = agentAuthRequiredPayload();
assert.equal(fromFile.login_url, "https://apiclaw.cloud/auth/cli?authId=waittestwaittestwaittestwait12");

clearPendingLoginUrl();
fs.rmSync(tmpHome, { recursive: true, force: true });

console.log("pending-login-start: unsigned first_run mints /auth/cli?authId= without TTY");
