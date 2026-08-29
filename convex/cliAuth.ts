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
 *                           Page lands on /auth/cli/done and best-effort pings
 *                           localhost; CLI/whoami also poll() for the code.
 *   3. exchange (action)   — CLI receives code via loopback or poll, POSTs
 *                           {code, codeVerifier}. Action verifies
 *                           sha256(codeVerifier) === challenge, then mints session.
 *
 * PKCE: base64url(sha256(verifier)). Web Crypto used (Convex actions support it).
 */

import { v } from "convex/values";
import { mutation, action, internalMutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { recordWorkspaceAuthenticated } from "./funnel";
import { FREE_MANAGED_CALLS_LIFETIME } from "../src/product-truth";
import { findUsableAgentSession } from "./sessionSecurity";
import { scheduleCompleteFirstExecute } from "./activation";

const AUTHID_LENGTH = 32;
const CODE_LENGTH = 48;
const APIKEY_LENGTH = 48;
const SESSION_LENGTH = 48;
const EXPIRES_MS = 5 * 60 * 1000;       // 5 minutes
const CODE_EXPIRES_MS = 2 * 60 * 1000;  // 2 minutes after claim

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function randomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("");
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const code = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  return `CLAW-${code}`;
}

// Deterministic hash used elsewhere in this codebase (apiKeys.ts) for key lookup.
async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function getKeyPrefix(key: string): string {
  return `sk-claw-...${key.slice(-4)}`;
}

const APP_URL_DEFAULT = "https://apiclaw.cloud";

function requireServerBridgeSecret(value: string): void {
  const expected = process.env.APICLAW_INTERNAL_SECRET;
  if (!expected || value !== expected) throw new Error("unauthorized_cli_auth_claim");
}

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
 * CLI / whoami polls this after Authorize. Returns the one-time code only when
 * the caller presents the PKCE challenge from the machine that started login.
 * The browser URL alone is not enough — that keeps a leaked authId from
 * redeeming someone else's terminal.
 */
export const poll = query({
  args: {
    authId: v.string(),
    challenge: v.string(),
  },
  returns: v.object({
    status: v.union(
      v.literal("pending"),
      v.literal("claimed"),
      v.literal("exchanged"),
      v.literal("expired"),
      v.literal("not_found"),
    ),
    code: v.optional(v.string()),
    state: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (!args.authId || args.authId.length < 16 || !args.challenge || args.challenge.length < 32) {
      return { status: "not_found" as const };
    }
    const row = await ctx.db
      .query("cliAuthCodes")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .first();
    if (!row || row.challenge !== args.challenge) {
      return { status: "not_found" as const };
    }
    if (row.expiresAt < Date.now()) return { status: "expired" as const };
    if (row.status === "claimed" && row.code && row.state) {
      return { status: "claimed" as const, code: row.code, state: row.state };
    }
    if (row.status === "exchanged") return { status: "exchanged" as const };
    return { status: "pending" as const };
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
    internalSecret: v.string(),
  },
  handler: async (ctx, args) => {
    // Clerk identity is verified by the APIClaw Next.js server component. A
    // direct Convex caller must never be able to self-assert another email.
    requireServerBridgeSecret(args.internalSecret);
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
    previousSessionToken: v.optional(v.string()),
    previousApiKey: v.optional(v.string()),
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
        previousSessionToken: args.previousSessionToken,
        previousApiKey: args.previousApiKey,
      }
    );
    return result;
  },
});

type CliLogoutResult =
  | { success: true; revokedApiKey: boolean }
  | { success: false; error: "invalid_session" | "api_key_mismatch" };

type ResolvedCliCredentials = {
  session: Doc<"agentSessions"> | null;
  apiKeyDoc: Doc<"workspaceApiKeys"> | null;
};

type PreviousCliCredentialsResult =
  | ({ ok: true } & ResolvedCliCredentials)
  | { ok: false; error: "previous_credentials_mismatch" };

/**
 * Resolve the credentials being replaced by `auth login --force`. Missing or
 * already-revoked credentials are safe to ignore, while two live credentials
 * that belong to different workspaces indicate a corrupted local config.
 */
export async function resolvePreviousCliCredentials(
  db: MutationCtx["db"],
  args: { sessionToken?: string; apiKey?: string },
): Promise<PreviousCliCredentialsResult> {
  const session = args.sessionToken
    ? await findUsableAgentSession(db, args.sessionToken, { audience: "durable" })
    : null;

  let apiKeyDoc: Doc<"workspaceApiKeys"> | null = null;
  if (args.apiKey) {
    const keyHash = await hashKey(args.apiKey);
    const candidate = await db
      .query("workspaceApiKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", keyHash))
      .first();
    if (candidate && candidate.revokedAt === undefined) apiKeyDoc = candidate;
  }

  if (session && apiKeyDoc && session.workspaceId !== apiKeyDoc.workspaceId) {
    return { ok: false, error: "previous_credentials_mismatch" };
  }
  return { ok: true, session, apiKeyDoc };
}

/** Revoke a resolved prior credential set, optionally rotating its owner row in place. */
export async function revokeResolvedCliCredentials(
  db: MutationCtx["db"],
  credentials: ResolvedCliCredentials,
  preserveSessionId?: Doc<"agentSessions">["_id"],
): Promise<void> {
  if (credentials.apiKeyDoc) {
    await db.patch(credentials.apiKeyDoc._id, { revokedAt: Date.now() });
  }
  if (!credentials.session) return;

  const browserChildren = await db
    .query("agentSessions")
    .withIndex("by_parentSessionId", (q) => q.eq("parentSessionId", credentials.session!._id))
    .collect();
  for (const child of browserChildren) {
    await db.delete(child._id);
  }
  if (credentials.session._id !== preserveSessionId) {
    await db.delete(credentials.session._id);
  }
}

