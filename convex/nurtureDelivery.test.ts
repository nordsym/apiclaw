#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { isBlocked, sendNurtureEmailViaResend } from "./nurture";
import {
  createNurtureUnsubscribeToken,
  nurtureUnsubscribeUrl,
  verifyNurtureUnsubscribeToken,
} from "./nurtureDeliveryKeys";

const unsubscribeUrl = "https://api.apiclaw.cloud/nurture/unsubscribe?token=test";

let calls = 0;
let capturedUrl = "";
let capturedInit: RequestInit | undefined;
const fakeFetch: typeof fetch = async (input, init) => {
  calls++;
  capturedUrl = String(input);
  capturedInit = init;
  return new Response(JSON.stringify({ id: "email_123" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

const missingKey = await sendNurtureEmailViaResend(
  {
    to: "user@example.net",
    subject: "Hello",
    html: "<p>Hello</p>",
    idempotencyKey: "nurture-test",
    unsubscribeUrl,
  },
  fakeFetch,
);
assert.deepEqual(missingKey, { ok: false, reason: "missing_resend_api_key" });
assert.equal(
  calls,
  0,
  "missing credentials must fail before any outbound request",
);

const delivered = await sendNurtureEmailViaResend(
  {
    apiKey: "resend-test-key",
    to: "user@example.net",
    subject: "Hello",
    html: "<p>Hello</p>",
    idempotencyKey: "nurture-test",
    unsubscribeUrl,
  },
  fakeFetch,
);
assert.deepEqual(delivered, { ok: true });
assert.equal(capturedUrl, "https://api.resend.com/emails");
assert.equal(
  new Headers(capturedInit?.headers).get("authorization"),
  "Bearer resend-test-key",
);
assert.equal(
  new Headers(capturedInit?.headers).get("idempotency-key"),
  "nurture-test",
);
assert.deepEqual(JSON.parse(String(capturedInit?.body)), {
  from: "APIClaw <hello@apiclaw.cloud>",
  to: "user@example.net",
  subject: "Hello",
  html: "<p>Hello</p>",
  headers: {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  },
});

const rejected = await sendNurtureEmailViaResend(
  {
    apiKey: "resend-test-key",
    to: "user@example.net",
    subject: "Hello",
    html: "<p>Hello</p>",
    idempotencyKey: "nurture-test-rejected",
    unsubscribeUrl,
  },
  async () => new Response(null, { status: 429 }),
);
assert.deepEqual(rejected, { ok: false, reason: "resend_429" });

assert.equal(isBlocked("pratham.kumar@apilayer.com"), true);
assert.equal(isBlocked("partner@filestack.com"), true);

const signingSecret = "test-only-unsubscribe-signing-secret";
const token = await createNurtureUnsubscribeToken("workspace_12345678", signingSecret);
assert.equal(
  await verifyNurtureUnsubscribeToken(token, signingSecret),
  "workspace_12345678",
);
assert.equal(
  await verifyNurtureUnsubscribeToken(`${token.slice(0, -1)}x`, signingSecret),
  null,
  "tampered unsubscribe tokens must fail closed",
);
assert.match(
  await nurtureUnsubscribeUrl("workspace_12345678", signingSecret),
  /^https:\/\/api\.apiclaw\.cloud\/nurture\/unsubscribe\?token=/,
);

console.log(
  "nurture delivery uses direct Resend and preserves partner exclusions",
);
