import { query } from "./_generated/server";
export const run = query({
  args: {},
  handler: async (ctx) => {
    const ws = await ctx.db.query("workspaces").collect();
    return ws.map((w) => ({
      id: w._id,
      email: (w as any).email || (w as any).ownerEmail || null,
      name: (w as any).name || (w as any).workspaceName || null,
      createdAt: w._creationTime,
    }));
  },
});
