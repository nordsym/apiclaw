#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  authorizationNeedsReconciliation,
  authorizeRealizedManagedCost,
  buildStripeBillingSnapshot,
  customerChargeMicros,
  duplicateManagedRequestReason,
  managedDuplicateTerminalReceipt,
  microsToUsd,
  managedFinalizationMatchesAuthorization,
  resolveActivationProviderCostMicros,
  resolveRealizedManagedCost,
  shouldPlaceManagedCostHold,
  summarizeManagedLedger,
  usdToMicros,
} from "./managedUsage";

assert.equal(usdToMicros(1), 1_000_000);
assert.equal(usdToMicros(0.000001), 1);
assert.equal(microsToUsd(150_000), 0.15);
assert.equal(customerChargeMicros(1_000_000, "payg"), 1_150_000);
assert.equal(customerChargeMicros(1_000_000, "activation"), 0);
assert.equal(customerChargeMicros(1_000_000, "internal"), 0);
assert.throws(() => usdToMicros(Number.MAX_VALUE), /safe metering range/);

assert.deepEqual(authorizeRealizedManagedCost({
  reservedProviderCostMicros: 5_000,
  providerCostUsd: 0.005,
  costSource: "provider_response",
}), {
  reportedProviderCostMicros: 5_000,
  realizedInputMicros: 5_000,
  effectiveCostSource: "provider_response",
});
assert.equal(managedFinalizationMatchesAuthorization({
  authorizedProvider: "openrouter",
  authorizedModel: "anthropic/claude-sonnet-4-6",
  reportedProvider: "openrouter",
  reportedModel: "anthropic/claude-sonnet-4-6",
  costSource: "provider_response",
}), true);
assert.equal(managedFinalizationMatchesAuthorization({
  authorizedProvider: "openrouter",
  costSource: "token_price_table",
}), false);
assert.equal(managedFinalizationMatchesAuthorization({
  authorizedProvider: "brave_search",
  reportedProvider: "openrouter",
  costSource: "fixed_price_policy",
}), false);
assert.deepEqual(authorizeRealizedManagedCost({
  reservedProviderCostMicros: 5_000,
  providerCostUsd: 0.005001,
  costSource: "provider_response",
}), {
  reportedProviderCostMicros: 5_001,
  realizedInputMicros: 5_000,
  effectiveCostSource: "reservation",
  billingException: "reported_cost_exceeds_authorized_reservation",
});
assert.equal(resolveActivationProviderCostMicros({
  currentProviderCostMicros: 10_000,
  reservedProviderCostMicros: 5_000,
  reportedProviderCostMicros: 7_500,
  realizedProviderCostMicros: 0,
  success: true,
  costSource: "reservation",
  billingException: "reported_cost_exceeds_authorized_reservation",
}), 12_500, "activation spend replaces the reservation with the provider-reported actual");
assert.equal(resolveActivationProviderCostMicros({
  currentProviderCostMicros: 10_000,
  reservedProviderCostMicros: 5_000,
  realizedProviderCostMicros: 0,
  success: true,
  costSource: "reservation",
}), 10_000, "an unknown actual preserves the conservative reservation");
assert.equal(shouldPlaceManagedCostHold({
  trafficClass: "customer",
  billingClass: "payg",
  billingException: "reported_cost_exceeds_authorized_reservation",
}), true);
assert.equal(shouldPlaceManagedCostHold({
  trafficClass: "customer",
  billingClass: "contract",
  billingException: "actual_cost_missing_reconciliation_required",
}), true);
assert.equal(shouldPlaceManagedCostHold({
  trafficClass: "customer",
  billingClass: "activation",
  billingException: "reported_cost_exceeds_authorized_reservation",
}), true, "activation anomalies fail closed and require reconciliation before another managed call");
assert.equal(shouldPlaceManagedCostHold({
  trafficClass: "internal",
  billingClass: "internal",
  billingException: "actual_cost_missing_reconciliation_required",
}), false);
assert.deepEqual(authorizeRealizedManagedCost({
  reservedProviderCostMicros: 5_000,
  providerCostUsd: Number.MAX_VALUE,
  costSource: "provider_response",
}), {
  realizedInputMicros: 5_000,
  effectiveCostSource: "reservation",
  billingException: "reported_cost_outside_safe_range_reconciliation_required",
});

