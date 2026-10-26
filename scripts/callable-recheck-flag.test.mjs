import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { eligibilityDrift, priorRemovedIds, priorStrikeIds, isHardFailure, confirmRemovals, flagDecision, renderSummary, failureCodes } from './callable-recheck-flag.mjs';

const snapshot = [{ id: 'alive', name: 'Alive' }, { id: 'flake', name: 'Flake' }, { id: 'dead', name: 'Dead' }];
const row = (id, name, extra) => ({ id, name, canonicalId: id, verified: false, cause: 'timeout', baseUrl: `https://${id}.example`, origin: `https://${id}.example`, smokePath: '/', freeVerified: true, ...extra });
const report = (verified, failures) => ({ results: [
  { id: 'alive', name: 'Alive', canonicalId: 'alive', verified: true, cause: 'ok' },
  ...verified.map(id => ({ id, name: id, canonicalId: id, verified: true, cause: 'ok' })),
  ...failures,
] });

test('drift separates snapshot removals from unproven additions', () => {
  const drift = eligibilityDrift(snapshot, report(['added'], [row('flake', 'Flake'), row('dead', 'Dead')]));
  assert.deepEqual(drift.removed.map(item => item.id), ['flake', 'dead']);
  assert.deepEqual(drift.added.map(item => item.id), ['added']);
  assert.equal(priorRemovedIds(snapshot, report([], [row('flake', 'Flake'), row('dead', 'Dead')])).has('flake'), true);
});

test('hard failures are DNS, TLS, missing endpoints and unapproved redirects; flakes stay soft', () => {
  assert.equal(isHardFailure({ verified: false, status: 0, codes: ['ENOTFOUND'], outcome: 'network_error' }), true);
  assert.equal(isHardFailure({ verified: false, status: 0, codes: ['EAI_AGAIN'], outcome: 'network_error' }), false);
  assert.equal(isHardFailure({ verified: false, status: 0, codes: ['CERT_HAS_EXPIRED'], outcome: 'tls_error' }), true);
  assert.equal(isHardFailure({ verified: false, status: 0, outcome: 'tls_error', codes: ['UNABLE_TO_VERIFY_LEAF_SIGNATURE'] }), true);
  assert.equal(isHardFailure({ verified: false, status: 404, outcome: 'http_error', codes: [] }), true);
  assert.equal(isHardFailure({ verified: false, status: 301, outcome: 'redirect_not_approved', codes: [] }), true);
  for (const status of [401, 403, 429, 500, 502, 522]) assert.equal(isHardFailure({ verified: false, status, outcome: 'http_error', cause: 'dead_upstream', codes: [] }), false);
  assert.equal(isHardFailure({ verified: false, status: 0, outcome: 'timeout', codes: ['UND_ERR_CONNECT_TIMEOUT'] }), false);
  assert.equal(isHardFailure({ verified: true, status: 200, codes: [] }), false);
  assert.deepEqual(failureCodes({ errorCause: [{ code: 'ENOTFOUND' }], trace: [{ errorCause: [{ code: 'ENOTFOUND' }] }] }), ['ENOTFOUND']);
});

test('retries recover a flake and a second consecutive transient failure is required before red', async () => {
  const calls = [];
  const probe = async api => {
    calls.push(api.id);
    if (api.id === 'flake') return calls.filter(id => id === 'flake').length === 1
      ? { verified: false, status: 403, cause: 'unresolved', outcome: 'access_denied' }
      : { verified: true, status: 200, cause: 'ok', outcome: 'ok_json' };
    return { verified: false, status: 0, cause: 'timeout', outcome: 'timeout', errorCause: [{ code: 'UND_ERR_CONNECT_TIMEOUT' }] };
  };
  const removed = [{ id: 'flake', name: 'Flake' }, { id: 'slow', name: 'Slow' }];
  const audit = { results: [row('flake', 'Flake'), row('slow', 'Slow')] };
  const confirmed = await confirmRemovals(removed, audit, probe, { attempts: 3, backoffMs: [0, 0, 0], sleep: async () => {} });
  assert.equal(confirmed.find(item => item.id === 'flake').recovered, true);
  assert.equal(confirmed.find(item => item.id === 'slow').hard, false);
  const first = flagDecision({ confirmed, additions: [{ id: 'new', name: 'New' }], priorIds: null });
  assert.equal(first.fail, false);
  const prior = new Set(['slow']);
  const second = flagDecision({ confirmed, additions: [], priorIds: prior });
  assert.equal(second.fail, true);
  assert.deepEqual(second.repeated.map(item => item.id), ['slow']);
  const summary = renderSummary({ verifiedCount: 2, decision: { ...first, confirmed } });
  assert.match(summary, /Recovered on retry: Flake/);
  assert.match(summary, /do not fail this job/);
  assert.match(summary, /New/);
});

test('unanimous DNS or TLS failure fails without waiting for a second week', async () => {
  const probe = async api => ({ verified: false, status: 0, cause: api.id === 'tls' ? 'redirect_https' : 'dead_upstream', outcome: api.id === 'tls' ? 'tls_error' : 'network_error', errorCause: [{ code: api.id === 'tls' ? 'CERT_HAS_EXPIRED' : 'ENOTFOUND' }] });
  const removed = [{ id: 'gone', name: 'Gone' }, { id: 'tls', name: 'TLS' }];
  const confirmed = await confirmRemovals(removed, { results: removed.map(item => row(item.id, item.name)) }, probe, { attempts: 3, backoffMs: [0, 0, 0], sleep: async () => {} });
  assert.equal(confirmed.every(item => item.hard), true);
  assert.equal(confirmed.find(item => item.id === 'gone').attempts.length, 2);
  const decision = flagDecision({ confirmed, additions: [], priorIds: null });
  assert.equal(decision.fail, true);
  assert.equal(decision.priorCompared, false);
});

test('a single hard sample mixed with a timeout stays on the two-run rule', async () => {
  let n = 0;
  const probe = async () => (++n === 1
    ? { verified: false, status: 0, cause: 'timeout', outcome: 'timeout' }
    : { verified: false, status: 0, cause: 'dead_upstream', outcome: 'network_error', errorCause: [{ code: 'ENOTFOUND' }] });
  const confirmed = await confirmRemovals([{ id: 'mixed', name: 'Mixed' }], { results: [row('mixed', 'Mixed')] }, probe, { attempts: 2, backoffMs: [0, 0], sleep: async () => {} });
  assert.equal(confirmed[0].hard, false);
  assert.equal(flagDecision({ confirmed, additions: [], priorIds: new Set() }).fail, false);
});

test('scheduled workflow retries before flagging and does not fail on additions alone', () => {
  const workflow = readFileSync('.github/workflows/callable-recheck.yml', 'utf8');
  assert.match(workflow, /actions: read/);
  assert.match(workflow, /callable-recheck-flag\.mjs/);
  assert.match(workflow, /prior-confirm=/);
  assert.doesNotMatch(workflow, /if\(removed\.length\|\|added\.length\)/);
  assert.deepEqual([...priorStrikeIds({ transientFirstSeen: ['slow'], transientRepeated: [], hard: ['gone'] })], ['slow', 'gone']);
  assert.equal(priorStrikeIds(null), null);
});
