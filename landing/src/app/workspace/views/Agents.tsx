"use client";

/**
 * Agents: the default workspace view (2026-08-24 restructure). Buzz-style
 * card grid for connected MCP-client agents (AgentCardGrid, its own
 * detail side panel), a slim usage strip, an optional quiet next-step
 * card, and the main agent + subagents section folded in below since
 * their data shape differs from the card grid (no fingerprint session,
 * no model rail switcher parity). Everything here maps to real data;
 * nothing is decorative (INSPO BOUNDARY, BYOH-BUILD-PLAN.md Phase 2).
 */
import { useEffect, useState, useRef } from "react";
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
  inputClass,
  btnSolid,
  btnQuiet,
  btnDanger,
} from "./ui";
import { AgentCardGrid } from "./AgentCards";

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
   Main agent + subagents. Distinct shape from the card grid: the main
   agent is the single workspace-token identity, subagents are task
   agents identified by the X-APIClaw-Subagent header. Neither carries
   a fingerprint session or model-rail switcher, so they render as a
   plain list below the card grid rather than as cards.
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

function MainAgentAndSubagents({ sessionToken }: { sessionToken: string | null }) {
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

  if (loading) return null;
  if (!mainAgent?.mainAgentId && subagents.length === 0) return null;

  return (
    <>
      {error && <p className="mb-4 text-[13px] text-[var(--accent)]">{error}</p>}

      {mainAgent?.mainAgentId && (
        <Section title="Main agent" className="mt-8">
          <Row right={<span>{(mainAgent.usageCount ?? 0).toLocaleString()} calls</span>}>
            <InlineName value={mainAgent.mainAgentName || ""} fallback="Main agent" onSave={renameMain} />
            <p className="claw-mono truncate text-[12px] text-[var(--text-muted)]">
              {mainAgent.mainAgentId}{mainAgent.aiBackend ? ` · custom:${mainAgent.aiBackend}` : ""}
            </p>
          </Row>
        </Section>
      )}

      {subagents.length > 0 && (
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
      )}
    </>
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
   Connect an agent: a quiet pointer to Remote MCP, moved here from
   Settings (2026-08-24) so the endpoint sits next to the agents it
   connects. Full connector management (presets, OAuth registration)
   stays at /workspace/integrations; this is signal, not a rebuild.
   ------------------------------------------------------------------ */

function ConnectAgentSection() {
  return (
    <Section title="Connect an agent" description="Hosted clients connect over HTTP with workspace sign-in." className="mt-8">
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
          onEmpty={
            <Empty
              title="No agents connected"
              body="Run this in any MCP client signed in to this workspace."
              action={<div className="w-full max-w-[34rem]"><CopyLine text={INSTALL_LINE} /></div>}
            />
          }
        />
      </Section>

      <ConnectAgentSection />

      <MainAgentAndSubagents sessionToken={sessionToken ?? null} />
    </div>
  );
}
