import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Public mutation called by MCP server (path: searchLogs:log)
 */
export const log = mutation({
  args: {
    sessionToken: v.string(),
    query: v.string(),
    resultCount: v.number(),
    matchedProviders: v.optional(v.array(v.string())),
    responseTimeMs: v.optional(v.number()),
    subagentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session) return { success: false };

    await ctx.db.insert("searchLogs", {
      workspaceId: session.workspaceId,
      subagentId: args.subagentId,
      query: args.query,
      resultCount: args.resultCount,
      hasResults: args.resultCount > 0,
      matchedProviders: args.matchedProviders,
      responseTimeMs: args.responseTimeMs || 0,
      timestamp: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Get recent searches for a workspace (path: searchLogs:getRecent)
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

    const logs = await ctx.db
      .query("searchLogs")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .order("desc")
      .take(limit);

    return logs.map((l) => ({
      id: l._id,
      query: l.query,
      resultCount: l.resultCount,
      hasResults: l.hasResults,
      matchedProviders: l.matchedProviders || [],
      responseTimeMs: l.responseTimeMs,
      timestamp: l.timestamp,
      subagentId: l.subagentId,
    }));
  },
});

// Log a search query (uses existing searchLogs table schema)
export const logSearch = internalMutation({
  args: {
    query: v.string(),
    resultsCount: v.number(),
    matchedProviders: v.optional(v.array(v.string())),
    sessionToken: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    responseTimeMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Try to get workspaceId from session token
    let workspaceId = undefined;
    let subagentId = undefined;
    
    if (args.sessionToken) {
      try {
        const token = args.sessionToken;
        const session = await ctx.db
          .query("agentSessions")
          .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
          .first();
        if (session) {
          workspaceId = session.workspaceId;
          // No agentId in agentSessions, subagentId stays undefined
        }
      } catch (e) {
        // Ignore - just skip workspace linking
      }
    }

    // Only log if we have a workspace (existing schema requires it)
    if (workspaceId) {
      await ctx.db.insert("searchLogs", {
        workspaceId,
        subagentId,
        query: args.query,
        resultCount: args.resultsCount,
        hasResults: args.resultsCount > 0,
        matchedProviders: args.matchedProviders,
        responseTimeMs: args.responseTimeMs || 0,
        timestamp: Date.now(),
      });
    }
    
    // TODO: Also log anonymous searches somewhere (for product insights)
  },
});

// Get top search queries (for analytics)
export const getTopQueries = query({
  args: {
    limit: v.optional(v.number()),
    since: v.optional(v.number()), // timestamp
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const since = args.since || Date.now() - 7 * 24 * 60 * 60 * 1000; // Last 7 days

    const logs = await ctx.db
      .query("searchLogs")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), since))
      .collect();

    // Aggregate by query
    const queryCounts: Record<string, { count: number; avgResults: number; totalResults: number }> = {};
    
    for (const log of logs) {
      const q = log.query.toLowerCase().trim();
      if (!q) continue;
      
      if (!queryCounts[q]) {
        queryCounts[q] = { count: 0, avgResults: 0, totalResults: 0 };
      }
      queryCounts[q].count++;
      queryCounts[q].totalResults += log.resultCount;
    }

    // Calculate averages and sort
    const sorted = Object.entries(queryCounts)
      .map(([query, data]) => ({
        query,
        count: data.count,
        avgResults: Math.round(data.totalResults / data.count * 10) / 10,
        noResults: data.totalResults === 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return {
      queries: sorted,
      totalSearches: logs.length,
      uniqueQueries: Object.keys(queryCounts).length,
      period: {
        since: new Date(since).toISOString(),
        until: new Date().toISOString(),
      },
    };
  },
});

// Get search stats for a workspace (path: searchLogs:getStats)
export const getStats = query({
  args: {
    token: v.string(),
    hoursBack: v.optional(v.number()),
  },
  handler: async (ctx, { token, hoursBack }) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();
    if (!session) return { totalSearches: 0, zeroResultSearches: 0, avgResponseTimeMs: 0, successRate: 0, byDay: [] };

    const since = hoursBack ? Date.now() - hoursBack * 60 * 60 * 1000 : 0;

    const logs = await ctx.db
      .query("searchLogs")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();

    const filtered = since > 0 ? logs.filter((l) => l.timestamp >= since) : logs;
    const totalSearches = filtered.length;
    const zeroResultSearches = filtered.filter((l) => !l.hasResults).length;
    const avgResponseTimeMs = totalSearches > 0
      ? Math.round(filtered.reduce((sum, l) => sum + (l.responseTimeMs || 0), 0) / totalSearches)
      : 0;
    const successRate = totalSearches > 0
      ? Math.round(((totalSearches - zeroResultSearches) / totalSearches) * 1000) / 10
      : 0;

    // Per-day breakdown for chart
    const byDayMap: Record<string, number> = {};
    for (const log of filtered) {
      const day = new Date(log.timestamp).toISOString().split("T")[0];
      byDayMap[day] = (byDayMap[day] || 0) + 1;
    }
    const byDay = Object.entries(byDayMap)
      .map(([date, searches]) => ({ date, searches }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { totalSearches, zeroResultSearches, avgResponseTimeMs, successRate, byDay };
  },
});

// Get searches with no results (API gaps)
export const getZeroResultQueries = query({
  args: {
    limit: v.optional(v.number()),
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const since = args.since || Date.now() - 7 * 24 * 60 * 60 * 1000;

    const logs = await ctx.db
      .query("searchLogs")
      .withIndex("by_hasResults")
      .filter((q) => 
        q.and(
          q.eq(q.field("hasResults"), false),
          q.gte(q.field("timestamp"), since)
        )
      )
      .collect();

    // Aggregate
    const queryCounts: Record<string, number> = {};
    for (const log of logs) {
      const q = log.query.toLowerCase().trim();
      if (!q) continue;
      queryCounts[q] = (queryCounts[q] || 0) + 1;
    }

    const sorted = Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return {
      gaps: sorted,
      totalZeroResults: logs.length,
      message: "These queries returned no results - potential APIs to add",
    };
  },
});
