#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  CUSTOMER_WEBHOOK_DELIVERY_ENABLED,
  formatWebhookSecret,
  signPayload,
} from "./webhooks";

assert.equal(CUSTOMER_WEBHOOK_DELIVERY_ENABLED, false);
assert.equal(
  formatWebhookSecret(new Uint8Array(32).fill(0xab)),
  `whsec_v1_${"ab".repeat(32)}`,
);
assert.throws(() => formatWebhookSecret(new Uint8Array(31)), /at least 32 random bytes/);
assert.equal(
  await signPayload("The quick brown fox jumps over the lazy dog", "key"),
  "v1=f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
);

const source = readFileSync(fileURLToPath(new URL("./webhooks.ts", import.meta.url)), "utf8");
assert.doesNotMatch(source, /Math\.random/);
assert.doesNotMatch(source, /fetch\(webhook\.url/);
assert.match(source, /destination-pinned egress/);

console.log("customer webhook egress is disabled and retained secrets use HMAC-SHA256");
