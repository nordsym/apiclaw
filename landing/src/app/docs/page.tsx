'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import statsData from '@/lib/stats.json';

const docsNav = [
  {
    label: "Install",
    href: "/install",
    note: "Local MCP setup",
  },
  {
    label: "CLI",
    href: "#cli",
    note: "Codex, scripts, CI/CD",
  },
  {
    label: "HTTP",
    href: "#gateway",
    note: "Server-side runtime",
  },
  {
    label: "Remote MCP",
    href: "/sign-in",
    note: "Sign in, then integrations",
  },
  {
    label: "List your API",
    href: "#list-your-api",
    note: "Owner path",
  },
];

export default function DocsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('apiclaw-theme') as 'light' | 'dark' | null;
    // Default to light for docs
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('apiclaw-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-2xl">🦞</span>
            <span className="text-xl font-bold gradient-text-static">
              APIClaw
            </span>
          </Link>
          <nav className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="hidden sm:block text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors text-sm md:text-base">Home</Link>
            <span className="hidden md:block text-[var(--accent)] font-medium text-sm md:text-base">Docs</span>
            <a 
              href="https://github.com/nordsym/apiclaw" 
              target="_blank"
              className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors text-sm md:text-base"
            >
              GitHub
            </a>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-10 items-start">
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)] font-semibold mb-3">
                Pick your path
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Choose the setup that matches how you run agents.
              </p>
              <nav className="space-y-2">
                {docsNav.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group block rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                          {item.label}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">
                          {item.note}
                        </div>
                      </div>
                      <span className="text-[var(--accent)] text-sm">→</span>
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          <main className="min-w-0">
            {/* Hero */}
            <div className="mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="gradient-text">
                  Documentation
                </span>
              </h1>
              <p className="text-xl text-[var(--text-secondary)] max-w-2xl">
                Everything you need to choose a door, set up the right runtime, and connect APIClaw to your agent stack.
              </p>
            </div>

            {/* Install */}
            <section id="install" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-[var(--accent)]">⬇️</span> Install
              </h2>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
                <p className="text-[var(--text-secondary)]">
                  Local MCP setup for Claude Desktop, Cursor, and other local clients. The full OS-specific install flow lives on the install page.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/install"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover,_#dc2626)] text-white text-sm font-semibold transition-colors"
                  >
                    Open install
                    <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--accent)]/40 text-[var(--text-primary)] text-sm font-semibold transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Quick install:</p>
                  <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm">
                      <span className="text-[var(--text-muted)]"># Auto-install to Claude Desktop</span>{'\n'}
                      curl -fsSL https://apiclaw.cloud/install.sh | bash{'\n\n'}
                      <span className="text-[var(--text-muted)]"># Or run the MCP server directly</span>{'\n'}
                      <span className="text-emerald-500 dark:text-emerald-400">npx</span> <span className="text-[var(--accent)]">@nordsym/apiclaw</span>
                    </code>
                  </pre>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  OS-specific commands for macOS, Windows, and Linux live in the install guide. Use this page as the hub, not the full manual.
                </p>
              </div>
            </section>

            {/* CLI alias */}
            <div id="codex" className="scroll-mt-24" aria-hidden />

            {/* Auth */}
            <section id="cli-auth" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-[var(--accent)]">🔑</span> Auth (all four doors)
              </h2>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
                <p className="text-[var(--text-secondary)]">
                  One command, every door. Opens your browser, one-tap sign-in via Clerk (Google or passwordless email), writes <code>~/.apiclaw.toml</code> with mode 0600. The same file is read by the local MCP server, CLI, and HTTP gateway. Remote MCP uses its own OAuth 2.1 + DCR flow.
                </p>
                <div>
                  <p className="text-sm font-medium mb-2">Canonical flow:</p>
                  <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-[var(--text-primary)]">npx @nordsym/apiclaw auth login</code>
                  </pre>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Total time: ~10 seconds if you are already signed into Clerk in your browser. No inbox round-trip, no key copy-paste, no dashboard visit.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Switch accounts:</p>
                  <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-[var(--text-primary)]">npx @nordsym/apiclaw auth login --force</code>
                  </pre>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Show current identity:</p>
                  <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-[var(--text-primary)]">npx @nordsym/apiclaw auth whoami</code>
                  </pre>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Headless server or SSH:</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Run the same login command and open the sign-in URL on a device where you can complete ownership verification.
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-sm font-medium mb-2">For MCP clients — agent_auth_required action</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    When the APIClaw MCP server has no local session, every tool returns a JSON payload with <code>action: &quot;agent_auth_required&quot;</code> and the exact CLI command to run. Agents that recognize this contract can resolve auth without human intervention.
                  </p>
                </div>
              </div>
            </section>

            {/* CLI */}
            <section id="cli" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-[var(--accent)]">⌨️</span> CLI
              </h2>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
                <p className="text-[var(--text-secondary)]">
                  Terminal-native use for Codex, scripts, and CI/CD. Codex is one example, not the whole category. Run <code>apiclaw auth login</code> first (see Auth above), then use the direct commands below.
                </p>
                <div>
                  <p className="text-sm font-medium mb-2">Direct tool parity:</p>
                  <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-[var(--text-primary)]">{`apiclaw discover "currency conversion"
