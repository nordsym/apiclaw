#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { deriveManagedRequestId } from "./httpTrust";
import {
  APICLAW_IDEMPOTENCY_BINDING_VERSION,
  buildBoundIdempotencyReplayContract,
  buildDuplicateIdempotencyConflictError,
  buildIdempotencyReplayReceipt,
  buildUnboundIdempotencyReplayContract,
  deriveIdempotencyBindingDigest,
} from "./idempotencyBinding";

const fixture = JSON.parse(readFileSync(
  fileURLToPath(new URL("../fixtures/apiclaw-idempotency-binding-v1.json", import.meta.url)),
  "utf8",
));
const ids = {
  completed: "idem_" + "a".repeat(64),
  failed: "idem_" + "b".repeat(64),
  running: "idem_" + "c".repeat(64),
  unknown: "idem_" + "d".repeat(64),
};

assert.equal(APICLAW_IDEMPOTENCY_BINDING_VERSION, "apiclaw-idempotency-binding/v1");

const completedReceipt = buildIdempotencyReplayReceipt({
  requestId: ids.completed,
  status: "succeeded",
  executionCertainty: "completed",
  retryAttempts: 1,
  operatorActionRequired: false,
  providerCostMicros: 0,
});
assert(completedReceipt);
const completed = await buildBoundIdempotencyReplayContract(
  "fixture-completed-key",
  ids.completed,
  completedReceipt,
);
const completedError = buildDuplicateIdempotencyConflictError({
  replay: completed,
  requestId: ids.completed,
  ledgerId: "ledger_completed",
  reason: "duplicate_request_succeeded",
});
assert.deepEqual(completedError, fixture.states.completed.error);
assert.equal(completed.receipt?.responseRecoverable, false);

const failedReceipt = buildIdempotencyReplayReceipt({
  requestId: ids.failed,
  status: "failed",
  terminalCode: "server_error",
  executionCertainty: "provider_terminal_failure",
  retryAttempts: 1,
  operatorActionRequired: false,
  providerCostMicros: 0,
});
assert(failedReceipt);
const terminalFailed = await buildBoundIdempotencyReplayContract(
  "fixture-failed-key",
  ids.failed,
  failedReceipt,
);
const terminalFailedError = buildDuplicateIdempotencyConflictError({
  replay: terminalFailed,
  requestId: ids.failed,
  ledgerId: "ledger_failed",
  reason: "duplicate_request_failed",
});
assert.deepEqual(terminalFailedError, fixture.states.terminal_failed.error);

const runningReceipt = buildIdempotencyReplayReceipt({
  requestId: ids.running,
  status: "authorized",
  retryAttempts: 1,
  operatorActionRequired: false,
});
assert(runningReceipt);
const inProgress = await buildBoundIdempotencyReplayContract(
  "fixture-running-key",
  ids.running,
  runningReceipt,
);
const inProgressError = buildDuplicateIdempotencyConflictError({
  replay: inProgress,
  requestId: ids.running,
  ledgerId: "ledger_running",
  reason: "duplicate_request_authorized",
});
assert.deepEqual(inProgressError, fixture.states.in_progress.error);
assert.equal(inProgress.receipt?.terminal, false);

const terminalUnknownReceipt = buildIdempotencyReplayReceipt({
  requestId: ids.unknown,
  status: "failed",
  executionCertainty: "uncertain",
  terminalCode: "oauth_upstream_timeout",
  retryAttempts: 1,
  operatorActionRequired: true,
});
assert(terminalUnknownReceipt);
const terminalUnknown = await buildBoundIdempotencyReplayContract(
  "fixture-unknown-key",
  ids.unknown,
  terminalUnknownReceipt,
);
const terminalUnknownError = buildDuplicateIdempotencyConflictError({
  replay: terminalUnknown,
  requestId: ids.unknown,
  ledgerId: "ledger_unknown_terminal",
  reason: "duplicate_request_failed",
});
assert.deepEqual(terminalUnknownError, fixture.states.terminal_unknown.error);
assert.equal(terminalUnknownError.receipt?.terminal, true);
assert.equal(terminalUnknownError.receipt?.outcome, "outcome_unknown");

const contradictoryReceipt = buildIdempotencyReplayReceipt({
  requestId: ids.failed,
  status: "failed",
  executionCertainty: "completed",
  terminalCode: "unsafe secret shaped terminal detail",
});
assert(contradictoryReceipt);
assert.equal(contradictoryReceipt.outcome, "outcome_unknown");
assert.equal(contradictoryReceipt.executionCertainty, "uncertain");
assert.equal(contradictoryReceipt.code, undefined);

const missing = buildUnboundIdempotencyReplayContract();
assert.equal(missing.idempotencyBinding.bound, false);
const missingError = buildDuplicateIdempotencyConflictError({
  replay: missing,
  requestId: ids.running,
  ledgerId: "ledger_unknown",
  reason: "duplicate_request_failed",
});
assert.deepEqual(missingError, fixture.states.unbound_missing.error);

