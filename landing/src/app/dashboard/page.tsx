"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/workspace");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[#ef4444] animate-spin mx-auto mb-4" />
        <p className="text-[var(--text-muted)]">Redirecting to workspace...</p>
      </div>
    </div>
  );
}
