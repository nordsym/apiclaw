"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params?.get("t") ?? null;
  const next = params?.get("next") || "/workspace";

  useEffect(() => {
    if (!token) {
      router.replace("/sign-in?error=no_token");
      return;
    }
    try {
      localStorage.setItem("apiclaw_workspace_session", token);
    } catch {
      // localStorage blocked — cookie still works for middleware-protected routes
    }
    router.replace(next);
  }, [token, next, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-4" />
        <p className="text-[var(--text-muted)]">Signing you in…</p>
      </div>
    </main>
  );
}

export default function ClerkCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
