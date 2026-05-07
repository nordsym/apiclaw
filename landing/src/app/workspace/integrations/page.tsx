// /workspace/integrations — Generate & manage remote MCP connectors.
// Provides one-click "Connect to Grok / Cursor / ChatGPT" buttons that mint
// a workspace-bound OAuth client. Reaches Convex directly the same way the
// other workspace pages do (session token from localStorage).
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://adventurous-avocet-799.convex.cloud";

type Connector = {
  clientId: string;
  name: string;
  redirectUris: string[];
  registrationKind: "dashboard" | "dynamic";
  clientSecretPrefix: string | null;
  createdAt: number;
  lastUsedAt: number | null;
};

type Preset = { key: string; label: string; description: string; redirectUris: string[] };

// xAI publishes the canonical Grok callback in its docs; Cursor/Claude/ChatGPT
// use deep-link or localhost callbacks. These are seeds — users can edit.
const PRESETS: Preset[] = [
  {
    key: "grok",
    label: "Grok (xAI)",
    description: "xAI's Grok with remote MCP connector support.",
    redirectUris: ["https://grok.com/oauth/callback"],
  },
  {
    key: "cursor",
    label: "Cursor",
    description: "Cursor's MCP integration via custom URI.",
    redirectUris: ["cursor://oauth/callback"],
  },
  {
    key: "chatgpt",
    label: "ChatGPT",
    description: "OpenAI's ChatGPT custom GPT with MCP.",
    redirectUris: ["https://chat.openai.com/connector_callback"],
  },
  {
    key: "custom",
    label: "Custom",
    description: "Any OAuth-capable MCP client.",
    redirectUris: [""],
  },
];

async function convexQuery<T>(path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  const json = await res.json();
  if (json?.status === "error") throw new Error(json?.errorMessage || "query_failed");
  return (json?.value ?? json) as T;
}
async function convexMutate<T>(path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  const json = await res.json();
  if (json?.status === "error") throw new Error(json?.errorMessage || "mutation_failed");
  return (json?.value ?? json) as T;
}

function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem("apiclaw_workspace_session") ||
    window.localStorage.getItem("apiclaw_session_token") ||
    null
  );
}

