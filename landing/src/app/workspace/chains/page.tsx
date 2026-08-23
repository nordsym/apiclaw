// /workspace/chains: multi-step chain executions for this workspace.
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChainTrace, formatCost, formatDuration, statusKind, type StepExecution } from "@/components/ChainTrace";
import { ChainStepDetail } from "@/components/ChainStepDetail";
import { getWorkspaceSessionToken, subscribeWorkspaceSessionToken } from "@/lib/workspace-session";
import { CONVEX_URL } from "../_shared";
import { StandaloneShell } from "../_standalone";
import { PageHeader, Section, Panel, SurfaceTabs, StatCard, StatGrid, Row, Status, Empty, Loading, btnSolid, btnQuiet } from "../views/ui";

const SIGN_IN_PATH = "/sign-in";

interface ChainExecution {
  _id: string;
  status: "pending" | "running" | "completed" | "failed" | "paused";
  currentStep: number;
  stepsCount: number;
  totalCostCents: number;
  totalLatencyMs: number;
  error?: { stepId: string; code: string; message: string };
  canResume?: boolean;
  resumeToken?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

interface ChainDetail {
  chain: {
    _id: string;
    status: string;
    currentStep: number;
    steps: Array<{ id: string; provider: string; action?: string; params?: Record<string, unknown> }>;
    results: unknown;
    error?: unknown;
    canResume?: boolean;
    resumeToken?: string;
    totalCostCents: number;
    totalLatencyMs: number;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
  };
  executions: StepExecution[];
  tokensSaved: number;
}

interface ChainStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  successRate: number;
  totalCostCents: number;
}

type StatusFilter = "all" | "running" | "completed" | "failed" | "paused";

const FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "running", label: "Running" },
  { id: "completed", label: "Completed" },
  { id: "failed", label: "Failed" },
  { id: "paused", label: "Paused" },
];

async function convex<T>(kind: "query" | "mutation", path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  const json = await res.json();
  if (json?.status === "error") throw new Error(json?.errorMessage || `${kind}_failed`);
  return (json?.value ?? json) as T;
}

const formatTime = (ts: number) => {
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
};

