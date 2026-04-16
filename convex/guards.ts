/**
 * Registration enforcement guards — single source of truth.
 *
 * Every call path that "should require registration" resolves through
 * requireVerifiedOwner. Free paths (discover_apis, catalog, docs) do NOT
 * call this. See Apiclaw-TOOLS.md for the enforcement matrix.
 */
import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export type VerifiedOwner = {
  ok: true;
  workspaceId: Id<"workspaces">;
  email: string;
  tier: string;
  status: string;
  usageCount: number;
  usageLimit: number;
  usageRemaining: number;
};

export type OwnerDenial = {
  ok: false;
  reason:
    | "no_session"
    | "session_invalid"
    | "workspace_missing"
    | "not_verified" // status !== active OR email missing
    | "quota_exceeded";
  message: string;
};

// Resolve a verified-owner decision from a session token.
// Pure read; no mutations. Returns a typed discriminated union so callers
// must handle both branches explicitly.
export async function resolveVerifiedOwner(
  ctx: any,
  sessionToken: string | null | undefined,
  opts?: { allowQuotaExceeded?: boolean }
): Promise<VerifiedOwner | OwnerDenial> {
  if (!sessionToken) {
    return {
      ok: false,
      reason: "no_session",
      message:
        "Registration required. Call register_owner({ email }) then verify_code({ email, code }).",
    };
  }

  const session = await ctx.db
    .query("agentSessions")
    .withIndex("by_sessionToken", (q: any) => q.eq("sessionToken", sessionToken))
    .first();

  if (!session) {
    return { ok: false, reason: "session_invalid", message: "Session not found or expired." };
  }

  const workspace = await ctx.db.get(session.workspaceId);
  if (!workspace) {
    return { ok: false, reason: "workspace_missing", message: "Workspace not found." };
  }

  if (workspace.status !== "active") {
    return {
      ok: false,
      reason: "not_verified",
      message: `Workspace status: ${workspace.status}. Verify your email to activate.`,
    };
  }

  if (!workspace.email) {
    return {
      ok: false,
      reason: "not_verified",
      message: "Workspace has no verified email. Run register_owner + verify_code.",
    };
  }

  const usageRemaining =
    workspace.usageLimit > 0 ? workspace.usageLimit - workspace.usageCount : -1;

  if (!opts?.allowQuotaExceeded && usageRemaining === 0) {
    return {
      ok: false,
      reason: "quota_exceeded",
      message: "Free tier quota exceeded. Upgrade at https://apiclaw.cloud/upgrade.",
    };
  }

  return {
    ok: true,
    workspaceId: session.workspaceId,
    email: workspace.email,
    tier: workspace.tier,
    status: workspace.status,
    usageCount: workspace.usageCount,
    usageLimit: workspace.usageLimit,
    usageRemaining,
  };
}

// Variant: verify by workspaceId directly (for API-key auth paths that already
// resolved a workspace from sk-claw-* and just need to confirm it's active+verified).
export async function resolveVerifiedOwnerByWorkspaceId(
  ctx: any,
  workspaceId: string | null | undefined,
  opts?: { allowQuotaExceeded?: boolean }
): Promise<VerifiedOwner | OwnerDenial> {
  if (!workspaceId) {
    return { ok: false, reason: "no_session", message: "No workspace resolved from API key." };
  }
  const workspace = await ctx.db.get(workspaceId as Id<"workspaces">);
  if (!workspace) {
    return { ok: false, reason: "workspace_missing", message: "Workspace not found." };
  }
  if (workspace.status !== "active") {
    return {
      ok: false,
      reason: "not_verified",
      message: `Workspace status: ${workspace.status}. Verify your email to activate.`,
    };
  }
  if (!workspace.email) {
    return { ok: false, reason: "not_verified", message: "Workspace has no verified email." };
  }
  const usageRemaining =
    workspace.usageLimit > 0 ? workspace.usageLimit - workspace.usageCount : -1;
  if (!opts?.allowQuotaExceeded && usageRemaining === 0) {
    return {
      ok: false,
      reason: "quota_exceeded",
      message: "Free tier quota exceeded. Upgrade at https://apiclaw.cloud/upgrade.",
    };
  }
  return {
    ok: true,
    workspaceId: workspaceId as Id<"workspaces">,
    email: workspace.email,
    tier: workspace.tier,
    status: workspace.status,
    usageCount: workspace.usageCount,
    usageLimit: workspace.usageLimit,
    usageRemaining,
  };
}

// Public query wrapper so HTTP handlers (which can only call queries/mutations)
// can invoke the guard. Returns a JSON-safe shape.
export const checkVerifiedOwnerByWorkspaceId = query({
  args: {
    workspaceId: v.optional(v.id("workspaces")),
    allowQuotaExceeded: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await resolveVerifiedOwnerByWorkspaceId(ctx, args.workspaceId, {
      allowQuotaExceeded: args.allowQuotaExceeded,
    });
  },
});

export const checkVerifiedOwner = query({
  args: {
    sessionToken: v.optional(v.string()),
    allowQuotaExceeded: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const result = await resolveVerifiedOwner(ctx, args.sessionToken, {
      allowQuotaExceeded: args.allowQuotaExceeded,
    });
    return result;
  },
});
