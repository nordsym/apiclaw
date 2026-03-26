/**
 * Create a log entry for an API call
 * Called after each Direct Call execution
 */
export declare const createLog: any;
/**
 * Internal log creation (when workspaceId is already known)
 * Used by execute functions that have already verified the session
 */
export declare const createLogInternal: any;
/**
 * Combined log creation + spend tracking (PRD 2.6)
 * Creates log entry, tracks spend, returns budget status
 * Returns shouldSendAlert: true if 80% threshold crossed (caller should send email)
 */
export declare const createLogWithSpend: any;
/**
 * Get logs for a workspace with pagination and filters
 */
export declare const getLogs: any;
/**
 * Get aggregated log stats for workspace
 */
export declare const getLogStats: any;
/**
 * Get unique providers for filter dropdown
 */
export declare const getProviders: any;
/**
 * Get logs for a specific subagent
 */
export declare const getBySubagent: any;
/**
 * Clear all logs for a workspace (admin cleanup)
 */
export declare const clearWorkspaceLogs: any;
export declare const createProxyLog: any;
//# sourceMappingURL=logs.d.ts.map