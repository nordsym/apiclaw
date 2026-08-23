/**
 * Machine-readable APIClaw managed-usage policy.
 *
 * Keep this module dependency-free so the gateway, Convex functions, CLI,
 * website, tests, and lifecycle messages can all consume the same values.
 */
// Deprecated 2026-08-23: the 25-lifetime-call / $1-cap activation allowance
// no longer gates access. A call with provably zero provider cost is free
// forever and uncapped (see FREE_FOREVER_ZERO_COST); a call with real cost
// requires a card (see PAID_CALL_REQUIRES_CARD). These two constants are
// kept exported, unchanged, so older callers/tests/generated mirrors that
// still import them do not break; do not use them to gate new behavior.
export const FREE_MANAGED_CALLS_LIFETIME = 25;
export const FREE_MANAGED_PROVIDER_COST_CAP_USD = 1;
export const PAYG_MARGIN_RATE = 0.15;
export const FREE_MANAGED_WARNING_AT = 20;

// Current policy flags (2026-08-23 pricing gate migration).
export const FREE_FOREVER_ZERO_COST = true;
export const PAID_CALL_REQUIRES_CARD = true;

export const MANAGED_USAGE_POLICY = {
  freeManagedCallsLifetime: FREE_MANAGED_CALLS_LIFETIME,
  freeManagedProviderCostCapUsd: FREE_MANAGED_PROVIDER_COST_CAP_USD,
  freeManagedWarningAt: FREE_MANAGED_WARNING_AT,
  freeForeverZeroCost: FREE_FOREVER_ZERO_COST,
  paidCallRequiresCard: PAID_CALL_REQUIRES_CARD,
  discoveryIsFree: true,
  keylessPublicExecutionAvailable: false,
  workspaceAuthenticatedPublicExecutionAvailable: true,
  paygMarginRate: PAYG_MARGIN_RATE,
  paygPriceBasis: "provider_cost",
  paygRequiresBillingGradeAdapter: true,
} as const;

/**
 * The managed-adapter inventory and the customer execution surface are
 * deliberately different things. A credential being configured proves that
 * APIClaw has an adapter, not that the adapter can safely meter a customer
 * call. Only providers and actions listed here may be presented as callable
 * now.
 *
 * Keep this data dependency-free. It is consumed by the MCP server, CLI,
 * public catalog, and release-truth tests.
 */
export type ManagedProviderAdapter = {
  id: string;
  name: string;
  aliases: readonly string[];
  customerExecutableActions: readonly string[];
  description: string;
  category: string;
  baseUrl: string;
  docsUrl: string;
  pricing: "free" | "freemium" | "paid";
};

/**
 * Contracted APILayer/Idera actions that already have a live execute handler
 * and a verified HTTPS origin. Subscription-blocked and paid-plan-only
 * actions stay off this list even when a handler exists.
 */
export const APILAYER_CUSTOMER_EXECUTABLE_ACTIONS = [
  "exchange_rates",
  "market_data",
  "aviation",
  "pdf_generate",
  "screenshot",
  "verify_email",
  "finance_news",
  "scrape",
  "vat_check",
  "currencylayer_live",
  "currencylayer_convert",
  "coinlayer_live",
  "exchangeratehost_latest",
  "weatherstack_current",
  "weatherstack_forecast",
  "ipstack_lookup",
  "ipapi_lookup",
  "positionstack_forward",
  "positionstack_reverse",
  "languagelayer_detect",
  "scrapestack_scrape",
  "serpstack_search",
  "mediastack_news",
  "userstack_detect",
  "fixer_latest",
] as const;

export const APILAYER_SUBSCRIPTION_BLOCKED_ACTIONS = [
  "verify_number",
  "world_news",
  "image_crop",
  "form_submit",
] as const;

export const APILAYER_PAID_PLAN_ONLY_ACTIONS = [
  "fixer_convert",
] as const;

export const PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_SUMMARY =
  "22 managed provider rails plus workspace-authenticated public/no-key HTTPS origins";

