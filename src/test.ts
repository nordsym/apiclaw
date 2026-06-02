#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  FREE_CALL_PATHS,
  ENFORCED_CALL_PATHS,
  requireVerifiedOwner,
  type WorkspaceContextLike,
} from "./registration-guard.js";

function activeContext(overrides: Partial<WorkspaceContextLike> = {}): WorkspaceContextLike {
  return {
    sessionToken: "apiclaw_test_session",
    workspaceId: "test_workspace",
    email: "test@example.com",
    tier: "free",
    status: "active",
    usageCount: 0,
    usageRemaining: 25,
    ...overrides,
  };
}

assert.equal(FREE_CALL_PATHS.has("purchase_access"), false);
assert.equal(FREE_CALL_PATHS.has("add_credits"), false);
assert.equal(ENFORCED_CALL_PATHS.has("call_api"), true);
assert.equal(ENFORCED_CALL_PATHS.has("capability"), true);

assert.equal(requireVerifiedOwner(null).ok, false);
assert.equal(requireVerifiedOwner(activeContext()).ok, true);

const quotaResult = requireVerifiedOwner(activeContext({ usageRemaining: 0 }));
assert.equal(quotaResult.ok, false);
if (!quotaResult.ok) {
  assert.equal(quotaResult.reason, "quota_exceeded");
}

console.log("APIClaw safe smoke tests passed");
