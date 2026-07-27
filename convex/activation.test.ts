#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  classifyFirstCall,
  recordFirstCallApiSuccessInTransaction,
} from "./activation";

type Row = Record<string, any> & { _id: string };

function fakeCtx(options: { workspace?: Row; existing?: Row } = {}) {
  const inserted: Array<{ table: string; value: Record<string, any> }> = [];
  const db = {
    query(table: string) {
      assert.equal(table, "funnelEvents");
      return {
        withIndex(index: string, apply: (q: any) => unknown) {
          assert.equal(index, "by_dedupeKey");
          apply({ eq: (field: string, value: string) => ({ field, value }) });
          return { first: async () => options.existing ?? null };
        },
      };
    },
    async get() {
      return options.workspace ?? null;
    },
    async insert(table: string, value: Record<string, any>) {
      inserted.push({ table, value });
      return "event-new";
    },
  };
  return { ctx: { db } as any, inserted };
}

assert.equal(classifyFirstCall("user@example.com"), "human");
assert.equal(classifyFirstCall("operator@nordsym.com"), "internal");
assert.equal(classifyFirstCall("GUSTAVNORDSYNC@GMAIL.COM"), "internal");

const first = fakeCtx({
  workspace: {
    _id: "ws1",
    email: "user@example.com",
    status: "active",
    usageCount: 1,
  },
});
const firstResult = await recordFirstCallApiSuccessInTransaction(
  first.ctx,
  {
    workspaceId: "ws1" as any,
    path: "/v1/execute",
    authMethod: "session",
    provider: "brave_search",
    action: "search",
  },
  1234
);
assert.deepEqual(firstResult, {
  id: "event-new",
  deduped: false,
  event: "first_call_api_success",
});
assert.equal(first.inserted.length, 1);
assert.deepEqual(first.inserted[0], {
  table: "funnelEvents",
  value: {
    event: "first_call_api_success",
    classification: "human",
    workspaceId: "ws1",
    email: "user@example.com",
    dedupeKey: "first_call:ws1",
    props: {
      path: "/v1/execute",
      auth_method: "session",
      provider: "brave_search",
      action: "search",
      recorded_by: "gateway",
      prior_managed_calls: 0,
    },
    timestamp: 1234,
  },
});

const duplicate = fakeCtx({
  workspace: {
    _id: "ws1",
    email: "user@example.com",
    status: "active",
    usageCount: 1,
  },
  existing: { _id: "event-existing" },
});
const duplicateResult = await recordFirstCallApiSuccessInTransaction(
  duplicate.ctx,
  {
    workspaceId: "ws1" as any,
    path: "/v1/chat/completions",
    authMethod: "api-key",
  }
);
assert.deepEqual(duplicateResult, { id: "event-existing", deduped: true });
assert.equal(duplicate.inserted.length, 0);

const reactivated = fakeCtx({
  workspace: {
    _id: "ws3",
    email: "returning@example.com",
    status: "active",
    managedUsageCount: 8,
    usageCount: 12,
  },
});
const reactivatedResult = await recordFirstCallApiSuccessInTransaction(
  reactivated.ctx,
  {
    workspaceId: "ws3" as any,
    path: "/v1/chat/completions",
    authMethod: "api-key",
    provider: "openrouter",
    action: "chat_completions",
  },
  5678
);
assert.deepEqual(reactivatedResult, {
  id: "event-new",
  deduped: false,
  event: "workspace_reactivated",
});
assert.equal(reactivated.inserted[0].value.event, "workspace_reactivated");
assert.equal(reactivated.inserted[0].value.dedupeKey, "reactivation:ws3");
assert.equal(reactivated.inserted[0].value.props.prior_managed_calls, 7);

const inactive = fakeCtx({
  workspace: { _id: "ws2", email: "user@example.com", status: "unclaimed" },
});
const inactiveResult = await recordFirstCallApiSuccessInTransaction(
  inactive.ctx,
  {
    workspaceId: "ws2" as any,
    path: "/v1/execute",
    authMethod: "internal",
  }
);
assert.deepEqual(inactiveResult, {
  id: null,
  deduped: false,
  skipped: "workspace_not_active",
});
assert.equal(inactive.inserted.length, 0);

console.log("convex activation: first successful gateway call is classified and deduped");
