#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import Stripe from "stripe";
import { createCheckoutSession, createPortalSession } from "./stripeActions";

// Exercise the real HTTP handlers while replacing only Stripe's outbound calls.
const stripe = new Stripe("sk_test_synthetic");
const checkoutPrototype = Object.getPrototypeOf(stripe.checkout.sessions);
const portalPrototype = Object.getPrototypeOf(stripe.billingPortal.sessions);
const originalCheckout = checkoutPrototype.create;
const originalPortal = portalPrototype.create;
const originalKey = process.env.STRIPE_SECRET_KEY;
const checkoutCalls: Stripe.Checkout.SessionCreateParams[] = [];
const portalCalls: Stripe.BillingPortal.SessionCreateParams[] = [];

function request(body: unknown) {
  return new Request("https://api.apiclaw.cloud/api/billing/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const context = {
  runMutation: async () => ({ workspaceId: "workspace_synthetic" }),
  runQuery: async () => ({ stripeCustomerId: "cus_synthetic" }),
};

try {
  process.env.STRIPE_SECRET_KEY = "sk_test_synthetic";
  checkoutPrototype.create = async (params: Stripe.Checkout.SessionCreateParams) => {
    checkoutCalls.push(params);
    return { id: "cs_synthetic", url: "https://checkout.stripe.com/synthetic" };
  };
  portalPrototype.create = async (params: Stripe.BillingPortal.SessionCreateParams) => {
    portalCalls.push(params);
    return { url: "https://billing.stripe.com/synthetic" };
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

  assert.equal(checkoutCalls.length, 2, "rejected requests must not create Stripe sessions");
  assert.equal(portalCalls.length, 2, "rejected requests must not create Stripe sessions");
  for (const params of checkoutCalls) {
    assert.equal(params.customer, "cus_synthetic");
    assert.equal(params.mode, "setup");
    assert.deepEqual(params.payment_method_types, ["card"]);
    assert.equal(params.locale, "en");
    assert.equal(params.success_url, "https://apiclaw.cloud/workspace?tab=billing&billing=success");
    assert.equal(params.cancel_url, "https://apiclaw.cloud/workspace?tab=billing&billing=cancel");
  }
  for (const params of portalCalls) {
    assert.equal(params.customer, "cus_synthetic");
    assert.equal(params.locale, "en");
    assert.equal(params.return_url, "https://apiclaw.cloud/workspace?tab=billing&portal=success");
  }
} finally {
  checkoutPrototype.create = originalCheckout;
  portalPrototype.create = originalPortal;
  if (originalKey === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = originalKey;
}

console.log("Stripe sessions use English, return to Billing, reject untrusted return origins, and require authentication");
