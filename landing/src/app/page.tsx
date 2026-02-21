"use client";

import { 
  ArrowRight, Zap, Shield, Terminal, ExternalLink,
  Github, Check, Twitter, Sparkles, Code2, Link, Sun, Moon,
  Bot, Building2, Search, Rocket, Clock, Globe, Database,
  Play, ChevronRight, Star, Users, Cpu, Activity
} from "lucide-react";
import statsData from "@/lib/stats.json";
import { useState, useEffect, useRef } from "react";

const stats = [
  { number: statsData.apiCount.toLocaleString(), label: "APIs Indexed", live: true },
  { number: statsData.categoryCount.toString(), label: "Categories", live: true },
  { number: "<200ms", label: "Response Time", live: false },
  { number: "24/7", label: "Live Registry", live: false },
];

const trustedBy = [
  "Claude Agents",
  "GPT Builders", 
  "AutoGPT",
  "LangChain",
  "CrewAI",
  "Indie Hackers",
];

const howItWorks = [
  {
    step: "1",
    title: "Agent Asks",
    description: "Your agent queries APIClaw for a capability—not a product name.",
    icon: Search,
    code: `// Agent needs to send SMS
mcp.call("apiclaw", {
  capability: "sms",
  region: "EU",
  maxPrice: "$0.10"
})`,
  },
  {
    step: "2",
    title: "APIClaw Matches",
    description: "We search 4,500+ APIs and return ranked options with full metadata.",
    icon: Database,
    code: `// Structured response
{
  "matches": [
    { "name": "46elks", "price": "$0.07", "region": "EU" },
    { "name": "Twilio", "price": "$0.09", "region": "Global" }
  ],
  "bestMatch": "46elks"
}`,
  },
  {
    step: "3",
    title: "Agent Integrates",
    description: "Full specs, auth details, endpoints—everything to start building.",
    icon: Rocket,
    code: `// Get full API spec
const spec = await mcp.call("apiclaw", {
  action: "get_spec",
  api: "46elks"
})
// → docs, auth, endpoints, examples`,
  },
];

const agentBenefits = [
  {
    icon: Search,
    title: "Semantic Search",
    description: "Query by capability, not keywords. 'I need EU-compliant SMS' returns perfect matches.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Sub-200ms responses. Your agent doesn't wait, it acts.",
  },
  {
    icon: Database,
    title: "Structured Data",
    description: "JSON responses with pricing, limits, regions, auth—everything an agent needs.",
  },
  {
    icon: Shield,
    title: "MCP Native",
    description: "Built for Model Context Protocol. Works with Claude, GPT, and any compatible agent.",
  },
];

const providerBenefits = [
  {
    icon: Users,
    title: "Reach AI Agents",
    description: "Get discovered by thousands of autonomous agents looking for APIs like yours.",
  },
  {
    icon: Globe,
    title: "Global Visibility",
    description: "Your API appears in searches across all MCP-compatible platforms.",
  },
  {
    icon: Cpu,
    title: "Agent-Optimized Listing",
    description: "We structure your API data so agents can understand and integrate it instantly.",
  },
  {
    icon: Clock,
    title: "Zero Maintenance",
    description: "List once, we keep it updated. No ongoing work required.",
  },
];

