import type { Metadata } from "next";
import { SiteFooter } from "@/components/home/SiteFooter";
import { SiteHeader } from "@/components/home/SiteHeader";
import { PLANS } from "@/lib/plans";
import { PAYG_MARGIN_RATE } from "@apiclaw/product-truth";

const PAYG_MARGIN_PERCENT = PAYG_MARGIN_RATE * 100;
const PAID_PROVIDERS = ["OpenRouter with GPT-5.4 nano, mini and standard"] as const;

export const metadata: Metadata = {
  title: "Pricing | APIClaw",
  description: `Use open APIs for free, then pay provider cost plus ${PAYG_MARGIN_PERCENT}% for managed paid APIs.`,
};

export default function PricingPage() {
  const free = PLANS.find((plan) => plan.id === "free");
  const paid = PLANS.find((plan) => plan.id === "usage_based");

  if (!free || !paid) {
    throw new Error("Public pricing plans are incomplete");
  }

  return (
    <main className="claw min-h-screen">
      <SiteHeader />

      <section className="claw-container pb-16 pt-16 sm:pb-24 sm:pt-24">
        <p className="claw-eyebrow">Pricing</p>
        <h1 className="claw-display mt-5 max-w-[48rem] text-[clamp(2.6rem,7vw,5.2rem)]">
          Start with a real call. Pay when the work costs money.
        </h1>
        <p className="claw-lede mt-7 max-w-[41rem]">
          Discovery and open API rails stay free. After sign-in, you can try managed APIs before adding a card. Paid calls are billed at provider cost plus {PAYG_MARGIN_PERCENT}%.
        </p>
      </section>

      <section className="claw-container pb-20 sm:pb-28" aria-labelledby="plans-heading">
        <h2 id="plans-heading" className="sr-only">Plans</h2>
        <div className="overflow-hidden rounded-[16px] border border-border-subtle bg-border-subtle">
          <div className="grid gap-px lg:grid-cols-2">
            <article className="flex flex-col bg-background p-7 sm:p-10">
              <p className="claw-eyebrow">01 · Free</p>
              <div className="mt-8 flex items-end justify-between gap-6 border-b border-border-subtle pb-7">
                <h3 className="text-[1.55rem] font-semibold tracking-[-0.025em]">{free.name}</h3>
                <div className="text-right">
                  <span className="claw-display text-[2.2rem]">{free.price}</span>
                  <p className="mt-1 text-[12px] text-text-muted">{free.period}</p>
                </div>
              </div>
              <p className="mt-7 text-[15px] leading-[1.65] text-text-secondary">
                Search the catalog and call open rails such as Frankfurter and NASA without a card or usage bill.
              </p>
              <ul className="mt-7 flex-1 space-y-4 text-[14px] leading-[1.55] text-text-secondary">
                {free.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-[10px] h-px w-4 flex-none bg-text-muted" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a href="/workspace" className="claw-btn claw-btn-quiet mt-10 self-start">Start free</a>
            </article>

            <article className="flex flex-col bg-surface p-7 sm:p-10">
              <p className="claw-eyebrow text-accent">02 · Pay as you go</p>
              <div className="mt-8 flex items-end justify-between gap-6 border-b border-border-subtle pb-7">
                <h3 className="text-[1.55rem] font-semibold tracking-[-0.025em]">{paid.name}</h3>
                <div className="text-right">
                  <span className="claw-display text-[2.2rem]">Cost + {PAYG_MARGIN_PERCENT}%</span>
                  <p className="mt-1 text-[12px] text-text-muted">per successful call</p>
                </div>
              </div>
              <p className="mt-7 text-[15px] leading-[1.65] text-text-secondary">
                Add a card once. APIClaw uses its managed provider accounts, meters successful calls, and charges the provider cost plus a {PAYG_MARGIN_PERCENT}% platform margin.
              </p>
              <div className="mt-7 flex flex-wrap gap-2" aria-label="Paid managed providers">
                {PAID_PROVIDERS.map((provider) => (
                  <span key={provider} className="rounded-full border border-border px-3 py-1.5 text-[12.5px] text-text-secondary">
                    {provider}
                  </span>
                ))}
              </div>
              <ul className="mt-7 flex-1 space-y-4 text-[14px] leading-[1.55] text-text-secondary">
                <li className="flex gap-3">
                  <span className="mt-[10px] h-px w-4 flex-none bg-text-muted" aria-hidden="true" />
                  No monthly commitment
                </li>
                <li className="flex gap-3">
                  <span className="mt-[10px] h-px w-4 flex-none bg-text-muted" aria-hidden="true" />
                  Usage and payment history stay visible in your workspace
                </li>
              </ul>
              <a href="/workspace?tab=billing" className="claw-btn claw-btn-solid mt-10 self-start">Add a card</a>
            </article>
          </div>
        </div>
      </section>

      <section className="claw-container pb-20 sm:pb-28">
        <div className="claw-rule" />
        <div className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="claw-eyebrow">How billing works</p>
            <h2 className="claw-h2 mt-4">A card opens the paid rails.</h2>
          </div>
          <dl className="divide-y divide-border-subtle border-y border-border-subtle">
            <div className="grid gap-2 py-6 sm:grid-cols-[2rem_1fr] sm:gap-5">
              <dt className="claw-mono text-[12px] text-text-muted">01</dt>
              <dd>
                <p className="text-[15px] font-medium">Try before paying</p>
                <p className="mt-2 text-[14px] leading-[1.65] text-text-secondary">Your signed-in workspace includes up to 25 managed calls, with a $1 cap on provider cost.</p>
              </dd>
            </div>
            <div className="grid gap-2 py-6 sm:grid-cols-[2rem_1fr] sm:gap-5">
              <dt className="claw-mono text-[12px] text-text-muted">02</dt>
              <dd>
                <p className="text-[15px] font-medium">Add a card when you need more</p>
                <p className="mt-2 text-[14px] leading-[1.65] text-text-secondary">Payment details are handled by Stripe. There is no prepaid bundle and no recurring platform fee.</p>
              </dd>
            </div>
            <div className="grid gap-2 py-6 sm:grid-cols-[2rem_1fr] sm:gap-5">
              <dt className="claw-mono text-[12px] text-text-muted">03</dt>
              <dd>
                <p className="text-[15px] font-medium">See what was used</p>
                <p className="mt-2 text-[14px] leading-[1.65] text-text-secondary">Successful paid calls and their metered amount appear in the billing tab. Open rails remain free.</p>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
