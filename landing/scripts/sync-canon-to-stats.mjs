#!/usr/bin/env node
/**
 * Patch landing/src/lib/stats.json with the numbers from src/canon-stats.ts.
 * Run after generate-stats.js so that pipeline-derived data is preserved
 * but the headline counts (apiCount, sourceVerifiedCount,
 * managedProviderAdapterCount) match
 * canon. Also surfaces verification buckets for catalog rendering.
 *
 * Run manually or via `npm run build:stats`.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATS_PATH = resolve(__dirname, '../src/lib/stats.json');
const PUBLIC_STATS_PATH = resolve(__dirname, '../public/stats.json');
const VERIFICATION_PATH = resolve(__dirname, '../src/lib/verification-status.json');
const CANON_STATS_PATH = resolve(__dirname, '../../src/canon-stats.ts');

if (process.env.APICLAW_ISOLATED_LANDING_BUILD === '1' || !existsSync(CANON_STATS_PATH)) {
  const checkedIn = JSON.parse(readFileSync(STATS_PATH, 'utf8'));
  for (const field of [
    'apiCount',
    'sourceVerifiedCount',
    'managedProviderAdapterCount',
    'customerExecutableProviderCount',
  ]) {
    if (!Number.isFinite(checkedIn[field])) {
      throw new Error(`Checked-in stats are missing ${field}`);
    }
  }
  console.error('[sync-canon] isolated landing build is using the locally verified checked-in stats');
  process.exit(0);
}

function readCanonStats() {
  const source = readFileSync(CANON_STATS_PATH, 'utf8');
  const number = (key) => {
    const match = source.match(new RegExp(`\\b${key}:\\s*([\\d_]+)`));
    if (!match) throw new Error(`Missing numeric CANON_STATS.${key}`);
    return Number(match[1].replaceAll('_', ''));
  };
  const string = (key) => {
    const match = source.match(new RegExp(`\\b${key}:\\s*['\"]([^'\"]+)['\"]`));
    if (!match) throw new Error(`Missing string CANON_STATS.${key}`);
    return match[1];
  };

  return {
    generated_at: string('generated_at'),
    discoverable: number('discoverable'),
    source_verified: number('source_verified'),
    verification_sweep_passes: number('verification_sweep_passes'),
    managed_provider_adapters: number('managed_provider_adapters'),
    customer_executable_providers: number('customer_executable_providers'),
    npm_installs: number('npm_installs'),
  };
}

const CANON = readCanonStats();

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
  console.error('[sync-canon] verification-status.json missing - run scripts/build-verification-status.mjs first');
}

const before = {
  apiCount: stats.apiCount,
  sourceVerifiedCount: stats.sourceVerifiedCount,
  managedProviderAdapterCount: stats.managedProviderAdapterCount,
  customerExecutableProviderCount: stats.customerExecutableProviderCount,
};

const measured = {
  apiCount: CANON.discoverable,
  sourceVerifiedCount: CANON.source_verified,
  managedProviderAdapterCount: CANON.managed_provider_adapters,
  customerExecutableProviderCount: CANON.customer_executable_providers,
};
for (const [field, expected] of Object.entries(measured)) {
  if (stats[field] !== expected) {
    console.error(`[sync-canon] ${field} drift: measured=${stats[field]} canon=${expected}`);
    process.exit(1);
  }
}
if (stats.historicalVerificationBuckets?.verified !== CANON.verification_sweep_passes) {
  console.error(
    `[sync-canon] historical verification sweep drift: measured=${stats.historicalVerificationBuckets?.verified} canon=${CANON.verification_sweep_passes}`,
  );
  process.exit(1);
}

stats.apiCount = CANON.discoverable;
stats.sourceVerifiedCount = CANON.source_verified;
stats.managedProviderAdapterCount = CANON.managed_provider_adapters;
stats.customerExecutableProviderCount = CANON.customer_executable_providers;
stats.npmDownloads = CANON.npm_installs;
stats.canonGeneratedAt = CANON.generated_at;
stats.generatedAt = new Date().toISOString();
// Drop any legacy fields from previous canon variants
delete stats.callableCount;
delete stats.managedCount;
delete stats.managedBrands;
delete stats.openApiCount;
delete stats.callableVerified;
delete stats.callableTotal;
delete stats.verificationBuckets;

if (verification?.buckets) stats.historicalVerificationBuckets = verification.buckets;

writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));
writeFileSync(PUBLIC_STATS_PATH, JSON.stringify({
  apiCount: stats.apiCount,
  sourceVerifiedCount: stats.sourceVerifiedCount,
  managedProviderAdapterCount: stats.managedProviderAdapterCount,
  customerExecutableProviderCount: stats.customerExecutableProviderCount,
  npmDownloads: stats.npmDownloads,
  capabilityCount: stats.capabilityCount,
  generatedAt: stats.generatedAt,
  categoryBreakdown: stats.categoryBreakdown,
}, null, 2) + '\n');
console.error('[sync-canon] before:', before);
console.error('[sync-canon] after :', {
  apiCount: stats.apiCount,
  sourceVerifiedCount: stats.sourceVerifiedCount,
  managedProviderAdapterCount: stats.managedProviderAdapterCount,
  customerExecutableProviderCount: stats.customerExecutableProviderCount,
});
console.error('[sync-canon] wrote ' + STATS_PATH);
console.error('[sync-canon] wrote ' + PUBLIC_STATS_PATH);
