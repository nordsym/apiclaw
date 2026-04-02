# APIClaw

The API layer for AI agents. One install. Three tiers of access.

[![npm version](https://img.shields.io/npm/v/@nordsym/apiclaw.svg)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![npm downloads](https://img.shields.io/npm/dw/@nordsym/apiclaw.svg)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

5,300+ installs. 19 Direct Call providers. 22,392 indexed APIs.

## Install

```bash
curl -fsSL https://apiclaw.nordsym.com/install.sh | bash
```

Restart your AI assistant. First 5 API calls are free. Register your email to unlock 50/month.

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
| OpenRouter | 100+ LLMs (GPT-4, Claude, Llama) | AI |
| Replicate | ML models (image, video, audio) | AI |
| Groq | Fast LLM inference | AI |
| Mistral | Mistral models | AI |
| Cohere | NLP and embeddings | AI |
| Together AI | Open-source model hosting | AI |
| Stability AI | Image generation | AI |
| Brave Search | Privacy-first web search | Search |
| Serper | Google search results | Search |
| Firecrawl | Web scraping and crawling | Scraping |
| ElevenLabs | Text-to-speech | Voice |
| Deepgram | Speech-to-text | Voice |
| AssemblyAI | Audio intelligence | Voice |
| Twilio | SMS and voice calls | Communication |
| 46elks | SMS (Nordic) | Communication |
| Resend | Transactional email | Email |
| E2B | Code execution sandbox | Dev Tools |
| GitHub | Repository and code access | Dev Tools |
| APILayer | 27 APIs (finance, geo, scraping, news) | Multi-API |

---

## Tools

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
| Unregistered | Free | 5 API calls, unlimited search |
| Free | Free | 50 calls/month, full dashboard |
| Founding Backer | $199 one-time | Unlimited until 2027 |
| Enterprise | Custom | [Book a call](https://apiclaw.nordsym.com/book) |

## For API Providers

List your APIs on APIClaw. Get discovered by AI agents. Track usage, discoveries, and calls in your dashboard.

[Register as provider](https://apiclaw.nordsym.com/providers/register)

---

[Dashboard](https://apiclaw.nordsym.com) - [Docs](https://apiclaw.nordsym.com/docs) - [Book a Call](https://apiclaw.nordsym.com/book)

MIT License
