#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";
import {
  createCheckoutSession,
  createPortalSession,
  repairSavedCardPayg,
} from "./stripeActions";
import { assertStripeBillingEnvironment } from "./managedMetering";

// Exercise the real HTTP handlers while replacing only Stripe's outbound calls.
const stripe = new Stripe("sk_test_synthetic");
const checkoutPrototype = Object.getPrototypeOf(stripe.checkout.sessions);
const portalPrototype = Object.getPrototypeOf(stripe.billingPortal.sessions);
const meterPrototype = Object.getPrototypeOf(stripe.billing.meters);
const pricePrototype = Object.getPrototypeOf(stripe.prices);
const customerPrototype = Object.getPrototypeOf(stripe.customers);
const paymentMethodPrototype = Object.getPrototypeOf(stripe.paymentMethods);
const subscriptionPrototype = Object.getPrototypeOf(stripe.subscriptions);
const originalCheckout = checkoutPrototype.create;
const originalCheckoutList = checkoutPrototype.list;
const originalPortal = portalPrototype.create;
const originalMeterRetrieve = meterPrototype.retrieve;
const originalPriceRetrieve = pricePrototype.retrieve;
const originalCustomerRetrieve = customerPrototype.retrieve;
const originalCustomerUpdate = customerPrototype.update;
const originalPaymentMethodRetrieve = paymentMethodPrototype.retrieve;
const originalSubscriptionList = subscriptionPrototype.list;
const originalSubscriptionCreate = subscriptionPrototype.create;
const originalSubscriptionRetrieve = subscriptionPrototype.retrieve;
const originalSubscriptionCancel = subscriptionPrototype.cancel;
const originalKey = process.env.STRIPE_SECRET_KEY;
const originalBillingEnvironment = process.env.APICLAW_BILLING_ENVIRONMENT;
const originalMeterUnit = process.env.STRIPE_METER_VALUE_UNIT;
const originalMeterEvent = process.env.STRIPE_METER_EVENT_NAME_MICRO_USD;
const originalMeterId = process.env.STRIPE_METER_ID_MICRO_USD;
const originalPriceId = process.env.STRIPE_PRICE_ID_MICRO_USD;
const originalReturnOrigin = process.env.APICLAW_BILLING_RETURN_ORIGIN;
const checkoutCalls: Array<{
  params: Stripe.Checkout.SessionCreateParams;
  options?: Stripe.RequestOptions;
}> = [];
const portalCalls: Stripe.BillingPortal.SessionCreateParams[] = [];
let repairedSubscriptionCreates = 0;
let checkoutSessions: Array<Record<string, any>> = [];
let listedSubscriptions: Array<Record<string, any>> = [];
let canceledSubscriptions: string[] = [];

