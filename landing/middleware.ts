import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";

// Routes that require an apiclaw session (cookie OR Clerk userId).
// /oauth/authorize is gated so we can trust the session before minting codes.
const isProtectedDashboard = createRouteMatcher([
  "/dashboard(.*)",
  "/workspace(.*)",
  "/oauth/authorize(.*)",
]);

// Public OAuth + MCP routes — bypass any auth gate. They authenticate
// themselves (Bearer or DCR open per RFC 7591).
const isPublicMcpRoute = createRouteMatcher([
  "/api/oauth/(.*)",
  "/mcp(.*)",
  "/.well-known/(.*)",
]);

async function legacySessionValid(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "workspaces:getSession",
        args: { token },
      }),
    });
    const result = await response.json();
    const session = result.value || result;
    return Boolean(session);
  } catch {
    return true;
  }
}

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/dashboard/verify")) {
    return NextResponse.next();
  }

  // OAuth + MCP entry points are public by design (DCR is RFC 7591, /mcp
  // gates itself with a Bearer). Skip the dashboard auth gate entirely.
  if (isPublicMcpRoute(request)) {
    return NextResponse.next();
  }

  if (!isProtectedDashboard(request)) {
    return NextResponse.next();
  }

  const apiclawCookie = request.cookies.get("apiclaw_workspace_session")?.value;
  if (apiclawCookie && (await legacySessionValid(apiclawCookie))) {
    return NextResponse.next();
  }

  const { userId } = await auth();
  if (userId) {
    // Clerk authed but no apiclaw session — mint one via the bridge.
    const bridge = new URL("/api/workspace-auth/clerk-bridge", request.url);
    bridge.searchParams.set("next", pathname + (request.nextUrl.search || ""));
    return NextResponse.redirect(bridge);
  }

  // Unauthed → /sign-in. Preserve link / ref query params so /sign-in can
  // stash them in localStorage and the callback can replay on the way back.
  // For /oauth/authorize, also preserve the full original URL so the consent
  // screen reloads with all OAuth params after the user signs in.
  const signIn = new URL("/sign-in", request.url);
  const link = request.nextUrl.searchParams.get("link");
  const ref = request.nextUrl.searchParams.get("ref");
  if (link) signIn.searchParams.set("link", link);
  if (ref) signIn.searchParams.set("ref", ref);
  signIn.searchParams.set("redirect_url", pathname + (request.nextUrl.search || ""));
  return NextResponse.redirect(signIn);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
