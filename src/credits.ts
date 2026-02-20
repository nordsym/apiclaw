// Credit system for APIClaw
// Supports both in-memory (dev) and Convex (production) backends

import { AgentCredits, Purchase, APICredentials, UsageRecord } from './types.js';
import { getCredentials, hasRealCredentials } from './credentials.js';
import { randomUUID } from 'crypto';

// Storage backend type
type StorageBackend = 'memory' | 'convex';

// Configuration
const BACKEND: StorageBackend = process.env.APICLAW_BACKEND === 'convex' ? 'convex' : 'memory';
const CONVEX_URL = process.env.CONVEX_URL || '';
const CONVEX_DEPLOY_KEY = process.env.CONVEX_DEPLOY_KEY || '';

// In-memory stores (for local development)
const agentCreditsStore: Map<string, AgentCredits> = new Map();
const purchasesStore: Map<string, Purchase> = new Map();
const usageStore: Map<string, UsageRecord> = new Map();

// Provider that have real credentials available
const REAL_CREDENTIAL_PROVIDERS = ['46elks', 'twilio'];

// Credits per dollar by provider
const CREDITS_PER_DOLLAR: Record<string, number> = {
  '46elks': 30,      // ~30 SMS per dollar
  'twilio': 25,      // ~25 SMS per dollar
  'resend': 1000,    // ~1000 emails per dollar
  'brave_search': 200, // ~200 searches per dollar
  'openrouter': 100,   // ~100k tokens per dollar (varies by model)
  'elevenlabs': 3333   // ~3333 characters per dollar
};

/**
 * Calculate credits based on provider pricing
 */
function calculateCredits(providerId: string, amountUsd: number): number {
  return Math.floor(amountUsd * (CREDITS_PER_DOLLAR[providerId] || 100));
}

/**
 * Generate credentials for a provider
 * Returns real credentials for supported providers, mock for others
 */
function generateCredentials(providerId: string): APICredentials {
  // Try to get real credentials first
  const realCreds = getCredentials(providerId);
  if (realCreds && hasRealCredentials(providerId)) {
    console.log(`[APIClaw] Using REAL credentials for ${providerId}`);
    return realCreds;
  }
  
  // Fall back to mock credentials
  console.log(`[APIClaw] Using MOCK credentials for ${providerId}`);
  return realCreds || {
    type: 'api_key',
    api_key: `mock_${providerId}_${randomUUID().slice(0, 8)}`
  };
}

// =============================================================================
// In-Memory Backend (for development)
// =============================================================================

/**
 * Get or create agent credits account
 */
