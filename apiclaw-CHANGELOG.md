---
nord_type: NOTE
nord_owner: APIClaw
nord_status: LIVE
---

# Changelog

All notable changes to APIClaw.

## [Unreleased]

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
  - `https://apiclaw.nordsym.com`
  - Convex auth endpoint (`/workspace/poll`)
- Convex auth endpoint `HTTP 400` is now treated as a valid reachability signal in `doctor`.
- Setup/network guidance now points to live docs and domain paths on `apiclaw.nordsym.com`.

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
- **`mcp-install` command** — One command setup: `curl -fsSL https://apiclaw.nordsym.com/install.sh | bash`

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

- [Documentation](https://apiclaw.nordsym.com/docs)
- [GitHub](https://github.com/nordsym/apiclaw)
- [npm](https://npmjs.com/package/@nordsym/apiclaw)

---
*[[03 - Products/Apiclaw/Apiclaw|APIClaw]] · [[MOC|Production Line]]*
