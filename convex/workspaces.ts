import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { FREE_LIFETIME_LIMIT, getQuotaState } from "./quota";
import { recordWorkspaceAuthenticated } from "./funnel";
import { hasActivePaygEntitlement } from "./managedUsagePolicy";
import { resolveAgentDisplayName } from "./agentDisplay";
import {
  FREE_MANAGED_PROVIDER_COST_CAP_USD,
} from "../src/product-truth";
import {
  BROWSER_SESSION_TTL_MS,
  canMintBrowserSession,
  findAgentSessionByToken,
  findUsableAgentSession,
  isBrowserSession,
  isSessionExpired,
  isSessionUsable,
  shouldDeleteBrowserSession,
} from "./sessionSecurity";

// Server-to-server guard for privileged workspace mutations (admin / Hivr / Clerk-bridge).
// Callers must pass the shared APICLAW_INTERNAL_SECRET; blocks anonymous Convex API access.
function requireAdminSecret(internalSecret: string | undefined) {
  const expected = process.env.APICLAW_INTERNAL_SECRET;
  if (!expected || internalSecret !== expected) {
    throw new Error("unauthorized: admin secret required");
  }
}

// ============================================
// OTP AUTH FOR WORKSPACES (terminal-native)
// ============================================

function generateOTP(): string {
  const digits = "0123456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => digits[b % digits.length]).join("");
}

// Legacy OTP primitives are internal only. Canonical auth is Clerk browser auth.
export const createOTP = internalMutation({
  args: {
    email: v.string(),
    fingerprint: v.optional(v.string()),
  },
  handler: async (ctx, { email, fingerprint }) => {
    const normalizedEmail = email.toLowerCase().trim();

    // Invalidate any existing unused OTPs for this email
    const existing = await ctx.db
      .query("otpCodes")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .collect();
    for (const otp of existing) {
      if (!otp.usedAt && otp.expiresAt > Date.now()) {
        await ctx.db.patch(otp._id, { expiresAt: 0 }); // expire it
      }
    }

    const code = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    await ctx.db.insert("otpCodes", {
      email: normalizedEmail,
      code,
      fingerprint,
      expiresAt,
      usedAt: undefined,
      attempts: 0,
      createdAt: Date.now(),
    });

    return { code, expiresAt };
  },
});

