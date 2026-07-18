import assert from "node:assert/strict";
import {
  getAgentPresence,
  getWorkspaceNavigation,
  isUnlimitedWorkspace,
} from "./workspace-truth";

assert.equal(isUnlimitedWorkspace({ tier: "founder", usageLimit: -1 }), true);
assert.equal(isUnlimitedWorkspace({ tier: "partner", usageLimit: -1 }), true);
assert.equal(isUnlimitedWorkspace({ tier: "enterprise", usageLimit: -1 }), true);
assert.equal(isUnlimitedWorkspace({ tier: "free", usageLimit: 50 }), false);

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
  ["Home", "Catalog & Test", "Connections", "Activity", "Billing", "Settings"],
);
assert.equal(
  getWorkspaceNavigation({ isProvider: false }).some((item) => item.id === "provider-console"),
  false,
);
assert.equal(
  getWorkspaceNavigation({ isProvider: true }).at(-1)?.label,
  "Provider Console",
);

console.log("workspace truth keeps quota, presence, and navigation honest");
