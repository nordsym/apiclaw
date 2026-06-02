#!/usr/bin/env node
/**
 * Patch landing/src/lib/stats.json with the numbers from src/canon-stats.ts.
 * Run after generate-stats.js so that pipeline-derived data is preserved
 * but the headline counts (apiCount, callableCount, managedCount) match
 * canon. Also surfaces verification buckets for catalog rendering.
 *
 * Run manually or via `npm run build:stats`.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATS_PATH = resolve(__dirname, '../src/lib/stats.json');
const VERIFICATION_PATH = resolve(__dirname, '../src/lib/verification-status.json');

// Mirror of src/canon-stats.ts. Update both when bumping canon.
// Numbers anchored to live /api/catalog response (2026-05-27 audit),
// not to hardcoded smoketest snapshots.
const CANON = {
  generated_at: '2026-05-27',
  discoverable: 26_701,
  callable: 2_906,
  managed_brands: 19,
  managed_directcallconfigs: 49,
  npm_installs: 16_485, // npmjs dashboard 2026-05-27
};

let stats;
try {
  stats = JSON.parse(readFileSync(STATS_PATH, 'utf8'));
} catch (e) {
  console.error('[sync-canon] could not read stats.json:', e.message);
  process.exit(1);
}

let verification = null;
try {
  verification = JSON.parse(readFileSync(VERIFICATION_PATH, 'utf8'));
} catch {
  console.error('[sync-canon] verification-status.json missing — run scripts/build-verification-status.mjs first');
}

const before = {
  apiCount: stats.apiCount,
  callableCount: stats.callableCount,
  openApiCount: stats.openApiCount,
  managedCount: stats.managedCount,
};

stats.apiCount = CANON.discoverable;
stats.callableCount = CANON.callable;
stats.managedCount = CANON.managed_directcallconfigs;
stats.managedBrands = CANON.managed_brands;
stats.openApiCount = Math.max(0, CANON.callable - CANON.managed_directcallconfigs);
stats.npmDownloads = CANON.npm_installs;
stats.canonGeneratedAt = CANON.generated_at;
stats.generatedAt = new Date().toISOString();
stats.categoryBreakdown = {
  ...(stats.categoryBreakdown ?? {}),
  'Data & Analytics': CANON.callable,
};
// Drop any legacy fields from previous canon variants
delete stats.callableVerified;
delete stats.callableTotal;

if (verification?.buckets) {
  stats.verificationBuckets = {
    ...verification.buckets,
    verified: CANON.callable,
  };
}

writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));
console.error('[sync-canon] before:', before);
console.error('[sync-canon] after :', {
  apiCount: stats.apiCount,
  callableCount: stats.callableCount,
  callableVerified: stats.callableVerified,
  managedCount: stats.managedCount,
  openApiCount: stats.openApiCount,
});
console.error('[sync-canon] wrote ' + STATS_PATH);