// Verify OTP code, create/activate workspace, return session
export const verifyOTP = internalMutation({
  args: {
    email: v.string(),
    code: v.string(),
    fingerprint: v.optional(v.string()),
  },
  handler: async (ctx, { email, code, fingerprint }) => {
    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await ctx.db
      .query("otpCodes")
      .withIndex("by_email_code", (q) =>
        q.eq("email", normalizedEmail).eq("code", code)
      )
      .first();

    if (!otpRecord) {
      return { success: false, error: "invalid_code", message: "Invalid verification code." };
    }

    if (otpRecord.usedAt) {
      return { success: false, error: "code_used", message: "Code already used." };
    }

    if (otpRecord.expiresAt < Date.now()) {
      return { success: false, error: "code_expired", message: "Code expired. Run register_owner again to get a new code." };
    }

    if (otpRecord.attempts >= 5) {
      return { success: false, error: "too_many_attempts", message: "Too many failed attempts. Run register_owner again." };
    }

    // Mark OTP as used
    await ctx.db.patch(otpRecord._id, { usedAt: Date.now() });

    // Find or create workspace
    let workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    let isNewUser = false;
    if (!workspace) {
      isNewUser = true;
      // Generate referral code
      let referralCode: string;
      let attempts = 0;
      do {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        const bytes = new Uint8Array(6);
        crypto.getRandomValues(bytes);
        const rc = Array.from(bytes, (b) => chars[b % chars.length]).join("");
        referralCode = `CLAW-${rc}`;
        const existingRef = await ctx.db
          .query("workspaces")
          .withIndex("by_referralCode", (q) => q.eq("referralCode", referralCode))
          .first();
        if (!existingRef) break;
        attempts++;
      } while (attempts < 10);

      const workspaceId = await ctx.db.insert("workspaces", {
        email: normalizedEmail,
        status: "active",
        tier: "free",
        usageCount: 0,
        usageLimit: FREE_LIFETIME_LIMIT,
        managedUsageCount: 0,
        activationProviderCostMicros: 0,
        weeklyUsageCount: 0,
        weeklyUsageLimit: FREE_LIFETIME_LIMIT,
        lastWeeklyResetAt: Date.now(),
        hourlyUsageCount: 0,
        lastHourlyResetAt: Date.now(),
        referralCode: referralCode!,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      workspace = await ctx.db.get(workspaceId);
    } else if (workspace.status === "pending") {
      // Activate pending workspace
      await ctx.db.patch(workspace._id, { status: "active" });
      workspace = await ctx.db.get(workspace._id);
    }

    if (!workspace) {
      return { success: false, error: "workspace_error", message: "Failed to create workspace." };
    }

    // Create agent session
    const sessionToken = generateToken();
    await ctx.db.insert("agentSessions", {
      workspaceId: workspace._id,
      sessionToken,
      sessionKind: "owner",
      fingerprint: fingerprint || "unknown",
      lastUsedAt: Date.now(),
      createdAt: Date.now(),
    });

    try {
      await recordWorkspaceAuthenticated(ctx, {
        workspaceId: workspace._id,
        email: workspace.email,
        authMethod: "otp",
        fingerprint,
        isNew: isNewUser,
        tier: workspace.tier,
      });
    } catch {
      // Never block authentication on telemetry.
    }

    return {
      success: true,
      isNewUser,
      sessionToken,
      workspace: {
        id: workspace._id,
        email: workspace.email,
        tier: workspace.tier,
        status: "active",
        usageCount: workspace.usageCount,
        usageLimit: workspace.usageLimit,
      },
    };
  },
});

// Increment failed OTP attempt counter
export const incrementOTPAttempt = internalMutation({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (ctx, { email, code }) => {
    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await ctx.db
      .query("otpCodes")
      .withIndex("by_email_code", (q) =>
        q.eq("email", normalizedEmail).eq("code", code)
      )
      .first();
    if (otpRecord && !otpRecord.usedAt) {
      await ctx.db.patch(otpRecord._id, { attempts: otpRecord.attempts + 1 });
    }
  },
});

// ============================================
// MAGIC LINK AUTH FOR WORKSPACES
// ============================================

// Create magic link for workspace email auth
export const createMagicLink = internalMutation({
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

// Generate a unique referral code (CLAW-XXXXXX format)
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const code = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  return `CLAW-${code}`;
}

// Verify magic link and create workspace + session
export const verifyMagicLink = mutation({
  args: { 
    token: v.string(),
    fingerprint: v.optional(v.string()),
    referralCode: v.optional(v.string()), // Referral code from signup URL
  },
  handler: async (ctx, { token, fingerprint, referralCode }) => {
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

    let isNewUser = false;
    if (!workspace) {
      isNewUser = true;

      // Generate unique referral code for new user
      let newReferralCode: string;
      let attempts = 0;
      do {
        newReferralCode = generateReferralCode();
        const existing = await ctx.db
          .query("workspaces")
          .withIndex("by_referralCode", (q) => q.eq("referralCode", newReferralCode))
          .first();
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      // Create new workspace with free tier + referral code
      const workspaceId = await ctx.db.insert("workspaces", {
        email: magicLink.email,
        status: "active",
        tier: "free",
        usageCount: 0,
        usageLimit: FREE_LIFETIME_LIMIT,
        managedUsageCount: 0,
        activationProviderCostMicros: 0,
        weeklyUsageCount: 0,
        weeklyUsageLimit: FREE_LIFETIME_LIMIT, // Legacy compatibility only; never resets allowance.
        hourlyUsageCount: 0,
        referralCode: newReferralCode!,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      workspace = await ctx.db.get(workspaceId);
    }

    // REFERRAL DISABLED (2026-03-01): Risk of abuse with awesome-list exposure
    // Tracking referredBy for analytics only, no credit bonus
    if (isNewUser && referralCode) {
      const referrer = await ctx.db
        .query("workspaces")
        .withIndex("by_referralCode", (q) => q.eq("referralCode", referralCode))
        .first();

      if (referrer && referrer._id !== workspace!._id) {
        // Track referral for analytics only
        await ctx.db.patch(workspace!._id, {
          referredBy: referrer._id,
          updatedAt: Date.now(),
        });
        // No credit bonus - referral rewards disabled
      }
    }

    // Reuse existing session for same machine (fix: no more duplicate sessions per login)
    const sessionToken = generateToken();
    const userFingerprint2 = fingerprint || magicLink.sessionFingerprint;

    const existingSession = userFingerprint2
      ? await ctx.db
          .query("agentSessions")
          .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace!._id))
          .filter((q) => q.eq(q.field("fingerprint"), userFingerprint2))
          .first()
      : null;

    if (existingSession) {
      // Refresh existing session instead of creating duplicate
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
        workspaceId: workspace!._id,
        sessionToken,
        sessionKind: "owner",
        fingerprint: userFingerprint2 || undefined,
        lastUsedAt: Date.now(),
        createdAt: Date.now(),
      });
    }

    try {
      await recordWorkspaceAuthenticated(ctx, {
        workspaceId: workspace!._id,
        email: workspace!.email,
        authMethod: "legacy_magic_link",
        fingerprint: userFingerprint2,
        isNew: isNewUser,
        tier: workspace!.tier,
      });
    } catch {
      // Never block authentication on telemetry.
    }

    // Link agent record to workspace (if agent exists for this fingerprint)
    if (userFingerprint2) {
      const agentForFingerprint = await ctx.db
        .query("agents")
        .filter((q) => q.eq(q.field("fingerprint"), userFingerprint2))
        .first();

      if (agentForFingerprint && !agentForFingerprint.workspaceId) {
        await ctx.db.patch(agentForFingerprint._id, {
          workspaceId: workspace!._id,
        });
      }
    }

    // Claim anonymous usage history
    const userFingerprint = fingerprint || magicLink.sessionFingerprint;
    if (userFingerprint) {
      try {
        // Find all analytics records with matching fingerprint and no workspaceId
        const analyticsRecords = await ctx.db
          .query("analytics")
          .withIndex("by_identifier", (q) => q.eq("identifier", userFingerprint))
          .collect();

        // Filter to only unclaimed records
        const unclaimedRecords = analyticsRecords.filter((r) => !r.workspaceId);

        // Update each record to link it to the workspace
        for (const record of unclaimedRecords) {
          await ctx.db.patch(record._id, { workspaceId: workspace!._id });
        }
      } catch (err) {
        // Non-critical error, just log it
        console.error('Failed to claim anonymous usage:', err);
      }
    }

    // Notify Inbound Net (ALERTS) — async, non-blocking
    await ctx.scheduler.runAfter(0, internal.inbound.notifySignup, {
      email: workspace!.email,
      workspaceId: workspace!._id,
      tier: workspace!.tier,
      isNewUser,
      timestamp: Date.now(),
    });

    return {
      success: true,
      sessionToken,
      workspace: {
        id: workspace!._id,
        email: workspace!.email,
        tier: workspace!.tier,
        referralCode: workspace!.referralCode,
      },
    };
  },
});

// Delete a browser child only when the scheduled job still refers to the
// exact token it was created for. The expected-token check makes cleanup safe
// if a future implementation rotates a token in place.
export const deleteBrowserSessionIfTokenMatches = internalMutation({
  args: {
    sessionId: v.id("agentSessions"),
    expectedToken: v.string(),
  },
  handler: async (ctx, { sessionId, expectedToken }) => {
    const session = await ctx.db.get(sessionId);
    const now = Date.now();
    if (
      session &&
      isBrowserSession(session) &&
      session.sessionToken === expectedToken &&
      session.expiresAt !== undefined &&
      session.expiresAt > now
    ) {
      // Defensive against clock skew or an unexpectedly early scheduler run.
      await ctx.scheduler.runAt(
        session.expiresAt,
        internal.workspaces.deleteBrowserSessionIfTokenMatches,
        { sessionId, expectedToken },
      );
      return { deleted: false, rescheduled: true };
    }
    if (!shouldDeleteBrowserSession(session, expectedToken)) {
      return { deleted: false };
    }

    await ctx.db.delete(sessionId);
    return { deleted: true };
  },
});

// Exchange a durable owner session for a short-lived browser-only child. The
// owner bearer remains server-side in the HttpOnly cookie. Each bootstrap and
// refresh mints a new child, while the prior child remains valid only until
// its own scheduled expiry to avoid a refresh race in the open page.
export const mintBrowserSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const now = Date.now();
    const parent = await findUsableAgentSession(ctx.db, token, { audience: "durable", now });

    if (!parent || !canMintBrowserSession(parent, now)) {
      return { success: false as const, error: "invalid_owner_session" };
    }

    const workspace = await ctx.db.get(parent.workspaceId);
    if (!workspace || workspace.status !== "active") {
      return { success: false as const, error: "workspace_inactive" };
    }

    const browserToken = `apiclaw_browser_${generateToken()}`;
    const expiresAt = now + BROWSER_SESSION_TTL_MS;
    const sessionId = await ctx.db.insert("agentSessions", {
      workspaceId: parent.workspaceId,
      sessionToken: browserToken,
      sessionKind: "browser",
      parentSessionId: parent._id,
      expiresAt,
      lastUsedAt: now,
      createdAt: now,
    });

    await ctx.scheduler.runAt(
      expiresAt,
      internal.workspaces.deleteBrowserSessionIfTokenMatches,
      { sessionId, expectedToken: browserToken },
    );

    const usage = getWorkspaceUsageDisplay(workspace);
    return {
      success: true as const,
      browserToken,
      expiresAt,
      session: {
        workspaceId: workspace._id,
        email: workspace.email,
        tier: workspace.tier,
        status: workspace.status,
        usageCount: usage.usageCount,
        usageLimit: usage.usageLimit,
      },
    };
  },
});

