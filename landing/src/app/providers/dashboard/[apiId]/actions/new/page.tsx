"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Check,
} from "lucide-react";

interface ActionParam {
  name: string;
  type: "string" | "number" | "boolean" | "object";
  required: boolean;
  description: string;
  in: "body" | "query" | "path";
}

interface ResponseMapping {
  name: string;
  path: string;
}

interface ActionFormData {
  name: string;
  displayName: string;
  description: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  params: ActionParam[];
  responseMapping: ResponseMapping[];
  enabled: boolean;
}

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://adventurous-avocet-799.convex.site';

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
const PARAM_TYPES = ["string", "number", "boolean", "object"] as const;
const PARAM_LOCATIONS = ["body", "query", "path"] as const;

export default function NewActionPage() {
  const params = useParams();
  const router = useRouter();
  const apiId = params.apiId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [directCallId, setDirectCallId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ActionFormData>({
    name: "",
    displayName: "",
    description: "",
    method: "GET",
    path: "",
    params: [],
    responseMapping: [],
    enabled: true,
  });

  useEffect(() => {
    const loadDirectCallConfig = async () => {
      const token = localStorage.getItem("apiclaw_session");
      if (!token) {
        router.push("/providers/dashboard/login");
        return;
      }

      try {
        const configRes = await fetch(`${CONVEX_URL}/api/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'directCall:getDirectCallConfigByApiId',
            args: { apiId }
          })
        });
        const configData = await configRes.json();

        if (!configData || !configData._id) {
          setError("Direct Call not configured. Please set up Direct Call first.");
          return;
        }

        setDirectCallId(configData._id);
      } catch (err) {
        console.error("Failed to load config:", err);
        setError(err instanceof Error ? err.message : "Failed to load configuration");
      } finally {
        setIsLoading(false);
      }
    };

    loadDirectCallConfig();
  }, [apiId, router]);

  const updateField = <K extends keyof ActionFormData>(
    field: K,
    value: ActionFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const generateSlug = (displayName: string) => {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleDisplayNameChange = (value: string) => {
    updateField("displayName", value);
    // Auto-generate slug if name is empty or was auto-generated
    if (!formData.name || formData.name === generateSlug(formData.displayName)) {
      updateField("name", generateSlug(value));
    }
  };

  // Param management
  const addParam = () => {
    setFormData((prev) => ({
      ...prev,
      params: [
        ...prev.params,
        { name: "", type: "string", required: false, description: "", in: "body" }
      ]
    }));
  };

  const updateParam = (index: number, field: keyof ActionParam, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      params: prev.params.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const removeParam = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      params: prev.params.filter((_, i) => i !== index)
    }));
  };

  // Response mapping management
  const addResponseMapping = () => {
    setFormData((prev) => ({
      ...prev,
      responseMapping: [
        ...prev.responseMapping,
        { name: "", path: "" }
      ]
    }));
  };

  const updateResponseMapping = (index: number, field: keyof ResponseMapping, value: string) => {
    setFormData((prev) => ({
      ...prev,
      responseMapping: prev.responseMapping.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      )
    }));
  };

  const removeResponseMapping = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      responseMapping: prev.responseMapping.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError("Action name is required");
      return;
    }
    if (!formData.displayName.trim()) {
      setError("Display name is required");
      return;
    }
    if (!formData.path.trim()) {
      setError("Path is required");
      return;
    }
    if (!directCallId) {
      setError("Direct Call configuration not found");
      return;
    }

    // Validate params have names
    const invalidParams = formData.params.filter(p => !p.name.trim());
    if (invalidParams.length > 0) {
      setError("All parameters must have a name");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'directCall:saveAction',
          args: {
            directCallId,
            action: {
              name: formData.name,
              displayName: formData.displayName,
              description: formData.description,
              method: formData.method,
              path: formData.path,
              params: formData.params,
              responseMapping: formData.responseMapping,
              enabled: formData.enabled,
            }
          }
        })
      });

      setSuccess("Action created successfully!");
      setTimeout(() => {
        router.push(`/providers/dashboard/${apiId}/actions`);
      }, 1000);
    } catch (err) {
      console.error("Save failed:", err);
      setError(err instanceof Error ? err.message : "Failed to save action");
    } finally {
      setIsSaving(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'border-green-500 bg-green-500/20 text-green-500';
      case 'POST': return 'border-blue-500 bg-blue-500/20 text-blue-500';
      case 'PUT': return 'border-yellow-500 bg-yellow-500/20 text-yellow-600';
      case 'PATCH': return 'border-orange-500 bg-orange-500/20 text-orange-500';
      case 'DELETE': return 'border-red-500 bg-red-500/20 text-red-500';
      default: return 'border-gray-500 bg-gray-500/20 text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error && !directCallId) {
    return (
      <div className="text-center py-24">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Setup Required</h1>
        <p className="text-text-muted mb-6">{error}</p>
        <Link href={`/providers/dashboard/${apiId}/direct-call`} className="btn-primary">
          Set Up Direct Call
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/providers/dashboard/${apiId}/actions`}
          className="p-2 rounded-lg hover:bg-surface transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Action</h1>
          <p className="text-text-muted">Define a new endpoint for agents to call</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-4">
        <h2 className="font-semibold">Basic Information</h2>

        <div>
          <label className="block text-sm font-medium mb-2">Display Name *</label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => handleDisplayNameChange(e.target.value)}
            placeholder="Create Invoice"
            className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition"
          />
          <p className="mt-1 text-xs text-text-muted">Human-readable name shown to users</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Action Name (slug) *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="create-invoice"
            className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition font-mono"
          />
          <p className="mt-1 text-xs text-text-muted">Unique identifier used in API calls</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Creates a new invoice in the system..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="enabled"
            checked={formData.enabled}
            onChange={(e) => updateField("enabled", e.target.checked)}
            className="w-5 h-5 rounded border-border text-accent focus:ring-accent"
          />
          <label htmlFor="enabled" className="text-sm font-medium">
            Enabled (agents can call this action)
          </label>
        </div>
      </div>

      {/* Endpoint */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-4">
        <h2 className="font-semibold">Endpoint</h2>

        <div>
          <label className="block text-sm font-medium mb-2">HTTP Method *</label>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((method) => (
              <button
                key={method}
                onClick={() => updateField("method", method)}
                className={`px-4 py-2 rounded-lg border transition font-bold text-sm ${
                  formData.method === method
                    ? getMethodColor(method)
                    : 'border-border hover:border-accent/50'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Path *</label>
          <input
            type="text"
            value={formData.path}
            onChange={(e) => updateField("path", e.target.value)}
            placeholder="/invoices or /invoices/{id}"
            className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition font-mono"
          />
          <p className="mt-1 text-xs text-text-muted">
            Use {"{param}"} for path parameters, e.g. /users/{"{id}"}/orders
          </p>
        </div>
      </div>

      {/* Parameters */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Parameters</h2>
          <button
            onClick={addParam}
            className="btn-secondary !py-2 !px-3 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Parameter
          </button>
        </div>

        {formData.params.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">
            No parameters defined. Click "Add Parameter" to add one.
          </p>
        ) : (
          <div className="space-y-4">
            {formData.params.map((param, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-surface border border-border space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Name *</label>
                      <input
                        type="text"
                        value={param.name}
                        onChange={(e) => updateParam(index, "name", e.target.value)}
                        placeholder="customer_id"
                        className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border focus:border-accent focus:outline-none transition text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Type</label>
                      <select
                        value={param.type}
                        onChange={(e) => updateParam(index, "type", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border focus:border-accent focus:outline-none transition text-sm"
                      >
                        {PARAM_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Location</label>
                      <select
                        value={param.in}
                        onChange={(e) => updateParam(index, "in", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border focus:border-accent focus:outline-none transition text-sm"
                      >
                        {PARAM_LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={param.required}
                          onChange={(e) => updateParam(index, "required", e.target.checked)}
                          className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                        />
                        Required
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() => removeParam(index)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-text-muted hover:text-red-500 transition mt-5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={param.description}
                    onChange={(e) => updateParam(index, "description", e.target.value)}
                    placeholder="The unique identifier of the customer"
                    className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border focus:border-accent focus:outline-none transition text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response Mapping */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Response Mapping</h2>
            <p className="text-xs text-text-muted mt-1">Extract specific fields from the API response</p>
          </div>
          <button
            onClick={addResponseMapping}
            className="btn-secondary !py-2 !px-3 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Mapping
          </button>
        </div>

        {formData.responseMapping.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">
            No response mappings defined. The full response will be returned.
          </p>
        ) : (
          <div className="space-y-3">
            {formData.responseMapping.map((mapping, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border"
              >
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Field Name</label>
                    <input
                      type="text"
                      value={mapping.name}
                      onChange={(e) => updateResponseMapping(index, "name", e.target.value)}
                      placeholder="invoiceId"
                      className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border focus:border-accent focus:outline-none transition text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">JSONPath</label>
                    <input
                      type="text"
                      value={mapping.path}
                      onChange={(e) => updateResponseMapping(index, "path", e.target.value)}
                      placeholder="$.data.id"
                      className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border focus:border-accent focus:outline-none transition text-sm font-mono"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeResponseMapping(index)}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-text-muted hover:text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
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
          href={`/providers/dashboard/${apiId}/actions`}
          className="btn-secondary !py-2.5"
        >
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Create Action
            </>
          )}
        </button>
      </div>
    </div>
  );
}