export default function IntegrationsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>("grok");
  const [customName, setCustomName] = useState("");
  const [redirectInput, setRedirectInput] = useState<string>("");
  const [issued, setIssued] = useState<{ name: string; clientId: string; clientSecret: string; redirectUris: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const sessionToken = useMemo(() => getSessionToken(), []);

  const selected = PRESETS.find((p) => p.key === preset) ?? PRESETS[0];

  useEffect(() => {
    setRedirectInput(selected.redirectUris.join("\n"));
    if (selected.key !== "custom") setCustomName(selected.label);
  }, [preset, selected]);

  const refresh = async () => {
    if (!sessionToken) {
      setError("Not signed in. Refresh the page.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await convexQuery<Connector[]>("mcpOAuth:listConnectors", { sessionToken });
      setConnectors(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load connectors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGenerate = async () => {
    if (!sessionToken) {
      setError("Not signed in.");
      return;
    }
    const uris = redirectInput
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (uris.length === 0) {
      setError("At least one redirect URI is required.");
      return;
    }
    const name = (customName || selected.label).trim();
    setBusy(true);
    setError(null);
    try {
      const result = await convexMutate<{
        client_id: string;
        client_secret: string;
        name: string;
        redirect_uris: string[];
      }>("mcpOAuth:createDashboardConnector", {
        sessionToken,
        name,
        redirectUris: uris,
      });
      setIssued({
        name: result.name,
        clientId: result.client_id,
        clientSecret: result.client_secret,
        redirectUris: result.redirect_uris,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate connector.");
    } finally {
      setBusy(false);
    }
  };

  const onRevoke = async (clientId: string) => {
    if (!sessionToken) return;
    if (!confirm("Revoke this connector? Any active tokens will be invalidated.")) return;
    try {
      await convexMutate("mcpOAuth:revokeConnector", { sessionToken, clientId });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revoke failed.");
    }
  };

  const copy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  return (
    <div style={shell}>
      <header style={header}>
        <Link href="/workspace" style={backLink}>← Back to workspace</Link>
        <h1 style={pageTitle}>Integrations</h1>
        <p style={pageSub}>
          Connect APIClaw to remote MCP-aware clients. One workspace, one Bearer
          token, every door.
        </p>
      </header>

      <section style={panel}>
        <h2 style={h2}>Generate a connector</h2>
        <p style={muted}>
          Pick a preset, click <strong>Generate</strong>, paste the credentials
          into your client. Auto-routed via OAuth on first use.
        </p>

        <div style={presetRow}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              style={p.key === preset ? presetBtnActive : presetBtn}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={field}>
          <label style={label}>Display name</label>
          <input
            style={input}
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={selected.label}
          />
        </div>

        <div style={field}>
          <label style={label}>Redirect URIs (one per line)</label>
          <textarea
            style={{ ...input, minHeight: 84, fontFamily: "ui-monospace, monospace" }}
            value={redirectInput}
            onChange={(e) => setRedirectInput(e.target.value)}
            placeholder="https://your-client.com/oauth/callback"
          />
          <p style={hint}>
            HTTPS only, except for <code>http://localhost</code> during development.
          </p>
        </div>

        <button onClick={onGenerate} disabled={busy} style={btnPrimary}>
          {busy ? "Generating..." : `Generate ${selected.label} connector`}
        </button>
        {error && <p style={errBox}>{error}</p>}
      </section>

      {issued && (
        <section style={{ ...panel, borderColor: "#22D3EE" }}>
          <h2 style={h2}>Your connector — copy it now</h2>
          <p style={muted}>
            The client secret is shown <strong>only this once</strong>. We do
            not store it in plaintext.
          </p>
          <div style={kvRow}>
            <span style={kvLabel}>Client ID</span>
            <div style={kvValue}>
              <code style={mono}>{issued.clientId}</code>
              <button style={miniBtn} onClick={() => copy(issued.clientId)}>Copy</button>
            </div>
          </div>
          <div style={kvRow}>
            <span style={kvLabel}>Client Secret</span>
            <div style={kvValue}>
              <code style={mono}>{issued.clientSecret}</code>
              <button style={miniBtn} onClick={() => copy(issued.clientSecret)}>Copy</button>
            </div>
          </div>
          <div style={kvRow}>
            <span style={kvLabel}>MCP URL</span>
            <div style={kvValue}>
              <code style={mono}>https://apiclaw.cloud/mcp</code>
              <button style={miniBtn} onClick={() => copy("https://apiclaw.cloud/mcp")}>Copy</button>
            </div>
          </div>

          {issued.name.toLowerCase().includes("grok") && (
            <details style={instructions}>
              <summary>How to add this to Grok</summary>
              <ol style={ol}>
                <li>Open Grok → <strong>Settings → Connectors</strong>.</li>
                <li>Click <strong>Add custom connector</strong>.</li>
                <li>Paste MCP URL: <code>https://apiclaw.cloud/mcp</code></li>
                <li>Paste the Client ID and Client Secret above.</li>
                <li>
                  Grok will redirect you to APIClaw — sign in with the same email,
                  approve, and you're connected.
                </li>
              </ol>
            </details>
          )}

          <button style={btnSecondary} onClick={() => setIssued(null)}>I've saved it</button>
        </section>
      )}

      <section style={panel}>
        <h2 style={h2}>Active connectors</h2>
        {loading && <p style={muted}>Loading...</p>}
        {!loading && connectors.length === 0 && (
          <p style={muted}>No connectors yet. Generate one above to get started.</p>
        )}
        {connectors.map((c) => (
          <div key={c.clientId} style={connectorRow}>
            <div>
              <div style={connectorName}>
                {c.name}
                <span style={c.registrationKind === "dynamic" ? badgeDynamic : badgeDashboard}>
                  {c.registrationKind === "dynamic" ? "DCR" : "Dashboard"}
                </span>
              </div>
              <div style={connectorMeta}>
                <code style={miniMono}>{c.clientId}</code>
                <span> · created {new Date(c.createdAt).toLocaleDateString()}</span>
                {c.lastUsedAt && <span> · last used {new Date(c.lastUsedAt).toLocaleDateString()}</span>}
              </div>
              <div style={connectorMeta}>
                {c.redirectUris.map((r) => (
                  <code key={r} style={miniMono}>{r}</code>
                ))}
              </div>
            </div>
            <button style={btnDanger} onClick={() => onRevoke(c.clientId)}>Revoke</button>
          </div>
        ))}
      </section>
    </div>
  );
}

const shell: React.CSSProperties = {
  maxWidth: 880,
  margin: "0 auto",
  padding: "32px 24px 80px",
  fontFamily: "Inter, system-ui, sans-serif",
  color: "#0F172A",
};
const header: React.CSSProperties = { marginBottom: 24 };
const backLink: React.CSSProperties = { color: "#0E7490", fontSize: 13, textDecoration: "none" };
const pageTitle: React.CSSProperties = { fontSize: 28, fontWeight: 700, margin: "8px 0 4px" };
const pageSub: React.CSSProperties = { color: "#64748B", fontSize: 14, lineHeight: 1.5 };
const panel: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E2E8F0",
  borderRadius: 14,
  padding: 24,
  marginBottom: 16,
};
const h2: React.CSSProperties = { margin: "0 0 8px", fontSize: 18, fontWeight: 600 };
const muted: React.CSSProperties = { color: "#475569", fontSize: 13.5, lineHeight: 1.5, margin: "0 0 16px" };
const presetRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 };
const presetBtn: React.CSSProperties = {
  padding: "8px 14px",
  border: "1px solid #CBD5E1",
  borderRadius: 999,
  background: "#fff",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};
const presetBtnActive: React.CSSProperties = {
  ...presetBtn,
  background: "#0F172A",
  color: "#fff",
  border: "1px solid #0F172A",
};
const field: React.CSSProperties = { marginBottom: 14, display: "flex", flexDirection: "column", gap: 4 };
const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#475569" };
const input: React.CSSProperties = {
  border: "1px solid #CBD5E1",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  background: "#fff",
  color: "#0F172A",
  fontFamily: "inherit",
};
const hint: React.CSSProperties = { fontSize: 11, color: "#94A3B8", margin: 0 };
const btnPrimary: React.CSSProperties = {
  background: "#0F172A",
  color: "#fff",
  border: 0,
  padding: "11px 18px",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  marginTop: 12,
  background: "#fff",
  border: "1px solid #CBD5E1",
  padding: "9px 14px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};
const btnDanger: React.CSSProperties = {
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#991B1B",
  padding: "8px 12px",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};
const errBox: React.CSSProperties = {
  marginTop: 12,
  padding: 10,
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#991B1B",
  fontSize: 12.5,
  borderRadius: 8,
};
const kvRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "10px 0",
  borderBottom: "1px solid #F1F5F9",
};
const kvLabel: React.CSSProperties = { color: "#64748B", fontSize: 12, fontWeight: 600 };
const kvValue: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "flex-end" };
const mono: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, monospace",
  fontSize: 12,
  background: "#F8FAFC",
  border: "1px solid #E2E8F0",
  padding: "4px 8px",
  borderRadius: 6,
  maxWidth: 360,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const miniBtn: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #CBD5E1",
  padding: "4px 8px",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
};
const instructions: React.CSSProperties = {
  marginTop: 14,
  padding: 12,
  background: "#F8FAFC",
  border: "1px solid #E2E8F0",
  borderRadius: 8,
  fontSize: 13,
};
const ol: React.CSSProperties = { margin: "8px 0 0 20px", padding: 0, lineHeight: 1.6 };
const connectorRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  padding: "12px 0",
  borderBottom: "1px solid #F1F5F9",
};
const connectorName: React.CSSProperties = { fontSize: 14, fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 };
const connectorMeta: React.CSSProperties = { fontSize: 12, color: "#64748B", display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 };
const miniMono: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, monospace",
  fontSize: 11,
  background: "#F8FAFC",
  padding: "1px 6px",
  borderRadius: 4,
  border: "1px solid #E2E8F0",
};
const badgeDashboard: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "#1D4ED8",
  background: "#DBEAFE",
  padding: "2px 6px",
  borderRadius: 4,
};
const badgeDynamic: React.CSSProperties = {
  ...badgeDashboard,
  color: "#0E7490",
  background: "#CFFAFE",
};
