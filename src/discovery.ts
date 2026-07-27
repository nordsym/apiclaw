// Discovery engine for APIvault
// MVP: Keyword matching. Future: Embeddings + semantic search

import { APIProvider, SearchResult, APIDetailsResponse } from './types.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getConnectedProviders } from './execute.js';
import { openAPIs, isOpenAPI } from './open-apis.js';
import { isInternalProviderReference, isUnavailableManagedProvider } from './provider-boundaries.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadLocalRegistry(): APIProvider[] {
  try {
    const apisData = JSON.parse(
      readFileSync(join(__dirname, 'registry', 'apis.json'), 'utf-8')
    ) as { apis?: APIProvider[] };
    return Array.isArray(apisData.apis)
      ? apisData.apis
        .filter((entry) =>
          !isInternalProviderReference(entry) &&
          ![
            entry.id,
            entry.name,
            entry.base_url,
            entry.docs_url,
            (entry as APIProvider & { baseUrl?: string }).baseUrl,
            (entry as APIProvider & { docsUrl?: string }).docsUrl,
          ].some((value) => isUnavailableManagedProvider(value))
        )
        // The registry records whether the upstream API responded during
        // verification, not whether APIClaw can safely proxy it today. Local
        // registry entries remain discovery-only until hardened egress is live.
        .map((entry) => ({ ...entry, callable: false }))
      : [];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw error;
    // The full registry is intentionally excluded from npm packages. MCP
    // discovery delegates to /v1/discover; this empty array is its offline,
    // fail-safe fallback and must not prevent the server from starting.
    return [];
  }
}

const apis: APIProvider[] = loadLocalRegistry();

// ─────────────────────────────────────────────────────────────────────────────
// Provider health cache
//
// Discovery applies a live success-rate multiplier on top of the static
// relevance score so providers that have been dropping calls or running slow
// in the last 30 days slide down in results without us having to touch the
// registry. The cache is populated from the Convex providerHealth table on
// module load and refreshed in the background; lookups are synchronous so
// discoverAPIs can stay a sync function.
// ─────────────────────────────────────────────────────────────────────────────

const CONVEX_URL_HEALTH =
  process.env.CONVEX_URL || 'https://adventurous-avocet-799.convex.cloud';
const HEALTH_REFRESH_MS = 15 * 60 * 1000;

interface ProviderHealthEntry {
  successRate: number;
  p50LatencyMs: number;
  callCount: number;
}

let healthCache = new Map<string, ProviderHealthEntry>();
let healthMinCalls = 5;
let healthFetchedAt = 0;
let healthInflight = false;

async function refreshHealthCache(): Promise<void> {
  if (healthInflight) return;
  healthInflight = true;
  try {
    const res = await fetch(`${CONVEX_URL_HEALTH}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'providerHealth:getAllPublic', args: {} }),
    });
    if (!res.ok) return;
    const payload = (await res.json()) as {
      status?: string;
      value?: {
        minCallsForScore: number;
        providers: Array<{
          providerId: string;
          successRate: number;
          p50LatencyMs: number;
          callCount: number;
        }>;
      };
    };
    const value = payload.value;
    if (!value || !Array.isArray(value.providers)) return;
    const next = new Map<string, ProviderHealthEntry>();
    for (const p of value.providers) {
      next.set(p.providerId, {
        successRate: p.successRate,
        p50LatencyMs: p.p50LatencyMs,
        callCount: p.callCount,
      });
    }
    healthCache = next;
    healthMinCalls = value.minCallsForScore ?? 5;
    healthFetchedAt = Date.now();
  } catch {
    // Network failure: keep prior cache. Discovery still works, multiplier
    // just stays stale.
  } finally {
    healthInflight = false;
  }
}

// Kick off a non-blocking initial fetch on module load. Discovery calls that
// arrive before this resolves see an empty cache and skip the multiplier
// (cold-start safe).
refreshHealthCache().catch(() => {});
if (typeof setInterval === 'function') {
  const t = setInterval(() => {
    refreshHealthCache().catch(() => {});
  }, HEALTH_REFRESH_MS);
  if (typeof (t as any).unref === 'function') (t as any).unref();
}

// ─────────────────────────────────────────────────────────────────────────────
// Managed-provider catalogue cache
//
// providerAPIs rows describing managed providers (GenPRD, the APILayer
// stack, etc.) live in Convex and are invisible to the local apis.json
// scanner. Without this cache, discover_apis would skip them entirely —
// agents searching "generate PRD" would not see GenPRD even though it's
// callable through the managed-routing path.
//
// Same refresh pattern as the providerHealth cache: a non-blocking
// initial fetch on module load + a 15-minute interval. Empty cache
// during cold start means managed providers simply don't surface yet;
// safe, never crashes.
// ─────────────────────────────────────────────────────────────────────────────

interface ManagedProviderEntry {
  providerName: string;
  description: string;
  category: string;
  docsUrl: string;
  baseUrl: string;
}

let managedProvidersCache: ManagedProviderEntry[] = [];
let managedProvidersFetchedAt = 0;
let managedProvidersInflight = false;

async function refreshManagedProvidersCache(): Promise<void> {
  if (managedProvidersInflight) return;
  managedProvidersInflight = true;
  try {
    const res = await fetch(`${CONVEX_URL_HEALTH}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'providerDiscovery:listForDiscovery', args: {} }),
    });
    if (!res.ok) return;
    const payload = (await res.json()) as {
      status?: string;
      value?: ManagedProviderEntry[];
    };
    if (!Array.isArray(payload.value)) return;
    managedProvidersCache = payload.value.filter((entry) =>
      !isUnavailableManagedProvider(entry.providerName) &&
      !isInternalProviderReference({
        name: entry.providerName,
        baseUrl: entry.baseUrl,
        docsUrl: entry.docsUrl,
      })
    );
    managedProvidersFetchedAt = Date.now();
  } catch {
    // Network failure: keep prior cache. Discovery still works against
    // apis.json; managed providers just stay stale.
  } finally {
    managedProvidersInflight = false;
  }
}

