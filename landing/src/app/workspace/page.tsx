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
  ClipboardList,
  Bot,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Save,
  PlayCircle,
  ScanSearch,
  FileCode2,
  Layers,
  ArrowRight,
  ChevronRight as ChevronRightIcon,
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
import { EarnCreditsTab } from "@/components/EarnCreditsTab";
import statsData from "@/lib/stats.json";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://brilliant-puffin-712.eu-west-1.convex.cloud";

interface Workspace {
  id: string;
  email: string;
  workspaceName?: string;
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

interface ConnectedAgent {
  id: string;
  fingerprint: string;
  mcpClient: string;
  name?: string;
  hostname: string;
  aiBackend?: string;
  platform?: string;
  callCount: number;
  firstSeenAt: number;
  lastActiveAt: number;
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
  openApiUrl?: string;
  docsUrl?: string;
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

type TabType = "overview" | "api-catalog" | "my-agents" | "my-apis" | "analytics" | "webhooks" | "earn" | "docs" | "feedback" | "settings" | "billing";
type AnalyticsSubtab = "overview" | "usage" | "logs" | "chains";

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
  
  // Handle null searchParams
  if (!searchParams) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
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
  const [providerId, setProviderId] = useState<string | null>(null);
  const [isProvider, setIsProvider] = useState(false);
  const [showAddApi, setShowAddApi] = useState(false);
  
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
    const validTabs: TabType[] = ["overview", "api-catalog", "my-agents", "my-apis", "analytics", "webhooks", "earn", "docs", "feedback", "settings", "billing"];
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
      if (tabFromUrl === "analytics") {
        setAnalyticsExpanded(true);
        if (subFromUrl && ["overview", "usage", "logs", "chains"].includes(subFromUrl)) {
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

      // Load connected agents from new agents table
      const agentsRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "agents:getWorkspaceAgents",
          args: { token },
        }),
      });

      const agentsData = await agentsRes.json();
      const connectedAgents = agentsData.value || agentsData || [];
      // Map to legacy Agent interface for Overview compatibility
      setAgents(connectedAgents.map((a: ConnectedAgent) => ({
        id: a.id,
        fingerprint: a.fingerprint,
        name: a.name,
        lastUsedAt: a.lastActiveAt,
        createdAt: a.firstSeenAt,
        isCurrent: false,
      })));

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

  const fetchProviderData = useCallback(async (_workspaceId?: string, email?: string) => {
    if (!email) {
      setIsProvider(false);
      return;
    }
    try {
      const resolvedEmail = email;
      let apis: ProviderAPI[] = [];
      if (resolvedEmail) {
        const provRes = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: "providers:getProviderByEmail", args: { email: resolvedEmail } }),
        });
        const provData = await provRes.json();
        const provider = provData.value || provData;
        if (provider?._id) {
          setProviderId(provider._id);
          const legacyRes = await fetch(`${CONVEX_URL}/api/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: "providers:getProviderAPIsWithStatus", args: { providerId: provider._id } }),
          });
          const legacyData = await legacyRes.json();
          const all = legacyData.value || legacyData || [];
          // Deduplicate by name
          const seen = new Set<string>();
          apis = (Array.isArray(all) ? all : []).filter((a: ProviderAPI) => {
            if (seen.has(a.name)) return false;
            seen.add(a.name);
            return true;
          });
        }
      }
      if (apis.length > 0) {
        setProviderApis(apis);
        setIsProvider(true);
      }
      // Analytics — live data as calls come in
      try {
        const analyticsRes = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "providers:getAnalytics",
            args: { workspaceId: _workspaceId },
          }),
        });
        const analyticsData = await analyticsRes.json();
        const analytics = analyticsData.value || analyticsData;
        if (analytics && typeof analytics === "object" && !analytics.status) {
          setProviderAnalytics(analytics);
        } else {
          setProviderAnalytics(null);
        }
      } catch {
        setProviderAnalytics(null);
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
          // Fetch provider APIs — get email directly from dashboard (no extra round-trip needed)
          try {
            const dashRes = await fetch(`${CONVEX_URL}/api/query`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path: "workspaces:getWorkspaceDashboard", args: { token } }),
            });
            const dashData = await dashRes.json();
            const email = (dashData.value || dashData)?.workspace?.email;
            if (email) await fetchProviderData(undefined, email);
          } catch { /* ignore — provider APIs not critical for workspace load */ }
        }

        // Fetch all approved APIs for the catalog
        await fetchApprovedAPIs();

        // If no session, redirect to login
        if (!token) {
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

  // Reactively load provider APIs when workspace email becomes available
  useEffect(() => {
    if (workspace?.email) {
      fetchProviderData(undefined, workspace.email);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.email]);

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
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (sessionToken) {
        await fetchWorkspaceData(sessionToken);
        const email = workspace?.email;
        if (email) await fetchProviderData(undefined, email);
      }
      await fetchApprovedAPIs();
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
    { id: "api-catalog" as TabType, label: "API Catalog", icon: Zap },
    { id: "my-agents" as TabType, label: "My Agents", icon: Users },
    { id: "my-apis" as TabType, label: "My APIs", icon: Terminal },
    { id: "analytics" as TabType, label: "Analytics", icon: BarChart3, hasDropdown: true },
    { id: "webhooks" as TabType, label: "Notifications", icon: Bell },
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
        overview: "Agent Analytics",
        usage: "API Analytics",
        logs: "Logs",
        chains: "Chain Traces",
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

  const displayEmail = workspace?.workspaceName || workspace?.email || providerName || "User";
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
                  {workspace.usageLimit === -1 ? "Unlimited calls" : `${workspace.usageRemaining}/${workspace.usageLimit} calls`}
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
                          <span>Agent Analytics</span>
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
                          <span>API Analytics</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab("analytics");
                            setAnalyticsSubtab("chains");
                            setSidebarOpen(false);
                            router.push(`/workspace?tab=analytics&sub=chains`);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                            activeTab === "analytics" && analyticsSubtab === "chains"
                              ? "bg-[#ef4444]/20 text-[#ef4444]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <LinkIcon className="w-4 h-4" />
                          <span>Chains</span>
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
              title={isDark ? "Light Mode" : "Dark Mode"}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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
            {activeTab === "my-apis" && (
              <button onClick={() => setShowAddApi(true)} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />
                List New API
              </button>
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
            <AgentsTab agents={agents} onRevoke={handleRevokeAgent} onRename={handleRenameAgent} workspaceEmail={workspace?.email} sessionToken={sessionToken || undefined} isProvider={isProvider} />
          )}
          {activeTab === "my-apis" && (
            <MyAPIsTab apis={providerApis} onAdd={() => setShowAddApi(true)} showAddForm={showAddApi} onCloseForm={() => setShowAddApi(false)} sessionToken={sessionToken} providerId={providerId} />
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
              isProvider={isProvider}
            />
          )}
          {activeTab === "webhooks" && (
            <WebhooksTab sessionToken={sessionToken} />
          )}
          {activeTab === "billing" && (
            <BillingTab workspace={workspace} />
          )}
          {activeTab === "earn" && (
            <EarnCreditsTab showToast={showToast} />
          )}
          {activeTab === "docs" && (
            <DocsTab />
          )}
          {activeTab === "feedback" && (
            <FeedbackTab />
          )}
          {activeTab === "settings" && (
            <SettingsTab workspace={workspace} sessionToken={sessionToken} onWorkspaceUpdate={(patch) => setWorkspace(prev => prev ? { ...prev, ...patch } : prev)} />
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
  const isBacker = (workspace?.tier === "backer" || workspace?.tier === "founder") || workspace?.usageLimit === -1;
  const usagePct = isBacker ? 0 : workspace ? Math.min((workspace.usageCount / (workspace.usageLimit || 50)) * 100, 100) : 0;
  return (
    <div className="space-y-6">

      {/* ── WORLD 1: AGENT SIDE ─────────────────────────────────── */}
      <div>
        <div className="grid md:grid-cols-3 gap-3">
          {/* Agents card */}
          <button onClick={() => setActiveTab("my-agents")} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 text-left hover:border-[#ef4444]/40 transition">
            <div className="flex items-center justify-between mb-3">
              <Bot className="w-5 h-5 text-[#ef4444]" />
              {agents.length > 0 && <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Connected</span>}
            </div>
            <p className="text-2xl font-bold">{agents.length}</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{agents.length === 1 ? "agent" : "agents"} connected</p>
            {agents.length > 0 && (
              <div className="mt-3 space-y-1">
                {agents.slice(0, 2).map(a => (
                  <p key={a.id} className="text-xs text-[var(--text-muted)] truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)] shrink-0" />
                    {a.isCurrent ? <span className="text-[#ef4444]">{a.fingerprint} (current)</span> : a.fingerprint}
                  </p>
                ))}
              </div>
            )}
            {agents.length === 0 && <p className="text-xs text-[var(--text-muted)] mt-2">Run <code className="font-mono bg-[var(--surface)] px-1 rounded">mcp-install</code> to connect</p>}
          </button>

          {/* Usage card */}
          <button onClick={() => setActiveTab("analytics")} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 text-left hover:border-[#ef4444]/40 transition">
            <div className="flex items-center justify-between mb-3">
              <BarChart3 className="w-5 h-5 text-[#ef4444]" />
              <span className={`text-xs px-2 py-0.5 rounded-full ${isBacker ? "bg-green-500/20 text-green-400" : "bg-[var(--surface)] text-[var(--text-muted)]"}`}>
                {workspace?.tier === "partner" ? "Partner" : isBacker ? "Backer" : workspace?.tier || "free"}
              </span>
            </div>
            <p className="text-2xl font-bold">{workspace?.usageCount.toLocaleString() || "0"}</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {isBacker ? "calls (unlimited)" : `of ${workspace?.usageLimit || 50} this month`}
            </p>
            {!isBacker && workspace && (
              <div className="mt-3">
                <div className="h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${usagePct > 90 ? "bg-red-500" : usagePct > 70 ? "bg-yellow-500" : "bg-[#ef4444]"}`}
                    style={{ width: `${usagePct}%` }} />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{workspace.usageRemaining} remaining</p>
              </div>
            )}
          </button>

          {/* API Catalog access card */}
          <button onClick={() => setActiveTab("api-catalog")} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 text-left hover:border-[#ef4444]/40 transition">
            <div className="flex items-center justify-between mb-3">
              <ScanSearch className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold">{statsData.apiCount.toLocaleString()}</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">APIs in catalog</p>
            <div className="mt-3 space-y-1">
              <p className="text-xs flex items-center gap-1.5 text-green-400"><Check className="w-3 h-3" />Search always available</p>
              <p className="text-xs flex items-center gap-1.5 text-green-400"><Check className="w-3 h-3" />Open APIs always available</p>
              <p className={`text-xs flex items-center gap-1.5 ${isBacker || (workspace?.usageRemaining ?? 1) > 0 ? "text-green-400" : "text-red-400"}`}>
                {(isBacker || (workspace?.usageRemaining ?? 1) > 0) ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                Direct Call {(!isBacker && (workspace?.usageRemaining ?? 1) <= 0) ? "blocked (limit reached)" : "available"}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ── WORLD 2: PROVIDER SIDE ──────────────────────────────── */}
      {providerApis.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Your APIs</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-[#ef4444]" />
                <div>
                  <p className="font-semibold">{providerApis.length} APIs registered</p>
                  <p className="text-xs text-[var(--text-muted)]">Agents can discover and call these via APIClaw</p>
                </div>
              </div>
              <button onClick={() => setActiveTab("my-apis")} className="text-sm text-[#ef4444] hover:underline shrink-0">Manage</button>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {providerApis.slice(0, 5).map(api => (
                <div key={api._id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#ef4444]/10 flex items-center justify-center shrink-0">
                      <Zap className="w-3.5 h-3.5 text-[#ef4444]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{api.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{api.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {api.hasDirectCall && <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Direct Call</span>}
                    <span className={`text-xs px-2 py-0.5 rounded ${api.status === "approved" ? "bg-green-500/10 text-green-400" : api.status === "blocked" ? "bg-red-500/10 text-red-400" : api.status === "rate_limited" ? "bg-yellow-500/10 text-yellow-400" : "bg-yellow-500/10 text-yellow-400"}`}>{api.status === "approved" ? "Live" : api.status === "blocked" ? "Blocked" : api.status === "rate_limited" ? "Rate Limited" : api.status}</span>
                  </div>
                </div>
              ))}
              {providerApis.length > 5 && (
                <div className="px-5 py-3 text-sm text-[var(--text-muted)]">
                  +{providerApis.length - 5} more APIs
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade nudge for free tier running low */}
      {!isBacker && workspace && usagePct > 80 && (
        <div className="rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/5 p-5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-[#ef4444]">Running low on Direct Call usage</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Search and Open APIs always work. Direct Call APIs need usage credits.</p>
          </div>
          <button onClick={() => setActiveTab("billing")} className="px-4 py-2 rounded-xl bg-[#ef4444] text-white text-sm font-medium hover:bg-[#dc2626] transition shrink-0">Upgrade</button>
        </div>
      )}
    </div>
  );
}

// ============================================
// API CATALOG TAB (All Approved APIs)
// ============================================

const DIRECT_CALL_PROVIDERS = [
  { name: "APILayer", apis: 27, desc: "Exchange rates, stocks, aviation, weather, geolocation, email verification, VAT, news, scraping", category: "Multi-API" },
  { name: "Replicate", apis: 1000, desc: "Whisper, Stable Diffusion, Flux, Luma, 1000+ ML models", category: "Multi-API" },
  { name: "OpenRouter", apis: 100, desc: "GPT-4, Claude, Llama, Gemini, 100+ LLMs", category: "AI & LLM" },
  { name: "ElevenLabs", apis: 1, desc: "Text-to-speech in 29 languages", category: "Voice & TTS" },
  { name: "Groq", apis: 1, desc: "Ultra-fast LLM inference", category: "AI & LLM" },
  { name: "Deepgram", apis: 1, desc: "Speech-to-text transcription", category: "Voice & TTS" },
  { name: "Firecrawl", apis: 1, desc: "Web scraping to LLM-ready markdown", category: "Search" },
  { name: "Brave Search", apis: 1, desc: "Privacy-focused web search", category: "Search" },
  { name: "Serper", apis: 1, desc: "Google search API for AI", category: "Search" },
  { name: "E2B", apis: 1, desc: "Secure cloud sandboxes for code execution", category: "Code Execution" },
  { name: "GitHub", apis: 1, desc: "Repos, issues, PRs, and more", category: "Developer Tools" },
  { name: "Resend", apis: 1, desc: "Modern email API for developers", category: "Email" },
  { name: "46elks", apis: 1, desc: "SMS in Sweden and globally", category: "SMS & Messaging" },
  { name: "Twilio", apis: 1, desc: "Enterprise SMS and voice", category: "SMS & Messaging" },
  { name: "Mistral", apis: 1, desc: "Open-weight LLMs from Mistral AI", category: "AI & LLM" },
  { name: "Cohere", apis: 1, desc: "Enterprise NLP and embeddings", category: "AI & LLM" },
  { name: "Together AI", apis: 1, desc: "Open-source model inference", category: "AI & LLM" },
  { name: "Stability AI", apis: 1, desc: "Stable Diffusion image generation", category: "AI & LLM" },
  { name: "AssemblyAI", apis: 1, desc: "Audio transcription and intelligence", category: "Voice & TTS" },
];

function APICatalogTab({ apis }: { apis: ApprovedAPI[] }) {
  const [activeSection, setActiveSection] = useState<"direct-call" | "search" | "open-api">("direct-call");
  const [dcFilter, setDcFilter] = useState("all");
  const [openApiFilter, setOpenApiFilter] = useState("all");

  const dcCategories = ["all", ...Array.from(new Set(DIRECT_CALL_PROVIDERS.map(p => p.category)))];
  const filteredDc = dcFilter === "all" ? DIRECT_CALL_PROVIDERS : DIRECT_CALL_PROVIDERS.filter(p => p.category === dcFilter);

  const openApiCategories = ["all", ...Array.from(new Set(apis.map(a => a.category)))];
  const filteredOpenApis = openApiFilter === "all" ? apis : apis.filter(a => a.category === openApiFilter);

  const totalDcApis = DIRECT_CALL_PROVIDERS.reduce((sum, p) => sum + p.apis, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">API Catalog</h2>
        <p className="text-[var(--text-muted)] mt-1">Everything your agent can access via APIClaw MCP. Agents discover and call APIs — this is the reference view.</p>
      </div>

      {/* Section Selector */}
      <div className="grid grid-cols-3 gap-3">
        {/* Direct Call */}
        <button
          onClick={() => setActiveSection("direct-call")}
          className={`rounded-2xl border p-5 text-left transition ${activeSection === "direct-call" ? "border-[#ef4444] bg-[#ef4444]/5" : "border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[#ef4444]/40"}`}
        >
          <div className="w-10 h-10 rounded-xl bg-[#ef4444]/10 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5 text-[#ef4444]" />
          </div>
          <p className="font-semibold text-base">Direct Call</p>
          <p className="text-2xl font-bold mt-1">{DIRECT_CALL_PROVIDERS.length} <span className="text-sm font-normal text-[var(--text-muted)]">providers</span></p>
          <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">APIClaw handles all API keys. Your agent just calls — zero config.</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-mono text-green-400 bg-green-500/5 border border-green-500/20 rounded-lg px-2.5 py-1.5">
            <Layers className="w-3 h-3 shrink-0" />
            call_api(provider, action, params)
          </div>
        </button>

        {/* Search Index */}
        <button
          onClick={() => setActiveSection("search")}
          className={`rounded-2xl border p-5 text-left transition ${activeSection === "search" ? "border-[#ef4444] bg-[#ef4444]/5" : "border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[#ef4444]/40"}`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
            <ScanSearch className="w-5 h-5 text-blue-400" />
          </div>
          <p className="font-semibold text-base">Search Index</p>
          <p className="text-2xl font-bold mt-1">22k+ <span className="text-sm font-normal text-[var(--text-muted)]">APIs indexed</span></p>
          <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">Semantic search by capability. Agent describes what it needs — APIClaw finds the match.</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-mono text-blue-400 bg-blue-500/5 border border-blue-500/20 rounded-lg px-2.5 py-1.5">
            <ScanSearch className="w-3 h-3 shrink-0" />
            discover_apis(query)
          </div>
        </button>

        {/* Open API */}
        <button
          onClick={() => setActiveSection("open-api")}
          className={`rounded-2xl border p-5 text-left transition ${activeSection === "open-api" ? "border-[#ef4444] bg-[#ef4444]/5" : "border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[#ef4444]/40"}`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3">
            <FileCode2 className="w-5 h-5 text-purple-400" />
          </div>
          <p className="font-semibold text-base">Open APIs</p>
          <p className="text-2xl font-bold mt-1">1,636 <span className="text-sm font-normal text-[var(--text-muted)]">no key needed</span></p>
          <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">APIs that require no authentication. Your agent discovers and calls them directly through APIClaw.</p>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-mono text-purple-400 bg-purple-500/5 border border-purple-500/20 rounded-lg px-2.5 py-1.5">
            <FileCode2 className="w-3 h-3 shrink-0" />
            get_api_details(id)
          </div>
        </button>
      </div>

      {/* DIRECT CALL SECTION */}
      {activeSection === "direct-call" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">{filteredDc.length} Direct Call providers</p>
            <select value={dcFilter} onChange={e => setDcFilter(e.target.value)} className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-1 focus:ring-[#ef4444]">
              {dcCategories.map(c => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            {filteredDc.map(provider => (
              <div key={provider.name} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[#ef4444]/30 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ef4444]/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#ef4444]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{provider.name}</p>
                    <p className="text-xs text-[var(--text-muted)] max-w-md truncate">{provider.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--surface)] px-2 py-0.5 rounded">{provider.category}</span>
                  <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded">{provider.apis > 1 ? `${provider.apis}+ APIs` : "Ready"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEARCH INDEX SECTION */}
      {activeSection === "search" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><ScanSearch className="w-4 h-4 text-blue-400" />How agents use the search index</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">The agent doesn&apos;t browse — it searches by capability. APIClaw returns ranked matches with specs and pricing. The agent decides which API fits and calls it.</p>
            <div className="space-y-2">
              {[
                { q: "weather forecast API", returns: "Weatherstack, Open-Meteo, WeatherAPI" },
                { q: "translate text between languages", returns: "Languagelayer, LibreTranslate, DeepL" },
                { q: "geocode an address", returns: "Positionstack, Nominatim, Google Maps" },
                { q: "validate EU VAT number", returns: "VAT Layer, VIES, Apilayer VAT" },
              ].map(ex => (
                <div key={ex.q} className="rounded-lg bg-[var(--surface)] border border-[var(--border)] px-4 py-2.5 flex items-center gap-3">
                  <code className="text-sm text-blue-400 font-mono shrink-0">discover_apis(&quot;{ex.q}&quot;)</code>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <span className="text-xs text-[var(--text-muted)]">{ex.returns}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">22,000+ APIs indexed</p>
              <p className="text-sm text-[var(--text-muted)]">Updated continuously. Semantic vector search across name, description, category, and tags.</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-400">22k+</p>
              <p className="text-xs text-[var(--text-muted)]">APIs indexed</p>
            </div>
          </div>
        </div>
      )}

      {/* OPEN API SECTION */}
      {activeSection === "open-api" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><FileCode2 className="w-4 h-4 text-purple-400" />1,636 Open APIs — No API Key Required</h3>
            <p className="text-sm text-[var(--text-muted)] mb-2">These APIs require no authentication. Your agent discovers them via <code className="text-purple-400">discover_apis()</code> and calls them directly through APIClaw.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { cat: "Utilities", count: 529 },
              { cat: "Entertainment", count: 271 },
              { cat: "Analytics", count: 248 },
              { cat: "Development", count: 123 },
              { cat: "Location", count: 120 },
              { cat: "Finance", count: 66 },
              { cat: "AI & ML", count: 61 },
              { cat: "Business", count: 50 },
              { cat: "Health", count: 49 },
              { cat: "Communication", count: 36 },
              { cat: "Cloud", count: 35 },
              { cat: "Security", count: 32 },
              { cat: "Social", count: 10 },
              { cat: "Commerce", count: 6 },
            ].map(({ cat, count }) => (
              <div key={cat} className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 hover:border-purple-500/30 transition">
                <p className="text-2xl font-bold text-purple-400">{count}</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">{cat}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Total Open APIs</p>
              <p className="text-sm text-[var(--text-muted)]">All callable through APIClaw without any API key setup.</p>
            </div>
            <p className="text-2xl font-bold text-purple-400">1,636</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MY APIs TAB (Provider)
// ============================================

const APICLAW_MANAGED_PROVIDER = "k97cvcvadnyz8x8m4we7xqmh1s83p0ph";

function MyAPIsTab({ apis, onAdd, showAddForm, onCloseForm, sessionToken, providerId }: { apis: ProviderAPI[]; onAdd: () => void; showAddForm: boolean; onCloseForm: () => void; sessionToken: string | null; providerId: string | null }) {
  const isManagedByAPIClaw = providerId === APICLAW_MANAGED_PROVIDER;
  const [form, setForm] = useState({ name: "", description: "", category: "DevTools", openApiUrl: "", docsUrl: "", pricingModel: "freemium" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedApi, setSelectedApi] = useState<ProviderAPI | null>(null);
  const [apiDetailTab, setApiDetailTab] = useState<"direct-call" | "actions" | "test">("direct-call");

  // Direct Call config state
  const [dcConfig, setDcConfig] = useState({ baseUrl: "", authType: "bearer", authHeader: "Authorization", authPrefix: "Bearer ", masterApiKey: "", rateLimitPerUser: 60, rateLimitPerDay: 1000, pricePerRequest: 0, status: "draft", allowCustomerKeys: true, requireCustomerKeys: false });
  const [dcConfigId, setDcConfigId] = useState<string | null>(null);
  const [dcSaving, setDcSaving] = useState(false);
  const [dcSaved, setDcSaved] = useState(false);
  const [dcLoading, setDcLoading] = useState(false);
  const [showMasterKey, setShowMasterKey] = useState(false);

  // Actions state
  const [actions, setActions] = useState<{_id: string; name: string; displayName: string; description: string; method: string; path: string; enabled: boolean}[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);
  const [actionForm, setActionForm] = useState({ name: "", displayName: "", description: "", method: "GET", path: "" });
  const [actionSaving, setActionSaving] = useState(false);

  // Test state
  const [testAction, setTestAction] = useState("");
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const loadDirectCallConfig = useCallback(async (api: ProviderAPI) => {
    setDcLoading(true);
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "directCall:getDirectCallConfigByApiId", args: { apiId: api._id } }),
      });
      const data = await res.json();
      const config = data.value;
      if (config) {
        setDcConfigId(config._id);
        setDcConfig({ baseUrl: config.baseUrl || "", authType: config.authType || "bearer", authHeader: config.authHeader || "Authorization", authPrefix: config.authPrefix || "Bearer ", masterApiKey: "", rateLimitPerUser: config.rateLimitPerUser || 60, rateLimitPerDay: config.rateLimitPerDay || 1000, pricePerRequest: config.pricePerRequest || 0, status: config.status || "draft", allowCustomerKeys: config.allowCustomerKeys ?? true, requireCustomerKeys: config.requireCustomerKeys ?? false });
      } else {
        setDcConfigId(null);
        setDcConfig({ baseUrl: "", authType: "bearer", authHeader: "Authorization", authPrefix: "Bearer ", masterApiKey: "", rateLimitPerUser: 60, rateLimitPerDay: 1000, pricePerRequest: 0, status: "draft", allowCustomerKeys: true, requireCustomerKeys: false });
      }
    } catch { /* ignore */ } finally { setDcLoading(false); }
  }, []);

  const loadActions = useCallback(async (api: ProviderAPI) => {
    setActionsLoading(true);
    try {
      const cfgRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "directCall:getDirectCallConfigByApiId", args: { apiId: api._id } }),
      });
      const cfgData = await cfgRes.json();
      const config = cfgData.value;
      if (config?._id) {
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: "directCall:getActions", args: { directCallId: config._id } }),
        });
        const data = await res.json();
        setActions(Array.isArray(data.value) ? data.value : []);
      } else {
        setActions([]);
      }
    } catch { /* ignore */ } finally { setActionsLoading(false); }
  }, []);

  const handleSelectApi = useCallback((api: ProviderAPI) => {
    setSelectedApi(api);
    setApiDetailTab("direct-call");
    setDcSaved(false);
    loadDirectCallConfig(api);
    loadActions(api);
  }, [loadDirectCallConfig, loadActions]);

  const saveDcConfig = async () => {
    if (!selectedApi) return;
    setDcSaving(true);
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "directCall:saveConfig", args: { apiId: selectedApi._id, ...dcConfig } }),
      });
      setDcSaved(true);
      setTimeout(() => setDcSaved(false), 3000);
      loadDirectCallConfig(selectedApi);
    } catch { /* ignore */ } finally { setDcSaving(false); }
  };

  const saveAction = async () => {
    if (!dcConfigId) return;
    setActionSaving(true);
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "directCall:saveAction", args: { directCallId: dcConfigId, ...actionForm } }),
      });
      setActionForm({ name: "", displayName: "", description: "", method: "GET", path: "" });
      setShowAddAction(false);
      if (selectedApi) loadActions(selectedApi);
    } catch { /* ignore */ } finally { setActionSaving(false); }
  };

  const deleteAction = async (actionId: string) => {
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "directCall:deleteAction", args: { actionId } }),
      });
      if (selectedApi) loadActions(selectedApi);
    } catch { /* ignore */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description) return;
    setSubmitting(true);
    try {
      const session = localStorage.getItem("apiclaw_workspace_session");
      const wsRes = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/query`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "workspaces:getSession", args: { token: session || "" } }),
      });
      const wsData = await wsRes.json();
      const ws = wsData.value || wsData;
      const wsId = ws?.workspaceId || ws?.id || ws?._id;
      if (!wsId) throw new Error("No workspace");
      await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/mutation`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "providers:createForWorkspace", args: { workspaceId: wsId, ...form } }),
      });
      setSubmitted(true);
      setTimeout(() => { onCloseForm(); window.location.reload(); }, 1500);
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  const CATEGORIES = ["DevTools","Finance","Geolocation","News","Transport","AI & LLM","Email","SMS","Search","Payments","Auth","Weather","Maps","Other"];

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">List an API</h2>
            <p className="text-[var(--text-muted)]">Add your API to the APIClaw catalog.</p>
          </div>
          <button onClick={onCloseForm} className="p-2 rounded-lg hover:bg-[var(--surface)] transition text-[var(--text-muted)] hover:text-[var(--text-primary)]">✕</button>
        </div>
        {submitted ? (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-8 text-center">
            <p className="text-green-400 font-semibold">API listed successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 space-y-4">
            {[
              { label: "API Name", key: "name", placeholder: "e.g. Exchange Rates" },
              { label: "Description", key: "description", placeholder: "What does this API do?" },
              { label: "OpenAPI Spec URL", key: "openApiUrl", placeholder: "https://..." },
              { label: "Documentation URL", key: "docsUrl", placeholder: "https://..." },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">{label}</label>
                <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-[#ef4444] focus:ring-1 focus:ring-[#ef4444] outline-none" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Pricing Model</label>
                <select value={form.pricingModel} onChange={e => setForm(f => ({ ...f, pricingModel: e.target.value }))}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="free">Free</option>
                  <option value="freemium">Freemium</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onCloseForm} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">Cancel</button>
              <button type="submit" disabled={submitting || !form.name || !form.description}
                className="px-6 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-semibold hover:bg-[#dc2626] disabled:opacity-50 transition">
                {submitting ? "Listing..." : "List API"}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  if (!apis || apis.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">My APIs</h2>
          <p className="text-[var(--text-muted)]">Choose how you want AI agents to access your API.</p>
        </div>

        {/* Three integration options */}
        <div className="grid gap-4 md:grid-cols-3">
          <button onClick={onAdd} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 hover:border-[#ef4444]/50 transition text-left">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface)] flex items-center justify-center mb-4 group-hover:bg-[#ef4444]/10 transition">
              <Search className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[#ef4444] transition" />
            </div>
            <h3 className="font-semibold text-lg mb-1">List API</h3>
            <p className="text-[#ef4444] text-sm font-medium mb-3">Get discovered</p>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Appear in the APIClaw catalog. AI agents find you when searching for capabilities.
            </p>
            <div className="flex items-center justify-end">
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[#ef4444] group-hover:translate-x-1 transition" />
            </div>
          </button>

          <button onClick={onAdd} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 hover:border-[#ef4444]/50 transition text-left">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface)] flex items-center justify-center mb-4 group-hover:bg-[#ef4444]/10 transition">
              <Globe className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[#ef4444] transition" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Open API</h3>
            <p className="text-[#ef4444] text-sm font-medium mb-3">Indexed & callable</p>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Provide your public OpenAPI spec. APIClaw indexes it so agents can discover and call your endpoint through the platform.
            </p>
            <div className="flex items-center justify-end">
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[#ef4444] group-hover:translate-x-1 transition" />
            </div>
          </button>

          <button onClick={onAdd} className="group rounded-2xl border border-[#ef4444]/30 bg-gradient-to-br from-[#ef4444]/5 to-transparent p-6 hover:border-[#ef4444]/50 transition text-left relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-[#ef4444]/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-[#ef4444]" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Direct Call</h3>
            <p className="text-[#ef4444] text-sm font-medium mb-3">We handle keys</p>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              APIClaw manages authentication and billing. Agents call your API without handling keys.
            </p>
            <div className="flex items-center justify-end">
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[#ef4444] group-hover:translate-x-1 transition" />
            </div>
          </button>
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
      </div>

      <div className="grid gap-4">
        {apis.map((api) => (
          <div key={api._id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden hover:border-[#ef4444]/30 transition">
            {/* Row */}
            <div
              className="flex items-center justify-between p-6 cursor-pointer"
              onClick={() => selectedApi?._id === api._id ? setSelectedApi(null) : handleSelectApi(api)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg">{api.name}</h3>
                  {api.hasDirectCall && <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">Direct Call</span>}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${api.status === "approved" ? "bg-green-500/20 text-green-500" : api.status === "blocked" ? "bg-red-500/20 text-red-500" : api.status === "rate_limited" ? "bg-yellow-500/20 text-yellow-500" : "bg-yellow-500/20 text-yellow-500"}`}>{api.status === "approved" ? "Live" : api.status === "blocked" ? "Blocked" : api.status === "rate_limited" ? "Rate Limited" : api.status}</span>
                </div>
                <p className="text-sm text-[var(--text-muted)]">{api.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                  <span>{api.category}</span>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-[var(--text-muted)] ml-4 transition-transform ${selectedApi?._id === api._id ? "rotate-180" : ""}`} />
            </div>

            {/* Detail Panel */}
            {selectedApi?._id === api._id && (
              <div className="border-t border-[var(--border)] bg-[var(--background)]">
                {/* Sub-tabs */}
                <div className="flex border-b border-[var(--border)] px-6">
                  {(["direct-call", "actions", "test"] as const).map(tab => (
                    <button key={tab} onClick={() => setApiDetailTab(tab)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition -mb-px ${apiDetailTab === tab ? "border-[#ef4444] text-[#ef4444]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
                      {tab === "direct-call" ? "Direct Call" : tab === "actions" ? "Actions" : "Test"}
                    </button>
                  ))}
                </div>

                <div className="p-6 space-y-4">
                  {/* DIRECT CALL TAB */}
                  {apiDetailTab === "direct-call" && (
                    dcLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#ef4444] animate-spin" /></div> : (
                      <div className="space-y-4">
                        <p className="text-sm text-[var(--text-muted)]">{isManagedByAPIClaw ? "This API is managed by APIClaw. Configuration is handled automatically." : "Configure how agents call this API. The service provider key is stored encrypted and never exposed to agents."}</p>
                        {isManagedByAPIClaw && dcConfig.status === "live" && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-green-500">Live — agents can call this API now</span>
                          </div>
                        )}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wide">Base URL</label>
                            <input value={dcConfig.baseUrl} onChange={e => !isManagedByAPIClaw && setDcConfig(p => ({...p, baseUrl: e.target.value}))} readOnly={isManagedByAPIClaw} placeholder="https://api.example.com" className={`w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm ${isManagedByAPIClaw ? "opacity-60 cursor-not-allowed" : "focus:outline-none focus:ring-1 focus:ring-[#ef4444]"}`} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wide">Auth Type</label>
                            <select value={dcConfig.authType} onChange={e => !isManagedByAPIClaw && setDcConfig(p => ({...p, authType: e.target.value}))} disabled={isManagedByAPIClaw} className={`w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm ${isManagedByAPIClaw ? "opacity-60 cursor-not-allowed" : "focus:outline-none focus:ring-1 focus:ring-[#ef4444]"}`}>
                              <option value="bearer">Bearer Token</option>
                              <option value="api_key">API Key Header</option>
                              <option value="basic">Basic Auth</option>
                              <option value="none">No Auth</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wide">Auth Header</label>
                            <input value={dcConfig.authHeader} onChange={e => !isManagedByAPIClaw && setDcConfig(p => ({...p, authHeader: e.target.value}))} readOnly={isManagedByAPIClaw} placeholder="apikey" className={`w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm ${isManagedByAPIClaw ? "opacity-60 cursor-not-allowed" : "focus:outline-none focus:ring-1 focus:ring-[#ef4444]"}`} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wide">Service Provider Key</label>
                            {isManagedByAPIClaw ? (
                              <div className="relative">
                                <input type="password" readOnly value="managed-by-apiclaw-proxy-key" className="w-full px-3 py-2 pr-24 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-mono opacity-40 cursor-not-allowed select-none" />
                                <span className="absolute right-2 top-1.5 text-xs text-[#ef4444] font-semibold bg-[var(--surface)] px-2 py-0.5 rounded border border-[#ef4444]/30">Managed by APIClaw</span>
                              </div>
                            ) : (
                              <div className="relative">
                                <input type={showMasterKey ? "text" : "password"} value={dcConfig.masterApiKey} onChange={e => setDcConfig(p => ({...p, masterApiKey: e.target.value}))} placeholder={dcConfigId ? "Leave blank to keep existing" : "Paste your service provider key here"} className="w-full px-3 py-2 pr-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#ef4444]" />
                                <button type="button" onClick={() => setShowMasterKey(v => !v)} className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                  {showMasterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wide">Rate Limit / User / Min</label>
                            <input type="number" value={dcConfig.rateLimitPerUser} onChange={e => !isManagedByAPIClaw && setDcConfig(p => ({...p, rateLimitPerUser: +e.target.value}))} readOnly={isManagedByAPIClaw} className={`w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm ${isManagedByAPIClaw ? "opacity-60 cursor-not-allowed" : "focus:outline-none focus:ring-1 focus:ring-[#ef4444]"}`} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wide">Status</label>
                            <select value={dcConfig.status} onChange={e => !isManagedByAPIClaw && setDcConfig(p => ({...p, status: e.target.value}))} disabled={isManagedByAPIClaw} className={`w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm ${isManagedByAPIClaw ? "opacity-60 cursor-not-allowed" : "focus:outline-none focus:ring-1 focus:ring-[#ef4444]"}`}>
                              <option value="draft">Draft</option>
                              <option value="testing">Testing</option>
                              <option value="live">Live</option>
                            </select>
                          </div>
                        </div>
                        {!isManagedByAPIClaw && (
                        <button onClick={saveDcConfig} disabled={dcSaving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ef4444] text-white text-sm font-medium hover:bg-[#dc2626] transition disabled:opacity-50">
                          {dcSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : dcSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                          {dcSaving ? "Saving..." : dcSaved ? "Saved!" : "Save Config"}
                        </button>
                        )}
                      </div>
                    )
                  )}

                  {/* ACTIONS TAB */}
                  {apiDetailTab === "actions" && (
                    actionsLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#ef4444] animate-spin" /></div> : (
                      <div className="space-y-4">
                        {!dcConfigId && <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-400">Configure Direct Call first before adding actions.</div>}
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-[var(--text-muted)]">{actions.length} action{actions.length !== 1 ? "s" : ""} defined</p>
                          {dcConfigId && <button onClick={() => setShowAddAction(v => !v)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ef4444]/10 text-[#ef4444] text-sm font-medium hover:bg-[#ef4444]/20 transition"><Plus className="w-4 h-4" />Add Action</button>}
                        </div>
                        {showAddAction && (
                          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                            <div className="grid md:grid-cols-2 gap-3">
                              <input value={actionForm.name} onChange={e => setActionForm(p => ({...p, name: e.target.value}))} placeholder="action_name (machine)" className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#ef4444]" />
                              <input value={actionForm.displayName} onChange={e => setActionForm(p => ({...p, displayName: e.target.value}))} placeholder="Display Name" className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#ef4444]" />
                              <select value={actionForm.method} onChange={e => setActionForm(p => ({...p, method: e.target.value}))} className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#ef4444]">
                                {["GET","POST","PUT","PATCH","DELETE"].map(m => <option key={m}>{m}</option>)}
                              </select>
                              <input value={actionForm.path} onChange={e => setActionForm(p => ({...p, path: e.target.value}))} placeholder="/endpoint/path" className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#ef4444]" />
                              <input value={actionForm.description} onChange={e => setActionForm(p => ({...p, description: e.target.value}))} placeholder="Description" className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm col-span-2 focus:outline-none focus:ring-1 focus:ring-[#ef4444]" />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={saveAction} disabled={actionSaving || !actionForm.name || !actionForm.path} className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-medium hover:bg-[#dc2626] transition disabled:opacity-50">{actionSaving ? "Saving..." : "Add"}</button>
                              <button onClick={() => setShowAddAction(false)} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-muted)] hover:bg-[var(--surface)] transition">Cancel</button>
                            </div>
                          </div>
                        )}
                        {actions.length === 0 && !showAddAction && <p className="text-sm text-[var(--text-muted)] py-4 text-center">No actions yet. Add an action to define what endpoints agents can call.</p>}
                        <div className="space-y-2">
                          {actions.map(action => (
                            <div key={action._id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${action.method === "GET" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>{action.method}</span>
                                <div>
                                  <p className="text-sm font-medium">{action.displayName}</p>
                                  <p className="text-xs text-[var(--text-muted)] font-mono">{action.path}</p>
                                </div>
                              </div>
                              <button onClick={() => deleteAction(action._id)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  {/* TEST TAB */}
                  {apiDetailTab === "test" && (
                    <div className="space-y-4">
                      {isManagedByAPIClaw ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                            <Check className="w-6 h-6 text-green-500" />
                          </div>
                          <p className="font-medium mb-1">Managed by APIClaw</p>
                          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-4">This API is tested and verified by APIClaw. Agents call it through the MCP proxy — no direct testing needed from the dashboard.</p>
                          <code className="text-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 font-mono text-[#ef4444]">call_api(&#123; provider: &quot;apilayer&quot;, action: &quot;...&quot; &#125;)</code>
                        </div>
                      ) : actions.length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)] py-4 text-center">No actions configured. Add actions in the Actions tab first.</p>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wide">Select Action</label>
                            <select value={testAction} onChange={e => { setTestAction(e.target.value); setTestParams({}); setTestResult(null); }} className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#ef4444]">
                              <option value="">— choose —</option>
                              {actions.map(a => <option key={a._id} value={a._id}>{a.displayName} ({a.method} {a.path})</option>)}
                            </select>
                          </div>
                          {testAction && (
                            <button onClick={async () => {
                              setTestLoading(true); setTestResult(null);
                              try {
                                const action = actions.find(a => a._id === testAction);
                                if (!action || !dcConfig.baseUrl) { setTestResult("Configure Direct Call first."); return; }
                                const url = dcConfig.baseUrl.replace(/\/$/, "") + action.path;
                                const headers: Record<string, string> = { "Content-Type": "application/json" };
                                if (dcConfig.authType !== "none" && dcConfig.masterApiKey) headers[dcConfig.authHeader] = (dcConfig.authPrefix + dcConfig.masterApiKey).trim();
                                const res = await fetch(url, { method: action.method, headers });
                                const body = await res.text();
                                setTestResult(`HTTP ${res.status}\n${body.substring(0, 2000)}`);
                              } catch (e: unknown) { setTestResult("Error: " + (e instanceof Error ? e.message : String(e))); }
                              finally { setTestLoading(false); }
                            }} disabled={testLoading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-medium hover:bg-[#dc2626] transition disabled:opacity-50">
                              {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                              {testLoading ? "Running..." : "Run Test"}
                            </button>
                          )}
                          {testResult && (
                            <pre className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap">{testResult}</pre>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// AGENTS TAB - Agent-first hierarchy view
// ============================================

interface MainAgentData {
  workspaceId: string;
  email: string;
  mainAgentId: string | null;
  mainAgentName: string | null;
  aiBackend?: string | null;
  usageCount: number;
  createdAt: number;
}

interface SubagentData {
  id: string;
  subagentId: string;
  name: string;
  description?: string;
  aiBackend?: string;
  isRegistered?: boolean;
  callCount: number;
  firstSeenAt: number;
  lastActiveAt: number;
}

function AgentsTab({
  agents,
  onRevoke,
  onRename,
  workspaceEmail,
  sessionToken,
  isProvider = false,
}: {
  agents: Agent[];
  onRevoke: (agentId: string) => void;
  onRename: (agentId: string, name: string) => void;
  workspaceEmail?: string;
  sessionToken?: string;
  isProvider?: boolean;
}) {
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [copied, setCopied] = useState(false);

  // Connected agents from agents table (not agentSessions)
  const [connectedAgents, setConnectedAgents] = useState<ConnectedAgent[]>([]);

  // Main agent data from backend (legacy)
  const [mainAgent, setMainAgent] = useState<MainAgentData | null>(null);
  const [subagents, setSubagents] = useState<SubagentData[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);

  // Modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingSubagent, setEditingSubagent] = useState<SubagentData | null>(null);
  const [expandedSubagent, setExpandedSubagent] = useState<string | null>(null);

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    subagentId: "",
    name: "",
    description: "",
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Fetch connected agents + subagents
  useEffect(() => {
    const fetchAgentData = async () => {
      if (!sessionToken) {
        setIsLoadingAgents(false);
        return;
      }

      try {
        // Fetch connected agents (from agents table)
        const agentsRes = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "agents:getWorkspaceAgents",
            args: { token: sessionToken },
          }),
        });
        const agentsData = await agentsRes.json();
        const agentsResult = agentsData.value || agentsData;
        if (Array.isArray(agentsResult)) {
          setConnectedAgents(agentsResult);
        }

        // Fetch main agent (legacy — for backward compat)
        const mainRes = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "agents:getMainAgent",
            args: { token: sessionToken },
          }),
        });
        const mainData = await mainRes.json();
        const mainResult = mainData.value || mainData;
        if (mainResult && !mainResult.error) {
          setMainAgent(mainResult);
        }

        // Fetch subagents
        const subRes = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "agents:getSubagents",
            args: { token: sessionToken, limit: 50 },
          }),
        });
        const subData = await subRes.json();
        const subResult = subData.value || subData;
        if (subResult && Array.isArray(subResult.subagents)) {
          setSubagents(subResult.subagents);
        }
      } catch (err) {
        console.error("Error fetching agent data:", err);
      } finally {
        setIsLoadingAgents(false);
      }
    };

    fetchAgentData();
  }, [sessionToken]);

  // Get the primary agent (current session or first agent)
  const primaryAgent = agents.find(a => a.isCurrent) || agents[0];
  
  // Generate agent display name
  const getAgentDisplayName = (agent: typeof primaryAgent) => {
    if (!agent) return "agent-xxxx";
    if (agent.name) return agent.name;
    // Generate short ID from fingerprint
    const shortId = agent.fingerprint?.slice(-4) || "xxxx";
    return `agent-${shortId}`;
  };

  const handleRevoke = (agentId: string) => {
    if (confirmRevoke === agentId) {
      onRevoke(agentId);
      setConfirmRevoke(null);
      // Remove from local connected agents list (no logout)
      setConnectedAgents(prev => prev.filter(a => a.id !== agentId));
    } else {
      setConfirmRevoke(agentId);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle register new agent
  const handleRegisterAgent = async () => {
    if (!sessionToken || !registerForm.subagentId.trim()) {
      setRegisterError("Subagent ID is required");
      return;
    }

    setRegisterLoading(true);
    setRegisterError(null);

    try {
      const res = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "agents:registerTaskAgent",
          args: {
            token: sessionToken,
            subagentId: registerForm.subagentId.trim(),
            name: registerForm.name.trim() || undefined,
            description: registerForm.description.trim() || undefined,
          },
        }),
      });
      
      const data = await res.json();
      if (data.error) {
        setRegisterError(data.error);
        return;
      }

      // Add to subagents list
      const newSubagent: SubagentData = {
        id: data.value?.id || data.id,
        subagentId: registerForm.subagentId.trim(),
        name: registerForm.name.trim() || registerForm.subagentId.trim(),
        description: registerForm.description.trim() || undefined,
        isRegistered: true,
        callCount: 0,
        firstSeenAt: Date.now(),
        lastActiveAt: Date.now(),
      };
      
      setSubagents(prev => [newSubagent, ...prev]);
      setShowRegisterModal(false);
      setRegisterForm({ subagentId: "", name: "", description: "" });
    } catch (err) {
      console.error("Error registering agent:", err);
      setRegisterError("Failed to register agent");
    } finally {
      setRegisterLoading(false);
    }
  };

  // Handle update subagent
  const handleUpdateSubagent = async (subagentId: string, name: string, description?: string) => {
    if (!sessionToken) return;

    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "agents:renameSubagent",
          args: {
            token: sessionToken,
            subagentId,
            name: name.trim(),
          },
        }),
      });

      // Update local state
      setSubagents(prev => prev.map(s => 
        s.subagentId === subagentId 
          ? { ...s, name: name.trim(), description: description?.trim() } 
          : s
      ));
      setEditingSubagent(null);
    } catch (err) {
      console.error("Error updating subagent:", err);
    }
  };

  // Handle rename main agent
  const handleRenameMainAgent = async (name: string) => {
    if (!sessionToken) return;

    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "agents:renameMainAgent",
          args: { token: sessionToken, name: name.trim() },
        }),
      });

      setMainAgent(prev => prev ? { ...prev, mainAgentName: name.trim() } : prev);
    } catch (err) {
      console.error("Error renaming main agent:", err);
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const mcpCommand = "npx @nordsym/apiclaw mcp-install";

  const getMCPClientIcon = (client: string) => {
    switch (client) {
      case "claude-desktop": return "Claude Desktop";
      case "claude-code": return "Claude Code";
      case "cursor": return "Cursor";
      case "windsurf": return "Windsurf";
      case "cline": return "Cline";
      case "continue": return "Continue";
      case "vscode": return "VS Code";
      default: return client || "Unknown";
    }
  };

  return (
    <div className="space-y-6">
      {/* Connected Agents — compact cards from agents table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#ef4444]" />
            <span className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Connected Agents ({connectedAgents.length})
            </span>
          </div>
        </div>

        {isLoadingAgents ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#ef4444] animate-spin" />
          </div>
        ) : connectedAgents.length > 0 ? (
          <div className="space-y-2">
            {connectedAgents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[#ef4444]/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ef4444] to-[#f97316] flex items-center justify-center flex-shrink-0">
                    <Cpu className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {getMCPClientIcon(agent.mcpClient)}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">{agent.hostname}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-xs text-green-600">Connected</span>
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        Last: {formatRelativeTime(agent.lastActiveAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {agent.callCount.toLocaleString()} calls
                  </span>
                  {agent.aiBackend && (
                    <p className="text-xs text-[var(--text-muted)]">{agent.aiBackend}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto mb-3">
              <Bot className="w-6 h-6 text-[var(--text-muted)]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
              No MCP agents connected yet
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              Connect your first agent to start using APIClaw
            </p>
          </div>
        )}
      </div>

      {/* Quick Setup */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Quick Setup</p>
        <p className="text-xs text-[var(--text-muted)] mb-2">Add to your MCP config:</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono">
            {mcpCommand}
          </code>
          <button
            onClick={() => copyToClipboard(mcpCommand)}
            className="p-2 rounded-lg border border-[var(--border)] hover:border-[#ef4444]/30 transition"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-[var(--text-muted)]" />
            )}
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          Or use header: <code className="text-[#ef4444]">X-APIClaw-Subagent: name</code>
        </p>
      </div>

      {/* Legacy Primary Agent Card — hidden if connected agents exist */}
      {connectedAgents.length === 0 && agents.length > 0 && (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#ef4444]" />
            <span className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">Primary Agent</span>
          </div>
          {primaryAgent && (
            <button
              onClick={() => handleRevoke(primaryAgent.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                confirmRevoke === primaryAgent.id
                  ? "bg-red-500 text-white"
                  : "text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10"
              }`}
            >
              <Trash2 className="w-3 h-3" />
              {confirmRevoke === primaryAgent.id ? "Confirm" : "Remove"}
            </button>
          )}
        </div>
        
        {isLoadingAgents ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#ef4444] animate-spin" />
          </div>
        ) : primaryAgent ? (
          <div className="space-y-4">
            {/* Agent name with edit */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#ef4444] to-[#f97316] flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-7 h-7 text-white" />
                </div>
                <div>
                  {editingAgent === "main" ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Agent name..."
                        className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRenameMainAgent(editName);
                            onRename(primaryAgent.id, editName);
                            setEditingAgent(null);
                          } else if (e.key === "Escape") {
                            setEditingAgent(null);
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          handleRenameMainAgent(editName);
                          onRename(primaryAgent.id, editName);
                          setEditingAgent(null);
                        }}
                        className="px-3 py-1.5 bg-[#ef4444] text-white rounded-lg text-sm hover:bg-[#dc2626]"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingAgent(null)}
                        className="px-3 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">
                        {mainAgent?.mainAgentName || getAgentDisplayName(primaryAgent)}
                      </h3>
                      <button
                        onClick={() => {
                          setEditingAgent("main");
                          setEditName(mainAgent?.mainAgentName || getAgentDisplayName(primaryAgent));
                        }}
                        className="px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Connected
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent details grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[var(--border)]">
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Agent ID</p>
                <p className="font-mono text-sm truncate" title={mainAgent?.mainAgentId || primaryAgent.fingerprint}>
                  {(mainAgent?.mainAgentId || primaryAgent.fingerprint)?.slice(0, 12)}...
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">AI Backend</p>
                <p className="text-sm">
                  {mainAgent?.aiBackend ? (
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#ef4444]" />
                      {mainAgent.aiBackend}
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">Not detected</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Total Calls</p>
                <p className="text-sm font-semibold">{(mainAgent?.usageCount || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Last Active</p>
                <p className="text-sm">{formatRelativeTime(primaryAgent.lastUsedAt)}</p>
              </div>
            </div>
          </div>
        ) : isProvider ? (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[var(--surface)] border-2 border-dashed border-[var(--border)] flex items-center justify-center">
              <Cpu className="w-7 h-7 text-[var(--text-muted)]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-muted)]">Provider account</h3>
              <p className="text-sm text-[var(--text-muted)]">This workspace lists APIs — no agent required. If you want to test your own APIs directly, connect one below.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[var(--surface)] border-2 border-dashed border-[var(--border)] flex items-center justify-center">
              <Cpu className="w-7 h-7 text-[var(--text-muted)]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-muted)]">No agent connected</h3>
              <p className="text-sm text-[var(--text-muted)]">Run the setup command below to connect</p>
            </div>
          </div>
        )}
      </div>
      )}

    </div>
  );
}

// Subagent Activity Log Component
const SubagentActivityLog = ({ token, subagentId }: { token: string; subagentId: string }) => {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'logs:getBySubagent',
            args: { token, subagentId, limit: 10 }
          }),
        });
        const data = await res.json();
        if (data.value) {
          setActivity(data.value);
        }
      } catch (e) {
        console.error('Failed to fetch subagent activity', e);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [token, subagentId]);
  
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading activity...
      </div>
    );
  }
  
  if (activity.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No activity yet</p>;
  }
  
  // Local TypeBadge for activity log
  const ActivityTypeBadge = ({ type }: { type: string }) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      search: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Search' },
      call: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Call' },
      direct_call: { bg: 'bg-[#ef4444]/20', text: 'text-[#ef4444]', label: 'Direct' },
      error: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Error' },
    };
    const badge = badges[type] || { bg: 'bg-gray-500/20', text: 'text-gray-400', label: type };
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };
  
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase">Recent Activity</p>
      <div className="space-y-1">
        {activity.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm py-1">
            <div className="flex items-center gap-2">
              <ActivityTypeBadge type={item.type} />
              <span className="text-[var(--text-secondary)]">
                {item.type === 'search' ? item.query : `${item.provider || 'API'}.${item.action || 'call'}`}
              </span>
            </div>
            <span className="text-[var(--text-muted)]">
              {item.latencyMs || item.responseTimeMs || '-'}ms
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Edit Subagent Modal Component
function EditSubagentModal({
  subagent,
  onClose,
  onSave,
}: {
  subagent: SubagentData;
  onClose: () => void;
  onSave: (subagentId: string, name: string, description?: string) => void;
}) {
  const [name, setName] = useState(subagent.name);
  const [description, setDescription] = useState(subagent.description || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(subagent.subagentId, name, description);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h3 className="text-lg font-bold">Edit Agent</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--surface)] transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Subagent ID</label>
            <input
              type="text"
              value={subagent.subagentId}
              disabled
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-muted)] cursor-not-allowed"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">ID cannot be changed</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1.5">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Agent name"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do?"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50 resize-none"
            />
          </div>

          {subagent.aiBackend && (
            <div>
              <label className="block text-sm font-medium mb-1.5">AI Backend</label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface)] text-sm">
                <Sparkles className="w-4 h-4 text-[#ef4444]" />
                {subagent.aiBackend}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">Auto-detected from API calls</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#ef4444] text-white hover:bg-[#dc2626] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
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
  isProvider,
}: {
  apis: ProviderAPI[];
  analytics: ProviderAnalytics | null;
  workspace: Workspace | null;
  agents: Agent[];
  usage: UsageData | null;
  activeSubtab: AnalyticsSubtab;
  setActiveSubtab: (tab: AnalyticsSubtab) => void;
  sessionToken: string | null;
  isProvider?: boolean;
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
          Agent Analytics
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
          API Analytics
        </button>
        <button
          onClick={() => {
            setActiveSubtab("chains");
            router.push("/workspace?tab=analytics&sub=chains");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubtab === "chains"
              ? "bg-[#ef4444] text-white"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Activity className="w-4 h-4" />
          Chains
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
        <AnalyticsOverviewTab apis={apis} analytics={analytics} workspace={workspace} agents={agents} usage={usage} sessionToken={sessionToken} />
      )}
      {activeSubtab === "usage" && (
        <UsageTab apis={apis} workspace={workspace} usage={usage} sessionToken={sessionToken} />
      )}
      {activeSubtab === "logs" && (
        <LogsTab sessionToken={sessionToken} />
      )}
      {activeSubtab === "chains" && (
        <ChainsTab sessionToken={sessionToken} isProvider={isProvider} />
      )}
    </div>
  );
}

// ============================================
// SEARCH ANALYTICS TAB
// ============================================

interface SearchStats {
  totalSearches: number;
  zeroResults: number;
  zeroResultRate: number;
  avgResponseTime: number;
  topQueries: { query: string; count: number }[];
  topZeroResults: { query: string; count: number }[];
  bySubagent: Record<string, number>;
}

interface RecentSearch {
  _id: string;
  subagentId?: string;
  query: string;
  resultCount: number;
  hasResults: boolean;
  responseTimeMs: number;
  timestamp: number;
}

function SearchAnalyticsTab({ sessionToken }: { sessionToken: string | null }) {
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoursBack, setHoursBack] = useState(24);

  const fetchSearchData = useCallback(async () => {
    if (!sessionToken) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch stats
      const statsRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "searchLogs:getStats",
          args: { token: sessionToken, hoursBack },
        }),
      });
      const statsData = await statsRes.json();
      const statsResult = statsData.value || statsData;
      if (statsResult && !statsResult.error) {
        setStats(statsResult);
      }

      // Fetch recent searches
      const recentRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "searchLogs:getRecent",
          args: { token: sessionToken, limit: 50 },
        }),
      });
      const recentData = await recentRes.json();
      const recentResult = recentData.value || recentData;
      if (Array.isArray(recentResult)) {
        setRecentSearches(recentResult);
      }
    } catch (err) {
      console.error("Error fetching search analytics:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, hoursBack]);

  useEffect(() => {
    fetchSearchData();
  }, [fetchSearchData]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
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
          <Search className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="font-semibold text-xl mb-2">Not Logged In</h3>
          <p className="text-[var(--text-muted)]">Please log in to view search analytics.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#ef4444] animate-spin" />
      </div>
    );
  }

  // Check if we have any data
  const hasData = stats && stats.totalSearches > 0;

  // Preview data for empty state
  const previewStats: SearchStats = {
    totalSearches: 247,
    zeroResults: 18,
    zeroResultRate: 7.3,
    avgResponseTime: 89,
    topQueries: [
      { query: "send sms", count: 45 },
      { query: "generate image", count: 38 },
      { query: "web search", count: 31 },
      { query: "email api", count: 24 },
      { query: "transcribe audio", count: 19 },
    ],
    topZeroResults: [
      { query: "blockchain validator", count: 8 },
      { query: "calendar integration", count: 5 },
      { query: "video editing", count: 3 },
    ],
    bySubagent: {
      primary: 156,
      "research-agent": 58,
      "content-writer": 33,
    },
  };

  const displayStats = hasData ? stats : previewStats;

  return (
    <div className="space-y-6">
      {/* Preview Banner */}
      {!hasData && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#ef4444] flex-shrink-0" />
          <div>
            <p className="font-medium text-[#ef4444]">Preview Mode</p>
            <p className="text-sm text-[var(--text-muted)]">This is sample data. Real search analytics will appear once your agents start searching for APIs.</p>
          </div>
        </div>
      )}

      {/* Time Filter */}
      <div className="flex items-center gap-3">
        <select
          value={hoursBack}
          onChange={(e) => setHoursBack(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
        >
          <option value={1}>Last hour</option>
          <option value={6}>Last 6 hours</option>
          <option value={24}>Last 24 hours</option>
          <option value={168}>Last 7 days</option>
          <option value={720}>Last 30 days</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="rounded-xl sm:rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm text-[var(--text-muted)]">Total Searches</span>
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#ef4444]" />
          </div>
          <span className="text-xl sm:text-3xl font-bold text-[#ef4444]">{displayStats.totalSearches.toLocaleString()}</span>
        </div>

        <div className={`rounded-xl sm:rounded-2xl border p-3 sm:p-5 ${
          displayStats.zeroResultRate > 20 
            ? "border-red-500/30 bg-red-500/10" 
            : "border-[var(--border)] bg-[var(--surface-elevated)]"
        }`}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm text-[var(--text-muted)]">Zero-Result Rate</span>
            <AlertCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${displayStats.zeroResultRate > 20 ? "text-red-500" : "text-[var(--text-muted)]"}`} />
          </div>
          <span className={`text-xl sm:text-3xl font-bold ${displayStats.zeroResultRate > 20 ? "text-red-500" : ""}`}>
            {displayStats.zeroResultRate.toFixed(1)}%
          </span>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm text-[var(--text-muted)]">Avg Response Time</span>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)]" />
          </div>
          <span className="text-xl sm:text-3xl font-bold">{displayStats.avgResponseTime}ms</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Queries */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#ef4444]" />
            Top Queries
          </h3>
          {displayStats.topQueries.length > 0 ? (
            <div className="space-y-3">
              {displayStats.topQueries.slice(0, 10).map((item, i) => (
                <div key={item.query} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface)]">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#ef4444]/20 text-[#ef4444] flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <code className="text-sm font-mono">{item.query}</code>
                  </div>
                  <span className="text-sm text-[var(--text-muted)]">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-muted)] text-sm text-center py-4">No queries yet</p>
          )}
        </div>

        {/* Zero-Result Queries */}
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            Zero-Result Queries
            <span className="text-xs font-normal text-[var(--text-muted)] ml-2">API Gap Opportunities</span>
          </h3>
          {displayStats.topZeroResults.length > 0 ? (
            <div className="space-y-3">
              {displayStats.topZeroResults.slice(0, 10).map((item) => (
                <div key={item.query} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface)]">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <code className="text-sm font-mono">{item.query}</code>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[var(--text-muted)]">{item.count}x</span>
                    <a
                      href={`/providers/register?suggested=${encodeURIComponent(item.query)}`}
                      className="px-2 py-1 rounded bg-[#ef4444] text-white text-xs font-medium hover:bg-[#dc2626] transition"
                    >
                      Request API
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-muted)] text-sm text-center py-4">No zero-result queries</p>
          )}
        </div>
      </div>

      {/* Search by Agent */}
      {Object.keys(displayStats.bySubagent).length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#ef4444]" />
            Searches by Agent
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(displayStats.bySubagent).map(([agent, count]) => (
              <div key={agent} className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    agent === "primary" ? "bg-[#ef4444]/20" : "bg-[var(--background)]"
                  }`}>
                    {agent === "primary" ? (
                      <Cpu className="w-4 h-4 text-[#ef4444]" />
                    ) : (
                      <Users className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </div>
                  <span className="font-mono text-sm">{agent}</span>
                </div>
                <span className="text-lg font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#ef4444]" />
            Recent Searches
          </h3>
        </div>
        
        {recentSearches.length > 0 || !hasData ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--surface)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">Agent</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">Query</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">Results</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {(hasData ? recentSearches : [
                    { _id: "1", timestamp: Date.now() - 120000, subagentId: undefined, query: "send sms", resultCount: 3, hasResults: true, responseTimeMs: 67 },
                    { _id: "2", timestamp: Date.now() - 300000, subagentId: "research-agent", query: "web search api", resultCount: 5, hasResults: true, responseTimeMs: 82 },
                    { _id: "3", timestamp: Date.now() - 600000, subagentId: undefined, query: "video editing", resultCount: 0, hasResults: false, responseTimeMs: 45 },
                    { _id: "4", timestamp: Date.now() - 900000, subagentId: "content-writer", query: "image generation", resultCount: 4, hasResults: true, responseTimeMs: 91 },
                    { _id: "5", timestamp: Date.now() - 1200000, subagentId: undefined, query: "email service", resultCount: 2, hasResults: true, responseTimeMs: 58 },
                  ]).slice(0, 20).map((search) => (
                    <tr key={search._id} className="hover:bg-[var(--surface)] transition">
                      <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
                        {formatTime(search.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">
                          {search.subagentId || "primary"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="px-2 py-1 rounded bg-[var(--surface)] text-sm font-mono">
                          {search.query}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        {search.hasResults ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                            <Check className="w-3 h-3" />
                            {search.resultCount} found
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-500 text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            No results
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={search.responseTimeMs > 200 ? "text-yellow-500" : "text-[var(--text-muted)]"}>
                          {search.responseTimeMs}ms
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-[var(--border)]">
              {(hasData ? recentSearches : [
                { _id: "1", timestamp: Date.now() - 120000, subagentId: undefined, query: "send sms", resultCount: 3, hasResults: true, responseTimeMs: 67 },
                { _id: "2", timestamp: Date.now() - 300000, subagentId: "research-agent", query: "web search api", resultCount: 5, hasResults: true, responseTimeMs: 82 },
                { _id: "3", timestamp: Date.now() - 600000, subagentId: undefined, query: "video editing", resultCount: 0, hasResults: false, responseTimeMs: 45 },
              ]).slice(0, 10).map((search) => (
                <div key={search._id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="font-mono text-sm font-medium">{search.query}</code>
                    {search.hasResults ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                        {search.resultCount} found
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-500 text-xs font-medium">
                        No results
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
                    <span>{search.subagentId || "primary"}</span>
                    <span>{search.responseTimeMs}ms</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{formatTime(search.timestamp)}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <Search className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No searches yet</h3>
            <p className="text-[var(--text-muted)]">
              Search activity will appear here when your agents start searching for APIs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// CHAINS TAB (Chain Execution Traces)
// ============================================

interface ChainExecution {
  _id: string;
  status: "pending" | "running" | "completed" | "failed" | "paused";
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
  input?: any;
  output?: any;
  latencyMs?: number;
  costCents?: number;
  error?: { code: string; message: string; retryCount?: number };
  parallelGroup?: string;
  startedAt?: number;
  completedAt?: number;
}

interface ChainDetail {
  chain: {
    _id: string;
    status: string;
    steps: any[];
    totalCostCents: number;
    totalLatencyMs: number;
    startedAt?: number;
    completedAt?: number;
  };
  executions: ChainStep[];
  tokensSaved: number;
}

interface InboundCall {
  _id: string;
  apiName: string;
  agentId: string;
  statusCode?: number;
  latencyMs?: number;
  costUsd: number;
  timestamp: number;
}

function ChainsTab({ sessionToken, isProvider }: { sessionToken: string | null; isProvider?: boolean }) {
  const [chains, setChains] = useState<ChainExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedChainId, setExpandedChainId] = useState<string | null>(null);
  const [chainDetail, setChainDetail] = useState<ChainDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [stats, setStats] = useState<{ total: number; completed: number; failed: number; running: number; successRate: number; totalCostCents: number } | null>(null);
  const [inboundCalls, setInboundCalls] = useState<InboundCall[]>([]);
  const [inboundUniqueAgents, setInboundUniqueAgents] = useState(0);
  const [loadingInbound, setLoadingInbound] = useState(true);

  const fetchChains = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "chains:getChainExecutions",
          args: { token: sessionToken, limit: 50, status: statusFilter },
        }),
      });
      const data = await res.json();
      const result = data.value || data;
      if (Array.isArray(result)) setChains(result);
    } catch (err) {
      console.error("Fetch chains error:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionToken, statusFilter]);

  const fetchStats = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "chains:getChainStatsAuth",
          args: { token: sessionToken },
        }),
      });
      const data = await res.json();
      const result = data.value || data;
      if (result && !result.error) setStats(result);
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  }, [sessionToken]);

  const fetchChainDetail = useCallback(async (chainId: string) => {
    if (!sessionToken) return;
    setLoadingDetail(true);
    try {
      const res = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "chains:getChainTraceAuth",
          args: { token: sessionToken, chainId },
        }),
      });
      const data = await res.json();
      const result = data.value || data;
      if (result && !result.error) setChainDetail(result);
    } catch (err) {
      console.error("Fetch chain detail error:", err);
    } finally {
      setLoadingDetail(false);
    }
  }, [sessionToken]);

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
      fetchChains();
    } catch (err) {
      console.error("Resume chain error:", err);
    }
  };

  useEffect(() => {
    fetchChains();
    fetchStats();
  }, [fetchChains, fetchStats]);

  // Fetch inbound API activity (others calling my APIs)
  useEffect(() => {
    const fetchInbound = async () => {
      if (!sessionToken) { setLoadingInbound(false); return; }
      try {
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: "chains:getInboundAPIActivity", args: { token: sessionToken, limit: 50 } }),
        });
        const data = await res.json();
        const result = data.value || data;
        if (result?.calls) {
          setInboundCalls(result.calls);
          setInboundUniqueAgents(result.uniqueAgents || 0);
        }
      } catch { /* ignore */ } finally { setLoadingInbound(false); }
    };
    fetchInbound();
  }, [sessionToken]);

  useEffect(() => {
    if (expandedChainId) {
      fetchChainDetail(expandedChainId);
    } else {
      setChainDetail(null);
    }
  }, [expandedChainId, fetchChainDetail]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <Check className="w-4 h-4 text-green-500" />;
      case "running": return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "failed": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "paused": return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number) => ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  const formatCost = (cents: number) => cents === 0 ? "$0.00" : `$${(cents / 100).toFixed(2)}`;
  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#ef4444] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── INBOUND: Other agents calling MY APIs ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <h2 className="text-lg font-semibold">Inbound — Calls on my APIs</h2>
          <span className="text-sm text-[var(--text-muted)]">Other agents using your listed APIs</span>
          {inboundUniqueAgents > 0 && (
            <span className="ml-auto text-sm text-[var(--text-muted)]">{inboundUniqueAgents} unique agent{inboundUniqueAgents !== 1 ? "s" : ""}</span>
          )}
        </div>
        {loadingInbound ? (
          <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 text-[#ef4444] animate-spin" /></div>
        ) : inboundCalls.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-8 text-center">
            <p className="font-medium mb-1">No Inbound Calls Yet</p>
            <p className="text-sm text-[var(--text-muted)]">Inbound activity appears here when other agents discover and call your listed APIs through APIClaw.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] divide-y divide-[var(--border)]">
            {inboundCalls.map((call) => (
              <div key={call._id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${call.statusCode && call.statusCode < 300 ? "bg-green-500" : "bg-red-500"}`} />
                  <div>
                    <p className="text-sm font-medium">{call.apiName}</p>
                    <p className="text-xs text-[var(--text-muted)] font-mono">{call.agentId.slice(0, 20)}...</p>
                  </div>
                </div>
                <div className="text-right text-xs text-[var(--text-muted)]">
                  {call.latencyMs && <span>{call.latencyMs}ms · </span>}
                  {formatTime(call.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── OUTBOUND: My chains calling other APIs ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <h2 className="text-lg font-semibold">Outbound — My chains</h2>
          <span className="text-sm text-[var(--text-muted)]">Chains your agents execute on external APIs</span>
        </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Total Chains" value={stats.total.toString()} icon={Zap} />
          <StatCard title="Success Rate" value={`${stats.successRate}%`} icon={Check} accent={stats.successRate >= 90} />
          <StatCard title="Running" value={stats.running.toString()} icon={Activity} />
          <StatCard title="Total Cost" value={formatCost(stats.totalCostCents)} icon={CreditCard} />
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
        >
          <option value="all">All Status</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="paused">Paused</option>
        </select>
        <span className="text-[var(--text-muted)] text-sm">{chains.length} chain{chains.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Chains List */}
      {chains.length === 0 ? (
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-12 text-center">
          <Activity className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Chain Executions Yet</h3>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">
            Chain executions will appear here when you start orchestrating multi-step API workflows.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {chains.map((chain) => (
            <div
              key={chain._id}
              className={`bg-[var(--surface)] rounded-xl border transition-all ${
                expandedChainId === chain._id ? "border-[#ef4444]/50" : "border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              {/* Chain Row */}
              <button
                onClick={() => setExpandedChainId(expandedChainId === chain._id ? null : chain._id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4">
                  {expandedChainId === chain._id ? <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />}
                  {getStatusIcon(chain.status)}
                  <span className="text-sm font-medium capitalize">{chain.status}</span>
                  <code className="text-xs text-[var(--text-muted)] font-mono">{chain._id.slice(0, 12)}...</code>
                </div>
                <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
                  <span>{chain.stepsCount} steps</span>
                  <span>{formatDuration(chain.totalLatencyMs)}</span>
                  <span>{formatCost(chain.totalCostCents)}</span>
                  <span>{formatTime(chain.createdAt)}</span>
                </div>
              </button>

              {/* Expanded Detail */}
              {expandedChainId === chain._id && (
                <div className="border-t border-[var(--border)] p-4">
                  {loadingDetail ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-[#ef4444] animate-spin" />
                    </div>
                  ) : chainDetail ? (
                    <div className="space-y-4">
                      {/* Actions */}
                      <div className="flex items-center gap-2 pb-4 border-b border-[var(--border)]">
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
                          onClick={() => navigator.clipboard.writeText(chain._id)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-sm transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy ID
                        </button>
                      </div>

                      {/* Gantt Timeline */}
                      <div className="bg-[var(--background)] rounded-xl border border-[var(--border)] p-4">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium">Execution Timeline</span>
                          <span className="text-xs text-[var(--text-muted)]">
                            Total: {formatDuration(chainDetail.chain.totalLatencyMs)} • Cost: {formatCost(chainDetail.chain.totalCostCents)} • Tokens Saved: ~{chainDetail.tokensSaved.toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {chainDetail.executions.map((step) => {
                            const totalMs = chainDetail.chain.totalLatencyMs || 1;
                            const widthPct = Math.max(5, ((step.latencyMs || 0) / totalMs) * 100);
                            return (
                              <div key={step._id} className="flex items-center gap-3">
                                <div className="w-24 flex items-center gap-2 flex-shrink-0">
                                  {getStatusIcon(step.status)}
                                  <span className="text-xs font-mono truncate">{step.stepId}</span>
                                </div>
                                <div className="flex-1 h-5 bg-[var(--surface)] rounded relative overflow-hidden">
                                  <div
                                    className={`absolute left-0 top-0 h-full rounded ${
                                      step.status === "completed" ? "bg-green-500" :
                                      step.status === "running" ? "bg-blue-500 animate-pulse" :
                                      step.status === "failed" ? "bg-red-500" : "bg-gray-500"
                                    }`}
                                    style={{ width: `${widthPct}%` }}
                                  />
                                  <span className="absolute left-2 top-0.5 text-xs font-mono text-white drop-shadow-sm">
                                    {formatDuration(step.latencyMs || 0)}
                                  </span>
                                </div>
                                <span className="w-14 text-right text-xs text-[var(--text-muted)]">
                                  {formatCost(step.costCents || 0)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500" /> Completed</div>
                          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-500" /> Running</div>
                          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500" /> Failed</div>
                          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-500" /> Paused</div>
                        </div>
                      </div>

                      {/* Error Display */}
                      {chain.error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="font-medium text-red-500">Error at step: {chain.error.stepId}</span>
                            <code className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">{chain.error.code}</code>
                          </div>
                          <p className="text-sm text-red-400">{chain.error.message}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-[var(--text-muted)] py-4">Failed to load chain details</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      </div> {/* end outbound section */}
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
  sessionToken,
}: {
  apis: ProviderAPI[];
  analytics: ProviderAnalytics | null;
  workspace: Workspace | null;
  agents: Agent[];
  usage: UsageData | null;
  sessionToken: string | null;
}) {
  const [searchStats, setSearchStats] = useState<{ totalSearches: number; zeroResultRate: number } | null>(null);
  
  // Fetch search stats
  useEffect(() => {
    const fetchSearchStats = async () => {
      if (!sessionToken) return;
      try {
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "searchLogs:getStats",
            args: { token: sessionToken, hoursBack: 168 }, // Last 7 days
          }),
        });
        const data = await res.json();
        const result = data.value || data;
        if (result && !result.error) {
          setSearchStats({
            totalSearches: result.totalSearches || 0,
            zeroResultRate: result.zeroResultRate || 0,
          });
        }
      } catch (err) {
        console.error("Error fetching search stats:", err);
      }
    };
    fetchSearchStats();
  }, [sessionToken]);

  const totalCalls = analytics?.totalCalls || workspace?.usageCount || 0;
  const uniqueAgents = analytics?.uniqueAgents || agents.length || 0;
  const hasChartData = analytics && analytics.callsByDay && analytics.callsByDay.length > 0;
  const totalSearches = searchStats?.totalSearches || (analytics?.isPreview ? 247 : 0);

  // Preview chart data when no real data exists
  const previewChartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { date: d.toISOString().split("T")[0], calls: 0 };
  });
  const chartData = hasChartData ? analytics!.callsByDay : previewChartData;

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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard title="Total Calls" value={totalCalls.toLocaleString()} icon={Zap} accent />
        <StatCard title="Total Searches" value={totalSearches.toLocaleString()} icon={Search} />
        <StatCard title="Connected Agents" value={agents.length.toString()} icon={Users} />
        <StatCard title="Avg Latency" value={analytics?.avgLatency ? `${analytics.avgLatency}ms` : "—"} icon={Clock} />
        <StatCard title="Success Rate" value={analytics?.successRate ? `${analytics.successRate.toFixed(1)}%` : "—"} icon={Check} />
      </div>
      {/* Agents using my APIs */}
      {analytics?.uniqueAgents && analytics.uniqueAgents !== agents.length ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <Users className="w-4 h-4 text-green-500 flex-shrink-0" />
          <p className="text-sm"><span className="font-semibold text-green-500">{analytics.uniqueAgents}</span> external agent{analytics.uniqueAgents !== 1 ? "s" : ""} have called your APIs</p>
        </div>
      ) : null}

      {/* Charts */}
      {(hasChartData || !hasChartData) && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <div className="lg:col-span-2 bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] p-6">
            <h3 className="font-semibold mb-4">Calls Over Time {!hasChartData && <span className="text-xs font-normal text-[var(--text-muted)] ml-2">Preview</span>}</h3>
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

          {/* Agent Status */}
          <div className="bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] p-6">
            <h3 className="font-semibold mb-4">Agent Status</h3>
            {agents.length > 0 ? (
              <div className="space-y-3">
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface)]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">{agent.name || agent.fingerprint}</span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">Connected</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Bot className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">No agents connected</p>
                <p className="text-xs text-[var(--text-muted)] mb-3">Connect an MCP agent to see your call activity here.</p>
                <code className="text-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 font-mono text-[#ef4444]">npx @nordsym/apiclaw mcp-install</code>
              </div>
            )}
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

    </div>
  );
}

// ============================================
// USAGE TAB
// ============================================

function UsageTab({
  apis,
  workspace,
  usage,
  sessionToken,
}: {
  apis: ProviderAPI[];
  workspace: Workspace | null;
  usage: UsageData | null;
  sessionToken: string | null;
}) {
  const [timeRange, setTimeRange] = useState("7d");
  const [searchStats, setSearchStats] = useState<{
    totalSearches: number;
    searchesByProvider: Record<string, number>;
  } | null>(null);
  const [topApiView, setTopApiView] = useState<"calls" | "searches">("calls");
  const [liveAnalytics, setLiveAnalytics] = useState<{
    totalCalls: number;
    inboundCalls: number;
    outboundCalls: number;
    uniqueCallers: number;
    byDay: { date: string; calls: number }[];
    byProvider: { provider: string; calls: number; success: number }[];
    successRate: number;
    avgLatency: number;
  } | null>(null);

  // Fetch live provider analytics
  useEffect(() => {
    const fetchLiveAnalytics = async () => {
      if (!sessionToken) return;
      try {
        const hoursMap: Record<string, number> = { "7d": 168, "30d": 720, "90d": 2160, "All": 87600 };
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "logs:getProviderAnalytics",
            args: { token: sessionToken, hoursBack: hoursMap[timeRange] || 168 },
          }),
        });
        const data = await res.json();
        const result = data.value || data;
        if (result && !result.error) setLiveAnalytics(result);
      } catch { /* ignore */ }
    };
    fetchLiveAnalytics();
  }, [sessionToken, timeRange]);

  // Fetch search stats to correlate with API usage
  useEffect(() => {
    const fetchSearchStats = async () => {
      if (!sessionToken) return;
      try {
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "searchLogs:getStats",
            args: { token: sessionToken, hoursBack: 720 },
          }),
        });
        const data = await res.json();
        const result = data.value || data;
        if (result && !result.error) {
          // Build provider search counts from top queries that matched providers
          const searchesByProvider: Record<string, number> = {};
          // Estimate based on result counts - in real implementation this would come from matchedProviders
          setSearchStats({
            totalSearches: result.totalSearches || 0,
            searchesByProvider,
          });
        }
      } catch (err) {
        console.error("Error fetching search stats:", err);
      }
    };
    fetchSearchStats();
  }, [sessionToken]);

  const hasLiveData = liveAnalytics && liveAnalytics.totalCalls > 0;
  const hasRealData = hasLiveData || (usage && (usage.byProvider.length > 0 || usage.byDay.length > 0));
  
  // Preview data for empty state (provider perspective - how others use YOUR APIs)
  const previewByDay = [
    { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], calls: 8, searches: 3 },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], calls: 15, searches: 7 },
    { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], calls: 23, searches: 12 },
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], calls: 19, searches: 8 },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], calls: 34, searches: 15 },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], calls: 28, searches: 11 },
    { date: new Date().toISOString().split('T')[0], calls: 21, searches: 9 },
  ];
  
  const isPreview = !hasRealData;
  const rangeDays = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 9999;
  const rangeStart = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const allByDay = hasLiveData ? liveAnalytics!.byDay : hasRealData ? usage!.byDay : previewByDay;
  const displayByDay = timeRange === "All" ? allByDay : allByDay.filter(d => d.date >= rangeStart);
  const displayByProvider = hasRealData 
    ? usage!.byProvider.map(p => ({ ...p, searchCount: searchStats?.searchesByProvider[p.provider] || 0 }))
    : [];
  const displayTotal = hasLiveData ? liveAnalytics!.totalCalls : hasRealData ? (usage?.total || workspace?.usageCount || 0) : 0;
  const displaySearchTotal = hasLiveData
    ? liveAnalytics!.byDay.reduce((sum, d) => sum, 0) || searchStats?.totalSearches || 0
    : searchStats?.totalSearches || 0;
  const displayUniqueCallers = hasLiveData ? liveAnalytics!.uniqueCallers : 0;

  // Separate calls vs discoveries from live data
  const liveByAction = (liveAnalytics as any)?.byAction || [];
  const liveCallCount = hasLiveData ? (liveAnalytics as any).totalCalls || 0 : 0;
  const liveDiscoveryCount = hasLiveData ? (liveAnalytics as any).totalDiscoveries || 0 : 0;
  const liveTopAPIs = liveByAction.filter((a: any) => a.type === "call");
  const liveTopSearches = liveByAction.filter((a: any) => a.type === "discovery");

  return (
    <div className="space-y-8">
      {/* Preview Banner */}
      {isPreview && (
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#ef4444] flex-shrink-0" />
          <div>
            <p className="font-medium text-[#ef4444]">Preview Mode</p>
            <p className="text-sm text-[var(--text-muted)]">This is sample data. Real analytics will appear once agents start using your listed APIs.</p>
          </div>
        </div>
      )}

      {/* Stats Grid - Now with 4 cards including Search */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/10 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#ef4444]" />
            <span className="text-sm sm:text-base text-[var(--text-muted)]">Total Calls</span>
          </div>
          <p className="text-2xl sm:text-4xl font-bold text-[#ef4444]">
            {displayTotal.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-muted)]" />
            <span className="text-sm sm:text-base text-[var(--text-muted)]">Active APIs</span>
          </div>
          <p className="text-2xl sm:text-4xl font-bold">{apis.filter(a => a.status === "approved").length || displayByProvider.length}</p>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            <span className="text-sm sm:text-base text-[var(--text-muted)]">Found via Search</span>
          </div>
          <p className="text-2xl sm:text-4xl font-bold text-blue-500">
            {(liveDiscoveryCount || displaySearchTotal).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-muted)]" />
            <span className="text-sm sm:text-base text-[var(--text-muted)]">Success Rate</span>
          </div>
          <p className="text-2xl sm:text-4xl font-bold">{hasLiveData && liveCallCount > 0 ? `${((liveAnalytics as any)?.successRate || 100).toFixed(0)}%` : isPreview ? "—" : "—"}</p>
        </div>
      </div>

      {/* Usage Over Time Chart */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Usage Over Time</h3>
          <div className="flex gap-1 bg-[var(--surface)] rounded-lg p-0.5">
            {["7d", "30d", "90d", "All"].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${timeRange === r ? "bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayByDay}>
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
              <Line type="monotone" dataKey="calls" stroke="#ef4444" strokeWidth={2} dot={false} name="API Calls" />
              <Line type="monotone" dataKey="searches" stroke="#3b82f6" strokeWidth={2} dot={false} name="Searches" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top APIs — toggle between calls and searches */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Top APIs</h3>
          {(liveTopAPIs.length > 0 || liveTopSearches.length > 0) && (
            <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-xs">
              <button
                onClick={() => setTopApiView?.("calls")}
                className={`px-3 py-1.5 font-medium transition-colors ${topApiView === "calls" ? "bg-[#ef4444] text-white" : "bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                Top Called
              </button>
              <button
                onClick={() => setTopApiView?.("searches")}
                className={`px-3 py-1.5 font-medium transition-colors ${topApiView === "searches" ? "bg-blue-500 text-white" : "bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                Top Searched
              </button>
            </div>
          )}
        </div>
        {liveTopAPIs.length === 0 && liveTopSearches.length === 0 && displayByProvider.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-4 text-center">No API usage data yet. Calls and searches will appear here once agents start using your APIs.</p>
        ) : (
          <div className="space-y-2">
            {topApiView === "calls" ? (
              <>
                {liveTopAPIs.length > 0 ? liveTopAPIs.map((p: any, i: number) => (
                  <div key={p.action} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)]">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#ef4444]/20 text-[#ef4444] flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div>
                        <span className="font-medium text-sm">{p.action}</span>
                        <span className="text-xs text-[var(--text-muted)] ml-2">{p.calls} call{p.calls !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${p.success === p.calls ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"}`}>
                      {((p.success / Math.max(p.calls, 1)) * 100).toFixed(0)}%
                    </span>
                  </div>
                )) : (
                  <p className="text-sm text-[var(--text-muted)] py-4 text-center">No API calls yet.</p>
                )}
              </>
            ) : (
              <>
                {liveTopSearches.length > 0 ? liveTopSearches.map((s: any, i: number) => (
                  <div key={s.action} className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <span className="text-sm text-[var(--text-primary)]">{s.action}</span>
                    </div>
                    <span className="text-xs text-blue-500">{s.calls}x</span>
                  </div>
                )) : (
                  <p className="text-sm text-[var(--text-muted)] py-4 text-center">No search discoveries yet.</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* My APIs — full list with live call/discovery counts */}
      {apis.length > 0 && (
        <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="font-semibold text-lg mb-4">All APIs ({apis.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="pb-3 font-medium">API</th>
                  <th className="pb-3 font-medium text-center">Calls</th>
                  <th className="pb-3 font-medium text-center">Discoveries</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {apis.map((api) => {
                  const apiNameLower = api.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                  const matchedCall = liveTopAPIs.find((a: any) => {
                    const actionLower = a.action.toLowerCase();
                    return apiNameLower.includes(actionLower.split("_")[0]) || actionLower.includes(apiNameLower.split("_")[0]);
                  });
                  const callCount = (matchedCall as any)?.calls || 0;
                  const discoveryCount = api.discoveryCount || 0;
                  return (
                    <tr key={api._id} className="hover:bg-[var(--surface)]/50">
                      <td className="py-3">
                        <p className="font-medium">{api.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{api.category}</p>
                      </td>
                      <td className="py-3 text-center">
                        {callCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] font-medium">{callCount}</span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">-</span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        {discoveryCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">{discoveryCount}</span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">-</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`text-xs px-2 py-0.5 rounded ${api.status === "approved" ? "bg-green-500/10 text-green-500" : api.status === "blocked" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                          {api.status === "approved" ? "Live" : api.status === "blocked" ? "Blocked" : api.status === "rate_limited" ? "Rate Limited" : api.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

// ============================================
// LOGS TAB
// ============================================

// Type badges for log entries
const typeBadges: Record<string, { icon: typeof Search; label: string; className: string }> = {
  search: {
    icon: Search,
    label: "Search",
    className: "bg-blue-500/10 text-blue-500 border border-blue-500/20"
  },
  direct_call: {
    icon: Zap,
    label: "API Catalog",
    className: "bg-green-500/10 text-green-500 border border-green-500/20"
  },
  chain: {
    icon: LinkIcon,
    label: "Chain",
    className: "bg-purple-500/10 text-purple-500 border border-purple-500/20"
  },
};

const TypeBadge = ({ type }: { type: string }) => {
  const badge = typeBadges[type] || typeBadges.direct_call;
  const Icon = badge.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${badge.className}`}>
      <Icon className="w-3.5 h-3.5" />
      {badge.label}
    </span>
  );
};

interface ApiLogEntry {
  id: string;
  type: "direct_call";
  provider: string;
  action: string;
  status: "success" | "error";
  latencyMs: number;
  errorMessage?: string;
  subagentId?: string;
  createdAt: number;
}

interface SearchLogEntry {
  id: string;
  type: "search";
  query: string;
  resultCount: number;
  hasResults: boolean;
  responseTimeMs: number;
  createdAt: number;
}

type CombinedLogEntry = ApiLogEntry | SearchLogEntry;

interface LogStats {
  totalCalls: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgLatency: number;
  providers: string[];
}

function LogsTab({ sessionToken }: { sessionToken: string | null }) {
  const [logs, setLogs] = useState<CombinedLogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [providers, setProviders] = useState<string[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
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
      
      // Fetch API logs
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
            subagentId: agentFilter === "all" ? undefined : agentFilter,
          },
        }),
      });

      const logsData = await logsRes.json();
      const apiResult = logsData.value || logsData;
      const apiLogs: ApiLogEntry[] = (apiResult.logs || []).map((log: any) => ({
        ...log,
        type: "direct_call" as const,
      }));

      // Fetch search logs (only on initial load, not on "load more")
      let searchLogs: SearchLogEntry[] = [];
      if (!append && providerFilter === "all") {
        try {
          const searchRes = await fetch(`${CONVEX_URL}/api/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: "searchLogs:getRecent",
              args: { token: sessionToken, limit: 50 },
            }),
          });
          const searchData = await searchRes.json();
          const searchResult = searchData.value || searchData;
          if (Array.isArray(searchResult)) {
            searchLogs = searchResult.map((log: any) => ({
              id: log._id,
              type: "search" as const,
              query: log.query,
              resultCount: log.resultCount,
              hasResults: log.hasResults,
              responseTimeMs: log.responseTimeMs,
              createdAt: log.timestamp,
            }));
          }
        } catch (err) {
          console.error("Error fetching search logs:", err);
        }
      }

      // Merge and sort by timestamp (newest first)
      const combinedLogs = [...apiLogs, ...searchLogs].sort((a, b) => b.createdAt - a.createdAt);

      if (append) {
        setLogs(prev => [...prev, ...apiLogs].sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setLogs(combinedLogs);
      }
      setHasMore(apiResult.hasMore || false);
      setNextCursor(apiResult.nextCursor);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [sessionToken, statusFilter, providerFilter, agentFilter, nextCursor]);

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
      setAgents(result.agents || []);
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
      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "success" | "error")}
          className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
        >
          <option value="all">All</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">Agent</th>
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
                    <td className="px-4 py-3">
                      <TypeBadge type={log.type} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-[var(--text-muted)]">
                        {log.type === "direct_call" 
                          ? ((log as ApiLogEntry).subagentId || "main")
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
                      {formatTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {log.type === "search" ? (
                        <span className="font-medium text-[var(--text-muted)]">—</span>
                      ) : (
                        <span className="font-medium">{(log as ApiLogEntry).provider}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.type === "search" ? (
                        <code className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-sm font-mono">
                          &quot;{(log as SearchLogEntry).query}&quot;
                        </code>
                      ) : (
                        <code className="px-2 py-1 rounded bg-[var(--surface)] text-sm font-mono">
                          {(log as ApiLogEntry).action}
                        </code>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.type === "search" ? (
                        (log as SearchLogEntry).hasResults ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                            <Check className="w-3 h-3" />
                            {(log as SearchLogEntry).resultCount} results
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            No results
                          </span>
                        )
                      ) : (log as ApiLogEntry).status === "success" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                          <Check className="w-3 h-3" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-500 text-xs font-medium" title={(log as ApiLogEntry).errorMessage}>
                          <AlertCircle className="w-3 h-3" />
                          Error
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.type === "search" ? (
                        <span className={(log as SearchLogEntry).responseTimeMs > 200 ? "text-yellow-500" : "text-[var(--text-muted)]"}>
                          {(log as SearchLogEntry).responseTimeMs}ms
                        </span>
                      ) : (
                        <span className={(log as ApiLogEntry).latencyMs > 1000 ? "text-yellow-500" : "text-[var(--text-muted)]"}>
                          {(log as ApiLogEntry).latencyMs}ms
                        </span>
                      )}
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
                  <div className="flex items-center gap-2">
                    <TypeBadge type={log.type} />
                    {log.type === "direct_call" && (
                      <span className="font-medium text-sm">{(log as ApiLogEntry).provider}</span>
                    )}
                  </div>
                  {log.type === "search" ? (
                    (log as SearchLogEntry).hasResults ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                        {(log as SearchLogEntry).resultCount} results
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-medium">
                        No results
                      </span>
                    )
                  ) : (log as ApiLogEntry).status === "success" ? (
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
                  {log.type === "search" ? (
                    <code className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 font-mono text-xs">
                      &quot;{(log as SearchLogEntry).query}&quot;
                    </code>
                  ) : (
                    <code className="px-2 py-1 rounded bg-[var(--surface)] font-mono text-xs">
                      {(log as ApiLogEntry).action}
                    </code>
                  )}
                  <span className="text-[var(--text-muted)]">
                    {log.type === "search" ? (log as SearchLogEntry).responseTimeMs : (log as ApiLogEntry).latencyMs}ms
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{formatTime(log.createdAt)}</p>
                {log.type === "direct_call" && (log as ApiLogEntry).errorMessage && (
                  <p className="text-xs text-red-500 truncate">{(log as ApiLogEntry).errorMessage}</p>
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

function BillingTab({ workspace }: { workspace: Workspace | null }) {
  const currentTier = workspace?.tier || "free";
  const isBacker = (currentTier === "backer" || currentTier === "founder");
  const isPartner = currentTier === "partner";

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "",
      calls: "50 Direct Call",
      callsSub: "calls per month",
      features: ["Search Index always available", "Open API always available", "1 connected agent"],
      cta: "Current plan",
      ctaDisabled: true,
      link: null,
      highlight: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: "$79",
      period: "/month",
      calls: "5,000 Direct Call",
      callsSub: "calls per month",
      features: ["Everything in Free", "Search + Open API always available", "All Direct Call providers", "Priority support"],
      cta: currentTier === "pro" ? "Current plan" : "Upgrade to Pro",
      ctaDisabled: currentTier === "pro",
      link: "https://buy.stripe.com/7sY7sN78gfX43yAchqcMM0z",
      highlight: true,
    },
    {
      id: "scale",
      name: "Scale",
      price: "$249",
      period: "/month",
      calls: "25,000 Direct Call",
      callsSub: "calls per month",
      features: ["Everything in Pro", "Volume pricing on calls", "Dedicated onboarding", "SLA available"],
      cta: currentTier === "scale" ? "Current plan" : "Upgrade to Scale",
      ctaDisabled: currentTier === "scale",
      link: "https://buy.stripe.com/14A3cx78geT00modlucMM0A",
      highlight: false,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      period: "",
      calls: "Unlimited",
      callsSub: "calls",
      features: ["Everything in Scale", "Custom call limits", "Private deployment options", "SLA & onboarding support"],
      cta: "Book a call",
      ctaDisabled: false,
      link: "/book",
      highlight: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Billing</h2>
        <p className="text-[var(--text-muted)] mt-1">Help us stay 100% user funded — no VC, no ads, no compromises.</p>
      </div>

      {/* Backer banner */}
      {isBacker && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5 flex items-center gap-4">
          <Check className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <p className="font-semibold text-green-400">Founder</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Unlimited access until end of 2026. Thank you for backing APIClaw early.</p>
          </div>
        </div>
      )}

      {/* Current plan summary */}
      {!isBacker && !isPartner && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Current plan</p>
            <p className="text-xl font-bold capitalize mt-0.5">{currentTier}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--text-muted)]">Direct Call usage this month</p>
            <p className="text-xl font-bold mt-0.5">
              {workspace?.usageLimit === -1 ? "Unlimited" : `${workspace?.usageCount || 0} / ${workspace?.usageLimit || 50}`}
            </p>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map(plan => {
          const isCurrentPlan = currentTier === plan.id || (isBacker && plan.id === "free") || (isPartner && plan.id === "free");
          return (
            <div key={plan.id} className={`rounded-2xl border p-5 flex flex-col transition ${plan.highlight ? "border-[#ef4444] bg-[#ef4444]/5" : "border-[var(--border)] bg-[var(--surface-elevated)]"}`}>
              {plan.highlight && (
                <span className="self-start text-xs font-semibold px-2.5 py-1 rounded-full bg-[#ef4444] text-white mb-3">Most popular</span>
              )}
              <p className="font-bold text-lg">{plan.name}</p>
              <div className="flex items-baseline gap-1 mt-1 mb-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-sm text-[var(--text-muted)]">{plan.period}</span>}
              </div>
              <p className="text-sm font-medium text-[#ef4444]">{plan.calls}</p>
              <p className="text-xs text-[var(--text-muted)] mb-4">{plan.callsSub}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                    <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  if (!plan.link || plan.ctaDisabled) return;
                  if (plan.link.startsWith("/")) {
                    const params = new URLSearchParams();
                    if (workspace?.email) params.set("email", workspace.email);
                    window.location.href = `${plan.link}?${params.toString()}`;
                  } else {
                    window.open(plan.link, "_blank");
                  }
                }}
                disabled={plan.ctaDisabled || isCurrentPlan}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                  isCurrentPlan || plan.ctaDisabled
                    ? "bg-[var(--surface)] text-[var(--text-muted)] cursor-default"
                    : plan.highlight
                    ? "bg-[#ef4444] text-white hover:bg-[#dc2626]"
                    : "border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)]"
                }`}
              >
                {isCurrentPlan ? "Current plan" : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Fine print */}
      <p className="text-xs text-center text-[var(--text-muted)]">
        All plans include unlimited Search Index and Open API access. Direct Call APIs require usage credits. Prices in USD, tax inclusive.
      </p>
    </div>
  );
}

const WEBHOOK_EVENTS = [
  { id: "usage.threshold.80", label: "Usage at 80%", description: "Triggered when usage reaches 80% of limit" },
  { id: "usage.threshold.100", label: "Usage at 100%", description: "Triggered when usage reaches limit" },
  { id: "api.error", label: "API Error", description: "Triggered when an API call fails" },
  { id: "agent.connected", label: "Agent Connected", description: "Triggered when a new agent connects" },
  { id: "agent.revoked", label: "Agent Revoked", description: "Triggered when an agent is revoked" },
];

function WebhooksTab({ sessionToken }: { sessionToken: string | null }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    "usage.threshold.80": false,
    "usage.threshold.100": false,
    "agent.connected": false,
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const events = [
    {
      id: "usage.threshold.80",
      label: "Usage at 80%",
      description: "Email when 80% of your monthly Direct Call quota is used.",
      icon: AlertCircle,
      color: "text-yellow-400",
    },
    {
      id: "usage.threshold.100",
      label: "Usage limit reached",
      description: "Email when Direct Call is blocked. Search and Open APIs still work.",
      icon: AlertCircle,
      color: "text-red-400",
    },
    {
      id: "agent.connected",
      label: "New agent connected",
      description: "Email when a new agent authenticates with your workspace.",
      icon: Bot,
      color: "text-blue-400",
    },
  ];

  const toggle = async (eventId: string) => {
    const newVal = !enabled[eventId];
    setSaving(eventId);
    setEnabled(prev => ({ ...prev, [eventId]: newVal }));
    // Fire-and-forget to Convex
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "workspaces:setWebhookEvent", args: { token: sessionToken, eventId, enabled: newVal } }),
      });
      setSaved(eventId);
      setTimeout(() => setSaved(null), 2000);
    } catch { /* ignore */ }
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notifications</h2>
        <p className="text-[var(--text-muted)] mt-1">APIClaw sends email notifications to your workspace email when these events trigger.</p>
      </div>

      <div className="space-y-3">
        {events.map(ev => {
          const Icon = ev.icon;
          const isOn = enabled[ev.id];
          return (
            <div key={ev.id} className="flex items-center justify-between px-5 py-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]">
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${ev.color}`} />
                <div>
                  <p className="font-medium text-sm">{ev.label}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{ev.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(ev.id)}
                disabled={saving === ev.id}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${isOn ? "bg-[#ef4444]" : "bg-[var(--border)]"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isOn ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-muted)]">Notifications are sent to your workspace email address. No external webhook URL needed.</p>
      </div>
    </div>
  );
}
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
            <p className="text-sm text-[var(--text-muted)] mb-2">2. Or auto-install for your client:</p>
            <pre className="bg-[var(--background)] rounded-lg p-4 text-sm">npx @nordsym/apiclaw mcp-install</pre>
            <p className="text-xs text-[var(--text-muted)] mt-2">Supports: Claude Desktop, Claude Code, Cursor, Windsurf, Cline, Continue, Codex (OpenAI)</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-2">3. Or install for a specific client:</p>
            <pre className="bg-[var(--background)] rounded-lg p-4 text-sm space-y-1">{`npx @nordsym/apiclaw setup --client cursor
npx @nordsym/apiclaw setup --client windsurf
npx @nordsym/apiclaw setup --client codex`}</pre>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
        <h3 className="font-semibold mb-4">MCP Tools</h3>
        <div className="space-y-3">
          {[
            { name: "discover_apis", desc: "Search 22,000+ APIs by capability" },
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
          {["Brave Search", "46elks SMS", "Resend Email", "OpenRouter LLM", "ElevenLabs TTS", "Twilio", "E2B Code", "Deepgram STT", "AssemblyAI", "Stability AI", "Replicate", "Groq", "Mistral", "Cohere", "Together AI", "Serper", "Firecrawl", "GitHub", "APILayer"].map((p) => (
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

// Team Section Component
function TeamSection({ workspace }: { workspace: Workspace | null }) {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [notifyClicked, setNotifyClicked] = useState(false);

  return (
    <SettingsSection title="Team" icon={Users}>
      <div className="space-y-4 pt-4">
        {/* Team Members List */}
        <div className="space-y-3">
          {/* Owner - always shown */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ef4444]/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-[#ef4444]" />
              </div>
              <div>
                <p className="font-medium">{workspace?.email || "Loading..."}</p>
                <p className="text-sm text-[var(--text-muted)]">Account owner</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#ef4444]/20 text-[#ef4444] text-xs font-medium">
              Owner
            </span>
          </div>
        </div>

        {/* Invite Button */}
        <button
          onClick={() => setShowComingSoon(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--text-secondary)] font-medium hover:border-[#ef4444]/50 hover:text-[#ef4444] transition"
        >
          <Plus className="w-5 h-5" />
          Invite Team Member
        </button>

        {/* Coming Soon Card */}
        {showComingSoon && (
          <div className="p-5 rounded-xl bg-gradient-to-br from-[#ef4444]/5 to-[#ef4444]/10 border border-[#ef4444]/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-[#ef4444]" />
              <h4 className="font-semibold text-[#ef4444]">Invite Team Members</h4>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Share your workspace with team members. They&apos;ll have their own login but share your API access and billing.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setNotifyClicked(true);
                  setTimeout(() => setNotifyClicked(false), 3000);
                }}
                disabled={notifyClicked}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  notifyClicked
                    ? "bg-green-500/20 text-green-500"
                    : "bg-[#ef4444] text-white hover:bg-[#dc2626]"
                }`}
              >
                {notifyClicked ? (
                  <>
                    <Check className="w-4 h-4" />
                    We&apos;ll notify you!
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Get Notified When Ready
                  </>
                )}
              </button>
              <button
                onClick={() => setShowComingSoon(false)}
                className="px-4 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Info text */}
        {!showComingSoon && (
          <p className="text-xs text-[var(--text-muted)] text-center">
            Each team member connects their own MCP agent to this workspace
          </p>
        )}
      </div>
    </SettingsSection>
  );
}

function SettingsTab({ workspace, sessionToken, onWorkspaceUpdate }: { workspace: Workspace | null; sessionToken: string | null; onWorkspaceUpdate?: (patch: Partial<Workspace>) => void }) {
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
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Security" icon={Lock}>
        <div className="space-y-4 pt-4">
          <div className="p-4 rounded-xl bg-[var(--surface)]">
            <p className="font-medium mb-1">Change Password</p>
            <p className="text-sm text-[var(--text-muted)] mb-3">Set or update your password. You can always use magic link to sign in.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const pw = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
                const confirm = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;
                if (pw.length < 8) { alert("Password must be at least 8 characters"); return; }
                if (pw !== confirm) { alert("Passwords do not match"); return; }
                try {
                  await fetch(`${CONVEX_URL}/api/mutation`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      path: "workspaces:setPassword",
                      args: { token: sessionToken, password: pw },
                    }),
                  });
                  form.reset();
                  alert("Password updated");
                } catch {
                  alert("Failed to update password");
                }
              }}
              className="space-y-3"
            >
              <input name="newPassword" type="password" placeholder="New password (min 8 chars)" className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#ef4444]" />
              <input name="confirmPassword" type="password" placeholder="Confirm password" className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:ring-1 focus:ring-[#ef4444]" />
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-medium hover:bg-[#dc2626] transition">Update Password</button>
            </form>
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
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const input = (e.target as HTMLFormElement).elements.namedItem("wsName") as HTMLInputElement;
                const name = input.value.trim();
                if (!name || !sessionToken) return;
                try {
                  await fetch(`${CONVEX_URL}/api/mutation`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      path: "workspaces:updateWorkspaceName",
                      args: { token: sessionToken, name },
                    }),
                  });
                  onWorkspaceUpdate?.({ workspaceName: name });
                  input.style.borderColor = "#22c55e";
                  setTimeout(() => { input.style.borderColor = ""; }, 2000);
                } catch {
                  input.style.borderColor = "#ef4444";
                  setTimeout(() => { input.style.borderColor = ""; }, 2000);
                }
              }}
              className="flex gap-2"
            >
              <input
                name="wsName"
                type="text"
                placeholder="e.g. My Company, Team Name"
                defaultValue={workspace?.workspaceName || ""}
                className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#ef4444]/50"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#ef4444] text-white text-sm font-medium hover:bg-[#dc2626] transition"
              >
                Save
              </button>
            </form>
            <p className="text-xs text-[var(--text-muted)] mt-1">Shown in sidebar instead of email</p>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)]">
            <div>
              <p className="font-medium">Tier</p>
              <p className="text-sm text-[var(--text-muted)]">Current subscription plan</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#ef4444]/20 text-[#ef4444] text-sm font-medium capitalize">
              {workspace?.tier === "partner" ? "Partner" : (workspace?.tier === "backer" || workspace?.tier === "founder") ? "Founder" : workspace?.tier === "pro" ? "Pro" : workspace?.tier === "usage_based" ? "Pay as you go" : workspace?.tier || "Free"}
            </span>
          </div>
        </div>
      </SettingsSection>

      <TeamSection workspace={workspace} />

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
                {workspace?.tier === "partner" ? "Partner" : (workspace?.tier === "backer" || workspace?.tier === "founder") ? "Founder — Unlimited" : workspace?.tier === "pro" || workspace?.tier === "usage_based" ? "Usage-Based" : "Free Tier"}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              ((workspace?.tier === "backer" || workspace?.tier === "founder") || workspace?.tier === "partner")
                ? "bg-[#ef4444]/20 text-[#ef4444]"
                : workspace?.tier === "pro" || workspace?.tier === "usage_based"
                ? "bg-green-500/20 text-green-500"
                : "bg-[var(--surface-elevated)] text-[var(--text-muted)]"
            }`}>
              {((workspace?.tier === "backer" || workspace?.tier === "founder") || workspace?.tier === "partner" || workspace?.tier === "pro" || workspace?.tier === "usage_based") ? "Active" : "Free"}
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