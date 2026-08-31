"use client";

import { useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import { CopyLine } from "@/components/home/CopyLine";
import { Panel, Status, btnQuiet, btnSolid } from "@/app/workspace/views/ui";
import {
  AGENT_FIRST_CALL_PROMPT,
  BROWSER_FIRST_EXECUTE_RAILS,
  CLI_CALL,
  CLI_DISCOVER,
  INSTALL_COMMAND,
  ONBOARDING_OVERLAY_CLASS,
  REMOTE_MCP_URL,
  WAITING_FOR_FIRST_CALL,
  decideOnboardingGate,
  formatOnboardingExecuteResult,
  httpFirstCallCurl,
  isOnboardingExecuteSuccess,
  type OnboardingState,
} from "@/lib/onboarding-first-call";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://adventurous-avocet-799.convex.cloud";
const GATEWAY_URL =
  process.env.NEXT_PUBLIC_APICLAW_GATEWAY_URL ||
  CONVEX_URL.replace(".convex.cloud", ".convex.site");

const HTTP_KEY_STORAGE = "apiclaw_onboarding_http_key";
const POLL_MS = 2000;
const LIFT_AFTER_SUCCESS_MS = 900;

type DoorId = "agent" | "cli" | "http" | "remote";
type ClientId = "cursor" | "codex" | "claude" | "claude-code" | "chatgpt" | "grok" | "mcp";
type View = "choose" | "client" | "launch" | "success";
type RunStatus = "idle" | "running" | "success" | "error";

const DOORS: Array<{ id: DoorId; title: string; description: string }> = [
  { id: "agent", title: "AI agent (MCP)", description: "Cursor, Codex, Claude, or any MCP client." },
  { id: "cli", title: "CLI", description: "Shell, scripts, CI." },
  { id: "http", title: "HTTP", description: "Your own agent, app, or automation." },
  { id: "remote", title: "Remote MCP", description: "An OAuth-aware host connected to the remote endpoint." },
];

const CLIENTS: Array<{ id: ClientId; title: string; description: string }> = [
  { id: "cursor", title: "Cursor", description: "Paste the prompt into the agent chat." },
  { id: "codex", title: "Codex", description: "Paste the prompt into Codex." },
  { id: "claude", title: "Claude", description: "Claude with the APIClaw MCP or CLI." },
  { id: "claude-code", title: "Claude Code", description: "Claude Code in the terminal." },
  { id: "chatgpt", title: "ChatGPT", description: "ChatGPT with a connected MCP client." },
  { id: "grok", title: "Grok", description: "Grok with a connected MCP client." },
  { id: "mcp", title: "Other MCP", description: "Any MCP host that can follow SKILL.md." },
];

function stepOf(view: View, door: DoorId): { current: number; total: number } {
  const total = door === "agent" ? 3 : 2;
  if (view === "choose") return { current: 1, total };
  if (view === "client") return { current: 2, total };
  if (view === "launch") return { current: door === "agent" ? 3 : 2, total };
  return { current: total, total };
}

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
    return {
      completedAt: value.completedAt ?? null,
      dismissedAt: value.dismissedAt ?? null,
      firstCallAt: typeof value.firstCallAt === "number" ? value.firstCallAt : null,
    };
  } catch {
    return null;
  }
}

