"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CatalogItem = {
  name: string;
  description: string;
  category: string;
  baseUrl?: string;
  docsUrl?: string;
  auth?: string;
  pricing?: string;
  callable?: boolean;
  healthStatus?: "healthy" | "degraded" | "down" | "unclassified" | "unknown";
};

export type CatalogPage = {
  items: CatalogItem[];
  total: number;
  hasMore: boolean;
};

export type FetchPage = (args: {
  page: number;
  pageSize: number;
  query: string;
  category: string;
  callableOnly: boolean;
  signal: AbortSignal;
}) => Promise<CatalogPage>;

export type UseInfiniteCatalogArgs = {
  fetchPage: FetchPage;
  pageSize?: number;
  query?: string;
  category?: string;
  callableOnly?: boolean;
};

export function useInfiniteCatalog({
  fetchPage,
  pageSize = 60,
  query = "",
  category = "",
  callableOnly = false,
}: UseInfiniteCatalogArgs) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const filterKey = useMemo(
    () => `${query}|${category}|${callableOnly ? "1" : "0"}`,
    [query, category, callableOnly],
  );

  // Reset + fetch first page when filters change
  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setItems([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setError(null);

    fetchPage({ page: 1, pageSize, query, category, callableOnly, signal: ac.signal })
      .then((res) => {
        if (ac.signal.aborted) return;
        setItems(res.items);
        setTotal(res.total);
        setHasMore(res.hasMore);
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setError(e?.message ?? "Failed to load catalog");
      })
      .finally(() => {
        if (ac.signal.aborted) return;
        setLoading(false);
      });

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, pageSize]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;
    const nextPage = page + 1;
    const ac = new AbortController();
    setLoadingMore(true);
    try {
      const res = await fetchPage({
        page: nextPage,
        pageSize,
        query,
        category,
        callableOnly,
        signal: ac.signal,
      });
      setItems((prev) => [...prev, ...res.items]);
      setTotal(res.total);
      setHasMore(res.hasMore);
      setPage(nextPage);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, hasMore, page, pageSize, query, category, callableOnly, fetchPage]);

  // IntersectionObserver on the sentinel
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, hasMore, items.length]);

  return {
    items,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    sentinelRef,
    loadMore,
  };
}
