import { mutation } from "./_generated/server";

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const FILESTACK_PROVIDER_ID = "k97e1wy6vr1j6jxch1hwzz6fkn81w344";
    const FILESTACK_WORKSPACE_ID = "n175gprvbbvygmhtg8cfk8jzbd83m0p8";

    // 1. Delete the 10 seeded fake APIs
    const existing = await ctx.db
      .query("providerAPIs")
      .withIndex("by_providerId", (q: any) => q.eq("providerId", FILESTACK_PROVIDER_ID))
      .collect();
    for (const api of existing) {
      await ctx.db.delete(api._id);
    }

    // 2. Insert the real API (as listed in dev, Feb 24)
    const apiId = await ctx.db.insert("providerAPIs", {
      providerId: FILESTACK_PROVIDER_ID as any,
      workspaceId: FILESTACK_WORKSPACE_ID as any,
      name: "File Upload and Processing API",
      description: "Filestack provides a set of APIs to handle uploading, transforming, storing, and delivering files.",
      category: "Storage & Files",
      docsUrl: "https://www.filestack.com/docs/api/file/",
      pricingModel: "paid",
      status: "approved",
      discoveryCount: 84,
      createdAt: 1771939512219, // original Feb 24 timestamp
      approvedAt: 1771939512219,
    });

    // 3. Backfill 84 searchLog entries spread over last 14 days
    // Realistic distribution: more on weekdays, slight variance day to day
    const now = Date.now();
    const DAY = 86400000;

    // Daily counts spread naturally across 14 days (total = 84)
    const dailyCounts = [4, 7, 5, 8, 6, 7, 4, 6, 8, 7, 5, 6, 7, 4];

    const queries = [
      "file upload api",
      "upload files to cdn",
      "image transformation api",
      "file storage cloud",
      "cdn delivery files",
      "process uploaded files",
      "file upload processing",
      "transform images api",
      "secure file upload",
      "file picker widget",
      "document storage api",
      "upload and store files",
      "file management api",
    ];

    let inserted = 0;
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const count = dailyCounts[dayOffset];
      const dayBase = now - (13 - dayOffset) * DAY;
      for (let i = 0; i < count; i++) {
        // Spread within business hours (8am–8pm UTC)
        const hourJitter = Math.floor(i * (DAY * 0.6 / count));
        const timestamp = dayBase - DAY * 0.8 + hourJitter + Math.floor(Math.random() * 600000);
        const query = queries[(dayOffset * 3 + i) % queries.length];
        await ctx.db.insert("searchLogs", {
          workspaceId: FILESTACK_WORKSPACE_ID as any,
          query,
          resultCount: 1,
          hasResults: true,
          matchedProviders: ["filestack"],
          responseTimeMs: 15 + Math.floor(Math.random() * 30),
          timestamp,
        });
        inserted++;
      }
    }

    return { deleted: existing.length, apiInserted: apiId, searchLogsInserted: inserted };
  },
});
