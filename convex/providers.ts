import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Register a new provider and their first API
export const registerProvider = mutation({
  args: {
    provider: v.object({
      name: v.string(),
      email: v.string(),
      website: v.optional(v.string()),
    }),
    api: v.object({
      name: v.string(),
      description: v.string(),
      category: v.string(),
      openApiUrl: v.optional(v.string()),
      docsUrl: v.optional(v.string()),
      pricingModel: v.string(),
      pricingNotes: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if provider already exists by email
    const existing = await ctx.db
      .query("providers")
      .withIndex("by_email", (q) => q.eq("email", args.provider.email))
      .first();

    let providerId;

    if (existing) {
      // Use existing provider
      providerId = existing._id;
    } else {
      // Create new provider - auto-approve for now
      providerId = await ctx.db.insert("providers", {
        name: args.provider.name,
        email: args.provider.email,
        website: args.provider.website,
        status: "approved", // Auto-approve for MVP
        createdAt: now,
        updatedAt: now,
        approvedAt: now,
      });
    }

    // Create the API listing - auto-approve for now
    const apiId = await ctx.db.insert("providerAPIs", {
      providerId,
      name: args.api.name,
      description: args.api.description,
      category: args.api.category,
      openApiUrl: args.api.openApiUrl,
      docsUrl: args.api.docsUrl,
      pricingModel: args.api.pricingModel,
      pricingNotes: args.api.pricingNotes,
      status: "approved", // Auto-approve for MVP
      createdAt: now,
      approvedAt: now,
      discoveryCount: 0,
    });

    return { providerId, apiId };
  },
});

// Get provider by email
export const getProviderByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Get all APIs for a provider
export const getProviderAPIs = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providerAPIs")
      .withIndex("by_providerId", (q) => q.eq("providerId", args.providerId))
      .collect();
  },
});

// Get all approved APIs (for the registry)
export const getApprovedAPIs = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("providerAPIs")
      .withIndex("by_status", (q) => q.eq("status", "approved"));

    const apis = await query.collect();

    // Filter by category if provided
    let filtered = args.category
      ? apis.filter((api) => api.category === args.category)
      : apis;

    // Apply limit
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

// Get API categories with counts
export const getCategories = query({
  handler: async (ctx) => {
    const apis = await ctx.db
      .query("providerAPIs")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();

    const categories: Record<string, number> = {};
    for (const api of apis) {
      categories[api.category] = (categories[api.category] || 0) + 1;
    }

    return Object.entries(categories)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },
});

// Increment discovery count when an agent finds an API
export const trackDiscovery = mutation({
  args: { apiId: v.id("providerAPIs") },
  handler: async (ctx, args) => {
    const api = await ctx.db.get(args.apiId);
    if (!api) return;

    await ctx.db.patch(args.apiId, {
      discoveryCount: (api.discoveryCount || 0) + 1,
      lastDiscoveredAt: Date.now(),
    });
  },
});

// Admin: List pending providers
export const getPendingProviders = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("providers")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

// Admin: Approve provider
export const approveProvider = mutation({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.providerId, {
      status: "approved",
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Admin: Reject provider
export const rejectProvider = mutation({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.providerId, {
      status: "rejected",
      updatedAt: Date.now(),
    });
  },
});

// Get provider stats
export const getProviderStats = query({
  handler: async (ctx) => {
    const providers = await ctx.db.query("providers").collect();
    const apis = await ctx.db.query("providerAPIs").collect();

    return {
      totalProviders: providers.length,
      approvedProviders: providers.filter((p) => p.status === "approved").length,
      pendingProviders: providers.filter((p) => p.status === "pending").length,
      totalAPIs: apis.length,
      approvedAPIs: apis.filter((a) => a.status === "approved").length,
      pendingAPIs: apis.filter((a) => a.status === "pending").length,
      totalDiscoveries: apis.reduce((sum, a) => sum + (a.discoveryCount || 0), 0),
    };
  },
});
