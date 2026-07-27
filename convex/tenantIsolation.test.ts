#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { providerActionBelongsToConfig } from "./managedRouting";

function source(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
}

assert.equal(providerActionBelongsToConfig({ directCallId: "config-a" }, "config-a"), true);
assert.equal(providerActionBelongsToConfig({ directCallId: "config-b" }, "config-a"), false);
assert.equal(providerActionBelongsToConfig(null, "config-a"), false);

const routing = source("./managedRouting.ts");
assert.match(
  routing,
  /export const saveAction = mutation\([\s\S]*?const existingAction = await ctx\.db\.get\(args\.id\)[\s\S]*?providerActionBelongsToConfig\(existingAction, args\.directCallId\)[\s\S]*?ctx\.db\.patch\(args\.id/,
  "an authenticated provider cannot patch an action owned by another config",
);

const logs = source("./logs.ts");
const subagentLogs = logs.slice(
  logs.indexOf("export const getBySubagent"),
  logs.indexOf("export const clearWorkspaceLogs"),
);
assert.equal(
  (subagentLogs.match(/withIndex\("by_workspaceId"/g) ?? []).length,
  2,
  "both API and search activity are scoped to the authenticated workspace",
);
assert.doesNotMatch(subagentLogs, /\.\.\.l[,}]/, "raw log documents must not be returned");
assert.doesNotMatch(subagentLogs, /sessionToken/, "activity projections never expose bearer tokens");

const agents = source("./agents.ts");
const subagentStats = agents.slice(
  agents.indexOf("export const getSubagentStats"),
  agents.indexOf("export const renameSubagent"),
);
assert.match(subagentStats, /withIndex\("by_workspaceId"[\s\S]*?session\.workspaceId/);
assert.match(subagentStats, /q\.field\("subagentId"\), subagentId/);

const searchLogs = source("./searchLogs.ts");
assert.match(searchLogs, /export const getTopQueries = internalQuery\(/);
assert.match(searchLogs, /export const getZeroResultQueries = internalQuery\(/);

const analytics = source("./analytics.ts");
assert.match(analytics, /export const getStats = internalQuery\(/);
assert.match(analytics, /export const getRecent = internalQuery\(/);

const funnel = source("./funnel.ts");
for (const name of ["getFunnel", "getScorecard", "getDiagnostics", "getRecent"]) {
  assert.match(funnel, new RegExp(`export const ${name} = internalQuery\\(`));
}
const recordEvent = funnel.slice(
  funnel.indexOf("export const recordEvent"),
  funnel.indexOf("export const recordEventInternal"),
);
assert.doesNotMatch(recordEvent, /sessionToken/, "telemetry can never accept or persist a bearer token");
assert.match(
  recordEvent,
  /args\.event === "workspace_authenticated"[\s\S]*?args\.event === "first_call_api_success"[\s\S]*?args\.event === "workspace_reactivated"/,
  "activation events must be emitted only by authenticated server paths",
);
assert.match(funnel, /export const scrubStoredSessionTokens = internalMutation\(/);
assert.match(funnel, /return \{[\s\S]*?exposedRows[\s\S]*?revokedSessions[\s\S]*?scrubbedRows/);

console.log("tenant analytics, provider actions, and funnel telemetry fail closed");
