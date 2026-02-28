# PRD: Agent-First Onboarding & Billing

**Version:** 1.0  
**Date:** 2026-02-28  
**Author:** Symbot + Gustav  
**Status:** Draft

---

## Executive Summary

APIClaw är för agenter. Onboarding ska därför drivas av agenter, inte människor. 

Agenten registrerar sin ägare via email → magic link → workspace aktivt → autobahn.

Inga API-nycklar att kopiera. Inga dashboards att navigera. Agenten fixar allt.

---

## Problem Statement

**Idag:**
1. Människa måste skapa konto manuellt
2. Människa måste kopiera API-nyckel
3. Människa måste konfigurera agenten
4. Friktion vid varje steg

**Dessutom:**
- Direct Call kostar NordSym pengar
- Ingen revenue-modell aktiv
- Abuse-risk utan identifiering

---

## Solution Overview

### Core Concept: Agent-First Onboarding

```
Agent försöker använda APIClaw
         │
         ▼
   Inget workspace?
         │
         ▼
Agent: register_owner("email@example.com")
         │
         ▼
   Magic link skickas
         │
         ▼
   Människa klickar
         │
         ▼
   Workspace aktivt
         │
         ▼
   Agent kör fritt
```

### Billing Model: Free Tier → Pay-as-you-go

```
Tier 1: Anonymous     →  10 calls/dag (IP-limited)
Tier 2: Free Account  →  50 calls totalt
Tier 3: Paid          →  Unlimited, metered billing
```

---

## Detailed Design

### 1. Workspace Model

Ett **workspace** är:
- Kopplat till en email (ägaren)
- Kan ha flera agenter
- Har en usage-räknare
- Har en betalmetod (efter free tier)

```typescript
// Convex schema addition
workspaces: defineTable({
  email: v.string(),
  passwordHash: v.optional(v.string()),  // Optional, for dashboard login
  status: v.string(),  // "pending" | "active" | "suspended"
  tier: v.string(),  // "anonymous" | "free" | "paid"
  usageCount: v.number(),
  usageLimitReached: v.boolean(),
  stripeCustomerId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_email", ["email"])
  .index("by_stripeCustomerId", ["stripeCustomerId"]),

// Agent sessions (local token → workspace)
agentSessions: defineTable({
  workspaceId: v.id("workspaces"),
  sessionToken: v.string(),  // Stored in ~/.apiclaw/session
  fingerprint: v.string(),  // MCP client info
  lastUsedAt: v.number(),
  createdAt: v.number(),
})
  .index("by_sessionToken", ["sessionToken"])
  .index("by_workspaceId", ["workspaceId"]),

// Magic links
workspaceMagicLinks: defineTable({
  email: v.string(),
  token: v.string(),
  sessionFingerprint: v.optional(v.string()),  // Link back to requesting agent
  expiresAt: v.number(),
  usedAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_token", ["token"])
  .index("by_email", ["email"]),
```

### 2. New MCP Tools

#### `register_owner`

Agent requests workspace creation for their owner.

```typescript
{
  name: "register_owner",
  description: "Register your owner's email to create a workspace. A magic link will be sent.",
  inputSchema: {
    type: "object",
    properties: {
      email: {
        type: "string",
        description: "Owner's email address"
      }
    },
    required: ["email"]
  }
}

// Response
{
  status: "magic_link_sent",
  message: "Magic link sent to gustav@nordsym.com. Waiting for confirmation...",
  workspaceId: "pending_abc123"
}
```

#### `check_workspace_status`

Agent checks if workspace is active.

```typescript
{
  name: "check_workspace_status",
  description: "Check if your workspace is active and ready to use.",
  inputSchema: {
    type: "object",
    properties: {}
  }
}

// Response (pending)
{
  status: "pending",
  message: "Waiting for owner to click magic link.",
  email: "gus***@nordsym.com"
}

// Response (active)
{
  status: "active",
  tier: "free",
  usageRemaining: 47,
  workspaceId: "ws_abc123"
}

// Response (limit_reached)
{
  status: "limit_reached",
  message: "Free tier exhausted. Owner needs to add payment method.",
  upgradeUrl: "https://apiclaw.com/upgrade?ws=abc123"
}
```

