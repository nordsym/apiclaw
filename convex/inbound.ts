import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const N8N_INBOUND = "https://nordsym.app.n8n.cloud/webhook/inbound/apiclaw";

export const notifySignup = internalAction({
  args: {
    email: v.string(),
    workspaceId: v.string(),
    tier: v.string(),
    isNewUser: v.boolean(),
    timestamp: v.number(),
  },
  handler: async (_ctx, args) => {
    try {
      await fetch(N8N_INBOUND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "apiclaw",
          event: args.isNewUser ? "signup" : "login",
          email: args.email,
          workspaceId: args.workspaceId,
          tier: args.tier,
          timestamp: args.timestamp,
        }),
      });
    } catch (err) {
      console.error("Inbound Net notification failed:", err);
    }
  },
});
