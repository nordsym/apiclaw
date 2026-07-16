import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const INTERNAL_EMAIL_DOMAINS = new Set(["nordsym.com", "apiclaw.cloud"]);
const INTERNAL_EMAILS = new Set(["gustav@nordsym.com", "gustavnordsync@gmail.com"]);

export type FirstCallSource = {
  workspaceId: Id<"workspaces">;
  path: string;
  authMethod: string;
  provider?: string;
  action?: string;
};

export function classifyFirstCall(email: string | undefined): "human" | "internal" {
  const normalized = (email || "").trim().toLowerCase();
  if (INTERNAL_EMAILS.has(normalized)) return "internal";
  const domain = normalized.split("@")[1] || "";
  return INTERNAL_EMAIL_DOMAINS.has(domain) ? "internal" : "human";
}

/**
 * Records the first successful authenticated gateway call exactly once per
 * workspace. The dedupe key deliberately matches the existing MCP emitter so
 * old and new clients cannot double-count the same activation.
 */
export async function recordFirstCallApiSuccessInTransaction(
  ctx: Pick<MutationCtx, "db">,
  args: FirstCallSource,
  now = Date.now()
) {
  const dedupeKey = `first_call:${args.workspaceId}`;
  const existing = await ctx.db
    .query("funnelEvents")
    .withIndex("by_dedupeKey", (q) => q.eq("dedupeKey", dedupeKey))
    .first();

  if (existing) {
    return { id: existing._id, deduped: true };
  }

  const workspace = await ctx.db.get(args.workspaceId);
  if (!workspace || workspace.status !== "active") {
    return { id: null, deduped: false, skipped: "workspace_not_active" as const };
  }

  const id = await ctx.db.insert("funnelEvents", {
    event: "first_call_api_success",
    classification: classifyFirstCall(workspace.email),
    workspaceId: args.workspaceId,
    email: workspace.email,
    dedupeKey,
    props: {
      path: args.path,
      auth_method: args.authMethod,
      provider: args.provider,
      action: args.action,
      recorded_by: "gateway",
    },
    timestamp: now,
  });

  return { id, deduped: false };
}

export const recordFirstCallApiSuccess = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    path: v.string(),
    authMethod: v.string(),
    provider: v.optional(v.string()),
    action: v.optional(v.string()),
  },
  handler: recordFirstCallApiSuccessInTransaction,
});
