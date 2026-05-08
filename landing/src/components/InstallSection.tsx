"use client";

import { useEffect, useState } from "react";
import {
  Terminal as TerminalIcon,
  Copy,
  Check,
  Download,
  ArrowRight,
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
            Pick a door from the section above. Each one connects to the same workspace.
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

          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            <a
              href="/apiclaw.mcpb"
              download
              className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold text-[13px] shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-accent/25 active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              .mcpb for Claude
            </a>
            <a
              href="/workspace"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface hover:border-accent/40 hover:bg-surface-elevated text-text-primary font-medium text-[13px] transition-all duration-200 active:scale-[0.98]"
            >
              Workspace key
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="/docs"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface hover:border-accent/40 hover:bg-surface-elevated text-text-primary font-medium text-[13px] transition-all duration-200 active:scale-[0.98]"
            >
              Read the docs
            </a>
          </div>
          <p className="text-[11px] text-text-muted mt-4 inline-flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Free email signup required for every door, including discovery.
          </p>
        </div>
      </div>
    </section>
  );
}
