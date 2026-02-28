"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Zap,
  Users,
  TrendingUp,
  LogOut,
  Loader2,
  RefreshCw,
  AlertCircle,
  Trash2,
  Shield,
  Clock,
  Check,
  Crown,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import Link from "next/link";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";

interface Workspace {
  id: string;
  email: string;
  tier: string;
  status: string;
  usageCount: number;
  usageLimit: number;
  usageRemaining: number;
  usagePercentage: number;
  createdAt: number;
}

interface Agent {
  id: string;
  fingerprint: string;
  lastUsedAt: number;
  createdAt: number;
  isCurrent: boolean;
}

interface UsageData {
  byProvider: { provider: string; calls: number; cost: number }[];
  byDay: { date: string; calls: number }[];
  total: number;
}

type TabType = "overview" | "agents" | "usage";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const fetchData = useCallback(async (token: string) => {
    try {
      // Fetch dashboard data
      const dashboardRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "workspaces:getWorkspaceDashboard",
          args: { token },
        }),
      });
      
      const dashboardData = await dashboardRes.json();
      const dashboard = dashboardData.value || dashboardData;
      
      if (!dashboard) {
        throw new Error("Session expired");
      }

      setWorkspace(dashboard.workspace);

      // Fetch agents
      const agentsRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "workspaces:getConnectedAgents",
          args: { token },
        }),
      });
      
      const agentsData = await agentsRes.json();
      setAgents(agentsData.value || agentsData || []);

      // Fetch usage
      const usageRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "workspaces:getUsageBreakdown",
          args: { token },
        }),
      });
      
      const usageData = await usageRes.json();
      setUsage(usageData.value || usageData);

    } catch (err) {
      console.error("Fetch error:", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Try cookie-based session first
        const sessionRes = await fetch("/api/workspace-auth/session");
        const sessionData = await sessionRes.json();

        if (sessionData.session) {
          // Get token from localStorage or cookie
          const token = localStorage.getItem("apiclaw_workspace_session");
          if (token) {
            setSessionToken(token);
            await fetchData(token);
          } else {
            // Session exists but no token - redirect to login
            router.push("/login");
            return;
          }
        } else {
          // No session - redirect to login
          router.push("/login");
          return;
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Session check error:", err);
        router.push("/login");
      }
    };

    checkSession();
  }, [router, fetchData]);

  const handleLogout = async () => {
    try {
      await fetch("/api/workspace-auth/session", { method: "DELETE" });
      localStorage.removeItem("apiclaw_workspace_session");
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleRevokeAgent = async (agentId: string) => {
    if (!sessionToken) return;
    
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "workspaces:revokeAgentSession",
          args: { token: sessionToken, sessionId: agentId },
        }),
      });

      // Refresh agents list
      setAgents(agents.filter(a => a.id !== agentId));
    } catch (err) {
      console.error("Revoke error:", err);
    }
  };

  const handleRefresh = async () => {
    if (!sessionToken) return;
    setIsLoading(true);
    try {
      await fetchData(sessionToken);
    } catch (err) {
      setError("Failed to refresh data");
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: BarChart3 },
    { id: "agents" as TabType, label: "Agents", icon: Users },
    { id: "usage" as TabType, label: "Usage", icon: TrendingUp },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--background)]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something Went Wrong</h1>
          <p className="text-[var(--text-muted)] mb-6">{error || "Failed to load dashboard"}</p>
          <button onClick={handleRefresh} className="btn-primary">
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-xl">
              🦞
            </Link>
            <div>
              <h1 className="font-bold text-lg">Workspace Dashboard</h1>
              <p className="text-sm text-[var(--text-muted)]">{workspace.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium flex items-center gap-1">
              <Crown className="w-4 h-4" />
              {workspace.tier}
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-[var(--surface)] transition"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-[var(--surface)] transition"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-[var(--surface)] rounded-xl w-fit mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-accent text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <OverviewTab workspace={workspace} agents={agents} usage={usage} />
        )}
        {activeTab === "agents" && (
          <AgentsTab agents={agents} onRevoke={handleRevokeAgent} />
        )}
        {activeTab === "usage" && (
          <UsageTab workspace={workspace} usage={usage} />
        )}
      </div>
    </div>
  );
}

// ============================================
// OVERVIEW TAB
// ============================================

