import { mutation } from "./_generated/server";

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const APILAYER_WORKSPACE_ID = "n17bf4raa01r0d4na0bsgg117x83y551";

    const events = await ctx.db
      .query("analytics")
      .withIndex("by_provider", (q) => q.eq("provider", "apilayer"))
      .collect();

    let patched = 0;
    for (const e of events) {
      if (!e.workspaceId) {
        await ctx.db.patch(e._id, { workspaceId: APILAYER_WORKSPACE_ID as any });
        patched++;
      }
    }
    return { patched };
  },
});
