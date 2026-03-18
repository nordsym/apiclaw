import { NextRequest, NextResponse } from "next/server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://brilliant-puffin-712.eu-west-1.convex.cloud";

export async function POST(req: NextRequest) {
  try {
    const { token, fingerprint } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Verify magic link in Convex
    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "workspaces:verifyMagicLink",
        args: { token, fingerprint },
      }),
    });

    if (!response.ok) {
      throw new Error("Verification failed");
    }

    const result = await response.json();
    
    // Convex wraps response in { status: "success", value: {...} }
    const data = result.value || result;

    if (!data.success) {
      return NextResponse.json({ error: data.error || "Invalid token" }, { status: 400 });
    }

    // Create response with session cookie
    const res = NextResponse.json({
      success: true,
      sessionToken: data.sessionToken,
      workspace: data.workspace,
    });

    // Set httpOnly cookie for session
    res.cookies.set("apiclaw_workspace_session", data.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
