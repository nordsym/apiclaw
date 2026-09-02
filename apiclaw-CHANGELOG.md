---
nord_type: NOTE
nord_owner: APIClaw
nord_status: LIVE
---

# Changelog

All notable changes to APIClaw.

## [Unreleased]

## [2.9.11] — 2026-09-02

### Fixed — unsigned first contact leads with the bare https login URL

- **Every unsigned MCP/CLI/ACP result now starts with the absolute `https://apiclaw.cloud/auth/cli…` URL as line 1** (and as its own first MCP content block). JSON is a separate third content block — never in the same text as the URL. The old "Open this login URL:" label plus a large JSON blob let Grok Bot / cloud / headless agents summarize the URL away.
- **Unsigned `tools/list` prefixes every tool description with that same bare URL.** Yesterday’s 2.9.10 human (`DESKTOP-A25E24:devuser`) hit `first_run` 2s after install with no tool-call or login events — connect-only harnesses never saw a URL.
- **Hard-stop copy is explicit:** `STOP. Show the human the login URL on the first line. Do not summarize it away. Do not execute.` After Authorize, retry in this same chat (whoami, then NASA APOD / Frankfurter). Do not send the human to a terminal.
- **SKILL.md / agents.md / llms.txt:** do not run `auth login` on a machine the human cannot see. The first-line URL is the door. `call_api` no longer says "do not retry this tool" without "until they Authorize, then retry here."
- **`/auth/cli/done` leftover from #36:** the solid "Open workspace" button no longer owns the post-Authorize step. Headline stays "Go back to your agent"; workspace is a quiet optional link. The first call happens in that chat.

## [2.9.10] — 2026-09-01

### Fixed — unsigned first contact always shows a clickable login URL

- **MCP/CLI/ACP/SKILL unsigned responses lead with the absolute https login URL on its own line**, then JSON. Agents can no longer bury `login_url` inside a JSON-only tool result. Desktop auto-open on darwin/win32 is unchanged.
- **Every unsigned MCP tool call hard-stops** until whoami has a session. `list_categories`, `get_api_details`, `list_connected`, and other first-contact tools no longer succeed silently without showing a login URL.
- If Convex mint fails, the fallback URL is still `https://apiclaw.cloud/auth/cli` (never bare `/sign-in`). After sign-in, first execute stays NASA APOD then Frankfurter.

## [2.9.9] — 2026-08-31

### Fixed — unsigned MCP first_run opens Clerk on a GUI

- **Desktop / GUI machines open the minted `/auth/cli?authId=` URL** on unsigned first_run and unsigned execute (`unsignedFirstRunToolResult`, `agentAuthRequiredPayloadAfterMint`). MCP on Cursor / Claude Desktop has no TTY; darwin, win32, or `DISPLAY` / `WAYLAND_DISPLAY` is enough. CI, GitHub Actions, and `APICLAW_SKIP_AUTH` still mint `login_url` and return `isError` without spawning a browser.
- Reuse of an open pending login still opens the browser when the GUI rule matches, so a later tool call pops Clerk again.

## [2.9.8] — 2026-08-31

### Fixed — honest funnel classification

- **`classifySource` treats scanner / GitHub Actions fingerprints as bot or ci**, not human. Live rows that were inflating human installs: `scan-<hex>:scan`, `detonation-server-*:nonroot`, `<hex>:runner`, `instance:<id>`. `DESKTOP-*:devuser` stays human. `getFunnel` / `getScorecard` re-resolve classification on read so existing scanner rows stop counting as users.

### Fixed — unsigned first_run is an error with a live Clerk URL

- **MCP/CLI unsigned first_run and execute return `isError` + `status: auth_required`**. The primary visible field is `login_url` (`https://apiclaw.cloud/auth/cli?authId=…`). Agents cannot treat first_run as success. Minting still happens without a TTY.

## [2.9.7] — 2026-08-31

### Changed — first execute after Authorize

- **NASA APOD stays the default first execute** (research-shaped, verified zero-cost, no card). Convex injects `NASA_API_KEY` when set and falls back to NASA's public `DEMO_KEY` so APOD still lands if the managed key is missing.
- **Frankfurter latest stays the last-resort fallback** (workspace-public, no key, no card). The live catalog origin is `api.frankfurter.dev/v1`; path `/latest` pins to `/v1/latest` (200, no redirect). Brave / Serper / Firecrawl are billed and card-gated — they are not first-execute rails.
- **SKILL.md / llms.txt / MCP first-call copy** now match the automatic rails: after Authorize, whoami, then NASA APOD, then Frankfurter. Agents are no longer sent to Brave for first execute.

