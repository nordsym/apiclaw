/**
 * Public query that exposes live managed-provider rows in a lean shape
 * for the MCP-side discovery cache. Closes the gap where managed
 * providers (GenPRD, the APILayer stack, etc.) were invisible to
 * discover_apis because the npm-side scanner only reads apis.json.
 *
 * The discovery cache in src/discovery.ts polls this endpoint every
 * 15 minutes and merges results with the static registry before ranking.
 * Returns only what the scorer needs — no secrets, no encrypted master
 * keys, no providerDirectCall fields.
 */
import { query } from "./_generated/server";

export const listForDiscovery = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("providerAPIs")
      .withIndex("by_listingStatus", (q) => q.eq("listingStatus", "live"))
      .collect();

    // Only managed-routed rows belong in discover_apis' managed bucket.
    // Open APIs live in apis.json and are scanned locally; including
    // them here would duplicate.
    const managed = rows.filter(
      (r) => r.authType === "managed" && r.status === "active",
    );

    return managed.map((r) => ({
      providerName: r.name,
      description: r.description,
      category: r.category,
      docsUrl: r.docsUrl ?? "",
      baseUrl: r.baseUrl ?? "",
      providerAPIId: r._id,
    }));
  },
});
