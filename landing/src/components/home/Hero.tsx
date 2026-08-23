"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SKILL_SETUP_LINE } from "./truth";

const LINES: Array<{ k: string; v: React.ReactNode; s: string; ok?: boolean }> = [
  { k: "read", v: <>apiclaw.cloud/<b>SKILL.md</b></>, s: "ok", ok: true },
  { k: "auth", v: <>npx @nordsym/apiclaw <b>auth login</b></>, s: "signed in", ok: true },
  { k: "execute", v: <>POST /v1/execute <b>nasa/apod</b></>, s: "200", ok: true },
  { k: "log", v: <>workspace · provider · cost · latency</>, s: "recorded" },
];

export function Hero() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  const addToAgent = useCallback(() => {
    void navigator.clipboard.writeText(SKILL_SETUP_LINE);
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2400);
  }, []);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  return (
    <section className="claw-container pt-16 pb-20 sm:pt-24 sm:pb-28">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:items-center">
        <div className="max-w-[34rem]">
          <p className="claw-eyebrow mb-6">Execution layer for AI agents</p>
          <h1 className="claw-display text-[2.6rem] sm:text-[3.4rem] lg:text-[3.9rem]">
            Your agent calls real APIs.
            <span className="block">You sign in once.</span>
          </h1>
          <p className="claw-lede mt-6 max-w-[30rem]">
            Discovery and execution through one workspace: every call logged with cost and latency, provider keys never in the agent&rsquo;s hands.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={addToAgent} className="claw-btn claw-btn-solid" aria-live="polite">
              {copied ? "Copied. Paste it to your agent." : "Add APIClaw to your agent"}
            </button>
            <a href="#connect" className="claw-btn claw-btn-quiet">Choose how to connect</a>
          </div>
          <p className="mt-4 text-[13px] text-text-muted">
            Copies the one line your agent needs. No token paste, no provider keys.
          </p>
        </div>

        <figure className="claw-session" aria-label="Example first run from SKILL.md">
          <div className="claw-session-bar">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true">🦞</span>
              <span className="claw-mono">apiclaw · first run</span>
            </span>
            <span className="claw-mono">from SKILL.md</span>
          </div>
          <div className="claw-session-body">
            <div className="claw-session-line prompt" style={{ animationDelay: "80ms" }}>
              <span className="v">{SKILL_SETUP_LINE}</span>
            </div>
            {LINES.map((l, i) => (
              <div key={l.k} className="claw-session-line" style={{ animationDelay: `${360 + i * 260}ms` }}>
                <span className="k">{l.k}</span>
                <span className="v">{l.v}</span>
                <span className={`s${l.ok ? " ok" : ""}`}>{l.s}</span>
              </div>
            ))}
          </div>
        </figure>
      </div>
    </section>
  );
}
