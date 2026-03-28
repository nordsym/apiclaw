---
nord_type: BLUEPRINT
nord_owner: APIClaw
nord_status: LIVE
---

# APIClaw PRD — Analytics, Agents & Teams

**Datum:** 2026-03-03  
**Status:** Ready for Implementation  
**Författare:** Gustav + Symbot

---

## Executive Summary

Tre förbättringsområden:

1. **Search Analytics** — Sökningar kopplade till workspace + dashboard
2. **Agent Model** — Tydlig modell för agents + AI backend tracking
3. **Teams** — Invite members, roles, shared workspace

---

## 1. Search Analytics

### 1.1 Schema

**Ny tabell: `searchLogs`**

```typescript
searchLogs: defineTable({
  workspaceId: v.id("workspaces"),
  subagentId: v.optional(v.string()),
  query: v.string(),
  resultCount: v.number(),
  hasResults: v.boolean(),
  matchedProviders: v.optional(v.array(v.string())),
  responseTimeMs: v.number(),
  timestamp: v.number(),
})
  .index("by_workspaceId", ["workspaceId"])
  .index("by_timestamp", ["timestamp"])
  .index("by_hasResults", ["hasResults"])
  .index("by_workspaceId_timestamp", ["workspaceId", "timestamp"])
```

### 1.2 Backend Functions

**convex/searchLogs.ts**

```typescript
// Log a search (called from MCP server)
export const log = mutation({
  args: {
    sessionToken: v.string(),
    subagentId: v.optional(v.string()),
    query: v.string(),
    resultCount: v.number(),
    matchedProviders: v.optional(v.array(v.string())),
    responseTimeMs: v.number(),
  },
  handler: async (ctx, args) => {
    // Get workspace from session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", q => q.eq("sessionToken", args.sessionToken))
      .first();
    
    if (!session) return null;
    
    return await ctx.db.insert("searchLogs", {
      workspaceId: session.workspaceId,
      subagentId: args.subagentId,
      query: args.query,
      resultCount: args.resultCount,
      hasResults: args.resultCount > 0,
      matchedProviders: args.matchedProviders,
      responseTimeMs: args.responseTimeMs,
      timestamp: Date.now(),
    });
  },
});

// Get search stats for workspace
export const getStats = query({
  args: { 
    token: v.string(),
    hoursBack: v.optional(v.number()),
  },
  handler: async (ctx, { token, hoursBack = 24 }) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", q => q.eq("sessionToken", token))
      .first();
    
    if (!session) return null;
    
    const since = Date.now() - hoursBack * 3600000;
    
    const logs = await ctx.db
      .query("searchLogs")
      .withIndex("by_workspaceId_timestamp", q => 
        q.eq("workspaceId", session.workspaceId).gte("timestamp", since)
      )
      .collect();
    
    // Aggregate
    const totalSearches = logs.length;
    const zeroResults = logs.filter(l => !l.hasResults).length;
    const avgResponseTime = logs.reduce((a, l) => a + l.responseTimeMs, 0) / logs.length || 0;
    
    // Top queries
    const queryCounts: Record<string, number> = {};
    for (const log of logs) {
      queryCounts[log.query] = (queryCounts[log.query] || 0) + 1;
    }
    const topQueries = Object.entries(queryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([query, count]) => ({ query, count }));
    
    // Zero-result queries (gold data)
    const zeroResultQueries = logs
      .filter(l => !l.hasResults)
      .reduce((acc, l) => {
        acc[l.query] = (acc[l.query] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    const topZeroResults = Object.entries(zeroResultQueries)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([query, count]) => ({ query, count }));
    
    // By subagent
    const bySubagent: Record<string, number> = {};
    for (const log of logs) {
      const key = log.subagentId || "primary";
      bySubagent[key] = (bySubagent[key] || 0) + 1;
    }
    
    return {
      totalSearches,
      zeroResults,
      zeroResultRate: totalSearches > 0 ? zeroResults / totalSearches : 0,
      avgResponseTime: Math.round(avgResponseTime),
      topQueries,
      topZeroResults,
      bySubagent,
    };
  },
});

// Get recent searches
export const getRecent = query({
  args: { 
    token: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { token, limit = 50 }) => {
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", q => q.eq("sessionToken", token))
      .first();
    
    if (!session) return [];
    
    return await ctx.db
      .query("searchLogs")
      .withIndex("by_workspaceId_timestamp", q => 
        q.eq("workspaceId", session.workspaceId)
      )
      .order("desc")
      .take(limit);
  },
});
```

### 1.3 MCP Server Update

