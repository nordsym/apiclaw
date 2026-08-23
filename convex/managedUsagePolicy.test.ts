#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  activationManagedCallCount,
  customerChargeForProviderCost,
  evaluateManagedUsage,
  hasActiveContractEntitlement,
  hasActivePaygEntitlement,
} from "./managedUsagePolicy";

// A call whose provider cost is provably zero (billingGradeCost proof +
// estimatedProviderCostUsd === 0) is free forever, no card, uncapped; even
// after hundreds of prior calls and with no card on file.
const heavyZeroCostUser = {
  tier: "free",
  managedUsageCount: 900,
  activationManagedCallCount: 900,
};
const zeroCostCall = evaluateManagedUsage(heavyZeroCostUser, {
  estimatedProviderCostUsd: 0,
  billingGradeCost: true,
});
assert.equal(zeroCostCall.allowed, true);
assert.equal(zeroCostCall.reason, null);
assert.equal(zeroCostCall.managedUsageLimit, -1, "the lifetime cap no longer gates zero-cost calls");
assert.equal(zeroCostCall.managedUsageRemaining, -1);

// A zero-VALUED reservation/guess (billingGradeCost !== true) is not proof of
// zero cost. It is treated as a paid call (fail closed) and requires a card,
// exactly like any other unproven cost.
const guessedZero = evaluateManagedUsage({ tier: "free" }, {
  estimatedProviderCostUsd: 0,
  billingGradeCost: false,
});
assert.equal(guessedZero.allowed, false);
assert.equal(guessedZero.reason, "payment_required");

// Any call with an unpriced/invalid cost estimate stays fail-closed.
const unpriced = evaluateManagedUsage({ tier: "free", managedUsageCount: 0 }, {});
assert.equal(unpriced.allowed, false);
assert.equal(unpriced.reason, "unpriced_managed_call");
assert.equal(evaluateManagedUsage(
  { tier: "free", managedUsageCount: 0 },
  { estimatedProviderCostUsd: -0.01 },
).reason, "unpriced_managed_call");

// A call with real (proven, non-zero) provider cost and no card on file
// requires payment, regardless of lifetime call count.
const noCardWorkspace = { tier: "free", managedUsageCount: 3 };
const paidNoCard = evaluateManagedUsage(noCardWorkspace, {
  estimatedProviderCostUsd: 0.04,
  billingGradeCost: true,
});
assert.equal(paidNoCard.allowed, false);
assert.equal(paidNoCard.reason, "payment_required");
assert.equal(paidNoCard.billingClass, "payg");

// A brand-new workspace's very first call, if it has real cost, also needs a
// card; the old 25-call/$1 activation allowance no longer applies.
const brandNewNoCard = evaluateManagedUsage({ tier: "free" }, {
  estimatedProviderCostUsd: 0.01,
  billingGradeCost: true,
});
assert.equal(brandNewNoCard.allowed, false);
assert.equal(brandNewNoCard.reason, "payment_required");

// A card on file is trusted directly (hasPaymentMethod boolean), no live
// Stripe check and no requirement for a fully-wired PAYG subscription.
const cardOnFile = { tier: "free", hasPaymentMethod: true };
const paidWithCard = evaluateManagedUsage(cardOnFile, {
  estimatedProviderCostUsd: 0.01,
  billingGradeCost: true,
});
assert.equal(paidWithCard.allowed, true);
assert.equal(paidWithCard.reason, null);
assert.equal(paidWithCard.billingClass, "payg");

// hasCardAttached is an accepted alias for hasPaymentMethod.
assert.equal(
  evaluateManagedUsage({ tier: "free", hasCardAttached: true }, {
    estimatedProviderCostUsd: 0.01,
    billingGradeCost: true,
  }).allowed,
  true,
);

// Even with a card, a numeric reservation alone (billingGradeCost !== true)
// is not enough to charge; this cap/reservation behavior is unchanged.
const paidCardUnprovenCost = evaluateManagedUsage(cardOnFile, {
  estimatedProviderCostUsd: 0.005,
  billingGradeCost: false,
});
assert.equal(paidCardUnprovenCost.allowed, false);
assert.equal(paidCardUnprovenCost.reason, "payg_cost_adapter_missing");

