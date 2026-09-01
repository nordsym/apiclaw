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
import {
  ensurePendingLogin,
  type CliAuthStartArgs,
  type CliAuthStartResult,
  type OpenBrowserSpawn,
  type StartedPendingLogin,
} from "./pending-login-start.js";

export { AUTH_FIRST_CALL_COMMAND } from "./first-call.js";

/** User-facing recovery / next-step command. Never pin an unpublished version. */
export const AUTH_LOGIN_COMMAND = "npx @nordsym/apiclaw auth login";

/** Confirm the workspace file is live after login. */
export const AUTH_WHOAMI_COMMAND = "npx @nordsym/apiclaw auth whoami";

/**
 * Last-resort clickable auth URL when Convex mint fails.
 * Prefer a live `/auth/cli?authId=` URL. Never send agents to bare /sign-in.
 */
export const FALLBACK_LOGIN_URL = "https://apiclaw.cloud/auth/cli";

/** Absolute https auth URL the human can click. Never return empty or a command. */
export function clickableLoginUrl(pending?: string | null): string {
  if (
    typeof pending === "string" &&
    pending.startsWith("https://") &&
    pending.includes("/auth/")
  ) {
    return pending;
  }
  return FALLBACK_LOGIN_URL;
}

/**
 * First managed call after sign-in. NASA APOD is the research rail
 * (zero-cost, no card). Frankfurter is the last-resort free fallback so
 * first_call still lands. Brave / Serper / Firecrawl need a card — not
 * this path. Never lead with ElevenLabs or Replicate.
 */
export const FIRST_CALL_PROMPT =
  'Not ready until whoami prints an email. Then fetch today\'s NASA Astronomy Picture of the Day: call_api with provider "nasa", action "apod", params {}. If NASA is not 200, call_api with provider "frankfurter", action "latest", params { path: "/latest" }. Do not lead with billed research (Brave, Serper, Firecrawl).';

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

/**
 * Open the minted Clerk URL when this machine can show a browser.
 * MCP on Cursor / Claude Desktop has a GUI and no TTY — do not require one.
 * Headless CI still mints login_url; it must not spawn open/start/xdg-open.
 */
export function canOpenAuthBrowser(probe: LaunchAuthProbe = {}): boolean {
  const env = probe.env ?? process.env;
  if (env.CI === "true" || env.CI === "1") return false;
  if (env.GITHUB_ACTIONS === "true" || env.GITHUB_ACTIONS === "1") return false;
  if (env.APICLAW_SKIP_AUTH === "1" || env.APICLAW_SKIP_AUTH === "true") return false;

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
  const url = clickableLoginUrl(
    pendingLoginUrl !== undefined ? pendingLoginUrl : readPendingLoginUrl(),
  );
  return [
    "Not ready. whoami has no session. Do not execute.",
    "  Open this login URL:",
    `  ${url}`,
    `  Or run: ${AUTH_LOGIN_COMMAND}`,
    "Finish Google or email on that URL — that Authorizes (one action).",
    "If you are already signed in, click Authorize on apiclaw.cloud.",
    "Connection refused on localhost is OK. Loop whoami — it redeems Authorize.",
    "Then confirm with:",
    `  ${AUTH_WHOAMI_COMMAND}`,
    "Do not declare ready. Do not POST /v1/execute until whoami prints an email.",
    "Do not send an empty X-APIClaw-Session.",
  ].join("\n");
}

export type AuthRequiredToolResult = {
  content: { type: "text"; text: string }[];
  isError: true;
};

/**
 * Human/agent-visible auth text. The https URL sits on its own line so
 * chat clients make it clickable. JSON follows for structured agents.
 * Never bury the URL inside JSON-only text.
 */
export function formatAuthRequiredVisibleText(payload: Record<string, unknown>): string {
  const url = clickableLoginUrl(
    typeof payload.login_url === "string" ? payload.login_url : null,
  );
  return [
    "Open this login URL:",
    url,
    "",
    "Sign-in is not done. Open the link, then retry. Do not execute until whoami prints an email.",
    "",
    JSON.stringify({ ...payload, login_url: url }, null, 2),
  ].join("\n");
}

/** Parse the trailing JSON object from formatAuthRequiredVisibleText. */
export function extractAuthRequiredPayload(text: string): Record<string, unknown> {
  const start = text.indexOf("\n{");
  return JSON.parse(start === -1 ? text : text.slice(start + 1)) as Record<string, unknown>;
}

/** MCP/CLI host-visible error. isError must be true so agents cannot treat this as success. */
export function authRequiredToolResult(
  payload: Record<string, unknown>,
): AuthRequiredToolResult {
  return {
    content: [{ type: "text", text: formatAuthRequiredVisibleText(payload) }],
    isError: true,
  };
}

/** Shared MCP / CLI payload when execute is refused for no session. */
export function agentAuthRequiredPayload(
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const extraUrl = typeof extra.login_url === "string" ? extra.login_url : undefined;
  const url = clickableLoginUrl(extraUrl || readPendingLoginUrl());
  const { login_url: _ignoredLoginUrl, status: extraStatus, ...rest } = extra;
  const status =
    typeof extraStatus === "string" && extraStatus !== "success"
      ? extraStatus
      : "auth_required";
  return {
    login_url: url,
    status,
    action: "agent_auth_required",
    error: "Not ready. whoami has no session. Do not execute.",
    command: AUTH_LOGIN_COMMAND,
    confirm_command: AUTH_WHOAMI_COMMAND,
    after_signin:
      "Loop `npx @nordsym/apiclaw auth whoami` until it prints an email. whoami redeems Authorize even if auth login was killed or localhost failed. Only then retry this tool. Do not POST /v1/execute with an empty X-APIClaw-Session.",
    first_call_prompt: FIRST_CALL_PROMPT,
    ...rest,
    instruction:
      `Show the human this login URL on its own line: ${url}. Finish Google or email on that URL — that Authorizes (one action). If already signed in, click Authorize. Printing the URL is not success. Do not declare ready. Do not retry execute.`,
    what_happens:
      "A live /auth/cli?authId= URL is minted even without a TTY. A new Clerk finishes Authorize in that one action. Already signed in: click Authorize. Loop whoami until it prints an email. Clerk alone does not write session_token.",
    fallback_for_headless: `Open ${url} on another device. Then ${AUTH_WHOAMI_COMMAND}.`,
  };
}

