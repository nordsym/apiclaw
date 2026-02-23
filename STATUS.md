# APIClaw Status — Verifierad 21 Feb 2026, 17:15 CET

> **Denna fil är source of truth.** Uppdatera vid varje deploy/ändring.

---

## 📊 Snabbstatus

| Komponent | Status | Detaljer |
|-----------|--------|----------|
| **npm** | ✅ Live | `@nordsym/apiclaw@1.0.0` (publicerad 16 feb) |
| **Landing** | ✅ Live | https://apiclaw.nordsym.com |
| **Convex** | ✅ Deployat | `brilliant-puffin-712` |
| **API Registry** | ✅ 15,000 | Version 3.2.0, uppdaterad 22 feb |
| **Kategorier** | ✅ 446 | Auto-extraherade |

---

## 📦 npm Package

```
Package:    @nordsym/apiclaw
Published:  v1.0.0 (16 feb 2026)
Local:      v0.3.0 (package.json)
Registry:   https://registry.npmjs.org/@nordsym/apiclaw
```

**⚠️ Notera:** Lokal version (1.1.2) != publicerad (1.0.0). Vid nästa publish, bumpa till 1.2.0.

**Installation:**
```bash
npx @nordsym/apiclaw          # Kör direkt
npm install @nordsym/apiclaw  # Installera
```

---

## 🌐 Landing Page

| | |
|-|-|
| **URL** | https://apiclaw.nordsym.com |
| **Hosting** | Vercel |
| **Project** | `landing` (prj_PmUzn4YRoL3IIBcPai2TLuIFuScE) |
| **Status** | ✅ HTTP 200 |

**Deploy:**
```bash
cd ~/Projects/apiclaw/landing
npx vercel --prod
```

---

## 🗄️ Convex Backend

| | |
|-|-|
| **Deployment** | `brilliant-puffin-712` |
| **Dashboard** | https://dashboard.convex.dev/d/brilliant-puffin-712 |
| **Status** | ✅ Deployat |

**Tabeller:**
- `providers` — API-providers (0 docs)
- `providerAPIs` — Provider-listade API:er
- `apis` — Fullt managerade API:er
- `agentCredits` — Agent credit-balanser (0 docs)
- `purchases` — Köphistorik
- `apiCalls` — Användningsloggar
- `creditTopups` — Credit-påfyllningar
- `sessions` — Provider-sessioner
- `magicLinks` — Email-auth tokens
- `payouts` — Provider-utbetalningar

**⚠️ Env vars:** Inga satta på prod. Behövs för server-side Direct Call.

**Deploy:**
```bash
cd ~/Projects/apiclaw
npx convex deploy
```

---

## 🔍 API Registry

| | |
|-|-|
| **Fil** | `src/registry/apis.json` |
| **Antal API:er** | 15,000 |
| **Kategorier** | 446 |
| **Version** | 3.2.1 |
| **Senast uppdaterad** | 2026-02-22 |

**Struktur:**
```json
{
  "version": "3.2.1",
  "source": "apis.guru + manual curation",
  "lastUpdated": "2026-02-22",
  "count": 15000,
  "apis": [...]
}
```

---

## ⚡ Direct Call

**6 providers konfigurerade lokalt:**

| Provider | Action | Credentials | Status |
|----------|--------|-------------|--------|
| `46elks` | `send_sms` | `~/.secrets/46elks.env` | ✅ Lokal |
| `twilio` | `send_sms` | `~/.secrets/twilio.env` | ✅ Lokal |
| `brave_search` | `search` | `~/.secrets/brave.env` | ✅ Lokal |
| `resend` | `send_email` | `~/.secrets/resend.env` | ✅ Lokal |
| `openrouter` | `chat` | `~/.secrets/openrouter.env` | ✅ Lokal |
| `elevenlabs` | `text_to_speech` | `~/.secrets/elevenlabs.env` | ✅ Lokal |

**Kod:** `src/execute.ts`

**⚠️ Cloud-status:** Fungerar lokalt (läser env-filer). För cloud/hosted MCP behöver credentials lagras i Convex eller env vars.

---

## 🔧 MCP Tools (8 st)

| Tool | Beskrivning | Status |
|------|-------------|--------|
| `discover_apis` | Sök API:er efter capability | ✅ |
| `get_api_details` | Hämta full API-info | ✅ |
| `list_categories` | Lista alla kategorier | ✅ |
| `list_connected` | Visa Direct Call-providers | ✅ |
| `call_api` | Kör API via Direct Call | ✅ |
| `purchase_access` | Köp API-access | ✅ |
| `check_balance` | Kolla credits | ✅ |
| `add_credits` | Lägg till test-credits | ✅ |

---

## 📁 Projektstruktur

```
apiclaw/
├── src/                    # MCP Server (TypeScript)
│   ├── index.ts            # Huvudfil, MCP tool definitions
│   ├── discovery.ts        # Söklogik
│   ├── execute.ts          # Direct Call handlers
│   ├── credentials.ts      # Credential-hantering
│   ├── credits.ts          # Credit-system
│   ├── stripe.ts           # Stripe (förberett)
│   └── registry/
│       └── apis.json       # 15,000 API:er
│
├── landing/                # Next.js frontend
│   └── src/app/
│       ├── page.tsx        # Homepage
│       ├── providers/      # Provider-portal
│       └── admin/          # Admin-panel
│
├── convex/                 # Backend
│   ├── schema.ts           # Databasschema
│   ├── providers.ts        # Provider CRUD
│   └── credits.ts          # Credits
│
├── dist/                   # Kompilerad JS
├── package.json            # v0.3.0 (lokal)
├── STATUS.md               # DENNA FIL
└── README.md               # Dokumentation
```

---

## 🚀 Deploy Checklist

### Full deploy:
```bash
cd ~/Projects/apiclaw

# 1. Bygg
npm run build

# 2. Synka registry till landing
cp src/registry/apis.json landing/src/lib/
cd landing && node scripts/generate-stats.js && cd ..

# 3. Deploy Convex
npx convex deploy

# 4. Deploy Landing
cd landing && npx vercel --prod && cd ..

# 5. Publish npm (om ny version)
npm publish --access public
```

### Snabb landing-deploy:
```bash
cd ~/Projects/apiclaw
bash scripts/sync-and-deploy.sh
```

---

## ❌ Vad som INTE är klart

| Feature | Prioritet | Blocker |
|---------|-----------|---------|
| Stripe payments live | Medium | Behöver webhook setup |
| Provider dashboard med live data | Medium | Ingen data i Convex |
| Cloud Direct Call | Medium | Credentials ej i cloud |
| Rate limiting | Låg | — |
| Usage metering | Låg | Schema finns |

---

## 📈 Nästa steg (prioriterat)

1. ~~**Öka API-antal**~~ ✅ **DONE: 15,000 APIs reached!**
2. **Testa Direct Call E2E** — Verifiera alla 6 providers
3. **Stripe wiring** — Koppla betalflöde
4. **Launch prep** — PH, X thread, etc.

---

## 📝 Ändringslogg

| Datum | Ändring |
|-------|---------|
| 2026-02-22 | 🎉 **15,000 APIs milestone reached!** Registry v3.2.1 |
| 2026-02-22 | Kategorier konsoliderade: 572 → 446 |
| 2026-02-21 | STATUS.md skapad, verifierad mot prod |
| 2026-02-16 | npm v1.0.0 publicerad |

---

*Senast verifierad: 22 Feb 2026, kl 08:30 CET*
