/**
 * APIClaw CLI auth — browser-loopback flow (Modal/gh/vercel pattern).
 *
 * `apiclaw auth login`
 *   1. Generate PKCE verifier + challenge, random state.
 *   2. Start ephemeral HTTP listener on an OS-assigned port.
 *   3. POST cliAuth:start to Convex → get {authId, browserUrl}.
 *   4. Open browserUrl in default browser (open / xdg-open / start).
 *   5. Stay in front of the human: poll whoami / the session file / cliAuth:poll,
 *      reprint the login URL every few seconds, and wait for /callback on
 *      loopback (max 5 min). Printing the URL is not success. Localhost is
 *      optional — whoami redeems a claimed authId from pending-login.
 *   6. Validate state, POST cliAuth:exchange with {code, codeVerifier} → session+key.
 *   7. Write ~/.apiclaw.toml, verify, then POST /v1/execute (provider nasa
 *      action apod, frankfurter /latest fallback). Print a one-line result, not Done.
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import ora from 'ora';
import chalk from 'chalk';
import { writeAuthConfig, readAuthConfig, clearAuthConfig, AUTH_CONFIG_PATH, type AuthConfig } from '../../auth-config.js';
import { getMachineFingerprint } from '../../session.js';
import { completeFirstExecute, type FirstExecuteResult } from '../../first-call.js';
import { firstRunExecuteFailedMessage, hasWorkingWhoami, unsignedExecuteMessage } from '../../first-run.js';
import {
  clearPendingLoginUrl,
  readPendingLogin,
} from '../../execute-auth.js';
import {
  CLI_AUTH_POLL_PATH,
  pkceChallengeFromVerifier,
  redeemPendingLogin,
  type CliAuthPollResult,
} from '../../cli-auth-redeem.js';
import {
  PENDING_LOGIN_LOOPBACK_PORT,
  ensurePendingLogin,
} from '../../pending-login-start.js';
import {
  LOGIN_SESSION_POLL_MS,
  LOGIN_URL_REPRINT_MS,
  LOGIN_WAIT_TIMEOUT_MS,
  isFreshLoginSession,
  loopbackCallbackSuccessHtml,
  waitUntilSessionOrCallback,
} from '../../login-wait.js';

const CONVEX_URL =
  process.env.APICLAW_CONVEX_URL ||
  'https://adventurous-avocet-799.convex.cloud';
const APP_URL = process.env.APICLAW_APP_URL || 'https://apiclaw.cloud';
const LOOPBACK_TIMEOUT_MS = LOGIN_WAIT_TIMEOUT_MS;
const PREFERRED_PORT = PENDING_LOGIN_LOOPBACK_PORT;

interface AuthLoginOptions {
  printMcpToken?: boolean;
  force?: boolean;
  noOpen?: boolean;
}

export type AuthLoginResult = AuthConfig & { firstCall?: FirstExecuteResult };

async function runAndPrintFirstCall(sessionToken: string): Promise<FirstExecuteResult> {
  const firstCall = await completeFirstExecute({ sessionToken });
  if (firstCall.ok && firstCall.summary) {
    console.log(firstCall.summary);
  } else if (firstCall.error === "not_signed_in") {
    console.log(unsignedExecuteMessage(firstCall.pendingLoginUrl));
  } else {
    console.log(firstRunExecuteFailedMessage());
  }
  return firstCall;
}

/**
 * Start a one-shot HTTP listener on a free port.
 * Resolves with the captured query params on first /callback hit.
 */
function startLoopbackListener(): Promise<{
  server: Server;
  port: number;
  result: Promise<{ code: string; state: string }>;
}> {
  return new Promise((resolveOuter, rejectOuter) => {
    let resolveResult: (v: { code: string; state: string }) => void;
    let rejectResult: (e: Error) => void;
    const result = new Promise<{ code: string; state: string }>((res, rej) => {
      resolveResult = res;
      rejectResult = rej;
    });

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url || '/', `http://127.0.0.1`);
      if (url.pathname !== '/callback') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      if (!code || !state) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing code or state');
        rejectResult(new Error('callback_missing_params'));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(loopbackCallbackSuccessHtml());
      resolveResult({ code, state });
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        // Retry on a free OS-assigned port
        server.listen(0, '127.0.0.1');
      } else {
        rejectOuter(err);
      }
    });

    server.listen(PREFERRED_PORT, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : PREFERRED_PORT;
      resolveOuter({ server, port, result });
    });
  });
}

