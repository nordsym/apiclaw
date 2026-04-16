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
  "add_credits",
  "get_api_details",
  "purchase_access",
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
        status: "registration_required",
        error: "Registration required to call APIs.",
        message:
          "Ask the user for their email, then call register_owner({ email }). A 6-digit code will be sent. Then call verify_code with the code.",
        action: "register_owner",
        free_tier: "50 API calls/month -- completely free.",
      },
    };
  }

  if (!workspaceContext.email) {
    return {
      ok: false,
      reason: "pending_verification",
      payload: {
        status: "registration_required",
        error: "Workspace is not linked to a verified email yet.",
        message: "Run register_owner({ email }) and verify_code to activate.",
        action: "register_owner",
      },
    };
  }

  if (workspaceContext.status !== "active") {
    return {
      ok: false,
      reason: "not_verified",
      payload: {
        status: "pending_verification",
        error: `Workspace status: ${workspaceContext.status}. Please verify your email.`,
        action: "verify_code",
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
            ? "You've hit the free tier limit. Upgrade at https://apiclaw.cloud/upgrade."
            : "Quota exceeded.",
        upgrade_url: "https://apiclaw.cloud/upgrade",
        action: "upgrade",
      },
    };
  }

  return { ok: true, ctx: workspaceContext };
}
