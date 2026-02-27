"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  Loader2,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Info,
  PlayCircle,
  ChevronLeft,
  Shield,
  Zap,
  Clock,
  DollarSign,
  Globe,
  Key,
  ArrowRight,
} from "lucide-react";
import { convexQuery, convexMutation, type ProviderAPI } from "@/lib/convex-client";
import { ShareIntegrationModal } from "@/components/ShareIntegrationModal";

interface DirectCallConfig {
  _id?: string;
  apiId: string;
  baseUrl: string;
  authType: "bearer" | "basic" | "api_key" | "none";
  authHeader: string;
  authPrefix: string;
  masterApiKey: string;
  rateLimitPerUser: number;
  rateLimitPerDay: number;
  pricePerRequest: number;
  status: "draft" | "testing" | "live";
  // Customer key passthrough
  allowCustomerKeys: boolean;
  requireCustomerKeys: boolean;
}

const authTypes = [
  { value: "bearer", label: "Bearer Token", description: "Authorization: Bearer <token>" },
  { value: "basic", label: "Basic Auth", description: "Authorization: Basic <base64>" },
  { value: "api_key", label: "API Key Header", description: "Custom header with API key" },
  { value: "none", label: "No Auth", description: "Public API, no authentication" },
];

export default function DirectCallSetupPage() {
  const params = useParams();
  const router = useRouter();
  const apiId = params.apiId as string;

  const [api, setApi] = useState<ProviderAPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [wasLiveBefore, setWasLiveBefore] = useState(false);

  const [formData, setFormData] = useState<DirectCallConfig>({
    apiId,
    baseUrl: "",
    authType: "bearer",
    authHeader: "Authorization",
    authPrefix: "Bearer",
    masterApiKey: "",
    rateLimitPerUser: 60,
    rateLimitPerDay: 10000,
    pricePerRequest: 1,
    status: "draft",
    allowCustomerKeys: true,
    requireCustomerKeys: false,
  });

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

        // Load existing Direct Call config if exists
        try {
          const existingConfig = await convexQuery<DirectCallConfig | null>("directCall:getConfig", { apiId });
          if (existingConfig) {
            setFormData({
              ...existingConfig,
              masterApiKey: "", // Never show existing key, placeholder only
            });
            // Track if already live (to not show modal on re-saves)
            if (existingConfig.status === "live") {
              setWasLiveBefore(true);
            }
          }
        } catch {
          // No existing config - that's fine
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [apiId, router]);

  const validateUrl = (url: string): boolean => {
    if (!url) {
      setUrlError("Base URL is required");
      return false;
    }

    try {
      const parsed = new URL(url);
      
      // Must be HTTPS
      if (parsed.protocol !== "https:") {
        setUrlError("URL must use HTTPS");
        return false;
      }

      // Block private IP ranges
      const blockedPatterns = [
        /^127\./,
        /^10\./,
        /^192\.168\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^localhost$/i,
        /^0\.0\.0\.0$/,
      ];

      if (blockedPatterns.some((p) => p.test(parsed.hostname))) {
        setUrlError("Private/local URLs are not allowed");
        return false;
      }

      setUrlError(null);
      return true;
    } catch {
      setUrlError("Invalid URL format");
      return false;
    }
  };

  const updateField = <K extends keyof DirectCallConfig>(
    field: K,
    value: DirectCallConfig[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);

    if (field === "baseUrl") {
      validateUrl(value as string);
    }

    // Update auth prefix based on auth type
    if (field === "authType") {
      const type = value as DirectCallConfig["authType"];
      if (type === "bearer") {
        setFormData((prev) => ({ ...prev, authHeader: "Authorization", authPrefix: "Bearer" }));
      } else if (type === "basic") {
        setFormData((prev) => ({ ...prev, authHeader: "Authorization", authPrefix: "Basic" }));
      } else if (type === "api_key") {
        setFormData((prev) => ({ ...prev, authHeader: "X-API-Key", authPrefix: "" }));
      }
    }
  };

  const handleSave = async () => {
    // Validate URL
    if (!validateUrl(formData.baseUrl)) {
      return;
    }

    // Validate required fields
    if (formData.authType !== "none" && !formData.masterApiKey && !formData._id) {
      setError("Master API key is required for authenticated APIs");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("apiclaw_session");
      if (!token) {
        router.push("/providers/dashboard/login");
        return;
      }

      await convexMutation("directCall:saveConfig", {
        token,
        config: {
          apiId,
          baseUrl: formData.baseUrl,
          authType: formData.authType,
          authHeader: formData.authHeader,
          authPrefix: formData.authPrefix,
          masterApiKey: formData.masterApiKey || undefined, // Only send if changed
          rateLimitPerUser: formData.rateLimitPerUser,
          rateLimitPerDay: formData.rateLimitPerDay,
          pricePerRequest: formData.pricePerRequest,
          status: formData.status,
          allowCustomerKeys: formData.allowCustomerKeys,
          requireCustomerKeys: formData.requireCustomerKeys,
        },
      });

      setSuccess("Configuration saved successfully!");
      
      // Clear the API key field after save (it's been encrypted)
      setFormData((prev) => ({ ...prev, masterApiKey: "" }));

      // Show share modal when going live for the first time
      if (formData.status === "live" && !wasLiveBefore) {
        setShowShareModal(true);
        setWasLiveBefore(true);
      }
    } catch (err) {
      console.error("Save failed:", err);
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: "draft" | "testing" | "live") => {
    // Validate before going live
    if (newStatus === "live") {
      if (!formData.baseUrl || urlError) {
        setError("Valid base URL required before going live");
        return;
      }
      if (formData.authType !== "none" && !formData._id && !formData.masterApiKey) {
        setError("API key must be saved before going live");
        return;
      }
    }

    updateField("status", newStatus);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error && !api) {
    return (
      <div className="text-center py-24">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p className="text-text-muted mb-6">{error}</p>
        <Link href="/providers/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    const baseClasses = "flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all";
    
    switch (status) {
      case "live":
        return `${baseClasses} ${
          isActive
            ? "border-green-500 bg-green-500/20 text-green-500"
            : "border-border hover:border-green-500/50"
        }`;
      case "testing":
        return `${baseClasses} ${
          isActive
            ? "border-yellow-500 bg-yellow-500/20 text-yellow-600"
            : "border-border hover:border-yellow-500/50"
        }`;
      default:
        return `${baseClasses} ${
          isActive
            ? "border-gray-500 bg-gray-500/20 text-gray-400"
            : "border-border hover:border-gray-500/50"
        }`;
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/providers/dashboard/${apiId}`}
          className="p-2 rounded-lg hover:bg-surface transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Direct Call Setup</h1>
          <p className="text-text-muted">{api?.name}</p>
        </div>
      </div>

      {/* Status Selector */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6">
        <h2 className="font-semibold mb-4">Status</h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleStatusChange("draft")}
            className={getStatusBadge("draft", formData.status === "draft")}
          >
            <Clock className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Draft</p>
              <p className="text-xs text-text-muted">Not active</p>
            </div>
          </button>
          <button
            onClick={() => handleStatusChange("testing")}
            className={getStatusBadge("testing", formData.status === "testing")}
          >
            <PlayCircle className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Testing</p>
              <p className="text-xs text-text-muted">Test mode</p>
            </div>
          </button>
          <button
            onClick={() => handleStatusChange("live")}
            className={getStatusBadge("live", formData.status === "live")}
          >
            <Zap className="w-5 h-5" />
            <div className="text-left">
              <p className="font-medium">Live</p>
              <p className="text-xs text-text-muted">Production</p>
            </div>
          </button>
        </div>
      </div>

      {/* Base URL */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-accent" />
          <h2 className="font-semibold">Base URL</h2>
        </div>
        <div>
          <input
            type="url"
            value={formData.baseUrl}
            onChange={(e) => updateField("baseUrl", e.target.value)}
            placeholder="https://api.example.com/v1"
            className={`w-full px-4 py-3 rounded-xl bg-surface border focus:outline-none transition ${
              urlError
                ? "border-red-500 focus:border-red-500"
                : "border-border focus:border-accent"
            }`}
          />
          {urlError && (
            <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {urlError}
            </p>
          )}
          <p className="mt-2 text-xs text-text-muted">
            Must be HTTPS. This is the base URL for all API calls.
          </p>
        </div>
      </div>

      {/* Authentication */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-accent" />
          <h2 className="font-semibold">Authentication</h2>
        </div>
        
        {/* Auth Type */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Auth Type</label>
            <div className="grid grid-cols-2 gap-3">
              {authTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => updateField("authType", type.value as DirectCallConfig["authType"])}
                  className={`text-left p-3 rounded-xl border transition ${
                    formData.authType === type.value
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {formData.authType !== "none" && (
            <>
              {/* Auth Header */}
              <div>
                <label className="block text-sm font-medium mb-2">Auth Header</label>
                <input
                  type="text"
                  value={formData.authHeader}
                  onChange={(e) => updateField("authHeader", e.target.value)}
                  placeholder="Authorization"
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition"
                />
                <p className="mt-1 text-xs text-text-muted">
                  The HTTP header name for authentication
                </p>
              </div>

              {/* Master API Key */}
              <div>
                <label className="block text-sm font-medium mb-2">Master API Key</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={formData.masterApiKey}
                    onChange={(e) => updateField("masterApiKey", e.target.value)}
                    placeholder={formData._id ? "••••••••••••••••" : "Enter your API key"}
                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                  >
                    {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="mt-2 flex items-start gap-2 text-xs text-text-muted">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Your API key is encrypted with AES-256-GCM before storage. 
                    {formData._id && " Leave blank to keep the existing key."}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rate Limits */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-accent" />
          <h2 className="font-semibold">Rate Limits</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Per User (requests/min)</label>
            <input
              type="number"
              min="1"
              max="10000"
              value={formData.rateLimitPerUser}
              onChange={(e) => updateField("rateLimitPerUser", parseInt(e.target.value) || 60)}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition"
            />
            <p className="mt-1 text-xs text-text-muted">
              Max requests per minute per user
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Per Day (requests/day)</label>
            <input
              type="number"
              min="1"
              max="1000000"
              value={formData.rateLimitPerDay}
              onChange={(e) => updateField("rateLimitPerDay", parseInt(e.target.value) || 10000)}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition"
            />
            <p className="mt-1 text-xs text-text-muted">
              Max requests per day per user
            </p>
          </div>
        </div>
      </div>

      {/* Customer Authentication */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-accent" />
          <h2 className="font-semibold">Customer Authentication</h2>
        </div>
        <p className="text-sm text-text-muted mb-4">
          Control how agents authenticate with your API. By default, APIClaw uses your master key. 
          Enable customer keys to let agents pass their own API keys (useful for multi-tenant SaaS).
        </p>
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.allowCustomerKeys}
              onChange={(e) => updateField("allowCustomerKeys", e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-border text-accent focus:ring-accent"
            />
            <div>
              <span className="font-medium">Allow customer keys</span>
              <p className="text-sm text-text-muted">
                Agents can optionally pass their own API key via <code className="text-xs bg-surface px-1 rounded">customer_key</code> parameter
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.requireCustomerKeys}
              onChange={(e) => updateField("requireCustomerKeys", e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-border text-accent focus:ring-accent"
            />
            <div>
              <span className="font-medium">Require customer keys</span>
              <p className="text-sm text-text-muted">
                Agents <strong>must</strong> provide their own API key. Your master key will not be used as fallback.
                <br />
                <span className="text-accent">Recommended for multi-tenant SaaS where each customer has their own account.</span>
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-accent" />
          <h2 className="font-semibold">Pricing</h2>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Price per Request (credits)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={formData.pricePerRequest}
            onChange={(e) => updateField("pricePerRequest", parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition"
          />
          <p className="mt-1 text-xs text-text-muted">
            How many credits to charge per API call. Users buy credits from APIClaw.
          </p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-500">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3 text-green-500">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Link
          href={`/providers/dashboard/${apiId}`}
          className="btn-secondary !py-2.5"
        >
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={isSaving || !!urlError}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Configuration
            </>
          )}
        </button>
      </div>

      {/* Next Steps */}
      {formData._id && formData.status !== "live" && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
          <h3 className="font-semibold mb-3">🚀 Next Steps</h3>
          <ol className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-text-secondary">
              <span className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
              <span>
                <Link href={`/providers/dashboard/${apiId}/actions`} className="text-accent hover:underline">
                  Define your Actions
                </Link>
                {" "}— Add the endpoints agents can call
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm text-text-secondary">
              <span className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
              <span>
                <Link href={`/providers/dashboard/${apiId}/test`} className="text-accent hover:underline">
                  Test your Actions
                </Link>
                {" "}— Verify everything works before going live
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm text-text-secondary">
              <span className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
              <span>Set status to <strong>Live</strong> — Your API becomes available to all agents</span>
            </li>
          </ol>
        </div>
      )}

      {/* Share Integration Modal */}
      <ShareIntegrationModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        providerName={api?.name || ""}
        apiName={api?.name || ""}
        apiSlug={api?.name?.toLowerCase().replace(/\s+/g, "-") || apiId}
        description={api?.description}
      />
    </div>
  );
}
