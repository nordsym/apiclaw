# APIClaw Multi-Product Whitelist Architecture

**Version:** 2.0  
**Date:** 2026-03-18  
**Status:** Production Ready

---

## Overview

APIClaw supports multiple products (Hivr, NordSym, partners) accessing Direct Call APIs via HTTP endpoints with:
- **Product-namespaced agentIds** (`product:agentName`)
- **Per-provider access control** (some products get certain APIs only)
- **Dynamic whitelist syncing** from product Convex deployments
- **Per-product analytics** tracking

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Products                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  Hivr    │  │ NordSym  │  │Partner X │                   │
│  │ Convex   │  │  Convex  │  │  Convex  │                   │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘                   │
└────────┼─────────────┼─────────────┼────────────────────────┘
         │             │             │
         │ agents:list │ team:list   │ agents:list
         │             │             │
         └─────────────┴─────────────┴────────────────────┐
                                                           │
┌──────────────────────────────────────────────────────────────┤
│  APIClaw Product Whitelist                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  product-whitelist.ts                                  │  │
│  │  - Fetch from multiple Convex sources                  │  │
│  │  - Cache per product (5 min TTL)                       │  │
│  │  - Namespace: product:agentId                          │  │
│  │  - Fallback to static whitelist                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  access-control.ts                                     │  │
│  │  - Per-provider permissions                            │  │
│  │  - Pattern matching (hivr:*, nordsym:*)                │  │
│  │  - Deny by default                                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  http-api.ts                                           │  │
│  │  - /api/discover?agentId=hivr:bytebee                  │  │
│  │  - POST /api/call_api { agentId, provider, ... }      │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
                          │
                          │ Logs usage
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  Analytics                                                    │
│  - Product-level tracking                                    │
│  - Per-agent usage                                           │
│  - Provider access logs                                      │
└──────────────────────────────────────────────────────────────┘
```

---

## Product Configuration

**File:** `src/product-whitelist.ts`

### Adding a New Product

```typescript
const PRODUCT_SOURCES: ProductSource[] = [
  {
    name: 'hivr',
    convexUrl: 'https://sensible-quail-275.convex.cloud',
    queryPath: 'agents:list',
    agentIdField: 'agentId',
  },
  {
    name: 'nordsym',
    convexUrl: 'https://nordsym-deployment.convex.cloud',
    queryPath: 'team:listAgents',
    agentIdField: 'memberId',
    authToken: process.env.NORDSYM_API_TOKEN, // Optional
  },
];
```

**Fields:**
- `name` — Product identifier (used in namespace)
- `convexUrl` — Convex deployment URL
- `queryPath` — Convex query function path
- `agentIdField` — Field name for agent identifier
- `authToken` — Optional Bearer token for auth

---

## Access Control Rules

**File:** `src/access-control.ts`

### Rule Format

```typescript
interface AccessRule {
  agentPattern: string;      // e.g., "hivr:*", "nordsym:mollebot"
  allowedProviders: string[]; // e.g., ["*"], ["brave_search", "groq"]
  description?: string;
}
```

### Default Rules

```typescript
const DEFAULT_RULES: AccessRule[] = [
  {
    agentPattern: 'hivr:*',
    allowedProviders: ['*'], // All providers
    description: 'Hivr bees get full access',
  },
  {
    agentPattern: 'nordsym:*',
    allowedProviders: ['brave_search', 'groq', 'replicate'],
    description: 'NordSym team gets selected providers',
  },
];
```

### Pattern Matching

- `hivr:*` — All Hivr agents
- `hivr:bytebee` — Specific agent
- `nordsym:molle*` — Prefix match

### Provider Wildcards

- `*` — All providers
- `brave_*` — All Brave providers
- `["brave_search", "groq"]` — Specific list

---

## Usage Examples

### HTTP API Request (Namespaced)

```bash
curl -X POST "https://apiclaw.com/api/call_api" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "hivr:bytebee",
    "provider": "brave_search",
    "action": "search",
    "params": {"query": "AI news"}
  }'
```

### HTTP API Request (Legacy)

```bash
# Legacy format (no namespace) still works
curl -X POST "https://apiclaw.com/api/call_api" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "bytebee",
    "provider": "brave_search",
    "action": "search",
    "params": {"query": "AI news"}
  }'