export const MANAGED_PROVIDER_ADAPTERS = [
  {
    id: "openrouter",
    name: "OpenRouter",
    aliases: ["openrouter", "openrouter api"],
    customerExecutableActions: ["chat"],
    description: "LLM chat adapter with exact provider-reported usage metering through APIClaw.",
    category: "AI & ML",
    baseUrl: "https://openrouter.ai",
    docsUrl: "https://openrouter.ai/docs",
    pricing: "paid",
  },
  {
    id: "groq",
    name: "Groq",
    aliases: ["groq", "groq api"],
    customerExecutableActions: ["chat"],
    description: "Managed Groq chat adapter. Reservation is the billing-grade realized cost.",
    category: "AI & ML",
    baseUrl: "https://api.groq.com",
    docsUrl: "https://console.groq.com/docs",
    pricing: "freemium",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    aliases: ["mistral", "mistral ai", "mistral api", "mistral ai api"],
    customerExecutableActions: ["chat"],
    description: "Managed Mistral chat adapter. Reservation is the billing-grade realized cost.",
    category: "AI & ML",
    baseUrl: "https://api.mistral.ai",
    docsUrl: "https://docs.mistral.ai",
    pricing: "paid",
  },
  {
    id: "deepinfra",
    name: "DeepInfra",
    aliases: ["deepinfra", "deepinfra api"],
    customerExecutableActions: ["chat"],
    description: "Managed DeepInfra chat adapter. Reservation is the billing-grade realized cost.",
    category: "AI & ML",
    baseUrl: "https://api.deepinfra.com",
    docsUrl: "https://deepinfra.com/docs",
    pricing: "paid",
  },
  {
    id: "openai",
    name: "OpenAI",
    aliases: ["openai", "openai api"],
    customerExecutableActions: ["chat"],
    description: "Managed OpenAI chat adapter. Reservation is the billing-grade realized cost.",
    category: "AI & ML",
    baseUrl: "https://api.openai.com",
    docsUrl: "https://platform.openai.com/docs",
    pricing: "paid",
  },
  {
    id: "xai",
    name: "xAI",
    aliases: ["xai", "xai api", "x.ai", "x.ai api", "grok", "grok api"],
    customerExecutableActions: ["chat"],
    description: "Managed xAI Grok chat adapter. Reservation is the billing-grade realized cost.",
    category: "AI & ML",
    baseUrl: "https://api.x.ai",
    docsUrl: "https://docs.x.ai",
    pricing: "paid",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    aliases: ["anthropic", "anthropic api", "anthropic claude", "anthropic messages api"],
    customerExecutableActions: ["chat", "messages"],
    description: "Managed Anthropic Claude chat adapter. Reservation is the billing-grade realized cost.",
    category: "AI & ML",
    baseUrl: "https://api.anthropic.com",
    docsUrl: "https://docs.anthropic.com",
    pricing: "paid",
  },
  {
    id: "cohere",
    name: "Cohere",
    aliases: ["cohere", "cohere api"],
    customerExecutableActions: ["chat", "rerank"],
    description: "Managed Cohere chat and rerank adapter. Reservation is the billing-grade realized cost.",
    category: "AI & ML",
    baseUrl: "https://api.cohere.ai",
    docsUrl: "https://docs.cohere.com",
    pricing: "freemium",
  },
  {
    id: "brave_search",
    name: "Brave Search",
    aliases: ["brave_search", "brave search", "brave search ai"],
    customerExecutableActions: ["search"],
    description: "Privacy-focused web search with a fixed, billing-grade per-call cost.",
    category: "Utilities",
    baseUrl: "https://api.search.brave.com",
    docsUrl: "https://brave.com/search/api/",
    pricing: "freemium",
  },
  {
    id: "serper",
    name: "Serper",
    aliases: ["serper", "serper api"],
    customerExecutableActions: ["search"],
    description: "Managed Google SERP search. The existing per-call reservation is the billing-grade realized cost.",
    category: "Utilities",
    baseUrl: "https://google.serper.dev",
    docsUrl: "https://serper.dev",
    pricing: "freemium",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    aliases: ["elevenlabs", "elevenlabs api", "elevenlabs tts"],
    customerExecutableActions: ["text_to_speech"],
    description: "Managed ElevenLabs text-to-speech. Reservation is the billing-grade realized cost.",
    category: "AI & ML",
    baseUrl: "https://api.elevenlabs.io",
    docsUrl: "https://elevenlabs.io/docs",
    pricing: "freemium",
  },
  {
    id: "deepgram",
    name: "Deepgram",
    aliases: ["deepgram", "deepgram api"],
    customerExecutableActions: ["transcribe"],
    description: "Managed Deepgram transcription. Reservation is the billing-grade realized cost.",
    category: "AI & ML",
    baseUrl: "https://api.deepgram.com",
    docsUrl: "https://developers.deepgram.com",
    pricing: "freemium",
  },
  {
    id: "assemblyai",
    name: "AssemblyAI",
    aliases: ["assemblyai", "assemblyai api"],
    customerExecutableActions: ["transcribe"],
    description: "Managed AssemblyAI transcription. Reservation is the billing-grade realized cost.",
    category: "AI & ML",
    baseUrl: "https://api.assemblyai.com",
    docsUrl: "https://www.assemblyai.com/docs",
    pricing: "freemium",
  },
  {
    id: "replicate",
    name: "Replicate",
    aliases: ["replicate", "replicate api"],
    customerExecutableActions: ["run"],
    description: "Managed Replicate predictions. Reservation is the billing-grade realized cost.",
    category: "AI & ML",
    baseUrl: "https://api.replicate.com",
    docsUrl: "https://replicate.com/docs",
    pricing: "paid",
  },
  {
    id: "stability",
    name: "Stability AI",
    aliases: ["stability", "stability ai", "stability ai api"],
    customerExecutableActions: ["generate"],
    description: "Managed Stability image generation. Reservation is the billing-grade realized cost.",
    category: "AI & ML",
    baseUrl: "https://api.stability.ai",
    docsUrl: "https://platform.stability.ai/docs",
    pricing: "paid",
  },
  {
    id: "firecrawl",
    name: "Firecrawl",
    aliases: ["firecrawl", "firecrawl api"],
    customerExecutableActions: ["scrape", "crawl", "map"],
    description: "Managed Firecrawl scrape, crawl, and map. Reservation is the billing-grade realized cost.",
    category: "Utilities",
    baseUrl: "https://api.firecrawl.dev",
    docsUrl: "https://docs.firecrawl.dev",
    pricing: "freemium",
  },
  {
    id: "genprd",
    name: "GenPRD",
    aliases: ["genprd", "genprd api"],
    customerExecutableActions: ["generate_prd"],
    description: "Managed GenPRD generation. Reservation is the billing-grade realized cost.",
    category: "Business",
    baseUrl: "https://genprd.se",
    docsUrl: "https://genprd.se",
    pricing: "paid",
  },
  {
    id: "github",
    name: "GitHub",
    aliases: ["github", "github api"],
    customerExecutableActions: ["search_repos", "get_repo", "get_file"],
    description: "Public repository search and read-only repository data. Private data and writes are not enabled.",
    category: "Development",
    baseUrl: "https://api.github.com",
    docsUrl: "https://docs.github.com/rest",
    pricing: "free",
  },
  {
    id: "e2b",
    name: "E2B",
    aliases: ["e2b", "e2b api"],
    customerExecutableActions: ["run_code"],
    description: "Managed E2B code sandbox. Reservation is the billing-grade realized cost.",
    category: "Development",
    baseUrl: "https://api.e2b.dev",
    docsUrl: "https://e2b.dev/docs",
    pricing: "freemium",
  },
  {
    id: "nasa",
    name: "NASA",
    aliases: ["nasa", "nasa api", "nasa open data"],
    customerExecutableActions: [
      "apod",
      "neo_feed",
      "neo_lookup",
      "epic",
      "epic_date",
      "mars_weather",
      "earth_imagery",
      "earth_assets",
      "donki_notifications",
      "call",
    ],
    description: "Read-only NASA open-data APIs with the upstream key injected by APIClaw.",
    category: "Government & Public Data",
    baseUrl: "https://api.nasa.gov",
    docsUrl: "https://api.nasa.gov/",
    pricing: "free",
  },
  {
    id: "apilayer",
    name: "APILayer",
    aliases: ["apilayer", "apilayer api"],
    customerExecutableActions: APILAYER_CUSTOMER_EXECUTABLE_ACTIONS,
    description: "Contracted APILayer/Idera HTTPS rails: exchange rates, marketstack, aviationstack, pdflayer, screenshotlayer, email verification, finance news, scraper, vatlayer, currencylayer, coinlayer, exchangerate.host, weatherstack, ipstack, ipapi, positionstack, languagelayer, scrapestack, serpstack, mediastack, userstack, and fixer (EUR base). Subscription-blocked and paid-plan-only actions stay inventory-only.",
    category: "Finance",
    baseUrl: "https://apilayer.com",
    docsUrl: "https://apilayer.com/docs",
    pricing: "freemium",
  },
  {
    id: "voyage",
    name: "Voyage AI",
    aliases: ["voyage", "voyage ai", "voyage api", "voyage ai api"],
    customerExecutableActions: ["embeddings"],
    description: "Managed Voyage embeddings. Reservation is the billing-grade realized cost.",
    category: "AI & ML",
    baseUrl: "https://api.voyageai.com",
    docsUrl: "https://docs.voyageai.com",
    pricing: "paid",
  },
] as const satisfies readonly ManagedProviderAdapter[];

