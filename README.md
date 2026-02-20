# APIClaw

**Agent-native API discovery and purchasing via MCP.**

> The place where AI agents discover, evaluate, and purchase API access directly. No dashboard. No manual signup. Agent-first.

## What is this?

APIClaw is an MCP server that lets AI agents:
1. **Discover** APIs based on capabilities ("I need to send SMS")
2. **Evaluate** pricing, features, and success rates
3. **Purchase** access and receive **real credentials** instantly
4. **Track** usage and balance

## 🚀 Connected Tier (v0.2.0)

The Connected tier provides **production-ready** infrastructure:

### ✅ Real Credentials
- **46elks** — Swedish SMS/Voice provider (real API keys)
- **Twilio** — Global SMS/Voice (real Account SID + Auth Token)

### ✅ Persistent Credits (Convex)
- Credits stored in Convex database
- Survives restarts
- Multi-agent support

### ✅ Stripe Integration
- Three credit packages:
  - **Starter:** $10 → 100 credits
  - **Growth:** $50 → 550 credits (10% bonus)
  - **Scale:** $100 → 1,200 credits (20% bonus)
- Webhook endpoint for automatic credit grants

## Quick Start

### 1. Install dependencies

```bash
cd ~/Projects/apiclaw
npm install
```

### 2. Configure credentials

Copy your API credentials:

```bash
# Create .env.local with:
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
ELKS_API_USER=xxx
ELKS_API_PASSWORD=xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
```

Or use credentials from `~/.secrets/`:
- `~/.secrets/46elks.env`
- `~/.secrets/twilio.env`

### 3. Run tests

```bash
npm test
```

### 4. Add to Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "apiclaw": {
      "command": "node",
      "args": ["/Users/gustavhemmingsson/Projects/apiclaw/dist/index.js"]
    }
  }
}
```

### 5. Start webhook server (for Stripe)

```bash
npm run webhook
```

## MCP Tools

### `discover_apis`

Search for APIs by describing what you need.

```json
{
  "query": "send SMS to Swedish numbers",
  "category": "communication",
  "max_results": 5,
  "region": "SE"
}
```

### `purchase_access`

Purchase API access using credits. **Returns real credentials for 46elks and Twilio!**

```json
{
  "api_id": "46elks",
  "amount_usd": 10
}
```

Response includes:
- `credentials.username` — Real 46elks API user
- `credentials.password` — Real 46elks API password
- `real_credentials: true` — Confirms these are production credentials

### `check_balance`

Check your credit balance and see which providers have real credentials.

```json
{
  "agent_id": "my_agent"
}
```

Response includes:
- `real_credential_providers: ["46elks", "twilio"]`
- `active_purchases` with `real_credentials` flag per purchase

### `add_credits`

Add credits (for testing/development).

```json
{
  "amount_usd": 50
}
```

### `list_categories`

List available API categories.

## Credit Packages

| Package | Price | Credits | Bonus |
|---------|-------|---------|-------|
| Starter | $10 | 100 | — |
| Growth | $50 | 550 | 10% |
| Scale | $100 | 1,200 | 20% |

Purchase via Stripe Checkout or Payment Intent.

## API Providers

| Provider | Category | Real Credentials | Credits/$ |
|----------|----------|-----------------|-----------|
| **46elks** | SMS/Voice | ✅ Yes | 30 |
| **Twilio** | SMS/Voice | ✅ Yes | 25 |
| **Resend** | Email | Mock | 1000 |
| **Brave Search** | Search | Mock | 200 |
| **OpenRouter** | AI/LLM | Mock | 100 |
| **ElevenLabs** | TTS | Mock | 3333 |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    AI Agent                          │
└─────────────────────┬───────────────────────────────┘
                      │ MCP Protocol
┌─────────────────────▼───────────────────────────────┐
│              APIClaw MCP Server                      │
├──────────────┬──────────────┬───────────────────────┤
│  Discovery   │   Credits    │   Credentials         │
│  Engine      │   (Convex)   │   (Real + Mock)       │
└──────────────┴──────────────┴───────────────────────┘
         │              │               │
         ▼              ▼               ▼
┌──────────────┐ ┌────────────┐ ┌─────────────────────┐
│ API Registry │ │   Convex   │ │ ~/.secrets/         │
│   (JSON)     │ │  Database  │ │ 46elks.env          │
│              │ │            │ │ twilio.env          │
└──────────────┘ └────────────┘ └─────────────────────┘
                      │
                      ▼
              ┌────────────┐
              │   Stripe   │
              │  Payments  │
              └────────────┘
```

## File Structure

```
apiclaw/
├── README.md
├── package.json
├── convex.json
├── .env.local            # Local credentials
├── convex/
│   ├── schema.ts         # Database schema
│   ├── credits.ts        # Credit mutations/queries
│   └── purchases.ts      # Purchase mutations/queries
└── src/
    ├── index.ts          # MCP server
    ├── types.ts          # TypeScript types
    ├── discovery.ts      # Search engine
    ├── credits.ts        # Credit system (in-memory + Convex)
    ├── credentials.ts    # Real credential providers
    ├── stripe.ts         # Stripe integration
    ├── webhook.ts        # Webhook server
    ├── test.ts           # E2E tests
    └── registry/
        └── apis.json     # API definitions
```

## Development

```bash
# Run tests
npm test

# Start MCP server (stdio)
npm start

# Watch mode
npm run dev

# Start webhook server
npm run webhook

# Deploy Convex
npm run convex:deploy
```

## Convex Deployment

```bash
# First time setup
npx convex dev --once --configure=new

# Deploy to production
npx convex deploy --yes
```

## Test Results

```
✅ Real credentials available for: 46elks, twilio
✅ Agent can add credits
✅ Agent can purchase API access
✅ Real 46elks/Twilio credentials returned when available
✅ Insufficient balance check works
✅ Stripe integration working
```

## Status

### ✅ Connected Tier (v0.2.0)
- [x] Real credentials for 46elks
- [x] Real credentials for Twilio
- [x] Convex schema for persistence
- [x] Stripe credit packages
- [x] Stripe webhook handler
- [x] E2E tests passing

### 🚧 TODO
- [ ] Deploy Convex to production
- [ ] Convex backend integration (currently in-memory)
- [ ] More real credential providers
- [ ] Usage tracking via Convex
- [ ] Webhook notifications

## License

MIT - NordSym
