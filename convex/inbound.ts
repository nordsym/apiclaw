import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const N8N_INBOUND = "https://nordsym.app.n8n.cloud/webhook/inbound/apiclaw";

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
};

export async function deliverInboundEvent(
  payload: InboundEventPayload,
  fetcher: typeof fetch = fetch,
) {
  try {
    const response = await fetcher(N8N_INBOUND, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
