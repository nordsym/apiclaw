<div align="center">

![APIClaw](https://apiclaw.cloud/apiclaw-banner.png)

# APIClaw 🦞

[![DOCS](https://img.shields.io/badge/DOCS-apiclaw.cloud-EF4444?style=flat-square&labelColor=0A0A0A)](https://apiclaw.cloud/docs)
[![X](https://img.shields.io/badge/%40APIClaw-1DA1F2?style=flat-square&logo=x&labelColor=0A0A0A&logoColor=white)](https://x.com/APIClaw)
[![LICENSE](https://img.shields.io/badge/LICENSE-MIT-22C55E?style=flat-square&labelColor=0A0A0A)](./LICENSE)
[![BUILT BY](https://img.shields.io/badge/BUILT%20BY-NORDSYM-9333EA?style=flat-square&labelColor=0A0A0A)](https://nordsym.com)
[![npm](https://img.shields.io/npm/v/@nordsym/apiclaw?style=flat-square&color=EF4444&labelColor=0A0A0A&label=npm)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![installs](https://img.shields.io/npm/dt/@nordsym/apiclaw?style=flat-square&color=525252&labelColor=0A0A0A&label=installs)](https://www.npmjs.com/package/@nordsym/apiclaw)

</div>

---

> Your agent calls real APIs. You sign in once.

## Start

```text
set up https://apiclaw.cloud/SKILL.md
```

Or pick a path directly:

```bash
# Local MCP (Claude Desktop, Cursor, Windsurf, OpenClaw)
npm install -g @nordsym/apiclaw && npx @nordsym/apiclaw auth login

# CLI
npx @nordsym/apiclaw call nasa/apod --params '{}'

# HTTP gateway
curl https://api.apiclaw.cloud/v1/execute -H "Authorization: Bearer sk-claw-..."

# Remote MCP
https://apiclaw.cloud/mcp
```

The auth flow opens the browser, signs the user in, and writes `~/.apiclaw.toml`. The same credential works across every path.

> Headless server or SSH session? Open the browser sign-in URL on a device where you can complete ownership verification.

---

## What it is

APIClaw is the authenticated execution and discovery layer for AI agents. An agent reaches it through SKILL.md, local MCP, CLI, HTTP, or Remote MCP, signs in once through the browser, discovers APIs by capability, and executes calls with credentials kept server-side. 26,619 API definitions discoverable, 1,025 callable now.

Route across supported models from OpenAI, Anthropic, [OpenRouter](https://openrouter.ai), xAI, Groq, Mistral, Cohere, DeepInfra, or a configured endpoint. Switch with one parameter, no SDK swap, no lock-in.

---

## Numbers

- 26,619 discoverable API definitions
- 689 exact-name source-verified entries. Source verification is discovery evidence, not proof of execution.
- 22 managed provider adapters, 22 customer-executable provider rails
- 1,003 workspace-authenticated public/no-key HTTPS origins
- 1,025 total callable now
- Source verification is not execution.

---

## Pricing

| Plan | Price | Access |
|------|-------|--------|
| **Free** | $0, no card | 25 managed calls for the lifetime of the workspace, subject to a $1 total underlying provider-cost cap. Discovery is free. |
| **Pay as you go** | Provider cost + 15% | Billing-ready managed actions continue after the free allowance. Actions without an exact billing adapter remain blocked. |

Pricing canon: underlying provider cost plus a 15% margin. Stripe metered billing live.

---

## Links

- **Site** — [apiclaw.cloud](https://apiclaw.cloud)
- **Docs** — [apiclaw.cloud/docs](https://apiclaw.cloud/docs)
- **Catalog** — [apiclaw.cloud/catalog](https://apiclaw.cloud/catalog)
- **Security** — [apiclaw.cloud/security](https://apiclaw.cloud/security)
- **SKILL.md** — [apiclaw.cloud/SKILL.md](https://apiclaw.cloud/SKILL.md)
- **npm** — [@nordsym/apiclaw](https://www.npmjs.com/package/@nordsym/apiclaw)
- **Remote MCP** — [apiclaw.cloud/mcp](https://apiclaw.cloud/mcp)
- **Claude Desktop Extension** — [apiclaw.cloud/apiclaw.mcpb](https://apiclaw.cloud/apiclaw.mcpb)
- **List your API** — [apiclaw.cloud/docs#list-your-api](https://apiclaw.cloud/docs#list-your-api)

Built by [NordSym](https://nordsym.com). MIT licensed.
