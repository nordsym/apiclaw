#!/usr/bin/env node
/**
 * APIClaw Entry Point
 * 
 * - No args or MCP-related args → Run MCP server
 * - setup/doctor/restore/uninstall → Run CLI
 */

import { existsSync } from 'fs';
import { join } from 'path';

const cliCommands = ['auth', 'setup', 'login', 'demo', 'mcp', 'mcp-install', 'mcp-uninstall', 'doctor', 'restore', 'uninstall', 'mission', 'discover', 'call', 'details', 'balance', 'help', '--help', '-h', '--version', '-V'];

const firstArg = process.argv[2];

if (!firstArg || !cliCommands.includes(firstArg)) {
  // First-run nudge: non-blocking hint if no workspace is configured.
  // Checks both the new ~/.apiclaw.toml (A-22 canonical) and the legacy
  // ~/.apiclaw/session file so existing installs keep their state.
  try {
    const home = process.env.HOME ?? '~';
    const tomlFile = join(home, '.apiclaw.toml');
    const legacySessionFile = join(home, '.apiclaw', 'session');
    if (!existsSync(tomlFile) && !existsSync(legacySessionFile)) {
      process.stderr.write(
        '\x1b[33m💡 No workspace linked. Run: npx @nordsym/apiclaw auth login\x1b[0m\n'
      );
    }
  } catch {
    // Never let this block server startup
  }

  // Run MCP server
  import('./index.js');
} else {
  // Run CLI
  import('./cli/index.js');
}
