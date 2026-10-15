#!/usr/bin/env node
/** Read-only public API audit. Shared gateway transport; no keys or paid requests. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_BYTES = 256 * 1024;
export const AUDIT_CAUSES = ['wrong_base_url_path', 'missing_default_params', 'needs_key', 'redirect_https', 'rate_limit', 'dead_upstream', 'timeout', 'gateway_block', 'not_hosted_api', 'unknown_pricing', 'duplicate', 'unresolved', 'commercial_permission', 'ok'];
export const AUDIT_POLICY = 'Keyless HTTPS GET only; shared 20-second gateway transport; one retry at most; reviewed redirects only; 256 KiB body; eight workers; at least one second between requests per origin. A callable API needs a valid reviewed response, explicit free evidence and one canonical identity.';
const readJson = (path, fallback) => existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;
export const slug = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const rowKey = (row) => `${row.id}\0${String(row.name).toLowerCase().trim()}\0${safeOrigin(row.sourceUrl ?? row.baseUrl)}`;
const html = (body) => /<!doctype\s+html|<html(?:\s|>)/i.test(String(body ?? '').slice(0, 512));
const DOCS_HOSTS = /^(?:api\.apis\.guru|(?:api|virtserver)\.swaggerhub\.com|documenter\.getpostman\.com|(?:www\.)?github\.com|(?:www\.)?gitlab\.com|raw\.githubusercontent\.com|developers\.google\.com)$/i;
const docsUrl = (url) => DOCS_HOSTS.test(url.hostname) || /^(?:docs|developer|developers|documentation)\./i.test(url.hostname) || /\.(?:readme\.io|gitbook\.io|notion\.site)$/i.test(url.hostname) || /\/(?:swagger|openapi)(?:\.json|\.ya?ml|\/index\.html)?$/i.test(url.pathname);
const CREDENTIAL_PARAMETERS = /^(?:api[_-]?key|apikey|access[_-]?(?:key|token)|authorization|bearer|secret|password|token)$/i;

export function buildProbeUrl(api) {
  const base = new URL(api.baseUrl);
  if (!String(api.smokePath ?? '/').startsWith('/') || String(api.smokePath).startsWith('//')) throw new Error('Invalid smoke path');
  const target = new URL('./' + String(api.smokePath ?? '/').slice(1), base.href.replace(/\/?$/, '/'));
  // A root smoke path retains a query embedded in a documented base endpoint.
  if ((api.smokePath ?? '/') === '/' && base.search) return base;
  if (target.origin !== base.origin || target.username || target.password || target.hash) throw new Error('Unpinned probe URL');
  return target;
}

export function safeTraceUrl(value) {
  try { const url = new URL(value); url.username = ''; url.password = ''; for (const key of [...url.searchParams.keys()]) if (CREDENTIAL_PARAMETERS.test(key)) url.searchParams.set(key, 'REDACTED'); return url.href; } catch { return 'invalid-url'; }
}

export function errorFacts(error) {
  const chain = [];
  for (let item = error, depth = 0; item && depth < 4; item = item.cause, depth++) {
    const code = typeof item.code === 'string' ? item.code : undefined;
    // Error messages may contain upstream URLs; retain only bounded transport reasons.
    const message = String(item.message ?? '');
    chain.push({ name: String(item.name ?? 'Error'), ...(code ? { code } : {}),
      reason: /timeout|timed out|aborted/i.test(message) ? 'request_timeout'
        : /redirect/i.test(message) ? 'redirect_not_approved'
        : /unsafe|unpinned/i.test(message) ? 'unsafe_public_url' : 'transport_error' });
  }
  return chain;
}

/** A 401/403, CORS header or website response alone never proves key requirements. */
export function classifyResult({ status = 0, raw = '', decodedValid = false, error, tooLarge = false, api = {}, trace = [], unsafeRedirect = false }) {
  if (error) {
    const facts = errorFacts(error);
    if (facts.some(x => x.reason === 'request_timeout' || /Timeout|Abort/.test(x.name) || /^(?:ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT|UND_ERR_HEADERS_TIMEOUT|UND_ERR_BODY_TIMEOUT)$/.test(x.code ?? ''))) return { outcome: 'timeout', cause: 'timeout', errorCause: facts };
    if (facts.some(x => /CERT_|TLS_|_SSL_|SELF_SIGNED|UNABLE_TO_VERIFY/.test(x.code ?? ''))) return { outcome: 'tls_error', cause: 'redirect_https', errorCause: facts };
    if (facts.some(x => /^(?:ENOTFOUND|EAI_AGAIN|ECONNREFUSED)$/.test(x.code ?? ''))) return { outcome: 'network_error', cause: 'dead_upstream', errorCause: facts };
    if (facts.some(x => x.reason === 'unsafe_public_url') || unsafeRedirect) return { outcome: 'gateway_block', cause: 'gateway_block', errorCause: facts };
    if (facts.some(x => x.reason === 'redirect_not_approved')) return { outcome: 'redirect_not_approved', cause: 'redirect_https', errorCause: facts };
    return { outcome: 'network_error', cause: 'unresolved', errorCause: facts };
  }
  if (status === 429) return { outcome: 'rate_limited', cause: 'rate_limit' };
  if (status >= 500) return { outcome: 'http_error', cause: 'dead_upstream' };
  // Only explicit error semantics or independently reviewed docs establish a key requirement.
  const keyError = !html(raw) && /(?:missing|invalid|required|provide|supply)[\s\S]{0,48}(?:api[ _-]?key|access[ _-]?token)|(?:api[ _-]?key|access[ _-]?token)[\s\S]{0,48}(?:missing|invalid|required)/i.test(raw);
  if (keyError && (status >= 400 || !decodedValid)) return { outcome: 'auth_required', cause: 'needs_key', detail: 'Response explicitly identifies an API key/token requirement.' };
  if (status === 401 || status === 403) return { outcome: 'access_denied', cause: 'unresolved', detail: 'Access denied could be WAF, geography, policy or authentication; status alone is insufficient.' };
  if ([400, 422].includes(status) && /(?:missing|required|provide|invalid)[\s\S]{0,70}(?:parameter|query|param|latitude|longitude|location|symbol|name|country|date)|(?:parameter|query|param)[\s\S]{0,70}(?:missing|required|invalid)/i.test(raw)) return { outcome: 'missing_parameters', cause: 'missing_default_params' };
  if (status === 404) return { outcome: 'http_error', cause: api.reviewedRecipe || api.baselineVerified ? 'dead_upstream' : 'wrong_base_url_path', detail: api.reviewedRecipe || api.baselineVerified ? 'The documented/previously working smoke endpoint returned 404.' : 'Unreviewed root/path returned 404; no claim that the whole service is dead.' };
  if (status >= 300 && status < 400) return { outcome: 'redirect_unresolved', cause: 'redirect_https', detail: 'Redirect needs an explicitly reviewed destination.' };
  if (status < 200 || status >= 300) return { outcome: 'http_error', cause: 'unresolved' };
  if (html(raw)) return { outcome: 'html_instead_of_api', cause: api.notHostedApi ? 'not_hosted_api' : 'wrong_base_url_path', detail: 'HTML proves this tested endpoint is wrong, not that no hosted API exists.' };
  if (tooLarge) return { outcome: 'body_limit', cause: 'gateway_block', detail: 'Response exceeds the shared 256 KiB limit.' };
  if (!decodedValid) return { outcome: 'invalid_response', cause: 'unresolved', detail: 'Response did not satisfy the reviewed response format.' };
  if (!api.freeVerified) return { outcome: 'valid_response_unknown_pricing', cause: 'unknown_pricing' };
  return { outcome: `ok_${api.responseKind ?? 'json'}`, cause: 'ok', ...(trace.some(x => x.redirectTo) ? { redirectFollowed: true } : {}) };
}

