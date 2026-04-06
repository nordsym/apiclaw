import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import {
  createCheckoutSession,
  createPortalSession,
  handleStripeWebhook,
  checkoutOptions,
  portalOptions,
  webhookOptions,
} from "./stripeActions";

const http = httpRouter();

// Provider catalog — all 19 Direct Call providers
interface ProviderMeta {
  name: string;
  description: string;
  category: string;
  pricing: string;
  regions: string[];
  tags: string[];
  isLLM: boolean; // can serve /v1/chat/completions
  envKey?: string; // env var name for API key
  baseUrl?: string; // chat completions base URL (LLM providers only)
  speed: "fast" | "medium" | "slow"; // latency tier
  costTier: "free" | "cheap" | "medium" | "expensive"; // relative cost
}

const PROVIDERS: Record<string, ProviderMeta> = {
  openrouter: {
    name: "OpenRouter",
    description: "Multi-model LLM API. Access GPT, Claude, Llama, Gemini, and 800+ models.",
    category: "llm",
    pricing: "Varies by model",
    regions: ["Global"],
    tags: ["llm", "ai", "gpt", "claude", "gemini", "llama"],
    isLLM: true,
    envKey: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    speed: "medium",
    costTier: "medium",
  },
  groq: {
    name: "Groq",
    description: "Ultra-fast LLM inference. Llama, Mixtral, Gemma at lightning speed.",
    category: "llm",
    pricing: "~$0.05-0.27/M tokens",
    regions: ["Global"],
    tags: ["llm", "fast", "llama", "mixtral", "gemma"],
    isLLM: true,
    envKey: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    speed: "fast",
    costTier: "cheap",
  },
  mistral: {
    name: "Mistral",
    description: "Mistral AI models. Efficient European LLMs with strong coding.",
    category: "llm",
    pricing: "~$0.10-2.00/M tokens",
    regions: ["EU", "Global"],
    tags: ["llm", "mistral", "eu", "coding", "embeddings"],
    isLLM: true,
    envKey: "MISTRAL_API_KEY",
    baseUrl: "https://api.mistral.ai/v1/chat/completions",
    speed: "fast",
    costTier: "cheap",
  },
  together: {
    name: "Together AI",
    description: "Open-source model inference. Llama, Qwen, DeepSeek at scale.",
    category: "llm",
    pricing: "~$0.10-0.90/M tokens",
    regions: ["Global"],
    tags: ["llm", "open-source", "llama", "qwen", "deepseek"],
    isLLM: true,
    envKey: "TOGETHER_API_KEY",
    baseUrl: "https://api.together.xyz/v1/chat/completions",
    speed: "fast",
    costTier: "cheap",
  },
  cohere: {
    name: "Cohere",
    description: "Enterprise LLM with strong RAG and reranking capabilities.",
    category: "llm",
    pricing: "~$0.15-2.50/M tokens",
    regions: ["Global"],
    tags: ["llm", "rag", "rerank", "enterprise", "embeddings"],
    isLLM: false, // Cohere uses non-OpenAI-compatible API format
    envKey: "COHERE_API_KEY",
    speed: "medium",
    costTier: "medium",
  },
  "46elks": {
    name: "46elks",
    description: "SMS API for EU/Nordics. GDPR compliant.",
    category: "sms",
    pricing: "~$0.035/SMS",
    regions: ["EU", "Nordic"],
    tags: ["sms", "eu", "gdpr", "nordic"],
    isLLM: false,
    envKey: "ELKS_API_KEY",
    speed: "fast",
    costTier: "cheap",
  },
  twilio: {
    name: "Twilio",
    description: "SMS and Voice API. Global coverage.",
    category: "sms",
    pricing: "~$0.04/SMS, ~$0.01/min voice",
    regions: ["Global"],
    tags: ["sms", "voice", "global"],
    isLLM: false,
    envKey: "TWILIO_AUTH_TOKEN",
    speed: "fast",
    costTier: "cheap",
  },
  resend: {
    name: "Resend",
    description: "Modern email API. Developer-friendly.",
    category: "email",
    pricing: "~$0.001/email",
    regions: ["Global"],
    tags: ["email", "transactional"],
    isLLM: false,
    envKey: "RESEND_API_KEY",
    speed: "fast",
    costTier: "free",
  },
  brave_search: {
    name: "Brave Search",
    description: "Privacy-focused web search API.",
    category: "search",
    pricing: "~$0.005/search",
    regions: ["Global"],
    tags: ["search", "web", "privacy"],
    isLLM: false,
    envKey: "BRAVE_API_KEY",
    speed: "fast",
    costTier: "cheap",
  },
  serper: {
    name: "Serper",
    description: "Google Search API. Fast SERP results for AI agents.",
    category: "search",
    pricing: "~$0.001/search",
    regions: ["Global"],
    tags: ["search", "google", "serp"],
    isLLM: false,
    envKey: "SERPER_API_KEY",
    speed: "fast",
    costTier: "cheap",
  },
  elevenlabs: {
    name: "ElevenLabs",
    description: "Text-to-speech API. High quality AI voices.",
    category: "tts",
    pricing: "~$0.0003/char",
    regions: ["Global"],
    tags: ["tts", "voice", "audio", "speech"],
    isLLM: false,
    envKey: "ELEVENLABS_API_KEY",
    speed: "medium",
    costTier: "medium",
  },
  deepgram: {
    name: "Deepgram",
    description: "Speech-to-text API. Fast, accurate transcription with Nova-3.",
    category: "stt",
    pricing: "~$0.0043/min",
    regions: ["Global"],
    tags: ["stt", "transcription", "voice", "audio"],
    isLLM: false,
    envKey: "DEEPGRAM_API_KEY",
    speed: "fast",
    costTier: "cheap",
  },
  assemblyai: {
    name: "AssemblyAI",
    description: "Speech-to-text with speaker diarization, summarization, and sentiment.",
    category: "stt",
    pricing: "~$0.01/min",
    regions: ["Global"],
    tags: ["stt", "transcription", "diarization", "sentiment"],
    isLLM: false,
    envKey: "ASSEMBLYAI_API_KEY",
    speed: "medium",
    costTier: "cheap",
  },
  replicate: {
    name: "Replicate",
    description: "Run AI models (Whisper, SDXL, Llama, Flux, etc). Pay per prediction.",
    category: "ai",
    pricing: "Varies by model",
    regions: ["Global"],
    tags: ["ai", "ml", "whisper", "image", "audio", "transcription"],
    isLLM: false,
    envKey: "REPLICATE_API_TOKEN",
    speed: "slow",
    costTier: "medium",
  },
  stability: {
    name: "Stability AI",
    description: "Image generation API. Stable Diffusion 3, SDXL.",
    category: "image",
    pricing: "~$0.03/image",
    regions: ["Global"],
    tags: ["image", "generation", "stable-diffusion", "sdxl"],
    isLLM: false,
    envKey: "STABILITY_API_KEY",
    speed: "slow",
    costTier: "medium",
  },
  firecrawl: {
    name: "Firecrawl",
    description: "Web scraping and crawling API. Extract clean data from any URL.",
    category: "scraping",
    pricing: "~$0.001/page",
    regions: ["Global"],
    tags: ["scraping", "web", "crawl", "extract"],
    isLLM: false,
    envKey: "FIRECRAWL_API_KEY",
    speed: "medium",
    costTier: "cheap",
  },
  github: {
    name: "GitHub",
    description: "GitHub API. Search repos, manage code, access developer data.",
    category: "code",
    pricing: "Free tier available",
    regions: ["Global"],
    tags: ["github", "code", "repos", "developer"],
    isLLM: false,
    envKey: "GITHUB_TOKEN",
    speed: "fast",
    costTier: "free",
  },
  e2b: {
    name: "E2B",
    description: "Secure code sandbox for AI agents. Run Python, shell in isolated environments.",
    category: "sandbox",
    pricing: "$0.000028/s (2 vCPU)",
    regions: ["Global"],
    tags: ["sandbox", "code", "python", "execution", "ai", "agents"],
    isLLM: false,
    envKey: "E2B_API_KEY",
    speed: "medium",
    costTier: "cheap",
  },
  apilayer: {
    name: "APILayer",
    description: "14 APIs: exchange rates, market data, aviation, PDF, screenshots, email/phone verification, VAT, news, scraping, and more.",
    category: "multi",
    pricing: "Free tier available, paid plans per API",
    regions: ["Global"],
    tags: ["exchange", "stocks", "aviation", "pdf", "screenshot", "verification", "vat", "news", "scraping"],
    isLLM: false,
    envKey: "APILAYER_API_KEY",
    speed: "medium",
    costTier: "cheap",
  },
};

