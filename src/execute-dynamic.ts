/**
 * APIClaw Dynamic Executor
 * Executes provider-configured actions via self-service managed-provider routing
 */

import { decryptKey, validateBaseUrl } from './crypto.js';

// Types for dynamic provider config
export interface ProviderDirectCallConfig {
  _id: string;
  providerId: string;
  apiId: string;
  baseUrl: string;
  authType: 'bearer' | 'basic' | 'api_key' | 'none';
  authHeader: string;
  authPrefix: string;
  encryptedMasterKey: string;
  rateLimitPerUser: number;
  rateLimitPerDay: number;
  pricePerRequest: number;
  status: 'draft' | 'testing' | 'live';
  // Customer key passthrough settings
  allowCustomerKeys?: boolean; // Allow agents to pass their own API key (default: true)
  requireCustomerKeys?: boolean; // Require customer key, no master key fallback (default: false)
}

export interface ActionParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
  description: string;
  default?: unknown;
  in: 'body' | 'query' | 'path';
}

export interface ResponseMapping {
  name: string;
  path: string; // JSONPath expression
}

export interface ProviderAction {
  _id: string;
  directCallId: string;
  name: string;
  displayName: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  params: ActionParam[];
  responseMapping: ResponseMapping[];
  enabled: boolean;
  // Confirmation settings for costly actions
  requiresConfirmation?: boolean;
  estimatedCost?: string; // e.g., "~2-5 SEK per invoice"
}

export interface ExecuteResult {
  success: boolean;
  provider: string;
  action: string;
  data?: unknown;
  error?: string;
  cost?: number;
  latencyMs?: number;
}

interface UsageStats {
  minute: number;
  day: number;
}

// Convex HTTP API
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://brilliant-puffin-712.eu-west-1.convex.cloud';

async function convexQuery<T>(path: string, args: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, args }),
    });
    if (!res.ok) {
      console.error(`Convex query failed: ${res.status}`);
      return null;
    }
    const data = await res.json() as { value?: T } | T;
    return (data && typeof data === 'object' && 'value' in data) ? data.value as T : data as T;
  } catch (error) {
    console.error('Convex query error:', error);
    return null;
  }
}

async function convexMutation(path: string, args: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, args }),
    });
    return res.ok;
  } catch (error) {
    console.error('Convex mutation error:', error);
    return false;
  }
}

/**
 * Check if a provider has dynamic (self-service) config
 */
export async function hasDynamicConfig(providerId: string): Promise<boolean> {
  const config = await getProviderConfig(providerId);
  return config !== null && config.status === 'live';
}

/**
 * Fetch managed-provider routing configuration from Convex
 */
export async function getProviderConfig(providerId: string): Promise<ProviderDirectCallConfig | null> {
  // First try by API slug (for agent execution by name)
  const bySlug = await convexQuery<ProviderDirectCallConfig>('directCall:getByApiSlug', { slug: providerId });
  // Check for error response from Convex (not a real config)
  const bySlugAny = bySlug as any;
  if (bySlug && !(bySlugAny.status === 'error' || bySlugAny.errorMessage)) {
    return bySlug;
  }
  
  // Only try direct provider ID lookup if it looks like a Convex ID (starts with valid prefix)
  // Convex IDs typically look like: k97xxx...
  if (providerId.match(/^[a-z][a-z0-9]{2,}/)) {
    const byId = await convexQuery<ProviderDirectCallConfig>('directCall:getDirectCallConfig', { providerId });
    const byIdAny = byId as any;
    if (byId && !(byIdAny.status === 'error' || byIdAny.errorMessage)) {
      return byId;
    }
  }
  
  return null;
}

/**
 * Fetch action configuration from Convex
 */
export async function getActionConfig(providerId: string, actionName: string): Promise<ProviderAction | null> {
  // First get the managed routing config to get directCallId
  const config = await getProviderConfig(providerId);
  if (!config) return null;
  
  return convexQuery<ProviderAction>('directCall:getActionByName', { 
    directCallId: config._id, 
    name: actionName 
  });
}

/**
 * Check if a dynamic action requires confirmation (for costly actions)
 * Returns action config if confirmation required, null otherwise
 */
export async function getDynamicConfirmationConfig(
  providerId: string, 
  actionName: string
): Promise<{ required: boolean; action?: ProviderAction; estimatedCost?: string }> {
  const action = await getActionConfig(providerId, actionName);
  
  if (!action) {
    return { required: false };
  }
  
  if (action.requiresConfirmation) {
    return { 
      required: true, 
      action,
      estimatedCost: action.estimatedCost 
    };
  }
  
  return { required: false };
}

/**
 * Get user's current usage for rate limiting
 */
export async function getUserUsage(userId: string, providerId: string): Promise<UsageStats> {
  const usage = await convexQuery<UsageStats>('usage:getUserUsage', { userId, providerId });
  return usage || { minute: 0, day: 0 };
}

/**
 * Build the full URL with path and query parameters
 */
