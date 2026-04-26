"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import {
  Star,
  Compass,
  Hammer,
  Send,
  Check,
  X,
  Github,
  Twitter,
  ChevronDown,
  Sparkles,
} from "lucide-react";

type CardId = "star" | "source" | "building" | "share";

const STORAGE_KEY = "apiclaw_contribute_done";

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

function readDone(): Record<CardId, boolean> {
  if (typeof window === "undefined") {
    return { star: false, source: false, building: false, share: false };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { star: false, source: false, building: false, share: false };
    const parsed = JSON.parse(raw);
    return {
      star: !!parsed.star,
      source: !!parsed.source,
      building: !!parsed.building,
      share: !!parsed.share,
    };
  } catch {
    return { star: false, source: false, building: false, share: false };
  }
}

function writeDone(next: Record<CardId, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
}

export function ContributeCards() {
  const [done, setDone] = useState<Record<CardId, boolean>>({
    star: false,
    source: false,
    building: false,
    share: false,
  });

  useEffect(() => {
    setDone(readDone());
  }, []);

  const markDone = (id: CardId) => {
    const next = { ...done, [id]: true };
    setDone(next);
    writeDone(next);
  };

  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <span className="section-label">FIVE SECONDS</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 sm:mt-4 tracking-tighter">
            Help shape APIClaw.
          </h2>
          <p className="text-text-secondary text-base sm:text-lg mt-3 max-w-2xl mx-auto">
            Four small things that genuinely move the project forward. Pick whichever
            fit. None of them ask for your card.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StarCard done={done.star} onDone={() => markDone("star")} />
          <SourceCard done={done.source} onDone={() => markDone("source")} />
          <BuildingCard done={done.building} onDone={() => markDone("building")} />
          <ShareCard done={done.share} onDone={() => markDone("share")} />
        </div>
      </div>
    </section>
  );
}

// ── Card chrome ────────────────────────────────────────────────────────────

