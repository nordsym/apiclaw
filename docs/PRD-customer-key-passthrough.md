---
nord_type: BLUEPRINT
nord_owner: APIClaw
nord_status: LIVE
---

# PRD: Customer Key Passthrough

**Status:** ✅ IMPLEMENTED  
**Datum:** 2026-02-26  
**Författare:** Symbot  

---

## Problem

CoAccept (och liknande SaaS-providers) vill att deras slutkunder (t.ex. hyresvärdar) ska kunna styra CoAccept via AI-agent. Men:

1. Varje slutkund har egen CoAccept API-nyckel
2. APIClaw sparar idag EN master key per provider
3. Ingen mekanism för "denna request kommer från Kund X"

---

## Mål

Möjliggöra att agent users skickar med sin egen provider-nyckel vid Direct Call — **utan sign-up friction**.

---

## Constraints (KRITISKA)

| Constraint | Varför |
|------------|--------|
| **Ingen sign-up för agent user** | Friktion = death. Free credits + search ska vara friktionsfritt. |
| **Search alltid gratis** | Hela databasen (19k APIs) sökbar utan login |
| **Open APIs gratis** | Discovery + open API calls = $0 |
| **Direct Call med free credits** | Agent user kan testa Direct Call utan betalning |

---

## Lösningsförslag

### Option A: `customer_key` parameter (Rekommenderad)

Agent skickar med sin egen nyckel i anropet:

```typescript
api_direct_call({
  provider: "coaccept",
  action: "send_reminder",
  params: { tenant_id: "123" },
  customer_key: "hyresvärdens-coaccept-api-key"  // <-- NY
})
```

**Flow:**
1. Agent anropar med `customer_key`
2. APIClaw använder `customer_key` istället för master key
3. CoAccept ser anropet som vanlig API-request från sin kund
4. APIClaw loggar usage (för analytics, ej billing på kundens nyckel)

**Fördelar:**
- Ingen sign-up behövs
- Agent user kontrollerar sin egen nyckel
- Provider (CoAccept) ser sin vanliga kund
- Bakåtkompatibelt (utan `customer_key` = master key används)

**Nackdelar:**
- Nyckel skickas i varje request (måste vara över HTTPS)
- Agent user måste ha/få sin nyckel från providern

---

### Option B: Registered customer keys (mer enterprise)

Agent user registrerar sin nyckel en gång i APIClaw dashboard, får tillbaka ett `customer_id`:

```typescript
api_direct_call({
  provider: "coaccept",
  action: "send_reminder",
  params: { tenant_id: "123" },
  customer_id: "cust_abc123"  // Referens till sparad nyckel
})
```

**Fördelar:**
- Nyckel skickas inte i varje request
- Kan bygga usage tracking per customer
- Möjliggör billing per customer senare

**Nackdelar:**
- Kräver sign-up/registration (BRYTER CONSTRAINT)
- Mer komplext

---

## Rekommendation

**Option A först.** 

Enklast, friktionsfritt, löser CoAccept-caset direkt. Option B kan byggas senare som "enterprise mode" för de som vill.

---

## Implementation (Option A)

### 1. MCP Tool Update

```typescript
// Befintlig
api_direct_call(provider, action, params)

// Ny
api_direct_call(provider, action, params, customer_key?)
```

### 2. execute-dynamic.ts

```typescript
// I executeAction():
const apiKey = args.customer_key || config.encryptedMasterKey;
// Använd apiKey för auth header
```

### 3. Provider Config (optional flag)

Provider kan välja att:
- `allow_customer_keys: true` — tillåt passthrough
- `require_customer_keys: true` — ENDAST customer keys (ingen master)

CoAccept skulle sätta `require_customer_keys: true` eftersom varje hyresvärd måste autentisera sig själv.

### 4. Logging

Logga `customer_key_used: true/false` i usage logs (inte själva nyckeln).

---

## Vad som INTE ändras

- ✅ Search — fortfarande gratis, ingen login
- ✅ Open APIs — fortfarande gratis
- ✅ Free credits — fortfarande tillgängliga
- ✅ Master key Direct Call — funkar som innan (default)

---

## Scope för V1

| Ingår | Ingår ej |
|-------|----------|
| `customer_key` parameter i MCP tool | Dashboard för att spara nycklar |
| execute-dynamic.ts uppdatering | Per-customer billing |
| Provider flag `allow_customer_keys` | Customer registration flow |
| Usage logging | |

---

## Effort Estimate

| Task | Tid |
|------|-----|
| MCP tool schema update | 30 min |
| execute-dynamic.ts logic | 1h |
| Provider config flag (Convex + UI) | 1h |
| Testing | 30 min |
| **Total** | ~3h |

---

## Öppna frågor

1. **Ska vi validera customer_key format?** (Nej — provider's API gör det)
2. **Rate limits på customer_key?** (V1: Nej. Providern hanterar det.)
3. **Billing?** (V1: Ingen. Agent user betalar providern direkt.)

---

## Attestering

- [ ] Gustav har läst och godkänt
- [ ] Scope bekräftat
- [ ] Constraints respekterade
- [ ] Klart för implementation

---

*Väntar på din feedback, Gustav.* 🦞

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
