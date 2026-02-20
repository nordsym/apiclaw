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
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Pause,
  Play,
  ExternalLink,
  ChevronRight,
  Check,
  Clock,
  AlertCircle,
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
import {
  getMockProvider,
  getMockApis,
  getMockAnalytics,
  getMockEarnings,
  getMockCredentials,
  type Api,
} from "@/lib/mock-data";

type TabType = "overview" | "apis" | "earnings";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

export function ProviderDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [period, setPeriod] = useState<"week" | "month" | "all">("month");
  const [selectedApi, setSelectedApi] = useState<string | null>(null);

  const provider = getMockProvider();
  const apis = getMockApis();
  const analytics = getMockAnalytics();
  const earnings = getMockEarnings();

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: BarChart3 },
    { id: "apis" as TabType, label: "APIs", icon: Zap },
    { id: "earnings" as TabType, label: "Earnings", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-xl">
              🦞
            </div>
            <div>
              <h1 className="font-bold text-lg">Provider Dashboard</h1>
              <p className="text-sm text-text-muted">{provider.company || provider.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-surface transition">
              <Settings className="w-5 h-5 text-text-muted" />
            </button>
            <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-sm font-medium">
              {provider.name.charAt(0).toUpperCase()}
            </div>
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
          <OverviewTab
            analytics={analytics}
            period={period}
            setPeriod={setPeriod}
          />
        )}
        {activeTab === "apis" && (
          <ApisTab
            apis={apis}
            selectedApi={selectedApi}
            setSelectedApi={setSelectedApi}
          />
        )}
        {activeTab === "earnings" && <EarningsTab earnings={earnings} />}
      </div>
    </div>
  );
}

// ============================================
// OVERVIEW TAB
// ============================================

