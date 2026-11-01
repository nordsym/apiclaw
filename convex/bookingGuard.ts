import { mutation } from "./_generated/server";
import { v } from "convex/values";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const RETENTION_MS = 2 * DAY_MS;
const CLEANUP_BATCH = 100;

function requireInternalSecret(internalSecret: string) {
  const expected = process.env.APICLAW_INTERNAL_SECRET;
  if (!expected || internalSecret !== expected) {
    throw new Error("unauthorized: internal secret required");
  }
}

function retryAfterSeconds(oldestCreatedAt: number, windowMs: number, now: number) {
  return Math.max(1, Math.ceil((oldestCreatedAt + windowMs - now) / 1000));
}

export const consume = mutation({
  args: {
    internalSecret: v.string(),
    ip: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { internalSecret, ip, email }) => {
    requireInternalSecret(internalSecret);
    const now = Date.now();
    const normalizedEmail = email.trim().toLowerCase();
    const ipKey = `ip:${ip.trim()}`;
    const emailKey = `email:${normalizedEmail}`;

    if (!ip.trim() || ip.length > 64 || !normalizedEmail || normalizedEmail.length > 254) {
      throw new Error("invalid booking rate-limit key");
    }

    const expired = await ctx.db
      .query("bookingAttempts")
      .withIndex("by_createdAt", (q) => q.lt("createdAt", now - RETENTION_MS))
      .take(CLEANUP_BATCH);
    for (const attempt of expired) await ctx.db.delete(attempt._id);

    const ipAttempts = await ctx.db
      .query("bookingAttempts")
      .withIndex("by_key_createdAt", (q) =>
        q.eq("key", ipKey).gt("createdAt", now - HOUR_MS))
      .collect();
    if (ipAttempts.length >= 3) {
      return {
        allowed: false,
        retryAfterSeconds: retryAfterSeconds(ipAttempts[0].createdAt, HOUR_MS, now),
        reason: "ip" as const,
      };
    }

    const emailAttempts = await ctx.db
      .query("bookingAttempts")
      .withIndex("by_key_createdAt", (q) =>
        q.eq("key", emailKey).gt("createdAt", now - DAY_MS))
      .collect();
    if (emailAttempts.length >= 1) {
      return {
        allowed: false,
        retryAfterSeconds: retryAfterSeconds(emailAttempts[0].createdAt, DAY_MS, now),
        reason: "email" as const,
      };
    }

    await ctx.db.insert("bookingAttempts", { key: ipKey, kind: "ip", createdAt: now });
    await ctx.db.insert("bookingAttempts", { key: emailKey, kind: "email", createdAt: now });
    return { allowed: true, retryAfterSeconds: 0, reason: null };
  },
});
