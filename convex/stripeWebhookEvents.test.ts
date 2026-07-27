import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  canActivatePaygWorkspace,
  countInvoicePaygCalls,
  decidePaygActivationClaim,
  decideWebhookClaim,
  isPaidInvoiceState,
  ownsWebhookLease,
  paygSubscriptionIdempotencyKey,
  resolveProtectedSubscriptionStatus,
  resolveTierAfterBillingTransition,
  shouldApplyReconciledSubscription,
  shouldHoldPaygForFailedInvoice,
} from "./stripeWebhookEvents";

const now = 1_000_000;
assert.equal(decideWebhookClaim(null, now), "claim");
assert.equal(
  decideWebhookClaim({ status: "succeeded", processingStartedAt: now - 60_000 }, now),
  "already_succeeded",
);
assert.equal(
  decideWebhookClaim({ status: "processing", processingStartedAt: now - 60_000 }, now),
  "already_processing",
);
assert.equal(
  decideWebhookClaim({ status: "processing", processingStartedAt: now - 6 * 60_000 }, now),
  "claim",
);
assert.equal(
  decideWebhookClaim({ status: "failed", processingStartedAt: now - 1 }, now),
  "claim",
);

const currentLease = {
  status: "processing" as const,
  attempts: 2,
  processingStartedAt: now,
};
assert.equal(ownsWebhookLease(currentLease, 2, now), true);
assert.equal(ownsWebhookLease(currentLease, 1, now), false);
assert.equal(ownsWebhookLease(currentLease, 2, now - 1), false);
assert.equal(
  ownsWebhookLease({ ...currentLease, status: "succeeded" }, 2, now),
  false,
);

assert.equal(shouldApplyReconciledSubscription(undefined, undefined, "sub_new", true), true);
assert.equal(shouldApplyReconciledSubscription("sub_same", "active", "sub_same", true), true);
assert.equal(shouldApplyReconciledSubscription("sub_new", "active", "sub_old", true), false);
assert.equal(shouldApplyReconciledSubscription(undefined, "canceled", "sub_old", true), false);
assert.equal(shouldApplyReconciledSubscription(undefined, "canceled", "sub_old", false), false);
assert.equal(shouldApplyReconciledSubscription("sub_old", "past_due", "sub_old", false), true);

assert.equal(canActivatePaygWorkspace({ tier: "free" }), true);
assert.equal(canActivatePaygWorkspace({ tier: "free", billingPlan: "free" }), true);
assert.equal(canActivatePaygWorkspace({ tier: "founder" }), false);
assert.equal(canActivatePaygWorkspace({ tier: "partner" }), false);
assert.equal(canActivatePaygWorkspace({ tier: "pro", billingPlan: "pro" }), false);
assert.equal(canActivatePaygWorkspace({ tier: "usage_based", billingPlan: "usage_based" }), false);

assert.equal(
  decidePaygActivationClaim({ tier: "free" }, "seti_first", now),
  "claim",
);
assert.equal(
  decidePaygActivationClaim({
    tier: "free",
    billingPlan: "free",
    paygActivationId: "seti_first",
    paygActivationStartedAt: now - 1_000,
  }, "seti_first", now),
  "resume",
);
assert.equal(
  decidePaygActivationClaim({
    tier: "free",
    billingPlan: "free",
    paygActivationId: "seti_first",
    paygActivationStartedAt: now - 1_000,
  }, "seti_second", now),
  "busy",
);
assert.equal(
  decidePaygActivationClaim({
    tier: "free",
    billingPlan: "free",
    paygActivationId: "seti_first",
    paygActivationStartedAt: now - 31 * 60_000,
  }, "seti_second", now),
  "claim",
);
assert.equal(
  decidePaygActivationClaim({ tier: "usage_based", billingPlan: "usage_based" }, "seti_new", now),
  "not_eligible",
);

assert.equal(isPaidInvoiceState({ status: "paid", paid: false }), true);
assert.equal(isPaidInvoiceState({ status: "open", paid: true }), true);
assert.equal(isPaidInvoiceState({ status: "open", paid: false }), false);

assert.equal(
  resolveProtectedSubscriptionStatus("payment_failed", "active", false),
  "payment_failed",
  "an active subscription update cannot clear an unpaid-invoice hold",
);
assert.equal(
  resolveProtectedSubscriptionStatus("payment_failed", "past_due", false),
  "payment_failed",
  "intermediate Stripe states cannot erase the sticky hold",
);
assert.equal(
  resolveProtectedSubscriptionStatus("payment_failed", "active", true),
  "active",
  "the verified paid-invoice path may recover PAYG",
);
assert.equal(
  resolveProtectedSubscriptionStatus("managed_cost_hold", "active", true),
  "managed_cost_hold",
  "paying an invoice cannot clear a cost-integrity hold",
);
assert.equal(
  resolveProtectedSubscriptionStatus("managed_cost_hold", "canceled", false),
  "managed_cost_hold",
  "subscription cancellation cannot clear a provider-cost integrity hold",
);
assert.equal(resolveProtectedSubscriptionStatus("payment_failed", "canceled", false), "canceled");

