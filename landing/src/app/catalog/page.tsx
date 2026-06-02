"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, ExternalLink, ArrowRight, Globe, Shield, Key, Zap,
  Loader2, X, Sun, Moon, Github,
  Cloud, Code2, Database, ShoppingCart, MessageSquare, BarChart3,
  Cpu, MapPin, Heart, Lock, Users, Gamepad2, CreditCard, Radio,
  Truck, Building2, Wifi, Landmark, Microscope, Home, Check
} from "lucide-react";
import Link from "next/link";
import statsData from "@/lib/stats.json";

interface ApiEntry {
  name: string;
  description: string;
  category: string;
  baseUrl: string;
  docsUrl: string;
  auth: string;
  pricing: string;
  callable?: boolean;
  verified?: boolean;
  tier?: "managed" | "verified" | "working" | "needs_ctx" | "auth" | "dead" | "untested";
  latency_ms?: number | null;
  last_verified_at?: string | null;
}

interface CategoryInfo {
  total: number;
  callable: number;
  verified?: number;
}

interface CatalogResponse {
  items: ApiEntry[];
  total: number;
  page: number;
  hasMore: boolean;
  categories: Record<string, CategoryInfo>;
  totalCallable: number;
  totalVerified?: number;
  totalManaged?: number;
}

type TierFilter = "" | "managed" | "verified" | "callable" | "discovery";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "AI & ML": <Cpu className="w-3.5 h-3.5" />,
  "Analytics": <BarChart3 className="w-3.5 h-3.5" />,
  "Data & Analytics": <Database className="w-3.5 h-3.5" />,
  "Business": <Building2 className="w-3.5 h-3.5" />,
  "Cloud": <Cloud className="w-3.5 h-3.5" />,
  "Cloud & Infrastructure": <Cloud className="w-3.5 h-3.5" />,
  "Commerce": <ShoppingCart className="w-3.5 h-3.5" />,
  "E-commerce & Retail": <ShoppingCart className="w-3.5 h-3.5" />,
  "Communication": <MessageSquare className="w-3.5 h-3.5" />,
  "Development": <Code2 className="w-3.5 h-3.5" />,
  "DevTools & CI/CD": <Code2 className="w-3.5 h-3.5" />,
  "Entertainment": <Gamepad2 className="w-3.5 h-3.5" />,
  "Finance": <CreditCard className="w-3.5 h-3.5" />,
  "Finance & Payments": <CreditCard className="w-3.5 h-3.5" />,
  "Health": <Heart className="w-3.5 h-3.5" />,
  "Healthcare & Science": <Microscope className="w-3.5 h-3.5" />,
  "Location": <MapPin className="w-3.5 h-3.5" />,
  "Geolocation & Maps": <MapPin className="w-3.5 h-3.5" />,
  "Security": <Lock className="w-3.5 h-3.5" />,
  "Security & Identity": <Shield className="w-3.5 h-3.5" />,
  "Social": <Users className="w-3.5 h-3.5" />,
  "Utilities": <Zap className="w-3.5 h-3.5" />,
  "Media & Content": <Globe className="w-3.5 h-3.5" />,
  "Telecom & Network": <Radio className="w-3.5 h-3.5" />,
  "Transport & Logistics": <Truck className="w-3.5 h-3.5" />,
  "Travel & Aviation": <Globe className="w-3.5 h-3.5" />,
  "IoT & Hardware": <Wifi className="w-3.5 h-3.5" />,
  "Government & Public Data": <Landmark className="w-3.5 h-3.5" />,
  "Real Estate": <Home className="w-3.5 h-3.5" />,
};