// Get session from token
export const getSession = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await findUsableAgentSession(ctx.db, token);

    if (!isSessionUsable(session)) {
      return null;
    }

    const workspace = await ctx.db.get(session.workspaceId);
    if (!workspace) return null;

    const usage = getWorkspaceUsageDisplay(workspace);

    return {
      workspaceId: workspace._id,
      email: workspace.email,
      tier: workspace.tier,
      status: workspace.status,
      usageCount: usage.usageCount,
      usageLimit: usage.usageLimit,
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
    const session = await findUsableAgentSession(ctx.db, token);

    if (!isSessionUsable(session)) {
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

    // Count agents: 1 main agent (if exists) + subagents
    const hasMainAgent = workspace.mainAgentId ? 1 : 0;
    const subagents = await ctx.db
      .query("subagents")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();
    
    const totalAgentCount = hasMainAgent + subagents.length;

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

    // Customer-facing quota display uses the same lifetime state as the
    // atomic managed-call authorization gate.
    const usage = getWorkspaceUsageDisplay(workspace);

    // Budget status (PRD 2.6)
    const monthStart = getMonthStartForBudget();
    let currentSpend = workspace.monthlySpendCents || 0;
    if (!workspace.lastSpendResetAt || workspace.lastSpendResetAt < monthStart) {
      currentSpend = 0;
    }
    const budgetCap = workspace.budgetCap || null;

    return {
      workspace: {
        id: workspace._id,
        email: workspace.email,
        workspaceName: workspace.workspaceName,
        tier: workspace.tier,
        status: workspace.status,
        usageCount: usage.usageCount,
        usageLimit: usage.usageLimit,
        usageRemaining: usage.usageRemaining,
        usagePercentage: usage.usagePercentage,
        stripeCustomerId: workspace.stripeCustomerId,
        stripeSubscriptionStatus: workspace.stripeSubscriptionStatus,
        paygActive: hasActivePaygEntitlement(workspace),
        createdAt: workspace.createdAt,
        mainAgentName: workspace.mainAgentName,
        mainAgentId: workspace.mainAgentId,
      },
      stats: {
        totalAgents: totalAgentCount,
        totalCredits: workspaceCredits.reduce((sum, c) => sum + c.balanceUsd, 0),
        totalPurchases: workspacePurchases.length,
      },
      budget: {
        budgetCapCents: budgetCap,
        budgetCapUsd: budgetCap ? budgetCap / 100 : null,
        currentSpendCents: currentSpend,
        currentSpendUsd: currentSpend / 100,
        remainingCents: budgetCap ? Math.max(0, budgetCap - currentSpend) : null,
        remainingUsd: budgetCap ? Math.max(0, (budgetCap - currentSpend) / 100) : null,
        budgetPercentage: budgetCap ? Math.min(100, (currentSpend / budgetCap) * 100) : null,
        pauseOnBudgetExceeded: workspace.pauseOnBudgetExceeded || false,
        isOverBudget: budgetCap ? currentSpend >= budgetCap : false,
        isNearBudget: budgetCap ? currentSpend >= budgetCap * 0.8 : false,
      },
    };
  },
});

