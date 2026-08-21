/**
 * First-run canon — install is not Done until whoami works.
 *
 * Shared by mcp-install, install.sh / install.ps1 (via the same commands),
 * no_session recovery, and the first managed-call prompt. Do not invent a
 * second login command or a dead first-wow rail here.
 */

import { readAuthConfig } from "./auth-config.js";

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

export function firstRunCompleteMessage(email?: string): string {
  const who = email ? ` Signed in as ${email}.` : "";
  return [
    `Done.${who} A managed call can succeed now.`,
    `First call: ${FIRST_CALL_CLI}`,
    `Or paste into your agent: ${FIRST_CALL_PROMPT}`,
  ].join("\n");
}

export function printFirstRunIncomplete(): void {
  console.log("");
  console.log(firstRunIncompleteMessage());
  console.log("");
}

export function printFirstRunComplete(email?: string): void {
  console.log("");
  console.log(firstRunCompleteMessage(email));
  console.log("");
}

export interface CompleteFirstRunAuthOptions {
  /** When true, skip launching login (dry-run / already attempted). */
  skipLaunch?: boolean;
  launch?: (options?: { force?: boolean }) => Promise<{ email?: string } | null>;
  /** Injected for tests. Defaults to reading ~/.apiclaw.toml. */
  whoami?: () => boolean;
}

export interface CompleteFirstRunAuthResult {
  complete: boolean;
  launched: boolean;
  email?: string;
}

/**
 * After MCP/config install: launch login when a TTY/browser is available,
 * then refuse to claim Done until whoami works.
 */
export async function completeFirstRunAuth(
  options: CompleteFirstRunAuthOptions = {},
): Promise<CompleteFirstRunAuthResult> {
  const whoami = options.whoami ?? hasWorkingWhoami;
  if (whoami()) {
    const email = readAuthConfig()?.email;
    printFirstRunComplete(email);
    return { complete: true, launched: false, email };
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
      printFirstRunComplete(result.email);
      return { complete: true, launched, email: result.email };
    }
  }

  printFirstRunIncomplete();
  return { complete: false, launched };
}
