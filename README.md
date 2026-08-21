<div align="center">

![APIClaw](https://apiclaw.cloud/apiclaw-banner.png)

# APIClaw 🦞

[![DOCS](https://img.shields.io/badge/DOCS-apiclaw.cloud-EF4444?style=flat-square&labelColor=0A0A0A)](https://apiclaw.cloud/docs)
[![X](https://img.shields.io/badge/%40APIClaw-1DA1F2?style=flat-square&logo=x&labelColor=0A0A0A&logoColor=white)](https://x.com/APIClaw)
[![LICENSE](https://img.shields.io/badge/LICENSE-MIT-22C55E?style=flat-square&labelColor=0A0A0A)](./LICENSE)
[![BUILT BY](https://img.shields.io/badge/BUILT%20BY-NORDSYM-9333EA?style=flat-square&labelColor=0A0A0A)](https://nordsym.com)
[![npm](https://img.shields.io/npm/v/@nordsym/apiclaw?style=flat-square&color=EF4444&labelColor=0A0A0A&label=npm)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![installs](https://img.shields.io/npm/dt/@nordsym/apiclaw?style=flat-square&color=525252&labelColor=0A0A0A&label=installs)](https://www.npmjs.com/package/@nordsym/apiclaw)

</div>

---

**The Control Plane for AI Agents.** One runtime for model routing and 26,619 discoverable APIs, including 689 current catalog entries matched to source-verification evidence by exact name. Discovery, routing, missions, and observability live on one rail. Sign in once with `apiclaw auth login`; the same credential works across local MCP, CLI, HTTP gateway, and Remote MCP.

Route across supported models from OpenAI, Anthropic, [OpenRouter](https://openrouter.ai), xAI, Groq, Mistral, Cohere, DeepInfra, or a configured endpoint. Switch with one parameter, no SDK swap, no lock-in.

| | |
|---|---|
| **One runtime, four doors** | Install (`.mcpb`), CLI (`apiclaw`), HTTP gateway (`api.apiclaw.cloud`), Remote MCP (`apiclaw.cloud/mcp`). Same auth, same logs, same canon — all from one sign-in. |
| **Agent-native auth** | `npx @nordsym/apiclaw auth login` opens the browser, one-tap Google sign-in, writes `~/.apiclaw.toml`. ~15 seconds. No keys to paste. Sub-15-second signup-to-first-call. |
| **Discover 26,619 APIs** | Find providers by job-to-be-done. Health-ranked, capability-tagged, callable-or-not flagged. The `discover_apis` tool delegates to the gateway so every door returns the same canon. |
| **Mission runtime** | Compose `fetch`, `transform`, `decide`, `validate`, `execute` primitives into typed orchestrations. Append-only `missionEvents` audit log. Cost-budget per mission with hard halt. Parallel-execution scaffolding ready. |
| **Observability built in** | Every call logged with `_apiclaw` metadata (provider, route, latency, cost, auth mode). 80% quota warning surfaces as `_notice` before paywall. Weekly funnel scorecard mailed Monday 08:00 UTC. |
| **Managed where it matters** | APIClaw inventories 22 server-side managed adapters, all customer-executable now, plus 1,003 workspace-authenticated public/no-key HTTPS origins. Anonymous keyless public execution stays disabled. Adapter inventory is not an execution promise. Runtime readiness is explicit and unknown-cost customer traffic fails closed. |

---

## Install

```bash
# 1. Install (Claude Desktop)
# Download and open: https://apiclaw.cloud/apiclaw.mcpb

# 2. Or any MCP-compatible client
npm install -g @nordsym/apiclaw

# 3. Sign in once. Works across all doors.
npx @nordsym/apiclaw auth login
```

Adds APIClaw as an MCP server in Claude Desktop, Cursor, Windsurf, OpenClaw, or any MCP-compatible agent. The auth flow opens the browser, signs you in via Google one-tap, and writes `~/.apiclaw.toml`. The free workspace includes up to 25 managed calls for its lifetime, subject to a $1 total underlying provider-cost cap. Discovery stays free. Billing-ready managed actions can continue beyond that at provider cost + 15%; variable-cost actions without an exact adapter remain blocked.

> Headless server or SSH session? Open the browser sign-in URL on a device where you can complete ownership verification.

---

## Four doors · one control plane

| Door | When to use | Auth |
|------|------|------|
| **Install** (`.mcpb` / `@nordsym/apiclaw`) | Claude Desktop, Cursor, Windsurf, OpenClaw | `apiclaw auth login` → `~/.apiclaw.toml` |
| **CLI** (`apiclaw`) | Terminal, scripts, CI/CD | Same file |
| **HTTP gateway** (`api.apiclaw.cloud/v1/*`) | Server-side agents (OpenClaw, Hermes, custom backends), n8n | `Authorization: Bearer sk-claw-...` |
| **Remote MCP** (`apiclaw.cloud/mcp`) | Grok, Cursor (remote), ChatGPT, ClaudeDesktop | OAuth 2.1 + PKCE + DCR → `Bearer sk-mcp-...` |

All four resolve to the same Convex deployment. One auth resolver, one workspace, one billing rail, one log stream.

---

## What you can call

### Discoverable (26,619)
The full registry, searchable via `discover_apis(query)`. Every entry tagged by category, health-ranked by recent success-rate, callable-or-not flagged.

### Exact-name source-verified (689)
These current public catalog entries map to source-verification evidence by exact name. Source verification is discovery evidence, not proof that APIClaw can execute the API.

- **Managed adapter inventory (22)** - APIClaw has server-side adapter and credential support. Inventory alone does not enable customer execution.
- **Customer-executable providers (22)** - Every inventoried managed adapter now has at least one billing-grade action.
- **Workspace-public origins (1,003)** - No-key HTTPS origins executable after workspace auth. Not the 26k harvest. Anonymous keyless proxy stays disabled.
- **Source-verified definitions (689)** - Discovery evidence, not by itself an execution promise.

### Mission templates
- Customer templates appear only after every cost-bearing step has a verified
  cost adapter. GenPRD remains internal until that contract is exact.

---

## Pricing

| Plan | Price | Access |
|------|------|------|
| **Free** | $0 forever | Up to 25 managed calls for the lifetime of the workspace, subject to a $1 total underlying provider-cost cap. Discovery is free. Free email signup required. |
| **Pay as you go** | Provider cost + 15% margin | Billing-ready managed actions continue after the free allowance. Per-request provider cost, customer charge, and margin are recorded. Actions without an exact billing adapter remain blocked. |

Pricing canon: underlying provider cost plus a 15% margin. Stripe metered billing live.

---

## Status

- ✅ Live at `apiclaw.cloud` and `api.apiclaw.cloud`
- ✅ npm package `@nordsym/apiclaw` — 20,058 all-time installs (2026-08-21)
- ✅ Claude Desktop Extension hosted at `apiclaw.cloud/apiclaw.mcpb` (~50 MB bundle, zero-key install)
- ✅ Mission runtime v2 (5 typed primitives) live in Convex prod
- ✅ Remote MCP via Streamable HTTP + OAuth 2.1 + PKCE + DCR, validated end-to-end in Grok
- ✅ 22 managed provider adapters inventoried, with 22 provider rails customer-executable today, plus 1,003 workspace-authenticated public/no-key origins
- 🟢 99.9% uptime since launch

Daily ship cadence — see [GitHub releases](https://github.com/nordsym/apiclaw/releases) for the latest changes.

---

## Links

- **Landing** — [apiclaw.cloud](https://apiclaw.cloud)
- **Docs** — [apiclaw.cloud/docs](https://apiclaw.cloud/docs)
- **Sign in** — [apiclaw.cloud/sign-in](https://apiclaw.cloud/sign-in)
- **X** — [@APIClaw](https://x.com/APIClaw)
- **npm** — [@nordsym/apiclaw](https://www.npmjs.com/package/@nordsym/apiclaw)
- **Claude Desktop Extension** — [apiclaw.cloud/apiclaw.mcpb](https://apiclaw.cloud/apiclaw.mcpb)
- **List your API** — [apiclaw.cloud/docs#list-your-api](https://apiclaw.cloud/docs#list-your-api)

Built by [NordSym](https://nordsym.com). MIT licensed.
