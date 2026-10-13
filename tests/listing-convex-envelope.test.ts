import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { convexMutation, ConvexCallError } = createRequire(import.meta.url)('../landing/src/lib/convex.ts');
const nativeFetch = globalThis.fetch;
try {
  globalThis.fetch = (async () => Response.json({ status: 'error', errorMessage: '[Request ID: synthetic] Server Error', errorData: { code: 'LISTING_REVIEW_STALE', message: 'Review is stale' } })) as typeof fetch;
  await assert.rejects(convexMutation('discoveryListings:operatorReview', {}), error => {
    assert(error instanceof ConvexCallError);
    assert.equal((error.data as any).code, 'LISTING_REVIEW_STALE');
    assert.equal(error.message, '[Request ID: synthetic] Server Error');
    return true;
  });
  console.log('PASS: Convex HTTP application errors preserve structured errorData despite generic Server Error text');
} finally { globalThis.fetch = nativeFetch; }
