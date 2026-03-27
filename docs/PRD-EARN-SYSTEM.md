---
nord_type: BLUEPRINT
nord_owner: APIClaw
nord_status: LIVE
---

# PRD: APIClaw Earn System

**Status:** Draft  
**Datum:** 2026-02-28  
**Författare:** Symbot + Gustav

---

## Sammanfattning

Gamifierat earn-system där användare tjänar API calls genom att slutföra tasks. Två kategorier: **Usage tasks** (driver aha-moment) och **Growth tasks** (driver tillväxt).

---

## Earn Tasks

### Usage Tasks (driver aha-moment)

| Task | Calls | Trigger |
|------|-------|---------|
| Gör första Direct Call | +15 | API-anrop loggas i system |
| Testa 3 olika APIs | +10 | 3 unika API endpoints anropade |
| Lista din Agent | +10 | Agent publicerad i marketplace |
| Lista ditt API | +10 | API publicerad som provider |
| Sätt upp Direct Call (BYOK) | +5 | Minst 1 API key sparad |

### Growth Tasks (driver tillväxt)

| Task | Calls | Trigger |
|------|-------|---------|
| Star on GitHub | +10 | OAuth-verifierad eller manuell claim |
| Follow @NordSym | +5 | OAuth-verifierad eller manuell claim |
| Invite Friends | +10/referral | Referral-kod använd vid signup |

### Totalt

- **One-time max:** 65 calls (exkl. referrals)
- **Referrals:** Obegränsat (+10 per signup)

---

## UX Specification

### Progress Section (top of Earn tab)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Target icon] Earn Progress                                │
│                                                             │
│  [████████████░░░░░░░░░░░░]  35/65 calls earned            │
│                                                             │
│  USAGE                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Check icon] First Direct Call       +15  CLAIMED   │   │
│  │ [Circle icon] Test 3 APIs            +10  1/3       │   │
│  │ [Circle icon] List your Agent        +10  [DO IT]   │   │
│  │ [Circle icon] List your API          +10  [DO IT]   │   │
│  │ [Circle icon] Set up Direct Call     +5   [DO IT]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  GROWTH                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Check icon] Star on GitHub          +10  CLAIMED   │   │
│  │ [Circle icon] Follow @NordSym        +5   [DO IT]   │   │
│  │ [Users icon] Invite Friends          +10  [COPY]    │   │
│  │              3 friends joined                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Visual States

| State | Icon | Style |
|-------|------|-------|
| Not started | Circle (outline) | Gray text |
| In progress | Circle with partial fill | Blue text, "1/3" counter |
| Completed | CheckCircle (filled) | Green, "CLAIMED" badge |
| Action available | Button | Red accent, "[DO IT]" |

### Icons (Lucide)

| Element | Icon |
|---------|------|
| Progress header | Target |
| Completed task | CheckCircle |
| Open task | Circle |
| Referral | Users |
| Direct Call | Zap |
| Agent | Bot |
| API | Code |
| GitHub | Github |
| Twitter/X | Twitter |

### Animations

1. **On claim:** Checkmark animation (scale in + color change)
2. **Progress bar:** Smooth fill animation on update
3. **Confetti:** Optional, on major milestone (50%, 100%)

### Toast Notifications

| Event | Message |
|-------|---------|
| Task completed | "+15 calls earned! First Direct Call complete." |
| Milestone | "Halfway there! 32/65 calls earned." |
| Referral | "+10 calls! [Name] joined with your link." |

---

## Data Model

### Convex Schema

```typescript
// earnProgress table
{
  userId: Id<"users">,
  
  // Usage tasks
  firstDirectCall: boolean,
  firstDirectCallAt: number | null,
  
  apisUsed: string[],  // Track unique APIs
  apisUsedComplete: boolean,
  
  agentListed: boolean,
  agentListedAt: number | null,
  
  apiListed: boolean,
  apiListedAt: number | null,
  
  byokSetup: boolean,
  byokSetupAt: number | null,
  
  // Growth tasks
  githubStarred: boolean,
  githubStarredAt: number | null,
  
  twitterFollowed: boolean,
  twitterFollowedAt: number | null,
  
  // Referrals (tracked separately)
  referralCount: number,
  
  // Calculated
  totalEarned: number,
}
```

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `earnProgress:get` | Get user's earn progress |
| `earnProgress:claimGithub` | Mark GitHub star as claimed |
| `earnProgress:claimTwitter` | Mark Twitter follow as claimed |
| `earnProgress:checkProgress` | Recalculate based on actual usage |

### Automatic Triggers

| Action | Updates |
|--------|---------|
| API call logged | Check firstDirectCall, apisUsed |
| Agent published | Set agentListed |
| API published | Set apiListed |
| BYOK key saved | Set byokSetup |
| Referral signup | Increment referralCount |

---

## Integration Points

### execute.ts

```typescript
// After successful API call
if (!user.earnProgress.firstDirectCall) {
  await ctx.runMutation(api.earnProgress.markFirstDirectCall, { userId });
}

// Track unique APIs
await ctx.runMutation(api.earnProgress.trackApiUsed, { 
  userId, 
  apiId: request.apiId 
});
```

### Agent/API Publish Flow

```typescript
// On agent publish
await ctx.runMutation(api.earnProgress.markAgentListed, { userId });

// On API publish  
await ctx.runMutation(api.earnProgress.markApiListed, { userId });
```

### BYOK Settings

```typescript
// On first API key saved
await ctx.runMutation(api.earnProgress.markByokSetup, { userId });
```

---

## Free Tier Interaction

| Source | Calls |
|--------|-------|
| Monthly free | 50 |
| Earn bonus (max) | 65 |
| Referrals | Unlimited |
| **Total potential** | 115+ first month |

Earn bonus is **one-time**. Monthly free refreshes.

---

## Implementation Plan

### Agents Required: 3

**Agent 1: Backend (Convex)**
- Create earnProgress table
- Mutations: markFirstDirectCall, trackApiUsed, markAgentListed, markApiListed, markByokSetup, claimGithub, claimTwitter
- Query: getEarnProgress
- Integration hooks in execute.ts, agent publish, API publish, BYOK save

**Agent 2: Frontend (Earn Tab)**
- Redesign Earn Credits tab with progress bar
- Task cards with states (open, in-progress, claimed)
- Toast notifications on completion
- Animations (checkmark, progress fill)
- Replace current earn/page.tsx content

**Agent 3: Referral System**
- Generate unique referral codes
- Track referral signups
- Credit referrer on successful signup
- Referral leaderboard (optional)

---

## Success Metrics

- Earn completion rate (% users completing all tasks)
- First Direct Call within 24h of signup
- Referral conversion rate
- Correlation: earn completion vs. paid conversion

---

## Open Questions

1. **Manual claim vs. auto-detect:** GitHub/Twitter require OAuth or trust user?
2. **Referral cap:** Unlimited or max 50 referrals?
3. **Expiration:** Do earned calls expire or persist?
4. **Existing users:** Retroactive credit for already-completed actions?

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