export function definitionHash(row) {
  return createHash('sha256').update(JSON.stringify([row.canonicalId, row.baseUrl, row.smokePath, row.responseKind, row.redirectOrigins ?? [], row.pricing, row.pricingSource, row.freeEvidence, row.exclusionEvidence ?? null, row.generatedDefaultSource ?? null, row.responseDecoderHash ?? null, row.transportHash ?? null, AUDIT_POLICY])).digest('hex');
}

/** Select only a documented cheap public GET on the exact named provider/source. */
export function findGeneratedDefault(candidate, providers) {
  for (const provider of providers) {
    if (String(provider.name).toLowerCase().trim() !== candidate.name.toLowerCase().trim()) continue;
    if (safeOrigin(provider.baseUrl) !== safeOrigin(candidate.baseUrl) && provider.sourceUrl !== candidate.baseUrl) continue;
    for (const action of Object.values(provider.actions ?? {})) {
      if (action.method !== 'GET' || action.requiresAuth !== false || !String(action.pathTemplate ?? '').startsWith('/') || /[{}]/.test(action.pathTemplate)) continue;
      if ((action.capabilities ?? []).some(value => ['create', 'update', 'delete', 'send', 'charge', 'transfer'].includes(value))) continue;
      if (/\/(?:signup|register|logout|activate|reset|remove|delete|transfer|charge|subscribe|unsubscribe|verify|send|email|api-key|auth|oauth|login|create|update|set|start|stop)(?:[/?]|$)/i.test(action.pathTemplate)) continue;
      const query = new URLSearchParams();
      let safe = true;
      for (const parameter of action.params ?? []) {
        if (CREDENTIAL_PARAMETERS.test(parameter.name ?? '')) { safe = false; break; }
        if (!parameter.required) continue;
        const value = parameter.default ?? parameter.schema?.default;
        if (parameter.in !== 'query' || !['string', 'number', 'boolean'].includes(typeof value)) { safe = false; break; }
        query.set(parameter.name, String(value));
      }
      if (!safe) continue;
      const path = action.pathTemplate + (query.size ? (action.pathTemplate.includes('?') ? '&' : '?') + query : '');
      return { baseUrl: provider.baseUrl, smokePath: path, sourceUrl: provider.sourceUrl ?? provider.baseUrl };
    }
  }
  return null;
}

