import { NextResponse } from "next/server";
import statsData from "@/lib/stats.json";
import { CANONICAL_MCP_TOOLS } from "@/lib/mcp-tools-canon";
import { PAYG_MARGIN_RATE } from "@apiclaw/product-truth";

// Discovery hint for MCP-aware clients and directories. There is no formal
// /.well-known/mcp standard yet (as of 2026-05) but several emerging MCP
// catalogs (mcp.so, modelcontextprotocol.io directory, xAI's connector
// browser) probe this path when a domain is provided. We expose enough
// metadata for them to render a card and route the OAuth flow.
const ISSUER = "https://apiclaw.cloud";

export async function GET() {
  const apiCount = statsData.apiCount.toLocaleString();
  const sourceVerified = statsData.sourceVerifiedCount.toLocaleString();
  const paygMarginPercent = PAYG_MARGIN_RATE * 100;
  const meta = {
    name: "APIClaw",
    description:
      `Your agent calls real APIs. You sign in once. ${apiCount} discoverable API definitions, including ${sourceVerified} source-verified definitions. Managed execution is available only where a verified server-side adapter is live.`,
    vendor: "NordSym AB",
    homepage: ISSUER,
    documentation: `${ISSUER}/docs`,
    icon: `${ISSUER}/favicon.ico`,
    logo: `${ISSUER}/apiclaw-logo.svg`,
    server: {
      url: `${ISSUER}/mcp`,
      transport: "streamable-http",
      protocol_version: "2025-03-26",
    },
    auth: {
      type: "oauth2",
      authorization_server_metadata: `${ISSUER}/.well-known/oauth-authorization-server`,
      protected_resource_metadata: `${ISSUER}/.well-known/oauth-protected-resource`,
      dynamic_client_registration: true,
      pkce_required: true,
    },
    tools: CANONICAL_MCP_TOOLS.map((tool) => tool.name),
    categories: ["api-gateway", "developer-tools", "llm", "infrastructure"],
    keywords: ["mcp", "api", "openrouter", "openai", "anthropic", "xai", "grok", "elevenlabs"],
    pricing: `Free APIs: free forever, no card. Paid APIs: add a card once, then provider cost + ${paygMarginPercent}%, metered per call.`,
  };
  return NextResponse.json(meta, {
    headers: {
      "Cache-Control": "public, max-age=600, must-revalidate",
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
