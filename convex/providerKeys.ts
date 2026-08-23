import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { findUsableAgentSession } from "./sessionSecurity";

// ============================================
// BYOK — Bring Your Own Key (BYOH Phase 1, 2026-08-24)
//
// Workspaces can attach their own provider API key and route calls through
// it for free: no card, no markup, they pay their provider directly. This
// revives the previously dead `providerKeys` table (schema.ts).
//
// Auth follows the same session-token + workspace-scope pattern as
// workspaceSettings.ts. Reads never return the decrypted key — only
// keyHint. Encryption mirrors src/crypto.ts's encryptKey/decryptKey format
// ("ivHex:tagHex:dataHex", AES-256-GCM, 12-byte IV) using Web Crypto, since
// this file runs in Convex's default (non-Node) runtime — the same approach
// convex/missionRunner.ts already uses for decryptManagedKey.
// ============================================

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getEncryptionKeyBytes(): Uint8Array {
  const secret = process.env.APICLAW_KEY_ENCRYPTION_SECRET;
  if (!secret) throw new Error("APICLAW_KEY_ENCRYPTION_SECRET_missing");
  if (secret.length !== 64) throw new Error("APICLAW_KEY_ENCRYPTION_SECRET_invalid_length");
  return hexToBytes(secret);
}

async function encryptProviderKey(plainKey: string): Promise<string> {
  const keyBytes = getEncryptionKeyBytes();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes as BufferSource,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  const plaintextBytes = new TextEncoder().encode(plainKey);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    cryptoKey,
    plaintextBytes as BufferSource,
  );

  // Web Crypto appends the 16-byte GCM auth tag to the ciphertext output.
  // Split it back apart to match the "ivHex:tagHex:dataHex" format that
  // src/crypto.ts (Node) and missionRunner.ts's decryptManagedKey expect.
  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const tagLength = 16;
  const data = encryptedBytes.slice(0, encryptedBytes.length - tagLength);
  const tag = encryptedBytes.slice(encryptedBytes.length - tagLength);

  return `${bytesToHex(iv)}:${bytesToHex(tag)}:${bytesToHex(data)}`;
}

function keyHintFor(plainKey: string): string {
  return plainKey.length > 4 ? plainKey.slice(-4) : plainKey;
}

/** Decrypts a providerKeys.encryptedKey value. Server-side execution only —
 * never call this from a query/mutation whose result reaches the client. */
export async function decryptProviderKey(encryptedKey: string): Promise<string> {
  const keyBytes = getEncryptionKeyBytes();
  const parts = encryptedKey.split(":");
  if (parts.length !== 3) throw new Error("invalid_encrypted_key_format");
  const [ivHex, tagHex, dataHex] = parts;
  if (!ivHex || !tagHex || !dataHex) throw new Error("invalid_encrypted_key_format");

  const iv = hexToBytes(ivHex);
  const tag = hexToBytes(tagHex);
  const data = hexToBytes(dataHex);

  const combined = new Uint8Array(data.length + tag.length);
  combined.set(data, 0);
  combined.set(tag, data.length);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes as BufferSource,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    cryptoKey,
    combined as BufferSource,
  );

  return new TextDecoder().decode(plaintextBuffer);
}

// ============================================
// MUTATIONS
// ============================================

/** Store (or replace) a workspace's own API key for a provider. Encrypts
 * before writing; never stores or returns the raw key elsewhere. */
export const setKey = mutation({
  args: {
    token: v.string(),
    provider: v.string(),
    key: v.string(),
    isCustom: v.optional(v.boolean()),
    customConfig: v.optional(
      v.object({
        baseUrl: v.string(),
        authType: v.string(),
        authHeader: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const session = await findUsableAgentSession(ctx.db, args.token);
    if (!session) throw new Error("Invalid or expired session");

    const provider = args.provider.trim().toLowerCase();
    if (!provider) throw new Error("provider is required");
    if (!args.key || args.key.trim().length === 0) throw new Error("key is required");

    const workspaceId = session.workspaceId;
    const now = Date.now();
    const encryptedKey = await encryptProviderKey(args.key);
    const keyHint = keyHintFor(args.key);

    const existing = await ctx.db
      .query("providerKeys")
      .withIndex("by_provider", (q) => q.eq("workspaceId", workspaceId).eq("provider", provider))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        encryptedKey,
        keyHint,
        isCustom: args.isCustom ?? existing.isCustom,
        customConfig: args.customConfig ?? existing.customConfig,
        updatedAt: now,
      });
      return { id: existing._id, provider, keyHint };
    }

    const id = await ctx.db.insert("providerKeys", {
      workspaceId,
      provider,
      encryptedKey,
      keyHint,
      isCustom: args.isCustom ?? false,
      customConfig: args.customConfig,
      createdAt: now,
      updatedAt: now,
    });
    return { id, provider, keyHint };
  },
});

/** Remove a workspace's stored key for a provider. Workspace-scoped: a row
 * belonging to a different workspace is never touched. */
export const removeKey = mutation({
  args: {
    token: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await findUsableAgentSession(ctx.db, args.token);
    if (!session) throw new Error("Invalid or expired session");

    const provider = args.provider.trim().toLowerCase();
    const existing = await ctx.db
      .query("providerKeys")
      .withIndex("by_provider", (q) => q.eq("workspaceId", session.workspaceId).eq("provider", provider))
      .first();

    if (!existing) return { success: false, reason: "not_found" as const };
    await ctx.db.delete(existing._id);
    return { success: true };
  },
});

/** Internal: fetch the raw encrypted key row for server-side execution
 * (e.g. the BYOK chat-completions dispatch path in http.ts). Never exposed
 * to the client — the public `listKeys` query below returns keyHint only.
 * Workspace-scoped by construction: caller supplies the resolved
 * workspaceId, never a cross-workspace lookup. */
export const getKeyForProviderInternal = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    provider: v.string(),
  },
  handler: async (ctx, { workspaceId, provider }) => {
    const row = await ctx.db
      .query("providerKeys")
      .withIndex("by_provider", (q) => q.eq("workspaceId", workspaceId).eq("provider", provider.trim().toLowerCase()))
      .first();
    if (!row) return null;
    return { encryptedKey: row.encryptedKey, isCustom: row.isCustom, customConfig: row.customConfig };
  },
});

// ============================================
// QUERIES
// ============================================

/** List the authenticated workspace's stored provider keys. Returns only
 * provider + masked keyHint — never the decrypted or raw key. */
export const listKeys = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await findUsableAgentSession(ctx.db, token);
    if (!session) return [];

    const rows = await ctx.db
      .query("providerKeys")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();

    return rows.map((row) => ({
      id: row._id,
      provider: row.provider,
      keyHint: row.keyHint,
      isCustom: row.isCustom,
      customConfig: row.customConfig
        ? { baseUrl: row.customConfig.baseUrl, authType: row.customConfig.authType }
        : undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },
});
