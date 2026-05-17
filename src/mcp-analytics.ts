/**
 * APIClaw Analytics - Track all API usage
 * Both managed and Open API calls are logged here
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { ConvexHttpClient } from 'convex/browser';
import { api } from './types/convex-api.js';

export interface APICallLog {
  timestamp: string;
  provider: string;
  action: string;
  type: 'direct' | 'open';
  userId?: string;
  success: boolean;
  latencyMs?: number;
  error?: string;
  metadata?: {
    product?: string;
    [key: string]: any;
  };
}

// Log directory
const LOG_DIR = join(homedir(), '.apiclaw', 'logs');
const LOG_FILE = join(LOG_DIR, 'api-calls.jsonl');

// Convex client (lazy init)
let convexClient: ConvexHttpClient | null = null;

function getConvexClient(): ConvexHttpClient | null {
  if (convexClient) return convexClient;
  
  const convexUrl = process.env.APICLAW_CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return null;
  
  try {
    convexClient = new ConvexHttpClient(convexUrl);
    return convexClient;
  } catch (e) {
    console.error('[APIClaw Analytics] Failed to init Convex client:', e);
    return null;
  }
}

// Ensure log directory exists
function ensureLogDir(): void {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Log an API call to local file AND Convex
 */
export function logAPICall(log: APICallLog): void {
  // 1. Local file (existing behavior)
  try {
    ensureLogDir();
    const line = JSON.stringify(log) + '\n';
    appendFileSync(LOG_FILE, line);
  } catch (e) {
    console.error('[APIClaw Analytics] Failed to log to file:', e);
  }
  
  // 2. Send to Convex (new - includes anonymous usage)
  sendToConvex(log).catch(() => {}); // Fire and forget
}

/**
 * Send analytics event to Convex
 * Works for both authenticated and anonymous users
 */
async function sendToConvex(log: APICallLog): Promise<void> {
  const client = getConvexClient();
  if (!client) return;
  
  try {
    await client.mutation(api.analytics.log, {
      event: 'api_call',
      provider: log.provider,
      query: log.action, // Store action as query field
      identifier: log.userId || 'anonymous',
      metadata: {
        type: log.type,
        success: log.success,
        latencyMs: log.latencyMs,
        error: log.error,
        timestamp: log.timestamp,
        ...log.metadata, // Include product and any other metadata
      },
    });
  } catch (e) {
    // Silent fail - don't break API calls for logging errors
    console.error('[APIClaw Analytics] Failed to send to Convex:', e);
  }
}

/**
 * Webhook for real-time analytics (optional)
 * Set APICLAW_ANALYTICS_WEBHOOK env var to enable
 */
export async function sendToWebhook(log: APICallLog): Promise<void> {
  const webhookUrl = process.env.APICLAW_ANALYTICS_WEBHOOK;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
  } catch (e) {
    // Silent fail
  }
}

/**
 * Track API call with timing
 */
export async function trackAPICall<T>(
  provider: string,
  action: string,
  type: 'direct' | 'open',
  userId: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  let success = true;
  let error: string | undefined;

  try {
    return await fn();
  } catch (e: any) {
    success = false;
    error = e.message;
    throw e;
  } finally {
    const log: APICallLog = {
      timestamp: new Date().toISOString(),
      provider,
      action,
      type,
      userId,
      success,
      latencyMs: Date.now() - start,
      error,
    };

    logAPICall(log);
    sendToWebhook(log).catch(() => {}); // Fire and forget
  }
}
