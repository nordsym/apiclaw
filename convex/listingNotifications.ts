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
  env: Pick<NodeJS.ProcessEnv, "LISTING_DECISION_TEST_RECIPIENT"> = process.env,
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
        `I approved ${name}, and it's now published in the APIClaw catalog:`,
        CATALOG_URL,
        "",
        "You can edit it from My APIs in your workspace:",
        WORKSPACE_LISTINGS_URL,
        "",
        "Any changes will come back through review before they go live.",
        "",
        "Thanks for contributing,",
        "Gustav",
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
      `Thanks for submitting ${name}. I need one change before I can publish it:`,
      "",
      input.note.trim(),
      "",
      "Open My APIs in your workspace to update and resubmit:",
      WORKSPACE_LISTINGS_URL,
      "",
      "Gustav",
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
    };
  },
});

export const recordDecision = internalMutation({
  args: {
    ...decisionIdentity,
    outcome: v.union(
      v.literal("sent"),
      v.literal("failed"),
      v.literal("skipped"),
    ),
    messageId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review || review.notificationState !== "queued") return;
    if (args.outcome === "skipped") {
      await ctx.db.patch(review._id, {
        notificationState: "skipped",
        notificationError: args.error,
      });
      return;
    }
    const attempts = (review.notificationAttempts ?? 0) + 1;
    if (args.outcome === "sent") {
      await ctx.db.patch(review._id, {
        notificationState: "sent",
        notificationAttempts: attempts,
        notificationId: args.messageId,
        notificationError: undefined,
        notificationSentAt: Date.now(),
      });
      return;
    }
    const retry = attempts < 3;
    await ctx.db.patch(review._id, {
      notificationState: retry ? "queued" : "failed",
      notificationAttempts: attempts,
      notificationError: args.error,
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
    if (!candidate.email) {
      console.error("listing decision email skipped", {
        listingId: candidate.listingId,
        revision: candidate.revision,
        decision: candidate.decision,
        error: "workspace_email_missing",
      });
      await ctx.runMutation(internal.listingNotifications.recordDecision, {
        ...args,
        outcome: "skipped",
        error: "workspace_email_missing",
      });
      return;
    }
    const recipient = decisionRecipientAllowed(
      candidate.email,
      candidate.tier,
    );
    if (!recipient.allowed) {
      console.info("listing decision email skipped", {
        listingId: candidate.listingId,
        revision: candidate.revision,
        decision: candidate.decision,
        reason: recipient.reason,
      });
      await ctx.runMutation(internal.listingNotifications.recordDecision, {
        ...args,
        outcome: "skipped",
        error: recipient.reason,
      });
      return;
    }

    let messageId: string | undefined;
    let error = "unknown_error";
    const key = process.env.RESEND_API_KEY;
    try {
      if (!key) {
        error = "missing_resend_api_key";
      } else {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "Idempotency-Key":
              `listing-decision-${candidate.listingId}-${candidate.revision}-${candidate.decision}`,
          },
          body: JSON.stringify(
            decisionEmail({
              name: candidate.name,
              decision: candidate.decision,
              note: candidate.note,
              to: candidate.email,
            }),
          ),
          signal: AbortSignal.timeout(10_000),
        });
        if (response.ok) {
          const data = await response.json();
          if (typeof data.id === "string") messageId = data.id;
          else error = "resend_missing_message_id";
        } else {
          error = `resend_${response.status}`;
        }
      }
    } catch {
      error = "resend_transport_error";
    }

    if (!messageId) {
      console.error("listing decision email failed", {
        listingId: candidate.listingId,
        revision: candidate.revision,
        decision: candidate.decision,
        error,
      });
    }
    await ctx.runMutation(internal.listingNotifications.recordDecision, {
      ...args,
      outcome: messageId ? "sent" : "failed",
      ...(messageId ? { messageId } : { error }),
    });
  },
});
