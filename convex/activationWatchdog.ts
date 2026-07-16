import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { checkEmailAllowedSync } from "./emailGuards";

export const STALLED_MIN_AGE_MS = 60 * 60 * 1000;
export const STALLED_MAX_AGE_MS = 48 * 60 * 60 * 1000;
const MAX_ALERTS_PER_RUN = 10;

type StalledCandidate = {
  workspaceId: Id<"workspaces">;
  email: string;
  tier: string;
  authenticatedAt: number;
  welcomeSent: boolean;
};

type WatchdogResult = {
  dryRun: boolean;
  candidates: number;
  delivered: number;
  failed: number;
};

export function isEligibleAuthEvent(event: {
  classification?: string;
  props?: unknown;
}) {
  return event.classification === "human" &&
    (event.props as { backfilled?: boolean } | undefined)?.backfilled !== true;
}

export const findCandidates = internalQuery({
  args: {
    since: v.number(),
    cutoff: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { since, cutoff, limit = MAX_ALERTS_PER_RUN }) => {
    const authEvents = await ctx.db
      .query("funnelEvents")
      .withIndex("by_event_timestamp", (q) =>
        q.eq("event", "workspace_authenticated").gte("timestamp", since),
      )
      .filter((q) => q.lte(q.field("timestamp"), cutoff))
      .collect();

    const candidates: Array<{
      workspaceId: any;
      email: string;
      tier: string;
      authenticatedAt: number;
      welcomeSent: boolean;
    }> = [];
    const seen = new Set<string>();

    for (const event of authEvents) {
      if (candidates.length >= Math.min(limit, MAX_ALERTS_PER_RUN)) break;
      if (!isEligibleAuthEvent(event)) continue;
      if (!event.workspaceId) continue;

      const key = String(event.workspaceId);
      if (seen.has(key)) continue;
      seen.add(key);

      const workspace = await ctx.db.get(event.workspaceId);
      if (!workspace || workspace.status !== "active") continue;
      if (workspace.activationStalledAlertSentAt) continue;
      if (workspace.tier === "partner" || workspace.tier === "enterprise") continue;
      if (!checkEmailAllowedSync(workspace.email).allowed) continue;

      const firstCall = await ctx.db
        .query("funnelEvents")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", event.workspaceId))
        .filter((q) => q.eq(q.field("event"), "first_call_api_success"))
        .first();
      if (firstCall) continue;

      candidates.push({
        workspaceId: workspace._id,
        email: workspace.email,
        tier: workspace.tier,
        authenticatedAt: event.timestamp,
        welcomeSent: Boolean(workspace.postVerifyNudgeSentAt),
      });
    }

    return candidates;
  },
});

export const markAlertDelivered = internalMutation({
  args: { workspaceId: v.id("workspaces"), deliveredAt: v.number() },
  handler: async (ctx, { workspaceId, deliveredAt }) => {
    const workspace = await ctx.db.get(workspaceId);
    if (!workspace || workspace.activationStalledAlertSentAt) {
      return { marked: false };
    }
    await ctx.db.patch(workspaceId, {
      activationStalledAlertSentAt: deliveredAt,
      updatedAt: Math.max(workspace.updatedAt, deliveredAt),
    });
    return { marked: true };
  },
});

export const checkForStalledActivations = internalAction({
  args: { dryRun: v.optional(v.boolean()) },
  handler: async (ctx, { dryRun = false }): Promise<WatchdogResult> => {
    const now = Date.now();
    const candidates = await ctx.runQuery(internal.activationWatchdog.findCandidates, {
      since: now - STALLED_MAX_AGE_MS,
      cutoff: now - STALLED_MIN_AGE_MS,
      limit: MAX_ALERTS_PER_RUN,
    }) as StalledCandidate[];

    if (dryRun) {
      return {
        dryRun: true,
        candidates: candidates.length,
        delivered: 0,
        failed: 0,
      };
    }

    let delivered = 0;
    let failed = 0;
    for (const candidate of candidates) {
      const result = await ctx.runAction(internal.inbound.notifyActivationStalled, {
        email: candidate.email,
        workspaceId: String(candidate.workspaceId),
        tier: candidate.tier,
        timestamp: now,
        authenticatedAt: candidate.authenticatedAt,
        stalledMinutes: Math.floor((now - candidate.authenticatedAt) / 60_000),
        welcomeSent: candidate.welcomeSent,
      });

      if (!result.delivered) {
        failed++;
        continue;
      }

      await ctx.runMutation(internal.activationWatchdog.markAlertDelivered, {
        workspaceId: candidate.workspaceId,
        deliveredAt: now,
      });
      delivered++;
    }

    return { dryRun: false, candidates: candidates.length, delivered, failed };
  },
});
