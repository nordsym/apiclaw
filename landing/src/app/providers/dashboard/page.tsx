"use client";

import { useState } from "react";
import {
  BarChart3,
  CreditCard,
  Settings,
  TrendingUp,
  Users,
  Zap,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  ChevronRight,
  Check,
  Clock,
  AlertCircle,
  LogOut,
  Loader2,
  RefreshCw,
  Plus,
  Rocket,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { ProviderAPI, Analytics, Earnings } from "@/lib/convex-client";

type TabType = "overview" | "apis" | "earnings";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

export default function DashboardPage() {
  const { session, apis, analytics, earnings, isLoading, error, refresh, logout } = useDashboardData();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: BarChart3 },
    { id: "apis" as TabType, label: "APIs", icon: Zap },
    { id: "earnings" as TabType, label: "Earnings", icon: CreditCard },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something Went Wrong</h1>
          <p className="text-text-muted mb-6">{error}</p>
          <button onClick={refresh} className="btn-primary">
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to login via hook
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-xl">
              🦞
            </Link>
            <div>
              <h1 className="font-bold text-lg">Provider Dashboard</h1>
              <p className="text-sm text-text-muted">{session.name || session.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className="p-2 rounded-lg hover:bg-surface transition"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-text-muted" />
            </button>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-surface transition"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-text-muted" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-surface rounded-xl w-fit mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-accent text-white"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <OverviewTab apis={apis} analytics={analytics} />
        )}
        {activeTab === "apis" && <ApisTab apis={apis} />}
        {activeTab === "earnings" && <EarningsTab earnings={earnings} />}
      </div>
    </div>
  );
}

// ============================================
// OVERVIEW TAB
// ============================================

