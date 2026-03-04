import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://brilliant-puffin-712.eu-west-1.convex.cloud";
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
      return NextResponse.json({ paymentMethod: null });
    }

    // Get customer's default payment method
    const customer = await stripe.customers.retrieve(workspace.stripeCustomerId, {
      expand: ["invoice_settings.default_payment_method"],
    });

    if (customer.deleted) {
      return NextResponse.json({ paymentMethod: null });
    }

    const defaultPm = customer.invoice_settings?.default_payment_method;

    if (!defaultPm || typeof defaultPm === "string") {
      // Try to get from subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: workspace.stripeCustomerId,
        status: "active",
        limit: 1,
        expand: ["data.default_payment_method"],
      });

      if (subscriptions.data.length > 0) {
        const subPm = subscriptions.data[0].default_payment_method;
        if (subPm && typeof subPm !== "string" && subPm.type === "card" && subPm.card) {
          return NextResponse.json({
            paymentMethod: {
              brand: subPm.card.brand,
              last4: subPm.card.last4,
              expMonth: subPm.card.exp_month,
              expYear: subPm.card.exp_year,
            },
          });
        }
      }

      // Try to get any payment method
      const paymentMethods = await stripe.paymentMethods.list({
        customer: workspace.stripeCustomerId,
        type: "card",
        limit: 1,
      });

      if (paymentMethods.data.length > 0 && paymentMethods.data[0].card) {
        const pm = paymentMethods.data[0];
        return NextResponse.json({
          paymentMethod: {
            brand: pm.card!.brand,
            last4: pm.card!.last4,
            expMonth: pm.card!.exp_month,
            expYear: pm.card!.exp_year,
          },
        });
      }

      return NextResponse.json({ paymentMethod: null });
    }

    // Extract card details from default payment method
    if (defaultPm.type === "card" && defaultPm.card) {
      return NextResponse.json({
        paymentMethod: {
          brand: defaultPm.card.brand,
          last4: defaultPm.card.last4,
          expMonth: defaultPm.card.exp_month,
          expYear: defaultPm.card.exp_year,
        },
      });
    }

    return NextResponse.json({ paymentMethod: null });
  } catch (error) {
    console.error("[Payment Method] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get payment method" },
      { status: 500 }
    );
  }
}
