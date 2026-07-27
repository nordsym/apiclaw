#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { deriveManagedRequestId, deriveRequestFingerprint } from "./httpTrust";
import {
  classifyMissionReplay,
  isCustomerRunnableMissionTemplate,
} from "./missions";

const workspaceId = "workspace-a";
const idempotencyKey = "mission-request-42";
const firstPayload = { template: "prd-generation", params: { topic: "lobsters" } };
const conflictingPayload = { template: "prd-generation", params: { topic: "robots" } };
const firstId = await deriveManagedRequestId({
  idempotencyKey,
  workspaceId,
  provider: "mission",
  action: "start",
  path: "/v1/missions/start",
  payload: firstPayload,
});
const retryId = await deriveManagedRequestId({
  idempotencyKey,
  workspaceId,
  provider: "mission",
  action: "start",
  path: "/v1/missions/start",
  payload: firstPayload,
});
assert.equal(firstId, retryId);

const fingerprint = await deriveRequestFingerprint(firstPayload);
assert.equal(classifyMissionReplay(null, fingerprint), "create");
assert.equal(classifyMissionReplay({ requestFingerprint: fingerprint }, fingerprint), "replay");
assert.equal(
  classifyMissionReplay(
    { requestFingerprint: fingerprint },
    await deriveRequestFingerprint(conflictingPayload),
  ),
  "conflict",
);

assert.equal(isCustomerRunnableMissionTemplate([{
  kind: "fetch",
  config: { source: "providerAction", providerId: "GenPRD", actionName: "generate_prd" },
}]), false, "unverified variable-cost mission steps must not be advertised to customers");
assert.equal(isCustomerRunnableMissionTemplate([{
  kind: "fetch",
  config: { source: "providerAction", providerId: "brave_search", actionName: "search" },
}]), true);
assert.equal(isCustomerRunnableMissionTemplate([{
  kind: "fetch",
  config: { source: "providerAction", providerId: "replicate", actionName: "run" },
}]), false, "mission discovery must not advertise unavailable managed adapters");
assert.equal(isCustomerRunnableMissionTemplate([{
  kind: "transform",
  config: { model: "anthropic/claude-haiku-4-5", maxTokens: 200 },
}]), true);
assert.equal(isCustomerRunnableMissionTemplate([{
  kind: "fetch",
  config: { source: "http" },
}]), false, "raw HTTP mission steps stay off the customer surface");

const httpSource = readFileSync(fileURLToPath(new URL("./http.ts", import.meta.url)), "utf8");
const missionSource = readFileSync(fileURLToPath(new URL("./missions.ts", import.meta.url)), "utf8");
assert.match(httpSource, /Idempotency-Key/);
assert.match(missionSource, /by_workspaceId_requestId[\s\S]*?\.unique\(\)/);
assert.match(missionSource, /idempotency_conflict/);
assert.match(missionSource, /ctx\.scheduler\.runAfter\(0, internal\.missions\.runMission/);
assert.match(missionSource, /isCustomerExecutableManagedAction\(provider, action\)/);
const runnerSource = readFileSync(fileURLToPath(new URL("./missionRunner.ts", import.meta.url)), "utf8");
assert.match(runnerSource, /action: "chat"/);

for (const relativePath of [
  "../src/cli/commands/mission.ts",
  "../src/index.ts",
  "../landing/src/lib/mcp-tools-canon.ts",
]) {
  const clientSource = readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
  assert.match(clientSource, /Idempotency-Key/);
  assert.match(clientSource, /idempotencyKey/);
}

console.log("mission starts are workspace-keyed, replay-safe, and conflict-detecting");
