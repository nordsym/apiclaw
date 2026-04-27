"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params?.get("next") || "/sign-in";

  useEffect(() => {
    try {
      localStorage.removeItem("apiclaw_workspace_session");
      localStorage.removeItem("apiclaw_pending_link");
    } catch {
      // localStorage blocked — cookie + Convex session are already cleared
    }
    router.replace(next);
  }, [next, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-4" />
        <p className="text-[var(--text-muted)]">Signing you out…</p>
      </div>
    </main>
  );
}

export default function ClerkSignoutCallbackPage() {
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
