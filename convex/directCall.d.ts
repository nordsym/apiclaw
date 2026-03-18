/**
 * Save/update provider's Direct Call configuration
 */
export declare const saveDirectCallConfig: any;
/**
 * Save Direct Call config with token auth (used by frontend)
 */
export declare const saveConfig: any;
/**
 * Create/update an action for a Direct Call config
 */
export declare const saveAction: any;
/**
 * Delete an action
 */
export declare const deleteAction: any;
/**
 * Publish Direct Call - set status to live
 * Also marks apiListed earn progress for the provider's workspace
 */
export declare const publishDirectCall: any;
/**
 * Set Direct Call status (draft, testing, live)
 */
export declare const setStatus: any;
/**
 * Get Direct Call config by providerId
 */
export declare const getDirectCallConfig: any;
/**
 * Get Direct Call config by ID
 */
export declare const getDirectCallConfigById: any;
/**
 * Get Direct Call config by API ID
 */
export declare const getDirectCallConfigByApiId: any;
/**
 * Get all actions for a Direct Call config
 */
export declare const getActions: any;
/**
 * Get single action by directCallId + name
 */
export declare const getActionByName: any;
/**
 * Get action by ID
 */
export declare const getActionById: any;
/**
 * DEBUG: Get all Direct Call configs
 */
export declare const getAllConfigs: any;
/**
 * Get all live Direct Call configs (for public API discovery)
 */
export declare const getLiveConfigs: any;
/**
 * Get Direct Call config by API ID (for test console)
 */
export declare const getConfig: any;
/**
 * Get Direct Call config by API slug (for MCP/agent execution)
 * Looks up API by name, then gets the Direct Call config
 */
export declare const getByApiSlug: any;
/**
 * Test an action by calling the actual provider API
 * For V1: Provider passes their own test key
 */
export declare const testAction: any;
//# sourceMappingURL=directCall.d.ts.map