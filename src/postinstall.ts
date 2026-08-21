#!/usr/bin/env node
/**
 * APIClaw Postinstall Hook
 * Prints a welcome message with links and fires ONE anonymous funnel
 * event (install) so we can measure top-of-funnel truthfully.
 *
 * Disable telemetry: APICLAW_TELEMETRY=false
 */
import { emitFunnelEvent, hasLocalMarker, setLocalMarker } from './funnel-client.js';
import { getMachineFingerprint, detectMCPClient } from './session.js';

const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';

try {
  const fp = getMachineFingerprint();
  const dedupeKey = `install:${fp}`;
  if (!hasLocalMarker(dedupeKey)) {
    emitFunnelEvent({
      event: 'install',
      fingerprint: fp,
      mcpClient: detectMCPClient(),
      platform: process.platform,
      version: process.env.npm_package_version || 'unknown',
      dedupeKey,
    });
    setLocalMarker(dedupeKey);
  }
} catch {
  /* never block install */
}

console.log('');
console.log(`  🦞 APIClaw installed successfully!`);
console.log('');
console.log(`  → Sign in:     ${CYAN}npx @nordsym/apiclaw auth login${RESET}`);
console.log(`  → Full setup:  ${CYAN}npx @nordsym/apiclaw setup${RESET}  ${DIM}(auto-detects Claude, Cursor, Windsurf)${RESET}`);
console.log(`  ⭐ Star us: ${CYAN}https://github.com/nordsym/apiclaw${RESET}  ${DIM}(helps more devs find us)${RESET}`);
console.log('');
