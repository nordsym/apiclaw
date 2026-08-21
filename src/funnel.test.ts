/**
 * Tests for funnel classification + registration guard + event canon.
 * Run: npx tsx src/funnel.test.ts
 */
import { strict as assert } from 'node:assert';
import { classifyLocalSource } from './funnel-client.js';
import {
  requireVerifiedOwner,
  FREE_CALL_PATHS,
  ENFORCED_CALL_PATHS,
  type WorkspaceContextLike,
} from './registration-guard.js';

let failed = 0;
let passed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e: any) {
    console.log(`❌ ${name}`);
    console.log(`   ${e.message || e}`);
    failed++;
  }
}

// ------------------------------------------------------------------
// Classification
// ------------------------------------------------------------------
test('classify: human is default', () => {
  assert.equal(classifyLocalSource({ env: {} }), 'human');
});

test('classify: CI env flag → ci', () => {
  assert.equal(classifyLocalSource({ env: { CI: 'true' } }), 'ci');
  assert.equal(classifyLocalSource({ env: { GITHUB_ACTIONS: '1' } }), 'ci');
  assert.equal(classifyLocalSource({ env: { CIRCLECI: 'true' } }), 'ci');
});

test('classify: CI=false is NOT ci', () => {
  assert.equal(classifyLocalSource({ env: { CI: 'false' } }), 'human');
  assert.equal(classifyLocalSource({ env: { CI: '0' } }), 'human');
});

test('classify: bot UA → bot', () => {
  assert.equal(classifyLocalSource({ env: {}, userAgent: 'curl/7.88' }), 'bot');
  assert.equal(
    classifyLocalSource({ env: {}, userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)' }),
    'bot'
  );
  assert.equal(classifyLocalSource({ env: {}, userAgent: 'python-requests/2.31' }), 'bot');
});

test('classify: internal email domain → internal', () => {
  assert.equal(
    classifyLocalSource({ env: {}, email: 'someone@nordsym.com' }),
    'internal'
  );
  assert.equal(
    classifyLocalSource({ env: {}, email: 'test@apiclaw.cloud' }),
    'internal'
  );
});

test('classify: internal exact email → internal (even with CI set)', () => {
  assert.equal(
    classifyLocalSource({
      env: { CI: 'true' },
      email: 'gustavnordsync@gmail.com',
    }),
    'internal'
  );
});

test('classify: precedence internal > ci > bot > human', () => {
  // internal wins over CI
  assert.equal(
    classifyLocalSource({ env: { CI: 'true' }, email: 'x@nordsym.com' }),
    'internal'
  );
  // ci wins over bot
  assert.equal(
    classifyLocalSource({ env: { CI: 'true' }, userAgent: 'curl/8' }),
    'ci'
  );
});

// ------------------------------------------------------------------
// requireVerifiedOwner
// ------------------------------------------------------------------
const good: WorkspaceContextLike = {
  sessionToken: 'tok',
  workspaceId: 'ws_1',
  email: 'user@example.com',
  tier: 'free',
  status: 'active',
  usageRemaining: 42,
  usageCount: 8,
};

test('guard: no workspace → no_session', () => {
  const r = requireVerifiedOwner(null);
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.reason, 'no_session');
    assert.equal(r.payload.command, 'npx @nordsym/apiclaw auth login');
    assert.equal(r.payload.action, 'agent_auth_required');
    assert.match(String(r.payload.first_call_prompt), /nasa|fixer_latest|brave_search/);
  }
});

test('guard: workspace without email → pending_verification', () => {
  const r = requireVerifiedOwner({ ...good, email: '' });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, 'pending_verification');
});

test('guard: workspace status pending → not_verified', () => {
  const r = requireVerifiedOwner({ ...good, status: 'pending' });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, 'not_verified');
});

test('guard: stale local quota never overrides authoritative gateway PAYG', () => {
  const r = requireVerifiedOwner({ ...good, usageRemaining: 0 });
  assert.equal(r.ok, true);
});

test('guard: happy path → ok', () => {
  const r = requireVerifiedOwner(good);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.ctx.email, 'user@example.com');
});

test('guard: unlimited (usageRemaining=-1) → ok', () => {
  const r = requireVerifiedOwner({ ...good, usageRemaining: -1 });
  assert.equal(r.ok, true);
});

// ------------------------------------------------------------------
// Enforcement matrix coverage
// ------------------------------------------------------------------
test('matrix: discover_apis is free', () => {
  assert.equal(FREE_CALL_PATHS.has('discover_apis'), true);
  assert.equal(ENFORCED_CALL_PATHS.has('discover_apis'), false);
});

test('matrix: call_api / capability / resume_chain are enforced', () => {
  for (const p of ['call_api', 'capability', 'resume_chain']) {
    assert.equal(ENFORCED_CALL_PATHS.has(p), true, `${p} should be enforced`);
  }
});

test('matrix: retired OTP tools are not anonymous paths', () => {
  assert.equal(FREE_CALL_PATHS.has('register_owner'), false);
  assert.equal(FREE_CALL_PATHS.has('verify_code'), false);
});

test('matrix: free and enforced sets are disjoint', () => {
  for (const p of FREE_CALL_PATHS) {
    assert.equal(ENFORCED_CALL_PATHS.has(p), false, `${p} is in both sets`);
  }
});

// ------------------------------------------------------------------
// Event canon type surface
// ------------------------------------------------------------------
import type { FunnelEventName } from './funnel-client.js';

test('event canon: only client-originated events are typed', () => {
  const names: FunnelEventName[] = [
    'install',
    'first_run',
    'cli_browser_callback_success',
    'register_owner',
    'verify_code',
    'cli_browser_callback_failed',
    'register_owner_failed',
    'verify_code_failed',
    'call_api_blocked',
    'call_api_error',
    'quota_hit',
    'gateway_retry',
  ];
  assert.equal(names.length, 12);
});

console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
