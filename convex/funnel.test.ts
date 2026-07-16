/**
 * Tests for Convex funnel rollup helpers.
 * Run: npx tsx convex/funnel.test.ts
 */
import { strict as assert } from "node:assert";
import { computeMetrics, rollupCanonicalFunnel } from "./funnel.js";

const rollup = rollupCanonicalFunnel([
  { _id: "1", event: "install", fingerprint: "fp1" },
  { _id: "2", event: "first_run", fingerprint: "fp1" },
  { _id: "3", event: "cli_browser_callback_success", workspaceId: "ws1" },
  { _id: "4", event: "call_api_blocked", workspaceId: "ws1" },
  { _id: "5", event: "first_call_api_success", workspaceId: "ws1" },
]);

const blocked = rollup.funnel.find((e) => String(e.event) === "call_api_blocked");
const cliAuth = rollup.funnel.find((e) => e.event === "cli_browser_callback_success");

assert.equal(blocked, undefined);
assert.equal(cliAuth?.unique, 1);
assert.equal(rollup.diagnosticEvents, 1);
assert.equal(rollup.ratios.verify_to_first_call, 1);

console.log("convex funnel rollup: diagnostic events ignored");

const canonicalWithLegacyFallback = [
  { _id: "1", event: "workspace_authenticated", workspaceId: "ws1" },
  { _id: "2", event: "verify_code", workspaceId: "ws1" },
  { _id: "3", event: "cli_browser_callback_success", workspaceId: "ws1" },
  { _id: "4", event: "cli_browser_callback_success", workspaceId: "ws2" },
  { _id: "5", event: "first_call_api_success", workspaceId: "ws1" },
  { _id: "6", event: "first_call_api_success", workspaceId: "ws2" },
];

const fallbackRollup = rollupCanonicalFunnel(canonicalWithLegacyFallback);
const metrics = computeMetrics(canonicalWithLegacyFallback);

assert.equal(metrics.unique.workspace_authenticated, 1);
assert.equal(metrics.unique.activated_owners, 2);
assert.equal(fallbackRollup.authenticatedWorkspaces, 2);
assert.equal(fallbackRollup.ratios.verify_to_first_call, 1);

console.log("convex funnel rollup: canonical auth preferred with deduped legacy fallback");