// Helper for budget month start
function getMonthStartForBudget(): number {
  const now = new Date();
  return new Date(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0).getTime();
}

// Get connected agents for workspace
export const getConnectedAgents = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await findUsableAgentSession(ctx.db, token);

    if (!isSessionUsable(session)) {
      return [];
    }

    const agentSessions = await ctx.db
      .query("agentSessions")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();

    // Best-effort join to the agents table (by fingerprint, within this
    // workspace) so callers can see the per-agent default model alongside
    // the login session. A session's fingerprint may match zero or more
    // agents rows (mcpClient not tracked on agentSessions); first match wins.
    const workspaceAgents = await ctx.db
      .query("agents")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();

    return agentSessions.filter((s) => !isBrowserSession(s)).map((s) => {
      const matchedAgent = s.fingerprint
        ? workspaceAgents.find((a) => a.fingerprint === s.fingerprint)
        : undefined;
      // Two independent places a user rename can live: the session's own
      // customName (set via workspaces:renameAgent) and the matched
      // agents row's name when nameSetByUser is true (set via
      // agents:renameAgent). Either one is a real user choice and wins
      // over the prettified mcpClient label.
      const userSetName = s.customName || (matchedAgent?.nameSetByUser ? matchedAgent.name : null);
      const displayName = resolveAgentDisplayName({
        userSetName,
        mcpClient: matchedAgent?.mcpClient,
        fallbackName: matchedAgent?.name || s.fingerprint,
      });
      return {
        id: s._id,
        fingerprint: s.fingerprint || "Unknown",
        customName: s.customName || null,
        name: displayName,
        displayName,
        lastUsedAt: s.lastUsedAt,
        createdAt: s.createdAt,
        isCurrent: s.sessionToken === token,
        agentId: matchedAgent?._id ?? null,
        defaultModel: matchedAgent?.defaultModel ?? null,
      };
    });
  },
});

