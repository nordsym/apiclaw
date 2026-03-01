/**
 * Config Path Resolver
 * Resolves config file paths for all MCP clients across all operating systems
 */

import { join } from 'path';
import { detectOS, getHomeDir, getAppDataDir, getUserProfileDir, Platform } from './os.js';

export type MCPClient = 
  | 'claude-desktop'
  | 'cursor'
  | 'windsurf'
  | 'cline'
  | 'continue';

export interface ClientPathConfig {
  name: string;
  displayName: string;
  configPath: string;
  configDir: string;
  configFile: string;
}

/**
 * Get config path for Claude Desktop
 */
function getClaudeDesktopPath(os: Platform): string {
  const home = getHomeDir();
  const appData = getAppDataDir();
  
  switch (os) {
    case 'mac':
      return join(appData, 'Claude', 'claude_desktop_config.json');
    case 'win':
      return join(appData, 'Claude', 'claude_desktop_config.json');
    case 'linux':
      return join(home, '.config', 'Claude', 'claude_desktop_config.json');
  }
}

/**
 * Get config path for Cursor
 */
function getCursorPath(os: Platform): string {
  const home = getHomeDir();
  const appData = getAppDataDir();
  
  switch (os) {
    case 'mac':
      return join(appData, 'Cursor', 'User', 'globalStorage', 'cursor.mcp', 'config.json');
    case 'win':
      return join(appData, 'Cursor', 'User', 'globalStorage', 'cursor.mcp', 'config.json');
    case 'linux':
      return join(home, '.config', 'Cursor', 'User', 'globalStorage', 'cursor.mcp', 'config.json');
  }
}

/**
 * Get config path for Windsurf
 */
function getWindsurfPath(os: Platform): string {
  const home = getHomeDir();
  const userProfile = getUserProfileDir();
  
  switch (os) {
    case 'mac':
    case 'linux':
      return join(home, '.codeium', 'windsurf', 'mcp_config.json');
    case 'win':
      return join(userProfile, '.codeium', 'windsurf', 'mcp_config.json');
  }
}

/**
 * Get config path for Cline (VS Code extension)
 */
function getClinePath(os: Platform): string {
  const home = getHomeDir();
  const appData = getAppDataDir();
  
  const relativePath = join(
    'Code', 'User', 'globalStorage', 
    'saoudrizwan.claude-dev', 'settings', 
    'cline_mcp_settings.json'
  );
  
  switch (os) {
    case 'mac':
      return join(appData, relativePath);
    case 'win':
      return join(appData, relativePath);
    case 'linux':
      return join(home, '.config', relativePath);
  }
}

/**
 * Get config path for Continue
 */
function getContinuePath(os: Platform): string {
  const home = getHomeDir();
  const userProfile = getUserProfileDir();
  
  switch (os) {
    case 'mac':
    case 'linux':
      return join(home, '.continue', 'config.json');
    case 'win':
      return join(userProfile, '.continue', 'config.json');
  }
}

/**
 * Get the config path for a specific MCP client
 */
export function getConfigPath(client: MCPClient, os?: Platform): string {
  const currentOS = os || detectOS();
  
  switch (client) {
    case 'claude-desktop':
      return getClaudeDesktopPath(currentOS);
    case 'cursor':
      return getCursorPath(currentOS);
    case 'windsurf':
      return getWindsurfPath(currentOS);
    case 'cline':
      return getClinePath(currentOS);
    case 'continue':
      return getContinuePath(currentOS);
  }
}

/**
 * Get full client configuration info
 */
export function getClientConfig(client: MCPClient, os?: Platform): ClientPathConfig {
  const configPath = getConfigPath(client, os);
  const pathParts = configPath.split(/[/\\]/);
  const configFile = pathParts.pop() || '';
  const configDir = pathParts.join('/');
  
  const displayNames: Record<MCPClient, string> = {
    'claude-desktop': 'Claude Desktop',
    'cursor': 'Cursor',
    'windsurf': 'Windsurf',
    'cline': 'Cline',
    'continue': 'Continue',
  };
  
  return {
    name: client,
    displayName: displayNames[client],
    configPath,
    configDir,
    configFile,
  };
}

/**
 * Get all supported MCP clients
 */
export function getAllClients(): MCPClient[] {
  return ['claude-desktop', 'cursor', 'windsurf', 'cline', 'continue'];
}

/**
 * Get config paths for all clients
 */
export function getAllConfigPaths(os?: Platform): Map<MCPClient, ClientPathConfig> {
  const paths = new Map<MCPClient, ClientPathConfig>();
  
  for (const client of getAllClients()) {
    paths.set(client, getClientConfig(client, os));
  }
  
  return paths;
}

/**
 * Validate that a client name is valid
 */
export function isValidClient(client: string): client is MCPClient {
  return getAllClients().includes(client as MCPClient);
}

/**
 * Parse client argument (accepts various formats)
 */
export function parseClientArg(arg: string): MCPClient | null {
  const normalized = arg.toLowerCase().replace(/[_\s]/g, '-');
  
  const aliases: Record<string, MCPClient> = {
    'claude': 'claude-desktop',
    'claude-desktop': 'claude-desktop',
    'claudedesktop': 'claude-desktop',
    'cursor': 'cursor',
    'windsurf': 'windsurf',
    'cline': 'cline',
    'continue': 'continue',
  };
  
  return aliases[normalized] || null;
}
