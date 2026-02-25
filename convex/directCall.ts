import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// MUTATIONS
// ============================================

/**
 * Save/update provider's Direct Call configuration
 */
export const saveDirectCallConfig = mutation({
  args: {
    id: v.optional(v.id("providerDirectCall")),
    providerId: v.id("providers"),
    apiId: v.optional(v.id("providerAPIs")),
    baseUrl: v.string(),
    authType: v.string(),
    authHeader: v.string(),
    authPrefix: v.string(),
    encryptedMasterKey: v.string(),
    rateLimitPerUser: v.number(),
    rateLimitPerDay: v.number(),
    pricePerRequest: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.id) {
      // Update existing
      await ctx.db.patch(args.id, {
        baseUrl: args.baseUrl,
        authType: args.authType,
        authHeader: args.authHeader,
        authPrefix: args.authPrefix,
        encryptedMasterKey: args.encryptedMasterKey,
        rateLimitPerUser: args.rateLimitPerUser,
        rateLimitPerDay: args.rateLimitPerDay,
        pricePerRequest: args.pricePerRequest,
        updatedAt: now,
      });
      return args.id;
    }

    // Create new
    return await ctx.db.insert("providerDirectCall", {
      providerId: args.providerId,
      apiId: args.apiId,
      baseUrl: args.baseUrl,
      authType: args.authType,
      authHeader: args.authHeader,
      authPrefix: args.authPrefix,
      encryptedMasterKey: args.encryptedMasterKey,
      rateLimitPerUser: args.rateLimitPerUser,
      rateLimitPerDay: args.rateLimitPerDay,
      pricePerRequest: args.pricePerRequest,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Create/update an action for a Direct Call config
 */
export const saveAction = mutation({
  args: {
    id: v.optional(v.id("providerActions")),
    directCallId: v.id("providerDirectCall"),
    name: v.string(),
    displayName: v.string(),
    description: v.string(),
    method: v.string(),
    path: v.string(),
    params: v.array(v.object({
      name: v.string(),
      type: v.string(),
      required: v.boolean(),
      description: v.string(),
      default: v.optional(v.any()),
      in: v.string(),
    })),
    responseMapping: v.array(v.object({
      name: v.string(),
      path: v.string(),
    })),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.id) {
      // Update existing
      await ctx.db.patch(args.id, {
        name: args.name,
        displayName: args.displayName,
        description: args.description,
        method: args.method,
        path: args.path,
        params: args.params,
        responseMapping: args.responseMapping,
        enabled: args.enabled,
        updatedAt: now,
      });
      return args.id;
    }

    // Create new
    return await ctx.db.insert("providerActions", {
      directCallId: args.directCallId,
      name: args.name,
      displayName: args.displayName,
      description: args.description,
      method: args.method,
      path: args.path,
      params: args.params,
      responseMapping: args.responseMapping,
      enabled: args.enabled,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Delete an action
 */
export const deleteAction = mutation({
  args: {
    id: v.id("providerActions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Publish Direct Call - set status to live
 */
export const publishDirectCall = mutation({
  args: {
    id: v.id("providerDirectCall"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "live",
      publishedAt: now,
      updatedAt: now,
    });
    return { success: true, publishedAt: now };
  },
});

/**
 * Set Direct Call status (draft, testing, live)
 */
export const setStatus = mutation({
  args: {
    id: v.id("providerDirectCall"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const update: { status: string; updatedAt: number; publishedAt?: number } = {
      status: args.status,
      updatedAt: now,
    };
    if (args.status === "live") {
      update.publishedAt = now;
    }
    await ctx.db.patch(args.id, update);
    return { success: true };
  },
});

// ============================================
// QUERIES
// ============================================

/**
 * Get Direct Call config by providerId
 */
export const getDirectCallConfig = query({
  args: {
    providerId: v.id("providers"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providerDirectCall")
      .withIndex("by_providerId", (q) => q.eq("providerId", args.providerId))
      .first();
  },
});

/**
 * Get Direct Call config by ID
 */
export const getDirectCallConfigById = query({
  args: {
    id: v.id("providerDirectCall"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get Direct Call config by API ID
 */
export const getDirectCallConfigByApiId = query({
  args: {
    apiId: v.id("providerAPIs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providerDirectCall")
      .withIndex("by_apiId", (q) => q.eq("apiId", args.apiId))
      .first();
  },
});

/**
 * Get all actions for a Direct Call config
 */
export const getActions = query({
  args: {
    directCallId: v.id("providerDirectCall"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providerActions")
      .withIndex("by_directCallId", (q) => q.eq("directCallId", args.directCallId))
      .collect();
  },
});

/**
 * Get single action by directCallId + name
 */
export const getActionByName = query({
  args: {
    directCallId: v.id("providerDirectCall"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providerActions")
      .withIndex("by_directCallId_name", (q) =>
        q.eq("directCallId", args.directCallId).eq("name", args.name)
      )
      .first();
  },
});

/**
 * Get action by ID
 */
export const getActionById = query({
  args: {
    id: v.id("providerActions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get all live Direct Call configs (for public API discovery)
 */
export const getLiveConfigs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("providerDirectCall")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();
  },
});

/**
 * Get Direct Call config by API ID (for test console)
 */
export const getConfig = query({
  args: {
    apiId: v.string(),
  },
  handler: async (ctx, args) => {
    // Try as providerAPIs ID first
    const config = await ctx.db
      .query("providerDirectCall")
      .withIndex("by_apiId")
      .filter((q) => q.eq(q.field("apiId"), args.apiId as any))
      .first();
    
    return config;
  },
});

/**
 * Get Direct Call config by API slug (for MCP/agent execution)
 * Looks up API by name, then gets the Direct Call config
 */
export const getByApiSlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    // Normalize slug (lowercase, replace spaces/dashes)
    const normalizedSlug = args.slug.toLowerCase().replace(/[\s-]/g, '_');
    
    // Find API by name (case-insensitive match)
    const apis = await ctx.db.query("providerAPIs").collect();
    const api = apis.find(a => 
      a.name.toLowerCase().replace(/[\s-]/g, '_') === normalizedSlug ||
      a.name.toLowerCase() === args.slug.toLowerCase()
    );
    
    if (!api) {
      return null;
    }
    
    // Get Direct Call config for this API
    const config = await ctx.db
      .query("providerDirectCall")
      .withIndex("by_apiId")
      .filter((q) => q.eq(q.field("apiId"), api._id))
      .first();
    
    if (!config || config.status !== 'live') {
      return null;
    }
    
    return {
      ...config,
      apiName: api.name,
      apiSlug: normalizedSlug,
    };
  },
});

// ============================================
// TEST ACTION
// ============================================

/**
 * Test an action by calling the actual provider API
 * For V1: Provider passes their own test key
 */
export const testAction = mutation({
  args: {
    token: v.string(),
    directCallId: v.id("providerDirectCall"),
    actionId: v.id("providerActions"),
    params: v.record(v.string(), v.any()),
    testKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    // 1. Verify provider session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    
    if (!session || session.expiresAt < Date.now()) {
      return {
        success: false,
        error: "Unauthorized - invalid or expired session",
        latencyMs: Date.now() - startTime,
      };
    }
    
    // 2. Get directCallConfig
    const config = await ctx.db.get(args.directCallId);
    if (!config) {
      return {
        success: false,
        error: "Direct Call config not found",
        latencyMs: Date.now() - startTime,
      };
    }
    
    // Verify ownership
    if (config.providerId !== session.providerId) {
      return {
        success: false,
        error: "Unauthorized - you don't own this config",
        latencyMs: Date.now() - startTime,
      };
    }
    
    // 3. Get action
    const action = await ctx.db.get(args.actionId);
    if (!action) {
      return {
        success: false,
        error: "Action not found",
        latencyMs: Date.now() - startTime,
      };
    }
    
    // 4. Get API key (use testKey if provided, else use stored key)
    // Note: For production, encryptedMasterKey would need server-side decryption
    // For V1 test console, we use testKey directly
    const apiKey = args.testKey || config.encryptedMasterKey;
    if (!apiKey) {
      return {
        success: false,
        error: "No API key provided. Add a test key or configure master key.",
        latencyMs: Date.now() - startTime,
      };
    }
    
    // 5. Build URL with path params
    let path = action.path;
    const queryParams: Record<string, string> = {};
    const bodyParams: Record<string, unknown> = {};
    
    for (const paramDef of action.params) {
      const value = args.params[paramDef.name];
      if (value === undefined || value === "") continue;
      
      if (paramDef.in === "path") {
        // Replace {paramName} in path
        path = path.replace(`{${paramDef.name}}`, String(value));
      } else if (paramDef.in === "query") {
        queryParams[paramDef.name] = String(value);
      } else if (paramDef.in === "body") {
        bodyParams[paramDef.name] = value;
      }
    }
    
    // Build full URL
    let url = config.baseUrl.replace(/\/$/, "") + path;
    const queryString = new URLSearchParams(queryParams).toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
    
    // 6. Build headers with auth
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    };
    
    // Add auth header
    if (config.authType !== "none" && apiKey) {
      const authValue = config.authPrefix 
        ? `${config.authPrefix}${apiKey}` 
        : apiKey;
      headers[config.authHeader] = authValue;
    }
    
    // 7. Build fetch options
    const fetchOptions: RequestInit = {
      method: action.method,
      headers,
    };
    
    // Add body for non-GET requests
    if (action.method !== "GET" && Object.keys(bodyParams).length > 0) {
      fetchOptions.body = JSON.stringify(bodyParams);
    }
    
    // 8. Execute request
    try {
      const response = await fetch(url, fetchOptions);
      const latencyMs = Date.now() - startTime;
      
      // Try to parse response as JSON, fallback to text
      let data: unknown;
      const contentType = response.headers.get("content-type") || "";
      
      if (contentType.includes("application/json")) {
        try {
          data = await response.json();
        } catch {
          data = await response.text();
        }
      } else {
        data = await response.text();
      }
      
      return {
        success: response.ok,
        status: response.status,
        data,
        latencyMs,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Request failed",
        latencyMs: Date.now() - startTime,
      };
    }
  },
});
