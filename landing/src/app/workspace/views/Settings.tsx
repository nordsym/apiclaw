"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CONVEX_URL, Workspace } from "../_shared";
import { PageHeader, Section, Panel, SurfaceTabs, Row, Status, Empty, KV, Field, Loading, inputClass, btnSolid, btnQuiet, btnDanger } from "./ui";

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

/* Routing mode ids must match the validModes list in convex/workspaceSettings.ts. */
const ROUTING_MODES = [
  { id: "balanced", label: "Balanced", desc: "Direct providers first, OpenRouter when none match." },
  { id: "best_price", label: "Best price", desc: "Cheapest route for each model." },
  { id: "fastest", label: "Fastest", desc: "Lowest latency from healthy direct routes." },
  { id: "highest_quality", label: "Highest quality", desc: "Prefer OpenRouter over direct routes." },
  { id: "advisor", label: "Advisor", desc: "Picks a model per prompt when the request sets none." },
];

const GATEWAY_DEFAULT_MODEL = "anthropic/claude-sonnet-4-6";

interface CatalogModel {
  id: string;
  name: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

function WorkspaceSection({ workspace, sessionToken, onWorkspaceUpdate }: { workspace: Workspace | null; sessionToken: string | null; onWorkspaceUpdate?: (patch: Partial<Workspace>) => void }) {
  const [name, setName] = useState(workspace?.workspaceName || "");
  const [state, setState] = useState<SaveState>("idle");

  useEffect(() => {
    setName(workspace?.workspaceName || "");
  }, [workspace?.workspaceName]);

  const trimmed = name.trim();
  const dirty = trimmed !== (workspace?.workspaceName || "");

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!trimmed || !sessionToken || state === "saving") return;
    setState("saving");
    try {
      const response = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "workspaces:updateWorkspaceName", args: { token: sessionToken, name: trimmed } }),
      });
      const result = await response.json();
      if (!response.ok || result.status === "error") throw new Error(result.errorMessage || "Save failed");
      onWorkspaceUpdate?.({ workspaceName: trimmed });
      setState("saved");
    } catch {
      setState("error");
    }
  };

  return (
    <Section title="Workspace">
      <form onSubmit={save} className="max-w-[32rem] space-y-4">
        <Field label="Name" hint="Shown in the sidebar instead of your email.">
          <input
            type="text"
            value={name}
            maxLength={100}
            onChange={(e) => { setName(e.target.value); if (state !== "saving") setState("idle"); }}
            placeholder="Team or company name"
            className={inputClass}
          />
        </Field>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={!trimmed || !dirty || state === "saving"} className={`${btnSolid} disabled:opacity-50`}>
            {state === "saving" ? "Saving…" : "Save name"}
          </button>
          {state === "saved" && <span className="text-[12.5px] text-[var(--ok)]">Saved</span>}
          {state === "error" && <span className="text-[12.5px] text-[var(--accent)]">Could not save</span>}
        </div>
      </form>
      <div className="mt-6 max-w-[32rem]">
        <KV k="Email" v={workspace?.email || ""} />
      </div>
    </Section>
  );
}

