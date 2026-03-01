import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// ============================================
// AGENT NAME GENERATION
// ============================================

const ADJECTIVES = [
  "Crimson", "Azure", "Golden", "Silver", "Obsidian",
  "Emerald", "Sapphire", "Violet", "Amber", "Jade",
  "Scarlet", "Cobalt", "Onyx", "Ruby", "Pearl",
  "Shadow", "Storm", "Frost", "Blaze", "Thunder",
  "Swift", "Silent", "Bright", "Dark", "Wild",
  "Noble", "Fierce", "Cosmic", "Quantum", "Neural",
];

const NOUNS = [
  "Phoenix", "Falcon", "Dragon", "Wolf", "Raven",
  "Serpent", "Tiger", "Hawk", "Panther", "Lynx",
  "Cipher", "Vector", "Prism", "Nexus", "Core",
  "Agent", "Oracle", "Sentinel", "Phantom", "Vanguard",
  "Forge", "Spark", "Pulse", "Echo", "Byte",
  "Matrix", "Vertex", "Helix", "Nova", "Zenith",
];

function generateAgentName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================
// MAIN AGENT QUERIES
// ============================================

/**
 * Get main agent info for a workspace
 */
export const getMainAgent = query({
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
    if (!workspace) {
      return null;
    }

    return {
      workspaceId: workspace._id,
      email: workspace.email,
      mainAgentId: workspace.mainAgentId || null,
      mainAgentName: workspace.mainAgentName || null,
      usageCount: workspace.usageCount,
      createdAt: workspace.createdAt,
    };
  },
});

/**
 * Rename the main agent
 */
export const renameMainAgent = mutation({
  args: {
    token: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { token, name }) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    const workspace = await ctx.db.get(session.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Validate name length
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      throw new Error("Name must be between 2 and 50 characters");
    }

    await ctx.db.patch(workspace._id, {
      mainAgentName: trimmedName,
      updatedAt: Date.now(),
    });

    return { success: true, name: trimmedName };
  },
});

/**
 * Initialize main agent (auto-generate name and ID if not set)
 * Called on first API call
 */
export const ensureMainAgent = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const workspace = await ctx.db.get(workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Already initialized
    if (workspace.mainAgentId && workspace.mainAgentName) {
      return {
        mainAgentId: workspace.mainAgentId,
        mainAgentName: workspace.mainAgentName,
        created: false,
      };
    }

    const mainAgentId = workspace.mainAgentId || generateUUID();
    const mainAgentName = workspace.mainAgentName || generateAgentName();

    await ctx.db.patch(workspaceId, {
      mainAgentId,
      mainAgentName,
      updatedAt: Date.now(),
    });

    return {
      mainAgentId,
      mainAgentName,
      created: true,
    };
  },
});

// ============================================
// SUBAGENT QUERIES
// ============================================

/**
 * Get all subagents for a workspace
 */
export const getSubagents = query({
  args: {
    token: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { token, limit = 50 }) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();

    if (!session) {
      return { subagents: [], total: 0 };
    }

    const subagents = await ctx.db
      .query("subagents")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .order("desc")
      .take(limit);

    // Sort by lastActiveAt descending
    const sorted = subagents.sort((a, b) => b.lastActiveAt - a.lastActiveAt);

    return {
      subagents: sorted.map((s) => ({
        id: s._id,
        subagentId: s.subagentId,
        name: s.name || s.subagentId,
        callCount: s.callCount,
        firstSeenAt: s.firstSeenAt,
        lastActiveAt: s.lastActiveAt,
      })),
      total: subagents.length,
    };
  },
});

/**
 * Get stats for a specific subagent
 */
