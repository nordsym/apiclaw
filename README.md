<h1 align="center">🦞 APIClaw</h1>

<p align="center">
  <strong>The API Layer for AI Agents</strong>
</p>

<p align="center">
  22,000+ APIs. One MCP config. Direct Call = no keys needed.
</p>

<p align="center">
  <a href="https://apiclaw.com">Website</a> •
  <a href="#direct-call">Direct Call</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#for-providers">For Providers</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/APIs-22,392-ef4444" alt="APIs" />
  <img src="https://img.shields.io/badge/Categories-14-171717" alt="Categories" />
  <img src="https://img.shields.io/badge/Direct_Call-11_Providers-00d4ff" alt="Direct Call" />
  <img src="https://img.shields.io/badge/MCP-Compatible-00d4ff" alt="MCP Compatible" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## Why APIClaw?

AI agents don't browse documentation. They query capabilities and execute.

APIClaw is the missing layer between agents and the API economy:

- **Discovery** — 22,000+ APIs, searchable by capability
- **Direct Call** — Execute without API keys (we handle auth)
- **One config** — Add APIClaw MCP, access everything

---

## Direct Call

**No API keys. No setup. Just call.**

Your agent can execute these APIs directly through APIClaw:

```javascript
// Run any ML model
mcp.call("call_api", {
  provider: "replicate",
  action: "run_model",
  params: {
    model: "stability-ai/sdxl",
    input: { prompt: "a cyber-lobster in neon lights" }
  }
})

// Access 100+ LLMs through one endpoint
mcp.call("call_api", {
  provider: "openrouter",
  action: "chat",
  params: {
    model: "anthropic/claude-3-opus",
    messages: [{ role: "user", content: "Hello!" }]
  }
})

// Execute code in secure sandbox
mcp.call("call_api", {
  provider: "e2b",
  action: "run_code",
  params: {
    language: "python",
    code: "print('Hello from sandbox!')"
  }
})

// Scrape any website
mcp.call("call_api", {
  provider: "firecrawl",
  action: "scrape",
  params: { url: "https://example.com" }
})
```

### Available Direct Call Providers

| Provider | What It Does | Actions |
|----------|--------------|---------|
| **OpenRouter** | 100+ AI models (Claude, GPT, Llama, etc.) | `chat` |
| **Replicate** | Any ML model (Stable Diffusion, Whisper, etc.) | `run_model`, `get_prediction` |
| **E2B** | Secure code sandbox for agents | `run_code`, `run_shell` |
| **Firecrawl** | Web scraping & crawling | `scrape`, `crawl` |
| **ElevenLabs** | Voice synthesis | `text_to_speech` |
| **GitHub** | Repos, issues, code search | `search`, `repos`, `issues` |
| **Brave Search** | Web search | `search` |
| **Resend** | Transactional email | `send_email` |
| **46elks** | SMS/Voice (Swedish/EU) | `send_sms` |
| **Twilio** | SMS/Voice (Global) | `send_sms` |
| **CoinGecko** | Crypto prices & data | `price`, `markets` |

---

## Quick Start

```bash
npx @nordsym/apiclaw
```

### Add to Claude Desktop

```json
{
  "mcpServers": {
    "apiclaw": {
      "command": "npx",
      "args": ["@nordsym/apiclaw"]
    }
  }
}
```

Works with Claude, GPT (via MCP bridge), Cursor, Cline, and any MCP-compatible client.

---

## Discovery

22,392 APIs indexed across 14 categories:

```javascript
// Find APIs by capability
mcp.call("discover_apis", {
  query: "image generation AI",
  max_results: 5
})

// Get full details
mcp.call("get_api_details", {
  api_id: "replicate"
})
// → endpoints, auth, pricing, examples
```

### Categories

| Category | APIs | Category | APIs |
|----------|------|----------|------|
| Utilities | 7,069 | Finance | 1,179 |
| Analytics | 2,600 | Commerce | 1,151 |
| Development | 2,278 | Location | 976 |
| Cloud | 1,463 | Communication | 939 |
| AI & ML | 1,259 | Business | 923 |
| Entertainment | 1,212 | Health | 740 |
| Security | 491 | Social | 112 |

---

## For Providers

**Get your API in front of AI agents.**

Agents are the next wave of API consumers. They don't see your landing page—they query capabilities.

### Self-Service Dashboard

1. Sign up at [apiclaw.com/providers](https://apiclaw.com/providers)
2. Add your API spec
3. Configure Direct Call (optional)
4. Go live

**Direct Call benefits:**
- Agents use your API without key setup
- You provide one service account key
- We handle auth routing
- You get usage analytics

→ [apiclaw.com/providers](https://apiclaw.com/providers)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Your Agent                            │
└─────────────────────────────┬───────────────────────────────┘
                              │ MCP Protocol
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       🦞 APIClaw                             │
│                                                              │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│   │  Discovery   │  │  Direct Call │  │   Provider   │     │
│   │   22k APIs   │  │  11 Live     │  │   Dashboard  │     │
│   └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────┬───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  ┌──────────┐         ┌──────────┐         ┌──────────┐
  │ OpenRouter│        │ Replicate │        │   E2B    │
  │ Firecrawl │        │ ElevenLabs│        │  GitHub  │
  │   + 5     │        │   Brave   │        │  + more  │
  └──────────┘         └──────────┘         └──────────┘
```

---

## MCP Tools

| Tool | Description |
|------|-------------|
| `discover_apis` | Search 22k APIs by capability |
| `get_api_details` | Full spec, auth, endpoints |
| `list_connected` | Show Direct Call providers |
| `call_api` | Execute via Direct Call |
| `list_categories` | Browse all 14 categories |

---

## Links

- **Website:** [apiclaw.com](https://apiclaw.com)
- **Providers:** [apiclaw.com/providers](https://apiclaw.com/providers)
- **npm:** [@nordsym/apiclaw](https://www.npmjs.com/package/@nordsym/apiclaw)
- **Built by:** [NordSym](https://nordsym.com)

---

## License

MIT © [NordSym](https://nordsym.com)

---

<p align="center">
  <strong>🦞 APIClaw</strong><br/>
  <em>The API layer for the agentic era.</em>
</p>

## 💳 Metered Billing (Pay-per-Call)

APIClaw supports usage-based billing at **$0.002 per API call**.

### Setup
```typescript
// 1. Customer signs up for metered billing
const result = await mcp.call('setup_metered_billing', {
  email: 'customer@example.com'
});
// Returns checkout URL - customer completes payment setup

// 2. After checkout, API calls are tracked automatically
// Usage is reported to Stripe meter after each successful call

// 3. Check usage during billing period
const usage = await mcp.call('get_usage_summary', {
  subscription_id: 'sub_xxx'
});
// Returns: { total_calls: 150, estimated_cost: "$0.30" }
```

### Pricing Examples
| Calls/Month | Cost |
|-------------|------|
| 100 | $0.20 |
| 1,000 | $2.00 |
| 10,000 | $20.00 |
| 100,000 | $200.00 |

### Direct Call Mode
If you have your own API keys, Direct Call bypasses metered billing - you pay providers directly.
