---
nord_type: NOTE
nord_owner: APIClaw
nord_status: LIVE
---

# APIClaw

The control plane for AI agents. APIClaw gives agents one workspace for API discovery, managed execution, model routing, missions, auth, usage, and cost observability.

- Website: [apiclaw.cloud](https://apiclaw.cloud)
- Docs: [apiclaw.cloud/docs](https://apiclaw.cloud/docs)
- Catalog: [apiclaw.cloud/catalog](https://apiclaw.cloud/catalog)
- Workspace: [apiclaw.cloud/workspace](https://apiclaw.cloud/workspace)
- Gateway: `https://api.apiclaw.cloud`
- npm: `@nordsym/apiclaw`

## Current product truth

- 26,619 public API definitions are discoverable.
- 689 current catalog entries map to source-verification evidence by exact name. Source verification is not APIClaw execution.
- 22 managed provider adapters are inventoried. Adapter inventory is not an execution promise.
- Four provider rails are customer-executable now: OpenRouter chat, Brave Search, GitHub read-only, and NASA read-only.
- Managed execution is available only when a server-side adapter is live and the request passes the current trust and cost policy.
- Keyless public definitions remain discovery-only until DNS-pinned, redirect-validating egress is live.
- Signup is required. There is no anonymous execution.
- Internal NordSym communication infrastructure is not part of the public provider surface.

## Quick start

```bash
npm install -g @nordsym/apiclaw
npx @nordsym/apiclaw auth login
```

The browser flow verifies workspace ownership and writes `~/.apiclaw.toml`. The same workspace credential works across local MCP, CLI, HTTP gateway, and Remote MCP.

For a headless environment, open the displayed sign-in URL on a device where ownership can be verified.

## Four access paths

| Access path | Best for | Auth |
|---|---|---|
| Local MCP | Claude Desktop, Cursor, Windsurf, OpenClaw | `~/.apiclaw.toml` |
| CLI | Terminal, scripts, CI/CD | Same local credential |
| HTTP gateway | Server-side agents and custom backends | `Authorization: Bearer sk-claw-...` |
| Remote MCP | OAuth-aware hosted clients | OAuth 2.1 with PKCE and DCR |

Remote MCP endpoint:

```text
https://apiclaw.cloud/mcp
```

OpenAI-compatible model endpoint:

```text
POST https://api.apiclaw.cloud/v1/chat/completions
```

API discovery and managed execution endpoints:

```text
POST https://api.apiclaw.cloud/v1/discover
POST https://api.apiclaw.cloud/v1/execute
```

## Discovery and execution

Use `discover_apis` to search by job-to-be-done. Results distinguish among:

1. Managed execution: APIClaw has a server-side adapter and can evaluate the request for execution.
2. Source-verified discovery: the upstream definition responded during verification, but APIClaw does not generically proxy it.
3. Discovery-only: catalog metadata is available for planning and provider selection.

Use `call_api` only with a managed route returned as executable. Unknown-cost customer traffic fails closed. Public registry entries never become an open proxy.

The managed adapter inventory spans model, search, voice, media, developer, and data providers. Only the four explicitly customer-executable provider rails are callable by customer workspaces today. Runtime output is the authority for provider and action readiness.

## Model routing

The OpenAI-compatible gateway routes supported models across configured provider adapters. A model name appearing in a catalog is not by itself an availability guarantee. Use the live model and provider response when current frontier availability matters.

Example:

```bash
IDEMPOTENCY_KEY="${IDEMPOTENCY_KEY:-$(uuidgen)}"
curl https://api.apiclaw.cloud/v1/chat/completions \
  -H "Authorization: Bearer sk-claw-..." \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "apiclaw/openrouter/auto",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

`apiclaw/openrouter/auto` is APIClaw's stable, priced OpenRouter default (`anthropic/claude-sonnet-4-6`). It is not OpenRouter's dynamic auto router. Reuse the same idempotency key after an ambiguous network failure.

## Pricing

- Free workspace: up to 25 lifetime managed calls, subject to a $1 total underlying provider-cost cap.
- Discovery is free after signup.
- Pay as you go: billing-ready managed usage at provider cost plus 15%.
- Actions without an exact provider-cost adapter remain blocked after the activation allowance rather than being billed from an estimate.
- Attaching a card does not skip unused activation calls.

Usage, provider cost, customer charge, and billing state are visible in the workspace.

## Trust floor

- Managed provider credentials stay server-side.
- Workspace ownership is verified before execution.
- Public registry execution is disabled until hardened egress is live.
- Billing requires an active Stripe subscription, payment method, and exact micro-USD meter contract.
- Usage authorization and finalization are recorded in an immutable workspace-scoped ledger.
- Internal-only providers are filtered from public catalog and copy.

## MCP setup

For a local package install:

```json
{
  "mcpServers": {
    "apiclaw": {
      "command": "npx",
      "args": ["-y", "@nordsym/apiclaw"]
    }
  }
}
```

For the hosted desktop extension, use [apiclaw.cloud/apiclaw.mcpb](https://apiclaw.cloud/apiclaw.mcpb).

## Support

- Docs: [apiclaw.cloud/docs](https://apiclaw.cloud/docs)
- GitHub: [github.com/nordsym/apiclaw](https://github.com/nordsym/apiclaw)
- Built by: [nordsym.com](https://nordsym.com)
