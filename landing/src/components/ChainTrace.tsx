"use client";

import { useMemo } from "react";
import { CheckCircle2, XCircle, Loader2, PauseCircle, SkipForward, Clock, DollarSign, Sparkles } from "lucide-react";

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

interface ChainTraceProps {
  chain: {
    _id: string;
    status: string;
    totalCostCents: number;
    totalLatencyMs: number;
    startedAt?: number;
    completedAt?: number;
    steps?: any[];
  };
  executions: StepExecution[];
  tokensSaved: number;
}

export function ChainTrace({ chain, executions, tokensSaved }: ChainTraceProps) {
  // Calculate timeline boundaries
  const timelineBounds = useMemo(() => {
    if (executions.length === 0) return { start: 0, end: 1000, duration: 1000 };

    const startTimes = executions
      .filter((e) => e.startedAt)
      .map((e) => e.startedAt!);
    const endTimes = executions
      .filter((e) => e.completedAt)
      .map((e) => e.completedAt!);

    const start = startTimes.length > 0 ? Math.min(...startTimes) : chain.startedAt || Date.now();
    const end = endTimes.length > 0 ? Math.max(...endTimes) : chain.completedAt || Date.now();
    const duration = Math.max(end - start, 1);

    return { start, end, duration };
  }, [executions, chain]);

  // Group parallel executions
  const groupedExecutions = useMemo(() => {
    const groups: { group: string | null; steps: StepExecution[] }[] = [];
    let currentGroup: string | null = null;
    let currentSteps: StepExecution[] = [];

    executions.forEach((exec) => {
      if (exec.parallelGroup !== currentGroup) {
        if (currentSteps.length > 0) {
          groups.push({ group: currentGroup, steps: currentSteps });
        }
        currentGroup = exec.parallelGroup || null;
        currentSteps = [exec];
      } else {
        currentSteps.push(exec);
      }
    });

    if (currentSteps.length > 0) {
      groups.push({ group: currentGroup, steps: currentSteps });
    }

    return groups;
  }, [executions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case "running":
        return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
      case "failed":
        return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      case "skipped":
        return <SkipForward className="w-3.5 h-3.5 text-gray-500" />;
      case "paused":
        return <PauseCircle className="w-3.5 h-3.5 text-yellow-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  const getBarColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "running":
        return "bg-blue-500";
      case "failed":
        return "bg-red-500";
      case "skipped":
        return "bg-gray-500";
      case "paused":
        return "bg-yellow-500";
      default:
        return "bg-gray-600";
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

  const calculateBarPosition = (step: StepExecution) => {
    const start = step.startedAt || timelineBounds.start;
    const end = step.completedAt || (step.startedAt ? step.startedAt + (step.latencyMs || 0) : timelineBounds.end);

    const left = ((start - timelineBounds.start) / timelineBounds.duration) * 100;
    const width = ((end - start) / timelineBounds.duration) * 100;

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.max(2, Math.min(100 - left, width))}%`,
    };
  };

  // Get provider info from step definition
  const getStepProvider = (stepId: string) => {
    const stepDef = chain.steps?.find((s: any) => s.id === stepId);
    return stepDef?.provider || "unknown";
  };

  return (
    <div className="bg-black/30 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Chain:</span>
          <code className="text-xs text-white/60 font-mono">{chain._id.slice(0, 16)}...</code>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/60">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Total: {formatDuration(chain.totalLatencyMs)}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 space-y-2">
        {groupedExecutions.map(({ group, steps }, groupIndex) => (
          <div key={group || groupIndex}>
            {/* Parallel group indicator */}
            {group && steps.length > 1 && (
              <div className="text-xs text-white/40 mb-1 flex items-center gap-1">
                <span className="px-1.5 py-0.5 bg-white/10 rounded">Parallel</span>
              </div>
            )}
            
            {/* Steps in group */}
            <div className={group && steps.length > 1 ? "pl-4 border-l-2 border-white/10 space-y-2" : "space-y-2"}>
              {steps.map((step) => {
                const position = calculateBarPosition(step);
                return (
                  <div key={step._id} className="flex items-center gap-3">
                    {/* Step name */}
                    <div className="w-24 flex-shrink-0 flex items-center gap-2">
                      {getStatusIcon(step.status)}
                      <span className="text-sm font-mono truncate" title={step.stepId}>
                        {step.stepId}
                      </span>
                    </div>

                    {/* Gantt bar */}
                    <div className="flex-1 h-6 bg-white/5 rounded relative overflow-hidden">
                      <div
                        className={`absolute top-0 h-full rounded ${getBarColor(step.status)}`}
                        style={{
                          left: position.left,
                          width: position.width,
                        }}
                      />
                      {/* Time markers - simplified */}
                      <div className="absolute inset-0 flex items-center px-2">
                        <span
                          className="text-xs font-mono text-white/80 drop-shadow-sm"
                          style={{
                            marginLeft: position.left,
                          }}
                        >
                          {formatDuration(step.latencyMs || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Cost */}
                    <div className="w-16 text-right text-xs text-white/60">
                      {formatCost(step.costCents || 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-white/60">
            <DollarSign className="w-3.5 h-3.5" />
            Total Cost: <span className="text-white font-medium">{formatCost(chain.totalCostCents)}</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-white/60">
          <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
          <span>Tokens Saved: <span className="text-yellow-500 font-medium">~{tokensSaved.toLocaleString()}</span></span>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-white/5 flex items-center gap-4 text-xs text-white/40">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Running</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Failed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>Paused</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-500" />
          <span>Skipped</span>
        </div>
      </div>
    </div>
  );
}
