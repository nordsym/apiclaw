/**
 * Remote MCP — OAuth 2.1 (RFC 6749 + 7591 + 7636 PKCE) state layer.
 *
 * Three flows:
 *   1. Dynamic Client Registration (RFC 7591) — Grok / Cursor / any MCP client
 *      hits POST /api/oauth/register and gets back a client_id (+ optional
 *      client_secret). Registration alone grants nothing.
 *   2. Authorization Code + PKCE — the user signs in via Clerk, lands on
 *      /oauth/authorize, approves consent, and the consent handler calls
 *      `mintAuthCode`. The client then exchanges the code at /api/oauth/token.
 *   3. Dashboard-issued connector — the workspace owner clicks "Generate Grok
 *      Connector" and gets a one-shot client_id+secret pre-bound to their
 *      workspace. Skips the consent screen for repeat installs.
 *
 * Tokens are SHA-ish hashed for lookup, never stored raw. Same convention
 * the workspaceApiKeys table uses (apiKeys.ts).
 */
import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ============================================
// CONSTANTS
// ============================================

const ACCESS_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;        // 24h
const REFRESH_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;  // 90d
const AUTH_CODE_TTL_MS = 10 * 60 * 1000;                // 10 min
const DEFAULT_SCOPE = "mcp";
const ALLOWED_SCOPES = new Set(["mcp", "mcp:read", "mcp:call", "mcp:billing"]);

// ============================================
// HELPERS
// ============================================

const URL_SAFE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomString(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += URL_SAFE_CHARS.charAt(Math.floor(Math.random() * URL_SAFE_CHARS.length));
  }
  return out;
}

// Same deterministic hash as apiKeys.ts. Convex's V8 runtime has no node:crypto;
// this is purely for indexed lookup, not a security primitive. Token entropy
// (48+ chars from 62-symbol alphabet) is the actual security boundary.
function hashToken(token: string): string {
  let h1 = 0;
  for (let i = 0; i < token.length; i++) {
    const c = token.charCodeAt(i);
    h1 = ((h1 << 5) - h1 + c) | 0;
  }
  let h2 = 0;
  for (let i = 0; i < token.length; i++) {
    h2 = ((h2 << 7) - h2 + token.charCodeAt(i) * 31) | 0;
  }
  let h3 = 0;
  for (let i = 0; i < token.length; i++) {
    h3 = ((h3 << 11) - h3 + token.charCodeAt(i) * 127) | 0;
  }
  return `${(h1 >>> 0).toString(36)}-${(h2 >>> 0).toString(36)}-${(h3 >>> 0).toString(36)}`;
}

function tokenPrefix(token: string): string {
  return `${token.slice(0, 8)}...${token.slice(-4)}`;
}

function generateClientId(): string {
  return `claw_mcp_${randomString(24)}`;
}

function generateClientSecret(): string {
  return `claw_mcp_secret_${randomString(48)}`;
}

function generateAuthCode(): string {
  return `claw_mcp_code_${randomString(40)}`;
}

function generateAccessToken(): string {
  return `sk-mcp-${randomString(48)}`;
}

function generateRefreshToken(): string {
  return `rk-mcp-${randomString(48)}`;
}

function normalizeScope(input: string | undefined | null): string {
  if (!input) return DEFAULT_SCOPE;
  const parts = input.split(/\s+/).filter((s) => s.length > 0 && ALLOWED_SCOPES.has(s));
  if (parts.length === 0) return DEFAULT_SCOPE;
  return [...new Set(parts)].join(" ");
}

function validateRedirectUris(uris: string[]): { ok: true; uris: string[] } | { ok: false; error: string } {
  if (!Array.isArray(uris) || uris.length === 0) {
    return { ok: false, error: "redirect_uris must be a non-empty array" };
  }
  for (const u of uris) {
    if (typeof u !== "string" || u.length === 0 || u.length > 2000) {
      return { ok: false, error: "invalid redirect_uri entry" };
    }
    // Allow http for localhost (dev tooling), https everywhere else.
    const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(u);
    const isHttps = u.startsWith("https://");
    const isCustomScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(u) && !u.startsWith("http://") && !u.startsWith("https://");
    if (!isLocalhost && !isHttps && !isCustomScheme) {
      return { ok: false, error: `redirect_uri must use https, custom scheme, or be on localhost: ${u}` };
    }
  }
  return { ok: true, uris };
}

