"use client";

import Link from "next/link";
import {
  ArrowRight, Zap, Shield, Terminal, ExternalLink,
  Github, Check, Twitter, Sparkles, Code2, Sun, Moon,
  Bot, Building2, Search, Rocket, Clock, Globe, Database,
  Play, ChevronRight, ChevronDown, Star, Users, Cpu, Activity, Copy, FileText,
  Menu, X, Download, Layers,
} from "lucide-react";
import statsData from "@/lib/stats.json";
import { PLANS } from "@/lib/plans";
import { useState, useEffect, useRef } from "react";
import { HeroDoorsPreview } from "@/components/HeroDoorsPreview";
import { AITestimonials } from "@/components/AITestimonials";
import { VideoDemo } from "@/components/VideoDemo";
import { getWorkspaceSessionToken } from "@/lib/workspace-session";
import {
  FREE_MANAGED_CALLS_LIFETIME,
  FREE_MANAGED_PROVIDER_COST_CAP_USD,
  MANAGED_PROVIDER_ADAPTER_COUNT,
  MANAGED_PROVIDER_ADAPTERS,
  PAYG_MARGIN_RATE,
  PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT,
} from "@apiclaw/product-truth";

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const PAYG_MARGIN_PERCENT = PAYG_MARGIN_RATE * 100;

