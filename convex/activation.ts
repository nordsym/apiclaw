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
  const workspace = await ctx.db.get(args.workspaceId);
  if (!workspace || workspace.status !== "active") {
    return { id: null, deduped: false, skipped: "workspace_not_active" as const };
  }

  // Authorization reserves and increments the managed call before the
  // successful response is recorded. A count of one is therefore a genuine
  // first managed call. Legacy workspaces with earlier usage must be reported
  // as reactivated instead of inflating the activation funnel.
  const managedCalls = workspace.managedUsageCount ?? workspace.usageCount ?? 0;
  const event = managedCalls <= 1
    ? "first_call_api_success"
    : "workspace_reactivated";
  const dedupeKey = `${event === "first_call_api_success" ? "first_call" : "reactivation"}:${args.workspaceId}`;
  const existing = await ctx.db
    .query("funnelEvents")
    .withIndex("by_dedupeKey", (q) => q.eq("dedupeKey", dedupeKey))
    .first();

  if (existing) {
    return { id: existing._id, deduped: true };
  }

  const id = await ctx.db.insert("funnelEvents", {
    event,
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
      prior_managed_calls: Math.max(0, managedCalls - 1),
    },
    timestamp: now,
  });

  return { id, deduped: false, event };
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
