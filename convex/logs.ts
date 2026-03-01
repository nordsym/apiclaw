import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a log entry for an API call
 * Called after each Direct Call execution
 */
export const createLog = mutation({
  args: {
    token: v.string(),
    provider: v.string(),
    action: v.string(),
    status: v.union(v.literal("success"), v.literal("error")),
    latencyMs: v.number(),
    errorMessage: v.optional(v.string()),
    subagentId: v.optional(v.string()), // from X-APIClaw-Subagent header
  },
  handler: async (ctx, args) => {
    // Verify session and get workspace
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session token");
    }

    // Create log entry
    return await ctx.db.insert("apiLogs", {
      workspaceId: session.workspaceId,
      sessionToken: args.token,
      subagentId: args.subagentId,
      provider: args.provider,
      action: args.action,
      status: args.status,
      latencyMs: args.latencyMs,
      errorMessage: args.errorMessage,
      createdAt: Date.now(),
    });
  },
});

/**
 * Internal log creation (when workspaceId is already known)
 * Used by execute functions that have already verified the session
 */
export const createLogInternal = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    sessionToken: v.string(),
    provider: v.string(),
    action: v.string(),
    status: v.union(v.literal("success"), v.literal("error")),
    latencyMs: v.number(),
    errorMessage: v.optional(v.string()),
    subagentId: v.optional(v.string()), // from X-APIClaw-Subagent header
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("apiLogs", {
      workspaceId: args.workspaceId,
      sessionToken: args.sessionToken,
      subagentId: args.subagentId,
      provider: args.provider,
      action: args.action,
      status: args.status,
      latencyMs: args.latencyMs,
      errorMessage: args.errorMessage,
      createdAt: Date.now(),
    });
  },
});

// ============================================
// QUERIES
// ============================================

/**
 * Get logs for a workspace with pagination and filters
 */
export const getLogs = query({
  args: {
    token: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()), // createdAt timestamp for pagination
    status: v.optional(v.union(v.literal("success"), v.literal("error"), v.literal("all"))),
    provider: v.optional(v.string()),
    subagentId: v.optional(v.string()), // filter by subagent
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const status = args.status ?? "all";
    const provider = args.provider;
    const subagentId = args.subagentId;
    const cursor = args.cursor;

    // Verify session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      return { logs: [], hasMore: false };
    }

    // Get logs for workspace
    let query = ctx.db
      .query("apiLogs")
      .withIndex("by_workspaceId_createdAt", (q) => q.eq("workspaceId", session.workspaceId))
      .order("desc");

    // Apply cursor (pagination)
    if (cursor) {
      query = query.filter((q) => q.lt(q.field("createdAt"), cursor));
    }

    // Collect more than limit to check hasMore
    const allLogs = await query.take(limit + 1);

    // Apply filters in-memory (Convex doesn't support complex compound filters)
    let filteredLogs = allLogs;

    if (status !== "all") {
      filteredLogs = filteredLogs.filter((log) => log.status === status);
    }

    if (provider && provider !== "all") {
      filteredLogs = filteredLogs.filter((log) => log.provider === provider);
    }

    // Filter by subagent
    if (subagentId) {
      if (subagentId === "main") {
        // Main agent calls (no subagentId)
        filteredLogs = filteredLogs.filter((log) => !log.subagentId);
      } else {
        filteredLogs = filteredLogs.filter((log) => log.subagentId === subagentId);
      }
    }

    const hasMore = filteredLogs.length > limit;
    const logs = filteredLogs.slice(0, limit);

    return {
      logs: logs.map((log) => ({
        id: log._id,
        provider: log.provider,
        action: log.action,
        status: log.status,
        latencyMs: log.latencyMs,
        errorMessage: log.errorMessage,
        subagentId: log.subagentId || null,
        createdAt: log.createdAt,
      })),
      hasMore,
      nextCursor: logs.length > 0 ? logs[logs.length - 1].createdAt : undefined,
    };
  },
});

/**
 * Get aggregated log stats for workspace
 */
export const getLogStats = query({
  args: {
    token: v.string(),
    periodDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const periodDays = args.periodDays ?? 7;

    // Verify session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      return {
        totalCalls: 0,
        successCount: 0,
        errorCount: 0,
        successRate: 0,
        avgLatency: 0,
        byProvider: [],
        byDay: [],
      };
    }

    const now = Date.now();
    const periodStart = now - periodDays * 24 * 60 * 60 * 1000;

    // Get all logs for this workspace in the period
    const logs = await ctx.db
      .query("apiLogs")
      .withIndex("by_workspaceId_createdAt", (q) => q.eq("workspaceId", session.workspaceId))
      .filter((q) => q.gte(q.field("createdAt"), periodStart))
      .collect();

    const totalCalls = logs.length;
    const successCount = logs.filter((l) => l.status === "success").length;
    const errorCount = logs.filter((l) => l.status === "error").length;
    const successRate = totalCalls > 0 ? (successCount / totalCalls) * 100 : 0;
    const totalLatency = logs.reduce((sum, l) => sum + l.latencyMs, 0);
    const avgLatency = totalCalls > 0 ? Math.round(totalLatency / totalCalls) : 0;

    // Group by provider
    const byProviderMap: Record<string, { calls: number; success: number; error: number; latency: number }> = {};
    for (const log of logs) {
      if (!byProviderMap[log.provider]) {
        byProviderMap[log.provider] = { calls: 0, success: 0, error: 0, latency: 0 };
      }
      byProviderMap[log.provider].calls++;
      byProviderMap[log.provider].latency += log.latencyMs;
      if (log.status === "success") {
        byProviderMap[log.provider].success++;
      } else {
        byProviderMap[log.provider].error++;
      }
    }

    const byProvider = Object.entries(byProviderMap)
      .map(([provider, data]) => ({
        provider,
        calls: data.calls,
        successRate: data.calls > 0 ? (data.success / data.calls) * 100 : 0,
        avgLatency: data.calls > 0 ? Math.round(data.latency / data.calls) : 0,
      }))
      .sort((a, b) => b.calls - a.calls);

    // Group by day
    const byDayMap: Record<string, { calls: number; success: number; error: number }> = {};
    for (const log of logs) {
      const day = new Date(log.createdAt).toISOString().split("T")[0];
      if (!byDayMap[day]) {
        byDayMap[day] = { calls: 0, success: 0, error: 0 };
      }
      byDayMap[day].calls++;
      if (log.status === "success") {
        byDayMap[day].success++;
      } else {
        byDayMap[day].error++;
      }
    }

    const byDay = Object.entries(byDayMap)
      .map(([date, data]) => ({
        date,
        calls: data.calls,
        success: data.success,
        error: data.error,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get unique providers for filter dropdown
    const providers = [...new Set(logs.map((l) => l.provider))].sort();

    return {
      totalCalls,
      successCount,
      errorCount,
      successRate: Math.round(successRate * 10) / 10,
      avgLatency,
      byProvider,
      byDay,
      providers,
    };
  },
});

/**
 * Get unique providers for filter dropdown
 */
export const getProviders = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      return [];
    }

    // Get all logs for this workspace
    const logs = await ctx.db
      .query("apiLogs")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();

    // Get unique providers
    const providers = [...new Set(logs.map((l) => l.provider))].sort();
    return providers;
  },
});
