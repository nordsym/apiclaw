/**
 * Get chain executions for a workspace (authenticated via session token)
 */
export declare const getChainExecutions: any;
/**
 * Get full trace for a single chain (authenticated via session token)
 */
export declare const getChainTraceAuth: any;
/**
 * Resume a failed/paused chain (authenticated via session token)
 */
export declare const resumeChainAuth: any;
/**
 * Get chain statistics for workspace (authenticated via session token)
 */
export declare const getChainStatsAuth: any;
/**
 * Create a new chain execution record (internal)
 */
export declare const createChainInternal: any;
/**
 * Create a new chain execution record (public API)
 */
export declare const createChain: any;
/**
 * Create chain from template
 */
export declare const createChainFromTemplate: any;
/**
 * Execute a single step and store the result
 */
export declare const executeStep: any;
/**
 * Record step completion with result
 */
export declare const completeStep: any;
/**
 * Advance chain to next step
 */
export declare const advanceChain: any;
/**
 * Handle chain failure
 */
export declare const failChain: any;
/**
 * Resume chain from failed step (public mutation)
 */
export declare const resumeChain: any;
/**
 * Mark chain as completed
 */
export declare const completeChain: any;
/**
 * Pause chain execution
 */
export declare const pauseChain: any;
export declare const saveChainTemplate: any;
export declare const deleteChainTemplate: any;
export declare const getChain: any;
export declare const getChainTrace: any;
export declare const listChains: any;
export declare const listChainTemplates: any;
export declare const getChainTemplate: any;
export declare const getChainStats: any;
export declare const runChain: any;
export declare const runParallelSteps: any;
//# sourceMappingURL=chains.d.ts.map