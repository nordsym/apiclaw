// RFC 7591 Dynamic Client Registration.
// Open per spec — clients (Grok, Cursor, ChatGPT, etc.) register themselves
// to discover IDs/secrets. Registration alone grants nothing; tokens still
// require human consent on /oauth/authorize against an email-verified
// workspace, so this endpoint cannot be used to bypass the auth gate.
import { NextRequest, NextResponse } from "next/server";
import { convexMutation, ConvexCallError } from "@/lib/convex";

export const runtime = "nodejs";

type DynamicRegistrationRequest = {
  client_name?: string;
  redirect_uris?: unknown;
  grant_types?: unknown;
  token_endpoint_auth_method?: unknown;
  scope?: unknown;
};

type DynamicRegistrationResult = {
  client_id: string;
  client_secret?: string;
  client_id_issued_at: number;
  client_secret_expires_at: number;
  redirect_uris: string[];
  grant_types: string[];
  token_endpoint_auth_method: string;
  scope: string;
};

function badRequest(error: string, description: string) {
  return NextResponse.json({ error, error_description: description }, { status: 400 });
}

export async function POST(req: NextRequest) {
  let body: DynamicRegistrationRequest;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_client_metadata", "request body must be valid JSON");
  }

  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris.filter((u): u is string => typeof u === "string")
    : [];
  if (redirectUris.length === 0) {
    return badRequest("invalid_redirect_uri", "redirect_uris is required");
  }

  const grantTypesIn = Array.isArray(body.grant_types)
    ? body.grant_types.filter((g): g is string => typeof g === "string")
    : undefined;

  const authMethod = typeof body.token_endpoint_auth_method === "string"
    ? body.token_endpoint_auth_method
    : undefined;

  const isPublic = authMethod === "none";
  const name = typeof body.client_name === "string" ? body.client_name : "MCP Client";
  const scope = typeof body.scope === "string" ? body.scope : undefined;

  try {
    const result = await convexMutation<DynamicRegistrationResult>(
      "mcpOAuth:registerDynamicClient",
      {
        name,
        redirectUris,
        grantTypes: grantTypesIn,
        tokenEndpointAuthMethod: authMethod,
        scope,
        publicClient: isPublic,
      }
    );
    return NextResponse.json(result, {
      status: 201,
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    if (e instanceof ConvexCallError) {
      return badRequest("invalid_client_metadata", e.message);
    }
    return badRequest("server_error", e instanceof Error ? e.message : "registration failed");
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
