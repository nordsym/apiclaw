# 🔍 APIClaw Terminology Audit - "Provider Dashboard" → "Workspace"

**Goal:** Unify all dashboard terminology to "Workspace" regardless of user role.

**Principle:** ONE dashboard for ALL users. Same name: **Workspace**. Different data based on role.

---

## ❌ Current Issues

**Problem:** Multiple terms for the same concept:
- "Provider Dashboard" (for API providers like APILayer)
- "Workspace" (for regular users)
- Routes: `/providers/dashboard` vs `/workspace`

**Confusion:** Users/AI don't know if these are different things or the same.

---

## 📋 Files to Update

### **1. Component Rename**

**File:** `src/components/ProviderDashboard.tsx`
- Rename to: `Workspace.tsx`
- Export: `ProviderDashboard` → `Workspace`

### **2. Route Structure**

**Current:** `/providers/dashboard/*`
**Decision needed:** 
- Option A: Rename to `/providers/workspace/*` (keeps separation)
- Option B: Merge into `/workspace` (unified, role-based views)

**Recommendation:** Option B - One workspace, role-based content.

### **3. UI Text Changes (9 files)**

| File | Line | Current | Replace With |
|------|------|---------|--------------|
| `src/app/api/auth/magic-link/route.ts` | 54 | "provider dashboard" | "workspace" |
| `src/app/login/page.tsx` | 202 | "Provider Dashboard" | "Workspace" |
| `src/app/providers/dashboard/[apiId]/direct-call/page.tsx` | 448 | "provider dashboard" | "workspace" |
| `src/app/providers/dashboard/login/page.tsx` | 112 | "Provider Dashboard" | "Workspace" |
| `src/app/providers/dashboard/page.tsx` | 7 | `ProviderDashboardRedirect` | `WorkspaceRedirect` |
| `src/app/providers/layout.tsx` | 4 | "Provider Dashboard" | "Workspace" |
| `src/components/ProviderDashboard.tsx` | 79 | "Provider Dashboard" | "Workspace" |
| `src/lib/mock-data.ts` | 1 | "provider dashboard demo" | "workspace demo" |

---

## ✅ Acceptable "Provider" Usage

**These are OK (not confusing):**
- "API provider" (describes what someone IS, not a UI element)
- "Direct Call provider" (describes a service type)
- Technical variable names like `providerId`, `providerName` (code internals)
- "Provider" in list contexts ("Browse providers")

**Rule:** "Provider" OK when describing a ROLE or TYPE. NOT OK when naming UI elements.

---

## 🎯 Proposed Changes

### Phase 1: UI Text (Quick Win)
Replace all "Provider Dashboard" → "Workspace" in user-facing text.

### Phase 2: Component Rename
`ProviderDashboard.tsx` → `Workspace.tsx`

### Phase 3: Route Consolidation (Optional)
Merge `/providers/dashboard` into `/workspace` with role-based rendering.

---

## 📝 Implementation Script

```bash
# Find all instances (for verification)
cd ~/Projects/apiclaw/landing
grep -rn "Provider Dashboard" src/ --include="*.tsx" --include="*.ts"

# Replace in files (do manually or scripted)
# See detailed file list above
```

---

## 🚀 Next Steps

1. Review this audit
2. Confirm approach (Phase 1-3 vs all at once)
3. Execute changes
4. Test routes still work
5. Deploy

**Created:** 2026-03-24
**Status:** Ready for implementation
