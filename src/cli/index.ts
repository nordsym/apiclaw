#!/usr/bin/env node
/**
 * APIClaw MCP Auto-Setup CLI
 * Enterprise-grade, platform-agnostic configuration tool
 */

import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { setupCommand } from './commands/setup.js';
import { mcpInstallCommand } from './commands/mcp-install.js';
import { doctorCommand } from './commands/doctor.js';
import { restoreCommand } from './commands/restore.js';
import { uninstallCommand } from './commands/uninstall.js';
import { authFirstCallCommand, authLoginCommand, authLogoutCommand, authWhoamiCommand } from './commands/auth.js';
import { demoCommand } from './commands/demo.js';
import { missionCommand } from './commands/mission.js';
import { discoverCommand, callCommand, detailsCommand, balanceCommand } from './commands/direct.js';
import { generateScript } from '../enterprise/script-generator.js';
import { detectOS, getOSDisplayName } from '../utils/os.js';

const VERSION = '2.9.3';

const program = new Command();

program
  .name('apiclaw')
  .description('APIClaw MCP Auto-Setup - Configure APIClaw across all your AI coding assistants')
  .version(VERSION);

// Setup command - main entry point
program
  .command('setup')
  .description('Configure APIClaw for MCP clients')
  .option('-c, --client <client>', 'Target specific client (claude-desktop, cursor, windsurf, cline, continue)')
  .option('--config <path>', 'Custom config file path')
  .option('-w, --workspace <id>', 'Pre-link APIClaw workspace ID')
  .option('--dry-run', 'Show what would happen without making changes')
  .option('-f, --force', 'Overwrite existing APIClaw configuration')
  .option('--wizard', 'Interactive setup wizard')
  .option('--all', 'Configure all detected clients')
  .option('-v, --verbose', 'Verbose output')
  .option('--enterprise', 'Generate enterprise deployment script')
  .option('--output <file>', 'Output file for enterprise script')
  .option('--script-type <type>', 'Script type: bash or powershell (default: auto)')
  .action(async (options) => {
    // Enterprise script generation mode
    if (options.enterprise) {
      const scriptType = options.scriptType || 'auto';
      const result = generateScript(scriptType, {
        workspace: options.workspace,
        verbose: options.verbose,
      });
      
      if (options.output) {
        writeFileSync(options.output, result.script);
        console.log(`\n✓ Enterprise script written to: ${options.output}`);
        console.log(`  Type: ${result.platform}`);
        console.log(`\nUsage:`);
        if (result.platform === 'bash') {
          console.log(`  chmod +x ${options.output}`);
          console.log(`  ./${options.output}`);
        } else {
          console.log(`  powershell -ExecutionPolicy Bypass -File ${options.output}`);
        }
        console.log('');
      } else {
        console.log(result.script);
      }
      return;
    }
    
    // Normal setup
    await setupCommand(options);
  });

// MCP Install command - simple focused installation
program
  .command('mcp-install')
  .description('Install APIClaw into Claude Desktop or Claude Code MCP config')
  .option('-c, --client <client>', 'Target specific client (claude-desktop, claude-code)')
  .option('--dry-run', 'Show what would happen without making changes')
  .action(mcpInstallCommand);

// Doctor command - health check
program
  .command('doctor')
  .description('Diagnose APIClaw setup and connectivity')
  .option('--server-name <name>', 'Server name to check (default: apiclaw)')
  .option('--json', 'Output as JSON')
  .action(doctorCommand);

// Restore command - rollback from backup
program
  .command('restore')
  .description('Restore config from backup')
  .option('-c, --client <client>', 'Target specific client')
  .option('-l, --list', 'List available backups')
  .option('-b, --backup <file>', 'Specific backup file to restore')
  .option('--dry-run', 'Show what would be done without making changes')
  .action(restoreCommand);

// Uninstall command - remove APIClaw
program
  .command('uninstall')
  .description('Remove APIClaw from all configured clients')
  .option('-c, --client <client>', 'Target specific client')
  .option('--all', 'Remove from all clients')
  .option('--server-name <name>', 'Server name to remove (default: apiclaw)')
  .option('--no-backup', 'Skip backup creation')
  .option('--dry-run', 'Show what would be done without making changes')
  .option('-f, --force', 'Remove even if not configured')
  .action(uninstallCommand);

// Auth — agent-native browser-loopback flow (the only login path).
// `apiclaw auth login` is canonical; `apiclaw login` is a thin alias.
const authCmd = program
  .command('auth')
  .description('Authenticate the APIClaw CLI (Modal-style browser-loopback flow)');

