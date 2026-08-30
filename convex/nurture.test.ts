import assert from "node:assert/strict";
import {
  bodyFor,
  isBlocked,
  markNurtureEmailInTransaction,
  pickEmailKind,
} from "./nurture";
import { renderFounderSignupText } from "./founderSignupMail";

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
const welcome = bodyFor("welcome", "Ada", unsubscribeUrl);
assert.equal(welcome.subject, "Saw you signed up");
assert.equal(welcome.text, renderFounderSignupText("Ada"));
assert.equal(welcome.html, undefined, "default signup mail is plaintext, no HTML part");
assert.doesNotMatch(welcome.text || "", /unsubscribe|apiclaw\.cloud|—|&mdash;/i);

for (const kind of ["try-discover", "first-call", "upgrade", "power-upgrade"]) {
  const rendered = bodyFor(kind, "Gustav", unsubscribeUrl);
  assert.doesNotMatch(rendered.subject, /\b(Pro|Scale)\b/i, `${kind} subject should not use stale tier copy`);
  assert.doesNotMatch(rendered.html, /\b(Pro|Scale)\b|managed calls? (?:per|\/)(?:week|month)|unlimited|25 (?:lifetime )?managed calls|\$1 (?:total )?(?:underlying )?provider-cost cap|managed adapters?/i, `${kind} body should not use stale tier or retired-phrase copy`);
  assert.match(rendered.html || "", /Free APIs are free forever, no card\. Paid APIs bill provider cost plus \d+% after you add a card\./, `${kind} body should state the new free/paid framing`);
  assert.doesNotMatch(rendered.html || "", /APILayer/i, `${kind} body should not mention APILayer in nurture`);
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
