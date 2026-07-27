/**
 * Clerk Sign-Out Bridge
 * Called by Clerk's afterSignOutUrl after Clerk has cleared its own session.
 * Invalidates the apiclaw_workspace_session in Convex, clears the cookie,
 * and forwards to a client page that clears localStorage too.
 */
import { NextRequest, NextResponse } from "next/server";
import { safeAuthContinuation } from "@/lib/auth-continuation";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://adventurous-avocet-799.convex.cloud";

async function handler(req: NextRequest): Promise<NextResponse> {
  const sessionToken = req.cookies.get("apiclaw_workspace_session")?.value;

  if (sessionToken) {
    try {
      const logoutResponse = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "workspaces:logout",
          args: { token: sessionToken },
        }),
        cache: "no-store",
      });
      const envelope = await logoutResponse.json().catch(() => null);
      const result = envelope?.value || envelope;
      if (!logoutResponse.ok || result?.success !== true) {
        return NextResponse.json(
          { success: false, error: "logout_unavailable" },
          {
            status: 503,
            headers: { "Cache-Control": "no-store, private", "Retry-After": "5" },
          },
        );
      }
    } catch (err) {
      console.error("clerk-signout: convex logout failed", err);
      return NextResponse.json(
        { success: false, error: "logout_unavailable" },
        {
          status: 503,
          headers: { "Cache-Control": "no-store, private", "Retry-After": "5" },
        },
      );
    }
  }

  const next = safeAuthContinuation(req.nextUrl.searchParams.get("next"), "/sign-in");
  const callback = new URL("/auth/clerk-signout-callback", req.url);
  callback.searchParams.set("next", next);

  const res = NextResponse.redirect(callback);
  res.cookies.set("apiclaw_workspace_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
