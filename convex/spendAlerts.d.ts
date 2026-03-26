/**
 * Update workspace budget settings
 */
export declare const updateBudgetSettings: any;
/**
 * Record spend and check budget alerts
 * Called after each successful API execution
 * Returns budget status for response
 */
export declare const recordSpend: any;
/**
 * Check budget before execution
 * Returns { allowed: boolean, reason?: string }
 */
export declare const checkBudget: any;
/**
 * Get budget status for workspace dashboard
 */
export declare const getBudgetStatus: any;
/**
 * Get budget status by session token (for dashboard)
 */
export declare const getBudgetStatusByToken: any;
/**
 * Send budget alert email (80% warning)
 */
export declare const sendBudgetAlertEmail: any;
/**
 * Send budget exceeded email
 */
export declare const sendBudgetExceededEmail: any;
/**
 * Reset monthly spend for all workspaces (called by cron on 1st of month)
 */
export declare const resetMonthlySpend: any;
//# sourceMappingURL=spendAlerts.d.ts.map