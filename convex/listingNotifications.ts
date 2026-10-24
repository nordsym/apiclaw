import {
  internalAction,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { checkEmailAllowedSync } from "./emailGuards";
import type { ListingMetadata } from "../src/listing-metadata";

const DECISION_FROM = "APIClaw <hello@apiclaw.cloud>";
const DECISION_REPLY_TO = "gustav@nordsym.com";
const CATALOG_URL = "https://apiclaw.cloud/catalog";
const WORKSPACE_LISTINGS_URL =
  "https://apiclaw.cloud/workspace?tab=api-catalog&view=my-apis";

type ReviewDecision = "approved" | "changes_requested";
type ListingNoticeDecision = ReviewDecision | "escalated" | "awaiting_review";

export type ListingBriefInput = {
  draft: ListingMetadata;
  submitter: string;
  workspaceId: string;
  workspaceName?: string;
  decision: ListingNoticeDecision;
  note: string;
  listingId: string;
  revision: number;
};

const DECISION_LABELS: Record<ListingNoticeDecision, string> = {
  approved: "Godkänd",
  changes_requested: "Ändringar begärda",
  escalated: "Eskalerad till manuell granskning",
  awaiting_review: "Väntar på granskning",
};

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number) {
  const normalized = compact(value);
  return normalized.length <= maxLength
    ? normalized
    : `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}

export function listingNotificationBrief(input: ListingBriefInput) {
  const name = truncate(input.draft.name, 160);
  const description = truncate(input.draft.description, 300);
  const pricingNotes = truncate(input.draft.pricingNotes, 180);
  const submitter = compact(input.submitter);
  const workspace = input.workspaceName
    ? `${truncate(input.workspaceName, 120)} (${input.workspaceId})`
    : input.workspaceId;
  const reason = compact(input.note);
  const punctuatedReason = /[.!?…]$/.test(reason) ? reason : `${reason}.`;
  const decision = DECISION_LABELS[input.decision];
  const reviewUrl = `https://apiclaw.cloud/workspace/review-listings?listing=${encodeURIComponent(input.listingId)}`;
  const pricing = `${compact(input.draft.auth)} / ${compact(input.draft.pricing)}${pricingNotes ? ` (${pricingNotes})` : ""}`;
  const finalLine = `Beslut: ${decision}. Skäl: ${punctuatedReason} Runda: ${input.revision}. Granska: ${reviewUrl}`;
  return {
    name,
    reviewUrl,
    text: [
      `Vad: ${description}`,
      `Inskickad av: ${submitter} (arbetsyta: ${workspace})`,
      `Kategori: ${compact(input.draft.category)}`,
      `Bas-URL: ${compact(input.draft.baseUrl)}`,
      `Docs-URL: ${compact(input.draft.docsUrl)}`,
      `Auth / Prissättning: ${pricing}`,
      `Antal operationer: ${input.draft.operations.length}`,
      finalLine,
    ].join("\n"),
    html: [
      `<p><strong>Vad:</strong> ${escapeHtml(description)}</p>`,
      `<p><strong>Inskickad av:</strong> ${escapeHtml(submitter)} (arbetsyta: ${escapeHtml(workspace)})</p>`,
      `<p><strong>Kategori:</strong> ${escapeHtml(compact(input.draft.category))}</p>`,
      `<p><strong>Bas-URL:</strong> ${escapeHtml(compact(input.draft.baseUrl))}</p>`,
      `<p><strong>Docs-URL:</strong> <a href="${escapeHtml(compact(input.draft.docsUrl))}">${escapeHtml(compact(input.draft.docsUrl))}</a></p>`,
      `<p><strong>Auth / Prissättning:</strong> ${escapeHtml(pricing)}</p>`,
      `<p><strong>Antal operationer:</strong> ${input.draft.operations.length}</p>`,
      `<p><strong>Beslut:</strong> ${escapeHtml(decision)}. <strong>Skäl:</strong> ${escapeHtml(punctuatedReason)} <strong>Runda:</strong> ${input.revision}. <a href="${escapeHtml(reviewUrl)}">Granska listningen</a></p>`,
    ].join(""),
  };
}