/**
 * Revoke the durable CLI session, all browser children minted from it, and
 * the exact API key held by this CLI. Convex mutations are transactional, so
 * a failed ownership check leaves every credential usable for a safe retry.
 */
export async function revokeCliCredentials(
  db: MutationCtx["db"],
  args: { sessionToken: string; apiKey?: string },
): Promise<CliLogoutResult> {
  const session = await findUsableAgentSession(db, args.sessionToken, {
    audience: "durable",
  });
  if (!session) return { success: false, error: "invalid_session" };

  let apiKeyDoc = null;
  if (args.apiKey) {
    const keyHash = await hashKey(args.apiKey);
    apiKeyDoc = await db
      .query("workspaceApiKeys")
      .withIndex("by_keyHash", (q) => q.eq("keyHash", keyHash))
      .first();
    if (
      !apiKeyDoc ||
      apiKeyDoc.workspaceId !== session.workspaceId ||
      apiKeyDoc.revokedAt !== undefined
    ) {
      return { success: false, error: "api_key_mismatch" };
    }
  }

  const browserChildren = await db
    .query("agentSessions")
    .withIndex("by_parentSessionId", (q) => q.eq("parentSessionId", session._id))
    .collect();

  if (apiKeyDoc) {
    await db.patch(apiKeyDoc._id, { revokedAt: Date.now() });
  }
  for (const child of browserChildren) {
    await db.delete(child._id);
  }
  await db.delete(session._id);

  return { success: true, revokedApiKey: apiKeyDoc !== null };
}

/**
 * Server-backed CLI logout. Local credentials are cleared only after this
 * mutation confirms that their remote bearer credentials were revoked.
 */
export const logout = mutation({
  args: {
    sessionToken: v.string(),
    apiKey: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ success: v.literal(true), revokedApiKey: v.boolean() }),
    v.object({
      success: v.literal(false),
      error: v.union(v.literal("invalid_session"), v.literal("api_key_mismatch")),
    }),
  ),
  handler: async (ctx, args): Promise<CliLogoutResult> =>
    revokeCliCredentials(ctx.db, args),
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
    previousSessionToken: v.optional(v.string()),
    previousApiKey: v.optional(v.string()),
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

    // A force login rotates the credentials currently stored on this machine
    // in the same transaction that issues their replacements. Validate before
    // consuming the one-time code or creating any new remote credential.
    const previous = args.previousSessionToken || args.previousApiKey
      ? await resolvePreviousCliCredentials(ctx.db, {
          sessionToken: args.previousSessionToken,
          apiKey: args.previousApiKey,
        })
      : null;
    if (previous && previous.ok === false) {
      await emitFailure(previous.error);
      return { success: false, error: previous.error };
    }

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
        usageLimit: FREE_MANAGED_CALLS_LIFETIME,
        managedUsageCount: 0,
        activationManagedCallCount: 0,
        activationProviderCostMicros: 0,
        weeklyUsageCount: 0,
        weeklyUsageLimit: FREE_MANAGED_CALLS_LIFETIME,
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
    let existingSession = await ctx.db
      .query("agentSessions")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace!._id))
      .filter((q) => q.eq(q.field("fingerprint"), fp))
      .first();

    // Prefer rotating the exact prior owner row when the user authenticated
    // back into the same workspace on the same machine.
    if (
      previous?.ok &&
      previous.session?.workspaceId === workspace._id &&
      previous.session.fingerprint === fp
    ) {
      existingSession = previous.session;
    }

    if (previous?.ok) {
      await revokeResolvedCliCredentials(ctx.db, previous, existingSession?._id);
    }

    if (existingSession) {
      const browserChildren = await ctx.db
        .query("agentSessions")
        .withIndex("by_parentSessionId", (q) => q.eq("parentSessionId", existingSession._id))
        .collect();
      for (const child of browserChildren) {
        await ctx.db.delete(child._id);
      }
      await ctx.db.patch(existingSession._id, {
        sessionToken,
        sessionKind: "owner",
        parentSessionId: undefined,
        expiresAt: undefined,
        lastUsedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("agentSessions", {
        workspaceId: workspace._id,
        sessionToken,
        sessionKind: "owner",
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
      keyHash: await hashKey(rawKey),
      keyPrefix: getKeyPrefix(rawKey),
      name: `cli-auth ${new Date().toISOString().slice(0, 10)}`,
      createdAt: Date.now(),
    });

    try {
      await recordWorkspaceAuthenticated(ctx, {
        workspaceId: workspace._id,
        email,
        authMethod: "cli_browser",
        fingerprint: fp,
        isNew,
        tier: workspace.tier,
      });
    } catch {
      // Never block authentication on telemetry.
    }

    if (isNew) {
      await ctx.scheduler.runAfter(0, internal.inbound.notifySignup, {
        email,
        workspaceId: workspace._id,
        tier: workspace.tier,
        isNewUser: true,
        timestamp: Date.now(),
      });
    }

    // Same one-shot first execute as the web Clerk bridge. Old CLI clients
    // that stop after writing session_token still get NASA/Frankfurter.
    await scheduleCompleteFirstExecute(ctx, workspace._id);

    // Preserve the legacy auth event for historical reporting.
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
