#!/bin/bash
# APIClaw MCP Installer — works on any Mac, even without Node.js
# Usage: curl -fsSL https://apiclaw.cloud/install.sh | bash
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}${BOLD}  ╔═══════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}  ║       APIClaw MCP Installer           ║${NC}"
echo -e "${CYAN}${BOLD}  ║       The API layer for AI agents     ║${NC}"
echo -e "${CYAN}${BOLD}  ╚═══════════════════════════════════════╝${NC}"
echo ""

# ── Step 1: Check for Node.js ──
if command -v node &>/dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js found: ${NODE_VERSION}"
else
    echo -e "${RED}✗${NC} Node.js not installed"
    echo ""
    
    # Try Homebrew first
    if command -v brew &>/dev/null; then
        echo -e "${DIM}  Installing Node.js via Homebrew...${NC}"
        brew install node
    else
        echo -e "${DIM}  Installing Node.js via official installer...${NC}"
        echo ""
        
        # Detect architecture
        ARCH=$(uname -m)
        if [ "$ARCH" = "arm64" ]; then
            NODE_PKG="https://nodejs.org/dist/v22.14.0/node-v22.14.0.pkg"
        else
            NODE_PKG="https://nodejs.org/dist/v22.14.0/node-v22.14.0.pkg"
        fi
        
        TMPFILE=$(mktemp /tmp/node-installer.XXXXXX.pkg)
        curl -fsSL "$NODE_PKG" -o "$TMPFILE"
        
        echo -e "  ${BOLD}Node.js needs to be installed system-wide.${NC}"
        echo -e "  ${DIM}You may be asked for your password.${NC}"
        echo ""
        
        sudo installer -pkg "$TMPFILE" -target /
        rm -f "$TMPFILE"
        
        # Refresh PATH
        export PATH="/usr/local/bin:$PATH"
    fi
    
    # Verify
    if command -v node &>/dev/null; then
        echo -e "${GREEN}✓${NC} Node.js installed: $(node -v)"
    else
        echo -e "${RED}✗${NC} Failed to install Node.js."
        echo "  Please install manually: https://nodejs.org"
        exit 1
    fi
fi

# ── Step 2: Check for npx ──
if ! command -v npx &>/dev/null; then
    echo -e "${RED}✗${NC} npx not found (should come with Node.js)"
    echo "  Try: npm install -g npm"
    exit 1
fi
echo -e "${GREEN}✓${NC} npx available"

# ── Step 3: Run APIClaw MCP installer ──
echo ""
echo -e "${CYAN}Installing APIClaw MCP server...${NC}"
echo ""
npx @nordsym/apiclaw@latest mcp-install

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
echo ""

if apiclaw_can_launch_auth && { [ -t 1 ] || [ -t 0 ]; }; then
    echo -e "${DIM}Opening browser sign-in...${NC}"
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
echo -e "${DIM}Headless or SSH? Open the browser URL on another device, then confirm:${NC}"
echo -e "  ${AUTH_WHOAMI_CMD}"
echo ""
exit 1
