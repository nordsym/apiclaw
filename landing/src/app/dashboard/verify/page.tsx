"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, Check } from "lucide-react";
import Link from "next/link";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No verification token provided");
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch("/api/workspace-auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Verification failed");
        }

        // Store session token in localStorage as backup
        if (data.sessionToken) {
          localStorage.setItem("apiclaw_workspace_session", data.sessionToken);
        }

        setStatus("success");

        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Verification failed");
      }
    };

    verify();
  }, [token, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[var(--background)]">
      <div className="max-w-md w-full text-center">
        {status === "verifying" && (
          <>
            <Loader2 className="w-16 h-16 text-accent animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">Verifying...</h1>
            <p className="text-[var(--text-muted)]">Please wait while we sign you in.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Success!</h1>
            <p className="text-[var(--text-muted)]">Redirecting to your dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
            <p className="text-red-500 mb-6">{error}</p>
            <Link href="/login" className="btn-primary">
              Try Again
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-6 bg-[var(--background)]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-accent animate-spin mx-auto mb-6" />
          <p className="text-[var(--text-muted)]">Loading...</p>
        </div>
      </main>
    }>
      <VerifyContent />
    </Suspense>
  );
}
