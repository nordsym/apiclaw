#!/usr/bin/env node
/**
 * APIvault - Agent-Native API Discovery MCP Server
 * 
 * Tools:
 * - discover_apis: Search for APIs by capability
 * - get_api_details: Get full info about an API
 * - purchase_access: Buy API access with credits
 * - check_balance: Check credits and active purchases
 * - add_credits: Add credits to account (for testing)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { discoverAPIs, getAPIDetails, getCategories, getAllAPIs } from './discovery.js';
import { trackStartup, trackSearch, trackExecute, trackDiscovery } from './telemetry.js';
import { 
  getAgentCredits, 
  addCredits, 
  purchaseAPIAccess, 
  getBalanceSummary,
  getAgentPurchases,
  getProvidersWithRealCredentials 
} from './credits.js';
import { hasRealCredentials } from './credentials.js';
import { getConnectedProviders } from './execute.js';
import { executeMetered } from './metered.js';
import { logAPICall } from './mcp-analytics.js';
import { isOpenAPI, executeOpenAPI, listOpenAPIs, getOpenAPIActions } from './open-apis.js';
import { PROXY_PROVIDERS } from './proxy.js';
import { 
  requiresConfirmation,
  requiresConfirmationAsync, 
  createPendingAction, 
  consumePendingAction,
  generatePreview,
  validateParams 
} from './confirmation.js';
import { executeCapability, listCapabilities, hasCapability } from './capability-router.js';
import { readSession, writeSession, clearSession, getMachineFingerprint, detectMCPClient, SessionData } from './session.js';
import { ConvexHttpClient } from 'convex/browser';
import { 
  getOrCreateCustomer, 
  createMeteredCheckoutSession, 
  getUsageSummary,
  METERED_BILLING 
} from './stripe.js';
import { estimateCost } from './metered.js';
import { 
  executeChain, 
  getChainStatus, 
  resumeChain,
  type ChainDefinition,
  type ChainResult,
  type Credentials as ChainCredentials,
  type ChainOptions,
  type ChainStepUnion
} from './chainExecutor.js';

// Default agent ID for MVP (in production, this would come from auth)
const DEFAULT_AGENT_ID = 'agent_default';

// Convex client for workspace management
const CONVEX_URL = process.env.CONVEX_URL || 'https://brilliant-puffin-712.eu-west-1.convex.cloud';
const convex = new ConvexHttpClient(CONVEX_URL);

// Global workspace context (set on startup if session is valid)
interface WorkspaceContext {
  sessionToken: string;
  workspaceId: string;
  email: string;
  tier: string;
  usageRemaining: number;
  usageCount: number;
  status: string;
}

let workspaceContext: WorkspaceContext | null = null;
let currentAgentId: string | null = null; // Agent ID from agents table (set on startup)

// Anonymous rate limit tracking (in-memory, per machine fingerprint)
interface AnonymousRateLimitState {
  hourlyCount: number;
  hourlyResetTime: number;
  weeklyCount: number;
  weeklyResetTime: number;
}

const anonymousRateLimits = new Map<string, AnonymousRateLimitState>();

// Rate limit constants
const ANONYMOUS_HOURLY_LIMIT = 5;
const ANONYMOUS_WEEKLY_LIMIT = 10;
const FREE_MONTHLY_LIMIT = 50;

/**
 * Calculate minutes until next hour
 */
function calculateMinutesUntilNextHour(): number {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  return Math.ceil((nextHour.getTime() - now.getTime()) / 60000);
}

/**
 * Get next Monday 00:00 UTC as ISO string
 */
