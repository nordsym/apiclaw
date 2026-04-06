import { mutation } from "./_generated/server";

// Backfill searchLogs from apiLogs that have action starting with "discovery:"
export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const APILAYER_WORKSPACE_ID = "n17bf4raa01r0d4na0bsgg117x83y551";

    const apiLogs = await ctx.db
      .query("apiLogs")
      .withIndex("by_workspaceId_createdAt", (q: any) => q.eq("workspaceId", APILAYER_WORKSPACE_ID))
      .collect();

    const discoveryLogs = apiLogs.filter((l: any) =>
      typeof l.action === "string" && l.action.startsWith("discovery:")
    );

    let inserted = 0;
    for (const log of discoveryLogs) {
      const query = (log.action as string).replace("discovery:", "").trim();
      await ctx.db.insert("searchLogs", {
        workspaceId: APILAYER_WORKSPACE_ID as any,
        query,
        resultCount: 1,
        hasResults: true,
        matchedProviders: ["apilayer"],
        responseTimeMs: log.latencyMs || 20,
        timestamp: log.createdAt,
      });
      inserted++;
    }

    return { inserted, total: discoveryLogs.length };
  },
});
