/**
 * Client-side registration guard — single source of truth for "does this
 * workspaceContext pass the verified-owner check before an API call".
 *
 * Free paths (discover_apis, list_* , *_help) do NOT call this.
 * Paying paths (call_api single + chain, capability, resume_chain) DO.
 */

import { agentAuthRequiredPayload } from "./first-run.js";

export {
  FIRST_CALL_PROMPT,
  agentAuthRequiredPayload,
  agentAuthRequiredPayloadAfterMint,
} from "./first-run.js";

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
  | "pending_verification";

// Paths that are allowed without a verified owner.
export const FREE_CALL_PATHS = new Set<string>([
  "discover_apis",
  "list_categories",
  "list_connected",
  "list_capabilities",
  "apiclaw_help",
  "check_workspace_status",
  "get_chain_status",
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
      payload: agentAuthRequiredPayload({
        free_tier: "Free tier included. See https://apiclaw.cloud/pricing.",
      }),
    };
  }

  if (!workspaceContext.email) {
    return {
      ok: false,
      reason: "pending_verification",
      payload: {
        ...agentAuthRequiredPayload({
          error: "Workspace is not linked to a verified email yet.",
        }),
      },
    };
  }

  if (workspaceContext.status !== "active") {
    return {
      ok: false,
      reason: "not_verified",
      payload: agentAuthRequiredPayload({
        status: "pending_verification",
        error: `Workspace status: ${workspaceContext.status}. Please complete sign-in.`,
      }),
    };
  }

  // Usage and PAYG entitlement are intentionally not decided from this
  // process-local snapshot. The gateway owns the atomic quota decision so a
  // workspace can add a payment method and retry without restarting MCP.
  return { ok: true, ctx: workspaceContext };
}
