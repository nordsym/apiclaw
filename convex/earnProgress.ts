import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { findUsableAgentSession } from "./sessionSecurity";

// ============================================
// EARN REWARDS CONFIGURATION
// ============================================

const EARN_REWARDS = {
  firstDirectCall: 15,
  apisUsedComplete: 10, // 3 unique APIs
  agentListed: 10,
  apiListed: 10,
  byokSetup: 5,
  githubStarred: 10,
  twitterFollowed: 5,
  referral: 0, // DISABLED (2026-03-01): Risk of abuse
} as const;

const APIS_REQUIRED_FOR_COMPLETE = 3;

// ============================================
// HELPER: Get or Create Progress
// ============================================

async function getOrCreateProgress(
  ctx: any,
  workspaceId: any
): Promise<{ _id: any; [key: string]: any }> {
  const existing = await ctx.db
    .query("earnProgress")
    .withIndex("by_workspaceId", (q: any) => q.eq("workspaceId", workspaceId))
    .first();

  if (existing) {
    return existing;
  }

  const now = Date.now();
  const id = await ctx.db.insert("earnProgress", {
    workspaceId,
    firstDirectCall: false,
    apisUsed: [],
    apisUsedComplete: false,
    agentListed: false,
    apiListed: false,
    byokSetup: false,
    githubStarred: false,
    twitterFollowed: false,
    referralCount: 0,
    totalEarned: 0,
    createdAt: now,
    updatedAt: now,
  });

  return (await ctx.db.get(id))!;
}

// Calculate total earned based on progress
function calculateTotalEarned(progress: any): number {
  let total = 0;

  if (progress.firstDirectCall) total += EARN_REWARDS.firstDirectCall;
  if (progress.apisUsedComplete) total += EARN_REWARDS.apisUsedComplete;
  if (progress.agentListed) total += EARN_REWARDS.agentListed;
  if (progress.apiListed) total += EARN_REWARDS.apiListed;
  if (progress.byokSetup) total += EARN_REWARDS.byokSetup;
  if (progress.githubStarred) total += EARN_REWARDS.githubStarred;
  if (progress.twitterFollowed) total += EARN_REWARDS.twitterFollowed;
  total += progress.referralCount * EARN_REWARDS.referral;

  return total;
}

// ============================================
// QUERIES
// ============================================

/**
 * Get earn progress for a workspace (via session token)
 */
export const getEarnProgress = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await findUsableAgentSession(ctx.db, args.token);

    if (!session) {
      return null;
    }

    const progress = await ctx.db
      .query("earnProgress")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .first();

    if (!progress) {
      // Return default empty progress
      return {
        firstDirectCall: false,
        apisUsed: [],
        apisUsedComplete: false,
        apisUsedCount: 0,
        apisUsedTarget: APIS_REQUIRED_FOR_COMPLETE,
        agentListed: false,
        apiListed: false,
        byokSetup: false,
        githubStarred: false,
        twitterFollowed: false,
        referralCount: 0,
        totalEarned: 0,
        maxEarnable: calculateMaxEarnable(),
        rewards: EARN_REWARDS,
      };
    }

    return {
      firstDirectCall: progress.firstDirectCall,
      firstDirectCallAt: progress.firstDirectCallAt,
      apisUsed: progress.apisUsed,
      apisUsedComplete: progress.apisUsedComplete,
      apisUsedCount: progress.apisUsed.length,
      apisUsedTarget: APIS_REQUIRED_FOR_COMPLETE,
      agentListed: progress.agentListed,
      agentListedAt: progress.agentListedAt,
      apiListed: progress.apiListed,
      apiListedAt: progress.apiListedAt,
      byokSetup: progress.byokSetup,
      byokSetupAt: progress.byokSetupAt,
      githubStarred: progress.githubStarred,
      githubStarredAt: progress.githubStarredAt,
      twitterFollowed: progress.twitterFollowed,
      twitterFollowedAt: progress.twitterFollowedAt,
      referralCount: progress.referralCount,
      totalEarned: progress.totalEarned,
      maxEarnable: calculateMaxEarnable(),
      rewards: EARN_REWARDS,
    };
  },
});

/**
 * Get earn progress by workspace ID (internal use)
 */
export const getByWorkspaceId = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("earnProgress")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    return progress;
  },
});

// ============================================
// REFERRAL SYSTEM
// ============================================

