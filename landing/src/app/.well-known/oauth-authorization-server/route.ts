import { NextResponse } from "next/server";

// RFC 8414 — Authorization Server Metadata.
// Public, no auth required. Tells MCP clients (Grok, Cursor, ChatGPT,
// Claude Desktop) how to talk OAuth to APIClaw.
const ISSUER = "https://apiclaw.cloud";

export async function GET() {
  const meta = {
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/oauth/authorize`,
    token_endpoint: `${ISSUER}/api/oauth/token`,
    registration_endpoint: `${ISSUER}/api/oauth/register`,
    revocation_endpoint: `${ISSUER}/api/oauth/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "none"],
    scopes_supported: ["mcp", "mcp:read", "mcp:call", "mcp:billing"],
    service_documentation: `${ISSUER}/docs`,
  };
  return NextResponse.json(meta, {
    headers: {
      "Cache-Control": "public, max-age=300, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
