/**
 * Clerk Bridge
 * Called as the Clerk redirect target after sign-in/sign-up.
 * Reads Clerk identity, get-or-creates the apiclaw workspace,
 * mints an apiclaw_workspace_session cookie matching the legacy magic-link flow,
 * then forwards the user to /workspace (preserving any pending device-link).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://adventurous-avocet-799.convex.cloud";

async function bridge(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress;

  if (!email) {
    return NextResponse.redirect(new URL("/sign-in?error=no_email", req.url));
  }

  const fingerprint = req.cookies.get("apiclaw_fingerprint")?.value;

  const convexRes = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "workspaces:getOrCreateForClerk",
      args: { email, clerkUserId: userId, fingerprint },
    }),
  });

  if (!convexRes.ok) {
    console.error("clerk-bridge: convex mutation failed", convexRes.status);
    return NextResponse.redirect(new URL("/sign-in?error=bridge_failed", req.url));
  }

  const data = await convexRes.json();
  const result = data.value || data;
  if (!result?.success || !result.sessionToken) {
    console.error("clerk-bridge: bad result", result);
    return NextResponse.redirect(new URL("/sign-in?error=bridge_failed", req.url));
  }

  const url = new URL(req.url);
  const linkCode = url.searchParams.get("link");
  const next = linkCode ? `/workspace?link=${linkCode}` : "/workspace";

  // Send through a client callback so it can write localStorage too —
  // /workspace reads the session from localStorage, not the cookie.
  const callback = new URL("/auth/clerk-callback", req.url);
  callback.searchParams.set("t", result.sessionToken);
  callback.searchParams.set("next", next);

  const res = NextResponse.redirect(callback);
  res.cookies.set("apiclaw_workspace_session", result.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}

export async function GET(req: NextRequest) {
  return bridge(req);
}

export async function POST(req: NextRequest) {
  return bridge(req);
}
