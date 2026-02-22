'use client';

import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-2xl">🦞</span>
            <span className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              APIClaw
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">Home</Link>
            <Link href="/providers" className="text-gray-400 hover:text-white transition-colors">Providers</Link>
            <a 
              href="https://github.com/nordsym/apiclaw" 
              target="_blank"
              className="text-gray-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Documentation
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Everything you need to integrate APIClaw into your AI agent.
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-red-400">⚡</span> Quick Start
          </h2>
          <div className="bg-[#12121a] border border-white/10 rounded-xl p-6 mb-6">
            <p className="text-gray-400 mb-4">Get running in 30 seconds:</p>
            <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto">
              <code className="text-sm">
                <span className="text-gray-500"># Run directly with npx</span>{'\n'}
                <span className="text-green-400">npx</span> <span className="text-orange-400">@nordsym/apiclaw</span>{'\n\n'}
                <span className="text-gray-500"># Or install globally</span>{'\n'}
                <span className="text-green-400">npm</span> install -g <span className="text-orange-400">@nordsym/apiclaw</span>{'\n'}
                <span className="text-green-400">apiclaw</span>
              </code>
            </pre>
          </div>
          <p className="text-gray-400">
            APIClaw runs as an MCP server. Add it to your Claude Desktop, Cursor, or any MCP-compatible client.
          </p>
        </section>

        {/* MCP Config */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-red-400">⚙️</span> MCP Configuration
          </h2>
          <div className="bg-[#12121a] border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 mb-4">Add to your MCP config (e.g., Claude Desktop):</p>
            <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto">
              <code className="text-sm">
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

        {/* Tools Reference */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-red-400">🔧</span> Tools Reference
          </h2>
          
          <div className="space-y-6">
            {/* apiclaw_help */}
            <div className="bg-[#12121a] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-mono text-orange-400 mb-2">apiclaw_help</h3>
              <p className="text-gray-400 mb-4">Get help and see all available commands. Start here if you&apos;re new.</p>
              <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-gray-300">apiclaw_help()</code>
              </pre>
            </div>

            {/* discover_apis */}
            <div className="bg-[#12121a] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-mono text-orange-400 mb-2">discover_apis</h3>
              <p className="text-gray-400 mb-4">Search 10,000+ APIs using natural language.</p>
              <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-purple-400">discover_apis</span>({'{\n'}
                  {"  "}<span className="text-blue-400">query</span>: <span className="text-green-400">&quot;send SMS to Sweden&quot;</span>,{'\n'}
                  {"  "}<span className="text-blue-400">max_results</span>: <span className="text-yellow-400">5</span>{'\n'}
                  {'}'})
                </code>
              </pre>
              <div className="mt-4 text-sm text-gray-500">
                <strong>Parameters:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><code className="text-orange-400">query</code> — Natural language description</li>
                  <li><code className="text-orange-400">category</code> — Filter: communication, search, ai</li>
                  <li><code className="text-orange-400">max_results</code> — Number of results (default: 5)</li>
                  <li><code className="text-orange-400">region</code> — Filter by region (e.g., &quot;sweden&quot;)</li>
                </ul>
              </div>
            </div>

            {/* get_api_details */}
            <div className="bg-[#12121a] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-mono text-orange-400 mb-2">get_api_details</h3>
              <p className="text-gray-400 mb-4">Get detailed information about a specific API.</p>
              <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-purple-400">get_api_details</span>({'{\n'}
                  {"  "}<span className="text-blue-400">api_id</span>: <span className="text-green-400">&quot;46elks&quot;</span>{'\n'}
                  {'}'})
                </code>
              </pre>
            </div>

            {/* get_connected_providers */}
            <div className="bg-[#12121a] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-mono text-orange-400 mb-2">get_connected_providers</h3>
              <p className="text-gray-400 mb-4">List all instant-connect providers (no API key needed).</p>
              <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-gray-300">get_connected_providers()</code>
              </pre>
              <div className="mt-4 text-sm text-gray-500">
                <strong>Currently available:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><code className="text-orange-400">brave_search</code> — Web search</li>
                  <li><code className="text-orange-400">46elks</code> — SMS (Sweden)</li>
                  <li><code className="text-orange-400">twilio</code> — SMS (Global)</li>
                  <li><code className="text-orange-400">resend</code> — Email</li>
                  <li><code className="text-orange-400">openrouter</code> — LLM routing</li>
                  <li><code className="text-orange-400">elevenlabs</code> — Text-to-speech</li>
                </ul>
              </div>
            </div>

            {/* call_api */}
            <div className="bg-[#12121a] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-mono text-orange-400 mb-2">call_api</h3>
              <p className="text-gray-400 mb-4">Execute an API call through an instant-connect provider.</p>
              <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-purple-400">call_api</span>({'{\n'}
                  {"  "}<span className="text-blue-400">provider</span>: <span className="text-green-400">&quot;brave_search&quot;</span>,{'\n'}
                  {"  "}<span className="text-blue-400">endpoint</span>: <span className="text-green-400">&quot;search&quot;</span>,{'\n'}
                  {"  "}<span className="text-blue-400">params</span>: {'{ '}<span className="text-blue-400">q</span>: <span className="text-green-400">&quot;AI agents 2026&quot;</span>{' }'}{'\n'}
                  {'}'})
                </code>
              </pre>
            </div>

            {/* list_categories */}
            <div className="bg-[#12121a] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-mono text-orange-400 mb-2">list_categories</h3>
              <p className="text-gray-400 mb-4">Browse all 446 API categories.</p>
              <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-gray-300">list_categories()</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Examples */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-red-400">💡</span> Examples
          </h2>
          
          <div className="space-y-6">
            <div className="bg-[#12121a] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Send an SMS</h3>
              <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-gray-500">// Find SMS providers for Sweden</span>{'\n'}
                  <span className="text-purple-400">discover_apis</span>({'{ '}<span className="text-blue-400">query</span>: <span className="text-green-400">&quot;send SMS Sweden&quot;</span>{' }'}){'\n\n'}
                  <span className="text-gray-500">// Send via instant-connect</span>{'\n'}
                  <span className="text-purple-400">call_api</span>({'{\n'}
                  {"  "}<span className="text-blue-400">provider</span>: <span className="text-green-400">&quot;46elks&quot;</span>,{'\n'}
                  {"  "}<span className="text-blue-400">endpoint</span>: <span className="text-green-400">&quot;sms&quot;</span>,{'\n'}
                  {"  "}<span className="text-blue-400">params</span>: {'{\n'}
                  {"    "}<span className="text-blue-400">to</span>: <span className="text-green-400">&quot;+46701234567&quot;</span>,{'\n'}
                  {"    "}<span className="text-blue-400">message</span>: <span className="text-green-400">&quot;Hello from APIClaw!&quot;</span>{'\n'}
                  {"  }"}{'\n'}
                  {'}'})
                </code>
              </pre>
            </div>

            <div className="bg-[#12121a] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Search the web</h3>
              <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-purple-400">call_api</span>({'{\n'}
                  {"  "}<span className="text-blue-400">provider</span>: <span className="text-green-400">&quot;brave_search&quot;</span>,{'\n'}
                  {"  "}<span className="text-blue-400">endpoint</span>: <span className="text-green-400">&quot;search&quot;</span>,{'\n'}
                  {"  "}<span className="text-blue-400">params</span>: {'{ '}<span className="text-blue-400">q</span>: <span className="text-green-400">&quot;best MCP servers 2026&quot;</span>{' }'}{'\n'}
                  {'}'})
                </code>
              </pre>
            </div>

            <div className="bg-[#12121a] border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Generate speech</h3>
              <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm">
                  <span className="text-purple-400">call_api</span>({'{\n'}
                  {"  "}<span className="text-blue-400">provider</span>: <span className="text-green-400">&quot;elevenlabs&quot;</span>,{'\n'}
                  {"  "}<span className="text-blue-400">endpoint</span>: <span className="text-green-400">&quot;tts&quot;</span>,{'\n'}
                  {"  "}<span className="text-blue-400">params</span>: {'{\n'}
                  {"    "}<span className="text-blue-400">text</span>: <span className="text-green-400">&quot;Hello, I am an AI agent!&quot;</span>,{'\n'}
                  {"    "}<span className="text-blue-400">voice</span>: <span className="text-green-400">&quot;adam&quot;</span>{'\n'}
                  {"  }"}{'\n'}
                  {'}'})
                </code>
              </pre>
            </div>
          </div>
        </section>

        {/* For Providers */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-red-400">🤝</span> For API Providers
          </h2>
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-6">
            <p className="text-gray-300 mb-4">
              Want your API discoverable by 1000s of AI agents? Join APIClaw as a provider.
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 mb-6">
              <li>Get discovered by AI agents searching for your capabilities</li>
              <li>Direct Connect integration — agents use your API instantly</li>
              <li>Analytics dashboard — see how agents use your API</li>
              <li>Revenue share on premium tiers</li>
            </ul>
            <Link 
              href="/providers/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Register as Provider →
            </Link>
          </div>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-red-400">💬</span> Support
          </h2>
          <div className="bg-[#12121a] border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 mb-4">Need help? Reach out:</p>
            <ul className="space-y-2 text-gray-300">
              <li>
                <strong>Telegram:</strong>{' '}
                <a href="https://t.me/Symbot_apiclaw_bot" className="text-orange-400 hover:underline">@Symbot_apiclaw_bot</a>
              </li>
              <li>
                <strong>GitHub:</strong>{' '}
                <a href="https://github.com/nordsym/apiclaw/issues" className="text-orange-400 hover:underline">Issues</a>
              </li>
              <li>
                <strong>Email:</strong>{' '}
                <a href="mailto:gustav@nordsym.com" className="text-orange-400 hover:underline">gustav@nordsym.com</a>
              </li>
            </ul>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 text-center text-gray-500">
          <p>🦞 APIClaw by <a href="https://nordsym.com" className="text-orange-400 hover:underline">NordSym</a></p>
        </div>
      </footer>
    </div>
  );
}
