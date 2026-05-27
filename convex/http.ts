import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { resolveVerifiedOwnerByWorkspaceId } from "./guards";
import {
  createCheckoutSession,
  createPortalSession,
  handleStripeWebhook,
  checkoutOptions,
  portalOptions,
  webhookOptions,
} from "./stripeActions";

const http = httpRouter();

// Provider catalog — all 20 managed providers
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

function calculateCallCost(model: string, usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }): { providerCost: number; apiclawCost: number } {
  if (!usage) return { providerCost: 0, apiclawCost: 0 };

  // Find cost entry (try exact match, then partial)
  let costs = MODEL_COSTS[model];
  if (!costs) {
    const modelLower = model.toLowerCase();
    const key = Object.keys(MODEL_COSTS).find(k => modelLower.includes(k.toLowerCase()));
    if (key) costs = MODEL_COSTS[key];
  }
  if (!costs) {
    // Unknown model -- estimate at medium tier
    costs = { input: 1.00, output: 3.00 };
  }

  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;

  const providerCost = (inputTokens * costs.input + outputTokens * costs.output) / 1_000_000;
  const apiclawCost = providerCost * (1 + APICLAW_MARGIN);

  return { providerCost, apiclawCost };
}

// ==============================================
// INTELLIGENT LLM ROUTER
// ==============================================

// Model-to-provider mapping: which direct providers can serve which model patterns
const MODEL_PROVIDER_MAP: { pattern: RegExp; provider: string; nativeModel: string }[] = [
  // Groq-native models (ultra-fast inference)
  { pattern: /^(groq\/)?llama-3\.3-70b/i, provider: "groq", nativeModel: "llama-3.3-70b-versatile" },
  { pattern: /^(groq\/)?llama-3\.1-8b/i, provider: "groq", nativeModel: "llama-3.1-8b-instant" },
  { pattern: /^(groq\/)?llama-3\.1-70b/i, provider: "groq", nativeModel: "llama-3.1-70b-versatile" },
  { pattern: /^(groq\/)?gemma2?-9b/i, provider: "groq", nativeModel: "gemma2-9b-it" },
  { pattern: /^(groq\/)?mixtral-8x7b/i, provider: "groq", nativeModel: "mixtral-8x7b-32768" },
  // Mistral-native models
  { pattern: /^(mistralai\/)?mistral-small/i, provider: "mistral", nativeModel: "mistral-small-latest" },
  { pattern: /^(mistralai\/)?mistral-large/i, provider: "mistral", nativeModel: "mistral-large-latest" },
  { pattern: /^(mistralai\/)?mistral-medium/i, provider: "mistral", nativeModel: "mistral-medium-latest" },
  { pattern: /^(mistralai\/)?codestral/i, provider: "mistral", nativeModel: "codestral-latest" },
  { pattern: /^(mistralai\/)?pixtral/i, provider: "mistral", nativeModel: "pixtral-large-latest" },
  { pattern: /^(mistralai\/)?mistral-nemo/i, provider: "mistral", nativeModel: "open-mistral-nemo" },
  // Together-native models (open-source at scale)
  { pattern: /^(together\/)?meta-llama\/Llama-3\.3-70B/i, provider: "together", nativeModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  { pattern: /^(together\/)?Qwen\/Qwen2\.5-72B/i, provider: "together", nativeModel: "Qwen/Qwen2.5-72B-Instruct-Turbo" },
  { pattern: /^(together\/)?deepseek-ai\/DeepSeek-R1/i, provider: "together", nativeModel: "deepseek-ai/DeepSeek-R1" },
  { pattern: /^(together\/)?deepseek-ai\/DeepSeek-V3$/i, provider: "together", nativeModel: "deepseek-ai/DeepSeek-V3" },
  // DeepInfra-native models (cheapest open-weights)
  { pattern: /^(deepinfra\/)?moonshotai\/Kimi-K2\.6/i, provider: "deepinfra", nativeModel: "moonshotai/Kimi-K2.6" },
  { pattern: /^(deepinfra\/)?moonshotai\/Kimi-K2\.5/i, provider: "deepinfra", nativeModel: "moonshotai/Kimi-K2.5" },
  { pattern: /^kimi-?k?2\.6$/i, provider: "deepinfra", nativeModel: "moonshotai/Kimi-K2.6" },
  { pattern: /^kimi-?k?2\.5$/i, provider: "deepinfra", nativeModel: "moonshotai/Kimi-K2.5" },
  { pattern: /^kimi$/i, provider: "deepinfra", nativeModel: "moonshotai/Kimi-K2.6" },
  { pattern: /^(deepinfra\/)?deepseek-ai\/DeepSeek-V3\.2/i, provider: "deepinfra", nativeModel: "deepseek-ai/DeepSeek-V3.2" },
  { pattern: /^deepseek-v3\.2$/i, provider: "deepinfra", nativeModel: "deepseek-ai/DeepSeek-V3.2" },
  // OpenAI direct models
  { pattern: /^(openai\/)?gpt-5\.4/i, provider: "openai", nativeModel: "gpt-5.4" },
  { pattern: /^(openai\/)?gpt-5/i, provider: "openai", nativeModel: "gpt-5" },
  { pattern: /^(openai\/)?gpt-4o/i, provider: "openai", nativeModel: "gpt-4o" },
  { pattern: /^(openai\/)?gpt-4\.1/i, provider: "openai", nativeModel: "gpt-4.1" },
  { pattern: /^(openai\/)?o3/i, provider: "openai", nativeModel: "o3" },
  { pattern: /^(openai\/)?o4-mini/i, provider: "openai", nativeModel: "o4-mini" },
  // xAI/Grok models
  { pattern: /^(xai\/)?grok-4/i, provider: "xai", nativeModel: "grok-4.20-reasoning" },
  { pattern: /^(xai\/)?grok-3-mini/i, provider: "xai", nativeModel: "grok-3-mini" },
  { pattern: /^(xai\/)?grok-3/i, provider: "xai", nativeModel: "grok-3" },
  { pattern: /^(xai\/)?grok-2/i, provider: "xai", nativeModel: "grok-2-latest" },
  // Anthropic direct models
  { pattern: /^(anthropic\/)?claude-sonnet-4-6/i, provider: "anthropic", nativeModel: "claude-sonnet-4-6-20250514" },
  { pattern: /^(anthropic\/)?claude-4-sonnet/i, provider: "anthropic", nativeModel: "claude-sonnet-4-6-20250514" },
  { pattern: /^(anthropic\/)?claude-opus-4/i, provider: "anthropic", nativeModel: "claude-opus-4-6-20250514" },
  { pattern: /^(anthropic\/)?claude-4-opus/i, provider: "anthropic", nativeModel: "claude-opus-4-6-20250514" },
  { pattern: /^(anthropic\/)?claude-3[\.\-]5-sonnet/i, provider: "anthropic", nativeModel: "claude-3-5-sonnet-20241022" },
  { pattern: /^(anthropic\/)?claude-haiku-4/i, provider: "anthropic", nativeModel: "claude-haiku-4-5-20251001" },
  { pattern: /^(anthropic\/)?claude-3[\.\-]5-haiku/i, provider: "anthropic", nativeModel: "claude-3-5-haiku-20241022" },
  // Shorthand aliases -- route common names to cheapest/fastest direct provider
  { pattern: /^deepseek-r1$/i, provider: "together", nativeModel: "deepseek-ai/DeepSeek-R1" },
  { pattern: /^deepseek-v3$/i, provider: "together", nativeModel: "deepseek-ai/DeepSeek-V3" },
  { pattern: /^llama-?3\.?3/i, provider: "groq", nativeModel: "llama-3.3-70b-versatile" },
  { pattern: /^llama-?3\.?1-?8b/i, provider: "groq", nativeModel: "llama-3.1-8b-instant" },
  { pattern: /^qwen-?2\.?5/i, provider: "together", nativeModel: "Qwen/Qwen2.5-72B-Instruct-Turbo" },
  // Catch-all passthrough — runs LAST. Routes any provider-prefixed or
  // canonically-named model to its direct provider with the user's exact id.
  // Sentinel "__passthrough__" tells the router to strip the provider prefix
  // and forward the rest verbatim to the provider's API. Lets latest models
  // (claude-opus-4.7, gpt-5.5, grok-4.3, etc.) work the day they ship without
  // updating MODEL_PROVIDER_MAP.
  { pattern: /^(anthropic\/)?claude-/i, provider: "anthropic", nativeModel: "__passthrough__" },
  { pattern: /^(openai\/)?(gpt-|o\d|chatgpt-)/i, provider: "openai", nativeModel: "__passthrough__" },
  { pattern: /^(xai\/|x-ai\/)?grok-/i, provider: "xai", nativeModel: "__passthrough__" },
  { pattern: /^(mistralai\/)?(mistral-|codestral|pixtral|magistral|ministral|open-)/i, provider: "mistral", nativeModel: "__passthrough__" },
];

// Strip provider prefix from a model id for passthrough routing.
function stripProviderPrefix(modelId: string): string {
  return modelId.replace(/^(anthropic|openai|xai|x-ai|mistralai|google|meta-llama|qwen|deepseek|moonshotai|groq|together)\//i, "");
}

interface RoutingDecision {
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string;
  reason: string;
  extraHeaders?: Record<string, string>;
}

// ==============================================
// ADVISOR: Analyzes prompts to pick optimal model+provider
// Opt-in only -- runs when routingMode === "advisor" AND model is "auto" or unspecified.
// Default routingMode "balanced" no longer triggers the advisor; explicit model names
// are honored verbatim and unspecified/auto falls through to rule-based routing.
// Uses Mistral Small (~$0.00001/decision) for near-zero cost intelligence
// ==============================================

const ADVISOR_SYSTEM_PROMPT = `You are an LLM routing advisor. Given a user prompt, pick the optimal provider and model.

PROVIDERS (use exact provider key and model name):

provider: "mistral", model: "mistral-small-latest" -- Fast, cheap. Simple Q&A, translation, summarization.
provider: "mistral", model: "mistral-large-latest" -- Strong reasoning, coding, complex analysis.
provider: "mistral", model: "codestral-latest" -- Code generation, debugging, technical.
provider: "together", model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" -- Strong open-source all-rounder.
provider: "together", model: "deepseek-ai/DeepSeek-R1" -- Deep reasoning, math, chain-of-thought.
provider: "together", model: "Qwen/Qwen2.5-72B-Instruct-Turbo" -- Multilingual, strong CJK.
provider: "openrouter", model: "anthropic/claude-sonnet-4-6" -- Best quality. Complex multi-step, nuanced writing.
provider: "openrouter", model: "openai/gpt-4o" -- Vision, function calling, broad knowledge.
provider: "openrouter", model: "google/gemini-2.0-flash-001" -- Fast multimodal, long context.

Respond with ONLY JSON:
{"provider":"mistral","model":"mistral-small-latest","reason":"simple factual query"}`;

interface AdvisorDecision {
  provider: string;
  model: string;
  reason: string;
}

async function advisorPickModel(
  messages: Array<{ role: string; content: string }>,
  settings: { blockedProviders: string[] }
): Promise<AdvisorDecision | null> {
  // Extract first user message for analysis (keep it short)
  const userMsg = messages.find(m => m.role === "user");
  if (!userMsg) return null;

  const promptPreview = typeof userMsg.content === "string"
    ? userMsg.content.slice(0, 500)
    : JSON.stringify(userMsg.content).slice(0, 500);

  // Use Mistral Small as the advisor (fast + cheap)
  const mistralKey = process.env.MISTRAL_API_KEY;
  if (!mistralKey) return null;

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mistralKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: ADVISOR_SYSTEM_PROMPT },
          { role: "user", content: `Route this prompt:\n\n${promptPreview}` },
        ],
        max_tokens: 100,
        temperature: 0,
      }),
    });

    if (!response.ok) return null;

    const data: any = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    // Parse JSON response (handle markdown code blocks)
    const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const decision = JSON.parse(jsonStr) as AdvisorDecision;

    // Validate the decision
    if (!decision.provider || !decision.model) return null;

    // Check if the suggested provider is blocked
    if (settings.blockedProviders.includes(decision.provider)) return null;

    return decision;
  } catch {
    // Advisor failed silently -- fall through to rule-based routing
    return null;
  }
}

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
  // 1. Direct provider match -- always wins, no advisor needed
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

    const resolvedModel = mapping.nativeModel === "__passthrough__"
      ? stripProviderPrefix(requestedModel)
      : mapping.nativeModel;

    return {
      provider: mapping.provider,
      model: resolvedModel,
      baseUrl: providerMeta.baseUrl,
      apiKey,
      reason: mapping.nativeModel === "__passthrough__"
        ? `direct_${mapping.provider}_passthrough`
        : `direct_${mapping.provider}`,
    };
  }

  // 2. ADVISOR -- intelligent model selection (OPT-IN ONLY)
  // Triggers when: routingMode === "advisor" AND model is "auto" or unspecified.
  // Callers who specify a model name skip the advisor entirely (handled in step 1).
  // Default mode "balanced" intentionally does NOT invoke the advisor anymore --
  // most callers want the model they asked for, not a re-pick by another LLM.
  const isAutoModel = !requestedModel || requestedModel === "auto";
  const useAdvisor = isAutoModel && settings.routingMode === "advisor" && messages && messages.length > 0;

  if (useAdvisor) {
    const advisorDecision = await advisorPickModel(messages, settings);
    if (advisorDecision) {
      // Map advisor decision to a routing decision
      const providerKey = advisorDecision.provider;
      const providerMeta = PROVIDERS[providerKey];

      if (providerMeta?.isLLM && providerMeta.envKey && providerMeta.baseUrl) {
        const apiKey = process.env[providerMeta.envKey];
        if (apiKey) {
          return {
            provider: providerKey,
            model: advisorDecision.model,
            baseUrl: providerMeta.baseUrl,
            apiKey,
            reason: `advisor_${providerKey}: ${advisorDecision.reason}`,
            ...(providerKey === "openrouter" ? {
              extraHeaders: { "HTTP-Referer": "https://apiclaw.cloud", "X-Title": "APIClaw Gateway" },
            } : {}),
          };
        }
      }

      // Advisor picked a provider we don't have direct keys for -- route via OpenRouter
      if (!settings.blockedProviders.includes("openrouter") && settings.allowOpenRouterFallback !== false) {
        const orKey = process.env.OPENROUTER_API_KEY;
        if (orKey) {
          return {
            provider: "openrouter",
            model: advisorDecision.model,
            baseUrl: "https://openrouter.ai/api/v1/chat/completions",
            apiKey: orKey,
            reason: `advisor_via_openrouter: ${advisorDecision.reason}`,
            extraHeaders: { "HTTP-Referer": "https://apiclaw.cloud", "X-Title": "APIClaw Gateway" },
          };
        }
      }
    }
    // Advisor failed -- fall through to rule-based routing
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
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-APIClaw-Internal, X-APIClaw-Subagent, X-APIClaw-Api-Key, X-APIClaw-Session, X-APIClaw-Identifier, X-APIClaw-Route, X-APIClaw-Workspace",
};

