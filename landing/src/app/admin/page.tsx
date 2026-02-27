"use client";

import { useState, useEffect } from "react";
import { Shield, Users, Zap, TrendingUp, Check, X, Clock, ExternalLink, RefreshCw, Eye } from "lucide-react";
import Link from "next/link";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";

interface Stats {
  totalProviders: number;
  approvedProviders: number;
  pendingProviders: number;
  totalAPIs: number;
  approvedAPIs: number;
  pendingAPIs: number;
  totalDiscoveries: number;
}

interface Provider {
  _id: string;
  name: string;
  email: string;
  company?: string;
  website?: string;
  status: string;
  createdAt: number;
  approvedAt?: number;
}

interface ProviderAPI {
  _id: string;
  providerId: string;
  name: string;
  description: string;
  category: string;
  status: string;
  pricingModel: string;
  discoveryCount?: number;
  createdAt: number;
}

// Simple admin password check (set via env or hardcode for MVP)
const ADMIN_PASSWORD = "nordsym2026";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [apis, setApis] = useState<ProviderAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  useEffect(() => {
    // Check if already authenticated this session
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
    } else {
      alert("Invalid password");
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load stats
      const statsRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "providers:getProviderStats", args: {} }),
      });
      const statsData = await statsRes.json();
      setStats(statsData);

      // Load all providers (using a simple query)
      const providersRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "providers:getAllProviders", args: {} }),
      });
      const providersData = await providersRes.json();
      setProviders(providersData || []);

      // Load all APIs
      const apisRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "providers:getAllAPIs", args: {} }),
      });
      const apisData = await apisRes.json();
      setApis(apisData || []);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-accent mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Admin Access</h1>
            <p className="text-text-muted">Enter password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none"
            />
            <button type="submit" className="btn-primary w-full justify-center">
              Access Admin Panel
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-12 h-12 text-accent animate-spin" />
      </main>
    );
  }

  const providerAPIs = selectedProvider
    ? apis.filter((a) => a.providerId === selectedProvider)
    : [];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-xl">
              🦞
            </Link>
            <div>
              <h1 className="font-bold text-lg">APIClaw Admin</h1>
              <p className="text-sm text-text-muted">Provider Management</p>
            </div>
          </div>
          <button onClick={loadData} className="btn-secondary !py-2 !px-4 text-sm">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Users}
              label="Providers"
              value={stats.totalProviders}
              subValue={`${stats.approvedProviders} approved`}
            />
            <StatCard
              icon={Zap}
              label="APIs"
              value={stats.totalAPIs}
              subValue={`${stats.approvedAPIs} approved`}
            />
            <StatCard
              icon={TrendingUp}
              label="Discoveries"
              value={stats.totalDiscoveries}
            />
            <StatCard
              icon={Clock}
              label="Pending"
              value={stats.pendingProviders + stats.pendingAPIs}
              subValue="need review"
              accent
            />
          </div>
        )}

        {/* Providers Table */}
        <div className="bg-surface-elevated rounded-2xl border border-border overflow-hidden mb-8">
          <div className="p-6 border-b border-border">
            <h2 className="font-bold text-lg">All Providers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Provider</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Email</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">APIs</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Registered</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {providers.map((provider) => {
                  const apiCount = apis.filter((a) => a.providerId === provider._id).length;
                  return (
                    <tr key={provider._id} className="hover:bg-surface/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          {provider.company && (
                            <p className="text-sm text-text-muted">{provider.company}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{provider.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          provider.status === "approved"
                            ? "bg-green-500/20 text-green-500"
                            : provider.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-red-500/20 text-red-500"
                        }`}>
                          {provider.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{apiCount}</td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {new Date(provider.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedProvider(
                            selectedProvider === provider._id ? null : provider._id
                          )}
                          className="p-2 rounded-lg hover:bg-surface transition"
                          title="View APIs"
                        >
                          <Eye className="w-4 h-4 text-text-muted" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {providers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                      No providers registered yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Provider APIs */}
        {selectedProvider && (
          <div className="bg-surface-elevated rounded-2xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-lg">
                APIs for {providers.find((p) => p._id === selectedProvider)?.name}
              </h2>
              <button
                onClick={() => setSelectedProvider(null)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {providerAPIs.map((api) => (
                <div key={api._id} className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{api.name}</h3>
                      <p className="text-sm text-text-muted">{api.category} • {api.pricingModel}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      api.status === "approved"
                        ? "bg-green-500/20 text-green-500"
                        : "bg-yellow-500/20 text-yellow-600"
                    }`}>
                      {api.status}
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm mb-3">{api.description}</p>
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span>{api.discoveryCount || 0} discoveries</span>
                    <span>Created {new Date(api.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {providerAPIs.length === 0 && (
                <div className="p-12 text-center text-text-muted">
                  No APIs listed for this provider
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  subValue?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "bg-accent/10 border-accent/30" : "bg-surface-elevated border-border"}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${accent ? "text-accent" : "text-text-muted"}`} />
        <span className="text-sm text-text-muted">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${accent ? "text-accent" : ""}`}>{value}</p>
      {subValue && <p className="text-xs text-text-muted mt-1">{subValue}</p>}
    </div>
  );
}