function request(body: unknown) {
  return new Request("https://api.apiclaw.cloud/api/billing/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const context = {
  runMutation: async () => ({ workspaceId: "workspace_synthetic" }),
  runQuery: async () => ({
    stripeCustomerId: "cus_synthetic",
    tier: "free",
    billingPlan: "free",
  }),
};

try {
  process.env.STRIPE_SECRET_KEY = "sk_test_synthetic";
  process.env.APICLAW_BILLING_ENVIRONMENT = "test";
  process.env.STRIPE_METER_VALUE_UNIT = "micro_usd";
  process.env.STRIPE_METER_EVENT_NAME_MICRO_USD = "managed_cost_micro_usd";
  process.env.STRIPE_METER_ID_MICRO_USD = "mtr_synthetic";
  process.env.STRIPE_PRICE_ID_MICRO_USD = "price_synthetic";
  process.env.APICLAW_BILLING_RETURN_ORIGIN = "https://preview.apiclaw.example";
  assert.equal(assertStripeBillingEnvironment(process.env), "test");
  assert.throws(
    () => assertStripeBillingEnvironment({
      APICLAW_BILLING_ENVIRONMENT: "test",
      STRIPE_SECRET_KEY: "sk_live_wrong_mode",
    }),
    /do not match/,
  );
  checkoutPrototype.list = async () => ({ data: checkoutSessions });
  checkoutPrototype.create = async (
    params: Stripe.Checkout.SessionCreateParams,
    options?: Stripe.RequestOptions,
  ) => {
    checkoutCalls.push({ params, options });
    const session = {
      id: `cs_synthetic_${checkoutCalls.length}`,
      url: `https://checkout.stripe.com/synthetic_${checkoutCalls.length}`,
      mode: "subscription",
      status: "open",
      metadata: params.metadata,
      created: checkoutCalls.length,
    };
    checkoutSessions.push(session);
    return session;
  };
  portalPrototype.create = async (params: Stripe.BillingPortal.SessionCreateParams) => {
    portalCalls.push(params);
    return { url: "https://billing.stripe.com/synthetic" };
  };
  meterPrototype.retrieve = async () => ({
    id: "mtr_synthetic",
    status: "active",
    event_name: "managed_cost_micro_usd",
    default_aggregation: { formula: "sum" },
    customer_mapping: { event_payload_key: "stripe_customer_id" },
    value_settings: { event_payload_key: "value" },
  });
  pricePrototype.retrieve = async () => ({
    id: "price_synthetic",
    active: true,
    currency: "usd",
    billing_scheme: "per_unit",
    transform_quantity: null,
    recurring: { usage_type: "metered", meter: "mtr_synthetic" },
    unit_amount_decimal: "0.0001",
  });
  customerPrototype.retrieve = async () => ({
    id: "cus_synthetic",
    deleted: false,
    invoice_settings: { default_payment_method: "pm_synthetic" },
  });
  customerPrototype.update = async () => ({ id: "cus_synthetic" });
  paymentMethodPrototype.retrieve = async () => ({
    id: "pm_synthetic",
    customer: "cus_synthetic",
    type: "card",
    card: { brand: "visa", last4: "4242" },
  });
  const meteredSubscription = {
    id: "sub_synthetic",
    customer: "cus_synthetic",
    status: "active",
    items: {
      data: [{
        price: {
          id: "price_synthetic",
          active: true,
          currency: "usd",
          billing_scheme: "per_unit",
          transform_quantity: null,
          recurring: { usage_type: "metered", meter: "mtr_synthetic" },
          unit_amount_decimal: "0.0001",
        },
      }],
    },
  };
  subscriptionPrototype.list = async () => ({ data: listedSubscriptions });
  subscriptionPrototype.create = async () => {
    repairedSubscriptionCreates += 1;
    return meteredSubscription;
  };
  subscriptionPrototype.retrieve = async () => meteredSubscription;
  subscriptionPrototype.cancel = async (subscriptionId: string) => {
    canceledSubscriptions.push(subscriptionId);
    return { ...meteredSubscription, id: subscriptionId, status: "canceled" };
  };

  for (const handler of [createCheckoutSession, createPortalSession]) {
    for (const returnUrl of ["https://apiclaw.cloud/workspace", "https://untrusted.example/"]) {
      const response = await (handler as any)._handler(context, request({ token: "synthetic", returnUrl }));
      assert.equal(response.status, 200);
    }
    const noSession = await (handler as any)._handler(context, request({}));
    assert.equal(noSession.status, 401);
    const rejectedSession = await (handler as any)._handler({
      runMutation: async () => null,
      runQuery: async () => { throw new Error("Invalid session must not read workspace"); },
    }, request({ token: "expired" }));
    assert.equal(rejectedSession.status, 401);
  }

  assert.equal(checkoutCalls.length, 1, "an open Checkout session must be reused");
  assert.equal(portalCalls.length, 2, "rejected requests must not create Stripe sessions");
  for (const { params, options } of checkoutCalls) {
    assert.equal(params.customer, "cus_synthetic");
    assert.equal(params.mode, "subscription");
    assert.deepEqual(params.line_items, [{ price: "price_synthetic" }]);
    assert.equal(params.payment_method_collection, "always");
    assert.deepEqual(params.subscription_data?.metadata, { workspaceId: "workspace_synthetic" });
    assert.deepEqual(params.metadata, {
      workspaceId: "workspace_synthetic",
      priceId: "price_synthetic",
    });
    assert.equal(
      options?.idempotencyKey,
      "apiclaw_checkout:workspace_synthetic:price_synthetic:initial",
    );
    assert.equal(params.locale, "en");
    assert.equal(params.success_url, "https://apiclaw.cloud/workspace?tab=billing&billing=success");
    assert.equal(params.cancel_url, "https://apiclaw.cloud/workspace?tab=billing&billing=cancel");
  }
  for (const params of portalCalls) {
    assert.equal(params.customer, "cus_synthetic");
    assert.equal(params.locale, "en");
    assert.equal(params.return_url, "https://apiclaw.cloud/workspace?tab=billing&portal=success");
  }
  checkoutSessions = [];
  const previewResponse = await (createCheckoutSession as any)._handler(
    context,
    request({ token: "synthetic", returnUrl: "https://preview.apiclaw.example/workspace" }),
  );
  assert.equal(previewResponse.status, 200);
  assert.equal(
    checkoutCalls.at(-1)?.params.success_url,
    "https://preview.apiclaw.example/workspace?tab=billing&billing=success",
  );

  checkoutSessions = [{
    id: "cs_completed",
    url: null,
    mode: "subscription",
    status: "complete",
    metadata: { workspaceId: "workspace_synthetic", priceId: "price_synthetic" },
    subscription: "sub_completed",
    created: 3,
  }];
  const completedSessionResponse = await (createCheckoutSession as any)._handler(
    context,
    request({ token: "synthetic" }),
  );
  assert.equal(completedSessionResponse.status, 409);

  listedSubscriptions = [{
    ...meteredSubscription,
    id: "sub_completed",
    status: "canceled",
  }];
  const reactivationResponse = await (createCheckoutSession as any)._handler(
    context,
    request({ token: "synthetic" }),
  );
  assert.equal(reactivationResponse.status, 200, "a canceled subscription may open a new Checkout");
  assert.equal(
    checkoutCalls.at(-1)?.options?.idempotencyKey,
    "apiclaw_checkout:workspace_synthetic:price_synthetic:cs_completed",
  );
  checkoutSessions = [];
  listedSubscriptions = [];

  listedSubscriptions = [meteredSubscription];
  const existingSubscriptionResponse = await (createCheckoutSession as any)._handler(
    context,
    request({ token: "synthetic" }),
  );
  assert.equal(existingSubscriptionResponse.status, 409);
  listedSubscriptions = [];

  const ineligibleResponse = await (createCheckoutSession as any)._handler({
    ...context,
    runQuery: async () => ({
      stripeCustomerId: "cus_synthetic",
      tier: "pro",
      billingPlan: "pro",
    }),
  }, request({ token: "synthetic" }));
  assert.equal(ineligibleResponse.status, 409);
  const checkoutCountBeforeModeMismatch = checkoutCalls.length;
  process.env.STRIPE_SECRET_KEY = "sk_live_wrong_mode";
  const unsafePreview = await (createCheckoutSession as any)._handler(
    context,
    request({ token: "synthetic", returnUrl: "https://preview.apiclaw.example" }),
  );
  assert.equal(unsafePreview.status, 503);
  assert.equal(checkoutCalls.length, checkoutCountBeforeModeMismatch);
  process.env.STRIPE_SECRET_KEY = "sk_test_synthetic";

  const repairContext = (workspace: Record<string, unknown>) => ({
    runQuery: async () => workspace,
    runMutation: async (_reference: unknown, args: Record<string, unknown>) => {
      if (args.activationId && args.stripeSubscriptionId) return { applied: true };
      if (args.activationId) return { claimed: true };
      return { applied: true, success: true };
    },
  });
  const repaired = await (repairSavedCardPayg as any)._handler(repairContext({
    _id: "workspace_synthetic",
    stripeCustomerId: "cus_synthetic",
    tier: "free",
    billingPlan: "free",
    usageLimit: 25,
  }), {
    workspaceId: "workspace_synthetic",
  });
  assert.equal(repaired.repaired, true);
  assert.equal(repairedSubscriptionCreates, 1);

  const replayed = await (repairSavedCardPayg as any)._handler(repairContext({
    _id: "workspace_synthetic",
    stripeCustomerId: "cus_synthetic",
    stripeSubscriptionId: "sub_synthetic",
    stripeSubscriptionStatus: "active",
    tier: "founder",
    billingPlan: "usage_based",
    usageLimit: 999_999_999,
  }), {
    workspaceId: "workspace_synthetic",
  });
  assert.equal(replayed.alreadyRepaired, true);
  assert.equal(repairedSubscriptionCreates, 1, "repair replay must not create another subscription");

  await assert.rejects(
    (repairSavedCardPayg as any)._handler({
      runQuery: async () => ({
        _id: "workspace_synthetic",
        stripeCustomerId: "cus_synthetic",
        stripeSubscriptionId: "sub_synthetic",
        stripeSubscriptionStatus: "active",
        tier: "founder",
        billingPlan: "usage_based",
        usageLimit: 999_999_999,
      }),
      runMutation: async () => ({ applied: false, reason: "subscription_mismatch" }),
    }, { workspaceId: "workspace_synthetic" }),
    /repair refresh was not applied/,
  );
  assert.deepEqual(canceledSubscriptions, []);

  const stripeActionsSource = readFileSync(
    fileURLToPath(new URL("./stripeActions.ts", import.meta.url)),
    "utf8",
  );
  const repairStart = stripeActionsSource.indexOf("export const repairSavedCardPayg");
  const repairEnd = stripeActionsSource.indexOf("// ============================================", repairStart);
  const repairSource = stripeActionsSource.slice(repairStart, repairEnd);
  assert.match(repairSource, /export const repairSavedCardPayg = internalAction\(/);
  assert.doesNotMatch(repairSource, /internalSecret|APICLAW_INTERNAL_SECRET/);
} finally {
  checkoutPrototype.create = originalCheckout;
  checkoutPrototype.list = originalCheckoutList;
  portalPrototype.create = originalPortal;
  meterPrototype.retrieve = originalMeterRetrieve;
  pricePrototype.retrieve = originalPriceRetrieve;
  customerPrototype.retrieve = originalCustomerRetrieve;
  customerPrototype.update = originalCustomerUpdate;
  paymentMethodPrototype.retrieve = originalPaymentMethodRetrieve;
  subscriptionPrototype.list = originalSubscriptionList;
  subscriptionPrototype.create = originalSubscriptionCreate;
  subscriptionPrototype.retrieve = originalSubscriptionRetrieve;
  subscriptionPrototype.cancel = originalSubscriptionCancel;
  if (originalKey === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = originalKey;
  const restore = (name: string, value: string | undefined) => {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  };
  restore("APICLAW_BILLING_ENVIRONMENT", originalBillingEnvironment);
  restore("STRIPE_METER_VALUE_UNIT", originalMeterUnit);
  restore("STRIPE_METER_EVENT_NAME_MICRO_USD", originalMeterEvent);
  restore("STRIPE_METER_ID_MICRO_USD", originalMeterId);
  restore("STRIPE_PRICE_ID_MICRO_USD", originalPriceId);
  restore("APICLAW_BILLING_RETURN_ORIGIN", originalReturnOrigin);
}

console.log("Stripe Checkout creates only the verified metered subscription, uses test keys in preview, and returns safely to Billing");
