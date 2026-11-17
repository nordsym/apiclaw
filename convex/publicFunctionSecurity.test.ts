import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { convexTest } from "convex-test";
import { anyApi } from "convex/server";
import schema from "./schema";
import { requireInternalSecret } from "./functionAuth";
import { checkPublicInventory, inventoryPublicFunctions } from "../src/convex-public-inventory";

const internalModules = ["_listWorkspaces", "debugFilestackLogs", "mou", "migratePartnersProd", "migratePratham", "seedPratham"];
for (const module of internalModules) {
  const exports = await import(`./${module}.ts`) as Record<string, { isInternal?: boolean }>;
  assert.ok(Object.keys(exports).length > 0);
  for (const [name, fn] of Object.entries(exports)) assert.equal(fn.isInternal, true, `${module}:${name} must be internal`);
}

// The fixture injects actual exported registrations, including aliases and re-exports.
// Override compiler reads in memory so no deployable fixture is written to disk.
import ts from "typescript";
const readFile = ts.sys.readFile;
try {
  ts.sys.readFile = (path, encoding) => {
    const text = readFile(path, encoding);
    if (path.replace(/\\/g, "/").endsWith("/convex/waitlist.ts") || path === "convex/waitlist.ts") {
      return text + '\nimport { query as renamedQuery, mutation as renamedMutation, action as renamedAction } from "./_generated/server";\nexport const unauthenticatedFixture = renamedQuery({ args: {token: v.string()}, handler: async () => "no auth" });\nexport const mutationFixture = renamedMutation({ args: {}, handler: async () => null });\nexport const actionFixture = renamedAction({ args: {}, handler: async () => null });\nexport { run as leakedWorkspaceFixture } from "./_listWorkspaces";\nexport { snapshot as reexportedPublicFixture } from "./publicApiHealth";\nimport * as builders from "./_generated/server";\nexport const namespaceFixture = builders.query({ args: {}, handler: async () => null });\n';
    }
    return text;
  };
  const inventory = inventoryPublicFunctions();
  for (const name of ["unauthenticatedFixture", "mutationFixture", "actionFixture", "reexportedPublicFixture", "namespaceFixture"]) {
    assert.ok(checkPublicInventory(inventory).some((error) => error.includes(`waitlist:${name}`)), `${name} must fail regardless of argument names or builder aliases`);
  }
  assert.ok(!inventory.some((entry) => entry.id === "waitlist:leakedWorkspaceFixture"), "re-exporting internal functions must preserve internal visibility");
} finally { ts.sys.readFile = readFile; }

const previousSecret = process.env.APICLAW_INTERNAL_SECRET;
try {
  delete process.env.APICLAW_INTERNAL_SECRET;
  assert.throws(() => requireInternalSecret(""), /Unauthorized/);
  process.env.APICLAW_INTERNAL_SECRET = "synthetic-security-test-credential";
  const privileged = [
    "analytics:log", "capabilities:create", "capabilities:addProvider", "capabilities:logUsage",
    "credits:getAgentCredits", "credits:addCredits", "purchases:purchaseAccess", "usage:getUserUsage", "usage:logUsage",
    "pipelineAlign:upsertOpenAPIs", "pipelineAlign:funnelCounts", "seedIndexedRegistry:upsertBatch", "seedIndexedRegistry:pipelineCounts",
    "providers:trackDiscovery", "providers:logDiscovery", "mcpOAuth:logToolCall",
  ];
  for (const id of privileged) {
    const [module, name] = id.split(":");
    const exports = await import(`./${module}.ts`) as Record<string, { _handler: (ctx: unknown, args: unknown) => Promise<unknown> }>;
    for (const args of [{}, { internalSecret: "wrong" }]) {
      await assert.rejects(exports[name]._handler({}, args), /Unauthorized/, `${id} must reject before any database access`);
    }
  }
} finally {
  if (previousSecret === undefined) delete process.env.APICLAW_INTERNAL_SECRET;
  else process.env.APICLAW_INTERNAL_SECRET = previousSecret;
}

