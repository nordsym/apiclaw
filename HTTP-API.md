---
nord_type: NOTE
nord_owner: APIClaw
nord_status: LIVE
---

# APIClaw HTTP gateway

The supported HTTP surface is the hosted APIClaw gateway at `https://api.apiclaw.cloud`.
It uses the same verified workspace, usage ledger, quota policy, and billing rail as the
CLI and MCP interfaces. APIClaw does not ship a separate local HTTP server.

## Authentication

Create or verify a workspace with:

```bash
npx @nordsym/apiclaw auth login
```

Send the resulting workspace credential as a bearer token:

```http
Authorization: Bearer sk-claw-...
```

Never place a workspace credential in a URL or client-side public bundle.

## Discovery

```bash
curl https://api.apiclaw.cloud/v1/discover \
  -H "Authorization: Bearer sk-claw-..." \
  -H "Content-Type: application/json" \
  -d '{"query":"web search"}'
```

Discovery returns catalog truth. A source-verified definition is not an execution
promise. Managed execution is available only when a verified adapter is live.

## Managed execution

```bash
curl https://api.apiclaw.cloud/v1/execute \
  -H "Authorization: Bearer sk-claw-..." \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: replace-with-a-unique-request-id" \
  -d '{
    "provider":"brave_search",
    "action":"search",
    "params":{"query":"AI agent infrastructure news"}
  }'
```

Managed provider credentials remain server-side. Unknown-cost customer traffic and
generic public proxy execution fail closed.

## OpenAI-compatible model routing

```bash
curl https://api.apiclaw.cloud/v1/chat/completions \
  -H "Authorization: Bearer sk-claw-..." \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: replace-with-a-unique-request-id" \
  -d '{
    "model":"apiclaw/openrouter/auto",
    "messages":[{"role":"user","content":"Hello"}]
  }'
```

`apiclaw/openrouter/auto` is APIClaw's stable, priced OpenRouter default (`anthropic/claude-sonnet-4-6`), not OpenRouter's dynamic auto router. Reuse the same `Idempotency-Key` after an ambiguous network failure.

See [apiclaw.cloud/docs](https://apiclaw.cloud/docs) for the current provider and
action surface. Runtime output is authoritative for current readiness.