export function decisionRecipientAllowed(
  email: string,
  tier?: string,
  env: { LISTING_DECISION_TEST_RECIPIENT?: string } = process.env,
) {
  const normalized = email.trim().toLowerCase();
  if (
    normalized === "gustav@nordsym.com" &&
    env.LISTING_DECISION_TEST_RECIPIENT?.trim().toLowerCase() === normalized
  ) {
    return { allowed: true as const };
  }
  if (tier === "partner" || tier === "enterprise") {
    return { allowed: false as const, reason: `tier:${tier}` };
  }
  const guarded = checkEmailAllowedSync(normalized);
  if (guarded.allowed) return guarded;
  return guarded;
}

export function decisionEmail(input: {
  name: string;
  decision: ReviewDecision;
  note: string;
  to: string;
}) {
  const name = input.name.replace(/[\r\n]+/g, " ").trim().slice(0, 160);
  if (input.decision === "approved") {
    return {
      from: DECISION_FROM,
      reply_to: DECISION_REPLY_TO,
      to: input.to,
      subject: `${name} is live in APIClaw`,
      text: [
        "Hi,",
        "",
        `APIClaw approved ${name}, and it's now published in the catalog:`,
        CATALOG_URL,
        "",
        "You can edit it from My APIs in your workspace:",
        WORKSPACE_LISTINGS_URL,
        "",
        "Any changes will come back through review before they go live.",
        "",
        "Thanks for contributing,",
        "APIClaw",
      ].join("\n"),
    };
  }
  return {
    from: DECISION_FROM,
    reply_to: DECISION_REPLY_TO,
    to: input.to,
    subject: `Changes requested for ${name}`,
    text: [
      "Hi,",
      "",
      `APIClaw reviewed ${name} and needs one change before it can be published:`,
      "",
      input.note.trim(),
      "",
      "Open My APIs in your workspace to update and resubmit:",
      WORKSPACE_LISTINGS_URL,
      "",
      "APIClaw",
    ].join("\n"),
  };
}

export function operatorDecisionEmail(input: {
  draft: ListingMetadata;
  submitter: string;
  workspaceId: string;
  workspaceName?: string;
  decision: ReviewDecision | "escalated";
  note: string;
  listingId: string;
  revision: number;
}) {
  const brief = listingNotificationBrief(input);
  return {
    from: DECISION_FROM,
    reply_to: DECISION_REPLY_TO,
    to: "gustav@nordsym.com",
    subject: `APIClaw listing ${input.decision}: ${brief.name}`,
    text: brief.text,
    html: brief.html,
  };
}