/**
 * Generate a unique referral code (CLAW-XXXXXX format)
 */
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CLAW-${code}`;
}

/**
 * Ensure workspace has a referral code (called on first earn page visit)
 */
export const ensureReferralCode = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await findUsableAgentSession(ctx.db, token);

    if (!session) {
      throw new Error("Invalid session");
    }

    const workspace = await ctx.db.get(session.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Already has a code
    if (workspace.referralCode) {
      return { referralCode: workspace.referralCode };
    }

    // Generate unique code (check for collisions)
    let referralCode: string;
    let attempts = 0;
    do {
      referralCode = generateReferralCode();
      const existing = await ctx.db
        .query("workspaces")
        .withIndex("by_referralCode", (q) => q.eq("referralCode", referralCode))
        .first();
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    // Update workspace with referral code
    await ctx.db.patch(workspace._id, {
      referralCode,
      updatedAt: Date.now(),
    });

    return { referralCode };
  },
});

/**
 * Get earn progress with referral info (for UI)
 */
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await findUsableAgentSession(ctx.db, token);

    if (!session) return null;

    const workspace = await ctx.db.get(session.workspaceId);
    if (!workspace) return null;

    const progress = await ctx.db
      .query("earnProgress")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .first();

    const defaultProgress = {
      firstDirectCall: false,
      firstDirectCallAt: null,
      apisUsed: [] as string[],
      apisUsedComplete: false,
      agentListed: false,
      agentListedAt: null,
      apiListed: false,
      apiListedAt: null,
      byokSetup: false,
      byokSetupAt: null,
      githubStarred: false,
      githubStarredAt: null,
      twitterFollowed: false,
      twitterFollowedAt: null,
      referralCount: 0,
      totalEarned: 0,
    };

    const earnData = progress || defaultProgress;

    return {
      ...earnData,
      referralCode: workspace.referralCode || null,
      maxEarnable: calculateMaxEarnable(),
      rewards: EARN_REWARDS,
    };
  },
});

/**
 * Get referral stats for a workspace
 */
export const getReferralStats = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await findUsableAgentSession(ctx.db, token);

    if (!session) return null;

    const workspace = await ctx.db.get(session.workspaceId);
    if (!workspace) return null;

    // Count users referred by this workspace
    const referredUsers = await ctx.db
      .query("workspaces")
      .filter((q) => q.eq(q.field("referredBy"), workspace._id))
      .collect();

    return {
      referralCode: workspace.referralCode,
      referralCount: referredUsers.length,
      referralUrl: workspace.referralCode
        ? `https://apiclaw.cloud/join?ref=${workspace.referralCode}`
        : null,
      callsEarned: referredUsers.length * EARN_REWARDS.referral,
    };
  },
});

function calculateMaxEarnable(): number {
  return (
    EARN_REWARDS.firstDirectCall +
    EARN_REWARDS.apisUsedComplete +
    EARN_REWARDS.agentListed +
    EARN_REWARDS.apiListed +
    EARN_REWARDS.byokSetup +
    EARN_REWARDS.githubStarred +
    EARN_REWARDS.twitterFollowed
  );
}

// ============================================
// MUTATIONS - Usage Tasks
// ============================================

/**
 * Mark first managed-provider call as complete
 */
export const markFirstDirectCall = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const progress = await getOrCreateProgress(ctx, args.workspaceId);

    if (progress.firstDirectCall) {
      return { success: true, alreadyClaimed: true, earned: 0 };
    }

    const now = Date.now();
    const newTotal = calculateTotalEarned({
      ...progress,
      firstDirectCall: true,
    });

    await ctx.db.patch(progress._id, {
      firstDirectCall: true,
      firstDirectCallAt: now,
      totalEarned: newTotal,
      updatedAt: now,
    });

    // Add earned calls to workspace usage limit
    await addEarnedCallsToWorkspace(ctx, args.workspaceId, EARN_REWARDS.firstDirectCall);

    return {
      success: true,
      alreadyClaimed: false,
      earned: EARN_REWARDS.firstDirectCall,
      totalEarned: newTotal,
    };
  },
});

/**
 * Track unique APIs used
 */
