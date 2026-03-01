/**
 * Uninstall Command
 * Remove APIClaw configuration from MCP clients
 */

import { existsSync } from 'fs';
import { getAllClients, getClientConfig, MCPClient, parseClientArg } from '../../utils/paths.js';
import { readConfig, writeConfig, removeApiclawConfig, hasApiclawConfig } from '../../utils/config.js';
import { createBackup } from '../../utils/backup.js';

export interface UninstallOptions {
  client?: string;         // Specific client to uninstall from
  all?: boolean;           // Uninstall from all clients
  serverName?: string;     // Server name to remove (default: 'apiclaw')
  noBackup?: boolean;      // Skip backup creation
  dryRun?: boolean;        // Show what would be done
  force?: boolean;         // Remove even if not configured
}

export interface UninstallResult {
  success: boolean;
  client: string;
  action: 'removed' | 'skipped' | 'not-found' | 'error';
  message: string;
  backupPath?: string;
}

/**
 * Remove APIClaw from a single client
 */
export function uninstallFromClient(
  client: MCPClient, 
  options: UninstallOptions = {}
): UninstallResult {
  const config = getClientConfig(client);
  const configPath = config.configPath;
  const serverName = options.serverName || 'apiclaw';
  
  // Check if config file exists
  if (!existsSync(configPath)) {
    return {
      success: true,
      client: config.displayName,
      action: 'not-found',
      message: 'Config file not found (client not installed)',
    };
  }
  
  // Read config
  const readResult = readConfig(configPath);
  
  if (!readResult.success || !readResult.config) {
    return {
      success: false,
      client: config.displayName,
      action: 'error',
      message: readResult.error || 'Failed to read config',
    };
  }
  
  // Check if APIClaw is configured
  if (!hasApiclawConfig(readResult.config, serverName)) {
    if (options.force) {
      return {
        success: true,
        client: config.displayName,
        action: 'skipped',
        message: `${serverName} not configured (forced check)`,
      };
    }
    
    return {
      success: true,
      client: config.displayName,
      action: 'skipped',
      message: `${serverName} not configured`,
    };
  }
  
  // Dry run - just report what would happen
  if (options.dryRun) {
    return {
      success: true,
      client: config.displayName,
      action: 'skipped',
      message: `Would remove ${serverName} (dry run)`,
    };
  }
  
  // Create backup before modifying
  let backupPath: string | undefined;
  if (!options.noBackup) {
    const backupResult = createBackup(configPath);
    if (backupResult.success) {
      backupPath = backupResult.backupPath || undefined;
    }
  }
  
  // Remove APIClaw from config
  const updatedConfig = removeApiclawConfig(readResult.config, serverName);
  
  // Write updated config (without creating another backup)
  const writeResult = writeConfig(configPath, updatedConfig, false);
  
  if (!writeResult.success) {
    return {
      success: false,
      client: config.displayName,
      action: 'error',
      message: writeResult.error || 'Failed to write config',
      backupPath,
    };
  }
  
  return {
    success: true,
    client: config.displayName,
    action: 'removed',
    message: `${serverName} removed`,
    backupPath,
  };
}

/**
 * Uninstall from all clients
 */
export function uninstallFromAll(options: UninstallOptions = {}): UninstallResult[] {
  const results: UninstallResult[] = [];
  
  for (const client of getAllClients()) {
    results.push(uninstallFromClient(client, options));
  }
  
  return results;
}

/**
 * Format uninstall results for display
 */
export function formatUninstallResults(results: UninstallResult[]): string {
  const lines: string[] = [];
  
  lines.push('');
  lines.push('🗑️  Uninstall Results');
  lines.push('====================');
  lines.push('');
  
  const removed = results.filter(r => r.action === 'removed');
  const skipped = results.filter(r => r.action === 'skipped');
  const notFound = results.filter(r => r.action === 'not-found');
  const errors = results.filter(r => r.action === 'error');
  
  // Show removed
  if (removed.length > 0) {
    lines.push('Removed:');
    for (const result of removed) {
      lines.push(`  ✓ ${result.client}`);
      if (result.backupPath) {
        lines.push(`      Backup: ${result.backupPath}`);
      }
    }
    lines.push('');
  }
  
  // Show skipped
  if (skipped.length > 0) {
    lines.push('Skipped (not configured):');
    for (const result of skipped) {
      lines.push(`  ○ ${result.client}`);
    }
    lines.push('');
  }
  
  // Show not found
  if (notFound.length > 0) {
    lines.push('Not installed:');
    for (const result of notFound) {
      lines.push(`  ○ ${result.client}`);
    }
    lines.push('');
  }
  
  // Show errors
  if (errors.length > 0) {
    lines.push('Errors:');
    for (const result of errors) {
      lines.push(`  ✗ ${result.client}: ${result.message}`);
    }
    lines.push('');
  }
  
  // Summary
  if (removed.length > 0) {
    lines.push(`✓ APIClaw removed from ${removed.length} client(s).`);
    lines.push('  Restart your MCP clients for changes to take effect.');
  } else if (errors.length === 0) {
    lines.push('No changes made - APIClaw was not configured in any client.');
  }
  
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Uninstall command handler
 */
export async function uninstallCommand(options: UninstallOptions = {}): Promise<void> {
  const serverName = options.serverName || 'apiclaw';
  
  // Dry run notice
  if (options.dryRun) {
    console.log('\n🔍 Dry run - no changes will be made\n');
  }
  
  let results: UninstallResult[];
  
  // Uninstall from specific client
  if (options.client) {
    const client = parseClientArg(options.client);
    
    if (!client) {
      console.error(`\n✗ Unknown client: ${options.client}\n`);
      console.error('Valid clients: claude, cursor, windsurf, cline, continue\n');
      process.exit(1);
    }
    
    results = [uninstallFromClient(client, options)];
  } else {
    // Uninstall from all clients
    results = uninstallFromAll(options);
  }
  
  console.log(formatUninstallResults(results));
  
  const errors = results.filter(r => r.action === 'error');
  if (errors.length > 0) {
    process.exit(1);
  }
}
