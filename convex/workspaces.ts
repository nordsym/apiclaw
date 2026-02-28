import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// MAGIC LINK AUTH FOR WORKSPACES
// ============================================

// Create magic link for workspace email auth
export const createMagicLink = mutation({
  args: { 
    email: v.string(),
    fingerprint: v.optional(v.string()),
  },
  handler: async (ctx, { email, fingerprint }) => {
    const token = generateToken();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    await ctx.db.insert("workspaceMagicLinks", {
      email: email.toLowerCase(),
      token,
      sessionFingerprint: fingerprint,
      expiresAt,
      createdAt: Date.now(),
    });

    return { token, expiresAt };
  },
});

// Verify magic link and create workspace + session
export const verifyMagicLink = mutation({
  args: { 
    token: v.string(),
    fingerprint: v.optional(v.string()),
  },
  handler: async (ctx, { token, fingerprint }) => {
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

    // Find or create workspace
    let workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", magicLink.email))
      .first();

    if (!workspace) {
      // Create new workspace with free tier
      const workspaceId = await ctx.db.insert("workspaces", {
        email: magicLink.email,
        status: "active",
        tier: "free",
        usageCount: 0,
        usageLimit: 50, // 50 free API calls
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      workspace = await ctx.db.get(workspaceId);
    }

    // Create agent session
    const sessionToken = generateToken();

    await ctx.db.insert("agentSessions", {
      workspaceId: workspace!._id,
      sessionToken,
      fingerprint: fingerprint || magicLink.sessionFingerprint,
      lastUsedAt: Date.now(),
      createdAt: Date.now(),
    });

    return {
      success: true,
      sessionToken,
      workspace: {
        id: workspace!._id,
        email: workspace!.email,
        tier: workspace!.tier,
      },
    };
  },
});

// Get session from token
export const getSession = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();

    if (!session) {
      return null;
    }

    const workspace = await ctx.db.get(session.workspaceId);
    if (!workspace) return null;

    return {
      workspaceId: workspace._id,
      email: workspace.email,
      tier: workspace.tier,
      status: workspace.status,
      usageCount: workspace.usageCount,
      usageLimit: workspace.usageLimit,
    };
  },
});

// ============================================
// DASHBOARD QUERIES
// ============================================

// Get full workspace dashboard data
export const getWorkspaceDashboard = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    // Verify session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();

    if (!session) {
      return null;
    }

    // Note: lastUsedAt is updated via touchSession mutation separately

    const workspace = await ctx.db.get(session.workspaceId);
    if (!workspace) return null;

    // Get all agent sessions for this workspace
    const agentSessions = await ctx.db
      .query("agentSessions")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();

    // Get usage logs for this workspace (via agent credits or purchases)
    const credits = await ctx.db
      .query("agentCredits")
      .collect();
    
    // Filter credits that belong to this workspace's agents
    const workspaceCredits = credits.filter(c => 
      agentSessions.some(s => c.agentId === s.sessionToken)
    );

    // Get purchases for workspace agents
    const purchases = await ctx.db
      .query("purchases")
      .collect();
    
    const workspacePurchases = purchases.filter(p =>
      agentSessions.some(s => p.agentId === s.sessionToken)
    );

    // Calculate usage remaining
    const usageRemaining = workspace.usageLimit - workspace.usageCount;
    const usagePercentage = (workspace.usageCount / workspace.usageLimit) * 100;

    return {
      workspace: {
        id: workspace._id,
        email: workspace.email,
        tier: workspace.tier,
        status: workspace.status,
        usageCount: workspace.usageCount,
        usageLimit: workspace.usageLimit,
        usageRemaining,
        usagePercentage,
        stripeCustomerId: workspace.stripeCustomerId,
        createdAt: workspace.createdAt,
      },
      stats: {
        totalAgents: agentSessions.length,
        totalCredits: workspaceCredits.reduce((sum, c) => sum + c.balanceUsd, 0),
        totalPurchases: workspacePurchases.length,
      },
    };
  },
});

// Get connected agents for workspace
export const getConnectedAgents = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();

    if (!session) {
      return [];
    }

    const agentSessions = await ctx.db
      .query("agentSessions")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();

    return agentSessions.map((s) => ({
      id: s._id,
      fingerprint: s.fingerprint || "Unknown",
      lastUsedAt: s.lastUsedAt,
      createdAt: s.createdAt,
      isCurrent: s.sessionToken === token,
    }));
  },
});

