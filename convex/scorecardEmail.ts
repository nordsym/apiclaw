"use node";
import { internalAction } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * A-13 — Weekly scorecard email.
 *
 * Reads funnel:getScorecard for the last 168h (human-classified, with WoW
 * comparison) and emails the result to gustav@nordsym.com via Resend.
 * Scheduled by crons.ts to run every Monday at 08:00 UTC (10:00 CEST).
 *
 * Funnel queries existed before this but nobody was reading them; the goal
 * is just to put them in front of an operator's eyes once a week.
 */

const RECIPIENT = "gustav@nordsym.com";
const EMAIL_FROM = "noreply@apiclaw.cloud";

function arrow(delta: number): string {
  if (delta > 0) return `▲ +${delta}`;
  if (delta < 0) return `▼ ${delta}`;
  return "= 0";
}

function pct(numer: number, denom: number): string {
  if (!denom) return "—";
  return ((numer / denom) * 100).toFixed(1) + "%";
}

function renderHtml(s: any): string {
  const truth = s.truth ?? {};
  const vanity = s.vanity ?? {};
  const ratios = s.ratios ?? {};
  const diagnostics = s.diagnostics ?? {};
  const prev = s.previous?.truth ?? {};

  const installsDelta = (truth.installs ?? 0) - (prev.installs ?? 0);
  const ownersDelta = (truth.activatedOwners ?? 0) - (prev.activatedOwners ?? 0);
  const usersDelta = (truth.activatedUsers ?? 0) - (prev.activatedUsers ?? 0);

  const diagRows = Object.entries(diagnostics)
    .map(([event, reasons]: [string, any]) => {
      const reasonStrs = Object.entries(reasons)
        .map(([r, c]) => `${r}: ${c}`)
        .join(", ");
      return `<tr><td style="padding:6px 12px;border-bottom:1px solid #1F1F1F;font-family:'JetBrains Mono',monospace;font-size:13px;color:#FAFAFA">${event}</td><td style="padding:6px 12px;border-bottom:1px solid #1F1F1F;font-size:13px;color:#A3A3A3">${reasonStrs}</td></tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:32px;background:#0A0A0A;color:#FAFAFA;font-family:Inter,system-ui,sans-serif">
<div style="max-width:640px;margin:0 auto">
  <h1 style="font-size:24px;font-weight:700;letter-spacing:-0.02em;margin:0 0 4px;color:#FAFAFA">APIClaw weekly scorecard 🦞</h1>
  <p style="font-size:14px;color:#737373;margin:0 0 32px">${new Date(s.generatedAt).toISOString().slice(0,10)} · last 168h · human-classified · vs previous week</p>

  <h2 style="font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#EF4444;margin:0 0 12px">Truth metrics</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#A3A3A3;font-size:14px">Installs (human)</td><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#FAFAFA;text-align:right;font-weight:600">${truth.installs ?? 0}</td><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#737373;text-align:right;font-size:13px">${arrow(installsDelta)}</td></tr>
    <tr><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#A3A3A3;font-size:14px">Activated owners (verify_code)</td><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#FAFAFA;text-align:right;font-weight:600">${truth.activatedOwners ?? 0}</td><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#737373;text-align:right;font-size:13px">${arrow(ownersDelta)}</td></tr>
    <tr><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#A3A3A3;font-size:14px">Activated users (first_call_api_success)</td><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#EF4444;text-align:right;font-weight:700">${truth.activatedUsers ?? 0}</td><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#737373;text-align:right;font-size:13px">${arrow(usersDelta)}</td></tr>
  </table>

  <h2 style="font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#EF4444;margin:0 0 12px">Conversion ratios</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#A3A3A3;font-size:14px">Install → verify</td><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#FAFAFA;text-align:right;font-weight:600">${pct(truth.activatedOwners ?? 0, truth.installs ?? 0)}</td></tr>
    <tr><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#A3A3A3;font-size:14px">Verify → first call</td><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#FAFAFA;text-align:right;font-weight:600">${pct(truth.activatedUsers ?? 0, truth.activatedOwners ?? 0)}</td></tr>
    <tr><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#A3A3A3;font-size:14px">Install → first call (end-to-end)</td><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#FAFAFA;text-align:right;font-weight:600">${pct(truth.activatedUsers ?? 0, truth.installs ?? 0)}</td></tr>
  </table>

  <h2 style="font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#EF4444;margin:0 0 12px">Diagnostics</h2>
  ${diagRows ? `<table style="width:100%;border-collapse:collapse;margin-bottom:24px">${diagRows}</table>` : `<p style="font-size:13px;color:#737373;margin:0 0 24px">No diagnostic events fired this window.</p>`}

  <p style="font-size:12px;color:#525252;margin:32px 0 0;border-top:1px solid #1F1F1F;padding-top:16px">Source: <code style="font-family:'JetBrains Mono',monospace;color:#A3A3A3">funnel:getScorecard</code> · Generated ${new Date(s.generatedAt).toISOString()}</p>
</div>
</body></html>`;
}

export const sendWeeklyScorecard = internalAction({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[scorecardEmail] RESEND_API_KEY not set");
      return { sent: false, reason: "missing_api_key" };
    }

    const scorecard: any = await ctx.runQuery(api.funnel.getScorecard, {
      hoursBack: 168,
      classification: "human",
      compare: true,
    });

    const activated = scorecard.truth?.activatedUsers ?? 0;
    const subject = `APIClaw weekly scorecard — ${activated} activated users`;
    const html = renderHtml(scorecard);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: RECIPIENT,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[scorecardEmail] Resend ${response.status}:`, errorText);
      return { sent: false, reason: `resend_${response.status}`, error: errorText };
    }

    const result = (await response.json()) as { id?: string };
    return { sent: true, resendId: result.id, activatedUsers: activated };
  },
});
