import Stripe from "stripe";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import {
  readMicroUsdMeterConfig,
  verifyMicroUsdMeterReadiness,
} from "./managedMetering";
import {
  isPaidInvoiceState,
  paygSubscriptionIdempotencyKey,
  shouldApplyReconciledSubscription,
  shouldHoldPaygForFailedInvoice,
} from "./stripeWebhookEvents";

// Initialize Stripe (will use env var at runtime)
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  return new Stripe(key);
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, stripe-signature",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function safeAppBase(returnUrl: unknown): string {
  const fallback = "https://apiclaw.cloud";
  if (typeof returnUrl !== "string") return fallback;
  try {
    const url = new URL(returnUrl);
    if (url.protocol !== "https:" || !["apiclaw.cloud", "www.apiclaw.cloud"].includes(url.hostname)) {
      return fallback;
    }
    return url.origin;
  } catch {
    return fallback;
  }
}

/**
 * Create Stripe Checkout Session
 * POST /api/billing/checkout
 */
export const createCheckoutSession = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { token, returnUrl, mode = "setup" } = body;

    if (!token) {
      return jsonResponse({ error: "session token required" }, 401);
    }
    if (mode !== "setup") {
      return jsonResponse({ error: "Only secure payment-method setup is supported" }, 400);
    }

    const verified = await ctx.runQuery(api.workspaces.verifySession, { sessionToken: token });
    if (!verified?.workspaceId) return jsonResponse({ error: "Invalid session" }, 401);
    const workspaceId = verified.workspaceId;

    const stripe = getStripe();

    // Get workspace
    const workspace = await ctx.runQuery(internal.billing.getWorkspace, {
      id: workspaceId,
    });

    if (!workspace) {
      return jsonResponse({ error: "Workspace not found" }, 404);
    }

    let customerId = workspace.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          email: workspace.email,
          metadata: {
            workspaceId,
            source: "apiclaw",
          },
        },
        { idempotencyKey: `apiclaw_customer_${workspaceId}` },
      );
      customerId = customer.id;

      // Link customer to workspace
      await ctx.runMutation(internal.billing.linkCustomer, {
        workspaceId: workspaceId,
        stripeCustomerId: customerId,
      });
    }

    const baseUrl = safeAppBase(returnUrl);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "setup",
      payment_method_types: ["card"],
      success_url: `${baseUrl}/workspace?billing=success`,
      cancel_url: `${baseUrl}/workspace?billing=cancel`,
      metadata: { workspaceId },
    });

    return jsonResponse({ checkoutUrl: session.url, sessionId: session.id });
  } catch (e: any) {
    console.error("Checkout error:", e);
    return jsonResponse({ error: e.message || "Failed to create checkout" }, 500);
  }
});

/**
 * Create Stripe Billing Portal Session
 * POST /api/billing/portal
 */
export const createPortalSession = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { token, returnUrl } = body;

    if (!token) {
      return jsonResponse({ error: "session token required" }, 401);
    }

    const verified = await ctx.runQuery(api.workspaces.verifySession, { sessionToken: token });
    if (!verified?.workspaceId) return jsonResponse({ error: "Invalid session" }, 401);
    const workspaceId = verified.workspaceId;

    const stripe = getStripe();

    // Get workspace
    const workspace = await ctx.runQuery(internal.billing.getWorkspace, {
      id: workspaceId,
    });

    if (!workspace) {
      return jsonResponse({ error: "Workspace not found" }, 404);
    }

    if (!workspace.stripeCustomerId) {
      return jsonResponse(
        { error: "No billing account. Add a payment method first." },
        400
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: `${safeAppBase(returnUrl)}/workspace?tab=settings&portal=success`,
    });

    return jsonResponse({
      portalUrl: session.url,
    });
  } catch (e: any) {
    console.error("Portal error:", e);
    return jsonResponse({ error: e.message || "Failed to create portal session" }, 500);
  }
});

/**
 * Stripe Webhook Handler
 * POST /api/webhooks/stripe
 */
