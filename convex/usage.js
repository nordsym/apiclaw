import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
// ============================================
// MUTATIONS
// ============================================
/**
 * Log an API call usage
 */
export const logUsage = mutation({
    args: {
        userId: v.string(),
        providerId: v.id("providers"),
        directCallId: v.id("providerDirectCall"),
        actionName: v.string(),
        success: v.boolean(),
        latencyMs: v.number(),
        creditsUsed: v.number(),
        errorMessage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("usageLog", {
            userId: args.userId,
            providerId: args.providerId,
            directCallId: args.directCallId,
            actionName: args.actionName,
            timestamp: Date.now(),
            success: args.success,
            latencyMs: args.latencyMs,
            creditsUsed: args.creditsUsed,
            errorMessage: args.errorMessage,
        });
    },
});
// ============================================
// QUERIES
// ============================================
/**
 * Get user usage stats for rate limiting
 * Returns counts for last minute and last day
 */
export const getUserUsage = query({
    args: {
        userId: v.string(),
        providerId: v.id("providers"),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        // Get all usage for this user + provider in the last 24h
        const recentUsage = await ctx.db
            .query("usageLog")
            .withIndex("by_userId_providerId", (q) => q.eq("userId", args.userId).eq("providerId", args.providerId))
            .filter((q) => q.gte(q.field("timestamp"), oneDayAgo))
            .collect();
        // Calculate counts
        const minuteCount = recentUsage.filter((u) => u.timestamp >= oneMinuteAgo).length;
        const dayCount = recentUsage.length;
        const totalCredits = recentUsage.reduce((sum, u) => sum + u.creditsUsed, 0);
        return {
            minute: minuteCount,
            day: dayCount,
            totalCreditsUsed: totalCredits,
        };
    },
});
/**
 * Get provider usage stats for analytics
 */
export const getProviderUsage = query({
    args: {
        providerId: v.id("providers"),
        periodDays: v.optional(v.number()), // default 30
    },
    handler: async (ctx, args) => {
        const periodDays = args.periodDays ?? 30;
        const now = Date.now();
        const periodStart = now - periodDays * 24 * 60 * 60 * 1000;
        const usage = await ctx.db
            .query("usageLog")
            .withIndex("by_providerId", (q) => q.eq("providerId", args.providerId))
            .filter((q) => q.gte(q.field("timestamp"), periodStart))
            .collect();
        // Aggregate stats
        const totalCalls = usage.length;
        const successfulCalls = usage.filter((u) => u.success).length;
        const failedCalls = totalCalls - successfulCalls;
        const totalCredits = usage.reduce((sum, u) => sum + u.creditsUsed, 0);
        const totalLatency = usage.reduce((sum, u) => sum + u.latencyMs, 0);
        const avgLatency = totalCalls > 0 ? Math.round(totalLatency / totalCalls) : 0;
        // Group by action
        const byAction = {};
        for (const u of usage) {
            if (!byAction[u.actionName]) {
                byAction[u.actionName] = { calls: 0, credits: 0 };
            }
            byAction[u.actionName].calls++;
            byAction[u.actionName].credits += u.creditsUsed;
        }
        // Group by day for chart
        const byDay = {};
        for (const u of usage) {
            const day = new Date(u.timestamp).toISOString().split("T")[0];
            if (!byDay[day]) {
                byDay[day] = { calls: 0, credits: 0 };
            }
            byDay[day].calls++;
            byDay[day].credits += u.creditsUsed;
        }
        // Unique users
        const uniqueUsers = new Set(usage.map((u) => u.userId)).size;
        return {
            periodDays,
            totalCalls,
            successfulCalls,
            failedCalls,
            successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
            totalCredits,
            avgLatencyMs: avgLatency,
            uniqueUsers,
            byAction,
            byDay,
        };
    },
});
/**
 * Get Direct Call specific usage stats
 */
export const getDirectCallUsage = query({
    args: {
        directCallId: v.id("providerDirectCall"),
        periodDays: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const periodDays = args.periodDays ?? 30;
        const now = Date.now();
        const periodStart = now - periodDays * 24 * 60 * 60 * 1000;
        const usage = await ctx.db
            .query("usageLog")
            .withIndex("by_directCallId", (q) => q.eq("directCallId", args.directCallId))
            .filter((q) => q.gte(q.field("timestamp"), periodStart))
            .collect();
        const totalCalls = usage.length;
        const successfulCalls = usage.filter((u) => u.success).length;
        const totalCredits = usage.reduce((sum, u) => sum + u.creditsUsed, 0);
        const totalLatency = usage.reduce((sum, u) => sum + u.latencyMs, 0);
        return {
            periodDays,
            totalCalls,
            successfulCalls,
            failedCalls: totalCalls - successfulCalls,
            successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
            totalCredits,
            avgLatencyMs: totalCalls > 0 ? Math.round(totalLatency / totalCalls) : 0,
            uniqueUsers: new Set(usage.map((u) => u.userId)).size,
        };
    },
});
/**
 * Get recent usage logs (for dashboard/debugging)
 */
export const getRecentLogs = query({
    args: {
        providerId: v.optional(v.id("providers")),
        directCallId: v.optional(v.id("providerDirectCall")),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;
        const { directCallId, providerId } = args;
        if (directCallId !== undefined) {
            return await ctx.db
                .query("usageLog")
                .withIndex("by_directCallId", (q) => q.eq("directCallId", directCallId))
                .order("desc")
                .take(limit);
        }
        if (providerId !== undefined) {
            return await ctx.db
                .query("usageLog")
                .withIndex("by_providerId", (q) => q.eq("providerId", providerId))
                .order("desc")
                .take(limit);
        }
        return await ctx.db
            .query("usageLog")
            .withIndex("by_timestamp")
            .order("desc")
            .take(limit);
    },
});
/**
 * Check if user is within rate limits
 * Returns { allowed: boolean, reason?: string }
 */
export const checkRateLimit = query({
    args: {
        userId: v.string(),
        providerId: v.id("providers"),
        rateLimitPerUser: v.number(),
        rateLimitPerDay: v.number(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const recentUsage = await ctx.db
            .query("usageLog")
            .withIndex("by_userId_providerId", (q) => q.eq("userId", args.userId).eq("providerId", args.providerId))
            .filter((q) => q.gte(q.field("timestamp"), oneDayAgo))
            .collect();
        const minuteCount = recentUsage.filter((u) => u.timestamp >= oneMinuteAgo).length;
        const dayCount = recentUsage.length;
        if (minuteCount >= args.rateLimitPerUser) {
            return {
                allowed: false,
                reason: `Rate limit exceeded: ${minuteCount}/${args.rateLimitPerUser} requests per minute`,
            };
        }
        if (dayCount >= args.rateLimitPerDay) {
            return {
                allowed: false,
                reason: `Daily limit exceeded: ${dayCount}/${args.rateLimitPerDay} requests per day`,
            };
        }
        return { allowed: true };
    },
});
//# sourceMappingURL=usage.js.map