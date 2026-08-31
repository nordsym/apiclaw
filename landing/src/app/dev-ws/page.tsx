"use client";

/**
 * DEV-ONLY harness to render workspace views with fixture data, no sign-in.
 * Guarded: production build returns 404. Remove nothing from here to "fix" prod.
 *   /dev-ws?view=agents|api-catalog|activity|provider|billing|settings[&sub=..][&w=390]
 *   Add &tier=founder|partner|free|usage_based to override the fixture workspace tier.
 *   Add &card=0 so billing:getBillingInfo returns no payment method.
 *   Add &wizard=1 to mount the first-run OnboardingWizard on top (fixture state: never completed).
 *   Add &subagents=empty on view=agents to render the zero-subagents state (Subagents section hidden).
 */
import { notFound, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { WorkspaceShell } from "../workspace/views/Shell";
import { AgentsTab } from "../workspace/views/Agents";
import { ActivityTab } from "../workspace/views/Activity";
import { ProviderConsoleTab } from "../workspace/views/Provider";
import { BillingTab } from "../workspace/views/Billing";
import { SettingsTab } from "../workspace/views/Settings";
import { CONVEX_URL, type AnalyticsSubtab, type TabType } from "../workspace/_shared";
import { WorkspaceCatalog, GATEWAY_URL } from "@/components/WorkspaceCatalog";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import * as fx from "./fixtures";

const TOKEN = "dev-fixture-token";

function installFetchStub(emptySubagents: boolean, noCard: boolean) {
  const real = window.fetch.bind(window);
  const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { "Content-Type": "application/json" } });
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith(CONVEX_URL)) {
      let path = "";
      let args: Record<string, unknown> = {};
      try { const body = JSON.parse(String(init?.body || "{}")); path = body.path; args = body.args || {}; } catch {}
      // &subagents=empty drives the zero-subagents state for the Agents view.
      if (path === "agents:getSubagents" && emptySubagents) return json({ status: "success", value: { subagents: [], total: 0 } });
      if (path === "billing:getBillingInfo" && noCard) {
        return json({ status: "success", value: { ...fx.billingInfo, paymentMethod: null } });
      }
      const hit = fx.convex[path];
      const value = typeof hit === "function" ? (hit as (a: Record<string, unknown>) => unknown)(args) : hit;
      return json({ status: "success", value: value === undefined ? null : value });
    }
    const localPath = url.replace(/^https?:\/\/[^/]+/, "").split("?")[0];
    // Gateway routes: the catalog uses GATEWAY_URL, the wizard defaults to the convex.site host.
    const isGateway = url.startsWith(GATEWAY_URL) || /^https?:\/\/[^/]+\.convex\.site\//.test(url);
    if (isGateway && localPath in fx.gateway) return json(fx.gateway[localPath]);
    if (localPath in fx.local) return json(fx.local[localPath]);
    if (localPath.startsWith("/api/")) return json({});
    return real(input, init);
  };
}

function Harness() {
  const sp = useSearchParams();
  const view = (sp?.get("view") || "agents") as string;
  const sub = sp?.get("sub") || "";
  const wizard = sp?.get("wizard") === "1";
  const emptySubagents = sp?.get("subagents") === "empty";
  const noCard = sp?.get("card") === "0";
  const tierOverride = sp?.get("tier");
  const workspace = {
    ...fx.workspace,
    ...(tierOverride ? { tier: tierOverride } : {}),
  };
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabType>(view === "provider" ? "provider-console" : view === "overview" || view === "connections" ? "agents" : (view as TabType));
  const [analyticsSub, setAnalyticsSub] = useState<AnalyticsSubtab>((sub as AnalyticsSubtab) || "logs");
  const [showAddApi, setShowAddApi] = useState(false);

  useEffect(() => { installFetchStub(emptySubagents, noCard); setReady(true); }, [emptySubagents, noCard]);
  if (!ready) return null;

  const tabs = [
    { id: "agents", label: "Agents" }, { id: "api-catalog", label: "Catalog" },
    { id: "activity", label: "Activity" }, { id: "billing", label: "Billing" }, { id: "settings", label: "Settings" }, { id: "provider-console", label: "Provider Console" },
  ] as const;

  return (
    <WorkspaceShell
      tabs={[...tabs]}
      activeTab={tab}
      onTabChange={(id) => setTab(id)}
      workspaceName={workspace.workspaceName || workspace.email}
      tierLabel={workspace.tier}
      usageLabel={workspace.usageLimit === -1 ? "Unlimited calls" : `${workspace.usageRemaining}/${workspace.usageLimit} calls`}
      onLogout={() => {}}
    >
      {tab === "agents" && <AgentsTab workspace={workspace} hasAgentsHint={fx.agents.length > 0} setActiveTab={setTab} sessionToken={TOKEN} onToast={() => {}} />}
      {tab === "activity" && (
        <ActivityTab workspace={workspace} agents={fx.agents} usage={fx.usage} activeSubtab={analyticsSub} setActiveSubtab={setAnalyticsSub} sessionToken={TOKEN} />
      )}
      {tab === "provider-console" && (
        <ProviderConsoleTab apis={fx.providerApis} workspace={workspace} usage={fx.usage} sessionToken={TOKEN} providerId="prov_dev" showAddApi={showAddApi} setShowAddApi={setShowAddApi} />
      )}
      {tab === "billing" && <BillingTab workspace={workspace} sessionToken={TOKEN} />}
      {tab === "settings" && <SettingsTab workspace={workspace} sessionToken={TOKEN} onWorkspaceUpdate={() => {}} />}
      {tab === "api-catalog" && <WorkspaceCatalog sessionToken={TOKEN} />}
      {wizard && <OnboardingWizard sessionToken={TOKEN} />}
    </WorkspaceShell>
  );
}

export default function DevWorkspacePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense fallback={null}>
      <Harness />
    </Suspense>
  );
}
