// /workspace/integrations: remote MCP connectors for OAuth-capable clients.
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWorkspaceSessionToken, subscribeWorkspaceSessionToken } from "@/lib/workspace-session";
import { CONVEX_URL } from "../_shared";
import { StandaloneShell } from "../_standalone";
import { PageHeader, Section, Panel, SurfaceTabs, Row, Status, Empty, Loading, Field, inputClass, textareaClass, btnSolid, btnQuiet, btnDanger } from "../views/ui";

const MCP_URL = "https://apiclaw.cloud/mcp";
const SIGN_IN_PATH = "/sign-in";

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
  redirectUris: string[];
  guide?: string[];
};

// Seeds only. Users can edit the redirect URIs before generating.
const PRESETS: Preset[] = [
  {
    key: "grok",
    label: "Grok",
    redirectUris: ["https://grok.com/connectors-oauth/callback"],
    guide: [
      "Grok: Settings, Connectors, New connection.",
      "Paste the MCP URL and add it as a custom connector.",
      "Approve on the APIClaw consent screen.",
    ],
  },
  { key: "cursor", label: "Cursor", redirectUris: ["cursor://oauth/callback"] },
  { key: "chatgpt", label: "ChatGPT", redirectUris: ["https://chat.openai.com/connector_callback"] },
  { key: "custom", label: "Custom", redirectUris: [""] },
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

/** Mono value with a copy affordance. */
function CopyLine({ label, value, field, copied, onCopy }: { label?: string; value: string; field: string; copied: boolean; onCopy: (value: string, field: string) => void }) {
  return (
    <div className="flex items-center gap-4 border-t border-[var(--border-subtle)] py-2.5">
      <div className="min-w-0 flex-1">
        {label && <p className="text-[12px] text-[var(--text-muted)]">{label}</p>}
        <p className="claw-mono truncate text-[12.5px] text-[var(--text-primary)]">{value}</p>
      </div>
      <button type="button" onClick={() => onCopy(value, field)} className="shrink-0 text-[12.5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>("grok");
  const [customName, setCustomName] = useState("");
  const [redirectInput, setRedirectInput] = useState("");
  const [issued, setIssued] = useState<{ name: string; clientId: string; clientSecret: string; redirectUris: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const selected = PRESETS.find((p) => p.key === preset) ?? PRESETS[0];

  useEffect(() => {
    setRedirectInput(selected.redirectUris.join("\n"));
    setCustomName(selected.key === "custom" ? "" : selected.label);
  }, [selected]);

  const refresh = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await convexQuery<Connector[]>("mcpOAuth:listConnectors", { sessionToken: token });
      setConnectors(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load connectors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => subscribeWorkspaceSessionToken((token) => {
    setSessionToken(token);
    if (!token) router.push(SIGN_IN_PATH);
  }), [router]);

  useEffect(() => {
    let cancelled = false;
    void getWorkspaceSessionToken().then((token) => {
      if (cancelled) return;
      if (!token) {
        router.push(SIGN_IN_PATH);
        return;
      }
      setSessionToken(token);
      void refresh(token);
    });
    return () => { cancelled = true; };
  }, [router, refresh]);

  const onGenerate = async () => {
    if (!sessionToken) return;
    const uris = redirectInput.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
    if (uris.length === 0) {
      setError("Add at least one redirect URI.");
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
      const result = await response.json() as { client_id: string; client_secret: string; name: string; redirect_uris: string[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not generate connector.");
      setIssued({ name: result.name, clientId: result.client_id, clientSecret: result.client_secret, redirectUris: result.redirect_uris });
      await refresh(sessionToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate connector.");
    } finally {
      setBusy(false);
    }
  };

  const onRevoke = async (c: Connector) => {
    if (!sessionToken) return;
    if (!window.confirm(`Revoke ${c.name}? Its tokens stop working immediately.`)) return;
    try {
      await convexMutate("mcpOAuth:revokeConnector", { sessionToken, clientId: c.clientId });
      await refresh(sessionToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revoke failed.");
    }
  };

  const copy = (text: string, field: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    window.setTimeout(() => setCopiedField((cur) => (cur === field ? null : cur)), 1500);
  };

  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString();

  return (
    <StandaloneShell activeTab="settings" sessionToken={sessionToken}>
      <PageHeader title="Remote MCP" description="Connect an OAuth-capable MCP client to this workspace." />

      {error && <p className="mb-6 text-[13px] text-[var(--accent)]">{error}</p>}

      <Section title="Endpoint" description="Paste this into your client. Most clients discover OAuth from it and need nothing else.">
        <CopyLine value={MCP_URL} field="mcp-url" copied={copiedField === "mcp-url"} onCopy={copy} />
      </Section>

      <Section title="Connected clients" description="Clients that registered with a client ID and secret." className="mt-10">
        {loading && <Loading label="Loading clients" />}
        {!loading && connectors.length === 0 && (
          <Empty title="No connected clients" body="Paste the endpoint into your client, or generate a connector below if it asks for credentials." />
        )}
        {!loading && connectors.map((c) => (
          <Row
            key={c.clientId}
            right={
              <>
                <span className="hidden sm:inline">{c.lastUsedAt ? `Used ${fmtDate(c.lastUsedAt)}` : `Never used, added ${fmtDate(c.createdAt)}`}</span>
                <button type="button" onClick={() => onRevoke(c)} className={btnDanger}>Revoke</button>
              </>
            }
          >
            <div className="flex items-center gap-3">
              <span className="truncate text-[14px] font-medium">{c.name}</span>
              <Status kind="muted">{c.registrationKind === "dynamic" ? "Auto-registered" : "Dashboard"}</Status>
            </div>
            <p className="claw-mono mt-0.5 truncate text-[12px] text-[var(--text-muted)]">{c.clientId}</p>
            <p className="mt-0.5 truncate text-[12px] text-[var(--text-muted)]">{c.redirectUris.join(", ")}</p>
          </Row>
        ))}
      </Section>

      <Section title="Generate a connector" description="Only for clients that require a pre-shared client ID and secret." className="mt-10">
        <Panel className="p-5 sm:p-6">
          <SurfaceTabs items={PRESETS.map((p) => ({ id: p.key, label: p.label }))} active={preset} onChange={setPreset} label="Client" />
          <div className="mt-5 space-y-4">
            <Field label="Name">
              <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder={selected.label} className={inputClass} />
            </Field>
            <Field label="Redirect URIs, one per line" hint="HTTPS only, except http://localhost for development.">
              <textarea value={redirectInput} onChange={(e) => setRedirectInput(e.target.value)} placeholder="https://your-client.com/oauth/callback" rows={3} className={`${textareaClass} claw-mono text-[12.5px]`} />
            </Field>
          </div>
          {selected.guide && (
            <ol className="mt-5 space-y-1 text-[13px] text-[var(--text-secondary)]">
              {selected.guide.map((step, i) => (
                <li key={i} className="flex gap-2.5"><span className="claw-mono text-[var(--text-muted)]">{i + 1}</span><span>{step}</span></li>
              ))}
            </ol>
          )}
          <div className="mt-6 flex items-center gap-3">
            <button type="button" onClick={onGenerate} disabled={busy || !sessionToken} className={btnSolid}>
              {busy ? "Generating" : `Generate ${selected.label} connector`}
            </button>
          </div>
        </Panel>

        {issued && (
          <div className="mt-6">
            <p className="text-[14px] font-medium">{issued.name} is ready</p>
            <p className="mt-1 mb-3 text-[13px] text-[var(--text-muted)]">The client secret is shown once. Copy it now.</p>
            <CopyLine label="Client ID" value={issued.clientId} field="client-id" copied={copiedField === "client-id"} onCopy={copy} />
            <CopyLine label="Client secret" value={issued.clientSecret} field="client-secret" copied={copiedField === "client-secret"} onCopy={copy} />
            <CopyLine label="MCP URL" value={MCP_URL} field="issued-mcp-url" copied={copiedField === "issued-mcp-url"} onCopy={copy} />
            <button type="button" onClick={() => setIssued(null)} className={`${btnQuiet} mt-4`}>Done</button>
          </div>
        )}
      </Section>
    </StandaloneShell>
  );
}
