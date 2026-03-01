/**
 * Claude Desktop Adapter
 * Handles MCP configuration for Claude Desktop app
 */

import { join } from 'path';
import { BaseAdapter } from './base.js';
import { MCPClient } from '../utils/paths.js';
import { getHomeDir } from '../utils/os.js';

export class ClaudeDesktopAdapter extends BaseAdapter {
  name: MCPClient = 'claude-desktop';
  displayName = 'Claude Desktop';
  
  protected getAppPaths(): string[] {
    switch (this.os) {
      case 'mac':
        return [
          '/Applications/Claude.app',
          join(getHomeDir(), 'Applications', 'Claude.app'),
        ];
      
      case 'win':
        const localAppData = process.env.LOCALAPPDATA || join(getHomeDir(), 'AppData', 'Local');
        const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
        return [
          join(localAppData, 'Programs', 'Claude', 'Claude.exe'),
          join(programFiles, 'Claude', 'Claude.exe'),
        ];
      
      case 'linux':
        return [
          '/usr/bin/claude',
          '/usr/local/bin/claude',
          join(getHomeDir(), '.local', 'bin', 'claude'),
          '/snap/bin/claude',
          '/var/lib/flatpak/exports/bin/com.anthropic.claude',
        ];
    }
  }
}