function OverviewTab({
  analytics,
  period,
  setPeriod,
}: {
  analytics: ReturnType<typeof getMockAnalytics>;
  period: "week" | "month" | "all";
  setPeriod: (p: "week" | "month" | "all") => void;
}) {
  const periodData = {
    week: {
      calls: analytics.totalCallsWeek,
      revenue: analytics.revenueWeek,
      chartData: analytics.callsByDay.slice(-7),
    },
    month: {
      calls: analytics.totalCallsMonth,
      revenue: analytics.revenueMonth,
      chartData: analytics.callsByDay.slice(-30),
    },
    all: {
      calls: analytics.totalCalls,
      revenue: analytics.totalRevenue,
      chartData: analytics.callsByDay,
    },
  }[period];

  // Calculate growth
  const prevPeriodCalls =
    period === "week"
      ? analytics.callsByDay.slice(-14, -7).reduce((s, d) => s + d.calls, 0)
      : period === "month"
      ? analytics.callsByDay.slice(-60, -30).reduce((s, d) => s + d.calls, 0)
      : 0;
  const callsGrowth =
    prevPeriodCalls > 0
      ? ((periodData.calls - prevPeriodCalls) / prevPeriodCalls) * 100
      : 0;

  return (
    <div className="space-y-8">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <div className="flex items-center gap-1 p-1 bg-surface rounded-lg">
          {(["week", "month", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                period === p
                  ? "bg-surface-elevated text-text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {p === "week" ? "7 days" : p === "month" ? "30 days" : "All time"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Calls"
          value={periodData.calls.toLocaleString()}
          change={callsGrowth}
          icon={Zap}
        />
        <StatCard
          title="Unique Agents"
          value={analytics.uniqueAgents.toString()}
          icon={Users}
        />
        <StatCard
          title="Revenue"
          value={`$${periodData.revenue.toFixed(2)}`}
          icon={DollarSign}
          accent
        />
        <StatCard
          title="Avg Calls/Day"
          value={Math.round(periodData.calls / periodData.chartData.length).toString()}
          icon={TrendingUp}
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Line Chart - Calls Over Time */}
        <div className="lg:col-span-2 bg-surface-elevated rounded-2xl border border-border p-6">
          <h3 className="font-semibold mb-4">Calls Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={periodData.chartData}>
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
          </div>
        </div>
      </div>

      {/* Second Row - Bar Chart & Pie Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calls per API */}
        <div className="bg-surface-elevated rounded-2xl border border-border p-6">
          <h3 className="font-semibold mb-4">Calls per API</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.apis} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="calls" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-surface-elevated rounded-2xl border border-border p-6">
          <h3 className="font-semibold mb-4">Geographic Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(analytics.callsByRegion).map(([name, value]) => ({
                    name,
                    value,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {Object.keys(analytics.callsByRegion).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {Object.entries(analytics.callsByRegion).map(([region, calls], i) => (
              <div key={region} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-sm text-text-muted">
                  {region}: {calls.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
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

function ApisTab({
  apis,
  selectedApi,
  setSelectedApi,
}: {
  apis: Api[];
  selectedApi: string | null;
  setSelectedApi: (id: string | null) => void;
}) {
  const selected = apis.find((a) => a.id === selectedApi);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your APIs</h2>
        <button className="btn-primary !py-2 !px-4 text-sm">
          <Zap className="w-4 h-4" />
          Add API
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* API List */}
        <div className="lg:col-span-1 space-y-3">
          {apis.map((api) => (
            <button
              key={api.id}
              onClick={() => setSelectedApi(api.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all ${
                selectedApi === api.id
                  ? "bg-accent/10 border-accent"
                  : "bg-surface-elevated border-border hover:border-accent/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{api.icon}</span>
                  <span className="font-semibold">{api.name}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    api.status === "active"
                      ? "bg-green-500/20 text-green-500"
                      : "bg-yellow-500/20 text-yellow-600"
                  }`}
                >
                  {api.status}
                </span>
              </div>
              <p className="text-sm text-text-muted line-clamp-2">{api.description}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-text-muted">
                <span>{api.calls.toLocaleString()} calls</span>
                <span>{api.category}</span>
              </div>
            </button>
          ))}
        </div>

        {/* API Details */}
        <div className="lg:col-span-2">
          {selected ? (
            <ApiDetails api={selected} />
          ) : (
            <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 p-12">
              <p className="text-text-muted">Select an API to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ApiDetails({ api }: { api: Api }) {
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const credentials = getMockCredentials(api.id);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-surface-elevated rounded-2xl border border-border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{api.icon}</span>
            <div>
              <h3 className="text-xl font-bold">{api.name}</h3>
              <p className="text-sm text-text-muted">{api.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary !py-2 !px-3 text-sm">
              {api.status === "active" ? (
                <>
                  <Pause className="w-4 h-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Resume
                </>
              )}
            </button>
            <button className="btn-secondary !py-2 !px-3 text-sm">
              <Settings className="w-4 h-4" /> Edit
            </button>
          </div>
        </div>
        <p className="text-text-secondary">{api.description}</p>
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-6 p-6 border-b border-border">
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-text-muted uppercase tracking-wider">Configuration</h4>
          <div className="space-y-3">
            <DetailRow label="Base URL" value={api.baseUrl} mono />
            <DetailRow
              label="Documentation"
              value={
                api.docsUrl ? (
                  <a href={api.docsUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1">
                    View Docs <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  "Not set"
                )
              }
            />
            <DetailRow label="Auth Type" value={api.authType} />
            <DetailRow label="Rate Limit" value={`${api.rateLimitPerMinute || "∞"}/min`} />
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-text-muted uppercase tracking-wider">Pricing</h4>
          <div className="space-y-3">
            <DetailRow label="Model" value={api.pricingModel} />
            {api.pricePerCall && (
              <DetailRow
                label="Price per call"
                value={`$${(api.pricePerCall / 100).toFixed(4)}`}
              />
            )}
            <DetailRow
              label="Regions"
              value={api.regions?.join(", ") || "Global"}
            />
            <DetailRow
              label="Tags"
              value={
                <div className="flex flex-wrap gap-1">
                  {api.tags?.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-surface rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              }
            />
          </div>
        </div>
      </div>

      {/* Credentials */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-sm text-text-muted uppercase tracking-wider">Credentials</h4>
          <button className="text-sm text-accent hover:underline flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> Regenerate
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
            <div>
              <p className="text-sm text-text-muted mb-1">API Key</p>
              <p className="font-mono text-sm">{credentials.apiKey}</p>
            </div>
            <button
              onClick={() => copyToClipboard(credentials.apiKey, "api")}
              className="p-2 hover:bg-surface-elevated rounded-lg transition"
            >
              {copied === "api" ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-text-muted" />
              )}
            </button>
          </div>
          {credentials.secretKey && (
            <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
              <div>
                <p className="text-sm text-text-muted mb-1">Secret Key</p>
                <p className="font-mono text-sm">
                  {showSecret ? credentials.secretKey : "sk_live_••••••••••••••••••••••••"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="p-2 hover:bg-surface-elevated rounded-lg transition"
                >
                  {showSecret ? (
                    <EyeOff className="w-4 h-4 text-text-muted" />
                  ) : (
                    <Eye className="w-4 h-4 text-text-muted" />
                  )}
                </button>
                <button
                  onClick={() => copyToClipboard(credentials.secretKey!, "secret")}
                  className="p-2 hover:bg-surface-elevated rounded-lg transition"
                >
                  {copied === "secret" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-text-muted" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

// ============================================
// EARNINGS TAB
// ============================================

function EarningsTab({ earnings }: { earnings: ReturnType<typeof getMockEarnings> }) {
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
          <p className="text-4xl font-bold text-accent">${earnings.pendingAmount.toFixed(2)}</p>
          <p className="text-sm text-text-muted mt-2">Available for payout</p>
        </div>
        <div className="bg-surface-elevated border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-text-muted" />
            <span className="text-sm text-text-muted">Total Earned</span>
          </div>
          <p className="text-4xl font-bold">${earnings.totalEarned.toFixed(2)}</p>
          <p className="text-sm text-text-muted mt-2">All time</p>
        </div>
        <div className="bg-surface-elevated border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-text-muted">Total Paid Out</span>
          </div>
          <p className="text-4xl font-bold">${earnings.totalPaidOut.toFixed(2)}</p>
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
          {earnings.stripeOnboardingComplete ? (
            <div className="flex items-center gap-2 text-green-500">
              <Check className="w-5 h-5" />
              <span className="font-medium">Connected</span>
            </div>
          ) : (
            <button className="btn-primary !py-2 !px-4">
              <CreditCard className="w-4 h-4" />
              Connect Stripe
            </button>
          )}
        </div>
        {earnings.stripeOnboardingComplete && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#635BFF]/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#635BFF]" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Stripe Connect</p>
                <p className="text-sm text-text-muted">Account verified and ready for payouts</p>
              </div>
            </div>
            <button className="text-sm text-accent hover:underline flex items-center gap-1">
              Manage <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Payout History */}
      <div className="bg-surface-elevated border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-lg">Payout History</h3>
        </div>
        {earnings.payouts.length > 0 ? (
          <div className="divide-y divide-border">
            {earnings.payouts.map((payout) => (
              <div key={payout.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      payout.status === "completed"
                        ? "bg-green-500/20"
                        : payout.status === "processing"
                        ? "bg-yellow-500/20"
                        : payout.status === "pending"
                        ? "bg-blue-500/20"
                        : "bg-red-500/20"
                    }`}
                  >
                    {payout.status === "completed" ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : payout.status === "processing" ? (
                      <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />
                    ) : payout.status === "pending" ? (
                      <Clock className="w-5 h-5 text-blue-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
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
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      payout.status === "completed"
                        ? "bg-green-500/20 text-green-500"
                        : payout.status === "processing"
                        ? "bg-yellow-500/20 text-yellow-600"
                        : payout.status === "pending"
                        ? "bg-blue-500/20 text-blue-500"
                        : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {payout.status}
                  </span>
                  {payout.completedAt && (
                    <p className="text-xs text-text-muted mt-1">
                      {new Date(payout.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-text-muted">
            <p>No payouts yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