export function reviewEmail(
  input: Omit<ListingBriefInput, "decision" | "note">,
) {
  const brief = listingNotificationBrief({
    ...input,
    decision: "awaiting_review",
    note: "Ny eller uppdaterad listning inskickad för granskning.",
  });
  return {
    from: "APIClaw <noreply@apiclaw.cloud>",
    to: "gustav@nordsym.com",
    subject: `APIClaw: API listing awaiting review - ${brief.name}`,
    text: brief.text,
    html: brief.html,
  };
}
const identity = { id: v.id("discoveryListings"), revision: v.number() };
export const candidate = internalQuery({
  args: identity,
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (
      !row ||
      row.revision !== args.revision ||
      row.reviewState !== "pending" ||
      row.notificationState !== "queued"
    )
      return null;
    const workspace = await ctx.db.get(row.workspaceId);
    return {
      ...row,
      submitter: workspace?.email ?? "Unknown",
      workspaceName: workspace?.workspaceName,
    };
  },
});
export const record = internalMutation({
  args: {
    ...identity,
    sent: v.boolean(),
    messageId: v.optional(v.string()),
    alertSent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (
      !row ||
      row.revision !== args.revision ||
      row.reviewState !== "pending" ||
      row.notificationState !== "queued"
    )
      return;
    const attempts = (row.notificationAttempts ?? 0) + 1;
    await ctx.db.patch(row._id, {
      notificationAttempts: attempts,
      notificationState: args.sent
        ? "sent"
        : attempts >= 3
          ? "failed"
          : "queued",
      notificationId: args.messageId,
      notificationAlertSent: args.alertSent ?? false,
    });
    if (!args.sent && attempts < 3)
      await ctx.scheduler.runAfter(
        attempts * 60_000,
        internal.listingNotifications.send,
        { id: row._id, revision: row.revision },
      );
  },
});
export const send = internalAction({
  args: identity,
  handler: async (ctx, args): Promise<void> => {
    const row = await ctx.runQuery(
      internal.listingNotifications.candidate,
      args,
    );
    if (!row) return;
    let alertSent = row.notificationAlertSent ?? false;
    let messageId = row.notificationId;
    try {
      const key = process.env.RESEND_API_KEY;
      if (key && !messageId) {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `listing-review-${args.id}-${args.revision}`,
          },
          body: JSON.stringify(
            reviewEmail({
              draft: row.draft,
              submitter: row.submitter,
              workspaceId: row.workspaceId,
              workspaceName: row.workspaceName,
              listingId: args.id,
              revision: args.revision,
            }),
          ),
          signal: AbortSignal.timeout(10000),
        });
        if (response.ok) {
          const data = await response.json();
          if (typeof data.id === "string") {
            messageId = data.id;
          }
        }
      }
    } catch {
      /* Persist failure and bounded retry; never log credentials or provider responses. */
    }
    try {
      const secret = process.env.APICLAW_INBOUND_WEBHOOK_SECRET;
      if (!alertSent && secret) {
        const response = await fetch(
          "https://nordsym.app.n8n.cloud/webhook/inbound/apiclaw",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-APIClaw-Webhook-Secret": secret,
            },
            // Keep submitter-controlled text and personal data out of operator alerts.
            body: JSON.stringify({
              source: "apiclaw",
              event: "listing_review",
              email: "Review queue",
              workspaceId: row.workspaceId,
              tier: "Discovery only",
              listingId: args.id,
              revision: args.revision,
              timestamp: row.updatedAt,
            }),
            signal: AbortSignal.timeout(10000),
          },
        );
        // The existing webhook responds only after Telegram sendMessage completes.
        alertSent = response.ok;
      }
    } catch {
      /* Retry only the missing delivery. An ambiguous timeout may duplicate an alert. */
    }
    await ctx.runMutation(internal.listingNotifications.record, {
      ...args,
      sent: !!messageId && alertSent,
      alertSent,
      ...(messageId ? { messageId } : {}),
    });
  },
});

const decisionIdentity = { reviewId: v.id("discoveryListingReviews") };

export const decisionCandidate = internalQuery({
  args: decisionIdentity,
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review || review.notificationState !== "queued") return null;
    const workspace = await ctx.db.get(review.workspaceId);
    const listing = await ctx.db.get(review.listingId);
    const draft =
      review.listingSnapshot ??
      (listing?.revision === review.revision ? listing.draft : undefined);
    if (!draft) return { unrenderable: true as const };
    return {
      listingId: review.listingId,
      revision: review.revision,
      decision: review.decision,
      note: review.note,
      draft,
      name: review.listingName ?? draft.name,
      email: workspace?.email,
      workspaceId: review.workspaceId,
      workspaceName: workspace?.workspaceName,
      tier: workspace?.tier,
      submitterMessageId: review.notificationId,
      operatorMessageId: review.operatorNotificationId,
    };
  },
});

