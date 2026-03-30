# APIClaw

The API layer for AI agents. 19 providers. 22,000+ APIs. One install.

[![npm version](https://img.shields.io/npm/v/@nordsym/apiclaw.svg)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![npm downloads](https://img.shields.io/npm/dw/@nordsym/apiclaw.svg)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

## Install

```bash
npx @nordsym/apiclaw mcp-install
```

Restart your AI assistant. Done. No signup needed for first 5 calls.

## What you get

| Layer | Access |
|-------|--------|
| **19 Direct Call Providers** | ML models, LLMs, voice, SMS, email, scraping, search - zero config |
| **1,600+ Open APIs** | Public APIs, instant access, no auth |
| **22,000+ Discovery** | Full API index for agent exploration |
| **Workspace** | Usage analytics, API management, team access |

## How it works

Your agent searches for what it needs. APIClaw returns ranked matches. Agent calls the API through APIClaw. No keys needed.

```
Agent: "I need weather data for Stockholm"
  -> discover_apis("weather data")
  -> call_api("weatherstack", "weatherstack_current", {"query": "Stockholm"})
  -> { temperature: 8, weather_descriptions: ["Partly cloudy"] }
```

## Tools

| Tool | What it does |
|------|-------------|
| `discover_apis` | Search 22,000+ APIs by capability |
| `get_api_details` | Full specs, pricing, auth requirements |
| `call_api` | Execute API calls through APIClaw proxy |
| `list_connected` | See all available Direct Call providers |
| `check_balance` | View usage and remaining calls |

## Pricing

| Tier | Price | Calls |
|------|-------|-------|
| Unregistered | Free | 5 calls total |
| Free | Free | 50 calls/month |
| Founding Backer | $199 one-time | Unlimited until 2027 |
| Enterprise | Custom | Book a call |

Register with your email to unlock 50 calls/month:
```
register_owner({ email: "you@example.com" })
```

## Direct Call Providers

OpenRouter, Brave Search, Resend, ElevenLabs, 46elks, Twilio, Replicate, Firecrawl, E2B, Groq, Deepgram, Serper, Mistral, Cohere, Together AI, Stability AI, AssemblyAI, GitHub, APILayer (27 APIs).

All authenticated and proxied through APIClaw. Your agent never manages API keys.

## For API Providers

List your APIs on APIClaw. Get discovered by AI agents. Track usage in your dashboard.

```
apiclaw.nordsym.com/providers/register
```

## Links

- [Dashboard](https://apiclaw.nordsym.com)
- [Docs](https://apiclaw.nordsym.com/docs)
- [Book a Call](https://apiclaw.nordsym.com/book)

## License

MIT
