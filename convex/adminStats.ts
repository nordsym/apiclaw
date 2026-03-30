import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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

// Delete workspace by email or empty email ghosts
export const cleanupWorkspaces = mutation({
  args: {
    deleteEmptyEmail: v.optional(v.boolean()),
    deleteEmail: v.optional(v.string()),
    deleteEmailWithTier: v.optional(v.string()),
    activateEmail: v.optional(v.string()),
  },
  handler: async (ctx, { deleteEmptyEmail, deleteEmail, deleteEmailWithTier, activateEmail }) => {
    const workspaces = await ctx.db.query("workspaces").collect();
    let deleted = 0;

    // Activate a pending workspace
    if (activateEmail) {
      for (const ws of workspaces) {
        if (ws.email === activateEmail && ws.status === "pending") {
          await ctx.db.patch(ws._id, { status: "active" });
          return { activated: activateEmail };
        }
      }
      return { error: "not found or not pending" };
    }

    for (const ws of workspaces) {
      let shouldDelete = false;

      if (deleteEmptyEmail && (!ws.email || ws.email === "")) {
        shouldDelete = true;
      }
      if (deleteEmail && ws.email === deleteEmail) {
        shouldDelete = true;
      }
      // Delete specific email+tier combo (e.g. remove free duplicate but keep founder)
      if (deleteEmailWithTier) {
        const [email, tier] = deleteEmailWithTier.split(":");
        if (ws.email === email && ws.tier === tier) {
          shouldDelete = true;
        }
      }

      if (shouldDelete) {
        // Delete associated sessions
        const sessions = await ctx.db.query("sessions").collect();
        for (const s of sessions) {
          if ((s as any).workspaceId === ws._id) {
            await ctx.db.delete(s._id);
          }
        }
        // Delete associated agents
        const agents = await ctx.db.query("agents").collect();
        for (const a of agents) {
          if (a.workspaceId === ws._id) {
            await ctx.db.delete(a._id);
          }
        }
        await ctx.db.delete(ws._id);
        deleted++;
      }
    }

    return { deleted };
  },
});

export const updateProviderEmail = mutation({
  args: { providerId: v.string(), email: v.string() },
  handler: async (ctx, { providerId, email }) => {
    await ctx.db.patch(providerId as any, { email });
    return { success: true };
  },
});
