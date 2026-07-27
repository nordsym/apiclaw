"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Layers,
  Sparkles,
  Activity,
  AlertTriangle,
  CircleSlash,
  Loader2,
  PlayCircle,
  ExternalLink,
} from "lucide-react";
import {
  useInfiniteCatalog,
  type CatalogItem,
  type FetchPage,
} from "@/lib/useInfiniteCatalog";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";
const GATEWAY_URL = process.env.NEXT_PUBLIC_APICLAW_GATEWAY_URL || "https://api.apiclaw.cloud";
const TEST_CALL_PENDING_STORAGE_KEY = "apiclaw.workspace.pending-test-call";

type SectionId = "discover" | "callable";

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
    items: data.items as CatalogItem[],
    total: data.total ?? 0,
    hasMore: !!data.hasMore,
  };
};

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
  const filtered = (data.providers || [])
    .filter((provider) => (provider.customerExecutableActions?.length ?? 0) > 0)
    .filter((provider) => !normalizedQuery || [provider.providerId, provider.name, provider.description].some((value) => value.toLowerCase().includes(normalizedQuery)))
    .filter((provider) => !category || provider.category === category)
    .map((provider) => ({
      name: provider.name,
      description: provider.description,
      category: provider.category,
      baseUrl: provider.providerId,
      auth: "managed",
      pricing: provider.pricing,
      callable: true,
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

// Health is shown only when the source row contains a measured status.

type HealthMap = Record<string, "healthy" | "degraded" | "down" | "unclassified" | "unknown">;

// ── Component ────────────────────────────────────────────────────────────

export function WorkspaceCatalog({ sessionToken }: { sessionToken?: string | null }) {
  const [section, setSection] = useState<SectionId>("discover");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Catalog & Test</h2>
        <p className="text-[var(--text-muted)] mt-1">
          Discover indexed APIs or inspect the canonical public providers wired to the managed gateway.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SectionCard
          id="discover"
          active={section === "discover"}
          onClick={() => { setSection("discover"); setCategory(""); }}
          title="Discover"
          subtitle="Every API in the registry"
          accent="blue"
          icon={<Search className="w-5 h-5" />}
          hint="discover_apis(query)"
        />
        <SectionCard
          id="callable"
          active={section === "callable"}
          onClick={() => { setSection("callable"); setCategory(""); }}
          title="Managed Gateway"
          subtitle="Canonical public provider routes"
          accent="green"
          icon={<Sparkles className="w-5 h-5" />}
          hint="/v1/execute"
        />
      </div>

      <TestCallPanel sessionToken={sessionToken} />

      {section === "discover" ? (
        <DiscoverSection query={query} setQuery={setQuery} category={category} setCategory={setCategory} debouncedQuery={debouncedQuery} />
      ) : (
        <CallableSection query={query} setQuery={setQuery} category={category} setCategory={setCategory} debouncedQuery={debouncedQuery} sessionToken={sessionToken} />
      )}
    </div>
  );
}

function TestCallPanel({ sessionToken }: { sessionToken?: string | null }) {
  const [query, setQuery] = useState("APIClaw agent infrastructure");
  const [running, setRunning] = useState(false);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const testCallIdempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(TEST_CALL_PENDING_STORAGE_KEY);
      if (!pending) return;
      const parsed = JSON.parse(pending) as { idempotencyKey?: string; query?: string };
      if (!parsed.idempotencyKey) return;
      testCallIdempotencyKeyRef.current = parsed.idempotencyKey;
      if (parsed.query) setQuery(parsed.query);
      setOutcomeUnknown(true);
      setResult({
        ok: false,
        message: "A previous test call was accepted but its response was unavailable. Do not rerun it. Open Activity and look for the recent Brave Search call. Keep this browser tab open if support needs the saved operation key.",
      });
    } catch {
      sessionStorage.removeItem(TEST_CALL_PENDING_STORAGE_KEY);
    }
  }, []);

  const clearPendingTestCall = () => {
    testCallIdempotencyKeyRef.current = null;
    sessionStorage.removeItem(TEST_CALL_PENDING_STORAGE_KEY);
  };

  const runTest = async () => {
    if (!sessionToken || !query.trim()) return;
    setRunning(true);
    setResult(null);
    try {
      const idempotencyKey = testCallIdempotencyKeyRef.current ??
        `workspace-test-${crypto.randomUUID()}`;
      testCallIdempotencyKeyRef.current = idempotencyKey;
      sessionStorage.setItem(TEST_CALL_PENDING_STORAGE_KEY, JSON.stringify({
        idempotencyKey,
        query: query.trim(),
      }));
      const response = await fetch(`${GATEWAY_URL}/v1/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
          "X-APIClaw-Session": sessionToken,
        },
        body: JSON.stringify({
          provider: "brave_search",
          action: "search",
          params: { query: query.trim(), count: 3 },
        }),
      });
      const data = await response.json();
      const errorCode = typeof data?.error === "object" ? data.error.code : undefined;
      if (errorCode === "idempotency_conflict" || response.status >= 500) {
        setOutcomeUnknown(true);
        setResult({
          ok: false,
          message: "This request was already accepted or may have completed, but its response is unavailable. Do not rerun it. Open Activity and look for the recent Brave Search call. Keep this browser tab open if support needs the saved operation key.",
        });
        return;
      }
      // A successful response or a terminal client error makes this operation
      // unambiguous, so only then may a future click receive a fresh key.
      clearPendingTestCall();
      if (!response.ok || data.error || data.success === false) {
        const message = data?.error?.message || data?.error || "The managed call failed.";
        setResult({
          ok: false,
          message: typeof message === "string" ? message : "The managed call failed.",
        });
        return;
      }
      const count = data?.data?.web?.results?.length ?? data?.web?.results?.length ?? data?.result?.web?.results?.length ?? 0;
      setResult({ ok: true, message: `Managed call succeeded${count ? ` with ${count} results` : ""}. Open Activity to inspect the log.` });
    } catch {
      setOutcomeUnknown(true);
      setResult({
        ok: false,
        message: "The gateway response was lost. This request may already have completed. Do not rerun it. Open Activity and look for the recent Brave Search call. Keep this browser tab open if support needs the saved operation key.",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/5 p-5">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <PlayCircle className="w-5 h-5 text-[#ef4444]" />
            <h3 className="font-semibold">Run a real managed call</h3>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-3">Test the golden path with Brave Search. This uses one managed call and writes a real Activity log.</p>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={outcomeUnknown}
            placeholder="What should the agent search for?"
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/40"
          />
        </div>
        <button type="button" onClick={runTest} disabled={!sessionToken || running || outcomeUnknown || !query.trim()} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#ef4444] text-white text-sm font-medium hover:bg-[#dc2626] disabled:opacity-50 transition">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
          {running ? "Running..." : outcomeUnknown ? "Check Activity" : "Run test call"}
        </button>
      </div>
      {result && <p role={result.ok ? "status" : "alert"} className={`text-sm mt-3 ${result.ok ? "text-green-500" : "text-red-500"}`}>{result.message}</p>}
    </div>
  );
}

function SectionCard({
  id,
  active,
  onClick,
  title,
  subtitle,
  accent,
  icon,
  hint,
}: {
  id: SectionId;
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  accent: "blue" | "green";
  icon: React.ReactNode;
  hint: string;
}) {
  const accentColor = accent === "blue" ? "text-blue-400 border-blue-500/20 bg-blue-500/5" : "text-green-400 border-green-500/20 bg-green-500/5";
  return (
    <button
      onClick={onClick}
      data-section={id}
      className={`rounded-2xl border p-5 text-left transition ${
        active
          ? "border-[#ef4444] bg-[#ef4444]/5"
          : "border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[#ef4444]/40"
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${accent === "blue" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"}`}>
        {icon}
      </div>
      <p className="font-semibold text-base">{title}</p>
      <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">{subtitle}</p>
      <div className={`mt-3 flex items-center gap-1.5 text-xs font-mono rounded-lg px-2.5 py-1.5 border ${accentColor}`}>
        <Layers className="w-3 h-3 shrink-0" />
        {hint}
      </div>
    </button>
  );
}

// ── Discover section: 26k+ APIs, search + category, infinite scroll ─────

function DiscoverSection({ query, setQuery, category, setCategory, debouncedQuery }: CatalogSectionProps) {

  const { items, total, hasMore, loading, loadingMore, error, sentinelRef } =
    useInfiniteCatalog({
      fetchPage: fetchFromCatalogApi,
      pageSize: 60,
      query: debouncedQuery,
      category,
      callableOnly: false,
    });

  return (
    <div className="space-y-3">
      <CatalogToolbar
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        total={total}
        loading={loading}
        accent="blue"
      />
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}
      <CatalogList items={items} healthByName={null} loading={loading} />
      <Sentinel
        sentinelRef={sentinelRef}
        loadingMore={loadingMore}
        hasMore={hasMore}
        empty={!loading && items.length === 0}
      />
    </div>
  );
}

// ── Managed gateway section: canonical provider registry ───────────────

type CatalogSectionProps = {
  query: string;
  setQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  debouncedQuery: string;
};

function CallableSection({ query, setQuery, category, setCategory, debouncedQuery, sessionToken }: CatalogSectionProps & { sessionToken?: string | null }) {
  const fetchManagedProviders = useMemo(
    () => createManagedProvidersFetcher(sessionToken),
    [sessionToken],
  );

  const { items, total, hasMore, loading, loadingMore, error, sentinelRef } =
    useInfiniteCatalog({
      fetchPage: fetchManagedProviders,
      pageSize: 60,
      query: debouncedQuery,
      category,
      callableOnly: false,
    });

  return (
    <div className="space-y-3">
      <CatalogToolbar
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        total={total}
        loading={loading}
        accent="green"
      />
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}
      <CatalogList items={items} healthByName={null} loading={loading} />
      <Sentinel
        sentinelRef={sentinelRef}
        loadingMore={loadingMore}
        hasMore={hasMore}
        empty={!loading && items.length === 0}
      />
    </div>
  );
}

// ── Toolbar ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  "all",
  "AI & ML",
  "Communication",
  "Data & Analytics",
  "Development",
  "Finance",
  "Utilities",
  "Commerce",
  "Health & Fitness",
  "Entertainment",
  "Location & Maps",
  "Auth & Security",
  "Travel & Aviation",
];

