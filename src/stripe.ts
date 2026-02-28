// Stripe integration for APIClaw credit purchases
import Stripe from 'stripe';
import { config } from 'dotenv';

// Load environment
config({ path: '.env.local' });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY not set - Stripe features disabled');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// Credit packages
export const CREDIT_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    amountUsd: 10,
    credits: 100,
    bonus: 0,
    description: '$10 → 100 credits',
  },
  growth: {
    id: 'growth',
    name: 'Growth Pack',
    amountUsd: 50,
    credits: 550,
    bonus: 50,
    description: '$50 → 550 credits (10% bonus)',
  },
  scale: {
    id: 'scale',
    name: 'Scale Pack',
    amountUsd: 100,
    credits: 1200,
    bonus: 200,
    description: '$100 → 1,200 credits (20% bonus)',
  },
} as const;

export type PackageType = keyof typeof CREDIT_PACKAGES;

/**
 * Create a Stripe Checkout Session for credit purchase
 */
export async function createCheckoutSession(
  agentId: string,
  packageType: PackageType,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string } | { error: string }> {
  if (!stripe) {
    return { error: 'Stripe not configured' };
  }

  const pkg = CREDIT_PACKAGES[packageType];
  if (!pkg) {
    return { error: `Invalid package: ${packageType}` };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `APIClaw ${pkg.name}`,
              description: pkg.description,
              metadata: {
                packageType,
                credits: pkg.credits.toString(),
              },
            },
            unit_amount: pkg.amountUsd * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        agentId,
        packageType,
        credits: pkg.credits.toString(),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return {
      error: error instanceof Error ? error.message : 'Checkout failed',
    };
  }
}

/**
 * Create a Payment Intent for programmatic payment (agent-to-agent)
 */
export async function createPaymentIntent(
  agentId: string,
  packageType: PackageType
): Promise<
  | { clientSecret: string; paymentIntentId: string; amount: number }
  | { error: string }
> {
  if (!stripe) {
    return { error: 'Stripe not configured' };
  }

  const pkg = CREDIT_PACKAGES[packageType];
  if (!pkg) {
    return { error: `Invalid package: ${packageType}` };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pkg.amountUsd * 100,
      currency: 'usd',
      metadata: {
        agentId,
        packageType,
        credits: pkg.credits.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      amount: pkg.amountUsd,
    };
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    return {
      error: error instanceof Error ? error.message : 'Payment intent failed',
    };
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe) return null;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set');
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

/**
 * Process webhook event and return credit grant info
 */
export interface CreditGrant {
  agentId: string;
  packageType: string;
  credits: number;
  amountUsd: number;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
}

export function processWebhookEvent(event: Stripe.Event): CreditGrant | null {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== 'paid') return null;

      const metadata = session.metadata || {};
      const agentId = metadata.agentId;
      const packageType = metadata.packageType as PackageType;
      const credits = parseInt(metadata.credits || '0', 10);

      if (!agentId || !packageType || !credits) {
        console.error('Missing metadata in checkout session:', metadata);
        return null;
      }

      return {
        agentId,
        packageType,
        credits,
        amountUsd: (session.amount_total || 0) / 100,
        stripeSessionId: session.id,
      };
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const metadata = paymentIntent.metadata || {};
      const agentId = metadata.agentId;
      const packageType = metadata.packageType as PackageType;
      const credits = parseInt(metadata.credits || '0', 10);

      if (!agentId || !packageType || !credits) {
        console.error('Missing metadata in payment intent:', metadata);
        return null;
      }

      return {
        agentId,
        packageType,
        credits,
        amountUsd: paymentIntent.amount / 100,
        stripePaymentIntentId: paymentIntent.id,
      };
    }

    default:
      return null;
  }
}

/**
 * Get Stripe instance (for advanced usage)
 */
export function getStripe(): Stripe | null {
  return stripe;
}

// ============================================
// METERED BILLING (Pay-per-call)
// ============================================

// Stripe Meter configuration
export const METERED_BILLING = {
  meterId: 'mtr_61UFEGojJ0b2awh1441RtJYK3aJTqS9g',
  eventName: 'api_call',
  priceId: 'price_1T5qMQRtJYK3aJTqun4YZLsE',
  productId: 'prod_U3yHbnc4NcLofW',
  pricePerCall: 0.002, // $0.002 per API call
} as const;

