# APIClaw

The API layer for AI agents. One key for everything.

[![npm version](https://img.shields.io/npm/v/@nordsym/apiclaw.svg)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![npm downloads](https://img.shields.io/npm/dw/@nordsym/apiclaw.svg)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

10,000+ installs. 26,700+ discoverable APIs. 1,654 callable. Intelligent LLM Gateway.

> APIClaw is in early release. Core features are live and actively expanding. Provider coverage, routing intelligence, and catalog depth grow with every update.

## Install

```bash
curl -fsSL https://apiclaw.cloud/install.sh | bash
```

Adds APIClaw as an MCP server in your Claude, Cursor, or any MCP-compatible agent. Register your email to unlock 50 calls/month.

---

## Three Ways to Use APIClaw

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
curl api.apiclaw.cloud/v1/chat/completions \
  -H "Authorization: Bearer sk-claw-..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4-6",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 3. CLI

Humans in the terminal, scripts, CI. Ships with `@nordsym/apiclaw`:

```bash
npx @nordsym/apiclaw login                    # OTP auth, terminal-native
npx @nordsym/apiclaw setup                    # auto-detect Claude, Cursor, Windsurf
apiclaw discover "send SMS to Sweden"         # search registry
apiclaw-http                                  # stand up local HTTP gateway
```

All three interfaces route through the same `api.apiclaw.cloud` gateway. One billing pipeline, one logging pipeline, one registry.

One endpoint. Automatic provider routing. The gateway selects the optimal provider based on your workspace settings:

| Routing Mode | Behavior |
|-------------|----------|
| `fastest` | Lowest latency (Groq, Mistral) |
| `best_price` | Cheapest available provider |
| `highest_quality` | Best model quality |
| `balanced` | Weighs speed, cost, and quality |

**Providers routed through the gateway:**
- **Groq** -- Ultra-fast inference (Llama, Mixtral, Gemma)
- **Mistral** -- European models (Small, Large, Codestral)
- **Together AI** -- Open-source models (DeepSeek, Qwen, Llama)
- **OpenRouter** -- 800+ models as fallback (GPT, Claude, Gemini, etc.)

Override per-request with `X-APIClaw-Route: fastest` or target a provider directly: `X-APIClaw-Route: groq`.

The Intelligent Gateway is in its first release. Routing logic, provider coverage, and model support are actively expanding.

---

## API Catalog

Browse all 26,700+ indexed APIs at [apiclaw.cloud/catalog](https://apiclaw.cloud/catalog).

- Search across 31 categories
- Toggle callable-only to filter 1,654 APIs you can call through APIClaw
- Infinite scroll, category filters, instant search

---

## Discoverable vs Callable

**Discoverable (26,704 APIs)** -- Every API in the index. Your agent can search, read specs, and evaluate them. Free and unlimited.

**Callable (1,654 APIs)** -- APIs your agent can actually execute through APIClaw. Two types:

- **Open APIs (1,635)** -- No authentication required. APIClaw calls them directly.
- **Managed Providers (19)** -- APIClaw owns the keys. You call, APIClaw authenticates.

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
| Twilio | SMS and voice calls (global) | Communication |
| 46elks | SMS (Nordic/EU, GDPR) | Communication |
| Resend | Transactional email | Email |
| E2B | Code execution sandbox | Dev Tools |
| GitHub | Repository and code access | Dev Tools |
| APILayer | 27 APIs (finance, geo, scraping, news) | Multi-API |

---

## MCP Tools

| Tool | What |
|------|------|
| `discover_apis` | Search 26,704 APIs by capability |
| `get_api_details` | Full specs, pricing, auth |
| `call_api` | Execute through APIClaw proxy |
| `list_connected` | See available managed providers |
| `check_balance` | Usage and remaining calls |
| `register_owner` | Register email, unlock 50 calls/month |

## Pricing

| Plan | Price | What you get |
|------|-------|--------------|
| Free | $0 forever | Discovery, open APIs, 50 calls/month |
| Pro | $79/month | All managed providers, priority support |
| Scale | $249/month | Volume pricing, dedicated onboarding, SLA |
| Enterprise | Custom | Private deployment, custom limits, [book a call](https://apiclaw.cloud/book) |

Pass-through pricing on managed provider calls + 30% margin. No hidden fees.

---

[Catalog](https://apiclaw.cloud/catalog) - [Dashboard](https://apiclaw.cloud/workspace) - [Docs](https://apiclaw.cloud/docs) - [Book a Call](https://apiclaw.cloud/book)

MIT License
