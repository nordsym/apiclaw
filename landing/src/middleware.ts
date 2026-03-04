import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://brilliant-puffin-712.eu-west-1.convex.cloud";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only protect /dashboard routes (not /dashboard/verify)
  if (pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/verify")) {
    const sessionToken = request.cookies.get("apiclaw_workspace_session")?.value;

    if (!sessionToken) {
      // Redirect to login if no session
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Optionally verify session with Convex
    // For performance, we do a lightweight check - full validation happens in the page
    try {
      const response = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "workspaces:getSession",
          args: { token: sessionToken },
        }),
      });

      const result = await response.json();
      const session = result.value || result;

      if (!session) {
        // Invalid session - clear cookie and redirect
        const res = NextResponse.redirect(new URL("/login", request.url));
        res.cookies.delete("apiclaw_workspace_session");
        return res;
      }
    } catch {
      // On error, let the page handle it
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