export const recordUnrenderableDecision = internalMutation({
  args: decisionIdentity,
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review || review.notificationState !== "queued") return;
    const error = "listing_snapshot_unavailable";
    await ctx.db.patch(review._id, {
      notificationState: "failed",
      notificationAttempts: (review.notificationAttempts ?? 0) + 1,
      notificationError: error,
      operatorNotificationError: error,
    });
  },
});

export const recordDecision = internalMutation({
  args: {
    ...decisionIdentity,
    submitterOutcome: v.union(
      v.literal("sent"),
      v.literal("failed"),
      v.literal("skipped"),
    ),
    submitterMessageId: v.optional(v.string()),
    submitterError: v.optional(v.string()),
    operatorOutcome: v.union(v.literal("sent"), v.literal("failed")),
    operatorMessageId: v.optional(v.string()),
    operatorError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review || review.notificationState !== "queued") return;
    const attempts = (review.notificationAttempts ?? 0) + 1;
    const submitterComplete =
      args.submitterOutcome === "sent" || args.submitterOutcome === "skipped";
    const operatorComplete = args.operatorOutcome === "sent";
    const complete = submitterComplete && operatorComplete;
    const retry = !complete && attempts < 3;
    await ctx.db.patch(review._id, {
      notificationState: complete ? "sent" : retry ? "queued" : "failed",
      notificationAttempts: attempts,
      notificationId: args.submitterMessageId ?? review.notificationId,
      notificationError: args.submitterError,
      ...(args.submitterOutcome === "sent" ? { notificationSentAt: Date.now() } : {}),
      operatorNotificationId:
        args.operatorMessageId ?? review.operatorNotificationId,
      operatorNotificationError: args.operatorError,
      ...(args.operatorOutcome === "sent"
        ? { operatorNotificationSentAt: Date.now() }
        : {}),
    });
    if (retry) {
      await ctx.scheduler.runAfter(
        attempts * 60_000,
        internal.listingNotifications.sendDecision,
        { reviewId: review._id },
      );
    }
  },
});

export const sendDecision = internalAction({
  args: decisionIdentity,
  handler: async (ctx, args): Promise<void> => {
    const candidate = await ctx.runQuery(
      internal.listingNotifications.decisionCandidate,
      args,
    );
    if (!candidate) return;
    if (candidate.unrenderable) {
      await ctx.runMutation(
        internal.listingNotifications.recordUnrenderableDecision,
        args,
      );
      return;
    }
    const key = process.env.RESEND_API_KEY;
    const send = async (body: object, idempotencyKey: string) => {
      if (!key) return { error: "missing_resend_api_key" };
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10_000),
        });
        if (response.ok) {
          const data = await response.json();
          if (typeof data.id === "string") return { messageId: data.id };
          return { error: "resend_missing_message_id" };
        }
        return { error: `resend_${response.status}` };
      } catch {
        return { error: "resend_transport_error" };
      }
    };

    let submitterOutcome: "sent" | "failed" | "skipped" = "skipped";
    let submitterMessageId = candidate.submitterMessageId;
    let submitterError: string | undefined;
    if (!candidate.email) submitterError = "workspace_email_missing";
    else {
      const recipient = decisionRecipientAllowed(candidate.email, candidate.tier);
      if (!recipient.allowed) submitterError = recipient.reason;
      else if (submitterMessageId) submitterOutcome = "sent";
      else {
        const result = await send(
          decisionEmail({
            name: candidate.name,
            decision: candidate.decision,
            note: candidate.note,
            to: candidate.email,
          }),
          `listing-decision-${candidate.listingId}-${candidate.revision}-${candidate.decision}`,
        );
        submitterMessageId = result.messageId;
        submitterError = result.error;
        submitterOutcome = result.messageId ? "sent" : "failed";
      }
    }

    let operatorMessageId = candidate.operatorMessageId;
    let operatorError: string | undefined;
    if (!operatorMessageId) {
      const result = await send(
        operatorDecisionEmail({
          draft: candidate.draft,
          submitter: candidate.email ?? "Unknown",
          workspaceId: candidate.workspaceId,
          workspaceName: candidate.workspaceName,
          decision: candidate.decision,
          note: candidate.note,
          listingId: candidate.listingId,
          revision: candidate.revision,
        }),
        `listing-operator-decision-${candidate.listingId}-${candidate.revision}-${candidate.decision}`,
      );
      operatorMessageId = result.messageId;
      operatorError = result.error;
    }
    await ctx.runMutation(internal.listingNotifications.recordDecision, {
      ...args,
      submitterOutcome,
      ...(submitterMessageId ? { submitterMessageId } : {}),
      ...(submitterError ? { submitterError } : {}),
      operatorOutcome: operatorMessageId ? "sent" : "failed",
      ...(operatorMessageId ? { operatorMessageId } : {}),
      ...(operatorError ? { operatorError } : {}),
    });
  },
});

