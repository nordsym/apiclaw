/**
 * Soft revenue nudge after a free first call, and agent-actionable
 * payment_required copy. Dependency-free so the gateway, MCP client,
 * and wording tests share one source.
 */

export const APICLAW_UPGRADE_URL = "https://apiclaw.cloud/upgrade";

export const FIRST_CALL_REVENUE_NUDGE_MESSAGE =
  "First call landed. Free APIs stay free. For paid APIs (e.g. OpenRouter chat), add a card once at https://apiclaw.cloud/upgrade (provider cost + 15%), then retry.";

export const PAYMENT_REQUIRED_MESSAGE =
  "This API has real provider cost. Add a card at https://apiclaw.cloud/upgrade, then retry this same call. You pay provider cost plus 15 percent.";

export type FirstCallRevenueNudge = {
  kind: "add_payment_method";
  message: string;
  upgradeUrl: string;
};

export function workspaceHasPaymentMethod(workspace: {
  hasPaymentMethod?: boolean | null;
  hasCardAttached?: boolean | null;
}): boolean {
  return workspace.hasPaymentMethod === true || workspace.hasCardAttached === true;
}

/**
 * Attach once, on a newly recorded first_call success, only when this
 * call was free/activation and the workspace has no card. A card on file
 * means the paid rail is already open — no nudge.
 */
export function firstCallRevenueNudge(input: {
  firstCallRecorded: boolean;
  hasPaymentMethod: boolean;
  billingClass?: string | null;
}): FirstCallRevenueNudge | null {
  if (!input.firstCallRecorded) return null;
  if (input.hasPaymentMethod) return null;
  if (input.billingClass != null && input.billingClass !== "activation") {
    return null;
  }
  return {
    kind: "add_payment_method",
    message: FIRST_CALL_REVENUE_NUDGE_MESSAGE,
    upgradeUrl: APICLAW_UPGRADE_URL,
  };
}

export function attachFirstCallRevenueNudge<T extends Record<string, unknown>>(
  payload: T,
  nudge: FirstCallRevenueNudge | null,
): T {
  if (!nudge) return payload;
  return {
    ...payload,
    _notice: nudge.message,
    next_step: nudge,
  };
}
