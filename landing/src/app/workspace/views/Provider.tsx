"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CONVEX_URL, Workspace, UsageData, ProviderAPI } from "../_shared";
import {
  PageHeader,
  Section,
  Panel,
  SurfaceTabs,
  StatCard,
  StatGrid,
  Row,
  Status,
  Empty,
  Loading,
  KV,
  Field,
  inputClass,
  textareaClass,
  btnSolid,
  btnQuiet,
  btnDanger,
} from "./ui";

/* ------------------------------------------------------------------
   Provider console: the API-owner side of the workspace.
   My APIs        = hairline rows, each expands to routing config + actions.
   Inbound        = traffic agents send to the APIs listed here.
   ------------------------------------------------------------------ */

type ConsoleSection = "apis" | "analytics";

async function convexQuery<T>(path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  const data = await res.json();
  if (!res.ok || data.status === "error") throw new Error(data.errorMessage || "Request failed");
  return (data.value ?? null) as T;
}

async function convexMutation<T>(path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  const data = await res.json();
  if (!res.ok || data.status === "error") throw new Error(data.errorMessage || "Request failed");
  return (data.value ?? null) as T;
}

function errorText(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Listing status word. `status` is the providerAPIs.status field; "blocked" is
    written by the backend for upstream subscription blocks, so no local name list. */
function apiStatus(status: string): { kind: "ok" | "warn" | "bad" | "muted"; label: string } {
  if (status === "approved") return { kind: "ok", label: "Live" };
  if (status === "blocked") return { kind: "bad", label: "Blocked upstream" };
  if (status === "rate_limited") return { kind: "warn", label: "Rate limited" };
  if (status === "pending" || status === "active") return { kind: "warn", label: "Pending review" };
  if (status === "paused") return { kind: "muted", label: "Paused" };
  return { kind: "muted", label: status };
}

export function ProviderConsoleTab({
  apis,
  sessionToken,
  showAddApi,
  setShowAddApi,
}: {
  apis: ProviderAPI[];
  workspace: Workspace | null;
  usage: UsageData | null;
  sessionToken: string | null;
  providerId: string | null;
  showAddApi: boolean;
  setShowAddApi: (show: boolean) => void;
}) {
  const searchParams = useSearchParams();
  const subFromUrl = searchParams?.get("sub");
  const apiFromUrl = searchParams?.get("api") || null;
  const [section, setSection] = useState<ConsoleSection>(subFromUrl === "analytics" ? "analytics" : "apis");

  useEffect(() => {
    if (subFromUrl === "add") setShowAddApi(true);
    // Only on mount: the URL seeds the initial state, the user owns it afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="Provider console"
        description="APIs you publish and the agent traffic they receive."
        action={
          !showAddApi && (
            <button type="button" className={btnSolid} onClick={() => { setSection("apis"); setShowAddApi(true); }}>
              Add API
            </button>
          )
        }
      />
      <div className="mb-6">
        <SurfaceTabs
          items={[
            { id: "apis", label: "My APIs" },
            { id: "analytics", label: "Inbound analytics" },
          ]}
          active={section}
          onChange={(id) => setSection(id as ConsoleSection)}
        />
      </div>
      {section === "apis" && (
        <MyAPIs
          apis={apis}
          sessionToken={sessionToken}
          showAddForm={showAddApi}
          onOpenForm={() => setShowAddApi(true)}
          onCloseForm={() => setShowAddApi(false)}
          initialOpenId={apiFromUrl}
        />
      )}
      {section === "analytics" && <InboundAnalytics apis={apis} sessionToken={sessionToken} onAdd={() => { setSection("apis"); setShowAddApi(true); }} />}
    </div>
  );
}

/* ------------------------------------------------------------------
   My APIs
   ------------------------------------------------------------------ */

const CATEGORIES = ["DevTools", "Finance", "Geolocation", "News", "Transport", "AI & LLM", "Email", "SMS", "Search", "Payments", "Auth", "Weather", "Maps", "Other"];

function MyAPIs({
  apis,
  sessionToken,
  showAddForm,
  onOpenForm,
  onCloseForm,
  initialOpenId,
}: {
  apis: ProviderAPI[];
  sessionToken: string | null;
  showAddForm: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
  initialOpenId: string | null;
}) {
  const [openId, setOpenId] = useState<string | null>(initialOpenId);

  if (showAddForm) {
    return <AddApiForm sessionToken={sessionToken} onClose={onCloseForm} />;
  }

  if (apis.length === 0) {
    return (
      <Section>
        <Empty
          title="No APIs listed"
          body="Add an API and agents can discover it in the catalog."
          action={<button type="button" className={btnSolid} onClick={onOpenForm}>Add API</button>}
        />
      </Section>
    );
  }

  return (
    <Section title="My APIs" description={`${apis.length} listed`}>
      {apis.map((api) => {
        const open = openId === api._id;
        const st = apiStatus(api.status);
        const discoveries = api.discoveryCount || 0;
        return (
          <div key={api._id}>
            <Row onClick={() => setOpenId(open ? null : api._id)} right={<><span>{discoveries} {discoveries === 1 ? "discovery" : "discoveries"}</span><Status kind={st.kind}>{st.label}</Status></>}>
              <p className="truncate text-[14.5px] font-medium">{api.name}</p>
              <p className="mt-0.5 truncate text-[13px] text-[var(--text-muted)]">{api.category}{api.description ? <span className="hidden sm:inline"> · {api.description}</span> : null}</p>
            </Row>
            {open && <ApiDetail api={api} sessionToken={sessionToken} />}
          </div>
        );
      })}
    </Section>
  );
}

function AddApiForm({ sessionToken, onClose }: { sessionToken: string | null; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", description: "", category: "DevTools", openApiUrl: "", docsUrl: "", pricingModel: "freemium" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    if (!submitted) return;
    // The parent owns the API list; reload so it refetches the provider console.
    const t = setTimeout(() => { onClose(); window.location.reload(); }, 1200);
    return () => clearTimeout(t);
  }, [submitted, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) return;
    if (!sessionToken) { setError("No workspace session. Sign in again."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await convexMutation("providers:createForWorkspace", {
        token: sessionToken,
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        pricingModel: form.pricingModel,
        openApiUrl: form.openApiUrl.trim() || undefined,
        docsUrl: form.docsUrl.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(errorText(err, "Could not add the API"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section title="Add API" description="Listed APIs are searchable by agents once reviewed.">
      <Panel className="p-6">
        {submitted ? (
          <p className="text-[14px]">Listed. Reloading.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Name">
              <input className={inputClass} value={form.name} onChange={set("name")} placeholder="Exchange Rates" required />
            </Field>
            <Field label="Description" hint="One sentence on what the API returns.">
              <textarea className={textareaClass} rows={2} value={form.description} onChange={set("description")} placeholder="Live and historical currency rates for 170 currencies." required />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Category">
                <select className={inputClass} value={form.category} onChange={set("category")}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Pricing">
                <select className={inputClass} value={form.pricingModel} onChange={set("pricingModel")}>
                  <option value="free">Free</option>
                  <option value="freemium">Freemium</option>
                  <option value="paid">Paid</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="OpenAPI spec URL" hint="Optional.">
                <input className={inputClass} type="url" value={form.openApiUrl} onChange={set("openApiUrl")} placeholder="https://" />
              </Field>
              <Field label="Docs URL" hint="Optional.">
                <input className={inputClass} type="url" value={form.docsUrl} onChange={set("docsUrl")} placeholder="https://" />
              </Field>
            </div>
            {error && <p className="text-[13px] text-[var(--accent)]">{error}</p>}
            <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] pt-5">
              <button type="button" className={btnQuiet} onClick={onClose}>Cancel</button>
              <button type="submit" className={`${btnSolid} disabled:opacity-50`} disabled={submitting || !form.name.trim() || !form.description.trim()}>
                {submitting ? "Adding" : "Add API"}
              </button>
            </div>
          </form>
        )}
      </Panel>
    </Section>
  );
}

/* ------------------------------------------------------------------
   API detail: managed routing config + actions
   ------------------------------------------------------------------ */

interface RoutingConfig {
  _id: string;
  baseUrl?: string;
  authType?: string;
  authHeader?: string;
  authPrefix?: string;
  rateLimitPerUser?: number;
  rateLimitPerDay?: number;
  pricePerRequest?: number;
  status?: string;
  allowCustomerKeys?: boolean;
  requireCustomerKeys?: boolean;
  hasCredential?: boolean;
}

interface RoutingAction {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  method: string;
  path: string;
  enabled: boolean;
}

const EMPTY_CONFIG = { baseUrl: "", authType: "bearer", authHeader: "Authorization", authPrefix: "Bearer ", rateLimitPerUser: 60, rateLimitPerDay: 1000, pricePerRequest: 0, status: "draft", allowCustomerKeys: true, requireCustomerKeys: false };

const AUTH_LABEL: Record<string, string> = { bearer: "Bearer token", api_key: "API key header", basic: "Basic auth", none: "No auth" };

function ApiDetail({ api, sessionToken }: { api: ProviderAPI; sessionToken: string | null }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const [operatedByApiclaw, setOperatedByApiclaw] = useState(false);
  const [hasCredential, setHasCredential] = useState(false);
  const [actions, setActions] = useState<RoutingAction[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showAddAction, setShowAddAction] = useState(false);
  const [actionForm, setActionForm] = useState({ name: "", displayName: "", description: "", method: "GET", path: "" });
  const [actionSaving, setActionSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadActions = useCallback(async (directCallId: string) => {
    const list = await convexQuery<RoutingAction[] | null>("directCall:getActions", { directCallId });
    setActions(Array.isArray(list) ? list : []);
  }, []);

  const load = useCallback(async () => {
    if (!sessionToken) { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    try {
      const cfg = await convexQuery<RoutingConfig | null>("managedRouting:getOwnerConfigByApiId", { token: sessionToken, apiId: api._id });
      if (cfg) {
        setConfigId(cfg._id);
        setConfig({
          baseUrl: cfg.baseUrl || "",
          authType: cfg.authType || "bearer",
          authHeader: cfg.authHeader || "Authorization",
          authPrefix: cfg.authPrefix ?? "Bearer ",
          rateLimitPerUser: cfg.rateLimitPerUser || 60,
          rateLimitPerDay: cfg.rateLimitPerDay || 1000,
          pricePerRequest: cfg.pricePerRequest || 0,
          status: cfg.status || "draft",
          allowCustomerKeys: cfg.allowCustomerKeys ?? true,
          requireCustomerKeys: cfg.requireCustomerKeys ?? false,
        });
        // Once APIClaw operations publish a config or hold its credential, the
        // owner form would only downgrade it (saveConfig forces draft/testing).
        setOperatedByApiclaw(cfg.status === "live" || Boolean(cfg.hasCredential));
        setHasCredential(Boolean(cfg.hasCredential));
        await loadActions(cfg._id);
      } else {
        setConfigId(null);
        setConfig(EMPTY_CONFIG);
        setOperatedByApiclaw(false);
        setHasCredential(false);
        setActions([]);
      }
    } catch (err) {
      setLoadError(errorText(err, "Could not load routing config"));
    } finally {
      setLoading(false);
    }
  }, [api._id, sessionToken, loadActions]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (saveState !== "saved") return;
    const t = setTimeout(() => setSaveState("idle"), 3000);
    return () => clearTimeout(t);
  }, [saveState]);

  const saveConfig = async () => {
    if (!sessionToken) return;
    setSaving(true);
    setSaveError(null);
    try {
      await convexMutation("managedRouting:saveConfig", { token: sessionToken, config: { ...config, apiId: api._id } });
      setSaveState("saved");
      await load();
    } catch (err) {
      setSaveState("error");
      setSaveError(errorText(err, "Could not save routing config"));
    } finally {
      setSaving(false);
    }
  };

  const saveAction = async () => {
    if (!configId || !sessionToken) return;
    setActionSaving(true);
    setActionError(null);
    try {
      await convexMutation("managedRouting:saveAction", {
        token: sessionToken,
        directCallId: configId,
        name: actionForm.name.trim(),
        displayName: actionForm.displayName.trim() || actionForm.name.trim(),
        description: actionForm.description.trim(),
        method: actionForm.method,
        path: actionForm.path.trim(),
        params: [],
        responseMapping: [],
        enabled: true,
      });
      setActionForm({ name: "", displayName: "", description: "", method: "GET", path: "" });
      setShowAddAction(false);
      await loadActions(configId);
    } catch (err) {
      setActionError(errorText(err, "Could not add action"));
    } finally {
      setActionSaving(false);
    }
  };

  const deleteAction = async (action: RoutingAction) => {
    if (!sessionToken || !configId) return;
    if (!window.confirm(`Remove action ${action.name}? Agents will no longer be able to call it.`)) return;
    setActionError(null);
    try {
      await convexMutation("managedRouting:deleteAction", { id: action._id, token: sessionToken });
      await loadActions(configId);
    } catch (err) {
      setActionError(errorText(err, "Could not remove action"));
    }
  };

  if (loading) return <div className="pb-4"><Loading label="Loading routing config" /></div>;
  if (loadError) return <p className="py-4 text-[13px] text-[var(--accent)]">{loadError}</p>;

  const set = (key: keyof typeof EMPTY_CONFIG, value: string | number) => setConfig((c) => ({ ...c, [key]: value }));

  return (
    <div className="pb-6 pl-0 sm:pl-4">
      <div className="mb-6">
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <h3 className="text-[13.5px] font-semibold">Call routing</h3>
          {configId && <Status kind={config.status === "live" ? "ok" : "muted"}>{config.status === "live" ? "Live" : config.status === "testing" ? "Testing" : "Draft"}</Status>}
        </div>
        {operatedByApiclaw ? (
          <div>
            <p className="mb-2 text-[13px] text-[var(--text-muted)]">Operated by APIClaw. Routing and credentials are maintained server-side.</p>
            <KV k="Endpoint" v={config.baseUrl || "Not set"} mono />
            <KV k="Auth" v={AUTH_LABEL[config.authType] || config.authType} />
            <KV k="Rate limit" v={`${config.rateLimitPerUser}/min per caller, ${config.rateLimitPerDay}/day`} />
            <KV k="Credential" v={hasCredential ? "Held by APIClaw" : "Not set"} />
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-[13px] text-[var(--text-muted)]">Set the public endpoint agents are routed to. Provider credentials are added by APIClaw after review and never pass through this browser.</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Base URL">
                <input className={`${inputClass} claw-mono !text-[13px]`} type="url" value={config.baseUrl} onChange={(e) => set("baseUrl", e.target.value)} placeholder="https://api.example.com" />
              </Field>
              <Field label="Auth type">
                <select className={inputClass} value={config.authType} onChange={(e) => set("authType", e.target.value)}>
                  <option value="bearer">Bearer token</option>
                  <option value="api_key">API key header</option>
                  <option value="basic">Basic auth</option>
                  <option value="none">No auth</option>
                </select>
              </Field>
              {config.authType !== "none" && (
                <>
                  <Field label="Auth header">
                    <input className={`${inputClass} claw-mono !text-[13px]`} value={config.authHeader} onChange={(e) => set("authHeader", e.target.value)} placeholder="Authorization" />
                  </Field>
                  <Field label="Auth prefix" hint="Text placed before the credential, if any.">
                    <input className={`${inputClass} claw-mono !text-[13px]`} value={config.authPrefix} onChange={(e) => set("authPrefix", e.target.value)} placeholder="Bearer " />
                  </Field>
                </>
              )}
              <Field label="Rate limit per caller, per minute">
                <input className={inputClass} type="number" min={1} value={config.rateLimitPerUser} onChange={(e) => set("rateLimitPerUser", Math.max(1, Number(e.target.value) || 1))} />
              </Field>
              <Field label="Rate limit per caller, per day">
                <input className={inputClass} type="number" min={1} value={config.rateLimitPerDay} onChange={(e) => set("rateLimitPerDay", Math.max(1, Number(e.target.value) || 1))} />
              </Field>
              <Field label="Status" hint="Going live is done by APIClaw after review.">
                <select className={inputClass} value={config.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="testing">Testing</option>
                </select>
              </Field>
              <Field label="Credential">
                <div className={`${inputClass} flex items-center text-[var(--text-muted)]`}>{hasCredential ? "Held by APIClaw" : "Added by APIClaw after review"}</div>
              </Field>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className={`${btnSolid} disabled:opacity-50`} onClick={saveConfig} disabled={saving || !config.baseUrl.trim()}>
                {saving ? "Saving" : "Save routing"}
              </button>
              {saveState === "saved" && <span className="text-[13px] text-[var(--ok)]">Saved</span>}
              {saveState === "error" && saveError && <span className="text-[13px] text-[var(--accent)]">{saveError}</span>}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <h3 className="text-[13.5px] font-semibold">Actions <span className="font-normal text-[var(--text-muted)]">{actions.length}</span></h3>
          {configId && !operatedByApiclaw && !showAddAction && (
            <button type="button" className={btnQuiet} onClick={() => setShowAddAction(true)}>Add action</button>
          )}
        </div>
        {!configId && <p className="text-[13px] text-[var(--text-muted)]">Save routing first. Actions define the endpoints agents can call.</p>}
        {showAddAction && (
          <div className="space-y-4 border-t border-[var(--border-subtle)] py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Action name" hint="Machine name, lowercase with underscores.">
                <input className={`${inputClass} claw-mono !text-[13px]`} value={actionForm.name} onChange={(e) => setActionForm((p) => ({ ...p, name: e.target.value }))} placeholder="get_forecast" />
              </Field>
              <Field label="Display name">
                <input className={inputClass} value={actionForm.displayName} onChange={(e) => setActionForm((p) => ({ ...p, displayName: e.target.value }))} placeholder="Get forecast" />
              </Field>
              <Field label="Method">
                <select className={inputClass} value={actionForm.method} onChange={(e) => setActionForm((p) => ({ ...p, method: e.target.value }))}>
                  {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Path">
                <input className={`${inputClass} claw-mono !text-[13px]`} value={actionForm.path} onChange={(e) => setActionForm((p) => ({ ...p, path: e.target.value }))} placeholder="/v1/forecast" />
              </Field>
            </div>
            <Field label="Description" hint="What agents read when choosing this action.">
              <input className={inputClass} value={actionForm.description} onChange={(e) => setActionForm((p) => ({ ...p, description: e.target.value }))} placeholder="Hourly forecast for a city" />
            </Field>
            {actionError && <p className="text-[13px] text-[var(--accent)]">{actionError}</p>}
            <div className="flex gap-2">
              <button type="button" className={`${btnSolid} disabled:opacity-50`} onClick={saveAction} disabled={actionSaving || !actionForm.name.trim() || !actionForm.path.trim()}>{actionSaving ? "Adding" : "Add action"}</button>
              <button type="button" className={btnQuiet} onClick={() => { setShowAddAction(false); setActionError(null); }}>Cancel</button>
            </div>
          </div>
        )}
        {!showAddAction && actionError && <p className="py-2 text-[13px] text-[var(--accent)]">{actionError}</p>}
        {configId && actions.length === 0 && !showAddAction && (
          <p className="border-t border-[var(--border-subtle)] py-4 text-[13px] text-[var(--text-muted)]">No actions yet.</p>
        )}
        {actions.map((action) => (
          <Row
            key={action._id}
            right={
              <>
                {!action.enabled && <Status kind="muted">Disabled</Status>}
                {!operatedByApiclaw && (
                  <button type="button" className={btnDanger} onClick={() => deleteAction(action)}>Remove</button>
                )}
              </>
            }
          >
            <p className="truncate text-[14px]"><span className="claw-mono text-[12.5px] text-[var(--text-muted)]">{action.method}</span> <span className="font-medium">{action.displayName || action.name}</span></p>
            <p className="mt-0.5 truncate claw-mono text-[12.5px] text-[var(--text-muted)]">{action.path}{action.description ? <span className="font-sans"> · {action.description}</span> : null}</p>
          </Row>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Inbound analytics (logs:getProviderAnalytics, direction=inbound)
   ------------------------------------------------------------------ */

interface InboundAnalyticsData {
  totalCalls: number;
  totalDiscoveries: number;
  inboundCalls: number;
  uniqueCallers: number;
  byDay: { date: string; calls: number; searches: number }[];
  byAction: { action: string; calls: number; success: number; type: string }[];
  byCaller?: { callerKey: string; calls: number; errors: number; lastCallAt: number }[];
  successRate: number;
  avgLatency: number;
}

const RANGES: Array<{ id: string; label: string; hours: number }> = [
  { id: "7d", label: "7d", hours: 168 },
  { id: "30d", label: "30d", hours: 720 },
  { id: "90d", label: "90d", hours: 2160 },
  { id: "all", label: "All", hours: 87600 },
];

const tooltipStyle = { background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" };

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function InboundAnalytics({ apis, sessionToken, onAdd }: { apis: ProviderAPI[]; sessionToken: string | null; onAdd: () => void }) {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<InboundAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionToken) { setLoading(false); return; }
    let cancelled = false;
    const hours = RANGES.find((r) => r.id === range)?.hours ?? 168;
    setLoading(true);
    convexQuery<InboundAnalyticsData | null>("logs:getProviderAnalytics", { token: sessionToken, hoursBack: hours, direction: "inbound" })
      .then((result) => { if (!cancelled) { setData(result); setError(null); } })
      .catch((err) => { if (!cancelled) setError(errorText(err, "Could not load analytics")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sessionToken, range]);

  const calls = data?.totalCalls ?? 0;
  const discoveries = data?.totalDiscoveries ?? 0;
  const byDay = Array.isArray(data?.byDay) ? data!.byDay : [];
  const byAction = Array.isArray(data?.byAction) ? data!.byAction : [];
  const topCalls = byAction.filter((a) => a.type === "call").slice(0, 8);
  const topSearches = byAction.filter((a) => a.type === "discovery").map((a) => ({ ...a, action: a.action.replace(/^Search: /, "") })).slice(0, 8);
  const byCaller = Array.isArray(data?.byCaller) ? data!.byCaller : [];
  const hasTraffic = calls > 0 || discoveries > 0;

  return (
    <div className="space-y-8">
      <Section
        title="Inbound traffic"
        description="Calls and catalog discoveries that reached your APIs."
      >
        <div className="mb-5">
          <SurfaceTabs label="Range" items={RANGES.map((r) => ({ id: r.id, label: r.label }))} active={range} onChange={setRange} />
        </div>
        {error && <p className="mb-4 text-[13px] text-[var(--accent)]">{error}</p>}
        <StatGrid cols={4}>
          <StatCard title="Calls" value={calls.toLocaleString()} />
          <StatCard title="Discoveries" value={discoveries.toLocaleString()} />
          <StatCard title="Unique callers" value={(data?.uniqueCallers ?? 0).toLocaleString()} />
          <StatCard title="Success rate" value={calls > 0 ? `${Math.round(data?.successRate ?? 0)}%` : "n/a"} hint={calls > 0 && data?.avgLatency ? `${Math.round(data.avgLatency)} ms average` : undefined} />
        </StatGrid>
      </Section>

      {loading && !data ? (
        <Loading label="Loading inbound traffic" />
      ) : !hasTraffic ? (
        <Empty
          title="No inbound traffic yet"
          body={apis.length === 0 ? "Add an API so agents can discover and call it." : "Traffic appears here once agents discover or call your APIs."}
          action={apis.length === 0 ? <button type="button" className={btnSolid} onClick={onAdd}>Add API</button> : undefined}
        />
      ) : (
        <>
          {byDay.length > 0 && (
            <Section
              title="Per day"
              action={
                <p className="flex items-center gap-4 text-[12.5px] text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full bg-[var(--text-primary)]" aria-hidden="true" />Calls</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full bg-[var(--ok)]" aria-hidden="true" />Discoveries</span>
                </p>
              }
            >
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={byDay} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickFormatter={(d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
                    <Line type="monotone" dataKey="calls" name="Calls" stroke="var(--text-primary)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="searches" name="Discoveries" stroke="var(--ok)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            <Section title="Top actions" description="Most called actions in range.">
              {topCalls.length === 0 ? (
                <p className="border-t border-[var(--border-subtle)] py-4 text-[13px] text-[var(--text-muted)]">No calls in range.</p>
              ) : (
                topCalls.map((a) => {
                  const rate = Math.round((a.success / Math.max(a.calls, 1)) * 100);
                  return (
                    <Row key={a.action} right={<><span>{a.calls} {a.calls === 1 ? "call" : "calls"}</span><Status kind={rate === 100 ? "ok" : rate >= 90 ? "warn" : "bad"}>{rate}%</Status></>}>
                      <p className="truncate claw-mono text-[13px]">{a.action}</p>
                    </Row>
                  );
                })
              )}
            </Section>
            <Section title="Top searches" description="Queries that surfaced your APIs.">
              {topSearches.length === 0 ? (
                <p className="border-t border-[var(--border-subtle)] py-4 text-[13px] text-[var(--text-muted)]">No discoveries in range.</p>
              ) : (
                topSearches.map((s) => (
                  <Row key={s.action} right={<span>{s.calls}×</span>}>
                    <p className="truncate text-[14px]">{s.action}</p>
                  </Row>
                ))
              )}
            </Section>
          </div>

          <Section title="Callers" description="Which workspaces are calling your APIs.">
            {byCaller.length === 0 ? (
              <Empty title="No callers yet" body="Per-caller traffic appears here once agents call your APIs." />
            ) : (
              byCaller.map((c) => (
                <Row
                  key={c.callerKey}
                  right={
                    <>
                      <span>{c.calls} {c.calls === 1 ? "call" : "calls"}</span>
                      {c.errors > 0 && <Status kind="bad">{c.errors} {c.errors === 1 ? "error" : "errors"}</Status>}
                      <span className="text-[var(--text-muted)]">{relativeTime(c.lastCallAt)}</span>
                    </>
                  }
                >
                  <p className="truncate claw-mono text-[13px]">{c.callerKey === "you" ? "You" : c.callerKey}</p>
                </Row>
              ))
            )}
          </Section>
        </>
      )}
    </div>
  );
}
