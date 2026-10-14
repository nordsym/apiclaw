import assert from "node:assert/strict";
import { getWorkspaceUsageDisplay } from "./workspaces";

const free = getWorkspaceUsageDisplay({
  tier: "free",
  usageCount: 12,
  managedUsageCount: 12,
});
assert.deepEqual(free, {
  usageCount: 12,
  usageLimit: 25,
  usageRemaining: 13,
  usagePercentage: 48,
});

const zeroCostContinuesAfterLegacyThreshold = getWorkspaceUsageDisplay({
  tier: "free",
  usageCount: 25,
  managedUsageCount: 25,
  weeklyUsageCount: 0,
  lastWeeklyResetAt: 0,
}, Date.UTC(2030, 0, 1));
assert.equal(zeroCostContinuesAfterLegacyThreshold.usageCount, 25);
assert.equal(zeroCostContinuesAfterLegacyThreshold.usageLimit, 25, "the UI exposes the managed trial boundary");
assert.equal(zeroCostContinuesAfterLegacyThreshold.usageRemaining, 0);

const paidWorkspace = {
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
};
const paid = getWorkspaceUsageDisplay(paidWorkspace, Date.now(), true);
assert.equal(paid.usageCount, 25);
assert.equal(paid.usageLimit, -1);
assert.equal(paid.usageRemaining, -1);
assert.equal(paid.usagePercentage, 0);

const staleMeter = getWorkspaceUsageDisplay({
  ...paidWorkspace,
  paygMeterPriceId: "price_stale",
}, Date.now(), false);
assert.equal(staleMeter.usageLimit, 25);
assert.equal(staleMeter.usageRemaining, 0);

for (const tier of ["founder", "partner"]) {
  const allowance = getWorkspaceUsageDisplay({ tier, managedUsageCount: 680 });
  assert.equal(allowance.usageLimit, 25, `${tier} customer traffic must show the managed allowance`);
  assert.equal(allowance.usageRemaining, 0, `${tier} must show the exhausted allowance`);
  assert.equal(allowance.usagePercentage, 100, `${tier} must show the upgrade boundary`);
}

console.log("workspace quota display uses lifetime managed allowance and verified PAYG state");
