import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Register a new provider and their first API
export const registerProvider = mutation({
  args: {
    provider: v.object({
      name: v.string(),
      email: v.string(),
      website: v.optional(v.string()),
    }),
    api: v.object({
      name: v.string(),
      description: v.string(),
      category: v.string(),
      openApiUrl: v.optional(v.string()),
      docsUrl: v.optional(v.string()),
      pricingModel: v.string(),
      pricingNotes: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if provider already exists by email
    const existing = await ctx.db
      .query("providers")
      .withIndex("by_email", (q) => q.eq("email", args.provider.email))
      .first();

    let providerId;

    if (existing) {
      // Use existing provider
      providerId = existing._id;
    } else {
      // Create new provider - auto-approve for now
      providerId = await ctx.db.insert("providers", {
        name: args.provider.name,
        email: args.provider.email,
        website: args.provider.website,
        status: "approved", // Auto-approve for MVP
        createdAt: now,
        updatedAt: now,
        approvedAt: now,
      });
    }

    // Create the API listing - auto-approve for now
    const apiId = await ctx.db.insert("providerAPIs", {
      providerId,
      name: args.api.name,
      description: args.api.description,
      category: args.api.category,
      openApiUrl: args.api.openApiUrl,
      docsUrl: args.api.docsUrl,
      pricingModel: args.api.pricingModel,
      pricingNotes: args.api.pricingNotes,
      status: "approved", // Auto-approve for MVP
      createdAt: now,
      approvedAt: now,
      discoveryCount: 0,
    });

    return { providerId, apiId };
  },
});

// Get provider by email
export const getProviderByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Get all APIs for a provider
export const getProviderAPIs = query({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("providerAPIs")
      .withIndex("by_providerId", (q) => q.eq("providerId", args.providerId))
      .collect();
  },
});

// Get all approved APIs (for the registry)
export const getApprovedAPIs = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("providerAPIs")
      .withIndex("by_status", (q) => q.eq("status", "approved"));

    const apis = await query.collect();

    // Filter by category if provided
    let filtered = args.category
      ? apis.filter((api) => api.category === args.category)
      : apis;

    // Apply limit
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

// Get API categories with counts
export const getCategories = query({
  handler: async (ctx) => {
    const apis = await ctx.db
      .query("providerAPIs")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();

    const categories: Record<string, number> = {};
    for (const api of apis) {
      categories[api.category] = (categories[api.category] || 0) + 1;
    }

    return Object.entries(categories)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },
});

// Increment discovery count when an agent finds an API
export const trackDiscovery = mutation({
  args: { apiId: v.id("providerAPIs") },
  handler: async (ctx, args) => {
    const api = await ctx.db.get(args.apiId);
    if (!api) return;

    await ctx.db.patch(args.apiId, {
      discoveryCount: (api.discoveryCount || 0) + 1,
      lastDiscoveredAt: Date.now(),
    });
  },
});

// Admin: List pending providers
export const getPendingProviders = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("providers")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

// Admin: Approve provider
export const approveProvider = mutation({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.providerId, {
      status: "approved",
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Admin: Reject provider
export const rejectProvider = mutation({
  args: { providerId: v.id("providers") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.providerId, {
      status: "rejected",
      updatedAt: Date.now(),
    });
  },
});

// Get provider stats
export const getProviderStats = query({
  handler: async (ctx) => {
    const providers = await ctx.db.query("providers").collect();
    const apis = await ctx.db.query("providerAPIs").collect();

    return {
      totalProviders: providers.length,
      approvedProviders: providers.filter((p) => p.status === "approved").length,
      pendingProviders: providers.filter((p) => p.status === "pending").length,
      totalAPIs: apis.length,
      approvedAPIs: apis.filter((a) => a.status === "approved").length,
      pendingAPIs: apis.filter((a) => a.status === "pending").length,
      totalDiscoveries: apis.reduce((sum, a) => sum + (a.discoveryCount || 0), 0),
    };
  },
});

// ============================================
// DASHBOARD AUTH & SESSION FUNCTIONS
// ============================================

// Create magic link for email auth
export const createMagicLink = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const token = generateToken();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    await ctx.db.insert("magicLinks", {
      email: email.toLowerCase(),
      token,
      expiresAt,
      createdAt: Date.now(),
    });

    return { token, expiresAt };
  },
});

