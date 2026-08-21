import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { resolveVerifiedOwnerByWorkspaceId } from "./guards";
import { resolveDirectModelRoute } from "./modelRouting";
import { resolveManagedCredential } from "./managedCredentials";
import { resolveFrontierModelCost } from "./modelPricing";
import {
  buildCostBoundedOpenRouterRequest,
  estimateInputTokens,
  estimateManagedProviderCostUsd,
  hasBillingGradeManagedCost,
  normalizeManagedLlmRequestForCost,
  providerReportedUsageCostUsd,
  resolveManagedResponseCost,
  resolveExplicitOpenRouterExecution,
  resolveExplicitOpenRouterTarget,
  UnsafeManagedOpenRouterRequestError,
  verifiedFixedManagedProviderCostUsd,
} from "./managedCostPolicy";
import { decorateOpenRouterRequest } from "./openRouterAttribution";
import { hasActivePaygEntitlement, isInternalTier } from "./managedUsagePolicy";
import { getWorkspaceUsageDisplay } from "./workspaces";
import {
  FREE_MANAGED_PROVIDER_COST_CAP_USD,
  getManagedProviderAdapter,
} from "../src/product-truth";
import { mcpScopeAllows, type McpCapability } from "../src/mcp-scope-policy";
import {
  deriveManagedRequestId,
  deriveRequestFingerprint,
  githubContentsApiUrl,
  githubRepositoryApiUrl,
  InvalidIdempotencyKeyError,
  MANAGED_REQUEST_BODY_MAX_BYTES,
  normalizeMaxOutputTokens,
  requireManagedIdempotencyKey,
  requiresLegacyClientUpgrade,
  rewriteLegacyProviderActionCall,
  synthesizeLegacyIdempotencyKey,
  hasCustomerManagedCredential,
  LEGACY_CLIENT_MINIMUM_VERSION,
  LEGACY_CLIENT_UPGRADE_COMMANDS,
} from "./httpTrust";
import {
  buildBoundIdempotencyReplayContract,
  buildDuplicateIdempotencyConflictError,
  buildUnboundIdempotencyReplayContract,
} from "./idempotencyBinding";
import type { Id } from "./_generated/dataModel";
import {
  INTERNAL_ONLY_PROVIDER_IDS,
  isInternalProviderReference,
  isPubliclyAvailableManagedProvider,
} from "./providerBoundaries";
import {
  createCheckoutSession,
  createPortalSession,
  handleStripeWebhook,
  checkoutOptions,
  portalOptions,
  webhookOptions,
} from "./stripeActions";
import { verifyNurtureUnsubscribeToken } from "./nurtureDeliveryKeys";
import {
  CodexOAuthDispatchError,
  adjudicateCodexTerminalSSE,
  codexHttpFailureCertainty,
  codexOAuthExecutionReceipt,
  dispatchCodexOAuthRequest,
} from "./oauthPassthrough";

const http = httpRouter();

async function nurtureUnsubscribeHandler(ctx: any, request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const secret = process.env.APICLAW_PSEUDONYM_SECRET ?? "";
  const workspaceId = await verifyNurtureUnsubscribeToken(token, secret);
  if (!workspaceId) {
    return new Response("Invalid unsubscribe link.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  try {
    const result = await ctx.runMutation((internal as any).nurture.optOutByWorkspaceId, {
      workspaceId: workspaceId as Id<"workspaces">,
    });
    if (!result?.success) {
      return new Response("This workspace is no longer available.", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    }
  } catch {
    return new Response("Invalid unsubscribe link.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  return new Response(
    "<!doctype html><html><body style=\"font-family:system-ui;padding:48px;background:#0a0a0a;color:#fafafa\"><h1>You are unsubscribed.</h1><p>APIClaw lifecycle email is now disabled for this workspace.</p></body></html>",
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    },
  );
}

http.route({
  path: "/nurture/unsubscribe",
  method: "GET",
  handler: httpAction(nurtureUnsubscribeHandler),
});

http.route({
  path: "/nurture/unsubscribe",
  method: "POST",
  handler: httpAction(nurtureUnsubscribeHandler),
});

const CANON_DISCOVERABLE_APIS = 26_701;
const CANON_CALLABLE_APIS = 2_906;
const legacyMagicLinkRetired = (): boolean => true;

const SAFE_PROVIDER_PATH_SEGMENT = /^[A-Za-z0-9._~-]+$/;

function encodeProviderPathSegment(value: unknown, label: string): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value === "." ||
    value === ".." ||
    !SAFE_PROVIDER_PATH_SEGMENT.test(value)
  ) {
    throw new RangeError(`${label} must be one safe provider path segment.`);
  }
  return encodeURIComponent(value);
}

function assertCredentialedProviderPath(url: URL, expectedOrigin: string, expectedPathname: string): string {
  if (
    url.origin !== expectedOrigin ||
    url.pathname !== expectedPathname ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw new RangeError("Credentialed provider URL did not match the intended route.");
  }
  return url.toString();
}

export function elevenLabsTextToSpeechUrl(voiceId: unknown): string {
  const encodedVoiceId = encodeProviderPathSegment(voiceId, "ElevenLabs voice ID");
  const expectedPathname = `/v1/text-to-speech/${encodedVoiceId}`;
  return assertCredentialedProviderPath(
    new URL(expectedPathname, "https://api.elevenlabs.io"),
    "https://api.elevenlabs.io",
    expectedPathname,
  );
}

export function replicatePredictionUrl(predictionId: unknown): string {
  const encodedPredictionId = encodeProviderPathSegment(predictionId, "Replicate prediction ID");
  const expectedPathname = `/v1/predictions/${encodedPredictionId}`;
  return assertCredentialedProviderPath(
    new URL(expectedPathname, "https://api.replicate.com"),
    "https://api.replicate.com",
    expectedPathname,
  );
}

export function replicateModelPredictionsUrl(model: unknown): string {
  if (typeof model !== "string") {
    throw new RangeError("Replicate model must be exactly owner/model.");
  }
  const segments = model.split("/");
  if (segments.length !== 2) {
    throw new RangeError("Replicate model must be exactly owner/model.");
  }
  const owner = encodeProviderPathSegment(segments[0], "Replicate model owner");
  const modelName = encodeProviderPathSegment(segments[1], "Replicate model name");
  const expectedPathname = `/v1/models/${owner}/${modelName}/predictions`;
  return assertCredentialedProviderPath(
    new URL(expectedPathname, "https://api.replicate.com"),
    "https://api.replicate.com",
    expectedPathname,
  );
}

export function nasaReadOnlyMethod(value: unknown): "GET" {
  const method = (value ?? "GET").toString().toUpperCase();
  if (method !== "GET") {
    throw new RangeError("NASA managed execution is read-only and only supports GET.");
  }
  return "GET";
}

// Provider catalog - runtime provider capabilities and credential handles.
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
  deepinfra: {
    name: "DeepInfra",
    description: "Lowest-cost open-weights inference. Kimi K2.6, DeepSeek, Llama, Qwen.",
    category: "llm",
    pricing: "~$0.05-4.00/M tokens",
    regions: ["Global"],
    tags: ["llm", "open-source", "kimi", "deepseek", "llama", "qwen", "cheap"],
    isLLM: true,
    envKey: "DEEPINFRA_API_KEY",
    baseUrl: "https://api.deepinfra.com/v1/openai/chat/completions",
    speed: "fast",
    costTier: "cheap",
  },
  openai: {
    name: "OpenAI",
    description: "GPT-5.4, GPT-4o, o3, o4-mini. Direct access, no middleman markup.",
    category: "llm",
    pricing: "~$2.50-15.00/M tokens",
    regions: ["Global"],
    tags: ["llm", "gpt", "openai", "gpt-5", "o3", "o4", "coding"],
    isLLM: true,
    envKey: "OPENAI_API_KEY",
    baseUrl: "https://api.openai.com/v1/chat/completions",
    speed: "medium",
    costTier: "expensive",
  },
  xai: {
    name: "xAI",
    description: "Grok models by xAI. Reasoning, coding, and real-time knowledge via X/Twitter data.",
    category: "llm",
    pricing: "~$0.30-3.00/M tokens",
    regions: ["Global"],
    tags: ["llm", "grok", "reasoning", "xai", "x", "twitter"],
    isLLM: true,
    envKey: "XAI_API_KEY",
    baseUrl: "https://api.x.ai/v1/chat/completions",
    speed: "medium",
    costTier: "medium",
  },
  anthropic: {
    name: "Anthropic",
    description: "Claude models by Anthropic. Best-in-class reasoning, coding, and analysis.",
    category: "llm",
    pricing: "~$0.80-15.00/M tokens",
    regions: ["Global"],
    tags: ["llm", "claude", "anthropic", "reasoning", "coding", "analysis"],
    isLLM: true,
    envKey: "ANTHROPIC_API_KEY",
    baseUrl: "https://api.anthropic.com/v1/messages",
    speed: "medium",
    costTier: "expensive",
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
  genprd: {
    name: "GenPRD",
    description: "AI-powered PRD generator. Produces structured Markdown Product Requirement Documents from a topic, audience, and constraints. Managed by NordSym AB.",
    category: "ai",
    pricing: "AI compute cost + 15%",
    regions: ["Global"],
    tags: ["prd", "product", "requirements", "ai", "markdown"],
    isLLM: false,
    envKey: "GENPRD_API_KEY",
    speed: "medium",
    costTier: "medium",
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
  nasa: {
    name: "NASA",
    description: "NASA open-data APIs. Managed key injection for api.nasa.gov — APOD, NEO Feed, EPIC, Mars Weather.",
    category: "science",
    pricing: "Free (rate-limited upstream)",
    regions: ["Global"],
    tags: ["nasa", "space", "science", "apod", "neo", "epic", "mars", "earth", "astronomy"],
    isLLM: false,
    envKey: "NASA_API_KEY",
    baseUrl: "https://api.nasa.gov",
    speed: "medium",
    costTier: "cheap",
  },
  apilayer: {
    name: "APILayer",
    description: "Contracted APILayer/Idera HTTPS rails: exchange rates, market data, aviation, PDF, screenshots, email verification, VAT, news, weather, IP lookup, and more.",
    category: "multi",
    pricing: "Free tier available, paid plans per API",
    regions: ["Global"],
    tags: ["exchange", "stocks", "aviation", "pdf", "screenshot", "verification", "vat", "news", "scraping"],
    isLLM: false,
    envKey: "APILAYER_API_KEY",
    speed: "medium",
    costTier: "cheap",
  },
  voyage: {
    name: "Voyage AI",
    description: "State-of-the-art embeddings for RAG and agent memory. Best-in-class retrieval quality.",
    category: "embeddings",
    pricing: "~$0.02-0.18/M tokens",
    regions: ["Global"],
    tags: ["embeddings", "rag", "agent-memory", "retrieval", "voyage-3", "code-embeddings"],
    isLLM: false,
    envKey: "VOYAGE_API_KEY",
    speed: "fast",
    costTier: "cheap",
  },
};

// ==============================================
// PROVIDER COST TABLE (per million tokens, USD)
// ==============================================
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  // OpenAI
  "gpt-5.4":             { input: 12.50, output: 50.00 },
  "gpt-5":               { input: 10.00, output: 40.00 },
  "gpt-4o":              { input: 2.50,  output: 10.00 },
  "gpt-4o-mini":         { input: 0.15,  output: 0.60 },
  "gpt-4.1":             { input: 2.00,  output: 8.00 },
  "o3":                  { input: 10.00, output: 40.00 },
  "o4-mini":             { input: 1.10,  output: 4.40 },
  // Groq (heavily discounted)
  "llama-3.3-70b-versatile": { input: 0.059, output: 0.079 },
  "llama-3.1-8b-instant":   { input: 0.05,  output: 0.08 },
  "llama-3.1-70b-versatile": { input: 0.059, output: 0.079 },
  "gemma2-9b-it":            { input: 0.02,  output: 0.02 },
  "mixtral-8x7b-32768":     { input: 0.024, output: 0.024 },
  // Mistral
  "mistral-small-latest":   { input: 0.10,  output: 0.30 },
  "mistral-large-latest":   { input: 2.00,  output: 6.00 },
  "mistral-medium-latest":  { input: 0.40,  output: 1.20 },
  "codestral-latest":       { input: 0.30,  output: 0.90 },
  "pixtral-large-latest":   { input: 2.00,  output: 6.00 },
  "open-mistral-nemo":      { input: 0.15,  output: 0.15 },
  // Together
  "deepseek-ai/DeepSeek-R1": { input: 0.55, output: 2.19 },
  "deepseek-ai/DeepSeek-V3": { input: 0.30, output: 0.88 },
  "meta-llama/Llama-3.3-70B-Instruct-Turbo": { input: 0.18, output: 0.18 },
  "Qwen/Qwen2.5-72B-Instruct-Turbo":         { input: 0.18, output: 0.18 },
  // DeepInfra (open-weights, cheapest tier)
  "moonshotai/Kimi-K2.6":       { input: 0.50, output: 2.80 },
  "moonshotai/Kimi-K2.5":       { input: 0.50, output: 2.80 },
  "deepseek-ai/DeepSeek-V3.2":  { input: 0.27, output: 0.40 },
  "meta-llama/Llama-3.3-70B-Instruct": { input: 0.23, output: 0.40 },
  "Qwen/Qwen2.5-72B-Instruct": { input: 0.23, output: 0.40 },
  // xAI
  "grok-4.20-reasoning":  { input: 3.00,  output: 15.00 },
  "grok-3":               { input: 3.00,  output: 15.00 },
  "grok-3-mini":          { input: 0.30,  output: 0.50 },
  "grok-2-latest":        { input: 2.00,  output: 10.00 },
  // Anthropic (direct or via OpenRouter)
  "claude-sonnet-4-6":           { input: 3.00,  output: 15.00 },
  "claude-opus-4-6":             { input: 15.00, output: 75.00 },
  "claude-opus-4":               { input: 15.00, output: 75.00 },
  "claude-4-sonnet":             { input: 3.00,  output: 15.00 },
  "claude-4-opus":               { input: 15.00, output: 75.00 },
  "claude-3.5-sonnet":           { input: 3.00,  output: 15.00 },
  "claude-3-5-sonnet-20241022":  { input: 3.00,  output: 15.00 },
  "claude-haiku-4-5":            { input: 0.80,  output: 4.00 },
  "claude-3-5-haiku-20241022":   { input: 0.80,  output: 4.00 },
  "anthropic/claude-sonnet-4-6": { input: 3.00,  output: 15.00 },
  "anthropic/claude-haiku-3.5":  { input: 0.80,  output: 4.00 },
};

// APIClaw margin: 15% on top of provider cost (market standard)
const APICLAW_MARGIN = 0.15;

function resolveKnownModelCost(model: string, inputTokens = 0): { input: number; output: number } | undefined {
  const frontier = resolveFrontierModelCost(model, inputTokens);
  if (frontier) return frontier;
  const exact = MODEL_COSTS[model];
  if (exact) return exact;
  const withoutProvider = model.replace(/^(?:openai|anthropic|xai|groq|mistral|together|deepinfra|openrouter)\//i, "");
  return MODEL_COSTS[withoutProvider];
}

function calculateCallCost(model: string, usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }): { providerCost: number; apiclawCost: number } | undefined {
  if (!usage) return undefined;

  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  const costs = resolveKnownModelCost(model, inputTokens);
  if (!costs) return undefined;

  const providerCost = (inputTokens * costs.input + outputTokens * costs.output) / 1_000_000;
  const apiclawCost = providerCost * (1 + APICLAW_MARGIN);

  return { providerCost, apiclawCost };
}

function estimateKnownModelUpperBoundUsd(model: string, inputTokens: number, maxOutputTokens: number): number | undefined {
  return calculateCallCost(model, {
    prompt_tokens: inputTokens,
    completion_tokens: maxOutputTokens,
  })?.providerCost;
}

function costBoundedOpenRouterRequest(
  payload: unknown,
  model: string,
  maxOutputTokens: number,
  estimatedInputTokens: number,
): Record<string, unknown> {
  const prices = resolveKnownModelCost(model, estimatedInputTokens);
  if (!prices) {
    throw new UnsafeManagedOpenRouterRequestError(
      "This OpenRouter model has no verified APIClaw price ceiling.",
    );
  }
  return buildCostBoundedOpenRouterRequest(payload, {
    model,
    maxOutputTokens,
    maxInputPriceUsdPerMillion: prices.input,
    maxOutputPriceUsdPerMillion: prices.output,
  });
}

// ==============================================
// INTELLIGENT LLM ROUTER
// ==============================================

// Exact direct-provider model routing lives in modelRouting.ts so it can be
// regression-tested without loading the Convex HTTP runtime.
interface RoutingDecision {
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  reason: string;
  extraHeaders?: Record<string, string>;
}

// ==============================================
// ADVISOR mode is intentionally local and deterministic. Routing decisions must
// never spend a second managed provider call behind the customer's back.
// ==============================================

async function routeLLMRequest(
  requestedModel: string,
  settings: {
    routingMode: string;
    preferredProviders: string[];
    blockedProviders: string[];
    allowOpenRouterFallback: boolean;
  },
  messages?: Array<{ role: string; content: string }>
): Promise<RoutingDecision | null> {
  const explicitOpenRouterTarget = resolveExplicitOpenRouterTarget(requestedModel);
  if (explicitOpenRouterTarget) {
    if (settings.blockedProviders.includes("openrouter")) {
      return null;
    }
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;
    return {
      provider: "openrouter",
      model: explicitOpenRouterTarget.model,
      baseUrl: "https://openrouter.ai/api/v1/chat/completions",
      apiKey,
      reason: "explicit_openrouter",
      extraHeaders: {
        "HTTP-Referer": "https://apiclaw.cloud",
        "X-Title": "APIClaw Gateway",
      },
    };
  }

  // 1. Canonical direct-provider IDs preserve the exact upstream slug.
  const directRoute = resolveDirectModelRoute(requestedModel);
  if (directRoute && !settings.blockedProviders.includes(directRoute.provider)) {
    const providerMeta = PROVIDERS[directRoute.provider];
    if (providerMeta?.isLLM && providerMeta.envKey && providerMeta.baseUrl) {
      const apiKey = process.env[providerMeta.envKey];
      const preferOpenRouter = settings.routingMode === "highest_quality" &&
        !settings.preferredProviders.includes(directRoute.provider);
      if (apiKey && !preferOpenRouter) {
        return {
          provider: directRoute.provider,
          model: directRoute.model,
          baseUrl: providerMeta.baseUrl,
          apiKey,
          reason: directRoute.reason,
        };
      }
    }
  }

  // 2. ADVISOR. This is a deterministic provider preference, not a model call.
  const isAutoModel = !requestedModel || requestedModel === "auto";
  if (isAutoModel && settings.routingMode === "advisor") {
    const localChoices = [
      { provider: "mistral", model: "mistral-small-latest" },
      { provider: "groq", model: "llama-3.3-70b-versatile" },
      { provider: "openrouter", model: "anthropic/claude-sonnet-4-6" },
    ];
    for (const choice of localChoices) {
      if (settings.blockedProviders.includes(choice.provider)) continue;
      if (choice.provider === "openrouter" && settings.allowOpenRouterFallback === false) continue;
      const providerMeta = PROVIDERS[choice.provider];
      if (!providerMeta?.envKey || !providerMeta.baseUrl) continue;
      const apiKey = process.env[providerMeta.envKey];
      if (!apiKey) continue;
      return {
        provider: choice.provider,
        model: choice.model,
        baseUrl: providerMeta.baseUrl,
        apiKey,
        reason: `advisor_local_${choice.provider}`,
        ...(choice.provider === "openrouter" ? {
          extraHeaders: { "HTTP-Referer": "https://apiclaw.cloud", "X-Title": "APIClaw Gateway" },
        } : {}),
      };
    }
  }

  // 3. Static routing mode preferences (fallback)
  if (settings.routingMode === "fastest") {
    for (const fastProvider of ["groq", "together", "mistral"]) {
      if (settings.blockedProviders.includes(fastProvider)) continue;
      const meta = PROVIDERS[fastProvider];
      if (!meta?.isLLM || !meta.envKey || !meta.baseUrl) continue;
      const key = process.env[meta.envKey];
      if (!key) continue;
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

  // 4. Preferred providers check
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

  // 5. Fallback to OpenRouter
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

// ==============================================
// ANTHROPIC MESSAGES API TRANSLATION
// Translates OpenAI chat format to/from Anthropic Messages API
// ==============================================

// ============================================================================
// OpenAI ↔ Anthropic translator (full fidelity — PR2 of "everything via apiclaw")
// ============================================================================
// Handles: tools/tool_choice, tool_use/tool_result message pairs, vision blocks
// (image_url → image source), cache_control passthrough, thinking config,
// reasoning_content (thinking blocks → OpenAI's reasoning_content field), full
// stop_reason mapping, cache token usage in prompt_tokens_details.
// ============================================================================

function openaiToolsToAnthropic(tools: any[]): any[] {
  return tools
    .filter((t) => t && (t.type === "function" || t.function))
    .map((t) => {
      const fn = t.function ?? t;
      return {
        name: fn.name,
        description: fn.description,
        input_schema: fn.parameters ?? { type: "object", properties: {} },
      };
    });
}

function openaiToolChoiceToAnthropic(choice: any): any | undefined {
  if (choice === undefined || choice === null) return undefined;
  if (choice === "auto") return { type: "auto" };
  if (choice === "required" || choice === "any") return { type: "any" };
  if (choice === "none") return { type: "none" };
  if (typeof choice === "object" && choice.type === "function" && choice.function?.name) {
    return { type: "tool", name: choice.function.name };
  }
  return undefined;
}

function openaiContentToAnthropic(content: any): any {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return content;
  return content.map((block: any) => {
    if (!block || typeof block !== "object") return block;
    // text passthrough (preserve cache_control if present)
    if (block.type === "text") {
      const out: any = { type: "text", text: block.text };
      if (block.cache_control) out.cache_control = block.cache_control;
      return out;
    }
    // image_url → image source (OpenAI uses image_url, Anthropic uses image)
    if (block.type === "image_url" && block.image_url) {
      const url: string = block.image_url.url || block.image_url;
      if (url.startsWith("data:")) {
        // data:image/png;base64,...
        const m = url.match(/^data:(.+?);base64,(.+)$/);
        if (m) {
          const out: any = { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } };
          if (block.cache_control) out.cache_control = block.cache_control;
          return out;
        }
      }
      const out: any = { type: "image", source: { type: "url", url } };
      if (block.cache_control) out.cache_control = block.cache_control;
      return out;
    }
    // Already-Anthropic shapes (image, tool_use, tool_result, document, thinking) pass through
    if (["image", "tool_use", "tool_result", "document", "thinking"].includes(block.type)) {
      return block;
    }
    return block;
  });
}

function openaiMessagesToAnthropic(messages: any[]): { system?: any; messages: any[] } {
  // System: collect all system messages, preserve cache_control
  const systemBlocks: any[] = [];
  const nonSystem: any[] = [];

  for (const m of messages) {
    if (m.role === "system" || m.role === "developer") {
      if (typeof m.content === "string") {
        systemBlocks.push({ type: "text", text: m.content });
      } else if (Array.isArray(m.content)) {
        for (const b of m.content) {
          if (typeof b === "string") systemBlocks.push({ type: "text", text: b });
          else systemBlocks.push(b);
        }
      }
    } else {
      nonSystem.push(m);
    }
  }

  // Map non-system: handle tool messages, assistant tool_calls
  const out: any[] = [];
  for (const m of nonSystem) {
    if (m.role === "tool") {
      // OpenAI tool result → Anthropic user message with tool_result block
      out.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: m.tool_call_id,
            content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
          },
        ],
      });
      continue;
    }
    if (m.role === "assistant" && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
      // Convert tool_calls to tool_use blocks; combine with text content if present
      const content: any[] = [];
      const textContent = typeof m.content === "string" ? m.content : null;
      if (textContent) content.push({ type: "text", text: textContent });
      for (const tc of m.tool_calls) {
        let input: any = {};
        try {
          input = typeof tc.function?.arguments === "string"
            ? JSON.parse(tc.function.arguments || "{}")
            : tc.function?.arguments || {};
        } catch {
          input = { _raw: tc.function?.arguments };
        }
        content.push({
          type: "tool_use",
          id: tc.id,
          name: tc.function?.name,
          input,
        });
      }
      out.push({ role: "assistant", content });
      continue;
    }
    out.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content: openaiContentToAnthropic(m.content),
    });
  }

  return systemBlocks.length > 0
    ? { system: systemBlocks.length === 1 && !systemBlocks[0].cache_control ? systemBlocks[0].text : systemBlocks, messages: out }
    : { messages: out };
}

function openaiToAnthropicRequest(
  model: string,
  messages: Array<{ role: string; content: any }>,
  rest: Record<string, any>
): { body: any; headers: Record<string, string> } {
  const { system, messages: anthropicMessages } = openaiMessagesToAnthropic(messages);

  const body: any = {
    model,
    messages: anthropicMessages,
    // No more 4096 cap — pass user's value or use a reasonable default for Anthropic (8192).
    max_tokens: rest.max_tokens ?? rest.max_completion_tokens ?? 8192,
  };
  if (system !== undefined) body.system = system;
  if (rest.temperature !== undefined) body.temperature = rest.temperature;
  if (rest.top_p !== undefined) body.top_p = rest.top_p;
  if (rest.top_k !== undefined) body.top_k = rest.top_k;
  if (rest.stop) body.stop_sequences = Array.isArray(rest.stop) ? rest.stop : [rest.stop];
  if (rest.metadata) body.metadata = rest.metadata;
  if (rest.thinking) body.thinking = rest.thinking;
  if (Array.isArray(rest.tools) && rest.tools.length > 0) {
    body.tools = openaiToolsToAnthropic(rest.tools);
    const tc = openaiToolChoiceToAnthropic(rest.tool_choice);
    if (tc) body.tool_choice = tc;
  }
  // response_format: Anthropic has no native JSON mode; inject as system guidance when requested.
  if (rest.response_format?.type === "json_object" || rest.response_format?.type === "json_schema") {
    const guidance = rest.response_format.type === "json_schema"
      ? `Respond ONLY with valid JSON matching this schema: ${JSON.stringify(rest.response_format.json_schema?.schema ?? rest.response_format.json_schema)}`
      : "Respond ONLY with valid JSON. No prose.";
    if (typeof body.system === "string") body.system = `${body.system}\n\n${guidance}`;
    else if (Array.isArray(body.system)) body.system.push({ type: "text", text: guidance });
    else body.system = guidance;
  }

  return { body, headers: {} };
}

function anthropicStopReasonToOpenai(stopReason?: string, hasToolUse?: boolean): string {
  if (hasToolUse) return "tool_calls";
  switch (stopReason) {
    case "end_turn": return "stop";
    case "stop_sequence": return "stop";
    case "max_tokens": return "length";
    case "tool_use": return "tool_calls";
    default: return stopReason || "stop";
  }
}

