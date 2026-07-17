import { internalQuery } from "./_generated/server";
import { resolveManagedCredential } from "./managedCredentials";

type ProviderDefinition = {
  id: string;
  surface: "llm" | "execute" | "embeddings" | "internal";
  credentialConfigured: () => boolean;
};

const PROVIDERS: ProviderDefinition[] = [
  { id: "openrouter", surface: "llm", credentialConfigured: () => Boolean(process.env.OPENROUTER_API_KEY) },
  { id: "groq", surface: "llm", credentialConfigured: () => Boolean(process.env.GROQ_API_KEY) },
  { id: "mistral", surface: "llm", credentialConfigured: () => Boolean(process.env.MISTRAL_API_KEY) },
  { id: "together", surface: "llm", credentialConfigured: () => Boolean(process.env.TOGETHER_API_KEY) },
  { id: "deepinfra", surface: "llm", credentialConfigured: () => Boolean(process.env.DEEPINFRA_API_KEY) },
  { id: "openai", surface: "llm", credentialConfigured: () => Boolean(process.env.OPENAI_API_KEY) },
  { id: "xai", surface: "llm", credentialConfigured: () => Boolean(process.env.XAI_API_KEY) },
  { id: "anthropic", surface: "llm", credentialConfigured: () => Boolean(process.env.ANTHROPIC_API_KEY) },
  { id: "cohere", surface: "execute", credentialConfigured: () => Boolean(process.env.COHERE_API_KEY) },
  { id: "46elks", surface: "internal", credentialConfigured: () => Boolean(resolveManagedCredential("46elks", "ELKS_API_KEY", process.env)) },
  { id: "twilio", surface: "internal", credentialConfigured: () => Boolean(resolveManagedCredential("twilio", "TWILIO_AUTH_TOKEN", process.env)) },
  { id: "resend", surface: "internal", credentialConfigured: () => Boolean(process.env.RESEND_API_KEY) },
  { id: "brave_search", surface: "execute", credentialConfigured: () => Boolean(process.env.BRAVE_API_KEY) },
  { id: "serper", surface: "execute", credentialConfigured: () => Boolean(process.env.SERPER_API_KEY) },
  { id: "elevenlabs", surface: "execute", credentialConfigured: () => Boolean(process.env.ELEVENLABS_API_KEY) },
  { id: "deepgram", surface: "execute", credentialConfigured: () => Boolean(process.env.DEEPGRAM_API_KEY) },
  { id: "assemblyai", surface: "execute", credentialConfigured: () => Boolean(process.env.ASSEMBLYAI_API_KEY) },
  { id: "replicate", surface: "execute", credentialConfigured: () => Boolean(process.env.REPLICATE_API_TOKEN) },
  { id: "stability", surface: "execute", credentialConfigured: () => Boolean(process.env.STABILITY_API_KEY) },
  { id: "firecrawl", surface: "execute", credentialConfigured: () => Boolean(process.env.FIRECRAWL_API_KEY) },
  { id: "genprd", surface: "execute", credentialConfigured: () => Boolean(process.env.GENPRD_API_KEY) },
  { id: "github", surface: "execute", credentialConfigured: () => Boolean(process.env.GITHUB_TOKEN) },
  { id: "e2b", surface: "execute", credentialConfigured: () => Boolean(process.env.E2B_API_KEY) },
  { id: "nasa", surface: "execute", credentialConfigured: () => Boolean(process.env.NASA_API_KEY) },
  { id: "apilayer", surface: "execute", credentialConfigured: () => Boolean(process.env.APILAYER_API_KEY) },
  { id: "voyage", surface: "embeddings", credentialConfigured: () => Boolean(process.env.VOYAGE_API_KEY) },
];

const EXECUTE_ADAPTERS = new Set([
  "cohere", "46elks", "twilio", "resend", "brave_search", "serper",
  "elevenlabs", "deepgram", "assemblyai", "replicate", "stability",
  "firecrawl", "genprd", "github", "e2b", "nasa", "apilayer",
  "openrouter", "groq", "mistral", "together", "deepinfra", "openai",
  "xai", "anthropic",
]);

function keyState(value: string | undefined): "missing" | "sentinel" | "encrypted" | "unsafe_shape" {
  if (!value || /^YOUR_/i.test(value) || /^_+$/.test(value) || /^:+$/.test(value)) return "missing";
  if (value === "managed-by-apiclaw") return "sentinel";
  const parts = value.split(":");
  if (parts.length === 3 && parts.every((part) => part.length > 0 && /^[0-9a-f]+$/i.test(part))) {
    return "encrypted";
  }
  return "unsafe_shape";
}

