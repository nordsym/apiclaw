"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { paymentMethodLabel } from "@/lib/billing-presentation";
import { recoverWorkspaceSessionToken } from "@/lib/workspace-session";
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
  return data.value as T;
}

function planLabel(tier: string): string {
  if (tier === "partner") return "Partner";
  if (tier === "usage_based") return "Pay as you go";
  if (tier === "free") return "Free";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function BillingTab({
  workspace,
  sessionToken,
  returnedFromStripe = false,
}: {
  workspace: Workspace | null;
  sessionToken: string | null;
  returnedFromStripe?: boolean;
}) {
  const currentTier = workspace?.tier || "free";
  const isPartner = currentTier === "partner";
  const isUnlimited = isUnlimitedWorkspace(workspace || {});
  const paygNeedsRecovery = currentTier === "usage_based" && workspace?.paygActive !== true;
  const hasStripeCustomer = Boolean(workspace?.stripeCustomerId);
  const usageCount = workspace?.usageCount ?? 0;
  const hasPlanLimit = Boolean(workspace?.usageLimit && workspace.usageLimit > 0);
  const usageLimit = hasPlanLimit ? (workspace!.usageLimit as number) : 0;
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [billingInfoLoading, setBillingInfoLoading] = useState(true);
  const [billingInfoError, setBillingInfoError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const recoveryAttempted = useRef(false);
  const paymentConnected = !billingInfoLoading && !billingInfoError && Boolean(billingInfo?.paymentMethod);

  useEffect(() => {
    const onFocus = () => setRefresh((value) => value + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    if (!sessionToken) {
      setBillingInfoError(true);
      setBillingInfoLoading(false);
      return;
    }
    setBillingInfoLoading(true);
    setBillingInfoError(false);
    const load = () => {
      attempts += 1;
      void convexQuery<BillingInfo | null>("billing:getBillingInfo", { token: sessionToken })
      .then(async (result) => {
        if (cancelled) return;
        if (result === null && !recoveryAttempted.current) {
          recoveryAttempted.current = true;
          const renewedToken = await recoverWorkspaceSessionToken(sessionToken);
          if (cancelled) return;
          if (renewedToken) {
            result = await convexQuery<BillingInfo | null>("billing:getBillingInfo", { token: renewedToken });
          }
        }
        if (!cancelled) {
          if (result !== null) recoveryAttempted.current = false;
          setBillingInfo(result);
          setBillingInfoError(result === null);
        }
      })
      .catch(() => {
        if (!cancelled) setBillingInfoError(true);
      })
      .finally(() => {
        if (!cancelled) {
          setBillingInfoLoading(false);
          // Stripe can return before its webhook is delivered. Keep the visible
          // summary current during this bounded return window, including edits.
          if (returnedFromStripe && attempts < 15) timer = setTimeout(load, 2_000);
        }
      });
    };
    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionToken, refresh, returnedFromStripe]);

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

  const paymentAction = (label: string) => hasStripeCustomer && currentTier !== "free"
    ? portalButton(paymentConnected ? btnQuiet : btnSolid, label)
    : <CheckoutButton sessionToken={sessionToken || ""}>{label}</CheckoutButton>;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Billing"
        description={paymentConnected
          ? `Your payment method is connected. Free APIs remain free; Paid APIs cost provider price plus ${PAYG_MARGIN_PERCENT}%.`
          : `Free APIs remain free. Paid APIs cost provider price plus ${PAYG_MARGIN_PERCENT}%.`}
      />

      <Section title="Payment method">
        {billingInfoLoading ? (
          <Loading label="Checking payment method" />
        ) : billingInfoError ? (
          <Row right={<button type="button" className={btnQuiet} onClick={() => { recoveryAttempted.current = false; setRefresh((value) => value + 1); }}>Try again</button>}>
            <p className="text-[14px]">Could not load payment details.</p>
          </Row>
        ) : billingInfo?.paymentMethod ? (
          <Row>
            <p className="text-[14px] font-medium">{paymentMethodLabel(billingInfo.paymentMethod)}</p>
            <Status kind="ok">Connected</Status>
          </Row>
        ) : (
          <Row>
            <p className="text-[14px]">No payment method connected</p>
            <p className="mt-1 text-[13px] text-[var(--text-muted)]">Add a card securely with Stripe. Free APIs never need one.</p>
          </Row>
        )}
        {portalError && <p role="alert" className="mt-3 text-[12.5px] text-[var(--accent)]">{portalError}</p>}
      </Section>

      <Section title="Plan">
        {paygNeedsRecovery && (
          <Row>
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
            title="Calls"
            value={usageCount.toLocaleString()}
            hint={isUnlimited || !hasPlanLimit ? "No cap on this plan" : `of ${usageLimit.toLocaleString()}`}
          />
          {isUnlimited || !hasPlanLimit ? (
            <StatCard title="Billing" value={isPartner ? "By agreement" : currentTier === "usage_based" ? (workspace?.paygActive ? "Active" : "Pending") : "Included"} hint={currentTier === "usage_based" && workspace?.paygActive ? "Usage reported to Stripe monthly" : undefined} />
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
            const isPaygPlan = plan.id === "usage_based";
            const isCurrent = isPaygPlan
              ? currentTier === "usage_based" && workspace?.paygActive === true
              : currentTier === plan.id || (isPartner && plan.id === "free");

            let cta: ReactNode;
            if (isPaygPlan && (billingInfoLoading || billingInfoError)) {
              cta = <button type="button" disabled className={`${btnQuiet} mt-7 self-start opacity-60`}>{billingInfoLoading ? "Checking payment method…" : "Payment details unavailable"}</button>;
            } else if (isCurrent && isPaygPlan) {
              cta = <div className="mt-7 self-start">{portalButton(btnQuiet, "Manage payment method")}</div>;
            } else if (isCurrent) {
              cta = <button type="button" disabled className={`${btnQuiet} mt-7 self-start opacity-60`}>Current plan</button>;
            } else if (isPaygPlan && paygNeedsRecovery && hasStripeCustomer) {
              cta = <div className="mt-7 self-start">{portalButton(btnSolid)}</div>;
            } else if (isPaygPlan) {
              cta = (
                <div className="mt-7 self-start">
                  {paymentAction(paymentConnected ? (currentTier === "free" ? "Continue billing setup" : "Manage payment method") : "Add payment method")}
                </div>
              );
            } else {
              cta = <span className="mt-7 text-[13px] text-[var(--text-muted)]">Included</span>;
            }

            return (
              <div key={plan.id} className="flex flex-col bg-[var(--surface)] p-6 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-[15px] font-semibold">{plan.name}</h3>
                  {isPaygPlan && paymentConnected ? (
                    <span className="rounded-full border border-[var(--ok)] px-3 py-1">
                      <Status kind="ok">Payment method connected</Status>
                    </span>
                  ) : plan.highlight && <span className="claw-eyebrow !text-[10.5px] text-[var(--text-muted)]">Recommended</span>}
                </div>
                <div className="mt-4 claw-display text-[2rem]">{plan.price}</div>
                <p className="text-[13px] text-[var(--text-muted)]">{plan.period}</p>
                <p className="mt-4 text-[14px] text-[var(--text-secondary)]">
                  <span className="text-[var(--text-primary)]">{plan.calls}</span> {isPaygPlan && paymentConnected ? `provider cost plus ${PAYG_MARGIN_PERCENT}%` : plan.callsSub}
                </p>
                <ul className="mt-5 flex-1 space-y-2 text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <span className="mt-[9px] h-px w-3 flex-none bg-[var(--text-muted)]" aria-hidden="true" />
                      {isPaygPlan && paymentConnected && f === "Add a card once, pay per call" ? "Payment method saved securely with Stripe" : f}
                    </li>
                  ))}
                </ul>
                {cta}
              </div>
            );
          })}
        </Panel>
      </Section>


      {!billingInfoError && <>
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
      </>}
    </div>
  );
}