function anthropicToOpenaiResponse(anthropicData: any, model: string): any {
  const blocks: any[] = Array.isArray(anthropicData.content) ? anthropicData.content : [];

  let textParts: string[] = [];
  const toolCalls: any[] = [];
  const thinkingParts: string[] = [];

  for (const b of blocks) {
    if (!b || typeof b !== "object") continue;
    if (b.type === "text" && typeof b.text === "string") {
      textParts.push(b.text);
    } else if (b.type === "tool_use") {
      toolCalls.push({
        id: b.id,
        type: "function",
        function: {
          name: b.name,
          arguments: JSON.stringify(b.input ?? {}),
        },
      });
    } else if (b.type === "thinking" && typeof b.thinking === "string") {
      thinkingParts.push(b.thinking);
    }
  }

  const usage = anthropicData.usage ?? {};
  const inputTokens = usage.input_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;
  const cacheCreation = usage.cache_creation_input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;

  const message: any = {
    role: "assistant",
    content: textParts.length > 0 ? textParts.join("") : null,
  };
  if (toolCalls.length > 0) message.tool_calls = toolCalls;
  if (thinkingParts.length > 0) message.reasoning_content = thinkingParts.join("\n\n");

  const usageOut: any = {
    prompt_tokens: inputTokens + cacheCreation + cacheRead,
    completion_tokens: outputTokens,
    total_tokens: inputTokens + cacheCreation + cacheRead + outputTokens,
  };
  if (cacheCreation > 0 || cacheRead > 0) {
    usageOut.prompt_tokens_details = {
      cached_tokens: cacheRead,
      cache_creation_input_tokens: cacheCreation,
    };
  }

  return {
    id: anthropicData.id || `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message,
        finish_reason: anthropicStopReasonToOpenai(anthropicData.stop_reason, toolCalls.length > 0),
      },
    ],
    usage: usageOut,
  };
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Idempotency-Key, X-APIClaw-Internal, X-APIClaw-Subagent, X-APIClaw-Api-Key, X-APIClaw-Session, X-APIClaw-Identifier, X-APIClaw-Route, X-APIClaw-Workspace",
};

// ============================================
// AUTH GATE
// ============================================
// AUTH_ENFORCEMENT env var controls the gate behavior:
//   "shadow"  (default) → log unauth calls to funnel.call_api_unauth, pass through
//   "enforce"           → reject anonymous calls with 401 + signup link
// Per-workspace override: workspaces.gatingEnabled === true forces enforce for that workspace.
function isEnforceMode(): boolean {
  return (process.env.APICLAW_AUTH_ENFORCEMENT ?? "shadow") === "enforce";
}

function unauthResponse(reason: string) {
  return jsonResponse(
    {
      error: {
        message:
          "Workspace required. APIClaw includes 25 managed calls lifetime, subject to a $1 provider-cost cap. Sign up at https://apiclaw.cloud/workspace and pass your sk-claw-... key as Authorization: Bearer.",
        type: "auth_error",
        code: "unauth",
        reason,
        signupUrl: "https://apiclaw.cloud/workspace",
        docsUrl: "https://apiclaw.cloud/install",
        freeTierCalls: 25,
      },
    },
    401
  );
}

function discoverAuthResponse(reason: string) {
  return jsonResponse(
    {
      error: {
        message:
          "Signup required for API discovery. Discovery is free after signup. Get a free key at https://apiclaw.cloud/sign-up or run `apiclaw login`.",
        type: "auth_error",
        code: "signup_required",
        reason,
        signupUrl: "https://apiclaw.cloud/sign-up",
        docsUrl: "https://apiclaw.cloud/install",
        discoveryCost: "free",
      },
    },
    401
  );
}

// Helper for JSON responses
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function legacyClientUpgradeResponse(): Response {
  return jsonResponse({
    error: {
      code: "legacy_client_upgrade_required",
      type: "upgrade_required",
      message: "APIClaw 2.8.6 cannot safely execute against the current gateway contract. Upgrade, sign in again, and restart your MCP client.",
      minimumVersion: LEGACY_CLIENT_MINIMUM_VERSION,
      commands: [...LEGACY_CLIENT_UPGRADE_COMMANDS],
      docsUrl: "https://apiclaw.cloud/install",
    },
  }, 426);
}

async function recordLegacyClientUpgrade(
  ctx: any,
  request: Request,
  path: "/v1/execute" | "/v1/call",
): Promise<void> {
  try {
    await ctx.runMutation(api.funnel.recordEvent, {
      event: "call_api_blocked",
      classification: "human",
      userAgent: request.headers.get("User-Agent") ?? undefined,
      props: {
        reason: "legacy_client_upgrade_required",
        path,
        minimumVersion: LEGACY_CLIENT_MINIMUM_VERSION,
      },
    });
  } catch (error: any) {
    console.error("[Legacy client] Funnel log failed:", error?.message);
  }
}

type ResolvedWorkspaceAuth = {
  workspaceId?: string;
  keyId?: string;
  authMethod: "api-key" | "session" | "identifier" | "mcp-oauth" | "internal" | "anonymous";
  mcpScope?: string;
};

function mcpScopeDenial(
  auth: Pick<ResolvedWorkspaceAuth, "authMethod" | "mcpScope">,
  required: McpCapability,
): Response | null {
  if (auth.authMethod !== "mcp-oauth" || mcpScopeAllows(auth.mcpScope, required)) {
    return null;
  }

  return new Response(
    JSON.stringify({
      error: {
        code: "insufficient_scope",
        type: "auth_error",
        message: `OAuth scope mcp:${required} is required.`,
        requiredScope: `mcp:${required}`,
      },
    }),
    {
      status: 403,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer error="insufficient_scope", scope="mcp:${required}"`,
      },
    },
  );
}

const MAX_BUFFERED_UPSTREAM_BYTES = 10 * 1024 * 1024;

async function readUpstreamBytesCapped(response: Response): Promise<Uint8Array> {
  const declared = Number(response.headers.get("Content-Length") ?? 0);
  if (Number.isFinite(declared) && declared > MAX_BUFFERED_UPSTREAM_BYTES) {
    throw new RangeError("Upstream response exceeded the 10 MB buffered response cap.");
  }
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BUFFERED_UPSTREAM_BYTES) {
      await reader.cancel();
      throw new RangeError("Upstream response exceeded the 10 MB buffered response cap.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function readUpstreamTextCapped(response: Response): Promise<string> {
  return new TextDecoder().decode(await readUpstreamBytesCapped(response));
}

async function readUpstreamJsonCapped(response: Response): Promise<any> {
  const raw = await readUpstreamTextCapped(response);
  return raw ? JSON.parse(raw) : {};
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
): Promise<ResolvedWorkspaceAuth> {
  const internalHeader = request.headers.get("X-APIClaw-Internal");
  if (internalHeader) {
    const expected = process.env.APICLAW_INTERNAL_SECRET;
    if (!expected || internalHeader !== expected) return { authMethod: "anonymous" };
    const workspaceId = request.headers.get("X-APIClaw-Workspace") || undefined;
    return { workspaceId, authMethod: "internal" };
  }

  // 1a. API key via Authorization: Bearer sk-claw-...
  const authHeader = request.headers.get("Authorization");
  let rawKey: string | null = null;
  if (authHeader?.startsWith("Bearer sk-claw-")) {
    rawKey = authHeader.slice(7);
  }
  // 1b. API key via X-APIClaw-Api-Key header (OpenClaw / server-to-server preferred form)
  if (!rawKey) {
    const headerKey = request.headers.get("X-APIClaw-Api-Key");
    if (headerKey?.startsWith("sk-claw-")) rawKey = headerKey;
  }
  if (rawKey) {
    try {
      const resolved = await ctx.runQuery(internal.apiKeys.resolveKey, { rawKey });
      if (resolved) {
        ctx.runMutation(api.apiKeys.touchKey, { keyId: resolved.keyId }).catch(() => {});
        return { workspaceId: resolved.workspaceId, keyId: resolved.keyId, authMethod: "api-key" };
      }
    } catch (e: any) {
      console.error("[Auth] API key resolution failed:", e.message);
    }
    // Invalid key → anonymous (do not fall through to other methods for this request)
    return { authMethod: "anonymous" };
  }

  // 1c. Remote MCP OAuth bearer (Bearer sk-mcp-...)
  if (authHeader?.startsWith("Bearer sk-mcp-")) {
    const oauthToken = authHeader.slice(7);
    try {
      const resolved = await ctx.runQuery(api.mcpOAuth.resolveBearerToken, { token: oauthToken });
      if (resolved?.ok) {
        ctx.runMutation(api.mcpOAuth.touchToken, { tokenId: resolved.tokenId }).catch(() => {});
        return { workspaceId: resolved.workspaceId, authMethod: "mcp-oauth", mcpScope: resolved.scope };
      }
    } catch (e: any) {
      console.error("[Auth] MCP OAuth resolution failed:", e.message);
    }
    return { authMethod: "anonymous" };
  }

  // 2. CLI session token (apiclaw login → ~/.apiclaw/session)
  const sessionToken = request.headers.get("X-APIClaw-Session");
  if (sessionToken && sessionToken.length >= 20) {
    try {
      const session = await ctx.runQuery(api.workspaces.verifySession, { sessionToken });
      if (session?.workspaceId) {
        return { workspaceId: session.workspaceId, authMethod: "session" };
      }
    } catch (e: any) {
      console.error("[Auth] Session resolution failed:", e.message);
    }
    // Unknown/expired session → anonymous, do not fall through
    return { authMethod: "anonymous" };
  }

  // 3. Anonymous
  return { authMethod: "anonymous" };
}

// Providers that are NEVER callable through the public gateway. Used by NordSym
// internal infrastructure (booking confirmations, magic-link emails, OTP) and
// only reachable via X-APIClaw-Internal server-to-server auth, never through
// a workspace key, session, or anonymous call.
const INTERNAL_ONLY_PROVIDERS = new Set<string>(INTERNAL_ONLY_PROVIDER_IDS);

function internalOnlyResponse(_provider: string) {
  return jsonResponse(
    {
      error: {
        code: "provider_not_available",
        message: "Provider is not available through the public APIClaw runtime.",
        type: "not_found",
      },
    },
    404
  );
}

function quotaExceededResponse(quota: any, provider: string, action: string, path: string) {
  const unavailable = quota.reason === "managed_action_not_customer_executable";
  const costHold = quota.reason === "managed_cost_hold";
  return jsonResponse(
    {
      error: {
        code: unavailable
          ? "managed_action_not_available"
          : costHold
            ? "managed_cost_hold"
            : "quota_exceeded",
        reason: quota.reason || "quota_exceeded",
        message:
          quota.message ||
          "Free tier quota exceeded. Keep going at API cost + 15% with pay-as-you-go: https://apiclaw.cloud/upgrade",
        type: unavailable ? "permission_error" : costHold ? "billing_error" : "quota_error",
        ...(costHold ? { retryable: false } : {}),
        tier: quota.tier,
        provider,
        action,
        path,
        managedUsageCount: quota.managedUsageCount,
        managedUsageLimit: quota.managedUsageLimit,
        managedUsageRemaining: quota.managedUsageRemaining,
        activationProviderCostUsd: quota.activationProviderCostUsd,
        activationProviderCostCapUsd: quota.activationProviderCostCapUsd,
        activationProviderCostRemainingUsd: quota.activationProviderCostRemainingUsd,
        ...(!costHold
          ? { upgradeUrl: quota.upgradeUrl || "https://apiclaw.cloud/upgrade" }
          : {}),
      },
    },
    unavailable ? 403 : costHold ? 503 : 402
  );
}

type ManagedCallGate = {
  ledgerId: Id<"managedCallLedger">;
  requestId: string;
  billingClass: "activation" | "payg" | "internal" | "contract";
  trafficClass: "customer" | "internal";
  fixedProviderCostUsd?: number;
  quotaWarning?: unknown;
};

type ManagedCallFinalization = {
  billingException?: string;
  reservedProviderCostMicros?: number;
  reportedProviderCostMicros?: number;
};

function requireCodexOAuthIdempotency(request: Request): string | Response {
  try {
    return requireManagedIdempotencyKey(
      request.headers.get("Idempotency-Key"),
      "customer",
    )!;
  } catch (error) {
    return jsonResponse({
      error: {
        code: request.headers.get("Idempotency-Key") === null
          ? "idempotency_key_required"
          : "invalid_idempotency_key",
        type: "invalid_request_error",
        message: error instanceof Error ? error.message : "A stable Idempotency-Key is required for OAuth passthrough.",
        retryable: false,
      },
    }, 400);
  }
}

async function managedRequestPayload(request: Request, suppliedPayload: unknown): Promise<unknown> {
  if (suppliedPayload !== undefined) {
    const serialized = typeof suppliedPayload === "string"
      ? suppliedPayload
      : JSON.stringify(suppliedPayload);
    if (serialized === undefined || new TextEncoder().encode(serialized).byteLength > MANAGED_REQUEST_BODY_MAX_BYTES) {
      throw new RangeError(`Managed request bodies are limited to ${MANAGED_REQUEST_BODY_MAX_BYTES} bytes.`);
    }
    return suppliedPayload;
  }
  const raw = await readManagedRequestTextCapped(request);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function readManagedRequestTextCapped(request: Request): Promise<string> {
  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MANAGED_REQUEST_BODY_MAX_BYTES) {
    throw new RangeError(`Managed request bodies are limited to ${MANAGED_REQUEST_BODY_MAX_BYTES} bytes.`);
  }
  const body = request.clone().body;
  if (!body) return "";
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MANAGED_REQUEST_BODY_MAX_BYTES) {
      await reader.cancel();
      throw new RangeError(`Managed request bodies are limited to ${MANAGED_REQUEST_BODY_MAX_BYTES} bytes.`);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function readManagedJsonBodyCapped(request: Request): Promise<any> {
  const raw = await readManagedRequestTextCapped(request);
  return raw ? JSON.parse(raw) : {};
}

async function enforcePreCallQuota(
  ctx: any,
  request: Request,
  workspaceId: string | undefined,
  provider: string,
  action: string,
  path: string,
  options: {
    model?: string;
    estimatedProviderCostUsd?: number;
    estimatedInputTokens?: number;
    maxOutputTokens?: number;
    billingGradeCost?: boolean;
    trafficClass?: "customer" | "internal";
    requestPayload?: unknown;
  } = {},
): Promise<Response | ManagedCallGate> {
  if (!workspaceId) {
    return jsonResponse({
      error: {
        code: options.trafficClass === "internal" ? "internal_workspace_required" : "workspace_required",
        type: "auth_error",
        message: options.trafficClass === "internal"
          ? "Internal managed calls require X-APIClaw-Workspace for billing attribution."
          : "Managed calls require an authenticated APIClaw workspace.",
      },
    }, 401);
  }

  const trafficClass = options.trafficClass === "internal" ? "internal" : "customer";
  let idempotencyKey: string | null;
  try {
    const suppliedKey = request.headers.get("Idempotency-Key")
      ?? (trafficClass === "customer" ? synthesizeLegacyIdempotencyKey() : null);
    idempotencyKey = requireManagedIdempotencyKey(suppliedKey, trafficClass);
  } catch (error) {
    if (error instanceof InvalidIdempotencyKeyError) {
      return jsonResponse({
        error: {
          code: request.headers.get("Idempotency-Key") === null
            ? "idempotency_key_required"
            : "invalid_idempotency_key",
          type: "invalid_request_error",
          message: error.message,
        },
      }, 400);
    }
    throw error;
  }

  const estimatedProviderCostUsd = options.estimatedProviderCostUsd ?? estimateManagedProviderCostUsd({
    provider,
    action,
    model: options.model,
    estimatedInputTokens: options.estimatedInputTokens,
    maxOutputTokens: options.maxOutputTokens,
  });
  const requiresExactModelPrice = ["chat", "chat_completions", "responses", "messages"].includes(action) ||
    PROVIDERS[provider]?.isLLM === true || provider === "llm" || provider === "auto";
  if (requiresExactModelPrice && estimatedProviderCostUsd === undefined) {
    return jsonResponse({
      error: {
        code: "unpriced_managed_model",
        type: "billing_error",
        message: "This model has no verified direct-provider price. APIClaw will not dispatch it until exact pricing is registered.",
        provider,
        action,
        model: options.model,
      },
    }, 422);
  }
  const billingGradeCost = options.billingGradeCost ?? hasBillingGradeManagedCost({
    provider,
    action,
    model: options.model,
    estimatedInputTokens: options.estimatedInputTokens,
    maxOutputTokens: options.maxOutputTokens,
  });
  const fixedProviderCostUsd = verifiedFixedManagedProviderCostUsd({ provider, action });
  let requestId: string;
  let requestFingerprint: string;
  try {
    const payload = idempotencyKey === null
      ? undefined
      : await managedRequestPayload(request, options.requestPayload);
    requestFingerprint = await deriveRequestFingerprint(payload);
    requestId = await deriveManagedRequestId({
      idempotencyKey,
      workspaceId,
      provider,
      action,
      path,
      model: options.model,
      payload,
    });
  } catch (error) {
    if (error instanceof InvalidIdempotencyKeyError || error instanceof RangeError) {
      return jsonResponse({
        error: {
          code: "invalid_idempotency_key",
          type: "invalid_request_error",
          message: error.message,
        },
      }, 400);
    }
    throw error;
  }

  let quota: any;
  try {
    quota = await ctx.runMutation((internal as any).managedUsage.authorizeManagedCall, {
      workspaceId: workspaceId as any,
      requestId,
      requestFingerprint,
      provider,
      action,
      model: options.model,
      path,
      estimatedProviderCostUsd,
      billingGradeCost,
      trafficClass: options.trafficClass,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("requestId collision")) {
      const replay = buildUnboundIdempotencyReplayContract();
      return jsonResponse({
        error: {
          ...replay,
          type: "conflict_error",
          message: "This Idempotency-Key is already bound to a different managed request.",
        },
      }, 409);
    }
    throw error;
  }
  if (quota?.duplicate) {
    const replay = quota.receipt
      ? await buildBoundIdempotencyReplayContract(idempotencyKey, requestId, quota.receipt)
      : buildUnboundIdempotencyReplayContract();
    return jsonResponse({
      error: buildDuplicateIdempotencyConflictError({
        replay,
        requestId,
        ledgerId: String(quota.ledgerId),
        reason: quota.reason,
      }),
    }, 409);
  }
  if (quota?.allowed) {
    return {
      ledgerId: quota.ledgerId,
      requestId,
      billingClass: quota.billingClass,
      trafficClass: quota.trafficClass,
      fixedProviderCostUsd,
      quotaWarning: quota.quotaWarning,
    };
  }

  try {
    await ctx.runMutation(api.funnel.recordEvent, {
      event: "quota_hit",
      classification: "human",
      props: {
        reason: quota?.reason || "quota_exceeded",
        provider,
        action,
        path,
        tier: quota?.tier,
      },
      workspaceId: workspaceId as any,
    });
  } catch (e: any) {
    console.error("[Quota] Funnel log failed:", e?.message);
  }

  return quotaExceededResponse(quota || {}, provider, action, path);
}

async function finalizeManagedCall(
  ctx: any,
  gate: ManagedCallGate | undefined,
  details: {
    success: boolean;
    providerCostUsd?: number;
    provider?: string;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    upstreamRequestId?: string;
    costSource?: "provider_response" | "token_price_table" | "fixed_price_policy" | "reservation" | "zero_cost";
    terminalCode?: string;
    executionCertainty?: "not_dispatched" | "provider_rejected" | "provider_terminal_failure" | "completed" | "uncertain";
    operatorActionRequired?: boolean;
    retryAttempts?: number;
  },
): Promise<ManagedCallFinalization | undefined> {
  if (!gate) return;
  return await ctx.runMutation((internal as any).managedUsage.finalizeManagedCall, {
    ledgerId: gate.ledgerId,
    ...details,
  });
}

function managedCostReconciliationResponse(
  gate: ManagedCallGate | undefined,
  finalization: ManagedCallFinalization | undefined,
): Response | null {
  if (!gate || gate.trafficClass !== "customer" || !finalization?.billingException) return null;
  return jsonResponse({
    error: {
      code: "managed_cost_reconciliation_required",
      type: "billing_error",
      message: "The provider-reported cost did not match APIClaw's authorized ceiling. The response was withheld and managed execution is paused for review.",
      requestId: gate.requestId,
      retryable: false,
    },
  }, 502);
}

function successfulManagedCostDetails(gate: ManagedCallGate | undefined): {
  providerCostUsd?: number;
  costSource: "fixed_price_policy" | "reservation" | "zero_cost";
} {
  const fixedCost = gate?.fixedProviderCostUsd;
  if (fixedCost === undefined) return { costSource: "reservation" };
  return {
    providerCostUsd: fixedCost,
    costSource: fixedCost === 0 ? "zero_cost" : "fixed_price_policy",
  };
}

async function preserveAmbiguousPostDispatchReservation(
  ctx: any,
  gate: ManagedCallGate | undefined,
  details: { provider?: string; model?: string } = {},
): Promise<void> {
  // The current ledger has no separate "outcome_unknown" status. Marking the
  // reservation consumed is the conservative alternative: activation spend is
  // not refunded after an upstream may have accepted work, and PAYG records a
  // billing exception instead of inventing a zero-cost call.
  await finalizeManagedCall(ctx, gate, {
    success: true,
    provider: details.provider,
    model: details.model,
    costSource: "reservation",
  });
}

async function ambiguousPostDispatchResponse(
  ctx: any,
  gate: ManagedCallGate | undefined,
  details: { provider?: string; model?: string } = {},
  status = 502,
  extra: Record<string, unknown> = {},
): Promise<Response> {
  await preserveAmbiguousPostDispatchReservation(ctx, gate, details);
  return jsonResponse({
    ...extra,
    success: false,
    code: "outcome_unknown",
    requestId: gate?.requestId,
    retryable: false,
    error: {
      code: "outcome_unknown",
      type: "gateway_error",
      message: "The upstream request may have completed, but APIClaw could not recover its response. Do not repeat this operation with a new idempotency key. Check Activity first.",
      requestId: gate?.requestId,
      retryable: false,
    },
  }, status);
}

async function codexOAuthOutcomeUnknownResponse(
  ctx: any,
  gate: ManagedCallGate,
  error: CodexOAuthDispatchError,
  details: {
    workspaceId: string;
    tier: string;
    path: "/v1/chat/completions" | "/v1/responses";
  },
): Promise<Response> {
  await ctx.runMutation((internal as any).managedUsage.markInternalOutcomeUnknown, {
    ledgerId: gate.ledgerId,
    code: error.code,
    attempts: error.attempts,
  });
  const receipt = codexOAuthExecutionReceipt({
    requestId: gate.requestId,
    outcome: "outcome_unknown",
    executionCertainty: error.executionCertainty,
    attempts: error.attempts,
    recovered: false,
    operatorActionRequired: error.operatorActionRequired,
    code: error.code,
  });

  if (error.operatorActionRequired) {
    try {
      const delivered = await ctx.runAction((internal as any).inbound.notifyOAuthPassthroughIncident, {
        workspaceId: details.workspaceId,
        tier: details.tier,
        timestamp: Date.now(),
        requestId: gate.requestId,
        path: details.path,
        code: error.code,
        attempts: error.attempts,
      });
      if (delivered?.delivered) {
        await ctx.runMutation((internal as any).managedUsage.markInternalOperatorAlertDelivered, {
          ledgerId: gate.ledgerId,
          deliveredAt: Date.now(),
        });
      }
    } catch (alertError) {
      console.error(
        "[OAuth passthrough] actionable incident alert failed:",
        alertError instanceof Error ? alertError.message : "unknown_error",
      );
    }
  }

  return jsonResponse({
    error: {
      code: error.code,
      type: "gateway_error",
      message: "The OAuth provider may have completed the request after APIClaw lost the response. Do not submit it with a new idempotency key. Reconcile the requestId before deciding whether to retry.",
      requestId: gate.requestId,
      retryable: false,
      operatorActionRequired: error.operatorActionRequired,
    },
    _apiclaw: {
      provider: "openai-codex",
      via: "codex-oauth",
      execution: receipt,
    },
  }, error.code === "oauth_upstream_timeout" ? 504 : 502);
}

async function finalizeProxyJson(
  ctx: any,
  gate: ManagedCallGate,
  response: Response,
  data: any,
  model?: string,
  provider = "",
): Promise<Response> {
  const usage = data?.usage;
  const inputTokens = usage?.prompt_tokens ?? usage?.input_tokens ?? 0;
  const outputTokens = usage?.completion_tokens ?? usage?.output_tokens ?? 0;
  const providerReportedCost = providerReportedUsageCostUsd(usage);
  const calculated = model && usage
    ? calculateCallCost(model, { prompt_tokens: inputTokens, completion_tokens: outputTokens })
    : undefined;
  const costDecision = resolveManagedResponseCost({
    provider,
    responseOk: response.ok,
    fixedProviderCostUsd: gate.fixedProviderCostUsd,
    providerReportedCostUsd: providerReportedCost,
    tokenTableCostUsd: calculated?.providerCost,
  });
  const finalization = await finalizeManagedCall(ctx, gate, {
    success: response.ok,
    providerCostUsd: costDecision.providerCostUsd,
    model,
    inputTokens: usage ? inputTokens : undefined,
    outputTokens: usage ? outputTokens : undefined,
    upstreamRequestId: typeof data?.id === "string" ? data.id : undefined,
    costSource: costDecision.costSource,
  });
  const reconciliationResponse = managedCostReconciliationResponse(gate, finalization);
  if (reconciliationResponse) return reconciliationResponse;
  return jsonResponse(data, response.status);
}

async function finalizeProxyFailure(
  ctx: any,
  gate: ManagedCallGate,
  error: unknown,
  status = 500,
  options: { postDispatch?: boolean; provider?: string; model?: string } = {},
): Promise<Response> {
  // Proxy handlers validate expected caller/config errors explicitly before
  // reaching this catch. An unexpected exception is therefore conservatively
  // treated as post-dispatch unless the caller proves otherwise.
  if (options.postDispatch !== false) {
    return ambiguousPostDispatchResponse(ctx, gate, {
      provider: options.provider,
      model: options.model,
    }, status);
  }
  await finalizeManagedCall(ctx, gate, { success: false, providerCostUsd: 0, costSource: "zero_cost" });
  const message = error instanceof Error ? error.message : String(error);
  return jsonResponse({
    success: false,
    error: {
      code: "managed_request_failed",
      type: "gateway_error",
      message,
    },
  }, status);
}

async function rejectProxyBeforeUpstream(
  ctx: any,
  gate: ManagedCallGate,
  data: unknown,
  status: number,
): Promise<Response> {
  await finalizeManagedCall(ctx, gate, {
    success: false,
    providerCostUsd: 0,
    costSource: "zero_cost",
  });
  return jsonResponse(data, status);
}

async function recordFirstSuccessfulGatewayCall(
  ctx: any,
  args: {
    workspaceId?: string;
    path: string;
    authMethod: string;
    provider?: string;
    action?: string;
  }
): Promise<void> {
  if (!args.workspaceId || args.authMethod === "anonymous") return;
  try {
    await ctx.runMutation((internal as any).activation.recordFirstCallApiSuccess, {
      workspaceId: args.workspaceId as any,
      path: args.path,
      authMethod: args.authMethod,
      provider: args.provider,
      action: args.action,
    });
  } catch (e: any) {
    // Activation telemetry must never turn a successful API call into a failure.
    console.error("[Activation] first-call recording failed:", e?.message);
  }
}

// Helper to validate session and log API usage.
// Returns a Response (401) when AUTH_ENFORCEMENT=enforce and the caller is anonymous.
// Returns a Response (403) when the provider is reserved for internal infrastructure.
async function validateAndLogProxyCall(
  ctx: any,
  request: Request,
  provider: string,
  action: string
): Promise<Response | {
  valid: true;
  workspaceId: string;
  subagentId?: string;
  authMethod: string;
  managedGate: ManagedCallGate;
  authorizedModel?: string;
  authorizedMaxOutputTokens?: number;
  authorizedInputTokens?: number;
}> {
  const subagentId = request.headers.get("X-APIClaw-Subagent") || "main";

  // Resolve workspace from any auth method
  const auth = await resolveWorkspaceFromRequest(ctx, request);
  const scopeDenied = mcpScopeDenial(auth, "call");
  if (scopeDenied) return scopeDenied;
  const resolvedWorkspaceId = auth.workspaceId;
  const identifier = request.headers.get("X-APIClaw-Identifier") || auth.workspaceId || "unknown";

  console.log("[Proxy] Call received", { provider, action, authMethod: auth.authMethod, workspaceId: resolvedWorkspaceId, subagentId });

  // ---- Internal-only provider gate ----
  // Reserved providers (Twilio/46elks/Resend) only accept X-APIClaw-Internal auth.
  // Anything else returns 403 even with a valid workspace key.
  if (
    INTERNAL_ONLY_PROVIDERS.has(provider.toLowerCase()) &&
    (auth as any).authMethod !== "internal"
  ) {
    return internalOnlyResponse(provider);
  }

  // ---- Gate: enforce vs shadow ----
  if (auth.authMethod === "anonymous") {
    // Log the unauth attempt to the funnel so conversion is measurable regardless of mode.
    try {
      await ctx.runMutation(api.funnel.recordEvent, {
        event: "call_api_blocked",
        classification: "human",
        userAgent: request.headers.get("User-Agent") ?? undefined,
        props: {
          reason: "unauth",
          provider,
          action,
          mode: isEnforceMode() ? "enforce" : "shadow",
          path: "/proxy/" + provider,
        },
      });
    } catch (e: any) {
      console.error("[Proxy] Funnel log failed:", e.message);
    }
    return unauthResponse("proxy_requires_auth");
  }

  let requestPayload: any = undefined;
  let authorizedModel: string | undefined;
  let authorizedMaxOutputTokens: number | undefined;
  let estimatedInputTokens: number | undefined;
  let estimatedProviderCostUsd: number | undefined;
  if (action === "chat") {
    try {
      requestPayload = await managedRequestPayload(request, undefined);
      if (!requestPayload || typeof requestPayload !== "object" || Array.isArray(requestPayload)) {
        return jsonResponse({ error: { code: "invalid_request", message: "Managed chat body must be a JSON object." } }, 400);
      }
      const defaults: Record<string, string> = {
        openrouter: "anthropic/claude-sonnet-4-6",
        groq: "llama-3.3-70b-versatile",
        mistral: "mistral-small-latest",
        cohere: "command-a-03-2025",
        together: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        deepinfra: "moonshotai/Kimi-K2.6",
      };
      authorizedModel = typeof requestPayload.model === "string" && requestPayload.model
        ? requestPayload.model
        : defaults[provider];
      authorizedMaxOutputTokens = normalizeMaxOutputTokens(
        requestPayload.max_completion_tokens ?? requestPayload.max_tokens,
        1_024,
      );
      requestPayload = normalizeManagedLlmRequestForCost(requestPayload, {
        model: authorizedModel ?? "",
        maxOutputTokens: authorizedMaxOutputTokens,
        outputField: requestPayload.max_completion_tokens !== undefined
          ? "max_completion_tokens"
          : "max_tokens",
      });
      estimatedInputTokens = estimateInputTokens(requestPayload);
      estimatedProviderCostUsd = authorizedModel
        ? estimateKnownModelUpperBoundUsd(authorizedModel, estimatedInputTokens, authorizedMaxOutputTokens)
        : undefined;
    } catch (error) {
      return jsonResponse({
        error: {
          code: "invalid_managed_request",
          message: error instanceof Error ? error.message : "Invalid managed request",
        },
      }, 400);
    }
  }

  const quotaGate = await enforcePreCallQuota(
    ctx,
    request,
    resolvedWorkspaceId,
    provider,
    action,
    `/proxy/${provider}`,
    {
      model: authorizedModel,
      estimatedProviderCostUsd,
      estimatedInputTokens,
      maxOutputTokens: authorizedMaxOutputTokens,
      trafficClass: auth.authMethod === "internal" ? "internal" : "customer",
      requestPayload,
    },
  );
  if (quotaGate instanceof Response) return quotaGate;

  // ALWAYS log to analytics (mirrors existing behavior for dashboard continuity)
  try {
    await ctx.runMutation(api.analytics.log, {
      event: "api_call",
      provider,
      identifier: identifier,
      workspaceId: resolvedWorkspaceId as any,
      metadata: { action, subagentId, authMethod: auth.authMethod },
    });
  } catch (e: any) {
    console.error("[Proxy] Analytics logging failed:", e.message, e.stack);
  }

  // If we have a workspace, log the request. Usage was already atomically
  // reserved above and must never be incremented in a second transaction.
  if (resolvedWorkspaceId) {
    try {
      await ctx.runMutation(internal.logs.createProxyLog, {
        workspaceId: resolvedWorkspaceId as any,
        provider,
        action,
        subagentId,
      });
    } catch (e: any) {
      console.error("[Proxy] Workspace logging failed:", e.message);
    }
    return {
      valid: true,
      workspaceId: resolvedWorkspaceId,
      subagentId,
      authMethod: auth.authMethod,
      managedGate: quotaGate,
      authorizedModel,
      authorizedMaxOutputTokens,
      authorizedInputTokens: estimatedInputTokens,
    };
  }
  return jsonResponse({ error: { code: "workspace_required", message: "Managed calls require a workspace." } }, 401);
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

// Full registry discovery. Signup required, discovery is free.
http.route({
  path: "/v1/discover",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

http.route({
  path: "/v1/discover",
  method: "POST",
  handler: httpAction(async (ctx, request): Promise<Response> => {
    try {
      const authResult = await requireApiKeyAuth(ctx, request, "read");
      if (authResult instanceof Response) {
        return authResult.status === 403
          ? authResult
          : discoverAuthResponse("discover_requires_signup");
      }

      const body = await readManagedJsonBodyCapped(request);
      const query = body.query || "";
      const category = body.category || "";
      const callableOnly = body.callable_only ?? false;
      const tier = typeof body.tier === "string" ? body.tier.trim().toLowerCase() : "";
      const allowedTiers = new Set(["", "managed", "verified", "callable", "discovery"]);
      if (!allowedTiers.has(tier)) {
        return jsonResponse({
          error: {
            code: "invalid_tier",
            message: "tier must be one of: managed, verified, callable, discovery",
          },
        }, 400);
      }
      const page = body.page || 1;
      const limit = Math.min(body.limit || 20, 100);

      // Build query params for the Vercel catalog endpoint
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      if (callableOnly) params.set("callable", "true");
      if (tier) params.set("tier", tier);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const catalogUrl = `https://apiclaw.cloud/api/catalog?${params.toString()}`;
      const catalogRes = await fetch(catalogUrl, { signal: AbortSignal.timeout(10_000) });

      if (!catalogRes.ok) {
        return jsonResponse({ error: "Registry unavailable" }, 502);
      }

      const catalogData = await catalogRes.json() as {
        items: Array<{ name: string; description: string; category: string; baseUrl: string; docsUrl: string; auth: string; pricing: string; callable?: boolean }>;
        total: number;
        totalDiscoverable: number;
        page: number;
        limit: number;
        hasMore: boolean;
        categories: Record<string, { total: number; callable: number }>;
        totalCallable: number;
      };

      // Strip internal-infrastructure providers from public discovery.
      const filteredApis = (catalogData.items || []).filter((item) =>
        ![item.name, item.baseUrl, item.docsUrl].some(isInternalProviderReference)
      );

      // Inbound discovery log to provider-owner workspaces (parity with MCP src/index.ts:1499).
      // Without this, gateway/HTTP discoveries bypass partner dashboards.
      // Keyword map mirrors the one in src/index.ts:1501 — keep in sync.
      if (query) {
        const PROVIDER_KEYWORDS: Record<string, string[]> = {
          apilayer: ["exchange", "currency", "fixer", "weather", "ip", "geo", "flight", "aviation", "vat", "news", "scrape", "screenshot", "pdf", "email verif", "phone verif", "language", "user agent", "coinlayer", "marketstack", "positionstack", "ipstack", "mediastack", "serpstack", "userstack", "scrapestack", "weatherstack"],
          filestack: ["file upload", "upload file", "file storage", "file picker", "image upload", "upload image", "file transform", "image transform", "resize image", "document upload", "upload document", "file delivery", "cdn upload", "file processing", "ocr", "virus scan", "file convert", "convert pdf", "filestack"],
        };
        const queryLower = String(query).toLowerCase();
        const callerWorkspaceId = authResult.workspaceId;

        for (const [provider, keywords] of Object.entries(PROVIDER_KEYWORDS)) {
          if (keywords.some((kw) => queryLower.includes(kw))) {
            try {
              await ctx.runMutation(api.providers.logDiscovery, {
                provider,
                query: String(query).substring(0, 100),
                latencyMs: 0,
                callerWorkspaceId,
              });
            } catch (e: any) {
              console.error("[Discover] logDiscovery failed:", e?.message);
            }
          }
        }
      }

      return jsonResponse({
        apis: filteredApis,
        total: catalogData.total,
        page: catalogData.page,
        limit: catalogData.limit,
        hasMore: catalogData.hasMore,
        categories: catalogData.categories,
        totalDiscoverable: catalogData.totalDiscoverable,
        totalCallable: catalogData.totalCallable,
        _meta: {
          discoverable: `${catalogData.totalDiscoverable.toLocaleString("en-US")} discoverable APIs`,
          callable: `${catalogData.totalCallable.toLocaleString("en-US")} callable APIs`,
          discoveryRequiresSignup: true,
          discoveryCost: "free",
          docs: "https://apiclaw.cloud/docs",
        },
      });
    } catch (e: any) {
      return jsonResponse({ error: "Discovery failed", details: e.message }, 500);
    }
  }),
});

// Discover managed providers only (legacy endpoint)
http.route({
  path: "/api/discover",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const authResult = await requireApiKeyAuth(ctx, request, "read");
      if (authResult instanceof Response) {
        return authResult.status === 403
          ? authResult
          : discoverAuthResponse("discover_requires_signup");
      }
      const startTime = Date.now();
      const body = await readManagedJsonBodyCapped(request);
      const query = (body.query || "").toLowerCase();
      
      // Get optional auth context
      const sessionToken = request.headers.get("X-APIClaw-Session");
      const userAgent = request.headers.get("User-Agent");

      const results = Object.entries(PROVIDERS)
        .filter(([id]) => isPubliclyAvailableManagedProvider(id))
        .filter(([id, provider]) => {
          if (!query) return true;
          return (
            provider.name.toLowerCase().includes(query) ||
            provider.description.toLowerCase().includes(query) ||
            provider.category.toLowerCase().includes(query) ||
            provider.tags.some((tag) => tag.includes(query))
          );
        })
        .map(([id, provider]) => {
          const adapter = getManagedProviderAdapter(id);
          return {
            providerId: id,
            ...provider,
            customerExecutableActions: adapter?.customerExecutableActions ?? [],
            customerExecutable: (adapter?.customerExecutableActions.length ?? 0) > 0,
          };
        });

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
      const authResult = await requireApiKeyAuth(ctx, request, "read");
      if (authResult instanceof Response) {
        return authResult.status === 403
          ? authResult
          : discoverAuthResponse("details_require_signup");
      }
      const body = await readManagedJsonBodyCapped(request);
      const providerId = body.providerId || body.name || body.api_id;

      if (!providerId) {
        return jsonResponse({ error: "providerId required" }, 400);
      }

      const provider = PROVIDERS[providerId as keyof typeof PROVIDERS];
      if (!provider || !isPubliclyAvailableManagedProvider(String(providerId))) {
        return jsonResponse({ error: "Provider not found" }, 404);
      }

      return jsonResponse({
        providerId,
        ...provider,
        creditsPerDollar: getCreditsPerDollar(providerId),
        documentation: `https://apiclaw.cloud/docs/${providerId}`,
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
  handler: httpAction(async () => jsonResponse({ error: "legacy_balance_retired" }, 410)),
});

// Authenticated workspace allowance and billing readiness for the current CLI.
http.route({
  path: "/api/balance",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = await resolveWorkspaceFromRequest(ctx, request);
    const scopeDenied = mcpScopeDenial(auth, "billing");
    if (scopeDenied) return scopeDenied;
    if (auth.authMethod === "anonymous" || !auth.workspaceId) {
      return unauthResponse("balance_requires_authenticated_workspace");
    }
    const workspace = await ctx.runQuery(internal.billing.getWorkspace, {
      id: auth.workspaceId as Id<"workspaces">,
    });
    if (!workspace || workspace.status !== "active") {
      return unauthResponse("workspace_inactive_or_missing");
    }
    const usage = getWorkspaceUsageDisplay(workspace);
    return jsonResponse({
      authenticated: true,
      email: workspace.email,
      status: workspace.status,
      tier: workspace.tier,
      usageCount: usage.usageCount,
      usageLimit: usage.usageLimit,
      usageRemaining: usage.usageRemaining,
      managedUsageCount: workspace.managedUsageCount ?? workspace.usageCount ?? 0,
      managedUsageLimit: usage.usageLimit,
      activationProviderCostUsd: (workspace.activationProviderCostMicros ?? 0) / 1_000_000,
      activationProviderCostCapUsd: FREE_MANAGED_PROVIDER_COST_CAP_USD,
      paygActive: hasActivePaygEntitlement(workspace),
      hasStripe: !!workspace.stripeCustomerId,
      createdAt: workspace.createdAt,
      authMethod: auth.authMethod,
    });
  }),
});

// Purchase API access
http.route({
  path: "/api/purchase",
  method: "POST",
  handler: httpAction(async () => jsonResponse({ error: "legacy_credit_purchase_retired" }, 410)),
});

// Admin: Grant credits
http.route({
  path: "/admin/grant-credits",
  method: "POST",
  handler: httpAction(async () => jsonResponse({ error: "public_credit_grant_retired" }, 410)),
});

function getCreditsPerDollar(providerId: string): number {
  const rates: Record<string, number> = {
    resend: 1000,
    brave_search: 200,
    openrouter: 100,
    elevenlabs: 3333,
  };
  return rates[providerId] || 100;
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
    const __gate = await validateAndLogProxyCall(ctx, request, "openrouter", "chat");
    if (__gate instanceof Response) return __gate;
    
    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "OpenRouter not configured" }, 500);
    }

    let upstreamDispatchAttempted = false;
    try {
      const body = await readManagedJsonBodyCapped(request);
      if (body.stream === true) {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, {
          error: "Streaming managed responses are unavailable until exact usage metering can be reconciled. Use stream=false.",
          code: "streaming_billing_unavailable",
        }, 400);
      }
      const model = __gate.authorizedModel!;
      const maxOutputTokens = __gate.authorizedMaxOutputTokens!;
      const upstreamBody = __gate.managedGate.trafficClass === "customer"
        ? costBoundedOpenRouterRequest(
            body,
            model,
            maxOutputTokens,
            __gate.authorizedInputTokens ?? estimateInputTokens(body),
          )
        : {
            ...body,
            model,
            max_tokens: maxOutputTokens,
            stream: false,
            max_completion_tokens: undefined,
          };
      const pseudonymSecret = process.env.APICLAW_PSEUDONYM_SECRET;
      if (!pseudonymSecret) throw new Error("OpenRouter attribution secret is not configured");
      const attributedBody = await decorateOpenRouterRequest(upstreamBody, __gate.workspaceId, pseudonymSecret);
      
      upstreamDispatchAttempted = true;
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://apiclaw.cloud",
          "X-Title": "APIClaw",
        },
        body: JSON.stringify(attributedBody),
        signal: AbortSignal.timeout(60_000),
      });

      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data, model, "openrouter");
    } catch (e: any) {
      if (e instanceof UnsafeManagedOpenRouterRequestError && !upstreamDispatchAttempted) {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, {
          error: e.message,
          code: e.code,
        }, 400);
      }
      return finalizeProxyFailure(ctx, __gate.managedGate, e, 500, {
        postDispatch: upstreamDispatchAttempted,
        provider: "openrouter",
        model: __gate.authorizedModel,
      });
    }
  }),
});

