import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { checkEmailAllowedSync } from "./emailGuards";
import { classifySource } from "./funnel";
import { welcomeDeliveryIdempotencyKey } from "./nurtureDeliveryKeys";

/**
 * Default signup mail: a 1:1 plaintext note from Gustav.
 * Trigger is getOrCreateForClerk first mint (and the CLI first-mint twin).
 * Session reuse, whoami, and verifySession never schedule this.
 */

export const FOUNDER_FROM = "Gustav <gustav@nordsym.com>";
export const FOUNDER_REPLY_TO = "Gustav <gustav@nordsym.com>";
export const FOUNDER_SUBJECT = "Saw you signed up";

const NON_HUMAN_LOCAL =
  /^(ci|bot|test|noreply|no-reply|github-actions|dependabot|smoke|synthetic)([+._-].*)?$/i;

export function normalizeFounderFirstName(raw?: string | null): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (/[{}$%]/.test(trimmed)) return null;
  if (/^(first|firstname|name|user|null|undefined)$/i.test(trimmed)) return null;
  const token = trimmed.split(/\s+/)[0] || "";
  if (token.length < 1 || token.length > 40) return null;
  if (!/^[\p{L}][\p{L}\p{M}'-]*$/u.test(token)) return null;
  return token;
}

export function renderFounderSignupText(firstName?: string | null): string {
  const name = normalizeFounderFirstName(firstName);
  const greeting = name ? `Hey ${name},` : "Hey,";
  return [
    greeting,
    "",
    "Gustav here. I built APIClaw. Saw you signed up.",
    "",
    "What are you using it for?",
    "",
    "If something's in the way of getting it live, tell me. I'll help.",
    "",
    "Gustav",
  ].join("\n");
}

export function shouldSendFounderSignupMail(input: {
  email?: string | null;
  isNewUser?: boolean;
  alreadySent?: boolean;
  tier?: string | null;
  classification?: string | null;
}): { send: boolean; reason?: string } {
  if (input.isNewUser === false) return { send: false, reason: "session_reuse" };
  if (input.alreadySent) return { send: false, reason: "already_sent" };
  const email = (input.email || "").trim().toLowerCase();
  if (!email) return { send: false, reason: "no_email" };
  const guard = checkEmailAllowedSync(email);
  if (!guard.allowed) return { send: false, reason: guard.reason };
  if (input.tier === "partner" || input.tier === "enterprise") {
    return { send: false, reason: `tier:${input.tier}` };
  }
  const local = email.split("@")[0] || "";
  if (NON_HUMAN_LOCAL.test(local) || /\+(ci|bot|test|noreply)\b/i.test(local)) {
    return { send: false, reason: "non_human_address" };
  }
  const classified = input.classification || classifySource({ email });
  if (classified !== "human") return { send: false, reason: classified };
  return { send: true };
}

type FounderDeliveryResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function sendFounderSignupMailViaResend(
  input: {
    apiKey?: string;
    to: string;
    firstName?: string | null;
    idempotencyKey: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<FounderDeliveryResult> {
  if (!input.apiKey) return { ok: false, reason: "missing_resend_api_key" };
  const text = renderFounderSignupText(input.firstName);
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        from: FOUNDER_FROM,
        reply_to: FOUNDER_REPLY_TO,
        to: input.to,
        subject: FOUNDER_SUBJECT,
        text,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok ? { ok: true } : { ok: false, reason: `resend_${res.status}` };
  } catch {
    return { ok: false, reason: "resend_transport_error" };
  }
}

export async function scheduleFounderSignupMail(
  ctx: { scheduler: { runAfter: (ms: number, fn: any, args: any) => Promise<unknown> } },
  args: { workspaceId: Id<"workspaces">; firstName?: string },
): Promise<void> {
  try {
    await ctx.scheduler.runAfter(0, internal.founderSignupMail.sendOnFirstMint, {
      workspaceId: args.workspaceId,
      firstName: args.firstName,
    });
  } catch {
    // Never block signup on mail.
  }
}

type WorkspaceMailRow = {
  email?: string;
  firstName?: string;
  tier?: string;
  alreadySent: boolean;
  excluded: boolean;
};

export const loadWorkspaceForFounderMail = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }): Promise<WorkspaceMailRow | null> => {
    const workspace = await ctx.db.get(workspaceId);
    if (!workspace) return null;
    const nurture = await ctx.db
      .query("nurture")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
      .first();
    return {
      email: workspace.email,
      firstName: (workspace as { firstName?: string }).firstName,
      tier: workspace.tier,
      alreadySent: Boolean(
        workspace.postVerifyNudgeSentAt || nurture?.lastEmailKind === "welcome",
      ),
      excluded: Boolean(
        nurture?.unsubscribed ||
          nurture?.stage === "partner-locked" ||
          nurture?.stage === "excluded",
      ),
    };
  },
});

export const sendOnFirstMint = internalAction({
  args: {
    workspaceId: v.id("workspaces"),
    firstName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const row = (await ctx.runQuery(
      internal.founderSignupMail.loadWorkspaceForFounderMail,
      { workspaceId: args.workspaceId },
    )) as WorkspaceMailRow | null;
    if (!row) return { sent: false, reason: "workspace_not_found" };
    if (row.excluded) return { sent: false, reason: "nurture_excluded" };

    const decision = shouldSendFounderSignupMail({
      email: row.email,
      isNewUser: true,
      alreadySent: row.alreadySent,
      tier: row.tier,
    });
    if (!decision.send) return { sent: false, reason: decision.reason };

    const delivery = await sendFounderSignupMailViaResend({
      apiKey: process.env.RESEND_API_KEY,
      to: row.email!,
      firstName: args.firstName || row.firstName,
      idempotencyKey: welcomeDeliveryIdempotencyKey(String(args.workspaceId)),
    });
    if (!delivery.ok) return { sent: false, reason: delivery.reason };

    const mark = (await ctx.runMutation(internal.postVerifyNudge.markSent, {
      workspaceId: args.workspaceId,
    })) as { success: boolean; alreadyMarked?: boolean; reason?: string };
    if (!mark.success) return { sent: false, reason: mark.reason || "mark_failed" };
    return { sent: !mark.alreadyMarked, alreadyMarked: mark.alreadyMarked };
  },
});
