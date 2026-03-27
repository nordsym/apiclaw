---
nord_type: BLUEPRINT
nord_owner: APIClaw
nord_status: LIVE
---

# PRD: APIClaw Final Polish

Samlar alla återstående issues för en sista polish-runda.

---

## Issues

### 1. 🔴 "Available APIs: 10" Kort Förvirrar

**Problem:**
- Kortet visar "Available APIs: 10"
- User tror det är en personlig begränsning
- User tänker "kan jag köpa fler?"
- Verkligheten: 10 Direct Call + 22k+ via MCP

**Lösning:**
- Ta bort "Available APIs" kortet helt
- Behåll: API Calls, My Agents, My APIs
- Direct Call-sektionen visar redan de 10 APIs

**Scope:** Ändra OverviewTab, ta bort första stat-kortet

---

### 2. 🔴 Stripe Environment Variables

**Problem:**
- Stripe-koden finns men env vars saknas
- Betalning fungerar inte förrän keys är satta

**Variabler som behövs:**
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_USAGE=price_...
```

**Lösning:**
- Gustav hämtar keys från Stripe dashboard
- Lägg in i Convex environment variables
- Testa checkout flow

**Scope:** Config only (ingen kod)

---

### 3. 🟡 Logging Hook → Execute.ts

**Problem:**
- Logs UI finns och visar data
- Men logs kopplas inte automatiskt till faktiska API-anrop
- `logs:createLog` mutation finns men anropas inte från execute

**Lösning:**
- Hitta execute-funktionen i MCP-servern
- Efter varje Direct Call, anropa createLog
- Logga: provider, action, status, latency, workspaceId

**Filer:**
- `src/execute.ts` (eller liknande i MCP-servern)
- Anropa Convex mutation efter varje call

**Scope:** 1 agent

---

### 4. 🟢 Auto-Configure Feature

**Problem:**
- Användare måste manuellt konfigurera MCP config
- Friktion i onboarding

**Vision:**
- Klicka "Auto-Configure" i workspace
- Permission dialog (File System Access API)
- AI lokaliserar och modifierar MCP config
- Visuell bekräftelse

**Tekniska alternativ:**
1. File System Access API (Chrome/Edge)
2. Browser extension
3. Local daemon
4. CLI command + copy-paste

**Scope:** Egen mini-PRD, 2-3 agenter

---

## Agenter

| # | Agent | Scope | Prio |
|---|-------|-------|------|
| 1 | `overview-cleanup` | Ta bort "Available APIs" kort | 🔴 |
| 2 | `stripe-config` | Dokumentera env var setup | 🔴 |
| 3 | `logging-hook` | Koppla execute → logs | 🟡 |
| 4 | `auto-configure-prd` | Skriv detaljerad PRD | 🟢 |

**Total: 4 agenter**

---

## Acceptanskriterier

- [ ] Overview visar 3 kort (inte 4)
- [ ] Stripe checkout fungerar live
- [ ] API-anrop loggas automatiskt
- [ ] Auto-Configure PRD dokumenterad

---

## Prioritetsordning

1. **Overview cleanup** — Snabb fix, tar bort förvirring
2. **Stripe config** — Gustav gör manuellt med guide
3. **Logging hook** — Kräver research i MCP-servern
4. **Auto-Configure** — Future feature, PRD först

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
