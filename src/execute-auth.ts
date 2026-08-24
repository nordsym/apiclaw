/**
 * Post-login execute credential contract.
 *
 * `apiclaw auth login` writes session_token to ~/.apiclaw.toml.
 * POST /v1/execute reads that same value and sends it as X-APIClaw-Session.
 * Do not send api_key as the session header. Do not ask the user to paste
 * a token into chat.
 */

import { readAuthConfig, SESSION_TOKEN_TOML_KEY } from "./auth-config.js";

export const EXECUTE_SESSION_TOML_KEY = SESSION_TOKEN_TOML_KEY;
export const EXECUTE_SESSION_HEADER = "X-APIClaw-Session";

export function executeSessionHeaders(sessionToken: string): Record<string, string> {
  return { [EXECUTE_SESSION_HEADER]: sessionToken };
}

export function readExecuteSessionToken(): string | null {
  const token = readAuthConfig()?.sessionToken?.trim();
  return token ? token : null;
}

export function readExecuteSessionHeaders(): Record<string, string> | null {
  const sessionToken = readExecuteSessionToken();
  if (!sessionToken) return null;
  return executeSessionHeaders(sessionToken);
}
