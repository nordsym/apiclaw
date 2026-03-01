# PRD: APIClaw MCP Auto-Setup

**Version:** 1.0  
**Date:** 2026-02-28  
**Status:** Draft  
**Owner:** NordSym

---

## Executive Summary

Enterprise-grade, platform-agnostic CLI tool that automatically configures APIClaw as an MCP server across all major AI coding assistants. Zero-friction onboarding for developers and fleet deployment for enterprises.

---

## Problem Statement

### Current Pain
1. Manual JSON editing required to add MCP servers
2. Different config locations per client/OS
3. Easy to make syntax errors
4. No verification that setup worked
5. Enterprise: No way to deploy to entire dev team

### User Quotes
- "I just want it to work"
- "Why do I need to edit JSON in 2026?"
- "How do I roll this out to 50 developers?"

---

## Goals

| Goal | Metric |
|------|--------|
| Zero-config onboarding | <10 seconds from install to working |
| Universal compatibility | Support 100% of major MCP clients |
| Enterprise-ready | Fleet deployment in 1 command |
| Fail-safe | Never corrupt existing config |

---

## Supported Platforms

### MCP Clients

| Client | Config Location (macOS) | Config Location (Windows) | Config Location (Linux) |
|--------|------------------------|---------------------------|------------------------|
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` | `%APPDATA%\Claude\claude_desktop_config.json` | `~/.config/Claude/claude_desktop_config.json` |
| **Cursor** | `~/Library/Application Support/Cursor/User/globalStorage/cursor.mcp/config.json` | `%APPDATA%\Cursor\User\globalStorage\cursor.mcp\config.json` | `~/.config/Cursor/User/globalStorage/cursor.mcp/config.json` |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` | `%USERPROFILE%\.codeium\windsurf\mcp_config.json` | `~/.codeium/windsurf/mcp_config.json` |
| **Cline (VS Code)** | `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` | `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` | `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| **Continue** | `~/.continue/config.json` | `%USERPROFILE%\.continue\config.json` | `~/.continue/config.json` |
| **Custom** | User-specified path | User-specified path | User-specified path |

### Operating Systems
- macOS (Intel + Apple Silicon)
- Windows 10/11
- Linux (Ubuntu, Debian, Fedora, Arch)

---

## CLI Commands

### Basic Setup

```bash
# Auto-detect and configure all found MCP clients
npx @nordsym/apiclaw setup

# Setup specific client only
npx @nordsym/apiclaw setup --client claude-desktop
npx @nordsym/apiclaw setup --client cursor
npx @nordsym/apiclaw setup --client windsurf
npx @nordsym/apiclaw setup --client cline
npx @nordsym/apiclaw setup --client continue

# Setup with custom config path
npx @nordsym/apiclaw setup --config /path/to/config.json

# Setup with workspace pre-linked
npx @nordsym/apiclaw setup --workspace ws_abc123

# Dry run (show what would happen)
npx @nordsym/apiclaw setup --dry-run

# Force overwrite existing APIClaw config
npx @nordsym/apiclaw setup --force
```

### Enterprise Commands

```bash
# Generate setup script for team deployment
npx @nordsym/apiclaw setup --enterprise --output setup-script.sh

# Generate config snippet (for manual distribution)
npx @nordsym/apiclaw setup --export-config

# Verify installation across clients
npx @nordsym/apiclaw doctor

# Remove APIClaw from all clients
npx @nordsym/apiclaw uninstall
```

---

## Setup Flow

### Standard Flow

```
┌─────────────────────────────────────────────────────────────┐
│  $ npx @nordsym/apiclaw setup                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  🔍 Detecting MCP clients...                                │
│     ✓ Claude Desktop found                                  │
│     ✓ Cursor found                                          │
│     ✗ Windsurf not found                                    │
│     ✗ Cline not found                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  📝 Configuring Claude Desktop...                           │
│     • Backing up existing config                            │
│     • Adding APIClaw to mcpServers                          │
│     ✓ Done                                                  │
│                                                             │
│  📝 Configuring Cursor...                                   │
│     • Creating config directory                             │
│     • Adding APIClaw to mcpServers                          │
│     ✓ Done                                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  ✅ APIClaw configured successfully!                        │
│                                                             │
│  Next steps:                                                │
│  1. Restart Claude Desktop / Cursor                         │
│  2. Ask your agent: "List available APIs"                   │
│                                                             │
│  Need help? https://docs.apiclaw.com/setup                  │
└─────────────────────────────────────────────────────────────┘
```

### Interactive Flow (--wizard)

```
┌─────────────────────────────────────────────────────────────┐
│  $ npx @nordsym/apiclaw setup --wizard                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Which MCP clients do you want to configure?                │
│                                                             │
│  ◉ Claude Desktop (detected)                                │
│  ◉ Cursor (detected)                                        │
│  ○ Windsurf (not detected)                                  │
│  ○ Custom path...                                           │
│                                                             │
│  [Continue]                                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Review changes:                                            │
│                                                             │
│  Claude Desktop:                                            │
│  + "apiclaw": {                                             │
│  +   "command": "npx",                                      │
│  +   "args": ["@nordsym/apiclaw"]                           │
│  + }                                                        │
│                                                             │
│  [Apply] [Cancel]                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Config Injection