// Brave Search proxy
http.route({
  path: "/proxy/brave_search",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate session and log usage
    const __gate = await validateAndLogProxyCall(ctx, request, "brave_search", "search");
    if (__gate instanceof Response) return __gate;
    
    const BRAVE_KEY = process.env.BRAVE_API_KEY;
    if (!BRAVE_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "Brave Search not configured" }, 500);
    }

    try {
      const body = await readManagedJsonBodyCapped(request);
      const { query, count = 10 } = body;

      const url = new URL("https://api.search.brave.com/res/v1/web/search");
      url.searchParams.set("q", query);
      url.searchParams.set("count", String(count));

      const response = await fetch(url.toString(), {
        headers: { "X-Subscription-Token": BRAVE_KEY },
      });

      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data);
    } catch (e: any) {
      return finalizeProxyFailure(
        ctx,
        __gate.managedGate,
        e,
        e instanceof RangeError || e instanceof TypeError ? 400 : 500,
      );
    }
  }),
});

// Resend email proxy
http.route({
  path: "/proxy/resend",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate session and log usage
    const __gate = await validateAndLogProxyCall(ctx, request, "resend", "send_email");
    if (__gate instanceof Response) return __gate;
    
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "Resend not configured" }, 500);
    }

    try {
      const body = await readManagedJsonBodyCapped(request);

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e);
    }
  }),
});

// ElevenLabs TTS proxy
http.route({
  path: "/proxy/elevenlabs",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate session and log usage
    const __gate = await validateAndLogProxyCall(ctx, request, "elevenlabs", "text_to_speech");
    if (__gate instanceof Response) return __gate;
    
    const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "ElevenLabs not configured" }, 500);
    }

    try {
      const body = await readManagedJsonBodyCapped(request);
      const { text, voice_id = "21m00Tcm4TlvDq8ikWAM" } = body;
      let endpoint: string;
      try {
        endpoint = elevenLabsTextToSpeechUrl(voice_id);
      } catch {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "invalid voice_id" }, 400);
      }

      const response = await fetch(endpoint, {
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
        const error = await readUpstreamTextCapped(response);
        await finalizeManagedCall(ctx, __gate.managedGate, { success: false, providerCostUsd: 0, costSource: "zero_cost" });
        return jsonResponse({ error }, response.status);
      }

      // Return audio as base64
      const arrayBuffer = (await readUpstreamBytesCapped(response)).buffer;
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      await finalizeManagedCall(ctx, __gate.managedGate, { success: true, costSource: "reservation" });
      
      return jsonResponse({
        audio_base64: base64,
        content_type: "audio/mpeg",
      });
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e);
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
    const __gate = await validateAndLogProxyCall(ctx, request, "46elks", "send_sms");
    if (__gate instanceof Response) return __gate;
    
    const ELKS_USER = process.env.ELKS_API_USER;
    const ELKS_PASS = process.env.ELKS_API_PASSWORD;
    if (!ELKS_USER || !ELKS_PASS) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "46elks not configured" }, 500);
    }

    try {
      const body = await readManagedJsonBodyCapped(request);
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

      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e);
    }
  }),
});

// Twilio SMS proxy
http.route({
  path: "/proxy/twilio",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate session and log usage
    const __gate = await validateAndLogProxyCall(ctx, request, "twilio", "send_sms");
    if (__gate instanceof Response) return __gate;
    
    const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    if (!TWILIO_SID || !TWILIO_TOKEN) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "Twilio not configured" }, 500);
    }

    try {
      const body = await readManagedJsonBodyCapped(request);
      const { to, message, from } = body;

      if (!from) {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "Twilio requires 'from' number" }, 400);
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

      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e);
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
    // Read a bounded body before deriving the action used by the managed gate.
    const body = await readManagedJsonBodyCapped(request);
    const action = body.action || "search_repos";
    const __gate = await validateAndLogProxyCall(ctx, request, "github", action);
    if (__gate instanceof Response) return __gate;

    try {
      const { action, ...params } = body;
      let url: string;
      let method = "GET";
      let fetchBody: string | undefined;

      // Route based on action
      switch (action) {
        case "search_repos": {
          const query = typeof params.query === "string" ? params.query.trim() : "";
          if (!query || query.length > 256) {
            return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "query must be between 1 and 256 characters" }, 400);
          }
          const sort = ["stars", "forks", "help-wanted-issues", "updated"].includes(params.sort)
            ? params.sort
            : "stars";
          const limit = Math.min(100, Math.max(1, Number.isSafeInteger(params.limit) ? params.limit : 10));
          const searchUrl = new URL("https://api.github.com/search/repositories");
          searchUrl.searchParams.set("q", query);
          searchUrl.searchParams.set("sort", sort);
          searchUrl.searchParams.set("per_page", String(limit));
          url = searchUrl.toString();
          break;
        }

        case "get_repo": {
          url = githubRepositoryApiUrl(params.owner, params.repo);
          break;
        }

        case "list_issues": {
          const issuesUrl = new URL(`${githubRepositoryApiUrl(params.owner, params.repo)}/issues`);
          const state = ["open", "closed", "all"].includes(params.state) ? params.state : "open";
          const issueLimit = Math.min(100, Math.max(1, Number.isSafeInteger(params.limit) ? params.limit : 10));
          issuesUrl.searchParams.set("state", state);
          issuesUrl.searchParams.set("per_page", String(issueLimit));
          url = issuesUrl.toString();
          break;
        }

        case "create_issue": {
          if (__gate.managedGate.trafficClass !== "internal") {
            return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "GitHub write actions require an owner-scoped connection" }, 403);
          }
          const title = typeof params.title === "string" ? params.title.trim() : "";
          const issueBody = typeof params.body === "string" ? params.body : "";
          if (!title || title.length > 256 || issueBody.length > 65_536) {
            return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "Invalid issue title or body" }, 400);
          }
          url = `${githubRepositoryApiUrl(params.owner, params.repo)}/issues`;
          method = "POST";
          fetchBody = JSON.stringify({ title, body: issueBody });
          break;
        }

        case "get_file": {
          url = githubContentsApiUrl(params.owner, params.repo, params.path);
          break;
        }

        default:
          return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: `Unknown action: ${action}` }, 400);
      }

      const internalGitHubToken = __gate.managedGate.trafficClass === "internal"
        ? process.env.GITHUB_TOKEN
        : undefined;

      const response = await fetch(url, {
        method,
        headers: {
          ...(internalGitHubToken ? { "Authorization": `Bearer ${internalGitHubToken}` } : {}),
          "Accept": "application/vnd.github+json",
          "User-Agent": "APIClaw",
          ...(fetchBody ? { "Content-Type": "application/json" } : {}),
        },
        ...(fetchBody ? { body: fetchBody } : {}),
      });

      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data);
    } catch (e: any) {
      return finalizeProxyFailure(
        ctx,
        __gate.managedGate,
        e,
        e instanceof RangeError || e instanceof TypeError ? 400 : 500,
      );
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
    const __gate = await validateAndLogProxyCall(ctx, request, "serper", "search");
    if (__gate instanceof Response) return __gate;
    const SERPER_KEY = process.env.SERPER_API_KEY;
    if (!SERPER_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "Serper not configured" }, 500);
    }
    try {
      const body = await readManagedJsonBodyCapped(request);
      const { query, q, num = 10, gl = "us", hl = "en" } = body;
      const searchQuery = query || q;
      if (!searchQuery) {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "query required" }, 400);
      }
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: searchQuery, num, gl, hl }),
      });
      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e);
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
    const __gate = await validateAndLogProxyCall(ctx, request, "firecrawl", "scrape");
    if (__gate instanceof Response) return __gate;
    const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;
    if (!FIRECRAWL_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "Firecrawl not configured" }, 500);
    }
    try {
      const body = await readManagedJsonBodyCapped(request);
      const { url, formats = ["markdown"], onlyMainContent = true } = body;
      if (!url) {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "url required" }, 400);
      }
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, formats, onlyMainContent }),
      });
      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e);
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
    const __gate = await validateAndLogProxyCall(ctx, request, "groq", "chat");
    if (__gate instanceof Response) return __gate;
    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "Groq not configured" }, 500);
    }
    try {
      const body = await readManagedJsonBodyCapped(request);
      const { messages, temperature = 0.7 } = body;
      const model = __gate.authorizedModel!;
      const max_tokens = __gate.authorizedMaxOutputTokens!;
      if (!messages) {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "messages required" }, 400);
      }
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens }),
        signal: AbortSignal.timeout(60_000),
      });
      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data, model);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e, 500, {
        postDispatch: true,
        provider: "groq",
        model: __gate.authorizedModel,
      });
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
    const __gate = await validateAndLogProxyCall(ctx, request, "mistral", "chat");
    if (__gate instanceof Response) return __gate;
    const MISTRAL_KEY = process.env.MISTRAL_API_KEY;
    if (!MISTRAL_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "Mistral not configured" }, 500);
    }
    try {
      const body = await readManagedJsonBodyCapped(request);
      const { messages, temperature = 0.7 } = body;
      const model = __gate.authorizedModel!;
      const max_tokens = __gate.authorizedMaxOutputTokens!;
      if (!messages) {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "messages required" }, 400);
      }
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MISTRAL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens }),
        signal: AbortSignal.timeout(60_000),
      });
      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data, model);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e, 500, {
        postDispatch: true,
        provider: "mistral",
        model: __gate.authorizedModel,
      });
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
    const __gate = await validateAndLogProxyCall(ctx, request, "cohere", "chat");
    if (__gate instanceof Response) return __gate;
    const COHERE_KEY = process.env.COHERE_API_KEY;
    if (!COHERE_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "Cohere not configured" }, 500);
    }
    try {
      const body = await readManagedJsonBodyCapped(request);
      const { message, chat_history, temperature = 0.7 } = body;
      const model = __gate.authorizedModel!;
      const max_tokens = __gate.authorizedMaxOutputTokens!;
      if (!message) {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "message required" }, 400);
      }
      const response = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${COHERE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, message, chat_history, temperature, max_tokens }),
        signal: AbortSignal.timeout(60_000),
      });
      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data, model);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e, 500, {
        postDispatch: true,
        provider: "cohere",
        model: __gate.authorizedModel,
      });
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
    const __gate = await validateAndLogProxyCall(ctx, request, "replicate", "prediction");
    if (__gate instanceof Response) return __gate;
    const REPLICATE_KEY = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "Replicate not configured" }, 500);
    }
    try {
      const body = await readManagedJsonBodyCapped(request);
      const { model, input, version } = body;
      if (!model && !version) {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "model or version required" }, 400);
      }
      let endpoint: string;
      try {
        endpoint = version
          ? "https://api.replicate.com/v1/predictions"
          : replicateModelPredictionsUrl(model);
      } catch {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "model must be exactly owner/model" }, 400);
      }
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
      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data, model || version);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e);
    }
  }),
});

