"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/home/SiteHeader";
import { SiteFooter } from "@/components/home/SiteFooter";
import { CopyLine } from "@/components/home/CopyLine";

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

const PRE_CLASS =
  "claw-mono whitespace-pre-wrap break-words sm:whitespace-pre sm:overflow-x-auto rounded-[10px] border border-border-subtle bg-surface px-4 py-3.5 text-[12.5px] leading-[1.7] text-text-secondary";

function CopyBlock({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div>
      <pre className={PRE_CLASS}>{cmd}</pre>
      <button
        type="button"
        onClick={handle}
        className="claw-link mt-2 text-[13px]"
        aria-label="Copy snippet"
      >
        {copied ? "Copied" : "Copy snippet"}
      </button>
    </div>
  );
}

function Disclosure({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="claw-disclosure">
      <summary>
        {title}
        <span className="mark" aria-hidden="true" />
      </summary>
      <div className="space-y-3">{children}</div>
    </details>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid gap-3 border-t border-border-subtle pt-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-8">
      <div>
        <div className="claw-mono text-[12px] text-accent">{n}</div>
        <h3 className="mt-1 text-[1.1rem] font-semibold tracking-[-0.02em] text-text-primary">{title}</h3>
      </div>
      <div className="min-w-0 space-y-3">{children}</div>
    </li>
  );
}

const OS_TABS: OS[] = ["mac", "win", "linux"];