**src/index.ts** — Update search handler to log:

```typescript
// In search tool handler
const startTime = Date.now();
const results = await searchAPIs(query);
const responseTimeMs = Date.now() - startTime;

// Log to Convex (fire and forget)
if (sessionToken) {
  fetch(CONVEX_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'searchLogs:log',
      args: {
        sessionToken,
        subagentId: headers['x-apiclaw-subagent'],
        query,
        resultCount: results.length,
        matchedProviders: results.map(r => r.provider),
        responseTimeMs,
      },
    }),
  }).catch(() => {});
}
```

### 1.4 Dashboard UI

**Ny subtab under Analytics: "Search"**

```
Analytics
├── Overview
├── Usage
├── Logs
├── Chains
└── Search (NY)
```

**Search subtab innehåller:**

1. **Stats Cards**
   - Total Searches (24h)
   - Zero-Result Rate (%)
   - Avg Response Time (ms)

2. **Top Queries** (tabell)
   - Query | Count | Avg Results

3. **Zero-Result Queries** (highlight, röd bakgrund)
   - Query | Count | "Request API" button

4. **Search by Agent** (pie chart)
   - Primary Agent: 65%
   - research-agent: 25%
   - content-writer: 10%

5. **Recent Searches** (live feed)
   - Timestamp | Agent | Query | Results

---

## 2. Agent Model

### 2.1 Schema Updates

**Uppdatera `workspaces` tabell:**

```typescript
// Lägg till i workspaces schema
aiBackend: v.optional(v.string()),        // "claude-3-opus", "gpt-4", etc.
aiBackendLastSeen: v.optional(v.number()),
```

**Uppdatera `subagents` tabell:**

```typescript
// Lägg till i subagents schema
aiBackend: v.optional(v.string()),
description: v.optional(v.string()),      // User-provided description
isRegistered: v.optional(v.boolean()),    // true if pre-registered (not implicit)
```

### 2.2 New Header Support

**X-APIClaw-AI-Backend**

```typescript
// MCP server extracts and stores
const aiBackend = headers['x-apiclaw-ai-backend']; // "claude-3-opus"

// Update workspace or subagent with AI backend info
if (aiBackend) {
  await updateAIBackend(workspaceId, subagentId, aiBackend);
}
```

### 2.3 Agent Registration

**convex/agents.ts** — Add pre-registration:

```typescript
export const registerTaskAgent = mutation({
  args: {
    token: v.string(),
    subagentId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await getSession(ctx, args.token);
    if (!session) throw new Error("Invalid session");
    
    // Check if already exists
    const existing = await ctx.db
      .query("subagents")
      .withIndex("by_workspaceId_subagentId", q => 
        q.eq("workspaceId", session.workspaceId).eq("subagentId", args.subagentId)
      )
      .first();
    
    if (existing) {
      // Update
      return await ctx.db.patch(existing._id, {
        name: args.name || existing.name,
        description: args.description || existing.description,
        isRegistered: true,
      });
    }
    
    // Create new
    return await ctx.db.insert("subagents", {
      workspaceId: session.workspaceId,
      subagentId: args.subagentId,
      name: args.name,
      description: args.description,
      callCount: 0,
      isRegistered: true,
      firstSeenAt: Date.now(),
      lastActiveAt: Date.now(),
    });
  },
});
```

### 2.4 My Agents UI Enhancement

```
My Agents
│
├── Primary Agent
│   ┌─────────────────────────────────────┐
│   │ 🤖 Symbot                    [Edit] │
│   │ ID: abc123-def456                   │
│   │ AI: Claude 3 Opus                   │
│   │ Calls: 4,521 | Last: 2 min ago      │
│   └─────────────────────────────────────┘
│
├── Task Agents (3)
│   ┌─────────────────────────────────────┐
│   │ 📋 research-agent           [Edit]  │
│   │ "Researches topics and competitors" │
│   │ AI: Claude 3.5 Sonnet               │
│   │ Calls: 156 | Last: 1 hour ago       │
│   └─────────────────────────────────────┘
│   ┌─────────────────────────────────────┐
│   │ ✍️ content-writer            [Edit]  │
│   │ AI: GPT-4                           │
│   │ Calls: 89 | Last: 3 hours ago       │
│   └─────────────────────────────────────┘
│
└── [+ Register New Agent]
```

---

## 3. Teams

### 3.1 Schema

**Ny tabell: `workspaceMembers`**