export function buildUrl(
  baseUrl: string, 
  path: string, 
  params: Record<string, unknown>, 
  paramDefs: ActionParam[]
): string {
  let finalPath = path;
  const queryParams = new URLSearchParams();
  
  for (const paramDef of paramDefs) {
    const value = params[paramDef.name] ?? paramDef.default;
    if (value === undefined) continue;
    
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    if (paramDef.in === 'path') {
      // Replace path parameter: /users/{id} -> /users/123
      finalPath = finalPath.replace(`{${paramDef.name}}`, encodeURIComponent(stringValue));
    } else if (paramDef.in === 'query') {
      queryParams.set(paramDef.name, stringValue);
    }
  }
  
  // Ensure baseUrl doesn't end with slash and path starts with slash
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = finalPath.startsWith('/') ? finalPath : `/${finalPath}`;
  
  const queryString = queryParams.toString();
  return queryString ? `${cleanBase}${cleanPath}?${queryString}` : `${cleanBase}${cleanPath}`;
}

/**
 * Build request body from parameters
 */
export function buildBody(
  params: Record<string, unknown>, 
  paramDefs: ActionParam[]
): string | undefined {
  const bodyParams: Record<string, unknown> = {};
  
  for (const paramDef of paramDefs) {
    if (paramDef.in === 'body') {
      const value = params[paramDef.name] ?? paramDef.default;
      if (value !== undefined) {
        bodyParams[paramDef.name] = value;
      }
    }
  }
  
  if (Object.keys(bodyParams).length === 0) {
    return undefined;
  }
  
  return JSON.stringify(bodyParams);
}

/**
 * Build authentication headers based on auth type
 */
export function buildAuthHeaders(
  config: ProviderDirectCallConfig, 
  decryptedKey: string
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'APIClaw/1.0',
  };
  
  const headerName = config.authHeader || 'Authorization';
  const prefix = config.authPrefix || '';
  
  switch (config.authType) {
    case 'bearer':
      headers[headerName] = prefix ? `${prefix} ${decryptedKey}` : `Bearer ${decryptedKey}`;
      break;
      
    case 'basic':
      // Assume decryptedKey is "username:password"
      const base64 = Buffer.from(decryptedKey).toString('base64');
      headers[headerName] = `Basic ${base64}`;
      break;
      
    case 'api_key':
      // Custom header with the key directly
      headers[headerName] = prefix ? `${prefix} ${decryptedKey}` : decryptedKey;
      break;
      
    case 'none':
      // No auth header needed
      break;
  }
  
  return headers;
}

/**
 * Extract value from object using simple JSONPath-like expression
 * Supports: $.field, $.field.nested, $.array[0], $.array[*].field
 */
export function extractJsonPath(data: unknown, path: string): unknown {
  if (!path.startsWith('$')) {
    return undefined;
  }
  
  const parts = path.slice(1).split('.').filter(Boolean);
  let current: unknown = data;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    // Handle array index: field[0] or field[*]
    const arrayMatch = part.match(/^(\w+)\[(\d+|\*)\]$/);
    if (arrayMatch) {
      const [, field, index] = arrayMatch;
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[field];
      
      if (!Array.isArray(current)) return undefined;
      
      if (index === '*') {
        // Return all elements (will need further processing)
        continue;
      } else {
        current = current[parseInt(index)];
      }
    } else {
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[part];
    }
  }
  
  return current;
}

/**
 * Map response data using configured response mappings
 */
export function mapResponse(
  data: unknown, 
  responseMapping: ResponseMapping[]
): Record<string, unknown> {
  if (!responseMapping || responseMapping.length === 0) {
    // No mapping configured, return raw data
    return { raw: data };
  }
  
  const result: Record<string, unknown> = {};
  
  for (const mapping of responseMapping) {
    const value = extractJsonPath(data, mapping.path);
    if (value !== undefined) {
      result[mapping.name] = value;
    }
  }
  
  return result;
}

/**
 * Log usage to Convex
 */
export async function logUsage(params: {
  userId: string;
  providerId: string;
  actionName: string;
  timestamp: number;
  success: boolean;
  latencyMs: number;
  creditsUsed: number;
}): Promise<void> {
  await convexMutation('usage:logUsage', params);
}

/**
 * Main function: Execute a dynamically configured action
 */
