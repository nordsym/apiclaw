"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CheckoutButton } from "@/components/CheckoutButton";
import {
  billingCardRequired,
  billingStatusLabel,
  paymentMethodEmptyCopy,
  paygNeedsRecovery as workspacePaygNeedsRecovery,
  planCardCta,
} from "@/lib/billing-plan";
import { PLANS } from "@/lib/plans";
import { isUnlimitedWorkspace } from "@/lib/workspace-truth";
import { PAYG_MARGIN_RATE } from "@apiclaw/product-truth";
import { CONVEX_URL, Workspace } from "../_shared";
import { PageHeader, Section, Panel, StatGrid, StatCard, Row, Status, Empty, Loading, btnSolid, btnQuiet } from "./ui";

const PAYG_MARGIN_PERCENT = PAYG_MARGIN_RATE * 100;

interface BillingInvoice {
  id: string;
  amount: number;
  status: string;
  createdAt: number;
  pdfUrl?: string;
}

interface BillingInfo {
  currentPeriodStart?: number;
  creditBalance: number;
  monthlySpendCents?: number;
  invoices: BillingInvoice[];
  paymentMethod: { brand: string | null; last4: string | null; type: string | null } | null;
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

async function convexQuery<T>(path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  const data = await res.json();
  if (!res.ok || data.status === "error") throw new Error(data.errorMessage || `${path} failed`);
  return (data.value ?? data) as T;
}

export function BillingTab({
  workspace,
  sessionToken,
}: {
  workspace: Workspace | null;
  sessionToken: string | null;
}) {
  const billingWorkspace = workspace || {};
  const currentTier = workspace?.tier || "free";
  const isPartner = currentTier === "partner";
  const isUnlimited = isUnlimitedWorkspace(billingWorkspace);
  const cardRequired = billingCardRequired(billingWorkspace);
  const paygNeedsRecovery = workspacePaygNeedsRecovery(billingWorkspace);
  const hasStripeCustomer = Boolean(workspace?.stripeCustomerId);
  const emptyPayment = paymentMethodEmptyCopy(billingWorkspace);
  const usageCount = workspace?.usageCount ?? 0;
  const hasPlanLimit = Boolean(workspace?.usageLimit && workspace.usageLimit > 0);
  const usageLimit = hasPlanLimit ? (workspace!.usageLimit as number) : 0;
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [billingInfoLoading, setBillingInfoLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!sessionToken) {
      setBillingInfoLoading(false);
      return;
    }
    setBillingInfoLoading(true);
    convexQuery<BillingInfo | null>("billing:getBillingInfo", { token: sessionToken })
      .then((result) => {
        if (!cancelled) setBillingInfo(result);
      })
      .catch(() => {
        if (!cancelled) setBillingInfo(null);
      })
      .finally(() => {
        if (!cancelled) setBillingInfoLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionToken]);

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
        description={`Free APIs are free forever, no card. Paid APIs cost provider price plus ${PAYG_MARGIN_PERCENT}% after you add a card.`}
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
          <StatCard title="Current plan" value={billingStatusLabel(billingWorkspace)} />
          <StatCard
            title="Calls"
            value={usageCount.toLocaleString()}
            hint={isUnlimited || !hasPlanLimit ? "No cap on this plan" : `of ${usageLimit.toLocaleString()}`}
          />
          {isUnlimited || !hasPlanLimit ? (
            <StatCard
              title="Billing"
              value={cardRequired ? "Active" : "No card required"}
              hint={cardRequired ? "Usage reported to Stripe monthly" : undefined}
            />
          ) : (
            <StatCard
              title="Remaining"
              value={Math.max(0, usageLimit - usageCount).toLocaleString()}
              hint="Calls left on this plan"
            />
          )}
        </StatGrid>
      </Section>

      <Section title="Plans">
        <Panel className="grid gap-px overflow-hidden !bg-[var(--border-subtle)] sm:grid-cols-2">
          {PLANS.map((plan) => {
            const planId = plan.id === "usage_based" ? "usage_based" : "free";
            const cardCta = planCardCta(planId, billingWorkspace);

            let cta: ReactNode;
            if (cardCta.kind === "current") {
              cta = <button type="button" disabled className={`${btnQuiet} mt-7 self-start opacity-60`}>Current plan</button>;
            } else if (cardCta.kind === "portal") {
              cta = <div className="mt-7 self-start">{portalButton(btnSolid)}</div>;
            } else if (cardCta.kind === "checkout") {
              cta = (
                <div className="mt-7 self-start">
                  <CheckoutButton sessionToken={sessionToken || ""} variant="primary">
                    Add payment method
                  </CheckoutButton>
                  {cardCta.note && (
                    <p className="mt-2 max-w-[18rem] text-[12.5px] text-[var(--text-muted)]">{cardCta.note}</p>
                  )}
                </div>
              );
            } else {
              cta = null;
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
        ) : null}
        {portalError && <p className="mt-3 text-[12.5px] text-[var(--accent)]">{portalError}</p>}
        <p className="mt-6 text-[12.5px] text-[var(--text-muted)]">
          Pay as you go continues only for actions with an exact billing adapter. Custom limits or SLA: <a href="/book" className="claw-link text-[var(--text-primary)]">talk to us</a>.
        </p>
      </Section>

      <Section title="Credits and spend">
        {billingInfoLoading ? (
          <Loading label="Loading billing details" />
        ) : (
          <StatGrid cols={3}>
            <StatCard title="Credit balance" value={formatCents(billingInfo?.creditBalance ?? 0)} />
            <StatCard title="This month's spend" value={formatCents(billingInfo?.monthlySpendCents ?? 0)} />
            <StatCard
              title="Current period"
              value={billingInfo?.currentPeriodStart ? new Date(billingInfo.currentPeriodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Not started"}
              hint="Started"
            />
          </StatGrid>
        )}
      </Section>

      <Section title="Invoices">
        {billingInfoLoading ? (
          <Loading label="Loading invoices" />
        ) : billingInfo?.invoices?.length ? (
          <div>
            {billingInfo.invoices.map((inv) => (
              <Row
                key={inv.id}
                right={
                  inv.pdfUrl ? (
                    <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="claw-link text-[var(--text-primary)]">
                      PDF
                    </a>
                  ) : (
                    <span className="text-[var(--text-muted)]">No PDF</span>
                  )
                }
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-[14px]">{new Date(inv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className="text-[14px] text-[var(--text-secondary)]">{formatCents(inv.amount)}</span>
                  <span className="text-[12.5px] capitalize text-[var(--text-muted)]">{inv.status}</span>
                </div>
              </Row>
            ))}
          </div>
        ) : (
          <Empty title="No invoices yet" body="Invoices appear here once a billing period closes." />
        )}
      </Section>

      <Section title="Payment method">
        {billingInfoLoading ? (
          <Loading label="Loading payment method" />
        ) : billingInfo?.paymentMethod ? (
          <Row>
            <p className="text-[14px] capitalize">
              {billingInfo.paymentMethod.brand || billingInfo.paymentMethod.type || "Card"} ending {billingInfo.paymentMethod.last4 || "····"}
            </p>
          </Row>
        ) : (
          <Empty
            title={emptyPayment.title}
            body={emptyPayment.body}
            action={emptyPayment.showCheckout ? <CheckoutButton sessionToken={sessionToken || ""} variant="outline">Add payment method</CheckoutButton> : undefined}
          />
        )}
      </Section>
    </div>
  );
}