async function convexMutation<T = unknown>(path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args }),
  });
  if (!res.ok) throw new Error(`convex ${path} ${res.status}`);
  const data = await res.json() as { status?: string; value?: T; errorMessage?: string };
  if (data.status === 'error') throw new Error(data.errorMessage || `convex ${path} error`);
  return (data.value ?? data) as T;
}

/**
 * Fire-and-forget funnel event. Never blocks the auth path on telemetry.
 * Uses the public funnel:recordEvent mutation (no auth required for these events).
 */
async function emitFailure(reason: string, fingerprint?: string): Promise<void> {
  try {
    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'funnel:recordEvent',
        args: {
          event: 'cli_browser_callback_failed',
          classification: 'human',
          fingerprint,
          props: { reason },
        },
      }),
    });
  } catch {
    // best-effort
  }
}

async function convexQuery<T = unknown>(path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args }),
  });
  if (!res.ok) throw new Error(`convex query ${path} ${res.status}`);
  const data = await res.json() as { status?: string; value?: T; errorMessage?: string };
  if (data.status === 'error') throw new Error(data.errorMessage || `convex query ${path} error`);
  return (data.value ?? data) as T;
}

async function pollCliAuthClaim(authId: string, challenge: string): Promise<CliAuthPollResult | null> {
  try {
    return await convexQuery<CliAuthPollResult>(CLI_AUTH_POLL_PATH, { authId, challenge });
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForClaimedCode(
  authId: string,
  challenge: string,
  expectedState: string,
  shouldStop: () => boolean,
): Promise<{ code: string; state: string }> {
  while (!shouldStop()) {
    const polled = await pollCliAuthClaim(authId, challenge);
    if (polled?.status === 'claimed' && polled.code && polled.state === expectedState) {
      return { code: polled.code, state: polled.state };
    }
    await sleep(LOGIN_SESSION_POLL_MS);
  }
  return new Promise(() => {});
}

async function redeemPendingIfClaimed(): Promise<AuthConfig | null> {
  return redeemPendingLogin({
    pending: readPendingLogin(),
    poll: pollCliAuthClaim,
    exchange: (args) => convexAction<ExchangeResult>('cliAuth:exchange', args),
    write: writeAuthConfig,
    clearPending: clearPendingLoginUrl,
  });
}

async function convexAction<T = unknown>(path: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${CONVEX_URL}/api/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args }),
  });
  if (!res.ok) throw new Error(`convex action ${path} ${res.status}`);
  const data = await res.json() as { status?: string; value?: T; errorMessage?: string };
  if (data.status === 'error') throw new Error(data.errorMessage || `convex action ${path} error`);
  return (data.value ?? data) as T;
}

interface ExchangeResult {
  success: boolean;
  error?: string;
  sessionToken?: string;
  workspaceId?: string;
  email?: string;
  apiKey?: string;
  tier?: string;
  isNew?: boolean;
}

interface LogoutResult {
  success: boolean;
  error?: 'invalid_session' | 'api_key_mismatch';
  revokedApiKey?: boolean;
}