export async function executeDynamicAction(
  providerId: string,
  actionName: string,
  params: Record<string, unknown>,
  userId: string,
  customerKey?: string
): Promise<ExecuteResult> {
  const startTime = Date.now();
  
  // 1. Get provider config
  const config = await getProviderConfig(providerId);
  if (!config) {
    return { 
      success: false, 
      provider: providerId, 
      action: actionName,
      error: 'Provider not found' 
    };
  }
  
  if (config.status !== 'live') {
    return { 
      success: false, 
      provider: providerId, 
      action: actionName,
      error: 'Provider not available (not live)' 
    };
  }
  
  // 2. Validate base URL (SSRF prevention)
  const urlValidation = validateBaseUrl(config.baseUrl);
  if (!urlValidation.valid) {
    return { 
      success: false, 
      provider: providerId, 
      action: actionName,
      error: `Invalid provider URL: ${urlValidation.error}` 
    };
  }
  
  // 3. Check rate limits
  const usage = await getUserUsage(userId, providerId);
  if (usage.minute >= config.rateLimitPerUser) {
    return { 
      success: false, 
      provider: providerId, 
      action: actionName,
      error: 'Rate limit exceeded (per minute)' 
    };
  }
  if (usage.day >= config.rateLimitPerDay) {
    return { 
      success: false, 
      provider: providerId, 
      action: actionName,
      error: 'Rate limit exceeded (daily)' 
    };
  }
  
  // 4. Get action config
  const action = await getActionConfig(providerId, actionName);
  if (!action) {
    return { 
      success: false, 
      provider: providerId, 
      action: actionName,
      error: 'Action not found' 
    };
  }
  
  if (!action.enabled) {
    return { 
      success: false, 
      provider: providerId, 
      action: actionName,
      error: 'Action is disabled' 
    };
  }
  
  // 5. Validate required parameters
  for (const paramDef of action.params) {
    if (paramDef.required && params[paramDef.name] === undefined && paramDef.default === undefined) {
      return { 
        success: false, 
        provider: providerId, 
        action: actionName,
        error: `Missing required parameter: ${paramDef.name}` 
      };
    }
  }
  
  // 6. Resolve API key (customer key takes priority over master key)
  let apiKey: string;
  let usingCustomerKey = false;
  
  // Check if provider requires customer keys (like CoAccept)
  const requiresCustomerKey = config.requireCustomerKeys === true;
  const allowsCustomerKey = config.allowCustomerKeys !== false; // Default true
  
  if (customerKey && allowsCustomerKey) {
    // Customer provided their own key - use it, skip usage tracking
    apiKey = customerKey;
    usingCustomerKey = true;
  } else if (requiresCustomerKey) {
    // Provider requires customer key but none provided
    return { 
      success: false, 
      provider: providerId, 
      action: actionName,
      error: 'This provider requires your own API key. Pass it via customer_key parameter.' 
    };
  } else if (config.encryptedMasterKey) {
    // Use provider's master key - track usage for billing
    try {
      apiKey = decryptKey(config.encryptedMasterKey);
    } catch (error) {
      console.error('Failed to decrypt provider key:', error);
      return { 
        success: false, 
        provider: providerId, 
        action: actionName,
        error: 'Provider configuration error' 
      };
    }
  } else {
    // No key available
    return { 
      success: false, 
      provider: providerId, 
      action: actionName,
      error: 'No API key available. Provide your own key via customer_key parameter.' 
    };
  }
  
  // 7. Build request
  const url = buildUrl(config.baseUrl, action.path, params, action.params);
  const headers = buildAuthHeaders(config, apiKey);
  const body = action.method === 'GET' ? undefined : buildBody(params, action.params);
  
  // 8. Execute request
  let response: Response;
  try {
    response = await fetch(url, { 
      method: action.method, 
      headers, 
      body,
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    // Only log usage when using master key (for billing)
    if (!usingCustomerKey) {
      await logUsage({ 
        userId, 
        providerId, 
        actionName, 
        timestamp: Date.now(), 
        success: false, 
        latencyMs, 
        creditsUsed: 0 
      });
    }
    return { 
      success: false, 
      provider: providerId, 
      action: actionName,
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      latencyMs 
    };
  }
  
  const latencyMs = Date.now() - startTime;
  
  // 9. Parse response
  let data: unknown;
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch {
    data = null;
  }
  
  // 10. Log usage (only when using master key for billing)
  if (!usingCustomerKey) {
    await logUsage({ 
      userId, 
      providerId, 
      actionName, 
      timestamp: Date.now(), 
      success: response.ok, 
      latencyMs, 
      creditsUsed: response.ok ? config.pricePerRequest : 0 
    });
  }
  
  // 11. Handle error response
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    if (data && typeof data === 'object') {
      const errorObj = data as Record<string, unknown>;
      errorMessage = (errorObj.message as string) || 
                     (errorObj.error as string) || 
                     (errorObj.detail as string) ||
                     errorMessage;
    }
    return { 
      success: false, 
      provider: providerId, 
      action: actionName,
      error: errorMessage,
      latencyMs 
    };
  }
  
  // 12. Map response and return
  const mappedData = mapResponse(data, action.responseMapping);
  
  return { 
    success: true, 
    provider: providerId, 
    action: actionName,
    data: mappedData,
    cost: config.pricePerRequest,
    latencyMs 
  };
}

/**
 * List available actions for a dynamic provider
 */
export async function listDynamicActions(providerId: string): Promise<string[]> {
  const config = await getProviderConfig(providerId);
  if (!config || config.status !== 'live') {
    return [];
  }
  
  const actions = await convexQuery<ProviderAction[]>('directCall:getActions', { 
    directCallId: config._id 
  });
  
  if (!actions) return [];
  
  return actions
    .filter(a => a.enabled)
    .map(a => a.name);
}
