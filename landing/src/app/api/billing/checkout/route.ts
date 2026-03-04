import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://brilliant-puffin-712.eu-west-1.convex.cloud";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Price ID for usage-based subscription
const USAGE_BASED_PRICE_ID = process.env.STRIPE_USAGE_PRICE_ID || "price_1R9hAUCQSPYXHCfhMmaPnmN9";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Verify session and get workspace
    const sessionRes = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "workspaces:getSessionWorkspace",
        args: { token },
      }),
    });

    const sessionData = await sessionRes.json();
    const workspace = sessionData.value || sessionData;

    if (!workspace || !workspace._id) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Check if customer already exists
    let customerId = workspace.stripeCustomerId;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: workspace.email,
        metadata: {
          workspaceId: workspace._id,
        },
      });

      customerId = customer.id;

      // Save customer ID to workspace
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "billing:linkCustomer",
          args: {
            workspaceId: workspace._id,
            stripeCustomerId: customerId,
          },
        }),
      });
    }

    // Determine the app URL for redirects
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apiclaw.com";

    // Create Checkout Session for setup mode (to collect payment method)
    // This will create a subscription with usage-based billing
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: USAGE_BASED_PRICE_ID,
        },
      ],
      subscription_data: {
        metadata: {
          workspaceId: workspace._id,
          type: "usage_based",
        },
      },
      metadata: {
        workspaceId: workspace._id,
        type: "usage_based",
      },
      success_url: `${appUrl}/workspace?billing=success`,
      cancel_url: `${appUrl}/workspace?billing=cancel`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("[Checkout] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
