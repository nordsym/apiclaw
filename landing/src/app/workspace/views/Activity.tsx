"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CONVEX_URL,
  Workspace,
  Agent,
  UsageData,
  AnalyticsSubtab,
} from "../_shared";
import {
  PageHeader,
  Section,
  SurfaceTabs,
  StatCard,
  StatGrid,
  Row,
  Status,
  Empty,
  Loading,
  KV,
  inputClass,
  btnSolid,
  btnQuiet,
} from "./ui";

/* ------------------------------------------------------------------
   Shared helpers
   ------------------------------------------------------------------ */

async function convexQuery<T>(path: string, args: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
    signal,
  });
  const data = await res.json();
  if (!res.ok || data.status === "error") throw new Error(data.errorMessage || `${path} failed`);
  return (data.value ?? data) as T;
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fullTime(ts: number) {
  return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatMs(ms: number) {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const selectClass = `${inputClass} !h-9 !w-auto min-w-[7rem] !text-[13px]`;

/* ------------------------------------------------------------------
   Activity: Logs, Usage, Chains (Chains only when the workspace has any)
   ------------------------------------------------------------------ */

interface ChainStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  paused?: number;
  successRate: number;
  totalCostCents: number;
}

export function ActivityTab({
  activeSubtab,
  setActiveSubtab,
  sessionToken,
}: {
  workspace: Workspace | null;
  agents: Agent[];
  usage: UsageData | null;
  activeSubtab: AnalyticsSubtab;
  setActiveSubtab: (tab: AnalyticsSubtab) => void;
  sessionToken: string | null;
}) {
  const router = useRouter();
  const [chainStats, setChainStats] = useState<ChainStats | null>(null);

  const fetchChainStats = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const result = await convexQuery<ChainStats & { error?: string }>("chains:getChainStatsAuth", { token: sessionToken });
      if (result && !result.error) setChainStats(result);
    } catch {
      setChainStats(null);
    }
  }, [sessionToken]);

  useEffect(() => {
    fetchChainStats();
  }, [fetchChainStats]);

  const hasChains = (chainStats?.total || 0) > 0;

  useEffect(() => {
    if (activeSubtab === "usage") setActiveSubtab("overview");
    if (activeSubtab === "chains" && chainStats && !hasChains) setActiveSubtab("logs");
  }, [activeSubtab, chainStats, hasChains, setActiveSubtab]);

  const tabs = [
    { id: "logs", label: "Logs" },
    { id: "overview", label: "Usage" },
    ...(hasChains ? [{ id: "chains", label: "Chains" }] : []),
  ];

  const changeTab = (id: string) => {
    const next = id as AnalyticsSubtab;
    setActiveSubtab(next);
    router.push(`/workspace?tab=activity&sub=${next}`);
  };

  return (
    <div>
      <PageHeader title="Activity" description="Every call and search from this workspace, newest first." />
      <div className="mb-6">
        <SurfaceTabs items={tabs} active={activeSubtab} onChange={changeTab} />
      </div>
      {activeSubtab === "logs" && <LogsTab sessionToken={sessionToken} />}
      {activeSubtab === "overview" && <UsageTab sessionToken={sessionToken} />}
      {activeSubtab === "chains" && hasChains && <ChainsTab sessionToken={sessionToken} stats={chainStats} onChanged={fetchChainStats} />}
    </div>
  );
}

/* ------------------------------------------------------------------
   Logs
   ------------------------------------------------------------------ */

interface ApiLogEntry {
  kind: "call";
  id: string;
  provider: string;
  action: string;
  status: "success" | "error";
  latencyMs: number;
  errorMessage?: string;
  subagentId: string | null;
  createdAt: number;
}

interface SearchLogEntry {
  kind: "search";
  id: string;
  query: string;
  resultCount: number;
  hasResults: boolean;
  matchedProviders: string[];
  responseTimeMs: number;
  subagentId: string | null;
  createdAt: number;
}

type LogEntry = ApiLogEntry | SearchLogEntry;

interface GetLogsResult {
  logs: Array<Omit<ApiLogEntry, "kind">>;
  hasMore: boolean;
  nextCursor?: number;
}

interface RawSearchLog {
  id: string;
  query: string;
  resultCount: number;
  hasResults: boolean;
  matchedProviders?: string[];
  responseTimeMs?: number;
  timestamp: number;
  subagentId?: string | null;
}

