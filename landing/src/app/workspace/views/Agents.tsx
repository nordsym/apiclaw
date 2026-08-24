"use client";

/**
 * Agents: the default workspace view (2026-08-24 restructure). Buzz-style
 * card grid for connected MCP-client agents (AgentCardGrid, its own
 * detail side panel) with the workspace's main agent folded in as a
 * regular card, a slim usage strip, an optional quiet next-step card,
 * "Connect an agent" (the three real connection surfaces plus a
 * collapsed connectors accordion folded in from the old
 * /workspace/integrations page), and a subagents list. Everything here
 * maps to real data; nothing is decorative (INSPO BOUNDARY,
 * BYOH-BUILD-PLAN.md Phase 2).
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isUnlimitedWorkspace, getAgentPresence } from "@/lib/workspace-truth";
import { INSTALL_LINE, REMOTE_MCP_URL } from "@/components/home/truth";
import { CONVEX_URL, Workspace, TabType } from "../_shared";
import {
  PageHeader,
  Section,
  Panel,
  Row,
  Status,
  Empty,
  Loading,
  Field,
  SurfaceTabs,
  inputClass,
  textareaClass,
  btnSolid,
  btnQuiet,
  btnDanger,
} from "./ui";
import { AgentCardGrid, monogram } from "./AgentCards";

const LOCAL_MCP_COMMAND = "npx @nordsym/apiclaw mcp";
const ACP_COMMAND = "npx @nordsym/apiclaw acp";

const TIER_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  scale: "Scale",
  partner: "Partner",
  founder: "Founder",
  usage_based: "Pay as you go",
};

function tierLabel(tier?: string) {
  if (!tier) return "Free";
  return TIER_LABEL[tier] || tier;
}

async function convexCall<T>(kind: "query" | "mutation", path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  const data = await res.json();
  if (data?.status === "error" || data?.error) {
    throw new Error(data.errorMessage || data.error || "Request failed");
  }
  return (data?.value ?? data) as T;
}

/** One line with a copy affordance. Same shape as the homepage command line. */
function CopyLine({ text, prompt = "$" }: { text: string; prompt?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button type="button" onClick={copy} className="claw-cmd" aria-label={`Copy: ${text}`}>
      <span className="prompt" aria-hidden="true">{prompt}</span>
      <span className="text">{text}</span>
      <span className="state" data-copied={copied} aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

/** Two-click confirm. First click arms for 4s, second click runs. */
function useArmed() {
  const [armed, setArmed] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const arm = (id: string) => {
    setArmed(id);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setArmed((cur) => (cur === id ? null : cur)), 4000);
  };
  const disarm = () => {
    setArmed(null);
    if (timer.current) window.clearTimeout(timer.current);
  };
  return { armed, arm, disarm };
}

/** Name with inline rename. Save on Enter or button, cancel on Escape. */
function InlineName({ value, fallback, onSave }: { value: string; fallback?: string; onSave: (name: string) => Promise<void> | void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next = draft.trim();
    if (next.length < 2 || next.length > 50 || next === value) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(next); } finally { setSaving(false); setEditing(false); }
  };

  if (!editing) {
    return (
      <span className="flex min-w-0 items-baseline gap-2">
        <span className="truncate text-[14px]">{value || fallback}</span>
        <button type="button" onClick={() => { setDraft(value); setEditing(true); }} className="shrink-0 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">Rename</button>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        className={`${inputClass} !h-8 max-w-[16rem] !text-[13px]`}
        maxLength={50}
        autoFocus
        disabled={saving}
      />
      <button type="button" onClick={save} disabled={saving} className={`${btnSolid} !h-8`}>Save</button>
      <button type="button" onClick={() => setEditing(false)} className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">Cancel</button>
    </span>
  );
}

/** Presence word. Hidden on narrow screens so names keep room. */
function presenceStatus(lastActiveAt?: number) {
  const p = lastActiveAt ? getAgentPresence(lastActiveAt) : null;
  return (
    <span className="hidden sm:contents">
      <Status kind={!p ? "muted" : p.state === "active" ? "ok" : p.state === "recent" ? "warn" : "muted"}>{p ? p.label : "Never active"}</Status>
    </span>
  );
}

/* ------------------------------------------------------------------
   Main agent identity + subagents. Distinct shape from the card grid:
   the main agent is the single workspace-token identity, subagents are
   task agents identified by the X-APIClaw-Subagent header. Neither
   carries a fingerprint session or model-rail switcher. The main agent
   renders as a regular card folded into the AgentCardGrid (2026-08-24:
   the old standalone "Main agent" section was removed, UI only, the
   underlying agents:getMainAgent data and mutations are unchanged);
   subagents keep their own plain-list section below.
   ------------------------------------------------------------------ */

interface MainAgentData {
  workspaceId: string;
  email: string;
  mainAgentId: string | null;
  mainAgentName: string | null;
  aiBackend?: string | null;
  usageCount: number;
  createdAt: number;
}

interface SubagentData {
  id: string;
  subagentId: string;
  name: string;
  callCount: number;
  firstSeenAt: number;
  lastActiveAt: number;
}

/** Main agent rendered as a regular card in the AgentCardGrid, matching AgentCard's visual language. */
function MainAgentCard({ mainAgent, onRename }: { mainAgent: MainAgentData; onRename: (name: string) => Promise<void> }) {
  const label = mainAgent.mainAgentName || mainAgent.mainAgentId || "Workspace agent";
  return (
    <Panel className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-[12px] font-semibold">
          {monogram(label)}
        </span>
        <span className="min-w-0 flex-1">
          <InlineName value={mainAgent.mainAgentName || ""} fallback={mainAgent.mainAgentId || "Workspace agent"} onSave={onRename} />
          <span className="claw-mono block truncate text-[11.5px] text-[var(--text-muted)]">
            {mainAgent.aiBackend ? `custom:${mainAgent.aiBackend}` : mainAgent.mainAgentId}
          </span>
        </span>
      </div>
      <div className="flex items-center justify-between text-[12px] text-[var(--text-muted)]">
        <Status kind="muted">Workspace identity</Status>
        <span>{(mainAgent.usageCount ?? 0).toLocaleString()} calls</span>
      </div>
    </Panel>
  );
}

/** Fetches and manages both the main agent identity and subagents. Rendering is split: the caller folds the main agent into the card grid and renders subagents separately. */
function useAgentsExtras(sessionToken: string | null) {
  const [loading, setLoading] = useState(true);
  const [mainAgent, setMainAgent] = useState<MainAgentData | null>(null);
  const [subagents, setSubagents] = useState<SubagentData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showRegister, setShowRegister] = useState(false);
  const [regId, setRegId] = useState("");
  const [regName, setRegName] = useState("");
  const [regBusy, setRegBusy] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const subConfirm = useArmed();

  useEffect(() => {
    if (!sessionToken) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [mainRes, subRes] = await Promise.all([
          convexCall<MainAgentData | null>("query", "agents:getMainAgent", { token: sessionToken }),
          convexCall<{ subagents?: unknown } | null>("query", "agents:getSubagents", { token: sessionToken, limit: 50 }),
        ]);
        if (cancelled) return;
        if (mainRes && typeof mainRes === "object" && "mainAgentId" in mainRes) setMainAgent(mainRes);
        if (subRes && Array.isArray(subRes.subagents)) setSubagents(subRes.subagents as SubagentData[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load subagents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionToken]);

  const renameMain = async (name: string) => {
    if (!sessionToken) return;
    try {
      await convexCall("mutation", "agents:renameMainAgent", { token: sessionToken, name });
      setMainAgent((prev) => (prev ? { ...prev, mainAgentName: name } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed");
    }
  };

  const renameSubagent = async (subagentId: string, name: string) => {
    if (!sessionToken) return;
    try {
      await convexCall("mutation", "agents:renameSubagent", { token: sessionToken, subagentId, name });
      setSubagents((prev) => prev.map((s) => (s.subagentId === subagentId ? { ...s, name } : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed");
    }
  };

  const removeSubagent = async (subagentId: string) => {
    if (!sessionToken) return;
    if (subConfirm.armed !== subagentId) { subConfirm.arm(subagentId); return; }
    subConfirm.disarm();
    try {
      await convexCall("mutation", "agents:deleteSubagent", { token: sessionToken, subagentId });
      setSubagents((prev) => prev.filter((s) => s.subagentId !== subagentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    }
  };

  const register = async () => {
    const id = regId.trim();
    if (!sessionToken || !id) { setRegError("Subagent ID is required"); return; }
    setRegBusy(true);
    setRegError(null);
    try {
      const res = await convexCall<{ id?: string }>("mutation", "agents:registerTaskAgent", {
        token: sessionToken,
        subagentId: id,
        name: regName.trim() || undefined,
      });
      const now = Date.now();
      setSubagents((prev) => [
        { id: res?.id || id, subagentId: id, name: regName.trim() || id, callCount: 0, firstSeenAt: now, lastActiveAt: now },
        ...prev.filter((s) => s.subagentId !== id),
      ]);
      setRegId("");
      setRegName("");
      setShowRegister(false);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setRegBusy(false);
    }
  };

  return {
    loading,
    error,
    mainAgent,
    subagents,
    renameMain,
    renameSubagent,
    removeSubagent,
    subConfirm,
    showRegister,
    setShowRegister,
    regId,
    setRegId,
    regName,
    setRegName,
    regBusy,
    regError,
    setRegError,
    register,
  };
}

type AgentsExtras = ReturnType<typeof useAgentsExtras>;

/** Plain-list subagents section, unchanged from before except it no longer shares a component with "Main agent". */
function SubagentsSection({ extras }: { extras: AgentsExtras }) {
  const { subagents, renameSubagent, removeSubagent, subConfirm, showRegister, setShowRegister, regId, setRegId, regName, setRegName, regBusy, regError, setRegError, register } = extras;

  if (subagents.length === 0) return null;

  return (
    <Section
      title="Subagents"
      description="Task agents identified by the X-APIClaw-Subagent header."
      className="mt-8"
      action={!showRegister ? <button type="button" onClick={() => setShowRegister(true)} className={btnQuiet}>Register</button> : undefined}
    >
      {showRegister && (
        <Panel className="mb-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subagent ID" hint="Must match the header value the agent sends.">
              <input type="text" value={regId} onChange={(e) => setRegId(e.target.value)} className={`${inputClass} claw-mono`} maxLength={100} autoFocus />
            </Field>
            <Field label="Name (optional)">
              <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && register()} className={inputClass} maxLength={50} />
            </Field>
          </div>
          {regError && <p className="mt-3 text-[13px] text-[var(--accent)]">{regError}</p>}
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={register} disabled={regBusy || !regId.trim()} className={btnSolid}>{regBusy ? "Registering" : "Register"}</button>
            <button type="button" onClick={() => { setShowRegister(false); setRegError(null); }} className={btnQuiet}>Cancel</button>
          </div>
        </Panel>
      )}
      <div>
        {subagents.map((s) => (
          <Row
            key={s.id}
            right={<>
              {presenceStatus(s.lastActiveAt)}
              <span>{(s.callCount ?? 0).toLocaleString()} calls</span>
              <button type="button" onClick={() => removeSubagent(s.subagentId)} className={`${btnDanger} !h-8`}>
                {subConfirm.armed === s.subagentId ? "Confirm remove" : "Remove"}
              </button>
            </>}
          >
            <InlineName value={s.name || ""} fallback={s.subagentId} onSave={(n) => renameSubagent(s.subagentId, n)} />
            {s.name && s.name !== s.subagentId && <p className="claw-mono truncate text-[12px] text-[var(--text-muted)]">{s.subagentId}</p>}
          </Row>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------
   Slim usage strip: Calls / Remaining / Plan folded down from the old
   Home view (2026-08-24 restructure).
   ------------------------------------------------------------------ */

function UsageStrip({ workspace, onUpgrade }: { workspace: Workspace | null; onUpgrade: () => void }) {
  const isPaid = isUnlimitedWorkspace(workspace || {});
  const usageCount = workspace?.usageCount ?? 0;
  const hasPlanLimit = Boolean(workspace?.usageLimit && workspace.usageLimit > 0);
  const usageLimit = hasPlanLimit ? (workspace!.usageLimit as number) : 0;
  const usageRemaining = isPaid || !hasPlanLimit ? -1 : Math.max(0, workspace?.usageRemaining ?? usageLimit - usageCount);
  const nearCap = !isPaid && hasPlanLimit && usageRemaining / usageLimit <= 0.2;

  return (
    <div className="mb-8 flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-[var(--border-subtle)] pb-5 text-[13px]">
      <span className="flex items-baseline gap-1.5"><span className="text-[var(--text-primary)]">{usageCount.toLocaleString()}</span><span className="text-[var(--text-muted)]">calls</span></span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-[var(--text-primary)]">{isPaid || !hasPlanLimit ? "Unlimited" : usageRemaining.toLocaleString()}</span>
        <span className="text-[var(--text-muted)]">remaining{hasPlanLimit && !isPaid ? ` of ${usageLimit.toLocaleString()}` : ""}</span>
      </span>
      <span className="flex items-baseline gap-1.5"><span className="text-[var(--text-primary)]">{tierLabel(workspace?.tier)}</span><span className="text-[var(--text-muted)]">plan</span></span>
      {nearCap && (
        <button type="button" onClick={onUpgrade} className="ml-auto text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Upgrade</button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Connect an agent: the three real connection surfaces (hosted MCP,
   local MCP over stdio via the CLI, ACP over stdio via `apiclaw acp`),
   shown as quiet key-value rows. Connector management (OAuth client
   registration, generate-a-connector) used to be its own page at
   /workspace/integrations; it now lives here as a collapsed-by-default
   accordion so the Agents view stays clean (2026-08-24).
   ------------------------------------------------------------------ */

/** Labeled command/URL row: label above, monospace value + copy button below. */
function SurfaceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-[var(--border-subtle)] py-3 first:border-t-0 first:pt-0">
      <p className="mb-1.5 text-[12px] text-[var(--text-muted)]">{label}</p>
      <CopyLine text={value} />
    </div>
  );
}

function ConnectAgentSection({ sessionToken }: { sessionToken: string | null }) {
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  return (
    <Section title="Connect an agent" description="Three ways to bring an agent into this workspace." className="mt-8">
      <Panel className="p-5">
        <SurfaceRow label="Hosted MCP" value={REMOTE_MCP_URL} />
        <SurfaceRow label="Local MCP" value={LOCAL_MCP_COMMAND} />
        <SurfaceRow label="ACP" value={ACP_COMMAND} />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link href="/docs#remote-mcp" className={btnQuiet}>Docs</Link>
          <button type="button" onClick={() => setConnectorsOpen((v) => !v)} className="ml-auto text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            {connectorsOpen ? "Hide connectors" : "Connectors"}
          </button>
        </div>
      </Panel>
      {connectorsOpen && <ConnectorsAccordion sessionToken={sessionToken} />}
    </Section>
  );
}

/* ------------------------------------------------------------------
   Connectors accordion: connected OAuth clients + generate-a-connector
   form. Ported from the old standalone /workspace/integrations page
   (now a redirect), same Convex paths and REST endpoint.
   ------------------------------------------------------------------ */

type Connector = {
  clientId: string;
  name: string;
  redirectUris: string[];
  registrationKind: "dashboard" | "dynamic";
  clientSecretPrefix: string | null;
  createdAt: number;
  lastUsedAt: number | null;
};

type ConnectorPreset = {
  key: string;
  label: string;
  redirectUris: string[];
  guide?: string[];
};

// Seeds only. Users can edit the redirect URIs before generating.
const CONNECTOR_PRESETS: ConnectorPreset[] = [
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

async function connectorsQuery<T>(path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  const json = await res.json();
  if (json?.status === "error") throw new Error(json?.errorMessage || "query_failed");
  return (json?.value ?? json) as T;
}

async function connectorsMutate<T>(path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  const json = await res.json();
  if (json?.status === "error") throw new Error(json?.errorMessage || "mutation_failed");
  return (json?.value ?? json) as T;
}

/** Mono value with a copy affordance, tracked per-field. */
function CopyField({ label, value, field, copiedField, onCopy }: { label?: string; value: string; field: string; copiedField: string | null; onCopy: (value: string, field: string) => void }) {
  return (
    <div className="flex items-center gap-4 border-t border-[var(--border-subtle)] py-2.5">
      <div className="min-w-0 flex-1">
        {label && <p className="text-[12px] text-[var(--text-muted)]">{label}</p>}
        <p className="claw-mono truncate text-[12.5px] text-[var(--text-primary)]">{value}</p>
      </div>
      <button type="button" onClick={() => onCopy(value, field)} className="shrink-0 text-[12.5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        {copiedField === field ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function ConnectorsAccordion({ sessionToken }: { sessionToken: string | null }) {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>("grok");
  const [customName, setCustomName] = useState("");
  const [redirectInput, setRedirectInput] = useState("");
  const [issued, setIssued] = useState<{ name: string; clientId: string; clientSecret: string; redirectUris: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const selected = CONNECTOR_PRESETS.find((p) => p.key === preset) ?? CONNECTOR_PRESETS[0];

  useEffect(() => {
    setRedirectInput(selected.redirectUris.join("\n"));
    setCustomName(selected.key === "custom" ? "" : selected.label);
  }, [selected]);

  const refresh = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await connectorsQuery<Connector[]>("mcpOAuth:listConnectors", { sessionToken: token });
      setConnectors(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load connectors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionToken) void refresh(sessionToken);
    else setLoading(false);
  }, [sessionToken, refresh]);

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
      await connectorsMutate("mcpOAuth:revokeConnector", { sessionToken, clientId: c.clientId });
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
    <>
      {error && <p className="mt-4 text-[13px] text-[var(--accent)]">{error}</p>}

      <Section title="Connected clients" description="Clients that registered with a client ID and secret." className="mt-6">
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
          <SurfaceTabs items={CONNECTOR_PRESETS.map((p) => ({ id: p.key, label: p.label }))} active={preset} onChange={setPreset} label="Client" />
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
            <CopyField label="Client ID" value={issued.clientId} field="client-id" copiedField={copiedField} onCopy={copy} />
            <CopyField label="Client secret" value={issued.clientSecret} field="client-secret" copiedField={copiedField} onCopy={copy} />
            <CopyField label="MCP URL" value={REMOTE_MCP_URL} field="issued-mcp-url" copiedField={copiedField} onCopy={copy} />
            <button type="button" onClick={() => setIssued(null)} className={`${btnQuiet} mt-4`}>Done</button>
          </div>
        )}
      </Section>
    </>
  );
}

export function AgentsTab({
  workspace,
  hasAgentsHint,
  setActiveTab,
  sessionToken,
  onToast,
}: {
  workspace: Workspace | null;
  /** True once the caller knows at least one agent has connected (drives the Next step card). */
  hasAgentsHint: boolean;
  setActiveTab: (tab: TabType) => void;
  sessionToken?: string | null;
  onToast?: (message: string, type: "success" | "error" | "info") => void;
}) {
  const router = useRouter();
  const navigateTo = (tab: TabType) => {
    setActiveTab(tab);
    router.push(tab === "activity" ? "/workspace?tab=activity&sub=logs" : `/workspace?tab=${tab}`);
  };

  const extras = useAgentsExtras(sessionToken ?? null);
  const leadingCard = extras.mainAgent?.mainAgentId
    ? <MainAgentCard key="main-agent" mainAgent={extras.mainAgent} onRename={extras.renameMain} />
    : undefined;

  const usageCount = workspace?.usageCount ?? 0;
  const next = !hasAgentsHint
    ? null
    : usageCount === 0
      ? { title: "Make your first call", body: "Your agent is connected. Run one call to see it in Activity.", cta: "Make your first call", tab: "api-catalog" as TabType }
      : null;

  return (
    <div>
      <PageHeader title="Agents" description={workspace?.workspaceName || workspace?.email} />

      <UsageStrip workspace={workspace} onUpgrade={() => navigateTo("billing")} />

      {next && (
        <Section title="Next step" className="mb-2">
          <Panel className="p-5">
            <p className="text-[15px] font-semibold tracking-[-0.01em]">{next.title}</p>
            <p className="mt-1 text-[13.5px] text-[var(--text-muted)]">{next.body}</p>
            <div className="mt-4">
              <button type="button" onClick={() => navigateTo(next.tab)} className={btnSolid}>{next.cta}</button>
            </div>
          </Panel>
        </Section>
      )}

      <Section className={next ? "mt-8" : ""}>
        <AgentCardGrid
          sessionToken={sessionToken ?? null}
          onToast={onToast}
          leadingCard={leadingCard}
          onEmpty={
            <Empty
              title="No agents connected"
              body="Run this in any MCP client signed in to this workspace."
              action={<div className="w-full max-w-[34rem]"><CopyLine text={INSTALL_LINE} /></div>}
            />
          }
        />
      </Section>

      <ConnectAgentSection sessionToken={sessionToken ?? null} />

      {extras.error && <p className="mt-4 text-[13px] text-[var(--accent)]">{extras.error}</p>}
      <SubagentsSection extras={extras} />
    </div>
  );
}