// Admin: Delete session by ID (for cleanup)
export const adminDeleteSession = internalMutation({
  args: { sessionId: v.id("agentSessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (session && !isBrowserSession(session)) {
      const childSessions = await ctx.db
        .query("agentSessions")
        .withIndex("by_parentSessionId", (q) => q.eq("parentSessionId", sessionId))
        .collect();
      for (const child of childSessions) {
        await ctx.db.delete(child._id);
      }
    }
    await ctx.db.delete(sessionId);
    return { success: true };
  },
});

// Debug: Get sessions by workspace email
export const getSessionsByEmail = internalQuery({
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
      sessions: sessions.filter((s) => !isBrowserSession(s)).map(s => ({
        id: s._id,
        fingerprint: s.fingerprint,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
      })),
    };
  },
});

// Rename an agent session
export const renameAgent = mutation({
  args: {
    token: v.string(),
    sessionId: v.id("agentSessions"),
    name: v.string(),
  },
  handler: async (ctx, { token, sessionId, name }) => {
    // Verify the requesting session
    const session = await findUsableAgentSession(ctx.db, token);

    if (!isSessionUsable(session)) {
      throw new Error("Invalid session");
    }

    // Get the session to rename
    const targetSession = await ctx.db.get(sessionId);
    if (
      !targetSession ||
      isBrowserSession(targetSession) ||
      targetSession.workspaceId !== session.workspaceId
    ) {
      throw new Error("Session not found or access denied");
    }

    // Update the name (stored as customName field)
    await ctx.db.patch(sessionId, { customName: name });

    return { success: true };
  },
});

// Get usage breakdown by provider
export const getUsageBreakdown = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await findUsableAgentSession(ctx.db, token);

    if (!isSessionUsable(session)) {
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
    const session = await findUsableAgentSession(ctx.db, token);

    if (!isSessionUsable(session)) {
      throw new Error("Unauthorized");
    }

    // Get the session to revoke
    const targetSession = await ctx.db.get(sessionId);
    if (!targetSession || isBrowserSession(targetSession)) {
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

    const childSessions = await ctx.db
      .query("agentSessions")
      .withIndex("by_parentSessionId", (q) => q.eq("parentSessionId", targetSession._id))
      .collect();
    for (const child of childSessions) {
      await ctx.db.delete(child._id);
    }

    // Delete the durable session after its browser children.
    await ctx.db.delete(sessionId);

    return { success: true };
  },
});

