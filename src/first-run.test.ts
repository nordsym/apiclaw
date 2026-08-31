#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AUTH_LOGIN_COMMAND,
  AUTH_WHOAMI_COMMAND,
  FIRST_CALL_CLI,
  FIRST_CALL_PROMPT,
  canLaunchInteractiveAuth,
  canOpenAuthBrowser,
  completeFirstRunAuth,
  firstRunCompleteMessage,
  firstRunExecuteFailedMessage,
  firstRunIncompleteMessage,
  unsignedExecuteMessage,
  unsignedFirstRunToolResult,
} from "./first-run.js";
import { requireVerifiedOwner } from "./registration-guard.js";
import { MANAGED_USAGE_POLICY } from "./product-truth.js";

assert.equal(AUTH_LOGIN_COMMAND, "npx @nordsym/apiclaw auth login");
assert.equal(AUTH_WHOAMI_COMMAND, "npx @nordsym/apiclaw auth whoami");
assert.doesNotMatch(AUTH_LOGIN_COMMAND, /@2\.8\.7/);
assert.doesNotMatch(AUTH_LOGIN_COMMAND, /apiclaw login(?! )/);

assert.match(FIRST_CALL_PROMPT, /call_api/);
assert.match(FIRST_CALL_PROMPT, /nasa/);
assert.match(FIRST_CALL_PROMPT, /apod/);
assert.match(FIRST_CALL_PROMPT, /frankfurter/);
assert.doesNotMatch(FIRST_CALL_PROMPT, /brave_search|fixer_latest/);
assert.doesNotMatch(FIRST_CALL_PROMPT, /elevenlabs|replicate|ElevenLabs|Replicate/i);
assert.match(FIRST_CALL_CLI, /nasa\/apod/);

assert.equal(
  canLaunchInteractiveAuth({ env: { CI: "true" }, platform: "darwin", stdoutIsTTY: true }),
  false,
  "CI must never auto-launch a browser",
);
assert.equal(
  canLaunchInteractiveAuth({
    env: { APICLAW_SKIP_AUTH: "1" },
    platform: "darwin",
    stdoutIsTTY: true,
  }),
  false,
);
assert.equal(
  canLaunchInteractiveAuth({
    env: {},
    platform: "linux",
    stdoutIsTTY: true,
    stdinIsTTY: false,
  }),
  false,
  "headless Linux without DISPLAY must print the command, not hang",
);
assert.equal(
  canLaunchInteractiveAuth({
    env: { DISPLAY: ":0" },
    platform: "linux",
    stdoutIsTTY: true,
  }),
  true,
);
assert.equal(
  canLaunchInteractiveAuth({
    env: {},
    platform: "darwin",
    stdoutIsTTY: true,
    stdinIsTTY: false,
  }),
  true,
  "curl|bash on macOS has no stdin TTY but can still open a browser",
);
assert.equal(
  canLaunchInteractiveAuth({
    env: {},
    platform: "darwin",
    stdoutIsTTY: false,
    stdinIsTTY: false,
  }),
  false,
  "interactive wait still requires a TTY; opening the browser does not",
);
assert.equal(
  canOpenAuthBrowser({
    env: {},
    platform: "darwin",
    stdoutIsTTY: false,
    stdinIsTTY: false,
  }),
  true,
  "macOS MCP has a GUI and no TTY — open Clerk",
);
assert.equal(
  canOpenAuthBrowser({
    env: {},
    platform: "win32",
    stdoutIsTTY: false,
    stdinIsTTY: false,
  }),
  true,
  "Windows MCP has a GUI and no TTY — open Clerk",
);
assert.equal(
  canOpenAuthBrowser({
    env: { CI: "true" },
    platform: "win32",
    stdoutIsTTY: false,
    stdinIsTTY: false,
  }),
  false,
  "CI must mint login_url without spawning a browser",
);
assert.equal(
  canOpenAuthBrowser({
    env: { GITHUB_ACTIONS: "true" },
    platform: "darwin",
    stdoutIsTTY: false,
    stdinIsTTY: false,
  }),
  false,
);
assert.equal(
  canOpenAuthBrowser({
    env: { APICLAW_SKIP_AUTH: "1" },
    platform: "darwin",
    stdoutIsTTY: false,
    stdinIsTTY: false,
  }),
  false,
);
assert.equal(
  canOpenAuthBrowser({
    env: {},
    platform: "linux",
    stdoutIsTTY: false,
    stdinIsTTY: false,
  }),
  false,
  "headless Linux without DISPLAY must not spawn xdg-open",
);
assert.equal(
  canOpenAuthBrowser({
    env: { DISPLAY: ":0" },
    platform: "linux",
    stdoutIsTTY: false,
    stdinIsTTY: false,
  }),
  true,
  "Linux with DISPLAY may open the browser without a TTY",
);

