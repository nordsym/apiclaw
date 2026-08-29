#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CLI_AUTH_POLL_PATH,
  authConfigFromExchange,
  claimedCodeFromPoll,
  pendingLoginStillOpen,
  pkceChallengeFromVerifier,
  redeemPendingLogin,
  type PendingLogin,
} from "./cli-auth-redeem.js";

const pending: PendingLogin = {
  browserUrl: "https://apiclaw.cloud/auth/cli?authId=waittestwaittestwaittestwait12",
  authId: "waittestwaittestwaittestwait12",
  codeVerifier: "verifier-from-this-machine",
  state: "csrf-state",
  fingerprint: "fp-1",
  startedAt: 1_000,
  expiresAt: 1_000 + 5 * 60 * 1000,
};

assert.equal(pendingLoginStillOpen(null), false);
assert.equal(pendingLoginStillOpen({ ...pending, codeVerifier: "" }), false);
assert.equal(pendingLoginStillOpen(pending, pending.expiresAt), false);
assert.equal(pendingLoginStillOpen(pending, pending.startedAt + 1_000), true);

assert.equal(
  claimedCodeFromPoll(pending, { status: "pending" }),
  null,
);
assert.equal(
  claimedCodeFromPoll(pending, { status: "claimed", code: "one-time", state: "other" }),
  null,
);
assert.deepEqual(
  claimedCodeFromPoll(pending, { status: "claimed", code: "one-time", state: "csrf-state" }),
  { code: "one-time", state: "csrf-state" },
);

assert.equal(authConfigFromExchange({ success: false }), null);
const cfg = authConfigFromExchange({
  success: true,
  sessionToken: "st_live",
  workspaceId: "ws_1",
  email: "ada@example.com",
  apiKey: "sk-claw-x",
}, 50);
assert.deepEqual(cfg, {
  workspaceId: "ws_1",
  email: "ada@example.com",
  sessionToken: "st_live",
  apiKey: "sk-claw-x",
  createdAt: 50,
  lastUsedAt: 50,
});

const challenge = pkceChallengeFromVerifier(pending.codeVerifier);
assert.match(challenge, /^[A-Za-z0-9_-]+$/);
assert.equal(challenge.includes("+"), false);
assert.equal(challenge.includes("/"), false);
assert.equal(challenge.includes("="), false);

let wrote: unknown = null;
let cleared = false;
let polledChallenge = "";
const redeemed = await redeemPendingLogin({
  pending,
  now: pending.startedAt + 2_000,
  poll: async (authId, submittedChallenge) => {
    assert.equal(authId, pending.authId);
    polledChallenge = submittedChallenge;
    return { status: "claimed", code: "one-time", state: "csrf-state" };
  },
  exchange: async (args) => {
    assert.equal(args.code, "one-time");
    assert.equal(args.codeVerifier, pending.codeVerifier);
    assert.equal(args.fingerprint, "fp-1");
    return {
      success: true,
      sessionToken: "st_from_whoami",
      workspaceId: "ws_1",
      email: "ada@example.com",
    };
  },
  write: (next) => {
    wrote = next;
  },
  clearPending: () => {
    cleared = true;
  },
});
assert.equal(polledChallenge, challenge);
assert.equal(redeemed?.sessionToken, "st_from_whoami");
assert.equal(redeemed?.email, "ada@example.com");
assert.equal((wrote as { sessionToken?: string } | null)?.sessionToken, "st_from_whoami");
assert.equal(cleared, true);

const skipped = await redeemPendingLogin({
  pending,
  now: pending.startedAt + 2_000,
  poll: async () => ({ status: "pending" }),
  exchange: async () => {
    throw new Error("must not exchange before Authorize");
  },
  write: () => {
    throw new Error("must not write");
  },
  clearPending: () => {
    throw new Error("must not clear");
  },
});
assert.equal(skipped, null);

const auth = readFileSync("src/cli/commands/auth.ts", "utf8");
assert.match(auth, /redeemPendingLogin/, "whoami / login must redeem a claimed authId");
assert.match(auth, /cliAuth:poll/, "login must not depend on localhost alone");
assert.match(auth, /writePendingLogin\(/, "login must persist verifier so whoami can finish");
assert.match(
  auth,
  /export async function authWhoamiCommand[\s\S]*redeemPendingIfClaimed/,
  "whoami must finish Authorize after auth login is killed",
);

const wait = readFileSync("src/login-wait.ts", "utf8");
assert.match(wait, /whoami redeems|connection refused|localhost/i);

console.log("cli-auth-redeem: whoami can exchange a claimed authId without localhost");
