"use client";

import { useEffect, useState } from "react";
import { Bot, Code2, KeyRound, ArrowDown } from "lucide-react";

type Door = {
  id: "mcp" | "cli" | "http";
  label: string;
  audience: string;
  icon: React.ReactNode;
  code: React.ReactNode;
};

const DOORS: Door[] = [
  {
    id: "mcp",
    label: "MCP",
    audience: "in Claude Desktop, Cursor, any MCP client",
    icon: <Bot className="w-4 h-4" />,
    code: (
      <>
        <span className="text-text-muted">{"// agent.tool"}</span>{"\n"}
        <span className="text-accent">call_api</span>
        <span className="text-text-secondary">{"({ "}</span>
        <span className="text-text-primary">provider</span>
        <span className="text-text-secondary">: </span>
        <span className="text-accent">"elevenlabs"</span>
        <span className="text-text-secondary">, </span>
        <span className="text-text-primary">action</span>
        <span className="text-text-secondary">: </span>
        <span className="text-accent">"tts"</span>
        <span className="text-text-secondary">{", params })"}</span>
      </>
    ),
  },
  {
    id: "cli",
    label: "CLI",
    audience: "in your terminal, scripts, CI",
    icon: <Code2 className="w-4 h-4" />,
    code: (
      <>
        <span className="text-text-muted">$ </span>
        <span className="text-text-primary">apiclaw call </span>
        <span className="text-accent">elevenlabs/tts</span>
        <span className="text-text-primary"> -d </span>
        <span className="text-accent">{`'{"text":"…"}'`}</span>
      </>
    ),
  },
  {
    id: "http",
    label: "HTTP",
    audience: "in your own agent, server-side",
    icon: <KeyRound className="w-4 h-4" />,
    code: (
      <>
        <span className="text-text-muted">{"// fetch"}</span>{"\n"}
        <span className="text-text-primary">POST </span>
        <span className="text-accent">api.apiclaw.cloud/v1/call</span>{"\n"}
        <span className="text-text-muted">Authorization: </span>
        <span className="text-accent">Bearer sk-claw-…</span>
      </>
    ),
  },
];

const ROTATE_MS = 3500;

export function HeroDoorsPreview() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % DOORS.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [paused]);

  const handleClick = (idx: number) => {
    setActiveIdx(idx);
    const target = document.getElementById("install");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className="w-full max-w-full sm:max-w-2xl mx-auto lg:mx-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="rounded-2xl border border-border bg-surface-elevated shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border-subtle bg-surface">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-text-muted font-semibold">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Three doors · one layer
          </div>
          <div className="text-[10px] text-text-muted hidden sm:block">
            {paused ? "paused" : "auto-rotate"}
          </div>
        </div>

        <div className="divide-y divide-border-subtle">
          {DOORS.map((door, idx) => {
            const active = idx === activeIdx;
            return (
              <button
                key={door.id}
                onClick={() => handleClick(idx)}
                className={`w-full text-left px-4 sm:px-5 py-4 sm:py-5 transition-all relative ${
                  active
                    ? "bg-accent/5"
                    : "hover:bg-surface"
                }`}
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all ${
                    active ? "bg-accent" : "bg-transparent"
                  }`}
                />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex w-7 h-7 rounded-lg items-center justify-center transition ${
                        active
                          ? "bg-accent text-white"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      {door.icon}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-text-primary leading-none">
                        {door.label}
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {door.audience}
                      </div>
                    </div>
                  </div>
                  {active && (
                    <span className="text-[10px] uppercase tracking-widest text-accent font-semibold animate-[fadeIn_0.3s_ease-out_forwards]">
                      live
                    </span>
                  )}
                </div>
                <pre
                  className={`font-mono text-[12px] sm:text-[13px] leading-relaxed pl-9 whitespace-pre-wrap break-all ${
                    active ? "text-text-primary" : "text-text-secondary"
                  }`}
                >
                  {door.code}
                </pre>
              </button>
            );
          })}
        </div>

        <a
          href="#install"
          className="flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-text-muted hover:text-accent border-t border-border-subtle bg-surface transition"
        >
          Install for your stack
          <ArrowDown className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
