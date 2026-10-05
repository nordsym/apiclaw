import {
  internalAction,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

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
    html: `<p>A workspace submitted <strong>${escape(name)}</strong>, revision ${revision}, for discovery review.</p><p><a href="${url}">Review listing</a></p><p>Sign in as gustav@nordsym.com. Check ownership and metadata before approving. Approval only publishes discovery metadata; no gateway execution, provider keys or payments are enabled.</p>`,
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
