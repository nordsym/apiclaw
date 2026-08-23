"use client";

import { useState } from "react";
import { FREE_MANAGED_PROVIDER_COST_CAP_USD, PAYG_MARGIN_RATE } from "@apiclaw/product-truth";
import { btnQuiet, btnSolid } from "@/app/workspace/views/ui";

const PAYG_MARGIN_PERCENT = PAYG_MARGIN_RATE * 100;

interface CheckoutButtonProps {
  sessionToken: string;
  /** `primary` is the solid button. `outline` and `banner` both render the quiet button. */
  variant?: "primary" | "outline" | "banner";
  children?: React.ReactNode;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/** Starts a Stripe Checkout setup session and redirects. Keep the fetch contract in sync with /api/billing/checkout. */
export function CheckoutButton({
  sessionToken,
  variant = "primary",
  children,
  className = "",
  onSuccess,
  onError,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!sessionToken) {
      setError("Sign in again to continue.");
      onError?.("Not logged in");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: sessionToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
        onSuccess?.();
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Checkout failed";
      setError(message);
      onError?.(message);
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <button type="button" onClick={handleCheckout} disabled={isLoading} className={`${variant === "primary" ? btnSolid : btnQuiet} disabled:opacity-50`}>
        {isLoading ? "Opening Stripe…" : children ?? "Add payment method"}
      </button>
      {error && <p className="mt-2 text-[12.5px] text-[var(--accent)]">{error}</p>}
    </div>
  );
}

function UsageStrip({ title, body, danger, action }: { title: string; body: string; danger?: boolean; action: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-3 border-y border-[var(--border-subtle)] py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className={`text-[14px] font-medium ${danger ? "text-[var(--accent)]" : ""}`}>{title}</p>
        <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">{body}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

/** Shown between 80% and 100% of the free allowance. */
export function UsageWarningBanner({
  usagePercentage,
  usageCount,
  usageLimit,
  sessionToken,
}: {
  usagePercentage: number;
  usageCount: number;
  usageLimit: number;
  sessionToken: string;
}) {
  if (usagePercentage < 80 || usagePercentage >= 100) return null;

  return (
    <UsageStrip
      title="Free calls running low"
      body={`${usageCount.toLocaleString()} of ${usageLimit.toLocaleString()} managed calls used. Add a payment method to keep billing-ready actions running after the free allowance.`}
      action={<CheckoutButton sessionToken={sessionToken} variant="outline">Add payment method</CheckoutButton>}
    />
  );
}

/** Shown once the free allowance is used up. */
export function UsageExceededBanner({
  usageLimit,
  sessionToken,
}: {
  usageCount?: number;
  usageLimit: number;
  sessionToken: string;
}) {
  return (
    <UsageStrip
      danger
      title="Free allowance used"
      body={`The free workspace covers ${usageLimit.toLocaleString()} managed calls or $${FREE_MANAGED_PROVIDER_COST_CAP_USD} in provider cost. Add a payment method to continue at provider cost plus ${PAYG_MARGIN_PERCENT}%.`}
      action={<CheckoutButton sessionToken={sessionToken} variant="primary">Add payment method</CheckoutButton>}
    />
  );
}
