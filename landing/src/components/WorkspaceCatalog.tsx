"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteCatalog,
  type CatalogItem,
  type FetchPage,
} from "@/lib/useInfiniteCatalog";
import {
  Empty,
  Field,
  Loading,
  PageHeader,
  Panel,
  Row,
  Status,
  SurfaceTabs,
  btnQuiet,
  btnSolid,
  inputClass,
  textareaClass,
} from "@/app/workspace/views/ui";

export const GATEWAY_URL = process.env.NEXT_PUBLIC_APICLAW_GATEWAY_URL || "https://api.apiclaw.cloud";
const TEST_CALL_PENDING_STORAGE_KEY = "apiclaw.workspace.pending-test-call";

type SourceId = "managed" | "all";

/** Catalog row as returned by either source. Extra fields are optional on the shared type. */
type Item = CatalogItem & {
  providerId?: string;
  actions?: readonly string[];
  managedAdapter?: boolean;
  verified?: boolean;
};

/** A provider/action pair the user can run from the test panel. */
type Target = { providerId: string; name: string; actions: readonly string[] };

const DEFAULT_PARAMS: Record<string, string> = {
  "brave_search/search": JSON.stringify({ query: "APIClaw agent infrastructure", count: 3 }, null, 2),
};

const AUTH_LABELS: Record<string, string> = {
  managed: "managed",
  apiKey: "api key",
  oauth: "oauth",
  none: "open",
  open: "open",
};

const OUTCOME_UNKNOWN_MESSAGE =
  "A previous test call was accepted but its response was unavailable. Do not rerun it. Open Activity and look for the recent call. Keep this browser tab open if support needs the saved operation key.";

// ── /api/catalog source ──────────────────────────────────────────────────

const fetchFromCatalogApi: FetchPage = async ({
  page,
  pageSize,
  query,
  category,
  callableOnly,
  signal,
}) => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(pageSize));
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  if (callableOnly) params.set("callable", "true");

  const res = await fetch(`/api/catalog?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`Catalog ${res.status}`);
  const data = await res.json();
  return {
    items: (data.items ?? []) as CatalogItem[],
    total: data.total ?? 0,
    hasMore: !!data.hasMore,
  };
};

// ── Gateway discover source (managed providers) ──────────────────────────

function createManagedProvidersFetcher(sessionToken?: string | null): FetchPage {
  return async ({ page, pageSize, query, category, signal }) => {
    const response = await fetch(`${GATEWAY_URL}/api/discover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionToken ? { "X-APIClaw-Session": sessionToken } : {}),
      },
      body: JSON.stringify({ query: "" }),
      signal,
    });
    if (!response.ok) throw new Error(`Gateway catalog ${response.status}`);
    const data = await response.json() as {
      providers?: Array<{
        providerId: string;
        name: string;
        description: string;
        category: string;
        pricing?: string;
        customerExecutableActions?: string[];
      }>;
    };
    const normalizedQuery = query.trim().toLowerCase();
    const filtered: Item[] = (data.providers || [])
      .filter((provider) => (provider.customerExecutableActions?.length ?? 0) > 0)
      .filter((provider) => !normalizedQuery || [provider.providerId, provider.name, provider.description].some((value) => (value ?? "").toLowerCase().includes(normalizedQuery)))
      .filter((provider) => !category || provider.category === category)
      .map((provider) => ({
        name: provider.name,
        description: provider.description,
        category: provider.category,
        baseUrl: provider.providerId,
        providerId: provider.providerId,
        auth: "managed",
        pricing: provider.pricing,
        callable: true,
        managedAdapter: true,
        actions: provider.customerExecutableActions,
      }));
    const offset = (page - 1) * pageSize;
    return {
      items: filtered.slice(offset, offset + pageSize),
      total: filtered.length,
      hasMore: offset + pageSize < filtered.length,
    };
  };
}

function targetOf(item: Item): Target | null {
  if (!item.callable || item.auth !== "managed") return null;
  const providerId = item.providerId || item.baseUrl;
  if (!providerId || !item.actions?.length) return null;
  return { providerId, name: item.name, actions: item.actions };
}

// ── Component ────────────────────────────────────────────────────────────