/** Match recipes against the entire registry, including APIs outside the old origin pool. */
export function prepareCandidates({ candidates, registry, recipes = [], previous = [], baseline = [], generated = [], exclusions = [], responseDecoderHash, transportHash }) {
  candidates = candidates.map((row, index) => ({ ...(row && typeof row === 'object' ? row : {}), id: typeof row?.id === 'string' ? row.id : `invalid-candidate-${index}`, name: typeof row?.name === 'string' ? row.name : `Invalid candidate ${index}`, baseUrl: typeof row?.baseUrl === 'string' ? row.baseUrl : '', ...(typeof row?.id !== 'string' || typeof row?.name !== 'string' || typeof row?.baseUrl !== 'string' ? { candidateMalformed: true } : {}) }));
  const byName = new Map();
  for (const row of registry) { const name = String(row.name).toLowerCase().trim(); if (!byName.has(name)) byName.set(name, []); byName.get(name).push(row); }
  const chooseRegistry = (name, baseUrl) => { const matches = byName.get(String(name).toLowerCase().trim()) ?? []; return matches.find(row => row.baseUrl === baseUrl) ?? matches.find(row => safeOrigin(row.baseUrl) === safeOrigin(baseUrl)) ?? (matches.length === 1 ? matches[0] : undefined); };
  const generatedByName = new Map();
  for (const provider of generated) { const name = String(provider.name).toLowerCase().trim(); if (!generatedByName.has(name)) generatedByName.set(name, []); generatedByName.get(name).push(provider); }
  const bySlug = new Map();
  for (const row of registry) {
    const id = slug(row.name);
    if (!bySlug.has(id)) bySlug.set(id, row);
  }
  const recipeById = new Map(recipes.map(recipe => [recipe.id, recipe]));
  const candidateIds = new Map();
  for (const row of candidates) candidateIds.set(row.id, (candidateIds.get(row.id) ?? 0) + 1);
  const merged = [...candidates];
  const seen = new Set(merged.map(rowKey));
  for (const recipe of recipes) {
    if (merged.some(row => recipe.name ? row.name.toLowerCase().trim() === recipe.name.toLowerCase().trim() : row.id === recipe.id)) continue;
    const registryRow = recipe.name ? chooseRegistry(recipe.name, recipe.baseUrl) : bySlug.get(recipe.id);
    const extra = { id: recipe.id, name: registryRow?.name ?? recipe.name ?? recipe.id, baseUrl: recipe.baseUrl, origin: safeOrigin(recipe.baseUrl), recipeRegistryMatched: !!registryRow };
    if (!seen.has(rowKey(extra))) { merged.push(extra); seen.add(rowKey(extra)); }
  }
  const previousByKey = new Map(previous.map(row => [rowKey(row), row]));
  const baselineByKey = new Map(baseline.map(row => [rowKey(row), row]));
  return merged.map(candidate => {
    const exactRecipe = recipes.findLast(r => r.name && r.name.toLowerCase().trim() === candidate.name.toLowerCase().trim());
    const idRecipe = recipeById.get(candidate.id);
    const recipeMatchesName = !idRecipe?.name || idRecipe.name.toLowerCase().trim() === candidate.name.toLowerCase().trim();
    const collisionHostMatch = idRecipe && [safeOrigin(idRecipe.baseUrl), safeOrigin(idRecipe.docsUrl)].includes(safeOrigin(candidate.baseUrl));
    const recipe = exactRecipe ?? (recipeMatchesName && ((candidateIds.get(candidate.id) ?? 0) === 1 || collisionHostMatch) ? idRecipe : undefined);
    const source = chooseRegistry(candidate.name, candidate.baseUrl) ?? (bySlug.get(candidate.id)?.name.toLowerCase().trim() === candidate.name.toLowerCase().trim() ? bySlug.get(candidate.id) : undefined);
    const prior = previousByKey.get(rowKey(candidate));
    const old = baselineByKey.get(rowKey(candidate));
    const baselineVerified = old?.verified === true || prior?.verified === true;
    const generatedDefault = !recipe && !baselineVerified && (!prior?.smokePath || prior.smokePath === '/') && (!old?.smokePath || old.smokePath === '/') ? findGeneratedDefault(candidate, generatedByName.get(candidate.name.toLowerCase().trim()) ?? []) : null;
    let baseUrl = recipe?.baseUrl ?? (baselineVerified ? prior?.baseUrl : undefined) ?? generatedDefault?.baseUrl ?? candidate.baseUrl;
    let httpsUpgraded = false;
    try { const parsed = new URL(baseUrl); if (parsed.protocol === 'http:') { parsed.protocol = 'https:'; baseUrl = parsed.href; httpsUpgraded = true; } } catch { /* Bad candidates are recorded, never abort the sweep. */ }
    const smokePath = recipe?.smokePath ?? generatedDefault?.smokePath ?? prior?.smokePath ?? old?.smokePath ?? '/';
    const pricing = recipe?.pricing ?? source?.pricing ?? prior?.pricing ?? 'unknown';
    const reviewedFree = recipe?.pricing === 'free' && !!recipe.pricingSource && !!recipe.freeEvidence;
    const originalFree = String(source?.pricing).toLowerCase() === 'free';
    const exclusion = exclusions.find(value => value.name ? value.name.toLowerCase().trim() === candidate.name.toLowerCase().trim() : value.id === candidate.id && candidateIds.get(candidate.id) === 1);
    const row = {
      ...candidate,
      ...(responseDecoderHash ? { responseDecoderHash } : {}), ...(transportHash ? { transportHash } : {}),
      ...(exclusion ? { exclusionEvidence: exclusion } : {}), canonicalId: recipe?.canonicalId ?? (candidate.id === 'frankfurterapi' ? 'frankfurter' : candidate.id),
      sourceUrl: candidate.baseUrl, baseUrl, origin: safeOrigin(baseUrl), smokePath,
      canonicalExplicit: !!recipe?.canonicalId || candidate.id === 'frankfurterapi',
      docsUrl: recipe?.docsUrl ?? source?.docsUrl ?? '', pricing,
      pricingSource: recipe?.pricingSource ?? (originalFree ? source?.docsUrl || candidate.baseUrl : null),
      freeEvidence: recipe?.freeEvidence ?? (originalFree ? 'Existing full-registry pricing explicitly labels this API free; no inference from successful HTTP alone.' : null),
      freeVerified: reviewedFree || originalFree, reviewedRecipe: !!recipe, baselineVerified, httpsUpgraded, ...(recipe?.notHostedApi ? { notHostedApi: true } : {}),
      ...(generatedDefault ? { generatedDefaultSource: generatedDefault.sourceUrl } : {}),
      responseKind: recipe?.responseKind ?? prior?.responseKind ?? 'json',
      ...(recipe?.redirectOrigins?.length ? { redirectOrigins: recipe.redirectOrigins } : prior?.redirectOrigins?.length ? { redirectOrigins: prior.redirectOrigins } : {}),
      baseline: old ? { checkedAt: old.checkedAt, status: old.status, outcome: old.outcome, verified: old.verified } : null,
      repairs: [],
    };
    if (httpsUpgraded) row.repairs.push({ cause: 'redirect_https', from: candidate.baseUrl, to: baseUrl, source: 'Same-host HTTPS upgrade; never HTTP fallback or insecure TLS.' });
    if (generatedDefault && generatedDefault.baseUrl !== candidate.baseUrl) row.repairs.push({ cause: 'wrong_base_url_path', from: candidate.baseUrl, to: generatedDefault.baseUrl, source: generatedDefault.sourceUrl });
    if (recipe && candidate.baseUrl.replace(/\/$/, '') !== recipe.baseUrl.replace(/\/$/, '')) row.repairs.push({ cause: /^http:/.test(candidate.baseUrl) && candidate.baseUrl.replace(/^http:/, 'https:').replace(/\/$/, '') === recipe.baseUrl.replace(/\/$/, '') ? 'redirect_https' : 'wrong_base_url_path', from: candidate.baseUrl, to: recipe.baseUrl, source: recipe.docsUrl });
    if (recipe && (old?.smokePath ?? '/') !== recipe.smokePath && recipe.smokePath.includes('?')) row.repairs.push({ cause: 'missing_default_params', from: old?.smokePath ?? '/', to: recipe.smokePath, source: recipe.docsUrl });
    row.definitionHash = definitionHash(row);
    return row;
  });
}

function safeOrigin(value) { try { return new URL(value).origin; } catch { return null; } }
function endpointKey(row) { try { return buildProbeUrl(row).href; } catch { return `invalid:${rowKey(row)}`; } }

/** Union canonical IDs and exact canonical base URLs; never count aliases/actions twice. */
export function canonicalGroups(rows) {
  const parents = rows.map((_, i) => i);
  const find = (i) => parents[i] === i ? i : (parents[i] = find(parents[i]));
  const keys = new Map();
  rows.forEach((row, i) => {
    for (const key of [...(row.canonicalExplicit ? [`id:${row.canonicalId}`] : []), `endpoint:${endpointKey(row)}`]) {
      if (keys.has(key)) parents[find(i)] = find(keys.get(key)); else keys.set(key, i);
    }
  });
  const groups = new Map();
  rows.forEach((row, i) => { const key = find(i); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(row); });
  return [...groups.values()].map(group => {
    const sorted = [...group].sort((a, b) => Number(!!a.exclusionEvidence) - Number(!!b.exclusionEvidence) || Number(b.reviewedRecipe) - Number(a.reviewedRecipe) || Number(b.baselineVerified) - Number(a.baselineVerified) || Number(b.id === b.canonicalId) - Number(a.id === a.canonicalId) || a.id.localeCompare(b.id) || a.name.localeCompare(b.name));
    return { representative: sorted[0], aliases: sorted.slice(1), rows: group };
  });
}

