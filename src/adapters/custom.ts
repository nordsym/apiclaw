/**
 * Custom Adapter
 * Handles MCP configuration for user-specified config paths
 */

import { existsSync } from 'fs';
import { dirname, basename } from 'path';
import { BaseAdapter, ConfigureOptions, ConfigResult, VerifyResult, InstallInfo } from './base.js';
import { expandHome } from '../utils/os.js';
import {
  readConfig,
  writeConfig,
  mergeApiclawConfig,
  mergeApiclawContinueConfig,
  hasApiclawConfig,
  isContinueFormat,
  MCPConfig,
  ContinueConfig,
} from '../utils/config.js';

export interface CustomAdapterOptions {
  configPath: string;
  displayName?: string;
  useContinueFormat?: boolean;
}

export class CustomAdapter extends BaseAdapter {
  name: 'custom' = 'custom';
  displayName: string;
  
  private customConfigPath: string;
  private useContinueFormat: boolean;
  
  constructor(options: CustomAdapterOptions) {
    super();
    this.customConfigPath = expandHome(options.configPath);
    this.displayName = options.displayName || `Custom (${basename(this.customConfigPath)})`;
    this.useContinueFormat = options.useContinueFormat || false;
  }
  
  /**
   * Override getConfigPath to use custom path
   */
  getConfigPath(): string {
    return this.customConfigPath;
  }
  
  /**
   * No app paths for custom adapter
   */
  protected getAppPaths(): string[] {
    return [];
  }
  
  /**
   * Custom adapter is "installed" if the path is valid
   */
  async isInstalled(): Promise<boolean> {
    // Check if the directory exists or config file exists
    const configDir = dirname(this.customConfigPath);
    return existsSync(configDir) || existsSync(this.customConfigPath);
  }
  
  /**
   * Get installation info
   */
  async getInstallInfo(): Promise<InstallInfo> {
    const configExists = existsSync(this.customConfigPath);
    const dirExists = existsSync(dirname(this.customConfigPath));
    
    return {
      installed: dirExists,
      configExists,
      configPath: this.customConfigPath,
    };
  }
  
  /**
   * Configure with auto-detection of format
   */
  async configure(options: ConfigureOptions = {}): Promise<ConfigResult> {
    const configPath = this.getConfigPath();
    
    try {
      // Read existing config
      const readResult = readConfig(configPath);
      if (!readResult.success) {
        return {
          success: false,
          message: `Failed to read config: ${readResult.error}`,
          configPath,
          error: readResult.error,
        };
      }
      
      const config = readResult.config!;
      const serverName = options.serverName || 'apiclaw';
      
      // Check if already configured
      if (!options.force && hasApiclawConfig(config, serverName)) {
        return {
          success: true,
          message: `APIClaw already configured in ${this.displayName}`,
          configPath,
          alreadyConfigured: true,
        };
      }
      
      // Auto-detect format or use specified
      const useContinue = this.useContinueFormat || isContinueFormat(config);
      
      const mergeOptions = {
        workspace: options.workspaceId,
        serverName,
        force: options.force,
      };
      
      const newConfig = useContinue
        ? mergeApiclawContinueConfig(config as ContinueConfig, mergeOptions)
        : mergeApiclawConfig(config as MCPConfig, mergeOptions);
      
      // Write config
      const writeResult = writeConfig(configPath, newConfig);
      if (!writeResult.success) {
        return {
          success: false,
          message: `Failed to write config: ${writeResult.error}`,
          configPath,
          error: writeResult.error,
        };
      }
      
      return {
        success: true,
        message: `Successfully configured APIClaw in ${this.displayName}`,
        configPath,
        backupPath: writeResult.backupPath,
        isNew: readResult.isNew,
      };
    } catch (error) {
      return {
        success: false,
        message: `Configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        configPath,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Override removeFromConfig with format auto-detection
   */
  protected removeFromConfig(
    config: MCPConfig | ContinueConfig,
    serverName: string
  ): MCPConfig | ContinueConfig {
    if (this.useContinueFormat || isContinueFormat(config)) {
      const continueConfig = config as ContinueConfig;
      return {
        ...continueConfig,
        mcpServers: continueConfig.mcpServers?.filter(s => s.name !== serverName) || [],
      };
    }
    
    const mcpConfig = config as MCPConfig;
    const { [serverName]: _, ...remainingServers } = mcpConfig.mcpServers || {};
    
    return {
      ...mcpConfig,
      mcpServers: remainingServers,
    };
  }
}

/**
 * Create a custom adapter for a specific path
 */
export function createCustomAdapter(
  configPath: string,
  displayName?: string,
  useContinueFormat?: boolean
): CustomAdapter {
  return new CustomAdapter({
    configPath,
    displayName,
    useContinueFormat,
  });
}
