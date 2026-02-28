# PRD: APIClaw Navigation & Feature Expansion

## Vision

APIClaw är **räls för AI-agenter**. Workspace-dashboarden ska kännas som n8n/Vercel/GitHub — professionell, komplett, skalbar.

---

## Ny Sidebar-struktur

```
┌─────────────────────┐
│ APIClaw             │
│ user@email.com      │
│ Free · 50/50 calls  │
├─────────────────────┤
│ Overview            │
│ APIs                │
│ Agents              │
│ Logs                │  ← NY
│ Analytics      ▼    │
│ Usage               │
│ Webhooks            │  ← NY
├─────────────────────┤
│ API Keys            │  ← NY (BYOK)
│ Earn Credits        │
│ Docs                │
│ Feedback            │  ← NY
├─────────────────────┤
│ ⚙ Settings          │  ← NY
│ ☀ Theme             │
│ → Sign Out          │
└─────────────────────┘
```

Ikoner: Lucide React (redan installerat)

---

## NYA TABS

### 1. Logs
**Syfte:** Visa alla API-anrop, fel, debug-info.

**Innehåll:**
- Tabell: timestamp, provider, action, status, latency
- Filter: provider, status (success/error), datum
- Expandera rad → visa request/response
- Export som JSON/CSV

**Data:** Ny `apiLogs` tabell i Convex

---

### 2. Webhooks
**Syfte:** Reagera på events (usage alerts, errors, etc.)

**Innehåll:**
- Lista webhooks: URL, events, status
- Skapa ny: URL + välj events
- Test-knapp
- Logs per webhook

**Events:**
- `usage.threshold` (80%, 100%)
- `api.error`
- `agent.connected`
- `agent.revoked`

---

### 3. Feedback
**Syfte:** Samla feedback från användare.

**Innehåll:**
- Fritext-formulär
- Quick reactions: 👍/👎 på specifika features
- Feature requests lista (up/downvote)
- Status: "Under review" / "Planned" / "Shipped"

**Data:** Ny `feedback` tabell

---

### 4. Settings
**Syfte:** Konto- och workspace-inställningar.

**Sektioner:**
- **Profile:** Namn, email
- **Security:** Lösenord, sessions, 2FA (future)
- **Notifications:** Email-preferenser
- **Workspace:** Namn, delete workspace
- **API Tokens:** Generera tokens för extern access

---

## BYOK (Bring Your Own Key)

### Positionering — KRITISKT

**APIClaw's kärnvärde:** "Direct Call — ingen API-nyckel behövs"

**BYOK är INTE huvudfeature.** Det är en power-user-option.

### Varför BYOK?

| Usecase | Förklaring |
|---------|------------|
| **Obegränsade anrop** | Dina nycklar = räknas inte mot free tier |
| **Privacy** | Requests går direkt till provider, ej via NordSym |
| **Egna modeller** | Fine-tuned models, custom endpoints |
| **Enterprise compliance** | Vissa företag MÅSTE äga sina credentials |
| **Providers vi ej stödjer** | Lägg till vilken REST API som helst |

### UX-princip

```
┌─────────────────────────────────────────────────────┐
│  Brave Search                                       │
│  ────────────────────────────────────────────────── │
│  ✓ Direct Call (NordSym)     ○ Use your own key    │
│                                                     │
│  Using Direct Call: No setup needed.                │
│  50 free calls/month included.                      │
│                                                     │
│  [Switch to your own key →]                         │
└─────────────────────────────────────────────────────┘
```

**Default = Direct Call.** BYOK är opt-in, aldrig påtvingat.

### API Keys Tab

**Struktur:**

```
┌─────────────────────────────────────────────────────┐
│  API Keys                                           │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Your keys are encrypted and stored securely.       │
│  Using your own keys = unlimited calls, no proxy.   │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ Provider      │ Status        │ Actions       │  │
│  ├───────────────────────────────────────────────┤  │
│  │ Brave Search  │ Direct Call   │ [Add Key]     │  │
│  │ OpenRouter    │ Direct Call   │ [Add Key]     │  │
│  │ ElevenLabs    │ Your Key ✓    │ [Edit][Remove]│  │
│  │ + Add Custom  │               │ [Configure]   │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Custom Provider (Add Any API)

**Flow:**
1. Klicka "+ Add Custom"
2. Ange: Namn, Base URL, Auth type, Headers
3. Definiera actions (endpoints)
4. Test connection
5. Spara

**Detta gör APIClaw till en universal API gateway** — inte bara våra providers.

---

## Datamodell (Convex)

### Nya tabeller:

```typescript
// apiLogs
{
  workspaceId: Id<"workspaces">,
  provider: string,
  action: string,
  status: "success" | "error",
  latencyMs: number,
  requestSize: number,
  responseSize: number,
  error?: string,
  createdAt: number,
}

// webhooks
{
  workspaceId: Id<"workspaces">,
  url: string,
  events: string[],
  secret: string,
  enabled: boolean,
  lastTriggeredAt?: number,
  createdAt: number,
}

// feedback
{
  workspaceId: Id<"workspaces">,
  type: "bug" | "feature" | "general",
  content: string,
  votes: number,
  status: "new" | "reviewing" | "planned" | "shipped",
  createdAt: number,
}

// providerKeys (BYOK)
{
  workspaceId: Id<"workspaces">,
  provider: string,
  encryptedKey: string,
  isCustom: boolean,
  customConfig?: {
    baseUrl: string,
    authType: string,
    headers: Record<string, string>,
  },
  createdAt: number,
}
```

---

## Implementation Plan

### Fas 1: Core Navigation
**Agent:** 1 (frontend)
- Lägg till nya tabs i sidebar
- Settings-sida med sektioner
- Feedback-formulär (basic)
- Placeholder för Logs, Webhooks, API Keys

### Fas 2: Logs
**Agent:** 1 (backend + frontend)
- Convex schema för apiLogs
- Logga alla Direct Call requests
- Frontend: tabell med filter

### Fas 3: BYOK
**Agent:** 1 (backend + frontend + crypto)
- Convex schema för providerKeys
- Encrypt/decrypt keys
- UI för add/edit/remove keys
- Modify executeAPICall to use user keys

### Fas 4: Webhooks
**Agent:** 1 (backend)
- Convex schema
- Webhook delivery system
- UI för manage webhooks

### Fas 5: Feedback System
**Agent:** 1 (full-stack)
- Voting system
- Admin view för triage

---

## Agenter

| Fas | Agent | Scope |
|-----|-------|-------|
| 1 | `nav-expansion` | Sidebar, Settings, Feedback placeholder |
| 2 | `logs-system` | apiLogs backend + frontend |
| 3 | `byok-system` | providerKeys + UI + execution |
| 4 | `webhooks` | Webhook delivery |
| 5 | `feedback-full` | Voting + admin |

**Total: 5 agenter, sekventiellt**

---

## Framtidssäkring

### BYOK som competitive moat:

1. **Lock-in prevention:** Användare kan alltid ta med sina nycklar
2. **Enterprise-ready:** Compliance teams älskar BYOK
3. **Extensibility:** Custom providers = infinite APIs
4. **Hybrid model:** Börja med Direct Call, migrera till BYOK när de växer

### Monetization alignment:

- **Free:** Direct Call (50 calls)
- **Pro:** Direct Call (10k calls) + BYOK
- **Enterprise:** BYOK only, self-hosted option

---

## Attestering

Svara **"kör fas 1"** för att starta med navigation expansion.

Eller **"kör alla"** för att köra fas 1-5 sekventiellt.
