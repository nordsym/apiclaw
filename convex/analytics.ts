import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Log an analytics event
export const log = mutation({
  args: {
    event: v.string(),
    provider: v.optional(v.string()),
    query: v.optional(v.string()),
    identifier: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analytics", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Get stats for dashboard
export const getStats = query({
  args: {
    hoursBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hoursBack = args.hoursBack || 24;
    const since = Date.now() - hoursBack * 3600000;

    const events = await ctx.db
      .query("analytics")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), since))
      .collect();

    // Aggregate stats
    const stats = {
      totalEvents: events.length,
      discoveries: events.filter((e) => e.event === "discovery").length,
      instantCalls: events.filter((e) => e.event === "instant").length,
      uniqueUsers: new Set(events.map((e) => e.identifier)).size,
      byProvider: {} as Record<string, number>,
      topQueries: [] as { query: string; count: number }[],
      hourly: [] as { hour: string; count: number }[],
    };

    // By provider
    for (const event of events.filter((e) => e.provider)) {
      stats.byProvider[event.provider!] = (stats.byProvider[event.provider!] || 0) + 1;
    }

    // Top queries
    const queryCounts: Record<string, number> = {};
    for (const event of events.filter((e) => e.query)) {
      queryCounts[event.query!] = (queryCounts[event.query!] || 0) + 1;
    }
    stats.topQueries = Object.entries(queryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    // Hourly breakdown
    const hourlyCounts: Record<string, number> = {};
    for (const event of events) {
      const hour = new Date(event.timestamp).toISOString().slice(0, 13);
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    }
    stats.hourly = Object.entries(hourlyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, count]) => ({ hour, count }));

    return stats;
  },
});

// Get recent events for live feed
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query("analytics")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
  },
});
