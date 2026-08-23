"use client";

import statsData from "@/lib/stats.json";
import { PLANS } from "@/lib/plans";
import {
  FREE_MANAGED_CALLS_LIFETIME,
  FREE_MANAGED_PROVIDER_COST_CAP_USD,
  MANAGED_PROVIDER_ADAPTER_COUNT,
  PAYG_MARGIN_RATE,
} from "@apiclaw/product-truth";

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const PAYG_MARGIN_PERCENT = PAYG_MARGIN_RATE * 100;

const FIGURES = [
  {
    value: statsData.apiCount.toLocaleString("en-US"),
    label: "discoverable APIs",
    note: "Definitions the agent can search by capability.",
  },
  {
    value: (statsData.customerExecutableCatalogCardCount ?? 1025).toLocaleString("en-US"),
    label: "callable now",
    note: "Catalog cards a workspace can execute today.",
  },
  {
    value: String(statsData.managedProviderAdapterCount ?? MANAGED_PROVIDER_ADAPTER_COUNT),
    label: "managed adapters",
    note: "Providers where APIClaw holds the credential.",
  },
];

export function Proof({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section id="pricing" className="scroll-mt-14">
      <div className="claw-container">
        <div className="claw-rule" />
        <div className="py-20 sm:py-28">
          <div className="max-w-[36rem]">
            <p className="claw-eyebrow mb-4">Live today</p>
            <h2 className="claw-h2">What is real, and what it costs.</h2>
            <p className="claw-lede mt-4">
              Counts come from the live catalog. Source verification is not execution, so the callable figure is the one that matters.
            </p>
          </div>

          <dl className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-8">
            {FIGURES.map((f) => (
              <div key={f.label} className="border-t border-border-subtle pt-5">
                <dd className="claw-display text-[2.4rem] sm:text-[2.75rem] text-text-primary">{f.value}</dd>
                <dt className="mt-1 text-[14px] font-medium text-text-primary">{f.label}</dt>
                <p className="mt-2 text-[13.5px] leading-[1.6] text-text-muted">{f.note}</p>
              </div>
            ))}
          </dl>
          <p className="claw-mono mt-5 text-[12px] text-text-muted">
            <a href="/api/catalog" className="claw-link">/api/catalog</a> · {statsData.sourceVerifiedCount.toLocaleString("en-US")} entries match source-verification evidence by exact name
          </p>

          <div className="mt-20 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <div>
              <h3 className="text-[1.5rem] font-semibold tracking-[-0.025em]">Pricing</h3>
              <p className="mt-3 text-[15px] leading-[1.65] text-text-secondary">
                {FREE_MANAGED_CALLS_LIFETIME} managed calls for the lifetime of your workspace, up to ${FREE_MANAGED_PROVIDER_COST_CAP_USD} in underlying provider cost. Discovery stays free. After that, billing-ready managed actions run at provider cost plus {PAYG_MARGIN_PERCENT}%, billed through Stripe. No commitment.
              </p>
              <p className="mt-4 text-[13.5px] text-text-muted">
                Need custom limits or an SLA? <a href="/book" className="claw-link text-text-primary">Talk to us</a>.
              </p>
            </div>

            <div className="grid gap-px overflow-hidden rounded-[14px] border border-border-subtle bg-border-subtle sm:grid-cols-2">
              {PLANS.map((plan) => {
                const authPath = CLERK_ENABLED ? "/sign-up" : "/sign-in";
                const href = plan.link === null
                  ? isLoggedIn ? "/workspace?tab=billing" : authPath
                  : isLoggedIn ? plan.link : authPath;
                const cta = plan.id === "free"
                  ? isLoggedIn ? "Go to workspace" : "Start free"
                  : isLoggedIn ? "Add payment method" : "Start free, add billing later";

                return (
                  <div key={plan.id} className="flex flex-col bg-surface p-6 sm:p-7">
                    <div className="flex items-baseline justify-between gap-3">
                      <h4 className="text-[15px] font-semibold">{plan.name}</h4>
                      {plan.highlight && <span className="claw-eyebrow !text-[10.5px] text-accent">Recommended</span>}
                    </div>
                    <div className="mt-4 claw-display text-[2rem]">{plan.price}</div>
                    <p className="text-[13px] text-text-muted">{plan.period}</p>
                    <p className="mt-4 text-[14px] text-text-secondary">
                      <span className="text-text-primary">{plan.calls}</span> {plan.callsSub}
                    </p>
                    <ul className="mt-5 flex-1 space-y-2 text-[13.5px] leading-[1.55] text-text-secondary">
                      {plan.features.map((f) => (
                        <li key={f} className="flex gap-2.5">
                          <span className="mt-[9px] h-px w-3 flex-none bg-text-muted" aria-hidden="true" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <a href={href} className={`claw-btn mt-7 ${plan.highlight ? "claw-btn-solid" : "claw-btn-quiet"}`}>
                      {cta}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