export default function ChainsPage() {
  const router = useRouter();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chains, setChains] = useState<ChainExecution[]>([]);
  const [stats, setStats] = useState<ChainStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedChainId, setExpandedChainId] = useState<string | null>(null);
  const [chainDetail, setChainDetail] = useState<ChainDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  const fetchChains = useCallback(async (token: string, status: StatusFilter) => {
    try {
      const result = await convex<ChainExecution[] | { error: string }>("query", "chains:getChainExecutions", { token, limit: 100, status });
      if (Array.isArray(result)) setChains(result);
      else if (result && "error" in result) setError(result.error);
    } catch (err) {
      console.error("Fetch chains error:", err);
      setError("Could not load chains.");
    }
  }, []);

  const fetchStats = useCallback(async (token: string) => {
    try {
      const result = await convex<ChainStats | { error: string }>("query", "chains:getChainStatsAuth", { token });
      if (result && !("error" in result)) setStats(result);
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  }, []);

  const fetchChainDetail = useCallback(async (chainId: string, token: string) => {
    setLoadingDetail(true);
    try {
      const result = await convex<ChainDetail | { error: string }>("query", "chains:getChainTraceAuth", { token, chainId });
      setChainDetail(result && !("error" in result) ? result : null);
    } catch (err) {
      console.error("Fetch chain detail error:", err);
      setChainDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => subscribeWorkspaceSessionToken((token) => {
    setSessionToken(token);
    if (!token) router.push(SIGN_IN_PATH);
  }), [router]);

  useEffect(() => {
    let cancelled = false;
    void getWorkspaceSessionToken().then((token) => {
      if (cancelled) return;
      if (!token) {
        router.push(SIGN_IN_PATH);
        return;
      }
      setSessionToken(token);
    });
    return () => { cancelled = true; };
  }, [router]);

  // One fetch per (token, filter). The first one also clears the page loader.
  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;
    setError(null);
    void Promise.all([fetchChains(sessionToken, statusFilter), fetchStats(sessionToken)]).then(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [sessionToken, statusFilter, fetchChains, fetchStats]);

  useEffect(() => {
    setExpandedStepId(null);
    setShowRawJson(false);
    if (expandedChainId && sessionToken) void fetchChainDetail(expandedChainId, sessionToken);
    else setChainDetail(null);
  }, [expandedChainId, sessionToken, fetchChainDetail]);

  const handleRefresh = async () => {
    if (!sessionToken) return;
    setIsLoading(true);
    await Promise.all([fetchChains(sessionToken, statusFilter), fetchStats(sessionToken)]);
    if (expandedChainId) await fetchChainDetail(expandedChainId, sessionToken);
    setIsLoading(false);
  };

  const handleResume = async (chainId: string) => {
    if (!sessionToken) return;
    setResuming(true);
    setError(null);
    try {
      const result = await convex<{ success?: boolean; error?: string }>("mutation", "chains:resumeChainAuth", { token: sessionToken, chainId });
      if (result?.error) setError(result.error);
      await Promise.all([fetchChains(sessionToken, statusFilter), fetchChainDetail(chainId, sessionToken)]);
    } catch (err) {
      console.error("Resume chain error:", err);
      setError("Could not resume chain.");
    } finally {
      setResuming(false);
    }
  };

  const copyChainId = (chainId: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(chainId).catch(() => {});
    setCopiedId(chainId);
    window.setTimeout(() => setCopiedId((cur) => (cur === chainId ? null : cur)), 1500);
  };

  return (
    <StandaloneShell activeTab="activity" sessionToken={sessionToken}>
      <PageHeader
        title="Chains"
        description="Multi-step executions run through this workspace."
        action={<button type="button" onClick={handleRefresh} disabled={isLoading || !sessionToken} className={btnQuiet}>Refresh</button>}
      />

      {error && <p className="mb-6 text-[13px] text-[var(--accent)]">{error}</p>}

      {stats && (
        <StatGrid cols={4}>
          <StatCard title="Chains" value={String(stats.total)} />
          <StatCard title="Success rate" value={`${stats.successRate}%`} />
          <StatCard title="Running" value={String(stats.running)} />
          <StatCard title="Total cost" value={formatCost(stats.totalCostCents)} />
        </StatGrid>
      )}

      <Section title="Executions" className={stats ? "mt-10" : ""}>
        <div className="mb-4 overflow-x-auto">
          <SurfaceTabs items={FILTERS} active={statusFilter} onChange={(id) => setStatusFilter(id as StatusFilter)} label="Status" />
        </div>
        {isLoading && <Loading label="Loading chains" />}
        {!isLoading && chains.length === 0 && (
          <Empty title="No chains yet" body={statusFilter === "all" ? "Chains appear here when an agent runs a multi-step workflow through this workspace." : `No ${statusFilter} chains.`} />
        )}
        {!isLoading && chains.map((chain) => {
          const open = expandedChainId === chain._id;
          return (
            <div key={chain._id}>
              <Row
                onClick={() => setExpandedChainId(open ? null : chain._id)}
                right={
                  <>
                    <span className="hidden sm:inline">{chain.stepsCount} steps</span>
                    <span className="hidden sm:inline">{formatDuration(chain.totalLatencyMs)}</span>
                    <span>{formatCost(chain.totalCostCents)}</span>
                    <span>{formatTime(chain.createdAt)}</span>
                  </>
                }
              >
                <div className="flex items-center gap-3">
                  <Status kind={statusKind(chain.status)}>{chain.status}</Status>
                  <span className="claw-mono truncate text-[12.5px] text-[var(--text-muted)]">{chain._id}</span>
                </div>
                {chain.error && <p className="mt-0.5 truncate text-[12.5px] text-[var(--text-muted)]">{chain.error.stepId}: {chain.error.message}</p>}
              </Row>

              {open && (
                <div className="pb-6 pt-1">
                  {loadingDetail && <Loading label="Loading trace" />}
                  {!loadingDetail && !chainDetail && <p className="py-4 text-[13px] text-[var(--text-muted)]">Could not load this chain.</p>}
                  {!loadingDetail && chainDetail && (
                    <>
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        {chain.canResume && (
                          <button type="button" onClick={() => handleResume(chain._id)} disabled={resuming} className={btnSolid}>{resuming ? "Resuming" : "Resume"}</button>
                        )}
                        <button type="button" onClick={() => copyChainId(chain._id)} className={btnQuiet}>{copiedId === chain._id ? "Copied" : "Copy ID"}</button>
                        <button type="button" onClick={() => setShowRawJson((v) => !v)} className={btnQuiet}>{showRawJson ? "Hide JSON" : "JSON"}</button>
                      </div>

                      {showRawJson ? (
                        <Panel className="max-h-96 overflow-auto p-4">
                          <pre className="claw-mono whitespace-pre-wrap break-all text-[12px] text-[var(--text-secondary)]">{JSON.stringify(chainDetail, null, 2)}</pre>
                        </Panel>
                      ) : (
                        <>
                          <ChainTrace chain={chainDetail.chain} executions={chainDetail.executions} tokensSaved={chainDetail.tokensSaved} />
                          {chainDetail.executions.length > 0 && (
                            <Panel className="mt-6 px-4 sm:px-5">
                              <p className="pt-4 pb-1 text-[13px] font-medium">Steps</p>
                              {chainDetail.executions.map((step) => (
                                <ChainStepDetail
                                  key={step._id}
                                  step={step}
                                  stepDef={chainDetail.chain.steps?.[step.stepIndex]}
                                  isExpanded={expandedStepId === step._id}
                                  onToggle={() => setExpandedStepId(expandedStepId === step._id ? null : step._id)}
                                />
                              ))}
                            </Panel>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Section>
    </StandaloneShell>
  );
}
