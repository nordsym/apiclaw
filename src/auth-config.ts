/**
 * APIClaw auth-config — Modal-style TOML config at ~/.apiclaw.toml
 *
 * Single source of truth for CLI, MCP server, and HTTP runtimes that
 * import @nordsym/apiclaw/auth. Replaces the JSON files in ~/.apiclaw/
 * but reads them as a fallback for back-compat.
 *
 * File permissions: 0o600.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface AuthConfig {
  workspaceId: string;
  email: string;
  sessionToken: string;
  apiKey?: string;          // sk-claw-* for HTTP
  mcpToken?: string;        // sk-mcp-* for Remote MCP fallback
  createdAt: number;
  lastUsedAt?: number;
}

const TOML_PATH = path.join(os.homedir(), '.apiclaw.toml');

// Legacy paths read as fallback (session.ts wrote these)
const LEGACY_SESSION_DIR = path.join(os.homedir(), '.apiclaw');
const LEGACY_SESSION_FILE = path.join(LEGACY_SESSION_DIR, 'session');
const LEGACY_SESSION_JSON = path.join(LEGACY_SESSION_DIR, 'session.json');

/**
 * Serialize AuthConfig to a Modal-style [default] TOML block.
 * Kept hand-rolled to avoid a runtime dep — schema is fixed and small.
 */
function serializeToml(cfg: AuthConfig): string {
  const lines: string[] = ['[default]'];
  const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  lines.push(`workspace_id = "${escape(cfg.workspaceId)}"`);
  lines.push(`email = "${escape(cfg.email)}"`);
  lines.push(`session_token = "${escape(cfg.sessionToken)}"`);
  if (cfg.apiKey) lines.push(`api_key = "${escape(cfg.apiKey)}"`);
  if (cfg.mcpToken) lines.push(`mcp_token = "${escape(cfg.mcpToken)}"`);
  lines.push(`created_at = "${new Date(cfg.createdAt).toISOString()}"`);
  lines.push(`last_used_at = "${new Date(cfg.lastUsedAt ?? cfg.createdAt).toISOString()}"`);
  return lines.join('\n') + '\n';
}

/**
 * Minimal TOML parser for the [default] block. Handles double-quoted strings
 * and ISO-8601 datetime strings. No arrays, no nested tables, no comments.
 */
function parseToml(text: string): AuthConfig | null {
  const out: Record<string, string> = {};
  let inDefault = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('[')) {
      inDefault = line === '[default]';
      continue;
    }
    if (!inDefault) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    out[key] = val;
  }
  if (!out.workspace_id || !out.email || !out.session_token) return null;
  const createdAt = out.created_at ? Date.parse(out.created_at) : Date.now();
  const lastUsedAt = out.last_used_at ? Date.parse(out.last_used_at) : createdAt;
  return {
    workspaceId: out.workspace_id,
    email: out.email,
    sessionToken: out.session_token,
    apiKey: out.api_key,
    mcpToken: out.mcp_token,
    createdAt: Number.isNaN(createdAt) ? Date.now() : createdAt,
    lastUsedAt: Number.isNaN(lastUsedAt) ? createdAt : lastUsedAt,
  };
}

/**
 * Read auth config. Tries ~/.apiclaw.toml first, then falls back to the
 * legacy JSON files written by older session.ts versions.
 */
export function readAuthConfig(): AuthConfig | null {
  try {
    if (fs.existsSync(TOML_PATH)) {
      const text = fs.readFileSync(TOML_PATH, 'utf8');
      const cfg = parseToml(text);
      if (cfg) return cfg;
    }
  } catch (err) {
    // fall through to legacy
  }

  // Legacy JSON fallbacks (session.ts format)
  for (const legacyPath of [LEGACY_SESSION_FILE, LEGACY_SESSION_JSON]) {
    try {
      if (!fs.existsSync(legacyPath)) continue;
      const data = JSON.parse(fs.readFileSync(legacyPath, 'utf8')) as Record<string, unknown>;
      const sessionToken = data.sessionToken as string | undefined;
      const workspaceId = data.workspaceId as string | undefined;
      const email = data.email as string | undefined;
      if (!sessionToken || !workspaceId || !email) continue;
      return {
        sessionToken,
        workspaceId,
        email,
        createdAt: (data.createdAt as number | undefined) ?? Date.now(),
        lastUsedAt: (data.lastUsedAt as number | undefined) ?? Date.now(),
      };
    } catch (err) {
      // try next
    }
  }

  return null;
}

/**
 * Write auth config to ~/.apiclaw.toml with mode 0o600.
 * Best-effort migration: if legacy ~/.apiclaw/session exists, leave it
 * (session.ts continues to read it) so older binaries on the same machine
 * keep working until the next install bump.
 */
export function writeAuthConfig(cfg: AuthConfig): void {
  const toWrite: AuthConfig = {
    ...cfg,
    lastUsedAt: cfg.lastUsedAt ?? Date.now(),
  };
  fs.writeFileSync(TOML_PATH, serializeToml(toWrite), { mode: 0o600 });
  try {
    fs.chmodSync(TOML_PATH, 0o600);
  } catch {
    // best-effort
  }
}

/**
 * Update only lastUsedAt without rewriting the rest. Useful for the MCP
 * server's session-touch on each call.
 */
export function touchAuthConfig(): void {
  const cfg = readAuthConfig();
  if (!cfg) return;
  writeAuthConfig({ ...cfg, lastUsedAt: Date.now() });
}

/**
 * Clear ~/.apiclaw.toml (and the legacy files). Used by `apiclaw auth logout`.
 */
export function clearAuthConfig(): void {
  for (const p of [TOML_PATH, LEGACY_SESSION_FILE, LEGACY_SESSION_JSON]) {
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch {
      // best-effort
    }
  }
}

export const AUTH_CONFIG_PATH = TOML_PATH;
