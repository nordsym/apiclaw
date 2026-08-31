/**
 * APIClaw Open APIs - Free APIs that don't require authentication
 * These are called directly but still logged for analytics
 */

import { loadGeneratedProviders, getGeneratedArtifactStats } from './open-apis-generated.js';

export interface OpenAPIConfig {
  name: string;
  description: string;
  baseUrl: string;
  actions: Record<string, OpenAPIAction>;
}

export interface OpenAPIAction {
  method: 'GET' | 'POST';
  path: (params: Record<string, any>) => string;
  transform?: (data: any, params: Record<string, any>) => any;
}

/**
 * Registry of open APIs
 */
export const openAPIs: Record<string, OpenAPIConfig> = {
  // Frankfurter - Free currency exchange rates (ECB data)
  frankfurter: {
    name: 'Frankfurter',
    description: 'Free currency exchange rates from European Central Bank',
    baseUrl: 'https://api.frankfurter.dev/v1',
    actions: {
      convert: {
        method: 'GET',
        path: (p) => `/latest?from=${p.from || 'SEK'}&to=${p.to || 'USD'}&amount=${p.amount || 1}`,
        transform: (data, params) => ({
          from: params.from || 'SEK',
          to: params.to || 'USD',
          amount: data.amount,
          result: data.rates?.[params.to || 'USD'],
          rate: data.rates?.[params.to || 'USD'] / data.amount,
          date: data.date,
        }),
      },
      latest: {
        method: 'GET',
        path: (p) => `/latest?from=${p.base || 'SEK'}${p.symbols ? `&to=${p.symbols}` : ''}`,
        transform: (data) => ({
          base: data.base,
          date: data.date,
          rates: data.rates,
        }),
      },
      historical: {
        method: 'GET',
        path: (p) => `/${p.date}?from=${p.base || 'SEK'}${p.symbols ? `&to=${p.symbols}` : ''}`,
        transform: (data) => ({
          base: data.base,
          date: data.date,
          rates: data.rates,
        }),
      },
      currencies: {
        method: 'GET',
        path: () => '/currencies',
        transform: (data) => ({ currencies: data }),
      },
    },
  },

  // CoinGecko - Free crypto data
  coingecko: {
    name: 'CoinGecko',
    description: 'Free cryptocurrency data - prices, market cap, volume',
    baseUrl: 'https://api.coingecko.com/api/v3',
    actions: {
      price: {
        method: 'GET',
        path: (p) => `/simple/price?ids=${p.ids || 'bitcoin'}&vs_currencies=${p.vs_currencies || 'usd'}`,
      },
      coins_list: {
        method: 'GET',
        path: () => '/coins/list',
      },
      coin: {
        method: 'GET',
        path: (p) => `/coins/${p.id}?localization=false&tickers=false&community_data=false&developer_data=false`,
        transform: (data) => ({
          id: data.id,
          symbol: data.symbol,
          name: data.name,
          price_usd: data.market_data?.current_price?.usd,
          market_cap_usd: data.market_data?.market_cap?.usd,
          price_change_24h: data.market_data?.price_change_percentage_24h,
        }),
      },
      trending: {
        method: 'GET',
        path: () => '/search/trending',
        transform: (data) => ({
          coins: data.coins?.map((c: any) => ({
            id: c.item.id,
            name: c.item.name,
            symbol: c.item.symbol,
            market_cap_rank: c.item.market_cap_rank,
          })),
        }),
      },
    },
  },

  // IP-API - Free IP geolocation
  ipapi: {
    name: 'IP-API',
    description: 'Free IP geolocation - get location from IP address',
    baseUrl: 'http://ip-api.com',
    actions: {
      lookup: {
        method: 'GET',
        path: (p) => `/json/${p.ip || ''}`,
        transform: (data) => ({
          ip: data.query,
          country: data.country,
          countryCode: data.countryCode,
          region: data.regionName,
          city: data.city,
          lat: data.lat,
          lon: data.lon,
          isp: data.isp,
          timezone: data.timezone,
        }),
      },
    },
  },

  // Kroki - Diagrams as code
  kroki: {
    name: 'Kroki',
    description: 'Generate diagrams from text. Supports: mermaid, d2, plantuml, graphviz, c4plantuml, blockdiag, bpmn. D2 is SVG-only.',
    baseUrl: 'https://kroki.io',
    actions: {
      render: {
        method: 'POST',
        path: () => '', // Custom handling below
      },
    },
  },
};

/**
 * Merge generated providers into the registry.
 * Curated entries with custom transforms take precedence on id collisions.
 */
const _generatedProviders = loadGeneratedProviders();
for (const [id, cfg] of Object.entries(_generatedProviders)) {
  if (!(id in openAPIs)) {
    openAPIs[id] = cfg;
  }
}

/**
 * Generic passthrough provider — proxy any open API without pre-configuration.
 * Enables all 22,000+ indexed APIs to be callable on demand.
 *
 * Usage: call_api("generic", "request", {
 *   url: "https://api.example.com/endpoint",
 *   method: "GET",               // optional, default GET
 *   query: { key: "value" },     // optional query params
 *   body: { key: "value" },      // optional body (POST/PUT/PATCH)
 *   headers: { "X-Foo": "bar" }, // optional extra headers
 * })
 */