function CardShell({
  icon,
  title,
  subtitle,
  done,
  doneLabel = "Thanks!",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  done: boolean;
  doneLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`group relative rounded-2xl border p-5 sm:p-6 flex flex-col min-h-[220px] transition-all ${
        done
          ? "border-accent/30 bg-gradient-to-br from-accent/10 via-surface-elevated to-surface-elevated"
          : "border-border bg-surface-elevated hover:border-accent/40 hover:shadow-[0_0_40px_-15px_rgba(239,68,68,0.4)]"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className={`inline-flex w-10 h-10 rounded-xl items-center justify-center ${
            done
              ? "bg-accent text-white"
              : "bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition"
          }`}
        >
          {done ? <Check className="w-5 h-5" /> : icon}
        </span>
        {done && (
          <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">
            {doneLabel}
          </span>
        )}
      </div>
      <div className="font-bold text-base sm:text-lg text-text-primary leading-tight mb-1">
        {title}
      </div>
      <div className="text-xs sm:text-sm text-text-muted mb-4">{subtitle}</div>
      <div className="mt-auto">{children}</div>
    </div>
  );
}

// ── Card 1 · Star on GitHub ────────────────────────────────────────────────

function StarCard({ done, onDone }: { done: boolean; onDone: () => void }) {
  const handle = () => {
    posthog.capture("contribute_star_clicked");
    window.open("https://github.com/nordsym/apiclaw", "_blank", "noopener,noreferrer");
    onDone();
  };
  return (
    <CardShell
      icon={<Star className="w-5 h-5" />}
      title="Star on GitHub"
      subtitle="Two seconds. Boosts trending. Brings the next agent builder."
      done={done}
      doneLabel="Starred"
    >
      <button
        onClick={handle}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold shadow-md shadow-accent/20 transition"
      >
        <Github className="w-4 h-4" />
        {done ? "Open repo" : "Star nordsym/apiclaw"}
      </button>
    </CardShell>
  );
}

// ── Card 2 · How did you find us ───────────────────────────────────────────

function SourceCard({ done, onDone }: { done: boolean; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = (value: string) => {
    setSubmitting(true);
    posthog.capture("contribute_source_submitted", { source: value });
    setSubmitting(false);
    setOpen(false);
    onDone();
  };

  if (done) {
    return (
      <CardShell
        icon={<Compass className="w-5 h-5" />}
        title="How did you find us?"
        subtitle="Logged. This actually helps us decide where to spend next."
        done
        doneLabel="Logged"
      >
        <div className="text-xs text-text-muted">Edit any time in your workspace.</div>
      </CardShell>
    );
  }

  return (
    <CardShell
      icon={<Compass className="w-5 h-5" />}
      title="How did you find us?"
      subtitle="One click. Helps us decide where to spend next."
      done={false}
    >
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface hover:border-accent/40 text-text-primary text-sm font-medium transition"
        >
          Pick a source
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
      {open && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
            {SOURCE_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setPicked(opt);
                  if (opt !== "Other") submit(opt);
                }}
                className={`text-left px-3 py-2 rounded-lg text-xs sm:text-sm border transition ${
                  picked === opt
                    ? "border-accent bg-accent/10 text-text-primary"
                    : "border-border bg-surface hover:border-accent/30 text-text-secondary"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {picked === "Other" && (
            <div className="flex gap-2">
              <input
                value={other}
                onChange={(e) => setOther(e.target.value)}
                placeholder="Tell us…"
                className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:border-accent"
                maxLength={120}
              />
              <button
                disabled={!other.trim() || submitting}
                onClick={() => submit(`Other: ${other.trim().slice(0, 120)}`)}
                className="px-3 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </CardShell>
  );
}

// ── Card 3 · What are you building ─────────────────────────────────────────

function BuildingCard({ done, onDone }: { done: boolean; onDone: () => void }) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    setSubmitting(true);
    posthog.capture("contribute_building_submitted", { description: value });
    setSubmitting(false);
    onDone();
  };

  if (done) {
    return (
      <CardShell
        icon={<Hammer className="w-5 h-5" />}
        title="What are you building?"
        subtitle="Got it. We read every one of these."
        done
        doneLabel="Sent"
      >
        <div className="text-xs text-text-muted">If it shapes the roadmap, we will reach out.</div>
      </CardShell>
    );
  }

  return (
    <CardShell
      icon={<Hammer className="w-5 h-5" />}
      title="What are you building?"
      subtitle="One sentence. Shapes the roadmap directly."
      done={false}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="A research agent for biotech, a SaaS billing assistant, …"
        rows={2}
        maxLength={240}
        className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-xs sm:text-sm focus:outline-none focus:border-accent resize-none mb-2"
      />
      <button
        disabled={!text.trim() || submitting}
        onClick={submit}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold shadow-md shadow-accent/20 transition disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        Send
      </button>
    </CardShell>
  );
}

// ── Card 4 · Share ─────────────────────────────────────────────────────────

function ShareCard({ done, onDone }: { done: boolean; onDone: () => void }) {
  const tweetText =
    "APIClaw gives my AI agent access to 26,000+ APIs through one gateway. Zero key handling, three access doors (MCP / CLI / HTTP). https://apiclaw.cloud";
  const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(tweetText)}`;
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    "https://apiclaw.cloud"
  )}`;

  const handle = (platform: "x" | "linkedin") => {
    posthog.capture("contribute_share_clicked", { platform });
    window.open(platform === "x" ? xUrl : liUrl, "_blank", "noopener,noreferrer");
    onDone();
  };

  return (
    <CardShell
      icon={<Sparkles className="w-5 h-5" />}
      title="Share APIClaw"
      subtitle="One agent builder you tag is one less zero-API-access agent in the world."
      done={done}
      doneLabel="Shared"
    >
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handle("x")}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold shadow-md shadow-accent/20 transition"
        >
          <Twitter className="w-4 h-4" />
          X
        </button>
        <button
          onClick={() => handle("linkedin")}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-surface hover:border-accent/40 text-text-primary text-sm font-medium transition"
        >
          LinkedIn
        </button>
      </div>
    </CardShell>
  );
}
