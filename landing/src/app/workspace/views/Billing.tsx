"use client";

import { useState, type ReactNode } from "react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { PLANS } from "@/lib/plans";
import { isUnlimitedWorkspace } from "@/lib/workspace-truth";
import {
  FREE_MANAGED_CALLS_LIFETIME,
  FREE_MANAGED_PROVIDER_COST_CAP_USD,
  PAYG_MARGIN_RATE,
} from "@apiclaw/product-truth";
import { Workspace } from "../_shared";
import { PageHeader, Section, Panel, StatGrid, StatCard, Row, Status, Empty, btnSolid, btnQuiet } from "./ui";

const PAYG_MARGIN_PERCENT = PAYG_MARGIN_RATE * 100;

function planLabel(tier: string): string {
  if (tier === "partner") return "Partner";
  if (tier === "usage_based") return "Pay as you go";
  if (tier === "free") return "Free";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function BillingTab({
  workspace,
  sessionToken,
}: {
  workspace: Workspace | null;
  sessionToken: string | null;
}) {
  const currentTier = workspace?.tier || "free";
  const isPartner = currentTier === "partner";
  const isUnlimited = isUnlimitedWorkspace(workspace || {});
  const paygNeedsRecovery = currentTier === "usage_based" && workspace?.paygActive !== true;
  const hasStripeCustomer = Boolean(workspace?.stripeCustomerId);
  const usageCount = workspace?.usageCount ?? 0;
  const usageLimit = workspace?.usageLimit ?? FREE_MANAGED_CALLS_LIFETIME;
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const openBillingPortal = async () => {
    if (!sessionToken) {
      setPortalError("Sign in again to manage billing.");
      return;
    }
    setPortalLoading(true);
    setPortalError(null);
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: sessionToken }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Could not open the billing portal");
      }
      window.location.href = data.url;
    } catch (error) {
      setPortalError(error instanceof Error ? error.message : "Could not open the billing portal");
      setPortalLoading(false);
    }
  };

  const portalButton = (cls: string, label = "Manage billing") => (
    <button type="button" onClick={openBillingPortal} disabled={portalLoading} className={`${cls} disabled:opacity-50`}>
      {portalLoading ? "Opening…" : label}
    </button>
  );

  return (
    <div className="space-y-10">
      <PageHeader
        title="Billing"
        description={`Discovery is free. Managed calls cost provider price plus ${PAYG_MARGIN_PERCENT}% after the free allowance.`}
      />

      <Section title="Plan">
        {paygNeedsRecovery && (
          <Row
            right={hasStripeCustomer ? portalButton(btnSolid) : <a href="/book" className={btnQuiet}>Contact support</a>}
          >
            <Status kind="warn">Pay as you go is paused</Status>
            <p className="mt-1 text-[13px] text-[var(--text-muted)]">
              Calls resume once Stripe confirms the subscription and payment method
              {workspace?.stripeSubscriptionStatus ? ` (status: ${workspace.stripeSubscriptionStatus})` : ""}.
            </p>
          </Row>
        )}
        <StatGrid cols={3}>
          <StatCard title="Current plan" value={planLabel(currentTier)} />
          <StatCard
            title="Managed calls"
            value={usageCount.toLocaleString()}
            hint={isUnlimited ? "No cap on this plan" : `of ${usageLimit.toLocaleString()} lifetime`}
          />
          {isUnlimited ? (
            <StatCard title="Billing" value={isPartner ? "By agreement" : "Active"} hint={isPartner ? undefined : "Usage reported to Stripe monthly"} />
          ) : (
            <StatCard
              title="Remaining"
              value={Math.max(0, usageLimit - usageCount).toLocaleString()}
              hint={`Free tier also caps at $${FREE_MANAGED_PROVIDER_COST_CAP_USD} provider cost`}
            />
          )}
        </StatGrid>
      </Section>

      <Section title="Plans">
        <Panel className="grid gap-px overflow-hidden !bg-[var(--border-subtle)] sm:grid-cols-2">
          {PLANS.map((plan) => {
            const isPaygPlan = plan.id === "usage_based";
            const isCurrent = isPaygPlan
              ? currentTier === "usage_based" && workspace?.paygActive === true
              : currentTier === plan.id || (isPartner && plan.id === "free");

            let cta: ReactNode;
            if (isCurrent) {
              cta = <button type="button" disabled className={`${btnQuiet} mt-7 self-start opacity-60`}>Current plan</button>;
            } else if (isPaygPlan && paygNeedsRecovery && hasStripeCustomer) {
              cta = <div className="mt-7 self-start">{portalButton(btnSolid)}</div>;
            } else if (isPaygPlan && currentTier === "free") {
              cta = (
                <CheckoutButton sessionToken={sessionToken || ""} variant="primary" className="mt-7">
                  Add payment method
                </CheckoutButton>
              );
            } else {
              cta = <a href="/book" className={`${btnQuiet} mt-7 self-start`}>Talk to us</a>;
            }

            return (
              <div key={plan.id} className="flex flex-col bg-[var(--surface)] p-6 sm:p-7">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[15px] font-semibold">{plan.name}</h3>
                  {plan.highlight && <span className="claw-eyebrow !text-[10.5px] text-[var(--text-muted)]">Recommended</span>}
                </div>
                <div className="mt-4 claw-display text-[2rem]">{plan.price}</div>
                <p className="text-[13px] text-[var(--text-muted)]">{plan.period}</p>
                <p className="mt-4 text-[14px] text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)]">{plan.calls}</span> {plan.callsSub}
                </p>
                <ul className="mt-5 flex-1 space-y-2 text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <span className="mt-[9px] h-px w-3 flex-none bg-[var(--text-muted)]" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                {cta}
              </div>
            );
          })}
        </Panel>
      </Section>

      <Section title="Invoices and payment method">
        {hasStripeCustomer ? (
          <Row right={portalButton(btnQuiet, "Open Stripe portal")}>
            <p className="text-[14px]">Stripe billing portal</p>
            <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">Invoices, receipts, payment method and cancellation.</p>
          </Row>
        ) : isPartner ? (
          <Empty title="Billed by agreement" body="Partner workspaces are invoiced outside Stripe." />
        ) : (
          <Empty
            title="No invoices yet"
            body="Invoices appear here once a payment method is on file."
            action={currentTier === "free" ? <CheckoutButton sessionToken={sessionToken || ""} variant="outline">Add payment method</CheckoutButton> : undefined}
          />
        )}
        {portalError && <p className="mt-3 text-[12.5px] text-[var(--accent)]">{portalError}</p>}
        <p className="mt-6 text-[12.5px] text-[var(--text-muted)]">
          Pay as you go continues only for actions with an exact billing adapter. Custom limits or SLA: <a href="/book" className="claw-link text-[var(--text-primary)]">talk to us</a>.
        </p>
      </Section>
    </div>
  );
}
