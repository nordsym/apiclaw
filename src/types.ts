// Core types for APIvault

export interface APIProvider {
  id: string;
  name: string;
  description: string;
  category: string;
  capabilities: string[];
  keywords: string[];
  pricing: APIPricing;
  auth_type: string; // api_key, basic, oauth, bearer
  docs_url: string;
  base_url: string;
  endpoints: APIEndpoint[];
  features: string[];
  compliance: string[];
  regions: string[];
  agent_success_rate: number;
  avg_latency_ms: number;
}

export interface APIPricing {
  model: string; // per_unit, per_query, per_token, per_character, subscription
  free_tier: boolean;
  minimum_purchase: number | null;
  [key: string]: string | number | boolean | null | undefined;
}

export interface APIEndpoint {
  name: string;
  method: string;
  path: string;
  params: string[];
}

export interface SearchResult {
  provider: APIProvider;
  relevance_score: number;
  match_reasons: string[];
}

export interface AgentCredits {
  agent_id: string;
  balance_usd: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  agent_id: string;
  provider_id: string;
  amount_usd: number;
  credits_purchased: number;
  status: 'pending' | 'active' | 'exhausted' | 'refunded';
  credentials?: APICredentials;
  created_at: string;
}

export interface APICredentials {
  type: string; // api_key, basic, bearer
  api_key?: string;
  username?: string;
  password?: string;
  token?: string;
  expires_at?: string;
}

export interface UsageRecord {
  purchase_id: string;
  provider_id: string;
  units_used: number;
  units_remaining: number;
  cost_incurred_usd: number;
  last_used_at: string;
}
