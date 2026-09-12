"use client";
import { workspaceRequest, invalidateWorkspace } from "@/lib/workspace-data";
import { useWorkspaceRefresh, useWorkspaceRefreshEvents } from "@/lib/use-workspace-refresh";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { CLERK_ENABLED, type Workspace, type Agent, type ConnectedAgent, type UsageData, type ProviderAPI, type TabType, type AnalyticsSubtab } from "./_shared";
import { WorkspaceShell } from "./views/Shell";
import { AgentsTab } from "./views/Agents";
import { ActivityTab } from "./views/Activity";
import { ProviderConsoleTab } from "./views/Provider";
import { BillingTab } from "./views/Billing";
import { SettingsTab } from "./views/Settings";

export default function WorkspacePage() {
  const router = useRouter();
  useWorkspaceRefreshEvents();
  const revision = useWorkspaceRefresh();
  const accountRequest = useRef(0);
  const providerRequest = useRef(0);
  const searchParams = useSearchParams();
  const signInPath = "/sign-in";
  
  // Handle null searchParams
  if (!searchParams) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  const requestedTab = searchParams.get("tab");
  // "connections" section=keys/remote both now live in Settings; section=agents (and
  // the bare tab) map to the new Agents home. Deep links keep resolving, no 404s.
  const requestedSection = searchParams.get("section");
  const legacyTabMap: Record<string, TabType> = {
    overview: "agents",
    connections: requestedSection === "keys" || requestedSection === "remote" ? "settings" : "agents",
    "my-agents": "agents",
    "api-keys": "settings",
    integrations: "settings",
    analytics: "activity",
    logs: "activity",
    "my-apis": "provider-console",
  };
  const tabFromUrl = (requestedTab && legacyTabMap[requestedTab]) || requestedTab as TabType | null;
  const subFromUrl = searchParams.get("sub") as AnalyticsSubtab | null;
  const arrival = searchParams.get("from") === "cli" ? "cli" : undefined;

  const [returnedFromStripe] = useState(() => searchParams.get("billing") === "success" || searchParams.get("portal") === "success");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl || "agents");
  const [analyticsSubtab, setAnalyticsSubtab] = useState<AnalyticsSubtab>(subFromUrl || "logs");
  
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

    if (billingParam || portalParam) setActiveTab("billing");

    if (billingParam === "success") {
      if (!sessionToken) return;

      let active = true;
      let attempts = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      showToast("Checking your payment method and billing status.", "info");

      const pollBillingReadiness = async () => {
        attempts += 1;
        try {
          const dashboard = await workspaceRequest<{ workspace: Workspace }>("query", "workspaces:getWorkspaceDashboard", { token: sessionToken });
          if (!active) return;
          invalidateWorkspace();
          const billing = await workspaceRequest<{ paymentMethod: unknown }>("query", "billing:getBillingInfo", { token: sessionToken });
          if (!active) return;
          if (billing.paymentMethod) {
            showToast("Payment method connected. Your plan is shown in Billing.", "success");
            cleanReturnParam("billing");
            return;
          }
          if (dashboard?.workspace?.paygActive === true) {
            showToast("PAYG verified. Billing-ready calls can now continue at provider cost + 15%.", "success");
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
          showToast("Payment details are still updating. Check Billing again before using Paid APIs.", "info");
          cleanReturnParam("billing");
        }
      };

      void pollBillingReadiness();
      return () => {
        active = false;
        if (timer) clearTimeout(timer);
      };
    } else if (billingParam === "cancel") {
      invalidateWorkspace();
      showToast("Checkout cancelled. You can try again anytime.", "info");
      cleanReturnParam("billing");
    }

    // Handle portal return
    if (portalParam === "success") {
      invalidateWorkspace();
      showToast("Back from Stripe. Checking your payment details.", "info");
      cleanReturnParam("portal");
    }
  }, [searchParams, sessionToken, showToast]);

  useEffect(() => {
    const validTabs: TabType[] = ["agents", "api-catalog", "activity", "billing", "settings", "provider-console"];
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
      if (tabFromUrl === "activity") {
        if (subFromUrl && ["overview", "usage", "logs", "chains"].includes(subFromUrl)) {
          setAnalyticsSubtab(subFromUrl);
        }
      }
    }
  }, [tabFromUrl, subFromUrl]);

  const fetchWorkspaceData = useCallback(async (token: string) => {
    const request = ++accountRequest.current;
    const dashboard = await workspaceRequest<{ workspace: Workspace }>("query", "workspaces:getWorkspaceDashboard", { token });
    if (!dashboard?.workspace?.id || !dashboard.workspace.email || !dashboard.workspace.tier) throw new Error("Could not verify workspace identity");
    const [connectedAgents, usageData] = await Promise.all([
      workspaceRequest<ConnectedAgent[]>("query", "agents:getWorkspaceAgents", { token }),
      workspaceRequest<UsageData>("query", "workspaces:getUsageBreakdown", { token }),
    ]);
    if (request !== accountRequest.current) return;
    setWorkspace(dashboard.workspace);
    setAgents(connectedAgents.map((a) => ({ id: a.id, fingerprint: a.fingerprint, name: a.name, lastUsedAt: a.lastActiveAt, createdAt: a.firstSeenAt, isCurrent: false })));
    setUsage(usageData);
  }, []);

  const fetchProviderData = useCallback(async (token?: string) => {
    if (!token) {
      setIsProvider(false);
      return;
    }
    const request = ++providerRequest.current;
    try {
      const result = await workspaceRequest<{ provider: { id: string; name: string } | null; apis: ProviderAPI[] }>("query", "providers:getWorkspaceProviderConsole", { token });
      if (request !== providerRequest.current) return;
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
      throw err;
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

        }

        // If no verified session exists, enter the canonical Clerk flow.
        if (!token) {
          router.push(signInPath);
          return;
        }

      } catch (err) {
        console.error("Init error:", err);
        setError("Failed to load workspace");
        setIsLoading(false);
      }
    };

    init();
  }, [router, fetchWorkspaceData, fetchProviderData, signInPath]);

  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;
    setRefreshing(true);
    void Promise.all([fetchWorkspaceData(sessionToken), fetchProviderData(sessionToken)])
      .then(() => { if (!cancelled) setError(null); })
      .catch(() => { if (!cancelled) setError("Could not refresh account data. Previously loaded information may be out of date."); })
      .finally(() => { if (!cancelled) { setIsLoading(false); setRefreshing(false); } });
    return () => { cancelled = true; accountRequest.current++; providerRequest.current++; };
  }, [sessionToken, revision, fetchWorkspaceData, fetchProviderData]);

  useEffect(() => {
    if (!isLoading && !error && activeTab === "provider-console" && !isProvider) {
      setActiveTab("agents");
      router.replace("/workspace?tab=agents");
    }
  }, [activeTab, isLoading, isProvider, error, router]);

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
      setError("Sign-out did not finish. Refresh to check your session, then try again.");
    }
  };

  const handleRefresh = async () => {
    try {
      if (sessionToken) {
        await fetchWorkspaceData(sessionToken);
        await fetchProviderData(sessionToken);
        setError(null);
        invalidateWorkspace();
      }
    } catch (err) {
      setError("Failed to refresh");
    } finally {
      setIsLoading(false);
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

  if (error && !workspace) {
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

  if (!workspace) return <p role="status">Loading verified account data…</p>;

  const displayEmail = workspace.workspaceName || workspace.email;
  const displayTier = workspace.tier;
  
  // Usage thresholds for banners
  const showUsageWarning = workspace && workspace.tier === "free" && workspace.usagePercentage >= 80 && workspace.usagePercentage < 100;
  const showUsageExceeded = workspace && workspace.tier === "free" && workspace.usagePercentage >= 100;

  const usageLabel = workspace
    ? workspace.usageLimit === -1 ? "Unlimited calls" : `${workspace.usageRemaining}/${workspace.usageLimit} calls`
    : undefined;

  return (
    <WorkspaceShell key={workspace.id}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(id) => {
        setActiveTab(id);
        if (id === "activity") setAnalyticsSubtab("logs");
        router.push(id === "activity" ? "/workspace?tab=activity&sub=logs" : `/workspace?tab=${id}`);
      }}
      workspaceName={displayEmail}
      tierLabel={displayTier}
      usageLabel={usageLabel}
      usageLow={Boolean(workspace && workspace.usagePercentage > 80)}
      onLogout={handleLogout}
    >
      {refreshing && <p role="status" className="mb-4">Refreshing account data. Showing the last verified information.</p>}
      {error && <p role="alert" className="mb-6 text-[var(--accent)]">{error} <button type="button" onClick={invalidateWorkspace}>Try again</button></p>}
      <OnboardingWizard sessionToken={sessionToken} arrival={arrival} />
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
          
          {activeTab === "agents" && (
            <AgentsTab
              workspace={workspace}
              hasAgentsHint={agents.length > 0}
              setActiveTab={setActiveTab}
              sessionToken={sessionToken}
              onToast={showToast}
            />
          )}
          {activeTab === "api-catalog" && (
            <WorkspaceCatalog sessionToken={sessionToken} />
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
            <BillingTab workspace={workspace} sessionToken={sessionToken} returnedFromStripe={returnedFromStripe} />
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
