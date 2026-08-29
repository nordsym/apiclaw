#!/usr/bin/env npx tsx
/**
 * Login must stay in front of the human until Clerk writes session_token.
 * Printing the URL is not success. Tests cover poll / reprint / wait.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  LOGIN_SESSION_POLL_MS,
  LOGIN_URL_REPRINT_MS,
  LOGIN_WAIT_TIMEOUT_MS,
  isFreshLoginSession,
  loginWaitReprintLines,
  loopbackCallbackSuccessHtml,
  waitUntilSessionOrCallback,
} from "./login-wait.js";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

assert.equal(LOGIN_URL_REPRINT_MS, 4_000);
assert.equal(LOGIN_SESSION_POLL_MS, 1_000);
assert.equal(LOGIN_WAIT_TIMEOUT_MS, 5 * 60 * 1000);
assert.ok(LOGIN_URL_REPRINT_MS < 10_000, "reprint every few seconds, not minutes");

const reprint = loginWaitReprintLines("https://apiclaw.cloud/auth/cli?authId=wait-test");
assert.match(reprint.join("\n"), /not success/i);
assert.match(reprint.join("\n"), /https:\/\/apiclaw\.cloud\/auth\/cli\?authId=wait-test/);
assert.match(reprint.join("\n"), /session_token/);
assert.match(reprint.join("\n"), /npx @nordsym\/apiclaw auth whoami/);
assert.match(reprint.join("\n"), /Authorize/);
assert.match(reprint.join("\n"), /Not ready/);
assert.match(reprint.join("\n"), /whoami redeems|connection refused/i);
assert.doesNotMatch(reprint.join("\n"), /paste/i);

const callbackHtml = loopbackCallbackSuccessHtml();
assert.match(callbackHtml, /Sign-in received/);
assert.match(callbackHtml, /Not ready yet/);
assert.match(callbackHtml, /npx @nordsym\/apiclaw auth whoami/);
assert.doesNotMatch(callbackHtml, /<h1>Authenticated<\/h1>/);

assert.equal(isFreshLoginSession(null), false);
assert.equal(isFreshLoginSession({ sessionToken: "" }), false);
assert.equal(isFreshLoginSession({ sessionToken: "   " }), false);
assert.equal(isFreshLoginSession({ sessionToken: "st_new" }), true);
assert.equal(isFreshLoginSession({ sessionToken: "st_old" }, "st_old"), false);
assert.equal(isFreshLoginSession({ sessionToken: "st_new" }, "st_old"), true);

const never = new Promise<{ code: string; state: string }>(() => {});

const reprints: string[][] = [];
let hasSession = false;
const sessionWait = waitUntilSessionOrCallback({
  loginUrl: "https://apiclaw.cloud/auth/cli?authId=session-poll",
  hasSession: () => hasSession,
  callback: never,
  timeoutMs: 200,
  reprintMs: 30,
  pollMs: 10,
  onReprint: (lines) => reprints.push(lines),
});

await delay(25);
assert.equal(reprints.length >= 1, true, "must print the login URL while waiting");
assert.match(reprints[0].join("\n"), /authId=session-poll/);
assert.match(reprints[0].join("\n"), /not success/i);
assert.equal(hasSession, false, "must not treat the first URL print as a session");

hasSession = true;
const sessionResult = await sessionWait;
assert.equal(sessionResult.ok, true, "session file / whoami becoming live is success");
if (sessionResult.ok) {
  assert.equal(sessionResult.source, "session");
}

let resolveCallback!: (value: { code: string; state: string }) => void;
const callback = new Promise<{ code: string; state: string }>((resolve) => {
  resolveCallback = resolve;
});
const callbackWait = waitUntilSessionOrCallback({
  loginUrl: "https://apiclaw.cloud/auth/cli?authId=callback",
  hasSession: () => false,
  callback,
  timeoutMs: 200,
  reprintMs: 50,
  pollMs: 10,
  reprintImmediately: false,
  onReprint: () => {},
});
resolveCallback({ code: "one-time-code", state: "csrf-state" });
const callbackResult = await callbackWait;
assert.equal(callbackResult.ok, true, "loopback callback is success so exchange can write session_token");
if (callbackResult.ok) {
  assert.equal(callbackResult.source, "callback");
  assert.deepEqual(callbackResult.callback, { code: "one-time-code", state: "csrf-state" });
}

const timeoutReprints: string[] = [];
const timeoutResult = await waitUntilSessionOrCallback({
  loginUrl: "https://apiclaw.cloud/auth/cli?authId=timeout",
  hasSession: () => false,
  callback: never,
  timeoutMs: 55,
  reprintMs: 15,
  pollMs: 10,
  onReprint: (lines) => timeoutReprints.push(lines.join("\n")),
});
assert.equal(timeoutResult.ok, false, "timeout is not success");
if (!timeoutResult.ok) {
  assert.equal(timeoutResult.reason, "timeout");
}
assert.ok(timeoutReprints.length >= 2, "must reprint the login URL every few seconds while waiting");
for (const block of timeoutReprints) {
  assert.match(block, /https:\/\/apiclaw\.cloud\/auth\/cli\?authId=timeout/);
  assert.match(block, /not success/i);
}

const errorResult = await waitUntilSessionOrCallback({
  loginUrl: "https://apiclaw.cloud/auth/cli?authId=error",
  hasSession: () => false,
  callback: Promise.reject(new Error("callback_missing_params")),
  timeoutMs: 100,
  reprintMs: 50,
  pollMs: 10,
  reprintImmediately: false,
  onReprint: () => {},
});
assert.equal(errorResult.ok, false, "callback error is not success");
if (!errorResult.ok) {
  assert.equal(errorResult.reason, "callback_error");
}

const auth = readFileSync("src/cli/commands/auth.ts", "utf8");
assert.match(auth, /loopbackCallbackSuccessHtml/, "loopback must not claim Authenticated before session_token");
assert.match(auth, /waitUntilSessionOrCallback/, "login must wait/poll, not return after printing the URL");
assert.match(auth, /LOGIN_URL_REPRINT_MS|onReprint/, "login must reprint the Clerk URL");
assert.match(auth, /isFreshLoginSession|hasWorkingWhoami/, "login must poll whoami / the session file");
assert.doesNotMatch(
  auth,
  /Waiting for browser sign-in/,
  "do not hide the login URL behind a one-line spinner",
);
const waitIdx = auth.indexOf("waitUntilSessionOrCallback");
const writeIdx = auth.indexOf("writeAuthConfig(cfg)");
assert.ok(waitIdx >= 0 && writeIdx > waitIdx, "must not write session_token before the wait resolves");

const cli = readFileSync("src/cli/index.ts", "utf8");
assert.match(cli, /stay in front until Clerk writes session_token/);
assert.match(
  cli,
  /authLoginCommand[\s\S]{0,200}process\.exit\(1\)/,
  "login must not exit 0 before session_token exists",
);

const skill = readFileSync("landing/public/SKILL.md", "utf8");
assert.match(skill, /[Ll]oop whoami/);
assert.match(skill, /each miss/i);
assert.match(skill, /every few seconds/);
assert.match(skill, /not success/i);

console.log("login-wait: login polls/reprints until session_token; URL print is not success");
