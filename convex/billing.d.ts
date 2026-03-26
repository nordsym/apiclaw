/**
 * Link a Stripe customer to a workspace
 */
export declare const linkCustomer: any;
/**
 * Update subscription status for a workspace
 */
export declare const updateSubscription: any;
/**
 * Record daily usage for billing
 */
export declare const recordUsage: any;
/**
 * Process a successful payment (from webhook)
 */
export declare const processPayment: any;
/**
 * Increment credit balance (for prepaid credits)
 */
export declare const incrementCredits: any;
/**
 * Decrement credit balance (when using prepaid credits)
 */
export declare const decrementCredits: any;
/**
 * Mark usage as reported to Stripe
 */
export declare const markUsageReported: any;
/**
 * Update invoice status (from webhook)
 */
export declare const updateInvoiceStatus: any;
/**
 * Reset usage count on subscription cancellation
 * Gives user a clean slate when downgrading to free
 */
export declare const resetUsageOnCancellation: any;
/**
 * Update payment method info (from webhook)
 */
export declare const updatePaymentMethodInfo: any;
/**
 * Get billing info for a workspace
 */
export declare const getInfo: any;
/**
 * Get current period usage
 */
export declare const getCurrentUsage: any;
/**
 * Get invoices for a workspace
 */
export declare const getInvoices: any;
/**
 * Get unreported usage records (for cron job)
 */
export declare const getUnreportedUsage: any;
/**
 * Get workspace by Stripe customer ID
 */
export declare const getByStripeCustomerId: any;
/**
 * Get workspace by ID
 */
export declare const getWorkspace: any;
/**
 * Get all workspaces with active Stripe subscriptions (internal)
 */
export declare const getActiveSubscriptions: any;
/**
 * Get unreported usage records for a specific workspace (internal)
 */
export declare const getUnreportedUsageForWorkspace: any;
/**
 * Mark multiple usage records as reported (internal)
 */
export declare const markUsageRecordsReported: any;
/**
 * Report usage to Stripe for a single workspace
 * Internal action - called by the daily cron
 */
export declare const reportUsageToStripe: any;
/**
 * Daily cron job: Report all unreported usage to Stripe
 * Runs at 00:05 UTC
 */
export declare const reportAllUsageToStripe: any;
//# sourceMappingURL=billing.d.ts.map