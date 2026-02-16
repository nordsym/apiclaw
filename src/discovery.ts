// Discovery engine for APIvault
// MVP: Keyword matching. Future: Embeddings + semantic search

import { APIProvider, SearchResult } from './types.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const apisData = JSON.parse(
  readFileSync(join(__dirname, 'registry', 'apis.json'), 'utf-8')
);
const apis: APIProvider[] = apisData.apis;

/**
 * Discover APIs based on a natural language query
 * MVP uses keyword matching; production would use embeddings
 */
export function discoverAPIs(
  query: string,
  options: {
    category?: string;
    maxResults?: number;
    maxPrice?: number;
    region?: string;
  } = {}
): SearchResult[] {
  const { category, maxResults = 5, maxPrice, region } = options;
  
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  const results: SearchResult[] = [];
  
  for (const api of apis) {
    // Category filter
    if (category && api.category !== category) continue;
    
    // Region filter
    if (region && !api.regions.includes(region) && !api.regions.includes('global')) continue;
    
    // Calculate relevance score
    let score = 0;
    const matchReasons: string[] = [];
    
    // Check keywords
    for (const word of queryWords) {
      // Direct keyword match
      if (api.keywords.some(k => k.includes(word))) {
        score += 10;
        matchReasons.push(`keyword: ${word}`);
      }
      
      // Capability match
      if (api.capabilities.some(c => c.includes(word))) {
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
      if (api.features.some(f => f.toLowerCase().includes(word))) {
        score += 8;
        matchReasons.push(`feature: ${word}`);
      }
    }
    
    // Boost for high success rate
    score += api.agent_success_rate * 10;
    
    // Boost for low latency
    score += Math.max(0, (1000 - api.avg_latency_ms) / 100);
    
    // Boost for free tier
    if (api.pricing.free_tier) {
      score += 5;
      matchReasons.push('has free tier');
    }
    
    if (score > 0) {
      results.push({
        provider: api,
        relevance_score: Math.round(score * 100) / 100,
        match_reasons: [...new Set(matchReasons)]
      });
    }
  }
  
  // Sort by relevance
  results.sort((a, b) => b.relevance_score - a.relevance_score);
  
  return results.slice(0, maxResults);
}

/**
 * Get detailed information about a specific API
 */
export function getAPIDetails(apiId: string): APIProvider | null {
  return apis.find(api => api.id === apiId) || null;
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