function OverviewTab({
  workspace,
  agents,
  usage,
}: {
  workspace: Workspace;
  agents: Agent[];
  usage: UsageData | null;
}) {
  const tierLimits: Record<string, number> = {
    free: 1000,
    pro: 10000,
    enterprise: 100000,
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Overview</h2>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-accent" />
            <span className="text-[var(--text-muted)]">API Calls</span>
          </div>
          <p className="text-4xl font-bold text-accent">{workspace.usageCount.toLocaleString()}</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            of {workspace.usageLimit.toLocaleString()} limit
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-6 h-6 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">Connected Agents</span>
          </div>
          <p className="text-4xl font-bold">{agents.length}</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">Usage Remaining</span>
          </div>
          <p className="text-4xl font-bold">{workspace.usageRemaining.toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <div className="flex items-center gap-3 mb-3">
            <Check className="w-6 h-6 text-green-500" />
            <span className="text-[var(--text-muted)]">Status</span>
          </div>
          <p className="text-xl font-bold text-green-500 capitalize">{workspace.status}</p>
        </div>
      </div>

      {/* Usage Progress */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Monthly Usage</h3>
          <span className="text-sm text-[var(--text-muted)]">
            {workspace.usagePercentage.toFixed(1)}% used
          </span>
        </div>
        <div className="h-4 bg-[var(--surface)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              workspace.usagePercentage > 90 ? "bg-red-500" :
              workspace.usagePercentage > 70 ? "bg-yellow-500" : "bg-accent"
            }`}
            style={{ width: `${Math.min(workspace.usagePercentage, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-[var(--text-muted)]">
          <span>{workspace.usageCount.toLocaleString()} calls used</span>
          <span>{workspace.usageRemaining.toLocaleString()} remaining</span>
        </div>
        
        {workspace.usagePercentage > 80 && workspace.tier === "free" && (
          <div className="mt-4 p-4 rounded-xl bg-accent/10 border border-accent/30">
            <div className="flex items-center gap-2 text-accent mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Running low on API calls</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-3">
              Upgrade to Pro for 10,000 API calls/month and priority support.
            </p>
            <button className="btn-primary !py-2 !px-4 text-sm">
              Upgrade to Pro
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Recent Agents */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Recent Agents</h3>
          <button
            onClick={() => {/* setActiveTab would need to be passed down */}}
            className="text-sm text-accent hover:underline"
          >
            View all
          </button>
        </div>
        {agents.length > 0 ? (
          <div className="space-y-3">
            {agents.slice(0, 3).map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">{agent.fingerprint}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      Last active: {new Date(agent.lastUsedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {agent.isCurrent && (
                  <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                    Current
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-muted)] text-center py-8">No agents connected yet</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// AGENTS TAB
// ============================================

function AgentsTab({
  agents,
  onRevoke,
}: {
  agents: Agent[];
  onRevoke: (agentId: string) => void;
}) {
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const handleRevoke = (agentId: string) => {
    if (confirmRevoke === agentId) {
      onRevoke(agentId);
      setConfirmRevoke(null);
    } else {
      setConfirmRevoke(agentId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Connected Agents</h2>
        <p className="text-[var(--text-muted)]">{agents.length} total</p>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50">
          <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Agents Connected</h3>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">
            When you register AI agents with your workspace, they&apos;ll appear here. 
            You can monitor their activity and revoke access anytime.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{agent.fingerprint}</h3>
                      {agent.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                          Current Session
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Last active: {new Date(agent.lastUsedAt).toLocaleString()}
                      </span>
                      <span>
                        Created: {new Date(agent.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {!agent.isCurrent && (
                  <button
                    onClick={() => handleRevoke(agent.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      confirmRevoke === agent.id
                        ? "bg-red-500 text-white"
                        : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    }`}
                  >
                    <Trash2 className="w-4 h-4 inline-block mr-1" />
                    {confirmRevoke === agent.id ? "Confirm Revoke" : "Revoke"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6">
        <h3 className="font-medium mb-2">About Agent Sessions</h3>
        <p className="text-sm text-[var(--text-muted)]">
          Each connected agent represents an AI system or MCP server that has authenticated 
          with your workspace. Revoking an agent will immediately invalidate its session token, 
          requiring it to re-authenticate.
        </p>
      </div>
    </div>
  );
}

// ============================================
// USAGE TAB
// ============================================

function UsageTab({
  workspace,
  usage,
}: {
  workspace: Workspace;
  usage: UsageData | null;
}) {
  const hasData = usage && (usage.byProvider.length > 0 || usage.byDay.length > 0);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Usage Analytics</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-accent" />
            <span className="text-[var(--text-muted)]">Total API Calls</span>
          </div>
          <p className="text-4xl font-bold text-accent">
            {(usage?.total || workspace.usageCount).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">Providers Used</span>
          </div>
          <p className="text-4xl font-bold">{usage?.byProvider.length || 0}</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">Remaining</span>
          </div>
          <p className="text-4xl font-bold">{workspace.usageRemaining.toLocaleString()}</p>
        </div>
      </div>

      {hasData ? (
        <>
          {/* Usage Over Time Chart */}
          {usage!.byDay.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
              <h3 className="font-semibold mb-4">Usage Over Time</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usage!.byDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                      tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                      labelFormatter={(d) => new Date(d).toLocaleDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="calls"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#ef4444" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Usage by Provider */}
          {usage!.byProvider.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
              <h3 className="font-semibold mb-4">Usage by Provider</h3>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usage!.byProvider}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="provider" tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
                      <YAxis tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--surface-elevated)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="calls" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {usage!.byProvider.map((p, i) => (
                    <div key={p.provider} className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-medium">
                          {i + 1}
                        </span>
                        <span className="font-medium">{p.provider}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{p.calls.toLocaleString()} calls</p>
                        {p.cost > 0 && (
                          <p className="text-sm text-[var(--text-muted)]">${p.cost.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-12 text-center">
          <TrendingUp className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Usage Data Yet</h3>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">
            When your agents start making API calls, usage analytics will appear here.
            Connect an agent to get started.
          </p>
        </div>
      )}
    </div>
  );
}
