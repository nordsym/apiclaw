/**
 * APIClaw MCP Auto-Setup - Error Handling
 * 
 * Comprehensive error formatting with actionable help.
 * Every error includes context, suggestions, and help links.
 */

import { colors, icons, box, numberedList, command, helpLink } from './colors.js';

/**
 * Error codes for APIClaw setup
 */
export enum ErrorCode {
  // File system errors
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_JSON = 'INVALID_JSON',
  WRITE_FAILED = 'WRITE_FAILED',
  BACKUP_FAILED = 'BACKUP_FAILED',
  
  // Configuration errors
  ALREADY_CONFIGURED = 'ALREADY_CONFIGURED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  MERGE_CONFLICT = 'MERGE_CONFLICT',
  
  // Client errors
  CLIENT_NOT_FOUND = 'CLIENT_NOT_FOUND',
  UNSUPPORTED_CLIENT = 'UNSUPPORTED_CLIENT',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_FAILED = 'AUTH_FAILED',
  
  // System errors
  UNSUPPORTED_OS = 'UNSUPPORTED_OS',
  NODE_VERSION = 'NODE_VERSION',
  
  // Generic
  UNKNOWN = 'UNKNOWN',
}

/**
 * APIClaw error with rich context
 */
export class ApiclawError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiclawError';
  }
}

/**
 * Error metadata with help information
 */
interface ErrorMeta {
  title: string;
  description: string;
  suggestions: string[];
  commands?: string[];
  helpUrl?: string;
}

/**
 * Error metadata registry
 */
const errorMeta: Record<ErrorCode, ErrorMeta> = {
  [ErrorCode.CONFIG_NOT_FOUND]: {
    title: 'Config file not found',
    description: 'The MCP client config file does not exist at the expected location.',
    suggestions: [
      'Make sure the MCP client is installed',
      'The client may not have created its config yet - try opening and closing it',
      'Use --config to specify a custom path',
    ],
    commands: [
      'npx @nordsym/apiclaw setup --client cursor',
      'npx @nordsym/apiclaw setup --config /path/to/config.json',
    ],
    helpUrl: 'https://docs.apiclaw.com/setup/config-not-found',
  },
  
  [ErrorCode.PERMISSION_DENIED]: {
    title: 'Permission denied',
    description: 'Unable to write to the config file due to insufficient permissions.',
    suggestions: [
      'The config file may be owned by another user',
      'You may need elevated permissions',
      'Check if the file is locked by another process',
    ],
    commands: [
      'sudo npx @nordsym/apiclaw setup',
      'chmod 644 <config-path>',
    ],
    helpUrl: 'https://docs.apiclaw.com/setup/permissions',
  },
  
  [ErrorCode.INVALID_JSON]: {
    title: 'Invalid JSON in config file',
    description: 'The existing config file contains malformed JSON.',
    suggestions: [
      'Check for trailing commas or missing brackets',
      'Restore from a backup if available',
      'Manually fix the JSON syntax errors',
    ],
    commands: [
      'npx @nordsym/apiclaw restore --list',
      'npx @nordsym/apiclaw restore',
    ],
    helpUrl: 'https://docs.apiclaw.com/setup/invalid-json',
  },
  
  [ErrorCode.WRITE_FAILED]: {
    title: 'Failed to write config file',
    description: 'An error occurred while writing the updated configuration.',
    suggestions: [
      'Check available disk space',
      'Ensure the config directory exists',
      'Verify write permissions',
    ],
    helpUrl: 'https://docs.apiclaw.com/setup/write-failed',
  },
  
  [ErrorCode.BACKUP_FAILED]: {
    title: 'Failed to create backup',
    description: 'Could not create a backup of the existing config.',
    suggestions: [
      'Check available disk space',
      'Verify write permissions in config directory',
      'Use --no-backup to skip backup (not recommended)',
    ],
    helpUrl: 'https://docs.apiclaw.com/setup/backup-failed',
  },
  
  [ErrorCode.ALREADY_CONFIGURED]: {
    title: 'Already configured',
    description: 'APIClaw is already configured in this MCP client.',
    suggestions: [
      'Use --force to update the existing configuration',
      'Use npx @nordsym/apiclaw doctor to verify the setup',
    ],
    commands: [
      'npx @nordsym/apiclaw setup --force',
      'npx @nordsym/apiclaw doctor',
    ],
    helpUrl: 'https://docs.apiclaw.com/setup/already-configured',
  },
  
  [ErrorCode.INVALID_CONFIG]: {
    title: 'Invalid configuration',
    description: 'The configuration structure is invalid or missing required fields.',
    suggestions: [
      'Ensure the config follows the MCP specification',
      'Check for required fields like "mcpServers"',
    ],
    helpUrl: 'https://docs.apiclaw.com/setup/invalid-config',
  },
  
  [ErrorCode.MERGE_CONFLICT]: {
    title: 'Configuration merge conflict',
    description: 'Could not safely merge APIClaw into the existing configuration.',
    suggestions: [
      'Review the existing config manually',
      'Use --force to overwrite',
      'Create a backup and try again',
    ],
    helpUrl: 'https://docs.apiclaw.com/setup/merge-conflict',
  },
  
  [ErrorCode.CLIENT_NOT_FOUND]: {
    title: 'MCP client not found',
    description: 'The specified MCP client could not be detected on this system.',
    suggestions: [
      'Install the MCP client first',
      'Specify a different client with --client',
      'Use --config for custom config paths',
    ],
    commands: [
      'npx @nordsym/apiclaw setup --client claude-desktop',
      'npx @nordsym/apiclaw doctor',
    ],
    helpUrl: 'https://docs.apiclaw.com/setup/client-not-found',
  },
  
  [ErrorCode.UNSUPPORTED_CLIENT]: {
    title: 'Unsupported MCP client',
    description: 'This MCP client is not yet supported by APIClaw auto-setup.',
    suggestions: [
      'Check for updates: npm update @nordsym/apiclaw',
      'Use --config to manually specify the config path',
      'Request support at github.com/nordsym/apiclaw',
    ],
    helpUrl: 'https://docs.apiclaw.com/setup/supported-clients',
  },
  
  [ErrorCode.NETWORK_ERROR]: {
    title: 'Network error',
    description: 'Could not connect to APIClaw services.',
    suggestions: [
      'Check your internet connection',
      'Setup works offline - verify connectivity later',
      'Check if api.apiclaw.com is reachable',
    ],
    commands: [
      'curl -I https://api.apiclaw.com/health',
      'npx @nordsym/apiclaw doctor',
    ],
    helpUrl: 'https://docs.apiclaw.com/setup/network-error',
  },
  
  [ErrorCode.AUTH_FAILED]: {
    title: 'Authentication failed',
    description: 'Could not authenticate with APIClaw.',
    suggestions: [
      'Check your workspace ID',
      'Verify your API key is valid',
      'Setup works without auth - configure credentials later',
    ],
    helpUrl: 'https://docs.apiclaw.com/setup/auth-failed',
  },
  
  [ErrorCode.UNSUPPORTED_OS]: {
    title: 'Unsupported operating system',
    description: 'APIClaw auto-setup is not available for this operating system.',
    suggestions: [
      'Supported: macOS, Windows 10/11, Linux',
      'Manual setup instructions available',
    ],
    helpUrl: 'https://docs.apiclaw.com/setup/manual',
  },
  
  [ErrorCode.NODE_VERSION]: {
    title: 'Unsupported Node.js version',
    description: 'APIClaw requires Node.js 18 or higher.',
    suggestions: [
      'Upgrade Node.js to version 18 or later',
      'Use nvm to manage Node.js versions',
    ],
    commands: [
      'nvm install 18',
      'nvm use 18',
    ],
    helpUrl: 'https://docs.apiclaw.com/setup/node-version',
  },
  
  [ErrorCode.UNKNOWN]: {
    title: 'Unknown error',
    description: 'An unexpected error occurred.',
    suggestions: [
      'Try running with --verbose for more details',
      'Check the logs for more information',
      'Report this issue if it persists',
    ],
    commands: [
      'npx @nordsym/apiclaw setup --verbose',
    ],
    helpUrl: 'https://docs.apiclaw.com/support',
  },
};

