import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workspaces = readFileSync("convex/workspaces.ts", "utf8");
const providers = readFileSync("convex/providers.ts", "utf8");
const managedRouting = readFileSync("convex/managedRouting.ts", "utf8");
const mcp = readFileSync("src/index.ts", "utf8");
const workspacePage = readFileSync("landing/src/app/workspace/page.tsx", "utf8");
const adminPage = readFileSync("landing/src/app/admin/page.tsx", "utf8");
const workspaceSettings = readFileSync("convex/workspaceSettings.ts", "utf8");
const workspaceCatalog = readFileSync("landing/src/components/WorkspaceCatalog.tsx", "utf8");

for (const legacyAuthExport of ["createOTP", "createWorkspace", "createAgentSession", "createMagicLink"]) {
  assert.doesNotMatch(
    workspaces,
    new RegExp(`export const ${legacyAuthExport} = mutation\\(`),
    `${legacyAuthExport} must not be anonymously callable`,
  );
}
assert.doesNotMatch(workspaces, /export const getByEmail = query\(/, "workspace email lookup must be internal");

assert.match(mcp, /legacy_auth_retired/);
assert.doesNotMatch(workspacePage, /directCall:getDirectCallConfigByApiId/);
assert.doesNotMatch(workspacePage, /workspaceId: wsId/);
assert.doesNotMatch(adminPage, /ADMIN_PASSWORD|admin_auth|nordsym2026/);
assert.match(workspacePage, /defaultModel: defaultModel \|\| null/);
assert.match(workspaceSettings, /args\.defaultModel \?\? undefined/);
assert.match(workspaceCatalog, /fetch\(`\$\{GATEWAY_URL\}\/api\/discover`/);
assert.doesNotMatch(workspaceCatalog, /fetch\(`\$\{CONVEX_URL\}\/api\/discover`/);

for (const privilegedExport of ["registerProvider", "resetDiscoveryCounts"]) {
  assert.doesNotMatch(
    providers,
    new RegExp(`export const ${privilegedExport} = mutation\\(`),
    `${privilegedExport} must be internal or session scoped`,
  );
}

for (const secretQuery of [
  "getDirectCallConfigById",
  "getDirectCallConfigByApiId",
  "getAllConfigs",
  "getConfig",
]) {
  assert.doesNotMatch(
    managedRouting,
    new RegExp(`export const ${secretQuery} = query\\(`),
    `${secretQuery} must not expose provider credentials`,
  );
}

console.log("trust floor: legacy auth, provider ownership, admin, and managed credentials are closed");
