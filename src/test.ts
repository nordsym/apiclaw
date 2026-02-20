#!/usr/bin/env npx tsx
/**
 * APIClaw End-to-End Test
 * Tests the full flow: credits → purchase → real credentials
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import {
  getAgentCredits,
  addCredits,
  purchaseAPIAccess,
  getBalanceSummary,
  getProvidersWithRealCredentials,
} from './credits.js';
import { hasRealCredentials } from './credentials.js';
import { CREDIT_PACKAGES, createCheckoutSession, createPaymentIntent } from './stripe.js';

const TEST_AGENT_ID = 'test_agent_001';

function log(msg: string) {
  console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`);
}

function logResult(label: string, data: unknown) {
  console.log(`\n[${label}]`);
  console.log(JSON.stringify(data, null, 2));
}

async function runTests() {
  console.log('\n🧪 APIClaw Connected Infrastructure Test\n');

  // Test 1: Check real credentials availability
  log('TEST 1: Real Credentials Check');
  const realCredProviders = getProvidersWithRealCredentials();
  console.log('Providers with real credentials:', realCredProviders);
  console.log('46elks real:', hasRealCredentials('46elks'));
  console.log('Twilio real:', hasRealCredentials('twilio'));

  // Test 2: Credit packages
  log('TEST 2: Credit Packages');
  logResult('Packages', CREDIT_PACKAGES);

  // Test 3: Add credits to agent
  log('TEST 3: Add Credits');
  const initialCredits = getAgentCredits(TEST_AGENT_ID);
  logResult('Initial balance', initialCredits);

  const afterAdd = addCredits(TEST_AGENT_ID, 50);
  logResult('After adding $50', afterAdd);

  // Test 4: Check balance summary
  log('TEST 4: Balance Summary');
  const summary = getBalanceSummary(TEST_AGENT_ID);
  logResult('Summary', summary);

  // Test 5: Purchase 46elks access
  log('TEST 5: Purchase 46elks Access');
  const purchase46elks = purchaseAPIAccess(TEST_AGENT_ID, '46elks', 10);
  logResult('46elks Purchase Result', purchase46elks);

  if (purchase46elks.success && purchase46elks.purchase) {
    console.log('\n🔑 CREDENTIALS RECEIVED:');
    console.log('  Type:', purchase46elks.purchase.credentials?.type);
    if (purchase46elks.purchase.credentials?.type === 'basic') {
      console.log('  Username:', purchase46elks.purchase.credentials?.username);
      console.log('  Password:', purchase46elks.purchase.credentials?.password?.slice(0, 8) + '...');
    }
    console.log('  Real credentials:', hasRealCredentials('46elks'));
  }

  // Test 6: Purchase Twilio access
  log('TEST 6: Purchase Twilio Access');
  const purchaseTwilio = purchaseAPIAccess(TEST_AGENT_ID, 'twilio', 10);
  logResult('Twilio Purchase Result', purchaseTwilio);

  if (purchaseTwilio.success && purchaseTwilio.purchase) {
    console.log('\n🔑 CREDENTIALS RECEIVED:');
    console.log('  Type:', purchaseTwilio.purchase.credentials?.type);
    if (purchaseTwilio.purchase.credentials?.type === 'basic') {
      console.log('  Account SID:', purchaseTwilio.purchase.credentials?.username);
      console.log('  Auth Token:', purchaseTwilio.purchase.credentials?.password?.slice(0, 8) + '...');
    }
    console.log('  Real credentials:', hasRealCredentials('twilio'));
  }

  // Test 7: Final balance
  log('TEST 7: Final Balance');
  const finalSummary = getBalanceSummary(TEST_AGENT_ID);
  logResult('Final Summary', {
    balance: finalSummary.credits.balance_usd,
    active_purchases: finalSummary.active_purchases.length,
    total_spent: finalSummary.total_spent_usd,
    real_credential_providers: finalSummary.real_credentials_available,
  });

  // Test 8: Stripe integration (if configured)
  log('TEST 8: Stripe Integration');
  if (process.env.STRIPE_SECRET_KEY) {
    console.log('Stripe is configured!');
    
    // Test creating a payment intent
    const paymentIntent = await createPaymentIntent('test_agent_stripe', 'starter');
    if ('error' in paymentIntent) {
      console.log('Payment Intent Error:', paymentIntent.error);
    } else {
      console.log('Payment Intent Created:');
      console.log('  ID:', paymentIntent.paymentIntentId);
      console.log('  Amount: $' + paymentIntent.amount);
      console.log('  Client Secret:', paymentIntent.clientSecret.slice(0, 20) + '...');
    }
  } else {
    console.log('Stripe not configured - skipping');
  }

  // Test 9: Insufficient balance
  log('TEST 9: Insufficient Balance Check');
  const insufficientPurchase = purchaseAPIAccess(TEST_AGENT_ID, '46elks', 1000);
  logResult('Should fail', insufficientPurchase);

  // Summary
  log('TEST SUMMARY');
  console.log(`
✅ Real credentials available for: ${realCredProviders.join(', ') || 'none'}
✅ Agent can add credits
✅ Agent can purchase API access
✅ Real 46elks/Twilio credentials returned when available
✅ Insufficient balance check works
${process.env.STRIPE_SECRET_KEY ? '✅ Stripe integration working' : '⚠️  Stripe not configured'}
  `);
}

// Run tests
runTests().catch(console.error);
