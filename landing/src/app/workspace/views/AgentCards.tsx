"use client";

/**
 * Buzz-inspired agent card grid (BYOH Phase 2, 2026-08-24). Cards + detail
 * side panel for the workspace's connected agents. Every element maps to
 * real data from agents:getWorkspaceAgents / workspaces:getConnectedAgents;
 * nothing here is decorative filler (INSPO BOUNDARY in BYOH-BUILD-PLAN.md).
 *
 * Honesty rule: the model switcher only governs apiclaw/-routed calls. An
 * agent that reports its own aiBackend (a foreign harness) shows a muted
 * "custom:" note instead of a switcher: the switcher can't touch that
 * traffic and the UI must never imply otherwise.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getAgentPresence } from "@/lib/workspace-truth";
import { GATEWAY_URL } from "@/components/WorkspaceCatalog";
import { CONVEX_URL, ConnectedAgent } from "../_shared";
import { Panel, Row, Status, Loading, KV, inputClass, btnSolid, btnQuiet, btnDanger } from "./ui";

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

const MCP_CLIENT_LABEL: Record<string, string> = {
  "claude-desktop": "Claude Desktop",
  "claude-code": "Claude Code",
  openclaw: "OpenClaw",
  codex: "Codex",
  cursor: "Cursor",
  windsurf: "Windsurf",
  cline: "Cline",
  continue: "Continue",
  vscode: "VS Code",
};

/** mcpClient values that mean "we could not detect a harness", not a real identity to prettify. */
const UNKNOWN_MCP_CLIENT_VALUES = new Set(["unknown", ""]);

/** Title-case a hyphen/underscore/space separated id, e.g. "some-tool" -> "Some Tool". */
function titleCase(raw: string): string {
  return raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function clientLabel(client?: string) {
  if (!client) return "Unknown client";
  return MCP_CLIENT_LABEL[client] || client;
}

/**
 * "claude-code" -> "Claude Code". Mirrors convex/agentDisplay.ts's
 * prettifyMcpClient (that module runs server-side only, so this client
 * component keeps its own copy rather than importing it). Falls back to
 * title-casing an unrecognized mcpClient id; returns null only when
 * there is no real harness identity to show (unset or "unknown").
 */
function prettifyMcpClient(mcpClient?: string | null): string | null {
  if (!mcpClient) return null;
  const key = mcpClient.trim().toLowerCase();
  if (!key || UNKNOWN_MCP_CLIENT_VALUES.has(key)) return null;
  if (MCP_CLIENT_LABEL[key]) return MCP_CLIENT_LABEL[key];
  return titleCase(key);
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

function monogram(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/[\s·:]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}

interface SessionRow {
  id: string;
  fingerprint: string;
  isCurrent: boolean;
}

export interface CardAgent {
  id: string;
  fingerprint: string;
  name?: string;
  /** Resolved label: user rename > prettified mcpClient > stored name > "Unknown agent". */
  displayName: string;
  hostname: string;
  aiBackend?: string;
  mcpClient: string;
  callCount: number;
  firstSeenAt: number;
  lastActiveAt: number;
  defaultModel?: string | null;
  sessionId: string | null;
  isCurrentSession: boolean;
}

/**
 * Rail shown as a card's mono subtitle and in the detail panel. Falls
 * through defaultModel -> aiBackend -> prettified mcpClient -> a quiet
 * "No default model" so two different agents never render identically
 * unless they truly are (2026-08-24 differentiation fix; previously
 * every agent without a defaultModel showed the literal placeholder
 * "Default model").
 */
function modelRail(a: Pick<CardAgent, "defaultModel" | "aiBackend" | "mcpClient">): { text: string; kind: "apiclaw" | "custom" | "harness" | "none" } {
  if (a.defaultModel) return { text: a.defaultModel, kind: "apiclaw" };
  if (a.aiBackend) return { text: `custom:${a.aiBackend}`, kind: "custom" };
  const harness = prettifyMcpClient(a.mcpClient);
  if (harness) return { text: harness, kind: "harness" };
  return { text: "No default model", kind: "none" };
}

/* ------------------------------------------------------------------
   Model picker: sourced from GET /v1/models when reachable, otherwise a
   plain validated text input. The catalog is public (no auth needed).
   ------------------------------------------------------------------ */

function useModelCatalog() {
  const [ids, setIds] = useState<string[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`${GATEWAY_URL}/v1/models?endpoint=/v1/chat/completions`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data?.data) ? data.data : [];
        const list = rows.map((m: { id?: string }) => m.id).filter((id: unknown): id is string => typeof id === "string");
        setIds(list);
      })
      .catch(() => { if (!cancelled) setIds([]); });
    return () => { cancelled = true; };
  }, []);
  return ids;
}

