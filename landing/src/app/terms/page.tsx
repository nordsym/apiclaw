import Link from "next/link";
export const metadata = { title: "APIClaw service terms" };
export default function TermsPage() {
  return <main className="mx-auto max-w-3xl px-6 py-16 text-[var(--text-primary)]">
    <Link href="/">APIClaw</Link>
    <h1 className="mt-8 text-3xl font-semibold">APIClaw service terms</h1>
    <p className="mt-4">Effective 14 October 2026. APIClaw is operated by NordSym AB, Swedish company number 559535-5768. Contact gustav@nordsym.com for billing or service questions.</p>
    <h2 className="mt-8 text-xl font-semibold">Free and paid use</h2>
    <p className="mt-3">Discovery and APIs with verified zero provider cost remain free. The first free call after sign-in does not require a card. Paid managed calls require an active billing subscription and a saved payment method. APIClaw does not sell provider accounts or API keys.</p>
    <p className="mt-3">Paid usage is charged in US dollars at the verified provider cost plus 15%, with applicable taxes calculated by Stripe. There is no monthly platform fee. Usage is billed monthly. Only currently approved providers and models are available for paid managed use. Failed calls are not billed as successful usage. If a request times out after dispatch, do not repeat it with a new request identifier; the outcome may still be under review.</p>
    <h2 className="mt-8 text-xl font-semibold">Billing and cancellation</h2>
    <p className="mt-3">Confirming Stripe Checkout authorizes the usage subscription and payments for your workspace. Manage your payment details, invoices and cancellation from Billing in your workspace. Cancellation stops future paid access; accrued usage remains payable. Contact us to dispute a charge. Statutory rights, including any applicable refund or withdrawal rights, are unaffected.</p>
    <h2 className="mt-8 text-xl font-semibold">Provider terms and responsible use</h2>
    <p className="mt-3">You must comply with the terms and usage policies of each provider and model you select, and obtain permission to submit any data. Approved OpenRouter use is also governed by <a className="underline" href="https://openrouter.ai/terms">OpenRouter terms</a> and the selected model terms. The current paid OpenAI models are subject to the <a className="underline" href="https://openai.com/policies/services-agreement/">OpenAI Services Agreement</a> and <a className="underline" href="https://openai.com/policies/usage-policies/">usage policies</a>. Require your end users to follow these restrictions as well. Do not bypass provider limits or use another person's credentials.</p>
    <p className="mt-3">AI outputs can be inaccurate. Independently check factual claims and suitability before relying on outputs. Providers process the data needed to fulfill your request under their applicable data terms. APIClaw may suspend unsafe, unlawful or unpaid execution. A discovery listing does not imply that APIClaw executes or licenses that API.</p>
  </main>;
}
