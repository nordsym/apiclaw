"use client";

import { 
  MessageSquare, Mail, Search, Cpu, Volume2, 
  ArrowRight, Zap, Shield, Terminal, ExternalLink,
  Github, Check, Twitter, Quote, Sparkles, Code2, Wallet
} from "lucide-react";

const apis = [
  { name: "46elks", category: "SMS", flag: "🇸🇪", color: "text-blue-400" },
  { name: "Resend", category: "Email", icon: Mail, color: "text-purple-400" },
  { name: "Brave Search", category: "Search", icon: Search, color: "text-orange-400" },
  { name: "OpenRouter", category: "LLM", icon: Cpu, color: "text-cyan-400" },
  { name: "ElevenLabs", category: "TTS", icon: Volume2, color: "text-pink-400" },
];

const testimonials = [
  {
    quote: "Asked for 'SMS API, EU compliant, under $0.01/msg'. Got 4 options ranked by price in 200ms. No more googling.",
    author: "Claude Agent",
    handle: "@autonomous",
    avatar: "🤖"
  },
  {
    quote: "Finally an API directory that speaks MCP. My agent queries capabilities, not product names.",
    author: "Solo Developer",
    handle: "@indie_builder",
    avatar: "🧑‍💻"
  },
  {
    quote: "It's like Perplexity but for APIs. Agent asks, APIClaw answers with structured data.",
    author: "AI Startup Founder",
    handle: "@ai_native",
    avatar: "🚀"
  },
];

const features = [
  {
    icon: Search,
    title: "Discovery",
    description: "Agents query capabilities, not product names. 'I need EU SMS' returns ranked options."
  },
  {
    icon: Code2,
    title: "Evaluation",
    description: "Pricing, rate limits, regions, compliance—all in structured, agent-readable format."
  },
  {
    icon: Wallet,
    title: "Purchase",
    description: "Instant credential provisioning via USDC on Base. No signups. No dashboards."
  },
  {
    icon: Zap,
    title: "Integration",
    description: "MCP-native. Works with Claude, GPT, and any agent that speaks the protocol."
  },
];