export const escalationCandidate = internalQuery({
  args: identity,
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (
      !row ||
      row.revision !== args.revision ||
      row.reviewState !== "pending" ||
      row.autoReviewState !== "escalated" ||
      row.autoReviewNotificationState !== "queued"
    )
      return null;
    const workspace = await ctx.db.get(row.workspaceId);
    return {
      draft: row.draft,
      submitter: workspace?.email ?? "Unknown",
      workspaceId: row.workspaceId,
      workspaceName: workspace?.workspaceName,
      reason: row.autoReviewReason ?? "Automatic review was uncertain.",
      messageId: row.autoReviewNotificationId,
    };
  },
});

export const recordEscalation = internalMutation({
  args: {
    ...identity,
    messageId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (
      !row ||
      row.revision !== args.revision ||
      row.reviewState !== "pending" ||
      row.autoReviewState !== "escalated" ||
      row.autoReviewNotificationState !== "queued"
    )
      return;
    const attempts = (row.autoReviewNotificationAttempts ?? 0) + 1;
    const retry = !args.messageId && attempts < 3;
    await ctx.db.patch(row._id, {
      autoReviewNotificationState: args.messageId
        ? "sent"
        : retry
          ? "queued"
          : "failed",
      autoReviewNotificationAttempts: attempts,
      autoReviewNotificationId: args.messageId ?? row.autoReviewNotificationId,
      autoReviewNotificationError: args.error,
      ...(args.messageId ? { autoReviewNotificationSentAt: Date.now() } : {}),
    });
    if (retry)
      await ctx.scheduler.runAfter(
        attempts * 60_000,
        internal.listingNotifications.sendEscalation,
        { id: row._id, revision: row.revision },
      );
  },
});

export const sendEscalation = internalAction({
  args: identity,
  handler: async (ctx, args): Promise<void> => {
    const candidate = await ctx.runQuery(
      internal.listingNotifications.escalationCandidate,
      args,
    );
    if (!candidate) return;
    let messageId = candidate.messageId;
    let error: string | undefined;
    const key = process.env.RESEND_API_KEY;
    if (!messageId && !key) error = "missing_resend_api_key";
    else if (!messageId) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `listing-auto-review-escalation-${args.id}-${args.revision}`,
          },
          body: JSON.stringify(
            operatorDecisionEmail({
              draft: candidate.draft,
              submitter: candidate.submitter,
              workspaceId: candidate.workspaceId,
              workspaceName: candidate.workspaceName,
              decision: "escalated",
              note: candidate.reason,
              listingId: args.id,
              revision: args.revision,
            }),
          ),
          signal: AbortSignal.timeout(10_000),
        });
        if (response.ok) {
          const data = await response.json();
          if (typeof data.id === "string") messageId = data.id;
          else error = "resend_missing_message_id";
        } else error = `resend_${response.status}`;
      } catch {
        error = "resend_transport_error";
      }
    }
    await ctx.runMutation(internal.listingNotifications.recordEscalation, {
      ...args,
      ...(messageId ? { messageId } : { error: error ?? "unknown_error" }),
    });
  },
});
