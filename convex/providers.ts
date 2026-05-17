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

    // Find or create workspace for this provider email
    const emailLower = args.provider.email.toLowerCase();
    let workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", emailLower))
      .first();

    if (!workspace) {
      const wsId = await ctx.db.insert("workspaces", {
        email: emailLower,
        status: "active",
        tier: "free",
        usageCount: 0,
        usageLimit: 50,
        weeklyUsageCount: 0,
        weeklyUsageLimit: 50,
        hourlyUsageCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      workspace = await ctx.db.get(wsId);
    }

    // Link provider → workspace (if not already)
    const provider = await ctx.db.get(providerId);
    if (provider && !(provider as any).workspaceId) {
      await ctx.db.patch(providerId, { workspaceId: workspace!._id } as any);
    }

    // Create unified session (agentSessions only - legacy sessions table deprecated)
    const sessionToken = generateToken();
    await ctx.db.insert("agentSessions", {
      workspaceId: workspace!._id,
      sessionToken,
      lastUsedAt: now,
      createdAt: now,
    });

    return { providerId, apiId, sessionToken };
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

// Unified discovery logging
// Single source of truth: apiLogs. discoveryCount on My APIs is derived from apiLogs.
export const logDiscovery = mutation({
  args: {
    provider: v.string(),
    query: v.string(),
    latencyMs: v.number(),
    callerWorkspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    // Resolve provider → workspace dynamically (no hardcoded email maps)
    const providerNameLower = args.provider.toLowerCase();
    const allProviders = await ctx.db.query("providers").collect();
    const providerRecord = allProviders.find(
      (p) => p.name.toLowerCase() === providerNameLower
    );
    if (!providerRecord || !(providerRecord as any).workspaceId) return { logged: false };

    const workspace = await ctx.db.get((providerRecord as any).workspaceId);
    if (!workspace) return { logged: false };
    const wsId = workspace._id as any;

    // 1. Log to apiLogs (source of truth for Analytics)
    await ctx.db.insert("apiLogs", {
      workspaceId: wsId,
      sessionToken: "",
      provider: args.provider,
      action: `discovery:${args.query}`,
      status: "success",
      latencyMs: args.latencyMs,
      direction: "inbound",
      callerWorkspaceId: args.callerWorkspaceId,
      createdAt: Date.now(),
    });

    // 2. Increment discoveryCount on MATCHING APIs only
    const apis = await ctx.db
      .query("providerAPIs")
      .withIndex("by_providerId", (q) => q.eq("providerId", providerRecord._id))
      .collect();
    const queryLower = args.query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 2);

    let matched = 0;
    for (const api of apis) {
      const apiText = `${api.name} ${api.description || ""}`.toLowerCase();
      if (queryWords.some((w: string) => apiText.includes(w))) {
        await ctx.db.patch(api._id, {
          discoveryCount: ((api as any).discoveryCount || 0) + 1,
          lastDiscoveredAt: Date.now(),
        });
        matched++;
      }
    }
    return { logged: true, matched };
  },
});

// Legacy: Track discovery by provider name (kept for backwards compat)
export const trackDiscoveryByProvider = mutation({
  args: { provider: v.string(), query: v.string() },
  handler: async (ctx, args) => {
    // Resolve provider dynamically by name (no hardcoded email maps)
    const providerNameLower = args.provider.toLowerCase();
    const allProviders = await ctx.db.query("providers").collect();
    const provider = allProviders.find(
      (p) => p.name.toLowerCase() === providerNameLower
    );
    if (!provider) return { updated: 0, error: "provider not found" };

    // Get all APIs for this provider
    const providerApis = await ctx.db
      .query("providerAPIs")
      .withIndex("by_providerId", (q) => q.eq("providerId", provider._id))
      .collect();

    // Increment discoveryCount on ALL provider APIs
    for (const api of providerApis) {
      await ctx.db.patch(api._id, {
        discoveryCount: ((api as any).discoveryCount || 0) + 1,
        lastDiscoveredAt: Date.now(),
      });
    }

    return { updated: providerApis.length };
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

// Create magic link for email auth (unified: writes to workspaceMagicLinks)
export const createMagicLink = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const token = generateToken();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    await ctx.db.insert("workspaceMagicLinks", {
      email: email.toLowerCase(),
      token,
      expiresAt,
      createdAt: Date.now(),
    });

    return { token, expiresAt };
  },
});

// Verify magic link and create unified session (workspace + provider)
export const verifyMagicLink = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const magicLink = await ctx.db
      .query("workspaceMagicLinks")
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

    const now = Date.now();

    // Find or create workspace
    let workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", magicLink.email))
      .first();

    if (!workspace) {
      const wsId = await ctx.db.insert("workspaces", {
        email: magicLink.email,
        status: "active",
        tier: "free",
        usageCount: 0,
        usageLimit: 50,
        weeklyUsageCount: 0,
        weeklyUsageLimit: 50,
        hourlyUsageCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      workspace = await ctx.db.get(wsId);
    }

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
        workspaceId: workspace!._id,
        createdAt: now,
        updatedAt: now,
      } as any);
      provider = await ctx.db.get(providerId);
    } else if (!(provider as any).workspaceId) {
      // Link existing provider to workspace
      await ctx.db.patch(provider._id, { workspaceId: workspace!._id } as any);
    }

    // Create unified session (agentSessions)
    const sessionToken = generateToken();
    await ctx.db.insert("agentSessions", {
      workspaceId: workspace!._id,
      sessionToken,
      lastUsedAt: now,
      createdAt: now,
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

// Get current session (unified: tries agentSessions first, falls back to legacy sessions)
export const getSession = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    // 1. Try unified agentSessions (by sessionToken)
    const agentSession = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();

    if (agentSession) {
      // Resolve provider via workspace
      const provider = await ctx.db
        .query("providers")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", agentSession.workspaceId))
        .first();

      if (!provider) return null;

      return {
        providerId: provider._id,
        email: provider.email,
        name: provider.name,
        stripeOnboardingComplete: (provider as any).stripeOnboardingComplete,
      };
    }

    // 2. Fallback: legacy sessions table (for tokens created before migration)
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

// Get single API by ID
export const getApiById = query({
  args: { apiId: v.string() },
  handler: async (ctx, args) => {
    // Try to get by document ID
    try {
      const api = await ctx.db.get(args.apiId as any);
      if (api) {
        // Check if it has managed routing configured
        const directCall = await ctx.db
          .query("providerDirectCall")
          .filter((q) => q.eq(q.field("apiId"), args.apiId))
          .first();
        return { ...api, hasDirectCall: !!directCall, directCallStatus: directCall?.status };
      }
    } catch {
      // Not a valid ID format
    }
    return null;
  },
});

// Get provider APIs with managed-provider status
export const getProviderAPIsWithStatus = query({
  args: { providerId: v.string() },
  handler: async (ctx, args) => {
    const apis = await ctx.db
      .query("providerAPIs")
      .filter((q) => q.eq(q.field("providerId"), args.providerId as any))
      .collect();
    
    // Add managed-provider status to each API
    const apisWithStatus = await Promise.all(
      apis.map(async (api) => {
        const directCall = await ctx.db
          .query("providerDirectCall")
          .filter((q) => q.eq(q.field("apiId"), api._id))
          .first();
        return {
          ...api,
          hasDirectCall: !!directCall,
          directCallStatus: directCall?.status,
        };
      })
    );
    
    return apisWithStatus;
  },
});

// DEBUG: Delete API
export const debugDeleteAPI = mutation({
  args: { apiId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.apiId as any);
    return { deleted: true };
  },
});

// Add API for logged-in provider (used by register page)
export const addAPI = mutation({
  args: {
    token: v.string(),
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
    // Unified session lookup
    let providerId: any = null;

    const agentSession = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (agentSession) {
      const prov = await ctx.db
        .query("providers")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", agentSession.workspaceId))
        .first();
      if (prov) providerId = prov._id;
    } else {
      const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", args.token))
        .first();
      if (session && session.expiresAt >= Date.now()) {
        providerId = session.providerId;
      }
    }

    if (!providerId) throw new Error("Invalid or expired session");

    const now = Date.now();
    const apiId = await ctx.db.insert("providerAPIs", {
      providerId,
      name: args.api.name,
      description: args.api.description,
      category: args.api.category,
      openApiUrl: args.api.openApiUrl,
      docsUrl: args.api.docsUrl,
      pricingModel: args.api.pricingModel,
      pricingNotes: args.api.pricingNotes,
      status: "approved",
      createdAt: now,
      approvedAt: now,
      discoveryCount: 0,
    });

    return { apiId, success: true };
  },
});

// Delete API for logged-in provider
export const deleteAPI = mutation({
  args: {
    token: v.string(),
    apiId: v.string(),
  },
  handler: async (ctx, args) => {
    // Unified session lookup
    let providerId: any = null;

    const agentSession = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (agentSession) {
      const prov = await ctx.db
        .query("providers")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", agentSession.workspaceId))
        .first();
      if (prov) providerId = prov._id;
    } else {
      const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", args.token))
        .first();
      if (session && session.expiresAt >= Date.now()) {
        providerId = session.providerId;
      }
    }

    if (!providerId) throw new Error("Invalid or expired session");

    // Get the API and verify ownership
    const api = await ctx.db.get(args.apiId as any);
    if (!api || (api as any).providerId !== providerId) {
      throw new Error("API not found or unauthorized");
    }

    // Delete the API
    await ctx.db.delete(args.apiId as any);

    // Also delete any managed routing config
    const directCallConfig = await ctx.db
      .query("providerDirectCall")
      .filter((q) => q.eq(q.field("apiId"), args.apiId))
      .first();
    if (directCallConfig) {
      await ctx.db.delete(directCallConfig._id);
    }

    return { deleted: true };
  },
});

// DEBUG: Update provider name
export const debugUpdateProvider = mutation({
  args: { 
    providerId: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.name) updates.name = args.name;
    await ctx.db.patch(args.providerId as any, updates);
    return { updated: true };
  },
});

