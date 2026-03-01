"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";

interface BillingStatus {
  tier: string;
  status: string;
  usageCount: number;
  usageLimit: number;
  usageRemaining: number;
  usagePercent: number;
  hasStripe: boolean;
  email: string;
}

async function queryConvex<T>(path: string, args: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  const result = await response.json();
  return result.value !== undefined ? result.value : result;
}

async function actionConvex<T>(path: string, args: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${CONVEX_URL}/api/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  const result = await response.json();
  return result.value !== undefined ? result.value : result;
}

function UpgradeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceId = searchParams.get("ws");
  const success = searchParams.get("success");
  
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setError("Missing workspace ID");
      setLoading(false);
      return;
    }

    async function loadBilling() {
      try {
        const status = await queryConvex<BillingStatus | null>("billing:getBillingStatus", {
          workspaceId,
        });
        setBilling(status);
      } catch (err) {
        setError("Failed to load billing status");
      } finally {
        setLoading(false);
      }
    }

    loadBilling();
  }, [workspaceId]);

  const handleUpgrade = async () => {
    if (!workspaceId) return;
    
    setUpgrading(true);
    setError(null);

    try {
      const result = await actionConvex<{
        success: boolean;
        url?: string;
        error?: string;
      }>("billing:createCheckoutSession", {
        workspaceId,
        successUrl: `${window.location.origin}/upgrade?ws=${workspaceId}&success=true`,
        cancelUrl: `${window.location.origin}/upgrade?ws=${workspaceId}`,
      });

      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        setError(result.error || "Failed to create checkout session");
        setUpgrading(false);
      }
    } catch (err) {
      setError("Failed to start upgrade process");
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error && !billing) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-md text-center">
          <div className="text-red-400 text-lg font-medium mb-2">Error</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  const isPro = billing?.tier === "pro" || billing?.tier === "enterprise";

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">
            APIClaw Workspace
          </h1>
          <p className="text-gray-400">
            {billing?.email}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-8 text-center">
            <div className="text-green-400 font-medium">
              🎉 Upgrade successful! Welcome to APIClaw Pro.
            </div>
          </div>
        )}

        {/* Current Plan Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-sm text-gray-400 mb-1">Current Plan</div>
              <div className="text-2xl font-bold text-white capitalize">
                {billing?.tier || "Free"}
                {isPro && <span className="ml-2 text-sm text-emerald-400">✓ Active</span>}
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              isPro ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-800 text-gray-400"
            }`}>
              {isPro ? "Pro" : "Free Tier"}
            </div>
          </div>

          {/* Usage Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">API Calls This Month</span>
              <span className="text-white font-medium">
                {billing?.usageCount.toLocaleString()} / {billing?.usageLimit === -1 ? "∞" : billing?.usageLimit.toLocaleString()}
              </span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  (billing?.usagePercent || 0) > 80 ? "bg-red-500" : 
                  (billing?.usagePercent || 0) > 50 ? "bg-yellow-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(billing?.usagePercent || 0, 100)}%` }}
              />
            </div>
            {!isPro && billing && billing.usageRemaining > 0 && billing.usageRemaining < 20 && (
              <div className="text-sm text-yellow-400 mt-2">
                ⚠️ Only {billing.usageRemaining} calls remaining
              </div>
            )}
          </div>

          {/* Plan Features */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <span className={isPro ? "text-emerald-400" : "text-gray-600"}>✓</span>
              <span>{isPro ? "Unlimited" : "50"} API calls{isPro ? "" : "/week"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className={isPro ? "text-emerald-400" : "text-gray-600"}>✓</span>
              <span>{isPro ? "10/hour" : "Priority support"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className={isPro ? "text-emerald-400" : "text-gray-600"}>✓</span>
              <span>All Direct Call providers</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className={isPro ? "text-emerald-400" : "text-gray-600"}>✓</span>
              <span>API discovery</span>
            </div>
          </div>
        </div>

        {/* Upgrade Card (only show for free tier) */}
        {!isPro && (
          <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xl font-bold text-white mb-1">
                  🦞 Become a Founding Backer
                </div>
                <div className="text-gray-400">
                  Unlimited API calls until Dec 31, 2026
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">$99</div>
                <div className="text-gray-400 text-sm">one-time</div>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm mb-4 bg-red-900/20 p-3 rounded">
                {error}
              </div>
            )}

            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                upgrading
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}
            >
              {upgrading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                "Add Payment Method →"
              )}
            </button>

            <div className="text-center text-gray-500 text-xs mt-4">
              Secure payment via Stripe. One-time payment, no subscription.
            </div>
          </div>
        )}

        {/* Already Backer Message */}
        {isPro && !success && (
          <div className="text-center text-gray-400">
            🦞 You&apos;re a Founding Backer! Unlimited API calls until Dec 31, 2026.
          </div>
        )}

        {/* Back Link */}
        <div className="text-center mt-8">
          <a href="/" className="text-gray-500 hover:text-gray-400 text-sm">
            ← Back to APIClaw
          </a>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  );
}