---

## [2.7.0] — 2026-05-17

### Added — Missions v2 architecture (data-driven primitives)

- **Five typed primitives** as the building blocks of every mission: `fetch`, `transform`, `decide`, `validate`, `execute`. Implementations live in `convex/missionRunner.ts`; types + validators in `convex/missionPrimitives.ts`.
- **`missionTemplates` table** for data-driven compositions. Versioned (slug + version pinned per mission row), ownership-scoped (private / public / marketplace), with mustache-style bindings (`{{params.X}}`, `{{steps.Y.output.Z}}`, `{{env.NAME}}`) threading values through `mission.state`.
- **`runV2` executor** walks template steps, dispatches per primitive, persists one `missionEvents` + outbound `apiLogs` row per external call, applies the existing 15%-margin / internal-zero pricing rule, halts on `budgetUsd` overrun.
- **Managed-provider auto-attribution**: when a step's `apiLog` provider tag matches a row in `providers`, the runner writes both an outbound row on the caller workspace and an inbound row on the provider-owner workspace. Generalises the per-product `logGenPRDCall` pattern to every managed provider automatically.
- **`prd-generation v1` template**: first data-driven mission template (fetch → rules-mode validate). End-to-end smoke against prod returns a real Markdown PRD via the v2 pipeline. Legacy `genprd` slug aliases to it via `TEMPLATE_SLUG_ALIASES`.
- **Web Crypto AES-256-GCM decryption on Convex** for the `execute` primitive — matches `src/crypto.ts` format. Requires `APICLAW_KEY_ENCRYPTION_SECRET` in Convex env (set 2026-05-17). Smoke verified end-to-end against GenPRD's managed routing.

### Added — Discovery upgrades

- **`discover_apis` defaults `callable_only=true`** — filter pushed into `discoverAPIs` itself so MCP / HTTP / Vercel all share one source of truth. Smoke `"send sms"` went from 7/10 non-callable to 10/10 callable.
- **Live success-rate scoring**: new `providerHealth` Convex table + hourly aggregate cron over 30 days of outbound `apiLogs`. MCP discovery fetches the health map every 15 min and applies a `[0.5, 1.0]` multiplier × latency penalty. 26 providers currently scored from ~4,800 logs; `brave_search` at 80 % success now down-ranks automatically.
- **Managed providers surface in `discover_apis`**: new `providerDiscovery:listForDiscovery` query exposes live + managed + active `providerAPIs` rows to the MCP-side scanner. GenPRD now ranks #1 for `"generate PRD product"` (47.7); NASA #1 for `"NASA satellite imagery"` (43). Closes the gap where managed providers were invisible to agent semantic search.
- **`discover_missions` MCP tool + HTTP route** for ranked template discovery. Keyword score × weakest-link `providerHealth` multiplier across each template's step providers. Available on both Local and Remote MCP doors.

### Added — Door parity

- **Local MCP gains `list_models`** so the local door matches Remote MCP's model-catalog surface.
- **Remote MCP gains `discover_missions` + `template_version` on `start_mission`** so the remote door matches Local MCP's mission surface.
- Auth tools (`register_owner`, `verify_code`, `purchase_access`, `add_credits`, `remind_owner`, `setup_metered_billing`) remain Local-only by design — Remote MCP uses OAuth 2.1 + DCR.

### Changed — Canon

- **Canon-managed comms providers removed from callable surface**: Twilio, Resend, 46elks dropped from `DIRECT_CALL_SPECS` + `PROXY_PROVIDERS`. 36 Twilio-* / Resend / 46elks registry rows flipped to `callable: false`. They remain discoverable; system OTP-mail flow (`src/index.ts:2668`) intact. Net callable count: 2,895 → 2,872.
- **`DIRECT_CALL_SPECS` → `MANAGED_PROVIDER_SPECS`** in `src/discovery.ts` to align with the 2026-04-15 canon retiring the "Direct Call tier" label.
- **`proxyMode: "direct_call"` → `proxyMode: "managed"`** with backfill (48 rows patched, readers accept both during transition).
- **86 prose references** to "Direct Call" / "direct call" / "direct-call" rewritten across 21 files to canonical "managed-provider" / "managed" phrasing.
- **File renames**: `convex/directCall.ts` → `convex/managedRouting.ts`, `convex/seedDirectCallConfigs.ts` → `convex/seedManagedRouting.ts`. Backwards-compat shim `convex/directCall.ts` re-exports from the new module so legacy npm-install function-path lookups (`directCall:getByApiSlug` etc.) keep resolving.

