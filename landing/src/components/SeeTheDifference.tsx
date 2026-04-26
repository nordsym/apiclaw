"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Check,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Newspaper,
  Globe,
  Pause,
} from "lucide-react";

type BeatKind = "tool" | "result" | "done";
type Beat = { atMs: number; text: string; kind: BeatKind };

const PROMPT = "What's happening in tech right now?";

const APICLAW_BEATS: Beat[] = [
  { atMs: 100,  text: 'discover_apis("news") + discover_apis("article extraction")', kind: "tool" },
  { atMs: 220,  text: "matched: Brave Search · Firecrawl · auto LLM", kind: "result" },
  { atMs: 380,  text: 'call_api("brave/search", { q: "AI tech news today" })', kind: "tool" },
  { atMs: 700,  text: "3 source URLs returned", kind: "result" },
  { atMs: 820,  text: 'call_api("firecrawl/extract") · 3 URLs in parallel', kind: "tool" },
  { atMs: 1100, text: "articles converted to markdown", kind: "result" },
  { atMs: 1250, text: 'synthesize → /v1/chat (route: "auto")', kind: "tool" },
  { atMs: 1400, text: "Done · 3 headlines with sources", kind: "done" },
];

const FINISH_AT_MS = 1400;
const HOLD_AT_END_MS = 4000;

const HEADLINES = [
  {
    title: "OpenAI announces o3-pro for enterprise tier",
    source: "techcrunch.com",
    via: "Brave Search",
    time: "14:32 UTC",
  },
  {
    title: "Anthropic ships Claude 4.7 Opus with 1M context window",
    source: "anthropic.com",
    via: "Brave Search",
    time: "13:50 UTC",
  },
  {
    title: "Vercel acquires V0 marketplace, expands AI tooling stack",
    source: "vercel.com",
    via: "Brave Search",
    time: "12:15 UTC",
  },
];

const MANUAL_STEPS = [
  { atMin: 0,    text: "Search for news + content extraction APIs"          },
  { atMin: 5,    text: "Compare NewsAPI, Bing, Brave, Firecrawl, Diffbot"   },
  { atMin: 11,   text: "Read pricing, rate-limit, content-rights pages"     },
  { atMin: 17,   text: "Sign up for news API · verify email · add card"    },
  { atMin: 24,   text: "Sign up for extraction API · second key, second .env" },
  { atMin: 31,   text: "Read both SDK docs · auth headers, pagination"     },
  { atMin: 39,   text: "Write fetch · debug 401, 403, 422 across both"    },
  { atMin: 46,   text: "Dedupe sources · handle rate limits · retries"    },
  { atMin: 53,   text: "Send to your LLM yourself · pay per token"        },
  { atMin: 60,   text: "First synthesized answer · ~3 hours in"            },
];

