#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AUTH_LOGIN_COMMAND,
  AUTH_WHOAMI_COMMAND,
  FIRST_CALL_CLI,
  FIRST_CALL_PROMPT,
  canLaunchInteractiveAuth,
  completeFirstRunAuth,
  firstRunCompleteMessage,
  firstRunIncompleteMessage,
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
assert.match(FIRST_CALL_PROMPT, /fixer_latest|brave_search/);
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
);

const incomplete = firstRunIncompleteMessage();
assert.match(incomplete, /Not done/);
assert.match(incomplete, /npx @nordsym\/apiclaw auth login/);
assert.doesNotMatch(incomplete, /\bDone\b/);
assert.doesNotMatch(incomplete, /apiclaw login/);
assert.doesNotMatch(incomplete, /@2\.8\.7/);

const complete = firstRunCompleteMessage("ada@example.com");
assert.match(complete, /Done/);
assert.match(complete, /ada@example.com/);
assert.match(complete, /nasa\/apod/);

const noSession = requireVerifiedOwner(null);
assert.equal(noSession.ok, false);
if (!noSession.ok) {
  assert.equal(noSession.reason, "no_session");
  assert.equal(noSession.payload.action, "agent_auth_required");
  assert.equal(noSession.payload.command, AUTH_LOGIN_COMMAND);
  assert.equal(noSession.payload.first_call_prompt, FIRST_CALL_PROMPT);
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
  launch: async () => {
    throw new Error("launch must not run when skipLaunch is set");
  },
});
assert.equal(skipped.complete, false);
assert.equal(skipped.launched, false);

const already = await completeFirstRunAuth({
  whoami: () => true,
  launch: async () => {
    throw new Error("launch must not run when whoami already works");
  },
});
assert.equal(already.complete, true);
assert.equal(already.launched, false);

const installFiles = [
  "install.sh",
  "landing/public/install.sh",
  "landing/public/install.ps1",
  "src/cli/commands/mcp-install.ts",
];

for (const file of installFiles) {
  const source = readFileSync(file, "utf8");
  assert.match(
    source,
    /npx @nordsym\/apiclaw auth login/,
    `${file} must print the exact recovery command`,
  );
  assert.match(source, /whoami/, `${file} must refuse Done until whoami works`);
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
  assert.match(source, /nasa\/apod/, `${file} must point at a live first rail`);
}

const recoveryFiles = [
  "src/registration-guard.ts",
  "src/index.ts",
  "convex/guards.ts",
  "convex/http.ts",
  "landing/public/agents.md",
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

console.log("first-run: auth login is the next step; Done requires whoami; first call is a live rail");