export const handleStripeWebhook = httpAction(async (ctx, request) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return jsonResponse({ error: "Webhook not configured" }, 500);
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return jsonResponse({ error: "Missing stripe-signature header" }, 400);
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    // Convex edge runtime requires the async variant — SubtleCrypto cannot
    // be used synchronously here.
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return jsonResponse({ error: `Webhook Error: ${err.message}` }, 400);
  }

  const claim = await ctx.runMutation((internal as any).stripeWebhookEvents.claim, {
    eventId: event.id,
    eventType: event.type,
    receivedAt: Date.now(),
  });
  if (!claim.claimed) {
    if (claim.reason === "already_processing") {
      // A 2xx would tell Stripe to discard the concurrent delivery even if
      // the current lease holder crashes. A retryable response preserves it.
      return jsonResponse(
        { received: false, retry: true, reason: claim.reason },
        503,
      );
    }
    return jsonResponse({ received: true, duplicate: true, reason: claim.reason });
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(ctx, session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(ctx, subscription, stripe);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(ctx, subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(ctx, invoice, stripe);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(ctx, invoice, stripe);
        break;
      }

      case "setup_intent.succeeded": {
        const setupIntent = event.data.object as Stripe.SetupIntent;
        await handleSetupSuccess(ctx, setupIntent);
        break;
      }

      case "payment_method.attached": {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        await handlePaymentMethodAttached(ctx, paymentMethod, stripe);
        break;
      }

      case "payment_method.detached": {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        const previousCustomer = (event.data.previous_attributes as { customer?: unknown } | undefined)?.customer;
        await handlePaymentMethodDetached(
          ctx,
          paymentMethod,
          typeof previousCustomer === "string" ? previousCustomer : undefined,
          stripe,
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    const completion = await ctx.runMutation((internal as any).stripeWebhookEvents.succeed, {
      eventId: event.id,
      attempt: claim.attempt,
      processingStartedAt: claim.processingStartedAt,
      completedAt: Date.now(),
    });
    if (completion.completed === false) {
      return jsonResponse({ received: false, retry: true, reason: completion.reason }, 503);
    }
    return jsonResponse({ received: true, type: event.type });
  } catch (e: any) {
    console.error(`Error handling ${event.type}:`, e);
    await ctx.runMutation((internal as any).stripeWebhookEvents.fail, {
      eventId: event.id,
      attempt: claim.attempt,
      processingStartedAt: claim.processingStartedAt,
      failedAt: Date.now(),
      error: e?.message || "unknown webhook error",
    });
    return jsonResponse({ received: false, error: e.message }, 500);
  }
});

// ============================================
// Webhook Event Handlers
// ============================================

async function handleCheckoutComplete(
  ctx: any,
  session: Stripe.Checkout.Session
) {
  const workspaceId = session.metadata?.workspaceId;
  if (!workspaceId) {
    console.log("No workspaceId in checkout session metadata");
    return;
  }

  // If subscription mode, the subscription webhook will handle it
  if (session.mode === "subscription" && session.subscription) {
    console.log("Subscription checkout completed, waiting for subscription webhook");
    return;
  }

  // Setup completion only means the browser flow ended. The setup_intent and
  // subscription webhooks establish the actual billing entitlement.
  if (session.mode === "setup") {
    console.log(`Workspace ${workspaceId} completed setup checkout; awaiting verified billing state`);
  }
}

// Map Stripe product IDs to APIClaw billing plans
const PRODUCT_PLAN_MAP: Record<string, string> = {
  "prod_UEPEBJUtrXDTLS": "pro",       // APIClaw Pro ($79/mo)
  "prod_UEPFCcnUqfIaIn": "scale",     // APIClaw Scale ($249/mo)
};

async function handleSubscriptionUpdate(
  ctx: any,
  deliveredSubscription: Stripe.Subscription,
  stripe: Stripe,
) {
  // Webhook deliveries can arrive out of order. Always reconcile against the
  // current Stripe object so an old `updated` payload cannot reactivate a
  // subscription that has since been canceled.
  const subscription = await stripe.subscriptions.retrieve(deliveredSubscription.id);
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const deliveredCustomerId =
    typeof deliveredSubscription.customer === "string"
      ? deliveredSubscription.customer
      : deliveredSubscription.customer.id;
  if (customerId !== deliveredCustomerId) {
    throw new Error("Stripe subscription customer changed during webhook reconciliation");
  }

  // Get workspace by customer ID
  const workspace = await ctx.runQuery(internal.billing.getByStripeCustomerId, {
    stripeCustomerId: customerId,
  });

  if (!workspace) {
    console.log(`No workspace found for customer ${customerId}`);
    return;
  }

  const billable = subscription.status === "active" || subscription.status === "trialing";
  const meterConfig = readMicroUsdMeterConfig(process.env);
  const hasExactUsagePrice = subscription.items.data.some(
    (item) => item.price.id === meterConfig.priceId,
  );
  let configuredContractPlan: string | undefined;
  for (const item of subscription.items.data) {
    const productId = typeof item.price.product === "string"
      ? item.price.product
      : item.price.product.id;
    if (PRODUCT_PLAN_MAP[productId]) {
      configuredContractPlan = PRODUCT_PLAN_MAP[productId];
      break;
    }
  }
  if (!hasExactUsagePrice && !configuredContractPlan) {
    console.log(`Ignoring subscription ${subscription.id}: no APIClaw billing price`);
    return;
  }
  if (!shouldApplyReconciledSubscription(
    workspace.stripeSubscriptionId,
    workspace.stripeSubscriptionStatus,
    subscription.id,
    billable,
  )) {
    console.log(`Ignoring stale subscription state for ${subscription.id}`);
    return;
  }
  const plan = hasExactUsagePrice ? "usage_based" : configuredContractPlan!;

  let meterReadyAt: number | undefined;
  let meterPriceId: string | undefined;
  let meterId: string | undefined;
  let meterEventName: string | undefined;
  if (plan === "usage_based" && billable) {
    const readiness = await verifyMicroUsdMeterReadiness(stripe, meterConfig, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
    });
    meterReadyAt = Date.now();
    meterPriceId = readiness.priceId;
    meterId = readiness.meterId;
    meterEventName = readiness.eventName;
  }

  const update = await ctx.runMutation(internal.billing.updateSubscription, {
    workspaceId: workspace._id,
    stripeSubscriptionId: subscription.id,
    billingPlan: plan,
    stripeSubscriptionStatus: subscription.status,
    paygMeterReadyAt: meterReadyAt,
    paygMeterPriceId: meterPriceId,
    paygMeterId: meterId,
    paygMeterEventName: meterEventName,
    expectedCurrentSubscriptionId: workspace.stripeSubscriptionId,
  });
  if (!update.applied) {
    console.log(`Subscription ${subscription.id} update lost a newer workspace update`);
    return;
  }

  console.log(`Subscription ${subscription.id} updated for workspace ${workspace._id} -> plan: ${plan}`);
}

