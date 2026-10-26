import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { prepareCandidates, canonicalGroups, findGeneratedDefault, buildProbeUrl, classifyResult, createOriginLimiter, probeCandidate, auditCandidates, makeBaseline, makeReport, applyCustomerGatewayEvidence, renderMarkdown, findKeyEvidence, disambiguateCanonicalIds, applyRecordedEvidence } from './audit-callable.mjs';
import { tsImport } from 'tsx/esm/api';
const { fetchWorkspacePublicGet } = await tsImport('../src/workspace-public-transport.ts', import.meta.url);
const { decodePublicApiResponse } = await tsImport('../src/workspace-public-response.ts', import.meta.url);
const { isSafePublicApiBaseUrl } = await tsImport('../src/workspace-public-apis.ts', import.meta.url);
const candidate = { id: 'fixture', name: 'Fixture', baseUrl: 'https://api.fixture.org', origin: 'https://api.fixture.org' };
const recipe = { ...candidate, smokePath: '/v1/data?limit=1', pricing: 'free', pricingSource: 'https://provider.fixture.org/free', freeEvidence: 'Official recurring free read-only data.' };
const registry = [{ ...candidate, pricing: 'unknown', docsUrl: 'https://provider.fixture.org/docs' }];
const prepared = (overrides = {}) => prepareCandidates({ candidates: [candidate], registry, recipes: [recipe], ...overrides });
const deps = (fetchImpl, overrides = {}) => ({ fetch: fetchImpl, fetchWorkspacePublicGet, decodePublicApiResponse, isSafePublicApiBaseUrl,
  limit: (_origin, action) => action(), sleep: async () => {}, ...overrides });

test('audit entrypoint always parses with node --check', () => {
  execFileSync(process.execPath, ['--check', 'scripts/audit-callable.mjs']);
});

test('URL joining preserves documented base prefixes and base queries', () => {
  assert.equal(buildProbeUrl({ baseUrl: 'https://api.fixture.org', smokePath: '/john+3:16' }).href, 'https://api.fixture.org/john+3:16');
  assert.equal(buildProbeUrl({ baseUrl: 'https://api.fixture.org/v1', smokePath: '/latest' }).href, 'https://api.fixture.org/v1/latest');
  assert.equal(buildProbeUrl({ baseUrl: 'https://api.fixture.org/data?format=json', smokePath: '/' }).href, 'https://api.fixture.org/data?format=json');
  assert.throws(() => buildProbeUrl({ ...candidate, smokePath: '//evil.org' }));
});

test('unknown pricing stays unverified despite valid 200; explicit reviewed source fixes eligibility', () => {
  assert.equal(classifyResult({ status: 200, raw: '{}', decodedValid: true, api: { freeVerified: false } }).cause, 'unknown_pricing');
  const [row] = prepared();
  assert.equal(row.freeVerified, true);
  assert.equal(classifyResult({ status: 200, raw: '{}', decodedValid: true, api: row }).cause, 'ok');
  assert.equal(prepared({ recipes: [{ ...recipe, pricingSource: '' }] })[0].freeVerified, false);
});

test('401/403 are ambiguous; clear key error semantics establish needs_key', () => {
  for (const status of [401, 403]) assert.equal(classifyResult({ status, raw: 'Forbidden' }).cause, 'unresolved');
  assert.equal(classifyResult({ status: 401, raw: '{"error":"Missing API key"}' }).cause, 'needs_key');
  assert.equal(classifyResult({ status: 200, raw: '{"error":"API key required"}', decodedValid: false }).cause, 'needs_key');
  assert.equal(classifyResult({ status: 403, raw: '<html>API key required</html>' }).cause, 'unresolved');
});

