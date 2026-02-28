"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  ChevronDown,
  Plus,
  ExternalLink,
  CreditCard,
  Settings,
  Home,
  Sun,
  Moon,
  Menu,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Terminal,
  Copy,
  BookOpen,
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

interface ProviderAPI {
  _id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  discoveryCount?: number;
  hasDirectCall?: boolean;
}

interface ProviderAnalytics {
  totalCalls: number;
  uniqueAgents: number;
  avgLatency: number;
  successRate: number;
  isPreview?: boolean;
  callsByDay: { date: string; calls: number }[];
  topAgents: { agentId: string; calls: number }[];
  topActions: { actionName: string; calls: number }[];
}

type TabType = "overview" | "apis" | "analytics" | "agents" | "usage" | "billing";

// Generate preview analytics data for demo
function generatePreviewAnalytics(): ProviderAnalytics {
  const days = [];
  const baseDate = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toISOString().split("T")[0],
      calls: Math.floor(Math.random() * 150) + 50 + Math.floor(i * 3),
    });
  }
  
  return {
    totalCalls: 2847,
    uniqueAgents: 156,
    avgLatency: 145,
    successRate: 98.2,
    isPreview: true,
    callsByDay: days,
    topAgents: [
      { agentId: "agent_claude_prod_7x9k", calls: 847 },
      { agentId: "agent_cursor_dev_3m2p", calls: 623 },
      { agentId: "agent_gpt4_main_1n8q", calls: 512 },
      { agentId: "agent_cline_test_4r7w", calls: 389 },
      { agentId: "agent_aider_auto_2k5j", calls: 276 },
      { agentId: "agent_sweep_ci_9p3m", calls: 200 },
    ],
    topActions: [
      { actionName: "generate_image", calls: 1247 },
      { actionName: "search_web", calls: 892 },
      { actionName: "send_sms", calls: 456 },
      { actionName: "transcribe_audio", calls: 252 },
    ],
  };
}