export const trackApiUsed = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    apiId: v.string(), // Format: "provider:action" or just "provider"
  },
  handler: async (ctx, args) => {
    const progress = await getOrCreateProgress(ctx, args.workspaceId);

    // If already complete, no need to track
    if (progress.apisUsedComplete) {
      return {
        success: true,
        alreadyComplete: true,
        apisUsedCount: progress.apisUsed.length,
        earned: 0,
      };
    }

    // Check if this API was already tracked
    if (progress.apisUsed.includes(args.apiId)) {
      return {
        success: true,
        alreadyTracked: true,
        apisUsedCount: progress.apisUsed.length,
        earned: 0,
      };
    }

    const newApisUsed = [...progress.apisUsed, args.apiId];
    const isNowComplete = newApisUsed.length >= APIS_REQUIRED_FOR_COMPLETE;
    const now = Date.now();

    const newTotal = calculateTotalEarned({
      ...progress,
      apisUsed: newApisUsed,
      apisUsedComplete: isNowComplete,
    });

    await ctx.db.patch(progress._id, {
      apisUsed: newApisUsed,
      apisUsedComplete: isNowComplete,
      totalEarned: newTotal,
      updatedAt: now,
    });

    // If just completed, add earned calls
    if (isNowComplete && !progress.apisUsedComplete) {
      await addEarnedCallsToWorkspace(ctx, args.workspaceId, EARN_REWARDS.apisUsedComplete);
    }

    return {
      success: true,
      apisUsedCount: newApisUsed.length,
      isComplete: isNowComplete,
      earned: isNowComplete && !progress.apisUsedComplete ? EARN_REWARDS.apisUsedComplete : 0,
      totalEarned: newTotal,
    };
  },
});

/**
 * Mark agent listed
 */
export const markAgentListed = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const progress = await getOrCreateProgress(ctx, args.workspaceId);

    if (progress.agentListed) {
      return { success: true, alreadyClaimed: true, earned: 0 };
    }

    const now = Date.now();
    const newTotal = calculateTotalEarned({
      ...progress,
      agentListed: true,
    });

    await ctx.db.patch(progress._id, {
      agentListed: true,
      agentListedAt: now,
      totalEarned: newTotal,
      updatedAt: now,
    });

    await addEarnedCallsToWorkspace(ctx, args.workspaceId, EARN_REWARDS.agentListed);

    return {
      success: true,
      alreadyClaimed: false,
      earned: EARN_REWARDS.agentListed,
      totalEarned: newTotal,
    };
  },
});

/**
 * Mark API listed
 */
export const markApiListed = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const progress = await getOrCreateProgress(ctx, args.workspaceId);

    if (progress.apiListed) {
      return { success: true, alreadyClaimed: true, earned: 0 };
    }

    const now = Date.now();
    const newTotal = calculateTotalEarned({
      ...progress,
      apiListed: true,
    });

    await ctx.db.patch(progress._id, {
      apiListed: true,
      apiListedAt: now,
      totalEarned: newTotal,
      updatedAt: now,
    });

    await addEarnedCallsToWorkspace(ctx, args.workspaceId, EARN_REWARDS.apiListed);

    return {
      success: true,
      alreadyClaimed: false,
      earned: EARN_REWARDS.apiListed,
      totalEarned: newTotal,
    };
  },
});

/**
 * Mark BYOK setup complete
 */
export const markByokSetup = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const progress = await getOrCreateProgress(ctx, args.workspaceId);

    if (progress.byokSetup) {
      return { success: true, alreadyClaimed: true, earned: 0 };
    }

    const now = Date.now();
    const newTotal = calculateTotalEarned({
      ...progress,
      byokSetup: true,
    });

    await ctx.db.patch(progress._id, {
      byokSetup: true,
      byokSetupAt: now,
      totalEarned: newTotal,
      updatedAt: now,
    });

    await addEarnedCallsToWorkspace(ctx, args.workspaceId, EARN_REWARDS.byokSetup);

    return {
      success: true,
      alreadyClaimed: false,
      earned: EARN_REWARDS.byokSetup,
      totalEarned: newTotal,
    };
  },
});

// ============================================
// MUTATIONS - Growth Tasks
// ============================================

/**
 * Claim GitHub star reward
 */
