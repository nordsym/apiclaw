"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CONVEX_URL, Workspace } from "../_shared";
import { PageHeader, Section, SurfaceTabs, KV, Field, Loading, inputClass, btnSolid } from "./ui";

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
    <Section title="Model routing" description="Applies to managed LLM calls that do not set a model or route. Override per request with the X-APIClaw-Route header.">
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

export function SettingsTab({ workspace, sessionToken, onWorkspaceUpdate }: { workspace: Workspace | null; sessionToken: string | null; onWorkspaceUpdate?: (patch: Partial<Workspace>) => void }) {
  return (
    <div className="space-y-10">
      <PageHeader title="Settings" description="Workspace name and how managed LLM calls are routed." />
      <WorkspaceSection workspace={workspace} sessionToken={sessionToken} onWorkspaceUpdate={onWorkspaceUpdate} />
      <ModelRoutingSection sessionToken={sessionToken} />
    </div>
  );
}
