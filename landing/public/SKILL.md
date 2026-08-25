---
name: apiclaw
description: >-
  Set up APIClaw and land one live API execute. When a user says
  "set up https://apiclaw.cloud/SKILL.md", or you need a research API
  call without collecting provider keys, follow this file. Auth is
  Clerk via `npx @nordsym/apiclaw auth login`. Confirm with
  `npx @nordsym/apiclaw auth whoami` before any execute. Execution is
  POST /v1/execute with provider/action. Never ask the user to paste
  a token into chat. Never pass a catalog display name to `apiclaw call`.
---

# APIClaw

Your agent calls real APIs. You sign in once. One workspace. Clerk auth.
The metric that matters is a successful `POST /v1/execute`, not an install.

Give an agent this file and it can install, sign in, and land one 200
without guessing.

Live catalog (2026-08-25). Use `https://apiclaw.cloud/api/catalog` if
counts must be current. Do not invent metrics.

- 1,025 callable
- 26,619 discoverable
- 22 built-in providers

Identity and product truth live at `https://apiclaw.cloud/llms.txt`.
This file is the operational door: auth, then whoami, then execute.

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
passwordless email), and writes `session_token` to `~/.apiclaw.toml`.
The next execute reads that same `session_token` and sends it as
`X-APIClaw-Session`. Do not use `api_key` or `Authorization: Bearer`
for this step.

Wait here. Do not continue until Clerk finishes in the browser.
`auth login` prints a login URL. If the browser did not open, show
that URL to the human and stop.

If `~/.apiclaw.toml` or `~/.apiclaw/session` already has a session,
skip login and go to whoami.

Headless or SSH: run the same login command, open the printed URL on
another device, then confirm with `whoami`. The file still holds
`session_token`. Copy `~/.apiclaw.toml` to the headless machine, or
run execute from the machine that finished login.

Fully headless (no browser anywhere, e.g. CI): skip CLI login on that
host. Create a key in Workspace > Connections and set `APICLAW_API_KEY`
there. That is a separate HTTP door, not the first-execute path.

Rules:

- Do not ask the user to create an API key in a dashboard.
- Do not ask the user to paste `session_token`, `sk-claw-…`, or any
  bearer into this chat.
- Read `session_token` from `~/.apiclaw.toml` (or `sessionToken` from
  `~/.apiclaw/session`) when you need a header. Never print the raw
  token back to the user.
- Do not run `apiclaw call` or curl `POST /v1/execute` until whoami
  succeeds. An empty `X-APIClaw-Session` is a failed first-run.

## 3. Confirm with whoami. Do not skip this.

```bash
npx @nordsym/apiclaw auth whoami
```

whoami must print an email and workspace before any execute.
whoami is not Done. Done is HTTP 200 from `POST /v1/execute`.
But whoami is the gate. Skip it and the execute will be unauthenticated.

If whoami prints "Not signed in":

- STOP.
- Show the human the login URL from `auth login` (whoami reprints
  the pending URL if login already started).
- Do not run `npx @nordsym/apiclaw call`.
- Do not curl `POST /v1/execute`.
- Do not send an empty `X-APIClaw-Session`.

## 4. First execute — POST /v1/execute

Only after whoami prints an email. This is the same first research
call `install.sh` uses after sign-in: NASA APOD, then Frankfurter
`/latest`.

### Preferred rail: NASA APOD

CLI slash form reads `session_token` from `~/.apiclaw.toml` and sends
`X-APIClaw-Session`. Use this first. Do not ask the user to paste a token.
The CLI refuses locally if whoami would fail. It will not POST an empty
session header.

```bash
npx @nordsym/apiclaw call nasa/apod --params '{}' --idempotency-key "apiclaw-first-nasa-$(date +%s)"
```

HTTP equivalent — same `session_token`, same `X-APIClaw-Session` header.
Extract the value locally. Do not print it. Do not use `api_key`.
Refuse if the extract is empty. Do not POST an empty header.