const fakePayg = {
  tier: "usage_based",
  billingPlan: "usage_based",
  stripeCustomerId: "cus_test",
  stripeSubscriptionId: "sub_test",
  stripeSubscriptionStatus: "past_due",
  hasPaymentMethod: true,
  paygMeterReadyAt: Date.UTC(2026, 6, 18),
  paygMeterPriceId: "price_micro_test",
  paygMeterId: "mtr_micro_test",
  paygMeterEventName: "apiclaw_managed_micro_usd",
};
assert.equal(hasActivePaygEntitlement(fakePayg), false);
// The gate no longer requires the full PAYG entitlement apparatus (active
// subscription, exact-meter readiness); only the stored hasPaymentMethod
// boolean and a billing-grade cost proof.
assert.equal(
  evaluateManagedUsage(fakePayg, { estimatedProviderCostUsd: 10, billingGradeCost: true }).allowed,
  true,
);

for (const invalid of [
  { ...fakePayg, stripeSubscriptionStatus: "active", hasPaymentMethod: false },
  { ...fakePayg, stripeSubscriptionStatus: "active", stripeSubscriptionId: undefined },
  { ...fakePayg, stripeSubscriptionStatus: "canceled" },
]) {
  assert.equal(hasActivePaygEntitlement(invalid), false);
}

const payg = { ...fakePayg, stripeSubscriptionStatus: "active" };
assert.equal(hasActivePaygEntitlement(payg), true);
const paidDecision = evaluateManagedUsage(payg, {
  estimatedProviderCostUsd: 10,
  billingGradeCost: true,
});
assert.equal(paidDecision.allowed, true);
assert.equal(paidDecision.billingClass, "payg");
assert.equal(
  evaluateManagedUsage(payg, { estimatedProviderCostUsd: 0.005 }).reason,
  "payg_cost_adapter_missing",
);
assert.equal(evaluateManagedUsage(payg).reason, "unpriced_managed_call");

assert.equal(activationManagedCallCount({ tier: "free", usageCount: 8 }), 8);
assert.equal(activationManagedCallCount({ tier: "free", managedUsageCount: 900 }), 25);
assert.equal(activationManagedCallCount({
  tier: "usage_based",
  managedUsageCount: 900,
  activationManagedCallCount: 7,
}), 7);

// A paid call does not consume/require the (now-informational) activation
// counter.
const paidCallDoesNotConsumeActivation = evaluateManagedUsage(
  { ...payg, activationManagedCallCount: 25 },
  { estimatedProviderCostUsd: 0.01, billingGradeCost: true },
);
assert.equal(paidCallDoesNotConsumeActivation.activationManagedCallCount, 25);

const enterprisePayg = {
  ...payg,
  activationManagedCallCount: 25,
  tier: "enterprise",
  billingPlan: "usage_based",
};
assert.equal(
  hasActiveContractEntitlement(enterprisePayg),
  false,
  "an enterprise label must not turn an exact-meter PAYG subscription into a free contract rail",
);
assert.equal(
  evaluateManagedUsage(enterprisePayg, {
    estimatedProviderCostUsd: 0.01,
    billingGradeCost: true,
  }).billingClass,
  "payg",
);

const verifiedContract = {
  tier: "pro",
  billingPlan: "pro",
  stripeSubscriptionId: "sub_contract",
  stripeSubscriptionStatus: "active",
};
assert.equal(hasActiveContractEntitlement(verifiedContract), true);
assert.equal(
  evaluateManagedUsage(verifiedContract, {
    estimatedProviderCostUsd: 0.01,
    billingGradeCost: true,
  }).billingClass,
  "contract",
);
// A contract entitlement allows a paid call with no card on file too.
assert.equal(
  evaluateManagedUsage(verifiedContract, {
    estimatedProviderCostUsd: 0.01,
    billingGradeCost: true,
  }).allowed,
  true,
);
assert.equal(
  hasActiveContractEntitlement({ ...verifiedContract, billingPlan: "scale" }),
  false,
  "tier and verified Stripe plan must match",
);

