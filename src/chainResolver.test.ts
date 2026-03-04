/**
 * Quick tests for chainResolver
 */

import {
  extractReferences,
  parseReference,
  resolveReferences,
  validateReferences,
  evaluateCondition,
  ChainContext,
  ChainStep,
} from './chainResolver.js';

// Test data
const mockContext: ChainContext = {
  results: {
    step1: { url: 'https://example.com/image.png', id: '123' },
    step2: { data: { items: [{ name: 'first' }, { name: 'second' }] } },
  },
  inputs: { email: 'test@example.com', count: 5 },
  currentIndex: 2,
  startedAt: '2024-01-01T00:00:00Z',
  prevStepId: 'step2',
  parallelResults: [
    { url: 'https://a.com' },
    { url: 'https://b.com' },
  ],
  forEachItem: { id: 42, name: 'test-item' },
  forEachIndex: 3,
};

// ============================================================================
// TESTS
// ============================================================================

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (e: any) {
    console.log(`❌ ${name}: ${e.message}`);
  }
}

function assertEqual(actual: any, expected: any, msg?: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`${msg || 'Assertion failed'}: expected ${e}, got ${a}`);
  }
}

console.log('\n=== Reference Extraction ===\n');

test('extracts simple step reference', () => {
  const refs = extractReferences('$step1.url');
  assertEqual(refs.length, 1);
  assertEqual(refs[0].type, 'step');
  assertEqual(refs[0].stepId, 'step1');
  assertEqual(refs[0].path, ['url']);
});

test('extracts $prev reference', () => {
  const refs = extractReferences('$prev.data');
  assertEqual(refs.length, 1);
  assertEqual(refs[0].type, 'prev');
  assertEqual(refs[0].path, ['data']);
});

test('extracts nested path', () => {
  const refs = extractReferences('$step2.data.items[0].name');
  assertEqual(refs.length, 1);
  assertEqual(refs[0].path, ['data', 'items', '0', 'name']);
});

test('extracts multiple references', () => {
  const refs = extractReferences('Send $step1.url to $inputs.email');
  assertEqual(refs.length, 2);
  assertEqual(refs[0].raw, '$step1.url');
  assertEqual(refs[1].raw, '$inputs.email');
});

test('extracts $parallel with index', () => {
  const refs = extractReferences('$parallel[0].url');
  assertEqual(refs.length, 1);
  assertEqual(refs[0].type, 'parallel');
  assertEqual(refs[0].arrayIndex, 0);
  assertEqual(refs[0].path, ['url']);
});

test('extracts built-in $chain variables', () => {
  const refs = extractReferences('$chain.startedAt');
  assertEqual(refs.length, 1);
  assertEqual(refs[0].type, 'chain');
  assertEqual(refs[0].path, ['startedAt']);
});

console.log('\n=== Reference Resolution ===\n');

test('resolves step reference', () => {
  const result = resolveReferences({ url: '$step1.url' }, mockContext);
  assertEqual(result.url, 'https://example.com/image.png');
});

test('resolves $prev reference', () => {
  const result = resolveReferences({ data: '$prev.data' }, mockContext);
  assertEqual(result.data, mockContext.results.step2.data);
});

test('resolves nested path with array', () => {
  const result = resolveReferences({ name: '$step2.data.items[1].name' }, mockContext);
  assertEqual(result.name, 'second');
});

test('resolves $inputs reference', () => {
  const result = resolveReferences({ to: '$inputs.email' }, mockContext);
  assertEqual(result.to, 'test@example.com');
});

test('resolves $parallel reference', () => {
  const result = resolveReferences({ url: '$parallel[1].url' }, mockContext);
  assertEqual(result.url, 'https://b.com');
});

test('resolves $chain.startedAt', () => {
  const result = resolveReferences({ time: '$chain.startedAt' }, mockContext);
  assertEqual(result.time, '2024-01-01T00:00:00Z');
});

test('resolves $item in forEach', () => {
  const result = resolveReferences({ id: '$item.id' }, mockContext);
  assertEqual(result.id, 42);
});