/**
 * Report API usage to Stripe Meter
 * Call this after each successful API call
 */
export async function reportUsage(
  customerId: string,
  calls: number = 1,
  idempotencyKey?: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' };
  }

  try {
    // Use Stripe's meter event API
    const event = await stripe.billing.meterEvents.create({
      event_name: METERED_BILLING.eventName,
      payload: {
        stripe_customer_id: customerId,
        value: calls.toString(),
      },
      timestamp: Math.floor(Date.now() / 1000),
    }, {
      idempotencyKey: idempotencyKey || `usage_${customerId}_${Date.now()}_${Math.random()}`,
    });

    return { success: true, eventId: event.identifier };
  } catch (error) {
    console.error('Failed to report usage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Usage reporting failed',
    };
  }
}

/**
 * Create or get a customer in Stripe
 */
export async function getOrCreateCustomer(
  agentId: string,
  email?: string
): Promise<{ customerId: string } | { error: string }> {
  if (!stripe) {
    return { error: 'Stripe not configured' };
  }

  try {
    // Search for existing customer by agentId
    const existing = await stripe.customers.search({
      query: `metadata['agentId']:'${agentId}'`,
    });

    if (existing.data.length > 0) {
      return { customerId: existing.data[0].id };
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: email || `${agentId}@apiclaw.local`,
      metadata: {
        agentId,
        source: 'apiclaw',
      },
    });

    return { customerId: customer.id };
  } catch (error) {
    console.error('Failed to get/create customer:', error);
    return {
      error: error instanceof Error ? error.message : 'Customer creation failed',
    };
  }
}

/**
 * Create a metered subscription for pay-per-call billing
 */
export async function createMeteredSubscription(
  customerId: string,
  paymentMethodId?: string
): Promise<{ subscriptionId: string; status: string } | { error: string }> {
  if (!stripe) {
    return { error: 'Stripe not configured' };
  }

  try {
    // If payment method provided, attach it
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create subscription with metered price
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: METERED_BILLING.priceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
    };
  } catch (error) {
    console.error('Failed to create metered subscription:', error);
    return {
      error: error instanceof Error ? error.message : 'Subscription creation failed',
    };
  }
}

/**
 * Create a checkout session for metered billing subscription
 */
export async function createMeteredCheckoutSession(
  agentId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string } | { error: string }> {
  if (!stripe) {
    return { error: 'Stripe not configured' };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: METERED_BILLING.priceId,
        },
      ],
      metadata: {
        agentId,
        billingType: 'metered',
      },
      subscription_data: {
        metadata: {
          agentId,
          billingType: 'metered',
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  } catch (error) {
    console.error('Metered checkout error:', error);
    return {
      error: error instanceof Error ? error.message : 'Checkout failed',
    };
  }
}

/**
 * Get usage summary for a subscription
 */
export async function getUsageSummary(
  subscriptionId: string
): Promise<{ totalCalls: number; totalCost: number; period: { start: number; end: number } } | { error: string }> {
  if (!stripe) {
    return { error: 'Stripe not configured' };
  }

  try {
    // Get subscription details - use raw API response
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subData = subscription as unknown as {
      current_period_start: number;
      current_period_end: number;
      status: string;
    };

    // For metered billing with meters, usage is tracked via meter events
    // The actual usage amount will show up on the invoice at period end
    // For now, return period info and note that detailed usage is on the Stripe dashboard
    
    return {
      totalCalls: 0, // Usage tracked via meter events, visible in Stripe dashboard
      totalCost: 0,
      period: {
        start: subData.current_period_start || Math.floor(Date.now() / 1000),
        end: subData.current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
      },
    };
  } catch (error) {
    console.error('Failed to get usage summary:', error);
    return {
      error: error instanceof Error ? error.message : 'Usage summary failed',
    };
  }
}

/**
 * Check if a customer has an active metered subscription
 */
export async function hasActiveMeteredSubscription(
  customerId: string
): Promise<{ active: boolean; subscriptionId?: string }> {
  if (!stripe) {
    return { active: false };
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      price: METERED_BILLING.priceId,
    });

    if (subscriptions.data.length > 0) {
      return { active: true, subscriptionId: subscriptions.data[0].id };
    }

    return { active: false };
  } catch (error) {
    console.error('Failed to check subscription:', error);
    return { active: false };
  }
}
