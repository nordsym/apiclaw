import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Log a search query
export const logSearch = internalMutation({
  args: {
    query: v.string(),
    resultsCount: v.number(),
    sessionToken: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    ip: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try to get workspaceId from session token
    let workspaceId = undefined;
    if (args.sessionToken) {
      try {
        const session = await ctx.db
          .query("agentSessions")
          .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
          .first();
        if (session) {
          workspaceId = session.workspaceId;
        }
      } catch (e) {
        // Ignore - just log without workspace
      }
    }

    await ctx.db.insert("searchLogs", {
      query: args.query,
      resultsCount: args.resultsCount,
      workspaceId,
      sessionToken: args.sessionToken,
      userAgent: args.userAgent,
      ip: args.ip,
      createdAt: Date.now(),
    });
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
      .withIndex("by_createdAt")
      .filter((q) => q.gte(q.field("createdAt"), since))
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
      queryCounts[q].totalResults += log.resultsCount;
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
      .withIndex("by_createdAt")
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), since),
          q.eq(q.field("resultsCount"), 0)
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