// Debug: Get sessions by workspace email
export const getSessionsByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (!workspace) {
      return { error: "Workspace not found", sessions: [] };
    }

    const sessions = await ctx.db
      .query("agentSessions")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id))
      .collect();

    return {
      workspaceId: workspace._id,
      email: workspace.email,
      sessions: sessions.map(s => ({
        id: s._id,
        fingerprint: s.fingerprint,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
      })),
    };
  },
});

// Get usage breakdown by provider
export const getUsageBreakdown = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();

    if (!session) {
      return { byProvider: [], byDay: [], total: 0 };
    }

    // Get all sessions for this workspace
    const agentSessions = await ctx.db
      .query("agentSessions")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();

    const sessionTokens = agentSessions.map(s => s.sessionToken);

    // Get purchases for these agents
    const allPurchases = await ctx.db.query("purchases").collect();
    const workspacePurchases = allPurchases.filter(p => sessionTokens.includes(p.agentId));

    // Get usage for purchases
    const allUsage = await ctx.db.query("usage").collect();
    const purchaseIds = workspacePurchases.map(p => p._id);
    const workspaceUsage = allUsage.filter(u => purchaseIds.includes(u.purchaseId));

    // Aggregate by provider
    const byProvider: Record<string, { calls: number; cost: number }> = {};
    for (const usage of workspaceUsage) {
      if (!byProvider[usage.providerId]) {
        byProvider[usage.providerId] = { calls: 0, cost: 0 };
      }
      byProvider[usage.providerId].calls += usage.unitsUsed;
      byProvider[usage.providerId].cost += usage.costIncurredUsd;
    }

    // Aggregate by day (last 14 days)
    const now = Date.now();
    const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
    const byDay: Record<string, number> = {};
    
    for (const usage of workspaceUsage) {
      if (usage.lastUsedAt >= fourteenDaysAgo) {
        const day = new Date(usage.lastUsedAt).toISOString().split("T")[0];
        byDay[day] = (byDay[day] || 0) + usage.unitsUsed;
      }
    }

    return {
      byProvider: Object.entries(byProvider).map(([provider, data]) => ({
        provider,
        calls: data.calls,
        cost: data.cost,
      })),
      byDay: Object.entries(byDay)
        .map(([date, calls]) => ({ date, calls }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      total: workspaceUsage.reduce((sum, u) => sum + u.unitsUsed, 0),
    };
  },
});

// ============================================
// AGENT MANAGEMENT
// ============================================

// Revoke an agent session
export const revokeAgentSession = mutation({
  args: {
    token: v.string(),
    sessionId: v.id("agentSessions"),
  },
  handler: async (ctx, { token, sessionId }) => {
    // Verify the requesting session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();

    if (!session) {
      throw new Error("Unauthorized");
    }

    // Get the session to revoke
    const targetSession = await ctx.db.get(sessionId);
    if (!targetSession) {
      throw new Error("Session not found");
    }

    // Verify same workspace
    if (targetSession.workspaceId !== session.workspaceId) {
      throw new Error("Unauthorized");
    }

    // Prevent revoking current session
    if (targetSession.sessionToken === token) {
      throw new Error("Cannot revoke current session");
    }

    // Delete the session
    await ctx.db.delete(sessionId);

    return { success: true };
  },
});

// Logout (delete current session)
export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// ============================================
// WORKSPACE MANAGEMENT
// ============================================

// Update workspace tier (for Stripe webhooks)
export const updateTier = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    tier: v.string(),
    usageLimit: v.number(),
    stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, { workspaceId, tier, usageLimit, stripeCustomerId }) => {
    const updates: Record<string, unknown> = {
      tier,
      usageLimit,
      updatedAt: Date.now(),
    };

    if (stripeCustomerId) {
      updates.stripeCustomerId = stripeCustomerId;
    }

    await ctx.db.patch(workspaceId, updates);
    return { success: true };
  },
});

// Increment usage count
export const incrementUsage = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, { workspaceId, amount = 1 }) => {
    const workspace = await ctx.db.get(workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const newCount = workspace.usageCount + amount;
    
    // Check if over limit
    if (newCount > workspace.usageLimit) {
      throw new Error("Usage limit exceeded");
    }

    await ctx.db.patch(workspaceId, {
      usageCount: newCount,
      updatedAt: Date.now(),
    });

    return { 
      success: true, 
      usageCount: newCount,
      usageRemaining: workspace.usageLimit - newCount,
    };
  },
});

