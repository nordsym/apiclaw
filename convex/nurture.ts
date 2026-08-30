import { internalAction, internalMutation, internalQuery, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id, Doc } from "./_generated/dataModel";
import { checkEmailAllowedSync } from "./emailGuards";
import { PAYG_MARGIN_RATE } from "../src/product-truth";
import { findUsableAgentSession } from "./sessionSecurity";
import {
  nurtureDeliveryIdempotencyKey,
  nurtureUnsubscribeUrl,
} from "./nurtureDeliveryKeys";
import {
  FOUNDER_SUBJECT,
  renderFounderSignupText,
  sendFounderSignupMailViaResend,
} from "./founderSignupMail";

const PAYG_MARGIN_PERCENT = PAYG_MARGIN_RATE * 100;
const EMAIL_FROM = process.env.RESEND_FROM || "APIClaw <hello@apiclaw.cloud>";

type NurtureSendCandidate = {
  nurtureId: Id<"nurture">;
  workspaceId: Id<"workspaces">;
  email: string;
  firstName?: string;
  kind: string;
};

type NurtureRunResult = {
  sent: number;
  skipped: number;
  skipReasons: Record<string, number>;
  considered: number;
  capacity: number;
  dryRun: boolean;
  sentLog: Array<{ email: string; kind: string }>;
};

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
 * Emails (sent directly through APIClaw's Resend account):
 *   welcome       — day 1 fallback only if the 10-minute post-auth welcome did not send
 *   try-discover  — day 2-3 if no searches yet (stage=new)
 *   first-call    — day 5-7 after first search, no calls (stage=activating)
 *   upgrade       — day 14 for active users (stage=active)
 *   power-upgrade — power users, nudge to add a card for PAYG
 *   reactivate-7d — dormant workspace, soft nudge
 *   reactivate-30d — lost workspace, last-chance nudge
 */

const DAY = 86400000;
const HOUR = 3600000;
const MAX_NURTURE_EMAILS_PER_WORKSPACE = 3;
const REACTIVATION_COOLDOWN_MS = 30 * DAY;

// Permanent no-email list — partner domains, tests, disposable
export const DOMAIN_BLOCKLIST = [
  "apilayer.com",
  "filestack.com",
  "idera.com",            // APILayer parent company; John Kim et al
  "nordsym.com",
  "cqtinvest.com",
  "apiclaw.local",        // synthetic anonymous workspaces from trafficGenerator
  "apiclaw.test",         // synthetic prod-smoke-test workspaces
  "example.com",
  "wnbaldwy.com",         // known disposable
];

export const EMAIL_BLOCKLIST = new Set<string>([
  "pratham.kumar@apilayer.com",
  "emma.sampayo@apilayer.com",         // APILayer team (covered by domain, belt-and-suspenders)
  "john.kim@idera.com",                // APILayer partnership signer at Idera
  "marketing@filestack.com",
  "gustav@nordsym.com",
  "symbot@nordsym.com",
  "molle@nordsym.com",
  "molle@cqtinvest.com",
  "gustav_hemmingsson@hotmail.com",
  "test@example.com",
  "m6jgi9d8i1@wnbaldwy.com",
]);

export function domainOf(email: string): string {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1).toLowerCase();
}

export function isBlocked(email: string): boolean {
  const lower = email.toLowerCase();
  if (EMAIL_BLOCKLIST.has(lower)) return true;
  const dom = domainOf(lower);
  if (DOMAIN_BLOCKLIST.includes(dom)) return true;
  const guard = checkEmailAllowedSync(lower);
  if (!guard.allowed) return true;
  return false;
}

export const getByWorkspaceId = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nurture")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .first();
  },
});

export const list = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("nurture").collect();
  },
});

export const stats = internalQuery({
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
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await findUsableAgentSession(ctx.db, args.sessionToken);
    if (!session) throw new Error("invalid_session");
    return await optOutWorkspaceInTransaction(ctx, session.workspaceId, "authenticated preference");
  },
});

export async function optOutWorkspaceInTransaction(
  ctx: Pick<MutationCtx, "db">,
  workspaceId: Id<"workspaces">,
  source: string,
  now = Date.now(),
) {
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace) return { success: false, reason: "workspace_not_found" as const };
  const existing = await ctx.db
    .query("nurture")
    .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
    .first();
  if (existing) {
    if (!existing.unsubscribed || existing.stage !== "excluded") {
      await ctx.db.patch(existing._id, {
        unsubscribed: true,
        stage: "excluded",
        notes: `Unsubscribed via ${source}`,
        updatedAt: now,
      });
    }
    return { success: true, alreadyUnsubscribed: existing.unsubscribed };
  }
  await ctx.db.insert("nurture", {
    workspaceId,
    email: workspace.email || undefined,
    stage: "excluded",
    lastActivityAt: workspace.lastActiveAt,
    emailsSent: 0,
    unsubscribed: true,
    notes: `Unsubscribed via ${source}`,
    createdAt: now,
    updatedAt: now,
  });
  return { success: true, alreadyUnsubscribed: false };
}