async function handleSubscriptionCanceled(
  ctx: any,
  subscription: Stripe.Subscription
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const workspace = await ctx.runQuery(internal.billing.getByStripeCustomerId, {
    stripeCustomerId: customerId,
  });

  if (!workspace) {
    console.log(`No workspace found for customer ${customerId}`);
    return;
  }
  if (workspace.stripeSubscriptionId !== subscription.id) {
    console.log(`Ignoring stale deletion for subscription ${subscription.id}`);
    return;
  }

  // End Stripe billing while preserving protected workspace tiers and lifetime usage.
  const update = await ctx.runMutation(internal.billing.updateSubscription, {
    workspaceId: workspace._id,
    stripeSubscriptionId: undefined,
    billingPlan: "free",
    stripeSubscriptionStatus: subscription.status,
    expectedCurrentSubscriptionId: subscription.id,
  });
  if (!update.applied) {
    console.log(`Subscription ${subscription.id} deletion lost a newer workspace update`);
    return;
  }

  // Legacy hook now preserves lifetime usage and only records the transition.
  await ctx.runMutation(internal.billing.resetUsageOnCancellation, {
    workspaceId: workspace._id,
  });

  console.log(`Workspace ${workspace._id} subscription canceled`);
}

function invoiceCustomerId(invoice: Stripe.Invoice): string | undefined {
  return typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id;
}

async function retrieveCurrentInvoice(
  stripe: Stripe,
  deliveredInvoice: Stripe.Invoice,
): Promise<Stripe.Invoice> {
  const invoice = await stripe.invoices.retrieve(deliveredInvoice.id);
  const deliveredCustomerId = invoiceCustomerId(deliveredInvoice);
  const currentCustomerId = invoiceCustomerId(invoice);
  if (deliveredCustomerId && deliveredCustomerId !== currentCustomerId) {
    throw new Error("Stripe invoice customer changed during webhook reconciliation");
  }
  return invoice;
}