### MCP Config Structure

```json
{
  "mcpServers": {
    "apiclaw": {
      "command": "npx",
      "args": ["@nordsym/apiclaw"],
      "env": {
        "APICLAW_WORKSPACE": "ws_abc123"
      }
    }
  }
}
```

### Merge Strategy

1. **Read** existing config (or create empty object)
2. **Backup** to `config.backup.json`
3. **Deep merge** APIClaw into `mcpServers`
4. **Preserve** all other config keys
5. **Write** with pretty formatting
6. **Verify** JSON is valid before write

### Conflict Handling

| Scenario | Action |
|----------|--------|
| No existing config | Create new file |
| Config exists, no APIClaw | Add APIClaw |
| Config exists, APIClaw exists | Skip (or update with `--force`) |
| Config is malformed JSON | Abort with error, suggest manual fix |
| No write permission | Abort with error, show required permissions |

---

## Safety Features

### Backup System

```
Before: claude_desktop_config.json
After:  claude_desktop_config.json (updated)
        claude_desktop_config.backup.1709150400.json
```

- Timestamped backups
- Keep last 5 backups
- Restore command: `npx @nordsym/apiclaw restore`

### Validation

1. **Pre-write validation:**
   - Parse resulting JSON
   - Check required fields present
   - Validate paths exist

2. **Post-write validation:**
   - Re-read file
   - Confirm APIClaw entry exists
   - Check file permissions correct

### Rollback

```bash
# Restore from latest backup
npx @nordsym/apiclaw restore

# Restore specific backup
npx @nordsym/apiclaw restore --backup claude_desktop_config.backup.1709150400.json

# List available backups
npx @nordsym/apiclaw restore --list
```

---

## Enterprise Features

### Fleet Deployment Script

```bash
# Generate cross-platform setup script
npx @nordsym/apiclaw setup --enterprise --output deploy.sh

# Generated script includes:
# - OS detection
# - Client detection
# - Config injection
# - Verification
# - Error reporting to central endpoint
```

### Environment Variables

```bash
# Pre-configure workspace for all users
export APICLAW_WORKSPACE="ws_enterprise_123"
export APICLAW_API_URL="https://api.company.com/apiclaw"  # Self-hosted
export APICLAW_DISABLE_TELEMETRY="true"

npx @nordsym/apiclaw setup
```

### MDM Integration (macOS)

```xml
<!-- Deploy via Jamf/Kandji/Mosyle -->
<plist>
  <dict>
    <key>mcpServers</key>
    <dict>
      <key>apiclaw</key>
      <dict>
        <key>command</key>
        <string>npx</string>
        <key>args</key>
        <array>
          <string>@nordsym/apiclaw</string>
        </array>
      </dict>
    </dict>
  </dict>
</plist>
```

### Group Policy (Windows)

```powershell
# Deploy via Group Policy / Intune
$config = @{
  mcpServers = @{
    apiclaw = @{
      command = "npx"
      args = @("@nordsym/apiclaw")
    }
  }
}
$config | ConvertTo-Json -Depth 10 | Set-Content "$env:APPDATA\Claude\claude_desktop_config.json"
```

---

## Doctor Command

Diagnose issues with APIClaw setup:

```bash
$ npx @nordsym/apiclaw doctor

🔍 APIClaw Health Check
========================

System:
  ✓ Node.js v20.11.0
  ✓ npm 10.2.4
  ✓ npx available

MCP Clients:
  ✓ Claude Desktop
    • Config: ~/.../claude_desktop_config.json
    • APIClaw: Configured ✓
    • Version: Latest
  
  ✓ Cursor
    • Config: ~/.../config.json
    • APIClaw: Configured ✓
    • Version: Latest

  ✗ Windsurf
    • Not installed

Connectivity:
  ✓ api.apiclaw.com reachable
  ✓ Workspace authenticated

Recent Issues:
  None detected

Status: All systems operational ✓
```

---

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `ENOENT: config not found` | Client not installed | Install client or use `--config` |
| `EACCES: permission denied` | No write access | Run with sudo or fix permissions |
| `SyntaxError: JSON parse` | Corrupted config | Restore from backup |
| `APICLAW_EXISTS` | Already configured | Use `--force` to update |
| `NETWORK_ERROR` | Offline | Setup works offline, verify later |

### Error Output

```bash
$ npx @nordsym/apiclaw setup

❌ Error: Permission denied writing to claude_desktop_config.json

This usually means:
1. The config file is owned by another user
2. You need elevated permissions

Try:
  sudo npx @nordsym/apiclaw setup
  
Or fix permissions:
  chmod 644 ~/Library/Application\ Support/Claude/claude_desktop_config.json

Need help? https://docs.apiclaw.com/setup/permissions
```

---

## Implementation Plan

### Agent Deployment

