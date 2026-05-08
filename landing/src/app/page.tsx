"use client";

import {
  ArrowRight, Zap, Shield, Terminal, ExternalLink,
  Github, Check, Twitter, Sparkles, Code2, Link, Sun, Moon,
  Bot, Building2, Search, Rocket, Clock, Globe, Database,
  Play, ChevronRight, ChevronDown, Star, Users, Cpu, Activity, Copy, FileText,
  Menu, X, Download
} from "lucide-react";
import statsData from "@/lib/stats.json";
import { PLANS } from "@/lib/plans";
import { useState, useEffect, useRef } from "react";
import { HeroDoorsPreview } from "@/components/HeroDoorsPreview";
import { AITestimonials } from "@/components/AITestimonials";
import { VideoDemo } from "@/components/VideoDemo";
import { SeeTheDifference } from "@/components/SeeTheDifference";
import { InstallSection } from "@/components/InstallSection";

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const stats = [
  { number: `${statsData.apiCount.toLocaleString()}+`, label: "Discoverable APIs", live: true },
  { number: `${statsData.callableCount.toLocaleString()}+`, label: "Callable APIs", live: true },
  { number: (statsData.npmDownloads && statsData.npmDownloads >= 12200 ? statsData.npmDownloads.toLocaleString() : "12,200+"), label: "Installs", live: true },
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
    description: "Your agent queries APIClaw for a capability. Not a product name.",
    icon: Search,
    codeJsx: (
      <>
        <span className="text-gray-500">{"// User prompt to agent:"}</span>{"\n"}
        <span className="text-green-400">"Generate a photorealistic image</span>{"\n"}
        <span className="text-green-400">of a sunset over mountains"</span>{"\n"}
        {"\n"}
        <span className="text-gray-500">{"// Agent uses discover_apis tool"}</span>{"\n"}
        <span className="text-gray-500">{"// query: \"image generation\""}</span>
      </>
    ),
  },
  {
    step: "2",
    title: "APIClaw Matches",
    description: `We search ${statsData.apiCount.toLocaleString()}+ APIs and return ranked options with full metadata.`,
    icon: Database,
    codeJsx: (
      <>
        <span className="text-gray-500">{"// Structured response"}</span>{"\n"}
        {"{"}{"\n"}
        {"  "}<span className="text-red-400">"matches"</span>: [{"\n"}
        {"    "}{"{ "}<span className="text-red-400">"name"</span>: <span className="text-green-400">"Replicate"</span>, <span className="text-red-400">"models"</span>: <span className="text-yellow-400">"1000+"</span>{" },"}{"\n"}
        {"    "}{"{ "}<span className="text-red-400">"name"</span>: <span className="text-green-400">"OpenRouter"</span>, <span className="text-red-400">"models"</span>: <span className="text-yellow-400">"100+"</span>{" }"}{"\n"}
        {"  "}],{"\n"}
        {"  "}<span className="text-red-400">"bestMatch"</span>: <span className="text-green-400">"Replicate"</span>{"\n"}
        {"}"}
      </>
    ),
  },
  {
    step: "3",
    title: "Agent Integrates",
    description: "Full specs, auth details, endpoints. Or use Managed APIs -- no keys needed.",
    icon: Rocket,
    codeJsx: (
      <>
        <span className="text-gray-500">{"// Agent uses call_api tool"}</span>{"\n"}
        {"{"}{"\n"}
        {"  "}<span className="text-red-400">"provider"</span>: <span className="text-green-400">"replicate"</span>,{"\n"}
        {"  "}<span className="text-red-400">"action"</span>: <span className="text-green-400">"flux-schnell"</span>,{"\n"}
        {"  "}<span className="text-red-400">"params"</span>: {"{ "}<span className="text-red-400">"prompt"</span>: <span className="text-green-400">"..."</span>{" }"}{"\n"}
        {"}"}{"\n"}
        <span className="text-gray-500">{"// → image URL, no API key needed"}</span>
      </>
    ),
  },
];

