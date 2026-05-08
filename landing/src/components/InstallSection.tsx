"use client";

import { useEffect, useState } from "react";
import {
  Apple,
  Terminal as TerminalIcon,
  Copy,
  Check,
  Download,
  ExternalLink,
  KeyRound,
  Bot,
  Code2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import statsData from "@/lib/stats.json";

type OS = "mac" | "win" | "linux" | "unknown";
type Door = "mcp" | "cli" | "workspace" | "remote";

const ONE_LINERS: Record<OS, { label: string; cmd: string; sub?: string }> = {
  mac: {
    label: "macOS",
    cmd: "curl -fsSL https://apiclaw.cloud/install.sh | bash",
    sub: "Installs Node.js if missing, registers the MCP server.",
  },
  linux: {
    label: "Linux",
    cmd: "curl -fsSL https://apiclaw.cloud/install.sh | bash",
    sub: "apt / dnf / pacman / zypper / apk all supported.",
  },
  win: {
    label: "Windows",
    cmd: "iwr -useb https://apiclaw.cloud/install.ps1 | iex",
    sub: "Run in PowerShell. Installs Node.js via winget if missing.",
  },
  unknown: {
    label: "Universal",
    cmd: "npx -y @nordsym/apiclaw mcp-install",
    sub: "Requires Node.js 18+.",
  },
};

function detectOS(): OS {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || "").toLowerCase();
  if (/mac|darwin|iphone|ipad|ipod/.test(platform) || /mac/.test(ua)) return "mac";
  if (/win/.test(platform) || /windows/.test(ua)) return "win";
  if (/linux|x11|cros/.test(platform) || /linux/.test(ua)) return "linux";
  return "unknown";
}

