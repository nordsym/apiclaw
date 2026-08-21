/**
 * APIClaw CLI Demo
 * Fires a real API call right in the terminal after login.
 * Shows the value in 5 seconds flat.
 */

import ora from 'ora';
import chalk from 'chalk';
import { readSession } from '../../session.js';
import { getGateway } from '../../gateway-client.js';
import { authLoginCommand } from './auth.js';

async function runManagedSearch(sessionToken: string, workspaceId: string): Promise<void> {
  const response = await getGateway().execute(
    'brave_search',
    'search',
    { query: 'AI agent infrastructure news', count: 3 },
    { sessionToken, workspaceId },
  );

  if (!response.success) throw new Error(response.error || 'Managed search failed');

  const results = response.data?.web?.results ?? response.data?.data?.web?.results ?? [];
  console.log('');
  console.log(chalk.bold('  🔎 Live Brave Search'));
  console.log(chalk.dim('  Query: AI agent infrastructure news\n'));

  for (const result of results.slice(0, 3)) {
    console.log(`  ${chalk.bold(result.title || result.url || 'Search result')}`);
    if (result.url) console.log(chalk.dim(`  ${result.url}`));
    console.log('');
  }

  console.log(
    chalk.dim('  Powered by APIClaw managed-provider routing · Brave Search')
  );
  console.log(
    chalk.dim(`  No API key needed. Your agent can call this too.\n`)
  );
  console.log(
    chalk.cyan(`  Dashboard: https://apiclaw.cloud/workspace`) + '\n'
  );
}

export async function demoCommand(): Promise<void> {
  console.log('');

  // Ensure logged in
  let session = readSession();
  if (!session) {
    console.log(chalk.yellow('  Sign in first to run the demo:\n'));
    const result = await authLoginCommand({});
    if (!result) {
      console.error(chalk.red('\n  Login failed. Run: npx @nordsym/apiclaw auth login\n'));
      process.exit(1);
    }
    session = readSession();
    console.log('');
  }

  console.log(
    chalk.bold('  🦞 APIClaw Demo') +
    chalk.dim(' — a real API call, right now, no config needed\n')
  );

  const spinner = ora('Calling Brave Search via APIClaw...').start();

  try {
    await runManagedSearch(session!.sessionToken, session!.workspaceId);
    spinner.stop();

    console.log(chalk.green('  ✓ That was a live managed-provider call through APIClaw.'));
    console.log(chalk.dim('  22 managed provider adapters. Zero provider keys needed.\n'));
    console.log(
      chalk.bold('  Next step:') +
      chalk.dim(' add APIClaw to your AI agent:\n')
    );
    console.log(
      '  ' + chalk.cyan('npx @nordsym/apiclaw setup') +
      chalk.dim('  auto-detects Claude, Cursor, Windsurf\n')
    );
  } catch (err: any) {
    spinner.fail('Demo failed: ' + err.message);
    console.log(chalk.dim('\n  Try again or check https://apiclaw.cloud\n'));
  }
}
