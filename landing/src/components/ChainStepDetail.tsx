"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  PauseCircle,
  SkipForward,
  Clock,
  RotateCcw,
  Zap,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

interface StepExecution {
  _id: string;
  stepId: string;
  stepIndex: number;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  input?: any;
  output?: any;
  latencyMs?: number;
  costCents?: number;
  error?: {
    code: string;
    message: string;
    retryCount?: number;
  };
  parallelGroup?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

interface ChainStepDetailProps {
  step: StepExecution;
  stepDef?: {
    id: string;
    provider: string;
    action?: string;
    params?: Record<string, any>;
  };
  isExpanded: boolean;
  onToggle: () => void;
}

export function ChainStepDetail({ step, stepDef, isExpanded, onToggle }: ChainStepDetailProps) {
  const [activeTab, setActiveTab] = useState<"input" | "output" | "error">("input");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "skipped":
        return <SkipForward className="w-4 h-4 text-gray-500" />;
      case "paused":
        return <PauseCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 border-green-500/20";
      case "running":
        return "bg-blue-500/10 border-blue-500/20";
      case "failed":
        return "bg-red-500/10 border-red-500/20";
      case "skipped":
        return "bg-gray-500/10 border-gray-500/20";
      case "paused":
        return "bg-yellow-500/10 border-yellow-500/20";
      default:
        return "bg-white/5 border-white/10";
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatCost = (cents: number) => {
    if (cents === 0) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Highlight references in input (e.g., $generate.url)
  const highlightReferences = (obj: any): any => {
    if (typeof obj === "string") {
      // Check if string contains references
      if (obj.includes("$")) {
        return obj;
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(highlightReferences);
    }
    if (typeof obj === "object" && obj !== null) {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, highlightReferences(v)])
      );
    }
    return obj;
  };

  // Render JSON with syntax highlighting
  const renderJson = (data: any, highlightRefs = false) => {
    if (!data) return <span className="text-white/40">null</span>;
    
    const jsonString = JSON.stringify(data, null, 2);
    
    if (highlightRefs) {
      // Highlight $references
      const parts = jsonString.split(/(\$[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_\[\]]+)*)/g);
      return (
        <pre className="text-xs font-mono text-white/80 whitespace-pre-wrap break-all">
          {parts.map((part, i) =>
            part.startsWith("$") ? (
              <span key={i} className="bg-[#ef4444]/20 text-[#ef4444] px-1 rounded">
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </pre>
      );
    }

    return (
      <pre className="text-xs font-mono text-white/80 whitespace-pre-wrap break-all">
        {jsonString}
      </pre>
    );
  };

  return (
    <div className={`rounded-lg border transition-all ${getStatusBg(step.status)}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronRight className="w-4 h-4 text-white/40" />
          )}
          {getStatusIcon(step.status)}
          <div className="flex items-center gap-2">
            <span className="font-medium font-mono">{step.stepId}</span>
            {stepDef && (
              <span className="text-white/40 flex items-center gap-1 text-sm">
                <ArrowRight className="w-3 h-3" />
                <span className="text-white/60">{stepDef.provider}</span>
                {stepDef.action && (
                  <>
                    <span className="text-white/20">/</span>
                    <span>{stepDef.action}</span>
                  </>
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/60">
          {step.error?.retryCount && step.error.retryCount > 0 && (
            <span className="flex items-center gap-1 text-yellow-500">
              <RotateCcw className="w-3.5 h-3.5" />
              {step.error.retryCount} retries
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(step.latencyMs || 0)}
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            {formatCost(step.costCents || 0)}
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-3 border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveTab("input")}
              className={`px-3 py-1.5 rounded-t text-sm transition-colors ${
                activeTab === "input"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Input
            </button>
            <button
              onClick={() => setActiveTab("output")}
              className={`px-3 py-1.5 rounded-t text-sm transition-colors ${
                activeTab === "output"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Output
            </button>
            {step.error && (
              <button
                onClick={() => setActiveTab("error")}
                className={`px-3 py-1.5 rounded-t text-sm transition-colors flex items-center gap-1 ${
                  activeTab === "error"
                    ? "bg-red-500/20 text-red-500"
                    : "text-red-400 hover:text-red-300"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Error
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="bg-black/30 rounded-lg p-3 max-h-64 overflow-auto">
            {activeTab === "input" && (
              <div>
                {step.input ? (
                  renderJson(step.input, true)
                ) : stepDef?.params ? (
                  renderJson(stepDef.params, true)
                ) : (
                  <span className="text-white/40 text-sm">No input data</span>
                )}
              </div>
            )}

            {activeTab === "output" && (
              <div>
                {step.output ? (
                  renderJson(step.output)
                ) : (
                  <span className="text-white/40 text-sm">
                    {step.status === "running"
                      ? "Waiting for output..."
                      : step.status === "pending"
                      ? "Step not yet executed"
                      : "No output data"}
                  </span>
                )}
              </div>
            )}

            {activeTab === "error" && step.error && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">Code:</span>
                  <code className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                    {step.error.code}
                  </code>
                </div>
                <div>
                  <span className="text-xs text-white/40">Message:</span>
                  <p className="text-sm text-red-400 mt-1">{step.error.message}</p>
                </div>
                {step.error.retryCount && step.error.retryCount > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <RotateCcw className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="text-xs text-white/60">
                      Retried {step.error.retryCount} time(s) before failing
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step Metadata */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10 text-xs text-white/40">
            <span>Index: {step.stepIndex}</span>
            {step.parallelGroup && (
              <span className="px-2 py-0.5 bg-white/10 rounded">
                Parallel: {step.parallelGroup}
              </span>
            )}
            {step.startedAt && (
              <span>Started: {new Date(step.startedAt).toLocaleTimeString()}</span>
            )}
            {step.completedAt && (
              <span>Completed: {new Date(step.completedAt).toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
