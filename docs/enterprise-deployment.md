# Enterprise Deployment Guide

Deploy APIClaw MCP server across your organization with MDM, Group Policy, or configuration management tools.

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [macOS Deployment](#macos-deployment)
4. [Windows Deployment](#windows-deployment)
5. [Linux Deployment](#linux-deployment)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Overview

Enterprise deployment of APIClaw involves:
1. **Pre-configuring environment variables** (workspace, API URL, telemetry)
2. **Deploying MCP config snippets** to each client's config file
3. **Verifying installation** across the fleet

### Deployment Methods

| Platform | Tools |
|----------|-------|
| macOS | Jamf Pro, Kandji, Mosyle, Munki |
| Windows | Intune, Group Policy (GPO), SCCM |
| Linux | Ansible, Chef, Puppet, Salt |
| Cross-platform | Custom scripts via `--enterprise` flag |

---

## Environment Variables

Set these system-wide before deployment:

| Variable | Description | Example |
|----------|-------------|---------|
| `APICLAW_WORKSPACE` | Pre-linked workspace ID | `ws_enterprise_123` |
| `APICLAW_API_URL` | Self-hosted API endpoint | `https://api.company.com/apiclaw` |
| `APICLAW_DISABLE_TELEMETRY` | Disable anonymous usage stats | `true` |
| `APICLAW_LOG_LEVEL` | Logging verbosity | `error` / `warn` / `info` / `debug` |

### macOS (launchd)

Create `/Library/LaunchDaemons/com.apiclaw.env.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.apiclaw.env</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/launchctl</string>
        <string>setenv</string>
        <string>APICLAW_WORKSPACE</string>
        <string>ws_enterprise_123</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

### Windows (System Environment)

```powershell
# Set system-wide environment variables
[System.Environment]::SetEnvironmentVariable('APICLAW_WORKSPACE', 'ws_enterprise_123', 'Machine')
[System.Environment]::SetEnvironmentVariable('APICLAW_DISABLE_TELEMETRY', 'true', 'Machine')
```

### Linux (/etc/environment)

```bash
# Append to /etc/environment
echo 'APICLAW_WORKSPACE="ws_enterprise_123"' | sudo tee -a /etc/environment
echo 'APICLAW_DISABLE_TELEMETRY="true"' | sudo tee -a /etc/environment
```

---

## macOS Deployment

### Jamf Pro

#### Method 1: Script Policy

Create a script policy that runs at enrollment or on-demand:

```bash
#!/bin/bash
# APIClaw MCP Setup for Jamf Pro

# Configuration
WORKSPACE="ws_enterprise_123"
CLIENTS=("claude-desktop" "cursor")

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js via Homebrew..."
    /usr/local/bin/brew install node
fi

# Run APIClaw setup
for client in "${CLIENTS[@]}"; do
    echo "Configuring $client..."
    npx @nordsym/apiclaw setup --client "$client" --workspace "$WORKSPACE" --force
done

# Verify
npx @nordsym/apiclaw doctor

exit 0
```

**Policy Settings:**
- Trigger: Enrollment Complete
- Execution Frequency: Once per computer
- Scope: All Managed Macs

#### Method 2: Configuration Profile

Deploy config files directly via Jamf:

1. Create a custom Configuration Profile
2. Add a Custom Settings payload
3. Upload the JSON config for each client

**Claude Desktop config:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>PayloadType</key>
            <string>com.anthropic.claude</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadIdentifier</key>
            <string>com.company.apiclaw.claude</string>
            <key>PayloadUUID</key>
            <string>unique-uuid-here</string>
            <key>PayloadDisplayName</key>
            <string>APIClaw MCP Server</string>
            <key>mcpServers</key>
            <dict>
                <key>apiclaw</key>
                <dict>
                    <key>command</key>
                    <string>npx</string>
                    <key>args</key>
                    <array>
                        <string>-y</string>
                        <string>@nordsym/apiclaw</string>
                    </array>
                    <key>env</key>
                    <dict>
                        <key>APICLAW_WORKSPACE</key>
                        <string>ws_enterprise_123</string>
                    </dict>
                </dict>
            </dict>
        </dict>
    </array>
</dict>
</plist>
```

### Kandji

Use a Custom Script in Kandji:

1. Go to Library → Custom Scripts
2. Create new script
3. Set execution frequency to "Run once"

```bash
#!/bin/zsh
# APIClaw Setup for Kandji

WORKSPACE="ws_enterprise_123"
LOG="/var/log/apiclaw-setup.log"

echo "$(date): Starting APIClaw setup" >> "$LOG"

# Run for current user
CURRENT_USER=$(/usr/bin/stat -f%Su /dev/console)
sudo -u "$CURRENT_USER" npx @nordsym/apiclaw setup --workspace "$WORKSPACE" --force 2>&1 >> "$LOG"

echo "$(date): Setup complete" >> "$LOG"
exit 0
```

### Mosyle

Deploy via Custom Command:

1. Go to Management → Custom Commands
2. Create new command for macOS

```bash
#!/bin/bash
npx @nordsym/apiclaw setup --workspace ws_enterprise_123 --force
```

---

## Windows Deployment

### Microsoft Intune

#### PowerShell Script Deployment

Create a PowerShell script for Intune:

```powershell
# APIClaw-Setup.ps1
# Deploy via Intune as a PowerShell script

param(
    [string]$Workspace = "ws_enterprise_123"
)

$ErrorActionPreference = "Stop"
$LogPath = "$env:ProgramData\APIClaw\setup.log"

# Ensure log directory exists
New-Item -ItemType Directory -Force -Path (Split-Path $LogPath) | Out-Null

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -Append -FilePath $LogPath
    Write-Host $Message
}

Write-Log "Starting APIClaw setup"

# Check for Node.js
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Log "Node.js not found. Installing via winget..."
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    
    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# MCP Client configurations
$clients = @{
    "claude-desktop" = "$env:APPDATA\Claude\claude_desktop_config.json"
    "cursor" = "$env:APPDATA\Cursor\User\globalStorage\cursor.mcp\config.json"
    "windsurf" = "$env:USERPROFILE\.codeium\windsurf\mcp_config.json"
}

$apiclawConfig = @{
    command = "npx"
    args = @("-y", "@nordsym/apiclaw")
    env = @{
        APICLAW_WORKSPACE = $Workspace
    }
}

foreach ($client in $clients.GetEnumerator()) {
    $configPath = $client.Value
    $clientName = $client.Key
    
    if (Test-Path (Split-Path $configPath)) {
        Write-Log "Configuring $clientName..."
        
        # Read or create config
        if (Test-Path $configPath) {
            $config = Get-Content $configPath -Raw | ConvertFrom-Json -AsHashtable
        } else {
            $config = @{}
        }
        
        # Ensure mcpServers exists
        if (-not $config.ContainsKey("mcpServers")) {
            $config.mcpServers = @{}
        }
        
        # Add APIClaw
        $config.mcpServers.apiclaw = $apiclawConfig
        
        # Write config
        $config | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
        
        Write-Log "Configured $clientName successfully"
    } else {
        Write-Log "$clientName not installed, skipping"
    }
}

Write-Log "APIClaw setup complete"
exit 0
```

**Intune Settings:**
- Script Settings → Run this script using the logged-on credentials: Yes
- Enforce script signature check: No
- Run script in 64-bit PowerShell Host: Yes

### Group Policy (GPO)

#### Startup Script Method

1. Create a batch file `apiclaw-setup.bat`:

```batch
@echo off
REM APIClaw Setup via Group Policy

set WORKSPACE=ws_enterprise_123
set LOG=%ProgramData%\APIClaw\setup.log

mkdir "%ProgramData%\APIClaw" 2>nul

echo %date% %time% - Starting APIClaw setup >> "%LOG%"

REM Check if Node.js is available
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Node.js not found, attempting winget install >> "%LOG%"
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
)

REM Run APIClaw setup
call npx @nordsym/apiclaw setup --workspace %WORKSPACE% --force >> "%LOG%" 2>&1

echo %date% %time% - Setup complete >> "%LOG%"
```

2. In Group Policy Management:
   - Navigate to: Computer Configuration → Policies → Windows Settings → Scripts → Startup
   - Add the batch file

#### Registry-based Config Deployment

For direct config deployment without npx:

```powershell
# Deploy via GPO Preferences → Files
# Source: \\domain.local\NETLOGON\apiclaw\claude_desktop_config.json
# Destination: %APPDATA%\Claude\claude_desktop_config.json
# Action: Replace
```

Config template (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "apiclaw": {
      "command": "npx",
      "args": ["-y", "@nordsym/apiclaw"],
      "env": {
        "APICLAW_WORKSPACE": "ws_enterprise_123"
      }
    }
  }
}
```

### SCCM/ConfigMgr

Create an Application with PowerShell detection:

**Install Command:**
```
powershell.exe -ExecutionPolicy Bypass -File APIClaw-Setup.ps1
```

**Detection Script:**
```powershell
$configPath = "$env:APPDATA\Claude\claude_desktop_config.json"
if (Test-Path $configPath) {
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    if ($config.mcpServers.apiclaw) {
        Write-Host "APIClaw configured"
        exit 0
    }
}
exit 1
```

---

## Linux Deployment

### Ansible

Create an Ansible playbook:

```yaml
# apiclaw-setup.yml
---
- name: Deploy APIClaw MCP Server
  hosts: developer_workstations
  become: no
  vars:
    apiclaw_workspace: "ws_enterprise_123"
    
  tasks:
    - name: Check if Node.js is installed
      command: which node
      register: node_check
      ignore_errors: yes
      changed_when: false

    - name: Install Node.js (Ubuntu/Debian)
      become: yes
      apt:
        name: nodejs
        state: present
      when: 
        - node_check.rc != 0
        - ansible_os_family == "Debian"

    - name: Install Node.js (RHEL/Fedora)
      become: yes
      dnf:
        name: nodejs
        state: present
      when: 
        - node_check.rc != 0
        - ansible_os_family == "RedHat"

    - name: Run APIClaw setup
      command: npx @nordsym/apiclaw setup --workspace {{ apiclaw_workspace }} --force
      environment:
        HOME: "{{ ansible_env.HOME }}"
      register: setup_result
      changed_when: "'configured successfully' in setup_result.stdout"

    - name: Verify APIClaw installation
      command: npx @nordsym/apiclaw doctor
      register: doctor_result
      changed_when: false
      
    - name: Display verification result
      debug:
        var: doctor_result.stdout_lines
```

Run with:
```bash
ansible-playbook -i inventory apiclaw-setup.yml
```

### Chef

```ruby
# cookbooks/apiclaw/recipes/default.rb

workspace = 'ws_enterprise_123'

# Ensure Node.js is installed
package 'nodejs' do
  action :install
end

# Run APIClaw setup for each user
node['etc']['passwd'].each do |username, user|
  next if user['uid'].to_i < 1000 # Skip system users
  next if username == 'nobody'
  
  execute "apiclaw-setup-#{username}" do
    command "npx @nordsym/apiclaw setup --workspace #{workspace} --force"
    user username
    environment 'HOME' => user['dir']
    only_if { ::File.directory?(user['dir']) }
  end
end
```

### Puppet

```puppet
# modules/apiclaw/manifests/init.pp

class apiclaw (
  String $workspace = 'ws_enterprise_123',
) {
  # Ensure Node.js
  package { 'nodejs':
    ensure => installed,
  }

  # Setup script
  file { '/opt/apiclaw-setup.sh':
    ensure  => file,
    mode    => '0755',
    content => template('apiclaw/setup.sh.erb'),
  }

  # Run setup
  exec { 'apiclaw-setup':
    command => '/opt/apiclaw-setup.sh',
    unless  => '/usr/bin/npx @nordsym/apiclaw doctor | grep -q "All systems operational"',
    require => [Package['nodejs'], File['/opt/apiclaw-setup.sh']],
  }
}
```

### Shell Script (Universal)

Generate with the CLI:

```bash
npx @nordsym/apiclaw setup --enterprise --output deploy.sh
```

Or use this template:

```bash
#!/bin/bash
# APIClaw Enterprise Deployment Script
# Generated by: npx @nordsym/apiclaw setup --enterprise

set -e

WORKSPACE="${APICLAW_WORKSPACE:-ws_enterprise_123}"
LOG_FILE="/var/log/apiclaw-setup.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

detect_os() {
    case "$(uname -s)" in
        Darwin*) echo "macos" ;;
        Linux*)  echo "linux" ;;
        MINGW*|CYGWIN*|MSYS*) echo "windows" ;;
        *) echo "unknown" ;;
    esac
}

