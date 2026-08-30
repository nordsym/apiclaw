# APIClaw MCP Installer for Windows
# Usage:
#   iwr -useb https://apiclaw.cloud/install.ps1 | iex
#
# Detects Node.js. Installs via winget -> choco -> .msi fallback.
# Then registers the APIClaw MCP server with Claude Desktop.

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Banner {
    Write-Host ""
    Write-Host "  ╔═══════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║       APIClaw MCP Installer           ║" -ForegroundColor Cyan
    Write-Host "  ║       The API layer for AI agents     ║" -ForegroundColor Cyan
    Write-Host "  ╚═══════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Test-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Test-Admin {
    $current = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($current)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Update-PathFromMachine {
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machinePath;$userPath"
}

function Install-NodeViaWinget {
    if (-not (Test-Command "winget")) { return $false }
    Write-Host "  Installing Node.js via winget..." -ForegroundColor DarkGray
    try {
        $args = @(
            "install", "--id", "OpenJS.NodeJS.LTS",
            "--silent", "--accept-source-agreements", "--accept-package-agreements",
            "--scope", "machine"
        )
        $proc = Start-Process -FilePath "winget" -ArgumentList $args -Wait -PassThru -NoNewWindow
        if ($proc.ExitCode -eq 0) {
            Update-PathFromMachine
            return (Test-Command "node")
        }
    } catch {
        Write-Host "  winget install failed: $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
    return $false
}

function Install-NodeViaChoco {
    if (-not (Test-Command "choco")) { return $false }
    Write-Host "  Installing Node.js via Chocolatey..." -ForegroundColor DarkGray
    try {
        $proc = Start-Process -FilePath "choco" -ArgumentList @("install", "nodejs-lts", "-y", "--no-progress") -Wait -PassThru -NoNewWindow
        if ($proc.ExitCode -eq 0) {
            Update-PathFromMachine
            return (Test-Command "node")
        }
    } catch {
        Write-Host "  choco install failed: $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
    return $false
}

function Install-NodeViaMsi {
    Write-Host "  Downloading Node.js LTS installer..." -ForegroundColor DarkGray
    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    $version = "v22.14.0"
    $url = "https://nodejs.org/dist/$version/node-$version-$arch.msi"
    $tmp = Join-Path $env:TEMP "node-installer-$([Guid]::NewGuid()).msi"

    try {
        Invoke-WebRequest -Uri $url -OutFile $tmp -UseBasicParsing
    } catch {
        Write-Host "  Could not download Node installer." -ForegroundColor Red
        Write-Host "  Manual install: https://nodejs.org" -ForegroundColor Yellow
        return $false
    }

    Write-Host "  Running Node.js installer (UAC prompt may appear)..." -ForegroundColor DarkGray
    try {
        $msiArgs = @("/i", "`"$tmp`"", "/qn", "/norestart")
        $proc = Start-Process -FilePath "msiexec.exe" -ArgumentList $msiArgs -Wait -PassThru -Verb RunAs
        Remove-Item $tmp -ErrorAction SilentlyContinue
        if ($proc.ExitCode -eq 0) {
            Update-PathFromMachine
            return (Test-Command "node")
        }
        Write-Host "  msiexec exited with code $($proc.ExitCode)" -ForegroundColor Red
    } catch {
        Write-Host "  MSI install failed: $($_.Exception.Message)" -ForegroundColor Red
        Remove-Item $tmp -ErrorAction SilentlyContinue
    }
    return $false
}

function Install-Node {
    Write-Host "✗ Node.js not installed" -ForegroundColor Red
    Write-Host ""

    if (Install-NodeViaWinget) { return $true }
    if (Install-NodeViaChoco)  { return $true }
    if (Install-NodeViaMsi)    { return $true }

    Write-Host ""
    Write-Host "✗ Could not install Node.js automatically." -ForegroundColor Red
    Write-Host "  Install manually from https://nodejs.org and re-run:" -ForegroundColor Yellow
    Write-Host "  iwr -useb https://apiclaw.cloud/install.ps1 | iex" -ForegroundColor Yellow
    return $false
}

# ── Run ──────────────────────────────────────────────────────────────────
Write-Banner

# Step 1: ensure Node.js
if (Test-Command "node") {
    $nodeVersion = (& node -v)
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    if (-not (Install-Node)) { exit 1 }
    $nodeVersion = (& node -v)
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
}

# Step 2: ensure npx
if (-not (Test-Command "npx")) {
    Write-Host "✗ npx not found (should ship with Node.js)." -ForegroundColor Red
    Write-Host "  Try: npm install -g npm" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ npx available" -ForegroundColor Green

# Step 3: run the MCP installer
Write-Host ""
Write-Host "Installing APIClaw MCP server..." -ForegroundColor Cyan
Write-Host ""

$npxArgs = @("-y", "@nordsym/apiclaw@latest", "mcp-install")
& npx @npxArgs
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "✗ MCP install step failed (exit $LASTEXITCODE)." -ForegroundColor Red
    Write-Host "  Full guide: https://apiclaw.cloud/install" -ForegroundColor Yellow
    exit $LASTEXITCODE
}

# First-run auth gate. Never print Done until whoami works and the first
# POST /v1/execute returns 200 (NASA APOD, Frankfurter /latest fallback).
$AuthLoginCmd = "npx @nordsym/apiclaw auth login"
$AuthWhoamiCmd = "npx @nordsym/apiclaw auth whoami"
$AuthFirstCallCmd = "npx @nordsym/apiclaw auth first-call"

function Test-ApiclawCanLaunchAuth {
    if ($env:CI) { return $false }
    if ($env:APICLAW_SKIP_AUTH -eq "1" -or $env:APICLAW_SKIP_AUTH -eq "true") { return $false }
    return [Environment]::UserInteractive
}

Write-Host ""
Write-Host "Next step: sign in so a managed call can succeed." -ForegroundColor Cyan
Write-Host "  $AuthLoginCmd"
Write-Host "MCP/CLI first_run prints a live https://apiclaw.cloud/auth/cli?authId= URL." -ForegroundColor DarkGray
Write-Host "Show that URL. Do not only print the login command." -ForegroundColor DarkGray
Write-Host "Finish Google or email on that URL — that Authorizes (one action)." -ForegroundColor DarkGray
Write-Host "If you are already signed in, click Authorize. Then:" -ForegroundColor DarkGray
Write-Host "  $AuthWhoamiCmd"

if (Test-ApiclawCanLaunchAuth) {
    Write-Host "Opening browser sign-in. Keep this in the foreground until whoami prints an email." -ForegroundColor DarkGray
    try {
        & npx -y @nordsym/apiclaw@latest auth login
    } catch {
        Write-Host "Sign-in did not finish. You can re-run: $AuthLoginCmd" -ForegroundColor Yellow
    }
}

function Test-ApiclawWhoami {
    $toml = Join-Path $HOME ".apiclaw.toml"
    $legacy = Join-Path $HOME ".apiclaw\session"
    if ((Test-Path $toml) -and (Select-String -Path $toml -Pattern "session_token" -Quiet) -and (Select-String -Path $toml -Pattern "email" -Quiet)) {
        return $true
    }
    if (Test-Path $legacy) { return $true }
    return $false
}

function Get-ApiclawSessionToken {
    $toml = Join-Path $HOME ".apiclaw.toml"
    if (Test-Path $toml) {
        $match = Select-String -Path $toml -Pattern 'session_token\s*=\s*"([^"]+)"'
        if ($match) { return $match.Matches[0].Groups[1].Value }
    }
    $legacy = Join-Path $HOME ".apiclaw\session"
    if (Test-Path $legacy) {
        $data = Get-Content -Raw -Path $legacy | ConvertFrom-Json
        if ($data.sessionToken) { return $data.sessionToken }
    }
    return $null
}

function Invoke-ApiclawFirstExecute {
    $token = Get-ApiclawSessionToken
    if (-not $token) { return $null }
    $gateway = $env:APICLAW_GATEWAY_URL
    if (-not $gateway) { $gateway = "https://adventurous-avocet-799.convex.site" }
    $headers = @{
        "Content-Type" = "application/json"
        "X-APIClaw-Session" = $token
    }
    $attempts = @(
        @{ provider = "nasa"; action = "apod"; params = @{} },
        @{ provider = "frankfurter"; action = "latest"; params = @{ path = "/latest" } }
    )
    foreach ($attempt in $attempts) {
        $headers["Idempotency-Key"] = "apiclaw-first-$($attempt.provider)-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
        try {
            $res = Invoke-RestMethod -Method Post -Uri "$gateway/v1/execute" -Headers $headers -Body ($attempt | ConvertTo-Json -Compress)
            if ($res.success -eq $false) { continue }
            if ($attempt.provider -eq "nasa") {
                $title = $res.data.title
                if ($title) { return "NASA APOD: $title" }
                return "NASA APOD received"
            }
            $usd = $res.data.rates.USD
            if ($usd) { return "EUR/USD $usd" }
            return "EUR FX rate received"
        } catch {
            continue
        }
    }
    return $null
}

# whoami redeems a claimed Authorize even if auth login timed out or
# localhost never answered. Always run it before trusting the session file.
& npx -y @nordsym/apiclaw@latest auth whoami
if (Test-ApiclawWhoami) {
    Write-Host ""
    $firstLine = Invoke-ApiclawFirstExecute
    if ($firstLine) {
        Write-Host "Done." -ForegroundColor Green -NoNewline
        Write-Host " Signed in."
        Write-Host $firstLine -ForegroundColor DarkGray
        Write-Host "Restart Claude Desktop to activate the MCP server." -ForegroundColor DarkGray
        Write-Host ""
        exit 0
    }
    Write-Host ""
    Write-Host "Not done." -ForegroundColor Red -NoNewline
    Write-Host " Sign-in worked, but the first execute did not succeed."
    Write-Host "  $AuthFirstCallCmd"
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Not done." -ForegroundColor Red -NoNewline
Write-Host " Sign-in is required before any managed call."
Write-Host "  $AuthLoginCmd"
Write-Host "Headless or SSH? Open the browser URL on another device, then confirm:" -ForegroundColor Yellow
Write-Host "  $AuthWhoamiCmd"
Write-Host ""
exit 1