http.route({
  path: "/proxy/replicate",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// GET /proxy/replicate/poll?id=<prediction_id>
// Proxies Replicate GET /v1/predictions/{id} using APIClaw's managed token.
// Lets downstream callers (NordSym UGC Studio, etc.) poll long-running predictions
// without holding their own REPLICATE_API_TOKEN.
http.route({
  path: "/proxy/replicate/poll",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const __gate = await validateAndLogProxyCall(ctx, request, "replicate", "poll");
    if (__gate instanceof Response) return __gate;
    const REPLICATE_KEY = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "Replicate not configured" }, 500);
    }
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "id query param required" }, 400);
    }
    let endpoint: string;
    try {
      endpoint = replicatePredictionUrl(id);
    } catch {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "invalid prediction id" }, 400);
    }
    try {
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${REPLICATE_KEY}` },
      });
      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e);
    }
  }),
});

http.route({
  path: "/proxy/replicate/poll",
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
    const __gate = await validateAndLogProxyCall(ctx, request, "deepgram", "transcribe");
    if (__gate instanceof Response) return __gate;
    const DEEPGRAM_KEY = process.env.DEEPGRAM_API_KEY;
    if (!DEEPGRAM_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "Deepgram not configured" }, 500);
    }
    try {
      const body = await readManagedJsonBodyCapped(request);
      const { url, model = "nova-3", language = "en", smart_format = true } = body;
      if (!url) {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "url required (audio file URL)" }, 400);
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
      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data, model);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e);
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
    const __gate = await validateAndLogProxyCall(ctx, request, "e2b", "execute");
    if (__gate instanceof Response) return __gate;
    const E2B_KEY = process.env.E2B_API_KEY;
    if (!E2B_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "E2B not configured" }, 500);
    }
    try {
      const result = await executeE2BCode(E2B_KEY, await readManagedJsonBodyCapped(request));
      await finalizeManagedCall(ctx, __gate.managedGate, {
        success: result.ok,
        providerCostUsd: result.ok ? undefined : 0,
        costSource: result.ok ? "reservation" : "zero_cost",
      });
      return jsonResponse(result.data, result.status);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e);
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
    const __gate = await validateAndLogProxyCall(ctx, request, "together", "chat");
    if (__gate instanceof Response) return __gate;
    const TOGETHER_KEY = process.env.TOGETHER_API_KEY;
    if (!TOGETHER_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "Together AI not configured" }, 500);
    }
    try {
      const body = await readManagedJsonBodyCapped(request);
      const { messages, temperature = 0.7 } = body;
      const model = __gate.authorizedModel!;
      const max_tokens = __gate.authorizedMaxOutputTokens!;
      if (!messages || !Array.isArray(messages)) {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "messages array required" }, 400);
      }
      const response = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOGETHER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens }),
        signal: AbortSignal.timeout(60_000),
      });
      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data, model);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e, 500, {
        postDispatch: true,
        provider: "together",
        model: __gate.authorizedModel,
      });
    }
  }),
});

http.route({
  path: "/proxy/together",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// DEEPINFRA (Open-weights LLM Inference) PROXY
// ==============================================
http.route({
  path: "/proxy/deepinfra",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const __gate = await validateAndLogProxyCall(ctx, request, "deepinfra", "chat");
    if (__gate instanceof Response) return __gate;
    const DEEPINFRA_KEY = process.env.DEEPINFRA_API_KEY;
    if (!DEEPINFRA_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "DeepInfra not configured" }, 500);
    }
    try {
      const body = await readManagedJsonBodyCapped(request);
      const { messages, temperature = 0.7 } = body;
      const model = __gate.authorizedModel!;
      const max_tokens = __gate.authorizedMaxOutputTokens!;
      if (!messages || !Array.isArray(messages)) {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "messages array required" }, 400);
      }
      const response = await fetch("https://api.deepinfra.com/v1/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DEEPINFRA_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens }),
        signal: AbortSignal.timeout(60_000),
      });
      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data, model);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e, 500, {
        postDispatch: true,
        provider: "deepinfra",
        model: __gate.authorizedModel,
      });
    }
  }),
});

http.route({
  path: "/proxy/deepinfra",
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
    const __gate = await validateAndLogProxyCall(ctx, request, "stability", "generate");
    if (__gate instanceof Response) return __gate;
    const STABILITY_KEY = process.env.STABILITY_API_KEY;
    if (!STABILITY_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "Stability AI not configured" }, 500);
    }
    try {
      const body = await readManagedJsonBodyCapped(request);
      const { prompt, model = "sd3.5-large", output_format = "png", aspect_ratio = "1:1" } = body;
      if (!prompt) {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "prompt required" }, 400);
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
      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data, model);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e);
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
    const __gate = await validateAndLogProxyCall(ctx, request, "assemblyai", "transcribe");
    if (__gate instanceof Response) return __gate;
    const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY;
    if (!ASSEMBLYAI_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "AssemblyAI not configured" }, 500);
    }
    try {
      const body = await readManagedJsonBodyCapped(request);
      const { audio_url, language_detection = true, speaker_labels = true } = body;
      if (!audio_url) {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "audio_url required" }, 400);
      }
      const response = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
          Authorization: ASSEMBLYAI_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ audio_url, language_detection, speaker_labels }),
      });
      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e);
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
    const __gate = await validateAndLogProxyCall(ctx, request, "apilayer", "call");
    if (__gate instanceof Response) return __gate;
    const APILAYER_KEY = process.env.APILAYER_API_KEY;
    if (!APILAYER_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "APILayer not configured" }, 500);
    }
    try {
      const body = await readManagedJsonBodyCapped(request);
      const { service, endpoint, params = {} } = body;
      if (!service || !endpoint) {
        return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "service and endpoint required (e.g. service:'exchangerates', endpoint:'/latest')" }, 400);
      }
      const queryString = new URLSearchParams(params).toString();
      const url = `https://api.apilayer.com/${service}${endpoint}${queryString ? '?' + queryString : ''}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          apikey: APILAYER_KEY,
        },
      });
      const data = await readUpstreamJsonCapped(response);
      return finalizeProxyJson(ctx, __gate.managedGate, response, data);
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e);
    }
  }),
});

http.route({
  path: "/proxy/apilayer",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// NASA Open API proxy — api.nasa.gov. Accepts {path, method, params}.
// Key is injected server-side via ?api_key=<NASA_API_KEY>. SSRF pinned to api.nasa.gov.
http.route({
  path: "/proxy/nasa",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const __gate = await validateAndLogProxyCall(ctx, request, "nasa", "call");
    if (__gate instanceof Response) return __gate;

    const NASA_KEY = process.env.NASA_API_KEY;
    if (!NASA_KEY) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "NASA not configured" }, 500);
    }

    let body: any;
    try {
      body = await readManagedJsonBodyCapped(request);
    } catch (error) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, {
        error: {
          code: error instanceof RangeError ? "request_body_too_large" : "invalid_json",
          message: error instanceof RangeError
            ? "NASA request body exceeds the managed request limit."
            : "NASA request body must be valid JSON.",
        },
      }, error instanceof RangeError ? 413 : 400);
    }
    const path: string = typeof body?.path === "string" && body.path.startsWith("/") ? body.path : "/planetary/apod";
    let method: "GET";
    try {
      method = nasaReadOnlyMethod(body?.method);
    } catch (error) {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, {
        error: {
          code: "read_only_provider",
          message: error instanceof Error ? error.message : "NASA managed execution is read-only.",
        },
      }, 405);
    }
    const params: Record<string, any> = (body?.params && typeof body.params === "object") ? body.params : {};

    const url = new URL(path, "https://api.nasa.gov");
    if (url.origin !== "https://api.nasa.gov") {
      return rejectProxyBeforeUpstream(ctx, __gate.managedGate, { error: "invalid_target", detail: "path must resolve under api.nasa.gov" }, 400);
    }
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
    url.searchParams.set("api_key", NASA_KEY);

    try {
      const resp = await fetch(url.toString(), {
        method,
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
      });
      const ct = resp.headers.get("Content-Type") ?? "application/json";
      const text = await readUpstreamTextCapped(resp);
      await finalizeManagedCall(ctx, __gate.managedGate, {
        success: resp.ok,
        providerCostUsd: 0,
        costSource: "zero_cost",
      });
      return new Response(text, {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": ct, "X-APIClaw-Mode": "managed", "X-APIClaw-Provider": "NASA" },
      });
    } catch (e: any) {
      return finalizeProxyFailure(ctx, __gate.managedGate, e, 502, { provider: "nasa" });
    }
  }),
});

http.route({
  path: "/proxy/nasa",
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
    if (legacyMagicLinkRetired()) return jsonResponse({
      error: "legacy_auth_retired",
      message: "Use APIClaw browser auth to verify workspace ownership.",
      command: "npx @nordsym/apiclaw auth login",
    }, 410);

    try {
      const body = await readManagedJsonBodyCapped(request);
      const { email, fingerprint } = body;

      if (!email || !email.includes("@")) {
        return jsonResponse({ error: "Valid email required" }, 400);
      }

      // Create magic link
      const result = await ctx.runMutation(internal.workspaces.createMagicLink, {
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
<p style="color:#666;font-size:13px;">Free activation: 25 managed calls lifetime, subject to a $1 provider-cost cap. This link expires in 1 hour.</p>
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

// Get workspace by email
http.route({
  path: "/workspace/by-email",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (legacyMagicLinkRetired()) {
      return jsonResponse({ error: "legacy_workspace_lookup_retired" }, 410);
    }
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return jsonResponse({ error: "email required" }, 400);
    }

    const result = await ctx.runQuery(internal.workspaces.getByEmail, { email });
    
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
  handler: httpAction(async () => jsonResponse({ error: "legacy_reminder_retired" }, 410)),
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
  handler: httpAction(async () => jsonResponse({ error: "debug_endpoint_retired" }, 410)),
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

// Helper: require auth (permanent API key OR CLI session). 401 if missing.
// Accepted forms:
//   Authorization: Bearer sk-claw-…     (legacy, still supported)
//   Authorization: Bearer sk-mcp-…      (Remote MCP OAuth)
//   X-APIClaw-Api-Key: sk-claw-…        (preferred permanent header)
//   X-APIClaw-Session: <sessionToken>   (CLI login — apiclaw login)
async function requireApiKeyAuth(
  ctx: any,
  request: Request,
  requiredMcpCapability: McpCapability = "call",
): Promise<{ workspaceId: string; keyId?: string; authMethod: "api-key" | "session" | "mcp-oauth" } | Response> {
  const auth = await resolveWorkspaceFromRequest(ctx, request);
  if (auth.authMethod === "api-key" && auth.workspaceId && auth.keyId) {
    return { workspaceId: auth.workspaceId, keyId: auth.keyId, authMethod: "api-key" };
  }
  if (auth.authMethod === "session" && auth.workspaceId) {
    return { workspaceId: auth.workspaceId, authMethod: "session" };
  }
  if (auth.authMethod === "mcp-oauth" && auth.workspaceId) {
    const scopeDenied = mcpScopeDenial(auth, requiredMcpCapability);
    if (scopeDenied) return scopeDenied;
    return { workspaceId: auth.workspaceId, authMethod: "mcp-oauth" };
  }
  return jsonResponse(
    {
      error: {
        message: "Authentication required. Get a free key at https://apiclaw.cloud/sign-up or run `apiclaw login`.",
        type: "invalid_api_key",
        code: "invalid_api_key",
        signupUrl: "https://apiclaw.cloud/sign-up",
      },
    },
    401
  );
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
    const { workspaceId, authMethod } = authResult;

    // Parse body
    let body: any;
    try {
      body = await readManagedJsonBodyCapped(request);
    } catch {
      return jsonResponse({ error: { message: "Invalid JSON body", type: "invalid_request_error" } }, 400);
    }

    const { model, messages, stream, ...rest } = body;
    if (!messages || !Array.isArray(messages)) {
      return jsonResponse({ error: { message: "messages array is required", type: "invalid_request_error" } }, 400);
    }

    let configuredDefaultModel: string | null = null;
    let configuredTier = "free";
    try {
      const routingSettings = await ctx.runQuery(internal.workspaceSettings.getForRouting, { workspaceId });
      configuredDefaultModel = routingSettings?.defaultModel ?? null;
      configuredTier = routingSettings?.tier ?? "free";
    } catch {}
    const explicitOpenRouterTarget = resolveExplicitOpenRouterTarget(model);
    const openRouterExecution = resolveExplicitOpenRouterExecution({
      provider: !isInternalTier(configuredTier) || explicitOpenRouterTarget ? "openrouter" : "auto",
      action: "chat",
      requestedModel: model || configuredDefaultModel || "auto",
    });
    const managedModelForRequest = openRouterExecution?.model ?? (model === "auto"
      ? "mistral-small-latest"
      : model || configuredDefaultModel || "anthropic/claude-sonnet-4-6");
    const modelForRouting = openRouterExecution?.routingModel ?? managedModelForRequest;
    const codexOauth = request.headers.get("X-APIClaw-OAuth");
    const modelStr = (model || "").toString().toLowerCase();
    const bareModel = modelStr.startsWith("openai/")
      ? modelStr.slice("openai/".length)
      : modelStr.startsWith("openai-codex/")
        ? modelStr.slice("openai-codex/".length)
        : modelStr;
    const codexRoutableModel = /^(gpt-5\.|gpt-5-codex|codex-)/.test(bareModel) || bareModel === "gpt-5";
    const codexOAuthCandidate = isCodexJwt(codexOauth) && codexRoutableModel;
    const codexAuthorizedModel = bareModel || "gpt-5.4";
    if (
      codexOAuthCandidate &&
      configuredTier !== "founder" &&
      configuredTier !== "partner"
    ) {
      return jsonResponse({
        error: {
          message: "OAuth passthrough is restricted to founder/partner workspaces. External callers must use apiclaw's managed routing.",
          type: "permission_error",
          code: "byok_not_permitted",
        },
      }, 403);
    }
    const codexIdempotency = codexOAuthCandidate
      ? requireCodexOAuthIdempotency(request)
      : null;
    if (codexIdempotency instanceof Response) return codexIdempotency;
    let authorizedMaxOutputTokens: number;
    try {
      authorizedMaxOutputTokens = normalizeMaxOutputTokens(rest.max_completion_tokens ?? rest.max_tokens);
    } catch (error) {
      return jsonResponse({
        error: {
          message: error instanceof Error ? error.message : "Invalid maximum output token value",
          type: "invalid_request_error",
          code: "invalid_max_output_tokens",
        },
      }, 400);
    }
    if (rest.max_completion_tokens !== undefined) {
      rest.max_completion_tokens = authorizedMaxOutputTokens;
      delete rest.max_tokens;
    } else {
      rest.max_tokens = authorizedMaxOutputTokens;
      delete rest.max_completion_tokens;
    }
    const normalizedRequestPayload = normalizeManagedLlmRequestForCost(
      { ...body, messages, stream },
      {
        model: managedModelForRequest,
        maxOutputTokens: authorizedMaxOutputTokens,
        outputField: rest.max_completion_tokens !== undefined
          ? "max_completion_tokens"
          : "max_tokens",
      },
    );
    const estimatedInputTokens = estimateInputTokens(normalizedRequestPayload);

    const quotaGate = await enforcePreCallQuota(
      ctx,
      request,
      workspaceId,
      codexOAuthCandidate ? "openai-codex" : openRouterExecution?.provider ?? "llm",
      "chat_completions",
      "/v1/chat/completions",
      {
        model: codexOAuthCandidate ? codexAuthorizedModel : managedModelForRequest,
        estimatedProviderCostUsd: codexOAuthCandidate
          ? 0
          : estimateKnownModelUpperBoundUsd(
              managedModelForRequest,
              estimatedInputTokens,
              authorizedMaxOutputTokens,
            ),
        estimatedInputTokens,
        maxOutputTokens: authorizedMaxOutputTokens,
        billingGradeCost: codexOAuthCandidate ? true : undefined,
        requestPayload: normalizedRequestPayload,
      },
    );
    if (quotaGate instanceof Response) return quotaGate;
    if (stream && quotaGate.trafficClass === "customer") {
      await finalizeManagedCall(ctx, quotaGate, { success: false, providerCostUsd: 0, costSource: "zero_cost" });
      return jsonResponse({
        error: {
          code: "streaming_billing_unavailable",
          type: "billing_error",
          message: "Streaming managed responses are temporarily unavailable for customer billing. Use stream=false so exact usage can be reconciled.",
        },
      }, 400);
    }

    // PR3: Codex OAuth short-circuit. If caller supplied X-APIClaw-OAuth with a Codex JWT
    // AND the requested model is Codex-routable (gpt-5.x, codex-*)
    // AND their workspace tier permits it (founder/partner only), translate Chat
    // Completions → Responses and forward to chatgpt.com/backend-api/codex/responses.
    // Cost = $0 to apiclaw (caller's ChatGPT subscription pays).
    //
    // Canon: BYOK is NOT a public concept in apiclaw. OAuth-passthrough is restricted to
    // founder/partner workspaces so external customers can't pipe their own subs through
    // the gateway. They go through apiclaw's managed keys + pass-through pricing instead.
    // Codex backend serves gpt-5.x variants and codex-* slugs. Other models
    // fall through to normal managed routing.
    if (codexOAuthCandidate) {
      const codexTier = configuredTier;
      let codexModel = model || "gpt-5.4";
      if (codexModel.startsWith("openai-codex/")) codexModel = codexModel.slice("openai-codex/".length);
      if (codexModel.startsWith("openai/")) codexModel = codexModel.slice("openai/".length);

      // Codex backend ALWAYS requires stream=true on the wire. We force it upstream;
      // for non-streaming callers we consume SSE serverside and reconstruct the response.
      // Also strip max_output_tokens (Codex doesn't accept it — server controls length).
      const codexBody = chatCompletionsToResponsesRequest(codexModel, messages, { ...rest, stream: true });
      delete codexBody.max_output_tokens;

      try {
        await ctx.runMutation(api.analytics.log, {
          event: "api_call",
          provider: "openai-codex",
          identifier: workspaceId,
          workspaceId: workspaceId as any,
          metadata: {
            action: "chat_completions_via_codex",
            model: codexModel,
            via: "codex-oauth",
            authMethod: "api-key",
          },
        });
        await ctx.runMutation(internal.logs.createProxyLog, {
          workspaceId: workspaceId as any,
          provider: "openai-codex",
          action: "chat_completions",
          subagentId: request.headers.get("X-APIClaw-Subagent") || "main",
        });
      } catch (e: any) {
        console.error("[/v1/chat/completions Codex] logging failed:", e?.message);
      }

      let dispatchDispose = () => {};
      let dispatchAttempts = 0;
      try {
        const dispatch = await dispatchCodexOAuthRequest({
          url: `${OPENAI_CODEX_RESPONSES_BASE_URL}/responses`,
          headers: buildCodexHeaders(
            codexOauth!,
            codexIdempotency!,
          ),
          body: JSON.stringify(codexBody),
          requestSignal: request.signal,
        });
        const upstream = dispatch.response;
        dispatchDispose = dispatch.dispose;
        dispatchAttempts = dispatch.attempts;

        // Non-2xx → map Codex { detail } to OpenAI error shape and return early.
        if (!upstream.ok) {
          let detail: any = null;
          try { detail = await upstream.json(); } catch { detail = { detail: await upstream.text() }; }
          dispatchDispose();
          if (codexHttpFailureCertainty(upstream.status) === "uncertain") {
            return codexOAuthOutcomeUnknownResponse(
              ctx,
              quotaGate,
              new CodexOAuthDispatchError(
                "oauth_upstream_server_error",
                "uncertain",
                dispatch.attempts,
                true,
                `Codex returned HTTP ${upstream.status} after accepting the dispatch.`,
              ),
              { workspaceId, tier: codexTier, path: "/v1/chat/completions" },
            );
          }
          const errMsg = detail?.error?.message ?? detail?.detail ?? `Codex upstream HTTP ${upstream.status}`;
          await finalizeManagedCall(ctx, quotaGate, {
            success: false,
            provider: "openai-codex",
            providerCostUsd: 0,
            model: codexModel,
            costSource: "zero_cost",
            terminalCode: detail?.error?.code ?? `http_${upstream.status}`,
            executionCertainty: "provider_rejected",
            operatorActionRequired: false,
            retryAttempts: dispatch.attempts,
          });
          return jsonResponse({
            error: {
              message: errMsg,
              type: "codex_error",
              code: detail?.error?.code ?? `http_${upstream.status}`,
            },
            _apiclaw: {
              provider: "openai-codex",
              via: "codex-oauth",
              authMode: "founder_oauth_passthrough" satisfies ApiClawAuthMode,
              credentialSource: "founder_oauth_passthrough",
              upstream_status: upstream.status,
              latencyMs: Date.now() - startTime,
              execution: codexOAuthExecutionReceipt({
                requestId: quotaGate.requestId,
                outcome: "provider_rejected",
                executionCertainty: "provider_rejected",
                attempts: dispatch.attempts,
                recovered: dispatch.recovered,
                operatorActionRequired: false,
                code: detail?.error?.code ?? `http_${upstream.status}`,
              }),
            },
          }, upstream.status);
        }

        // Codex always streams upstream. APIClaw buffers to a terminal event so
        // ledger state, activation, and the downstream receipt cannot become
        // successful on headers alone. Streaming callers still receive SSE,
        // emitted only after terminal reconciliation.
        const { response: responsesData, error: sseError } = await consumeCodexResponsesSSE(upstream.body);
        dispatchDispose();
        const latencyMs = Date.now() - startTime;
        const terminal = adjudicateCodexTerminalSSE({ response: responsesData, error: sseError });

        if (terminal.kind === "provider_terminal_failure") {
          await finalizeManagedCall(ctx, quotaGate, {
            success: false,
            provider: "openai-codex",
            providerCostUsd: 0,
            model: codexModel,
            costSource: "zero_cost",
            terminalCode: terminal.code,
            executionCertainty: "provider_terminal_failure",
            operatorActionRequired: false,
            retryAttempts: dispatch.attempts,
          });
          return jsonResponse({
            error: { message: terminal.message, type: "codex_error", code: terminal.code, retryable: false },
            _apiclaw: {
              provider: "openai-codex",
              via: "codex-oauth",
              authMode: "founder_oauth_passthrough" satisfies ApiClawAuthMode,
              credentialSource: "founder_oauth_passthrough",
              latencyMs,
              execution: codexOAuthExecutionReceipt({
                requestId: quotaGate.requestId,
                outcome: "provider_failed",
                executionCertainty: "provider_terminal_failure",
                attempts: dispatch.attempts,
                recovered: dispatch.recovered,
                operatorActionRequired: false,
                code: terminal.code,
              }),
            },
          }, 502);
        }
        if (terminal.kind === "outcome_unknown") {
          return codexOAuthOutcomeUnknownResponse(
            ctx,
            quotaGate,
            new CodexOAuthDispatchError(
              "oauth_empty_terminal_response",
              "uncertain",
              dispatch.attempts,
              true,
              "Codex closed the accepted stream without a terminal response.",
            ),
            { workspaceId, tier: codexTier, path: "/v1/chat/completions" },
          );
        }
        const completedResponse = terminal.response;

        await recordFirstSuccessfulGatewayCall(ctx, {
          workspaceId,
          path: "/v1/chat/completions",
          authMethod,
          provider: "openai-codex",
          action: "chat_completions",
        });

        const chatData = responsesToChatCompletionsResponse(completedResponse, codexModel);
        await finalizeManagedCall(ctx, quotaGate, {
          success: true,
          provider: "openai-codex",
          providerCostUsd: 0,
          model: codexModel,
          inputTokens: completedResponse?.usage?.input_tokens,
          outputTokens: completedResponse?.usage?.output_tokens,
          upstreamRequestId: completedResponse?.id,
          costSource: "zero_cost",
          executionCertainty: "completed",
          operatorActionRequired: false,
          retryAttempts: dispatch.attempts,
        });
        (chatData as any)._apiclaw = {
          gateway: "v1",
          endpoint: "/v1/chat/completions",
          provider: "openai-codex",
          via: "codex-oauth",
          authMode: "founder_oauth_passthrough" satisfies ApiClawAuthMode,
          credentialSource: "founder_oauth_passthrough",
          model: codexModel,
          latencyMs,
          cost: { providerUsd: 0, totalUsd: 0, note: "Codex OAuth — paid via ChatGPT subscription" },
          execution: codexOAuthExecutionReceipt({
            requestId: quotaGate.requestId,
            outcome: "succeeded",
            executionCertainty: "completed",
            attempts: dispatch.attempts,
            recovered: dispatch.recovered,
            operatorActionRequired: false,
          }),
        };
        if (stream) {
          return new Response(completedChatResponseSSE(chatData), {
            status: upstream.status,
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
              "X-APIClaw-Request-Id": quotaGate.requestId,
              "X-APIClaw-Execution-Attempts": String(dispatch.attempts),
              ...corsHeaders,
            },
          });
        }
        return jsonResponse(chatData, upstream.status);
      } catch (e: any) {
        dispatchDispose();
        if (e instanceof CodexOAuthDispatchError && e.executionCertainty === "uncertain") {
          return codexOAuthOutcomeUnknownResponse(
            ctx,
            quotaGate,
            e,
            { workspaceId, tier: codexTier, path: "/v1/chat/completions" },
          );
        }
        if (e instanceof CodexOAuthDispatchError) {
          await finalizeManagedCall(ctx, quotaGate, {
            success: false,
            provider: "openai-codex",
            providerCostUsd: 0,
            model: codexModel,
            costSource: "zero_cost",
          });
          return jsonResponse({
            error: {
              message: e.message,
              type: "gateway_error",
              code: e.code,
              retryable: false,
            },
            _apiclaw: {
              provider: "openai-codex",
              via: "codex-oauth",
              execution: codexOAuthExecutionReceipt({
                requestId: quotaGate.requestId,
                outcome: "cancelled",
                executionCertainty: e.executionCertainty,
                attempts: e.attempts,
                recovered: false,
                operatorActionRequired: false,
                code: e.code,
              }),
            },
          }, 499);
        }
        return codexOAuthOutcomeUnknownResponse(
          ctx,
          quotaGate,
          new CodexOAuthDispatchError(
            "oauth_transport_error",
            "uncertain",
            Math.max(1, dispatchAttempts),
            true,
            "Codex response processing failed after dispatch.",
            { cause: e },
          ),
          { workspaceId, tier: codexTier, path: "/v1/chat/completions" },
        );
      }
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
      tier: string;
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
        tier: "free",
      };
    }

    // Apply request-level overrides
    const effectiveRoutingMode = routeOverride && ["best_price", "highest_quality", "fastest", "balanced", "advisor"].includes(routeOverride)
      ? routeOverride
      : settings.routingMode;

    // If routeOverride is a provider name, add it as preferred
    const effectivePreferred = routeOverride && PROVIDERS[routeOverride]?.isLLM
      ? [routeOverride, ...settings.preferredProviders]
      : settings.preferredProviders;

    const effectiveModel = modelForRouting;

    // Route the request. Advisor mode is deterministic and performs no hidden provider call.
    const route = await routeLLMRequest(effectiveModel, {
      routingMode: effectiveRoutingMode,
      preferredProviders: effectivePreferred,
      blockedProviders: settings.blockedProviders,
      allowOpenRouterFallback: settings.allowOpenRouterFallback,
    }, messages);

    if (!route) {
      await finalizeManagedCall(ctx, quotaGate, { success: false, providerCostUsd: 0, costSource: "zero_cost" });
      return jsonResponse({ error: { message: "No LLM provider available. Check workspace settings.", type: "server_error" } }, 503);
    }

    const isFounderOrPartner = settings.tier === "founder" || settings.tier === "partner";
    const requestedModelForGuard = String(effectiveModel || route.model || "");
    const codexSubscriptionModel = /^(openai\/|openai-codex\/)?(gpt-5(\.|-|$)|codex-)/i.test(requestedModelForGuard);
    if (isFounderOrPartner && route.provider === "openai" && codexSubscriptionModel) {
      await finalizeManagedCall(ctx, quotaGate, { success: false, provider: route.provider, providerCostUsd: 0, model: route.model, costSource: "zero_cost" });
      return jsonResponse({
        error: {
          message: "Founder OpenAI GPT-5/Codex routing requires valid Codex OAuth passthrough. Refusing managed OpenAI API key fallback.",
          type: "permission_error",
          code: "oauth_passthrough_required",
        },
        _apiclaw: {
          gateway: "v1",
          endpoint: "/v1/chat/completions",
          provider: "openai",
          routeReason: route.reason,
          model: route.model,
          authMode: "founder_oauth_required" satisfies ApiClawAuthMode,
          credentialSource: "managed_provider_key_blocked",
        },
      }, 403);
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
      await ctx.runMutation(internal.logs.createProxyLog, {
        workspaceId: workspaceId as any,
        provider: route.provider,
        action: "chat_completions",
        subagentId: request.headers.get("X-APIClaw-Subagent") || "main",
      });
    } catch (e: any) {
      console.error("[Gateway] Logging failed:", e.message);
    }

    // OAuth passthrough — founder tier can supply their own provider token
    // Header: X-APIClaw-OAuth: Bearer <token>
    // Only accepted for founder/partner tiers. Uses caller's token instead of managed key.
    const oauthPassthrough = request.headers.get("X-APIClaw-OAuth");
    const isPremiumTier = settings.tier === "founder" || settings.tier === "partner";
    const oauthPassthroughEligible = !!(oauthPassthrough && isPremiumTier && route.provider === "openai");
    const effectiveApiKey = oauthPassthroughEligible
      ? oauthPassthrough!.replace(/^Bearer\s+/i, "")
      : route.apiKey;

    // Forward to the chosen provider
    let upstreamDispatchAttempted = false;
    try {
      const isAnthropic = route.provider === "anthropic";
      let requestBody: any;
      let headers: Record<string, string>;

      if (isAnthropic) {
        // Anthropic Messages API format
        const { body: anthropicBody } = openaiToAnthropicRequest(route.model, messages, rest);
        if (stream) anthropicBody.stream = true;
        requestBody = anthropicBody;
        headers = {
          "x-api-key": effectiveApiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
          ...(route.extraHeaders || {}),
        };
      } else {
        requestBody = {
          model: route.model,
          messages,
          stream: stream || false,
          ...rest,
        };
        if (route.provider === "openrouter") {
          if (quotaGate.trafficClass === "customer") {
            requestBody = costBoundedOpenRouterRequest(
              requestBody,
              route.model,
              authorizedMaxOutputTokens,
              estimatedInputTokens,
            );
          }
          const pseudonymSecret = process.env.APICLAW_PSEUDONYM_SECRET;
          if (!pseudonymSecret) throw new Error("OpenRouter attribution secret is not configured");
          requestBody = await decorateOpenRouterRequest(requestBody, workspaceId, pseudonymSecret);
        }
        headers = {
          "Authorization": `Bearer ${effectiveApiKey}`,
          "Content-Type": "application/json",
          ...(route.extraHeaders || {}),
        };
      }

      let authMode: ApiClawAuthMode = oauthPassthroughEligible
        ? "founder_oauth_passthrough"
        : "managed_provider_key";

      upstreamDispatchAttempted = true;
      const response = await fetch(route.baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60_000),
      });

      // OAuth passthrough failures must not fall back to managed OpenAI billing.
      const usedOAuth = oauthPassthroughEligible && effectiveApiKey !== route.apiKey;
      if (usedOAuth && (response.status === 401 || response.status === 403)) {
        await finalizeManagedCall(ctx, quotaGate, { success: false, provider: route.provider, providerCostUsd: 0, model: route.model, costSource: "zero_cost" });
        return jsonResponse({
          error: {
            message: `OAuth passthrough failed with ${response.status}. Managed OpenAI API key fallback is disabled for founder/partner workspaces.`,
            type: "permission_error",
            code: "oauth_passthrough_failed",
          },
          _apiclaw: {
            gateway: "v1",
            endpoint: "/v1/chat/completions",
            provider: route.provider,
            routeReason: route.reason,
            model: route.model,
            authMode,
            credentialSource: "managed_provider_key_blocked",
          },
        }, response.status);
      }

      if (response.ok) {
        await recordFirstSuccessfulGatewayCall(ctx, {
          workspaceId,
          path: "/v1/chat/completions",
          authMethod,
          provider: route.provider,
          action: "chat_completions",
        });
      }

      // For streaming responses, proxy the stream directly
      if (stream && response.body) {
        await finalizeManagedCall(ctx, quotaGate, {
          success: response.ok,
          provider: route.provider,
          providerCostUsd: oauthPassthroughEligible ? 0 : undefined,
          model: route.model,
          costSource: oauthPassthroughEligible ? "zero_cost" : "reservation",
        });
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
      let data = await readUpstreamJsonCapped(response);

      // Translate Anthropic response to OpenAI format
      if (isAnthropic && response.ok) {
        data = anthropicToOpenaiResponse(data, route.model);
      }
      const latencyMs = Date.now() - startTime;

      // Calculate cost from token usage
      const usage = (data as any)?.usage;
      const calculatedCost = calculateCallCost(route.model, usage);
      const providerReportedCost = providerReportedUsageCostUsd(usage);
      const managedCostDecision = resolveManagedResponseCost({
        provider: route.provider,
        responseOk: response.ok,
        providerReportedCostUsd: providerReportedCost,
        tokenTableCostUsd: calculatedCost?.providerCost,
      });
      const providerCost = oauthPassthroughEligible
        ? 0
        : managedCostDecision.providerCostUsd;
      const apiclawCost = providerCost === undefined ? undefined : oauthPassthroughEligible ? 0 : providerCost * (1 + APICLAW_MARGIN);
      const finalization = await finalizeManagedCall(ctx, quotaGate, {
        success: response.ok,
        provider: route.provider,
        providerCostUsd: providerCost,
        model: route.model,
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        upstreamRequestId: typeof data?.id === "string" ? data.id : undefined,
        costSource: oauthPassthroughEligible
          ? "zero_cost"
          : managedCostDecision.costSource,
      });
      const reconciliationResponse = managedCostReconciliationResponse(quotaGate, finalization);
      if (reconciliationResponse) return reconciliationResponse;

      // Add APIClaw metadata
      if (data && typeof data === "object") {
        (data as any)._apiclaw = {
          latencyMs,
          provider: route.provider,
          routeReason: route.reason,
          model: route.model,
          authMode,
          credentialSource: authMode,
          gateway: "v1",
          cost: {
            providerUsd: providerCost === undefined ? null : Math.round(providerCost * 1_000_000) / 1_000_000,
            totalUsd: apiclawCost === undefined ? null : Math.round(apiclawCost * 1_000_000) / 1_000_000,
            margin: "15%",
          },
        };
      }

      return jsonResponse(data, response.status);
    } catch (e: any) {
      if (e instanceof UnsafeManagedOpenRouterRequestError && !upstreamDispatchAttempted) {
        await finalizeManagedCall(ctx, quotaGate, {
          success: false,
          providerCostUsd: 0,
          model: managedModelForRequest,
          costSource: "zero_cost",
        });
        return jsonResponse({
          error: {
            message: e.message,
            type: "invalid_request_error",
            code: e.code,
          },
        }, 400);
      }
      if (upstreamDispatchAttempted) {
        return ambiguousPostDispatchResponse(
          ctx,
          quotaGate,
          { provider: route.provider, model: route.model },
          502,
        );
      }
      await finalizeManagedCall(ctx, quotaGate, {
        success: false,
        provider: route.provider,
        providerCostUsd: 0,
        model: route.model,
        costSource: "zero_cost",
      });
      return jsonResponse({ error: { message: e.message, type: "server_error" } }, 500);
    }
  }),
});

