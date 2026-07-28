export const CODEX_OAUTH_OVERALL_TIMEOUT_MS = 240_000;
export const CODEX_OAUTH_MAX_ATTEMPTS = 2;
export const CODEX_OAUTH_MAX_RETRY_DELAY_MS = 2_000;

export type CodexOAuthExecutionCertainty =
  | "not_dispatched"
  | "provider_rejected"
  | "provider_terminal_failure"
  | "completed"
  | "uncertain";

export type CodexOAuthDispatchErrorCode =
  | "client_disconnected_before_dispatch"
  | "client_disconnected_after_dispatch"
  | "oauth_upstream_timeout"
  | "oauth_upstream_server_error"
  | "oauth_transport_error"
  | "oauth_empty_terminal_response"
  | "oauth_retry_budget_exhausted";

export class CodexOAuthDispatchError extends Error {
  declare readonly cause?: unknown;

  constructor(
    readonly code: CodexOAuthDispatchErrorCode,
    readonly executionCertainty: CodexOAuthExecutionCertainty,
    readonly attempts: number,
    readonly operatorActionRequired: boolean,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message);
    this.name = "CodexOAuthDispatchError";
    if (options && "cause" in options) {
      Object.defineProperty(this, "cause", {
        configurable: true,
        enumerable: false,
        value: options.cause,
        writable: true,
      });
    }
  }
}

export type CodexOAuthDispatchResult = {
  response: Response;
  attempts: number;
  recovered: boolean;
  dispose: () => void;
};

type DispatchOptions = {
  url: string;
  headers: Record<string, string>;
  body: string;
  requestSignal?: AbortSignal;
  fetcher?: typeof fetch;
  overallTimeoutMs?: number;
  maxAttempts?: number;
  maxRetryDelayMs?: number;
  now?: () => number;
  sleep?: (delayMs: number, signal?: AbortSignal) => Promise<void>;
};

type LinkedSignal = {
  signal: AbortSignal;
  timedOut: () => boolean;
  dispose: () => void;
};

function timeoutReason(): Error {
  try {
    return new DOMException("APIClaw OAuth passthrough exceeded its bounded overall duration.", "TimeoutError");
  } catch {
    return new Error("APIClaw OAuth passthrough exceeded its bounded overall duration.");
  }
}

function createLinkedSignal(parent: AbortSignal | undefined, timeoutMs: number): LinkedSignal {
  const controller = new AbortController();
  let didTimeout = false;
  const onParentAbort = () => controller.abort(parent?.reason);
  if (parent?.aborted) {
    controller.abort(parent.reason);
  } else {
    parent?.addEventListener("abort", onParentAbort, { once: true });
  }
  const timeout = setTimeout(() => {
    didTimeout = true;
    controller.abort(timeoutReason());
  }, Math.max(1, timeoutMs));
  return {
    signal: controller.signal,
    timedOut: () => didTimeout,
    dispose: () => {
      clearTimeout(timeout);
      parent?.removeEventListener("abort", onParentAbort);
    },
  };
}