test('resolves $index in forEach', () => {
  const result = resolveReferences({ idx: '$index' }, mockContext);
  assertEqual(result.idx, 3);
});

test('preserves non-reference strings', () => {
  const result = resolveReferences({ msg: 'Hello world' }, mockContext);
  assertEqual(result.msg, 'Hello world');
});

test('interpolates multiple references in string', () => {
  const result = resolveReferences({ msg: 'File at $step1.url for $inputs.email' }, mockContext);
  assertEqual(result.msg, 'File at https://example.com/image.png for test@example.com');
});

test('resolves nested objects', () => {
  const result = resolveReferences({
    outer: {
      inner: '$step1.id',
      deep: { value: '$inputs.count' }
    }
  }, mockContext);
  assertEqual(result.outer.inner, '123');
  assertEqual(result.outer.deep.value, 5);
});

test('resolves arrays', () => {
  const result = resolveReferences({
    urls: ['$parallel[0].url', '$parallel[1].url']
  }, mockContext);
  assertEqual(result.urls, ['https://a.com', 'https://b.com']);
});

console.log('\n=== Validation ===\n');

test('validates valid chain', () => {
  const steps: ChainStep[] = [
    { id: 'step1', provider: 'brave', action: 'search', params: { query: 'test' } },
    { id: 'step2', provider: 'firecrawl', action: 'scrape', params: { url: '$step1.url' } },
  ];
  const result = validateReferences(steps);
  assertEqual(result.valid, true);
  assertEqual(result.errors.length, 0);
});

test('detects reference to undefined step', () => {
  const steps: ChainStep[] = [
    { id: 'step1', provider: 'brave', action: 'search', params: { url: '$nonexistent.url' } },
  ];
  const result = validateReferences(steps);
  assertEqual(result.valid, false);
  assertEqual(result.errors.length, 1);
});

test('detects forward reference', () => {
  const steps: ChainStep[] = [
    { id: 'step1', provider: 'brave', action: 'search', params: { url: '$step2.url' } },
    { id: 'step2', provider: 'firecrawl', action: 'scrape', params: {} },
  ];
  const result = validateReferences(steps);
  assertEqual(result.valid, false);
});

test('detects $prev in first step', () => {
  const steps: ChainStep[] = [
    { id: 'step1', provider: 'brave', action: 'search', params: { url: '$prev.url' } },
  ];
  const result = validateReferences(steps);
  assertEqual(result.valid, false);
});

console.log('\n=== Condition Evaluation ===\n');

test('evaluates equality', () => {
  assertEqual(evaluateCondition('"test" === "test"', mockContext), true);
  assertEqual(evaluateCondition('"test" === "other"', mockContext), false);
});

test('evaluates inequality', () => {
  assertEqual(evaluateCondition('5 !== 3', mockContext), true);
});

test('evaluates comparison', () => {
  assertEqual(evaluateCondition('10 > 5', mockContext), true);
  assertEqual(evaluateCondition('3 < 2', mockContext), false);
  assertEqual(evaluateCondition('5 >= 5', mockContext), true);
});

test('evaluates logical AND', () => {
  assertEqual(evaluateCondition('true && true', mockContext), true);
  assertEqual(evaluateCondition('true && false', mockContext), false);
});

test('evaluates logical OR', () => {
  assertEqual(evaluateCondition('false || true', mockContext), true);
  assertEqual(evaluateCondition('false || false', mockContext), false);
});

test('evaluates negation', () => {
  assertEqual(evaluateCondition('!false', mockContext), true);
  assertEqual(evaluateCondition('!true', mockContext), false);
});

test('evaluates with resolved references', () => {
  // $inputs.count === 5
  const ctx = { ...mockContext, results: { check: { status: 'success' } } };
  ctx.prevStepId = 'check';
  assertEqual(evaluateCondition('$prev.status === "success"', ctx), true);
});

console.log('\n=== All Tests Complete ===\n');
