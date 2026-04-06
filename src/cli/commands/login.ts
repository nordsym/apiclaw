/**
 * APIClaw CLI Login
 * In-terminal email signup/login via magic link.
 * Zero browser required.
 */

import { input } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { writeSession, readSession, getMachineFingerprint } from '../../session.js';

const CONVEX_URL = 'https://adventurous-avocet-799.convex.cloud';
const APICLAW_URL = 'https://apiclaw.cloud';
const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 15 * 60 * 1000; // 15 min (magic link TTL)

export interface LoginOptions {
  email?: string;
  force?: boolean;
}

/**
 * Request a magic link via the CLI-specific APIClaw endpoint.
 * Returns the token directly so we can poll for verification.
 */
async function requestMagicLink(email: string): Promise<string> {
  const fingerprint = getMachineFingerprint();

  const res = await fetch(`${APICLAW_URL}/api/workspace-auth/cli-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.toLowerCase().trim(), fingerprint }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `Failed to send magic link (${res.status})`);
  }

  const data = await res.json().catch(() => ({} as Record<string, unknown>));
  const token = (data as Record<string, unknown>)?.token as string | undefined;

  if (!token) {
    throw new Error('No token returned. Try again.');
  }

  return token;
}

/**
 * Poll Convex until the magic link is clicked or expired
 */
async function pollForVerification(token: string): Promise<{
  sessionToken: string;
  workspaceId: string;
  email: string;
  tier: string;
  isNew: boolean;
}> {
  const started = Date.now();

  while (Date.now() - started < MAX_WAIT_MS) {
    await sleep(POLL_INTERVAL_MS);

    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'workspaces:pollMagicLink',
        args: { token },
      }),
    });

    const data = await res.json().catch(() => ({}));
    interface PollResult {
      status: string;
      sessionToken?: string;
      workspace?: { id: string; email: string; tier: string; usageCount: number };
      expiresAt?: number;
    }
    const raw = (data as Record<string, unknown>)?.value || data;
    const result = raw as PollResult;

    if (result?.status === 'verified' && result.sessionToken && result.workspace) {
      return {
        sessionToken: result.sessionToken,
        workspaceId: result.workspace.id,
        email: result.workspace.email,
        tier: result.workspace.tier,
        isNew: result.workspace.usageCount === 0,
      };
    }

    if (result?.status === 'expired') {
      throw new Error('Magic link expired. Run login again to get a fresh link.');
    }
  }

  throw new Error('Timed out waiting for email verification.');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main login command
 */
export async function loginCommand(options: LoginOptions = {}): Promise<{
  sessionToken: string;
  workspaceId: string;
  email: string;
  tier: string;
  isNew: boolean;
} | null> {
  // Check existing session
  if (!options.force) {
    const existing = readSession();
    if (existing) {
      console.log(chalk.green(`\n✓ Already signed in as ${chalk.bold(existing.email)}\n`));
      console.log(
        chalk.dim(`  Use ${chalk.white('npx @nordsym/apiclaw login --force')} to switch accounts.\n`)
      );
      return {
        sessionToken: existing.sessionToken,
        workspaceId: existing.workspaceId,
        email: existing.email,
        tier: 'free',
        isNew: false,
      };
    }
  }

  console.log('');
  console.log(chalk.bold('  🦞 APIClaw Workspace'));
  console.log(chalk.dim('  Sign in or create a free account\n'));

  // Get email
  let email = options.email;
  if (!email) {
    email = await input({
      message: 'Your email:',
      validate: (val) => {
        if (!val || !val.includes('@')) return 'Enter a valid email address';
        return true;
      },
    });
  }

  email = email.trim().toLowerCase();

  // Send magic link
  const sendSpinner = ora('Sending magic link...').start();
  let token: string;

  try {
    token = await requestMagicLink(email);
    sendSpinner.succeed(`Magic link sent to ${chalk.bold(email)}`);
  } catch (err: any) {
    sendSpinner.fail(`Failed: ${err.message}`);
    return null;
  }

  // Tell user to check email
  console.log('');
  console.log(chalk.cyan('  → Check your inbox and click the link to continue.'));
  console.log(chalk.dim('    The link expires in 15 minutes.\n'));

  // Poll for verification
  const pollSpinner = ora('Waiting for email verification...').start();

  try {
    const result = await pollForVerification(token);

    // Save session locally
    writeSession(result.sessionToken, result.workspaceId, result.email);

    pollSpinner.succeed(
      result.isNew
        ? chalk.green(`Workspace created for ${chalk.bold(result.email)}`)
        : chalk.green(`Signed in as ${chalk.bold(result.email)}`)
    );

    console.log('');

    if (result.isNew) {
      console.log(chalk.bold('  ✅ You\'re in. Free tier: 50 API calls/month.'));
      console.log(
        chalk.dim(
          `  Dashboard: ${chalk.white(`${APICLAW_URL}/workspace`)}\n`
        )
      );
    } else {
      console.log(chalk.bold(`  ✅ Welcome back. Tier: ${result.tier}.`));
      console.log('');
    }

    return result;
  } catch (err: any) {
    pollSpinner.fail(err.message);
    return null;
  }
}
