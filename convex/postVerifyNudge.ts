import { internalAction, internalQuery, internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { checkEmailAllowedSync } from "./emailGuards";
import {
  nurtureUnsubscribeUrl,
  welcomeDeliveryIdempotencyKey,
} from "./nurtureDeliveryKeys";
import {
  FREE_MANAGED_CALLS_LIFETIME,
  FREE_MANAGED_PROVIDER_COST_CAP_USD,
  PAYG_MARGIN_RATE,
} from "../src/product-truth";

/**
 * A-15 - Post-verify onboarding nudge.
 *
 * If a workspace authenticated more than 10 minutes ago, send one welcome
 * email. The payload is stable per workspace so Resend idempotency remains
 * valid even if activation state changes during a retry. The successful send
 * is also recorded as the nurture "welcome"
 * email so the daily lifecycle sender cannot send a duplicate welcome and
 * its 72-hour spacing and three-email cap apply to the whole sequence.
 *
 * Runs from a Convex cron every 10 minutes. Uses the same email-safety
 * guard as scorecardEmail / spendAlerts.
 */

const EMAIL_FROM = "APIClaw <noreply@apiclaw.cloud>";
const PAYG_MARGIN_PERCENT = PAYG_MARGIN_RATE * 100;
const NUDGE_AGE_MIN_MS = 10 * 60 * 1000;    // wait at least 10min after verify
const NUDGE_AGE_MAX_MS = 24 * 60 * 60 * 1000; // give up after 24h

type WelcomeCandidate = {
  _id: Id<"workspaces">;
  email?: string;
  activated: boolean;
};

type WelcomeRunResult = {
  sent: number;
  skipped?: number;
  skipReasons?: Record<string, number>;
  candidates?: number;
  reason?: string;
};

export function renderWelcomeHtml(_activated: boolean, unsubscribeUrl: string): string {
  const intro = "Your workspace, gateway, and usage tracking are live. Paste this into your agent for a useful first run:";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:32px;background:#0A0A0A;color:#FAFAFA;font-family:Inter,system-ui,sans-serif">
<div style="max-width:560px;margin:0 auto">
  <h1 style="font-size:24px;font-weight:700;letter-spacing:-0.02em;margin:0 0 16px;color:#FAFAFA">Your APIClaw workspace is live 🦞</h1>
  <p style="font-size:15px;color:#A3A3A3;margin:0 0 24px;line-height:1.6">${intro}</p>

  <div style="background:#141414;border:1px solid #262626;border-radius:12px;padding:20px;margin-bottom:24px">
    <p style="font-family:'JetBrains Mono',monospace;font-size:13px;color:#F5F5F5;margin:0;line-height:1.7">Use APIClaw's managed Brave Search adapter with the query "AI agent infrastructure news", then summarize the top 3 results with source links.</p>
  </div>

  <p style="font-size:14px;color:#A3A3A3;margin:0 0 24px;line-height:1.6">Your workspace includes up to ${FREE_MANAGED_CALLS_LIFETIME} lifetime managed calls, subject to a $${FREE_MANAGED_PROVIDER_COST_CAP_USD} total underlying provider-cost cap. Discovery is free. Billing-ready actions can continue at provider cost + ${PAYG_MARGIN_PERCENT}% when the allowance is exhausted.</p>

  <p style="font-size:13px;color:#525252;margin:32px 0 0;border-top:1px solid #1F1F1F;padding-top:16px">Need help? Open <a href="https://apiclaw.cloud/docs" style="color:#EF4444;text-decoration:none">apiclaw.cloud/docs</a>.<br/><a href="${unsubscribeUrl}" style="color:#737373">Unsubscribe from lifecycle email</a>.</p>
</div>
</body></html>`;
}

export const sendPostVerifyNudges = internalAction({
  args: {},
  handler: async (ctx): Promise<WelcomeRunResult> => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[postVerifyNudge] RESEND_API_KEY not set");
      return { sent: 0, reason: "missing_api_key" };
    }
    const unsubscribeSecret = process.env.APICLAW_PSEUDONYM_SECRET;
    if (!unsubscribeSecret) {
      console.error("[postVerifyNudge] unsubscribe signing secret not set");
      return { sent: 0, reason: "missing_unsubscribe_secret" };
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
      if (!w.email) {
        skipped++;
        skipReasons.no_email = (skipReasons.no_email ?? 0) + 1;
        continue;
      }
      const guard = checkEmailAllowedSync(w.email);
      if (!guard.allowed) {
        skipped++;
        skipReasons[guard.reason] = (skipReasons[guard.reason] ?? 0) + 1;
        continue;
      }

      const unsubscribeUrl = await nurtureUnsubscribeUrl(String(w._id), unsubscribeSecret);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": welcomeDeliveryIdempotencyKey(String(w._id)),
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: w.email,
          subject: "Your APIClaw workspace is ready - try this prompt",
          html: renderWelcomeHtml(w.activated, unsubscribeUrl),
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[postVerifyNudge] Resend ${response.status} for ${w.email}:`,
          errorText,
        );
        skipped++;
        skipReasons[`resend_${response.status}`] =
          (skipReasons[`resend_${response.status}`] ?? 0) + 1;
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

    const out: Array<{ _id: any; email: string | undefined; activated: boolean }> = [];
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

      // Share one lifecycle ledger with the daily nurture sequence. A prior
      // welcome or explicit opt-out always wins over this faster 10-minute
      // path, preventing duplicate welcome emails.
      const nurture = await ctx.db
        .query("nurture")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", wsId))
        .first();
      if (nurture?.unsubscribed) continue;
      if (nurture?.stage === "partner-locked" || nurture?.stage === "excluded") continue;
      if (nurture?.lastEmailKind === "welcome") continue;

      // Activation changes the welcome copy but never suppresses the welcome.
      const firstCall = await ctx.db
        .query("funnelEvents")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", wsId))
        .filter((q) => q.eq(q.field("event"), "first_call_api_success"))
        .first();

      out.push({ _id: ws._id, email: (ws as any).email, activated: Boolean(firstCall) });
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
