"use client";

import { Suspense, useEffect, useState } from "react";
import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { getClerkAppearance } from "@/lib/clerk-appearance";
import { getCurrentTheme } from "@/lib/theme";
import { SiteHeader } from "@/components/home/SiteHeader";
import { clerkCompanionAuthUrl, clerkForcedRedirectUrl } from "@/lib/auth-continuation";

function SignUpForm() {
  const params = useSearchParams();
  const [appearance, setAppearance] = useState(() => getClerkAppearance("dark"));
  const requested = params?.get("redirect_url") ?? params?.get("next") ?? null;
  const redirectUrl = clerkForcedRedirectUrl(requested);
  const signInUrl = clerkCompanionAuthUrl("/sign-in", requested);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = params?.get("ref");
    if (ref) localStorage.setItem("apiclaw_referral_code", ref);
    setAppearance(getClerkAppearance(getCurrentTheme()));
  }, [params]);

  return (
    <SignUp
      signInUrl={signInUrl}
      appearance={appearance}
      forceRedirectUrl={redirectUrl}
      fallbackRedirectUrl={redirectUrl}
    />
  );
}

export default function SignUpPage() {
  return (
    <main className="claw min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <Suspense fallback={<p className="text-[15px] text-text-secondary">Loading sign-up…</p>}>
          <SignUpForm />
        </Suspense>
      </div>
    </main>
  );
}
