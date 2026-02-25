"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  PlayCircle,
  Settings,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Users,
  Clock,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  BarChart3,
  Globe,
} from "lucide-react";
import { convexQuery, type ProviderAPI } from "@/lib/convex-client";

interface DirectCallConfig {
  _id: string;
  status: "draft" | "testing" | "live";
  baseUrl?: string;
  authType?: string;
  rateLimitPerUser?: number;
  pricePerRequest?: number;
}

export default function ApiOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const apiId = params.apiId as string;
  
  const [api, setApi] = useState<ProviderAPI | null>(null);
  const [directCallConfig, setDirectCallConfig] = useState<DirectCallConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("apiclaw_session");
      if (!token) {
        router.push("/providers/dashboard/login");
        return;
      }

      try {
        // Load API details
        const apiData = await convexQuery<ProviderAPI | null>("providers:getApiById", { apiId });
        if (!apiData) {
          setError("API not found");
          return;
        }
        setApi(apiData);

        // Load Direct Call config if exists
        try {
          const dcConfig = await convexQuery<DirectCallConfig | null>("directCall:getConfig", { apiId });
          setDirectCallConfig(dcConfig);
        } catch {
          // Direct Call not configured yet - that's fine
        }
      } catch (err) {
        console.error("Failed to load API:", err);
        setError(err instanceof Error ? err.message : "Failed to load API");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [apiId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error || !api) {
    return (
      <div className="text-center py-24">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">API Not Found</h1>
        <p className="text-text-muted mb-6">{error || "The requested API could not be found."}</p>
        <Link href="/providers/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        );
      case "testing":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-600">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Testing
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-500/20 text-gray-500">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-3xl">
            🔌
          </div>
          <div>
            <h1 className="text-2xl font-bold">{api.name}</h1>
            <div className="flex items-center gap-3 text-sm text-text-muted">
              <span>{api.category}</span>
              <span>•</span>
              <span className={`capitalize ${
                api.status === "approved" ? "text-green-500" : "text-yellow-600"
              }`}>
                {api.status}
              </span>
            </div>
          </div>
        </div>
        {api.docsUrl && (
          <a
            href={api.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary !py-2 !px-4 text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            View Docs
          </a>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-surface-elevated p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted">Discoveries</span>
          </div>
          <p className="text-2xl font-bold">{api.discoveryCount || 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted">Pricing</span>
          </div>
          <p className="text-xl font-bold capitalize">{api.pricingModel}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted">Listed</span>
          </div>
          <p className="text-lg font-medium">
            {new Date(api.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated p-4">
          <div className="flex items-center gap-2 mb-2">
            <PlayCircle className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-muted">Direct Call</span>
          </div>
          {directCallConfig ? (
            getStatusBadge(directCallConfig.status)
          ) : (
            <span className="text-sm text-text-muted">Not configured</span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6">
        <h2 className="font-semibold mb-3">Description</h2>
        <p className="text-text-secondary">{api.description}</p>
        {api.pricingNotes && (
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-text-muted mb-2">Pricing Notes</h3>
            <p className="text-text-secondary text-sm">{api.pricingNotes}</p>
          </div>
        )}
      </div>

      {/* Direct Call Setup Card */}
      <div className={`rounded-2xl border p-6 ${
        directCallConfig?.status === "live"
          ? "border-green-500/30 bg-green-500/5"
          : directCallConfig
          ? "border-yellow-500/30 bg-yellow-500/5"
          : "border-accent/30 bg-accent/5"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              directCallConfig?.status === "live"
                ? "bg-green-500/20"
                : directCallConfig
                ? "bg-yellow-500/20"
                : "bg-accent/20"
            }`}>
              <PlayCircle className={`w-6 h-6 ${
                directCallConfig?.status === "live"
                  ? "text-green-500"
                  : directCallConfig
                  ? "text-yellow-600"
                  : "text-accent"
              }`} />
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-1">Direct Call Setup</h2>
              {directCallConfig ? (
                <>
                  <p className="text-text-secondary text-sm mb-2">
                    {directCallConfig.status === "live"
                      ? "Your API is live and accepting calls through APIClaw."
                      : directCallConfig.status === "testing"
                      ? "Your Direct Call setup is in testing mode."
                      : "Complete your Direct Call configuration to go live."
                    }
                  </p>
                  {directCallConfig.baseUrl && (
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Globe className="w-4 h-4" />
                      <span className="font-mono">{directCallConfig.baseUrl}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-text-secondary text-sm">
                  Enable Direct Call to let agents use your API directly through APIClaw with unified billing.
                </p>
              )}
            </div>
          </div>
          <Link
            href={`/providers/dashboard/${apiId}/direct-call`}
            className={`btn-primary !py-2.5 !px-5 whitespace-nowrap ${
              directCallConfig?.status === "live" ? "!bg-green-600 hover:!bg-green-700" : ""
            }`}
          >
            {directCallConfig ? (
              <>
                <Settings className="w-4 h-4" />
                Configure
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Set Up Direct Call
              </>
            )}
          </Link>
        </div>

        {/* Quick config summary */}
        {directCallConfig && (directCallConfig.rateLimitPerUser || directCallConfig.pricePerRequest) && (
          <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-text-muted mb-1">Auth Type</p>
              <p className="text-sm font-medium capitalize">{directCallConfig.authType || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Rate Limit/User</p>
              <p className="text-sm font-medium">{directCallConfig.rateLimitPerUser || "Unlimited"}/min</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Price/Request</p>
              <p className="text-sm font-medium">{directCallConfig.pricePerRequest || 0} credits</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Status</p>
              {getStatusBadge(directCallConfig.status)}
            </div>
          </div>
        )}
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href={`/providers/dashboard/${apiId}/actions`}
          className="group rounded-2xl border border-border bg-surface-elevated p-6 hover:border-accent/50 transition"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center">
              <Settings className="w-6 h-6 text-text-muted group-hover:text-accent transition" />
            </div>
            <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold mb-1">Actions</h3>
          <p className="text-sm text-text-muted">
            Define the endpoints and methods agents can call.
          </p>
        </Link>

        <Link
          href={`/providers/dashboard/${apiId}/test`}
          className="group rounded-2xl border border-border bg-surface-elevated p-6 hover:border-accent/50 transition"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-text-muted group-hover:text-accent transition" />
            </div>
            <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold mb-1">Test Console</h3>
          <p className="text-sm text-text-muted">
            Test your API actions before going live.
          </p>
        </Link>
      </div>

      {/* Technical Details */}
      {(api.openApiUrl || api.docsUrl) && (
        <div className="rounded-2xl border border-border bg-surface-elevated p-6">
          <h2 className="font-semibold mb-4">Technical Details</h2>
          <div className="space-y-3">
            {api.openApiUrl && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-text-muted" />
                  <span className="text-sm">OpenAPI Spec</span>
                </div>
                <a
                  href={api.openApiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline text-sm flex items-center gap-1"
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {api.docsUrl && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-5 h-5 text-text-muted" />
                  <span className="text-sm">Documentation</span>
                </div>
                <a
                  href={api.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline text-sm flex items-center gap-1"
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