// ============================================
// SHADOW-MODE GATE (staged rollout to enforce)
// ============================================
// AUTH_ENFORCEMENT env var controls the gate behavior:
//   "shadow"  (default) → log unauth calls to funnel.call_api_unauth, pass through
//   "enforce"           → reject anonymous calls with 401 + signup link
// Per-workspace override: workspaces.gatingEnabled === true forces enforce for that workspace.
// /v1/discover stays open unconditionally.
function isEnforceMode(): boolean {
  return (process.env.APICLAW_AUTH_ENFORCEMENT ?? "shadow") === "enforce";
}

function unauthResponse(reason: string) {
  return jsonResponse(
    {
      error: {
        message:
          "Workspace required. APIClaw is free for the first 25 calls per month. Sign up at https://apiclaw.cloud/workspace and pass your sk-claw-... key as Authorization: Bearer.",
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
): Promise<{ workspaceId?: string; keyId?: string; authMethod: "api-key" | "session" | "identifier" | "mcp-oauth" | "anonymous" }> {
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
        return { workspaceId: resolved.workspaceId, authMethod: "mcp-oauth" };
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

  // 3. Legacy identifier header
  const identifier = request.headers.get("X-APIClaw-Identifier");
  if (identifier && !identifier.startsWith("anon:") && identifier !== "unknown" && identifier.length > 20) {
    return { workspaceId: identifier, authMethod: "identifier" };
  }

  // 4. Anonymous
  return { authMethod: "anonymous" };
}

// Providers that are NEVER callable through the public gateway. Used by NordSym
// internal infrastructure (booking confirmations, magic-link emails, OTP) and
// only reachable via X-APIClaw-Internal server-to-server auth, never through
// a workspace key, session, or anonymous call.
const INTERNAL_ONLY_PROVIDERS = new Set(["twilio", "46elks", "resend"]);

function internalOnlyResponse(provider: string) {
  return jsonResponse(
    {
      error: {
        code: "internal_only",
        message: `Provider "${provider}" is reserved for APIClaw internal infrastructure and not callable through the public gateway.`,
        type: "forbidden",
      },
    },
    403
  );
}

// Helper to validate session and log API usage.
// Returns a Response (401) when AUTH_ENFORCEMENT=enforce and the caller is anonymous.
// Returns a Response (403) when the provider is reserved for internal infrastructure.
async function validateAndLogProxyCall(
  ctx: any,
  request: Request,
  provider: string,
  action: string
): Promise<Response | { valid: true; workspaceId?: string; subagentId?: string; authMethod: string }> {
  const subagentId = request.headers.get("X-APIClaw-Subagent") || "main";

  // Resolve workspace from any auth method
  const auth = await resolveWorkspaceFromRequest(ctx, request);
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
    if (isEnforceMode()) {
      return unauthResponse("proxy_requires_auth");
    }
    // shadow mode: fall through, record analytics, pass the call
  }

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
    } catch (e: any) {
      console.error("[Proxy] Workspace logging failed:", e.message);
    }
    return { valid: true, workspaceId: resolvedWorkspaceId, subagentId, authMethod: auth.authMethod };
  }

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

// Full registry discovery — proxies to Vercel catalog (26,704 APIs)
http.route({
  path: "/v1/discover",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { headers: corsHeaders })),
});