// Verify magic link and create session
export const verifyMagicLink = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const magicLink = await ctx.db
      .query("magicLinks")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!magicLink) {
      return { success: false, error: "Invalid token" };
    }

    if (magicLink.expiresAt < Date.now()) {
      return { success: false, error: "Token expired" };
    }

    if (magicLink.usedAt) {
      return { success: false, error: "Token already used" };
    }

    // Mark as used
    await ctx.db.patch(magicLink._id, { usedAt: Date.now() });

    // Find or create provider
    let provider = await ctx.db
      .query("providers")
      .withIndex("by_email", (q) => q.eq("email", magicLink.email))
      .first();

    if (!provider) {
      const providerId = await ctx.db.insert("providers", {
        email: magicLink.email,
        name: magicLink.email.split("@")[0],
        status: "approved",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      provider = await ctx.db.get(providerId);
    }

    // Create session
    const sessionToken = generateToken();
    const sessionExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.db.insert("sessions", {
      providerId: provider!._id,
      token: sessionToken,
      expiresAt: sessionExpiresAt,
      createdAt: Date.now(),
    });

    return {
      success: true,
      sessionToken,
      provider: {
        id: provider!._id,
        email: provider!.email,
        name: provider!.name,
      },
    };
  },
});

// Get current session
export const getSession = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const provider = await ctx.db.get(session.providerId);
    if (!provider) return null;

    return {
      providerId: provider._id,
      email: provider.email,
      name: provider.name,
      stripeOnboardingComplete: (provider as any).stripeOnboardingComplete,
    };
  },
});

// ============================================
// DASHBOARD ANALYTICS
// ============================================

