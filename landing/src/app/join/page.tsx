"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Handle null searchParams
  if (!searchParams) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  const refCode = searchParams.get("ref");

  useEffect(() => {
    // Store referral code in localStorage for use during signup
    if (refCode) {
      localStorage.setItem("apiclaw_referral_code", refCode);
    }

    // Redirect to Clerk sign-in
    router.push("/sign-in");
  }, [refCode, router]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="text-center">
        <span className="text-6xl animate-bounce">🦞</span>
        <p className="mt-4 text-[var(--text-secondary)]">
          {refCode ? "Processing your invite..." : "Redirecting to sign in..."}
        </p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl">🦞</span>
            <p className="mt-4 text-[var(--text-secondary)]">Loading...</p>
          </div>
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}
