'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function DocsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('apiclaw-theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
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
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Home</Link>
            <Link href="/providers" className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Providers</Link>
            <Link href="/earn" className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Earn Credits</Link>
            <a 
              href="https://github.com/nordsym/apiclaw" 
              target="_blank"
              className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
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
                <span className="text-[var(--text-muted)]"># Run directly with npx</span>{'\n'}
                <span className="text-emerald-500 dark:text-emerald-400">npx</span> <span className="text-[var(--accent)]">@nordsym/apiclaw</span>{'\n\n'}
                <span className="text-[var(--text-muted)]"># Or install globally</span>{'\n'}
                <span className="text-emerald-500 dark:text-emerald-400">npm</span> install -g <span className="text-[var(--accent)]">@nordsym/apiclaw</span>{'\n'}
                <span className="text-emerald-500 dark:text-emerald-400">apiclaw</span>
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


        {/* Examples */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-[var(--accent)]">💡</span> Examples
          </h2>
          
          <div className="space-y-6">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Send an SMS</h3>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-[var(--text-muted)]">// Find SMS providers for Sweden</span>{'\n'}
                  <span className="text-purple-600 dark:text-purple-400">discover_apis</span>({'{ '}<span className="text-sky-600 dark:text-sky-400">query</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;send SMS Sweden&quot;</span>{' }'}){'\n\n'}
                  <span className="text-[var(--text-muted)]">// Send via direct-call</span>{'\n'}
                  <span className="text-purple-600 dark:text-purple-400">call_api</span>({'{\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">provider</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;46elks&quot;</span>,{'\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">endpoint</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;sms&quot;</span>,{'\n'}
                  {"  "}<span className="text-sky-600 dark:text-sky-400">params</span>: {'{\n'}
                  {"    "}<span className="text-sky-600 dark:text-sky-400">to</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;+46701234567&quot;</span>,{'\n'}
                  {"    "}<span className="text-sky-600 dark:text-sky-400">message</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;Hello from APIClaw!&quot;</span>{'\n'}
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
              <p className="text-[var(--text-secondary)] mb-4">Search 16,000+ APIs using natural language.</p>
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
                  <li><code className="text-[var(--accent)]">query</code> — Natural language description</li>
                  <li><code className="text-[var(--accent)]">category</code> — Filter: communication, search, ai</li>
                  <li><code className="text-[var(--accent)]">max_results</code> — Number of results (default: 5)</li>
                  <li><code className="text-[var(--accent)]">region</code> — Filter by region (e.g., &quot;sweden&quot;)</li>
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
                  {"  "}<span className="text-sky-600 dark:text-sky-400">api_id</span>: <span className="text-emerald-600 dark:text-emerald-400">&quot;46elks&quot;</span>{'\n'}
                  {'}'})
                </code>
              </pre>
            </div>

            {/* get_connected_providers */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-mono text-[var(--accent)] mb-2">get_connected_providers</h3>
              <p className="text-[var(--text-secondary)] mb-4">List all direct-call providers (no API key needed).</p>
              <pre className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-[var(--text-primary)]">get_connected_providers()</code>
              </pre>
              <div className="mt-4 text-sm text-[var(--text-muted)]">
                <strong className="text-[var(--text-primary)]">Currently available:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><code className="text-[var(--accent)]">brave_search</code> — Web search</li>
                  <li><code className="text-[var(--accent)]">46elks</code> — SMS (Sweden)</li>
                  <li><code className="text-[var(--accent)]">twilio</code> — SMS (Global)</li>
                  <li><code className="text-[var(--accent)]">resend</code> — Email</li>
                  <li><code className="text-[var(--accent)]">openrouter</code> — LLM routing</li>
                  <li><code className="text-[var(--accent)]">elevenlabs</code> — Text-to-speech</li>
                </ul>
              </div>
            </div>

            {/* call_api */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-lg font-mono text-[var(--accent)] mb-2">call_api</h3>
              <p className="text-[var(--text-secondary)] mb-4">Execute an API call through an direct-call provider.</p>
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
              <p className="text-[var(--text-secondary)] mb-4">Browse all API categories (23 main categories).</p>
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
              <li>Direct Connect integration — agents use your API instantly</li>
              <li>Analytics dashboard — see how agents use your API</li>
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
                <a href="mailto:gustav@nordsym.com" className="text-[var(--accent)] hover:underline">gustav@nordsym.com</a>
              </li>
            </ul>
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
