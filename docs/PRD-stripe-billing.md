---
nord_type: BLUEPRINT
nord_owner: APIClaw
nord_status: LIVE
---

# PRD: APIClaw Stripe Billing

## Sammanfattning

Usage-based billing för APIClaw. Användare lägger kort på fil, vi trackar API calls, debiterar månatligen, skickar faktura.

---

## Nuläge

| Metric | Värde |
|--------|-------|
| Free tier | 50 calls |
| Earn Credits | +50 calls max |
| Efter det | ❌ Blocked |
| Betalning | ❌ Finns ej |

---

## Målbild

```
┌─────────────────────────────────────────────────────────┐
│  User signar up                                         │
│       ↓                                                 │
│  50 free calls (+ earn up to 50 more)                  │
│       ↓                                                 │
│  Calls slut → Prompt: "Add payment method"             │
│       ↓                                                 │
│  Stripe Checkout → Kort på fil                         │
│       ↓                                                 │
│  Unlimited calls (usage tracked)                        │
│       ↓                                                 │
│  Månadsskifte: Debitera + skicka invoice               │
└─────────────────────────────────────────────────────────┘
```

---

## Pricing Model

### Option A: Pure Usage-Based
| Calls | Pris |
|-------|------|
| 0-100 | Free (first 100 total) |
| 101+ | $0.01 per call |

### Option B: Tiers + Overage
| Tier | Inkluderat | Pris/mån | Overage |
|------|------------|----------|---------|
| Free | 100 calls | $0 | Blocked |
| Starter | 1,000 calls | $9 | $0.01/call |
| Pro | 10,000 calls | $49 | $0.005/call |
| Scale | 100,000 calls | $199 | $0.002/call |

### Option C: Credit Packs (Enklast)
| Pack | Calls | Pris | Per call |
|------|-------|------|----------|
| Starter | 500 | $5 | $0.01 |
| Growth | 2,000 | $15 | $0.0075 |
| Scale | 10,000 | $50 | $0.005 |

**Rekommendation:** Option A för MVP, Option B senare.

---

## Stripe Integration

### Komponenter

1. **Stripe Customer**
   - Skapa vid första betalning
   - Länka till workspace i Convex

2. **Stripe Checkout**
   - Setup mode för kort på fil
   - Eller payment mode för credit packs

3. **Stripe Billing Portal**
   - Användare hanterar kort själv
   - Ser fakturor

4. **Metered Billing** (om subscription)
   - `stripe.subscriptionItems.createUsageRecord()`
   - Rapportera usage dagligen eller vid varje call

5. **Webhooks**
   - `invoice.paid` → Bekräfta betalning
   - `invoice.payment_failed` → Notify user
   - `customer.subscription.deleted` → Downgrade

---

## Convex Schema Updates

```typescript
// workspaces table - additions
{
  stripeCustomerId: v.optional(v.string()),
  stripeSubscriptionId: v.optional(v.string()),
  billingPlan: v.optional(v.string()), // "free" | "starter" | "pro" | "scale"
  creditBalance: v.optional(v.number()), // For credit pack model
  lastBillingDate: v.optional(v.number()),
}

// New table: invoices
{
  workspaceId: v.id("workspaces"),
  stripeInvoiceId: v.string(),
  amount: v.number(),
  status: v.string(), // "paid" | "pending" | "failed"
  periodStart: v.number(),
  periodEnd: v.number(),
  callCount: v.number(),
  createdAt: v.number(),
}

// New table: usageRecords
{
  workspaceId: v.id("workspaces"),
  date: v.string(), // "2026-02-28"
  callCount: v.number(),
  reportedToStripe: v.boolean(),
}
```

---

## UI Changes

### 1. Billing Tab (ny)
- Current plan
- Usage this month
- Payment method (last 4 digits)
- Invoices history
- Upgrade/downgrade buttons

### 2. Usage Limit Banner
När calls närmar sig limit:
- 80%: "You've used 80 of 100 calls"
- 100%: "Add payment method to continue"

