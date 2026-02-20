import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Credit packages
export const CREDIT_PACKAGES = {
  starter: { amountUsd: 10, credits: 100, bonus: 0 },
  growth: { amountUsd: 50, credits: 550, bonus: 50 }, // 10% bonus
  scale: { amountUsd: 100, credits: 1200, bonus: 200 }, // 20% bonus
} as const;

// Get or create agent credits account
export const getOrCreateAgent = mutation({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentCredits")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (existing) return existing;

    const now = Date.now();
    const id = await ctx.db.insert("agentCredits", {
      agentId: args.agentId,
      balanceUsd: 0,
      currency: "USD",
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(id);
  },
});

// Get agent credits
export const getAgentCredits = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentCredits")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
  },
});

// Add credits to agent account (called by webhook or admin)
export const addCredits = mutation({
  args: {
    agentId: v.string(),
    amountUsd: v.number(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("agentCredits")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    const now = Date.now();

    if (credits) {
      await ctx.db.patch(credits._id, {
        balanceUsd: credits.balanceUsd + args.amountUsd,
        updatedAt: now,
      });
      return await ctx.db.get(credits._id);
    } else {
      const id = await ctx.db.insert("agentCredits", {
        agentId: args.agentId,
        balanceUsd: args.amountUsd,
        currency: "USD",
        createdAt: now,
        updatedAt: now,
      });
      return await ctx.db.get(id);
    }
  },
});

// Deduct credits (internal use)
export const deductCredits = mutation({
  args: {
    agentId: v.string(),
    amountUsd: v.number(),
  },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("agentCredits")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!credits) {
      throw new Error(`No credits account for agent: ${args.agentId}`);
    }

    if (credits.balanceUsd < args.amountUsd) {
      throw new Error(
        `Insufficient balance: have $${credits.balanceUsd.toFixed(2)}, need $${args.amountUsd.toFixed(2)}`
      );
    }

    await ctx.db.patch(credits._id, {
      balanceUsd: credits.balanceUsd - args.amountUsd,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(credits._id);
  },
});

// Record credit top-up from Stripe
export const recordTopup = mutation({
  args: {
    agentId: v.string(),
    stripeSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    amountUsd: v.number(),
    creditsGranted: v.number(),
    packageType: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("creditTopups", {
      agentId: args.agentId,
      stripeSessionId: args.stripeSessionId,
      stripePaymentIntentId: args.stripePaymentIntentId,
      amountUsd: args.amountUsd,
      creditsGranted: args.creditsGranted,
      packageType: args.packageType,
      status: args.status,
      createdAt: now,
      completedAt: args.status === "completed" ? now : undefined,
    });
  },
});

// Complete a pending top-up
export const completeTopup = mutation({
  args: {
    stripeSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let topup;

    if (args.stripeSessionId) {
      topup = await ctx.db
        .query("creditTopups")
        .withIndex("by_stripeSessionId", (q) =>
          q.eq("stripeSessionId", args.stripeSessionId)
        )
        .first();
    } else if (args.stripePaymentIntentId) {
      topup = await ctx.db
        .query("creditTopups")
        .withIndex("by_stripePaymentIntentId", (q) =>
          q.eq("stripePaymentIntentId", args.stripePaymentIntentId)
        )
        .first();
    }

    if (!topup) {
      throw new Error("Top-up not found");
    }

    if (topup.status === "completed") {
      return topup; // Already completed, idempotent
    }

    // Update top-up status
    await ctx.db.patch(topup._id, {
      status: "completed",
      completedAt: Date.now(),
    });

    // Add credits to agent
    const credits = await ctx.db
      .query("agentCredits")
      .withIndex("by_agentId", (q) => q.eq("agentId", topup.agentId))
      .first();

    if (credits) {
      await ctx.db.patch(credits._id, {
        balanceUsd: credits.balanceUsd + topup.creditsGranted,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("agentCredits", {
        agentId: topup.agentId,
        balanceUsd: topup.creditsGranted,
        currency: "USD",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return topup;
  },
});

// Get all top-ups for an agent
export const getTopups = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("creditTopups")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .collect();
  },
});