export function getAgentCredits(agentId: string): AgentCredits {
  if (!agentCreditsStore.has(agentId)) {
    agentCreditsStore.set(agentId, {
      agent_id: agentId,
      balance_usd: 0,
      currency: 'USD',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  return agentCreditsStore.get(agentId)!;
}

/**
 * Add credits to an agent's account
 */
export function addCredits(agentId: string, amountUsd: number): AgentCredits {
  const credits = getAgentCredits(agentId);
  credits.balance_usd += amountUsd;
  credits.updated_at = new Date().toISOString();
  return credits;
}

/**
 * Purchase API access
 * Returns real credentials for 46elks and Twilio
 */
export function purchaseAPIAccess(
  agentId: string,
  providerId: string,
  amountUsd: number
): { success: boolean; purchase?: Purchase; error?: string } {
  const credits = getAgentCredits(agentId);
  
  // Check balance
  if (credits.balance_usd < amountUsd) {
    return {
      success: false,
      error: `Insufficient balance. Have $${credits.balance_usd.toFixed(2)}, need $${amountUsd.toFixed(2)}`
    };
  }
  
  // Check if provider is supported
  const providerCredentials = getCredentials(providerId);
  if (!providerCredentials) {
    return {
      success: false,
      error: `Unknown provider: ${providerId}. Supported: ${Object.keys(CREDITS_PER_DOLLAR).join(', ')}`
    };
  }
  
  // Deduct credits
  credits.balance_usd -= amountUsd;
  credits.updated_at = new Date().toISOString();
  
  // Generate credentials (real for 46elks/twilio, mock for others)
  const credentials = generateCredentials(providerId);
  
  // Create purchase record
  const purchaseId = `pur_${randomUUID().slice(0, 12)}`;
  const purchase: Purchase = {
    id: purchaseId,
    agent_id: agentId,
    provider_id: providerId,
    amount_usd: amountUsd,
    credits_purchased: calculateCredits(providerId, amountUsd),
    status: 'active',
    credentials,
    created_at: new Date().toISOString()
  };
  
  purchasesStore.set(purchaseId, purchase);
  
  // Initialize usage tracking
  usageStore.set(purchaseId, {
    purchase_id: purchaseId,
    provider_id: providerId,
    units_used: 0,
    units_remaining: purchase.credits_purchased,
    cost_incurred_usd: 0,
    last_used_at: new Date().toISOString()
  });
  
  // Flag if using real credentials
  const isRealCredentials = hasRealCredentials(providerId);
  console.log(`[APIClaw] Purchase complete: ${providerId} ($${amountUsd}) - Real credentials: ${isRealCredentials}`);
  
  return { success: true, purchase };
}

/**
 * Get all purchases for an agent
 */
export function getAgentPurchases(agentId: string): Purchase[] {
  return Array.from(purchasesStore.values()).filter(p => p.agent_id === agentId);
}

/**
 * Get usage for a purchase
 */
export function getUsage(purchaseId: string): UsageRecord | null {
  return usageStore.get(purchaseId) || null;
}

/**
 * Record usage (call this when API is used)
 */
export function recordUsage(purchaseId: string, unitsUsed: number, costUsd: number): UsageRecord | null {
  const record = usageStore.get(purchaseId);
  if (!record) return null;
  
  record.units_used += unitsUsed;
  record.units_remaining = Math.max(0, record.units_remaining - unitsUsed);
  record.cost_incurred_usd += costUsd;
  record.last_used_at = new Date().toISOString();
  
  // Update purchase status if depleted
  if (record.units_remaining === 0) {
    const purchase = purchasesStore.get(purchaseId);
    if (purchase) purchase.status = 'exhausted';
  }
  
  return record;
}

/**
 * Get full balance summary for an agent
 */
export function getBalanceSummary(agentId: string): {
  credits: AgentCredits;
  active_purchases: Purchase[];
  total_spent_usd: number;
  real_credentials_available: string[];
} {
  const credits = getAgentCredits(agentId);
  const agentPurchases = getAgentPurchases(agentId);
  const activePurchases = agentPurchases.filter(p => p.status === 'active');
  const totalSpent = agentPurchases.reduce((sum, p) => sum + p.amount_usd, 0);
  
  // List providers with real credentials
  const realCredentialProviders = REAL_CREDENTIAL_PROVIDERS.filter(p => hasRealCredentials(p));
  
  return {
    credits,
    active_purchases: activePurchases,
    total_spent_usd: totalSpent,
    real_credentials_available: realCredentialProviders
  };
}

/**
 * Check which providers have real credentials
 */
export function getProvidersWithRealCredentials(): string[] {
  return REAL_CREDENTIAL_PROVIDERS.filter(p => hasRealCredentials(p));
}

// =============================================================================
// Convex Backend (for production) - HTTP API calls
// =============================================================================

interface ConvexResponse<T> {
  data?: T;
  error?: string;
}

async function convexQuery<T>(path: string, args: Record<string, unknown>): Promise<ConvexResponse<T>> {
  if (!CONVEX_URL) {
    return { error: 'Convex URL not configured' };
  }

  try {
    const response = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CONVEX_DEPLOY_KEY ? { 'Authorization': `Convex ${CONVEX_DEPLOY_KEY}` } : {}),
      },
      body: JSON.stringify({ path, args }),
    });

    const result = await response.json() as T;
    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Convex query failed' };
  }
}

async function convexMutation<T>(path: string, args: Record<string, unknown>): Promise<ConvexResponse<T>> {
  if (!CONVEX_URL) {
    return { error: 'Convex URL not configured' };
  }

  try {
    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CONVEX_DEPLOY_KEY ? { 'Authorization': `Convex ${CONVEX_DEPLOY_KEY}` } : {}),
      },
      body: JSON.stringify({ path, args }),
    });

    const result = await response.json() as T;
    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Convex mutation failed' };
  }
}

// Convex-backed versions (async)
export async function getAgentCreditsAsync(agentId: string): Promise<AgentCredits | null> {
  if (BACKEND === 'memory') {
    return getAgentCredits(agentId);
  }

  const result = await convexQuery<AgentCredits>('credits:getAgentCredits', { agentId });
  return result.data || null;
}

export async function addCreditsAsync(agentId: string, amountUsd: number): Promise<AgentCredits | null> {
  if (BACKEND === 'memory') {
    return addCredits(agentId, amountUsd);
  }

  const result = await convexMutation<AgentCredits>('credits:addCredits', { agentId, amountUsd });
  return result.data || null;
}

export async function purchaseAPIAccessAsync(
  agentId: string,
  providerId: string,
  amountUsd: number
): Promise<{ success: boolean; purchase?: Purchase; error?: string }> {
  if (BACKEND === 'memory') {
    return purchaseAPIAccess(agentId, providerId, amountUsd);
  }

  // Generate credentials server-side
  const credentials = generateCredentials(providerId);

  const result = await convexMutation<Purchase>('purchases:purchaseAccess', {
    agentId,
    providerId,
    amountUsd,
    credentials,
  });

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true, purchase: result.data };
}

// Export backend info
export function getBackendInfo(): { type: StorageBackend; convexUrl: string | null } {
  return {
    type: BACKEND,
    convexUrl: BACKEND === 'convex' ? CONVEX_URL : null,
  };
}
