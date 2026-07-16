"use client";

import { useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import {
  Bot,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Cloud,
  Code2,
  Copy,
  ExternalLink,
  Globe2,
  KeyRound,
  Loader2,
  Play,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://adventurous-avocet-799.convex.cloud";
const GATEWAY_URL =
  process.env.NEXT_PUBLIC_APICLAW_GATEWAY_URL ||
  CONVEX_URL.replace(".convex.cloud", ".convex.site");

const FIRST_QUERY = "AI agent infrastructure news";
const FIRST_CALL_PROMPT =
  `Use APIClaw to find a callable web search API, call it with the query "${FIRST_QUERY}", then summarize the top 3 results with source links. If you need to choose a provider/action, run discover_apis first and then call_api with the best callable match.`;
const INSTALL_COMMAND = "curl -fsSL https://apiclaw.cloud/install.sh | bash";
const CLI_COMMAND = `apiclaw discover "web search"\napiclaw call brave_search/search --params '{"query":"${FIRST_QUERY}"}'`;
const REMOTE_MCP_URL = "https://apiclaw.cloud/mcp";

interface OnboardingState {
  completedAt: number | null;
  dismissedAt: number | null;
}

type DoorId = "agent" | "cli" | "http" | "remote";
type View = "choose" | "launch" | "success";
type LiveResult = {
  title: string;
  url?: string;
  description?: string;
};

interface Door {
  id: DoorId;
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
}

const DOORS: Door[] = [
  {
    id: "agent",
    title: "AI agent / MCP",
    eyebrow: "Recommended",
    description: "Give Claude, Cursor, Cline, or another MCP client the full APIClaw toolset.",
    icon: Bot,
  },
  {
    id: "cli",
    title: "CLI",
    eyebrow: "Terminal",
    description: "Discover and call APIs from your shell, scripts, or CI workflow.",
    icon: Terminal,
  },
  {
    id: "http",
    title: "HTTP",
    eyebrow: "Backend",
    description: "Use the gateway from your own agent, app, or automation.",
    icon: Code2,
  },
  {
    id: "remote",
    title: "Remote MCP",
    eyebrow: "Connected client",
    description: "Connect an OAuth-aware host directly to APIClaw's remote MCP endpoint.",
    icon: Cloud,
  },
];

async function callMutation(path: string, args: Record<string, unknown>) {
  try {
    const res = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, args }),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function callQuery(path: string, args: Record<string, unknown>) {
  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, args }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.value ?? data;
  } catch {
    return null;
  }
}

function readSearchResults(payload: unknown): LiveResult[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.data as Record<string, unknown> | undefined;
  const web = data?.web as Record<string, unknown> | undefined;
  const candidates = (web?.results ?? data?.results) as unknown;
  if (!Array.isArray(candidates)) return [];

  return candidates.slice(0, 3).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const result = item as Record<string, unknown>;
    const title = typeof result.title === "string" ? result.title : "Search result";
    return [{
      title,
      url: typeof result.url === "string" ? result.url : undefined,
      description: typeof result.description === "string" ? result.description : undefined,
    }];
  });
}

