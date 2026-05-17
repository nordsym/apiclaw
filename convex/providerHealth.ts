import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const WINDOW_DAYS = 30;
const WINDOW_MS = WINDOW_DAYS * 24 * 60 * 60 * 1000;
const MIN_CALLS_FOR_SCORE = 5;

/**
 * Read recent outbound apiLogs for aggregation.
 * Returns the lean shape the aggregator needs — avoids pulling full
 * documents across the action boundary.
 */
export const collectRecent = internalQuery({
  args: { since: v.number() },
  handler: async (ctx, { since }) => {
    const rows = await ctx.db
      .query("apiLogs")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", since))
      .collect();
    return rows.map((r) => ({
      provider: r.provider,
      status: r.status as "success" | "error",
      latencyMs: r.latencyMs,
      direction: r.direction,
    }));
  },
});

/**
 * Upsert a single provider's health row by providerId.
 */
export const upsertOne = internalMutation({
  args: {
    providerId: v.string(),
    successRate: v.number(),
    p50LatencyMs: v.number(),
    callCount: v.number(),
    successCount: v.number(),
    windowDays: v.number(),
    computedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("providerHealth")
      .withIndex("by_providerId", (q) => q.eq("providerId", args.providerId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        successRate: args.successRate,
        p50LatencyMs: args.p50LatencyMs,
        callCount: args.callCount,
        successCount: args.successCount,
        windowDays: args.windowDays,
        computedAt: args.computedAt,
      });
    } else {
      await ctx.db.insert("providerHealth", args);
    }
  },
});

/**
 * Hourly aggregate of outbound apiLogs into per-provider rolling health.
 * Discovery reads this to down-rank providers whose recent call success
 * rate or latency has degraded.
 *
 * Inbound calls are excluded — we score the providers we call, not the
 * partners who call us.
 *
 * v1 scope note: full scan of 30d apiLogs each run. Fine at current
 * volume; revisit once monthly call count exceeds the Convex read budget.
 */
export const aggregate = internalAction({
  args: {},
  handler: async (ctx): Promise<{ providersScored: number; logsScanned: number }> => {
    const since = Date.now() - WINDOW_MS;

    const logs: Array<{
      provider: string;
      status: "success" | "error";
      latencyMs: number;
      direction?: string;
    }> = await ctx.runQuery(internal.providerHealth.collectRecent, { since });

    type Bucket = { calls: number; successes: number; latencies: number[] };
    const buckets = new Map<string, Bucket>();

    for (const l of logs) {
      if (l.direction === "inbound") continue;
      if (!l.provider) continue;
      const b = buckets.get(l.provider) ?? { calls: 0, successes: 0, latencies: [] };
      b.calls++;
      if (l.status === "success") b.successes++;
      if (typeof l.latencyMs === "number") b.latencies.push(l.latencyMs);
      buckets.set(l.provider, b);
    }

    const now = Date.now();
    let providersScored = 0;

    for (const [providerId, b] of buckets) {
      const sorted = b.latencies.slice().sort((x, y) => x - y);
      const p50 = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
      const successRate = b.calls > 0 ? b.successes / b.calls : 0;

      await ctx.runMutation(internal.providerHealth.upsertOne, {
        providerId,
        successRate,
        p50LatencyMs: p50,
        callCount: b.calls,
        successCount: b.successes,
        windowDays: WINDOW_DAYS,
        computedAt: now,
      });
      providersScored++;
    }

    return { providersScored, logsScanned: logs.length };
  },
});

/**
 * Public query for the MCP discovery cache to consume.
 * Returns a list shape rather than a Convex-document shape so consumers
 * outside Convex stay decoupled from internal field names.
 *
 * Includes `minCallsForScore` so callers know when to apply the multiplier
 * vs treat a provider as cold-start (no signal yet).
 */
export const getAllPublic = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("providerHealth").collect();
    return {
      minCallsForScore: MIN_CALLS_FOR_SCORE,
      providers: rows.map((r) => ({
        providerId: r.providerId,
        successRate: r.successRate,
        p50LatencyMs: r.p50LatencyMs,
        callCount: r.callCount,
        computedAt: r.computedAt,
      })),
    };
  },
});
