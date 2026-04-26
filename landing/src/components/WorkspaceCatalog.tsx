"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Layers,
  Sparkles,
  Activity,
  AlertTriangle,
  CircleSlash,
  Loader2,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import {
  useInfiniteCatalog,
  type CatalogItem,
  type FetchPage,
} from "@/lib/useInfiniteCatalog";
import { convexQuery } from "@/lib/convex-client";

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

// ── Health enrichment for callable section ───────────────────────────────
//
// /api/catalog gives names + callable flag. Health (circuit-breaker state)
// lives in Convex providerAPIs. We fetch all health entries once and merge
// by name. Cheap because callable is ~1,650 rows.

type HealthMap = Record<string, "healthy" | "degraded" | "down" | "unclassified" | "unknown">;

async function fetchHealth(): Promise<HealthMap> {
  try {
    // searchDiscovery returns callable rows with healthStatus. Pull up to the
    // current callable count (~1,650). One round trip, cheap on Convex.
    const map: HealthMap = {};
    let offset = 0;
    const limit = 200;
    for (let i = 0; i < 12; i++) {
      const res = await convexQuery<{
        results: Array<{ name: string; healthStatus?: string }>;
        total: number;
      }>("pipelineAlign:searchDiscovery", {
        callableOnly: true,
        limit,
        offset,
      });
      for (const row of res.results) {
        const status = (row.healthStatus ?? "unknown") as HealthMap[string];
        map[row.name.toLowerCase()] = status;
      }
      if (res.results.length < limit) break;
      offset += limit;
      if (offset >= res.total) break;
    }
    return map;
  } catch {
    return {};
  }
}

// ── Component ────────────────────────────────────────────────────────────

export function WorkspaceCatalog() {
  const [section, setSection] = useState<SectionId>("discover");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">API Catalog</h2>
        <p className="text-[var(--text-muted)] mt-1">
          Two views, one registry. Discover what&apos;s indexed. Callable shows
          what your agent can hit right now, with live gateway health.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SectionCard
          id="discover"
          active={section === "discover"}
          onClick={() => setSection("discover")}
          title="Discover"
          subtitle="Every API in the registry"
          accent="blue"
          icon={<Search className="w-5 h-5" />}
          hint="discover_apis(query)"
        />
        <SectionCard
          id="callable"
          active={section === "callable"}
          onClick={() => setSection("callable")}
          title="Callable"
          subtitle="What your agent can hit right now"
          accent="green"
          icon={<Sparkles className="w-5 h-5" />}
          hint="call_api(provider, action, params)"
        />
      </div>

      {section === "discover" ? (
        <DiscoverSection />
      ) : (
        <CallableSection />
      )}
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

function DiscoverSection() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

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

// ── Callable section: ~1,650 rows, with health badges ──────────────────

function CallableSection() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [healthByName, setHealthByName] = useState<HealthMap>({});

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    fetchHealth().then(setHealthByName);
    const interval = setInterval(() => fetchHealth().then(setHealthByName), 30_000);
    return () => clearInterval(interval);
  }, []);

  const { items, total, hasMore, loading, loadingMore, error, sentinelRef } =
    useInfiniteCatalog({
      fetchPage: fetchFromCatalogApi,
      pageSize: 60,
      query: debouncedQuery,
      category,
      callableOnly: true,
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
      <CatalogList items={items} healthByName={healthByName} loading={loading} />
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
  const [copied, setCopied] = useState(false);
  const isManaged = api.auth === "managed";
  const isOpen = api.auth === "none" || api.auth === "open";

  const callSnippet = useMemo(() => {
    const slug = api.name.toLowerCase().replace(/\s+/g, "_");
    return `apiclaw call ${slug}/<action> -d '{}'`;
  }, [api.name]);

  const handleCopy = () => {
    navigator.clipboard.writeText(callSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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
        {api.callable && (
          <div className="mt-2 flex items-center gap-2">
            <code className="text-[11px] font-mono text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-0.5 truncate">
              {callSnippet}
            </code>
            <button
              onClick={handleCopy}
              aria-label="Copy call snippet"
              className="text-[var(--text-muted)] hover:text-[#ef4444] transition shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
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
