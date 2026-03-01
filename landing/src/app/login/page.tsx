"use client";

import { useState, useEffect } from "react";
import { Mail, Loader2, Check, ArrowRight, Sun, Moon, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      try {
        const res = await fetch("/api/workspace-auth/session");
        const data = await res.json();
        if (data.session) {
          router.push("/workspace");
          return;
        }
      } catch {
        // Not logged in, continue
      }
    };
    checkSession();

    const saved = localStorage.getItem("theme");
    const prefersDark = saved ? saved === "dark" : true;
    setIsDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, [router]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Check for stored referral code (from /join page)
      const referralCode = localStorage.getItem("apiclaw_referral_code");

      const response = await fetch("/api/workspace-auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, referralCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send magic link");
      }

      // Clear referral code after sending (it will be in the email link)
      localStorage.removeItem("apiclaw_referral_code");

      setIsSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-[var(--background)]">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-8">
            <Check className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Check Your Email</h1>
          <p className="text-[var(--text-secondary)] mb-2">
            We&apos;ve sent a magic link to:
          </p>
          <p className="font-semibold text-lg mb-8">{email}</p>
          <p className="text-sm text-[var(--text-muted)]">
            Click the link in the email to sign in. The link expires in 15 minutes.
          </p>
          <button
            onClick={() => setIsSent(false)}
            className="mt-8 text-accent hover:underline"
          >
            Use a different email
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center text-xl">
              🦞
            </div>
            <span className="font-bold text-lg tracking-tight">APIClaw</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[var(--surface)] transition"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="pt-32 pb-24 px-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Agent Workspace</h1>
            <p className="text-[var(--text-secondary)]">
              Sign in to manage your AI agents and view usage
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="you@company.com"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-accent focus:outline-none transition"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Magic Link
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[var(--border)]">
              <div className="space-y-3 text-sm text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>50 free API calls per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Connect unlimited AI agents</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Usage analytics & monitoring</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Are you an API provider?{" "}
              <Link href="/providers/dashboard/login" className="text-accent hover:underline">
                Provider Dashboard
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
