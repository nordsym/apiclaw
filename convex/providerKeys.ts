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

    if (existingKey) {
      // Update existing key
      await ctx.db.patch(existingKey._id, {
        encryptedKey,
        keyHint,
        updatedAt: now,
      });
      return { success: true, action: "updated" };
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
      return { success: true, action: "created" };
    }
  },
});

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