```typescript
workspaceMembers: defineTable({
  workspaceId: v.id("workspaces"),
  email: v.string(),
  role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  invitedBy: v.optional(v.string()),  // email of inviter
  inviteToken: v.optional(v.string()),
  status: v.union(v.literal("pending"), v.literal("active"), v.literal("revoked")),
  createdAt: v.number(),
  acceptedAt: v.optional(v.number()),
})
  .index("by_workspaceId", ["workspaceId"])
  .index("by_email", ["email"])
  .index("by_inviteToken", ["inviteToken"])
  .index("by_workspaceId_email", ["workspaceId", "email"])
```

### 3.2 Backend Functions

**convex/teams.ts**

```typescript
// Get team members
export const getMembers = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await getSession(ctx, token);
    if (!session) return [];
    
    const workspace = await ctx.db.get(session.workspaceId);
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspaceId", q => q.eq("workspaceId", session.workspaceId))
      .collect();
    
    // Add owner as first member
    return [
      {
        email: workspace.email,
        role: "owner" as const,
        status: "active" as const,
        isOwner: true,
      },
      ...members.map(m => ({
        ...m,
        isOwner: false,
      })),
    ];
  },
});

// Invite member (creates pending invite)
export const inviteMember = mutation({
  args: {
    token: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, { token, email, role }) => {
    const session = await getSession(ctx, token);
    if (!session) throw new Error("Invalid session");
    
    const workspace = await ctx.db.get(session.workspaceId);
    
    // Check if already member
    const existing = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspaceId_email", q => 
        q.eq("workspaceId", session.workspaceId).eq("email", email)
      )
      .first();
    
    if (existing) throw new Error("Already a member");
    
    // Generate invite token
    const inviteToken = generateToken();
    
    return await ctx.db.insert("workspaceMembers", {
      workspaceId: session.workspaceId,
      email,
      role,
      invitedBy: workspace.email,
      inviteToken,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Accept invite
export const acceptInvite = mutation({
  args: { inviteToken: v.string() },
  handler: async (ctx, { inviteToken }) => {
    const member = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_inviteToken", q => q.eq("inviteToken", inviteToken))
      .first();
    
    if (!member) throw new Error("Invalid invite");
    if (member.status !== "pending") throw new Error("Invite already used");
    
    return await ctx.db.patch(member._id, {
      status: "active",
      acceptedAt: Date.now(),
      inviteToken: undefined, // Clear token
    });
  },
});

// Remove member
export const removeMember = mutation({
  args: {
    token: v.string(),
    memberEmail: v.string(),
  },
  handler: async (ctx, { token, memberEmail }) => {
    const session = await getSession(ctx, token);
    if (!session) throw new Error("Invalid session");
    
    const workspace = await ctx.db.get(session.workspaceId);
    if (workspace.email === memberEmail) {
      throw new Error("Cannot remove owner");
    }
    
    const member = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspaceId_email", q => 
        q.eq("workspaceId", session.workspaceId).eq("email", memberEmail)
      )
      .first();
    
    if (!member) throw new Error("Member not found");
    
    return await ctx.db.patch(member._id, {
      status: "revoked",
    });
  },
});
```

### 3.3 Teams UI

**Settings → Team (ny sektion)**

```
┌─────────────────────────────────────────────────────┐
│ Team Members                                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  👑 gustav@nordsym.com              Owner           │
│     ─────────────────────────────────────────       │
│  👤 molle@nordsym.com               Admin   [...]   │
│     Invited • Pending                               │
│     ─────────────────────────────────────────       │
│  👤 peter@cleanbuddy.se             Member  [...]   │
│     Active since Mar 1                              │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [+ Invite Team Member]          🔒 Coming Soon     │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Team invites launching soon!                │   │
│  │ Get notified when it's ready.               │   │
│  │                                             │   │
│  │ [Notify Me]                                 │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**"Coming Soon" implementation:**
- UI är byggd och funktionell
- Invite-knappen visar "Coming Soon" modal istället för invite flow
- Backend finns redo att aktivera

---

## 4. Symbot Godmode Setup

### Steg för att sätta Symbot i godmode på APIClaw:

#### 4.1 Verifiera workspace

```bash
# Kolla att Symbot är kopplad till ditt workspace
curl -s "https://agile-crane-840.convex.cloud/api/query" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "agents:getMainAgent",
    "args": {"token": "<SESSION_TOKEN>"}
  }'
```

**Förväntat svar:**
```json
{
  "workspaceId": "...",
  "email": "gustav@nordsym.com",
  "mainAgentId": "uuid-xxx",
  "mainAgentName": "Symbot"
}
```

#### 4.2 Sätt namn till "Symbot"

```bash
curl -s "https://agile-crane-840.convex.cloud/api/mutation" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "agents:renameMainAgent",
    "args": {"token": "<SESSION_TOKEN>", "name": "Symbot"}
  }'
