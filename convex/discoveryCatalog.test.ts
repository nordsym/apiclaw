import assert from 'node:assert/strict';
import { getFunctionName } from 'convex/server';
import http from './http';
import { discoveryCatalogRequest } from './discoveryCatalog';

const params = new URLSearchParams({ q: 'free cats', callable: 'true', page: '2' });
const defaultRequest = discoveryCatalogRequest(params, {});
assert.equal(defaultRequest.url, 'https://apiclaw.cloud/api/catalog?q=free+cats&callable=true&page=2');
assert.equal(defaultRequest.init.redirect, 'error');
assert.deepEqual(defaultRequest.init.headers, {});
const previewRequest = discoveryCatalogRequest(params, {
  catalogUrl: 'https://apiclaw-preview-example.vercel.app/api/catalog?locale=en&page=1', oidcToken: 'synthetic-oidc-for-test',
});
const previewUrl = new URL(previewRequest.url);
assert.equal(previewUrl.origin, 'https://apiclaw-preview-example.vercel.app');
assert.equal(previewUrl.searchParams.get('locale'), 'en');
assert.equal(previewUrl.searchParams.get('page'), '2');
assert.equal(new Headers(previewRequest.init.headers).get('x-vercel-trusted-oidc-idp-token'), 'synthetic-oidc-for-test');
assert.equal(previewRequest.url.includes('synthetic-oidc'), false);
assert.deepEqual(discoveryCatalogRequest(params, { oidcToken: 'synthetic-oidc-for-test' }).init.headers, {});
for (const catalogUrl of ['http://apiclaw.cloud/api/catalog', 'https://evil.example/api/catalog', 'https://apiclaw.cloud.evil.example/api/catalog', 'https://vercel.app/api/catalog', 'https://127.0.0.1/api/catalog', 'https://user:pass@preview.vercel.app/api/catalog', 'https://preview.vercel.app:444/api/catalog', 'https://preview.vercel.app/admin', 'https://preview.vercel.app/api/catalog#fragment', 'not a URL']) {
  assert.throws(() => discoveryCatalogRequest(params, { catalogUrl }), /^Error: Invalid catalog endpoint configuration$/);
}

// Exercise the registered route, including its server env and caller query boundary.
const originalFetch = globalThis.fetch;
const previousUrl = process.env.APICLAW_CATALOG_URL;
const previousOidc = process.env.APICLAW_CATALOG_OIDC_TOKEN;
try {
  process.env.APICLAW_CATALOG_URL = 'https://apiclaw-preview-example.vercel.app/api/catalog?locale=en';
  process.env.APICLAW_CATALOG_OIDC_TOKEN = 'synthetic-oidc-for-test';
  let calls = 0;
  globalThis.fetch = async (target, init) => {
    calls++;
    const url = new URL(String(target));
    assert.equal(url.origin, 'https://apiclaw-preview-example.vercel.app');
    assert.equal(url.searchParams.get('q'), 'sample');
    assert.equal(url.searchParams.get('locale'), 'en');
    assert.equal(new Headers(init?.headers).get('x-vercel-trusted-oidc-idp-token'), 'synthetic-oidc-for-test');
    assert.equal(new Headers(init?.headers).has('X-APIClaw-Session'), false);
    assert.equal(init?.redirect, 'error');
    return Response.json({ items: [], total: 0, totalDiscoverable: 100, totalCallable: 7, page: 1, limit: 20, hasMore: false, categories: {} });
  };
  const ctx: any = { runMutation: async (reference: any) => {
    assert.equal(getFunctionName(reference), 'workspaces:verifySession');
    return { workspaceId: 'workspace_fixture', tier: 'free' };
  } };
  const route = http.lookup('/v1/discover', 'POST')![0] as any;
  const invoke = () => route._handler(ctx, new Request('https://gateway.example/v1/discover', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-APIClaw-Session': 'synthetic-session-for-fixture' },
    body: JSON.stringify({ query: 'sample', catalogUrl: 'https://evil.example/api/catalog' }),
  }));
  const response = await invoke();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).totalCallable, 7);
  assert.equal(calls, 1);
  process.env.APICLAW_CATALOG_URL = 'https://evil.example/api/catalog';
  const rejected = await invoke();
  assert.equal(rejected.status, 500);
  assert.equal(calls, 1, 'invalid server URL must never dispatch');
  assert.equal(JSON.stringify(await rejected.json()).includes('synthetic-oidc'), false);
} finally {
  globalThis.fetch = originalFetch;
  if (previousUrl === undefined) delete process.env.APICLAW_CATALOG_URL; else process.env.APICLAW_CATALOG_URL = previousUrl;
  if (previousOidc === undefined) delete process.env.APICLAW_CATALOG_OIDC_TOKEN; else process.env.APICLAW_CATALOG_OIDC_TOKEN = previousOidc;
}
console.log('Discovery catalog: production default, configured preview, preserved params, restricted HTTPS destination and server-only OIDC isolation passed');
