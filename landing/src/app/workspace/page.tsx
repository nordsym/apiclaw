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
  Mail,
  Send,
  ScrollText,
  Webhook,
  Key,
  MessageSquare,
  Bell,
  User,
  Lock,
  Building,
  ChevronUp,
  Bug,
  Sparkles,
  MessageCircle,
  Search,
  Phone,
  Cpu,
  Activity,
  Globe,
  Database,
  Play,
  Star,
  Twitter,
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
import {
  CheckoutButton,
  UsageWarningBanner,
  UsageExceededBanner,
} from "@/components/CheckoutButton";
import { Toast, useToast } from "@/components/Toast";

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
  name?: string;
  customName?: string | null;
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

interface ApprovedAPI {
  _id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  hasDirectCall?: boolean;
  icon?: string;
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

type TabType = "overview" | "api-catalog" | "my-agents" | "my-apis" | "analytics" | "webhooks" | "api-keys" | "earn" | "docs" | "feedback" | "settings" | "billing";
type AnalyticsSubtab = "overview" | "usage" | "logs";

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
  const subFromUrl = searchParams.get("sub") as AnalyticsSubtab | null;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl || "overview");
  const [analyticsSubtab, setAnalyticsSubtab] = useState<AnalyticsSubtab>(subFromUrl || "overview");
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
  const [approvedApis, setApprovedApis] = useState<ApprovedAPI[]>([]);
  const [providerAnalytics, setProviderAnalytics] = useState<ProviderAnalytics | null>(null);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [isProvider, setIsProvider] = useState(false);
  
  // Toast notifications
  const { toast, showToast, hideToast } = useToast();

  // Handle billing and portal return params
  useEffect(() => {
    const billingParam = searchParams.get("billing");
    const portalParam = searchParams.get("portal");
    
    if (billingParam === "success") {
      showToast("Payment method added! You now have unlimited API calls.", "success");
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("billing");
      window.history.replaceState({}, "", newUrl.toString());
    } else if (billingParam === "cancel") {
      showToast("Checkout cancelled. You can try again anytime.", "info");
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("billing");
      window.history.replaceState({}, "", newUrl.toString());
    }
    
    // Handle portal return
    if (portalParam === "success") {
      showToast("Billing settings updated successfully.", "success");
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("portal");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams, showToast]);

  useEffect(() => {
    const validTabs: TabType[] = ["overview", "api-catalog", "my-agents", "my-apis", "analytics", "webhooks", "api-keys", "earn", "docs", "feedback", "settings", "billing"];
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
      if (tabFromUrl === "analytics") {
        setAnalyticsExpanded(true);
        if (subFromUrl && ["overview", "usage", "logs"].includes(subFromUrl)) {
          setAnalyticsSubtab(subFromUrl);
        }
      }
    }
  }, [tabFromUrl, subFromUrl]);

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

  const fetchApprovedAPIs = useCallback(async () => {
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "providers:getApprovedAPIs",
          args: {},
        }),
      });
      const data = await res.json();
      const apis = data.value || data || [];
      if (Array.isArray(apis)) {
        setApprovedApis(apis);
      }
    } catch (err) {
      console.error("Fetch approved APIs error:", err);
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
        setIsProvider(true);
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
        
        // Fetch all approved APIs for the catalog
        await fetchApprovedAPIs();
        
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
  }, [router, fetchWorkspaceData, fetchProviderData, fetchApprovedAPIs]);

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
      await fetchApprovedAPIs();
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

  const handleRenameAgent = async (agentId: string, name: string) => {
    if (!sessionToken) return;
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "workspaces:renameAgent",
          args: { token: sessionToken, sessionId: agentId, name },
        }),
      });
      setAgents(agents.map(a => a.id === agentId ? { ...a, name, customName: name } : a));
    } catch (err) {
      console.error("Rename error:", err);
    }
  };

  // Main navigation tabs
  const mainTabs = [
    { id: "overview" as TabType, label: "Overview", icon: Home },
    { id: "api-catalog" as TabType, label: "Direct Call", icon: Zap },
    { id: "my-agents" as TabType, label: "My Agents", icon: Users },
    { id: "my-apis" as TabType, label: "My APIs", icon: Terminal },
    { id: "analytics" as TabType, label: "Analytics", icon: BarChart3, hasDropdown: true },
    { id: "webhooks" as TabType, label: "Webhooks", icon: Webhook },
    { id: "api-keys" as TabType, label: "API Keys", icon: Key },
  ];

  // Secondary navigation tabs
  const secondaryTabs = [
    { id: "earn" as TabType, label: "Earn Credits", icon: Crown },
    { id: "docs" as TabType, label: "Docs", icon: BookOpen },
    { id: "feedback" as TabType, label: "Feedback", icon: MessageSquare },
  ];

  // Bottom navigation tabs (before theme/logout)
  const bottomTabs = [
    { id: "billing" as TabType, label: "Billing", icon: CreditCard },
    { id: "settings" as TabType, label: "Settings", icon: Settings },
  ];

  // All tabs for lookup
  const tabs = [...mainTabs, ...secondaryTabs, ...bottomTabs, { id: "billing" as TabType, label: "Billing", icon: CreditCard }];

  // Get display name for current tab
  const getTabLabel = () => {
    if (activeTab === "analytics") {
      const subLabels: Record<AnalyticsSubtab, string> = {
        overview: "Analytics Overview",
        usage: "Usage",
        logs: "Logs",
      };
      return subLabels[analyticsSubtab] || "Analytics";
    }
    return tabs.find(t => t.id === activeTab)?.label || "Workspace";
  };

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
  
  // Usage thresholds for banners
  const showUsageWarning = workspace && workspace.tier === "free" && workspace.usagePercentage >= 80 && workspace.usagePercentage < 100;
  const showUsageExceeded = workspace && workspace.tier === "free" && workspace.usagePercentage >= 100;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Toast notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
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
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {/* Main tabs */}
            {mainTabs.map((tab) => {
              // Special handling for Analytics with dropdown
              if (tab.id === "analytics") {
                return (
                  <div key={tab.id}>
                    <button
                      onClick={() => {
                        setAnalyticsExpanded(!analyticsExpanded);
                        if (!analyticsExpanded) {
                          setActiveTab("analytics");
                          setAnalyticsSubtab("overview");
                          router.push(`/workspace?tab=analytics&sub=overview`);
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
                            setAnalyticsSubtab("overview");
                            setSidebarOpen(false);
                            router.push(`/workspace?tab=analytics&sub=overview`);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                            activeTab === "analytics" && analyticsSubtab === "overview"
                              ? "bg-[#ef4444]/20 text-[#ef4444]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <BarChart3 className="w-4 h-4" />
                          <span>Overview</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab("analytics");
                            setAnalyticsSubtab("usage");
                            setSidebarOpen(false);
                            router.push(`/workspace?tab=analytics&sub=usage`);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                            activeTab === "analytics" && analyticsSubtab === "usage"
                              ? "bg-[#ef4444]/20 text-[#ef4444]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <TrendingUp className="w-4 h-4" />
                          <span>Usage</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab("analytics");
                            setAnalyticsSubtab("logs");
                            setSidebarOpen(false);
                            router.push(`/workspace?tab=analytics&sub=logs`);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                            activeTab === "analytics" && analyticsSubtab === "logs"
                              ? "bg-[#ef4444]/20 text-[#ef4444]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <ScrollText className="w-4 h-4" />
                          <span>Logs</span>
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

            {/* Separator */}
            <div className="border-t border-[var(--border)] my-3" />

            {/* Secondary tabs */}
            {secondaryTabs.map((tab) => (
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
            ))}

            {/* Separator */}
            <div className="border-t border-[var(--border)] my-3" />

            {/* Bottom tabs (Settings) */}
            {bottomTabs.map((tab) => (
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
            ))}
          </nav>

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
          <h1 className="text-xl font-bold">{getTabLabel()}</h1>
          <div className="flex items-center gap-4">
            <button onClick={handleRefresh} className="p-2 rounded-lg hover:bg-[var(--surface)] transition" title="Refresh">
              <RefreshCw className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
            {activeTab === "my-apis" && (
              <Link href="/providers/register" className="btn-primary !py-2 !px-4 text-sm">
                <Plus className="w-4 h-4" />
                List New API
              </Link>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-8">
          {/* Usage warning/exceeded banners */}
          {showUsageWarning && sessionToken && (
            <UsageWarningBanner
              usagePercentage={workspace!.usagePercentage}
              usageCount={workspace!.usageCount}
              usageLimit={workspace!.usageLimit}
              sessionToken={sessionToken}
            />
          )}
          {showUsageExceeded && sessionToken && (
            <UsageExceededBanner
              usageCount={workspace!.usageCount}
              usageLimit={workspace!.usageLimit}
              sessionToken={sessionToken}
            />
          )}
          
          {activeTab === "overview" && (
            <OverviewTab
              workspace={workspace}
              agents={agents}
              providerApis={providerApis}
              approvedApis={approvedApis}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === "api-catalog" && (
            <APICatalogTab apis={approvedApis} />
          )}
          {activeTab === "my-agents" && (
            <AgentsTab agents={agents} onRevoke={handleRevokeAgent} onRename={handleRenameAgent} workspaceEmail={workspace?.email} sessionToken={sessionToken || undefined} />
          )}
          {activeTab === "my-apis" && (
            <MyAPIsTab apis={providerApis} />
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
              sessionToken={sessionToken}
            />
          )}
          {activeTab === "webhooks" && (
            <WebhooksTab />
          )}
          {activeTab === "api-keys" && (
            <ApiKeysTab />
          )}
          {activeTab === "billing" && (
            <BillingTab workspace={workspace} sessionToken={sessionToken} />
          )}
          {activeTab === "earn" && (
            <EarnTab />
          )}
          {activeTab === "docs" && (
            <DocsTab />
          )}
          {activeTab === "feedback" && (
            <FeedbackTab />
          )}
          {activeTab === "settings" && (
            <SettingsTab workspace={workspace} sessionToken={sessionToken} />
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
  approvedApis,
  setActiveTab,
}: {
  workspace: Workspace | null;
  agents: Agent[];
  providerApis: ProviderAPI[];
  approvedApis: ApprovedAPI[];
  setActiveTab: (tab: TabType) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-[#ef4444]" />
            <span className="text-[var(--text-muted)]">Available APIs</span>
          </div>
          <p className="text-4xl font-bold text-[#ef4444]">{approvedApis.length}</p>
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
            <span className="text-[var(--text-muted)]">My Agents</span>
          </div>
          <p className="text-4xl font-bold">{agents.length}</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <div className="flex items-center gap-3 mb-3">
            <Terminal className="w-6 h-6 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">My APIs</span>
          </div>
          <p className="text-4xl font-bold">{providerApis.length}</p>
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

      {/* Available APIs Preview */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Direct Call</h3>
          <button onClick={() => setActiveTab("api-catalog")} className="text-sm text-[#ef4444] hover:underline">
            View all {approvedApis.length} APIs
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {approvedApis.slice(0, 3).map((api) => (
            <div
              key={api._id}
              className="p-4 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-[#ef4444]" />
                <p className="font-medium">{api.name}</p>
              </div>
              <p className="text-sm text-[var(--text-muted)] line-clamp-2">{api.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full bg-[var(--background)] text-xs text-[var(--text-muted)]">
                  {api.category}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                  Direct Call
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My APIs Preview */}
      {providerApis.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">My APIs</h3>
            <button onClick={() => setActiveTab("my-apis")} className="text-sm text-[#ef4444] hover:underline">
              Manage APIs
            </button>
          </div>
          <div className="space-y-3">
            {providerApis.slice(0, 3).map((api) => (
              <div
                key={api._id}
                className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]"
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Agents */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">My Agents</h3>
          <button onClick={() => setActiveTab("my-agents")} className="text-sm text-[#ef4444] hover:underline">
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
// API CATALOG TAB (All Approved APIs)
// ============================================

function APICatalogTab({ apis }: { apis: ApprovedAPI[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(apis.map(a => a.category)))];

  // Filter APIs
  const filteredApis = apis.filter(api => {
    const matchesSearch = !searchQuery || 
      api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || api.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get icon component for category
  const CategoryIcon = ({ category }: { category: string }) => {
    const iconClass = "w-5 h-5 text-[#ef4444]";
    switch (category) {
      case "Search": return <Search className={iconClass} />;
      case "AI & LLM": return <Cpu className={iconClass} />;
      case "Communication": return <MessageSquare className={iconClass} />;
      case "Email": return <Mail className={iconClass} />;
      case "Voice & Audio": return <Activity className={iconClass} />;
      case "Code Execution": return <Terminal className={iconClass} />;
      case "Web Scraping": return <Globe className={iconClass} />;
      case "Image": return <Sparkles className={iconClass} />;
      case "Media": return <Play className={iconClass} />;
      case "SMS & Messaging": return <MessageSquare className={iconClass} />;
      case "Voice & TTS": return <Activity className={iconClass} />;
      case "Crypto & Blockchain": return <Database className={iconClass} />;
      default: return <Zap className={iconClass} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Direct Call</h2>
          <p className="text-[var(--text-muted)]">{apis.length} APIs available for Direct Call</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search APIs..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Categories" : cat}
            </option>
          ))}
        </select>
      </div>

      {/* API Grid */}
      {filteredApis.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50">
          <Search className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No APIs Found</h3>
          <p className="text-[var(--text-muted)]">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredApis.map((api) => (
            <div
              key={api._id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 hover:border-[#ef4444]/50 transition group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#ef4444]/10 flex items-center justify-center">
                  <CategoryIcon category={api.category} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{api.name}</h3>
                  <span className="text-sm text-[var(--text-muted)]">{api.category}</span>
                </div>
              </div>
              <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-4">{api.description}</p>
              <div className="flex items-center">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                  <Check className="w-3 h-3" />
                  Direct Call Ready
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// MY APIs TAB (Provider)
// ============================================

function MyAPIsTab({ apis }: { apis: ProviderAPI[] }) {
  if (!apis || apis.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">My APIs</h2>
          <p className="text-[var(--text-muted)]">Choose how you want AI agents to access your API.</p>
        </div>

        {/* Three integration options */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Option 1: List API */}
          <Link
            href="/providers/register?type=list"
            className="group rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 hover:border-[#ef4444]/50 transition text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--surface)] flex items-center justify-center mb-4 group-hover:bg-[#ef4444]/10 transition">
              <Search className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[#ef4444] transition" />
            </div>
            <h3 className="font-semibold text-lg mb-1">List API</h3>
            <p className="text-[#ef4444] text-sm font-medium mb-3">Get discovered</p>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Appear in the APIClaw catalog. AI agents find you when searching for capabilities.
            </p>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                Free
              </span>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[#ef4444] group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Option 2: Open API */}
          <Link
            href="/providers/register?type=open"
            className="group rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 hover:border-[#ef4444]/50 transition text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--surface)] flex items-center justify-center mb-4 group-hover:bg-[#ef4444]/10 transition">
              <Globe className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[#ef4444] transition" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Open API</h3>
            <p className="text-[#ef4444] text-sm font-medium mb-3">Agents call directly</p>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Provide your public OpenAPI spec. Agents call your endpoint with their own keys.
            </p>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                Self-hosted
              </span>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[#ef4444] group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Option 3: Direct Call */}
          <Link
            href="/providers/register?type=direct"
            className="group rounded-2xl border border-[#ef4444]/30 bg-gradient-to-br from-[#ef4444]/5 to-transparent p-6 hover:border-[#ef4444]/50 transition text-left relative overflow-hidden"
          >
            <div className="absolute top-3 right-3">
              <span className="px-2 py-0.5 rounded-full bg-[#ef4444]/20 text-[#ef4444] text-xs font-medium flex items-center gap-1">
                <Star className="w-3 h-3" />
                Premium
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#ef4444]/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-[#ef4444]" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Direct Call</h3>
            <p className="text-[#ef4444] text-sm font-medium mb-3">We handle keys</p>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              APIClaw manages authentication. Agents pay per call, you earn revenue share.
            </p>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-[#ef4444]/20 text-[#ef4444] text-xs font-medium">
                Revenue share
              </span>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[#ef4444] group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>

        {/* Why list section */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <h4 className="font-semibold mb-4">Why list your API on APIClaw?</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">AI-native discovery</p>
                <p className="text-xs text-[var(--text-muted)]">Agents find you when searching for capabilities.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Zero integration work</p>
                <p className="text-xs text-[var(--text-muted)]">We handle auth, billing, and agent compatibility.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Usage analytics</p>
                <p className="text-xs text-[var(--text-muted)]">See which agents use your API and how.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My APIs</h2>
          <p className="text-[var(--text-muted)]">{apis.length} API{apis.length !== 1 ? "s" : ""} listed</p>
        </div>
        <Link href="/providers/register" className="btn-primary !py-2 !px-4 text-sm">
          <Plus className="w-4 h-4" />
          List New API
        </Link>
      </div>

      <div className="grid gap-4">
        {apis.map((api) => (
          <div
            key={api._id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 hover:border-[#ef4444]/50 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
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
              <div className="flex items-center gap-2 ml-4">
                <Link
                  href={`/providers/dashboard/${api._id}`}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition"
                >
                  Edit
                </Link>
                <Link
                  href={`/providers/dashboard/${api._id}`}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#ef4444] text-white hover:bg-[#dc2626] transition"
                >
                  Analytics
                </Link>
              </div>
            </div>
          </div>
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
  onRename,
  workspaceEmail,
  sessionToken,
}: {
  agents: Agent[];
  onRevoke: (agentId: string) => void;
  onRename: (agentId: string, name: string) => void;
  workspaceEmail?: string;
  sessionToken?: string;
}) {
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [sendingLink, setSendingLink] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [email, setEmail] = useState(workspaceEmail || "");
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleRevoke = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (confirmRevoke === agentId) {
      onRevoke(agentId);
      setConfirmRevoke(null);
      // If revoking current session, clear localStorage and redirect
      if (agent?.isCurrent) {
        localStorage.removeItem("apiclaw_workspace_session");
        window.location.href = "/login";
      }
    } else {
      setConfirmRevoke(agentId);
    }
  };

  const handleSendMagicLink = async () => {
    if (!email || !email.includes("@")) return;
    
    setSendingLink(true);
    try {
      const response = await fetch(`${CONVEX_URL.replace('.cloud', '.site')}/workspace/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const result = await response.json();
      if (result.success) {
        setLinkSent(true);
        setTimeout(() => setLinkSent(false), 5000);
      }
    } catch (err) {
      console.error("Failed to send magic link:", err);
    } finally {
      setSendingLink(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Agents</h2>
          <p className="text-[var(--text-muted)]">{agents.length} connected agent{agents.length !== 1 ? "s" : ""}</p>
        </div>
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

      {/* Quick Connect via Email */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Quick Connect via Email</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Send a magic link to connect your agent without using the CLI.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full sm:flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
              />
              <button
                onClick={handleSendMagicLink}
                disabled={sendingLink || !email}
                className="w-full sm:w-auto px-6 py-2 bg-[#ef4444] text-white rounded-lg font-medium hover:bg-[#dc2626] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sendingLink ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : linkSent ? (
                  <>
                    <Check className="w-4 h-4" />
                    Sent!
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Link
                  </>
                )}
              </button>
            </div>
            {linkSent && (
              <p className="text-sm text-green-500 mt-2">
                ✓ Magic link sent! Check your email and click to connect.
              </p>
            )}
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
            <div key={agent.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#ef4444]/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#ef4444]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingAgent === agent.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Agent name..."
                          className="w-full sm:w-auto px-3 py-1 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              onRename(agent.id, editName);
                              setEditingAgent(null);
                            }}
                            className="px-3 py-1 bg-[#ef4444] text-white rounded-lg text-sm hover:bg-[#dc2626]"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingAgent(null)}
                            className="px-3 py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold truncate">{agent.name || agent.fingerprint}</h3>
                        <button
                          onClick={() => {
                            setEditingAgent(agent.id);
                            setEditName(agent.name || agent.fingerprint || "");
                          }}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition"
                          title="Rename"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        {agent.isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                            Current
                          </span>
                        )}
                      </div>
                    )}
                    {agent.fingerprint !== agent.name && agent.name && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{agent.fingerprint}</p>
                    )}
                    <div className="flex items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Last active:</span> {new Date(agent.lastUsedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setEditingAgent(agent.id);
                      setEditName(agent.name || agent.fingerprint || "");
                    }}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:bg-[var(--surface)] transition text-center"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleRevoke(agent.id)}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 ${
                      confirmRevoke === agent.id
                        ? "bg-red-500 text-white"
                        : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                    }`}
                    title={agent.isCurrent ? "This will log you out" : "Remove this agent"}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{confirmRevoke === agent.id ? (agent.isCurrent ? "Logout & Remove" : "Confirm") : "Revoke"}</span>
                    <span className="sm:hidden">{confirmRevoke === agent.id ? "Confirm" : "Revoke"}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// ANALYTICS TAB (with subtabs)
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
    <div className={`rounded-xl sm:rounded-2xl border p-3 sm:p-5 ${accent ? "bg-[#ef4444]/10 border-[#ef4444]/30" : "bg-[var(--surface-elevated)] border-[var(--border)]"}`}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-xs sm:text-sm text-[var(--text-muted)] truncate pr-2">{title}</span>
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${accent ? "text-[#ef4444]" : "text-[var(--text-muted)]"}`} />
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-xl sm:text-3xl font-bold ${accent ? "text-[#ef4444]" : ""}`}>{value}</span>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs sm:text-sm ${change >= 0 ? "text-green-500" : "text-red-500"}`}>
            {change >= 0 ? <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" />}
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
  sessionToken,
}: {
  apis: ProviderAPI[];
  analytics: ProviderAnalytics | null;
  workspace: Workspace | null;
  agents: Agent[];
  usage: UsageData | null;
  activeSubtab: AnalyticsSubtab;
  setActiveSubtab: (tab: AnalyticsSubtab) => void;
  sessionToken: string | null;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Subtab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-[var(--surface)] rounded-xl w-fit">
        <button
          onClick={() => {
            setActiveSubtab("overview");
            router.push("/workspace?tab=analytics&sub=overview");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubtab === "overview"
              ? "bg-[#ef4444] text-white"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => {
            setActiveSubtab("usage");
            router.push("/workspace?tab=analytics&sub=usage");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubtab === "usage"
              ? "bg-[#ef4444] text-white"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Usage
        </button>
        <button
          onClick={() => {
            setActiveSubtab("logs");
            router.push("/workspace?tab=analytics&sub=logs");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubtab === "logs"
              ? "bg-[#ef4444] text-white"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <ScrollText className="w-4 h-4" />
          Logs
        </button>
      </div>

      {/* Subtab Content */}
      {activeSubtab === "overview" && (
        <AnalyticsOverviewTab apis={apis} analytics={analytics} workspace={workspace} agents={agents} usage={usage} />
      )}
      {activeSubtab === "usage" && (
        <UsageTab workspace={workspace} usage={usage} />
      )}
      {activeSubtab === "logs" && (
        <LogsTab sessionToken={sessionToken} />
      )}
    </div>
  );
}

// ============================================
// ANALYTICS OVERVIEW TAB
// ============================================

function AnalyticsOverviewTab({
  apis,
  analytics,
  workspace,
  agents,
  usage,
}: {
  apis: ProviderAPI[];
  analytics: ProviderAnalytics | null;
  workspace: Workspace | null;
  agents: Agent[];
  usage: UsageData | null;
}) {
  const totalCalls = analytics?.totalCalls || workspace?.usageCount || 0;
  const uniqueAgents = analytics?.uniqueAgents || agents.length || 0;
  const hasChartData = analytics && analytics.callsByDay && analytics.callsByDay.length > 0;

  return (
    <div className="space-y-8">
      {/* Preview Banner */}
      {analytics?.isPreview && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#ef4444] flex-shrink-0" />
          <div>
            <p className="font-medium text-[#ef4444]">Preview Mode</p>
            <p className="text-sm text-[var(--text-muted)]">This is sample data. Real analytics will appear once your agents start making API calls.</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Total Calls" value={totalCalls.toLocaleString()} icon={Zap} accent />
        <StatCard title="Connected Agents" value={uniqueAgents.toString()} icon={Users} />
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

          {/* Top Agents */}
          <div className="bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] p-6">
            <h3 className="font-semibold mb-4">Top Agents</h3>
            <div className="space-y-3">
              {(analytics?.topAgents || []).slice(0, 6).map((agent, i) => (
                <div key={agent.agentId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--surface)] flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">{i + 1}</span>
                    <span className="text-sm font-mono truncate max-w-[140px]">{agent.agentId.replace("agent_", "")}</span>
                  </div>
                  <span className="text-sm text-[var(--text-muted)]">{agent.calls.toLocaleString()}</span>
                </div>
              ))}
              {(!analytics?.topAgents || analytics.topAgents.length === 0) && <p className="text-[var(--text-muted)] text-sm">No agent activity yet</p>}
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

      {/* My APIs Performance */}
      {apis.length > 0 && (
        <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="font-semibold text-lg mb-4">My APIs Performance</h3>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#ef4444]" />
            <span className="text-sm sm:text-base text-[var(--text-muted)]">Total Calls</span>
          </div>
          <p className="text-2xl sm:text-4xl font-bold text-[#ef4444]">
            {(usage?.total || workspace?.usageCount || 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-muted)]" />
            <span className="text-sm sm:text-base text-[var(--text-muted)]">Providers Used</span>
          </div>
          <p className="text-2xl sm:text-4xl font-bold">{usage?.byProvider.length || 0}</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-muted)]" />
            <span className="text-sm sm:text-base text-[var(--text-muted)]">Remaining</span>
          </div>
          <p className="text-2xl sm:text-4xl font-bold">{workspace?.usageRemaining.toLocaleString() || "∞"}</p>
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
// LOGS TAB
// ============================================

interface LogEntry {
  id: string;
  provider: string;
  action: string;
  status: "success" | "error";
  latencyMs: number;
  errorMessage?: string;
  createdAt: number;
}

interface LogStats {
  totalCalls: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgLatency: number;
  providers: string[];
}

function LogsTab({ sessionToken }: { sessionToken: string | null }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [providers, setProviders] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchLogs = useCallback(async (append = false) => {
    if (!sessionToken) return;
    
    if (append) {
      setLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const cursor = append ? nextCursor : undefined;
      
      const logsRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "logs:getLogs",
          args: { 
            token: sessionToken, 
            limit: 50,
            cursor,
            status: statusFilter,
            provider: providerFilter === "all" ? undefined : providerFilter,
          },
        }),
      });

      const logsData = await logsRes.json();
      const result = logsData.value || logsData;

      if (append) {
        setLogs(prev => [...prev, ...(result.logs || [])]);
      } else {
        setLogs(result.logs || []);
      }
      setHasMore(result.hasMore || false);
      setNextCursor(result.nextCursor);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [sessionToken, statusFilter, providerFilter, nextCursor]);

  const fetchStats = useCallback(async () => {
    if (!sessionToken) return;

    try {
      const statsRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "logs:getLogStats",
          args: { token: sessionToken, periodDays: 7 },
        }),
      });

      const statsData = await statsRes.json();
      const result = statsData.value || statsData;
      setStats(result);
      setProviders(result.providers || []);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [sessionToken]);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  // Reset and refetch when filters change
  useEffect(() => {
    setNextCursor(undefined);
    fetchLogs(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, providerFilter]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!sessionToken) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-12 text-center">
          <ScrollText className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="font-semibold text-xl mb-2">Not Logged In</h3>
          <p className="text-[var(--text-muted)]">Please log in to view your API logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "success" | "error")}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
        
        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
        >
          <option value="all">All Providers</option>
          {providers.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      {stats && stats.totalCalls > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-muted)]">Total Calls</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalCalls.toLocaleString()}</p>
          </div>
          
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-[var(--text-muted)]">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.successRate}%</p>
          </div>
          
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-[var(--text-muted)]">Errors</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{stats.errorCount}</p>
          </div>
          
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-muted)]">Avg Latency</span>
            </div>
            <p className="text-2xl font-bold">{stats.avgLatency}ms</p>
          </div>
        </div>
      )}

      {/* Logs Table */}
      {isLoading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#ef4444] animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-12 text-center">
          <ScrollText className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="font-semibold text-xl mb-2">No API calls logged yet</h3>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">
            When your agents start making Direct Call API requests, they&apos;ll appear here with timestamps, latency, and status information.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--surface)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">Provider</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--surface)] transition">
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
                      {formatTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{log.provider}</span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="px-2 py-1 rounded bg-[var(--surface)] text-sm font-mono">
                        {log.action}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      {log.status === "success" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                          <Check className="w-3 h-3" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-500 text-xs font-medium" title={log.errorMessage}>
                          <AlertCircle className="w-3 h-3" />
                          Error
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={log.latencyMs > 1000 ? "text-yellow-500" : "text-[var(--text-muted)]"}>
                        {log.latencyMs}ms
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-[var(--border)]">
            {logs.map((log) => (
              <div key={log.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{log.provider}</span>
                  {log.status === "success" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                      <Check className="w-3 h-3" />
                      Success
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-500 text-xs font-medium">
                      <AlertCircle className="w-3 h-3" />
                      Error
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <code className="px-2 py-1 rounded bg-[var(--surface)] font-mono text-xs">
                    {log.action}
                  </code>
                  <span className="text-[var(--text-muted)]">{log.latencyMs}ms</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{formatTime(log.createdAt)}</p>
                {log.errorMessage && (
                  <p className="text-xs text-red-500 truncate">{log.errorMessage}</p>
                )}
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="p-4 border-t border-[var(--border)] text-center">
              <button
                onClick={() => fetchLogs(true)}
                disabled={loadingMore}
                className="px-6 py-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-elevated)] transition text-sm font-medium disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// BILLING TAB
// ============================================

interface BillingInfo {
  plan: string;
  tier: string;
  usage: number;
  currentPeriodUsage: number;
  limit: number;
  creditBalance: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  lastBillingDate?: number;
  needsPaymentMethod: boolean;
  invoices: Invoice[];
}

interface Invoice {
  id: string;
  stripeInvoiceId: string;
  amount: number;
  amountFormatted?: string;
  status: string;
  periodStart: number;
  periodEnd: number;
  callCount: number;
  pdfUrl?: string;
  createdAt: number;
}

interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

function BillingTab({ workspace, sessionToken }: { workspace: Workspace | null; sessionToken: string | null }) {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch billing info
  useEffect(() => {
    const fetchBillingData = async () => {
      if (!sessionToken || !workspace?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch billing info
        const infoRes = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "billing:getInfo",
            args: { workspaceId: workspace.id },
          }),
        });
        const infoData = await infoRes.json();
        const info = infoData.value || infoData;
        
        if (info && !info.error) {
          setBillingInfo(info);
          setInvoices(info.invoices || []);
        }

        // If user has Stripe customer, try to get payment method
        if (info?.stripeCustomerId) {
          try {
            const pmRes = await fetch("/api/billing/payment-method", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: sessionToken }),
            });
            const pmData = await pmRes.json();
            if (pmData.paymentMethod) {
              setPaymentMethod(pmData.paymentMethod);
            }
          } catch {
            // Payment method fetch is optional
          }
        }
      } catch (err) {
        console.error("Failed to fetch billing info:", err);
        setError("Failed to load billing information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingData();
  }, [sessionToken, workspace?.id]);

  // Open Stripe billing portal
  const openBillingPortal = async () => {
    if (!sessionToken) return;
    
    setIsLoadingPortal(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: sessionToken }),
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to open billing portal");
      }
    } catch {
      setError("Failed to open billing portal");
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const tier = billingInfo?.tier || workspace?.tier || "free";
  const plan = billingInfo?.plan || "free";
  const hasPaymentMethod = !!billingInfo?.stripeCustomerId;

  // Calculate estimated cost
  const FREE_CALLS = 100;
  const COST_PER_CALL = 0.002;
  const currentUsage = billingInfo?.currentPeriodUsage || workspace?.usageCount || 0;
  const billableCalls = Math.max(0, currentUsage - FREE_CALLS);
  const estimatedCost = billableCalls * COST_PER_CALL;

  // Plan display names
  const planDisplayNames: Record<string, string> = {
    free: "Free",
    usage_based: "Usage-Based",
    starter: "Starter",
    pro: "Pro",
    scale: "Scale",
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">Billing</h2>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#ef4444] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Billing</h2>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Current Plan */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-lg">Current Plan</h3>
            <p className="text-[var(--text-muted)]">Your workspace subscription</p>
          </div>
          <div className={`px-4 py-2 rounded-full font-semibold ${
            plan === "usage_based" 
              ? "bg-green-500/20 text-green-500" 
              : plan === "free" 
                ? "bg-[var(--surface)] text-[var(--text-muted)]"
                : "bg-[#ef4444]/20 text-[#ef4444]"
          }`}>
            {planDisplayNames[plan] || plan}
          </div>
        </div>

        {plan === "free" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">API Calls</span>
              <span className="font-medium">{workspace?.usageLimit?.toLocaleString() || "100"} / month</span>
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
        ) : plan === "usage_based" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">API Calls</span>
              <span className="font-medium flex items-center gap-2">
                Unlimited
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs">Active</span>
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Free Tier</span>
              <span className="font-medium">50 calls / month</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Rate</span>
              <span className="font-medium">$0.002 / call (after free tier)</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[var(--text-muted)]">Support</span>
              <span className="font-medium">Priority</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">API Calls</span>
              <span className="font-medium">{workspace?.usageLimit?.toLocaleString() || "10,000"} / month</span>
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

      {/* Usage This Month */}
      {workspace && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Usage This Month</h3>
            {plan === "usage_based" && (
              <div className="text-right">
                <p className="text-sm text-[var(--text-muted)]">Estimated Cost</p>
                <p className="text-2xl font-bold text-[#ef4444]">${estimatedCost.toFixed(2)}</p>
              </div>
            )}
          </div>
          
          <div className="h-4 bg-[var(--surface)] rounded-full overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                plan === "usage_based" 
                  ? "bg-green-500"
                  : workspace.usagePercentage > 90 
                    ? "bg-red-500" 
                    : workspace.usagePercentage > 70 
                      ? "bg-yellow-500" 
                      : "bg-[#ef4444]"
              }`}
              style={{ width: plan === "usage_based" ? "100%" : `${Math.min(workspace.usagePercentage, 100)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">
              {currentUsage.toLocaleString()} {plan === "usage_based" ? "calls this period" : `of ${workspace.usageLimit.toLocaleString()} calls used`}
            </span>
            {plan === "usage_based" ? (
              <span className="text-green-500 font-medium">
                {billableCalls > 0 ? `${billableCalls.toLocaleString()} billable` : "Within free tier"}
              </span>
            ) : (
              <span className="text-[var(--text-muted)]">{workspace.usagePercentage.toFixed(1)}%</span>
            )}
          </div>

          {plan === "usage_based" && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{currentUsage.toLocaleString()}</p>
                <p className="text-sm text-[var(--text-muted)]">Total Calls</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{Math.min(currentUsage, FREE_CALLS)}</p>
                <p className="text-sm text-[var(--text-muted)]">Free Calls</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#ef4444]">{billableCalls.toLocaleString()}</p>
                <p className="text-sm text-[var(--text-muted)]">Billable</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Method */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Payment Method</h3>
          {hasPaymentMethod && (
            <button
              onClick={openBillingPortal}
              disabled={isLoadingPortal}
              className="text-sm text-[#ef4444] hover:underline flex items-center gap-1"
            >
              {isLoadingPortal ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Manage
                  <ExternalLink className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>

        {paymentMethod ? (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface)]">
            <div className="w-12 h-8 rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <CreditCard className="w-6 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium capitalize">{paymentMethod.brand} •••• {paymentMethod.last4}</p>
              <p className="text-sm text-[var(--text-muted)]">Expires {paymentMethod.expMonth}/{paymentMethod.expYear}</p>
            </div>
            <Check className="w-5 h-5 text-green-500" />
          </div>
        ) : hasPaymentMethod ? (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface)]">
            <div className="w-12 h-8 rounded bg-green-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Payment method on file</p>
              <p className="text-sm text-[var(--text-muted)]">Managed through Stripe</p>
            </div>
            <button
              onClick={openBillingPortal}
              disabled={isLoadingPortal}
              className="text-sm text-[#ef4444] hover:underline"
            >
              View details
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-muted)] mb-4">No payment method on file</p>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Add a payment method to unlock unlimited API calls
            </p>
            {sessionToken && (
              <CheckoutButton sessionToken={sessionToken} variant="outline">
                <CreditCard className="w-4 h-4" />
                Add Payment Method
              </CheckoutButton>
            )}
          </div>
        )}
      </div>

      {/* Upgrade CTA - Only for free tier */}
      {plan === "free" && sessionToken && (
        <div className="rounded-2xl border border-[#ef4444]/30 bg-gradient-to-br from-[#ef4444]/10 to-[#ef4444]/5 p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#ef4444]/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#ef4444]" />
            </div>
            <div>
              <h3 className="font-bold text-xl mb-2">Unlock Unlimited API Calls</h3>
              <p className="text-[var(--text-muted)]">
                Pay only for what you use. First 50 calls free every month, then just $0.002 per call.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span>50 free calls / month</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span>$0.002 per additional call</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span>No monthly minimum</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>

          <CheckoutButton sessionToken={sessionToken} variant="primary">
            <CreditCard className="w-5 h-5" />
            Add Payment Method
            <ChevronRight className="w-5 h-5" />
          </CheckoutButton>
          
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            You&apos;ll only be charged for usage beyond 50 free calls. Billed monthly.
          </p>
        </div>
      )}

      {/* Invoices */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">Invoices</h3>
          {invoices.length > 0 && hasPaymentMethod && (
            <button
              onClick={openBillingPortal}
              disabled={isLoadingPortal}
              className="text-sm text-[#ef4444] hover:underline flex items-center gap-1"
            >
              View all in Stripe
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {invoices.length > 0 ? (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--background)] flex items-center justify-center">
                    <ScrollText className="w-5 h-5 text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {new Date(invoice.periodStart).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {invoice.callCount?.toLocaleString() || 0} API calls
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">${(invoice.amount / 100).toFixed(2)}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      invoice.status === "paid" 
                        ? "bg-green-500/20 text-green-500"
                        : invoice.status === "open" || invoice.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-500"
                          : "bg-red-500/20 text-red-500"
                    }`}>
                      {invoice.status === "paid" && <Check className="w-3 h-3" />}
                      {invoice.status === "paid" ? "Paid" : invoice.status === "open" ? "Pending" : invoice.status}
                    </span>
                  </div>
                  {invoice.pdfUrl && (
                    <a
                      href={invoice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-[var(--background)] transition"
                      title="View PDF"
                    >
                      <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] flex items-center justify-center mx-auto mb-4">
              <ScrollText className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-muted)] mb-2">No invoices yet</p>
            <p className="text-sm text-[var(--text-muted)]">
              {plan === "free" 
                ? "Invoices will appear here once you upgrade to a paid plan"
                : "Your first invoice will appear at the end of the billing period"}
            </p>
          </div>
        )}
      </div>

      {/* Credit Balance (if applicable) */}
      {billingInfo?.creditBalance && billingInfo.creditBalance > 0 && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Crown className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-green-500 font-medium">Credit Balance</p>
              <p className="text-2xl font-bold text-green-500">${(billingInfo.creditBalance / 100).toFixed(2)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            This credit will be applied to your next invoice automatically.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// WEBHOOKS TAB
// ============================================

interface WebhookData {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  lastTriggeredAt?: number;
  lastStatus?: string;
  failCount: number;
  createdAt: number;
  secretHint: string;
}

const WEBHOOK_EVENTS = [
  { id: "usage.threshold.80", label: "Usage at 80%", description: "Triggered when usage reaches 80% of limit" },
  { id: "usage.threshold.100", label: "Usage at 100%", description: "Triggered when usage reaches limit" },
  { id: "api.error", label: "API Error", description: "Triggered when an API call fails" },
  { id: "agent.connected", label: "Agent Connected", description: "Triggered when a new agent connects" },
  { id: "agent.revoked", label: "Agent Revoked", description: "Triggered when an agent is revoked" },
];

function WebhooksTab() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<WebhookData | null>(null);
  const [showSecretModal, setShowSecretModal] = useState<{ id: string; secret: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  
  // Add modal state
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch webhooks on mount
  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    const token = localStorage.getItem("apiclaw_workspace_session");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "webhooks:getWebhooks",
          args: { token },
        }),
      });
      const data = await res.json();
      const result = data.value || data;
      if (result.webhooks) {
        setWebhooks(result.webhooks);
      }
    } catch (err) {
      console.error("Failed to fetch webhooks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newUrl.trim() || newEvents.length === 0) {
      setError("URL and at least one event are required");
      return;
    }

    const token = localStorage.getItem("apiclaw_workspace_session");
    if (!token) return;

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "webhooks:createWebhook",
          args: { token, url: newUrl, events: newEvents },
        }),
      });
      const data = await res.json();
      const result = data.value || data;

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        // Show secret modal
        setShowSecretModal({ id: result.webhookId, secret: result.secret });
        setShowAddModal(false);
        setNewUrl("");
        setNewEvents([]);
        // Refresh webhooks
        await fetchWebhooks();
      }
    } catch (err) {
      setError("Failed to create webhook");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateWebhook = async (webhookId: string, updates: { enabled?: boolean; events?: string[] }) => {
    const token = localStorage.getItem("apiclaw_workspace_session");
    if (!token) return;

    try {
      const res = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "webhooks:updateWebhook",
          args: { token, webhookId, ...updates },
        }),
      });
      const data = await res.json();
      const result = data.value || data;

      if (result.success) {
        await fetchWebhooks();
        setShowEditModal(null);
      }
    } catch (err) {
      console.error("Failed to update webhook:", err);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (confirmDelete !== webhookId) {
      setConfirmDelete(webhookId);
      return;
    }

    const token = localStorage.getItem("apiclaw_workspace_session");
    if (!token) return;

    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "webhooks:deleteWebhook",
          args: { token, webhookId },
        }),
      });
      setWebhooks(webhooks.filter((w) => w.id !== webhookId));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Failed to delete webhook:", err);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    const token = localStorage.getItem("apiclaw_workspace_session");
    if (!token) return;

    setTestingWebhook(webhookId);
    setTestResult(null);

    try {
      const res = await fetch(`${CONVEX_URL}/api/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "webhooks:testWebhook",
          args: { token, webhookId },
        }),
      });
      const data = await res.json();
      const result = data.value || data;

      setTestResult({
        id: webhookId,
        success: result.success,
        message: result.message || (result.success ? "Delivered successfully" : "Failed to deliver"),
      });

      // Clear result after 5 seconds
      setTimeout(() => setTestResult(null), 5000);
    } catch (err) {
      setTestResult({
        id: webhookId,
        success: false,
        message: "Failed to test webhook",
      });
    } finally {
      setTestingWebhook(null);
    }
  };

  const toggleEvent = (eventId: string, currentEvents: string[], setEvents: (events: string[]) => void) => {
    if (currentEvents.includes(eventId)) {
      setEvents(currentEvents.filter((e) => e !== eventId));
    } else {
      setEvents([...currentEvents, eventId]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-[#ef4444] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Webhooks</h2>
          <p className="text-[var(--text-muted)]">Get notified when events happen in your workspace</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Webhook
        </button>
      </div>

      {/* Webhooks list */}
      {webhooks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-12 text-center">
          <Webhook className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="font-semibold text-xl mb-2">No Webhooks Configured</h3>
          <p className="text-[var(--text-muted)] max-w-md mx-auto mb-6">
            Add a webhook to get notified about events in your workspace.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" />
            Add Webhook
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">URL</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Events</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((webhook) => (
                  <tr key={webhook.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface)]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 max-w-xs">
                        <span className="truncate font-mono text-sm">{webhook.url}</span>
                      </div>
                      {webhook.lastTriggeredAt && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          Last triggered: {new Date(webhook.lastTriggeredAt).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 2).map((event) => (
                          <span key={event} className="px-2 py-0.5 rounded-full bg-[var(--surface)] text-xs">
                            {event.split(".").slice(-1)[0]}
                          </span>
                        ))}
                        {webhook.events.length > 2 && (
                          <span className="px-2 py-0.5 rounded-full bg-[var(--surface)] text-xs text-[var(--text-muted)]">
                            +{webhook.events.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {webhook.enabled ? (
                        <span className="flex items-center gap-1 text-green-500 text-sm">
                          <Check className="w-4 h-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[var(--text-muted)] text-sm">
                          <AlertCircle className="w-4 h-4" />
                          Disabled
                        </span>
                      )}
                      {webhook.failCount > 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          {webhook.failCount} failure{webhook.failCount > 1 ? "s" : ""}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Test result indicator */}
                        {testResult?.id === webhook.id && (
                          <span className={`text-xs px-2 py-1 rounded ${testResult.success ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                            {testResult.success ? "✓ Delivered" : `✗ ${testResult.message}`}
                          </span>
                        )}
                        <button
                          onClick={() => handleTestWebhook(webhook.id)}
                          disabled={testingWebhook === webhook.id}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition disabled:opacity-50"
                        >
                          {testingWebhook === webhook.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Test"
                          )}
                        </button>
                        <button
                          onClick={() => setShowEditModal(webhook)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteWebhook(webhook.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                            confirmDelete === webhook.id
                              ? "bg-red-500 text-white"
                              : "text-red-500 hover:bg-red-500/10"
                          }`}
                        >
                          {confirmDelete === webhook.id ? "Confirm" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Webhook Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Add Webhook</h3>
              <button onClick={() => { setShowAddModal(false); setError(null); }} className="p-2 rounded-lg hover:bg-[var(--surface)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Webhook URL</label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://your-server.com/webhook"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">Must use HTTPS</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Events</label>
                <div className="space-y-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <label key={event.id} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={newEvents.includes(event.id)}
                        onChange={() => toggleEvent(event.id, newEvents, setNewEvents)}
                        className="mt-0.5 w-4 h-4 rounded border-[var(--border)] text-[#ef4444] focus:ring-[#ef4444]"
                      />
                      <div>
                        <p className="font-medium text-sm">{event.label}</p>
                        <p className="text-xs text-[var(--text-muted)]">{event.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowAddModal(false); setError(null); setNewUrl(""); setNewEvents([]); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-[var(--surface)] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWebhook}
                  disabled={!newUrl.trim() || newEvents.length === 0 || isSaving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#ef4444] text-white font-medium hover:bg-[#dc2626] transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Webhook"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Webhook Modal */}
      {showEditModal && (
        <EditWebhookModal
          webhook={showEditModal}
          onClose={() => setShowEditModal(null)}
          onUpdate={handleUpdateWebhook}
        />
      )}

      {/* Secret Display Modal */}
      {showSecretModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] w-full max-w-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Webhook Created!</h3>
                <p className="text-sm text-[var(--text-muted)]">Save your signing secret now</p>
              </div>
            </div>

            <div className="rounded-xl bg-[var(--background)] border border-[var(--border)] p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--text-muted)]">Signing Secret</span>
                <button
                  onClick={() => copyToClipboard(showSecretModal.secret)}
                  className="flex items-center gap-1 text-sm text-[#ef4444] hover:underline"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
              <code className="block font-mono text-sm break-all">{showSecretModal.secret}</code>
            </div>

            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-500">Save this secret now!</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    This is the only time you&apos;ll see this secret. Use it to verify webhook signatures.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSecretModal(null)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#ef4444] text-white font-medium hover:bg-[#dc2626] transition"
            >
              I&apos;ve Saved My Secret
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditWebhookModal({
  webhook,
  onClose,
  onUpdate,
}: {
  webhook: WebhookData;
  onClose: () => void;
  onUpdate: (id: string, updates: { enabled?: boolean; events?: string[] }) => void;
}) {
  const [enabled, setEnabled] = useState(webhook.enabled);
  const [events, setEvents] = useState(webhook.events);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(webhook.id, { enabled, events });
    setIsSaving(false);
  };

  const toggleEvent = (eventId: string) => {
    if (events.includes(eventId)) {
      setEvents(events.filter((e) => e !== eventId));
    } else {
      setEvents([...events, eventId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">Edit Webhook</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--surface)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Webhook URL</label>
            <input
              type="url"
              value={webhook.url}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-muted)] opacity-60"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">URL cannot be changed for security reasons</p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
            <div>
              <p className="font-medium">Enabled</p>
              <p className="text-sm text-[var(--text-muted)]">Receive webhook notifications</p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`w-12 h-6 rounded-full transition relative ${enabled ? "bg-[#ef4444]" : "bg-[var(--border)]"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow ${enabled ? "left-6" : "left-0.5"}`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Events</label>
            <div className="space-y-2">
              {WEBHOOK_EVENTS.map((event) => (
                <label key={event.id} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-elevated)] cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={events.includes(event.id)}
                    onChange={() => toggleEvent(event.id)}
                    className="mt-0.5 w-4 h-4 rounded border-[var(--border)] text-[#ef4444] focus:ring-[#ef4444]"
                  />
                  <div>
                    <p className="font-medium text-sm">{event.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{event.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-[var(--surface)] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={events.length === 0 || isSaving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#ef4444] text-white font-medium hover:bg-[#dc2626] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// API KEYS TAB (BYOK)
// ============================================

interface ProviderKey {
  provider: string;
  keyHint: string;
  isCustom: boolean;
  createdAt: number;
  updatedAt: number;
}

interface BYOKProvider {
  id: string;
  name: string;
  icon: string;
}

const BYOK_PROVIDERS: BYOKProvider[] = [
  { id: "46elks", name: "46elks", icon: "phone" },
  { id: "twilio", name: "Twilio", icon: "phone" },
  { id: "resend", name: "Resend", icon: "mail" },
  { id: "openrouter", name: "OpenRouter", icon: "cpu" },
  { id: "elevenlabs", name: "ElevenLabs", icon: "activity" },
  { id: "replicate", name: "Replicate", icon: "sparkles" },
  { id: "firecrawl", name: "Firecrawl", icon: "globe" },
  { id: "brave_search", name: "Brave Search", icon: "search" },
  { id: "e2b", name: "E2B", icon: "terminal" },
  { id: "github", name: "GitHub", icon: "database" },
];

const ProviderIcon = ({ iconName, className = "w-6 h-6" }: { iconName: string; className?: string }) => {
  switch (iconName) {
    case "search": return <Search className={className} />;
    case "cpu": return <Cpu className={className} />;
    case "activity": return <Activity className={className} />;
    case "phone": return <Phone className={className} />;
    case "mail": return <Mail className={className} />;
    case "terminal": return <Terminal className={className} />;
    case "sparkles": return <Sparkles className={className} />;
    case "globe": return <Globe className={className} />;
    case "database": return <Database className={className} />;
    default: return <Zap className={className} />;
  }
};

function ApiKeysTab() {
  const [keys, setKeys] = useState<ProviderKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<BYOKProvider | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeys = async () => {
      const token = localStorage.getItem("apiclaw_workspace_session");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "providerKeys:getKeys",
            args: { token },
          }),
        });
        const data = await res.json();
        setKeys(data.value?.keys || data.keys || []);
      } catch (err) {
        console.error("Failed to fetch keys:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKeys();
  }, []);

  const handleAddKey = async () => {
    if (!selectedProvider || !apiKeyInput.trim()) return;

    const token = localStorage.getItem("apiclaw_workspace_session");
    if (!token) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "providerKeys:addKey",
          args: {
            token,
            provider: selectedProvider.id,
            apiKey: apiKeyInput,
          },
        }),
      });
      const data = await res.json();

      if (data.value?.success || data.success) {
        const keysRes = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "providerKeys:getKeys",
            args: { token },
          }),
        });
        const keysData = await keysRes.json();
        setKeys(keysData.value?.keys || keysData.keys || []);

        setSuccessMessage(`Key saved! Using your key for ${selectedProvider.name}`);
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowAddModal(false);
        setApiKeyInput("");
        setSelectedProvider(null);
      } else {
        setErrorMessage("Failed to save key. Please try again.");
      }
    } catch (err) {
      console.error("Failed to add key:", err);
      setErrorMessage("Failed to save key. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveKey = async (providerId: string) => {
    if (confirmRemove !== providerId) {
      setConfirmRemove(providerId);
      return;
    }

    const token = localStorage.getItem("apiclaw_workspace_session");
    if (!token) return;

    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "providerKeys:removeKey",
          args: { token, provider: providerId },
        }),
      });

      setKeys(keys.filter((k) => k.provider !== providerId));
      setConfirmRemove(null);
      setSuccessMessage("Key removed. Back to Direct Call.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to remove key:", err);
      setErrorMessage("Failed to remove key. Please try again.");
    }
  };

  const getKeyForProvider = (providerId: string) => {
    return keys.find((k) => k.provider === providerId);
  };

  const openAddModal = (provider: BYOKProvider) => {
    setSelectedProvider(provider);
    setApiKeyInput("");
    setErrorMessage(null);
    setShowAddModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-[#ef4444] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">API Keys</h2>
        <p className="text-[var(--text-muted)]">
          Direct Call works without keys. Add your own for unlimited calls and direct provider access.
        </p>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-500">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-500">{errorMessage}</p>
        </div>
      )}

      <div className="rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#ef4444]/20 flex items-center justify-center flex-shrink-0">
            <Key className="w-5 h-5 text-[#ef4444]" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Direct Call is Default</h3>
            <p className="text-sm text-[var(--text-muted)]">
              No API keys needed — APIClaw handles authentication for you. Add your own keys to bypass usage limits and route requests directly to providers.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold">Providers</h3>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {BYOK_PROVIDERS.map((provider) => {
            const userKey = getKeyForProvider(provider.id);
            const hasKey = !!userKey;

            return (
              <div
                key={provider.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-[var(--surface)] transition gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ef4444]/10 flex items-center justify-center">
                    <ProviderIcon iconName={provider.icon} className="w-5 h-5 text-[#ef4444]" />
                  </div>
                  <span className="font-medium">{provider.name}</span>
                </div>
                <div className="flex items-center gap-3 ml-10 sm:ml-0">
                  {hasKey ? (
                    <>
                      <span className="px-3 py-1 rounded-full bg-[#ef4444]/20 text-[#ef4444] text-sm font-medium">
                        Your Key (•••• {userKey.keyHint})
                      </span>
                      <button
                        onClick={() => openAddModal(provider)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveKey(provider.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          confirmRemove === provider.id
                            ? "bg-red-500 text-white"
                            : "text-red-500 hover:bg-red-500/10"
                        }`}
                      >
                        {confirmRemove === provider.id ? "Confirm" : "Remove"}
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm font-medium">
                        Direct Call
                      </span>
                      <button
                        onClick={() => openAddModal(provider)}
                        className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--surface)] hover:border-[#ef4444]/50 transition"
                      >
                        Add Your Key
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative group">
        <button
          className="w-full rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-6 text-center hover:border-[#ef4444]/50 transition opacity-50 cursor-not-allowed"
          disabled
        >
          <Plus className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
          <p className="font-medium text-[var(--text-muted)]">+ Add Custom Provider</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Connect any REST API with custom authentication</p>
        </button>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <span className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm font-medium shadow-lg">
            Coming soon
          </span>
        </div>
      </div>

      {/* Request a Provider */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold mb-1">Missing a provider?</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Let us know which API providers you'd like to see added to Direct Call.
            </p>
          </div>
          <a
            href="mailto:support_apiclaw@nordsym.com?subject=Provider%20Request&body=Hi%20APIClaw%20team,%0A%0AI%27d%20like%20to%20request%20support%20for%20the%20following%20provider:%0A%0AProvider%20name:%20%0AWebsite:%20%0AUse%20case:%20%0A%0AThanks!"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#ef4444]/50 text-[#ef4444] font-medium hover:bg-[#ef4444]/10 transition whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4" />
            Request a Provider
          </a>
        </div>
      </div>

      {showAddModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#ef4444]/10 flex items-center justify-center">
                <ProviderIcon iconName={selectedProvider.icon} className="w-7 h-7 text-[#ef4444]" />
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {getKeyForProvider(selectedProvider.id) ? "Update" : "Add"} {selectedProvider.name} Key
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Your key will be encrypted and stored securely.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Enter your API key..."
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50 pr-10"
                    autoFocus
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                </div>
              </div>

              {errorMessage && (
                <p className="text-sm text-red-500">{errorMessage}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setApiKeyInput("");
                    setSelectedProvider(null);
                    setErrorMessage(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-[var(--surface)] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddKey}
                  disabled={!apiKeyInput.trim() || isSaving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#ef4444] text-white font-medium hover:bg-[#dc2626] transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// EARN TAB
// ============================================

function EarnTab() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const referralCode = "CLAW-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  const earnChannels = [
    { id: "github", title: "Star on GitHub", credits: 20, href: "https://github.com/nordsym/apiclaw", icon: "star" },
    { id: "twitter", title: "Follow @NordSym", credits: 15, href: "https://x.com/NordSym", icon: "twitter" },
    { id: "newsletter", title: "Join Newsletter", credits: 15, href: "#newsletter", icon: "mail" },
  ];

  const EarnIcon = ({ iconName }: { iconName: string }) => {
    const iconClass = "w-8 h-8 text-[#ef4444]";
    switch (iconName) {
      case "star": return <Star className={iconClass} />;
      case "twitter": return <Twitter className={iconClass} />;
      case "mail": return <Mail className={iconClass} />;
      default: return <Zap className={iconClass} />;
    }
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText("https://apiclaw.nordsym.com?ref=" + referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Earn Credits</h2>
        <p className="text-[var(--text-muted)]">Complete tasks to earn free API calls. Max 50 extra calls.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {earnChannels.map((channel) => (
          <a
            key={channel.id}
            href={channel.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 hover:border-[#ef4444]/50 transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#ef4444]/10 flex items-center justify-center mb-3">
              <EarnIcon iconName={channel.icon} />
            </div>
            <h3 className="font-semibold mb-1">{channel.title}</h3>
            <p className="text-sm text-[#ef4444] font-medium">+{channel.credits} calls</p>
          </a>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 sm:p-6">
        <h3 className="font-semibold mb-2">Invite Friends</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">Earn 10 calls for each friend who joins.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={"https://apiclaw.nordsym.com?ref=" + referralCode}
            readOnly
            className="w-full sm:flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
          />
          <button
            onClick={handleCopyReferral}
            className="w-full sm:w-auto px-4 py-2 bg-[#ef4444] text-white rounded-lg font-medium hover:bg-[#dc2626] transition"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 sm:p-6">
        <h3 className="font-semibold mb-2">Newsletter (+15 calls)</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">Get weekly updates, tips, and new API announcements.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full sm:flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)]"
          />
          <button
            onClick={() => setSubscribed(true)}
            disabled={subscribed}
            className="w-full sm:w-auto px-4 py-2 bg-[#ef4444] text-white rounded-lg font-medium hover:bg-[#dc2626] transition disabled:opacity-50"
          >
            {subscribed ? "Subscribed!" : "Subscribe"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// DOCS TAB
// ============================================

function DocsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Documentation</h2>
        <p className="text-[var(--text-muted)]">Everything you need to integrate APIClaw with your AI agent.</p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <h3 className="font-semibold mb-4">Quick Start</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-2">1. Add to your MCP config:</p>
            <pre className="bg-[var(--background)] rounded-lg p-4 text-sm overflow-x-auto">
{`{
  "mcpServers": {
    "apiclaw": {
      "command": "npx",
      "args": ["@nordsym/apiclaw"]
    }
  }
}`}
            </pre>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-2">2. Or run directly:</p>
            <pre className="bg-[var(--background)] rounded-lg p-4 text-sm">npx @nordsym/apiclaw</pre>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-2">3. Interactive CLI mode:</p>
            <pre className="bg-[var(--background)] rounded-lg p-4 text-sm">npx @nordsym/apiclaw --cli</pre>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <h3 className="font-semibold mb-4">MCP Tools</h3>
        <div className="space-y-3">
          {[
            { name: "discover_apis", desc: "Search 19,000+ APIs by capability" },
            { name: "get_api_details", desc: "Get full details for a specific API" },
            { name: "call_api", desc: "Execute a Direct Call API" },
            { name: "list_connected", desc: "Show available Direct Call providers" },
            { name: "get_categories", desc: "List all API categories" },
            { name: "register_owner", desc: "Authenticate workspace via magic link" },
          ].map((tool) => (
            <div key={tool.name} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface)]">
              <code className="px-2 py-1 rounded bg-[#ef4444]/20 text-[#ef4444] text-sm font-mono">{tool.name}</code>
              <p className="text-sm text-[var(--text-muted)]">{tool.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <h3 className="font-semibold mb-4">Direct Call Providers (No API Key Needed)</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {["Brave Search", "46elks SMS", "Resend Email", "OpenRouter LLM", "ElevenLabs TTS", "Twilio", "E2B Code", "Web Scraper", "Screenshot"].map((p) => (
            <div key={p} className="px-3 py-2 rounded-lg bg-[var(--surface)] text-sm">{p}</div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <a href="https://github.com/nordsym/apiclaw" target="_blank" rel="noopener noreferrer" className="text-[#ef4444] hover:underline">
          GitHub Repository →
        </a>
        <a href="https://npmjs.com/package/@nordsym/apiclaw" target="_blank" rel="noopener noreferrer" className="text-[#ef4444] hover:underline">
          NPM Package →
        </a>
      </div>
    </div>
  );
}

// ============================================
// FEEDBACK TAB
// ============================================

interface FeedbackItem {
  _id: string;
  workspaceId: string;
  type: "bug" | "feature" | "general";
  content: string;
  votes: number;
  votedBy: string[];
  status: "new" | "reviewing" | "planned" | "shipped";
  createdAt: number;
  hasVoted: boolean;
  isOwn: boolean;
}

function FeedbackTab() {
  const [content, setContent] = useState("");
  const [feedbackType, setFeedbackType] = useState<"bug" | "feature" | "general">("feature");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "bug" | "feature" | "general">("all");
  const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");
  const [votingId, setVotingId] = useState<string | null>(null);

  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("apiclaw_workspace_session") : null;

  useEffect(() => {
    if (sessionToken) {
      fetchFeedback();
    }
  }, [sessionToken, filterType, sortBy]);

  const fetchFeedback = async () => {
    if (!sessionToken) return;
    
    try {
      const response = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "feedback:getFeedback",
          args: {
            token: sessionToken,
            filterType: filterType === "all" ? undefined : filterType,
            sortBy,
          },
        }),
      });

      const data = await response.json();
      const result = data.value || data;
      
      if (result.feedback) {
        setFeedbackList(result.feedback);
      }
    } catch (err) {
      console.error("Failed to fetch feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !sessionToken) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "feedback:submitFeedback",
          args: {
            token: sessionToken,
            type: feedbackType,
            content: content.trim(),
          },
        }),
      });

      const data = await response.json();
      if (data.value?.success || data.success) {
        setSubmitted(true);
        setContent("");
        setTimeout(() => setSubmitted(false), 3000);
        fetchFeedback();
      }
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (feedbackId: string, direction: "up" | "down") => {
    if (!sessionToken || votingId) return;

    setVotingId(feedbackId);
    try {
      const response = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "feedback:voteFeedback",
          args: {
            token: sessionToken,
            feedbackId,
            direction,
          },
        }),
      });

      const data = await response.json();
      const result = data.value || data;
      
      if (result.success) {
        setFeedbackList((prev) =>
          prev.map((f) =>
            f._id === feedbackId
              ? { ...f, votes: result.votes, hasVoted: result.hasVoted }
              : f
          )
        );
      }
    } catch (err) {
      console.error("Failed to vote:", err);
    } finally {
      setVotingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new": return "bg-gray-500/20 text-gray-400";
      case "reviewing": return "bg-yellow-500/20 text-yellow-500";
      case "planned": return "bg-blue-500/20 text-blue-500";
      case "shipped": return "bg-green-500/20 text-green-500";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "bug": return "bg-red-500/20 text-red-500";
      case "feature": return "bg-purple-500/20 text-purple-500";
      case "general": return "bg-gray-500/20 text-gray-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Feedback</h2>
        <p className="text-[var(--text-muted)]">Your feedback helps us improve APIClaw.</p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <h3 className="font-semibold mb-4">Share Your Feedback</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {(["bug", "feature", "general"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFeedbackType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                    feedbackType === type
                      ? type === "bug"
                        ? "bg-red-500 text-white"
                        : type === "feature"
                        ? "bg-purple-500 text-white"
                        : "bg-gray-500 text-white"
                      : "bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--background)]"
                  }`}
                >
                  {type === "bug" ? <><Bug className="w-4 h-4 inline mr-1" /> Bug</> : type === "feature" ? <><Sparkles className="w-4 h-4 inline mr-1" /> Feature</> : <><MessageCircle className="w-4 h-4 inline mr-1" /> General</>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Your Feedback</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                feedbackType === "bug"
                  ? "Describe the bug you encountered..."
                  : feedbackType === "feature"
                  ? "Describe the feature you'd like to see..."
                  : "Tell us what you think..."
              }
              className="w-full h-32 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50 resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">
              We read every piece of feedback.
            </p>
            <button
              type="submit"
              disabled={!content.trim() || submitting || submitted}
              className="px-6 py-2 bg-[#ef4444] text-white rounded-lg font-medium hover:bg-[#dc2626] transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitted ? (
                <><Check className="w-4 h-4" /> Sent!</>
              ) : submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="w-4 h-4" /> Submit</>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="font-semibold text-lg">Community Feedback</h3>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
            >
              <option value="all">All Types</option>
              <option value="bug">Bugs</option>
              <option value="feature">Features</option>
              <option value="general">General</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
            >
              <option value="votes">Most Votes</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 text-[#ef4444] animate-spin mx-auto mb-2" />
            <p className="text-sm text-[var(--text-muted)]">Loading feedback...</p>
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50">
            <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <h4 className="font-semibold mb-1">No Feedback Yet</h4>
            <p className="text-sm text-[var(--text-muted)]">
              Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbackList.map((item) => (
              <div
                key={item._id}
                className={`flex gap-3 p-4 rounded-xl border transition ${
                  item.isOwn
                    ? "border-[#ef4444]/30 bg-[#ef4444]/5"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                <div className="flex flex-col items-center gap-1 min-w-[40px]">
                  <button
                    onClick={() => handleVote(item._id, "up")}
                    disabled={votingId === item._id}
                    className={`p-1 rounded hover:bg-[var(--background)] transition ${
                      item.hasVoted ? "text-[#ef4444]" : "text-[var(--text-muted)]"
                    }`}
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <span className={`text-sm font-bold ${item.votes > 0 ? "text-[#ef4444]" : item.votes < 0 ? "text-red-500" : "text-[var(--text-muted)]"}`}>
                    {item.votes}
                  </span>
                  <button
                    onClick={() => handleVote(item._id, "down")}
                    disabled={votingId === item._id}
                    className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--background)] transition"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-primary)] mb-2">{item.content}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full capitalize ${getTypeBadge(item.type)}`}>
                      {item.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full capitalize ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-[var(--text-muted)]">
                      {formatDate(item.createdAt)}
                    </span>
                    {item.isOwn && (
                      <span className="text-[#ef4444]">• You</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// SETTINGS TAB
// ============================================

interface SettingsSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function SettingsSection({ title, icon: Icon, children, defaultOpen = false }: SettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface)] transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--surface)] flex items-center justify-center">
            <Icon className="w-5 h-5 text-[var(--text-muted)]" />
          </div>
          <span className="font-semibold">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 border-t border-[var(--border)]">
          {children}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ workspace, sessionToken }: { workspace: Workspace | null; sessionToken: string | null }) {
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const router = useRouter();

  // Open Stripe billing portal
  const openBillingPortal = async () => {
    if (!sessionToken) return;
    
    setIsLoadingPortal(true);
    setPortalError(null);
    
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: sessionToken }),
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPortalError(data.error || "Failed to open billing portal");
      }
    } catch {
      setPortalError("Failed to open billing portal");
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const hasStripeCustomer = workspace && (workspace as any).stripeCustomerId;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-[var(--text-muted)]">Manage your account and workspace settings.</p>
      </div>

      <SettingsSection title="Profile" icon={User} defaultOpen={true}>
        <div className="space-y-4 pt-4">
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Email</label>
            <input
              type="email"
              value={workspace?.email || ""}
              disabled
              className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Display Name</label>
            <input
              type="text"
              placeholder="Your name"
              disabled
              className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] opacity-60"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">Coming soon</p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Security" icon={Lock}>
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-[var(--text-muted)]">Add an extra layer of security</p>
            </div>
            <button
              disabled
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium opacity-50 cursor-not-allowed"
            >
              Enable
            </button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
            <div>
              <p className="font-medium">Active Sessions</p>
              <p className="text-sm text-[var(--text-muted)]">Manage your active login sessions</p>
            </div>
            <button
              disabled
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium opacity-50 cursor-not-allowed"
            >
              View
            </button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Notifications" icon={Bell}>
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-[var(--text-muted)]">Usage alerts, updates, and announcements</p>
            </div>
            <div className="w-12 h-6 rounded-full bg-[var(--border)] relative opacity-50 cursor-not-allowed">
              <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 left-0.5 shadow" />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
            <div>
              <p className="font-medium">Usage Threshold Alerts</p>
              <p className="text-sm text-[var(--text-muted)]">Get notified at 80% and 100% usage</p>
            </div>
            <div className="w-12 h-6 rounded-full bg-[var(--border)] relative opacity-50 cursor-not-allowed">
              <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 left-0.5 shadow" />
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Workspace" icon={Building}>
        <div className="space-y-4 pt-4">
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-2">Workspace Name</label>
            <input
              type="text"
              placeholder="My Workspace"
              disabled
              className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] opacity-60"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">Coming soon</p>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
            <div>
              <p className="font-medium">Tier</p>
              <p className="text-sm text-[var(--text-muted)]">Current subscription plan</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#ef4444]/20 text-[#ef4444] text-sm font-medium capitalize">
              {workspace?.tier || "Free"}
            </span>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Billing" icon={CreditCard}>
        <div className="space-y-4 pt-4">
          {portalError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {portalError}
            </div>
          )}
          
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
            <div>
              <p className="font-medium">Current Plan</p>
              <p className="text-sm text-[var(--text-muted)]">
                {workspace?.tier === "pro" || workspace?.tier === "usage_based" ? "Usage-Based" : "Free Tier"}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              workspace?.tier === "pro" || workspace?.tier === "usage_based"
                ? "bg-green-500/20 text-green-500"
                : "bg-[var(--surface-elevated)] text-[var(--text-muted)]"
            }`}>
              {workspace?.tier === "pro" || workspace?.tier === "usage_based" ? "Active" : "Free"}
            </span>
          </div>

          {hasStripeCustomer ? (
            <button
              onClick={openBillingPortal}
              disabled={isLoadingPortal}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#ef4444] text-white font-medium hover:bg-[#dc2626] transition disabled:opacity-50"
            >
              {isLoadingPortal ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Opening Portal...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Manage Billing
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => router.push("/workspace?tab=billing")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border)] text-[var(--text-primary)] font-medium hover:bg-[var(--surface)] transition"
            >
              <CreditCard className="w-4 h-4" />
              Add Payment Method
            </button>
          )}
          
          <p className="text-xs text-[var(--text-muted)] text-center">
            {hasStripeCustomer 
              ? "Update card, view invoices, or cancel subscription via Stripe"
              : "Add a payment method to unlock unlimited API calls"
            }
          </p>
        </div>
      </SettingsSection>

      <SettingsSection title="API Tokens" icon={Key}>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-[var(--text-muted)]">
            Generate API tokens for programmatic access to your workspace.
          </p>
          <button
            disabled
            className="w-full px-4 py-3 rounded-xl border border-dashed border-[var(--border)] text-sm font-medium text-[var(--text-muted)] hover:border-[#ef4444]/50 transition opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate New Token
          </button>
          <p className="text-xs text-[var(--text-muted)] text-center">Coming soon</p>
        </div>
      </SettingsSection>

      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <h3 className="font-semibold text-red-500 mb-2">Danger Zone</h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Irreversible actions. Proceed with caution.
        </p>
        <button
          disabled
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-500 font-medium opacity-50 cursor-not-allowed"
        >
          Delete Workspace
        </button>
      </div>
    </div>
  );
}