function getNextMonthUTC(): string {
  const now = new Date();
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return nextMonth.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

/**
 * Check anonymous rate limits for proxy provider usage
 */
function checkAnonymousRateLimit(fingerprint: string): { allowed: boolean; error?: string; isAnonymous?: boolean } {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  const weekInMs = 7 * 24 * hourInMs;
  
  // Get or initialize rate limit state
  let state = anonymousRateLimits.get(fingerprint);
  if (!state) {
    state = {
      hourlyCount: 0,
      hourlyResetTime: now + hourInMs,
      weeklyCount: 0,
      weeklyResetTime: now + weekInMs,
    };
    anonymousRateLimits.set(fingerprint, state);
  }
  
  // Reset hourly counter if time elapsed
  if (now >= state.hourlyResetTime) {
    state.hourlyCount = 0;
    state.hourlyResetTime = now + hourInMs;
  }
  
  // Reset weekly counter if time elapsed
  if (now >= state.weeklyResetTime) {
    state.weeklyCount = 0;
    state.weeklyResetTime = now + weekInMs;
  }
  
  // Check hourly limit
  if (state.hourlyCount >= ANONYMOUS_HOURLY_LIMIT) {
    return {
      allowed: false,
      error: JSON.stringify({
        success: false,
        error: `Hourly rate limit (${ANONYMOUS_HOURLY_LIMIT} calls/hour)`,
        retry_after_minutes: calculateMinutesUntilNextHour(),
        hint: "Rate limit resets at top of hour",
        action: "Register to get higher limits: register_owner({ email: 'you@example.com' })"
      }, null, 2)
    };
  }
  
  // Check weekly limit
  if (state.weeklyCount >= ANONYMOUS_WEEKLY_LIMIT) {
    return {
      allowed: false,
      error: JSON.stringify({
        success: false,
        error: `Monthly limit reached (${ANONYMOUS_WEEKLY_LIMIT} calls)`,
        hint: "Register to get 50 calls/month",
        action: "Run: register_owner({ email: 'you@example.com' })",
        retry_after: getNextMonthUTC()
      }, null, 2)
    };
  }
  
  // Increment counters
  state.hourlyCount++;
  state.weeklyCount++;
  
 
  return { allowed: true };
}

/**
 * Validate session on startup
 */
async function validateSession(): Promise<boolean> {
  const session = readSession();
  if (!session) {
    console.error('[APIClaw] No session found. Use register_owner to authenticate.');
    return false;
  }
  
  try {
    const result = await convex.query("workspaces:getWorkspaceStatus" as any, {
      sessionToken: session.sessionToken,
    }) as { authenticated: boolean; email?: string; status?: string; tier?: string; usageCount?: number; usageLimit?: number; usageRemaining?: number };
    
    if (!result.authenticated) {
      console.error('[APIClaw] Session invalid or expired. Clearing...');
      clearSession();
      return false;
    }
    
    if (result.status !== 'active') {
      console.error(`[APIClaw] Workspace status: ${result.status}. Please verify your email.`);
      return false;
    }
    
    workspaceContext = {
      sessionToken: session.sessionToken,
      workspaceId: session.workspaceId,
      email: result.email ?? '',
      tier: result.tier ?? 'free',
      usageRemaining: result.usageRemaining ?? 0,
      usageCount: result.usageCount ?? 0,
      status: result.status ?? 'unknown',
    };
    
    console.error(`[APIClaw] ✓ Authenticated as ${result.email} (${result.tier} tier)`);
    console.error(`[APIClaw] ✓ Usage: ${result.usageCount}/${result.usageLimit === -1 ? '∞' : result.usageLimit} calls`);
    
    // Touch session to update last used
    await convex.mutation("workspaces:touchSession" as any, {
      sessionToken: session.sessionToken,
    });
    
    return true;
  } catch (error) {
    console.error('[APIClaw] Error validating session:', error);
    return false;
  }
}

/**
 * Track earn progress after successful API call
 * Handles firstDirectCall and apisUsed tracking
 */
async function trackEarnProgress(workspaceId: string, provider: string, action: string): Promise<void> {
  try {
    // Track first direct call
    await convex.mutation("earnProgress:markFirstDirectCall" as any, {
      workspaceId: workspaceId as any,
    });

    // Track unique API usage
    const apiId = `${provider}:${action}`;
    await convex.mutation("earnProgress:trackApiUsed" as any, {
      workspaceId: workspaceId as any,
      apiId,
    });
  } catch (e) {
    // Non-critical - don't fail the API call if earn tracking fails
    console.error('[APIClaw] Failed to track earn progress:', e);
  }
}

/**
 * Rate limiting for anonymous proxy usage
 * Limits: 10 calls/week, 5 calls/hour (anonymous)
 *         50 calls/month, 10 calls/hour (authenticated)
 */
interface RateLimitState {
  hourly: { count: number; resetAt: number };
  weekly: { count: number; resetAt: number };
}

const rateLimitStore = new Map<string, RateLimitState>();

// Unregistered (auto-provisioned, no email) users get this many calls before signup required
const UNREGISTERED_CALL_LIMIT = 5;

/**
 * For proxy providers, allow anonymous usage with rate limiting
 */
function checkWorkspaceAccess(providerId?: string): { allowed: boolean; error?: string; isAnonymous?: boolean } {
  // Allow anonymous access for proxy providers
  if (providerId && PROXY_PROVIDERS.includes(providerId)) {
    if (!workspaceContext) {
      // Anonymous user - check rate limits
      const fingerprint = getMachineFingerprint();
      const rateLimitCheck = checkAnonymousRateLimit(fingerprint);
      
      if (!rateLimitCheck.allowed) {
        return {
          allowed: false,
          error: rateLimitCheck.error,
          isAnonymous: true
        };
      }
      
      return { allowed: true, isAnonymous: true };
    }
    // Authenticated user using proxy provider - allow with higher limits
    return { allowed: true, isAnonymous: false };
  }
  
  // Non-proxy providers require authentication
  if (!workspaceContext) {
    return { 
      allowed: false, 
      error: 'Not authenticated. Use register_owner to authenticate your workspace.' 
    };
  }
  
  if (workspaceContext.status !== 'active') {
    return {
      allowed: false,
      error: `Workspace status: ${workspaceContext.status}. Please verify your email.`
    };
  }

  // Unregistered workspaces (auto-provisioned, no email) get limited calls then must register
  if (!workspaceContext.email && workspaceContext.usageCount >= UNREGISTERED_CALL_LIMIT) {
    return {
      allowed: false,
      error: JSON.stringify({
        success: false,
        error: `Register to continue. You've used ${UNREGISTERED_CALL_LIMIT} free calls.`,
        hint: "Run register_owner with your email to unlock 50 calls/month.",
        action: "register_owner"
      }, null, 2)
    };
  }

  if (workspaceContext.usageRemaining === 0) {
    // Free tier hit weekly limit
    if (workspaceContext.tier === 'free') {
      return { 
        allowed: false, 
        error: JSON.stringify({
          success: false,
          error: `Monthly limit reached (${FREE_MONTHLY_LIMIT} calls)`,
          hint: "Upgrade to Backer for unlimited calls",
          upgrade_url: "https://apiclaw.nordsym.com/upgrade",
          retry_after: getNextMonthUTC()
        }, null, 2)
      };
    }
    
    // Other tiers (shouldn't happen, but handle gracefully)
    return { 
      allowed: false, 
      error: `Usage limit reached. Contact support or check your plan at https://apiclaw.nordsym.com/account` 
    };
  }
  
  return { allowed: true, isAnonymous: false };
}

/**
 * Get customer API key from environment variable
 * Convention: {PROVIDER}_API_KEY (e.g., COACCEPT_API_KEY, ELKS_API_KEY)
 */
function getCustomerKey(providerId: string): string | undefined {
  // Try exact match first (e.g., 46elks -> 46ELKS_API_KEY)
  const exactKey = `${providerId.toUpperCase().replace(/-/g, '_')}_API_KEY`;
  if (process.env[exactKey]) {
    return process.env[exactKey];
  }
  
  // Try common variations
  const variations = [
    `${providerId.toUpperCase()}_API_KEY`,
    `${providerId.toUpperCase()}_KEY`,
    `${providerId.toUpperCase().replace(/_/g, '')}_API_KEY`,
  ];
  
  for (const key of variations) {
    if (process.env[key]) {
      return process.env[key];
    }
  }
  
  return undefined;
}

// Tool definitions
const tools: Tool[] = [
  {
    name: 'apiclaw_help',
    description: 'Get help and see available commands. Start here if you are new to APIClaw.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'discover_apis',
    description: 'Search for APIs based on what you need to do. Describe your use case naturally.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query describing what you need (e.g., "send SMS to Sweden", "search the web", "generate speech from text")'
        },
        category: {
          type: 'string',
          description: 'Filter by category: communication, search, ai',
          enum: ['communication', 'search', 'ai']
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
          default: 5
        },
        region: {
          type: 'string',
          description: 'Filter by region (e.g., "SE", "EU", "global")'
        },
        subagent_id: {
          type: 'string',
          description: 'Optional subagent identifier for multi-agent tracking'
        },
        ai_backend: {
          type: 'string',
          description: 'AI backend making this request (e.g., "claude-3-sonnet", "gpt-4"). Used for analytics.'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_api_details',
    description: 'Get detailed information about a specific API provider, including endpoints, pricing, and features. Use compact=true to save ~60% tokens.',
    inputSchema: {
      type: 'object',
      properties: {
        api_id: {
          type: 'string',
          description: 'The API provider ID (e.g., "46elks", "resend", "openrouter")'
        },
        compact: {
          type: 'boolean',
          description: 'If true, returns minified spec (strips examples, keeps essential params). Saves ~60% context window.',
          default: false
        }
      },
      required: ['api_id']
    }
  },
  {
    name: 'purchase_access',
    description: 'Purchase access to an API using your credit balance. Returns API credentials on success.',
    inputSchema: {
      type: 'object',
      properties: {
        api_id: {
          type: 'string',
          description: 'The API provider ID to purchase access to'
        },
        amount_usd: {
          type: 'number',
          description: 'Amount in USD to spend on this API'
        },
        agent_id: {
          type: 'string',
          description: 'Your agent identifier (optional, uses default if not provided)'
        }
      },
      required: ['api_id', 'amount_usd']
    }
  },
  {
    name: 'check_balance',
    description: 'Check your credit balance and list active API purchases.',
    inputSchema: {
      type: 'object',
      properties: {
        agent_id: {
          type: 'string',
          description: 'Your agent identifier (optional, uses default if not provided)'
        }
      }
    }
  },
  {
    name: 'add_credits',
    description: 'Add credits to your account. (For testing/demo purposes)',
    inputSchema: {
      type: 'object',
      properties: {
        amount_usd: {
          type: 'number',
          description: 'Amount in USD to add to your balance'
        },
        agent_id: {
          type: 'string',
          description: 'Your agent identifier (optional, uses default if not provided)'
        }
      },
      required: ['amount_usd']
    }
  },
  {
    name: 'list_categories',
    description: 'List all available API categories.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'call_api',
    description: `Execute an API call through APIClaw. Supports single calls AND multi-step chains.

SINGLE CALL: Provide provider + action + params
CHAIN: Provide chain array to execute multiple APIs in sequence/parallel with cross-step references.

Chain features:
- Sequential: Steps execute in order, each can reference previous results via $stepId.property
- Parallel: Use { parallel: [...steps] } to run concurrently
- Conditional: Use { if: "$step.success", then: {...}, else: {...} }
- Loops: Use { forEach: "$step.results", as: "item", do: {...} }
- Error handling: Per-step retry/fallback via onError
- Async: Set async: true to get chainId immediately, poll or use webhook

Example chain:
  chain: [
    { id: "search", provider: "brave_search", action: "search", params: { query: "AI agents" } },
    { id: "summarize", provider: "openrouter", action: "chat", params: { message: "Summarize: $search.results" } }
  ]`,
    inputSchema: {
      type: 'object',
      properties: {
        // Single call params
        provider: {
          type: 'string',
          description: 'Provider ID (e.g., "46elks", "brave_search", "resend", "openrouter", "elevenlabs", "twilio", "coaccept", "frankfurter")'
        },
        action: {
          type: 'string',
          description: 'Action to perform (e.g., "send_sms", "search", "send_email", "chat", "send_invoice", "convert")'
        },
        params: {
          type: 'object',
          description: 'Parameters for the action. Varies by provider/action.'
        },
        customer_key: {
          type: 'string',
          description: 'Optional: Your own API key for providers that require customer authentication (e.g., CoAccept).'
        },
        confirm_token: {
          type: 'string',
          description: 'Confirmation token from a previous call. Required to execute actions that cost money after reviewing the preview.'
        },
        dry_run: {
          type: 'boolean',
          description: 'If true, shows what WOULD be sent without making actual API calls. Returns mock response and request details. Great for testing and debugging.'
        },
        // Chain execution params
        chain: {
          type: 'array',
          description: 'Execute multiple API calls as a single chain. Each step can reference previous results via $stepId.property',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Step identifier for cross-step references' },
              provider: { type: 'string', description: 'API provider' },
              action: { type: 'string', description: 'Action to execute' },
              params: { type: 'object', description: 'Action parameters. Use $stepId.path for references.' },
              parallel: { type: 'array', description: 'Steps to run in parallel' },
              if: { type: 'string', description: 'Condition for conditional execution (e.g., "$step1.success")' },
              then: { type: 'object', description: 'Step to execute if condition is true' },
              else: { type: 'object', description: 'Step to execute if condition is false' },
              forEach: { type: 'string', description: 'Array reference to iterate (e.g., "$search.results")' },
              as: { type: 'string', description: 'Variable name for current item in loop' },
              do: { type: 'object', description: 'Step to execute for each item' },
              onError: {
                type: 'object',
                description: 'Error handling configuration',
                properties: {
                  retry: {
                    type: 'object',
                    properties: {
                      attempts: { type: 'number', description: 'Max retry attempts' },
                      backoff: { type: 'string', description: '"exponential" or "linear" or array of ms delays' }
                    }
                  },
                  fallback: { type: 'object', description: 'Fallback step if this fails' },
                  abort: { type: 'boolean', description: 'Abort entire chain on failure' }
                }
              }
            }
          }
        },
        // Chain options
        continueOnError: {
          type: 'boolean',
          description: 'Continue chain execution even if a step fails (default: false)'
        },
        timeout: {
          type: 'number',
          description: 'Maximum execution time for the entire chain in milliseconds'
        },
        async: {
          type: 'boolean',
          description: 'Return immediately with chainId. Use get_chain_status to poll or provide webhook.'
        },
        webhook: {
          type: 'string',
          description: 'URL to POST results when async chain completes'
        },
        subagent_id: {
          type: 'string',
          description: 'Optional subagent identifier for multi-agent tracking'
        },
        ai_backend: {
          type: 'string',
          description: 'AI backend making this request (e.g., "claude-3-sonnet", "gpt-4"). Used for analytics.'
        }
      },
      required: []
    }
  },
  {
    name: 'list_connected',
    description: 'List all APIs available for Direct Call (no API key needed).',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'capability',
    description: 'Execute an action by capability, not provider. APIClaw automatically selects the best provider, handles fallback, and optimizes for cost/speed. Example: capability("sms", "send", {to: "+46...", message: "Hello"})',
    inputSchema: {
      type: 'object',
      properties: {
        capability: {
          type: 'string',
          description: 'Capability ID: "sms", "email", "search", "tts", "invoice", "llm"'
        },
        action: {
          type: 'string',
          description: 'Action to perform: "send", "search", "generate", etc.'
        },
        params: {
          type: 'object',
          description: 'Parameters for the action (capability-standard params, not provider-specific)'
        },
        preferences: {
          type: 'object',
          description: 'Optional routing preferences',
          properties: {
            region: { type: 'string', description: 'Preferred region: "SE", "EU", "US"' },
            maxPrice: { type: 'number', description: 'Max price per unit in cents/öre' },
            preferredProvider: { type: 'string', description: 'Hint to prefer a specific provider' },
            fallback: { type: 'boolean', description: 'Enable fallback to other providers (default: true)' }
          }
        },
        subagent_id: {
          type: 'string',
          description: 'Optional subagent identifier for multi-agent tracking'
        },
        ai_backend: {
          type: 'string',
          description: 'AI backend making this request (e.g., "claude-3-sonnet", "gpt-4"). Used for analytics.'
        }
      },
      required: ['capability', 'action', 'params']
    }
  },
  {
    name: 'list_capabilities',
    description: 'List all available capabilities and their providers.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  // ============================================
  // WORKSPACE TOOLS
  // ============================================
  {
    name: 'register_owner',
    description: 'Register your email to create a workspace. This authenticates your agent with APIClaw. You will receive a magic link to verify ownership.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Your email address (used for verification and account recovery)'
        }
      },
      required: ['email']
    }
  },
  {
    name: 'check_workspace_status',
    description: 'Check your workspace status, tier, and usage remaining.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'remind_owner',
    description: 'Send a reminder email to verify workspace ownership (if verification is pending).',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  // Metered Billing Tools
  {
    name: 'setup_metered_billing',
    description: 'Set up pay-per-call billing. Creates a subscription that charges $0.002 per API call at end of month.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email for the billing account'
        },
        success_url: {
          type: 'string',
          description: 'URL to redirect after successful setup',
          default: 'https://apiclaw.nordsym.com/billing/success'
        },
        cancel_url: {
          type: 'string',
          description: 'URL to redirect if setup is cancelled',
          default: 'https://apiclaw.nordsym.com/billing/cancel'
        }
      },
      required: ['email']
    }
  },
  {
    name: 'get_usage_summary',
    description: 'Get current billing period usage and estimated cost for metered billing.',
    inputSchema: {
      type: 'object',
      properties: {
        subscription_id: {
          type: 'string',
          description: 'Stripe subscription ID (stored after setup_metered_billing)'
        }
      },
      required: ['subscription_id']
    }
  },
  {
    name: 'estimate_cost',
    description: 'Estimate the cost for a given number of API calls.',
    inputSchema: {
      type: 'object',
      properties: {
        call_count: {
          type: 'number',
          description: 'Number of API calls to estimate cost for'
        }
      },
      required: ['call_count']
    }
  },
  // ============================================
  // CHAIN MANAGEMENT TOOLS
  // ============================================
  {
    name: 'get_chain_status',
    description: 'Check the status of an async chain execution. Use the chainId returned from call_api with async: true.',
    inputSchema: {
      type: 'object',
      properties: {
        chain_id: {
          type: 'string',
          description: 'Chain ID returned from async chain execution'
        }
      },
      required: ['chain_id']
    }
  },
  {
    name: 'resume_chain',
    description: 'Resume a failed chain from the point of failure. Use the resumeToken from the error response. Requires the original chain definition.',
    inputSchema: {
      type: 'object',
      properties: {
        resume_token: {
          type: 'string',
          description: 'Resume token from a failed chain (e.g., "chain_xyz_step_2")'
        },
        original_chain: {
          type: 'array',
          description: 'The original chain definition that failed. Required to resume execution.',
          items: { type: 'object' }
        },
        overrides: {
          type: 'object',
          description: 'Optional parameter overrides for specific steps. Format: { "stepId": { ...newParams } }'
        }
      },
      required: ['resume_token', 'original_chain']
    }
  }
];