const stats = [
  { number: statsData.apiCount.toLocaleString(), label: "Discoverable APIs", live: true },
  { number: statsData.sourceVerifiedCount.toLocaleString(), label: "Exact-name source-verified", live: true },
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
    description: `We search ${statsData.apiCount.toLocaleString()} APIs and return ranked options with full metadata.`,
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
        {"  "}<span className="text-red-400">"provider"</span>: <span className="text-green-400">"nasa"</span>,{"\n"}
        {"  "}<span className="text-red-400">"action"</span>: <span className="text-green-400">"apod"</span>,{"\n"}
        {"  "}<span className="text-red-400">"params"</span>: {"{"}{"}"}{"\n"}
        {"}"}{"\n"}
        <span className="text-gray-500">{"// → Astronomy Picture of the Day"}</span>
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
    title: "Four Doors",
    description: "Install for local MCP, CLI for terminals, HTTP for your own agent, Remote MCP for connected clients. Same gateway.",
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

const whoIsThisFor = [
  {
    icon: Bot,
    tag: "Install",
    title: "Local MCP builders",
    description: "Claude Desktop and other local clients when you want the fastest path to a first call.",
    href: "/install",
    cta: "Open install",
  },
  {
    icon: Terminal,
    tag: "CLI",
    title: "Terminal-native teams",
    description: "Shells, scripts, and CI/CD workflows when the agent already lives in a repo or pipeline.",
    href: "/docs#cli",
    cta: "Open CLI docs",
  },
  {
    icon: Globe,
    tag: "HTTP",
    title: "Server-side runtimes",
    description: "Workspace-generated keys for backend agents, OpenClaw-style agents, and custom runtimes.",
    href: "/docs#gateway",
    cta: "Open HTTP docs",
  },
  {
    icon: Sparkles,
    tag: "Remote MCP",
    title: "Connected clients",
    description: "OAuth-capable runtimes that connect through your workspace and use Integrations.",
    href: "/sign-in",
    cta: "Sign in",
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
  const [showHeroCmdCopied, setShowHeroCmdCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [showProvidersModal, setShowProvidersModal] = useState(false);
  const [showManagedModal, setShowManagedModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const mainRef = useRef<HTMLElement | null>(null);

  const managedProviders = MANAGED_PROVIDER_ADAPTERS;

  const copyToClipboard = () => {
    navigator.clipboard.writeText('curl -fsSL https://apiclaw.cloud/install.sh | bash');
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const copyContextToClipboard = () => {
    const total = statsData.apiCount.toLocaleString();
    const sourceVerified = statsData.sourceVerifiedCount.toLocaleString();
    const installs = statsData.npmDownloads.toLocaleString();
    const context = `APIClaw is the Control Plane for AI Agents. Terminal-native execution, parallel missions, real observability. One unified runtime across ${total} discoverable APIs and ${sourceVerified} current catalog entries matched to source-verification evidence by exact name, with ~${installs} agent installs. Source verification is not execution.

Managed boundary: ${MANAGED_PROVIDER_ADAPTER_COUNT} provider adapters are inventoried. ${PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT} provider rails are customer-executable now: OpenRouter chat, Brave Search, GitHub read-only, NASA read-only, and APILayer's contracted HTTPS rails. Adapter inventory is not an execution promise.

Four doors, one control plane:
1. Install: local MCP for Claude Desktop and other local clients.
2. CLI: terminal, scripts, CI/CD.
3. HTTP: server-side agents and OpenClaw-style agents.
4. Remote MCP: connected clients and OAuth-capable runtimes.

Same auth, same logs, same workspace across all four.

Remote MCP surface (14 tools): apiclaw_help, discover_apis, get_api_details, list_categories, list_connected, list_models, call_api, check_balance, check_workspace_status, list_mission_templates, discover_missions, start_mission, mission_status, list_missions.

Mission templates orchestrate multi-step work with built-in observability and cost tracking. Drop in a mission template to generate a structured PRD; more land regularly.

Pricing: ${FREE_MANAGED_CALLS_LIFETIME} managed calls for the lifetime of each workspace, subject to a $${FREE_MANAGED_PROVIDER_COST_CAP_USD} total underlying provider-cost cap. Discovery is free after signup. Beyond the free tier, billing-ready managed actions use pay-as-you-go at underlying provider cost plus ${PAYG_MARGIN_PERCENT}%, billed via Stripe. Actions without an exact billing adapter remain blocked. No commitment.

Auth (agent-native, ~10s, zero inbox):
  npx @nordsym/apiclaw auth login
Opens the user's browser, one-tap Clerk sign-in (Google or passwordless email), writes ~/.apiclaw.toml. The same auth covers MCP, CLI, HTTP, and Remote MCP. If a tool returns action="agent_auth_required", run that exact command.

When an API call would help the task, execute it through whichever door the agent uses. Credentials for managed providers are held server-side and never reach the agent.

Install:
- Claude Desktop (one-click .mcpb): https://apiclaw.cloud/apiclaw.mcpb
- Any OS via terminal (install + auth, ~30s total):
    curl -fsSL https://apiclaw.cloud/install.sh | bash
    npx @nordsym/apiclaw auth login
- Remote MCP (OAuth, zero install): https://apiclaw.cloud/mcp
- Workspace: https://apiclaw.cloud/workspace
- Docs: https://apiclaw.cloud/docs`;
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
    
    // Resolve the workspace from the HttpOnly cookie, never a persisted bearer.
    void getWorkspaceSessionToken().then((token) => setIsLoggedIn(Boolean(token)));
  }, []);

  useEffect(() => {
    const node = mainRef.current;
    if (!node) return;

    let raf = 0;
    const pointer = { x: window.innerWidth / 2, y: window.innerHeight * 0.22 };

    const apply = () => {
      const x = pointer.x;
      const y = pointer.y;
      const nx = x / Math.max(window.innerWidth, 1) - 0.5;
      const ny = y / Math.max(window.innerHeight, 1) - 0.5;
      node.style.setProperty("--pointer-x", `${x}px`);
      node.style.setProperty("--pointer-y", `${y}px`);
      node.style.setProperty("--pointer-opacity", "1");
      node.style.setProperty("--grid-offset-x", `${(nx * 26).toFixed(2)}px`);
      node.style.setProperty("--grid-offset-y", `${(ny * 26).toFixed(2)}px`);
      node.style.setProperty("--pointer-tilt-x", `${(nx * 18).toFixed(2)}px`);
      node.style.setProperty("--pointer-tilt-y", `${(ny * 18).toFixed(2)}px`);
    };

    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    const onEnter = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      apply();
    };

    const onLeave = () => {
      node.style.setProperty("--pointer-opacity", "0");
      node.style.setProperty("--pointer-x", "50%");
      node.style.setProperty("--pointer-y", "20%");
      node.style.setProperty("--grid-offset-x", "0px");
      node.style.setProperty("--grid-offset-y", "0px");
      node.style.setProperty("--pointer-tilt-x", "0px");
      node.style.setProperty("--pointer-tilt-y", "0px");
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerenter", onEnter);
    node.addEventListener("pointerleave", onLeave);
    apply();

    return () => {
      cancelAnimationFrame(raf);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerenter", onEnter);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <main
      ref={mainRef}
      className="min-h-screen overflow-x-hidden page-grid relative"
      style={
        {
          "--pointer-x": "50%",
          "--pointer-y": "20%",
          "--pointer-opacity": 0,
          "--grid-offset-x": "0px",
          "--grid-offset-y": "0px",
          "--pointer-tilt-x": "0px",
          "--pointer-tilt-y": "0px",
        } as React.CSSProperties
      }
    >
      <div className="pointer-ambient" />

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
            <a
              href="/sign-in"
              className="text-sm text-text-muted hover:text-accent transition flex items-center gap-1"
            >
              <Zap className="w-4 h-4" />
              Sign in
            </a>
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
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-accent font-medium flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Sign in
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
      <section className="relative pt-44 pb-20 px-4 sm:px-6 overflow-x-hidden">
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
                  {statsData.apiCount.toLocaleString()} APIs · {statsData.sourceVerifiedCount.toLocaleString()} exact-name source-verified · live
                </button>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] font-semibold mb-6 sm:mb-7 leading-[1.02] tracking-[-0.04em]">
                The Control Plane
                <br />
                <span className="text-text-muted font-normal">for AI Agents</span>
              </h1>

              <p className="text-lg sm:text-xl text-text-secondary mb-9 sm:mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Terminal-native execution, parallel missions, and real observability across supported models and a live API registry. One runtime, four entry points, one workspace.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <a
                  href="/apiclaw.mcpb"
                  download
                  className="group inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-lg bg-text-primary hover:bg-text-secondary text-background font-semibold text-sm sm:text-[15px] transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md"
                >
                  Install to Claude Desktop
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("npx @nordsym/apiclaw auth login");
                    setShowHeroCmdCopied(true);
                    setTimeout(() => setShowHeroCmdCopied(false), 2000);
                  }}
                  className="group inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated hover:border-accent/40 text-text-primary font-mono text-xs sm:text-sm transition-all duration-200 active:scale-[0.98]"
                  title="Copy command"
                >
                  <span className="text-accent select-none">$</span>
                  <span>npx @nordsym/apiclaw auth login</span>
                  {showHeroCmdCopied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors" />
                  )}
                </button>
              </div>
              <p className="text-xs text-text-muted mb-5 max-w-xl">
                One install for Claude Desktop, one command for everywhere else. Same workspace across MCP, CLI, HTTP, and Remote MCP — works on macOS, Linux, and Windows.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 text-xs sm:text-sm text-text-muted">
              <a href="#who-is-this-for" className="hover:text-text-primary transition inline-flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                See paths
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
      <section className="py-16 px-6 section-tint">
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

      {/* Who is this for */}
      <section id="who-is-this-for" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <span className="section-label">WHO IS THIS FOR</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 sm:mt-4 tracking-tighter">
              Choose the door that matches how you run agents.
            </h2>
            <p className="text-text-muted text-base sm:text-lg mt-3 max-w-2xl mx-auto">
              One auth, every door. <code className="text-accent">apiclaw auth login</code> opens your browser, signs you in, writes ~/.apiclaw.toml — and every door reads the same workspace from there.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {whoIsThisFor.map((card) => (
              <Link
                key={card.tag}
                href={card.href}
                className="group rounded-2xl border border-border bg-surface-elevated p-5 transition-all duration-300 transform-gpu hover:-translate-y-1 hover:border-accent/40 hover:bg-surface hover:shadow-[0_16px_28px_-24px_rgba(239,68,68,0.28)] flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex w-8 h-8 rounded-lg bg-accent/10 text-accent items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    <card.icon className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-text-muted font-mono">{card.tag}</span>
                </div>
                <div className="text-base font-semibold mb-2 tracking-tight">{card.title}</div>
                <p className="text-sm text-text-secondary leading-relaxed">{card.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-accent group-hover:text-accent-hover transition-colors">
                  {card.cta}
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI Testimonials Carousel */}
      <AITestimonials />

      {/* Managed APIs Modal */}
      {showManagedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowManagedModal(false)}>
          <div className="bg-surface-elevated border border-border rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Managed adapter inventory</h3>
              <button onClick={() => setShowManagedModal(false)} className="p-2 hover:bg-surface rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-text-muted mb-4">{MANAGED_PROVIDER_ADAPTER_COUNT} provider adapters are inventoried. {PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT} provider rails are customer-executable now. Inventory is not an execution promise.</p>
            <div className="space-y-3">
              {managedProviders.map((provider) => (
                <div key={provider.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  provider.customerExecutableActions.length > 0
                    ? 'bg-gradient-to-r from-accent/5 to-emerald-500/5 border-accent/30 hover:border-accent/50'
                    : 'bg-surface border-border'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{provider.name}</span>
                      {provider.customerExecutableActions.length > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500">Customer-executable</span>
                      )}
                    </div>
                    <div className="text-sm text-text-muted">{provider.description}</div>
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

      {/* How It Works — The Control Plane */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 max-w-2xl">
            <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted font-medium">The Control Plane</span>
            <h2 className="text-3xl md:text-[2.75rem] font-semibold mt-4 tracking-[-0.02em] leading-[1.1]">
              One runtime. Four doors. Supported models.
            </h2>
            <p className="text-text-secondary text-base sm:text-lg mt-4 leading-relaxed">
              Discovery, execution, missions, and observability behind a single workspace. Same auth, same logs, every entry point.
            </p>
          </div>

          {/* The runtime: 4 layers */}
          <div className="rounded-2xl border border-border bg-surface-elevated overflow-hidden mb-8">
            <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
              {[
                { n: "01", t: "Discover", d: `${statsData.apiCount.toLocaleString()} discoverable APIs. Search by capability.`},
                { n: "02", t: "Route", d: "Auto-pick the best provider. Keys stay server-side." },
                { n: "03", t: "Execute", d: "Single calls or full multi-step missions." },
                { n: "04", t: "Observe", d: "Audit log, cost, latency tagged per call." },
              ].map((s) => (
                <div key={s.n} className="group p-6 transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface/60 hover:shadow-[0_14px_32px_-28px_rgba(239,68,68,0.35)]">
                  <div className="text-[11px] tracking-widest text-accent font-mono mb-3">{s.n}</div>
                  <div className="text-base font-semibold mb-1.5 tracking-tight">{s.t}</div>
                  <p className="text-[13px] text-text-secondary leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Four doors map */}
          <div className="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted font-medium mb-1.5">Four Doors · One Control Plane</div>
                <h3 className="text-lg font-semibold tracking-tight">Pick the entry point. The runtime is identical.</h3>
              </div>
              <a href="#who-is-this-for" className="text-sm text-accent hover:underline font-medium inline-flex items-center gap-1.5 group">
                See paths
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { tag: "Install", h: "Local MCP", d: "Claude Desktop and other local MCP clients.", icon: <Bot className="w-4 h-4" />, href: "/install", cta: "Open install" },
                { tag: "CLI", h: "Terminal", d: "Shells, scripts, CI/CD pipelines.", icon: <Code2 className="w-4 h-4" />, href: "/docs#cli", cta: "Open CLI docs" },
                { tag: "HTTP", h: "HTTP", d: "Server-side agents and OpenClaw-style agents.", icon: <Terminal className="w-4 h-4" />, href: "/docs#gateway", cta: "Open HTTP docs" },
                { tag: "Remote MCP", h: "Connected clients", d: "Grok, ChatGPT, and other OAuth-capable runtimes.", icon: <Sparkles className="w-4 h-4" />, href: "/sign-in", cta: "Sign in" },
              ].map((d) => (
                <div
                  key={d.tag}
                  className="group rounded-xl border border-border bg-surface p-4 transition-all duration-300 transform-gpu hover:border-accent/40 hover:-translate-y-1 hover:bg-surface-elevated hover:shadow-[0_14px_26px_-22px_rgba(239,68,68,0.28)]"
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="inline-flex w-7 h-7 rounded-md bg-accent/10 text-accent items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-0.5">{d.icon}</span>
                    <span className="text-[10px] uppercase tracking-widest text-text-muted font-mono">{d.tag}</span>
                  </div>
                  <div className="text-sm font-semibold mb-1 tracking-tight">{d.h}</div>
                  <p className="text-xs text-text-secondary leading-relaxed">{d.d}</p>
                  <a
                    href={d.href}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-accent hover:text-accent-hover transition-colors"
                  >
                    {d.cta}
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  One command. Same workspace across all four doors.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("npx @nordsym/apiclaw auth login");
                  }}
                  className="font-mono text-xs sm:text-sm text-text-primary bg-surface-elevated border border-border rounded-md px-3 py-1.5 hover:border-accent/40 transition-colors flex items-center gap-2"
                  title="Copy command"
                >
                  <span className="text-accent select-none">$</span>
                  <span>npx @nordsym/apiclaw auth login</span>
                  <Copy className="w-3.5 h-3.5 text-text-muted" />
                </button>
              </div>
              <p className="text-[11px] text-text-muted mt-2.5 leading-relaxed">
                Works on macOS, Linux, and Windows. On headless systems, open the sign-in URL on a device where you can verify ownership.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* For Agents — runtime power */}
      <section id="for-agents" className="py-24 px-6 section-tint relative">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 max-w-2xl">
            <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted font-medium">For AI Agents</span>
            <h2 className="text-3xl md:text-[2.75rem] font-semibold tracking-[-0.02em] leading-[1.1] mt-3 mb-4">
              The runtime your agent actually wants.
            </h2>
            <p className="text-text-secondary text-base sm:text-lg leading-relaxed">
              {statsData.apiCount.toLocaleString()} discoverable API definitions, {statsData.sourceVerifiedCount.toLocaleString()} exact-name source-verified catalog entries, {MANAGED_PROVIDER_ADAPTER_COUNT} managed adapters, and {PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT} customer-executable provider rails. Source verification is not execution.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
            {[
              { icon: <Search className="w-4 h-4" />, tag: "Discover", t: `${statsData.apiCount.toLocaleString()} discoverable / ${statsData.sourceVerifiedCount.toLocaleString()} source-verified`, d: "Search by capability. Execution readiness is explicit on every result." },
              { icon: <Cpu className="w-4 h-4" />, tag: "Model routing", t: "Available providers", d: "Use live runtime output to confirm current model and provider readiness." },
              { icon: <Layers className="w-4 h-4" />, tag: "Missions", t: "Orchestration", d: "Multi-step runs with audit log, cost tags, parallel-ready execution." },
              { icon: <Activity className="w-4 h-4" />, tag: "Observe", t: "Per-call audit", d: "Workspace, provider, latency, cost on every tool call. Replayable." },
            ].map((b) => (
              <div
                key={b.tag}
                className="group rounded-2xl border border-border bg-surface-elevated p-5 transition-all duration-300 transform-gpu hover:border-accent/40 hover:-translate-y-1 hover:bg-surface hover:shadow-[0_16px_28px_-24px_rgba(239,68,68,0.3)]"
              >
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="inline-flex w-8 h-8 rounded-lg bg-accent/10 text-accent items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-0.5">{b.icon}</span>
                  <span className="text-[10px] uppercase tracking-widest text-text-muted font-mono">{b.tag}</span>
                </div>
                <div className="text-base font-semibold mb-1 tracking-tight">{b.t}</div>
                <p className="text-[13px] text-text-secondary leading-relaxed">{b.d}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 items-stretch">
            <div className="rounded-2xl border border-border bg-background overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
                <span className="text-[11px] uppercase tracking-widest text-text-muted font-mono">agent.session.log</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> live
                </span>
              </div>
              <pre className="p-5 font-mono text-[12.5px] leading-[1.65] text-text-secondary overflow-x-auto flex-1">
{`[14:32:01] discover_apis  → "agent infrastructure news"
[14:32:01] matched         · brave_search, github, openrouter
[14:32:02] call_api        → brave_search/search   ✓
[14:32:03] call_api        → github/search_repos   ✓
[14:32:04] call_api        → nasa/apod             ✓
[14:32:05] chat            → openrouter/chat       ✓
[14:32:05] audit           → workspace ws_kx9 · 4 calls · 4 providers`}
              </pre>
            </div>

            <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 via-transparent to-transparent p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-[0.18em] text-accent font-medium">In production</span>
                <h3 className="text-2xl font-semibold tracking-tight mt-3 mb-3">
                  Already powering live agent runtimes.
                </h3>
                <p className="text-text-secondary leading-relaxed mb-6">
                  Drop APIClaw behind your runtime. Point your client at <code className="font-mono text-[13px]">api.apiclaw.cloud</code> with one bearer. Give users one authenticated path to supported models, managed execution, and API discovery.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="#who-is-this-for" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors">
                  Start building
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a href="/docs" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface hover:bg-surface-elevated text-text-primary text-sm font-medium transition-colors">
                  Read the docs
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Providers */}
      <section id="for-providers" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted font-medium">For API Owners</span>
            <h2 className="text-3xl md:text-[2.75rem] font-semibold tracking-[-0.02em] leading-[1.1] mt-3 mb-5">
              Get your API in front of agents. Today.
            </h2>
            <p className="text-text-secondary text-base sm:text-lg leading-relaxed">
              Agents do not browse landing pages. They search capabilities. List your API on APIClaw and the next time an agent queries for what you do, you appear in the result with auth, pricing, and a working example baked in.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-stretch">
            {/* What you get */}
            <div className="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
              <div className="text-[11px] uppercase tracking-[0.18em] text-text-muted font-medium mb-4">What you get</div>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { t: "Discoverable on day one", d: "Indexed in the catalog the moment your spec is approved. Searchable by capability, not by your brand." },
                  { t: "Zero integration effort", d: "Submit an OpenAPI spec or your existing endpoint. APIClaw normalises auth, parameters, and pricing." },
                  { t: "Per-call analytics", d: "See exactly which agents call your API, with what capability, at what cost. Ranking improves with usage." },
                  { t: "Managed-partner upgrade", d: "Hand over key custody and APIClaw becomes the credential vault for your API. Commercial terms agreed per partner." },
                ].map((row) => (
                  <div key={row.t} className="group rounded-xl border border-transparent p-3 -m-3 transition-all duration-300 hover:border-border-subtle hover:bg-surface hover:translate-x-0.5 hover:shadow-sm">
                    <Check className="w-4 h-4 text-accent mt-1 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
                    <div>
                      <div className="text-[14px] font-semibold mb-0.5">{row.t}</div>
                      <p className="text-[13px] text-text-secondary leading-relaxed">{row.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-5 border-t border-border-subtle">
                <div className="flex-1 min-w-[160px]">
                  <div className="text-[11px] uppercase tracking-widest text-text-muted font-mono mb-1">Always free</div>
                  <p className="text-sm text-text-secondary">Listing is free for every API owner. Always.</p>
                </div>
                <a href="/sign-in" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors">
                  List your API
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* How it works for owners */}
            <div className="rounded-2xl border border-border bg-background overflow-hidden">
              <div className="px-5 py-3 border-b border-border-subtle">
                <span className="text-[11px] uppercase tracking-widest text-text-muted font-mono">submission flow</span>
              </div>
              <ol className="p-6 space-y-5">
                {[
                  { n: "01", t: "Submit your spec", d: "OpenAPI 3, Swagger, or a raw base URL. We normalise it." },
                  { n: "02", t: "Approve the listing", d: "Review the auto-generated capability tags and pricing model." },
                  { n: "03", t: "Go live", d: `Your API joins a registry of ${statsData.apiCount.toLocaleString()} discoverable definitions.` },
                  { n: "04", t: "Optional: become managed", d: "Hand us the credential. We hold custody, agents call your API without keys, commercial terms agreed per partner." },
                ].map((step) => (
                  <li key={step.n} className="group flex items-start gap-4 rounded-xl p-3 -mx-3 transition-all duration-300 hover:bg-surface/60 hover:translate-x-0.5">
                    <span className="text-[11px] font-mono text-accent mt-0.5 flex-shrink-0 tracking-widest transition-transform duration-300 group-hover:translate-x-0.5">{step.n}</span>
                    <div>
                      <div className="text-[14px] font-semibold mb-0.5">{step.t}</div>
                      <p className="text-[13px] text-text-secondary leading-relaxed">{step.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="px-6 pb-6">
                <a href="/docs#list-your-api" className="text-sm text-accent hover:underline font-medium inline-flex items-center gap-1.5">
                  Submission docs
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Get Started */}
      <section id="get-started" className="py-24 px-6 section-tint">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">PRICING</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">
              Simple pricing. Start free.
            </h2>
            <p className="text-text-secondary text-lg mt-4">
              {FREE_MANAGED_CALLS_LIFETIME} free managed calls for the lifetime of your workspace, up to ${FREE_MANAGED_PROVIDER_COST_CAP_USD} in total provider cost.<br />
              Discovery stays free. Billing-ready managed actions then use provider cost plus {PAYG_MARGIN_PERCENT}%.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {PLANS.map((plan) => {
              const authPath = CLERK_ENABLED ? "/sign-up" : "/sign-in";
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
                  className={`group rounded-2xl p-8 flex flex-col relative transition-all duration-300 transform-gpu hover:-translate-y-1 hover:shadow-[0_18px_40px_-30px_rgba(239,68,68,0.35)] ${
                    plan.highlight
                      ? "border-2 border-accent bg-surface-elevated glow hover:border-accent/70"
                      : "border border-border bg-surface-elevated hover:border-accent/40 hover:bg-surface"
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
            <a href="/sign-in" className="text-accent hover:underline font-medium">
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
                a: `The Control Plane for AI Agents. One runtime and four entry points for supported model routing, managed execution, API discovery, and observability behind a single workspace.`
              },
              {
                q: "How does my agent connect?",
                a: `Four doors. Install for local MCP. CLI for terminal workflows. HTTP for server-side agents and OpenClaw-style agents. Remote MCP for connected clients. Same workspace, same auth, same logs. One \`apiclaw auth login\` covers all four.`
              },
              {
                q: "How does signup work?",
                a: `Run \`npx @nordsym/apiclaw auth login\` in your terminal. Your browser opens, you click once via Google or passwordless email (powered by Clerk), and the CLI writes ~/.apiclaw.toml. The same auth then works across MCP, CLI, HTTP, and Remote MCP.`
              },
              {
                q: "What can I actually call?",
                a: `${statsData.apiCount.toLocaleString()} discoverable API definitions, including ${statsData.sourceVerifiedCount.toLocaleString()} current catalog entries mapped to source-verification evidence by exact name. Source verification is not execution. APIClaw inventories ${MANAGED_PROVIDER_ADAPTER_COUNT} managed adapters; ${PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT} provider rails are customer-executable now: OpenRouter chat, Brave Search, GitHub read-only, NASA read-only, and APILayer's contracted HTTPS rails. Keyless registry entries remain discovery-only until hardened egress is live.`
              },
              {
                q: "What are missions?",
                a: `Multi-step orchestrations on APIClaw's runtime. Audit log per step, cost tracking, parallel-ready. CLI, MCP, and HTTP all start them.`
              },
              {
                q: "How are credentials secured?",
                a: `Provider keys live server-side, encrypted at rest. Workspace keys (sk-claw) are stored as one-way hashes. The raw value shows once at creation, then never again.`
              },
              {
                q: "What does it cost?",
                a: `Free tier: ${FREE_MANAGED_CALLS_LIFETIME} managed calls for the lifetime of the workspace, subject to a $${FREE_MANAGED_PROVIDER_COST_CAP_USD} total underlying provider-cost cap. Discovery is free. Past that, billing-ready managed actions use provider cost plus ${PAYG_MARGIN_PERCENT}%, billed via Stripe. Actions without an exact billing adapter remain blocked. No commitment.`
              },
              {
                q: "Do I have to sign up?",
                a: `Yes. A free workspace is required for every door, including discovery. The signup is the auth flow: \`apiclaw auth login\` creates the workspace on first sign-in. Discovery is free. Managed calls include a ${FREE_MANAGED_CALLS_LIFETIME}-call lifetime allowance, subject to the $${FREE_MANAGED_PROVIDER_COST_CAP_USD} provider-cost cap.`
              },
              {
                q: "I'm building my own agent runtime. Why APIClaw?",
                a: `Skip provider routing, key vault, retry logic, circuit breakers, billing, and audit logging. Use the HTTP door for server-side agents, or the Remote MCP door for connected clients. Same workspace, same gateway, same observability on day one.`
              },
              {
                q: "How do I list my own API?",
                a: `Sign in, then follow the self-service onboarding in Workspace. Your API is discoverable by agents immediately. A managed-partner upgrade is available from the same workspace if you want APIClaw to hold credentials on your behalf.`
              }
            ].map((faq, i) => (
              <div
                key={i}
                className="border-b border-border last:border-b-0"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="group w-full py-5 sm:py-6 flex items-center justify-between text-left rounded-xl transition-colors hover:bg-surface/30"
                >
                  <h3 className="text-base sm:text-[17px] font-medium text-text-primary group-hover:text-accent transition-colors pr-6">{faq.q}</h3>
                  <ChevronDown
                    className={`w-4 h-4 text-text-muted flex-shrink-0 transition-all duration-200 group-hover:text-accent ${openFaq === i ? 'rotate-180' : ''}`}
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
                <span className="text-2xl leading-none">🦞</span>
                <span className="font-semibold text-[15px] tracking-tight">APIClaw</span>
              </div>
              <p className="text-text-muted text-sm leading-relaxed max-w-xs">
                The Control Plane for AI Agents.
              </p>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-[11px] uppercase tracking-wider text-text-muted font-medium mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#who-is-this-for" className="text-text-secondary hover:text-text-primary transition-colors">Install</a></li>
                <li><a href="/sign-in" className="text-text-secondary hover:text-text-primary transition-colors">Sign in</a></li>
                <li><a href="/catalog" className="text-text-secondary hover:text-text-primary transition-colors">Catalog</a></li>
                <li><a href="/docs" className="text-text-secondary hover:text-text-primary transition-colors">Docs</a></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-[11px] uppercase tracking-wider text-text-muted font-medium mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#faq" className="text-text-secondary hover:text-text-primary transition-colors">FAQ</a></li>
                <li><a href="/security" className="text-text-secondary hover:text-text-primary transition-colors">Security</a></li>
                <li><a href="https://github.com/nordsym/apiclaw" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">GitHub</a></li>
                <li><a href="/docs#list-your-api" className="text-text-secondary hover:text-text-primary transition-colors">List your API</a></li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="text-[11px] uppercase tracking-wider text-text-muted font-medium mb-4">Connect</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="https://x.com/APIClaw" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">X / Twitter</a></li>
                <li><a href="mailto:support_apiclaw@nordsym.com" className="text-text-secondary hover:text-text-primary transition-colors">Support</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border-subtle flex items-center justify-between gap-4 text-xs text-text-muted">
            <span>© 2026 APIClaw</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </footer>

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
                  Managed adapter inventory
                </h3>
                <button 
                  onClick={() => setShowProvidersModal(false)}
                  className="p-2 hover:bg-surface rounded-lg transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
              <p className="text-sm text-text-muted mt-1">{MANAGED_PROVIDER_ADAPTER_COUNT} adapters inventoried. {PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT} provider rails are customer-executable now.</p>
            </div>
            
            <div className="p-4 max-h-[40vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {managedProviders.map((provider, i) => (
                  <div key={i} className="p-3 rounded-xl bg-surface border border-border">
                    <div className="font-medium text-sm">{provider.name}</div>
                    <div className="text-xs text-text-muted">{provider.description}</div>
                    <div className={`text-[10px] mt-2 font-medium ${provider.customerExecutableActions.length > 0 ? "text-emerald-500" : "text-text-muted"}`}>
                      {provider.customerExecutableActions.length > 0 ? "Customer-executable" : "Adapter inventory"}
                    </div>
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
