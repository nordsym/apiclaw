import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// SEARCH LOGGING
// ============================================

/**
 * Log a search (called from MCP server)
 */
export const log = mutation({
  args: {
    sessionToken: v.string(),
    subagentId: v.optional(v.string()),
    query: v.string(),
    resultCount: v.number(),
    matchedProviders: v.optional(v.array(v.string())),
    responseTimeMs: v.number(),
  },
  handler: async (ctx, args) => {
    // Get workspace from session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session) return null;

    return await ctx.db.insert("searchLogs", {
      workspaceId: session.workspaceId,
      subagentId: args.subagentId,
      query: args.query,
      resultCount: args.resultCount,
      hasResults: args.resultCount > 0,
      matchedProviders: args.matchedProviders,
      responseTimeMs: args.responseTimeMs,
      timestamp: Date.now(),
    });
  },
});

/**
 * Get search stats for workspace
 */
export const getStats = query({
  args: {
    token: v.string(),
    hoursBack: v.optional(v.number()),
  },
  handler: async (ctx, { token, hoursBack = 24 }) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();

    if (!session) return null;

    const since = Date.now() - hoursBack * 3600000;

    const logs = await ctx.db
      .query("searchLogs")
      .withIndex("by_workspaceId_timestamp", (q) =>
        q.eq("workspaceId", session.workspaceId).gte("timestamp", since)
      )
      .collect();

    // Aggregate
    const totalSearches = logs.length;
    const zeroResults = logs.filter((l) => !l.hasResults).length;
    const avgResponseTime =
      logs.reduce((a, l) => a + l.responseTimeMs, 0) / logs.length || 0;

    // Top queries
    const queryCounts: Record<string, number> = {};
    for (const log of logs) {
      queryCounts[log.query] = (queryCounts[log.query] || 0) + 1;
    }
    const topQueries = Object.entries(queryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([query, count]) => ({ query, count }));

    // Zero-result queries (gold data for improvement)
    const zeroResultQueries = logs
      .filter((l) => !l.hasResults)
      .reduce(
        (acc, l) => {
          acc[l.query] = (acc[l.query] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    const topZeroResults = Object.entries(zeroResultQueries)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([query, count]) => ({ query, count }));

    // By subagent
    const bySubagent: Record<string, number> = {};
    for (const log of logs) {
      const key = log.subagentId || "primary";
      bySubagent[key] = (bySubagent[key] || 0) + 1;
    }

    return {
      totalSearches,
      zeroResults,
      zeroResultRate: totalSearches > 0 ? zeroResults / totalSearches : 0,
      avgResponseTime: Math.round(avgResponseTime),
      topQueries,
      topZeroResults,
      bySubagent,
    };
  },
});

/**
 * Get recent searches
 */
export const getRecent = query({
  args: {
    token: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { token, limit = 50 }) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();

    if (!session) return [];

    return await ctx.db
      .query("searchLogs")
      .withIndex("by_workspaceId_timestamp", (q) =>
        q.eq("workspaceId", session.workspaceId)
      )
      .order("desc")
      .take(limit);
  },
});