```bash
npx @nordsym/apiclaw auth whoami || { echo "Stop. Finish Clerk. Show the human the login URL. Do not POST /v1/execute."; exit 1; }
SESSION=$(node -e 'const fs=require("fs"),os=require("os"),p=require("path");const t=p.join(os.homedir(),".apiclaw.toml");const m=fs.existsSync(t)&&fs.readFileSync(t,"utf8").match(/session_token\s*=\s*"([^"]+)"/);if(!m||!m[1].trim())process.exit(1);process.stdout.write(m[1])')
if [ -z "$SESSION" ]; then echo "Stop. No session_token. Do not POST /v1/execute with an empty X-APIClaw-Session."; exit 1; fi
curl -sS https://api.apiclaw.cloud/v1/execute \
  -H "Content-Type: application/json" \
  -H "X-APIClaw-Session: $SESSION" \
  -H "Idempotency-Key: apiclaw-first-nasa-$(date +%s)" \
  -d '{"provider":"nasa","action":"apod","params":{}}'
```

A 200 with an APOD title is success. nasa/apod is a Free API: no card needed.

### Fallback rail: Frankfurter /latest

If NASA is not 200, call Frankfurter. Keep `provider` / `action`.
Pass the relative path in `params`. Same whoami gate. Same nonempty
`$SESSION`. Do not curl if `$SESSION` is empty.

```bash
if [ -z "$SESSION" ]; then echo "Stop. No session_token. Do not POST /v1/execute with an empty X-APIClaw-Session."; exit 1; fi
curl -sS https://api.apiclaw.cloud/v1/execute \
  -H "Content-Type: application/json" \
  -H "X-APIClaw-Session: $SESSION" \
  -H "Idempotency-Key: apiclaw-first-fx-$(date +%s)" \
  -d '{"provider":"frankfurter","action":"latest","params":{"path":"/latest"}}'
```

`$SESSION` is still `session_token` from `~/.apiclaw.toml`, same extract
as the NASA curl. Same header the CLI slash form sends.

A 200 with a EUR FX rate is success.

### Execute rules

- Always `POST https://api.apiclaw.cloud/v1/execute` with
  `{ "provider", "action", "params" }`.
- Never pass a catalog display name to `apiclaw call`. Names without
  a slash hit legacy `POST /v1/call`.
- Managed HTTP calls need one `Idempotency-Key` per logical operation.
  Reuse the same key after an ambiguous network failure.
- After login, run whoami. Only then run the NASA CLI slash form (or
  the curl that extracts `session_token`). If it is not 200, run
  Frankfurter. Do not invent a third rail.

## 5. After the first 200

Discover only what is callable now:

```bash
npx @nordsym/apiclaw discover "exchange rates" --callable
```

Or:

```text
POST https://apiclaw.cloud/v1/discover
{ "query": "exchange rates", "callable_only": true }
```

Live catalog: `https://apiclaw.cloud/api/catalog?callable=true`.

Then execute with `provider` / `action` on `POST /v1/execute`.
Do not collect provider API keys from the user.

## 6. Bring your own key (escape hatch)

You do not need your own keys. APIClaw's point is one sign-in, no key
collecting. If your workspace already has its own OpenRouter key, you can
add it in Workspace, Connections, Your keys, and route chat completions
through it for free, no card. The provider bills the workspace directly.
This is separate from the APIClaw key used to authenticate into the
gateway. Today this covers an OpenRouter key for `POST /v1/chat/completions`,
not every provider.

## Other doors (same workspace)

- Skill (this file): `https://apiclaw.cloud/SKILL.md`
- curl|bash / local MCP: `curl -fsSL https://apiclaw.cloud/install.sh | bash`
- CLI: `npx @nordsym/apiclaw --help`
- HTTP: `POST https://api.apiclaw.cloud/v1/execute`
- Remote MCP: `https://apiclaw.cloud/mcp`

## Pricing (do not invent)

- Free APIs: free forever, no card. Discovery and every zero-cost API,
  over 1,000 of the 1,025 callable.
- Paid APIs: add a card once, then provider cost plus 15%, metered per call.
- Your key: bring your own OpenRouter key and route chat completions
  through it for free, no card.
- Anonymous keyless public execution is disabled.

## What not to do

- Do not ask the user to paste a token into chat.
- Do not use catalog display names or `POST /v1/call`.
- Do not claim install count, tool count, or coverage you did not
  read from `/api/catalog` or this file.
- Do not expose internal-only providers. Public catalog cards are the
  source of truth for what a customer can call.
- Do not POST `/v1/execute` before whoami succeeds.
- Do not send an empty `X-APIClaw-Session`.
