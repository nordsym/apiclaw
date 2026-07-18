import assert from "node:assert/strict";
import { getWorkspaceUsageDisplay } from "./workspaces";

const now = Date.UTC(2026, 6, 16, 12, 0, 0);
const free = getWorkspaceUsageDisplay({
  tier: "free",
  weeklyUsageCount: 12,
  lastWeeklyResetAt: Date.UTC(2026, 6, 13, 0, 0, 0),
}, now);
assert.deepEqual(free, {
  usageCount: 12,
  usageLimit: 50,
  usageRemaining: 38,
  usagePercentage: 24,
});

const reset = getWorkspaceUsageDisplay({
  tier: "free",
  weeklyUsageCount: 49,
  lastWeeklyResetAt: Date.UTC(2026, 6, 6, 0, 0, 0),
}, now);
assert.equal(reset.usageCount, 0);
assert.equal(reset.usageRemaining, 50);

const paid = getWorkspaceUsageDisplay({
  tier: "usage_based",
  weeklyUsageCount: 500,
  lastWeeklyResetAt: now,
}, now);
assert.equal(paid.usageLimit, -1);
assert.equal(paid.usageRemaining, -1);
assert.equal(paid.usagePercentage, 0);

for (const tier of ["founder", "partner", "enterprise"]) {
  const unlimited = getWorkspaceUsageDisplay({
    tier,
    weeklyUsageCount: 680,
    lastWeeklyResetAt: now,
  }, now);
  assert.equal(unlimited.usageLimit, -1, `${tier} must be unlimited`);
  assert.equal(unlimited.usageRemaining, -1, `${tier} must never show negative remaining`);
  assert.equal(unlimited.usagePercentage, 0, `${tier} must never show negative usage percent`);
}

console.log("workspace quota display uses the same weekly state as enforcement");
