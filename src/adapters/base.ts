/**
 * MCP Client Adapter - Base Interface & Abstract Class
 * Defines the contract for all MCP client adapters
 */

import { existsSync } from 'fs';
import { dirname } from 'path';
import { MCPClient, getConfigPath, getClientConfig } from '../utils/paths.js';
import { detectOS, Platform } from '../utils/os.js';
import { createBackup, BackupResult } from '../utils/backup.js';
import {
  readConfig,
  writeConfig,
  mergeApiclawConfig,
  mergeApiclawContinueConfig,
  hasApiclawConfig,
  MCPConfig,
  ContinueConfig,
  isContinueFormat,
} from '../utils/config.js';

export interface ConfigResult {
  success: boolean;
  message: string;
  configPath: string;
  backupPath?: string | null;
  isNew?: boolean;
  alreadyConfigured?: boolean;
  error?: string;
}

export interface VerifyResult {
  success: boolean;
  hasConfig: boolean;
  configValid: boolean;
  message: string;
}

export interface InstallInfo {
  installed: boolean;
  appPath?: string;
  configExists: boolean;
  configPath: string;
}

export interface ConfigureOptions {
  workspaceId?: string;
  serverName?: string;
  force?: boolean;
}

/**
 * MCP Client Adapter Interface
 */
export interface MCPClientAdapter {
  /** Internal client name */
  name: MCPClient | 'custom';
  
  /** Human-readable display name */
  displayName: string;
  
  /** Check if the client is installed on the system */
  isInstalled(): Promise<boolean>;
  
  /** Get the config file path for this client */
  getConfigPath(): string;
  
  /** Configure APIClaw MCP server for this client */
  configure(options?: ConfigureOptions): Promise<ConfigResult>;
  
  /** Verify the current configuration */
  verify(): Promise<VerifyResult>;
  
  /** Get detailed installation info */
  getInstallInfo(): Promise<InstallInfo>;
  
  /** Remove APIClaw configuration */
  unconfigure(serverName?: string): Promise<ConfigResult>;
}

/**
 * Abstract base class for MCP client adapters
 * Provides common functionality for all adapters
 */
export abstract class BaseAdapter implements MCPClientAdapter {
  abstract name: MCPClient | 'custom';
  abstract displayName: string;
  
  protected os: Platform;
  
  constructor() {
    this.os = detectOS();
  }
  
  /**
   * Get the config file path
   */
  getConfigPath(): string {
    if (this.name === 'custom') {
      throw new Error('Custom adapter must override getConfigPath()');
    }
    return getConfigPath(this.name, this.os);
  }
  
  /**
   * Check if config file exists
   */
  protected configExists(): boolean {
    try {
      return existsSync(this.getConfigPath());
    } catch {
      return false;
    }
  }
  
  /**
   * Get application paths to check for installation
   * Override in subclasses for specific clients
   */
  protected abstract getAppPaths(): string[];
  
  /**
   * Check if the client application is installed
   */
  async isInstalled(): Promise<boolean> {
    // Check if config file exists
    if (this.configExists()) {
      return true;
    }
    
    // Check if app is installed
    const appPaths = this.getAppPaths();
    for (const path of appPaths) {
      if (existsSync(path)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get detailed installation information
   */
  async getInstallInfo(): Promise<InstallInfo> {
    const configPath = this.getConfigPath();
    const configExists = this.configExists();
    
    let appPath: string | undefined;
    const appPaths = this.getAppPaths();
    for (const path of appPaths) {
      if (existsSync(path)) {
        appPath = path;
        break;
      }
    }
    
    return {
      installed: configExists || appPath !== undefined,
      appPath,
      configExists,
      configPath,
    };
  }
  
  /**
   * Configure APIClaw MCP server
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
      
      // Merge APIClaw config
      const mergeOptions = {
        workspace: options.workspaceId,
        serverName,
        force: options.force,
      };
      
      const newConfig = this.mergeConfig(config, mergeOptions);
      
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
   * Merge APIClaw config into existing config
   * Override in subclasses for special formats (e.g., Continue)
   */
  protected mergeConfig(
    config: MCPConfig | ContinueConfig,
    options: { workspace?: string; serverName?: string; force?: boolean }
  ): MCPConfig | ContinueConfig {
    return mergeApiclawConfig(config as MCPConfig, options);
  }
  
  /**
   * Verify the current configuration
   */
  async verify(): Promise<VerifyResult> {
    const configPath = this.getConfigPath();
    
    if (!this.configExists()) {
      return {
        success: false,
        hasConfig: false,
        configValid: false,
        message: `Config file not found: ${configPath}`,
      };
    }
    
    const readResult = readConfig(configPath);
    if (!readResult.success) {
      return {
        success: false,
        hasConfig: true,
        configValid: false,
        message: `Invalid config file: ${readResult.error}`,
      };
    }
    
    const hasApiclaw = hasApiclawConfig(readResult.config!);
    
    return {
      success: hasApiclaw,
      hasConfig: true,
      configValid: true,
      message: hasApiclaw
        ? `APIClaw is configured in ${this.displayName}`
        : `APIClaw is not configured in ${this.displayName}`,
    };
  }
  
  /**
   * Remove APIClaw configuration
   */
  async unconfigure(serverName = 'apiclaw'): Promise<ConfigResult> {
    const configPath = this.getConfigPath();
    
    try {
      if (!this.configExists()) {
        return {
          success: true,
          message: `No config file found for ${this.displayName}`,
          configPath,
        };
      }
      
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
      
      if (!hasApiclawConfig(config, serverName)) {
        return {
          success: true,
          message: `APIClaw not found in ${this.displayName} config`,
          configPath,
        };
      }
      
      // Remove APIClaw config
      const newConfig = this.removeFromConfig(config, serverName);
      
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
        message: `Successfully removed APIClaw from ${this.displayName}`,
        configPath,
        backupPath: writeResult.backupPath,
      };
    } catch (error) {
      return {
        success: false,
        message: `Unconfigure failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        configPath,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Remove APIClaw from config
   * Override in subclasses for special formats
   */
  protected removeFromConfig(
    config: MCPConfig | ContinueConfig,
    serverName: string
  ): MCPConfig | ContinueConfig {
    const mcpConfig = config as MCPConfig;
    const { [serverName]: _, ...remainingServers } = mcpConfig.mcpServers || {};
    
    return {
      ...mcpConfig,
      mcpServers: remainingServers,
    };
  }
}