export function WorkspaceCatalog({ sessionToken }: { sessionToken?: string | null }) {
  const [source, setSource] = useState<SourceId>("managed");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  // A call whose outcome is unknown must stay visible until it is resolved,
  // so reopen its panel on mount even before any row has loaded.
  useEffect(() => {
    const pending = readPendingTestCall();
    if (!pending) return;
    const providerId = pending.provider || "brave_search";
    setTarget({ providerId, name: providerId, actions: [pending.action || "search"] });
  }, []);

  const fetchManaged = useMemo(() => createManagedProvidersFetcher(sessionToken), [sessionToken]);
  const call = useTestCall(target, sessionToken);

  const panel = target ? (
    <TestCallPanel target={target} call={call} sessionToken={sessionToken} onClose={() => setTarget(null)} />
  ) : null;

  return (
    <div>
      <PageHeader title="Catalog" description="Search providers. Callable rows can be called right now, the rest are discoverable." />

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name or description"
        aria-label="Search catalog"
        className={inputClass}
      />

      <div className="mt-4">
        <SurfaceTabs
          items={[{ id: "managed", label: "Callable" }, { id: "all", label: "All" }]}
          active={source}
          onChange={(id) => { setSource(id as SourceId); setTarget(null); }}
          label="Source"
        />
      </div>

      {/* key forces a fresh list (and fetch) when the source changes */}
      <Results
        key={source}
        fetchPage={source === "managed" ? fetchManaged : fetchFromCatalogApi}
        query={debouncedQuery}
        target={target}
        onSelect={(next) => { if (!call.running) setTarget((current) => (current?.providerId === next.providerId ? null : next)); }}
        panel={panel}
      />
    </div>
  );
}

// ── Results list ─────────────────────────────────────────────────────────

function Results({ fetchPage, query, target, onSelect, panel }: {
  fetchPage: FetchPage;
  query: string;
  target: Target | null;
  onSelect: (target: Target) => void;
  panel: React.ReactNode;
}) {
  const { items, total, hasMore, loading, loadingMore, error, sentinelRef } = useInfiniteCatalog({
    fetchPage,
    pageSize: 60,
    query,
    category: "",
    callableOnly: false,
  });

  const rows = items as Item[];
  const targetVisible = Boolean(target && rows.some((item) => targetOf(item)?.providerId === target.providerId));

  return (
    <div className="mt-6">
      {!loading && !error && (
        <p className="mb-2 text-[13px] text-[var(--text-muted)]">
          {total.toLocaleString("en-US")} {total === 1 ? "result" : "results"}{query ? ` for "${query}"` : ""}
        </p>
      )}

      {/* Selected provider is not in this list: keep its panel reachable above the rows. */}
      {panel && !targetVisible && <div className="mb-4">{panel}</div>}

      {error && <p role="alert" className="border-t border-[var(--border-subtle)] py-4 text-[13.5px] text-[var(--accent)]">{error}</p>}

      {loading && rows.length === 0 ? (
        <Loading label="Loading catalog" />
      ) : !loading && !error && rows.length === 0 ? (
        <Empty title="No matches" body="Try a different search or switch source." />
      ) : (
        <ul>
          {rows.map((item, index) => {
            const itemTarget = targetOf(item);
            const selected = Boolean(itemTarget && target && itemTarget.providerId === target.providerId);
            return (
              <li key={`${item.name}-${item.baseUrl ?? ""}-${index}`}>
                <CatalogRow item={item} target={itemTarget} selected={selected} onSelect={onSelect} />
                {selected && <div className="mb-4 mt-1">{panel}</div>}
              </li>
            );
          })}
        </ul>
      )}

      {!error && rows.length > 0 && (
        <div ref={sentinelRef} className="py-6 text-center text-[12.5px] text-[var(--text-muted)]">
          {loadingMore ? "Loading more" : !hasMore ? "End of list" : null}
        </div>
      )}
    </div>
  );
}

function CatalogRow({ item, target, selected, onSelect }: {
  item: Item;
  target: Target | null;
  selected: boolean;
  onSelect: (target: Target) => void;
}) {
  const authLabel = AUTH_LABELS[item.auth ?? ""] ?? "auth";
  const right = (
    <>
      {item.callable ? (
        <Status kind="ok">callable</Status>
      ) : item.managedAdapter ? (
        <Status kind="muted">not callable yet</Status>
      ) : item.verified ? (
        <Status kind="muted">source-verified</Status>
      ) : null}
      {item.auth !== "managed" && <span className="hidden sm:inline">{authLabel}</span>}
      {!target && item.docsUrl && (
        <a href={item.docsUrl} target="_blank" rel="noopener noreferrer" className="claw-link">Docs</a>
      )}
    </>
  );
  const body = (
    <>
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="text-[14.5px] font-medium text-[var(--text-primary)]">{item.name}</span>
        <span className="text-[12.5px] text-[var(--text-muted)]">{item.category}</span>
        {target && (
          <span className="claw-mono text-[12px] text-[var(--text-muted)]">
            {target.providerId}{target.actions.length ? ` · ${target.actions.length} ${target.actions.length === 1 ? "action" : "actions"}` : ""}
          </span>
        )}
      </div>
      <span className="mt-0.5 block truncate text-[13.5px] text-[var(--text-secondary)]">{item.description || "No description."}</span>
      {target && (
        <span className="mt-1 block text-[12.5px] text-[var(--text-muted)]">{selected ? "Close test call" : "Run a test call"}</span>
      )}
    </>
  );
  if (target) {
    return <Row onClick={() => onSelect(target)} right={right}>{body}</Row>;
  }
  return <Row right={right}>{body}</Row>;
}