http.route({
  path: "/v1/chat/completions",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// /v1/embeddings — OpenAI-compatible embedding gateway
// ==============================================
// Accepts: Authorization: Bearer sk-claw-...
// Routes by model prefix to managed-provider embedding providers:
//   voyage/*   → Voyage AI  (default: voyage-3-large)
//   mistral/*  → Mistral     (mistral-embed)
//   openai/*   → OpenAI      (text-embedding-3-small, -large, ada-002)
//   cohere/*   → Cohere      (embed-v4.0, embed-multilingual-v3) — translated
// Unprefixed model strings auto-route by known model names.
// ==============================================

type EmbeddingBackend = {
  provider: "voyage" | "mistral" | "openai" | "cohere";
  baseUrl: string;
  apiKey: string | undefined;
  model: string;
  format: "openai" | "cohere";
};

// Map a model string to a backend. Supports prefixed (voyage/voyage-3-large)
// and bare model names (text-embedding-3-small, mistral-embed, voyage-3-large).
function resolveEmbeddingBackend(requestedModel: string | undefined): EmbeddingBackend | null {
  const raw = (requestedModel || "voyage/voyage-3-large").trim();
  let provider: EmbeddingBackend["provider"] | null = null;
  let model = raw;

  // Explicit prefix
  if (raw.startsWith("voyage/")) {
    provider = "voyage";
    model = raw.slice(7);
  } else if (raw.startsWith("mistralai/")) {
    provider = "mistral";
    model = raw.slice(10);
  } else if (raw.startsWith("mistral/")) {
    provider = "mistral";
    model = raw.slice(8);
  } else if (raw.startsWith("openai/")) {
    provider = "openai";
    model = raw.slice(7);
  } else if (raw.startsWith("cohere/")) {
    provider = "cohere";
    model = raw.slice(7);
  } else {
    // Auto-detect from bare model name
    if (raw.startsWith("voyage-")) provider = "voyage";
    else if (raw.startsWith("mistral-embed") || raw === "mistral-embed") provider = "mistral";
    else if (raw.startsWith("text-embedding-") || raw.startsWith("ada-")) provider = "openai";
    else if (raw.startsWith("embed-")) provider = "cohere";
    else return null;
  }

  switch (provider) {
    case "voyage":
      return {
        provider,
        baseUrl: "https://api.voyageai.com/v1/embeddings",
        apiKey: process.env.VOYAGE_API_KEY,
        model: model || "voyage-3-large",
        format: "openai",
      };
    case "mistral":
      return {
        provider,
        baseUrl: "https://api.mistral.ai/v1/embeddings",
        apiKey: process.env.MISTRAL_API_KEY,
        model: model || "mistral-embed",
        format: "openai",
      };
    case "openai":
      return {
        provider,
        baseUrl: "https://api.openai.com/v1/embeddings",
        apiKey: process.env.OPENAI_API_KEY,
        model: model || "text-embedding-3-small",
        format: "openai",
      };
    case "cohere":
      return {
        provider,
        baseUrl: "https://api.cohere.com/v2/embed",
        apiKey: process.env.COHERE_API_KEY,
        model: model || "embed-v4.0",
        format: "cohere",
      };
  }
}

// /v1/embeddings — POST
http.route({
  path: "/v1/embeddings",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();

    const authResult = await requireApiKeyAuth(ctx, request);
    if (authResult instanceof Response) return authResult;
    const { workspaceId, authMethod } = authResult;

    let body: any;
    try {
      body = await readManagedJsonBodyCapped(request);
    } catch {
      return jsonResponse({ error: { message: "Invalid JSON body", type: "invalid_request_error" } }, 400);
    }

    const { model, input, encoding_format, dimensions, user, input_type } = body;
    if (input === undefined || input === null) {
      return jsonResponse({ error: { message: "input is required", type: "invalid_request_error" } }, 400);
    }

    const backend = resolveEmbeddingBackend(model);
    if (!backend) {
      return jsonResponse(
        { error: { message: `Unknown embedding model: ${model}. Use voyage/*, mistral/*, openai/*, or cohere/* prefix.`, type: "invalid_request_error" } },
        400
      );
    }
    if (!backend.apiKey) {
      return jsonResponse(
        { error: { message: `Provider ${backend.provider} is not configured (missing ${backend.provider.toUpperCase()}_API_KEY).`, type: "server_error" } },
        503
      );
    }

    const embeddingGate = await enforcePreCallQuota(
      ctx,
      request,
      workspaceId,
      backend.provider,
      "embeddings",
      "/v1/embeddings",
      {
        model: `${backend.provider}/${backend.model}`,
        estimatedProviderCostUsd: estimateManagedProviderCostUsd({
          provider: backend.provider,
          action: "embeddings",
          model: backend.model,
        }),
        requestPayload: body,
      },
    );
    if (embeddingGate instanceof Response) return embeddingGate;

    // Log usage
    try {
      await ctx.runMutation(api.analytics.log, {
        event: "api_call",
        provider: "gateway",
        identifier: workspaceId,
        workspaceId: workspaceId as any,
        metadata: {
          action: "embeddings",
          model: `${backend.provider}/${backend.model}`,
          routedTo: backend.provider,
          authMethod: "api-key",
        },
      });
      await ctx.runMutation(internal.logs.createProxyLog, {
        workspaceId: workspaceId as any,
        provider: backend.provider,
        action: "embeddings",
        subagentId: request.headers.get("X-APIClaw-Subagent") || "main",
      });
    } catch (e: any) {
      console.error("[Gateway] Embeddings logging failed:", e.message);
    }

    let upstreamDispatchAttempted = false;
    try {
      let providerRequestBody: any;
      let providerHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${backend.apiKey}`,
      };

      if (backend.format === "openai") {
        // OpenAI-compatible passthrough (Voyage, Mistral, OpenAI)
        providerRequestBody = {
          model: backend.model,
          input,
          ...(encoding_format !== undefined ? { encoding_format } : {}),
          ...(dimensions !== undefined ? { dimensions } : {}),
          ...(user !== undefined ? { user } : {}),
          ...(input_type !== undefined ? { input_type } : {}),
        };
      } else {
        // Cohere v2 format
        const texts = Array.isArray(input) ? input : [String(input)];
        providerRequestBody = {
          model: backend.model,
          texts,
          input_type: input_type || "search_document",
          embedding_types: ["float"],
        };
      }

      upstreamDispatchAttempted = true;
      const response = await fetch(backend.baseUrl, {
        method: "POST",
        headers: providerHeaders,
        body: JSON.stringify(providerRequestBody),
        signal: AbortSignal.timeout(60_000),
      });

      const providerData = await readUpstreamJsonCapped(response);
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        await finalizeManagedCall(ctx, embeddingGate, {
          success: false,
          provider: backend.provider,
          providerCostUsd: 0,
          model: backend.model,
          costSource: "zero_cost",
        });
        return jsonResponse(
          {
            error: {
              message: (providerData as any)?.error?.message || (providerData as any)?.message || `${backend.provider} error`,
              type: "provider_error",
              provider: backend.provider,
            },
            _apiclaw: { latencyMs, provider: backend.provider, gateway: "v1" },
          },
          response.status
        );
      }

      await recordFirstSuccessfulGatewayCall(ctx, {
        workspaceId,
        path: "/v1/embeddings",
        authMethod,
        provider: backend.provider,
        action: "embeddings",
      });

      // Normalize Cohere response to OpenAI format
      let openAIData: any;
      if (backend.format === "cohere") {
        const cohereEmbeddings: number[][] = (providerData as any)?.embeddings?.float || (providerData as any)?.embeddings || [];
        openAIData = {
          object: "list",
          data: cohereEmbeddings.map((embedding, index) => ({
            object: "embedding",
            embedding,
            index,
          })),
          model: `cohere/${backend.model}`,
          usage: {
            prompt_tokens: (providerData as any)?.meta?.billed_units?.input_tokens || 0,
            total_tokens: (providerData as any)?.meta?.billed_units?.input_tokens || 0,
          },
        };
      } else {
        // Already OpenAI-format
        openAIData = providerData;
        if (openAIData && typeof openAIData === "object" && !openAIData.model) {
          openAIData.model = `${backend.provider}/${backend.model}`;
        }
      }

      if (openAIData && typeof openAIData === "object") {
        openAIData._apiclaw = {
          latencyMs,
          provider: backend.provider,
          model: backend.model,
          gateway: "v1",
        };
      }

      const inputTokens = openAIData?.usage?.prompt_tokens ?? openAIData?.usage?.total_tokens ?? 0;
      await finalizeManagedCall(ctx, embeddingGate, {
        success: true,
        provider: backend.provider,
        model: backend.model,
        inputTokens,
        outputTokens: 0,
        upstreamRequestId: typeof providerData?.id === "string" ? providerData.id : undefined,
        costSource: "reservation",
      });

      return jsonResponse(openAIData, 200);
    } catch (e: any) {
      if (upstreamDispatchAttempted) {
        return ambiguousPostDispatchResponse(
          ctx,
          embeddingGate,
          { provider: backend.provider, model: backend.model },
          502,
        );
      }
      await finalizeManagedCall(ctx, embeddingGate, { success: false, provider: backend.provider, providerCostUsd: 0, model: backend.model, costSource: "zero_cost" });
      return jsonResponse({ error: { message: e.message, type: "server_error" } }, 500);
    }
  }),
});

http.route({
  path: "/v1/embeddings",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// /v1/execute — Unified execution gateway
// ==============================================
// Single endpoint for managed API call types:
//   1. Managed providers (19 providers, APIClaw owns keys)
//   2. LLM routing (Groq, Mistral, Together, OpenRouter)
// Unmanaged APIs remain discoverable but are not caller-controlled egress.
//
// Auth: Bearer sk-claw-... OR X-APIClaw-Internal (server-to-server)
// ==============================================

const VERIFIED_APILAYER_HTTPS_ORIGINS = new Set([
  "https://api.apilayer.com",
  "https://api.promptapi.com",
  "https://api.pdflayer.com",
  "https://api.screenshotlayer.com",
  "https://api.ipapi.com",
  "https://api.exchangerate.host",
  "https://api.marketstack.com",
  "https://api.aviationstack.com",
  "https://apilayer.net",
  "https://data.fixer.io",
  "https://api.currencylayer.com",
  "https://api.coinlayer.com",
  "https://api.weatherstack.com",
  "https://api.ipstack.com",
  "https://api.positionstack.com",
  "https://api.languagelayer.com",
  "https://api.scrapestack.com",
  "https://api.serpstack.com",
  "https://api.mediastack.com",
  "https://api.userstack.com",
]);

export function buildVerifiedApilayerHttpsUrl(
  base: string,
  query?: Record<string, unknown>,
): string {
  const url = new URL(base);
  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    !VERIFIED_APILAYER_HTTPS_ORIGINS.has(url.origin)
  ) {
    throw new RangeError("APILayer managed actions require a verified HTTPS origin.");
  }
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

// Managed provider dispatch: maps provider+action to an upstream HTTP call
// Returns { url, method, headers, body } or null if unknown/unavailable.
export function buildManagedRequest(
  provider: string,
  action: string,
  params: Record<string, any>
): { url: string; method: string; headers: Record<string, string>; body?: BodyInit } | null {
  const meta = PROVIDERS[provider];
  if (!meta?.envKey) return null;

  const apiKey = resolveManagedCredential(provider, meta.envKey, process.env);
  if (!apiKey) return null;

  // Provider-specific request builders
  switch (provider) {
    case "genprd": {
      if (action !== "generate_prd") return null;
      const { topic, audience, constraints, model, format } = params;
      if (!topic) return null;
      return {
        url: "https://genprd.se/api/generate",
        method: "POST",
        headers: { "X-GenPRD-Key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ topic, audience, constraints, model, format }),
      };
    }
    case "brave_search": {
      if (action !== "search") return null;
      const url = new URL("https://api.search.brave.com/res/v1/web/search");
      url.searchParams.set("q", params.query || "");
      url.searchParams.set("count", String(params.count || 10));
      return { url: url.toString(), method: "GET", headers: { "X-Subscription-Token": apiKey } };
    }
    case "nasa": {
      // Named common actions + a generic "call" passthrough for power users.
      // All resolve under https://api.nasa.gov; api_key query-param injected server-side.
      const nasaActionPaths: Record<string, string> = {
        apod: "/planetary/apod",
        neo_feed: "/neo/rest/v1/feed",
        neo_lookup: "/neo/rest/v1/neo",
        epic: "/EPIC/api/natural",
        epic_date: "/EPIC/api/natural/date",
        mars_weather: "/insight_weather/",
        earth_imagery: "/planetary/earth/imagery",
        earth_assets: "/planetary/earth/assets",
        donki_notifications: "/DONKI/notifications",
        call: "", // generic — caller passes params.path
      };
      if (!(action in nasaActionPaths)) return null;
      let pathStr = nasaActionPaths[action];
      if (action === "call") {
        pathStr = typeof params.path === "string" && params.path.startsWith("/") ? params.path : "/planetary/apod";
      }
      const url = new URL(pathStr, "https://api.nasa.gov");
      if (url.origin !== "https://api.nasa.gov") return null; // SSRF guard
      const skip = new Set(["path", "method", "api_key"]);
      for (const [k, v] of Object.entries(params)) {
        if (skip.has(k) || v === undefined || v === null) continue;
        url.searchParams.set(k, String(v));
      }
      url.searchParams.set("api_key", apiKey);
      return { url: url.toString(), method: "GET", headers: { "Accept": "application/json" } };
    }
    case "serper": {
      if (action !== "search") return null;
      return {
        url: "https://google.serper.dev/search",
        method: "POST",
        headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q: params.query || params.q, num: params.num || 10 }),
      };
    }
    case "resend": {
      if (action !== "send_email") return null;
      return {
        url: "https://api.resend.com/emails",
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(params),
      };
    }
    case "elevenlabs": {
      if (action !== "text_to_speech") return null;
      const voiceId = params.voice_id === undefined ? "21m00Tcm4TlvDq8ikWAM" : params.voice_id;
      let url: string;
      try {
        url = elevenLabsTextToSpeechUrl(voiceId);
      } catch {
        return null;
      }
      return {
        url,
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: params.text,
          model_id: params.model_id || "eleven_multilingual_v2",
          voice_settings: params.voice_settings || { stability: 0.5, similarity_boost: 0.75 },
        }),
      };
    }
    case "deepgram": {
      if (action !== "transcribe") return null;
      const dgUrl = new URL("https://api.deepgram.com/v1/listen");
      if (params.language) dgUrl.searchParams.set("language", params.language);
      if (params.model) dgUrl.searchParams.set("model", params.model);
      dgUrl.searchParams.set("smart_format", "true");
      return {
        url: dgUrl.toString(),
        method: "POST",
        headers: { "Authorization": `Token ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: params.url || params.audio_url }),
      };
    }
    case "firecrawl": {
      const firecrawlActions: Record<string, string> = {
        scrape: "https://api.firecrawl.dev/v1/scrape",
        crawl: "https://api.firecrawl.dev/v1/crawl",
        map: "https://api.firecrawl.dev/v1/map",
      };
      const fUrl = firecrawlActions[action];
      if (!fUrl) return null;
      return {
        url: fUrl,
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(params),
      };
    }
    case "replicate": {
      if (action !== "run") return null;
      return {
        url: "https://api.replicate.com/v1/predictions",
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ version: params.version, input: params.input || params }),
      };
    }
    case "stability": {
      if (action !== "generate") return null;
      const form = new FormData();
      const allowed = ["prompt", "negative_prompt", "aspect_ratio", "seed", "output_format", "style_preset"];
      for (const key of allowed) {
        const value = params[key];
        if (value !== undefined && value !== null) form.append(key, String(value));
      }
      form.set("model", String(params.model || "sd3.5-flash"));
      if (!form.has("output_format")) form.set("output_format", "png");
      return {
        url: "https://api.stability.ai/v2beta/stable-image/generate/sd3",
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" },
        body: form,
      };
    }
    case "github": {
      // Customer GitHub reads intentionally use the public API without the
      // shared NordSym token. Private data and write actions require a future
      // owner-scoped GitHub connection.
      const ghHeaders = { "Accept": "application/vnd.github.v3+json", "User-Agent": "APIClaw-Gateway" };
      if (action === "search_repos") {
        const query = typeof (params.query || params.q) === "string" ? String(params.query || params.q).trim() : "";
        if (!query || query.length > 256) return null;
        const ghUrl = new URL("https://api.github.com/search/repositories");
        ghUrl.searchParams.set("q", query);
        return { url: ghUrl.toString(), method: "GET", headers: ghHeaders };
      }
      try {
        if (action === "get_repo") {
          return { url: githubRepositoryApiUrl(params.owner, params.repo), method: "GET", headers: ghHeaders };
        }
        if (action === "get_file") {
          return { url: githubContentsApiUrl(params.owner, params.repo, params.path), method: "GET", headers: ghHeaders };
        }
      } catch {
        return null;
      }
      return null;
    }
    case "e2b":
      return null; // Multi-step create/execute/cleanup is handled in executeE2BCode.
    case "46elks": {
      if (action !== "send_sms") return null;
      // 46elks uses Basic auth with username:password (envKey has format user:pass)
      const [user, pass] = apiKey.includes(":") ? apiKey.split(":") : [apiKey, ""];
      const basicAuth = typeof btoa !== "undefined" ? btoa(`${user}:${pass}`) : Buffer.from(`${user}:${pass}`).toString("base64");
      return {
        url: "https://api.46elks.com/a1/sms",
        method: "POST",
        headers: { "Authorization": `Basic ${basicAuth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ from: params.from || "APIClaw", to: params.to, message: params.message }).toString(),
      };
    }
    case "twilio": {
      // Twilio uses Basic auth. envKey format: accountSid:authToken
      const [sid, token] = apiKey.includes(":") ? apiKey.split(":") : [apiKey, ""];
      const twilioAuth = typeof btoa !== "undefined" ? btoa(`${sid}:${token}`) : Buffer.from(`${sid}:${token}`).toString("base64");
      return {
        url: `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        method: "POST",
        headers: { "Authorization": `Basic ${twilioAuth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ From: params.from, To: params.to, Body: params.message }).toString(),
      };
    }
    case "assemblyai": {
      if (action !== "transcribe") return null;
      return {
        url: "https://api.assemblyai.com/v2/transcript",
        method: "POST",
        headers: { "Authorization": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ audio_url: params.url || params.audio_url, ...params }),
      };
    }
    case "anthropic": {
      if (action === "chat" || action === "messages") {
        return {
          url: "https://api.anthropic.com/v1/messages",
          method: "POST",
          headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
          body: JSON.stringify(params),
        };
      }
      return null;
    }
    case "cohere": {
      if (action === "chat") {
        return {
          url: "https://api.cohere.com/v2/chat",
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(params),
        };
      }
      if (action === "rerank") {
        return {
          url: "https://api.cohere.com/v2/rerank",
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(params),
        };
      }
      return null;
    }
    case "apilayer": {
      // Every credentialed APILayer request is pinned to an explicitly verified
      // HTTPS origin. Legacy products that were only configured with plaintext
      // HTTP are deliberately unavailable until their HTTPS contract is proven.
      const p = (params as Record<string, any>) || {};
      const buildUrl = buildVerifiedApilayerHttpsUrl;
      const envKey = (name: string) => process.env[name] || apiKey;

      switch (action) {
        // Unified (apikey header)
        case "exchange_rates": {
          const endpoint = p.date ? "historical" : "latest";
          return {
            url: buildUrl(`https://api.apilayer.com/exchangerates_data/${endpoint}`, { base: p.base || "USD", symbols: p.symbols, date: p.date }),
            method: "GET",
            headers: { apikey: apiKey },
          };
        }
        case "verify_email":
          if (!p.email) return null;
          return {
            url: buildUrl("https://api.apilayer.com/email_verification/check", { email: p.email }),
            method: "GET",
            headers: { apikey: apiKey },
          };
        case "verify_number":
          if (!p.number) return null;
          return {
            url: buildUrl("https://api.apilayer.com/number_verification/validate", { number: p.number }),
            method: "GET",
            headers: { apikey: apiKey },
          };
        case "world_news":
          if (!p.url) return null;
          return {
            url: buildUrl("https://api.apilayer.com/world_news/extract-news", { url: p.url, analyze: p.analyze !== false ? "true" : "false" }),
            method: "GET",
            headers: { apikey: apiKey },
          };
        case "finance_news":
          return {
            url: buildUrl("https://api.apilayer.com/financelayer/news", { tickers: p.tickers, keywords: p.text, limit: p.number || 5 }),
            method: "GET",
            headers: { apikey: apiKey },
          };
        case "scrape":
          if (!p.url) return null;
          return {
            url: buildUrl("https://api.apilayer.com/adv_scraper/scraper", { url: p.url }),
            method: "GET",
            headers: { apikey: apiKey },
          };
        case "skills":
          if (!p.q) return null;
          return {
            url: buildUrl("https://api.promptapi.com/skills", { q: p.q, count: p.count }),
            method: "GET",
            headers: { apikey: apiKey },
          };
        case "image_crop": {
          if (!p.url) return null;
          const formData = new URLSearchParams();
          formData.set("url", p.url);
          if (p.width) formData.set("width", String(p.width));
          if (p.height) formData.set("height", String(p.height));
          return {
            url: buildUrl("https://api.apilayer.com/smart_crop/url"),
            method: "POST",
            headers: { apikey: apiKey, "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString(),
          };
        }
        case "form_submit": {
          if (!p.endpoint) return null;
          let endpoint: string;
          try {
            endpoint = encodeProviderPathSegment(p.endpoint, "APILayer form endpoint");
          } catch {
            return null;
          }
          return {
            url: buildUrl(`https://api.apilayer.com/form_api/${endpoint}`),
            method: "POST",
            headers: { apikey: apiKey, "Content-Type": "application/json" },
            body: JSON.stringify(p.data || {}),
          };
        }

        // Product-specific access_key query (legacy domain) — binary response
        case "pdf_generate": {
          if (!p.document_url && !p.document_html) return null;
          const pdfKey = envKey("PDFLAYER_API_KEY");
          const url = buildUrl("https://api.pdflayer.com/api/convert", {
            access_key: pdfKey,
            page_size: p.page_size || "A4",
            document_url: p.document_url,
          });
          if (p.document_html && !p.document_url) {
            return {
              url: buildUrl("https://api.pdflayer.com/api/convert", { access_key: pdfKey, page_size: p.page_size || "A4" }),
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: `document_html=${encodeURIComponent(p.document_html)}`,
            };
          }
          return { url, method: "GET", headers: {} };
        }
        case "screenshot": {
          if (!p.url) return null;
          return {
            url: buildUrl("https://api.screenshotlayer.com/api/capture", {
              access_key: envKey("SCREENSHOTLAYER_API_KEY"),
              url: p.url,
              viewport: p.viewport || "1440x900",
              fullpage: p.fullpage ? "1" : "0",
            }),
            method: "GET",
            headers: {},
          };
        }
        case "vat_check": {
          if (!p.vat_number) return null;
          return {
            url: buildUrl("https://apilayer.net/api/validate", {
              access_key: envKey("APILAYER_VATLAYER_KEY"),
              vat_number: p.vat_number,
            }),
            method: "GET",
            headers: {},
          };
        }
        case "market_data": {
          if (!p.symbols) return null;
          return {
            url: buildUrl("https://api.marketstack.com/v1/eod", {
              access_key: envKey("APILAYER_MARKETSTACK_KEY"),
              symbols: p.symbols,
              limit: p.limit || 10,
              date_from: p.date_from,
              date_to: p.date_to,
            }),
            method: "GET",
            headers: {},
          };
        }
        case "aviation":
          return {
            url: buildUrl("https://api.aviationstack.com/v1/flights", {
              access_key: envKey("APILAYER_AVIATIONSTACK_KEY"),
              flight_iata: p.flight_iata,
              dep_iata: p.dep_iata,
              arr_iata: p.arr_iata,
              airline_iata: p.airline_iata,
            }),
            method: "GET",
            headers: {},
          };
        case "weatherstack_current": {
          if (!p.query) return null;
          return {
            url: buildUrl("https://api.weatherstack.com/current", {
              access_key: envKey("WEATHERSTACK_API_KEY"),
              query: p.query,
              units: p.units || "m",
            }),
            method: "GET",
            headers: {},
          };
        }
        case "weatherstack_forecast": {
          if (!p.query) return null;
          return {
            url: buildUrl("https://api.weatherstack.com/forecast", {
              access_key: envKey("WEATHERSTACK_API_KEY"),
              query: p.query,
              forecast_days: p.forecast_days || 1,
              units: p.units || "m",
            }),
            method: "GET",
            headers: {},
          };
        }
        case "ipstack_lookup": {
          if (!p.ip) return null;
          return {
            url: buildUrl(`https://api.ipstack.com/${encodeURIComponent(String(p.ip))}`, {
              access_key: envKey("IPSTACK_API_KEY"),
            }),
            method: "GET",
            headers: {},
          };
        }
        case "currencylayer_live":
          return {
            url: buildUrl("https://api.currencylayer.com/live", {
              access_key: envKey("CURRENCYLAYER_API_KEY"),
              source: p.source || "USD",
              currencies: p.currencies,
            }),
            method: "GET",
            headers: {},
          };
        case "currencylayer_convert": {
          if (!p.from || !p.to || !p.amount) return null;
          return {
            url: buildUrl("https://api.currencylayer.com/convert", {
              access_key: envKey("CURRENCYLAYER_API_KEY"),
              from: p.from,
              to: p.to,
              amount: p.amount,
              date: p.date,
            }),
            method: "GET",
            headers: {},
          };
        }
        case "coinlayer_live":
          return {
            url: buildUrl("https://api.coinlayer.com/live", {
              access_key: envKey("COINLAYER_API_KEY"),
              target: p.target || "USD",
              symbols: p.symbols,
            }),
            method: "GET",
            headers: {},
          };
        case "positionstack_forward": {
          if (!p.query) return null;
          return {
            url: buildUrl("https://api.positionstack.com/v1/forward", {
              access_key: envKey("POSITIONSTACK_API_KEY"),
              query: p.query,
              limit: p.limit || 1,
            }),
            method: "GET",
            headers: {},
          };
        }
        case "positionstack_reverse": {
          if (!p.query) return null;
          return {
            url: buildUrl("https://api.positionstack.com/v1/reverse", {
              access_key: envKey("POSITIONSTACK_API_KEY"),
              query: p.query,
              limit: p.limit || 1,
            }),
            method: "GET",
            headers: {},
          };
        }
        case "fixer_latest":
          return {
            url: buildUrl("https://data.fixer.io/api/latest", {
              access_key: envKey("FIXER_API_KEY"),
              // Free-plan constraint: non-EUR base is rejected upstream.
              base: p.base || "EUR",
              symbols: p.symbols,
            }),
            method: "GET",
            headers: {},
          };
        case "languagelayer_detect": {
          if (!p.query) return null;
          return {
            url: buildUrl("https://api.languagelayer.com/detect", {
              access_key: envKey("LANGUAGELAYER_API_KEY"),
              query: p.query,
            }),
            method: "GET",
            headers: {},
          };
        }
        case "scrapestack_scrape": {
          if (!p.url) return null;
          return {
            url: buildUrl("https://api.scrapestack.com/scrape", {
              access_key: envKey("SCRAPESTACK_API_KEY"),
              url: p.url,
            }),
            method: "GET",
            headers: {},
          };
        }
        case "serpstack_search": {
          if (!p.query) return null;
          return {
            url: buildUrl("https://api.serpstack.com/search", {
              access_key: envKey("SERPSTACK_API_KEY"),
              query: p.query,
              num: p.num || 10,
            }),
            method: "GET",
            headers: {},
          };
        }
        case "mediastack_news":
          return {
            url: buildUrl("https://api.mediastack.com/v1/news", {
              access_key: envKey("MEDIASTACK_API_KEY"),
              keywords: p.keywords,
              categories: p.categories,
              countries: p.countries,
              languages: p.languages,
              limit: p.limit || 25,
            }),
            method: "GET",
            headers: {},
          };
        case "userstack_detect": {
          if (!p.ua) return null;
          return {
            url: buildUrl("https://api.userstack.com/detect", {
              access_key: envKey("USERSTACK_API_KEY"),
              ua: p.ua,
            }),
            method: "GET",
            headers: {},
          };
        }
        // Paid-plan-only or still-unverified transports stay fail-closed.
        case "weather":
        case "fixer_convert":
          return null;
        case "ipapi_lookup": {
          if (!p.ip) return null;
          return {
            url: buildUrl(`https://api.ipapi.com/api/${encodeURIComponent(p.ip)}`, { access_key: envKey("IPAPI_API_KEY") }),
            method: "GET", headers: {},
          };
        }
        case "exchangeratehost_latest": {
          return {
            url: buildUrl("https://api.exchangerate.host/live", { access_key: envKey("EXCHANGERATEHOST_API_KEY"), source: p.source || "USD", currencies: p.currencies }),
            method: "GET", headers: {},
          };
        }
        default:
          return null;
      }
    }
    default:
      return null;
  }
}

