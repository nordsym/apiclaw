"use client";

import { CopyLine } from "./CopyLine";
import { SKILL_SETUP_LINE } from "./truth";

const LINES: Array<{ k: string; v: React.ReactNode; s: string; ok?: boolean }> = [
  { k: "read", v: <>apiclaw.cloud/<b>SKILL.md</b></>, s: "ok", ok: true },
  { k: "auth", v: <>npx @nordsym/apiclaw <b>auth login</b></>, s: "signed in", ok: true },
  { k: "execute", v: <>POST /v1/execute <b>nasa/apod</b></>, s: "200", ok: true },
];

export function Hero() {
  return (
    <section className="claw-container pt-16 pb-20 sm:pt-28 sm:pb-28">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:items-center">
        <div className="max-w-[32rem]">
          <h1 className="claw-display text-[2.6rem] sm:text-[3.4rem] lg:text-[3.9rem]">
            Your agent calls real APIs.
            <span className="block">You sign in once.</span>
          </h1>
          <p className="claw-lede mt-6">
            Paste one line to your agent. It signs in, finds the API, and makes the call.
          </p>

          <div className="mt-8 max-w-[26rem]">
            <CopyLine text={SKILL_SETUP_LINE} prompt="›" label="Copy" className="claw-cmd-primary" />
          </div>
          <a href="#connect" className="claw-link mt-5 inline-block text-[14px]">
            Using MCP, CLI or HTTP instead? <span className="text-text-primary">Choose a path ↓</span>
          </a>
        </div>

        <figure className="claw-session" aria-label="What happens after you paste the line">
          <div className="claw-session-bar">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true">🦞</span>
              <span className="claw-mono">first run</span>
            </span>
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