authCmd
  .command('login')
  .description('Open browser, stay in front until Clerk writes session_token to ~/.apiclaw.toml')
  .option('-f, --force', 'Re-authenticate even if already signed in')
  .option('--print-mcp-token', 'Also issue an sk-mcp-* token for Remote MCP fallback (not yet implemented)')
  .option('--no-open', 'Print the URL instead of opening the browser')
  .action(async (options) => {
    const result = await authLoginCommand({
      force: options.force,
      printMcpToken: options.printMcpToken,
      noOpen: !options.open, // commander inverts --no-open
    });
    if (!result?.sessionToken) process.exit(1);
  });

authCmd
  .command('logout')
  .description('Revoke remote credentials and clear ~/.apiclaw.toml')
  .action(async () => {
    await authLogoutCommand();
  });

authCmd
  .command('whoami')
  .description('Show the currently authenticated workspace. Required before call / first execute. Prints the pending Clerk login URL if sign-in is incomplete')
  .action(async () => {
    const ok = await authWhoamiCommand();
    if (!ok) process.exit(1);
  });

authCmd
  .command('first-call')
  .description('Complete the first research execute (NASA APOD, Frankfurter fallback)')
  .action(async () => {
    const ok = await authFirstCallCommand();
    if (!ok) process.exit(1);
  });

// `apiclaw login` — thin alias for `apiclaw auth login` (browser-loopback).
program
  .command('login')
  .description('Sign in or create a free APIClaw workspace (alias of `auth login`)')
  .option('-f, --force', 'Force re-login even if already signed in')
  .action(async (options) => {
    const result = await authLoginCommand({ force: options.force });
    if (!result?.sessionToken) process.exit(1);
  });

// MCP — explicit alias for the stdio server that bare `apiclaw` (no args)
// already runs (see src/bin.ts's dispatch table). Exists so `--help` and
// docs can point at one unambiguous command instead of relying on users to
// infer that no-args-at-all means "run the server".
program
  .command('mcp')
  .description('Run as a local MCP server over stdio (same as bare `apiclaw`)')
  .action(async () => {
    await import('../index.js');
  });

// Demo command — fire a live API call in the terminal
program
  .command('demo')
  .description('Run a live API call to see APIClaw in action')
  .action(async () => {
    await demoCommand();
  });

// MCP Uninstall alias - same as uninstall but for consistency with mcp-install
program
  .command('mcp-uninstall')
  .description('Remove APIClaw from Claude Desktop or Claude Code MCP config')
  .option('-c, --client <client>', 'Target specific client (claude-desktop, claude-code)')
  .option('--dry-run', 'Show what would be done without making changes')
  .action(uninstallCommand);

// Direct CLI parity with the MCP tool surface.
program
  .command('discover <query>')
  .description('Search APIClaw\'s catalog of 26,000+ APIs')
  .option('-c, --category <cat>', 'Filter by category')
  .option('--callable', 'Only return APIs APIClaw can execute')
  .option('-l, --limit <n>', 'Max results', (v) => parseInt(v, 10))
  .action(discoverCommand);

program
  .command('call <api>')
  .description('POST /v1/execute using session_token from ~/.apiclaw.toml as X-APIClaw-Session. Refuses locally until auth whoami succeeds; never sends an empty session header')
  .option('-p, --path <path>', 'API path (default /)')
  .option('-m, --method <method>', 'HTTP method (GET/POST/PUT/PATCH/DELETE)')
  .option('--params <json>', 'Query string parameters as JSON')
  .option('-d, --body <json>', 'Request body as JSON')
  .requiredOption('--idempotency-key <key>', 'Caller-owned operation key for this logical call')
  .action(callCommand);

program
  .command('details <api>')
  .description('Get full specs, pricing, auth for a specific API')
  .action(detailsCommand);

program
  .command('balance')
  .description('Workspace balance, tier, remaining calls')
  .action(balanceCommand);

program
  .command('acp')
  .description('Run APIClaw as an ACP (Agent Client Protocol) agent over stdio - for Buzz and other ACP clients')
  .action(async () => {
    const { runAcpServer } = await import('../acp-server.js');
    runAcpServer();
  });

// Control Plane — Missions
//
// Run an orchestration on APIClaw's runtime. Subcommands:
//   apiclaw mission templates                     # show registered templates
//   apiclaw mission start <template> [--key val]  # queue a mission
//   apiclaw mission watch <id>                    # tail events live
//   apiclaw mission status <id>                   # final state + result
//   apiclaw mission list                          # recent missions
program
  .command('mission [subcommand] [args...]')
  .description('Run, watch, and inspect missions on APIClaw\'s runtime')
  .allowUnknownOption(true)
  .action(async (subcommand: string | undefined, args: string[]) => {
    const argv: string[] = [];
    if (subcommand) argv.push(subcommand);
    if (Array.isArray(args)) argv.push(...args);
    await missionCommand(argv);
  });

// Parse and execute
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
