"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { Star, Compass, Hammer, Sparkles, Check, X, Github, Twitter, ChevronRight, Send } from "lucide-react";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";

const SOURCE_OPTIONS = [
  "Search engine",
  "X / Twitter",
  "Reddit / Hacker News",
  "Friend or colleague",
  "AI agent recommended it",
  "GitHub trending / awesome list",
  "Conference / meetup",
  "Other",
];

interface OnboardingState {
  completedAt: number | null;
  dismissedAt: number | null;
  source: string | null;
  building: string | null;
}

type Step = "source" | "building" | "share" | "doors";

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

export function OnboardingWizard({ sessionToken }: { sessionToken: string | null }) {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("source");
  const [otherText, setOtherText] = useState("");
  const [building, setBuilding] = useState("");
  const [busy, setBusy] = useState(false);

  // Load state on mount.
  useEffect(() => {
    if (!sessionToken) return;
    callQuery("onboarding:getState", { token: sessionToken }).then((s: OnboardingState | null) => {
      if (!s) return;
      setState(s);
      setBuilding(s.building || "");
      // Open wizard if never completed AND never dismissed (first login path).
      if (!s.completedAt && !s.dismissedAt) {
        setOpen(true);
        setStep("source");
      }
    });
  }, [sessionToken]);

  if (!sessionToken || !state) return null;

  // Show toast if dismissed but not completed.
  if (!open && state.dismissedAt && !state.completedAt) {
    return <ResumeToast onResume={() => { setOpen(true); setStep(state.source ? (state.building ? "share" : "building") : "source"); }} />;
  }

  if (!open) return null;

  const skip = async () => {
    setBusy(true);
    await callMutation("onboarding:dismiss", { token: sessionToken });
    setState((s) => (s ? { ...s, dismissedAt: Date.now() } : s));
    setOpen(false);
    setBusy(false);
  };

  const finish = async () => {
    setBusy(true);
    await callMutation("onboarding:complete", { token: sessionToken });
    posthog.capture("onboarding_completed");
    setState((s) => (s ? { ...s, completedAt: Date.now() } : s));
    setOpen(false);
    setBusy(false);
  };

  const submitSource = async (value: string) => {
    setBusy(true);
    posthog.capture("onboarding_source_submitted", { source: value });
    await callMutation("onboarding:setSource", { token: sessionToken, source: value });
    setState((s) => (s ? { ...s, source: value } : s));
    setStep("building");
    setBusy(false);
  };

  const submitBuilding = async () => {
    const value = building.trim();
    if (!value) return;
    setBusy(true);
    posthog.capture("onboarding_building_submitted", { description: value });
    await callMutation("onboarding:setBuilding", { token: sessionToken, building: value });
    setState((s) => (s ? { ...s, building: value } : s));
    setStep("share");
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-2xl overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#ef4444]" />
            <span className="font-semibold">Welcome to APIClaw</span>
          </div>
          <button onClick={skip} disabled={busy} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition" aria-label="Skip">
            <X className="w-5 h-5" />
          </button>
        </header>

        <Progress step={step} />

        <div className="px-6 py-6 min-h-[280px]">
          {step === "source" && (
            <SourceStep onPick={submitSource} otherText={otherText} setOtherText={setOtherText} busy={busy} />
          )}
          {step === "building" && (
            <BuildingStep value={building} setValue={setBuilding} onSubmit={submitBuilding} busy={busy} />
          )}
          {step === "share" && <ShareStep onNext={() => setStep("doors")} />}
          {step === "doors" && <DoorsStep onFinish={finish} busy={busy} />}
        </div>

        <footer className="px-6 py-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <button onClick={skip} disabled={busy} className="hover:text-[var(--text-primary)] transition">
            Skip for now
          </button>
          <span>None of this is required.</span>
        </footer>
      </div>
    </div>
  );
}

function Progress({ step }: { step: Step }) {
  const order: Step[] = ["source", "building", "share", "doors"];
  const idx = order.indexOf(step);
  return (
    <div className="flex gap-1 px-6 pt-4">
      {order.map((s, i) => (
        <div
          key={s}
          className={`h-1 flex-1 rounded-full transition-all ${i <= idx ? "bg-[#ef4444]" : "bg-[var(--border)]"}`}
        />
      ))}
    </div>
  );
}

