import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

// ============================================
// WORKSPACE API KEYS
// Generate persistent API keys for programmatic access.
// Users generate keys in the dashboard, then use them
// in any agent config, automation, or script.
// ============================================

function randomUrlSafe(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

function generateRawKey(): string {
  return `sk-claw-${randomUrlSafe(48)}`;
}

async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function legacyHashKey(key: string): string {
  let h1 = 0;
  for (let i = 0; i < key.length; i++) {
    h1 = ((h1 << 5) - h1 + key.charCodeAt(i)) | 0;
  }
  let h2 = 0;
  for (let i = 0; i < key.length; i++) {
    h2 = ((h2 << 7) - h2 + key.charCodeAt(i) * 31) | 0;
  }
  let h3 = 0;
  for (let i = 0; i < key.length; i++) {
    h3 = ((h3 << 11) - h3 + key.charCodeAt(i) * 127) | 0;
  }
  return `${(h1 >>> 0).toString(36)}-${(h2 >>> 0).toString(36)}-${(h3 >>> 0).toString(36)}`;
}

function getKeyPrefix(key: string): string {
  return `sk-claw-...${key.slice(-4)}`;
}

// ============================================
// GENERATE KEY
// ============================================

export const generateKey = mutation({
  args: {
    token: v.string(), // session token for auth
    name: v.string(), // user label
  },
  handler: async (ctx, args) => {
    // Auth via agentSession
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    const workspaceId = session.workspaceId;

    // Limit: max 5 active keys per workspace
    const existingKeys = await ctx.db
      .query("workspaceApiKeys")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    const activeKeys = existingKeys.filter((k) => !k.revokedAt);
    if (activeKeys.length >= 5) {
      throw new Error("Maximum 5 active keys per workspace. Revoke an existing key first.");
    }

    // Check for duplicate name
    const nameExists = activeKeys.some(
      (k) => k.name.toLowerCase() === args.name.toLowerCase()
    );
    if (nameExists) {
      throw new Error(`A key named "${args.name}" already exists.`);
    }

    const rawKey = generateRawKey();
    const now = Date.now();

    await ctx.db.insert("workspaceApiKeys", {
      workspaceId,
      key: "", // We don't store the raw key
      keyHash: await hashKey(rawKey),
      keyPrefix: getKeyPrefix(rawKey),
      name: args.name,
      createdAt: now,
    });

    // Return the raw key ONCE - it won't be retrievable again
    return {
      key: rawKey,
      keyPrefix: getKeyPrefix(rawKey),
      name: args.name,
    };
  },
});

// ============================================
// LIST KEYS
// ============================================

export const listKeys = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      return { keys: [] };
    }

    const keys = await ctx.db
      .query("workspaceApiKeys")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();

    return {
      keys: keys
        .filter((k) => !k.revokedAt)
        .map((k) => ({
          id: k._id,
          name: k.name,
          keyPrefix: k.keyPrefix,
          lastUsedAt: k.lastUsedAt,
          createdAt: k.createdAt,
        }))
        .sort((a, b) => b.createdAt - a.createdAt),
    };
  },
});

// ============================================
// REVOKE KEY
// ============================================

export const revokeKey = mutation({
  args: {
    token: v.string(),
    keyId: v.id("workspaceApiKeys"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    const key = await ctx.db.get(args.keyId);
    if (!key || key.workspaceId !== session.workspaceId) {
      throw new Error("Key not found");
    }

    if (key.revokedAt) {
      throw new Error("Key already revoked");
    }

    await ctx.db.patch(args.keyId, { revokedAt: Date.now() });
    return { success: true };
  },
});

// ============================================
// RESOLVE KEY (internal - used by gateway)
// ============================================

export const resolveKey = internalQuery({
  args: {
    rawKey: v.string(),
  },
  handler: async (ctx, args) => {
    const keyHash = await hashKey(args.rawKey);
    const legacyHash = legacyHashKey(args.rawKey);

    let keyDoc = await ctx.db
      .query("workspaceApiKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", keyHash))
      .first();
    if (!keyDoc) {
      keyDoc = await ctx.db
        .query("workspaceApiKeys")
        .withIndex("by_keyHash", (q) => q.eq("keyHash", legacyHash))
        .first();
    }

    if (!keyDoc) {
      return null;
    }

    if (keyDoc.revokedAt) {
      return null;
    }

    return {
      workspaceId: keyDoc.workspaceId,
      keyId: keyDoc._id,
      name: keyDoc.name,
    };
  },
});

// ============================================
// TOUCH KEY (internal - update lastUsedAt)
// ============================================

// touchKey: kept as a no-op for callsite compatibility.
//
// Hot-path decontention 2026-05-27: every gateway call previously patched
// lastUsedAt on the same workspaceApiKeys row, generating 42 OCC retries in
// a 9-hour window. lastUsedAt is UI-only signal (key list "last used X ago")
// and not on any critical path — the cost of synchronous patch under load
// exceeds the value of sub-second freshness.
//
// If sub-minute freshness on lastUsedAt becomes a UI requirement, swap to
// an append-only apiKeyTouchEvents table + cron aggregate.
export const touchKey = mutation({
  args: {
    keyId: v.id("workspaceApiKeys"),
  },
  handler: async (_ctx, _args) => {
    // intentional no-op
  },
});
