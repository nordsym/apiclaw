import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

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

    if (!workspace.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account. Add a payment method first." },
        { status: 400 }
      );
    }

    // Determine the app URL for redirects
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apiclaw.com";

    // Create Billing Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: `${appUrl}/workspace?tab=billing`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("[Billing Portal] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create portal session" },
      { status: 500 }
    );
  }
}
