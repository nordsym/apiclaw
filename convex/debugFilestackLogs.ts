import { query } from "./_generated/server";
export const run = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db
      .query("apiLogs")
      .withIndex("by_workspaceId_createdAt", (q: any) => q.eq("workspaceId", "n175gprvbbvygmhtg8cfk8jzbd83m0p8"))
      .collect();
    const byAction: Record<string, number> = {};
    for (const l of logs) {
      const k = (l.action || "?").startsWith("discovery:") ? "discovery" : (l.action || "?");
      byAction[k] = (byAction[k] || 0) + 1;
    }
    return { total: logs.length, byAction, sample: logs.slice(0,3).map((l: any) => ({ action: l.action, createdAt: l.createdAt })) };
  },
});
