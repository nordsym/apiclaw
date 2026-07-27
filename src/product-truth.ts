/**
 * Machine-readable APIClaw managed-usage policy.
 *
 * Keep this module dependency-free so the gateway, Convex functions, CLI,
 * website, tests, and lifecycle messages can all consume the same values.
 */
export const FREE_MANAGED_CALLS_LIFETIME = 25;
export const FREE_MANAGED_PROVIDER_COST_CAP_USD = 1;
export const PAYG_MARGIN_RATE = 0.15;
export const FREE_MANAGED_WARNING_AT = 20;

export const MANAGED_USAGE_POLICY = {
  freeManagedCallsLifetime: FREE_MANAGED_CALLS_LIFETIME,
  freeManagedProviderCostCapUsd: FREE_MANAGED_PROVIDER_COST_CAP_USD,
  freeManagedWarningAt: FREE_MANAGED_WARNING_AT,
  discoveryIsFree: true,
  keylessPublicExecutionAvailable: false,
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
    customerExecutableActions: [],
    description: "Managed LLM inference adapter. Customer execution awaits billing-grade cost truth.",
    category: "AI & ML",
    baseUrl: "https://api.groq.com",
    docsUrl: "https://console.groq.com/docs",
    pricing: "freemium",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    aliases: ["mistral", "mistral ai", "mistral api", "mistral ai api"],
    customerExecutableActions: [],
    description: "Managed Mistral model adapter. Customer execution awaits billing-grade cost truth.",
    category: "AI & ML",
    baseUrl: "https://api.mistral.ai",
    docsUrl: "https://docs.mistral.ai",
    pricing: "paid",
  },
  {
    id: "deepinfra",
    name: "DeepInfra",
    aliases: ["deepinfra", "deepinfra api"],
    customerExecutableActions: [],
    description: "Managed inference adapter. Customer execution awaits billing-grade cost truth.",
    category: "AI & ML",
    baseUrl: "https://api.deepinfra.com",
    docsUrl: "https://deepinfra.com/docs",
    pricing: "paid",
  },
  {
    id: "openai",
    name: "OpenAI",
    aliases: ["openai", "openai api"],
    customerExecutableActions: [],
    description: "Managed OpenAI adapter. Customer execution awaits billing-grade cost truth.",
    category: "AI & ML",
    baseUrl: "https://api.openai.com",
    docsUrl: "https://platform.openai.com/docs",
    pricing: "paid",
  },
  {
    id: "xai",
    name: "xAI",
    aliases: ["xai", "xai api", "x.ai", "x.ai api", "grok", "grok api"],
    customerExecutableActions: [],
    description: "Managed Grok model adapter. Customer execution awaits billing-grade cost truth.",
    category: "AI & ML",
    baseUrl: "https://api.x.ai",
    docsUrl: "https://docs.x.ai",
    pricing: "paid",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    aliases: ["anthropic", "anthropic api", "anthropic claude", "anthropic messages api"],
    customerExecutableActions: [],
    description: "Managed Claude adapter. Customer execution awaits billing-grade cost truth.",
    category: "AI & ML",
    baseUrl: "https://api.anthropic.com",
    docsUrl: "https://docs.anthropic.com",
    pricing: "paid",
  },
  {
    id: "cohere",
    name: "Cohere",
    aliases: ["cohere", "cohere api"],
    customerExecutableActions: [],
    description: "Managed language-model adapter. Customer execution awaits billing-grade cost truth.",
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
    customerExecutableActions: [],
    description: "Managed search adapter. Customer execution awaits billing-grade cost truth.",
    category: "Utilities",
    baseUrl: "https://google.serper.dev",
    docsUrl: "https://serper.dev",
    pricing: "freemium",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    aliases: ["elevenlabs", "elevenlabs api", "elevenlabs tts"],
    customerExecutableActions: [],
    description: "Managed voice adapter. Customer execution awaits billing-grade cost truth.",
    category: "AI & ML",
    baseUrl: "https://api.elevenlabs.io",
    docsUrl: "https://elevenlabs.io/docs",
    pricing: "freemium",
  },
  {
    id: "deepgram",
    name: "Deepgram",
    aliases: ["deepgram", "deepgram api"],
    customerExecutableActions: [],
    description: "Managed speech adapter. Customer execution awaits billing-grade cost truth.",
    category: "AI & ML",
    baseUrl: "https://api.deepgram.com",
    docsUrl: "https://developers.deepgram.com",
    pricing: "freemium",
  },
  {
    id: "assemblyai",
    name: "AssemblyAI",
    aliases: ["assemblyai", "assemblyai api"],
    customerExecutableActions: [],
    description: "Managed speech-intelligence adapter. Customer execution awaits billing-grade cost truth.",
    category: "AI & ML",
    baseUrl: "https://api.assemblyai.com",
    docsUrl: "https://www.assemblyai.com/docs",
    pricing: "freemium",
  },
  {
    id: "replicate",
    name: "Replicate",
    aliases: ["replicate", "replicate api"],
    customerExecutableActions: [],
    description: "Managed model-execution adapter. Customer execution awaits billing-grade cost truth.",
    category: "AI & ML",
    baseUrl: "https://api.replicate.com",
    docsUrl: "https://replicate.com/docs",
    pricing: "paid",
  },
  {
    id: "stability",
    name: "Stability AI",
    aliases: ["stability", "stability ai", "stability ai api"],
    customerExecutableActions: [],
    description: "Managed image-generation adapter. Customer execution awaits billing-grade cost truth.",
    category: "AI & ML",
    baseUrl: "https://api.stability.ai",
    docsUrl: "https://platform.stability.ai/docs",
    pricing: "paid",
  },
  {
    id: "firecrawl",
    name: "Firecrawl",
    aliases: ["firecrawl", "firecrawl api"],
    customerExecutableActions: [],
    description: "Managed web-extraction adapter. Customer execution awaits billing-grade cost truth.",
    category: "Utilities",
    baseUrl: "https://api.firecrawl.dev",
    docsUrl: "https://docs.firecrawl.dev",
    pricing: "freemium",
  },
  {
    id: "genprd",
    name: "GenPRD",
    aliases: ["genprd", "genprd api"],
    customerExecutableActions: [],
    description: "Managed product-requirements adapter. Customer execution awaits billing-grade cost truth.",
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
    customerExecutableActions: [],
    description: "Managed code-sandbox adapter. Customer execution awaits billing-grade cost truth.",
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
    customerExecutableActions: [],
    description: "Managed multi-API adapter inventory. Customer execution awaits billing-grade cost truth.",
    category: "Finance",
    baseUrl: "https://apilayer.com",
    docsUrl: "https://apilayer.com/docs",
    pricing: "freemium",
  },
  {
    id: "voyage",
    name: "Voyage AI",
    aliases: ["voyage", "voyage ai", "voyage api", "voyage ai api"],
    customerExecutableActions: [],
    description: "Managed embeddings adapter. Customer execution awaits billing-grade cost truth.",
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
  // The OpenAI-compatible endpoint names the same public OpenRouter chat rail
  // `chat_completions`. Keep the product-facing action canonical as `chat`
  // while authorizing both protocol spellings from this single source.
  const canonicalAction = provider?.id === "openrouter" && normalizedAction === "chat_completions"
    ? "chat"
    : normalizedAction;
  return provider?.customerExecutableActions.some(
    (candidate) => candidate === canonicalAction,
  ) ?? false;
}
