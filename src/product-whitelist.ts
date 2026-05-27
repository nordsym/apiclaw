/**
 * Multi-Product Whitelist System
 * Supports multiple products (Hivr, NordSym, partners) with namespaced agentIds
 * 
 * Format: product:agentId
 * Examples: hivr:bytebee, nordsym:mollebot, partner_x:agent1
 */

interface ProductSource {
  name: string;
  convexUrl: string;
  queryPath: string;
  agentIdField: string;
  authToken?: string;
}

// Product sources configuration
const PRODUCT_SOURCES: ProductSource[] = [
  {
    name: 'hivr',
    convexUrl: 'https://adventurous-avocet-799.convex.cloud',
    queryPath: 'agents:list',
    agentIdField: 'handle', // ✅ Fixed: Hivr agents use 'handle', not 'agentId'
  },
  // Add more products here as needed
  // {
  //   name: 'nordsym',
  //   convexUrl: 'https://nordsym-deployment.convex.cloud',
  //   queryPath: 'team:listAgents',
  //   agentIdField: 'memberId',
  // },
];

// Fallback static whitelist (emergency only)
const STATIC_WHITELIST = [
  'hivr:bytebee',
  'hivr:analyzerbee',
  'hivr:buildbee',
  'hivr:buzzwriter',
  'hivr:hivemind',
  'hivr:hivesage',
  'hivr:symbot',
  'hivr:hivrqueen',
  'hivr:marketmaven',
  'hivr:reconbee',
  'hivr:sprintbee',
  'hivr:quillbee',
];

// Cache per product (5 minutes TTL)
interface ProductCache {
  agents: string[];
  expiresAt: number;
}

const cache = new Map<string, ProductCache>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch agents from a single product source
 */
async function fetchFromProduct(source: ProductSource): Promise<string[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (source.authToken) {
      headers['Authorization'] = `Bearer ${source.authToken}`;
    }
    
    const response = await fetch(`${source.convexUrl}/api/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        path: source.queryPath,
        args: {},
      }),
    });
    
    if (!response.ok) {
      console.warn(`[Whitelist] ${source.name}: HTTP ${response.status}`);
      return [];
    }
    
    const result = await response.json() as any;
    
    // Convex HTTP API returns { status: "success", value: [...] }
    const data = result.value || result;
    
    if (!Array.isArray(data)) {
      console.warn(`[Whitelist] ${source.name}: Invalid response format`, typeof data);
      return [];
    }
    
    // Extract agentIds and add namespace
    const agents = data
      .map((item: any) => {
        const agentId = item[source.agentIdField];
        if (!agentId) return null;
        return `${source.name}:${String(agentId).toLowerCase().trim()}`;
      })
      .filter((id): id is string => id !== null && id.length > 0);
    
    console.log(`[Whitelist] ${source.name}: Fetched ${agents.length} agents`);
    return agents;
    
  } catch (error) {
    console.error(`[Whitelist] ${source.name}: Fetch failed`, error);
    return [];
  }
}

/**
 * Fetch and merge agents from all product sources
 */
async function fetchAllProducts(): Promise<string[]> {
  const results = await Promise.allSettled(
    PRODUCT_SOURCES.map(source => fetchFromProduct(source))
  );
  
  const allAgents: string[] = [];
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allAgents.push(...result.value);
    }
  }
  
  // If no products returned data, use static fallback
  if (allAgents.length === 0) {
    console.warn('[Whitelist] All sources failed, using static fallback');
    return STATIC_WHITELIST;
  }
  
  return allAgents;
}

/**
 * Get current whitelist (cached or fresh)
 */
export async function getWhitelist(): Promise<string[]> {
  const now = Date.now();
  
  // Check if any cache entry is still valid
  const validCaches: string[] = [];
  for (const [product, cached] of cache.entries()) {
    if (now < cached.expiresAt) {
      validCaches.push(...cached.agents);
    }
  }
  
  // If all caches valid, return merged
  if (validCaches.length > 0 && cache.size === PRODUCT_SOURCES.length) {
    return validCaches;
  }
  
  // Fetch fresh data
  const agents = await fetchAllProducts();
  
  // Update cache per product
  const agentsByProduct = new Map<string, string[]>();
  for (const agent of agents) {
    const [product] = agent.split(':');
    if (!agentsByProduct.has(product)) {
      agentsByProduct.set(product, []);
    }
    agentsByProduct.get(product)!.push(agent);
  }
  
  for (const [product, productAgents] of agentsByProduct.entries()) {
    cache.set(product, {
      agents: productAgents,
      expiresAt: now + CACHE_TTL,
    });
  }
  
  return agents;
}

/**
 * Check if agentId is authorized
 * Supports both namespaced (product:agent) and legacy (agent) formats
 */
export async function isAuthorized(agentId: string | undefined): Promise<boolean> {
  if (!agentId) return false;
  
  const normalized = agentId.toLowerCase().trim();
  const whitelist = await getWhitelist();
  
  // Check exact match (namespaced)
  if (whitelist.includes(normalized)) {
    return true;
  }
  
  // Legacy support: check if agentId matches any product's agent (without namespace)
  // e.g., "bytebee" matches "hivr:bytebee"
  if (!normalized.includes(':')) {
    const legacyMatch = whitelist.some(entry => {
      const [, agent] = entry.split(':');
      return agent === normalized;
    });
    if (legacyMatch) {
      console.log(`[Whitelist] Legacy match for ${normalized}`);
      return true;
    }
  }
  
  return false;
}

/**
 * Extract product name from agentId
 */
export function getProduct(agentId: string): string | null {
  const [product] = agentId.split(':');
  return product || null;
}

/**
 * Force refresh whitelist (call after adding new agent)
 */
export function invalidateCache(product?: string): void {
  if (product) {
    cache.delete(product);
    console.log(`[Whitelist] Cache invalidated for ${product}`);
  } else {
    cache.clear();
    console.log('[Whitelist] All caches invalidated');
  }
}

/**
 * Add new product source dynamically
 */
export function addProductSource(source: ProductSource): void {
  const existing = PRODUCT_SOURCES.find(s => s.name === source.name);
  if (existing) {
    console.warn(`[Whitelist] Product ${source.name} already exists, updating`);
    Object.assign(existing, source);
  } else {
    PRODUCT_SOURCES.push(source);
    console.log(`[Whitelist] Added product source: ${source.name}`);
  }
  invalidateCache(source.name);
}
