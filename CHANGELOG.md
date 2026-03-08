# Changelog

All notable changes to APIClaw.

## [Unreleased]

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
- **`mcp-install` command** — One command setup: `npx @nordsym/apiclaw mcp-install`

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
