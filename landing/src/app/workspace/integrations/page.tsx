// /workspace/integrations — Generate & manage remote MCP connectors.
// Styled with the APIClaw design tokens (light + dark mode aware) so it
// blends with /workspace.
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Layers,
  Plus,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  getWorkspaceSessionToken,
  subscribeWorkspaceSessionToken,
} from "@/lib/workspace-session";

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

type Preset = {
  key: string;
  label: string;
  blurb: string;
  icon: string;
  redirectUris: string[];
  guide?: { steps: string[]; note?: string };
};

// xAI publishes the canonical Grok callback in its docs; Cursor / Claude /
// ChatGPT use deep-link or localhost. These are seeds — users can edit.
const PRESETS: Preset[] = [
  {
    key: "grok",
    label: "Grok (xAI)",
    blurb: "xAI's Grok with remote MCP connector support.",
    icon: "G",
    redirectUris: ["https://grok.com/connectors-oauth/callback"],
    guide: {
      steps: [
        "Open Grok → Settings → Connectors → New connection.",
        "Paste the MCP URL and click Add custom connector.",
        "Approve on the APIClaw consent screen — you're done.",
      ],
      note: "Tip: paste-then-OAuth is the lowest-friction path. Most users finish under 30s.",
    },
  },
  {
    key: "cursor",
    label: "Cursor",
    blurb: "Cursor's MCP integration via custom URI scheme.",
    icon: "C",
    redirectUris: ["cursor://oauth/callback"],
  },
  {
    key: "chatgpt",
    label: "ChatGPT",
    blurb: "OpenAI's ChatGPT custom GPT with MCP.",
    icon: "O",
    redirectUris: ["https://chat.openai.com/connector_callback"],
  },
  {
    key: "custom",
    label: "Custom",
    blurb: "Any OAuth-capable MCP client.",
    icon: "+",
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

export default function IntegrationsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>("grok");
  const [customName, setCustomName] = useState("");
  const [redirectInput, setRedirectInput] = useState<string>("");
  const [issued, setIssued] = useState<{
    name: string;
    clientId: string;
    clientSecret: string;
    redirectUris: string[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const selected = PRESETS.find((p) => p.key === preset) ?? PRESETS[0];

  useEffect(() => {
    setRedirectInput(selected.redirectUris.join("\n"));
    if (selected.key !== "custom") setCustomName(selected.label);
    else setCustomName("");
  }, [preset, selected]);

  const refresh = async (token = sessionToken) => {
    if (!token) {
      setError("Not signed in. Refresh the page.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await convexQuery<Connector[]>("mcpOAuth:listConnectors", { sessionToken: token });
      setConnectors(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load connectors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => subscribeWorkspaceSessionToken((token) => {
    setSessionToken(token);
    if (!token) setError("Session expired. Sign in again.");
  }), []);

  useEffect(() => {
    void getWorkspaceSessionToken().then((token) => {
      setSessionToken(token);
      void refresh(token);
    });
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
      const response = await fetch("/api/workspace/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, redirectUris: uris }),
      });
      const result = await response.json() as {
        client_id: string;
        client_secret: string;
        name: string;
        redirect_uris: string[];
        error?: string;
      };
      if (!response.ok) throw new Error(result.error || "Failed to generate connector.");
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

  const copy = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopiedField(field);
      setTimeout(() => setCopiedField((cur) => (cur === field ? null : cur)), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to workspace
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
              <p className="text-sm text-[var(--text-muted)]">
                Connect APIClaw to remote MCP-aware clients. One workspace, every door.
              </p>
            </div>
          </div>
        </div>

        {/* Quick install banner */}
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-gradient-to-br from-[#ef4444]/5 via-transparent to-transparent p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#ef4444] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">
                The fastest path: paste the MCP URL into your client.
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Most modern MCP clients (Grok, Cursor, ChatGPT, Claude Desktop) auto-discover
                APIClaw via OAuth — no Client ID/Secret needed. Use Generate connector below
                only if your client requires pre-shared credentials.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono">
                <span>https://apiclaw.cloud/mcp</span>
                <button
                  onClick={() => copy("https://apiclaw.cloud/mcp", "banner-url")}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
                  title="Copy"
                >
                  {copiedField === "banner-url" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Generate connector card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 mb-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold">Generate a connector</h2>
            <span className="text-xs text-[var(--text-muted)]">For clients that need pre-shared credentials</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-5">
            Pick a preset, click <span className="text-[var(--text-primary)] font-medium">Generate</span>,
            paste the credentials into your client. OAuth handles the rest on first use.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {PRESETS.map((p) => {
              const active = p.key === preset;
              return (
                <button
                  key={p.key}
                  onClick={() => setPreset(p.key)}
                  className={`group flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition text-left ${
                    active
                      ? "border-[#ef4444] bg-[var(--surface)]"
                      : "border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--surface)]"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-md flex items-center justify-center font-semibold text-xs ${
                      active
                        ? "bg-[var(--text-primary)] text-[var(--background)]"
                        : "bg-[var(--background)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {p.icon}
                  </span>
                  <span className={`font-medium ${active ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Display name
              </label>
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={selected.label}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]/20 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Redirect URIs <span className="text-[var(--text-muted)] font-normal">(one per line)</span>
              </label>
              <textarea
                value={redirectInput}
                onChange={(e) => setRedirectInput(e.target.value)}
                placeholder="https://your-client.com/oauth/callback"
                rows={3}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444]/20 transition"
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                HTTPS only, except <code className="font-mono">http://localhost</code> for dev.
              </p>
            </div>
          </div>

          {selected.guide && (
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                How to add this in {selected.label}
              </p>
              <ol className="space-y-1.5 text-sm">
                {selected.guide.steps.map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--text-muted)] text-xs flex items-center justify-center font-mono mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[var(--text-secondary)]">{step}</span>
                  </li>
                ))}
              </ol>
              {selected.guide.note && (
                <p className="mt-3 text-xs text-[var(--text-muted)] italic">{selected.guide.note}</p>
              )}
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={onGenerate}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md bg-[#ef4444] hover:bg-white active:bg-[#b91c1c] text-white px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Generate {selected.label} connector
                </>
              )}
            </button>
            {error && (
              <span className="inline-flex items-center gap-1.5 text-xs text-rose-500">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </span>
            )}
          </div>
        </div>

        {/* Issued credentials card */}
        {issued && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-6 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-semibold">Connector ready — copy these now</h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              The client secret is shown <span className="font-semibold text-[var(--text-secondary)]">only this once</span>.
              We do not store it in plaintext.
            </p>
            <div className="space-y-3">
              {[
                { label: "Client ID", value: issued.clientId, field: "client-id" },
                { label: "Client Secret", value: issued.clientSecret, field: "client-secret" },
                { label: "MCP URL", value: "https://apiclaw.cloud/mcp", field: "mcp-url" },
              ].map((row) => (
                <div
                  key={row.field}
                  className="flex items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
                      {row.label}
                    </p>
                    <p className="text-xs font-mono truncate text-[var(--text-primary)]">{row.value}</p>
                  </div>
                  <button
                    onClick={() => copy(row.value, row.field)}
                    className="flex-shrink-0 inline-flex items-center gap-1 rounded border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface)] px-2 py-1 text-xs font-medium transition"
                  >
                    {copiedField === row.field ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIssued(null)}
              className="mt-4 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
            >
              I've saved it — dismiss
            </button>
          </div>
        )}

        {/* Active connectors */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Active connectors</h2>
            <span className="text-xs text-[var(--text-muted)]">
              {loading ? "Loading…" : `${connectors.length} active`}
            </span>
          </div>

          {loading && (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading connectors…
            </div>
          )}

          {!loading && connectors.length === 0 && (
            <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center">
              <Layers className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-secondary)] mb-1">No connectors yet.</p>
              <p className="text-xs text-[var(--text-muted)]">
                Either paste <code className="font-mono">https://apiclaw.cloud/mcp</code> into your
                client (auto OAuth) or generate one above.
              </p>
            </div>
          )}

          <div className="divide-y divide-[var(--border)]">
            {connectors.map((c) => (
              <div key={c.clientId} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">{c.name}</span>
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${
                        c.registrationKind === "dynamic"
                          ? "bg-cyan-500/10 text-cyan-500"
                          : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {c.registrationKind === "dynamic" ? "DCR" : "Dashboard"}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[var(--text-muted)] truncate">{c.clientId}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {c.redirectUris.map((r) => (
                      <code
                        key={r}
                        className="text-[11px] font-mono bg-[var(--surface)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--text-secondary)] truncate max-w-xs"
                      >
                        {r}
                      </code>
                    ))}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                    Created {new Date(c.createdAt).toLocaleDateString()}
                    {c.lastUsedAt && ` · Last used ${new Date(c.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => onRevoke(c.clientId)}
                  className="flex-shrink-0 inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 px-2.5 py-1.5 text-xs font-medium transition"
                >
                  <Trash2 className="w-3 h-3" /> Revoke
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer help */}
        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          Need help?{" "}
          <Link href="/docs" className="underline hover:text-[var(--text-primary)] inline-flex items-center gap-1">
            See the integrations guide <ExternalLink className="w-3 h-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
