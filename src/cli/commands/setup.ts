/**
 * Setup Command
 * Configures APIClaw for MCP clients
 */

import { existsSync } from 'fs';
import { detectOS, getOSDisplayName } from '../../utils/os.js';
import { readSession } from '../../session.js';
import { loginCommand } from './login.js';
import { 
  getAllClients, 
  getConfigPath, 
  getClientConfig, 
  parseClientArg,
  MCPClient,
  ClientPathConfig 
} from '../../utils/paths.js';
import { 
  readConfig, 
  writeConfig, 
  mergeApiclawConfig, 
  mergeApiclawContinueConfig,
  hasApiclawConfig,
  isContinueFormat,
  MCPConfig,
  ContinueConfig
} from '../../utils/config.js';
import { createBackup, getLatestBackup } from '../../utils/backup.js';

export interface SetupOptions {
  client?: string;
  config?: string;
  workspace?: string;
  dryRun?: boolean;
  force?: boolean;
  wizard?: boolean;
  all?: boolean;
  verbose?: boolean;
}

interface SetupResult {
  client: string;
  success: boolean;
  message: string;
  backupPath?: string | null;
  skipped?: boolean;
}

/**
 * Detect which MCP clients are installed
 */
function detectInstalledClients(): MCPClient[] {
  const clients = getAllClients();
  const installed: MCPClient[] = [];
  
  for (const client of clients) {
    const configPath = getConfigPath(client);
    // Check if config exists OR if parent directory exists (client might be installed but not configured)
    if (existsSync(configPath)) {
      installed.push(client);
    }
  }
  
  return installed;
}

/**
 * Check if a client's config directory structure exists (might not have config yet)
 */
