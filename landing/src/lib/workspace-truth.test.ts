import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getAgentPresence,
  getWorkspaceNavigation,
  isUnlimitedWorkspace,
} from "./workspace-truth";

assert.equal(isUnlimitedWorkspace({ tier: "founder", usageLimit: -1 }), true);
assert.equal(isUnlimitedWorkspace({ tier: "partner", usageLimit: -1 }), true);
assert.equal(isUnlimitedWorkspace({ tier: "enterprise", usageLimit: -1 }), true);
assert.equal(isUnlimitedWorkspace({ tier: "free", usageLimit: 50 }), false);
assert.equal(isUnlimitedWorkspace({ tier: "usage_based", usageLimit: -1, paygActive: true }), true);
assert.equal(isUnlimitedWorkspace({ tier: "usage_based", usageLimit: 25, paygActive: false }), false);
assert.equal(isUnlimitedWorkspace({ tier: "usage_based", usageLimit: -1 }), false);
assert.equal(isUnlimitedWorkspace({ tier: "pro", usageLimit: 25 }), false);

const now = Date.UTC(2026, 6, 18, 12, 0, 0);
assert.deepEqual(getAgentPresence(now - 2 * 60_000, now), {
  state: "active",
  label: "Active now",
});
assert.deepEqual(getAgentPresence(now - 2 * 24 * 60 * 60_000, now), {
  state: "recent",
  label: "Last seen 2d ago",
});
assert.deepEqual(getAgentPresence(now - 120 * 24 * 60 * 60_000, now), {
  state: "inactive",
  label: "Last seen 120d ago",
});

assert.deepEqual(
  getWorkspaceNavigation({ isProvider: false }).map((item) => item.label),
  ["Agents", "Catalog", "Activity", "Billing", "Settings"],
);
assert.equal(
  getWorkspaceNavigation({ isProvider: false }).some((item) => item.id === "provider-console"),
  false,
);
assert.equal(
  getWorkspaceNavigation({ isProvider: true }).at(-1)?.label,
  "Provider Console",
);

const workspaceCatalogSource = readFileSync(
  new URL("../components/WorkspaceCatalog.tsx", import.meta.url),
  "utf8",
);
assert.match(workspaceCatalogSource, /"Idempotency-Key": idempotencyKey/);
assert.match(workspaceCatalogSource, /testCallIdempotencyKeyRef\.current = idempotencyKey/);
assert.match(workspaceCatalogSource, /testCallIdempotencyKeyRef\.current = null/);
assert.match(workspaceCatalogSource, /errorCode === "idempotency_conflict" \|\| response\.status >= 500/);
// Workspace rebuild (137d5c4, 2026-08-23) also disables the test-call controls
// while a call is running, not only when its outcome is unknown.
assert.match(workspaceCatalogSource, /disabled=\{outcomeUnknown \|\| running\}/);
assert.match(workspaceCatalogSource, /sessionStorage\.setItem\(TEST_CALL_PENDING_STORAGE_KEY/);
assert.match(workspaceCatalogSource, /customerExecutableActions\?\.length/);
assert.match(workspaceCatalogSource, /actions: provider\.customerExecutableActions/);

console.log("workspace truth keeps quota, presence, and navigation honest");
