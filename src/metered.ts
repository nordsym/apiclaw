/**
 * APIClaw Metered Billing - Pay-per-call execution wrapper
 * 
 * Usage:
 * 1. Customer signs up with metered subscription
 * 2. Each API call via executeMetered() reports usage to Stripe
 * 3. Customer is billed at end of billing period based on usage
 */

import { executeAPICall } from './execute.js';
import { reportUsage, hasActiveMeteredSubscription, METERED_BILLING } from './stripe.js';

interface MeteredResult {
  success: boolean;
  provider: string;
  action: string;
  data?: unknown;
  error?: string;
  cost?: number;
  billing?: {
    tracked: boolean;
    customerId?: string;
    pricePerCall: number;
  };
}

interface MeteredOptions {
  /** Stripe customer ID for usage tracking */
  customerId?: string;
  /** Skip usage reporting (for testing/free tier) */
  skipBilling?: boolean;
  /** Provider-specific API key (managed-provider mode) */
  customerKey?: string;
  /** User ID for dynamic providers */
  userId?: string;
}

/**
 * Execute an API call with metered billing tracking
 * 
 * If customerId is provided and has active metered subscription,
 * usage is reported to Stripe after successful execution.
 */
export async function executeMetered(
  providerId: string,
  action: string,
  params: Record<string, unknown>,
  options: MeteredOptions = {}
): Promise<MeteredResult> {
  const { customerId, skipBilling, customerKey, userId } = options;

  // Execute the API call
  const result = await executeAPICall(
    providerId,
    action,
    params,
    userId,
    customerKey
  );

  // Build response
  const response: MeteredResult = {
    ...result,
    billing: {
      tracked: false,
      pricePerCall: METERED_BILLING.pricePerCall,
    },
  };

  // Skip billing if requested or no customer
  if (skipBilling || !customerId) {
    return response;
  }

  // Skip billing for failed calls
  if (!result.success) {
    return response;
  }

  // Check for active metered subscription
  const subscription = await hasActiveMeteredSubscription(customerId);
  if (!subscription.active) {
    console.log(`Customer ${customerId} has no active metered subscription`);
    return response;
  }

  // Report usage to Stripe meter
  const usageReport = await reportUsage(
    customerId,
    1,
    `${customerId}_${providerId}_${action}_${Date.now()}`
  );

  if (usageReport.success) {
    response.billing = {
      tracked: true,
      customerId,
      pricePerCall: METERED_BILLING.pricePerCall,
    };
  } else {
    console.error(`Failed to report usage for ${customerId}:`, usageReport.error);
  }

  return response;
}

/**
 * Execute multiple API calls in batch with usage tracking
 */
export async function executeMeteredBatch(
  calls: Array<{
    provider: string;
    action: string;
    params: Record<string, unknown>;
  }>,
  options: MeteredOptions = {}
): Promise<MeteredResult[]> {
  const results = await Promise.all(
    calls.map((call) =>
      executeMetered(call.provider, call.action, call.params, options)
    )
  );

  return results;
}

/**
 * Calculate estimated cost for a number of API calls
 */
export function estimateCost(callCount: number): {
  calls: number;
  pricePerCall: number;
  totalCost: number;
  currency: string;
} {
  return {
    calls: callCount,
    pricePerCall: METERED_BILLING.pricePerCall,
    totalCost: callCount * METERED_BILLING.pricePerCall,
    currency: 'USD',
  };
}

/**
 * Get metered billing configuration
 */
export function getMeteredConfig(): typeof METERED_BILLING {
  return METERED_BILLING;
}
