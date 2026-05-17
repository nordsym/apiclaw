/**
 * MCP Install Command
 * Simple, focused command to install APIClaw into MCP config files
 * Supports Claude Desktop and Claude Code
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { platform, homedir } from 'os';
import { execSync } from 'child_process';
import chalk from 'chalk';

export interface MCPInstallOptions {
  client?: string;
  dryRun?: boolean;
}

type Platform = 'mac' | 'win' | 'linux';

interface ClientConfig {
  name: string;
  displayName: string;
  getConfigPath: () => string;
  configKey: string; // Key path in config (e.g., "mcpServers" or root level)
}

/**
 * Detect operating system
 */
function detectOS(): Platform {
  const os = platform();
  switch (os) {
    case 'darwin': return 'mac';
    case 'win32': return 'win';
    default: return 'linux';
  }
}

/**
 * Get home directory
 */
function getHome(): string {
  return homedir();
}

/**
 * Get config paths for supported clients
 */
function getClientConfigs(): ClientConfig[] {
  const os = detectOS();
  const home = getHome();
  
  const clients: ClientConfig[] = [
    {
      name: 'claude-desktop',
      displayName: 'Claude Desktop',
      configKey: 'mcpServers',
      getConfigPath: () => {
        switch (os) {
          case 'mac':
            return join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
          case 'win':
            return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json');
          case 'linux':
            return join(home, '.config', 'Claude', 'claude_desktop_config.json');
        }
      },
    },
    {
      name: 'claude-code',
      displayName: 'Claude Code',
      configKey: 'mcpServers',
      getConfigPath: () => {
        // Claude Code uses ~/.claude.json on all platforms
        return join(home, '.claude.json');
      },
    },
    {
      name: 'codex',
      displayName: 'Codex (OpenAI)',
      configKey: 'mcp',
      getConfigPath: () => {
        // Codex uses ~/.codex/config.toml
        return join(home, '.codex', 'config.toml');
      },
    },
  ];
  
  return clients;
}

/**
 * APIClaw MCP server configuration
 */
const APICLAW_CONFIG = {
  command: 'npx',
  args: ['-y', '@nordsym/apiclaw', 'serve'],
};

/**
 * Read JSON config file
 */
