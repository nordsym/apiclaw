import { NextResponse } from "next/server";

// RFC 9728 — Protected Resource Metadata.
// MCP clients fetch this when they hit /mcp without a valid Bearer.
const ISSUER = "https://apiclaw.cloud";

export async function GET() {
  const meta = {
    resource: `${ISSUER}/mcp`,
    authorization_servers: [ISSUER],
    bearer_methods_supported: ["header"],
    scopes_supported: ["mcp", "mcp:read", "mcp:call", "mcp:billing"],
    resource_documentation: `${ISSUER}/docs`,
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