export default function WorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as TabType | null;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl || "overview");
  const [analyticsSubtab, setAnalyticsSubtab] = useState<"apis" | "agents">("apis");
  const [analyticsExpanded, setAnalyticsExpanded] = useState(tabFromUrl === "analytics");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  
  // Workspace data (consumer)
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  
  // Provider data
  const [providerApis, setProviderApis] = useState<ProviderAPI[]>([]);
  const [providerAnalytics, setProviderAnalytics] = useState<ProviderAnalytics | null>(null);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [isProvider, setIsProvider] = useState(false);

  useEffect(() => {
    if (tabFromUrl && ["overview", "apis", "analytics", "agents", "usage", "billing"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
      if (tabFromUrl === "analytics") {
        setAnalyticsExpanded(true);
        const subParam = searchParams.get("sub");
        if (subParam === "agents") {
          setAnalyticsSubtab("agents");
        } else {
          setAnalyticsSubtab("apis");
        }
      }
    }
  }, [tabFromUrl, searchParams]);

  const fetchWorkspaceData = useCallback(async (token: string) => {
    try {
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
      
      if (dashboard?.workspace) {
        setWorkspace(dashboard.workspace);
      }

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
      console.error("Fetch workspace error:", err);
    }
  }, []);

  const fetchProviderData = useCallback(async () => {
    try {
      const providerData = localStorage.getItem("apiclaw_provider");
      const providerSession = localStorage.getItem("apiclaw_session");
      
      // Need at least the session token
      if (!providerSession) {
        setIsProvider(false);
        return;
      }
      
      // First, get session to obtain providerId
      const sessionRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "providers:getSession",
          args: { token: providerSession },
        }),
      });
      
      const sessionData = await sessionRes.json();
      const session = sessionData.value || sessionData;
      
      if (!session || !session.providerId) {
        console.log("No valid provider session");
        // Try stored provider data as fallback for name
        if (providerData) {
          try {
            const parsed = JSON.parse(providerData);
            setProviderName(parsed.name || parsed.email || "Provider");
          } catch {
            // ignore
          }
        }
        return;
      }
      
      setProviderName(session.name || session.email || "Provider");
      
      // Now fetch provider APIs using providerId
      const apisRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "providers:getProviderAPIsWithStatus",
          args: { providerId: session.providerId },
        }),
      });
      
      const apisData = await apisRes.json();
      console.log("Provider APIs response:", apisData);
      
      // Check for error response
      if (apisData.status === "error") {
        console.error("Provider API error:", apisData.errorMessage);
        return;
      }
      
      const apis = apisData.value || apisData || [];
      
      // Set provider APIs (even empty array is OK)
      if (Array.isArray(apis)) {
        setProviderApis(apis);
        console.log("Provider APIs loaded:", apis.length);
        
        // Fetch provider analytics
        try {
          const analyticsRes = await fetch(`${CONVEX_URL}/api/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: "providers:getAnalytics",
              args: { token: providerSession },
            }),
          });
          
          const analyticsData = await analyticsRes.json();
          const analytics = analyticsData.value || analyticsData;
          
          if (analytics && typeof analytics === "object" && !analytics.status) {
            setProviderAnalytics(analytics);
          } else {
            // Generate preview data if no analytics
            setProviderAnalytics(generatePreviewAnalytics());
          }
        } catch {
          // Generate preview data on error
          setProviderAnalytics(generatePreviewAnalytics());
        }
      }
    } catch (err) {
      console.error("Fetch provider error:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        // Check workspace session
        const token = localStorage.getItem("apiclaw_workspace_session");
        if (token) {
          setSessionToken(token);
          await fetchWorkspaceData(token);
        }
        
        // Check provider session and fetch APIs
        await fetchProviderData();
        
        // Always ensure preview analytics exist for Analytics tab
        setProviderAnalytics(prev => prev || generatePreviewAnalytics());
        
        // If neither session type, redirect to login
        if (!token && !localStorage.getItem("apiclaw_session")) {
          router.push("/login");
          return;
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Init error:", err);
        setError("Failed to load workspace");
        setIsLoading(false);
      }
    };

    // Check theme
    const saved = localStorage.getItem("theme");
    setIsDark(saved !== "light");
    document.documentElement.classList.toggle("dark", saved !== "light");

    init();
  }, [router, fetchWorkspaceData, fetchProviderData]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/workspace-auth/session", { method: "DELETE" });
      localStorage.removeItem("apiclaw_workspace_session");
      localStorage.removeItem("apiclaw_session");
      localStorage.removeItem("apiclaw_provider");
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (sessionToken) await fetchWorkspaceData(sessionToken);
      await fetchProviderData();
    } catch (err) {
      setError("Failed to refresh");
    } finally {
      setIsLoading(false);
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
      setAgents(agents.filter(a => a.id !== agentId));
    } catch (err) {
      console.error("Revoke error:", err);
    }
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: Home },
    { id: "apis" as TabType, label: "APIs", icon: Zap },
    { id: "analytics" as TabType, label: "Analytics", icon: BarChart3 },
    { id: "agents" as TabType, label: "Agents", icon: Users },
    { id: "usage" as TabType, label: "Usage", icon: TrendingUp },
    { id: "billing" as TabType, label: "Billing", icon: CreditCard },
  ];
  
  // External links for sidebar
  const externalLinks = [
    { label: "Earn Credits", href: "/earn", icon: Crown },
    { label: "Documentation", href: "/docs", icon: BookOpen },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#ef4444] animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--background)]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something Went Wrong</h1>
          <p className="text-[var(--text-muted)] mb-6">{error}</p>
          <button onClick={handleRefresh} className="btn-primary">
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const displayEmail = workspace?.email || providerName || "User";
  const displayTier = workspace?.tier || "free";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 w-full z-50 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-[var(--surface)] transition">
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#ef4444]/20 flex items-center justify-center text-lg">🦞</div>
            <span className="font-bold">APIClaw</span>
          </Link>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[var(--surface)] transition">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-[var(--surface-elevated)] border-r border-[var(--border)] transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ef4444]/20 flex items-center justify-center text-2xl">🦞</div>
              <span className="font-bold text-lg">APIClaw</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-[var(--surface)] transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Workspace info */}
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-sm text-[var(--text-muted)]">Workspace</p>
            <p className="font-medium truncate">{displayEmail}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-[#ef4444]/20 text-[#ef4444] text-xs font-medium capitalize">
                {displayTier}
              </span>
              {workspace && (
                <span className="text-xs text-[var(--text-muted)]">
                  {workspace.usageRemaining}/{workspace.usageLimit} calls
                </span>
              )}
            </div>
            {workspace && workspace.usagePercentage > 80 && (
              <div className="mt-2 text-xs text-yellow-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Running low on calls
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {tabs.map((tab) => {
              // Special handling for Analytics with dropdown
              if (tab.id === "analytics") {
                return (
                  <div key={tab.id}>
                    <button
                      onClick={() => {
                        setAnalyticsExpanded(!analyticsExpanded);
                        if (!analyticsExpanded) {
                          setActiveTab("analytics");
                          router.push(`/workspace?tab=analytics`);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
                        activeTab === "analytics"
                          ? "bg-[#ef4444] text-white"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <tab.icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${analyticsExpanded ? "rotate-180" : ""}`} />
                    </button>
                    {/* Dropdown submenu */}
                    {analyticsExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        <button
                          onClick={() => {
                            setActiveTab("analytics");
                            setAnalyticsSubtab("apis");
                            setSidebarOpen(false);
                            router.push(`/workspace?tab=analytics&sub=apis`);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                            activeTab === "analytics" && analyticsSubtab === "apis"
                              ? "bg-[#ef4444]/20 text-[#ef4444]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <Zap className="w-4 h-4" />
                          <span>My APIs</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab("analytics");
                            setAnalyticsSubtab("agents");
                            setSidebarOpen(false);
                            router.push(`/workspace?tab=analytics&sub=agents`);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                            activeTab === "analytics" && analyticsSubtab === "agents"
                              ? "bg-[#ef4444]/20 text-[#ef4444]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          <span>My Agents</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              }
              
              // Regular tab button
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                    router.push(`/workspace?tab=${tab.id}`);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    activeTab === tab.id
                      ? "bg-[#ef4444] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* External Links */}
          <div className="p-4 border-t border-[var(--border)] space-y-1">
            {externalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition"
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
              </Link>
            ))}
          </div>

          {/* Bottom section */}
          <div className="p-4 border-t border-[var(--border)] space-y-2">
            <button
              onClick={toggleTheme}
              className="hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-red-500 transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        {/* Desktop header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xl sticky top-0 z-40">
          <h1 className="text-xl font-bold">
            {tabs.find(t => t.id === activeTab)?.label || "Workspace"}
          </h1>
          <div className="flex items-center gap-4">
            <button onClick={handleRefresh} className="p-2 rounded-lg hover:bg-[var(--surface)] transition" title="Refresh">
              <RefreshCw className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
            {activeTab === "apis" && (
              <Link href="/providers/register" className="btn-primary !py-2 !px-4 text-sm">
                <Plus className="w-4 h-4" />
                Add API
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-8">
          {activeTab === "overview" && (
            <OverviewTab
              workspace={workspace}
              agents={agents}
              providerApis={providerApis}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === "apis" && (
            <ApisTab apis={providerApis} />
          )}
          {activeTab === "analytics" && (
            <AnalyticsTab 
              apis={providerApis} 
              analytics={providerAnalytics} 
              workspace={workspace}
              agents={agents}
              usage={usage}
              activeSubtab={analyticsSubtab}
              setActiveSubtab={setAnalyticsSubtab}
            />
          )}
          {activeTab === "agents" && (
            <AgentsTab agents={agents} onRevoke={handleRevokeAgent} />
          )}
          {activeTab === "usage" && (
            <UsageTab workspace={workspace} usage={usage} />
          )}
          {activeTab === "billing" && (
            <BillingTab workspace={workspace} />
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================
// OVERVIEW TAB
// ============================================

function OverviewTab({
  workspace,
  agents,
  providerApis,
  setActiveTab,
}: {
  workspace: Workspace | null;
  agents: Agent[];
  providerApis: ProviderAPI[];
  setActiveTab: (tab: TabType) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-[#ef4444]" />
            <span className="text-[var(--text-muted)]">Listed APIs</span>
          </div>
          <p className="text-4xl font-bold text-[#ef4444]">{providerApis.length}</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className={`w-6 h-6 ${workspace ? "text-[#ef4444]" : "text-[var(--text-muted)]"}`} />
            <span className="text-[var(--text-muted)]">API Calls</span>
          </div>
          <p className={`text-4xl font-bold ${workspace ? "text-[#ef4444]" : ""}`}>
            {workspace?.usageCount.toLocaleString() || 0}
          </p>
          {workspace && (
            <p className="text-sm text-[var(--text-muted)] mt-1">
              of {workspace.usageLimit.toLocaleString()} limit
            </p>
          )}
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
            <Check className="w-6 h-6 text-green-500" />
            <span className="text-[var(--text-muted)]">Status</span>
          </div>
          <p className="text-xl font-bold text-green-500 capitalize">
            {workspace?.status || "Active"}
          </p>
        </div>
      </div>

      {/* Usage Progress */}
      {workspace && (
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
                workspace.usagePercentage > 70 ? "bg-yellow-500" : "bg-[#ef4444]"
              }`}
              style={{ width: `${Math.min(workspace.usagePercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-4 text-sm text-[var(--text-muted)]">
            <span>{workspace.usageCount.toLocaleString()} calls used</span>
            <span>{workspace.usageRemaining.toLocaleString()} remaining</span>
          </div>
          
          {workspace.usagePercentage > 80 && workspace.tier === "free" && (
            <div className="mt-4 p-4 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30">
              <div className="flex items-center gap-2 text-[#ef4444] mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Running low on API calls</span>
              </div>
              <p className="text-sm text-[var(--text-muted)] mb-3">
                Upgrade to Pro for 10,000 API calls/month.
              </p>
              <button onClick={() => setActiveTab("billing")} className="btn-primary !py-2 !px-4 text-sm">
                Upgrade to Pro
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Provider APIs Preview */}
      {providerApis.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Your APIs</h3>
            <button onClick={() => setActiveTab("apis")} className="text-sm text-[#ef4444] hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {providerApis.slice(0, 3).map((api) => (
              <Link
                key={api._id}
                href={`/providers/dashboard/${api._id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] transition"
              >
                <div>
                  <p className="font-medium">{api.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">{api.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  {api.hasDirectCall && (
                    <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                      Direct Call
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    api.status === "approved" ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                  }`}>
                    {api.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Agents */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Recent Agents</h3>
          <button onClick={() => setActiveTab("agents")} className="text-sm text-[#ef4444] hover:underline">
            View all
          </button>
        </div>
        {agents.length > 0 ? (
          <div className="space-y-3">
            {agents.slice(0, 3).map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#ef4444]/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#ef4444]" />
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
// APIS TAB (Provider)
// ============================================

function ApisTab({ apis }: { apis: ProviderAPI[] }) {
  if (!apis || apis.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50">
        <Zap className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">No APIs Listed</h3>
        <p className="text-[var(--text-muted)] max-w-md mx-auto mb-6">
          List your first API to start getting discovered by AI agents.
        </p>
        <Link href="/providers/register" className="btn-primary">
          <Plus className="w-5 h-5" />
          Add API
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your APIs</h2>
        <Link href="/providers/register" className="btn-primary !py-2 !px-4 text-sm">
          <Plus className="w-4 h-4" />
          Add API
        </Link>
      </div>

      <div className="grid gap-4">
        {apis.map((api) => (
          <Link
            key={api._id}
            href={`/providers/dashboard/${api._id}`}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 hover:border-[#ef4444]/50 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{api.name}</h3>
                  {api.hasDirectCall && (
                    <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                      Direct Call
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    api.status === "approved" ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                  }`}>
                    {api.status}
                  </span>
                </div>
                <p className="text-[var(--text-muted)]">{api.description}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-[var(--text-muted)]">
                  <span>{api.category}</span>
                  <span>{api.discoveryCount || 0} discoveries</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
            </div>
          </Link>
        ))}
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

      {/* How to Connect Agents */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#ef4444]/20 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-[#ef4444]" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">How to Connect Your AI Agent</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Add APIClaw to your AI agent&apos;s MCP config to enable API discovery and Direct Call.
            </p>
            <div className="bg-[var(--background)] rounded-xl p-4 font-mono text-sm mb-4 relative">
              <pre className="text-[var(--text-secondary)] overflow-x-auto">{`{
  "mcpServers": {
    "apiclaw": {
      "command": "npx",
      "args": ["@nordsym/apiclaw"]
    }
  }
}`}</pre>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-3">
              Or run directly in terminal to test:
            </p>
            <div className="flex items-center gap-2 bg-[var(--background)] rounded-lg px-4 py-2 font-mono text-sm w-fit">
              <Terminal className="w-4 h-4 text-[#ef4444]" />
              <code>npx @nordsym/apiclaw</code>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-3">
              First run prompts for email → sends magic link → registers your agent to this workspace.
            </p>
          </div>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50">
          <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Agents Connected Yet</h3>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">
            Follow the instructions above to connect your first AI agent.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#ef4444]/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#ef4444]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{agent.fingerprint}</h3>
                      {agent.isCurrent && (
                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Last active: {new Date(agent.lastUsedAt).toLocaleString()}
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
                    {confirmRevoke === agent.id ? "Confirm" : "Revoke"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
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
  workspace: Workspace | null;
  usage: UsageData | null;
}) {
  const hasData = usage && (usage.byProvider.length > 0 || usage.byDay.length > 0);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Usage Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-[#ef4444]" />
            <span className="text-[var(--text-muted)]">Total Calls</span>
          </div>
          <p className="text-4xl font-bold text-[#ef4444]">
            {(usage?.total || workspace?.usageCount || 0).toLocaleString()}
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
          <p className="text-4xl font-bold">{workspace?.usageRemaining.toLocaleString() || "∞"}</p>
        </div>
      </div>

      {hasData ? (
        <>
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
                    />
                    <Line type="monotone" dataKey="calls" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {usage!.byProvider.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
              <h3 className="font-semibold mb-4">Usage by Provider</h3>
              <div className="space-y-3">
                {usage!.byProvider.map((p, i) => (
                  <div key={p.provider} className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-[#ef4444]/20 text-[#ef4444] flex items-center justify-center text-sm font-medium">
                        {i + 1}
                      </span>
                      <span className="font-medium">{p.provider}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{p.calls.toLocaleString()} calls</p>
                      {p.cost > 0 && <p className="text-sm text-[var(--text-muted)]">${p.cost.toFixed(2)}</p>}
                    </div>
                  </div>
                ))}
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
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// BILLING TAB
// ============================================

function BillingTab({ workspace }: { workspace: Workspace | null }) {
  const tier = workspace?.tier || "free";
  const PAYMENT_LINK = "https://buy.stripe.com/aFabJ32S0h185GI2GQcMM0h";

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Billing</h2>

      {/* Current Plan */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-lg">Current Plan</h3>
            <p className="text-[var(--text-muted)]">Your workspace subscription</p>
          </div>
          <div className="px-4 py-2 rounded-full bg-[#ef4444]/20 text-[#ef4444] font-semibold capitalize">
            {tier}
          </div>
        </div>

        {tier === "free" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">API Calls</span>
              <span className="font-medium">{workspace?.usageLimit.toLocaleString() || "1,000"} / month</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Support</span>
              <span className="font-medium">Community</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[var(--text-muted)]">Price</span>
              <span className="font-medium">Free</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">API Calls</span>
              <span className="font-medium">10,000 / month</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Support</span>
              <span className="font-medium">Priority</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[var(--text-muted)]">Price</span>
              <span className="font-medium">$99 / month</span>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade CTA */}
      {tier === "free" && (
        <div className="rounded-2xl border border-[#ef4444]/30 bg-gradient-to-br from-[#ef4444]/10 to-[#ef4444]/5 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#ef4444]/20 flex items-center justify-center">
              <Crown className="w-6 h-6 text-[#ef4444]" />
            </div>
            <div>
              <h3 className="font-bold text-xl mb-2">Upgrade to Pro</h3>
              <p className="text-[var(--text-muted)]">
                Get 10x more API calls and priority support.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span>10,000 API calls / month</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span>Priority support</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span>Advanced analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span>Custom integrations</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href={PAYMENT_LINK} className="btn-primary">
              Upgrade for $99/month
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      )}

      {/* Usage This Month */}
      {workspace && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <h3 className="font-bold text-lg mb-4">Usage This Month</h3>
          <div className="h-4 bg-[var(--surface)] rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full ${
                workspace.usagePercentage > 90 ? "bg-red-500" :
                workspace.usagePercentage > 70 ? "bg-yellow-500" : "bg-[#ef4444]"
              }`}
              style={{ width: `${Math.min(workspace.usagePercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
            <span>{workspace.usageCount.toLocaleString()} of {workspace.usageLimit.toLocaleString()} calls used</span>
            <span>{workspace.usagePercentage.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// ANALYTICS TAB (Provider)
// ============================================

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  change?: number;
  icon: typeof Zap;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "bg-[#ef4444]/10 border-[#ef4444]/30" : "bg-[var(--surface-elevated)] border-[var(--border)]"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[var(--text-muted)]">{title}</span>
        <Icon className={`w-5 h-5 ${accent ? "text-[#ef4444]" : "text-[var(--text-muted)]"}`} />
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-3xl font-bold ${accent ? "text-[#ef4444]" : ""}`}>{value}</span>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${change >= 0 ? "text-green-500" : "text-red-500"}`}>
            {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsTab({
  apis,
  analytics,
  workspace,
  agents,
  usage,
  activeSubtab,
  setActiveSubtab,
}: {
  apis: ProviderAPI[];
  analytics: ProviderAnalytics | null;
  workspace: Workspace | null;
  agents: Agent[];
  usage: UsageData | null;
  activeSubtab: "apis" | "agents";
  setActiveSubtab: (tab: "apis" | "agents") => void;
}) {
  return (
    <div className="space-y-6">
      {/* Subtab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-[var(--surface)] rounded-xl w-fit">
        <button
          onClick={() => setActiveSubtab("apis")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubtab === "apis"
              ? "bg-[#ef4444] text-white"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Zap className="w-4 h-4" />
          My APIs
        </button>
        <button
          onClick={() => setActiveSubtab("agents")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubtab === "agents"
              ? "bg-[#ef4444] text-white"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Users className="w-4 h-4" />
          My Agents
        </button>
      </div>

      {/* Subtab Content */}
      {activeSubtab === "apis" && (
        <MyAPIsAnalytics apis={apis} analytics={analytics} />
      )}
      {activeSubtab === "agents" && (
        <MyAgentsAnalytics workspace={workspace} agents={agents} usage={usage} />
      )}
    </div>
  );
}

// ============================================
// MY APIs ANALYTICS (Provider view)
// ============================================

function MyAPIsAnalytics({
  apis,
  analytics,
}: {
  apis: ProviderAPI[];
  analytics: ProviderAnalytics | null;
}) {
  const totalCalls = analytics?.totalCalls || 0;
  const uniqueAgents = analytics?.uniqueAgents || 0;
  const hasChartData = analytics && analytics.callsByDay && analytics.callsByDay.length > 0;

  return (
    <div className="space-y-8">
      {/* Preview Banner */}
      {analytics?.isPreview && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#ef4444] flex-shrink-0" />
          <div>
            <p className="font-medium text-[#ef4444]">Preview Mode</p>
            <p className="text-sm text-[var(--text-muted)]">This is sample data. Real analytics will appear once agents start using your APIs.</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold">My APIs Analytics</h2>
        <p className="text-[var(--text-muted)]">How other agents are using your listed APIs</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Calls" value={totalCalls.toLocaleString()} icon={Zap} accent />
        <StatCard title="Unique Agents" value={uniqueAgents.toString()} icon={Users} />
        <StatCard title="Avg Latency" value={`${analytics?.avgLatency || 145}ms`} icon={Clock} />
        <StatCard title="Success Rate" value={`${(analytics?.successRate || 98.2).toFixed(1)}%`} icon={Check} />
      </div>

      {/* Charts */}
      {hasChartData && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <div className="lg:col-span-2 bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] p-6">
            <h3 className="font-semibold mb-4">Calls Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics!.callsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
                  <Tooltip
                    contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: "8px" }}
                    labelFormatter={(d) => new Date(d).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="calls" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#ef4444" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Agents using your APIs */}
          <div className="bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] p-6">
            <h3 className="font-semibold mb-4">Top Consumers</h3>
            <div className="space-y-3">
              {analytics!.topAgents.slice(0, 6).map((agent, i) => (
                <div key={agent.agentId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--surface)] flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">{i + 1}</span>
                    <span className="text-sm font-mono truncate max-w-[140px]">{agent.agentId.replace("agent_", "")}</span>
                  </div>
                  <span className="text-sm text-[var(--text-muted)]">{agent.calls.toLocaleString()}</span>
                </div>
              ))}
              {analytics!.topAgents.length === 0 && <p className="text-[var(--text-muted)] text-sm">No agent activity yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* Top Actions */}
      {analytics?.topActions && analytics.topActions.length > 0 && (
        <div className="bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] p-6">
          <h3 className="font-semibold mb-4">Top Actions</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.topActions.slice(0, 8).map((action, i) => (
              <div key={action.actionName} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface)]">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#ef4444]/20 text-[#ef4444] flex items-center justify-center text-xs font-medium">{i + 1}</span>
                  <span className="text-sm font-mono">{action.actionName}</span>
                </div>
                <span className="text-sm text-[var(--text-muted)]">{action.calls.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage by API */}
      <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-6">
        <h3 className="font-semibold text-lg mb-4">Performance by API</h3>
        {apis.length > 0 ? (
          <div className="space-y-4">
            {apis.map((api) => (
              <div key={api._id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-[#ef4444]" />
                  <div>
                    <p className="font-medium">{api.name}</p>
                    <p className="text-sm text-[var(--text-muted)]">{api.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{api.discoveryCount || 0} discoveries</p>
                  <p className="text-sm text-[var(--text-muted)]">{api.status === "approved" ? "Live" : api.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[var(--text-muted)] mb-4">No APIs listed yet</p>
            <Link href="/providers/register" className="btn-primary !py-2 !px-4 text-sm">
              <Plus className="w-4 h-4" />
              Add Your First API
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MY AGENTS ANALYTICS (Consumer view)
// ============================================

function generateAgentPreviewData() {
  const days = [];
  const baseDate = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toISOString().split("T")[0],
      calls: Math.floor(Math.random() * 80) + 20 + Math.floor(i * 1.5),
    });
  }
  return days;
}

function MyAgentsAnalytics({
  workspace,
  agents,
  usage,
}: {
  workspace: Workspace | null;
  agents: Agent[];
  usage: UsageData | null;
}) {
  const totalCalls = workspace?.usageCount || usage?.total || 0;
  const hasUsageData = usage && usage.byDay && usage.byDay.length > 0;
  const isPreview = !hasUsageData && totalCalls === 0;
  const chartData = hasUsageData ? usage!.byDay : generateAgentPreviewData();

  return (
    <div className="space-y-8">
      {/* Preview Banner */}
      {isPreview && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#ef4444] flex-shrink-0" />
          <div>
            <p className="font-medium text-[#ef4444]">Preview Mode</p>
            <p className="text-sm text-[var(--text-muted)]">This is sample data. Real analytics will appear once your agents start making API calls.</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold">My Agents Analytics</h2>
        <p className="text-[var(--text-muted)]">How your agents are using APIs through APIClaw</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total API Calls" value={isPreview ? "1,247" : totalCalls.toLocaleString()} icon={Zap} accent />
        <StatCard title="Connected Agents" value={isPreview ? "3" : agents.length.toString()} icon={Users} />
        <StatCard title="APIs Used" value={isPreview ? "8" : (usage?.byProvider.length || 0).toString()} icon={BarChart3} />
        <StatCard 
          title="Remaining Calls" 
          value={isPreview ? "8,753" : (workspace?.usageRemaining || 0).toLocaleString()} 
          icon={Shield} 
        />
      </div>

      {/* Usage Chart */}
      <div className="bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] p-6">
        <h3 className="font-semibold mb-4">Your Agents&apos; API Calls Over Time</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
              <YAxis tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
              <Tooltip
                contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", borderRadius: "8px" }}
                labelFormatter={(d) => new Date(d).toLocaleDateString()}
              />
              <Line type="monotone" dataKey="calls" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#ef4444" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* APIs Your Agents Use */}
      <div className="bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] p-6">
        <h3 className="font-semibold mb-4">APIs Your Agents Use</h3>
        {(usage?.byProvider && usage.byProvider.length > 0) || isPreview ? (
          <div className="space-y-3">
            {(isPreview ? [
              { provider: "OpenRouter", calls: 523, cost: 0 },
              { provider: "Replicate", calls: 312, cost: 0 },
              { provider: "ElevenLabs", calls: 189, cost: 0 },
              { provider: "Brave Search", calls: 156, cost: 0 },
              { provider: "46elks", calls: 67, cost: 0 },
            ] : usage!.byProvider).map((p, i) => (
              <div key={p.provider} className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#ef4444]/20 text-[#ef4444] flex items-center justify-center text-sm font-medium">{i + 1}</span>
                  <span className="font-medium">{p.provider}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{p.calls.toLocaleString()} calls</p>
                  {p.cost > 0 && <p className="text-sm text-[var(--text-muted)]">${p.cost.toFixed(2)}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-muted)] text-center py-8">No API usage data yet</p>
        )}
      </div>

      {/* Connected Agents */}
      <div className="bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] p-6">
        <h3 className="font-semibold mb-4">Your Connected Agents</h3>
        {agents.length > 0 || isPreview ? (
          <div className="space-y-3">
            {(isPreview ? [
              { id: "1", fingerprint: "claude_prod_main", lastUsedAt: Date.now() - 3600000, isCurrent: true },
              { id: "2", fingerprint: "cursor_dev_local", lastUsedAt: Date.now() - 86400000, isCurrent: false },
              { id: "3", fingerprint: "aider_ci_runner", lastUsedAt: Date.now() - 172800000, isCurrent: false },
            ] as Agent[] : agents).map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#ef4444]/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#ef4444]" />
                  </div>
                  <div>
                    <p className="font-medium">{agent.fingerprint}</p>
                    <p className="text-sm text-[var(--text-muted)]">Last active: {new Date(agent.lastUsedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {agent.isCurrent && (
                  <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">Current</span>
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
