import assert from "node:assert/strict";
import { bodyFor, isBlocked, pickEmailKind } from "./nurture";

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
    now - 60 * 60 * 1000,
  ),
  "welcome",
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

const welcome = bodyFor("welcome", "Gustav");
assert.match(welcome.subject, /Welcome to APIClaw/);
assert.match(welcome.html, /discover_apis/);
assert.match(welcome.html, /call_api/);

for (const kind of ["welcome", "try-discover", "first-call", "upgrade", "power-upgrade"]) {
  const rendered = bodyFor(kind, "Gustav");
  assert.doesNotMatch(rendered.subject, /\b(Pro|Scale)\b/i, `${kind} subject should not use stale tier copy`);
  assert.doesNotMatch(rendered.html, /\b(Pro|Scale)\b|50 calls\/week|unlimited/i, `${kind} body should not use stale tier copy`);
  assert.doesNotMatch(rendered.html, /APILayer/i, `${kind} body should not mention APILayer in nurture`);
}

console.log("convex nurture tests passed");
