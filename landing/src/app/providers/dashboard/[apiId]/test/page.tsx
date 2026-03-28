"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlayCircle,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Check,
  X,
  Clock,
  ChevronDown,
  Send,
} from "lucide-react";
import { convexQuery, convexMutation } from "@/lib/convex-client";

interface ActionParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: unknown;
  in: string;
}

interface ProviderAction {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  method: string;
  path: string;
  params: ActionParam[];
  enabled: boolean;
}

interface DirectCallConfig {
  _id: string;
  baseUrl: string;
  authType: string;
  status: string;
}

interface TestResult {
  success: boolean;
  status?: number;
  data?: Record<string, unknown> | string | null;
  error?: string;
  latencyMs: number;
}

const methodColors: Record<string, string> = {
  GET: "bg-green-500/20 text-green-500",
  POST: "bg-blue-500/20 text-blue-500",
  PUT: "bg-yellow-500/20 text-yellow-600",
  PATCH: "bg-orange-500/20 text-orange-500",
  DELETE: "bg-red-500/20 text-red-500",
};

export default function TestConsolePage() {
  const params = useParams();
  
  // Handle null params
  if (!params || !params.apiId) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  const router = useRouter();
  const apiId = params.apiId as string;

  const [config, setConfig] = useState<DirectCallConfig | null>(null);
  const [actions, setActions] = useState<ProviderAction[]>([]);
  const [selectedAction, setSelectedAction] = useState<ProviderAction | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [showActionDropdown, setShowActionDropdown] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("apiclaw_session");
      if (!token) {
        router.push("/providers/dashboard/login");
        return;
      }

      try {
        // Get direct call config
        const configData = await convexQuery<DirectCallConfig | null>(
          "directCall:getConfig",
          { apiId }
        );

        if (!configData) {
          setError("Direct Call not configured. Please set it up first.");
          setIsLoading(false);
          return;
        }
        setConfig(configData);

        // Get actions
        const actionsData = await convexQuery<ProviderAction[]>(
          "directCall:getActions",
          { directCallId: configData._id }
        );

        const enabledActions = (actionsData || []).filter((a) => a.enabled);
        setActions(enabledActions);

        if (enabledActions.length > 0) {
          handleActionSelect(enabledActions[0]);
        }
      } catch (err) {
        console.error("Failed to load test console:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [apiId, router]);

  const handleActionSelect = (action: ProviderAction) => {
    setSelectedAction(action);
    setShowActionDropdown(false);
    setResult(null);

    // Initialize param values with defaults
    const defaults: Record<string, string> = {};
    action.params.forEach((p) => {
      if (p.default !== undefined) {
        defaults[p.name] = String(p.default);
      } else {
        defaults[p.name] = "";
      }
    });
    setParamValues(defaults);
  };

  const handleTest = async () => {
    if (!selectedAction || !config) return;

    // Validate required params
    for (const param of selectedAction.params) {
      if (param.required && !paramValues[param.name]) {
        setError(`Parameter "${param.name}" is required`);
        return;
      }
    }

    setIsTesting(true);
    setError(null);
    setResult(null);

    const startTime = Date.now();

    try {
      const token = localStorage.getItem("apiclaw_session");
      
      const response = await convexMutation<{
        success: boolean;
        status?: number;
        data?: unknown;
        error?: string;
      }>("directCall:testAction", {
        token,
        directCallId: config._id,
        actionId: selectedAction._id,
        params: paramValues,
      });

      setResult({
        success: Boolean(response.success),
        status: response.status as number | undefined,
        data: response.data as Record<string, unknown> | string | null,
        error: response.error as string | undefined,
        latencyMs: Date.now() - startTime,
      });
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "Test failed",
        latencyMs: Date.now() - startTime,
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Test Console Unavailable</h1>
        <p className="text-text-muted mb-6">{error}</p>
        <Link href={`/providers/dashboard/${apiId}/direct-call`} className="btn-primary">
          Configure Direct Call
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/providers/dashboard/${apiId}`}
          className="p-2 rounded-lg hover:bg-surface transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Test Console</h1>
          <p className="text-text-muted">Test your API actions before going live</p>
        </div>
      </div>

      {/* Status Banner */}
      {config?.status === "draft" && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <p className="text-sm text-yellow-600">
            Your Direct Call is in draft mode. Set it to Testing or Live to enable actual API calls.
          </p>
        </div>
      )}

      {actions.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border">
          <PlayCircle className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Actions Defined</h2>
          <p className="text-text-muted mb-6">Create some actions to test them here.</p>
          <Link href={`/providers/dashboard/${apiId}/actions`} className="btn-primary">
            Define Actions
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Action Selection & Params */}
          <div className="space-y-6">
            {/* Action Selector */}
            <div className="rounded-2xl border border-border bg-surface-elevated p-6">
              <h2 className="font-semibold mb-4">Select Action</h2>
              <div className="relative">
                <button
                  onClick={() => setShowActionDropdown(!showActionDropdown)}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border hover:border-accent/50 transition flex items-center justify-between"
                >
                  {selectedAction ? (
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${methodColors[selectedAction.method] || "bg-gray-500/20"}`}>
                        {selectedAction.method}
                      </span>
                      <span className="font-medium">{selectedAction.displayName}</span>
                    </div>
                  ) : (
                    <span className="text-text-muted">Select an action...</span>
                  )}
                  <ChevronDown className={`w-5 h-5 text-text-muted transition ${showActionDropdown ? "rotate-180" : ""}`} />
                </button>

                {showActionDropdown && (
                  <div className="absolute z-10 w-full mt-2 py-2 rounded-xl bg-surface-elevated border border-border shadow-xl max-h-64 overflow-auto">
                    {actions.map((action) => (
                      <button
                        key={action._id}
                        onClick={() => handleActionSelect(action)}
                        className={`w-full px-4 py-3 text-left hover:bg-surface transition flex items-center gap-3 ${
                          selectedAction?._id === action._id ? "bg-accent/10" : ""
                        }`}
                      >
                        <span className={`px-2 py-1 rounded text-xs font-bold ${methodColors[action.method] || "bg-gray-500/20"}`}>
                          {action.method}
                        </span>
                        <div>
                          <p className="font-medium">{action.displayName}</p>
                          <p className="text-xs text-text-muted">{action.path}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedAction && (
                <p className="mt-3 text-sm text-text-muted">{selectedAction.description}</p>
              )}
            </div>

            {/* Parameters */}
            {selectedAction && selectedAction.params.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface-elevated p-6">
                <h2 className="font-semibold mb-4">Parameters</h2>
                <div className="space-y-4">
                  {selectedAction.params.map((param) => (
                    <div key={param.name}>
                      <label className="block text-sm font-medium mb-1">
                        {param.name}
                        {param.required && <span className="text-red-500 ml-1">*</span>}
                        <span className="text-text-muted font-normal ml-2">({param.type})</span>
                      </label>
                      <input
                        type={param.type === "number" ? "number" : "text"}
                        value={paramValues[param.name] || ""}
                        onChange={(e) =>
                          setParamValues((prev) => ({
                            ...prev,
                            [param.name]: e.target.value,
                          }))
                        }
                        placeholder={param.description}
                        className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-accent focus:outline-none transition"
                      />
                      {param.description && (
                        <p className="mt-1 text-xs text-text-muted">{param.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Button */}
            <button
              onClick={handleTest}
              disabled={!selectedAction || isTesting}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Run Test
                </>
              )}
            </button>
          </div>

          {/* Right: Results */}
          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="font-semibold mb-4">Response</h2>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-500 mb-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {!result && !error && (
              <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                <PlayCircle className="w-12 h-12 mb-4 opacity-50" />
                <p>Run a test to see results</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                    <span className={result.success ? "text-green-500" : "text-red-500"}>
                      {result.success ? "Success" : "Failed"}
                    </span>
                    {result.status && (
                      <span className="px-2 py-0.5 rounded bg-surface-elevated text-xs">
                        HTTP {result.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-text-muted">
                    <Clock className="w-4 h-4" />
                    {result.latencyMs}ms
                  </div>
                </div>

                {result.error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-sm text-red-500">{String(result.error)}</p>
                  </div>
                )}

                {/* Response Data */}
                {result.data && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Response Body</h3>
                    <pre className="p-4 rounded-lg bg-surface text-sm overflow-x-auto font-mono max-h-80 overflow-y-auto">
                      {typeof result.data === "string"
                        ? String(result.data)
                        : JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
