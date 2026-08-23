import assert from "node:assert/strict";
import {
  bodyFor,
  isBlocked,
  markNurtureEmailInTransaction,
  pickEmailKind,
} from "./nurture";
import { CANON_STATS } from "../src/canon-stats";

const now = Date.now();

assert.equal(isBlocked("pratham.kumar@apilayer.com"), true, "APILayer contact must never receive nurture");
assert.equal(isBlocked("john.kim@idera.com"), true, "Idera/APILayer parent contacts must never receive nurture");
assert.equal(isBlocked("marketing@filestack.com"), true, "partner/provider contacts must stay blocked");
assert.equal(isBlocked("prod-smoke-test@apiclaw.test"), true, "synthetic test workspaces must stay blocked");
assert.equal(isBlocked("radhakantapaul100@gmail.com"), false, "real external users should be nurture eligible");
assert.equal(isBlocked("andylopeslindao@gmail.com"), false, "real external users should be nurture eligible");

assert.equal(
  pickEmailKind(
    {
      stage: "new",
      emailsSent: 0,
      lastEmailKind: undefined,
      lastEmailSentAt: undefined,
      unsubscribed: false,
    } as any,
    now - 25 * 60 * 60 * 1000,
  ),
  "welcome",
);

assert.equal(
  pickEmailKind(
    {
      stage: "new",
      emailsSent: 0,
      lastEmailKind: undefined,
      lastEmailSentAt: undefined,
      unsubscribed: false,
    } as any,
    now - 60 * 60 * 1000,
  ),
  null,
  "daily nurture must not race the canonical 10-minute welcome",
);

assert.equal(
  pickEmailKind(
    {
      stage: "partner-locked",
      emailsSent: 0,
      lastEmailKind: undefined,
      lastEmailSentAt: undefined,
      unsubscribed: false,
    } as any,
    now - 60 * 60 * 1000,
  ),
  null,
);

assert.equal(
  pickEmailKind(
    {
      stage: "new",
      emailsSent: 3,
      lastEmailKind: "first-call",
      lastEmailSentAt: now - 10 * 24 * 60 * 60 * 1000,
      unsubscribed: false,
    } as any,
    now - 10 * 24 * 60 * 60 * 1000,
  ),
  null,
  "workspace must stop receiving nurture after three lifecycle emails",
);

assert.equal(
  pickEmailKind(
    {
      stage: "lost",
      emailsSent: 1,
      lastEmailKind: "reactivate-7d",
      lastEmailSentAt: now - 10 * 24 * 60 * 60 * 1000,
      unsubscribed: false,
    } as any,
    now - 45 * 24 * 60 * 60 * 1000,
  ),
  null,
  "reactivation emails must have a 30 day cooldown",
);

assert.equal(
  pickEmailKind(
    {
      stage: "lost",
      emailsSent: 1,
      lastEmailKind: "reactivate-7d",
      lastEmailSentAt: now - 31 * 24 * 60 * 60 * 1000,
      unsubscribed: false,
    } as any,
    now - 60 * 24 * 60 * 60 * 1000,
  ),
  "reactivate-30d",
  "reactivation can progress after the 30 day cooldown",
);

const unsubscribeUrl = "https://api.apiclaw.cloud/nurture/unsubscribe?token=test";
const welcome = bodyFor("welcome", "Gustav", unsubscribeUrl);
assert.match(welcome.subject, /Welcome to APIClaw/);
assert.match(welcome.html, /brave_search/);
assert.match(welcome.html, /action "search"/);
assert.match(welcome.html, new RegExp(`${CANON_STATS.discoverable.toLocaleString()} APIs`));
assert.match(welcome.html, new RegExp(`${CANON_STATS.source_verified.toLocaleString()} current catalog entries`));
assert.match(welcome.html, /Source verification is not execution/i);
assert.match(welcome.html, new RegExp(`${CANON_STATS.managed_provider_adapters} providers`));
assert.doesNotMatch(welcome.html, /managed adapters?/i, "welcome email must not use the retired 'managed adapter' phrase");
assert.match(welcome.html, new RegExp(`${CANON_STATS.customer_executable_providers} provider rails are customer-executable`));
assert.doesNotMatch(welcome.html, /source-verified (?:definitions|APIs).*callable/i);
assert.match(welcome.html, /Unsubscribe from lifecycle email/);
assert.match(welcome.html, /nurture\/unsubscribe/);
assert.doesNotMatch(welcome.html, /Reply STOP/);

for (const kind of ["welcome", "try-discover", "first-call", "upgrade", "power-upgrade"]) {
  const rendered = bodyFor(kind, "Gustav", unsubscribeUrl);
  assert.doesNotMatch(rendered.subject, /\b(Pro|Scale)\b/i, `${kind} subject should not use stale tier copy`);
  assert.doesNotMatch(rendered.html, /\b(Pro|Scale)\b|managed calls? (?:per|\/)(?:week|month)|unlimited|25 (?:lifetime )?managed calls|\$1 (?:total )?(?:underlying )?provider-cost cap|managed adapters?/i, `${kind} body should not use stale tier or retired-phrase copy`);
  assert.match(rendered.html, /Free APIs are free forever, no card\. Paid APIs bill provider cost plus \d+% after you add a card\./, `${kind} body should state the new free/paid framing`);
  assert.doesNotMatch(rendered.html, /APILayer/i, `${kind} body should not mention APILayer in nurture`);
}

const patches: Array<Record<string, unknown>> = [];
const existingNurture = {
  _id: "nurture-1",
  stage: "new",
  unsubscribed: false,
  emailsSent: 1,
  lastEmailKind: "welcome",
};
const markCtx = {
  db: {
    get: async () => existingNurture,
    patch: async (_id: string, value: Record<string, unknown>) => { patches.push(value); },
  },
} as any;
assert.deepEqual(
  await markNurtureEmailInTransaction(markCtx, "nurture-1" as any, "welcome", 1000),
  { success: true, alreadyMarked: true },
);
assert.deepEqual(patches, [], "repeated Resend success must not increment emailsSent twice");

const excludedMarkCtx = {
  db: {
    get: async () => ({ ...existingNurture, stage: "excluded", lastEmailKind: undefined }),
    patch: async () => { throw new Error("excluded nurture must not be patched as sent"); },
  },
} as any;
assert.deepEqual(
  await markNurtureEmailInTransaction(excludedMarkCtx, "nurture-1" as any, "welcome", 1000),
  { success: false, reason: "nurture_excluded" },
);

console.log("convex nurture tests passed");
