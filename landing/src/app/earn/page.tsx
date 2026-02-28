'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Star, Twitter, Mail, Users, Sun, Moon, ArrowRight, Copy, Check, Sparkles } from 'lucide-react';

const EARN_CHANNELS = [
  {
    id: 'github',
    iconName: 'star',
    title: 'Star on GitHub',
    description: 'Show some love on GitHub',
    credits: 20,
    cta: 'Star Repository',
    href: 'https://github.com/nordsym/apiclaw',
    color: 'from-red-500/20 to-orange-500/10',
    borderColor: 'hover:border-red-500/50',
    iconColor: 'text-red-500',
  },
  {
    id: 'twitter',
    iconName: 'twitter',
    title: 'Follow @NordSym',
    description: 'Stay updated on X/Twitter',
    credits: 15,
    cta: 'Follow Us',
    href: 'https://x.com/NordSym',
    color: 'from-red-400/20 to-rose-500/10',
    borderColor: 'hover:border-red-400/50',
    iconColor: 'text-red-400',
  },
  {
    id: 'newsletter',
    iconName: 'mail',
    title: 'Join Newsletter',
    description: 'Get weekly updates & tips',
    credits: 15,
    cta: 'Subscribe',
    href: '#newsletter',
    color: 'from-rose-500/20 to-red-500/10',
    borderColor: 'hover:border-rose-500/50',
    iconColor: 'text-rose-500',
  },
  {
    id: 'referral',
    iconName: 'users',
    title: 'Invite Friends',
    description: 'Earn 10 calls for each friend',
    credits: 10,
    perUnit: 'per friend',
    cta: 'Copy Link',
    color: 'from-orange-500/20 to-red-500/10',
    borderColor: 'hover:border-orange-500/50',
    iconColor: 'text-orange-500',
    isReferral: true,
  },
];

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star,
  twitter: Twitter,
  mail: Mail,
  users: Users,
};

function generateReferralCode() {
  return 'CLAW-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function EarnPage() {
  const [referralCode] = useState(() => generateReferralCode());
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [totalCredits] = useState(50); // Demo value - matches free tier max earn
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('apiclaw-theme') as 'light' | 'dark' | null;
    // Default to light
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('apiclaw-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const copyReferralLink = () => {
    const link = `https://apiclaw.com/join?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      // Would hit API here
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-2xl">🦞</span>
            <span className="text-xl font-bold gradient-text-static">
              APIClaw
            </span>
          </Link>
          <nav className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="hidden sm:block text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors text-sm md:text-base">
              Home
            </Link>
            <Link href="/docs" className="hidden md:block text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors text-sm md:text-base">
              Docs
            </Link>
            <Link href="/providers/dashboard" className="hidden md:block text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors text-sm md:text-base">
              Providers
            </Link>
            <span className="text-[var(--accent)] font-medium text-sm md:text-base">
              Earn
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Free API Credits
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="gradient-text">Earn Free Credits</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
            Complete simple tasks to earn API credits. Use them for SMS, search, AI, and more.
          </p>
        </div>

        {/* Credits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {EARN_CHANNELS.map((channel) => (
            <div
              key={channel.id}
              className={`relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br ${channel.color} p-8 transition-all duration-300 ${channel.borderColor} hover:translate-y-[-4px] hover:shadow-xl`}
            >
              {/* Icon */}
              <div className="mb-4">
                {(() => {
                  const IconComponent = IconMap[channel.iconName];
                  return IconComponent ? <IconComponent className={`w-12 h-12 ${channel.iconColor}`} /> : null;
                })()}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-1">{channel.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                {channel.description}
              </p>

              {/* Credits Amount */}
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold gradient-text-static">
                  +{channel.credits}
                </span>
                <span className="text-[var(--text-muted)] text-sm">
                  credits {channel.perUnit || ''}
                </span>
              </div>

              {/* CTA Button */}
              {channel.isReferral ? (
                <button
                  onClick={copyReferralLink}
                  className="w-full py-3 px-6 rounded-xl bg-[var(--accent)] text-white font-semibold hover:bg-[#dc2626] transition-all flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" /> {channel.cta}
                    </>
                  )}
                </button>
              ) : channel.id === 'newsletter' ? (
                subscribed ? (
                  <div className="w-full py-3 px-6 rounded-xl bg-emerald-500/20 text-emerald-400 font-semibold text-center border border-emerald-500/30 flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" /> Subscribed!
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex gap-2">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 py-3 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none transition-colors"
                    />
                    <button
                      type="submit"
                      className="py-3 px-6 rounded-xl bg-[var(--accent)] text-white font-semibold hover:bg-[#dc2626] transition-all"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>
                )
              ) : (
                <a
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-6 rounded-xl bg-[var(--accent)] text-white font-semibold hover:bg-[#dc2626] transition-all flex items-center justify-center gap-2"
                >
                  {channel.cta} <ArrowRight className="w-5 h-5" />
                </a>
              )}

              {/* Referral Code Display */}
              {channel.isReferral && (
                <div className="mt-4 p-3 rounded-lg bg-[var(--surface)]/50 border border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Your referral code:</p>
                  <code className="text-sm font-mono text-[var(--accent)]">{referralCode}</code>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Total Credits Display */}
        <div className="text-center py-12 border-t border-[var(--border)]">
          <p className="text-[var(--text-muted)] text-sm uppercase tracking-widest mb-2">
            Your Balance
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl md:text-6xl font-bold gradient-text">
              {totalCredits.toLocaleString()}
            </span>
            <span className="text-2xl text-[var(--text-secondary)]">credits</span>
          </div>
          <p className="text-[var(--text-muted)] mt-4">
            Credits refresh monthly • No expiration
          </p>
        </div>

        {/* How it works */}
        <div className="mt-16 p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <h2 className="text-2xl font-bold mb-6 text-center">How Credits Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Earn</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Complete tasks above to earn free API credits
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Use</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Spend credits on API calls: SMS, search, AI, and more
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Share</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Invite friends and earn 500 credits for each signup
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 text-center text-[var(--text-muted)]">
          <p>🦞 APIClaw by <a href="https://nordsym.com" className="text-[var(--accent)] hover:underline">NordSym</a></p>
        </div>
      </footer>
    </div>
  );
}