// ============================================
// PUBLIC: DYNAMIC CLIENT REGISTRATION (RFC 7591)
// ============================================
// Open per spec. Registration alone grants nothing — tokens still require
// human consent on /oauth/authorize against an email-verified workspace.

export const registerDynamicClient = mutation({
  args: {
    name: v.string(),
    redirectUris: v.array(v.string()),
    grantTypes: v.optional(v.array(v.string())),
    tokenEndpointAuthMethod: v.optional(v.string()),
    scope: v.optional(v.string()),
    publicClient: v.optional(v.boolean()), // PKCE-only, no client_secret
  },
  handler: async (ctx, args) => {
    const redirectCheck = validateRedirectUris(args.redirectUris);
    if (!redirectCheck.ok) {
      throw new Error(redirectCheck.error);
    }
    const trimmedName = args.name.trim().slice(0, 80) || "Unnamed MCP Client";
    const grantTypes = args.grantTypes && args.grantTypes.length > 0
      ? args.grantTypes.filter((g) => g === "authorization_code" || g === "refresh_token")
      : ["authorization_code", "refresh_token"];
    if (!grantTypes.includes("authorization_code")) {
      throw new Error("authorization_code grant is required");
    }
    const isPublic = args.publicClient === true || args.tokenEndpointAuthMethod === "none";
    const tokenAuthMethod = isPublic ? "none" : "client_secret_basic";

    const clientId = generateClientId();
    let clientSecret: string | undefined;
    let clientSecretHash: string | undefined;
    let clientSecretPrefix: string | undefined;
    if (!isPublic) {
      clientSecret = generateClientSecret();
      clientSecretHash = hashToken(clientSecret);
      clientSecretPrefix = `${clientSecret.slice(0, 16)}...${clientSecret.slice(-4)}`;
    }

    const now = Date.now();
    await ctx.db.insert("mcpOAuthClients", {
      clientId,
      clientSecretHash,
      clientSecretPrefix,
      name: trimmedName,
      redirectUris: redirectCheck.uris,
      grantTypes,
      tokenEndpointAuthMethod: tokenAuthMethod,
      scope: normalizeScope(args.scope),
      registrationKind: "dynamic",
      createdAt: now,
      updatedAt: now,
    });

    return {
      client_id: clientId,
      client_secret: clientSecret,
      client_secret_expires_at: 0, // never expires (RFC 7591)
      client_id_issued_at: Math.floor(now / 1000),
      redirect_uris: redirectCheck.uris,
      grant_types: grantTypes,
      token_endpoint_auth_method: tokenAuthMethod,
      scope: normalizeScope(args.scope),
    };
  },
});

// ============================================
// DASHBOARD-ISSUED CONNECTORS (workspace-owned)
// ============================================
// Caller must already be authenticated via apiclaw_workspace_session cookie
// (validated upstream by the Next.js route handler before invoking this).

export const createDashboardConnector = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    redirectUris: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session) throw new Error("invalid_session");
    const workspace = await ctx.db.get(session.workspaceId);
    if (!workspace || workspace.status !== "active") throw new Error("workspace_inactive");

    const redirectCheck = validateRedirectUris(args.redirectUris);
    if (!redirectCheck.ok) throw new Error(redirectCheck.error);

    const trimmedName = args.name.trim().slice(0, 80) || "Untitled connector";
    const existing = await ctx.db
      .query("mcpOAuthClients")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();
    const active = existing.filter((c) => !c.revokedAt);
    if (active.length >= 10) {
      throw new Error("Limit reached: 10 active connectors per workspace. Revoke one first.");
    }

    const clientId = generateClientId();
    const clientSecret = generateClientSecret();
    const now = Date.now();
    await ctx.db.insert("mcpOAuthClients", {
      clientId,
      clientSecretHash: hashToken(clientSecret),
      clientSecretPrefix: `${clientSecret.slice(0, 16)}...${clientSecret.slice(-4)}`,
      workspaceId: session.workspaceId,
      name: trimmedName,
      redirectUris: redirectCheck.uris,
      grantTypes: ["authorization_code", "refresh_token"],
      tokenEndpointAuthMethod: "client_secret_basic",
      scope: DEFAULT_SCOPE,
      registrationKind: "dashboard",
      createdAt: now,
      updatedAt: now,
    });
    return {
      client_id: clientId,
      client_secret: clientSecret, // shown ONCE
      name: trimmedName,
      redirect_uris: redirectCheck.uris,
    };
  },
});

