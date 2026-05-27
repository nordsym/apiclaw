import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { checkEmailAllowedSync } from "./emailGuards";

/**
 * A-15 — Post-verify onboarding nudge.
 *
 * If a workspace fired verify_code more than 10 minutes ago but never fired
 * first_call_api_success, send a single Resend email with a 3-line agent
 * recipe. Marks workspaces.postVerifyNudgeSentAt so we never send twice.
 *
 * Runs from a Convex cron every 10 minutes. Uses the same email-safety
 * guard as scorecardEmail / spendAlerts.
 */

const EMAIL_FROM = "APIClaw <noreply@apiclaw.cloud>";
const NUDGE_AGE_MIN_MS = 10 * 60 * 1000;    // wait at least 10min after verify
const NUDGE_AGE_MAX_MS = 24 * 60 * 60 * 1000; // give up after 24h

function renderHtml(): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:32px;background:#0A0A0A;color:#FAFAFA;font-family:Inter,system-ui,sans-serif">
<div style="max-width:560px;margin:0 auto">
  <h1 style="font-size:24px;font-weight:700;letter-spacing:-0.02em;margin:0 0 16px;color:#FAFAFA">Your APIClaw workspace is live 🦞</h1>
  <p style="font-size:15px;color:#A3A3A3;margin:0 0 24px;line-height:1.6">You verified your email but haven't made an API call yet. Paste this into your agent right now — takes about ten seconds:</p>

  <div style="background:#141414;border:1px solid #262626;border-radius:12px;padding:20px;margin-bottom:24px">
    <p style="font-family:'JetBrains Mono',monospace;font-size:13px;color:#F5F5F5;margin:0;line-height:1.7">Use APIClaw to find an API for sending<br>SMS to Sweden, then call it with the<br>message "hello from APIClaw".</p>
  </div>

  <p style="font-size:14px;color:#737373;margin:0 0 16px;line-height:1.6">Your agent will:</p>
  <ol style="font-size:14px;color:#A3A3A3;margin:0 0 24px;padding-left:20px;line-height:1.8">
    <li><code style="font-family:'JetBrains Mono',monospace;color:#EF4444">discover_apis("send sms sweden")</code> — finds the right provider</li>
    <li><code style="font-family:'JetBrains Mono',monospace;color:#EF4444">call_api(provider, "send_sms", ...)</code> — runs the call through APIClaw</li>
  </ol>

  <p style="font-size:14px;color:#A3A3A3;margin:0 0 24px;line-height:1.6">No keys needed. 25 calls per month free. Pay-as-you-go beyond that at API cost + 15%.</p>

  <p style="font-size:13px;color:#525252;margin:32px 0 0;border-top:1px solid #1F1F1F;padding-top:16px">Stuck? Reply to this email or open <a href="https://apiclaw.cloud/docs" style="color:#EF4444;text-decoration:none">apiclaw.cloud/docs</a>.</p>
</div>
</body></html>`;
}

export const sendPostVerifyNudges = internalAction({
  args: {},
  handler: async (ctx) => {
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
    );

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

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: w.email,
          subject: "Your APIClaw workspace is ready — try this prompt",
          html: renderHtml(),
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

      await ctx.runMutation(internal.postVerifyNudge.markSent, {
        workspaceId: w._id,
      });
      sent++;
    }

    return { sent, skipped, skipReasons, candidates: candidates.length };
  },
});

/**
 * Find workspaces that verified between (now - 24h) and (now - 10min) but
 * never fired first_call_api_success and never received this nudge.
 */
import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const findCandidates = internalQuery({
  args: { since: v.number(), cutoff: v.number() },
  handler: async (ctx, { since, cutoff }) => {
    const verifies = await ctx.db
      .query("funnelEvents")
      .withIndex("by_event_timestamp", (q) =>
        q.eq("event", "verify_code").gte("timestamp", since),
      )
      .filter((q) => q.lte(q.field("timestamp"), cutoff))
      .collect();

    const out: Array<{ _id: any; email: string | undefined }> = [];
    const seen = new Set<string>();

    for (const v of verifies) {
      const wsId = v.workspaceId as any;
      if (!wsId) continue;
      const key = String(wsId);
      if (seen.has(key)) continue;
      seen.add(key);

      const ws = await ctx.db.get(wsId);
      if (!ws) continue;
      if ((ws as any).postVerifyNudgeSentAt) continue;

      // Skip if this workspace already fired first_call_api_success at any
      // point — even before the verify event we're scanning, in case of
      // out-of-order processing.
      const firstCall = await ctx.db
        .query("funnelEvents")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", wsId))
        .filter((q) => q.eq(q.field("event"), "first_call_api_success"))
        .first();
      if (firstCall) continue;

      out.push({ _id: ws._id, email: (ws as any).email });
    }
    return out;
  },
});

export const markSent = internalMutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    await ctx.db.patch(workspaceId, { postVerifyNudgeSentAt: Date.now() });
  },
});
