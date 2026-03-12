import Link from "next/link";
import { CheckCircle2, ArrowRight, Sparkles, ShieldCheck, Rocket } from "lucide-react";

const FOUNDING_BACKER_PAYMENT_LINK = "https://buy.stripe.com/fZu00l5084em8SU6X6cMM0u";

export const metadata = {
  title: "Founding Backer Confirmed | APIClaw",
  description: "Your Founding Backer access is active. Welcome to APIClaw.",
};

type SuccessPageProps = {
  searchParams?: {
    session_id?: string;
  };
};

export default function FoundingBackerSuccessPage({ searchParams }: SuccessPageProps) {
  const sessionId = searchParams?.session_id;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-240px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-red-500/15 blur-3xl" />
        <div className="absolute bottom-[-220px] right-[-120px] h-[420px] w-[420px] rounded-full bg-red-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-14 md:px-10 md:py-20">
        <section className="rounded-3xl border border-red-500/30 bg-zinc-950/80 p-8 shadow-[0_0_90px_rgba(239,68,68,0.14)] backdrop-blur md:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300">
            <Sparkles className="h-4 w-4" />
            Founding Backer Confirmed
          </div>

          <h1 className="text-balance text-4xl font-black tracking-tight text-white md:text-5xl">
            You are in.
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-zinc-300">
            Thank you for backing APIClaw early. Your Founding Backer access is active, including free API usage through December 31, 2026.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="mb-2 inline-flex rounded-lg bg-red-500/15 p-2 text-red-300">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-zinc-100">Status</p>
              <p className="mt-1 text-sm text-zinc-400">Payment completed</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="mb-2 inline-flex rounded-lg bg-red-500/15 p-2 text-red-300">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-zinc-100">Access window</p>
              <p className="mt-1 text-sm text-zinc-400">Free usage until 2026-12-31</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="mb-2 inline-flex rounded-lg bg-red-500/15 p-2 text-red-300">
                <Rocket className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-zinc-100">Next step</p>
              <p className="mt-1 text-sm text-zinc-400">Open workspace and start building</p>
            </div>
          </div>

          {sessionId ? (
            <p className="mt-6 font-mono text-xs text-zinc-500">Session: {sessionId}</p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/workspace"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-400"
            >
              Open APIClaw Workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Setup Guides
            </Link>
            <a
              href={FOUNDING_BACKER_PAYMENT_LINK}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
            >
              Founding Backer Link
            </a>
          </div>
        </section>

        <section className="terminal">
          <div className="terminal-header">
            <span className="terminal-dot terminal-dot-red" />
            <span className="terminal-dot terminal-dot-yellow" />
            <span className="terminal-dot terminal-dot-green" />
            <span className="terminal-title">next-steps.sh</span>
          </div>
          <div className="terminal-body">
            <p className="terminal-command">
              <span className="terminal-prompt">$</span> npx @nordsym/apiclaw mcp-install
            </p>
            <p className="terminal-output mt-2">Auto-configures supported MCP clients</p>
            <p className="terminal-command mt-4">
              <span className="terminal-prompt">$</span> codex mcp add apiclaw -- node /path/to/apiclaw/dist/index.js
            </p>
            <p className="terminal-output mt-2">Recommended for local Codex integration</p>
          </div>
        </section>
      </div>
    </main>
  );
}
