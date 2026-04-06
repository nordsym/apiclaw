---
nord_type: BLUEPRINT
nord_owner: APIClaw
nord_status: LIVE
---

# APIClaw Earn Credits System

**Inspiration:** Firecrawl's social-action credits model
**Goal:** Drive social proof (stars, followers) while giving users free credits

---

## Credit Actions

| Action | Credits | Verification |
|--------|---------|--------------|
| ⭐ Star GitHub repo | **500** | GitHub OAuth check |
| 🐦 Follow @NordSym on X | **250** | Twitter OAuth check |
| 🔄 Retweet launch post | **100** | Twitter API verify |
| 📧 Join newsletter | **100** | Email verification |
| 👥 Referral signup | **500** | Unique referral code |
| 🦞 Share APIClaw (tracked link) | **50** | Click tracking |

**Total possible:** 1500+ free credits

---

## User Flow

### 1. Signup
```
User signs up → Gets 500 base credits
→ Sees "Earn More Credits" card on dashboard
```

### 2. Earn Credits Card (Dashboard Widget)

```
┌─────────────────────────────────────────┐
│  🦞 Earn Free Credits                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ⭐ Star on GitHub       +500    │   │
│  │ [★ Star Now]            ✓ Done  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🐦 Follow @NordSym      +250    │   │
│  │ [Follow]                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📧 Join Newsletter      +100    │   │
│  │ [Subscribe]                     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👥 Invite Friends       +500/ea │   │
│  │ Your link: apiclaw.cloud  │   │
│  │            ?ref=abc123          │   │
│  │ [Copy Link]                     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Credits earned: 750 / 1500+           │
│  ████████░░░░░░░░                      │
└─────────────────────────────────────────┘
```

---

## Technical Implementation

### GitHub Star Verification
```typescript
// OAuth flow
1. User clicks "Star Now"
2. Redirect to GitHub OAuth
3. After auth, check if user starred nordsym/apiclaw
4. If starred → grant credits, mark as complete

// API endpoint
GET /api/verify/github-star
→ Returns: { starred: boolean, credits_granted: number }
```

### Twitter Follow Verification
```typescript
// OAuth flow
1. User clicks "Follow"
2. Redirect to Twitter OAuth
3. After auth, check if user follows @NordSym
4. If following → grant credits

// Alternative: Honor system with rate limiting
// (Twitter API is expensive, might use simpler approach)
```

### Referral System
```typescript
// Generate unique referral code per user
const referralCode = generateCode(userId); // e.g., "abc123"
const referralLink = `https://apiclaw.cloud?ref=${referralCode}`;

// On new signup with ref code:
1. New user gets normal signup credits
2. Referrer gets 500 bonus credits
3. Track in database: referrals table
```

### Newsletter Verification
```typescript
// Simple email verification
1. User enters email
2. Send verification email with link
3. User clicks link → credits granted
4. Add to Resend/Mailchimp list
```

---

## Database Schema

```sql
-- User credits
CREATE TABLE user_credits (
  user_id TEXT PRIMARY KEY,
  balance INTEGER DEFAULT 500,
  earned_from_github BOOLEAN DEFAULT FALSE,
  earned_from_twitter BOOLEAN DEFAULT FALSE,
  earned_from_newsletter BOOLEAN DEFAULT FALSE,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TIMESTAMP
);

-- Credit transactions
CREATE TABLE credit_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  amount INTEGER,
  type TEXT, -- 'github_star', 'twitter_follow', 'referral', etc.
  created_at TIMESTAMP
);

-- Referrals
CREATE TABLE referrals (
  referrer_id TEXT,
  referred_id TEXT,
  credits_granted INTEGER,
  created_at TIMESTAMP
);
```

---

## Design Notes

### Card Style (APIClaw aesthetic)
- Dark card with subtle border
- Red/orange accent for CTA buttons
- Checkmark animation when completed
- Progress bar at bottom
- Lobster emoji 🦞 as brand element

### Gamification
- Show "X/6 completed" progress
- Confetti animation on completion
- "You're in the top 10% of earners" social proof
- Leaderboard? (optional, might be overkill)

---

## Constraints

- **One-time only:** Each action grants credits once
- **Rate limiting:** Prevent abuse
- **Fraud detection:** Flag suspicious patterns (mass referrals from same IP)
- **Expiry:** Credits don't expire (builds goodwill)

---

## Priority

1. **MVP:** GitHub star + Newsletter (easiest to verify)
2. **V2:** Twitter follow + Referrals
3. **V3:** Retweet verification + Share tracking

---

## Success Metrics

| Metric | Target (Month 1) |
|--------|------------------|
| GitHub stars | 500+ |
| Twitter followers | 200+ |
| Newsletter signups | 300+ |
| Referral signups | 100+ |
| Conversion rate (earn → paid) | 10%+ |

---

*Spec by Symbot | 2026-02-22*

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