**Total: 4 agents** (can run in parallel)

---

#### Agent 1: CLI Core
**Label:** `apiclaw-setup-cli`

**Scope:**
- CLI scaffold with Commander.js
- OS detection utility
- Config path resolver for all clients
- Backup system (timestamped, keep 5)
- JSON merge logic (preserve existing config)

**Output:**
- `src/cli/index.ts` - Entry point
- `src/cli/commands/setup.ts` - Setup command
- `src/utils/os.ts` - OS detection
- `src/utils/paths.ts` - Config path resolver
- `src/utils/backup.ts` - Backup system
- `src/utils/config.ts` - JSON merge logic

---

#### Agent 2: Client Adapters
**Label:** `apiclaw-setup-adapters`

**Scope:**
- Adapter interface
- Claude Desktop adapter (all OS)
- Cursor adapter (all OS)
- Windsurf adapter (all OS)
- Cline adapter (all OS)
- Continue adapter (all OS)
- Custom path adapter
- Auto-detection logic

**Output:**
- `src/adapters/base.ts` - Adapter interface
- `src/adapters/claude-desktop.ts`
- `src/adapters/cursor.ts`
- `src/adapters/windsurf.ts`
- `src/adapters/cline.ts`
- `src/adapters/continue.ts`
- `src/adapters/custom.ts`
- `src/adapters/detect.ts` - Auto-detect all

---

#### Agent 3: Enterprise & Doctor
**Label:** `apiclaw-setup-enterprise`

**Scope:**
- `--enterprise` script generator (bash + powershell)
- Environment variable handling
- `doctor` command (health check)
- `restore` command (rollback)
- `uninstall` command

**Output:**
- `src/cli/commands/doctor.ts`
- `src/cli/commands/restore.ts`
- `src/cli/commands/uninstall.ts`
- `src/enterprise/script-generator.ts`
- `src/enterprise/env.ts`

---

#### Agent 4: UX & Docs
**Label:** `apiclaw-setup-ux`

**Scope:**
- Colored output with ora spinners
- `--wizard` interactive mode
- `--dry-run` implementation
- Error messages with help links
- README.md
- MDM/Group Policy documentation

**Output:**
- `src/ui/spinner.ts`
- `src/ui/prompts.ts`
- `src/cli/commands/wizard.ts`
- `README.md`
- `docs/enterprise-deployment.md`

---

### Execution Order

```
┌─────────────────────────────────────────────────────────┐
│                    SPAWN PARALLEL                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Agent 1          Agent 2          Agent 3    Agent 4   │
│  CLI Core    →   Adapters    →   Enterprise    UX       │
│                                                          │
│  [Foundation]    [Depends on 1]   [Depends on 1]  [Any] │
│                                                          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 INTEGRATION (Elder Brain)                │
│  - Wire everything together                              │
│  - npm publish @nordsym/apiclaw                          │
│  - Test on all platforms                                 │
└─────────────────────────────────────────────────────────┘
```

### Dependencies

| Agent | Depends On | Can Start |
|-------|------------|-----------|
| Agent 1 (CLI Core) | Nothing | Immediately |
| Agent 2 (Adapters) | Agent 1 | After Agent 1 |
| Agent 3 (Enterprise) | Agent 1 | After Agent 1 |
| Agent 4 (UX & Docs) | Nothing | Immediately |

**Parallel execution:** Agent 1 + Agent 4 first, then Agent 2 + Agent 3

---

## Technical Stack

```
@nordsym/apiclaw (CLI)
├── commander.js     # CLI framework
├── inquirer.js      # Interactive prompts
├── ora              # Spinners
├── chalk            # Colors
├── fs-extra         # File operations
├── detect-indent    # Preserve formatting
└── ajv              # JSON validation
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Setup success rate | >95% |
| Time to first API call | <30 seconds |
| Support tickets from setup | <5% of users |
| Enterprise deployments | 10+ companies |

---

## Open Questions

1. **Self-hosted support:** Should we support custom API endpoints from day 1?
2. **Auto-update:** Should setup auto-update APIClaw if already installed?
3. **Telemetry:** Collect anonymous setup success/failure metrics?
4. **GUI installer:** Worth building Electron app for non-CLI users?

---

## Appendix: Full Config Examples

### Claude Desktop (macOS)

```json
{
  "mcpServers": {
    "apiclaw": {
      "command": "npx",
      "args": ["-y", "@nordsym/apiclaw"]
    },
    "other-server": {
      "command": "node",
      "args": ["/path/to/server.js"]
    }
  }
}
```

### Cursor

```json
{
  "mcpServers": {
    "apiclaw": {
      "command": "npx",
      "args": ["-y", "@nordsym/apiclaw"],
      "env": {
        "APICLAW_WORKSPACE": "ws_123"
      }
    }
  }
}
```

### Continue

```json
{
  "models": [...],
  "mcpServers": [
    {
      "name": "apiclaw",
      "command": "npx",
      "args": ["-y", "@nordsym/apiclaw"]
    }
  ]
}
```

---

*Last updated: 2026-02-28*
