#!/usr/bin/env bash
# APIClaw MCP Installer — macOS and Linux
# Usage: curl -fsSL https://apiclaw.cloud/install.sh | bash
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

print_banner() {
    echo ""
    echo -e "${CYAN}${BOLD}  ╔═══════════════════════════════════════╗${NC}"
    echo -e "${CYAN}${BOLD}  ║       APIClaw MCP Installer           ║${NC}"
    echo -e "${CYAN}${BOLD}  ║       The API layer for AI agents     ║${NC}"
    echo -e "${CYAN}${BOLD}  ╚═══════════════════════════════════════╝${NC}"
    echo ""
}

have() { command -v "$1" &>/dev/null; }

install_node_macos() {
    if have brew; then
        echo -e "${DIM}  Installing Node.js via Homebrew...${NC}"
        brew install node
        return 0
    fi

    local arch
    arch=$(uname -m)
    local pkg
    if [ "$arch" = "arm64" ]; then
        pkg="https://nodejs.org/dist/v22.14.0/node-v22.14.0.pkg"
    else
        pkg="https://nodejs.org/dist/v22.14.0/node-v22.14.0.pkg"
    fi

    local tmp
    tmp=$(mktemp /tmp/node-installer.XXXXXX.pkg)
    echo -e "${DIM}  Downloading Node.js installer...${NC}"
    curl -fsSL "$pkg" -o "$tmp"

    echo -e "  ${BOLD}Node.js needs to be installed system-wide.${NC}"
    echo -e "  ${DIM}You may be asked for your password.${NC}"
    echo ""

    sudo installer -pkg "$tmp" -target /
    rm -f "$tmp"
    export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
}

install_node_linux() {
    # Distro detection -> package manager
    local family=""
    if [ -r /etc/os-release ]; then
        # shellcheck disable=SC1091
        . /etc/os-release
        family="${ID_LIKE:-$ID}"
    fi

    if have apt-get; then
        echo -e "${DIM}  Installing Node.js via apt...${NC}"
        # NodeSource setup (LTS) — safe to no-op if already configured
        if [ -t 0 ]; then
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        else
            curl -fsSL https://deb.nodesource.com/setup_lts.x -o /tmp/nodesource_setup.sh
            sudo -E bash /tmp/nodesource_setup.sh
            rm -f /tmp/nodesource_setup.sh
        fi
        sudo apt-get install -y nodejs
    elif have dnf; then
        echo -e "${DIM}  Installing Node.js via dnf...${NC}"
        curl -fsSL https://rpm.nodesource.com/setup_lts.x -o /tmp/nodesource_setup.sh
        sudo -E bash /tmp/nodesource_setup.sh
        rm -f /tmp/nodesource_setup.sh
        sudo dnf install -y nodejs
    elif have yum; then
        echo -e "${DIM}  Installing Node.js via yum...${NC}"
        curl -fsSL https://rpm.nodesource.com/setup_lts.x -o /tmp/nodesource_setup.sh
        sudo -E bash /tmp/nodesource_setup.sh
        rm -f /tmp/nodesource_setup.sh
        sudo yum install -y nodejs
    elif have pacman; then
        echo -e "${DIM}  Installing Node.js via pacman...${NC}"
        sudo pacman -Sy --noconfirm nodejs npm
    elif have zypper; then
        echo -e "${DIM}  Installing Node.js via zypper...${NC}"
        sudo zypper -n install nodejs
    elif have apk; then
        echo -e "${DIM}  Installing Node.js via apk...${NC}"
        sudo apk add --no-cache nodejs npm
    else
        echo -e "${RED}✗${NC} No supported package manager found (apt/dnf/yum/pacman/zypper/apk)."
        echo -e "${YELLOW}  Install Node.js LTS manually:${NC} https://nodejs.org"
        return 1
    fi
}

# ── Run ───────────────────────────────────────────────────────────────────
print_banner

# Step 1: ensure Node.js
if have node; then
    echo -e "${GREEN}✓${NC} Node.js found: $(node -v)"
else
    echo -e "${RED}✗${NC} Node.js not installed"
    echo ""

    OS=$(uname -s)
    case "$OS" in
        Darwin)
            install_node_macos
            ;;
        Linux)
            install_node_linux || exit 1
            ;;
        *)
            echo -e "${RED}✗${NC} Unsupported OS: $OS"
            echo -e "${YELLOW}  Install Node.js LTS manually:${NC} https://nodejs.org"
            exit 1
            ;;
    esac

    if have node; then
        echo -e "${GREEN}✓${NC} Node.js installed: $(node -v)"
    else
        echo -e "${RED}✗${NC} Node.js install did not complete."
        echo -e "${YELLOW}  Manual install:${NC} https://nodejs.org"
        echo -e "${YELLOW}  Full guide:${NC}   https://apiclaw.cloud/install"
        exit 1
    fi
fi

# Step 2: ensure npx
if ! have npx; then
    echo -e "${RED}✗${NC} npx not found (should ship with Node.js)."
    echo -e "${YELLOW}  Try:${NC} npm install -g npm"
    exit 1
fi
echo -e "${GREEN}✓${NC} npx available"

# Step 3: run the MCP installer
echo ""
echo -e "${CYAN}Installing APIClaw MCP server...${NC}"
echo ""

if ! npx -y @nordsym/apiclaw@latest mcp-install; then
    echo ""
    echo -e "${RED}✗${NC} MCP install step failed."
    echo -e "${YELLOW}  Full guide:${NC} https://apiclaw.cloud/install"
    exit 1
fi

