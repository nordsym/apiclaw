import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================
// SUBMIT FEEDBACK
// ============================================

export const submitFeedback = mutation({
  args: {
    token: v.string(),
    type: v.union(v.literal("bug"), v.literal("feature"), v.literal("general")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    // Create feedback entry
    const feedbackId = await ctx.db.insert("feedback", {
      workspaceId: session.workspaceId,
      type: args.type,
      content: args.content,
      votes: 0,
      votedBy: [],
      status: "new",
      createdAt: Date.now(),
    });

    return { success: true, feedbackId };
  },
});

// ============================================
// VOTE ON FEEDBACK
// ============================================

export const voteFeedback = mutation({
  args: {
    token: v.string(),
    feedbackId: v.id("feedback"),
    direction: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    // Get feedback
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    const workspaceIdStr = session.workspaceId.toString();
    const hasVoted = feedback.votedBy.includes(workspaceIdStr);

    // Calculate new vote count and votedBy array
    let newVotes = feedback.votes;
    let newVotedBy = [...feedback.votedBy];

    if (args.direction === "up") {
      if (hasVoted) {
        // Already voted, remove vote
        newVotes -= 1;
        newVotedBy = newVotedBy.filter((id) => id !== workspaceIdStr);
      } else {
        // Add upvote
        newVotes += 1;
        newVotedBy.push(workspaceIdStr);
      }
    } else {
      // Downvote
      if (hasVoted) {
        // Already voted up, switch to down (remove 2)
        newVotes -= 2;
        newVotedBy = newVotedBy.filter((id) => id !== workspaceIdStr);
      } else {
        // Downvote
        newVotes -= 1;
      }
    }

    // Update feedback
    await ctx.db.patch(args.feedbackId, {
      votes: newVotes,
      votedBy: newVotedBy,
    });

    return { success: true, votes: newVotes, hasVoted: newVotedBy.includes(workspaceIdStr) };
  },
});

// ============================================
// GET FEEDBACK (with filters and sorting)
// ============================================

export const getFeedback = query({
  args: {
    token: v.string(),
    filterType: v.optional(v.union(v.literal("bug"), v.literal("feature"), v.literal("general"))),
    filterStatus: v.optional(v.union(v.literal("new"), v.literal("reviewing"), v.literal("planned"), v.literal("shipped"))),
    sortBy: v.optional(v.union(v.literal("votes"), v.literal("recent"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      return { error: "Invalid session" };
    }

    const workspaceIdStr = session.workspaceId.toString();
    const limit = args.limit || 50;

    // Get all feedback
    let feedbackList = await ctx.db.query("feedback").collect();

    // Apply filters
    if (args.filterType) {
      feedbackList = feedbackList.filter((f) => f.type === args.filterType);
    }
    if (args.filterStatus) {
      feedbackList = feedbackList.filter((f) => f.status === args.filterStatus);
    }

    // Sort
    if (args.sortBy === "votes" || !args.sortBy) {
      feedbackList.sort((a, b) => b.votes - a.votes);
    } else if (args.sortBy === "recent") {
      feedbackList.sort((a, b) => b.createdAt - a.createdAt);
    }

    // Limit
    feedbackList = feedbackList.slice(0, limit);

    // Add hasVoted flag for current user
    const result = feedbackList.map((f) => ({
      ...f,
      hasVoted: f.votedBy.includes(workspaceIdStr),
      isOwn: f.workspaceId.toString() === workspaceIdStr,
    }));

    return { feedback: result };
  },
});

// ============================================
// GET MY FEEDBACK
// ============================================

export const getMyFeedback = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      return { error: "Invalid session" };
    }

    const feedbackList = await ctx.db
      .query("feedback")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();

    // Sort by created date (most recent first)
    feedbackList.sort((a, b) => b.createdAt - a.createdAt);

    return { feedback: feedbackList };
  },
});

// ============================================
// ADMIN: UPDATE FEEDBACK STATUS
// ============================================

export const updateFeedbackStatus = mutation({
  args: {
    token: v.string(),
    feedbackId: v.id("feedback"),
    status: v.union(v.literal("new"), v.literal("reviewing"), v.literal("planned"), v.literal("shipped")),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    // For now, allow workspace owners to update status
    // In future, add admin check
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    await ctx.db.patch(args.feedbackId, {
      status: args.status,
    });

    return { success: true };
  },
});

// ============================================
// DELETE FEEDBACK (own only)
// ============================================

export const deleteFeedback = mutation({
  args: {
    token: v.string(),
    feedbackId: v.id("feedback"),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
      .first();

    if (!session) {
      throw new Error("Invalid session");
    }

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Only allow owner to delete
    if (feedback.workspaceId.toString() !== session.workspaceId.toString()) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.feedbackId);

    return { success: true };
  },
});
