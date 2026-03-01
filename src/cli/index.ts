#!/usr/bin/env node
/**
 * APIClaw MCP Auto-Setup CLI
 * Enterprise-grade, platform-agnostic configuration tool
 */

import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { setupCommand } from './commands/setup.js';
import { doctorCommand } from './commands/doctor.js';
import { restoreCommand } from './commands/restore.js';
import { uninstallCommand } from './commands/uninstall.js';
import { generateScript } from '../enterprise/script-generator.js';
import { detectOS, getOSDisplayName } from '../utils/os.js';

const VERSION = '1.0.0';

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

// Parse and execute
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
