/**
 * Test script for APIvault
 * Run: pnpm test
 */

import { discoverAPIs, getAPIDetails, getCategories, getAllAPIs } from './discovery.js';
import { addCredits, purchaseAPIAccess, getBalanceSummary } from './credits.js';

console.log('🔐 APIvault Test Suite\n');
console.log('='.repeat(50));

// Test 1: Discovery
console.log('\n📡 Test 1: API Discovery');
console.log('-'.repeat(40));

const smsResults = discoverAPIs('send SMS to Sweden');
console.log(`Query: "send SMS to Sweden"`);
console.log(`Results: ${smsResults.length}`);
smsResults.forEach(r => {
  console.log(`  - ${r.provider.name} (score: ${r.relevance_score})`);
  console.log(`    Reasons: ${r.match_reasons.join(', ')}`);
});

const emailResults = discoverAPIs('send email with attachments');
console.log(`\nQuery: "send email with attachments"`);
console.log(`Results: ${emailResults.length}`);
emailResults.forEach(r => {
  console.log(`  - ${r.provider.name} (score: ${r.relevance_score})`);
});

const aiResults = discoverAPIs('text to speech voice');
console.log(`\nQuery: "text to speech voice"`);
console.log(`Results: ${aiResults.length}`);
aiResults.forEach(r => {
  console.log(`  - ${r.provider.name} (score: ${r.relevance_score})`);
});

// Test 2: Get API Details
console.log('\n📋 Test 2: API Details');
console.log('-'.repeat(40));

const elks = getAPIDetails('46elks');
if (elks) {
  console.log(`\n${elks.name}:`);
  console.log(`  Category: ${elks.category}`);
  console.log(`  Capabilities: ${elks.capabilities.join(', ')}`);
  console.log(`  Auth: ${elks.auth_type}`);
  console.log(`  Docs: ${elks.docs_url}`);
  console.log(`  Success Rate: ${elks.agent_success_rate * 100}%`);
}

// Test 3: Categories
console.log('\n📂 Test 3: Categories');
console.log('-'.repeat(40));

const categories = getCategories();
console.log(`Available categories: ${categories.join(', ')}`);

// Test 4: Credits System
console.log('\n💰 Test 4: Credit System');
console.log('-'.repeat(40));

const testAgent = 'agent_test_123';

// Check initial balance
let balance = getBalanceSummary(testAgent);
console.log(`Initial balance: $${balance.credits.balance_usd}`);

// Add credits
addCredits(testAgent, 50);
balance = getBalanceSummary(testAgent);
console.log(`After adding $50: $${balance.credits.balance_usd}`);

// Purchase API access
console.log('\n🛒 Purchasing 46elks access for $10...');
const purchase = purchaseAPIAccess(testAgent, '46elks', 10);
if (purchase.success) {
  console.log(`  ✅ Purchase successful!`);
  console.log(`  Purchase ID: ${purchase.purchase!.id}`);
  console.log(`  Credits received: ${purchase.purchase!.credits_purchased}`);
  console.log(`  Credentials:`);
  console.log(`    Type: ${purchase.purchase!.credentials!.type}`);
  if (purchase.purchase!.credentials!.username) {
    console.log(`    Username: ${purchase.purchase!.credentials!.username}`);
    console.log(`    Password: ${purchase.purchase!.credentials!.password?.slice(0, 8)}...`);
  }
  if (purchase.purchase!.credentials!.api_key) {
    console.log(`    API Key: ${purchase.purchase!.credentials!.api_key.slice(0, 12)}...`);
  }
} else {
  console.log(`  ❌ Purchase failed: ${purchase.error}`);
}

// Check updated balance
balance = getBalanceSummary(testAgent);
console.log(`\nFinal balance: $${balance.credits.balance_usd}`);
console.log(`Total spent: $${balance.total_spent_usd}`);
console.log(`Active purchases: ${balance.active_purchases.length}`);

// Try to overspend
console.log('\n🚫 Test: Overspending...');
const badPurchase = purchaseAPIAccess(testAgent, 'openrouter', 100);
if (!badPurchase.success) {
  console.log(`  ✅ Correctly rejected: ${badPurchase.error}`);
}

// Test 5: All APIs
console.log('\n📚 Test 5: Full API Registry');
console.log('-'.repeat(40));

const allAPIs = getAllAPIs();
console.log(`Total APIs in registry: ${allAPIs.length}\n`);

for (const api of allAPIs) {
  console.log(`${api.name} (${api.id})`);
  console.log(`  ${api.description.slice(0, 60)}...`);
  console.log(`  Category: ${api.category}`);
  console.log(`  Free tier: ${api.pricing.free_tier ? 'Yes' : 'No'}`);
  console.log('');
}

console.log('='.repeat(50));
console.log('✅ All tests completed!\n');
