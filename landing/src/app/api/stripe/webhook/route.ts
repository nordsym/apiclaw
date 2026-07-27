import { NextResponse } from "next/server";

// Stripe production delivery is owned by the signed Convex webhook at
// /api/webhooks/stripe. Keeping a second implementation here created two
// independent entitlement paths and made replay safety impossible to prove.
export async function POST() {
  return NextResponse.json(
    {
      received: false,
      error: "This webhook endpoint is retired. Stripe delivery is handled by the APIClaw gateway.",
    },
    { status: 410 },
  );
}
