#!/usr/bin/env node
/**
 * APIClaw Interactive CLI
 * Run with: npx @nordsym/apiclaw --cli
 */

import * as readline from 'readline';
import { ConvexHttpClient } from 'convex/browser';
import { discoverAPIs, getAPIDetails, getCategories } from './discovery.js';
import { executeAPICall, getConnectedProviders } from './execute.js';
import { readSession, writeSession, clearSession, getMachineFingerprint } from './session.js';

const CONVEX_URL = process.env.CONVEX_URL || 'https://brilliant-puffin-712.eu-west-1.convex.cloud';
const convex = new ConvexHttpClient(CONVEX_URL);

// Colors for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(msg: string) {
  console.log(msg);
}

function success(msg: string) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function error(msg: string) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function info(msg: string) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
}

interface WorkspaceContext {
  sessionToken: string;
  workspaceId: string;
  email: string;
  tier: string;
  usageRemaining: number;
}

let workspaceContext: WorkspaceContext | null = null;

async function validateSession(): Promise<boolean> {
  const session = readSession();
  if (!session) return false;
  
  try {
    const result = await convex.query("workspaces:getWorkspaceStatus" as any, {
      sessionToken: session.sessionToken,
    }) as any;
    
    if (!result?.authenticated || result?.status !== 'active') {
      clearSession();
      return false;
    }
    
    workspaceContext = {
      sessionToken: session.sessionToken,
      workspaceId: session.workspaceId,
      email: result.email ?? '',
      tier: result.tier ?? 'free',
      usageRemaining: result.usageRemaining ?? 0,
    };
    return true;
  } catch {
    return false;
  }
}

