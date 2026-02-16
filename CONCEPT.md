# Agent-Native API Discovery Platform

**Vision:** The place where AI agents discover, evaluate, and purchase API access directly. No dashboard. No manual signup. Apps are dead. API-first. Agent-native.

**Research Date:** 2026-02-16
**Status:** Concept Phase

---

## Executive Summary

| Aspect | Finding |
|--------|---------|
| **Market Gap** | 🔴 Critical — No unified discover+purchase flow for agents |
| **Timing** | 🟢 Perfect — MCP exploding, agent payments just launching |
| **Competition** | 🟡 Emerging — Fragmented, no clear leader |
| **Technical Feasibility** | 🟢 High — MCP + Stripe Agent Toolkit + Crossmint exist |
| **Revenue Potential** | 🟢 High — Every agent transaction = fee opportunity |

---

## Part 1: Competitive Landscape Analysis

### 1.1 RapidAPI (Marketplace)

**What they do:**
- World's largest API marketplace (~50,000+ APIs)
- Unified billing and key management
- Discovery via search + categories

**Strengths:**
- ✅ Massive catalog
- ✅ One subscription, many APIs
- ✅ API testing in browser

**Gaps for Agent-Native:**
- ❌ **Human-centric UI** — Requires dashboard navigation
- ❌ **Manual signup** — Email verification, plan selection
- ❌ **No programmatic purchase** — Agent can't buy access autonomously
- ❌ **No semantic discovery** — Search is keyword-based, not intent-based

**Verdict:** Built for developers, not agents. The dashboard IS the product.

---

### 1.2 Merge.dev (Unified API)

**What they do:**
- Single API for multiple integrations (HRIS, ATS, CRM, etc.)
- 220+ integrations across categories
- OAuth flows for customer auth

**Strengths:**
- ✅ Unified schema across providers
- ✅ One integration = many connections
- ✅ Real-time sync

**Gaps for Agent-Native:**
- ❌ **B2B SaaS focus** — Not general-purpose APIs
- ❌ **Customer-facing** — Designed for apps to offer integrations, not agents
- ❌ **No discovery layer** — You must know what you want
- ❌ **Enterprise sales cycle** — Not self-serve for agents

**Verdict:** Solves integration hell for SaaS companies, not API discovery for agents.

---

### 1.3 Zapier MCP

**What they do:**
- 8,000+ app connections via MCP
- 30,000+ actions available
- Bridge between LLMs and services

**Strengths:**
- ✅ Massive action library
- ✅ MCP-native (AI-first)
- ✅ Already integrated with Claude, Cursor, etc.

**Gaps for Agent-Native:**
- ❌ **Workflow focus** — Actions, not raw API access
- ❌ **Pricing opacity** — 2 tasks per MCP call, complex billing
- ❌ **No API marketplace** — You get Zapier's curated actions, not raw APIs
- ❌ **Slow innovation** — AI API still in beta after 1+ year

**Verdict:** Powerful for workflows, not for raw API consumption.

---

### 1.4 MCP Directories (mcp.so, mcpmarket.com, mcpservers.org)

**What they do:**
- Community-driven MCP server catalogs
- Discovery via search + categories
- Installation instructions

**Strengths:**
- ✅ Growing rapidly (17+ registries exist)
- ✅ Open-source focus
- ✅ Easy discovery

**Gaps for Agent-Native:**
- ❌ **Human browsing required** — Not programmatic discovery
- ❌ **No purchasing** — Just links to repos
- ❌ **No quality ranking** — Curation is manual
- ❌ **No billing** — Self-host or figure it out

**Verdict:** Yellow pages for MCP, not a marketplace.

---

### 1.5 Agent Payment Infrastructure (Emerging)

**Key Players:**
| Company | Solution | Status |
|---------|----------|--------|
| **Crossmint** | Headless Checkout for AI agents | Live |
| **Stripe** | USDC payments on Base for agents | Just launched (2 days ago) |
| **Openfort** | Agent wallets for autonomous purchasing | Live |
| **Auth0** | AI agent authentication | Beta |

**The Crossmint Model:**
- User loads "credits" once
- Agent spends credits via API
- No captchas, no 2FA friction
- Crossmint is Merchant of Record
- Works with 1B+ products (Amazon, Shopify)

**What This Means:**
> The payment rails for agent commerce are being built RIGHT NOW. The missing piece is the API discovery + provisioning layer.

---

## Part 2: The Gap Analysis

### 2.1 How Agents "Buy" APIs Today

**Answer: They don't.**

Current flow:
1. Human developer signs up for API
2. Human creates API key
3. Human hardcodes key into agent
4. Agent uses API