test('HTTP/root-cause evidence is conservative, TLS differs from DNS and CORS is irrelevant', () => {
  assert.equal(classifyResult({ status: 404, api: {} }).cause, 'wrong_base_url_path');
  assert.equal(classifyResult({ status: 404, api: { reviewedRecipe: true } }).cause, 'dead_upstream');
  assert.equal(classifyResult({ status: 200, raw: '<html>Welcome</html>' }).cause, 'wrong_base_url_path');
  assert.equal(classifyResult({ status: 200, raw: '<html>Self-host this</html>', api: { notHostedApi: true } }).cause, 'not_hosted_api');
  assert.equal(classifyResult({ status: 400, raw: '{"error":"Missing name parameter"}' }).cause, 'missing_default_params');
  assert.equal(classifyResult({ status: 429 }).cause, 'rate_limit');
  assert.equal(classifyResult({ status: 503 }).cause, 'dead_upstream');
  assert.equal(classifyResult({ error: new DOMException('timed out', 'TimeoutError') }).cause, 'timeout');
  assert.equal(classifyResult({ error: new Error('fetch failed', { cause: Object.assign(new Error('dns'), { code: 'ENOTFOUND' }) }) }).cause, 'dead_upstream');
  assert.equal(classifyResult({ error: new Error('fetch failed', { cause: Object.assign(new Error('tls'), { code: 'CERT_HAS_EXPIRED' }) }) }).cause, 'redirect_https');
});

test('baseline preserves all prior outcomes and known 13 smoke paths independently of future reports', () => {
  const old = { checkedAt: '2026-10-15T01:00:00Z', candidateCount: 1, verifiedCount: 1, results: [{ ...candidate, checkedAt: '2026-10-15T01:00:00Z', verified: true, smokePath: '/old/working', status: 200, outcome: 'ok_json' }] };
  const baseline = makeBaseline(old);
  assert.deepEqual(baseline.outcomes, { ok_json: 1 });
  const [row] = prepared({ recipes: [], previous: old.results, baseline: baseline.results });
  assert.equal(row.smokePath, '/old/working');
  assert.equal(baseline.results[0].smokePath, '/old/working');
});

test('reviewed recipes outside old candidate pool match full registry names by slug', () => {
  const rows = prepareCandidates({ candidates: [], registry: [{ name: 'New Data API', baseUrl: 'https://new.fixture.org', pricing: 'unknown' }], recipes: [{ ...recipe, id: 'newdataapi', name: undefined, baseUrl: 'https://new.fixture.org' }] });
  assert.equal(rows[0].name, 'New Data API');
  assert.equal(rows[0].recipeRegistryMatched, true);
  assert.equal(rows[0].freeVerified, true);
});

test('same normalized ID on different hosts does not apply wrong named recipe or merge products', () => {
  const a = { id: 'quranapi', name: 'Quran API', baseUrl: 'https://first.fixture.org', origin: 'https://first.fixture.org' };
  const b = { id: 'quranapi', name: 'Quran-api', baseUrl: 'https://second.fixture.org', origin: 'https://second.fixture.org' };
  const rows = prepareCandidates({ candidates: [a,b], registry: [a,b], recipes: [{ ...recipe, id: a.id, name: a.name, baseUrl: a.baseUrl }] });
  assert.equal(rows[0].reviewedRecipe, true);
  assert.equal(rows[1].reviewedRecipe, false);
  assert.equal(rows[1].baseUrl, b.baseUrl);
  assert.equal(canonicalGroups(rows).length, 2);
});

test('HTTP candidates upgrade to same-host HTTPS and keep URL safety enforcement', async () => {
  const [row] = prepared({ candidates: [{ ...candidate, baseUrl: 'http://api.fixture.org', origin: 'http://api.fixture.org' }], registry: [{ ...registry[0], pricing: 'free' }], recipes: [] });
  assert.equal(row.baseUrl, 'https://api.fixture.org/');
  assert.equal(row.httpsUpgraded, true);
  assert.ok(row.repairs.some(x => x.cause === 'redirect_https'));
  const [unsafe] = prepared({ candidates: [{ ...candidate, baseUrl: 'http://127.0.0.1', origin: 'http://127.0.0.1' }], recipes: [] });
  const result = await probeCandidate(unsafe, deps(() => { throw Error('Must not dispatch'); }));
  assert.equal(result.cause, 'gateway_block');
});

