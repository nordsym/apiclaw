#!/usr/bin/env node
/**
 * APIClaw Entry Point
 * 
 * - No args or MCP-related args → Run MCP server
 * - setup/doctor/restore/uninstall → Run CLI
 */

import { existsSync } from 'fs';
import { join } from 'path';

const cliCommands = ['setup', 'login', 'demo', 'mcp-install', 'mcp-uninstall', 'doctor', 'restore', 'uninstall', 'help', '--help', '-h', '--version', '-V'];

const firstArg = process.argv[2];

if (!firstArg || !cliCommands.includes(firstArg)) {
  // First-run nudge: non-blocking hint if no workspace is configured
  try {
    const sessionFile = join(process.env.HOME ?? '~', '.apiclaw', 'session');
    if (!existsSync(sessionFile)) {
      process.stderr.write(
        '\x1b[33m💡 No workspace linked. Run: npx @nordsym/apiclaw login\x1b[0m\n'
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