const incomplete = firstRunIncompleteMessage();
assert.match(incomplete, /Not done/);
assert.match(incomplete, /npx @nordsym\/apiclaw auth login/);
assert.match(incomplete, /Do not POST \/v1\/execute until whoami prints an email/);
assert.match(incomplete, /Authorize/);
assert.match(incomplete, /empty X-APIClaw-Session/);
assert.doesNotMatch(incomplete, /\bDone\b/);
assert.doesNotMatch(incomplete, /apiclaw login/);
assert.doesNotMatch(incomplete, /@2\.8\.7/);

const unsigned = unsignedExecuteMessage();
assert.match(unsigned, /Not ready/);
assert.match(unsigned, /Authorize/);
assert.match(unsigned, /npx @nordsym\/apiclaw auth whoami/);
assert.match(unsigned, /whoami — it redeems Authorize|whoami redeems/);
assert.match(unsigned, /Do not POST \/v1\/execute until whoami prints an email/);
assert.match(unsigned, /empty X-APIClaw-Session/);
assert.match(unsignedExecuteMessage("https://apiclaw.cloud/auth/cli?authId=pending"), /Open this login URL/);
assert.doesNotMatch(unsigned, /paste/i);

const skill = readFileSync("landing/public/SKILL.md", "utf8");
assert.match(skill, /[Ll]oop whoami/);
assert.match(skill, /each miss/i);
assert.match(skill, /Show the human the login URL|Show the human the live `login_url`/);
assert.match(skill, /auth\/cli\?authId=/);
assert.match(skill, /Do not only print/);
assert.match(skill, /NASA APOD/);
assert.match(skill, /Frankfurter/);
assert.doesNotMatch(skill, /brave_search/);

const complete = firstRunCompleteMessage("ada@example.com", "NASA APOD: Helix Nebula");
assert.match(complete, /Done/);
assert.match(complete, /ada@example.com/);
assert.match(complete, /NASA APOD: Helix Nebula/);
assert.doesNotMatch(firstRunCompleteMessage("ada@example.com"), /nasa\/apod/);

const executeFailed = firstRunExecuteFailedMessage();
assert.match(executeFailed, /Not done/);
assert.match(executeFailed, /first execute/);
assert.doesNotMatch(executeFailed, /\bDone\b/);

const noSession = requireVerifiedOwner(null);
assert.equal(noSession.ok, false);
if (!noSession.ok) {
  assert.equal(noSession.reason, "no_session");
  assert.equal(noSession.payload.action, "agent_auth_required");
  assert.equal(noSession.payload.command, AUTH_LOGIN_COMMAND);
  assert.equal(noSession.payload.first_call_prompt, FIRST_CALL_PROMPT);
  assert.equal(noSession.payload.signup_url, undefined);
  assert.equal(Object.keys(noSession.payload)[0], "login_url", "payload must expose login_url as the primary agent-visible field");
  assert.equal(noSession.payload.status, "auth_required");
  assert.notEqual(noSession.payload.status, "success");
  assert.match(String(noSession.payload.what_happens), /without a TTY|auth\/cli\?authId=/);
  assert.doesNotMatch(
    JSON.stringify(noSession.payload),
    /apiclaw\.cloud\/sign-in/,
    "auth payload must not send agents to bare /sign-in (skips CLI authId)",
  );
  assert.doesNotMatch(String(noSession.payload.command), /apiclaw login/);
  assert.doesNotMatch(String(noSession.payload.fallback_for_headless), /email-fallback/);
}

assert.equal(
  MANAGED_USAGE_POLICY.keylessPublicExecutionAvailable,
  false,
  "this fix must not re-enable anonymous keyless proxy",
);

const skipped = await completeFirstRunAuth({
  skipLaunch: true,
  whoami: () => false,
  ensurePending: async () => {
    throw new Error("ensurePending must not run when skipLaunch is set");
  },
  launch: async () => {
    throw new Error("launch must not run when skipLaunch is set");
  },
});
assert.equal(skipped.complete, false);
assert.equal(skipped.launched, false);

const noTtyMint = await completeFirstRunAuth({
  whoami: () => false,
  canLaunch: () => false,
  ensurePending: async () => ({
    browserUrl: "https://apiclaw.cloud/auth/cli?authId=headlessmintheadlessmint12",
  }),
  launch: async () => {
    throw new Error("launch must not run when there is no TTY");
  },
});
assert.equal(noTtyMint.complete, false);
assert.equal(noTtyMint.launched, false);

