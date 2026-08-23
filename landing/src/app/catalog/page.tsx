"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, ExternalLink, Loader2, X } from "lucide-react";
import statsData from "@/lib/stats.json";
import {
  PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT,
} from "@apiclaw/product-truth";
import { SiteHeader } from "@/components/home/SiteHeader";
import { SiteFooter } from "@/components/home/SiteFooter";

interface ApiEntry {
  name: string;
  description: string;
  category: string;
  baseUrl: string;
  docsUrl: string;
  auth: string;
  pricing: string;
  callable?: boolean;
  managedAdapter?: boolean;
  providerId?: string;
  actions?: readonly string[];
  verified?: boolean;
  tier?: "managed" | "verified" | "working" | "needs_ctx" | "auth" | "dead" | "untested";
  latency_ms?: number | null;
  last_verified_at?: string | null;
}

interface CategoryInfo {
  total: number;
  callable: number;
  verified?: number;
  managedAdapters?: number;
}

interface CatalogResponse {
  items: ApiEntry[];
  total: number;
  page: number;
  hasMore: boolean;
  categories: Record<string, CategoryInfo>;
  totalCallable: number;
  totalCustomerExecutable?: number;
  totalVerified?: number;
  managedProviderAdapterCount?: number;
  discoveryOnlyCount?: number;
}

type TierFilter = "" | "adapter" | "verified" | "callable" | "discovery";

const AUTH_LABELS: Record<string, string> = {
  managed: "managed",
  apiKey: "api key",
  oauth: "oauth",
  none: "open",
  unknown: "auth",
};

