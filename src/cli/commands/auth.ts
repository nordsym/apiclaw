/**
 * APIClaw CLI auth — browser-loopback flow (Modal/gh/vercel pattern).
 *
 * `apiclaw auth login`
 *   1. Generate PKCE verifier + challenge, random state.
 *   2. Start ephemeral HTTP listener on an OS-assigned port.
 *   3. POST cliAuth:start to Convex → get {authId, browserUrl}.
 *   4. Open browserUrl in default browser (open / xdg-open / start).
 *   5. Wait for /callback?code=X&state=Y on loopback (max 5 min).
 *   6. Validate state, POST cliAuth:exchange with {code, codeVerifier} → session+key.
 *   7. Write ~/.apiclaw.toml, verify, print success + next-step hints.
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import * as os from 'node:os';
import ora from 'ora';
import chalk from 'chalk';
import { writeAuthConfig, readAuthConfig, clearAuthConfig, AUTH_CONFIG_PATH, type AuthConfig } from '../../auth-config.js';
import { getMachineFingerprint } from '../../session.js';

const CONVEX_URL =
  process.env.APICLAW_CONVEX_URL ||
  'https://adventurous-avocet-799.convex.cloud';
const APP_URL = process.env.APICLAW_APP_URL || 'https://apiclaw.cloud';
const LOOPBACK_TIMEOUT_MS = 5 * 60 * 1000; // 5 min
const PREFERRED_PORT = 41789;

interface AuthLoginOptions {
  printMcpToken?: boolean;
  force?: boolean;
  noOpen?: boolean;
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function generatePkcePair(): { verifier: string; challenge: string } {
  const verifier = base64url(randomBytes(48));
  const challenge = base64url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

function generateState(): string {
  return base64url(randomBytes(24));
}

/**
 * Open URL in the user's default browser.
 * Returns true if the OS command was spawned, false if no opener is available.
 */