const unsignedFirstRun = await unsignedFirstRunToolResult(
  { tool: "call_api" },
  {
    ensurePending: async () => ({
      browserUrl: "https://apiclaw.cloud/auth/cli?authId=headlessmintheadlessmint12",
    }),
  },
);
assert.equal(unsignedFirstRun.isError, true);
const unsignedPayload = JSON.parse(unsignedFirstRun.content[0].text) as Record<string, unknown>;
assert.equal(Object.keys(unsignedPayload)[0], "login_url");
assert.match(String(unsignedPayload.login_url), /\/auth\/cli\?authId=/);
assert.equal(unsignedPayload.status, "auth_required");
assert.notEqual(unsignedPayload.status, "success");

const already = await completeFirstRunAuth({
  whoami: () => true,
  firstExecute: async () => ({
    ok: true,
    provider: "nasa",
    action: "apod",
    summary: "NASA APOD: Helix Nebula",
    status: 200,
  }),
  launch: async () => {
    throw new Error("launch must not run when whoami already works");
  },
});
assert.equal(already.complete, true);
assert.equal(already.launched, false);
assert.equal(already.firstCall?.ok, true);

const installFiles = [
  "install.sh",
  "landing/public/install.sh",
  "landing/public/install.ps1",
  "src/cli/commands/mcp-install.ts",
];

for (const file of installFiles) {
  const source = readFileSync(file, "utf8");
  const hasLiteral = /npx @nordsym\/apiclaw auth login/.test(source);
  const usesCanon =
    /AUTH_LOGIN_COMMAND/.test(source) && /from ['"].*first-run/.test(source);
  assert.ok(
    hasLiteral || usesCanon,
    `${file} must print npx @nordsym/apiclaw auth login (literal or AUTH_LOGIN_COMMAND)`,
  );
  assert.match(source, /whoami/, `${file} must refuse Done until whoami works`);
  assert.match(
    source,
    /\/v1\/execute|firstExecute|first-call|completeFirstRunAuth/i,
    `${file} must first-execute before Done`,
  );
  assert.doesNotMatch(source, /@nordsym\/apiclaw@2\.8\.7/, `${file} must not pin unpublished 2.8.7`);
  assert.doesNotMatch(source, /apiclaw login(?! )/, `${file} must not tell users apiclaw login`);
  assert.doesNotMatch(
    source,
    /Done!.*ready to use/i,
    `${file} must not claim Done before whoami`,
  );
  assert.doesNotMatch(source, /Find weather APIs/, `${file} must not use a dead first-wow`);
  assert.doesNotMatch(
    source,
    /elevenlabs|replicate/i,
    `${file} must not lead first-run with ElevenLabs/Replicate`,
  );
}

for (const file of ["install.sh", "landing/public/install.sh", "landing/public/install.ps1"]) {
  const source = readFileSync(file, "utf8");
  assert.match(source, /Not done/, `${file} must refuse to claim Done without a session`);
  assert.match(source, /nasa/, `${file} must prefer NASA APOD`);
  assert.match(source, /apod/, `${file} must prefer NASA APOD`);
  assert.match(source, /frankfurter/i, `${file} must fall back to Frankfurter`);
  assert.match(source, /\/v1\/execute/, `${file} must POST /v1/execute`);
  assert.doesNotMatch(source, /apiclaw call CoinGecko/, `${file} must not use catalog-name /v1/call`);
}

const recoveryFiles = [
  "src/registration-guard.ts",
  "src/index.ts",
  "convex/guards.ts",
  "convex/http.ts",
  "landing/public/agents.md",
  "landing/public/SKILL.md",
  "src/cli/commands/direct.ts",
  "src/cli/commands/mission.ts",
  "src/cli/commands/auth.ts",
];

for (const file of recoveryFiles) {
  const source = readFileSync(file, "utf8");
  assert.doesNotMatch(
    source,
    /npx @nordsym\/apiclaw login --email-fallback/,
    `${file} must not recommend unpublished email-fallback`,
  );
  assert.doesNotMatch(
    source,
    /run `apiclaw login`/,
    `${file} must not tell users to run apiclaw login`,
  );
}

const guards = readFileSync("convex/guards.ts", "utf8");
assert.match(guards, /npx @nordsym\/apiclaw auth login/);
assert.doesNotMatch(guards, /email-fallback/);

const http = readFileSync("convex/http.ts", "utf8");
assert.match(http, /npx @nordsym\/apiclaw auth login/);

console.log("first-run: auth login is the next step; Done requires whoami and a 200 execute");
