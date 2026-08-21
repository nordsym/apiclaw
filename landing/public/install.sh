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

if ! npx -y @nordsym/apiclaw@2.8.7 mcp-install; then
    echo ""
    echo -e "${RED}✗${NC} MCP install step failed."
    echo -e "${YELLOW}  Full guide:${NC} https://apiclaw.cloud/install"
    exit 1
fi

echo ""
echo -e "${GREEN}${BOLD}Done!${NC} APIClaw is ready to use in Claude Desktop."
echo -e "${DIM}Restart Claude Desktop to activate.${NC}"
echo ""
