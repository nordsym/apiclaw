import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { resolveVerifiedOwnerByWorkspaceId } from "./guards";

// Rate limit config per tier
const LIMITS = {
  free: {
    discovery: 100,    // searches per hour
    instant: 10,       // API calls per hour
  },
  subscriber: {
    discovery: 1000,
    instant: 100,
  },
  provider: {
    discovery: 10000,
    instant: 1000,
  },
};

// Check and increment rate limit
export const checkLimit = mutation({
  args: {
    identifier: v.string(),  // IP or agentId
    action: v.union(v.literal("discovery"), v.literal("instant")),
    tier: v.optional(v.union(v.literal("free"), v.literal("subscriber"), v.literal("provider"))),
  },
  handler: async (ctx, args) => {
    const tier = args.tier || "free";
    const limit = LIMITS[tier][args.action];
    const hourKey = Math.floor(Date.now() / 3600000); // Hour bucket
    const key = `${args.identifier}:${args.action}:${hourKey}`;

    // Get current count
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      if (existing.count >= limit) {
        return { allowed: false, remaining: 0, resetIn: 3600 - (Date.now() % 3600000) / 1000 };
      }
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
      return { allowed: true, remaining: limit - existing.count - 1 };
    }

    // Create new entry
    await ctx.db.insert("rateLimits", {
      key,
      identifier: args.identifier,
      action: args.action,
      count: 1,
      hourBucket: hourKey,
      createdAt: Date.now(),
    });

    return { allowed: true, remaining: limit - 1 };
  },
});

// Get current usage stats
export const getUsage = query({
  args: {
    identifier: v.string(),
  },
  handler: async (ctx, args) => {
    const hourKey = Math.floor(Date.now() / 3600000);
    
    const discovery = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", `${args.identifier}:discovery:${hourKey}`))
      .first();

    const instant = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", `${args.identifier}:instant:${hourKey}`))
      .first();

    return {
      discovery: discovery?.count || 0,
      instant: instant?.count || 0,
      limits: LIMITS.free,
    };
  },
});

// Cleanup old rate limit entries (run via cron)
export const cleanup = mutation({
  args: {},
  handler: async (ctx) => {
    const hourAgo = Math.floor(Date.now() / 3600000) - 2; // Keep 2 hours
    
    const old = await ctx.db
      .query("rateLimits")
      .filter((q) => q.lt(q.field("hourBucket"), hourAgo))
      .take(100);

    for (const entry of old) {
      await ctx.db.delete(entry._id);
    }

    return { deleted: old.length };
  },
});


// Separate from managed usage: free public calls never consume the paid trial
// or create billing-ledger rows. A workspace gets sixty reads per minute.
export const checkWorkspacePublic = internalMutation({
  args: { workspaceId: v.id("workspaces") },
  returns: v.object({ allowed: v.boolean(), retryAfterSeconds: v.number(), reason: v.optional(v.literal("workspace_inactive")) }),
  handler: async (ctx, { workspaceId }) => {
    const owner = await resolveVerifiedOwnerByWorkspaceId(ctx, workspaceId, { allowQuotaExceeded: true });
    if (!owner.ok) return { allowed: false, retryAfterSeconds: 0, reason: "workspace_inactive" as const };
    const now = Date.now();
    const minute = Math.floor(now / 60_000);
    const key = `workspace_public:${workspaceId}:${minute}`;
    const existing = await ctx.db.query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", key)).first();
    const retryAfterSeconds = Math.ceil((60_000 - now % 60_000) / 1000);
    if (existing && existing.count >= 60) return { allowed: false, retryAfterSeconds };
    if (existing) await ctx.db.patch(existing._id, { count: existing.count + 1 });
    else await ctx.db.insert("rateLimits", {
      key, identifier: workspaceId, action: "workspace_public", count: 1,
      hourBucket: Math.floor(now / 3_600_000), createdAt: now,
    });
    return { allowed: true, retryAfterSeconds: 0 };
  },
});
