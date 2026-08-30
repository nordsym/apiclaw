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
assert.match(page, /Authorized\. Return to the terminal/);
assert.match(page, /Connection refused on localhost is OK/);
assert.match(page, /npx @nordsym\/apiclaw auth whoami/);
assert.match(page, /Do not declare ready/);
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
