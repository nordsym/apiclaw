/**
 * Hivr Bees Auto-Whitelist
 * Dynamically fetches active agents from Hivr's Convex deployment
 * Falls back to static whitelist if Convex is unreachable
 */

// Hivr PROD Convex deployment
const HIVR_CONVEX_URL = "https://adventurous-avocet-799.convex.cloud";

// Fallback static whitelist (in case Convex is down)
const STATIC_WHITELIST = [
  'bytebee',
  'analyzerbee',
  'buildbee',
  'buzzwriter',
  'hivemind',
  'hivesage',
  'symbot',
  'hivrqueen',
  'marketmaven',
  'reconbee',
  'sprintbee',
  'quillbee',
];

// Cache whitelist for 5 minutes
let cachedWhitelist: string[] | null = null;
let cacheExpiry: number = 0;

/**
 * Fetch all active agents from Hivr Convex
 */
async function fetchHivrAgents(): Promise<string[]> {
  try {
    // Call Convex HTTP API directly
    const response = await fetch(`${HIVR_CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'agents:list',
        args: {},
      }),
    });
    
    if (!response.ok) {
      console.warn('[Hivr Whitelist] Convex HTTP API error, using static whitelist');
      return STATIC_WHITELIST;
    }
    
    const agents = await response.json() as any[];
    
    if (!agents || !Array.isArray(agents)) {
      console.warn('[Hivr Whitelist] Invalid response from Hivr Convex, using static whitelist');
      return STATIC_WHITELIST;
    }
    
    // Extract handles (Hivr uses 'handle', not 'agentId')
    const handles = agents
      .map((a: any) => a.handle?.toLowerCase().trim())
      .filter((h: string | undefined) => h && h.length > 0);
    
    console.log(`[Hivr Whitelist] Fetched ${handles.length} agents from Hivr`);
    return handles;
    
  } catch (error) {
    console.error('[Hivr Whitelist] Failed to fetch from Hivr Convex:', error);
    return STATIC_WHITELIST;
  }
}

/**
 * Get current whitelist (cached or fresh)
 */
export async function getWhitelist(): Promise<string[]> {
  const now = Date.now();
  
  // Return cached if still valid
  if (cachedWhitelist && now < cacheExpiry) {
    return cachedWhitelist;
  }
  
  // Fetch fresh whitelist
  cachedWhitelist = await fetchHivrAgents();
  cacheExpiry = now + (5 * 60 * 1000); // 5 minutes
  
  return cachedWhitelist;
}

/**
 * Check if agent is authorized
 */
export async function isAuthorized(agentId: string | undefined): Promise<boolean> {
  if (!agentId) return false;
  
  const whitelist = await getWhitelist();
  const normalized = agentId.toLowerCase().trim();
  
  return whitelist.includes(normalized);
}

/**
 * Force refresh whitelist (call after adding new bee)
 */
export function invalidateCache(): void {
  cachedWhitelist = null;
  cacheExpiry = 0;
  console.log('[Hivr Whitelist] Cache invalidated');
}