export const listConnectors = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session) return [];
    const rows = await ctx.db
      .query("mcpOAuthClients")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();
    return rows
      .filter((c) => !c.revokedAt)
      .map((c) => ({
        clientId: c.clientId,
        name: c.name,
        redirectUris: c.redirectUris,
        registrationKind: c.registrationKind,
        clientSecretPrefix: c.clientSecretPrefix ?? null,
        createdAt: c.createdAt,
        lastUsedAt: c.lastUsedAt ?? null,
      }));
  },
});

export const revokeConnector = mutation({
  args: { sessionToken: v.string(), clientId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session) throw new Error("invalid_session");
    const client = await ctx.db
      .query("mcpOAuthClients")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();
    if (!client || client.workspaceId !== session.workspaceId) throw new Error("not_found");

    await ctx.db.patch(client._id, { revokedAt: Date.now(), updatedAt: Date.now() });

    // Revoke all outstanding tokens for this client.
    const tokens = await ctx.db
      .query("mcpOAuthTokens")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    const now = Date.now();
    for (const t of tokens) {
      if (!t.revokedAt) await ctx.db.patch(t._id, { revokedAt: now });
    }
    return { ok: true };
  },
});

// ============================================
// AUTHORIZE FLOW (consent UI calls these from /oauth/authorize)
// ============================================

export const getClientForAuthorize = query({
  args: { clientId: v.string(), redirectUri: v.string() },
  handler: async (ctx, args) => {
    const client = await ctx.db
      .query("mcpOAuthClients")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();
    if (!client || client.revokedAt) return null;
    if (!client.redirectUris.includes(args.redirectUri)) return null;
    return {
      clientId: client.clientId,
      name: client.name,
      registrationKind: client.registrationKind,
      requiresSecret: client.tokenEndpointAuthMethod !== "none",
      scope: client.scope,
    };
  },
});

export const mintAuthCode = mutation({
  args: {
    sessionToken: v.string(),                  // Clerk-bridge session
    clientId: v.string(),
    redirectUri: v.string(),
    scope: v.string(),
    codeChallenge: v.string(),
    codeChallengeMethod: v.string(),           // "S256"
  },
  handler: async (ctx, args) => {
    if (args.codeChallengeMethod !== "S256") {
      throw new Error("only S256 PKCE is supported");
    }
    if (!args.codeChallenge || args.codeChallenge.length < 43 || args.codeChallenge.length > 128) {
      throw new Error("invalid code_challenge");
    }

    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session) throw new Error("invalid_session");
    const workspace = await ctx.db.get(session.workspaceId);
    if (!workspace || workspace.status !== "active") throw new Error("workspace_inactive");

    const client = await ctx.db
      .query("mcpOAuthClients")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();
    if (!client || client.revokedAt) throw new Error("invalid_client");
    if (!client.redirectUris.includes(args.redirectUri)) throw new Error("invalid_redirect_uri");

    // Bind dynamic clients to this workspace on first authorize (one-time).
    if (!client.workspaceId) {
      await ctx.db.patch(client._id, { workspaceId: session.workspaceId, updatedAt: Date.now() });
    } else if (client.workspaceId !== session.workspaceId) {
      // Once bound, stays bound. Different workspace must register a new client.
      throw new Error("client_bound_to_other_workspace");
    }

    const code = generateAuthCode();
    const now = Date.now();
    await ctx.db.insert("mcpOAuthAuthCodes", {
      code,
      clientId: client.clientId,
      workspaceId: session.workspaceId,
      redirectUri: args.redirectUri,
      scope: normalizeScope(args.scope) || client.scope || DEFAULT_SCOPE,
      codeChallenge: args.codeChallenge,
      codeChallengeMethod: args.codeChallengeMethod,
      expiresAt: now + AUTH_CODE_TTL_MS,
      createdAt: now,
    });
    return { code };
  },
});

