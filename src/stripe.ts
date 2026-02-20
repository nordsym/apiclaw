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
