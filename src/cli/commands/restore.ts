/**
 * Restore Command
 * Rollback MCP client configs from backups
 */

import { existsSync } from 'fs';
import { 
  listBackups, 
  restoreBackup as doRestore, 
  getLatestBackup,
  formatBackupInfo,
  BackupInfo 
} from '../../utils/backup.js';
import { getAllClients, getClientConfig, MCPClient, parseClientArg } from '../../utils/paths.js';

export interface RestoreOptions {
  client?: string;         // Specific client to restore
  backup?: string;         // Specific backup file path
  list?: boolean;          // List available backups
  all?: boolean;           // Restore all clients
  interactive?: boolean;   // Interactive mode (future)
  dryRun?: boolean;        // Show what would be done
}

export interface RestoreResult {
  success: boolean;
  client: string;
  message: string;
  backupUsed?: string;
  preRestoreBackup?: string;
}

/**
 * List all available backups for a client
 */
function listClientBackups(client: MCPClient): BackupInfo[] {
  const config = getClientConfig(client);
  return listBackups(config.configPath);
}

/**
 * List all backups across all clients
 */
export function listAllBackups(): Map<MCPClient, BackupInfo[]> {
  const results = new Map<MCPClient, BackupInfo[]>();
  
  for (const client of getAllClients()) {
    const backups = listClientBackups(client);
    if (backups.length > 0) {
      results.set(client, backups);
    }
  }
  
  return results;
}

/**
 * Format backup list for display
 */