const stripeActionsSource = readFileSync(
  fileURLToPath(new URL("./stripeActions.ts", import.meta.url)),
  "utf8",
);
const paidInvoiceRecovery = stripeActionsSource.slice(
  stripeActionsSource.indexOf("async function reconcilePaidPaygEntitlement"),
  stripeActionsSource.indexOf("async function processCurrentPaidInvoice"),
);
const paymentMethodAttached = stripeActionsSource.slice(
  stripeActionsSource.indexOf("async function handlePaymentMethodAttached"),
  stripeActionsSource.indexOf("async function handlePaymentMethodDetached"),
);
assert.match(
  paidInvoiceRecovery,
  /recoverPaymentFailedHold: true/,
  "only the verified paid-invoice reconciliation opts into hold recovery",
);
assert.match(
  paymentMethodAttached,
  /workspace\.stripeSubscriptionStatus === "payment_method_missing"/,
  "attaching a card cannot clear a payment_failed hold",
);
assert.doesNotMatch(paymentMethodAttached, /recoverPaymentFailedHold: true/);

assert.deepEqual(
  resolveTierAfterBillingTransition("founder", 999_999_999, "free", 25),
  { tier: "founder", usageLimit: 999_999_999 },
);
assert.deepEqual(
  resolveTierAfterBillingTransition("partner", -1, "usage_based", 999_999_999),
  { tier: "partner", usageLimit: -1 },
);
assert.deepEqual(
  resolveTierAfterBillingTransition("enterprise", -1, "free", 25),
  { tier: "enterprise", usageLimit: -1 },
);
assert.deepEqual(
  resolveTierAfterBillingTransition("free", 25, "usage_based", 999_999_999),
  { tier: "usage_based", usageLimit: 999_999_999 },
);

assert.equal(
  paygSubscriptionIdempotencyKey("workspace_1", "price_1", "seti_attempt_1"),
  paygSubscriptionIdempotencyKey("workspace_1", "price_1", "seti_attempt_1"),
);
assert.notEqual(
  paygSubscriptionIdempotencyKey("workspace_1", "price_1", "seti_attempt_1"),
  paygSubscriptionIdempotencyKey("workspace_1", "price_1", "seti_attempt_2"),
);

assert.equal(
  shouldHoldPaygForFailedInvoice("sub_current", "sub_current", ["price_micro"], "price_micro"),
  true,
);
assert.equal(
  shouldHoldPaygForFailedInvoice(
    "sub_current",
    "sub_current",
    ["price_micro"],
    "price_micro",
    true,
  ),
  false,
);
assert.equal(
  shouldHoldPaygForFailedInvoice("sub_current", "sub_stale", ["price_micro"], "price_micro"),
  false,
);

const periodStart = Date.UTC(2026, 6, 1);
const periodEnd = Date.UTC(2026, 7, 1);
assert.equal(
  countInvoicePaygCalls([
    {
      status: "succeeded",
      billingClass: "payg",
      createdAt: periodStart + 1_000,
      completedAt: periodStart + 2_000,
      stripeSubscriptionIdSnapshot: "sub_current",
      stripePriceIdSnapshot: "price_micro",
    },
    {
      status: "succeeded",
      billingClass: "activation",
      createdAt: periodStart + 3_000,
      stripeSubscriptionIdSnapshot: "sub_current",
      stripePriceIdSnapshot: "price_micro",
    },
    {
      status: "succeeded",
      billingClass: "payg",
      createdAt: periodStart + 4_000,
      stripeSubscriptionIdSnapshot: "sub_stale",
      stripePriceIdSnapshot: "price_micro",
    },
    {
      status: "failed",
      billingClass: "payg",
      createdAt: periodStart + 5_000,
      stripeSubscriptionIdSnapshot: "sub_current",
      stripePriceIdSnapshot: "price_micro",
    },
    {
      status: "succeeded",
      billingClass: "payg",
      createdAt: periodStart + 6_000,
      stripeSubscriptionIdSnapshot: "sub_current",
      stripePriceIdSnapshot: "price_other",
    },
    {
      status: "succeeded",
      billingClass: "payg",
      createdAt: periodEnd,
      stripeSubscriptionIdSnapshot: "sub_current",
      stripePriceIdSnapshot: "price_micro",
    },
  ], {
    periodStart,
    periodEnd,
    subscriptionId: "sub_current",
    priceId: "price_micro",
  }),
  1,
);
assert.equal(
  shouldHoldPaygForFailedInvoice("sub_current", "sub_current", ["price_other"], "price_micro"),
  false,
);

console.log("Stripe webhook ledger: duplicate, concurrent, lease-owner, and replay decisions hold");
