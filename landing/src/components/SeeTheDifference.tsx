"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RotateCcw, Sparkles, ArrowRight, Check, Loader2, AlertTriangle } from "lucide-react";

const PROMPT = "Generate a product photo of a coffee mug.";

const APICLAW_BEATS = [
  { atMs: 120,  text: "discover_apis(\"image generation\")", kind: "tool" as const },
  { atMs: 220,  text: "→ matched: Replicate (Flux Pro)",   kind: "result" as const },
  { atMs: 380,  text: "call_api(\"replicate/flux-pro\")",   kind: "tool" as const },
  { atMs: 1100, text: "→ image generated · zero keys",     kind: "result" as const },
  { atMs: 1400, text: "Done.",                              kind: "done" as const },
];

const FINISH_AT_MS = 1400;

const MANUAL_STEPS = [
  { atMin: 0,    text: "Search the web for image-gen APIs"            },
  { atMin: 4,    text: "Open 12 tabs, compare providers"              },
  { atMin: 11,   text: "Read Replicate docs — auth, models, limits"   },
  { atMin: 16,   text: "Sign up · verify email · click confirmation"  },
  { atMin: 22,   text: "Add credit card · accept billing terms"       },
  { atMin: 27,   text: "Generate API key · save to .env"              },
  { atMin: 34,   text: "Install replicate-node · read SDK examples"   },
  { atMin: 41,   text: "Write request code · debug 401, 422, 500"     },
  { atMin: 47,   text: "First call works · agent finally has an image" },
];

type State = "idle" | "running" | "done";

