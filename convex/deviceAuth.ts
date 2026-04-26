import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const TTL_MS = 10 * 60 * 1000; // 10 minutes

function randomCode(): string {
  // 32 hex chars, URL-safe and unguessable enough for a 10-min TTL.
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Start a device-auth flow. Called by the MCP server when it gets a 401
 * from the gateway and has no local session. Returns a code that goes into
 * the URL the user's browser opens.
 */
export const start = mutation({
  args: {
    fingerprint: v.optional(v.string()),
  },
  handler: async (ctx, { fingerprint }) => {
    const code = randomCode();
    const now = Date.now();
    await ctx.db.insert("deviceAuthCodes", {
      code,
      fingerprint,
      status: "pending",
      expiresAt: now + TTL_MS,
      createdAt: now,
    });
    return {
      code,
      expiresAt: now + TTL_MS,
      linkUrl: `https://apiclaw.cloud/workspace?link=${code}`,
    };
  },
});

/**
 * The MCP server polls this every couple seconds while the user signs in.
 * Returns "pending" until the /workspace page calls complete().
 */
export const poll = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const row = await ctx.db
      .query("deviceAuthCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!row) return { status: "not_found" as const };
    if (row.expiresAt < Date.now() && row.status !== "linked") {
      return { status: "expired" as const };
    }
    if (row.status === "linked" && row.sessionToken) {
      return {
        status: "linked" as const,
        sessionToken: row.sessionToken,
        workspaceId: row.workspaceId,
        email: row.email,
      };
    }
    return { status: "pending" as const };
  },
});

/**
 * Called by the /workspace page after the user has signed in (existing
 * magic-link flow). Attaches their session to the device code so the MCP
 * server's next poll picks it up.
 */
export const complete = mutation({
  args: {
    code: v.string(),
    sessionToken: v.string(),
    workspaceId: v.id("workspaces"),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { code, sessionToken, workspaceId, email }) => {
    const row = await ctx.db
      .query("deviceAuthCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!row) {
      throw new Error("Unknown device link code.");
    }
    if (row.expiresAt < Date.now()) {
      throw new Error("Device link code expired. Restart from your MCP client.");
    }
    await ctx.db.patch(row._id, {
      status: "linked",
      sessionToken,
      workspaceId,
      email,
      linkedAt: Date.now(),
    });
    return { ok: true };
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
