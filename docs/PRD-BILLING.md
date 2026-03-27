---
nord_type: BLUEPRINT
nord_owner: APIClaw
nord_status: LIVE
---

# PRD: APIClaw Billing System

**Status:** Draft  
**Datum:** 2026-02-28  
**Författare:** Symbot + Gustav

---

## Sammanfattning

Två betalningsmodeller för APIClaw:
1. **Pay-per-usage** — Lägg in kort, betala per API-anrop
2. **Backer** — $99 one-time, free usage 2026, VIP-status

---

## Modell 1: Pay-per-usage

### Användarflöde
1. Användare skapar konto (magic link)
2. Klickar "Add payment method" i dashboard
3. Stripe Checkout → sparar kort
4. Varje API-anrop drar: **provider-kostnad + 4% fee**
5. Faktureras månadsvis (Stripe invoicing)

### Teknisk implementation

**Stripe-komponenter:**
- Meter: `api_call` (redan skapad)
- Customer: skapas vid signup
- Subscription: skapas vid "add payment method" (usage-based)

**execute.ts integration:**
```typescript
// Efter lyckat API-anrop
await stripe.billing.meterEvents.create({
  event_name: 'api_call',
  payload: {
    stripe_customer_id: user.stripeCustomerId,
    value: String(costInCents) // Provider cost + 4%
  }
});
```

**Prissättning per provider:**

| Provider | Ungefärlig kostnad | Med 4% fee |
|----------|-------------------|------------|
| Brave Search | $0.005/sökning | $0.0052 |
| OpenRouter | Varierar (token-based) | +4% |
| 46elks SMS | ~$0.035/SMS | $0.0364 |
| ElevenLabs | ~$0.001/tecken | +4% |
| Resend | $0.001/email | $0.00104 |

**Krav:**
- [ ] Stripe Customer skapas vid signup
- [ ] "Add payment method" knapp i dashboard
- [ ] Stripe Checkout Session för kort-setup
- [ ] Meter event logging i execute.ts
- [ ] Usage-dashboard (visa förbrukning)
- [ ] Provider-kostnad lookup per API

---

## Modell 2: Backer ($99)

### Erbjudande
- **Pris:** $99 USD one-time
- **Inkluderar:** Free API usage t.o.m. 2026-12-31
- **VIP-perks:**
  - Newsletter (insider updates)
  - Direkt kontakt med founders
  - Badge i systemet
  - Prioriterad support
- **Efter 2026:** Övergår till pay-per-usage

### Användarflöde
1. Användare ser "Become a Backer" CTA
2. Klickar → Stripe Checkout ($99 one-time)
3. Betalning genomförd → `backer: true` + `backerUntil: 2026-12-31`
4. Dashboard visar "Backer" badge
5. Alla API-anrop = gratis (skippa metering)
6. 2027-01-01: Automatiskt övergång till pay-per-usage

### Teknisk implementation

**Stripe-komponenter:**
- Produkt: "APIClaw Backer" (skapa ny, arkivera Pro)
- Price: $99 one-time (inte recurring)
- Checkout Session: mode=payment

**Databas (Convex):**
```typescript
// users table
{
  email: string,
  stripeCustomerId: string,
  backer: boolean,        // true om betalat
  backerUntil: number,    // timestamp 2026-12-31 23:59:59
  // ...
}
```

**execute.ts logic:**
```typescript
// Innan metering
if (user.backer && Date.now() < user.backerUntil) {
  // Skip metering, free call
  return executeApiCall();
}
// Annars: logga till meter
```

**Krav:**
- [ ] Stripe produkt "APIClaw Backer" ($99 one-time)
- [ ] "Become a Backer" CTA på landing + dashboard
- [ ] Checkout flow för one-time payment
- [ ] Webhook: `checkout.session.completed` → sätt backer=true
- [ ] Backer-badge i UI
- [ ] Conditional metering i execute.ts
- [ ] Övergångslogik 2027-01-01

---

## UI/UX

### Landing Page
- Sektion: "Support APIClaw" eller "Become a Backer"
- Tydlig value prop: "$99 → Free API calls all of 2026"
- Lista VIP-perks

### Dashboard (inloggad)
- **Backer:** Badge, "Free until Dec 31, 2026", usage stats (för kul)
- **Pay-per-usage:** "Add payment method", current balance, usage

### Pricing Page (om separat)
```
┌─────────────────────┬─────────────────────┐
│   PAY AS YOU GO     │      BACKER         │
├─────────────────────┼─────────────────────┤
│   Free to start     │       $99           │
│   Pay per API call  │   one-time          │
│   (cost + 4%)       │                     │
│                     │ ✓ Free calls 2026   │
│                     │ ✓ VIP newsletter    │
│                     │ ✓ Founder access    │
│                     │ ✓ Priority support  │
├─────────────────────┼─────────────────────┤
│   [Add Card]        │ [Become a Backer]   │
└─────────────────────┴─────────────────────┘
```

---

## Webhook Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` (backer) | Set user.backer=true, backerUntil |
| `checkout.session.completed` (card setup) | Create usage subscription |
| `invoice.payment_failed` | Notify user, pause access? |
| `customer.subscription.deleted` | Revoke access |

---

## Milstolpar

### Fas 1: Backer (ship first)
- [ ] Stripe produkt + price
- [ ] Checkout flow
- [ ] Webhook handler
- [ ] Backer flag i DB
- [ ] Badge i UI
- [ ] Skip metering för backers

### Fas 2: Pay-per-usage
- [ ] Fix meter price ($0.002 base eller dynamic)
- [ ] Metering i execute.ts
- [ ] "Add payment method" flow
- [ ] Usage dashboard
- [ ] Provider cost lookup

### Fas 3: Polish
- [ ] Email kvitto (Backer welcome)
- [ ] Transition email (Dec 2026 → pay-per-usage)
- [ ] Referral? ("Get 1 month free")

---

## Free Tier

**Alla användare får:**
- 50 API calls/månad (baseline)
- +50 bonus calls (one-time) via "Earn"-tasks

**Earn-tasks (one-time bonus):**
| Task | Bonus |
|------|-------|
| Verifiera email | +10 |
| Koppla första API | +15 |
| Gör första anrop | +10 |
| Dela på X/LinkedIn | +15 |
| **Total** | **+50** |

**Struktur:**
```
Free user startar: 50/månad
Gör alla earn-tasks: +50 bonus (total 100 första månaden)
Månad 2: 50/månad (bonus är one-time)
```

---

## Öppna frågor

1. **Provider cost tracking:** Hårdkoda per provider eller dynamiskt?
2. **Minimum balance?** Kan man gå minus och faktureras efteråt?
3. **Backer limit?** Max 100 backers? Eller obegränsat?

---

## Success Metrics

- **Backers:** 10 första månaden, 50 till EOY
- **Pay-per-usage conversion:** 20% av free users
- **Revenue target:** $5k MRR EOY 2026

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