http.route({
  path: "/v1/discover",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const query = body.query || "";
      const category = body.category || "";
      const callableOnly = body.callable_only ?? false;
      const page = body.page || 1;
      const limit = Math.min(body.limit || 20, 100);

      // Build query params for the Vercel catalog endpoint
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      if (callableOnly) params.set("callable", "true");
      params.set("page", String(page));
      params.set("limit", String(limit));

      const catalogUrl = `https://apiclaw.cloud/api/catalog?${params.toString()}`;
      const catalogRes = await fetch(catalogUrl);

      if (!catalogRes.ok) {
        return jsonResponse({ error: "Registry unavailable" }, 502);
      }

      const catalogData = await catalogRes.json() as {
        items: Array<{ name: string; description: string; category: string; baseUrl: string; docsUrl: string; auth: string; pricing: string; callable?: boolean }>;
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
        categories: Record<string, { total: number; callable: number }>;
        totalCallable: number;
      };

      // Also include managed providers from PROVIDERS catalog.
      // Filter out internal-only providers so they never appear in public discovery.
      const managedProviders = Object.entries(PROVIDERS)
        .filter(([id]) => !INTERNAL_ONLY_PROVIDERS.has(id.toLowerCase()))
        .map(([id, p]) => ({
          providerId: id,
          name: p.name,
          description: p.description,
          category: p.category,
          managed: true,
        }));

      // Also strip them from the catalog items in case the upstream registry
      // happens to include them.
      const filteredApis = (catalogData.items || []).filter(
        (item) => !INTERNAL_ONLY_PROVIDERS.has((item.name || "").toLowerCase()),
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
        const sessionToken = request.headers.get("X-APIClaw-Session");
        const auth = request.headers.get("Authorization") || "";
        // Best-effort caller workspace resolution — sessions or sk-claw-key
        let callerWorkspaceId: string = "anonymous";
        try {
          if (sessionToken) {
            const session = await ctx.runQuery(api.workspaces.getSession, { token: sessionToken });
            if (session?.workspaceId) callerWorkspaceId = session.workspaceId as string;
          } else if (auth.startsWith("Bearer sk-claw-")) {
            const result = await ctx.runQuery(internal.apiKeys.resolveKey, { rawKey: auth.slice(7) });
            if (result?.workspaceId) callerWorkspaceId = result.workspaceId as string;
          }
        } catch { /* ignore — anonymous fallback is fine for discovery */ }

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
        totalCallable: catalogData.totalCallable,
        managedProviders: managedProviders,
        _meta: {
          registry: "26,704 discoverable APIs",
          managed: `${managedProviders.length} managed providers`,
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
    endpoint: `https://adventurous-avocet-799.convex.site/proxy/${providerId}`,
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
    const __gate = await validateAndLogProxyCall(ctx, request, "openrouter", "chat");
    if (__gate instanceof Response) return __gate;
    
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
    const __gate = await validateAndLogProxyCall(ctx, request, "brave_search", "search");
    if (__gate instanceof Response) return __gate;
    
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
    const __gate = await validateAndLogProxyCall(ctx, request, "resend", "send_email");
    if (__gate instanceof Response) return __gate;
    
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
    const __gate = await validateAndLogProxyCall(ctx, request, "elevenlabs", "text_to_speech");
    if (__gate instanceof Response) return __gate;
    
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
    const __gate = await validateAndLogProxyCall(ctx, request, "46elks", "send_sms");
    if (__gate instanceof Response) return __gate;
    
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
    const __gate = await validateAndLogProxyCall(ctx, request, "twilio", "send_sms");
    if (__gate instanceof Response) return __gate;
    
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
    const __gate = await validateAndLogProxyCall(ctx, request, "github", action);
    if (__gate instanceof Response) return __gate;
    
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
    const __gate = await validateAndLogProxyCall(ctx, request, "serper", "search");
    if (__gate instanceof Response) return __gate;
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
    const __gate = await validateAndLogProxyCall(ctx, request, "firecrawl", "scrape");
    if (__gate instanceof Response) return __gate;
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
    const __gate = await validateAndLogProxyCall(ctx, request, "groq", "chat");
    if (__gate instanceof Response) return __gate;
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
    const __gate = await validateAndLogProxyCall(ctx, request, "mistral", "chat");
    if (__gate instanceof Response) return __gate;
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
    const __gate = await validateAndLogProxyCall(ctx, request, "cohere", "chat");
    if (__gate instanceof Response) return __gate;
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
    const __gate = await validateAndLogProxyCall(ctx, request, "replicate", "prediction");
    if (__gate instanceof Response) return __gate;
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
      return jsonResponse({ error: "Replicate not configured" }, 500);
    }
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return jsonResponse({ error: "id query param required" }, 400);
    }
    try {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { Authorization: `Bearer ${REPLICATE_KEY}` },
      });
      const data = await response.json();
      return jsonResponse(data, response.status);
    } catch (e: any) {
      return jsonResponse({ error: e.message }, 500);
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
    const __gate = await validateAndLogProxyCall(ctx, request, "e2b", "execute");
    if (__gate instanceof Response) return __gate;
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
    const __gate = await validateAndLogProxyCall(ctx, request, "together", "chat");
    if (__gate instanceof Response) return __gate;
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
      return jsonResponse({ error: "DeepInfra not configured" }, 500);
    }
    try {
      const body = await request.json();
      const { model = "moonshotai/Kimi-K2.6", messages, temperature = 0.7, max_tokens = 1024 } = body;
      if (!messages || !Array.isArray(messages)) {
        return jsonResponse({ error: "messages array required" }, 400);
      }
      const response = await fetch("https://api.deepinfra.com/v1/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DEEPINFRA_KEY}`,
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
    const __gate = await validateAndLogProxyCall(ctx, request, "assemblyai", "transcribe");
    if (__gate instanceof Response) return __gate;
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
    const __gate = await validateAndLogProxyCall(ctx, request, "apilayer", "call");
    if (__gate instanceof Response) return __gate;
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
      return jsonResponse({ error: "NASA not configured" }, 500);
    }

    let body: any = {};
    try { body = await request.json(); } catch {}
    const path: string = typeof body?.path === "string" && body.path.startsWith("/") ? body.path : "/planetary/apod";
    const method: string = (body?.method ?? "GET").toString().toUpperCase();
    const params: Record<string, any> = (body?.params && typeof body.params === "object") ? body.params : {};

    const url = new URL(path, "https://api.nasa.gov");
    if (url.origin !== "https://api.nasa.gov") {
      return jsonResponse({ error: "invalid_target", detail: "path must resolve under api.nasa.gov" }, 400);
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
      const text = await resp.text();
      return new Response(text, {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": ct, "X-APIClaw-Mode": "managed", "X-APIClaw-Provider": "NASA" },
      });
    } catch (e: any) {
      return jsonResponse({ error: "upstream_failed", message: e?.message ?? "fetch failed" }, 502);
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

// Helper: require auth (permanent API key OR CLI session). 401 if missing.
// Accepted forms:
//   Authorization: Bearer sk-claw-…     (legacy, still supported)
//   X-APIClaw-Api-Key: sk-claw-…        (preferred permanent header)
//   X-APIClaw-Session: <sessionToken>   (CLI login — apiclaw login)
async function requireApiKeyAuth(
  ctx: any,
  request: Request
): Promise<{ workspaceId: string; keyId?: string; authMethod: "api-key" | "session" } | Response> {
  const auth = await resolveWorkspaceFromRequest(ctx, request);
  if (auth.authMethod === "api-key" && auth.workspaceId && auth.keyId) {
    return { workspaceId: auth.workspaceId, keyId: auth.keyId, authMethod: "api-key" };
  }
  if (auth.authMethod === "session" && auth.workspaceId) {
    return { workspaceId: auth.workspaceId, authMethod: "session" };
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

    // PR3: Codex OAuth short-circuit. If caller supplied X-APIClaw-OAuth with a Codex JWT
    // AND the requested model is Codex-routable (gpt-5.x, codex-*)
    // AND their workspace tier permits it (founder/partner only), translate Chat
    // Completions → Responses and forward to chatgpt.com/backend-api/codex/responses.
    // Cost = $0 to apiclaw (caller's ChatGPT subscription pays).
    //
    // Canon: BYOK is NOT a public concept in apiclaw. OAuth-passthrough is restricted to
    // founder/partner workspaces so external customers can't pipe their own subs through
    // the gateway. They go through apiclaw's managed keys + pass-through pricing instead.
    const codexOauth = request.headers.get("X-APIClaw-OAuth");
    // Codex backend serves gpt-5.x variants and codex-* slugs. Other models (gpt-4o, o3,
    // anthropic/*, mistralai/*, etc.) must not be short-circuited — they fall through to
    // normal routing and the OAuth header is harmlessly ignored.
    const modelStr = (model || "").toString().toLowerCase();
    const bareModel = modelStr.startsWith("openai/") ? modelStr.slice("openai/".length) : modelStr.startsWith("openai-codex/") ? modelStr.slice("openai-codex/".length) : modelStr;
    const codexRoutableModel = /^(gpt-5\.|gpt-5-codex|codex-)/.test(bareModel) || bareModel === "gpt-5";
    if (isCodexJwt(codexOauth) && codexRoutableModel) {
      // Load workspace tier to gate OAuth passthrough.
      let codexTier = "free";
      try {
        const ws = await ctx.runQuery(internal.workspaceSettings.getForRouting, { workspaceId });
        codexTier = ws?.tier ?? "free";
      } catch {}
      if (codexTier !== "founder" && codexTier !== "partner") {
        return jsonResponse({
          error: {
            message: "OAuth passthrough is restricted to founder/partner workspaces. External callers must use apiclaw's managed routing (omit X-APIClaw-OAuth header).",
            type: "permission_error",
            code: "byok_not_permitted",
          },
        }, 403);
      }
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
        await ctx.runMutation(api.logs.createProxyLog, {
          workspaceId: workspaceId as any,
          provider: "openai-codex",
          action: "chat_completions",
          subagentId: request.headers.get("X-APIClaw-Subagent") || "main",
        });
        await ctx.runMutation(api.workspaces.incrementUsage, { workspaceId: workspaceId as any });
      } catch (e: any) {
        console.error("[/v1/chat/completions Codex] logging failed:", e?.message);
      }

      try {
        const upstream = await fetch(`${OPENAI_CODEX_RESPONSES_BASE_URL}/responses`, {
          method: "POST",
          headers: buildCodexHeaders(codexOauth!),
          body: JSON.stringify(codexBody),
        });

        // Non-2xx → map Codex { detail } to OpenAI error shape and return early.
        if (!upstream.ok) {
          let detail: any = null;
          try { detail = await upstream.json(); } catch { detail = { detail: await upstream.text() }; }
          const errMsg = detail?.error?.message ?? detail?.detail ?? `Codex upstream HTTP ${upstream.status}`;
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
            },
          }, upstream.status);
        }

        if (stream && upstream.body) {
          // Translate Responses-API SSE → Chat Completions SSE so OpenAI-compat
          // clients (OpenClaw, LangChain, Cursor, etc) can parse the stream.
          const translated = translateCodexSSEToChatCompletions(upstream.body, codexModel);
          return new Response(translated, {
            status: upstream.status,
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
              ...corsHeaders,
            },
          });
        }

        // Non-streaming caller: consume SSE serverside, take response.completed payload.
        const { response: responsesData, error: sseError } = await consumeCodexResponsesSSE(upstream.body);
        const latencyMs = Date.now() - startTime;

        if (sseError) {
          return jsonResponse({
            error: { message: sseError.message ?? "Codex stream error", type: "codex_error", code: sseError.code ?? "stream_error" },
            _apiclaw: {
              provider: "openai-codex",
              via: "codex-oauth",
              authMode: "founder_oauth_passthrough" satisfies ApiClawAuthMode,
              credentialSource: "founder_oauth_passthrough",
              latencyMs,
            },
          }, 502);
        }
        if (!responsesData) {
          return jsonResponse({
            error: { message: "Codex stream completed without response payload", type: "codex_error", code: "empty_stream" },
            _apiclaw: {
              provider: "openai-codex",
              via: "codex-oauth",
              authMode: "founder_oauth_passthrough" satisfies ApiClawAuthMode,
              credentialSource: "founder_oauth_passthrough",
              latencyMs,
            },
          }, 502);
        }

        const chatData = responsesToChatCompletionsResponse(responsesData, codexModel);
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
        };
        return jsonResponse(chatData, upstream.status);
      } catch (e: any) {
        return jsonResponse({ error: { message: e?.message ?? String(e), type: "api_error" } }, 502);
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

    const effectiveModel = model || settings.defaultModel || "anthropic/claude-sonnet-4-6";

    // Route the request (async -- may invoke advisor for intelligent model selection)
    const route = await routeLLMRequest(effectiveModel, {
      routingMode: effectiveRoutingMode,
      preferredProviders: effectivePreferred,
      blockedProviders: settings.blockedProviders,
      allowOpenRouterFallback: settings.allowOpenRouterFallback,
    }, messages);

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
        headers = {
          "Authorization": `Bearer ${effectiveApiKey}`,
          "Content-Type": "application/json",
          ...(route.extraHeaders || {}),
        };
      }

      let authMode: ApiClawAuthMode = oauthPassthroughEligible
        ? "founder_oauth_passthrough"
        : "managed_provider_key";

      let response = await fetch(route.baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      // OAuth fallback: if OAuth token fails with 401/403, retry with managed key
      const usedOAuth = oauthPassthroughEligible && effectiveApiKey !== route.apiKey;
      if (usedOAuth && (response.status === 401 || response.status === 403)) {
        console.log(`OAuth token failed (${response.status}), falling back to managed key for ${route.provider}`);
        headers["Authorization"] = `Bearer ${route.apiKey}`;
        authMode = "managed_provider_key_fallback";
        response = await fetch(route.baseUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        });
      }

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
      let data = await response.json();

      // Translate Anthropic response to OpenAI format
      if (isAnthropic && response.ok) {
        data = anthropicToOpenaiResponse(data, route.model);
      }
      const latencyMs = Date.now() - startTime;

      // Calculate cost from token usage
      const usage = (data as any)?.usage;
      const { providerCost, apiclawCost } = calculateCallCost(route.model, usage);

      // Log cost to usage records (fire and forget)
      if (apiclawCost > 0) {
        ctx.runMutation(internal.billing.logCallCost, {
          workspaceId: workspaceId as any,
          provider: route.provider,
          model: route.model,
          providerCostUsd: providerCost,
          apiclawCostUsd: apiclawCost,
          inputTokens: usage?.prompt_tokens || 0,
          outputTokens: usage?.completion_tokens || 0,
        }).catch(() => {});
      }

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
            providerUsd: Math.round(providerCost * 1_000_000) / 1_000_000,
            totalUsd: Math.round(apiclawCost * 1_000_000) / 1_000_000,
            margin: "15%",
          },
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
    const { workspaceId } = authResult;

    let body: any;
    try {
      body = await request.json();
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
      await ctx.runMutation(api.logs.createProxyLog, {
        workspaceId: workspaceId as any,
        provider: backend.provider,
        action: "embeddings",
        subagentId: request.headers.get("X-APIClaw-Subagent") || "main",
      });
      await ctx.runMutation(api.workspaces.incrementUsage, {
        workspaceId: workspaceId as any,
      });
    } catch (e: any) {
      console.error("[Gateway] Embeddings logging failed:", e.message);
    }

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

      const response = await fetch(backend.baseUrl, {
        method: "POST",
        headers: providerHeaders,
        body: JSON.stringify(providerRequestBody),
      });

      const providerData = await response.json();
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
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

      return jsonResponse(openAIData, 200);
    } catch (e: any) {
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
// Single endpoint for ALL API call types:
//   1. Managed providers (19 providers, APIClaw owns keys)
//   2. LLM routing (Groq, Mistral, Together, OpenRouter)
//   3. Open APIs (generic HTTP proxy with caller-supplied baseUrl)
//
// Auth: Bearer sk-claw-... OR X-APIClaw-Internal (server-to-server)
// ==============================================

// Managed provider dispatch: maps provider+action to an upstream HTTP call
// Returns { url, method, headers, body } or null if unknown
function buildManagedRequest(
  provider: string,
  action: string,
  params: Record<string, any>
): { url: string; method: string; headers: Record<string, string>; body?: string } | null {
  const meta = PROVIDERS[provider];
  if (!meta?.envKey) return null;

  const apiKey = process.env[meta.envKey];
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
      const voiceId = params.voice_id || "21m00Tcm4TlvDq8ikWAM";
      return {
        url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
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
      return {
        url: "https://api.stability.ai/v2beta/stable-image/generate/sd3",
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(params),
      };
    }
    case "github": {
      const ghHeaders = { "Authorization": `Bearer ${apiKey}`, "Accept": "application/vnd.github.v3+json", "User-Agent": "APIClaw-Gateway" };
      if (action === "search_repos") {
        const ghUrl = new URL("https://api.github.com/search/repositories");
        ghUrl.searchParams.set("q", params.query || params.q || "");
        return { url: ghUrl.toString(), method: "GET", headers: ghHeaders };
      }
      if (action === "get_repo") {
        return { url: `https://api.github.com/repos/${params.owner}/${params.repo}`, method: "GET", headers: ghHeaders };
      }
      if (action === "get_file") {
        return { url: `https://api.github.com/repos/${params.owner}/${params.repo}/contents/${params.path}`, method: "GET", headers: ghHeaders };
      }
      return null;
    }
    case "e2b": {
      // E2B sandbox execution is complex (create sandbox, then run code). Simplified for gateway.
      if (action !== "run_code") return null;
      return {
        url: "https://api.e2b.dev/v1/sandboxes",
        method: "POST",
        headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ template: params.template || "base", ...params }),
      };
    }
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
      // 14 unified APILayer actions + popular legacy APIs — ported from src/execute.ts
      // Reads product-specific env keys where APILayer requires them; falls back to unified.
      const p = (params as Record<string, any>) || {};
      const buildUrl = (base: string, qs?: Record<string, any>) => {
        const u = new URL(base);
        if (qs) for (const [k, v] of Object.entries(qs)) if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
        return u.toString();
      };
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
            url: "https://api.apilayer.com/smart_crop/url",
            method: "POST",
            headers: { apikey: apiKey, "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString(),
          };
        }
        case "form_submit": {
          if (!p.endpoint) return null;
          return {
            url: `https://api.apilayer.com/form_api/${p.endpoint}`,
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
            url: buildUrl("http://apilayer.net/api/validate", { access_key: envKey("VATLAYER_API_KEY"), vat_number: p.vat_number }),
            method: "GET",
            headers: {},
          };
        }

        // Legacy domains (each uses product-specific access_key query param)
        case "market_data": {
          if (!p.symbols) return null;
          return {
            url: buildUrl("http://api.marketstack.com/v1/eod", {
              access_key: envKey("MARKETSTACK_API_KEY"), symbols: p.symbols, limit: p.limit || 10, date_from: p.date_from, date_to: p.date_to,
            }),
            method: "GET", headers: {},
          };
        }
        case "aviation": {
          return {
            url: buildUrl("http://api.aviationstack.com/v1/flights", {
              access_key: envKey("AVIATIONSTACK_API_KEY"), flight_iata: p.flight_iata, dep_iata: p.dep_iata, arr_iata: p.arr_iata, airline_iata: p.airline_iata,
            }),
            method: "GET", headers: {},
          };
        }
        case "weatherstack_current":
        case "weather": {
          if (!p.query) return null;
          return {
            url: buildUrl("http://api.weatherstack.com/current", { access_key: envKey("WEATHERSTACK_API_KEY"), query: p.query, units: p.units || "m" }),
            method: "GET", headers: {},
          };
        }
        case "weatherstack_forecast": {
          if (!p.query) return null;
          return {
            url: buildUrl("http://api.weatherstack.com/forecast", { access_key: envKey("WEATHERSTACK_API_KEY"), query: p.query, forecast_days: p.forecast_days || 3 }),
            method: "GET", headers: {},
          };
        }
        case "ipstack_lookup": {
          if (!p.ip) return null;
          return {
            url: buildUrl(`http://api.ipstack.com/${encodeURIComponent(p.ip)}`, { access_key: envKey("IPSTACK_API_KEY") }),
            method: "GET", headers: {},
          };
        }
        case "ipapi_lookup": {
          if (!p.ip) return null;
          return {
            url: buildUrl(`https://api.ipapi.com/api/${encodeURIComponent(p.ip)}`, { access_key: envKey("IPAPI_API_KEY") }),
            method: "GET", headers: {},
          };
        }
        case "currencylayer_live": {
          return {
            url: buildUrl("http://api.currencylayer.com/live", { access_key: envKey("CURRENCYLAYER_API_KEY"), source: p.source || "USD", currencies: p.currencies }),
            method: "GET", headers: {},
          };
        }
        case "currencylayer_convert": {
          if (!p.from || !p.to || !p.amount) return null;
          return {
            url: buildUrl("http://api.currencylayer.com/convert", {
              access_key: envKey("CURRENCYLAYER_API_KEY"), from: p.from, to: p.to, amount: p.amount, date: p.date,
            }),
            method: "GET", headers: {},
          };
        }
        case "coinlayer_live": {
          return {
            url: buildUrl("http://api.coinlayer.com/live", { access_key: envKey("COINLAYER_API_KEY"), target: p.target || "USD", symbols: p.symbols }),
            method: "GET", headers: {},
          };
        }
        case "positionstack_forward": {
          if (!p.query) return null;
          return {
            url: buildUrl("http://api.positionstack.com/v1/forward", { access_key: envKey("POSITIONSTACK_API_KEY"), query: p.query, limit: p.limit || 1 }),
            method: "GET", headers: {},
          };
        }
        case "positionstack_reverse": {
          if (!p.query) return null;
          return {
            url: buildUrl("http://api.positionstack.com/v1/reverse", { access_key: envKey("POSITIONSTACK_API_KEY"), query: p.query, limit: p.limit || 1 }),
            method: "GET", headers: {},
          };
        }
        case "fixer_latest": {
          return {
            url: buildUrl("http://data.fixer.io/api/latest", { access_key: envKey("FIXER_API_KEY"), base: p.base || "EUR", symbols: p.symbols }),
            method: "GET", headers: {},
          };
        }
        case "fixer_convert": {
          if (!p.from || !p.to || !p.amount) return null;
          return {
            url: buildUrl("http://data.fixer.io/api/convert", {
              access_key: envKey("FIXER_API_KEY"), from: p.from, to: p.to, amount: p.amount, date: p.date,
            }),
            method: "GET", headers: {},
          };
        }
        case "languagelayer_detect": {
          if (!p.query) return null;
          return {
            url: buildUrl("http://api.languagelayer.com/detect", { access_key: envKey("LANGUAGELAYER_API_KEY"), query: p.query }),
            method: "GET", headers: {},
          };
        }
        case "scrapestack_scrape": {
          if (!p.url) return null;
          return {
            url: buildUrl("http://api.scrapestack.com/scrape", { access_key: envKey("SCRAPESTACK_API_KEY"), url: p.url, render_js: p.render_js ? "1" : "0" }),
            method: "GET", headers: {},
          };
        }
        case "serpstack_search": {
          if (!p.query) return null;
          return {
            url: buildUrl("http://api.serpstack.com/search", { access_key: envKey("SERPSTACK_API_KEY"), query: p.query, num: p.num || 10 }),
            method: "GET", headers: {},
          };
        }
        case "mediastack_news": {
          return {
            url: buildUrl("http://api.mediastack.com/v1/news", { access_key: envKey("MEDIASTACK_API_KEY"), keywords: p.keywords, categories: p.categories, limit: p.limit || 10 }),
            method: "GET", headers: {},
          };
        }
        case "userstack_detect": {
          if (!p.ua) return null;
          return {
            url: buildUrl("http://api.userstack.com/detect", { access_key: envKey("USERSTACK_API_KEY"), ua: p.ua }),
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

// Resolve auth for /v1/execute.
// Accepts: X-APIClaw-Internal (server-to-server), Bearer sk-claw-… or X-APIClaw-Api-Key (permanent keys), X-APIClaw-Session (CLI login).
// Shadow-mode: anonymous is logged to funnel.call_api_blocked and returned as authMethod=anonymous
// so existing headless traffic is unbroken until AUTH_ENFORCEMENT=enforce flips.
async function resolveExecuteAuth(
  ctx: any,
  request: Request
): Promise<{ workspaceId?: string; keyId?: string; authMethod: "api-key" | "session" | "internal" | "anonymous" } | Response> {
  // 1. Internal server-to-server auth
  const internalSecret = request.headers.get("X-APIClaw-Internal");
  if (internalSecret) {
    const expectedSecret = process.env.APICLAW_INTERNAL_SECRET;
    if (!expectedSecret || internalSecret !== expectedSecret) {
      return jsonResponse({ error: { message: "Invalid internal secret", type: "auth_error" } }, 401);
    }
    const workspaceHeader = request.headers.get("X-APIClaw-Workspace");
    return { workspaceId: workspaceHeader || undefined, authMethod: "internal" };
  }

  // 2. API key or CLI session (unified resolver handles both new header forms)
  const auth = await resolveWorkspaceFromRequest(ctx, request);
  if (auth.authMethod === "api-key" && auth.workspaceId && auth.keyId) {
    return { workspaceId: auth.workspaceId, keyId: auth.keyId, authMethod: "api-key" };
  }
  if (auth.authMethod === "session" && auth.workspaceId) {
    return { workspaceId: auth.workspaceId, authMethod: "session" };
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

http.route({
  path: "/v1/execute",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();

    // Auth
    const authResult = await resolveExecuteAuth(ctx, request);
    if (authResult instanceof Response) return authResult;
    const { workspaceId, authMethod } = authResult;

    // Parse body
    let body: any;
    try {
      body = await request.json();
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

    const subagentId = request.headers.get("X-APIClaw-Subagent") || "main";

    // Determine execution path
    let routeDetail = "";

    // Path 1: LLM routing (provider "auto" or known LLM provider with action "chat")
    const isLLMRequest = action === "chat" && (
      provider === "auto" ||
      (PROVIDERS[provider]?.isLLM === true)
    );

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

      const route = await routeLLMRequest(effectiveModel, {
        routingMode: effectiveRoutingMode,
        preferredProviders: finalPreferred,
        blockedProviders: settings.blockedProviders,
        allowOpenRouterFallback: settings.allowOpenRouterFallback,
      }, params.messages);

      if (!route) {
        return jsonResponse({ success: false, error: "No LLM provider available", _apiclaw: { latencyMs: Date.now() - startTime, route: "none", gateway: true } }, 503);
      }

      routeDetail = route.reason;

      // Log usage
      if (workspaceId) {
        try {
          await ctx.runMutation(api.analytics.log, {
            event: "api_call", provider: "gateway", identifier: workspaceId,
            workspaceId: workspaceId as any,
            metadata: { action: "execute_chat", model: effectiveModel, routedTo: route.provider, routeReason: route.reason, authMethod },
          });
          await ctx.runMutation(api.logs.createProxyLog, {
            workspaceId: workspaceId as any, provider: route.provider, action: "chat", subagentId,
          });
          await ctx.runMutation(api.workspaces.incrementUsage, { workspaceId: workspaceId as any });
        } catch (e: any) { console.error("[Execute] LLM logging failed:", e.message); }
      }

      // Forward to provider
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
          headers = {
            "Authorization": `Bearer ${route.apiKey}`,
            "Content-Type": "application/json",
            ...(route.extraHeaders || {}),
          };
        }

        const response = await fetch(route.baseUrl, {
          method: "POST", headers, body: JSON.stringify(finalBody),
        });

        // Streaming
        if (params.stream && response.body) {
          return new Response(response.body, {
            status: response.status,
            headers: { "Content-Type": response.headers.get("Content-Type") || "text/event-stream", "Cache-Control": "no-cache", ...corsHeaders },
          });
        }

        let data = await response.json();

        // Translate Anthropic response to OpenAI format
        if (isAnthropic && response.ok) {
          data = anthropicToOpenaiResponse(data, route.model);
        }
        const latencyMs = Date.now() - startTime;

        // Calculate cost from token usage (parity with /v1/chat/completions)
        const usage = (data as any)?.usage;
        const { providerCost, apiclawCost } = calculateCallCost(route.model, usage);

        // Log cost to usage records
        if (apiclawCost > 0 && workspaceId) {
          ctx.runMutation(internal.billing.logCallCost, {
            workspaceId: workspaceId as any,
            provider: route.provider,
            model: route.model,
            providerCostUsd: providerCost,
            apiclawCostUsd: apiclawCost,
            inputTokens: usage?.prompt_tokens || 0,
            outputTokens: usage?.completion_tokens || 0,
          }).catch(() => {});
        }

        return jsonResponse({
          success: response.ok,
          provider: route.provider,
          action: "chat",
          data,
          _apiclaw: {
            latencyMs, route: routeDetail, gateway: true, model: route.model,
            cost: {
              providerUsd: Math.round(providerCost * 1_000_000) / 1_000_000,
              totalUsd: Math.round(apiclawCost * 1_000_000) / 1_000_000,
              margin: "15%",
            },
          },
        }, response.ok ? 200 : response.status);
      } catch (e: any) {
        return jsonResponse({ success: false, provider: provider, action, error: e.message, _apiclaw: { latencyMs: Date.now() - startTime, route: routeDetail, gateway: true } }, 500);
      }
    }

    // Path 2: Managed provider (known in PROVIDERS catalog)
    if (PROVIDERS[provider]) {
      // Managed provider path
      routeDetail = `direct_${provider}`;

      const req = buildManagedRequest(provider, action, params);
      if (!req) {
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
          await ctx.runMutation(api.logs.createProxyLog, {
            workspaceId: workspaceId as any, provider, action, subagentId,
          });
          await ctx.runMutation(api.workspaces.incrementUsage, { workspaceId: workspaceId as any });
        } catch (e: any) { console.error("[Execute] Managed logging failed:", e.message); }
      }

      // Execute upstream call
      try {
        const fetchOpts: RequestInit = { method: req.method, headers: req.headers };
        if (req.body) fetchOpts.body = req.body;

        const response = await fetch(req.url, fetchOpts);
        const latencyMs = Date.now() - startTime;

        // Inbound log to provider-owner workspace (parity with MCP src/index.ts:2192).
        // Without this, gateway/HTTP calls bypass partner dashboards.
        if (workspaceId) {
          try {
            await ctx.runMutation(api.logs.logProviderCall, {
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
          const buf = await response.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let binary = "";
          const chunk = 0x8000;
          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
          }
          const base64 = btoa(binary);
          return jsonResponse({
            success: response.ok,
            provider,
            action,
            data: {
              message: response.ok ? "Binary asset returned" : "Binary error",
              content_type: contentType,
              size: buf.byteLength,
              base64,
            },
            _apiclaw: { latencyMs, route: routeDetail, gateway: true },
          }, response.ok ? 200 : response.status);
        }

        // For text/json responses read once as text then try json parse
        const raw = await response.text();
        let data: any;
        try {
          data = JSON.parse(raw);
        } catch {
          data = { raw };
        }

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
            await ctx.runMutation(api.logs.logProviderCall, {
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
        return jsonResponse({
          success: false, provider, action, error: e.message,
          _apiclaw: { latencyMs, route: routeDetail, gateway: true },
        }, 500);
      }
    }

    // Path 3: Open API (generic HTTP proxy)
    // Open API path
    routeDetail = `open_${provider}`;

    const { baseUrl, method = "GET", headers: customHeaders = {}, body: customBody } = params;
    if (!baseUrl) {
      return jsonResponse({
        success: false,
        error: `Unknown provider "${provider}". For open APIs, include params.baseUrl.`,
        _apiclaw: { latencyMs: Date.now() - startTime, route: "unknown", gateway: true },
      }, 400);
    }

    // Log usage
    if (workspaceId) {
      try {
        await ctx.runMutation(api.analytics.log, {
          event: "api_call", provider: `open:${provider}`, identifier: workspaceId,
          workspaceId: workspaceId as any,
          metadata: { action, subagentId, authMethod, baseUrl, via: "execute_open" },
        });
        await ctx.runMutation(api.logs.createProxyLog, {
          workspaceId: workspaceId as any, provider: `open:${provider}`, action, subagentId,
        });
        await ctx.runMutation(api.workspaces.incrementUsage, { workspaceId: workspaceId as any });
      } catch (e: any) { console.error("[Execute] Open API logging failed:", e.message); }
    }

    // Execute open API call
    try {
      const fetchOpts: RequestInit = {
        method: method.toUpperCase(),
        headers: { "Content-Type": "application/json", ...customHeaders },
      };
      if (customBody && method.toUpperCase() !== "GET") {
        fetchOpts.body = typeof customBody === "string" ? customBody : JSON.stringify(customBody);
      }

      const response = await fetch(baseUrl, fetchOpts);
      const latencyMs = Date.now() - startTime;

      let data: any;
      const ct = response.headers.get("Content-Type") || "";
      if (ct.includes("json")) {
        try { data = await response.json(); } catch { data = { raw: await response.text() }; }
      } else {
        data = { raw: await response.text() };
      }

      return jsonResponse({
        success: response.ok,
        provider,
        action,
        data,
        _apiclaw: { latencyMs, route: routeDetail, gateway: true },
      }, response.ok ? 200 : response.status);
    } catch (e: any) {
      return jsonResponse({
        success: false, provider, action, error: e.message,
        _apiclaw: { latencyMs: Date.now() - startTime, route: routeDetail, gateway: true },
      }, 500);
    }
  }),
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
  | "managed_provider_key_fallback";

const OPENAI_CODEX_RESPONSES_BASE_URL = "https://chatgpt.com/backend-api/codex";
const OPENAI_NATIVE_RESPONSES_URL = "https://api.openai.com/v1/responses";
const CODEX_ORIGINATOR = "apiclaw_gateway";

// Codex Responses SSE → Chat Completions SSE translator.
// Wraps the upstream Responses-API stream and emits Chat-Completions-shape
// chunks that OpenAI-compat clients (OpenClaw, Cursor, LangChain, etc) can parse.
function translateCodexSSEToChatCompletions(
  upstreamBody: ReadableStream<Uint8Array>,
  model: string,
): ReadableStream<Uint8Array> {
  const chatId = `chatcmpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const created = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const toolCallsByIndex: Record<number, { id: string; name: string; args: string }> = {};
  let buf = "";
  let sentRole = false;
  let finishEmitted = false;

  function emitChunk(controller: ReadableStreamDefaultController<Uint8Array>, delta: any, finishReason: string | null = null, usage: any = null) {
    const chunk: any = {
      id: chatId,
      object: "chat.completion.chunk",
      created,
      model,
      choices: [{ index: 0, delta, finish_reason: finishReason }],
    };
    if (usage) chunk.usage = usage;
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstreamBody.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buf.indexOf("\n\n")) !== -1) {
            const block = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            const dataLines = block.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim());
            if (dataLines.length === 0) continue;
            const payload = dataLines.join("");
            if (!payload || payload === "[DONE]") continue;
            let evt: any;
            try { evt = JSON.parse(payload); } catch { continue; }
            const t = evt?.type;

            if (t === "response.output_text.delta" && typeof evt.delta === "string") {
              if (!sentRole) { emitChunk(controller, { role: "assistant", content: "" }); sentRole = true; }
              emitChunk(controller, { content: evt.delta });
            } else if (t === "response.output_item.added" && evt.item?.type === "function_call") {
              const idx = evt.output_index ?? 0;
              toolCallsByIndex[idx] = { id: evt.item.call_id ?? evt.item.id, name: evt.item.name ?? "", args: "" };
              if (!sentRole) { emitChunk(controller, { role: "assistant", content: null }); sentRole = true; }
              emitChunk(controller, {
                tool_calls: [{
                  index: idx,
                  id: toolCallsByIndex[idx].id,
                  type: "function",
                  function: { name: toolCallsByIndex[idx].name, arguments: "" },
                }],
              });
            } else if (t === "response.function_call_arguments.delta" && typeof evt.delta === "string") {
              const idx = evt.output_index ?? 0;
              if (toolCallsByIndex[idx]) toolCallsByIndex[idx].args += evt.delta;
              emitChunk(controller, {
                tool_calls: [{
                  index: idx,
                  function: { arguments: evt.delta },
                }],
              });
            } else if (t === "response.completed" || t === "response.failed") {
              if (finishEmitted) continue;
              finishEmitted = true;
              const hasToolCalls = Object.keys(toolCallsByIndex).length > 0;
              const stopReason = hasToolCalls ? "tool_calls" : (t === "response.failed" ? "stop" : "stop");
              const u = evt.response?.usage ?? {};
              const promptTokens = u.input_tokens ?? 0;
              const completionTokens = u.output_tokens ?? 0;
              const cachedTokens = u.input_tokens_details?.cached_tokens ?? 0;
              const usageOut: any = {
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: u.total_tokens ?? promptTokens + completionTokens,
              };
              if (cachedTokens > 0) usageOut.prompt_tokens_details = { cached_tokens: cachedTokens };
              emitChunk(controller, {}, stopReason, usageOut);
            } else if (t === "response.error" || t === "error") {
              const errPayload = {
                id: chatId,
                object: "chat.completion.chunk",
                created,
                model,
                error: evt.error ?? evt,
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(errPayload)}\n\n`));
            }
          }
        }
        if (!finishEmitted) emitChunk(controller, {}, "stop");
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (e: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: { message: e?.message ?? String(e), type: "stream_translator_error" } })}\n\n`));
      } finally {
        controller.close();
        try { reader.releaseLock(); } catch {}
      }
    },
  });
}

// Codex backend requires streaming. When caller wants non-streaming, we consume
// the SSE stream serverside and reconstruct the final response. With store:false
// (which Codex requires), `response.completed.response.output` is empty — we must
// collect output items from `response.output_item.done` events.
async function consumeCodexResponsesSSE(body: ReadableStream<Uint8Array> | null): Promise<{ response: any | null; error: any | null }> {
  if (!body) return { response: null, error: { message: "empty stream" } };
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let baseResponse: any = null;       // snapshot from response.completed (with usage, id, status)
  const itemsByIndex: Record<number, any> = {};
  let errorPayload: any = null;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
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
  if (!baseResponse) return { response: null, error: { message: "no response.completed event received" } };

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

function buildCodexHeaders(oauthToken: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: oauthToken.startsWith("Bearer ") ? oauthToken : `Bearer ${oauthToken}`,
    "Content-Type": "application/json",
    "originator": CODEX_ORIGINATOR,
    "User-Agent": "apiclaw_gateway/1.0 (Convex; +https://apiclaw.cloud)",
    "openai-beta": "responses=experimental",
  };
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
    const { workspaceId } = authResult;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: { message: "Invalid JSON body", type: "invalid_request_error" } }, 400);
    }
    if (!body.model || (!body.input && !body.messages)) {
      return jsonResponse({ error: { message: "model and input are required", type: "invalid_request_error" } }, 400);
    }

    // Normalize model id
    let modelId: string = body.model;
    if (modelId.startsWith("openai/")) modelId = modelId.slice("openai/".length);
    if (modelId.startsWith("openai-codex/")) modelId = modelId.slice("openai-codex/".length);

    // Route: Codex JWT in X-APIClaw-OAuth header → chatgpt.com, else api.openai.com.
    // Canon: BYOK / OAuth-passthrough restricted to founder/partner workspaces.
    const oauthHeader = request.headers.get("X-APIClaw-OAuth");
    let useCodex = isCodexJwt(oauthHeader);
    if (useCodex) {
      let respTier = "free";
      try {
        const ws = await ctx.runQuery(internal.workspaceSettings.getForRouting, { workspaceId });
        respTier = ws?.tier ?? "free";
      } catch {}
      if (respTier !== "founder" && respTier !== "partner") {
        return jsonResponse({
          error: {
            message: "OAuth passthrough is restricted to founder/partner workspaces. External callers must omit X-APIClaw-OAuth (use apiclaw's managed routing).",
            type: "permission_error",
            code: "byok_not_permitted",
          },
        }, 403);
      }
    }

    const authMode: ApiClawAuthMode = useCodex
      ? "founder_oauth_passthrough"
      : "managed_provider_key";

    const upstreamUrl = useCodex ? `${OPENAI_CODEX_RESPONSES_BASE_URL}/responses` : OPENAI_NATIVE_RESPONSES_URL;
    const upstreamHeaders = useCodex
      ? buildCodexHeaders(oauthHeader!)
      : { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" };

    if (!useCodex && !process.env.OPENAI_API_KEY) {
      return jsonResponse({ error: { message: "OPENAI_API_KEY not configured", type: "api_error" } }, 503);
    }

    const forwardBody = { ...body, model: modelId };
    const stream = !!body.stream;

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
      await ctx.runMutation(api.logs.createProxyLog, {
        workspaceId: workspaceId as any,
        provider: useCodex ? "openai-codex" : "openai",
        action: "responses",
        subagentId: request.headers.get("X-APIClaw-Subagent") || "main",
      });
      await ctx.runMutation(api.workspaces.incrementUsage, {
        workspaceId: workspaceId as any,
      });
    } catch (e: any) {
      console.error("[/v1/responses] logging failed:", e?.message);
    }

    try {
      const upstream = await fetch(upstreamUrl, {
        method: "POST",
        headers: upstreamHeaders,
        body: JSON.stringify(forwardBody),
      });

      if (stream && upstream.body) {
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

      const data = await upstream.json();
      const latencyMs = Date.now() - startTime;

      // Cost tracking: Codex OAuth = $0 to apiclaw (caller's ChatGPT sub pays).
      // Direct OpenAI = pass-through + 15% (or 0% for internal workspaces).
      if (!useCodex) {
        const u = data?.usage ?? {};
        const promptTokens = u.input_tokens ?? 0;
        const completionTokens = u.output_tokens ?? 0;
        const { providerCost, apiclawCost } = calculateCallCost(
          `openai/${modelId}`,
          { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens }
        );
        if (apiclawCost > 0) {
          ctx.runMutation(internal.billing.logCallCost, {
            workspaceId: workspaceId as any,
            provider: "openai",
            model: modelId,
            providerCostUsd: providerCost,
            apiclawCostUsd: apiclawCost,
            inputTokens: promptTokens,
            outputTokens: completionTokens,
          }).catch(() => {});
        }
      }

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
        };
      }

      return jsonResponse(data, upstream.status);
    } catch (e: any) {
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
    const { workspaceId } = authResult;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ type: "error", error: { type: "invalid_request_error", message: "Invalid JSON body" } }, 400);
    }
    if (!body.model) {
      return jsonResponse({ type: "error", error: { type: "invalid_request_error", message: "model is required" } }, 400);
    }
    if (!Array.isArray(body.messages)) {
      return jsonResponse({ type: "error", error: { type: "invalid_request_error", message: "messages array is required" } }, 400);
    }

    // Normalize model id: accept "anthropic/claude-..." or "claude-..." — Anthropic API expects the bare form.
    let modelId: string = body.model;
    if (modelId.startsWith("anthropic/")) modelId = modelId.slice("anthropic/".length);

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
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
      await ctx.runMutation(api.logs.createProxyLog, {
        workspaceId: workspaceId as any,
        provider: "anthropic",
        action: "messages",
        subagentId: request.headers.get("X-APIClaw-Subagent") || "main",
      });
      await ctx.runMutation(api.workspaces.incrementUsage, {
        workspaceId: workspaceId as any,
      });
    } catch (e: any) {
      console.error("[/v1/messages] logging failed:", e?.message);
    }

    try {
      const upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: upstreamHeaders,
        body: JSON.stringify(forwardBody),
      });

      // Streaming: passthrough SSE
      if (stream && upstream.body) {
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
      const data = await upstream.json();
      const latencyMs = Date.now() - startTime;

      // Cost calc — reuse existing calculateCallCost. Anthropic's usage shape differs from OpenAI;
      // map cache_creation + cache_read + input → prompt_tokens for the cost helper.
      const u = (data as any)?.usage ?? {};
      const promptTokens = (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
      const completionTokens = u.output_tokens ?? 0;
      const { providerCost, apiclawCost } = calculateCallCost(
        `anthropic/${modelId}`,
        { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens }
      );

      if (apiclawCost > 0) {
        ctx.runMutation(internal.billing.logCallCost, {
          workspaceId: workspaceId as any,
          provider: "anthropic",
          model: modelId,
          providerCostUsd: providerCost,
          apiclawCostUsd: apiclawCost,
          inputTokens: promptTokens,
          outputTokens: completionTokens,
        }).catch(() => {});
      }

      if (data && typeof data === "object" && !("error" in data)) {
        (data as any)._apiclaw = {
          gateway: "v1",
          endpoint: "/v1/messages",
          provider: "anthropic",
          model: modelId,
          latencyMs,
          cost: {
            providerUsd: Math.round(providerCost * 1_000_000) / 1_000_000,
            totalUsd: Math.round(apiclawCost * 1_000_000) / 1_000_000,
            margin: "15%",
          },
        };
      }

      return jsonResponse(data, upstream.status);
    } catch (e: any) {
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
//   ?include_deprecated=true         include rows marked stale by last refresh sweep
http.route({
  path: "/v1/models",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const endpoint = url.searchParams.get("endpoint") ?? undefined;
    const ownedBy = url.searchParams.get("owned_by") ?? undefined;
    const includeDeprecated = url.searchParams.get("include_deprecated") === "true";

    const rows = await ctx.runQuery(internal.modelCatalog.list, {
      ...(endpoint ? { endpoint } : {}),
      ...(ownedBy ? { ownedBy } : {}),
      includeDeprecated,
    });
    const stats = await ctx.runQuery(internal.modelCatalog.stats, {});

    const data = rows.map((m: any) => ({
      id: m.id,
      object: "model",
      owned_by: m.ownedBy,
      via: m.via,
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
        note: "Live model catalog. Every entry is routable via /v1/chat/completions or /v1/embeddings. Refreshed every 6h from upstream provider /models endpoints. POST /v1/chat/completions with model=<id> to call any of these.",
        non_llm_apis: Object.keys(PROVIDERS).length + " managed providers (SMS, email, search, TTS, embeddings, code execution, scraping, and more)",
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
// through this endpoint. Three branches by authType:
//   "managed" → internal dispatch to existing /proxy/{providerName} adapter
//   "none"    → universal pass-through with SSRF guard + circuit breaker
//   else      → 400 discovery_only
// No BYOK. Ever.
// ==============================================

// SSRF guard: block private/loopback/link-local/metadata addresses.
function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h === "::1") return true;
  if (h === "169.254.169.254") return true; // AWS/GCP metadata
  if (h.endsWith(".internal") || h.endsWith(".local")) return true;
  // IPv4 private ranges
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
  }
  // IPv6 unique-local / link-local
  if (/^f[cd][0-9a-f]{2}:/.test(h) || /^fe[89ab][0-9a-f]:/.test(h)) return true;
  return false;
}

// Validate + build the final URL for an open-proxy call.
// Constraint: resolved URL's origin must match baseUrl's origin.
function buildOpenProxyURL(baseUrl: string, userPath: string, params?: Record<string, string>): URL | null {
  let base: URL;
  try { base = new URL(baseUrl); } catch { return null; }
  if (base.protocol !== "http:" && base.protocol !== "https:") return null;
  if (isPrivateHost(base.hostname)) return null;
  // Normalize path: always starts with /, never contains schema://
  const path = userPath.startsWith("/") ? userPath : "/" + userPath;
  if (path.startsWith("//") || /^[a-z]+:\/\//i.test(userPath)) return null;
  const merged = new URL(path, base.toString().replace(/\/$/, "") + "/");
  if (merged.origin !== base.origin) return null; // prevents // relative path escapes
  if (isPrivateHost(merged.hostname)) return null;
  // Append params
  if (params) {
    for (const [k, val] of Object.entries(params)) {
      if (typeof val === "string") merged.searchParams.set(k, val);
    }
  }
  return merged;
}

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
    try { body = await request.json(); }
    catch { return jsonResponse({ error: { code: "invalid_json", message: "Body must be JSON" } }, 400); }

    const apiName: string = typeof body?.api === "string" ? body.api.trim() : "";
    const userPath: string = typeof body?.path === "string" ? body.path : "/";
    const method: string = (body?.method ?? "GET").toString().toUpperCase();
    const params = body?.params && typeof body.params === "object" ? body.params : undefined;
    const userBody = body?.body;
    if (!apiName) {
      return jsonResponse({ error: { code: "missing_api", message: "Body must include { api: string }" } }, 400);
    }
    if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      return jsonResponse({ error: { code: "invalid_method", message: `Unsupported method ${method}` } }, 400);
    }

    // Internal-only provider gate. Same set as /proxy/* routes.
    if (
      INTERNAL_ONLY_PROVIDERS.has(apiName.toLowerCase()) &&
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
          },
          body: JSON.stringify({ path: userPath, method, params, body: userBody, ...userBody }),
          signal: AbortSignal.timeout(25000),
        });
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
      const baseUrl = row.baseUrl ?? row.docsUrl;
      if (!baseUrl) {
        return jsonResponse({ error: { code: "missing_base_url", message: `"${row.name}" has no baseUrl configured.` } }, 500);
      }
      const target = buildOpenProxyURL(baseUrl, userPath, params);
      if (!target) {
        return jsonResponse(
          { error: { code: "invalid_target", message: "Resolved URL failed SSRF/origin validation", baseUrl, path: userPath } },
          400
        );
      }

      // Content-type allowlist + size cap enforced in response handling.
      try {
        const fetchInit: RequestInit = {
          method,
          headers: {
            "User-Agent": "APIClaw/2.5 (+https://apiclaw.cloud)",
            Accept: "application/json, text/*, application/xml;q=0.9",
          },
          signal: AbortSignal.timeout(25000),
        };
        if (method !== "GET" && method !== "DELETE" && userBody !== undefined) {
          (fetchInit.headers as any)["Content-Type"] = "application/json";
          fetchInit.body = typeof userBody === "string" ? userBody : JSON.stringify(userBody);
        }
        const upstream = await fetch(target.toString(), fetchInit);

        // 10 MB response cap
        const reader = upstream.body?.getReader();
        const CAP = 10 * 1024 * 1024;
        const chunks: Uint8Array[] = [];
        let total = 0;
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > CAP) {
              await reader.cancel();
              await ctx.runMutation(api.pipelineAlign.reportFailure, { apiId: row.id, statusCode: 413 });
              return jsonResponse(
                { error: { code: "response_too_large", message: "Upstream exceeded 10 MB cap." } },
                413
              );
            }
            chunks.push(value);
          }
        }
        const buf = new Uint8Array(total);
        let off = 0; for (const c of chunks) { buf.set(c, off); off += c.byteLength; }

        const ok = upstream.status >= 200 && upstream.status < 500;
        if (ok) await ctx.runMutation(api.pipelineAlign.reportSuccess, { apiId: row.id });
        else await ctx.runMutation(api.pipelineAlign.reportFailure, { apiId: row.id, statusCode: upstream.status });

        try {
          await ctx.runMutation(api.analytics.log, {
            ...analyticsBase,
            provider: row.name,
            metadata: {
              route: "v1_call", mode: "open_proxy",
              method, target: target.origin + target.pathname,
              status: upstream.status, latencyMs: Date.now() - t0, bytes: total,
            },
          });
        } catch {}

        return new Response(buf, {
          status: upstream.status,
          headers: {
            ...corsHeaders,
            "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
            "X-APIClaw-Mode": "open_proxy",
            "X-APIClaw-Provider": row.name,
            "X-APIClaw-Upstream-Bytes": total.toString(),
          },
        });
      } catch (e: any) {
        await ctx.runMutation(api.pipelineAlign.reportFailure, { apiId: row.id, statusCode: 0 });
        const isTimeout = e?.name === "TimeoutError" || /timeout|abort/i.test(e?.message ?? "");
        return jsonResponse(
          {
            error: {
              code: isTimeout ? "upstream_timeout" : "upstream_error",
              message: e?.message ?? "upstream fetch failed",
              provider: row.name,
            },
          },
          isTimeout ? 504 : 502
        );
      }
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
  handler: httpAction(async (ctx, request) => {
    const auth = await resolveWorkspaceFromRequest(ctx, request);
    if (auth.authMethod === "anonymous" || !auth.workspaceId) {
      return unauthResponse("missions_require_auth");
    }
    let body: any;
    try {
      body = await request.json();
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
    const initiatorMap: Record<string, string> = {
      "api-key": "http",
      session: "cli",
      "mcp-oauth": "grok",
      identifier: "http",
    };
    const initiator = initiatorMap[auth.authMethod] ?? "http";

    try {
      const created: any = await ctx.runMutation(api.missions.createMission, {
        workspaceIdOverride: auth.workspaceId as any,
        template,
        templateVersion,
        params,
        initiator,
      });
      // Fire-and-forget execution; CLI/MCP poll status separately.
      ctx.runAction(api.missions.runMission, { missionId: created.missionId }).catch((e: any) => {
        console.error("[missions] runMission failed:", e?.message);
      });
      return jsonResponse(
        {
          missionId: created.missionId,
          status: created.status,
          isInternal: created.isInternal,
          poll: `/v1/missions/${created.missionId}`,
        },
        202
      );
    } catch (e: any) {
      const msg = e?.message ?? "create_failed";
      const code = msg.startsWith("unknown_template") ? 400 : 500;
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
    if (auth.authMethod === "anonymous" || !auth.workspaceId) {
      return unauthResponse("missions_require_auth");
    }
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 200);
    const rows = await ctx.runQuery(api.missions.listForWorkspace, {
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
    if (auth.authMethod === "anonymous" || !auth.workspaceId) {
      return unauthResponse("missions_require_auth");
    }
    const url = new URL(request.url);
    const tail = url.pathname.replace(/^\/v1\/missions\//, "").replace(/\/$/, "");
    if (!tail || tail === "templates" || tail === "start") {
      return jsonResponse({ error: { code: "not_found", message: "Unknown subpath" } }, 404);
    }
    const data = await ctx.runQuery(api.missions.getMission, { missionId: tail as any });
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