// Logout (delete current session)
export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await findAgentSessionByToken(ctx.db, token);

    if (session) {
      if (!isBrowserSession(session)) {
        const childSessions = await ctx.db
          .query("agentSessions")
          .withIndex("by_parentSessionId", (q) => q.eq("parentSessionId", session._id))
          .collect();
        for (const child of childSessions) {
          await ctx.db.delete(child._id);
        }
      }
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
    internalSecret: v.string(),
  },
  handler: async (ctx, { workspaceId, tier, usageLimit, stripeCustomerId, internalSecret }) => {
    requireAdminSecret(internalSecret);
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

// Verify session token (for HTTP API)
export const verifySession = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const session = await findUsableAgentSession(ctx.db, sessionToken);

    if (!isSessionUsable(session)) {
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
export const getByEmail = internalQuery({
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
    const session = await findUsableAgentSession(ctx.db, sessionToken, { audience: "durable" });

    if (isSessionUsable(session)) {
      await ctx.db.patch(session._id, { lastUsedAt: Date.now() });
    }
  },
});

// ============================================
// MCP WORKSPACE FUNCTIONS
// ============================================

// Create a new workspace (called from MCP register_owner)
export const createWorkspace = internalMutation({
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
      usageLimit: FREE_LIFETIME_LIMIT,
      managedUsageCount: 0,
      activationProviderCostMicros: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { success: true, workspaceId };
  },
});

// Update workspace name
export const updateWorkspaceName = mutation({
  args: {
    token: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { token, name }) => {
    const session = await findUsableAgentSession(ctx.db, token);
    if (!isSessionUsable(session)) throw new Error("Invalid session");

    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 100) {
      throw new Error("Name must be between 1 and 100 characters");
    }

    await ctx.db.patch(session.workspaceId, {
      workspaceName: trimmed,
      updatedAt: Date.now(),
    });

    return { success: true, name: trimmed };
  },
});

// Create agent session for workspace (called from MCP after verification)
export const createAgentSession = internalMutation({
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
      sessionKind: "owner",
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
  const bytes = new Uint8Array(48);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

// Get workspace status (for MCP check_workspace_status tool)
export const getWorkspaceStatus = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await findUsableAgentSession(ctx.db, args.sessionToken, { audience: "durable" });
    
    if (!isSessionUsable(session)) {
      return { authenticated: false };
    }
    
    const workspace = await ctx.db.get(session.workspaceId);
    if (!workspace) {
      return { authenticated: false };
    }
    
    const usage = getWorkspaceUsageDisplay(workspace);
    
    return {
      authenticated: true,
      email: workspace.email,
      status: workspace.status,
      tier: workspace.tier,
      usageCount: usage.usageCount,
      usageLimit: usage.usageLimit,
      usageRemaining: usage.usageRemaining,
      managedUsageCount: workspace.managedUsageCount ?? workspace.usageCount ?? 0,
      managedUsageLimit: usage.usageLimit,
      activationProviderCostUsd: (workspace.activationProviderCostMicros ?? 0) / 1_000_000,
      activationProviderCostCapUsd: FREE_MANAGED_PROVIDER_COST_CAP_USD,
      paygActive: hasActivePaygEntitlement(workspace),
      hasStripe: !!workspace.stripeCustomerId,
      createdAt: workspace.createdAt,
    };
  },
});