interface LogStatsResult {
  totalCalls: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgLatency: number;
  byProvider: { provider: string; calls: number; successRate: number; avgLatency: number }[];
  byDay: { date: string; calls: number; success: number; error: number }[];
  providers?: string[];
  agents?: string[];
}

type TypeFilter = "all" | "call" | "search";
type StatusFilter = "all" | "success" | "error";

function agentLabel(subagentId: string | null | undefined) {
  return subagentId || "main";
}

function LogsTab({ sessionToken }: { sessionToken: string | null }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [providers, setProviders] = useState<string[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async (append = false, appendCursor?: number) => {
    if (!sessionToken) return;
    if (append) setLoadingMore(true); else setIsLoading(true);
    setLoadError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    try {
      const apiResult = await convexQuery<GetLogsResult>("logs:getLogs", {
        token: sessionToken,
        limit: 50,
        cursor: append ? appendCursor : undefined,
        status: statusFilter,
        provider: providerFilter === "all" ? undefined : providerFilter,
        subagentId: agentFilter === "all" ? undefined : agentFilter,
      }, controller.signal);
      const apiLogs: ApiLogEntry[] = (apiResult?.logs || []).map((log) => ({ ...log, kind: "call" as const, subagentId: log.subagentId ?? null }));

      // Searches have no server-side pagination or provider filter: fetch once, on the first page only.
      let searchLogs: SearchLogEntry[] = [];
      if (!append && providerFilter === "all") {
        try {
          const raw = await convexQuery<RawSearchLog[]>("searchLogs:getRecent", { token: sessionToken, limit: 50 }, controller.signal);
          if (Array.isArray(raw)) {
            searchLogs = raw.map((log) => ({
              kind: "search" as const,
              id: log.id,
              query: log.query,
              resultCount: log.resultCount ?? 0,
              hasResults: Boolean(log.hasResults),
              matchedProviders: log.matchedProviders || [],
              responseTimeMs: log.responseTimeMs ?? 0,
              subagentId: log.subagentId ?? null,
              createdAt: log.timestamp,
            }));
          }
        } catch (err) {
          console.error("Error fetching search logs:", err);
        }
      }

      const byNewest = (a: LogEntry, b: LogEntry) => b.createdAt - a.createdAt;
      if (append) {
        setLogs((prev) => [...prev, ...apiLogs].sort(byNewest));
      } else {
        setLogs([...apiLogs, ...searchLogs].sort(byNewest));
      }
      setHasMore(Boolean(apiResult?.hasMore));
      setNextCursor(apiResult?.nextCursor);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setLoadError(err instanceof DOMException && err.name === "AbortError" ? "Activity took too long to load." : "Could not load activity.");
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [sessionToken, statusFilter, providerFilter, agentFilter]);

  const fetchFilterOptions = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const result = await convexQuery<LogStatsResult>("logs:getLogStats", { token: sessionToken, periodDays: 30 });
      setProviders(result?.providers || []);
      setAgents(result?.agents || []);
    } catch (err) {
      console.error("Error fetching log filters:", err);
    }
  }, [sessionToken]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Searches are filtered client-side: status maps to "had results", agent to subagentId.
  const visible = useMemo(() => logs.filter((log) => {
    if (typeFilter !== "all" && log.kind !== typeFilter) return false;
    if (log.kind === "search") {
      if (statusFilter === "success" && !log.hasResults) return false;
      if (statusFilter === "error" && log.hasResults) return false;
      if (agentFilter !== "all" && agentLabel(log.subagentId) !== agentFilter) return false;
    }
    return true;
  }), [logs, typeFilter, statusFilter, agentFilter]);

  const filtersActive = typeFilter !== "all" || statusFilter !== "all" || providerFilter !== "all" || agentFilter !== "all";
  const clearFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
    setProviderFilter("all");
    setAgentFilter("all");
  };

  if (!sessionToken) {
    return <Empty title="Sign in to see activity" body="Logs are tied to your workspace session." />;
  }

  return (
    <Section>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select aria-label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)} className={selectClass}>
          <option value="all">All types</option>
          <option value="call">Calls</option>
          <option value="search">Searches</option>
        </select>
        <select aria-label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectClass}>
          <option value="all">Any status</option>
          <option value="success">OK</option>
          <option value="error">Failed</option>
        </select>
        {providers.length > 0 && (
          <select aria-label="Provider" value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)} className={selectClass}>
            <option value="all">All providers</option>
            {providers.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
        {agents.length > 1 && (
          <select aria-label="Agent" value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className={selectClass}>
            <option value="all">All agents</option>
            {agents.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
        {filtersActive && (
          <button type="button" onClick={clearFilters} className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">Clear</button>
        )}
      </div>

      {loadError ? (
        <Empty title={loadError} body="Nothing was hidden or replaced." action={<button type="button" onClick={() => fetchLogs(false)} className={btnSolid}>Retry</button>} />
      ) : isLoading ? (
        <Loading label="Loading activity" />
      ) : visible.length === 0 ? (
        filtersActive ? (
          <Empty title="No entries match these filters" action={<button type="button" onClick={clearFilters} className={btnQuiet}>Clear filters</button>} />
        ) : (
          <Empty title="No activity yet" body="Calls and searches from connected agents appear here." action={<a href="/workspace?tab=connections" className={btnSolid}>Connect an agent</a>} />
        )
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-[12px] text-[var(--text-muted)]">
                  <th className="w-[4.75rem] pb-2 font-medium sm:w-[5.25rem]">Time</th>
                  <th className="hidden w-[3.75rem] pb-2 font-medium sm:table-cell">Type</th>
                  <th className="pb-2 font-medium">Provider / action</th>
                  <th className="w-[6rem] pb-2 font-medium">Status</th>
                  <th className="hidden w-[5.5rem] pb-2 text-right font-medium sm:table-cell">Latency</th>
                  <th className="hidden w-[8rem] pb-2 pl-4 font-medium md:table-cell">Agent</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((log) => {
                  const open = expandedId === log.id;
                  const ok = log.kind === "call" ? log.status === "success" : log.hasResults;
                  const statusLabel = log.kind === "call"
                    ? (ok ? "OK" : "Failed")
                    : (ok ? `${log.resultCount} ${log.resultCount === 1 ? "result" : "results"}` : "No results");
                  const latency = log.kind === "call" ? log.latencyMs : log.responseTimeMs;
                  return (
                    <Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedId(open ? null : log.id)}
                        aria-expanded={open}
                        className="cursor-pointer border-t border-[var(--border-subtle)] align-top hover:bg-[var(--surface)]"
                      >
                        <td className="py-2.5 pr-2 text-[var(--text-muted)]" title={fullTime(log.createdAt)}>{relativeTime(log.createdAt)}</td>
                        <td className="hidden py-2.5 pr-2 text-[var(--text-secondary)] sm:table-cell">{log.kind}</td>
                        <td className="py-2.5 pr-2">
                          {log.kind === "call" ? (
                            <span className="block truncate">
                              <span className="text-[var(--text-secondary)]">{log.provider}</span>
                              <span className="text-[var(--text-muted)]"> / </span>
                              <span className="claw-mono text-[12.5px]">{log.action}</span>
                            </span>
                          ) : (
                            <span className="block truncate">&ldquo;{log.query}&rdquo;</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-2"><Status kind={ok ? "ok" : log.kind === "search" ? "warn" : "bad"}>{statusLabel}</Status></td>
                        <td className="hidden py-2.5 pr-2 text-right sm:table-cell"><span className="claw-mono text-[12.5px] text-[var(--text-secondary)]">{Math.round(latency)} ms</span></td>
                        <td className="hidden truncate py-2.5 pl-4 text-[var(--text-muted)] md:table-cell">{agentLabel(log.subagentId)}</td>
                      </tr>
                      {open && (
                        <tr className="border-t border-[var(--border-subtle)] bg-[var(--surface)]">
                          <td colSpan={6} className="px-3 pb-3">
                            <div className="max-w-[40rem]"><LogDetail log={log} /></div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="border-t border-[var(--border-subtle)] pt-4 text-center">
              <button type="button" onClick={() => fetchLogs(true, nextCursor)} disabled={loadingMore} className={btnQuiet}>
                {loadingMore ? "Loading" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

function LogDetail({ log }: { log: LogEntry }) {
  if (log.kind === "call") {
    return (
      <div className="text-[13px]">
        <KV k="Type" v="call" />
        <KV k="Provider" v={log.provider} />
        <KV k="Action" v={log.action} mono />
        <KV k="Status" v={<Status kind={log.status === "success" ? "ok" : "bad"}>{log.status === "success" ? "OK" : "Failed"}</Status>} />
        {log.errorMessage && (
          <div className="border-t border-[var(--border-subtle)] py-2.5 text-[13.5px]">
            <span className="text-[var(--text-muted)]">Error</span>
            <p className="claw-mono mt-1 whitespace-pre-wrap break-words text-[12.5px] text-[var(--accent)]">{log.errorMessage}</p>
          </div>
        )}
        <KV k="Latency" v={`${Math.round(log.latencyMs)} ms`} mono />
        <KV k="Agent" v={agentLabel(log.subagentId)} mono />
        <KV k="Time" v={fullTime(log.createdAt)} />
        <KV k="Log id" v={log.id} mono />
      </div>
    );
  }
  return (
    <div className="text-[13px]">
      <KV k="Type" v="search" />
      <KV k="Query" v={log.query} />
      <KV k="Results" v={log.resultCount} />
      {log.matchedProviders.length > 0 && <KV k="Matched providers" v={log.matchedProviders.join(", ")} />}
      <KV k="Latency" v={`${Math.round(log.responseTimeMs)} ms`} mono />
      <KV k="Agent" v={agentLabel(log.subagentId)} mono />
      <KV k="Time" v={fullTime(log.createdAt)} />
      <KV k="Log id" v={log.id} mono />
    </div>
  );
}

/* ------------------------------------------------------------------
   Usage (sub=overview): last 30 days
   ------------------------------------------------------------------ */

const USAGE_DAYS = 30;

interface SearchStatsResult {
  totalSearches: number;
  zeroResultSearches: number;
  avgResponseTimeMs: number;
  successRate: number;
  byDay: { date: string; searches: number }[];
}

function UsageTab({ sessionToken }: { sessionToken: string | null }) {
  const [stats, setStats] = useState<LogStatsResult | null>(null);
  const [searchStats, setSearchStats] = useState<SearchStatsResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionToken) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const [logRes, searchRes] = await Promise.allSettled([
        convexQuery<LogStatsResult>("logs:getLogStats", { token: sessionToken, periodDays: USAGE_DAYS }),
        convexQuery<SearchStatsResult & { error?: string }>("searchLogs:getStats", { token: sessionToken, hoursBack: USAGE_DAYS * 24 }),
      ]);
      if (cancelled) return;
      if (logRes.status === "fulfilled" && logRes.value) setStats(logRes.value);
      else if (logRes.status === "rejected") console.error("Error fetching usage:", logRes.reason);
      if (searchRes.status === "fulfilled" && searchRes.value && !searchRes.value.error) setSearchStats(searchRes.value);
      else if (searchRes.status === "rejected") console.error("Error fetching search stats:", searchRes.reason);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [sessionToken]);

  const chartData = useMemo(() => {
    const calls: Record<string, number> = {};
    (stats?.byDay || []).forEach((d) => { calls[d.date] = d.calls; });
    return Array.from({ length: USAGE_DAYS }, (_, i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - (USAGE_DAYS - 1 - i));
      const date = d.toISOString().slice(0, 10);
      return { date, calls: calls[date] || 0 };
    });
  }, [stats]);

  if (!sessionToken) {
    return <Empty title="Sign in to see usage" body="Usage is tied to your workspace session." />;
  }
  if (loading) return <Loading label="Loading usage" />;

  const totalCalls = stats?.totalCalls || 0;
  const totalSearches = searchStats?.totalSearches || 0;
  const hasAny = totalCalls > 0 || totalSearches > 0;

  if (!hasAny) {
    return <Empty title="No usage in the last 30 days" body="Totals, a calls-per-day chart and a per-provider breakdown appear after the first call." action={<a href="/workspace?tab=connections" className={btnSolid}>Connect an agent</a>} />;
  }

  return (
    <div className="space-y-10">
      <StatGrid cols={4}>
        <StatCard title="Calls" value={totalCalls.toLocaleString()} hint="Last 30 days" />
        <StatCard title="Searches" value={totalSearches.toLocaleString()} hint="Last 30 days" />
        <StatCard title="Success rate" value={totalCalls > 0 ? `${Math.round(stats?.successRate || 0)}%` : "n/a"} hint={totalCalls > 0 ? `${stats?.errorCount || 0} failed` : "No calls yet"} />
        <StatCard title="Avg latency" value={totalCalls > 0 ? `${Math.round(stats?.avgLatency || 0)} ms` : "n/a"} hint="Managed calls" />
      </StatGrid>

      <Section title="Calls per day">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--border-subtle)" }}
                interval={Math.max(0, Math.floor(USAGE_DAYS / 6) - 1)}
                tickFormatter={(d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ stroke: "var(--border)" }}
                contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "var(--text-muted)" }}
                itemStyle={{ color: "var(--text-primary)" }}
                labelFormatter={(d) => new Date(String(d)).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
              <Line type="linear" dataKey="calls" name="Calls" stroke="var(--text-primary)" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "var(--text-primary)", stroke: "none" }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {stats && stats.byProvider.length > 0 && (
        <Section title="By provider">
          {stats.byProvider.map((p) => (
            <Row
              key={p.provider}
              right={
                <>
                  <span className={p.successRate < 100 ? "text-[var(--accent)]" : ""}>{Math.round(p.successRate)}% ok</span>
                  <span className="claw-mono">{p.avgLatency} ms</span>
                </>
              }
            >
              <div className="flex items-baseline gap-3">
                <span className="text-[14px]">{p.provider}</span>
                <span className="text-[13px] text-[var(--text-muted)]">{p.calls.toLocaleString()} {p.calls === 1 ? "call" : "calls"}</span>
              </div>
            </Row>
          ))}
        </Section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Chains
   ------------------------------------------------------------------ */

type ChainStatus = "pending" | "running" | "completed" | "failed" | "paused";

interface ChainExecution {
  _id: string;
  status: ChainStatus;
  currentStep: number;
  stepsCount: number;
  totalCostCents: number;
  totalLatencyMs: number;
  error?: { stepId: string; code: string; message: string };
  canResume?: boolean;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

interface ChainStep {
  _id: string;
  stepId: string;
  stepIndex: number;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  latencyMs?: number;
  costCents?: number;
  error?: { code: string; message: string; retryCount?: number };
  parallelGroup?: string;
}

interface ChainDetail {
  chain: {
    _id: string;
    status: string;
    totalCostCents: number;
    totalLatencyMs: number;
    startedAt?: number;
    completedAt?: number;
  };
  executions: ChainStep[];
  tokensSaved: number;
}

function chainStatus(status: string): { kind: "ok" | "warn" | "bad" | "muted"; label: string } {
  if (status === "completed") return { kind: "ok", label: "Completed" };
  if (status === "failed") return { kind: "bad", label: "Failed" };
  if (status === "running") return { kind: "warn", label: "Running" };
  if (status === "paused") return { kind: "warn", label: "Paused" };
  if (status === "skipped") return { kind: "muted", label: "Skipped" };
  return { kind: "muted", label: "Pending" };
}

function ChainsTab({ sessionToken, stats, onChanged }: { sessionToken: string | null; stats: ChainStats | null; onChanged: () => void }) {
  const [chains, setChains] = useState<ChainExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ChainDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [resuming, setResuming] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchChains = useCallback(async () => {
    if (!sessionToken) { setLoading(false); return; }
    try {
      const result = await convexQuery<ChainExecution[] | { error: string }>("chains:getChainExecutions", { token: sessionToken, limit: 50, status: statusFilter });
      if (Array.isArray(result)) setChains(result);
    } catch (err) {
      console.error("Fetch chains error:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionToken, statusFilter]);

  useEffect(() => {
    fetchChains();
  }, [fetchChains]);

  useEffect(() => {
    if (!expandedId || !sessionToken) { setDetail(null); return; }
    let cancelled = false;
    setLoadingDetail(true);
    setDetail(null);
    convexQuery<ChainDetail & { error?: string }>("chains:getChainTraceAuth", { token: sessionToken, chainId: expandedId })
      .then((result) => { if (!cancelled && result && !result.error) setDetail(result); })
      .catch((err) => console.error("Fetch chain detail error:", err))
      .finally(() => { if (!cancelled) setLoadingDetail(false); });
    return () => { cancelled = true; };
  }, [expandedId, sessionToken]);

  const handleResume = async (chainId: string) => {
    if (!sessionToken) return;
    setResuming(chainId);
    try {
      const res = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "chains:resumeChainAuth", args: { token: sessionToken, chainId } }),
      });
      const data = await res.json();
      const result = data.value ?? data;
      if (result?.error) console.error("Resume chain error:", result.error);
      await fetchChains();
      onChanged();
    } catch (err) {
      console.error("Resume chain error:", err);
    } finally {
      setResuming(null);
    }
  };

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="space-y-10">
      {stats && (
        <StatGrid cols={4}>
          <StatCard title="Chains" value={stats.total.toLocaleString()} />
          <StatCard title="Success rate" value={`${stats.successRate}%`} hint={`${stats.failed} failed`} />
          <StatCard title="Running" value={stats.running.toLocaleString()} />
          <StatCard title="Total cost" value={formatCents(stats.totalCostCents)} />
        </StatGrid>
      )}

      <Section
        title="Executions"
        action={
          <select aria-label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setExpandedId(null); }} className={selectClass}>
            <option value="all">Any status</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="paused">Paused</option>
          </select>
        }
      >
        {loading ? (
          <Loading label="Loading chains" />
        ) : chains.length === 0 ? (
          <Empty title={statusFilter === "all" ? "No chain executions" : `No ${statusFilter} chains`} />
        ) : (
          chains.map((chain) => {
            const open = expandedId === chain._id;
            const s = chainStatus(chain.status);
            return (
              <div key={chain._id}>
                <Row
                  onClick={() => setExpandedId(open ? null : chain._id)}
                  right={
                    <>
                      <span className="hidden sm:inline">{chain.stepsCount} {chain.stepsCount === 1 ? "step" : "steps"}</span>
                      <span className="claw-mono hidden sm:inline">{formatMs(chain.totalLatencyMs)}</span>
                      <span className="claw-mono">{formatCents(chain.totalCostCents)}</span>
                      <span title={fullTime(chain.createdAt)}>{relativeTime(chain.createdAt)}</span>
                    </>
                  }
                >
                  <div className="flex items-center gap-3">
                    <Status kind={s.kind}>{s.label}</Status>
                    <span className="claw-mono truncate text-[12.5px] text-[var(--text-muted)]">{chain._id}</span>
                  </div>
                </Row>
                {open && (
                  <div className="mb-4 border-t border-[var(--border-subtle)] bg-[var(--surface)] px-3 pb-4 pt-2">
                    {loadingDetail ? (
                      <Loading label="Loading trace" />
                    ) : detail ? (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="text-[13px]">
                          <KV k="Chain id" v={chain._id} mono />
                          <KV k="Status" v={<Status kind={s.kind}>{s.label}</Status>} />
                          <KV k="Steps" v={`${chain.currentStep} of ${chain.stepsCount}`} />
                          <KV k="Duration" v={formatMs(detail.chain.totalLatencyMs)} mono />
                          <KV k="Cost" v={formatCents(detail.chain.totalCostCents)} mono />
                          <KV k="Tokens saved" v={`~${detail.tokensSaved.toLocaleString()}`} />
                          {chain.startedAt && <KV k="Started" v={fullTime(chain.startedAt)} />}
                          {chain.completedAt && <KV k="Completed" v={fullTime(chain.completedAt)} />}
                          {chain.error && (
                            <div className="border-t border-[var(--border-subtle)] py-2.5 text-[13.5px]">
                              <span className="text-[var(--text-muted)]">Error at {chain.error.stepId}</span>
                              <p className="claw-mono mt-1 whitespace-pre-wrap break-words text-[12.5px] text-[var(--accent)]">{chain.error.code}: {chain.error.message}</p>
                            </div>
                          )}
                          <div className="mt-4 flex items-center gap-2">
                            {chain.canResume && (
                              <button type="button" onClick={() => handleResume(chain._id)} disabled={resuming === chain._id} className={btnSolid}>
                                {resuming === chain._id ? "Resuming" : "Resume"}
                              </button>
                            )}
                            <button type="button" onClick={() => copyId(chain._id)} className={btnQuiet}>{copied ? "Copied" : "Copy id"}</button>
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-[12px] text-[var(--text-muted)]">Steps</p>
                          {detail.executions.length === 0 ? (
                            <p className="border-t border-[var(--border-subtle)] py-3 text-[13px] text-[var(--text-muted)]">No steps recorded.</p>
                          ) : (
                            detail.executions.map((step) => {
                              const ss = chainStatus(step.status);
                              return (
                                <Row
                                  key={step._id}
                                  right={
                                    <>
                                      <span className="claw-mono">{formatMs(step.latencyMs || 0)}</span>
                                      <span className="claw-mono">{formatCents(step.costCents || 0)}</span>
                                    </>
                                  }
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="w-5 text-[12px] text-[var(--text-muted)]">{step.stepIndex + 1}</span>
                                    <span className="claw-mono truncate text-[12.5px]">{step.stepId}</span>
                                    <Status kind={ss.kind}>{ss.label}</Status>
                                  </div>
                                  {step.error && <p className="claw-mono mt-1 break-words pl-8 text-[12px] text-[var(--accent)]">{step.error.code}: {step.error.message}</p>}
                                </Row>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="py-3 text-[13px] text-[var(--text-muted)]">Could not load this trace.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </Section>
    </div>
  );
}
