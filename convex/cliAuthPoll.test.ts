#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = readFileSync(fileURLToPath(new URL("./cliAuth.ts", import.meta.url)), "utf8");

assert.match(source, /export const poll = query\(/);
assert.match(source, /row\.challenge !== args\.challenge/);
assert.match(source, /status: "claimed"/);
assert.match(
  source,
  /code: row\.code/,
  "poll returns the one-time code only after Authorize claimed the authId",
);
const pollSource = source.slice(
  source.indexOf("export const poll = query"),
  source.indexOf("export const claim = mutation"),
);
assert.doesNotMatch(
  pollSource,
  /internalSecret/,
  "poll is the CLI redeem surface; it must not take the server bridge secret",
);

const auth = readFileSync(fileURLToPath(new URL("../src/cli/commands/auth.ts", import.meta.url)), "utf8");
assert.match(auth, /cliAuth:poll/);
assert.match(auth, /waitForClaimedCode/);
assert.match(auth, /Promise\.race/);

console.log("cliAuth poll: claimed authId is redeemable with the PKCE challenge");