const MANAGED_PROVIDERS: ApiEntry[] = [
  { name: "OpenAI", description: "GPT-5.4, GPT-5, GPT-4o, o3, o4-mini. Direct routing via Intelligent Gateway, OAuth passthrough supported.", category: "AI & ML", baseUrl: "https://api.openai.com", docsUrl: "https://platform.openai.com/docs", auth: "managed", pricing: "paid", callable: true, tier: "managed", verified: true },
  { name: "Anthropic", description: "Claude Opus, Sonnet, and Haiku — direct routing without OpenRouter markup.", category: "AI & ML", baseUrl: "https://api.anthropic.com", docsUrl: "https://docs.anthropic.com", auth: "managed", pricing: "paid", callable: true, tier: "managed", verified: true },
  { name: "OpenRouter", description: "800+ LLM models through a single API. GPT-4, Claude, Llama, Mistral, Gemini and more. Routed via Intelligent Gateway.", category: "AI & ML", baseUrl: "https://openrouter.ai", docsUrl: "https://openrouter.ai/docs", auth: "managed", pricing: "paid", callable: true, tier: "managed", verified: true },
  { name: "xAI / Grok", description: "Grok-4, Grok-3, Grok-3-mini, Grok-2. Direct routing.", category: "AI & ML", baseUrl: "https://api.x.ai", docsUrl: "https://docs.x.ai", auth: "managed", pricing: "paid", callable: true, tier: "managed", verified: true },
  { name: "Brave Search", description: "Privacy-focused web search API. Web, news, and image search with AI-ready structured results.", category: "Utilities", baseUrl: "https://api.search.brave.com", docsUrl: "https://brave.com/search/api/", auth: "managed", pricing: "freemium", callable: true, tier: "managed", verified: true },
  { name: "ElevenLabs", description: "AI voice generation and text-to-speech. Natural-sounding voices in 29 languages.", category: "AI & ML", baseUrl: "https://api.elevenlabs.io", docsUrl: "https://elevenlabs.io/docs", auth: "managed", pricing: "freemium", callable: true, tier: "managed", verified: true },
  { name: "Replicate", description: "Thousands of ML models. Stable Diffusion, Flux, Whisper, LLaMA and more. Run any open-source model on demand.", category: "AI & ML", baseUrl: "https://api.replicate.com", docsUrl: "https://replicate.com/docs", auth: "managed", pricing: "paid", callable: true, tier: "managed", verified: true },
  { name: "Firecrawl", description: "Web scraping API for AI. Extract clean, structured data from any website.", category: "Utilities", baseUrl: "https://api.firecrawl.dev", docsUrl: "https://docs.firecrawl.dev", auth: "managed", pricing: "freemium", callable: true, tier: "managed", verified: true },
  { name: "E2B", description: "Code execution sandbox for AI agents. Run untrusted code safely in isolated environments.", category: "Development", baseUrl: "https://api.e2b.dev", docsUrl: "https://e2b.dev/docs", auth: "managed", pricing: "freemium", callable: true, tier: "managed", verified: true },
  { name: "Groq", description: "Ultra-fast LLM inference. Llama, Mixtral, and Gemma models at industry-leading speed.", category: "AI & ML", baseUrl: "https://api.groq.com", docsUrl: "https://console.groq.com/docs", auth: "managed", pricing: "freemium", callable: true, tier: "managed", verified: true },
  { name: "Deepgram", description: "Speech-to-text and text-to-speech API. Real-time transcription with high accuracy.", category: "AI & ML", baseUrl: "https://api.deepgram.com", docsUrl: "https://developers.deepgram.com", auth: "managed", pricing: "freemium", callable: true, tier: "managed", verified: true },
  { name: "Serper", description: "Google Search API. Fast, affordable access to Google search results for AI applications.", category: "Utilities", baseUrl: "https://google.serper.dev", docsUrl: "https://serper.dev/docs", auth: "managed", pricing: "freemium", callable: true, tier: "managed", verified: true },
  { name: "Mistral AI", description: "European AI models. Mistral, Mixtral, and custom fine-tuned models via API.", category: "AI & ML", baseUrl: "https://api.mistral.ai", docsUrl: "https://docs.mistral.ai", auth: "managed", pricing: "paid", callable: true, tier: "managed", verified: true },
  { name: "Cohere", description: "Enterprise AI platform. Embed, generate, classify, and rerank with production-grade models.", category: "AI & ML", baseUrl: "https://api.cohere.ai", docsUrl: "https://docs.cohere.com", auth: "managed", pricing: "freemium", callable: true, tier: "managed", verified: true },
  { name: "Together AI", description: "Open-source model inference. Run Llama, DeepSeek, and 100+ models with serverless or dedicated.", category: "AI & ML", baseUrl: "https://api.together.xyz", docsUrl: "https://docs.together.ai", auth: "managed", pricing: "paid", callable: true, tier: "managed", verified: true },
  { name: "Stability AI", description: "Image generation API. Stable Diffusion, SDXL, and next-gen image models.", category: "AI & ML", baseUrl: "https://api.stability.ai", docsUrl: "https://platform.stability.ai/docs", auth: "managed", pricing: "paid", callable: true, tier: "managed", verified: true },
  { name: "AssemblyAI", description: "AI models for speech recognition, summarization, and audio intelligence.", category: "AI & ML", baseUrl: "https://api.assemblyai.com", docsUrl: "https://www.assemblyai.com/docs", auth: "managed", pricing: "freemium", callable: true, tier: "managed", verified: true },
  { name: "GitHub API", description: "Access GitHub repositories, issues, pull requests, actions, and more programmatically.", category: "Development", baseUrl: "https://api.github.com", docsUrl: "https://docs.github.com/rest", auth: "managed", pricing: "freemium", callable: true, tier: "managed", verified: true },
  { name: "APILayer", description: "22 callable APIs. Currency exchange, IP geolocation, stock data, aviation, screenshots, email verification and more.", category: "Finance", baseUrl: "https://apilayer.com", docsUrl: "https://apilayer.com/docs", auth: "managed", pricing: "freemium", callable: true, tier: "managed", verified: true },
];