apiclaw details apilayer/fixer-latest
apiclaw call apilayer/fixer-latest --params '{"base":"USD","symbols":"EUR"}'
apiclaw balance`}</code>
                  </pre>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Install APIClaw into Codex / Cursor / Windsurf:</p>
                  <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-[var(--text-primary)]">npx @nordsym/apiclaw setup --client codex   # or --client cursor / windsurf</code>
                  </pre>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Check status:</p>
                  <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-[var(--text-primary)]">npx @nordsym/apiclaw doctor</code>
                  </pre>
                  <p className="text-xs text-[var(--text-muted)] mt-2">Shows CLI path, auth status, connection health, and all client configurations.</p>
                </div>
              </div>
            </section>

            {/* Gateway / OpenClaw */}
            <section id="gateway" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-[var(--accent)]">⚡</span> HTTP
              </h2>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
                <p className="text-[var(--text-secondary)]">
                  Server-side agents and custom runtimes. Use it from OpenClaw or any backend that sends requests with a workspace API key.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Endpoint</p>
                    <code className="text-sm font-mono text-[var(--accent)] break-all">https://api.apiclaw.cloud/v1</code>
                  </div>
                  <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Default model</p>
                    <code className="text-sm font-mono text-[var(--accent)]">apiclaw/openai/gpt-5.4-20260305</code>
                  </div>
                  <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4">
                    <p className="text-xs text-[var(--text-muted)] mb-1">API key</p>
                    <code className="text-sm font-mono text-[var(--accent)]">sk-claw-...</code>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Run <code>apiclaw auth login</code> — key is written to ~/.apiclaw.toml. Or generate one manually in workspace → API Keys.</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Environment config:</p>
                  <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-[var(--text-primary)]">{`OPENAI_BASE_URL=https://api.apiclaw.cloud/v1
