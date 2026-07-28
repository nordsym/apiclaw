import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const N8N_INBOUND = "https://nordsym.app.n8n.cloud/webhook/inbound/apiclaw";
const INBOUND_SECRET_HEADER = "X-APIClaw-Webhook-Secret";

export type InboundEventPayload = {
  source: "apiclaw";
  event: string;
  email: string;
  workspaceId: string;
  tier: string;
  timestamp: number;
  authenticatedAt?: number;
  stalledMinutes?: number;
  welcomeSent?: boolean;
  requestId?: string;
  path?: string;
  code?: string;
  attempts?: number;
  operatorActionRequired?: boolean;
};

export async function deliverInboundEvent(
  payload: InboundEventPayload,
  fetcher: typeof fetch = fetch,
  webhookSecret = process.env.APICLAW_INBOUND_WEBHOOK_SECRET,
) {
  if (!webhookSecret) {
    console.error("[inbound] APICLAW_INBOUND_WEBHOOK_SECRET is not configured");
    return { delivered: false, status: 0 };
  }

  try {
    const response = await fetcher(N8N_INBOUND, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [INBOUND_SECRET_HEADER]: webhookSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[inbound] delivery rejected with HTTP ${response.status}`);
      return { delivered: false, status: response.status };
    }

    return { delivered: true, status: response.status };
  } catch (err) {
    console.error("[inbound] delivery failed:", err instanceof Error ? err.message : "unknown_error");
    return { delivered: false, status: 0 };
  }
}

export const notifySignup = internalAction({
  args: {
    email: v.string(),
    workspaceId: v.string(),
    tier: v.string(),
    isNewUser: v.boolean(),
    timestamp: v.number(),
  },
  handler: async (_ctx, args) => {
    return await deliverInboundEvent({
      source: "apiclaw",
      event: args.isNewUser ? "signup" : "login",
      email: args.email,
      workspaceId: args.workspaceId,
      tier: args.tier,
      timestamp: args.timestamp,
    });
  },
});

export const notifyActivationStalled = internalAction({
  args: {
    email: v.string(),
    workspaceId: v.string(),
    tier: v.string(),
    timestamp: v.number(),
    authenticatedAt: v.number(),
    stalledMinutes: v.number(),
    welcomeSent: v.boolean(),
  },
  handler: async (_ctx, args) => {
    return await deliverInboundEvent({
      source: "apiclaw",
      event: "activation_stalled",
      ...args,
    });
  },
});

export const notifyOAuthPassthroughIncident = internalAction({
  args: {
    workspaceId: v.string(),
    tier: v.string(),
    timestamp: v.number(),
    requestId: v.string(),
    path: v.string(),
    code: v.string(),
    attempts: v.number(),
  },
  returns: v.object({ delivered: v.boolean(), status: v.number() }),
  handler: async (_ctx, args) => {
    return await deliverInboundEvent({
      source: "apiclaw",
      event: "oauth_passthrough_reconciliation_required",
      email: "internal-runtime",
      workspaceId: args.workspaceId,
      tier: args.tier,
      timestamp: args.timestamp,
      requestId: args.requestId,
      path: args.path,
      code: args.code,
      attempts: args.attempts,
      operatorActionRequired: true,
    });
  },
});
