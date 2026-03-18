# APIClaw Dashboard Fix Plan

## Issues Found:

### 1. Agent Count Mismatch (8 vs 1)
**Root cause:** Overview counts `agentSessions` (stale), My Agents tab queries `agents` table (correct)
**Fix:** Update `getWorkspaceDashboard` to count from `agents` table instead

### 2. Analytics = Preview Mode
**Root cause:** `analytics:getProviderBreakdown` doesn't exist
**Fix:** Create query that aggregates from `apiLogs` table

### 3. Usage Count (claims 7, actually 1)
**Diagnosis:** Backend correctly shows 1, dashboard may be cached
**Fix:** Hard refresh should resolve, but verify incrementUsage is called

### 4. lastActiveAt Frozen
**Diagnosis:** Not being updated on proxy calls
**Fix:** Update agent.lastActiveAt when logging proxy call

## Implementation Order:

1. Create `analytics:getProviderBreakdown` query
2. Fix `getWorkspaceDashboard` to count agents correctly
3. Update `createProxyLog` to touch agent lastActiveAt
4. Remove preview fallback in frontend
5. Rename "Direct Call" → "API Catalog"

Time estimate: 30 mins