export const getSubagentStats = query({
  args: {
    token: v.string(),
    subagentId: v.string(),
  },
  handler: async (ctx, { token, subagentId }) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();

    if (!session) {
      return null;
    }

    const subagent = await ctx.db
      .query("subagents")
      .withIndex("by_workspaceId_subagentId", (q) =>
        q.eq("workspaceId", session.workspaceId).eq("subagentId", subagentId)
      )
      .first();

    if (!subagent) {
      return null;
    }

    // Get recent logs for this subagent
    const logs = await ctx.db
      .query("apiLogs")
      .withIndex("by_subagentId", (q) => q.eq("subagentId", subagentId))
      .order("desc")
      .take(100);

    const successCount = logs.filter((l) => l.status === "success").length;
    const errorCount = logs.filter((l) => l.status === "error").length;
    const avgLatency = logs.length > 0
      ? Math.round(logs.reduce((sum, l) => sum + l.latencyMs, 0) / logs.length)
      : 0;

    // Group by provider
    const byProvider: Record<string, number> = {};
    for (const log of logs) {
      byProvider[log.provider] = (byProvider[log.provider] || 0) + 1;
    }

    return {
      subagentId: subagent.subagentId,
      name: subagent.name || subagent.subagentId,
      callCount: subagent.callCount,
      successCount,
      errorCount,
      successRate: logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0,
      avgLatency,
      firstSeenAt: subagent.firstSeenAt,
      lastActiveAt: subagent.lastActiveAt,
      byProvider: Object.entries(byProvider)
        .map(([provider, count]) => ({ provider, count }))
        .sort((a, b) => b.count - a.count),
    };
  },
});

/**
 * Rename a subagent
 */
export const renameSubagent = mutation({
  args: {
    token: v.string(),
    subagentId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { token, subagentId, name }) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    const subagent = await ctx.db
      .query("subagents")
      .withIndex("by_workspaceId_subagentId", (q) =>
        q.eq("workspaceId", session.workspaceId).eq("subagentId", subagentId)
      )
      .first();

    if (!subagent) {
      throw new Error("Subagent not found");
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      throw new Error("Name must be between 1 and 100 characters");
    }

    await ctx.db.patch(subagent._id, { name: trimmedName });

    return { success: true, name: trimmedName };
  },
});

/**
 * Track a subagent call (upsert subagent record)
 * Called when X-APIClaw-Subagent header is present
 */
export const trackSubagentCall = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    subagentId: v.string(),
  },
  handler: async (ctx, { workspaceId, subagentId }) => {
    const now = Date.now();

    // Find existing subagent record
    const existing = await ctx.db
      .query("subagents")
      .withIndex("by_workspaceId_subagentId", (q) =>
        q.eq("workspaceId", workspaceId).eq("subagentId", subagentId)
      )
      .first();

    if (existing) {
      // Increment call count
      await ctx.db.patch(existing._id, {
        callCount: existing.callCount + 1,
        lastActiveAt: now,
      });
      return { id: existing._id, created: false };
    }

    // Create new subagent record
    const id = await ctx.db.insert("subagents", {
      workspaceId,
      subagentId,
      callCount: 1,
      firstSeenAt: now,
      lastActiveAt: now,
    });

    return { id, created: true };
  },
});

// ============================================
// AGGREGATE STATS
// ============================================

/**
 * Get agent overview for workspace (main + subagents summary)
 */
export const getAgentOverview = query({
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
    if (!workspace) {
      return null;
    }

    // Get all subagents
    const subagents = await ctx.db
      .query("subagents")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();

    // Calculate totals
    const totalSubagentCalls = subagents.reduce((sum, s) => sum + s.callCount, 0);
    const mainAgentCalls = workspace.usageCount - totalSubagentCalls;

    // Get most active subagents (top 5)
    const topSubagents = subagents
      .sort((a, b) => b.callCount - a.callCount)
      .slice(0, 5)
      .map((s) => ({
        subagentId: s.subagentId,
        name: s.name || s.subagentId,
        callCount: s.callCount,
        lastActiveAt: s.lastActiveAt,
      }));

    return {
      mainAgent: {
        id: workspace.mainAgentId || null,
        name: workspace.mainAgentName || "Unnamed Agent",
        callCount: Math.max(0, mainAgentCalls), // Ensure non-negative
      },
      subagents: {
        total: subagents.length,
        totalCalls: totalSubagentCalls,
        topActive: topSubagents,
      },
      totalCalls: workspace.usageCount,
    };
  },
});
