"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  Settings,
  User,
  Activity,
} from "lucide-react";
import {
  UsageWarningBanner,
  UsageExceededBanner,
} from "@/components/CheckoutButton";
import { Toast, useToast } from "@/components/Toast";
import { WorkspaceCatalog } from "@/components/WorkspaceCatalog";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import {
  getWorkspaceNavigation,
} from "@/lib/workspace-truth";
import {
  getWorkspaceSessionToken,
  subscribeWorkspaceSessionToken,
} from "@/lib/workspace-session";
import { CONVEX_URL, CLERK_ENABLED, type Workspace, type Agent, type ConnectedAgent, type UsageData, type ProviderAPI, type TabType, type AnalyticsSubtab } from "./_shared";
import { WorkspaceShell } from "./views/Shell";
import { OverviewTab } from "./views/Overview";
import { ConnectionsTab } from "./views/Connections";
import { ActivityTab } from "./views/Activity";
import { ProviderConsoleTab } from "./views/Provider";
import { BillingTab } from "./views/Billing";
import { SettingsTab } from "./views/Settings";

export default function WorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signInPath = "/sign-in";
  
  // Handle null searchParams
  if (!searchParams) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  const requestedTab = searchParams.get("tab");
  const legacyTabMap: Record<string, TabType> = {
    "my-agents": "connections",
    "api-keys": "connections",
    integrations: "connections",
    analytics: "activity",
    logs: "activity",
    "my-apis": "provider-console",
  };
  const tabFromUrl = (requestedTab && legacyTabMap[requestedTab]) || requestedTab as TabType | null;
  const subFromUrl = searchParams.get("sub") as AnalyticsSubtab | null;
  const legacyConnectionSection = requestedTab === "api-keys" ? "keys" : requestedTab === "integrations" ? "remote" : "agents";
  const connectionSectionFromUrl = searchParams.get("section") || legacyConnectionSection;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl || "overview");
  const [analyticsSubtab, setAnalyticsSubtab] = useState<AnalyticsSubtab>(subFromUrl || "logs");
  const [connectionsSection, setConnectionsSection] = useState(connectionSectionFromUrl);
  
  // Workspace data (consumer)
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  
  // Provider data
  const [providerApis, setProviderApis] = useState<ProviderAPI[]>([]);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [isProvider, setIsProvider] = useState(false);
  const [showAddApi, setShowAddApi] = useState(false);
  
  // Toast notifications
  const { toast, showToast, hideToast } = useToast();

  // Treat the Stripe return as pending until the owner-scoped workspace state
  // confirms an active subscription, attached card, and exact meter contract.
  useEffect(() => {
    const billingParam = searchParams.get("billing");
    const portalParam = searchParams.get("portal");

    const cleanReturnParam = (name: "billing" | "portal") => {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete(name);
      window.history.replaceState({}, "", newUrl.toString());
    };

    if (billingParam === "success") {
      if (!sessionToken) return;

      let active = true;
      let attempts = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      showToast("Payment method received. Verifying PAYG billing before activation.", "info");

      const pollBillingReadiness = async () => {
        attempts += 1;
        try {
          const response = await fetch(`${CONVEX_URL}/api/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: "workspaces:getWorkspaceDashboard",
              args: { token: sessionToken },
            }),
            cache: "no-store",
          });
          const payload = await response.json();
          const dashboard = payload.value || payload;
          if (!active) return;
          if (dashboard?.workspace) setWorkspace(dashboard.workspace);
          if (dashboard?.workspace?.paygActive === true) {
            showToast("PAYG verified. Billing-ready managed calls can now continue at provider cost + 15%.", "success");
            cleanReturnParam("billing");
            return;
          }
        } catch {
          // Keep the workspace fail-closed and retry the owner-scoped read.
        }

        if (active && attempts < 15) {
          timer = setTimeout(pollBillingReadiness, 2_000);
          return;
        }

        if (active) {
          showToast("Payment method saved. PAYG is still pending verification, so managed billing remains off.", "info");
          cleanReturnParam("billing");
        }
      };

      void pollBillingReadiness();
      return () => {
        active = false;
        if (timer) clearTimeout(timer);
      };
    } else if (billingParam === "cancel") {
      showToast("Checkout cancelled. You can try again anytime.", "info");
      cleanReturnParam("billing");
    }

    // Handle portal return
    if (portalParam === "success") {
      showToast("Billing settings received. Entitlement remains fail-closed until Stripe confirms it.", "info");
      cleanReturnParam("portal");
    }
  }, [searchParams, sessionToken, showToast]);

  useEffect(() => {
    const validTabs: TabType[] = ["overview", "api-catalog", "connections", "activity", "billing", "settings", "provider-console"];
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
      if (tabFromUrl === "connections" && ["agents", "keys", "remote"].includes(connectionSectionFromUrl)) {
        setConnectionsSection(connectionSectionFromUrl);
      }
      if (tabFromUrl === "activity") {
        if (subFromUrl && ["overview", "usage", "logs", "chains"].includes(subFromUrl)) {
          setAnalyticsSubtab(subFromUrl);
        }
      }
    }
  }, [tabFromUrl, subFromUrl, connectionSectionFromUrl]);

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
        // Guard: anonymous workspace (no email) means the browser session is stale, force re-login
        if (!dashboard.workspace.email) {
          localStorage.removeItem("apiclaw_workspace_session");
          await fetch("/api/workspace-auth/session", { method: "DELETE" });
          router.push(signInPath);
          return;
        }
        setWorkspace(dashboard.workspace);
      }

      // Agents and usage are independent of each other: read them together.
      const q = (path: string) => fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, args: { token } }),
      }).then((r) => r.json());
      const [agentsData, usageData] = await Promise.all([q("agents:getWorkspaceAgents"), q("workspaces:getUsageBreakdown")]);
      const connectedAgents = agentsData.value || agentsData || [];
      setAgents((Array.isArray(connectedAgents) ? connectedAgents : []).map((a: ConnectedAgent) => ({
        id: a.id,
        fingerprint: a.fingerprint,
        name: a.name,
        lastUsedAt: a.lastActiveAt,
        createdAt: a.firstSeenAt,
        isCurrent: false,
      })));
      setUsage(usageData.value || usageData);
    } catch (err) {
      console.error("Fetch workspace error:", err);
    }
  }, []);

  const fetchProviderData = useCallback(async (token?: string) => {
    if (!token) {
      setIsProvider(false);
      return;
    }
    try {
      const response = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "providers:getWorkspaceProviderConsole", args: { token } }),
      });
      const data = await response.json();
      if (!response.ok || data.status === "error") throw new Error(data.errorMessage || "Provider console unavailable");
      const result = data.value || data;
      const provider = result.provider;
      const seen = new Set<string>();
      const apis = (Array.isArray(result.apis) ? result.apis : []).filter((api: ProviderAPI) => {
        const key = api.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setProviderApis(apis);
      if (provider?.id) {
        setProviderId(provider.id);
        setProviderName(provider.name || null);
        setIsProvider(true);
      } else {
        setProviderId(null);
        setProviderName(null);
        setIsProvider(false);
      }
    } catch (err) {
      console.error("Fetch provider error:", err);
      setIsProvider(false);
    }
  }, []);

  useEffect(() => {
    // Keep the in-memory browser child current. The durable owner bearer
    // remains inaccessible in the HttpOnly cookie.
    return subscribeWorkspaceSessionToken((token) => {
      setSessionToken(token);
      if (!token) router.push(signInPath);
    });
  }, [router, signInPath]);

  useEffect(() => {
    const init = async () => {
      try {
        // Exchange the HttpOnly owner cookie for a short-lived browser child.
        // Keep the child in memory only. Migrate and remove any legacy
        // localStorage owner token so existing signed-in users are not stranded.
        const token = await getWorkspaceSessionToken();

        if (token) {
          setSessionToken(token);
          await fetchWorkspaceData(token);
          await fetchProviderData(token);
        }

        // If no verified session exists, enter the canonical Clerk flow.
        if (!token) {
          router.push(signInPath);
          return;
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Init error:", err);
        setError("Failed to load workspace");
        setIsLoading(false);
      }
    };

    init();
  }, [router, fetchWorkspaceData, fetchProviderData, signInPath]);

  useEffect(() => {
    if (!isLoading && activeTab === "provider-console" && !isProvider) {
      setActiveTab("overview");
      router.replace("/workspace?tab=overview");
    }
  }, [activeTab, isLoading, isProvider, router]);

  const handleLogout = async () => {
    try {
      // Revoke the APIClaw bearer and clear its cookie before ending Clerk.
      const logoutResponse = await fetch("/api/workspace-auth/session", { method: "DELETE" });
      if (!logoutResponse.ok) {
        throw new Error("APIClaw session revocation failed");
      }
      localStorage.removeItem("apiclaw_workspace_session");

      // If Clerk is enabled, route through its sign-out flow so afterSignOutUrl
      // (configured on <ClerkProvider>) also clears the identity session.
      if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        const clerk = (window as unknown as { Clerk?: { signOut: (opts: { redirectUrl: string }) => Promise<void> } }).Clerk;
        if (clerk?.signOut) {
          await clerk.signOut({ redirectUrl: "/sign-in" });
          return;
        }
        // Clerk not loaded. The APIClaw session is already revoked.
      }
      router.push(signInPath);
    } catch (err) {
      console.error("Logout error:", err);
      setError("Could not sign out safely. Your APIClaw session is still active, so please try again.");
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (sessionToken) {
        await fetchWorkspaceData(sessionToken);
        await fetchProviderData(sessionToken);
      }
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
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
      showToast("Agent revoked.", "success");
    } catch (err) {
      console.error("Revoke error:", err);
      showToast("Could not revoke the agent. Try again.", "error");
    }
  };

  const handleRenameAgent = async (agentId: string, name: string) => {
    if (!sessionToken) return;
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "agents:renameAgent",
          args: { token: sessionToken, agentId, name },
        }),
      });
      setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, name, customName: name } : a)));
    } catch (err) {
      console.error("Rename error:", err);
      showToast("Could not rename the agent. Try again.", "error");
    }
  };

  const tabs = getWorkspaceNavigation({ isProvider });

  if (isLoading) {
    return (
      <div className="claw flex min-h-screen items-center justify-center">
        <p className="text-[13px] text-[var(--text-muted)]">Loading workspace…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="claw flex min-h-screen items-center justify-center px-6">
        <div className="max-w-[24rem] text-center">
          <h1 className="text-[1.25rem] font-semibold tracking-[-0.02em]">Something went wrong</h1>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">{error}</p>
          <button type="button" onClick={handleRefresh} className="claw-btn claw-btn-solid mt-6">Try again</button>
        </div>
      </div>
    );
  }

  const displayEmail = workspace?.workspaceName || workspace?.email || providerName || "User";
  const displayTier = workspace?.tier || "free";
  
  // Usage thresholds for banners
  const showUsageWarning = workspace && workspace.tier === "free" && workspace.usagePercentage >= 80 && workspace.usagePercentage < 100;
  const showUsageExceeded = workspace && workspace.tier === "free" && workspace.usagePercentage >= 100;

  const usageLabel = workspace
    ? workspace.usageLimit === -1 ? "Unlimited calls" : `${workspace.usageRemaining}/${workspace.usageLimit} calls`
    : undefined;

  return (
    <WorkspaceShell
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(id) => {
        setActiveTab(id);
        if (id === "activity") setAnalyticsSubtab("logs");
        if (id === "connections") setConnectionsSection("agents");
        router.push(
          id === "activity"
            ? "/workspace?tab=activity&sub=logs"
            : id === "connections"
              ? "/workspace?tab=connections&section=agents"
              : `/workspace?tab=${id}`,
        );
      }}
      workspaceName={displayEmail}
      tierLabel={displayTier}
      usageLabel={usageLabel}
      usageLow={Boolean(workspace && workspace.usagePercentage > 80)}
      onLogout={handleLogout}
    >
      <OnboardingWizard sessionToken={sessionToken} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
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
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === "api-catalog" && (
            <WorkspaceCatalog sessionToken={sessionToken} />
          )}
          {activeTab === "connections" && (
            <ConnectionsTab
              agents={agents}
              onRevoke={handleRevokeAgent}
              onRename={handleRenameAgent}
              workspaceEmail={workspace?.email}
              sessionToken={sessionToken}
              isProvider={isProvider}
              section={connectionsSection}
              onSectionChange={(next) => {
                setConnectionsSection(next);
                router.push(`/workspace?tab=connections&section=${next}`);
              }}
            />
          )}
          {activeTab === "activity" && (
            <ActivityTab
              workspace={workspace}
              agents={agents}
              usage={usage}
              activeSubtab={analyticsSubtab}
              setActiveSubtab={(next) => {
                setAnalyticsSubtab(next);
                router.push(`/workspace?tab=activity&sub=${next}`);
              }}
              sessionToken={sessionToken}
            />
          )}
          {activeTab === "billing" && (
            <BillingTab workspace={workspace} sessionToken={sessionToken} />
          )}
          {activeTab === "settings" && (
            <SettingsTab workspace={workspace} sessionToken={sessionToken} onWorkspaceUpdate={(patch) => setWorkspace(prev => prev ? { ...prev, ...patch } : prev)} />
          )}
          {activeTab === "provider-console" && isProvider && (
            <ProviderConsoleTab
              apis={providerApis}
              workspace={workspace}
              usage={usage}
              sessionToken={sessionToken}
              providerId={providerId}
              showAddApi={showAddApi}
              setShowAddApi={setShowAddApi}
            />
          )}
    </WorkspaceShell>
  );
}

// ============================================
// OVERVIEW TAB
// ============================================
