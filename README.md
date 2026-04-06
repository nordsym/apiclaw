# APIClaw

The API layer for AI agents. One key for everything.

[![npm version](https://img.shields.io/npm/v/@nordsym/apiclaw.svg)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![npm downloads](https://img.shields.io/npm/dw/@nordsym/apiclaw.svg)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

10,000+ installs. 19 Direct Call providers. 22,392 indexed APIs. Intelligent LLM routing.

## Install

```bash
curl -fsSL https://apiclaw.cloud/install.sh | bash
```

Restart your AI assistant. Register your email to unlock 50 calls/month.

---

## What's New

**Intelligent Gateway** -- APIClaw now routes LLM requests to the best provider automatically:
- Groq for ultra-fast inference (Llama, Mixtral)
- Mistral for European models
- Together AI for open-source (DeepSeek, Qwen)
- OpenRouter as fallback for 800+ models (GPT, Claude, Gemini, etc.)

**OpenAI-compatible endpoint** -- Use `api.apiclaw.cloud/v1/chat/completions` with any tool that speaks OpenAI. One `sk-claw-` key replaces all your provider keys.

**Workspace Settings** -- Configure routing mode (fastest, best_price, highest_quality, balanced), set default models, budget limits, and provider preferences from the dashboard.

**Per-request overrides** -- Set `X-APIClaw-Route: fastest` or `X-APIClaw-Route: groq` to override workspace defaults on any request.

---

## Three Tiers of Access

### Tier 1: Discovery (22,392 APIs)

Search the full API index. Every API ever cataloged. Free, unlimited, no account needed.

```
discover_apis("weather data for Stockholm")
-> Weatherstack, Visual Crossing, AccuWeather, OpenWeather...
```

### Tier 2: Open API (1,600+ APIs)

Public APIs with no auth required. Call them directly through APIClaw. Free.

```
call_api("frankfurter", "latest", {"from": "USD", "to": "SEK"})
-> { "rates": { "SEK": 10.85 } }
```

### Tier 3: Direct Call (19 Providers)

Premium APIs proxied through APIClaw. No keys needed. APIClaw handles auth, rate limiting, and billing.

| Provider | What | Category |
|----------|------|----------|
| OpenRouter | 800+ LLMs (GPT, Claude, Gemini, Llama) | LLM |
| Groq | Ultra-fast inference (Llama, Mixtral, Gemma) | LLM |
| Mistral | Mistral models (Small, Large, Codestral) | LLM |
| Together AI | Open-source models (DeepSeek, Qwen, Llama) | LLM |
| Cohere | RAG, reranking, embeddings | LLM |
| Replicate | ML models (Flux, SDXL, Whisper) | AI/ML |
| Stability AI | Image generation (SD3, SDXL) | AI/ML |
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

## Gateway

Use APIClaw as an OpenAI-compatible LLM gateway:

```bash
curl api.apiclaw.cloud/v1/chat/completions \
  -H "Authorization: Bearer sk-claw-..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4-6",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

The router picks the best provider based on your workspace settings. Override per-request with `X-APIClaw-Route: fastest` or target a specific provider like `X-APIClaw-Route: groq`.

---

## MCP Tools

| Tool | What |
|------|------|
| `discover_apis` | Search 22,392 APIs by capability |
| `get_api_details` | Full specs, pricing, auth |
| `call_api` | Execute through APIClaw proxy |
| `list_connected` | See available Direct Call providers |
| `check_balance` | Usage and remaining calls |
| `register_owner` | Register email, unlock 50 calls/month |

## Pricing

| Tier | Price | Access |
|------|-------|--------|
| Free | Free | 50 calls/month, full dashboard |
| Pay-as-you-go | Usage-based | Unlimited calls, billed monthly |
| Founding Backer | $199 one-time | Unlimited until 2027 |
| Enterprise | Custom | [Book a call](https://apiclaw.cloud/book) |

## For API Providers

List your APIs on APIClaw. Get discovered by AI agents. Track usage, discoveries, and calls in your dashboard.

[Register as provider](https://apiclaw.cloud/providers/register)

---

[Dashboard](https://apiclaw.cloud/workspace) - [Docs](https://apiclaw.cloud/docs) - [Book a Call](https://apiclaw.cloud/book)

MIT License
