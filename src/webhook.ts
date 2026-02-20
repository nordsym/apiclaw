// Stripe webhook handler for APIClaw
// Run as: npx ts-node src/webhook.ts

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { verifyWebhookSignature, processWebhookEvent, CREDIT_PACKAGES } from './stripe.js';
import { addCredits } from './credits.js';
import { config } from 'dotenv';

// Load environment
config({ path: '.env.local' });

const app = new Hono();

// Health check
app.get('/', (c) => {
  return c.json({
    service: 'APIClaw Webhook',
    status: 'ok',
    packages: Object.values(CREDIT_PACKAGES).map(p => ({
      id: p.id,
      price: `$${p.amountUsd}`,
      credits: p.credits,
    })),
  });
});

// Stripe webhook endpoint
app.post('/webhook/stripe', async (c) => {
  const signature = c.req.header('stripe-signature');
  if (!signature) {
    return c.json({ error: 'Missing stripe-signature header' }, 400);
  }

  // Get raw body
  const rawBody = await c.req.text();

  // Verify webhook signature
  const event = verifyWebhookSignature(rawBody, signature);
  if (!event) {
    return c.json({ error: 'Invalid webhook signature' }, 400);
  }

  console.log(`[Webhook] Received: ${event.type}`);

  // Process the event
  const creditGrant = processWebhookEvent(event);
  if (!creditGrant) {
    // Not a credit-related event, acknowledge and move on
    return c.json({ received: true, processed: false });
  }

  // Grant credits to the agent
  try {
    const credits = addCredits(creditGrant.agentId, creditGrant.credits);
    
    console.log(`[Webhook] Granted ${creditGrant.credits} credits to ${creditGrant.agentId}`);
    console.log(`[Webhook] New balance: $${credits.balance_usd.toFixed(2)}`);

    return c.json({
      received: true,
      processed: true,
      grant: {
        agentId: creditGrant.agentId,
        credits: creditGrant.credits,
        newBalance: credits.balance_usd,
      },
    });
  } catch (error) {
    console.error('[Webhook] Error granting credits:', error);
    return c.json({ error: 'Failed to grant credits' }, 500);
  }
});

// Manual credit grant endpoint (for testing)
app.post('/admin/grant-credits', async (c) => {
  const body = await c.req.json();
  const { agentId, credits, adminKey } = body;

  // Simple admin key check (use proper auth in production)
  if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'test-admin-key') {
    return c.json({ error: 'Invalid admin key' }, 403);
  }

  if (!agentId || typeof credits !== 'number') {
    return c.json({ error: 'Missing agentId or credits' }, 400);
  }

  const result = addCredits(agentId, credits);
  return c.json({
    success: true,
    agentId,
    creditsGranted: credits,
    newBalance: result.balance_usd,
  });
});

// Start server
const port = parseInt(process.env.WEBHOOK_PORT || '3001', 10);

console.log(`[APIClaw] Webhook server starting on port ${port}`);
console.log(`[APIClaw] Endpoints:`);
console.log(`  GET  /               - Health check`);
console.log(`  POST /webhook/stripe - Stripe webhook`);
console.log(`  POST /admin/grant-credits - Manual credit grant`);

serve({ fetch: app.fetch, port });