export function formatBackupList(backups: Map<MCPClient, BackupInfo[]>): string {
  const lines: string[] = [];
  
  lines.push('');
  lines.push('📦 Available Backups');
  lines.push('====================');
  lines.push('');
  
  if (backups.size === 0) {
    lines.push('No backups found.');
    lines.push('');
    lines.push('Backups are created automatically when you run setup.');
    lines.push('');
    return lines.join('\n');
  }
  
  for (const [client, clientBackups] of backups) {
    const config = getClientConfig(client);
    lines.push(`${config.displayName}:`);
    
    for (let i = 0; i < clientBackups.length; i++) {
      const backup = clientBackups[i];
      const marker = i === 0 ? ' (latest)' : '';
      lines.push(`  ${i + 1}. ${formatBackupInfo(backup)}${marker}`);
    }
    
    lines.push('');
  }
  
  lines.push('Usage:');
  lines.push('  npx @nordsym/apiclaw restore                     # Restore latest for all');
  lines.push('  npx @nordsym/apiclaw restore --client claude     # Restore latest for Claude');
  lines.push('  npx @nordsym/apiclaw restore --backup <path>     # Restore specific backup');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Restore a specific client to its latest backup
 */
export function restoreClient(client: MCPClient): RestoreResult {
  const config = getClientConfig(client);
  const configPath = config.configPath;
  
  // Check if config exists
  if (!existsSync(configPath)) {
    return {
      success: false,
      client: config.displayName,
      message: 'No config file to restore',
    };
  }
  
  // Get latest backup
  const latest = getLatestBackup(configPath);
  
  if (!latest) {
    return {
      success: false,
      client: config.displayName,
      message: 'No backups available',
    };
  }
  
  // Perform restore
  const result = doRestore(latest.path, configPath);
  
  if (result.success) {
    return {
      success: true,
      client: config.displayName,
      message: 'Restored successfully',
      backupUsed: latest.filename,
      preRestoreBackup: result.backupPath || undefined,
    };
  }
  
  return {
    success: false,
    client: config.displayName,
    message: result.error || 'Unknown error',
  };
}

/**
 * Restore from a specific backup file
 */
export function restoreFromFile(backupPath: string, client?: MCPClient): RestoreResult {
  // Validate backup exists
  if (!existsSync(backupPath)) {
    return {
      success: false,
      client: client ? getClientConfig(client).displayName : 'Unknown',
      message: `Backup file not found: ${backupPath}`,
    };
  }
  
  // If client not specified, try to detect from backup path
  if (!client) {
    for (const c of getAllClients()) {
      const config = getClientConfig(c);
      if (backupPath.includes(config.configDir)) {
        client = c;
        break;
      }
    }
  }
  
  if (!client) {
    return {
      success: false,
      client: 'Unknown',
      message: 'Could not determine target client. Use --client to specify.',
    };
  }
  
  const config = getClientConfig(client);
  const result = doRestore(backupPath, config.configPath);
  
  if (result.success) {
    return {
      success: true,
      client: config.displayName,
      message: 'Restored successfully',
      backupUsed: backupPath,
      preRestoreBackup: result.backupPath || undefined,
    };
  }
  
  return {
    success: false,
    client: config.displayName,
    message: result.error || 'Unknown error',
  };
}

/**
 * Restore all clients to their latest backups
 */
export function restoreAll(): RestoreResult[] {
  const results: RestoreResult[] = [];
  
  for (const client of getAllClients()) {
    const config = getClientConfig(client);
    
    // Skip clients without backups
    const backups = listClientBackups(client);
    if (backups.length === 0) {
      continue;
    }
    
    results.push(restoreClient(client));
  }
  
  return results;
}

/**
 * Format restore results for display
 */
export function formatRestoreResults(results: RestoreResult[]): string {
  const lines: string[] = [];
  
  lines.push('');
  lines.push('🔄 Restore Results');
  lines.push('==================');
  lines.push('');
  
  if (results.length === 0) {
    lines.push('No clients had backups to restore.');
    lines.push('');
    return lines.join('\n');
  }
  
  for (const result of results) {
    const icon = result.success ? '✓' : '✗';
    lines.push(`${icon} ${result.client}: ${result.message}`);
    
    if (result.backupUsed) {
      lines.push(`    Restored from: ${result.backupUsed}`);
    }
    
    if (result.preRestoreBackup) {
      lines.push(`    Pre-restore backup: ${result.preRestoreBackup}`);
    }
  }
  
  lines.push('');
  
  const successful = results.filter(r => r.success).length;
  if (successful > 0) {
    lines.push(`✓ Restored ${successful} client(s). Restart your MCP clients to apply changes.`);
  }
  
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Restore command handler
 */
export async function restoreCommand(options: RestoreOptions = {}): Promise<void> {
  // List mode
  if (options.list) {
    const backups = listAllBackups();
    console.log(formatBackupList(backups));
    return;
  }
  
  // Dry run mode
  if (options.dryRun) {
    console.log('\n🔍 Dry run - would restore:\n');
    
    if (options.backup) {
      console.log(`  From file: ${options.backup}`);
    } else if (options.client) {
      const client = parseClientArg(options.client);
      if (client) {
        const latest = getLatestBackup(getClientConfig(client).configPath);
        console.log(`  ${getClientConfig(client).displayName}: ${latest?.filename || 'No backup'}`);
      }
    } else {
      const backups = listAllBackups();
      for (const [client, clientBackups] of backups) {
        console.log(`  ${getClientConfig(client).displayName}: ${clientBackups[0]?.filename || 'No backup'}`);
      }
    }
    
    console.log('\nRun without --dry-run to perform restore.\n');
    return;
  }
  
  // Restore from specific file
  if (options.backup) {
    const client = options.client ? parseClientArg(options.client) : undefined;
    const result = restoreFromFile(options.backup, client || undefined);
    console.log(formatRestoreResults([result]));
    
    if (!result.success) {
      process.exit(1);
    }
    return;
  }
  
  // Restore specific client
  if (options.client) {
    const client = parseClientArg(options.client);
    
    if (!client) {
      console.error(`\n✗ Unknown client: ${options.client}\n`);
      console.error('Valid clients: claude, cursor, windsurf, cline, continue\n');
      process.exit(1);
    }
    
    const result = restoreClient(client);
    console.log(formatRestoreResults([result]));
    
    if (!result.success) {
      process.exit(1);
    }
    return;
  }
  
  // Restore all clients with backups
  const results = restoreAll();
  console.log(formatRestoreResults(results));
  
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    process.exit(1);
  }
}
