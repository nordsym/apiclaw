import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { markPostAuthWelcomeInTransaction } from "./postVerifyNudge";
import {
  nurtureDeliveryIdempotencyKey,
  welcomeDeliveryIdempotencyKey,
} from "./nurtureDeliveryKeys";
import { renderFounderSignupText } from "./founderSignupMail";

const source = readFileSync(fileURLToPath(new URL("./postVerifyNudge.ts", import.meta.url)), "utf8");
assert.match(source, /sendFounderSignupMailViaResend/);
assert.match(source, /welcomeDeliveryIdempotencyKey\(String\(w\._id\)\)/);
assert.doesNotMatch(source, /html:|renderWelcomeHtml|Unsubscribe from lifecycle email/);
assert.equal(
  renderFounderSignupText("Ada"),
  renderFounderSignupText("Ada"),
  "welcome payload must stay stable across idempotent retries",
);
assert.equal(
  welcomeDeliveryIdempotencyKey("workspace-1"),
  nurtureDeliveryIdempotencyKey("workspace-1", "welcome"),
  "fast and fallback welcome senders must share one Resend operation key",
);

function fakeCtx(existingNurture?: Record<string, any>) {
  const patches: Array<{ id: string; value: Record<string, any> }> = [];
  const inserts: Array<{ table: string; value: Record<string, any> }> = [];
  const workspace = {
    _id: "ws1",
    email: "new-user@example.net",
    tier: "free",
    lastActiveAt: 900,
  };

  const db = {
    async get(id: string) {
      return id === "ws1" ? workspace : null;
    },
    async patch(id: string, value: Record<string, any>) {
      patches.push({ id, value });
    },
    query(table: string) {
      assert.equal(table, "nurture");
      return {
        withIndex(index: string, apply: (q: any) => unknown) {
          assert.equal(index, "by_workspaceId");
          apply({ eq: (field: string, value: string) => ({ field, value }) });
          return { first: async () => existingNurture ?? null };
        },
      };
    },
    async insert(table: string, value: Record<string, any>) {
      inserts.push({ table, value });
      return "nurture-new";
    },
  };

  return { ctx: { db } as any, patches, inserts };
}

const excluded = fakeCtx({
  _id: "nurture-1",
  email: undefined,
  stage: "excluded",
  emailsSent: 0,
});
const excludedResult = await markPostAuthWelcomeInTransaction(
  excluded.ctx,
  "ws1" as any,
  1000,
);
assert.deepEqual(excludedResult, {
  success: false,
  reason: "nurture_excluded",
});
assert.deepEqual(excluded.patches, [], "excluded nurture records must never be re-enrolled");
assert.equal(excluded.inserts.length, 0);

const existing = fakeCtx({
  _id: "nurture-2",
  email: undefined,
  stage: "new",
  emailsSent: 0,
});
const existingResult = await markPostAuthWelcomeInTransaction(
  existing.ctx,
  "ws1" as any,
  1100,
);
assert.deepEqual(existingResult, {
  success: true,
  nurtureId: "nurture-2",
  inserted: false,
});
assert.deepEqual(existing.patches, [
  { id: "ws1", value: { postVerifyNudgeSentAt: 1100 } },
  {
    id: "nurture-2",
    value: {
      email: "new-user@example.net",
      emailsSent: 1,
      lastEmailSentAt: 1100,
      lastEmailKind: "welcome",
      updatedAt: 1100,
    },
  },
]);
assert.equal(existing.inserts.length, 0);

const alreadyMarked = fakeCtx({
  _id: "nurture-3",
  email: "new-user@example.net",
  stage: "new",
  emailsSent: 1,
  lastEmailKind: "welcome",
});
assert.deepEqual(
  await markPostAuthWelcomeInTransaction(alreadyMarked.ctx, "ws1" as any, 1200),
  {
    success: true,
    alreadyMarked: true,
    nurtureId: "nurture-3",
    inserted: false,
  },
);
assert.deepEqual(alreadyMarked.patches, [], "repeat welcome marks must not increment the ledger");

const missing = fakeCtx();
const missingResult = await markPostAuthWelcomeInTransaction(
  missing.ctx,
  "ws1" as any,
  2000,
);
assert.deepEqual(missingResult, {
  success: true,
  nurtureId: "nurture-new",
  inserted: true,
});
assert.equal(missing.inserts.length, 1);
assert.deepEqual(missing.inserts[0], {
  table: "nurture",
  value: {
    workspaceId: "ws1",
    email: "new-user@example.net",
    stage: "new",
    lastActivityAt: 900,
    emailsSent: 1,
    lastEmailSentAt: 2000,
    lastEmailKind: "welcome",
    unsubscribed: false,
    notes: "post-auth welcome recorded by 10-minute activation nudge",
    createdAt: 2000,
    updatedAt: 2000,
  },
});

console.log("post-auth welcome shares the nurture ledger");
