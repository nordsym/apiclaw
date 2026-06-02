#!/usr/bin/env node
/**
 * APIClaw - Agent-Native API Discovery MCP Server
 * 
 * Tools:
 * - discover_apis: Search for APIs by capability
 * - get_api_details: Get full info about an API
 * - check_balance: Check credits and active purchases
 */

import { spawn } from 'node:child_process';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { discoverAPIs, getAPIDetails, getCategories, getAllAPIs } from './discovery.js';
import { trackStartup, trackSearch, trackExecute, trackDiscovery } from './telemetry.js';
import { getBalanceSummary } from './credits.js';
import { getConnectedProviders } from './execute.js';
import { executeMetered } from './metered.js';
import { logAPICall } from './mcp-analytics.js';
import { isOpenAPI, executeOpenAPI, listOpenAPIs, getOpenAPIActions, getOpenAPIBaseUrl, getAPIClawTotalStats } from './open-apis.js';
import { CANON_STATS } from './canon-stats.js';
import { getGateway, isGatewayEnabled, type GatewayResponse } from './gateway-client.js';
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
import { requireVerifiedOwner, type WorkspaceContextLike } from './registration-guard.js';
import { emitFunnelEvent, hasLocalMarker, setLocalMarker } from './funnel-client.js';
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
const CONVEX_URL = process.env.CONVEX_URL || 'https://adventurous-avocet-799.convex.cloud';
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
let pendingRegistrationEmail: string | null = null; // Email waiting for OTP verification

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
const MAX_MCP_TOOL_RESULT_BYTES = 900_000;

type TransportCompactLimits = {
  maxDepth: number;
  maxArrayItems: number;
  maxObjectKeys: number;
  maxStringChars: number;
};

const SOFT_TRANSPORT_LIMITS: TransportCompactLimits = {
  maxDepth: 6,
  maxArrayItems: 40,
  maxObjectKeys: 50,
  maxStringChars: 12_000,
};

const HARD_TRANSPORT_LIMITS: TransportCompactLimits = {
  maxDepth: 4,
  maxArrayItems: 12,
  maxObjectKeys: 20,
  maxStringChars: 3_000,
};

function measureUtf8Bytes(text: string): number {
  return Buffer.byteLength(text, 'utf8');
}

function truncateToolString(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  const omitted = value.length - maxChars;
  return `${value.slice(0, maxChars)}\n...[truncated ${omitted} chars]`;
}

function summarizeOverflowValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[Array(${value.length})]`;
  }

  if (value && typeof value === 'object') {
    return `[Object keys=${Object.keys(value as Record<string, unknown>).length}]`;
  }

  return String(value);
}

function compactToolPayload(
  value: unknown,
  limits: TransportCompactLimits,
  depth = 0,
  seen = new WeakSet<object>(),
): unknown {
  if (typeof value === 'string') {
    return truncateToolString(value, limits.maxStringChars);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (depth >= limits.maxDepth) {
    return summarizeOverflowValue(value);
  }

  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  if (Array.isArray(value)) {
    const items = value
      .slice(0, limits.maxArrayItems)
      .map((item) => compactToolPayload(item, limits, depth + 1, seen));

    if (value.length > limits.maxArrayItems) {
      items.push(`[${value.length - limits.maxArrayItems} more items truncated]`);
    }

    return items;
  }

  const entries = Object.entries(value);
  const output: Record<string, unknown> = {};

  for (const [key, nested] of entries.slice(0, limits.maxObjectKeys)) {
    output[key] = compactToolPayload(nested, limits, depth + 1, seen);
  }

  if (entries.length > limits.maxObjectKeys) {
    output._truncated_keys = entries.length - limits.maxObjectKeys;
  }

  return output;
}

function wrapToolTransportMeta(payload: unknown, meta: Record<string, unknown>): unknown {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return {
      ...(payload as Record<string, unknown>),
      _transport: meta,
    };
  }

  return {
    data: payload,
    _transport: meta,
  };
}

function safeJsonStringify(
  payload: unknown,
  options: { pretty?: boolean; hint?: string } = {},
): string {
  const pretty = options.pretty ?? true;
  const stringify = (value: unknown, prettyPrint = pretty) =>
    JSON.stringify(value, null, prettyPrint ? 2 : 0);

  const initial = stringify(payload);
  const initialBytes = measureUtf8Bytes(initial);
  if (initialBytes <= MAX_MCP_TOOL_RESULT_BYTES) {
    return initial;
  }

  const suggestion =
    options.hint ||
    'Narrow the request, ask for a summary, paginate, or use compact=true when available.';

  const softPayload = wrapToolTransportMeta(
    compactToolPayload(payload, SOFT_TRANSPORT_LIMITS),
    {
      truncated: true,
      reason: 'Tool result exceeded the MCP transport limit and was compacted automatically.',
      original_bytes: initialBytes,
      suggestion,
    },
  );
  const softText = stringify(softPayload);
  if (measureUtf8Bytes(softText) <= MAX_MCP_TOOL_RESULT_BYTES) {
    return softText;
  }

  const hardPayload = wrapToolTransportMeta(
    compactToolPayload(payload, HARD_TRANSPORT_LIMITS),
    {
      truncated: true,
      reason: 'Tool result exceeded the MCP transport limit and was heavily compacted automatically.',
      original_bytes: initialBytes,
      suggestion,
    },
  );
  const hardText = stringify(hardPayload);
  if (measureUtf8Bytes(hardText) <= MAX_MCP_TOOL_RESULT_BYTES) {
    return hardText;
  }

  return JSON.stringify(
    {
      status: 'partial',
      preview: compactToolPayload(payload, {
        maxDepth: 2,
        maxArrayItems: 5,
        maxObjectKeys: 10,
        maxStringChars: 400,
      }),
      _transport: {
        truncated: true,
        reason: 'Tool result exceeded the MCP transport limit even after compaction.',
        original_bytes: initialBytes,
        suggestion,
      },
    },
    null,
    2,
  );
}

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
        action: "Authenticate for higher limits: npx @nordsym/apiclaw auth login"
      }, null, 2)
    };
  }

  // Check weekly limit
  if (state.weeklyCount >= ANONYMOUS_WEEKLY_LIMIT) {
    return {
      allowed: false,
      error: JSON.stringify({
        success: false,
        error: `⚡ You've hit your free tier limit (${ANONYMOUS_WEEKLY_LIMIT} calls/week).\n   Upgrade: https://apiclaw.cloud/upgrade`,
        hint: "Authenticate for 50 calls/month, or upgrade for unlimited",
        action: "Run in terminal: npx @nordsym/apiclaw auth login",
        upgrade_url: "https://apiclaw.cloud/upgrade",
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
    console.error('[APIClaw] No session found. Run `npx @nordsym/apiclaw auth login` to authenticate.');
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
    // Convex unreachable at startup (cold boot, network blip, etc.).
    // Trust the local session file rather than wiping context entirely.
    // The token will be validated on the first real API call anyway.
    console.error('[APIClaw] Convex unreachable during startup validation — using cached session:', (error as Error).message);
    const cached = readSession();
    if (cached?.sessionToken && cached?.workspaceId && cached?.email) {
      workspaceContext = {
        sessionToken: cached.sessionToken,
        workspaceId: cached.workspaceId,
        email: cached.email,
        tier: 'founder',       // conservative fallback — overwritten on next live query
        usageRemaining: 999999,
        usageCount: 0,
        status: 'active',
      };
      console.error(`[APIClaw] ✓ Restored session from cache for ${cached.email}`);
      return true;
    }
    return false;
  }
}

/**
 * Track earn progress after successful API call
 * Handles firstDirectCall and apisUsed tracking
 */
