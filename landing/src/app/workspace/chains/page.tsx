"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Copy,
  Play,
  Clock,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Zap,
  Filter,
  Code,
  X,
} from "lucide-react";
import { ChainTrace } from "@/components/ChainTrace";
import { ChainStepDetail } from "@/components/ChainStepDetail";
import {
  getWorkspaceSessionToken,
  subscribeWorkspaceSessionToken,
} from "@/lib/workspace-session";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";

interface ChainExecution {
  _id: string;
  status: "pending" | "running" | "completed" | "failed" | "paused";
  currentStep: number;
  stepsCount: number;
  totalCostCents: number;
  totalLatencyMs: number;
  error?: {
    stepId: string;
    code: string;
    message: string;
  };
  canResume?: boolean;
  resumeToken?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

interface StepExecution {
  _id: string;
  stepId: string;
  stepIndex: number;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  input?: any;
  output?: any;
  latencyMs?: number;
  costCents?: number;
  error?: {
    code: string;
    message: string;
    retryCount?: number;
  };
  parallelGroup?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

interface ChainDetail {
  chain: {
    _id: string;
    status: string;
    currentStep: number;
    steps: any[];
    results: any;
    error?: any;
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

type StatusFilter = "all" | "running" | "completed" | "failed" | "paused";

export default function ChainsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [chains, setChains] = useState<ChainExecution[]>([]);
  const [expandedChainId, setExpandedChainId] = useState<string | null>(null);
  const [chainDetail, setChainDetail] = useState<ChainDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [stats, setStats] = useState<{
    total: number;
    completed: number;
    failed: number;
    running: number;
    successRate: number;
    totalCostCents: number;
  } | null>(null);

  const fetchChains = useCallback(async (token: string, status?: StatusFilter) => {
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "chains:getChainExecutions",
          args: { token, limit: 100, status: status || "all" },
        }),
      });
      const data = await res.json();
      const result = data.value || data;
      if (Array.isArray(result)) {
        setChains(result);
      }
    } catch (err) {
      console.error("Fetch chains error:", err);
    }
  }, []);

  const fetchStats = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "chains:getChainStatsAuth",
          args: { token },
        }),
      });
      const data = await res.json();
      const result = data.value || data;
      if (result && !result.error) {
        setStats(result);
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  }, []);

  const fetchChainDetail = useCallback(async (chainId: string, token: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "chains:getChainTraceAuth",
          args: { token, chainId },
        }),
      });
      const data = await res.json();
      const result = data.value || data;
      if (result && !result.error) {
        setChainDetail(result);
      }
    } catch (err) {
      console.error("Fetch chain detail error:", err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleResume = async (chainId: string) => {
    if (!sessionToken) return;
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "chains:resumeChainAuth",
          args: { token: sessionToken, chainId },
        }),
      });
      // Refresh chains list
      await fetchChains(sessionToken, statusFilter);
    } catch (err) {
      console.error("Resume chain error:", err);
    }
  };

  const copyChainId = (chainId: string) => {
    navigator.clipboard.writeText(chainId);
  };

  useEffect(() => subscribeWorkspaceSessionToken((token) => {
    setSessionToken(token);
    if (!token) router.push("/sign-in");
  }), [router]);

  useEffect(() => {
    const init = async () => {
      const token = await getWorkspaceSessionToken();
      if (!token) {
        router.push("/sign-in");
        return;
      }
      setSessionToken(token);
      await Promise.all([fetchChains(token), fetchStats(token)]);
      setIsLoading(false);
    };
    init();
  }, [router, fetchChains, fetchStats]);

  useEffect(() => {
    if (sessionToken) {
      fetchChains(sessionToken, statusFilter);
    }
  }, [statusFilter, sessionToken, fetchChains]);

  useEffect(() => {
    if (expandedChainId && sessionToken) {
      fetchChainDetail(expandedChainId, sessionToken);
    } else {
      setChainDetail(null);
    }
  }, [expandedChainId, sessionToken, fetchChainDetail]);

  const handleRefresh = async () => {
    if (!sessionToken) return;
    setIsLoading(true);
    await Promise.all([fetchChains(sessionToken, statusFilter), fetchStats(sessionToken)]);
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "paused":
        return <PauseCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "running":
        return "text-blue-500";
      case "failed":
        return "text-red-500";
      case "paused":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatCost = (cents: number) => {
    if (cents === 0) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-[#ef4444] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/workspace"
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Workspace</span>
            </Link>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#ef4444]" />
              Chain Executions
            </h1>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-white/60 text-sm mb-1">Total Chains</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-white/60 text-sm mb-1">Success Rate</div>
              <div className="text-2xl font-bold text-green-500">{stats.successRate}%</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-white/60 text-sm mb-1">Running</div>
              <div className="text-2xl font-bold text-blue-500">{stats.running}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-white/60 text-sm mb-1">Total Cost</div>
              <div className="text-2xl font-bold">{formatCost(stats.totalCostCents)}</div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-white/60" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
          >
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="paused">Paused</option>
          </select>
          <span className="text-white/40 text-sm ml-2">
            {chains.length} chain{chains.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Chains List */}
        {chains.length === 0 ? (
          <div className="bg-white/5 rounded-xl border border-white/10 p-12 text-center">
            <Zap className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Chain Executions Yet</h3>
            <p className="text-white/60 max-w-md mx-auto">
              Chain executions will appear here when you start orchestrating multi-step API workflows.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {chains.map((chain) => (
              <div
                key={chain._id}
                className={`bg-white/5 rounded-xl border transition-all ${
                  expandedChainId === chain._id
                    ? "border-[#ef4444]/50"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                {/* Chain Header */}
                <button
                  onClick={() =>
                    setExpandedChainId(expandedChainId === chain._id ? null : chain._id)
                  }
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    {expandedChainId === chain._id ? (
                      <ChevronDown className="w-4 h-4 text-white/40" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/40" />
                    )}
                    <div className="flex items-center gap-2">
                      {getStatusIcon(chain.status)}
                      <span className={`text-sm font-medium ${getStatusColor(chain.status)}`}>
                        {chain.status.charAt(0).toUpperCase() + chain.status.slice(1)}
                      </span>
                    </div>
                    <code className="text-xs text-white/40 font-mono">
                      {chain._id.slice(0, 16)}...
                    </code>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1 text-white/60">
                      <Activity className="w-3.5 h-3.5" />
                      <span>{chain.stepsCount} steps</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/60">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDuration(chain.totalLatencyMs)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/60">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{formatCost(chain.totalCostCents)}</span>
                    </div>
                    <span className="text-white/40">{formatTime(chain.createdAt)}</span>
                  </div>
                </button>

                {/* Expanded Detail */}
                {expandedChainId === chain._id && (
                  <div className="border-t border-white/10 p-4">
                    {loadingDetail ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-[#ef4444] animate-spin" />
                      </div>
                    ) : chainDetail ? (
                      <div className="space-y-4">
                        {/* Actions Bar */}
                        <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                          {chain.canResume && (
                            <button
                              onClick={() => handleResume(chain._id)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ef4444] hover:bg-[#ef4444]/80 text-white text-sm font-medium transition-colors"
                            >
                              <Play className="w-3.5 h-3.5" />
                              Resume
                            </button>
                          )}
                          <button
                            onClick={() => copyChainId(chain._id)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy ID
                          </button>
                          <button
                            onClick={() => setShowRawJson(!showRawJson)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                          >
                            <Code className="w-3.5 h-3.5" />
                            {showRawJson ? "Hide JSON" : "View JSON"}
                          </button>
                        </div>

                        {/* Raw JSON View */}
                        {showRawJson && (
                          <div className="relative">
                            <button
                              onClick={() => setShowRawJson(false)}
                              className="absolute top-2 right-2 p-1 rounded hover:bg-white/10"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto text-xs font-mono text-white/80 max-h-96">
                              {JSON.stringify(chainDetail, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Chain Trace (Gantt) */}
                        {!showRawJson && (
                          <>
                            <ChainTrace
                              chain={chainDetail.chain}
                              executions={chainDetail.executions}
                              tokensSaved={chainDetail.tokensSaved}
                            />

                            {/* Step Details */}
                            <div className="space-y-2 pt-4 border-t border-white/10">
                              <h4 className="text-sm font-medium text-white/60 mb-3">
                                Step Details
                              </h4>
                              {chainDetail.executions.map((step) => (
                                <ChainStepDetail
                                  key={step._id}
                                  step={step}
                                  stepDef={chainDetail.chain.steps?.[step.stepIndex]}
                                  isExpanded={expandedStepId === step._id}
                                  onToggle={() =>
                                    setExpandedStepId(
                                      expandedStepId === step._id ? null : step._id
                                    )
                                  }
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-white/40 py-4">
                        Failed to load chain details
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