// ==============================================
// INTELLIGENT LLM ROUTER
// ==============================================

// Model-to-provider mapping: which direct providers can serve which model patterns
const MODEL_PROVIDER_MAP: { pattern: RegExp; provider: string; nativeModel: string }[] = [
  // Groq-native models
  { pattern: /^(groq\/)?llama-3\.3-70b/i, provider: "groq", nativeModel: "llama-3.3-70b-versatile" },
  { pattern: /^(groq\/)?llama-3\.1-8b/i, provider: "groq", nativeModel: "llama-3.1-8b-instant" },
  { pattern: /^(groq\/)?gemma2?-9b/i, provider: "groq", nativeModel: "gemma2-9b-it" },
  { pattern: /^(groq\/)?mixtral-8x7b/i, provider: "groq", nativeModel: "mixtral-8x7b-32768" },
  // Mistral-native models
  { pattern: /^(mistralai\/)?mistral-small/i, provider: "mistral", nativeModel: "mistral-small-latest" },
  { pattern: /^(mistralai\/)?mistral-large/i, provider: "mistral", nativeModel: "mistral-large-latest" },
  { pattern: /^(mistralai\/)?mistral-medium/i, provider: "mistral", nativeModel: "mistral-medium-latest" },
  { pattern: /^(mistralai\/)?codestral/i, provider: "mistral", nativeModel: "codestral-latest" },
  { pattern: /^(mistralai\/)?pixtral/i, provider: "mistral", nativeModel: "pixtral-large-latest" },
  // Together-native models
  { pattern: /^(together\/)?meta-llama\/Llama-3\.3-70B/i, provider: "together", nativeModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  { pattern: /^(together\/)?Qwen\/Qwen2\.5-72B/i, provider: "together", nativeModel: "Qwen/Qwen2.5-72B-Instruct-Turbo" },
  { pattern: /^(together\/)?deepseek-ai\/DeepSeek-R1/i, provider: "together", nativeModel: "deepseek-ai/DeepSeek-R1" },
  { pattern: /^(together\/)?deepseek-ai\/DeepSeek-V3/i, provider: "together", nativeModel: "deepseek-ai/DeepSeek-V3" },
];

interface RoutingDecision {
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  reason: string;
  extraHeaders?: Record<string, string>;
}

function routeLLMRequest(
  requestedModel: string,
  settings: {
    routingMode: string;
    preferredProviders: string[];
    blockedProviders: string[];
    allowOpenRouterFallback: boolean;
  }
): RoutingDecision | null {
  // 1. Check direct provider matches for the requested model
  for (const mapping of MODEL_PROVIDER_MAP) {
    if (!mapping.pattern.test(requestedModel)) continue;
    if (settings.blockedProviders.includes(mapping.provider)) continue;

    const providerMeta = PROVIDERS[mapping.provider];
    if (!providerMeta?.isLLM || !providerMeta.envKey || !providerMeta.baseUrl) continue;

    const apiKey = process.env[providerMeta.envKey];
    if (!apiKey) continue;

    // For "highest_quality" mode, prefer OpenRouter (more model options)
    if (settings.routingMode === "highest_quality" && !settings.preferredProviders.includes(mapping.provider)) {
      continue;
    }

    return {
      provider: mapping.provider,
      model: mapping.nativeModel,
      baseUrl: providerMeta.baseUrl,
      apiKey,
      reason: `direct_${mapping.provider}`,
    };
  }

  // 2. Routing mode preferences for unknown models
  if (settings.routingMode === "fastest") {
    // Try Groq first (fastest inference), then Together, then Mistral
    for (const fastProvider of ["groq", "together", "mistral"]) {
      if (settings.blockedProviders.includes(fastProvider)) continue;
      const meta = PROVIDERS[fastProvider];
      if (!meta?.isLLM || !meta.envKey || !meta.baseUrl) continue;
      const key = process.env[meta.envKey];
      if (!key) continue;
      // Only route if the model looks like it belongs to this provider
      // Don't send anthropic/claude to groq
      if (requestedModel.includes("anthropic/") || requestedModel.includes("openai/") || requestedModel.includes("google/")) break;
      return {
        provider: fastProvider,
        model: requestedModel,
        baseUrl: meta.baseUrl,
        apiKey: key,
        reason: `fastest_mode_${fastProvider}`,
      };
    }
  }

  // 3. Preferred providers check
  for (const preferred of settings.preferredProviders) {
    if (settings.blockedProviders.includes(preferred)) continue;
    const meta = PROVIDERS[preferred];
    if (!meta?.isLLM || !meta.envKey || !meta.baseUrl) continue;
    const key = process.env[meta.envKey];
    if (!key) continue;
    return {
      provider: preferred,
      model: requestedModel,
      baseUrl: meta.baseUrl,
      apiKey: key,
      reason: `preferred_${preferred}`,
    };
  }

  // 4. Fallback to OpenRouter
  if (!settings.blockedProviders.includes("openrouter") && settings.allowOpenRouterFallback !== false) {
    const orKey = process.env.OPENROUTER_API_KEY;
    if (orKey) {
      return {
        provider: "openrouter",
        model: requestedModel,
        baseUrl: "https://openrouter.ai/api/v1/chat/completions",
        apiKey: orKey,
        reason: "openrouter_fallback",
        extraHeaders: {
          "HTTP-Referer": "https://apiclaw.cloud",
          "X-Title": "APIClaw Gateway",
        },
      };
    }
  }

  return null; // No provider available
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Helper for JSON responses
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// ============================================
// UNIFIED AUTH: resolves workspace from any auth method
// Priority: 1) Authorization: Bearer sk-claw-... (API key)
//           2) X-APIClaw-Identifier (legacy MCP workspace ID)
//           3) Anonymous (still allowed, just untracked)
// ============================================

async function resolveWorkspaceFromRequest(
  ctx: any,
  request: Request
): Promise<{ workspaceId?: string; keyId?: string; authMethod: "api-key" | "identifier" | "anonymous" }> {
  // 1. Check for API key auth (Bearer sk-claw-...)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer sk-claw-")) {
    const rawKey = authHeader.slice(7); // Remove "Bearer "
    try {
      const resolved = await ctx.runQuery(internal.apiKeys.resolveKey, { rawKey });
      if (resolved) {
        // Touch lastUsedAt (fire and forget)
        ctx.runMutation(api.apiKeys.touchKey, { keyId: resolved.keyId }).catch(() => {});
        return { workspaceId: resolved.workspaceId, keyId: resolved.keyId, authMethod: "api-key" };
      }
    } catch (e: any) {
      console.error("[Auth] API key resolution failed:", e.message);
    }
    // Invalid key - don't fall through to anonymous
    return { authMethod: "anonymous" };
  }

  // 2. Check for legacy identifier
  const identifier = request.headers.get("X-APIClaw-Identifier");
  if (identifier && !identifier.startsWith("anon:") && identifier !== "unknown" && identifier.length > 20) {
    return { workspaceId: identifier, authMethod: "identifier" };
  }

  // 3. Anonymous
  return { authMethod: "anonymous" };
}

// Helper to validate session and log API usage
async function validateAndLogProxyCall(
  ctx: any,
  request: Request,
  provider: string,
  action: string
): Promise<{ valid: boolean; workspaceId?: string; subagentId?: string; error?: string; authMethod?: string }> {
  const subagentId = request.headers.get("X-APIClaw-Subagent") || "main";

  // Resolve workspace from any auth method
  const auth = await resolveWorkspaceFromRequest(ctx, request);
  const resolvedWorkspaceId = auth.workspaceId;
  const identifier = request.headers.get("X-APIClaw-Identifier") || auth.workspaceId || "unknown";

  console.log("[Proxy] Call received", { provider, action, authMethod: auth.authMethod, workspaceId: resolvedWorkspaceId, subagentId });

  // ALWAYS log to analytics (even if identifier is missing)
  try {
    const result = await ctx.runMutation(api.analytics.log, {
      event: "api_call",
      provider,
      identifier: identifier,
      workspaceId: resolvedWorkspaceId as any,
      metadata: { action, subagentId, authMethod: auth.authMethod },
    });
    console.log("[Proxy] Analytics logged:", result);
  } catch (e: any) {
    console.error("[Proxy] Analytics logging failed:", e.message, e.stack);
  }

  // If we have a workspace, log and increment usage
  if (resolvedWorkspaceId) {
    try {
      await ctx.runMutation(api.logs.createProxyLog, {
        workspaceId: resolvedWorkspaceId as any,
        provider,
        action,
        subagentId,
      });

      await ctx.runMutation(api.workspaces.incrementUsage, {
        workspaceId: resolvedWorkspaceId as any,
      });

      console.log("[Proxy] Workspace logged for:", resolvedWorkspaceId);
      return { valid: true, workspaceId: resolvedWorkspaceId, subagentId, authMethod: auth.authMethod };
    } catch (e: any) {
      console.error("[Proxy] Workspace logging failed:", e.message);
    }
  }

  // Return success regardless (don't block API calls)
  return { valid: true, subagentId, authMethod: auth.authMethod };
}

// OPTIONS handler for CORS
http.route({
  path: "/api/discover",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

http.route({
  path: "/api/details",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

http.route({
  path: "/api/balance",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

http.route({
  path: "/api/purchase",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

http.route({
  path: "/admin/grant-credits",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// Discover APIs
http.route({
  path: "/api/discover",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const startTime = Date.now();
      const body = await request.json();
      const query = (body.query || "").toLowerCase();
      
      // Get optional auth context
      const sessionToken = request.headers.get("X-APIClaw-Session");
      const userAgent = request.headers.get("User-Agent");

      const results = Object.entries(PROVIDERS)
        .filter(([id, provider]) => {
          if (!query) return true;
          return (
            provider.name.toLowerCase().includes(query) ||
            provider.description.toLowerCase().includes(query) ||
            provider.category.toLowerCase().includes(query) ||
            provider.tags.some((tag) => tag.includes(query))
          );
        })
        .map(([id, provider]) => ({
          providerId: id,
          ...provider,
        }));

      const responseTimeMs = Date.now() - startTime;

      // Log the search (fire and forget)
      if (query) {
        ctx.runMutation(internal.searchLogs.logSearch, {
          query: body.query || "", // Original query (not lowercased)
          resultsCount: results.length,
          matchedProviders: results.map(r => r.providerId),
          sessionToken: sessionToken || undefined,
          userAgent: userAgent || undefined,
          responseTimeMs,
        }).catch(() => {}); // Ignore errors, don't block response
      }

      return jsonResponse({ providers: results, total: results.length });
    } catch (e) {
      return jsonResponse({ error: "Invalid request" }, 400);
    }
  }),
});

// Get provider details
http.route({
  path: "/api/details",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { providerId } = body;

      if (!providerId) {
        return jsonResponse({ error: "providerId required" }, 400);
      }

      const provider = PROVIDERS[providerId as keyof typeof PROVIDERS];
      if (!provider) {
        return jsonResponse({ error: "Provider not found" }, 404);
      }

      return jsonResponse({
        providerId,
        ...provider,
        creditsPerDollar: getCreditsPerDollar(providerId),
        documentation: `https://apiclaw.com/docs/${providerId}`,
      });
    } catch (e) {
      return jsonResponse({ error: "Invalid request" }, 400);
    }
  }),
});

// Check balance
http.route({
  path: "/api/balance",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const agentId = url.searchParams.get("agentId");

    if (!agentId) {
      return jsonResponse({ error: "agentId required" }, 400);
    }

    const credits = await ctx.runQuery(api.credits.getAgentCredits, { agentId });
    
    if (!credits) {
      return jsonResponse({
        agentId,
        balanceUsd: 0,
        currency: "USD",
        message: "No account found. Top up to get started!",
      });
    }

    return jsonResponse({
      agentId: credits.agentId,
      balanceUsd: credits.balanceUsd,
      currency: credits.currency,
    });
  }),
});

// Purchase API access
http.route({
  path: "/api/purchase",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { agentId, providerId, amountUsd } = body;

      if (!agentId || !providerId || !amountUsd) {
        return jsonResponse(
          { error: "agentId, providerId, and amountUsd required" },
          400
        );
      }

      if (amountUsd < 1 || amountUsd > 1000) {
        return jsonResponse(
          { error: "amountUsd must be between 1 and 1000" },
          400
        );
      }

      const provider = PROVIDERS[providerId as keyof typeof PROVIDERS];
      if (!provider) {
        return jsonResponse({ error: "Provider not found" }, 404);
      }

      // Check balance first
      const credits = await ctx.runQuery(api.credits.getAgentCredits, { agentId });
      if (!credits || credits.balanceUsd < amountUsd) {
        return jsonResponse(
          {
            error: "Insufficient balance",
            currentBalance: credits?.balanceUsd || 0,
            required: amountUsd,
          },
          402
        );
      }

      // Execute purchase
      const purchase = await ctx.runMutation(api.purchases.purchaseAccess, {
        agentId,
        providerId,
        amountUsd,
        credentials: generateCredentials(providerId),
      });

      if (!purchase) {
        return jsonResponse({ error: "Purchase failed" }, 500);
      }

      return jsonResponse({
        success: true,
        purchase: {
          id: purchase._id,
          providerId: purchase.providerId,
          amountUsd: purchase.amountUsd,
          creditsGranted: purchase.creditsGranted,
          status: purchase.status,
        },
        message: `Successfully purchased $${amountUsd} of ${provider.name} credits`,
      });
    } catch (e: any) {
      return jsonResponse({ error: e.message || "Purchase failed" }, 400);
    }
  }),
});