**Problems:**
- 🚫 No dynamic API discovery
- 🚫 No runtime API acquisition
- 🚫 No cost optimization (agent can't switch providers)
- 🚫 No capability matching (agent can't say "I need SMS" and get options)

### 2.2 The Friction Points

| Friction | Current State | Agent-Native Solution |
|----------|--------------|----------------------|
| **Discovery** | Google search or asking human | Semantic query: "I need to send SMS to Sweden" |
| **Evaluation** | Read docs, try endpoints | Structured comparison: latency, price, features |
| **Signup** | Email, verify, dashboard | Instant: API call creates account |
| **Payment** | Credit card form | Delegated wallet or credits |
| **Provisioning** | Copy API key from dashboard | Return credentials in response |
| **Monitoring** | Check dashboard for usage | Webhook or pull endpoint |

### 2.3 The Whitespace

**Nobody is doing this:**
```
Agent: "I need to send 10,000 SMS messages to Swedish numbers. 
        Budget: $0.05/SMS. Delivery time: <30 seconds."

System: Returns ranked providers:
        1. 46elks (SE-native, €0.04/SMS, 2s delivery)
        2. Twilio (Global, €0.05/SMS, 5s delivery)
        3. Vonage (Global, €0.045/SMS, 8s delivery)

Agent: "Purchase access to 46elks, 10,000 SMS credits"

System: {
  "status": "activated",
  "api_key": "sk_live_xxx",
  "balance": 10000,
  "expires": null,
  "docs_url": "https://..."
}
```

**This is the opportunity.**

---

## Part 3: Concept Design

### 3.1 Discovery: How It Works

**Interface:** MCP Server + REST API

**Agent Query Types:**
1. **Capability search:** "I need to send email"
2. **Feature search:** "Email API with attachments and tracking"
3. **Constraint search:** "Email API, GDPR compliant, <$0.001/email"
4. **Similar search:** "Something like Twilio but cheaper"

**Response Format:**
```json
{
  "query": "send SMS to Swedish numbers",
  "results": [
    {
      "provider": "46elks",
      "capability": "sms.send",
      "pricing": {
        "model": "per_message",
        "price_usd": 0.04,
        "currency": "SEK",
        "minimum_purchase": null
      },
      "performance": {
        "latency_p50_ms": 200,
        "latency_p99_ms": 2000,
        "uptime_30d": 99.97
      },
      "features": ["delivery_receipts", "sender_id", "unicode"],
      "compliance": ["GDPR"],
      "integration": {
        "auth": "basic",
        "docs": "https://46elks.com/docs",
        "mcp_server": "mcp://46elks.apimarket.dev"
      },
      "rating": {
        "score": 4.8,
        "reviews": 234,
        "agent_success_rate": 0.97
      }
    }
  ]
}
```

**Ranking Factors:**
- Agent success rate (real usage data)
- Price per operation
- Latency metrics
- Feature match score
- Compliance match
- Community rating

### 3.2 Purchase: How It Works

**Pre-requisite:** Agent has delegated spending authority

**Options:**
1. **Credit Balance** — Agent's owner pre-loads credits
2. **Direct Debit** — Linked bank/card, per-transaction
3. **Crypto Wallet** — USDC on Base (Stripe just launched this)

**Purchase Flow:**
```
POST /v1/purchase
{
  "provider": "46elks",
  "product": "sms_credits",
  "quantity": 10000,
  "spending_auth": "auth_xxx" // Pre-authorized spending token
}

Response:
{
  "purchase_id": "pur_abc123",
  "status": "active",
  "credentials": {
    "type": "basic",
    "username": "u_xxx",
    "password": "p_xxx"
  },
  "balance": {
    "type": "credits",
    "remaining": 10000,
    "unit": "sms"
  },
  "cost": {
    "amount": 400.00,
    "currency": "USD"
  },
  "access": {
    "mcp_server": "mcp://46elks.apimarket.dev",
    "rest_endpoint": "https://api.46elks.com",
    "docs": "https://..."
  }
}
```

### 3.3 Usage Tracking

**Real-time Monitoring:**
```
GET /v1/usage/pur_abc123

{
  "purchase_id": "pur_abc123",
  "provider": "46elks",
  "usage": {
    "sms_sent": 4521,
    "remaining": 5479,
    "cost_incurred": 180.84
  },
  "performance": {
    "success_rate": 0.98,
    "avg_latency_ms": 215
  },
  "alerts": [
    {"type": "low_balance", "threshold": 1000, "triggered": false}
  ]
}
```

**Webhooks:**
- `usage.threshold` — Balance running low
- `usage.depleted` — Credits exhausted
- `provider.degraded` — Performance issues
- `provider.outage` — Service down

### 3.4 Revenue Model

**Three Revenue Streams:**

| Stream | Model | Example |
|--------|-------|---------|
| **Transaction Fee** | % of purchase | 5% on $400 purchase = $20 |
| **Spread** | Buy wholesale, sell retail | Buy SMS at $0.035, sell at $0.04 |
| **Premium Features** | Subscription | $99/mo for advanced analytics, SLA |

**Hybrid Approach (Recommended):**
- Free tier: Discovery + basic purchase (5% fee)
- Pro tier ($99/mo): Lower fees (2%), priority support, advanced analytics
- Enterprise: Volume discounts, custom integrations, SLA

**Unit Economics (Conservative):**
- Average transaction: $100
- Take rate: 5%
- Gross revenue per tx: $5
- 1000 agents × 10 tx/month = $50,000 MRR

---

## Part 4: MVP Specification

### 4.1 Minimum Viable Product

**Scope:** 10 high-value APIs, single MCP server, credit-based purchasing

**Core Features:**
1. ✅ MCP-native discovery endpoint
2. ✅ Semantic search (via embeddings)
3. ✅ Credit purchase + instant provisioning
4. ✅ Usage tracking API
5. ✅ Basic webhook notifications

**NOT in MVP:**
- ❌ Direct billing (use credits)
- ❌ Enterprise features
- ❌ Custom integrations
- ❌ Mobile app/dashboard (agent-first!)

### 4.2 Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **MCP Server** | TypeScript + MCP SDK | Standard, fast iteration |
| **API** | Hono on Cloudflare Workers | Edge-native, fast |
| **Database** | Supabase (Postgres) | Quick setup, real-time |
| **Search** | Supabase pgvector | Semantic search, no extra service |
| **Payments** | Stripe Agent Toolkit | Native MCP support |
| **Auth** | Clerk or custom JWT | Simple agent identity |
| **Queue** | Inngest | Background jobs, webhooks |
| **Monitoring** | Axiom | Log aggregation |

**Architecture:**
```
Agent → MCP Server → API Gateway → Provider Adapters
                         ↓
                    Supabase (state)
                         ↓
                    Stripe (billing)
```

### 4.3 First 10 APIs to Integrate

**Selection Criteria:**
- High agent utility
- Clear pricing
- Good API documentation
- Programmatic key provisioning (or workaround)

| # | Category | Provider | Why |
|---|----------|----------|-----|
| 1 | **SMS** | 46elks | Swedish, simple, good pricing |
| 2 | **SMS** | Twilio | Global standard |
| 3 | **Email** | Resend | Developer-friendly, modern |
| 4 | **Email** | Postmark | Transactional focus |
| 5 | **Search** | Brave Search | Privacy-first, good API |
| 6 | **AI/LLM** | OpenRouter | Multi-model gateway |
| 7 | **Storage** | Cloudflare R2 | S3-compatible, cheap |
| 8 | **Database** | Supabase | Instant Postgres |
| 9 | **Payments** | Stripe | Essential for commerce |
| 10 | **Voice** | ElevenLabs | TTS, high demand |

### 4.4 Launch Strategy

**Phase 1: Private Alpha (Week 1-4)**
- Build MVP with 5 APIs
- 10 hand-picked power users
- Iterate on UX and pricing

**Phase 2: Public Beta (Week 5-8)**
- Launch on MCP registries (mcp.so, mcpmarket.com)
- Twitter/X launch thread
- Target AI agent builders (Claude Code users, AutoGPT, CrewAI)

**Phase 3: Growth (Month 3+)**
- API provider outreach (become their agent channel)
- Integration with major agent frameworks
- Community-contributed providers

**Distribution Channels:**
1. MCP registries (organic discovery)
2. AI agent framework docs (CrewAI, LangChain, etc.)
3. Developer Twitter/X
4. Hacker News launch
5. ProductHunt

---

## Part 5: Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **API providers don't allow resale** | High | Start with affiliate model, prove value |
| **Payment fraud** | Medium | Spending limits, verification tiers |
| **Agent abuse** | Medium | Rate limits, reputation system |
| **No demand** | Medium | Validate with 10 agents before building |
| **Big player enters** | Low | Move fast, own the niche |

---

## Part 6: Success Metrics

**North Star:** Monthly Active Agents (MAA)

**Leading Indicators:**
- Discovery queries per day
- Purchase conversion rate
- Average spend per agent
- Provider NPS

**Targets (Month 6):**
- 500 MAA
- $25,000 MRR
- 25 integrated APIs
- 95% agent success rate

---

## Appendix: Raw Research Notes

### Agent Payment Infrastructure Headlines (Feb 2026)

> "An Openclaw software agent autonomously provisioned a virtual private server, funded it with bitcoin via the Lightning Network, and purchased AI API credits — all without a human clicking 'confirm.'"
> — CoinSpectator, Feb 13, 2026

> "Stripe has launched USDC payment system for AI agents on Base blockchain... agents could purchase datasets, compute resources, or other digital inputs without human authorization"
> — FinanceFeeds, Feb 13, 2026

### Key Insight

The infrastructure for autonomous agent commerce is being built RIGHT NOW:
- Stripe: USDC agent payments (2 days old)
- Crossmint: Headless checkout for agents
- Openfort: Agent wallets
- Auth0: AI agent authentication

**The missing piece is the marketplace layer that sits on top.**

---

## Next Steps

1. [ ] Validate demand with 5 AI agent builders
2. [ ] Prototype MCP server with 3 APIs
3. [ ] Test Stripe Agent Toolkit integration
4. [ ] Design credit/wallet system
5. [ ] Build landing page (agent-native pitch)

---

*Research compiled by Symbot | 2026-02-16*