async function executeE2BCode(
  apiKey: string,
  params: Record<string, any>
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const code = typeof params.code === "string" ? params.code : "";
  if (!code) {
    return { ok: false, status: 400, data: { error: "code required" } };
  }

  let sandboxId: string | undefined;
  try {
    const createResponse = await fetch("https://api.e2b.app/sandboxes", {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        templateID: params.template || "code-interpreter-v1",
        timeout: Math.min(Math.max(Number(params.timeout_seconds) || 30, 15), 300),
        secure: true,
        metadata: { source: "apiclaw" },
      }),
    });
    const createData = await createResponse.json() as {
      sandboxID?: string;
      envdAccessToken?: string;
      trafficAccessToken?: string;
      message?: string;
      error?: string;
    };
    if (!createResponse.ok || !createData.sandboxID || !/^[a-zA-Z0-9-]+$/.test(createData.sandboxID)) {
      return {
        ok: false,
        status: createResponse.status,
        data: { error: createData.message || createData.error || "E2B sandbox creation failed" },
      };
    }

    sandboxId = createData.sandboxID;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (createData.envdAccessToken) headers["X-Access-Token"] = createData.envdAccessToken;
    if (createData.trafficAccessToken) headers["E2B-Traffic-Access-Token"] = createData.trafficAccessToken;

    const executionResponse = await fetch(`https://49999-${sandboxId}.e2b.app/execute`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        code,
        language: params.language || "python",
        env_vars: params.envs || undefined,
      }),
    });
    const raw = await executionResponse.text();
    const events = raw.split("\n").filter(Boolean).map((line) => {
      try { return JSON.parse(line); } catch { return { text: line }; }
    });
    return {
      ok: executionResponse.ok,
      status: executionResponse.status,
      data: { events },
    };
  } catch (error: any) {
    return { ok: false, status: 502, data: { error: error?.message || "E2B execution failed" } };
  } finally {
    if (sandboxId) {
      await fetch(`https://api.e2b.app/sandboxes/${sandboxId}`, {
        method: "DELETE",
        headers: { "X-API-Key": apiKey },
      }).catch(() => {});
    }
  }
}

// Resolve auth for /v1/execute.
// Accepts: X-APIClaw-Internal (server-to-server), Bearer sk-claw-… or X-APIClaw-Api-Key (permanent keys), X-APIClaw-Session (CLI login).
// Shadow-mode: anonymous is logged to funnel.call_api_blocked and returned as authMethod=anonymous
// so existing headless traffic is unbroken until AUTH_ENFORCEMENT=enforce flips.
async function resolveExecuteAuth(
  ctx: any,
  request: Request
): Promise<{
  workspaceId?: string;
  keyId?: string;
  authMethod: "api-key" | "session" | "mcp-oauth" | "internal" | "anonymous";
  mcpScope?: string;
} | Response> {
  // 1. Internal server-to-server auth
  const internalSecret = request.headers.get("X-APIClaw-Internal");
  if (internalSecret) {
    const expectedSecret = process.env.APICLAW_INTERNAL_SECRET;
    if (expectedSecret && internalSecret === expectedSecret) {
      const workspaceHeader = request.headers.get("X-APIClaw-Workspace");
      return { workspaceId: workspaceHeader || undefined, authMethod: "internal" };
    }
    // Published 2.8.6 always sent Internal (often empty or a local dummy).
    // A customer credential still completes the call; dummy Internal without
    // one stays 401 so workspace-header-only traffic cannot forge internal.
    if (!hasCustomerManagedCredential(request.headers)) {
      return jsonResponse({ error: { message: "Invalid internal secret", type: "auth_error" } }, 401);
    }
  }

  // 2. API key or CLI session (unified resolver handles both new header forms)
  const auth = await resolveWorkspaceFromRequest(ctx, request);
  if (auth.authMethod === "api-key" && auth.workspaceId && auth.keyId) {
    return { workspaceId: auth.workspaceId, keyId: auth.keyId, authMethod: "api-key" };
  }
  if (auth.authMethod === "session" && auth.workspaceId) {
    return { workspaceId: auth.workspaceId, authMethod: "session" };
  }
  if (auth.authMethod === "mcp-oauth" && auth.workspaceId) {
    return {
      workspaceId: auth.workspaceId,
      authMethod: "mcp-oauth",
      mcpScope: auth.mcpScope,
    };
  }

  // 3. Anonymous → shadow vs enforce
  try {
    await ctx.runMutation(api.funnel.recordEvent, {
      event: "call_api_blocked",
      classification: "human",
      userAgent: request.headers.get("User-Agent") ?? undefined,
      props: {
        reason: "unauth",
        path: "/v1/execute",
        mode: isEnforceMode() ? "enforce" : "shadow",
      },
    });
  } catch (e: any) {
    console.error("[Execute] Funnel log failed:", e.message);
  }
  if (isEnforceMode()) {
    return unauthResponse("execute_requires_auth");
  }
  return { authMethod: "anonymous" };
}

async function handleManagedExecute(ctx: any, request: Request): Promise<Response> {
    const startTime = Date.now();

    if (requiresLegacyClientUpgrade("/v1/execute", request.headers)) {
      await recordLegacyClientUpgrade(ctx, request, "/v1/execute");
      return legacyClientUpgradeResponse();
    }

    // Auth
    const authResult = await resolveExecuteAuth(ctx, request);
    if (authResult instanceof Response) return authResult;
    const scopeDenied = mcpScopeDenial(authResult, "call");
    if (scopeDenied) return scopeDenied;
    const { workspaceId, authMethod } = authResult;

    // Parse body
    let body: any;
    try {
      body = await readManagedJsonBodyCapped(request);
    } catch {
      return jsonResponse({ error: { message: "Invalid JSON body", type: "invalid_request" } }, 400);
    }

    const { provider, action, params = {} } = body;
    if (!provider) {
      return jsonResponse({ error: { message: "provider is required", type: "invalid_request" } }, 400);
    }
    if (!action) {
      return jsonResponse({ error: { message: "action is required", type: "invalid_request" } }, 400);
    }

    // Internal-only provider gate. Same set as /proxy/* and /v1/call — reserved
    // providers (Twilio/46elks/Resend) only accept X-APIClaw-Internal auth.
    // /v1/execute was missing this check, unlike its sibling routes.
    if (
      isInternalProviderReference(String(provider)) &&
      authMethod !== "internal"
    ) {
      return internalOnlyResponse(provider);
    }
    if (
      PROVIDERS[String(provider)] &&
      !isPubliclyAvailableManagedProvider(String(provider)) &&
      authMethod !== "internal"
    ) {
      return internalOnlyResponse(provider);
    }

    const subagentId = request.headers.get("X-APIClaw-Subagent") || "main";

    let quotaGate: ManagedCallGate | undefined;
    const isLLMExecution = action === "chat" && (
      provider === "auto" || PROVIDERS[provider]?.isLLM === true
    );
    let explicitOpenRouterExecution: ReturnType<typeof resolveExplicitOpenRouterExecution>;
    let authorizedMaxOutputTokens: number | undefined;
    if (isLLMExecution) {
      let configuredDefaultModel: string | null = null;
      if (workspaceId) {
        try {
          const settings = await ctx.runQuery(internal.workspaceSettings.getForRouting, { workspaceId });
          configuredDefaultModel = settings?.defaultModel ?? null;
        } catch {}
      }
      const requestedModel = params.model || configuredDefaultModel;
      explicitOpenRouterExecution = resolveExplicitOpenRouterExecution({
        provider,
        action,
        requestedModel,
      });
      params.model = explicitOpenRouterExecution?.model ?? (requestedModel === "auto"
        ? "mistral-small-latest"
        : requestedModel || "anthropic/claude-sonnet-4-6");
      try {
        authorizedMaxOutputTokens = normalizeMaxOutputTokens(params.max_completion_tokens ?? params.max_tokens);
      } catch (error) {
        return jsonResponse({
          success: false,
          error: error instanceof Error ? error.message : "Invalid maximum output token value",
          code: "invalid_max_output_tokens",
        }, 400);
      }
      if (params.max_completion_tokens !== undefined) {
        params.max_completion_tokens = authorizedMaxOutputTokens;
        delete params.max_tokens;
      } else {
        params.max_tokens = authorizedMaxOutputTokens;
        delete params.max_completion_tokens;
      }
    }
    const isManagedExecution = provider === "auto" || !!PROVIDERS[provider] || action === "chat";
    if (isManagedExecution) {
      // Reserve from the full normalized body. Tool schemas, instructions,
      // system prompts, and other auxiliary input can dwarf messages alone.
      const estimatedInputTokens = estimateInputTokens(params);
      const gate = await enforcePreCallQuota(
        ctx,
        request,
        workspaceId,
        explicitOpenRouterExecution?.provider ?? provider,
        action,
        "/v1/execute",
        {
          model: params.model,
          estimatedProviderCostUsd: isLLMExecution && authorizedMaxOutputTokens !== undefined
            ? estimateKnownModelUpperBoundUsd(params.model, estimatedInputTokens, authorizedMaxOutputTokens)
            : undefined,
          estimatedInputTokens,
          maxOutputTokens: authorizedMaxOutputTokens,
          // Explicit OpenRouter requests are hard-bound before authorization
          // and return provider-reported usage.cost. Generic LLM routing stays
          // unavailable to customer billing because its cost rail is unknown
          // until after the reservation is created.
          billingGradeCost: explicitOpenRouterExecution
            ? true
            : isLLMExecution
              ? false
              : undefined,
          trafficClass: authMethod === "internal" ? "internal" : "customer",
          requestPayload: body,
        },
      );
      if (gate instanceof Response) return gate;
      quotaGate = gate;
      if (params.stream && gate.trafficClass === "customer") {
        await finalizeManagedCall(ctx, gate, { success: false, providerCostUsd: 0, costSource: "zero_cost" });
        return jsonResponse({
          success: false,
          error: "Streaming managed responses require exact usage metering and are temporarily unavailable. Use stream=false.",
          code: "streaming_billing_unavailable",
        }, 400);
      }
    }

    // Determine execution path
    let routeDetail = "";

    // Path 1: LLM routing (provider "auto" or known LLM provider with action "chat")
    const isLLMRequest = isLLMExecution;

    if (isLLMRequest) {
      // LLM routing path

      // Load workspace settings for routing
      let settings = {
        routingMode: "balanced",
        defaultModel: null as string | null,
        preferredProviders: [] as string[],
        blockedProviders: [] as string[],
        allowOpenRouterFallback: true,
      };
      if (workspaceId) {
        try {
          settings = await ctx.runQuery(internal.workspaceSettings.getForRouting, { workspaceId });
        } catch { /* use defaults */ }
      }

      const routeOverride = request.headers.get("X-APIClaw-Route");
      const effectiveRoutingMode = routeOverride && ["best_price", "highest_quality", "fastest", "balanced", "advisor"].includes(routeOverride)
        ? routeOverride : settings.routingMode;
      const effectivePreferred = routeOverride && PROVIDERS[routeOverride]?.isLLM
        ? [routeOverride, ...settings.preferredProviders] : settings.preferredProviders;
      // If a specific LLM provider is requested (not "auto"), prefer it
      const finalPreferred = provider !== "auto" && PROVIDERS[provider]?.isLLM
        ? [provider, ...effectivePreferred] : effectivePreferred;

      const effectiveModel = params.model || settings.defaultModel || "anthropic/claude-sonnet-4-6";

      const route = await routeLLMRequest(explicitOpenRouterExecution?.routingModel ?? effectiveModel, {
        routingMode: effectiveRoutingMode,
        preferredProviders: finalPreferred,
        blockedProviders: settings.blockedProviders,
        allowOpenRouterFallback: settings.allowOpenRouterFallback,
      }, params.messages);

      if (!route) {
        await finalizeManagedCall(ctx, quotaGate, { success: false, providerCostUsd: 0, costSource: "zero_cost" });
        return jsonResponse({ success: false, error: "No LLM provider available", _apiclaw: { latencyMs: Date.now() - startTime, route: "none", gateway: true } }, 503);
      }

      routeDetail = route.reason;

      // Log usage. Capture incrementUsage result so A-17 quota_warning
      // surfaces as _notice on the execute-LLM response (matches the
      // open-API path pattern shipped in 2.8.4).
      let executeLlmUsageResult: { quotaWarning?: any } | null = null;
      if (workspaceId) {
        try {
          await ctx.runMutation(api.analytics.log, {
            event: "api_call", provider: "gateway", identifier: workspaceId,
            workspaceId: workspaceId as any,
            metadata: { action: "execute_chat", model: effectiveModel, routedTo: route.provider, routeReason: route.reason, authMethod },
          });
          await ctx.runMutation(internal.logs.createProxyLog, {
            workspaceId: workspaceId as any, provider: route.provider, action: "chat", subagentId,
          });
          executeLlmUsageResult = quotaGate ? { quotaWarning: quotaGate.quotaWarning } : null;
        } catch (e: any) { console.error("[Execute] LLM logging failed:", e.message); }
      }

      // Forward to provider
      let upstreamDispatchAttempted = false;
      try {
        const { model: _m, ...restParams } = params;
        const isAnthropic = route.provider === "anthropic";
        let finalBody: any;
        let headers: Record<string, string>;

        if (isAnthropic) {
          const { body: anthropicBody } = openaiToAnthropicRequest(route.model, params.messages || [], restParams);
          if (params.stream) anthropicBody.stream = true;
          finalBody = anthropicBody;
          headers = {
            "x-api-key": route.apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
            ...(route.extraHeaders || {}),
          };
        } else {
          finalBody = { model: route.model, messages: params.messages, stream: params.stream || false, ...restParams };
          if (route.provider === "openrouter" && workspaceId) {
            if (quotaGate?.trafficClass === "customer") {
              finalBody = costBoundedOpenRouterRequest(
                finalBody,
                route.model,
                authorizedMaxOutputTokens!,
                estimateInputTokens(params),
              );
            }
            const pseudonymSecret = process.env.APICLAW_PSEUDONYM_SECRET;
            if (!pseudonymSecret) throw new Error("OpenRouter attribution secret is not configured");
            finalBody = await decorateOpenRouterRequest(finalBody, workspaceId, pseudonymSecret);
          }
          headers = {
            "Authorization": `Bearer ${route.apiKey}`,
            "Content-Type": "application/json",
            ...(route.extraHeaders || {}),
          };
        }

        upstreamDispatchAttempted = true;
        const response = await fetch(route.baseUrl, {
          method: "POST", headers, body: JSON.stringify(finalBody),
          signal: AbortSignal.timeout(60_000),
        });

        if (response.ok) {
          await recordFirstSuccessfulGatewayCall(ctx, {
            workspaceId,
            path: "/v1/execute",
            authMethod,
            provider: route.provider,
            action: "chat",
          });
        }

        // Streaming
        if (params.stream && response.body) {
          await finalizeManagedCall(ctx, quotaGate, {
            success: response.ok,
            provider: route.provider,
            model: route.model,
            costSource: response.ok ? "reservation" : "zero_cost",
            providerCostUsd: response.ok ? undefined : 0,
          });
          return new Response(response.body, {
            status: response.status,
            headers: { "Content-Type": response.headers.get("Content-Type") || "text/event-stream", "Cache-Control": "no-cache", ...corsHeaders },
          });
        }

        let data = await readUpstreamJsonCapped(response);

        // Translate Anthropic response to OpenAI format
        if (isAnthropic && response.ok) {
          data = anthropicToOpenaiResponse(data, route.model);
        }
        const latencyMs = Date.now() - startTime;

        // Calculate cost from token usage (parity with /v1/chat/completions)
        const usage = (data as any)?.usage;
        const calculatedCost = calculateCallCost(route.model, usage);
        const providerReportedCost = providerReportedUsageCostUsd(usage);
        const managedCostDecision = resolveManagedResponseCost({
          provider: route.provider,
          responseOk: response.ok,
          providerReportedCostUsd: providerReportedCost,
          tokenTableCostUsd: calculatedCost?.providerCost,
        });
        const providerCost = managedCostDecision.providerCostUsd;
        const apiclawCost = providerCost === undefined ? undefined : providerCost * (1 + APICLAW_MARGIN);
        const finalization = await finalizeManagedCall(ctx, quotaGate, {
          success: response.ok,
          provider: route.provider,
          providerCostUsd: providerCost,
          model: route.model,
          inputTokens: usage?.prompt_tokens || 0,
          outputTokens: usage?.completion_tokens || 0,
          upstreamRequestId: typeof data?.id === "string" ? data.id : undefined,
          costSource: managedCostDecision.costSource,
        });
        const reconciliationResponse = managedCostReconciliationResponse(quotaGate, finalization);
        if (reconciliationResponse) return reconciliationResponse;

        return jsonResponse({
          success: response.ok,
          provider: route.provider,
          action: "chat",
          data,
          ...(executeLlmUsageResult?.quotaWarning ? { _notice: executeLlmUsageResult.quotaWarning } : {}),
          _apiclaw: {
            latencyMs, route: routeDetail, gateway: true, model: route.model,
            cost: {
              providerUsd: providerCost === undefined ? null : Math.round(providerCost * 1_000_000) / 1_000_000,
              totalUsd: apiclawCost === undefined ? null : Math.round(apiclawCost * 1_000_000) / 1_000_000,
              margin: "15%",
            },
          },
        }, response.ok ? 200 : response.status);
      } catch (e: any) {
        if (e instanceof UnsafeManagedOpenRouterRequestError && !upstreamDispatchAttempted) {
          await finalizeManagedCall(ctx, quotaGate, {
            success: false,
            providerCostUsd: 0,
            model: params.model,
            costSource: "zero_cost",
          });
          return jsonResponse({
            success: false,
            provider,
            action,
            error: e.message,
            code: e.code,
          }, 400);
        }
        if (upstreamDispatchAttempted) {
          return ambiguousPostDispatchResponse(
            ctx,
            quotaGate,
            { model: params.model },
            502,
            { provider, action },
          );
        }
        await finalizeManagedCall(ctx, quotaGate, { success: false, providerCostUsd: 0, model: params.model, costSource: "zero_cost" });
        return jsonResponse({ success: false, provider: provider, action, error: e.message, _apiclaw: { latencyMs: Date.now() - startTime, route: routeDetail, gateway: true } }, 500);
      }
    }

    // Path 2: Managed provider (known in PROVIDERS catalog)
    if (PROVIDERS[provider]) {
      // Managed provider path
      routeDetail = `direct_${provider}`;

      const isE2BRun = provider === "e2b" && action === "run_code";
      const req = isE2BRun ? null : buildManagedRequest(provider, action, params);
      if (!req && !isE2BRun) {
        await finalizeManagedCall(ctx, quotaGate, { success: false, provider, providerCostUsd: 0, model: params.model, costSource: "zero_cost" });
        return jsonResponse({
          success: false,
          error: `Unknown action "${action}" for provider "${provider}"`,
          _apiclaw: { latencyMs: Date.now() - startTime, route: routeDetail, gateway: true },
        }, 400);
      }

      // Log usage
      if (workspaceId) {
        try {
          await ctx.runMutation(api.analytics.log, {
            event: "api_call", provider, identifier: workspaceId,
            workspaceId: workspaceId as any,
            metadata: { action, subagentId, authMethod, via: "execute" },
          });
          await ctx.runMutation(internal.logs.createProxyLog, {
            workspaceId: workspaceId as any, provider, action, subagentId,
          });
        } catch (e: any) { console.error("[Execute] Managed logging failed:", e.message); }
      }

      // Execute upstream call
      let upstreamDispatchAttempted = false;
      try {
        if (isE2BRun) {
          const e2bKey = resolveManagedCredential("e2b", "E2B_API_KEY", process.env);
          if (!e2bKey) {
            await finalizeManagedCall(ctx, quotaGate, { success: false, provider, providerCostUsd: 0, costSource: "zero_cost" });
            return jsonResponse({ success: false, provider, action, error: "E2B is not configured" }, 503);
          }
          upstreamDispatchAttempted = true;
          const result = await executeE2BCode(e2bKey, params);
          const latencyMs = Date.now() - startTime;
          if (result.ok) {
            await recordFirstSuccessfulGatewayCall(ctx, {
              workspaceId,
              path: "/v1/execute",
              authMethod,
              provider,
              action,
            });
          }
          await finalizeManagedCall(ctx, quotaGate, {
            success: result.ok,
            provider,
            providerCostUsd: result.ok ? undefined : 0,
            model: params.model,
            costSource: result.ok ? "reservation" : "zero_cost",
          });
          return jsonResponse({
            success: result.ok,
            provider,
            action,
            data: result.data,
            _apiclaw: { latencyMs, route: routeDetail, gateway: true },
          }, result.status);
        }

        if (!req) {
          await finalizeManagedCall(ctx, quotaGate, { success: false, provider, providerCostUsd: 0, costSource: "zero_cost" });
          return jsonResponse({ success: false, provider, action, error: "Managed request could not be built" }, 500);
        }

        const fetchOpts: RequestInit = {
          method: req.method,
          headers: req.headers,
          signal: AbortSignal.timeout(60_000),
        };
        if (req.body) fetchOpts.body = req.body;

        upstreamDispatchAttempted = true;
        const response = await fetch(req.url, fetchOpts);
        const latencyMs = Date.now() - startTime;

        if (response.ok) {
          await recordFirstSuccessfulGatewayCall(ctx, {
            workspaceId,
            path: "/v1/execute",
            authMethod,
            provider,
            action,
          });
        }

        // Inbound log to provider-owner workspace (parity with MCP src/index.ts:2192).
        // Without this, gateway/HTTP calls bypass partner dashboards.
        if (workspaceId) {
          try {
            await ctx.runMutation(internal.logs.logProviderCall, {
              provider,
              action,
              status: response.ok ? "success" : "error",
              latencyMs,
              callerWorkspaceId: workspaceId,
              subagentId,
            });
          } catch (e: any) {
            console.error("[Execute] logProviderCall failed:", e?.message);
          }
        }

        // Handle binary responses (audio, PDF, image, octet-stream)
        const contentType = response.headers.get("Content-Type") || "";
        const isBinary =
          contentType.includes("audio/") ||
          contentType.includes("image/") ||
          contentType.includes("application/pdf") ||
          contentType.includes("application/octet-stream");
        if (isBinary) {
          const bytes = await readUpstreamBytesCapped(response);
          let binary = "";
          const chunk = 0x8000;
          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
          }
          const base64 = btoa(binary);
          await finalizeManagedCall(ctx, quotaGate, {
            success: response.ok,
            provider,
            ...(response.ok
              ? successfulManagedCostDetails(quotaGate)
              : { providerCostUsd: 0, costSource: "zero_cost" as const }),
            model: params.model,
          });
          return jsonResponse({
            success: response.ok,
            provider,
            action,
            data: {
              message: response.ok ? "Binary asset returned" : "Binary error",
              content_type: contentType,
              size: bytes.byteLength,
              base64,
            },
            _apiclaw: { latencyMs, route: routeDetail, gateway: true },
          }, response.ok ? 200 : response.status);
        }

        // For text/json responses read once as text then try json parse
        const raw = await readUpstreamTextCapped(response);
        let data: any;
        try {
          data = JSON.parse(raw);
        } catch {
          data = { raw };
        }

        await finalizeManagedCall(ctx, quotaGate, {
          success: response.ok,
          provider,
          ...(response.ok
            ? successfulManagedCostDetails(quotaGate)
            : { providerCostUsd: 0, costSource: "zero_cost" as const }),
          model: params.model,
          upstreamRequestId: typeof data?.id === "string" ? data.id : undefined,
        });

        return jsonResponse({
          success: response.ok,
          provider,
          action,
          data,
          _apiclaw: { latencyMs, route: routeDetail, gateway: true },
        }, response.ok ? 200 : response.status);
      } catch (e: any) {
        const latencyMs = Date.now() - startTime;
        if (workspaceId) {
          try {
            await ctx.runMutation(internal.logs.logProviderCall, {
              provider,
              action,
              status: "error",
              latencyMs,
              callerWorkspaceId: workspaceId,
              subagentId,
              errorMessage: e?.message,
            });
          } catch {}
        }
        if (upstreamDispatchAttempted) {
          return ambiguousPostDispatchResponse(
            ctx,
            quotaGate,
            { provider, model: params.model },
            502,
            { provider, action },
          );
        }
        await finalizeManagedCall(ctx, quotaGate, { success: false, provider, providerCostUsd: 0, model: params.model, costSource: "zero_cost" });
        return jsonResponse({
          success: false, provider, action, error: e.message,
          _apiclaw: { latencyMs, route: routeDetail, gateway: true },
        }, 500);
      }
    }

    // Caller-controlled egress is intentionally unavailable. Discovery remains
    // public, while execution requires a managed, origin-pinned adapter. A
    // central DNS-pinned and redirect-validating egress layer must exist before
    // this surface can safely return.
    return jsonResponse({
      success: false,
      error: {
        code: "managed_adapter_required",
        message: `Provider "${provider}" is discovery-only until a managed egress adapter is available.`,
        hint: "Use /v1/discover for metadata and request a managed adapter for execution.",
      },
      _apiclaw: { latencyMs: Date.now() - startTime, route: "discovery_only", gateway: true },
    }, 501);
}