function CopyableLine({
  cmd,
  prompt = "$",
  className = "",
}: {
  cmd: string;
  prompt?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div
      className={`group flex items-center gap-3 rounded-xl border border-border bg-surface px-3 sm:px-4 py-3 font-mono text-xs sm:text-sm overflow-hidden ${className}`}
    >
      <span className="text-accent select-none flex-shrink-0">{prompt}</span>
      <code className="flex-1 text-text-primary overflow-x-auto whitespace-nowrap scrollbar-none">
        {cmd}
      </code>
      <button
        onClick={handle}
        aria-label="Copy command"
        className="flex-shrink-0 p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-accent/10 transition"
      >
        {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function InstallSection() {
  const [os, setOs] = useState<OS>("unknown");
  const [door, setDoor] = useState<Door>("mcp");

  useEffect(() => {
    setOs(detectOS());
  }, []);

  const oneLiner = ONE_LINERS[os];

  return (
    <section id="install" className="py-20 sm:py-24 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <span className="section-label">INSTALL</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 sm:mt-4 tracking-tighter">
            Four doors. One control plane.
          </h2>
          <p className="text-text-secondary text-base sm:text-lg mt-3 sm:mt-4 max-w-2xl mx-auto">
            Pick the entry point that fits your stack — local MCP client, terminal, your own backend, or a remote OAuth-MCP runtime. Identical workspace, identical auth, identical logs underneath.
          </p>
        </div>

        {/* Quick install card */}
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface-elevated p-5 sm:p-6 mb-10 sm:mb-12 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex w-9 h-9 rounded-lg bg-accent/10 items-center justify-center text-accent">
                <TerminalIcon className="w-5 h-5" />
              </span>
              <div>
                <div className="text-sm font-semibold text-text-primary">
                  Quick install · detected {oneLiner.label}
                </div>
                <div className="text-xs text-text-muted">{oneLiner.sub}</div>
              </div>
            </div>
            <div className="flex gap-1 text-xs bg-surface rounded-lg p-1 border border-border">
              {(["mac", "win", "linux"] as OS[]).map((o) => (
                <button
                  key={o}
                  onClick={() => setOs(o)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    os === o
                      ? "bg-accent text-white"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {ONE_LINERS[o].label}
                </button>
              ))}
            </div>
          </div>

          <CopyableLine
            cmd={oneLiner.cmd}
            prompt={os === "win" ? "PS>" : "$"}
          />

          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <a
              href="/apiclaw.mcpb"
              download
              className="group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm shadow-lg shadow-accent/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Install for Claude Desktop
              <span className="text-[10px] font-mono uppercase tracking-widest bg-white/20 px-1.5 py-0.5 rounded ml-1">
                .mcpb
              </span>
            </a>
            <a
              href="/install"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-surface hover:border-accent/40 hover:bg-surface-elevated text-text-primary font-medium text-sm transition-all"
            >
              Full install guide
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div className="text-[11px] text-text-muted mt-3 text-center sm:text-left">
            No terminal needed with the .mcpb — double-click the file in Claude Desktop.
          </div>
        </div>

        {/* Four doors tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 sm:gap-6">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0">
            <DoorTab
              active={door === "mcp"}
              onClick={() => setDoor("mcp")}
              icon={<Bot className="w-5 h-5" />}
              title="MCP"
              subtitle="Claude Desktop, Cursor, local clients"
              audience="Humans running an existing AI client."
            />
            <DoorTab
              active={door === "cli"}
              onClick={() => setDoor("cli")}
              icon={<Code2 className="w-5 h-5" />}
              title="CLI"
              subtitle="Terminal, scripts, CI/CD"
              audience="Engineers in a shell or pipeline."
            />
            <DoorTab
              active={door === "workspace"}
              onClick={() => setDoor("workspace")}
              icon={<KeyRound className="w-5 h-5" />}
              title="HTTP Gateway"
              subtitle="OpenAI-compatible · sk-claw-…"
              audience="Agent runtimes shipping their own product (OpenClaw, Hermes, your stack)."
            />
            <DoorTab
              active={door === "remote"}
              onClick={() => setDoor("remote")}
              icon={<Sparkles className="w-5 h-5" />}
              title="Remote MCP"
              subtitle="apiclaw.cloud/mcp · OAuth"
              audience="Grok, ChatGPT, Cursor remote — paste one URL."
            />
          </div>

          <div className="rounded-2xl border border-border bg-surface-elevated p-5 sm:p-7 min-h-[360px]">
            {door === "mcp" && <DoorMCP />}
            {door === "cli" && <DoorCLI />}
            {door === "workspace" && <DoorWorkspace />}
            {door === "remote" && <DoorRemote />}
          </div>
        </div>
      </div>
    </section>
  );
}

function DoorTab({
  active,
  onClick,
  icon,
  title,
  subtitle,
  audience,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  audience: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 lg:w-full text-left rounded-xl border px-4 py-3.5 transition-all ${
        active
          ? "border-accent/50 bg-accent/5 shadow-[0_0_30px_-15px_rgba(239,68,68,0.4)]"
          : "border-border bg-surface hover:border-accent/30 hover:bg-surface-elevated"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1">
        <span
          className={`inline-flex w-8 h-8 rounded-lg items-center justify-center ${
            active ? "bg-accent text-white" : "bg-accent/10 text-accent"
          }`}
        >
          {icon}
        </span>
        <div>
          <div
            className={`font-semibold text-sm ${
              active ? "text-text-primary" : "text-text-primary"
            }`}
          >
            {title}
          </div>
          <div className="text-[11px] text-text-muted leading-tight">{subtitle}</div>
        </div>
      </div>
      <div className="text-xs text-text-secondary leading-snug hidden lg:block">
        {audience}
      </div>
    </button>
  );
}

function DoorMCP() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
          MCP — for humans running existing AI clients
        </h3>
        <p className="text-text-secondary text-sm sm:text-base">
          Drop APIClaw into Claude Desktop, Cursor, or any MCP-compatible client. Zero
          code, zero key handling — your AI suddenly speaks {statsData.apiCount.toLocaleString()}+ APIs.
        </p>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted mb-2">
          Option A · One-click (no terminal)
        </div>
        <a
          href="/apiclaw.mcpb"
          download
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold shadow-lg shadow-accent/20 transition"
        >
          <Download className="w-4 h-4" />
          Download apiclaw.mcpb
        </a>
        <div className="text-xs text-text-muted mt-2">
          Double-click the file. Claude Desktop installs it as an extension.
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted mb-2">
          Option B · Terminal
        </div>
        <CopyableLine cmd="npx -y @nordsym/apiclaw mcp-install" />
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted mb-2">
          Or paste this into your MCP config manually
        </div>
        <pre className="rounded-xl border border-border bg-surface p-4 text-xs sm:text-sm font-mono text-text-primary overflow-x-auto">{`{
  "mcpServers": {
    "apiclaw": {
      "command": "npx",
      "args": ["-y", "@nordsym/apiclaw"]
    }
  }
}`}</pre>
      </div>
    </div>
  );
}

function DoorCLI() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
          CLI — for devs in a shell
        </h3>
        <p className="text-text-secondary text-sm sm:text-base">
          Hit any APIClaw-callable provider straight from a terminal, a script, or a CI
          job. Same auth, same gateway, same logs as the MCP path.
        </p>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted mb-2">
          Install
        </div>
        <CopyableLine cmd="npm install -g @nordsym/apiclaw" />
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted mb-2">
          Link your workspace
        </div>
        <CopyableLine cmd="apiclaw login" />
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted mb-2">
          Call any API
        </div>
        <CopyableLine cmd={`apiclaw call openrouter/chat -d '{"model":"auto","messages":[{"role":"user","content":"hi"}]}'`} />
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface p-3 text-xs text-text-muted">
        <span className="font-semibold text-text-secondary">Tip:</span> the CLI is the
        same binary as the MCP server — one install, two ways to use it.
      </div>
    </div>
  );
}

function DoorRemote() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
          Remote MCP — full runtime over OAuth
        </h3>
        <p className="text-text-secondary text-sm sm:text-base">
          Paste one URL into Grok, ChatGPT, Cursor (remote), Claude Desktop, or any OAuth-aware MCP client. RFC 7591 dynamic registration + PKCE + email-verified consent — the client auto-discovers, registers itself, and gets the full control plane: discovery, execution, capability routing, missions, observability.
        </p>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted mb-2">
          Paste this into your client
        </div>
        <CopyableLine cmd="https://apiclaw.cloud/mcp" prompt="MCP" />
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted mb-2">
          What the client receives
        </div>
        <pre className="rounded-xl border border-border bg-surface p-4 text-xs sm:text-sm font-mono text-text-primary overflow-x-auto">{`tools/list  →  19 tools
  discover_apis · get_api_details · list_models
  call_api · capability · check_balance
  start_mission · mission_status · …

initialize  →  full Control Plane handshake
auth        →  Bearer sk-mcp-…  (OAuth 2.1, PKCE, DCR)`}</pre>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted mb-2">
          Pre-shared credentials (alternative to OAuth)
        </div>
        <a
          href="/workspace/integrations"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface hover:border-accent/40 text-text-primary text-sm font-medium transition"
        >
          Generate a connector
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function DoorWorkspace() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
          HTTP Gateway — every model, one endpoint
        </h3>
        <p className="text-text-secondary text-sm sm:text-base">
          The endpoint your agent runtime is already wired for. Anthropic, xAI / Grok, Groq, Mistral, Together, Cohere, OpenRouter (800+), Replicate, ElevenLabs — every model and every provider in the catalog reachable from one base URL with one bearer key. Drop it in behind OpenClaw, Hermes, n8n, your own backend — APIClaw routes the request, holds the credentials, returns the result.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <a
          href="/workspace"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold shadow-lg shadow-accent/20 transition"
        >
          Get a workspace key
          <ArrowRight className="w-4 h-4" />
        </a>
        <a
          href="/docs"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface hover:border-accent/40 text-text-primary text-sm font-medium transition"
        >
          API reference
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted mb-2">
          Any model, one call (OpenAI-compatible Chat API)
        </div>
        <pre className="rounded-xl border border-border bg-surface p-4 text-xs sm:text-sm font-mono text-text-primary overflow-x-auto">{`POST https://api.apiclaw.cloud/v1/chat/completions
Authorization: Bearer sk-claw-…

{
  "model": "anthropic/claude-sonnet-4-6",
  // or "xai/grok-4-fast", "groq/llama-3.3-70b",
  // or "openrouter/auto", "mistral/codestral",
  // or any model returned by /v1/models
  "messages": [{ "role": "user", "content": "..." }]
}`}</pre>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted mb-2">
          Anything else: /v1/call routes by provider + action
        </div>
        <pre className="rounded-xl border border-border bg-surface p-4 text-xs sm:text-sm font-mono text-text-primary overflow-x-auto">{`POST https://api.apiclaw.cloud/v1/call
Authorization: Bearer sk-claw-…

{ "api": "replicate", "path": "/predictions",
  "method": "POST", "body": { "version": "...", "input": {...} } }`}</pre>
      </div>

      <div className="grid sm:grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg border border-border-subtle bg-surface p-2.5">
          <div className="text-text-primary font-semibold mb-0.5">Drop-in for any agent runtime</div>
          <div className="text-text-muted leading-snug">
            OpenClaw, Hermes, custom — swap the base URL, ship.
          </div>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface p-2.5">
          <div className="text-text-primary font-semibold mb-0.5">Server-side credentials</div>
          <div className="text-text-muted leading-snug">
            Provider keys never reach end users.
          </div>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface p-2.5">
          <div className="text-text-primary font-semibold mb-0.5">Per-call observability</div>
          <div className="text-text-muted leading-snug">
            Cost, provider, latency tagged per workspace.
          </div>
        </div>
      </div>
    </div>
  );
}
