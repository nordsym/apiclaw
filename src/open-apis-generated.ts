/**
 * Generated open API providers — loaded from src/registry/generated-providers.json.
 *
 * This file is the runtime adapter that turns the static JSON artifact
 * produced by scripts/pipeline/generate_providers.py into OpenAPIConfig
 * instances. Manual providers in open-apis.ts always take precedence; this
 * loader only adds providers whose ids don't already exist.
 *
 * Path templating uses simple {var} substitution from params; remaining
 * params with `in: query` get appended to the query string.
 */

import { createRequire } from 'module';
import type { OpenAPIConfig, OpenAPIAction } from './open-apis.js';

const require = createRequire(import.meta.url);

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
}

interface GeneratedArtifact {
  version: number;
  generatedAt: number;
  providerCount: number;
  callableCount: number;
  providers: GeneratedProvider[];
}

let cachedArtifact: GeneratedArtifact | null = null;

function loadArtifact(): GeneratedArtifact {
  if (cachedArtifact) return cachedArtifact;
  try {
    cachedArtifact = require('./registry/generated-providers.json') as GeneratedArtifact;
  } catch {
    // Registry artifact intentionally excluded from npm tarball as of 2.8.3
    // (saved ~150MB). Local discover_apis returns managed providers only;
    // for the full 26,704-API catalog, agents should call /v1/discover via
    // the HTTP gateway at api.apiclaw.cloud.
    console.warn(
      '[APIClaw] Local generated-providers registry not bundled. ' +
      'discover_apis returns managed providers only. ' +
      'Use https://api.apiclaw.cloud/v1/discover for full 26,704-API search.'
    );
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

function buildPath(template: string, params: Record<string, any>, paramDefs: GeneratedActionParam[]): string {
  let path = template;
  const pathVars = new Set<string>();
  for (const def of paramDefs) {
    if (def.in === 'path') pathVars.add(def.name);
  }
  // substitute {var}
  path = path.replace(/\{([^}]+)\}/g, (_, name) => {
    pathVars.add(name);
    const v = params[name];
    return v === undefined || v === null ? '' : encodeURIComponent(String(v));
  });
  // append query string params
  const queryPairs: string[] = [];
  for (const def of paramDefs) {
    if (def.in !== 'query') continue;
    const v = params[def.name];
    if (v === undefined || v === null) continue;
    queryPairs.push(`${encodeURIComponent(def.name)}=${encodeURIComponent(String(v))}`);
  }
  // also include any explicit params not declared in spec but passed at call time
  for (const [k, v] of Object.entries(params)) {
    if (pathVars.has(k)) continue;
    if (paramDefs.some((d) => d.name === k && d.in === 'query')) continue;
    if (k === '_body' || k === '_headers') continue;
    if (v === undefined || v === null) continue;
    if (typeof v === 'object') continue;
    queryPairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  if (queryPairs.length) {
    path += (path.includes('?') ? '&' : '?') + queryPairs.join('&');
  }
  return path;
}

function toOpenAPIConfig(p: GeneratedProvider): OpenAPIConfig {
  const actions: Record<string, OpenAPIAction> = {};
  for (const [aid, a] of Object.entries(p.actions)) {
    const defs = a.params || [];
    actions[aid] = {
      method: a.method,
      path: (params) => buildPath(a.pathTemplate, params || {}, defs),
    };
  }
  return {
    name: p.name,
    description: p.description || `${p.name} (auto-generated from ${p.source})`,
    baseUrl: p.baseUrl.replace(/\/$/, ''),
    actions,
  };
}

/**
 * Build the registry of generated providers ready to merge into openAPIs.
 * Only providers marked callable=true are returned by default; pass
 * { includeCandidates: true } to surface auth-gated entries as well.
 */
export function loadGeneratedProviders(opts: { includeCandidates?: boolean } = {}): Record<string, OpenAPIConfig> {
  const artifact = loadArtifact();
  const out: Record<string, OpenAPIConfig> = {};
  for (const p of artifact.providers) {
    if (!p.callable && !opts.includeCandidates) continue;
    out[p.id] = toOpenAPIConfig(p);
  }
  return out;
}

export function getGeneratedArtifactStats(): {
  providerCount: number;
  callableCount: number;
  generatedAt: number;
} {
  const a = loadArtifact();
  return {
    providerCount: a.providerCount,
    callableCount: a.callableCount,
    generatedAt: a.generatedAt,
  };
}

export function getGeneratedProviderMeta(id: string): GeneratedProvider | undefined {
  return loadArtifact().providers.find((p) => p.id === id);
}
