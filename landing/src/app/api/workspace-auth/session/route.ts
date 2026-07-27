import { NextRequest, NextResponse } from "next/server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";
const OWNER_COOKIE = "apiclaw_workspace_session";

type BrowserSessionResult = {
  success: true;
  browserToken: string;
  expiresAt: number;
  session: unknown;
};

type BrowserSessionMint =
  | { status: "ok"; result: BrowserSessionResult }
  | { status: "invalid" }
  | { status: "unavailable" };

function noStoreJson(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store, private",
      "Pragma": "no-cache",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "Vary": "Cookie",
    },
  });
}

function isSameOriginRequest(req: NextRequest): boolean {
  const fetchSite = req.headers.get("Sec-Fetch-Site");
  if (fetchSite && fetchSite !== "same-origin") return false;

  const origin = req.headers.get("Origin");
  if (origin && origin !== req.nextUrl.origin) return false;

  return true;
}

async function mintBrowserSession(ownerToken: string): Promise<BrowserSessionMint> {
  let response: Response;
  try {
    response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "workspaces:mintBrowserSession",
        args: { token: ownerToken },
      }),
      cache: "no-store",
    });
  } catch {
    return { status: "unavailable" };
  }

  if (!response.ok) return { status: "unavailable" };
  const envelope = await response.json();
  const result = envelope?.value || envelope;
  if (result?.success === false) return { status: "invalid" };
  if (
    result?.success !== true ||
    typeof result.browserToken !== "string" ||
    typeof result.expiresAt !== "number"
  ) {
    return { status: "unavailable" };
  }

  return { status: "ok", result: result as BrowserSessionResult };
}

function browserSessionResponse(result: BrowserSessionResult) {
  return noStoreJson({
    session: result.session,
    browserToken: result.browserToken,
    browserExpiresAt: result.expiresAt,
  });
}

export async function GET(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return noStoreJson({ session: null }, { status: 403 });
  }

  try {
    // The durable owner bearer is read from the HttpOnly cookie and never
    // returned to JavaScript. Browser code receives only a short-lived child.
    const ownerToken = req.cookies.get(OWNER_COOKIE)?.value;
    if (!ownerToken) {
      return noStoreJson({ session: null }, { status: 200 });
    }

    const mint = await mintBrowserSession(ownerToken);
    if (mint.status === "unavailable") {
      return noStoreJson({ session: null }, { status: 503 });
    }
    if (mint.status === "invalid") {
      const response = noStoreJson({ session: null }, { status: 200 });
      response.cookies.delete(OWNER_COOKIE);
      return response;
    }

    return browserSessionResponse(mint.result);
  } catch (error) {
    console.error("Session bootstrap failed", error instanceof Error ? error.message : "unknown error");
    return noStoreJson({ session: null }, { status: 200 });
  }
}

// One-release migration path for browsers that still hold the pre-cookie
// owner bearer. Convex rejects browser children as minting parents. A valid
// owner token is persisted only in the HttpOnly cookie and then removed from
// localStorage by the browser helper.
export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return noStoreJson({ session: null }, { status: 403 });
  }

  const ownerToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!ownerToken) return noStoreJson({ session: null }, { status: 401 });

  try {
    const mint = await mintBrowserSession(ownerToken);
    if (mint.status === "unavailable") {
      return noStoreJson({ session: null }, { status: 503 });
    }
    if (mint.status === "invalid") {
      return noStoreJson({ session: null }, { status: 401 });
    }

    const response = browserSessionResponse(mint.result);
    response.cookies.set(OWNER_COOKIE, ownerToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch {
    return noStoreJson({ session: null }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return noStoreJson({ success: false }, { status: 403 });
  }

  try {
    const ownerToken = req.cookies.get(OWNER_COOKIE)?.value;
    if (ownerToken) {
      const logoutResponse = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "workspaces:logout",
          args: { token: ownerToken },
        }),
        cache: "no-store",
      });
      const envelope = await logoutResponse.json().catch(() => null);
      const result = envelope?.value || envelope;
      if (!logoutResponse.ok || result?.success !== true) {
        // Keep the durable owner cookie so the browser can retry revocation.
        // Clearing it here would strand a still-valid server-side bearer.
        return noStoreJson({ success: false }, { status: 503 });
      }
    }

    const response = noStoreJson({ success: true });
    response.cookies.delete(OWNER_COOKIE);
    return response;
  } catch (error) {
    console.error("Logout failed", error instanceof Error ? error.message : "unknown error");
    return noStoreJson({ error: "Logout failed" }, { status: 503 });
  }
}
