/**
 * First-run canon — install is not Done until whoami works AND the first
 * POST /v1/execute returns 200. Shared by mcp-install, install.sh / install.ps1,
 * no_session recovery, and the first managed-call prompt. Do not invent a
 * second login command or a dead first-wow rail here.
 */

import { readAuthConfig } from "./auth-config.js";
import {
  AUTH_FIRST_CALL_COMMAND,
  completeFirstExecute,
  type FirstExecuteResult,
} from "./first-call.js";

export { AUTH_FIRST_CALL_COMMAND } from "./first-call.js";

/** User-facing recovery / next-step command. Never pin an unpublished version. */
export const AUTH_LOGIN_COMMAND = "npx @nordsym/apiclaw auth login";

/** Confirm the workspace file is live after login. */
export const AUTH_WHOAMI_COMMAND = "npx @nordsym/apiclaw auth whoami";

/**
 * First managed call after sign-in. Must be a rail that is customer-executable
 * today: NASA APOD, APILayer fixer_latest EUR, or Brave search.
 * Never lead with ElevenLabs or Replicate.
 */
export const FIRST_CALL_PROMPT =
  'Use APIClaw to fetch today\'s NASA Astronomy Picture of the Day: call_api with provider "nasa", action "apod", params {}. Then describe the image. Alternatives that also work live: apilayer fixer_latest with base EUR, or brave_search search for "AI agent infrastructure news".';

export const FIRST_CALL_CLI =
  "apiclaw call nasa/apod --params '{}'";

export interface LaunchAuthProbe {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  stdinIsTTY?: boolean;
  stdoutIsTTY?: boolean;
}

/**
 * Launch `auth login` only when the user can finish browser ownership
 * verification on this machine. curl|bash has no stdin TTY, so stdout TTY
 * plus a browser opener is enough. Headless SSH must print the command.
 */
export function canLaunchInteractiveAuth(probe: LaunchAuthProbe = {}): boolean {
  const env = probe.env ?? process.env;
  if (env.CI === "true" || env.CI === "1") return false;
  if (env.APICLAW_SKIP_AUTH === "1" || env.APICLAW_SKIP_AUTH === "true") return false;

  const stdoutIsTTY = probe.stdoutIsTTY ?? Boolean(process.stdout.isTTY);
  const stdinIsTTY = probe.stdinIsTTY ?? Boolean(process.stdin.isTTY);
  if (!stdoutIsTTY && !stdinIsTTY) return false;

  const platform = probe.platform ?? process.platform;
  if (platform === "darwin" || platform === "win32") return true;
  return Boolean(env.DISPLAY || env.WAYLAND_DISPLAY);
}

export function hasWorkingWhoami(): boolean {
  const cfg = readAuthConfig();
  return Boolean(cfg?.email && cfg?.sessionToken && cfg?.workspaceId);
}

export function firstRunIncompleteMessage(): string {
  return [
    "Not done. Sign-in is required before any managed call.",
    `  ${AUTH_LOGIN_COMMAND}`,
    "Headless or SSH? Open the browser URL on another device, then confirm:",
    `  ${AUTH_WHOAMI_COMMAND}`,
    `First managed call after sign-in: ${FIRST_CALL_CLI}`,
  ].join("\n");
}

export function firstRunCompleteMessage(email?: string, summary?: string): string {
  const who = email ? ` Signed in as ${email}.` : "";
  const line = summary?.trim();
  return line ? `Done.${who}\n${line}` : `Done.${who}`;
}

export function firstRunExecuteFailedMessage(): string {
  return [
    "Not done. Sign-in worked, but the first execute did not succeed.",
    "NASA APOD via POST /v1/execute, then Frankfurter /latest.",
    `  ${AUTH_FIRST_CALL_COMMAND}`,
  ].join("\n");
}

export function printFirstRunIncomplete(): void {
  console.log("");
  console.log(firstRunIncompleteMessage());
  console.log("");
}

export function printFirstRunComplete(email?: string, summary?: string): void {
  console.log("");
  console.log(firstRunCompleteMessage(email, summary));
  console.log("");
}

export function printFirstRunExecuteFailed(): void {
  console.log("");
  console.log(firstRunExecuteFailedMessage());
  console.log("");
}

export interface CompleteFirstRunAuthOptions {
  /** When true, skip launching login (dry-run / already attempted). */
  skipLaunch?: boolean;
  launch?: (options?: { force?: boolean }) => Promise<{
    email?: string;
    firstCall?: FirstExecuteResult;
  } | null>;
  /** Injected for tests. Defaults to reading ~/.apiclaw.toml. */
  whoami?: () => boolean;
  /** Injected for tests. Defaults to NASA APOD then Frankfurter via /v1/execute. */
  firstExecute?: () => Promise<FirstExecuteResult>;
}

export interface CompleteFirstRunAuthResult {
  complete: boolean;
  launched: boolean;
  email?: string;
  firstCall?: FirstExecuteResult;
}

async function finishFirstRun(
  email: string | undefined,
  launched: boolean,
  firstExecute: () => Promise<FirstExecuteResult>,
  already?: FirstExecuteResult,
): Promise<CompleteFirstRunAuthResult> {
  const firstCall = already?.ok ? already : await firstExecute();
  if (firstCall.ok) {
    printFirstRunComplete(email, firstCall.summary);
    return { complete: true, launched, email, firstCall };
  }
  printFirstRunExecuteFailed();
  return { complete: false, launched, email, firstCall };
}

/**
 * After MCP/config install: launch login when a TTY/browser is available,
 * then refuse to claim Done until whoami works and the first execute returns 200.
 */
export async function completeFirstRunAuth(
  options: CompleteFirstRunAuthOptions = {},
): Promise<CompleteFirstRunAuthResult> {
  const whoami = options.whoami ?? hasWorkingWhoami;
  const firstExecute = options.firstExecute ?? (() => completeFirstExecute());
  if (whoami()) {
    return finishFirstRun(readAuthConfig()?.email, false, firstExecute);
  }

  let launched = false;
  if (!options.skipLaunch && canLaunchInteractiveAuth() && options.launch) {
    console.log("");
    console.log("Next step: sign in so a managed call can succeed.");
    console.log(`  ${AUTH_LOGIN_COMMAND}`);
    console.log("");
    launched = true;
    const result = await options.launch({});
    if (result?.email && whoami()) {
      return finishFirstRun(result.email, launched, firstExecute, result.firstCall);
    }
  }

  printFirstRunIncomplete();
  return { complete: false, launched };
}
