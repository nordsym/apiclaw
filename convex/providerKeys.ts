import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

// ============================================
// BYOK - Bring Your Own Key
// ============================================

// Supported providers for BYOK
export const BYOK_PROVIDERS = [
  { id: "brave_search", name: "Brave Search", icon: "🔍" },
  { id: "openrouter", name: "OpenRouter", icon: "🤖" },
  { id: "elevenlabs", name: "ElevenLabs", icon: "🎙️" },
  { id: "twilio", name: "Twilio", icon: "📞" },
  { id: "resend", name: "Resend", icon: "📧" },
  { id: "e2b", name: "E2B", icon: "💻" },
] as const;

// Simple base64 encoding for MVP (proper encryption in production)
function encryptKey(key: string): string {
  return Buffer.from(key).toString("base64");
}

function decryptKey(encryptedKey: string): string {
  return Buffer.from(encryptedKey, "base64").toString("utf-8");
}

function getKeyHint(key: string): string {
  if (key.length <= 4) return "••••";
  return key.slice(-4);
}

// ============================================
// ADD KEY
// ============================================

export const addKey = mutation({
  args: {
    token: v.string(),
    provider: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    const workspaceId = session.workspaceId;

    // Check if key already exists for this provider
    const existingKey = await ctx.db
      .query("providerKeys")
      .withIndex("by_provider", (q) =>
        q.eq("workspaceId", workspaceId).eq("provider", args.provider)
      )
      .first();

    const now = Date.now();
    const encryptedKey = encryptKey(args.apiKey);
    const keyHint = getKeyHint(args.apiKey);

    let isFirstKey = false;

    if (existingKey) {
      // Update existing key
      await ctx.db.patch(existingKey._id, {
        encryptedKey,
        keyHint,
        updatedAt: now,
      });
    } else {
      // Create new key
      await ctx.db.insert("providerKeys", {
        workspaceId,
        provider: args.provider,
        encryptedKey,
        keyHint,
        isCustom: false,
        createdAt: now,
        updatedAt: now,
      });

      // Check if this is the first BYOK key for earn progress
      const allKeys = await ctx.db
        .query("providerKeys")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
        .collect();

      // If this is the only key (the one we just created), mark BYOK setup
      if (allKeys.length === 1) {
        isFirstKey = true;
        // Import and call markByokSetup
        const earnProgress = await ctx.db
          .query("earnProgress")
          .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
          .first();

        if (earnProgress && !earnProgress.byokSetup) {
          const newTotal = calculateEarnTotal({ ...earnProgress, byokSetup: true });
          await ctx.db.patch(earnProgress._id, {
            byokSetup: true,
            byokSetupAt: now,
            totalEarned: newTotal,
            updatedAt: now,
          });
          // Add 5 calls to workspace limit
          const workspace = await ctx.db.get(workspaceId);
          if (workspace) {
            await ctx.db.patch(workspaceId, {
              usageLimit: workspace.usageLimit + 5,
              updatedAt: now,
            });
          }
        } else if (!earnProgress) {
          // Create earn progress with byokSetup
          await ctx.db.insert("earnProgress", {
            workspaceId,
            firstDirectCall: false,
            apisUsed: [],
            apisUsedComplete: false,
            agentListed: false,
            apiListed: false,
            byokSetup: true,
            byokSetupAt: now,
            githubStarred: false,
            twitterFollowed: false,
            referralCount: 0,
            totalEarned: 5, // BYOK reward
            createdAt: now,
            updatedAt: now,
          });
          // Add 5 calls to workspace limit
          const workspace = await ctx.db.get(workspaceId);
          if (workspace) {
            await ctx.db.patch(workspaceId, {
              usageLimit: workspace.usageLimit + 5,
              updatedAt: now,
            });
          }
        }
      }
    }

    return { 
      success: true, 
      action: existingKey ? "updated" : "created",
      earnedByok: isFirstKey,
    };
  },
});

// Helper to calculate earn total (duplicated to avoid circular import)
function calculateEarnTotal(progress: any): number {
  let total = 0;
  if (progress.firstDirectCall) total += 15;
  if (progress.apisUsedComplete) total += 10;
  if (progress.agentListed) total += 10;
  if (progress.apiListed) total += 10;
  if (progress.byokSetup) total += 5;
  if (progress.githubStarred) total += 10;
  if (progress.twitterFollowed) total += 5;
  total += (progress.referralCount || 0) * 10;
  return total;
}

// ============================================
// REMOVE KEY
// ============================================

export const removeKey = mutation({
  args: {
    token: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    const workspaceId = session.workspaceId;

    // Find and delete the key
    const existingKey = await ctx.db
      .query("providerKeys")
      .withIndex("by_provider", (q) =>
        q.eq("workspaceId", workspaceId).eq("provider", args.provider)
      )
      .first();

    if (!existingKey) {
      throw new Error("Key not found");
    }

    await ctx.db.delete(existingKey._id);
    return { success: true };
  },
});

// ============================================
// GET KEYS (for display - no actual key values)
// ============================================

export const getKeys = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      return { keys: [] };
    }

    const workspaceId = session.workspaceId;

    // Get all keys for this workspace
    const keys = await ctx.db
      .query("providerKeys")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    // Return without actual key values
    return {
      keys: keys.map((key) => ({
        provider: key.provider,
        keyHint: key.keyHint,
        isCustom: key.isCustom,
        customConfig: key.customConfig,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
      })),
    };
  },
});

// ============================================
// GET KEY FOR EXECUTION (internal use only)
// ============================================

export const getKeyForExecution = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query("providerKeys")
      .withIndex("by_provider", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("provider", args.provider)
      )
      .first();

    if (!key) {
      return null;
    }

    return {
      apiKey: decryptKey(key.encryptedKey),
      isCustom: key.isCustom,
      customConfig: key.customConfig,
    };
  },
});

// ============================================
// GET SUPPORTED PROVIDERS
// ============================================

export const getSupportedProviders = query({
  args: {},
  handler: async () => {
    return BYOK_PROVIDERS;
  },
});