// Create server
const server = new Server(
  {
    name: 'apivault',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'apiclaw_help': {
        const helpText = `
🦞 APIClaw — The API Layer for AI Agents
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DISCOVER APIs:
  discover_apis({ query: "send SMS to Sweden" })
  discover_apis({ query: "search the web", max_results: 10 })
  discover_apis({ query: "text to speech", category: "ai" })

GET DETAILS:
  get_api_details({ api_id: "46elks" })

DIRECT CALL (8 APIs, no key needed):
  get_connected_providers()
  call_api({ provider: "brave_search", endpoint: "search", params: { query: "AI agents" } })

Available direct-call providers:
  • brave_search — Web search
  • 46elks — SMS (Sweden)
  • twilio — SMS (Global)
  • resend — Email
  • openrouter — LLM routing (100+ models)
  • elevenlabs — Text-to-speech
  • replicate — AI models (images, video, audio)
  • firecrawl — Web scraping & crawling
  • github — Code repos & developer data
  • e2b — Code sandbox for AI agents

BROWSE:
  list_categories()
  list_all_apis({ category: "communication", limit: 20 })

Docs: https://apiclaw.nordsym.com
`;
        return {
          content: [{ type: 'text', text: helpText }]
        };
      }

      case 'discover_apis': {
        const query = args?.query as string;
        const category = args?.category as string | undefined;
        const maxResults = (args?.max_results as number) || 5;
        const region = args?.region as string | undefined;
        const subagentId = args?.subagent_id as string | undefined;
        const aiBackend = args?.ai_backend as string | undefined;

        const startTime = Date.now();
        const results = discoverAPIs(query, { category, maxResults, region });
        const responseTimeMs = Date.now() - startTime;
        trackSearch(query, results.length, responseTimeMs);

        // Log search to Convex analytics (authenticated + anonymous)
        const analyticsUserId = workspaceContext?.workspaceId || `anon:${getMachineFingerprint()}`;
        const convexUrl = process.env.APICLAW_CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
        if (convexUrl) {
          fetch(`${convexUrl}/api/mutation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: 'analytics:log',
              args: {
                event: 'search_query',
                provider: undefined,
                query,
                identifier: analyticsUserId,
                metadata: {
                  resultCount: results.length,
                  matchedProviders: results.slice(0, 10).map(r => r.provider.id),
                  responseTimeMs,
                  category,
                  authenticated: !!workspaceContext,
                },
              },
            }),
          }).catch(() => {}); // Fire and forget
        }

        // Log search to searchLogs table (authenticated only - requires workspace)
        if (workspaceContext?.sessionToken) {
          const searchLogPayload = {
            path: 'searchLogs:log',
            args: {
              sessionToken: workspaceContext.sessionToken,
              subagentId: subagentId || undefined,
              query,
              resultCount: results.length,
              matchedProviders: results.slice(0, 10).map(r => r.provider.id),
              responseTimeMs,
            },
          };
          
          fetch(`${convexUrl}/api/mutation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(searchLogPayload),
          }).catch(() => {}); // Fire and forget

          // Log discovery to provider workspaces (so they see search activity)
          // Map search results to known Direct Call providers
          const PROVIDER_KEYWORDS: Record<string, string[]> = {
            apilayer: ['exchange', 'currency', 'fixer', 'weather', 'ip', 'geo', 'flight', 'aviation', 'vat', 'news', 'scrape', 'screenshot', 'pdf', 'email verif', 'phone verif', 'language', 'user agent', 'coinlayer', 'marketstack', 'positionstack', 'ipstack', 'mediastack', 'serpstack', 'userstack', 'scrapestack', 'weatherstack'],
          };
          const queryLower = query.toLowerCase();
          for (const [provider, keywords] of Object.entries(PROVIDER_KEYWORDS)) {
            if (keywords.some(kw => queryLower.includes(kw))) {
              fetch(`${convexUrl}/api/mutation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  path: 'logs:logProviderCall',
                  args: {
                    provider,
                    action: `discovery:${query.substring(0, 50)}`,
                    status: 'success' as const,
                    latencyMs: responseTimeMs,
                    callerWorkspaceId: workspaceContext.workspaceId,
                  },
                }),
              }).catch(() => {});
            }
          }
        }

        // Update AI backend tracking if provided
        if (aiBackend && workspaceContext?.sessionToken) {
          fetch('https://brilliant-puffin-712.eu-west-1.convex.cloud/api/mutation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: 'agents:updateAIBackend',
              args: {
                token: workspaceContext.sessionToken,
                subagentId: subagentId || undefined,
                aiBackend,
              },
            }),
          }).catch(() => {}); // Fire and forget
        }

        if (results.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'no_results',
                  message: `No APIs found matching "${query}". Try broader terms or check available categories with list_categories.`,
                  available_categories: getCategories()
                }, null, 2)
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                query,
                results_count: results.length,
                results: results.map(r => ({
                  id: r.provider.id,
                  name: r.provider.name,
                  description: r.provider.description,
                  category: r.provider.category,
                  capabilities: r.provider.capabilities,
                  pricing_model: r.provider.pricing.model,
                  has_free_tier: r.provider.pricing.free_tier,
                  agent_success_rate: r.provider.agent_success_rate,
                  relevance_score: r.relevance_score,
                  match_reasons: r.match_reasons
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'get_api_details': {
        const apiId = args?.api_id as string;
        const compact = args?.compact as boolean || false;
        const api = getAPIDetails(apiId, { compact });

        if (!api) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  message: `API not found: ${apiId}`,
                  hint: 'Try discover_apis to search, or list_connected for direct-call APIs',
                }, null, 2)
              }
            ]
          };
        }

        // Compact mode: minimal JSON, no pretty-print
        if (compact) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ status: 'ok', ...api })
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                api
              }, null, 2)
            }
          ]
        };
      }

      case 'purchase_access': {
        const apiId = args?.api_id as string;
        const amountUsd = args?.amount_usd as number;
        const agentId = (args?.agent_id as string) || DEFAULT_AGENT_ID;

        const result = purchaseAPIAccess(agentId, apiId, amountUsd);

        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  message: result.error
                }, null, 2)
              }
            ]
          };
        }

        const api = getAPIDetails(apiId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Successfully purchased access to ${apiId}`,
                purchase: {
                  id: result.purchase!.id,
                  provider: apiId,
                  amount_paid_usd: amountUsd,
                  credits_received: result.purchase!.credits_purchased,
                  status: result.purchase!.status,
                  real_credentials: hasRealCredentials(apiId)
                },
                credentials: result.purchase!.credentials,
                access: {
                  base_url: api?.base_url,
                  docs_url: api?.docs_url,
                  auth_type: api?.auth_type
                }
              }, null, 2)
            }
          ]
        };
      }

      case 'check_balance': {
        const agentId = (args?.agent_id as string) || DEFAULT_AGENT_ID;
        const summary = getBalanceSummary(agentId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                agent_id: agentId,
                balance_usd: summary.credits.balance_usd,
                currency: summary.credits.currency,
                total_spent_usd: summary.total_spent_usd,
                real_credential_providers: summary.real_credentials_available,
                active_purchases: summary.active_purchases.map(p => ({
                  id: p.id,
                  provider: p.provider_id,
                  credits_remaining: p.credits_purchased,
                  status: p.status,
                  real_credentials: hasRealCredentials(p.provider_id)
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'add_credits': {
        const amountUsd = args?.amount_usd as number;
        const agentId = (args?.agent_id as string) || DEFAULT_AGENT_ID;

        const credits = addCredits(agentId, amountUsd);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: `Added $${amountUsd.toFixed(2)} to your account`,
                new_balance_usd: credits.balance_usd
              }, null, 2)
            }
          ]
        };
      }

      case 'list_categories': {
        const categories = getCategories();
        const apisByCategory: Record<string, string[]> = {};
        
        for (const cat of categories) {
          apisByCategory[cat] = getAllAPIs()
            .filter(a => a.category === cat)
            .map(a => a.id);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                categories: apisByCategory
              }, null, 2)
            }
          ]
        };
      }

      case 'call_api': {
        const provider = args?.provider as string;
        const action = args?.action as string;
        const params = (args?.params as Record<string, any>) || {};
        const confirmToken = args?.confirm_token as string | undefined;
        const dryRun = args?.dry_run as boolean | undefined;
        const chain = args?.chain as ChainStepUnion[] | undefined;
        const subagentId = args?.subagent_id as string | undefined;
        const aiBackend = args?.ai_backend as string | undefined;
        
        // Track AI backend if provided
        if (aiBackend && workspaceContext?.sessionToken) {
          fetch('https://brilliant-puffin-712.eu-west-1.convex.cloud/api/mutation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: 'agents:updateAIBackend',
              args: {
                token: workspaceContext.sessionToken,
                subagentId: subagentId || undefined,
                aiBackend,
              },
            }),
          }).catch(() => {}); // Fire and forget
        }
        
        // ============================================
        // CHAIN EXECUTION MODE
        // ============================================
        if (chain && Array.isArray(chain) && chain.length > 0) {
          // Check workspace access for chains
          const access = checkWorkspaceAccess();
          if (!access.allowed) {
            // If error is already formatted JSON (from rate limit checks), return as-is
            if (access.error?.startsWith('{')) {
              return {
                content: [{
                  type: 'text',
                  text: access.error
                }],
                isError: true
              };
            }
            
            // Otherwise, wrap in standard error format
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  error: access.error,
                  hint: 'Use register_owner to authenticate your workspace.',
                }, null, 2)
              }],
              isError: true
            };
          }
          
          try {
            // Construct ChainDefinition from the input
            const chainDefinition: ChainDefinition = {
              steps: chain as ChainStepUnion[],
              timeout: args?.timeout as number | undefined,
              errorPolicy: args?.continueOnError 
                ? { mode: 'best-effort' as const }
                : { mode: 'fail-fast' as const },
            };
            
            const chainCredentials: ChainCredentials = {
              userId: DEFAULT_AGENT_ID,
              customerKeys: {},
            };
            
            // Add customer key if provided
            const customerKey = args?.customer_key as string | undefined;
            if (customerKey) {
              // Apply to all providers (or could be provider-specific)
              chainCredentials.customerKeys = { default: customerKey };
            }
            
            const chainOptions: ChainOptions = {
              verbose: false,
            };
            
            // Execute the chain
            const chainResult = await executeChain(
              chainDefinition,
              chainCredentials,
              {}, // inputs
              chainOptions
            );
            
            // Track usage for chain (count completed steps)
            if (chainResult.success && workspaceContext) {
              const completedCount = chainResult.completedSteps.length;
              
              for (let i = 0; i < completedCount; i++) {
                try {
                  await convex.mutation("workspaces:incrementUsage" as any, {
                    workspaceId: workspaceContext.workspaceId as any,
                  });
                } catch (e) {
                  console.error('[APIClaw] Failed to track chain usage:', e);
                }
              }
            }
            
            // Format response to match expected chain response format
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: chainResult.success ? 'success' : 'error',
                  mode: 'chain',
                  chainId: chainResult.chainId,
                  steps: chainResult.trace.map(t => ({
                    id: t.stepId,
                    status: t.success ? 'completed' : 'failed',
                    result: t.output,
                    error: t.error,
                    latencyMs: t.latencyMs,
                    cost: t.cost,
                  })),
                  finalResult: chainResult.finalResult,
                  totalLatencyMs: chainResult.totalLatencyMs,
                  totalCost: chainResult.totalCost,
                  tokensSaved: (chain.length - 1) * 500, // Estimate tokens saved
                  ...(chainResult.error ? {
                    completedSteps: chainResult.completedSteps,
                    failedStep: chainResult.failedStep ? {
                      id: chainResult.failedStep.stepId,
                      error: chainResult.failedStep.error,
                      code: chainResult.failedStep.errorCode,
                    } : undefined,
                    partialResults: chainResult.results,
                    canResume: chainResult.canResume,
                    resumeToken: chainResult.resumeToken,
                  } : {}),
                }, null, 2)
              }],
              isError: !chainResult.success
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  mode: 'chain',
                  error: error instanceof Error ? error.message : String(error),
                }, null, 2)
              }],
              isError: true
            };
          }
        }
        
        // ============================================
        // SINGLE CALL MODE (existing logic)
        // ============================================
        
        // Handle dry-run mode - no actual API calls, just show what would happen
        if (dryRun) {
          const { generateDryRun } = await import('./execute.js');
          const dryRunResult = generateDryRun(provider, action, params);
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(dryRunResult, null, 2)
            }]
          };
        }
        
        // Check workspace access (skip for free/open APIs)
        const isFreeAPI = isOpenAPI(provider);
        if (!isFreeAPI) {
          const access = checkWorkspaceAccess(provider);
          if (!access.allowed) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  error: access.error,
                  hint: access.isAnonymous 
                    ? 'Rate limit reached. Use register_owner to authenticate for higher limits.'
                    : 'Use register_owner to authenticate your workspace.',
                }, null, 2)
              }],
              isError: true
            };
          }
        }
        
        const startTime = Date.now();
        let result: { success: boolean; provider: string; action: string; data?: any; error?: string; cost?: number };
        let apiType: 'direct' | 'open';

        // Check if this is a confirmation of a pending action
        if (confirmToken) {
          const pending = consumePendingAction(confirmToken);
          
          if (!pending) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  error: 'Invalid or expired confirmation token. Please start over.',
                }, null, 2)
              }],
              isError: true
            };
          }

          // Execute the confirmed action with metered billing
          apiType = 'direct';
          const customerKey = (args?.customer_key as string) || getCustomerKey(pending.provider);
          const stripeCustomerId = (args?.stripe_customer_id as string) || process.env.APICLAW_STRIPE_CUSTOMER_ID;
          result = await executeMetered(pending.provider, pending.action, pending.params, {
            customerId: stripeCustomerId,
            customerKey,
            userId: DEFAULT_AGENT_ID,
          });

          // Log the confirmed API call (with fingerprint for anonymous users)
          const analyticsUserId = workspaceContext 
            ? workspaceContext.workspaceId 
            : `anon:${getMachineFingerprint()}`;
          
          logAPICall({
            timestamp: new Date().toISOString(),
            provider: pending.provider,
            action: pending.action,
            type: apiType,
            userId: analyticsUserId,
            success: result.success,
            latencyMs: Date.now() - startTime,
            error: result.error,
          });

          // Track earn progress for confirmed actions
          if (result.success && workspaceContext) {
            await trackEarnProgress(workspaceContext.workspaceId, pending.provider, pending.action);
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: result.success ? 'success' : 'error',
                provider: result.provider,
                action: result.action,
                confirmed: true,
                ...(result.success ? { data: result.data } : { error: result.error }),
              }, null, 2)
            }],
            isError: !result.success
          };
        }

        // Check if this action requires confirmation (both hardcoded and dynamic providers)
        const confirmCheck = await requiresConfirmationAsync(provider, action);
        
        if (confirmCheck.required) {
          // Validate params first (for hardcoded providers)
          if (!confirmCheck.isDynamic) {
            const validation = validateParams(provider, action, params);
            
            if (!validation.valid) {
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'error',
                    error: 'Validation failed',
                    missing_or_invalid: validation.errors,
                    hint: 'Please provide all required fields before sending.',
                  }, null, 2)
                }],
                isError: true
              };
            }
          }

          // Generate preview and create pending action
          const preview = generatePreview(provider, action, params);
          if (confirmCheck.estimatedCost) {
            preview.estimated_cost = confirmCheck.estimatedCost;
          }
          const pending = createPendingAction(provider, action, params, preview, DEFAULT_AGENT_ID);

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'requires_confirmation',
                message: '⚠️ This action costs money. Please review and confirm.',
                preview,
                confirm_token: pending.token,
                expires_in_seconds: 300,
                how_to_confirm: `Call again with confirm_token: "${pending.token}"`,
              }, null, 2)
            }]
          };
        }

        // Regular execution (no confirmation needed)
        if (isOpenAPI(provider)) {
          apiType = 'open';
          result = await executeOpenAPI(provider, action, params);
        } else {
          apiType = 'direct';
          const customerKey = (args?.customer_key as string) || getCustomerKey(provider);
          const stripeCustomerId = (args?.stripe_customer_id as string) || process.env.APICLAW_STRIPE_CUSTOMER_ID;
          result = await executeMetered(provider, action, params, {
            customerId: stripeCustomerId,
            customerKey,
            userId: DEFAULT_AGENT_ID,
          });
        }

        // Log the API call for analytics (with fingerprint for anonymous users)
        const analyticsUserId = workspaceContext 
          ? workspaceContext.workspaceId 
          : `anon:${getMachineFingerprint()}`;
        
        logAPICall({
          timestamp: new Date().toISOString(),
          provider,
          action,
          type: apiType,
          userId: analyticsUserId,
          success: result.success,
          latencyMs: Date.now() - startTime,
          error: result.error,
        });

        // Log to apiLogs (single source of truth for logs + analytics)
        if (workspaceContext) {
          convex.mutation("logs:createLogInternal" as any, {
            workspaceId: workspaceContext.workspaceId as any,
            sessionToken: workspaceContext.sessionToken || "",
            provider,
            action,
            status: result.success ? "success" : "error",
            latencyMs: Date.now() - startTime,
            errorMessage: result.success ? undefined : (result.error || "Unknown error"),
          }).catch(() => {}); // fire-and-forget

          // Dual-log: also log to provider workspace (inbound)
          convex.mutation("logs:logProviderCall" as any, {
            provider,
            action,
            status: result.success ? "success" : "error",
            latencyMs: Date.now() - startTime,
            callerWorkspaceId: workspaceContext.workspaceId,
            errorMessage: result.success ? undefined : (result.error || "Unknown error"),
          }).catch(() => {}); // fire-and-forget
        }

        // Increment usage for workspace (non-free APIs only)
        if (result.success && workspaceContext && !isFreeAPI) {
          try {
            const usageResult = await convex.mutation("workspaces:incrementUsage" as any, {
              workspaceId: workspaceContext.workspaceId as any,
            }) as { success: boolean; remaining?: number };
            if (usageResult.success) {
              workspaceContext.usageRemaining = usageResult.remaining ?? -1;
              workspaceContext.usageCount = (workspaceContext.usageCount || 0) + 1;
            }

            // Track earn progress (first direct call + unique APIs)
            await trackEarnProgress(workspaceContext.workspaceId, provider, action);
          } catch (e) {
            console.error('[APIClaw] Failed to track usage:', e);
          }
        }

        // Build response with signup nudge for unregistered users
        const responseData: Record<string, unknown> = {
          status: result.success ? 'success' : 'error',
          provider: result.provider,
          action: result.action,
          type: apiType,
          ...(result.success ? { data: result.data } : { error: result.error }),
          ...(result.cost !== undefined ? { cost_sek: result.cost } : {})
        };

        // Nudge unregistered users
        if (result.success && workspaceContext && !workspaceContext.email) {
          const remaining = UNREGISTERED_CALL_LIMIT - (workspaceContext.usageCount || 0);
          if (remaining > 0 && remaining <= 3) {
            responseData._notice = `${remaining} free calls remaining. Run register_owner to unlock 50/month.`;
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(responseData, null, 2)
            }
          ],
          isError: !result.success
        };
      }

      case 'list_connected': {
        const directProviders = getConnectedProviders();
        const openProviders = listOpenAPIs();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: 'These APIs are available via call_api - no API key needed!',
                direct_call: {
                  description: 'APIs where we handle authentication',
                  providers: directProviders,
                },
                open_apis: {
                  description: 'Free, open APIs (no auth required)',
                  providers: openProviders,
                },
                usage: 'Use call_api with provider, action, and params to execute calls.'
              }, null, 2)
            }
          ]
        };
      }

      case 'capability': {
        const capabilityId = args?.capability as string;
        const action = args?.action as string;
        const params = (args?.params as Record<string, any>) || {};
        const preferences = (args?.preferences as Record<string, any>) || {};
        const subagentId = args?.subagent_id as string | undefined;
        const aiBackend = args?.ai_backend as string | undefined;
        
        // Track AI backend if provided
        if (aiBackend && workspaceContext?.sessionToken) {
          fetch('https://brilliant-puffin-712.eu-west-1.convex.cloud/api/mutation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: 'agents:updateAIBackend',
              args: {
                token: workspaceContext.sessionToken,
                subagentId: subagentId || undefined,
                aiBackend,
              },
            }),
          }).catch(() => {}); // Fire and forget
        }

        // Check if capability exists
        const exists = await hasCapability(capabilityId);
        if (!exists) {
          // Try to help with available capabilities
          const available = await listCapabilities();
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                error: `Unknown capability: ${capabilityId}`,
                available_capabilities: available.map(c => c.id),
                hint: 'Use list_capabilities to see all available capabilities.'
              }, null, 2)
            }],
            isError: true
          };
        }

        // Execute capability
        const result = await executeCapability(
          capabilityId,
          action,
          params,
          DEFAULT_AGENT_ID,
          preferences
        );

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: result.success ? 'success' : 'error',
              capability: result.capability,
              action: result.action,
              provider_used: result.providerUsed,
              fallback_attempted: result.fallbackAttempted,
              ...(result.fallbackReason ? { fallback_reason: result.fallbackReason } : {}),
              ...(result.success ? { data: result.data } : { error: result.error }),
              ...(result.cost !== undefined ? { cost: result.cost, currency: result.currency } : {}),
              latency_ms: result.latencyMs,
            }, null, 2)
          }],
          isError: !result.success
        };
      }

      case 'list_capabilities': {
        const capabilities = await listCapabilities();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: 'Available capabilities - use capability() to execute',
              capabilities,
              usage: 'capability("sms", "send", {to: "+46...", message: "Hello"})'
            }, null, 2)
          }]
        };
      }

      // ============================================
      // WORKSPACE TOOLS
      // ============================================
      
      case 'register_owner': {
        const email = args?.email as string;
        
        if (!email || !email.includes('@')) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                error: 'Invalid email address',
              }, null, 2)
            }],
            isError: true
          };
        }
        
        try {
          // Check if workspace already exists
          const existing = await convex.query("workspaces:getByEmail" as any, { email }) as { id: string; status: string; tier: string; usageCount: number; usageLimit: number } | null;

          if (existing && existing.status === 'active') {
            // Workspace exists and is active - create session directly
            const fingerprint = getMachineFingerprint();
            const sessionResult = await convex.mutation("workspaces:createAgentSession" as any, {
              workspaceId: existing.id,
              fingerprint,
            }) as { success: boolean; sessionToken?: string };

            if (sessionResult.success) {
              writeSession(sessionResult.sessionToken!, existing.id, email);
              
              // Claim anonymous usage history
              try {
                const claimResult = await convex.mutation("workspaces:claimAnonymousUsage" as any, {
                  workspaceId: existing.id,
                  machineFingerprint: fingerprint,
                }) as { success: boolean; claimedCount?: number; message?: string };
                
                if (claimResult.success && claimResult.claimedCount) {
                  console.error(`[APIClaw] ✓ Claimed ${claimResult.claimedCount} anonymous usage records`);
                }
              } catch (err) {
                // Non-critical error, just log it
                console.error('[APIClaw] Warning: Failed to claim anonymous usage:', err);
              }
              
              // Update global context
              workspaceContext = {
                sessionToken: sessionResult.sessionToken!,
                workspaceId: existing.id,
                email,
                tier: existing.tier,
                usageRemaining: existing.usageLimit - existing.usageCount,
                usageCount: existing.usageCount,
                status: existing.status,
              };
              
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'success',
                    message: `Welcome back! Authenticated as ${email}`,
                    workspace: {
                      email,
                      tier: existing.tier,
                      usageCount: existing.usageCount,
                      usageLimit: existing.usageLimit,
                    },
                  }, null, 2)
                }]
              };
            }
          }
          
          // Create workspace and magic link
          const createResult = await convex.mutation("workspaces:createWorkspace" as any, { email }) as { success: boolean; workspaceId?: string; error?: string };
          
          let workspaceId: string;
          if (createResult.success) {
            workspaceId = createResult.workspaceId!;
          } else if (createResult.error === 'workspace_exists') {
            workspaceId = createResult.workspaceId!;
          } else {
            throw new Error(createResult.error);
          }
          
          // Create magic link
          const fingerprint = getMachineFingerprint();
          const magicLinkResult = await convex.mutation("workspaces:createMagicLink" as any, {
            email,
            fingerprint,
          }) as { token: string; expiresAt: number };
          
          // Send magic link via email
          const verifyUrl = `https://apiclaw.nordsym.com/auth/verify?token=${magicLinkResult.token}`;
          
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'APIClaw <noreply@apiclaw.nordsym.com>',
              to: email,
              subject: 'Verify your APIClaw workspace',
              html: `<p>Click to verify: <a href="${verifyUrl}">${verifyUrl}</a></p><p>Expires in 15 minutes.</p>`
            })
          });
          
          if (!emailResponse.ok) {
            const errorData = await emailResponse.text();
            throw new Error(`Failed to send verification email: ${errorData}`);
          }
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'pending_verification',
                message: 'Workspace created! Check your email for verification link.',
                email,
                expires_in_minutes: 15,
                next_step: 'Check your email, click the verification link, then run check_workspace_status',
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                error: error instanceof Error ? error.message : 'Registration failed',
              }, null, 2)
            }],
            isError: true
          };
        }
      }
      
      case 'check_workspace_status': {
        // Check if we have a local session
        const session = readSession();
        
        if (!session) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'not_authenticated',
                message: 'No active session. Use register_owner to authenticate.',
              }, null, 2)
            }]
          };
        }
        
        try {
          const result = await convex.query("workspaces:getWorkspaceStatus" as any, {
            sessionToken: session.sessionToken,
          }) as { authenticated: boolean; email?: string; status?: string; tier?: string; usageCount?: number; usageLimit?: number; usageRemaining?: number; hasStripe?: boolean; createdAt?: number };
          
          if (!result.authenticated) {
            clearSession();
            workspaceContext = null;
            
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'session_expired',
                  message: 'Session expired. Use register_owner to re-authenticate.',
                }, null, 2)
              }]
            };
          }
          
          // Update global context
          workspaceContext = {
            sessionToken: session.sessionToken,
            workspaceId: session.workspaceId,
            email: result.email ?? '',
            tier: result.tier ?? 'free',
            usageRemaining: result.usageRemaining ?? 0,
            usageCount: result.usageCount ?? 0,
            status: result.status ?? 'unknown',
          };
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                workspace: {
                  email: result.email,
                  status: result.status,
                  tier: result.tier,
                  usage: {
                    count: result.usageCount,
                    limit: result.usageLimit === -1 ? 'unlimited' : result.usageLimit,
                    remaining: result.usageRemaining === -1 ? 'unlimited' : result.usageRemaining,
                  },
                  hasStripe: result.hasStripe,
                  createdAt: result.createdAt ? new Date(result.createdAt).toISOString() : undefined,
                },
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to check status',
              }, null, 2)
            }],
            isError: true
          };
        }
      }
      
      case 'remind_owner': {
        const session = readSession();
        
        if (!session) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                error: 'No workspace found. Use register_owner first.',
              }, null, 2)
            }],
            isError: true
          };
        }
        
        try {
          // Check current status
          const result = await convex.query("workspaces:getWorkspaceStatus" as any, {
            sessionToken: session.sessionToken,
          }) as { authenticated: boolean; email?: string; status?: string };
          
          if (result.authenticated && result.status === 'active') {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'already_verified',
                  message: 'Workspace is already verified and active!',
                  email: result.email,
                }, null, 2)
              }]
            };
          }
          
          // Create new magic link
          const fingerprint = getMachineFingerprint();
          const magicLinkResult = await convex.mutation("workspaces:createMagicLink" as any, {
            email: session.email,
            fingerprint,
          }) as { token: string; expiresAt: number };
          
          // TODO: Agent 2 will implement actual email sending
          const verifyUrl = `https://apiclaw.nordsym.com/auth/verify?token=${magicLinkResult.token}`;
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'reminder_sent',
                message: 'New verification link created.',
                email: session.email,
                verification_url: verifyUrl,
                expires_in_minutes: 15,
                note: 'Email sending will be implemented by Agent 2',
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to send reminder',
              }, null, 2)
            }],
            isError: true
          };
        }
      }

      // Metered Billing Tools
      case 'setup_metered_billing': {
        const { email, success_url, cancel_url } = args as {
          email: string;
          success_url?: string;
          cancel_url?: string;
        };

        if (!email) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ status: 'error', error: 'Email is required' }, null, 2)
            }],
            isError: true
          };
        }

        // Create or get customer
        const customerResult = await getOrCreateCustomer(email, email);
        if ('error' in customerResult) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ status: 'error', error: customerResult.error }, null, 2)
            }],
            isError: true
          };
        }

        // Create checkout session for metered subscription
        const checkoutResult = await createMeteredCheckoutSession(
          email,
          success_url || 'https://apiclaw.nordsym.com/billing/success',
          cancel_url || 'https://apiclaw.nordsym.com/billing/cancel'
        );

        if ('error' in checkoutResult) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ status: 'error', error: checkoutResult.error }, null, 2)
            }],
            isError: true
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'checkout_ready',
              message: 'Complete checkout to activate pay-per-call billing',
              checkout_url: checkoutResult.url,
              session_id: checkoutResult.sessionId,
              customer_id: customerResult.customerId,
              pricing: {
                per_call: '$0.002',
                billing_period: 'monthly',
                billed_at: 'end of period based on usage'
              }
            }, null, 2)
          }]
        };
      }

      case 'get_usage_summary': {
        const { subscription_id } = args as { subscription_id: string };

        if (!subscription_id) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ status: 'error', error: 'subscription_id is required' }, null, 2)
            }],
            isError: true
          };
        }

        const usage = await getUsageSummary(subscription_id);
        if ('error' in usage) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ status: 'error', error: usage.error }, null, 2)
            }],
            isError: true
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              billing_period: {
                start: new Date(usage.period.start * 1000).toISOString(),
                end: new Date(usage.period.end * 1000).toISOString()
              },
              usage: {
                total_calls: usage.totalCalls,
                price_per_call: METERED_BILLING.pricePerCall,
                estimated_cost: `$${usage.totalCost.toFixed(4)}`
              }
            }, null, 2)
          }]
        };
      }

      case 'estimate_cost': {
        const { call_count } = args as { call_count: number };

        if (!call_count || call_count < 0) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ status: 'error', error: 'Valid call_count is required' }, null, 2)
            }],
            isError: true
          };
        }

        const estimate = estimateCost(call_count);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              estimate: {
                calls: estimate.calls,
                price_per_call: `$${estimate.pricePerCall}`,
                total_cost: `$${estimate.totalCost.toFixed(4)}`,
                currency: estimate.currency
              },
              examples: {
                '100 calls': `$${(100 * METERED_BILLING.pricePerCall).toFixed(2)}`,
                '1,000 calls': `$${(1000 * METERED_BILLING.pricePerCall).toFixed(2)}`,
                '10,000 calls': `$${(10000 * METERED_BILLING.pricePerCall).toFixed(2)}`
              }
            }, null, 2)
          }]
        };
      }

      // ============================================
      // CHAIN MANAGEMENT TOOLS
      // ============================================
      
      case 'get_chain_status': {
        const chainId = args?.chain_id as string;
        
        if (!chainId) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                error: 'chain_id is required'
              }, null, 2)
            }],
            isError: true
          };
        }
        
        const chainStatus = await getChainStatus(chainId);
        
        if (chainStatus.status === 'not_found') {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                error: `Chain not found: ${chainId}`,
                hint: 'Chain states expire after 1 hour. The chain may have completed or expired.'
              }, null, 2)
            }],
            isError: true
          };
        }
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              chain: {
                chainId: chainStatus.chainId,
                executionStatus: chainStatus.status,
                ...(chainStatus.result ? {
                  result: {
                    success: chainStatus.result.success,
                    completedSteps: chainStatus.result.completedSteps,
                    totalLatencyMs: chainStatus.result.totalLatencyMs,
                    totalCost: chainStatus.result.totalCost,
                    finalResult: chainStatus.result.finalResult,
                    error: chainStatus.result.error,
                    canResume: chainStatus.result.canResume,
                    resumeToken: chainStatus.result.resumeToken,
                  }
                } : {})
              }
            }, null, 2)
          }]
        };
      }
      
      case 'resume_chain': {
        const resumeToken = args?.resume_token as string;
        const overrides = args?.overrides as Record<string, Record<string, any>> | undefined;
        const originalChain = args?.original_chain as ChainStepUnion[] | undefined;
        
        if (!resumeToken) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                error: 'resume_token is required'
              }, null, 2)
            }],
            isError: true
          };
        }
        
        // Check workspace access
        const access = checkWorkspaceAccess();
        if (!access.allowed) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                error: access.error,
                hint: 'Use register_owner to authenticate your workspace.',
              }, null, 2)
            }],
            isError: true
          };
        }
        
        try {
          // Note: The resume_chain function requires the original chain definition
          // In practice, you'd store this or require the caller to provide it
          if (!originalChain) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  error: 'original_chain is required to resume. Please provide the original chain definition.',
                  hint: 'Pass original_chain: [...] with the same chain array used in the failed execution.'
                }, null, 2)
              }],
              isError: true
            };
          }
          
          const chainDefinition: ChainDefinition = {
            steps: originalChain,
          };
          
          const chainCredentials: ChainCredentials = {
            userId: DEFAULT_AGENT_ID,
            customerKeys: {},
          };
          
          const customerKey = args?.customer_key as string | undefined;
          if (customerKey) {
            chainCredentials.customerKeys = { default: customerKey };
          }
          
          const result = await resumeChain(
            resumeToken,
            chainDefinition,
            chainCredentials,
            {}, // inputs
            overrides,
            { verbose: false }
          );
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: result.success ? 'success' : 'error',
                mode: 'chain_resumed',
                chainId: result.chainId,
                steps: result.trace.map(t => ({
                  id: t.stepId,
                  status: t.success ? 'completed' : 'failed',
                  result: t.output,
                  error: t.error,
                  latencyMs: t.latencyMs,
                })),
                finalResult: result.finalResult,
                totalLatencyMs: result.totalLatencyMs,
                totalCost: result.totalCost,
                ...(result.error ? {
                  error: result.error,
                  canResume: result.canResume,
                  resumeToken: result.resumeToken,
                } : {}),
              }, null, 2)
            }],
            isError: !result.success
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                error: error instanceof Error ? error.message : String(error),
              }, null, 2)
            }],
            isError: true
          };
        }
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: `Unknown tool: ${name}`
              }, null, 2)
            }
          ],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Start server
