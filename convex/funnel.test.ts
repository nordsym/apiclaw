/**
 * Tests for Convex funnel rollup helpers.
 * Run: npx tsx convex/funnel.test.ts
 */
import { strict as assert } from "node:assert";
import {
  classifyFingerprint,
  classifySource,
  computeMetrics,
  resolvedClassification,
  rollupCanonicalFunnel,
} from "./funnel.js";

// Live Convex 7d fingerprints that were stored as "human" but are not people.
const LIVE_SCAN = "scan-a1b2c3d4e5f67890:scan";
const LIVE_DETONATION = "detonation-server-1:nonroot";
const LIVE_HEX_RUNNER = "9f3a2b1c4d5e6f70:runner";
const LIVE_INSTANCE = "instance:i-0abc123def456";
const LIVE_DESKTOP = "DESKTOP-7QK9X2:devuser";
const LIVE_CGNAT_ROOT = "100.64.12.34:root";

assert.equal(classifySource({ fingerprint: LIVE_SCAN }), "bot");
assert.equal(classifySource({ fingerprint: LIVE_DETONATION }), "bot");
assert.equal(classifySource({ fingerprint: LIVE_HEX_RUNNER }), "ci");
assert.equal(classifySource({ fingerprint: LIVE_INSTANCE }), "bot");
assert.equal(classifySource({ fingerprint: LIVE_DESKTOP }), "human");
assert.equal(
  classifySource({ fingerprint: LIVE_CGNAT_ROOT }),
  "human",
  "100.64.x.x:root is ci only via CI env, not the hostname",
);
assert.equal(
  classifySource({ fingerprint: LIVE_CGNAT_ROOT, envFlags: { CI: "true" } }),
  "ci",
);

assert.equal(classifyFingerprint(LIVE_SCAN), "bot");
assert.equal(classifyFingerprint("scan-deadbeefcafef00d:scan"), "bot");
assert.equal(classifyFingerprint("detonation-server-abc:nonroot"), "bot");
assert.equal(classifyFingerprint("c0ffee12:runner"), "ci");
assert.equal(classifyFingerprint("runner-8:ubuntu"), "ci");
assert.equal(classifyFingerprint("github-runner-1:ubuntu"), "ci");
assert.equal(classifyFingerprint(LIVE_DESKTOP), null);
assert.equal(classifySource({ fingerprint: "DESKTOP-ABC123:devuser" }), "human");

const scannerInstalls = [
  { _id: "1", event: "install", fingerprint: LIVE_SCAN, classification: "human" },
  { _id: "2", event: "install", fingerprint: LIVE_DETONATION, classification: "human" },
  { _id: "3", event: "install", fingerprint: LIVE_HEX_RUNNER, classification: "human" },
  { _id: "4", event: "install", fingerprint: LIVE_INSTANCE, classification: "human" },
  { _id: "5", event: "install", fingerprint: LIVE_DESKTOP, classification: "human" },
  { _id: "6", event: "first_run", fingerprint: LIVE_SCAN, classification: "human" },
  { _id: "7", event: "first_run", fingerprint: LIVE_DESKTOP, classification: "human" },
  { _id: "8", event: "install", fingerprint: LIVE_CGNAT_ROOT, classification: "ci" },
];

const humanOnly = scannerInstalls.filter((e) => resolvedClassification(e) === "human");
assert.deepEqual(
  humanOnly.map((e) => e.fingerprint),
  [LIVE_DESKTOP, LIVE_DESKTOP],
  "scorecard/getFunnel human installs must drop scanners",
);
assert.equal(computeMetrics(humanOnly).unique.install, 1);
assert.equal(computeMetrics(humanOnly).unique.first_run, 1);
assert.equal(resolvedClassification(scannerInstalls[0]), "bot");
assert.equal(resolvedClassification(scannerInstalls[2]), "ci");
assert.equal(resolvedClassification(scannerInstalls[7]), "ci");

console.log("convex funnel classifySource: live scanner fingerprints are not human");


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