async function reconcilePaidPaygEntitlement(
  ctx: any,
  stripe: Stripe,
  workspace: any,
  invoice: Stripe.Invoice,
  billingContext: { subscriptionId?: string; priceIds: string[] },
): Promise<void> {
  const configuredPriceId = process.env.STRIPE_PRICE_ID_MICRO_USD?.trim();
  if (
    !configuredPriceId ||
    !workspace.stripeSubscriptionId ||
    !billingContext.subscriptionId ||
    workspace.stripeSubscriptionId !== billingContext.subscriptionId ||
    !billingContext.priceIds.includes(configuredPriceId)
  ) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(billingContext.subscriptionId);
  const subscriptionCustomerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
  if (subscriptionCustomerId !== invoiceCustomerId(invoice)) {
    throw new Error("Paid invoice subscription customer does not match the workspace customer");
  }
  if (subscription.status !== "active" && subscription.status !== "trialing") {
    console.log(`Paid invoice ${invoice.id} awaits an active subscription reconciliation`);
    return;
  }

  const meterConfig = readMicroUsdMeterConfig(process.env);
  const readiness = await verifyMicroUsdMeterReadiness(stripe, meterConfig, {
    stripeCustomerId: subscriptionCustomerId,
    stripeSubscriptionId: subscription.id,
  });
  await ctx.runMutation(internal.billing.updateSubscription, {
    workspaceId: workspace._id,
    stripeSubscriptionId: subscription.id,
    billingPlan: "usage_based",
    stripeSubscriptionStatus: subscription.status,
    paygMeterReadyAt: Date.now(),
    paygMeterPriceId: readiness.priceId,
    paygMeterId: readiness.meterId,
    paygMeterEventName: readiness.eventName,
    expectedCurrentSubscriptionId: workspace.stripeSubscriptionId,
    recoverPaymentFailedHold: true,
  });
}

async function processCurrentPaidInvoice(
  ctx: any,
  invoice: Stripe.Invoice,
  stripe: Stripe,
) {
  const customerId = invoiceCustomerId(invoice);

  if (!customerId) return;

  const workspace = await ctx.runQuery(internal.billing.getByStripeCustomerId, {
    stripeCustomerId: customerId,
  });

  if (!workspace) {
    console.log(`No workspace found for customer ${customerId}`);
    return;
  }

  const billingContext = invoiceBillingContext(invoice);
  const configuredPriceId = process.env.STRIPE_PRICE_ID_MICRO_USD?.trim();
  let callCount = 0;
  if (
    configuredPriceId &&
    billingContext.subscriptionId &&
    billingContext.priceIds.includes(configuredPriceId)
  ) {
    callCount = await ctx.runQuery(internal.billing.getInvoiceCallCount, {
      workspaceId: workspace._id,
      periodStart: invoice.period_start * 1000,
      periodEnd: invoice.period_end * 1000,
      subscriptionId: billingContext.subscriptionId,
      priceId: configuredPriceId,
    });
  }

  const payment = await ctx.runMutation(internal.billing.processPayment, {
    stripeInvoiceId: invoice.id,
    workspaceId: workspace._id,
    amount: invoice.amount_paid,
    periodStart: invoice.period_start * 1000,
    periodEnd: invoice.period_end * 1000,
    callCount,
    pdfUrl: invoice.invoice_pdf || undefined,
  });
  await reconcilePaidPaygEntitlement(ctx, stripe, workspace, invoice, billingContext);
  if (payment.alreadyProcessed) {
    console.log(`Invoice ${invoice.id} replay already processed`);
    return;
  }

  // Send branded invoice email via Resend. Falls back gracefully if recipient
  // missing -- invoice still processed in DB.
  const recipientEmail = invoice.customer_email || workspace.email;
  if (recipientEmail) {
    try {
      const lineItems = (invoice.lines?.data || []).map((line) => ({
        description: line.description || "API usage",
        amountCents: line.amount,
      }));

      await ctx.scheduler.runAfter(0, internal.email.sendInvoicePaidEmail, {
        email: recipientEmail,
        amountPaidCents: invoice.amount_paid,
        currency: invoice.currency || "usd",
        invoiceNumber: invoice.number || undefined,
        periodStartMs: invoice.period_start * 1000,
        periodEndMs: invoice.period_end * 1000,
        hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
        invoicePdfUrl: invoice.invoice_pdf || undefined,
        lineItems,
      });
    } catch (e: any) {
      console.error(`Failed to schedule invoice email for ${invoice.id}:`, e.message);
    }
  }

  console.log(`Invoice ${invoice.id} processed for workspace ${workspace._id}`);
}