check_node() {
    if ! command -v node &> /dev/null; then
        log "ERROR: Node.js not found. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log "ERROR: Node.js 18+ required. Found: $(node -v)"
        exit 1
    fi
    
    log "Node.js $(node -v) detected"
}

setup_client() {
    local client=$1
    log "Configuring $client..."
    
    if npx @nordsym/apiclaw setup --client "$client" --workspace "$WORKSPACE" --force; then
        log "✓ $client configured successfully"
    else
        log "✗ Failed to configure $client"
    fi
}

main() {
    log "Starting APIClaw enterprise deployment"
    log "Workspace: $WORKSPACE"
    log "OS: $(detect_os)"
    
    check_node
    
    # Detect and configure all clients
    log "Running auto-detection..."
    npx @nordsym/apiclaw setup --workspace "$WORKSPACE" --force
    
    # Verify
    log "Verifying installation..."
    npx @nordsym/apiclaw doctor
    
    log "Deployment complete"
}

main "$@"
```

---

## Verification

### Fleet-wide Verification

After deployment, verify across all machines:

```bash
# Single machine
npx @nordsym/apiclaw doctor

# Fleet via SSH
for host in $(cat hosts.txt); do
    ssh $host "npx @nordsym/apiclaw doctor --json" 
done | jq -s 'group_by(.status) | map({status: .[0].status, count: length})'
```

### Doctor Output (JSON)

```bash
npx @nordsym/apiclaw doctor --json
```

```json
{
  "status": "healthy",
  "timestamp": "2026-02-28T12:00:00Z",
  "system": {
    "node": "v20.11.0",
    "npm": "10.2.4",
    "os": "darwin",
    "arch": "arm64"
  },
  "clients": [
    {
      "name": "claude-desktop",
      "configured": true,
      "configPath": "/Users/dev/Library/Application Support/Claude/claude_desktop_config.json"
    },
    {
      "name": "cursor",
      "configured": true,
      "configPath": "/Users/dev/Library/Application Support/Cursor/User/globalStorage/cursor.mcp/config.json"
    }
  ],
  "connectivity": {
    "apiReachable": true,
    "latencyMs": 45
  }
}
```

### Monitoring Integration

Send doctor results to your monitoring system:

```bash
# Prometheus pushgateway
npx @nordsym/apiclaw doctor --json | \
  jq -r '"apiclaw_healthy " + (if .status == "healthy" then "1" else "0" end)' | \
  curl --data-binary @- http://pushgateway:9091/metrics/job/apiclaw