export default function CatalogPage() {
  const [apis, setApis] = useState<ApiEntry[]>([]);
  const [categories, setCategories] = useState<Record<string, CategoryInfo>>({});
  const [total, setTotal] = useState(0);
  const [totalCallable, setTotalCallable] = useState(0);
  const [managedProviderAdapterCount, setManagedProviderAdapterCount] = useState(
    statsData.managedProviderAdapterCount,
  );
  const [discoveryOnlyCount, setDiscoveryOnlyCount] = useState(
    Math.max(0, statsData.apiCount - statsData.sourceVerifiedCount - statsData.managedProviderAdapterCount),
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("");
  const [callableOnly, setCallableOnly] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setApis([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
  }, [debouncedQuery, selectedCategory, callableOnly, tierFilter]);

  const fetchPage = useCallback(
    async (p: number, append: boolean) => {
      const params = new URLSearchParams({ page: String(p), limit: "60" });
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (selectedCategory) params.set("category", selectedCategory);
      if (tierFilter) params.set("tier", tierFilter);
      else if (callableOnly) params.set("callable", "true");

      try {
        const res = await fetch(`/api/catalog?${params}`);
        const data: CatalogResponse = await res.json();

        setApis((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotal(data.total);
        setTotalCallable(data.totalCustomerExecutable ?? data.totalCallable);
        setManagedProviderAdapterCount(
          data.managedProviderAdapterCount ?? statsData.managedProviderAdapterCount,
        );
        setDiscoveryOnlyCount(
          data.discoveryOnlyCount ?? Math.max(
            0,
            statsData.apiCount - statsData.sourceVerifiedCount - (data.managedProviderAdapterCount ?? statsData.managedProviderAdapterCount),
          ),
        );
        setHasMore(data.hasMore);
        setCategories(data.categories);
      } catch (err) {
        console.error("Catalog fetch error:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedQuery, selectedCategory, callableOnly, tierFilter]
  );

  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPage(nextPage, true);
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchPage]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const sortedCategories = Object.entries(categories).sort(
    ([, a], [, b]) => b.total - a.total
  );

  const indexedCount = statsData.apiCount;
  const sourceVerifiedHeadline = statsData.sourceVerifiedCount;
  const customerExecutionHeadline = totalCallable || PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT;
  const discoveryOnlyHeadline = discoveryOnlyCount;

  const tierOptions = [
    { id: "", label: "All", count: indexedCount },
    { id: "callable", label: "Callable now", count: customerExecutionHeadline },
    { id: "adapter", label: "Adapter inventory", count: managedProviderAdapterCount },
    { id: "verified", label: "Source-verified", count: sourceVerifiedHeadline },
    { id: "discovery", label: "Discovery only", count: discoveryOnlyHeadline },
  ] as const;

  return (
    <main className="claw min-h-screen">
      <SiteHeader />

      {/* Title + stats */}
      <section className="py-16 sm:py-20">
        <div className="claw-container">
          <p className="claw-eyebrow mb-4">Catalog</p>
          <h1 className="claw-display text-[2.2rem] sm:text-[2.75rem]">API Catalog</h1>
          <p className="claw-lede mt-5 max-w-2xl">
            {indexedCount.toLocaleString("en-US")} APIs discoverable by agents.
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-5">
            {[
              { n: indexedCount, label: "discoverable" },
              { n: customerExecutionHeadline, label: "callable now" },
            ].map((s) => (
              <div key={s.label} className="border-t border-border-subtle pt-4">
                <dd className="text-[1.5rem] font-semibold tracking-[-0.02em] tabular-nums">{s.n.toLocaleString("en-US")}</dd>
                <dt className="mt-1 text-[13px] text-text-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="claw-container"><div className="claw-rule" /></div>

      {/* Search + filters + results */}
      <section className="py-16 sm:py-20">
        <div className="claw-container">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search APIs... (press /)"
              aria-label="Search APIs"
              className="claw-mono h-12 w-full rounded-[10px] border border-border-subtle bg-surface pl-11 pr-11 text-[13.5px] text-text-primary placeholder:text-text-muted transition focus:border-border focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted transition hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tier filter */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="claw-segments w-max max-w-full" aria-label="View">
              {tierOptions.filter(({ id }) => id === "" || id === "callable").map(({ id, label, count }) => {
                const active = tierFilter === id;
                return (
                  <button
                    key={id || "all"}
                    type="button"
                    aria-selected={active}
                    onClick={() => { setTierFilter(id as TierFilter); setCallableOnly(false); }}
                    className="claw-segment"
                  >
                    {label}
                    <span className="claw-mono ml-2 text-[12px] text-text-muted">{count.toLocaleString("en-US")}</span>
                  </button>
                );
              })}
            </div>

            {/* Customer execution toggle */}
            <label className="inline-flex cursor-pointer items-center gap-2.5 text-[13.5px] text-text-secondary">
              <input
                type="checkbox"
                checked={callableOnly}
                onChange={() => {
                  const next = !callableOnly;
                  setCallableOnly(next);
                  if (next) setTierFilter("");
                }}
                className="h-3.5 w-3.5 accent-[var(--text-primary)]"
              />
              <span>Callable now only</span>
              <span className="claw-mono text-[12px] text-text-muted">{totalCallable.toLocaleString("en-US")}</span>
            </label>
          </div>
          <p className="mt-2 text-[13px] text-text-muted">
            {callableOnly ? "Showing the billing-grade routes your agent can call right now" : "Showing all discoverable APIs"}
          </p>

          {/* Category filters */}
          <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-[13.5px]">
            <button
              type="button"
              onClick={() => setSelectedCategory("")}
              className={`transition ${!selectedCategory ? "text-text-primary underline underline-offset-4 decoration-border" : "text-text-muted hover:text-text-primary"}`}
            >
              Discoverable
              <span className="claw-mono ml-1.5 text-[12px] text-text-muted">{callableOnly ? totalCallable.toLocaleString("en-US") : indexedCount.toLocaleString("en-US")}</span>
            </button>
            {sortedCategories.map(([cat, info]) => {
              const isActive = cat === selectedCategory;
              const count = callableOnly || tierFilter === "callable"
                ? info.callable
                : tierFilter === "adapter"
                  ? (info.managedAdapters ?? 0)
                : tierFilter === "verified"
                  ? (info.verified ?? 0)
                : tierFilter === "discovery"
                  ? Math.max(0, info.total - (info.verified ?? 0) - (info.managedAdapters ?? 0))
                  : info.total;
              if ((callableOnly || tierFilter === "callable") && info.callable === 0) return null;
              if (tierFilter === "adapter" && (info.managedAdapters ?? 0) === 0) return null;
              if (tierFilter === "verified" && (info.verified ?? 0) === 0) return null;
              if (tierFilter === "discovery" && info.total - (info.verified ?? 0) - (info.managedAdapters ?? 0) === 0) return null;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(isActive ? "" : cat)}
                  className={`transition ${isActive ? "text-text-primary underline underline-offset-4 decoration-border" : "text-text-muted hover:text-text-primary"}`}
                >
                  {cat}
                  <span className="claw-mono ml-1.5 text-[12px] text-text-muted">{count.toLocaleString("en-US")}</span>
                </button>
              );
            })}
          </div>

          {/* Result count */}
          {!loading && (
            <div className="mt-10 flex items-center justify-between gap-4 text-[13px] text-text-muted">
              <span>
                {total.toLocaleString("en-US")} {callableOnly || tierFilter === "callable" ? "callable " : ""}APIs{selectedCategory ? ` in ${selectedCategory}` : ""}{query ? ` matching "${query}"` : ""}
              </span>
              {selectedCategory && (
                <button type="button" onClick={() => setSelectedCategory("")} className="claw-link inline-flex items-center gap-1">
                  Clear {selectedCategory}
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Rows */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
            </div>
          ) : apis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-text-muted">
              <p className="text-[15px] font-medium text-text-primary">No APIs found</p>
              <p className="mt-1 text-[13px]">Try a different search or clear filters</p>
            </div>
          ) : (
            <>
              <ul className="mt-3">
                {apis.map((api, i) => (
                  <ApiRow key={`${api.name}-${i}`} api={api} />
                ))}
              </ul>

              <div ref={sentinelRef} className="h-1" />

              {loadingMore && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-text-muted" />
                  <span className="text-[13px] text-text-muted">Loading more...</span>
                </div>
              )}

              {!hasMore && apis.length > 0 && (
                <div className="border-t border-border-subtle py-10 text-center text-[13px] text-text-muted">
                  All {total.toLocaleString("en-US")} APIs loaded
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <div className="claw-container"><div className="claw-rule" /></div>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-20">
        <div className="claw-container">
          <p className="max-w-xl text-[15px] leading-[1.65] text-text-secondary">
            Every API in this catalog is discoverable by AI agents via APIClaw.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="/#install" className="claw-btn claw-btn-solid">Install APIClaw</a>
            <a href="https://github.com/nordsym/apiclaw" target="_blank" rel="noopener noreferrer" className="claw-btn claw-btn-quiet">
              GitHub
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function ApiRow({ api }: { api: ApiEntry }) {
  const authLabel = AUTH_LABELS[api.auth] || AUTH_LABELS.unknown;
  const desc = api.description.length > 120 ? api.description.slice(0, 120) + "..." : api.description;

  return (
    <li className="border-t border-border-subtle py-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h3 className="text-[15px] font-medium text-text-primary">{api.name}</h3>
          <span className="text-[13px] text-text-muted">{api.category}</span>
        </div>
        {api.docsUrl && (
          <a
            href={api.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${api.name} docs`}
            className="shrink-0 text-text-muted transition hover:text-text-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <p className="mt-1 text-[14px] leading-[1.6] text-text-secondary">
        {desc || "No description available."}
      </p>

      <p className="claw-mono mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-text-muted">
        {api.callable ? (
          <>
            <span className="text-[var(--ok)]" title="Customer-callable through APIClaw with billing-grade cost truth">callable now</span>
            {api.actions?.length ? (
              <span>{api.actions.length} {api.actions.length === 1 ? "action" : "actions"}</span>
            ) : null}
          </>
        ) : null}
        <span>{authLabel}</span>
        {api.pricing ? <span>{api.pricing}</span> : null}
      </p>
    </li>
  );
}
