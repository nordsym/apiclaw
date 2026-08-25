/**
 * Post-login execute credential contract.
 *
 * `apiclaw auth login` writes session_token to ~/.apiclaw.toml.
 * POST /v1/execute reads that same value and sends it as X-APIClaw-Session.
 * Do not send api_key as the session header. Do not ask the user to paste
 * a token into chat. Do not POST /v1/execute with an empty session header.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { readAuthConfig, SESSION_TOKEN_TOML_KEY } from "./auth-config.js";

export const EXECUTE_SESSION_TOML_KEY = SESSION_TOKEN_TOML_KEY;
export const EXECUTE_SESSION_HEADER = "X-APIClaw-Session";

const PENDING_LOGIN_DIR = () => path.join(os.homedir(), ".apiclaw");
const PENDING_LOGIN_PATH = () => path.join(PENDING_LOGIN_DIR(), "pending-login");

export class UnsignedExecuteError extends Error {
  readonly code = "not_signed_in";
  readonly pendingLoginUrl: string | null;

  constructor(pendingLoginUrl?: string | null) {
    const url = pendingLoginUrl !== undefined ? pendingLoginUrl : readPendingLoginUrl();
    super("not_signed_in");
    this.name = "UnsignedExecuteError";
    this.pendingLoginUrl = url;
  }
}

export type ExecuteSession =
  | { ok: true; token: string; headers: Record<string, string> }
  | { ok: false; reason: "not_signed_in"; pendingLoginUrl: string | null };

export function usableSessionToken(token: string | null | undefined): string | null {
  const trimmed = token?.trim();
  return trimmed ? trimmed : null;
}

export function executeSessionHeaders(sessionToken: string): Record<string, string> {
  const token = usableSessionToken(sessionToken);
  if (!token) {
    throw new UnsignedExecuteError();
  }
  return { [EXECUTE_SESSION_HEADER]: token };
}

export function readExecuteSessionToken(): string | null {
  return usableSessionToken(readAuthConfig()?.sessionToken);
}

export function readExecuteSessionHeaders(): Record<string, string> | null {
  const sessionToken = readExecuteSessionToken();
  if (!sessionToken) return null;
  return executeSessionHeaders(sessionToken);
}

export function requireExecuteSession(): ExecuteSession {
  const token = readExecuteSessionToken();
  if (!token) {
    return { ok: false, reason: "not_signed_in", pendingLoginUrl: readPendingLoginUrl() };
  }
  return { ok: true, token, headers: executeSessionHeaders(token) };
}

/**
 * Resolve headers for a managed execute. Missing or empty
 * X-APIClaw-Session is a local refusal — never a gateway POST.
 */
export function resolveExecuteAuthHeaders(
  provided?: Record<string, string>,
): Record<string, string> {
  if (provided) {
    const token = usableSessionToken(provided[EXECUTE_SESSION_HEADER]);
    if (!token) {
      throw new UnsignedExecuteError();
    }
    return executeSessionHeaders(token);
  }
  const session = requireExecuteSession();
  if (!session.ok) {
    throw new UnsignedExecuteError(session.pendingLoginUrl);
  }
  return session.headers;
}

export function writePendingLoginUrl(browserUrl: string): void {
  const url = browserUrl.trim();
  if (!url.startsWith("https://")) return;
  const dir = PENDING_LOGIN_DIR();
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(
    PENDING_LOGIN_PATH(),
    JSON.stringify({ browserUrl: url, startedAt: Date.now() }) + "\n",
    { mode: 0o600 },
  );
  try {
    fs.chmodSync(PENDING_LOGIN_PATH(), 0o600);
  } catch {
    // best-effort
  }
}

export function readPendingLoginUrl(): string | null {
  try {
    const raw = fs.readFileSync(PENDING_LOGIN_PATH(), "utf8");
    const data = JSON.parse(raw) as { browserUrl?: unknown };
    if (typeof data.browserUrl === "string" && data.browserUrl.startsWith("https://")) {
      return data.browserUrl;
    }
  } catch {
    // missing or malformed
  }
  return null;
}

export function clearPendingLoginUrl(): void {
  try {
    if (fs.existsSync(PENDING_LOGIN_PATH())) fs.unlinkSync(PENDING_LOGIN_PATH());
  } catch {
    // best-effort
  }
}