refreshManagedProvidersCache().catch(() => {});
if (typeof setInterval === 'function') {
  const t = setInterval(() => {
    refreshManagedProvidersCache().catch(() => {});
  }, HEALTH_REFRESH_MS);
  if (typeof (t as any).unref === 'function') (t as any).unref();
}

/**
 * Returns a multiplier in the range [0.5, 1.0] applied to relevance scores.
 *
 *   ≥ minCalls observations:  0.5 + 0.5 × successRate
 *      → 100 % success → 1.00  (no change)
 *      →  80 % success → 0.90
 *      →  50 % success → 0.75
 *      →   0 % success → 0.50  (heavy down-rank)
 *
 *   <  minCalls observations: 1.0  (cold-start; not enough signal yet)
 *
 * Latency penalty is layered on top: providers with p50 > 2 s lose another
 * 10 % so a fast-but-flaky API still beats a slow-and-flaky one.
 */
function healthMultiplier(providerId: string): number {
  const h = healthCache.get(providerId);
  if (!h || h.callCount < healthMinCalls) return 1.0;
  const successComponent = 0.5 + 0.5 * Math.max(0, Math.min(1, h.successRate));
  const latencyPenalty = h.p50LatencyMs > 2000 ? 0.9 : 1.0;
  return successComponent * latencyPenalty;
}

