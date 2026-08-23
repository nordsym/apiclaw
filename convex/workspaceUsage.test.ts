import assert from "node:assert/strict";
import { getWorkspaceUsageDisplay } from "./workspaces";

const free = getWorkspaceUsageDisplay({
  tier: "free",
  usageCount: 12,
  managedUsageCount: 12,
});
assert.deepEqual(free, {
  usageCount: 12,
  usageLimit: -1,
  usageRemaining: -1,
  usagePercentage: 0,
});

const zeroCostContinuesAfterLegacyThreshold = getWorkspaceUsageDisplay({
  tier: "free",
  usageCount: 25,
  managedUsageCount: 25,
  weeklyUsageCount: 0,
  lastWeeklyResetAt: 0,
}, Date.UTC(2030, 0, 1));
assert.equal(zeroCostContinuesAfterLegacyThreshold.usageCount, 25);
assert.equal(zeroCostContinuesAfterLegacyThreshold.usageLimit, -1, "zero-cost Free APIs have no lifetime cap");
assert.equal(zeroCostContinuesAfterLegacyThreshold.usageRemaining, -1);

const paid = getWorkspaceUsageDisplay({
  tier: "usage_based",
  billingPlan: "usage_based",
  stripeCustomerId: "cus_test",
  stripeSubscriptionId: "sub_test",
  stripeSubscriptionStatus: "active",
  hasPaymentMethod: true,
  paygMeterReadyAt: Date.UTC(2026, 6, 18),
  paygMeterPriceId: "price_micro_test",
  paygMeterId: "mtr_micro_test",
  paygMeterEventName: "apiclaw_managed_micro_usd",
  managedUsageCount: 500,
  activationManagedCallCount: 25,
});
assert.equal(paid.usageCount, 25);
assert.equal(paid.usageLimit, -1);
assert.equal(paid.usageRemaining, -1);
assert.equal(paid.usagePercentage, 0);

for (const tier of ["founder", "partner"]) {
  const unlimited = getWorkspaceUsageDisplay({ tier, managedUsageCount: 680 });
  assert.equal(unlimited.usageLimit, -1, `${tier} must be unlimited`);
  assert.equal(unlimited.usageRemaining, -1, `${tier} must never show negative remaining`);
  assert.equal(unlimited.usagePercentage, 0, `${tier} must never show negative usage percent`);
}

console.log("workspace quota display uses lifetime managed allowance and verified PAYG state");
