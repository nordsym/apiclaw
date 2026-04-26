"use client";

import { 
  Shield, Lock, Eye, EyeOff, Server, Users, Key, 
  CheckCircle2, ArrowLeft, ExternalLink, Database,
  FileKey, ShieldCheck, Fingerprint, Cloud
} from "lucide-react";
import Link from "next/link";

const securityFeatures = [
  {
    icon: Lock,
    title: "AES-256-GCM Encryption",
    description: "All stored credentials are encrypted using AES-256-GCM — the same encryption standard used by governments and financial institutions. Your API keys never exist in plaintext.",
    details: [
      "256-bit encryption keys",
      "Authenticated encryption prevents tampering",
      "Keys derived using secure KDF",
      "Encryption at rest for all sensitive data"
    ]
  },
  {
    icon: EyeOff,
    title: "Zero Payload Logging",
    description: "We never log request or response payloads. Your data passes through — we don't peek, store, or analyze the content of your API calls.",
    details: [
      "No request body logging",
      "No response content storage",
      "Metadata-only analytics (call counts, latency)",
      "GDPR-compliant data handling"
    ]
  },
  {
    icon: Users,
    title: "Tenant Isolation",
    description: "Each workspace is completely isolated. Your credentials, usage data, and API configurations are separated at the database level — no cross-tenant data access.",
    details: [
      "Database-level isolation",
      "Separate encryption keys per tenant",
      "No shared credential pools",
      "Audit logs per workspace"
    ]
  },
  {
    icon: Server,
    title: "Server-Side Proxy",
    description: "Managed API calls are proxied server-side. Your agent never sees the actual API credentials. They stay on our secure infrastructure.",
    details: [
      "Credentials never sent to agents",
      "TLS 1.3 for all connections",
      "Request signing and verification",
      "IP allowlisting available (Enterprise)"
    ]
  }
];

const complianceBadges = [
  { name: "SOC 2 Type II", status: "Roadmap 2026", icon: ShieldCheck },
  { name: "GDPR Compliant", status: "Active", icon: CheckCircle2 },
  { name: "TLS 1.3", status: "Active", icon: Lock },
  { name: "AES-256-GCM", status: "Active", icon: FileKey },
];