const t = convexTest(schema, {
  "./http.ts": () => import("./http"),
  "./providers.ts": () => import("./providers"),
  "./analytics.ts": () => import("./analytics"),
  "./agents.ts": () => import("./agents"),
  "./earnProgress.ts": () => import("./earnProgress"),
  "./workspaces.ts": () => import("./workspaces"),
  "./_generated/server.ts": () => import("./_generated/server"),
});
const fixture = await t.run(async (ctx) => {
  const now = Date.now();
  const workspaceId = await ctx.db.insert("workspaces", {
    email: "synthetic@example.invalid", status: "active", tier: "free",
    usageCount: 0, usageLimit: 0, createdAt: now, updatedAt: now,
  });
  const otherWorkspaceId = await ctx.db.insert("workspaces", {
    email: "other@example.invalid", status: "active", tier: "free",
    usageCount: 0, usageLimit: 0, createdAt: now, updatedAt: now,
  });
  await ctx.db.insert("agentSessions", {
    workspaceId, sessionToken: "synthetic-owner-session", sessionKind: "owner", createdAt: now, lastUsedAt: now,
  });
  const apiId = await ctx.db.insert("providerAPIs", {
    name: "Fixture API", description: "Catalog fixture", category: "test",
    pricingModel: "free", status: "approved", createdAt: now,
  });
  return { workspaceId, otherWorkspaceId, apiId };
});
for (const [ref, args] of [
  [anyApi.earnProgress.markFirstDirectCall, { workspaceId: fixture.otherWorkspaceId }],
  [anyApi.earnProgress.trackApiUsed, { workspaceId: fixture.otherWorkspaceId, apiId: "fixture:read" }],
  [anyApi.workspaces.claimAnonymousUsage, { workspaceId: fixture.otherWorkspaceId, machineFingerprint: "fixture" }],
] as const) {
  await assert.rejects(t.mutation(ref, { ...args, token: "synthetic-owner-session" }), /Invalid session/);
}
await assert.rejects(t.mutation(anyApi.agents.updateAIBackend, { token: "invalid", aiBackend: "fixture" }), /Invalid session/);
await t.mutation(anyApi.agents.updateAIBackend, { token: "synthetic-owner-session", aiBackend: "fixture" });
assert.equal((await t.run((ctx) => ctx.db.get(fixture.workspaceId)))?.aiBackend, "fixture");
assert.equal((await t.run((ctx) => ctx.db.get(fixture.otherWorkspaceId)))?.aiBackend, undefined);
assert.equal(await t.query(anyApi.providers.getApiById, { apiId: fixture.workspaceId }), null);
assert.equal((await t.query(anyApi.providers.getApiById, { apiId: fixture.apiId }))?.name, "Fixture API");
await assert.rejects(t.mutation(anyApi.analytics.log, {
  token: "synthetic-owner-session", workspaceId: fixture.otherWorkspaceId, event: "test", identifier: "fixture",
}), /Unauthorized/);
const logId = await t.mutation(anyApi.analytics.log, {
  token: "synthetic-owner-session", workspaceId: fixture.workspaceId, event: "test", identifier: "fixture",
});
const storedLog = await t.run((ctx) => ctx.db.get(logId));
assert.ok(storedLog);
assert.equal("token" in storedLog, false);
assert.equal("internalSecret" in storedLog, false);
for (const body of ["", "not json", JSON.stringify({ email: "synthetic@example.invalid", fingerprint: "fixture" })]) {
  const response = await t.fetch("/workspace/magic-link", { method: "POST", body });
  assert.equal(response.status, 410);
  const payload = await response.json();
  assert.equal(payload.error, "legacy_auth_retired");
  assert.equal("token" in payload, false);
  assert.equal("details" in payload, false);
}
const lookup = await t.fetch("/workspace/by-email?email=synthetic@example.invalid");
assert.equal(lookup.status, 410);
assert.doesNotMatch(await lookup.text(), /token|workspaceId/);
const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts as Record<string, string>;
assert.equal(scripts["convex:dev"], "node scripts/convex-safe.mjs dev");
assert.equal(scripts["convex:deploy"], "node scripts/convex-safe.mjs deploy");
console.log("public function security: internal visibility, fail-closed inventory, privileged auth, and permanent 410 responses passed");
