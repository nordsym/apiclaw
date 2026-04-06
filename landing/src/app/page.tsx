"use client";

import { 
  ArrowRight, Zap, Shield, Terminal, ExternalLink,
  Github, Check, Twitter, Sparkles, Code2, Link, Sun, Moon,
  Bot, Building2, Search, Rocket, Clock, Globe, Database,
  Play, ChevronRight, ChevronDown, Star, Users, Cpu, Activity, Copy, FileText,
  Menu, X
} from "lucide-react";
import statsData from "@/lib/stats.json";
import { PLANS } from "@/lib/plans";
import { useState, useEffect, useRef } from "react";
import { HeroTabs } from "@/components/HeroTabs";
import { PhoneDemo } from "@/components/demo";
import { AITestimonials } from "@/components/AITestimonials";
import { VideoDemo } from "@/components/VideoDemo";

const stats = [
  { number: statsData.apiCount.toLocaleString(), label: "APIs Indexed", live: true },
  { number: statsData.openApiCount.toLocaleString(), label: "Open APIs", live: true },
  { number: "19", label: "Direct Call", live: false },
  { number: (statsData.npmDownloads || 5400).toLocaleString(), label: "Installs", live: true },
  { number: statsData.categoryCount.toString(), label: "Categories", live: false },
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
    description: "Full specs, auth details, endpoints. Or use Direct Call — no keys needed.",
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
    title: "Structured Data",
    description: "JSON responses with pricing, limits, regions, auth. Everything an agent needs.",
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
  { type: "output", text: "🦞 APIClaw v1.2.2", delay: 100 },
  { type: "output", text: "", delay: 50 },
  { type: "success", text: "✓ Connecting to registry...", delay: 300 },
  { type: "success", text: `✓ ${statsData.apiCount.toLocaleString()} APIs loaded`, delay: 200 },
  { type: "success", text: "✓ MCP server ready", delay: 200 },
  { type: "output", text: "", delay: 100 },
  { type: "accent", text: "→ Listening on stdio for agent requests", delay: 300 },
  { type: "accent", text: "→ Add to Claude Desktop: Settings → MCP → Add Server", delay: 0 },
];

