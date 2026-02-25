<h1 align="center">🦞 APIClaw</h1>

<p align="center">
  <strong>The API Layer for AI Agents</strong>
</p>

<p align="center">
  Agents discover, evaluate, and integrate APIs via MCP.<br/>
  No more googling. No dashboards. Just endpoints.
</p>

<p align="center">
  <a href="https://apiclaw.nordsym.com">Website</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#for-providers">For Providers</a> •
  <a href="https://nordsym.com">NordSym</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/APIs-15,000-ef4444" alt="APIs" />
  <img src="https://img.shields.io/badge/Categories-446-171717" alt="Categories" />
  <img src="https://img.shields.io/badge/Direct_Call-6_APIs-00d4ff" alt="Direct Call" />
  <img src="https://img.shields.io/badge/MCP-Compatible-00d4ff" alt="MCP Compatible" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## Why APIClaw?

**AI agents are the new developers.** They don't browse documentation or click through dashboards. They query capabilities and expect structured responses.

APIClaw is the missing layer between agents and the API economy.

```
Agent: "I need to send SMS to Swedish numbers"
    ↓
APIClaw: Here are your options, ranked by fit
    ↓
Agent: *integrates and ships*
```

---

## Quick Start

```bash
npx @nordsym/apiclaw
```

That's it. The MCP server is running.

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

---

## What Your Agent Can Do

### 🔍 Discover APIs

```javascript
// Agent asks for a capability
mcp.call("discover_apis", {
  query: "send SMS to EU numbers",
  max_results: 5
})

// Returns ranked options with full metadata
// → 46elks, Twilio, Vonage...
```

### 📋 Get Full Details

```javascript
// Get everything needed to integrate
mcp.call("get_api_details", {
  api_id: "46elks"
})

// → endpoints, auth, pricing, examples
```

### 💳 Purchase Access

```javascript
// Buy credits, get real credentials
mcp.call("purchase_access", {
  api_id: "46elks",
  amount_usd: 10
})

// → Real API keys, ready to use
```

### ⚡ Direct Call (NEW!)

**No API keys needed.** Execute API calls directly through APIClaw.

```javascript
// List available connected APIs
mcp.call("list_connected")
// → 46elks, twilio, brave_search, resend, openrouter, elevenlabs

// Send SMS without any API key
mcp.call("call_api", {
  provider: "46elks",
  action: "send_sms",
  params: {
    to: "+46701234567",
    message: "Hello from APIClaw!"
  }
})

// Search the web
mcp.call("call_api", {
  provider: "brave_search",
  action: "search",
  params: { query: "best restaurants in Stockholm" }
})

// Generate AI response
mcp.call("call_api", {
  provider: "openrouter",
  action: "chat",
  params: {
    messages: [{ role: "user", content: "Hello!" }],
    model: "anthropic/claude-3-haiku"
  }
})
```

**Available Direct Call APIs:**

| Provider | Actions | Description |
|----------|---------|-------------|
| `46elks` | `send_sms` | Swedish SMS/Voice |
| `twilio` | `send_sms` | Global SMS/Voice |
| `brave_search` | `search` | Web search |
| `resend` | `send_email` | Transactional email |
| `openrouter` | `chat` | 100+ AI models |
| `elevenlabs` | `text_to_speech` | Voice synthesis |

---

## The Numbers

| Metric | Value |
|--------|-------|
| **APIs Indexed** | 15,000 |
| **Categories** | 446 |
| **Direct Call** | 6 APIs |
| **Response Time** | <200ms |
| **Uptime** | 24/7 |

---

## For Providers

**Get your API in front of AI agents.**

Agents are the next wave of API consumers. They don't see your landing page—they query capabilities. List your API on APIClaw and get discovered.

```
→ apiclaw.nordsym.com/providers
```

**Benefits:**
- 🤖 Reach autonomous agents worldwide
- 📊 Analytics on agent usage
- ⚡ Zero integration work
- 🆓 Free to list

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        Your Agent                            │
└─────────────────────────────┬───────────────────────────────┘
                              │ MCP Protocol
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     🦞 APIClaw                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Discovery  │  │   Credits   │  │    Credentials      │  │
│  │   Engine    │  │   System    │  │      (Live)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
    ┌────────────┐    ┌────────────┐    ┌────────────┐
    │  15,000    │    │   Convex   │    │   Stripe   │
    │   APIs     │    │  Backend   │    │  Payments  │
    └────────────┘    └────────────┘    └────────────┘
```

---

## Live Integrations

These providers have **real credentials** available:

| Provider | Category | What You Get |
|----------|----------|--------------|
| **46elks** | SMS/Voice | Real API keys for Swedish/EU SMS |
| **Twilio** | SMS/Voice | Production credentials |

More coming soon.

---

## MCP Tools

| Tool | Description |
|------|-------------|
| `discover_apis` | Search by capability, get ranked matches |
| `get_api_details` | Full spec, auth, endpoints, examples |
| `purchase_access` | Buy credits, receive credentials |
| `check_balance` | View credits and active purchases |
| `list_categories` | Browse all 90+ categories |

---

## What Makes This Different

Most API marketplaces make agents navigate human UIs. We flip it:

- **Agents query via MCP** → Get 15,000 APIs, ranked by fit, structured as JSON
- **Providers manage via dashboard** → When they want to, not as a blocker
- **Zero manual API key juggling** → Direct Call handles auth

We have docs, a landing page, dashboards—they're just not required for agents to work. Agents can skip straight to the API.

---

## Links

- **Website:** [apiclaw.nordsym.com](https://apiclaw.nordsym.com)
- **Provider Portal:** [apiclaw.nordsym.com/providers](https://apiclaw.nordsym.com/providers)
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
