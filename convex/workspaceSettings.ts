import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// QUERIES
// ============================================

/** Get workspace settings (returns defaults if none saved) */
export const get = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const settings = await ctx.db
      .query("workspaceSettings")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .first();

    if (!settings) {
      return {
        workspaceId,
        routingMode: "balanced",
        defaultModel: null,
        maxPricePerMTokens: null,
        monthlyBudgetLimit: null,
        preferredProviders: [],
        blockedProviders: [],
        allowOpenRouterFallback: true,
        _isDefault: true,
      };
    }

    return { ...settings, _isDefault: false };
  },
});

/** Internal: get settings for routing (called from http actions) */
export const getForRouting = internalQuery({
  args: { workspaceId: v.string() },
  handler: async (ctx, { workspaceId }) => {
    // Try to find settings - workspaceId comes as string from http handlers
    const all = await ctx.db.query("workspaceSettings").collect();
    const settings = all.find((s) => String(s.workspaceId) === workspaceId);

    // Get workspace tier for premium features (OAuth passthrough etc.)
    const allWorkspaces = await ctx.db.query("workspaces").collect();
    const workspace = allWorkspaces.find((w) => String(w._id) === workspaceId);
    const tier = workspace?.tier ?? "free";

    if (!settings) {
      return {
        routingMode: "balanced" as const,
        defaultModel: null as string | null,
        maxPricePerMTokens: null as number | null,
        monthlyBudgetLimit: null as number | null,
        preferredProviders: [] as string[],
        blockedProviders: [] as string[],
        allowOpenRouterFallback: true,
        tier,
      };
    }

    return {
      routingMode: settings.routingMode,
      defaultModel: settings.defaultModel ?? null,
      maxPricePerMTokens: settings.maxPricePerMTokens ?? null,
      monthlyBudgetLimit: settings.monthlyBudgetLimit ?? null,
      preferredProviders: settings.preferredProviders ?? [],
      blockedProviders: settings.blockedProviders ?? [],
      allowOpenRouterFallback: settings.allowOpenRouterFallback ?? true,
      tier,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

/** Create or update workspace settings */
export const upsert = mutation({
  args: {
    token: v.string(),
    routingMode: v.optional(v.string()),
    defaultModel: v.optional(v.string()),
    maxPricePerMTokens: v.optional(v.float64()),
    monthlyBudgetLimit: v.optional(v.float64()),
    preferredProviders: v.optional(v.array(v.string())),
    blockedProviders: v.optional(v.array(v.string())),
    allowOpenRouterFallback: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Resolve workspace from session token
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid or expired session");
    }

    const workspaceId = session.workspaceId;
    const now = Date.now();

    // Validate routingMode
    const validModes = ["best_price", "highest_quality", "fastest", "balanced"];
    if (args.routingMode && !validModes.includes(args.routingMode)) {
      throw new Error(`Invalid routingMode. Must be one of: ${validModes.join(", ")}`);
    }

    // Check if settings exist
    const existing = await ctx.db
      .query("workspaceSettings")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .first();

    const updates: Record<string, unknown> = { updatedAt: now };
    if (args.routingMode !== undefined) updates.routingMode = args.routingMode;
    if (args.defaultModel !== undefined) updates.defaultModel = args.defaultModel;
    if (args.maxPricePerMTokens !== undefined) updates.maxPricePerMTokens = args.maxPricePerMTokens;
    if (args.monthlyBudgetLimit !== undefined) updates.monthlyBudgetLimit = args.monthlyBudgetLimit;
    if (args.preferredProviders !== undefined) updates.preferredProviders = args.preferredProviders;
    if (args.blockedProviders !== undefined) updates.blockedProviders = args.blockedProviders;
    if (args.allowOpenRouterFallback !== undefined) updates.allowOpenRouterFallback = args.allowOpenRouterFallback;

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    return await ctx.db.insert("workspaceSettings", {
      workspaceId,
      routingMode: args.routingMode || "balanced",
      defaultModel: args.defaultModel,
      maxPricePerMTokens: args.maxPricePerMTokens,
      monthlyBudgetLimit: args.monthlyBudgetLimit,
      preferredProviders: args.preferredProviders,
      blockedProviders: args.blockedProviders,
      allowOpenRouterFallback: args.allowOpenRouterFallback ?? true,
      createdAt: now,
      updatedAt: now,
    });
  },
});
