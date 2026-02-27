/**
 * APIClaw Analytics - Track all API usage
 * Both Direct Call and Open API calls are logged here
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface APICallLog {
  timestamp: string;
  provider: string;
  action: string;
  type: 'direct' | 'open';
  userId?: string;
  success: boolean;
  latencyMs?: number;
  error?: string;
}

// Log directory
const LOG_DIR = join(homedir(), '.apiclaw', 'logs');
const LOG_FILE = join(LOG_DIR, 'api-calls.jsonl');

// Ensure log directory exists
function ensureLogDir(): void {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Log an API call
 */
export function logAPICall(log: APICallLog): void {
  try {
    ensureLogDir();
    const line = JSON.stringify(log) + '\n';
    appendFileSync(LOG_FILE, line);
  } catch (e) {
    // Silent fail - don't break API calls for logging errors
    console.error('[APIClaw Analytics] Failed to log:', e);
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
