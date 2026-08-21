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

$npxArgs = @("-y", "@nordsym/apiclaw@2.8.7", "mcp-install")
& npx @npxArgs
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "✗ MCP install step failed (exit $LASTEXITCODE)." -ForegroundColor Red
    Write-Host "  Full guide: https://apiclaw.cloud/install" -ForegroundColor Yellow
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green -NoNewline
Write-Host " APIClaw is ready to use in Claude Desktop."
Write-Host "Restart Claude Desktop to activate." -ForegroundColor DarkGray
Write-Host ""