export const MANAGED_PROVIDER_ADAPTER_COUNT = MANAGED_PROVIDER_ADAPTERS.length;

export const PUBLIC_CUSTOMER_EXECUTABLE_PROVIDERS =
  MANAGED_PROVIDER_ADAPTERS.filter(
    (provider) => provider.customerExecutableActions.length > 0,
  );

export const PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT =
  PUBLIC_CUSTOMER_EXECUTABLE_PROVIDERS.length;

function normalizeProviderReference(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function getManagedProviderAdapter(
  reference: string | undefined,
): (typeof MANAGED_PROVIDER_ADAPTERS)[number] | undefined {
  if (!reference) return undefined;
  const normalized = normalizeProviderReference(reference);
  return MANAGED_PROVIDER_ADAPTERS.find((provider) =>
    provider.aliases.some((alias) => normalizeProviderReference(alias) === normalized),
  );
}

export function getPublicCustomerExecutableProvider(
  reference: string | undefined,
): (typeof PUBLIC_CUSTOMER_EXECUTABLE_PROVIDERS)[number] | undefined {
  const provider = getManagedProviderAdapter(reference);
  return provider?.customerExecutableActions.length ? provider : undefined;
}

export function isPublicCustomerExecutableAction(
  providerReference: string | undefined,
  action: string | undefined,
): boolean {
  if (!action) return false;
  const provider = getPublicCustomerExecutableProvider(providerReference);
  const normalizedAction = action.trim().toLowerCase();
  // OpenAI-compatible callers name the same chat rail `chat_completions`.
  // Anthropic callers may send `messages`. Keep product-facing actions
  // canonical while authorizing both protocol spellings.
  const llmChatProviders = new Set([
    "openrouter", "groq", "mistral", "deepinfra", "openai", "xai", "anthropic", "cohere",
  ]);
  const canonicalAction = llmChatProviders.has(provider?.id ?? "") &&
    (normalizedAction === "chat_completions" || normalizedAction === "messages")
    ? (provider?.id === "anthropic" && normalizedAction === "messages" ? "messages" : "chat")
    : normalizedAction;
  return provider?.customerExecutableActions.some(
    (candidate) => candidate === canonicalAction,
  ) ?? false;
}