```

### Discovery Endpoint

```bash
curl "https://apiclaw.com/api/discover?query=web+search&agentId=hivr:bytebee"
```

---

## Security Model

### 1. Whitelist Check
- Agent must exist in product's Convex deployment
- Fetched dynamically (cached 5 min)
- Fallback to static list if all sources fail

### 2. Access Control
- Per-provider permissions checked
- Pattern-based rules (`hivr:*`, `nordsym:mollebot`)
- Deny by default

### 3. Response on Denial

```json
{
  "error": "Access Denied",
  "message": "Provider not in access list",
  "hint": "Contact admin@nordsym.com for access"
}
```

---

## Analytics Tracking

**Product-level metrics tracked:**
- Total calls per product
- Per-agent usage within product
- Provider access patterns
- Success/error rates
- Latency per product

**Log format:**
```jsonl
{
  "timestamp": "2026-03-18T16:00:00.000Z",
  "provider": "brave_search",
  "action": "search",
  "type": "direct",
  "userId": "hivr:bytebee",
  "success": true,
  "latencyMs": 150,
  "metadata": {
    "product": "hivr"
  }
}
```

---

## Cache Management

### Per-Product Caching
- Each product cached separately
- TTL: 5 minutes
- Parallel fetches from all sources

### Manual Invalidation

```typescript
import { invalidateCache } from './product-whitelist.js';

// Invalidate specific product
invalidateCache('hivr');

// Invalidate all
invalidateCache();
```

---

## Error Handling

### Product Source Down

- Other products continue working
- Falls back to static whitelist if ALL sources fail
- Logs warning, no crash

### Partial Failures

```
[Whitelist] hivr: Fetched 12 agents
[Whitelist] nordsym: HTTP 500
[Whitelist] Total agents: 12 (1 source failed)
```

---

## Migration Guide

### From v1 (Hivr-only) to v2 (Multi-product)

**Old code:**
```typescript
const authorized = await isAuthorized('bytebee');
```

**New code:**
```typescript
const authorized = await isAuthorized('hivr:bytebee');
// OR legacy format still works
const authorized = await isAuthorized('bytebee');
```

**Breaking changes:** None (backward compatible)

---

## Testing

### Local Test

```bash
# Start HTTP API
npm run start:http

# Test whitelisted agent
curl "http://localhost:3000/api/discover?query=web&agentId=hivr:bytebee"
# → 200 OK

# Test unauthorized agent
curl "http://localhost:3000/api/discover?query=web&agentId=hacker:evil"
# → 403 Access Denied
```

### Test Access Control

```bash
# Hivr bee accessing allowed provider
curl -X POST "http://localhost:3000/api/call_api" \
  -d '{"agentId":"hivr:bytebee","provider":"brave_search","action":"search","params":{}}'
# → 200 OK

# NordSym accessing restricted provider (if not in allowlist)
curl -X POST "http://localhost:3000/api/call_api" \
  -d '{"agentId":"nordsym:bot","provider":"restricted_api","action":"call","params":{}}'
# → 403 Provider not in access list
```

---

## Future Enhancements

### Planned
- [ ] Convex table for access rules (dynamic updates)
- [ ] Webhook triggers when new agent added (instant sync)
- [ ] Per-agent rate limits
- [ ] Usage quotas per product
- [ ] Admin UI for whitelist management

### Possible
- [ ] Geographic restrictions
- [ ] Time-based access windows
- [ ] Cost allocation per product
- [ ] Audit logs

---

## Troubleshooting

### New agent not authorized immediately
**Solution:** Wait 5 minutes (cache TTL) or restart APIClaw HTTP server

### All agents unauthorized
**Check:**
1. Product source Convex URL correct?
2. Query path returns array?
3. agentIdField matches response structure?

**Debug:**
```bash
# Check logs
tail -f ~/.apiclaw/logs/api-calls.jsonl | grep whitelist
```

### Access denied despite whitelist
**Check:**
1. Is provider in access rules?
2. Does pattern match agentId?
3. Check logs for reason

---

## Contact

**Questions:** admin@nordsym.com  
**Issues:** GitHub issues (APIClaw repo)  
**Docs:** https://apiclaw.com/docs/whitelist

---

**Last updated:** 2026-03-18  
**Architecture version:** 2.0
