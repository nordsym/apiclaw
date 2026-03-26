import { mutation } from "./_generated/server";
import { v } from "convex/values";
export const activateWorkspace = mutation({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, { workspaceId }) => {
        const workspace = await ctx.db.get(workspaceId);
        if (!workspace) {
            return { success: false, error: "not_found" };
        }
        await ctx.db.patch(workspaceId, {
            status: "active",
            tier: "backer", // Give Hivr bees backer status
            weeklyUsageLimit: 999999,
            usageLimit: 999999,
            backerUntil: new Date("2026-12-31T23:59:59Z").getTime(), // Founding Backer until end of 2026
            updatedAt: Date.now(),
        });
        return { success: true };
    },
});
function generateToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
export const createSessionForWorkspace = mutation({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, { workspaceId }) => {
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
//# sourceMappingURL=adminActivate.js.map