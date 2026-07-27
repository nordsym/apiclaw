#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  activationManagedCallCount,
  customerChargeForProviderCost,
  evaluateManagedUsage,
  hasActiveContractEntitlement,
  hasActivePaygEntitlement,
} from "./managedUsagePolicy";

const activation = { tier: "free", managedUsageCount: 24, activationProviderCostMicros: 960_000 };
const call25 = evaluateManagedUsage(activation, {
  estimatedProviderCostUsd: 0.04,
  billingGradeCost: true,
});
assert.equal(call25.allowed, true);
assert.equal(call25.managedUsageRemaining, 0);

const call26 = evaluateManagedUsage(
  { ...activation, managedUsageCount: 25 },
  { estimatedProviderCostUsd: 0, billingGradeCost: true },
);
assert.equal(call26.allowed, false);
assert.equal(call26.reason, "managed_call_limit_exceeded");

const costCrossing = evaluateManagedUsage(activation, {
  estimatedProviderCostUsd: 0.040001,
  billingGradeCost: true,
});
assert.equal(costCrossing.allowed, false);
assert.equal(costCrossing.reason, "provider_cost_cap_exceeded");

const unpriced = evaluateManagedUsage({ tier: "free", managedUsageCount: 0 }, {});
assert.equal(unpriced.allowed, false);
assert.equal(unpriced.reason, "unpriced_managed_call");
assert.equal(evaluateManagedUsage(
  { tier: "free", managedUsageCount: 0 },
  { estimatedProviderCostUsd: -0.01 },
).reason, "unpriced_managed_call");

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
assert.equal(evaluateManagedUsage(fakePayg, { estimatedProviderCostUsd: 10 }).billingClass, "activation");

for (const invalid of [
  { ...fakePayg, stripeSubscriptionStatus: "active", hasPaymentMethod: false },
  { ...fakePayg, stripeSubscriptionStatus: "active", stripeSubscriptionId: undefined },
  { ...fakePayg, stripeSubscriptionStatus: "canceled" },
]) {
  assert.equal(hasActivePaygEntitlement(invalid), false);
}

const payg = { ...fakePayg, stripeSubscriptionStatus: "active" };
assert.equal(hasActivePaygEntitlement(payg), true);
const paidActivationDecision = evaluateManagedUsage(payg, {
  estimatedProviderCostUsd: 0.01,
  billingGradeCost: false,
});
assert.equal(paidActivationDecision.allowed, false);
assert.equal(paidActivationDecision.reason, "unpriced_managed_call");
assert.equal(paidActivationDecision.billingClass, "activation");

const boundedActivationDecision = evaluateManagedUsage(payg, {
  estimatedProviderCostUsd: 0.01,
  billingGradeCost: true,
});
assert.equal(boundedActivationDecision.allowed, true);
assert.equal(boundedActivationDecision.billingClass, "activation");

const paygAfterActivation = {
  ...payg,
  managedUsageCount: 5_000,
  activationManagedCallCount: 25,
};
const paidDecision = evaluateManagedUsage(paygAfterActivation, {
  estimatedProviderCostUsd: 10,
  billingGradeCost: true,
});
assert.equal(paidDecision.allowed, true);
assert.equal(paidDecision.billingClass, "payg");
assert.equal(
  evaluateManagedUsage(paygAfterActivation, { estimatedProviderCostUsd: 0.005 }).reason,
  "payg_cost_adapter_missing",
);
assert.equal(evaluateManagedUsage(paygAfterActivation).reason, "unpriced_managed_call");

assert.equal(activationManagedCallCount({ tier: "free", usageCount: 8 }), 8);
assert.equal(activationManagedCallCount({ tier: "free", managedUsageCount: 900 }), 25);
assert.equal(activationManagedCallCount({
  tier: "usage_based",
  managedUsageCount: 900,
  activationManagedCallCount: 7,
}), 7);

const paidCallDoesNotConsumeActivation = evaluateManagedUsage(paygAfterActivation, {
  estimatedProviderCostUsd: 0.01,
  billingGradeCost: true,
});
assert.equal(paidCallDoesNotConsumeActivation.activationManagedCallCount, 25);

const enterprisePayg = {
  ...paygAfterActivation,
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
assert.equal(
  hasActiveContractEntitlement({ ...verifiedContract, billingPlan: "scale" }),
  false,
  "tier and verified Stripe plan must match",
);

const managedCostHold = evaluateManagedUsage({
  ...paygAfterActivation,
  stripeSubscriptionStatus: "managed_cost_hold",
}, {
  estimatedProviderCostUsd: 0.01,
  billingGradeCost: true,
});
assert.equal(managedCostHold.allowed, false);
assert.equal(managedCostHold.reason, "managed_cost_hold");

const managedCostHoldSurvivesStripeState = evaluateManagedUsage({
  ...paygAfterActivation,
  stripeSubscriptionStatus: "active",
  managedCostHoldAt: Date.now(),
  managedCostHoldReason: "reported_cost_exceeds_authorized_reservation",
}, {
  estimatedProviderCostUsd: 0.01,
  billingGradeCost: true,
});
assert.equal(managedCostHoldSurvivesStripeState.allowed, false);
assert.equal(managedCostHoldSurvivesStripeState.reason, "managed_cost_hold");

const founder = evaluateManagedUsage({ tier: "founder", managedUsageCount: 999 }, {});
assert.equal(founder.allowed, true);
assert.equal(founder.trafficClass, "internal");
assert.equal(founder.billingClass, "internal");

assert.deepEqual(customerChargeForProviderCost(1, "activation"), { customerChargeUsd: 0, marginUsd: 0 });
assert.deepEqual(customerChargeForProviderCost(1, "internal"), { customerChargeUsd: 0, marginUsd: 0 });
assert.deepEqual(customerChargeForProviderCost(1, "payg"), { customerChargeUsd: 1.15, marginUsd: 0.1499999999999999 });

console.log("managed usage policy: lifetime allowance, cost cap, entitlement, and traffic classes hold");