```

#### 4.3 Headers som Symbot ska skicka

När Symbot gör APIClaw-anrop, inkludera:

```
X-APIClaw-Session: <SESSION_TOKEN>
X-APIClaw-AI-Backend: claude-3-opus
X-APIClaw-Subagent: <optional, om subagent>
```

#### 4.4 Verifiera i Dashboard

1. Gå till https://apiclaw.com/workspace?tab=my-agents
2. Se att "Symbot" visas som Primary Agent
3. Se att AI Backend visar "Claude 3 Opus"

#### 4.5 Clawdbot Config

I `~/.clawdbot/clawdbot.json`, säkerställ APIClaw headers:

```json
{
  "apiclaw": {
    "sessionToken": "<APICLAW_SESSION_TOKEN>",
    "aiBackend": "claude-3-opus"
  }
}
```

---

## 5. Agent Breakdown for Implementation

### Agent 1: Schema + Backend Core

**Filer:**
- `convex/schema.ts` — Lägg till `searchLogs`, `workspaceMembers`, uppdatera `workspaces` och `subagents`
- `convex/searchLogs.ts` — CRUD + stats
- `convex/teams.ts` — Invite flow

**Verifiering:**
- `npx convex dev --once` kompilerar
- Alla nya queries/mutations fungerar

---

### Agent 2: MCP Server Updates

**Filer:**
- `src/index.ts` — Lägg till search logging
- `src/headers.ts` — Extrahera X-APIClaw-AI-Backend
- `src/tracking.ts` — Uppdatera AI backend på workspace/subagent

**Verifiering:**
- Sökningar loggas till `searchLogs`
- AI backend sparas korrekt

---

### Agent 3: Analytics Search UI

**Filer:**
- `landing/src/app/workspace/page.tsx` — Lägg till Search subtab
- `landing/src/components/SearchAnalytics.tsx` — Stats, top queries, zero-results

**Verifiering:**
- Search-tab synlig under Analytics
- Visar korrekt data från `searchLogs`

---

### Agent 4: My Agents Enhancement

**Filer:**
- `landing/src/app/workspace/page.tsx` — Uppdatera My Agents sektion
- `landing/src/components/AgentCard.tsx` — Ny komponent för agent display
- `landing/src/components/RegisterAgentModal.tsx` — Modal för pre-registration

**Verifiering:**
- Primary Agent visar namn + AI backend
- Task Agents listar med description
- "Register New Agent" fungerar

---

### Agent 5: Teams UI

**Filer:**
- `landing/src/app/workspace/page.tsx` — Lägg till Team sektion i Settings
- `landing/src/components/TeamMembers.tsx` — Lista members
- `landing/src/components/InviteModal.tsx` — Invite modal (med Coming Soon state)

**Verifiering:**
- Team-sektion visas i Settings
- Owner visas
- "Coming Soon" visas vid invite-klick

---

## 6. File Changes Summary

### Convex (Backend)

| Fil | Action | Beskrivning |
|-----|--------|-------------|
| `schema.ts` | EDIT | Lägg till `searchLogs`, `workspaceMembers`, uppdatera existing |
| `searchLogs.ts` | CREATE | log, getStats, getRecent |
| `teams.ts` | CREATE | getMembers, inviteMember, acceptInvite, removeMember |
| `agents.ts` | EDIT | Lägg till registerTaskAgent, updateAIBackend |

### MCP Server (src/)

| Fil | Action | Beskrivning |
|-----|--------|-------------|
| `index.ts` | EDIT | Lägg till search logging, AI backend header |
| `headers.ts` | CREATE | Header extraction utilities |

### Landing (Dashboard)

| Fil | Action | Beskrivning |
|-----|--------|-------------|
| `workspace/page.tsx` | EDIT | Search subtab, Teams section, My Agents update |
| `components/SearchAnalytics.tsx` | CREATE | Search analytics component |
| `components/AgentCard.tsx` | CREATE | Agent display card |
| `components/RegisterAgentModal.tsx` | CREATE | Agent registration |
| `components/TeamMembers.tsx` | CREATE | Team list |
| `components/InviteModal.tsx` | CREATE | Invite with Coming Soon |

---

## 7. Deployment

1. Deploy Convex schema först (`npx convex deploy`)
2. Deploy MCP server (`npm run build && npm publish`)
3. Deploy Landing (`vercel --prod`)

---

*Ready for implementation. Spawn agents when approved.*

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
