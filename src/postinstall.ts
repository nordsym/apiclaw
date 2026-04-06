#!/usr/bin/env node
/**
 * APIClaw Postinstall Hook
 * Prints a welcome message with links after install.
 * No network calls. No side effects.
 */

const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';

console.log('');
console.log(`  🦞 APIClaw installed successfully!`);
console.log('');
console.log(`  → Sign in:     ${CYAN}npx @nordsym/apiclaw login${RESET}`);
console.log(`  → Full setup:  ${CYAN}npx @nordsym/apiclaw setup${RESET}  ${DIM}(auto-detects Claude, Cursor, Windsurf)${RESET}`);
console.log(`  ⭐ Star us: ${CYAN}https://github.com/nordsym/apiclaw${RESET}  ${DIM}(helps more devs find us)${RESET}`);
console.log('');