/** Hold each origin until response headers arrive and space starts by one second. */
export function createOriginLimiter({ delayMs = 1000, now = Date.now, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  const locks = new Map();
  const nextAt = new Map();
  return async function limited(origin, action, signal) {
    const previous = locks.get(origin) ?? Promise.resolve();
    let release;
    const lock = new Promise(resolve => { release = resolve; });
    locks.set(origin, lock);
    await previous;
    try {
      const wait = Math.max(0, (nextAt.get(origin) ?? 0) - now());
      if (wait) await sleep(wait);
      signal?.throwIfAborted();
      nextAt.set(origin, now() + delayMs);
      return await action();
    } finally { release(); }
  };
}

async function boundedBody(response, maxBytes = MAX_BYTES) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let raw = '', bytes = 0;
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) { await reader.cancel(); return { raw: raw.slice(0, 512) || decoder.decode(value.subarray(0, 512)), bytes, tooLarge: true }; }
    raw += decoder.decode(value, { stream: true });
  }
  return { raw: raw + decoder.decode(), bytes, tooLarge: false };
}

/** Official signup evidence helps explain requirements, but optional-key APIs stay probeable. */
export function findKeyEvidence(api, keyReport) {
  if (api.reviewedRecipe) return null;
  const optionalKeys = new Set(['openalex', 'ip2location', 'exchangerate-api', 'coingecko', 'ipinfo']);
  const name = api.name.toLowerCase().trim();
  const row = keyReport?.recommendations?.find(r => !optionalKeys.has(r.id) && r.registryMatches?.some(alias => alias.toLowerCase().trim() === name));
  return row ? { source: row.docsUrl, provider: row.provider, detail: 'Official documented API key signup product; no key is available to this keyless audit.' } : null;
}

export async function probeCandidate(api, dependencies) {
  const checkedAt = new Date().toISOString();
  const started = Date.now();
  const trace = [];
  let status = 0, body = {}, error, probeUrl;
  const base = { ...api, checkedAt, status, verified: false, trace };
  try {
    if (api.candidateMalformed) return { ...base, outcome: 'malformed_candidate', cause: 'unresolved', detail: 'Candidate lacks a valid ID/name/base URL; no request dispatched.', latencyMs: 0 };
    if (api.exclusionEvidence) return { ...base, outcome: 'reviewed_exclusion', cause: api.exclusionEvidence.cause, detail: api.exclusionEvidence.evidence, exclusionSource: api.exclusionEvidence.docsUrl, latencyMs: 0 };
    if (api.recipeRegistryMatched === false) return { ...base, outcome: 'unresolved', cause: 'unresolved', detail: 'Recipe ID/name did not match the full registry.', latencyMs: 0 };
    let target;
    try { target = buildProbeUrl(api); } catch { return { ...base, outcome: 'invalid_url', cause: 'wrong_base_url_path', detail: 'Invalid or unpinned base URL/path.', latencyMs: 0 }; }
    if (docsUrl(target)) return { ...base, probeUrl: target.href, outcome: 'documentation_url', cause: 'wrong_base_url_path', detail: 'Catalog points to a documentation/specification host, not a hosted API. No request dispatched.', latencyMs: 0 };
    if (target.protocol === 'http:') return { ...base, probeUrl: target.href, outcome: 'https_not_reviewed', cause: 'redirect_https', detail: 'HTTP catalog URL has no reviewed HTTPS replacement. No HTTP request dispatched.', latencyMs: 0 };
    if ([...target.searchParams.keys()].some(key => CREDENTIAL_PARAMETERS.test(key))) return { ...base, outcome: 'credential_query_blocked', cause: 'gateway_block', detail: 'Credential-shaped query parameter prohibited in keyless probes.', latencyMs: 0 };
    if (!dependencies.isSafePublicApiBaseUrl(target.href) || target.origin !== api.origin) return { ...base, outcome: 'unsafe_url', cause: 'gateway_block', detail: 'Shared gateway URL safety check rejected the target.', latencyMs: 0 };
    probeUrl = target.href;
    const keyEvidence = findKeyEvidence(api, dependencies.keyReport);
    if (keyEvidence) return { ...base, probeUrl: target.href, outcome: 'key_documented', cause: 'needs_key', keyEvidence, latencyMs: 0 };
    const tracedFetch = async (url, options) => dependencies.limit(new URL(url).origin, async () => {
      if ([...new URL(url).searchParams.keys()].some(key => CREDENTIAL_PARAMETERS.test(key))) throw new Error('Unsafe public API credential query');
      const hop = { url: safeTraceUrl(url), startedAt: new Date().toISOString() };
      trace.push(hop);
      try {
        const response = await dependencies.fetch(url, options);
        hop.status = response.status;
        hop.contentType = response.headers.get('content-type');
        if (response.headers.has('location')) hop.redirectTo = safeTraceUrl(new URL(response.headers.get('location'), url).href);
        if (response.headers.has('retry-after')) hop.retryAfter = response.headers.get('retry-after');
        return response;
      } catch (caught) { hop.errorCause = errorFacts(caught); throw caught; }
    }, options?.signal);
    const response = await dependencies.fetchWorkspacePublicGet(api, target, { fetch: tracedFetch, ...(dependencies.sleep ? { sleep: dependencies.sleep } : {}) });
    status = response.status;
    body = await boundedBody(response);
    const decoded = dependencies.decodePublicApiResponse(api, body.raw, response.headers.get('content-type') ?? '');
    const classification = classifyResult({ status, raw: body.raw, decodedValid: decoded.valid, tooLarge: body.tooLarge, api, trace });
    return { ...base, probeUrl: target.href, finalProbeUrl: trace.at(-1)?.url ?? target.href, status, responseBytes: body.bytes, bodyTruncated: body.tooLarge, ...classification, latencyMs: Date.now() - started, verified: classification.cause === 'ok' };
  } catch (caught) {
    error = caught;
    status = trace.filter(hop => hop.status).at(-1)?.status ?? status;
    const redirected = trace.at(-1)?.redirectTo;
    const unsafeRedirect = !!redirected && new URL(redirected).protocol === 'https:' && !dependencies.isSafePublicApiBaseUrl(redirected);
    return { ...base, ...(probeUrl ? { probeUrl } : {}), status, ...classifyResult({ error, api, trace, unsafeRedirect }), latencyMs: Date.now() - started };
  }
}

