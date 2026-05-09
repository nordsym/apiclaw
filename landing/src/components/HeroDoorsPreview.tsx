"use client";

import { useEffect, useState } from "react";
import { Bot, Code2, KeyRound, ArrowDown, Sparkles } from "lucide-react";

type Door = {
  id: "mcp" | "cli" | "http" | "grok";
  label: string;
  audience: string;
  icon: React.ReactNode;
  code: React.ReactNode;
};

const DOORS: Door[] = [
  {
    id: "mcp",
    label: "MCP",
    audience: "Local execution in Claude Desktop and other local MCP clients",
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
    audience: "Terminal-native, scripts, CI/CD",
    icon: <Code2 className="w-4 h-4" />,
    code: (
      <>
        <span className="text-text-muted">$ </span>
        <span className="text-text-primary">apiclaw mission start </span>
        <span className="text-accent">&lt;template&gt;</span>
        <span className="text-text-primary"> --topic </span>
        <span className="text-accent">{`"checkout flow"`}</span>
      </>
    ),
  },
  {
    id: "http",
    label: "HTTP",
    audience: "Server-side agents & custom integrations",
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
  {
    id: "grok",
    label: "Remote MCP",
    audience: "Connected clients and OAuth-capable runtimes",
    icon: <Sparkles className="w-4 h-4" />,
    code: (
      <>
        <span className="text-text-muted">{"// remote MCP - connect through your workspace"}</span>{"\n"}
        <span className="text-text-primary">POST </span>
        <span className="text-accent">apiclaw.cloud/mcp</span>{"\n"}
        <span className="text-text-muted">Authorization: </span>
        <span className="text-accent">Bearer sk-mcp-…</span>{"\n"}
        <span className="text-accent">tools/call </span>
        <span className="text-text-secondary">{"→ start_mission, call_api, …"}</span>
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
            Four doors · one control plane
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
                className={`w-full text-left px-4 sm:px-5 py-4 sm:py-5 transition-all duration-200 relative group ${
                  active
                    ? "bg-accent/5"
                    : "hover:bg-surface hover:pl-5 sm:hover:pl-6"
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
