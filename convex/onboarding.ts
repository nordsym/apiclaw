import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Resolve sessionToken → workspaceId, shared by all handlers below.
async function workspaceFromToken(ctx: any, token: string) {
  const session = await ctx.db
    .query("agentSessions")
    .withIndex("by_sessionToken", (q: any) => q.eq("sessionToken", token))
    .first();
  if (!session) return null;
  const ws = await ctx.db.get(session.workspaceId);
  return ws || null;
}

// Read current state. Returns null if no valid session.
export const getState = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const ws = await workspaceFromToken(ctx, token);
    if (!ws) return null;
    return {
      completedAt: ws.onboardingCompletedAt ?? null,
      dismissedAt: ws.onboardingDismissedAt ?? null,
      source: ws.onboardingSource ?? null,
      building: ws.onboardingBuilding ?? null,
    };
  },
});

// Step 1: store source ("How did you find us")
export const setSource = mutation({
  args: { token: v.string(), source: v.string() },
  handler: async (ctx, { token, source }) => {
    const ws = await workspaceFromToken(ctx, token);
    if (!ws) return { ok: false };
    await ctx.db.patch(ws._id, {
      onboardingSource: source.slice(0, 200),
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

// Step 2: store what user is building
export const setBuilding = mutation({
  args: { token: v.string(), building: v.string() },
  handler: async (ctx, { token, building }) => {
    const ws = await workspaceFromToken(ctx, token);
    if (!ws) return { ok: false };
    await ctx.db.patch(ws._id, {
      onboardingBuilding: building.slice(0, 500),
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

// Mark wizard fully complete.
export const complete = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const ws = await workspaceFromToken(ctx, token);
    if (!ws) return { ok: false };
    await ctx.db.patch(ws._id, {
      onboardingCompletedAt: Date.now(),
      onboardingDismissedAt: undefined,
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});

// "Skip for now" — show toast next time, not full wizard.
export const dismiss = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const ws = await workspaceFromToken(ctx, token);
    if (!ws) return { ok: false };
    await ctx.db.patch(ws._id, {
      onboardingDismissedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});