const PROVIDER_HOST_ROOTS: Array<[string, string[]]> = [
  ["46elks", ["api.46elks.com"]],
  ["twilio", ["api.twilio.com"]],
  ["resend", ["api.resend.com"]],
  ["brave_search", ["api.search.brave.com"]],
  ["openrouter", ["openrouter.ai"]],
  ["elevenlabs", ["api.elevenlabs.io"]],
  ["replicate", ["api.replicate.com"]],
  ["firecrawl", ["api.firecrawl.dev"]],
  ["e2b", ["api.e2b.dev"]],
  ["github", ["api.github.com"]],
  ["groq", ["api.groq.com"]],
  ["deepgram", ["api.deepgram.com"]],
  ["mistral", ["api.mistral.ai"]],
  ["together", ["api.together.xyz"]],
  ["assemblyai", ["api.assemblyai.com"]],
  ["serper", ["google.serper.dev"]],
  ["cohere", ["api.cohere.com"]],
  ["stability", ["api.stability.ai"]],
  ["nasa", ["api.nasa.gov"]],
  ["genprd", ["genprd.se"]],
  ["apilayer", [
    "api.apilayer.com", "apilayer.net", "marketstack.com", "aviationstack.com",
    "pdflayer.com", "fixer.io", "currencylayer.com", "coinlayer.com",
    "exchangerate.host", "weatherstack.com", "ipstack.com", "ipapi.com",
    "positionstack.com", "languagelayer.com", "scrapestack.com", "serpstack.com",
    "mediastack.com", "userstack.com",
  ]],
];

function hostMatchesRoot(host: string, root: string): boolean {
  return host === root || host.endsWith(`.${root}`);
}

function providerIdForBaseUrl(baseUrl: string): string | null {
  let host = "";
  try { host = new URL(baseUrl).hostname.toLowerCase(); } catch { return null; }
  for (const [providerId, roots] of PROVIDER_HOST_ROOTS) {
    if (roots.some((root) => hostMatchesRoot(host, root))) return providerId;
  }
  return null;
}

export const snapshot = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [routingRows, actions, healthRows, models] = await Promise.all([
      ctx.db.query("providerDirectCall").collect(),
      ctx.db.query("providerActions").collect(),
      ctx.db.query("providerHealth").collect(),
      ctx.db.query("modelCatalog").collect(),
    ]);

    const actionsByRoute = new Map<string, number>();
    for (const action of actions) {
      if (!action.enabled) continue;
      const routeId = String(action.directCallId);
      actionsByRoute.set(routeId, (actionsByRoute.get(routeId) ?? 0) + 1);
    }

    const routingByProvider = new Map<string, { liveRoutes: number; actions: number; keyStates: Record<string, number> }>();
    let unmappedLiveRoutes = 0;
    for (const row of routingRows) {
      const providerId = providerIdForBaseUrl(row.baseUrl);
      if (!providerId) {
        if (row.status === "live") unmappedLiveRoutes += 1;
        continue;
      }
      const current = routingByProvider.get(providerId) ?? { liveRoutes: 0, actions: 0, keyStates: {} };
      if (row.status === "live") current.liveRoutes += 1;
      current.actions += actionsByRoute.get(String(row._id)) ?? 0;
      const state = keyState(row.encryptedMasterKey);
      current.keyStates[state] = (current.keyStates[state] ?? 0) + 1;
      routingByProvider.set(providerId, current);
    }

    const healthByProvider = new Map(healthRows.map((row) => [row.providerId, row]));
    const modelCounts = new Map<string, number>();
    for (const model of models) {
      if (model.deprecated) continue;
      const source = model.source.replace(/-hardcoded$/, "");
      modelCounts.set(source, (modelCounts.get(source) ?? 0) + 1);
    }

    return {
      generatedAt: Date.now(),
      minimumCallsForHealthVerdict: 5,
      maximumHealthAgeMs: 6 * 60 * 60 * 1000,
      unmappedLiveRoutes,
      providers: PROVIDERS.map((definition) => {
        const routing = routingByProvider.get(definition.id);
        const health = healthByProvider.get(definition.id);
        return {
          id: definition.id,
          surface: definition.surface,
          credentialConfigured: definition.credentialConfigured(),
          adapterRegistered: definition.surface === "llm" || definition.surface === "embeddings" || EXECUTE_ADAPTERS.has(definition.id),
          liveRouteCount: routing?.liveRoutes ?? 0,
          enabledActionCount: routing?.actions ?? 0,
          keyStates: routing?.keyStates ?? {},
          modelCount: modelCounts.get(definition.id) ?? 0,
          passiveHealth: health ? {
            callCount: health.callCount,
            successRate: health.successRate,
            p50LatencyMs: health.p50LatencyMs,
            windowDays: health.windowDays,
            computedAt: health.computedAt,
          } : null,
        };
      }),
    };
  },
});
