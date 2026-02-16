# APIvault

**Agent-native API discovery and purchasing via MCP.**

> The place where AI agents discover, evaluate, and purchase API access directly. No dashboard. No manual signup. Agent-first.

## What is this?

APIvault is an MCP server that lets AI agents:
1. **Discover** APIs based on capabilities ("I need to send SMS")
2. **Evaluate** pricing, features, and success rates
3. **Purchase** access and receive credentials instantly
4. **Track** usage and balance

## Quick Start

### 1. Install dependencies

```bash
cd ~/clawd/products/api-discovery
pnpm install
```

### 2. Build

```bash
pnpm build
```

### 3. Run tests

```bash
pnpm test
```

### 4. Add to Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "apivault": {
      "command": "node",
      "args": ["/Users/gustavhemmingsson/clawd/products/api-discovery/dist/index.js"]
    }
  }
}
```

### 5. Run manually (stdio)

```bash
node dist/index.js
```

## MCP Tools

### `discover_apis`

Search for APIs by describing what you need.

```
Input:
  query: "send SMS to Swedish numbers"
  category?: "communication" | "search" | "ai"
  max_results?: 5
  region?: "SE" | "EU" | "global"

Output:
  - Ranked list of matching APIs
  - Relevance scores
  - Pricing info
  - Success rates
```

### `get_api_details`

Get full information about a specific API.

```
Input:
  api_id: "46elks"

Output:
  - Full API specification
  - All endpoints
  - Pricing details
  - Features and compliance
```

### `purchase_access`

Purchase API access using credits.

```
Input:
  api_id: "46elks"
  amount_usd: 10

Output:
  - Purchase confirmation
  - API credentials (key, username/password)
  - Credits received
  - Access URLs
```

### `check_balance`

Check your credit balance and active purchases.

```
Input:
  agent_id?: "your_agent_id"

Output:
  - Current balance in USD
  - List of active purchases
  - Total spent
```

### `add_credits`

Add credits to your account (for testing).

```
Input:
  amount_usd: 50

Output:
  - New balance
```

### `list_categories`

List all available API categories.

## Available APIs (MVP)

| Provider | Category | Capabilities |
|----------|----------|--------------|
| **46elks** | communication | SMS, Voice, MMS |
| **Resend** | communication | Email, Templates |
| **Brave Search** | search | Web, News, Images |
| **OpenRouter** | ai | LLM Chat, Completions |
| **ElevenLabs** | ai | TTS, Voice Cloning |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    AI Agent                          │
└─────────────────────┬───────────────────────────────┘
                      │ MCP Protocol
┌─────────────────────▼───────────────────────────────┐
│              APIvault MCP Server                     │
├──────────────┬──────────────┬───────────────────────┤
│  Discovery   │   Credits    │   Purchase            │
│  Engine      │   System     │   Handler             │
└──────────────┴──────────────┴───────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              API Registry (JSON)                     │
│  • 5 APIs with full metadata                        │
│  • Pricing, endpoints, features                     │
└─────────────────────────────────────────────────────┘
```

## MVP Status

### ✅ Working
- [x] MCP server with 6 tools
- [x] API discovery with keyword matching
- [x] API registry with 5 providers
- [x] In-memory credit system
- [x] Mock credential generation
- [x] Purchase flow

### 🚧 Stub/Mock
- [ ] Real API key provisioning (mock credentials)
- [ ] Supabase persistence (in-memory)
- [ ] Semantic search (keyword matching)
- [ ] Real-time usage tracking
- [ ] Webhook notifications

### 🔮 Future
- [ ] Stripe Agent Toolkit integration
- [ ] Supabase for persistence
- [ ] Embeddings for semantic search
- [ ] More API providers
- [ ] Usage webhooks

## File Structure

```
api-discovery/
├── README.md
├── package.json
├── tsconfig.json
├── CONCEPT.md           # Original research
└── src/
    ├── index.ts         # MCP server entry
    ├── types.ts         # TypeScript types
    ├── discovery.ts     # Search engine
    ├── credits.ts       # Credit system
    ├── test.ts          # Test script
    └── registry/
        └── apis.json    # API definitions
```

## Development

```bash
# Watch mode
pnpm dev

# Build
pnpm build

# Test
pnpm test
```

## License

MIT - NordSym
