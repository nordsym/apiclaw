"use client";

import { useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import { CopyLine } from "@/components/home/CopyLine";
import { Panel, Status, btnQuiet, btnSolid } from "@/app/workspace/views/ui";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://adventurous-avocet-799.convex.cloud";
const GATEWAY_URL =
  process.env.NEXT_PUBLIC_APICLAW_GATEWAY_URL ||
  CONVEX_URL.replace(".convex.cloud", ".convex.site");

const FIRST_QUERY = "AI agent infrastructure news";
const FIRST_CALL_PROMPT =
  `Use APIClaw's managed Brave Search adapter with provider "brave_search", action "search", and query "${FIRST_QUERY}". Then summarize the top 3 results with source links.`;
const INSTALL_COMMAND = "curl -fsSL https://apiclaw.cloud/install.sh | bash";
const CLI_DISCOVER = 'apiclaw discover "web search"';
const CLI_CALL = `apiclaw call brave_search/search --params '{"query":"${FIRST_QUERY}"}'`;
const REMOTE_MCP_URL = "https://apiclaw.cloud/mcp";
const HTTP_KEY_STORAGE = "apiclaw_onboarding_http_key";

interface OnboardingState {
  completedAt: number | null;
  dismissedAt: number | null;
}

type DoorId = "agent" | "cli" | "http" | "remote";
type View = "choose" | "launch" | "success";
type RunStatus = "idle" | "running" | "success" | "error";
type LiveResult = { title: string; url?: string; description?: string };

const DOORS: Array<{ id: DoorId; title: string; description: string }> = [
  { id: "agent", title: "AI agent (MCP)", description: "Claude, Cursor, Cline, or any MCP client." },
  { id: "cli", title: "CLI", description: "Shell, scripts, CI." },
  { id: "http", title: "HTTP", description: "Your own agent, app, or automation." },
  { id: "remote", title: "Remote MCP", description: "An OAuth-aware host connected to the remote endpoint." },
];

const STEP: Record<View, number> = { choose: 1, launch: 2, success: 3 };

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

/** Returns the onboarding state, or null when the session is unknown or the query failed. */
async function fetchOnboardingState(token: string): Promise<OnboardingState | null> {
  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "onboarding:getState", args: { token } }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.status === "error") return null;
    const value = "value" in (data ?? {}) ? data.value : data;
    if (!value || typeof value !== "object" || !("completedAt" in value)) return null;
    return { completedAt: value.completedAt ?? null, dismissedAt: value.dismissedAt ?? null };
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
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [runError, setRunError] = useState<string | null>(null);
  const [results, setResults] = useState<LiveResult[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstCallIdempotencyKeyRef = useRef<string | null>(null);

  // Self-gating: open only when the backend says this workspace has neither
  // completed nor dismissed onboarding. Any unknown state keeps the wizard closed.
  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;
    fetchOnboardingState(sessionToken).then((next) => {
      if (cancelled || !next) return;
      setState(next);
      if (!next.completedAt && !next.dismissedAt) {
        setOpen(true);
        setView("choose");
      }
    });
    return () => { cancelled = true; };
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

  useEffect(() => {
    if (open) headingRef.current?.focus();
  }, [open, view]);

  if (!sessionToken || !state) return null;

  if (!open && state.dismissedAt && !state.completedAt) {
    return <ResumeToast onResume={() => { setOpen(true); setView("choose"); }} />;
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
      const idempotencyKey = firstCallIdempotencyKeyRef.current ??
        `onboarding-${crypto.randomUUID()}`;
      firstCallIdempotencyKeyRef.current = idempotencyKey;
      const response = await fetch(`${GATEWAY_URL}/v1/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
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
      // Only rotate the key on success or on a response that unambiguously
      // means the call never dispatched (4xx, excluding 408/429 which can
      // follow a real dispatch attempt). A 5xx leaves dispatch ambiguous, so
      // a retry must reuse the same key rather than mint a new one.
      const status = response.status;
      const definitelyNotDispatched = status >= 400 && status < 500 && status !== 408 && status !== 429;
      if (succeeded || definitelyNotDispatched) {
        firstCallIdempotencyKeyRef.current = null;
      }
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
  const locked = busy || runStatus === "running";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <Panel className="flex max-h-[96dvh] w-full max-w-[32rem] flex-col overflow-hidden rounded-b-none sm:max-h-[90vh] sm:rounded-b-[14px]">
        <section role="dialog" aria-modal="true" aria-labelledby="onboarding-title" className="overflow-y-auto p-6 sm:p-7">
          <div className="flex items-center justify-between text-[12.5px] text-[var(--text-muted)]">
            <span className="claw-mono">{STEP[view]} / 3</span>
            <button type="button" onClick={() => void dismiss()} disabled={locked} className="claw-link disabled:opacity-40">
              Later
            </button>
          </div>

          {view === "choose" && (
            <Step
              headingRef={headingRef}
              title="How will you call APIClaw?"
              line="Pick one. You can use the others later."
              action={<button type="button" onClick={() => setView("launch")} className={btnSolid}>Continue</button>}
            >
              <div role="radiogroup" aria-label="Choose how to use APIClaw" className="mt-5">
                {DOORS.map((item) => {
                  const active = door === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setDoor(item.id);
                        posthog.capture("onboarding_door_selected", { door: item.id });
                      }}
                      className="flex w-full items-center gap-4 border-t border-[var(--border-subtle)] py-3 text-left"
                    >
                      <span className={`h-3.5 w-3.5 shrink-0 rounded-full border ${active ? "border-[var(--text-primary)] bg-[var(--text-primary)]" : "border-[var(--border)]"}`} aria-hidden="true" />
                      <span className="min-w-0">
                        <span className={`block text-[14.5px] ${active ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{item.title}</span>
                        <span className="block text-[12.5px] text-[var(--text-muted)]">{item.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Step>
          )}

          {view === "launch" && (
            <Step
              headingRef={headingRef}
              title="Run one live call"
              line={`Brave Search for "${FIRST_QUERY}". Uses one call from your allowance.`}
              action={
                <>
                  <button type="button" onClick={() => void runFirstCall()} disabled={runStatus === "running"} className={btnSolid}>
                    {runStatus === "running" ? "Running" : runStatus === "error" ? "Retry" : "Run live search"}
                  </button>
                  <button type="button" onClick={() => setView("choose")} disabled={runStatus === "running"} className={btnQuiet}>Back</button>
                </>
              }
              footer={
                <button type="button" onClick={() => void finish()} disabled={locked} className="claw-link text-[12.5px] disabled:opacity-40">
                  {busy ? "Saving" : "Skip, I will run it from my own tool"}
                </button>
              }
            >
              {runStatus === "error" && runError && (
                <p role="alert" className="mt-4 text-[13px] text-[var(--accent)]">{runError}</p>
              )}
            </Step>
          )}

          {view === "success" && (
            <Step
              headingRef={headingRef}
              title="That was APIClaw"
              line={`One call, credentials handled, usage recorded. Now use it from ${selectedDoor.title}.`}
              action={
                <button type="button" onClick={() => void finish()} disabled={busy} className={btnSolid}>
                  {busy ? "Saving" : "Open workspace"}
                </button>
              }
            >
              {results.length > 0 && (
                <ul className="mt-5" aria-label="Top results">
                  {results.map((result, index) => (
                    <li key={`${result.url ?? result.title}-${index}`} className="border-t border-[var(--border-subtle)] py-2.5 text-[13.5px]">
                      {result.url ? (
                        <a href={result.url} target="_blank" rel="noopener noreferrer" className="claw-link block truncate text-[var(--text-primary)]">{result.title}</a>
                      ) : (
                        <span className="block truncate">{result.title}</span>
                      )}
                      {result.description && <span className="mt-0.5 line-clamp-1 block text-[12.5px] text-[var(--text-muted)]">{result.description}</span>}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-5 border-t border-[var(--border-subtle)] pt-5">
                <DoorSetup door={door} />
              </div>
            </Step>
          )}
        </section>
      </Panel>
    </div>
  );
}

function Step({ headingRef, title, line, action, footer, children }: {
  headingRef: React.RefObject<HTMLHeadingElement>;
  title: string;
  line: string;
  action: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <h2 id="onboarding-title" ref={headingRef} tabIndex={-1} style={{ outline: "none" }} className="text-[1.35rem] font-semibold tracking-[-0.02em] leading-[1.2]">
        {title}
      </h2>
      <p className="mt-1.5 text-[14px] text-[var(--text-secondary)]">{line}</p>
      {children}
      <div className="mt-6 flex flex-wrap items-center gap-2">{action}</div>
      {footer && <div className="mt-3">{footer}</div>}
    </div>
  );
}

function DoorSetup({ door }: { door: DoorId }) {
  if (door === "agent") {
    return (
      <div className="space-y-2">
        <CopyLine text={INSTALL_COMMAND} />
        <CopyLine text={FIRST_CALL_PROMPT} prompt="›" />
        <p className="text-[12.5px] text-[var(--text-muted)]">The first tool call links the client to this workspace.</p>
      </div>
    );
  }

  if (door === "cli") {
    return (
      <div className="space-y-2">
        <CopyLine text={INSTALL_COMMAND} />
        <CopyLine text={CLI_DISCOVER} />
        <CopyLine text={CLI_CALL} />
      </div>
    );
  }

  if (door === "http") {
    return <HttpSetup />;
  }

  return (
    <div className="space-y-2">
      <CopyLine text={REMOTE_MCP_URL} prompt="›" />
      <p className="text-[12.5px] text-[var(--text-muted)]">Add this endpoint in any OAuth-aware MCP host.</p>
    </div>
  );
}

function HttpSetup() {
  const [key, setKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setKey(sessionStorage.getItem(HTTP_KEY_STORAGE));
    } catch {
      // Storage can be unavailable in strict browsing modes. The key still
      // remains in component memory for this view.
    }
  }, []);

  const generate = async () => {
    if (generating || key) return;
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/workspace/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: "Onboarding quick start" }),
      });
      const payload = await response.json().catch(() => ({}));
      const rawKey = typeof payload?.key === "string" ? payload.key : null;
      if (!rawKey) {
        setError(typeof payload?.error === "string" ? payload.error : "Could not create a workspace key. Try again from Connections.");
        return;
      }
      setKey(rawKey);
      try {
        sessionStorage.setItem(HTTP_KEY_STORAGE, rawKey);
      } catch {
        // Keep the key in memory when storage is unavailable.
      }
    } catch {
      setError("Could not create a workspace key. Try again from Connections.");
    } finally {
      setGenerating(false);
    }
  };

  if (!key) {
    return (
      <div>
        <p className="text-[13.5px] text-[var(--text-secondary)]">Create a key to call the gateway from your backend. It is shown once, in this tab only.</p>
        {error && <p role="alert" className="mt-2 text-[12.5px] text-[var(--accent)]">{error}</p>}
        <button type="button" onClick={() => void generate()} disabled={generating} className={`${btnQuiet} mt-3`}>
          {generating ? "Creating key" : "Create key"}
        </button>
      </div>
    );
  }

  const curl = `curl https://api.apiclaw.cloud/v1/execute -H "Authorization: Bearer ${key}" -H "Idempotency-Key: $(uuidgen)" -H "Content-Type: application/json" -d '{"provider":"brave_search","action":"search","params":{"query":"${FIRST_QUERY}","count":3}}'`;

  return (
    <div className="space-y-2">
      <p className="text-[12.5px]"><Status kind="warn">Copy the key now. It cannot be shown again after this tab closes.</Status></p>
      <CopyLine text={curl} />
    </div>
  );
}

function ResumeToast({ onResume }: { onResume: () => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <button type="button" onClick={onResume} className={btnQuiet}>
        Resume setup
      </button>
    </div>
  );
}