// DEBUG: Add API for provider (seeding)
export const debugAddAPI = mutation({
  args: {
    providerId: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    docsUrl: v.optional(v.string()),
    pricingModel: v.string(),
    pricingNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("providerAPIs", {
      providerId: args.providerId as any,
      name: args.name,
      description: args.description,
      category: args.category,
      docsUrl: args.docsUrl,
      pricingModel: args.pricingModel,
      pricingNotes: args.pricingNotes,
      status: "approved",
      createdAt: now,
      approvedAt: now,
      discoveryCount: 0,
    });
  },
});

// DEBUG: Delete provider and all related data
export const debugDeleteProvider = mutation({
  args: { providerId: v.string() },
  handler: async (ctx, args) => {
    const providerId = args.providerId as any;
    
    // Delete sessions
    const sessions = await ctx.db.query("sessions").filter(q => q.eq(q.field("providerId"), providerId)).collect();
    for (const s of sessions) await ctx.db.delete(s._id);
    
    // Delete APIs
    const apis = await ctx.db.query("providerAPIs").filter(q => q.eq(q.field("providerId"), providerId)).collect();
    for (const a of apis) await ctx.db.delete(a._id);
    
    // Delete managed routing configs
    const configs = await ctx.db.query("providerDirectCall").filter(q => q.eq(q.field("providerId"), providerId)).collect();
    for (const c of configs) {
      // Delete actions for this config
      const actions = await ctx.db.query("providerActions").filter(q => q.eq(q.field("directCallId"), c._id)).collect();
      for (const act of actions) await ctx.db.delete(act._id);
      await ctx.db.delete(c._id);
    }
    
    // Delete provider
    await ctx.db.delete(providerId);
    
    return { deleted: true };
  },
});