// ============================================
// POLLING & VERIFICATION ENDPOINTS (for HTTP API)
// ============================================

// Poll magic link status (for agents to check if user clicked)
export const pollMagicLink = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const magicLink = await ctx.db
      .query("workspaceMagicLinks")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!magicLink) {
      return { status: "not_found" };
    }

    const now = Date.now();

    if (magicLink.usedAt) {
      // Get the workspace and session
      const workspace = await ctx.db
        .query("workspaces")
        .withIndex("by_email", (q) => q.eq("email", magicLink.email))
        .first();

      // Get the latest session for this workspace
      const session = workspace
        ? await ctx.db
            .query("agentSessions")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id))
            .order("desc")
            .first()
        : null;

      return {
        status: "verified",
        workspace: workspace
          ? {
              id: workspace._id,
              email: workspace.email,
              tier: workspace.tier,
              usageCount: workspace.usageCount,
              usageLimit: workspace.usageLimit,
            }
          : null,
        sessionToken: session?.sessionToken,
      };
    }

    if (magicLink.expiresAt < now) {
      return { status: "expired" };
    }

    return {
      status: "pending",
      expiresAt: magicLink.expiresAt,
    };
  },
});

// Verify session token (for HTTP API)
export const verifySession = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", sessionToken))
      .first();

    if (!session) {
      return null;
    }

    const workspace = await ctx.db.get(session.workspaceId);
    if (!workspace || workspace.status !== "active") {
      return null;
    }

    return {
      workspaceId: workspace._id,
      email: workspace.email,
      tier: workspace.tier,
      usageCount: workspace.usageCount,
      usageLimit: workspace.usageLimit,
    };
  },
});

// Get workspace by email (for HTTP API)
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (!workspace) {
      return null;
    }

    return {
      id: workspace._id,
      email: workspace.email,
      status: workspace.status,
      tier: workspace.tier,
      usageCount: workspace.usageCount,
      usageLimit: workspace.usageLimit,
    };
  },
});

// Touch session (update lastUsedAt)
export const touchSession = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", sessionToken))
      .first();

    if (session) {
      await ctx.db.patch(session._id, { lastUsedAt: Date.now() });
    }
  },
});

// ============================================
// MCP WORKSPACE FUNCTIONS
// ============================================

// Create a new workspace (called from MCP register_owner)
export const createWorkspace = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if workspace exists
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();
    
    if (existing) {
      return { 
        success: false, 
        error: "workspace_exists",
        workspaceId: existing._id,
        status: existing.status,
      };
    }
    
    // Create new workspace
    const workspaceId = await ctx.db.insert("workspaces", {
      email: normalizedEmail,
      status: "pending",
      tier: "free",
      usageCount: 0,
      usageLimit: 100, // Free tier limit
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { success: true, workspaceId };
  },
});

// Create agent session for workspace (called from MCP after verification)
export const createAgentSession = mutation({
  args: { 
    workspaceId: v.id("workspaces"),
    fingerprint: v.optional(v.string()),
  },
  handler: async (ctx, { workspaceId, fingerprint }) => {
    const workspace = await ctx.db.get(workspaceId);
    if (!workspace) {
      return { success: false, error: "workspace_not_found" };
    }
    
    if (workspace.status !== "active") {
      return { success: false, error: "workspace_not_active" };
    }
    
    const sessionToken = "apiclaw_" + generateToken();
    
    await ctx.db.insert("agentSessions", {
      workspaceId,
      sessionToken,
      fingerprint,
      lastUsedAt: Date.now(),
      createdAt: Date.now(),
    });
    
    return { success: true, sessionToken };
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get workspace status (for MCP check_workspace_status tool)
export const getWorkspaceStatus = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    
    if (!session) {
      return { authenticated: false };
    }
    
    const workspace = await ctx.db.get(session.workspaceId);
    if (!workspace) {
      return { authenticated: false };
    }
    
    const usageRemaining = workspace.usageLimit > 0 
      ? workspace.usageLimit - workspace.usageCount 
      : -1; // -1 = unlimited
    
    return {
      authenticated: true,
      email: workspace.email,
      status: workspace.status,
      tier: workspace.tier,
      usageCount: workspace.usageCount,
      usageLimit: workspace.usageLimit,
      usageRemaining,
      hasStripe: !!workspace.stripeCustomerId,
      createdAt: workspace.createdAt,
    };
  },
});