function OverviewTab({
  apis,
  analytics,
}: {
  apis: ProviderAPI[];
  analytics: Analytics | null;
}) {
  const hasData = analytics && analytics.totalCalls > 0;

  // If no analytics yet, show onboarding state
  if (!hasData) {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">Welcome to APIClaw!</h2>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-6 h-6 text-accent" />
              <span className="text-text-muted">Listed APIs</span>
            </div>
            <p className="text-4xl font-bold">{apis.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-text-muted" />
              <span className="text-text-muted">Agent Discoveries</span>
            </div>
            <p className="text-4xl font-bold">
              {apis.reduce((sum, a) => sum + (a.discoveryCount || 0), 0)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-6 h-6 text-text-muted" />
              <span className="text-text-muted">Status</span>
            </div>
            <p className="text-xl font-bold text-green-500">Active</p>
          </div>
        </div>

        {/* Getting Started */}
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Rocket className="w-5 h-5 text-accent" /> Getting Started</h3>
          <p className="text-text-secondary mb-6">
            Your APIs are listed and discoverable by AI agents. Here&apos;s what happens next:
          </p>
          <ul className="space-y-3 text-text-secondary">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>AI agents can now find your APIs in the APIClaw registry</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>When agents use your APIs, usage will appear here</span>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
              <span>Set up Stripe Connect to receive payouts (coming soon)</span>
            </li>
          </ul>
        </div>

        {/* Your APIs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Your APIs</h3>
            <Link href="/providers/register" className="btn-secondary !py-2 !px-4 text-sm">
              <Plus className="w-4 h-4" />
              Add Another
            </Link>
          </div>
          <div className="grid gap-4">
            {apis.map((api) => (
              <Link key={api._id} href={`/providers/dashboard/${api._id}`} className="block rounded-xl border border-border bg-surface-elevated p-5 hover:border-accent/50 transition cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{api.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    api.status === "approved" ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-600"
                  }`}>
                    {api.status}
                  </span>
                </div>
                <p className="text-text-muted text-sm line-clamp-2 mb-3">{api.description}</p>
                <div className="flex items-center gap-4 text-sm text-text-muted">
                  <span>{api.category}</span>
                  <span>{api.discoveryCount || 0} discoveries</span>
                  {api.docsUrl && (
                    <a href={api.docsUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      Docs <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </Link>
            ))}
            {apis.length === 0 && (
              <div className="text-center py-12 rounded-xl border border-dashed border-border">
                <p className="text-text-muted mb-4">No APIs listed yet</p>
                <Link href="/providers/register" className="btn-primary">
                  <Plus className="w-5 h-5" />
                  List Your First API
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Has analytics data - show charts
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Analytics</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Calls"
          value={analytics.totalCalls.toLocaleString()}
          icon={Zap}
        />
        <StatCard
          title="Unique Agents"
          value={analytics.uniqueAgents.toString()}
          icon={Users}
        />
        <StatCard
          title="Revenue"
          value={`$${analytics.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          accent
        />
        <StatCard
          title="Listed APIs"
          value={apis.length.toString()}
          icon={TrendingUp}
        />
      </div>

      {/* Charts */}
      {analytics.callsByDay.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Line Chart - Calls Over Time */}
          <div className="lg:col-span-2 bg-surface-elevated rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-4">Calls Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.callsByDay}>
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

          {/* Top Agents */}
          <div className="bg-surface-elevated rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-4">Top Agents</h3>
            <div className="space-y-3">
              {analytics.topAgents.slice(0, 6).map((agent, i) => (
                <div key={agent.agentId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-xs font-medium text-text-muted">
                      {i + 1}
                    </span>
                    <span className="text-sm font-mono truncate max-w-[140px]">
                      {agent.agentId.replace("agent_", "")}
                    </span>
                  </div>
                  <span className="text-sm text-text-muted">{agent.calls.toLocaleString()}</span>
                </div>
              ))}
              {analytics.topAgents.length === 0 && (
                <p className="text-text-muted text-sm">No agent activity yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div className={`rounded-2xl border p-5 ${accent ? "bg-accent/10 border-accent/30" : "bg-surface-elevated border-border"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-text-muted">{title}</span>
        <Icon className={`w-5 h-5 ${accent ? "text-accent" : "text-text-muted"}`} />
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-3xl font-bold ${accent ? "text-accent" : ""}`}>{value}</span>
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

// ============================================
// APIS TAB
// ============================================

function ApisTab({ apis }: { apis: ProviderAPI[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your APIs</h2>
        <Link href="/providers/register" className="btn-primary !py-2 !px-4 text-sm">
          <Plus className="w-4 h-4" />
          Add API
        </Link>
      </div>

      {apis.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-surface/50">
          <Zap className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No APIs Listed</h3>
          <p className="text-text-muted mb-6">List your first API to make it discoverable by AI agents.</p>
          <Link href="/providers/register" className="btn-primary">
            <Plus className="w-5 h-5" />
            List Your First API
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {apis.map((api) => (
            <div key={api._id} className="rounded-2xl border border-border bg-surface-elevated p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔌</span>
                  <div>
                    <h3 className="font-semibold text-lg">{api.name}</h3>
                    <span className="text-sm text-text-muted">{api.category}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  api.status === "approved"
                    ? "bg-green-500/20 text-green-500"
                    : api.status === "pending"
                    ? "bg-yellow-500/20 text-yellow-600"
                    : "bg-gray-500/20 text-gray-500"
                }`}>
                  {api.status}
                </span>
              </div>
              <p className="text-text-secondary mb-4">{api.description}</p>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-text-muted">Pricing:</span>{" "}
                  <span className="capitalize">{api.pricingModel}</span>
                </div>
                <div>
                  <span className="text-text-muted">Discoveries:</span>{" "}
                  <span>{api.discoveryCount || 0}</span>
                </div>
                {api.docsUrl && (
                  <a
                    href={api.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline flex items-center gap-1"
                  >
                    Documentation <ExternalLink className="w-3 h-3" />
                  </a>
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
// EARNINGS TAB
// ============================================

function EarningsTab({ earnings }: { earnings: Earnings | null }) {
  const hasEarnings = earnings && (earnings.totalEarned > 0 || earnings.payouts.length > 0);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Earnings</h2>

      {/* Earnings Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-accent/10 border border-accent/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-accent" />
            <span className="text-sm text-text-muted">Pending Payout</span>
          </div>
          <p className="text-4xl font-bold text-accent">${(earnings?.pendingAmount || 0).toFixed(2)}</p>
          <p className="text-sm text-text-muted mt-2">Available for payout</p>
        </div>
        <div className="bg-surface-elevated border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-text-muted" />
            <span className="text-sm text-text-muted">Total Earned</span>
          </div>
          <p className="text-4xl font-bold">${(earnings?.totalEarned || 0).toFixed(2)}</p>
          <p className="text-sm text-text-muted mt-2">All time</p>
        </div>
        <div className="bg-surface-elevated border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-text-muted">Total Paid Out</span>
          </div>
          <p className="text-4xl font-bold">${(earnings?.totalPaidOut || 0).toFixed(2)}</p>
          <p className="text-sm text-text-muted mt-2">Successfully transferred</p>
        </div>
      </div>

      {/* Stripe Connect */}
      <div className="bg-surface-elevated border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">Payout Settings</h3>
            <p className="text-sm text-text-muted">
              Connect your Stripe account to receive payouts
            </p>
          </div>
          {earnings?.stripeOnboardingComplete ? (
            <div className="flex items-center gap-2 text-green-500">
              <Check className="w-5 h-5" />
              <span className="font-medium">Connected</span>
            </div>
          ) : (
            <button className="btn-primary !py-2 !px-4" disabled>
              <CreditCard className="w-4 h-4" />
              Coming Soon
            </button>
          )}
        </div>
      </div>

      {/* Payout History */}
      {hasEarnings && earnings.payouts.length > 0 && (
        <div className="bg-surface-elevated border border-border rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-lg">Payout History</h3>
          </div>
          <div className="divide-y divide-border">
            {earnings.payouts.map((payout) => (
              <div key={payout.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    payout.status === "completed"
                      ? "bg-green-500/20"
                      : payout.status === "processing"
                      ? "bg-yellow-500/20"
                      : "bg-blue-500/20"
                  }`}>
                    {payout.status === "completed" ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : payout.status === "processing" ? (
                      <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />
                    ) : (
                      <Clock className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">${payout.amount.toFixed(2)}</p>
                    <p className="text-sm text-text-muted">
                      {new Date(payout.periodStart).toLocaleDateString()} -{" "}
                      {new Date(payout.periodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                  payout.status === "completed"
                    ? "bg-green-500/20 text-green-500"
                    : payout.status === "processing"
                    ? "bg-yellow-500/20 text-yellow-600"
                    : "bg-blue-500/20 text-blue-500"
                }`}>
                  {payout.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasEarnings && (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-12 text-center">
          <DollarSign className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No Earnings Yet</h3>
          <p className="text-text-muted">
            When agents start using your APIs, earnings will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
