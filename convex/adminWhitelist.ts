import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Admin whitelist helpers used to guarantee partner/provider workspaces
 * never get surprised by the shadow-auth gate when it flips to enforce.
 *
 * These are standalone utilities — no auth gate on the mutation itself.
 * Deploy behind IP allowlist or revoke after the partner call if concerned.
 */

/**
 * Return the canonical state of a workspace + whether any other workspace
 * shares the same email (the "old test email link" sanity check).
 */
export const inspectByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.toLowerCase().trim();
    const matches = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .collect();
    // Also scan for any fuzzy/legacy duplicates (e.g. same local-part on different domain)
    const allForLocal = await ctx.db.query("workspaces").collect();
    const localPart = normalized.split("@")[0];
    const suspiciousAliases = allForLocal
      .filter((w) => w.email !== normalized && w.email.split("@")[0] === localPart)
      .map((w) => ({ id: w._id, email: w.email, tier: w.tier, status: w.status }));
    return {
      exact: matches.map((w) => ({
        id: w._id,
        email: w.email,
        tier: w.tier,
        status: w.status,
        gatingEnabled: w.gatingEnabled,
        stripeSubscriptionStatus: w.stripeSubscriptionStatus,
        hasCardAttached: w.hasCardAttached,
        usageCount: w.usageCount,
        usageLimit: w.usageLimit,
      })),
      duplicateLocalPartAliases: suspiciousAliases,
    };
  },
});

/**
 * Whitelist a workspace by email: sets gatingEnabled=false so the shadow/enforce
 * gate always lets this workspace through, and upgrades tier if requested.
 */
export const whitelistByEmail = mutation({
  args: {
    email: v.string(),
    tier: v.optional(v.string()), // e.g. "partner", "enterprise"
    usageLimit: v.optional(v.number()),
    workspaceName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    if (existing.length === 0) {
      return { status: "not_found", email };
    }

    // Primary = earliest-created workspace for that email
    const primary = existing.sort((a, b) => a.createdAt - b.createdAt)[0];
    const now = Date.now();

    await ctx.db.patch(primary._id, {
      gatingEnabled: false,
      tier: args.tier ?? primary.tier,
      usageLimit: args.usageLimit ?? primary.usageLimit,
      workspaceName: args.workspaceName ?? primary.workspaceName,
      status: "active",
      updatedAt: now,
    });

    return {
      status: "whitelisted",
      workspaceId: primary._id,
      email: primary.email,
      tier: args.tier ?? primary.tier,
      duplicates: existing.length - 1,
      duplicateIds: existing.filter((w) => w._id !== primary._id).map((w) => w._id),
    };
  },
});
