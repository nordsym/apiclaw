import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id, Doc } from "./_generated/dataModel";

/**
 * APIClaw nurture system.
 *
 * Lifecycle stages:
 *   new            — <48h since signup, no meaningful activity
 *   activating     — some discovery/searches, no apiCalls
 *   active         — recent apiCalls
 *   power          — >50 calls in last 14d
 *   dormant        — no activity 7d+
 *   lost           — no activity 30d+
 *   partner-locked — explicit partner workspace, NEVER nurture
 *   excluded       — internal/test/opted-out
 *
 * Emails (sent via symbot-gmail webhook):
 *   welcome       — day 0-1 after signup (stage=new)
 *   try-discover  — day 2-3 if no searches yet (stage=new)
 *   first-call    — day 5-7 after first search, no calls (stage=activating)
 *   upgrade       — day 14 for active users (stage=active)
 *   power-upgrade — power users, upsell to scale/pro
 *   reactivate-7d — dormant workspace, soft nudge
 *   reactivate-30d — lost workspace, last-chance nudge
 */

const DAY = 86400000;
const HOUR = 3600000;

// Permanent no-email list — partner domains, tests, disposable
const DOMAIN_BLOCKLIST = [
  "apilayer.com",
  "filestack.com",
  "nordsym.com",
  "cqtinvest.com",
  "apiclaw.local",        // synthetic anonymous workspaces from trafficGenerator
  "example.com",
  "wnbaldwy.com",         // known disposable
];

const EMAIL_BLOCKLIST = new Set<string>([
  "pratham.kumar@apilayer.com",
  "marketing@filestack.com",
  "gustav@nordsym.com",
  "symbot@nordsym.com",
  "molle@nordsym.com",
  "molle@cqtinvest.com",
  "gustav_hemmingsson@hotmail.com",
  "test@example.com",
  "m6jgi9d8i1@wnbaldwy.com",
  "maxence.dabrowski81@gmail.com",     // real external user — opt-out default
  "andylopeslindao@gmail.com",
]);

function domainOf(email: string): string {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1).toLowerCase();
}

function isBlocked(email: string): boolean {
  const lower = email.toLowerCase();
  if (EMAIL_BLOCKLIST.has(lower)) return true;
  const dom = domainOf(lower);
  if (DOMAIN_BLOCKLIST.includes(dom)) return true;
  return false;
}

export const getByWorkspaceId = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nurture")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .first();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("nurture").collect();
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("nurture").collect();
    const byStage: Record<string, number> = {};
    let totalSent = 0;
    for (const n of all) {
      byStage[n.stage] = (byStage[n.stage] || 0) + 1;
      totalSent += n.emailsSent;
    }
    return { total: all.length, byStage, totalSent };
  },
});

export const optOut = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const n = await ctx.db
      .query("nurture")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .first();
    if (!n) return { success: false };
    await ctx.db.patch(n._id, { unsubscribed: true, stage: "excluded", updatedAt: Date.now() });
    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════════════
