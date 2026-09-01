"use node";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  renderDailyScorecardHtml,
  renderDailyScorecardSubject,
  renderDailyScorecardText,
  windowFromQueries,
} from "./dailyScorecard";

/**
 * A-13 — Weekly scorecard email.
 *
 * Reads funnel and managed-cost truth, then emails it to the operator.
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
  if (!denom) return "n/a";
  return ((numer / denom) * 100).toFixed(1) + "%";
}

function money(value: number): string {
  return `$${(value ?? 0).toFixed(4)}`;
}

function renderHtml(s: any, operating: any): string {
  const truth = s.truth ?? {};
  const vanity = s.vanity ?? {};
  const ratios = s.ratios ?? {};
  const diagnostics = s.diagnostics ?? {};
  const prev = s.previous?.truth ?? {};
  const ledger = operating?.managedLedger30d ?? {};
  const cost = ledger.cost ?? {};

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
  const providerRows = (cost.byProvider ?? [])
    .map((provider: any) =>
      `<tr><td style="padding:6px 12px;border-bottom:1px solid #1F1F1F;font-family:'JetBrains Mono',monospace;font-size:13px;color:#FAFAFA">${provider.provider}</td><td style="padding:6px 12px;border-bottom:1px solid #1F1F1F;text-align:right;font-size:13px;color:#A3A3A3">${provider.calls}</td><td style="padding:6px 12px;border-bottom:1px solid #1F1F1F;text-align:right;font-size:13px;color:#A3A3A3">${money(provider.providerCostUsd)}</td><td style="padding:6px 12px;border-bottom:1px solid #1F1F1F;text-align:right;font-size:13px;color:#A3A3A3">${money(provider.customerChargeUsd)}</td><td style="padding:6px 12px;border-bottom:1px solid #1F1F1F;text-align:right;font-size:13px;color:${provider.billingExceptions ? "#EF4444" : "#A3A3A3"}">${provider.billingExceptions}</td></tr>`)
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

  <h2 style="font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#EF4444;margin:0 0 12px">Managed cost truth · last 30 days</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#A3A3A3;font-size:14px">Provider spend</td><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#FAFAFA;text-align:right;font-weight:600">${money(cost.providerCostUsd)}</td></tr>
    <tr><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#A3A3A3;font-size:14px">Customer charge earned</td><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#FAFAFA;text-align:right;font-weight:600">${money(cost.customerChargeUsd)}</td></tr>
    <tr><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#A3A3A3;font-size:14px">Gross margin</td><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#FAFAFA;text-align:right;font-weight:600">${money(cost.marginUsd)}</td></tr>
    <tr><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#A3A3A3;font-size:14px">Stripe not reported</td><td style="padding:10px 12px;border-bottom:1px solid #262626;color:${(cost.stripeUnreportedUsd ?? 0) > 0 ? "#EF4444" : "#FAFAFA"};text-align:right;font-weight:600">${money(cost.stripeUnreportedUsd)}</td></tr>
    <tr><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#A3A3A3;font-size:14px">Billing exceptions</td><td style="padding:10px 12px;border-bottom:1px solid #262626;color:${(ledger.billingExceptions ?? 0) > 0 ? "#EF4444" : "#FAFAFA"};text-align:right;font-weight:600">${ledger.billingExceptions ?? 0}</td></tr>
    <tr><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#A3A3A3;font-size:14px">Workspaces at lifetime cap</td><td style="padding:10px 12px;border-bottom:1px solid #262626;color:#FAFAFA;text-align:right;font-weight:600">${operating?.workspaces?.atOrOverLifetimeCap ?? 0}</td></tr>
  </table>
  ${providerRows ? `<table style="width:100%;border-collapse:collapse;margin-bottom:24px"><tr><th style="padding:6px 12px;text-align:left;color:#737373;font-size:11px">PROVIDER</th><th style="padding:6px 12px;text-align:right;color:#737373;font-size:11px">CALLS</th><th style="padding:6px 12px;text-align:right;color:#737373;font-size:11px">COST</th><th style="padding:6px 12px;text-align:right;color:#737373;font-size:11px">CHARGE</th><th style="padding:6px 12px;text-align:right;color:#737373;font-size:11px">EXC</th></tr>${providerRows}</table>` : `<p style="font-size:13px;color:#737373;margin:0 0 24px">No post-ledger managed calls in this window.</p>`}

  <p style="font-size:12px;color:#525252;margin:32px 0 0;border-top:1px solid #1F1F1F;padding-top:16px">Sources: <code style="font-family:'JetBrains Mono',monospace;color:#A3A3A3">funnel:getScorecard</code> + <code style="font-family:'JetBrains Mono',monospace;color:#A3A3A3">managedUsage:getOperatingSnapshot</code> · Generated ${new Date(s.generatedAt).toISOString()}</p>
</div>
</body></html>`;
}

export const sendWeeklyScorecard = internalAction({
  args: {},
  handler: async (ctx): Promise<any> => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[scorecardEmail] RESEND_API_KEY not set");
      return { sent: false, reason: "missing_api_key" };
    }

    const [scorecard, operating]: [any, any] = await Promise.all([
      ctx.runQuery(internal.funnel.getScorecard, {
        hoursBack: 168,
        classification: "human",
        compare: true,
      }),
      ctx.runQuery(internal.managedUsage.getOperatingSnapshot, {}),
    ]);

    const activated: number = scorecard.truth?.activatedUsers ?? 0;
    const subject: string = `APIClaw weekly scorecard - ${activated} activated users`;
    const html = renderHtml(scorecard, operating);

    const response: Response = await fetch("https://api.resend.com/emails", {
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
    return {
      sent: true,
      resendId: result.id,
      activatedUsers: activated,
      providerCostUsd30d: operating.managedLedger30d?.cost?.providerCostUsd ?? 0,
      billingExceptions30d: operating.managedLedger30d?.billingExceptions ?? 0,
    };
  },
});

export const sendDailyScorecard = internalAction({
  args: {},
  handler: async (ctx): Promise<any> => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[scorecardEmail] RESEND_API_KEY not set");
      return { sent: false, reason: "missing_api_key" };
    }

    const [scorecard24, scorecard168, funnel24, funnel168]: [any, any, any, any] =
      await Promise.all([
        ctx.runQuery(internal.funnel.getScorecard, {
          hoursBack: 24,
          classification: "human",
        }),
        ctx.runQuery(internal.funnel.getScorecard, {
          hoursBack: 168,
          classification: "human",
        }),
        ctx.runQuery(internal.funnel.getFunnel, {
          hoursBack: 24,
          includeClassifications: ["human"],
        }),
        ctx.runQuery(internal.funnel.getFunnel, {
          hoursBack: 168,
          includeClassifications: ["human"],
        }),
      ]);

    const yesterday = windowFromQueries(scorecard24, funnel24);
    const week = windowFromQueries(scorecard168, funnel168);
    const subject = renderDailyScorecardSubject(yesterday);
    const text = renderDailyScorecardText({ yesterday, week });
    const html = renderDailyScorecardHtml({ yesterday, week });
    const failedLogin = Math.max(0, yesterday.started - yesterday.loggedIn);

    const response: Response = await fetch("https://api.resend.com/emails", {
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
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[scorecardEmail] Resend ${response.status}:`, errorText);
      return { sent: false, reason: `resend_${response.status}`, error: errorText };
    }

    const result = (await response.json()) as { id?: string };
    return {
      sent: true,
      resendId: result.id,
      started: yesterday.started,
      loggedIn: yesterday.loggedIn,
      failedLogin,
    };
  },
});