function defaultSleep(delayMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error("aborted"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error("aborted"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function safeCodexRetryDelayMs(
  response: Response,
  maxRetryDelayMs = CODEX_OAUTH_MAX_RETRY_DELAY_MS,
): number | null {
  if (response.status !== 429) return null;
  const raw = response.headers.get("Retry-After");
  if (!raw) return 0;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) {
    const delayMs = Math.ceil(seconds * 1_000);
    return delayMs <= maxRetryDelayMs ? delayMs : null;
  }
  const at = Date.parse(raw);
  if (!Number.isFinite(at)) return null;
  const delayMs = Math.max(0, at - Date.now());
  return delayMs <= maxRetryDelayMs ? delayMs : null;
}

export function codexHttpFailureCertainty(status: number): "provider_rejected" | "uncertain" {
  return status >= 400 && status < 500 ? "provider_rejected" : "uncertain";
}

export function adjudicateCodexTerminalSSE(input: {
  response: any | null;
  error: any | null;
}):
  | { kind: "completed"; response: any }
  | { kind: "provider_terminal_failure"; code: string; message: string }
  | { kind: "outcome_unknown"; code: "oauth_empty_terminal_response" } {
  if (input.error?.code === "oauth_empty_terminal_response") {
    return { kind: "outcome_unknown", code: "oauth_empty_terminal_response" };
  }
  if (input.error) {
    return {
      kind: "provider_terminal_failure",
      code: input.error?.code ?? "stream_error",
      message: input.error?.message ?? "Codex reported a terminal stream failure.",
    };
  }
  if (!input.response) {
    return { kind: "outcome_unknown", code: "oauth_empty_terminal_response" };
  }
  if (input.response.status === "failed") {
    return {
      kind: "provider_terminal_failure",
      code: input.response?.error?.code ?? input.response?.incomplete_details?.reason ?? "response_failed",
      message: input.response?.error?.message ?? "Codex reported a terminal response failure.",
    };
  }
  return { kind: "completed", response: input.response };
}

/**
 * Dispatch one Codex OAuth request under a single bounded deadline.
 *
 * A retry is allowed only after an explicit 429 response, which proves that
 * the provider rejected the attempt before model execution. Transport errors,
 * timeouts, and disconnects after fetch dispatch are outcome-unknown and are
 * never retried.
 */
export async function dispatchCodexOAuthRequest(
  options: DispatchOptions,
): Promise<CodexOAuthDispatchResult> {
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? defaultSleep;
  const overallTimeoutMs = options.overallTimeoutMs ?? CODEX_OAUTH_OVERALL_TIMEOUT_MS;
  const maxAttempts = options.maxAttempts ?? CODEX_OAUTH_MAX_ATTEMPTS;
  const maxRetryDelayMs = options.maxRetryDelayMs ?? CODEX_OAUTH_MAX_RETRY_DELAY_MS;
  const deadline = now() + overallTimeoutMs;
  let attempts = 0;

  while (attempts < maxAttempts) {
    if (options.requestSignal?.aborted) {
      throw new CodexOAuthDispatchError(
        attempts === 0 ? "client_disconnected_before_dispatch" : "oauth_retry_budget_exhausted",
        "not_dispatched",
        attempts,
        false,
        attempts === 0
          ? "The caller disconnected before APIClaw dispatched the OAuth request."
          : "The caller disconnected after a provider rejection and before the safe retry.",
      );
    }
    const remainingMs = deadline - now();
    if (remainingMs <= 0) {
      throw new CodexOAuthDispatchError(
        "oauth_retry_budget_exhausted",
        "not_dispatched",
        attempts,
        false,
        "The bounded OAuth retry budget expired before another dispatch.",
      );
    }

    attempts += 1;
    const linked = createLinkedSignal(options.requestSignal, remainingMs);
    let safeRetryDelay: number | null = null;
    try {
      const response = await fetcher(options.url, {
        method: "POST",
        headers: options.headers,
        body: options.body,
        signal: linked.signal,
      });
      const retryDelayMs = attempts < maxAttempts
        ? safeCodexRetryDelayMs(response, maxRetryDelayMs)
        : null;
      if (retryDelayMs === null) {
        return {
          response,
          attempts,
          recovered: attempts > 1,
          dispose: linked.dispose,
        };
      }

      if (deadline - now() <= retryDelayMs) {
        return {
          response,
          attempts,
          recovered: false,
          dispose: linked.dispose,
        };
      }
      linked.dispose();
      try {
        await response.body?.cancel();
      } catch {
        // The explicit 429 already establishes non-execution.
      }
      safeRetryDelay = retryDelayMs;
    } catch (error) {
      const clientDisconnected = options.requestSignal?.aborted === true;
      const timedOut = linked.timedOut();
      linked.dispose();
      throw new CodexOAuthDispatchError(
        clientDisconnected ? "client_disconnected_after_dispatch" : timedOut ? "oauth_upstream_timeout" : "oauth_transport_error",
        "uncertain",
        attempts,
        true,
        clientDisconnected
          ? "The caller disconnected after APIClaw dispatched the OAuth request."
          : timedOut
            ? "The OAuth request exceeded APIClaw's bounded overall duration after dispatch."
            : "The OAuth transport failed after dispatch and the provider outcome is unknown.",
        { cause: error },
      );
    }
    if (safeRetryDelay !== null) {
      try {
        await sleep(safeRetryDelay, options.requestSignal);
      } catch (error) {
        throw new CodexOAuthDispatchError(
          "oauth_retry_budget_exhausted",
          "not_dispatched",
          attempts,
          false,
          "The caller disconnected after an explicit provider rejection and before the safe retry.",
          { cause: error },
        );
      }
    }
  }

  throw new CodexOAuthDispatchError(
    "oauth_retry_budget_exhausted",
    "not_dispatched",
    attempts,
    false,
    "The bounded OAuth retry budget was exhausted without a dispatchable attempt.",
  );
}

export function codexOAuthExecutionReceipt(input: {
  requestId: string;
  outcome: "succeeded" | "provider_rejected" | "provider_failed" | "cancelled" | "outcome_unknown";
  executionCertainty: CodexOAuthExecutionCertainty;
  attempts: number;
  recovered: boolean;
  operatorActionRequired: boolean;
  code?: string;
}) {
  return {
    requestId: input.requestId,
    outcome: input.outcome,
    executionCertainty: input.executionCertainty,
    attempts: input.attempts,
    recovery: input.recovered ? "recovered_after_safe_retry" : "not_required_or_exhausted",
    operatorActionRequired: input.operatorActionRequired,
    retryable: false,
    ...(input.code ? { code: input.code } : {}),
  };
}