# Datadog
npx @nordsym/apiclaw doctor --json | \
  jq '{metric: "apiclaw.health", points: [[now, (if .status == "healthy" then 1 else 0 end)]]}' | \
  curl -X POST "https://api.datadoghq.com/api/v1/series" \
    -H "Content-Type: application/json" \
    -H "DD-API-KEY: $DD_API_KEY" \
    -d @-
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Node.js not found" | Node.js not in PATH | Install Node.js system-wide |
| "Permission denied" | Config owned by different user | Run as the correct user |
| "Config not found" | Client not installed | Install MCP client first |
| "Network error" | Firewall blocking npm | Allow `registry.npmjs.org` |

### Logs

**macOS/Linux:**
```bash
cat /var/log/apiclaw-setup.log
```

**Windows:**
```powershell
Get-Content $env:ProgramData\APIClaw\setup.log
```

### Support

- **Documentation:** https://docs.apiclaw.com/enterprise
- **GitHub Issues:** https://github.com/nordsym/apiclaw/issues
- **Enterprise Support:** enterprise@apiclaw.com

---

## Security Considerations

### Network Requirements

APIClaw needs access to:
- `registry.npmjs.org` (npm packages)
- `api.apiclaw.com` (API gateway)

### Data Privacy

- API keys are stored locally in `~/.apiclaw/credentials.json`
- No sensitive data is transmitted to APIClaw servers without explicit action
- Set `APICLAW_DISABLE_TELEMETRY=true` to disable anonymous usage stats

### Audit Logging

All API calls through APIClaw are logged locally:
```
~/.apiclaw/logs/api-calls.log
```

Configure centralized logging:
```bash
export APICLAW_LOG_ENDPOINT="https://logs.company.com/apiclaw"
```

---

*Last updated: 2026-02-28*
