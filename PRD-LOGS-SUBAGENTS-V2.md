# PRD: Logs & Subagents Enhancement v2

**Date:** 2026-03-03
**Status:** Ready for implementation

---

## Overview

Förbättra Logs-vyn med tydliga typer och gör Subagents read-only med click-to-expand.

---

## 1. Logs Enhancement

### 1.1 Type Column

Lägg till Type som första kolumn. Använd Lucide ikoner (INGA emojis).

| Type | Icon | Description |
|------|------|-------------|
| Search | `<Search />` | discover_apis sökning |
| Direct Call | `<Zap />` | API execution |
| Chain | `<Link />` | Del av chain execution |
| API Found | `<Eye />` | Ditt API dök upp i någons sökning |

### 1.2 Table Structure

```
┌──────────────┬────────────┬─────────────────────┬──────────┬─────────┐
│ Type         │ Time       │ Details             │ Status   │ Latency │
├──────────────┼────────────┼─────────────────────┼──────────┼─────────┤
│ [Search]     │ 2 min ago  │ "sms api sweden"    │ 3 results│ 78ms    │
│ [Direct Call]│ 5 min ago  │ 46elks.send_sms     │ Success  │ 234ms   │
│ [Chain]      │ 8 min ago  │ my-chain step 2/4   │ Success  │ 1.2s    │
│ [API Found]  │ 12 min ago │ Your API in search  │ —        │ —       │
└──────────────┴────────────┴─────────────────────┴──────────┴─────────┘
```

### 1.3 Type Badges

Style för varje typ:

```tsx
const typeBadges = {
  search: {
    icon: Search,
    label: "Search",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  },
  direct_call: {
    icon: Zap,
    label: "Direct Call",
    className: "bg-green-500/10 text-green-500 border-green-500/20"
  },
  chain: {
    icon: Link,
    label: "Chain",
    className: "bg-purple-500/10 text-purple-500 border-purple-500/20"
  },
  api_found: {
    icon: Eye,
    label: "API Found",
    className: "bg-orange-500/10 text-orange-500 border-orange-500/20"
  }
};
```

### 1.4 Data Sources

Logs hämtas från två källor och mergas:

1. **searchLogs** → type: "search"
2. **apiLogs** → type: "direct_call" eller "chain" (baserat på chainId field)

Sortera på timestamp, nyast först.

### 1.5 Remove Emojis

Ersätt ALLA emojis i Logs-komponenten med Lucide icons:
- 🔍 → `<Search className="w-4 h-4" />`
- 📞 → `<Phone className="w-4 h-4" />` (eller Zap)
- Etc.

---

## 2. Subagents Read-Only

### 2.1 Remove Edit Button

Ta bort "Edit" knappen från subagent cards.

### 2.2 Click-to-Expand

Klicka på subagent card → expandera inline ELLER öppna modal med detaljer:

```
┌─────────────────────────────────────────────────────────────────┐
│ APIClaw Test Agent                                              │
│ ID: apiclaw-test-agent                                          │
├─────────────────────────────────────────────────────────────────┤
│ AI Backend: Claude 3.5 Sonnet                                   │
│ First Seen: 2026-03-03 17:32                                    │
│ Last Active: 12 min ago                                         │
│ Total Calls: 2                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Recent Activity                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Direct Call │ deepgram.transcribe      │ Success │ 890ms   │ │
│ │ Direct Call │ replicate.whisper        │ Success │ 3200ms  │ │
│ │ Search      │ "transcription audio"    │ 2 hits  │ 112ms   │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Subagent Card (collapsed)

```tsx
<div className="cursor-pointer hover:bg-white/5" onClick={() => setExpanded(!expanded)}>
  <div className="flex items-center justify-between">
    <div>
      <p className="font-medium">{subagent.name || subagent.subagentId}</p>
      <p className="text-sm text-muted">
        Calls: {subagent.callCount} • Last: {timeAgo(subagent.lastActiveAt)}
      </p>
      {subagent.aiBackend && (
        <p className="text-sm text-muted">AI Backend: {subagent.aiBackend}</p>
      )}
    </div>
    <ChevronDown className={cn("w-5 h-5 transition-transform", expanded && "rotate-180")} />
  </div>
  
  {expanded && (
    <div className="mt-4 pt-4 border-t border-white/10">
      {/* Recent activity for this subagent */}
      <SubagentActivityLog subagentId={subagent.subagentId} />
    </div>
  )}
</div>
```

### 2.4 Fetch Subagent Activity

Ny query behövs:

```typescript
// convex/logs.ts
export const getBySubagent = query({
  args: {
    token: v.string(),
    subagentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { token, subagentId, limit = 20 }) => {
    // Verify session
    const session = await ctx.db
      .query("agentSessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", token))
      .first();
    
    if (!session) return null;
    
    // Get API logs for this subagent
    const apiLogs = await ctx.db
      .query("apiLogs")
      .withIndex("by_subagentId", (q) => q.eq("subagentId", subagentId))
      .order("desc")
      .take(limit);
    
    // Get search logs for this subagent
    const searchLogs = await ctx.db
      .query("searchLogs")
      .filter((q) => q.eq(q.field("subagentId"), subagentId))
      .order("desc")
      .take(limit);
    
    // Merge and sort
    const combined = [
      ...apiLogs.map(l => ({ ...l, type: "direct_call" as const })),
      ...searchLogs.map(l => ({ ...l, type: "search" as const })),
    ].sort((a, b) => b.createdAt - a.createdAt);
    
    return combined.slice(0, limit);
  },
});
```

---

## 3. API Found Tracking (Future)

### 3.1 Koncept

När någon söker och DITT API dyker upp i resultaten → logga det.

### 3.2 Implementation (senare)

Detta kräver att vi trackar på provider-sidan:
1. Sökning kommer in
2. Resultat returneras (inkl. provider X)
3. Logga "API Found" för provider X

**Scope:** Inte i denna iteration. Markera som "Coming Soon" eller skippa helt.

---

## 4. Files to Modify

### 4.1 Convex Backend

| File | Changes |
|------|---------|
| `convex/logs.ts` | Add `getBySubagent` query |
| `convex/schema.ts` | Add `type` field to apiLogs (optional, kan infer från data) |

### 4.2 Landing/UI

| File | Changes |
|------|---------|
| `landing/src/app/workspace/page.tsx` | Update Logs table, Subagents section |

---

## 5. Implementation Order

### Agent 1: Backend
1. Add `logs:getBySubagent` query

### Agent 2: Logs UI
1. Add Type column to logs table
2. Replace emojis with Lucide icons
3. Style type badges
4. Ensure merged data (search + api logs) shows correctly

### Agent 3: Subagents UI
1. Remove Edit button
2. Add click-to-expand functionality
3. Show subagent activity when expanded
4. Add ChevronDown icon for expand indicator

---

## 6. Verification

```bash
cd ~/Projects/apiclaw
npx convex deploy --yes

cd ~/Projects/apiclaw/landing
npm run build
npx vercel --prod --yes
```

Test:
1. Logs visar Type-kolumn med ikoner (inga emojis)
2. Kan filtrera/se olika typer
3. Subagents har ingen Edit-knapp
4. Klick på subagent expanderar och visar activity

---

## 7. Design Notes

- **Inga emojis** — endast Lucide icons
- **Konsistent färgschema** — använd APIClaw's röda accent (#ef4444) för primary actions
- **Type badges** — subtila, färgkodade, med ikon + text
- **Expand animation** — smooth rotate på chevron, fade-in på content
