/**
 * APIClaw MCP Auto-Setup - Color Utilities
 * 
 * Chalk-based color helpers for consistent terminal output.
 * Supports color detection and graceful fallback.
 */

import chalk from 'chalk';

// Re-export chalk for direct access
export { chalk };

/**
 * Semantic colors for APIClaw CLI output
 */
export const colors = {
  // Status colors
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  
  // Emphasis
  primary: chalk.cyan,
  secondary: chalk.gray,
  muted: chalk.dim,
  highlight: chalk.bold,
  
  // Branded
  brand: chalk.hex('#6366F1'), // APIClaw purple
  
  // Semantic actions
  action: chalk.cyan.bold,
  code: chalk.gray.italic,
  path: chalk.underline,
  link: chalk.blue.underline,
  
  // Labels
  label: chalk.white.bold,
  value: chalk.white,
} as const;

/**
 * Icons for visual feedback
 */
export const icons = {
  // Status icons
  success: chalk.green('✓'),
  error: chalk.red('✗'),
  warning: chalk.yellow('⚠'),
  info: chalk.blue('ℹ'),
  
  // Progress icons  
  pending: chalk.gray('○'),
  active: chalk.cyan('●'),
  
  // Actions
  arrow: chalk.cyan('→'),
  bullet: chalk.gray('•'),
  plus: chalk.green('+'),
  minus: chalk.red('-'),
  
  // Objects
  folder: '📁',
  file: '📄',
  config: '⚙️',
  search: '🔍',
  rocket: '🚀',
  shield: '🛡️',
  key: '🔑',
  check: '✅',
  cross: '❌',
  wrench: '🔧',
  package: '📦',
} as const;

/**
 * Format a header with brand styling
 */
export function header(text: string): string {
  return chalk.bold.cyan(`\n${text}\n${'═'.repeat(text.length)}\n`);
}

/**
 * Format a section title
 */
export function section(text: string): string {
  return chalk.bold.white(`\n${text}\n${'-'.repeat(text.length)}`);
}

/**
 * Format a key-value pair for display
 */
export function keyValue(key: string, value: string, indent = 0): string {
  const padding = ' '.repeat(indent);
  return `${padding}${colors.label(key)}: ${colors.value(value)}`;
}

/**
 * Format a status line with icon
 */
export function status(
  state: 'success' | 'error' | 'warning' | 'info' | 'pending',
  message: string
): string {
  const iconMap = {
    success: icons.success,
    error: icons.error,
    warning: icons.warning,
    info: icons.info,
    pending: icons.pending,
  };
  return `${iconMap[state]} ${message}`;
}

/**
 * Format a diff-style addition
 */
export function added(text: string): string {
  return chalk.green(`+ ${text}`);
}

/**
 * Format a diff-style removal
 */
export function removed(text: string): string {
  return chalk.red(`- ${text}`);
}

/**
 * Format a code block
 */
export function codeBlock(code: string, indent = 2): string {
  const padding = ' '.repeat(indent);
  return code
    .split('\n')
    .map(line => `${padding}${chalk.gray(line)}`)
    .join('\n');
}

/**
 * Format a command suggestion
 */
export function command(cmd: string): string {
  return chalk.cyan.bold(`  ${cmd}`);
}

/**
 * Format a help link
 */
export function helpLink(url: string): string {
  return chalk.blue.underline(url);
}

/**
 * Create a boxed message
 */
export function box(
  content: string,
  options: { title?: string; padding?: number; borderColor?: typeof chalk } = {}
): string {
  const { title, padding = 1, borderColor = chalk.gray } = options;
  const lines = content.split('\n');
  const maxWidth = Math.max(...lines.map(l => stripAnsi(l).length), title?.length || 0);
  const width = maxWidth + padding * 2;
  
  const pad = ' '.repeat(padding);
  const top = title 
    ? borderColor(`┌─ ${title} ${'─'.repeat(Math.max(0, width - title.length - 4))}┐`)
    : borderColor(`┌${'─'.repeat(width)}┐`);
  const bottom = borderColor(`└${'─'.repeat(width)}┘`);
  
  const body = lines.map(line => {
    const stripped = stripAnsi(line);
    const rightPad = ' '.repeat(Math.max(0, maxWidth - stripped.length));
    return `${borderColor('│')}${pad}${line}${rightPad}${pad}${borderColor('│')}`;
  });
  
  return [top, ...body, bottom].join('\n');
}

/**
 * Strip ANSI escape codes from string (for width calculations)
 */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Format a table-like list
 */
export function table(rows: [string, string][], indent = 0): string {
  const padding = ' '.repeat(indent);
  const maxKeyLen = Math.max(...rows.map(([k]) => stripAnsi(k).length));
  
  return rows
    .map(([key, value]) => {
      const keyPad = ' '.repeat(maxKeyLen - stripAnsi(key).length);
      return `${padding}${key}${keyPad}  ${value}`;
    })
    .join('\n');
}

/**
 * Format a list with bullets
 */
export function bulletList(items: string[], indent = 0): string {
  const padding = ' '.repeat(indent);
  return items.map(item => `${padding}${icons.bullet} ${item}`).join('\n');
}

/**
 * Format numbered list
 */
export function numberedList(items: string[], indent = 0): string {
  const padding = ' '.repeat(indent);
  return items.map((item, i) => `${padding}${chalk.gray(`${i + 1}.`)} ${item}`).join('\n');
}
