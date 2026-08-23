"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { getAgentPresence } from "@/lib/workspace-truth";
import { INSTALL_LINE, REMOTE_MCP_URL } from "@/components/home/truth";
import { CONVEX_URL, Agent, ConnectedAgent } from "../_shared";
import {
  PageHeader,
  Section,
  Panel,
  SurfaceTabs,
  Row,
  Status,
  Empty,
  Loading,
  KV,
  Field,
  inputClass,
  btnSolid,
  btnQuiet,
  btnDanger,
} from "./ui";

/* ------------------------------------------------------------------
   Shared helpers (local to this view)
   ------------------------------------------------------------------ */

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

function timeAgo(ts?: number) {
  if (!ts) return "never";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(ts).toLocaleDateString();
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

const MCP_CLIENT_LABEL: Record<string, string> = {
  "claude-desktop": "Claude Desktop",
  "claude-code": "Claude Code",
  cursor: "Cursor",
  windsurf: "Windsurf",
  cline: "Cline",
  continue: "Continue",
  vscode: "VS Code",
};

function clientLabel(client?: string) {
  if (!client) return "Unknown client";
  return MCP_CLIENT_LABEL[client] || client;
}

/** One line with a copy affordance. Same shape as the homepage command line. */
function CopyLine({ text, prompt = "›" }: { text: string; prompt?: string }) {
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

/* ------------------------------------------------------------------
   Connections: Agents | API keys | Remote MCP
   ------------------------------------------------------------------ */

export function ConnectionsTab({
  onRevoke,
  onRename,
  sessionToken,
  section,
  onSectionChange,
}: {
  agents: Agent[];
  onRevoke: (id: string) => void;
  onRename: (id: string, name: string) => void;
  workspaceEmail?: string;
  sessionToken: string | null;
  isProvider: boolean;
  section: string;
  onSectionChange: (section: string) => void;
}) {
  const sections = [
    { id: "agents", label: "Agents" },
    { id: "keys", label: "API keys" },
    { id: "remote", label: "Remote MCP" },
  ];

  return (
    <div>
      <PageHeader title="Connections" description="Agents, keys, and remote clients that use this workspace." />
      <div className="mb-6">
        <SurfaceTabs items={sections} active={section} onChange={onSectionChange} />
      </div>
      {section === "agents" && <AgentsTab sessionToken={sessionToken} onRevoke={onRevoke} onRename={onRename} />}
      {section === "keys" && <APIKeysTab sessionToken={sessionToken} />}
      {section === "remote" && <RemoteTab />}
    </div>
  );
}

/* ------------------------------------------------------------------
   Agents
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

interface SessionData {
  id: string;
  fingerprint: string;
  customName: string | null;
  name: string;
  lastUsedAt: number;
  createdAt: number;
  isCurrent: boolean;
}

function AgentsTab({
  sessionToken,
  onRevoke,
  onRename,
}: {
  sessionToken: string | null;
  onRevoke: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ConnectedAgent[]>([]);
  const [mainAgent, setMainAgent] = useState<MainAgentData | null>(null);
  const [subagents, setSubagents] = useState<SubagentData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showRegister, setShowRegister] = useState(false);
  const [regId, setRegId] = useState("");
  const [regName, setRegName] = useState("");
  const [regBusy, setRegBusy] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const subConfirm = useArmed();
  const sessionConfirm = useArmed();

  useEffect(() => {
    if (!sessionToken) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [clientsRes, mainRes, subRes, sessRes] = await Promise.all([
          convexCall<unknown>("query", "agents:getWorkspaceAgents", { token: sessionToken }),
          convexCall<MainAgentData | null>("query", "agents:getMainAgent", { token: sessionToken }),
          convexCall<{ subagents?: unknown } | null>("query", "agents:getSubagents", { token: sessionToken, limit: 50 }),
          convexCall<unknown>("query", "workspaces:getConnectedAgents", { token: sessionToken }),
        ]);
        if (cancelled) return;
        if (Array.isArray(clientsRes)) setClients(clientsRes as ConnectedAgent[]);
        if (mainRes && typeof mainRes === "object" && "mainAgentId" in mainRes) setMainAgent(mainRes);
        if (subRes && Array.isArray(subRes.subagents)) setSubagents(subRes.subagents as SubagentData[]);
        if (Array.isArray(sessRes)) setSessions(sessRes as SessionData[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load agents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionToken]);

  const renameClient = async (agentId: string, name: string) => {
    if (!sessionToken) return;
    try {
      await convexCall("mutation", "agents:renameAgent", { token: sessionToken, agentId, name });
      setClients((prev) => prev.map((c) => (c.id === agentId ? { ...c, name } : c)));
      onRename(agentId, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed");
    }
  };

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

  const revokeSession = (id: string) => {
    if (sessionConfirm.armed !== id) { sessionConfirm.arm(id); return; }
    sessionConfirm.disarm();
    onRevoke(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
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

  if (loading) return <Loading label="Loading agents" />;

  const hasMain = Boolean(mainAgent?.mainAgentId);
  const hasAgents = hasMain || clients.length > 0;

  return (
    <div>
      {error && <p className="mb-4 text-[13px] text-[var(--accent)]">{error}</p>}

      <Section
        title="Agents"
        action={hasAgents ? <Link href="/docs" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Connect another</Link> : undefined}
      >
        {!hasAgents ? (
          <Empty
            title="No agents connected"
            body="Run this in any MCP client signed in to this workspace."
            action={<div className="w-full max-w-[34rem]"><CopyLine text={INSTALL_LINE} prompt="$" /></div>}
          />
        ) : (
          <div>
            {hasMain && mainAgent && (
              <Row right={<span>{(mainAgent.usageCount ?? 0).toLocaleString()} calls</span>}>
                <InlineName value={mainAgent.mainAgentName || ""} fallback="Main agent" onSave={renameMain} />
                <p className="claw-mono truncate text-[12px] text-[var(--text-muted)]">
                  {mainAgent.mainAgentId}{mainAgent.aiBackend ? ` · ${mainAgent.aiBackend}` : ""}
                </p>
              </Row>
            )}
            {clients.map((c) => (
              <Row
                key={c.id}
                right={<>
                  {presenceStatus(c.lastActiveAt)}
                  <span>{(c.callCount ?? 0).toLocaleString()} calls</span>
                </>}
              >
                <InlineName value={c.name || ""} fallback={clientLabel(c.mcpClient)} onSave={(n) => renameClient(c.id, n)} />
                <p className="claw-mono truncate text-[12px] text-[var(--text-muted)]">
                  {clientLabel(c.mcpClient)}{c.hostname ? ` · ${c.hostname}` : ""}{c.aiBackend ? ` · ${c.aiBackend}` : ""}
                </p>
              </Row>
            ))}
          </div>
        )}
      </Section>

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
        {subagents.length === 0 ? (
          <p className="text-[13.5px] text-[var(--text-muted)]">None yet. A subagent appears after its first call, or register one ahead of time.</p>
        ) : (
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
        )}
      </Section>

      {sessions.length > 0 && (
        <Section title="Access" description="Tokens that can act as this workspace. Revoking one disconnects that client." className="mt-8">
          <div>
            {sessions.map((s) => (
              <Row
                key={s.id}
                right={<>
                  <span className="hidden sm:inline">Last used {timeAgo(s.lastUsedAt)}</span>
                  {s.isCurrent ? (
                    <span>this session</span>
                  ) : (
                    <button type="button" onClick={() => revokeSession(s.id)} className={`${btnDanger} !h-8`}>
                      {sessionConfirm.armed === s.id ? "Confirm revoke" : "Revoke"}
                    </button>
                  )}
                </>}
              >
                <p className="truncate text-[14px]">{s.customName || s.fingerprint}</p>
                {s.customName && <p className="claw-mono truncate text-[12px] text-[var(--text-muted)]">{s.fingerprint}</p>}
              </Row>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   API keys
   ------------------------------------------------------------------ */

interface ApiKeyRow {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: number;
  createdAt: number;
}

function APIKeysTab({ sessionToken }: { sessionToken: string | null }) {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<{ key: string; name: string } | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const confirm = useArmed();

  const fetchKeys = useCallback(async () => {
    if (!sessionToken) { setLoading(false); return; }
    try {
      const res = await convexCall<{ keys?: unknown } | null>("query", "apiKeys:listKeys", { token: sessionToken });
      setKeys(res && Array.isArray(res.keys) ? (res.keys as ApiKeyRow[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load keys");
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const generate = async () => {
    const name = newName.trim();
    if (!sessionToken || !name) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/workspace/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data?.key === "string") {
        setRevealed({ key: data.key, name: data.name || name });
        setNewName("");
        setShowCreate(false);
        fetchKeys();
      } else {
        setError(data?.error || "Could not create key");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create key");
    } finally {
      setGenerating(false);
    }
  };

  const revoke = async (keyId: string) => {
    if (!sessionToken) return;
    if (confirm.armed !== keyId) { confirm.arm(keyId); return; }
    confirm.disarm();
    setRevoking(keyId);
    try {
      await convexCall("mutation", "apiKeys:revokeKey", { token: sessionToken, keyId });
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revoke failed");
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div>
      {revealed && (
        <Panel className="mb-8 p-5">
          <p className="text-[15px] font-semibold tracking-[-0.01em]">Key created: {revealed.name}</p>
          <p className="mt-1 text-[13.5px] text-[var(--text-muted)]">Shown once. Copy it now; the list keeps only the prefix.</p>
          <div className="mt-4"><CopyLine text={revealed.key} /></div>
          <div className="mt-4">
            <button type="button" onClick={() => setRevealed(null)} className={btnQuiet}>Done</button>
          </div>
        </Panel>
      )}

      <Section
        title="API keys"
        description="For tools outside an MCP client: OpenClaw, n8n, scripts."
        action={!showCreate ? <button type="button" onClick={() => setShowCreate(true)} className={btnSolid}>New key</button> : undefined}
      >
        {showCreate && (
          <Panel className="mb-4 p-5">
            <Field label="Name">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
                placeholder="Production, n8n, CI"
                className={inputClass}
                maxLength={80}
                autoFocus
              />
            </Field>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={generate} disabled={generating || !newName.trim()} className={btnSolid}>{generating ? "Creating" : "Create key"}</button>
              <button type="button" onClick={() => { setShowCreate(false); setError(null); }} className={btnQuiet}>Cancel</button>
            </div>
          </Panel>
        )}
        {error && <p className="mb-3 text-[13px] text-[var(--accent)]">{error}</p>}

        {loading ? (
          <Loading label="Loading keys" />
        ) : keys.length === 0 ? (
          <Empty
            title="No API keys"
            body="MCP clients do not need one."
            action={!showCreate ? <button type="button" onClick={() => setShowCreate(true)} className={btnSolid}>New key</button> : undefined}
          />
        ) : (
          <div>
            {keys.map((k) => (
              <Row
                key={k.id}
                right={<>
                  <span className="hidden sm:inline">Last used {timeAgo(k.lastUsedAt)}</span>
                  <button type="button" onClick={() => revoke(k.id)} disabled={revoking === k.id} className={`${btnDanger} !h-8`}>
                    {revoking === k.id ? "Revoking" : confirm.armed === k.id ? "Confirm revoke" : "Revoke"}
                  </button>
                </>}
              >
                <p className="truncate text-[14px]">{k.name}</p>
                <p className="claw-mono truncate text-[12px] text-[var(--text-muted)]">{k.keyPrefix} · created {timeAgo(k.createdAt)}</p>
              </Row>
            ))}
          </div>
        )}
      </Section>

      <Section title="Use a key" className="mt-8" action={<Link href="/docs#gateway" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Docs</Link>}>
        <KV k="Base URL" v="https://api.apiclaw.cloud/v1" mono />
        <KV k="Header" v="Authorization: Bearer sk-claw-..." mono />
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------
   Remote MCP
   ------------------------------------------------------------------ */

function RemoteTab() {
  return (
    <Section title="Remote MCP" description="Hosted clients connect over HTTP with workspace sign-in.">
      <Panel className="p-5">
        <p className="mb-2 text-[13px] text-[var(--text-muted)]">Endpoint</p>
        <CopyLine text={REMOTE_MCP_URL} />
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/workspace/integrations" className={btnSolid}>Integrations</Link>
          <Link href="/docs#remote-mcp" className={btnQuiet}>Docs</Link>
        </div>
      </Panel>
    </Section>
  );
}