const managedCostHold = evaluateManagedUsage({
  ...payg,
  activationManagedCallCount: 25,
  stripeSubscriptionStatus: "managed_cost_hold",
}, {
  estimatedProviderCostUsd: 0.01,
  billingGradeCost: true,
});
assert.equal(managedCostHold.allowed, false);
assert.equal(managedCostHold.reason, "managed_cost_hold");

const managedCostHoldSurvivesStripeState = evaluateManagedUsage({
  ...payg,
  activationManagedCallCount: 25,
  stripeSubscriptionStatus: "active",
  managedCostHoldAt: Date.now(),
  managedCostHoldReason: "reported_cost_exceeds_authorized_reservation",
}, {
  estimatedProviderCostUsd: 0.01,
  billingGradeCost: true,
});
assert.equal(managedCostHoldSurvivesStripeState.allowed, false);
assert.equal(managedCostHoldSurvivesStripeState.reason, "managed_cost_hold");

// A cost hold blocks even a provably-zero-cost call; the hold is a hard
// circuit breaker independent of the free/paid boundary.
const managedCostHoldBlocksZeroCost = evaluateManagedUsage({
  tier: "free",
  managedCostHoldAt: Date.now(),
}, {
  estimatedProviderCostUsd: 0,
  billingGradeCost: true,
});
assert.equal(managedCostHoldBlocksZeroCost.allowed, false);
assert.equal(managedCostHoldBlocksZeroCost.reason, "managed_cost_hold");

const founder = evaluateManagedUsage({ tier: "founder", managedUsageCount: 999 }, {});
assert.equal(founder.allowed, true);
assert.equal(founder.trafficClass, "internal");
assert.equal(founder.billingClass, "internal");

assert.deepEqual(customerChargeForProviderCost(1, "activation"), { customerChargeUsd: 0, marginUsd: 0 });
assert.deepEqual(customerChargeForProviderCost(1, "internal"), { customerChargeUsd: 0, marginUsd: 0 });
assert.deepEqual(customerChargeForProviderCost(1, "payg"), { customerChargeUsd: 1.15, marginUsd: 0.1499999999999999 });

// BYOH (2026-08-24): a "byok" traffic class call is always allowed, no card,
// no cost to the workspace — evaluated before the card-required gate. It
// applies even to a heavy-usage free-tier workspace with no payment method.
const byokWorkspace = { tier: "free", managedUsageCount: 500 };
const byokUnpriced = evaluateManagedUsage(byokWorkspace, { trafficClass: "byok" });
assert.equal(byokUnpriced.allowed, true);
assert.equal(byokUnpriced.reason, null);
assert.equal(byokUnpriced.trafficClass, "byok");
assert.equal(byokUnpriced.billingClass, "byok");

const byokWithCost = evaluateManagedUsage(byokWorkspace, {
  trafficClass: "byok",
  estimatedProviderCostUsd: 5,
  billingGradeCost: true,
});
assert.equal(byokWithCost.allowed, true, "byok is free regardless of estimated provider cost");
assert.equal(byokWithCost.reason, null);

// byok is evaluated before the card-required gate: no payment method on file
// and a real, proven, non-zero cost would normally require a card, but the
// byok branch short-circuits before that check is ever reached.
assert.equal(
  evaluateManagedUsage({ tier: "free", hasPaymentMethod: false }, {
    trafficClass: "byok",
    estimatedProviderCostUsd: 10,
    billingGradeCost: true,
  }).allowed,
  true,
);

// A byok call never earns a customer charge (the workspace pays its own
// provider directly, not through apiclaw's margin).
assert.deepEqual(customerChargeForProviderCost(5, "byok"), { customerChargeUsd: 0, marginUsd: 0 });

console.log("managed usage policy: zero-cost calls are free forever, paid calls require a card, entitlement and traffic classes hold, byok bypasses the card gate");
