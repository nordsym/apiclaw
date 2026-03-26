/**
 * Get main agent info for a workspace
 */
export declare const getMainAgent: any;
/**
 * Rename the main agent
 */
export declare const renameMainAgent: any;
/**
 * Initialize main agent (auto-generate name and ID if not set)
 * Called on first API call
 */
export declare const ensureMainAgent: any;
/**
 * Get all subagents for a workspace
 */
export declare const getSubagents: any;
/**
 * Get stats for a specific subagent
 */
export declare const getSubagentStats: any;
/**
 * Rename a subagent
 */
export declare const renameSubagent: any;
/**
 * Track a subagent call (upsert subagent record)
 * Called when X-APIClaw-Subagent header is present
 */
export declare const trackSubagentCall: any;
/**
 * Pre-register a task agent (subagent)
 * Allows agents to be registered before they make their first call
 */
export declare const registerTaskAgent: any;
/**
 * Update AI backend for workspace or subagent
 * Called when X-APIClaw-AI-Backend header is present
 */
export declare const updateAIBackend: any;
/**
 * Get agent overview for workspace (main + subagents summary)
 */
export declare const getAgentOverview: any;
/**
 * Delete a subagent
 */
export declare const deleteSubagent: any;
/**
 * Update subagent stats (call count, last active)
 * Internal helper for tracking
 */
export declare const updateSubagentStats: any;
//# sourceMappingURL=agents.d.ts.map