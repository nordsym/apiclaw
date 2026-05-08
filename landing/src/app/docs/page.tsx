'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

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
            <Link href="/providers/dashboard" className="hidden md:block text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors text-sm md:text-base">Providers</Link>
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

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">
              Documentation
            </span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)]">
            Everything you need to integrate APIClaw into your AI agent.
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-[var(--accent)]">⚡</span> Quick Start
          </h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-6">
            <p className="text-[var(--text-secondary)] mb-4">Get running in 30 seconds:</p>
            <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
              <code className="text-sm">
                <span className="text-[var(--text-muted)]"># Auto-install to Claude Desktop/Code</span>{'\n'}
                curl -fsSL https://apiclaw.cloud/install.sh | bash{'\n\n'}
                <span className="text-[var(--text-muted)]"># Or run the MCP server directly</span>{'\n'}
                <span className="text-emerald-500 dark:text-emerald-400">npx</span> <span className="text-[var(--accent)]">@nordsym/apiclaw</span>
              </code>
            </pre>
          </div>
          <p className="text-[var(--text-secondary)]">
            APIClaw runs as an MCP server. Add it to your Claude Desktop, Cursor, or any MCP-compatible client.
          </p>
        </section>

        {/* MCP Config */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-[var(--accent)]">⚙️</span> MCP Configuration
          </h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
            <p className="text-[var(--text-secondary)] mb-4">Add to your MCP config (e.g., Claude Desktop):</p>
            <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
              <code className="text-sm text-[var(--text-primary)]">
{`{
  "mcpServers": {
    "apiclaw": {
      "command": "npx",
      "args": ["@nordsym/apiclaw"]
    }
  }
}`}
              </code>
            </pre>
          </div>
        </section>

        {/* Codex Setup */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-[var(--accent)]">⌨️</span> Codex (OpenAI CLI)
          </h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <p className="text-[var(--text-secondary)]">
              APIClaw integrates with Codex via its MCP install command. Codex must be installed and available in your PATH.
            </p>
            <div>
              <p className="text-sm font-medium mb-2">Verify Codex install path:</p>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">which codex</code>
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Install APIClaw into Codex:</p>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">npx @nordsym/apiclaw setup --client codex</code>
              </pre>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                This runs <code>codex mcp add apiclaw -- npx -y @nordsym/apiclaw</code> and verifies the install.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Check status:</p>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">npx @nordsym/apiclaw doctor</code>
              </pre>
              <p className="text-xs text-[var(--text-muted)] mt-2">Shows Codex binary path, connection status, and all MCP client configurations.</p>
            </div>
          </div>
        </section>

        {/* Gateway / OpenClaw */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-[var(--accent)]">⚡</span> Intelligent Gateway
          </h2>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 space-y-4">
            <p className="text-[var(--text-secondary)]">
              APIClaw exposes an OpenAI-compatible LLM gateway. Use it from OpenClaw, Cursor, n8n, Codex, or any tool that accepts an OpenAI-style base URL and API key.
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
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Generate in workspace → API Keys</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Environment config (OpenClaw, Cursor, any OpenAI-compatible client):</p>
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

        {/* Examples */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-[var(--accent)]">💡</span> Examples
          </h2>
          
          <div className="space-y-6">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Generate an image</h3>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-[var(--text-muted)]">// Find image-generation providers</span>{'\n'}
                  <span className="text-purple-600 dark:text-purple-400">discover_apis</span>({'{ '}<span className="text-sky-600 dark:text-sky-400">query</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;text to image generation&quot;</span>{' }'}){'\n\n'}
                  <span className="text-[var(--text-muted)]">// Send via APIClaw managed call</span>{'\n'}
                  <span className="text-purple-600 dark:text-purple-400">call_api</span>({'{\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">provider</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;replicate&quot;</span>,{'\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">action</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;flux-schnell&quot;</span>,{'\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">params</span>: {'{\n'}
                  {"    "}<span className="text-sky-600 dark:text-sky-400">prompt</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;a coastal lobster trap at dawn&quot;</span>{'\n'}
                  {"  }"}{'\n'}
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
              <h3 className="text-lg font-semibold mb-4">Generate speech</h3>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-purple-600 dark:text-purple-400">call_api</span>({'{\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">provider</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;elevenlabs&quot;</span>,{'\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">endpoint</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;tts&quot;</span>,{'\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">params</span>: {'{\n'}
                  {"    "}<span className="text-sky-600 dark:text-sky-400">text</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;Hello, I am an AI agent!&quot;</span>,{'\n'}
                  {"    "}<span className="text-sky-600 dark:text-sky-400">voice</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;adam&quot;</span>{'\n'}
                  {"  }"}{'\n'}
                  {'}'})
                </code>
              </pre>
            </div>
          </div>
        </section>

        {/* For Providers */}
        <section className="mb-16">

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
              <p className="text-[var(--text-secondary)] mb-4">Search 5,600+ APIs using natural language.</p>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-purple-600 dark:text-purple-400">discover_apis</span>({'{\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">query</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;send SMS to Sweden&quot;</span>,{'\n'}
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
                  {"  "}<span className="text-sky-600 dark:text-sky-400">api_id</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;replicate&quot;</span>{'\n'}
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
                  <li><code className="text-[var(--accent)]">replicate</code> - Image, audio, ML models</li>
                  <li><code className="text-[var(--accent)]">elevenlabs</code> - Text-to-speech</li>
                  <li><code className="text-[var(--accent)]">brave_search</code> - Web search</li>
                  <li><code className="text-[var(--accent)]">firecrawl</code> - Web scraping</li>
                  <li><code className="text-[var(--accent)]">apilayer</code> - 22 callable APIs (rates, stocks, PDF, etc.)</li>
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
                  {"  "}<span className="text-sky-600 dark:text-sky-400">params</span>: {'{ '}<span className="text-sky-600 dark:text-sky-400">q</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;AI agents 2026&quot;</span>{' }'}{'\n'}
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
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-[var(--accent)]">🤝</span> For API Providers
          </h2>
          <div className="bg-gradient-to-r from-[var(--accent)]/10 to-orange-500/10 border border-[var(--accent)]/20 rounded-xl p-6">
            <p className="text-[var(--text-primary)] mb-4">
              Want your API discoverable by 1000s of AI agents? Join APIClaw as a provider.
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 mb-6">
              <li>Get discovered by AI agents searching for your capabilities</li>
              <li>Direct Connect integration. Agents use your API instantly</li>
              <li>Analytics dashboard. See how agents use your API</li>
              <li>Revenue share on premium tiers</li>
            </ul>
            <Link 
              href="/providers/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--accent)] to-orange-500 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Register as Provider →
            </Link>
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
                <strong>Telegram:</strong>{' '}
                <a href="https://t.me/Symbot_apiclaw_bot" className="text-[var(--accent)] hover:underline">@Symbot_apiclaw_bot</a>
              </li>
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
            APIClaw indexes 26,704 APIs and 2,895 are empirically callable. Adding yours takes one OpenAPI spec and a free email signup.
          </p>

          <ol className="space-y-5 mb-8">
            {[
              {
                n: "01",
                t: "Sign up for a free workspace",
                d: <>Email signup at <a href="/workspace" className="text-[var(--accent)] hover:underline">apiclaw.cloud/workspace</a>. Same workspace covers your discoverable listing and any agent calls you make.</>,
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