const AUTH_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  managed: { label: "Managed", icon: <Shield className="w-3 h-3" /> },
  apiKey: { label: "API Key", icon: <Key className="w-3 h-3" /> },
  oauth: { label: "OAuth", icon: <Shield className="w-3 h-3" /> },
  none: { label: "Open", icon: <Globe className="w-3 h-3" /> },
  unknown: { label: "Auth", icon: <Lock className="w-3 h-3" /> },
};

export default function CatalogPage() {
  const [apis, setApis] = useState<ApiEntry[]>([]);
  const [categories, setCategories] = useState<Record<string, CategoryInfo>>({});
  const [total, setTotal] = useState(0);
  const [totalCallable, setTotalCallable] = useState(0);
  const [totalVerified, setTotalVerified] = useState(0);
  const [totalManaged, setTotalManaged] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("");
  const [callableOnly, setCallableOnly] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const dark = saved === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setApis([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
  }, [debouncedQuery, selectedCategory, callableOnly, tierFilter]);

  const fetchPage = useCallback(
    async (p: number, append: boolean) => {
      const params = new URLSearchParams({ page: String(p), limit: "60" });
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (selectedCategory) params.set("category", selectedCategory);
      if (tierFilter) params.set("tier", tierFilter);
      else if (callableOnly) params.set("callable", "true");

      try {
        const res = await fetch(`/api/catalog?${params}`);
        const data: CatalogResponse = await res.json();

        // Prepend the canonical managed-provider list on first page when the
        // active view includes managed APIs. /api/catalog also tags managed
        // entries via verification-status, but the registry doesn't carry the
        // marketing copy we want here, so we keep this curated list as the
        // visual source of truth for the Tier 1 row.
        let items = data.items;
        let extraCount = 0;
        const showManagedAtTop =
          p === 1 &&
          (tierFilter === "managed" ||
            tierFilter === "verified" ||
            tierFilter === "callable" ||
            (callableOnly && !tierFilter));
        if (showManagedAtTop) {
          let managed = MANAGED_PROVIDERS;
          if (debouncedQuery) {
            const q = debouncedQuery.toLowerCase();
            managed = managed.filter(a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
          }
          if (selectedCategory) {
            managed = managed.filter(a => a.category === selectedCategory);
          }
          // Avoid double-listing: drop any /api/catalog row whose lowercase
          // name matches a managed entry we're prepending.
          const managedNames = new Set(managed.map((m) => m.name.toLowerCase()));
          items = [...managed, ...items.filter((it) => !managedNames.has((it.name || "").toLowerCase()))];
          extraCount = managed.length;
        }

        setApis((prev) => (append ? [...prev, ...items] : items));
        setTotal(data.total + (p === 1 ? extraCount : 0));
        setTotalCallable(data.totalCallable);
        setTotalVerified(data.totalVerified ?? 0);
        setTotalManaged(data.totalManaged ?? MANAGED_PROVIDERS.length);
        setHasMore(data.hasMore);
        setCategories(data.categories);
      } catch (err) {
        console.error("Catalog fetch error:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedQuery, selectedCategory, callableOnly, tierFilter]
  );

  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPage(nextPage, true);
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchPage]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const sortedCategories = Object.entries(categories).sort(
    ([, a], [, b]) => b.total - a.total
  );

  const indexedCount = statsData.apiCount || 26701;
  const callableHeadline = statsData.callableCount ?? 2906;
  const discoveryOnlyHeadline = Math.max(0, indexedCount - callableHeadline);

  return (
    <main className="min-h-screen bg-background text-text-primary">
      {/* Top banner */}
      <div className="fixed top-0 w-full z-[60] bg-accent text-background text-center py-2 px-4 text-sm font-medium">
        🦞 <span className="font-bold">Early Access</span> -- Join the first wave of agents
      </div>

      {/* Header */}
      <header className="fixed top-9 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-accent/20 flex items-center justify-center text-xl sm:text-2xl">
                🦞
              </div>
              <span className="font-bold text-lg sm:text-xl tracking-tight">APIClaw</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-text-muted">
            <span className="text-accent font-medium">Catalog</span>
            <a href="/#how-it-works" className="transition hover:text-text-primary">How It Works</a>
            <a href="/#for-agents" className="transition hover:text-text-primary">For Agents</a>
            <a href="/#for-providers" className="transition hover:text-text-primary">For API Owners</a>
            <a href="/#faq" className="transition hover:text-text-primary">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <a href="/workspace" className="text-sm text-text-muted hover:text-accent transition flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Workspace
            </a>
            <button onClick={toggleTheme} className="p-2.5 rounded-lg hover:bg-surface transition" aria-label="Toggle theme">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <a href="https://github.com/nordsym/apiclaw" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-surface transition">
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="pt-32 pb-24 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Title + stats */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">API Catalog</h1>
          <p className="text-text-secondary text-base max-w-2xl mb-6">
            {indexedCount.toLocaleString()} APIs discoverable by AI agents. {callableHeadline.toLocaleString()} callable through APIClaw after free signup.
          </p>

          <div className="flex flex-wrap gap-6 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-accent" />
              <span><span className="text-text-primary font-semibold">{indexedCount.toLocaleString()}</span> discoverable</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <span><span className="text-text-primary font-semibold">{callableHeadline.toLocaleString()}</span> callable</span>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-accent" />
              <span><span className="text-text-primary font-semibold">{discoveryOnlyHeadline.toLocaleString()}</span> discovery-only</span>
            </div>
          </div>
        </div>

        {/* Tier filter row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs uppercase tracking-wider text-text-muted mr-1">View</span>
            {([
              { id: "", label: "All", count: indexedCount, icon: <Database className="w-3.5 h-3.5" /> },
              { id: "callable", label: "Callable", count: callableHeadline, icon: <Zap className="w-3.5 h-3.5" /> },
              { id: "discovery", label: "Discovery only", count: discoveryOnlyHeadline, icon: <Search className="w-3.5 h-3.5" /> },
            ] as const).map(({ id, label, count, icon }) => {
            const active = tierFilter === id;
            return (
              <button
                key={id || "all"}
                onClick={() => { setTierFilter(id as TierFilter); if (id) setCallableOnly(false); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  active
                    ? "bg-accent/10 border-accent/20 text-accent"
                    : "bg-surface border-border text-text-muted hover:text-text-primary"
                }`}
              >
                {icon}
                {label}
                <span className="opacity-60">{count.toLocaleString()}</span>
              </button>
            );
          })}
        </div>

        {/* Search + callable toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search APIs... (press /)"
              className="w-full pl-10 pr-10 py-2.5 bg-surface border border-border rounded-xl text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory("")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent/10 border border-accent/20 text-accent rounded-xl text-sm font-medium hover:bg-accent/15 transition"
            >
              {CATEGORY_ICONS[selectedCategory] || <Globe className="w-3.5 h-3.5" />}
              {selectedCategory}
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Callable toggle */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setCallableOnly(!callableOnly)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition ${
              callableOnly
                ? "bg-accent/10 border-accent/20 text-accent"
                : "bg-surface border-border text-text-muted hover:text-text-primary"
            }`}
          >
            <Zap className="w-4 h-4" />
            Callable only
            <span className="opacity-60">{(totalCallable).toLocaleString()}</span>
          </button>
          <span className="text-xs text-text-muted">
            {callableOnly ? "Showing APIs your agent can call right now" : "Showing all discoverable APIs"}
          </span>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory("")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              !selectedCategory
                ? "bg-accent/10 border-accent/20 text-accent"
                : "bg-surface border-border text-text-muted hover:text-text-primary"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Discoverable
            <span className="opacity-60">{callableOnly ? totalCallable.toLocaleString() : indexedCount.toLocaleString()}</span>
          </button>
          {sortedCategories.map(([cat, info]) => {
            const isActive = cat === selectedCategory;
            const count = callableOnly ? info.callable : info.total;
            if (callableOnly && info.callable === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(isActive ? "" : cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  isActive
                    ? "bg-accent/10 border-accent/20 text-accent"
                    : "bg-surface border-border text-text-muted hover:text-text-primary hover:border-border"
                }`}
              >
                {CATEGORY_ICONS[cat] || <Globe className="w-3.5 h-3.5" />}
                {cat}
                <span className="opacity-60">{count.toLocaleString()}</span>
              </button>
            );
          })}
        </div>

        {/* Result count */}
        {!loading && (
          <div className="text-xs text-text-muted mb-4">
            {total.toLocaleString()} {callableOnly ? "callable " : ""}APIs{selectedCategory ? ` in ${selectedCategory}` : ""}{query ? ` matching "${query}"` : ""}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
          </div>
        ) : apis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-text-muted">
            <Search className="w-8 h-8 mb-3 opacity-40" />
            <p className="text-base font-medium">No APIs found</p>
            <p className="text-sm mt-1">Try a different search or clear filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {apis.map((api, i) => (
                <ApiCard key={`${api.name}-${i}`} api={api} />
              ))}
            </div>

            <div ref={sentinelRef} className="h-1" />

            {loadingMore && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-accent mr-2" />
                <span className="text-sm text-text-muted">Loading more...</span>
              </div>
            )}

            {!hasMore && apis.length > 0 && (
              <div className="text-center py-12 text-text-muted text-sm">
                All {total.toLocaleString()} APIs loaded
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="text-text-secondary text-sm mb-4">
            Every API in this catalog is discoverable by AI agents via APIClaw.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="/#install"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl text-sm transition">
              Install APIClaw
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href="https://github.com/nordsym/apiclaw" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-border hover:bg-surface rounded-xl text-sm font-medium transition">
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

function ApiCard({ api }: { api: ApiEntry }) {
  const auth = AUTH_CONFIG[api.auth] || AUTH_CONFIG.unknown;
  const icon = CATEGORY_ICONS[api.category] || <Globe className="w-3.5 h-3.5" />;
  const desc = api.description.length > 120 ? api.description.slice(0, 120) + "..." : api.description;

  return (
    <div className="group bg-surface border border-border hover:border-accent/20 rounded-xl p-4 transition">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-text-muted shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{api.name}</h3>
          </div>
        </div>
        {api.docsUrl && (
          <a href={api.docsUrl} target="_blank" rel="noopener noreferrer"
            className="text-text-muted hover:text-accent transition shrink-0 opacity-0 group-hover:opacity-100">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <p className="text-xs text-text-muted leading-relaxed mb-3 line-clamp-2 min-h-[2.5rem]">
        {desc || "No description available."}
      </p>

      <div className="flex items-center gap-1.5 flex-wrap">
        {(api.callable || api.auth === "managed" || api.tier === "managed") ? (
          <>
            {api.auth === "managed" || api.tier === "managed" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Shield className="w-2.5 h-2.5" />
                Managed
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent"
                title={api.latency_ms ? `Smoketest verified · ${api.latency_ms} ms` : "Callable through APIClaw"}
              >
                <Zap className="w-2.5 h-2.5" />
                Callable
                {api.latency_ms ? <span className="opacity-60">{api.latency_ms}ms</span> : null}
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-background border border-border text-text-muted">
              {api.category}
            </span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-background border border-border text-text-muted">
              {auth.icon}
              {auth.label}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-background border border-border text-text-muted">
              {api.category}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
