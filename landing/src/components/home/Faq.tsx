import statsData from "@/lib/stats.json";
import {
  FREE_MANAGED_CALLS_LIFETIME,
  FREE_MANAGED_PROVIDER_COST_CAP_USD,
  MANAGED_PROVIDER_ADAPTER_COUNT,
  PAYG_MARGIN_RATE,
} from "@apiclaw/product-truth";

const PAYG_MARGIN_PERCENT = PAYG_MARGIN_RATE * 100;

const ITEMS: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: "What is APIClaw?",
    a: "An authenticated discovery and execution layer for AI agents. One workspace covers API discovery, managed execution, missions and observability, reachable through a skill file, local MCP, CLI, HTTP and Remote MCP.",
  },
  {
    q: "How does my agent connect?",
    a: (
      <>
        Give it <code>set up https://apiclaw.cloud/SKILL.md</code>. The agent reads the file, runs <code>npx @nordsym/apiclaw auth login</code>, and lands its first <code>POST /v1/execute</code>. Humans can use the same package for local MCP, CLI, HTTP or Remote MCP. One sign-in covers every path. Never paste a token into chat.
      </>
    ),
  },
  {
    q: "Do I have to sign up?",
    a: `Yes. A free workspace is required for every path, including discovery. Sign-in is the signup: the first login creates the workspace through Clerk with Google or passwordless email and writes ~/.apiclaw.toml.`,
  },
  {
    q: "What can my agent actually call?",
    a: `${statsData.apiCount.toLocaleString("en-US")} discoverable API definitions, ${(statsData.customerExecutableCatalogCardCount ?? 1025).toLocaleString("en-US")} catalog cards callable now, and ${MANAGED_PROVIDER_ADAPTER_COUNT} managed adapters where APIClaw holds the credential. Source verification is not execution. Anonymous keyless public execution stays disabled.`,
  },
  {
    q: "How are credentials secured?",
    a: "Provider keys live server-side, encrypted at rest, and never reach the agent. Workspace keys are stored as one-way hashes; the raw value is shown once at creation and never again.",
  },
  {
    q: "What does it cost?",
    a: `Free: ${FREE_MANAGED_CALLS_LIFETIME} managed calls for the lifetime of the workspace, subject to a $${FREE_MANAGED_PROVIDER_COST_CAP_USD} total underlying provider-cost cap. Discovery is free. After that, billing-ready managed actions run at provider cost plus ${PAYG_MARGIN_PERCENT}%, billed through Stripe. Actions without an exact billing adapter remain blocked. No commitment.`,
  },
  {
    q: "What are missions?",
    a: "Multi-step orchestrations on the same runtime, with an audit entry and cost tag per step. CLI, MCP and HTTP can all start them.",
  },
  {
    q: "I'm building my own agent runtime. Why APIClaw?",
    a: "You skip provider routing, key custody, retries, billing and audit logging. Point the runtime at the HTTP endpoint with one workspace key, or connect through Remote MCP, and the observability is there from the first call.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-14">
      <div className="claw-container">
        <div className="claw-rule" />
        <div className="grid gap-8 py-20 sm:py-28 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <p className="claw-eyebrow mb-4">Questions</p>
            <h2 className="claw-h2">The short answers.</h2>
          </div>
          <div className="divide-y divide-border-subtle border-y border-border-subtle">
            {ITEMS.map((item) => (
              <details key={item.q} className="claw-disclosure">
                <summary>
                  {item.q}
                  <span className="mark" aria-hidden="true" />
                </summary>
                <div>{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