# First-run auth gate. Never print Done until whoami works and the first
# POST /v1/execute returns 200 (NASA APOD, Frankfurter /latest fallback).
AUTH_LOGIN_CMD="npx @nordsym/apiclaw auth login"
AUTH_WHOAMI_CMD="npx @nordsym/apiclaw auth whoami"
AUTH_FIRST_CALL_CMD="npx @nordsym/apiclaw auth first-call"

apiclaw_can_launch_auth() {
    if [ -n "${CI:-}" ] || [ "${APICLAW_SKIP_AUTH:-}" = "1" ] || [ "${APICLAW_SKIP_AUTH:-}" = "true" ]; then
        return 1
    fi
    case "$(uname -s)" in
        Darwin) return 0 ;;
        MINGW*|MSYS*|CYGWIN*) return 0 ;;
        *)
            if [ -n "${DISPLAY:-}" ] || [ -n "${WAYLAND_DISPLAY:-}" ]; then
                return 0
            fi
            return 1
            ;;
    esac
}

echo ""
echo -e "${CYAN}Next step: sign in so a managed call can succeed.${NC}"
echo -e "  ${BOLD}${AUTH_LOGIN_CMD}${NC}"
echo -e "${DIM}Finish Clerk on the login URL — that Authorizes the terminal.${NC}"
echo -e "${DIM}If you are already signed in, click Authorize. Then:${NC}"
echo -e "  ${AUTH_WHOAMI_CMD}"
echo ""

if apiclaw_can_launch_auth && { [ -t 1 ] || [ -t 0 ]; }; then
    echo -e "${DIM}Opening browser sign-in. Keep this in the foreground until whoami prints an email.${NC}"
    npx -y @nordsym/apiclaw@latest auth login || true
fi

# Published whoami used to exit 0 even when signed out. Trust the session file.
apiclaw_whoami_ok() {
    if [ -f "$HOME/.apiclaw.toml" ] && grep -q 'session_token' "$HOME/.apiclaw.toml" && grep -q 'email' "$HOME/.apiclaw.toml"; then
        return 0
    fi
    if [ -f "$HOME/.apiclaw/session" ]; then
        return 0
    fi
    return 1
}

# POST /v1/execute with provider/action. Never a catalog name on /v1/call.
apiclaw_first_execute() {
    node <<'NODE'
const fs = require("fs");
const os = require("os");
const path = require("path");

function sessionToken() {
  const toml = path.join(os.homedir(), ".apiclaw.toml");
  if (fs.existsSync(toml)) {
    const match = fs.readFileSync(toml, "utf8").match(/session_token\s*=\s*"([^"]+)"/);
    if (match) return match[1];
  }
  const legacy = path.join(os.homedir(), ".apiclaw", "session");
  if (fs.existsSync(legacy)) {
    const data = JSON.parse(fs.readFileSync(legacy, "utf8"));
    if (data.sessionToken) return data.sessionToken;
  }
  return "";
}

function line(provider, body) {
  const data = body && typeof body === "object" && body.data && typeof body.data === "object" ? body.data : body || {};
  if (provider === "nasa") {
    const title = typeof data.title === "string" ? data.title.trim() : "";
    return title ? `NASA APOD: ${title}` : "NASA APOD received";
  }
  const usd = data.rates && data.rates.USD;
  return usd != null ? `EUR/USD ${usd}` : "EUR FX rate received";
}

async function execute(token, provider, action, params) {
  const gateway = process.env.APICLAW_GATEWAY_URL || "https://adventurous-avocet-799.convex.site";
  const res = await fetch(`${gateway}/v1/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-APIClaw-Session": token,
      "Idempotency-Key": `apiclaw-first-${provider}-${Date.now()}`,
    },
    body: JSON.stringify({ provider, action, params }),
  });
  let body = {};
  try { body = JSON.parse(await res.text()); } catch {}
  return { status: res.status, body };
}

(async () => {
  const token = sessionToken();
  if (!token) process.exit(1);
  const nasa = await execute(token, "nasa", "apod", {});
  if (nasa.status === 200 && nasa.body.success !== false) {
    console.log(line("nasa", nasa.body));
    process.exit(0);
  }
  const fx = await execute(token, "frankfurter", "latest", { path: "/latest" });
  if (fx.status === 200 && fx.body.success !== false) {
    console.log(line("frankfurter", fx.body));
    process.exit(0);
  }
  process.exit(1);
})();
NODE
}

# whoami redeems a claimed Authorize even if auth login timed out or
# localhost never answered. Always run it before trusting the session file.
npx -y @nordsym/apiclaw@latest auth whoami || true
if apiclaw_whoami_ok; then
    echo ""
    FIRST_LINE=""
    if FIRST_LINE=$(apiclaw_first_execute); then
        echo -e "${GREEN}${BOLD}Done.${NC} Signed in."
        echo -e "${DIM}${FIRST_LINE}${NC}"
        echo -e "${DIM}Restart Claude Desktop to activate the MCP server.${NC}"
        echo ""
        exit 0
    fi
    echo ""
    echo -e "${RED}${BOLD}Not done.${NC} Sign-in worked, but the first execute did not succeed."
    echo -e "  ${AUTH_FIRST_CALL_CMD}"
    echo ""
    exit 1
fi

echo ""
echo -e "${RED}${BOLD}Not done.${NC} Sign-in is required before any managed call."
echo -e "  ${BOLD}${AUTH_LOGIN_CMD}${NC}"
echo -e "${YELLOW}Headless or SSH? Open the browser URL on another device, then confirm:${NC}"
echo -e "  ${AUTH_WHOAMI_CMD}"
echo ""
exit 1