// Managed-provider specs (hardcoded handlers + params). Renamed from
// DIRECT_CALL_SPECS to align with the 2026-04-15 canon refresh that
// retired the "Direct Call tier" label in favour of Discovery / Callable
// (Open + Managed). Adapter-providers we hold the key for live here.
// Ordered: AI-first (models, LLM routing, audio), then infrastructure
// (code, web, search, email, SMS).
const MANAGED_PROVIDER_SPECS: Record<string, {
  description: string;
  auth: string;
  docs: string;
  actions: Record<string, { params: { name: string; required: boolean; desc: string }[]; desc: string }>;
}> = {
  openrouter: {
    description: 'LLM routing (100+ models)',
    auth: 'bearer',
    docs: 'https://openrouter.ai/docs',
    actions: {
      chat: {
        desc: 'Chat completion',
        params: [
          { name: 'messages', required: true, desc: 'Array of {role, content}' },
          { name: 'model', required: false, desc: 'Model ID (default: claude-3-haiku)' },
          { name: 'max_tokens', required: false, desc: 'Max response tokens (default: 1000)' },
        ],
      },
    },
  },
  replicate: {
    description: 'Run any AI model (images, video, audio)',
    auth: 'bearer',
    docs: 'https://replicate.com/docs',
    actions: {
      run: {
        desc: 'Run a model',
        params: [
          { name: 'model', required: true, desc: 'Model ID (e.g., stability-ai/sdxl:...)' },
          { name: 'input', required: true, desc: 'Model input parameters' },
        ],
      },
      list_models: {
        desc: 'List available models',
        params: [],
      },
    },
  },
  elevenlabs: {
    description: 'Text-to-speech',
    auth: 'api_key',
    docs: 'https://elevenlabs.io/docs',
    actions: {
      text_to_speech: {
        desc: 'Generate audio from text',
        params: [
          { name: 'text', required: true, desc: 'Text to speak' },
          { name: 'voice_id', required: false, desc: 'Voice ID (default: Rachel)' },
          { name: 'model_id', required: false, desc: 'Model ID' },
        ],
      },
    },
  },
  e2b: {
    description: 'Code sandbox for AI agents',
    auth: 'api_key',
    docs: 'https://e2b.dev/docs',
    actions: {
      run_code: {
        desc: 'Execute code in sandbox',
        params: [
          { name: 'code', required: true, desc: 'Code to run' },
          { name: 'language', required: false, desc: 'Language (default: python)' },
        ],
      },
      run_shell: {
        desc: 'Execute shell command',
        params: [
          { name: 'command', required: true, desc: 'Shell command' },
        ],
      },
    },
  },
  firecrawl: {
    description: 'Web scraping and crawling',
    auth: 'bearer',
    docs: 'https://firecrawl.dev/docs',
    actions: {
      scrape: {
        desc: 'Scrape a URL',
        params: [
          { name: 'url', required: true, desc: 'URL to scrape' },
          { name: 'formats', required: false, desc: 'Output formats (default: ["markdown"])' },
        ],
      },
      crawl: {
        desc: 'Start a crawl job',
        params: [
          { name: 'url', required: true, desc: 'Starting URL' },
          { name: 'limit', required: false, desc: 'Max pages (default: 10)' },
        ],
      },
      map: {
        desc: 'Map site structure',
        params: [
          { name: 'url', required: true, desc: 'URL to map' },
        ],
      },
    },
  },
  github: {
    description: 'Code repos and developer data',
    auth: 'bearer',
    docs: 'https://docs.github.com/rest',
    actions: {
      search_repos: {
        desc: 'Search repositories',
        params: [
          { name: 'query', required: true, desc: 'Search query' },
          { name: 'sort', required: false, desc: 'Sort by (default: stars)' },
          { name: 'limit', required: false, desc: 'Max results (default: 10)' },
        ],
      },
      get_repo: {
        desc: 'Get repo details',
        params: [
          { name: 'owner', required: true, desc: 'Repo owner' },
          { name: 'repo', required: true, desc: 'Repo name' },
        ],
      },
      list_issues: {
        desc: 'List issues',
        params: [
          { name: 'owner', required: true, desc: 'Repo owner' },
          { name: 'repo', required: true, desc: 'Repo name' },
          { name: 'state', required: false, desc: 'State filter (default: open)' },
        ],
      },
      create_issue: {
        desc: 'Create issue',
        params: [
          { name: 'owner', required: true, desc: 'Repo owner' },
          { name: 'repo', required: true, desc: 'Repo name' },
          { name: 'title', required: true, desc: 'Issue title' },
          { name: 'body', required: false, desc: 'Issue body' },
        ],
      },
      get_file: {
        desc: 'Get file contents',
        params: [
          { name: 'owner', required: true, desc: 'Repo owner' },
          { name: 'repo', required: true, desc: 'Repo name' },
          { name: 'path', required: true, desc: 'File path' },
        ],
      },
    },
  },
  brave_search: {
    description: 'Web search API',
    auth: 'api_key',
    docs: 'https://api.search.brave.com/docs',
    actions: {
      search: {
        desc: 'Search the web',
        params: [
          { name: 'query', required: true, desc: 'Search query' },
          { name: 'count', required: false, desc: 'Number of results (default: 5)' },
        ],
      },
    },
  },
  apilayer: {
    description: 'APILayer marketplace — currency, news, scraping, PDFs, verification & more',
    auth: 'api_key',
    docs: 'https://apilayer.com',
    actions: {
      exchange_rates: {
        desc: 'Get live or historical currency exchange rates',
        params: [
          { name: 'base', required: false, desc: 'Base currency (default: USD)' },
          { name: 'symbols', required: false, desc: 'Comma-separated target currencies' },
          { name: 'date', required: false, desc: 'Historical date YYYY-MM-DD (omit for live)' },
        ],
      },
      market_data: {
        desc: 'End-of-day stock market data',
        params: [
          { name: 'symbols', required: true, desc: 'Stock ticker(s), comma-separated e.g. AAPL,MSFT' },
          { name: 'date_from', required: false, desc: 'Start date YYYY-MM-DD' },
          { name: 'date_to', required: false, desc: 'End date YYYY-MM-DD' },
        ],
      },
      aviation: {
        desc: 'Real-time flight data and tracking',
        params: [
          { name: 'flight_iata', required: false, desc: 'IATA flight number e.g. AA100' },
          { name: 'dep_iata', required: false, desc: 'Departure airport IATA code' },
          { name: 'arr_iata', required: false, desc: 'Arrival airport IATA code' },
        ],
      },
      pdf_generate: {
        desc: 'Generate PDF from URL or HTML',
        params: [
          { name: 'document_url', required: false, desc: 'URL to convert to PDF' },
          { name: 'document_html', required: false, desc: 'HTML string to convert (alternative to URL)' },
          { name: 'page_size', required: false, desc: 'Page size: A4, Letter, etc (default: A4)' },
        ],
      },
      screenshot: {
        desc: 'Capture full-page screenshot of any URL',
        params: [
          { name: 'url', required: true, desc: 'URL to screenshot' },
          { name: 'viewport', required: false, desc: 'Viewport size e.g. 1440x900 (default)' },
          { name: 'fullpage', required: false, desc: '1 for full page, 0 for viewport only (default: 0)' },
        ],
      },
      verify_email: {
        desc: 'Validate email address format and deliverability',
        params: [
          { name: 'email', required: true, desc: 'Email address to verify' },
        ],
      },
      verify_number: {
        desc: 'Validate and lookup phone number details',
        params: [
          { name: 'number', required: true, desc: 'Phone number in E.164 format e.g. +46701234567' },
        ],
      },
      vat_check: {
        desc: 'Validate EU VAT number',
        params: [
          { name: 'vat_number', required: true, desc: 'EU VAT number e.g. SE556012345601' },
        ],
      },
      world_news: {
        desc: 'Extract and analyze news articles from a URL',
        params: [
          { name: 'url', required: true, desc: 'URL of the news article to analyze' },
          { name: 'analyze', required: false, desc: 'Whether to analyze the news (default: true)' },
        ],
      },
      finance_news: {
        desc: 'Latest financial and stock market news',
        params: [
          { name: 'tickers', required: false, desc: 'Stock tickers comma-separated e.g. AAPL,TSLA' },
          { name: 'text', required: false, desc: 'Keyword filter' },
          { name: 'number', required: false, desc: 'Number of results (default: 5)' },
        ],
      },
      scrape: {
        desc: 'Advanced web scraper — returns clean page content',
        params: [
          { name: 'url', required: true, desc: 'URL to scrape' },
        ],
      },
      image_crop: {
        desc: 'Smart crop an image to specified dimensions',
        params: [
          { name: 'url', required: true, desc: 'Image URL to crop' },
          { name: 'width', required: false, desc: 'Target width in pixels' },
          { name: 'height', required: false, desc: 'Target height in pixels' },
        ],
      },
      skills: {
        desc: 'Search 7000+ professional skills database',
        params: [
          { name: 'q', required: true, desc: 'Skill search query e.g. "machine learning"' },
          { name: 'count', required: false, desc: 'Number of results (default: 10)' },
        ],
      },
      form_submit: {
        desc: 'Submit form data to a FormAPI endpoint',
        params: [
          { name: 'endpoint', required: true, desc: 'FormAPI endpoint path' },
          { name: 'data', required: false, desc: 'Form data object to submit' },
        ],
      },
    },
  },
};

