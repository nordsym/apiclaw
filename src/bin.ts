#!/usr/bin/env node
/**
 * APIClaw Entry Point
 * 
 * - No args or MCP-related args → Run MCP server
 * - setup/doctor/restore/uninstall → Run CLI
 */

const cliCommands = ['setup', 'doctor', 'restore', 'uninstall', 'help', '--help', '-h', '--version', '-V'];

const firstArg = process.argv[2];

if (!firstArg || !cliCommands.includes(firstArg)) {
  // Run MCP server
  import('./index.js');
} else {
  // Run CLI
  import('./cli/index.js');
}
