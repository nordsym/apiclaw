#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  FOUNDER_FROM,
  FOUNDER_REPLY_TO,
  FOUNDER_SUBJECT,
  normalizeFounderFirstName,
  renderFounderSignupText,
  sendFounderSignupMailViaResend,
  shouldSendFounderSignupMail,
} from "./founderSignupMail";
import {
  nurtureDeliveryIdempotencyKey,
  welcomeDeliveryIdempotencyKey,
} from "./nurtureDeliveryKeys";

const namedBody = renderFounderSignupText("Ada");
assert.equal(
  namedBody,
  [
    "Hey Ada,",
    "",
    "Gustav here. I built APIClaw. Saw you signed up.",
    "",
    "What are you using it for?",
    "",
    "If something's in the way of getting it live, tell me. I'll help.",
    "",
    "Gustav",
  ].join("\n"),
  "founder signup body must be exact, including first name",
);

const unnamedBody = renderFounderSignupText(null);
assert.equal(
  unnamedBody,
  [
    "Hey,",
    "",
    "Gustav here. I built APIClaw. Saw you signed up.",
    "",
    "What are you using it for?",
    "",
    "If something's in the way of getting it live, tell me. I'll help.",
    "",
    "Gustav",
  ].join("\n"),
  "missing first name must drop the name, not leave a merge tag",
);