export function SeeTheDifference() {
  const [state, setState] = useState<State>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const hasStartedRef = useRef(false);

  const tick = useCallback(() => {
    if (startRef.current == null) return;
    const ms = performance.now() - startRef.current;
    setElapsedMs(ms);
    if (ms >= FINISH_AT_MS) {
      setState("done");
      setElapsedMs(FINISH_AT_MS);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    setState("running");
    setElapsedMs(0);
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const reset = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
    setElapsedMs(0);
    setState("idle");
    hasStartedRef.current = false;
    setTimeout(() => {
      hasStartedRef.current = true;
      start();
    }, 60);
  }, [start]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasStartedRef.current) {
            hasStartedRef.current = true;
            start();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [start]);

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);

  // Manual side: simulated minutes are paced 1 real second = 1 simulated minute,
  // capped at the last step. Stays "still going" past 47 min.
  const simulatedMin = Math.min(60, elapsedMs / 1000);
  const visibleManualSteps = MANUAL_STEPS.filter((s) => s.atMin <= simulatedMin);
  const lastVisibleManual = visibleManualSteps[visibleManualSteps.length - 1];
  const manualDone = state === "done" && simulatedMin >= 47;

  // APIClaw side: reveal beats based on elapsed time
  const visibleBeats = APICLAW_BEATS.filter((b) => b.atMs <= elapsedMs);

  return (
    <div ref={sectionRef} className="w-full max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Without APIClaw */}
        <div className="relative rounded-2xl border border-border bg-surface-elevated overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border bg-surface">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-widest text-text-muted">
              <AlertTriangle className="w-4 h-4 text-text-muted" />
              Without APIClaw
            </div>
            <ManualClock minutes={simulatedMin} done={manualDone} />
          </div>

          <div className="px-4 sm:px-5 py-4 border-b border-border-subtle">
            <div className="text-xs uppercase tracking-widest text-text-muted mb-1">Prompt</div>
            <div className="text-sm sm:text-base text-text-primary font-medium">{PROMPT}</div>
          </div>

          <ol className="p-4 sm:p-5 space-y-2.5 min-h-[280px]">
            {MANUAL_STEPS.map((step, i) => {
              const visible = step.atMin <= simulatedMin;
              const active = visible && step === lastVisibleManual && !manualDone;
              return (
                <li
                  key={i}
                  className={`flex items-start gap-3 transition-all duration-300 ${
                    visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                      active
                        ? "bg-text-muted/20 text-text-secondary"
                        : visible
                          ? "bg-text-muted/10 text-text-muted"
                          : "bg-surface text-text-muted"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`text-sm leading-relaxed ${
                      active ? "text-text-primary" : "text-text-secondary"
                    }`}
                  >
                    {step.text}
                    {active && (
                      <span className="inline-flex gap-0.5 ml-1.5 align-middle">
                        <span className="w-1 h-1 bg-text-muted rounded-full animate-pulse" />
                        <span className="w-1 h-1 bg-text-muted rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                        <span className="w-1 h-1 bg-text-muted rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>

          {manualDone && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 -mt-1 text-xs text-text-muted">
              And that's just the first integration.
            </div>
          )}
        </div>

        {/* With APIClaw */}
        <div className="relative rounded-2xl border border-accent/30 bg-surface-elevated overflow-hidden shadow-[0_0_60px_-20px_rgba(239,68,68,0.35)]">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-accent/20 bg-accent/5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-widest text-accent">
              <Sparkles className="w-4 h-4" />
              With APIClaw
            </div>
            <ApiClawClock ms={elapsedMs} done={state === "done"} />
          </div>

          <div className="px-4 sm:px-5 py-4 border-b border-border-subtle">
            <div className="text-xs uppercase tracking-widest text-text-muted mb-1">Prompt</div>
            <div className="text-sm sm:text-base text-text-primary font-medium">{PROMPT}</div>
          </div>

          <div className="p-4 sm:p-5 space-y-2.5 min-h-[280px] font-mono">
            {visibleBeats.map((beat, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 text-sm leading-relaxed animate-[fadeIn_0.3s_ease-out_forwards]"
              >
                {beat.kind === "tool" && (
                  <ArrowRight className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                )}
                {beat.kind === "result" && (
                  <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                )}
                {beat.kind === "done" && (
                  <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                )}
                <span
                  className={
                    beat.kind === "tool"
                      ? "text-text-secondary"
                      : beat.kind === "done"
                        ? "text-accent font-semibold"
                        : "text-text-primary"
                  }
                >
                  {beat.text}
                </span>
              </div>
            ))}
            {state === "running" && visibleBeats.length < APICLAW_BEATS.length && (
              <div className="flex items-center gap-2.5 text-sm text-text-muted">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span>working…</span>
              </div>
            )}
          </div>

          {state === "done" && (
            <div className="mx-4 sm:mx-5 mb-4 sm:mb-5 rounded-xl border border-accent/30 bg-gradient-to-br from-accent/10 to-transparent p-3 sm:p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">☕</span>
              </div>
              <div className="text-sm">
                <div className="font-semibold text-text-primary">Image returned</div>
                <div className="text-text-muted text-xs">via Replicate · zero keys configured · 1.4s end to end</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center mt-6 gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-surface hover:border-accent/40 hover:bg-surface-elevated text-sm font-medium text-text-secondary hover:text-text-primary transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Replay
        </button>
        <span className="text-xs text-text-muted hidden sm:inline">
          Same prompt · two paths · one finishes
        </span>
      </div>
    </div>
  );
}

function ApiClawClock({ ms, done }: { ms: number; done: boolean }) {
  const seconds = (ms / 1000).toFixed(2);
  return (
    <div
      className={`font-mono text-xs sm:text-sm tabular-nums px-2.5 py-1 rounded-md border ${
        done ? "border-accent/40 bg-accent/10 text-accent" : "border-accent/20 bg-accent/5 text-accent"
      }`}
    >
      {done && <Check className="w-3 h-3 inline mr-1 align-[-1px]" />}
      {seconds}s
    </div>
  );
}

function ManualClock({ minutes, done }: { minutes: number; done: boolean }) {
  const m = Math.floor(minutes);
  const s = Math.floor((minutes - m) * 60);
  const label = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return (
    <div className="font-mono text-xs sm:text-sm tabular-nums px-2.5 py-1 rounded-md border border-border bg-surface text-text-secondary">
      {label}
      {done && <span className="ml-1 text-text-muted">+ still going</span>}
    </div>
  );
}
