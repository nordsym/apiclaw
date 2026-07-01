import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Server-to-server guard. Callers must pass the shared APICLAW_INTERNAL_SECRET.
function requireAdminSecret(internalSecret: string | undefined) {
  const expected = process.env.APICLAW_INTERNAL_SECRET;
  if (!expected || internalSecret !== expected) {
    throw new Error("unauthorized: admin secret required");
  }
}

export const activateWorkspace = internalMutation({
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
      usageLimit: 999999,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export const createSessionForWorkspace = internalMutation({
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
      fingerprint: "hivr-bees",
      lastUsedAt: Date.now(),
      createdAt: Date.now(),
    });
    
    return { success: true, sessionToken };
  },
});