function ModelEditor({ value, onSave, onCancel }: { value: string | null | undefined; onSave: (model: string | null) => Promise<void>; onCancel: () => void }) {
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);
  const catalog = useModelCatalog();
  const listId = "apiclaw-model-catalog";

  const save = async () => {
    setSaving(true);
    try { await onSave(draft.trim() || null); } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        list={listId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") onCancel(); }}
        placeholder="anthropic/claude-sonnet-5"
        className={`${inputClass} claw-mono !h-8 max-w-[16rem] !text-[12.5px]`}
        autoFocus
        disabled={saving}
      />
      {catalog && catalog.length > 0 && (
        <datalist id={listId}>
          {catalog.slice(0, 200).map((id) => <option key={id} value={id} />)}
        </datalist>
      )}
      <button type="button" onClick={save} disabled={saving} className={`${btnSolid} !h-8`}>{saving ? "Saving" : "Save"}</button>
      {value && <button type="button" onClick={() => onSave(null)} disabled={saving} className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">Clear</button>}
      <button type="button" onClick={onCancel} disabled={saving} className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">Cancel</button>
    </div>
  );
}

/* ------------------------------------------------------------------
   Card ⋮ menu
   ------------------------------------------------------------------ */

function CardMenu({ onSetModel, onRename, onRevoke, canSetModel, canRevoke }: {
  onSetModel: () => void;
  onRename: () => void;
  onRevoke: () => void;
  canSetModel: boolean;
  canRevoke: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setConfirmRevoke(false); } };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[15px] text-[var(--text-muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
        aria-label="Agent actions"
      >
        ⋮
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-10 w-[13rem] rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] p-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {canSetModel && (
            <button type="button" onClick={() => { setOpen(false); onSetModel(); }} className="block w-full rounded-[7px] px-2.5 py-2 text-left text-[13px] hover:bg-[var(--surface)]">
              Set default model
            </button>
          )}
          <button type="button" onClick={() => { setOpen(false); onRename(); }} className="block w-full rounded-[7px] px-2.5 py-2 text-left text-[13px] hover:bg-[var(--surface)]">
            Rename
          </button>
          {canRevoke && (
            <button
              type="button"
              onClick={() => { if (!confirmRevoke) { setConfirmRevoke(true); return; } setOpen(false); setConfirmRevoke(false); onRevoke(); }}
              className="block w-full rounded-[7px] px-2.5 py-2 text-left text-[13px] text-[var(--accent)] hover:bg-[var(--surface)]"
            >
              {confirmRevoke ? "Confirm revoke" : "Revoke session"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Detail side panel
   ------------------------------------------------------------------ */

function DetailPanel({ agent, initialEditModel, onClose, onRename, onSetModel, onRevoke }: {
  agent: CardAgent;
  initialEditModel: boolean;
  onClose: () => void;
  onRename: (name: string) => Promise<void>;
  onSetModel: (model: string | null) => Promise<void>;
  onRevoke: () => Promise<void>;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(agent.displayName);
  const [editingModel, setEditingModel] = useState(initialEditModel);
  const [revokeArmed, setRevokeArmed] = useState(false);
  const rail = modelRail(agent);
  const presence = getAgentPresence(agent.lastActiveAt);

  const saveName = async () => {
    const next = nameDraft.trim();
    if (next.length < 2 || next.length > 50 || next === agent.displayName) { setEditingName(false); return; }
    await onRename(next);
    setEditingName(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/30" />
      <div className="claw relative flex h-full w-full max-w-[24rem] flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--background)] p-6">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Close panel">
          Close
        </button>

        <div className="flex items-center gap-3 pr-10">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-[13px] font-semibold">
            {monogram(agent.displayName)}
          </span>
          {!editingName ? (
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="truncate text-[16px] font-semibold tracking-[-0.01em]">{agent.displayName}</p>
                <button type="button" onClick={() => { setNameDraft(agent.displayName); setEditingName(true); }} className="shrink-0 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">Rename</button>
              </div>
              <Status kind={presence.state === "active" ? "ok" : "muted"}>{presence.label}</Status>
            </div>
          ) : (
            <div className="flex min-w-0 flex-col gap-2">
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                className={`${inputClass} !h-8 !text-[13px]`}
                maxLength={50}
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={saveName} className={`${btnSolid} !h-7`}>Save</button>
                <button type="button" onClick={() => setEditingName(false)} className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]">Info</h3>

          <div className="mt-2 border-t border-[var(--border-subtle)] py-2.5 text-[13.5px]">
            <div className="flex items-baseline justify-between gap-6">
              <span className="text-[var(--text-muted)]">Model rail</span>
              {!editingModel ? (
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`claw-mono truncate text-right text-[12.5px] ${rail.kind === "apiclaw" ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>{rail.text}</span>
                  {rail.kind !== "custom" && (
                    <button type="button" onClick={() => setEditingModel(true)} className="shrink-0 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">Edit</button>
                  )}
                </span>
              ) : null}
            </div>
            {rail.kind === "custom" && (
              <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">Set by your harness. APIClaw does not route or switch this agent&apos;s model.</p>
            )}
            {editingModel && (
              <div className="mt-2">
                <ModelEditor
                  value={agent.defaultModel}
                  onSave={async (model) => { await onSetModel(model); setEditingModel(false); }}
                  onCancel={() => setEditingModel(false)}
                />
              </div>
            )}
          </div>

          <KV k="Host" v={agent.hostname || "Unknown"} mono />
          <KV k="MCP client" v={clientLabel(agent.mcpClient)} />
          <KV k="First seen" v={new Date(agent.firstSeenAt).toLocaleDateString()} />
          <KV k="Last active" v={timeAgo(agent.lastActiveAt)} />
          <KV k="Calls" v={agent.callCount.toLocaleString()} />

          <div className="flex items-baseline justify-between gap-6 border-t border-[var(--border-subtle)] py-2.5 text-[13.5px]">
            <span className="text-[var(--text-muted)]">Session</span>
            {agent.isCurrentSession ? (
              <span className="text-[13px] text-[var(--text-muted)]">This session</span>
            ) : agent.sessionId ? (
              <button
                type="button"
                onClick={() => { if (!revokeArmed) { setRevokeArmed(true); return; } setRevokeArmed(false); onRevoke(); }}
                className={`${btnDanger} !h-7`}
              >
                {revokeArmed ? "Confirm revoke" : "Revoke"}
              </button>
            ) : (
              <span className="text-[13px] text-[var(--text-muted)]">No active session</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Card grid
   ------------------------------------------------------------------ */

function AgentCard({ agent, onOpen, onSetModel, onRename, onRevoke }: {
  agent: CardAgent;
  onOpen: () => void;
  onSetModel: () => void;
  onRename: (name: string) => Promise<void>;
  onRevoke: () => Promise<void>;
}) {
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(agent.displayName);
  const rail = modelRail(agent);
  const presence = getAgentPresence(agent.lastActiveAt);
  const label = agent.displayName;

  const saveName = async () => {
    const next = nameDraft.trim();
    if (next.length >= 2 && next.length <= 50 && next !== agent.displayName) await onRename(next);
    setRenaming(false);
  };

  return (
    <Panel className="relative flex flex-col gap-3 p-4" onClick={onOpen}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3 text-left">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-[12px] font-semibold">
            {monogram(label)}
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] ${presence.state === "active" ? "bg-[var(--ok)]" : "bg-[var(--text-muted)]"}`}
              aria-hidden="true"
            />
          </span>
          <span className="min-w-0">
            {!renaming ? (
              <span className="block truncate text-[14px] font-medium">{label}</span>
            ) : (
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setRenaming(false); }}
                onClick={(e) => e.stopPropagation()}
                className={`${inputClass} !h-7 max-w-[10rem] !text-[13px]`}
                maxLength={50}
                autoFocus
              />
            )}
            <span className={`claw-mono block truncate text-[11.5px] ${rail.kind === "apiclaw" ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"}`}>{rail.text}</span>
          </span>
        </div>
        <CardMenu
          canSetModel={rail.kind !== "custom"}
          canRevoke={Boolean(agent.sessionId) && !agent.isCurrentSession}
          onSetModel={onSetModel}
          onRename={() => { setNameDraft(agent.displayName); setRenaming(true); }}
          onRevoke={onRevoke}
        />
      </div>
      {renaming && (
        <div onClick={(e) => e.stopPropagation()} className="-mt-1 flex gap-2 pl-12">
          <button type="button" onClick={saveName} className={`${btnSolid} !h-7`}>Save</button>
          <button type="button" onClick={() => setRenaming(false)} className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">Cancel</button>
        </div>
      )}
      <div className="flex items-center justify-between text-[12px] text-[var(--text-muted)]">
        <Status kind={presence.state === "active" ? "ok" : "muted"}>{presence.label}</Status>
        <span>{agent.callCount.toLocaleString()} calls</span>
      </div>
    </Panel>
  );
}

export function AgentCardGrid({ sessionToken, onToast, onEmpty }: {
  sessionToken: string | null;
  onToast?: (message: string, type: "success" | "error" | "info") => void;
  /** Rendered when there are zero connected agents. Keeps the empty-state copy owned by the caller. */
  onEmpty?: React.ReactNode;
}) {
  const [cards, setCards] = useState<CardAgent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelEditorFor, setModelEditorFor] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionToken) { setCards([]); return; }
    try {
      const [clientsRes, sessRes] = await Promise.all([
        convexCall<ConnectedAgent[]>("query", "agents:getWorkspaceAgents", { token: sessionToken }),
        convexCall<SessionRow[]>("query", "workspaces:getConnectedAgents", { token: sessionToken }),
      ]);
      const sessions = Array.isArray(sessRes) ? sessRes : [];
      const clients = Array.isArray(clientsRes) ? clientsRes : [];
      const usedSessionIds = new Set<string>();
      const next: CardAgent[] = clients.map((a) => {
        const match = sessions.find((s) => s.fingerprint === a.fingerprint && !usedSessionIds.has(s.id));
        if (match) usedSessionIds.add(match.id);
        return {
          id: a.id,
          fingerprint: a.fingerprint,
          name: a.name,
          displayName: a.displayName || a.name || clientLabel(a.mcpClient),
          hostname: a.hostname,
          aiBackend: a.aiBackend,
          mcpClient: a.mcpClient,
          callCount: a.callCount ?? 0,
          firstSeenAt: a.firstSeenAt,
          lastActiveAt: a.lastActiveAt,
          defaultModel: (a as ConnectedAgent & { defaultModel?: string | null }).defaultModel ?? null,
          sessionId: match ? match.id : null,
          isCurrentSession: match ? match.isCurrent : false,
        };
      });
      setCards(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load agents");
      setCards([]);
    }
  }, [sessionToken]);

  useEffect(() => { load(); }, [load]);

  const rename = async (agentId: string, name: string) => {
    if (!sessionToken) return;
    try {
      await convexCall("mutation", "agents:renameAgent", { token: sessionToken, agentId, name });
      setCards((prev) => prev && prev.map((c) => (c.id === agentId ? { ...c, name, displayName: name } : c)));
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : "Rename failed", "error");
    }
  };

  const setModel = async (agentId: string, model: string | null) => {
    if (!sessionToken) return;
    try {
      await convexCall("mutation", "agents:setDefaultModel", { token: sessionToken, agentId, defaultModel: model });
      setCards((prev) => prev && prev.map((c) => (c.id === agentId ? { ...c, defaultModel: model } : c)));
      onToast?.(model ? "Default model updated." : "Default model cleared.", "success");
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : "Could not update default model", "error");
    }
  };

  const revoke = async (agentId: string, sessionId: string) => {
    if (!sessionToken) return;
    try {
      await convexCall("mutation", "workspaces:revokeAgentSession", { token: sessionToken, sessionId });
      setCards((prev) => prev && prev.map((c) => (c.id === agentId ? { ...c, sessionId: null } : c)));
      onToast?.("Session revoked.", "success");
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : "Could not revoke session", "error");
    }
  };

  if (cards === null) return <Loading label="Loading agents" />;
  if (error) return <p className="text-[13px] text-[var(--accent)]">{error}</p>;
  if (cards.length === 0) return <>{onEmpty}</>;

  const selectedAgent = selected ? cards.find((c) => c.id === selected) || null : null;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((a) => (
          <AgentCard
            key={a.id}
            agent={a}
            onOpen={() => setSelected(a.id)}
            onSetModel={() => { setSelected(a.id); setModelEditorFor(a.id); }}
            onRename={(name) => rename(a.id, name)}
            onRevoke={() => (a.sessionId ? revoke(a.id, a.sessionId) : Promise.resolve())}
          />
        ))}
      </div>
      {selectedAgent && (
        <DetailPanel
          agent={selectedAgent}
          initialEditModel={modelEditorFor === selectedAgent.id}
          onClose={() => { setSelected(null); setModelEditorFor(null); }}
          onRename={(name) => rename(selectedAgent.id, name)}
          onSetModel={(model) => setModel(selectedAgent.id, model)}
          onRevoke={() => (selectedAgent.sessionId ? revoke(selectedAgent.id, selectedAgent.sessionId) : Promise.resolve())}
        />
      )}
    </>
  );
}
