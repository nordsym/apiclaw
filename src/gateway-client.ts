/**
 * APIClaw Gateway Client - Thin HTTP client for the Intelligent Gateway
 *
 * Routes all API execution through POST /v1/execute on Convex,
 * replacing local executeOpenAPI / executeMetered calls.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { emitFunnelEvent } from './funnel-client.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GatewayResponse {
  success: boolean;
  provider: string;
  action: string;
  data?: any;
  error?: string;
  cost?: number;
  /**
   * Set when the gateway rejected the call because the workspace was missing
   * (authMethod=anonymous in enforce mode). Carries the signup nudge fields
   * so the MCP server can surface a clean message instead of raw JSON.
   */
  authRequired?: {
    message: string;
    signupUrl: string;
    docsUrl?: string;
    freeTierCalls?: number;
  };
  _apiclaw?: {
    latencyMs: number;
    route: string;
    gateway: boolean;
    model?: string;
  };
}

export interface GatewayExecuteOptions {
  workspaceId?: string;
  stream?: boolean;
  routeOverride?: string;
}

// ---------------------------------------------------------------------------
// Secret resolution
// ---------------------------------------------------------------------------

function resolveInternalSecret(): string {
  // 1. Environment variable
  const envSecret = process.env.APICLAW_INTERNAL_SECRET;
  if (envSecret) return envSecret;

  // 2. File on disk
  try {
    const secretPath = join(homedir(), '.secrets', 'apiclaw-internal-secret');
    return readFileSync(secretPath, 'utf-8').trim();
  } catch {
    // File doesn't exist or unreadable
  }

  // 3. Fallback (will fail auth, which is correct)
  return '';
}

// ---------------------------------------------------------------------------
// Feature flag
// ---------------------------------------------------------------------------

/**
 * Returns true if gateway routing is enabled.
 * Default: enabled. Set APICLAW_USE_GATEWAY=false to disable.
 */
export function isGatewayEnabled(): boolean {
  const flag = process.env.APICLAW_USE_GATEWAY;
  if (flag === undefined || flag === '') return true; // default on
  return flag.toLowerCase() !== 'false';
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const GATEWAY_BASE = 'https://adventurous-avocet-799.convex.site';
const GATEWAY_TIMEOUT_MS = 30_000;

export class GatewayClient {
  private baseUrl: string;
  private internalSecret: string;

  constructor() {
    this.baseUrl = GATEWAY_BASE;
    this.internalSecret = resolveInternalSecret();
  }

  async execute(
    provider: string,
    action: string,
    params: Record<string, any>,
    options?: GatewayExecuteOptions,
  ): Promise<GatewayResponse> {
    const url = `${this.baseUrl}/v1/execute`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-APIClaw-Internal': this.internalSecret,
    };

    if (options?.workspaceId) {
      headers['X-APIClaw-Workspace'] = options.workspaceId;
    }
    if (options?.routeOverride) {
      headers['X-APIClaw-Route'] = options.routeOverride;
    }

    const body = JSON.stringify({ provider, action, params });

    // First attempt
    let response = await this.doFetch(url, headers, body);
    let firstStatus: number | null = response?.status ?? null;

    // Retry once on network error OR 5xx
    if (!response || response.status >= 500) {
      const reason = !response ? 'fetch_fail' : `5xx:${response.status}`;
      emitFunnelEvent({
        event: 'gateway_retry',
        workspaceId: options?.workspaceId,
        version: process.env.npm_package_version || 'unknown',
        props: { attempt: 2, reason, provider, action },
      });
      // If first response was a 5xx, drain it before retry
      if (response && response.status >= 500) {
        try { await response.text(); } catch { /* ignore */ }
      }
      response = await this.doFetch(url, headers, body);
    }

    if (!response) {
      emitFunnelEvent({
        event: 'gateway_retry',
        workspaceId: options?.workspaceId,
        version: process.env.npm_package_version || 'unknown',
        props: { attempt: 2, reason: 'retry_exhausted', provider, action, firstStatus },
      });
      return {
        success: false,
        provider,
        action,
        error: 'Gateway unreachable after retry',
      };
    }

    try {
      const json = await response.json() as any;

      if (!response.ok) {
        // Surface workspace-required errors structurally so the MCP server can
        // print a friendly signup banner instead of dumping raw JSON.
        const errObj = json?.error;
        const isAuthError =
          response.status === 401 &&
          errObj &&
          typeof errObj === "object" &&
          (errObj.code === "unauth" || errObj.type === "auth_error");
        return {
          success: false,
          provider: json.provider || provider,
          action: json.action || action,
          error:
            typeof errObj === "string"
              ? errObj
              : errObj?.message || `Gateway HTTP ${response.status}`,
          ...(isAuthError
            ? {
                authRequired: {
                  message: String(errObj.message ?? "Workspace required."),
                  signupUrl: String(
                    errObj.signupUrl ?? "https://apiclaw.cloud/workspace",
                  ),
                  docsUrl: errObj.docsUrl
                    ? String(errObj.docsUrl)
                    : "https://apiclaw.cloud/install",
                  freeTierCalls:
                    typeof errObj.freeTierCalls === "number"
                      ? errObj.freeTierCalls
                      : 25,
                },
              }
            : {}),
          _apiclaw: json._apiclaw,
        };
      }

      return {
        success: json.success ?? true,
        provider: json.provider || provider,
        action: json.action || action,
        data: json.data,
        error: json.error,
        cost: json.cost,
        _apiclaw: json._apiclaw,
      };
    } catch (e: any) {
      return {
        success: false,
        provider,
        action,
        error: `Gateway response parse error: ${e.message}`,
      };
    }
  }

  /**
   * Perform a single fetch with timeout. Returns null on network error.
   */
  private async doFetch(
    url: string,
    headers: Record<string, string>,
    body: string,
  ): Promise<Response | null> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timer);
      return response;
    } catch {
      return null;
    }
  }
}

// Singleton
let _gateway: GatewayClient | null = null;

export function getGateway(): GatewayClient {
  if (!_gateway) _gateway = new GatewayClient();
  return _gateway;
}
