"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Terminal as TerminalIcon,
  Check,
  Copy,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Bot,
  Code2,
  KeyRound,
  ShieldCheck,
  Apple,
} from "lucide-react";

type OS = "mac" | "win" | "linux" | "unknown";

const OS_LABEL: Record<OS, string> = {
  mac: "macOS",
  win: "Windows",
  linux: "Linux",
  unknown: "Universal",
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
  prompt,
  multiline = false,
}: {
  cmd: string;
  prompt?: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  if (multiline) {
    return (
      <div className="relative group">
        <pre className="rounded-xl border border-border bg-surface px-4 py-3 font-mono text-xs sm:text-sm text-text-primary overflow-x-auto">
          {cmd}
        </pre>
        <button
          onClick={handle}
          aria-label="Copy"
          className="absolute top-2 right-2 p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-accent/10 transition opacity-0 group-hover:opacity-100"
        >
          {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    );
  }
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-3 sm:px-4 py-3 font-mono text-xs sm:text-sm overflow-hidden">
      {prompt && <span className="text-accent select-none flex-shrink-0">{prompt}</span>}
      <code className="flex-1 text-text-primary overflow-x-auto whitespace-nowrap scrollbar-none">
        {cmd}
      </code>
      <button
        onClick={handle}
        aria-label="Copy"
        className="flex-shrink-0 p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-accent/10 transition"
      >
        {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-surface-elevated overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 text-left hover:bg-surface transition"
      >
        <span className="font-semibold text-text-primary text-sm sm:text-base">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 space-y-3 text-sm text-text-secondary">
          {children}
        </div>
      )}
    </div>
  );
}

