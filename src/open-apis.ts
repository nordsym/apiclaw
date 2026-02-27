/**
 * APIClaw Open APIs - Free APIs that don't require authentication
 * These are called directly but still logged for analytics
 */

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
    baseUrl: 'https://api.frankfurter.app',
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
};

/**
 * Check if a provider is an open API
 */
export function isOpenAPI(providerId: string): boolean {
  return providerId in openAPIs;
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
    const url = config.baseUrl + actionConfig.path(params);
    const response = await fetch(url, { method: actionConfig.method });
    
    if (!response.ok) {
      return {
        success: false,
        provider: providerId,
        action,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    let data = await response.json();
    
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
 * List all open APIs with their actions
 */
export function listOpenAPIs(): { provider: string; name: string; description: string; actions: string[] }[] {
  return Object.entries(openAPIs).map(([id, config]) => ({
    provider: id,
    name: config.name,
    description: config.description,
    actions: Object.keys(config.actions),
  }));
}