// Admin: Grant credits
http.route({
  path: "/admin/grant-credits",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { agentId, amount, reason } = body;

      if (!agentId || !amount) {
        return jsonResponse({ error: "agentId and amount required" }, 400);
      }

      // TODO: Add admin auth check here
      // For now, allow grants (this is for Hivr integration)

      const result = await ctx.runMutation(api.credits.addCredits, {
        agentId,
        amountUsd: amount,
        source: reason || "admin_grant",
      });

      return jsonResponse({
        success: true,
        agentId,
        credited: amount,
        newBalance: result?.balanceUsd,
        reason,
      });
    } catch (e: any) {
      return jsonResponse({ error: e.message || "Grant failed" }, 400);
    }
  }),
});

// Helper functions
function getCreditsPerDollar(providerId: string): number {
  const rates: Record<string, number> = {
    "46elks": 30,
    twilio: 25,
    resend: 1000,
    brave_search: 200,
    openrouter: 100,
    elevenlabs: 3333,
  };
  return rates[providerId] || 100;
}

function generateCredentials(providerId: string): object {
  // In production, this would generate or retrieve actual API keys
  // For now, return placeholder indicating how to use
  return {
    type: "apiclaw_proxy",
    endpoint: `https://brilliant-puffin-712.convex.site/proxy/${providerId}`,
    note: "Use APIClaw proxy endpoint. Credentials managed automatically.",
  };
}