/** Parse a comma-separated provider id list into a clean, deduped array. */
function parseProviderList(input: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of input.split(",")) {
    const id = raw.trim().toLowerCase();
    if (id && !seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
}

function ModelRoutingSection({ sessionToken }: { sessionToken: string | null }) {
  const [routingMode, setRoutingMode] = useState("balanced");
  const [defaultModel, setDefaultModel] = useState("");
  const [allowFallback, setAllowFallback] = useState(true);
  const [preferredProvidersInput, setPreferredProvidersInput] = useState("");
  const [blockedProvidersInput, setBlockedProvidersInput] = useState("");
  const [catalog, setCatalog] = useState<CatalogModel[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [state, setState] = useState<SaveState>("idle");

  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;
    fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "workspaceSettings:get", args: { token: sessionToken } }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.status === "error") throw new Error(data.errorMessage || "Settings unavailable");
        return data.value || data;
      })
      .then((settings) => {
        if (cancelled) return;
        const mode = ROUTING_MODES.some((m) => m.id === settings?.routingMode) ? settings.routingMode : "balanced";
        setRoutingMode(mode);
        setDefaultModel(settings?.defaultModel || "");
        setAllowFallback(settings?.allowOpenRouterFallback !== false);
        setPreferredProvidersInput(((settings?.preferredProviders as string[] | undefined) || []).join(", "));
        setBlockedProvidersInput(((settings?.blockedProviders as string[] | undefined) || []).join(", "));
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => { cancelled = true; };
  }, [sessionToken]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/models")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { models?: CatalogModel[] }) => {
        if (cancelled) return;
        const models = (d.models || []).filter((m) => m && typeof m.id === "string");
        setCatalog([...models].sort((a, b) => a.id.localeCompare(b.id)));
      })
      .catch(() => { if (!cancelled) setCatalog([]); });
    return () => { cancelled = true; };
  }, []);

  const save = async () => {
    if (!sessionToken || !loaded || state === "saving") return;
    setState("saving");
    try {
      const response = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "workspaceSettings:upsert",
          args: {
            token: sessionToken,
            routingMode,
            defaultModel: defaultModel || null,
            allowOpenRouterFallback: allowFallback,
            preferredProviders: parseProviderList(preferredProvidersInput),
            blockedProviders: parseProviderList(blockedProvidersInput),
          },
        }),
      });
      const result = await response.json();
      if (!response.ok || result.status === "error") throw new Error(result.errorMessage || "Save failed");
      setState("saved");
    } catch {
      setState("error");
    }
  };

  const touch = () => { if (state !== "saving") setState("idle"); };
  const activeMode = ROUTING_MODES.find((m) => m.id === routingMode) || ROUTING_MODES[0];
  const modelInCatalog = !defaultModel || catalog.some((m) => m.id === defaultModel);

  return (
    <Section title="Model routing" description="Applies to callable LLM calls that do not set a model or route. Override per request with the X-APIClaw-Route header.">
      {loadError ? (
        <p className="py-6 text-[13px] text-[var(--accent)]">Could not load routing settings. Reload to try again.</p>
      ) : !loaded ? (
        <Loading label="Loading routing settings" />
      ) : (
        <div className="max-w-[32rem] space-y-6">
          <div>
            <span className="mb-1.5 block text-[13px] text-[var(--text-muted)]">Routing mode</span>
            <SurfaceTabs label="Routing mode" items={ROUTING_MODES} active={routingMode} onChange={(id) => { setRoutingMode(id); touch(); }} />
            <p className="mt-2 text-[12.5px] text-[var(--text-muted)]">{activeMode.desc}</p>
          </div>

          <Field label="Default model" hint={`Used when the request sets no model. Gateway default is ${GATEWAY_DEFAULT_MODEL}.`}>
            <select value={defaultModel} onChange={(e) => { setDefaultModel(e.target.value); touch(); }} className={inputClass}>
              <option value="">Gateway default</option>
              {!modelInCatalog && <option value={defaultModel}>{defaultModel}</option>}
              {catalog.map((m) => (
                <option key={m.id} value={m.id}>{m.id}{m.name && m.name !== m.id ? ` (${m.name})` : ""}</option>
              ))}
            </select>
          </Field>

          <label className="flex items-start gap-3 border-t border-[var(--border-subtle)] py-3.5">
            <input
              type="checkbox"
              checked={allowFallback}
              onChange={(e) => { setAllowFallback(e.target.checked); touch(); }}
              className="mt-[3px] h-4 w-4 accent-[var(--text-primary)]"
            />
            <span>
              <span className="block text-[14px]">Allow OpenRouter fallback</span>
              <span className="mt-0.5 block text-[12.5px] text-[var(--text-muted)]">Route through OpenRouter when no direct provider matches the model.</span>
            </span>
          </label>

          <div className="border-t border-[var(--border-subtle)] pt-4">
            <span className="mb-1.5 block text-[13px] text-[var(--text-muted)]">Routing</span>
            <div className="space-y-4">
              <Field label="Preferred providers" hint="Comma-separated provider ids, tried first in this order (e.g. groq, mistral).">
                <input
                  type="text"
                  value={preferredProvidersInput}
                  onChange={(e) => { setPreferredProvidersInput(e.target.value); touch(); }}
                  placeholder="groq, mistral"
                  className={inputClass}
                />
              </Field>
              <Field label="Blocked providers" hint="Comma-separated provider ids that routing must never use (e.g. together).">
                <input
                  type="text"
                  value={blockedProvidersInput}
                  onChange={(e) => { setBlockedProvidersInput(e.target.value); touch(); }}
                  placeholder="together"
                  className={inputClass}
                />
              </Field>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={save} disabled={state === "saving"} className={`${btnSolid} disabled:opacity-50`}>
              {state === "saving" ? "Saving…" : "Save routing"}
            </button>
            {state === "saved" && <span className="text-[12.5px] text-[var(--ok)]">Saved</span>}
            {state === "error" && <span className="text-[12.5px] text-[var(--accent)]">Could not save</span>}
          </div>
        </div>
      )}
    </Section>
  );
}

/* ------------------------------------------------------------------
   API keys: for tools outside an MCP client (OpenClaw, n8n, scripts).
   Moved here from the former Connections tab (2026-08-24 restructure).
   ------------------------------------------------------------------ */

interface ApiKeyRow {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: number;
  createdAt: number;
}

function APIKeysSection({ sessionToken }: { sessionToken: string | null }) {
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
    <>
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

      <Section title="Use a key" className="mt-8">
        <KV k="Base URL" v="https://api.apiclaw.cloud/v1" mono />
        <KV k="Header" v="Authorization: Bearer sk-claw-..." mono />
      </Section>
    </>
  );
}

