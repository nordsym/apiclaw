import {
  internalAction,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { checkEmailAllowedSync } from "./emailGuards";

const DECISION_FROM = "APIClaw <hello@apiclaw.cloud>";
const DECISION_REPLY_TO = "gustav@nordsym.com";
const CATALOG_URL = "https://apiclaw.cloud/catalog";
const WORKSPACE_LISTINGS_URL =
  "https://apiclaw.cloud/workspace?tab=api-catalog&view=my-apis";

type ReviewDecision = "approved" | "changes_requested";

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
  name: string;
  submitter: string;
  decision: ReviewDecision | "escalated";
  note: string;
  listingId: string;
}) {
  const name = input.name.replace(/[\r\n]+/g, " ").trim().slice(0, 160);
  const reviewUrl = `https://apiclaw.cloud/workspace/review-listings?listing=${encodeURIComponent(input.listingId)}`;
  return {
    from: DECISION_FROM,
    reply_to: DECISION_REPLY_TO,
    to: "gustav@nordsym.com",
    subject: `APIClaw listing ${input.decision}: ${name}`,
    text: [
      `Listing: ${name}`,
      `Submitter: ${input.submitter}`,
      `Decision: ${input.decision}`,
      `Reason: ${input.note.trim()}`,
      "",
      `Catalog: ${CATALOG_URL}`,
      ...(input.decision === "escalated" ? [`Pending review: ${reviewUrl}`] : []),
    ].join("\n"),
  };
}

export function reviewEmail(name: string, id: string, revision: number) {
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  const url = `https://apiclaw.cloud/workspace/review-listings?listing=${encodeURIComponent(id)}`;
  return {
    from: "APIClaw <noreply@apiclaw.cloud>",
    to: "gustav@nordsym.com",
    subject: `APIClaw: API listing awaiting review - ${name.replace(/[\r\n]/g, " ").slice(0, 120)}`,
    text: `API listing awaiting review: ${name}\nListing ID: ${id}\nRevision: ${revision}\n${url}\nAgents: use the operator API with this exact revision and a review note. Approval publishes discovery metadata only.`,
    html: `<p>A workspace submitted <strong>${escape(name)}</strong>, revision ${revision}, for discovery review.</p><p>Listing ID: <code>${escape(id)}</code><br>Revision: ${revision}</p><p><a href="${url}">Review listing</a></p><p>Sign in as gustav@nordsym.com. Check ownership and metadata before approving. Approval only publishes discovery metadata; no gateway execution, provider keys or payments are enabled.</p>`,
  };
}
const identity = { id: v.id("discoveryListings"), revision: v.number() };
export const candidate = internalQuery({
  args: identity,
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    return row &&
      row.revision === args.revision &&
      row.reviewState === "pending" &&
      row.notificationState === "queued"
      ? row
      : null;
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
            reviewEmail(row.draft.name, args.id, args.revision),
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
    return {
      listingId: review.listingId,
      revision: review.revision,
      decision: review.decision,
      note: review.note,
      name: review.listingName ?? "your API listing",
      email: workspace?.email,
      tier: workspace?.tier,
      submitterMessageId: review.notificationId,
      operatorMessageId: review.operatorNotificationId,
    };
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
          name: candidate.name,
          submitter: candidate.email ?? "Unknown",
          decision: candidate.decision,
          note: candidate.note,
          listingId: candidate.listingId,
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
      name: row.draft.name,
      submitter: workspace?.email ?? "Unknown",
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
              name: candidate.name,
              submitter: candidate.submitter,
              decision: "escalated",
              note: candidate.reason,
              listingId: args.id,
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