// ============================================
// TOKEN EXCHANGE
// ============================================

export const exchangeAuthCode = mutation({
  args: {
    code: v.string(),
    clientId: v.string(),
    clientSecret: v.optional(v.string()),
    redirectUri: v.string(),
    codeVerifier: v.string(),
  },
  handler: async (ctx, args) => {
    const codeRow = await ctx.db
      .query("mcpOAuthAuthCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (!codeRow) throw new Error("invalid_grant");
    if (codeRow.consumedAt) throw new Error("invalid_grant");
    if (Date.now() > codeRow.expiresAt) throw new Error("invalid_grant");
    if (codeRow.clientId !== args.clientId) throw new Error("invalid_grant");
    if (codeRow.redirectUri !== args.redirectUri) throw new Error("invalid_grant");

    const client = await ctx.db
      .query("mcpOAuthClients")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();
    if (!client || client.revokedAt) throw new Error("invalid_client");

    // Authenticate the client.
    if (client.tokenEndpointAuthMethod === "client_secret_basic") {
      if (!args.clientSecret) throw new Error("invalid_client");
      if (!client.clientSecretHash || hashToken(args.clientSecret) !== client.clientSecretHash) {
        throw new Error("invalid_client");
      }
    }

    // Verify PKCE: BASE64URL(SHA256(code_verifier)) === codeChallenge.
    // Convex has Web Crypto (subtle) available via globalThis.crypto.subtle.
    const challenge = await sha256Base64Url(args.codeVerifier);
    if (challenge !== codeRow.codeChallenge) throw new Error("invalid_grant");

    // Single-use.
    await ctx.db.patch(codeRow._id, { consumedAt: Date.now() });

    return await issueTokenPair(ctx, {
      clientId: client.clientId,
      workspaceId: codeRow.workspaceId,
      scope: codeRow.scope,
    });
  },
});

export const exchangeRefreshToken = mutation({
  args: {
    refreshToken: v.string(),
    clientId: v.string(),
    clientSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const refreshHash = hashToken(args.refreshToken);
    const row = await ctx.db
      .query("mcpOAuthTokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", refreshHash))
      .first();
    if (!row || row.kind !== "refresh" || row.revokedAt || Date.now() > row.expiresAt) {
      throw new Error("invalid_grant");
    }
    if (row.clientId !== args.clientId) throw new Error("invalid_grant");

    const client = await ctx.db
      .query("mcpOAuthClients")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .first();
    if (!client || client.revokedAt) throw new Error("invalid_client");
    if (client.tokenEndpointAuthMethod === "client_secret_basic") {
      if (!args.clientSecret) throw new Error("invalid_client");
      if (!client.clientSecretHash || hashToken(args.clientSecret) !== client.clientSecretHash) {
        throw new Error("invalid_client");
      }
    }

    // Rotate: revoke the old refresh, issue a fresh pair.
    await ctx.db.patch(row._id, { revokedAt: Date.now() });

    return await issueTokenPair(ctx, {
      clientId: client.clientId,
      workspaceId: row.workspaceId,
      scope: row.scope,
    });
  },
});