export function SeeTheDifference() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [done, setDone] = useState(false);
  const [paused, setPaused] = useState(false);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);

  const startCycle = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    if (holdTimerRef.current != null) clearTimeout(holdTimerRef.current);
    setDone(false);
    setElapsedMs(0);
    startRef.current = performance.now();

    const tick = () => {
      if (paused) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (startRef.current == null) return;
      const ms = performance.now() - startRef.current;
      if (ms >= FINISH_AT_MS) {
        setElapsedMs(FINISH_AT_MS);
        setDone(true);
        holdTimerRef.current = setTimeout(() => {
          if (!paused) startCycle();
        }, HOLD_AT_END_MS);
        return;
      }
      setElapsedMs(ms);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [paused]);

  // Pause adjustments — when paused, freeze time; when unpaused, shift the start
  useEffect(() => {
    if (paused) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (holdTimerRef.current != null) clearTimeout(holdTimerRef.current);
    } else if (active) {
      // Resume from current elapsedMs
      if (done) {
        holdTimerRef.current = setTimeout(() => startCycle(), HOLD_AT_END_MS);
      } else {
        startRef.current = performance.now() - elapsedMs;
        const tick = () => {
          if (paused || startRef.current == null) return;
          const ms = performance.now() - startRef.current;
          if (ms >= FINISH_AT_MS) {
            setElapsedMs(FINISH_AT_MS);
            setDone(true);
            holdTimerRef.current = setTimeout(() => {
              if (!paused) startCycle();
            }, HOLD_AT_END_MS);
            return;
          }
          setElapsedMs(ms);
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }
    }
  }, [paused, active, done, elapsedMs, startCycle]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !active) {
            setActive(true);
            startCycle();
          }
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [active, startCycle]);

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    if (holdTimerRef.current != null) clearTimeout(holdTimerRef.current);
  }, []);

  // Manual side: 1 real second = 1 simulated minute, capped at 60
  const simulatedMin = Math.min(60, elapsedMs / 1000);
  const lastVisibleManualIdx = MANUAL_STEPS.findIndex((s, i) =>
    s.atMin <= simulatedMin && (MANUAL_STEPS[i + 1]?.atMin ?? Infinity) > simulatedMin
  );

  const visibleBeats = APICLAW_BEATS.filter((b) => b.atMs <= elapsedMs);

  return (
    <div
      ref={sectionRef}
      className="w-full max-w-6xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Without APIClaw */}
        <div className="relative rounded-2xl border border-border bg-surface-elevated overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border bg-surface">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-widest text-text-muted">
              <AlertTriangle className="w-4 h-4 text-text-muted" />
              Without APIClaw
            </div>
            <ManualClock minutes={simulatedMin} done={done && simulatedMin >= 60} />
          </div>

          <div className="px-4 sm:px-5 py-4 border-b border-border-subtle">
            <div className="text-xs uppercase tracking-widest text-text-muted mb-1">Prompt</div>
            <div className="text-sm sm:text-base text-text-primary font-medium">{PROMPT}</div>
          </div>

          <ol className="p-4 sm:p-5 space-y-2.5 min-h-[320px]">
            {MANUAL_STEPS.map((step, i) => {
              const visible = step.atMin <= simulatedMin;
              const isActive = visible && i === lastVisibleManualIdx && !(done && simulatedMin >= 60);
              return (
                <li
                  key={i}
                  className={`flex items-start gap-3 transition-all duration-300 ${
                    visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                      isActive
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
                      isActive ? "text-text-primary" : "text-text-secondary"
                    }`}
                  >
                    {step.text}
                    {isActive && (
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
        </div>

        {/* With APIClaw */}
        <div className="relative rounded-2xl border border-accent/30 bg-surface-elevated overflow-hidden shadow-[0_0_60px_-20px_rgba(239,68,68,0.35)]">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-accent/20 bg-accent/5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-widest text-accent">
              <Sparkles className="w-4 h-4" />
              With APIClaw
            </div>
            <ApiClawClock ms={elapsedMs} done={done} />
          </div>

          <div className="px-4 sm:px-5 py-4 border-b border-border-subtle">
            <div className="text-xs uppercase tracking-widest text-text-muted mb-1">Prompt</div>
            <div className="text-sm sm:text-base text-text-primary font-medium">{PROMPT}</div>
          </div>

          <div className="p-4 sm:p-5 space-y-2.5 min-h-[320px] font-mono">
            {visibleBeats.map((beat, i) => (
              <div
                key={`${beat.atMs}-${i}`}
                className="flex items-start gap-2.5 text-[13px] sm:text-sm leading-relaxed animate-[fadeIn_0.3s_ease-out_forwards]"
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
                      ? "text-text-secondary break-all"
                      : beat.kind === "done"
                        ? "text-accent font-semibold"
                        : "text-text-primary break-words"
                  }
                >
                  {beat.text}
                </span>
              </div>
            ))}
            {!done && visibleBeats.length < APICLAW_BEATS.length && (
              <div className="flex items-center gap-2.5 text-sm text-text-muted">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span>working…</span>
              </div>
            )}
          </div>

          {done && (
            <div className="mx-4 sm:mx-5 mb-4 sm:mb-5 rounded-xl border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent p-3 sm:p-4 space-y-2 animate-[fadeIn_0.4s_ease-out_forwards]">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent font-semibold mb-1">
                <Newspaper className="w-3.5 h-3.5" />
                Synthesized answer
              </div>
              {HEADLINES.map((h, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <Globe className="w-3.5 h-3.5 text-text-muted mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-text-primary font-medium leading-snug">{h.title}</div>
                    <div className="text-text-muted text-[11px] flex items-center gap-1.5 mt-0.5">
                      <span>{h.source}</span>
                      <span>·</span>
                      <span>{h.via}</span>
                      <span>·</span>
                      <span>{h.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center mt-5 gap-2 text-xs text-text-muted">
        {paused ? (
          <>
            <Pause className="w-3 h-3" />
            <span>Paused on hover · move away to resume</span>
          </>
        ) : (
          <>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span>
              {done
                ? "Holding for 4s · then loops"
                : "Same prompt · two paths · one finishes"}
            </span>
          </>
        )}
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
