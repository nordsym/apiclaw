// /oauth/authorize — consent screen for the Authorization Code flow.
// Middleware ensures the user has an apiclaw_workspace_session before this
// page renders, so we can trust the cookie. The actual mint happens in
// /api/oauth/authorize after the user clicks "Authorize".
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseSafeOAuthRedirectUri } from "@/lib/oauth-redirect";
import {
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

export const dynamic = "force-dynamic";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://adventurous-avocet-799.convex.cloud";

type ClientMeta = {
  clientId: string;
  name: string;
  registrationKind: "dashboard" | "dynamic";
  requiresSecret: boolean;
  scope: string;
};

type Phase = "loading" | "review" | "authorizing" | "redirecting" | "error";

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  mcp: "Use APIClaw's MCP tools (discover and call APIs, check balance).",
  "mcp:read": "Read API catalog and balance.",
  "mcp:call": "Execute API calls through APIClaw.",
  "mcp:billing": "Read billing usage data.",
};

export default function OAuthAuthorizePage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <AuthorizeInner />
    </Suspense>
  );
}

function LoadingShell() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex items-center justify-center px-4">
      <Loader2 className="w-8 h-8 animate-spin text-[#ef4444]" />
    </div>
  );
}

function AuthorizeInner() {
  const router = useRouter();
  const params = useSearchParams();

  const clientId = params?.get("client_id") ?? "";
  const redirectUri = params?.get("redirect_uri") ?? "";
  const responseType = params?.get("response_type") ?? "code";
  const state = params?.get("state") ?? "";
  const codeChallenge = params?.get("code_challenge") ?? "";
  const codeChallengeMethod = params?.get("code_challenge_method") ?? "S256";
  const requestedScope = params?.get("scope") ?? null;

  const [phase, setPhase] = useState<Phase>("loading");
  const [client, setClient] = useState<ClientMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);
  const reviewScope = requestedScope ?? client?.scope ?? "";

  const errorRedirect = useMemo(() => {
    if (!redirectUri) return null;
    return parseSafeOAuthRedirectUri(redirectUri);
  }, [redirectUri]);

  const redirectHost = useMemo(() => {
    if (!redirectUri) return "";
    try {
      return new URL(redirectUri).host;
    } catch {
      return redirectUri;
    }
  }, [redirectUri]);

  useEffect(() => {
    let cancelled = false;
    if (!clientId || !redirectUri) {
      setError("Missing client_id or redirect_uri.");
      setPhase("error");
      return;
    }
    if (responseType !== "code") {
      setError(`response_type "${responseType}" is not supported.`);
      setPhase("error");
      return;
    }
    if (!codeChallenge || codeChallengeMethod !== "S256") {
      setError("This client must use PKCE with S256.");
      setPhase("error");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "mcpOAuth:getClientForAuthorize",
            args: { clientId, redirectUri },
          }),
        });
        const json = await res.json();
        const data = (json?.value ?? json) as ClientMeta | null;
        if (cancelled) return;
        if (!data) {
          setError("Unknown client or redirect URI not registered.");
          setPhase("error");
          return;
        }
        setClient(data);
        setPhase("review");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load client.");
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, redirectUri, responseType, codeChallenge, codeChallengeMethod]);

  const onApprove = async () => {
    if (!client) return;
    setPhase("authorizing");
    setError(null);
    try {
      const res = await fetch("/api/oauth/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          state,
          ...(requestedScope === null ? {} : { scope: requestedScope }),
          code_challenge: codeChallenge,
          code_challenge_method: "S256",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.redirect) {
        setError(data?.error_description || data?.error || "Authorization failed.");
        setPhase("error");
        return;
      }
      const target = parseSafeOAuthRedirectUri(String(data.redirect));
      if (!target) {
        setError("The client returned an unsafe redirect URI.");
        setPhase("error");
        return;
      }
      setPhase("redirecting");
      window.location.assign(target.toString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authorization failed.");
      setPhase("error");
    }
  };

  const onDeny = () => {
    if (errorRedirect) {
      errorRedirect.searchParams.set("error", "access_denied");
      if (state) errorRedirect.searchParams.set("state", state);
      window.location.assign(errorRedirect.toString());
    } else {
      router.push("/workspace/integrations");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand row */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ef4444] to-[#b91c1c] flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <span className="font-semibold tracking-tight text-base">APIClaw</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-7 shadow-sm">
          {phase === "loading" && (
            <div className="py-10 flex flex-col items-center text-[var(--text-muted)]">
              <Loader2 className="w-6 h-6 animate-spin mb-3 text-[#ef4444]" />
              <p className="text-sm">Loading authorization request…</p>
            </div>
          )}

          {phase === "error" && (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-rose-500" />
              </div>
              <h1 className="text-lg font-semibold mb-1">Authorization failed</h1>
              <p className="text-sm text-[var(--text-muted)] mb-5">
                {error || "Something went wrong."}
              </p>
              <button
                onClick={() => router.push("/workspace/integrations")}
                className="w-full rounded-lg border border-[var(--border)] hover:bg-[var(--surface)] px-4 py-2.5 text-sm font-medium transition"
              >
                Back to dashboard
              </button>
            </div>
          )}

          {(phase === "review" || phase === "authorizing" || phase === "redirecting") && client && (
            <>
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-full bg-[#ef4444]/10 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-6 h-6 text-[#ef4444]" />
                </div>
                <h1 className="text-lg font-semibold">Authorize {client.name}?</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  This will let it use APIClaw on your behalf.
                </p>
              </div>

              {/* Client metadata strip */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] mb-4">
                <div className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="text-[var(--text-muted)]">Client</span>
                  <span className="font-medium flex items-center gap-1.5">
                    {client.name}
                    {client.registrationKind === "dynamic" && (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500 font-semibold">
                        Dynamic
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="text-[var(--text-muted)]">Redirect</span>
                  <span className="font-mono text-[var(--text-secondary)] truncate ml-2 max-w-[60%]" title={redirectUri}>
                    {redirectHost}
                  </span>
                </div>
                <button
                  onClick={() => setShowFull((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                >
                  <span>Technical details</span>
                  {showFull ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {showFull && (
                  <div className="px-3 py-2 text-[11px] font-mono space-y-1 bg-[var(--background)]">
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--text-muted)]">client_id</span>
                      <span className="truncate text-[var(--text-secondary)]">{client.clientId}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--text-muted)]">redirect_uri</span>
                      <span className="truncate text-[var(--text-secondary)]">{redirectUri}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[var(--text-muted)]">scope</span>
                      <span className="truncate text-[var(--text-secondary)]">{reviewScope}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Scope list */}
              <div className="mb-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  This will let it
                </p>
                <ul className="space-y-2">
                  {reviewScope.split(/\s+/).filter(Boolean).map((s) => (
                    <li key={s} className="flex items-start gap-2.5 text-sm">
                      <Sparkles className="w-3.5 h-3.5 text-[#ef4444] mt-1 flex-shrink-0" />
                      <span className="text-[var(--text-secondary)]">
                        <code className="text-[11px] font-mono bg-[var(--surface)] border border-[var(--border)] px-1 py-0.5 rounded mr-1.5">
                          {s}
                        </code>
                        {SCOPE_DESCRIPTIONS[s] ?? "Access scope"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[11px] text-[var(--text-muted)] mb-5">
                You stay in control. Revoke any time at{" "}
                <a href="/workspace/integrations" className="underline hover:text-[var(--text-primary)]">
                  Workspace → Integrations
                </a>
                .
              </p>

              <div className="flex gap-2">
                <button
                  onClick={onDeny}
                  disabled={phase !== "review"}
                  className="flex-1 rounded-lg border border-[var(--border)] hover:bg-[var(--surface)] px-4 py-2.5 text-sm font-medium transition disabled:opacity-50"
                >
                  Deny
                </button>
                <button
                  onClick={onApprove}
                  disabled={phase !== "review"}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] active:bg-[#b91c1c] disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition"
                >
                  {phase === "authorizing" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Authorizing…
                    </>
                  ) : phase === "redirecting" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirecting…
                    </>
                  ) : (
                    <>
                      Authorize <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {error && (
                <p className="mt-3 text-xs text-rose-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {error}
                </p>
              )}
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-[var(--text-muted)]">
          Powered by{" "}
          <a href="https://apiclaw.cloud" className="underline hover:text-[var(--text-primary)]">
            APIClaw
          </a>{" "}
          — OAuth 2.1 + PKCE
        </p>
      </div>
    </div>
  );
}