// Admin functions for Hivr integration
export const adminActivateWorkspace = internalMutation({
  args: { workspaceId: v.id("workspaces"), internalSecret: v.string() },
  handler: async (ctx, { workspaceId, internalSecret }) => {
    requireAdminSecret(internalSecret);
    const workspace = await ctx.db.get(workspaceId);
    if (!workspace) {
      return { success: false, error: "not_found" };
    }
    
    await ctx.db.patch(workspaceId, {
      status: "active",
      tier: "pro",
      weeklyUsageLimit: 999999,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

export const adminCreateSession = internalMutation({
  args: { workspaceId: v.id("workspaces"), internalSecret: v.string() },
  handler: async (ctx, { workspaceId, internalSecret }) => {
    requireAdminSecret(internalSecret);
    const workspace = await ctx.db.get(workspaceId);
    if (!workspace || workspace.status !== "active") {
      return { success: false, error: "workspace_not_active" };
    }
    
    const sessionToken = "apiclaw_" + generateToken();
    
    await ctx.db.insert("agentSessions", {
      workspaceId,
      sessionToken,
      sessionKind: "owner",
      fingerprint: "hivr-bees",
      lastUsedAt: Date.now(),
      createdAt: Date.now(),
    });
    
    return { success: true, sessionToken };
  },
});

// TEMP: Admin query to debug workspace data
export const adminGetFullWorkspace = internalQuery({
  args: { email: v.string(), internalSecret: v.string() },
  handler: async (ctx, { email, internalSecret }) => {
    requireAdminSecret(internalSecret);
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (!workspace) {
      return null;
    }

    return {
      _id: workspace._id,
      email: workspace.email,
      status: workspace.status,
      tier: workspace.tier,
      mainAgentId: workspace.mainAgentId || null,
      mainAgentName: workspace.mainAgentName || null,
      aiBackend: workspace.aiBackend || null,
      usageCount: workspace.usageCount,
      usageLimit: workspace.usageLimit,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  },
});

/**
 * Claim anonymous usage history when a user registers
 * Links all analytics records with matching fingerprint to the workspace
 */
export const claimAnonymousUsage = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    machineFingerprint: v.string(),
  },
  handler: async (ctx, { workspaceId, machineFingerprint }) => {
    // Verify workspace exists
    const workspace = await ctx.db.get(workspaceId);
    if (!workspace) {
      return { success: false, error: "Workspace not found" };
    }

    // Find all analytics records with matching fingerprint and no workspaceId
    const analyticsRecords = await ctx.db
      .query("analytics")
      .withIndex("by_identifier", (q) => q.eq("identifier", machineFingerprint))
      .collect();

    // Filter to only unclaimed records
    const unclaimedRecords = analyticsRecords.filter((r) => !r.workspaceId);

    // Update each record to link it to the workspace
    let claimedCount = 0;
    for (const record of unclaimedRecords) {
      await ctx.db.patch(record._id, { workspaceId });
      claimedCount++;
    }

    return {
      success: true,
      claimedCount,
      message: `Claimed ${claimedCount} anonymous usage records`,
    };
  },
});

export const adminUpdateEmail = internalMutation({
  args: { workspaceId: v.id("workspaces"), newEmail: v.string(), internalSecret: v.string() },
  handler: async (ctx, { workspaceId, newEmail, internalSecret }) => {
    requireAdminSecret(internalSecret);
    await ctx.db.patch(workspaceId, { email: newEmail });
    return { success: true, email: newEmail };
  },
});

export const adminSetTier = internalMutation({
  args: { workspaceId: v.id("workspaces"), tier: v.string(), internalSecret: v.string() },
  handler: async (ctx, { workspaceId, tier, internalSecret }) => {
    requireAdminSecret(internalSecret);
    await ctx.db.patch(workspaceId, { tier, updatedAt: Date.now() });
    return { success: true, tier };
  },
});

// ============================================
// CLERK BRIDGE — get-or-create workspace from Clerk identity
// Mirrors verifyMagicLink session behavior so middleware/CLI/MCP keep working.
// ============================================

export const getOrCreateForClerk = mutation({
  args: {
    email: v.string(),
    clerkUserId: v.string(),
    fingerprint: v.optional(v.string()),
    internalSecret: v.string(),
  },
  handler: async (ctx, { email, clerkUserId, fingerprint, internalSecret }) => {
    requireAdminSecret(internalSecret);
    const normalizedEmail = email.toLowerCase().trim();

    let workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    let isNewUser = false;
    if (!workspace) {
      isNewUser = true;

      let newReferralCode: string;
      let attempts = 0;
      do {
        newReferralCode = generateReferralCode();
        const existing = await ctx.db
          .query("workspaces")
          .withIndex("by_referralCode", (q) => q.eq("referralCode", newReferralCode))
          .first();
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      const workspaceId = await ctx.db.insert("workspaces", {
        email: normalizedEmail,
        status: "active",
        tier: "free",
        usageCount: 0,
        usageLimit: FREE_LIFETIME_LIMIT,
        managedUsageCount: 0,
        activationProviderCostMicros: 0,
        weeklyUsageCount: 0,
        weeklyUsageLimit: FREE_LIFETIME_LIMIT,
        hourlyUsageCount: 0,
        referralCode: newReferralCode!,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      workspace = await ctx.db.get(workspaceId);
    }

    if (!workspace) {
      return { success: false, error: "workspace_error" };
    }

    const sessionToken = generateToken();
    const sessionFingerprint = fingerprint?.trim() || `clerk:${clerkUserId}`;
    const matchingOwnerSessions = (await ctx.db
      .query("agentSessions")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace!._id))
      .collect())
      .filter((session) =>
        !isBrowserSession(session) && session.fingerprint === sessionFingerprint
      )
      .sort((a, b) => a.createdAt - b.createdAt);
    const [existingSession, ...duplicateOwnerSessions] = matchingOwnerSessions;

    if (existingSession) {
      for (const ownerSession of matchingOwnerSessions) {
        const browserChildren = await ctx.db
          .query("agentSessions")
          .withIndex("by_parentSessionId", (q) => q.eq("parentSessionId", ownerSession._id))
          .collect();
        for (const child of browserChildren) {
          await ctx.db.delete(child._id);
        }
      }
      for (const duplicate of duplicateOwnerSessions) {
        await ctx.db.delete(duplicate._id);
      }
      await ctx.db.patch(existingSession._id, {
        sessionToken,
        sessionKind: "owner",
        parentSessionId: undefined,
        expiresAt: undefined,
        fingerprint: sessionFingerprint,
        lastUsedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("agentSessions", {
        workspaceId: workspace._id,
        sessionToken,
        sessionKind: "owner",
        fingerprint: sessionFingerprint,
        lastUsedAt: Date.now(),
        createdAt: Date.now(),
      });
    }

    try {
      await recordWorkspaceAuthenticated(ctx, {
        workspaceId: workspace._id,
        email: workspace.email,
        authMethod: "clerk_web",
        fingerprint: sessionFingerprint,
        isNew: isNewUser,
        tier: workspace.tier,
      });
    } catch {
      // Never block authentication on telemetry.
    }

    if (isNewUser) {
      await ctx.scheduler.runAfter(0, internal.inbound.notifySignup, {
        email: workspace.email,
        workspaceId: workspace._id,
        tier: workspace.tier,
        isNewUser: true,
        timestamp: Date.now(),
      });
    }

    // Activation is a successful POST /v1/execute, not the Clerk session.
    // Schedule once; claimFirstExecute is idempotent per workspace so an
    // old npx that never calls completeFirstExecute still lands one 200.
    try {
      await ctx.scheduler.runAfter(0, internal.activation.completeFirstExecute, {
        workspaceId: workspace._id,
      });
    } catch {
      // Never block authentication on first execute.
    }

    return {
      success: true,
      isNewUser,
      sessionToken,
      workspace: {
        id: workspace._id,
        email: workspace.email,
        tier: workspace.tier,
        referralCode: workspace.referralCode,
      },
    };
  },
});
export function getWorkspaceUsageDisplay(workspace: {
  tier: string;
  billingPlan?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: string;
  hasPaymentMethod?: boolean;
  hasCardAttached?: boolean;
  paygMeterReadyAt?: number;
  paygMeterPriceId?: string;
  paygMeterId?: string;
  paygMeterEventName?: string;
  usageCount?: number;
  managedUsageCount?: number;
  activationManagedCallCount?: number;
  activationProviderCostMicros?: number;
  weeklyUsageCount?: number;
  hourlyUsageCount?: number;
  lastWeeklyResetAt?: number;
  lastHourlyResetAt?: number;
}, nowMs = Date.now()) {
  const quota = getQuotaState(workspace, 1, nowMs);
  const usageCount = quota.lifetimeCount;
  const usageLimit = quota.lifetimeLimit;
  const usageRemaining = usageLimit === -1 ? -1 : Math.max(0, usageLimit - usageCount);
  const usagePercentage = usageLimit === -1 ? 0 : (usageCount / usageLimit) * 100;
  return { usageCount, usageLimit, usageRemaining, usagePercentage };
}
