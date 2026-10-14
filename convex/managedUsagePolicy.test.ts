#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  activationManagedCallCount,
  customerChargeForProviderCost,
  evaluateManagedUsage,
  hasActiveContractEntitlement,
  hasActivePaygEntitlement,
  managedQuotaMessage,
} from "./managedUsagePolicy";
import { APICLAW_UPGRADE_URL, PAYMENT_REQUIRED_MESSAGE } from "../src/first-call-nudge";

// Proven-zero provider rails remain free forever, even after activation is
// exhausted and without any Stripe state.
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
assert.equal(zeroCostCall.managedUsageLimit, -1, "the activation cap never gates proven-zero calls");
assert.equal(zeroCostCall.managedUsageRemaining, -1);

// A zero-valued guess is not proof and stays fail-closed.
const guessedZero = evaluateManagedUsage({ tier: "free" }, {
  estimatedProviderCostUsd: 0,
  billingGradeCost: false,
});
assert.equal(guessedZero.allowed, false);
assert.equal(guessedZero.reason, "unpriced_managed_call");

// Any call with an unpriced/invalid cost estimate stays fail-closed.
const unpriced = evaluateManagedUsage({ tier: "free", managedUsageCount: 0 }, {});
assert.equal(unpriced.allowed, false);
assert.equal(unpriced.reason, "unpriced_managed_call");
assert.equal(evaluateManagedUsage(
  { tier: "free", managedUsageCount: 0 },
  { estimatedProviderCostUsd: -0.01 },
).reason, "unpriced_managed_call");

// Real provider cost uses the restored activation allowance first.
const noCardWorkspace = { tier: "free", managedUsageCount: 3 };
const paidNoCard = evaluateManagedUsage(noCardWorkspace, {
  estimatedProviderCostUsd: 0.04,
  billingGradeCost: true,
});
assert.equal(paidNoCard.allowed, true);
assert.equal(paidNoCard.reason, null);
assert.equal(paidNoCard.billingClass, "activation");
assert.equal(paidNoCard.managedUsageLimit, 25);
assert.equal(paidNoCard.managedUsageRemaining, 21);

// A brand-new workspace receives the same lifetime activation allowance.
const brandNewNoCard = evaluateManagedUsage({ tier: "free" }, {
  estimatedProviderCostUsd: 0.01,
  billingGradeCost: true,
});
assert.equal(brandNewNoCard.allowed, true);
assert.equal(brandNewNoCard.billingClass, "activation");
assert.equal(brandNewNoCard.managedUsageRemaining, 24);

// A card alone is not an exact Stripe micro-USD entitlement. It can use the
// activation allowance, but cannot open PAYG after that allowance is spent.
const cardOnFile = {
  tier: "free",
  hasPaymentMethod: true,
  activationManagedCallCount: 25,
};
const paidWithCard = evaluateManagedUsage(cardOnFile, {
  estimatedProviderCostUsd: 0.01,
  billingGradeCost: true,
});
assert.equal(paidWithCard.allowed, false);
assert.equal(paidWithCard.reason, "payment_required");
assert.equal(paidWithCard.billingClass, "activation");

// hasCardAttached alone also cannot impersonate a PAYG entitlement.
assert.equal(
  evaluateManagedUsage({ tier: "free", hasCardAttached: true, activationManagedCallCount: 25 }, {
    estimatedProviderCostUsd: 0.01,
    billingGradeCost: true,
  }).reason,
  "payment_required",
);

// Even within activation, a numeric guess is not billing-grade.
const paidCardUnprovenCost = evaluateManagedUsage({ tier: "free", hasPaymentMethod: true }, {
  estimatedProviderCostUsd: 0.005,
  billingGradeCost: false,
});
assert.equal(paidCardUnprovenCost.allowed, false);
assert.equal(paidCardUnprovenCost.reason, "unpriced_managed_call");

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
assert.equal(
  evaluateManagedUsage(fakePayg, { estimatedProviderCostUsd: 10, billingGradeCost: true }).allowed,
  false,
);
assert.equal(
  evaluateManagedUsage(fakePayg, { estimatedProviderCostUsd: 10, billingGradeCost: true }).reason,
  "payment_required",
);