function SourceStep({ onPick, otherText, setOtherText, busy }: {
  onPick: (v: string) => void;
  otherText: string;
  setOtherText: (s: string) => void;
  busy: boolean;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Compass className="w-5 h-5 text-[#ef4444]" />
        <h3 className="text-lg font-semibold">How did you find us?</h3>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">Helps us decide where to spend next.</p>
      <div className="grid grid-cols-1 gap-1.5 max-h-[200px] overflow-y-auto pr-1">
        {SOURCE_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={busy}
            onClick={() => {
              setPicked(opt);
              if (opt !== "Other") onPick(opt);
            }}
            className={`text-left px-3 py-2 rounded-lg text-sm border transition ${
              picked === opt
                ? "border-[#ef4444] bg-[#ef4444]/10"
                : "border-[var(--border)] bg-[var(--surface)] hover:border-[#ef4444]/40"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {picked === "Other" && (
        <div className="flex gap-2 mt-3">
          <input
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="Tell us…"
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-none focus:border-[#ef4444]"
            maxLength={120}
          />
          <button
            disabled={!otherText.trim() || busy}
            onClick={() => onPick(`Other: ${otherText.trim().slice(0, 120)}`)}
            className="px-3 py-2 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-semibold disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function BuildingStep({ value, setValue, onSubmit, busy }: {
  value: string;
  setValue: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Hammer className="w-5 h-5 text-[#ef4444]" />
        <h3 className="text-lg font-semibold">What are you building?</h3>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">One sentence. Shapes the roadmap directly.</p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="A research agent for biotech, a SaaS billing assistant, …"
        rows={3}
        maxLength={500}
        className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-none focus:border-[#ef4444] resize-none"
      />
      <button
        disabled={!value.trim() || busy}
        onClick={onSubmit}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-semibold disabled:opacity-50"
      >
        Continue <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ShareStep({ onNext }: { onNext: () => void }) {
  const tweet = "APIClaw — the Control Plane for AI Agents. Every model, every API, one runtime. Four doors (MCP · CLI · HTTP · Remote MCP), one workspace. https://apiclaw.cloud";
  const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(tweet)}`;

  const star = () => {
    posthog.capture("onboarding_star_clicked");
    window.open("https://github.com/nordsym/apiclaw", "_blank", "noopener,noreferrer");
  };
  const share = () => {
    posthog.capture("onboarding_share_clicked", { platform: "x" });
    window.open(xUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-5 h-5 text-[#ef4444]" />
        <h3 className="text-lg font-semibold">Help shape APIClaw</h3>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">Two seconds each. Both optional.</p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={star} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[#ef4444]/40 transition">
          <Github className="w-6 h-6 text-[var(--text-primary)]" />
          <span className="text-sm font-medium">Star on GitHub</span>
        </button>
        <button onClick={share} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[#ef4444]/40 transition">
          <Twitter className="w-6 h-6 text-[var(--text-primary)]" />
          <span className="text-sm font-medium">Share on X</span>
        </button>
      </div>
      <button
        onClick={onNext}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-semibold"
      >
        Continue <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function DoorsStep({ onFinish, busy }: { onFinish: () => void; busy: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Check className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold">You&apos;re set up</h3>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Four ways to use APIClaw. One auth, every door — run `apiclaw auth login` once.
      </p>
      <div className="space-y-2">
        <DoorRow title="MCP (local)" desc="Install the .mcpb extension or paste the JSON config. Your agent gets discover_apis, call_api, etc." />
        <DoorRow title="CLI" desc={`apiclaw discover "currency" then apiclaw call apilayer/fixer-latest — for terminal, scripts, CI.`} />
        <DoorRow title="HTTP gateway" desc="export APICLAW_API_KEY=sk-claw-... (the key is written to ~/.apiclaw.toml by auth login). OpenAI-compatible." />
        <DoorRow title="Remote MCP" desc="Point any OAuth-aware host at apiclaw.cloud/mcp. DCR + PKCE handled. Works in Grok and any DCR-compatible client." />
      </div>
      <button
        onClick={onFinish}
        disabled={busy}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-semibold disabled:opacity-50"
      >
        {busy ? "Saving…" : "Done"}
      </button>
    </div>
  );
}

function DoorRow({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
    </div>
  );
}

function ResumeToast({ onResume }: { onResume: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={onResume}
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--surface-elevated)] border border-[#ef4444]/30 shadow-lg hover:border-[#ef4444] transition"
      >
        <Sparkles className="w-4 h-4 text-[#ef4444]" />
        <span className="text-sm font-medium">Finish setup</span>
        <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
      </button>
    </div>
  );
}