function readConfig(path: string): { success: boolean; config: any; error?: string; isNew?: boolean } {
  try {
    if (!existsSync(path)) {
      return { success: true, config: {}, isNew: true };
    }
    
    const content = readFileSync(path, 'utf-8');
    if (!content.trim()) {
      return { success: true, config: {}, isNew: true };
    }
    
    return { success: true, config: JSON.parse(content), isNew: false };
  } catch (error) {
    return { 
      success: false, 
      config: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Write JSON config file with backup
 */
function writeConfig(path: string, config: any, createBackup = true): { success: boolean; error?: string } {
  try {
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // Create backup if file exists
    if (createBackup && existsSync(path)) {
      const backupPath = `${path}.backup.${Date.now()}.json`;
      const existing = readFileSync(path, 'utf-8');
      writeFileSync(backupPath, existing, 'utf-8');
    }
    
    writeFileSync(path, JSON.stringify(config, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if Codex CLI is available
 */
function isCodexAvailable(): boolean {
  try {
    execSync('codex --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Install APIClaw to Codex using CLI
 */
function installToCodex(dryRun: boolean): { success: boolean; message: string; skipped?: boolean } {
  if (!isCodexAvailable()) {
    return { success: false, message: 'Codex CLI not found' };
  }
  
  try {
    // Check if already installed
    try {
      const output = execSync('codex mcp get apiclaw', { encoding: 'utf-8', stdio: 'pipe' });
      if (output.includes('apiclaw')) {
        return { success: true, message: 'Already installed', skipped: true };
      }
    } catch {
      // Not installed, continue
    }
    
    if (dryRun) {
      console.log(chalk.cyan('\n  Would run: codex mcp add apiclaw -- npx -y @nordsym/apiclaw'));
      return { success: true, message: 'Dry run - no changes made', skipped: true };
    }
    
    // Install
    execSync('codex mcp add apiclaw -- npx -y @nordsym/apiclaw', { stdio: 'pipe' });
    return { success: true, message: 'Installed via CLI' };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Install APIClaw into a client config
 */
function installToClient(client: ClientConfig, dryRun: boolean): { success: boolean; message: string; skipped?: boolean } {
  // Special handling for Codex
  if (client.name === 'codex') {
    return installToCodex(dryRun);
  }
  
  const configPath = client.getConfigPath();
  
  // Read existing config
  const readResult = readConfig(configPath);
  if (!readResult.success) {
    return { success: false, message: `Failed to read config: ${readResult.error}` };
  }
  
  const config = readResult.config;
  
  // Initialize mcpServers if not present
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  // Check if already installed
  if (config.mcpServers.apiclaw) {
    return { success: true, message: 'Already installed', skipped: true };
  }
  
  // Add APIClaw config
  config.mcpServers.apiclaw = APICLAW_CONFIG;
  
  if (dryRun) {
    console.log(chalk.cyan(`\n  Would add to ${configPath}:`));
    console.log(chalk.gray(JSON.stringify({ apiclaw: APICLAW_CONFIG }, null, 4)));
    return { success: true, message: 'Dry run - no changes made', skipped: true };
  }
  
  // Write config
  const writeResult = writeConfig(configPath, config);
  if (!writeResult.success) {
    return { success: false, message: `Failed to write config: ${writeResult.error}` };
  }
  
  return { 
    success: true, 
    message: readResult.isNew ? 'Created new config' : 'Updated config' 
  };
}

/**
 * Main mcp-install command handler
 */
export async function mcpInstallCommand(options: MCPInstallOptions): Promise<void> {
  const os = detectOS();
  const osName = os === 'mac' ? 'macOS' : os === 'win' ? 'Windows' : 'Linux';
  
  console.log(chalk.bold('\n🦞 APIClaw MCP Install\n'));
  console.log(`Platform: ${osName}\n`);
  
  const clients = getClientConfigs();
  let targetClients = clients;
  
  // Filter to specific client if requested
  if (options.client) {
    const normalizedClient = options.client.toLowerCase().replace(/[_\s]/g, '-');
    const aliases: Record<string, string> = {
      'claude': 'claude-desktop',
      'claude-desktop': 'claude-desktop',
      'claudedesktop': 'claude-desktop',
      'desktop': 'claude-desktop',
      'code': 'claude-code',
      'claude-code': 'claude-code',
      'claudecode': 'claude-code',
      'codex': 'codex',
      'openai': 'codex',
    };
    
    const targetName = aliases[normalizedClient];
    if (!targetName) {
      console.log(chalk.red(`❌ Unknown client: ${options.client}`));
      console.log('   Supported: claude-desktop, claude-code, codex');
      process.exit(1);
    }
    
    targetClients = clients.filter(c => c.name === targetName);
  }
  
  // Detect which clients exist
  console.log('🔍 Detecting MCP clients...\n');
  
  const detectedClients: ClientConfig[] = [];
  for (const client of targetClients) {
    let exists = false;
    
    // Special detection for Codex (check CLI availability)
    if (client.name === 'codex') {
      exists = isCodexAvailable();
    } else {
      // For JSON-based configs, check file/dir existence
      const configPath = client.getConfigPath();
      const configDir = dirname(configPath);
      exists = existsSync(configPath) || existsSync(configDir);
    }
    
    const icon = exists ? chalk.green('✓') : chalk.gray('✗');
    const status = exists ? 'found' : 'not found';
    console.log(`   ${icon} ${client.displayName} ${status}`);
    
    if (exists) {
      detectedClients.push(client);
    }
  }
  
  console.log('');
  
  if (detectedClients.length === 0) {
    console.log(chalk.yellow('⚠️  No MCP clients detected.'));
    console.log('   Install Claude Desktop or Claude Code first.\n');
    process.exit(0);
  }
  
  // Install to each detected client
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  
  for (const client of detectedClients) {
    const result = installToClient(client, options.dryRun || false);
    
    if (result.success) {
      if (result.skipped) {
        skipCount++;
        console.log(chalk.yellow(`⏭️  ${client.displayName}: ${result.message}`));
      } else {
        successCount++;
        console.log(chalk.green(`✓ ${client.displayName}: ${result.message}`));
      }
    } else {
      failCount++;
      console.log(chalk.red(`✗ ${client.displayName}: ${result.message}`));
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(50));
  
  if (failCount === 0) {
    if (options.dryRun) {
      console.log(chalk.cyan('\n✅ Dry run complete! Run without --dry-run to apply changes.\n'));
    } else if (successCount > 0) {
      console.log(chalk.green('\n✅ APIClaw installed successfully!\n'));
      console.log(chalk.bold('What you get:\n'));
      console.log(chalk.cyan('  🔍 Search') + '      22,000+ APIs to discover');
      console.log(chalk.cyan('  🌐 Open APIs') + '   1,600 free APIs');
      console.log(chalk.cyan('  🔑 Managed') + ' 1,500+ premium (APIClaw manages keys)');
      console.log('');
      console.log('Next:');
      console.log('  1. Restart your MCP client');
      console.log('  2. Try: "Find weather APIs"');
      console.log('');
      console.log('Docs: https://apiclaw.com/docs\n');
    } else {
      console.log(chalk.yellow('\n✅ APIClaw already installed in all clients.\n'));
      console.log(chalk.bold('What you have:\n'));
      console.log(chalk.cyan('  🔍 Search') + '      22,000+ APIs to discover');
      console.log(chalk.cyan('  🌐 Open APIs') + '   1,600 free APIs');
      console.log(chalk.cyan('  🔑 Managed') + ' 1,500+ premium (APIClaw manages keys)');
      console.log('');
      console.log('Run with --force to reinstall (coming soon).\n');
    }
  } else {
    console.log(chalk.red(`\n⚠️  Installation completed with ${failCount} error(s).\n`));
    process.exit(1);
  }
}