async function trackEarnProgress(workspaceId: string, provider: string, action: string): Promise<void> {
  try {
    // Track first managed-provider call
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
 * Check workspace access -- registration required for all API calls
 */
function checkWorkspaceAccess(providerId?: string): { allowed: boolean; error?: string; isAnonymous?: boolean } {
  // All API calls require registration now
  if (!workspaceContext) {
    // Before giving up, try to restore from the local session file.
    // This handles the case where validateSession() failed at startup
    // (network blip, Convex cold boot) but a valid file still exists.
    const cached = readSession();
    if (cached?.sessionToken && cached?.workspaceId && cached?.email) {
      workspaceContext = {
        sessionToken: cached.sessionToken,
        workspaceId: cached.workspaceId,
        email: cached.email,
        tier: 'founder',
        usageRemaining: 999999,
        usageCount: 0,
        status: 'active',
      };
      console.error(`[APIClaw] ✓ Lazy-restored session for ${cached.email}`);
    } else {
      return {
        allowed: false,
        error: JSON.stringify({
          status: 'agent_auth_required',
          error: 'Authentication required to call APIs.',
          message: 'APIClaw uses an agent-native auth flow. Run the CLI command below in the user\'s terminal. A browser opens, the user signs in with one click, and the CLI writes ~/.apiclaw.toml. Then re-call this tool.',
          action: 'agent_auth_required',
          command: 'npx @nordsym/apiclaw auth login',
          estimated_seconds: 15,
          fallback: 'If no browser available (SSH/headless): npx @nordsym/apiclaw auth login --email-fallback',
          legacy_action: 'register_owner ({ email: "..." }) is still supported but slower (inbox round-trip).',
          free_tier: '50 API calls/month — completely free.',
        }, null, 2),
        isAnonymous: true,
      };
    }
  }

  if (workspaceContext.status !== 'active') {
    return {
      allowed: false,
      error: `Workspace status: ${workspaceContext.status}. Please verify your email.`
    };
  }

  // No email = no calls. Full stop.
  if (!workspaceContext.email) {
    return {
      allowed: false,
      error: JSON.stringify({
        status: 'agent_auth_required',
        error: 'An account is required to use APIClaw.',
        message: 'Run `npx @nordsym/apiclaw auth login` in the user\'s terminal. Browser opens, user clicks once, CLI writes ~/.apiclaw.toml. Then re-call this tool.',
        action: 'agent_auth_required',
        command: 'npx @nordsym/apiclaw auth login',
        estimated_seconds: 15,
        fallback: 'register_owner({ email: "..." }) — legacy email magic-link flow, still works.',
      }, null, 2),
      isAnonymous: true,
    };
  }

  if (workspaceContext.usageRemaining === 0) {
    // Free tier hit weekly limit
    if (workspaceContext.tier === 'free') {
      return { 
        allowed: false, 
        error: JSON.stringify({
          success: false,
          error: `⚡ You've hit your free tier limit (${FREE_MONTHLY_LIMIT} calls/week).\n   Upgrade: https://apiclaw.cloud/upgrade`,
          hint: "Upgrade to Pro for unlimited calls",
          upgrade_url: "https://apiclaw.cloud/upgrade",
          retry_after: getNextMonthUTC()
        }, null, 2)
      };
    }
    
    // Other tiers (shouldn't happen, but handle gracefully)
    return { 
      allowed: false, 
      error: `⚡ You've hit your free tier limit (${FREE_MONTHLY_LIMIT} calls/week).\n   Upgrade: https://apiclaw.cloud/upgrade` 
    };
  }
  
  return { allowed: true, isAnonymous: false };
}

/**
 * Single enforcement entry point for every paying call path.
 * Returns either a verified workspace context or an MCP-formatted block response.
 */
function enforceOwner(channel: string):
  | { ok: true; ctx: WorkspaceContextLike }
  | { ok: false; response: { content: { type: 'text'; text: string }[]; isError: true } } {
  const result = requireVerifiedOwner(workspaceContext as WorkspaceContextLike | null);
  if (result.ok) {
    return { ok: true, ctx: result.ctx };
  }
  // Diagnostic: record why the call was blocked.
  try {
    emitFunnelEvent({
      event: 'call_api_blocked',
      workspaceId: workspaceContext?.workspaceId,
      email: workspaceContext?.email,
      fingerprint: getMachineFingerprint(),
      mcpClient: detectMCPClient(),
      platform: process.platform,
      version: process.env.npm_package_version || 'unknown',
      props: { reason: result.reason, channel },
    });
    if (result.reason === 'quota_exceeded') {
      emitFunnelEvent({
        event: 'quota_hit',
        workspaceId: workspaceContext?.workspaceId,
        email: workspaceContext?.email,
        fingerprint: getMachineFingerprint(),
        version: process.env.npm_package_version || 'unknown',
        props: { tier: workspaceContext?.tier, limit: workspaceContext?.usageCount },
      });
    }
  } catch { /* non-blocking */ }
  return {
    ok: false,
    response: {
      content: [{ type: 'text', text: JSON.stringify(result.payload, null, 2) }],
      isError: true,
    },
  };
}

// Per-process marker: ensure first_call_api_success fires once per server boot.
let firstCallEmitted = false;

/**
 * Get customer API key from environment variable
 * Convention: {PROVIDER}_API_KEY (e.g., COACCEPT_API_KEY, ELKS_API_KEY)
 */
// ─────────────────────────────────────────────────────────────────────────
// Device-auth flow.
//
// On the first call_api 401 from the gateway, the MCP server kicks off a
// browser-based magic-link signup. No keys are pasted into the install
// dialog. No terminal commands are needed. Flow:
//
//   1. We POST deviceAuth:start → get a one-time code
//   2. We open https://apiclaw.cloud/workspace?link=<code> in the user's
//      default browser
//   3. The user signs up / signs in via the existing magic-link flow
//   4. The /workspace page calls deviceAuth:complete with the new session
//   5. We poll deviceAuth:poll until the code flips to "linked", then
//      write the session to ~/.apiclaw/session
//
// Time budget: 90 seconds. If the user doesn't finish in that window the
// MCP returns an auth_pending tool result and the agent tells them to
// finish the browser tab and ask again.
// ─────────────────────────────────────────────────────────────────────────

let deviceLinkInFlight = false;

function openBrowser(url: string): void {
  try {
    const platform = process.platform;
    const cmd =
      platform === 'darwin' ? 'open' :
      platform === 'win32'  ? 'cmd'  :
      'xdg-open';
    const args =
      platform === 'win32' ? ['/c', 'start', '""', url] : [url];
    spawn(cmd, args, {
      detached: true,
      stdio: 'ignore',
      shell: platform === 'win32',
    }).unref();
  } catch (e) {
    console.error('[APIClaw] Could not open browser:', e);
  }
}

async function attemptDeviceLink(): Promise<{
  ok: boolean;
  linkUrl?: string;
  reason?: 'pending' | 'expired' | 'error';
}> {
  if (deviceLinkInFlight) {
    return { ok: false, reason: 'pending' };
  }
  deviceLinkInFlight = true;
  try {
    const startRes = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'deviceAuth:start',
        args: { fingerprint: getMachineFingerprint() },
      }),
    });
    const startBody = (await startRes.json()) as any;
    const start = startBody.value ?? startBody;
    if (!start?.code || !start?.linkUrl) {
      return { ok: false, reason: 'error' };
    }

    openBrowser(start.linkUrl);

    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 2000));
      const pollRes = await fetch(`${CONVEX_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'deviceAuth:poll',
          args: { code: start.code },
        }),
      });
      const pollBody = (await pollRes.json()) as any;
      const poll = pollBody.value ?? pollBody;
      if (poll?.status === 'linked' && poll.sessionToken) {
        try {
          writeSession(poll.sessionToken, poll.workspaceId ?? '', poll.email ?? '');
        } catch (e) {
          console.error('[APIClaw] Could not persist session:', e);
        }
        return { ok: true };
      }
      if (poll?.status === 'expired' || poll?.status === 'not_found') {
        return { ok: false, reason: 'expired', linkUrl: start.linkUrl };
      }
    }
    return { ok: false, reason: 'pending', linkUrl: start.linkUrl };
  } catch (e) {
    console.error('[APIClaw] Device link failed:', e);
    return { ok: false, reason: 'error' };
  } finally {
    deviceLinkInFlight = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Suggested-call hints for discover_apis.
//
// APILayer wraps 22 callable sub-APIs behind one provider with action slugs like
// fixer_latest, weatherstack_current, aviation. Generic discovery returns
// names like "Weatherstack" or "Frankfurter" without the provider+action
// shape an agent needs to call them. This helper inspects the natural-
// language query and surfaces an exact call recipe so the agent can skip
// the list_connected fishing trip.
// ─────────────────────────────────────────────────────────────────────────
type SuggestedCall = {
  provider: string;
  action: string;
  description: string;
  example_params: Record<string, unknown>;
  intent: string;
};

const SUGGESTED_CALL_RULES: Array<{
  match: RegExp;
  suggestion: SuggestedCall;
}> = [
  {
    match: /(exchange[\s-]?rate|currency|forex|\bfx\b|fixer|convert.*(usd|eur|sek|gbp|jpy|cny)|usd.*(eur|sek)|sek.*(usd|eur)|eur.*(usd|sek))/i,
    suggestion: {
      provider: 'apilayer',
      action: 'fixer_latest',
      description: 'Live FX rates across 170+ currencies via APILayer Fixer.',
      example_params: { symbols: 'EUR,SEK' },
      intent: 'currency exchange / FX rates',
    },
  },
  {
    match: /(weather|forecast|temperature|climate|\brain\b|\bsnow\b|\bsunny\b)/i,
    suggestion: {
      provider: 'apilayer',
      action: 'weatherstack_current',
      description: 'Real-time weather conditions for any location via APILayer Weatherstack.',
      example_params: { query: 'New York' },
      intent: 'weather / forecast',
    },
  },
  {
    match: /(flight|aviation|airline|aircraft|\biata\b|\bicao\b|airport|departure|arrival)/i,
    suggestion: {
      provider: 'apilayer',
      action: 'aviation',
      description: 'Live flight tracking, status, and aviation data via APILayer Aviation Stack.',
      example_params: { flight_iata: 'SK903' },
      intent: 'flight tracking / aviation',
    },
  },
  {
    match: /(\bip\b|geolocation|geoip|ip[\s-]?address|locate.*ip)/i,
    suggestion: {
      provider: 'apilayer',
      action: 'ipstack',
      description: 'IP geolocation, ISP, and security data via APILayer IP Stack.',
      example_params: { ip: '8.8.8.8' },
      intent: 'IP geolocation',
    },
  },
  {
    match: /(verify[\s-]?email|email.*valid|email.*deliverab)/i,
    suggestion: {
      provider: 'apilayer',
      action: 'email_verification',
      description: 'Validate email deliverability and detect disposable addresses via APILayer.',
      example_params: { email: 'name@example.com' },
      intent: 'email verification',
    },
  },
  {
    match: /(\bvat\b|tax id|vies)/i,
    suggestion: {
      provider: 'apilayer',
      action: 'vat_layer',
      description: 'Validate EU VAT numbers via APILayer.',
      example_params: { vat_number: 'LU26375245' },
      intent: 'VAT validation',
    },
  },
  {
    match: /(screenshot|capture.*website|render.*page)/i,
    suggestion: {
      provider: 'apilayer',
      action: 'screenshot',
      description: 'Render a screenshot of any URL via APILayer.',
      example_params: { url: 'https://apiclaw.cloud' },
      intent: 'website screenshot',
    },
  },
  {
    match: /(scrape|scraper|scraping|crawl|crawler|browser.*automat|extract.*page|extract.*site|browserless|firecrawl|scrapingbee)/i,
    suggestion: {
      provider: 'firecrawl',
      action: 'scrape',
      description: 'Scrape a single URL to clean markdown via Firecrawl (APIClaw owns the key).',
      example_params: { url: 'https://example.com', formats: ['markdown'] },
      intent: 'web scraping / page extraction',
    },
  },
  {
    match: /(web[\s-]?search|search.*web|search.*google|search.*engine|serp|google.*results|brave.*search|search.*the.*internet)/i,
    suggestion: {
      provider: 'brave_search',
      action: 'search',
      description: 'Live web search via Brave (APIClaw owns the key).',
      example_params: { q: 'apiclaw nordsym', count: 10 },
      intent: 'web search',
    },
  },
  {
    match: /(\bllm\b|chat[\s-]?completion|chat.*model|gpt[\s-]?\d|claude[\s-]?\d|opus|sonnet|haiku|generate.*text|language.*model|reasoning.*model)/i,
    suggestion: {
      provider: 'openrouter',
      action: 'chat',
      description: 'Route to any of 800+ LLMs via OpenRouter; or use APIClaw advisor by passing model="auto" to /v1/chat/completions.',
      example_params: { model: 'auto', messages: [{ role: 'user', content: 'Hello' }] },
      intent: 'LLM chat / completion',
    },
  },
  {
    match: /(text[\s-]?to[\s-]?speech|\btts\b|generate.*speech|voice[\s-]?clone|elevenlabs|speech.*synthesis)/i,
    suggestion: {
      provider: 'elevenlabs',
      action: 'text_to_speech',
      description: 'Generate speech audio from text via ElevenLabs (APIClaw owns the key).',
      example_params: { text: 'Hello from APIClaw.', voice_id: 'Rachel' },
      intent: 'text-to-speech',
    },
  },
  {
    match: /(transcribe|speech[\s-]?to[\s-]?text|\bstt\b|deepgram|whisper|audio.*to.*text)/i,
    suggestion: {
      provider: 'deepgram',
      action: 'transcribe',
      description: 'Transcribe audio to text via Deepgram (APIClaw owns the key).',
      example_params: { url: 'https://example.com/audio.mp3' },
      intent: 'audio transcription',
    },
  },
  {
    match: /(generate.*image|image[\s-]?generation|text[\s-]?to[\s-]?image|stable[\s-]?diffusion|sdxl|flux|midjourney|dall[\s-]?e|create.*picture)/i,
    suggestion: {
      provider: 'replicate',
      action: 'run',
      description: 'Run any open-source image/video model via Replicate (APIClaw owns the key).',
      example_params: { model: 'black-forest-labs/flux-schnell', input: { prompt: 'a lobster wearing a tiny hat' } },
      intent: 'image / video generation',
    },
  },
  {
    match: /(run.*code|sandbox|execute.*python|execute.*javascript|code.*interpreter|e2b)/i,
    suggestion: {
      provider: 'e2b',
      action: 'run_code',
      description: 'Run code in an isolated cloud sandbox via E2B (APIClaw owns the key).',
      example_params: { language: 'python', code: 'print(2+2)' },
      intent: 'code execution sandbox',
    },
  },
];

function buildSuggestedCalls(query: string): SuggestedCall[] {
  if (!query) return [];
  const seen = new Set<string>();
  const out: SuggestedCall[] = [];
  for (const rule of SUGGESTED_CALL_RULES) {
    if (rule.match.test(query)) {
      const key = `${rule.suggestion.provider}/${rule.suggestion.action}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(rule.suggestion);
      }
    }
  }
  return out;
}

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
    description: 'Find APIs by job-to-be-done. Use this when the user asks "what API can do X?", wants provider recommendations, or needs web search, scraping, email, SMS, speech, PDFs, browser automation, weather, finance, or other external capabilities.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query describing what you need (e.g., "send SMS to Sweden", "search the web", "generate speech from text")'
        },
        category: {
          type: 'string',
          description: 'Optional category filter. Categories are case-sensitive — call list_categories first to see exact names (e.g., "Utilities", "Analytics", "Development", "AI & ML", "Cloud", "Finance", "Communication", "Location", "Entertainment", "Security", "Health").',
        },
        callable_only: {
          type: 'boolean',
          description: 'Default true: only return APIs APIClaw can execute right now (2,906+ callable APIs). Set false to also see the full 26,701+ discoverable registry. Signup is required, discovery is free.',
          default: true,
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
    description: 'Inspect one provider after discovery. Good when the agent needs endpoint names, params, pricing, auth, or docs. Use compact=true to avoid oversized responses in Claude/Desktop.',
    inputSchema: {
      type: 'object',
      properties: {
        api_id: {
          type: 'string',
          description: 'The API provider ID (e.g., "openrouter", "brave_search", "elevenlabs")'
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
    name: 'list_categories',
    description: 'List API categories with total + callable counts. Lightweight by design — does NOT dump every API ID. Use discover_apis(query, category) to drill into a category.',
    inputSchema: {
      type: 'object',
      properties: {
        with_api_ids: {
          type: 'boolean',
          description: 'If true, include the full API id list per category (large response, will auto-compact). Default: false.',
          default: false,
        },
      },
      required: [],
    },
  },
  {
    name: 'call_api',
    description: `Primary execution tool. Use this to actually do the job through APIClaw: live web search, scraping, speech, LLM calls, invoices, screenshots, currency, weather, and other external API work. Requires a free workspace; if not authenticated, the response will return action="agent_auth_required" with the CLI command to run (npx @nordsym/apiclaw auth login). The legacy register_owner / verify_code flow still works as a fallback.

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
          description: 'Provider ID (e.g., "openrouter", "brave_search", "elevenlabs", "replicate", "firecrawl", "groq", "frankfurter")'
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
    description: 'Summary of providers callable right now through APIClaw with no key paste. Defaults to a compact summary (managed providers + open-API counts). Pass verbose=true only if the agent explicitly needs the full open-API list. Use discover_apis(query) for narrow lookups instead of dumping the whole catalog.',
    inputSchema: {
      type: 'object',
      properties: {
        verbose: {
          type: 'boolean',
          description: 'If true, also include the full keyless open-API list (large response, will auto-compact). Default: false.',
          default: false,
        },
        category: {
          type: 'string',
          description: 'Optional category filter for the open-API list when verbose=true.',
        },
      },
      required: [],
    },
  },
  {
    name: 'capability',
    description: 'Best default when you know the job but not the provider. Execute by intent such as sms, email, search, tts, invoice, or llm, and APIClaw picks the provider plus fallback automatically.',
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
    description: 'List high-level jobs APIClaw can do, such as sms, email, search, tts, invoice, or llm, and which providers back them.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'list_models',
    description: 'List every LLM the workspace can call through APIClaw — Anthropic, OpenAI, xAI/Grok, Groq, Mistral, Together, Cohere, Replicate, OpenRouter (800+ more), and any provider routed via the unified gateway. Returns OpenAI-compatible model objects.',
    inputSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string', description: 'Optional: filter to one provider (anthropic, openai, xai, groq, mistral, together, openrouter, …)' },
      },
    },
  },
  // ============================================
  // WORKSPACE TOOLS
  // ============================================
  {
    name: 'register_owner',
    description: 'LEGACY auth path (kept for back-compat). The canonical agent-native flow is `npx @nordsym/apiclaw auth login` — when a tool returns action="agent_auth_required", run that CLI command instead of this tool. register_owner sends a 6-digit code to the email and requires the user to paste it back via verify_code.',
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
    name: 'verify_code',
    description: 'Verify the 6-digit code sent to your email after register_owner. This completes registration and activates your workspace. Ask the user to check their email and paste the code.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'The email address used in register_owner'
        },
        code: {
          type: 'string',
          description: 'The 6-digit verification code from the email'
        }
      },
      required: ['email', 'code']
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
          default: 'https://apiclaw.cloud/billing/success'
        },
        cancel_url: {
          type: 'string',
          description: 'URL to redirect if setup is cancelled',
          default: 'https://apiclaw.cloud/billing/cancel'
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
  // CONTROL PLANE — MISSIONS
  // ============================================
  {
    name: 'start_mission',
    description: 'Start a Control Plane mission — a structured, observable orchestration that runs on APIClaw\'s runtime. Use this when the user wants to spin up a multi-step task rather than a single API call. Returns a missionId you can poll with mission_status. Legacy templates run through the hand-coded path; data-driven templates run through the v2 composition runner when template_version is pinned.',
    inputSchema: {
      type: 'object',
      properties: {
        template: {
          type: 'string',
          description: 'Template slug — call list_mission_templates to see what is available.',
        },
        template_version: {
          type: 'number',
          description: 'Optional pinned version for data-driven (v2) templates. Omit to use latest enabled.',
        },
        params: {
          type: 'object',
          description: 'Template-specific parameters (see list_mission_templates for the schema).',
        },
      },
      required: ['template'],
    },
  },
  {
    name: 'list_mission_templates',
    description: 'List the Control Plane mission templates available to your agent and the parameters each one accepts.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'discover_missions',
    description: 'Search mission templates by natural-language query. Returns ranked templates with slug, version, title, description, paramSchema, and match reasons. Ranking combines keyword relevance with live success-rate signal from providerHealth — templates whose steps call providers that have been degrading in the last 30 days slide down automatically. Use this to find the right template by intent before calling start_mission.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural-language description of what the agent wants done.' },
        max_results: { type: 'number', description: 'Default 5, max 25.', default: 5 },
      },
      required: ['query'],
    },
  },
  {
    name: 'mission_status',
    description: 'Check status, audit events, cost, and final result for a mission started via start_mission.',
    inputSchema: {
      type: 'object',
      properties: {
        mission_id: { type: 'string', description: 'Mission id from start_mission' },
      },
      required: ['mission_id'],
    },
  },
  {
    name: 'list_missions',
    description: 'List recent missions in the current workspace (most recent first).',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max rows (default 20, max 200)' },
      },
    },
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
    name: 'apiclaw',
    version: process.env.npm_package_version || '0.1.0',
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
        const isAuthenticated = !!workspaceContext;
        const helpText = `
🦞 APIClaw -- The API Layer for AI Agents
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${!isAuthenticated ? `
GET STARTED (free):
  1. register_owner({ email: "you@example.com" })  — sends 6-digit code
  2. verify_code({ email: "you@example.com", code: "123456" })  - activates workspace
` : `
STATUS: Authenticated as ${workspaceContext!.email} (${workspaceContext!.tier} tier)
`}
DISCOVER APIs (signup required, free):
  discover_apis({ query: "send SMS to Sweden" })
  discover_apis({ query: "text to speech", category: "ai" })

CALL APIs (requires free registration):
  call_api({ provider: "brave_search", action: "search", params: { q: "AI agents" } })
  call_api({ provider: "elevenlabs", action: "tts", params: { text: "Hello" } })

${CANON_STATS.discoverable.toLocaleString()}+ DISCOVERABLE | ${CANON_STATS.callable.toLocaleString()}+ CALLABLE | Discovery is free after signup | Free tier: 25 calls / month

Docs: https://apiclaw.cloud
`;

        return {
          content: [{ type: 'text', text: helpText }]
        };
      }

      case 'discover_apis': {
        const _discoverGate = enforceOwner("mcp:discover_apis");
        if (!_discoverGate.ok) return _discoverGate.response;

        const query = args?.query as string;
        const category = args?.category as string | undefined;
        const requestedMax = (args?.max_results as number) || 5;
        // Default callable_only = true. Explicit false opt-out for research/scoping use.
        const callableOnly = args?.callable_only !== false;
        const region = args?.region as string | undefined;
        const subagentId = args?.subagent_id as string | undefined;
        const aiBackend = args?.ai_backend as string | undefined;

        const startTime = Date.now();

        // Delegate to HTTP gateway /v1/discover so every door sees the same
        // canon (26,701+ discoverable / 2,906+ callable). Local registry
        // was stripped from the tarball in 2.8.3 (saved 150MB); hardcoded
        // curated set + Convex managed cache only ships ~53 entries standalone.
        // Gateway-fetch makes lokal MCP tool match HTTP + Remote MCP results.
        let results: any[] = [];
        try {
          const discoverResp = await fetch(`${CONVEX_URL}/v1/discover`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(workspaceContext?.sessionToken && {
                'X-APIClaw-Session': workspaceContext.sessionToken,
              }),
            },
            body: JSON.stringify({
              query,
              category,
              callable_only: callableOnly,
              limit: requestedMax,
            }),
          });
          if (discoverResp.ok) {
            const data: any = await discoverResp.json();
            const open = (data.apis || []).map((a: any) => ({
              provider: {
                id: String(a.name || '').toLowerCase().replace(/\s+/g, '_'),
                name: a.name,
                description: a.description,
                category: a.category,
                baseUrl: a.baseUrl,
                callable: a.callable !== false,
              },
              matchScore: 0.9,
              matchedKeywords: [],
              actions: [],
            }));
            results = open.slice(0, requestedMax);
          } else {
            // Gateway 5xx — local sparse fallback so we don't return nothing.
            results = discoverAPIs(query, { category, maxResults: requestedMax, region, callableOnly });
          }
        } catch {
          // Network failure — local sparse fallback.
          results = discoverAPIs(query, { category, maxResults: requestedMax, region, callableOnly });
        }

        const responseTimeMs = Date.now() - startTime;
        trackSearch(query, results.length, responseTimeMs);

        // Suggested-call enrichment.
        // When a query matches a known managed sub-action (APILayer's 22-callable
        // wrapper has the most non-obvious slugs), surface the exact call
        // shape so the agent doesn't have to fish for it via list_connected.
        const suggestedCalls = buildSuggestedCalls(query);

        // Log search to Convex analytics (authenticated + anonymous)
        const analyticsUserId = workspaceContext?.workspaceId || `anon:${getMachineFingerprint()}`;
        const convexUrl = CONVEX_URL;
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

          // Log discovery to provider workspaces
          // Single mutation handles both apiLogs + discoveryCount
          const PROVIDER_KEYWORDS: Record<string, string[]> = {
            apilayer: ['exchange', 'currency', 'fixer', 'weather', 'ip', 'geo', 'flight', 'aviation', 'vat', 'news', 'scrape', 'screenshot', 'pdf', 'email verif', 'phone verif', 'language', 'user agent', 'coinlayer', 'marketstack', 'positionstack', 'ipstack', 'mediastack', 'serpstack', 'userstack', 'scrapestack', 'weatherstack'],
            filestack: ['file upload', 'upload file', 'file storage', 'file picker', 'image upload', 'upload image', 'file transform', 'image transform', 'resize image', 'document upload', 'upload document', 'file delivery', 'cdn upload', 'file processing', 'ocr', 'virus scan', 'file convert', 'convert pdf', 'filestack'],
          };
          const queryLower = query.toLowerCase();
          for (const [provider, keywords] of Object.entries(PROVIDER_KEYWORDS)) {
            if (keywords.some(kw => queryLower.includes(kw))) {
              // Single call: logs to apiLogs + increments discoveryCount on matching APIs
              fetch(`${convexUrl}/api/mutation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  path: 'providers:logDiscovery',
                  args: {
                    provider,
                    query: query.substring(0, 100),
                    latencyMs: responseTimeMs,
                    callerWorkspaceId: workspaceContext?.workspaceId || 'anonymous',
                  },
                }),
              }).catch(() => {});
            }
          }
        }

        // Update AI backend tracking if provided
        if (aiBackend && workspaceContext?.sessionToken) {
          fetch('https://adventurous-avocet-799.convex.cloud/api/mutation', {
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
                text: safeJsonStringify({
                  status: 'no_results',
                  message: `No APIs found matching "${query}". Try broader terms or check available categories with list_categories.`,
                  available_categories: getCategories()
                })
              }
            ]
          };
        }

        const callableCount = results.filter((r) => (r.provider as unknown as { callable?: boolean }).callable === true).length;
        const discoveryOnlyCount = results.length - callableCount;

        return {
          content: [
            {
              type: 'text',
              text: safeJsonStringify({
                status: 'success',
                query,
                results_count: results.length,
                callable_count: callableCount,
                discovery_only_count: discoveryOnlyCount,
                ...(callableCount === 0 && !callableOnly
                  ? {
                      no_callable_match: true,
                      no_callable_match_hint:
                        'No directly-callable provider matched. Try call_api({provider:"generic", action:"request", params:{url, method, ...}}) for any keyless public endpoint, or refine the query, or call list_connected to see what APIClaw can execute right now.',
                    }
                  : {}),
                ...(suggestedCalls.length > 0
                  ? {
                      suggested_calls: suggestedCalls,
                      suggested_calls_hint:
                        'These provider+action pairs are exact matches for the query. Skip further lookups and call them directly via call_api.',
                    }
                  : {}),
                results: results.map(r => {
                  // Binary funnel: callable iff APIClaw can execute it server-side
                  // (managed adapter OR keyless open proxy). Everything else = discovery-only.
                  const anyProvider = r.provider as unknown as { callable?: boolean; auth?: string };
                  const isCallable = anyProvider.callable === true;
                  return {
                    id: r.provider.id,
                    name: r.provider.name,
                    description: r.provider.description,
                    category: r.provider.category,
                    capabilities: r.provider.capabilities,
                    pricing_model: r.provider.pricing.model,
                    has_free_tier: r.provider.pricing.free_tier,
                    agent_success_rate: r.provider.agent_success_rate,
                    relevance_score: r.relevance_score,
                    match_reasons: r.match_reasons,
                    callable: isCallable,
                    execution: isCallable
                      ? { tool: 'call_api', endpoint: '/v1/call', hint: 'APIClaw handles auth + routing.' }
                      : { tool: null, endpoint: null, hint: 'Discovery-only. See docsUrl for integration.' },
                  };
                })
              }, {
                hint: 'Lower max_results or inspect one provider at a time if you need the full discovery payload.',
              })
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
              text: safeJsonStringify({
                status: 'error',
                message: `API not found: ${apiId}`,
                hint: 'Try discover_apis to search, or list_connected for managed-provider APIs',
              })
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
              text: safeJsonStringify(
                { status: 'ok', ...api },
                {
                  pretty: false,
                  hint: 'Retry with compact=true or inspect a single endpoint if you need less metadata.',
                },
              )
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: safeJsonStringify({
                status: 'success',
                api
              }, {
                hint: 'Retry get_api_details({ api_id, compact: true }) for a smaller provider spec.',
              })
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
                active_purchases: summary.active_purchases.map(p => ({
                  id: p.id,
                  provider: p.provider_id,
                  credits_remaining: p.credits_purchased,
                  status: p.status
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'list_categories': {
        const withApiIds = args?.with_api_ids === true;
        const categories = getCategories();
        const allAPIs = getAllAPIs();

        const summary = categories
          .map((cat) => {
            const inCat = allAPIs.filter((a) => a.category === cat);
            const callable = inCat.filter((a) => {
              const anyA = a as unknown as { callable?: boolean };
              return anyA.callable === true;
            }).length;
            const entry: Record<string, unknown> = {
              category: cat,
              total: inCat.length,
              callable,
            };
            if (withApiIds) {
              entry.api_ids = inCat.map((a) => a.id);
            }
            return entry;
          })
          .sort((a, b) => (b.total as number) - (a.total as number));

        const totalAPIs = allAPIs.length;
        const totalCallable = allAPIs.filter((a) => {
          const anyA = a as unknown as { callable?: boolean };
          return anyA.callable === true;
        }).length;

        return {
          content: [
            {
              type: 'text',
              text: safeJsonStringify({
                status: 'success',
                totals: {
                  categories: categories.length,
                  apis_indexed: totalAPIs,
                  apis_callable: totalCallable,
                },
                hint: 'Use discover_apis({ query, category }) to find APIs in a specific category. Pass with_api_ids=true here only if you really need every id.',
                categories: summary,
              }, {
                hint: 'Use discover_apis({query, category}) for a narrow slice instead of every API id.',
              }),
            },
          ],
        };
      }

      case 'call_api': {
        // ============================================
        // REGISTRATION GATE: requireVerifiedOwner (single source of truth)
        // ============================================
        const gate = enforceOwner("mcp:call_api");
        if (!gate.ok) return gate.response;

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
          fetch('https://adventurous-avocet-799.convex.cloud/api/mutation', {
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
          // Gate already enforced at top of call_api via enforceOwner().
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
                text: safeJsonStringify({
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
                }, {
                  hint: 'Inspect one step at a time or reduce step outputs if the chain result is too large.',
                })
              }],
              isError: !chainResult.success
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: safeJsonStringify({
                  status: 'error',
                  mode: 'chain',
                  error: error instanceof Error ? error.message : String(error),
                })
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
              text: safeJsonStringify(dryRunResult, {
                hint: 'Use smaller params or one step at a time for a shorter preview.',
              })
            }]
          };
        }
        
        // All calls require a verified account — no free/open bypass.
        const isFreeAPI = isOpenAPI(provider); // kept for routing logic below
        const access = checkWorkspaceAccess(provider);
        if (!access.allowed) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                error: access.error,
                hint: 'Run `npx @nordsym/apiclaw auth login` to authenticate your workspace. (register_owner still works as a fallback.)',
              }, null, 2)
            }],
            isError: true
          };
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

          // Execute the confirmed action
          apiType = 'direct';

          if (isGatewayEnabled()) {
            // Route through Intelligent Gateway
            const gatewayResult = await getGateway().execute(
              pending.provider,
              pending.action,
              pending.params,
              { workspaceId: workspaceContext?.workspaceId },
            );
            result = {
              success: gatewayResult.success,
              provider: gatewayResult.provider,
              action: gatewayResult.action,
              data: gatewayResult.data,
              error: gatewayResult.error,
              cost: gatewayResult.cost,
            };
          } else {
            // Legacy: direct execution with metered billing
            const customerKey = (args?.customer_key as string) || getCustomerKey(pending.provider);
            const stripeCustomerId = (args?.stripe_customer_id as string) || process.env.APICLAW_STRIPE_CUSTOMER_ID;
            result = await executeMetered(pending.provider, pending.action, pending.params, {
              customerId: stripeCustomerId,
              customerKey,
              userId: DEFAULT_AGENT_ID,
            });

            // Legacy logging (gateway handles this when enabled)
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

            // Track earn progress (legacy path)
            if (result.success && workspaceContext) {
              await trackEarnProgress(workspaceContext.workspaceId, pending.provider, pending.action);
            }
          }

          return {
            content: [{
              type: 'text',
              text: safeJsonStringify({
                status: result.success ? 'success' : 'error',
                provider: result.provider,
                action: result.action,
                confirmed: true,
                ...(result.success ? { data: result.data } : { error: result.error }),
              }, {
                hint: 'Ask for a summary or narrower params if the confirmed result is very large.',
              })
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
        apiType = isOpenAPI(provider) ? 'open' : 'direct';

        if (isGatewayEnabled()) {
          // Route through Intelligent Gateway (handles billing, logging, analytics)
          const gatewayParams = {
            ...params,
            ...(apiType === 'open' ? { baseUrl: getOpenAPIBaseUrl(provider, action, params) } : {}),
          };
          const gatewayResult = await getGateway().execute(
            provider,
            action,
            gatewayParams,
            { workspaceId: workspaceContext?.workspaceId },
          );
          result = {
            success: gatewayResult.success,
            provider: gatewayResult.provider,
            action: gatewayResult.action,
            data: gatewayResult.data,
            error: gatewayResult.error,
            cost: gatewayResult.cost,
          };
        } else {
          // Legacy: direct local execution
          if (apiType === 'open') {
            result = await executeOpenAPI(provider, action, params);
          } else {
            const customerKey = (args?.customer_key as string) || getCustomerKey(provider);
            const stripeCustomerId = (args?.stripe_customer_id as string) || process.env.APICLAW_STRIPE_CUSTOMER_ID;
            result = await executeMetered(provider, action, params, {
              customerId: stripeCustomerId,
              customerKey,
              userId: DEFAULT_AGENT_ID,
            });
          }

          // Legacy logging (gateway handles all of this when enabled)
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

            convex.mutation("logs:logProviderCall" as any, {
              provider,
              action,
              status: result.success ? "success" : "error",
              latencyMs: Date.now() - startTime,
              callerWorkspaceId: workspaceContext.workspaceId,
              errorMessage: result.success ? undefined : (result.error || "Unknown error"),
            }).catch(() => {}); // fire-and-forget
          }

          // Increment usage for workspace (non-free APIs only, legacy path)
          if (result.success && workspaceContext && !isFreeAPI) {
            try {
              const usageResult = await convex.mutation("workspaces:incrementUsage" as any, {
                workspaceId: workspaceContext.workspaceId as any,
              }) as { success: boolean; remaining?: number };
              if (usageResult.success) {
                workspaceContext.usageRemaining = usageResult.remaining ?? -1;
                workspaceContext.usageCount = (workspaceContext.usageCount || 0) + 1;
              }

              if (currentAgentId) {
                convex.mutation("agents:incrementAgentCalls" as any, { agentId: currentAgentId as any }).catch(() => {});
              }

              await trackEarnProgress(workspaceContext.workspaceId, provider, action);
            } catch (e) {
              console.error('[APIClaw] Failed to track usage:', e);
            }
          }
        }

        // When gateway is enabled, still update local workspace context for nudge logic
        if (isGatewayEnabled() && result.success && workspaceContext && !isFreeAPI) {
          workspaceContext.usageCount = (workspaceContext.usageCount || 0) + 1;
        }

        // Funnel: call_api_error (provider-level failure)
        if (!result.success && workspaceContext) {
          emitFunnelEvent({
            event: 'call_api_error',
            workspaceId: workspaceContext.workspaceId,
            email: workspaceContext.email,
            fingerprint: getMachineFingerprint(),
            version: process.env.npm_package_version || 'unknown',
            props: {
              provider: result.provider || provider,
              action: result.action || action,
              errorCode: (result.error || '').slice(0, 80) || 'unknown',
            },
          });
        }

        // Funnel: first_call_api_success (once per workspace, deduped server-side)
        if (result.success && workspaceContext && !isFreeAPI && !firstCallEmitted) {
          firstCallEmitted = true;
          emitFunnelEvent({
            event: 'first_call_api_success',
            email: workspaceContext.email,
            workspaceId: workspaceContext.workspaceId,
            sessionToken: workspaceContext.sessionToken,
            fingerprint: getMachineFingerprint(),
            mcpClient: detectMCPClient(),
            platform: process.platform,
            version: process.env.npm_package_version || 'unknown',
            dedupeKey: `first_call:${workspaceContext.workspaceId}`,
            props: { provider, action, channel: 'mcp:call_api' },
          });
        }

        // Workspace-required path: gateway returned 401 because no session.
        // Open a browser to /workspace?link=CODE, poll for the user to
        // sign up / sign in, then retry the call. No keys, no terminal.
        if (!result.success && (result as any).authRequired) {
          const ar = (result as any).authRequired as {
            message: string;
            signupUrl: string;
            docsUrl?: string;
            freeTierCalls?: number;
          };

          const link = await attemptDeviceLink();

          if (link.ok) {
            // We have a fresh session. Retry the gateway call once.
            const retry = await getGateway().execute(provider, action, params, {});
            if (retry.success) {
              return {
                content: [
                  {
                type: 'text',
                text: safeJsonStringify({
                  status: 'success',
                  message: 'Linked APIClaw to your workspace and ran the call.',
                  provider: retry.provider,
                      action: retry.action,
                      type: apiType,
                    data: retry.data,
                    ...(retry.cost !== undefined ? { cost_sek: retry.cost } : {}),
                    }, {
                      hint: 'Retry with narrower params or ask for a summary if the linked-call result is too large.',
                    }),
                  },
                ],
              };
            }
            // Linked but call still failed — fall through to error path
          }

          // Browser opened, user didn't finish in time. Tell agent + user.
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'auth_pending',
                  message:
                    'Opened apiclaw.cloud/workspace in your browser. Sign in with your email to link this MCP server, then ask me to retry the call.',
                  action_required:
                    'Tell the user a browser tab opened with the APIClaw signup. After they sign in, the link is automatic — no key paste needed. Ask them to retry the original prompt once the page shows "linked".',
                  link_url: link.linkUrl,
                  free_tier_calls: ar.freeTierCalls ?? 25,
                  provider,
                  action,
                }, null, 2),
              },
            ],
            isError: true,
          };
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
            responseData._notice = `${remaining} free calls remaining. Run \`npx @nordsym/apiclaw auth login\` to unlock more.`;
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: safeJsonStringify(responseData, {
                hint: 'Narrow params, paginate, or ask for a summarized result if the full dataset is too large.',
              })
            }
          ],
          isError: !result.success
        };
      }

      case 'list_connected': {
        const verbose = args?.verbose === true;
        const filterCategory = typeof args?.category === 'string' ? (args.category as string) : undefined;

        const directProviders = getConnectedProviders();
        const openProviders = listOpenAPIs();

        // Cheap top-N "what kind of open APIs are there" rollup so the agent
        // gets a useful narrative without 9k entries.
        const allAPIs = getAllAPIs();
        const openCategoryCounts: Record<string, number> = {};
        for (const a of allAPIs) {
          const anyA = a as unknown as { callable?: boolean; category?: string };
          if (anyA.callable === true && anyA.category) {
            openCategoryCounts[anyA.category] = (openCategoryCounts[anyA.category] || 0) + 1;
          }
        }
        const topOpenCategories = Object.entries(openCategoryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12)
          .map(([category, count]) => ({ category, callable: count }));

        const summary = {
          status: 'success',
          message: 'APIClaw can execute these RIGHT NOW — no key paste, no integration code.',
          counts: {
            discoverable: CANON_STATS.discoverable,
            callable: CANON_STATS.callable,
            managed_brands: CANON_STATS.managed_brands,
            managed_directcallconfigs: CANON_STATS.managed_directcallconfigs,
          },
          managed_providers: {
            description: 'APIClaw owns the keys. Free tier: 25 calls/month across the whole platform, then pay-as-you-go (provider cost + 15%).',
            providers: directProviders,
          },
          open_apis_summary: {
            description: 'Keyless public APIs proxied via call_api({provider, action, params}). Free.',
            total_providers: openProviders.length,
            top_categories: topOpenCategories,
            generic_passthrough: {
              hint: 'Use call_api({provider:"generic", action:"request", params:{url, method, headers, query, body}}) to hit any keyless public endpoint not curated below.',
            },
          },
          usage: 'discover_apis(query) for narrow search. call_api(provider, action, params) to execute. Set verbose=true to also see the full open-API list.',
        } as Record<string, unknown>;

        if (verbose) {
          const filtered = filterCategory
            ? allAPIs.filter((a) => {
                const anyA = a as unknown as { callable?: boolean; category?: string };
                return anyA.callable === true && anyA.category === filterCategory;
              }).map((a) => ({
                provider: (a as unknown as { id: string }).id,
                name: (a as unknown as { name: string }).name,
                category: (a as unknown as { category?: string }).category,
              }))
            : openProviders;
          summary.open_apis_full = {
            description: filterCategory
              ? `Open APIs in category "${filterCategory}".`
              : 'Full keyless open-API list (auto-compacted if oversized; prefer discover_apis for narrow lookups).',
            count: filtered.length,
            providers: filtered,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: safeJsonStringify(summary, {
                hint: 'Use discover_apis(query) or capability() for a narrower slice instead of listing everything.',
              }),
            },
          ],
        };
      }

      case 'capability': {
        // Registration gate: requireVerifiedOwner (single source of truth)
        const capGate = enforceOwner("mcp:capability");
        if (!capGate.ok) return capGate.response;

        const capabilityId = args?.capability as string;
        const action = args?.action as string;
        const params = (args?.params as Record<string, any>) || {};
        const preferences = (args?.preferences as Record<string, any>) || {};
        const subagentId = args?.subagent_id as string | undefined;
        const aiBackend = args?.ai_backend as string | undefined;

        // Track AI backend if provided
        if (aiBackend && workspaceContext?.sessionToken) {
          fetch('https://adventurous-avocet-799.convex.cloud/api/mutation', {
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
              text: safeJsonStringify({
                status: 'error',
                error: `Unknown capability: ${capabilityId}`,
                available_capabilities: available.map(c => c.id),
                hint: 'Use list_capabilities to see all available capabilities.'
              })
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
            text: safeJsonStringify({
              status: result.success ? 'success' : 'error',
              capability: result.capability,
              action: result.action,
              provider_used: result.providerUsed,
              fallback_attempted: result.fallbackAttempted,
              ...(result.fallbackReason ? { fallback_reason: result.fallbackReason } : {}),
              ...(result.success ? { data: result.data } : { error: result.error }),
              ...(result.cost !== undefined ? { cost: result.cost, currency: result.currency } : {}),
              latency_ms: result.latencyMs,
            }, {
              hint: 'Use more specific params or one capability call at a time for a smaller payload.',
            })
          }],
          isError: !result.success
        };
      }

      case 'list_capabilities': {
        const capabilities = await listCapabilities();

        return {
          content: [{
            type: 'text',
            text: safeJsonStringify({
              status: 'success',
              message: 'Available capabilities - use capability() to execute',
              capabilities,
              usage: 'capability("sms", "send", {to: "+46...", message: "Hello"})'
            }, {
              hint: 'If this list is too broad, ask for a specific capability like search, sms, email, tts, invoice, or llm.',
            })
          }]
        };
      }

      case 'list_models': {
        const provider = typeof args?.provider === 'string' ? args.provider : '';
        const q = provider ? `?provider=${encodeURIComponent(provider)}` : '';
        const baseUrl = process.env.APICLAW_GATEWAY_URL ||
          (CONVEX_URL.includes('convex.cloud')
            ? CONVEX_URL.replace('.convex.cloud', '.convex.site')
            : 'https://adventurous-avocet-799.convex.site');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (workspaceContext?.sessionToken) {
          headers['X-APIClaw-Session'] = workspaceContext.sessionToken;
        }
        const res = await fetch(`${baseUrl}/v1/models${q}`, { headers });
        const data = await res.json();
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          isError: !res.ok,
        };
      }

      // ============================================
      // WORKSPACE TOOLS
      // ============================================
      
      case 'register_owner': {
        const email = args?.email as string;

        if (!email || !email.includes('@')) {
          emitFunnelEvent({
            event: 'register_owner_failed',
            email,
            fingerprint: getMachineFingerprint(),
            mcpClient: detectMCPClient(),
            version: process.env.npm_package_version || 'unknown',
            props: { reason: 'invalid_email' },
          });
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
          // Check if workspace already exists and is active -- auto-login
          const existing = await convex.query("workspaces:getByEmail" as any, { email }) as { id: string; status: string; tier: string; usageCount: number; usageLimit: number } | null;

          if (existing && existing.status === 'active') {
            const fingerprint = getMachineFingerprint();
            const sessionResult = await convex.mutation("workspaces:createAgentSession" as any, {
              workspaceId: existing.id,
              fingerprint,
            }) as { success: boolean; sessionToken?: string };

            if (sessionResult.success) {
              writeSession(sessionResult.sessionToken!, existing.id, email);

              try {
                const claimResult = await convex.mutation("workspaces:claimAnonymousUsage" as any, {
                  workspaceId: existing.id,
                  machineFingerprint: fingerprint,
                }) as { success: boolean; claimedCount?: number };
                if (claimResult.success && claimResult.claimedCount) {
                  console.error(`[APIClaw] Claimed ${claimResult.claimedCount} anonymous usage records`);
                }
              } catch (_) {}

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

          // New user or pending workspace -- send OTP
          const fingerprint = getMachineFingerprint();
          const otpResult = await convex.mutation("workspaces:createOTP" as any, {
            email,
            fingerprint,
          }) as { code: string; expiresAt: number };

          // Send OTP email
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'APIClaw <noreply@apiclaw.cloud>',
              to: email,
              subject: `Your APIClaw verification code: ${otpResult.code}`,
              html: `
                <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
                  <div style="text-align: center; margin-bottom: 32px;">
                    <span style="font-size: 48px;">🦞</span>
                  </div>
                  <h1 style="font-size: 24px; font-weight: 700; color: #0A0A0A; text-align: center; margin-bottom: 8px;">Your verification code</h1>
                  <p style="font-size: 16px; color: #525252; text-align: center; margin-bottom: 32px;">Paste this code in your terminal to activate APIClaw.</p>
                  <div style="background: #F5F5F5; border: 1px solid #E5E5E5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                    <code style="font-size: 36px; font-weight: 700; letter-spacing: 0.3em; color: #EF4444; font-family: 'JetBrains Mono', monospace;">${otpResult.code}</code>
                  </div>
                  <p style="font-size: 13px; color: #737373; text-align: center;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
                  <hr style="border: none; border-top: 1px solid #E5E5E5; margin: 32px 0 16px;" />
                  <p style="font-size: 12px; color: #A3A3A3; text-align: center;">APIClaw -- The API Layer For AI Agents</p>
                </div>
              `
            })
          });

          if (!emailResponse.ok) {
            const errorData = await emailResponse.text();
            emitFunnelEvent({
              event: 'register_owner_failed',
              email,
              fingerprint: getMachineFingerprint(),
              mcpClient: detectMCPClient(),
              version: process.env.npm_package_version || 'unknown',
              props: { reason: 'email_send_failed' },
            });
            throw new Error(`Failed to send verification email: ${errorData}`);
          }

          // Store pending email for verify_code
          pendingRegistrationEmail = email;

          // Funnel: register_owner
          emitFunnelEvent({
            event: 'register_owner',
            email,
            fingerprint: getMachineFingerprint(),
            mcpClient: detectMCPClient(),
            platform: process.platform,
            version: process.env.npm_package_version || 'unknown',
          });

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'code_sent',
                message: `Verification code sent to ${email}`,
                next_step: 'Ask the user to check their email for a 6-digit code, then call verify_code with the email and code.',
                email,
                expires_in_minutes: 10,
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

      case 'verify_code': {
        const email = (args?.email as string) || pendingRegistrationEmail;
        const code = args?.code as string;

        if (!email || !code) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                error: 'Both email and code are required.',
                hint: 'Call register_owner first to receive a verification code.',
              }, null, 2)
            }],
            isError: true
          };
        }

        try {
          const fingerprint = getMachineFingerprint();
          const result = await convex.mutation("workspaces:verifyOTP" as any, {
            email,
            code: code.trim(),
            fingerprint,
          }) as {
            success: boolean;
            error?: string;
            message?: string;
            isNewUser?: boolean;
            sessionToken?: string;
            workspace?: { id: string; email: string; tier: string; status: string; usageCount: number; usageLimit: number }
          };

          if (!result.success) {
            // Increment attempt counter
            try {
              await convex.mutation("workspaces:incrementOTPAttempt" as any, { email, code: code.trim() });
            } catch (_) {}

            const reason =
              result.error === 'code_expired' ? 'expired'
              : result.error === 'attempts_exceeded' ? 'attempts_exceeded'
              : 'invalid';
            emitFunnelEvent({
              event: 'verify_code_failed',
              email,
              fingerprint: getMachineFingerprint(),
              mcpClient: detectMCPClient(),
              version: process.env.npm_package_version || 'unknown',
              props: { reason },
            });

            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  status: 'error',
                  error: result.message || 'Verification failed',
                  hint: result.error === 'code_expired'
                    ? 'Run register_owner again to get a new code.'
                    : 'Check the code and try again.',
                }, null, 2)
              }],
              isError: true
            };
          }

          // Success! Save session
          writeSession(result.sessionToken!, result.workspace!.id, result.workspace!.email);

          // Claim anonymous usage
          try {
            const claimResult = await convex.mutation("workspaces:claimAnonymousUsage" as any, {
              workspaceId: result.workspace!.id,
              machineFingerprint: fingerprint,
            }) as { success: boolean; claimedCount?: number };
            if (claimResult.success && claimResult.claimedCount) {
              console.error(`[APIClaw] Claimed ${claimResult.claimedCount} anonymous usage records`);
            }
          } catch (_) {}

          // Update global context
          workspaceContext = {
            sessionToken: result.sessionToken!,
            workspaceId: result.workspace!.id,
            email: result.workspace!.email,
            tier: result.workspace!.tier,
            usageRemaining: result.workspace!.usageLimit - result.workspace!.usageCount,
            usageCount: result.workspace!.usageCount,
            status: result.workspace!.status,
          };

          pendingRegistrationEmail = null;

          // Funnel: verify_code (dedupe per workspace so re-verifies don't double-count)
          emitFunnelEvent({
            event: 'verify_code',
            email: result.workspace!.email,
            workspaceId: result.workspace!.id,
            fingerprint: getMachineFingerprint(),
            sessionToken: result.sessionToken,
            mcpClient: detectMCPClient(),
            platform: process.platform,
            version: process.env.npm_package_version || 'unknown',
            dedupeKey: `verify_code:${result.workspace!.id}`,
            props: { isNewUser: !!result.isNewUser },
          });

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: result.isNewUser
                  ? `Welcome to APIClaw! Workspace activated for ${result.workspace!.email}`
                  : `Welcome back! Authenticated as ${result.workspace!.email}`,
                workspace: {
                  email: result.workspace!.email,
                  tier: result.workspace!.tier,
                  usageCount: result.workspace!.usageCount,
                  usageLimit: result.workspace!.usageLimit,
                },
                ready: 'You can now use discover_apis and call_api.',
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                error: error instanceof Error ? error.message : 'Verification failed',
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
          const verifyUrl = `https://apiclaw.cloud/auth/verify?token=${magicLinkResult.token}`;
          
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
          success_url || 'https://apiclaw.cloud/billing/success',
          cancel_url || 'https://apiclaw.cloud/billing/cancel'
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
      // CONTROL PLANE — MISSIONS
      // ============================================

      case 'list_mission_templates': {
        const url = process.env.APICLAW_GATEWAY_URL ||
          (CONVEX_URL.includes('convex.cloud')
            ? CONVEX_URL.replace('.convex.cloud', '.convex.site')
            : 'https://adventurous-avocet-799.convex.site');
        const res = await fetch(`${url}/v1/missions/templates`);
        const data = await res.json();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      case 'discover_missions': {
        const query = args?.query as string;
        const maxResults = (args?.max_results as number) ?? 5;
        if (!query) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: 'query is required' }, null, 2) }],
            isError: true,
          };
        }
        const baseUrl = process.env.APICLAW_GATEWAY_URL ||
          (CONVEX_URL.includes('convex.cloud')
            ? CONVEX_URL.replace('.convex.cloud', '.convex.site')
            : 'https://adventurous-avocet-799.convex.site');
        const res = await fetch(
          `${baseUrl}/v1/missions/discover?query=${encodeURIComponent(query)}&max_results=${maxResults}`,
        );
        const data = await res.json();
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          isError: !res.ok,
        };
      }

      case 'start_mission': {
        const template = args?.template as string;
        const params = (args?.params as Record<string, unknown>) ?? {};
        if (!template) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: 'template is required', hint: 'call list_mission_templates' }, null, 2) }],
            isError: true,
          };
        }
        const ctx = workspaceContext;
        if (!ctx?.sessionToken) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: 'unauthenticated', hint: 'register_owner first' }, null, 2) }],
            isError: true,
          };
        }
        const baseUrl = process.env.APICLAW_GATEWAY_URL ||
          (CONVEX_URL.includes('convex.cloud')
            ? CONVEX_URL.replace('.convex.cloud', '.convex.site')
            : 'https://adventurous-avocet-799.convex.site');
        const res = await fetch(`${baseUrl}/v1/missions/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-APIClaw-Session': ctx.sessionToken,
          },
          body: JSON.stringify({ template, params, templateVersion: args?.template_version }),
        });
        const data = (await res.json()) as { missionId?: string; status?: string; isInternal?: boolean; poll?: string };
        if (!res.ok) {
          return {
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
            isError: true,
          };
        }
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              ...data,
              hint: `Poll with mission_status({ mission_id: "${data.missionId}" }) until status is "completed".`,
            }, null, 2),
          }],
        };
      }

      case 'mission_status': {
        const missionId = args?.mission_id as string;
        if (!missionId) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: 'mission_id required' }, null, 2) }],
            isError: true,
          };
        }
        const ctx = workspaceContext;
        if (!ctx?.sessionToken) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: 'unauthenticated' }, null, 2) }],
            isError: true,
          };
        }
        const baseUrl = process.env.APICLAW_GATEWAY_URL ||
          (CONVEX_URL.includes('convex.cloud')
            ? CONVEX_URL.replace('.convex.cloud', '.convex.site')
            : 'https://adventurous-avocet-799.convex.site');
        const res = await fetch(`${baseUrl}/v1/missions/${encodeURIComponent(missionId)}`, {
          headers: { 'X-APIClaw-Session': ctx.sessionToken },
        });
        const data = await res.json();
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          isError: !res.ok,
        };
      }

      case 'list_missions': {
        const limit = (args?.limit as number) ?? 20;
        const ctx = workspaceContext;
        if (!ctx?.sessionToken) {
          return {
            content: [{ type: 'text', text: JSON.stringify({ error: 'unauthenticated' }, null, 2) }],
            isError: true,
          };
        }
        const baseUrl = process.env.APICLAW_GATEWAY_URL ||
          (CONVEX_URL.includes('convex.cloud')
            ? CONVEX_URL.replace('.convex.cloud', '.convex.site')
            : 'https://adventurous-avocet-799.convex.site');
        const res = await fetch(`${baseUrl}/v1/missions?limit=${limit}`, {
          headers: { 'X-APIClaw-Session': ctx.sessionToken },
        });
        const data = await res.json();
        return {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          isError: !res.ok,
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
            text: safeJsonStringify({
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
            }, {
              hint: 'Inspect one chain step or ask for a shorter status summary if needed.',
            })
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
        
        // Registration gate: requireVerifiedOwner (single source of truth)
        const resumeGate = enforceOwner("mcp:resume_chain");
        if (!resumeGate.ok) return resumeGate.response;

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
              text: safeJsonStringify({
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
              }, {
                hint: 'Inspect one resumed step at a time or reduce step outputs if the trace is too large.',
              })
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

  // Funnel: first_run (once per fingerprint, persisted across restarts)
  try {
    const fp = getMachineFingerprint();
    const mcpClient = detectMCPClient();
    const version = process.env.npm_package_version || 'unknown';
    const dedupeKey = `first_run:${fp}`;
    if (!hasLocalMarker(dedupeKey)) {
      emitFunnelEvent({
        event: 'first_run',
        fingerprint: fp,
        mcpClient,
        platform: process.platform,
        version,
        dedupeKey,
      });
      setLocalMarker(dedupeKey);
    }
  } catch {
    /* non-blocking */
  }

  // Validate session on startup
  const hasValidSession = await validateSession();

  // Register/update agent identity (fire-and-forget)
  try {
    const fingerprint = getMachineFingerprint();
    const mcpClient = detectMCPClient();
    const existingSession = readSession();
    const result = await convex.mutation("agents:ensureAgent" as any, {
      fingerprint,
      mcpClient,
      platform: process.platform,
      ...(existingSession?.sessionToken ? { sessionToken: existingSession.sessionToken } : {}),
    });
    if (result?.agentId) {
      currentAgentId = result.agentId;
    }
    // Only write a new anonymous session if no valid session file exists.
    // Never overwrite a file that has an email — that would cause the next
    // startup to read email:"" → delete the file → lose auth entirely.
    if (result?.isNew && result?.sessionToken && !hasValidSession) {
      const existingFile = readSession();
      if (!existingFile) {
        writeSession(result.sessionToken, result.workspaceId, "");
      }
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
✓ 9 managed providers ready
${hasValidSession ? `✓ Authenticated as ${workspaceContext?.email}` : '⚠ Not authenticated - use register_owner'}

Quick Start:
  ${!hasValidSession ? 'register_owner({ email: "you@example.com" })  # First, authenticate\n  ' : ''}discover_apis("send SMS to Sweden")
  discover_apis("search the web")
  call_api({ provider: "brave_search", ... })

Managed (no API key needed — APIClaw holds them):
  list_connected()

Interactive CLI mode:
  npx @nordsym/apiclaw --cli

Docs: https://apiclaw.cloud
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch(console.error);