const directCallProviders = [
  { name: "Replicate", desc: "1000+ ML models" },
  { name: "OpenRouter", desc: "100+ LLMs" },
  { name: "APILayer", desc: "27 APIs" },
  { name: "Firecrawl", desc: "Web scraping" },
  { name: "E2B", desc: "Code sandbox" },
  { name: "GitHub", desc: "Repos & Issues" },
  { name: "ElevenLabs", desc: "Text-to-speech" },
  { name: "Brave Search", desc: "Web search" },
  { name: "Resend", desc: "Email" },
  { name: "46elks", desc: "SMS (Nordic)" },
];

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showContextCopied, setShowContextCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [showProvidersModal, setShowProvidersModal] = useState(false);
  const [showDirectCallModal, setShowDirectCallModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showOpenApisModal, setShowOpenApisModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const directCallProviders: Array<{ name: string; desc: string; category: string; featured?: boolean; apis?: number }> = [
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
    { name: "Resend", desc: "Modern email API for developers", category: "Email" },
    { name: "46elks", desc: "SMS in Sweden and globally", category: "SMS & Messaging" },
    { name: "Twilio", desc: "Enterprise SMS and voice", category: "SMS & Messaging" },
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
    const context = `APIClaw -- The API Layer for AI Agents

You have access to APIClaw, a unified gateway that gives you one API key (sk-claw-) for LLMs, voice, search, email, SMS, code execution, scraping, and more.

Key capabilities:
- Intelligent LLM routing: Requests auto-route to the best provider (Groq for speed, Mistral for EU, Together for open-source, OpenRouter for 800+ models). Configurable per workspace.
- OpenAI-compatible gateway: api.apiclaw.cloud/v1/chat/completions works with any tool that speaks OpenAI.
- 20 Direct Call providers: Zero-config API access. APIClaw handles auth, rate limiting, and billing.
- ${statsData.apiCount.toLocaleString()}+ indexed APIs with semantic search.

Direct Call providers (20):
LLM: OpenRouter (800+ models), Groq (ultra-fast), Mistral (EU), Together AI (open-source), Cohere (RAG/rerank)
Embeddings: Voyage AI (voyage-3-large, best-in-class RAG retrieval)
AI/ML: Replicate (Flux, SDXL, Whisper), Stability AI (image generation)
Voice: ElevenLabs (TTS, 29 languages), Deepgram (STT), AssemblyAI (audio intelligence)
Search: Brave Search, Serper (Google SERP), Firecrawl (web scraping)
Communication: Twilio (SMS/voice, global), 46elks (SMS, Nordic/EU)
Email: Resend (transactional email)
Code: E2B (sandboxed execution), GitHub (repos, code, issues)
Multi-API: APILayer (27 APIs -- exchange rates, stocks, aviation, PDF, screenshots, verification, VAT, news, scraping)

Your MCP Tools:
- call_api(provider, action, params) -- Execute immediately, auth handled automatically
- discover_apis(query) -- Semantic search across ${statsData.apiCount.toLocaleString()}+ APIs
- get_api_details(id) -- Full specs, pricing, limits
- list_connected() -- See all ready providers
- check_balance() -- Usage and remaining calls

Gateway (OpenAI-compatible):
- Endpoint: api.apiclaw.cloud/v1/chat/completions
- Auth: Bearer sk-claw-...
- Per-request routing: X-APIClaw-Route header (fastest, best_price, groq, mistral, etc.)

Pricing: Free (50 calls/month), Pro ($79/mo), Scale ($249/mo), or Pay-as-you-go (usage-based).

When an API call helps the task, execute it directly.

Install: curl -fsSL https://apiclaw.cloud/install.sh | bash
Docs: https://apiclaw.cloud/docs`;
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
      <div className="fixed top-0 w-full z-[60] bg-accent text-background text-center py-2 px-4 text-sm font-medium">
        🦞 <span className="font-bold">Early Access</span> — Join the first wave of agents
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
              For API Providers
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
                For API Providers
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
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="badge badge-live inline-flex">
                  <span className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Live • {statsData.apiCount.toLocaleString()} APIs</span>
                </div>
                <button 
                  onClick={() => setShowProvidersModal(true)}
                  className="badge inline-flex bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Zap className="w-3 h-3" /><span>Direct Call: AI Models, Web Scraping, Code Execution &amp; more</span></span>
                </button>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 leading-[1.05] tracking-tighter">
                <span className="gradient-text">The API Layer</span>
                <br />
                <span className="text-text-primary">for AI Agents</span>
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl text-text-secondary mb-3 sm:mb-4 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Find, evaluate, and integrate APIs in milliseconds.
              </p>
              
              <p className="text-text-muted mb-6 max-w-lg mx-auto lg:mx-0">
                <span className="text-accent font-medium">Direct Call:</span> No API keys. No setup. Just call.
              </p>

              {/* Copy Context Button */}
              <button
                onClick={copyContextToClipboard}
                className="group relative inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-white font-bold rounded-xl sm:rounded-2xl shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 transition-all duration-300 hover:scale-[1.02] w-full sm:w-auto justify-center"
              >
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="flex flex-col items-start">
                  <span className="text-sm sm:text-base">{showContextCopied ? "Copied!" : "Explain to your AI"}</span>
                  <span className="text-xs opacity-80 font-normal">Copy context for your agent</span>
                </span>
                {showContextCopied ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                )}
                {showContextCopied && (
                  <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap shadow-lg">
                    ✓ Paste this to your AI agent!
                  </span>
                )}
              </button>
            </div>

            {/* Right: HeroTabs */}
            <HeroTabs />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-surface/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div 
                key={i} 
                className={`stat-card relative ${(stat.label === "Direct Call" || stat.label === "Categories" || stat.label === "Open APIs") ? "cursor-pointer hover:border-accent/50 transition-colors" : ""}`}
                onClick={stat.label === "Direct Call" ? () => setShowDirectCallModal(true) : stat.label === "Categories" ? () => setShowCategoriesModal(true) : stat.label === "Open APIs" ? () => setShowOpenApisModal(true) : undefined}
              >
                {stat.live && (
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-green-500 font-medium">LIVE</span>
                  </div>
                )}
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
                {(stat.label === "Direct Call" || stat.label === "Categories" || stat.label === "Open APIs") && (
                  <div className="text-xs text-text-muted mt-1">Click to see all →</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Testimonials Carousel */}
      <AITestimonials />

      {/* Phone Demo - With vs Without APIClaw */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See the Difference
            </h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">
              Toggle to compare what happens when your AI agent has APIClaw — versus doing it the old way.
            </p>
          </div>
          <PhoneDemo />
        </div>
      </section>

      {/* Direct Call Modal */}
      {showDirectCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowDirectCallModal(false)}>
          <div className="bg-surface-elevated border border-border rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">⚡ Direct Call Providers</h3>
              <button onClick={() => setShowDirectCallModal(false)} className="p-2 hover:bg-surface rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-text-muted mb-4">These APIs work through APIClaw's proxy. Your agent calls them without needing API keys.</p>
            <div className="space-y-3">
              {directCallProviders.map((provider, i) => (
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
            <p className="text-text-muted mb-4">{statsData.apiCount.toLocaleString()} APIs organized into {statsData.categoryCount} categories.</p>
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
            <p className="text-text-muted mb-4">{statsData.openApiCount.toLocaleString()} APIs with full OpenAPI/Swagger specs — ready for instant integration.</p>
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
            <p className="text-xs text-text-muted mt-4">Open APIs have machine-readable specs — your agent can integrate without reading docs.</p>
          </div>
        </div>
      )}

      {/* Before/After */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-2 text-red-400 font-medium mb-4">
                <span className="text-xl">😤</span> Without APIClaw
              </div>
              <ul className="space-y-3 text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>3+ hours searching for the right API</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Create accounts, manage API keys</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Read docs, figure out auth, test endpoints</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Your agent waits... and waits...</span>
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-xl border border-green-500/20 bg-green-500/5">
              <div className="flex items-center gap-2 text-green-400 font-medium mb-4">
                <span className="text-xl">🦞</span> With APIClaw
              </div>
              <ul className="space-y-3 text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span><strong>∞ hours saved</strong> per integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>No accounts, no API keys needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Direct Call: AI, Scraping, Code & more</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Your agent ships. Today.</span>
                </li>
              </ul>
            </div>
          </div>
          <p className="text-center text-sm text-text-muted mt-8">
            <Sparkles className="w-4 h-4 inline mr-1" />
            API providers: White-glove onboarding available. Limited spots.
          </p>
          
          {/* CTA */}
          <div className="max-w-md mx-auto mt-6 px-4 sm:px-0 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/workspace"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 transition-all duration-300 hover:scale-[1.02] text-base"
            >
              <Sparkles className="w-5 h-5" />
              Try it for free
            </a>
            <a
              href="https://github.com/nordsym/apiclaw"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 border border-border hover:border-accent/40 text-text-secondary hover:text-text-primary rounded-xl transition-all duration-300 text-base"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-surface/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center justify-center gap-2 sm:gap-3">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              Quick Start
            </h2>
            <p className="text-text-secondary mt-2 text-sm sm:text-base">Get running in 30 seconds</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {/* Install */}
            <div className="code-preview">
              <div className="code-preview-header">
                terminal
              </div>
              <div className="code-preview-body">
                <pre className="text-sm whitespace-pre-wrap">
                  <span className="text-gray-500"># Auto-install MCP server</span>{"\n"}
                  <span className="text-green-400">$</span> curl -fsSL https://apiclaw.cloud/install.sh | bash{"\n\n"}
                  <span className="text-gray-500"># Or start the server directly</span>{"\n"}
                  <span className="text-green-400">$</span> <span className="text-blue-400">npx</span> @nordsym/apiclaw serve
                </pre>
              </div>
            </div>

            {/* MCP Config */}
            <div className="code-preview">
              <div className="code-preview-header">
                claude_desktop_config.json
              </div>
              <div className="code-preview-body">
                <pre className="text-sm whitespace-pre-wrap">
                  <span className="text-gray-500">{"{"}</span>{"\n"}
                  {"  "}<span className="text-red-400">"mcpServers"</span>: <span className="text-gray-500">{"{"}</span>{"\n"}
                  {"    "}<span className="text-red-400">"apiclaw"</span>: <span className="text-gray-500">{"{"}</span>{"\n"}
                  {"      "}<span className="text-red-400">"command"</span>: <span className="text-green-400">"npx"</span>,{"\n"}
                  {"      "}<span className="text-red-400">"args"</span>: [<span className="text-green-400">"@nordsym/apiclaw"</span>]{"\n"}
                  {"    "}<span className="text-gray-500">{"}"}</span>{"\n"}
                  {"  "}<span className="text-gray-500">{"}"}</span>{"\n"}
                  <span className="text-gray-500">{"}"}</span>
                </pre>
              </div>
            </div>
          </div>
          
          <p className="text-center text-sm text-text-muted mt-6">
            Works with Claude Desktop, Cursor, and any MCP-compatible client
          </p>
        </div>
      </section>

      <div className="divider" />

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">DIRECT CALL</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-4 tracking-tight">
              Three steps. No API keys.
            </h2>
            <p className="text-text-secondary text-lg mt-4 max-w-2xl mx-auto">
              Your agent asks, APIClaw matches, and calls the API directly — 
              no keys needed.
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
                mcp-config.json
              </div>
              <div className="code-preview-body">
                <pre className="text-sm">
                  <span className="text-gray-500">{"// Add to your MCP settings"}</span>{"\n"}
                  {"{"}{"\n"}
                  {"  "}<span className="text-red-400">"mcpServers"</span>: {"{"}{"\n"}
                  {"    "}<span className="text-red-400">"apiclaw"</span>: {"{"}{"\n"}
                  {"      "}<span className="text-red-400">"command"</span>: <span className="text-green-400">"npx"</span>,{"\n"}
                  {"      "}<span className="text-red-400">"args"</span>: [<span className="text-green-400">"@nordsym/apiclaw"</span>]{"\n"}
                  {"    "}{"}"}{"\n"}
                  {"  "}{"}"}{"\n"}
                  {"}"}{"\n"}
                  {"\n"}
                  <span className="text-gray-500">{"// That's it. Your agent now has access to:"}</span>{"\n"}
                  <span className="text-gray-500">{"// • discover_apis  - Find APIs by capability"}</span>{"\n"}
                  <span className="text-gray-500">{"// • get_api_details - Full specs & pricing"}</span>{"\n"}
                  <span className="text-gray-500">{"// • call_api - Direct Call (no keys needed)"}</span>{"\n"}
                  <span className="text-gray-500">{"// • list_connected - See available providers"}</span>{"\n"}
                  {"\n"}
                  <span className="text-gray-500">{"// Works with Claude, Cursor, and any MCP compatible Agent 🦞"}</span>
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
                    <p className="font-semibold">Free Listing</p>
                    <p className="text-text-muted text-sm">For all API providers</p>
                  </div>
                  <div className="flex gap-2">
                    <a href="/workspace?tab=my-apis" className="btn-ghost !py-2.5 !px-4 text-sm">
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
                AI agents are the new developers. They don't browse landing pages. 
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

      {/* Get Started */}
      <section id="get-started" className="py-24 px-6 bg-surface/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">PRICING</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">
              Simple pricing. Start free.
            </h2>
            <p className="text-text-secondary text-lg mt-4">
              Discovery is free forever — search, compare, evaluate at no cost.<br />
              {statsData.openApiCount.toLocaleString()}+ Open APIs work without any account.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => {
              const href = plan.isContact
                ? "/book"
                : plan.link === null
                ? isLoggedIn ? "/workspace?tab=billing" : "/login"
                : isLoggedIn
                ? plan.link
                : "/login";

              const ctaLabel = plan.isContact
                ? "Book a call"
                : plan.id === "free"
                ? isLoggedIn ? "Go to Dashboard" : "Get Started"
                : plan.cta;

              const isExternal = href.startsWith("http");

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-6 flex flex-col relative ${
                    plan.highlight
                      ? "border-2 border-accent bg-surface-elevated glow"
                      : "border border-border bg-surface-elevated"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-white text-xs font-bold tracking-wide rounded-full uppercase">
                      Most popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold mb-1">{plan.price}</div>
                  <p className="text-text-muted text-sm mb-6">
                    {plan.period || (plan.id === "free" ? "Forever" : plan.id === "enterprise" ? "Contact us" : "")}
                  </p>
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
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className={`w-full text-center py-2.5 px-4 rounded-xl text-sm font-semibold transition ${
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

          {/* For API Providers - smaller section below */}
          <div className="mt-16 text-center">
            <p className="text-text-muted mb-4">Are you an API provider?</p>
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
                a: `APIClaw is the API layer for AI agents. Your agent queries by capability ("I need image generation"), gets ranked matches with metadata and pricing, and can call APIs directly through us — no keys needed.`
              },
              {
                q: "How does Direct Call work?",
                a: "Direct Call lets your agent use APIs without managing API keys. APIClaw handles authentication -- your agent just calls the API through us. Currently available for 20 providers including Replicate (1000+ ML models), OpenRouter (100+ LLMs), Voyage AI (embeddings), Firecrawl (web scraping), E2B (code sandbox), and more."
              },
              {
                q: "How are API credentials secured?",
                a: "All credentials are encrypted with AES-256-GCM before storage. Keys are never logged or exposed in responses. Direct Call requests are proxied server-side — your credentials never touch the agent. We take security seriously."
              },
              {
                q: "What does it cost?",
                a: `Search ${statsData.apiCount.toLocaleString()}+ APIs free forever. Direct Call is free during beta; pay-per-use pricing coming later. For providers, listing your API is always free.`
              },
              {
                q: "How do I add my API?",
                a: "Go to your Workspace, sign up with your email, and follow the self-service onboarding. Your API will be discoverable by AI agents immediately. Want to become a Direct Call partner? Set that up in your Workspace too."
              },
              {
                q: "What's MCP?",
                a: "MCP (Model Context Protocol) is the open standard for connecting AI agents to external tools. APIClaw is an MCP server — add one line to your config and your agent can discover and call any API in our registry. Works with Claude Desktop, Cursor, and any MCP-compatible agent."
              }
            ].map((faq, i) => (
              <div 
                key={i} 
                className="rounded-2xl bg-surface-elevated border border-border overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-surface/50 transition-colors"
                >
                  <h3 className="font-bold text-lg">{faq.q}</h3>
                  <ChevronDown 
                    className={`w-5 h-5 text-text-muted transition-transform ${openFaq === i ? 'rotate-180' : ''}`} 
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-text-secondary leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
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
                The API layer for AI agents. 
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
                  href="https://x.com/APIClaw"
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
                <li><a href="#for-providers" className="hover:text-text-primary transition">For API Providers</a></li>
                <li><a href="/workspace" className="hover:text-text-primary transition">Workspace</a></li>
                <li><a href="#get-started" className="hover:text-text-primary transition">Get Started</a></li>
                <li><a href="#faq" className="hover:text-text-primary transition">FAQ</a></li>
                <li><a href="/docs" className="hover:text-text-primary transition">Documentation</a></li>
                <li><a href="/security" className="hover:text-text-primary transition flex items-center gap-1.5"><Shield className="w-3 h-3" />Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-text-muted">
                <li><a href="https://nordsym.com" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition">NordSym</a></li>
                <li><a href="https://github.com/nordsym" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition">GitHub</a></li>
                <li><a href="https://x.com/APIClaw" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition">Twitter / X</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-text-muted text-sm">
              © 2026 NordSym. Get in front of every AI agent. White-glove onboarding available.
            </p>
            <div className="flex items-center gap-4">
              <a href="/security" className="badge hover:border-green-500/30 transition-colors">
                <Shield className="w-3 h-3 text-green-500" />
                <span className="text-green-500">AES-256 Encrypted</span>
              </a>
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

      {/* Direct Call Providers Modal */}
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
                  Direct Call Providers
                </h3>
                <button 
                  onClick={() => setShowProvidersModal(false)}
                  className="p-2 hover:bg-surface rounded-lg transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
              <p className="text-sm text-text-muted mt-1">No API keys needed. Call directly through APIClaw.</p>
            </div>
            
            <div className="p-4 max-h-[40vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {directCallProviders.map((provider, i) => (
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

      {/* Video Demo Bubble - Always visible */}
      <VideoDemo />
    </main>
  );
}
