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

    const response = await fetch(`${convexSiteUrl()}/api/billing/portal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        returnUrl: process.env.NEXT_PUBLIC_APP_URL || "https://apiclaw.cloud",
      }),
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error || "Failed to create portal session" },
        { status: response.status },
      );
    }

    return NextResponse.json({ url: data.portalUrl });
  } catch (error) {
    console.error("[Billing Portal] Convex billing request failed:", error);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 502 });
  }
}
