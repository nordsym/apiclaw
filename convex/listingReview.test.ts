import { mock } from "node:test";
mock.timers.enable({ apis: ["setTimeout"] });
import assert from "node:assert/strict";
import { convexTest } from "convex-test";
import { anyApi } from "convex/server";
import schema from "./schema";
import {
  decisionEmail,
  decisionRecipientAllowed,
  reviewEmail,
} from "./listingNotifications";
import { createRequire } from "node:module";
const { isListingOperator } = createRequire(import.meta.url)(
  "../landing/src/lib/listing-review-auth.ts",
);
const modules = {
  "./discoveryListings.ts": () => import("./discoveryListings"),
  "./listingNotifications.ts": () => import("./listingNotifications"),
  "./_generated/server.ts": () => import("./_generated/server"),
};
const t = convexTest(schema, modules),
  api = anyApi.discoveryListings,
  n = anyApi.listingNotifications;
const metadata = {
  name: "Synthetic review fixture",
  description: "No service",
  category: "Testing",
  baseUrl: "https://example.test/",
  docsUrl: "https://example.test/docs",
  auth: "None",
  pricing: "None",
  pricingNotes: "Synthetic",
  operations: [{ method: "GET", path: "/fixture", summary: "Do not call" }],
};
await t.run(async (ctx) => {
  const w = await ctx.db.insert("workspaces", {
    email: "test@example.test",
    tier: "free",
    status: "active",
    usageCount: 0,
    usageLimit: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  await ctx.db.insert("agentSessions", {
    workspaceId: w,
    sessionToken: "owner-review",
    sessionKind: "owner",
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  });
});
const id = await t.mutation(api.saveDraft, { token: "owner-review", metadata });
await t.mutation(api.submit, { token: "owner-review", id, revision: 1 });
await t.mutation(api.submit, { token: "owner-review", id, revision: 1 });
assert.equal(
  (await t.query(n.candidate, { id, revision: 1 })).notificationAttempts,
  0,
);
await assert.rejects(
  t.query(api.operatorPending, {
    internalSecret: "bad",
    reviewer: "gustav@nordsym.com",
    paginationOpts: { numItems: 25, cursor: null },
  }),
  /Unauthorized/,
);
process.env.APICLAW_INTERNAL_SECRET = "synthetic-review-secret";
await assert.rejects(
  t.mutation(api.operatorReview, {
    internalSecret: "synthetic-review-secret",
    reviewer: "test@example.test",
    id,
    revision: 1,
    approve: true,
    note: "Forged reviewer",
  }),
  /Unauthorized/,
);
const nativeFetch = globalThis.fetch;
process.env.RESEND_API_KEY = "synthetic-no-network";
process.env.APICLAW_INBOUND_WEBHOOK_SECRET = "synthetic-alert-secret";
let deliveries = 0;
let alerts = 0;
globalThis.fetch = async (_url, init) => {
  if (String(_url).includes("/webhook/inbound/apiclaw")) {
    alerts++;
    const alert = JSON.parse(String(init?.body));
    assert.equal(alert.listingId, id);
    assert.equal(alert.revision, 1);
    assert.equal(alert.event, "listing_review");
    assert(!JSON.stringify(alert).includes("test@example.test"));
    return new Response(null, { status: alerts === 1 ? 503 : 200 });
  }
  deliveries++;
  const body = JSON.parse(String(init?.body));
  assert.equal(body.to, "gustav@nordsym.com");
  assert.equal(
    (init?.headers as any)["Idempotency-Key"],
    `listing-review-${id}-1`,
  );
  return Response.json({ id: "synthetic-receipt" });
};
try {
  await t.action(n.send, { id, revision: 1 });
  assert.equal(
    (await t.query(n.candidate, { id, revision: 1 })).notificationId,
    "synthetic-receipt",
  );
  await t.action(n.send, { id, revision: 1 });
  await t.action(n.send, { id, revision: 1 });
  assert.equal(deliveries, 1);
  assert.equal(alerts, 2);
} finally {
  globalThis.fetch = nativeFetch;
  delete process.env.RESEND_API_KEY;
  delete process.env.APICLAW_INBOUND_WEBHOOK_SECRET;
}
const queue = await t.query(api.operatorPending, {
  internalSecret: "synthetic-review-secret",
  reviewer: "gustav@nordsym.com",
  paginationOpts: { numItems: 25, cursor: null },
});
assert.equal(queue.page[0].notificationState, "sent");
assert.equal(queue.page[0].notificationAlertSent, true);
assert.equal(queue.page[0].submitter, "test@example.test");
await assert.rejects(
  t.mutation(api.operatorReview, {
    internalSecret: "synthetic-review-secret",
    reviewer: "gustav@nordsym.com",
    id,
    revision: 2,
    approve: true,
    note: "Stale",
  }),
  /stale/,
);
await t.mutation(api.operatorReview, {
  internalSecret: "synthetic-review-secret",
  reviewer: "gustav@nordsym.com",
  id,
  revision: 1,
  approve: false,
  note: "Provide ownership evidence",
});
const changesReview = await t.run(async (ctx) =>
  (await ctx.db
    .query("discoveryListingReviews")
    .withIndex("by_listing", (q) => q.eq("listingId", id))
    .collect())
    .find((row) => row.revision === 1),
);
assert(changesReview);
assert.equal(changesReview.notificationState, "queued");
let decisionDeliveries = 0;
globalThis.fetch = async (_url, init) => {
  decisionDeliveries++;
  const body = JSON.parse(String(init?.body));
  assert.equal(body.from, "APIClaw <hello@apiclaw.cloud>");
  assert.equal(body.reply_to, "gustav@nordsym.com");
  assert.equal(body.to, "test@example.test");
  assert.match(body.subject, /Changes requested/);
  assert.match(body.text, /Provide ownership evidence/);
  assert.match(body.text, /workspace\?tab=api-catalog&view=my-apis/);
  assert.equal(
    (init?.headers as any)["Idempotency-Key"],
    `listing-decision-${id}-1-changes_requested`,
  );
  return Response.json({ id: "decision-changes-receipt" });
};
process.env.RESEND_API_KEY = "synthetic-decision-key";
try {
  await t.action(n.sendDecision, { reviewId: changesReview._id });
  await t.action(n.sendDecision, { reviewId: changesReview._id });
} finally {
  globalThis.fetch = nativeFetch;
  delete process.env.RESEND_API_KEY;
}
assert.equal(decisionDeliveries, 1);
assert.deepEqual(
  await t.run(async (ctx) => {
    const row = await ctx.db.get(changesReview._id);
    return {
      state: row?.notificationState,
      attempts: row?.notificationAttempts,
      id: row?.notificationId,
    };
  }),
  { state: "sent", attempts: 1, id: "decision-changes-receipt" },
);
assert.equal(
  (
    await t.query(api.published, {
      paginationOpts: { numItems: 25, cursor: null },
    })
  ).page.length,
  0,
);
await t.mutation(api.saveDraft, {
  token: "owner-review",
  id,
  revision: 1,
  metadata,
});
await t.mutation(api.submit, { token: "owner-review", id, revision: 2 });
for (let i = 0; i < 3; i++)
  await t.mutation(n.record, { id, revision: 2, sent: false });
assert.equal(
  (await t.query(api.mine, { token: "owner-review" }))[0].notificationState,
  "failed",
);
await t.mutation(api.operatorReview, {
  internalSecret: "synthetic-review-secret",
  reviewer: "gustav@nordsym.com",
  id,
  revision: 2,
  approve: true,
  note: "Synthetic fixture authorized",
});
const approvedReview = await t.run(async (ctx) =>
  (await ctx.db
    .query("discoveryListingReviews")
    .withIndex("by_listing", (q) => q.eq("listingId", id))
    .collect())
    .find((row) => row.revision === 2),
);
assert(approvedReview);
assert.equal(approvedReview.notificationState, "queued");
globalThis.fetch = async () => new Response(null, { status: 503 });
process.env.RESEND_API_KEY = "synthetic-decision-key";
try {
  await t.action(n.sendDecision, { reviewId: approvedReview._id });
  await t.action(n.sendDecision, { reviewId: approvedReview._id });
  await t.action(n.sendDecision, { reviewId: approvedReview._id });
} finally {
  globalThis.fetch = nativeFetch;
  delete process.env.RESEND_API_KEY;
}
assert.deepEqual(
  await t.run(async (ctx) => {
    const row = await ctx.db.get(approvedReview._id);
    return {
      state: row?.notificationState,
      attempts: row?.notificationAttempts,
      error: row?.notificationError,
    };
  }),
  { state: "failed", attempts: 3, error: "resend_503" },
);
assert.equal(
  (
    await t.query(api.published, {
      paginationOpts: { numItems: 25, cursor: null },
    })
  ).page.length,
  1,
);
await assert.rejects(
  t.mutation(api.submit, { token: "owner-review", id, revision: 2 }),
  /Edit/,
);
assert.equal(await t.query(n.candidate, { id, revision: 2 }), null);
await t.mutation(api.unpublish, { token: "owner-review", id });
assert.equal(
  (
    await t.query(api.published, {
      paginationOpts: { numItems: 25, cursor: null },
    })
  ).page.length,
  0,
);
assert(!isListingOperator(null));
assert(
  !isListingOperator({
    emailAddresses: [
      {
        emailAddress: "gustav@nordsym.com",
        verification: { status: "unverified" },
      },
    ],
  }),
);
assert(
  !isListingOperator({
    emailAddresses: [
      {
        emailAddress: "gustav+test@nordsym.com",
        verification: { status: "verified" },
      },
    ],
  }),
);
assert(
  isListingOperator({
    emailAddresses: [
      {
        emailAddress: "gustav@nordsym.com",
        verification: { status: "verified" },
      },
    ],
  }),
);
const mail = reviewEmail("<img src=x>\nInjected", "id", 1);
assert(!mail.subject.includes("\n"));
assert(!mail.html.includes("<img"));
assert(mail.html.includes("&lt;img"));
const approvedMail = decisionEmail({
  name: "Synthetic review fixture\nInjected",
  decision: "approved",
  note: "Approved",
  to: "owner@example.test",
});
assert(!approvedMail.subject.includes("\n"));
assert.match(approvedMail.text, /https:\/\/apiclaw\.cloud\/catalog/);
assert.match(approvedMail.text, /changes will come back through review/i);
assert.equal(decisionRecipientAllowed("gustav@nordsym.com").allowed, false);
assert.equal(
  decisionRecipientAllowed(
    "gustav@nordsym.com",
    "partner",
    { LISTING_DECISION_TEST_RECIPIENT: "gustav@nordsym.com" },
  ).allowed,
  true,
);
assert.equal(decisionRecipientAllowed("ci@apiclaw.test").allowed, false);
assert.equal(
  decisionRecipientAllowed("owner@customer.test", "partner").allowed,
  false,
);
assert.equal(
  decisionRecipientAllowed("owner@customer.test", "enterprise").allowed,
  false,
);
for (const tier of ["partner", "enterprise"] as const) {
  await t.run(async (ctx) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", "test@example.test"))
      .unique();
    assert(workspace);
    await ctx.db.patch(workspace._id, { tier });
  });
  const blockedId = await t.mutation(api.saveDraft, {
    token: "owner-review",
    metadata: { ...metadata, name: `${tier} decision fixture` },
  });
  await t.mutation(api.submit, {
    token: "owner-review",
    id: blockedId,
    revision: 1,
  });
  await t.mutation(api.operatorReview, {
    internalSecret: "synthetic-review-secret",
    reviewer: "gustav@nordsym.com",
    id: blockedId,
    revision: 1,
    approve: false,
    note: "Synthetic no-email tier fixture",
  });
  const blockedReview = await t.run(async (ctx) =>
    ctx.db
      .query("discoveryListingReviews")
      .withIndex("by_listing", (q) => q.eq("listingId", blockedId))
      .unique(),
  );
  assert(blockedReview);
  let blockedFetches = 0;
  globalThis.fetch = async () => {
    blockedFetches++;
    throw new Error("Resend must not be called for no-email tiers");
  };
  try {
    await t.action(n.sendDecision, { reviewId: blockedReview._id });
  } finally {
    globalThis.fetch = nativeFetch;
  }
  assert.equal(blockedFetches, 0);
  assert.deepEqual(
    await t.run(async (ctx) => {
      const row = await ctx.db.get(blockedReview._id);
      return {
        state: row?.notificationState,
        error: row?.notificationError,
      };
    }),
    { state: "skipped", error: `tier:${tier}` },
  );
}
await t.run(async (ctx) => {
  const workspace = await ctx.db
    .query("workspaces")
    .withIndex("by_email", (q) => q.eq("email", "test@example.test"))
    .unique();
  assert(workspace);
  await ctx.db.patch(workspace._id, { tier: "free" });
});
await t.run(async (ctx) => {
  const row = (await ctx.db.query("rateLimits").collect()).find(
    (x) => x.action === "listing-submit",
  )!;
  await ctx.db.patch(row._id, { count: 10 });
});
await assert.rejects(
  t.mutation(api.submit, { token: "owner-review", id, revision: 3 }),
  /Submission limit/,
);
const target = await t.query(api.operatorPending, {
  internalSecret: "synthetic-review-secret",
  reviewer: "gustav@nordsym.com",
  id,
  paginationOpts: { numItems: 25, cursor: null },
});
assert.equal(target.page.length, 0, "Withdrawn target must not be reviewable");
delete process.env.APICLAW_INTERNAL_SECRET;
console.log(
  "PASS: operator authorization, revision review, rejection/resubmission, notification receipt, deduplication, bounded failures, escaping and discovery-only approval",
);

await t.run(async (ctx) => {
  for (const task of await ctx.db.system
    .query("_scheduled_functions")
    .collect())
    if (task.state.kind === "pending") await ctx.scheduler.cancel(task._id);
});

mock.timers.reset();
