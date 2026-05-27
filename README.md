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

**The Control Plane for AI Agents.** One runtime over every LLM provider and 26,701 indexed APIs (2,906 callable, 49 fully managed). Discovery, routing, missions, observability — all on one rail. Sign in once with `apiclaw auth login`, the same credential works across local MCP, CLI, HTTP gateway, and Remote MCP.

Use any model you want — OpenAI, Anthropic, [OpenRouter](https://openrouter.ai) (800+ models), xAI, Groq, Mistral, Cohere, Together, DeepInfra, or your own endpoint. Switch with one parameter, no SDK swap, no lock-in.

| | |
|---|---|
| **One runtime, four doors** | Install (`.mcpb`), CLI (`apiclaw`), HTTP gateway (`api.apiclaw.cloud`), Remote MCP (`apiclaw.cloud/mcp`). Same auth, same logs, same canon — all from one sign-in. |
| **Agent-native auth** | `npx @nordsym/apiclaw auth login` opens the browser, one-tap Google sign-in, writes `~/.apiclaw.toml`. ~15 seconds. No keys to paste. Sub-15-second signup-to-first-call. |
| **Discover 26,701 APIs** | Find providers by job-to-be-done. Health-ranked, capability-tagged, callable-or-not flagged. The `discover_apis` tool delegates to the gateway so every door returns the same canon. |
| **Mission runtime** | Compose `fetch`, `transform`, `decide`, `validate`, `execute` primitives into typed orchestrations. Append-only `missionEvents` audit log. Cost-budget per mission with hard halt. Parallel-execution scaffolding ready. |
| **Observability built in** | Every call logged with `_apiclaw` metadata (provider, route, latency, cost, auth mode). 80% quota warning surfaces as `_notice` before paywall. Weekly funnel scorecard mailed Monday 08:00 UTC. |
| **Managed where it matters** | 49 directCallConfigs across 19 brands — OpenAI, Anthropic, OpenRouter, xAI, Replicate, ElevenLabs, Brave Search, Firecrawl, GitHub, APILayer's 24 callable sub-APIs, NASA, Filestack. Keys held server-side, agent never manages credentials. |

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

Adds APIClaw as an MCP server in Claude Desktop, Cursor, Windsurf, OpenClaw, or any MCP-compatible agent. The auth flow opens the browser, signs you in via Google one-tap, and writes `~/.apiclaw.toml`. Free tier: 25 calls per month. Pay-as-you-go beyond that at API cost + 15%.

> Headless server or SSH session? `npx @nordsym/apiclaw login --email-fallback` runs the legacy magic-link flow.

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

### Discoverable (26,701)
The full registry, searchable via `discover_apis(query)`. Every entry tagged by category, health-ranked by recent success-rate, callable-or-not flagged.

### Callable (2,906)
Empirically verified callable. Subset breakdown:

- **Managed (49 across 19 brands)** — APIClaw owns the keys. Agent never manages credentials. OpenAI, Anthropic, OpenRouter, xAI, Replicate, ElevenLabs, Brave Search, Firecrawl, GitHub, E2B, Groq, Deepgram, Serper, Mistral, Cohere, Together, Stability, AssemblyAI, APILayer (24 sub-APIs), NASA, Filestack.
- **Keyless verified (~2,857)** — Public APIs proxied through APIClaw without auth. Smoketested, sortable by verified latency.

### Mission templates
- `prd-generation v1` — fetch → validate, routes to GenPRD via shared secret, returns structured Markdown PRD with rule-based quality gate.
- More on the way — `research`, `outreach-draft`, `screenshot-bundle` templates queued.

---

## Pricing

| Plan | Price | Access |
|------|------|------|
| **Free** | $0 forever | 25 calls per month across the platform. Unlimited Discovery. Free email signup required (Google one-tap or magic link). |
| **Pay as you go** | API cost + 15% margin | Unlimited calls. Per-call cost calculated from actual token usage. Soft 80% notice in success response before quota hit. |

Pricing canon: pass-through plus 15% margin (market standard, same as OpenRouter). Stripe metered billing live.

---

## Status

- ✅ Live at `apiclaw.cloud` and `api.apiclaw.cloud`
- ✅ npm package `@nordsym/apiclaw` — 16,485+ all-time installs
- ✅ Claude Desktop Extension hosted at `apiclaw.cloud/apiclaw.mcpb` (~50 MB bundle, zero-key install)
- ✅ Mission runtime v2 (5 typed primitives) live in Convex prod
- ✅ Remote MCP via Streamable HTTP + OAuth 2.1 + PKCE + DCR, validated end-to-end in Grok
- ✅ APILayer partnership in commercial close (24/27 callable today, 20% rev-share commercial structure)
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
