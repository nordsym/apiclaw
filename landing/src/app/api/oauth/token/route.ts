// RFC 6749 §5 token endpoint. Supports `authorization_code` (with PKCE)
// and `refresh_token` grants.
import { NextRequest, NextResponse } from "next/server";
import { convexMutation, ConvexCallError } from "@/lib/convex";

export const runtime = "nodejs";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
};

function oauthError(error: string, description?: string, status = 400) {
  return NextResponse.json(
    { error, ...(description ? { error_description: description } : {}) },
    {
      status,
      headers: { "Cache-Control": "no-store", "Pragma": "no-cache" },
    }
  );
}

function decodeBasicAuth(header: string | null): { id: string; secret: string } | null {
  if (!header || !header.toLowerCase().startsWith("basic ")) return null;
  const raw = header.slice(6);
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    const idx = decoded.indexOf(":");
    if (idx < 0) return null;
    return {
      id: decodeURIComponent(decoded.slice(0, idx)),
      secret: decodeURIComponent(decoded.slice(idx + 1)),
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const ctype = req.headers.get("content-type") ?? "";
  let params: URLSearchParams;
  if (ctype.includes("application/x-www-form-urlencoded")) {
    params = new URLSearchParams(await req.text());
  } else if (ctype.includes("application/json")) {
    try {
      const body = await req.json();
      params = new URLSearchParams(
        Object.entries(body).reduce<Record<string, string>>((acc, [k, v]) => {
          if (typeof v === "string") acc[k] = v;
          return acc;
        }, {})
      );
    } catch {
      return oauthError("invalid_request", "JSON body could not be parsed");
    }
  } else {
    return oauthError("invalid_request", "unsupported content-type");
  }

  const grantType = params.get("grant_type");
  if (!grantType) return oauthError("invalid_request", "grant_type is required");

  // client_id / client_secret can come from form OR from Authorization: Basic.
  const basic = decodeBasicAuth(req.headers.get("authorization"));
  const clientId = basic?.id ?? params.get("client_id") ?? "";
  const clientSecret = basic?.secret ?? params.get("client_secret") ?? undefined;
  if (!clientId) return oauthError("invalid_client", "client_id required");

  try {
    if (grantType === "authorization_code") {
      const code = params.get("code");
      const redirectUri = params.get("redirect_uri");
      const codeVerifier = params.get("code_verifier");
      if (!code || !redirectUri || !codeVerifier) {
        return oauthError("invalid_request", "code, redirect_uri and code_verifier required");
      }
      const tokens = await convexMutation<TokenResponse>("mcpOAuth:exchangeAuthCode", {
        code,
        clientId,
        clientSecret,
        redirectUri,
        codeVerifier,
      });
      return NextResponse.json(tokens, {
        headers: { "Cache-Control": "no-store", "Pragma": "no-cache" },
      });
    }

    if (grantType === "refresh_token") {
      const refreshToken = params.get("refresh_token");
      if (!refreshToken) return oauthError("invalid_request", "refresh_token required");
      const tokens = await convexMutation<TokenResponse>("mcpOAuth:exchangeRefreshToken", {
        refreshToken,
        clientId,
        clientSecret,
      });
      return NextResponse.json(tokens, {
        headers: { "Cache-Control": "no-store", "Pragma": "no-cache" },
      });
    }

    return oauthError("unsupported_grant_type", grantType);
  } catch (e) {
    if (e instanceof ConvexCallError) {
      // Convex throws "invalid_grant" / "invalid_client" verbatim.
      const map: Record<string, string> = {
        invalid_grant: "invalid_grant",
        invalid_client: "invalid_client",
        invalid_redirect_uri: "invalid_grant",
        client_bound_to_other_workspace: "invalid_grant",
      };
      const code = map[e.message] || "invalid_request";
      return oauthError(code, e.message, code === "invalid_client" ? 401 : 400);
    }
    return oauthError("server_error", e instanceof Error ? e.message : "exchange failed", 500);
  }
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
