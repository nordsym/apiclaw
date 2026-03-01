/**
 * Client Detection
 * Auto-detect which MCP clients are installed on the system
 */

import { MCPClientAdapter, InstallInfo } from './base.js';
import { ClaudeDesktopAdapter } from './claude-desktop.js';
import { CursorAdapter } from './cursor.js';
import { WindsurfAdapter } from './windsurf.js';
import { ClineAdapter } from './cline.js';
import { ContinueAdapter } from './continue.js';
import { MCPClient } from '../utils/paths.js';

export interface DetectedClient {
  adapter: MCPClientAdapter;
  info: InstallInfo;
}

export interface DetectionResult {
  installed: DetectedClient[];
  notInstalled: MCPClientAdapter[];
  total: number;
  installedCount: number;
}

/**
 * Get all available adapters
 */
export function getAllAdapters(): MCPClientAdapter[] {
  return [
    new ClaudeDesktopAdapter(),
    new CursorAdapter(),
    new WindsurfAdapter(),
    new ClineAdapter(),
    new ContinueAdapter(),
  ];
}

/**
 * Get adapter by client name
 */
export function getAdapter(client: MCPClient): MCPClientAdapter {
  switch (client) {
    case 'claude-desktop':
      return new ClaudeDesktopAdapter();
    case 'cursor':
      return new CursorAdapter();
    case 'windsurf':
      return new WindsurfAdapter();
    case 'cline':
      return new ClineAdapter();
    case 'continue':
      return new ContinueAdapter();
    default:
      throw new Error(`Unknown client: ${client}`);
  }
}

/**
 * Detect all installed MCP clients
 */
export async function detectInstalledClients(): Promise<DetectionResult> {
  const adapters = getAllAdapters();
  const installed: DetectedClient[] = [];
  const notInstalled: MCPClientAdapter[] = [];
  
  await Promise.all(
    adapters.map(async (adapter) => {
      try {
        const isInstalled = await adapter.isInstalled();
        if (isInstalled) {
          const info = await adapter.getInstallInfo();
          installed.push({ adapter, info });
        } else {
          notInstalled.push(adapter);
        }
      } catch {
        // If detection fails, assume not installed
        notInstalled.push(adapter);
      }
    })
  );
  
  // Sort installed clients by name for consistent output
  installed.sort((a, b) => a.adapter.displayName.localeCompare(b.adapter.displayName));
  notInstalled.sort((a, b) => a.displayName.localeCompare(b.displayName));
  
  return {
    installed,
    notInstalled,
    total: adapters.length,
    installedCount: installed.length,
  };
}

/**
 * Detect clients that already have APIClaw configured
 */
export async function detectConfiguredClients(): Promise<{
  configured: DetectedClient[];
  notConfigured: DetectedClient[];
}> {
  const detection = await detectInstalledClients();
  const configured: DetectedClient[] = [];
  const notConfigured: DetectedClient[] = [];
  
  for (const client of detection.installed) {
    const verification = await client.adapter.verify();
    if (verification.success) {
      configured.push(client);
    } else {
      notConfigured.push(client);
    }
  }
  
  return { configured, notConfigured };
}

/**
 * Quick check: is any MCP client installed?
 */
export async function hasAnyClient(): Promise<boolean> {
  const adapters = getAllAdapters();
  
  for (const adapter of adapters) {
    if (await adapter.isInstalled()) {
      return true;
    }
  }
  
  return false;
}

/**
 * Quick check: is a specific client installed?
 */
export async function isClientInstalled(client: MCPClient): Promise<boolean> {
  const adapter = getAdapter(client);
  return adapter.isInstalled();
}

/**
 * Get installation summary as string (for CLI output)
 */
export function formatDetectionResult(result: DetectionResult): string {
  const lines: string[] = [];
  
  lines.push(`Found ${result.installedCount}/${result.total} MCP clients installed:\n`);
  
  if (result.installed.length > 0) {
    lines.push('✅ Installed:');
    for (const client of result.installed) {
      const configStatus = client.info.configExists ? '(config exists)' : '(no config)';
      lines.push(`   • ${client.adapter.displayName} ${configStatus}`);
      lines.push(`     Path: ${client.info.configPath}`);
    }
  }
  
  if (result.notInstalled.length > 0) {
    lines.push('\n❌ Not installed:');
    for (const adapter of result.notInstalled) {
      lines.push(`   • ${adapter.displayName}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Get simple list of installed client names
 */
export async function getInstalledClientNames(): Promise<string[]> {
  const result = await detectInstalledClients();
  return result.installed.map(c => c.adapter.name);
}

/**
 * Configure all detected clients
 */
export async function configureAllDetected(options?: {
  workspaceId?: string;
  serverName?: string;
  force?: boolean;
}): Promise<{
  success: { adapter: MCPClientAdapter; result: Awaited<ReturnType<MCPClientAdapter['configure']>> }[];
  failed: { adapter: MCPClientAdapter; result: Awaited<ReturnType<MCPClientAdapter['configure']>> }[];
}> {
  const detection = await detectInstalledClients();
  const success: { adapter: MCPClientAdapter; result: Awaited<ReturnType<MCPClientAdapter['configure']>> }[] = [];
  const failed: { adapter: MCPClientAdapter; result: Awaited<ReturnType<MCPClientAdapter['configure']>> }[] = [];
  
  for (const client of detection.installed) {
    const result = await client.adapter.configure(options);
    if (result.success) {
      success.push({ adapter: client.adapter, result });
    } else {
      failed.push({ adapter: client.adapter, result });
    }
  }
  
  return { success, failed };
}
