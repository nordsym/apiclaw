import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Seed registry-final.json entries into providerAPIs as listingStatus="indexed".
 *
 * These are NOT callable in production. They represent the discovery pipeline:
 *   indexed  → known API, advertised to agents via /v1/discover
 *   callable → runtime adapter + param mapping wired (still not smoke-tested)
 *   live     → verified traffic via /proxy/* or /v1/execute
 *
 * Call in batches of ~100–500 from scripts/seed-indexed-registry.mjs.
 * Idempotent on (name, category) — existing entries are skipped, not duplicated.
 */
export const upsertBatch = mutation({
  args: {
    entries: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        category: v.string(),
        baseUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { entries }) => {
    const now = Date.now();
    let inserted = 0;
    let skipped = 0;

    for (const entry of entries) {
      // Dedupe by (name, category) — registry has name-collisions across categories
      const existing = await ctx.db
        .query("providerAPIs")
        .withIndex("by_category", (q) => q.eq("category", entry.category))
        .collect();
      const dup = existing.find((e) => e.name === entry.name);
      if (dup) {
        skipped++;
        continue;
      }

      await ctx.db.insert("providerAPIs", {
        name: entry.name,
        description: entry.description,
        category: entry.category,
        docsUrl: entry.baseUrl,
        pricingModel: "unknown",
        status: "active",
        listingStatus: "indexed",
        discoveryCount: 0,
        createdAt: now,
      });
      inserted++;
    }

    return { inserted, skipped, total: entries.length };
  },
});

/**
 * Report current pipeline distribution. Used by the briefing / dashboard to show
 * "20k indexed → 1.5k callable pipeline → 46 live".
 */
export const pipelineCounts = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("providerAPIs").collect();
    const counts: Record<string, number> = { indexed: 0, callable: 0, live: 0, unclassified: 0 };
    for (const api of all) {
      const s = api.listingStatus ?? "unclassified";
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return { total: all.length, ...counts };
  },
});
