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

// Get provider breakdown for Agent Analytics (workspace-specific)
export const getProviderBreakdown = query({
  args: {
    token: v.string(),
    periodDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const periodDays = args.periodDays || 7;
    const since = Date.now() - periodDays * 24 * 3600000;

    // Verify session and get workspace
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      return null;
    }

    // Get all API logs for this workspace
    const logs = await ctx.db
      .query("apiLogs")
      .withIndex("by_workspaceId_createdAt", (q) => q.eq("workspaceId", session.workspaceId))
      .filter((q) => q.gte(q.field("createdAt"), since))
      .collect();

    if (logs.length === 0) {
      return null; // Return null so frontend knows to show empty state, not preview
    }

    // Aggregate stats
    const totalCalls = logs.length;
    const successCount = logs.filter((l) => l.status === "success").length;
    const failureCount = logs.filter((l) => l.status === "error").length;
    const totalLatency = logs.reduce((sum, l) => sum + (l.latencyMs || 0), 0);
    const avgLatency = totalCalls > 0 ? Math.round(totalLatency / totalCalls) : 0;

    // Provider breakdown
    const byProvider: Record<string, { count: number; latency: number }> = {};
    for (const log of logs) {
      if (!byProvider[log.provider]) {
        byProvider[log.provider] = { count: 0, latency: 0 };
      }
      byProvider[log.provider].count++;
      byProvider[log.provider].latency += log.latencyMs || 0;
    }

    // Agent breakdown (by subagentId)
    const byAgent: Record<string, number> = {};
    for (const log of logs) {
      const agent = log.subagentId || "main";
      byAgent[agent] = (byAgent[agent] || 0) + 1;
    }

    // Action breakdown
    const byAction: Record<string, number> = {};
    for (const log of logs) {
      const key = `${log.provider}:${log.action}`;
      byAction[key] = (byAction[key] || 0) + 1;
    }

    // Time series (daily)
    const dailyCounts: Record<string, number> = {};
    for (const log of logs) {
      const day = new Date(log.createdAt).toISOString().slice(0, 10);
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    }

    return {
      totalCalls,
      successCount,
      failureCount,
      successRate: totalCalls > 0 ? (successCount / totalCalls) * 100 : 0,
      avgLatency,
      byProvider: Object.entries(byProvider).map(([name, data]) => ({
        name,
        count: data.count,
        avgLatency: data.count > 0 ? Math.round(data.latency / data.count) : 0,
      })).sort((a, b) => b.count - a.count),
      byAgent: Object.entries(byAgent).map(([name, count]) => ({
        name,
        count,
      })).sort((a, b) => b.count - a.count),
      byAction: Object.entries(byAction).map(([name, count]) => ({
        name,
        count,
      })).sort((a, b) => b.count - a.count).slice(0, 10),
      timeSeries: Object.entries(dailyCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
      isPreview: false,
    };
  },
});