export function OnboardingWizard({ sessionToken }: { sessionToken: string | null }) {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("choose");
  const [door, setDoor] = useState<DoorId>("agent");
  const [busy, setBusy] = useState(false);
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [runError, setRunError] = useState<string | null>(null);
  const [results, setResults] = useState<LiveResult[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!sessionToken) return;
    callQuery("onboarding:getState", { token: sessionToken }).then((next: OnboardingState | null) => {
      if (!next) return;
      setState(next);
      if (!next.completedAt && !next.dismissedAt) {
        setOpen(true);
        setView("choose");
      }
    });
  }, [sessionToken]);

  useEffect(() => {
    if (!open) return;
    headingRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy && runStatus !== "running") {
        void dismiss();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // dismiss is intentionally read from the current render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, busy, runStatus]);

  if (!sessionToken || !state) return null;

  if (!open && state.dismissedAt && !state.completedAt) {
    return (
      <ResumeToast
        onResume={() => {
          setOpen(true);
          setView("choose");
        }}
      />
    );
  }

  if (!open) return null;

  async function dismiss() {
    if (!sessionToken) return;
    setBusy(true);
    await callMutation("onboarding:dismiss", { token: sessionToken });
    setState((current) => current ? { ...current, dismissedAt: Date.now() } : current);
    setOpen(false);
    setBusy(false);
  }

  async function finish() {
    if (!sessionToken) return;
    setBusy(true);
    await callMutation("onboarding:complete", { token: sessionToken });
    posthog.capture("onboarding_completed", {
      door,
      live_call_completed: runStatus === "success",
    });
    setState((current) => current ? { ...current, completedAt: Date.now() } : current);
    setOpen(false);
    setBusy(false);
  }

  async function runFirstCall() {
    if (!sessionToken || runStatus === "running") return;
    setRunStatus("running");
    setRunError(null);
    posthog.capture("onboarding_first_call_started", { door });

    try {
      const response = await fetch(`${GATEWAY_URL}/v1/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-APIClaw-Session": sessionToken,
        },
        body: JSON.stringify({
          provider: "brave_search",
          action: "search",
          params: { query: FIRST_QUERY, count: 3 },
        }),
      });
      const payload = await response.json().catch(() => null);
      const succeeded = response.ok && payload?.success !== false;
      if (!succeeded) {
        const message = payload?.error?.message || payload?.error || "The live call did not complete.";
        throw new Error(typeof message === "string" ? message : "The live call did not complete.");
      }

      setResults(readSearchResults(payload));
      setRunStatus("success");
      setView("success");
      posthog.capture("onboarding_first_call_succeeded", {
        door,
        provider: "brave_search",
        action: "search",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The live call did not complete.";
      setRunError(message);
      setRunStatus("error");
      posthog.capture("onboarding_first_call_failed", {
        door,
        error: message.slice(0, 160),
      });
    }
  }

  const selectedDoor = DOORS.find((item) => item.id === door) ?? DOORS[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-2xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ef4444]/10" aria-hidden="true">
              <Sparkles className="h-4 w-4 text-[#ef4444]" />
            </span>
            <span className="text-sm font-semibold">APIClaw quick start</span>
          </div>
          <button
            type="button"
            onClick={() => void dismiss()}
            disabled={busy || runStatus === "running"}
            className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444] disabled:opacity-40"
            aria-label="Finish setup later"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
          {view === "choose" && (
            <ChooseDoor
              headingRef={headingRef}
              selected={door}
              onSelect={(nextDoor) => {
                setDoor(nextDoor);
                posthog.capture("onboarding_door_selected", { door: nextDoor });
              }}
              onContinue={() => setView("launch")}
            />
          )}

          {view === "launch" && (
            <LaunchStep
              headingRef={headingRef}
              door={selectedDoor}
              sessionToken={sessionToken}
              runStatus={runStatus}
              runError={runError}
              onBack={() => setView("choose")}
              onRun={() => void runFirstCall()}
              onFinish={() => void finish()}
              busy={busy}
            />
          )}

          {view === "success" && (
            <SuccessStep
              headingRef={headingRef}
              door={selectedDoor}
              sessionToken={sessionToken}
              results={results}
              onFinish={() => void finish()}
              busy={busy}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function ChooseDoor({
  headingRef,
  selected,
  onSelect,
  onContinue,
}: {
  headingRef: React.RefObject<HTMLHeadingElement>;
  selected: DoorId;
  onSelect: (door: DoorId) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
          <Check className="h-3.5 w-3.5" />
          Workspace ready
        </div>
        <h2
          id="onboarding-title"
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold tracking-tight outline-none sm:text-3xl"
        >
          Where do you want APIClaw to work?
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
          Pick your door. You will see a real API call first, then get the exact setup for your workflow.
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Choose how to use APIClaw">
        {DOORS.map((item) => {
          const Icon = item.icon;
          const active = selected === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(item.id)}
              className={`group flex min-h-[112px] items-start gap-3 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444] ${
                active
                  ? "border-[#ef4444] bg-[#ef4444]/[0.07] shadow-sm"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[#ef4444]/40"
              }`}
            >
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-[#ef4444] text-white" : "bg-[var(--surface-elevated)] text-[var(--text-muted)]"}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{item.title}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? "text-[#ef4444]" : "text-[var(--text-muted)]"}`}>
                    {item.eyebrow}
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-[var(--text-muted)]">{item.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ef4444] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#ef4444]/15 transition hover:bg-[#dc2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-elevated)]"
      >
        Show me APIClaw live
        <ChevronRight className="h-4 w-4" />
      </button>
      <p className="mt-2 text-center text-xs text-[var(--text-muted)]">No survey. No key setup. One real call.</p>
    </div>
  );
}

function LaunchStep({
  headingRef,
  door,
  sessionToken,
  runStatus,
  runError,
  onBack,
  onRun,
  onFinish,
  busy,
}: {
  headingRef: React.RefObject<HTMLHeadingElement>;
  door: Door;
  sessionToken: string;
  runStatus: "idle" | "running" | "success" | "error";
  runError: string | null;
  onBack: () => void;
  onRun: () => void;
  onFinish: () => void;
  busy: boolean;
}) {
  const Icon = door.icon;
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        disabled={runStatus === "running"}
        className="mb-5 inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] transition hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444] disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
        Change door
      </button>

      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ef4444]/10 text-[#ef4444]">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#ef4444]">{door.title}</p>
          <h2
            id="onboarding-title"
            ref={headingRef}
            tabIndex={-1}
            className="mt-1 text-2xl font-bold tracking-tight outline-none sm:text-3xl"
          >
            Your first live result, one click away
          </h2>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3 text-xs font-semibold text-[var(--text-muted)]">
          <Globe2 className="h-4 w-4 text-[#ef4444]" />
          Live managed API call
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-sm font-semibold">Search the live web for “{FIRST_QUERY}”</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
            APIClaw will route the request, handle Brave Search credentials, and return three sources. Uses one call from your allowance.
          </p>

          {runStatus === "error" && (
            <div role="alert" className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
              {runError} You can retry, or copy your setup below and run it in your own tool.
            </div>
          )}

          <button
            type="button"
            onClick={onRun}
            disabled={runStatus === "running"}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ef4444] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#dc2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-wait disabled:opacity-70"
          >
            {runStatus === "running" ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Routing live call…</>
            ) : (
              <><Play className="h-4 w-4 fill-current" /> {runStatus === "error" ? "Retry live call" : "Run live search"}</>
            )}
          </button>
        </div>
      </div>

      <div className="mt-5 border-t border-[var(--border)] pt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Then use it your way</p>
        <DoorSetup door={door.id} sessionToken={sessionToken} />
      </div>

      <button
        type="button"
        onClick={onFinish}
        disabled={busy || runStatus === "running"}
        className="mt-5 w-full rounded-lg px-4 py-2 text-xs font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444] disabled:opacity-40"
      >
        {busy ? "Saving…" : "I’ll run it in my tool"}
      </button>
    </div>
  );
}

