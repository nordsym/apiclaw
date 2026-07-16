import assert from "node:assert/strict";
import { isEligibleAuthEvent, STALLED_MAX_AGE_MS, STALLED_MIN_AGE_MS } from "./activationWatchdog";
import { deliverInboundEvent } from "./inbound";

assert.equal(STALLED_MIN_AGE_MS, 60 * 60 * 1000);
assert.equal(STALLED_MAX_AGE_MS, 48 * 60 * 60 * 1000);
assert.equal(isEligibleAuthEvent({ classification: "human", props: {} }), true);
assert.equal(isEligibleAuthEvent({ classification: "human", props: { backfilled: true } }), false);
assert.equal(isEligibleAuthEvent({ classification: "internal", props: {} }), false);

let deliveredBody: any;
const delivered = await deliverInboundEvent(
  {
    source: "apiclaw",
    event: "activation_stalled",
    email: "builder@example.net",
    workspaceId: "workspace-redacted",
    tier: "free",
    timestamp: 2000,
    authenticatedAt: 1000,
    stalledMinutes: 60,
    welcomeSent: true,
  },
  async (_url, init) => {
    deliveredBody = JSON.parse(String(init?.body));
    return new Response("ok", { status: 200 });
  },
);
assert.deepEqual(delivered, { delivered: true, status: 200 });
assert.equal(deliveredBody.event, "activation_stalled");
assert.equal(deliveredBody.welcomeSent, true);

const rejected = await deliverInboundEvent(
  {
    source: "apiclaw",
    event: "activation_stalled",
    email: "builder@example.net",
    workspaceId: "workspace-redacted",
    tier: "free",
    timestamp: 2000,
  },
  async () => new Response("bad", { status: 502 }),
);
assert.deepEqual(rejected, { delivered: false, status: 502 });

console.log("activation watchdog verifies delivery before marking a stalled signup alerted");