for (const [status, reason] of [
  ["authorized", "duplicate_request_authorized"],
  ["succeeded", "duplicate_request_succeeded"],
  ["failed", "duplicate_request_failed"],
] as const) {
  assert.equal(duplicateManagedRequestReason(status), reason);
}
assert.deepEqual(managedDuplicateTerminalReceipt({
  requestId: "idem_oauth_unknown",
  terminalCode: "oauth_upstream_timeout",
  executionCertainty: "uncertain",
  operatorActionRequired: true,
  retryAttempts: 1,
}), {
  requestId: "idem_oauth_unknown",
  outcome: "outcome_unknown",
  executionCertainty: "uncertain",
  attempts: 1,
  operatorActionRequired: true,
  retryable: false,
  code: "oauth_upstream_timeout",
});
assert.deepEqual(managedDuplicateTerminalReceipt({
  requestId: "idem_oauth_redacted",
  terminalCode: "secret-shaped-but-valid-looking",
  executionCertainty: "provider_terminal_failure",
  operatorActionRequired: false,
  retryAttempts: 1,
}), {
  requestId: "idem_oauth_redacted",
  outcome: "terminal",
  executionCertainty: "provider_terminal_failure",
  attempts: 1,
  operatorActionRequired: false,
  retryable: false,
});
assert.deepEqual(managedDuplicateTerminalReceipt({
  requestId: "idem_oauth_success",
  executionCertainty: "completed",
  operatorActionRequired: false,
  retryAttempts: 1,
}), {
  requestId: "idem_oauth_success",
  outcome: "succeeded",
  executionCertainty: "completed",
  attempts: 1,
  operatorActionRequired: false,
  retryable: false,
});

const now = Date.UTC(2026, 6, 18, 12);
assert.equal(authorizationNeedsReconciliation({
  status: "authorized",
  updatedAt: now - 20 * 60_000,
  authorizationLeaseExpiresAt: now - 5 * 60_000,
}, now, 15 * 60_000), true);
assert.equal(authorizationNeedsReconciliation({
  status: "authorized",
  updatedAt: now - 20 * 60_000,
  authorizationLeaseExpiresAt: now + 1,
}, now, 15 * 60_000), false);
assert.equal(authorizationNeedsReconciliation({
  status: "authorized",
  updatedAt: now - 20 * 60_000,
  authorizationLeaseExpiresAt: now - 5 * 60_000,
  reconciliationRequiredAt: now - 1,
}, now, 15 * 60_000), false);

const reservationOnly = resolveRealizedManagedCost(40_000, "payg", true, "reservation");
assert.deepEqual(reservationOnly, {
  providerCostMicros: 0,
  customerChargeMicros: 0,
  marginMicros: 0,
  billingException: "actual_cost_missing_reconciliation_required",
  stripePending: false,
});
const actualPayg = resolveRealizedManagedCost(40_000, "payg", true, "provider_response");
assert.deepEqual(actualPayg, {
  providerCostMicros: 40_000,
  customerChargeMicros: 46_000,
  marginMicros: 6_000,
  billingException: undefined,
  stripePending: true,
});

const mutableWorkspace = {
  stripeCustomerId: "cus_original",
  stripeSubscriptionId: "sub_original",
  paygMeterPriceId: "price_original",
  paygMeterId: "mtr_original",
  paygMeterEventName: "event_original",
};
const snapshot = buildStripeBillingSnapshot(mutableWorkspace, "payg");
mutableWorkspace.stripeCustomerId = "cus_changed";
assert.equal(snapshot.stripeCustomerIdSnapshot, "cus_original");
assert.throws(
  () => buildStripeBillingSnapshot({ stripeCustomerId: "cus_incomplete" }, "payg"),
  /missing immutable Stripe billing context/,
);
assert.deepEqual(buildStripeBillingSnapshot({}, "activation"), {});

const operatingCost = summarizeManagedLedger([
  {
    provider: "OpenRouter",
    status: "succeeded",
    billingClass: "activation",
    providerCostMicros: 20_000,
    customerChargeMicros: 0,
    marginMicros: 0,
    stripeStatus: "not_applicable",
  },
  {
    provider: "openrouter",
    status: "succeeded",
    billingClass: "payg",
    providerCostMicros: 100_000,
    customerChargeMicros: 115_000,
    marginMicros: 15_000,
    stripeStatus: "pending",
  },
  {
    provider: "brave_search",
    status: "failed",
    billingClass: "internal",
    providerCostMicros: 5_000,
    customerChargeMicros: 0,
    marginMicros: 0,
    billingException: "actual_cost_missing_reconciliation_required",
    stripeStatus: "not_applicable",
  },
]);
assert.equal(operatingCost.providerCostUsd, 0.125);
assert.equal(operatingCost.customerChargeUsd, 0.115);
assert.equal(operatingCost.marginUsd, 0.015);
assert.equal(operatingCost.activationProviderCostUsd, 0.02);
assert.equal(operatingCost.internalProviderCostUsd, 0.005);
assert.equal(operatingCost.stripeUnreportedUsd, 0.115);
assert.equal(operatingCost.byProvider[0]?.provider, "openrouter");
assert.equal(operatingCost.byProvider[0]?.calls, 2);
assert.equal(operatingCost.byProvider[1]?.billingExceptions, 1);

console.log("managed usage ledger: duplicates, leases, reservations, and Stripe snapshots are fail-closed");