const securityPractices = [
  {
    title: "Infrastructure Security",
    items: [
      "Hosted on Vercel Edge Network with automatic DDoS protection",
      "Database on Convex with built-in encryption",
      "No single points of failure",
      "Automatic security patches"
    ]
  },
  {
    title: "Access Control",
    items: [
      "API key authentication for all requests",
      "Rate limiting to prevent abuse",
      "Workspace-level permissions",
      "Session management with secure tokens"
    ]
  },
  {
    title: "Development Practices",
    items: [
      "Security-first code reviews",
      "Dependency vulnerability scanning",
      "No secrets in version control",
      "Principle of least privilege"
    ]
  }
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-2xl">
              🦞
            </div>
            <span className="font-bold text-xl tracking-tight">APIClaw</span>
          </Link>
          <Link 
            href="/"
            className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Enterprise-Grade Security
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Your credentials are <span className="gradient-text">sacred</span>
          </h1>
          
          <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            APIClaw is built from the ground up with security as the foundation. 
            Your API keys are encrypted, isolated, and never exposed to agents.
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 px-6 border-y border-border bg-surface/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {complianceBadges.map((badge, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-4 rounded-xl bg-surface-elevated border border-border"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  badge.status === "Active" 
                    ? "bg-green-500/10 text-green-500" 
                    : "bg-accent/10 text-accent"
                }`}>
                  <badge.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-sm">{badge.name}</div>
                  <div className={`text-xs ${
                    badge.status === "Active" ? "text-green-500" : "text-accent"
                  }`}>
                    {badge.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Security Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              How We Protect Your Data
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Four pillars of security that make APIClaw safe for your most sensitive integrations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {securityFeatures.map((feature, i) => (
              <div 
                key={i} 
                className="p-8 rounded-2xl bg-surface-elevated border border-border hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
                    <feature.icon className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                </div>
                
                <p className="text-text-secondary mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                <ul className="space-y-3">
                  {feature.details.map((detail, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-text-muted">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Managed APIs Work - Security View */}
      <section className="py-20 px-6 bg-surface/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Managed APIs: Secure by Design
            </h2>
            <p className="text-text-secondary text-lg">
              Your agent calls APIs without ever seeing credentials.
            </p>
          </div>

          <div className="relative">
            {/* Flow diagram */}
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: "🤖", label: "Your Agent", desc: "Requests API action" },
                { icon: "🦞", label: "APIClaw", desc: "Decrypts credentials" },
                { icon: "🔐", label: "Secure Proxy", desc: "Calls with real key" },
                { icon: "🌐", label: "API Provider", desc: "Returns response" },
              ].map((step, i) => (
                <div key={i} className="relative">
                  <div className="p-6 rounded-xl bg-surface-elevated border border-border text-center">
                    <div className="text-3xl mb-3">{step.icon}</div>
                    <div className="font-medium mb-1">{step.label}</div>
                    <div className="text-sm text-text-muted">{step.desc}</div>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-accent">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Security callout */}
            <div className="mt-8 p-6 rounded-xl bg-green-500/5 border border-green-500/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-400 mb-1">Key Insight</h4>
                  <p className="text-text-secondary text-sm">
                    Your agent sends a request like <code className="bg-surface px-2 py-0.5 rounded text-xs">{"call_api('replicate', 'flux-schnell', {...})"}</code>. 
                    APIClaw adds the real credentials server-side. The agent never sees or stores any API key — 
                    even if compromised, your credentials remain safe.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Practices Grid */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Security Practices
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {securityPractices.map((practice, i) => (
              <div key={i}>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  {practice.title}
                </h3>
                <ul className="space-y-3">
                  {practice.items.map((item, j) => (
                    <li key={j} className="text-text-secondary text-sm pl-7 relative">
                      <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-border" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-surface/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">
            Security FAQ
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "Where are credentials stored?",
                a: "All credentials are stored in our Convex database, encrypted with AES-256-GCM before storage. We use secure key derivation and rotation practices."
              },
              {
                q: "Can agents access my raw API keys?",
                a: "No. Agents only send instructions (provider, action, parameters). APIClaw injects the real credentials server-side. Your keys never leave our infrastructure."
              },
              {
                q: "Do you log API request/response content?",
                a: "No. We log only metadata: call counts, latency, success/failure status. The actual payloads — your prompts, images, data — are never logged or stored."
              },
              {
                q: "What happens if APIClaw is breached?",
                a: "Even in a breach scenario, credentials are encrypted at rest. Without the encryption keys (stored separately), raw database access yields only ciphertext."
              },
              {
                q: "Are you SOC 2 compliant?",
                a: "SOC 2 Type II certification is on our roadmap for 2026. We currently follow SOC 2-aligned practices and are preparing for formal audit."
              },
              {
                q: "Do I need to manage API keys for providers?",
                a: "No. APIClaw is zero-config by design: for managed providers APIClaw holds the keys, and for open public APIs no key is required. If an API cannot be served either way it stays in Discovery until a managed adapter is added."
              }
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-xl bg-surface-elevated border border-border">
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
            <h2 className="text-2xl font-bold mb-4">
              Questions about security?
            </h2>
            <p className="text-text-secondary mb-6">
              We're happy to discuss our security practices in detail. 
              Enterprise customers get dedicated security reviews.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:gustav@nordsym.com?subject=APIClaw%20Security%20Inquiry"
                className="btn-primary"
              >
                Contact Security Team
                <ExternalLink className="w-4 h-4" />
              </a>
              <Link href="/" className="btn-ghost">
                Back to APIClaw
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦞</span>
            <span className="text-text-muted text-sm">© 2026 NordSym. Security-first API layer.</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <Lock className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-500 font-medium">AES-256-GCM Encrypted</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
