"use client";

import { useEffect, useState } from "react";
import { SignIn } from "@clerk/nextjs";
import { getClerkAppearance } from "@/lib/clerk-appearance";
import { getCurrentTheme } from "@/lib/theme";
import { SiteHeader } from "@/components/home/SiteHeader";

export default function SignInPage() {
  const [appearance, setAppearance] = useState(() => getClerkAppearance("dark"));

  // Preserve referral attribution across the Clerk OAuth round-trip.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("apiclaw_referral_code", ref);
    setAppearance(getClerkAppearance(getCurrentTheme()));
  }, []);

  return (
    <main className="claw min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-6 py-16">
      <SignIn
        signUpUrl="/sign-up"
        appearance={appearance}
      />
      </div>
    </main>
  );
}
