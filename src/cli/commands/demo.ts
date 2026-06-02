/**
 * APIClaw CLI Demo
 * Fires a real API call right in the terminal after login.
 * Shows the value in 5 seconds flat.
 */

import ora from 'ora';
import chalk from 'chalk';
import { readSession } from '../../session.js';
import { authLoginCommand } from './auth.js';

const CONVEX_SITE = 'https://adventurous-avocet-799.convex.site';

async function convertCurrency(): Promise<void> {
  const res = await fetch(`${CONVEX_SITE}/proxy/apilayer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service: 'exchangerates_data',
      endpoint: '/latest',
      params: { base: 'USD', symbols: 'SEK,EUR,GBP,JPY,NOK,DKK' },
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as any;

  if (!data.success) throw new Error(data.message || 'API error');

  const rates = data.rates as Record<string, number>;
  const base = data.base;
  const date = data.date;

  console.log('');
  console.log(chalk.bold(`  💱 Live exchange rates  ·  ${date}`));
  console.log(chalk.dim(`  Base: 1 ${base}\n`));

  const pairs = [
    { code: 'SEK', flag: '🇸🇪', name: 'Swedish Krona' },
    { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
    { code: 'GBP', flag: '🇬🇧', name: 'British Pound' },
    { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen' },
    { code: 'NOK', flag: '🇳🇴', name: 'Norwegian Krone' },
    { code: 'DKK', flag: '🇩🇰', name: 'Danish Krone' },
  ];

  for (const { code, flag, name } of pairs) {
    if (rates[code]) {
      const val = rates[code].toFixed(2);
      console.log(
        `  ${flag}  ${chalk.bold((val + ' ' + code).padEnd(14))}${chalk.dim(name)}`
      );
    }
  }

  console.log('');
  console.log(
    chalk.dim('  Powered by APIClaw managed-provider routing · exchangerates_data via APILayer')
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
      console.error(chalk.red('\n  Login failed. Run: npx @nordsym/apiclaw login\n'));
      process.exit(1);
    }
    session = readSession();
    console.log('');
  }

  console.log(
    chalk.bold('  🦞 APIClaw Demo') +
    chalk.dim(' — a real API call, right now, no config needed\n')
  );

  const spinner = ora('Calling exchangerates_data via APIClaw...').start();

  try {
    await convertCurrency();
    spinner.stop();

    console.log(chalk.green('  ✓ That was a live managed-provider call through APIClaw.'));
    console.log(chalk.dim('  20 providers, hundreds of APIs. Zero API keys needed.\n'));
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
