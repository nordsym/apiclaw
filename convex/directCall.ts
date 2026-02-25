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
