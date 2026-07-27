import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * The legacy browser-link flow returned a long-lived workspace bearer to a
 * polling client. It is retired because a victim could be tricked into
 * approving an attacker-created code. CLI loopback auth is the canonical,
 * state-bound flow.
 */
export const start = mutation({
  args: {
    fingerprint: v.optional(v.string()),
  },
  handler: async () => {
    return {
      status: "retired" as const,
      command: "npx @nordsym/apiclaw auth login",
      message: "Legacy device linking is retired. Use the state-bound CLI browser login.",
    };
  },
});

/** Retired polling surface. It never returns a workspace bearer. */
export const poll = query({
  args: { code: v.string() },
  handler: async () => ({ status: "retired" as const }),
});

/** Retired completion surface. It never attaches a session to a device code. */
export const complete = mutation({
  args: {
    code: v.string(),
    sessionToken: v.string(),
    workspaceId: v.id("workspaces"),
    email: v.optional(v.string()),
  },
  handler: async () => {
    throw new Error("Legacy device linking is retired. Run `npx @nordsym/apiclaw auth login`.");
  },
});

/**
 * Garbage-collect expired pending codes. Called by a cron, or one-shot from
 * an admin panel. Keeps the table from growing.
 */
export const gcExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const stale = await ctx.db
      .query("deviceAuthCodes")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();
    for (const row of stale) {
      await ctx.db.patch(row._id, { status: "expired" });
    }
    return { expiredCount: stale.length };
  },
});