export const optOutByWorkspaceId = internalMutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return await optOutWorkspaceInTransaction(ctx, args.workspaceId, "signed one-click link");
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

      // Partner / excluded classification takes precedence. Missing email means
      // pre-auth agent identity, not a real customer workspace.
      let stage: Doc<"nurture">["stage"] = "new";
      const hasBlockedEmail = email && isBlocked(email);
      const noEmailTier = w.tier === "partner" || w.tier === "enterprise";
      let notes: string | undefined;
      if (!email) {
        stage = "excluded";
        notes = "pre-auth agent identity; no verified workspace email";
      } else if (noEmailTier) {
        stage = "partner-locked";
        notes = `workspace tier ${w.tier}; automated nurture disabled`;
      } else if (hasBlockedEmail) {
        const dom = domainOf(email);
        stage = (dom === "apilayer.com" || dom === "filestack.com" || dom === "idera.com") ? "partner-locked" : "excluded";
        notes = `blocked outbound email domain ${dom}`;
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
          notes,
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
          notes,
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
export function bodyFor(
  kind: string,
  firstName: string,
  unsubscribeUrl: string,
): { subject: string; html?: string; text?: string } {
  const hi = firstName ? `Hi ${firstName},` : "Hi,";
  const prompt = `Use APIClaw's Brave Search API with provider "brave_search", action "search", and query "AI agent infrastructure news". Then summarize the top 3 results with source links.`;
  const promptBlock = `<pre style="background:#111827;color:#f9fafb;padding:14px;border-radius:8px;font-size:12px;line-height:1.6;white-space:pre-wrap;">${prompt}</pre>`;
  const cta = `<p><a href="https://apiclaw.cloud/docs" style="display:inline-block;background:#dc2626;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">Open the quickstart</a></p>`;
  const footer = `<p style="font-size:11px;color:#999;margin-top:32px;">APIClaw - your agent calls real APIs. You sign in once. <a href="https://apiclaw.cloud" style="color:#dc2626;">apiclaw.cloud</a><br/>Free APIs are free forever, no card. Paid APIs bill provider cost plus ${PAYG_MARGIN_PERCENT}% after you add a card.<br/><a href="${unsubscribeUrl}" style="color:#999;">Unsubscribe from lifecycle email</a>.</p>`;

  switch (kind) {
    case "welcome":
      return {
        subject: FOUNDER_SUBJECT,
        text: renderFounderSignupText(firstName),
      };
    case "try-discover":
      return {
        subject: "Try one API search in APIClaw",
        html: `<p>${hi}</p><p>If you have not tried discovery yet, run one search from your agent:</p><pre style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:12px;">discover_apis({ query: "web search" })</pre><p>APIClaw shows source verification and managed execution readiness separately. For a deterministic first call, use the Brave Search API from the prompt below.</p>${promptBlock}${cta}<p>- Gustav</p>${footer}`,
      };
    case "first-call":
      return {
        subject: "Make your first APIClaw call",
        html: `<p>${hi}</p><p>You have seen the catalog. The next step is one real call. No provider keys, no SDK setup.</p>${promptBlock}${cta}<p>- Gustav</p>${footer}`,
      };
    case "upgrade":
      return {
        subject: "Add a card when your agent calls a Paid API",
        html: `<p>${hi}</p><p>Your agent has started using APIClaw. Free APIs stay free forever, no card. Add a payment method when your agent calls a Paid API, so those calls can continue at provider cost plus ${PAYG_MARGIN_PERCENT}%.</p><p><a href="https://apiclaw.cloud/upgrade" style="display:inline-block;background:#dc2626;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">Add payment method</a></p><p>- Gustav</p>${footer}`,
      };
    case "power-upgrade":
      return {
        subject: "Your APIClaw workspace is getting real usage",
        html: `<p>${hi}</p><p>Your workspace is making regular API calls. Free APIs keep working with no card, forever. Add a payment method to keep calling Paid APIs at provider cost + ${PAYG_MARGIN_PERCENT}%.</p><p><a href="https://apiclaw.cloud/upgrade" style="display:inline-block;background:#dc2626;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">Add payment method</a></p><p>- Gustav</p>${footer}`,
      };
    case "reactivate-7d":
      return {
        subject: "Quiet week — anything I can help unblock?",
        html: `<p>${hi}</p><p>No calls this week. If something's broken or confusing, tell me. Reply goes straight to me.</p><p>Or jump back in: <a href="https://apiclaw.cloud/catalog">apiclaw.cloud/catalog</a></p><p>- Gustav</p>${footer}`,
      };
    case "reactivate-30d":
      return {
        subject: "Still here? Free to stay free.",
        html: `<p>${hi}</p><p>Your workspace is still live. If APIClaw isn't the right fit, no worries. You can unsubscribe below.</p><p>If it is: <a href="https://apiclaw.cloud/catalog">one search gets you back in</a>.</p><p>- Gustav</p>${footer}`,
      };
    default:
      return { subject: "APIClaw update", html: `<p>${hi}</p>${footer}` };
  }
}

type NurtureDeliveryResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function sendNurtureEmailViaResend(
  input: {
    apiKey?: string;
    to: string;
    subject: string;
    html: string;
    idempotencyKey: string;
    unsubscribeUrl: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<NurtureDeliveryResult> {
  if (!input.apiKey) return { ok: false, reason: "missing_resend_api_key" };
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        headers: {
          "List-Unsubscribe": `<${input.unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok
      ? { ok: true }
      : { ok: false, reason: `resend_${res.status}` };
  } catch {
    return { ok: false, reason: "resend_transport_error" };
  }
}

export function pickEmailKind(n: Pick<Doc<"nurture">, "stage" | "emailsSent" | "lastEmailSentAt" | "lastEmailKind" | "unsubscribed">, wsCreatedAt: number): string | null {
  const now = Date.now();
  const ageMs = now - wsCreatedAt;
  const lastEmailMs = n.lastEmailSentAt ? now - n.lastEmailSentAt : Infinity;

  if (n.emailsSent >= MAX_NURTURE_EMAILS_PER_WORKSPACE) return null;

  // Never stack emails closer than 72h except for the onboarding welcome which can follow signup quickly
  if (lastEmailMs < 72 * HOUR && n.lastEmailKind !== null && n.lastEmailKind !== undefined) return null;

  if (n.unsubscribed) return null;

  if (n.stage === "partner-locked" || n.stage === "excluded") return null;

  // Welcome fallback (day 1-2). The canonical post-auth sender owns the first
  // 24h and records its success in this same ledger. This path exists only so
  // a temporary Resend failure cannot make a real signup miss all onboarding.
  if (n.emailsSent === 0 && ageMs >= DAY && ageMs < 2 * DAY) return "welcome";

  // Try-discover (day 2-4, stage still "new")
  if (n.stage === "new" && ageMs >= 2 * DAY && ageMs < 5 * DAY && n.lastEmailKind !== "try-discover") return "try-discover";

  // First-call (stage activating, day 5-10)
  if (n.stage === "activating" && ageMs >= 4 * DAY && n.lastEmailKind !== "first-call") return "first-call";

  // Upgrade nudge (stage active, day 12+, only once)
  if (n.stage === "active" && ageMs >= 12 * DAY && n.lastEmailKind !== "upgrade") return "upgrade";

  // Power upgrade
  if (n.stage === "power" && n.lastEmailKind !== "power-upgrade") return "power-upgrade";

  // Reactivation
  if (n.lastEmailKind?.startsWith("reactivate-") && lastEmailMs < REACTIVATION_COOLDOWN_MS) return null;
  if (n.stage === "dormant" && n.lastEmailKind !== "reactivate-7d") return "reactivate-7d";
  if (n.stage === "lost" && n.lastEmailKind !== "reactivate-30d") return "reactivate-30d";

  return null;
}

export const getSendCandidates = internalQuery({
  args: { maxSends: v.optional(v.number()), dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const cap = args.maxSends ?? 12;     // conservative daily send cap

    const rows = await ctx.db.query("nurture").collect();
    let considered = 0;
    const candidates: NurtureSendCandidate[] = [];

    for (const n of rows) {
      if (candidates.length >= cap) break;
      if (!n.email) continue;
      if (n.unsubscribed) continue;
      if (n.stage === "partner-locked" || n.stage === "excluded") continue;
      if (isBlocked(n.email)) continue;

      const ws = await ctx.db.get(n.workspaceId);
      if (!ws) continue;

      const kind = pickEmailKind(n, ws.createdAt);
      considered++;
      if (!kind) continue;

      candidates.push({
        nurtureId: n._id,
        workspaceId: n.workspaceId,
        email: n.email,
        firstName: (ws as { firstName?: string }).firstName,
        kind,
      });
    }

    return { considered, candidates };
  },
});

export async function markNurtureEmailInTransaction(
  ctx: Pick<MutationCtx, "db">,
  nurtureId: Id<"nurture">,
  kind: string,
  now = Date.now(),
) {
    const n = await ctx.db.get(nurtureId);
    if (!n) return { success: false, reason: "not_found" as const };
    if (n.unsubscribed || n.stage === "partner-locked" || n.stage === "excluded") {
      return { success: false, reason: "nurture_excluded" as const };
    }
    if (n.lastEmailKind === kind) {
      return { success: true, alreadyMarked: true };
    }
    await ctx.db.patch(n._id, {
      emailsSent: n.emailsSent + 1,
      lastEmailSentAt: now,
      lastEmailKind: kind,
      updatedAt: now,
    });
    return { success: true };
}

export const markEmailSent = internalMutation({
  args: { nurtureId: v.id("nurture"), kind: v.string() },
  handler: async (ctx, args) => {
    return await markNurtureEmailInTransaction(ctx, args.nurtureId, args.kind);
  },
});

export const sendDailyNurture = internalAction({
  args: { maxSends: v.optional(v.number()), dryRun: v.optional(v.boolean()) },
  handler: async (ctx, args): Promise<NurtureRunResult> => {
    const cap = args.maxSends ?? 12;
    const dryRun = args.dryRun ?? false;
    const resendApiKey = process.env.RESEND_API_KEY;
    const unsubscribeSecret = process.env.APICLAW_PSEUDONYM_SECRET;
    const { considered, candidates } = await ctx.runQuery(internal.nurture.getSendCandidates, {
      maxSends: cap,
      dryRun,
    }) as { considered: number; candidates: NurtureSendCandidate[] };
    let sent = 0;
    let skipped = 0;
    const skipReasons: Record<string, number> = {};
    const sentLog: Array<{ email: string; kind: string }> = [];

    for (const candidate of candidates) {
      const guard = checkEmailAllowedSync(candidate.email);
      if (!guard.allowed) {
        skipped++;
        skipReasons[guard.reason] = (skipReasons[guard.reason] ?? 0) + 1;
        continue;
      }

      const kind = candidate.kind;
      const email = candidate.email;
      const clerkFirstName = candidate.firstName;
      const emailGuess = (email.split("@")[0] || "").split(/[._-]/)[0];
      const firstNamePretty = clerkFirstName
        || (emailGuess ? emailGuess.charAt(0).toUpperCase() + emailGuess.slice(1) : "");

      if (kind === "welcome") {
        if (dryRun) {
          sentLog.push({ email, kind });
          sent++;
          continue;
        }
        const delivery = await sendFounderSignupMailViaResend({
          apiKey: resendApiKey,
          to: email,
          firstName: clerkFirstName,
          idempotencyKey: nurtureDeliveryIdempotencyKey(String(candidate.workspaceId), kind),
        });
        if (!delivery.ok) {
          skipped++;
          skipReasons[delivery.reason] = (skipReasons[delivery.reason] ?? 0) + 1;
          continue;
        }
        const mark = await ctx.runMutation(internal.nurture.markEmailSent, {
          nurtureId: candidate.nurtureId,
          kind,
        }) as { success: boolean; alreadyMarked?: boolean; reason?: string };
        if (mark.success && !mark.alreadyMarked) {
          sentLog.push({ email, kind });
          sent++;
        } else {
          skipped++;
          const reason = mark.alreadyMarked ? "already_marked" : mark.reason || "mark_failed";
          skipReasons[reason] = (skipReasons[reason] ?? 0) + 1;
        }
        continue;
      }

      if (!unsubscribeSecret) {
        skipped++;
        skipReasons.missing_unsubscribe_secret = (skipReasons.missing_unsubscribe_secret ?? 0) + 1;
        continue;
      }
      const unsubscribeUrl = await nurtureUnsubscribeUrl(
        String(candidate.workspaceId),
        unsubscribeSecret,
      );
      const { subject, html } = bodyFor(kind, firstNamePretty, unsubscribeUrl);

      if (dryRun) {
        sentLog.push({ email, kind });
        sent++;
        continue;
      }

      const delivery = await sendNurtureEmailViaResend({
        apiKey: resendApiKey,
        to: email,
        subject,
        html: html || "",
        idempotencyKey: nurtureDeliveryIdempotencyKey(String(candidate.workspaceId), kind),
        unsubscribeUrl,
      });
      if (!delivery.ok) {
        skipped++;
        skipReasons[delivery.reason] = (skipReasons[delivery.reason] ?? 0) + 1;
        continue;
      }

      const mark = await ctx.runMutation(internal.nurture.markEmailSent, {
        nurtureId: candidate.nurtureId,
        kind,
      }) as { success: boolean; alreadyMarked?: boolean; reason?: string };
      if (mark.success && !mark.alreadyMarked) {
        sentLog.push({ email, kind });
        sent++;
      } else {
        skipped++;
        const reason = mark.alreadyMarked ? "already_marked" : mark.reason || "mark_failed";
        skipReasons[reason] = (skipReasons[reason] ?? 0) + 1;
      }
    }

    return { sent, skipped, skipReasons, considered, capacity: cap, dryRun, sentLog };
  },
});
