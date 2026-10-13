import assert from 'node:assert/strict';
import { convexMutation, ConvexCallError } from '../landing/src/lib/convex';
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
