import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Hot-path decontention helpers.
 *
 * Background: `logs:createProxyLog` previously patched workspaces.lastActiveAt
 * and subagents.lastActiveAt on every gateway call, causing 88 OCC retries
 * against the workspaces table in a 9-hour window (per Convex Insights
 * 2026-05-27). The lastActiveAt fields are derivable from apiLogs.createdAt,
 * which is already an append-only insert with no contention.
 *
 * This module rolls those denormalized timestamps forward in a single batched
 * mutation, run from a 5-minute cron. Window is intentionally 6 minutes so a
 * brief cron delay or restart doesn't drop activity.
 */

export const refreshLastActiveFromLogs = internalMutation({
  args: {
    /** Optional override for the window start (ms). Defaults to now - 6min. */
    sinceMs: v.optional(v.number()),
  },
  handler: async (ctx, { sinceMs }) => {
    const since = sinceMs ?? Date.now() - 6 * 60 * 1000;

    const logs = await ctx.db
      .query("apiLogs")
      .withIndex("by_createdAt", (q) => q.gt("createdAt", since))
      .collect();

    if (logs.length === 0) {
      return { scanned: 0, workspacesPatched: 0, subagentsPatched: 0, since };
    }

    // Reduce to per-workspace max(createdAt) and per-(workspace,subagent) max.
    const workspaceMax = new Map<string, number>();
    const subagentMax = new Map<
      string,
      { workspaceId: string; subagentId: string; ts: number }
    >();

    for (const log of logs) {
      const wsKey = log.workspaceId as unknown as string;
      const curWs = workspaceMax.get(wsKey) ?? 0;
      if (log.createdAt > curWs) workspaceMax.set(wsKey, log.createdAt);

      if (
        log.subagentId &&
        log.subagentId !== "unknown" &&
        log.subagentId !== "main"
      ) {
        const subKey = `${wsKey}|${log.subagentId}`;
        const curSub = subagentMax.get(subKey);
        if (!curSub || log.createdAt > curSub.ts) {
          subagentMax.set(subKey, {
            workspaceId: wsKey,
            subagentId: log.subagentId,
            ts: log.createdAt,
          });
        }
      }
    }

    let workspacesPatched = 0;
    for (const [wsId, ts] of workspaceMax) {
      const ws = await ctx.db.get(wsId as any);
      if (!ws) continue;
      const current = (ws as any).lastActiveAt ?? 0;
      if (current < ts) {
        await ctx.db.patch(wsId as any, { lastActiveAt: ts });
        workspacesPatched++;
      }
    }

    let subagentsPatched = 0;
    for (const entry of subagentMax.values()) {
      const sub = await ctx.db
        .query("subagents")
        .withIndex("by_workspaceId_subagentId", (q) =>
          q
            .eq("workspaceId", entry.workspaceId as any)
            .eq("subagentId", entry.subagentId),
        )
        .first();
      if (!sub) continue;
      if (sub.lastActiveAt < entry.ts) {
        await ctx.db.patch(sub._id, { lastActiveAt: entry.ts });
        subagentsPatched++;
      }
    }

    return {
      scanned: logs.length,
      workspacesPatched,
      subagentsPatched,
      since,
    };
  },
});
