// Canonical MCP tool surface — single source of truth for the Remote MCP
// runtime served from /mcp. Local MCP (src/index.ts in @nordsym/apiclaw)
// today maintains its own list; converging the two is tracked separately.
//
// Tools are deliberately scoped to what makes sense over an OAuth-gated
// remote runtime. Workspace bootstrap (register_owner, verify_code,
// purchase_access, add_credits, setup_metered_billing, remind_owner) is
// out — that flow belongs to the dashboard / CLI login. Everything else
// the local MCP exposes lives here.

import { CONVEX_BASE_URL } from "./convex";

const SITE_URL = CONVEX_BASE_URL.replace(".convex.cloud", ".convex.site");

export const CANONICAL_MCP_TOOLS = [
  // ----- INTRO -----
  {
    name: "apiclaw_help",
    description:
      "Get help and a tour of APIClaw's tool surface. Start here if you are new to APIClaw.",
    inputSchema: { type: "object", properties: {} },
  },
  // ----- DISCOVERY -----
  {
    name: "discover_apis",
    description:
      "Search APIClaw's catalog of 26,000+ APIs by capability. Use when the user asks 'what API can do X?' or needs provider recommendations.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural language query (e.g., 'send SMS to Sweden')" },
        category: { type: "string", description: "Optional category filter" },
        callable_only: { type: "boolean", description: "Only return APIs APIClaw can execute right now", default: false },
        max_results: { type: "number", description: "Max results to return", default: 5 },
      },
      required: ["query"],
    },
  },
  {
    name: "get_api_details",
    description: "Full specs, pricing, auth, and usage examples for a specific API.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "API or provider name" } },
      required: ["name"],
    },
  },
  {
    name: "list_categories",
    description: "Browse APIClaw's API catalog by category.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_connected",
    description: "List all managed providers ready for instant calls (no key required).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_capabilities",
    description: "List capability shortcuts (e.g. 'currency_convert', 'web_search', 'tts') that route to the best provider automatically.",
    inputSchema: { type: "object", properties: {} },
  },
  // ----- MODELS -----
  {
    name: "list_models",
    description:
      "List every LLM the workspace can call through APIClaw — Anthropic, OpenAI, xAI/Grok, Groq, Mistral, Together, Cohere, Replicate, OpenRouter (800+ more), and any provider routed via the unified gateway. Returns OpenAI-compatible model objects.",
    inputSchema: {
      type: "object",
      properties: {
        provider: { type: "string", description: "Optional: filter to one provider (anthropic, openai, xai, groq, mistral, together, openrouter, …)" },
      },
    },
  },
  // ----- EXECUTION -----
  {
    name: "call_api",
    description:
      "Execute a callable API through APIClaw's gateway. Auth is handled automatically for managed providers.",
    inputSchema: {
      type: "object",
      properties: {
        api: { type: "string", description: "API or provider name" },
        path: { type: "string", description: "API path (e.g., /v1/messages)", default: "/" },
        method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], default: "GET" },
        params: { type: "object", description: "Query string parameters" },
        body: { description: "Request body for POST/PUT/PATCH" },
      },
      required: ["api"],
    },
  },
  {
    name: "capability",
    description:
      "Run a job-to-be-done by capability name (currency_convert, web_search, tts, transcribe, scrape, etc.). APIClaw picks the best managed provider.",
    inputSchema: {
      type: "object",
      properties: {
        capability: { type: "string", description: "Capability name (use list_capabilities to see options)" },
        params: { type: "object", description: "Capability-specific parameters" },
      },
      required: ["capability"],
    },
  },
  // ----- BILLING / OBSERVABILITY -----
  {
    name: "check_balance",
    description: "Check workspace balance, tier, and remaining calls in this billing period.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "estimate_cost",
    description: "Estimate the cost of a given number of API calls for the current workspace.",
    inputSchema: {
      type: "object",
      properties: {
        call_count: { type: "number", description: "Number of API calls to estimate" },
      },
      required: ["call_count"],
    },
  },
  {
    name: "get_usage_summary",
    description: "Summary of recent workspace usage (calls, providers, cost) for the current billing period.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "check_workspace_status",
    description: "Health check for the current workspace (auth state, tier, gating, blockers).",
    inputSchema: { type: "object", properties: {} },
  },
  // ----- CHAINS -----
  {
    name: "get_chain_status",
    description: "Check the status of an async chain execution (returned from call_api with async: true).",
    inputSchema: {
      type: "object",
      properties: { chain_id: { type: "string", description: "Chain ID returned from async execution" } },
      required: ["chain_id"],
    },
  },
  {
    name: "resume_chain",
    description: "Resume a paused or partially-executed chain by id.",
    inputSchema: {
      type: "object",
      properties: { chain_id: { type: "string", description: "Chain ID to resume" } },
      required: ["chain_id"],
    },
  },
  // ----- CONTROL PLANE — MISSIONS -----
  {
    name: "list_mission_templates",
    description: "List available Control Plane mission templates and the parameters each accepts.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "start_mission",
    description:
      "Start a Control Plane mission — a structured, observable orchestration that runs on APIClaw's runtime. Use for multi-step tasks (e.g. 'generate a PRD'). Returns a missionId you can poll with mission_status. Legacy templates run through the hand-coded path; data-driven templates run through the v2 composition runner when template_version is pinned.",
    inputSchema: {
      type: "object",
      properties: {
        template: { type: "string", description: "Template slug — call list_mission_templates to see what is available." },
        template_version: { type: "number", description: "Optional pinned version for data-driven (v2) templates. Omit to use latest enabled." },
        params: { type: "object", description: "Template-specific parameters" },
      },
      required: ["template"],
    },
  },
  {
    name: "discover_missions",
    description:
      "Search mission templates by natural-language query. Returns ranked templates with slug, version, title, description, paramSchema, and match reasons. Ranking combines keyword relevance with live success-rate signal from providerHealth — templates whose steps call providers that have been degrading in the last 30 days slide down automatically. Use this to find the right template by intent before calling start_mission.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural-language description of what the agent wants done." },
        max_results: { type: "number", description: "Default 5, max 25.", default: 5 },
      },
      required: ["query"],
    },
  },
  {
    name: "mission_status",
    description: "Check status, audit events, cost, and final result for a mission started via start_mission.",
    inputSchema: {
      type: "object",
      properties: { mission_id: { type: "string", description: "Mission id from start_mission" } },
      required: ["mission_id"],
    },
  },
  {
    name: "list_missions",
    description: "List recent missions in the current workspace (most recent first).",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "number", description: "Max rows (default 20, max 200)" } },
    },
  },
] as const;

