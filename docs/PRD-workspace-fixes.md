---
nord_type: BLUEPRINT
nord_owner: APIClaw
nord_status: LIVE
---

# PRD: Workspace Navigation & Error Fixes

**Date:** 2026-02-28  
**Status:** Draft  
**Priority:** P0 (blocking UX)

---

## Problem Summary

Three issues identified after workspace merge:

### Issue 1: Header "Add Your API" should be "Workspace"
**Location:** Landing page header (logged-in state)  
**Current:** Shows "Add Your API" button  
**Expected:** Should show "Workspace" button for logged-in users

### Issue 2: APIs Tab Client-Side Error
**Location:** `/workspace?tab=apis`  
**Current:** "Application error: a client-side exception has occurred"  
**Expected:** Should render APIs list for providers

### Issue 3: Navigation Disharmony
**Location:** `/providers/dashboard`  
**Current:** Renders old Provider Dashboard with its own tabs (Overview, APIs, Analytics) inside a sidebar that links to /workspace  
**Expected:** Should redirect to `/workspace` OR be removed entirely

---

## Root Cause Analysis

### Issue 1: Header
The header component checks for session but still shows provider-centric CTA. Needs conditional rendering:
- Logged out: "Add Your API" / "Connect Your Agent"
- Logged in: "Workspace" button

### Issue 2: APIs Tab Error
Likely cause: `ApisTab` component tries to render `providerApis` but:
- Provider session might not be properly loaded
- Or `isProvider` check passes but `providerApis` fetch fails
- Or missing null check on API data

### Issue 3: Navigation Disharmony
`/providers/dashboard/page.tsx` still exists and renders full dashboard. The layout wraps it with sidebar pointing to /workspace, creating two competing navigation systems.

---

## Proposed Fixes

### Fix 1: Header Update

**File:** `landing/src/components/Header.tsx` (or equivalent)

```tsx
// Pseudo-code
const isLoggedIn = checkSession();

{isLoggedIn ? (
  <Link href="/workspace" className="btn-primary">
    Workspace
  </Link>
) : (
  <>
    <Link href="/workspace">Connect Your Agent</Link>
    <Link href="/providers/register">Add Your API</Link>
  </>
)}
```

### Fix 2: APIs Tab Error Fix

**File:** `landing/src/app/workspace/page.tsx`

1. Add error boundary around ApisTab
2. Add null checks for providerApis
3. Ensure isProvider only true when providerApis successfully loaded
4. Add try-catch in fetchProviderData

```tsx
// In fetchProviderData
const fetchProviderData = useCallback(async () => {
  try {
    const providerData = localStorage.getItem("apiclaw_provider");
    const providerSession = localStorage.getItem("apiclaw_session");
    
    if (!providerData || !providerSession) {
      setIsProvider(false);
      return;
    }
    
    // ... fetch APIs
    
    if (apisData.value) {
      setProviderApis(apisData.value);
      setIsProvider(true);  // Only set true AFTER successful fetch
    }
  } catch (err) {
    console.error("Fetch provider error:", err);
    setIsProvider(false);  // Fail safe
  }
}, []);

// In ApisTab, add defensive check
function ApisTab({ apis }: { apis: ProviderAPI[] }) {
  if (!apis) {
    return <LoadingState />;
  }
  // ...
}
```

### Fix 3: Remove Old Provider Dashboard

**Option A: Hard Redirect (Recommended)**

Replace `/providers/dashboard/page.tsx` content with redirect:

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProviderDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/workspace?tab=apis");
  }, [router]);
  return null;
}
```

**Option B: Remove entirely**

Delete `/providers/dashboard/page.tsx` and update layout to not render when at root path.

**Note:** Keep `/providers/dashboard/[apiId]/*` routes for API detail pages.

---

## Migration Path

1. **Phase 1:** Fix APIs tab error (unblocks testing)
2. **Phase 2:** Redirect /providers/dashboard → /workspace
3. **Phase 3:** Update header for logged-in state
4. **Phase 4:** Clean up unused provider dashboard components

---

## Files to Modify

| File | Change |
|------|--------|
| `workspace/page.tsx` | Add null checks, error handling for APIs tab |
| `providers/dashboard/page.tsx` | Replace with redirect to /workspace?tab=apis |
| `components/Header.tsx` or `page.tsx` (landing) | Add logged-in state check, show "Workspace" button |
| `providers/dashboard/layout.tsx` | Optional: simplify since main page redirects |

---

## Acceptance Criteria

- [ ] Logged-in user sees "Workspace" in header (not "Add Your API")
- [ ] Clicking "APIs" tab in /workspace shows API list without error
- [ ] Navigating to /providers/dashboard redirects to /workspace?tab=apis
- [ ] API detail pages (/providers/dashboard/{id}) still work
- [ ] No duplicate sidebars/navigation visible

---

## Estimated Effort

| Task | Time |
|------|------|
| Fix APIs tab error | 15 min |
| Redirect provider dashboard | 10 min |
| Update header | 20 min |
| Testing | 15 min |
| **Total** | **~1 hour** |

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