test('local generated defaults require exact name and original origin/spec URL, safe GET and no key params', () => {
  const generated = { name: 'Fixture', baseUrl: candidate.baseUrl, sourceUrl: 'https://spec.fixture.org/spec.json', actions: { read: { method: 'GET', pathTemplate: '/v1/list', requiresAuth: false, params: [{ name: 'limit', in: 'query', required: true, default: 1 }] } } };
  assert.equal(findGeneratedDefault(candidate, [generated]).smokePath, '/v1/list?limit=1');
  for (const changed of [{ ...generated, name: 'Different' }, { ...generated, baseUrl: 'https://other.fixture.org' }, { ...generated, actions: { read: { method: 'POST', pathTemplate: '/v1', requiresAuth: false } } }, { ...generated, actions: { read: { method: 'GET', pathTemplate: '/signup', requiresAuth: false } } }, { ...generated, actions: { read: { method: 'GET', pathTemplate: '/v1', requiresAuth: false, params: [{ name: 'api_key', in: 'query', default: 'test' }] } } }]) assert.equal(findGeneratedDefault(candidate, [changed]), null);
  const rows = prepared({ recipes: [], previous: [{ ...candidate, smokePath: '/', verified: false }], generated: [generated] });
  assert.equal(rows[0].smokePath, '/v1/list?limit=1', 'old failing root does not block a new safe generated path');
});

test('canonical aliases share probes; separate FDA-style product paths do not merge by origin/base alone', async () => {
  const a = prepared()[0];
  const b = { ...a, id: 'fixturealias', name: 'Fixture Alias' };
  const c = { ...a, id: 'second', name: 'Second', smokePath: '/second' };
  assert.equal(canonicalGroups([a,b,c]).length, 2);
  let calls = 0;
  const result = await auditCandidates([a,b,c], { dependencies: deps(async () => { calls++; return Response.json({ ok: true }); }) });
  assert.equal(calls, 2);
  assert.equal(result.filter(row => row.verified).length, 2);
  assert.equal(result.find(row => row.id === 'fixturealias').cause, 'duplicate');
});

test('approved redirect+retry traces use shared bounded transport; unapproved redirect retains HTTP status', async () => {
  const [api] = prepared();
  api.redirectOrigins = ['https://next.fixture.org'];
  let n = 0;
  const response = await probeCandidate(api, deps(async (_url, options) => {
    assert.equal(options.method, 'GET'); assert.equal(options.redirect, 'manual'); assert.equal(options.credentials, 'omit');
    assert.deepEqual(Object.keys(options.headers).sort(), ['Accept', 'Accept-Encoding', 'User-Agent']);
    assert.equal(options.headers['Accept-Encoding'], 'identity');
    n++;
    if (n === 1) return new Response(null, { status: 302, headers: { location: 'https://next.fixture.org/data' } });
    if (n === 2) return new Response('{}', { status: 503, headers: { 'retry-after': '0' } });
    return Response.json({ ok: true });
  }));
  assert.equal(response.verified, true);
  assert.equal(response.trace.length, 3);
  assert.equal(response.trace[0].status, 302);
  assert.equal(response.trace[1].status, 503);
  const blocked = await probeCandidate(api, deps(async () => new Response(null, { status: 301, headers: { location: 'https://127.0.0.1/private' } })));
  assert.equal(blocked.cause, 'gateway_block'); assert.equal(blocked.status, 301);
});

test('bounded reads reject >256 KiB without decoding/truncating a successful prefix', async () => {
  const [api] = prepared();
  const result = await probeCandidate(api, deps(async () => new Response('x'.repeat(256*1024+1))));
  assert.equal(result.verified, false); assert.equal(result.cause, 'gateway_block');
});

