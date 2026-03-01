/**
 * OS Detection Utility
 * Detects the operating system and provides platform-specific helpers
 */

import { platform, homedir } from 'os';
import { join } from 'path';

export type Platform = 'mac' | 'win' | 'linux';

/**
 * Detect the current operating system
 */
export function detectOS(): Platform {
  const os = platform();
  
  switch (os) {
    case 'darwin':
      return 'mac';
    case 'win32':
      return 'win';
    case 'linux':
      return 'linux';
    default:
      // Default to linux for other Unix-like systems
      return 'linux';
  }
}

/**
 * Get the home directory for the current user
 */
export function getHomeDir(): string {
  return homedir();
}

/**
 * Get the app data directory based on OS
 * - macOS: ~/Library/Application Support
 * - Windows: %APPDATA%
 * - Linux: ~/.config
 */
export function getAppDataDir(): string {
  const home = getHomeDir();
  const os = detectOS();
  
  switch (os) {
    case 'mac':
      return join(home, 'Library', 'Application Support');
    case 'win':
      return process.env.APPDATA || join(home, 'AppData', 'Roaming');
    case 'linux':
      return process.env.XDG_CONFIG_HOME || join(home, '.config');
  }
}

/**
 * Get the user profile directory (Windows-specific, falls back to home)
 */
export function getUserProfileDir(): string {
  return process.env.USERPROFILE || getHomeDir();
}

/**
 * Check if running as root/admin
 */
export function isElevated(): boolean {
  const os = detectOS();
  
  if (os === 'win') {
    // Windows admin check is more complex, skip for now
    return false;
  }
  
  // Unix-like: check if UID is 0
  return process.getuid?.() === 0;
}

/**
 * Get OS-specific path separator
 */
export function getPathSeparator(): string {
  return detectOS() === 'win' ? '\\' : '/';
}

/**
 * Normalize path for current OS
 */
export function normalizePath(path: string): string {
  const os = detectOS();
  
  if (os === 'win') {
    // Convert forward slashes to backslashes on Windows
    return path.replace(/\//g, '\\');
  }
  
  return path;
}

/**
 * Expand ~ to home directory
 */
export function expandHome(path: string): string {
  if (path.startsWith('~')) {
    return join(getHomeDir(), path.slice(1));
  }
  return path;
}

/**
 * Get OS display name
 */
export function getOSDisplayName(): string {
  const os = detectOS();
  
  switch (os) {
    case 'mac':
      return 'macOS';
    case 'win':
      return 'Windows';
    case 'linux':
      return 'Linux';
  }
}
