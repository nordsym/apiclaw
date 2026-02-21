import { NextRequest, NextResponse } from "next/server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://brilliant-puffin-712.eu-west-1.convex.cloud";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Verify magic link in Convex
    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "providers:verifyMagicLink",
        args: { token },
      }),
    });

    if (!response.ok) {
      throw new Error("Verification failed");
    }

    const result = await response.json();

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Invalid token" }, { status: 400 });
    }

    // Return session token
    return NextResponse.json({
      success: true,
      sessionToken: result.sessionToken,
      provider: result.provider,
    });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
