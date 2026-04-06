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

echo ""
echo -e "${GREEN}${BOLD}Done!${NC} APIClaw is ready to use in Claude."
echo -e "${DIM}Restart Claude Desktop to activate.${NC}"
echo ""
