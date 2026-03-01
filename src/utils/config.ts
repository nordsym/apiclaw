/**
 * Config Management
 * Handles JSON read/write/merge operations for MCP config files
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { createBackup } from './backup.js';

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface MCPConfig {
  mcpServers?: Record<string, MCPServerConfig>;
  [key: string]: unknown;
}

// Continue uses array format for mcpServers
export interface ContinueServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface ContinueConfig {
  mcpServers?: ContinueServerConfig[];
  [key: string]: unknown;
}

export interface ConfigReadResult {
  success: boolean;
  config: MCPConfig | ContinueConfig | null;
  error?: string;
  isNew?: boolean;
}

export interface ConfigWriteResult {
  success: boolean;
  error?: string;
  backupPath?: string | null;
}

export interface MergeOptions {
  force?: boolean;
  workspace?: string;
  serverName?: string;
}

/**
 * Read and parse a JSON config file
 */
export function readConfig(configPath: string): ConfigReadResult {
  try {
    if (!existsSync(configPath)) {
      return {
        success: true,
        config: {},
        isNew: true,
      };
    }
    
    const content = readFileSync(configPath, 'utf-8');
    
    // Handle empty files
    if (!content.trim()) {
      return {
        success: true,
        config: {},
        isNew: true,
      };
    }
    
    const config = JSON.parse(content);
    
    return {
      success: true,
      config,
      isNew: false,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        config: null,
        error: `Invalid JSON in config file: ${error.message}`,
      };
    }
    
    return {
      success: false,
      config: null,
      error: error instanceof Error ? error.message : 'Unknown error reading config',
    };
  }
}

/**
 * Write config to file with backup
 */
export function writeConfig(
  configPath: string, 
  config: MCPConfig | ContinueConfig,
  createBackupFirst = true
): ConfigWriteResult {
  try {
    // Ensure directory exists
    const dir = dirname(configPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // Create backup if file exists and backup requested
    let backupPath: string | null = null;
    if (createBackupFirst && existsSync(configPath)) {
      const backupResult = createBackup(configPath);
      if (!backupResult.success) {
        return {
          success: false,
          error: `Failed to create backup: ${backupResult.error}`,
        };
      }
      backupPath = backupResult.backupPath;
    }
    
    // Validate JSON before writing
    const content = JSON.stringify(config, null, 2);
    JSON.parse(content); // Validation parse
    
    // Write file
    writeFileSync(configPath, content, 'utf-8');
    
    return {
      success: true,
      backupPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error writing config',
    };
  }
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };
  
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];
    
    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      // Recursively merge objects
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
    } else {
      // Overwrite value
      result[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }
  
  return result;
}

/**
 * Generate APIClaw MCP server configuration
 */
export function generateApiclawConfig(options: MergeOptions = {}): MCPServerConfig {
  const config: MCPServerConfig = {
    command: 'npx',
    args: ['-y', '@nordsym/apiclaw'],
  };
  
  if (options.workspace) {
    config.env = {
      APICLAW_WORKSPACE: options.workspace,
    };
  }
  
  return config;
}

/**
 * Generate APIClaw config for Continue (array format)
 */
export function generateApiclawContinueConfig(options: MergeOptions = {}): ContinueServerConfig {
  const config: ContinueServerConfig = {
    name: options.serverName || 'apiclaw',
    command: 'npx',
    args: ['-y', '@nordsym/apiclaw'],
  };
  
  if (options.workspace) {
    config.env = {
      APICLAW_WORKSPACE: options.workspace,
    };
  }
  
  return config;
}

/**
 * Check if APIClaw is already configured
 */
export function hasApiclawConfig(config: MCPConfig | ContinueConfig, serverName = 'apiclaw'): boolean {
  // Handle Continue's array format
  if (Array.isArray((config as ContinueConfig).mcpServers)) {
    const continueConfig = config as ContinueConfig;
    return continueConfig.mcpServers?.some(s => s.name === serverName) || false;
  }
  
  // Handle standard object format
  const mcpConfig = config as MCPConfig;
  return mcpConfig.mcpServers?.[serverName] !== undefined;
}

/**
 * Merge APIClaw config into existing config (standard format)
 */
export function mergeApiclawConfig(
  existingConfig: MCPConfig,
  options: MergeOptions = {}
): MCPConfig {
  const serverName = options.serverName || 'apiclaw';
  const apiclawConfig = generateApiclawConfig(options);
  
  return deepMerge(existingConfig, {
    mcpServers: {
      ...existingConfig.mcpServers,
      [serverName]: apiclawConfig,
    },
  });
}

/**
 * Merge APIClaw config into Continue config (array format)
 */
export function mergeApiclawContinueConfig(
  existingConfig: ContinueConfig,
  options: MergeOptions = {}
): ContinueConfig {
  const serverName = options.serverName || 'apiclaw';
  const apiclawConfig = generateApiclawContinueConfig(options);
  
  const existingServers = existingConfig.mcpServers || [];
  
  // Check if already exists
  const existingIndex = existingServers.findIndex(s => s.name === serverName);
  
  let newServers: ContinueServerConfig[];
  if (existingIndex >= 0) {
    // Update existing
    newServers = [...existingServers];
    newServers[existingIndex] = apiclawConfig;
  } else {
    // Add new
    newServers = [...existingServers, apiclawConfig];
  }
  
  return {
    ...existingConfig,
    mcpServers: newServers,
  };
}

/**
 * Remove APIClaw from config
 */
export function removeApiclawConfig(
  config: MCPConfig | ContinueConfig,
  serverName = 'apiclaw'
): MCPConfig | ContinueConfig {
  // Handle Continue's array format
  if (Array.isArray((config as ContinueConfig).mcpServers)) {
    const continueConfig = config as ContinueConfig;
    return {
      ...continueConfig,
      mcpServers: continueConfig.mcpServers?.filter(s => s.name !== serverName),
    };
  }
  
  // Handle standard object format
  const mcpConfig = config as MCPConfig;
  const { [serverName]: _, ...remainingServers } = mcpConfig.mcpServers || {};
  
  return {
    ...mcpConfig,
    mcpServers: remainingServers,
  };
}

/**
 * Detect if config uses Continue's array format
 */
export function isContinueFormat(config: MCPConfig | ContinueConfig): config is ContinueConfig {
  return Array.isArray((config as ContinueConfig).mcpServers);
}
