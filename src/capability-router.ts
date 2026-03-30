/**
 * APIClaw Capability Router
 * Routes capability requests to the best available provider
 */

import { executeAPICall } from './execute.js';
import { logAPICall } from './mcp-analytics.js';

// Convex HTTP API for capability queries
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://brilliant-puffin-712.eu-west-1.convex.cloud';

interface ProviderMapping {
  providerId: string;
  capabilityId: string;
  priority: number;
  regions: string[];
  pricePerUnit: number;
  currency: string;
  avgLatencyMs: number;
  paramMapping: Record<string, string>;
  enabled: boolean;
  healthStatus: string;
}

interface CapabilityPreferences {
  region?: string;
  maxPrice?: number;
  preferredProvider?: string;
  fallback?: boolean;
}

interface CapabilityResult {
  success: boolean;
  capability: string;
  action: string;
  providerUsed?: string;
  fallbackAttempted: boolean;
  fallbackReason?: string;
  data?: unknown;
  error?: string;
  cost?: number;
  currency?: string;
  latencyMs?: number;
}

/**
 * Query Convex for providers that support a capability
 */
async function getProvidersForCapability(
  capabilityId: string, 
  region?: string
): Promise<ProviderMapping[]> {
  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'capabilities:getProviders',
        args: { capabilityId, region },
      }),
    });
    
    if (!res.ok) return [];
    
    const data = await res.json() as { value?: ProviderMapping[] } | ProviderMapping[];
    if (Array.isArray(data)) return data;
    return (data.value || []) as ProviderMapping[];
  } catch (e) {
    console.error('Failed to fetch capability providers:', e);
    return [];
  }
}

/**
 * Map capability params to provider-specific params
 */
function mapParams(
  params: Record<string, unknown>,
  mapping: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [capParam, value] of Object.entries(params)) {
    const providerParam = mapping[capParam] || capParam;
    result[providerParam] = value;
  }
  
  return result;
}

/**
 * Log capability usage to Convex
 */
async function logCapabilityUsage(params: {
  capabilityId: string;
  providerId: string;
  userId: string;
  action: string;
  success: boolean;
  fallbackUsed: boolean;
  fallbackReason?: string;
  latencyMs: number;
  cost: number;
  currency: string;
}): Promise<void> {
  try {
    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'capabilities:logUsage',
        args: params,
      }),
    });
  } catch (e) {
    console.error('Failed to log capability usage:', e);
  }
}

/**
 * Execute a capability request with automatic provider selection and fallback
 */
export async function executeCapability(
  capabilityId: string,
  action: string,
  params: Record<string, unknown>,
  userId: string,
  preferences: CapabilityPreferences = {}
): Promise<CapabilityResult> {
  const startTime = Date.now();
  const enableFallback = preferences.fallback !== false; // Default true
  
  // Get providers for this capability
  const providers = await getProvidersForCapability(capabilityId, preferences.region);
  
  if (providers.length === 0) {
    return {
      success: false,
      capability: capabilityId,
      action,
      fallbackAttempted: false,
      error: `No providers available for capability: ${capabilityId}`,
    };
  }
  
  // Filter by max price if specified
  let filteredProviders = providers;
  if (preferences.maxPrice !== undefined) {
    filteredProviders = providers.filter(p => p.pricePerUnit <= preferences.maxPrice!);
  }
  
  // Prefer specific provider if requested
  if (preferences.preferredProvider) {
    const preferred = filteredProviders.find(p => p.providerId === preferences.preferredProvider);
    if (preferred) {
      filteredProviders = [preferred, ...filteredProviders.filter(p => p.providerId !== preferences.preferredProvider)];
    }
  }
  
  if (filteredProviders.length === 0) {
    return {
      success: false,
      capability: capabilityId,
      action,
      fallbackAttempted: false,
      error: 'No providers match your preferences (region/price)',
    };
  }
  
  // Try providers in order
  let fallbackAttempted = false;
  let lastError = '';
  
  for (let i = 0; i < filteredProviders.length; i++) {
    const provider = filteredProviders[i];
    const isFirstAttempt = i === 0;
    
    if (!isFirstAttempt) {
      fallbackAttempted = true;
    }
    
    try {
      // Map params to provider-specific format
      const mappedParams = mapParams(params, provider.paramMapping || {});
      
      // Execute via existing executeAPICall
      const result = await executeAPICall(
        provider.providerId,
        action,
        mappedParams,
        userId
      );
      
      const latencyMs = Date.now() - startTime;
      
      if (result.success) {
        // Log successful usage
        logCapabilityUsage({
          capabilityId,
          providerId: provider.providerId,
          userId,
          action,
          success: true,
          fallbackUsed: fallbackAttempted,
          fallbackReason: fallbackAttempted ? lastError : undefined,
          latencyMs,
          cost: provider.pricePerUnit,
          currency: provider.currency,
        });
        
        // Also log to file-based analytics
        logAPICall({
          timestamp: new Date().toISOString(),
          provider: provider.providerId,
          action,
          type: 'direct',
          userId,
          success: true,
          latencyMs,
        });
        
        return {
          success: true,
          capability: capabilityId,
          action,
          providerUsed: provider.providerId,
          fallbackAttempted,
          fallbackReason: fallbackAttempted ? lastError : undefined,
          data: result.data,
          cost: provider.pricePerUnit,
          currency: provider.currency,
          latencyMs,
        };
      }
      
      // Provider returned error, try next
      lastError = result.error || 'Unknown error';
      
      if (!enableFallback) {
        break;
      }
      
    } catch (e: any) {
      lastError = e.message || 'Provider execution failed';
      
      if (!enableFallback) {
        break;
      }
    }
  }
  
  // All providers failed
  const latencyMs = Date.now() - startTime;
  
  logCapabilityUsage({
    capabilityId,
    providerId: filteredProviders[0].providerId,
    userId,
    action,
    success: false,
    fallbackUsed: fallbackAttempted,
    fallbackReason: lastError,
    latencyMs,
    cost: 0,
    currency: 'SEK',
  });
  
  return {
    success: false,
    capability: capabilityId,
    action,
    fallbackAttempted,
    error: `All providers failed. Last error: ${lastError}`,
    latencyMs,
  };
}

/**
 * List available capabilities
 */
export async function listCapabilities(): Promise<{ id: string; name: string; category: string }[]> {
  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'capabilities:list',
        args: {},
      }),
    });
    
    if (!res.ok) return [];
    
    const data = await res.json() as { value?: any[] } | any[];
    const capabilities = Array.isArray(data) ? data : (data.value || []);
    
    return capabilities.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
    }));
  } catch (e) {
    return [];
  }
}

/**
 * Check if a capability exists
 */
export async function hasCapability(capabilityId: string): Promise<boolean> {
  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'capabilities:getById',
        args: { id: capabilityId },
      }),
    });
    
    if (!res.ok) return false;
    
    const data = await res.json() as { value?: unknown } | unknown;
    if (data && typeof data === 'object' && 'value' in data) {
      return !!data.value;
    }
    return !!data;
  } catch (e) {
    return false;
  }
}