// ── Test call ────────────────────────────────────────────────────────────

type CallResult = {
  ok: boolean;
  status: number | null;
  latencyMs: number | null;
  body: string;
};

type PendingTestCall = { idempotencyKey?: string; provider?: string; action?: string; params?: string; query?: string };

function readPendingTestCall(): PendingTestCall | null {
  try {
    const pending = sessionStorage.getItem(TEST_CALL_PENDING_STORAGE_KEY);
    if (!pending) return null;
    const parsed = JSON.parse(pending) as PendingTestCall;
    return parsed.idempotencyKey ? parsed : null;
  } catch {
    sessionStorage.removeItem(TEST_CALL_PENDING_STORAGE_KEY);
    return null;
  }
}

/**
 * Test-call state lives with the catalog, not the panel, so the panel can move
 * between "under the selected row" and "above the list" without losing a result.
 */
function useTestCall(target: Target | null, sessionToken?: string | null) {
  const [action, setAction] = useState("");
  const [params, setParams] = useState("{}");
  const [running, setRunning] = useState(false);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<CallResult | null>(null);
  const testCallIdempotencyKeyRef = useRef<string | null>(null);

  const targetKey = target ? `${target.providerId}|${target.actions.join(",")}` : "";

  // Reset for the new target, then restore an unresolved call for it if one is saved.
  useEffect(() => {
    if (!target) return;
    const firstAction = target.actions[0] ?? "";
    setAction(firstAction);
    setParams(DEFAULT_PARAMS[`${target.providerId}/${firstAction}`] ?? "{}");
    setResult(null);
    setNotice(null);
    setOutcomeUnknown(false);
    testCallIdempotencyKeyRef.current = null;

    const pending = readPendingTestCall();
    if (!pending || (pending.provider || "brave_search") !== target.providerId) return;
    testCallIdempotencyKeyRef.current = pending.idempotencyKey ?? null;
    if (pending.action) setAction(pending.action);
    if (pending.params) setParams(pending.params);
    else if (pending.query) setParams(JSON.stringify({ query: pending.query, count: 3 }, null, 2));
    setOutcomeUnknown(true);
    setNotice(OUTCOME_UNKNOWN_MESSAGE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);

  const parsedParams = useMemo<Record<string, unknown> | null>(() => {
    try {
      const value = JSON.parse(params || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : null;
    } catch {
      return null;
    }
  }, [params]);

  const changeAction = (next: string) => {
    setAction(next);
    const preset = target ? DEFAULT_PARAMS[`${target.providerId}/${next}`] : undefined;
    if (preset) setParams(preset);
  };

  const run = async () => {
    if (!target || !sessionToken || !action || !parsedParams || running || outcomeUnknown) return;
    setRunning(true);
    setResult(null);
    setNotice(null);
    const startedAt = performance.now();
    try {
      const idempotencyKey = testCallIdempotencyKeyRef.current ?? `workspace-test-${crypto.randomUUID()}`;
      testCallIdempotencyKeyRef.current = idempotencyKey;
      sessionStorage.setItem(TEST_CALL_PENDING_STORAGE_KEY, JSON.stringify({
        idempotencyKey,
        provider: target.providerId,
        action,
        params,
      }));
      const response = await fetch(`${GATEWAY_URL}/v1/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
          "X-APIClaw-Session": sessionToken,
        },
        body: JSON.stringify({
          provider: target.providerId,
          action,
          params: parsedParams,
        }),
      });
      const elapsed = Math.round(performance.now() - startedAt);
      const data = await response.json().catch(() => null);
      const errorCode = data && typeof data.error === "object" && data.error ? data.error.code : undefined;
      if (errorCode === "idempotency_conflict" || response.status >= 500) {
        setOutcomeUnknown(true);
        setNotice("This request was already accepted or may have completed, but its response is unavailable. Do not rerun it. Open Activity and look for the recent call. Keep this browser tab open if support needs the saved operation key.");
        setResult({ ok: false, status: response.status, latencyMs: elapsed, body: formatBody(data) });
        return;
      }
      // A successful response or a terminal client error makes this operation
      // unambiguous, so only then may a future click receive a fresh key.
      testCallIdempotencyKeyRef.current = null;
      sessionStorage.removeItem(TEST_CALL_PENDING_STORAGE_KEY);
      const ok = response.ok && !data?.error && data?.success !== false;
      const reported = typeof data?._apiclaw?.latencyMs === "number" ? data._apiclaw.latencyMs : null;
      setResult({ ok, status: response.status, latencyMs: reported ?? elapsed, body: formatBody(data) });
    } catch {
      setOutcomeUnknown(true);
      setNotice("The gateway response was lost. This request may already have completed. Do not rerun it. Open Activity and look for the recent call. Keep this browser tab open if support needs the saved operation key.");
    } finally {
      setRunning(false);
    }
  };

  return { action, changeAction, params, setParams, parsedParams, running, outcomeUnknown, notice, result, run };
}

type TestCall = ReturnType<typeof useTestCall>;

function TestCallPanel({ target, call, sessionToken, onClose }: {
  target: Target;
  call: TestCall;
  sessionToken?: string | null;
  onClose: () => void;
}) {
  const { action, changeAction, params, setParams, parsedParams, running, outcomeUnknown, notice, result, run } = call;
  const canRun = Boolean(sessionToken) && Boolean(action) && parsedParams !== null && !running && !outcomeUnknown;

  return (
    <Panel className="p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="text-[14.5px] font-medium">Test call</p>
        <p className="claw-mono text-[12.5px] text-[var(--text-muted)]">{target.providerId}/{action || "?"}</p>
      </div>
      <p className="mt-1 text-[13px] text-[var(--text-muted)]">Uses one call from your allowance and writes an Activity entry.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[12rem_1fr]">
        <Field label="Action">
          {target.actions.length > 1 ? (
            <select value={action} onChange={(event) => changeAction(event.target.value)} disabled={outcomeUnknown || running} className={inputClass}>
              {target.actions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          ) : (
            <input value={action} readOnly className={`${inputClass} claw-mono`} />
          )}
        </Field>
        <Field label="Params (JSON)" hint={parsedParams === null ? "Params must be a JSON object." : undefined}>
          <textarea
            value={params}
            onChange={(event) => setParams(event.target.value)}
            disabled={outcomeUnknown || running}
            rows={4}
            spellCheck={false}
            className={`${textareaClass} claw-mono !text-[12.5px]`}
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {outcomeUnknown ? (
          <a href="/workspace?tab=activity&sub=logs" className={btnSolid}>Check Activity</a>
        ) : (
          <button type="button" onClick={() => void run()} disabled={!canRun} className={btnSolid}>
            {running ? "Running" : "Run call"}
          </button>
        )}
        <button type="button" onClick={onClose} disabled={running} className={btnQuiet}>Close</button>
        {!sessionToken && <span className="text-[12.5px] text-[var(--text-muted)]">Sign in to run calls.</span>}
      </div>

      {notice && <p role="alert" className="mt-4 text-[13px] text-[var(--accent)]">{notice}</p>}

      {result && (
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-center gap-3 text-[12.5px]">
            <Status kind={result.ok ? "ok" : "bad"}>{result.ok ? "ok" : "failed"}</Status>
            {result.status !== null && <span className="claw-mono text-[var(--text-muted)]">HTTP {result.status}</span>}
            {result.latencyMs !== null && <span className="claw-mono text-[var(--text-muted)]">{result.latencyMs} ms</span>}
          </div>
          <pre className="claw-mono max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-[10px] border border-[var(--border-subtle)] bg-[var(--background)] px-4 py-3.5 text-[12.5px] leading-[1.7] text-[var(--text-secondary)]">{result.body}</pre>
        </div>
      )}
    </Panel>
  );
}

function formatBody(data: unknown): string {
  if (data === null || data === undefined) return "(no JSON body)";
  let text: string;
  try {
    text = JSON.stringify(data, null, 2);
  } catch {
    text = String(data);
  }
  return text.length > 6000 ? `${text.slice(0, 6000)}\n… truncated` : text;
}
