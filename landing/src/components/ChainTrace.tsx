"use client";

import { useMemo } from "react";
import { KV, Status } from "@/app/workspace/views/ui";

export interface StepExecution {
  _id: string;
  stepId: string;
  stepIndex: number;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  input?: unknown;
  output?: unknown;
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
    steps?: Array<{ id?: string; provider?: string }>;
  };
  executions: StepExecution[];
  tokensSaved: number;
}

export const formatDuration = (ms: number) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`);
export const formatCost = (cents: number) => (cents === 0 ? "$0.00" : `$${(cents / 100).toFixed(2)}`);

export function statusKind(status: string): "ok" | "warn" | "bad" | "muted" {
  if (status === "completed") return "ok";
  if (status === "failed") return "bad";
  if (status === "paused" || status === "running") return "warn";
  return "muted";
}

const barColor = (status: string) => {
  if (status === "completed") return "var(--ok)";
  if (status === "failed") return "var(--accent)";
  if (status === "running" || status === "paused") return "#e5b454";
  return "var(--text-muted)";
};

/** Timeline of step executions for one chain. */
export function ChainTrace({ chain, executions, tokensSaved }: ChainTraceProps) {
  const bounds = useMemo(() => {
    if (executions.length === 0) return { start: 0, end: 1000, duration: 1000 };
    const startTimes = executions.flatMap((e) => (e.startedAt ? [e.startedAt] : []));
    const endTimes = executions.flatMap((e) => (e.completedAt ? [e.completedAt] : []));
    const start = startTimes.length > 0 ? Math.min(...startTimes) : chain.startedAt || Date.now();
    const end = endTimes.length > 0 ? Math.max(...endTimes) : chain.completedAt || Date.now();
    return { start, end, duration: Math.max(end - start, 1) };
  }, [executions, chain]);

  const groups = useMemo(() => {
    const out: { group: string | null; steps: StepExecution[] }[] = [];
    for (const exec of executions) {
      const g = exec.parallelGroup || null;
      const last = out[out.length - 1];
      if (last && last.group === g) last.steps.push(exec);
      else out.push({ group: g, steps: [exec] });
    }
    return out;
  }, [executions]);

  const barPosition = (step: StepExecution) => {
    const start = step.startedAt || bounds.start;
    const end = step.completedAt || (step.startedAt ? step.startedAt + (step.latencyMs || 0) : bounds.end);
    const left = Math.max(0, ((start - bounds.start) / bounds.duration) * 100);
    const width = ((end - start) / bounds.duration) * 100;
    return { left: `${left}%`, width: `${Math.max(2, Math.min(100 - left, width))}%` };
  };

  const providerFor = (stepId: string) => chain.steps?.find((s) => s.id === stepId)?.provider;

  return (
    <div>
      <KV k="Status" v={<Status kind={statusKind(chain.status)}>{chain.status}</Status>} />
      <KV k="Duration" v={formatDuration(chain.totalLatencyMs)} />
      <KV k="Cost" v={formatCost(chain.totalCostCents)} />
      <KV k="Tokens saved (estimate)" v={tokensSaved.toLocaleString()} />

      <div className="mt-5">
        {groups.map(({ group, steps }, gi) => (
          <div key={gi} className={group && steps.length > 1 ? "border-l border-[var(--border-subtle)] pl-3" : ""}>
            {group && steps.length > 1 && <p className="pt-2 text-[12px] text-[var(--text-muted)]">Parallel</p>}
            {steps.map((step) => {
              const pos = barPosition(step);
              const provider = providerFor(step.stepId);
              return (
                <div key={step._id} className="flex items-center gap-3 border-t border-[var(--border-subtle)] py-2.5">
                  <div className="w-[7.5rem] shrink-0 min-w-0 sm:w-[9.5rem]">
                    <p className="claw-mono truncate text-[12.5px]" title={step.stepId}>{step.stepId}</p>
                    <Status kind={statusKind(step.status)}><span className="whitespace-nowrap">{step.status}{provider && <span className="hidden sm:inline"> · {provider}</span>}</span></Status>
                  </div>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface)]">
                    <div className="absolute top-0 h-full rounded-full" style={{ left: pos.left, width: pos.width, background: barColor(step.status) }} />
                  </div>
                  <div className="w-14 shrink-0 text-right text-[12px] text-[var(--text-muted)]">{formatDuration(step.latencyMs || 0)}</div>
                  <div className="hidden w-14 shrink-0 text-right text-[12px] text-[var(--text-muted)] sm:block">{formatCost(step.costCents || 0)}</div>
                </div>
              );
            })}
          </div>
        ))}
        {executions.length === 0 && <p className="border-t border-[var(--border-subtle)] py-4 text-[13px] text-[var(--text-muted)]">No steps recorded.</p>}
      </div>
    </div>
  );
}