/**
 * Format an error for terminal output
 */
export function formatError(error: Error | ApiclawError): string {
  const code = error instanceof ApiclawError ? error.code : ErrorCode.UNKNOWN;
  const meta = errorMeta[code];
  const context = error instanceof ApiclawError ? error.context : undefined;
  
  const lines: string[] = [];
  
  // Header
  lines.push(`${icons.cross} ${colors.error(`Error: ${meta.title}`)}`);
  lines.push('');
  
  // Description
  lines.push(colors.secondary(meta.description));
  
  // Context (if available)
  if (context) {
    lines.push('');
    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined) {
        lines.push(colors.muted(`  ${key}: ${String(value)}`));
      }
    }
  }
  
  // Original error message (if different from description)
  if (error.message && error.message !== meta.description) {
    lines.push('');
    lines.push(colors.muted(`Details: ${error.message}`));
  }
  
  // Suggestions
  lines.push('');
  lines.push(colors.secondary('This usually means:'));
  lines.push(numberedList(meta.suggestions, 0));
  
  // Commands
  if (meta.commands && meta.commands.length > 0) {
    lines.push('');
    lines.push(colors.secondary('Try:'));
    for (const cmd of meta.commands) {
      lines.push(command(cmd));
    }
  }
  
  // Help link
  if (meta.helpUrl) {
    lines.push('');
    lines.push(`Need help? ${helpLink(meta.helpUrl)}`);
  }
  
  return lines.join('\n');
}

/**
 * Print an error to stderr
 */
export function printError(error: Error | ApiclawError): void {
  console.error(formatError(error));
}

/**
 * Create a typed error
 */
export function createError(
  code: ErrorCode,
  message?: string,
  context?: Record<string, unknown>
): ApiclawError {
  const meta = errorMeta[code];
  return new ApiclawError(code, message || meta.description, context);
}

/**
 * Wrap a function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: { exitOnError?: boolean } = {}
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    printError(error instanceof Error ? error : new Error(String(error)));
    
    if (options.exitOnError) {
      process.exit(1);
    }
    
    return undefined;
  }
}

/**
 * Format a warning message
 */
export function formatWarning(message: string, suggestions?: string[]): string {
  const lines: string[] = [];
  
  lines.push(`${icons.warning} ${colors.warning(`Warning: ${message}`)}`);
  
  if (suggestions && suggestions.length > 0) {
    lines.push('');
    lines.push(numberedList(suggestions, 0));
  }
  
  return lines.join('\n');
}

/**
 * Print a warning to stderr
 */
export function printWarning(message: string, suggestions?: string[]): void {
  console.error(formatWarning(message, suggestions));
}

/**
 * Format an info message
 */
export function formatInfo(message: string): string {
  return `${icons.info} ${colors.info(message)}`;
}

/**
 * Format a success message
 */
export function formatSuccess(message: string): string {
  return `${icons.check} ${colors.success(message)}`;
}