/* ------------------------------------------------------------------
   Your keys (BYOK). An APIClaw key (above) authenticates a client into
   the gateway. A provider key here is the workspace's own credential
   for an upstream provider (OpenAI, Anthropic, ...). Calls that use it
   are free: no card, no markup, the provider bills the workspace
   directly. Kept quiet: this is an escape hatch, not the main path.
   ------------------------------------------------------------------ */

interface ProviderKeyRow {
  id: string;
  provider: string;
  keyHint: string;
  isCustom?: boolean;
  customConfig?: { baseUrl: string; authType: string };
  createdAt: number;
  updatedAt: number;
}

function YourKeysSection({ sessionToken }: { sessionToken: string | null }) {
  const [keys, setKeys] = useState<ProviderKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [provider, setProvider] = useState("");
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const confirm = useArmed();

  const fetchKeys = useCallback(async () => {
    if (!sessionToken) { setLoading(false); return; }
    try {
      const res = await convexCall<ProviderKeyRow[]>("query", "providerKeys:listKeys", { token: sessionToken });
      setKeys(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load keys");
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const add = async () => {
    const p = provider.trim().toLowerCase();
    const k = key.trim();
    if (!sessionToken || !p || !k) return;
    setSaving(true);
    setError(null);
    try {
      await convexCall("mutation", "providerKeys:setKey", { token: sessionToken, provider: p, key: k });
      setProvider("");
      setKey("");
      setShowAdd(false);
      fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save key");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (providerName: string) => {
    if (!sessionToken) return;
    if (confirm.armed !== providerName) { confirm.arm(providerName); return; }
    confirm.disarm();
    setRemoving(providerName);
    try {
      await convexCall("mutation", "providerKeys:removeKey", { token: sessionToken, provider: providerName });
      setKeys((prev) => prev.filter((row) => row.provider !== providerName));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Section
      title="Your keys"
      description="Optional. If you already have a provider key, calls through it are free."
      action={!showAdd ? <button type="button" onClick={() => setShowAdd(true)} className={btnQuiet}>Add key</button> : undefined}
    >
      {showAdd && (
        <Panel className="mb-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Provider" hint="e.g. openai, anthropic, groq">
              <input type="text" value={provider} onChange={(e) => setProvider(e.target.value)} className={`${inputClass} claw-mono`} maxLength={40} autoFocus />
            </Field>
            <Field label="Your key">
              <input type="password" value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className={`${inputClass} claw-mono`} maxLength={400} autoComplete="off" />
            </Field>
          </div>
          {error && <p className="mt-3 text-[13px] text-[var(--accent)]">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={add} disabled={saving || !provider.trim() || !key.trim()} className={btnSolid}>{saving ? "Saving" : "Save key"}</button>
            <button type="button" onClick={() => { setShowAdd(false); setError(null); }} className={btnQuiet}>Cancel</button>
          </div>
        </Panel>
      )}
      {!showAdd && error && <p className="mb-3 text-[13px] text-[var(--accent)]">{error}</p>}

      {loading ? (
        <Loading label="Loading keys" />
      ) : keys.length === 0 ? (
        <Empty
          title="No keys of your own yet"
          body="Add a provider key to route that provider's calls through it, free."
          action={!showAdd ? <button type="button" onClick={() => setShowAdd(true)} className={btnQuiet}>Add key</button> : undefined}
        />
      ) : (
        <div>
          {keys.map((row) => (
            <Row
              key={row.id}
              right={<>
                <button type="button" onClick={() => remove(row.provider)} disabled={removing === row.provider} className={`${btnDanger} !h-8`}>
                  {removing === row.provider ? "Removing" : confirm.armed === row.provider ? "Confirm remove" : "Remove"}
                </button>
              </>}
            >
              <p className="truncate text-[14px]">{row.provider}</p>
              <p className="claw-mono truncate text-[12px] text-[var(--text-muted)]">Your key · ending {row.keyHint}</p>
            </Row>
          ))}
        </div>
      )}
    </Section>
  );
}

export function SettingsTab({ workspace, sessionToken, onWorkspaceUpdate }: { workspace: Workspace | null; sessionToken: string | null; onWorkspaceUpdate?: (patch: Partial<Workspace>) => void }) {
  return (
    <div className="space-y-10">
      <PageHeader title="Settings" description="Workspace name, routing, and keys." />
      <WorkspaceSection workspace={workspace} sessionToken={sessionToken} onWorkspaceUpdate={onWorkspaceUpdate} />
      <ModelRoutingSection sessionToken={sessionToken} />
      <APIKeysSection sessionToken={sessionToken} />
      <YourKeysSection sessionToken={sessionToken} />
    </div>
  );
}