async function issueTokenPair(
  ctx: any,
  input: { clientId: string; workspaceId: Id<"workspaces">; scope: string }
): Promise<{
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
}> {
  const access = generateAccessToken();
  const refresh = generateRefreshToken();
  const now = Date.now();
  const accessId = await ctx.db.insert("mcpOAuthTokens", {
    tokenHash: hashToken(access),
    tokenPrefix: tokenPrefix(access),
    kind: "access",
    clientId: input.clientId,
    workspaceId: input.workspaceId,
    scope: input.scope,
    expiresAt: now + ACCESS_TOKEN_TTL_MS,
    createdAt: now,
  });
  await ctx.db.insert("mcpOAuthTokens", {
    tokenHash: hashToken(refresh),
    tokenPrefix: tokenPrefix(refresh),
    kind: "refresh",
    clientId: input.clientId,
    workspaceId: input.workspaceId,
    scope: input.scope,
    parentTokenId: accessId,
    expiresAt: now + REFRESH_TOKEN_TTL_MS,
    createdAt: now,
  });
  // Touch client lastUsedAt
  const client = await ctx.db
    .query("mcpOAuthClients")
    .withIndex("by_clientId", (q: any) => q.eq("clientId", input.clientId))
    .first();
  if (client) await ctx.db.patch(client._id, { lastUsedAt: now });

  return {
    access_token: access,
    refresh_token: refresh,
    token_type: "Bearer",
    expires_in: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
    scope: input.scope,
  };
}

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await globalThis.crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  // btoa is available in Convex's V8 runtime.
  const b64 = (globalThis as any).btoa
    ? (globalThis as any).btoa(bin)
    : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ============================================
// TOKEN VALIDATION (called from /mcp on every request)
// ============================================

export const resolveBearerToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("mcpOAuthTokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", hashToken(args.token)))
      .first();
    if (!row) return { ok: false as const, reason: "token_not_found" };
    if (row.kind !== "access") return { ok: false as const, reason: "wrong_token_kind" };
    if (row.revokedAt) return { ok: false as const, reason: "token_revoked" };
    if (Date.now() > row.expiresAt) return { ok: false as const, reason: "token_expired" };

    const workspace = await ctx.db.get(row.workspaceId);
    if (!workspace) return { ok: false as const, reason: "workspace_missing" };
    if (workspace.status !== "active") return { ok: false as const, reason: "workspace_inactive" };

    return {
      ok: true as const,
      tokenId: row._id,
      workspaceId: row.workspaceId,
      clientId: row.clientId,
      scope: row.scope,
      email: workspace.email,
      tier: workspace.tier,
      usageCount: workspace.usageCount,
      usageLimit: workspace.usageLimit,
    };
  },
});

export const touchToken = mutation({
  args: { tokenId: v.id("mcpOAuthTokens") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tokenId, { lastUsedAt: Date.now() });
  },
});

export const revokeToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("mcpOAuthTokens")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", hashToken(args.token)))
      .first();
    if (row && !row.revokedAt) {
      await ctx.db.patch(row._id, { revokedAt: Date.now() });
    }
    return { ok: true };
  },
});

// ============================================
// TOOL-CALL ANALYTICS
// ============================================
// Fire-and-forget logger called by /mcp on every tools/call. Uses the
// generic analytics table so existing dashboards pick this up without
// schema changes.

export const logToolCall = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    clientId: v.string(),
    tool: v.string(),
    durationMs: v.number(),
    success: v.boolean(),
    errorCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("analytics", {
      event: "mcp_tool_call",
      provider: undefined,
      identifier: args.clientId,
      workspaceId: args.workspaceId,
      metadata: {
        tool: args.tool,
        durationMs: args.durationMs,
        success: args.success,
        errorCode: args.errorCode ?? null,
      },
      timestamp: Date.now(),
    });
  },
});

// ============================================
// CLEANUP CRON (called from convex/crons.ts)
// ============================================
// Deletes expired access codes + revoked-or-expired tokens older than
// 30 days. Keeps the table light without losing audit history for active
// workspaces.

export const sweepExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    let codesDeleted = 0;
    const codes = await ctx.db.query("mcpOAuthAuthCodes").collect();
    for (const c of codes) {
      if (c.expiresAt < now || (c.consumedAt && c.consumedAt < thirtyDaysAgo)) {
        await ctx.db.delete(c._id);
        codesDeleted++;
      }
    }

    let tokensDeleted = 0;
    const tokens = await ctx.db.query("mcpOAuthTokens").collect();
    for (const t of tokens) {
      const expired = t.expiresAt < now;
      const longRevoked = t.revokedAt && t.revokedAt < thirtyDaysAgo;
      if ((expired && t.expiresAt < thirtyDaysAgo) || longRevoked) {
        await ctx.db.delete(t._id);
        tokensDeleted++;
      }
    }

    return { codesDeleted, tokensDeleted };
  },
});
