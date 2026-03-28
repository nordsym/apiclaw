# Hivr Auto-Whitelist System

**Problem:** Manually updating hardcoded whitelist every time new bee is added = fragile + easy to forget.

**Solution:** APIClaw dynamically fetches active agents from Hivr's Convex deployment.

---

## How It Works

1. **Hivr Convex Deployment:** `sensible-quail-275` (PROD)
2. **APIClaw queries:** `agents:list` from Hivr
3. **Cache:** 5 minutes (performance)
4. **Fallback:** Static whitelist if Convex unreachable

---

## Files

| File | Purpose |
|------|---------|
| `src/hivr-whitelist.ts` | Dynamic whitelist module |
| `src/http-api.ts` | Uses `isAuthorized()` from hivr-whitelist |

---

## Usage

### In Code
```typescript
import { isAuthorized, invalidateCache } from './hivr-whitelist.js';

// Check if agent is whitelisted
const authorized = await isAuthorized('bytebee'); // true

// Force refresh (after adding new bee)
invalidateCache();
```

### Adding New Bee (Automatic!)
1. Add agent in Hivr (hivr.online admin)
2. APIClaw will auto-discover within 5 minutes
3. **No code changes needed!**

---

## Manual Override (Emergency)

If Hivr Convex is down, edit static fallback:

**File:** `src/hivr-whitelist.ts`  
**Line:** 10-23

```typescript
const STATIC_WHITELIST = [
  'bytebee',
  'symbot',
  // Add emergency agents here
];
```

Then rebuild:
```bash
npm run build
```

---

## Testing

### Local Test
```bash
# Start APIClaw HTTP API
npm run start:http

# Test authorization
curl "http://localhost:3000/api/discover?query=web&agentId=bytebee"
# Should return 200 (authorized)

curl "http://localhost:3000/api/discover?query=web&agentId=unauthorized"
# Should return 403 (unauthorized)
```

### Check Whitelist Cache
APIClaw logs when fetching whitelist:
```
[Hivr Whitelist] Fetched 12 agents from Hivr
```

---

## Troubleshooting

**Problem:** New bee not authorized immediately  
**Solution:** Wait 5 minutes (cache) or restart APIClaw server

**Problem:** "Failed to fetch from Hivr Convex"  
**Solution:** Check Hivr Convex URL in `hivr-whitelist.ts`, fallback to static

**Problem:** All bees unauthorized  
**Solution:** Check Hivr agents table has `agentId` field

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Hivr.online (sensible-quail-275)           │
│  ┌───────────────────────────────────────┐  │
│  │  agents table                         │  │
│  │  { agentId: "bytebee", ... }          │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ▲
                    │ Query agents:list
                    │ (every 5 min)
                    │
┌─────────────────────────────────────────────┐
│  APIClaw HTTP API                           │
│  ┌───────────────────────────────────────┐  │
│  │  hivr-whitelist.ts                    │  │
│  │  - Cached whitelist                   │  │
│  │  - Auto-refresh every 5 min           │  │
│  │  - Fallback to static list            │  │
│  └───────────────────────────────────────┘  │
│                    │                         │
│  ┌───────────────────────────────────────┐  │
│  │  http-api.ts                          │  │
│  │  - /api/discover                      │  │
│  │  - /api/call_api                      │  │
│  │  - Calls isAuthorized(agentId)        │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## Future Improvements

- [ ] Webhook from Hivr when new agent added (instant refresh)
- [ ] Admin endpoint to manually refresh: `GET /api/admin/refresh-whitelist`
- [ ] Whitelist per-API (some bees only get certain providers)
- [ ] Usage quotas per bee (track in Convex)

---

**TL;DR:** Add agent in Hivr → APIClaw auto-whitelists within 5 min. Zero manual code changes.
