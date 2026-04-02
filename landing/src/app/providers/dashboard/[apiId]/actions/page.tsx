"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Settings,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  X,
  ArrowLeft,
  PlayCircle,
  FileJson,
  Download,
} from "lucide-react";
import { parseOpenAPISpec, ParsedAction } from "@/lib/openapi-parser";

interface ActionParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
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

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://adventurous-avocet-799.convex.cloud';

export default function ActionsPage() {
  const params = useParams();
  
  // Handle null params
  if (!params || !params.apiId) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  const router = useRouter();
  const apiId = params.apiId as string;
  
  const [actions, setActions] = useState<ProviderAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [directCallId, setDirectCallId] = useState<string | null>(null);
  
  // OpenAPI Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedActions, setParsedActions] = useState<ParsedAction[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const loadActions = async () => {
      const token = localStorage.getItem("apiclaw_session");
      if (!token) {
        router.push("/providers/dashboard/login");
        return;
      }

      try {
        // First get the direct call config to get directCallId
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
          setIsLoading(false);
          return;
        }
        
        setDirectCallId(configData._id);

        // Then get actions
        const actionsRes = await fetch(`${CONVEX_URL}/api/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'directCall:getActions',
            args: { directCallId: configData._id }
          })
        });
        const actionsData = await actionsRes.json();
        setActions(actionsData || []);
      } catch (err) {
        console.error("Failed to load actions:", err);
        setError(err instanceof Error ? err.message : "Failed to load actions");
      } finally {
        setIsLoading(false);
      }
    };

    loadActions();
  }, [apiId, router]);

  const deleteAction = async (actionId: string) => {
    if (!confirm("Are you sure you want to delete this action?")) return;
    
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'directCall:deleteAction',
          args: { actionId }
        })
      });
      setActions(actions.filter(a => a._id !== actionId));
    } catch (err) {
      alert("Failed to delete action");
    }
  };

  const toggleAction = async (actionId: string, enabled: boolean) => {
    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'directCall:saveAction',
          args: { 
            directCallId,
            action: { _id: actionId, enabled: !enabled }
          }
        })
      });
      setActions(actions.map(a => 
        a._id === actionId ? { ...a, enabled: !enabled } : a
      ));
    } catch (err) {
      alert("Failed to update action");
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-500/20 text-green-500';
      case 'POST': return 'bg-blue-500/20 text-blue-500';
      case 'PUT': return 'bg-yellow-500/20 text-yellow-600';
      case 'PATCH': return 'bg-orange-500/20 text-orange-500';
      case 'DELETE': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  // OpenAPI Import functions
  const handleParseOpenAPI = async () => {
    if (!importUrl) return;
    
    setIsParsing(true);
    setParseError(null);
    setParsedActions([]);
    
    const result = await parseOpenAPISpec(importUrl);
    
    if (result.success) {
      setParsedActions(result.actions);
    } else {
      setParseError(result.error || "Failed to parse OpenAPI spec");
    }
    
    setIsParsing(false);
  };

  const toggleParsedAction = (index: number) => {
    setParsedActions(prev => prev.map((a, i) => 
      i === index ? { ...a, selected: !a.selected } : a
    ));
  };

  const handleImportSelected = async () => {
    if (!directCallId) return;
    
    const selectedActions = parsedActions.filter(a => a.selected);
    if (selectedActions.length === 0) return;
    
    setIsImporting(true);
    
    try {
      // Create each action
      for (const action of selectedActions) {
        await fetch(`${CONVEX_URL}/api/mutation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'directCall:saveAction',
            args: {
              directCallId,
              name: action.name,
              displayName: action.displayName,
              description: action.description,
              method: action.method,
              path: action.path,
              params: action.params,
              responseMapping: [],
              enabled: true,
            }
          })
        });
      }
      
      // Reload actions
      const actionsRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'directCall:getActions',
          args: { directCallId }
        })
      });
      const actionsData = await actionsRes.json();
      setActions(actionsData || []);
      
      // Close modal and reset
      setShowImportModal(false);
      setImportUrl("");
      setParsedActions([]);
      
    } catch (err) {
      setParseError("Failed to import actions");
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/providers/dashboard/${apiId}`}
            className="p-2 hover:bg-surface rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Actions</h1>
            <p className="text-text-muted">Define the endpoints agents can call</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary"
          >
            <FileJson className="w-4 h-4" />
            Import from OpenAPI
          </button>
          <Link 
            href={`/providers/dashboard/${apiId}/actions/new`}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add Action
          </Link>
        </div>
      </div>

      {/* OpenAPI Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-elevated rounded-2xl border border-border max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <FileJson className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-bold">Import from OpenAPI</h2>
              </div>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportUrl("");
                  setParsedActions([]);
                  setParseError(null);
                }}
                className="p-2 hover:bg-surface rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto">
              {/* URL Input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://api.example.com/openapi.json"
                  className="flex-1 px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition"
                />
                <button
                  onClick={handleParseOpenAPI}
                  disabled={!importUrl || isParsing}
                  className="btn-primary disabled:opacity-50"
                >
                  {isParsing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Parse
                    </>
                  )}
                </button>
              </div>

              {/* Parse Error */}
              {parseError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 mb-4">
                  <AlertCircle className="w-5 h-5 inline mr-2" />
                  {parseError}
                </div>
              )}

              {/* Parsed Actions */}
              {parsedActions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-text-muted">
                      Found {parsedActions.length} endpoints. Select which to import:
                    </p>
                    <button
                      onClick={() => setParsedActions(prev => prev.map(a => ({ ...a, selected: !prev.every(p => p.selected) })))}
                      className="text-sm text-accent hover:underline"
                    >
                      {parsedActions.every(a => a.selected) ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {parsedActions.map((action, index) => (
                      <label
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          action.selected 
                            ? 'border-accent bg-accent/5' 
                            : 'border-border hover:border-accent/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={action.selected}
                          onChange={() => toggleParsedAction(index)}
                          className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                        />
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getMethodColor(action.method)}`}>
                          {action.method}
                        </span>
                        <span className="font-mono text-sm flex-1 truncate">{action.path}</span>
                        <span className="text-text-muted text-sm truncate max-w-[150px]">{action.displayName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {parsedActions.length > 0 && (
              <div className="p-6 border-t border-border flex items-center justify-between">
                <p className="text-sm text-text-muted">
                  {parsedActions.filter(a => a.selected).length} of {parsedActions.length} selected
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportSelected}
                    disabled={isImporting || parsedActions.filter(a => a.selected).length === 0}
                    className="btn-primary disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Import {parsedActions.filter(a => a.selected).length} Actions
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions List */}
      {actions.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border">
          <Settings className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No actions yet</h2>
          <p className="text-text-muted mb-6">
            Define your first action to let agents call your API
          </p>
          <Link 
            href={`/providers/dashboard/${apiId}/actions/new`}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Add First Action
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => (
            <div 
              key={action._id}
              className="rounded-xl border border-border bg-surface-elevated p-4 hover:border-accent/30 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${getMethodColor(action.method)}`}>
                    {action.method}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{action.displayName}</h3>
                      <code className="text-xs text-text-muted bg-surface px-2 py-0.5 rounded">
                        {action.name}
                      </code>
                    </div>
                    <p className="text-sm text-text-muted font-mono">{action.path}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAction(action._id, action.enabled)}
                    className={`p-2 rounded-lg transition ${
                      action.enabled 
                        ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                        : 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30'
                    }`}
                    title={action.enabled ? 'Disable' : 'Enable'}
                  >
                    {action.enabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                  <Link
                    href={`/providers/dashboard/${apiId}/actions/${action._id}/edit`}
                    className="p-2 rounded-lg hover:bg-surface transition"
                    title="Edit"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => deleteAction(action._id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-text-muted hover:text-red-500 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {action.description && (
                <p className="text-sm text-text-muted mt-2 ml-[72px]">{action.description}</p>
              )}
              {action.params.length > 0 && (
                <div className="flex items-center gap-2 mt-3 ml-[72px]">
                  <span className="text-xs text-text-muted">Params:</span>
                  {action.params.slice(0, 5).map((p, i) => (
                    <span 
                      key={i} 
                      className={`text-xs px-2 py-0.5 rounded ${
                        p.required ? 'bg-accent/20 text-accent' : 'bg-surface text-text-muted'
                      }`}
                    >
                      {p.name}
                    </span>
                  ))}
                  {action.params.length > 5 && (
                    <span className="text-xs text-text-muted">+{action.params.length - 5} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Test Console Link */}
      {actions.length > 0 && (
        <div className="flex justify-center pt-4">
          <Link
            href={`/providers/dashboard/${apiId}/test`}
            className="btn-secondary"
          >
            <PlayCircle className="w-4 h-4" />
            Test Actions
          </Link>
        </div>
      )}
    </div>
  );
}
