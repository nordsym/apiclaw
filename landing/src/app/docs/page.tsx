'use client';

import Link from 'next/link';
import statsData from '@/lib/stats.json';
import { SiteHeader } from '@/components/home/SiteHeader';
import { SiteFooter } from '@/components/home/SiteFooter';
import { CopyLine } from '@/components/home/CopyLine';

const docsNav = [
  {
    label: "Install",
    href: "/install",
    note: "Local MCP setup",
  },
  {
    label: "CLI",
    href: "#cli",
    note: "Codex, scripts, CI/CD",
  },
  {
    label: "HTTP",
    href: "#gateway",
    note: "Server-side runtime",
  },
  {
    label: "Remote MCP",
    href: "/sign-in",
    note: "Sign in, then integrations",
  },
  {
    label: "List your API",
    href: "#list-your-api",
    note: "Owner path",
  },
];

const PRE =
  "claw-mono whitespace-pre-wrap break-words sm:whitespace-pre sm:overflow-x-auto rounded-[10px] border border-border-subtle bg-surface px-4 py-3.5 text-[12.5px] leading-[1.7] text-text-secondary";
const BODY = "text-[15px] leading-[1.65] text-text-secondary";
const META = "text-[13px] text-text-muted";
const SUB = "text-[1.15rem] font-semibold tracking-[-0.02em] text-text-primary";
const CODE = "claw-mono text-[13px] text-text-primary";

