import { v } from "convex/values";
import { mutation, query, action, internalAction, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { findUsableAgentSession } from "./sessionSecurity";

// Event types available for webhooks
export const WEBHOOK_EVENTS = [
  "usage.threshold.80",
  "usage.threshold.100",
  "api.error",
  "agent.connected",
  "agent.revoked",
] as const;

// Customer-controlled webhook delivery is intentionally disabled until it can
// run behind a destination-pinning egress proxy. Convex fetch alone cannot pin
// DNS results, so URL validation would not close DNS-rebinding SSRF.
export const CUSTOMER_WEBHOOK_DELIVERY_ENABLED = false;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function formatWebhookSecret(bytes: Uint8Array): string {
  if (bytes.byteLength < 32) throw new Error("Webhook secrets require at least 32 random bytes");
  return `whsec_v1_${bytesToHex(bytes)}`;
}

function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return formatWebhookSecret(bytes);
}

// ============================================
// QUERIES
// ============================================

export const getWebhooks = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Verify session
    const session = await findUsableAgentSession(ctx.db, args.token);

    if (!session) {
      return { error: "Invalid session" };
    }

    // Get webhooks for workspace
    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
      .collect();

    // Return webhooks without exposing full secret
    return {
      webhooks: webhooks.map((wh) => ({
        id: wh._id,
        url: wh.url,
        events: wh.events,
        enabled: wh.enabled,
        lastTriggeredAt: wh.lastTriggeredAt,
        lastStatus: wh.lastStatus,
        failCount: wh.failCount,
        createdAt: wh.createdAt,
        // Only show hint of secret
        secretHint: wh.secret.slice(0, 10) + "..." + wh.secret.slice(-4),
      })),
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

export const createWebhook = mutation({
  args: {
    token: v.string(),
    url: v.string(),
    events: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await findUsableAgentSession(ctx.db, args.token);

    if (!session) {
      return { error: "Invalid session" };
    }

    if (!CUSTOMER_WEBHOOK_DELIVERY_ENABLED) {
      return {
        error: "Customer webhook delivery is unavailable until destination-pinned egress is live.",
      };
    }
  },
});

export const updateWebhook = mutation({
  args: {
    token: v.string(),
    webhookId: v.id("webhooks"),
    enabled: v.optional(v.boolean()),
    events: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await findUsableAgentSession(ctx.db, args.token);

    if (!session) {
      return { error: "Invalid session" };
    }

    // Get webhook
    const webhook = await ctx.db.get(args.webhookId);

    if (!webhook || webhook.workspaceId !== session.workspaceId) {
      return { error: "Webhook not found" };
    }

    if (args.enabled === true && !CUSTOMER_WEBHOOK_DELIVERY_ENABLED) {
      return {
        error: "Customer webhook delivery is unavailable until destination-pinned egress is live.",
      };
    }

    // Build update object
    const updates: Partial<{
      enabled: boolean;
      events: string[];
    }> = {};

    if (args.enabled !== undefined) {
      updates.enabled = args.enabled;
    }

    if (args.events !== undefined) {
      const validEvents = args.events.filter((e) =>
        WEBHOOK_EVENTS.includes(e as typeof WEBHOOK_EVENTS[number])
      );
      if (validEvents.length === 0) {
        return { error: "At least one valid event is required" };
      }
      updates.events = validEvents;
    }

    // Update webhook
    await ctx.db.patch(args.webhookId, updates);

    return { success: true };
  },
});

export const deleteWebhook = mutation({
  args: {
    token: v.string(),
    webhookId: v.id("webhooks"),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await findUsableAgentSession(ctx.db, args.token);

    if (!session) {
      return { error: "Invalid session" };
    }

    // Get webhook
    const webhook = await ctx.db.get(args.webhookId);

    if (!webhook || webhook.workspaceId !== session.workspaceId) {
      return { error: "Webhook not found" };
    }

    // Delete webhook
    await ctx.db.delete(args.webhookId);

    return { success: true };
  },
});

export const regenerateSecret = mutation({
  args: {
    token: v.string(),
    webhookId: v.id("webhooks"),
  },
  handler: async (ctx, args) => {
    // Verify session
    const session = await findUsableAgentSession(ctx.db, args.token);

    if (!session) {
      return { error: "Invalid session" };
    }

    // Get webhook
    const webhook = await ctx.db.get(args.webhookId);

    if (!webhook || webhook.workspaceId !== session.workspaceId) {
      return { error: "Webhook not found" };
    }

    // Generate new secret
    const newSecret = generateSecret();

    // Update webhook
    await ctx.db.patch(args.webhookId, { secret: newSecret });

    return {
      success: true,
      secret: newSecret, // Return new secret
    };
  },
});

// ============================================
// ACTIONS (for HTTP calls)
// ============================================

export const testWebhook = action({
  args: {
    token: v.string(),
    webhookId: v.id("webhooks"),
  },
  returns: v.union(
    v.object({ error: v.string() }),
    v.object({ success: v.literal(true), status: v.number(), message: v.string() }),
    v.object({ success: v.literal(false), status: v.optional(v.number()), message: v.string() })
  ),
  handler: async (ctx, args): Promise<
    | { error: string }
    | { success: true; status: number; message: string }
    | { success: false; status?: number; message: string }
  > => {
    // Get webhook from database
    const queryResult = await ctx.runQuery(internal.webhooks.getWebhookInternal, {
      token: args.token,
      webhookId: args.webhookId,
    });

    if (!queryResult || "error" in queryResult) {
      return { error: queryResult?.error || "Webhook not found" };
    }
    return {
      error: "Customer webhook delivery is unavailable until destination-pinned egress is live.",
    };
  },
});

// Internal action to trigger webhooks (called from other parts of the system)
export const triggerWebhooks = internalAction({
  args: {
    workspaceId: v.id("workspaces"),
    event: v.string(),
    data: v.any(),
  },
  returns: v.object({ triggered: v.number(), total: v.optional(v.number()) }),
  handler: async (): Promise<{ triggered: number; total?: number }> => {
    return { triggered: 0, total: 0 };
  },
});

// ============================================
// INTERNAL QUERIES/MUTATIONS (for actions)
// ============================================

export const getWebhookInternal = internalQuery({
  args: {
    token: v.string(),
    webhookId: v.id("webhooks"),
  },
  handler: async (ctx, args): Promise<{ error: string } | { webhook: Doc<"webhooks"> }> => {
    // Verify session
    const session = await findUsableAgentSession(ctx.db, args.token);

    if (!session) {
      return { error: "Invalid session" };
    }

    // Get webhook
    const webhook = await ctx.db.get(args.webhookId);

    if (!webhook || webhook.workspaceId !== session.workspaceId) {
      return { error: "Webhook not found" };
    }

    return { webhook };
  },
});

export const getWebhooksForEvent = internalQuery({
  args: {
    workspaceId: v.id("workspaces"),
    event: v.string(),
  },
  handler: async (ctx, args): Promise<Doc<"webhooks">[]> => {
    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Filter for enabled webhooks that subscribe to this event
    return webhooks.filter(
      (wh) => wh.enabled && wh.events.includes(args.event)
    );
  },
});

export const updateWebhookStatus = internalMutation({
  args: {
    webhookId: v.id("webhooks"),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    const webhook = await ctx.db.get(args.webhookId);
    if (!webhook) return;

    await ctx.db.patch(args.webhookId, {
      lastTriggeredAt: Date.now(),
      lastStatus: args.success ? "success" : "failed",
      failCount: args.success ? 0 : webhook.failCount + 1,
    });

    // Disable webhook after 5 consecutive failures
    if (!args.success && webhook.failCount + 1 >= 5) {
      await ctx.db.patch(args.webhookId, { enabled: false });
    }
  },
});

// ============================================
// HELPERS
// ============================================

export async function signPayload(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `v1=${bytesToHex(new Uint8Array(signature))}`;
}
