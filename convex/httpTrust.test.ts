#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  deriveManagedRequestId,
  deriveRequestFingerprint,
  githubContentsApiUrl,
  githubRepositoryApiUrl,
  InvalidIdempotencyKeyError,
  LEGACY_CLIENT_MINIMUM_VERSION,
  LEGACY_CLIENT_UPGRADE_COMMANDS,
  normalizeMaxOutputTokens,
  requireManagedIdempotencyKey,
  requiresLegacyClientUpgrade,
  rewriteLegacyProviderActionCall,
  synthesizeLegacyIdempotencyKey,
  validateIdempotencyKey,
} from "./httpTrust";

validateIdempotencyKey("customer-request_01:v2");
assert.throws(() => validateIdempotencyKey("contains whitespace"), InvalidIdempotencyKeyError);
assert.throws(() => validateIdempotencyKey("x".repeat(129)), InvalidIdempotencyKeyError);
assert.equal(requireManagedIdempotencyKey("customer-request-1", "customer"), "customer-request-1");
assert.throws(
  () => requireManagedIdempotencyKey(null, "customer"),
  /required for customer managed calls/,
);

assert.equal(
  requiresLegacyClientUpgrade("/v1/execute", new Headers({ "X-APIClaw-Internal": "" })),
  true,
);
assert.equal(
  requiresLegacyClientUpgrade("/v1/execute", new Headers({
    "X-APIClaw-Session": "redacted-session",
    "Idempotency-Key": "current-client-request",
  })),
  false,
);
assert.equal(
  requiresLegacyClientUpgrade("/v1/call", new Headers({ "X-APIClaw-Session": "redacted-session" })),
  false,
);
assert.equal(
  requiresLegacyClientUpgrade("/v1/execute", new Headers({ "X-APIClaw-Session": "redacted-session" })),
  false,
);
assert.equal(
  requiresLegacyClientUpgrade("/v1/call", new Headers({
    "X-APIClaw-Session": "redacted-session",
    "Idempotency-Key": "current-client-request",
  })),
  false,
);
assert.equal(
  requiresLegacyClientUpgrade("/v1/call", new Headers({
    Authorization: "Bearer sk-claw-published-latest",
  })),
  false,
);
assert.equal(
  requiresLegacyClientUpgrade("/v1/execute", new Headers({
    "X-APIClaw-Internal": "",
    "X-APIClaw-Workspace": "workspace-forged",
  })),
  true,
);
assert.equal(
  requiresLegacyClientUpgrade("/v1/call", new Headers()),
  false,
);
assert.match(synthesizeLegacyIdempotencyKey(), /^legacy-[0-9a-f-]{36}$/);
assert.deepEqual(
  rewriteLegacyProviderActionCall({
    provider: "nasa",
    action: "apod",
    params: {},
  }),
  { provider: "nasa", action: "apod", params: {} },
);
assert.deepEqual(
  rewriteLegacyProviderActionCall({
    provider: "apilayer",
    action: "fixer_latest",
    params: { base: "EUR" },
  }),
  { provider: "apilayer", action: "fixer_latest", params: { base: "EUR" } },
);
assert.equal(
  rewriteLegacyProviderActionCall({ api: "NASA APOD", path: "/" }),
  null,
);
assert.equal(LEGACY_CLIENT_MINIMUM_VERSION, "2.8.7");
assert.equal(LEGACY_CLIENT_UPGRADE_COMMANDS.length, 1);
assert.equal(
  LEGACY_CLIENT_UPGRADE_COMMANDS[0],
  "npx -y @nordsym/apiclaw@latest auth login --force",
);
for (const command of LEGACY_CLIENT_UPGRADE_COMMANDS) {
  assert.doesNotMatch(command, /@2\.8\.7\b/);
  assert.match(command, /@nordsym\/apiclaw@latest|auth login --force/);
}
assert.equal(requireManagedIdempotencyKey(null, "internal"), null);
assert.throws(
  () => requireManagedIdempotencyKey("contains whitespace", "internal"),
  InvalidIdempotencyKeyError,
);

const base = {
  idempotencyKey: "request-42",
  workspaceId: "workspace-a",
  provider: "OpenAI",
  action: "chat",
  path: "/v1/chat/completions",
  model: "gpt-5.4-mini",
};
const first = await deriveManagedRequestId({ ...base, payload: { b: 2, a: 1 } });
const reordered = await deriveManagedRequestId({ ...base, payload: { a: 1, b: 2 } });
const otherWorkspace = await deriveManagedRequestId({ ...base, workspaceId: "workspace-b", payload: { a: 1, b: 2 } });
const otherPayload = await deriveManagedRequestId({ ...base, payload: { a: 1, b: 3 } });
const otherOperation = await deriveManagedRequestId({ ...base, provider: "brave_search", action: "search" });
assert.equal(first, reordered);
assert.notEqual(first, otherWorkspace);
assert.equal(first, otherPayload, "one key keeps one operation identity even when a conflicting payload is supplied");
assert.equal(first, otherOperation, "one workspace-scoped key cannot create a second operation identity");
assert.equal(
  await deriveRequestFingerprint({ b: 2, a: 1 }),
  await deriveRequestFingerprint({ a: 1, b: 2 }),
);
assert.notEqual(
  await deriveRequestFingerprint({ a: 1, b: 2 }),
  await deriveRequestFingerprint({ a: 1, b: 3 }),
);
assert.match(first, /^idem_[0-9a-f]{64}$/);

const randomA = await deriveManagedRequestId({ ...base, idempotencyKey: null });
const randomB = await deriveManagedRequestId({ ...base, idempotencyKey: null });
assert.notEqual(randomA, randomB);

assert.equal(normalizeMaxOutputTokens(undefined), 2_000);
assert.equal(normalizeMaxOutputTokens("4096"), 4_096);
assert.throws(() => normalizeMaxOutputTokens(0), RangeError);
assert.throws(() => normalizeMaxOutputTokens(128_001), RangeError);

assert.equal(
  githubRepositoryApiUrl("nordsym", "apiclaw"),
  "https://api.github.com/repos/nordsym/apiclaw",
);
assert.equal(
  githubContentsApiUrl("nordsym", "apiclaw", "docs/hello world.md"),
  "https://api.github.com/repos/nordsym/apiclaw/contents/docs/hello%20world.md",
);
assert.throws(() => githubRepositoryApiUrl("..", "../user/emails"), RangeError);
assert.throws(() => githubRepositoryApiUrl("nordsym/user", "apiclaw"), RangeError);
assert.throws(() => githubContentsApiUrl("nordsym", "apiclaw", "../.env"), RangeError);
assert.throws(() => githubContentsApiUrl("nordsym", "apiclaw", "%2e%2e/private"), RangeError);

console.log("HTTP trust: idempotency, output limits, and GitHub paths fail closed");