export default http;

// ==============================================
// DIRECT CALL PROXY ENDPOINTS
// ==============================================

// OpenRouter proxy
http.route({
  path: "/proxy/openrouter",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate session and log usage
    await validateAndLogProxyCall(ctx, request, "openrouter", "chat");
    
    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_KEY) {
      return jsonResponse({ error: "OpenRouter not configured" }, 500);
    }

    try {
      const body = await request.json();
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://apiclaw.cloud",
          "X-Title": "APIClaw",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

// Brave Search proxy
http.route({
  path: "/proxy/brave_search",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate session and log usage
    await validateAndLogProxyCall(ctx, request, "brave_search", "search");
    
    const BRAVE_KEY = process.env.BRAVE_API_KEY;
    if (!BRAVE_KEY) {
      return jsonResponse({ error: "Brave Search not configured" }, 500);
    }

    try {
      const body = await request.json();
      const { query, count = 10 } = body;

      const url = new URL("https://api.search.brave.com/res/v1/web/search");
      url.searchParams.set("q", query);
      url.searchParams.set("count", String(count));

      const response = await fetch(url.toString(), {
        headers: { "X-Subscription-Token": BRAVE_KEY },
      });

      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

// Resend email proxy
http.route({
  path: "/proxy/resend",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate session and log usage
    await validateAndLogProxyCall(ctx, request, "resend", "send_email");
    
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) {
      return jsonResponse({ error: "Resend not configured" }, 500);
    }

    try {
      const body = await request.json();

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

// ElevenLabs TTS proxy
http.route({
  path: "/proxy/elevenlabs",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate session and log usage
    await validateAndLogProxyCall(ctx, request, "elevenlabs", "text_to_speech");
    
    const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_KEY) {
      return jsonResponse({ error: "ElevenLabs not configured" }, 500);
    }

    try {
      const body = await request.json();
      const { text, voice_id = "21m00Tcm4TlvDq8ikWAM" } = body;

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return jsonResponse({ error }, response.status);
      }

      // Return audio as base64
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      
      return jsonResponse({
        audio_base64: base64,
        content_type: "audio/mpeg",
      });
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/proxy/openrouter",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

http.route({
  path: "/proxy/brave_search",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

http.route({
  path: "/proxy/resend",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

http.route({
  path: "/proxy/elevenlabs",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// 46elks SMS proxy
http.route({
  path: "/proxy/46elks",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate session and log usage
    await validateAndLogProxyCall(ctx, request, "46elks", "send_sms");
    
    const ELKS_USER = process.env.ELKS_API_USER;
    const ELKS_PASS = process.env.ELKS_API_PASSWORD;
    if (!ELKS_USER || !ELKS_PASS) {
      return jsonResponse({ error: "46elks not configured" }, 500);
    }

    try {
      const body = await request.json();
      const { to, message, from = "APIClaw" } = body;

      const auth = btoa(`${ELKS_USER}:${ELKS_PASS}`);

      const response = await fetch("https://api.46elks.com/a1/sms", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ from, to, message }),
      });

      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

// Twilio SMS proxy
http.route({
  path: "/proxy/twilio",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate session and log usage
    await validateAndLogProxyCall(ctx, request, "twilio", "send_sms");
    
    const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    if (!TWILIO_SID || !TWILIO_TOKEN) {
      return jsonResponse({ error: "Twilio not configured" }, 500);
    }

    try {
      const body = await request.json();
      const { to, message, from } = body;

      if (!from) {
        return jsonResponse({ error: "Twilio requires 'from' number" }, 400);
      }

      const auth = btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: to, From: from, Body: message }),
        }
      );

      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

// CORS for new endpoints
http.route({
  path: "/proxy/46elks",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

http.route({
  path: "/proxy/twilio",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// GitHub API proxy
http.route({
  path: "/proxy/github",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate session and log usage
    const body = await request.json();
    const action = body.action || "search_repos";
    await validateAndLogProxyCall(ctx, request, "github", action);
    
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return jsonResponse({ error: "GitHub not configured" }, 500);
    }

    try {
      const { action, ...params } = body;
      let url: string;
      let method = "GET";
      let fetchBody: string | undefined;

      // Route based on action
      switch (action) {
        case "search_repos":
          const { query, sort = "stars", limit = 10 } = params;
          url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&per_page=${limit}`;
          break;
        
        case "get_repo":
          const { owner, repo } = params;
          url = `https://api.github.com/repos/${owner}/${repo}`;
          break;
        
        case "list_issues":
          const { owner: issueOwner, repo: issueRepo, state = "open", limit: issueLimit = 10 } = params;
          url = `https://api.github.com/repos/${issueOwner}/${issueRepo}/issues?state=${state}&per_page=${issueLimit}`;
          break;
        
        case "create_issue":
          const { owner: createOwner, repo: createRepo, title, body: issueBody = "" } = params;
          url = `https://api.github.com/repos/${createOwner}/${createRepo}/issues`;
          method = "POST";
          fetchBody = JSON.stringify({ title, body: issueBody });
          break;
        
        case "get_file":
          const { owner: fileOwner, repo: fileRepo, path } = params;
          url = `https://api.github.com/repos/${fileOwner}/${fileRepo}/contents/${path}`;
          break;
        
        default:
          return jsonResponse({ error: `Unknown action: ${action}` }, 400);
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json",
          "User-Agent": "APIClaw",
          ...(fetchBody ? { "Content-Type": "application/json" } : {}),
        },
        ...(fetchBody ? { body: fetchBody } : {}),
      });

      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/proxy/github",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// SERPER (Google Search) PROXY
// ==============================================
http.route({
  path: "/proxy/serper",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    await validateAndLogProxyCall(ctx, request, "serper", "search");
    const SERPER_KEY = process.env.SERPER_API_KEY;
    if (!SERPER_KEY) {
      return jsonResponse({ error: "Serper not configured" }, 500);
    }
    try {
      const body = await request.json();
      const { query, q, num = 10, gl = "us", hl = "en" } = body;
      const searchQuery = query || q;
      if (!searchQuery) {
        return jsonResponse({ error: "query required" }, 400);
      }
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: searchQuery, num, gl, hl }),
      });
      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/proxy/serper",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// FIRECRAWL (Web Scraping) PROXY
// ==============================================
http.route({
  path: "/proxy/firecrawl",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    await validateAndLogProxyCall(ctx, request, "firecrawl", "scrape");
    const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;
    if (!FIRECRAWL_KEY) {
      return jsonResponse({ error: "Firecrawl not configured" }, 500);
    }
    try {
      const body = await request.json();
      const { url, formats = ["markdown"], onlyMainContent = true } = body;
      if (!url) {
        return jsonResponse({ error: "url required" }, 400);
      }
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, formats, onlyMainContent }),
      });
      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/proxy/firecrawl",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// GROQ (LLM) PROXY
// ==============================================
http.route({
  path: "/proxy/groq",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    await validateAndLogProxyCall(ctx, request, "groq", "chat");
    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
      return jsonResponse({ error: "Groq not configured" }, 500);
    }
    try {
      const body = await request.json();
      const { model = "llama-3.3-70b-versatile", messages, temperature = 0.7, max_tokens = 1024 } = body;
      if (!messages) {
        return jsonResponse({ error: "messages required" }, 400);
      }
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens }),
      });
      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/proxy/groq",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// MISTRAL (LLM/Embeddings) PROXY
// ==============================================
http.route({
  path: "/proxy/mistral",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    await validateAndLogProxyCall(ctx, request, "mistral", "chat");
    const MISTRAL_KEY = process.env.MISTRAL_API_KEY;
    if (!MISTRAL_KEY) {
      return jsonResponse({ error: "Mistral not configured" }, 500);
    }
    try {
      const body = await request.json();
      const { model = "mistral-small-latest", messages, temperature = 0.7, max_tokens = 1024 } = body;
      if (!messages) {
        return jsonResponse({ error: "messages required" }, 400);
      }
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MISTRAL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens }),
      });
      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/proxy/mistral",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// COHERE (LLM/Rerank) PROXY
// ==============================================
http.route({
  path: "/proxy/cohere",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    await validateAndLogProxyCall(ctx, request, "cohere", "chat");
    const COHERE_KEY = process.env.COHERE_API_KEY;
    if (!COHERE_KEY) {
      return jsonResponse({ error: "Cohere not configured" }, 500);
    }
    try {
      const body = await request.json();
      const { model = "command-a-03-2025", message, chat_history, temperature = 0.7, max_tokens = 1024 } = body;
      if (!message) {
        return jsonResponse({ error: "message required" }, 400);
      }
      const response = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${COHERE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, message, chat_history, temperature, max_tokens }),
      });
      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/proxy/cohere",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// REPLICATE (ML Models) PROXY
// ==============================================
http.route({
  path: "/proxy/replicate",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    await validateAndLogProxyCall(ctx, request, "replicate", "prediction");
    const REPLICATE_KEY = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_KEY) {
      return jsonResponse({ error: "Replicate not configured" }, 500);
    }
    try {
      const body = await request.json();
      const { model, input, version } = body;
      if (!model && !version) {
        return jsonResponse({ error: "model or version required" }, 400);
      }
      const endpoint = version
        ? "https://api.replicate.com/v1/predictions"
        : `https://api.replicate.com/v1/models/${model}/predictions`;
      const payload = version ? { version, input } : { input };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${REPLICATE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/proxy/replicate",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// DEEPGRAM (Speech-to-Text) PROXY
// ==============================================
http.route({
  path: "/proxy/deepgram",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    await validateAndLogProxyCall(ctx, request, "deepgram", "transcribe");
    const DEEPGRAM_KEY = process.env.DEEPGRAM_API_KEY;
    if (!DEEPGRAM_KEY) {
      return jsonResponse({ error: "Deepgram not configured" }, 500);
    }
    try {
      const body = await request.json();
      const { url, model = "nova-3", language = "en", smart_format = true } = body;
      if (!url) {
        return jsonResponse({ error: "url required (audio file URL)" }, 400);
      }
      const params = new URLSearchParams({
        model,
        language,
        smart_format: String(smart_format),
      });
      const response = await fetch(
        `https://api.deepgram.com/v1/listen?${params}`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${DEEPGRAM_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        }
      );
      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/proxy/deepgram",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// E2B (Code Sandbox) PROXY
// ==============================================
http.route({
  path: "/proxy/e2b",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    await validateAndLogProxyCall(ctx, request, "e2b", "execute");
    const E2B_KEY = process.env.E2B_API_KEY;
    if (!E2B_KEY) {
      return jsonResponse({ error: "E2B not configured" }, 500);
    }
    try {
      const body = await request.json();
      const { code, language = "python", template = "base" } = body;
      if (!code) {
        return jsonResponse({ error: "code required" }, 400);
      }
      const response = await fetch("https://api.e2b.dev/sandboxes", {
        method: "POST",
        headers: {
          "X-API-Key": E2B_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ templateID: template, metadata: { language } }),
      });
      const sandbox = await response.json();
      if (!response.ok) {
        return jsonResponse(sandbox, response.status);
      }
      const execResponse = await fetch(
        `https://api.e2b.dev/sandboxes/${sandbox.sandboxID}/code/execution`,
        {
          method: "POST",
          headers: {
            "X-API-Key": E2B_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, language }),
        }
      );
      const result = await execResponse.json();
      return jsonResponse(result, execResponse.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/proxy/e2b",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// TOGETHER AI (Open-source LLM Inference) PROXY
// ==============================================
http.route({
  path: "/proxy/together",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    await validateAndLogProxyCall(ctx, request, "together", "chat");
    const TOGETHER_KEY = process.env.TOGETHER_API_KEY;
    if (!TOGETHER_KEY) {
      return jsonResponse({ error: "Together AI not configured" }, 500);
    }
    try {
      const body = await request.json();
      const { model = "meta-llama/Llama-3.3-70B-Instruct-Turbo", messages, temperature = 0.7, max_tokens = 1024 } = body;
      if (!messages || !Array.isArray(messages)) {
        return jsonResponse({ error: "messages array required" }, 400);
      }
      const response = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOGETHER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens }),
      });
      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/proxy/together",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// STABILITY AI (Image Generation) PROXY
// ==============================================
http.route({
  path: "/proxy/stability",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    await validateAndLogProxyCall(ctx, request, "stability", "generate");
    const STABILITY_KEY = process.env.STABILITY_API_KEY;
    if (!STABILITY_KEY) {
      return jsonResponse({ error: "Stability AI not configured" }, 500);
    }
    try {
      const body = await request.json();
      const { prompt, model = "sd3.5-large", output_format = "png", aspect_ratio = "1:1" } = body;
      if (!prompt) {
        return jsonResponse({ error: "prompt required" }, 400);
      }
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("output_format", output_format);
      formData.append("aspect_ratio", aspect_ratio);
      const response = await fetch(
        `https://api.stability.ai/v2beta/stable-image/generate/${model}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${STABILITY_KEY}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );
      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/proxy/stability",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// ASSEMBLYAI (Audio Intelligence) PROXY
// ==============================================
http.route({
  path: "/proxy/assemblyai",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    await validateAndLogProxyCall(ctx, request, "assemblyai", "transcribe");
    const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY;
    if (!ASSEMBLYAI_KEY) {
      return jsonResponse({ error: "AssemblyAI not configured" }, 500);
    }
    try {
      const body = await request.json();
      const { audio_url, language_detection = true, speaker_labels = true } = body;
      if (!audio_url) {
        return jsonResponse({ error: "audio_url required" }, 400);
      }
      const response = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
          Authorization: ASSEMBLYAI_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audio_url, language_detection, speaker_labels }),
      });
      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/proxy/assemblyai",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// APILAYER (Multi-API: Exchange, Stocks, Aviation, etc.) PROXY
// ==============================================
http.route({
  path: "/proxy/apilayer",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    await validateAndLogProxyCall(ctx, request, "apilayer", "call");
    const APILAYER_KEY = process.env.APILAYER_API_KEY;
    if (!APILAYER_KEY) {
      return jsonResponse({ error: "APILayer not configured" }, 500);
    }
    try {
      const body = await request.json();
      const { service, endpoint, params = {} } = body;
      if (!service || !endpoint) {
        return jsonResponse({ error: "service and endpoint required (e.g. service:'exchangerates', endpoint:'/latest')" }, 400);
      }
      const queryString = new URLSearchParams(params).toString();
      const url = `https://api.apilayer.com/${service}${endpoint}${queryString ? '?' + queryString : ''}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          apikey: APILAYER_KEY,
        },
      });
      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/proxy/apilayer",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// WORKSPACE / MAGIC LINK ENDPOINTS
// ==============================================

// Create magic link and send email
http.route({
  path: "/workspace/magic-link",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { email, fingerprint } = body;

      if (!email || !email.includes("@")) {
        return jsonResponse({ error: "Valid email required" }, 400);
      }

      // Create magic link
      const result = await ctx.runMutation(api.workspaces.createMagicLink, {
        email: email.toLowerCase(),
        fingerprint,
      });

      // Send email directly - SIMPLE HTML (complex tables get stripped by Gmail)
      const verifyUrl = `https://apiclaw.cloud/auth/verify?token=${result.token}`;
      const html = `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
<h1>🦞 APIClaw</h1>
<h2>An AI Agent Wants to Connect</h2>
<p>Click below to verify your email and activate your workspace.</p>
<p><a href="${verifyUrl}" style="background:#ef4444;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;">Verify Email</a></p>
<p style="color:#666;font-size:13px;">Free tier: 50 API calls. This link expires in 1 hour.</p>
<p style="color:#999;font-size:11px;">Or copy this link: ${verifyUrl}</p>
</div>`;
      
      const RESEND_KEY = process.env.RESEND_API_KEY;
      if (!RESEND_KEY) {
        console.error("RESEND_API_KEY not configured");
        return jsonResponse({ error: "Email service not configured" }, 500);
      }
      
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "APIClaw <noreply@apiclaw.cloud>",
          to: email.toLowerCase(),
          subject: "🦞 Verify Your Email — APIClaw",
          html: html,
        }),
      });
      
      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error("Resend error:", emailResponse.status, errorText);
        return jsonResponse({ error: "Failed to send email", details: errorText }, 500);
      }
      
      const emailResult = await emailResponse.json();
      console.log("Email sent successfully:", emailResult.id);

      return jsonResponse({
        success: true,
        token: result.token,
        expiresAt: result.expiresAt,
        message: "Magic link sent! Check your email.",
        emailId: emailResult.id,
      });
    } catch (e: any) {
      console.error("Magic link error:", e);
      return jsonResponse({ error: e.message || "Failed to create magic link" }, 500);
    }
  }),
});

http.route({
  path: "/workspace/magic-link",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// Poll magic link status (for agents to check if user clicked)
http.route({
  path: "/workspace/poll",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return jsonResponse({ error: "token required" }, 400);
    }

    const result = await ctx.runQuery(api.workspaces.pollMagicLink, { token });
    return jsonResponse(result);
  }),
});

http.route({
  path: "/workspace/poll",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// Verify session token
http.route({
  path: "/workspace/verify-session",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const sessionToken = url.searchParams.get("sessionToken");

    if (!sessionToken) {
      return jsonResponse({ error: "sessionToken required" }, 400);
    }

    const result = await ctx.runQuery(api.workspaces.verifySession, { sessionToken });
    
    if (!result) {
      return jsonResponse({ error: "Invalid or expired session" }, 401);
    }

    return jsonResponse(result);
  }),
});

http.route({
  path: "/workspace/verify-session",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// Get workspace by email
http.route({
  path: "/workspace/by-email",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return jsonResponse({ error: "email required" }, 400);
    }

    const result = await ctx.runQuery(api.workspaces.getByEmail, { email });
    
    if (!result) {
      return jsonResponse({ exists: false });
    }

    return jsonResponse({ exists: true, workspace: result });
  }),
});

http.route({
  path: "/workspace/by-email",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// Send reminder email
http.route({
  path: "/workspace/send-reminder",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { email, token } = body;

      if (!email || !token) {
        return jsonResponse({ error: "email and token required" }, 400);
      }

      await ctx.runAction(api.email.sendReminderEmail, { email, token });
      return jsonResponse({ success: true });
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
    }
  }),
});

http.route({
  path: "/workspace/send-reminder",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// STRIPE BILLING ENDPOINTS
// ==============================================

// Create checkout session
http.route({
  path: "/api/billing/checkout",
  method: "POST",
  handler: createCheckoutSession,
});

http.route({
  path: "/api/billing/checkout",
  method: "OPTIONS",
  handler: checkoutOptions,
});

// Create billing portal session
http.route({
  path: "/api/billing/portal",
  method: "POST",
  handler: createPortalSession,
});

http.route({
  path: "/api/billing/portal",
  method: "OPTIONS",
  handler: portalOptions,
});

// Stripe webhook handler
http.route({
  path: "/api/webhooks/stripe",
  method: "POST",
  handler: handleStripeWebhook,
});

http.route({
  path: "/api/webhooks/stripe",
  method: "OPTIONS",
  handler: webhookOptions,
});

// Test endpoint to debug logging
http.route({
  path: "/proxy/test-logging",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const identifier = request.headers.get("X-APIClaw-Identifier");

    try {
      const logId = await ctx.runMutation(api.analytics.log, {
        event: "test_endpoint",
        provider: "test",
        identifier: identifier || "test",
        metadata: { test: true },
      });

      return jsonResponse({
        success: true,
        identifier,
        logId,
        message: "Logged successfully"
      });
    } catch (e: any) {
      return jsonResponse({
        success: false,
        error: e.message,
        stack: e.stack
      }, 500);
    }
  }),
});

// ==============================================
// GATEWAY v1 — Unified API Layer for AI Agents
// ==============================================
// OpenAI-compatible /v1/chat/completions endpoint.
// Accepts: Authorization: Bearer sk-claw-...
// Routes to the best available LLM provider (OpenRouter by default).
// This is what OpenClaw and any agent configures as their API endpoint.
// ==============================================

// Helper: extract Bearer token from Authorization header
function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

// Helper: require API key auth, return 401 if missing
async function requireApiKeyAuth(
  ctx: any,
  request: Request
): Promise<{ workspaceId: string; keyId: string } | Response> {
  const auth = await resolveWorkspaceFromRequest(ctx, request);
  if (auth.authMethod !== "api-key" || !auth.workspaceId || !auth.keyId) {
    return jsonResponse(
      {
        error: {
          message: "Invalid API key. Generate one at https://apiclaw.cloud/workspace?tab=api-keys",
          type: "invalid_api_key",
          code: "invalid_api_key",
        },
      },
      401
    );
  }
  return { workspaceId: auth.workspaceId, keyId: auth.keyId };
}

// /v1/chat/completions — OpenAI-compatible LLM gateway with intelligent routing
http.route({
  path: "/v1/chat/completions",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();

    // Require API key auth
    const authResult = await requireApiKeyAuth(ctx, request);
    if (authResult instanceof Response) return authResult;
    const { workspaceId } = authResult;

    // Parse body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: { message: "Invalid JSON body", type: "invalid_request_error" } }, 400);
    }

    const { model, messages, stream, ...rest } = body;
    if (!messages || !Array.isArray(messages)) {
      return jsonResponse({ error: { message: "messages array is required", type: "invalid_request_error" } }, 400);
    }

    // Request-level overrides (X-APIClaw-Route header)
    const routeOverride = request.headers.get("X-APIClaw-Route"); // e.g. "fastest" or "groq"

    // Load workspace settings
    let settings: {
      routingMode: string;
      defaultModel: string | null;
      preferredProviders: string[];
      blockedProviders: string[];
      allowOpenRouterFallback: boolean;
    };
    try {
      settings = await ctx.runQuery(internal.workspaceSettings.getForRouting, { workspaceId });
    } catch {
      settings = {
        routingMode: "balanced",
        defaultModel: null,
        preferredProviders: [],
        blockedProviders: [],
        allowOpenRouterFallback: true,
      };
    }

    // Apply request-level overrides
    const effectiveRoutingMode = routeOverride && ["best_price", "highest_quality", "fastest", "balanced"].includes(routeOverride)
      ? routeOverride
      : settings.routingMode;

    // If routeOverride is a provider name, add it as preferred
    const effectivePreferred = routeOverride && PROVIDERS[routeOverride]?.isLLM
      ? [routeOverride, ...settings.preferredProviders]
      : settings.preferredProviders;

    const effectiveModel = model || settings.defaultModel || "anthropic/claude-sonnet-4-6";

    // Route the request
    const route = routeLLMRequest(effectiveModel, {
      routingMode: effectiveRoutingMode,
      preferredProviders: effectivePreferred,
      blockedProviders: settings.blockedProviders,
      allowOpenRouterFallback: settings.allowOpenRouterFallback,
    });

    if (!route) {
      return jsonResponse({ error: { message: "No LLM provider available. Check workspace settings.", type: "server_error" } }, 503);
    }

    // Log usage
    try {
      await ctx.runMutation(api.analytics.log, {
        event: "api_call",
        provider: "gateway",
        identifier: workspaceId,
        workspaceId: workspaceId as any,
        metadata: {
          action: "chat_completions",
          model: effectiveModel,
          routedTo: route.provider,
          routeReason: route.reason,
          authMethod: "api-key",
        },
      });
      await ctx.runMutation(api.logs.createProxyLog, {
        workspaceId: workspaceId as any,
        provider: route.provider,
        action: "chat_completions",
        subagentId: request.headers.get("X-APIClaw-Subagent") || "main",
      });
      await ctx.runMutation(api.workspaces.incrementUsage, {
        workspaceId: workspaceId as any,
      });
    } catch (e: any) {
      console.error("[Gateway] Logging failed:", e.message);
    }

    // Forward to the chosen provider
    try {
      const requestBody = {
        model: route.model,
        messages,
        stream: stream || false,
        ...rest,
      };

      const headers: Record<string, string> = {
        "Authorization": `Bearer ${route.apiKey}`,
        "Content-Type": "application/json",
        ...(route.extraHeaders || {}),
      };

      const response = await fetch(route.baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      // For streaming responses, proxy the stream directly
      if (stream && response.body) {
        return new Response(response.body, {
          status: response.status,
          headers: {
            "Content-Type": response.headers.get("Content-Type") || "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            ...corsHeaders,
          },
        });
      }

      // Non-streaming: return JSON
      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      // Add APIClaw metadata
      if (data && typeof data === "object") {
        (data as any)._apiclaw = {
          latencyMs,
          provider: route.provider,
          routeReason: route.reason,
          model: route.model,
          gateway: "v1",
        };
      }

      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: { message: e.message, type: "server_error" } }, 500);
    }
  }),
});

http.route({
  path: "/v1/chat/completions",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// /v1/models — List available models through APIClaw
http.route({
  path: "/v1/models",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // API key auth optional for models listing
    const models = [
      // OpenRouter models (main LLM backbone)
      { id: "anthropic/claude-sonnet-4-6", object: "model", owned_by: "anthropic", via: "openrouter" },
      { id: "anthropic/claude-haiku-3.5", object: "model", owned_by: "anthropic", via: "openrouter" },
      { id: "anthropic/claude-opus-4", object: "model", owned_by: "anthropic", via: "openrouter" },
      { id: "openai/gpt-4o", object: "model", owned_by: "openai", via: "openrouter" },
      { id: "openai/gpt-4o-mini", object: "model", owned_by: "openai", via: "openrouter" },
      { id: "openai/o3-mini", object: "model", owned_by: "openai", via: "openrouter" },
      { id: "google/gemini-2.5-pro-preview", object: "model", owned_by: "google", via: "openrouter" },
      { id: "google/gemini-2.5-flash-preview", object: "model", owned_by: "google", via: "openrouter" },
      { id: "meta-llama/llama-3.3-70b-instruct", object: "model", owned_by: "meta", via: "openrouter" },
      { id: "mistralai/mistral-large-latest", object: "model", owned_by: "mistral", via: "openrouter" },
      { id: "deepseek/deepseek-r1", object: "model", owned_by: "deepseek", via: "openrouter" },
      { id: "deepseek/deepseek-chat", object: "model", owned_by: "deepseek", via: "openrouter" },
      { id: "qwen/qwen-2.5-72b-instruct", object: "model", owned_by: "qwen", via: "openrouter" },
    ];

    return jsonResponse({
      object: "list",
      data: models,
      _apiclaw: {
        gateway: "v1",
        note: "These models are available through APIClaw's unified gateway. All 800+ OpenRouter models are accessible by ID.",
        non_llm_apis: Object.keys(PROVIDERS).length + " additional APIs available (SMS, email, search, TTS, code execution, scraping, and more)",
      },
    });
  }),
});

http.route({
  path: "/v1/models",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});
