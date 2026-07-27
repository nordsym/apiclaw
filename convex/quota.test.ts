#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { getQuotaState, isPaidTier } from "./quota";

const capped = getQuotaState({ tier: "free", managedUsageCount: 25 }, 1);
assert.equal(capped.allowed, false);
assert.equal(capped.reason, "managed_call_limit_exceeded");
assert.equal(capped.lifetimeRemaining, 0);

const finalActivationCall = getQuotaState({ tier: "free", managedUsageCount: 24 }, 1);
assert.equal(finalActivationCall.allowed, true);
assert.equal(finalActivationCall.lifetimeRemaining, 0);

const tierOnlyPayg = { tier: "usage_based", managedUsageCount: 25 };
assert.equal(isPaidTier(tierOnlyPayg), false);
assert.equal(getQuotaState(tierOnlyPayg, 1).allowed, false);

const paid = {
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
  managedUsageCount: 5000,
  activationManagedCallCount: 25,
};
assert.equal(isPaidTier(paid), true);
assert.equal(getQuotaState(paid, 1).allowed, true);
assert.equal(getQuotaState(paid, 1).lifetimeLimit, -1);

const noReset = getQuotaState({
  tier: "free",
  managedUsageCount: 25,
  weeklyUsageCount: 0,
  lastWeeklyResetAt: 0,
}, 1, Date.UTC(2030, 0, 1));
assert.equal(noReset.allowed, false);

console.log("convex quota guard: lifetime allowance never resets and tier-only PAYG cannot bypass");
