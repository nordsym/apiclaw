// RFC 7009 token revocation.
import { NextRequest, NextResponse } from "next/server";
import { convexMutation } from "@/lib/convex";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ctype = req.headers.get("content-type") ?? "";
  let token: string | null = null;
  if (ctype.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(await req.text());
    token = params.get("token");
  } else if (ctype.includes("application/json")) {
    try {
      const body = await req.json();
      token = typeof body?.token === "string" ? body.token : null;
    } catch { /* fall through */ }
  }
  // RFC 7009 says respond 200 even if token unknown.
  if (token) {
    try {
      await convexMutation("mcpOAuth:revokeToken", { token });
    } catch { /* swallow */ }
  }
  return new NextResponse(null, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