function openBrowser(url: string): boolean {
  const platform = process.platform;
  let cmd: string;
  let args: string[];
  if (platform === 'darwin') {
    cmd = 'open';
    args = [url];
  } else if (platform === 'win32') {
    cmd = 'cmd';
    args = ['/c', 'start', '', url];
  } else {
    cmd = 'xdg-open';
    args = [url];
  }
  try {
    const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
    child.unref();
    return true;
  } catch {
    return false;
  }
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
      res.end(`<!doctype html><html><head><meta charset="utf-8"><title>APIClaw — Authenticated</title><style>
        body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0a0a0a;color:#fafafa;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}
        .box{max-width:420px;padding:32px}
        .lobster{font-size:48px;margin-bottom:16px}
        h1{font-weight:600;font-size:20px;margin:0 0 8px}
        p{color:#a3a3a3;font-size:14px;line-height:1.5;margin:8px 0}
        code{background:#1a1a1a;padding:2px 6px;border-radius:4px;color:#ef4444;font-size:13px}
      </style></head><body><div class="box">
        <div class="lobster">🦞</div>
        <h1>Authenticated</h1>
        <p>You can close this tab and return to your terminal.</p>
      </div></body></html>`);
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

interface StartResult {
  authId: string;
  browserUrl: string;
  expiresAt: number;
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

export async function authLoginCommand(options: AuthLoginOptions = {}): Promise<AuthConfig | null> {
  // Already signed in?
  if (!options.force) {
    const existing = readAuthConfig();
    if (existing) {
      console.log(chalk.green(`\n✓ Already signed in as ${chalk.bold(existing.email)}\n`));
      console.log(
        chalk.dim(`  Use ${chalk.white('apiclaw auth login --force')} to switch accounts, or ${chalk.white('apiclaw auth logout')} to clear.\n`)
      );
      return existing;
    }
  }

  console.log('');
  console.log(chalk.bold('  🦞 APIClaw — agent-native auth'));
  console.log(chalk.dim('  Opening browser for one-tap sign-in...\n'));

  // PKCE + state + fingerprint
  const { verifier, challenge } = generatePkcePair();
  const state = generateState();
  const fingerprint = getMachineFingerprint();

  // Start loopback FIRST so the port is known when we register with Convex
  const loop = await startLoopbackListener();

  let startResult: StartResult;
  const startSpinner = ora('Registering session...').start();
  try {
    startResult = await convexMutation<StartResult>('cliAuth:start', {
      state,
      challenge,
      port: loop.port,
      fingerprint,
      appUrl: APP_URL,
    });
    startSpinner.succeed('Session registered');
  } catch (err) {
    startSpinner.fail(`Failed to register session: ${(err as Error).message}`);
    loop.server.close();
    return null;
  }

  // Open browser (or print URL if --no-open / spawn fails)
  if (!options.noOpen) {
    const opened = openBrowser(startResult.browserUrl);
    if (!opened) {
      console.log(chalk.yellow('  Could not open your browser automatically.'));
    }
  }
  console.log(chalk.dim('  Visit this URL if your browser did not open:'));
  console.log(`  ${chalk.cyan(startResult.browserUrl)}\n`);

  // Wait for callback
  const waitSpinner = ora('Waiting for browser sign-in...').start();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    waitSpinner.fail('Timed out after 5 minutes');
    loop.server.close();
  }, LOOPBACK_TIMEOUT_MS);

  let callback: { code: string; state: string };
  try {
    callback = await loop.result;
  } catch (err) {
    clearTimeout(timeout);
    waitSpinner.fail(`Callback failed: ${(err as Error).message}`);
    loop.server.close();
    await emitFailure(timedOut ? 'timeout' : 'callback_error', fingerprint);
    return null;
  }
  clearTimeout(timeout);
  loop.server.close();

  if (callback.state !== state) {
    waitSpinner.fail('State mismatch — possible CSRF, aborting');
    await emitFailure('state_mismatch', fingerprint);
    return null;
  }
  waitSpinner.succeed('Browser sign-in received');

  // Exchange code+verifier for session+key
  const exchSpinner = ora('Exchanging credentials...').start();
  let result: ExchangeResult;
  try {
    result = await convexAction<ExchangeResult>('cliAuth:exchange', {
      code: callback.code,
      codeVerifier: verifier,
      fingerprint,
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

  // Success banner + next-step hints (CLI-first onboarding, not "go to workspace")
  console.log('');
  if (result.isNew) {
    console.log(chalk.bold(`  ✅ Workspace created for ${chalk.green(result.email)}`));
    console.log(chalk.dim(`     Free tier: 50 calls/month. Tier: ${result.tier ?? 'free'}.`));
  } else {
    console.log(chalk.bold(`  ✅ Authenticated as ${chalk.green(result.email)}`));
    console.log(chalk.dim(`     Tier: ${result.tier ?? 'free'}`));
  }
  console.log(chalk.dim(`     Config written to ${AUTH_CONFIG_PATH}`));

  console.log('');
  console.log(chalk.bold('  Try it:'));
  console.log(chalk.dim('     apiclaw discover "currency conversion"'));
  console.log(chalk.dim('     apiclaw call apilayer/fixer-latest --params \'{"base":"USD","symbols":"EUR"}\''));
  console.log(chalk.dim('     apiclaw call openrouter/auto --body \'{"prompt":"hello"}\''));
  if (result.apiKey) {
    console.log('');
    console.log(chalk.bold('  For HTTP runtimes:'));
    console.log(chalk.dim(`     export APICLAW_API_KEY=${result.apiKey}`));
  }
  console.log('');

  return cfg;
}

export async function authLogoutCommand(): Promise<void> {
  const existing = readAuthConfig();
  if (!existing) {
    console.log(chalk.dim('  Not signed in.\n'));
    return;
  }
  clearAuthConfig();
  console.log(chalk.green(`\n✓ Signed out (${existing.email})\n`));
}

export async function authWhoamiCommand(): Promise<void> {
  const cfg = readAuthConfig();
  if (!cfg) {
    console.log(chalk.dim('  Not signed in. Run: apiclaw auth login\n'));
    return;
  }
  console.log('');
  console.log(`  ${chalk.bold('Email:')}       ${cfg.email}`);
  console.log(`  ${chalk.bold('Workspace:')}   ${cfg.workspaceId}`);
  if (cfg.apiKey) {
    console.log(`  ${chalk.bold('API key:')}     sk-claw-...${cfg.apiKey.slice(-4)}`);
  }
  console.log(`  ${chalk.bold('Config:')}      ${AUTH_CONFIG_PATH}`);
  console.log('');
}
