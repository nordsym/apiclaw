/**
 * Windsurf Adapter
 * Handles MCP configuration for Windsurf (Codeium) IDE
 */

import { join } from 'path';
import { BaseAdapter } from './base.js';
import { MCPClient } from '../utils/paths.js';
import { getHomeDir } from '../utils/os.js';

export class WindsurfAdapter extends BaseAdapter {
  name: MCPClient = 'windsurf';
  displayName = 'Windsurf';
  
  protected getAppPaths(): string[] {
    switch (this.os) {
      case 'mac':
        return [
          '/Applications/Windsurf.app',
          join(getHomeDir(), 'Applications', 'Windsurf.app'),
        ];
      
      case 'win':
        const localAppData = process.env.LOCALAPPDATA || join(getHomeDir(), 'AppData', 'Local');
        const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
        return [
          join(localAppData, 'Programs', 'Windsurf', 'Windsurf.exe'),
          join(programFiles, 'Windsurf', 'Windsurf.exe'),
          join(programFiles, 'Codeium', 'Windsurf', 'Windsurf.exe'),
        ];
      
      case 'linux':
        return [
          '/usr/bin/windsurf',
          '/usr/local/bin/windsurf',
          join(getHomeDir(), '.local', 'bin', 'windsurf'),
          '/opt/Windsurf/windsurf',
          '/snap/bin/windsurf',
          // AppImage
          join(getHomeDir(), 'Applications', 'Windsurf.AppImage'),
        ];
    }
  }
}
