// Credit system for APIvault
// MVP: In-memory store. Production: Supabase

import { AgentCredits, Purchase, APICredentials, UsageRecord } from './types.js';
import { randomUUID } from 'crypto';

// In-memory stores (replace with Supabase in production)
const agentCredits: Map<string, AgentCredits> = new Map();
const purchases: Map<string, Purchase> = new Map();
const usage: Map<string, UsageRecord> = new Map();

// Mock API keys for demo (in production, these would be provisioned from providers)
const mockCredentials: Record<string, () => APICredentials> = {
  '46elks': () => ({
    type: 'basic',
    username: `u_${randomUUID().slice(0, 8)}`,
    password: `p_${randomUUID().slice(0, 16)}`
  }),
  'resend': () => ({
    type: 'api_key',
    api_key: `re_${randomUUID().replace(/-/g, '')}`
  }),
  'brave_search': () => ({
    type: 'api_key',
    api_key: `BSA${randomUUID().replace(/-/g, '').toUpperCase().slice(0, 20)}`
  }),
  'openrouter': () => ({
    type: 'bearer',
    api_key: `sk-or-v1-${randomUUID().replace(/-/g, '')}`
  }),
  'elevenlabs': () => ({
    type: 'api_key',
    api_key: `${randomUUID().replace(/-/g, '')}`
  })
};

/**
 * Get or create agent credits account
 */
export function getAgentCredits(agentId: string): AgentCredits {
  if (!agentCredits.has(agentId)) {
    agentCredits.set(agentId, {
      agent_id: agentId,
      balance_usd: 0,
      currency: 'USD',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  return agentCredits.get(agentId)!;
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
 * Returns credentials if successful
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
  
  // Check if provider exists
  if (!mockCredentials[providerId]) {
    return {
      success: false,
      error: `Unknown provider: ${providerId}`
    };
  }
  
  // Deduct credits
  credits.balance_usd -= amountUsd;
  credits.updated_at = new Date().toISOString();
  
  // Create purchase record
  const purchaseId = `pur_${randomUUID().slice(0, 12)}`;
  const purchase: Purchase = {
    id: purchaseId,
    agent_id: agentId,
    provider_id: providerId,
    amount_usd: amountUsd,
    credits_purchased: calculateCredits(providerId, amountUsd),
    status: 'active',
    credentials: mockCredentials[providerId](),
    created_at: new Date().toISOString()
  };
  
  purchases.set(purchaseId, purchase);
  
  // Initialize usage tracking
  usage.set(purchaseId, {
    purchase_id: purchaseId,
    provider_id: providerId,
    units_used: 0,
    units_remaining: purchase.credits_purchased,
    cost_incurred_usd: 0,
    last_used_at: new Date().toISOString()
  });
  
  return { success: true, purchase };
}

/**
 * Calculate credits based on provider pricing
 */
function calculateCredits(providerId: string, amountUsd: number): number {
  // Simplified credit calculation per provider
  const creditsPerDollar: Record<string, number> = {
    '46elks': 30,      // ~30 SMS per dollar
    'resend': 1000,    // ~1000 emails per dollar
    'brave_search': 200, // ~200 searches per dollar
    'openrouter': 100,   // ~100k tokens per dollar (varies by model)
    'elevenlabs': 3333   // ~3333 characters per dollar
  };
  
  return Math.floor(amountUsd * (creditsPerDollar[providerId] || 100));
}

/**
 * Get all purchases for an agent
 */
export function getAgentPurchases(agentId: string): Purchase[] {
  return Array.from(purchases.values()).filter(p => p.agent_id === agentId);
}

/**
 * Get usage for a purchase
 */
export function getUsage(purchaseId: string): UsageRecord | null {
  return usage.get(purchaseId) || null;
}

/**
 * Record usage (call this when API is used)
 */
export function recordUsage(purchaseId: string, unitsUsed: number, costUsd: number): UsageRecord | null {
  const record = usage.get(purchaseId);
  if (!record) return null;
  
  record.units_used += unitsUsed;
  record.units_remaining = Math.max(0, record.units_remaining - unitsUsed);
  record.cost_incurred_usd += costUsd;
  record.last_used_at = new Date().toISOString();
  
  // Update purchase status if depleted
  if (record.units_remaining === 0) {
    const purchase = purchases.get(purchaseId);
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
} {
  const credits = getAgentCredits(agentId);
  const agentPurchases = getAgentPurchases(agentId);
  const activePurchases = agentPurchases.filter(p => p.status === 'active');
  const totalSpent = agentPurchases.reduce((sum, p) => sum + p.amount_usd, 0);
  
  return {
    credits,
    active_purchases: activePurchases,
    total_spent_usd: totalSpent
  };
}
