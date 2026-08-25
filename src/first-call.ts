/**
 * First managed execute after sign-in.
 *
 * Activation is a successful POST /v1/execute, not an npm install and not
 * whoami. NASA APOD is the preferred research rail. Frankfurter GET /latest
 * is the workspace-public fallback. Catalog names without a slash (CoinGecko)
 * must never be used here — the CLI maps those to legacy POST /v1/call.
 */

import { randomUUID } from "node:crypto";
import {
  executeSessionHeaders,
  readExecuteSessionToken,
  readPendingLoginUrl,
  usableSessionToken,
} from "./execute-auth.js";

export const FIRST_EXECUTE_PATH = "/v1/execute";

export const FIRST_EXECUTE_NASA = {
  provider: "nasa",
  action: "apod",
  params: {} as Record<string, unknown>,
} as const;

export const FIRST_EXECUTE_FRANKFURTER = {
  provider: "frankfurter",
  action: "latest",
  params: { path: "/latest" } as Record<string, unknown>,
} as const;

export const AUTH_FIRST_CALL_COMMAND = "npx @nordsym/apiclaw auth first-call";

const DEFAULT_GATEWAY =
  process.env.APICLAW_GATEWAY_URL || "https://adventurous-avocet-799.convex.site";

export type FirstExecuteAttempt = {
  provider: string;
  action: string;
  params: Record<string, unknown>;
};

export type FirstExecuteTransportResult = {
  status: number;
  body: unknown;
};

export type FirstExecuteFn = (
  attempt: FirstExecuteAttempt,
  options: { sessionToken: string; idempotencyKey: string; path: string },
) => Promise<FirstExecuteTransportResult>;

export type FirstExecuteResult = {
  ok: boolean;
  provider?: string;
  action?: string;
  summary?: string;
  status?: number;
  error?: string;
  pendingLoginUrl?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function payloadData(body: unknown): Record<string, unknown> | undefined {
  const root = asRecord(body);
  if (!root) return undefined;
  return asRecord(root.data) ?? root;
}

export function formatApodTitle(body: unknown): string | undefined {
  const data = payloadData(body);
  const title = data?.title;
  if (typeof title === "string" && title.trim()) return title.trim();
  return undefined;
}

export function formatFrankfurterRate(body: unknown): string | undefined {
  const data = payloadData(body);
  const rates = asRecord(data?.rates);
  const usd = rates?.USD;
  if (typeof usd === "number" && Number.isFinite(usd)) {
    return `EUR/USD ${usd}`;
  }
  if (typeof usd === "string" && usd.trim()) {
    return `EUR/USD ${usd.trim()}`;
  }
  return undefined;
}

export function formatFirstCallResult(provider: string, body: unknown): string | undefined {
  if (provider === "nasa") {
    const title = formatApodTitle(body);
    return title ? `NASA APOD: ${title}` : undefined;
  }
  if (provider === "frankfurter") {
    return formatFrankfurterRate(body);
  }
  return undefined;
}

function isExecuteSuccess(result: FirstExecuteTransportResult): boolean {
  if (result.status !== 200) return false;
  const root = asRecord(result.body);
  if (root && root.success === false) return false;
  return true;
}

export async function defaultFirstExecute(
  attempt: FirstExecuteAttempt,
  options: { sessionToken: string; idempotencyKey: string; path: string },
  fetchImpl: typeof fetch = fetch,
  gatewayUrl: string = DEFAULT_GATEWAY,
): Promise<FirstExecuteTransportResult> {
  const sessionToken = usableSessionToken(options.sessionToken);
  if (!sessionToken) {
    return { status: 0, body: { error: { message: "not_signed_in" } } };
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...executeSessionHeaders(sessionToken),
    "Idempotency-Key": options.idempotencyKey,
  };
  const init: RequestInit = {
    method: "POST",
    headers,
    body: JSON.stringify({
      provider: attempt.provider,
      action: attempt.action,
      params: attempt.params,
    }),
  };
  let res: Response;
  try {
    res = await fetchImpl(`${gatewayUrl}${options.path}`, init);
  } catch {
    return { status: 0, body: { error: { message: "gateway_unreachable" } } };
  }
  let body: unknown;
  try {
    body = JSON.parse(await res.text());
  } catch {
    body = {};
  }
  return { status: res.status, body };
}

export async function completeFirstExecute(options: {
  sessionToken?: string;
  execute?: FirstExecuteFn;
} = {}): Promise<FirstExecuteResult> {
  const sessionToken = options.sessionToken !== undefined
    ? usableSessionToken(options.sessionToken)
    : readExecuteSessionToken();
  if (!sessionToken) {
    return {
      ok: false,
      error: "not_signed_in",
      pendingLoginUrl: readPendingLoginUrl(),
    };
  }

  const execute = options.execute ?? defaultFirstExecute;
  const rails: FirstExecuteAttempt[] = [FIRST_EXECUTE_NASA, FIRST_EXECUTE_FRANKFURTER];

  for (const attempt of rails) {
    const result = await execute(attempt, {
      sessionToken,
      idempotencyKey: `apiclaw-first-${attempt.provider}-${randomUUID()}`,
      path: FIRST_EXECUTE_PATH,
    });
    if (!isExecuteSuccess(result)) continue;
    const summary =
      formatFirstCallResult(attempt.provider, result.body) ??
      (attempt.provider === "nasa" ? "NASA APOD received" : "EUR FX rate received");
    return {
      ok: true,
      provider: attempt.provider,
      action: attempt.action,
      summary,
      status: result.status,
    };
  }

  return { ok: false, error: "first_execute_failed" };
}
