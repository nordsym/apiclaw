/**
 * cliAuth — browser-loopback auth flow for the APIClaw CLI.
 *
 * Three phases:
 *   1. start (mutation)    — CLI POSTs {state, challenge, port, fingerprint?}
 *                           Server returns {authId, browserUrl}.
 *                           CLI opens browserUrl in default browser.
 *   2. claim (mutation)    — /auth/cli page server-action (Clerk-gated) POSTs
 *                           {authId, clerkUserId, email}. Server validates,
 *                           generates one-time `code`, returns {code, port, state}.
 *                           Page 302s to http://localhost:<port>/callback.
 *   3. exchange (action)   — CLI loopback receives code, POSTs {code, codeVerifier}.
 *                           Action verifies sha256(codeVerifier) === challenge,
 *                           then calls internal mutation to mint session + key.
 *
 * PKCE: base64url(sha256(verifier)). Web Crypto used (Convex actions support it).
 */

import { v } from "convex/values";
import { mutation, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

const AUTHID_LENGTH = 32;
const CODE_LENGTH = 48;
const APIKEY_LENGTH = 48;
const SESSION_LENGTH = 48;
const EXPIRES_MS = 5 * 60 * 1000;       // 5 minutes
const CODE_EXPIRES_MS = 2 * 60 * 1000;  // 2 minutes after claim

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function randomString(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return out;
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CLAW-${code}`;
}

// Deterministic hash used elsewhere in this codebase (apiKeys.ts) for key lookup.
function hashKey(key: string): string {
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

const APP_URL_DEFAULT = "https://apiclaw.cloud";

/**
 * Phase 1: CLI starts the flow. Returns the URL to open in the browser.
 */
export const start = mutation({
  args: {
    state: v.string(),
    challenge: v.string(),
    port: v.number(),
    fingerprint: v.optional(v.string()),
    appUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.state || args.state.length < 16) throw new Error("invalid_state");
    if (!args.challenge || args.challenge.length < 32) throw new Error("invalid_challenge");
    if (!Number.isInteger(args.port) || args.port < 1024 || args.port > 65535) {
      throw new Error("invalid_port");
    }

    const authId = randomString(AUTHID_LENGTH);
    const now = Date.now();

    await ctx.db.insert("cliAuthCodes", {
      authId,
      state: args.state,
      challenge: args.challenge,
      port: args.port,
      fingerprint: args.fingerprint,
      status: "pending",
      expiresAt: now + EXPIRES_MS,
      createdAt: now,
    });

    const appUrl = (args.appUrl || APP_URL_DEFAULT).replace(/\/+$/, "");
    return {
      authId,
      browserUrl: `${appUrl}/auth/cli?authId=${authId}`,
      expiresAt: now + EXPIRES_MS,
    };
  },
});

/**
 * Phase 2: Browser /auth/cli page (Clerk-verified) claims the authId.
 * Server-action only — Clerk identity is established server-side before this is called.
 */
export const claim = mutation({
  args: {
    authId: v.string(),
    clerkUserId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("cliAuthCodes")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .first();

    if (!row) return { success: false, error: "auth_id_not_found" };
    if (row.expiresAt < Date.now()) return { success: false, error: "expired" };
    if (row.status !== "pending") return { success: false, error: "already_used" };

    const code = randomString(CODE_LENGTH);
    const now = Date.now();

    await ctx.db.patch(row._id, {
      status: "claimed",
      code,
      clerkUserId: args.clerkUserId,
      email: args.email.toLowerCase().trim(),
      claimedAt: now,
      expiresAt: now + CODE_EXPIRES_MS,
    });

    return {
      success: true,
      code,
      port: row.port,
      state: row.state,
    };
  },
});

/**
 * Phase 3 (action): CLI exchanges {code, codeVerifier} for {sessionToken, apiKey}.
 * Action because Convex mutations cannot use Web Crypto (non-deterministic).
 * Computes sha256(codeVerifier) → base64url, compares with stored challenge,
 * then defers DB writes to an internal mutation.
 */
interface ExchangeResult {
  success: boolean;
  error?: string;
  sessionToken?: string;
  workspaceId?: string;
  email?: string;
  apiKey?: string;
  tier?: string;
  isNew?: boolean;
}

export const exchange = action({
  args: {
    code: v.string(),
    codeVerifier: v.string(),
    fingerprint: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
    workspaceId: v.optional(v.string()),
    email: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    tier: v.optional(v.string()),
    isNew: v.optional(v.boolean()),
  }),
  handler: async (ctx, args): Promise<ExchangeResult> => {
    // Compute PKCE challenge from verifier
    const enc = new TextEncoder().encode(args.codeVerifier);
    const digest = await crypto.subtle.digest("SHA-256", enc);
    const bytes = new Uint8Array(digest);
    let b64 = "";
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let i = 0;
    for (; i + 2 < bytes.length; i += 3) {
      const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
      b64 += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] + chars[(n >> 6) & 63] + chars[n & 63];
    }
    if (i < bytes.length) {
      const r = bytes.length - i;
      const a = bytes[i];
      const b = r === 2 ? bytes[i + 1] : 0;
      const n = (a << 16) | (b << 8);
      b64 += chars[(n >> 18) & 63] + chars[(n >> 12) & 63];
      if (r === 2) b64 += chars[(n >> 6) & 63];
    }

    const result: ExchangeResult = await ctx.runMutation(
      internal.cliAuth._exchangeVerified,
      {
        code: args.code,
        challenge: b64,
        fingerprint: args.fingerprint,
      }
    );
    return result;
  },
});

/**
 * Internal: validates challenge and performs the DB writes.
 * Called only by exchange() action — no public surface.
 */
export const _exchangeVerified = internalMutation({
  args: {
    code: v.string(),
    challenge: v.string(),
    fingerprint: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
    workspaceId: v.optional(v.string()),
    email: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    tier: v.optional(v.string()),
    isNew: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("cliAuthCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    const emitFailure = async (reason: string) => {
      try {
        await ctx.db.insert("funnelEvents", {
          event: "cli_browser_callback_failed",
          classification: "human",
          fingerprint: args.fingerprint,
          email: row?.email,
          props: { reason },
          timestamp: Date.now(),
        });
      } catch {
        // never block the auth path on telemetry
      }
    };

    if (!row) {
      await emitFailure("code_not_found");
      return { success: false, error: "code_not_found" };
    }
    if (row.status !== "claimed") {
      await emitFailure("bad_status");
      return { success: false, error: "bad_status" };
    }
    if (row.expiresAt < Date.now()) {
      await emitFailure("expired");
      return { success: false, error: "expired" };
    }
    if (row.challenge !== args.challenge) {
      await emitFailure("pkce_mismatch");
      return { success: false, error: "pkce_mismatch" };
    }
    if (!row.email) {
      await emitFailure("no_email");
      return { success: false, error: "no_email" };
    }

    const email = row.email;
    const clerkUserId = row.clerkUserId || "";
    const fingerprint = args.fingerprint || row.fingerprint;

    // Mark exchanged immediately so the code can't be reused.
    await ctx.db.patch(row._id, {
      status: "exchanged",
      exchangedAt: Date.now(),
    });

    // Get or create workspace (mirrors getOrCreateForClerk pattern).
    let workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    let isNew = false;
    if (!workspace) {
      isNew = true;
      let newReferralCode = "";
      for (let attempt = 0; attempt < 10; attempt++) {
        newReferralCode = generateReferralCode();
        const exists = await ctx.db
          .query("workspaces")
          .withIndex("by_referralCode", (q) => q.eq("referralCode", newReferralCode))
          .first();
        if (!exists) break;
      }

      const wsId = await ctx.db.insert("workspaces", {
        email,
        status: "active",
        tier: "free",
        usageCount: 0,
        usageLimit: 50,
        weeklyUsageCount: 0,
        weeklyUsageLimit: 50,
        hourlyUsageCount: 0,
        referralCode: newReferralCode || `CLAW-NEW${Date.now() % 100000}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      workspace = await ctx.db.get(wsId);
    }
    if (!workspace) return { success: false, error: "workspace_error" };

    // Session — reuse existing for same fingerprint, else create
    const sessionToken = randomString(SESSION_LENGTH);
    const fp = fingerprint || (clerkUserId ? `clerk:${clerkUserId}` : `cli:${Date.now()}`);
    const existingSession = await ctx.db
      .query("agentSessions")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace!._id))
      .filter((q) => q.eq(q.field("fingerprint"), fp))
      .first();

    if (existingSession) {
      await ctx.db.patch(existingSession._id, {
        sessionToken,
        lastUsedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("agentSessions", {
        workspaceId: workspace._id,
        sessionToken,
        fingerprint: fp,
        lastUsedAt: Date.now(),
        createdAt: Date.now(),
      });
    }

    // Issue a fresh sk-claw-* API key for this workspace (HTTP door).
    const rawKey = `sk-claw-${randomString(APIKEY_LENGTH)}`;
    await ctx.db.insert("workspaceApiKeys", {
      workspaceId: workspace._id,
      key: "",
      keyHash: hashKey(rawKey),
      keyPrefix: getKeyPrefix(rawKey),
      name: `cli-auth ${new Date().toISOString().slice(0, 10)}`,
      createdAt: Date.now(),
    });

    // Emit canonical activation event for the agent-native auth path.
    // dedupeKey ensures one event per workspace per day even on retries.
    try {
      const day = new Date().toISOString().slice(0, 10);
      await ctx.db.insert("funnelEvents", {
        event: "cli_browser_callback_success",
        classification: "human",
        workspaceId: workspace._id,
        fingerprint: fp,
        email,
        dedupeKey: `cli_browser_callback_success:${workspace._id}:${day}`,
        props: { is_new: isNew, has_api_key: true, tier: workspace.tier },
        timestamp: Date.now(),
      });
    } catch {
      // never block the auth path on telemetry
    }

    return {
      success: true,
      sessionToken,
      workspaceId: workspace._id,
      email,
      apiKey: rawKey,
      tier: workspace.tier,
      isNew,
    };
  },
});
