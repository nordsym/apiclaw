"use client";

import { useState } from "react";
import { Status } from "@/app/workspace/views/ui";
import { formatCost, formatDuration, statusKind, type StepExecution } from "./ChainTrace";

interface ChainStepDetailProps {
  step: StepExecution;
  stepDef?: {
    id: string;
    provider: string;
    action?: string;
    params?: Record<string, unknown>;
  };
  isExpanded: boolean;
  onToggle: () => void;
}

type Tab = "input" | "output" | "error";

function Json({ data, highlightRefs = false }: { data: unknown; highlightRefs?: boolean }) {
  if (data === undefined || data === null) return <span className="text-[var(--text-muted)]">null</span>;
  const text = JSON.stringify(data, null, 2);
  if (!highlightRefs) return <pre className="claw-mono whitespace-pre-wrap break-all text-[12px] text-[var(--text-secondary)]">{text}</pre>;
  const parts = text.split(/(\$[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_[\]]+)*)/g);
  return (
    <pre className="claw-mono whitespace-pre-wrap break-all text-[12px] text-[var(--text-secondary)]">
      {parts.map((part, i) => (part.startsWith("$") ? <span key={i} className="text-[var(--text-primary)] underline decoration-[var(--border)] underline-offset-2">{part}</span> : <span key={i}>{part}</span>))}
    </pre>
  );
}

/** One step in a chain: hairline row, expands to input/output/error. */
export function ChainStepDetail({ step, stepDef, isExpanded, onToggle }: ChainStepDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>("input");
  const retries = step.error?.retryCount ?? 0;
  const tab: Tab = activeTab === "error" && !step.error ? "input" : activeTab;
  const tabBtn = (id: Tab, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setActiveTab(id)}
      className={`text-[12.5px] ${tab === id ? "text-[var(--text-primary)] underline underline-offset-4" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="border-t border-[var(--border-subtle)]">
      <button type="button" onClick={onToggle} aria-expanded={isExpanded} className="flex w-full items-center justify-between gap-4 py-3 text-left">
        <div className="min-w-0">
          <p className="claw-mono truncate text-[12.5px] text-[var(--text-primary)]">
            {step.stepId}
            {stepDef && <span className="text-[var(--text-muted)]"> · {stepDef.provider}{stepDef.action ? `/${stepDef.action}` : ""}</span>}
          </p>
          <Status kind={statusKind(step.status)}>{retries > 0 ? `${step.status} · ${retries} retries` : step.status}</Status>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-[12px] text-[var(--text-muted)]">
          <span>{formatDuration(step.latencyMs || 0)}</span>
          <span>{formatCost(step.costCents || 0)}</span>
          <span aria-hidden="true">{isExpanded ? "−" : "+"}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="pb-4">
          <div className="flex items-center gap-4 pb-2">
            {tabBtn("input", "Input")}
            {tabBtn("output", "Output")}
            {step.error && tabBtn("error", "Error")}
          </div>
          <div className="max-h-64 overflow-auto rounded-[10px] bg-[var(--surface)] p-3">
            {tab === "input" && (
              step.input !== undefined && step.input !== null ? <Json data={step.input} highlightRefs /> : stepDef?.params ? <Json data={stepDef.params} highlightRefs /> : <span className="text-[13px] text-[var(--text-muted)]">No input</span>
            )}
            {tab === "output" && (
              step.output !== undefined && step.output !== null ? <Json data={step.output} /> : (
                <span className="text-[13px] text-[var(--text-muted)]">
                  {step.status === "running" ? "Waiting for output" : step.status === "pending" ? "Not executed yet" : "No output"}
                </span>
              )
            )}
            {tab === "error" && step.error && (
              <div className="text-[13px]">
                <p className="claw-mono text-[12px] text-[var(--accent)]">{step.error.code}</p>
                <p className="mt-1 text-[var(--text-primary)]">{step.error.message}</p>
                {retries > 0 && <p className="mt-2 text-[12px] text-[var(--text-muted)]">Retried {retries} times before failing.</p>}
              </div>
            )}
          </div>
          <p className="mt-2 flex flex-wrap gap-x-4 text-[12px] text-[var(--text-muted)]">
            <span>Index {step.stepIndex}</span>
            {step.parallelGroup && <span>Parallel group {step.parallelGroup}</span>}
            {step.startedAt && <span>Started {new Date(step.startedAt).toLocaleTimeString()}</span>}
            {step.completedAt && <span>Completed {new Date(step.completedAt).toLocaleTimeString()}</span>}
          </p>
        </div>
      )}
    </div>
  );
}
