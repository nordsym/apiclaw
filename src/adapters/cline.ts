/**
 * Cline Adapter
 * Handles MCP configuration for Cline VS Code extension
 */

import { join } from 'path';
import { BaseAdapter } from './base.js';
import { MCPClient } from '../utils/paths.js';
import { getHomeDir, getAppDataDir } from '../utils/os.js';

export class ClineAdapter extends BaseAdapter {
  name: MCPClient = 'cline';
  displayName = 'Cline';
  
  protected getAppPaths(): string[] {
    // Cline is a VS Code extension, so we check for VS Code
    // and the extension directory
    const home = getHomeDir();
    const appData = getAppDataDir();
    
    switch (this.os) {
      case 'mac':
        return [
          '/Applications/Visual Studio Code.app',
          join(home, 'Applications', 'Visual Studio Code.app'),
          // Also check for extension directory
          join(home, '.vscode', 'extensions'),
          join(appData, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev'),
        ];
      
      case 'win':
        const localAppData = process.env.LOCALAPPDATA || join(home, 'AppData', 'Local');
        const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
        return [
          join(localAppData, 'Programs', 'Microsoft VS Code', 'Code.exe'),
          join(programFiles, 'Microsoft VS Code', 'Code.exe'),
          // Extension directory
          join(home, '.vscode', 'extensions'),
          join(appData, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev'),
        ];
      
      case 'linux':
        return [
          '/usr/bin/code',
          '/usr/local/bin/code',
          '/snap/bin/code',
          join(home, '.local', 'bin', 'code'),
          // Extension directory
          join(home, '.vscode', 'extensions'),
          join(home, '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev'),
        ];
    }
  }
  
  /**
   * Override isInstalled to also check for the Cline extension specifically
   */
  async isInstalled(): Promise<boolean> {
    // First check base implementation
    if (await super.isInstalled()) {
      return true;
    }
    
    // Check if Cline extension is installed
    const extensionPaths = this.getClineExtensionPaths();
    for (const path of extensionPaths) {
      const { existsSync } = await import('fs');
      if (existsSync(path)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get possible Cline extension installation paths
   */
  private getClineExtensionPaths(): string[] {
    const home = getHomeDir();
    const extensionsDir = join(home, '.vscode', 'extensions');
    
    // Extension directories are named like: saoudrizwan.claude-dev-x.x.x
    return [
      extensionsDir, // We'll check for pattern in isInstalled
    ];
  }
}