function clientMightBeInstalled(client: MCPClient): boolean {
  const config = getClientConfig(client);
  const configDir = config.configDir;
  
  // Check a few levels up to see if the app is installed
  const pathParts = configDir.split('/').filter(Boolean);
  for (let i = pathParts.length; i >= Math.max(0, pathParts.length - 3); i--) {
    const checkPath = '/' + pathParts.slice(0, i).join('/');
    if (existsSync(checkPath)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Setup a single client
 */
async function setupClient(
  client: MCPClient | 'custom',
  configPath: string,
  options: SetupOptions
): Promise<SetupResult> {
  const displayName = client === 'custom' ? 'Custom' : getClientConfig(client as MCPClient).displayName;
  
  if (options.verbose) {
    console.log(`\n📝 Configuring ${displayName}...`);
    console.log(`   Config path: ${configPath}`);
  }
  
  // Read existing config
  const readResult = readConfig(configPath);
  
  if (!readResult.success) {
    return {
      client: displayName,
      success: false,
      message: readResult.error || 'Failed to read config',
    };
  }
  
  const existingConfig = readResult.config!;
  
  // Check if APIClaw is already configured
  if (hasApiclawConfig(existingConfig) && !options.force) {
    if (options.verbose) {
      console.log(`   ⏭️  APIClaw already configured (use --force to update)`);
    }
    return {
      client: displayName,
      success: true,
      message: 'Already configured',
      skipped: true,
    };
  }
  
  // Merge APIClaw config
  let newConfig: MCPConfig | ContinueConfig;
  
  if (client === 'continue' || isContinueFormat(existingConfig)) {
    newConfig = mergeApiclawContinueConfig(existingConfig as ContinueConfig, {
      workspace: options.workspace,
      force: options.force,
    });
  } else {
    newConfig = mergeApiclawConfig(existingConfig as MCPConfig, {
      workspace: options.workspace,
      force: options.force,
    });
  }
  
  // Dry run - show what would happen
  if (options.dryRun) {
    console.log(`\n📋 Would configure ${displayName}:`);
    console.log(`   Path: ${configPath}`);
    console.log(`   Changes:`);
    if (isContinueFormat(newConfig)) {
      const continueConfig = newConfig as ContinueConfig;
      const apiclaw = continueConfig.mcpServers?.find(s => s.name === 'apiclaw');
      console.log(JSON.stringify(apiclaw, null, 4).split('\n').map(l => `   ${l}`).join('\n'));
    } else {
      const mcpConfig = newConfig as MCPConfig;
      console.log(JSON.stringify({ apiclaw: mcpConfig.mcpServers?.apiclaw }, null, 4).split('\n').map(l => `   ${l}`).join('\n'));
    }
    
    return {
      client: displayName,
      success: true,
      message: 'Dry run - no changes made',
      skipped: true,
    };
  }
  
  // Write config
  const writeResult = writeConfig(configPath, newConfig, true);
  
  if (!writeResult.success) {
    return {
      client: displayName,
      success: false,
      message: writeResult.error || 'Failed to write config',
    };
  }
  
  return {
    client: displayName,
    success: true,
    message: readResult.isNew ? 'Created new config' : 'Updated existing config',
    backupPath: writeResult.backupPath,
  };
}

/**
 * Main setup command handler
 */
export async function setupCommand(options: SetupOptions): Promise<void> {
  const os = detectOS();
  const osName = getOSDisplayName();
  
  console.log('\n🚀 APIClaw MCP Auto-Setup\n');
  console.log(`Platform: ${osName}\n`);

  // Step 0: Ensure user is signed in
  if (!options.workspace) {
    const session = readSession();
    if (!session) {
      console.log('First, sign in to link your workspace:\n');
      const loginResult = await loginCommand({});
      if (!loginResult) {
        console.error('\n❌ Login failed. Setup cancelled.');
        process.exit(1);
      }
      // Use the session token as workspace identifier
      options.workspace = loginResult.workspaceId;
      console.log('');
    } else {
      console.log(`✓ Signed in as ${session.email}\n`);
      options.workspace = options.workspace || session.workspaceId;
    }
  }

  // Determine which clients to configure
  let clientsToSetup: Array<{ client: MCPClient | 'custom'; path: string }> = [];
  
  if (options.config) {
    // Custom config path
    clientsToSetup.push({ client: 'custom', path: options.config });
  } else if (options.client) {
    // Specific client
    const client = parseClientArg(options.client);
    
    if (!client) {
      console.error(`❌ Unknown client: ${options.client}`);
      console.log('   Supported clients: claude-desktop, cursor, windsurf, cline, continue');
      process.exit(1);
    }
    
    clientsToSetup.push({ client, path: getConfigPath(client) });
  } else {
    // Auto-detect or all
    console.log('🔍 Detecting MCP clients...\n');
    
    const allClients = getAllClients();
    const detected = detectInstalledClients();
    
    for (const client of allClients) {
      const config = getClientConfig(client);
      const isDetected = detected.includes(client);
      const icon = isDetected ? '✓' : '✗';
      const status = isDetected ? 'found' : 'not found';
      console.log(`   ${icon} ${config.displayName} ${status}`);
      
      if (isDetected || options.all) {
        clientsToSetup.push({ client, path: config.configPath });
      }
    }
    
    console.log('');
    
    if (clientsToSetup.length === 0) {
      console.log('⚠️  No MCP clients detected. Use --client to specify manually.');
      console.log('   Example: npx @nordsym/apiclaw setup --client claude-desktop');
      process.exit(0);
    }
  }
  
  // Setup each client
  const results: SetupResult[] = [];
  
  for (const { client, path } of clientsToSetup) {
    const result = await setupClient(client, path, options);
    results.push(result);
    
    const icon = result.success ? (result.skipped ? '⏭️' : '✓') : '✗';
    console.log(`${icon} ${result.client}: ${result.message}`);
    
    if (result.backupPath && options.verbose) {
      console.log(`   Backup: ${result.backupPath}`);
    }
  }
  
  // Summary
  const succeeded = results.filter(r => r.success && !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n' + '═'.repeat(50));
  
  if (failed === 0) {
    if (options.dryRun) {
      console.log('\n✅ Dry run complete! Use without --dry-run to apply changes.\n');
    } else if (succeeded > 0) {
      console.log('\n✅ APIClaw configured successfully!\n');
      console.log('Next steps:');
      console.log('  1. Restart your AI coding assistant');
      console.log('  2. Ask your agent: "List available APIs"\n');
      console.log('Need help? https://apiclaw.cloud/docs/setup\n');
    } else if (skipped === results.length) {
      console.log('\n✅ APIClaw already configured in all clients.\n');
      console.log('Use --force to reconfigure.\n');
    }
  } else {
    console.log(`\n⚠️  Setup completed with ${failed} error(s).\n`);
    console.log('For troubleshooting, visit: https://apiclaw.cloud/docs/setup/troubleshooting\n');
    process.exit(1);
  }
}
