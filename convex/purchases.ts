import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Provider pricing (credits per dollar)
const CREDITS_PER_DOLLAR: Record<string, number> = {
  "46elks": 30, // ~30 SMS per dollar
  twilio: 25, // ~25 SMS per dollar
  resend: 1000, // ~1000 emails per dollar
  brave_search: 200, // ~200 searches per dollar
  openrouter: 100, // ~100k tokens per dollar
  elevenlabs: 3333, // ~3333 characters per dollar
};

// Calculate credits for a provider purchase
function calculateCredits(providerId: string, amountUsd: number): number {
  const rate = CREDITS_PER_DOLLAR[providerId] || 100;
  return Math.floor(amountUsd * rate);
}

// Purchase API access
export const purchaseAccess = mutation({
  args: {
    agentId: v.string(),
    providerId: v.string(),
    amountUsd: v.number(),
    credentials: v.any(), // Credentials passed from server side
  },
  handler: async (ctx, args) => {
    // Check balance
    const credits = await ctx.db
      .query("agentCredits")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!credits || credits.balanceUsd < args.amountUsd) {
      throw new Error(
        `Insufficient balance: have $${(credits?.balanceUsd || 0).toFixed(2)}, need $${args.amountUsd.toFixed(2)}`
      );
    }

    // Deduct credits
    await ctx.db.patch(credits._id, {
      balanceUsd: credits.balanceUsd - args.amountUsd,
      updatedAt: Date.now(),
    });

    // Calculate credits granted
    const creditsGranted = calculateCredits(args.providerId, args.amountUsd);

    // Create purchase record
    const purchaseId = await ctx.db.insert("purchases", {
      agentId: args.agentId,
      providerId: args.providerId,
      amountUsd: args.amountUsd,
      creditsGranted,
      status: "active",
      credentials: args.credentials,
      createdAt: Date.now(),
    });

    // Initialize usage tracking
    await ctx.db.insert("usage", {
      purchaseId,
      providerId: args.providerId,
      unitsUsed: 0,
      unitsRemaining: creditsGranted,
      costIncurredUsd: 0,
      lastUsedAt: Date.now(),
    });

    return await ctx.db.get(purchaseId);
  },
});

// Get all purchases for an agent
export const getAgentPurchases = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("purchases")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .collect();
  },
});

// Get active purchase for a provider
export const getActivePurchase = query({
  args: {
    agentId: v.string(),
    providerId: v.string(),
  },
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_agentId_providerId", (q) =>
        q.eq("agentId", args.agentId).eq("providerId", args.providerId)
      )
      .collect();

    return purchases.find((p) => p.status === "active") || null;
  },
});

// Get usage for a purchase
export const getUsage = query({
  args: { purchaseId: v.id("purchases") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("usage")
      .withIndex("by_purchaseId", (q) => q.eq("purchaseId", args.purchaseId))
      .first();
  },
});

// Record usage
export const recordUsage = mutation({
  args: {
    purchaseId: v.id("purchases"),
    unitsUsed: v.number(),
    costUsd: v.number(),
  },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_purchaseId", (q) => q.eq("purchaseId", args.purchaseId))
      .first();

    if (!usage) {
      throw new Error("Usage record not found");
    }

    const newUnitsRemaining = Math.max(0, usage.unitsRemaining - args.unitsUsed);

    await ctx.db.patch(usage._id, {
      unitsUsed: usage.unitsUsed + args.unitsUsed,
      unitsRemaining: newUnitsRemaining,
      costIncurredUsd: usage.costIncurredUsd + args.costUsd,
      lastUsedAt: Date.now(),
    });

    // Update purchase status if depleted
    if (newUnitsRemaining === 0) {
      const purchase = await ctx.db.get(args.purchaseId);
      if (purchase) {
        await ctx.db.patch(args.purchaseId, { status: "exhausted" });
      }
    }

    return await ctx.db
      .query("usage")
      .withIndex("by_purchaseId", (q) => q.eq("purchaseId", args.purchaseId))
      .first();
  },
});

// Get balance summary for an agent
export const getBalanceSummary = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("agentCredits")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .collect();

    const activePurchases = purchases.filter((p) => p.status === "active");
    const totalSpent = purchases.reduce((sum, p) => sum + p.amountUsd, 0);

    return {
      credits: credits || {
        agentId: args.agentId,
        balanceUsd: 0,
        currency: "USD",
      },
      activePurchases,
      totalSpentUsd: totalSpent,
    };
  },
});
