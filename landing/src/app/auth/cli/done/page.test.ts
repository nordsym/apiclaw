#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loopbackCallbackUrl } from "./loopback";

assert.equal(
  loopbackCallbackUrl("41789", "one-time-code", "csrf-state"),
  "http://127.0.0.1:41789/callback?code=one-time-code&state=csrf-state",
);
assert.equal(loopbackCallbackUrl("80", "one-time-code", "csrf-state"), null);
assert.equal(loopbackCallbackUrl("41789", "bad code", "csrf-state"), null);

const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
assert.match(page, /Authorized\. Go back to your agent/);
assert.match(page, /Claude/);
assert.match(page, /Codex/);
assert.match(page, /Cursor/);
assert.match(page, /Grok/);
assert.match(page, /Connection refused on localhost is OK/);
assert.match(page, /Your agent confirms the sign-in and makes the first call there/);
assert.match(page, /Go back to that chat and retry/, "done page must send the human back to the agent");
assert.match(page, /Workspace is optional/, "workspace is optional, not where the call is made");
assert.match(page, /The first call happens in that chat, not here/);
assert.match(page, /Open workspace/, "done page may still offer the workspace as a quiet link");
assert.match(page, /href=\{WORKSPACE_AFTER_CLI_AUTH\}/, "workspace link must come from the shared constant");
assert.doesNotMatch(
  page,
  /claw-btn-solid[\s\S]{0,80}Open workspace|Open workspace[\s\S]{0,80}claw-btn-solid/,
  "workspace must not be the solid next step after Authorize",
);
const pageWithoutComments = page.replace(/\/\*[\s\S]*?\*\//g, "");
assert.doesNotMatch(pageWithoutComments, /Clerk|session_token/, "human-facing copy must not name Clerk or session_token");
assert.doesNotMatch(pageWithoutComments, /—|–/, "no em dashes in user-facing copy");
assert.doesNotMatch(pageWithoutComments, /Return to the terminal|this terminal|waiting terminal/i);
assert.match(page, /LocalhostHandoff/);

const actions = readFileSync(new URL("../actions.ts", import.meta.url), "utf8");
assert.match(actions, /cliAuthDonePath\(/);
assert.doesNotMatch(
  actions,
  /redirect\(callback\)/,
  "Authorize must not 302 the human to raw localhost as the only next screen",
);

const handoff = readFileSync(new URL("./LocalhostHandoff.tsx", import.meta.url), "utf8");
assert.match(handoff, /mode: "no-cors"/);
assert.match(handoff, /loopbackCallbackUrl/);
const loopback = readFileSync(new URL("./loopback.ts", import.meta.url), "utf8");
assert.match(loopback, /127\.0\.0\.1/);

console.log("auth/cli/done: Authorize stays on apiclaw.cloud; localhost is a background ping");
