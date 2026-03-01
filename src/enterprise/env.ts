/**
 * Environment Variable Handler
 * Manages APIClaw environment variables for configuration
 */

export interface ApiclawEnvConfig {
  workspace?: string;
  apiUrl?: string;
  disableTelemetry?: boolean;
}

export const ENV_VARS = {
  WORKSPACE: 'APICLAW_WORKSPACE',
  API_URL: 'APICLAW_API_URL',
  DISABLE_TELEMETRY: 'APICLAW_DISABLE_TELEMETRY',
} as const;

export const DEFAULT_API_URL = 'https://api.apiclaw.com';

/**
 * Read APIClaw config from environment variables
 */
export function readEnvConfig(): ApiclawEnvConfig {
  return {
    workspace: process.env[ENV_VARS.WORKSPACE] || undefined,
    apiUrl: process.env[ENV_VARS.API_URL] || undefined,
    disableTelemetry: process.env[ENV_VARS.DISABLE_TELEMETRY] === 'true' ||
                      process.env[ENV_VARS.DISABLE_TELEMETRY] === '1',
  };
}

/**
 * Get API URL with fallback to default
 */
export function getApiUrl(): string {
  return process.env[ENV_VARS.API_URL] || DEFAULT_API_URL;
}

/**
 * Check if telemetry is disabled
 */
export function isTelemetryDisabled(): boolean {
  const val = process.env[ENV_VARS.DISABLE_TELEMETRY];
  return val === 'true' || val === '1';
}

/**
 * Get pre-configured workspace ID
 */
export function getWorkspaceFromEnv(): string | undefined {
  return process.env[ENV_VARS.WORKSPACE];
}

/**
 * Generate env block for MCP server config
 */
export function generateEnvBlock(config: ApiclawEnvConfig): Record<string, string> {
  const env: Record<string, string> = {};
  
  if (config.workspace) {
    env[ENV_VARS.WORKSPACE] = config.workspace;
  }
  
  if (config.apiUrl && config.apiUrl !== DEFAULT_API_URL) {
    env[ENV_VARS.API_URL] = config.apiUrl;
  }
  
  if (config.disableTelemetry) {
    env[ENV_VARS.DISABLE_TELEMETRY] = 'true';
  }
  
  return env;
}

/**
 * Format env config for display
 */
export function formatEnvConfig(config: ApiclawEnvConfig): string[] {
  const lines: string[] = [];
  
  if (config.workspace) {
    lines.push(`  Workspace: ${config.workspace}`);
  }
  
  if (config.apiUrl) {
    lines.push(`  API URL: ${config.apiUrl}`);
  }
  
  if (config.disableTelemetry) {
    lines.push(`  Telemetry: Disabled`);
  }
  
  return lines;
}

/**
 * Validate workspace ID format
 */
export function isValidWorkspaceId(id: string): boolean {
  // Workspace IDs should be alphanumeric with dashes/underscores
  return /^[a-zA-Z0-9_-]{3,64}$/.test(id);
}

/**
 * Validate API URL format
 */
export function isValidApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Generate shell export statements
 */
export function generateShellExports(config: ApiclawEnvConfig): string {
  const lines: string[] = [];
  
  if (config.workspace) {
    lines.push(`export ${ENV_VARS.WORKSPACE}="${config.workspace}"`);
  }
  
  if (config.apiUrl) {
    lines.push(`export ${ENV_VARS.API_URL}="${config.apiUrl}"`);
  }
  
  if (config.disableTelemetry) {
    lines.push(`export ${ENV_VARS.DISABLE_TELEMETRY}="true"`);
  }
  
  return lines.join('\n');
}

/**
 * Generate PowerShell $env statements
 */
export function generatePowerShellEnv(config: ApiclawEnvConfig): string {
  const lines: string[] = [];
  
  if (config.workspace) {
    lines.push(`$env:${ENV_VARS.WORKSPACE} = "${config.workspace}"`);
  }
  
  if (config.apiUrl) {
    lines.push(`$env:${ENV_VARS.API_URL} = "${config.apiUrl}"`);
  }
  
  if (config.disableTelemetry) {
    lines.push(`$env:${ENV_VARS.DISABLE_TELEMETRY} = "true"`);
  }
  
  return lines.join('\n');
}
