import { query } from "./_generated/server";
import { v } from "convex/values";

export const getForWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const sessions = await ctx.db
      .query("agentSessions")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    return sessions.map(s => ({
      id: s._id,
      sessionToken: s.sessionToken,
      fingerprint: s.fingerprint,
      createdAt: s.createdAt,
    }));
  },
});
