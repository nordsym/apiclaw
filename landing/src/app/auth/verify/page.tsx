"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://brilliant-puffin-712.eu-west-1.convex.cloud";

interface VerifyResult {
  success: boolean;
  error?: string;
  workspace?: {
    id: string;
    email: string;
    status: string;
    tier: string;
    usageCount: number;
    usageLimit: number;
  };
  sessionToken?: string;
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const referralCode = searchParams.get("ref"); // Referral code from signup URL
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string>("");
  const [workspace, setWorkspace] = useState<VerifyResult["workspace"] | null>(null);
  const [sessionToken, setSessionToken] = useState<string>("");
  
  // Password form state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No verification token provided");
      return;
    }

    verifyToken(token, referralCode || undefined);
  }, [token, referralCode]);

  async function verifyToken(token: string, refCode?: string) {
    try {
      // Build args with optional referral code
      const args: { token: string; referralCode?: string } = { token };
      if (refCode) {
        args.referralCode = refCode;
      }

      const response = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "workspaces:verifyMagicLink",
          args,
        }),
      });

      if (!response.ok) {
        throw new Error("Verification failed");
      }

      const result = await response.json();
      const data: VerifyResult = result.value || result;

      if (data.success) {
        setStatus("success");
        setWorkspace(data.workspace || null);
        setSessionToken(data.sessionToken || "");
        
        // Store session for workspace dashboard
        if (data.sessionToken) {
          localStorage.setItem("apiclaw_workspace_session", data.sessionToken);
          // Auto-redirect to workspace after 2 seconds
          setTimeout(() => {
            window.location.href = "/workspace";
          }, 2000);
        }
      } else {
        setStatus("error");
        switch (data.error) {
          case "invalid_token":
            setError("This verification link is invalid.");
            break;
          case "already_used":
            setError("This verification link has already been used.");
            break;
          case "expired":
            setError("This verification link has expired. Please request a new one.");
            break;
          default:
            setError("Verification failed. Please try again.");
        }
      }
    } catch (err) {
      setStatus("error");
      setError("Something went wrong. Please try again.");
      console.error("Verification error:", err);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }

    try {
      const response = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "workspaces:setPassword",
          args: { sessionToken, password },
        }),
      });

      const result = await response.json();
      const data = result.value || result;

      if (data.success) {
        setPasswordSaved(true);
        setShowPasswordForm(false);
      } else {
        setPasswordError("Failed to set password. Please try again.");
      }
    } catch (err) {
      setPasswordError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-6xl">🦞</span>
          <h1 className="text-2xl font-bold mt-4">APIClaw</h1>
        </div>

        {/* Loading state */}
        {status === "loading" && (
          <div className="bg-[var(--surface)] rounded-xl p-8 text-center border border-[var(--border)]">
            <div className="animate-spin w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">Verifying your email...</p>
          </div>
        )}

        {/* Success state */}
        {status === "success" && (
          <div className="bg-[var(--surface)] rounded-xl p-8 border border-[var(--border)]">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Email Verified!</h2>
              <p className="text-[var(--text-secondary)]">
                Your workspace is now active. Your AI agent can start using APIClaw.
              </p>
            </div>

            {workspace && (
              <div className="bg-[var(--background)] rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Email</span>
                    <span className="font-medium">{workspace.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Plan</span>
                    <span className="font-medium capitalize">{workspace.tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">API Calls</span>
                    <span className="font-medium">{workspace.usageCount} / {workspace.usageLimit}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Password form */}
            {!passwordSaved && !showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full py-3 px-4 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--background)] transition-colors text-sm mb-4"
              >
                Set a password (optional)
              </button>
            )}

            {showPasswordForm && (
              <form onSubmit={handleSetPassword} className="mb-4">
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Password (min. 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-colors"
                  />
                </div>
                {passwordError && (
                  <p className="text-red-500 text-sm mt-2">{passwordError}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="flex-1 py-2 px-4 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--background)] transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity text-sm"
                  >
                    Save Password
                  </button>
                </div>
              </form>
            )}

            {passwordSaved && (
              <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg p-3 text-sm text-center mb-4">
                ✓ Password saved
              </div>
            )}

            <div className="text-center pt-4 border-t border-[var(--border)] space-y-3">
              <a 
                href="/workspace"
                className="inline-flex items-center justify-center px-6 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition w-full"
              >
                Go to Workspace →
              </a>
              <p className="text-[var(--text-muted)] text-sm">
                ✓ Or close this tab if using CLI
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="bg-[var(--surface)] rounded-xl p-8 border border-[var(--border)]">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Verification Failed</h2>
              <p className="text-[var(--text-secondary)] mb-6">{error}</p>
              <a
                href="/"
                className="inline-block py-3 px-6 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity"
              >
                Go to Homepage
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[var(--text-muted)] text-xs mt-6">
          Having trouble? Contact{" "}
          <a href="mailto:support_apiclaw@nordsym.com" className="text-[var(--accent)] hover:underline">
            support_apiclaw@nordsym.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl">🦞</span>
          <p className="mt-4 text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
