"use client";

import { useEffect, useState } from "react";
import { SignUp } from "@clerk/nextjs";
import { getClerkAppearance } from "@/lib/clerk-appearance";
import { getCurrentTheme } from "@/lib/theme";
import { SiteHeader } from "@/components/home/SiteHeader";

export default function SignUpPage() {
  const [appearance, setAppearance] = useState(() => getClerkAppearance("dark"));
  const [redirectUrl, setRedirectUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("apiclaw_referral_code", ref);
    // Same redirect_url handoff as /sign-in — /sign-in's own "Sign up" link
    // forwards it here, so a signed-out user finishing an OAuth request via
    // sign-up also lands back on /oauth/authorize.
    const target = params.get("redirect_url");
    if (target) setRedirectUrl(target);
    setAppearance(getClerkAppearance(getCurrentTheme()));
  }, []);

  return (
    <main className="claw min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-6 py-16">
      <SignUp
        signInUrl="/sign-in"
        appearance={appearance}
        fallbackRedirectUrl={redirectUrl}
      />
      </div>
    </main>
  );
}
