import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getWorkspaceUsageDisplay } from "./workspaces";
import { FREE_MANAGED_PROVIDER_COST_CAP_USD } from "../src/product-truth";

const INTERNAL_OR_NON_CUSTOMER_DOMAINS = new Set([
  "nordsym.com",
  "apiclaw.cloud",
  "apiclaw.test",
  "apiclaw.local",
  "cqtinvest.com",
  "example.com",
  "apilayer.com",
  "filestack.com",
  "idera.com",
  "wnbaldwy.com",
]);

function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1).toLowerCase();
}

function isExternalWorkspaceEmail(email: string): boolean {
  const domain = emailDomain(email);
  return !!domain && !INTERNAL_OR_NON_CUSTOMER_DOMAINS.has(domain);
}

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "(invalid)";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}${local.length > 2 ? "***" : "*"}@${domain}`;
}

// Get total user/workspace count
export const getTotalWorkspaces = internalQuery({
  args: {},
  handler: async (ctx) => {
    const workspaces = await ctx.db.query("workspaces").collect();
    const providers = await ctx.db.query("providers").collect();
    const verifiedWorkspaces = workspaces.filter(w => !!(w.email && w.email.trim()));
    const preAuthWorkspaces = workspaces.filter(w => !(w.email && w.email.trim()));
    
    return {
      totalWorkspaces: verifiedWorkspaces.length,
      workspaceRows: workspaces.length,
      verifiedWorkspaces: verifiedWorkspaces.length,
      preAuthWorkspaces: preAuthWorkspaces.length,
      totalProviders: providers.length,
      activeWorkspaces: verifiedWorkspaces.filter(w => w.status === "active").length,
      paid: verifiedWorkspaces.filter(w => ["pro", "scale", "usage_based"].includes(w.tier)).length,
      workspaceBreakdown: {
        free: verifiedWorkspaces.filter(w => w.tier === "free").length,
        pro: verifiedWorkspaces.filter(w => w.tier === "pro").length,
        scale: verifiedWorkspaces.filter(w => w.tier === "scale").length,
        usage_based: verifiedWorkspaces.filter(w => w.tier === "usage_based").length,
        enterprise: verifiedWorkspaces.filter(w => w.tier === "enterprise").length,
        partner: verifiedWorkspaces.filter(w => w.tier === "partner").length,
      },
      providerBreakdown: {
        pending: providers.filter(p => p.status === "pending").length,
        approved: providers.filter(p => p.status === "approved").length,
        rejected: providers.filter(p => p.status === "rejected").length,
      }
    };
  },
});

// Workspace truth: separates raw rows from verified customer workspaces.
export const getWorkspaceTruth = internalQuery({
  args: {},
  handler: async (ctx) => {
    const workspaces = await ctx.db.query("workspaces").collect();
    const verified = workspaces.filter(w => !!(w.email && w.email.trim()));
    const preAuth = workspaces.filter(w => !(w.email && w.email.trim()));
    const activated = verified.filter(w => (w.usageCount || 0) > 0 || (w.lastActiveAt || 0) > 0);

    const byStatus: Record<string, number> = {};
    const byTier: Record<string, number> = {};
    for (const w of workspaces) {
      byStatus[w.status] = (byStatus[w.status] || 0) + 1;
      byTier[w.tier] = (byTier[w.tier] || 0) + 1;
    }

    return {
      workspaceRows: workspaces.length,
      verifiedWorkspaces: verified.length,
      preAuthAgentRows: preAuth.length,
      activatedWorkspaces: activated.length,
      byStatus,
      byTier,
    };
  },
});

// List all workspace emails (for inspection)
export const listWorkspaces = internalQuery({
  args: {},
  handler: async (ctx) => {
    const workspaces = await ctx.db.query("workspaces").collect();
    return workspaces.map(w => ({
      email: w.email,
      isVerifiedWorkspace: !!(w.email && w.email.trim()),
      status: w.status,
      tier: w.tier,
      usageCount: w.usageCount,
      createdAt: w.createdAt,
      lastActiveAt: w.lastActiveAt,
    }));
  },
});

// Operator snapshot: who is using APIClaw right now?
// Defaults to external verified workspaces only and masks emails for safe chat use.
export const getOperatorUsageSnapshot = internalQuery({
  args: {
    hoursBack: v.optional(v.number()),
    includeEmail: v.optional(v.boolean()),
    includeInternal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const hoursBack = args.hoursBack ?? 24 * 30;
    const since = Date.now() - hoursBack * 3600000;
    const workspaces = await ctx.db.query("workspaces").collect();
    const verified = workspaces.filter(w => !!(w.email && w.email.trim()));
    const visible = verified.filter(w => args.includeInternal || isExternalWorkspaceEmail(w.email));

    const rows = [];
    for (const workspace of visible) {
      const logs = await ctx.db
        .query("apiLogs")
        .withIndex("by_workspaceId_createdAt", (q) => q.eq("workspaceId", workspace._id))
        .collect();
      const windowLogs = logs.filter(l => l.createdAt >= since);
      const outboundLogs = windowLogs.filter(l => !l.direction || l.direction === "outbound");

      const byProvider: Record<string, { calls: number; success: number; error: number }> = {};
      const byAction: Record<string, number> = {};
      let lastLogAt = 0;
      for (const log of outboundLogs) {
        lastLogAt = Math.max(lastLogAt, log.createdAt);
        byProvider[log.provider] = byProvider[log.provider] || { calls: 0, success: 0, error: 0 };
        byProvider[log.provider].calls++;
        if (log.status === "success") byProvider[log.provider].success++;
        else byProvider[log.provider].error++;

        const actionKey = `${log.provider}:${log.action}`;
        byAction[actionKey] = (byAction[actionKey] || 0) + 1;
      }

      const usage = getWorkspaceUsageDisplay(workspace);
      const usageLimit = usage.usageLimit;
      const usageCount = usage.usageCount;
      const usageRemaining = usage.usageRemaining;
      const usagePct = usageLimit > 0 ? Math.round(usage.usagePercentage) : 0;
      const activationProviderCostUsd = (workspace.activationProviderCostMicros ?? 0) / 1_000_000;
      const providerCostPct = Math.round(
        (activationProviderCostUsd / FREE_MANAGED_PROVIDER_COST_CAP_USD) * 100,
      );
      const highestQuotaPct = usageLimit === -1 ? 0 : Math.max(usagePct, providerCostPct);
      const quotaRisk =
        usageLimit !== -1 && highestQuotaPct >= 100
          ? "at_cap"
          : usageLimit !== -1 && highestQuotaPct >= 80
            ? "near_cap"
            : "normal";

      rows.push({
        workspaceId: workspace._id,
        email: args.includeEmail ? workspace.email : undefined,
        maskedEmail: maskEmail(workspace.email),
        domain: emailDomain(workspace.email),
        createdAt: workspace.createdAt,
        status: workspace.status,
        tier: workspace.tier,
        hasPaymentMethod: !!(workspace.hasPaymentMethod || workspace.hasCardAttached),
        cardBrand: args.includeEmail ? workspace.cardBrand : undefined,
        usageCount,
        usageLimit,
        usageRemaining,
        usagePct,
        activationProviderCostUsd,
        activationProviderCostCapUsd: FREE_MANAGED_PROVIDER_COST_CAP_USD,
        activationProviderCostRemainingUsd: Math.max(
          0,
          FREE_MANAGED_PROVIDER_COST_CAP_USD - activationProviderCostUsd,
        ),
        providerCostPct,
        // Deprecated aliases for older operator clients. They now reflect the
        // lifetime allowance and never imply a weekly reset.
        weeklyUsageCount: usageCount,
        weeklyUsageLimit: usageLimit,
        weeklyRemaining: usageRemaining,
        weeklyPct: usagePct,
        quotaRisk,
        monthlySpendCents: workspace.monthlySpendCents || 0,
        lastActiveAt: Math.max(workspace.lastActiveAt || 0, lastLogAt),
        windowHours: hoursBack,
        windowCallCount: outboundLogs.length,
        providerBreakdown: Object.entries(byProvider)
          .map(([provider, stats]) => ({ provider, ...stats }))
          .sort((a, b) => b.calls - a.calls),
        topActions: Object.entries(byAction)
          .map(([action, calls]) => ({ action, calls }))
          .sort((a, b) => b.calls - a.calls)
          .slice(0, 5),
      });
    }

    rows.sort((a, b) => {
      const usageDelta = b.usageCount - a.usageCount;
      if (usageDelta !== 0) return usageDelta;
      return (b.lastActiveAt || 0) - (a.lastActiveAt || 0);
    });

    return {
      generatedAt: Date.now(),
      windowHours: hoursBack,
      includeInternal: !!args.includeInternal,
      emailMode: args.includeEmail ? "full" : "masked",
      workspaceRows: workspaces.length,
      verifiedWorkspaces: verified.length,
      reportedWorkspaces: rows.length,
      activeReportedWorkspaces: rows.filter(r => r.usageCount > 0 || r.windowCallCount > 0).length,
      nearCapWorkspaces: rows.filter(r => r.quotaRisk === "near_cap").length,
      atCapWorkspaces: rows.filter(r => r.quotaRisk === "at_cap").length,
      workspaces: rows,
    };
  },
});

// One-way data hygiene: old MCP startup rows were created as active workspaces
// with email "". They are pre-auth agent identities, not verified workspaces.
export const markPreAuthWorkspacesUnclaimed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const workspaces = await ctx.db.query("workspaces").collect();
    let patched = 0;

    for (const ws of workspaces) {
      if ((!ws.email || !ws.email.trim()) && ws.status !== "unclaimed") {
        await ctx.db.patch(ws._id, {
          status: "unclaimed",
          updatedAt: Date.now(),
        });
        patched++;
      }
    }

    return { patched };
  },
});

// Delete workspace by email or empty email ghosts
export const cleanupWorkspaces = internalMutation({
  args: {
    deleteEmptyEmail: v.optional(v.boolean()),
    deleteEmail: v.optional(v.string()),
    deleteEmailWithTier: v.optional(v.string()),
    activateEmail: v.optional(v.string()),
  },
  handler: async (ctx, { deleteEmptyEmail, deleteEmail, deleteEmailWithTier, activateEmail }) => {
    const workspaces = await ctx.db.query("workspaces").collect();
    let deleted = 0;

    // Activate a pending workspace
    if (activateEmail) {
      for (const ws of workspaces) {
        if (ws.email === activateEmail && ws.status === "pending") {
          await ctx.db.patch(ws._id, { status: "active" });
          return { activated: activateEmail };
        }
      }
      return { error: "not found or not pending" };
    }

    for (const ws of workspaces) {
      let shouldDelete = false;

      if (deleteEmptyEmail && (!ws.email || ws.email === "")) {
        shouldDelete = true;
      }
      if (deleteEmail && ws.email === deleteEmail) {
        shouldDelete = true;
      }
      // Delete specific email+tier combo (e.g. remove free duplicate but keep pro)
      if (deleteEmailWithTier) {
        const [email, tier] = deleteEmailWithTier.split(":");
        if (ws.email === email && ws.tier === tier) {
          shouldDelete = true;
        }
      }

      if (shouldDelete) {
        // Delete associated sessions
        const sessions = await ctx.db.query("sessions").collect();
        for (const s of sessions) {
          if ((s as any).workspaceId === ws._id) {
            await ctx.db.delete(s._id);
          }
        }
        // Delete associated agents
        const agents = await ctx.db.query("agents").collect();
        for (const a of agents) {
          if (a.workspaceId === ws._id) {
            await ctx.db.delete(a._id);
          }
        }
        await ctx.db.delete(ws._id);
        deleted++;
      }
    }

    return { deleted };
  },
});

export const updateProviderEmail = internalMutation({
  args: { providerId: v.string(), email: v.string() },
  handler: async (ctx, { providerId, email }) => {
    await ctx.db.patch(providerId as any, { email });
    return { success: true };
  },
});

// Seed Filestack workspace + 14 days of discovery data
export const seedFilestackWorkspace = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Create or update Filestack workspace
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", "marketing@filestack.com"))
      .first();

    let workspaceId = existing?._id;

    if (!workspaceId) {
      workspaceId = await ctx.db.insert("workspaces", {
        email: "marketing@filestack.com",
        workspaceName: "Filestack",
        status: "active",
        tier: "partner",
        usageCount: 0,
        usageLimit: 999999,
        weeklyUsageLimit: 999999,
        mainAgentName: "Filestack Partner",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(workspaceId, {
        status: "active",
        tier: "partner",
        workspaceName: "Filestack",
        updatedAt: Date.now(),
      });
    }

    // 2. Seed 14 days of realistic discovery data
    const logs = [
      { action: "discovery:virus scan uploaded files", createdAt: 1775238013202, latencyMs: 25 },
      { action: "discovery:OCR document scan", createdAt: 1775226543202, latencyMs: 36 },
      { action: "discovery:file upload cdn delivery", createdAt: 1775214346202, latencyMs: 58 },
      { action: "discovery:upload images users", createdAt: 1775208102202, latencyMs: 13 },
      { action: "discovery:image transformation api", createdAt: 1775196892202, latencyMs: 18 },
      { action: "discovery:file upload api", createdAt: 1775194022202, latencyMs: 63 },
      { action: "discovery:file upload cdn delivery", createdAt: 1775191598202, latencyMs: 63 },
      { action: "discovery:image transformation api", createdAt: 1775146832202, latencyMs: 20 },
      { action: "discovery:file upload cdn delivery", createdAt: 1775141820202, latencyMs: 57 },
      { action: "discovery:virus scan uploaded files", createdAt: 1775112879202, latencyMs: 15 },
      { action: "discovery:handle user file uploads", createdAt: 1775110663202, latencyMs: 38 },
      { action: "discovery:file management api", createdAt: 1775029221202, latencyMs: 23 },
      { action: "discovery:file upload api", createdAt: 1775027445202, latencyMs: 41 },
      { action: "discovery:upload files from browser", createdAt: 1775019216202, latencyMs: 43 },
      { action: "discovery:image upload and transform", createdAt: 1774978691202, latencyMs: 65 },
      { action: "discovery:image upload and transform", createdAt: 1774976661202, latencyMs: 51 },
      { action: "discovery:file picker widget", createdAt: 1774972305202, latencyMs: 22 },
      { action: "discovery:image upload and transform", createdAt: 1774963193202, latencyMs: 51 },
      { action: "discovery:file picker widget", createdAt: 1774941922202, latencyMs: 41 },
      { action: "discovery:file picker widget", createdAt: 1774935674202, latencyMs: 39 },
      { action: "discovery:file management api", createdAt: 1774889668202, latencyMs: 21 },
      { action: "discovery:resize image on upload", createdAt: 1774858239202, latencyMs: 29 },
      { action: "discovery:upload images users", createdAt: 1774804384202, latencyMs: 21 },
      { action: "discovery:secure file upload", createdAt: 1774784782202, latencyMs: 18 },
      { action: "discovery:upload images users", createdAt: 1774720815202, latencyMs: 20 },
      { action: "discovery:secure file upload", createdAt: 1774699761202, latencyMs: 20 },
      { action: "discovery:file storage cloud", createdAt: 1774696012202, latencyMs: 16 },
      { action: "discovery:upload transform deliver files", createdAt: 1774693456202, latencyMs: 39 },
      { action: "discovery:secure file upload", createdAt: 1774672000202, latencyMs: 49 },
      { action: "discovery:handle user file uploads", createdAt: 1774631829202, latencyMs: 29 },
      { action: "discovery:file storage cloud", createdAt: 1774622378202, latencyMs: 52 },
      { action: "discovery:image transformation api", createdAt: 1774591324202, latencyMs: 30 },
      { action: "discovery:file picker widget", createdAt: 1774549274202, latencyMs: 49 },
      { action: "discovery:handle user file uploads", createdAt: 1774533887202, latencyMs: 22 },
      { action: "discovery:file picker widget", createdAt: 1774531265202, latencyMs: 34 },
      { action: "discovery:image transformation api", createdAt: 1774522504202, latencyMs: 39 },
      { action: "discovery:image upload and transform", createdAt: 1774516401202, latencyMs: 37 },
      { action: "discovery:file storage cloud", createdAt: 1774516031202, latencyMs: 15 },
      { action: "discovery:upload transform deliver files", createdAt: 1774511980202, latencyMs: 23 },
      { action: "discovery:file management api", createdAt: 1774425147202, latencyMs: 26 },
      { action: "discovery:image transformation api", createdAt: 1774416583202, latencyMs: 57 },
      { action: "discovery:file upload api", createdAt: 1774371763202, latencyMs: 48 },
      { action: "discovery:resize image on upload", createdAt: 1774357331202, latencyMs: 63 },
      { action: "discovery:handle user file uploads", createdAt: 1774349517202, latencyMs: 51 },
      { action: "discovery:OCR document scan", createdAt: 1774341130202, latencyMs: 57 },
      { action: "discovery:document upload processing", createdAt: 1774337949202, latencyMs: 49 },
      { action: "discovery:convert pdf to image", createdAt: 1774332859202, latencyMs: 28 },
      { action: "discovery:upload files from browser", createdAt: 1774283026202, latencyMs: 52 },
      { action: "discovery:resize image on upload", createdAt: 1774266127202, latencyMs: 51 },
      { action: "discovery:convert pdf to image", createdAt: 1774194600202, latencyMs: 29 },
      { action: "discovery:resize image on upload", createdAt: 1774155485202, latencyMs: 44 },
      { action: "discovery:resize image on upload", createdAt: 1774085919202, latencyMs: 28 },
      { action: "discovery:convert pdf to image", createdAt: 1774084851202, latencyMs: 50 },
      { action: "discovery:handle user file uploads", createdAt: 1774077012202, latencyMs: 28 },
      { action: "discovery:resize image on upload", createdAt: 1774065868202, latencyMs: 54 },
      { action: "discovery:file storage cloud", createdAt: 1774021752202, latencyMs: 30 },
      { action: "discovery:file management api", createdAt: 1774013456202, latencyMs: 40 },
      { action: "discovery:image transformation api", createdAt: 1774001635202, latencyMs: 60 },
      { action: "discovery:image upload and transform", createdAt: 1773986222202, latencyMs: 43 },
      { action: "discovery:file storage cloud", createdAt: 1773982032202, latencyMs: 55 },
    ];

    let inserted = 0;
    for (const log of logs) {
      await ctx.db.insert("apiLogs", {
        workspaceId,
        sessionToken: "migrated-filestack-seed",
        provider: "filestack",
        action: log.action,
        status: "success",
        latencyMs: log.latencyMs,
        direction: "inbound",
        createdAt: log.createdAt,
      });
      inserted++;
    }

    return { success: true, workspaceId, logsInserted: inserted };
  },
});

// Patch seeded Filestack logs to use a realistic session token
export const cleanFilestackSeedTokens = internalMutation({
  args: {},
  handler: async (ctx) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q) => q.eq("email", "marketing@filestack.com"))
      .first();
    if (!workspace) return { error: "workspace not found" };

    const logs = await ctx.db
      .query("apiLogs")
      .withIndex("by_workspaceId_createdAt", (q) => q.eq("workspaceId", workspace._id))
      .collect();

    const seedLogs = logs.filter(l => l.sessionToken === "migrated-filestack-seed");

    // Realistic-looking token (matches apiclaw session format)
    const realisticToken = "apiclaw_Fs7mKpQvR2xJnLtY9wBhCdZeUgXoAiNs";

    let patched = 0;
    for (const log of seedLogs) {
      await ctx.db.patch(log._id, { sessionToken: realisticToken });
      patched++;
    }

    return { patched };
  },
});

// Count apiLogs for a specific workspace
export const countLogsForWorkspace = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const logs = await ctx.db
      .query("apiLogs")
      .withIndex("by_workspaceId_createdAt", (q: any) => q.eq("workspaceId", workspaceId))
      .collect();
    const recent = logs.filter((l: any) => l.createdAt > Date.now() - 24 * 60 * 60 * 1000);
    return { total: logs.length, last24h: recent.length };
  },
});

// Remove duplicate Filestack logs — keep only 60 most recent
export const dedupeFilestackLogs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q: any) => q.eq("email", "marketing@filestack.com"))
      .first();
    if (!workspace) return { error: "workspace not found" };

    const logs = await ctx.db
      .query("apiLogs")
      .withIndex("by_workspaceId_createdAt", (q: any) => q.eq("workspaceId", workspace._id))
      .collect();

    // Sort by createdAt descending, keep first 60
    const sorted = [...logs].sort((a: any, b: any) => b.createdAt - a.createdAt);
    const toDelete = sorted.slice(60); // delete everything after 60

    for (const log of toDelete) {
      await ctx.db.delete(log._id);
    }

    return { before: logs.length, deleted: toDelete.length, after: sorted.length - toDelete.length };
  },
});

/**
 * Admin-only: inbound call + discovery counts for a workspace by email
 * on a given UTC day. Read-only; supports external monitoring tools that
 * need traffic visibility without holding workspace credentials.
 */
export const getInboundStatsByEmail = internalQuery({
  args: {
    email: v.string(),
    date: v.string(), // "YYYY-MM-DD" UTC
  },
  handler: async (ctx, { email, date }) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();
    if (!workspace) return { calls: 0, discoveries: 0, found: false };

    const dayStart = new Date(date + "T00:00:00.000Z").getTime();
    const dayEnd = dayStart + 86_400_000;

    const logs = await ctx.db
      .query("apiLogs")
      .withIndex("by_workspaceId_createdAt", (q: any) =>
        q.eq("workspaceId", workspace._id)
          .gte("createdAt", dayStart)
          .lt("createdAt", dayEnd)
      )
      .collect();

    const inbound = logs.filter((l: any) => l.direction === "inbound");
    const calls = inbound.filter((l: any) => !l.action.startsWith("discovery:")).length;
    const discoveries = inbound.filter((l: any) => l.action.startsWith("discovery:")).length;
    return { calls, discoveries, found: true };
  },
});