export async function auditCandidates(rows, { previous = [], only, resume = false, dependencies, onProgress = () => {}, onCheckpoint = () => {} }) {
  const groups = canonicalGroups(rows);
  const results = new Map();
  let next = 0, completed = 0;
  const wanted = (row) => !only || only.some(value => value === row.id || value === row.canonicalId || value.toLowerCase() === row.name.toLowerCase());
  const byPrevious = new Map(previous.map(row => [rowKey(row), row]));
  async function worker() {
    while (next < groups.length) {
      const group = groups[next++];
      const api = group.representative;
      const prior = byPrevious.get(rowKey(api));
      const shouldProbe = group.rows.some(wanted) && !(resume && prior?.definitionHash === api.definitionHash && prior?.checkedAt);
      let result;
      if (shouldProbe) result = await probeCandidate(api, dependencies);
      else if (prior) result = { ...prior, reused: true }; // Preserve original evidence and timestamp.
      else result = { ...api, checkedAt: null, status: 0, outcome: 'not_checked', cause: 'unresolved', verified: false, latencyMs: null, trace: [], detail: 'Outside --only selection; no previous result for the same ID and name.' };
      const canonicalId = api.canonicalId;
      results.set(rowKey(api), { ...result, canonicalId });
      for (const alias of group.aliases) {
        const aliasPrior = byPrevious.get(rowKey(alias));
        const retained = !shouldProbe && aliasPrior ? { ...aliasPrior, reused: true } : alias;
        results.set(rowKey(alias), { ...retained, canonicalId, checkedAt: shouldProbe ? result.checkedAt : retained.checkedAt ?? result.checkedAt, status: result.status,
          verified: false, outcome: 'duplicate', cause: 'duplicate', duplicateOf: api.id, canonicalVerified: result.verified,
          canonicalProbeUrl: result.probeUrl ?? null, detail: 'Alias shares a reviewed canonical ID or exact canonical base endpoint; request/result counted once.', trace: [] });
      }
      completed++;
      onProgress(completed, groups.length);
      if (completed % 25 === 0 || completed === groups.length) onCheckpoint([...results.values()]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(8, groups.length) }, worker));
  const ordered = rows.map(row => results.get(rowKey(row)));
  const verifiedTargets = new Map();
  for (const row of ordered) {
    if (!row.verified) continue;
    const target = row.finalProbeUrl ?? row.probeUrl;
    const previous = target && verifiedTargets.get(target);
    if (previous) Object.assign(row, { verified: false, canonicalId: previous.canonicalId, outcome: 'duplicate', cause: 'duplicate', duplicateOf: previous.id, canonicalVerified: true, detail: 'Approved redirects converge on the identical tested endpoint; counted once.' });
    else if (target) verifiedTargets.set(target, row);
  }
  return ordered;
}

/** Preserve historical IDs but give distinct services with colliding slugs stable runtime IDs. */
export function disambiguateCanonicalIds(results) {
  // Repair old repeated suffixes without stripping legitimate recipe IDs. A generated
  // suffix is recognized only when it matches this row's original source hash.
  for (const row of results) {
    const sourceHash = createHash('sha256').update(String(row.sourceUrl ?? row.baseUrl)).digest('hex').slice(0, 8);
    const suffix = `-${sourceHash}`;
    let base = row.canonicalBaseId ?? row.canonicalId;
    while (base.endsWith(suffix)) base = base.slice(0, -suffix.length);
    row.canonicalBaseId = base;
    if (row.canonicalId.endsWith(suffix)) row.canonicalId = `${base}${suffix}`;
  }
  const groups = new Map();
  for (const row of results.filter(row => row.cause !== 'duplicate')) {
    if (!groups.has(row.canonicalId)) groups.set(row.canonicalId, []);
    groups.get(row.canonicalId).push(row);
  }
  for (const [canonicalId, rows] of groups) {
    if (rows.length < 2) continue;
    const assignments = rows.map(row => ({ row, original: canonicalId, target: row.finalProbeUrl ?? row.probeUrl ?? endpointKey(row), next: `${row.canonicalBaseId}-${createHash('sha256').update(String(row.sourceUrl ?? row.baseUrl)).digest('hex').slice(0, 8)}` }));
    for (const assignment of assignments) assignment.row.canonicalId = assignment.next;
    for (const alias of results.filter(row => row.cause === 'duplicate' && row.canonicalId === canonicalId)) {
      const owner = assignments.find(value => alias.canonicalProbeUrl && value.target === alias.canonicalProbeUrl)
        ?? assignments.find(value => value.row.id === alias.duplicateOf && endpointKey(value.row) === endpointKey(alias));
      if (owner) alias.canonicalId = owner.next;
    }
  }
  return results;
}