// ============================================
// DISPATCH
// ============================================
// Maps a tool name to the gateway HTTP call. All routes accept the bearer
// the remote-MCP runtime forwards via Authorization header, so workspace
// resolution + billing + observability happens server-side.

type DispatchContext = { bearer: string };

async function callGateway<T = unknown>(
  path: string,
  method: "GET" | "POST",
  ctx: DispatchContext,
  body?: unknown
): Promise<T> {
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ctx.bearer}`,
      "X-APIClaw-Source": "remote-mcp",
    },
  };
  if (method === "POST") init.body = JSON.stringify(body ?? {});
  const res = await fetch(`${SITE_URL}${path}`, init);
  const text = await res.text();
  let parsed: unknown = text;
  try { parsed = JSON.parse(text); } catch { /* keep as text */ }
  if (!res.ok) {
    throw new Error(typeof parsed === "string" ? parsed : JSON.stringify(parsed));
  }
  return parsed as T;
}

export async function dispatchCanonicalTool(
  name: string,
  args: Record<string, unknown>,
  ctx: DispatchContext
): Promise<unknown> {
  switch (name) {
    case "apiclaw_help":
      return {
        name: "APIClaw — The Control Plane for AI Agents",
        tools: CANONICAL_MCP_TOOLS.map((t) => ({ name: t.name, description: t.description })),
        docs: "https://apiclaw.cloud/docs",
        catalog: "https://apiclaw.cloud/catalog",
      };

    // Models
    case "list_models": {
      const q = args.provider ? `?provider=${encodeURIComponent(String(args.provider))}` : "";
      const res = await fetch(`${SITE_URL}/v1/models${q}`, {
        headers: {
          Authorization: `Bearer ${ctx.bearer}`,
          "X-APIClaw-Source": "remote-mcp",
        },
      });
      const text = await res.text();
      try { return JSON.parse(text); } catch { return text; }
    }

    // Discovery
    case "discover_apis":
      return callGateway("/v1/discover", "POST", ctx, {
        query: args.query ?? "",
        category: args.category,
        callable_only: args.callable_only ?? false,
        limit: args.max_results ?? 5,
      });
    case "get_api_details":
      return callGateway("/api/details", "POST", ctx, { name: args.name });
    case "list_categories":
      return callGateway("/v1/discover", "POST", ctx, { query: "", limit: 1 });
    case "list_connected":
      return callGateway("/api/balance", "POST", ctx);
    case "list_capabilities":
      return callGateway("/v1/execute", "POST", ctx, { capability: "__list__" });

    // Execution
    case "call_api":
      return callGateway("/v1/call", "POST", ctx, {
        api: args.api,
        path: args.path ?? "/",
        method: args.method ?? "GET",
        params: args.params,
        body: args.body,
      });
    case "capability":
      return callGateway("/v1/execute", "POST", ctx, {
        capability: args.capability,
        params: args.params ?? {},
      });

    // Billing / observability
    case "check_balance":
    case "get_usage_summary":
    case "check_workspace_status":
      return callGateway("/api/balance", "POST", ctx);
    case "estimate_cost":
      return {
        call_count: args.call_count,
        note: "Estimate is best-checked via current workspace tier on /api/balance and per-provider cost in /v1/discover.",
        balance_url: "/api/balance",
      };

    // Chains
    case "get_chain_status":
      return callGateway(`/v1/call`, "POST", ctx, {
        api: "__chain_status__",
        params: { chain_id: args.chain_id },
      });
    case "resume_chain":
      return callGateway(`/v1/call`, "POST", ctx, {
        api: "__chain_resume__",
        params: { chain_id: args.chain_id },
      });

    // Missions
    case "list_mission_templates":
      return callGateway("/v1/missions/templates", "GET", ctx);
    case "start_mission":
      return callGateway("/v1/missions/start", "POST", ctx, {
        template: args.template,
        templateVersion: typeof args.template_version === "number" ? args.template_version : undefined,
        params: args.params ?? {},
      });
    case "mission_status":
      return callGateway(`/v1/missions/${encodeURIComponent(String(args.mission_id))}`, "GET", ctx);
    case "list_missions":
      return callGateway(`/v1/missions?limit=${Math.min(Number(args.limit ?? 20), 200)}`, "GET", ctx);
    case "discover_missions": {
      const q = encodeURIComponent(String(args.query ?? ""));
      const max = Math.min(Math.max(Number(args.max_results ?? 5), 1), 25);
      return callGateway(`/v1/missions/discover?query=${q}&max_results=${max}`, "GET", ctx);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export const CANONICAL_TOOL_NAMES = CANONICAL_MCP_TOOLS.map((t) => t.name);