export default function InstallPage() {
  const [os, setOs] = useState<OS>("unknown");
  const tabsId = useId();

  useEffect(() => {
    setOs(detectOS());
  }, []);

  const activeTab: OS = os === "unknown" ? "mac" : os;

  return (
    <main className="claw min-h-screen overflow-x-hidden">
      <SiteHeader />

      {/* Hero */}
      <section className="claw-container py-16 sm:py-20">
        <div className="max-w-[38rem]">
          <p className="claw-eyebrow mb-4">Install · {OS_LABEL[os]} detected</p>
          <h1 className="claw-display text-[2.2rem] sm:text-[2.75rem]">Install APIClaw.</h1>
          <p className="claw-lede mt-5">
            One layer for every AI agent. Pick the path that fits your machine, or skip
            install entirely with a workspace key.
          </p>
        </div>
      </section>

      {/* Terminal path */}
      <section className="claw-container">
        <div className="claw-rule" />
        <div className="py-16 sm:py-20">
          <div className="max-w-[36rem]">
            <p className="claw-eyebrow mb-4">Terminal</p>
            <h2 className="claw-h2">Three steps.</h2>
          </div>

          <div className="mt-8 claw-segments w-max" role="tablist" aria-label="Operating system">
            {OS_TABS.map((o) => (
              <button
                key={o}
                role="tab"
                id={`${tabsId}-tab-${o}`}
                aria-selected={activeTab === o}
                aria-controls={`${tabsId}-panel`}
                className="claw-segment"
                onClick={() => setOs(o)}
              >
                {OS_LABEL[o]}
              </button>
            ))}
          </div>

          <ol
            id={`${tabsId}-panel`}
            role="tabpanel"
            aria-labelledby={`${tabsId}-tab-${activeTab}`}
            className="mt-8 space-y-8"
          >
            <Step n="01" title="Install">
              {activeTab === "mac" && <MacInstall />}
              {activeTab === "linux" && <LinuxInstall />}
              {activeTab === "win" && <WinInstall />}
            </Step>

            <Step n="02" title="Sign in">
              <CopyLine text="npx @nordsym/apiclaw auth login" />
              <p className="text-[13px] text-text-muted">
                Required before any managed call. Opens a browser, writes{" "}
                <code className="claw-mono">~/.apiclaw.toml</code>. Headless? Open the printed URL
                on another device.
              </p>
            </Step>

            <Step n="03" title="Verify">
              <CopyLine text="npx @nordsym/apiclaw auth whoami" />
              <p className="text-[13px] text-text-muted">
                Must print your email. Then restart Claude Desktop and try NASA APOD:{" "}
                <code className="claw-mono">call_api</code> with provider{" "}
                <code className="claw-mono">nasa</code>, action <code className="claw-mono">apod</code>.
              </p>
            </Step>
          </ol>
        </div>
      </section>

      {/* No-terminal path */}
      <section className="claw-container">
        <div className="claw-rule" />
        <div className="grid gap-8 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="claw-eyebrow mb-4">No terminal</p>
            <h2 className="claw-h2">Install for Claude Desktop.</h2>
          </div>
          <div>
            <p className="text-[15px] leading-[1.65] text-text-secondary">
              Download the <code className="claw-mono text-[13px] text-text-primary">.mcpb</code> file. Double-click it.
              Claude Desktop installs it as an extension. No Node.js, no terminal, no
              config file editing.
            </p>
            <a href="/apiclaw.mcpb" download className="claw-btn claw-btn-solid mt-6">
              Download apiclaw.mcpb
            </a>
          </div>
        </div>
      </section>

      {/* Workspace Key path */}
      <section className="claw-container">
        <div className="claw-rule" />
        <div className="grid gap-8 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="claw-eyebrow mb-4">Building an agent?</p>
            <h2 className="claw-h2">Skip install. Use a workspace key.</h2>
            <p className="mt-4 text-[15px] leading-[1.65] text-text-secondary">
              Sign up at <code className="claw-mono text-[13px] text-text-primary">/workspace</code>, get an{" "}
              <code className="claw-mono text-[13px] text-text-primary">sk-claw-...</code> key, and call{" "}
              <code className="claw-mono text-[13px] text-text-primary">/v1/execute</code> from any language. Your agent
              handles the user. APIClaw handles the APIs.
            </p>
          </div>
          <div className="min-w-0">
            <CopyBlock
              cmd={`curl https://api.apiclaw.cloud/v1/execute \\
  -H "Authorization: Bearer sk-claw-..." \\
  -H "Idempotency-Key: first-managed-call" \\
  -H "Content-Type: application/json" \\
  -d '{"provider":"nasa","action":"apod","params":{}}'`}
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/workspace" className="claw-btn claw-btn-solid">
                Get a workspace key
              </Link>
              <Link href="/docs" className="claw-btn claw-btn-quiet">
                API reference
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="claw-container">
        <div className="claw-rule" />
        <div className="grid gap-8 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <h2 className="claw-h2">Troubleshooting.</h2>
            <p className="mt-4 text-[15px] leading-[1.65] text-text-secondary">
              <span className="text-text-primary">Still stuck?</span> File an issue at{" "}
              <a
                href="https://github.com/nordsym/apiclaw/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="claw-link underline"
              >
                github.com/nordsym/apiclaw/issues
              </a>{" "}
              with your OS, terminal output, and Node version. We respond fast.
            </p>
          </div>
          <div className="divide-y divide-border-subtle border-y border-border-subtle">
            <Disclosure title="‘npx’ is not recognized (Windows)">
              <p>
                Node.js is not installed. The install.ps1 script handles this
                automatically. Re-run it in PowerShell:
              </p>
              <CopyLine text="iwr -useb https://apiclaw.cloud/install.ps1 | iex" prompt="PS>" />
              <p>
                If that fails (locked-down corporate network), install Node.js LTS
                manually from{" "}
                <a
                  href="https://nodejs.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="claw-link underline"
                >
                  nodejs.org
                </a>
                , then re-run.
              </p>
            </Disclosure>
            <Disclosure title="PowerShell execution policy blocks the script">
              <p>Run this once, then retry the install:</p>
              <CopyLine text="Set-ExecutionPolicy -Scope Process Bypass -Force" prompt="PS>" />
            </Disclosure>
            <Disclosure title="winget is not available (Windows < 1809)">
              <p>
                The installer falls through to Chocolatey, then to a direct .msi
                download. If both fail, install Node.js manually from{" "}
                <a
                  href="https://nodejs.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="claw-link underline"
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
                  className="claw-link underline"
                >
                  nodejs.org
                </a>{" "}
                or via{" "}
                <a
                  href="https://github.com/nvm-sh/nvm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="claw-link underline"
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
              <CopyLine text="npx -y @nordsym/apiclaw@latest mcp-install" />
            </Disclosure>
            <Disclosure title="Claude Desktop doesn't see APIClaw after install">
              <ol className="list-decimal space-y-1.5 pl-5">
                <li>Quit and relaunch Claude Desktop.</li>
                <li>
                  Open <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>{" "}
                  on macOS or{" "}
                  <code>%APPDATA%\Claude\claude_desktop_config.json</code> on Windows.
                </li>
                <li>
                  Confirm an <code>apiclaw</code> entry under <code>mcpServers</code>.
                </li>
                <li>
                  If missing, run the install one more time, or paste the snippet from{" "}
                  the home page Three Doors section manually.
                </li>
              </ol>
            </Disclosure>
            <Disclosure title="Behind a corporate proxy / firewall">
              <p>Set npm to your proxy first:</p>
              <CopyLine text="npm config set proxy http://your-proxy:port" />
              <CopyLine text="npm config set https-proxy http://your-proxy:port" />
              <p>
                Then run the installer. If outbound to{" "}
                <code>api.apiclaw.cloud</code> is blocked, the MCP
                client will install but calls will fail. Talk to your IT to allowlist
                <code> apiclaw.cloud</code> and{" "}
                <code>api.apiclaw.cloud</code>.
              </p>
            </Disclosure>
            <Disclosure title="Uninstall">
              <CopyLine text="npx @nordsym/apiclaw mcp-uninstall" />
            </Disclosure>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function MacInstall() {
  return (
    <>
      <p className="text-[13px] text-text-muted">One-line install · macOS</p>
      <CopyLine text="curl -fsSL https://apiclaw.cloud/install.sh | bash" />
      <p className="text-[13px] text-text-muted">
        Detects Node.js. Installs via Homebrew, falls through to the official .pkg if
        brew is missing. Then registers the APIClaw MCP server.
      </p>
    </>
  );
}

function LinuxInstall() {
  return (
    <>
      <p className="text-[13px] text-text-muted">One-line install · Linux</p>
      <CopyLine text="curl -fsSL https://apiclaw.cloud/install.sh | bash" />
      <p className="text-[13px] text-text-muted">
        Detects your package manager: apt, dnf, yum, pacman, zypper, or apk. Installs
        Node.js LTS, then registers the APIClaw MCP server.
      </p>
    </>
  );
}

function WinInstall() {
  return (
    <>
      <p className="text-[13px] text-text-muted">One-line install · Windows · PowerShell</p>
      <CopyLine text="iwr -useb https://apiclaw.cloud/install.ps1 | iex" prompt="PS>" />
      <p className="text-[13px] text-text-muted">
        Run in PowerShell (not Command Prompt). Detects Node.js. Installs via winget,
        falls through to Chocolatey, then to a direct MSI. Triggers a UAC prompt only
        if Node is being installed.
      </p>
    </>
  );
}
