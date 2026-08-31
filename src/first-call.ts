/**
 * First managed execute after sign-in (CLI / MCP).
 *
 * Rails live in first-execute-rails.ts — POST /v1/execute nasa/apod,
 * then frankfurter latest. See that file for why NASA wins and why billed
 * research stays out.
 */

import { randomUUID } from "node:crypto";
import {
  executeSessionHeaders,
  readExecuteSessionToken,
  readPendingLoginUrl,
  usableSessionToken,
} from "./execute-auth.js";
import {
  FIRST_EXECUTE_FRANKFURTER,
  FIRST_EXECUTE_NASA,
  FIRST_EXECUTE_PATH,
  FIRST_EXECUTE_RAILS,
  firstExecuteFallbackSummary,
  formatApodTitle,
  formatFirstCallResult,
  formatFrankfurterRate,
  isFirstExecuteSuccess,
  type FirstExecuteAttempt,
} from "./first-execute-rails.js";

export {
  FIRST_EXECUTE_FRANKFURTER,
  FIRST_EXECUTE_NASA,
  FIRST_EXECUTE_PATH,
  FIRST_EXECUTE_RAILS,
  formatApodTitle,
  formatFirstCallResult,
  formatFrankfurterRate,
};
export type { FirstExecuteAttempt };

export const AUTH_FIRST_CALL_COMMAND = "npx @nordsym/apiclaw auth first-call";

const DEFAULT_GATEWAY =
  process.env.APICLAW_GATEWAY_URL || "https://adventurous-avocet-799.convex.site";

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
  const rails: FirstExecuteAttempt[] = [...FIRST_EXECUTE_RAILS];

  for (const attempt of rails) {
    const result = await execute(attempt, {
      sessionToken,
      idempotencyKey: `apiclaw-first-${attempt.provider}-${randomUUID()}`,
      path: FIRST_EXECUTE_PATH,
    });
    if (!isFirstExecuteSuccess(result.status, result.body)) continue;
    const summary =
      formatFirstCallResult(attempt.provider, result.body) ??
      firstExecuteFallbackSummary(attempt.provider);
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
