/**
 * Client-side registration guard — single source of truth for "does this
 * workspaceContext pass the verified-owner check before an API call".
 *
 * Free paths (discover_apis, list_* , *_help) do NOT call this.
 * Paying paths (call_api single + chain, capability, resume_chain) DO.
 */

export interface WorkspaceContextLike {
  sessionToken: string;
  workspaceId: string;
  email: string;
  tier: string;
  status: string;
  usageRemaining: number;
  usageCount: number;
}

export type GuardResult =
  | { ok: true; ctx: WorkspaceContextLike }
  | { ok: false; reason: GuardReason; payload: Record<string, unknown> };

export type GuardReason =
  | "no_session"
  | "not_verified"
  | "quota_exceeded"
  | "pending_verification";

export const FIRST_CALL_PROMPT =
  'Use APIClaw to find a callable web search API, call it with the query "AI agent infrastructure news", then summarize the top 3 results with source links. If you need to choose a provider/action, run discover_apis first and then call_api with the best callable match.';

// Paths that are allowed without a verified owner.
export const FREE_CALL_PATHS = new Set<string>([
  "discover_apis",
  "list_categories",
  "list_connected",
  "list_capabilities",
  "apiclaw_help",
  "register_owner",
  "verify_code",
  "check_workspace_status",
  "remind_owner",
  "get_chain_status",
  "setup_metered_billing",
  "get_usage_summary",
  "estimate_cost",
  "check_balance",
  "get_api_details",
]);

// Paths that MUST go through requireVerifiedOwner.
export const ENFORCED_CALL_PATHS = new Set<string>([
  "call_api",
  "capability",
  "resume_chain",
]);

export function requireVerifiedOwner(
  workspaceContext: WorkspaceContextLike | null
): GuardResult {
  if (!workspaceContext) {
    return {
      ok: false,
      reason: "no_session",
      payload: {
        status: "auth_required",
        action: "agent_auth_required",
        error: "APIClaw needs a one-time sign-in before this tool can run.",
        instruction: "Tell the user to run this in their terminal:",
        command: "npx @nordsym/apiclaw auth login",
        what_happens:
          "Opens the browser, one-tap Google sign-in, writes ~/.apiclaw.toml. About 15 seconds.",
        after_signin:
          "Re-call this tool — the session will be picked up automatically.",
        fallback_for_headless:
          "npx @nordsym/apiclaw auth login (secure browser ownership verification).",
        signup_url: "https://apiclaw.cloud/sign-in",
        free_tier: "Free tier included. See https://apiclaw.cloud/pricing.",
        first_call_prompt: FIRST_CALL_PROMPT,
      },
    };
  }

  if (!workspaceContext.email) {
    return {
      ok: false,
      reason: "pending_verification",
      payload: {
        status: "auth_required",
        action: "agent_auth_required",
        error: "Workspace is not linked to a verified email yet.",
        instruction: "Tell the user to run this in their terminal:",
        command: "npx @nordsym/apiclaw auth login",
        signup_url: "https://apiclaw.cloud/sign-in",
        first_call_prompt: FIRST_CALL_PROMPT,
      },
    };
  }

  if (workspaceContext.status !== "active") {
    return {
      ok: false,
      reason: "not_verified",
      payload: {
        status: "pending_verification",
        error: `Workspace status: ${workspaceContext.status}. Please complete sign-in.`,
        instruction: "Tell the user to finish sign-in by running:",
        command: "npx @nordsym/apiclaw auth login",
        signup_url: "https://apiclaw.cloud/sign-in",
        first_call_prompt: FIRST_CALL_PROMPT,
      },
    };
  }

  if (workspaceContext.usageRemaining === 0) {
    return {
      ok: false,
      reason: "quota_exceeded",
      payload: {
        status: "quota_exceeded",
        error:
          workspaceContext.tier === "free"
            ? "You've hit the free tier limit. Add a payment method to keep going at API cost + 15%: https://apiclaw.cloud/upgrade."
            : "Quota exceeded.",
        upgrade_url: "https://apiclaw.cloud/upgrade",
        action: "add_payment_method",
      },
    };
  }

  return { ok: true, ctx: workspaceContext };
}