/**
 * Discover APIs based on a natural language query
 * MVP uses keyword matching; production would use embeddings
 *
 * `callableOnly` defaults to true: agents asking "what API does X" almost
 * always want something they can actually run through APIClaw right now.
 * Pass `callableOnly: false` to also see the discoverable-only registry
 * entries (useful for integration scoping, not for action).
 */
export function discoverAPIs(
  query: string,
  options: {
    category?: string;
    maxResults?: number;
    maxPrice?: number;
    region?: string;
    callableOnly?: boolean;
  } = {}
): SearchResult[] {
  const { category, maxResults = 5, maxPrice, region, callableOnly = true } = options;

  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

  const results: SearchResult[] = [];

  for (const api of apis) {
    // Callable-only filter (default mode): drop registry entries APIClaw
    // can't execute right now. Cast because `callable` is a registry field
    // not yet promoted to the APIProvider type.
    if (callableOnly && (api as unknown as { callable?: boolean }).callable !== true) continue;

    // Category filter
    if (category && api.category !== category) continue;

    // Region filter
    if (region && api.regions && !api.regions.includes(region) && !api.regions.includes('global')) continue;
    
    // Calculate relevance score
    let score = 0;
    const matchReasons: string[] = [];
    
    // Check keywords
    for (const word of queryWords) {
      // Direct keyword match
      if (api.keywords?.some(k => k.includes(word))) {
        score += 10;
        matchReasons.push(`keyword: ${word}`);
      }
      
      // Capability match
      if (api.capabilities?.some(c => c.includes(word))) {
        score += 15;
        matchReasons.push(`capability: ${word}`);
      }
      
      // Name match
      if (api.name.toLowerCase().includes(word)) {
        score += 20;
        matchReasons.push(`name: ${word}`);
      }
      
      // Description match
      if (api.description.toLowerCase().includes(word)) {
        score += 5;
        matchReasons.push(`description: ${word}`);
      }
      
      // Feature match
      if (api.features?.some(f => f.toLowerCase().includes(word))) {
        score += 8;
        matchReasons.push(`feature: ${word}`);
      }
    }
    
    // Boost for high success rate (default to 0.8 if not set)
    score += (api.agent_success_rate ?? 0.8) * 10;
    
    // Boost for low latency (default to 500ms if not set)
    score += Math.max(0, (1000 - (api.avg_latency_ms ?? 500)) / 100);
    
    // Boost for free tier
    if (api.pricing?.free_tier) {
      score += 5;
      matchReasons.push('has free tier');
    }

    // Live success-rate signal from rolling 30d apiLogs. Multiplier in
    // [0.5, 1.0]; 1.0 when we don't have enough data yet (cold-start).
    const liveMult = healthMultiplier(api.id);
    if (liveMult < 1.0) {
      const h = healthCache.get(api.id);
      if (h) {
        const pct = Math.round(h.successRate * 100);
        matchReasons.push(`live success ${pct}% (n=${h.callCount})`);
      }
    }
    score = score * liveMult;

    if (score > 0) {
      results.push({
        provider: api,
        relevance_score: Math.round(score * 100) / 100,
        match_reasons: [...new Set(matchReasons)]
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Managed providers from Convex providerAPIs. Scored with the same rules
  // as apis.json entries so a managed provider ranks alongside open APIs on
  // the same query. Always callable (managed routing path holds the key).
  // ───────────────────────────────────────────────────────────────────────────
  for (const mp of managedProvidersCache) {
    if (category && mp.category !== category) continue;

    // Build a synthetic APIProvider so SearchResult shape stays consistent.
    // Fields not present on managed-provider rows default to safe values.
    const synth: APIProvider & { callable?: boolean; managed?: boolean } = {
      id: mp.providerName.toLowerCase().replace(/\s+/g, '_'),
      name: mp.providerName,
      description: mp.description,
      category: mp.category,
      capabilities: [],
      keywords: [],
      pricing: { model: 'managed', free_tier: false, minimum_purchase: null },
      auth_type: 'managed',
      docs_url: mp.docsUrl,
      base_url: mp.baseUrl,
      endpoints: [],
      features: [],
      compliance: [],
      regions: ['global'],
      agent_success_rate: 1.0,
      avg_latency_ms: 500,
      callable: true,
      managed: true,
    };

    let mscore = 0;
    const mreasons: string[] = ['managed'];
    for (const word of queryWords) {
      if (synth.name.toLowerCase().includes(word)) {
        mscore += 20;
        mreasons.push(`name:${word}`);
      }
      if (synth.description.toLowerCase().includes(word)) {
        mscore += 5;
        mreasons.push(`description:${word}`);
      }
      if (synth.category.toLowerCase().includes(word)) {
        mscore += 8;
        mreasons.push(`category:${word}`);
      }
    }

    // Mirror the baseline boosts open APIs receive so a managed provider
    // ranks on par with an equally-matched open one rather than always
    // falling below. Success-rate boost uses the synthetic 1.0 since
    // managed providers route through APIClaw's gateway (no upstream
    // BYOK failure mode); latency boost uses the synthetic 500 ms.
    mscore += 10;                              // success_rate × 10
    mscore += 5;                               // latency (1000-500)/100
    mscore += 3;                               // managed-vetted bonus
    mreasons.push('managed-vetted');

    // Apply the same live success-rate multiplier — managed providers
    // attribute to their providerName in providerHealth via the runner's
    // dual-logging, so the lookup key works here too. providerHealth
    // stores providerId lowercased by convention; the synthetic id we
    // built matches that.
    const mliveMult = healthMultiplier(synth.id);
    if (mliveMult < 1.0) {
      const h = healthCache.get(synth.id);
      if (h) {
        const pct = Math.round(h.successRate * 100);
        mreasons.push(`live success ${pct}% (n=${h.callCount})`);
      }
    }
    mscore = mscore * mliveMult;

    if (mscore > 0) {
      results.push({
        provider: synth,
        relevance_score: Math.round(mscore * 100) / 100,
        match_reasons: [...new Set(mreasons)],
      });
    }
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance_score - a.relevance_score);

  return results.slice(0, maxResults);
}

/**
 * Get detailed information about a specific API
 * @param apiId - The API provider ID
 * @param options.compact - If true, returns minified spec (saves ~60% tokens)
 */
export function getAPIDetails(
  apiId: string, 
  options: { compact?: boolean } = {}
): APIDetailsResponse | null {
  const { compact = false } = options;
  
  // Check if it's a managed provider (hardcoded handlers)
  const directSpec = isUnavailableManagedProvider(apiId)
    ? undefined
    : MANAGED_PROVIDER_SPECS[apiId];
  if (directSpec) {
    if (compact) {
      // Minified format: ~60% smaller
      return {
        id: apiId,
        type: 'direct_call',
        desc: directSpec.description,
        auth: directSpec.auth,
        actions: Object.fromEntries(
          Object.entries(directSpec.actions).map(([action, info]) => [
            action,
            {
              params: info.params.map(p => 
                p.required ? p.name : `${p.name}?`
              ),
            },
          ])
        ),
      } as APIDetailsResponse;
    }
    
    return {
      id: apiId,
      type: 'direct_call',
      name: apiId,
      description: directSpec.description,
      auth_type: directSpec.auth,
      docs_url: directSpec.docs,
      direct_call: true,
      actions: Object.fromEntries(
        Object.entries(directSpec.actions).map(([action, info]) => [
          action,
          {
            description: info.desc,
            params: info.params,
          },
        ])
      ),
    } as APIDetailsResponse;
  }
  
  // Check if it's an Open API (free, no auth)
  if (isOpenAPI(apiId)) {
    const openApi = openAPIs[apiId];
    const actions = Object.keys(openApi.actions);
    
    if (compact) {
      return {
        id: apiId,
        type: 'open',
        desc: openApi.description,
        auth: 'none',
        actions: Object.fromEntries(
          actions.map(a => [a, { params: [] }])
        ),
      } as APIDetailsResponse;
    }
    
    return {
      id: apiId,
      type: 'open',
      name: openApi.name,
      description: openApi.description,
      auth_type: 'none',
      free: true,
      actions: Object.fromEntries(
        actions.map(a => [a, { description: `Execute ${a}`, params: [] }])
      ),
    } as APIDetailsResponse;
  }
  
  // Fall back to registry (19,000+ APIs - basic info only)
  const registryApi = apis.find(api => 
    api.id === apiId || 
    api.name?.toLowerCase() === apiId.toLowerCase()
  );
  
  if (!registryApi) {
    return null;
  }
  
  if (compact) {
    return {
      id: registryApi.id || registryApi.name,
      type: 'registry',
      desc: registryApi.description?.slice(0, 80),
      auth: registryApi.auth_type || (registryApi as any).auth || 'unknown',
      url: registryApi.base_url || (registryApi as any).baseUrl,
    } as APIDetailsResponse;
  }
  
  return {
    id: registryApi.id || registryApi.name,
    type: 'registry',
    name: registryApi.name,
    description: registryApi.description,
    category: registryApi.category,
    auth_type: registryApi.auth_type || (registryApi as any).auth,
    base_url: registryApi.base_url || (registryApi as any).baseUrl,
    docs_url: registryApi.docs_url || (registryApi as any).docsUrl,
    pricing: registryApi.pricing || (registryApi as any).pricing,
    note: 'Registry API - use call_api with customer_key or check docs for integration',
  } as APIDetailsResponse;
}

/**
 * List all APIs in a category
 */
export function listByCategory(category: string): APIProvider[] {
  return apis.filter(api => api.category === category);
}

/**
 * Get all available categories
 */
export function getCategories(): string[] {
  return [...new Set(apis.map(api => api.category))];
}

/**
 * Get all APIs
 */
export function getAllAPIs(): APIProvider[] {
  return apis;
}
