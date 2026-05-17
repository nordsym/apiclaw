import { mutation } from "./_generated/server";

/**
 * Update providerAPIs status to reflect actual managed-provider status
 * Run: npx convex run updateAPIStatus:update
 */
export const update = mutation({
  args: {},
  handler: async (ctx) => {
    // APIs that are blocked by subscription tier
    const blocked = ["Number Verification API", "World News API", "Image Crop API", "Form API", "Skills API"];
    // PDF Layer is rate limited
    const rateLimited = ["PDF Layer"];

    const providerIds = [
      "k97cvcvadnyz8x8m4we7xqmh1s83p0ph", // OG APILayer (gustav_hemmingsson@hotmail.com)
      "k97fj3bpy1nvp6fd1vr51kbkxs84k5dn", // Pratham (apilayer.com partner workspace)
    ] as any[];

    let updated = 0;
    let total = 0;

    for (const providerId of providerIds) {
      const apis = await ctx.db
        .query("providerAPIs")
        .withIndex("by_providerId", (q: any) => q.eq("providerId", providerId))
        .collect();
      total += apis.length;

      for (const api of apis) {
        let newStatus = "approved";
        if (blocked.includes(api.name)) newStatus = "blocked";
        else if (rateLimited.includes(api.name)) newStatus = "rate_limited";

        if (api.status !== newStatus) {
          await ctx.db.patch(api._id, { status: newStatus } as any);
          updated++;
        }
      }
    }

    return { success: true, updated, total };
  },
});