async function handleInvoicePaid(
  ctx: any,
  deliveredInvoice: Stripe.Invoice,
  stripe: Stripe,
) {
  const invoice = await retrieveCurrentInvoice(stripe, deliveredInvoice);
  if (!isPaidInvoiceState(invoice)) {
    console.log(`Ignored stale paid event for invoice ${invoice.id} in state ${invoice.status}`);
    return;
  }
  await processCurrentPaidInvoice(ctx, invoice, stripe);
}

function stripeObjectId(value: string | { id: string } | null | undefined): string | undefined {
  if (typeof value === "string") return value;
  return value?.id;
}

function invoiceBillingContext(invoice: Stripe.Invoice): {
  subscriptionId?: string;
  priceIds: string[];
} {
  const subscriptionId = stripeObjectId(
    invoice.parent?.subscription_details?.subscription,
  );
  const priceIds = (invoice.lines?.data || []).flatMap((line) => {
    const price = line.pricing?.price_details?.price;
    const id = stripeObjectId(price);
    return id ? [id] : [];
  });
  return { subscriptionId, priceIds };
}

async function handlePaymentFailed(
  ctx: any,
  deliveredInvoice: Stripe.Invoice,
  stripe: Stripe,
) {
  const invoice = await retrieveCurrentInvoice(stripe, deliveredInvoice);
  if (isPaidInvoiceState(invoice)) {
    await processCurrentPaidInvoice(ctx, invoice, stripe);
    console.log(`Ignored stale payment failure for paid invoice ${invoice.id}`);
    return;
  }

  const customerId = invoiceCustomerId(invoice);

  if (!customerId) return;

  const workspace = await ctx.runQuery(internal.billing.getByStripeCustomerId, {
    stripeCustomerId: customerId,
  });

  const meterConfig = readMicroUsdMeterConfig(process.env);
  const failedBilling = invoiceBillingContext(invoice);
  if (workspace && shouldHoldPaygForFailedInvoice(
    workspace.stripeSubscriptionId,
    failedBilling.subscriptionId,
    failedBilling.priceIds,
    meterConfig.priceId,
    isPaidInvoiceState(invoice),
  )) {
    await ctx.runMutation(internal.billing.putPaygOnHold, {
      workspaceId: workspace._id,
      expectedSubscriptionId: workspace.stripeSubscriptionId,
      status: "payment_failed",
    });
  } else {
    console.log(`Ignored payment failure for non-current or non-APIClaw invoice ${invoice.id}`);
  }

  // Update invoice status to failed
  await ctx.runMutation(internal.billing.updateInvoiceStatus, {
    stripeInvoiceId: invoice.id,
    status: "failed",
  });

  console.log(`Payment failed for invoice ${invoice.id}`);
}

