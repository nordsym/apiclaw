/**
 * Clerk Bridge
 * Called as the Clerk redirect target after sign-in/sign-up.
 * Reads Clerk identity, get-or-creates the apiclaw workspace,
 * mints an apiclaw_workspace_session cookie matching the legacy magic-link flow,
 * then forwards the user to /workspace (preserving any pending device-link).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { explicitAuthContinuation } from "@/lib/auth-continuation";
import { AUTHID_FORMAT } from "@/app/auth/cli/shared";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://adventurous-avocet-799.convex.cloud";

async function bridge(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const user = await currentUser();
  const verifiedPrimary = user?.primaryEmailAddress?.verification?.status === "verified"
    ? user.primaryEmailAddress.emailAddress
    : undefined;
  const verifiedFallback = user?.emailAddresses?.find(
    (address) => address.verification?.status === "verified",
  )?.emailAddress;
  const email = verifiedPrimary || verifiedFallback;

  if (!email) {
    return NextResponse.redirect(new URL("/sign-in?error=no_email", req.url));
  }

  const convexRes = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "workspaces:getOrCreateForClerk",
      args: {
        email,
        clerkUserId: userId,
        fingerprint: `clerk:${userId}`,
        internalSecret: process.env.APICLAW_INTERNAL_SECRET,
      },
    }),
  });

  if (!convexRes.ok) {
    console.error("clerk-bridge: convex mutation failed", convexRes.status);
    return NextResponse.redirect(new URL("/sign-in?error=bridge_failed", req.url));
  }

  const data = await convexRes.json();
  const result = data.value || data;
  if (!result?.success || !result.sessionToken) {
    console.error("clerk-bridge: workspace claim rejected", {
      success: Boolean(result?.success),
      hasSessionToken: Boolean(result?.sessionToken),
    });
    return NextResponse.redirect(new URL("/sign-in?error=bridge_failed", req.url));
  }

  // Keep the bearer in an HttpOnly cookie. Never place it in a URL, browser
  // history, referrer, analytics payload, or persistent JavaScript storage.
  const requested =
    req.nextUrl.searchParams.get("next") || req.nextUrl.searchParams.get("redirect_url");
  const explicit = explicitAuthContinuation(requested);
  const pendingCli = req.cookies.get("apiclaw_cli_auth")?.value;
  const continuation =
    explicit ??
    (pendingCli && AUTHID_FORMAT.test(pendingCli)
      ? `/auth/cli?authId=${pendingCli}`
      : "/workspace");
  const res = NextResponse.redirect(new URL(continuation, req.url));
  res.headers.set("Cache-Control", "no-store, private");
  res.headers.set("Referrer-Policy", "no-referrer");
  if (pendingCli) res.cookies.delete("apiclaw_cli_auth");
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
