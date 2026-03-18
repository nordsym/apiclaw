import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
export const track = mutation({
    args: {
        event: v.object({
            type: v.string(),
            query: v.optional(v.string()),
            apiId: v.optional(v.string()),
            resultCount: v.optional(v.number()),
            responseTimeMs: v.optional(v.number()),
            version: v.optional(v.string()),
            platform: v.optional(v.string()),
            nodeVersion: v.optional(v.string()),
            timestamp: v.optional(v.number()),
        }),
    },
    handler: async (ctx, { event }) => {
        await ctx.db.insert("telemetry", {
            type: event.type,
            query: event.query,
            apiId: event.apiId,
            resultCount: event.resultCount,
            responseTimeMs: event.responseTimeMs,
            version: event.version || "unknown",
            platform: event.platform || "unknown",
            nodeVersion: event.nodeVersion || "unknown",
            timestamp: event.timestamp || Date.now(),
        });
    },
});
export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const events = await ctx.db.query("telemetry").collect();
        const startups = events.filter(e => e.type === "startup").length;
        const searches = events.filter(e => e.type === "search").length;
        const executes = events.filter(e => e.type === "execute").length;
        const uniqueUsers = new Set(events.map(e => `${e.platform}-${e.nodeVersion}`)).size;
        const topQueries = events
            .filter(e => e.type === "search" && e.query)
            .reduce((acc, e) => {
            acc[e.query] = (acc[e.query] || 0) + 1;
            return acc;
        }, {});
        const topAPIs = events
            .filter(e => e.type === "execute" && e.apiId)
            .reduce((acc, e) => {
            acc[e.apiId] = (acc[e.apiId] || 0) + 1;
            return acc;
        }, {});
        return {
            totalStartups: startups,
            totalSearches: searches,
            totalExecutes: executes,
            estimatedUniqueUsers: uniqueUsers,
            topQueries: Object.entries(topQueries)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10),
            topAPIs: Object.entries(topAPIs)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10),
        };
    },
});
export const getRecent = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, { limit = 50 }) => {
        return await ctx.db
            .query("telemetry")
            .order("desc")
            .take(limit);
    },
});
//# sourceMappingURL=telemetry.js.map