// DEBUG: List all sessions
export const debugListSessions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sessions").collect();
  },
});

// DEBUG: List all providers
export const debugListProviders = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("providers").collect();
  },
});

export const getAnalytics = query({
  args: {
    token: v.optional(v.string()),
    workspaceId: v.optional(v.string()), // Direct workspace ID (used by /workspace page)
    period: v.optional(v.string()), // "week", "month", "all"
  },
  handler: async (ctx, { token, workspaceId: wsIdArg, period = "month" }) => {
    let providerId: any = null;

    // Path 1: Direct workspaceId (from workspace page)
    if (wsIdArg) {
      const prov = await ctx.db
        .query("providers")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", wsIdArg as any))
        .first();
      if (prov) providerId = prov._id;
    }

    // Path 2: Session token lookup (from provider dashboard / API)
    if (!providerId && token) {
      const agentSession = await ctx.db
        .query("agentSessions")
        .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
        .first();

      if (agentSession) {
        const prov = await ctx.db
          .query("providers")
          .withIndex("by_workspaceId", (q) => q.eq("workspaceId", agentSession.workspaceId))
          .first();
        if (prov) providerId = prov._id;
      } else {
        const session = await ctx.db
          .query("sessions")
          .withIndex("by_token", (q) => q.eq("token", token))
          .first();
        if (session && session.expiresAt >= Date.now()) {
          providerId = session.providerId;
        }
      }
    }

    if (!providerId) return null;

    const provider = await ctx.db.get(providerId) as any;
    if (!provider) return null;

    const now = Date.now();
    const periodMs = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      all: now,
    }[period] || 30 * 24 * 60 * 60 * 1000;

    const startTime = now - periodMs;

    // Provider name key used in apiLogs.provider (lowercase)
    const providerKey = (provider.name as string).toLowerCase();

    // Get real data from apiLogs (source of truth for all API activity)
    const allLogs = await ctx.db
      .query("apiLogs")
      .withIndex("by_provider", (q) => q.eq("provider", providerKey))
      .collect();

    const periodLogs = allLogs.filter((l) => l.createdAt >= startTime);

    // Split into managed-provider rows vs discovery
    const directCalls = periodLogs.filter((l) => !(l as any).action?.startsWith("discovery:"));
    const discoveries = periodLogs.filter((l) => (l as any).action?.startsWith("discovery:"));

    // Calculate metrics
    const totalCalls = directCalls.length;
    const totalDiscoveries = discoveries.length;
    const uniqueCallers = new Set(periodLogs.map((l) => (l as any).callerWorkspaceId || l.workspaceId)).size;
    const successCount = directCalls.filter((l) => l.status === "success").length;
    const successRate = totalCalls > 0 ? (successCount / totalCalls) * 100 : 100;
    const avgLatency = totalCalls > 0
      ? Math.round(directCalls.reduce((sum, l) => sum + l.latencyMs, 0) / totalCalls)
      : 0;

    // Calls over time (daily buckets)
    const callsByDay: Record<string, { calls: number; discoveries: number; success: number }> = {};

    periodLogs.forEach((log) => {
      const day = new Date(log.createdAt).toISOString().split("T")[0];
      if (!callsByDay[day]) {
        callsByDay[day] = { calls: 0, discoveries: 0, success: 0 };
      }
      if ((log as any).action?.startsWith("discovery:")) {
        callsByDay[day].discoveries += 1;
      } else {
        callsByDay[day].calls += 1;
        if (log.status === "success") callsByDay[day].success += 1;
      }
    });

    // Top actions
    const actionCallCounts: Record<string, number> = {};
    directCalls.forEach((log) => {
      const action = (log as any).action || "unknown";
      actionCallCounts[action] = (actionCallCounts[action] || 0) + 1;
    });
    const topActions = Object.entries(actionCallCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([actionName, calls]) => ({ actionName, calls }));

    // Top callers (workspace IDs that called this provider)
    const callerCounts: Record<string, number> = {};
    directCalls.forEach((log) => {
      const caller = (log as any).callerWorkspaceId || "anonymous";
      callerCounts[caller] = (callerCounts[caller] || 0) + 1;
    });
    const topAgents = Object.entries(callerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([agentId, calls]) => ({ agentId, calls }));

    // Get provider's APIs
    const apis = await ctx.db
      .query("providerAPIs")
      .withIndex("by_providerId", (q) => q.eq("providerId", providerId))
      .collect();

    // Per-API call counts (match action name to API name)
    const apiCallCounts: Record<string, number> = {};
    const apiDiscoveryCounts: Record<string, number> = {};
    for (const api of apis) {
      const apiNameLower = api.name.toLowerCase();
      apiCallCounts[api._id as string] = directCalls.filter(
        (l) => (l as any).action?.toLowerCase().includes(apiNameLower)
      ).length;
      apiDiscoveryCounts[api._id as string] = discoveries.filter(
        (l) => (l as any).action?.toLowerCase().includes(apiNameLower)
      ).length;
    }

    return {
      totalCalls,
      totalDiscoveries,
      uniqueAgents: uniqueCallers,
      totalRevenue: 0, // Revenue tracking not yet implemented
      successRate: Math.round(successRate * 10) / 10,
      avgLatency,
      callsByDay: Object.entries(callsByDay)
        .map(([date, data]) => ({
          date,
          calls: data.calls,
          discoveries: data.discoveries,
          revenue: 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topAgents,
      topActions,
      apis: apis.map((api) => ({
        id: api._id,
        name: api.name,
        calls: apiCallCounts[api._id as string] || 0,
        discoveries: apiDiscoveryCounts[api._id as string] || 0,
        status: api.status,
      })),
      isPreview: false,
    };
  },
});

// ============================================
// DASHBOARD EARNINGS
// ============================================

// Earnings placeholder - partners (APILayer, Filestack) don't earn per-call revenue yet
export const getEarnings = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    // Unified session lookup
    let providerId: any = null;

    const agentSession = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();

    if (agentSession) {
      const prov = await ctx.db
        .query("providers")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", agentSession.workspaceId))
        .first();
      if (prov) providerId = prov._id;
    } else {
      const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();
      if (session && session.expiresAt >= Date.now()) {
        providerId = session.providerId;
      }
    }

    if (!providerId) return null;

    // Get all payouts (currently empty for all providers)
    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_providerId", (q) => q.eq("providerId", providerId))
      .collect();

    // Get all API calls (legacy table, currently empty)
    const allCalls = await ctx.db
      .query("apiCalls")
      .withIndex("by_providerId", (q) => q.eq("providerId", providerId))
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
    const provider = await ctx.db.get(providerId);

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

// Debug: Update API name/description
export const debugUpdateAPI = mutation({
  args: {
    apiId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    status: v.optional(v.string()),
    hasDirectCall: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.name) updates.name = args.name;
    if (args.description) updates.description = args.description;
    if (args.category) updates.category = args.category;
    if (args.status) updates.status = args.status;
    if (args.hasDirectCall !== undefined) updates.hasDirectCall = args.hasDirectCall;
    await ctx.db.patch(args.apiId as any, updates);
    return { updated: true };
  },
});

// ─── Workspace-native API management (no provider account needed) ─────────────

// Get all APIs listed by a workspace
export const getByWorkspaceId = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    return await ctx.db
      .query("providerAPIs")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();
  },
});