export async function authLoginCommand(options: AuthLoginOptions = {}): Promise<AuthLoginResult | null> {
  const existing = readAuthConfig();
  // Already signed in?
  if (!options.force) {
    if (existing) {
      console.log(chalk.green(`\n✓ Already signed in as ${chalk.bold(existing.email)}\n`));
      console.log(
        chalk.dim(`  Use ${chalk.white('apiclaw auth login --force')} to switch accounts, or ${chalk.white('apiclaw auth logout')} to clear.\n`)
      );
      const firstCall = await runAndPrintFirstCall(existing.sessionToken);
      return { ...existing, firstCall };
    }
  }

  console.log('');
  console.log(chalk.bold('  🦞 APIClaw — agent-native auth'));
  console.log(chalk.dim('  Confirm in the browser to finish sign-in.\n'));

  if (options.force) {
    clearPendingLoginUrl();
  }

  // Start loopback FIRST so a new mint can register that port. Reuse of an
  // already-minted authId keeps the original port; localhost refused is OK.
  const loop = await startLoopbackListener();
  const fingerprint = getMachineFingerprint();
  const startSpinner = ora('Registering session...').start();
  const pending = await ensurePendingLogin({
    openBrowser: !options.noOpen,
    port: loop.port,
    fingerprint,
    appUrl: APP_URL,
  });
  if (!pending) {
    startSpinner.fail('Failed to register session');
    loop.server.close();
    return null;
  }
  startSpinner.succeed(pending.reused ? 'Session reused' : 'Session registered');

  const challenge = pkceChallengeFromVerifier(pending.codeVerifier);
  const state = pending.state;
  const verifier = pending.codeVerifier;

  console.log(chalk.cyan(pending.browserUrl));
  console.log(chalk.bold('STOP. Show the human the login URL above. Keep this command running.'));
  console.log(chalk.dim('Finish Google or email on that URL — that Authorizes (one action).'));
  console.log(chalk.dim('If you are already signed in, click Authorize.'));
  console.log(chalk.dim('Printing the URL is not success. Waiting for Clerk to write session_token.\n'));

  const previousToken = options.force ? existing?.sessionToken : undefined;
  let stopClaimPoll = false;
  const wait = await waitUntilSessionOrCallback({
    loginUrl: pending.browserUrl,
    timeoutMs: LOOPBACK_TIMEOUT_MS,
    reprintMs: LOGIN_URL_REPRINT_MS,
    reprintImmediately: false,
    hasSession: () => hasWorkingWhoami() && isFreshLoginSession(readAuthConfig(), previousToken),
    callback: Promise.race([
      loop.result,
      waitForClaimedCode(pending.authId, challenge, state, () => stopClaimPoll),
    ]),
    onReprint: (lines) => {
      console.log('');
      for (const line of lines) {
        console.log(line.includes('https://') ? chalk.cyan(line) : line);
      }
      console.log('');
    },
  });
  stopClaimPoll = true;

  if (!wait.ok) {
    loop.server.close();
    await emitFailure(wait.reason === 'timeout' ? 'timeout' : 'callback_error', fingerprint);
    if (wait.reason === 'timeout') {
      console.log(chalk.red('  Timed out after 5 minutes. Clerk did not write session_token.'));
    } else {
      console.log(chalk.red(`  Callback failed: ${wait.error?.message ?? wait.reason}`));
    }
    return null;
  }

  if (wait.source === 'session') {
    loop.server.close();
    const live = readAuthConfig();
    if (!live?.sessionToken) {
      return null;
    }
    clearPendingLoginUrl();
    console.log(chalk.bold(`  ✅ Authenticated as ${chalk.green(live.email)}`));
    console.log(chalk.dim(`     Config written to ${AUTH_CONFIG_PATH}`));
    console.log(chalk.dim(`     Execute reads session_token from that file as X-APIClaw-Session.`));
    const firstCall = await runAndPrintFirstCall(live.sessionToken);
    console.log('');
    return { ...live, firstCall };
  }

  const callback = wait.callback;
  loop.server.close();
  if (!callback) {
    await emitFailure('callback_error', fingerprint);
    return null;
  }

  if (callback.state !== state) {
    console.log(chalk.red('  State mismatch — possible CSRF, aborting'));
    await emitFailure('state_mismatch', fingerprint);
    return null;
  }
  console.log(chalk.green('  Browser sign-in received'));

  // Exchange code+verifier for session+key
  const exchSpinner = ora('Exchanging credentials...').start();
  let result: ExchangeResult;
  try {
    result = await convexAction<ExchangeResult>('cliAuth:exchange', {
      code: callback.code,
      codeVerifier: verifier,
      fingerprint,
      ...(options.force && existing
        ? {
            previousSessionToken: existing.sessionToken,
            ...(existing.apiKey ? { previousApiKey: existing.apiKey } : {}),
          }
        : {}),
    });
  } catch (err) {
    exchSpinner.fail(`Exchange failed: ${(err as Error).message}`);
    return null;
  }
  if (!result.success || !result.sessionToken || !result.workspaceId || !result.email) {
    exchSpinner.fail(`Exchange rejected: ${result.error || 'unknown'}`);
    return null;
  }
  exchSpinner.succeed('Credentials exchanged');

  // Write config
  const cfg: AuthConfig = {
    workspaceId: result.workspaceId,
    email: result.email,
    sessionToken: result.sessionToken,
    apiKey: result.apiKey,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  };
  writeAuthConfig(cfg);
  clearPendingLoginUrl();

  // Success banner + next-step hints (CLI-first onboarding, not "go to workspace")
  console.log('');
  if (result.isNew) {
    console.log(chalk.bold(`  ✅ Workspace created for ${chalk.green(result.email)}`));
    console.log(chalk.dim(`     Free tier active. Continue beyond it at API cost + 15%. Tier: ${result.tier ?? 'free'}.`));
  } else {
    console.log(chalk.bold(`  ✅ Authenticated as ${chalk.green(result.email)}`));
    console.log(chalk.dim(`     Tier: ${result.tier ?? 'free'}`));
  }
  console.log(chalk.dim(`     Config written to ${AUTH_CONFIG_PATH}`));
  console.log(chalk.dim(`     Execute reads session_token from that file as X-APIClaw-Session.`));

  const firstCall = await runAndPrintFirstCall(cfg.sessionToken);
  if (result.apiKey) {
    console.log('');
    console.log(chalk.dim(`  HTTP/CI door (not first execute): api_key is also in ${AUTH_CONFIG_PATH}.`));
    console.log(chalk.dim('     Export it as APICLAW_API_KEY from the file. Do not paste it into chat.'));
  }
  console.log('');

  return { ...cfg, firstCall };
}

