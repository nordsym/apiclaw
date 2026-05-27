import { v } from "convex/values";
import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

const EMAIL_FROM = "APIClaw <noreply@apiclaw.cloud>";

/**
 * Get usage data for a workspace over a date range
 */
export const getUsageForPeriod = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    startDate: v.string(), // "2026-04-01"
    endDate: v.string(),   // "2026-04-11"
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("usageRecords")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const periodRecords = records.filter(
      (r) => r.date >= args.startDate && r.date <= args.endDate
    );

    const totalCalls = periodRecords.reduce((sum, r) => sum + r.callCount, 0);
    const totalProviderCost = periodRecords.reduce((sum, r) => sum + (r.providerCostUsd || 0), 0);
    const totalApiclawCost = periodRecords.reduce((sum, r) => sum + (r.apiclawCostUsd || 0), 0);
    const margin = totalApiclawCost - totalProviderCost;

    // Daily breakdown
    const dailyBreakdown = periodRecords
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => ({
        date: r.date,
        calls: r.callCount,
        providerCost: r.providerCostUsd || 0,
        totalCost: r.apiclawCostUsd || 0,
      }));

    return {
      totalCalls,
      totalProviderCost,
      totalApiclawCost,
      margin,
      dailyBreakdown,
      daysWithActivity: periodRecords.filter((r) => r.callCount > 0).length,
      avgCallsPerDay: periodRecords.length > 0 ? totalCalls / periodRecords.length : 0,
    };
  },
});

/**
 * Get all workspaces with their emails for reporting.
 * Excludes workspaces with nurture stage `partner-locked` or `excluded` so
 * the weekly/monthly cron does not email accounts that must stay quiet.
 *
 * Belt-and-suspenders 2026-05-27: also excludes any workspace where the tier
 * itself is partner or enterprise, independent of the nurture row existing
 * or being correctly classified. New partner workspaces created today (e.g.
 * for John Kim at Idera before classifyAllWorkspaces has run) are protected
 * by tier alone, even if their email domain is not yet in DOMAIN_BLOCKLIST.
 */
const NO_EMAIL_TIERS = new Set(["partner", "enterprise"]);

export const getReportableWorkspaces = internalQuery({
  args: {},
  handler: async (ctx) => {
    const workspaces = await ctx.db.query("workspaces").collect();
    const nurtureRows = await ctx.db.query("nurture").collect();
    const skipWorkspaceIds = new Set(
      nurtureRows
        .filter((n) => n.stage === "partner-locked" || n.stage === "excluded")
        .map((n) => n.workspaceId as unknown as string)
    );

    return workspaces
      .filter((w) => w.email)
      .filter((w) => !skipWorkspaceIds.has(w._id as unknown as string))
      .filter((w) => !NO_EMAIL_TIERS.has((w as any).tier))
      .map((w) => ({
        id: w._id,
        email: w.email,
        tier: (w as any).tier || "free",
        name: w.email?.split("@")[0] || "User",
      }));
  },
});

/**
 * Get API logs breakdown by provider/model for a workspace
 */
export const getProviderBreakdown = internalQuery({
  args: {
    workspaceId: v.string(),
    startDate: v.number(), // timestamp ms
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("apiLogs")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId as any))
      .collect();

    const periodLogs = logs.filter(
      (l) => l.createdAt >= args.startDate && l.createdAt <= args.endDate
    );

    // Group by provider
    const byProvider: Record<string, { calls: number; errors: number; avgLatency: number; latencies: number[] }> = {};
    for (const log of periodLogs) {
      const key = log.provider || "unknown";
      if (!byProvider[key]) {
        byProvider[key] = { calls: 0, errors: 0, avgLatency: 0, latencies: [] };
      }
      byProvider[key].calls += 1;
      if (log.status === "error") byProvider[key].errors += 1;
      if (log.latencyMs) byProvider[key].latencies.push(log.latencyMs);
    }

    // Calculate avg latency
    for (const key of Object.keys(byProvider)) {
      const lats = byProvider[key].latencies;
      byProvider[key].avgLatency = lats.length > 0
        ? Math.round(lats.reduce((a, b) => a + b, 0) / lats.length)
        : 0;
      delete (byProvider[key] as any).latencies;
    }

    return byProvider;
  },
});

/**
 * Generate and send usage report for a single workspace
 */