test('reviewed exclusions with exact names stop all network access and record source', async () => {
  const [api] = prepared({ exclusions: [{ id: candidate.id, name: candidate.name, cause: 'commercial_permission', evidence: 'Official no-proxy restriction', docsUrl: 'https://provider.fixture.org/terms' }] });
  const result = await probeCandidate(api, deps(() => { throw Error('Must not dispatch'); }));
  assert.equal(result.cause, 'commercial_permission'); assert.equal(result.exclusionSource, 'https://provider.fixture.org/terms');
  assert.equal(result.verified, false);
});

test('documentation URLs and credential-shaped query strings never dispatch', async () => {
  for (const api of [{ ...prepared()[0], baseUrl: 'https://github.com/provider/project', origin: 'https://github.com' }, { ...prepared()[0], smokePath: '/data?api_key=DEMO_KEY' }]) {
    const result = await probeCandidate(api, deps(() => { throw Error('Must not dispatch'); }));
    assert.equal(result.verified, false); assert.equal(result.trace.length, 0);
  }
});

test('optional key offerings do not become needs_key merely because a free signup exists', () => {
  const report = { recommendations: [{ id: 'openalex', registryMatches: ['Fixture'], docsUrl: 'https://docs.fixture.org' }] };
  assert.equal(findKeyEvidence({ ...prepared()[0], reviewedRecipe: false }, report), null);
});

test('--only preserves prior ID+name timestamps and explicitly leaves unmatched new rows unchecked', async () => {
  const [a] = prepared(); const b = { ...a, id: 'untouched', canonicalId: 'untouched', name: 'Untouched', baseUrl: 'https://untouched.fixture.org', origin: 'https://untouched.fixture.org' };
  const c = { ...a, id: 'new', canonicalId: 'new', name: 'New', baseUrl: 'https://new.fixture.org', origin: 'https://new.fixture.org' };
  const prior = { ...b, checkedAt: '2026-10-01T00:00:00Z', verified: false, status: 403, outcome: 'access_denied', cause: 'unresolved' };
  const result = await auditCandidates([a,b,c], { only: [a.id], previous: [prior], dependencies: deps(async () => Response.json({ ok: true })) });
  assert.equal(result[1].checkedAt, prior.checkedAt); assert.equal(result[1].reused, true);
  assert.equal(result[2].checkedAt, null); assert.equal(result[2].outcome, 'not_checked');
});

test('origin limiter spaces starts, serializes one host and lets different hosts proceed', async () => {
  let now = 0; const waits = [];
  const limit = createOriginLimiter({ now: () => now, sleep: async ms => { waits.push(ms); now += ms; } });
  await limit('one', async () => {}); await limit('one', async () => {}); await limit('two', async () => {});
  assert.deepEqual(waits, [1000]);
});

test('report separates original outcomes, current causes, partial coverage and canonical free count', () => {
  const baseline = makeBaseline({ checkedAt: '2026-10-01', candidateCount: 1, verifiedCount: 0, results: [{ ...candidate, status: 403, outcome: 'http_error', verified: false }] });
  const report = makeReport([{ ...prepared()[0], status: 200, outcome: 'ok_json', cause: 'ok', verified: true, checkedAt: '2026-10-15', latencyMs: 3 }], baseline, { only: ['fixture'] });
  assert.equal(report.sweepComplete, false); assert.equal(report.verifiedCount, 1);
  const markdown = renderMarkdown(report);
  assert.match(markdown, /CORS is a browser rule/); assert.match(markdown, /partial-recheck/); assert.match(markdown, /node --check scripts\/audit-callable.mjs/);
  assert.match(renderMarkdown({ ...report, eligibilityRecheck: 'Seven endpoints demoted after confirmed DNS or TLS failure.' }), /Eligibility recheck: Seven endpoints demoted/);
});

test('malformed and unsafe rows are recorded while other candidates complete', async () => {
  const rows = prepareCandidates({ candidates: [null, { id: 'bad', name: 'Bad', baseUrl: 'not a URL' }, candidate], registry, recipes: [recipe] });
  let calls = 0;
  const results = await auditCandidates(rows, { dependencies: deps(async () => { calls++; return Response.json({ ok: true }); }) });
  assert.equal(results.length, 3); assert.equal(results[0].outcome, 'malformed_candidate');
  assert.equal(results[1].cause, 'wrong_base_url_path'); assert.equal(results[2].verified, true);
  assert.equal(calls, 1);
});

