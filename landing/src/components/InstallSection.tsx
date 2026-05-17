"use client";

import { useEffect, useState } from "react";
import {
  Terminal as TerminalIcon,
  Copy,
  Check,
  Download,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

type OS = "mac" | "win" | "linux" | "unknown";

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

// Cursor deeplink for one-click MCP install (Cursor accepts a base64-encoded
// JSON config in the cursor:// protocol).
const CURSOR_CONFIG = btoa(
  JSON.stringify({
    "@nordsym/apiclaw": {
      command: "npx",
      args: ["-y", "@nordsym/apiclaw"],
    },
  })
);
const CURSOR_DEEPLINK = `cursor://anysphere.cursor-mcp/install?name=apiclaw&config=${CURSOR_CONFIG}`;

const GENERIC_MCP_JSON = `{
  "mcpServers": {
    "apiclaw": {
      "command": "npx",
      "args": ["-y", "@nordsym/apiclaw"]
    }
  }
}`;

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

function CopyableBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-xl border border-border bg-surface p-3 font-mono text-xs">
      <button
        onClick={handle}
        aria-label="Copy snippet"
        className="absolute top-2 right-2 p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-accent/10 transition"
      >
        {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
      </button>
      <pre className="text-text-primary whitespace-pre overflow-x-auto pr-8 scrollbar-none">{text}</pre>
    </div>
  );
}

export function InstallSection() {
  const [os, setOs] = useState<OS>("unknown");
  const [snippetOpen, setSnippetOpen] = useState(false);

  useEffect(() => {
    setOs(detectOS());
  }, []);

  const oneLiner = ONE_LINERS[os];

  return (
    <section id="install" className="py-20 sm:py-24 px-4 sm:px-6 relative">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 sm:mb-10">
          <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted font-medium">Get installed</span>
          <h2 className="text-3xl sm:text-4xl md:text-[2.75rem] font-semibold mt-3 tracking-[-0.02em] leading-[1.1]">
            Up and running in 30 seconds.
          </h2>
          <p className="text-text-secondary text-base sm:text-lg mt-3 leading-relaxed">
            One install, one auth. The same workspace works across all four doors — local MCP, CLI, HTTP, Remote MCP.
          </p>
        </div>

        {/* Quick install card */}
        <div className="rounded-2xl border border-border bg-surface-elevated p-5 sm:p-6 shadow-xl transition-all duration-200 hover:shadow-[0_20px_60px_-20px_rgba(239,68,68,0.18)]">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex w-9 h-9 rounded-lg bg-accent/10 items-center justify-center text-accent">
                <TerminalIcon className="w-5 h-5" />
              </span>
              <div>
                <div className="text-sm font-semibold text-text-primary">
                  1. Install · detected {oneLiner.label}
                </div>
                <div className="text-xs text-text-muted">{oneLiner.sub}</div>
              </div>
            </div>
            <div className="flex gap-1 text-xs bg-surface rounded-lg p-1 border border-border">
              {(["mac", "win", "linux"] as OS[]).map((o) => (
                <button
                  key={o}
                  onClick={() => setOs(o)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
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

          {/* Alternate install paths */}
          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            <a
              href="/apiclaw.mcpb"
              download
              className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-[13px] shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-accent/25 active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              .mcpb for Claude Desktop
            </a>
            <a
              href={CURSOR_DEEPLINK}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface hover:border-accent/40 hover:bg-surface-elevated text-text-primary font-medium text-[13px] transition-all duration-200 active:scale-[0.98]"
            >
              Add to Cursor
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setSnippetOpen((v) => !v)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface hover:border-accent/40 hover:bg-surface-elevated text-text-primary font-medium text-[13px] transition-all duration-200 active:scale-[0.98]"
            >
              Other MCP clients
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${snippetOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {snippetOpen && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-text-muted">
                Paste this into your MCP client config (Windsurf, Continue, Zed, custom backends):
              </p>
              <CopyableBlock text={GENERIC_MCP_JSON} />
            </div>
          )}
        </div>

        {/* Step 2: auth login — the canonical agent-native flow */}
        <div className="rounded-2xl border border-border bg-surface-elevated p-5 sm:p-6 shadow-xl mt-4 transition-all duration-200 hover:shadow-[0_20px_60px_-20px_rgba(239,68,68,0.18)]">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="inline-flex w-9 h-9 rounded-lg bg-accent/10 items-center justify-center text-accent">
              <TerminalIcon className="w-5 h-5" />
            </span>
            <div>
              <div className="text-sm font-semibold text-text-primary">
                2. Authenticate · once, for every door
              </div>
              <div className="text-xs text-text-muted">
                Opens your browser, one-tap sign-in via Clerk, writes ~/.apiclaw.toml.
              </div>
            </div>
          </div>
          <CopyableLine cmd="npx @nordsym/apiclaw auth login" prompt="$" />
          <p className="text-[11px] text-text-muted mt-4 inline-flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Same auth across MCP, CLI, HTTP gateway, and Remote MCP. No dashboard visit, no key copy-paste, no inbox round-trip.
          </p>
          <p className="text-[11px] text-text-muted mt-2">
            On a headless server or SSH? Add <code className="text-accent">--email-fallback</code> for the magic-link flow.
          </p>
        </div>
      </div>
    </section>
  );
}