async function main() {
  // Check for CLI mode
  if (process.argv.includes('--cli') || process.argv.includes('-c')) {
    const { startCLI } = await import('./cli.js');
    await startCLI();
    return;
  }
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  trackStartup();
  
  // Validate session on startup
  const hasValidSession = await validateSession();

  // Register/update agent identity (fire-and-forget)
  try {
    const fingerprint = getMachineFingerprint();
    const mcpClient = detectMCPClient();
    const result = await convex.mutation("agents:ensureAgent" as any, {
      fingerprint,
      mcpClient,
      platform: process.platform,
    });
    if (result?.agentId) {
      currentAgentId = result.agentId;
    }
    // If we got a new session token and don't have one, write it
    if (result?.isNew && result?.sessionToken && !hasValidSession) {
      writeSession(result.sessionToken, result.workspaceId, "");
    }
  } catch (e) {
    console.error('[APIClaw] Agent registration failed (non-blocking):', e);
  }
  
  // Welcome message with onboarding
  console.error(`
🦞 APIClaw v1.1.5 — The API Layer for AI Agents
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ 19,000+ APIs indexed
✓ 23 categories  
✓ 9 direct-call providers ready
${hasValidSession ? `✓ Authenticated as ${workspaceContext?.email}` : '⚠ Not authenticated - use register_owner'}

Quick Start:
  ${!hasValidSession ? 'register_owner({ email: "you@example.com" })  # First, authenticate\n  ' : ''}discover_apis("send SMS to Sweden")
  discover_apis("search the web")
  call_api({ provider: "brave_search", ... })

Direct Call (no API key needed):
  list_connected()

Interactive CLI mode:
  npx @nordsym/apiclaw --cli

Docs: https://apiclaw.nordsym.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch(console.error);
