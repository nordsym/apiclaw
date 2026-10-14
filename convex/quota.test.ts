#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { getQuotaState, isPaidTier } from "./quota";

// The display shim keeps zero-cost open rails allowed while exposing the
// separate managed trial boundary to the workspace UI.
const heavyUsage = getQuotaState({ tier: "free", managedUsageCount: 900 }, 1);
assert.equal(heavyUsage.allowed, true);
assert.equal(heavyUsage.lifetimeLimit, 25);
assert.equal(heavyUsage.lifetimeRemaining, 0);

const brandNew = getQuotaState({ tier: "free", managedUsageCount: 0 }, 1);
assert.equal(brandNew.allowed, true);
assert.equal(brandNew.lifetimeLimit, 25);
assert.equal(brandNew.lifetimeRemaining, 25);

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

// The lifetime allowance never resets on a stale weekly-reset marker.
const noReset = getQuotaState({
  tier: "free",
  managedUsageCount: 900,
  weeklyUsageCount: 0,
  lastWeeklyResetAt: 0,
}, 1, Date.UTC(2030, 0, 1));
assert.equal(noReset.allowed, true);
assert.equal(noReset.lifetimeRemaining, 0);

console.log("convex quota guard: zero-cost display is unlimited and only a cost hold blocks it");
