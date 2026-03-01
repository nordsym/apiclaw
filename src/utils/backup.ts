/**
 * Backup System
 * Handles timestamped backups of config files with automatic cleanup
 */

import { existsSync, mkdirSync, readdirSync, unlinkSync, copyFileSync, statSync } from 'fs';
import { dirname, basename, join, extname } from 'path';

const MAX_BACKUPS = 5;
const BACKUP_PATTERN = /\.backup\.(\d+)\.json$/;

export interface BackupResult {
  success: boolean;
  backupPath: string | null;
  error?: string;
}

export interface BackupInfo {
  path: string;
  timestamp: number;
  date: Date;
  filename: string;
}

/**
 * Generate backup filename with timestamp
 */
function generateBackupFilename(originalPath: string): string {
  const dir = dirname(originalPath);
  const base = basename(originalPath, '.json');
  const timestamp = Date.now();
  
  return join(dir, `${base}.backup.${timestamp}.json`);
}

/**
 * Create a backup of a config file
 */
export function createBackup(configPath: string): BackupResult {
  try {
    // Check if original file exists
    if (!existsSync(configPath)) {
      return {
        success: true,
        backupPath: null,
        // No backup needed if file doesn't exist
      };
    }
    
    // Ensure backup directory exists
    const dir = dirname(configPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // Generate backup path
    const backupPath = generateBackupFilename(configPath);
    
    // Copy file
    copyFileSync(configPath, backupPath);
    
    // Cleanup old backups
    cleanupOldBackups(configPath);
    
    return {
      success: true,
      backupPath,
    };
  } catch (error) {
    return {
      success: false,
      backupPath: null,
      error: error instanceof Error ? error.message : 'Unknown error creating backup',
    };
  }
}

/**
 * List all backups for a config file
 */
export function listBackups(configPath: string): BackupInfo[] {
  const dir = dirname(configPath);
  const baseName = basename(configPath, '.json');
  
  if (!existsSync(dir)) {
    return [];
  }
  
  const files = readdirSync(dir);
  const backups: BackupInfo[] = [];
  
  for (const file of files) {
    // Match backup pattern: {basename}.backup.{timestamp}.json
    const match = file.match(new RegExp(`^${escapeRegex(baseName)}\\.backup\\.(\\d+)\\.json$`));
    
    if (match) {
      const timestamp = parseInt(match[1], 10);
      const fullPath = join(dir, file);
      
      backups.push({
        path: fullPath,
        timestamp,
        date: new Date(timestamp),
        filename: file,
      });
    }
  }
  
  // Sort by timestamp, newest first
  return backups.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get the most recent backup
 */
export function getLatestBackup(configPath: string): BackupInfo | null {
  const backups = listBackups(configPath);
  return backups[0] || null;
}

/**
 * Cleanup old backups, keeping only MAX_BACKUPS most recent
 */
export function cleanupOldBackups(configPath: string): number {
  const backups = listBackups(configPath);
  let deleted = 0;
  
  // Keep only the first MAX_BACKUPS
  const toDelete = backups.slice(MAX_BACKUPS);
  
  for (const backup of toDelete) {
    try {
      unlinkSync(backup.path);
      deleted++;
    } catch {
      // Ignore deletion errors
    }
  }
  
  return deleted;
}

/**
 * Restore from a backup
 */
export function restoreBackup(backupPath: string, targetPath: string): BackupResult {
  try {
    if (!existsSync(backupPath)) {
      return {
        success: false,
        backupPath: null,
        error: `Backup file not found: ${backupPath}`,
      };
    }
    
    // Backup current file before restoring
    const preRestoreBackup = createBackup(targetPath);
    
    // Copy backup to target
    copyFileSync(backupPath, targetPath);
    
    return {
      success: true,
      backupPath: preRestoreBackup.backupPath,
    };
  } catch (error) {
    return {
      success: false,
      backupPath: null,
      error: error instanceof Error ? error.message : 'Unknown error restoring backup',
    };
  }
}

/**
 * Restore from the most recent backup
 */
export function restoreLatestBackup(configPath: string): BackupResult {
  const latest = getLatestBackup(configPath);
  
  if (!latest) {
    return {
      success: false,
      backupPath: null,
      error: 'No backups found',
    };
  }
  
  return restoreBackup(latest.path, configPath);
}

/**
 * Format backup info for display
 */
export function formatBackupInfo(backup: BackupInfo): string {
  const date = backup.date.toLocaleString();
  return `${backup.filename} (${date})`;
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Delete all backups for a config file
 */
export function deleteAllBackups(configPath: string): number {
  const backups = listBackups(configPath);
  let deleted = 0;
  
  for (const backup of backups) {
    try {
      unlinkSync(backup.path);
      deleted++;
    } catch {
      // Ignore deletion errors
    }
  }
  
  return deleted;
}