export function OnboardingWizard({ sessionToken }: { sessionToken: string | null }) {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("choose");
  const [door, setDoor] = useState<DoorId>("agent");
  const [client, setClient] = useState<ClientId>("codex");
  const [busy, setBusy] = useState(false);
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [runError, setRunError] = useState<string | null>(null);
  const [resultLine, setResultLine] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstCallIdempotencyKeyRef = useRef<string | null>(null);
  const settlingRef = useRef(false);
  const liftTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;
    fetchOnboardingState(sessionToken).then(async (next) => {
      if (cancelled || !next) return;
      const gate = decideOnboardingGate(next);
      if (gate === "complete") {
        await callMutation("onboarding:complete", { token: sessionToken });
        if (cancelled) return;
        setState({ ...next, completedAt: next.completedAt ?? Date.now() });
        return;
      }
      setState(next);
      if (gate === "open") {
        setOpen(true);
        setView("choose");
      }
    });
    return () => { cancelled = true; };
  }, [sessionToken]);

  useEffect(() => {
    if (!open || !sessionToken) return;
    let cancelled = false;
    const tick = async () => {
      const next = await fetchOnboardingState(sessionToken);
      if (cancelled || !next) return;
      const gate = decideOnboardingGate(next);
      if (gate === "closed" || gate === "complete") {
        await settleActivated(next);
      } else {
        setState(next);
      }
    };
    void tick();
    const id = window.setInterval(() => { void tick(); }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  // settleActivated is current-render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sessionToken]);

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

  useEffect(() => () => {
    if (liftTimerRef.current) window.clearTimeout(liftTimerRef.current);
  }, []);

  if (!sessionToken || !state) return null;

  if (!open && state.dismissedAt && !state.completedAt && !state.firstCallAt) {
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

  async function finish(liveCallCompleted: boolean) {
    if (!sessionToken || settlingRef.current) return;
    settlingRef.current = true;
    setBusy(true);
    await callMutation("onboarding:complete", { token: sessionToken });
    posthog.capture("onboarding_completed", {
      door,
      client: door === "agent" ? client : undefined,
      live_call_completed: liveCallCompleted,
    });
    setState((current) => current ? { ...current, completedAt: Date.now() } : current);
    setOpen(false);
    setBusy(false);
    settlingRef.current = false;
  }

  async function settleActivated(next: OnboardingState) {
    if (settlingRef.current) return;
    settlingRef.current = true;
    setState(next);
    setView("success");
    setRunStatus("success");
    if (!next.completedAt && sessionToken) {
      await callMutation("onboarding:complete", { token: sessionToken });
      posthog.capture("onboarding_completed", {
        door,
        client: door === "agent" ? client : undefined,
        live_call_completed: true,
      });
    }
    setState({
      completedAt: next.completedAt ?? Date.now(),
      dismissedAt: next.dismissedAt,
      firstCallAt: next.firstCallAt,
    });
    if (liftTimerRef.current) window.clearTimeout(liftTimerRef.current);
    liftTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      settlingRef.current = false;
    }, LIFT_AFTER_SUCCESS_MS);
  }

  async function runFirstCall() {
    if (!sessionToken || runStatus === "running") return;
    if (door === "agent") return;
    setRunStatus("running");
    setRunError(null);
    posthog.capture("onboarding_first_call_started", { door });

    try {
      let lastError = "The live call did not complete.";
      for (const rail of BROWSER_FIRST_EXECUTE_RAILS) {
        const idempotencyKey = firstCallIdempotencyKeyRef.current ??
          `onboarding-${rail.provider}-${crypto.randomUUID()}`;
        firstCallIdempotencyKeyRef.current = idempotencyKey;
        const response = await fetch(`${GATEWAY_URL}/v1/execute`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
            "X-APIClaw-Session": sessionToken,
          },
          body: JSON.stringify({
            provider: rail.provider,
            action: rail.action,
            params: rail.params,
          }),
        });
        const payload = await response.json().catch(() => null);
        const succeeded = isOnboardingExecuteSuccess(response.status, payload);
        const status = response.status;
        const definitelyNotDispatched = status >= 400 && status < 500 && status !== 408 && status !== 429;
        if (succeeded || definitelyNotDispatched) {
          firstCallIdempotencyKeyRef.current = null;
        }
        if (succeeded) {
          setResultLine(formatOnboardingExecuteResult(rail.provider, payload) ?? `${rail.provider} ${rail.action} received`);
          setRunStatus("success");
          setView("success");
          posthog.capture("onboarding_first_call_succeeded", {
            door,
            provider: rail.provider,
            action: rail.action,
          });
          return;
        }
        const message = payload?.error?.message || payload?.error || lastError;
        lastError = typeof message === "string" ? message : lastError;
      }
      throw new Error(lastError);
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
  const selectedClient = CLIENTS.find((item) => item.id === client) ?? CLIENTS[0];
  const locked = busy || runStatus === "running";
  const step = stepOf(view, door);

  return (
    <div className={ONBOARDING_OVERLAY_CLASS}>
      <Panel className="flex max-h-[96dvh] w-full max-w-[32rem] flex-col overflow-hidden rounded-b-none sm:max-h-[90vh] sm:rounded-b-[14px]">
        <section role="dialog" aria-modal="true" aria-labelledby="onboarding-title" className="overflow-y-auto p-6 sm:p-7">
          <div className="flex items-center justify-between text-[12.5px] text-[var(--text-muted)]">
            <span className="claw-mono">{step.current} / {step.total}</span>
            <button type="button" onClick={() => void dismiss()} disabled={locked} className="claw-link disabled:opacity-40">
              Later
            </button>
          </div>

          {view === "choose" && (
            <Step
              headingRef={headingRef}
              title="How will you call APIClaw?"
              line="Pick one. You can use the others later."
              action={<button type="button" onClick={() => setView(door === "agent" ? "client" : "launch")} className={btnSolid}>Continue</button>}
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

          {view === "client" && (
            <Step
              headingRef={headingRef}
              title="Which agent do you use?"
              line="Choose the client you will paste the prompt into."
              action={
                <>
                  <button type="button" onClick={() => setView("launch")} className={btnSolid}>Continue</button>
                  <button type="button" onClick={() => setView("choose")} className={btnQuiet}>Back</button>
                </>
              }
            >
              <div role="radiogroup" aria-label="Choose your agent" className="mt-5">
                {CLIENTS.map((item) => {
                  const active = client === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setClient(item.id);
                        posthog.capture("onboarding_client_selected", { client: item.id });
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

          {view === "launch" && door === "agent" && (
            <Step
              headingRef={headingRef}
              title="Send this to your agent"
              line={`Paste into ${selectedClient.title}. The prompt follows SKILL.md, finishes login until whoami prints an email, then runs NASA APOD (Frankfurter if NASA is not 200).`}
              action={<button type="button" onClick={() => setView("client")} className={btnQuiet}>Back</button>}
            >
              <div className="mt-5">
                <CopyLine text={AGENT_FIRST_CALL_PROMPT} prompt="›" label="Copy prompt" className="claw-cmd-wrap" />
              </div>
              <p className="mt-4 flex items-center gap-2 text-[13px] text-[var(--text-muted)]" role="status" aria-live="polite">
                <span className="inline-flex gap-1" aria-hidden="true">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--text-muted)]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--text-muted)] [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--text-muted)] [animation-delay:300ms]" />
                </span>
                {WAITING_FOR_FIRST_CALL}
              </p>
            </Step>
          )}

          {view === "launch" && door !== "agent" && (
            <Step
              headingRef={headingRef}
              title="Run one live call"
              line="NASA APOD, then Frankfurter latest if NASA is not 200. No card."
              action={
                <>
                  {(door === "cli" || door === "http") && (
                    <button type="button" onClick={() => void runFirstCall()} disabled={runStatus === "running"} className={btnSolid}>
                      {runStatus === "running" ? "Running" : runStatus === "error" ? "Retry" : "Run from this browser"}
                    </button>
                  )}
                  <button type="button" onClick={() => setView("choose")} disabled={runStatus === "running"} className={btnQuiet}>Back</button>
                </>
              }
              footer={
                <button type="button" onClick={() => void finish(false)} disabled={locked} className="claw-link text-[12.5px] disabled:opacity-40">
                  {busy ? "Saving" : "Skip, I will run it from my own tool"}
                </button>
              }
            >
              <div className="mt-5">
                <DoorSetup door={door} />
              </div>
              {runStatus === "error" && runError && (
                <p role="alert" className="mt-4 text-[13px] text-[var(--accent)]">{runError}</p>
              )}
            </Step>
          )}

          {view === "success" && (
            <Step
              headingRef={headingRef}
              title="That was APIClaw"
              line={resultLine
                ? `${resultLine}. Credentials handled, usage recorded. Now use it from ${selectedDoor.title}.`
                : `One live call landed. Now use it from ${selectedDoor.title}.`}
              action={
                <button type="button" onClick={() => void finish(true)} disabled={busy} className={btnSolid}>
                  {busy ? "Saving" : "Open workspace"}
                </button>
              }
            >
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
        <CopyLine text={AGENT_FIRST_CALL_PROMPT} prompt="›" label="Copy prompt" />
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
      <p className="text-[12.5px] text-[var(--text-muted)]">Add this endpoint in any OAuth-aware MCP host, then follow https://apiclaw.cloud/SKILL.md.</p>
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

  return (
    <div className="space-y-2">
      <p className="text-[12.5px]"><Status kind="warn">Copy the key now. It cannot be shown again after this tab closes.</Status></p>
      <CopyLine text={httpFirstCallCurl(key)} />
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
