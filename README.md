# 🦞 APIClaw

> **The API layer for AI agents.** 22,000+ APIs indexed. Direct Call execution. Zero config.

[![npm version](https://img.shields.io/npm/v/@nordsym/apiclaw.svg)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![npm downloads](https://img.shields.io/npm/dw/@nordsym/apiclaw.svg)](https://www.npmjs.com/package/@nordsym/apiclaw)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

**APIs Indexed:** 22,392 • **Open APIs:** 1,636 • **Direct Call Providers:** 18

---

## Quick Start

```bash
# Install APIClaw into Claude Desktop or Claude Code
npx @nordsym/apiclaw mcp-install

# That's it! Restart your AI assistant and ask:
# "List available APIs" or "Send an SMS via 46elks"
```

APIClaw automatically detects Claude Desktop and Claude Code — then configures itself as an MCP server in seconds.

---

## What is APIClaw?

APIClaw is an MCP (Model Context Protocol) server that gives AI coding assistants access to real-world APIs:

- **📱 SMS & Voice** — 46elks, Twilio
- **📧 Email** — Resend, SendGrid
- **💳 Payments** — Stripe
- **🔍 Search** — Brave Search
- **🤖 AI** — OpenRouter, ElevenLabs
- **...and 100+ more** — growing weekly

Instead of manually configuring API keys and reading documentation, just tell your AI: *"Send a confirmation SMS to +46701234567"* — and it works.

---

## Installation

### Option 1: MCP Install (Recommended)

```bash
npx @nordsym/apiclaw mcp-install
```

This will:
1. 🔍 Detect Claude Desktop or Claude Code
2. 📝 Add APIClaw to the MCP config
3. ✅ Verify the setup

### Option 2: Manual Installation

```bash
npm install -g @nordsym/apiclaw
apiclaw setup
```

### Option 3: Use npx (No Install)

Just use `npx @nordsym/apiclaw` anywhere — it downloads on demand.

---

## Commands

### `mcp-install`

Simple, focused installation for Claude Desktop and Claude Code.

```bash
# Auto-detect and install
npx @nordsym/apiclaw mcp-install

# Install to specific client
npx @nordsym/apiclaw mcp-install --client claude-desktop
npx @nordsym/apiclaw mcp-install --client claude-code

# Preview changes without applying
npx @nordsym/apiclaw mcp-install --dry-run
```

### `setup`

Full-featured setup with support for all MCP clients.

```bash
# Auto-detect and configure all clients
npx @nordsym/apiclaw setup

# Configure specific client
npx @nordsym/apiclaw setup --client claude-desktop
npx @nordsym/apiclaw setup --client cursor
npx @nordsym/apiclaw setup --client windsurf
npx @nordsym/apiclaw setup --client cline
npx @nordsym/apiclaw setup --client continue

# Custom config path
npx @nordsym/apiclaw setup --config /path/to/config.json

# Link a workspace
npx @nordsym/apiclaw setup --workspace ws_abc123

# Preview changes without applying
npx @nordsym/apiclaw setup --dry-run

# Force overwrite existing config
npx @nordsym/apiclaw setup --force

# Interactive mode
npx @nordsym/apiclaw setup --wizard
```

### `doctor`

Diagnose your APIClaw setup.

```bash
npx @nordsym/apiclaw doctor
```

Output:
```
🔍 APIClaw Health Check
========================

System:
  ✓ Node.js v20.11.0
  ✓ npm 10.2.4
  ✓ npx available

MCP Clients:
  ✓ Claude Desktop - Configured ✓
  ✓ Cursor - Configured ✓
  ✗ Windsurf - Not installed

Connectivity:
  ✓ api.apiclaw.com reachable

Status: All systems operational ✓
```

### `restore`

Restore config from backup.

```bash
# Restore most recent backup
npx @nordsym/apiclaw restore

# List available backups
npx @nordsym/apiclaw restore --list

# Restore specific backup
npx @nordsym/apiclaw restore --backup config.backup.1709150400.json
```

### `uninstall`

Remove APIClaw from all configured clients.

```bash
npx @nordsym/apiclaw uninstall

# Remove from specific client
npx @nordsym/apiclaw uninstall --client cursor
```

---

## Options

| Option | Description |
|--------|-------------|
| `--client <name>` | Target specific MCP client |
| `--config <path>` | Use custom config file path |
| `--workspace <id>` | Link an APIClaw workspace |
| `--dry-run` | Preview changes without applying |
| `--force` | Overwrite existing APIClaw config |
| `--wizard` | Interactive setup mode |
| `--no-backup` | Skip creating backup (not recommended) |
| `--verbose` | Show detailed output |
| `--version` | Show version number |
| `--help` | Show help |

---

## Supported MCP Clients

| Client | macOS | Windows | Linux |
|--------|:-----:|:-------:|:-----:|
| **Claude Desktop** | ✅ | ✅ | ✅ |
| **Cursor** | ✅ | ✅ | ✅ |
| **Windsurf** | ✅ | ✅ | ✅ |
| **Cline** (VS Code) | ✅ | ✅ | ✅ |
| **Continue** | ✅ | ✅ | ✅ |
| **Custom** | ✅ | ✅ | ✅ |

### Config Locations

<details>
<summary>Claude Desktop</summary>

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

</details>

<details>
<summary>Cursor</summary>

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Cursor/User/globalStorage/cursor.mcp/config.json` |
| Windows | `%APPDATA%\Cursor\User\globalStorage\cursor.mcp\config.json` |
| Linux | `~/.config/Cursor/User/globalStorage/cursor.mcp/config.json` |

</details>

<details>
<summary>Windsurf</summary>

| OS | Path |
|----|------|
| macOS | `~/.codeium/windsurf/mcp_config.json` |
| Windows | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` |
| Linux | `~/.codeium/windsurf/mcp_config.json` |

</details>

<details>
<summary>Cline</summary>

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| Windows | `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` |
| Linux | `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |

</details>

<details>
<summary>Continue</summary>

| OS | Path |
|----|------|
| macOS | `~/.continue/config.json` |
| Windows | `%USERPROFILE%\.continue\config.json` |
| Linux | `~/.continue/config.json` |

</details>

---

## Enterprise Deployment

Deploy APIClaw to your entire development team.

### Environment Variables

```bash
# Pre-configure workspace for all users
export APICLAW_WORKSPACE="ws_enterprise_123"

# Point to self-hosted instance
export APICLAW_API_URL="https://api.company.com/apiclaw"

# Disable telemetry
export APICLAW_DISABLE_TELEMETRY="true"

npx @nordsym/apiclaw mcp-install
```

### Generate Deployment Script

```bash
# Generate cross-platform setup script
npx @nordsym/apiclaw setup --enterprise --output deploy.sh
```

The generated script handles:
- OS detection
- Client detection
- Config injection
- Verification
- Error reporting

### MDM/Group Policy

See [Enterprise Deployment Guide](docs/enterprise-deployment.md) for:
- Jamf/Kandji/Mosyle (macOS)
- Intune/Group Policy (Windows)
- Ansible/Chef/Puppet (Linux)

---

## Troubleshooting

### "Permission denied"

```bash
# Option 1: Run with sudo
sudo npx @nordsym/apiclaw mcp-install

# Option 2: Fix permissions
chmod 644 ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### "Config file not found"

The MCP client hasn't created its config yet:
1. Open the client (Claude Desktop or Claude Code)
2. Close it
3. Try mcp-install again

Or use the full setup command with a custom path:
```bash
npx @nordsym/apiclaw setup --config /path/to/config.json
```

### "Invalid JSON"

Your config file has syntax errors:
```bash
# Restore from backup
npx @nordsym/apiclaw restore --list
npx @nordsym/apiclaw restore

# Or manually fix the JSON
```

### "Already configured"

APIClaw is already set up. To update:
```bash
npx @nordsym/apiclaw setup --force
```

### Still having issues?

```bash
# Run diagnostics
npx @nordsym/apiclaw doctor --verbose

# Get help
https://docs.apiclaw.com/setup
https://github.com/nordsym/apiclaw/issues
```

---

## How It Works

APIClaw modifies your MCP client's config file to register itself as a server:

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

When your AI assistant starts, it launches APIClaw as an MCP server. APIClaw then:
1. Exposes available APIs as MCP tools
2. Handles authentication and rate limiting
3. Executes API calls on behalf of the AI

---

## Safety Features

### Automatic Backups

Before modifying any config, APIClaw creates a timestamped backup:
```
claude_desktop_config.backup.1709150400.json
```

### Non-Destructive

- Never overwrites existing configurations
- Deep merges APIClaw into `mcpServers`
- Preserves all other settings

### Validation

- Parses JSON before and after modifications
- Verifies required fields exist
- Rolls back on any error

---

## Dry-Run Mode

Test API calls without actually executing them. Perfect for debugging, development, and agent testing.

### Usage

```javascript
// In MCP tool call
call_api({
  provider: "46elks",
  action: "send_sms",
  params: {
    to: "+46701234567",
    message: "Hello from dry-run!"
  },
  dry_run: true  // ← No actual API call made
})
```

### Response

```json
{
  "dry_run": true,
  "provider": "46elks",
  "action": "send_sms",
  "would_send": {
    "url": "https://api.46elks.com/a1/sms",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Basic [base64(username:password)]"
    },
    "body": {
      "from": "APIClaw",
      "to": "+46701234567",
      "message": "Hello from dry-run!"
    }
  },
  "mock_response": {
    "success": true,
    "data": {
      "id": "mock_sms_123",
      "status": "delivered"
    },
    "estimated_cost": "~0.35-0.52 SEK"
  },
  "notes": [
    "⚠️ DRY-RUN MODE: No actual API call was made",
    "This shows what WOULD be sent if you remove dry_run: true"
  ]
}
```

### Benefits

- **💰 No cost** — Test without burning API credits
- **🔍 Debug** — See exact request that would be sent
- **🧪 Test** — Validate agent workflows before going live
- **📋 Mock data** — Get realistic response shapes for development

### Supported Providers

All Direct Call providers support dry-run:
- 46elks, Twilio (SMS)
- Resend (Email)
- Brave Search
- OpenRouter (LLM)
- ElevenLabs (TTS)
- Replicate (AI models)
- Firecrawl (Web scraping)
- GitHub
- E2B (Code sandbox)

---

## Development

```bash
# Clone the repo
git clone https://github.com/nordsym/apiclaw.git
cd apiclaw

# Install dependencies
npm install

# Build
npm run build

# Run locally
npm run dev

# Test setup locally
npm run setup:test
```

---

## License

MIT © [NordSym](https://nordsym.com)

---

## Links

- **Website:** [apiclaw.com](https://apiclaw.com)
- **Documentation:** [docs.apiclaw.com](https://docs.apiclaw.com)
- **GitHub:** [github.com/nordsym/apiclaw](https://github.com/nordsym/apiclaw)
- **npm:** [@nordsym/apiclaw](https://www.npmjs.com/package/@nordsym/apiclaw)