#### `remind_owner`

Send reminder if owner hasn't clicked magic link.

```typescript
{
  name: "remind_owner",
  description: "Send a reminder email to your owner to complete registration.",
  inputSchema: {
    type: "object",
    properties: {}
  }
}

// Response
{
  status: "reminder_sent",
  message: "Reminder sent. You can send another in 10 minutes."
}
```

### 3. Session Management

#### Local Session Storage

When workspace is activated, agent receives a session token:

```
~/.apiclaw/session
{
  "sessionToken": "sess_abc123xyz",
  "workspaceId": "ws_abc123",
  "email": "gustav@nordsym.com",
  "createdAt": 1709110800000
}
```

#### Session Flow

```
Agent starts MCP server
         │
         ▼
   Read ~/.apiclaw/session
         │
    ┌────┴────┐
    │         │
  Exists    Missing
    │         │
    ▼         ▼
 Validate   Anonymous mode
 with API   (10 calls/day)
    │
  ┌─┴─┐
  │   │
Valid Invalid
  │   │
  ▼   ▼
 Use  Delete & 
      prompt for
      register_owner
```

### 4. Magic Link Flow

#### Email Template

```
Subject: Activate your APIClaw workspace

An AI agent wants to connect to your APIClaw workspace.

Click below to activate:

[Activate Workspace]

This link expires in 1 hour.

---
If you didn't expect this email, you can safely ignore it.
```

#### Click Handler (apiclaw.com/auth/verify)

```
1. Validate token (not expired, not used)
2. Check if workspace exists for email
   - Yes: Activate session, link agent
   - No: Show "Set password (optional)" form, create workspace
3. Mark magic link as used
4. Create agent session
5. Redirect to success page
6. Agent polling detects activation → continues
```

### 5. Billing Integration

#### Free Tier Exhaustion Flow

```
Agent: call_api("send_sms", {...})
         │
         ▼
   Check workspace.usageCount
         │
    ┌────┴────┐
    │         │
  < 50      >= 50
    │         │
    ▼         ▼
  Execute   Check tier
    │         │
    │    ┌────┴────┐
    │    │         │
    │  "free"    "paid"
    │    │         │
    │    ▼         ▼
    │  Block    Execute
    │    │
    │    ▼
    │  Send email to owner:
    │  "Add payment to continue"
    │    │
    │    ▼
    │  Return error to agent:
    │  {
    │    error: "usage_limit_reached",
    │    message: "Free tier exhausted",
    │    upgradeUrl: "https://..."
    │  }
```

#### Stripe Integration

```typescript
// When owner adds payment method
1. Create Stripe Customer (if not exists)
2. Attach PaymentMethod
3. Update workspace.tier = "paid"
4. Set up metered billing:
   - Stripe Price: "API Calls" (usage-based)
   - Report usage daily via Stripe Billing Meter

// Monthly invoice
- Stripe automatically generates invoice
- Sum of all usage for the period
- Charges saved payment method
```

### 6. Rate Limiting (Abuse Prevention)

| Action | Limit | Window |
|--------|-------|--------|
| `register_owner` | 3 | per hour per IP |
| `remind_owner` | 1 | per 10 minutes |
| Anonymous API calls | 10 | per day per IP |
| Free tier API calls | 50 | lifetime |
| Paid tier API calls | 1000 | per minute |

### 7. Dashboard (apiclaw.com/dashboard)

Minimal dashboard for workspace owners:

```
┌─────────────────────────────────────────────────┐
│  APIClaw Dashboard                              │
│                                                 │
│  Workspace: gustav@nordsym.com                  │
│  Tier: Free (47/50 calls remaining)             │
│                                                 │
│  [Upgrade to Paid →]                            │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Connected Agents:                              │
│  ┌─────────────────────────────────────────┐   │
│  │ Claude Desktop (MacBook Air)            │   │
│  │ Last used: 2 minutes ago                │   │
│  │ Calls: 3                     [Revoke]   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Usage This Month:                              │
│  ├── SMS (46elks): 12 calls ($0.48)            │
│  ├── Search (Brave): 31 calls ($0.00)          │
│  └── LLM (OpenRouter): 4 calls ($0.12)         │
│                                                 │
│  Total: $0.60                                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Core Onboarding (Week 1)

- [ ] Convex schema: workspaces, agentSessions, workspaceMagicLinks
- [ ] MCP tools: register_owner, check_workspace_status
- [ ] Magic link email (via Resend)
- [ ] Verify endpoint (apiclaw.com/auth/verify)
- [ ] Local session storage (~/.apiclaw/session)
- [ ] Session validation in call_api

### Phase 2: Billing (Week 2)

- [ ] Stripe Customer creation
- [ ] Payment method collection (apiclaw.com/upgrade)
- [ ] Usage tracking per workspace
- [ ] Free tier enforcement (50 calls)
- [ ] Metered billing setup
- [ ] "Limit reached" email

### Phase 3: Dashboard (Week 3)

- [ ] Dashboard UI (apiclaw.com/dashboard)
- [ ] Magic link login
- [ ] View connected agents
- [ ] Revoke agent sessions
- [ ] Usage breakdown
- [ ] Billing history

### Phase 4: Polish (Week 4)

- [ ] Rate limiting
- [ ] Reminder emails
- [ ] Error handling improvements
- [ ] Documentation update
- [ ] npm publish with new tools

---

## Success Metrics

| Metric | Target (Month 1) |
|--------|------------------|
| Workspaces created | 50 |
| Agents connected | 100 |
| Free → Paid conversion | 10% |
| Monthly revenue | $500 |

---

## Open Questions

1. **Pricing per call?**
   - Option A: Flat rate (e.g., $0.01/call regardless of provider)
   - Option B: Pass-through + margin (provider cost + 20%)
   - Recommendation: Option B for transparency

2. **Anonymous tier - keep or remove?**
   - Pro: Lower friction for testing
   - Con: Abuse vector, complicates logic
   - Recommendation: Keep, but very limited (10 calls/day)

3. **Password requirement?**
   - Current: Optional (magic link always works)
   - Alternative: Required after first login
   - Recommendation: Keep optional

---

## Appendix: Email Templates

### Magic Link Email

```
Subject: Activate your APIClaw workspace

Hi,

An AI agent wants to use APIClaw on your behalf. Click below to activate your workspace:

[Activate Workspace]

Once activated, your agent can:
• Send SMS via 46elks/Twilio
• Search the web via Brave
• Generate speech via ElevenLabs
• And 8 more providers...

Your first 50 API calls are free.

This link expires in 1 hour.

—
APIClaw
The API layer for AI agents
```

### Free Tier Exhausted Email

```
Subject: Your APIClaw free tier is exhausted

Hi,

Your AI agent has used all 50 free API calls. 

To continue, add a payment method:

[Add Payment Method]

Pay-as-you-go pricing:
• SMS: $0.04/message
• Search: Free (included)
• LLM: From $0.001/call
• Full pricing: apiclaw.com/pricing

—
APIClaw
```

### Agent Connected Email

```
Subject: New agent connected to your workspace

Hi,

A new AI agent just connected to your APIClaw workspace:

Device: Claude Desktop (MacBook Air)
Time: February 28, 2026, 10:15 AM CET

If this wasn't you, revoke access immediately:

[View Connected Agents]

—
APIClaw
```

---

*PRD created 2026-02-28 by Symbot*