async function handleSetupSuccess(
  ctx: any,
  setupIntent: Stripe.SetupIntent
) {
  const customerId =
    typeof setupIntent.customer === "string"
      ? setupIntent.customer
      : setupIntent.customer?.id;
  if (!customerId) return;

  const workspace = await ctx.runQuery(internal.billing.getByStripeCustomerId, {
    stripeCustomerId: customerId,
  });

  if (!workspace) {
    console.log(`No workspace found for customer ${customerId}`);
    return;
  }

  const paymentMethodId =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;
  if (!paymentMethodId) {
    throw new Error("Succeeded SetupIntent has no payment method; PAYG remains inactive");
  }

  const activation = await ctx.runMutation(internal.billing.claimPaygActivation, {
    workspaceId: workspace._id,
    activationId: setupIntent.id,
  });
  if (!activation.claimed) {
    if (activation.reason === "busy") {
      throw new Error("Another PAYG activation is already in progress");
    }
    console.log(`Workspace ${workspace._id} is not eligible for free-to-PAYG activation`);
    return;
  }

  const stripe = getStripe();
  let subscriptionCreateAttempted = false;
  let createdSubscriptionId: string | undefined;
  try {
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const meterConfig = readMicroUsdMeterConfig(process.env);
    const METERED_PRICE_ID = meterConfig.priceId;
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
    });

    let subscriptionId: string | undefined;
    let subscriptionStatus: Stripe.Subscription.Status | undefined;
    const existingSubscription = existingSubs.data.find((sub) =>
      ["active", "trialing"].includes(sub.status) &&
      sub.items.data.some((item) => item.price.id === METERED_PRICE_ID)
    );

    if (!existingSubscription) {
      subscriptionCreateAttempted = true;
      try {
        const subscription = await stripe.subscriptions.create(
          {
            customer: customerId,
            items: [{ price: METERED_PRICE_ID }],
            payment_behavior: "error_if_incomplete",
            payment_settings: {
              save_default_payment_method: "on_subscription",
            },
          },
          {
            idempotencyKey: paygSubscriptionIdempotencyKey(
              String(workspace._id),
              METERED_PRICE_ID,
              setupIntent.id,
            ),
          },
        );
        subscriptionId = subscription.id;
        createdSubscriptionId = subscription.id;
        subscriptionStatus = subscription.status;
        console.log(`Created metered subscription ${subscription.id} for customer ${customerId}`);
      } catch (subError: any) {
        console.error(`Failed to create metered subscription for ${customerId}:`, subError.message);
        throw new Error("Metered subscription was not created; PAYG remains inactive");
      }
    } else {
      subscriptionId = existingSubscription.id;
      subscriptionStatus = existingSubscription.status;
      console.log(`Customer ${customerId} already has metered subscription ${subscriptionId}`);
    }

    if (!subscriptionId || !subscriptionStatus || !["active", "trialing"].includes(subscriptionStatus)) {
      throw new Error(`Metered subscription is not active (status=${subscriptionStatus || "missing"}); PAYG remains inactive`);
    }
    const readiness = await verifyMicroUsdMeterReadiness(stripe, meterConfig, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    });

    const completion = await ctx.runMutation(internal.billing.completePaygActivation, {
      workspaceId: workspace._id,
      activationId: setupIntent.id,
      stripeSubscriptionId: subscriptionId,
      stripeSubscriptionStatus: subscriptionStatus,
      paygMeterReadyAt: Date.now(),
      paygMeterPriceId: readiness.priceId,
      paygMeterId: readiness.meterId,
      paygMeterEventName: readiness.eventName,
    });
    if (!completion.applied) {
      if (createdSubscriptionId) {
        await stripe.subscriptions.cancel(createdSubscriptionId);
        subscriptionCreateAttempted = false;
      }
      throw new Error("PAYG activation lost its workspace claim");
    }

    // Optional card display enrichment cannot revoke an established entitlement.
    try {
      const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (pm.card) {
        await ctx.runMutation(internal.billing.updatePaymentMethodInfo, {
          workspaceId: workspace._id,
          hasPaymentMethod: true,
          paymentMethodType: pm.type,
          cardBrand: pm.card.brand,
          cardLast4: pm.card.last4,
        });
      }
    } catch { /* non-critical */ }

    console.log(`Workspace ${workspace._id} upgraded to usage_based with subscription ${subscriptionId}`);
  } catch (error) {
    // If no subscription creation was attempted, no ambiguous Stripe side
    // effect exists and a fresh activation may safely claim the workspace.
    // Otherwise retain the claim so this SetupIntent retries with the same
    // Stripe idempotency key and cannot race a second subscription creation.
    if (!subscriptionCreateAttempted) {
      await ctx.runMutation(internal.billing.releasePaygActivation, {
        workspaceId: workspace._id,
        activationId: setupIntent.id,
      });
    }
    throw error;
  }
}

