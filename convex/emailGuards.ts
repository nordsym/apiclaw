import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Email send-time guards.
 *
 * Single source of truth for which addresses MUST NEVER receive outbound
 * email from APIClaw. Centralised here so every action that drives Resend
 * (scorecardEmail, spendAlerts, usageReports, future cron sends) checks the
 * same set instead of each carrying its own blocklist.
 *
 * The classification cron in nurture.ts converts these into nurture rows
 * with stage `partner-locked`/`excluded`, but the canonical decision for
 * "may I send right now?" lives here. Defense-in-depth — if the cron is
 * stale or never ran for a brand new partner workspace, the guard still
 * holds.
 */

const DOMAIN_BLOCKLIST = new Set<string>([
  "apilayer.com",
  "filestack.com",
  "idera.com",            // APILayer parent (John Kim et al)
  "nordsym.com",
  "cqtinvest.com",
  "apiclaw.local",        // synthetic anonymous from trafficGenerator
  "apiclaw.test",         // synthetic prod-smoke-test workspaces
  "example.com",
  "wnbaldwy.com",         // disposable
]);

const EMAIL_BLOCKLIST = new Set<string>([
  "pratham.kumar@apilayer.com",
  "emma.sampayo@apilayer.com",
  "john.kim@idera.com",
  "marketing@filestack.com",
  "gustav@nordsym.com",
  "symbot@nordsym.com",
  "molle@nordsym.com",
  "molle@cqtinvest.com",
  "gustav_hemmingsson@hotmail.com",
  "test@example.com",
  "m6jgi9d8i1@wnbaldwy.com",
]);

const NO_EMAIL_TIERS = new Set<string>(["partner", "enterprise"]);

function domainOf(email: string): string {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1).toLowerCase();
}

export type GuardDecision =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Pure synchronous check — uses just the address. No DB read.
 * Cheaper guard for places that don't have workspace context.
 */
export function checkEmailAllowedSync(email: string): GuardDecision {
  if (!email) return { allowed: false, reason: "empty_address" };
  const lower = email.toLowerCase().trim();
  if (EMAIL_BLOCKLIST.has(lower)) return { allowed: false, reason: "email_blocklist" };
  if (DOMAIN_BLOCKLIST.has(domainOf(lower))) return { allowed: false, reason: "domain_blocklist" };
  return { allowed: true };
}

/**
 * Combined check — email blocklist + workspace tier. Use when the calling
 * action has a workspaceId or can look it up by email. Recommended for any
 * automated send (reports, alerts, nurture).
 */
export const assertEmailAllowed = internalAction({
  args: { email: v.string() },
  handler: async (ctx, args): Promise<GuardDecision> => {
    const sync = checkEmailAllowedSync(args.email);
    if (!sync.allowed) return sync;

    // Tier check via workspace lookup by email.
    const workspace = (await ctx.runQuery(internal.workspaces.getByEmail, {
      email: args.email,
    })) as { tier?: string } | null;
    if (workspace?.tier && NO_EMAIL_TIERS.has(workspace.tier)) {
      return { allowed: false, reason: `tier:${workspace.tier}` };
    }

    return { allowed: true };
  },
});
