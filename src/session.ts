/**
 * Session management for APIClaw MCP server
 * Stores session token locally at ~/.apiclaw/session
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { readAuthConfig } from './auth-config.js';

export interface SessionData {
  sessionToken: string;
  workspaceId: string;
  email: string;
  createdAt: number;
}

const SESSION_DIR = path.join(os.homedir(), '.apiclaw');
const SESSION_FILE = path.join(SESSION_DIR, 'session');
const SESSION_FILE_LEGACY = path.join(SESSION_DIR, 'session.json');

/**
 * Ensure the ~/.apiclaw directory exists
 */
function ensureSessionDir(): void {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { mode: 0o700 });
  }
}

/**
 * Read session from ~/.apiclaw/session
 * Returns null if no session file exists or if it's invalid
 */
export function readSession(): SessionData | null {
  // A-22: prefer ~/.apiclaw.toml (canonical from v2.8) — written by
  // `apiclaw auth login`. Falls through to legacy paths so existing
  // installs keep working until next `auth login`.
  try {
    const cfg = readAuthConfig();
    if (cfg) {
      return {
        sessionToken: cfg.sessionToken,
        workspaceId: cfg.workspaceId,
        email: cfg.email,
        createdAt: cfg.createdAt,
      };
    }
  } catch {
    // fall through to legacy
  }

  try {
    // Try primary session file first
    if (fs.existsSync(SESSION_FILE)) {
      const content = fs.readFileSync(SESSION_FILE, 'utf8');
      const data = JSON.parse(content) as SessionData;
      if (data.sessionToken && data.workspaceId && data.email) {
        return data;
      }
      // Invalid (e.g. empty email from anonymous write) — clear and fall through
      console.error('[APIClaw] Invalid session file, checking legacy...');
      fs.unlinkSync(SESSION_FILE);
    }

    // Fall back to session.json (written by CLI login in older versions)
    if (fs.existsSync(SESSION_FILE_LEGACY)) {
      const content = fs.readFileSync(SESSION_FILE_LEGACY, 'utf8');
      const data = JSON.parse(content) as SessionData;
      if (data.sessionToken && data.workspaceId && data.email) {
        console.error(`[APIClaw] Migrating session.json → session for ${data.email}`);
        // Migrate to canonical location
        fs.writeFileSync(SESSION_FILE, JSON.stringify({ ...data, createdAt: data.createdAt || Date.now() }, null, 2), { mode: 0o600 });
        return data;
      }
    }

    return null;
  } catch (error) {
    console.error('[APIClaw] Error reading session:', error);
    return null;
  }
}

/**
 * Write session to ~/.apiclaw/session
 */
export function writeSession(sessionToken: string, workspaceId: string, email: string): void {
  try {
    ensureSessionDir();
    
    const data: SessionData = {
      sessionToken,
      workspaceId,
      email,
      createdAt: Date.now(),
    };
    
    fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2), {
      mode: 0o600, // Read/write for owner only
    });
    
    console.error(`[APIClaw] Session saved for ${email}`);
  } catch (error) {
    console.error('[APIClaw] Error writing session:', error);
    throw error;
  }
}

/**
 * Clear session file
 */
export function clearSession(): void {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
      console.error('[APIClaw] Session cleared');
    }
  } catch (error) {
    console.error('[APIClaw] Error clearing session:', error);
  }
}

/**
 * Get machine fingerprint (for session binding)
 * Uses hostname + username as a simple fingerprint
 */
export function getMachineFingerprint(): string {
  const hostname = os.hostname();
  const username = os.userInfo().username;
  return `${hostname}:${username}`;
}

/**
 * Detect which MCP client is running the server
 * Priority: explicit env (set by mcp-install) → known env hints → fallback
 */
export function detectMCPClient(): string {
  // 1. Explicit env (injected by mcp-install adapters)
  if (process.env.APICLAW_MCP_CLIENT) return process.env.APICLAW_MCP_CLIENT;
  // 2. Known environment variable hints
  if (process.env.CURSOR_TRACE_DIR) return 'cursor';
  if (process.env.CLAUDE_CODE) return 'claude-code';
  if (process.env.WINDSURF_SESSION) return 'windsurf';
  // 3. Fallback
  return 'unknown';
}