function CatalogToolbar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  total,
  loading,
  accent,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  total: number;
  loading: boolean;
  accent: "blue" | "green";
}) {
  const accentRing =
    accent === "blue" ? "focus:ring-blue-500/40" : "focus:ring-green-500/40";
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className={`flex-1 min-w-[200px] flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 focus-within:ring-2 ${accentRing}`}>
        <Search className="w-4 h-4 text-[var(--text-muted)]" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by name, description, capability…"
          className="flex-1 bg-transparent py-2.5 text-sm focus:outline-none"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Clear
          </button>
        )}
      </div>
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value === "all" ? "" : e.target.value)}
        className="px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/40"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c === "all" ? "All Categories" : c}
          </option>
        ))}
      </select>
      <div className="text-sm text-[var(--text-muted)] tabular-nums shrink-0">
        {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : `${total.toLocaleString()} APIs`}
      </div>
    </div>
  );
}

// ── List + row ──────────────────────────────────────────────────────────

function CatalogList({
  items,
  healthByName,
  loading,
}: {
  items: CatalogItem[];
  healthByName: HealthMap | null;
  loading: boolean;
}) {
  if (loading && items.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[68px] rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] animate-pulse"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((api) => (
        <CatalogRow
          key={`${api.name}-${api.baseUrl ?? ""}`}
          api={api}
          health={healthByName?.[api.name.toLowerCase()] ?? api.healthStatus}
        />
      ))}
    </div>
  );
}

