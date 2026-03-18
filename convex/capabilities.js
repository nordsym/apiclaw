import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
// Get a capability by ID
export const getById = query({
    args: { id: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("capabilities")
            .withIndex("by_capability_id", (q) => q.eq("id", args.id))
            .first();
    },
});
// List all capabilities
export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("capabilities").collect();
    },
});
// List capabilities by category
export const listByCategory = query({
    args: { category: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("capabilities")
            .withIndex("by_category", (q) => q.eq("category", args.category))
            .collect();
    },
});
// Get providers for a capability (sorted by priority, filtered by enabled + healthy)
export const getProviders = query({
    args: { capabilityId: v.string(), region: v.optional(v.string()) },
    handler: async (ctx, args) => {
        let providers = await ctx.db
            .query("providerCapabilities")
            .withIndex("by_capabilityId_enabled", (q) => q.eq("capabilityId", args.capabilityId).eq("enabled", true))
            .collect();
        // Filter by region if specified
        if (args.region) {
            providers = providers.filter(p => p.regions.includes(args.region));
        }
        // Filter out unhealthy providers
        providers = providers.filter(p => p.healthStatus !== "down");
        // Sort by priority, then price, then latency
        providers.sort((a, b) => {
            if (a.priority !== b.priority)
                return a.priority - b.priority;
            if (a.pricePerUnit !== b.pricePerUnit)
                return a.pricePerUnit - b.pricePerUnit;
            return a.avgLatencyMs - b.avgLatencyMs;
        });
        return providers;
    },
});
// Create a capability
export const create = mutation({
    args: {
        id: v.string(),
        name: v.string(),
        description: v.string(),
        category: v.string(),
        standardParams: v.array(v.object({
            name: v.string(),
            type: v.string(),
            required: v.boolean(),
            description: v.string(),
            default: v.optional(v.any()),
        })),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("capabilities", {
            ...args,
            createdAt: now,
            updatedAt: now,
        });
    },
});
// Add provider to capability
export const addProvider = mutation({
    args: {
        providerId: v.string(),
        capabilityId: v.string(),
        priority: v.number(),
        regions: v.array(v.string()),
        pricePerUnit: v.number(),
        currency: v.string(),
        avgLatencyMs: v.number(),
        paramMapping: v.any(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert("providerCapabilities", {
            ...args,
            enabled: true,
            healthStatus: "healthy",
            createdAt: now,
            updatedAt: now,
        });
    },
});
// Update provider health status
export const updateHealth = mutation({
    args: {
        providerId: v.string(),
        capabilityId: v.string(),
        healthStatus: v.string(),
    },
    handler: async (ctx, args) => {
        const mapping = await ctx.db
            .query("providerCapabilities")
            .withIndex("by_providerId", (q) => q.eq("providerId", args.providerId))
            .filter((q) => q.eq(q.field("capabilityId"), args.capabilityId))
            .first();
        if (mapping) {
            await ctx.db.patch(mapping._id, {
                healthStatus: args.healthStatus,
                lastHealthCheck: Date.now(),
                updatedAt: Date.now(),
            });
        }
    },
});
// Log capability usage
export const logUsage = mutation({
    args: {
        capabilityId: v.string(),
        providerId: v.string(),
        userId: v.string(),
        action: v.string(),
        success: v.boolean(),
        fallbackUsed: v.boolean(),
        fallbackReason: v.optional(v.string()),
        latencyMs: v.number(),
        cost: v.number(),
        currency: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("capabilityLogs", {
            ...args,
            timestamp: Date.now(),
        });
    },
});
//# sourceMappingURL=capabilities.js.map