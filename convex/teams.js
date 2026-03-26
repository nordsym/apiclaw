import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
// ============================================
// HELPER FUNCTIONS
// ============================================
function generateToken() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
// ============================================
// TEAM QUERIES
// ============================================
/**
 * Get team members for a workspace
 */
export const getMembers = query({
    args: { token: v.string() },
    handler: async (ctx, { token }) => {
        const session = await ctx.db
            .query("agentSessions")
            .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
            .first();
        if (!session)
            return [];
        const workspace = await ctx.db.get(session.workspaceId);
        if (!workspace)
            return [];
        const members = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
            .collect();
        // Add owner as first member
        return [
            {
                email: workspace.email,
                role: "owner",
                status: "active",
                isOwner: true,
                createdAt: workspace.createdAt,
            },
            ...members.map((m) => ({
                id: m._id,
                email: m.email,
                role: m.role,
                status: m.status,
                isOwner: false,
                invitedBy: m.invitedBy,
                createdAt: m.createdAt,
                acceptedAt: m.acceptedAt,
            })),
        ];
    },
});
// ============================================
// TEAM MUTATIONS
// ============================================
/**
 * Invite a member to the workspace (creates pending invite)
 */
export const inviteMember = mutation({
    args: {
        token: v.string(),
        email: v.string(),
        role: v.union(v.literal("admin"), v.literal("member")),
    },
    handler: async (ctx, { token, email, role }) => {
        const session = await ctx.db
            .query("agentSessions")
            .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
            .first();
        if (!session)
            throw new Error("Invalid session");
        const workspace = await ctx.db.get(session.workspaceId);
        if (!workspace)
            throw new Error("Workspace not found");
        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();
        // Can't invite yourself
        if (normalizedEmail === workspace.email.toLowerCase()) {
            throw new Error("Cannot invite yourself");
        }
        // Check if already member
        const existing = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspaceId_email", (q) => q.eq("workspaceId", session.workspaceId).eq("email", normalizedEmail))
            .first();
        if (existing) {
            if (existing.status === "active") {
                throw new Error("Already a team member");
            }
            if (existing.status === "pending") {
                throw new Error("Invite already pending");
            }
            // If revoked, we can re-invite - update existing record
            const inviteToken = generateToken();
            await ctx.db.patch(existing._id, {
                role,
                invitedBy: workspace.email,
                inviteToken,
                status: "pending",
                createdAt: Date.now(),
                acceptedAt: undefined,
            });
            return { id: existing._id, inviteToken };
        }
        // Generate invite token
        const inviteToken = generateToken();
        const id = await ctx.db.insert("workspaceMembers", {
            workspaceId: session.workspaceId,
            email: normalizedEmail,
            role,
            invitedBy: workspace.email,
            inviteToken,
            status: "pending",
            createdAt: Date.now(),
        });
        return { id, inviteToken };
    },
});
/**
 * Accept an invite
 */
export const acceptInvite = mutation({
    args: { inviteToken: v.string() },
    handler: async (ctx, { inviteToken }) => {
        const member = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_inviteToken", (q) => q.eq("inviteToken", inviteToken))
            .first();
        if (!member)
            throw new Error("Invalid invite token");
        if (member.status !== "pending")
            throw new Error("Invite already used or revoked");
        await ctx.db.patch(member._id, {
            status: "active",
            acceptedAt: Date.now(),
            inviteToken: undefined, // Clear token after use
        });
        // Get workspace info for response
        const workspace = await ctx.db.get(member.workspaceId);
        return {
            success: true,
            workspaceId: member.workspaceId,
            workspaceEmail: workspace?.email,
            role: member.role,
        };
    },
});
/**
 * Remove a member from the workspace
 */
export const removeMember = mutation({
    args: {
        token: v.string(),
        memberEmail: v.string(),
    },
    handler: async (ctx, { token, memberEmail }) => {
        const session = await ctx.db
            .query("agentSessions")
            .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
            .first();
        if (!session)
            throw new Error("Invalid session");
        const workspace = await ctx.db.get(session.workspaceId);
        if (!workspace)
            throw new Error("Workspace not found");
        const normalizedEmail = memberEmail.toLowerCase().trim();
        // Cannot remove owner
        if (normalizedEmail === workspace.email.toLowerCase()) {
            throw new Error("Cannot remove workspace owner");
        }
        const member = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_workspaceId_email", (q) => q.eq("workspaceId", session.workspaceId).eq("email", normalizedEmail))
            .first();
        if (!member)
            throw new Error("Member not found");
        // Set status to revoked instead of deleting
        await ctx.db.patch(member._id, {
            status: "revoked",
            inviteToken: undefined,
        });
        return { success: true };
    },
});
/**
 * Get invite details (public, for invite acceptance page)
 */
export const getInviteDetails = query({
    args: { inviteToken: v.string() },
    handler: async (ctx, { inviteToken }) => {
        const member = await ctx.db
            .query("workspaceMembers")
            .withIndex("by_inviteToken", (q) => q.eq("inviteToken", inviteToken))
            .first();
        if (!member)
            return null;
        if (member.status !== "pending")
            return null;
        const workspace = await ctx.db.get(member.workspaceId);
        if (!workspace)
            return null;
        return {
            email: member.email,
            role: member.role,
            invitedBy: member.invitedBy,
            workspaceEmail: workspace.email,
        };
    },
});
//# sourceMappingURL=teams.js.map