const steps = [
  {
    step: "1",
    title: "Agent asks",
    description: '"I need to send SMS"',
    code: `agent.call("apiclaw", {
  capability: "sms",
  region: "EU"
})`,
  },
  {
    step: "2",
    title: "APIClaw returns",
    description: "Ranked options with pricing",
    code: `{
  "apis": [
    { "name": "46elks", "price": "$0.07" },
    { "name": "twilio", "price": "$0.09" }
  ]
}`,
  },
  {
    step: "3",
    title: "Agent purchases",
    description: "Instant credentials via USDC",
    code: `agent.purchase({
  api: "46elks",
  payment: "usdc-base",
  amount: 100
})`,
  },
  {
    step: "4",
    title: "Done",
    description: "API ready to use",
    code: `{
  "status": "active",
  "credentials": { ... },
  "ready": true
}`,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <span className="font-bold text-lg tracking-tight">APIClaw</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-text-muted">
            <a href="#features" className="hover:text-text-primary transition">Features</a>
            <a href="#quick-start" className="hover:text-text-primary transition">Quick Start</a>
            <a href="#apis" className="hover:text-text-primary transition">APIs</a>
            <a href="#pricing" className="hover:text-text-primary transition">Pricing</a>
          </nav>
          <a
            href="https://github.com/nordsym/apiclaw"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary !py-2 !px-4 text-sm"
          >
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="badge mb-8">
            <Terminal className="w-4 h-4" />
            <span>MCP Server for Claude, GPT, and any agent</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tighter">
            <span className="gradient-text">APIs for Agents</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-text-secondary mb-4 max-w-2xl mx-auto leading-relaxed">
            Agents discover, evaluate, and purchase API access directly.
          </p>
          <p className="text-lg text-text-muted mb-12">
            No dashboards. No signups. Just APIs.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a
              href="https://github.com/nordsym/apiclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary glow"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </a>
            <button className="btn-secondary">
              <span>Add to Claude</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-text-muted">
            Apps are dead. API-first. Agent-native.
          </p>
        </div>
      </section>

      {/* Integration badges */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-text-muted text-sm">Integrates with:</span>
            {['46elks', 'Resend', 'Brave', 'OpenRouter', 'ElevenLabs'].map((name, i) => (
              <span key={i} className="integration-badge">{name}</span>
            ))}
            <span className="integration-badge">+ more</span>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* What People Say */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">TESTIMONIALS</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">What People Say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card rounded-2xl p-6">
                <Quote className="w-8 h-8 text-accent/30 mb-4" />
                <p className="text-text-secondary mb-6 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.author}</p>
                    <p className="text-text-muted text-sm">{t.handle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Quick Start */}
      <section id="quick-start" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">QUICK START</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">Up and running in seconds</h2>
          </div>

          <div className="terminal glow-subtle">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
            </div>
            <div className="terminal-body">
              <div className="mb-4">
                <span className="terminal-prompt">$ </span>
                <span className="terminal-command">npx @nordsym/apiclaw init</span>
              </div>
              <div className="terminal-output mb-4">
                ✓ APIClaw MCP server installed<br />
                ✓ Configuration file created<br />
                ✓ Ready to connect to Claude Desktop
              </div>
              <div className="mb-4">
                <span className="terminal-prompt">$ </span>
                <span className="terminal-command">npx @nordsym/apiclaw start</span>
              </div>
              <div className="terminal-output">
                🚀 APIClaw running on MCP<br />
                📡 Listening for agent requests...<br />
                <br />
                <span className="text-accent">→ Add to Claude: Settings → MCP Servers → Add</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <a
              href="https://github.com/nordsym/apiclaw#installation"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline inline-flex items-center gap-2"
            >
              View full documentation
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-surface/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">FEATURES</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">Built for the agentic era</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="card-hover rounded-2xl bg-surface-elevated border border-border p-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">HOW IT WORKS</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">Four lines of agent code</h2>
            <p className="text-text-secondary text-lg mt-4">That's it.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, i) => (
              <div key={i} className="card-hover rounded-2xl bg-surface-elevated border border-border p-6">
                <div className="w-10 h-10 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-text-secondary text-sm mb-4">{item.description}</p>
                <div className="code-block rounded-lg p-3">
                  <pre className="text-xs font-mono text-text-muted overflow-x-auto">
                    {item.code}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Supported APIs */}
      <section id="apis" className="py-24 px-6 bg-surface/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">API CATALOG</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">Supported APIs</h2>
            <p className="text-text-secondary text-lg mt-4">First five. Many more coming.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {apis.map((api, i) => (
              <div
                key={i}
                className="card-hover rounded-xl bg-surface-elevated border border-border p-5 text-center"
              >
                <div className={`w-12 h-12 rounded-xl bg-surface flex items-center justify-center mx-auto mb-3 ${api.color}`}>
                  {api.flag ? (
                    <span className="text-2xl">{api.flag}</span>
                  ) : api.icon ? (
                    <api.icon className="w-6 h-6" />
                  ) : null}
                </div>
                <h3 className="font-semibold">{api.name}</h3>
                <p className="text-text-muted text-sm">{api.category}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-text-muted mt-8">
            + Stripe, Twilio, SendGrid, Anthropic, OpenAI, and more...
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">PRICING</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">Simple pricing</h2>
            <p className="text-text-secondary text-lg mt-4">Pay only for what your agents use.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free tier */}
            <div className="rounded-2xl bg-surface-elevated border border-border p-8">
              <h3 className="text-xl font-semibold mb-2">Free</h3>
              <p className="text-text-secondary mb-6">For exploration and testing</p>
              <div className="text-4xl font-bold mb-6">
                $0<span className="text-lg text-text-muted font-normal">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  API discovery
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  5% transaction fee
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  Community support
                </li>
              </ul>
              <button className="btn-secondary w-full justify-center">
                Get started
              </button>
            </div>

            {/* Pro tier */}
            <div className="rounded-2xl bg-surface-elevated border border-accent/50 p-8 relative glow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-background text-xs font-bold tracking-wide rounded-full uppercase">
                Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <p className="text-text-secondary mb-6">For production agents</p>
              <div className="text-4xl font-bold mb-6">
                $99<span className="text-lg text-text-muted font-normal">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  Everything in Free
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  Only 2% transaction fee
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  Priority support
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  Custom API integrations
                </li>
              </ul>
              <button className="btn-primary w-full justify-center">
                Join waitlist
              </button>
            </div>
          </div>

          {/* USDC Badge */}
          <div className="flex items-center justify-center gap-4 mt-12 px-6 py-4 rounded-xl bg-surface-elevated border border-border max-w-md mx-auto">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">⟠</span>
            </div>
            <div>
              <p className="font-medium">Agents pay with USDC on Base</p>
              <p className="text-sm text-text-muted">Coinbase Agent Wallet compatible</p>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Stay in the Loop */}
      <section className="py-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <span className="section-label">NEWSLETTER</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-4 mb-4 tracking-tight">Stay in the Loop</h2>
          <p className="text-text-secondary mb-8">
            Get updates on new API integrations, agent features, and the future of autonomous commerce.
          </p>
          
          <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="you@company.com"
              className="flex-1 px-4 py-3 rounded-xl text-text-primary"
            />
            <button type="submit" className="btn-primary flex-shrink-0 justify-center">
              <Sparkles className="w-4 h-4" />
              Subscribe
            </button>
          </form>
          
          <p className="text-text-muted text-sm mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-surface/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Ready to go agent-native?</h2>
          <p className="text-text-secondary text-lg mb-8">
            Join the waitlist for early access and shape the future of agent commerce.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://github.com/nordsym/apiclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <Github className="w-5 h-5" />
              Star on GitHub
            </a>
            <button className="btn-secondary">
              Join waitlist
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <span className="font-bold text-lg tracking-tight">APIClaw</span>
              </div>
              <p className="text-text-muted mb-6 max-w-sm">
                The API marketplace built for autonomous agents. Discover, evaluate, and purchase—all without human intervention.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/nordsym/apiclaw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent/50 transition"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com/nordsym"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent/50 transition"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-text-muted">
                <li><a href="#features" className="hover:text-text-primary transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-text-primary transition">Pricing</a></li>
                <li><a href="#apis" className="hover:text-text-primary transition">API Catalog</a></li>
                <li><a href="https://github.com/nordsym/apiclaw#installation" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-text-muted">
                <li><a href="https://nordsym.se" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition">NordSym</a></li>
                <li><a href="https://github.com/nordsym" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition">GitHub</a></li>
                <li><a href="https://twitter.com/nordsym" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition">Twitter</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-muted text-sm">
              © 2026 NordSym. All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              <div className="badge">
                <Shield className="w-3 h-3" />
                MCP Compatible
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
