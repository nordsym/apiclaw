/**
 * Clerk Sign-Out Bridge
 * Called by Clerk's afterSignOutUrl after Clerk has cleared its own session.
 * Invalidates the apiclaw_workspace_session in Convex, clears the cookie,
 * and forwards to a client page that clears localStorage too.
 */
import { NextRequest, NextResponse } from "next/server";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://adventurous-avocet-799.convex.cloud";

async function handler(req: NextRequest): Promise<NextResponse> {
  const sessionToken = req.cookies.get("apiclaw_workspace_session")?.value;

  if (sessionToken) {
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "workspaces:logout",
          args: { token: sessionToken },
        }),
      });
    } catch (err) {
      console.error("clerk-signout: convex logout failed", err);
    }
  }

  const next = req.nextUrl.searchParams.get("next") || "/sign-in";
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
