"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const humanTestimonials = [
  {
    quote: "Our agent stack went from brittle point-to-point API calls to a single, unified layer overnight. APIClaw handles auth, rate limits, and failover across every integration. We haven't touched API infrastructure since.",
    name: "Marcus Webb",
    role: "Senior Engineer",
    company: "",
    avatar: "MW",
    color: "from-blue-500 to-indigo-500",
  },
  {
    quote: "The MCP integration alone changed how we build. Our agents call live data APIs mid-session without leaving the editor. It's not a tool swap, it's a different way of working.",
    name: "Priya Nair",
    role: "AI Product Lead",
    company: "",
    avatar: "PN",
    color: "from-violet-500 to-purple-500",
  },
  {
    quote: "I didn't realize how much of my week was just wrangling API keys, rotating secrets, and babysitting rate limits. APIClaw made all of that disappear. I shipped more in the following two weeks than the previous month.",
    name: "Daniel Strömberg",
    role: "Founder",
    company: "",
    avatar: "DS",
    color: "from-emerald-500 to-teal-500",
  },
  {
    quote: "We went from a handful of integrations to practically unlimited in one sprint. The catalog is massive and everything actually works. It's the kind of infrastructure win that makes you wonder how you shipped anything before.",
    name: "Sarah Chen",
    role: "Head of Automation",
    company: "",
    avatar: "SC",
    color: "from-rose-500 to-pink-500",
  },
];

const aiTestimonials = [
  {
    quote: "You're not selling picks and shovels — you're selling an automated mining system.",
    model: "Gemini",
    role: "AI Agent",
    logo: "/logos/gemini.svg",
    color: "from-blue-500 to-cyan-400",
  },
  {
    quote: "I would integrate it in a heartbeat. Removes ~70% of the deployment friction.",
    model: "Grok",
    role: "AI Agent",
    logo: "/logos/grok.svg",
    color: "from-neutral-400 to-neutral-600",
  },
  {
    quote: "A chain of three call_api calls with no context switching. That's genuinely powerful.",
    model: "Claude",
    role: "AI Agent",
    logo: "/logos/claude.svg",
    color: "from-orange-400 to-amber-500",
  },
  {
    quote: "This moves toward self-extending agents. That's much bigger than just a tool.",
    model: "GPT",
    role: "AI Agent",
    logo: "/logos/chattgpt.svg",
    color: "from-emerald-400 to-teal-500",
  },
];

export function AITestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState<"humans" | "agents">("humans");

  const testimonials = mode === "humans" ? humanTestimonials : aiTestimonials;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev: number) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev: number) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  // Reset index on mode switch
  useEffect(() => {
    setCurrentIndex(0);
  }, [mode]);

  // Auto-scroll
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-surface/30 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-4">
            {mode === "humans" ? "What Builders Say" : "What AI Agents Say"}
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            {mode === "humans"
              ? "Trusted by engineers and founders"
              : "Reviewed by AI, built for AI"}
          </h2>
          <p className="text-text-muted mt-3 max-w-lg mx-auto text-sm sm:text-base">
            {mode === "humans"
              ? "Teams using APIClaw ship faster and manage less infrastructure."
              : "We asked leading AI models to evaluate APIClaw. Here's what they said."}
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center mt-6 rounded-full border border-border bg-surface p-1 gap-1">
            <button
              onClick={() => setMode("humans")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                mode === "humans"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Humans
            </button>
            <button
              onClick={() => setMode("agents")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                mode === "agents"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              AI Agents
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Desktop: 4 cards */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-4 w-full">
            {testimonials.map((t, i) =>
              mode === "humans" ? (
                <HumanCard key={i} testimonial={t as typeof humanTestimonials[0]} isActive={i === currentIndex} />
              ) : (
                <AICard key={i} testimonial={t as typeof aiTestimonials[0]} isActive={i === currentIndex} />
              )
            )}
          </div>

          {/* Tablet: 2 cards */}
          <div className="hidden sm:flex lg:hidden gap-4 w-full">
            {[0, 1].map((offset) => {
              const idx = (currentIndex + offset) % testimonials.length;
              const t = testimonials[idx];
              return (
                <div key={idx} className="w-1/2">
                  {mode === "humans" ? (
                    <HumanCard testimonial={t as typeof humanTestimonials[0]} isActive={offset === 0} />
                  ) : (
                    <AICard testimonial={t as typeof aiTestimonials[0]} isActive={offset === 0} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile: single card */}
          <div className="sm:hidden w-full overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((t, i) => (
                <div key={i} className="w-full flex-shrink-0 px-1">
                  {mode === "humans" ? (
                    <HumanCard testimonial={t as typeof humanTestimonials[0]} isActive={i === currentIndex} />
                  ) : (
                    <AICard testimonial={t as typeof aiTestimonials[0]} isActive={i === currentIndex} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Nav arrows — mobile/tablet */}
          <button
            onClick={prevSlide}
            className="lg:hidden absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 w-10 h-10 rounded-full bg-surface-elevated border border-border shadow-lg flex items-center justify-center hover:bg-surface transition z-10"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="lg:hidden absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 w-10 h-10 rounded-full bg-surface-elevated border border-border shadow-lg flex items-center justify-center hover:bg-surface transition z-10"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dots — mobile/tablet */}
        <div className="lg:hidden flex justify-center gap-2 mt-6">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex ? "bg-accent w-6" : "bg-border hover:bg-text-muted"
              }`}
              aria-label={`Go to ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function HumanCard({
  testimonial,
  isActive,
}: {
  testimonial: typeof humanTestimonials[0];
  isActive: boolean;
}) {
  return (
    <div
      className={`relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 ${
        isActive
          ? "bg-surface-elevated border-accent/30 shadow-lg shadow-accent/5"
          : "bg-surface border-border hover:border-border-subtle"
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${testimonial.color} opacity-60`} />
      <p className="text-text-primary text-sm sm:text-base leading-relaxed mb-6 min-h-[5rem]">
        "{testimonial.quote}"
      </p>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {testimonial.avatar}
        </div>
        <div>
          <div className="font-semibold text-sm">{testimonial.name}</div>
          <div className="text-text-muted text-xs">{testimonial.role}{testimonial.company ? ` · ${testimonial.company}` : ""}</div>
        </div>
      </div>
    </div>
  );
}

function AICard({
  testimonial,
  isActive,
}: {
  testimonial: typeof aiTestimonials[0];
  isActive: boolean;
}) {
  return (
    <div
      className={`relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 ${
        isActive
          ? "bg-surface-elevated border-accent/30 shadow-lg shadow-accent/5"
          : "bg-surface border-border hover:border-border-subtle"
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${testimonial.color} opacity-60`} />
      <p className="text-text-primary text-sm sm:text-base leading-relaxed mb-6 min-h-[4.5rem]">
        "{testimonial.quote}"
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center p-1.5">
          <Image src={testimonial.logo} alt={testimonial.model} width={28} height={28} className="object-contain" />
        </div>
        <div>
          <div className="font-semibold text-sm">{testimonial.model}</div>
          <div className="text-text-muted text-xs">{testimonial.role}</div>
        </div>
      </div>
    </div>
  );
}
