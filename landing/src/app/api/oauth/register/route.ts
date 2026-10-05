// RFC 7591 Dynamic Client Registration.
// Public registration is closed. Callers must present an initial access
// token (Authorization: Bearer) that matches OAUTH_DCR_INITIAL_ACCESS_TOKEN
// on this server and on Convex. Redirect URIs must be loopback or on the
// hosted-client allowlist. This route does not mint credentials otherwise.
//
// First-party clients keep working without this endpoint:
// - already-registered clients continue through /oauth/authorize + PKCE S256
// - a signed-in workspace mints a new connector at POST /api/workspace/connectors
import { NextRequest, NextResponse } from "next/server";
import { convexMutation, ConvexCallError } from "@/lib/convex";
import { registrationDecision } from "@/lib/oauth-dcr.generated";

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
  return NextResponse.json(
    { error, error_description: description },
    {
      status: 400,
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

function unauthorized() {
  return NextResponse.json(
    {
      error: "invalid_token",
      error_description: "Dynamic client registration requires an initial access token.",
    },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
        "WWW-Authenticate": 'Bearer realm="apiclaw-oauth-registration", error="invalid_token"',
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
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

  const decision = registrationDecision({
    authorizationHeader: req.headers.get("authorization"),
    configuredToken: process.env.OAUTH_DCR_INITIAL_ACCESS_TOKEN,
    redirectUris,
    extraAllowlistRaw: process.env.OAUTH_DCR_REDIRECT_ALLOWLIST,
  });
  if (!decision.ok) {
    if (decision.status === 401) return unauthorized();
    return badRequest(decision.error, decision.error_description);
  }

  const grantTypesIn = Array.isArray(body.grant_types)
    ? body.grant_types.filter((g): g is string => typeof g === "string")
    : undefined;

  const authMethod = typeof body.token_endpoint_auth_method === "string"
    ? body.token_endpoint_auth_method
    : undefined;

  const isPublic = authMethod === "none";
  const name = typeof body.client_name === "string" ? body.client_name : "MCP Client";
  if (Object.prototype.hasOwnProperty.call(body, "scope") && typeof body.scope !== "string") {
    return badRequest("invalid_client_metadata", "scope must be a non-empty supported scope string");
  }
  const scope = typeof body.scope === "string" ? body.scope : undefined;

  try {
    const result = await convexMutation<DynamicRegistrationResult>(
      "mcpOAuth:registerDynamicClient",
      {
        name,
        redirectUris: decision.redirectUris,
        grantTypes: grantTypesIn,
        tokenEndpointAuthMethod: authMethod,
        ...(scope === undefined ? {} : { scope }),
        publicClient: isPublic,
        initialAccessToken: decision.initialAccessToken,
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
    if (e instanceof ConvexCallError && e.message.includes("dynamic_client_registration_closed")) {
      return unauthorized();
    }
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
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
