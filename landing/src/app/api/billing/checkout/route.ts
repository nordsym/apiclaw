import { NextRequest, NextResponse } from "next/server";

function convexSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const cloudUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (cloudUrl) return cloudUrl.replace(/\.convex\.cloud\/?$/, ".convex.site");

  return "https://adventurous-avocet-799.convex.site";
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const response = await fetch(`${convexSiteUrl()}/api/billing/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        mode: "setup",
        returnUrl: process.env.NEXT_PUBLIC_APP_URL || "https://apiclaw.cloud",
      }),
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || "Checkout failed" },
        { status: response.status },
      );
    }

    return NextResponse.json({ url: data.checkoutUrl, sessionId: data.sessionId });
  } catch (error) {
    console.error("[Checkout] Convex billing request failed:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 502 });
  }
}
