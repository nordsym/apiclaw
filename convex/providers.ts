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

    // Get all API calls for this provider
    const allCalls = await ctx.db
      .query("apiCalls")
      .withIndex("by_providerId", (q) => q.eq("providerId", session.providerId))
      .collect();

    const periodCalls = allCalls.filter((c) => c.timestamp >= startTime);

    // Calculate metrics
    const totalCalls = periodCalls.length;
    const uniqueAgents = new Set(periodCalls.map((c) => c.agentId)).size;
    const totalRevenue = periodCalls.reduce((sum, c) => sum + c.costUsd, 0);

    // Calls over time (daily buckets)
    const callsByDay: Record<string, number> = {};
    const revenueByDay: Record<string, number> = {};

    periodCalls.forEach((call) => {
      const day = new Date(call.timestamp).toISOString().split("T")[0];
      callsByDay[day] = (callsByDay[day] || 0) + 1;
      revenueByDay[day] = (revenueByDay[day] || 0) + call.costUsd;
    });

    // Top agents
    const agentCallCounts: Record<string, number> = {};
    periodCalls.forEach((call) => {
      agentCallCounts[call.agentId] = (agentCallCounts[call.agentId] || 0) + 1;
    });
    const topAgents = Object.entries(agentCallCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([agentId, calls]) => ({ agentId, calls }));

    // By region
    const callsByRegion: Record<string, number> = {};
    periodCalls.forEach((call) => {
      const region = call.region || "Unknown";
      callsByRegion[region] = (callsByRegion[region] || 0) + 1;
    });

    // Get provider's APIs
    const apis = await ctx.db
      .query("providerAPIs")
      .withIndex("by_providerId", (q) => q.eq("providerId", session.providerId))
      .collect();

    // Calls per API
    const callsByApi: Record<string, number> = {};
    periodCalls.forEach((call) => {
      const apiIdStr = call.apiId as string;
      callsByApi[apiIdStr] = (callsByApi[apiIdStr] || 0) + 1;
    });

    return {
      totalCalls,
      uniqueAgents,
      totalRevenue,
      callsByDay: Object.entries(callsByDay)
        .map(([date, calls]) => ({
          date,
          calls,
          revenue: revenueByDay[date] || 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topAgents,
      callsByRegion,
      apis: apis.map((api) => ({
        id: api._id,
        name: api.name,
        calls: callsByApi[api._id as string] || 0,
        status: api.status,
      })),
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

// Helper function
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