### Fixed — security

- **Encrypted 17 plaintext upstream-provider keys** that were stored raw in `providerDirectCall.encryptedMasterKey`: Resend, Brave, OpenRouter, ElevenLabs, Replicate, GitHub, Groq, Deepgram, Serper, Cohere, Stability AI, 46elks, Firecrawl, E2B, Mistral, Together AI, AssemblyAI. Each row re-encrypted with `src/crypto.ts.encryptKey` (12-byte IV AES-GCM); plaintext never left the developer's machine.
- **5 placeholder rows** (`""`, `":"`, `"YOUR_TWILIO_SID:..."`) set to `status="draft"` so `/v1/call` refuses to route through them.
- **IV format alignment**: `src/crypto.ts` switched from 16-byte to 12-byte IVs (Web Crypto standard for AES-GCM). Node-side decryption stays compatible with both. One-shot migration script (`scripts/migrate-iv-format.mjs`) re-encrypts any remaining 16-byte-IV rows.

### Fixed

- **Usage-report email leak**: `usageReports.getReportableWorkspaces` now respects the nurture `partner-locked` / `excluded` stages, closing the weekly/monthly cron that was hitting `apilayer.com` and other partner workspaces.
- **`modelCatalog.refresh` typecheck**: explicit return type annotation breaks the self-reference inference cycle that had been emitting silent TS7022/TS7023 errors.
- **`verifyGenPRD` lookup**: aligned to the actual seeded name `"GenPRD"` (was `"GenPRD — PRD Generator"`).
- **`providerHealth.aggregate` p50 latency**: filter zero-latency rows so the median reflects real timing only.

### Internal

- Convex backfills: 48 `proxyMode` rows + 17 plaintext-key rows + 5 placeholder draft-marks.
- New Convex tables: `missionTemplates`, `providerHealth`.
- New Convex modules: `missionRunner`, `missionPrimitives`, `providerHealth`, `providerDiscovery`, `managedRouting` (renamed from `directCall`), `seedManagedRouting` (renamed from `seedDirectCallConfigs`), `seedGenPRD`.
- Canon-stats: `callable: 2_895 → 2_872`; landing hero strings refactored to read from `statsData` so future canon refreshes don't need string-jagar.

### Upgrade

```
npx -y @nordsym/apiclaw@2.7.0
```
…or restart Claude Desktop / Cursor to pull the latest via your existing `npx` MCP config. `.mcpb` users: re-download from apiclaw.cloud after the next Vercel deploy.

---

## [2.5.1] — 2026-04-23

### Fixed — production hotfix

- **`src/proxy.ts` was pointing to dev deployment.** `PROXY_BASE` updated from `brilliant-puffin-712.eu-west-1.convex.site/proxy` → `adventurous-avocet-799.convex.site/proxy`. This was the root cause of managed-provider calls through the legacy `callProxy()` path returning 403 / "not configured" errors. All users on 2.5.0 who hit this code path were silently routed to dev.
- **`nasa` added to `PROXY_PROVIDERS`** so the `callProxy()` fallback is allowed to dispatch NASA calls.

### Added

- NASA is live in the managed lane for all users. Managed adapter count: 47. Callable APIs: 1,679.

Upgrade: `npx -y @nordsym/apiclaw@2.5.1` or Claude Desktop restart (pulls `@latest`).

---

## [Historical unreleased — server-side only notes]

### Server-side (unchanged by 2.5.1 client bump; listed for completeness)

- **NASA promoted to managed lane.** `/proxy/nasa` adapter live on Convex prod; managed key injected server-side; SSRF pinned to `api.nasa.gov`.
  - Verified: `/planetary/apod` (APOD), `/neo/rest/v1/feed` (NEO)
  - Mars Rover Photos (`/mars-photos/api/v1/...`) returns upstream 404 from NASA — endpoint retired on their side.
