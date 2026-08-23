#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { getQuotaState, isPaidTier } from "./quota";

// getQuotaState is a display/status shim that always evaluates a
// provably-zero-cost call (see convex/quota.ts). Under the current policy
// that means it is unlimited and never blocks on lifetime call count,
// no matter how many calls a workspace has already made.
const heavyUsage = getQuotaState({ tier: "free", managedUsageCount: 900 }, 1);
assert.equal(heavyUsage.allowed, true);
assert.equal(heavyUsage.lifetimeLimit, -1);
assert.equal(heavyUsage.lifetimeRemaining, -1);

const brandNew = getQuotaState({ tier: "free", managedUsageCount: 0 }, 1);
assert.equal(brandNew.allowed, true);
assert.equal(brandNew.lifetimeLimit, -1);

const tierOnlyPayg = { tier: "usage_based", managedUsageCount: 25 };
assert.equal(isPaidTier(tierOnlyPayg), false);
// The display shim itself is not the real per-call gate, so it still reports
// "allowed" here; the real paid-call gate (evaluateManagedUsage, exercised
// with each call's real cost) is what actually requires a card.
assert.equal(getQuotaState(tierOnlyPayg, 1).allowed, true);

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

// A managed_cost_hold is the one thing that still blocks this display shim,
// since it is a hard circuit breaker independent of the free/paid boundary.
const onHold = getQuotaState({
  tier: "free",
  managedUsageCount: 3,
  managedCostHoldAt: Date.now(),
}, 1);
assert.equal(onHold.allowed, false);
assert.equal(onHold.reason, "managed_cost_hold");
assert.match(onHold.message ?? "", /temporarily paused/i);

// The lifetime allowance never resets on a stale weekly-reset marker; there
// is no reset concept anymore, it is simply always unlimited for zero cost.
const noReset = getQuotaState({
  tier: "free",
  managedUsageCount: 900,
  weeklyUsageCount: 0,
  lastWeeklyResetAt: 0,
}, 1, Date.UTC(2030, 0, 1));
assert.equal(noReset.allowed, true);

console.log("convex quota guard: zero-cost display is unlimited and only a cost hold blocks it");
