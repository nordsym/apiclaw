import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Tier limits
const TIER_LIMITS: Record<string, number> = {
  free: 50,      // 100 API calls/month
  pro: 10000,     // 10k API calls/month
  enterprise: -1, // unlimited
};

// ============================================
// STRIPE CUSTOMER MANAGEMENT
// ============================================

// Create Stripe customer for workspace
export const createStripeCustomer = action({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; customerId?: string; error?: string }> => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return { success: false, error: "Stripe not configured" };
    }

    // Get workspace
    const workspace = await ctx.runQuery(api.billing.getWorkspace, { 
      workspaceId: args.workspaceId 
    });
    
    if (!workspace) {
      return { success: false, error: "Workspace not found" };
    }

    // Check if already has customer
    if (workspace.stripeCustomerId) {
      return { success: true, customerId: workspace.stripeCustomerId };
    }

    try {
      // Create Stripe customer
      const response = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: workspace.email,
          "metadata[workspaceId]": args.workspaceId,
          "metadata[source]": "apiclaw",
        }),
      });

      const customer = await response.json() as { id: string; error?: { message: string } };
      
      if (!response.ok || customer.error) {
        return { success: false, error: customer.error?.message || "Failed to create customer" };
      }

      // Save customer ID to workspace
      await ctx.runMutation(api.billing.saveStripeCustomerId, {
        workspaceId: args.workspaceId,
        stripeCustomerId: customer.id,
      });

      return { success: true, customerId: customer.id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
});

// Internal: Save Stripe customer ID to workspace
export const saveStripeCustomerId = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workspaceId, {
      stripeCustomerId: args.stripeCustomerId,
      updatedAt: Date.now(),
    });
  },
});

// Query workspace (for actions)
export const getWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workspaceId);
  },
});

// ============================================
// CHECKOUT SESSION (Add Payment Method)
// ============================================

// Create checkout session for subscription
export const createCheckoutSession = action({
  args: {
    workspaceId: v.id("workspaces"),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; sessionId?: string; url?: string; error?: string }> => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return { success: false, error: "Stripe not configured" };
    }

    // Get workspace
    const workspace = await ctx.runQuery(api.billing.getWorkspace, { 
      workspaceId: args.workspaceId 
    });
    
    if (!workspace) {
      return { success: false, error: "Workspace not found" };
    }

    // Create customer if needed
    let customerId = workspace.stripeCustomerId;
    if (!customerId) {
      const result = await ctx.runAction(api.billing.createStripeCustomer, {
        workspaceId: args.workspaceId,
      });
      if (!result.success || !result.customerId) {
        return { success: false, error: result.error || "Failed to create customer" };
      }
      customerId = result.customerId;
    }

    try {
      // Create checkout session for Pro subscription
      // Using the existing APIClaw Pro price
      const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          customer: customerId,
          mode: "subscription",
          "line_items[0][price]": "price_1T1OC2RtJYK3aJTqlJZskgtP", // APIClaw Pro $99/month
          "line_items[0][quantity]": "1",
          success_url: args.successUrl,
          cancel_url: args.cancelUrl,
          "metadata[workspaceId]": args.workspaceId,
          "metadata[type]": "upgrade_pro",
        }),
      });

      const session = await response.json() as { 
        id: string; 
        url: string;
        error?: { message: string } 
      };
      
      if (!response.ok || session.error) {
        return { success: false, error: session.error?.message || "Failed to create session" };
      }

      return { 
        success: true, 
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
});

// ============================================
// WORKSPACE UPGRADE
// ============================================

// Upgrade workspace to paid tier
export const upgradeWorkspace = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    tier: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      return { success: false, error: "workspace_not_found" };
    }

    const newTier = args.tier || "pro";
    const newLimit = TIER_LIMITS[newTier] || TIER_LIMITS.pro;

    await ctx.db.patch(args.workspaceId, {
      tier: newTier,
      usageLimit: newLimit,
      status: "active",
      updatedAt: Date.now(),
    });

    return { 
      success: true,
      tier: newTier,
      usageLimit: newLimit,
    };
  },
});

// Suspend workspace (e.g., payment failed)
export const suspendWorkspace = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      return { success: false, error: "workspace_not_found" };
    }

    await ctx.db.patch(args.workspaceId, {
      status: "suspended",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get workspace by Stripe customer ID (for webhooks)
export const getWorkspaceByStripeCustomer = query({
  args: {
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workspaces")
      .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();
  },
});

// ============================================
// USAGE REPORTING
// ============================================

// Report usage to Stripe (for metered billing)
// Currently APIClaw Pro is flat-rate, but this prepares for metered billing
export const reportUsage = action({
  args: {
    workspaceId: v.id("workspaces"),
    amount: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    // Get workspace
    const workspace = await ctx.runQuery(api.billing.getWorkspace, { 
      workspaceId: args.workspaceId 
    });
    
    if (!workspace) {
      return { success: false, error: "Workspace not found" };
    }

    // Only track usage for paid tiers
    if (workspace.tier === "free") {
      // Free tier just uses incrementUsage in workspaces.ts
      return { success: true };
    }

    // For paid tiers, increment the usage counter
    // Future: Report to Stripe Billing Meter when metered pricing is set up
    await ctx.runMutation(api.billing.incrementWorkspaceUsage, {
      workspaceId: args.workspaceId,
      amount: args.amount,
    });

    // TODO: When metered pricing is configured, report to Stripe:
    // await reportToStripeMeter(workspace.stripeCustomerId, args.amount);

    return { success: true };
  },
});

// Internal: Increment workspace usage
export const incrementWorkspaceUsage = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) return;

    await ctx.db.patch(args.workspaceId, {
      usageCount: workspace.usageCount + args.amount,
      updatedAt: Date.now(),
    });
  },
});

// ============================================
// QUERIES
// ============================================

// Get billing status for workspace
export const getBillingStatus = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      return null;
    }

    const usageRemaining = workspace.usageLimit > 0 
      ? workspace.usageLimit - workspace.usageCount 
      : -1;

    const usagePercent = workspace.usageLimit > 0
      ? Math.round((workspace.usageCount / workspace.usageLimit) * 100)
      : 0;

    return {
      tier: workspace.tier,
      status: workspace.status,
      usageCount: workspace.usageCount,
      usageLimit: workspace.usageLimit,
      usageRemaining,
      usagePercent,
      hasStripe: !!workspace.stripeCustomerId,
      email: workspace.email,
    };
  },
});