assert.equal(normalizeFounderFirstName("{first}"), null);
assert.equal(normalizeFounderFirstName("{{firstName}}"), null);
assert.equal(normalizeFounderFirstName("first"), null);
assert.equal(normalizeFounderFirstName(" Ada Lovelace "), "Ada");
assert.doesNotMatch(namedBody, /\{|\}|—|&mdash;|<html|<img|unsubscribe/i);
assert.doesNotMatch(unnamedBody, /\{|\}|Hey \{|undefined|null/);
assert.equal(FOUNDER_SUBJECT, "Saw you signed up");
assert.equal(FOUNDER_FROM, "Gustav <gustav@nordsym.com>");
assert.equal(FOUNDER_REPLY_TO, "Gustav <gustav@nordsym.com>");

assert.deepEqual(
  shouldSendFounderSignupMail({
    email: "ada@example.net",
    isNewUser: true,
  }),
  { send: true },
);
assert.deepEqual(
  shouldSendFounderSignupMail({
    email: "ada@example.net",
    isNewUser: false,
  }),
  { send: false, reason: "session_reuse" },
  "session reuse and whoami must not send",
);
assert.deepEqual(
  shouldSendFounderSignupMail({
    email: "ada@example.net",
    isNewUser: true,
    alreadySent: true,
  }),
  { send: false, reason: "already_sent" },
  "second mint of the same workspace must be idempotent",
);
assert.deepEqual(
  shouldSendFounderSignupMail({
    email: "gustav@nordsym.com",
    isNewUser: true,
  }),
  { send: false, reason: "email_blocklist" },
);
assert.deepEqual(
  shouldSendFounderSignupMail({
    email: "ci@github.com",
    isNewUser: true,
  }),
  { send: false, reason: "non_human_address" },
);
assert.deepEqual(
  shouldSendFounderSignupMail({
    email: "bot@example.net",
    isNewUser: true,
  }),
  { send: false, reason: "non_human_address" },
);
assert.deepEqual(
  shouldSendFounderSignupMail({
    email: "human+ci@gmail.com",
    isNewUser: true,
  }),
  { send: false, reason: "non_human_address" },
);
assert.deepEqual(
  shouldSendFounderSignupMail({
    email: "ada@example.net",
    isNewUser: true,
    classification: "ci",
  }),
  { send: false, reason: "ci" },
);
assert.deepEqual(
  shouldSendFounderSignupMail({
    email: "ada@example.net",
    isNewUser: true,
    classification: "bot",
  }),
  { send: false, reason: "bot" },
);
assert.deepEqual(
  shouldSendFounderSignupMail({
    email: "ada@example.net",
    isNewUser: true,
    classification: "internal",
  }),
  { send: false, reason: "internal" },
);
assert.deepEqual(
  shouldSendFounderSignupMail({
    email: "partner@acme.com",
    isNewUser: true,
    tier: "partner",
  }),
  { send: false, reason: "tier:partner" },
);

let capturedInit: RequestInit | undefined;
const fakeFetch: typeof fetch = async (_input, init) => {
  capturedInit = init;
  return new Response(JSON.stringify({ id: "email_founder" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

const delivered = await sendFounderSignupMailViaResend(
  {
    apiKey: "resend-test-key",
    to: "ada@example.net",
    firstName: "Ada",
    idempotencyKey: welcomeDeliveryIdempotencyKey("workspace-1"),
  },
  fakeFetch,
);
assert.deepEqual(delivered, { ok: true });
const payload = JSON.parse(String(capturedInit?.body));
assert.equal(payload.from, "Gustav <gustav@nordsym.com>");
assert.equal(payload.reply_to, "Gustav <gustav@nordsym.com>");
assert.equal(payload.subject, "Saw you signed up");
assert.equal(payload.text, namedBody);
assert.equal("html" in payload, false, "founder note must not include an HTML part");
assert.equal(payload.html, undefined);
assert.equal(payload.headers, undefined, "no unsubscribe or tracking headers");
assert.equal(
  new Headers(capturedInit?.headers).get("idempotency-key"),
  welcomeDeliveryIdempotencyKey("workspace-1"),
);
assert.equal(
  welcomeDeliveryIdempotencyKey("workspace-1"),
  nurtureDeliveryIdempotencyKey("workspace-1", "welcome"),
);

const missing = await sendFounderSignupMailViaResend(
  {
    to: "ada@example.net",
    firstName: "Ada",
    idempotencyKey: "x",
  },
  fakeFetch,
);
assert.deepEqual(missing, { ok: false, reason: "missing_resend_api_key" });

const clerkBridge = readFileSync(
  fileURLToPath(new URL("../landing/src/app/api/workspace-auth/clerk-bridge/route.ts", import.meta.url)),
  "utf8",
);
assert.match(
  clerkBridge,
  /const firstName = user\?\.firstName/,
  "clerk-bridge must read Clerk first name",
);
assert.match(
  clerkBridge,
  /firstName,/,
  "clerk-bridge must pass Clerk first name into the first-mint mutation",
);
assert.match(clerkBridge, /path:\s*"workspaces:getOrCreateForClerk"/);

const workspaces = readFileSync(
  fileURLToPath(new URL("./workspaces.ts", import.meta.url)),
  "utf8",
);
const clerkMint = workspaces.slice(
  workspaces.indexOf("export const getOrCreateForClerk"),
  workspaces.indexOf("export function getWorkspaceUsageDisplay"),
);
assert.match(
  clerkMint,
  /if \(isNewUser\) \{[\s\S]*scheduleFounderSignupMail\([\s\S]*workspaceId: workspace\._id/,
  "real Clerk first mint must schedule the founder note",
);
assert.doesNotMatch(
  clerkMint.replace(/if \(isNewUser\) \{[\s\S]*?\n    \}/, ""),
  /scheduleFounderSignupMail|founderSignupMail/,
  "session reuse of getOrCreateForClerk must not schedule founder mail",
);

for (const [label, start, stop] of [
  ["verifySession", "export const verifySession", "export const getByEmail"],
  ["getSession", "export const getSession", "export const getWorkspaceDashboard"],
  ["touchSession", "export const touchSession", "export const createWorkspace"],
] as const) {
  const slice = workspaces.slice(workspaces.indexOf(start), workspaces.indexOf(stop));
  assert.doesNotMatch(
    slice,
    /founderSignupMail|scheduleFounderSignupMail/,
    `${label} (session reuse / whoami) must not send signup mail`,
  );
}

const cliAuth = readFileSync(fileURLToPath(new URL("./cliAuth.ts", import.meta.url)), "utf8");
assert.match(
  cliAuth,
  /if \(isNew\) \{[\s\S]*scheduleFounderSignupMail\(/,
  "CLI first mint of a new workspace owner must send the same founder note",
);

const postVerify = readFileSync(
  fileURLToPath(new URL("./postVerifyNudge.ts", import.meta.url)),
  "utf8",
);
assert.match(postVerify, /sendFounderSignupMailViaResend/);
assert.doesNotMatch(postVerify, /renderWelcomeHtml|Your APIClaw workspace is ready/);
assert.doesNotMatch(
  postVerify,
  /html:\s*renderWelcomeHtml|html:\s*renderFounder/,
  "fallback welcome must stay plaintext",
);

const nurture = readFileSync(fileURLToPath(new URL("./nurture.ts", import.meta.url)), "utf8");
assert.match(nurture, /kind === "welcome"/);
assert.match(nurture, /sendFounderSignupMailViaResend/);

console.log("founder signup mail is plaintext Gustav, first-mint only, idempotent");
