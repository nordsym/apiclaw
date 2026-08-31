import { isUnlimitedWorkspace } from "./workspace-truth";

export type BillingWorkspace = {
  tier?: string | null;
  paygActive?: boolean | null;
  stripeCustomerId?: string | null;
  usageLimit?: number | null;
};

export type PlanCardId = "free" | "usage_based";

export type PlanCardCta =
  | { kind: "current"; label: "Current plan" }
  | { kind: "checkout"; label: "Add payment method" }
  | { kind: "portal"; label: "Manage billing" }
  | { kind: "none" };

export function paygNeedsRecovery(workspace: BillingWorkspace): boolean {
  return (workspace.tier || "free") === "usage_based" && workspace.paygActive !== true;
}

export function billingStatusLabel(workspace: BillingWorkspace): string {
  const tier = workspace.tier || "free";
  if (tier === "founder") return "Founder · unlimited";
  if (tier === "partner") return "Partner · unlimited";
  if (tier === "usage_based") return "Pay as you go";
  if (tier === "free") return "Free";
  if (isUnlimitedWorkspace(workspace)) {
    return `${tier.charAt(0).toUpperCase()}${tier.slice(1)} · unlimited`;
  }
  return `${tier.charAt(0).toUpperCase()}${tier.slice(1)}`;
}

/** Founder/partner (and other non-PAYG unlimited) do not need a card on file. */
export function billingCardRequired(workspace: BillingWorkspace): boolean {
  const tier = workspace.tier || "free";
  if (tier === "founder" || tier === "partner") return false;
  return true;
}

export function planCardCta(planId: PlanCardId, workspace: BillingWorkspace): PlanCardCta {
  const tier = workspace.tier || "free";
  const paygActive = workspace.paygActive === true;
  const hasStripeCustomer = Boolean(workspace.stripeCustomerId);

  if (planId === "free") {
    if (tier === "free") return { kind: "current", label: "Current plan" };
    return { kind: "none" };
  }

  if (tier === "usage_based" && paygActive) {
    return { kind: "current", label: "Current plan" };
  }
  if (paygNeedsRecovery(workspace) && hasStripeCustomer) {
    return { kind: "portal", label: "Manage billing" };
  }
  if (!paygActive) {
    return { kind: "checkout", label: "Add payment method" };
  }
  return { kind: "none" };
}

export function paymentMethodEmptyCopy(workspace: BillingWorkspace): {
  title: string;
  body: string;
  showCheckout: boolean;
} {
  const tier = workspace.tier || "free";
  if (tier === "founder" || tier === "partner") {
    return {
      title: "No card on file",
      body: "Not needed on this plan.",
      showCheckout: false,
    };
  }
  return {
    title: "No payment method on file",
    body: "Add a card to call Paid APIs. Free APIs never need one.",
    showCheckout: tier === "free",
  };
}