http.route({
  path: "/v1/execute",
  method: "POST",
  handler: httpAction(handleManagedExecute),
});

http.route({
  path: "/v1/execute",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ============================================================================
// PR3: Codex OAuth routing — chat.openai.com/backend-api/codex/responses
// ============================================================================
// Two surfaces:
//   1. /v1/responses — native OpenAI Responses API. Passes through. Routes:
//        Codex JWT (X-APIClaw-OAuth header)  → chatgpt.com/backend-api/codex/responses (caller pays via Team sub, $0 to apiclaw)
//        otherwise                           → api.openai.com/v1/responses (apiclaw's managed key)
//   2. /v1/chat/completions Codex routing — when X-APIClaw-OAuth has a Codex
//      JWT, translates Chat Completions → Responses, forwards to chatgpt.com,
//      translates response back. Lets clients use OpenAI-compat shape and still
//      bypass via ChatGPT Team subscription.

function isCodexJwt(token: string | null | undefined): boolean {
  if (!token) return false;
  const t = token.replace(/^Bearer\s+/i, "").trim();
  // Codex JWTs are signed by auth.openai.com and carry a `chatgpt_account_id` claim.
  // V8-safe base64url decode (Convex isolate has no Buffer).
  try {
    const parts = t.split(".");
    if (parts.length !== 3) return false;
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0) b64 += "=";
    const payload = JSON.parse(atob(b64));
    return payload?.iss === "https://auth.openai.com" || !!payload?.["https://api.openai.com/auth"]?.chatgpt_account_id;
  } catch {
    return false;
  }
}

type ApiClawAuthMode =
  | "founder_oauth_passthrough"
  | "managed_provider_key"
  | "managed_provider_key_fallback"
  | "founder_oauth_required";

const OPENAI_CODEX_RESPONSES_BASE_URL = "https://chatgpt.com/backend-api/codex";
const OPENAI_NATIVE_RESPONSES_URL = "https://api.openai.com/v1/responses";
const CODEX_ORIGINATOR = "apiclaw_gateway";

function completedChatResponseSSE(chatData: any): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const choice = chatData?.choices?.[0] ?? {};
  const chunk = {
    ...chatData,
    object: "chat.completion.chunk",
    choices: [{
      index: choice.index ?? 0,
      delta: choice.message ?? {},
      finish_reason: choice.finish_reason ?? "stop",
    }],
  };
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

function completedResponsesSSE(data: any): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`event: response.completed\ndata: ${JSON.stringify({ type: "response.completed", response: data })}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

// Codex backend requires streaming. When caller wants non-streaming, we consume
// the SSE stream serverside and reconstruct the final response. With store:false
// (which Codex requires), `response.completed.response.output` is empty — we must
// collect output items from `response.output_item.done` events.
async function consumeCodexResponsesSSE(body: ReadableStream<Uint8Array> | null): Promise<{ response: any | null; error: any | null }> {
  if (!body) {
    return {
      response: null,
      error: { code: "oauth_empty_terminal_response", message: "Codex returned an empty stream." },
    };
  }
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let baseResponse: any = null;       // snapshot from response.completed (with usage, id, status)
  const itemsByIndex: Record<number, any> = {};
  let errorPayload: any = null;
  let totalBytes = 0;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      totalBytes += value?.byteLength ?? 0;
      if (totalBytes > 8 * 1024 * 1024) {
        await reader.cancel("Codex SSE response exceeded the 8 MiB gateway limit.");
        throw new RangeError("Codex SSE response exceeded the 8 MiB gateway limit.");
      }
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const block = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const dataLines = block.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim());
        if (dataLines.length === 0) continue;
        const payload = dataLines.join("");
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          const t = evt?.type;
          if (t === "response.output_item.done" && evt.item) {
            itemsByIndex[evt.output_index ?? 0] = evt.item;
          } else if (t === "response.completed" && evt.response) {
            baseResponse = evt.response;
          } else if (t === "response.failed" && evt.response) {
            baseResponse = evt.response;
          } else if (t === "error" || t === "response.error") {
            errorPayload = evt.error ?? evt;
          }
        } catch { /* skip non-JSON SSE lines */ }
      }
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }

  if (errorPayload) return { response: null, error: errorPayload };
  if (!baseResponse) {
    return {
      response: null,
      error: { code: "oauth_empty_terminal_response", message: "Codex closed the stream without a terminal response event." },
    };
  }

  // Synthesize: take baseResponse and fill output from collected item.done events
  const orderedItems = Object.keys(itemsByIndex)
    .map((k) => parseInt(k, 10))
    .sort((a, b) => a - b)
    .map((k) => itemsByIndex[k]);
  baseResponse.output = orderedItems;

  return { response: baseResponse, error: null };
}

function extractChatgptAccountId(token: string): string | null {
  try {
    const t = token.replace(/^Bearer\s+/i, "").trim();
    const parts = t.split(".");
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0) b64 += "=";
    const payload = JSON.parse(atob(b64));
    return payload?.["https://api.openai.com/auth"]?.chatgpt_account_id ?? null;
  } catch { return null; }
}

function buildCodexHeaders(oauthToken: string, idempotencyKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: oauthToken.startsWith("Bearer ") ? oauthToken : `Bearer ${oauthToken}`,
    "Content-Type": "application/json",
    "originator": CODEX_ORIGINATOR,
    "User-Agent": "apiclaw_gateway/1.0 (Convex; +https://apiclaw.cloud)",
    "openai-beta": "responses=experimental",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  // ChatGPT-Account-ID is required by /backend-api/codex (matches Codex CLI's BearerAuthProvider).
  // Extract from the OAuth JWT's chatgpt_account_id claim.
  const accountId = extractChatgptAccountId(oauthToken);
  if (accountId) headers["ChatGPT-Account-ID"] = accountId;
  return headers;
}

// Chat Completions → Responses API request translator (for Codex routing on /v1/chat/completions)
function chatCompletionsToResponsesRequest(
  model: string,
  messages: any[],
  rest: Record<string, any>
): any {
  // System messages → instructions (Responses API)
  const systemMessages = messages.filter((m) => m.role === "system" || m.role === "developer");
  const nonSystem = messages.filter((m) => m.role !== "system" && m.role !== "developer");
  const instructions = systemMessages
    .map((m) => (typeof m.content === "string" ? m.content : Array.isArray(m.content) ? m.content.map((b: any) => b.text ?? "").join("") : ""))
    .filter(Boolean)
    .join("\n\n");

  // Map non-system messages → input items
  const input: any[] = [];
  for (const m of nonSystem) {
    if (m.role === "tool") {
      input.push({
        type: "function_call_output",
        call_id: m.tool_call_id,
        output: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      });
      continue;
    }
    if (m.role === "assistant" && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
      if (typeof m.content === "string" && m.content) {
        input.push({
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: m.content }],
        });
      }
      for (const tc of m.tool_calls) {
        input.push({
          type: "function_call",
          call_id: tc.id,
          name: tc.function?.name,
          arguments: typeof tc.function?.arguments === "string" ? tc.function.arguments : JSON.stringify(tc.function?.arguments ?? {}),
        });
      }
      continue;
    }
    // Plain user/assistant message: content can be string or array of parts
    const role = m.role === "assistant" ? "assistant" : "user";
    let contentBlocks: any[];
    if (typeof m.content === "string") {
      contentBlocks = [{ type: role === "assistant" ? "output_text" : "input_text", text: m.content }];
    } else if (Array.isArray(m.content)) {
      contentBlocks = m.content.map((b: any) => {
        if (b?.type === "text") return { type: role === "assistant" ? "output_text" : "input_text", text: b.text };
        if (b?.type === "image_url") {
          const url = b.image_url?.url ?? b.image_url;
          return { type: "input_image", image_url: url };
        }
        return b;
      });
    } else {
      contentBlocks = [{ type: "input_text", text: String(m.content ?? "") }];
    }
    input.push({ type: "message", role, content: contentBlocks });
  }

  const body: any = {
    model,
    input,
    stream: !!rest.stream,
    store: false,
    // Codex backend requires `instructions` to be present (errors with "Instructions are required").
    // If caller didn't supply a system message, set a neutral default so the request goes through.
    instructions: instructions || "You are a helpful assistant.",
  };
  if (rest.max_tokens !== undefined || rest.max_completion_tokens !== undefined) {
    body.max_output_tokens = rest.max_tokens ?? rest.max_completion_tokens;
  }
  if (rest.temperature !== undefined) body.temperature = rest.temperature;
  if (rest.top_p !== undefined) body.top_p = rest.top_p;
  if (rest.metadata) body.metadata = rest.metadata;
  if (rest.user) body.user = rest.user;
  if (rest.reasoning_effort) body.reasoning = { effort: rest.reasoning_effort };
  if (Array.isArray(rest.tools) && rest.tools.length > 0) {
    body.tools = rest.tools.map((t: any) => ({
      type: "function",
      name: t.function?.name ?? t.name,
      description: t.function?.description ?? t.description,
      parameters: t.function?.parameters ?? t.parameters,
    }));
  }
  if (rest.tool_choice !== undefined) {
    if (rest.tool_choice === "auto" || rest.tool_choice === "none" || rest.tool_choice === "required") {
      body.tool_choice = rest.tool_choice;
    } else if (typeof rest.tool_choice === "object" && rest.tool_choice.function?.name) {
      body.tool_choice = { type: "function", function: { name: rest.tool_choice.function.name } };
    }
  }
  return body;
}

// Responses API response → Chat Completions response translator
function responsesToChatCompletionsResponse(responsesData: any, model: string): any {
  const output: any[] = Array.isArray(responsesData.output) ? responsesData.output : [];
  const toolCalls: any[] = [];
  const textParts: string[] = [];
  const reasoningParts: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    if (item.type === "message" && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part?.type === "output_text" && typeof part.text === "string") textParts.push(part.text);
        if (part?.type === "refusal" && typeof part.refusal === "string") textParts.push(part.refusal);
      }
    } else if (item.type === "function_call") {
      toolCalls.push({
        id: item.call_id ?? item.id,
        type: "function",
        function: {
          name: item.name,
          arguments: typeof item.arguments === "string" ? item.arguments : JSON.stringify(item.arguments ?? {}),
        },
      });
    } else if (item.type === "reasoning" && Array.isArray(item.summary)) {
      for (const s of item.summary) {
        if (s?.type === "summary_text" && typeof s.text === "string") reasoningParts.push(s.text);
      }
    }
  }

  const message: any = {
    role: "assistant",
    content: textParts.length > 0 ? textParts.join("") : null,
  };
  if (toolCalls.length > 0) message.tool_calls = toolCalls;
  if (reasoningParts.length > 0) message.reasoning_content = reasoningParts.join("\n\n");

  const usage = responsesData.usage ?? {};
  const promptTokens = usage.input_tokens ?? 0;
  const completionTokens = usage.output_tokens ?? 0;
  const cachedTokens = usage.input_tokens_details?.cached_tokens ?? 0;

  const usageOut: any = {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: usage.total_tokens ?? promptTokens + completionTokens,
  };
  if (cachedTokens > 0) usageOut.prompt_tokens_details = { cached_tokens: cachedTokens };

  let finishReason = "stop";
  if (toolCalls.length > 0) finishReason = "tool_calls";
  else if (responsesData.status === "incomplete" && responsesData.incomplete_details?.reason === "max_output_tokens") finishReason = "length";

  return {
    id: responsesData.id || `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, message, finish_reason: finishReason }],
    usage: usageOut,
  };
}

// /v1/responses — native OpenAI Responses API passthrough with optional Codex routing
http.route({
  path: "/v1/responses",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();

    const authResult = await requireApiKeyAuth(ctx, request);
    if (authResult instanceof Response) return authResult;
    const { workspaceId, authMethod } = authResult;

    let body: any;
    try {
      body = await readManagedJsonBodyCapped(request);
    } catch {
      return jsonResponse({ error: { message: "Invalid JSON body", type: "invalid_request_error" } }, 400);
    }
    if (!body.model || (!body.input && !body.messages)) {
      return jsonResponse({ error: { message: "model and input are required", type: "invalid_request_error" } }, 400);
    }

    let authorizedMaxOutputTokens: number;
    try {
      authorizedMaxOutputTokens = normalizeMaxOutputTokens(body.max_output_tokens);
    } catch (error) {
      return jsonResponse({
        error: {
          message: error instanceof Error ? error.message : "Invalid maximum output token value",
          type: "invalid_request_error",
          code: "invalid_max_output_tokens",
        },
      }, 400);
    }
    body.max_output_tokens = authorizedMaxOutputTokens;
    const estimatedInputTokens = estimateInputTokens(body);

    let modelId: string = body.model;
    if (modelId.startsWith("openai/")) modelId = modelId.slice("openai/".length);
    if (modelId.startsWith("openai-codex/")) modelId = modelId.slice("openai-codex/".length);

    // Resolve OAuth and tier before metering so the ledger records the route
    // that will actually be dispatched.
    const oauthHeader = request.headers.get("X-APIClaw-OAuth");
    const useCodex = isCodexJwt(oauthHeader);
    let respTier = "free";
    try {
      const ws = await ctx.runQuery(internal.workspaceSettings.getForRouting, { workspaceId });
      respTier = ws?.tier ?? "free";
    } catch {}
    if (useCodex && respTier !== "founder" && respTier !== "partner") {
      return jsonResponse({
        error: {
          message: "OAuth passthrough is restricted to founder/partner workspaces. External callers must omit X-APIClaw-OAuth.",
          type: "permission_error",
          code: "byok_not_permitted",
        },
      }, 403);
    }
    const codexIdempotency = useCodex
      ? requireCodexOAuthIdempotency(request)
      : null;
    if (codexIdempotency instanceof Response) return codexIdempotency;

    const quotaGate = await enforcePreCallQuota(
      ctx,
      request,
      workspaceId,
      useCodex ? "openai-codex" : "openai",
      "responses",
      "/v1/responses",
      {
        model: modelId,
        estimatedProviderCostUsd: useCodex
          ? 0
          : estimateKnownModelUpperBoundUsd(
              body.model,
              estimatedInputTokens,
              authorizedMaxOutputTokens,
            ),
        estimatedInputTokens,
        maxOutputTokens: authorizedMaxOutputTokens,
        billingGradeCost: useCodex ? true : undefined,
        requestPayload: body,
      },
    );
    if (quotaGate instanceof Response) return quotaGate;

    // Route: Codex JWT in X-APIClaw-OAuth header → chatgpt.com, else api.openai.com.
    // Canon: BYOK / OAuth-passthrough restricted to founder/partner workspaces.
    const authMode: ApiClawAuthMode = useCodex
      ? "founder_oauth_passthrough"
      : "managed_provider_key";

    const upstreamUrl = useCodex ? `${OPENAI_CODEX_RESPONSES_BASE_URL}/responses` : OPENAI_NATIVE_RESPONSES_URL;
    const upstreamHeaders = useCodex
      ? buildCodexHeaders(
          oauthHeader!,
          codexIdempotency!,
        )
      : { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" };

    if (!useCodex && !process.env.OPENAI_API_KEY) {
      await finalizeManagedCall(ctx, quotaGate, { success: false, provider: "openai", providerCostUsd: 0, model: modelId, costSource: "zero_cost" });
      return jsonResponse({ error: { message: "OPENAI_API_KEY not configured", type: "api_error" } }, 503);
    }

    const forwardBody = {
      ...body,
      model: modelId,
      ...(useCodex ? { stream: true } : {}),
    };
    const stream = !!body.stream;
    if (stream && quotaGate.trafficClass === "customer") {
      await finalizeManagedCall(ctx, quotaGate, { success: false, providerCostUsd: 0, model: modelId, costSource: "zero_cost" });
      return jsonResponse({ error: { code: "streaming_billing_unavailable", message: "Use stream=false so managed usage can be reconciled exactly." } }, 400);
    }

    try {
      await ctx.runMutation(api.analytics.log, {
        event: "api_call",
        provider: useCodex ? "openai-codex" : "openai",
        identifier: workspaceId,
        workspaceId: workspaceId as any,
        metadata: {
          action: "responses",
          model: modelId,
          via: useCodex ? "codex-oauth" : "direct",
          authMethod: "api-key",
        },
      });
      await ctx.runMutation(internal.logs.createProxyLog, {
        workspaceId: workspaceId as any,
        provider: useCodex ? "openai-codex" : "openai",
        action: "responses",
        subagentId: request.headers.get("X-APIClaw-Subagent") || "main",
      });
    } catch (e: any) {
      console.error("[/v1/responses] logging failed:", e?.message);
    }

    let upstreamDispatchAttempted = false;
    let dispatchDispose = () => {};
    let oauthDispatchAttempts = 0;
    let oauthRecovered = false;
    try {
      upstreamDispatchAttempted = true;
      const upstream = useCodex
        ? await (async () => {
            const dispatch = await dispatchCodexOAuthRequest({
              url: upstreamUrl,
              headers: upstreamHeaders,
              body: JSON.stringify(forwardBody),
              requestSignal: request.signal,
            });
            dispatchDispose = dispatch.dispose;
            oauthDispatchAttempts = dispatch.attempts;
            oauthRecovered = dispatch.recovered;
            return dispatch.response;
          })()
        : await fetch(upstreamUrl, {
            method: "POST",
            headers: upstreamHeaders,
            body: JSON.stringify(forwardBody),
            signal: AbortSignal.timeout(60_000),
          });

      if (upstream.ok && !useCodex) {
        await recordFirstSuccessfulGatewayCall(ctx, {
          workspaceId,
          path: "/v1/responses",
          authMethod,
          provider: useCodex ? "openai-codex" : "openai",
          action: "responses",
        });
      }

      if (stream && upstream.body && !useCodex) {
        await finalizeManagedCall(ctx, quotaGate, {
          success: upstream.ok,
          provider: useCodex ? "openai-codex" : "openai",
          providerCostUsd: useCodex ? 0 : upstream.ok ? undefined : 0,
          model: modelId,
          costSource: useCodex ? "zero_cost" : upstream.ok ? "reservation" : "zero_cost",
        });
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") || "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            ...corsHeaders,
          },
        });
      }

      if (useCodex && !upstream.ok) {
        const rejected = await readUpstreamJsonCapped(upstream);
        dispatchDispose();
        if (codexHttpFailureCertainty(upstream.status) === "uncertain") {
          return codexOAuthOutcomeUnknownResponse(
            ctx,
            quotaGate,
            new CodexOAuthDispatchError(
              "oauth_upstream_server_error",
              "uncertain",
              oauthDispatchAttempts,
              true,
              `Codex returned HTTP ${upstream.status} after accepting the dispatch.`,
            ),
            { workspaceId, tier: respTier, path: "/v1/responses" },
          );
        }
        const failureCode = rejected?.error?.code ?? `http_${upstream.status}`;
        await finalizeManagedCall(ctx, quotaGate, {
          success: false,
          provider: "openai-codex",
          providerCostUsd: 0,
          model: modelId,
          costSource: "zero_cost",
          terminalCode: failureCode,
          executionCertainty: "provider_rejected",
          operatorActionRequired: false,
          retryAttempts: oauthDispatchAttempts,
        });
        return jsonResponse({
          ...rejected,
          _apiclaw: {
            provider: "openai-codex",
            via: "codex-oauth",
            execution: codexOAuthExecutionReceipt({
              requestId: quotaGate.requestId,
              outcome: "provider_rejected",
              executionCertainty: "provider_rejected",
              attempts: oauthDispatchAttempts,
              recovered: oauthRecovered,
              operatorActionRequired: false,
              code: failureCode,
            }),
          },
        }, upstream.status);
      }

      let data: any;
      if (useCodex) {
        const consumed = await consumeCodexResponsesSSE(upstream.body);
        dispatchDispose();
        const terminal = adjudicateCodexTerminalSSE(consumed);
        if (terminal.kind === "provider_terminal_failure") {
          await finalizeManagedCall(ctx, quotaGate, {
            success: false,
            provider: "openai-codex",
            providerCostUsd: 0,
            model: modelId,
            costSource: "zero_cost",
            terminalCode: terminal.code,
            executionCertainty: "provider_terminal_failure",
            operatorActionRequired: false,
            retryAttempts: oauthDispatchAttempts,
          });
          return jsonResponse({
            error: {
              message: terminal.message,
              type: "codex_error",
              code: terminal.code,
              retryable: false,
            },
            _apiclaw: {
              provider: "openai-codex",
              via: "codex-oauth",
              execution: codexOAuthExecutionReceipt({
                requestId: quotaGate.requestId,
                outcome: "provider_failed",
                executionCertainty: "provider_terminal_failure",
                attempts: oauthDispatchAttempts,
                recovered: oauthRecovered,
                operatorActionRequired: false,
                code: terminal.code,
              }),
            },
          }, 502);
        }
        if (terminal.kind === "outcome_unknown") {
          return codexOAuthOutcomeUnknownResponse(
            ctx,
            quotaGate,
            new CodexOAuthDispatchError(
              "oauth_empty_terminal_response",
              "uncertain",
              oauthDispatchAttempts,
              true,
              "Codex closed the accepted stream without a terminal response.",
            ),
            { workspaceId, tier: respTier, path: "/v1/responses" },
          );
        }
        data = terminal.response;
        await recordFirstSuccessfulGatewayCall(ctx, {
          workspaceId,
          path: "/v1/responses",
          authMethod,
          provider: "openai-codex",
          action: "responses",
        });
      } else {
        data = await readUpstreamJsonCapped(upstream);
      }
      dispatchDispose();
      const latencyMs = Date.now() - startTime;

      // Cost tracking: Codex OAuth = $0 to apiclaw (caller's ChatGPT sub pays).
      // Direct OpenAI = pass-through + 15% (or 0% for internal workspaces).
      const u = data?.usage ?? {};
      const promptTokens = u.input_tokens ?? 0;
      const completionTokens = u.output_tokens ?? 0;
      const calculated = calculateCallCost(
        `openai/${modelId}`,
        { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens },
      );
      await finalizeManagedCall(ctx, quotaGate, {
        success: upstream.ok,
        provider: useCodex ? "openai-codex" : "openai",
        providerCostUsd: upstream.ok ? (useCodex ? 0 : calculated?.providerCost) : undefined,
        model: modelId,
        inputTokens: promptTokens,
        outputTokens: completionTokens,
        upstreamRequestId: typeof data?.id === "string" ? data.id : undefined,
        costSource: useCodex ? "zero_cost" : calculated ? "token_price_table" : "reservation",
        ...(useCodex ? {
          terminalCode: upstream.ok ? undefined : `http_${upstream.status}`,
          executionCertainty: upstream.ok ? "completed" as const : "provider_rejected" as const,
          operatorActionRequired: false,
          retryAttempts: oauthDispatchAttempts,
        } : {}),
      });

      if (data && typeof data === "object" && !("error" in data)) {
        (data as any)._apiclaw = {
          gateway: "v1",
          endpoint: "/v1/responses",
          provider: useCodex ? "openai-codex" : "openai",
          via: useCodex ? "codex-oauth" : "direct",
          authMode,
          credentialSource: authMode,
          model: modelId,
          latencyMs,
          ...(useCodex ? { cost: { providerUsd: 0, totalUsd: 0, note: "Codex OAuth — paid via ChatGPT subscription" } } : {}),
          ...(useCodex ? {
            execution: codexOAuthExecutionReceipt({
              requestId: quotaGate.requestId,
              outcome: upstream.ok ? "succeeded" : "provider_rejected",
              executionCertainty: upstream.ok ? "completed" : "provider_rejected",
              attempts: oauthDispatchAttempts,
              recovered: oauthRecovered,
              operatorActionRequired: false,
              ...(!upstream.ok ? { code: `http_${upstream.status}` } : {}),
            }),
          } : {}),
        };
      }

      if (useCodex && stream) {
        return new Response(completedResponsesSSE(data), {
          status: upstream.status,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-APIClaw-Request-Id": quotaGate.requestId,
            "X-APIClaw-Execution-Attempts": String(oauthDispatchAttempts),
            ...corsHeaders,
          },
        });
      }
      return jsonResponse(data, upstream.status);
    } catch (e: any) {
      dispatchDispose();
      if (useCodex && e instanceof CodexOAuthDispatchError && e.executionCertainty === "uncertain") {
        return codexOAuthOutcomeUnknownResponse(
          ctx,
          quotaGate,
          e,
          { workspaceId, tier: respTier, path: "/v1/responses" },
        );
      }
      if (useCodex && e instanceof CodexOAuthDispatchError) {
        await finalizeManagedCall(ctx, quotaGate, {
          success: false,
          provider: "openai-codex",
          providerCostUsd: 0,
          model: modelId,
          costSource: "zero_cost",
        });
        return jsonResponse({
          error: {
            message: e.message,
            type: "gateway_error",
            code: e.code,
            retryable: false,
          },
          _apiclaw: {
            provider: "openai-codex",
            via: "codex-oauth",
            execution: codexOAuthExecutionReceipt({
              requestId: quotaGate.requestId,
              outcome: "cancelled",
              executionCertainty: e.executionCertainty,
              attempts: e.attempts,
              recovered: false,
              operatorActionRequired: false,
              code: e.code,
            }),
          },
        }, 499);
      }
      if (useCodex && upstreamDispatchAttempted) {
        return codexOAuthOutcomeUnknownResponse(
          ctx,
          quotaGate,
          new CodexOAuthDispatchError(
            "oauth_transport_error",
            "uncertain",
            Math.max(1, oauthDispatchAttempts),
            true,
            "Codex response processing failed after dispatch.",
            { cause: e },
          ),
          { workspaceId, tier: respTier, path: "/v1/responses" },
        );
      }
      if (upstreamDispatchAttempted) {
        return ambiguousPostDispatchResponse(
          ctx,
          quotaGate,
          { provider: useCodex ? "openai-codex" : "openai", model: modelId },
          502,
        );
      }
      await finalizeManagedCall(ctx, quotaGate, { success: false, provider: useCodex ? "openai-codex" : "openai", providerCostUsd: 0, model: modelId, costSource: "zero_cost" });
      return jsonResponse({ error: { message: e?.message ?? String(e), type: "api_error" } }, 502);
    }
  }),
});

