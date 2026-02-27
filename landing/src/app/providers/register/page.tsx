"use client";

import { 
  ArrowRight, ArrowLeft, Check, Loader2, Sun, Moon, Github, AlertCircle,
  FileJson, Globe, DollarSign, Tag, Sparkles, ExternalLink
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

const categories = [
  "SMS & Messaging",
  "Email",
  "Search",
  "AI & LLM",
  "Voice & TTS",
  "Crypto & Blockchain",
  "Market Data",
  "Payments",
  "Authentication",
  "Storage & Files",
  "Analytics",
  "Social Media",
  "Weather",
  "Maps & Location",
  "Translation",
  "OCR & Vision",
  "News",
  "E-commerce",
  "Other"
];

const pricingModels = [
  { value: "free", label: "Free", description: "Completely free to use" },
  { value: "freemium", label: "Freemium", description: "Free tier + paid plans" },
  { value: "paid", label: "Paid", description: "Paid only (trial available)" },
];

type FormData = {
  // Step 1: Provider Info
  providerName: string;
  email: string;
  website: string;
  
  // Step 2: API Details
  apiName: string;
  description: string;
  category: string;
  
  // Step 3: Technical
  openApiUrl: string;
  docsUrl: string;
  
  // Step 4: Pricing
  pricingModel: string;
  pricingNotes: string;
};

export default function RegisterPage() {
  const [isDark, setIsDark] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [parseStatus, setParseStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    providerName: "",
    email: "",
    website: "",
    apiName: "",
    description: "",
    category: "",
    openApiUrl: "",
    docsUrl: "",
    pricingModel: "freemium",
    pricingNotes: "",
  });

  // Check if user is logged in and pre-fill provider info
  useEffect(() => {
    const token = localStorage.getItem('apiclaw_session');
    const providerData = localStorage.getItem('apiclaw_provider');
    
    if (token && providerData) {
      try {
        const provider = JSON.parse(providerData);
        setFormData(prev => ({
          ...prev,
          providerName: provider.name || prev.providerName,
          email: provider.email || prev.email,
          website: provider.website || prev.website,
        }));
        setIsLoggedIn(true);
        // Skip to step 2 if logged in
        setStep(2);
      } catch {
        // Invalid provider data, continue as guest
      }
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = saved ? saved === 'dark' : true;
    setIsDark(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const parseOpenApiSpec = async () => {
    if (!formData.openApiUrl) return;
    
    setParseStatus('parsing');
    try {
      const response = await fetch(formData.openApiUrl);
      if (!response.ok) throw new Error('Could not fetch spec');
      
      const spec = await response.json();
      
      // Extract info from OpenAPI spec
      if (spec.info) {
        if (spec.info.title && !formData.apiName) {
          updateField('apiName', spec.info.title);
        }
        if (spec.info.description && !formData.description) {
          updateField('description', spec.info.description.slice(0, 500));
        }
      }
      
      setParseStatus('success');
      setTimeout(() => setParseStatus('idle'), 3000);
    } catch {
      setParseStatus('error');
      setTimeout(() => setParseStatus('idle'), 3000);
    }
  };

  const validateStep = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1:
        if (!formData.providerName.trim()) {
          setError("Provider name is required");
          return false;
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
          setError("Valid email is required");
          return false;
        }
        return true;
      case 2:
        if (!formData.apiName.trim()) {
          setError("API name is required");
          return false;
        }
        if (!formData.description.trim()) {
          setError("Description is required");
          return false;
        }
        if (!formData.category) {
          setError("Please select a category");
          return false;
        }
        return true;
      case 3:
        // OpenAPI URL is optional
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('apiclaw_session');
      
      // If logged in, add API to existing account
      if (token && isLoggedIn) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL || 'https://adventurous-avocet-799.convex.cloud'}/api/mutation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'providers:addAPI',
            args: {
              token,
              api: {
                name: formData.apiName,
                description: formData.description,
                category: formData.category,
                openApiUrl: formData.openApiUrl || undefined,
                docsUrl: formData.docsUrl || undefined,
                pricingModel: formData.pricingModel,
                pricingNotes: formData.pricingNotes || undefined,
              }
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to add API');
        }
        
        setIsComplete(true);
        return;
      }
      
      // Submit to Convex (new provider)
      const response = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL || 'https://adventurous-avocet-799.convex.cloud'}/api/mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'providers:registerProvider',
          args: {
            provider: {
              name: formData.providerName,
              email: formData.email,
              website: formData.website,
            },
            api: {
              name: formData.apiName,
              description: formData.description,
              category: formData.category,
              openApiUrl: formData.openApiUrl || undefined,
              docsUrl: formData.docsUrl || undefined,
              pricingModel: formData.pricingModel,
              pricingNotes: formData.pricingNotes || undefined,
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Submission failed');
      }

      // Parse response and save session token for auto-login
      const result = await response.json();
      if (result.value?.sessionToken) {
        localStorage.setItem('apiclaw_session', result.value.sessionToken);
      }

      // Send confirmation email via Symbot SMTP
      await fetch('https://nordsym.app.n8n.cloud/webhook/symbot-gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'smtp',
          to: formData.email,
          subject: `🦞 Your API "${formData.apiName}" is now listed on APIClaw`,
          message: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="font-size: 48px;">🦞</span>
                <h1 style="margin: 16px 0 8px; font-size: 24px; font-weight: 700;">Welcome to APIClaw!</h1>
              </div>
              
              <p style="color: #525252; font-size: 16px; line-height: 1.6;">
                Hey there,
              </p>
              
              <p style="color: #525252; font-size: 16px; line-height: 1.6;">
                <strong>${formData.apiName}</strong> has been submitted to APIClaw and is now discoverable by AI agents.
              </p>
              
              <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; font-size: 16px;">What's next?</h3>
                <ul style="color: #525252; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Your API is listed in our registry</li>
                  <li style="margin-bottom: 8px;">Agents can now discover it via MCP</li>
                  <li>We'll notify you when agents start finding your API</li>
                </ul>
              </div>
              
              <p style="color: #525252; font-size: 16px; line-height: 1.6;">
                Questions? Reply to this email or reach out on <a href="https://twitter.com/nordsym" style="color: #ef4444;">Twitter</a>.
              </p>
              
              <p style="color: #737373; font-size: 14px; margin-top: 32px;">
                - The APIClaw Team<br>
                <a href="https://apiclaw.nordsym.com" style="color: #ef4444;">apiclaw.nordsym.com</a>
              </p>
            </div>
          `
        })
      }).catch(() => {
        // Email failure shouldn't block success
        console.log('Email notification failed, but registration succeeded');
      });

      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (isComplete) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-8">
            <Check className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-3xl font-bold mb-4">You&apos;re Listed! 🦞</h1>
          <p className="text-text-secondary mb-8">
            <strong>{formData.apiName}</strong> is now discoverable by AI agents on APIClaw.
            We&apos;ve sent a confirmation to <strong>{formData.email}</strong>.
          </p>
          <div className="space-y-4">
            <Link href="/" className="btn-primary w-full justify-center">
              <Sparkles className="w-5 h-5" />
              Explore APIClaw
            </Link>
            <Link href="/providers" className="btn-secondary w-full justify-center">
              Back to Provider Hub
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center text-xl">
              🦞
            </div>
            <span className="font-bold text-lg tracking-tight">APIClaw</span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <span className="text-sm text-text-muted hidden sm:block">
                Logged in as <strong className="text-text-primary">{formData.providerName}</strong>
              </span>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--surface)] transition"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {isLoggedIn ? (
              <Link
                href="/providers/dashboard"
                className="btn-secondary !py-2 !px-4 text-sm"
              >
                Dashboard
              </Link>
            ) : (
              <a
                href="https://github.com/nordsym/apiclaw"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary !py-2 !px-4 text-sm"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="pt-32 pb-24 px-6">
        <div className="max-w-xl mx-auto">
          {/* Progress */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s < step ? 'bg-accent text-background' :
                    s === step ? 'bg-accent/20 text-accent border-2 border-accent' :
                    'bg-surface border border-border text-text-muted'
                  }`}>
                    {s < step ? <Check className="w-5 h-5" /> : s}
                  </div>
                  {s < 4 && (
                    <div className={`w-16 md:w-24 h-1 mx-2 rounded ${
                      s < step ? 'bg-accent' : 'bg-border'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <span className="text-sm text-text-muted">
                Step {step} of 4: {
                  step === 1 ? "Provider Info" :
                  step === 2 ? "API Details" :
                  step === 3 ? "Technical" :
                  "Pricing"
                }
              </span>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl bg-surface-elevated border border-border p-8">
            {/* Step 1: Provider Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Tell us about you</h2>
                  <p className="text-text-secondary">Who&apos;s listing this API?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Company / Provider Name *</label>
                  <input
                    type="text"
                    value={formData.providerName}
                    onChange={(e) => updateField('providerName', e.target.value)}
                    placeholder="Acme Inc"
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="https://company.com"
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition"
                  />
                </div>
              </div>
            )}

            {/* Step 2: API Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">API Details</h2>
                  <p className="text-text-secondary">Help agents understand your API</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">API Name *</label>
                  <input
                    type="text"
                    value={formData.apiName}
                    onChange={(e) => updateField('apiName', e.target.value)}
                    placeholder="My Awesome API"
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="What does your API do? What problems does it solve?"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition resize-none"
                  />
                  <p className="text-xs text-text-muted mt-1">{formData.description.length}/500 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <select
                      value={formData.category}
                      onChange={(e) => updateField('category', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition appearance-none cursor-pointer"
                    >
                      <option value="">Select a category...</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Technical */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Technical Details</h2>
                  <p className="text-text-secondary">Optional but recommended</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    OpenAPI Spec URL
                    <span className="text-text-muted font-normal ml-2">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FileJson className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <input
                        type="url"
                        value={formData.openApiUrl}
                        onChange={(e) => updateField('openApiUrl', e.target.value)}
                        placeholder="https://api.example.com/openapi.json"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition"
                      />
                    </div>
                    <button
                      onClick={parseOpenApiSpec}
                      disabled={!formData.openApiUrl || parseStatus === 'parsing'}
                      className="btn-secondary !px-4 whitespace-nowrap disabled:opacity-50"
                    >
                      {parseStatus === 'parsing' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : parseStatus === 'success' ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : parseStatus === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        'Parse'
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    We&apos;ll auto-fill API details if you provide a spec
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Documentation URL
                    <span className="text-text-muted font-normal ml-2">(optional)</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="url"
                      value={formData.docsUrl}
                      onChange={(e) => updateField('docsUrl', e.target.value)}
                      placeholder="https://docs.example.com"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="bg-surface rounded-xl p-4 border border-border">
                  <p className="text-sm text-text-secondary">
                    <strong className="text-text-primary">💡 Pro tip:</strong> APIs with OpenAPI specs get better placement in agent search results.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Pricing */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Pricing Model</h2>
                  <p className="text-text-secondary">How do you charge for your API?</p>
                </div>

                <div className="space-y-3">
                  {pricingModels.map((model) => (
                    <label
                      key={model.value}
                      className={`block p-4 rounded-xl border cursor-pointer transition ${
                        formData.pricingModel === model.value
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="pricingModel"
                          value={model.value}
                          checked={formData.pricingModel === model.value}
                          onChange={(e) => updateField('pricingModel', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.pricingModel === model.value
                            ? 'border-accent'
                            : 'border-border'
                        }`}>
                          {formData.pricingModel === model.value && (
                            <div className="w-3 h-3 rounded-full bg-accent" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{model.label}</div>
                          <div className="text-sm text-text-muted">{model.description}</div>
                        </div>
                        <DollarSign className={`w-5 h-5 ${
                          formData.pricingModel === model.value ? 'text-accent' : 'text-text-muted'
                        }`} />
                      </div>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Pricing Notes
                    <span className="text-text-muted font-normal ml-2">(optional)</span>
                  </label>
                  <textarea
                    value={formData.pricingNotes}
                    onChange={(e) => updateField('pricingNotes', e.target.value)}
                    placeholder="e.g., Free tier: 1000 requests/month. Pro: $29/month for unlimited."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-accent focus:outline-none transition resize-none"
                  />
                </div>

                {/* Summary */}
                <div className="bg-surface rounded-xl p-6 border border-border">
                  <h3 className="font-semibold mb-4">Summary</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Provider:</dt>
                      <dd className="font-medium">{formData.providerName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">API:</dt>
                      <dd className="font-medium">{formData.apiName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Category:</dt>
                      <dd className="font-medium">{formData.category}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Pricing:</dt>
                      <dd className="font-medium capitalize">{formData.pricingModel}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-500">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <button
                onClick={prevStep}
                disabled={step === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {step < 4 ? (
                <button onClick={nextStep} className="btn-primary">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Submit API
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Help text */}
          <p className="text-center text-text-muted text-sm mt-6">
            Questions?{' '}
            <a href="mailto:gustav@nordsym.com" className="text-accent hover:underline">
              Contact us
            </a>
            {' '}or check the{' '}
            <Link href="/providers#faq" className="text-accent hover:underline inline-flex items-center gap-1">
              FAQ
              <ExternalLink className="w-3 h-3" />
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
