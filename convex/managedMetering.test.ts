#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import type Stripe from "stripe";
import {
  buildStripeMeterEvent,
  decideStripeClaim,
  isDefinitiveStripeStatus,
  isExactMicroUsdPrice,
  preserveFirstStripeClaimAt,
  readLedgerStripeSnapshot,
  readMicroUsdMeterConfig,
  stripeMeterEventIdentifier,
  verifyMicroUsdMeterReadiness,
} from "./managedMetering";

const now = Date.UTC(2026, 6, 18, 12, 0, 0);

assert.equal(stripeMeterEventIdentifier("ledger_123"), "apiclaw_managed_ledger_123");
assert.equal(stripeMeterEventIdentifier("ledger_123"), stripeMeterEventIdentifier("ledger_123"));
assert.notEqual(stripeMeterEventIdentifier("ledger_123"), stripeMeterEventIdentifier("ledger_456"));
assert.equal(preserveFirstStripeClaimAt(undefined, now), now);
assert.equal(preserveFirstStripeClaimAt(now - 60_000, now), now - 60_000);

assert.equal(decideStripeClaim({ stripeStatus: "pending" }, now), "claim");
assert.equal(decideStripeClaim({ stripeStatus: "reported" }, now), "reported");
assert.equal(decideStripeClaim({ stripeStatus: "not_applicable" }, now), "not_applicable");
assert.equal(
  decideStripeClaim({ stripeStatus: "claiming", stripeClaimedAt: now - 60_000 }, now),
  "busy",
);
assert.equal(
  decideStripeClaim({ stripeStatus: "claiming", stripeClaimedAt: now - 10 * 60_000 }, now),
  "reclaim",
);
assert.equal(
  decideStripeClaim({
    stripeStatus: "claiming",
    stripeClaimedAt: now - 22 * 60 * 60_000,
    updatedAt: now - 60_000,
  }, now),
  "busy",
);
assert.equal(
  decideStripeClaim({
    stripeStatus: "claiming",
    stripeClaimedAt: now - 22 * 60 * 60_000,
    updatedAt: now - 10 * 60_000,
  }, now),
  "reclaim",
);
assert.equal(
  decideStripeClaim({
    stripeStatus: "claiming",
    stripeClaimedAt: now - 23 * 60 * 60_000,
    updatedAt: now - 10 * 60_000,
  }, now),
  "reconciliation_required",
);
assert.equal(isDefinitiveStripeStatus(400), true);
assert.equal(isDefinitiveStripeStatus(409), false);
assert.equal(isDefinitiveStripeStatus(429), false);
assert.equal(isDefinitiveStripeStatus(500), false);
assert.equal(
  decideStripeClaim({ stripeStatus: "pending", reconciliationRequiredAt: now - 1 }, now),
  "reconciliation_required",
);

const immutableSnapshot = readLedgerStripeSnapshot({
  stripeCustomerIdSnapshot: "cus_original",
  stripeSubscriptionIdSnapshot: "sub_original",
  stripePriceIdSnapshot: "price_original",
  stripeMeterIdSnapshot: "mtr_original",
  stripeMeterEventNameSnapshot: "managed_original",
});
assert.deepEqual(immutableSnapshot, {
  customerId: "cus_original",
  subscriptionId: "sub_original",
  priceId: "price_original",
  meterId: "mtr_original",
  eventName: "managed_original",
});
assert.equal(
  readLedgerStripeSnapshot({
    stripeCustomerIdSnapshot: "cus_original",
    stripeSubscriptionIdSnapshot: "sub_original",
    stripePriceIdSnapshot: "price_original",
    stripeMeterIdSnapshot: "mtr_original",
  }),
  undefined,
);

assert.throws(
  () => readMicroUsdMeterConfig({ STRIPE_SECRET_KEY: "sk_test" }),
  /STRIPE_METER_VALUE_UNIT/,
);
assert.throws(
  () => readMicroUsdMeterConfig({
    STRIPE_SECRET_KEY: "sk_test",
    STRIPE_METER_VALUE_UNIT: "cent",
  }),
  /micro_usd/,
);
const config = readMicroUsdMeterConfig({
  STRIPE_SECRET_KEY: "sk_test",
  STRIPE_METER_VALUE_UNIT: "micro_usd",
  STRIPE_METER_EVENT_NAME_MICRO_USD: "managed_cost_micro_usd",
  STRIPE_METER_ID_MICRO_USD: "mtr_test",
  STRIPE_PRICE_ID_MICRO_USD: "price_test",
});
assert.equal(config.eventName, "managed_cost_micro_usd");

assert.equal(isExactMicroUsdPrice("0.0001"), true);
assert.equal(isExactMicroUsdPrice("0.0001000"), true);
assert.equal(isExactMicroUsdPrice("0.01"), false);
assert.equal(isExactMicroUsdPrice(null), false);

const event = buildStripeMeterEvent(
  config.eventName,
  "cus_test",
  123_457,
  "apiclaw_managed_ledger_123",
  now,
);
assert.deepEqual(event, {
  event_name: "managed_cost_micro_usd",
  payload: {
    stripe_customer_id: "cus_test",
    value: "123457",
  },
  identifier: "apiclaw_managed_ledger_123",
  timestamp: Math.floor(now / 1000),
});
assert.throws(
  () => buildStripeMeterEvent(config.eventName, "cus_test", 1.5, "id", now),
  /integer number of micro-USD/,
);
assert.throws(
  () => buildStripeMeterEvent(config.eventName, "cus_test", 0, "id", now),
  /positive integer/,
);

function fakeStripe(unitAmountDecimal: string): Stripe {
  return {
    billing: {
      meters: {
        retrieve: async () => ({
          id: "mtr_test",
          status: "active",
          event_name: "managed_cost_micro_usd",
          default_aggregation: { formula: "sum" },
          customer_mapping: { event_payload_key: "stripe_customer_id" },
          value_settings: { event_payload_key: "value" },
        }),
      },
    },
    subscriptions: {
      retrieve: async () => ({
        customer: "cus_test",
        status: "active",
        items: {
          data: [{
            price: {
              id: "price_test",
              currency: "usd",
              billing_scheme: "per_unit",
              transform_quantity: null,
              recurring: { usage_type: "metered", meter: "mtr_test" },
              unit_amount_decimal: unitAmountDecimal,
            },
          }],
        },
      }),
    },
  } as unknown as Stripe;
}

const readiness = await verifyMicroUsdMeterReadiness(fakeStripe("0.0001"), config, {
  stripeCustomerId: "cus_test",
  stripeSubscriptionId: "sub_test",
});
assert.deepEqual(readiness, {
  customerId: "cus_test",
  subscriptionId: "sub_test",
  meterId: "mtr_test",
  priceId: "price_test",
  eventName: "managed_cost_micro_usd",
  valueUnit: "micro_usd",
});
await assert.rejects(
  verifyMicroUsdMeterReadiness(fakeStripe("0.01"), config, {
    stripeCustomerId: "cus_test",
    stripeSubscriptionId: "sub_test",
  }),
  /exactly \$0\.000001 per unit/,
);

console.log("managed Stripe metering: exact micro-USD outbox and claim rules hold");
