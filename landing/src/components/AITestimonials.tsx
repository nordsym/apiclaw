"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

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

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev: number) => (prev + 1) % aiTestimonials.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev: number) => (prev - 1 + aiTestimonials.length) % aiTestimonials.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-surface/30 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-4">
            What AI Agents Say
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Reviewed by AI, built for AI
          </h2>
          <p className="text-text-muted mt-3 max-w-lg mx-auto text-sm sm:text-base">
            We asked leading AI models to evaluate APIClaw. Here&apos;s what they said.
          </p>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="hidden lg:grid lg:grid-cols-4 gap-4 w-full">
            {aiTestimonials.map((t, i) => (
              <AICard key={i} testimonial={t} isActive={i === currentIndex} />
            ))}
          </div>

          <div className="hidden sm:flex lg:hidden gap-4 w-full">
            {[0, 1].map((offset) => {
              const idx = (currentIndex + offset) % aiTestimonials.length;
              const t = aiTestimonials[idx];
              return (
                <div key={idx} className="w-1/2">
                  <AICard testimonial={t} isActive={offset === 0} />
                </div>
              );
            })}
          </div>

          <div className="sm:hidden w-full overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {aiTestimonials.map((t, i) => (
                <div key={i} className="w-full flex-shrink-0 px-1">
                  <AICard testimonial={t} isActive={i === currentIndex} />
                </div>
              ))}
            </div>
          </div>

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

        <div className="lg:hidden flex justify-center gap-2 mt-6">
          {aiTestimonials.map((_, i) => (
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
        &ldquo;{testimonial.quote}&rdquo;
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
