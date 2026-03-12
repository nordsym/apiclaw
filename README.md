# 🦞 APIClaw

The API layer for AI agents. 18 providers → 1000s of capabilities. Workspace → Dashboard → Ship.

[![npm version](https://img.shields.io/npm/v/@nordsym/apiclaw.svg)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![npm downloads](https://img.shields.io/npm/dw/@nordsym/apiclaw.svg)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

---

## The Platform

**[apiclaw.com](https://apiclaw.com)** — Your workspace for API-powered agents.

| Layer | What You Get |
|-------|--------------|
| **Workspace** | Manage API keys, team access, usage analytics |
| **Dashboard** | Real-time logs, cost tracking, rate limit monitoring |
| **18 Direct Call Providers** | 1000+ ML models, 100+ LLMs, voice, SMS, email — zero config |
| **1,636 Open APIs** | Curated public APIs, instant access |
| **22,392 Discovery** | Full API index for exploration |

One `mcp-install` connects your agent to all of it.

---

## Quick Start

```bash
npx @nordsym/apiclaw mcp-install
```

That's it. Restart your AI assistant. Ask it to *"Send an SMS"* or *"Generate an image"* — it works.

---

## What You Get

### Instant API Access
Tell your agent what to do. APIClaw handles auth, rate limits, and execution.

### 18 Direct Call Providers
Premium APIs ready for production. Voice, AI, SMS, Email, Search — all pre-configured.

### 1,636 Open APIs
Public APIs indexed and callable. Weather, crypto, sports, government data.

### 22,392 Discovery APIs
The full catalog. Search, explore, find the right API for any task.

### Workspace Dashboard
See every call, track costs, monitor usage. One place for your entire team.

---

## 18 Direct Call Providers

Pre-configured, production-ready APIs. Just call them.

### 🤖 AI & LLM

| Provider | Capability |
|----------|------------|
| **Replicate** | 1,000+ ML models — image gen, video, audio, any model |
| **OpenRouter** | 100+ LLMs — GPT-4, Claude, Llama, Mistral, unified API |
| **Groq** | Ultra-fast inference — Llama, Mixtral at 500+ tokens/sec |
| **Mistral** | Mistral models — Mistral Large, Medium, Small |
| **Cohere** | Enterprise NLP — embeddings, rerank, generate |
| **Together AI** | Open models — fine-tuning, fast inference |
| **Stability AI** | Image generation — Stable Diffusion, SDXL, SD3 |

### 🎤 Voice

| Provider | Capability |
|----------|------------|
| **ElevenLabs** | Text-to-speech — 29 languages, voice cloning, realistic voices |
| **Deepgram** | Speech-to-text — real-time transcription, 36 languages |
| **AssemblyAI** | Audio intelligence — transcription, summarization, sentiment |

### 📱 SMS

| Provider | Capability |
|----------|------------|
| **46elks** | Swedish SMS API — simple, reliable, great pricing |
| **Twilio** | Global SMS — 180+ countries, programmable messaging |

### 📧 Email

| Provider | Capability |
|----------|------------|
| **Resend** | Developer email — simple API, great deliverability |

### 🔍 Search

| Provider | Capability |
|----------|------------|
| **Brave Search** | Web search — privacy-focused, no tracking |
| **Firecrawl** | Web scraping — extract content, convert to markdown |
| **Serper** | Google Search API — SERP data, real-time results |

### 💻 Code

| Provider | Capability |
|----------|------------|
| **E2B** | Code sandbox — run any code safely, isolated environments |

### 🛠️ Dev

| Provider | Capability |
|----------|------------|
| **GitHub** | GitHub API — repos, issues, PRs, actions |

---

## 1,636 Open APIs

Public APIs, instantly callable. No API keys needed.

**Categories:**
- Weather & Environment
- Finance & Crypto
- Sports & Entertainment
- Government & Public Data
- Transportation
- Food & Recipes
- Science & Education

Browse at [apiclaw.com/open-apis](https://apiclaw.com/open-apis)

---

## 22,392 Discovery APIs

The full index. Every API we've cataloged.

Use `discover_apis` to search:
```
"Find APIs for flight tracking"
"Show me cryptocurrency price APIs"
"What APIs exist for recipe data?"
```

Browse at [apiclaw.com/discover](https://apiclaw.com/discover)

---

## Installation

### One-Line Install (Recommended)

```bash
npx @nordsym/apiclaw mcp-install
```

Auto-detects Claude Desktop or Claude Code. Configures MCP. Done.

### Options

```bash
# Target specific client
npx @nordsym/apiclaw mcp-install --client claude-desktop
npx @nordsym/apiclaw mcp-install --client claude-code

# Preview without applying
npx @nordsym/apiclaw mcp-install --dry-run
```

### Global Install

```bash
npm install -g @nordsym/apiclaw
apiclaw setup
```

---

## Commands

| Command | Description |
|---------|-------------|
| `mcp-install` | Quick setup for Claude Desktop/Code |
| `setup` | Full setup with all MCP client options |
| `doctor` | Diagnose your APIClaw installation |
| `restore` | Restore config from backup |
| `uninstall` | Remove APIClaw from clients |

### setup

Full-featured setup for any MCP client.

```bash
npx @nordsym/apiclaw setup --client cursor
npx @nordsym/apiclaw setup --client windsurf
npx @nordsym/apiclaw setup --client cline
npx @nordsym/apiclaw setup --workspace ws_abc123
npx @nordsym/apiclaw setup --wizard
```

### doctor

Check your setup.

```bash
npx @nordsym/apiclaw doctor
```

```
🔍 APIClaw Health Check
========================
System:
  ✓ Node.js v20.11.0
  ✓ npm 10.2.4

MCP Clients:
  ✓ Claude Desktop - Configured ✓
  ✓ Cursor - Configured ✓

Status: All systems operational ✓
```

### restore

Restore from backup.

```bash
npx @nordsym/apiclaw restore --list
npx @nordsym/apiclaw restore
```

### uninstall

Remove APIClaw.

```bash
npx @nordsym/apiclaw uninstall
npx @nordsym/apiclaw uninstall --client cursor
```

---

## MCP Clients

| Client | macOS | Windows | Linux |
|--------|:-----:|:-------:|:-----:|
| **Claude Desktop** | ✅ | ✅ | ✅ |
| **Claude Code** | ✅ | ✅ | ✅ |
| **Cursor** | ✅ | ✅ | ✅ |
| **Windsurf** | ✅ | ✅ | ✅ |
| **Cline** | ✅ | ✅ | ✅ |
| **Continue** | ✅ | ✅ | ✅ |

<details>
<summary>Config Locations</summary>

**Claude Desktop**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**Cursor**
- macOS: `~/Library/Application Support/Cursor/User/globalStorage/cursor.mcp/config.json`
- Windows: `%APPDATA%\Cursor\User\globalStorage\cursor.mcp\config.json`

**Windsurf**
- All: `~/.codeium/windsurf/mcp_config.json`

**Cline**
- macOS: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

**Continue**
- All: `~/.continue/config.json`

</details>

---

## How It Works

```json
{
  "mcpServers": {
    "apiclaw": {
      "command": "npx",
      "args": ["-y", "@nordsym/apiclaw"]
    }
  }
}
```

1. Your agent launches APIClaw as an MCP server
2. APIClaw exposes APIs as callable tools
3. Agent calls `send_sms`, `generate_image`, `search_web`
4. APIClaw handles auth, rate limits, execution
5. Results flow back to the agent

---

## Dry-Run Mode

Test without making real API calls.

```javascript
call_api({
  provider: "46elks",
  action: "send_sms",
  params: { to: "+46701234567", message: "Test" },
  dry_run: true
})
```

Returns the exact request that *would* be sent, with mock response data.

---

## Links

- **Platform:** [apiclaw.com](https://apiclaw.com)
- **Docs:** [apiclaw.nordsym.com/docs](https://apiclaw.nordsym.com/docs)
- **GitHub:** [github.com/nordsym/apiclaw](https://github.com/nordsym/apiclaw)
- **npm:** [@nordsym/apiclaw](https://www.npmjs.com/package/@nordsym/apiclaw)

---

MIT © [NordSym](https://nordsym.com)
