import { query } from "./_generated/server";
// Get total user/workspace count
export const getTotalWorkspaces = query({
    args: {},
    handler: async (ctx) => {
        const workspaces = await ctx.db.query("workspaces").collect();
        const providers = await ctx.db.query("providers").collect();
        return {
            totalWorkspaces: workspaces.length,
            totalProviders: providers.length,
            activeWorkspaces: workspaces.filter(w => w.status === "active").length,
            backers: workspaces.filter(w => w.tier === "backer").length,
            workspaceBreakdown: {
                free: workspaces.filter(w => w.tier === "free").length,
                pro: workspaces.filter(w => w.tier === "pro").length,
                enterprise: workspaces.filter(w => w.tier === "enterprise").length,
                backer: workspaces.filter(w => w.tier === "backer").length,
            },
            providerBreakdown: {
                pending: providers.filter(p => p.status === "pending").length,
                approved: providers.filter(p => p.status === "approved").length,
                rejected: providers.filter(p => p.status === "rejected").length,
            }
        };
    },
});
// List all workspace emails (for inspection)
export const listWorkspaces = query({
    args: {},
    handler: async (ctx) => {
        const workspaces = await ctx.db.query("workspaces").collect();
        return workspaces.map(w => ({
            email: w.email,
            status: w.status,
            tier: w.tier,
            usageCount: w.usageCount,
            createdAt: w.createdAt,
            lastActiveAt: w.lastActiveAt,
        }));
    },
});
//# sourceMappingURL=adminStats.js.map