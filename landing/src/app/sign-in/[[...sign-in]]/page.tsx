"use client";

import { useEffect } from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  // Capture device-link code (?link=) and referral code (?ref=) into
  // localStorage so they survive the Clerk OAuth round-trip. The callback
  // page replays them when redirecting to /workspace. Mirrors the legacy
  // email-sign-in behavior.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const link = params.get("link");
    const ref = params.get("ref");
    if (link) localStorage.setItem("apiclaw_pending_link", link);
    if (ref) localStorage.setItem("apiclaw_referral_code", ref);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)] px-6">
      <SignIn
        signUpUrl="/sign-up"
        appearance={{
          elements: {
            formButtonPrimary:
              "bg-red-500 hover:bg-red-600 text-white normal-case",
            card: "bg-[var(--background)] border border-[var(--border-subtle)]",
            headerTitle: "text-[var(--text-primary)]",
            headerSubtitle: "text-[var(--text-secondary)]",
            socialButtonsBlockButton:
              "border border-[var(--border-subtle)] text-[var(--text-primary)]",
            formFieldLabel: "text-[var(--text-secondary)]",
            footerActionLink: "text-red-500 hover:text-red-600",
          },
        }}
      />
    </main>
  );
}
