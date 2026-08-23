"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/home/SiteHeader";
import { SiteFooter } from "@/components/home/SiteFooter";

const securityFeatures = [
  {
    title: "AES-256-GCM Encryption",
    description: "All stored credentials are encrypted using AES-256-GCM, the same encryption standard used by governments and financial institutions. Your API keys never exist in plaintext.",
    details: [
      "256-bit encryption keys",
      "Authenticated encryption prevents tampering",
      "Keys derived using secure KDF",
      "Encryption at rest for all sensitive data"
    ]
  },
  {
    title: "Zero Payload Logging",
    description: "We never log request or response payloads. Your data passes through. We don't peek, store, or analyze the content of your API calls.",
    details: [
      "No request body logging",
      "No response content storage",
      "Metadata-only analytics (call counts, latency)",
      "GDPR-compliant data handling"
    ]
  },
  {
    title: "Tenant Isolation",
    description: "Each workspace is completely isolated. Your credentials, usage data, and API configurations are separated at the database level: no cross-tenant data access.",
    details: [
      "Database-level isolation",
      "Separate encryption keys per tenant",
      "No shared credential pools",
      "Audit logs per workspace"
    ]
  },
  {
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
  { name: "SOC 2 Type II", status: "Roadmap 2026" },
  { name: "GDPR Compliant", status: "Active" },
  { name: "TLS 1.3", status: "Active" },
  { name: "AES-256-GCM", status: "Active" },
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

const flowSteps = [
  { label: "Your Agent", desc: "Requests API action" },
  { label: "APIClaw", desc: "Decrypts credentials" },
  { label: "Secure Proxy", desc: "Calls with real key" },
  { label: "API Provider", desc: "Returns response" },
];

const faqs = [
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
    a: "No. We log only metadata: call counts, latency, success/failure status. The actual payloads (your prompts, images, data) are never logged or stored."
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
];

export default function SecurityPage() {
  return (
    <main className="claw min-h-screen overflow-x-hidden">
      <SiteHeader />

      {/* Title */}
      <section>
        <div className="claw-container">
          <div className="max-w-[44rem] py-16 sm:py-20">
            <p className="claw-eyebrow mb-5">Enterprise-Grade Security</p>
            <h1 className="claw-display text-[2.2rem] sm:text-[2.75rem]">
              Your credentials are sacred
            </h1>
            <p className="claw-lede mt-5">
              APIClaw is built from the ground up with security as the foundation.
              Your API keys are encrypted, isolated, and never exposed to agents.
            </p>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section>
        <div className="claw-container">
          <div className="claw-rule" />
          <div className="grid gap-8 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <div>
              <h2 className="claw-h2">Compliance</h2>
            </div>
            <div className="divide-y divide-border-subtle border-y border-border-subtle">
              {complianceBadges.map((badge) => (
                <div key={badge.name} className="flex items-center justify-between gap-4 py-3.5">
                  <span className="text-[15px] text-text-primary">{badge.name}</span>
                  <span className="text-[13px] text-text-muted">{badge.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Security Features */}
      <section>
        <div className="claw-container">
          <div className="claw-rule" />
          <div className="py-16 sm:py-20">
            <div className="max-w-[40rem]">
              <h2 className="claw-h2">How We Protect Your Data</h2>
              <p className="claw-lede mt-4">
                Four pillars of security that make APIClaw safe for your most sensitive integrations.
              </p>
            </div>

            <div className="mt-12 grid gap-12 sm:grid-cols-2 sm:gap-x-16">
              {securityFeatures.map((feature) => (
                <div key={feature.title}>
                  <h3 className="text-[1.25rem] font-semibold tracking-[-0.02em]">{feature.title}</h3>
                  <p className="mt-3 text-[15px] leading-[1.65] text-text-secondary">
                    {feature.description}
                  </p>
                  <ul className="mt-5 divide-y divide-border-subtle border-y border-border-subtle">
                    {feature.details.map((detail) => (
                      <li key={detail} className="py-2.5 text-[14px] text-text-secondary">
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How Managed APIs Work - Security View */}
      <section>
        <div className="claw-container">
          <div className="claw-rule" />
          <div className="grid gap-8 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <div>
              <h2 className="claw-h2">Managed APIs: Secure by Design</h2>
              <p className="claw-lede mt-4">
                Your agent calls APIs without ever seeing credentials.
              </p>
            </div>
            <div>
              <ol className="divide-y divide-border-subtle border-y border-border-subtle">
                {flowSteps.map((step, i) => (
                  <li key={step.label} className="flex items-baseline gap-5 py-3.5">
                    <span className="claw-mono w-6 flex-none text-[12.5px] text-text-muted">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1 text-[15px] text-text-primary">{step.label}</span>
                    <span className="text-[13px] text-text-muted">{step.desc}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-8">
                <p className="claw-eyebrow">Key Insight</p>
                <p className="mt-3 text-[15px] leading-[1.65] text-text-secondary">
                  Your agent sends a request like <code className="claw-mono rounded-[6px] border border-border-subtle bg-surface px-1.5 py-0.5 text-[12.5px] text-text-primary">{"call_api('nasa', 'apod', {})"}</code>.
                  APIClaw adds the real credentials server-side. The agent never sees or stores any API key.
                  Even if compromised, your credentials remain safe.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section>
        <div className="claw-container">
          <div className="claw-rule" />
          <div className="py-16 sm:py-20">
            <h2 className="claw-h2">Security Practices</h2>
            <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-10">
              {securityPractices.map((practice) => (
                <div key={practice.title}>
                  <h3 className="text-[1.25rem] font-semibold tracking-[-0.02em]">{practice.title}</h3>
                  <ul className="mt-5 divide-y divide-border-subtle border-y border-border-subtle">
                    {practice.items.map((item) => (
                      <li key={item} className="py-2.5 text-[14px] leading-[1.55] text-text-secondary">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="claw-container">
          <div className="claw-rule" />
          <div className="grid gap-8 py-16 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <div>
              <h2 className="claw-h2">Security FAQ</h2>
            </div>
            <div className="divide-y divide-border-subtle border-y border-border-subtle">
              {faqs.map((faq) => (
                <div key={faq.q} className="py-6">
                  <h3 className="text-[15px] font-semibold text-text-primary">{faq.q}</h3>
                  <p className="mt-2 text-[15px] leading-[1.65] text-text-secondary">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="claw-container">
          <div className="claw-rule" />
          <div className="flex flex-col gap-6 py-16 sm:py-20 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-[36rem]">
              <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em]">Questions about security?</h2>
              <p className="mt-3 text-[15px] leading-[1.65] text-text-secondary">
                We're happy to discuss our security practices in detail.
                Enterprise customers get dedicated security reviews.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[14.5px]">
              <a
                href="mailto:gustav@nordsym.com?subject=APIClaw%20Security%20Inquiry"
                className="claw-link"
              >
                Contact Security Team
              </a>
              <Link href="/" className="claw-link">
                Back to APIClaw
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
