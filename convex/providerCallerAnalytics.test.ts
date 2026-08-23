#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { callerKeyFor, computeByCaller, fnv1aHex } from "./providerCallerAnalytics";

const OWN = "ws_owner";
const OTHER_A = "ws_other_a";
const OTHER_B = "ws_other_b";
const OTHER_C = "ws_other_c";

// fnv1aHex is deterministic and never returns the raw input.
assert.equal(fnv1aHex("ws_other_a"), fnv1aHex("ws_other_a"));
assert.notEqual(fnv1aHex("ws_other_a"), "ws_other_a");
assert.equal(fnv1aHex("ws_other_a").length, 8);

// The provider's own workspace is labeled "you", not hashed.
assert.equal(callerKeyFor(OWN, OWN), "you");
assert.equal(callerKeyFor(OTHER_A, OWN), `ws-${fnv1aHex(OTHER_A)}`);

// Sort order: highest call count first.
const logs = [
  { callerWorkspaceId: OTHER_A, status: "success", createdAt: 100 },
  { callerWorkspaceId: OTHER_A, status: "error", createdAt: 200 },
  { callerWorkspaceId: OTHER_A, status: "success", createdAt: 150 },
  { callerWorkspaceId: OTHER_B, status: "success", createdAt: 300 },
  { callerWorkspaceId: OWN, status: "success", createdAt: 50 },
  { callerWorkspaceId: OWN, status: "success", createdAt: 400 },
];
const result = computeByCaller(logs, OWN);
assert.equal(result.length, 3);
assert.equal(result[0].callerKey, `ws-${fnv1aHex(OTHER_A)}`);
assert.equal(result[0].calls, 3);
assert.equal(result[0].errors, 1);
assert.equal(result[0].lastCallAt, 200);

// Own-workspace label appears and aggregates correctly.
const ownEntry = result.find((r) => r.callerKey === "you");
assert.ok(ownEntry);
assert.equal(ownEntry!.calls, 2);
assert.equal(ownEntry!.errors, 0);
assert.equal(ownEntry!.lastCallAt, 400);

// Rows with no callerWorkspaceId are skipped.
const withUnknown = computeByCaller(
  [...logs, { callerWorkspaceId: undefined, status: "success", createdAt: 999 }],
  OWN
);
assert.equal(withUnknown.length, 3);

// Cap at 25 entries even with more distinct callers.
const manyCallers = Array.from({ length: 40 }, (_, i) => ({
  callerWorkspaceId: `ws_caller_${i}`,
  status: "success",
  createdAt: i,
}));
const capped = computeByCaller(manyCallers, OWN);
assert.equal(capped.length, 25);

// The raw caller id never appears anywhere in the output.
const serialized = JSON.stringify(computeByCaller(logs, OWN));
assert.ok(!serialized.includes(OTHER_A));
assert.ok(!serialized.includes(OTHER_B));
assert.ok(!serialized.includes(OTHER_C));

console.log("provider caller analytics: sort order, cap, error counts, own-workspace label, and id hiding all hold");