export const sendUsageReport = internalAction({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    tier: v.string(),
    name: v.string(),
    period: v.union(v.literal("weekly"), v.literal("monthly")),
  },
  handler: async (ctx, args): Promise<{ success: boolean; calls?: number; error?: string }> => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return { success: false, error: "Email not configured" };
    }

    // Calculate date range
    const now = new Date();
    let startDate: string;
    let endDate: string;
    let periodLabel: string;

    if (args.period === "weekly") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      startDate = start.toISOString().split("T")[0];
      endDate = now.toISOString().split("T")[0];
      periodLabel = `${startDate} to ${endDate}`;
    } else {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      startDate = start.toISOString().split("T")[0];
      endDate = end.toISOString().split("T")[0];
      periodLabel = start.toLocaleString("en", { month: "long", year: "numeric" });
    }

    // Get usage data
    const usage: any = await ctx.runQuery(internal.usageReports.getUsageForPeriod, {
      workspaceId: args.workspaceId,
      startDate,
      endDate,
    });

    // Get provider breakdown
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate + "T23:59:59Z").getTime();
    const providers: any = await ctx.runQuery(internal.usageReports.getProviderBreakdown, {
      workspaceId: args.workspaceId as string,
      startDate: startMs,
      endDate: endMs,
    });

    // Build email
    const isFounder = args.tier === "founder" || args.tier === "partner";
    const costLabel = isFounder ? "Provider cost (not billed)" : "Billed amount";

    // Provider rows
    let providerRows = "";
    const sortedProviders: Array<[string, any]> = Object.entries(providers).sort((a: any, b: any) => b[1].calls - a[1].calls);
    for (const [name, data] of sortedProviders) {
      const successRate = data.calls > 0 ? Math.round(((data.calls - data.errors) / data.calls) * 100) : 0;
      providerRows += `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${data.calls}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${successRate}%</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${data.avgLatency}ms</td>
      </tr>`;
    }

    // Daily chart (simple text sparkline)
    let dailyRows = "";
    for (const day of usage.dailyBreakdown.slice(-7)) {
      const bar = "█".repeat(Math.min(Math.ceil(day.calls / 5), 20)) || "░";
      dailyRows += `<tr>
        <td style="padding:4px 12px;border-bottom:1px solid #f5f5f5;font-size:13px;">${day.date}</td>
        <td style="padding:4px 12px;border-bottom:1px solid #f5f5f5;text-align:right;font-size:13px;">${day.calls}</td>
        <td style="padding:4px 12px;border-bottom:1px solid #f5f5f5;font-size:13px;color:#ef4444;font-family:monospace;">${bar}</td>
      </tr>`;
    }

    const html: string = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

<!-- Header -->
<tr><td style="background:#1a1a1a;padding:32px 40px;">
  <div style="font-size:24px;margin-bottom:4px;">🦞</div>
  <h1 style="margin:0;color:white;font-size:20px;font-weight:600;">APIClaw ${args.period === "weekly" ? "Weekly" : "Monthly"} Report</h1>
  <p style="margin:4px 0 0;color:#a3a3a3;font-size:14px;">${periodLabel}</p>
</td></tr>

<!-- Summary -->
<tr><td style="padding:32px 40px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:16px;background:#f9fafb;border-radius:8px;text-align:center;width:33%;">
        <div style="font-size:28px;font-weight:700;color:#1a1a1a;">${usage.totalCalls.toLocaleString()}</div>
        <div style="font-size:12px;color:#737373;margin-top:4px;">API Calls</div>
      </td>
      <td width="12"></td>
      <td style="padding:16px;background:#f9fafb;border-radius:8px;text-align:center;width:33%;">
        <div style="font-size:28px;font-weight:700;color:#1a1a1a;">$${usage.totalProviderCost.toFixed(2)}</div>
        <div style="font-size:12px;color:#737373;margin-top:4px;">Provider Cost</div>
      </td>
      <td width="12"></td>
      <td style="padding:16px;background:#f9fafb;border-radius:8px;text-align:center;width:33%;">
        <div style="font-size:28px;font-weight:700;color:${isFounder ? "#16a34a" : "#1a1a1a"};">${isFounder ? "$0.00" : "$" + usage.totalApiclawCost.toFixed(2)}</div>
        <div style="font-size:12px;color:#737373;margin-top:4px;">${costLabel}</div>
      </td>
    </tr>
  </table>

  ${isFounder ? `<p style="margin:16px 0 0;padding:12px 16px;background:#f0fdf4;border-radius:8px;color:#166534;font-size:13px;">Founder tier: unlimited calls, no billing. Provider cost shown for transparency.</p>` : ""}

  <p style="margin:24px 0 8px;color:#525252;font-size:13px;">${usage.daysWithActivity} active days | ${Math.round(usage.avgCallsPerDay)} avg calls/day</p>
