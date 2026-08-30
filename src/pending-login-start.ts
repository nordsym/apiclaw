/**
 * Mint (or reuse) a pending Clerk CLI login without a TTY.
 *
 * MCP / agent hosts have no stdin/stdout TTY, so they must not wait for
 * `canLaunchInteractiveAuth` before creating `https://apiclaw.cloud/auth/cli?authId=…`.
 * Opening the browser is best-effort. whoami redeems Authorize; localhost
 * connection refused is OK.
 */

import { createHash, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import type { PendingLogin } from "./cli-auth-redeem.js";
import { pendingLoginStillOpen } from "./cli-auth-redeem.js";
import { readPendingLogin, writePendingLogin } from "./execute-auth.js";
import { getMachineFingerprint } from "./session.js";

export const CLI_AUTH_START_PATH = "cliAuth:start";
export const PENDING_LOGIN_LOOPBACK_PORT = 41789;

const CONVEX_URL =
  process.env.APICLAW_CONVEX_URL || "https://adventurous-avocet-799.convex.cloud";
const APP_URL = process.env.APICLAW_APP_URL || "https://apiclaw.cloud";

export type StartedPendingLogin = PendingLogin & { reused: boolean };

export type CliAuthStartArgs = {
  state: string;
  challenge: string;
  port: number;
  fingerprint: string;
  appUrl: string;
};

export type CliAuthStartResult = {
  authId: string;
  browserUrl: string;
  expiresAt: number;
};

export type EnsurePendingLoginOptions = {
  /** Best-effort browser open. Default false — minting must not require a TTY. */
  openBrowser?: boolean;
  port?: number;
  now?: number;
  fingerprint?: string;
  appUrl?: string;
  convexUrl?: string;
  start?: (args: CliAuthStartArgs) => Promise<CliAuthStartResult>;
};

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function generatePkcePair(): { verifier: string; challenge: string } {
  const verifier = base64url(randomBytes(48));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function generateCliAuthState(): string {
  return base64url(randomBytes(24));
}

function openBrowserBestEffort(url: string): boolean {
  const platform = process.platform;
  let cmd: string;
  let args: string[];
  if (platform === "darwin") {
    cmd = "open";
    args = [url];
  } else if (platform === "win32") {
    cmd = "cmd";
    args = ["/c", "start", "", url];
  } else {
    cmd = "xdg-open";
    args = [url];
  }
  try {
    const child = spawn(cmd, args, { detached: true, stdio: "ignore" });
    child.unref();
    return true;
  } catch {
    return false;
  }
}

async function convexStart(
  convexUrl: string,
  args: CliAuthStartArgs,
): Promise<CliAuthStartResult> {
  const res = await fetch(`${convexUrl}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: CLI_AUTH_START_PATH, args }),
  });
  if (!res.ok) throw new Error(`convex ${CLI_AUTH_START_PATH} ${res.status}`);
  const data = (await res.json()) as {
    status?: string;
    value?: CliAuthStartResult;
    errorMessage?: string;
  };
  if (data.status === "error") {
    throw new Error(data.errorMessage || `convex ${CLI_AUTH_START_PATH} error`);
  }
  return (data.value ?? data) as CliAuthStartResult;
}

/**
 * Return an open pending login, or mint a new one. Never gated on TTY.
 * Always writes authId + PKCE verifier so whoami can redeem Authorize.
 */
export async function ensurePendingLogin(
  options: EnsurePendingLoginOptions = {},
): Promise<StartedPendingLogin | null> {
  const now = options.now ?? Date.now();
  const existing = readPendingLogin();
  if (existing && pendingLoginStillOpen(existing, now)) {
    if (options.openBrowser) openBrowserBestEffort(existing.browserUrl);
    return { ...existing, reused: true };
  }

  const { verifier, challenge } = generatePkcePair();
  const state = generateCliAuthState();
  const fingerprint = options.fingerprint ?? getMachineFingerprint();
  const appUrl = options.appUrl ?? APP_URL;
  const port = options.port ?? PENDING_LOGIN_LOOPBACK_PORT;
  const start = options.start ?? ((args) => convexStart(options.convexUrl ?? CONVEX_URL, args));

  let started: CliAuthStartResult;
  try {
    started = await start({
      state,
      challenge,
      port,
      fingerprint,
      appUrl,
    });
  } catch {
    return null;
  }

  if (
    !started.authId ||
    !started.browserUrl?.startsWith("https://") ||
    !started.browserUrl.includes("/auth/cli?authId=")
  ) {
    return null;
  }

  const pending: PendingLogin = {
    browserUrl: started.browserUrl,
    authId: started.authId,
    codeVerifier: verifier,
    state,
    fingerprint,
    startedAt: now,
    expiresAt: started.expiresAt,
  };
  writePendingLogin(pending);
  if (options.openBrowser) openBrowserBestEffort(pending.browserUrl);
  return { ...pending, reused: false };
}
