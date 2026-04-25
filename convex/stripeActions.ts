import Stripe from "stripe";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

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

/**
 * Create Stripe Checkout Session
 * POST /api/billing/checkout
 */
export const createCheckoutSession = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();
    const { workspaceId, returnUrl, mode = "setup" } = body;

    if (!workspaceId) {
      return jsonResponse({ error: "workspaceId required" }, 400);
    }

    const stripe = getStripe();

    // Get workspace
    const workspace = await ctx.runQuery(api.billing.getWorkspace, {
      id: workspaceId,
    });

    if (!workspace) {
      return jsonResponse({ error: "Workspace not found" }, 404);
    }

    let customerId = workspace.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: workspace.email,
        metadata: {
          workspaceId: workspaceId,
          source: "apiclaw",
        },
      });
      customerId = customer.id;

      // Link customer to workspace
      await ctx.runMutation(api.billing.linkCustomer, {
        workspaceId: workspaceId,
        stripeCustomerId: customerId,
      });
    }

    const baseUrl = returnUrl || "https://apiclaw.cloud";

    // Create checkout session
    if (mode === "setup") {
      // Setup mode - just save card for future billing
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "setup",
        payment_method_types: ["card"],
        success_url: `${baseUrl}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${baseUrl}/billing?canceled=true`,
        metadata: {
          workspaceId: workspaceId,
        },
      });

      return jsonResponse({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } else if (mode === "subscription") {
      // Create metered subscription
      const priceId = process.env.STRIPE_PRICE_ID_USAGE;
      if (!priceId) {
        return jsonResponse({ error: "Usage price not configured" }, 500);
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [
          {
            price: priceId,
          },
        ],
        success_url: `${baseUrl}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${baseUrl}/billing?canceled=true`,
        metadata: {
          workspaceId: workspaceId,
        },
      });

      return jsonResponse({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } else {
      return jsonResponse({ error: "Invalid mode. Use 'setup' or 'subscription'" }, 400);
    }
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
    const { workspaceId, returnUrl } = body;

    if (!workspaceId) {
      return jsonResponse({ error: "workspaceId required" }, 400);
    }

    const stripe = getStripe();

    // Get workspace
    const workspace = await ctx.runQuery(api.billing.getWorkspace, {
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
      return_url: returnUrl || "https://apiclaw.com/workspace?tab=settings&portal=success",
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
        await handleSubscriptionUpdate(ctx, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(ctx, subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(ctx, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(ctx, invoice);
        break;
      }

      case "setup_intent.succeeded": {
        const setupIntent = event.data.object as Stripe.SetupIntent;
        await handleSetupSuccess(ctx, setupIntent);
        break;
      }

      case "payment_method.attached": {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        await handlePaymentMethodAttached(ctx, paymentMethod);
        break;
      }

      case "payment_method.detached": {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        await handlePaymentMethodDetached(ctx, paymentMethod);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return jsonResponse({ received: true, type: event.type });
  } catch (e: any) {
    console.error(`Error handling ${event.type}:`, e);
    // Return 200 to prevent Stripe retries for business logic errors
    return jsonResponse({ received: true, error: e.message });
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

  // If setup mode, upgrade to usage-based billing
  if (session.mode === "setup") {
    await ctx.runMutation(api.billing.updateSubscription, {
      workspaceId: workspaceId,
      billingPlan: "usage_based",
    });
    console.log(`Workspace ${workspaceId} upgraded to usage-based billing`);
  }
}

// Map Stripe product IDs to APIClaw billing plans
const PRODUCT_PLAN_MAP: Record<string, string> = {
  "prod_UEPEBJUtrXDTLS": "pro",       // APIClaw Pro ($79/mo)
  "prod_UEPFCcnUqfIaIn": "scale",     // APIClaw Scale ($249/mo)
};

async function handleSubscriptionUpdate(
  ctx: any,
  subscription: Stripe.Subscription
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  // Get workspace by customer ID
  const workspace = await ctx.runQuery(api.billing.getByStripeCustomerId, {
    stripeCustomerId: customerId,
  });

  if (!workspace) {
    console.log(`No workspace found for customer ${customerId}`);
    return;
  }

  // Determine plan from subscription product
  let plan = "free";
  if (subscription.status === "active") {
    // Check each subscription item's product to determine the plan
    for (const item of subscription.items.data) {
      const productId = typeof item.price.product === "string"
        ? item.price.product
        : item.price.product.id;
      if (PRODUCT_PLAN_MAP[productId]) {
        plan = PRODUCT_PLAN_MAP[productId];
        break;
      }
    }
    // Fallback: if no known product matched but subscription is active
    if (plan === "free") {
      plan = "usage_based";
    }
  }

  await ctx.runMutation(api.billing.updateSubscription, {
    workspaceId: workspace._id,
    stripeSubscriptionId: subscription.id,
    billingPlan: plan,
  });

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

  const workspace = await ctx.runQuery(api.billing.getByStripeCustomerId, {
    stripeCustomerId: customerId,
  });

  if (!workspace) {
    console.log(`No workspace found for customer ${customerId}`);
    return;
  }

  // Downgrade to free and reset usage
  await ctx.runMutation(api.billing.updateSubscription, {
    workspaceId: workspace._id,
    stripeSubscriptionId: undefined,
    billingPlan: "free",
  });

  // Reset usage count to 0 for clean slate on free tier
  await ctx.runMutation(api.billing.resetUsageOnCancellation, {
    workspaceId: workspace._id,
  });

  console.log(`Workspace ${workspace._id} downgraded to free (subscription canceled)`);
}

async function handleInvoicePaid(ctx: any, invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  const workspace = await ctx.runQuery(api.billing.getByStripeCustomerId, {
    stripeCustomerId: customerId,
  });

  if (!workspace) {
    console.log(`No workspace found for customer ${customerId}`);
    return;
  }

  // Calculate call count from line items (for metered billing)
  let callCount = 0;
  if (invoice.lines?.data) {
    for (const line of invoice.lines.data) {
      if (line.quantity) {
        callCount += line.quantity;
      }
    }
  }

  await ctx.runMutation(api.billing.processPayment, {
    stripeInvoiceId: invoice.id,
    workspaceId: workspace._id,
    amount: invoice.amount_paid,
    periodStart: invoice.period_start * 1000,
    periodEnd: invoice.period_end * 1000,
    callCount,
    pdfUrl: invoice.invoice_pdf || undefined,
  });

  // Send branded invoice email via Resend. Falls back gracefully if recipient
  // missing -- invoice still processed in DB.
  const recipientEmail = invoice.customer_email || workspace.email;
  if (recipientEmail) {
    try {
      const lineItems = (invoice.lines?.data || []).map((line) => ({
        description: line.description || "API usage",
        amountCents: line.amount,
      }));

      await ctx.scheduler.runAfter(0, api.email.sendInvoicePaidEmail, {
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

async function handlePaymentFailed(ctx: any, invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  // Update invoice status to failed
  await ctx.runMutation(api.billing.updateInvoiceStatus, {
    stripeInvoiceId: invoice.id,
    status: "failed",
  });

  console.log(`Payment failed for invoice ${invoice.id}`);

  // TODO: Send notification to user about failed payment
}

async function handleSetupSuccess(
  ctx: any,
  setupIntent: Stripe.SetupIntent
) {
  // Card saved successfully
  const customerId =
    typeof setupIntent.customer === "string"
      ? setupIntent.customer
      : setupIntent.customer?.id;

  if (!customerId) return;

  const workspace = await ctx.runQuery(api.billing.getByStripeCustomerId, {
    stripeCustomerId: customerId,
  });

  if (!workspace) {
    console.log(`No workspace found for customer ${customerId}`);
    return;
  }

  // Only upgrade if on free tier (don't downgrade existing paid users)
  if (!workspace.billingPlan || workspace.billingPlan === "free") {
    const stripe = getStripe();

    // Set the payment method as default for invoices
    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;

    if (paymentMethodId) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Check if customer already has an active metered subscription
    const METERED_PRICE_ID = process.env.STRIPE_PRICE_ID_USAGE || "price_1TL038RtJYK3aJTqODoFAiVT";
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
      // Create metered subscription so Stripe can invoice usage
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
        console.log(`Created metered subscription ${subscription.id} for customer ${customerId}`);
      } catch (subError: any) {
        console.error(`Failed to create metered subscription for ${customerId}:`, subError.message);
        // Still upgrade the tier even if subscription creation fails
        // User can retry later
      }
    } else {
      subscriptionId = existingSubs.data.find((sub) =>
        sub.items.data.some((item) => item.price.id === METERED_PRICE_ID)
      )?.id;
      console.log(`Customer ${customerId} already has metered subscription ${subscriptionId}`);
    }

    // Upgrade workspace to usage_based
    await ctx.runMutation(api.billing.updateSubscription, {
      workspaceId: workspace._id,
      stripeSubscriptionId: subscriptionId,
      billingPlan: "usage_based",
    });

    // Store payment method info
    if (paymentMethodId) {
      try {
        const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
        if (pm.card) {
          await ctx.runMutation(api.billing.updatePaymentMethodInfo, {
            workspaceId: workspace._id,
            hasPaymentMethod: true,
            paymentMethodType: pm.type,
            cardBrand: pm.card.brand,
            cardLast4: pm.card.last4,
          });
        }
      } catch { /* non-critical */ }
    }

    console.log(`Workspace ${workspace._id} upgraded to usage_based with subscription ${subscriptionId}`);
  }
}

async function handlePaymentMethodAttached(
  ctx: any,
  paymentMethod: Stripe.PaymentMethod
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

  const workspace = await ctx.runQuery(api.billing.getByStripeCustomerId, {
    stripeCustomerId: customerId,
  });

  if (!workspace) {
    console.log(`No workspace found for customer ${customerId}`);
    return;
  }

  // Sync payment method info
  await ctx.runMutation(api.billing.updatePaymentMethodInfo, {
    workspaceId: workspace._id,
    hasPaymentMethod: true,
    paymentMethodType: paymentMethod.type,
    cardBrand: paymentMethod.card?.brand,
    cardLast4: paymentMethod.card?.last4,
  });

  console.log(`Payment method attached for workspace ${workspace._id}`);
}

async function handlePaymentMethodDetached(
  ctx: any,
  paymentMethod: Stripe.PaymentMethod
) {
  // When a payment method is detached, we need to check if customer still has payment methods
  // Since customer info isn't available on detached event, we log it
  console.log(`Payment method ${paymentMethod.id} detached`);
  
  // Note: In a production system, you might want to:
  // 1. Query Stripe for remaining payment methods
  // 2. If no payment methods remain, downgrade the workspace
  // For now, we rely on subscription cancellation to handle downgrades
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