export const getAnalytics = query({
  args: {
    token: v.string(),
    period: v.optional(v.string()), // "week", "month", "all"
  },
  handler: async (ctx, { token, period = "month" }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const now = Date.now();
    const periodMs = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      all: now,
    }[period] || 30 * 24 * 60 * 60 * 1000;

    const startTime = now - periodMs;

    // Get usage logs for this provider (from Direct Call usageLog)
    const usageLogs = await ctx.db
      .query("usageLog")
      .withIndex("by_providerId", (q) => q.eq("providerId", session.providerId))
      .collect();

    const periodCalls = usageLogs.filter((c) => c.timestamp >= startTime);

    // Calculate metrics
    const totalCalls = periodCalls.length;
    const uniqueAgents = new Set(periodCalls.map((c) => c.userId)).size;
    const totalRevenue = periodCalls.reduce((sum, c) => sum + (c.creditsUsed / 100), 0); // cents to dollars
    const successCount = periodCalls.filter((c) => c.success).length;
    const successRate = totalCalls > 0 ? (successCount / totalCalls) * 100 : 100;
    const avgLatency = totalCalls > 0 
      ? periodCalls.reduce((sum, c) => sum + c.latencyMs, 0) / totalCalls 
      : 0;

    // Calls over time (daily buckets)
    const callsByDay: Record<string, { calls: number; revenue: number; success: number }> = {};

    periodCalls.forEach((call) => {
      const day = new Date(call.timestamp).toISOString().split("T")[0];
      if (!callsByDay[day]) {
        callsByDay[day] = { calls: 0, revenue: 0, success: 0 };
      }
      callsByDay[day].calls += 1;
      callsByDay[day].revenue += call.creditsUsed / 100;
      if (call.success) callsByDay[day].success += 1;
    });

    // Top agents (users)
    const agentCallCounts: Record<string, number> = {};
    periodCalls.forEach((call) => {
      agentCallCounts[call.userId] = (agentCallCounts[call.userId] || 0) + 1;
    });
    const topAgents = Object.entries(agentCallCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([agentId, calls]) => ({ agentId, calls }));

    // Top actions
    const actionCallCounts: Record<string, number> = {};
    periodCalls.forEach((call) => {
      actionCallCounts[call.actionName] = (actionCallCounts[call.actionName] || 0) + 1;
    });
    const topActions = Object.entries(actionCallCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([actionName, calls]) => ({ actionName, calls }));

    // Get provider's APIs
    const apis = await ctx.db
      .query("providerAPIs")
      .withIndex("by_providerId", (q) => q.eq("providerId", session.providerId))
      .collect();

    // Get Direct Call configs to map directCallId to apiId
    const directCallConfigs = await ctx.db
      .query("providerDirectCall")
      .withIndex("by_providerId", (q) => q.eq("providerId", session.providerId))
      .collect();

    // Calls per API (via directCallId → apiId mapping)
    const callsByDirectCallId: Record<string, number> = {};
    periodCalls.forEach((call) => {
      const dcId = call.directCallId as string;
      callsByDirectCallId[dcId] = (callsByDirectCallId[dcId] || 0) + 1;
    });

    // Map to apiId
    const callsByApiId: Record<string, number> = {};
    directCallConfigs.forEach((dc) => {
      if (dc.apiId) {
        callsByApiId[dc.apiId as string] = callsByDirectCallId[dc._id as string] || 0;
      }
    });

    // Preview data for providers with no usage yet
    const isPreview = totalCalls === 0;
    
    if (isPreview) {
      // Generate preview data so providers can see what the dashboard looks like
      const previewDays = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        previewDays.push({
          date,
          calls: Math.floor(Math.random() * 50) + 10,
          revenue: Math.random() * 5,
        });
      }
      
      return {
        totalCalls: 847,
        uniqueAgents: 23,
        totalRevenue: 42.35,
        successRate: 98.2,
        avgLatency: 145,
        callsByDay: previewDays,
        topAgents: [
          { agentId: "agent_demo_1", calls: 234 },
          { agentId: "agent_demo_2", calls: 189 },
          { agentId: "agent_demo_3", calls: 156 },
          { agentId: "agent_demo_4", calls: 98 },
          { agentId: "agent_demo_5", calls: 67 },
        ],
        topActions: [
          { actionName: "send_message", calls: 412 },
          { actionName: "get_status", calls: 289 },
          { actionName: "create_invoice", calls: 146 },
        ],
        apis: apis.map((api) => ({
          id: api._id,
          name: api.name,
          calls: Math.floor(Math.random() * 200) + 50,
          status: api.status,
        })),
        isPreview: true,
      };
    }

    return {
      totalCalls,
      uniqueAgents,
      totalRevenue,
      successRate,
      avgLatency,
      callsByDay: Object.entries(callsByDay)
        .map(([date, data]) => ({
          date,
          calls: data.calls,
          revenue: data.revenue,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topAgents,
      topActions,
      apis: apis.map((api) => ({
        id: api._id,
        name: api.name,
        calls: callsByApiId[api._id as string] || 0,
        status: api.status,
      })),
      isPreview: false,
    };
  },
});

// ============================================
// DASHBOARD EARNINGS
// ============================================

export const getEarnings = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    // Get all payouts
    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_providerId", (q) => q.eq("providerId", session.providerId))
      .collect();

    // Get all API calls to calculate pending
    const allCalls = await ctx.db
      .query("apiCalls")
      .withIndex("by_providerId", (q) => q.eq("providerId", session.providerId))
      .collect();

    // Find last completed payout
    const completedPayouts = payouts
      .filter((p) => p.status === "completed")
      .sort((a, b) => b.periodEnd - a.periodEnd);

    const lastPayoutEnd = completedPayouts[0]?.periodEnd || 0;

    // Pending = all revenue since last payout
    const pendingCalls = allCalls.filter((c) => c.timestamp > lastPayoutEnd);
    const pendingAmount = pendingCalls.reduce((sum, c) => sum + c.costUsd, 0);

    // Total earned all time
    const totalEarned = allCalls.reduce((sum, c) => sum + c.costUsd, 0);

    // Get provider for Stripe status
    const provider = await ctx.db.get(session.providerId);

    return {
      pendingAmount,
      totalEarned,
      totalPaidOut: completedPayouts.reduce((sum, p) => sum + p.amountUsd, 0),
      stripeConnected: !!(provider as any)?.stripeConnectId,
      stripeOnboardingComplete: (provider as any)?.stripeOnboardingComplete || false,
      payouts: payouts
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 20)
        .map((p) => ({
          id: p._id,
          amount: p.amountUsd,
          status: p.status,
          periodStart: p.periodStart,
          periodEnd: p.periodEnd,
          createdAt: p.createdAt,
          completedAt: p.completedAt,
        })),
    };
  },
});

// ============================================
// ADMIN QUERIES
// ============================================

// Get all providers (admin only)
export const getAllProviders = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("providers")
      .order("desc")
      .collect();
  },
});

// Get all APIs (admin only)
export const getAllAPIs = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("providerAPIs")
      .order("desc")
      .collect();
  },
});

// Helper function
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