function SuccessStep({
  headingRef,
  door,
  sessionToken,
  results,
  onFinish,
  busy,
}: {
  headingRef: React.RefObject<HTMLHeadingElement>;
  door: Door;
  sessionToken: string;
  results: LiveResult[];
  onFinish: () => void;
  busy: boolean;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Live call complete</p>
          <h2
            id="onboarding-title"
            ref={headingRef}
            tabIndex={-1}
            className="mt-1 text-2xl font-bold tracking-tight outline-none sm:text-3xl"
          >
            That was APIClaw
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            One authenticated request. Provider selected, credentials handled, result returned, and usage recorded in your workspace.
          </p>
        </div>
      </div>

      {results.length > 0 && (
        <div className="mt-5 divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {results.map((result, index) => (
            <div key={`${result.url ?? result.title}-${index}`} className="px-4 py-3.5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ef4444]/10 text-[10px] font-bold text-[#ef4444]">{index + 1}</span>
                <div className="min-w-0">
                  {result.url ? (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1.5 text-sm font-semibold hover:text-[#ef4444] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444]"
                    >
                      <span className="truncate">{result.title}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-sm font-semibold">{result.title}</p>
                  )}
                  {result.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">{result.description}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 border-t border-[var(--border)] pt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Bring it into {door.title}</p>
        <DoorSetup door={door.id} sessionToken={sessionToken} />
      </div>

      <button
        type="button"
        onClick={onFinish}
        disabled={busy}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ef4444] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#dc2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-elevated)] disabled:opacity-60"
      >
        {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <>Open my workspace <ChevronRight className="h-4 w-4" /></>}
      </button>
    </div>
  );
}

function DoorSetup({ door, sessionToken }: { door: DoorId; sessionToken: string }) {
  if (door === "agent") {
    return (
      <div className="space-y-3">
        <CopyBlock label="1. Install the MCP server" value={INSTALL_COMMAND} />
        <CopyBlock label="2. Paste this into your agent" value={FIRST_CALL_PROMPT} multiline />
        <p className="text-xs leading-relaxed text-[var(--text-muted)]">The first tool call links your local client to the workspace you already created.</p>
      </div>
    );
  }

  if (door === "cli") {
    return (
      <div className="space-y-3">
        <CopyBlock label="Install APIClaw" value={INSTALL_COMMAND} />
        <CopyBlock label="Discover, then call" value={CLI_COMMAND} multiline />
        <p className="text-xs leading-relaxed text-[var(--text-muted)]">The same workspace, gateway, quota, and logs follow your CLI calls.</p>
      </div>
    );
  }

  if (door === "http") {
    return <HttpSetup sessionToken={sessionToken} />;
  }

  return (
    <div className="space-y-3">
      <CopyBlock label="Remote MCP endpoint" value={REMOTE_MCP_URL} />
      <p className="text-xs leading-relaxed text-[var(--text-muted)]">Add this endpoint in any OAuth-aware MCP host. APIClaw handles discovery, consent, and the connection flow.</p>
    </div>
  );
}

function HttpSetup({ sessionToken }: { sessionToken: string }) {
  const [key, setKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setKey(sessionStorage.getItem("apiclaw_onboarding_http_key"));
    } catch {
      // Storage can be unavailable in strict browsing modes. The key still
      // remains in component memory for this view.
    }
  }, []);

  const generate = async () => {
    if (generating || key) return;
    setGenerating(true);
    setError(null);
    const response = await callMutation("apiKeys:generateKey", {
      token: sessionToken,
      name: "Onboarding quick start",
    });
    const payload = response?.value ?? response;
    const rawKey = typeof payload?.key === "string" ? payload.key : null;

    if (!rawKey) {
      setError(payload?.error || "Could not create a workspace key. Try again from API Keys.");
      setGenerating(false);
      return;
    }

    setKey(rawKey);
    try {
      sessionStorage.setItem("apiclaw_onboarding_http_key", rawKey);
    } catch {
      // Keep the key in memory when storage is unavailable.
    }
    setGenerating(false);
  };

  if (!key) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ef4444]/10 text-[#ef4444]"><KeyRound className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Create your HTTP quick-start key</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Generated once for this tab, revealed only here, and never sent to analytics.</p>
            {error && <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>}
            <button
              type="button"
              onClick={() => void generate()}
              disabled={generating}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-2 text-xs font-semibold text-[#ef4444] transition hover:border-[#ef4444] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444] disabled:opacity-60"
            >
              {generating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating key…</> : <><KeyRound className="h-3.5 w-3.5" /> Generate key and curl</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const curl = [
    "curl https://api.apiclaw.cloud/v1/execute \\",
    `  -H "Authorization: Bearer ${key}" \\`,
    "  -H \"Content-Type: application/json\" \\",
    `  -d '{"provider":"brave_search","action":"search","params":{"query":"${FIRST_QUERY}","count":3}}'`,
  ].join("\n");

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
        Copy this now. The full key is kept only in this browser tab and cannot be shown again after you close it.
      </div>
      <CopyBlock label="Run the same call from your backend" value={curl} multiline />
    </div>
  );
}

function CopyBlock({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444]"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className={`overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 font-mono text-xs leading-relaxed text-[var(--text-primary)] ${multiline ? "max-h-36" : ""}`}>
        <code>{value}</code>
      </pre>
    </div>
  );
}

function ResumeToast({ onResume }: { onResume: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <button
        type="button"
        onClick={onResume}
        className="flex items-center gap-2 rounded-xl border border-[#ef4444]/30 bg-[var(--surface-elevated)] px-4 py-3 shadow-lg transition hover:border-[#ef4444] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444]"
      >
        <Clipboard className="h-4 w-4 text-[#ef4444]" />
        <span className="text-sm font-medium">Run your first API call</span>
        <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
      </button>
    </div>
  );
}
