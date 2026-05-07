// /oauth/authorize — consent screen for the Authorization Code flow.
// Middleware ensures the user has an apiclaw_workspace_session before this
// page renders, so we can trust the cookie. The actual mint happens in
// /api/oauth/authorize after the user clicks "Authorize".
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
    <Suspense fallback={<div style={shell}><div style={card}><p style={muted}>Loading authorization request...</p></div></div>}>
      <AuthorizeInner />
    </Suspense>
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
  const requestedScope = params?.get("scope") ?? "mcp";

  const [phase, setPhase] = useState<Phase>("loading");
  const [client, setClient] = useState<ClientMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const errorRedirect = useMemo(() => {
    if (!redirectUri) return null;
    try {
      const u = new URL(redirectUri);
      return u;
    } catch {
      return null;
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
          scope: requestedScope,
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
      setPhase("redirecting");
      window.location.href = data.redirect;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authorization failed.");
      setPhase("error");
    }
  };

  const onDeny = () => {
    if (errorRedirect) {
      errorRedirect.searchParams.set("error", "access_denied");
      if (state) errorRedirect.searchParams.set("state", state);
      window.location.href = errorRedirect.toString();
    } else {
      router.push("/workspace/integrations");
    }
  };

  return (
    <div style={shell}>
      <div style={card}>
        <div style={brand}>
          <span style={brandDot} />
          <span style={brandText}>APIClaw</span>
        </div>
        {phase === "loading" && <p style={muted}>Loading authorization request...</p>}

        {phase === "error" && (
          <>
            <h1 style={h1}>Authorization error</h1>
            <p style={errorBox}>{error || "Something went wrong."}</p>
            <button style={btnSecondary} onClick={() => router.push("/workspace/integrations")}>
              Back to dashboard
            </button>
          </>
        )}

        {(phase === "review" || phase === "authorizing" || phase === "redirecting") && client && (
          <>
            <h1 style={h1}>Authorize {client.name}</h1>
            <p style={muted}>
              {client.name} is requesting access to your APIClaw workspace.
            </p>

            <div style={panel}>
              <div style={panelRow}>
                <span style={panelLabel}>Client</span>
                <span style={panelValue}>
                  {client.name}
                  {client.registrationKind === "dynamic" && (
                    <span style={badgeDynamic}>Dynamic</span>
                  )}
                </span>
              </div>
              <div style={panelRow}>
                <span style={panelLabel}>Client ID</span>
                <code style={code}>{client.clientId}</code>
              </div>
              <div style={panelRow}>
                <span style={panelLabel}>Redirect</span>
                <code style={code}>{redirectUri}</code>
              </div>
            </div>

            <h2 style={h2}>This will let it</h2>
            <ul style={scopeList}>
              {requestedScope.split(/\s+/).filter(Boolean).map((s) => (
                <li key={s} style={scopeItem}>
                  <span style={scopeBullet}>{">"}</span>
                  <span>
                    <code style={inlineCode}>{s}</code> {SCOPE_DESCRIPTIONS[s] ?? "Access scope"}
                  </span>
                </li>
              ))}
            </ul>

            <p style={fineprint}>
              You stay in control. Revoke at any time at{" "}
              <a href="/workspace/integrations" style={link}>
                Workspace → Integrations
              </a>
              .
            </p>

            <div style={btnRow}>
              <button
                style={btnSecondary}
                onClick={onDeny}
                disabled={phase !== "review"}
              >
                Deny
              </button>
              <button
                style={btnPrimary}
                onClick={onApprove}
                disabled={phase !== "review"}
              >
                {phase === "authorizing" ? "Authorizing..." : phase === "redirecting" ? "Redirecting..." : "Authorize"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const shell: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#F0F4F8",
  padding: "24px",
  fontFamily: "Inter, system-ui, sans-serif",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: 480,
  background: "#fff",
  border: "1px solid #E2E8F0",
  borderRadius: 16,
  padding: "32px",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.04)",
};

const brand: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 24,
};

const brandDot: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: 999,
  background: "linear-gradient(135deg, #00D4FF, #9370DB)",
};

const brandText: React.CSSProperties = {
  fontFamily: "Comfortaa, Inter, system-ui, sans-serif",
  fontWeight: 700,
  fontSize: 16,
  letterSpacing: "0.02em",
};

const h1: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 22,
  fontWeight: 600,
  color: "#0F172A",
};

const h2: React.CSSProperties = {
  margin: "20px 0 8px",
  fontSize: 13,
  fontWeight: 600,
  textTransform: "uppercase",
  color: "#64748B",
  letterSpacing: "0.08em",
};

const muted: React.CSSProperties = { color: "#475569", fontSize: 14, lineHeight: 1.5 };

const panel: React.CSSProperties = {
  marginTop: 20,
  background: "#F8FAFC",
  border: "1px solid #E2E8F0",
  borderRadius: 12,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const panelRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  fontSize: 13,
};

const panelLabel: React.CSSProperties = { color: "#64748B", flex: "0 0 auto" };
const panelValue: React.CSSProperties = {
  color: "#0F172A",
  textAlign: "right",
  display: "flex",
  alignItems: "center",
  gap: 8,
};
const code: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E2E8F0",
  padding: "2px 8px",
  borderRadius: 6,
  fontSize: 12,
  fontFamily: "ui-monospace, SFMono-Regular, monospace",
  color: "#334155",
  maxWidth: 240,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const inlineCode: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, monospace",
  background: "#F1F5F9",
  padding: "1px 6px",
  borderRadius: 4,
  fontSize: 12,
  marginRight: 4,
};

const badgeDynamic: React.CSSProperties = {
  marginLeft: 8,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#0E7490",
  background: "#CFFAFE",
  padding: "2px 6px",
  borderRadius: 4,
};

const scopeList: React.CSSProperties = { margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 };
const scopeItem: React.CSSProperties = { display: "flex", gap: 8, fontSize: 13, color: "#1E293B", lineHeight: 1.5 };
const scopeBullet: React.CSSProperties = { color: "#9370DB", fontWeight: 700 };

const fineprint: React.CSSProperties = { fontSize: 12, color: "#64748B", marginTop: 16 };
const link: React.CSSProperties = { color: "#0E7490", textDecoration: "underline" };

const btnRow: React.CSSProperties = { display: "flex", gap: 12, marginTop: 24 };
const btnPrimary: React.CSSProperties = {
  flex: 1,
  background: "#0F172A",
  color: "#fff",
  border: 0,
  padding: "12px 16px",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  flex: 1,
  background: "#fff",
  color: "#0F172A",
  border: "1px solid #CBD5E1",
  padding: "12px 16px",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const errorBox: React.CSSProperties = {
  margin: "12px 0",
  padding: 12,
  borderRadius: 8,
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#991B1B",
  fontSize: 13,
};