export type AgentAuthMintOptions = {
  openBrowser?: boolean;
  ensurePending?: () => Promise<StartedPendingLogin | { browserUrl: string } | null>;
  /** Injected for tests. Defaults to canOpenAuthBrowser(options). */
  canOpen?: (probe?: LaunchAuthProbe) => boolean;
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  stdinIsTTY?: boolean;
  stdoutIsTTY?: boolean;
  start?: (args: CliAuthStartArgs) => Promise<CliAuthStartResult>;
  spawn?: OpenBrowserSpawn;
  now?: number;
  fingerprint?: string;
};

/** Mint or reuse pending login, then build the host-visible auth payload. */
export async function agentAuthRequiredPayloadAfterMint(
  extra: Record<string, unknown> = {},
  options: AgentAuthMintOptions = {},
): Promise<Record<string, unknown>> {
  const openBrowser =
    options.openBrowser ??
    (options.canOpen ?? canOpenAuthBrowser)({
      env: options.env,
      platform: options.platform,
      stdinIsTTY: options.stdinIsTTY,
      stdoutIsTTY: options.stdoutIsTTY,
    });
  const pending = await (options.ensurePending ?? (() => ensurePendingLogin({
    openBrowser,
    start: options.start,
    spawn: options.spawn,
    platform: options.platform,
    now: options.now,
    fingerprint: options.fingerprint,
  })))();
  return agentAuthRequiredPayload({
    ...extra,
    login_url: pending?.browserUrl ?? readPendingLoginUrl(),
  });
}

/** Unsigned first_run / execute: mint, then return an isError tool result. */
export async function unsignedFirstRunToolResult(
  extra: Record<string, unknown> = {},
  options: AgentAuthMintOptions = {},
): Promise<AuthRequiredToolResult> {
  return authRequiredToolResult(await agentAuthRequiredPayloadAfterMint(extra, options));
}

export function firstRunIncompleteMessage(pendingLoginUrl?: string | null): string {
  const url = clickableLoginUrl(
    pendingLoginUrl !== undefined ? pendingLoginUrl : readPendingLoginUrl(),
  );
  return [
    "Not done. Sign-in is required before any managed call. Do not declare ready.",
    "  Open this login URL:",
    `  ${url}`,
    `  Or run: ${AUTH_LOGIN_COMMAND}`,
    "Finish Google or email on that URL — that Authorizes (one action).",
    "If you are already signed in, click Authorize on apiclaw.cloud.",
    "Connection refused on localhost is OK. Loop whoami — it redeems Authorize.",
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
    "NASA APOD via POST /v1/execute, then Frankfurter latest.",
    `  ${AUTH_FIRST_CALL_COMMAND}`,
  ].join("\n");
}

export function printFirstRunIncomplete(pendingLoginUrl?: string | null): void {
  console.log("");
  console.log(firstRunIncompleteMessage(pendingLoginUrl));
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
  /** Injected for tests. Defaults to NASA APOD then Frankfurter. */
  firstExecute?: () => Promise<FirstExecuteResult>;
  /**
   * Mint or reuse pending login. Defaults to ensurePendingLogin.
   * Must run even when there is no TTY — opening the browser is optional.
   */
  ensurePending?: () => Promise<StartedPendingLogin | { browserUrl: string } | null>;
  /** Injected for tests. Defaults to canLaunchInteractiveAuth(). */
  canLaunch?: () => boolean;
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
 * After MCP/config install: mint a pending /auth/cli?authId= URL even
 * without a TTY, optionally wait on interactive login, then refuse Done
 * until whoami works and the first execute returns 200.
 */
export async function completeFirstRunAuth(
  options: CompleteFirstRunAuthOptions = {},
): Promise<CompleteFirstRunAuthResult> {
  const whoami = options.whoami ?? hasWorkingWhoami;
  const firstExecute = options.firstExecute ?? (() => completeFirstExecute());
  const canLaunch = options.canLaunch ?? canLaunchInteractiveAuth;
  if (whoami()) {
    return finishFirstRun(readAuthConfig()?.email, false, firstExecute);
  }

  let pendingUrl: string | null = null;
  if (!options.skipLaunch) {
    const minted = await (options.ensurePending ?? (() => ensurePendingLogin()))();
    pendingUrl = minted?.browserUrl ?? readPendingLoginUrl();
  }

  let launched = false;
  if (!options.skipLaunch && canLaunch() && options.launch) {
    console.log("");
    console.log("Next step: sign in so a managed call can succeed.");
    if (pendingUrl) {
      console.log(`  Open this login URL: ${pendingUrl}`);
    }
    console.log(`  ${AUTH_LOGIN_COMMAND}`);
    console.log("");
    launched = true;
    const result = await options.launch({});
    if (result?.email && whoami()) {
      return finishFirstRun(result.email, launched, firstExecute, result.firstCall);
    }
  }

  printFirstRunIncomplete(pendingUrl);
  return { complete: false, launched };
}