test('error records preserve cause codes without retaining message URLs or credentials', () => {
  const error = new Error('https://api.fixture.org?token=never-store-this', { cause: Object.assign(new Error('credential never-store-this'), { code: 'ENOTFOUND' }) });
  const result = classifyResult({ error });
  assert.equal(result.cause, 'dead_upstream'); assert.doesNotMatch(JSON.stringify(result), /never-store-this/);
});


test('historical slug collisions get deterministic distinct canonical IDs without replacing history IDs', () => {
  const rows = [{ id: 'quranapi', name: 'Quran API', canonicalId: 'quranapi', sourceUrl: 'https://first.fixture.org', baseUrl: 'https://first.fixture.org', cause: 'ok', verified: true }, { id: 'quranapi', name: 'Quran-api', canonicalId: 'quranapi', sourceUrl: 'https://second.fixture.org', baseUrl: 'https://second.fixture.org', cause: 'ok', verified: true }];
  const result = disambiguateCanonicalIds(rows);
  assert.equal(result[0].id, 'quranapi'); assert.equal(result[1].id, 'quranapi');
  assert.notEqual(result[0].canonicalId, result[1].canonicalId);
  assert.match(result[0].canonicalId, /^quranapi-[a-f0-9]{8}$/);
  const ids = result.map(row => row.canonicalId); disambiguateCanonicalIds(result); assert.deepEqual(result.map(row => row.canonicalId), ids);
});

test('postprocessing uses only recorded HTML/redirect facts and propagates reviewed commercial exclusions', () => {
  const rows = [{ id: 'html', name: 'HTML', canonicalId: 'html', status: 200, outcome: 'body_limit', cause: 'gateway_block', trace: [{ contentType: 'text/html' }] }, { id: 'largejson', name: 'Large JSON', canonicalId: 'largejson', status: 200, outcome: 'body_limit', cause: 'gateway_block', trace: [{ contentType: 'application/json' }] }, { id: 'blocked', name: 'Blocked', canonicalId: 'blocked', verified: true, cause: 'ok', trace: [] }, { id: 'alias', name: 'Alias', canonicalId: 'blocked', verified: false, canonicalVerified: true, cause: 'duplicate', trace: [] }];
  applyRecordedEvidence(rows, [{ id: 'blocked', name: 'Blocked', cause: 'commercial_permission', evidence: 'No generic shared gateway', docsUrl: 'https://provider.fixture.org/terms' }]);
  assert.equal(rows[0].cause, 'wrong_base_url_path'); assert.equal(rows[1].cause, 'gateway_block');
  assert.equal(rows[2].verified, false); assert.equal(rows[2].cause, 'commercial_permission'); assert.equal(rows[3].canonicalVerified, false);
});

test('known connect-timeout/TLS cause codes are classified without guesses from generic messages', () => {
  for (const code of ['ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT']) assert.equal(classifyResult({ error: new Error('fetch failed', { cause: Object.assign(new Error('network'), { code }) }) }).cause, 'timeout');
  assert.equal(classifyResult({ error: new Error('fetch failed', { cause: Object.assign(new Error('TLS'), { code: 'ERR_SSL_TLSV1_UNRECOGNIZED_NAME' }) }) }).cause, 'redirect_https');
});


test('later reviewed rescue recipes override old named recipes instead of silently retaining broken paths', () => {
  const [row] = prepared({ recipes: [recipe, { ...recipe, smokePath: '/corrected?limit=1', pricingSource: 'https://provider.fixture.org/updated-docs' }] });
  assert.equal(row.smokePath, '/corrected?limit=1'); assert.equal(row.pricingSource, 'https://provider.fixture.org/updated-docs');
});