const SSRF_BLOCKLIST = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/169\.254\./,       // link-local / AWS metadata
  /^https?:\/\/metadata\.google/i,
  /^https?:\/\/\[::1\]/,          // IPv6 loopback
];

function isSsrfBlocked(url: string): boolean {
  return SSRF_BLOCKLIST.some(r => r.test(url));
}

async function executeGeneric(
  action: string,
  params: Record<string, any>
): Promise<{ success: boolean; provider: string; action: string; data?: any; error?: string }> {
  const url: string = params.url;
  if (!url) {
    return { success: false, provider: 'generic', action, error: 'Missing required param: url' };
  }

  if (isSsrfBlocked(url)) {
    return { success: false, provider: 'generic', action, error: 'URL is not allowed (private/internal range)' };
  }

  const method = (params.method || 'GET').toUpperCase();
  const query: Record<string, string> = params.query || {};
  const body = params.body;
  const extraHeaders: Record<string, string> = params.headers || {};

  // Build URL with query params
  let finalUrl = url;
  const qKeys = Object.keys(query);
  if (qKeys.length > 0) {
    const sep = url.includes('?') ? '&' : '?';
    finalUrl = url + sep + qKeys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`).join('&');
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'APIClaw/1.0 (+https://apiclaw.cloud)',
    ...extraHeaders,
  };

  const fetchOpts: RequestInit = { method, headers };

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    headers['Content-Type'] = 'application/json';
    fetchOpts.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(finalUrl, fetchOpts);
    const contentType = res.headers.get('content-type') || '';

    let data: any;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      return {
        success: false,
        provider: 'generic',
        action,
        error: `HTTP ${res.status}: ${res.statusText}`,
        data,
      };
    }

    return { success: true, provider: 'generic', action, data };
  } catch (e: any) {
    return { success: false, provider: 'generic', action, error: e.message || 'Request failed' };
  }
}

/**
 * Check if a provider is an open API
 */
export function isOpenAPI(providerId: string): boolean {
  return providerId === 'generic' || providerId in openAPIs;
}

/**
 * Get available actions for an open API
 */
export function getOpenAPIActions(providerId: string): string[] {
  return Object.keys(openAPIs[providerId]?.actions || {});
}

/**
 * Execute an open API call
 */
export async function executeOpenAPI(
  providerId: string,
  action: string,
  params: Record<string, any>
): Promise<{ success: boolean; provider: string; action: string; data?: any; error?: string }> {
  // Generic passthrough — proxy any open API on demand
  if (providerId === 'generic') {
    return await executeGeneric(action, params);
  }

  const config = openAPIs[providerId];

  if (!config) {
    return {
      success: false,
      provider: providerId,
      action,
      error: `Unknown open API: ${providerId}`,
    };
  }

  const actionConfig = config.actions[action];

  if (!actionConfig) {
    return {
      success: false,
      provider: providerId,
      action,
      error: `Unknown action '${action}' for ${providerId}. Available: ${Object.keys(config.actions).join(', ')}`,
    };
  }

  try {

    // Special handling for Kroki - use POST to get actual image data
    if (providerId === 'kroki') {
      const type = params.type || 'mermaid';
      let format = params.format || 'svg';
      const diagram = params.diagram || '';
      
      if (!diagram) {
        return {
          success: false,
          provider: providerId,
          action,
          error: 'Missing required param: diagram',
        };
      }
      
      // D2 only supports SVG
      if (type === 'd2' && format !== 'svg') {
        format = 'svg';
      }
      
      try {
        const response = await fetch(`https://kroki.io/${type}/${format}`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: diagram,
        });
        
        if (!response.ok) {
          const err = await response.text();
          return {
            success: false,
            provider: providerId,
            action,
            error: `Kroki error: ${err}`,
          };
        }
        
        // For SVG, return the content directly; for binary, return base64
        if (format === 'svg') {
          const svg = await response.text();
          return {
            success: true,
            provider: providerId,
            action,
            data: {
              type,
              format: 'svg',
              content: svg,
              content_type: 'image/svg+xml',
              supported_types: ['mermaid', 'd2', 'plantuml', 'graphviz', 'c4plantuml', 'blockdiag', 'bpmn'],
            },
          };
        } else {
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          return {
            success: true,
            provider: providerId,
            action,
            data: {
              type,
              format,
              content_base64: base64,
              content_type: format === 'png' ? 'image/png' : 'application/pdf',
            },
          };
        }
      } catch (e: any) {
        return {
          success: false,
          provider: providerId,
          action,
          error: e.message || 'Kroki request failed',
        };
      }
    }

    const url = config.baseUrl + actionConfig.path(params);
    const response = await fetch(url, {
      method: actionConfig.method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'APIClaw/1.0 (+https://apiclaw.cloud)',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        provider: providerId,
        action,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const ct = response.headers.get('content-type') || '';
    let data: any;
    if (ct.includes('application/json') || ct.includes('+json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text.length > 4096 ? text.slice(0, 4096) + '…' : text, contentType: ct };
      }
    }

    if (actionConfig.transform) {
      data = actionConfig.transform(data, params);
    }

    return {
      success: true,
      provider: providerId,
      action,
      data,
    };
  } catch (e: any) {
    return {
      success: false,
      provider: providerId,
      action,
      error: e.message || 'Request failed',
    };
  }
}

