import { NextRequest, NextResponse } from "next/server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Get session from Convex
    const response = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "providers:getSession",
        args: { token },
      }),
    });

    if (!response.ok) {
      throw new Error("Session check failed");
    }

    const session = await response.json();

    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ error: "Session check failed" }, { status: 500 });
  }
}
