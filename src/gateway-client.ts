/**
 * APIClaw Gateway Client - Thin HTTP client for the Intelligent Gateway
 *
 * Routes all API execution through POST /v1/execute on Convex,
 * replacing local executeOpenAPI / executeMetered calls.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GatewayResponse {
  success: boolean;
  provider: string;
  action: string;
  data?: any;
  error?: string;
  /** Stable machine-readable gateway error code. */
  code?: string;
  /** Gateway request identity when one was assigned. */
  requestId?: string;
  /**
   * Present when the client cannot know whether the gateway accepted the
   * operation. Callers must retain this key and must not create a new one for
   * the same logical operation.
   */
  idempotencyKey?: string;
  outcomeUnknown?: boolean;
  retryable?: boolean;
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
  };
  _apiclaw?: {
    latencyMs: number;
    route: string;
    gateway: boolean;
    model?: string;
    authMode?: string;
    credentialSource?: string;
  };
}

export interface GatewayExecuteOptions {
  workspaceId?: string;
  sessionToken?: string;
  stream?: boolean;
  routeOverride?: string;
  idempotencyKey?: string;
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
 * Managed execution always uses the billing gateway. A local environment
 * switch previously allowed direct provider calls that bypassed the atomic
 * allowance and cost ledger, so managed routing is no longer optional.
 */
export function isGatewayEnabled(): boolean {
  return true;
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
    };

    if (options?.sessionToken) {
      headers['X-APIClaw-Session'] = options.sessionToken;
    } else if (this.internalSecret) {
      headers['X-APIClaw-Internal'] = this.internalSecret;
    }
    if (options?.workspaceId && this.internalSecret && !options.sessionToken) {
      headers['X-APIClaw-Workspace'] = options.workspaceId;
    }
    if (options?.routeOverride) {
      headers['X-APIClaw-Route'] = options.routeOverride;
    }
    // One key identifies one logical managed operation. We never retry an
    // ambiguous transport failure here: the first request may already have
    // reached the gateway, and the gateway does not retain provider response
    // bodies for safe replay.
    const idempotencyKey = options?.idempotencyKey ?? `apiclaw-${randomUUID()}`;
    headers['Idempotency-Key'] = idempotencyKey;

    const body = JSON.stringify({ provider, action, params });
    const response = await this.doFetch(url, headers, body);

    if (!response) {
      return {
        success: false,
        provider,
        action,
        code: 'outcome_unknown',
        outcomeUnknown: true,
        retryable: false,
        idempotencyKey,
        error: `The gateway response was lost. This operation may already have been accepted. Do not submit it again. Do not rerun it with a new key. Retain operation key ${idempotencyKey} for reconciliation.`,
      };
    }

    try {
      const json = await response.json() as any;

      if (!response.ok) {
        // Surface workspace-required errors structurally so the MCP server can
        // print a friendly signup banner instead of dumping raw JSON.
        const errObj = json?.error;
        const errorCode = typeof errObj?.code === "string"
          ? errObj.code
          : typeof json?.code === "string"
            ? json.code
            : undefined;
        const explicitRetryable = typeof errObj?.retryable === "boolean"
          ? errObj.retryable
          : typeof json?.retryable === "boolean"
            ? json.retryable
            : undefined;
        const explicitTerminalFailure = explicitRetryable === false &&
          errorCode !== "outcome_unknown" &&
          errorCode !== "idempotency_conflict";
        const outcomeUnknown =
          errorCode === "outcome_unknown" ||
          errorCode === "idempotency_conflict" ||
          (response.status >= 500 && !explicitTerminalFailure);
        const operationLocked = outcomeUnknown || explicitTerminalFailure;
        const isAuthError =
          response.status === 401 &&
          errObj &&
          typeof errObj === "object" &&
          (errObj.code === "unauth" || errObj.type === "auth_error");
        return {
          success: false,
          provider: json.provider || provider,
          action: json.action || action,
          code: errorCode,
          requestId:
            typeof errObj?.requestId === "string"
              ? errObj.requestId
              : typeof json?.requestId === "string"
                ? json.requestId
                : undefined,
          idempotencyKey: operationLocked ? idempotencyKey : undefined,
          outcomeUnknown: outcomeUnknown ? true : undefined,
          retryable: operationLocked ? false : explicitRetryable,
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
        code: 'outcome_unknown',
        outcomeUnknown: true,
        retryable: false,
        idempotencyKey,
        error: `The gateway returned an unreadable response after accepting the request. Do not submit it again. Do not rerun it with a new key. Retain operation key ${idempotencyKey} for reconciliation.`,
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
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS);
    try {
      return await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

// Singleton
let _gateway: GatewayClient | null = null;

export function getGateway(): GatewayClient {
  if (!_gateway) _gateway = new GatewayClient();
  return _gateway;
}
