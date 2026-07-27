import { internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { isBrowserSession } from "./sessionSecurity";

// Internal diagnostics only. Session bearers are never returned, even to an
// internal caller, and ephemeral browser children do not appear as agents.
export const getForWorkspace = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const sessions = await ctx.db
      .query("agentSessions")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    return sessions.filter((session) => !isBrowserSession(session)).map(s => ({
      id: s._id,
      fingerprint: s.fingerprint,
      sessionKind: s.sessionKind ?? "owner",
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
    }));
  },
});
