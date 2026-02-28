"use client";

import { useState } from "react";
import { CreditCard, Loader2, ChevronRight, AlertCircle, Zap } from "lucide-react";

interface CheckoutButtonProps {
  sessionToken: string;
  variant?: "primary" | "outline" | "banner";
  children?: React.ReactNode;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

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
      setError("Not logged in");
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
        // Redirect to Stripe Checkout
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

  // Base styles
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  // Variant styles
  const variantStyles = {
    primary: "px-6 py-3 rounded-xl bg-[#ef4444] text-white hover:bg-[#dc2626] hover:scale-[1.02] active:scale-[0.98]",
    outline: "px-6 py-3 rounded-xl border-2 border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white",
    banner: "px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
  };

  return (
    <div className={className}>
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className={`${baseStyles} ${variantStyles[variant]}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Setting up...
          </>
        ) : children ? (
          children
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Add Payment Method
            <ChevronRight className="w-4 h-4" />
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Usage Warning Banner - shown at 80% usage
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
    <div className="mb-6 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-semibold text-yellow-500">Running Low on API Calls</h3>
            <p className="text-sm text-[var(--text-muted)]">
              You&apos;ve used {usageCount.toLocaleString()} of {usageLimit.toLocaleString()} calls ({usagePercentage.toFixed(0)}%).
              Add a payment method to continue using APIs without interruption.
            </p>
          </div>
        </div>
        <CheckoutButton
          sessionToken={sessionToken}
          variant="outline"
          className="flex-shrink-0"
        >
          <CreditCard className="w-4 h-4" />
          Upgrade
        </CheckoutButton>
      </div>
    </div>
  );
}

// Usage Exceeded Banner - shown at 100% usage
export function UsageExceededBanner({
  usageCount,
  usageLimit,
  sessionToken,
}: {
  usageCount: number;
  usageLimit: number;
  sessionToken: string;
}) {
  return (
    <div className="mb-6 rounded-xl bg-gradient-to-r from-[#ef4444]/20 to-red-600/20 border border-[#ef4444]/50 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#ef4444]/20 flex items-center justify-center flex-shrink-0 animate-pulse">
            <Zap className="w-6 h-6 text-[#ef4444]" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[#ef4444]">API Limit Reached</h3>
            <p className="text-sm text-[var(--text-muted)] mb-1">
              You&apos;ve used all {usageLimit.toLocaleString()} free API calls this month.
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Add a payment method to unlock unlimited usage at <span className="font-semibold text-[#ef4444]">$0.01/call</span>.
            </p>
          </div>
        </div>
        <CheckoutButton
          sessionToken={sessionToken}
          variant="primary"
          className="flex-shrink-0"
        >
          <Zap className="w-5 h-5" />
          Continue Using APIs
          <ChevronRight className="w-4 h-4" />
        </CheckoutButton>
      </div>
    </div>
  );
}
