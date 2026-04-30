#!/usr/bin/env node
/**
 * Patch src/registry/apis.json so the `callable` flag matches empirical
 * smoketest results from landing/src/lib/verification-status.json.
 *
 * Honest measurement rule (canon 2026-04-30): callable iff smoketest
 * returned WORKING_JSON (200 + parseable JSON) OR provider is managed.
 *
 *   - tier=verified                              → callable: true
 *   - tier=working | auth | needs_ctx | dead     → callable: false
 *   - no smoketest match                         → callable: false
 *   - name in MANAGED_BRAND_NAMES                → callable: true (we own the key)
 *
 * Run manually after a fresh smoketest sweep + build-verification-status.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APIS_PATH = resolve(__dirname, '../src/registry/apis.json');
const VERIFICATION_PATH = resolve(__dirname, '../landing/src/lib/verification-status.json');

const MANAGED_BRAND_NAMES = new Set([
  'openai', 'openai api',
  'anthropic', 'anthropic api', 'anthropic claude', 'anthropic messages api',
  'openrouter', 'openrouter api',
  'x.ai', 'x.ai api', 'xai api', 'grok', 'grok api',
  'brave search', 'brave search ai',
  'elevenlabs', 'elevenlabs api', 'elevenlabs tts',
  'replicate', 'replicate api',
  'firecrawl', 'firecrawl api',
  'e2b', 'e2b api',
  'groq', 'groq api',
  'deepgram', 'deepgram api',
  'serper', 'serper api',
  'mistral', 'mistral ai', 'mistral api', 'mistral ai api',
  'cohere', 'cohere api',
  'together', 'together ai', 'together ai api', 'together apis',
  'stability', 'stability ai', 'stability ai api',
  'assemblyai', 'assemblyai api',
  'github', 'github api',
  'apilayer',
]);

function hostFromUrl(u) {
  try {
    return new URL(u).host.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

const apisData = JSON.parse(readFileSync(APIS_PATH, 'utf8'));
const verification = JSON.parse(readFileSync(VERIFICATION_PATH, 'utf8'));

const stats = {
  total: apisData.apis.length,
  ghosts_demoted: 0,
  promoted_to_verified: 0,
  promoted_to_working: 0,
  managed_kept_callable: 0,
  unchanged: 0,
};

for (const a of apisData.apis) {
  const nameLower = (a.name || '').toLowerCase().trim();
  const host = hostFromUrl(a.baseUrl || '');
  const v =
    (nameLower && verification.by_name_lower?.[nameLower]) ||
    (host && verification.by_host?.[host]) ||
    null;

  const isManaged = MANAGED_BRAND_NAMES.has(nameLower);
  const oldCallable = a.callable === true;
  let newCallable;

  if (isManaged) {
    newCallable = true;
  } else if (v) {
    newCallable = v.tier === 'verified';
  } else {
    newCallable = false;
  }

  if (newCallable === oldCallable) {
    if (isManaged) stats.managed_kept_callable += 1;
    else stats.unchanged += 1;
  } else if (oldCallable && !newCallable) {
    stats.ghosts_demoted += 1;
  } else if (!oldCallable && newCallable && v?.tier === 'verified') {
    stats.promoted_to_verified += 1;
  } else {
    stats.promoted_to_working += 1;
  }

  a.callable = newCallable;
}

apisData.lastUpdated = new Date().toISOString();
apisData.canonRefresh = '2026-04-30 — smoketest-driven cleanup';

writeFileSync(APIS_PATH, JSON.stringify(apisData, null, 2));

console.error('[clean-registry-flags] stats:', stats);
console.error('[clean-registry-flags] new callable count:',
  apisData.apis.filter((a) => a.callable === true).length);
console.error('[clean-registry-flags] wrote ' + APIS_PATH);