export const claimGithub = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await findUsableAgentSession(ctx.db, args.token);

    if (!session) {
      return { success: false, error: "Invalid session" };
    }

    const progress = await getOrCreateProgress(ctx, session.workspaceId);

    if (progress.githubStarred) {
      return { success: true, alreadyClaimed: true, earned: 0 };
    }

    const now = Date.now();
    const newTotal = calculateTotalEarned({
      ...progress,
      githubStarred: true,
    });

    await ctx.db.patch(progress._id, {
      githubStarred: true,
      githubStarredAt: now,
      totalEarned: newTotal,
      updatedAt: now,
    });

    await addEarnedCallsToWorkspace(ctx, session.workspaceId, EARN_REWARDS.githubStarred);

    return {
      success: true,
      alreadyClaimed: false,
      earned: EARN_REWARDS.githubStarred,
      totalEarned: newTotal,
    };
  },
});

/**
 * Claim Twitter follow reward
 */
export const claimTwitter = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate session
    const session = await findUsableAgentSession(ctx.db, args.token);

    if (!session) {
      return { success: false, error: "Invalid session" };
    }

    const progress = await getOrCreateProgress(ctx, session.workspaceId);

    if (progress.twitterFollowed) {
      return { success: true, alreadyClaimed: true, earned: 0 };
    }

    const now = Date.now();
    const newTotal = calculateTotalEarned({
      ...progress,
      twitterFollowed: true,
    });

    await ctx.db.patch(progress._id, {
      twitterFollowed: true,
      twitterFollowedAt: now,
      totalEarned: newTotal,
      updatedAt: now,
    });

    await addEarnedCallsToWorkspace(ctx, session.workspaceId, EARN_REWARDS.twitterFollowed);

    return {
      success: true,
      alreadyClaimed: false,
      earned: EARN_REWARDS.twitterFollowed,
      totalEarned: newTotal,
    };
  },
});

/**
 * Increment referral count (called when someone signs up with referral code)
 */
export const incrementReferral = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const progress = await getOrCreateProgress(ctx, args.workspaceId);

    const newReferralCount = progress.referralCount + 1;
    const now = Date.now();

    const newTotal = calculateTotalEarned({
      ...progress,
      referralCount: newReferralCount,
    });

    await ctx.db.patch(progress._id, {
      referralCount: newReferralCount,
      totalEarned: newTotal,
      updatedAt: now,
    });

    await addEarnedCallsToWorkspace(ctx, args.workspaceId, EARN_REWARDS.referral);

    return {
      success: true,
      referralCount: newReferralCount,
      earned: EARN_REWARDS.referral,
      totalEarned: newTotal,
    };
  },
});

// ============================================
// INTERNAL HELPER
// ============================================

/**
 * Add earned API calls to workspace usage limit
 */
async function addEarnedCallsToWorkspace(
  ctx: any,
  workspaceId: any,
  calls: number
): Promise<void> {
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) return;

  // Add to usage limit (not usage count - they earn MORE calls)
  await ctx.db.patch(workspaceId, {
    usageLimit: workspace.usageLimit + calls,
    updatedAt: Date.now(),
  });
}

// ============================================
// INTERNAL MUTATIONS (for integration)
// ============================================

/**
 * Internal: Track API call for earn progress
 * Called from usage tracking after successful API call
 */
export const trackApiCallInternal = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    provider: v.string(),
    action: v.string(),
  },
  handler: async (ctx, args) => {
    const progress = await getOrCreateProgress(ctx, args.workspaceId);
    const apiId = `${args.provider}:${args.action}`;
    const now = Date.now();

    const updates: Record<string, any> = { updatedAt: now };
    let earnedCalls = 0;

    // Check first managed-provider call
    if (!progress.firstDirectCall) {
      updates.firstDirectCall = true;
      updates.firstDirectCallAt = now;
      earnedCalls += EARN_REWARDS.firstDirectCall;
    }

    // Track unique APIs
    if (!progress.apisUsedComplete && !progress.apisUsed.includes(apiId)) {
      const newApisUsed = [...progress.apisUsed, apiId];
      updates.apisUsed = newApisUsed;

      if (newApisUsed.length >= APIS_REQUIRED_FOR_COMPLETE) {
        updates.apisUsedComplete = true;
        earnedCalls += EARN_REWARDS.apisUsedComplete;
      }
    }

    // Only update if there are changes
    if (Object.keys(updates).length > 1) {
      updates.totalEarned = calculateTotalEarned({ ...progress, ...updates });
      await ctx.db.patch(progress._id, updates);

      // Add earned calls to workspace
      if (earnedCalls > 0) {
        await addEarnedCallsToWorkspace(ctx, args.workspaceId, earnedCalls);
      }
    }

    return { earnedCalls };
  },
});
