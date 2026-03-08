import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

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