test('original-cohort accounting excludes expanded rows and keeps baseline failures separate with zero buckets', () => {
  const baseline = makeBaseline({ checkedAt: 'old', candidateCount: 3, verifiedCount: 1, results: [
    { id: 'first', name: 'First', verified: true, outcome: 'ok_json' },
    { id: 'later', name: 'Later', verified: false, outcome: 'http_error' },
    { id: 'alias', name: 'Alias', verified: false, outcome: 'network_error' },
  ] });
  const current = [
    { id: 'first', name: 'First', canonicalId: 'first', verified: true, cause: 'ok' },
    { id: 'later', name: 'Later', canonicalId: 'later', verified: true, cause: 'ok' },
    { id: 'alias', name: 'Alias', canonicalId: 'first', verified: false, cause: 'duplicate' },
    { id: 'expanded', name: 'Expanded', canonicalId: 'expanded', verified: false, cause: 'needs_key' },
  ];
  const summary = makeReport(current, baseline).originalCohortSummary;
  assert.equal(summary.cohortRows, 3); assert.equal(summary.originallyFailingRows, 2);
  assert.equal(summary.currentlyVerifiedCanonicalRows, 2); assert.equal(summary.currentDuplicateRows, 1); assert.equal(summary.currentDiscoveryRows, 0);
  assert.equal(summary.formerlyFailingCurrentCauses.ok, 1); assert.equal(summary.formerlyFailingCurrentCauses.duplicate, 1);
  assert.equal(summary.formerlyFailingCurrentCauses.needs_key, 0); assert.equal(summary.formerlyFailingCurrentCauses.missing_default_params, 0);
  assert.equal(Object.values(summary.currentCauses).reduce((a,b) => a+b, 0), 3);
  assert.equal(Object.values(summary.formerlyFailingCurrentCauses).reduce((a,b) => a+b, 0), 2);
});

test('canonical disambiguation is idempotent for same-source rows and repairs repeated historical suffixes', () => {
  const rows = [
    { id: 'argentina', name: 'Root', canonicalId: 'argentina', sourceUrl: 'https://datos.gob.ar', cause: 'wrong_base_url_path', verified: false },
    { id: 'argentinafixed', name: 'API', canonicalId: 'argentina', canonicalExplicit: true, sourceUrl: 'https://datos.gob.ar', cause: 'ok', verified: true },
  ];
  disambiguateCanonicalIds(rows);
  const first = structuredClone(rows);
  disambiguateCanonicalIds(rows); assert.deepEqual(rows, first);
  const suffix = rows[0].canonicalId.slice('argentina'.length);
  rows.forEach(row => { row.canonicalId += suffix + suffix; delete row.canonicalBaseId; });
  disambiguateCanonicalIds(rows); assert.deepEqual(rows, first);
  disambiguateCanonicalIds(rows); assert.deepEqual(rows, first);
});

test('explicit openFDA identity counts food and drug datasets as one API despite distinct successful paths', () => {
  const candidates = [
    { id: 'fda', name: 'FDA', baseUrl: 'https://api.fda.gov' },
    { id: 'openfdadrug', name: 'OpenFDA Drug', baseUrl: 'https://open.fda.gov/apis/drug' },
  ];
  const recipes = [
    { ...candidates[0], canonicalId: 'fda', smokePath: '/food/enforcement.json?limit=1', pricing: 'free' },
    { ...candidates[1], canonicalId: 'fda', baseUrl: 'https://api.fda.gov', smokePath: '/drug/label.json?limit=1', pricing: 'free' },
  ];
  const groups = canonicalGroups(prepareCandidates({ candidates, registry: candidates, recipes }));
  assert.equal(groups.length, 1); assert.equal(groups[0].rows.length, 2);
  assert.equal(groups[0].representative.canonicalId, 'fda');
});