OPENAI_API_KEY=sk-claw-<your-workspace-key>`}</code>
                  </pre>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Override route or model per request:</p>
                  <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm text-[var(--text-primary)]">{`X-APIClaw-Route: fastest   # or: best_price, highest_quality, balanced`}</code>
                  </pre>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Response includes <code>_apiclaw</code> metadata: provider used, route reason, model resolved.
                  </p>
                </div>
              </div>
            </section>

            {/* Remote MCP */}
            <section id="remote-mcp" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="text-[var(--accent)]">🔗</span> Remote MCP
              </h2>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
                <p className="text-[var(--text-secondary)]">
                  Connected clients go through your workspace. Sign in first, then open Integrations to add or edit a connector. Grok, ChatGPT, Cursor, and other OAuth-capable clients fit here.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover,_#dc2626)] text-white text-sm font-semibold transition-colors"
                  >
                    Sign in
                    <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href="/workspace/integrations"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--accent)]/40 text-[var(--text-primary)] text-sm font-semibold transition-colors"
                  >
                    Open integrations
                  </Link>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Step 1</p>
                    <p className="text-sm font-semibold">Free email signup</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Required for every door.</p>
                  </div>
                  <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Step 2</p>
                    <p className="text-sm font-semibold">Workspace</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Same auth, same logs, same gateway.</p>
                  </div>
                  <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Step 3</p>
                    <p className="text-sm font-semibold">Integrations</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Generate a connector for your client.</p>
                  </div>
                </div>
              </div>
            </section>

        {/* Examples */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-[var(--accent)]">💡</span> Examples
          </h2>
          
          <div className="space-y-6">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">NASA Astronomy Picture of the Day</h3>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-[var(--text-muted)]">// First managed call — POST /v1/execute</span>{'\n'}
                  <span className="text-purple-600 dark:text-purple-400">call_api</span>({'{\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">provider</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;nasa&quot;</span>,{'\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">action</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;apod&quot;</span>,{'\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">params</span>: {'{}'}{'\n'}
                  {'}'})
                </code>
              </pre>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Search the web</h3>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-purple-600 dark:text-purple-400">call_api</span>({'{\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">provider</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;brave_search&quot;</span>,{'\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">endpoint</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;search&quot;</span>,{'\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">params</span>: {'{ '}<span className="text-sky-600 dark:text-sky-400">query</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;best MCP servers 2026&quot;</span>{' }'}{'\n'}
                  {'}'})
                </code>
              </pre>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Latest EUR exchange rates</h3>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-purple-600 dark:text-purple-400">call_api</span>({'{\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">provider</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;apilayer&quot;</span>,{'\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">action</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;fixer_latest&quot;</span>,{'\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">params</span>: {'{ '}<span className="text-sky-600 dark:text-sky-400">base</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;EUR&quot;</span>{' }'}{'\n'}
                  {'}'})
                </code>
              </pre>
            </div>
          </div>
        </section>

        {/* Tools Reference */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-[var(--accent)]">🔧</span> Tools Reference
          </h2>
          
          <div className="space-y-6">
            {/* apiclaw_help */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-mono text-[var(--accent)] mb-2">apiclaw_help</h3>
              <p className="text-[var(--text-secondary)] mb-4">Get help and see all available commands. Start here if you&apos;re new.</p>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">apiclaw_help()</code>
              </pre>
            </div>

            {/* discover_apis */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-mono text-[var(--accent)] mb-2">discover_apis</h3>
              <p className="text-[var(--text-secondary)] mb-4">Search 26,619 discoverable APIs using natural language.</p>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-purple-600 dark:text-purple-400">discover_apis</span>({'{\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">query</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;send alerts to Sweden&quot;</span>,{'\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">max_results</span>: <span className="text-amber-600 dark:text-amber-400">5</span>{'\n'}
                  {'}'})
                </code>
              </pre>
              <div className="mt-4 text-sm text-[var(--text-muted)]">
                <strong className="text-[var(--text-primary)]">Parameters:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><code className="text-[var(--accent)]">query</code> - Natural language description</li>
                  <li><code className="text-[var(--accent)]">category</code> - Filter: communication, search, ai</li>
                  <li><code className="text-[var(--accent)]">max_results</code> - Number of results (default: 5)</li>
                  <li><code className="text-[var(--accent)]">region</code> - Filter by region (e.g., &quot;sweden&quot;)</li>
                </ul>
              </div>
            </div>

            {/* get_api_details */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-mono text-[var(--accent)] mb-2">get_api_details</h3>
              <p className="text-[var(--text-secondary)] mb-4">Get detailed information about a specific API.</p>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-purple-600 dark:text-purple-400">get_api_details</span>({'{\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">api_id</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;nasa&quot;</span>{'\n'}
                  {'}'})
                </code>
              </pre>
            </div>

            {/* get_connected_providers */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-mono text-[var(--accent)] mb-2">get_connected_providers</h3>
              <p className="text-[var(--text-secondary)] mb-4">List all managed providers (no API key needed).</p>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">get_connected_providers()</code>
              </pre>
              <div className="mt-4 text-sm text-[var(--text-muted)]">
                <strong className="text-[var(--text-primary)]">Currently available:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><code className="text-[var(--accent)]">openrouter</code> - 800+ LLMs</li>
                  <li><code className="text-[var(--accent)]">brave_search</code> - Web search</li>
                  <li><code className="text-[var(--accent)]">github</code> - Read-only GitHub</li>
                  <li><code className="text-[var(--accent)]">nasa</code> - Astronomy Picture of the Day</li>
                  <li><code className="text-[var(--accent)]">apilayer</code> - Fixer latest (EUR base) and other contracted HTTPS rails</li>
                </ul>
              </div>
            </div>

            {/* call_api */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-mono text-[var(--accent)] mb-2">call_api</h3>
              <p className="text-[var(--text-secondary)] mb-4">Execute an API call through a managed provider.</p>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-purple-600 dark:text-purple-400">call_api</span>({'{\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">provider</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;brave_search&quot;</span>,{'\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">endpoint</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;search&quot;</span>,{'\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">params</span>: {'{ '}<span className="text-sky-600 dark:text-sky-400">query</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;AI agents 2026&quot;</span>{' }'}{'\n'}
                  {'}'})
                </code>
              </pre>
            </div>

            {/* list_categories */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-mono text-[var(--accent)] mb-2">list_categories</h3>
              <p className="text-[var(--text-secondary)] mb-4">Browse all API categories (30 main categories).</p>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">list_categories()</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-[var(--accent)]">💬</span> Support
          </h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <p className="text-[var(--text-secondary)] mb-4">Need help? Reach out:</p>
            <ul className="space-y-2 text-[var(--text-primary)]">
              <li>
                <strong>GitHub:</strong>{' '}
                <a href="https://github.com/nordsym/apiclaw/issues" className="text-[var(--accent)] hover:underline">Issues</a>
              </li>
              <li>
                <strong>Email:</strong>{' '}
                <a href="mailto:support_apiclaw@nordsym.com" className="text-[var(--accent)] hover:underline">support_apiclaw@nordsym.com</a>
              </li>
            </ul>
          </div>
        </section>

        {/* List your API */}
        <section id="list-your-api" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
            <span className="text-[var(--accent)]">📡</span> List your API on APIClaw
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            APIClaw indexes {statsData.apiCount.toLocaleString()} APIs and {statsData.sourceVerifiedCount.toLocaleString()} have source-verified definitions. Managed execution readiness is shown separately. Adding yours takes one OpenAPI spec and a free email signup.
          </p>

          <ol className="space-y-5 mb-8">
            {[
              {
                n: "01",
                t: "Use the same workspace",
                d: <>Sign in at <a href="/workspace" className="text-[var(--accent)] hover:underline">apiclaw.cloud/workspace</a>. The same workspace covers your discoverable listing and any agent calls you make.</>,
              },
              {
                n: "02",
                t: "Submit your spec",
                d: <>Open <strong>Workspace → My APIs → Add API</strong>. Paste an OpenAPI 3 / Swagger URL, or describe the endpoint manually. APIClaw normalises auth, parameters, and pricing.</>,
              },
              {
                n: "03",
                t: "Approve the listing",
                d: <>Review the auto-generated capability tags (the keywords agents will match on), the pricing model, and a working example. Edit any field before going live.</>,
              },
              {
                n: "04",
                t: "Live and discoverable",
                d: <>Your API is searchable by <code className="font-mono text-sm bg-[var(--surface-elevated)] px-1.5 py-0.5 rounded">discover_apis</code> immediately. Per-call analytics show in your dashboard from the first agent that calls you.</>,
              },
              {
                n: "05",
                t: "Optional: managed-partner upgrade",
                d: <>Hand APIClaw the credential. We hold custody and agents call without keys. Commercial terms (flat fee, share, or hybrid) are agreed per partner.</>,
              },
            ].map((step) => (
              <li key={step.n} className="flex gap-4">
                <span className="text-[11px] font-mono text-[var(--accent)] mt-1 tracking-widest flex-shrink-0">{step.n}</span>
                <div>
                  <h3 className="font-semibold mb-1">{step.t}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{step.d}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-5 flex flex-wrap items-center gap-4 justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-[var(--accent)] font-semibold mb-1">Always free</div>
              <p className="text-sm text-[var(--text-secondary)]">Listing your API is free. Always. The managed-partner upgrade is opt-in.</p>
            </div>
            <a
              href="/workspace"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover,_#dc2626)] text-white text-sm font-semibold transition-colors"
            >
              List your API
              <span aria-hidden>→</span>
            </a>
          </div>
        </section>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 text-center text-[var(--text-muted)]">
          <p>🦞 APIClaw by <a href="https://nordsym.com" className="text-[var(--accent)] hover:underline">NordSym</a></p>
        </div>
      </footer>
    </div>
  );
}
