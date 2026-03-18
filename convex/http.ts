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

// Provider catalog
const PROVIDERS = {
  "46elks": {
    name: "46elks",
    description: "SMS API for EU/Nordics. GDPR compliant.",
    category: "sms",
    pricing: "~$0.035/SMS",
    regions: ["EU", "Nordic"],
    tags: ["sms", "eu", "gdpr", "nordic"],
  },
  twilio: {
    name: "Twilio",
    description: "SMS and Voice API. Global coverage.",
    category: "sms",
    pricing: "~$0.04/SMS, ~$0.01/min voice",
    regions: ["Global"],
    tags: ["sms", "voice", "global"],
  },
  resend: {
    name: "Resend",
    description: "Modern email API. Developer-friendly.",
    category: "email",
    pricing: "~$0.001/email",
    regions: ["Global"],
    tags: ["email", "transactional"],
  },
  brave_search: {
    name: "Brave Search",
    description: "Privacy-focused web search API.",
    category: "search",
    pricing: "~$0.005/search",
    regions: ["Global"],
    tags: ["search", "web", "privacy"],
  },
  openrouter: {
    name: "OpenRouter",
    description: "Multi-model LLM API. Access GPT, Claude, Llama, etc.",
    category: "llm",
    pricing: "Varies by model",
    regions: ["Global"],
    tags: ["llm", "ai", "gpt", "claude"],
  },
  elevenlabs: {
    name: "ElevenLabs",
    description: "Text-to-speech API. High quality voices.",
    category: "tts",
    pricing: "~$0.0003/char",
    regions: ["Global"],
    tags: ["tts", "voice", "audio"],
  },
  replicate: {
    name: "Replicate",
    description: "Run AI models (Whisper, SDXL, Llama, etc). Pay per prediction.",
    category: "ai",
    pricing: "Varies by model",
    regions: ["Global"],
    tags: ["ai", "ml", "whisper", "image", "audio", "transcription"],
  },
  firecrawl: {
    name: "Firecrawl",
    description: "Web scraping and crawling API. Extract clean data from any URL.",
    category: "scraping",
    pricing: "~$0.001/page",
    regions: ["Global"],
    tags: ["scraping", "web", "crawl", "extract"],
  },
  github: {
    name: "GitHub",
    description: "GitHub API. Search repos, manage code, access developer data.",
    category: "code",
    pricing: "Free tier available",
    regions: ["Global"],
    tags: ["github", "code", "repos", "developer"],
  },
  e2b: {
    name: "E2B",
    description: "Secure code sandbox for AI agents. Run Python, shell commands in isolated environments.",
    category: "sandbox",
    pricing: "$0.000028/s (2 vCPU)",
    regions: ["Global"],
    tags: ["sandbox", "code", "python", "execution", "ai", "agents"],
  },
} as const;

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

// Helper to validate session and log API usage
async function validateAndLogProxyCall(
  ctx: any,
  request: Request,
  provider: string,
  action: string
): Promise<{ valid: boolean; workspaceId?: string; subagentId?: string; error?: string }> {
  const identifier = request.headers.get("X-APIClaw-Identifier") || "unknown";
  const subagentId = request.headers.get("X-APIClaw-Subagent") || "main";
  
  try {
    // Always log to analytics (anonymous or authenticated)
    await ctx.runMutation(api.analytics.log, {
      event: "api_call",
      provider,
      identifier,
      metadata: { action, subagentId },
    });
    
    // If authenticated (workspace ID format), increment usage
    if (identifier.startsWith("anon:")) {
      // Anonymous user - track for rate limiting but don't increment workspace usage
      return { valid: true, subagentId };
    }
    
    // Try to increment workspace usage
    try {
      await ctx.runMutation(api.workspaces.incrementUsage, {
        workspaceId: identifier,
      });
      return { valid: true, workspaceId: identifier, subagentId };
    } catch (e) {
      // Workspace doesn't exist or error - allow call anyway
      console.warn("[Proxy] Could not increment workspace usage:", e);
      return { valid: true, subagentId };
    }
  } catch (e: any) {
    console.error("[Proxy] Logging error:", e);
    // Always allow call even if logging fails
    return { valid: true, subagentId };
  }
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
          "HTTP-Referer": "https://apiclaw.nordsym.com",
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
      const verifyUrl = `https://apiclaw.nordsym.com/auth/verify?token=${result.token}`;
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
          from: "APIClaw <noreply@apiclaw.nordsym.com>",
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
