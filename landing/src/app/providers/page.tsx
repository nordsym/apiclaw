"use client";

import { useState } from "react";
import { Mail, ArrowRight, Check, Sparkles } from "lucide-react";

export default function ProvidersLoginPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    // In production, this would call the Convex createMagicLink mutation
    // and send an email via SendGrid/Resend
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-2xl">
            🦞
          </div>
          <span className="font-bold text-2xl tracking-tight">APIClaw</span>
        </div>

        {!submitted ? (
          <div className="bg-surface-elevated rounded-2xl border border-border p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Provider Login</h1>
              <p className="text-text-muted">
                Enter your email to access your dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-text-primary bg-surface border border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="animate-pulse">Sending link...</span>
                ) : (
                  <>
                    Continue with Email
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-text-muted mt-6">
              We'll send you a magic link to sign in.
              <br />
              No password required.
            </p>
          </div>
        ) : (
          <div className="bg-surface-elevated rounded-2xl border border-border p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Check your email</h2>
            <p className="text-text-muted mb-6">
              We sent a magic link to
              <br />
              <span className="text-text-primary font-medium">{email}</span>
            </p>
            <p className="text-sm text-text-muted">
              Click the link in your email to sign in.
              <br />
              The link expires in 15 minutes.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-6 text-sm text-accent hover:underline"
            >
              Use a different email
            </button>
          </div>
        )}

        {/* Demo Link */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface rounded-full text-sm text-text-muted">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>
              Want to explore?{" "}
              <a href="/providers/dashboard" className="text-accent hover:underline font-medium">
                View demo dashboard
              </a>
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-text-muted mt-12">
          Don't have an account?{" "}
          <a href="/providers/register" className="text-accent hover:underline">
            Register as a provider
          </a>
        </p>
      </div>
    </main>
  );
}