// List a new API directly from a workspace — no provider registration
export const createForWorkspace = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    openApiUrl: v.optional(v.string()),
    docsUrl: v.optional(v.string()),
    pricingModel: v.string(),
    pricingNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("providerAPIs", {
      workspaceId: args.workspaceId,
      name: args.name,
      description: args.description,
      category: args.category,
      openApiUrl: args.openApiUrl,
      docsUrl: args.docsUrl,
      pricingModel: args.pricingModel,
      pricingNotes: args.pricingNotes,
      status: "active",
      createdAt: Date.now(),
      discoveryCount: 0,
    });
    return { id };
  },
});

// Delete an API owned by a workspace
export const deleteForWorkspace = mutation({
  args: { apiId: v.id("providerAPIs"), workspaceId: v.id("workspaces") },
  handler: async (ctx, { apiId, workspaceId }) => {
    const api = await ctx.db.get(apiId);
    if (!api || api.workspaceId !== workspaceId) {
      throw new Error("Not found or unauthorized");
    }
    await ctx.db.delete(apiId);
    return { deleted: true };
  },
});

// Reset all discoveryCount to 0 (admin cleanup)
export const resetDiscoveryCounts = mutation({
  args: {},
  handler: async (ctx) => {
    const apis = await ctx.db.query("providerAPIs").collect();
    let reset = 0;
    for (const api of apis) {
      if ((api as any).discoveryCount > 0) {
        await ctx.db.patch(api._id, { discoveryCount: 0 } as any);
        reset++;
      }
    }
    return { reset };
  },
});