/**
 * Resolve the full URL that executeOpenAPI would fetch for a given call.
 * Used by the gateway client to pass the target URL to the Intelligent Gateway.
 *
 * Returns undefined if the provider/action is unknown or needs special handling
 * that can't be expressed as a simple URL (e.g. Kroki POST with body).
 */
export function getOpenAPIBaseUrl(
  providerId: string,
  action: string,
  params: Record<string, any>,
): string | undefined {
  // Generic passthrough -- the caller already supplies the full URL
  if (providerId === 'generic') {
    return params.url as string | undefined;
  }

  const config = openAPIs[providerId];
  if (!config) return undefined;

  const actionConfig = config.actions[action];
  if (!actionConfig) return undefined;

  // Kroki uses a POST body; return the URL but the gateway will also need the body
  if (providerId === 'kroki') {
    const type = params.type || 'mermaid';
    let format = params.format || 'svg';
    if (type === 'd2' && format !== 'svg') format = 'svg';
    return `${config.baseUrl}/${type}/${format}`;
  }

  try {
    return config.baseUrl + actionConfig.path(params);
  } catch {
    return undefined;
  }
}

/**
 * List all open APIs with their actions
 */
export function listOpenAPIs(): { provider: string; name: string; description: string; actions: string[] }[] {
  const curated = Object.entries(openAPIs).map(([id, config]) => ({
    provider: id,
    name: config.name,
    description: config.description,
    actions: Object.keys(config.actions),
  }));

  return [
    {
      provider: 'generic',
      name: 'Generic Passthrough',
      description: 'Proxy any open/public API on demand. Supply url, method, query, body, headers. No pre-configuration needed — unlocks all 22,000+ indexed APIs.',
      actions: ['request'],
    },
    ...curated,
  ];
}

/**
 * Stats about the generated provider artifact.
 */
export function getOpenAPIStats(): {
  curatedProviders: number;
  generatedProviders: number;
  generatedCallable: number;
  totalProviders: number;
  generatedAt: number;
} {
  const stats = getGeneratedArtifactStats();
  // openAPIs already contains curated + merged generated; subtract to get the curated count
  const curatedOnly = Object.keys(openAPIs).length - Object.keys(_generatedProviders).length;
  return {
    curatedProviders: curatedOnly,
    generatedProviders: stats.providerCount,
    generatedCallable: stats.callableCount,
    totalProviders: Object.keys(openAPIs).length,
    generatedAt: stats.generatedAt,
  };
}

/**
 * APIClaw operates three tiers. This function returns the unified count
 * across all of them, so the dashboard, landing page, and homepage badge
 * always cite a coherent number.
 *
 *  - Tier 1 (Discovery): the indexed registry — searchable, free, no auth
 *  - Tier 2 (Open API): callable without keys, free
 *  - Tier 3 (managed): premium, APIClaw owns the keys
 *
 * The managed-provider count is intentionally a constant here. It's small,
 * changes rarely, and lives canonically in the Apiclaw MOC. If it ever
 * grows past a handful, replace this constant with a Convex query.
 */
export const DIRECT_CALL_PROVIDERS = 19; // mirrors Apiclaw MOC: Tier 3
export const DIRECT_CALL_SUB_APIS = 27;  // APILayer sub-APIs under one provider

export function getAPIClawTotalStats(opts: { registryIndexed?: number } = {}): {
  tier1_discovery_indexed: number;
  tier2_openapi_curated: number;
  tier2_openapi_generated: number;
  tier2_openapi_generated_callable: number;
  tier2_openapi_callable_total: number;
  tier3_direct_call_providers: number;
  tier3_direct_call_sub_apis: number;
  total_callable: number;
  total_indexed_or_callable: number;
  generatedArtifactAt: number;
} {
  const stats = getOpenAPIStats();
  const registryIndexed = opts.registryIndexed ?? 22393; // canonical from src/registry/apis.json
  const tier2Callable = stats.curatedProviders + stats.generatedCallable;
  const tier3 = DIRECT_CALL_PROVIDERS + DIRECT_CALL_SUB_APIS;
  return {
    tier1_discovery_indexed: registryIndexed,
    tier2_openapi_curated: stats.curatedProviders,
    tier2_openapi_generated: stats.generatedProviders,
    tier2_openapi_generated_callable: stats.generatedCallable,
    tier2_openapi_callable_total: tier2Callable,
    tier3_direct_call_providers: DIRECT_CALL_PROVIDERS,
    tier3_direct_call_sub_apis: DIRECT_CALL_SUB_APIS,
    total_callable: tier2Callable + tier3,
    total_indexed_or_callable: registryIndexed + stats.generatedProviders + tier3,
    generatedArtifactAt: stats.generatedAt,
  };
}