export async function authFirstCallCommand(): Promise<boolean> {
  const cfg = readAuthConfig();
  if (!cfg) {
    console.log(unsignedExecuteMessage());
    console.log('');
    return false;
  }
  const firstCall = await runAndPrintFirstCall(cfg.sessionToken);
  return firstCall.ok;
}

export async function authLogoutCommand(): Promise<void> {
  const existing = readAuthConfig();
  if (!existing) {
    console.log(chalk.dim('  Not signed in.\n'));
    return;
  }

  const spinner = ora('Revoking APIClaw credentials...').start();
  let result: LogoutResult;
  try {
    result = await convexMutation<LogoutResult>('cliAuth:logout', {
      sessionToken: existing.sessionToken,
      ...(existing.apiKey ? { apiKey: existing.apiKey } : {}),
    });
  } catch (error) {
    spinner.fail('Could not revoke APIClaw credentials');
    console.error(chalk.yellow(`  Local credentials were preserved so logout can be retried.`));
    throw error;
  }

  if (!result.success) {
    spinner.fail(`Could not revoke APIClaw credentials (${result.error || 'unknown'})`);
    console.error(chalk.yellow('  Local credentials were preserved so logout can be retried.'));
    throw new Error(`APIClaw logout rejected: ${result.error || 'unknown'}`);
  }

  clearAuthConfig();
  clearPendingLoginUrl();
  spinner.succeed('Remote and local credentials revoked');
  console.log(chalk.green(`\n✓ Signed out (${existing.email})\n`));
}

export async function authWhoamiCommand(): Promise<boolean> {
  let cfg = readAuthConfig();
  if (!cfg) {
    cfg = await redeemPendingIfClaimed();
  }
  if (!cfg) {
    console.log(unsignedExecuteMessage());
    console.log('');
    return false;
  }
  try {
    await convexMutation('workspaces:touchSession', { sessionToken: cfg.sessionToken });
  } catch {
    // Never block whoami on first-execute scheduling.
  }
  console.log('');
  console.log(`  ${chalk.bold('Email:')}       ${cfg.email}`);
  console.log(`  ${chalk.bold('Workspace:')}   ${cfg.workspaceId}`);
  if (cfg.apiKey) {
    console.log(`  ${chalk.bold('API key:')}     sk-claw-...${cfg.apiKey.slice(-4)}`);
  }
  console.log(`  ${chalk.bold('Config:')}      ${AUTH_CONFIG_PATH}`);
  console.log('');
  return true;
}