const customerFixture = () => {
  const results = [
    { id: 'a', name: 'A', canonicalId: 'a', verified: true, cause: 'ok', outcome: 'ok_json', checkedAt: '2026-10-01', status: 200 },
    { id: 'b', name: 'B', canonicalId: 'b', verified: true, cause: 'ok', outcome: 'ok_json', checkedAt: '2026-10-01', status: 200 },
    { id: 'alias-b', name: 'Alias B', canonicalId: 'b', verified: false, canonicalVerified: true, cause: 'duplicate', outcome: 'duplicate', checkedAt: '2026-10-01' },
    { id: 'c', name: 'C', canonicalId: 'c', verified: false, cause: 'unknown_pricing', outcome: 'ok_json', checkedAt: '2026-10-01' },
  ];
  return makeReport(results, makeBaseline({ checkedAt: '2026-10-01', candidateCount: 4, verifiedCount: 2, results }), { checkedAt: '2026-10-01', managedApprovedCount: 3 });
};
const customerProof = () => ({ before: { workspaceId: 'private-workspace', usage: 0, paid: false }, after: { paid: false, usage: 0, workspaceId: 'private-workspace' }, verifiedAt: '2026-10-15T18:00:00Z', preview: 'https://preview.fixture.org/path?token=private-token', results: [
  { id: 'a', name: 'A', status: 200, success: true, latencyMs: 1.5, route: '/v1/execute' },
  { id: 'b', name: 'B', status: 429, success: false, errorCode: 'RATE_LIMITED', latencyMs: 2, route: '/v1/execute' },
  { id: 'c', name: 'C', status: 200, success: true },
], health: { disabledIds: [] } });

test('customer evidence demotes failed canonical APIs and aliases, never promotes discovery or changes upstream timestamps', () => {
  const original = customerFixture(); const frozen = structuredClone(original);
  const result = applyCustomerGatewayEvidence(original, customerProof());
  assert.deepEqual(original, frozen);
  assert.equal(result.verifiedCount, 1); assert.equal(result.customerExecutableCatalogCount, 4); assert.equal(result.additionalVerifiedApisNeededFor1000, 996);
  const failed = result.results.find(row => row.id === 'b');
  assert.equal(failed.verified, false); assert.equal(failed.cause, 'rate_limit'); assert.equal(failed.upstreamVerified, true); assert.equal(failed.upstreamOutcome, 'ok_json'); assert.equal(failed.status, 200);
  assert.equal(result.results.find(row => row.id === 'alias-b').canonicalVerified, false);
  assert.equal(result.results.find(row => row.id === 'c').verified, false);
  assert.equal(result.checkedAt, original.checkedAt); assert.equal(result.lastFullSweepAt, original.lastFullSweepAt);
  assert.equal(result.customerGatewayVerification.billingUnchanged, true);
  assert.doesNotMatch(JSON.stringify(result), /private-workspace|private-token/);
  assert.match(renderMarkdown(result), /authenticated customer calls passed/);
});

test('customer proof refuses incomplete, ambiguous or billing-changing batches before accepting evidence', () => {
  const proof = customerProof();
  assert.throws(() => applyCustomerGatewayEvidence(customerFixture(), { ...proof, results: proof.results.slice(0, 1) }), /unique result/);
  assert.throws(() => applyCustomerGatewayEvidence(customerFixture(), { ...proof, results: [proof.results[0], ...proof.results] }), /unique result/);
  assert.throws(() => applyCustomerGatewayEvidence(customerFixture(), { ...proof, after: { ...proof.after, usage: 1 } }), /identical/);
  assert.throws(() => applyCustomerGatewayEvidence(customerFixture(), { ...proof, results: undefined }), /missing/);
});

test('customer proof preserves source-qualified gateway rejection classifications', () => {
  const report = customerFixture();
  const row = report.results.find(row => row.id === 'c');
  Object.assign(row, { cause: 'gateway_block', outcome: 'redirect_not_approved',
    errorCause: [{ reason: 'redirect_not_approved' }], trace: [{ redirectTo: 'https://metadata.fixture.org' }] });
  const result = applyCustomerGatewayEvidence(report, customerProof());
  assert.equal(result.results.find(row => row.id === 'c').cause, 'gateway_block');
  assert.equal(result.results.find(row => row.id === 'c').verified, false);
});

