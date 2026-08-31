#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  BILLING_RETURN_CARD_TOAST,
  BILLING_RETURN_PENDING_TOAST,
  billingCardRequired,
  billingStatusLabel,
  decideBillingReturnPoll,
  paymentMethodEmptyCopy,
  planCardCta,
} from "./billing-plan";

const founder = { tier: "founder", paygActive: false, usageLimit: -1 };
const partner = { tier: "partner", paygActive: false, usageLimit: -1 };
const free = { tier: "free", paygActive: false, usageLimit: 25 };
const payg = { tier: "usage_based", paygActive: true, usageLimit: -1 };
const paygPaused = {
  tier: "usage_based",
  paygActive: false,
  stripeCustomerId: "cus_paused",
  usageLimit: 25,
};

assert.match(billingStatusLabel(founder), /founder/i);
assert.match(billingStatusLabel(founder), /unlimited/i);
assert.match(billingStatusLabel(partner), /partner/i);
assert.match(billingStatusLabel(partner), /unlimited/i);
assert.equal(billingStatusLabel(free), "Free");
assert.doesNotMatch(billingStatusLabel(founder), /free/i);
assert.doesNotMatch(billingStatusLabel(partner), /free/i);

assert.equal(billingCardRequired(founder), false);
assert.equal(billingCardRequired(partner), false);
assert.equal(billingCardRequired(free), true);

assert.deepEqual(planCardCta("free", founder), { kind: "none" });
assert.deepEqual(planCardCta("free", partner), { kind: "none" });
assert.notEqual(planCardCta("usage_based", founder).kind, "talk");
assert.deepEqual(planCardCta("usage_based", founder), {
  kind: "checkout",
  label: "Add payment method",
  note: "Founder already unlimited; this is the customer card flow",
});
assert.deepEqual(planCardCta("usage_based", partner), {
  kind: "checkout",
  label: "Add payment method",
  note: "Partner already unlimited; this is the customer card flow",
});

assert.deepEqual(planCardCta("free", free), { kind: "current", label: "Current plan" });
assert.deepEqual(planCardCta("usage_based", free), {
  kind: "checkout",
  label: "Add payment method",
});

assert.deepEqual(planCardCta("usage_based", payg), { kind: "current", label: "Current plan" });
assert.deepEqual(planCardCta("usage_based", paygPaused), {
  kind: "portal",
  label: "Manage billing",
});

const founderEmpty = paymentMethodEmptyCopy(founder);
assert.match(founderEmpty.title, /no card on file/i);
assert.match(founderEmpty.body, /not needed/i);
assert.equal(founderEmpty.showCheckout, false);

const freeEmpty = paymentMethodEmptyCopy(free);
assert.match(freeEmpty.body, /Add a card to call Paid APIs/);
assert.equal(freeEmpty.showCheckout, true);

const billingSource = readFileSync(
  fileURLToPath(new URL("../app/workspace/views/Billing.tsx", import.meta.url)),
  "utf8",
);
assert.match(billingSource, /billingStatusLabel/);
assert.match(billingSource, /planCardCta/);
assert.match(billingSource, /<CheckoutButton/);
assert.match(billingSource, /cardCta\.note/, "founder/partner dogfood note must render on the Paid APIs card");
assert.doesNotMatch(
  billingSource,
  />Talk to us</,
  "founder/partner must not land on Talk to us as a plan-card CTA",
);

const checkoutSource = readFileSync(
  fileURLToPath(new URL("../components/CheckoutButton.tsx", import.meta.url)),
  "utf8",
);
assert.match(
  checkoutSource,
  /fetch\("\/api\/billing\/checkout"/,
  "CheckoutButton must keep the existing Stripe checkout fetch",
);

assert.deepEqual(
  decideBillingReturnPoll({ hasPaymentMethod: true, paygActive: false }),
  { action: "success", toast: BILLING_RETURN_CARD_TOAST },
  "a stored card is success even while PAYG is still pending",
);
assert.deepEqual(
  decideBillingReturnPoll({ hasCardAttached: true, paygActive: false }),
  { action: "success", toast: BILLING_RETURN_CARD_TOAST },
);
assert.equal(decideBillingReturnPoll({ paygActive: false }).action, "wait");
assert.match(BILLING_RETURN_PENDING_TOAST, /Card saved\. Paid APIs unlock as soon as Stripe confirms/);
assert.doesNotMatch(BILLING_RETURN_PENDING_TOAST, /remain off/i);

const workspacePage = readFileSync(
  fileURLToPath(new URL("../app/workspace/page.tsx", import.meta.url)),
  "utf8",
);
assert.match(workspacePage, /decideBillingReturnPoll/);
assert.match(workspacePage, /BILLING_RETURN_PENDING_TOAST/);
assert.doesNotMatch(
  workspacePage,
  /billing-ready calls remain off/,
  "timeout must not tell a free user paid calls stay off when the gate uses the card",
);

const stripeActions = readFileSync(
  fileURLToPath(new URL("../../../convex/stripeActions.ts", import.meta.url)),
  "utf8",
);
assert.match(
  stripeActions,
  /success_url: `\$\{baseUrl\}\/workspace\?tab=billing&billing=success`/,
  "setup Checkout must land on the Billing tab",
);
assert.match(
  stripeActions,
  /cancel_url: `\$\{baseUrl\}\/workspace\?tab=billing&billing=cancel`/,
);
assert.match(
  stripeActions,
  /return_url: `\$\{safeAppBase\(returnUrl\)\}\/workspace\?tab=billing&portal=success`/,
  "portal must return to Billing, not Settings",
);
assert.doesNotMatch(stripeActions, /tab=settings&portal=success/);

const dashboardSource = readFileSync(
  fileURLToPath(new URL("../../../convex/workspaces.ts", import.meta.url)),
  "utf8",
);
const dashboardReturn = dashboardSource.slice(
  dashboardSource.indexOf("export const getWorkspaceDashboard"),
  dashboardSource.indexOf("stats:"),
);
assert.match(
  dashboardReturn,
  /hasPaymentMethod: workspace\.hasPaymentMethod === true \|\| workspace\.hasCardAttached === true/,
  "dashboard must expose the same stored-card check the execute gate uses",
);

console.log("billing plan CTAs: founder unlimited honest, free checkout reachable, return poll uses card");
