import { PAYG_MARGIN_RATE } from "@apiclaw/product-truth";

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
    q: "How are credentials secured?",
    a: "Provider keys live server-side, encrypted at rest, and never reach the agent. Workspace keys are stored as one-way hashes; the raw value is shown once at creation and never again.",
  },
  {
    q: "What does it cost?",
    a: `Free APIs are free forever, no card, including discovery and over 1,000 of the 1,025 callable now. Paid APIs need a card on file and bill provider cost plus ${PAYG_MARGIN_PERCENT}% per call, billed through Stripe. Or bring your own key and skip the card entirely for that provider.`,
  },
  {
    q: "Can I use my own API key instead of a card?",
    a: "Yes. Add your own OpenRouter key in Workspace, Connections, Your keys. Calls routed through it are free: no card, no markup, OpenRouter bills you directly. Today this covers an OpenRouter key for chat completions, not every provider.",
  },
  {
    q: "What does Remote MCP expose?",
    a: "Remote MCP surface (14 tools): apiclaw_help, discover_apis, get_api_details, list_categories, list_connected, list_models, call_api, check_balance, check_workspace_status, list_mission_templates, start_mission, discover_missions, mission_status, list_missions.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-14">
      <div className="claw-container">
        <div className="claw-rule" />
        <div className="grid gap-8 py-20 sm:py-28 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div>
            <h2 className="claw-h2">Questions.</h2>
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