/** Correct only facts preserved in old traces; never invent an unstored body or key. */
export function applyRecordedEvidence(results, exclusions = [], safeUrl) {
  for (const row of results) {
    const last = row.trace?.at(-1);
    const codes = row.errorCause?.map(item => item.code ?? '') ?? [];
    if (codes.some(code => /^(?:ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT|UND_ERR_HEADERS_TIMEOUT|UND_ERR_BODY_TIMEOUT)$/.test(code))) Object.assign(row, { outcome: 'timeout', cause: 'timeout', verified: false });
    else if (codes.some(code => /CERT_|TLS_|_SSL_|SELF_SIGNED|UNABLE_TO_VERIFY/.test(code))) Object.assign(row, { outcome: 'tls_error', cause: 'redirect_https', verified: false });
    if (row.outcome === 'body_limit' && row.status >= 200 && row.status < 300 && /text\/html/i.test(last?.contentType ?? '')) {
      Object.assign(row, { outcome: 'html_instead_of_api', cause: 'wrong_base_url_path', detail: 'Oversized response declared text/html in the recorded trace; wrong endpoint, not proof of no hosted API.', verified: false });
    }
    if (row.cause === 'gateway_block' && row.errorCause?.some(item => item.reason === 'redirect_not_approved') && last?.redirectTo) {
      let unsafe = true;
      try { const url = new URL(last.redirectTo); unsafe = url.protocol === 'https:' && (safeUrl ? !safeUrl(url.href) : /^(?:localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(url.hostname)); } catch { /* Invalid redirects remain blocked. */ }
      if (!unsafe) Object.assign(row, { outcome: 'redirect_not_approved', cause: 'redirect_https', detail: 'Recorded redirect needs a reviewed HTTPS destination; not an unsafe/private target.', verified: false });
    }
  }
  const byId = new Map();
  for (const row of results) byId.set(row.id, (byId.get(row.id) ?? 0) + 1);
  const blocked = new Map();
  for (const row of results) {
    const exclusion = exclusions.find(value => value.name ? value.name.toLowerCase().trim() === row.name.toLowerCase().trim() : value.id === row.id && byId.get(row.id) === 1);
    if (exclusion) blocked.set(row.canonicalId, exclusion);
  }
  for (const row of results) {
    const exclusion = blocked.get(row.canonicalId);
    if (!exclusion) continue;
    Object.assign(row, { verified: false, canonicalVerified: false, exclusionEvidence: exclusion, exclusionSource: exclusion.docsUrl });
    if (row.cause !== 'duplicate') Object.assign(row, { outcome: 'reviewed_exclusion', cause: exclusion.cause, detail: exclusion.evidence });
  }
  return results;
}

export function causeCounts(results) {
  const counts = Object.fromEntries(AUDIT_CAUSES.map(cause => [cause, 0]));
  for (const row of results) counts[row.cause ?? 'unresolved'] = (counts[row.cause ?? 'unresolved'] ?? 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

export function summarize(results) {
  const tally = field => Object.fromEntries([...results.reduce((map, row) => map.set(row[field] ?? 'unrecorded', (map.get(row[field] ?? 'unrecorded') ?? 0) + 1), new Map())].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
  return { candidateCount: results.length, verifiedCount: results.filter(row => row.verified).length, causes: causeCounts(results), outcomes: tally('outcome'),
    uncheckedCount: results.filter(row => !row.checkedAt).length, reusedCount: results.filter(row => row.reused).length,
    repairedAndVerified: results.filter(row => row.verified && row.repairs?.length).map(row => ({ id: row.id, causes: [...new Set(row.repairs.map(repair => repair.cause))] })) };
}

export function makeBaseline(report, commit = '2ef36ab') {
  return { commit, checkedAt: report.checkedAt, candidateCount: report.candidateCount, verifiedCount: report.verifiedCount,
    outcomes: summarize(report.results).outcomes, verifiedIds: report.results.filter(row => row.verified).map(row => row.id).sort(),
    results: report.results.map(({ id, name, baseUrl, smokePath, pricing, checkedAt, status, outcome, verified }) => ({ id, name, baseUrl, smokePath, pricing, checkedAt, status, outcome, verified })) };
}

export function makeReport(results, baseline, { checkedAt = new Date().toISOString(), only, lastFullSweepAt, exclusions = [], safeUrl, managedApprovedCount = null } = {}) {
  disambiguateCanonicalIds(results);
  applyRecordedEvidence(results, exclusions, safeUrl);
  const originalCohort = baseline.results.map(old => ({ old, current: results.find(row => row.id === old.id && row.name.toLowerCase().trim() === old.name.toLowerCase().trim()) }));
  const originalFailed = originalCohort.filter(item => !item.old.verified);
  const currentOrMissing = item => item.current ?? { cause: 'unresolved', verified: false };
  const originalCohortSummary = { cohortRows: baseline.candidateCount, matchedRows: originalCohort.filter(item => item.current).length, currentlyVerifiedCanonicalRows: originalCohort.filter(item => item.current?.verified).length, currentDuplicateRows: originalCohort.filter(item => item.current?.cause === 'duplicate').length, currentDiscoveryRows: originalCohort.filter(item => !item.current?.verified && item.current?.cause !== 'duplicate').length, missingRows: originalCohort.filter(item => !item.current).map(item => ({ id: item.old.id, name: item.old.name })), originallyVerifiedRows: baseline.verifiedCount, originallyFailingRows: originalFailed.length, currentCauses: causeCounts(originalCohort.map(currentOrMissing)), formerlyFailingCurrentCauses: causeCounts(originalFailed.map(currentOrMissing)), formerlyFailingNowVerifiedCanonicalRows: originalFailed.filter(item => item.current?.verified).length, note: 'Cohort matching uses historical ID and exact normalized name, not normalized ID alone. Counts are candidate rows including aliases; expanded candidates are separate. Missing rows are unresolved, not presumed dead or key-required. Current causes do not rewrite original outcomes.' };
  return { checkedAt, policy: AUDIT_POLICY, sweepComplete: !only && results.every(row => row.checkedAt), mode: only ? 'partial-recheck' : 'full-sweep', lastFullSweepAt: only ? lastFullSweepAt ?? null : checkedAt,
    ...summarize(results), managedApprovedCount, customerExecutableCatalogCount: managedApprovedCount === null ? null : results.filter(row => row.verified).length + managedApprovedCount, additionalVerifiedApisNeededFor1000: managedApprovedCount === null ? null : Math.max(0, 1000 - results.filter(row => row.verified).length - managedApprovedCount), signupsNeededFor1000: null, originalCohortSummary, baseline, comparison: {
      previouslyVerifiedStillWorking: baseline.verifiedIds.filter(id => results.some(row => row.id === id && (row.verified || row.canonicalVerified))),
      previouslyVerifiedNoLongerVerified: baseline.verifiedIds.filter(id => !results.some(row => row.id === id && (row.verified || row.canonicalVerified))),
      note: 'Baseline preserves the original 1,002-row outcomes. Their old network/403 errors lack sufficient evidence for retrospective key/CORS/root-cause claims. Current rows provide traces and specific causes.' }, results };
}

/** Apply complete authenticated customer proof without promoting upstream-only rows. */
export function applyCustomerGatewayEvidence(report, proof) {
  const before = proof?.before;
  const after = proof?.after;
  if (!before || !after || !isDeepStrictEqual(before, after)) throw new Error('Customer gateway proof requires identical before/after billing snapshots');
  if (!Array.isArray(proof?.results) || !proof.results.length) throw new Error('Customer gateway proof results are missing');
  if (!proof.verifiedAt || !Number.isFinite(Date.parse(proof.verifiedAt))) throw new Error('Customer gateway proof verification date is missing');
  let preview;
  try { const url = new URL(proof.preview); if (url.protocol !== 'https:') throw new Error(); preview = url.origin; } catch { throw new Error('Customer gateway proof requires an HTTPS preview origin'); }
  const next = structuredClone(report);
  const eligible = next.results.filter(row => row.verified);
  const normalized = value => String(value ?? '').toLowerCase().trim();
  const used = new Set();
  const matched = eligible.map(row => {
    let matches = proof.results.filter(item => item.id === row.canonicalId);
    if (!matches.length) matches = proof.results.filter(item => item.id === row.id);
    if (matches.length > 1) matches = matches.filter(item => normalized(item.name) === normalized(row.name));
    if (!matches.length) matches = proof.results.filter(item => normalized(item.name) === normalized(row.name));
    if (matches.length !== 1 || used.has(matches[0]) || typeof matches[0].success !== 'boolean') throw new Error('Customer gateway proof requires one unique result for every callable API');
    used.add(matches[0]); return [row, matches[0]];
  });
  const disabled = new Set(proof.health?.disabledIds ?? []);
  const failed = new Map();
  for (const [row, result] of matched) {
    const status = Number.isInteger(result.status) && result.status >= 0 && result.status <= 599 ? result.status : 0;
    const healthDisabled = disabled.has(row.canonicalId) || disabled.has(row.id);
    const success = result.success === true && status >= 200 && status < 300 && result.discovery !== true && !healthDisabled;
    const gatewayVerification = { verifiedAt: proof.verifiedAt, preview, status, success, healthDisabled,
      latencyMs: Number.isFinite(result.latencyMs) && result.latencyMs >= 0 ? Math.round(result.latencyMs) : null,
      route: result.route === '/v1/execute' ? result.route : 'customer-gateway',
      errorCode: typeof result.errorCode === 'string' && /^[A-Z0-9_.:-]{1,64}$/i.test(result.errorCode) ? result.errorCode : null };
    row.upstreamVerified ??= row.verified; row.upstreamOutcome ??= row.outcome;
    row.gatewayVerification = gatewayVerification;
    if (!success) { row.verified = false; row.cause = status === 429 ? 'rate_limit' : 'unresolved'; row.outcome = 'customer_gateway_failed'; failed.set(row.canonicalId, gatewayVerification); }
  }
  for (const row of next.results) if (row.cause === 'duplicate' && failed.has(row.canonicalId)) {
    row.canonicalVerified = false; row.gatewayVerification = { ...failed.get(row.canonicalId) }; row.outcome = 'canonical_customer_gateway_failed';
  }
  const updated = makeReport(next.results, next.baseline, { checkedAt: next.checkedAt, only: next.mode === 'partial-recheck' ? ['preserved-upstream-sweep'] : undefined, lastFullSweepAt: next.lastFullSweepAt, managedApprovedCount: next.managedApprovedCount });
  return { ...next, ...updated, checkedAt: report.checkedAt, lastFullSweepAt: report.lastFullSweepAt, sweepComplete: report.sweepComplete, mode: report.mode,
    customerGatewayVerification: { verifiedAt: proof.verifiedAt, preview, authentication: 'authenticated-customer-workspace', billingUnchanged: true, complete: true, testedCanonicalCount: eligible.length, passedCanonicalCount: eligible.length - failed.size, demotedCanonicalCount: failed.size,
      note: 'Complete customer gateway batch supplied by the operator. Billing snapshots were compared in memory; workspace identifiers, credentials and raw snapshots are not persisted. This proof never promotes discovery rows.' } };
}

const cell = value => String(value ?? '-').replaceAll('|', '/').replace(/[\r\n]/g, ' ');
export function renderMarkdown(report) {
  const lines = ['# Callable API audit', '', `Checked: ${report.checkedAt}. Mode: ${report.mode}. Complete sweep: ${report.sweepComplete ? 'yes' : 'no'}.`, '',
    `**${report.verifiedCount} canonical free APIs verified from ${report.candidateCount} candidate/alias rows.** The site separately adds its existing approved managed providers; this sweep makes no managed or credentialed calls. The managed-only \`customerExecutableProviderCount\` is not the full \`totalCallable\`. Unknown pricing remains discovery even after HTTP 200.`, '',
    ...(report.customerGatewayVerification ? [`Customer gateway verification: ${report.customerGatewayVerification.verifiedAt}, preview ${report.customerGatewayVerification.preview}. ${report.customerGatewayVerification.passedCanonicalCount}/${report.customerGatewayVerification.testedCanonicalCount} authenticated customer calls passed; ${report.customerGatewayVerification.demotedCanonicalCount} were demoted. Billing snapshots were identical. Upstream checkedAt/HTTP/latency remain the original upstream evidence; bounded per-row gatewayVerification records the separate customer result.`, ''] : []),
    ...(report.customerExecutableCatalogCount === null ? [] : [`Catalog arithmetic: ${report.verifiedCount} measured free APIs + ${report.managedApprovedCount} existing approved managed providers = **${report.customerExecutableCatalogCount} catalog-callable APIs**. This keyless audit does not retest paid managed providers. Reaching 1,000 requires ${report.additionalVerifiedApisNeededFor1000} additional distinct verified APIs. **The required number of signups is unknown**, because credentials, rights, working adapters and overlap have not been established. Remaining wrong endpoints/unresolved services may still provide additional APIs; this is not proof of a global maximum.`, '']),
    `Policy: ${report.policy}`, '', 'CORS is a browser rule and does not block server-to-server gateway execution. HTTP 401/403 alone does not establish a key requirement. Documentation/spec URLs are not hosted API endpoints. HTML, malformed/unsupported responses and oversized bodies do not qualify.', '',
    '## Baseline and current evidence', '', `Immutable baseline: commit ${report.baseline.commit}, ${report.baseline.checkedAt}; ${report.baseline.candidateCount} rows, ${report.baseline.verifiedCount} working free APIs (16 site cards after three managed providers). The old advertised ~1,005 figure described eligibility guesses, not successful calls.`, '',
    '| Original outcome | Rows |', '| --- | ---: |', ...Object.entries(report.baseline.outcomes).map(([cause, count]) => `| ${cell(cause)} | ${count} |`), '',
    '## Original cohort: current evidence', '',
    `The original cohort has ${report.originalCohortSummary.cohortRows} rows: ${report.originalCohortSummary.originallyVerifiedRows} were verified and **${report.originalCohortSummary.originallyFailingRows} originally failed**. ${report.originalCohortSummary.matchedRows} match current evidence by ID and exact normalized name. ${report.originalCohortSummary.formerlyFailingNowVerifiedCanonicalRows} formerly failing rows now represent independently verified canonical APIs. Current status: ${report.originalCohortSummary.currentlyVerifiedCanonicalRows} verified canonical rows, ${report.originalCohortSummary.currentDuplicateRows} duplicate rows, ${report.originalCohortSummary.currentDiscoveryRows} discovery rows. These are row counts, not extra APIs per alias.`, '',
    '| Current cause | All original cohort rows | Originally failing rows only |', '| --- | ---: | ---: |',
    ...Object.entries(report.originalCohortSummary.currentCauses).map(([cause, count]) => `| ${cell(cause)} | ${count} | ${report.originalCohortSummary.formerlyFailingCurrentCauses[cause] ?? 0} |`), '',
    report.originalCohortSummary.note, '',
    '## Expanded sweep: current evidence', '',
    `The following table covers all ${report.candidateCount} expanded candidate/alias rows. It must not be presented as a breakdown of the original ${report.originalCohortSummary.originallyFailingRows} failures. Zeroes are explicit, including missing_default_params when no current response proves that cause.`, '',
    '| Current cause | Expanded rows |', '| --- | ---: |', ...Object.entries(report.causes).map(([cause, count]) => `| ${cell(cause)} | ${count} |`), '',
    `Previously verified still working or represented by a verified canonical alias: ${report.comparison.previouslyVerifiedStillWorking.length}/${report.baseline.verifiedCount}. Previously verified requiring attention: ${report.comparison.previouslyVerifiedNoLongerVerified.join(', ') || 'none'}. Reused rows: ${report.reusedCount}. Unchecked rows: ${report.uncheckedCount}.`, '',
    report.comparison.note, '', '## Re-run', '', 'Install dependencies with `npm ci`, then run `node scripts/audit-callable.mjs` (loads the shared TypeScript transport through tsx). First run `node --check scripts/audit-callable.mjs` and `node --test scripts/audit-callable.test.mjs`.', '',
    'A targeted check uses `--only=frankfurter,nagerdate --output-dir=/tmp/apiclaw-targeted-audit`. Unselected rows retain previous evidence and timestamps when ID and name match; rows without prior evidence stay explicitly unchecked. `--resume` reuses only rows with matching definition hashes. `--checkpoint=/tmp/apiclaw-callable-checkpoint.json` writes bounded progress snapshots for restart with the same option plus `--resume`. A partial check is not a new full-sweep proof; lastFullSweepAt preserves the last full coverage timestamp. The GitHub scheduled audit uploads evidence for review and does not promote or deploy new entries. Separately, the native Convex publicApiHealth.recheck weekly job can automatically demote unhealthy free APIs through the live health overlay. Successful audit additions still require a reviewed manifest refresh and deployment.', '',
    '## Canonical endpoints repaired and verified', '', '| API | Repaired cause |', '| --- | --- |',
    ...report.repairedAndVerified.map(row => `| ${cell(row.id)} | ${row.causes.join(', ')} |`), '',
    '## Full results and sources', '', 'Per-hop redirects/retries, original baseline outcomes and bounded error-cause chains are in [the JSON evidence](callable-audit.json). No credentials or upstream response bodies are stored.', '',
    '| API / canonical ID | Tested GET | HTTP | Cause / outcome | Free evidence | Latency ms | Result |', '| --- | --- | ---: | --- | --- | ---: | --- |'];
  for (const row of report.results) {
    const probe = row.probeUrl || row.canonicalProbeUrl;
    const source = row.pricingSource ? `[${cell(row.pricing)}](${row.pricingSource})` : cell(row.pricing);
    lines.push(`| ${cell(row.name)} / ${cell(row.canonicalId)} | ${probe ? `[GET](${probe})` : '-'} | ${row.status} | ${cell(row.cause)} / ${cell(row.outcome)} | ${source} | ${cell(row.latencyMs)} | ${row.verified ? 'callable' : row.cause === 'duplicate' && row.canonicalVerified !== false ? `alias of ${cell(row.duplicateOf)}` : 'discovery'} |`);
  }
  return lines.join('\n') + '\n';
}

export async function runAudit(argv = process.argv.slice(2)) {
  const value = flag => argv.find(arg => arg.startsWith(`${flag}=`))?.slice(flag.length + 1);
  const only = value('--only')?.split(',').map(v => v.trim()).filter(Boolean);
  const outputDirectory = resolve(value('--output-dir') ?? resolve(ROOT, 'docs/ops'));
  const checkpointPath = value('--checkpoint') ? resolve(value('--checkpoint')) : null;
  const previousReport = readJson(resolve(ROOT, 'docs/ops/callable-audit.json'), { results: [] });
  if (argv.includes('--resume') && checkpointPath) {
    const checkpoint = readJson(checkpointPath, { results: [] });
    const retained = new Map(previousReport.results.map(row => [rowKey(row), row]));
    for (const row of checkpoint.results) retained.set(rowKey(row), row);
    previousReport.results = [...retained.values()];
  }
  let baseline = previousReport.baseline;
  if (!baseline) {
    const original = JSON.parse(execFileSync('git', ['show', '2ef36ab:docs/ops/callable-audit.json'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
    baseline = makeBaseline(original);
  }
  const registry = readJson(resolve(ROOT, 'src/registry/apis.json'), {}).apis ?? [];
  const generated = readJson(resolve(ROOT, 'src/registry/generated-providers.json'), {}).providers ?? [];
  const recipes = ['src/public-api-recipes-am.json', 'src/public-api-recipes-nz.json', 'src/public-api-recipes-reviewed.json', 'src/public-api-recipes-rescue.json', 'src/public-api-recipes-rescue-extra.json'].flatMap(path => readJson(resolve(ROOT, path), []));
  const exclusions = readJson(resolve(ROOT, 'src/public-api-exclusions.json'), []);
  const responseDecoderHash = createHash('sha256').update(readFileSync(resolve(ROOT, 'src/workspace-public-response.ts'))).digest('hex');
  const transportHash = createHash('sha256').update(readFileSync(resolve(ROOT, 'src/workspace-public-transport.ts'))).digest('hex');
  const candidates = prepareCandidates({ candidates: readJson(resolve(ROOT, 'src/workspace-public-api-candidates.json'), []), registry, recipes, generated, exclusions, responseDecoderHash, transportHash, previous: previousReport.results, baseline: baseline.results });
  const { tsImport } = await import('tsx/esm/api');
  const transport = await tsImport('../src/workspace-public-transport.ts', import.meta.url);
  const response = await tsImport('../src/workspace-public-response.ts', import.meta.url);
  const urls = await tsImport('../src/workspace-public-apis.ts', import.meta.url);
  const productTruth = await tsImport('../src/product-truth.ts', import.meta.url);
  const results = await auditCandidates(candidates, { previous: previousReport.results, only, resume: argv.includes('--resume'), dependencies: {
    fetch, fetchWorkspacePublicGet: transport.fetchWorkspacePublicGet, decodePublicApiResponse: response.decodePublicApiResponse,
    isSafePublicApiBaseUrl: urls.isSafePublicApiBaseUrl, limit: createOriginLimiter(), keyReport: readJson(resolve(ROOT, 'docs/ops/free-api-key-signups.json'), null),
  }, onProgress: (done, total) => { if (done % 100 === 0 || done === total) console.log(`Processed ${done}/${total} canonical groups`); },
  onCheckpoint: partial => { if (checkpointPath) { mkdirSync(dirname(checkpointPath), { recursive: true }); writeFileSync(checkpointPath, JSON.stringify({ checkedAt: new Date().toISOString(), results: partial })); } } });
  const report = makeReport(results, baseline, { only, lastFullSweepAt: previousReport.lastFullSweepAt ?? (previousReport.sweepComplete ? previousReport.checkedAt : null), exclusions: readJson(resolve(ROOT, 'src/public-api-exclusions.json'), []), safeUrl: urls.isSafePublicApiBaseUrl, managedApprovedCount: productTruth.PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT });
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(resolve(outputDirectory, 'callable-audit.json'), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(resolve(outputDirectory, 'callable-audit.md'), renderMarkdown(report));
  console.log(JSON.stringify({ checked: report.candidateCount, verified: report.verifiedCount, complete: report.sweepComplete, output: outputDirectory }));
  return report;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await runAudit();
}