for (const invalid of [
  { ...fakePayg, stripeSubscriptionStatus: "active", hasPaymentMethod: false },
  { ...fakePayg, stripeSubscriptionStatus: "active", stripeCustomerId: undefined },
  { ...fakePayg, stripeSubscriptionStatus: "active", stripeSubscriptionId: undefined },
  { ...fakePayg, stripeSubscriptionStatus: "active", paygMeterReadyAt: undefined },
  { ...fakePayg, stripeSubscriptionStatus: "active", paygMeterPriceId: undefined },
  { ...fakePayg, stripeSubscriptionStatus: "active", paygMeterId: undefined },
  { ...fakePayg, stripeSubscriptionStatus: "active", paygMeterEventName: undefined },
  { ...fakePayg, stripeSubscriptionStatus: "active", paygMeterReadyAt: 0 },
  { ...fakePayg, stripeSubscriptionStatus: "active", paygMeterReadyAt: Number.NaN },
  { ...fakePayg, stripeSubscriptionStatus: "active", paygMeterPriceId: "   " },
  { ...fakePayg, stripeSubscriptionStatus: "active", paygMeterId: "" },
  { ...fakePayg, stripeSubscriptionStatus: "active", paygMeterEventName: "   " },
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
  evaluateManagedUsage(
    { ...payg, activationManagedCallCount: 25 },
    { estimatedProviderCostUsd: 0.005 },
  ).reason,
  "payg_cost_adapter_missing",
);
assert.equal(evaluateManagedUsage(payg).reason, "unpriced_managed_call");

// Either activation boundary is sufficient to require the exact entitlement.
for (const exhausted of [
  { tier: "free", activationManagedCallCount: 25, activationProviderCostMicros: 0 },
  { tier: "free", activationManagedCallCount: 0, activationProviderCostMicros: 1_000_000 },
  { tier: "free", activationManagedCallCount: 24, activationProviderCostMicros: 995_000 },
]) {
  const decision = evaluateManagedUsage(exhausted, {
    estimatedProviderCostUsd: 0.01,
    billingGradeCost: true,
  });
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "payment_required");
}

// A call may consume the exact final slot / final provider-cost remainder.
const finalActivationCall = evaluateManagedUsage({
  tier: "free",
  activationManagedCallCount: 24,
  activationProviderCostMicros: 990_000,
}, {
  estimatedProviderCostUsd: 0.01,
  billingGradeCost: true,
});
assert.equal(finalActivationCall.allowed, true);
assert.equal(finalActivationCall.billingClass, "activation");
assert.equal(finalActivationCall.managedUsageRemaining, 0);
assert.equal(finalActivationCall.warning?.remaining, 0);

assert.equal(activationManagedCallCount({ tier: "free", usageCount: 8 }), 8);
assert.equal(activationManagedCallCount({ tier: "free", managedUsageCount: 900 }), 25);
assert.equal(activationManagedCallCount({
  tier: "usage_based",
  managedUsageCount: 900,
  activationManagedCallCount: 7,
}), 7);

// An entitled PAYG call does not consume activation after exhaustion.
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

const founderInternal = evaluateManagedUsage(
  { tier: "founder", managedUsageCount: 999 },
  { trafficClass: "internal" },
);
assert.equal(founderInternal.allowed, true);
assert.equal(founderInternal.trafficClass, "internal");
assert.equal(founderInternal.billingClass, "internal");

const founderCustomer = evaluateManagedUsage({
  ...payg,
  tier: "founder",
  managedUsageCount: 999,
  activationManagedCallCount: 25,
}, {
  trafficClass: "customer",
  estimatedProviderCostUsd: 0.01,
  billingGradeCost: true,
});
assert.equal(founderCustomer.allowed, true);
assert.equal(founderCustomer.trafficClass, "customer");
assert.equal(founderCustomer.billingClass, "payg");

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

assert.equal(managedQuotaMessage("payment_required"), PAYMENT_REQUIRED_MESSAGE);
assert.match(managedQuotaMessage("payment_required"), /https:\/\/apiclaw\.cloud\/upgrade/);
assert.match(managedQuotaMessage("payment_required"), /retry this same call/);
assert.equal(APICLAW_UPGRADE_URL, "https://apiclaw.cloud/upgrade");

console.log("managed usage policy: activation allowance, zero-cost bypass, exact PAYG entitlement, holds, contracts, and byok all hold");
