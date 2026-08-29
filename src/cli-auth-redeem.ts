/**
 * Finish a Clerk Authorize click without the browser reaching localhost.
 *
 * Organic SKILL.md / Cursor / Claude Desktop hosts often kill `auth login`
 * (tool timeout) or cannot route https://apiclaw.cloud → http://127.0.0.1.
 * Authorize still claims the authId in Convex. whoami and a live login
 * poll that claim with the PKCE challenge from ~/.apiclaw/pending-login
 * and exchange it for session_token. The one-time code is useless without
 * the verifier that never left this machine.
 */

import { createHash } from "node:crypto";
import type { AuthConfig } from "./auth-config.js";
import { LOGIN_WAIT_TIMEOUT_MS } from "./login-wait.js";

export const CLI_AUTH_POLL_PATH = "cliAuth:poll";
export const CLI_AUTH_EXCHANGE_PATH = "cliAuth:exchange";

export type PendingLogin = {
  browserUrl: string;
  authId: string;
  codeVerifier: string;
  state: string;
  fingerprint?: string;
  startedAt: number;
  expiresAt?: number;
};

export type ClaimedPoll = {
  status: "claimed";
  code: string;
  state: string;
};

export type CliAuthPollResult =
  | ClaimedPoll
  | { status: "pending" | "exchanged" | "expired" | "not_found" };

export type RedeemExchangeResult = {
  success: boolean;
  error?: string;
  sessionToken?: string;
  workspaceId?: string;
  email?: string;
  apiKey?: string;
  tier?: string;
  isNew?: boolean;
};

export function pkceChallengeFromVerifier(verifier: string): string {
  const digest = createHash("sha256").update(verifier).digest();
  return digest.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function pendingLoginStillOpen(pending: PendingLogin | null | undefined, now = Date.now()): boolean {
  if (!pending) return false;
  if (!pending.authId || !pending.codeVerifier || !pending.state) return false;
  if (!pending.browserUrl.startsWith("https://")) return false;
  const expiresAt = pending.expiresAt ?? pending.startedAt + LOGIN_WAIT_TIMEOUT_MS;
  return expiresAt > now;
}

export function claimedCodeFromPoll(
  pending: PendingLogin,
  poll: CliAuthPollResult | null | undefined,
): { code: string; state: string } | null {
  if (!poll || poll.status !== "claimed") return null;
  if (!poll.code || !poll.state) return null;
  if (poll.state !== pending.state) return null;
  return { code: poll.code, state: poll.state };
}

export function authConfigFromExchange(
  result: RedeemExchangeResult,
  now = Date.now(),
): AuthConfig | null {
  if (!result.success || !result.sessionToken || !result.workspaceId || !result.email) {
    return null;
  }
  return {
    workspaceId: result.workspaceId,
    email: result.email,
    sessionToken: result.sessionToken,
    apiKey: result.apiKey,
    createdAt: now,
    lastUsedAt: now,
  };
}

export async function redeemPendingLogin(options: {
  pending: PendingLogin | null;
  poll: (authId: string, challenge: string) => Promise<CliAuthPollResult | null>;
  exchange: (args: {
    code: string;
    codeVerifier: string;
    fingerprint?: string;
  }) => Promise<RedeemExchangeResult>;
  write: (cfg: AuthConfig) => void;
  clearPending: () => void;
  now?: number;
}): Promise<AuthConfig | null> {
  const pending = options.pending;
  if (!pendingLoginStillOpen(pending, options.now)) return null;
  const poll = await options.poll(pending.authId, pkceChallengeFromVerifier(pending.codeVerifier));
  const claimed = claimedCodeFromPoll(pending, poll);
  if (!claimed) return null;
  const exchanged = await options.exchange({
    code: claimed.code,
    codeVerifier: pending.codeVerifier,
    fingerprint: pending.fingerprint,
  });
  const cfg = authConfigFromExchange(exchanged, options.now);
  if (!cfg) return null;
  options.write(cfg);
  options.clearPending();
  return cfg;
}