- **NASA Image and Video Library** added as keyless open-proxy (`images-api.nasa.gov`) for image/video search. Verified: 100 Apollo 11 results on smoke.
- **NASA row description** rewritten to steer agents toward working endpoints (APOD, NEO, EPIC, insight_weather, Image Library) and away from retired ones.
- **Legacy BYOK module removed** (`convex/providerKeys.ts`). APIClaw canon is zero-config: managed-key or discovery-only.
- Managed adapter count: 46 → 47. Callable rows: 1,678 → 1,679.

Client package `@nordsym/apiclaw@2.5.0` is unchanged — a restart of the MCP host (e.g. Claude Desktop) is sufficient to surface the new NASA entries.

---

## [1.6.0] - 2026-03-27

### Added
- **APILayer Legacy APIs** — 13 new APIs integrated:
  - **Finance (6):** Fixer, Currencylayer, Coinlayer, Exchangerate.host
  - **Geolocation (5):** Weatherstack, IPstack, IPapi, Positionstack, Languagelayer
  - **Scraping (2):** Scrapestack, Serpstack
  - **News (1):** Mediastack
  - **DevTools (1):** Userstack
- Total APILayer expansion: 14 → 27 APIs

### Changed
- `credentials.ts` now reads both `apilayer.env` and `apilayer-legacy.env`
- All legacy APIs consolidated under single `apilayer` provider
- 20 new actions added to APILayer handler

---

## [1.5.19] - 2026-03-26

### Fixed
- `doctor` connectivity check now uses resilient fallbacks:
  - `${APICLAW_API_URL}/health`
  - `https://apiclaw.cloud`
  - Convex auth endpoint (`/workspace/poll`)
- Convex auth endpoint `HTTP 400` is now treated as a valid reachability signal in `doctor`.
- Setup/network guidance now points to live docs and domain paths on `apiclaw.cloud`.

---

## [0.4.0] - 2026-03

### Added
- **Dry-run mode** — Test API calls without execution. Validate params, check auth, see what would happen.
- **Auto retry** — Transient failures (429, 503, timeouts) automatically retry with exponential backoff.
- **Error codes** — Standardized error responses across all providers. `RATE_LIMITED`, `AUTH_FAILED`, `INVALID_PARAMS`, etc.

### Improved
- Better error messages with actionable suggestions
- Retry logic respects provider-specific rate limit headers

---

## [0.3.0] - 2026-03

### Added
- **Multi-client support** — Works with Claude Desktop, Cursor, Windsurf, Cline, and Continue
- **Usage logs** — Track API calls, costs, and success rates in your dashboard
- **18 Direct Call providers** — Full proxy support for:
  - Replicate, OpenRouter, ElevenLabs, 46elks, Twilio
  - Resend, Brave Search, Firecrawl, E2B, GitHub
  - Groq, Deepgram, Serper, Mistral, Cohere
  - Together AI, Stability AI, AssemblyAI

### Improved
- `mcp-install` now auto-detects client and configures accordingly
- Dashboard shows real-time usage across all clients

---

## [0.2.0] - 2026-02

### Added
- **Workspace & Dashboard** — Manage your API usage, view logs, configure settings
- **Auth with Magic Link** — No passwords. Email link, you're in.
- **`mcp-install` command** — One command setup: `curl -fsSL https://apiclaw.cloud/install.sh | bash`

### Improved
- Simplified onboarding flow
- Better MCP server configuration

---

## [0.1.0] - 2026-02

### Added
- Initial release
- MCP server for API discovery and execution
- `discover_apis` — Search 22,000+ APIs by capability
- `get_api_details` — Full API specifications
- `call_api` — Direct execution through proxy
- `list_connected` — See available Direct Call providers

---

## Versioning

We use [SemVer](https://semver.org/). Given version `MAJOR.MINOR.PATCH`:

- **MAJOR** — Breaking changes to MCP interface
- **MINOR** — New features, new providers, backward compatible
- **PATCH** — Bug fixes, performance improvements

---

## Links

- [Documentation](https://apiclaw.cloud/docs)
- [GitHub](https://github.com/nordsym/apiclaw)
- [npm](https://npmjs.com/package/@nordsym/apiclaw)

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