// CLASSIFIER — runs daily, upserts nurture row per workspace
// ═══════════════════════════════════════════════════════════════
export const classifyAllWorkspaces = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const workspaces = await ctx.db.query("workspaces").collect();

    let upserted = 0;
    let lockedCount = 0;
    let excludedCount = 0;

    for (const w of workspaces) {
      const email = (w.email || "").toLowerCase();
      const existing = await ctx.db
        .query("nurture")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", w._id))
        .first();

      // Partner / excluded classification takes precedence only if email IS blocked
      // (Missing email = anonymous workspace → stays in lifecycle, just unreachable by sender)
      let stage: Doc<"nurture">["stage"] = "new";
      const hasBlockedEmail = email && isBlocked(email);
      if (hasBlockedEmail) {
        const dom = domainOf(email);
        stage = (dom === "apilayer.com" || dom === "filestack.com") ? "partner-locked" : "excluded";
      } else {
        // Compute activity
        const ageMs = now - w.createdAt;
        const lastActive = w.lastActiveAt || 0;
        const inactivityMs = lastActive ? now - lastActive : ageMs;

        // Calls in last 14d
        const calls14d = await ctx.db
          .query("apiCalls")
          .withIndex("by_workspaceId", (q) => q.eq("workspaceId", w._id))
          .collect();
        const recent14dCalls = calls14d.filter((c) => now - c.timestamp < 14 * DAY).length;

        // Searches ever
        const searches = await ctx.db
          .query("searchLogs")
          .withIndex("by_workspaceId", (q) => q.eq("workspaceId", w._id))
          .collect();
        const totalSearches = searches.length;
        const recent7dSearches = searches.filter((s) => now - s.timestamp < 7 * DAY).length;

        if (inactivityMs > 30 * DAY) stage = "lost";
        else if (inactivityMs > 7 * DAY) stage = "dormant";
        else if (recent14dCalls >= 50) stage = "power";
        else if (recent14dCalls > 0 || (w.usageCount || 0) > 0) stage = "active";
        else if (totalSearches > 0 || recent7dSearches > 0) stage = "activating";
        else stage = "new";
      }

      if (stage === "partner-locked") lockedCount++;
      if (stage === "excluded") excludedCount++;

      if (existing) {
        // Don't demote unsubscribed users
        if (existing.unsubscribed) {
          await ctx.db.patch(existing._id, { updatedAt: now });
          continue;
        }
        await ctx.db.patch(existing._id, {
          stage,
          email: email || undefined,
          lastActivityAt: w.lastActiveAt,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("nurture", {
          workspaceId: w._id,
          email: email || undefined,
          stage,
          lastActivityAt: w.lastActiveAt,
          emailsSent: 0,
          unsubscribed: false,
          createdAt: now,
          updatedAt: now,
        });
        upserted++;
      }
    }

    return {
      workspaceCount: workspaces.length,
      newlyTrackedCount: upserted,
      partnerLocked: lockedCount,
      excluded: excludedCount,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
// SENDER — daily cron picks up to N sendable nurture rows
// ═══════════════════════════════════════════════════════════════
const SYMBOT_GMAIL = "https://nordsym.app.n8n.cloud/webhook/symbot-gmail";

function bodyFor(kind: string, firstName: string): { subject: string; html: string } {
  const hi = firstName ? `Hi ${firstName},` : "Hi,";
  const footer = `<p style="font-size:11px;color:#999;margin-top:32px;">APIClaw — The API layer for AI agents. <a href="https://apiclaw.cloud" style="color:#dc2626;">apiclaw.cloud</a></p>`;

  switch (kind) {
    case "welcome":
      return {
        subject: "Welcome to APIClaw — 26k APIs ready for your agents",
        html: `<p>${hi}</p><p>Your APIClaw workspace is ready. You've got access to 26,704 discoverable APIs and 1,654 callable ones via a single endpoint.</p><p>Easiest first step: <a href="https://apiclaw.cloud/catalog">browse the catalog</a> or run <code>discover_apis</code> from your agent.</p><p>— Gustav, APIClaw</p>${footer}`,
      };
    case "try-discover":
      return {
        subject: "Try one search — see what APIClaw knows",
        html: `<p>${hi}</p><p>Haven't tried discovery yet? One search shows you why this is worth it.</p><p>Try: <code>discover_apis("weather forecast")</code> or hit the <a href="https://apiclaw.cloud/catalog">catalog</a>. Weather, currency, flight data, PDFs, images — agents get a working API in one call.</p><p>— Gustav</p>${footer}`,
      };
    case "first-call":
      return {
        subject: "Make your first API call — takes 30 seconds",
        html: `<p>${hi}</p><p>You've searched the catalog — next step is calling an API. No key management, no SDK integration:</p><pre style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:12px;">call_api("apilayer", "weatherstack", { query: "Stockholm" })</pre><p>The <a href="https://apiclaw.cloud/docs">docs</a> have copy-paste examples.</p><p>— Gustav</p>${footer}`,
      };
    case "upgrade":
      return {
        subject: "Two weeks in — worth going Pro?",
        html: `<p>${hi}</p><p>Your agent has been busy. Free tier is 50 calls/week — Pro is unlimited + priority routing + deeper analytics.</p><p><a href="https://apiclaw.cloud/upgrade" style="display:inline-block;background:#dc2626;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">See Pro pricing</a></p><p>— Gustav</p>${footer}`,
      };
    case "power-upgrade":
      return {
        subject: "You're a heavy user — Scale tier saves you money",
        html: `<p>${hi}</p><p>You're making 50+ calls every two weeks. At that rate, Scale tier ($49/mo for 10k calls) beats per-call pricing.</p><p><a href="https://apiclaw.cloud/upgrade" style="display:inline-block;background:#dc2626;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">Move to Scale</a></p><p>— Gustav</p>${footer}`,
      };
    case "reactivate-7d":
      return {
        subject: "Quiet week — anything I can help unblock?",
        html: `<p>${hi}</p><p>No calls this week. If something's broken or confusing, tell me — reply goes straight to me.</p><p>Or jump back in: <a href="https://apiclaw.cloud/catalog">apiclaw.cloud/catalog</a></p><p>— Gustav</p>${footer}`,
      };
    case "reactivate-30d":
      return {
        subject: "Still here? Free to stay free.",
        html: `<p>${hi}</p><p>Your workspace is still live. If APIClaw isn't the right fit, no worries — reply STOP and I'll opt you out.</p><p>If it is: <a href="https://apiclaw.cloud/catalog">one search gets you back in</a>.</p><p>— Gustav</p>${footer}`,
      };
    default:
      return { subject: "APIClaw update", html: `<p>${hi}</p>${footer}` };
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch(SYMBOT_GMAIL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", to, subject, message: html, safeMode: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function pickEmailKind(n: Doc<"nurture">, wsCreatedAt: number): string | null {
  const now = Date.now();
  const ageMs = now - wsCreatedAt;
  const lastEmailMs = n.lastEmailSentAt ? now - n.lastEmailSentAt : Infinity;

  // Never stack emails closer than 72h except for the onboarding welcome which can follow signup quickly
  if (lastEmailMs < 72 * HOUR && n.lastEmailKind !== null && n.lastEmailKind !== undefined) return null;

  if (n.unsubscribed) return null;

  if (n.stage === "partner-locked" || n.stage === "excluded") return null;

  // Welcome (day 0-2)
  if (n.emailsSent === 0 && ageMs < 2 * DAY) return "welcome";

  // Try-discover (day 2-4, stage still "new")
  if (n.stage === "new" && ageMs >= 2 * DAY && ageMs < 5 * DAY && n.lastEmailKind !== "try-discover") return "try-discover";

  // First-call (stage activating, day 5-10)
  if (n.stage === "activating" && ageMs >= 4 * DAY && n.lastEmailKind !== "first-call") return "first-call";

  // Upgrade nudge (stage active, day 12+, only once)
  if (n.stage === "active" && ageMs >= 12 * DAY && n.lastEmailKind !== "upgrade") return "upgrade";

  // Power upgrade
  if (n.stage === "power" && n.lastEmailKind !== "power-upgrade") return "power-upgrade";

  // Reactivation
  if (n.stage === "dormant" && n.lastEmailKind !== "reactivate-7d") return "reactivate-7d";
  if (n.stage === "lost" && n.lastEmailKind !== "reactivate-30d") return "reactivate-30d";

  return null;
}

export const sendDailyNurture = internalMutation({
  args: { maxSends: v.optional(v.number()), dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const cap = args.maxSends ?? 12;     // conservative daily send cap
    const dryRun = args.dryRun ?? false;

    const rows = await ctx.db.query("nurture").collect();
    let sent = 0;
    let considered = 0;
    const sentLog: Array<{ email: string; kind: string }> = [];

    for (const n of rows) {
      if (sent >= cap) break;
      if (!n.email) continue;
      if (n.unsubscribed) continue;
      if (n.stage === "partner-locked" || n.stage === "excluded") continue;
      if (isBlocked(n.email)) continue;

      const ws = await ctx.db.get(n.workspaceId);
      if (!ws) continue;

      const kind = pickEmailKind(n, ws.createdAt);
      considered++;
      if (!kind) continue;

      const firstName = (n.email.split("@")[0] || "").split(/[._-]/)[0];
      const firstNamePretty = firstName.charAt(0).toUpperCase() + firstName.slice(1);
      const { subject, html } = bodyFor(kind, firstNamePretty);

      if (dryRun) {
        sentLog.push({ email: n.email, kind });
        sent++;
        continue;
      }

      const ok = await sendEmail(n.email, subject, html);
      if (!ok) continue;

      await ctx.db.patch(n._id, {
        emailsSent: n.emailsSent + 1,
        lastEmailSentAt: Date.now(),
        lastEmailKind: kind,
        updatedAt: Date.now(),
      });
      sentLog.push({ email: n.email, kind });
      sent++;
    }

    return { sent, considered, capacity: cap, dryRun, sentLog };
  },
});