test('health-disabled and discovery responses fail despite HTTP 200 while exact unique names can match', () => {
  const proof = customerProof(); proof.results[0] = { id: 'different', name: 'A', status: 200, success: true }; proof.health.disabledIds = ['a'];
  proof.results[1] = { id: 'b', status: 200, success: true, discovery: true };
  const result = applyCustomerGatewayEvidence(customerFixture(), proof);
  assert.equal(result.verifiedCount, 0);
  assert.equal(result.results[0].gatewayVerification.healthDisabled, true);
  assert.equal(result.results[0].cause, 'unresolved');
  assert.equal(result.results[1].cause, 'unresolved');
});

test('merged complete customer proof retains original per-result verification dates and defaults only new results', () => {
  const proof = customerProof();
  proof.verifiedAt = '2026-10-16T18:00:00Z';
  proof.results[0].verifiedAt = '2026-10-15T18:00:00Z';
  proof.results[1].success = true; proof.results[1].status = 200;
  const report = applyCustomerGatewayEvidence(customerFixture(), proof);
  assert.equal(report.results.find(row => row.id === 'a').gatewayVerification.verifiedAt, '2026-10-15T18:00:00Z');
  assert.equal(report.results.find(row => row.id === 'b').gatewayVerification.verifiedAt, proof.verifiedAt);
  assert.equal(report.customerGatewayVerification.verifiedAt, proof.verifiedAt);
  assert.equal(report.verifiedCount, 2);
  proof.results[0].verifiedAt = 'yesterday';
  assert.throws(() => applyCustomerGatewayEvidence(customerFixture(), proof), /valid ISO verification date/);
});

test('reviewed gzip policy is explicit, changes evidence identity and can be removed', () => {
  const plain = prepared()[0];
  const gzip = prepared({ recipes: [{ ...recipe, acceptEncoding: 'gzip' }] })[0];
  assert.equal(plain.acceptEncoding, undefined);
  assert.equal(gzip.acceptEncoding, 'gzip');
  assert.notEqual(plain.definitionHash, gzip.definitionHash);
  assert.equal(prepared({ previous: [gzip], recipes: [recipe] })[0].acceptEncoding, undefined);
  const failure = classifyResult({ error: new Error('Public API decoded response exceeds size limit') });
  assert.equal(failure.cause, 'gateway_block');
  assert.equal(failure.outcome, 'body_limit');
});

test('reviewed metadata paths are retained in evidence and changing scope invalidates it', () => {
  const scoped = prepared({ recipes: [{ ...recipe, allowedPaths: ['/api/3/action/package_search'] }] })[0];
  assert.deepEqual(scoped.allowedPaths, ['/api/3/action/package_search']);
  assert.notEqual(scoped.definitionHash, prepared()[0].definitionHash);
  assert.equal(prepared({ previous: [scoped], recipes: [recipe] })[0].allowedPaths, undefined);
});

test('HTML within a valid JSON metadata field is data rather than a website response', () => {
  const result = classifyResult({ status: 200, raw: '{"items":[{"description":"<html> content"}]}', decodedValid: true, api: { freeVerified: true } });
  assert.equal(result.cause, 'ok');
});

test('registry enrollment invalidates a cached unmatched-recipe rejection', async () => {
  const unmatched = prepared({ candidates: [], registry: [] })[0];
  const enrolled = prepared({ candidates: [] })[0];
  assert.equal(unmatched.recipeRegistryMatched, false);
  assert.equal(enrolled.recipeRegistryMatched, true);
  assert.notEqual(unmatched.definitionHash, enrolled.definitionHash);
  let requests = 0;
  const result = await auditCandidates([enrolled], {
    resume: true, previous: [{ ...unmatched, checkedAt: '2026-10-16T00:00:00Z', verified: false }],
    dependencies: deps(async () => { requests++; return Response.json({ items: [1] }); }),
  });
  assert.equal(requests, 1);
  assert.equal(result[0].verified, true);
});
