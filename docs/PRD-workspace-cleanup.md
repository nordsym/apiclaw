# PRD: Workspace Navigation Cleanup

## Problem

Nuvarande navigation är förvirrande:
- "APIs" och "My APIs" — vad är skillnaden?
- "Agents" och "My Agents" — samma sak?
- "Usage" och "Logs" — borde vara under Analytics
- Provider Dashboard existerar separat — borde vara i Workspace

---

## FÖRE (Nu)

```
┌─────────────────────────────────────┐
│  APIClaw                            │
│  gustav@nordsym.com                 │
│  Free · 50/50 calls                 │
├─────────────────────────────────────┤
│  ○ Overview                         │
│  ○ APIs          ← TOM, förvirrande │
│  ○ Agents                           │
│  ○ Logs                             │
│  ○ Analytics ▼                      │
│    ├─ My APIs    ← Duplicat?        │
│    └─ My Agents  ← Duplicat?        │
│  ○ Usage         ← Borde vara under │
│  ○ Webhooks          Analytics      │
│  ○ API Keys                         │
│  ○ Earn Credits                     │
│  ○ Docs                             │
│  ○ Feedback                         │
├─────────────────────────────────────┤
│  ⚙ Settings                         │
│  ☀ Theme                            │
│  → Sign Out                         │
└─────────────────────────────────────┘

Separat: /providers/dashboard (ghost)
```

---

## EFTER (Mål)

```
┌─────────────────────────────────────┐
│  APIClaw                            │
│  gustav@nordsym.com                 │
│  Free · 50/50 calls                 │
├─────────────────────────────────────┤
│  ○ Overview                         │
│  ○ API Catalog   ← Alla APIs att    │
│                     anropa          │
│  ○ My Agents     ← Dina agenter     │
│  ○ My APIs       ← Dina listade     │
│                     APIs (om några) │
│  ○ Analytics ▼                      │
│    ├─ Overview   ← Grafer, trends   │
│    ├─ Usage      ← Calls, limits    │
│    └─ Logs       ← API call history │
│  ○ Webhooks                         │
│  ○ API Keys                         │
├─────────────────────────────────────┤
│  ○ Earn Credits                     │
│  ○ Docs                             │
│  ○ Feedback                         │
├─────────────────────────────────────┤
│  ⚙ Settings                         │
│  ☀ Theme                            │
│  → Sign Out                         │
└─────────────────────────────────────┘

/providers/dashboard → BORTA
(funktionalitet i "My APIs" tab)
```

---

## Tab-förklaringar

### API Catalog (tidigare "APIs")
**Visar:** Alla 13+ tillgängliga Direct Call APIs
**Syfte:** Upptäck APIs du kan anropa med dina agenter

```
┌─────────────────────────────────────────────────────┐
│  API Catalog                         13 available   │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐    │
│  │ 🔍 Brave Search          Search             │    │
│  │ Privacy-focused web search                  │    │
│  │ ● Direct Call Ready                         │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │ 🤖 OpenRouter LLM        AI & LLM           │    │
│  │ Access 100+ LLMs through one API            │    │
│  │ ● Direct Call Ready                         │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │ 📧 Resend Email          Email              │    │
│  │ Modern email API for developers             │    │
│  │ ● Direct Call Ready                         │    │
│  └─────────────────────────────────────────────┘    │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

### My Agents (tidigare "Agents")
**Visar:** Dina uppkopplade agenter
**Syfte:** Hantera agenter som använder APIClaw

```
┌─────────────────────────────────────────────────────┐
│  My Agents                              2 total     │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐    │
│  │ Gustavs-MacBook-Air                         │    │
│  │ Last active: 2 min ago                      │    │
│  │                      [Rename] [Revoke]      │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### My APIs (NY — flyttad från Provider Dashboard)
**Visar:** APIs DU har listat för andra att använda
**Syfte:** Bli en API-provider

```
┌─────────────────────────────────────────────────────┐
│  My APIs                                0 listed    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  You haven't listed any APIs yet.                   │
│                                                     │
│  List your API to let other agents discover and     │
│  call it through APIClaw.                           │
│                                                     │
│  [+ List New API]                                   │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  Benefits:                                          │
│  • Reach 1000s of AI agents                         │
│  • Direct Call = we handle keys                     │
│  • Analytics on who's using your API                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Analytics (dropdown)
**Subtabs:** Overview, Usage, Logs

```
Analytics ▼
├── Overview   → Grafer, trends, top APIs
├── Usage      → 23/50 calls, reset date, history
└── Logs       → Timestamp, provider, status, latency
```

---

## Vad tas bort

| Route | Åtgärd |
|-------|--------|
| `/providers/dashboard` | TA BORT — logik till "My APIs" |
| `/providers/dashboard/[apiId]` | TA BORT |
| `/providers/register` | BEHÅLL — redirect till workspace |
| `/providers/page.tsx` | BEHÅLL — info page |

---

## Convex-ändringar

**Inga breaking changes.** Samma backend, bara frontend-reorganisering.

| Query/Mutation | Ändring |
|----------------|---------|
| `providers:getApprovedAPIs` | Används av "API Catalog" |
| `providers:getProviderAPIs` | Används av "My APIs" |
| Övriga | Oförändrade |

---

## Implementation

**1 agent**, gör allt:
1. Uppdatera sidebar-struktur
2. Rename tabs, flytta subtabs
3. API Catalog → hämta ALLA approved APIs
4. My APIs → hämta provider APIs + "List API" flow
5. Ta bort /providers/dashboard routes
6. Testa, bygga, deploya

---

## Attestering

Svara **"kör"** för att starta.