const malformedReceipt = buildIdempotencyReplayReceipt({
  requestId: ids.completed,
  status: "succeeded",
  executionCertainty: "completed",
});
assert(malformedReceipt);
const malformed = await buildBoundIdempotencyReplayContract(
  "fixture-completed-key",
  "not-a-managed-request-id",
  malformedReceipt,
);
assert.deepEqual(malformed, missing);

const crossWorkspaceA = await deriveManagedRequestId({
  idempotencyKey: "shared-logical-key",
  workspaceId: "workspace-a",
  provider: "openai-codex",
  action: "chat_completions",
  path: "/v1/chat/completions",
});
const crossWorkspaceB = await deriveManagedRequestId({
  idempotencyKey: "shared-logical-key",
  workspaceId: "workspace-b",
  provider: "openai-codex",
  action: "chat_completions",
  path: "/v1/chat/completions",
});
assert.notEqual(crossWorkspaceA, crossWorkspaceB);
const foreignReceipt = buildIdempotencyReplayReceipt({
  requestId: crossWorkspaceA,
  status: "succeeded",
  executionCertainty: "completed",
});
assert(foreignReceipt);
assert.deepEqual(await buildBoundIdempotencyReplayContract(
  "shared-logical-key",
  crossWorkspaceB,
  foreignReceipt,
), missing, "a foreign workspace request ID must never bind or reveal the original receipt");
const foreignError = buildDuplicateIdempotencyConflictError({
  replay: await buildBoundIdempotencyReplayContract(
    "shared-logical-key",
    crossWorkspaceB,
    foreignReceipt,
  ),
  requestId: crossWorkspaceB,
  ledgerId: "ledger_isolated",
  reason: "duplicate_request_failed",
});
assert(!JSON.stringify(foreignError).includes(crossWorkspaceA));
assert.equal(foreignError.receipt, null);
assert.equal(foreignError.terminalReceipt, undefined);

const storm = await Promise.all(Array.from(
  { length: 1_000 },
  () => buildBoundIdempotencyReplayContract("fixture-failed-key", ids.failed, failedReceipt),
));
assert(storm.every((entry) => JSON.stringify(entry) === JSON.stringify(terminalFailed)));

const secretMarker = "tech-scout-secret-idempotency-key";
const secretDigest = await deriveIdempotencyBindingDigest(secretMarker, ids.failed);
const wrongKeyDigest = await deriveIdempotencyBindingDigest("wrong-key", ids.failed);
const serialized = JSON.stringify({
  completedError,
  terminalFailedError,
  inProgressError,
  terminalUnknownError,
  missingError,
  malformed,
  storm: storm[0],
});
assert(!serialized.includes(secretMarker));
assert(!serialized.includes("idempotencyKey"));
assert.match(secretDigest, /^ib_[a-f0-9]{64}$/);
assert(!secretDigest.includes(secretMarker));
assert.notEqual(secretDigest, wrongKeyDigest, "a different outbound key must not verify the binding");
assert.equal(fixture.secretIdempotencyKeyEchoed, false);
assert.equal(fixture.bindingMethod, "sha256_key_request_v1");

const unsafeReceipt = buildIdempotencyReplayReceipt({
  requestId: ids.failed,
  status: "failed",
  executionCertainty: "provider_terminal_failure",
  terminalCode: secretMarker,
});
assert(unsafeReceipt);
const unsafeReplay = await buildBoundIdempotencyReplayContract(
  secretMarker,
  ids.failed,
  unsafeReceipt,
);
const unsafeError = buildDuplicateIdempotencyConflictError({
  replay: unsafeReplay,
  requestId: ids.failed,
  ledgerId: "ledger_secret_regression",
  reason: "duplicate_request_failed",
});
assert(!JSON.stringify(unsafeError).includes(secretMarker));
assert.equal(unsafeError.receipt?.code, undefined);
assert.equal(unsafeError.terminalReceipt?.code, undefined);

const managedUsageSource = readFileSync(
  fileURLToPath(new URL("./managedUsage.ts", import.meta.url)),
  "utf8",
);
const existingLedgerBranch = managedUsageSource.indexOf("if (existing) {");
const newLedgerInsert = managedUsageSource.indexOf('ctx.db.insert("managedCallLedger"');
assert(existingLedgerBranch >= 0 && newLedgerInsert > existingLedgerBranch);
assert.match(
  managedUsageSource.slice(existingLedgerBranch, newLedgerInsert),
  /allowed:\s*false as const,\s*duplicate:\s*true/,
  "an existing request must return a duplicate gate before any new ledger authorization",
);

const httpSource = readFileSync(fileURLToPath(new URL("./http.ts", import.meta.url)), "utf8");
const duplicateGate = httpSource.indexOf("if (quota?.duplicate) {");
const allowedGate = httpSource.indexOf("if (quota?.allowed) {", duplicateGate);
assert(duplicateGate >= 0 && allowedGate > duplicateGate);
assert.match(
  httpSource.slice(duplicateGate, allowedGate),
  /return jsonResponse\(/,
  "the duplicate gate must terminate the request before a route can dispatch upstream",
);

console.log("idempotency binding: completed, failed, running, unbound, isolation, storms, and secret minimization hold");
