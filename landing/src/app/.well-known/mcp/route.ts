import { NextResponse } from "next/server";
import statsData from "@/lib/stats.json";

// Discovery hint for MCP-aware clients and directories. There is no formal
// /.well-known/mcp standard yet (as of 2026-05) but several emerging MCP
// catalogs (mcp.so, modelcontextprotocol.io directory, xAI's connector
// browser) probe this path when a domain is provided. We expose enough
// metadata for them to render a card and route the OAuth flow.
const ISSUER = "https://apiclaw.cloud";

export async function GET() {
  const apiCount = statsData.apiCount.toLocaleString();
  const callable = statsData.callableCount.toLocaleString();
  const managed = statsData.managedCount;
  const meta = {
    name: "APIClaw",
    description:
      `The API layer for AI agents. ${apiCount} discoverable APIs, ${callable} empirically callable, ${managed} fully managed (OpenAI, Anthropic, xAI, Groq, Mistral, ElevenLabs, Brave Search, Firecrawl, GitHub, APILayer, and more). Universal pass-through proxy for keyless public APIs.`,
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
    tools: [
      "discover_apis",
      "get_api_details",
      "call_api",
      "list_categories",
      "list_connected",
      "check_balance",
    ],
    categories: ["api-gateway", "developer-tools", "llm", "infrastructure"],
    keywords: ["mcp", "api", "openrouter", "openai", "anthropic", "xai", "grok", "elevenlabs"],
    pricing: "Free tier (25 calls/month) + pay-as-you-go (provider cost + 15%)",
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
