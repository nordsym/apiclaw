export const APICLAW_IDEMPOTENCY_BINDING_VERSION = "apiclaw-idempotency-binding/v1";
export const APICLAW_IDEMPOTENCY_BINDING_METHOD = "sha256_key_request_v1";

const MANAGED_REQUEST_ID_PATTERN = /^idem_[a-f0-9]{64}$/;
const SAFE_REPLAY_TERMINAL_CODES = new Set([
  "authentication_error",
  "client_disconnected_after_dispatch",
  "client_disconnected_before_dispatch",
  "conflict_error",
  "insufficient_quota",
  "invalid_request_error",
  "oauth_empty_terminal_response",
  "oauth_retry_budget_exhausted",
  "oauth_transport_error",
  "oauth_upstream_server_error",
  "oauth_upstream_timeout",
  "permission_error",
  "provider_rejected",
  "rate_limit_error",
  "rate_limit_exceeded",
  "server_error",
]);
const SAFE_REPLAY_HTTP_CODE = /^http_(400|401|403|404|409|422|429)$/;

type ExecutionCertainty =
  | "not_dispatched"
  | "provider_rejected"
  | "provider_terminal_failure"
  | "completed"
  | "uncertain";

type ReplayLedger = {
  requestId: string;
  status: "authorized" | "succeeded" | "failed";
  terminalCode?: string;
  executionCertainty?: ExecutionCertainty;
  operatorActionRequired?: boolean;
  retryAttempts?: number;
  providerCostMicros?: number;
};

export type IdempotencyReplayReceipt = {
  requestId: string;
  status: ReplayLedger["status"];
  outcome: "succeeded" | "terminal" | "in_progress" | "outcome_unknown";
  executionCertainty: ExecutionCertainty;
  attempts: number;
  retryable: false;
  operatorActionRequired: boolean;
  responseRecoverable: false;
  terminal: boolean;
  providerCostUsd?: number;
  code?: string;
};

type IdempotencyReplayContract =
  | Awaited<ReturnType<typeof buildBoundIdempotencyReplayContract>>
  | ReturnType<typeof buildUnboundIdempotencyReplayContract>;

function managedRequestIdIsValid(value: string): boolean {
  return MANAGED_REQUEST_ID_PATTERN.test(value);
}

export function safeReplayTerminalCode(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return SAFE_REPLAY_TERMINAL_CODES.has(value) || SAFE_REPLAY_HTTP_CODE.test(value)
    ? value
    : undefined;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * The client can recompute this proof from the Idempotency-Key it already
 * holds. The key itself is never serialized into an APIClaw response.
 */
export async function deriveIdempotencyBindingDigest(
  idempotencyKey: string,
  requestId: string,
): Promise<string> {
  return `ib_${await sha256(
    `${APICLAW_IDEMPOTENCY_BINDING_VERSION}\n${requestId}\n${idempotencyKey}`,
  )}`;
}

export function buildIdempotencyReplayReceipt(
  ledger: ReplayLedger,
): IdempotencyReplayReceipt | null {
  if (!managedRequestIdIsValid(ledger.requestId)) return null;

  const attempts = Number.isSafeInteger(ledger.retryAttempts) &&
    (ledger.retryAttempts ?? 0) >= 1 &&
    (ledger.retryAttempts ?? 0) <= 100
    ? ledger.retryAttempts!
    : 1;
  const validSucceeded = ledger.status === "succeeded" &&
    ledger.executionCertainty === "completed";
  const validTerminalFailure = ledger.status === "failed" &&
    ledger.executionCertainty !== undefined &&
    ["not_dispatched", "provider_rejected", "provider_terminal_failure"].includes(
      ledger.executionCertainty,
    );
  const executionCertainty: ExecutionCertainty = ledger.status === "authorized"
    ? "uncertain"
    : validSucceeded || validTerminalFailure
      ? ledger.executionCertainty!
      : "uncertain";
  const outcome: IdempotencyReplayReceipt["outcome"] = ledger.status === "authorized"
    ? "in_progress"
    : validSucceeded
      ? "succeeded"
      : validTerminalFailure
        ? "terminal"
        : "outcome_unknown";
  const terminal = ledger.status !== "authorized";
  const providerCostUsd = Number.isSafeInteger(ledger.providerCostMicros) &&
    (ledger.providerCostMicros ?? -1) >= 0
    ? ledger.providerCostMicros! / 1_000_000
    : undefined;
  const code = safeReplayTerminalCode(ledger.terminalCode);
  return {
    requestId: ledger.requestId,
    status: ledger.status,
    outcome,
    executionCertainty,
    attempts,
    retryable: false,
    operatorActionRequired: ledger.operatorActionRequired ?? false,
    responseRecoverable: false,
    terminal,
    ...(providerCostUsd !== undefined ? { providerCostUsd } : {}),
    ...(code ? { code } : {}),
  };
}

export function buildUnboundIdempotencyReplayContract() {
  return {
    code: "idempotency_conflict" as const,
    outcome: "outcome_unknown" as const,
    idempotencyBinding: {
      version: APICLAW_IDEMPOTENCY_BINDING_VERSION,
      method: APICLAW_IDEMPOTENCY_BINDING_METHOD,
      bound: false as const,
    },
    receipt: null,
    retryable: false as const,
    responseRecoverable: false as const,
  };
}

export async function buildBoundIdempotencyReplayContract(
  idempotencyKey: string | null,
  currentRequestId: string,
  receipt: IdempotencyReplayReceipt,
) {
  if (
    idempotencyKey === null ||
    !managedRequestIdIsValid(currentRequestId) ||
    !managedRequestIdIsValid(receipt.requestId) ||
    currentRequestId !== receipt.requestId
  ) {
    return buildUnboundIdempotencyReplayContract();
  }

  return {
    code: "idempotency_conflict" as const,
    outcome: "already_accepted" as const,
    idempotencyBinding: {
      version: APICLAW_IDEMPOTENCY_BINDING_VERSION,
      method: APICLAW_IDEMPOTENCY_BINDING_METHOD,
      bound: true as const,
      currentRequestId,
      originalRequestId: receipt.requestId,
      digest: await deriveIdempotencyBindingDigest(idempotencyKey, currentRequestId),
    },
    receipt,
  };
}

export function buildDuplicateIdempotencyConflictError(args: {
  replay: IdempotencyReplayContract;
  requestId: string;
  ledgerId: string;
  reason: string;
}) {
  const receipt = args.replay.receipt;
  const terminalReceipt = receipt?.terminal
    ? {
        requestId: receipt.requestId,
        outcome: receipt.outcome,
        executionCertainty: receipt.executionCertainty,
        attempts: receipt.attempts,
        operatorActionRequired: receipt.operatorActionRequired,
        retryable: false as const,
        ...(receipt.code ? { code: receipt.code } : {}),
      }
    : undefined;
  return {
    ...args.replay,
    type: "conflict_error" as const,
    message: "This managed request was already accepted. APIClaw will not dispatch it upstream again.",
    requestId: args.requestId,
    ledgerId: args.ledgerId,
    reason: args.reason,
    ...(terminalReceipt ? { terminalReceipt } : {}),
  };
}
