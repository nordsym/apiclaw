import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Metered billing price ID
const METERED_PRICE_ID = process.env.STRIPE_PRICE_ID_USAGE || "price_1T5qNFRtJYK3aJTqzHLnUjKG";

// Helper to call Convex mutations
async function callConvex(path: string, args: Record<string, unknown>) {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  const result = await response.json();
  return result.value || result;
}

// Helper to call Convex queries
async function queryConvex(path: string, args: Record<string, unknown>) {
  const response = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  const result = await response.json();
  return result.value || result;
}

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error("Stripe not configured");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`[Stripe Webhook] Event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "setup_intent.succeeded": {
        const setupIntent = event.data.object as Stripe.SetupIntent;
        await handleSetupSuccess(setupIntent);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

// Handle setup mode checkout (card collection)
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const workspaceId = session.metadata?.workspaceId;
  const type = session.metadata?.type;

  console.log(`[Stripe] Checkout completed: mode=${session.mode}, type=${type}, workspace=${workspaceId}`);

  // Setup mode checkout -- the setup_intent.succeeded webhook handles the actual upgrade
  if (session.mode === "setup") {
    console.log("[Stripe] Setup checkout completed, setup_intent.succeeded will handle upgrade");
    return;
  }

  // Subscription mode checkout (if we switch to that later)
  if (session.mode === "subscription" && session.subscription) {
    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

    if (workspaceId) {
      await callConvex("billing:updateSubscription", {
        workspaceId,
        stripeSubscriptionId: subscriptionId,
        billingPlan: "usage_based",
      });
      console.log(`[Stripe] Workspace ${workspaceId} upgraded via subscription ${subscriptionId}`);
    }
  }
}

// Handle successful card setup -- create metered subscription + upgrade workspace
async function handleSetupSuccess(setupIntent: Stripe.SetupIntent) {
  if (!stripe) return;

  const customerId = typeof setupIntent.customer === "string"
    ? setupIntent.customer
    : setupIntent.customer?.id;

  if (!customerId) {
    console.log("[Stripe] No customer on setup intent");
    return;
  }

  // Find workspace by customer ID
  const workspace = await queryConvex("billing:getByStripeCustomerId", {
    stripeCustomerId: customerId,
  });

  if (!workspace || !workspace._id) {
    console.error(`[Stripe] No workspace found for customer ${customerId}`);
    return;
  }

  // Only upgrade if on free tier
  if (workspace.billingPlan && workspace.billingPlan !== "free") {
    console.log(`[Stripe] Workspace ${workspace._id} already on ${workspace.billingPlan}, skipping`);
    return;
  }

  // Set payment method as default for invoices
  const paymentMethodId = typeof setupIntent.payment_method === "string"
    ? setupIntent.payment_method
    : setupIntent.payment_method?.id;

  if (paymentMethodId) {
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  // Check if metered subscription already exists
  const existingSubs = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 10,
  });

  let subscriptionId: string | undefined;
  const hasMetered = existingSubs.data.some((sub) =>
    sub.items.data.some((item) => item.price.id === METERED_PRICE_ID)
  );

  if (!hasMetered) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: METERED_PRICE_ID }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
      });
      subscriptionId = subscription.id;
      console.log(`[Stripe] Created metered subscription ${subscription.id} for ${customerId}`);
    } catch (err) {
      console.error(`[Stripe] Failed to create metered subscription:`, err);
    }
  } else {
    subscriptionId = existingSubs.data.find((sub) =>
      sub.items.data.some((item) => item.price.id === METERED_PRICE_ID)
    )?.id;
    console.log(`[Stripe] Customer ${customerId} already has metered sub ${subscriptionId}`);
  }

  // Upgrade workspace
  await callConvex("billing:updateSubscription", {
    workspaceId: workspace._id,
    stripeSubscriptionId: subscriptionId,
    billingPlan: "usage_based",
  });

  // Store payment method info
  if (paymentMethodId) {
    try {
      const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (pm.card) {
        await callConvex("billing:updatePaymentMethodInfo", {
          workspaceId: workspace._id,
          hasPaymentMethod: true,
          paymentMethodType: pm.type,
          cardBrand: pm.card.brand,
          cardLast4: pm.card.last4,
        });
      }
    } catch { /* non-critical */ }
  }

  console.log(`[Stripe] Workspace ${workspace._id} upgraded to usage_based with sub ${subscriptionId}`);
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : (invoice.customer as Stripe.Customer)?.id;

  if (!customerId) return;
  console.log(`[Stripe] Payment failed for customer: ${customerId}`);

  await callConvex("billing:updateInvoiceStatus", {
    stripeInvoiceId: invoice.id,
    status: "failed",
  });
}

// Handle subscription cancellation
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

  console.log(`[Stripe] Subscription canceled for customer: ${customerId}`);

  const workspace = await queryConvex("billing:getByStripeCustomerId", {
    stripeCustomerId: customerId,
  });

  if (!workspace || !workspace._id) {
    console.error(`[Stripe] No workspace found for customer: ${customerId}`);
    return;
  }

  // Downgrade to free
  await callConvex("billing:updateSubscription", {
    workspaceId: workspace._id,
    billingPlan: "free",
  });

  await callConvex("billing:resetUsageOnCancellation", {
    workspaceId: workspace._id,
  });

  console.log(`[Stripe] Workspace ${workspace._id} downgraded to free`);
}

// Handle paid invoice
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : (invoice.customer as Stripe.Customer)?.id;

  if (!customerId) return;

  const workspace = await queryConvex("billing:getByStripeCustomerId", {
    stripeCustomerId: customerId,
  });

  if (!workspace || !workspace._id) return;

  let callCount = 0;
  if (invoice.lines?.data) {
    for (const line of invoice.lines.data) {
      if (line.quantity) callCount += line.quantity;
    }
  }

  await callConvex("billing:processPayment", {
    stripeInvoiceId: invoice.id,
    workspaceId: workspace._id,
    amount: invoice.amount_paid,
    periodStart: invoice.period_start * 1000,
    periodEnd: invoice.period_end * 1000,
    callCount,
    pdfUrl: invoice.invoice_pdf || undefined,
  });

  console.log(`[Stripe] Invoice ${invoice.id} processed for workspace ${workspace._id}`);
}
