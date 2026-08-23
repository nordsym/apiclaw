"use client";

import { useEffect, useState } from "react";
import { SignIn } from "@clerk/nextjs";
import { getClerkAppearance } from "@/lib/clerk-appearance";
import { getCurrentTheme } from "@/lib/theme";
import { SiteHeader } from "@/components/home/SiteHeader";

export default function SignInPage() {
  const [appearance, setAppearance] = useState(() => getClerkAppearance("dark"));
  const [redirectUrl, setRedirectUrl] = useState<string | undefined>(undefined);

  // Preserve referral attribution across the Clerk OAuth round-trip.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("apiclaw_referral_code", ref);
    // middleware.ts sends unauthed users here with ?redirect_url=<original
    // path+query> (e.g. back to /oauth/authorize with the full OAuth request
    // intact). Clerk's <SignIn/> does not read that param on its own in
    // Core 2 — it must be passed explicitly or the post-sign-in redirect
    // falls back to the default and the OAuth request is lost.
    const target = params.get("redirect_url");
    if (target) setRedirectUrl(target);
    setAppearance(getClerkAppearance(getCurrentTheme()));
  }, []);

  return (
    <main className="claw min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-6 py-16">
      <SignIn
        signUpUrl="/sign-up"
        appearance={appearance}
        fallbackRedirectUrl={redirectUrl}
      />
      </div>
    </main>
  );
}