const agentBenefits = [
  {
    icon: Search,
    title: "Semantic Search",
    description: "Query by capability, not keywords. 'I need GDPR-compliant email' returns perfect matches.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Sub-200ms responses. Your agent doesn't wait, it acts.",
  },
  {
    icon: Database,
    title: "Managed Keys",
    description: "APIClaw holds the credentials for 22+ providers. Your agent calls them with zero config.",
  },
  {
    icon: Shield,
    title: "Three Access Paths",
    description: "MCP for AI clients, CLI for terminals, sk-claw- for your own agent over HTTP. Same gateway.",
  },
];

const providerBenefits = [
  {
    icon: Users,
    title: "Reach AI Agents",
    description: "Get discovered by AI agents searching for APIs like yours.",
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
  { type: "prompt", text: "curl -fsSL https://apiclaw.cloud/install.sh | bash" },
  { type: "output", text: "", delay: 500 },
  { type: "output", text: "🦞 APIClaw v2.5.3", delay: 100 },
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showContextCopied, setShowContextCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [showProvidersModal, setShowProvidersModal] = useState(false);
  const [showManagedModal, setShowManagedModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showOpenApisModal, setShowOpenApisModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const managedProviders: Array<{ name: string; desc: string; category: string; featured?: boolean; apis?: number }> = [
    // Multi-API providers (top)
    { name: "APILayer", desc: "Exchange rates, stocks, aviation, PDF, screenshots, email/phone verification, VAT, news, scraping", category: "Multi-API", apis: 27 },
    { name: "Replicate", desc: "Whisper, Stable Diffusion, Flux, Luma, 1000+ ML models", category: "Multi-API", apis: 1000 },
    { name: "OpenRouter", desc: "GPT-4, Claude, Llama, Gemini, 100+ LLMs", category: "Multi-API", apis: 100 },
    // Single-purpose
    { name: "ElevenLabs", desc: "Text-to-speech in 29 languages", category: "Voice & TTS" },
    { name: "Groq", desc: "Ultra-fast LLM inference", category: "AI & LLM" },
    { name: "Deepgram", desc: "Speech-to-text transcription", category: "Voice & TTS" },
    { name: "Firecrawl", desc: "Web scraping to LLM-ready markdown", category: "Search" },
    { name: "Brave Search", desc: "Privacy-focused web search", category: "Search" },
    { name: "Serper", desc: "Google search API for AI", category: "Search" },
    { name: "E2B", desc: "Secure cloud sandboxes for code execution", category: "Code Execution" },
    { name: "GitHub", desc: "Repos, issues, PRs, and more", category: "Developer Tools" },
    { name: "Mistral", desc: "Open-weight LLMs from Mistral AI", category: "AI & LLM" },
    { name: "Cohere", desc: "Enterprise NLP and embeddings", category: "AI & LLM" },
    { name: "Together AI", desc: "Open-source model inference", category: "AI & LLM" },
    { name: "Stability AI", desc: "Stable Diffusion image generation", category: "AI & LLM" },
    { name: "AssemblyAI", desc: "Audio transcription and intelligence", category: "Voice & TTS" },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText('curl -fsSL https://apiclaw.cloud/install.sh | bash');
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const copyContextToClipboard = () => {
    const total = statsData.apiCount.toLocaleString();
    const callable = statsData.callableCount.toLocaleString();
    const installs = statsData.npmDownloads.toLocaleString();
    const context = `APIClaw is the Control Plane for AI Agents. Terminal-native execution, parallel missions, real observability. One unified runtime across ${total}+ discoverable APIs, ${callable}+ empirically callable, and ~${installs} agent installs.

Four doors, one control plane:
1. MCP server: Claude Desktop, Cursor, any MCP client.
2. CLI: terminal, scripts, CI/CD.
3. HTTP gateway: server-side agents and custom integrations.
4. Remote MCP / Full Runtime: paste apiclaw.cloud/mcp into any OAuth-capable client.

Same auth, same logs, same workspace across all four.

Agent surface (19 tools): discover_apis, get_api_details, list_categories, list_connected, list_capabilities, list_models, call_api, capability, check_balance, estimate_cost, get_usage_summary, check_workspace_status, get_chain_status, resume_chain, start_mission, mission_status, list_missions, list_mission_templates, apiclaw_help.

Mission templates orchestrate multi-step work with built-in observability and cost tracking. Drop in a template like genprd to generate a structured PRD; more land regularly.

Pricing: free tier of 25 calls/month after email signup. Email signup is required for every tool, including discovery. Beyond the free tier: pay-as-you-go at underlying provider cost plus 15%, billed via Stripe. No commitment.

When an API call would help the task, execute it through whichever door the agent uses. Credentials for managed providers are held server-side and never reach the agent.

Install:
- Claude Desktop: https://apiclaw.cloud/apiclaw.mcpb
- Terminal: curl -fsSL https://apiclaw.cloud/install.sh | bash
- Remote MCP: https://apiclaw.cloud/mcp
- Workspace + docs: https://apiclaw.cloud`;
    navigator.clipboard.writeText(context);
    setShowContextCopied(true);
    setTimeout(() => setShowContextCopied(false), 2500);
  };

  const submitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || waitlistStatus === "loading") return;
    
    setWaitlistStatus("loading");
    try {
      const res = await fetch("https://adventurous-avocet-799.convex.cloud/api/mutation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "waitlist:join",
          args: { email: waitlistEmail, type: "provider", source: "landing" }
        })
      });
      if (res.ok) {
        setWaitlistStatus("success");
        setWaitlistEmail("");
      } else {
        setWaitlistStatus("error");
      }
    } catch {
      setWaitlistStatus("error");
    }
  };

  // Scroll-based active section detection using Intersection Observer
  useEffect(() => {
    const sections = ["how-it-works", "for-agents", "for-providers", "get-started", "faq"];
    
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px", // Trigger when section is in upper portion of viewport
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = saved ? saved === 'dark' : true;
    setIsDark(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
    
    // Check if logged in
    const workspaceSession = localStorage.getItem('apiclaw_workspace_session');
    const providerSession = localStorage.getItem('apiclaw_session');
    setIsLoggedIn(!!(workspaceSession || providerSession));
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Early Access Banner */}
      <div className="fixed top-0 w-full z-[60] bg-accent text-white text-center py-2 px-4 text-[13px] font-medium tracking-tight">
        🦞 <span className="font-semibold">Early access.</span> Join the first wave of agents.
      </div>
      
      {/* Header */}
      <header className="fixed top-9 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-accent/20 flex items-center justify-center text-xl sm:text-2xl logo-float">
              🦞
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight">APIClaw</span>
          </div>
          
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-text-muted">
            <a
              href="/catalog"
              className="transition hover:text-text-primary font-medium"
            >
              Catalog
            </a>
            <a
              href="#how-it-works"
              className={`transition ${activeSection === "how-it-works" ? "text-accent font-medium" : "hover:text-text-primary"}`}
            >
              How It Works
            </a>
            <a
              href="#for-agents"
              className={`transition ${activeSection === "for-agents" ? "text-accent font-medium" : "hover:text-text-primary"}`}
            >
              For Agents
            </a>
            <a
              href="#for-providers"
              className={`transition ${activeSection === "for-providers" ? "text-accent font-medium" : "hover:text-text-primary"}`}
            >
              For API Owners
            </a>
            <a
              href="#faq"
              className={`transition ${activeSection === "faq" ? "text-accent font-medium" : "hover:text-text-primary"}`}
            >
              FAQ
            </a>
          </nav>
          
          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <a
                href="/workspace"
                className="text-sm text-text-muted hover:text-accent transition flex items-center gap-1"
              >
                <Zap className="w-4 h-4" />
                Workspace
              </a>
            ) : (
              <a
                href="/workspace"
                className="text-sm text-text-muted hover:text-accent transition flex items-center gap-1"
              >
                <Zap className="w-4 h-4" />
                Workspace
              </a>
            )}
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
              className="btn-ghost"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
          
          {/* Mobile actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-surface transition"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-surface transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border">
            <nav className="flex flex-col px-4 py-4 space-y-3 text-sm">
              <a
                href="/catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-text-primary font-medium hover:text-accent transition"
              >
                Catalog
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-text-muted hover:text-text-primary transition"
              >
                How It Works
              </a>
              <a 
                href="#for-agents" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-text-muted hover:text-text-primary transition"
              >
                For Agents
              </a>
              <a 
                href="#for-providers" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-text-muted hover:text-text-primary transition"
              >
                For API Owners
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-text-muted hover:text-text-primary transition"
              >
                FAQ
              </a>
              <div className="border-t border-border pt-3 mt-1 flex flex-col space-y-3">
                <a
                  href="/workspace"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-accent font-medium flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Workspace
                </a>
                <a
                  href="https://github.com/nordsym/apiclaw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 text-text-muted hover:text-text-primary transition flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-44 pb-20 px-4 sm:px-6 bg-grid overflow-x-hidden">
        <div className="hero-glow" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-7 sm:mb-9">
                <button
                  onClick={() => setShowProvidersModal(true)}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-text-secondary border border-border hover:border-text-muted hover:text-text-primary transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {statsData.apiCount.toLocaleString()} APIs · {statsData.callableCount.toLocaleString()} callable · live
                </button>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] font-semibold mb-6 sm:mb-7 leading-[1.02] tracking-[-0.04em]">
                The Control Plane
                <br />
                <span className="text-text-muted font-normal">for AI Agents</span>
              </h1>

              <p className="text-lg sm:text-xl text-text-secondary mb-9 sm:mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Terminal-native execution, parallel missions, and real observability across every model and every API. One runtime, four entry points, one workspace.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <a
                  href="/apiclaw.mcpb"
                  download
                  className="group inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-lg bg-text-primary hover:bg-text-secondary text-background font-semibold text-sm sm:text-[15px] transition-colors"
                >
                  Install for Claude Desktop
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="/workspace"
                  className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-text-primary font-semibold text-sm sm:text-[15px] transition-colors"
                >
                  Get a workspace key
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 text-xs sm:text-sm text-text-muted">
                <a href="#install" className="hover:text-text-primary transition inline-flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  All install paths
                </a>
                <span className="text-border">·</span>
                <button
                  onClick={copyContextToClipboard}
                  className="hover:text-text-primary transition inline-flex items-center gap-1.5"
                >
                  {showContextCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {showContextCopied ? "Copied" : "Copy context for your AI"}
                </button>
              </div>
            </div>

            {/* Right: Four Doors preview */}
            <HeroDoorsPreview />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-surface/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="stat-card relative"
              >
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

      {/* AI Testimonials Carousel */}
      <AITestimonials />

      {/* See the Difference v2 — racing clock, side-by-side */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <span className="section-label">SEE THE DIFFERENCE</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 sm:mt-4 tracking-tighter">
              Same prompt. Two paths.
            </h2>
            <p className="text-text-muted text-base sm:text-lg mt-3 max-w-2xl mx-auto">
              One finishes in 1.4 seconds. The other is still going.
            </p>
          </div>
          <SeeTheDifference />
        </div>
      </section>

      {/* Managed APIs Modal */}
      {showManagedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowManagedModal(false)}>
          <div className="bg-surface-elevated border border-border rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Managed API Providers</h3>
              <button onClick={() => setShowManagedModal(false)} className="p-2 hover:bg-surface rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-text-muted mb-4">These APIs work through APIClaw's proxy. Your agent calls them without needing API keys.</p>
            <div className="space-y-3">
              {managedProviders.map((provider, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  provider.featured
                    ? 'bg-gradient-to-r from-accent/5 to-purple-500/5 border-accent/30 hover:border-accent/50 hover:shadow-[0_0_20px_rgba(0,212,255,0.08)]'
                    : provider.apis
                    ? 'bg-surface border-border/80'
                    : 'bg-surface border-border'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{provider.name}</span>
                      {provider.featured && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/20 text-accent">Partner</span>
                      )}
                      {provider.apis && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">{provider.apis >= 1000 ? `${Math.floor(provider.apis/1000)}k+` : `${provider.apis}`} APIs</span>
                      )}
                    </div>
                    <div className="text-sm text-text-muted">{provider.desc}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent flex-shrink-0 ml-3">{provider.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowCategoriesModal(false)}>
          <div className="bg-surface-elevated border border-border rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">📂 API Categories</h3>
              <button onClick={() => setShowCategoriesModal(false)} className="p-2 hover:bg-surface rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-text-muted mb-4">{statsData.apiCount.toLocaleString()} APIs organized into {Object.keys(statsData.categoryBreakdown).length} categories.</p>
            <div className="space-y-2">
              {Object.entries(statsData.categoryBreakdown || {})
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .map(([category, count], i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                  <div className="font-medium">{category}</div>
                  <span className="text-sm px-3 py-1 rounded-full bg-accent/20 text-accent">{(count as number).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Open APIs Modal */}
      {showOpenApisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowOpenApisModal(false)}>
          <div className="bg-surface-elevated border border-border rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">📖 Open APIs</h3>
              <button onClick={() => setShowOpenApisModal(false)} className="p-2 hover:bg-surface rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-text-muted mb-4">{statsData.openApiCount.toLocaleString()} APIs with full OpenAPI/Swagger specs, ready for instant integration.</p>
            <div className="space-y-2">
              {Object.entries(statsData.categoryBreakdown || {})
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .map(([category, count], i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                  <div className="font-medium">{category}</div>
                  <span className="text-sm px-3 py-1 rounded-full bg-green-500/20 text-green-400">{Math.round((count as number) * 0.07).toLocaleString()} Open</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-4">Open APIs have machine-readable specs, so your agent can integrate without reading docs.</p>
          </div>
        </div>
      )}

      {/* Install — Four Doors + OS-aware quick install + .mcpb */}
      <InstallSection />

      <div className="divider" />

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 max-w-2xl">
            <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted font-medium">How it works</span>
            <h2 className="text-3xl md:text-[2.75rem] font-semibold mt-4 tracking-[-0.02em] leading-[1.1]">
              Three steps. No API keys.
            </h2>
            <p className="text-text-secondary text-base sm:text-lg mt-4 leading-relaxed">
              Your agent asks. APIClaw matches. The call goes through. Credentials stay server-side; the agent never holds a key.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {howItWorks.map((step, i) => (
              <div key={i} className="feature-card">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="step-indicator">{step.step}</div>
                  <div>
                    <h3 className="font-bold text-lg sm:text-xl">{step.title}</h3>
                  </div>
                </div>
                <p className="text-text-secondary mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                  {step.description}
                </p>
                <div className="code-preview">
                  <div className="code-preview-header">
                    example.ts
                  </div>
                  <div className="code-preview-body overflow-x-auto">
                    <pre className="text-xs sm:text-sm whitespace-pre-wrap">{step.codeJsx}</pre>
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
              <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted font-medium">For AI Agents</span>

              <h2 className="text-3xl md:text-[2.75rem] font-semibold tracking-[-0.02em] leading-[1.1] mt-3 mb-6">
                One runtime. Every model. Every API.
              </h2>

              <p className="text-text-secondary text-base sm:text-lg mb-8 leading-relaxed max-w-lg">
                Stop hardcoding provider choices. Your agent discovers the right capability, calls the right model, and runs full missions through one unified control plane, with cost, latency, and audit logs tagged per call.
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
                Same flow. Four doors. One control plane.
              </div>
              <div className="code-preview-body">
                <pre className="text-sm">
                  <span className="text-gray-500">{"// 1. MCP. Claude Desktop, Cursor, any MCP client"}</span>{"\n"}
                  <span className="text-blue-400">discover_apis</span>({"{ "}<span className="text-red-400">query</span>: <span className="text-green-400">"tts in spanish"</span>{" }"}){"\n"}
                  <span className="text-blue-400">call_api</span>({"{ "}<span className="text-red-400">provider</span>: <span className="text-green-400">"elevenlabs"</span>, <span className="text-red-400">action</span>: <span className="text-green-400">"tts"</span>, <span className="text-red-400">params</span>: {"{...}"} {"}"}){"\n"}
                  {"\n"}
                  <span className="text-gray-500">{"// 2. CLI. Terminal, scripts, CI"}</span>{"\n"}
                  <span className="text-green-400">$</span> apiclaw discover <span className="text-green-400">"tts in spanish"</span>{"\n"}
                  <span className="text-green-400">$</span> apiclaw call elevenlabs/tts -d <span className="text-green-400">'{"{...}"}'</span>{"\n"}
                  {"\n"}
                  <span className="text-gray-500">{"// 3. HTTP. Your agent runtime over Bearer sk-claw"}</span>{"\n"}
                  fetch(<span className="text-green-400">"https://api.apiclaw.cloud/v1/call"</span>, {"{"}{"\n"}
                  {"  "}<span className="text-red-400">headers</span>: {"{ "}<span className="text-red-400">Authorization</span>: <span className="text-green-400">"Bearer sk-claw-..."</span> {"}"},{"\n"}
                  {"  "}<span className="text-red-400">body</span>: JSON.stringify({"{ api, path, method, params }"}){"\n"}
                  {"}"}){"\n"}
                  {"\n"}
                  <span className="text-gray-500">{"// 4. Remote MCP. apiclaw.cloud/mcp + OAuth"}</span>{"\n"}
                  <span className="text-gray-500">{"// Same gateway, same auth, same logs."}</span>
                </pre>
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
                    <span>{statsData.apiCount.toLocaleString()}+ APIs indexed and growing</span>
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
                    <p className="font-semibold">Always Free</p>
                    <p className="text-text-muted text-sm">For all API owners</p>
                  </div>
                  <div className="flex gap-2">
                    <a href="/workspace?tab=my-apis" className="btn-primary !py-2.5 !px-5 text-sm">
                      Go to Workspace
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted font-medium">For API Owners</span>

              <h2 className="text-3xl md:text-[2.75rem] font-semibold tracking-[-0.02em] leading-[1.1] mt-3 mb-6">
                Reach the agent economy
              </h2>

              <p className="text-text-secondary text-base sm:text-lg mb-8 leading-relaxed max-w-lg">
                AI agents are the new developers. They don't browse landing pages, they query capabilities. Get your API in front of them.
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

      {/* Get Started */}
      <section id="get-started" className="py-24 px-6 bg-surface/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">PRICING</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">
              Simple pricing. Start free.
            </h2>
            <p className="text-text-secondary text-lg mt-4">
              25 free API calls per month, any provider. Discovery is always free, unmetered.<br />
              Past the free tier: API cost plus 15%, no commitment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {PLANS.map((plan) => {
              const authPath = CLERK_ENABLED ? "/sign-up" : "/login";
              const href = plan.link === null
                ? isLoggedIn ? "/workspace?tab=billing" : authPath
                : isLoggedIn
                ? plan.link
                : authPath;

              const ctaLabel = plan.id === "free"
                ? isLoggedIn ? "Go to Workspace" : "Get Started"
                : isLoggedIn ? "Add Payment Method" : "Get Started";

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-8 flex flex-col relative ${
                    plan.highlight
                      ? "border-2 border-accent bg-surface-elevated glow"
                      : "border border-border bg-surface-elevated"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-white text-xs font-bold tracking-wide rounded-full uppercase">
                      Recommended
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold mb-1">{plan.price}</div>
                  <p className="text-text-muted text-sm mb-2">{plan.period}</p>
                  <p className="text-text-secondary text-sm mb-6">{plan.calls} {plan.callsSub}</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-text-secondary text-sm">
                        <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={href}
                    className={`w-full text-center py-3 px-4 rounded-xl text-sm font-semibold transition ${
                      plan.highlight
                        ? "btn-primary"
                        : "btn-ghost border border-border"
                    }`}
                  >
                    {ctaLabel}
                  </a>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-text-muted mt-8">
            Need custom limits or SLA? <a href="/book" className="text-accent hover:underline">Talk to us</a>
          </p>

          {/* For API Owners - smaller section below */}
          <div className="mt-12 text-center">
            <p className="text-text-muted mb-4">Are you an API owner?</p>
            <a href="/workspace?tab=my-apis" className="text-accent hover:underline font-medium">
              List your API for free →
            </a>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* FAQ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">
              Common Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What is APIClaw?",
                a: `The Control Plane for AI Agents. One runtime that exposes every model and every API your agent needs through a single workspace. Discovery, execution, capability routing, multi-step missions, and observability all live behind one auth layer. Same logs, same billing, regardless of how you connect.`
              },
              {
                q: "How does my agent connect to APIClaw?",
                a: `Four doors, one control plane. (1) MCP: drop APIClaw into Claude Desktop, Cursor, or any local MCP client. (2) CLI: npm install -g @nordsym/apiclaw and run discover, call, or full missions from a shell. (3) HTTP gateway: Bearer sk-claw against api.apiclaw.cloud for any backend, agent runtime (we power OpenClaw, the fastest-growing open-source agent), or workflow tool (n8n, Make). (4) Remote MCP: paste apiclaw.cloud/mcp into Grok, ChatGPT, or any OAuth-MCP client; PKCE plus dynamic registration handles the rest. Identical workspace, identical auth, identical logs across all four.`
              },
              {
                q: "What can I actually call?",
                a: `26,704 discoverable APIs and 2,895 empirically callable, including every major LLM family in one place: Anthropic (Claude Opus, Sonnet, Haiku), xAI Grok, Groq, Mistral, Together AI, Cohere, OpenAI, plus 800 more via OpenRouter. Beyond LLMs: ElevenLabs, Deepgram, AssemblyAI, Brave Search, Serper, Firecrawl, E2B, GitHub, Replicate, Stability AI, the full APILayer suite, and the long tail of public REST APIs the catalog has indexed. Use list_models for the live LLM catalog and discover_apis for everything else.`
              },
              {
                q: "What are missions?",
                a: `Missions are structured, observable orchestrations on APIClaw's runtime. Templates declare the steps; the runtime executes them with a full audit log, cost tracking, and parallel-ready architecture. Each mission has a unique id, a status (queued, running, completed, failed), a per-step event log, and an underlying plus charged cost. CLI: apiclaw mission start <template>. MCP: start_mission. HTTP: POST /v1/missions/start.`
              },
              {
                q: "How are credentials secured?",
                a: `Provider credentials live server-side. Workspace API keys (sk-claw) are stored as one-way hashes; the raw value is shown once at creation and never again. Managed-provider keys are encrypted at rest and never reach the agent. Per-request audit logs tag workspace, provider, cost, and latency without exposing secrets.`
              },
              {
                q: "What does it cost?",
                a: `Free tier: 25 calls per month after email signup, any provider counts equally. Beyond the free tier: pay-as-you-go at underlying provider cost plus 15%, billed via Stripe. No commitment. Internal NordSym workspaces run at zero margin (canon).`
              },
              {
                q: "Do I have to sign up to use APIClaw?",
                a: `Yes. A free email signup at apiclaw.cloud/workspace is required for every tool, including discovery. Once you have a workspace, all four doors share it: paste an sk-claw key into MCP config, run apiclaw login in a terminal, send Authorization: Bearer from your backend, or authorize a Remote MCP client over OAuth. The workspace is the control plane; everything else is an entry point into it.`
              },
              {
                q: "I'm building my own agent runtime. Why would I use APIClaw?",
                a: `Because you don't want to write provider routing, key vault, retry logic, circuit breakers, observability, billing, and rate limits from scratch. APIClaw already powers OpenClaw, the fastest-growing open-source agent runtime, and Symbot, NordSym's production agent. Point your existing chat-completions client at api.apiclaw.cloud with one bearer and you get every model from every provider plus the full control plane your end users will see. One auth layer, one billing rail, one log stream. Whatever your runtime, APIClaw is the layer underneath.`
              },
              {
                q: "How do I add my API?",
                a: `Go to /workspace, sign in with email, follow the self-service onboarding. Your API is discoverable by agents immediately. To become a managed partner with revenue share, that path is in the same workspace.`
              }
            ].map((faq, i) => (
              <div
                key={i}
                className="border-b border-border last:border-b-0"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full py-5 sm:py-6 flex items-center justify-between text-left group"
                >
                  <h3 className="text-base sm:text-[17px] font-medium text-text-primary group-hover:text-text-primary pr-6">{faq.q}</h3>
                  <ChevronDown
                    className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="pb-6 pr-10">
                    <p className="text-text-secondary leading-[1.7] text-[15px]">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle pt-20 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-12 gap-12 mb-16">
            <div className="md:col-span-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-md bg-text-primary text-background flex items-center justify-center font-semibold text-sm">A</div>
                <span className="font-semibold text-[15px] tracking-tight">APIClaw</span>
              </div>
              <p className="text-text-muted text-sm leading-relaxed max-w-xs">
                The Control Plane for AI Agents. Built by NordSym.
              </p>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-[11px] uppercase tracking-wider text-text-muted font-medium mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#install" className="text-text-secondary hover:text-text-primary transition">Install</a></li>
                <li><a href="/workspace" className="text-text-secondary hover:text-text-primary transition">Workspace</a></li>
                <li><a href="/catalog" className="text-text-secondary hover:text-text-primary transition">Catalog</a></li>
                <li><a href="/docs" className="text-text-secondary hover:text-text-primary transition">Docs</a></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-[11px] uppercase tracking-wider text-text-muted font-medium mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#faq" className="text-text-secondary hover:text-text-primary transition">FAQ</a></li>
                <li><a href="/security" className="text-text-secondary hover:text-text-primary transition">Security</a></li>
                <li><a href="https://github.com/nordsym/apiclaw" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition">GitHub</a></li>
                <li><a href="/.well-known/oauth-authorization-server" className="text-text-secondary hover:text-text-primary transition">OAuth metadata</a></li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-[11px] uppercase tracking-wider text-text-muted font-medium mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="https://nordsym.com" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition">NordSym</a></li>
                <li><a href="https://x.com/APIClaw" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition">Twitter / X</a></li>
                <li><a href="mailto:gustav@nordsym.com" className="text-text-secondary hover:text-text-primary transition">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-text-muted">
            <p>© 2026 NordSym AB · 559535-5768</p>
            <div className="flex items-center gap-5">
              <span>AES-256 at rest</span>
              <span>MCP 2025-03-26</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />All systems operational</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Telegram Chat Bubble - TEMPORARILY DISABLED */}
      {/* <a
        href="https://t.me/Symbot_nordsym_bot?start=apiclaw"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 group"
      >
        <div className="flex items-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
          <span className="text-xl">🦞</span>
          <span className="font-medium text-sm hidden sm:inline">Chat with the bot</span>
        </div>
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-xs whitespace-nowrap shadow-lg">
          <span className="text-text-primary font-medium">Talk to the Clawdbot building this</span>
        </div>
      </a> */}

      {/* Managed Providers Modal */}
      {showProvidersModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowProvidersModal(false)}
        >
          <div
            className="bg-background border border-border rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent" />
                  Managed Providers
                </h3>
                <button 
                  onClick={() => setShowProvidersModal(false)}
                  className="p-2 hover:bg-surface rounded-lg transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
              <p className="text-sm text-text-muted mt-1">No API keys needed. APIClaw handles auth and billing.</p>
            </div>
            
            <div className="p-4 max-h-[40vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {managedProviders.map((provider, i) => (
                  <div key={i} className="p-3 rounded-xl bg-surface border border-border">
                    <div className="font-medium text-sm">{provider.name}</div>
                    <div className="text-xs text-text-muted">{provider.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-border bg-surface/50">
              <p className="text-sm text-text-secondary mb-4 text-center">
                Want your API here? Get discovered by AI agents worldwide.
              </p>
              <a
                href="https://nordsym.github.io/NordSym-Scheduler/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full justify-center"
              >
                <span>Book a Call</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Video Demo hidden - outdated after v2.1 updates, re-record needed */}
      {/* <VideoDemo /> */}
    </main>
  );
}
