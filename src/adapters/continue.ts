/**
 * Continue Adapter
 * Handles MCP configuration for Continue extension
 * Note: Continue uses array format for mcpServers, not object format
 */

import { join } from 'path';
import { BaseAdapter, ConfigureOptions, ConfigResult } from './base.js';
import { MCPClient } from '../utils/paths.js';
import { getHomeDir, getAppDataDir } from '../utils/os.js';
import {
  readConfig,
  writeConfig,
  mergeApiclawContinueConfig,
  hasApiclawConfig,
  MCPConfig,
  ContinueConfig,
  ContinueServerConfig,
} from '../utils/config.js';

export class ContinueAdapter extends BaseAdapter {
  name: MCPClient = 'continue';
  displayName = 'Continue';
  
  protected getAppPaths(): string[] {
    const home = getHomeDir();
    const appData = getAppDataDir();
    
    switch (this.os) {
      case 'mac':
        return [
          // VS Code with Continue extension
          '/Applications/Visual Studio Code.app',
          join(home, 'Applications', 'Visual Studio Code.app'),
          // Continue config directory
          join(home, '.continue'),
          // Extension directory
          join(home, '.vscode', 'extensions'),
        ];
      
      case 'win':
        const localAppData = process.env.LOCALAPPDATA || join(home, 'AppData', 'Local');
        const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
        const userProfile = process.env.USERPROFILE || home;
        return [
          join(localAppData, 'Programs', 'Microsoft VS Code', 'Code.exe'),
          join(programFiles, 'Microsoft VS Code', 'Code.exe'),
          // Continue config directory
          join(userProfile, '.continue'),
          // Extension directory
          join(home, '.vscode', 'extensions'),
        ];
      
      case 'linux':
        return [
          '/usr/bin/code',
          '/usr/local/bin/code',
          '/snap/bin/code',
          // Continue config directory
          join(home, '.continue'),
          // Extension directory
          join(home, '.vscode', 'extensions'),
        ];
    }
  }
  
  /**
   * Override mergeConfig for Continue's array format
   */
  protected mergeConfig(
    config: MCPConfig | ContinueConfig,
    options: { workspace?: string; serverName?: string; force?: boolean }
  ): MCPConfig | ContinueConfig {
    return mergeApiclawContinueConfig(config as ContinueConfig, options);
  }
  
  /**
   * Override removeFromConfig for Continue's array format
   */
  protected removeFromConfig(
    config: MCPConfig | ContinueConfig,
    serverName: string
  ): MCPConfig | ContinueConfig {
    const continueConfig = config as ContinueConfig;
    
    return {
      ...continueConfig,
      mcpServers: continueConfig.mcpServers?.filter(s => s.name !== serverName) || [],
    };
  }
}