const terminalLines = [
  { type: "prompt", text: "npx @nordsym/apiclaw" },
  { type: "output", text: "", delay: 500 },
  { type: "output", text: "🦞 APIClaw v1.0.0", delay: 100 },
  { type: "output", text: "", delay: 50 },
  { type: "success", text: "✓ Connecting to registry...", delay: 300 },
  { type: "success", text: `✓ ${statsData.apiCount.toLocaleString()} APIs loaded`, delay: 200 },
  { type: "success", text: "✓ MCP server ready", delay: 200 },
  { type: "output", text: "", delay: 100 },
  { type: "accent", text: "→ Listening on stdio for agent requests", delay: 300 },
  { type: "accent", text: "→ Add to Claude Desktop: Settings → MCP → Add Server", delay: 0 },
];

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [terminalOutput, setTerminalOutput] = useState<typeof terminalLines>([]);
  const [isTyping, setIsTyping] = useState(true);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = saved ? saved === 'dark' : true;
    setIsDark(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  // Terminal animation
  useEffect(() => {
    if (currentLineIndex >= terminalLines.length) {
      setIsTyping(false);
      return;
    }

    const line = terminalLines[currentLineIndex];
    const timeout = setTimeout(() => {
      setTerminalOutput(prev => [...prev, line]);
      setCurrentLineIndex(prev => prev + 1);
    }, line.delay);

    return () => clearTimeout(timeout);
  }, [currentLineIndex]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const restartTerminal = () => {
    setTerminalOutput([]);
    setCurrentLineIndex(0);
    setIsTyping(true);
  };

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-2xl logo-float">
              🦞
            </div>
            <span className="font-bold text-xl tracking-tight">APIClaw</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-text-muted">
            <a href="#how-it-works" className="hover:text-text-primary transition">How It Works</a>
            <a href="#for-agents" className="hover:text-text-primary transition">For Agents</a>
            <a href="/providers" className="text-accent font-medium hover:text-accent/80 transition">For Providers</a>
            <a href="#pricing" className="hover:text-text-primary transition">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg hover:bg-surface transition"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <a
              href="https://github.com/nordsym/apiclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost hidden sm:flex"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a
              href="#how-it-works"
              className="btn-primary !py-2 !px-3 text-xs hidden md:flex"
            >
              Start
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 bg-grid">
        <div className="hero-glow" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <div className="badge badge-live mb-6 inline-flex">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Live • {statsData.apiCount.toLocaleString()} APIs</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.05] tracking-tighter">
                <span className="gradient-text">The API Layer</span>
                <br />
                <span className="text-text-primary">for Agents</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-text-secondary mb-4 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Agents discover, evaluate, and integrate APIs via MCP.
                No more googling.
              </p>
              
              <p className="text-text-muted mb-8 max-w-lg mx-auto lg:mx-0">
                Structured data. Ranked results. Sub-200ms responses.
                Built for the agentic era.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('npx @nordsym/apiclaw');
                    alert('Copied: npx @nordsym/apiclaw');
                  }}
                  className="btn-primary glow-pulse"
                >
                  <Terminal className="w-5 h-5" />
                  <code className="font-mono">npx @nordsym/apiclaw</code>
                  <span className="text-xs opacity-70">copy</span>
                </button>
                <a
                  href="https://github.com/nordsym/apiclaw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  <Github className="w-5 h-5" />
                  View on GitHub
                </a>
              </div>

              {/* Trusted by */}
              <div className="pt-8 border-t border-border">
                <p className="text-sm text-text-muted mb-4">Trusted by agents worldwide</p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  {trustedBy.map((name, i) => (
                    <span key={i} className="text-sm text-text-secondary px-3 py-1.5 rounded-lg bg-surface border border-border">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Terminal */}
            <div className="relative">
              <div className="terminal glow" ref={terminalRef}>
                <div className="terminal-header">
                  <div className="terminal-dot terminal-dot-red" />
                  <div className="terminal-dot terminal-dot-yellow" />
                  <div className="terminal-dot terminal-dot-green" />
                  <span className="terminal-title">apiclaw — zsh</span>
                </div>
                <div className="terminal-body">
                  {terminalOutput.map((line, i) => (
                    <div key={i} className={`${line.text ? 'mb-1' : 'mb-2'}`}>
                      {line.type === 'prompt' && (
                        <>
                          <span className="terminal-prompt">$ </span>
                          <span className="terminal-command">{line.text}</span>
                        </>
                      )}
                      {line.type === 'output' && (
                        <span className="terminal-output">{line.text}</span>
                      )}
                      {line.type === 'success' && (
                        <span className="terminal-success">{line.text}</span>
                      )}
                      {line.type === 'accent' && (
                        <span className="terminal-accent">{line.text}</span>
                      )}
                    </div>
                  ))}
                  {isTyping && <span className="typing-cursor" />}
                </div>
              </div>
              
              {/* Replay button */}
              {!isTyping && (
                <button 
                  onClick={restartTerminal}
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 btn-ghost text-sm"
                >
                  <Play className="w-3 h-3" />
                  Replay
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-surface/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card relative">
                {stat.live && (
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-green-500 font-medium">LIVE</span>
                  </div>
                )}
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">HOW IT WORKS</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-4 tracking-tight">
              Three steps. That's it.
            </h2>
            <p className="text-text-secondary text-lg mt-4 max-w-2xl mx-auto">
              Your agent asks for a capability, APIClaw finds the best API, 
              and returns everything needed to integrate.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, i) => (
              <div key={i} className="feature-card">
                <div className="flex items-center gap-4 mb-6">
                  <div className="step-indicator">{step.step}</div>
                  <div>
                    <h3 className="font-bold text-xl">{step.title}</h3>
                  </div>
                </div>
                <p className="text-text-secondary mb-6 leading-relaxed">
                  {step.description}
                </p>
                <div className="code-preview">
                  <div className="code-preview-header">
                    example.ts
                  </div>
                  <div className="code-preview-body">
                    <pre className="text-sm whitespace-pre-wrap">{step.code}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* For Agents */}
      <section id="for-agents" className="py-24 px-6 bg-surface/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
                <Bot className="w-4 h-4" />
                For AI Agents
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                Your agent's API encyclopedia
              </h2>
              
              <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                Stop hardcoding API choices. Let your agent discover the best API 
                for each task dynamically, with full pricing and capability data.
              </p>

              <div className="space-y-6 mb-8">
                {agentBenefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{benefit.title}</h4>
                      <p className="text-text-secondary text-sm">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a
                href="https://github.com/nordsym/apiclaw#installation"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex"
              >
                Start Building
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="code-preview">
              <div className="code-preview-header">
                agent.ts — Claude Agent Example
              </div>
              <div className="code-preview-body">
                <pre className="text-sm">{`// Your agent needs to send a notification
const result = await mcp.call("apiclaw", {
  capability: "push_notification",
  platforms: ["ios", "android"],
  maxPrice: "$0.001/msg"
});

// APIClaw returns ranked matches
console.log(result.matches);
// [
//   { name: "OneSignal", price: "$0.0005", platforms: ["ios", "android", "web"] },
//   { name: "Firebase", price: "free", platforms: ["ios", "android"] },
//   { name: "Pusher", price: "$0.001", platforms: ["ios", "android", "web"] }
// ]

// Get full spec for the best match
const spec = await mcp.call("apiclaw", {
  action: "get_spec",
  api: result.bestMatch
});

// spec includes: auth, endpoints, examples, rate limits
// Your agent can now integrate dynamically! 🚀`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Providers */}
      <section id="for-providers" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="gradient-border p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-3xl">
                    🚀
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Your API</h4>
                    <p className="text-text-muted text-sm">Ready for the agentic era</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-text-secondary">
                    <Check className="w-5 h-5 text-accent" />
                    <span>Discovered by 4,500+ autonomous agents</span>
                  </div>
                  <div className="flex items-center gap-3 text-text-secondary">
                    <Check className="w-5 h-5 text-accent" />
                    <span>Structured for instant integration</span>
                  </div>
                  <div className="flex items-center gap-3 text-text-secondary">
                    <Check className="w-5 h-5 text-accent" />
                    <span>Ranked by capability match</span>
                  </div>
                  <div className="flex items-center gap-3 text-text-secondary">
                    <Check className="w-5 h-5 text-accent" />
                    <span>Zero ongoing maintenance</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-border">
                  <div>
                    <p className="font-semibold">Free Listing</p>
                    <p className="text-text-muted text-sm">For all API providers</p>
                  </div>
                  <div className="flex gap-2">
                    <a href="/providers/dashboard" className="btn-ghost !py-2.5 !px-4 text-sm">
                      Dashboard
                    </a>
                    <a href="/providers" className="btn-primary !py-2.5 !px-5 text-sm">
                      List Your API
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6">
                <Building2 className="w-4 h-4" />
                For API Providers
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                Reach the agent economy
              </h2>
              
              <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                AI agents are the new developers. They don't browse landing pages—
                they query capabilities. Get your API in front of them.
              </p>

              <div className="space-y-6">
                {providerBenefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{benefit.title}</h4>
                      <p className="text-text-secondary text-sm">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-surface/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">PRICING</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">
              Simple. Free. Forever.
            </h2>
            <p className="text-text-secondary text-lg mt-4">
              API discovery should be free. We're building the infrastructure for agent commerce.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free tier */}
            <div className="rounded-2xl bg-surface-elevated border-2 border-accent p-8 relative glow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-xs font-bold tracking-wide rounded-full uppercase">
                Available Now
              </div>
              <h3 className="text-2xl font-bold mb-2">Discovery</h3>
              <p className="text-text-secondary mb-6">Full API discovery and evaluation</p>
              <div className="text-5xl font-black mb-6">
                $0<span className="text-lg text-text-muted font-normal">/forever</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  Search 4,500+ APIs by capability
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  Full pricing & feature comparison
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  Structured JSON responses
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  MCP integration
                </li>
                <li className="flex items-center gap-3 text-text-secondary">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  Unlimited queries
                </li>
              </ul>
              <a href="https://github.com/nordsym/apiclaw" className="btn-primary w-full justify-center">
                Get Started Free
              </a>
            </div>

            {/* Coming soon tier */}
            <div className="rounded-2xl bg-surface-elevated border border-border p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-surface border border-border text-text-muted text-xs font-bold tracking-wide rounded-full uppercase">
                Coming Q2 2026
              </div>
              <h3 className="text-2xl font-bold mb-2">Provisioning</h3>
              <p className="text-text-secondary mb-6">Agent-native credential management</p>
              <div className="text-5xl font-black mb-6 text-text-muted">
                TBD
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-text-muted">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  OAuth broker for major APIs
                </li>
                <li className="flex items-center gap-3 text-text-muted">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  Instant API key provisioning
                </li>
                <li className="flex items-center gap-3 text-text-muted">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  Usage tracking & analytics
                </li>
                <li className="flex items-center gap-3 text-text-muted">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  Agent-native payments
                </li>
                <li className="flex items-center gap-3 text-text-muted">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  Unified billing
                </li>
              </ul>
              <button className="btn-secondary w-full justify-center opacity-50 cursor-not-allowed" disabled>
                Join Waitlist
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="gradient-border p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center text-4xl mx-auto mb-6 logo-float">
              🦞
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Ready to go agent-native?
            </h2>
            <p className="text-text-secondary text-lg mb-8 max-w-lg mx-auto">
              Join thousands of agents already discovering APIs through APIClaw.
              Get started in under a minute.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://github.com/nordsym/apiclaw"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <Terminal className="w-5 h-5" />
                npx @nordsym/apiclaw
              </a>
              <a
                href="https://github.com/nordsym/apiclaw"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <Star className="w-5 h-5" />
                Star on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 px-6 bg-surface/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-2xl">
                  🦞
                </div>
                <span className="font-bold text-xl tracking-tight">APIClaw</span>
              </div>
              <p className="text-text-muted mb-6 max-w-sm leading-relaxed">
                The API discovery layer for autonomous agents. 
                Find, evaluate, and integrate APIs in milliseconds.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/nordsym/apiclaw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent transition"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com/nordsym"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent transition"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-text-muted">
                <li><a href="#how-it-works" className="hover:text-text-primary transition">How It Works</a></li>
                <li><a href="#for-agents" className="hover:text-text-primary transition">For Agents</a></li>
                <li><a href="#for-providers" className="hover:text-text-primary transition">For Providers</a></li>
                <li><a href="/providers/dashboard" className="hover:text-text-primary transition">Provider Dashboard</a></li>
                <li><a href="#pricing" className="hover:text-text-primary transition">Pricing</a></li>
                <li><a href="https://github.com/nordsym/apiclaw#installation" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-text-muted">
                <li><a href="https://nordsym.com" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition">NordSym</a></li>
                <li><a href="https://github.com/nordsym" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition">GitHub</a></li>
                <li><a href="https://twitter.com/nordsym" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition">Twitter / X</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-muted text-sm">
              © 2026 NordSym. Building infrastructure for agent commerce.
            </p>
            <div className="flex items-center gap-4">
              <div className="badge">
                <Shield className="w-3 h-3" />
                MCP Compatible
              </div>
              <div className="badge badge-live">
                Live
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