async function registerOwner(email: string): Promise<void> {
  info(`Sending magic link to ${email}...`);
  
  try {
    const fingerprint = getMachineFingerprint();
    
    // Use HTTP endpoint for magic link
    const response = await fetch(`${CONVEX_URL.replace('.cloud', '.site')}/workspace/magic-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fingerprint }),
    });
    
    const result = await response.json() as { success?: boolean; token?: string; error?: string };
    
    if (result?.success && result?.token) {
      success(`Magic link sent to ${email}`);
      log(`\n📧 Check your email and click the link to authenticate.`);
      
      // Start polling for verification
      log(`\n⏳ Waiting for you to click the link...`);
      log(`   (Press Ctrl+C to cancel)\n`);
      
      await pollForVerification(result.token, fingerprint);
    } else {
      error(`Failed: ${result?.error || 'Unknown error'}`);
    }
  } catch (err) {
    error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function pollForVerification(token: string, fingerprint: string): Promise<void> {
  const maxAttempts = 60; // 5 minutes
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 5000)); // Poll every 5 seconds
    
    try {
      const response = await fetch(`${CONVEX_URL.replace('.cloud', '.site')}/workspace/poll?token=${token}`);
      const result = await response.json() as { 
        verified?: boolean; 
        sessionToken?: string; 
        workspaceId?: string; 
        email?: string;
      };
      
      if (result?.verified && result?.sessionToken) {
        // Save the real session
        writeSession(
          result.sessionToken,
          result.workspaceId || '',
          result.email || ''
        );
        
        success(`Authenticated as ${result.email}!`);
        
        // Reload workspace context
        await validateSession();
        return;
      }
    } catch {
      // Continue polling
    }
    
    // Show progress dot
    process.stdout.write('.');
  }
  
  log('\n');
  error('Verification timed out. Please try again.');
}

async function showStatus(): Promise<void> {
  const valid = await validateSession();
  
  log(`\n${colors.bright}APIClaw Status${colors.reset}`);
  log(`${'─'.repeat(40)}`);
  
  if (valid && workspaceContext) {
    success(`Authenticated as ${workspaceContext.email}`);
    log(`   Tier: ${workspaceContext.tier}`);
    log(`   Remaining calls: ${workspaceContext.usageRemaining}`);
  } else {
    error(`Not authenticated`);
    log(`   Run: ${colors.cyan}register <email>${colors.reset}`);
  }
  log('');
}

async function discover(query: string): Promise<void> {
  info(`Searching for: "${query}"`);
  
  try {
    const results = discoverAPIs(query, { maxResults: 5 });
    
    if (!results || results.length === 0) {
      log(`No APIs found for "${query}"`);
      return;
    }
    
    log(`\n${colors.bright}Found ${results.length} APIs:${colors.reset}\n`);
    
    // Get connected providers for managed-provider detection
    const connected = getConnectedProviders().map(p => p.provider.toLowerCase());
    
    for (const result of results) {
      const api = result.provider;
      const isDirectCall = connected.includes(api.id?.toLowerCase() || api.name.toLowerCase().replace(/\s+/g, '_'));
      const directCallBadge = isDirectCall ? `${colors.green}[managed]${colors.reset}` : '';
      log(`${colors.cyan}${api.name}${colors.reset} ${directCallBadge}`);
      log(`   ${api.description}`);
      log(`   Category: ${api.category}`);
      log(`   Pricing: ${api.pricing?.model || 'See docs'}`);
      log('');
    }
  } catch (err) {
    error(`Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function listConnected(): Promise<void> {
  try {
    const providers = getConnectedProviders();
    
    log(`\n${colors.bright}managed-provider Providers (no API key needed):${colors.reset}\n`);
    
    for (const p of providers) {
      log(`${colors.cyan}${p.provider}${colors.reset}`);
      log(`   Actions: ${p.actions?.join(', ') || 'See docs'}`);
      log('');
    }
  } catch (err) {
    error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function callApi(provider: string, action: string, params: Record<string, any>): Promise<void> {
  if (!workspaceContext) {
    error('Not authenticated. Run: register <email>');
    return;
  }
  
  info(`Calling ${provider}.${action}...`);
  
  try {
    const result = await executeAPICall(
      provider,
      action,
      params,
      workspaceContext.workspaceId
    );
    
    log(`\n${colors.bright}Result:${colors.reset}\n`);
    log(JSON.stringify(result, null, 2));
    log('');
  } catch (err) {
    error(`Call failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

function showHelp(): void {
  log(`
${colors.bright}🦞 APIClaw CLI${colors.reset}

${colors.cyan}Commands:${colors.reset}
  register <email>      Send magic link to authenticate
  status                Check authentication status
  discover <query>      Search for APIs by capability
  list                  Show managed providers
  call <provider> <action> <json-params>
                        Call an API (e.g., call brave_search search {"q":"test"})
  help                  Show this help
  exit                  Quit

${colors.cyan}Examples:${colors.reset}
  discover send SMS
  discover image generation
  list
  call brave_search search {"q":"hello world"}
`);
}

function parseCallCommand(args: string): { provider: string; action: string; params: Record<string, any> } | null {
  // Format: provider action {json}
  const match = args.match(/^(\S+)\s+(\S+)\s+(.+)$/);
  if (!match) return null;
  
  try {
    const params = JSON.parse(match[3]);
    return { provider: match[1], action: match[2], params };
  } catch {
    return null;
  }
}

export async function startCLI(): Promise<void> {
  log(`
${colors.bright}🦞 APIClaw CLI v1.1.5${colors.reset}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type ${colors.cyan}help${colors.reset} for commands, ${colors.cyan}exit${colors.reset} to quit.
`);

  // Check session on startup
  const valid = await validateSession();
  if (valid && workspaceContext) {
    success(`Authenticated as ${workspaceContext.email}`);
  } else {
    info(`Not authenticated. Run: ${colors.cyan}register <email>${colors.reset}`);
  }
  log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${colors.red}apiclaw${colors.reset}> `,
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    const [cmd, ...args] = input.split(/\s+/);
    const argsStr = args.join(' ');

    switch (cmd.toLowerCase()) {
      case '':
        break;
        
      case 'help':
      case '?':
        showHelp();
        break;
        
      case 'exit':
      case 'quit':
      case 'q':
        log('Bye! 🦞');
        process.exit(0);
        break;
        
      case 'register':
        if (!argsStr) {
          error('Usage: register <email>');
        } else {
          await registerOwner(argsStr);
        }
        break;
        
      case 'status':
        await showStatus();
        break;
        
      case 'discover':
      case 'search':
        if (!argsStr) {
          error('Usage: discover <query>');
        } else {
          await discover(argsStr);
        }
        break;
        
      case 'list':
      case 'connected':
        await listConnected();
        break;
        
      case 'call':
        const parsed = parseCallCommand(argsStr);
        if (!parsed) {
          error('Usage: call <provider> <action> {"param":"value"}');
          log('Example: call brave_search search {"q":"hello"}');
        } else {
          await callApi(parsed.provider, parsed.action, parsed.params);
        }
        break;
        
      default:
        error(`Unknown command: ${cmd}`);
        log(`Type ${colors.cyan}help${colors.reset} for available commands.`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    log('\nBye! 🦞');
    process.exit(0);
  });
}
