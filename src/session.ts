/**
 * Session management for APIClaw MCP server
 * Stores session token locally at ~/.apiclaw/session
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface SessionData {
  sessionToken: string;
  workspaceId: string;
  email: string;
  createdAt: number;
}

const SESSION_DIR = path.join(os.homedir(), '.apiclaw');
const SESSION_FILE = path.join(SESSION_DIR, 'session');

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
  try {
    if (!fs.existsSync(SESSION_FILE)) {
      return null;
    }
    
    const content = fs.readFileSync(SESSION_FILE, 'utf8');
    const data = JSON.parse(content) as SessionData;
    
    // Validate required fields
    if (!data.sessionToken || !data.workspaceId || !data.email) {
      console.error('[APIClaw] Invalid session file, clearing...');
      clearSession();
      return null;
    }
    
    return data;
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
