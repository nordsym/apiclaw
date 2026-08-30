import { internalAction, internalQuery, internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { checkEmailAllowedSync } from "./emailGuards";
import { welcomeDeliveryIdempotencyKey } from "./nurtureDeliveryKeys";
import {
  sendFounderSignupMailViaResend,
  shouldSendFounderSignupMail,
} from "./founderSignupMail";

/**
 * Fallback for the default founder signup note.
 *
 * The honest send is getOrCreateForClerk first mint. This cron covers a
 * temporary Resend failure on that path. Payload is Gustav's plaintext
 * note, stable per workspace so Resend idempotency stays valid. Success
 * is recorded as nurture "welcome" so the daily sender cannot duplicate it.
 *
 * Runs from a Convex cron every 10 minutes.
 */

const NUDGE_AGE_MIN_MS = 10 * 60 * 1000;    // wait at least 10min after verify
const NUDGE_AGE_MAX_MS = 24 * 60 * 60 * 1000; // give up after 24h

type WelcomeCandidate = {
  _id: Id<"workspaces">;
  email?: string;
  firstName?: string;
};

type WelcomeRunResult = {
  sent: number;
  skipped?: number;
  skipReasons?: Record<string, number>;
  candidates?: number;
  reason?: string;
};

export const sendPostVerifyNudges = internalAction({
  args: {},
  handler: async (ctx): Promise<WelcomeRunResult> => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[postVerifyNudge] RESEND_API_KEY not set");
      return { sent: 0, reason: "missing_api_key" };
    }

    const now = Date.now();
    const since = now - NUDGE_AGE_MAX_MS;
    const cutoff = now - NUDGE_AGE_MIN_MS;

    const candidates = await ctx.runQuery(
      internal.postVerifyNudge.findCandidates,
      { since, cutoff },
    ) as WelcomeCandidate[];

    let sent = 0;
    let skipped = 0;
    const skipReasons: Record<string, number> = {};

    for (const w of candidates) {
      const decision = shouldSendFounderSignupMail({
        email: w.email,
        isNewUser: true,
        alreadySent: false,
      });
      if (!decision.send) {
        skipped++;
        skipReasons[decision.reason || "skipped"] =
          (skipReasons[decision.reason || "skipped"] ?? 0) + 1;
        continue;
      }

      const delivery = await sendFounderSignupMailViaResend({
        apiKey,
        to: w.email!,
        firstName: w.firstName,
        idempotencyKey: welcomeDeliveryIdempotencyKey(String(w._id)),
      });
      if (!delivery.ok) {
        console.error(`[postVerifyNudge] ${delivery.reason} for ${w.email}`);
        skipped++;
        skipReasons[delivery.reason] = (skipReasons[delivery.reason] ?? 0) + 1;
        continue;
      }

      const mark = await ctx.runMutation(internal.postVerifyNudge.markSent, {
        workspaceId: w._id,
      }) as { success: boolean; alreadyMarked?: boolean; reason?: string };
      if (mark.success && !mark.alreadyMarked) {
        sent++;
      } else {
        skipped++;
        const reason = mark.alreadyMarked ? "already_marked" : mark.reason || "mark_failed";
        skipReasons[reason] = (skipReasons[reason] ?? 0) + 1;
      }
    }

    return { sent, skipped, skipReasons, candidates: candidates.length };
  },
});

/**
 * Find workspaces that authenticated between (now - 24h) and (now - 10min)
 * and never received the canonical welcome.
 */
export const findCandidates = internalQuery({
  args: { since: v.number(), cutoff: v.number() },
  handler: async (ctx, { since, cutoff }) => {
    // workspace_authenticated is emitted server-side for every successful
    // auth door. Historical backfills are deliberately excluded so a data
    // repair can never contact an existing user.
    const verifies = await ctx.db
      .query("funnelEvents")
      .withIndex("by_event_timestamp", (q) =>
        q.eq("event", "workspace_authenticated").gte("timestamp", since),
      )
      .filter((q) => q.lte(q.field("timestamp"), cutoff))
      .collect();

    const out: Array<{ _id: any; email: string | undefined; firstName?: string }> = [];
    const seen = new Set<string>();

    for (const v of verifies) {
      if ((v.props as any)?.backfilled === true) continue;
      const wsId = v.workspaceId as any;
      if (!wsId) continue;
      const key = String(wsId);
      if (seen.has(key)) continue;
      seen.add(key);

      const ws = await ctx.db.get(wsId);
      if (!ws) continue;
      if ((ws as any).postVerifyNudgeSentAt) continue;
      if ((ws as any).tier === "partner" || (ws as any).tier === "enterprise") continue;
      if (!(ws as any).email || !checkEmailAllowedSync((ws as any).email).allowed) continue;
      if (!shouldSendFounderSignupMail({
        email: (ws as any).email,
        isNewUser: true,
        tier: (ws as any).tier,
      }).send) continue;

      // Share one lifecycle ledger with the daily nurture sequence. A prior
      // welcome or explicit opt-out always wins over this fallback path.
      const nurture = await ctx.db
        .query("nurture")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", wsId))
        .first();
      if (nurture?.unsubscribed) continue;
      if (nurture?.stage === "partner-locked" || nurture?.stage === "excluded") continue;
      if (nurture?.lastEmailKind === "welcome") continue;

      out.push({
        _id: ws._id,
        email: (ws as any).email,
        firstName: (ws as any).firstName,
      });
    }
    return out;
  },
});

export async function markPostAuthWelcomeInTransaction(
  ctx: Pick<MutationCtx, "db">,
  workspaceId: Id<"workspaces">,
  now = Date.now(),
) {
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) return { success: false, reason: "workspace_not_found" as const };

  const existing = await ctx.db
    .query("nurture")
    .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
    .first();

  if (workspace.postVerifyNudgeSentAt || existing?.lastEmailKind === "welcome") {
    return {
      success: true,
      alreadyMarked: true,
      nurtureId: existing?._id,
      inserted: false,
    };
  }
  if (existing?.unsubscribed || existing?.stage === "partner-locked" || existing?.stage === "excluded") {
    return { success: false, reason: "nurture_excluded" as const };
  }

  await ctx.db.patch(workspaceId, { postVerifyNudgeSentAt: now });

  if (existing) {
    await ctx.db.patch(existing._id, {
      email: workspace.email || existing.email,
      emailsSent: existing.emailsSent + 1,
      lastEmailSentAt: now,
      lastEmailKind: "welcome",
      updatedAt: now,
    });
    return { success: true, nurtureId: existing._id, inserted: false };
  }

  const nurtureId = await ctx.db.insert("nurture", {
    workspaceId,
    email: workspace.email || undefined,
    stage: "new",
    lastActivityAt: workspace.lastActiveAt,
    emailsSent: 1,
    lastEmailSentAt: now,
    lastEmailKind: "welcome",
    unsubscribed: false,
    notes: "post-auth welcome recorded by 10-minute activation nudge",
    createdAt: now,
    updatedAt: now,
  });

  return { success: true, nurtureId, inserted: true };
}

export const markSent = internalMutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    return await markPostAuthWelcomeInTransaction(ctx, workspaceId);
  },
});
