import assert from "node:assert/strict";
import {
  markPostAuthWelcomeInTransaction,
  renderWelcomeHtml,
} from "./postVerifyNudge";

const preActivationWelcome = renderWelcomeHtml(false);
assert.match(preActivationWelcome, /haven't made an API call yet/);
assert.match(preActivationWelcome, /AI agent infrastructure news/);
assert.doesNotMatch(preActivationWelcome, /SMS to Sweden|25 free calls\/month|50 calls\/month/);
assert.match(preActivationWelcome, /50 managed calls per week/);

const activatedWelcome = renderWelcomeHtml(true);
assert.match(activatedWelcome, /first APIClaw call is through/);
assert.doesNotMatch(activatedWelcome, /haven't made an API call yet/);

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

const existing = fakeCtx({
  _id: "nurture-1",
  email: undefined,
  stage: "excluded",
  emailsSent: 0,
});
const existingResult = await markPostAuthWelcomeInTransaction(
  existing.ctx,
  "ws1" as any,
  1000,
);
assert.deepEqual(existingResult, {
  success: true,
  nurtureId: "nurture-1",
  inserted: false,
});
assert.deepEqual(existing.patches, [
  { id: "ws1", value: { postVerifyNudgeSentAt: 1000 } },
  {
    id: "nurture-1",
    value: {
      email: "new-user@example.net",
      stage: "new",
      emailsSent: 1,
      lastEmailSentAt: 1000,
      lastEmailKind: "welcome",
      updatedAt: 1000,
    },
  },
]);
assert.equal(existing.inserts.length, 0);

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
