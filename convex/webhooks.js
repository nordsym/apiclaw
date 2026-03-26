import { v } from "convex/values";
import { mutation, query, action, internalAction, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
// Event types available for webhooks
export const WEBHOOK_EVENTS = [
    "usage.threshold.80",
    "usage.threshold.100",
    "api.error",
    "agent.connected",
    "agent.revoked",
];
// Generate a random secret for webhook signature verification
function generateSecret() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "whsec_";
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
// ============================================
// QUERIES
// ============================================
export const getWebhooks = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        // Verify session
        const session = await ctx.db
            .query("agentSessions")
            .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
            .first();
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
        const session = await ctx.db
            .query("agentSessions")
            .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
            .first();
        if (!session) {
            return { error: "Invalid session" };
        }
        // Validate URL
        try {
            new URL(args.url);
        }
        catch {
            return { error: "Invalid URL format" };
        }
        // Validate URL is HTTPS
        if (!args.url.startsWith("https://")) {
            return { error: "Webhook URL must use HTTPS" };
        }
        // Validate events
        const validEvents = args.events.filter((e) => WEBHOOK_EVENTS.includes(e));
        if (validEvents.length === 0) {
            return { error: "At least one valid event is required" };
        }
        // Check webhook limit (max 5 per workspace)
        const existingWebhooks = await ctx.db
            .query("webhooks")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", session.workspaceId))
            .collect();
        if (existingWebhooks.length >= 5) {
            return { error: "Maximum 5 webhooks per workspace" };
        }
        // Check for duplicate URL
        const duplicate = existingWebhooks.find((wh) => wh.url === args.url);
        if (duplicate) {
            return { error: "A webhook with this URL already exists" };
        }
        // Generate secret
        const secret = generateSecret();
        // Create webhook
        const webhookId = await ctx.db.insert("webhooks", {
            workspaceId: session.workspaceId,
            url: args.url,
            events: validEvents,
            secret,
            enabled: true,
            failCount: 0,
            createdAt: Date.now(),
        });
        return {
            success: true,
            webhookId,
            secret, // Return secret only once on creation
        };
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
        const session = await ctx.db
            .query("agentSessions")
            .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
            .first();
        if (!session) {
            return { error: "Invalid session" };
        }
        // Get webhook
        const webhook = await ctx.db.get(args.webhookId);
        if (!webhook || webhook.workspaceId !== session.workspaceId) {
            return { error: "Webhook not found" };
        }
        // Build update object
        const updates = {};
        if (args.enabled !== undefined) {
            updates.enabled = args.enabled;
        }
        if (args.events !== undefined) {
            const validEvents = args.events.filter((e) => WEBHOOK_EVENTS.includes(e));
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
        const session = await ctx.db
            .query("agentSessions")
            .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
            .first();
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
        const session = await ctx.db
            .query("agentSessions")
            .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
            .first();
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
    returns: v.union(v.object({ error: v.string() }), v.object({ success: v.literal(true), status: v.number(), message: v.string() }), v.object({ success: v.literal(false), status: v.optional(v.number()), message: v.string() })),
    handler: async (ctx, args) => {
        // Get webhook from database
        const queryResult = await ctx.runQuery(internal.webhooks.getWebhookInternal, {
            token: args.token,
            webhookId: args.webhookId,
        });
        if (!queryResult || "error" in queryResult) {
            return { error: queryResult?.error || "Webhook not found" };
        }
        const webhook = queryResult.webhook;
        // Create test payload
        const payload = {
            event: "test",
            workspace: webhook.workspaceId,
            timestamp: new Date().toISOString(),
            data: {
                message: "This is a test webhook from APIClaw",
                webhookId: args.webhookId,
            },
        };
        // Sign the payload
        const signature = await signPayload(JSON.stringify(payload), webhook.secret);
        try {
            const response = await fetch(webhook.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-APIClaw-Signature": signature,
                    "X-APIClaw-Event": "test",
                    "X-APIClaw-Timestamp": payload.timestamp,
                },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                return {
                    success: true,
                    status: response.status,
                    message: "Webhook delivered successfully",
                };
            }
            else {
                return {
                    success: false,
                    status: response.status,
                    message: `Webhook returned status ${response.status}`,
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Failed to deliver webhook",
            };
        }
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
    handler: async (ctx, args) => {
        // Get all enabled webhooks for this workspace that subscribe to this event
        const webhooksResult = await ctx.runQuery(internal.webhooks.getWebhooksForEvent, {
            workspaceId: args.workspaceId,
            event: args.event,
        });
        if (!webhooksResult || webhooksResult.length === 0) {
            return { triggered: 0 };
        }
        const payload = {
            event: args.event,
            workspace: args.workspaceId,
            timestamp: new Date().toISOString(),
            data: args.data,
        };
        const payloadString = JSON.stringify(payload);
        let successCount = 0;
        // Send to each webhook
        for (const webhook of webhooksResult) {
            const signature = await signPayload(payloadString, webhook.secret);
            try {
                const response = await fetch(webhook.url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-APIClaw-Signature": signature,
                        "X-APIClaw-Event": args.event,
                        "X-APIClaw-Timestamp": payload.timestamp,
                    },
                    body: payloadString,
                });
                // Update webhook status
                await ctx.runMutation(internal.webhooks.updateWebhookStatus, {
                    webhookId: webhook._id,
                    success: response.ok,
                });
                if (response.ok) {
                    successCount++;
                }
            }
            catch {
                // Update webhook with failure
                await ctx.runMutation(internal.webhooks.updateWebhookStatus, {
                    webhookId: webhook._id,
                    success: false,
                });
            }
        }
        return { triggered: successCount, total: webhooksResult.length };
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
    handler: async (ctx, args) => {
        // Verify session
        const session = await ctx.db
            .query("agentSessions")
            .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.token))
            .first();
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
    handler: async (ctx, args) => {
        const webhooks = await ctx.db
            .query("webhooks")
            .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();
        // Filter for enabled webhooks that subscribe to this event
        return webhooks.filter((wh) => wh.enabled && wh.events.includes(args.event));
    },
});
export const updateWebhookStatus = internalMutation({
    args: {
        webhookId: v.id("webhooks"),
        success: v.boolean(),
    },
    handler: async (ctx, args) => {
        const webhook = await ctx.db.get(args.webhookId);
        if (!webhook)
            return;
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
async function signPayload(payload, secret) {
    // Simple HMAC-like signature using SHA-256
    // In a production environment, use proper crypto
    const encoder = new TextEncoder();
    const data = encoder.encode(payload + secret);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `sha256=${hashHex}`;
}
//# sourceMappingURL=webhooks.js.map