### 3. Checkout Flow
- Button: "Add Payment Method" eller "Upgrade"
- Redirect till Stripe Checkout
- Return URL: `/workspace?billing=success`

### 4. Settings Integration
- Link till Stripe Billing Portal
- "Manage Payment Method"
- "View Invoices"

---

## API Endpoints

### HTTP Routes (Convex)

```typescript
// Create checkout session
POST /api/billing/checkout
Body: { workspaceId, plan?, returnUrl }
Response: { checkoutUrl }

// Create billing portal session
POST /api/billing/portal
Body: { workspaceId, returnUrl }
Response: { portalUrl }

// Stripe webhook handler
POST /api/webhooks/stripe
Headers: stripe-signature
Body: Stripe event
```

### Mutations

```typescript
// Link Stripe customer to workspace
billing:linkCustomer({ workspaceId, stripeCustomerId })

// Update subscription status
billing:updateSubscription({ workspaceId, plan, stripeSubscriptionId })

// Record usage for billing
billing:recordUsage({ workspaceId, callCount, date })

// Process successful payment
billing:processPayment({ stripeInvoiceId, workspaceId, amount })
```

### Queries

```typescript
// Get billing info for workspace
billing:getInfo({ workspaceId })
→ { plan, usage, limit, stripeCustomerId, invoices[] }

// Get usage for current period
billing:getCurrentUsage({ workspaceId })
→ { callCount, periodStart, periodEnd, limit }
```

---

## Usage Tracking

### Current: Increment on call
```typescript
// Already exists in execute flow
await ctx.runMutation(api.workspaces.incrementUsage, { 
  workspaceId 
});
```

### Addition: Daily aggregation for Stripe
```typescript
// Cron job: daily at 00:00 UTC
export const reportDailyUsage = internalAction({
  handler: async (ctx) => {
    // Get all workspaces with Stripe subscriptions
    // Calculate usage since last report
    // Report to Stripe: stripe.subscriptionItems.createUsageRecord()
    // Mark as reported
  }
});
```

---

## Security

1. **Webhook Verification**
   - Verify Stripe signature on all webhooks
   - Use `stripe.webhooks.constructEvent()`

2. **Customer Isolation**
   - Workspace can only access own billing
   - Verify ownership before any billing action

3. **Idempotency**
   - Handle duplicate webhooks gracefully
   - Use Stripe event ID as idempotency key

---

## Environment Variables

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_SCALE=price_...
```

---

## Agenter

| # | Agent | Scope |
|---|-------|-------|
| 1 | `stripe-backend` | Convex schema, mutations, queries, HTTP routes, webhook handler |
| 2 | `stripe-checkout` | Checkout flow, return handling, UI components |
| 3 | `billing-tab` | Billing tab UI, usage display, invoices list |
| 4 | `usage-tracking` | Daily aggregation cron, Stripe usage reporting |
| 5 | `billing-portal` | Portal integration, payment method management |

**Total: 5 agenter**

---

## Success Metrics

- [ ] User can add payment method
- [ ] Usage tracked accurately
- [ ] Monthly invoice generated
- [ ] Payment processed automatically
- [ ] User can view invoices
- [ ] User can update payment method
- [ ] Failed payment triggers notification

---

## Edge Cases

1. **Payment fails**
   - Retry 3x over 7 days
   - After final failure: downgrade to free, block calls

2. **Subscription cancelled mid-month**
   - Prorate and charge for usage
   - Downgrade immediately

3. **Usage spike**
   - No hard limit (trust model)
   - Alert at 10x normal usage
   - Option: hard cap per day

4. **Refunds**
   - Manual via Stripe dashboard
   - Credit balance in system

---

## Future Considerations

- Team billing (multiple users, one invoice)
- Annual plans (discount)
- Enterprise invoicing (PO, net-30)
- Usage alerts/budgets
- Prepaid credits with auto-topup

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
