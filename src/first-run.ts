/**
 * First-run canon — install is not Done until whoami works AND the first
 * POST /v1/execute returns 200. Shared by mcp-install, install.sh / install.ps1,
 * no_session recovery, and the first managed-call prompt. Do not invent a
 * second login command or a dead first-wow rail here.
 */

import { readAuthConfig } from "./auth-config.js";
import { readPendingLoginUrl } from "./execute-auth.js";
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
 * today: NASA APOD or Brave search. Never lead with FX, ElevenLabs, or Replicate.
 */
export const FIRST_CALL_PROMPT =
  'Not ready until whoami prints an email. Then fetch today\'s NASA Astronomy Picture of the Day: call_api with provider "nasa", action "apod", params {}. If NASA is not 200, call_api with provider "brave_search", action "search", params { query: "AI agent infrastructure news" }. Do not lead with FX.';

export const FIRST_CALL_CLI =
  "npx @nordsym/apiclaw call nasa/apod --params '{}' --idempotency-key \"apiclaw-first-nasa-$(date +%s)\"";

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

/**
 * Printed by CLI call / whoami / first-call when session_token is missing.
 * Prefer the pending Clerk URL from the in-flight `auth login` so the human
 * can finish the already-started browser flow.
 */
export function unsignedExecuteMessage(pendingLoginUrl?: string | null): string {
  const url = pendingLoginUrl !== undefined ? pendingLoginUrl : readPendingLoginUrl();
  return [
    "Not ready. whoami has no session. Do not execute.",
    url ? `  Open this login URL: ${url}` : `  ${AUTH_LOGIN_COMMAND}`,
    ...(url ? [`  Or run: ${AUTH_LOGIN_COMMAND}`] : []),
    "Keep login in the foreground. After Clerk, click Authorize on apiclaw.cloud.",
    "Then confirm with:",
    `  ${AUTH_WHOAMI_COMMAND}`,
    "Do not declare ready. Do not POST /v1/execute until whoami prints an email.",
    "Do not send an empty X-APIClaw-Session.",
  ].join("\n");
}

/** Shared MCP / CLI payload when execute is refused for no session. */
export function agentAuthRequiredPayload(
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    status: "auth_required",
    action: "agent_auth_required",
    error: "Not ready. whoami has no session. Do not execute.",
    instruction:
      "Show the human the login URL. Keep auth login in the foreground. After Clerk, they must click Authorize on apiclaw.cloud. Printing the URL is not success. Do not declare ready. Do not retry execute.",
    command: AUTH_LOGIN_COMMAND,
    confirm_command: AUTH_WHOAMI_COMMAND,
    what_happens:
      "Opens the browser. User signs in with Clerk, then must click Authorize. Login reprints the URL until session_token exists. Clerk sign-in alone does not write the session.",
    after_signin:
      "Loop `npx @nordsym/apiclaw auth whoami` until it prints an email. Only then retry this tool. Do not POST /v1/execute with an empty X-APIClaw-Session.",
    fallback_for_headless:
      `${AUTH_LOGIN_COMMAND} (open the printed URL on another device). Then ${AUTH_WHOAMI_COMMAND}.`,
    first_call_prompt: FIRST_CALL_PROMPT,
    ...extra,
  };
}

export function firstRunIncompleteMessage(): string {
  const pending = readPendingLoginUrl();
  return [
    "Not done. Sign-in is required before any managed call. Do not declare ready.",
    `  ${AUTH_LOGIN_COMMAND}`,
    ...(pending ? [`  Open this login URL and finish Clerk, then click Authorize:\n  ${pending}`] : []),
    "After Clerk, click Authorize on apiclaw.cloud or the terminal stays unsigned.",
    "Headless or SSH? Open the browser URL on another device, then confirm:",
    `  ${AUTH_WHOAMI_COMMAND}`,
    "Do not POST /v1/execute until whoami prints an email. Do not send an empty X-APIClaw-Session.",
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
    "NASA APOD via POST /v1/execute, then Brave search.",
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
  /** Injected for tests. Defaults to NASA APOD then the first-execute fallback. */
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
