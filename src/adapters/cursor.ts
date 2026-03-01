/**
 * Cursor Adapter
 * Handles MCP configuration for Cursor IDE
 */

import { join } from 'path';
import { BaseAdapter } from './base.js';
import { MCPClient } from '../utils/paths.js';
import { getHomeDir } from '../utils/os.js';

export class CursorAdapter extends BaseAdapter {
  name: MCPClient = 'cursor';
  displayName = 'Cursor';
  
  protected getAppPaths(): string[] {
    switch (this.os) {
      case 'mac':
        return [
          '/Applications/Cursor.app',
          join(getHomeDir(), 'Applications', 'Cursor.app'),
        ];
      
      case 'win':
        const localAppData = process.env.LOCALAPPDATA || join(getHomeDir(), 'AppData', 'Local');
        const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
        return [
          join(localAppData, 'Programs', 'Cursor', 'Cursor.exe'),
          join(programFiles, 'Cursor', 'Cursor.exe'),
        ];
      
      case 'linux':
        return [
          '/usr/bin/cursor',
          '/usr/local/bin/cursor',
          join(getHomeDir(), '.local', 'bin', 'cursor'),
          '/snap/bin/cursor',
          '/opt/Cursor/cursor',
          // AppImage common location
          join(getHomeDir(), 'Applications', 'Cursor.AppImage'),
        ];
    }
  }
}