http.route({
  path: "/v1/responses",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ============================================================================
// /v1/messages — Native Anthropic Messages API passthrough.
// PR2 of "everything via apiclaw". Same shape as api.anthropic.com/v1/messages,
// no translation. Auth via sk-claw-/sk-mcp-/session. Logged + cost-tracked.
// ============================================================================
http.route({
  path: "/v1/messages",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();

    const authResult = await requireApiKeyAuth(ctx, request);
    if (authResult instanceof Response) return authResult;
    const { workspaceId, authMethod } = authResult;

    let body: any;
    try {
      body = await readManagedJsonBodyCapped(request);
    } catch {
      return jsonResponse({ type: "error", error: { type: "invalid_request_error", message: "Invalid JSON body" } }, 400);
    }
    if (!body.model) {
      return jsonResponse({ type: "error", error: { type: "invalid_request_error", message: "model is required" } }, 400);
    }
    if (!Array.isArray(body.messages)) {
      return jsonResponse({ type: "error", error: { type: "invalid_request_error", message: "messages array is required" } }, 400);
    }

    let authorizedMaxOutputTokens: number;
    try {
      authorizedMaxOutputTokens = normalizeMaxOutputTokens(body.max_tokens);
    } catch (error) {
      return jsonResponse({
        type: "error",
        error: {
          type: "invalid_request_error",
          message: error instanceof Error ? error.message : "Invalid maximum output token value",
        },
      }, 400);
    }
    body.max_tokens = authorizedMaxOutputTokens;
    const estimatedInputTokens = estimateInputTokens(body);

    const quotaGate = await enforcePreCallQuota(
      ctx,
      request,
      workspaceId,
      "anthropic",
      "messages",
      "/v1/messages",
      {
        model: body.model,
        estimatedProviderCostUsd: estimateKnownModelUpperBoundUsd(
          body.model,
          estimatedInputTokens,
          authorizedMaxOutputTokens,
        ),
        estimatedInputTokens,
        maxOutputTokens: authorizedMaxOutputTokens,
        requestPayload: body,
      },
    );
    if (quotaGate instanceof Response) return quotaGate;

    // Normalize model id: accept "anthropic/claude-..." or "claude-..." — Anthropic API expects the bare form.
    let modelId: string = body.model;
    if (modelId.startsWith("anthropic/")) modelId = modelId.slice("anthropic/".length);

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      await finalizeManagedCall(ctx, quotaGate, { success: false, provider: "anthropic", providerCostUsd: 0, model: modelId, costSource: "zero_cost" });
      return jsonResponse({ type: "error", error: { type: "api_error", message: "ANTHROPIC_API_KEY not configured on apiclaw gateway. Contact gustav@nordsym.com." } }, 503);
    }

    // Pass anthropic-version through (client may set it) or default to a current value.
    const anthropicVersion = request.headers.get("anthropic-version") || "2023-06-01";
    const anthropicBeta = request.headers.get("anthropic-beta") || undefined;

    const upstreamHeaders: Record<string, string> = {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": anthropicVersion,
      "Content-Type": "application/json",
    };
    if (anthropicBeta) upstreamHeaders["anthropic-beta"] = anthropicBeta;

    const forwardBody = { ...body, model: modelId };
    const stream = !!body.stream;
    if (stream && quotaGate.trafficClass === "customer") {
      await finalizeManagedCall(ctx, quotaGate, { success: false, provider: "anthropic", providerCostUsd: 0, model: modelId, costSource: "zero_cost" });
      return jsonResponse({ type: "error", error: { type: "billing_error", message: "Use stream=false so managed usage can be reconciled exactly." } }, 400);
    }

    // Log call (fire-and-forget)
    try {
      await ctx.runMutation(api.analytics.log, {
        event: "api_call",
        provider: "anthropic",
        identifier: workspaceId,
        workspaceId: workspaceId as any,
        metadata: {
          action: "messages",
          model: modelId,
          via: "direct",
          authMethod: "api-key",
        },
      });
      await ctx.runMutation(internal.logs.createProxyLog, {
        workspaceId: workspaceId as any,
        provider: "anthropic",
        action: "messages",
        subagentId: request.headers.get("X-APIClaw-Subagent") || "main",
      });
    } catch (e: any) {
      console.error("[/v1/messages] logging failed:", e?.message);
    }

    let upstreamDispatchAttempted = false;
    try {
      upstreamDispatchAttempted = true;
      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: upstreamHeaders,
        body: JSON.stringify(forwardBody),
        signal: AbortSignal.timeout(60_000),
      });

      if (upstream.ok) {
        await recordFirstSuccessfulGatewayCall(ctx, {
          workspaceId,
          path: "/v1/messages",
          authMethod,
          provider: "anthropic",
          action: "messages",
        });
      }

      // Streaming: passthrough SSE
      if (stream && upstream.body) {
        await finalizeManagedCall(ctx, quotaGate, {
          success: upstream.ok,
          provider: "anthropic",
          providerCostUsd: upstream.ok ? undefined : 0,
          model: modelId,
          costSource: upstream.ok ? "reservation" : "zero_cost",
        });
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") || "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            ...corsHeaders,
          },
        });
      }

      // Non-streaming: read JSON, log cost, inject _apiclaw metadata, return
      const data = await readUpstreamJsonCapped(upstream);
      const latencyMs = Date.now() - startTime;

      // Cost calc — reuse existing calculateCallCost. Anthropic's usage shape differs from OpenAI;
      // map cache_creation + cache_read + input → prompt_tokens for the cost helper.
      const u = (data as any)?.usage ?? {};
      const promptTokens = (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
      const completionTokens = u.output_tokens ?? 0;
      const calculated = calculateCallCost(
        `anthropic/${modelId}`,
        { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens }
      );
      const providerCost = calculated?.providerCost;
      const apiclawCost = calculated?.apiclawCost;

      await finalizeManagedCall(ctx, quotaGate, {
        success: upstream.ok,
        provider: "anthropic",
        providerCostUsd: upstream.ok ? providerCost : undefined,
        model: modelId,
        inputTokens: promptTokens,
        outputTokens: completionTokens,
        upstreamRequestId: typeof data?.id === "string" ? data.id : undefined,
        costSource: calculated ? "token_price_table" : "reservation",
      });

      if (data && typeof data === "object" && !("error" in data)) {
        (data as any)._apiclaw = {
          gateway: "v1",
          endpoint: "/v1/messages",
          provider: "anthropic",
          model: modelId,
          latencyMs,
          cost: {
            providerUsd: providerCost === undefined ? null : Math.round(providerCost * 1_000_000) / 1_000_000,
            totalUsd: apiclawCost === undefined ? null : Math.round(apiclawCost * 1_000_000) / 1_000_000,
            margin: "15%",
          },
        };
      }

      return jsonResponse(data, upstream.status);
      } catch (e: any) {
        if (upstreamDispatchAttempted) {
          return ambiguousPostDispatchResponse(
            ctx,
            quotaGate,
            { provider: "anthropic", model: modelId },
            502,
            { type: "error" },
          );
        }
        await finalizeManagedCall(ctx, quotaGate, { success: false, provider: "anthropic", providerCostUsd: 0, model: modelId, costSource: "zero_cost" });
        return jsonResponse({ type: "error", error: { type: "api_error", message: e?.message ?? String(e) } }, 502);
    }
  }),
});

http.route({
  path: "/v1/messages",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// /v1/models — Live catalog from modelCatalog table (populated by internal.modelCatalog.refresh, 6h cron).
// Replaces the legacy 25-entry hardcoded list. Source of truth: Convex modelCatalog table.
// Query params:
//   ?endpoint=/v1/chat/completions   filter to chat models only
//   ?endpoint=/v1/embeddings         filter to embedding models only
//   ?owned_by=openai                 filter to a single owner
//   ?provider=openrouter             filter to the serving catalog source
//   ?include_deprecated=true         include rows marked stale by last refresh sweep
http.route({
  path: "/v1/models",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const endpoint = url.searchParams.get("endpoint") ?? undefined;
    const ownedBy = url.searchParams.get("owned_by") ?? undefined;
    const provider = url.searchParams.get("provider") ?? undefined;
    const includeDeprecated = url.searchParams.get("include_deprecated") === "true";

    const rows = await ctx.runQuery(internal.modelCatalog.list, {
      ...(endpoint ? { endpoint } : {}),
      ...(ownedBy ? { ownedBy } : {}),
      ...(provider ? { provider } : {}),
      includeDeprecated,
    });
    const stats = await ctx.runQuery(internal.modelCatalog.stats, {});

    const data = rows.map((m: any) => ({
      id: m.id,
      object: "model",
      owned_by: m.ownedBy,
      via: m.via,
      served_by: m.source.replace(/-hardcoded$/, ""),
      endpoint: m.endpoint,
      ...(m.name ? { name: m.name } : {}),
      ...(m.contextWindow ? { context_window: m.contextWindow } : {}),
      ...(m.inputModalities ? { input_modalities: m.inputModalities } : {}),
      ...(m.deprecated ? { deprecated: true } : {}),
    }));

    return jsonResponse({
      object: "list",
      data,
      _apiclaw: {
        gateway: "v1",
        catalog_source: "live",
        total: data.length,
        by_owner: stats.byOwner,
        by_via: stats.byVia,
        last_refreshed_at: stats.lastSeenAt ? new Date(stats.lastSeenAt).toISOString() : null,
        note: "Live model inventory refreshed every 6h from upstream provider /models endpoints. Use each entry's endpoint field. Catalog presence proves upstream discovery, while successful execution also requires a healthy configured route and provider entitlement.",
        non_llm_apis: Object.keys(PROVIDERS).filter(isPubliclyAvailableManagedProvider).length + " public managed providers (search, TTS, embeddings, code execution, scraping, and more)",
      },
    });
  }),
});

http.route({
  path: "/v1/models",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ==============================================
// /v1/call — UNIFIED EXECUTION LAYER
// Binary funnel: every providerAPIs row with listingStatus="live" is reachable
// through this endpoint when backed by a managed adapter. Branches by authType:
//   "managed" → internal dispatch to existing /proxy/{providerName} adapter
//   everything else → discovery_only
// No BYOK. Ever.
// ==============================================

// Map of managed-provider names → /proxy/{adapter} internal forwarding.
// Case-insensitive. Names must match providerAPIs.name exactly (one word each).
const MANAGED_PROXY_ROUTES: Record<string, string> = {
  apilayer: "/proxy/apilayer",
  twilio: "/proxy/twilio",
  "46elks": "/proxy/46elks",
  resend: "/proxy/resend",
  openrouter: "/proxy/openrouter",
  brave_search: "/proxy/brave_search",
  "brave search": "/proxy/brave_search",
  elevenlabs: "/proxy/elevenlabs",
  github: "/proxy/github",
  serper: "/proxy/serper",
  firecrawl: "/proxy/firecrawl",
  groq: "/proxy/groq",
  mistral: "/proxy/mistral",
  cohere: "/proxy/cohere",
  replicate: "/proxy/replicate",
  deepgram: "/proxy/deepgram",
  e2b: "/proxy/e2b",
  together: "/proxy/together",
  deepinfra: "/proxy/deepinfra",
  stability: "/proxy/stability",
  assemblyai: "/proxy/assemblyai",
  nasa: "/proxy/nasa",
};

http.route({
  path: "/v1/call",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const t0 = Date.now();

    if (requiresLegacyClientUpgrade("/v1/call", request.headers)) {
      await recordLegacyClientUpgrade(ctx, request, "/v1/call");
      return legacyClientUpgradeResponse();
    }

    // Auth — accepts Bearer sk-claw, X-APIClaw-Api-Key, or X-APIClaw-Session.
    const auth = await resolveWorkspaceFromRequest(ctx, request);
    const workspaceId = auth.workspaceId;

    // Enforce gate: anonymous /v1/call is rejected when AUTH_ENFORCEMENT=enforce.
    if (auth.authMethod === "anonymous") {
      try {
        await ctx.runMutation(api.funnel.recordEvent, {
          event: "call_api_blocked",
          classification: "human",
          userAgent: request.headers.get("User-Agent") ?? undefined,
          props: {
            reason: "unauth",
            path: "/v1/call",
            mode: isEnforceMode() ? "enforce" : "shadow",
          },
        });
      } catch (e: any) {
        console.error("[v1/call] Funnel log failed:", e.message);
      }
      if (isEnforceMode()) {
        return unauthResponse("call_requires_auth");
      }
    }

    let body: any;
    try { body = await readManagedJsonBodyCapped(request); }
    catch { return jsonResponse({ error: { code: "invalid_json", message: "Body must be JSON" } }, 400); }

    const rewritten = rewriteLegacyProviderActionCall(body);
    if (rewritten) {
      const rewriteHeaders = new Headers(request.headers);
      if (!rewriteHeaders.get("Idempotency-Key")?.trim()) {
        rewriteHeaders.set("Idempotency-Key", synthesizeLegacyIdempotencyKey());
      }
      if (hasCustomerManagedCredential(rewriteHeaders)) {
        rewriteHeaders.delete("X-APIClaw-Internal");
      }
      rewriteHeaders.set("content-type", "application/json");
      return handleManagedExecute(
        ctx,
        new Request(new URL("/v1/execute", request.url), {
          method: "POST",
          headers: rewriteHeaders,
          body: JSON.stringify(rewritten),
        }),
      );
    }

    const apiName: string = typeof body?.api === "string" ? body.api.trim() : "";
    const userPath: string = typeof body?.path === "string" ? body.path : "/";
    const method: string = (body?.method ?? "GET").toString().toUpperCase();
    const params = body?.params && typeof body.params === "object" ? body.params : undefined;
    const userBody = body?.body;
    if (!apiName) {
      return jsonResponse({ error: { code: "missing_api", message: "Body must include { api: string }" } }, 400);
    }
    const scopeDenied = mcpScopeDenial(auth, "call");
    if (scopeDenied) return scopeDenied;
    if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      return jsonResponse({ error: { code: "invalid_method", message: `Unsupported method ${method}` } }, 400);
    }

    // Internal-only provider gate. Same set as /proxy/* routes.
    if (
      isInternalProviderReference(apiName) &&
      (auth as any).authMethod !== "internal"
    ) {
      return internalOnlyResponse(apiName);
    }

    // Lookup by exact name, then case-insensitive fallback.
    let row: any = null;
    try {
      const rows = await ctx.runQuery(api.pipelineAlign.searchDiscovery, {
        query: apiName,
        callableOnly: false,
        limit: 5,
        offset: 0,
      });
      const exact = rows.results.find((r: any) => r.name.toLowerCase() === apiName.toLowerCase());
      row = exact ?? rows.results[0];
    } catch (e: any) {
      return jsonResponse({ error: { code: "registry_lookup_failed", message: e.message } }, 503);
    }

    if (!row) {
      return jsonResponse(
        { error: { code: "api_not_found", message: `No API named "${apiName}" in registry`, hint: "Use /v1/discover to search." } },
        404
      );
    }
    if (!row.callable) {
      return jsonResponse(
        {
          error: {
            code: "discovery_only",
            message: `"${row.name}" is discovery-only (authType=${row.authType}).`,
            hint: "This API is indexed but not yet wired for execution. See docsUrl for integration.",
            docsUrl: row.docsUrl,
          },
        },
        400
      );
    }

    // Circuit breaker
    const rowFull = await ctx.runQuery(api.providers.getApiById, { apiId: row.id }).catch(() => null) as any;
    if (rowFull?.circuitOpenUntil && rowFull.circuitOpenUntil > Date.now()) {
      const retryAfterMs = rowFull.circuitOpenUntil - Date.now();
      return new Response(
        JSON.stringify({
          error: {
            code: "upstream_degraded",
            message: `"${row.name}" is currently unavailable (circuit open).`,
            retryAfterMs,
          },
        }),
        {
          status: 503,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": Math.ceil(retryAfterMs / 1000).toString(),
          },
        }
      );
    }

    const analyticsBase = {
      event: "api_call" as const,
      identifier: workspaceId ?? `anon:${auth.authMethod}`,
      workspaceId: workspaceId as any,
    };

    // ---------------- Branch: managed ----------------
    if (row.authType === "managed" && row.proxyMode === "direct_call") {
      const proxyRoute = MANAGED_PROXY_ROUTES[row.name.toLowerCase()];
      if (!proxyRoute) {
        return jsonResponse(
          { error: { code: "managed_not_mapped", message: `"${row.name}" is marked managed but has no proxy adapter mapping yet.` } },
          501
        );
      }
      // Server-side forward to the internal proxy adapter. We rebuild the body the
      // adapter expects: most adapters accept {service, endpoint, params} or similar
      // and are already callable via /proxy/*. We forward the inbound body verbatim
      // and preserve auth headers so the adapter can attribute usage correctly.
      const forwardUrl = new URL(proxyRoute, request.url).toString();
      try {
        const forwardRes = await fetch(forwardUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(request.headers.get("Authorization") ? { Authorization: request.headers.get("Authorization")! } : {}),
            ...(request.headers.get("X-APIClaw-Api-Key") ? { "X-APIClaw-Api-Key": request.headers.get("X-APIClaw-Api-Key")! } : {}),
            ...(request.headers.get("X-APIClaw-Session") ? { "X-APIClaw-Session": request.headers.get("X-APIClaw-Session")! } : {}),
            ...(request.headers.get("X-APIClaw-Subagent") ? { "X-APIClaw-Subagent": request.headers.get("X-APIClaw-Subagent")! } : {}),
            ...(request.headers.get("Idempotency-Key") ? { "Idempotency-Key": request.headers.get("Idempotency-Key")! } : {}),
          },
          body: JSON.stringify({ path: userPath, method, params, body: userBody, ...userBody }),
          signal: AbortSignal.timeout(25000),
        });
        if (forwardRes.ok) {
          await recordFirstSuccessfulGatewayCall(ctx, {
            workspaceId,
            path: "/v1/call",
            authMethod: auth.authMethod,
            provider: row.name,
            action: `${method} ${userPath}`,
          });
        }
        const respText = await forwardRes.text();
        const ok = forwardRes.status >= 200 && forwardRes.status < 500;
        if (ok) await ctx.runMutation(api.pipelineAlign.reportSuccess, { apiId: row.id });
        else await ctx.runMutation(api.pipelineAlign.reportFailure, { apiId: row.id, statusCode: forwardRes.status });
        try {
          await ctx.runMutation(api.analytics.log, {
            ...analyticsBase,
            provider: row.name,
            metadata: { route: "v1_call", mode: "managed", status: forwardRes.status, latencyMs: Date.now() - t0 },
          });
        } catch {}
        return new Response(respText, {
          status: forwardRes.status,
          headers: {
            ...corsHeaders,
            "Content-Type": forwardRes.headers.get("Content-Type") ?? "application/json",
            "X-APIClaw-Mode": "managed",
            "X-APIClaw-Provider": row.name,
          },
        });
      } catch (e: any) {
        await ctx.runMutation(api.pipelineAlign.reportFailure, { apiId: row.id, statusCode: 0 });
        return jsonResponse(
          { error: { code: "managed_adapter_error", message: e?.message ?? "managed adapter failed", provider: row.name } },
          502
        );
      }
    }

    // ---------------- Branch: open-proxy (authType="none") ----------------
    if (row.authType === "none" && row.proxyMode === "open_proxy") {
      return jsonResponse({
        error: {
          code: "discovery_only",
          message: `"${row.name}" remains discoverable but open-proxy execution is disabled until APIClaw has DNS-pinned, redirect-validating egress.`,
          docsUrl: row.docsUrl,
        },
      }, 501);
    }

    // ---------------- Branch: everything else = discovery_only ----------------
    return jsonResponse(
      {
        error: {
          code: "discovery_only",
          message: `"${row.name}" is discovery-only (authType=${row.authType}, proxyMode=${row.proxyMode}).`,
          docsUrl: row.docsUrl,
        },
      },
      400
    );
  }),
});

http.route({
  path: "/v1/call",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// ============================================
// CONTROL PLANE — MISSIONS
// ============================================
// `apiclaw mission ...` from CLI, `start_mission` from MCP, and POST from
// /v1/missions/start over HTTP all funnel through here. Same auth, same
// logs, same workspace boundaries as every other /v1/* endpoint.

http.route({
  path: "/v1/missions/templates",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const templates = await ctx.runQuery(api.missions.listTemplates, {});
    return jsonResponse({ templates });
  }),
});

http.route({
  path: "/v1/missions/templates",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// Rank publicly-available mission templates against a natural-language
// query. Mirrors /v1/discover shape so agents have a single mental model.
http.route({
  path: "/v1/missions/discover",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("query") ?? "";
    const maxRaw = url.searchParams.get("max_results");
    const maxResults = maxRaw ? parseInt(maxRaw, 10) : 5;
    if (!query) {
      return jsonResponse(
        { error: { code: "missing_query", message: "Pass ?query=<text>" } },
        400,
      );
    }
    const results = await ctx.runQuery(api.missions.discover, { query, maxResults });
    return jsonResponse({ query, results, count: results.length });
  }),
});

http.route({
  path: "/v1/missions/discover",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

http.route({
  path: "/v1/missions/start",
  method: "POST",
  handler: httpAction(async (ctx, request): Promise<Response> => {
    const auth = await resolveWorkspaceFromRequest(ctx, request);
    const scopeDenied = mcpScopeDenial(auth, "call");
    if (scopeDenied) return scopeDenied;
    if (auth.authMethod === "anonymous" || !auth.workspaceId) {
      return unauthResponse("missions_require_auth");
    }
    const trafficClass = auth.authMethod === "internal" ? "internal" : "customer";
    let idempotencyKey: string | null;
    try {
      idempotencyKey = requireManagedIdempotencyKey(
        request.headers.get("Idempotency-Key"),
        trafficClass,
      );
    } catch (error) {
      return jsonResponse({
        error: {
          code: request.headers.get("Idempotency-Key") === null
            ? "idempotency_key_required"
            : "invalid_idempotency_key",
          message: error instanceof Error ? error.message : "Invalid Idempotency-Key",
        },
      }, 400);
    }
    let body: any;
    try {
      body = await readManagedJsonBodyCapped(request);
    } catch {
      return jsonResponse({ error: { code: "invalid_json", message: "Body must be JSON" } }, 400);
    }
    const template = typeof body?.template === "string" ? body.template : "";
    const params = body?.params && typeof body.params === "object" ? body.params : {};
    const templateVersion =
      typeof body?.templateVersion === "number" ? body.templateVersion : undefined;
    if (!template) {
      return jsonResponse({ error: { code: "missing_template", message: "Body must include { template }" } }, 400);
    }
    const requestPayload = { template, templateVersion, params };
    const [requestId, requestFingerprint] = await Promise.all([
      deriveManagedRequestId({
        idempotencyKey,
        workspaceId: auth.workspaceId,
        provider: "mission",
        action: "start",
        path: "/v1/missions/start",
        payload: requestPayload,
      }),
      deriveRequestFingerprint(requestPayload),
    ]);
    // Mission creation is free control-plane work. Each cost-bearing mission
    // primitive reserves and finalizes its own managed ledger row immediately
    // before and after the corresponding upstream request.

    const initiatorMap: Record<string, string> = {
      "api-key": "http",
      session: "cli",
      "mcp-oauth": "grok",
      identifier: "http",
    };
    const initiator = initiatorMap[auth.authMethod] ?? "http";

    try {
      const created: any = await ctx.runMutation(internal.missions.createMission, {
        workspaceIdOverride: auth.workspaceId as any,
        requestId,
        requestFingerprint,
        template,
        templateVersion,
        params,
        initiator,
      });
      // Creation and one execution schedule are atomic inside the mutation.
      // Exact replays return the original mission without scheduling again.
      return jsonResponse(
        {
          missionId: created.missionId,
          status: created.status,
          isInternal: created.isInternal,
          idempotentReplay: created.duplicate,
          poll: `/v1/missions/${created.missionId}`,
        },
        202
      );
    } catch (e: any) {
      const msg = e?.message ?? "create_failed";
      const code = msg.startsWith("unknown_template")
        ? 400
        : msg.startsWith("idempotency_conflict")
          ? 409
          : 500;
      return jsonResponse({ error: { code: msg.split(":")[0] || "create_failed", message: msg } }, code);
    }
  }),
});

http.route({
  path: "/v1/missions/start",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

http.route({
  path: "/v1/missions",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = await resolveWorkspaceFromRequest(ctx, request);
    const scopeDenied = mcpScopeDenial(auth, "read");
    if (scopeDenied) return scopeDenied;
    if (auth.authMethod === "anonymous" || !auth.workspaceId) {
      return unauthResponse("missions_require_auth");
    }
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 200);
    const rows = await ctx.runQuery(internal.missions.listForWorkspace, {
      workspaceId: auth.workspaceId as any,
      limit,
    });
    return jsonResponse({ missions: rows });
  }),
});

http.route({
  path: "/v1/missions",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

// /v1/missions/<id> — single mission by ID. We use a pathPrefix so we can
// pull the id from the URL.
http.route({
  pathPrefix: "/v1/missions/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = await resolveWorkspaceFromRequest(ctx, request);
    const scopeDenied = mcpScopeDenial(auth, "read");
    if (scopeDenied) return scopeDenied;
    if (auth.authMethod === "anonymous" || !auth.workspaceId) {
      return unauthResponse("missions_require_auth");
    }
    const url = new URL(request.url);
    const tail = url.pathname.replace(/^\/v1\/missions\//, "").replace(/\/$/, "");
    if (!tail || tail === "templates" || tail === "start") {
      return jsonResponse({ error: { code: "not_found", message: "Unknown subpath" } }, 404);
    }
    const data = await ctx.runQuery(internal.missions.getMission, { missionId: tail as any });
    if (!data || !data.mission) {
      return jsonResponse({ error: { code: "not_found", message: "mission not found" } }, 404);
    }
    if (data.mission.workspaceId !== auth.workspaceId) {
      return jsonResponse({ error: { code: "forbidden", message: "mission belongs to another workspace" } }, 403);
    }
    return jsonResponse({ mission: data.mission, events: data.events });
  }),
});

http.route({
  pathPrefix: "/v1/missions/",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});
