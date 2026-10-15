import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyPublicDiscoveryHealth, loadPublicDiscoveryHealth } from './public-discovery-health.js';
import { WORKSPACE_PUBLIC_APIS } from './workspace-public-apis.js';

const frankfurter = WORKSPACE_PUBLIC_APIS.find(api => api.id === 'frankfurter')!;
assert.ok(frankfurter);
const row = { id: frankfurter.id, name: frankfurter.name, callable: true };
const managed = { id: 'nasa', name: 'NASA', callable: true };
let requests = 0;
const request: typeof fetch = async (url, options) => {
  requests++;
  assert.equal(String(url), 'https://configured-preview.convex.cloud/api/query');
  assert.deepEqual(options?.headers, { 'Content-Type': 'application/json' });
  assert.deepEqual(JSON.parse(String(options?.body)), { path: 'publicApiHealth:snapshot', args: {} });
  return Response.json({ status: 'success', value: { approvedIds: [frankfurter.id, 'not-in-compiled-registry'], disabledIds: [] } });
};
const healthy = await loadPublicDiscoveryHealth(request, 'https://configured-preview.convex.cloud/');
assert.equal(requests, 1);
for (let i = 0; i < 20; i++) assert.equal(applyPublicDiscoveryHealth(row, healthy).callable, true);
assert.equal(requests, 1, 'result mapping performs no network requests');
const previousConvexUrl = process.env.CONVEX_URL;
try {
  process.env.CONVEX_URL = 'https://configured-preview.convex.cloud';
  assert.equal((await loadPublicDiscoveryHealth(request))?.has(frankfurter.id), true);
} finally {
  if (previousConvexUrl === undefined) delete process.env.CONVEX_URL;
  else process.env.CONVEX_URL = previousConvexUrl;
}
assert.equal(applyPublicDiscoveryHealth(row, undefined).callable, false, 'missing health fails closed');
assert.equal(applyPublicDiscoveryHealth(row, new Set()).callable, false, 'backend removal demotes');
assert.equal(applyPublicDiscoveryHealth({ id: 'not-in-compiled-registry', name: 'Unknown', callable: true }, healthy).callable, false);
assert.equal(applyPublicDiscoveryHealth({ ...row, callable: false }, healthy).callable, false, 'discovery-only cards cannot be promoted');
assert.deepEqual(applyPublicDiscoveryHealth(managed, undefined), managed, 'managed readiness remains unchanged');
const disabled = await loadPublicDiscoveryHealth(async () => Response.json({ status: 'success', value: { approvedIds: [frankfurter.id], disabledIds: [frankfurter.id] } }));
assert.equal(applyPublicDiscoveryHealth(row, disabled).callable, false);
for (const fake of [
  async () => { throw new Error('offline'); },
  async () => Response.json({ status: 'error' }, { status: 503 }),
  async () => Response.json({ status: 'success', value: { approvedIds: [123], disabledIds: [] } }),
  async () => Response.json({ status: 'success', value: { approvedIds: [frankfurter.id] } }),
]) assert.equal(await loadPublicDiscoveryHealth(fake as typeof fetch), undefined);

// Exercise the actual local registry mapper and callable-only fallback. Keep
// unrelated background provider-health/catalog requests isolated from the net.
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => Response.json({ status: 'success', value: {} });
  const { getAllAPIs, discoverAPIs } = await import('./discovery.js');
  const local = getAllAPIs(healthy).find(api => api.name === frankfurter.name) as typeof row | undefined;
  assert.equal(local?.callable, true);
  assert.equal((getAllAPIs().find(api => api.name === frankfurter.name) as typeof row | undefined)?.callable, false);
  const results = discoverAPIs('frankfurter', { callableOnly: true, publicHealth: healthy });
  assert.ok(results.some(result => result.provider.name === frankfurter.name));
  assert.equal(discoverAPIs('frankfurter', { callableOnly: true, publicHealth: disabled }).some(result => result.provider.name === frankfurter.name), false);
  const research = discoverAPIs('frankfurter', { callableOnly: false, publicHealth: disabled });
  assert.equal((research.find(result => result.provider.name === frankfurter.name)?.provider as typeof row | undefined)?.callable, false);
} finally { globalThis.fetch = originalFetch; }
const index = readFileSync('src/index.ts', 'utf8');
assert.match(index, /callable: a\.callable === true/);
assert.match(index, /!callableOnly \|\| a\.callable === true/);
assert.match(index, /getAllAPIs\(await loadPublicDiscoveryHealth\(\)\)/);
console.log('Public discovery health: one configured snapshot, demotion, fail-closed local fallback, no unknown promotion, managed preservation and remote explicit callable passed');
