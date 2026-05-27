/**
 * APIClaw Intelligent Gateway - Capability Resolver
 *
 * Routes natural-language intents and capability queries to the best
 * matching providers from the 25k+ generated provider registry.
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GeneratedActionParam {
  name: string;
  in: 'path' | 'query' | 'header' | 'body' | string;
  required?: boolean;
  type?: string;
}

interface GeneratedAction {
  method: 'GET' | 'POST';
  pathTemplate: string;
  operationId?: string;
  summary?: string;
  params?: GeneratedActionParam[];
  requiresAuth?: boolean;
  capabilities?: string[];
  capabilityPrimary?: string;
}

interface GeneratedProvider {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  host: string;
  source: string;
  sourceUrl: string;
  callable: boolean;
  matchKind: string;
  matchConfidence: number;
  actionCount: number;
  actions: Record<string, GeneratedAction>;
  capabilitySummary?: string[];
}

interface GeneratedArtifact {
  version: number;
  generatedAt: number;
  providerCount: number;
  callableCount: number;
  providers: GeneratedProvider[];
}

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface ResolvedProvider {
  providerId: string;
  providerName: string;
  baseUrl: string;
  capability: string;
  matchedActions: {
    actionId: string;
    method: string;
    pathTemplate: string;
    summary: string;
    capabilities: string[];
  }[];
  score: number;
  callable: boolean;
}

export interface CapabilityInfo {
  capability: string;
  providerCount: number;
  actionCount: number;
}

export interface VersatileProvider {
  providerId: string;
  name: string;
  capabilities: string[];
  actionCount: number;
}

// ---------------------------------------------------------------------------
// Data loader (cached)
// ---------------------------------------------------------------------------

let cachedArtifact: GeneratedArtifact | null = null;

function loadArtifact(): GeneratedArtifact {
  if (cachedArtifact) return cachedArtifact;
  try {
    cachedArtifact = require('./registry/generated-providers.json') as GeneratedArtifact;
  } catch {
    // See open-apis-generated.ts loadArtifact() for context. Registry
    // artifact excluded from npm tarball as of 2.8.3. Intelligent-gateway
    // capability resolution falls back to managed providers + curated
    // entries only.
    cachedArtifact = {
      version: 1,
      generatedAt: 0,
      providerCount: 0,
      callableCount: 0,
      providers: [],
    };
  }
  return cachedArtifact;
}

// ---------------------------------------------------------------------------
// Keyword matching helpers
// ---------------------------------------------------------------------------

function containsKeyword(text: string, keyword: string): boolean {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function countKeywordHits(text: string, keywords: string[]): number {
  let hits = 0;
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) hits++;
  }
  return hits;
}

// ---------------------------------------------------------------------------
// resolveCapability
// ---------------------------------------------------------------------------

export function resolveCapability(
  capability: string,
  keywords?: string[],
  opts?: { limit?: number; callableOnly?: boolean },
): ResolvedProvider[] {
  const limit = opts?.limit ?? 10;
  const callableOnly = opts?.callableOnly ?? true;
  const artifact = loadArtifact();
  const capLower = capability.toLowerCase();
  const kws = keywords?.map(k => k.toLowerCase()) ?? [];

  const results: ResolvedProvider[] = [];

  for (const provider of artifact.providers) {
    // Filter callable
    if (callableOnly && !provider.callable) continue;

    // Capability must be in capabilitySummary
    const caps = provider.capabilitySummary ?? [];
    if (!caps.some(c => c.toLowerCase() === capLower)) continue;

    // Find matching actions (actions whose capabilities include the requested one)
    const matchedActions: ResolvedProvider['matchedActions'] = [];
    for (const [actionId, action] of Object.entries(provider.actions)) {
      const actionCaps = action.capabilities ?? [];
      if (actionCaps.some(c => c.toLowerCase() === capLower)) {
        matchedActions.push({
          actionId,
          method: action.method,
          pathTemplate: action.pathTemplate,
          summary: action.summary ?? '',
          capabilities: actionCaps,
        });
      }
    }

    // Score — rewards relevance density, not raw volume
    let rawScore = 0;

    if (kws.length > 0) {
      // Keyword hits in provider name + description (strongest signal)
      const nameDescText = `${provider.name} ${provider.description}`.toLowerCase();
      const nameHits = kws.filter(kw => nameDescText.includes(kw)).length;
      rawScore += (nameHits / kws.length) * 0.4; // up to 0.4 for name/desc match

      // Keyword density in MATCHED actions only (not all actions)
      if (matchedActions.length > 0) {
        const matchedText = matchedActions
          .map(a => `${a.summary} ${a.actionId} ${a.pathTemplate}`)
          .join(' ')
          .toLowerCase();
        const actionHits = kws.filter(kw => matchedText.includes(kw)).length;
        rawScore += (actionHits / kws.length) * 0.2; // up to 0.2
      }
    } else {
      // No keywords — base capability match
      rawScore += 0.3;
    }

    // Callable bonus (verified working)
    if (provider.callable) rawScore += 0.25;

    // Action richness for this capability (more matched actions = more useful)
    const actionRatio = Math.min(matchedActions.length / 5, 1);
    rawScore += actionRatio * 0.1;

    // Penalize mock/sandbox servers
    const urlLower = provider.baseUrl.toLowerCase();
    if (urlLower.includes('virtserver') || urlLower.includes('sandbox') || urlLower.includes('.local')) {
      rawScore *= 0.5;
    }

    // Normalize to 0-1
    const score = Math.min(1, rawScore);

    results.push({
      providerId: provider.id,
      providerName: provider.name,
      baseUrl: provider.baseUrl,
      capability,
      matchedActions,
      score: Math.round(score * 1000) / 1000,
      callable: provider.callable,
    });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

// ---------------------------------------------------------------------------
// findProviderForIntent
// ---------------------------------------------------------------------------

const CAPABILITY_WORDS = new Set([
  'lookup', 'search', 'list', 'convert', 'validate', 'generate',
  'monitor', 'price', 'enrich', 'analyze', 'send', 'compute',
  'stream', 'create', 'update',
]);

const STOP_WORDS = new Set([
  'i', 'need', 'to', 'a', 'an', 'the', 'want', 'can', 'you',
  'please', 'me', 'find', 'get', 'do', 'make', 'help', 'with',
  'for', 'from', 'this', 'that',
]);

export function findProviderForIntent(intentText: string): ResolvedProvider[] {
  const tokens = intentText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 0);

  const capabilities: string[] = [];
  const keywords: string[] = [];

  for (const token of tokens) {
    if (CAPABILITY_WORDS.has(token)) {
      capabilities.push(token);
    } else if (!STOP_WORDS.has(token)) {
      keywords.push(token);
    }
  }

  // Default capability if none extracted
  if (capabilities.length === 0) {
    capabilities.push('search');
  }

  // Merge results from all detected capabilities, dedup by providerId
  const seen = new Set<string>();
  const merged: ResolvedProvider[] = [];

  for (const cap of capabilities) {
    const results = resolveCapability(cap, keywords, { limit: 20, callableOnly: false });
    for (const r of results) {
      if (!seen.has(r.providerId)) {
        seen.add(r.providerId);
        merged.push(r);
      }
    }
  }

  // Re-sort and limit
  merged.sort((a, b) => b.score - a.score);
  return merged.slice(0, 10);
}

// ---------------------------------------------------------------------------
// listCapabilities
// ---------------------------------------------------------------------------

export function listCapabilities(): CapabilityInfo[] {
  const artifact = loadArtifact();
  const capMap = new Map<string, { providerCount: number; actionCount: number }>();

  for (const provider of artifact.providers) {
    const counted = new Set<string>();
    for (const action of Object.values(provider.actions)) {
      const actionCaps = action.capabilities ?? [];
      for (const cap of actionCaps) {
        const entry = capMap.get(cap) ?? { providerCount: 0, actionCount: 0 };
        entry.actionCount++;
        if (!counted.has(cap)) {
          entry.providerCount++;
          counted.add(cap);
        }
        capMap.set(cap, entry);
      }
    }
  }

  const result: CapabilityInfo[] = [];
  for (const [capability, stats] of capMap) {
    result.push({ capability, ...stats });
  }

  result.sort((a, b) => b.actionCount - a.actionCount);
  return result;
}

// ---------------------------------------------------------------------------
// findVersatileProviders
// ---------------------------------------------------------------------------

export function findVersatileProviders(minCapabilities: number): VersatileProvider[] {
  const artifact = loadArtifact();
  const results: VersatileProvider[] = [];

  for (const provider of artifact.providers) {
    const caps = provider.capabilitySummary ?? [];
    if (caps.length >= minCapabilities) {
      results.push({
        providerId: provider.id,
        name: provider.name,
        capabilities: caps,
        actionCount: provider.actionCount,
      });
    }
  }

  results.sort((a, b) => b.capabilities.length - a.capabilities.length || b.actionCount - a.actionCount);
  return results;
}
