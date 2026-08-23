"use client";

import { useEffect } from "react";
import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { SiteHeader } from "@/components/home/SiteHeader";

export default function SignUpPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) localStorage.setItem("apiclaw_referral_code", ref);
  }, []);

  return (
    <main className="claw min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-6 py-16">
      <SignUp
        signInUrl="/sign-in"
        appearance={clerkAppearance}
      />
      </div>
    </main>
  );
}