async function handlePaymentMethodAttached(
  ctx: any,
  paymentMethod: Stripe.PaymentMethod,
  stripe: Stripe,
) {
  // Payment method attached to customer
  const customerId =
    typeof paymentMethod.customer === "string"
      ? paymentMethod.customer
      : paymentMethod.customer?.id;

  if (!customerId) {
    console.log("Payment method attached but no customer ID");
    return;
  }

  const workspace = await ctx.runQuery(internal.billing.getByStripeCustomerId, {
    stripeCustomerId: customerId,
  });

  if (!workspace) {
    console.log(`No workspace found for customer ${customerId}`);
    return;
  }

  // Persist the former customer relationship on the PaymentMethod itself so
  // payment_method.detached can still resolve the workspace after Stripe
  // clears `payment_method.customer` in the event object.
  await stripe.paymentMethods.update(paymentMethod.id, {
    metadata: {
      apiclaw_workspace_id: String(workspace._id),
      apiclaw_customer_id: customerId,
    },
  });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethod.id },
  });

  // Sync payment method info
  await ctx.runMutation(internal.billing.updatePaymentMethodInfo, {
    workspaceId: workspace._id,
    hasPaymentMethod: true,
    paymentMethodType: paymentMethod.type,
    cardBrand: paymentMethod.card?.brand,
    cardLast4: paymentMethod.card?.last4,
  });

  // A card added through the Billing Portal can recover a local
  // payment_method_missing hold. Restore PAYG only after re-reading an active
  // Stripe subscription and re-verifying the exact micro-USD meter contract.
  if (
    workspace.billingPlan === "usage_based" &&
    workspace.stripeSubscriptionId &&
    workspace.stripeSubscriptionStatus === "payment_method_missing"
  ) {
    const subscription = await stripe.subscriptions.retrieve(workspace.stripeSubscriptionId);
    if (subscription.status === "active" || subscription.status === "trialing") {
      const readiness = await verifyMicroUsdMeterReadiness(
        stripe,
        readMicroUsdMeterConfig(process.env),
        {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
        },
      );
      await ctx.runMutation(internal.billing.updateSubscription, {
        workspaceId: workspace._id,
        stripeSubscriptionId: subscription.id,
        billingPlan: "usage_based",
        stripeSubscriptionStatus: subscription.status,
        paygMeterReadyAt: Date.now(),
        paygMeterPriceId: readiness.priceId,
        paygMeterId: readiness.meterId,
        paygMeterEventName: readiness.eventName,
        expectedCurrentSubscriptionId: workspace.stripeSubscriptionId,
      });
    }
  }

  console.log(`Payment method attached for workspace ${workspace._id}`);
}

async function handlePaymentMethodDetached(
  ctx: any,
  paymentMethod: Stripe.PaymentMethod,
  previousCustomerId: string | undefined,
  stripe: Stripe,
) {
  const customerId = previousCustomerId || paymentMethod.metadata?.apiclaw_customer_id;
  if (!customerId) {
    // Without a trustworthy customer mapping we cannot mutate an arbitrary
    // workspace. Throw so Stripe retries while preserving the evidence.
    throw new Error(`Detached payment method ${paymentMethod.id} has no customer mapping`);
  }

  const workspace = await ctx.runQuery(internal.billing.getByStripeCustomerId, {
    stripeCustomerId: customerId,
  });
  if (!workspace) {
    console.log(`No workspace found for detached payment method customer ${customerId}`);
    return;
  }

  const remaining = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
    limit: 100,
  });
  const replacement = remaining.data[0];
  if (replacement) {
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: replacement.id },
    });
    await ctx.runMutation(internal.billing.updatePaymentMethodInfo, {
      workspaceId: workspace._id,
      hasPaymentMethod: true,
      paymentMethodType: replacement.type,
      cardBrand: replacement.card?.brand,
      cardLast4: replacement.card?.last4,
    });
    console.log(`Payment method ${paymentMethod.id} detached; another card remains`);
    return;
  }

  await ctx.runMutation(internal.billing.updatePaymentMethodInfo, {
    workspaceId: workspace._id,
    hasPaymentMethod: false,
  });
  if (workspace.stripeSubscriptionId) {
    await ctx.runMutation(internal.billing.putPaygOnHold, {
      workspaceId: workspace._id,
      expectedSubscriptionId: workspace.stripeSubscriptionId,
      status: "payment_method_missing",
    });
  }
  console.log(`Payment method ${paymentMethod.id} detached; PAYG is on hold`);
}

// ============================================
// OPTIONS handlers for CORS
// ============================================

export const checkoutOptions = httpAction(async () => {
  return new Response(null, { headers: corsHeaders });
});

export const portalOptions = httpAction(async () => {
  return new Response(null, { headers: corsHeaders });
});

export const webhookOptions = httpAction(async () => {
  return new Response(null, { headers: corsHeaders });
});
