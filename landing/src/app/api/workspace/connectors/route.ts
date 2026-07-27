import { NextRequest, NextResponse } from "next/server";
import { convexMutation, ConvexCallError } from "@/lib/convex";

export const runtime = "nodejs";

function isSameOriginRequest(req: NextRequest): boolean {
  const fetchSite = req.headers.get("Sec-Fetch-Site");
  if (fetchSite && fetchSite !== "same-origin") return false;
  const origin = req.headers.get("Origin");
  return !origin || origin === req.nextUrl.origin;
}

function noStoreJson(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "Vary": "Cookie",
    },
  });
}

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) return noStoreJson({ error: "forbidden" }, 403);

  const ownerToken = req.cookies.get("apiclaw_workspace_session")?.value;
  if (!ownerToken) return noStoreJson({ error: "unauthenticated" }, 401);

  let body: { name?: unknown; redirectUris?: unknown };
  try {
    body = await req.json();
  } catch {
    return noStoreJson({ error: "invalid_request" }, 400);
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const redirectUris = Array.isArray(body.redirectUris)
    ? body.redirectUris.filter((value): value is string => typeof value === "string")
    : [];
  if (!name || name.length > 80 || redirectUris.length === 0 || redirectUris.length > 20) {
    return noStoreJson({ error: "invalid_request" }, 400);
  }

  try {
    const result = await convexMutation(
      "mcpOAuth:createDashboardConnector",
      { sessionToken: ownerToken, name, redirectUris },
    );
    return noStoreJson(result, 201);
  } catch (error) {
    const status = error instanceof ConvexCallError && error.status === 401 ? 401 : 400;
    return noStoreJson({ error: error instanceof Error ? error.message : "connector_generation_failed" }, status);
  }
}