export default function DocsPage() {
  return (
    <main className="claw min-h-screen">
      <SiteHeader />

      <div className="claw-container py-16 sm:py-20">
        {/* Title */}
        <div className="max-w-[44rem]">
          <p className="claw-eyebrow mb-4">Docs</p>
          <h1 className="claw-display text-[2.2rem] sm:text-[2.75rem]">Documentation</h1>
          <p className="claw-lede mt-5">
            Everything you need to choose a door, set up the right runtime, and connect APIClaw to your agent stack.
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          {/* Nav */}
          <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
            <nav aria-label="Docs sections" className="-mx-5 border-y border-border-subtle px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:border-y-0 lg:px-0">
              <ul className="flex gap-6 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:gap-4 lg:overflow-visible lg:py-0">
                {docsNav.map((item) => (
                  <li key={item.label} className="flex-none">
                    <Link href={item.href} className="claw-link block text-[14px] font-medium whitespace-nowrap">
                      {item.label}
                    </Link>
                    <span className={`hidden lg:block ${META} mt-0.5`}>{item.note}</span>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Content */}
          <div className="min-w-0 max-w-[44rem]">
            {/* Install */}
            <section id="install" className="scroll-mt-20">
              <h2 className="claw-h2">Install</h2>
              <p className={`${BODY} mt-4`}>
                Local MCP setup for Claude Desktop, Cursor, and other local clients. The full OS-specific install flow lives on the install page.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/install" className="claw-btn claw-btn-solid">Open install</Link>
                <Link href="/sign-in" className="claw-btn claw-btn-quiet">Sign in</Link>
              </div>
              <div className="mt-8 space-y-2">
                <p className={META}>Auto-install to Claude Desktop</p>
                <CopyLine text="curl -fsSL https://apiclaw.cloud/install.sh | bash" />
                <p className={`${META} pt-2`}>Or run the MCP server directly</p>
                <CopyLine text="npx @nordsym/apiclaw" />
              </div>
              <p className={`${META} mt-5`}>
                OS-specific commands for macOS, Windows, and Linux live in the install guide. Use this page as the hub, not the full manual.
              </p>
            </section>

            <div className="claw-rule my-16 sm:my-20" />

            {/* CLI alias */}
            <div id="codex" className="scroll-mt-20" aria-hidden />

            {/* Auth */}
            <section id="cli-auth" className="scroll-mt-20">
              <h2 className="claw-h2">Auth (all four doors)</h2>
              <p className={`${BODY} mt-4`}>
                One command, every door. Opens your browser, one-tap sign-in via Clerk (Google or passwordless email), writes <code className={CODE}>~/.apiclaw.toml</code> with mode 0600. The same file is read by the local MCP server, CLI, and HTTP gateway. Remote MCP uses its own OAuth 2.1 + DCR flow.
              </p>

              <div className="mt-8 space-y-8">
                <div>
                  <h3 className={SUB}>Canonical flow</h3>
                  <div className="mt-3">
                    <CopyLine text="npx @nordsym/apiclaw auth login" />
                  </div>
                  <p className={`${META} mt-3`}>
                    If you are already signed into Clerk in your browser there is no inbox round-trip, no key copy-paste, no dashboard visit.
                  </p>
                </div>
                <div>
                  <h3 className={SUB}>Switch accounts</h3>
                  <div className="mt-3">
                    <CopyLine text="npx @nordsym/apiclaw auth login --force" />
                  </div>
                </div>
                <div>
                  <h3 className={SUB}>Show current identity</h3>
                  <div className="mt-3">
                    <CopyLine text="npx @nordsym/apiclaw auth whoami" />
                  </div>
                </div>
                <div>
                  <h3 className={SUB}>Headless server or SSH</h3>
                  <p className={`${BODY} mt-3`}>
                    Run the same login command and open the sign-in URL on a device where you can complete ownership verification.
                  </p>
                </div>
                <div className="border-t border-border-subtle pt-6">
                  <h3 className={SUB}>For MCP clients: agent_auth_required action</h3>
                  <p className={`${BODY} mt-3`}>
                    When the APIClaw MCP server has no local session, every tool returns a JSON payload with <code className={CODE}>action: &quot;agent_auth_required&quot;</code> and the exact CLI command to run. Agents that recognize this contract can resolve auth without human intervention.
                  </p>
                </div>
              </div>
            </section>

            <div className="claw-rule my-16 sm:my-20" />

            {/* CLI */}
            <section id="cli" className="scroll-mt-20">
              <h2 className="claw-h2">CLI</h2>
              <p className={`${BODY} mt-4`}>
                Terminal-native use for Codex, scripts, and CI/CD. Codex is one example, not the whole category. Run <code className={CODE}>apiclaw auth login</code> first (see Auth above), then use the direct commands below.
              </p>

              <div className="mt-8 space-y-8">
                <div>
                  <h3 className={SUB}>Direct tool parity</h3>
                  <pre className={`${PRE} mt-3`}>{`apiclaw discover "currency conversion"
apiclaw details apilayer/fixer-latest
apiclaw call apilayer/fixer-latest --params '{"base":"USD","symbols":"EUR"}'
apiclaw balance`}</pre>
                </div>
                <div>
                  <h3 className={SUB}>Install APIClaw into Codex / Cursor / Windsurf</h3>
                  <div className="mt-3">
                    <CopyLine text="npx @nordsym/apiclaw setup --client codex   # or --client cursor / windsurf" />
                  </div>
                </div>
                <div>
                  <h3 className={SUB}>Check status</h3>
                  <div className="mt-3">
                    <CopyLine text="npx @nordsym/apiclaw doctor" />
                  </div>
                  <p className={`${META} mt-3`}>Shows CLI path, auth status, connection health, and all client configurations.</p>
                </div>
              </div>
            </section>

            <div className="claw-rule my-16 sm:my-20" />

            {/* Gateway / OpenClaw */}
            <section id="gateway" className="scroll-mt-20">
              <h2 className="claw-h2">HTTP</h2>
              <p className={`${BODY} mt-4`}>
                Server-side agents and custom runtimes. Use it from OpenClaw or any backend that sends requests with a workspace API key.
              </p>

              <dl className="mt-8 border-t border-border-subtle">
                <div className="grid gap-1 border-b border-border-subtle py-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-6">
                  <dt className={META}>Endpoint</dt>
                  <dd className={`${CODE} break-all`}>https://api.apiclaw.cloud/v1</dd>
                </div>
                <div className="grid gap-1 border-b border-border-subtle py-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-6">
                  <dt className={META}>Default model</dt>
                  <dd className={`${CODE} break-all`}>apiclaw/openai/gpt-5.4-20260305</dd>
                </div>
                <div className="grid gap-1 border-b border-border-subtle py-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-6">
                  <dt className={META}>API key</dt>
                  <dd>
                    <span className={CODE}>sk-claw-...</span>
                    <p className={`${META} mt-1.5`}>Run <code className="claw-mono">apiclaw auth login</code>: the key is written to ~/.apiclaw.toml. Or generate one manually in workspace, API Keys.</p>
                  </dd>
                </div>
              </dl>

              <div className="mt-8 space-y-8">
                <div>
                  <h3 className={SUB}>Environment config</h3>
                  <pre className={`${PRE} mt-3`}>{`OPENAI_BASE_URL=https://api.apiclaw.cloud/v1
OPENAI_API_KEY=sk-claw-<your-workspace-key>`}</pre>
                </div>
                <div>
                  <h3 className={SUB}>Override route or model per request</h3>
                  <div className="mt-3">
                    <CopyLine text="X-APIClaw-Route: fastest   # or: best_price, highest_quality, balanced" prompt="›" />
                  </div>
                  <p className={`${META} mt-3`}>
                    Response includes <code className="claw-mono">_apiclaw</code> metadata: provider used, route reason, model resolved.
                  </p>
                </div>
              </div>
            </section>

            <div className="claw-rule my-16 sm:my-20" />

            {/* Remote MCP */}
            <section id="remote-mcp" className="scroll-mt-20">
              <h2 className="claw-h2">Remote MCP</h2>
              <p className={`${BODY} mt-4`}>
                Connected clients go through your workspace. Sign in first, then open Integrations to add or edit a connector. Grok, ChatGPT, Cursor, and other OAuth-capable clients fit here.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/sign-in" className="claw-btn claw-btn-solid">Sign in</Link>
                <Link href="/workspace/integrations" className="claw-btn claw-btn-quiet">Open integrations</Link>
              </div>
              <ol className="mt-8 border-t border-border-subtle">
                {[
                  { n: "Step 1", t: "Free email signup", d: "Required for every door." },
                  { n: "Step 2", t: "Workspace", d: "Same auth, same logs, same gateway." },
                  { n: "Step 3", t: "Integrations", d: "Generate a connector for your client." },
                ].map((s) => (
                  <li key={s.n} className="grid gap-1 border-b border-border-subtle py-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-6">
                    <span className={META}>{s.n}</span>
                    <div>
                      <p className="text-[15px] font-medium text-text-primary">{s.t}</p>
                      <p className={`${META} mt-0.5`}>{s.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <div className="claw-rule my-16 sm:my-20" />

            {/* Examples */}
            <section>
              <h2 className="claw-h2">Examples</h2>
              <div className="mt-8 space-y-8">
                <div>
                  <h3 className={SUB}>NASA Astronomy Picture of the Day</h3>
                  <pre className={`${PRE} mt-3`}>{`// First managed call: POST /v1/execute
call_api({
  provider: "nasa",
  action: "apod",
  params: {}
})`}</pre>
                </div>
                <div>
                  <h3 className={SUB}>Search the web</h3>
                  <pre className={`${PRE} mt-3`}>{`call_api({
  provider: "brave_search",
  endpoint: "search",
  params: { query: "best MCP servers 2026" }
})`}</pre>
                </div>
                <div>
                  <h3 className={SUB}>Latest EUR exchange rates</h3>
                  <pre className={`${PRE} mt-3`}>{`call_api({
  provider: "apilayer",
  action: "fixer_latest",
  params: { base: "EUR" }
})`}</pre>
                </div>
              </div>
            </section>

            <div className="claw-rule my-16 sm:my-20" />

            {/* Tools Reference */}
            <section>
              <h2 className="claw-h2">Tools Reference</h2>
              <div className="mt-8 space-y-10">
                {/* apiclaw_help */}
                <div>
                  <h3 className={`${SUB} claw-mono`}>apiclaw_help</h3>
                  <p className={`${BODY} mt-2`}>Get help and see all available commands. Start here if you&apos;re new.</p>
                  <pre className={`${PRE} mt-3`}>apiclaw_help()</pre>
                </div>

                {/* discover_apis */}
                <div>
                  <h3 className={`${SUB} claw-mono`}>discover_apis</h3>
                  <p className={`${BODY} mt-2`}>Search 26,619 discoverable APIs using natural language.</p>
                  <pre className={`${PRE} mt-3`}>{`discover_apis({
  query: "send alerts to Sweden",
  max_results: 5
})`}</pre>
                  <div className={`${META} mt-4`}>
                    <p className="font-medium text-text-primary">Parameters</p>
                    <ul className="mt-2 space-y-1.5">
                      <li><code className="claw-mono text-text-secondary">query</code>: Natural language description</li>
                      <li><code className="claw-mono text-text-secondary">category</code>: Filter: communication, search, ai</li>
                      <li><code className="claw-mono text-text-secondary">max_results</code>: Number of results (default: 5)</li>
                      <li><code className="claw-mono text-text-secondary">region</code>: Filter by region (e.g., &quot;sweden&quot;)</li>
                    </ul>
                  </div>
                </div>

                {/* get_api_details */}
                <div>
                  <h3 className={`${SUB} claw-mono`}>get_api_details</h3>
                  <p className={`${BODY} mt-2`}>Get detailed information about a specific API.</p>
                  <pre className={`${PRE} mt-3`}>{`get_api_details({
  api_id: "nasa"
})`}</pre>
                </div>

                {/* get_connected_providers */}
                <div>
                  <h3 className={`${SUB} claw-mono`}>get_connected_providers</h3>
                  <p className={`${BODY} mt-2`}>List all managed providers (no API key needed).</p>
                  <pre className={`${PRE} mt-3`}>get_connected_providers()</pre>
                  <div className={`${META} mt-4`}>
                    <p className="font-medium text-text-primary">Currently available</p>
                    <ul className="mt-2 space-y-1.5">
                      <li><code className="claw-mono text-text-secondary">openrouter</code>: 800+ LLMs</li>
                      <li><code className="claw-mono text-text-secondary">brave_search</code>: Web search</li>
                      <li><code className="claw-mono text-text-secondary">github</code>: Read-only GitHub</li>
                      <li><code className="claw-mono text-text-secondary">nasa</code>: Astronomy Picture of the Day</li>
                      <li><code className="claw-mono text-text-secondary">apilayer</code>: Fixer latest (EUR base) and other contracted HTTPS rails</li>
                    </ul>
                  </div>
                </div>

                {/* call_api */}
                <div>
                  <h3 className={`${SUB} claw-mono`}>call_api</h3>
                  <p className={`${BODY} mt-2`}>Execute an API call through a managed provider.</p>
                  <pre className={`${PRE} mt-3`}>{`call_api({
  provider: "brave_search",
  endpoint: "search",
  params: { query: "AI agents 2026" }
})`}</pre>
                </div>

                {/* list_categories */}
                <div>
                  <h3 className={`${SUB} claw-mono`}>list_categories</h3>
                  <p className={`${BODY} mt-2`}>Browse all API categories (30 main categories).</p>
                  <pre className={`${PRE} mt-3`}>list_categories()</pre>
                </div>
              </div>
            </section>

            <div className="claw-rule my-16 sm:my-20" />

            {/* Catalog numbers */}
            <section>
              <h2 className="claw-h2">Catalog numbers</h2>
              <p className={`${BODY} mt-4`}>Source verification is not execution: a source-verified entry passed a reachability check, not a customer call.</p>
              <ul className="mt-5 border-t border-border-subtle">
                <li className="grid gap-1 border-b border-border-subtle py-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6">
                  <span className={META}>{statsData.apiCount.toLocaleString("en-US")} API definitions</span>
                  <span className={BODY}>Discoverable by agents via the catalog.</span>
                </li>
                <li className="grid gap-1 border-b border-border-subtle py-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6">
                  <span className={META}>{(statsData.customerExecutableCatalogCardCount ?? 1025).toLocaleString("en-US")} callable now</span>
                  <span className={BODY}>What a workspace can execute today, of which {statsData.managedProviderAdapterCount} are managed provider adapters.</span>
                </li>
                <li className="grid gap-1 border-b border-border-subtle py-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6">
                  <span className={META}>{statsData.sourceVerifiedCount.toLocaleString("en-US")} source-verified</span>
                  <span className={BODY}>Passed a live reachability check against the source. Not a claim of execution.</span>
                </li>
              </ul>
            </section>

            <div className="claw-rule my-16 sm:my-20" />

            {/* Support */}
            <section>
              <h2 className="claw-h2">Support</h2>
              <p className={`${BODY} mt-4`}>Need help? Reach out.</p>
              <ul className="mt-5 border-t border-border-subtle">
                <li className="grid gap-1 border-b border-border-subtle py-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-6">
                  <span className={META}>GitHub</span>
                  <a href="https://github.com/nordsym/apiclaw/issues" className="claw-link text-[15px] underline underline-offset-4 decoration-border">Issues</a>
                </li>
                <li className="grid gap-1 border-b border-border-subtle py-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-6">
                  <span className={META}>Email</span>
                  <a href="mailto:support_apiclaw@nordsym.com" className="claw-link break-all text-[15px] underline underline-offset-4 decoration-border">support_apiclaw@nordsym.com</a>
                </li>
              </ul>
            </section>

            <div className="claw-rule my-16 sm:my-20" />

            {/* List your API */}
            <section id="list-your-api" className="scroll-mt-20">
              <h2 className="claw-h2">List your API on APIClaw</h2>
              <p className={`${BODY} mt-4`}>
                APIClaw indexes {statsData.apiCount.toLocaleString("en-US")} APIs and {statsData.sourceVerifiedCount.toLocaleString("en-US")} have source-verified definitions. Managed execution readiness is shown separately. Adding yours takes one OpenAPI spec and a free email signup.
              </p>

              <ol className="mt-8 border-t border-border-subtle">
                {[
                  {
                    n: "01",
                    t: "Use the same workspace",
                    d: <>Sign in at <a href="/workspace" className="claw-link underline underline-offset-4 decoration-border">apiclaw.cloud/workspace</a>. The same workspace covers your discoverable listing and any agent calls you make.</>,
                  },
                  {
                    n: "02",
                    t: "Submit your spec",
                    d: <>Open <span className="font-medium text-text-primary">Workspace, My APIs, Add API</span>. Paste an OpenAPI 3 / Swagger URL, or describe the endpoint manually. APIClaw normalises auth, parameters, and pricing.</>,
                  },
                  {
                    n: "03",
                    t: "Approve the listing",
                    d: <>Review the auto-generated capability tags (the keywords agents will match on), the pricing model, and a working example. Edit any field before going live.</>,
                  },
                  {
                    n: "04",
                    t: "Live and discoverable",
                    d: <>Your API is searchable by <code className="claw-mono text-[13px] text-text-primary">discover_apis</code> immediately. Per-call analytics show in your dashboard from the first agent that calls you.</>,
                  },
                  {
                    n: "05",
                    t: "Optional: managed-partner upgrade",
                    d: <>Hand APIClaw the credential. We hold custody and agents call without keys. Commercial terms (flat fee, share, or hybrid) are agreed per partner.</>,
                  },
                ].map((step) => (
                  <li key={step.n} className="grid gap-1 border-b border-border-subtle py-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-6">
                    <span className="claw-mono text-[12px] text-accent tracking-[0.08em]">{step.n}</span>
                    <div>
                      <h3 className="text-[15px] font-medium text-text-primary">{step.t}</h3>
                      <p className={`${BODY} mt-1`}>{step.d}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-8 flex flex-col gap-5 rounded-[14px] border border-border-subtle bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <p className="claw-eyebrow mb-1.5">Always free</p>
                  <p className={BODY}>Listing your API is free. Always. The managed-partner upgrade is opt-in.</p>
                </div>
                <a href="/workspace" className="claw-btn claw-btn-solid flex-none">List your API</a>
              </div>
            </section>
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