export default function InstallPage() {
  const [os, setOs] = useState<OS>("unknown");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setOs(detectOS());
    const saved = (typeof window !== "undefined" && localStorage.getItem("theme")) || "light";
    const dark = saved === "dark";
    setTheme(dark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-2xl">
              🦞
            </div>
            <span className="font-bold text-xl tracking-tight">APIClaw</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
            <TerminalIcon className="w-4 h-4" />
            Install · {OS_LABEL[os]} detected
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tighter">
            Install <span className="gradient-text">APIClaw</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            One layer for every AI agent. Pick the path that fits your machine — or skip
            install entirely with a workspace key.
          </p>
        </div>
      </section>

      {/* OS Tabs */}
      <section className="px-4 sm:px-6 mb-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-1 mb-5 bg-surface rounded-xl p-1 border border-border">
            {(["mac", "win", "linux"] as OS[]).map((o) => (
              <button
                key={o}
                onClick={() => setOs(o)}
                className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  os === o
                    ? "bg-accent text-white shadow-md shadow-accent/20"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {OS_LABEL[o]}
              </button>
            ))}
          </div>

          {os === "mac" && <MacInstall />}
          {os === "linux" && <LinuxInstall />}
          {os === "win" && <WinInstall />}
          {os === "unknown" && <MacInstall />}

          {/* Verify */}
          <div className="mt-6">
            <h3 className="text-base sm:text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-accent" />
              Verify the install
            </h3>
            <CopyableLine cmd="npx @nordsym/apiclaw --version" prompt="$" />
            <p className="text-xs text-text-muted mt-2">
              Should print a version like <code className="font-mono">2.5.3</code>. Then
              restart Claude Desktop and look for APIClaw in the MCP tools list.
            </p>
          </div>
        </div>
      </section>

      {/* No-terminal path */}
      <section className="px-4 sm:px-6 mb-12">
        <div className="max-w-3xl mx-auto rounded-2xl border border-accent/30 bg-accent/5 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex w-10 h-10 rounded-xl bg-accent text-white items-center justify-center">
              <Download className="w-5 h-5" />
            </span>
            <div>
              <div className="text-sm uppercase tracking-widest text-accent font-semibold">
                No terminal? No problem.
              </div>
              <h3 className="text-xl font-bold text-text-primary">Install for Claude Desktop</h3>
            </div>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Download the <code className="font-mono">.mcpb</code> file. Double-click it.
            Claude Desktop installs it as an extension. No Node.js, no terminal, no
            config file editing.
          </p>
          <a
            href="/apiclaw.mcpb"
            download
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold shadow-lg shadow-accent/20 transition"
          >
            <Download className="w-4 h-4" />
            Download apiclaw.mcpb
          </a>
        </div>
      </section>

      {/* Workspace Key path */}
      <section className="px-4 sm:px-6 mb-12">
        <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-surface-elevated p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex w-10 h-10 rounded-xl bg-accent/10 text-accent items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </span>
            <div>
              <div className="text-sm uppercase tracking-widest text-text-muted font-semibold">
                Building an agent?
              </div>
              <h3 className="text-xl font-bold text-text-primary">
                Skip install. Use a workspace key.
              </h3>
            </div>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Sign up at <code className="font-mono">/workspace</code>, get an{" "}
            <code className="font-mono text-accent">sk-claw-…</code> key, and call{" "}
            <code className="font-mono">/v1/execute</code> from any language. Your agent
            handles the user. APIClaw handles the APIs.
          </p>
          <CopyableLine
            multiline
            cmd={`curl https://api.apiclaw.cloud/v1/execute \\
  -H "Authorization: Bearer sk-claw-..." \\
  -H "Idempotency-Key: first-managed-call" \\
  -H "Content-Type: application/json" \\
  -d '{"provider":"nasa","action":"apod","params":{}}'`}
          />
          <div className="flex flex-wrap gap-3 mt-4">
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold shadow-lg shadow-accent/20 transition"
            >
              Get a workspace key
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface hover:border-accent/40 text-text-primary text-sm font-medium transition"
            >
              API reference
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-accent" />
            Troubleshooting
          </h2>
          <div className="space-y-3">
            <Disclosure title="‘npx’ is not recognized (Windows)">
              <p>
                Node.js is not installed. The install.ps1 script handles this
                automatically — re-run it in PowerShell:
              </p>
              <CopyableLine cmd="iwr -useb https://apiclaw.cloud/install.ps1 | iex" prompt="PS>" />
              <p>
                If that fails (locked-down corporate network), install Node.js LTS
                manually from{" "}
                <a
                  href="https://nodejs.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  nodejs.org
                </a>
                , then re-run.
              </p>
            </Disclosure>
            <Disclosure title="PowerShell execution policy blocks the script">
              <p>Run this once, then retry the install:</p>
              <CopyableLine
                cmd="Set-ExecutionPolicy -Scope Process Bypass -Force"
                prompt="PS>"
              />
            </Disclosure>
            <Disclosure title="winget is not available (Windows < 1809)">
              <p>
                The installer falls through to Chocolatey, then to a direct .msi
                download. If both fail, install Node.js manually from{" "}
                <a
                  href="https://nodejs.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  nodejs.org
                </a>{" "}
                and re-run.
              </p>
            </Disclosure>
            <Disclosure title="‘command not found: brew’ (macOS)">
              <p>
                The installer falls through to a direct .pkg download. If that asks for
                a password and you don't have admin rights, install Node.js LTS via{" "}
                <a
                  href="https://nodejs.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  nodejs.org
                </a>{" "}
                or via{" "}
                <a
                  href="https://github.com/nvm-sh/nvm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  nvm
                </a>
                .
              </p>
            </Disclosure>
            <Disclosure title="My Linux distro isn't auto-detected">
              <p>
                The installer covers apt / dnf / yum / pacman / zypper / apk. For
                anything else, install Node.js 18+ via your package manager, then run:
              </p>
              <CopyableLine cmd="npx -y @nordsym/apiclaw@2.8.7 mcp-install" prompt="$" />
            </Disclosure>
            <Disclosure title="Claude Desktop doesn't see APIClaw after install">
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Quit and relaunch Claude Desktop.</li>
                <li>
                  Open <code className="font-mono">~/Library/Application Support/Claude/claude_desktop_config.json</code>{" "}
                  on macOS or{" "}
                  <code className="font-mono">%APPDATA%\Claude\claude_desktop_config.json</code> on Windows.
                </li>
                <li>
                  Confirm an <code className="font-mono">apiclaw</code> entry under{" "}
                  <code className="font-mono">mcpServers</code>.
                </li>
                <li>
                  If missing, run the install one more time, or paste the snippet from{" "}
                  the home page Three Doors section manually.
                </li>
              </ol>
            </Disclosure>
            <Disclosure title="Behind a corporate proxy / firewall">
              <p>Set npm to your proxy first:</p>
              <CopyableLine cmd="npm config set proxy http://your-proxy:port" prompt="$" />
              <CopyableLine cmd="npm config set https-proxy http://your-proxy:port" prompt="$" />
              <p>
                Then run the installer. If outbound to{" "}
                <code className="font-mono">api.apiclaw.cloud</code> is blocked, the MCP
                client will install but calls will fail — talk to your IT to allowlist
                <code className="font-mono"> apiclaw.cloud</code> and{" "}
                <code className="font-mono">api.apiclaw.cloud</code>.
              </p>
            </Disclosure>
            <Disclosure title="Uninstall">
              <CopyableLine cmd="npx @nordsym/apiclaw mcp-uninstall" prompt="$" />
            </Disclosure>
          </div>

          <div className="mt-10 rounded-2xl border border-border-subtle bg-surface p-5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">Still stuck?</span> File
              an issue at{" "}
              <a
                href="https://github.com/nordsym/apiclaw/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                github.com/nordsym/apiclaw/issues
              </a>{" "}
              with your OS, terminal output, and Node version. We respond fast.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MacInstall() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-text-muted mb-2">
          <Apple className="w-3.5 h-3.5" />
          One-line install · macOS
        </div>
        <CopyableLine
          cmd="curl -fsSL https://apiclaw.cloud/install.sh | bash"
          prompt="$"
        />
        <p className="text-xs text-text-muted mt-2">
          Detects Node.js. Installs via Homebrew, falls through to the official .pkg if
          brew is missing. Then registers the APIClaw MCP server.
        </p>
      </div>
    </div>
  );
}

function LinuxInstall() {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted mb-2">
          One-line install · Linux
        </div>
        <CopyableLine
          cmd="curl -fsSL https://apiclaw.cloud/install.sh | bash"
          prompt="$"
        />
        <p className="text-xs text-text-muted mt-2">
          Detects your package manager: apt, dnf, yum, pacman, zypper, or apk. Installs
          Node.js LTS, then registers the APIClaw MCP server.
        </p>
      </div>
    </div>
  );
}

function WinInstall() {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-text-muted mb-2">
          One-line install · Windows · PowerShell
        </div>
        <CopyableLine
          cmd="iwr -useb https://apiclaw.cloud/install.ps1 | iex"
          prompt="PS>"
        />
        <p className="text-xs text-text-muted mt-2">
          Run in PowerShell (not Command Prompt). Detects Node.js. Installs via winget,
          falls through to Chocolatey, then to a direct MSI. Triggers a UAC prompt only
          if Node is being installed.
        </p>
      </div>
    </div>
  );
}
