import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

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
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`[Stripe Webhook] Event: ${event.type}`);

    // Handle events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
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

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

// Handle successful checkout
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const workspaceId = session.metadata?.workspaceId;
  const type = session.metadata?.type;

  console.log(`[Stripe] Checkout completed: ${session.id}, workspace: ${workspaceId}, type: ${type}`);

  if (!workspaceId) {
    // Try to find workspace by customer ID
    if (session.customer) {
      const workspace = await queryConvex("billing:getWorkspaceByStripeCustomer", {
        stripeCustomerId: session.customer as string,
      });
      
      if (workspace) {
        await callConvex("billing:upgradeWorkspace", {
          workspaceId: workspace._id,
          tier: "pro",
        });
        console.log(`[Stripe] Upgraded workspace ${workspace._id} to pro`);
        return;
      }
    }
    console.error("[Stripe] No workspace found for checkout session");
    return;
  }

  // Upgrade workspace to pro
  const result = await callConvex("billing:upgradeWorkspace", {
    workspaceId,
    tier: "pro",
    stripeSubscriptionId: session.subscription as string,
  });

  console.log(`[Stripe] Upgrade result:`, result);
}

// Handle failed payment
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  
  console.log(`[Stripe] Payment failed for customer: ${customerId}`);

  // Find workspace by customer ID
  const workspace = await queryConvex("billing:getWorkspaceByStripeCustomer", {
    stripeCustomerId: customerId,
  });

  if (!workspace) {
    console.error("[Stripe] No workspace found for customer:", customerId);
    return;
  }

  // Suspend workspace
  await callConvex("billing:suspendWorkspace", {
    workspaceId: workspace._id,
    reason: "payment_failed",
  });

  console.log(`[Stripe] Suspended workspace ${workspace._id} due to payment failure`);
}

// Handle subscription cancellation
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  console.log(`[Stripe] Subscription canceled for customer: ${customerId}`);

  // Find workspace by customer ID
  const workspace = await queryConvex("billing:getWorkspaceByStripeCustomer", {
    stripeCustomerId: customerId,
  });

  if (!workspace) {
    console.error("[Stripe] No workspace found for customer:", customerId);
    return;
  }

  // Downgrade to free tier
  await callConvex("billing:upgradeWorkspace", {
    workspaceId: workspace._id,
    tier: "free",
  });

  console.log(`[Stripe] Downgraded workspace ${workspace._id} to free tier`);
}
