"use client";

import { useRouter } from "next/navigation";
import {
  getAgentPresence,
  isUnlimitedWorkspace,
} from "@/lib/workspace-truth";
import {
  FREE_MANAGED_CALLS_LIFETIME,
} from "@apiclaw/product-truth";
import {
  Workspace,
  Agent,
  ProviderAPI,
  TabType,
} from "../_shared";
import { PageHeader, Section, Panel, StatGrid, StatCard, Row, Status, btnSolid } from "./ui";

const TIER_LABEL: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  scale: "Scale",
  partner: "Partner",
  founder: "Founder",
  usage_based: "Pay as you go",
};

function tierLabel(tier?: string) {
  if (!tier) return "Free";
  return TIER_LABEL[tier] || tier;
}

function providerStatus(status: string): { kind: "ok" | "warn" | "bad" | "muted"; label: string } {
  if (status === "approved") return { kind: "ok", label: "Live" };
  if (status === "blocked") return { kind: "bad", label: "Blocked" };
  if (status === "rate_limited") return { kind: "warn", label: "Rate limited" };
  if (status === "pending") return { kind: "warn", label: "Pending review" };
  return { kind: "muted", label: status };
}

function agentStatus(lastUsedAt: number): { kind: "ok" | "muted"; label: string } {
  const presence = getAgentPresence(lastUsedAt);
  return { kind: presence.state === "active" ? "ok" : "muted", label: presence.label };
}

export function OverviewTab({
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
  const router = useRouter();
  const navigateTo = (tab: TabType) => {
    setActiveTab(tab);
    router.push(tab === "activity" ? "/workspace?tab=activity&sub=logs" : `/workspace?tab=${tab}`);
  };

  const isPaid = isUnlimitedWorkspace(workspace || {});
  const usageCount = workspace?.usageCount ?? 0;
  const usageLimit = workspace?.usageLimit && workspace.usageLimit > 0 ? workspace.usageLimit : FREE_MANAGED_CALLS_LIFETIME;
  const usageRemaining = isPaid ? -1 : Math.max(0, workspace?.usageRemaining ?? usageLimit - usageCount);
  const nearCap = !isPaid && usageLimit > 0 && usageRemaining / usageLimit <= 0.2;

  const next = agents.length === 0
    ? { title: "Connect an agent", body: "Nothing is connected to this workspace yet.", cta: "Connect an agent", tab: "connections" as TabType }
    : usageCount === 0
      ? { title: "Make your first call", body: "Your agent is connected. Run one managed call to see it in Activity.", cta: "Make your first call", tab: "api-catalog" as TabType }
      : { title: "See the last call", body: `${usageCount.toLocaleString()} managed ${usageCount === 1 ? "call" : "calls"} so far. Inspect the latest one.`, cta: "See the last call", tab: "activity" as TabType };

  const visibleAgents = agents.slice(0, 3);

  return (
    <div>
      <PageHeader title="Home" description={workspace?.workspaceName || workspace?.email} />

      <Section title="Next step">
        <Panel className="p-5">
          <p className="text-[15px] font-semibold tracking-[-0.01em]">{next.title}</p>
          <p className="mt-1 text-[13.5px] text-[var(--text-muted)]">{next.body}</p>
          <div className="mt-4">
            <button type="button" onClick={() => navigateTo(next.tab)} className={btnSolid}>{next.cta}</button>
          </div>
        </Panel>
      </Section>

      <Section
        title="Usage"
        className="mt-8"
        action={nearCap ? <button type="button" onClick={() => navigateTo("billing")} className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Upgrade</button> : undefined}
      >
        <StatGrid cols={3}>
          <StatCard title="Managed calls used" value={usageCount.toLocaleString()} />
          <StatCard title="Remaining" value={isPaid ? "Unlimited" : usageRemaining.toLocaleString()} hint={isPaid ? undefined : `of ${usageLimit.toLocaleString()} lifetime`} />
          <StatCard title="Plan" value={tierLabel(workspace?.tier)} />
        </StatGrid>
        {nearCap && (
          <p className="mt-4 text-[13px] text-[var(--text-muted)]">
            {usageRemaining === 0 ? "Free limit reached. Managed calls are blocked until you upgrade." : `${usageRemaining} free ${usageRemaining === 1 ? "call" : "calls"} left. Search and open APIs keep working.`}
          </p>
        )}
      </Section>

      <Section
        title="Agents"
        className="mt-8"
        action={agents.length > 3 ? <button type="button" onClick={() => navigateTo("connections")} className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">See all {agents.length}</button> : undefined}
      >
        {agents.length === 0 ? (
          <p className="text-[13.5px] text-[var(--text-muted)]">No agents connected.</p>
        ) : (
          <div>
            {visibleAgents.map((a) => {
              const s = agentStatus(a.lastUsedAt);
              return (
                <Row key={a.id} onClick={() => navigateTo("connections")} right={<Status kind={s.kind}>{s.label}</Status>}>
                  <p className="truncate text-[14px]">{a.customName || a.name || a.fingerprint}{a.isCurrent ? <span className="ml-2 text-[12px] text-[var(--text-muted)]">this session</span> : null}</p>
                  {(a.customName || a.name) && <p className="claw-mono truncate text-[12px] text-[var(--text-muted)]">{a.fingerprint}</p>}
                </Row>
              );
            })}
          </div>
        )}
      </Section>

      {providerApis.length > 0 && (
        <Section
          title="Your APIs"
          className="mt-8"
          action={<button type="button" onClick={() => navigateTo("provider-console")} className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Manage</button>}
        >
          <div>
            {providerApis.slice(0, 5).map((api) => {
              const s = providerStatus(api.status);
              return (
                <Row key={api._id} onClick={() => navigateTo("provider-console")} right={<Status kind={s.kind}>{s.label}</Status>}>
                  <p className="truncate text-[14px]">{api.name}</p>
                  <p className="truncate text-[12px] text-[var(--text-muted)]">{api.category}{api.hasDirectCall ? " · managed" : ""}</p>
                </Row>
              );
            })}
            {providerApis.length > 5 && (
              <p className="border-t border-[var(--border-subtle)] pt-3 text-[13px] text-[var(--text-muted)]">+{providerApis.length - 5} more</p>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
