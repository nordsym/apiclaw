import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, type MutationCtx } from "./_generated/server";

type SuspendWorkspaceArgs = {
  workspaceId: Id<"workspaces">;
  reason: string;
};

/**
 * Suspend a workspace without deleting account or credential records.
 *
 * API keys keep their existing revocation timestamp, and usable agent sessions
 * are expired in place so the operation remains auditable and retry-safe.
 */
export async function suspendWorkspaceInTransaction(
  db: MutationCtx["db"],
  args: SuspendWorkspaceArgs,
  now = Date.now(),
) {
  const reason = args.reason.trim();
  if (!reason) throw new Error("suspension_reason_required");

  const workspace = await db.get(args.workspaceId);
  if (!workspace) throw new Error("workspace_not_found");
  const previousStatus = workspace.status;

  const [apiKeys, sessions] = await Promise.all([
    db
      .query("workspaceApiKeys")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect(),
    db
      .query("agentSessions")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect(),
  ]);

  const activeKeys = apiKeys.filter((key) => key.revokedAt === undefined);
  const activeSessions = sessions.filter(
    (session) => session.expiresAt === undefined || session.expiresAt > now,
  );

  await db.patch(args.workspaceId, {
    status: "suspended",
    suspendedAt: workspace.suspendedAt ?? now,
    suspensionReason: reason,
    updatedAt: now,
  });
  for (const key of activeKeys) {
    await db.patch(key._id, { revokedAt: now });
  }
  for (const session of activeSessions) {
    await db.patch(session._id, { expiresAt: now });
  }

  return {
    workspaceId: args.workspaceId,
    previousStatus,
    status: "suspended" as const,
    revokedKeys: activeKeys.length,
    expiredSessions: activeSessions.length,
  };
}

export const suspendWorkspace = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    reason: v.string(),
  },
  handler: async (ctx, args) => suspendWorkspaceInTransaction(ctx.db, args),
});

// Minimal operator readbacks: avoid exposing full workspace or credential rows.
export const getWorkspaceIdentity = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const workspace = await ctx.db.get(workspaceId);
    if (!workspace) return null;
    return {
      workspaceId: workspace._id,
      email: workspace.email,
      createdAt: workspace.createdAt,
    };
  },
});

export const getSuspensionState = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const workspace = await ctx.db.get(workspaceId);
    if (!workspace) return null;
    const now = Date.now();
    const [apiKeys, sessions] = await Promise.all([
      ctx.db
        .query("workspaceApiKeys")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
        .collect(),
      ctx.db
        .query("agentSessions")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
        .collect(),
    ]);
    return {
      workspaceId,
      status: workspace.status,
      updatedAt: workspace.updatedAt,
      suspendedAt: workspace.suspendedAt,
      suspensionReason: workspace.suspensionReason,
      activeKeys: apiKeys.filter((key) => key.revokedAt === undefined).length,
      activeSessions: sessions.filter(
        (session) => session.expiresAt === undefined || session.expiresAt > now,
      ).length,
    };
  },
});
