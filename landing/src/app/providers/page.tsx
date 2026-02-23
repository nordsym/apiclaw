"use client";

import { 
  ArrowRight, Zap, BarChart3, Globe, Shield, Users, Clock, CheckCircle2,
  TrendingUp, Sun, Moon, Github, Twitter
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import statsData from "@/lib/stats.json";

const benefits = [
  {
    icon: Users,
    title: "Agent Traffic",
    description: "Get discovered by thousands of AI agents actively searching for APIs to integrate."
  },
  {
    icon: Zap,
    title: "Zero Integration",
    description: "No SDK needed. Agents find your API through natural language queries."
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track how agents discover, evaluate, and choose your API."
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Your API instantly available to the growing ecosystem of autonomous agents."
  },
];

const steps = [
  {
    step: "1",
    title: "Submit your API",
    description: "Add your API details, OpenAPI spec, and pricing info.",
    time: "2 min"
  },
  {
    step: "2",
    title: "We verify",
    description: "Quick review to ensure quality and accuracy.",
    time: "< 24h"
  },
  {
    step: "3",
    title: "Go live",
    description: "Your API appears in agent search results.",
    time: "Instant"
  },
];

const stats = [
  { value: `${statsData.apiCount.toLocaleString()}+`, label: "APIs listed" },
  { value: statsData.categoryCount.toString(), label: "Categories" },
  { value: "10K+", label: "Daily queries" },
  { value: "Free", label: "To list" },
];

export default function ProvidersPage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    // Default to light
    const prefersDark = saved === 'dark';
    setIsDark(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-2xl">
              🦞
            </div>
            <span className="font-bold text-xl tracking-tight">APIClaw</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-text-muted">
            <Link href="/#how-it-works" className="hover:text-text-primary transition">How It Works</Link>
            <Link href="/#for-agents" className="hover:text-text-primary transition">For Agents</Link>
            <Link href="/providers" className="text-accent font-medium">For Providers</Link>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg hover:bg-surface transition"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link
              href="/providers/register"
              className="btn-primary !py-2.5 !px-5 text-sm"
            >
              <span>List Your API</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-8">
            <TrendingUp className="w-4 h-4" />
            <span>For API Providers</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tighter">
            <span className="gradient-text">Get Your API</span>
            <br />
            <span className="text-text-primary">in Front of AI Agents</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-text-secondary mb-4 max-w-2xl mx-auto leading-relaxed">
            The agentic era is here. Agents don&apos;t browse — they query.
          </p>
          <p className="text-lg text-text-muted mb-12">
            List your API where agents are looking.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/providers/register" className="btn-primary glow">
              <Zap className="w-5 h-5" />
              List Your API — Free
            </Link>
            <a href="#how-it-works" className="btn-secondary">
              <span>How It Works</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-surface-elevated border border-border">
                <div className="text-2xl md:text-3xl font-bold text-accent">{stat.value}</div>
                <div className="text-text-muted text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* Why List on APIClaw */}
      <section className="py-24 px-6 bg-surface/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">BENEFITS</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">Why List on APIClaw?</h2>
            <p className="text-text-secondary text-lg mt-4">
              Position your API for the agent-first future.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="card-hover rounded-2xl bg-surface-elevated border border-border p-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <b.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">PROCESS</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">Listed in 5 Minutes</h2>
            <p className="text-text-secondary text-lg mt-4">
              Simple onboarding. No technical integration required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full bg-accent/20 text-accent font-bold text-2xl flex items-center justify-center mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
                <p className="text-text-secondary mb-3">{item.description}</p>
                <div className="inline-flex items-center gap-2 text-sm text-accent">
                  <Clock className="w-4 h-4" />
                  {item.time}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/providers/register" className="btn-primary glow">
              <Zap className="w-5 h-5" />
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* What You Get */}
      <section className="py-24 px-6 bg-surface/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">INCLUDED</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">Everything You Need</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-surface-elevated border border-border p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <span className="text-2xl">🆓</span>
                Free Tier
              </h3>
              <ul className="space-y-4">
                {[
                  "Listed in API discovery",
                  "Searchable by agents",
                  "Basic analytics",
                  "Category placement",
                  "Link to your docs"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-text-secondary">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-surface-elevated border border-accent/30 p-8 relative">
              <div className="absolute -top-3 right-6 px-3 py-1 bg-accent text-background text-xs font-bold tracking-wide rounded-full uppercase">
                Coming Soon
              </div>
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                Premium
              </h3>
              <ul className="space-y-4">
                {[
                  "Everything in Free",
                  "Featured placement",
                  "Advanced analytics",
                  "Direct provisioning",
                  "Usage-based revenue"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-text-secondary">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">Questions?</h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "Is it really free?",
                a: "Yes. Basic listing is free forever. We may introduce premium features later, but discovery is always free."
              },
              {
                q: "What information do I need?",
                a: "API name, description, category, and pricing model. OpenAPI spec is optional but helps agents understand your API better."
              },
              {
                q: "How long does approval take?",
                a: "Most APIs are reviewed within 24 hours. If you have an OpenAPI spec, it's often instant."
              },
              {
                q: "Do I need to integrate anything?",
                a: "No. Agents discover your API through APIClaw and then use your existing docs and signup flow."
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl bg-surface-elevated border border-border p-6">
                <h3 className="font-semibold text-lg mb-2">{item.q}</h3>
                <p className="text-text-secondary">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-surface/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Ready to reach AI agents?</h2>
          <p className="text-text-secondary text-lg mb-8">
            Join {statsData.apiCount.toLocaleString()}+ APIs already listed on APIClaw.
          </p>
          <Link href="/providers/register" className="btn-primary glow inline-flex">
            <Zap className="w-5 h-5" />
            List Your API — Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-2xl">
                  🦞
                </div>
                <span className="font-bold text-xl tracking-tight">APIClaw</span>
              </Link>
              <p className="text-text-muted mb-6 max-w-sm">
                The API discovery layer for autonomous agents. Connect your API to the agentic era.
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

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-text-muted">
                <li><Link href="/#how-it-works" className="hover:text-text-primary transition">How It Works</Link></li>
                <li><Link href="/#for-agents" className="hover:text-text-primary transition">For Agents</Link></li>
                <li><Link href="/providers" className="hover:text-text-primary transition">For Providers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-text-muted">
                <li><a href="https://nordsym.com" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition">NordSym</a></li>
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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
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