function CatalogRow({
  api,
  health,
}: {
  api: CatalogItem;
  health?: "healthy" | "degraded" | "down" | "unclassified" | "unknown";
}) {
  const isManaged = api.auth === "managed";
  const isOpen = api.auth === "none" || api.auth === "open";

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[#ef4444]/30 transition">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        isManaged
          ? "bg-[#ef4444]/10 text-[#ef4444]"
          : isOpen
            ? "bg-purple-500/10 text-purple-400"
            : "bg-[var(--surface)] text-[var(--text-muted)]"
      }`}>
        <Layers className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm truncate">{api.name}</p>
          {isManaged && (
            <span className="text-[10px] uppercase tracking-widest font-semibold text-[#ef4444] bg-[#ef4444]/10 px-1.5 py-0.5 rounded">
              Managed
            </span>
          )}
          {isOpen && (
            <span className="text-[10px] uppercase tracking-widest font-semibold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
              Open
            </span>
          )}
          {api.callable && health && <HealthBadge status={health} />}
        </div>
        <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
          {api.description}
        </p>
        {api.callable && isManaged && (
          <div className="mt-2 flex items-center gap-2">
            <code className="text-[11px] font-mono text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-0.5 truncate">
              provider: {api.baseUrl} · /v1/execute
            </code>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <span className="text-xs text-[var(--text-muted)] bg-[var(--surface)] px-2 py-0.5 rounded">
          {api.category}
        </span>
        {api.docsUrl && (
          <a
            href={api.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open docs"
            className="text-[var(--text-muted)] hover:text-[#ef4444] transition"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

function HealthBadge({
  status,
}: {
  status: "healthy" | "degraded" | "down" | "unclassified" | "unknown";
}) {
  if (status === "healthy") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">
        <Activity className="w-2.5 h-2.5" /> live
      </span>
    );
  }
  if (status === "degraded") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
        <AlertTriangle className="w-2.5 h-2.5" /> degraded
      </span>
    );
  }
  if (status === "down") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
        <CircleSlash className="w-2.5 h-2.5" /> down
      </span>
    );
  }
  return null;
}

function Sentinel({
  sentinelRef,
  loadingMore,
  hasMore,
  empty,
}: {
  sentinelRef: React.RefObject<HTMLDivElement>;
  loadingMore: boolean;
  hasMore: boolean;
  empty: boolean;
}) {
  if (empty) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 text-center text-sm text-[var(--text-muted)]">
        No matches. Try a different query or category.
      </div>
    );
  }
  return (
    <div ref={sentinelRef} className="py-6 flex items-center justify-center">
      {loadingMore ? (
        <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
      ) : !hasMore ? (
        <span className="text-xs text-[var(--text-muted)]">End of catalog</span>
      ) : null}
    </div>
  );
}