</td></tr>

<!-- Provider Breakdown -->
${sortedProviders.length > 0 ? `
<tr><td style="padding:0 40px 24px;">
  <h2 style="margin:0 0 12px;font-size:16px;color:#1a1a1a;">By Provider</h2>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;">
    <tr style="background:#f9fafb;">
      <th style="padding:10px 12px;text-align:left;font-size:12px;color:#737373;font-weight:600;">Provider</th>
      <th style="padding:10px 12px;text-align:right;font-size:12px;color:#737373;font-weight:600;">Calls</th>
      <th style="padding:10px 12px;text-align:right;font-size:12px;color:#737373;font-weight:600;">Success</th>
      <th style="padding:10px 12px;text-align:right;font-size:12px;color:#737373;font-weight:600;">Avg Latency</th>
    </tr>
    ${providerRows}
  </table>
</td></tr>` : ""}

<!-- Daily Activity -->
${dailyRows ? `
<tr><td style="padding:0 40px 32px;">
  <h2 style="margin:0 0 12px;font-size:16px;color:#1a1a1a;">Daily Activity</h2>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;">
    <tr style="background:#f9fafb;">
      <th style="padding:8px 12px;text-align:left;font-size:12px;color:#737373;">Date</th>
      <th style="padding:8px 12px;text-align:right;font-size:12px;color:#737373;">Calls</th>
      <th style="padding:8px 12px;text-align:left;font-size:12px;color:#737373;">Volume</th>
    </tr>
    ${dailyRows}
  </table>
</td></tr>` : ""}

<!-- Footer -->
<tr><td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e5e5;">
  <p style="margin:0;font-size:12px;color:#a3a3a3;">APIClaw - The API Layer for AI Agents</p>
  <p style="margin:4px 0 0;font-size:12px;color:#a3a3a3;"><a href="https://apiclaw.cloud/workspace" style="color:#ef4444;text-decoration:none;">View workspace</a></p>
</td></tr>

</table>
</td></tr></table></body></html>`;

    const subject: string = args.period === "weekly"
      ? `APIClaw Weekly: ${usage.totalCalls} calls | $${usage.totalProviderCost.toFixed(2)} provider cost`
      : `APIClaw ${periodLabel}: ${usage.totalCalls} calls | $${usage.totalProviderCost.toFixed(2)} provider cost`;

    const response: Response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: args.email,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText: string = await response.text();
      console.error("Failed to send usage report:", errorText);
      return { success: false, error: errorText };
    }

    console.log(`Sent ${args.period} report to ${args.email}: ${usage.totalCalls} calls`);
    return { success: true, calls: usage.totalCalls };
  },
});

/**
 * Send weekly reports to all workspaces with activity
 */
export const sendWeeklyReports = internalAction({
  args: {},
  handler: async (ctx) => {
    const workspaces = await ctx.runQuery(internal.usageReports.getReportableWorkspaces, {});

    let sent = 0;
    for (const ws of workspaces) {
      try {
        const result = await ctx.runAction(internal.usageReports.sendUsageReport, {
          workspaceId: ws.id,
          email: ws.email,
          tier: ws.tier,
          name: ws.name,
          period: "weekly",
        });
        if (result.success && (result as any).calls > 0) sent++;
      } catch (e: any) {
        console.error(`Failed to send weekly report to ${ws.email}:`, e.message);
      }
    }

    console.log(`[Cron] Sent ${sent} weekly reports`);
  },
});

/**
 * Send monthly reports to all workspaces
 */
export const sendMonthlyReports = internalAction({
  args: {},
  handler: async (ctx) => {
    const workspaces = await ctx.runQuery(internal.usageReports.getReportableWorkspaces, {});

    let sent = 0;
    for (const ws of workspaces) {
      try {
        const result = await ctx.runAction(internal.usageReports.sendUsageReport, {
          workspaceId: ws.id,
          email: ws.email,
          tier: ws.tier,
          name: ws.name,
          period: "monthly",
        });
        if (result.success) sent++;
      } catch (e: any) {
        console.error(`Failed to send monthly report to ${ws.email}:`, e.message);
      }
    }

    console.log(`[Cron] Sent ${sent} monthly reports`);
  },
});
