#!/usr/bin/env node
/**
 * Reads the latest smoketest report from reports/smoketest/ and emits
 * landing/src/lib/verification-status.json — a compact lookup keyed by
 * provider id and provider name (lower-cased) so /api/catalog and the
 * MCP server can join verification data onto registry entries.
 *
 * Tier policy:
 *   verified:  WORKING_JSON
 *   working:   WORKING_EMPTY | WORKING_HTML_PROBABLY_LANDING | WORKING_OTHER
 *   auth:      AUTH_401 | AUTH_403
 *   needs_ctx: OTHER_400 | OTHER_406 | OTHER_415 | OTHER_422 | METHOD_NOT_ALLOWED
 *   dead:      NETWORK_ERR | DNS_FAIL | CONN_REFUSED | TLS_FAIL | TIMEOUT | NOT_FOUND_404 | OTHER_410 | REDIRECT_LIMBO | SERVER_5XX | RATE_LIMITED
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_DIR = resolve(__dirname, '../reports/smoketest');
const OUT_PATH = resolve(__dirname, '../landing/src/lib/verification-status.json');

const TIER = {
  WORKING_JSON: 'verified',
  WORKING_EMPTY: 'working',
  WORKING_HTML_PROBABLY_LANDING: 'working',
  WORKING_OTHER: 'working',
  AUTH_401: 'auth',
  AUTH_403: 'auth',
  OTHER_400: 'needs_ctx',
  OTHER_406: 'needs_ctx',
  OTHER_415: 'needs_ctx',
  OTHER_422: 'needs_ctx',
  METHOD_NOT_ALLOWED: 'needs_ctx',
  NETWORK_ERR: 'dead',
  DNS_FAIL: 'dead',
  CONN_REFUSED: 'dead',
  TLS_FAIL: 'dead',
  TIMEOUT: 'dead',
  NOT_FOUND_404: 'dead',
  OTHER_410: 'dead',
  REDIRECT_LIMBO: 'dead',
  SERVER_5XX: 'dead',
  RATE_LIMITED: 'dead',
};

function pickLatest() {
  const files = readdirSync(REPORT_DIR)
    .filter((f) => f.startsWith('smoketest-') && f.endsWith('.json'))
    .sort();
  if (files.length === 0) {
    throw new Error('No smoketest report in ' + REPORT_DIR);
  }
  // Prefer the largest file (full sweep > pilot)
  const sized = files.map((f) => {
    const stat = readFileSync(join(REPORT_DIR, f)).length;
    return { f, size: stat };
  });
  sized.sort((a, b) => b.size - a.size);
  return join(REPORT_DIR, sized[0].f);
}

const reportPath = pickLatest();
const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const records = report.records || [];
console.error('[verification-status] source: ' + reportPath);
console.error('[verification-status] records: ' + records.length);

const out = {
  generated_at: new Date().toISOString(),
  source_report: reportPath.split('/').pop(),
  source_summary: report.summary,
  by_id: {},
  by_name_lower: {},
  buckets: {
    verified: 0,
    working: 0,
    auth: 0,
    needs_ctx: 0,
    dead: 0,
  },
};

for (const r of records) {
  const tier = TIER[r.classification] || 'dead';
  out.buckets[tier] = (out.buckets[tier] || 0) + 1;
  const entry = {
    tier,
    classification: r.classification,
    latency_ms: r.result?.latency_ms ?? null,
    body_size: r.result?.body_size ?? null,
    status: r.result?.status ?? 0,
    last_verified_at: report.summary.generated_at || new Date().toISOString(),
    action: r.action,
  };
  if (r.id) out.by_id[r.id] = entry;
  if (r.name) {
    const k = String(r.name).toLowerCase();
    // Prefer better tier on name collision
    const prev = out.by_name_lower[k];
    if (!prev || rankTier(tier) > rankTier(prev.tier)) {
      out.by_name_lower[k] = entry;
    }
  }
}

function rankTier(t) {
  return { verified: 5, working: 4, needs_ctx: 3, auth: 2, dead: 1 }[t] || 0;
}

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
console.error('[verification-status] buckets:', out.buckets);
console.error('[verification-status] wrote ' + OUT_PATH);
