import { mutation } from "./_generated/server";

/**
 * Update providerAPIs status to reflect actual Direct Call status
 * Run: npx convex run updateAPIStatus:update
 */
export const update = mutation({
  args: {},
  handler: async (ctx) => {
    const providerId = "k97cvcvadnyz8x8m4we7xqmh1s83p0ph" as any; // APILayer

    const apis = await ctx.db
      .query("providerAPIs")
      .withIndex("by_providerId", (q: any) => q.eq("providerId", providerId))
      .collect();

    // APIs that are blocked by subscription tier
    const blocked = ["Number Verification API", "World News API", "Image Crop API", "Form API"];
    // PDF Layer is rate limited
    const rateLimited = ["PDF Layer"];

    let updated = 0;
    for (const api of apis) {
      let newStatus = "approved"; // default = live
      let hasDirectCall = true;

      if (blocked.includes(api.name)) {
        newStatus = "blocked";
        hasDirectCall = false;
      } else if (rateLimited.includes(api.name)) {
        newStatus = "rate_limited";
      }

      if (api.status !== newStatus || api.hasDirectCall !== hasDirectCall) {
        await ctx.db.patch(api._id, {
          status: newStatus,
          hasDirectCall,
        });
        updated++;
      }
    }

    return { success: true, updated, total: apis.length };
  },
});
