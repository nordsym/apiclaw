"use client";

import { useId, useRef, useState } from "react";
import { CopyLine } from "./CopyLine";
import {
  AUTH_LINE,
  CLI_CALL_LINE,
  HTTP_EXECUTE_URL,
  INSTALL_LINE,
  REMOTE_MCP_URL,
  SKILL_SETUP_LINE,
} from "./truth";

type Path = {
  id: string;
  label: string;
  title: string;
  body: string;
  fit: string;
  snippet: React.ReactNode;
  doc: { href: string; label: string };
};

const PATHS: Path[] = [
  {
    id: "skill",
    label: "Skill",
    title: "Hand your agent one line.",
    body: "The agent reads SKILL.md, signs in through your browser with Clerk, and lands its first POST /v1/execute on its own. It never asks you for a token.",
    fit: "Any agent that can read a URL and run a shell.",
    snippet: <CopyLine text={SKILL_SETUP_LINE} prompt="›" />,
    doc: { href: "/SKILL.md", label: "Read SKILL.md" },
  },
  {
    id: "mcp",
    label: "MCP",
    title: "Local MCP server.",
    body: "One script installs the server and opens sign-in. Claude Desktop can also take the one-click .mcpb bundle.",
    fit: "Claude Desktop and other local MCP clients.",
    snippet: (
      <div className="space-y-2">
        <CopyLine text={INSTALL_LINE} />
        <a href="/apiclaw.mcpb" download className="claw-link inline-block text-[13px]">
          Or download apiclaw.mcpb for Claude Desktop
        </a>
      </div>
    ),
    doc: { href: "/install", label: "Install guide" },
  },
  {
    id: "cli",
    label: "CLI",
    title: "Terminal, scripts, CI.",
    body: "Sign in once, then call any provider as provider/action. The CLI maps straight onto POST /v1/execute.",
    fit: "Agents that already live in a repo or pipeline.",
    snippet: (
      <div className="space-y-2">
        <CopyLine text={AUTH_LINE} />
        <CopyLine text={CLI_CALL_LINE} />
      </div>
    ),
    doc: { href: "/docs#cli", label: "CLI docs" },
  },
  {
    id: "http",
    label: "HTTP",
    title: "One endpoint for your own runtime.",
    body: "Authenticate with a workspace key, send provider, action and params. Managed calls take one Idempotency-Key per logical operation.",
    fit: "Server-side agents and custom runtimes.",
    snippet: (
      <pre className="claw-mono whitespace-pre-wrap break-words sm:whitespace-pre sm:overflow-x-auto rounded-[10px] border border-border-subtle bg-surface px-4 py-3.5 text-[12.5px] leading-[1.7] text-text-secondary">
        <span className="text-text-primary">POST</span> {HTTP_EXECUTE_URL}{"\n"}
        Authorization: Bearer <span className="text-text-muted">&lt;workspace key&gt;</span>{"\n"}
        Idempotency-Key: <span className="text-text-muted">&lt;per operation&gt;</span>{"\n"}
        {"\n"}
        {"{"} <span className="text-text-primary">&quot;provider&quot;</span>: &quot;nasa&quot;, <span className="text-text-primary">&quot;action&quot;</span>: &quot;apod&quot;, <span className="text-text-primary">&quot;params&quot;</span>: {"{}"} {"}"}
      </pre>
    ),
    doc: { href: "/docs#gateway", label: "HTTP docs" },
  },
  {
    id: "remote",
    label: "Remote MCP",
    title: "Connect without installing anything.",
    body: "OAuth-capable clients connect to the hosted MCP endpoint through your workspace and get the same tools, logs and limits.",
    fit: "Connected clients and OAuth-capable runtimes.",
    snippet: <CopyLine text={REMOTE_MCP_URL} prompt="›" />,
    doc: { href: "/docs#remote-mcp", label: "Remote MCP docs" },
  },
];

export function Connect() {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const path = PATHS[active];

  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = PATHS.length;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (active + 1) % n;
    if (e.key === "ArrowLeft") next = (active - 1 + n) % n;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = n - 1;
    if (next !== null) {
      e.preventDefault();
      setActive(next);
      tabRefs.current[next]?.focus();
    }
  };

  return (
    <section id="connect" className="scroll-mt-14">
      <div className="claw-container">
        <div className="claw-rule" />
        <div className="py-20 sm:py-28">
          <div className="max-w-[36rem]">
            <p className="claw-eyebrow mb-4">Connect</p>
            <h2 className="claw-h2">Five ways in. One workspace.</h2>
            <p className="claw-lede mt-4">
              Pick the path that matches where your agent runs. The sign-in, the workspace and the logs are the same behind every one.
            </p>
          </div>

          <div className="mt-10">
            <div className="claw-segments w-max" role="tablist" aria-label="Connection paths" onKeyDown={onKeyDown}>
              {PATHS.map((p, i) => (
                <button
                  key={p.id}
                  ref={(el) => { tabRefs.current[i] = el; }}
                  role="tab"
                  id={`${baseId}-tab-${p.id}`}
                  aria-selected={i === active}
                  aria-controls={`${baseId}-panel-${p.id}`}
                  tabIndex={i === active ? 0 : -1}
                  className="claw-segment"
                  onClick={() => setActive(i)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div
              role="tabpanel"
              id={`${baseId}-panel-${path.id}`}
              aria-labelledby={`${baseId}-tab-${path.id}`}
              className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16"
            >
              <div>
                <h3 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-text-primary">{path.title}</h3>
                <p className="mt-3 text-[15px] leading-[1.65] text-text-secondary">{path.body}</p>
                <p className="mt-4 text-[13px] text-text-muted">For: {path.fit}</p>
                <a href={path.doc.href} className="claw-link mt-5 inline-flex items-center gap-1.5 text-[14px] text-text-primary">
                  {path.doc.label}
                  <span aria-hidden="true">→</span>
                </a>
              </div>
              <div className="min-w-0">{path.snippet}</div>
            </div>
          </div>

          <p className="mt-12 text-[13px] text-text-muted">
            Same Clerk sign-in, same workspace, same logs across all five. <span className="claw-mono text-text-secondary">{AUTH_LINE}</span> covers every path.
          </p>
        </div>
      </div>
    </section>
  );
}
