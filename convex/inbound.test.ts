#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { deliverInboundEvent } from "./inbound";

let capturedBody = "";
let capturedContentType = "";
let capturedWebhookSecret = "";
const response = await deliverInboundEvent({
  source: "apiclaw",
  event: "signup",
  email: "redacted@example.net",
  workspaceId: "workspace_test",
  tier: "free",
  timestamp: 1_752_873_600_000,
}, async (_url, init) => {
  capturedBody = String(init?.body ?? "");
  const headers = new Headers(init?.headers);
  capturedContentType = headers.get("Content-Type") ?? "";
  capturedWebhookSecret = headers.get("X-APIClaw-Webhook-Secret") ?? "";
  return new Response("ok", { status: 200 });
}, "test-inbound-secret");

assert.deepEqual(response, { delivered: true, status: 200 });
assert.equal(capturedContentType, "application/json");
assert.equal(capturedWebhookSecret, "test-inbound-secret");
assert.deepEqual(JSON.parse(capturedBody), {
  source: "apiclaw",
  event: "signup",
  email: "redacted@example.net",
  workspaceId: "workspace_test",
  tier: "free",
  timestamp: 1_752_873_600_000,
});
assert.equal(capturedBody.includes("{{"), false);

await deliverInboundEvent({
  source: "apiclaw",
  event: "oauth_passthrough_reconciliation_required",
  email: "internal-runtime",
  workspaceId: "workspace_internal",
  tier: "founder",
  timestamp: 1_753_700_000_000,
  requestId: "idem_oauth_incident",
  path: "/v1/responses",
  code: "oauth_upstream_timeout",
  attempts: 1,
  operatorActionRequired: true,
}, async (_url, init) => {
  capturedBody = String(init?.body ?? "");
  return new Response("ok", { status: 200 });
}, "test-inbound-secret");
assert.deepEqual(JSON.parse(capturedBody), {
  source: "apiclaw",
  event: "oauth_passthrough_reconciliation_required",
  email: "internal-runtime",
  workspaceId: "workspace_internal",
  tier: "founder",
  timestamp: 1_753_700_000_000,
  requestId: "idem_oauth_incident",
  path: "/v1/responses",
  code: "oauth_upstream_timeout",
  attempts: 1,
  operatorActionRequired: true,
});

let unsignedFetchAttempted = false;
const unsigned = await deliverInboundEvent({
  source: "apiclaw",
  event: "signup",
  email: "redacted@example.net",
  workspaceId: "workspace_test",
  tier: "free",
  timestamp: 1_752_873_600_000,
}, async () => {
  unsignedFetchAttempted = true;
  return new Response("ok", { status: 200 });
}, "");
assert.deepEqual(unsigned, { delivered: false, status: 0 });
assert.equal(unsignedFetchAttempted, false, "unsigned inbound alerts must fail closed");

console.log("Inbound signup and OAuth incident alerts preserve the flat n8n rendering contract");
