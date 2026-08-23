---
name: apiclaw
description: >-
  Set up APIClaw and land one live API execute. When a user says
  "set up https://apiclaw.cloud/SKILL.md", or you need a research API
  call without collecting provider keys, follow this file. Auth is
  Clerk via `npx @nordsym/apiclaw auth login`. Execution is
  POST /v1/execute with provider/action. Never ask the user to paste
  a token into chat. Never pass a catalog display name to `apiclaw call`.
---

# APIClaw

APIClaw is a live agent-native control plane. One workspace. Clerk auth.
The metric that matters is a successful `POST /v1/execute`, not an install.

Give an agent this file and it can install, sign in, and land one 200
without guessing.

Live catalog (2026-08-22). Use `https://apiclaw.cloud/api/catalog` if
counts must be current. Do not invent metrics.

- 1,025 callable
- 26,619 discoverable
- 22 managed adapters

Identity and product truth live at `https://apiclaw.cloud/llms.txt`.
This file is the operational door: auth, then execute.

## 1. Install

Node.js 18+ and `npx` are enough. A global install is optional.

```bash
npx -y @nordsym/apiclaw@latest --version
```

Human shell door (same package, local MCP):

```bash
curl -fsSL https://apiclaw.cloud/install.sh | bash
```

## 2. Auth (Clerk). Never paste a token into chat.

```bash
npx @nordsym/apiclaw auth login
```

That opens the browser, signs the user in with Clerk (Google or
passwordless email), and writes `~/.apiclaw.toml`.
That file also holds `api_key` (`sk-claw-…`), export it as `APICLAW_API_KEY` for non-interactive use.

If `~/.apiclaw.toml` or `~/.apiclaw/session` already has a session,
skip login and confirm:

```bash
npx @nordsym/apiclaw auth whoami
```

Headless or SSH: run the same login command, open the printed URL on
another device, then confirm with `whoami`.

Rules:

- Do not ask the user to create an API key in a dashboard.
- Do not ask the user to paste `session_token`, `sk-claw-…`, or any
  bearer into this chat.
- Read credentials from `~/.apiclaw.toml` (`session_token`) or
  `~/.apiclaw/session` when you need a header. Never print the raw
  token back to the user.

## 3. First execute — POST /v1/execute

whoami is not Done. Done is HTTP 200 from `POST /v1/execute`.
This is the same first research call `install.sh` uses after sign-in:
NASA APOD, then Frankfurter `/latest`.

### Preferred rail: NASA APOD

```bash
curl -sS https://api.apiclaw.cloud/v1/execute \
  -H "Content-Type: application/json" \
  -H "X-APIClaw-Session: $SESSION" \
  -H "Idempotency-Key: apiclaw-first-nasa-$(date +%s)" \
  -d '{"provider":"nasa","action":"apod","params":{}}'
```

Set `$SESSION` from `session_token` in `~/.apiclaw.toml`. Do not ask
the user to paste it.
Equivalent: `Authorization: Bearer $APICLAW_API_KEY`

CLI slash form also maps to `POST /v1/execute`:

```bash
npx @nordsym/apiclaw call nasa/apod --params '{}' --idempotency-key "apiclaw-first-nasa-$(date +%s)"
```

A 200 with an APOD title is success.

### Fallback rail: Frankfurter /latest

If NASA is not 200, call Frankfurter. Keep `provider` / `action`.
Pass the relative path in `params`.

```bash
curl -sS https://api.apiclaw.cloud/v1/execute \
  -H "Content-Type: application/json" \
  -H "X-APIClaw-Session: $SESSION" \
  -H "Idempotency-Key: apiclaw-first-fx-$(date +%s)" \
  -d '{"provider":"frankfurter","action":"latest","params":{"path":"/latest"}}'
```

A 200 with a EUR FX rate is success.

### Execute rules

- Always `POST https://api.apiclaw.cloud/v1/execute` with
  `{ "provider", "action", "params" }`.
- Never pass a catalog display name to `apiclaw call`. Names without
  a slash hit legacy `POST /v1/call`.
- Managed HTTP calls need one `Idempotency-Key` per logical operation.
  Reuse the same key after an ambiguous network failure.
- After login, run the NASA curl above. If it is not 200, run Frankfurter.
  Do not invent a third rail.

## 4. After the first 200

Discover only what is callable now:

```bash
npx @nordsym/apiclaw discover "exchange rates" --callable
```

Or:

```text
POST https://api.apiclaw.cloud/v1/discover
{ "query": "exchange rates", "callable_only": true }
```

Live catalog: `https://apiclaw.cloud/api/catalog?callable=true`.

Then execute with `provider` / `action` on `POST /v1/execute`.
Do not collect provider API keys from the user.

## Other doors (same workspace)

- Skill (this file): `https://apiclaw.cloud/SKILL.md`
- curl|bash / local MCP: `curl -fsSL https://apiclaw.cloud/install.sh | bash`
- CLI: `npx @nordsym/apiclaw --help`
- HTTP: `POST https://api.apiclaw.cloud/v1/execute`
- Remote MCP: `https://apiclaw.cloud/mcp`

## Pricing (do not invent)

- Free: up to 25 managed calls for the lifetime of the workspace,
  subject to a $1 total underlying provider-cost cap.
- Discovery is free after signup.
- Pay as you go: billing-ready managed actions at provider cost plus 15%.
- Anonymous keyless public execution is disabled.

## What not to do

- Do not ask the user to paste a token into chat.
- Do not use catalog display names or `POST /v1/call`.
- Do not claim install count, tool count, or coverage you did not
  read from `/api/catalog` or this file.
- Do not expose internal-only providers. Public catalog cards are the
  source of truth for what a customer can call.
