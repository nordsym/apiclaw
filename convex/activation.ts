import { internalAction, internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { EXECUTE_SESSION_HEADER } from "./httpTrust";
import {
  isBrowserSession,
  isSessionUsable,
  type SessionSecurityFields,
} from "./sessionSecurity";
import {
  FIRST_EXECUTE_FRANKFURTER,
  FIRST_EXECUTE_NASA,
  FIRST_EXECUTE_PATH,
  FIRST_EXECUTE_RAILS,
  isFirstExecuteSuccess,
} from "../src/first-execute-rails";

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

/**
 * First managed execute after a Clerk session is established.
 *
 * Same rails as src/first-execute-rails.ts: NASA APOD, then Frankfurter.
 * Always POST /v1/execute with provider/action. The 200 is recorded by the
 * existing gateway first_call_api_success path — this module does not emit
 * that event itself.
 */
export {
  FIRST_EXECUTE_FRANKFURTER,
  FIRST_EXECUTE_NASA,
  FIRST_EXECUTE_PATH,
  FIRST_EXECUTE_RAILS,
  isFirstExecuteSuccess,
};

export function firstExecuteGatewayUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const configured = env.CONVEX_SITE_URL || env.APICLAW_GATEWAY_URL ||
    "https://adventurous-avocet-799.convex.site";
  return configured.replace(/\/+$/, "");
}

export function firstExecuteIdempotencyKey(workspaceId: string, provider: string): string {
  return `apiclaw-first:${workspaceId}:${provider}`;
}

export type FirstExecuteRailResult = {
  ok: boolean;
  provider?: string;
  action?: string;
  status?: number;
  error?: string;
};

export async function postFirstExecuteRails(options: {
  sessionToken: string;
  workspaceId: string;
  gatewayUrl: string;
  fetchImpl?: typeof fetch;
}): Promise<FirstExecuteRailResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  for (const attempt of FIRST_EXECUTE_RAILS) {
    try {
      const response = await fetchImpl(`${options.gatewayUrl}${FIRST_EXECUTE_PATH}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [EXECUTE_SESSION_HEADER]: options.sessionToken,
          "Idempotency-Key": firstExecuteIdempotencyKey(options.workspaceId, attempt.provider),
        },
        body: JSON.stringify({
          provider: attempt.provider,
          action: attempt.action,
          params: attempt.params,
        }),
      });
      let body: unknown = {};
      try {
        body = JSON.parse(await response.text());
      } catch {
        body = {};
      }
      if (isFirstExecuteSuccess(response.status, body)) {
        return {
          ok: true,
          provider: attempt.provider,
          action: attempt.action,
          status: response.status,
        };
      }
    } catch {
      // Try the next rail. Never throw — scheduled actions retry on throw.
    }
  }
  return { ok: false, error: "first_execute_failed" };
}

export type FirstExecuteClaim =
  | { claimed: true; sessionToken: string }
  | { claimed: false; reason: "workspace_not_active" | "already_attempted" | "already_activated" | "no_session" };

export async function claimFirstExecuteInTransaction(
  ctx: Pick<MutationCtx, "db">,
  workspaceId: Id<"workspaces">,
  now = Date.now(),
): Promise<FirstExecuteClaim> {
  const workspace = await ctx.db.get(workspaceId);
  if (!workspace || workspace.status !== "active") {
    return { claimed: false, reason: "workspace_not_active" };
  }
  if (workspace.firstExecuteAttemptedAt) {
    return { claimed: false, reason: "already_attempted" };
  }

  const existingFirstCall = await ctx.db
    .query("funnelEvents")
    .withIndex("by_dedupeKey", (q) => q.eq("dedupeKey", `first_call:${workspaceId}`))
    .first();

  const sessions = await ctx.db
    .query("agentSessions")
    .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
    .collect();
  const durable = sessions
    .filter((session) => !isBrowserSession(session) && isSessionUsable(session, now))
    .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))[0];

  if (existingFirstCall) {
    await ctx.db.patch(workspaceId, {
      firstExecuteAttemptedAt: now,
      updatedAt: Math.max(workspace.updatedAt, now),
    });
    return { claimed: false, reason: "already_activated" };
  }

  if (!durable?.sessionToken) {
    return { claimed: false, reason: "no_session" };
  }

  await ctx.db.patch(workspaceId, {
    firstExecuteAttemptedAt: now,
    updatedAt: Math.max(workspace.updatedAt, now),
  });
  return { claimed: true, sessionToken: durable.sessionToken };
}

export const claimFirstExecute = internalMutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => claimFirstExecuteInTransaction(ctx, workspaceId),
});

/** Durable owner/CLI sessions may claim. Browser children never do. */
export function shouldScheduleFirstExecute(
  session: SessionSecurityFields | null,
  now = Date.now(),
): boolean {
  return Boolean(session && !isBrowserSession(session) && isSessionUsable(session, now));
}

/**
 * Same one-shot schedule as Clerk mint. Never throws — callers must not
 * block authentication or execute if the scheduler write fails.
 */
export async function scheduleCompleteFirstExecute(
  ctx: Pick<MutationCtx, "scheduler">,
  workspaceId: Id<"workspaces">,
): Promise<void> {
  try {
    await ctx.scheduler.runAfter(0, internal.activation.completeFirstExecute, {
      workspaceId,
    });
  } catch {
    // Never block the request on first execute.
  }
}

/**
 * Session-reuse door for workspaces that already have a durable session
 * and no first_call yet. Skips browser children, inactive workspaces, and
 * any workspace that already claimed or activated (no scheduler loop).
 */
export async function scheduleCompleteFirstExecuteForSession(
  ctx: Pick<MutationCtx, "db" | "scheduler">,
  session: SessionSecurityFields | null,
  workspaceId: Id<"workspaces">,
  now = Date.now(),
): Promise<boolean> {
  if (!shouldScheduleFirstExecute(session, now)) return false;
  try {
    const workspace = await ctx.db.get(workspaceId);
    if (!workspace || workspace.status !== "active") return false;
    if (workspace.firstExecuteAttemptedAt) return false;
    await scheduleCompleteFirstExecute(ctx, workspaceId);
    return true;
  } catch {
    return false;
  }
}

export const completeFirstExecute = internalAction({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }): Promise<FirstExecuteRailResult & { claimed?: boolean; reason?: string }> => {
    let claim: FirstExecuteClaim;
    try {
      claim = await ctx.runMutation(internal.activation.claimFirstExecute, { workspaceId });
    } catch {
      return { ok: false, error: "first_execute_claim_failed" };
    }
    if (!claim.claimed) {
      return { ok: false, claimed: false, reason: claim.reason, error: claim.reason };
    }
    try {
      return await postFirstExecuteRails({
        sessionToken: claim.sessionToken,
        workspaceId: String(workspaceId),
        gatewayUrl: firstExecuteGatewayUrl(),
      });
    } catch {
      return { ok: false, error: "first_execute_failed" };
    }
  },
});
