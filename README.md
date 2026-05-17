# APIClaw

The API layer for AI agents.

[![npm version](https://img.shields.io/npm/v/@nordsym/apiclaw.svg)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![npm downloads](https://img.shields.io/npm/dw/@nordsym/apiclaw.svg)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

13,500+ installs. 26,704 discoverable APIs. 2,895 empirically callable (49 fully managed). Intelligent LLM Gateway.

> APIClaw is in early release. Core features are live and actively expanding. Provider coverage, routing intelligence, and catalog depth grow with every update.

## Install

```bash
# 1. Install the MCP server
curl -fsSL https://apiclaw.cloud/install.sh | bash

# 2. Authenticate (browser opens, one tap, ~10 seconds)
npx @nordsym/apiclaw auth login
```

Adds APIClaw as an MCP server in your Claude, Cursor, Windsurf, or any MCP-compatible agent. The auth flow opens your browser, signs you in via Clerk (Google one-tap or passwordless email), and writes `~/.apiclaw.toml`. The same workspace then works across MCP, CLI, HTTP gateway, and Remote MCP. Free tier: 25 calls/month.

> **Headless server or SSH?** `npx @nordsym/apiclaw auth login --email-fallback` runs the legacy magic-link flow.

---

## Four Ways to Use APIClaw

### 1. MCP Server (Agent Discovery + Calling)

Install APIClaw and your agent gets tools to discover and call APIs directly:

```
discover_apis("weather data for Stockholm")
-> Weatherstack, Visual Crossing, AccuWeather, OpenWeather...

call_api("frankfurter", "latest", {"from": "USD", "to": "SEK"})
-> { "rates": { "SEK": 10.85 } }
```

The agent handles everything through MCP tools. Works in Claude Desktop, Cursor, Windsurf, OpenClaw, and any MCP-compatible client.

### 2. Intelligent Gateway (OpenAI-compatible endpoint)

Generate an `sk-claw-` API key at [apiclaw.cloud/workspace](https://apiclaw.cloud/workspace) and use APIClaw as an LLM gateway from any application:

```bash
curl https://apiclaw.cloud/v1/chat/completions \
  -H "Authorization: Bearer sk-claw-..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4-6",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 3. Remote MCP — Grok, Cursor, ChatGPT, Claude (OAuth, zero install)

Paste one URL into your AI client. APIClaw handles the rest via OAuth.

```
https://apiclaw.cloud/mcp
```

Grok auto-discovers our authorization server, opens a sign-in window, you click "Authorize", and the connector is live. Standard MCP OAuth 2.1 (PKCE + RFC 7591 dynamic registration). No npm, no config file, no API keys to copy.

**Connect to Grok in 20 seconds:**

1. Open Grok → **Settings → Connectors → Add MCP server**
2. Paste `https://apiclaw.cloud/mcp` and click **Connect**
3. Sign in with your APIClaw email (or create the workspace) → **Authorize**

Done. Grok now has `discover_apis`, `call_api`, `get_api_details`, `list_categories`, `list_connected`, and `check_balance`.

**Same flow works in Cursor, ChatGPT (custom GPT), Claude Desktop, and any MCP-compliant client** — just point them at `https://apiclaw.cloud/mcp`.

Need pre-shared credentials instead of OAuth? Open [Workspace → Integrations](https://apiclaw.cloud/workspace/integrations), click **Generate connector**, copy the Client ID and Secret.

<details>
<summary><strong>Troubleshooting</strong></summary>

| Symptom | Fix |
|---------|-----|
| Grok doesn't auto-find APIClaw in connector search | Add it manually as a custom MCP server with URL `https://apiclaw.cloud/mcp`. We're rolling into the public catalogs in the next sweep. |
| Grok shows "Connected" but says it has no access when you ask it to use APIClaw | Start a fresh Grok chat — old chats keep their tool-call cache and don't pick up newly added connectors. |
| 401 loop after authorize | Your access token expired or was revoked. Open [Workspace → Integrations](https://apiclaw.cloud/workspace/integrations), revoke the connector, and re-add it in the client. |
| `client_bound_to_other_workspace` | A dynamic client is bound to the first workspace that approved consent. Sign in with the same email or use [Generate connector](https://apiclaw.cloud/workspace/integrations) to create a fresh one for the new workspace. |
| Consent screen redirects but client says "denied" | The browser blocked the redirect or you closed the tab early. Click "Authorize" again — auth codes are single-use but expire after 10 minutes so you can retry. |

</details>

### 4. CLI

Humans in the terminal, scripts, CI. Ships with `@nordsym/apiclaw`:

```bash
npx @nordsym/apiclaw login                    # OTP auth, terminal-native
npx @nordsym/apiclaw setup                    # auto-detect Claude, Cursor, Windsurf
apiclaw discover "transcribe audio file"      # search registry
apiclaw-http                                  # stand up local HTTP gateway
```

All four interfaces route through the same `apiclaw.cloud` gateway. One billing pipeline, one logging pipeline, one registry. Email-verified workspace required for any token issuance — discovery is open, execution requires auth.

One endpoint. Automatic provider routing. The gateway selects the optimal provider based on your workspace settings:

| Routing Mode | Behavior |
|-------------|----------|
| `balanced` | Default. Weighs speed, cost, and quality |
| `fastest` | Lowest latency (Groq, Mistral) |
| `best_price` | Cheapest available provider |
| `highest_quality` | Best model quality |
| `advisor` | Opt-in. Mistral Small picks the optimal model per prompt (only fires when no model is set in the request) |

**Providers routed through the gateway:**
- **Groq** -- Ultra-fast inference (Llama, Mixtral, Gemma)
- **Mistral** -- European models (Small, Large, Codestral)
- **Together AI** -- Open-source models (DeepSeek, Qwen, Llama)
- **OpenRouter** -- 800+ models as fallback (GPT, Claude, Gemini, etc.)

Override per-request with `X-APIClaw-Route: fastest` or target a provider directly: `X-APIClaw-Route: groq`.

The Intelligent Gateway is in its first release. Routing logic, provider coverage, and model support are actively expanding.

---

## API Catalog

Browse all 26,704 indexed APIs at [apiclaw.cloud/catalog](https://apiclaw.cloud/catalog).

- Search across 40+ categories
- Filter by tier: Managed (49), Callable (2,895), Discovery only (~23,800)
- Every "Callable" entry is empirically smoketested (HTTP 200 + parseable JSON in our last sweep)
- Infinite scroll, category filters, instant search

---

## Discoverable vs Callable

**Discoverable (26,704 APIs)** -- Every API in the index. Your agent can search, read specs, and evaluate them. Free and unlimited.

**Callable (2,895 APIs)** -- Every entry empirically smoketested: returned HTTP 200 + parseable JSON in our last sweep. Two layers:

- **Managed (49 directCallConfigs across 19 brands)** -- APIClaw owns the keys. You call, APIClaw authenticates.
- **Keyless verified (~2,846)** -- Public APIs proxied through APIClaw, smoketest-passed. Sortable by verified latency.

The remaining ~6,500 OpenAPI-spec'd providers in the registry have valid integration paths but need context (POST body, path-vars, required query params) we couldn't smoketest blindly. They live in Discovery — your agent can still call them through APIClaw if it supplies the right inputs, but we don't claim them as callable until proven.

### Managed Providers

| Provider | What | Category |
|----------|------|----------|
| OpenRouter | 800+ LLMs (GPT, Claude, Gemini, Llama) | AI & ML |
| Groq | Ultra-fast inference (Llama, Mixtral, Gemma) | AI & ML |
| Mistral | Mistral models (Small, Large, Codestral) | AI & ML |
| Together AI | Open-source models (DeepSeek, Qwen, Llama) | AI & ML |
| Cohere | RAG, reranking, embeddings | AI & ML |
| Replicate | ML models (Flux, SDXL, Whisper) | AI & ML |
| Stability AI | Image generation (SD3, SDXL) | AI & ML |
| ElevenLabs | Text-to-speech (29 languages) | Voice |
| Deepgram | Speech-to-text (Nova-3) | Voice |
| AssemblyAI | Audio intelligence, diarization | Voice |
| Brave Search | Privacy-first web search | Search |
| Serper | Google SERP results | Search |
| Firecrawl | Web scraping and crawling | Scraping |
| E2B | Code execution sandbox | Dev Tools |
| GitHub | Repository and code access | Dev Tools |
| APILayer | 22 callable APIs (finance, geo, scraping, news) | Multi-API |

---

## MCP Tools

| Tool | What |
|------|------|
| `discover_apis` | Search 26,704 APIs by capability |
| `get_api_details` | Full specs, pricing, auth |
| `call_api` | Execute through APIClaw proxy |
| `list_connected` | See available managed providers |
| `check_balance` | Usage and remaining calls |
| `register_owner` | Legacy auth (email magic-link). Canonical flow: run `npx @nordsym/apiclaw auth login` in the terminal — the MCP server reads `~/.apiclaw.toml` and unlocks 25 calls/month |

## Pricing

| Plan | Price | What you get |
|------|-------|--------------|
| Free | $0 forever | Discovery (always free), 25 managed calls/month |
| Pay-as-you-go | Provider cost + 15% margin | All managed providers, no monthly fee, metered billing |
| Enterprise | Custom | Private deployment, custom limits, SLA, [book a call](https://apiclaw.cloud/book) |

Pass-through pricing on managed provider calls + 15% margin. No hidden fees.

---

[Catalog](https://apiclaw.cloud/catalog) - [Dashboard](https://apiclaw.cloud/workspace) - [Docs](https://apiclaw.cloud/docs) - [Book a Call](https://apiclaw.cloud/book)

MIT License
