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
const missions = readFileSync("convex/missions.ts", "utf8");
const missionRunner = readFileSync("convex/missionRunner.ts", "utf8");
const missionPrimitives = readFileSync("convex/missionPrimitives.ts", "utf8");
const email = readFileSync("convex/email.ts", "utf8");
const spendAlerts = readFileSync("convex/spendAlerts.ts", "utf8");
const http = readFileSync("convex/http.ts", "utf8");
const billing = readFileSync("convex/billing.ts", "utf8");
const directCli = readFileSync("src/cli/commands/direct.ts", "utf8");
const clerkBridge = readFileSync("landing/src/app/api/workspace-auth/clerk-bridge/route.ts", "utf8");
const workspaceSessionRoute = readFileSync("landing/src/app/api/workspace-auth/session/route.ts", "utf8");
const workspaceSessionClient = readFileSync("landing/src/lib/workspace-session.ts", "utf8");
const clerkCallback = readFileSync("landing/src/app/auth/clerk-callback/page.tsx", "utf8");
const deviceAuth = readFileSync("convex/deviceAuth.ts", "utf8");

for (const legacyAuthExport of ["createOTP", "createWorkspace", "createAgentSession", "createMagicLink"]) {
  assert.doesNotMatch(
    workspaces,
    new RegExp(`export const ${legacyAuthExport} = mutation\\(`),
    `${legacyAuthExport} must not be anonymously callable`,
  );
}
assert.doesNotMatch(workspaces, /export const getByEmail = query\(/, "workspace email lookup must be internal");
assert.doesNotMatch(workspaces, /export const getSessionsByEmail = query\(/, "session enumeration must be internal");
assert.doesNotMatch(workspaces, /export const adminDeleteSession = mutation\(/, "session deletion must be internal");
assert.doesNotMatch(workspaces, /export const checkCallQuota = query\(/, "quota reads must be owner scoped");
assert.doesNotMatch(workspaces, /export const incrementUsage = mutation\(/, "usage writes must use the atomic managed ledger");

for (const missionExport of [
  "createMission",
  "getMission",
  "listForWorkspace",
  "listForSession",
  "runMission",
  "cancelMission",
]) {
  assert.doesNotMatch(
    missions,
    new RegExp(`export const ${missionExport} = (?:mutation|query|action)\\(`),
    `${missionExport} must not expose a tenant-unsafe public Convex surface`,
  );
}

for (const emailExport of [
  "sendMagicLinkEmail",
  "sendReminderEmail",
  "sendInvoicePaidEmail",
  "sendLimitReachedEmail",
]) {
  assert.doesNotMatch(email, new RegExp(`export const ${emailExport} = action\\(`));
}
for (const spendExport of ["sendBudgetAlertEmail", "sendBudgetExceededEmail"]) {
  assert.doesNotMatch(spendAlerts, new RegExp(`export const ${spendExport} = action\\(`));
}

assert.doesNotMatch(missionPrimitives, /"GENPRD_API_KEY"/, "mission templates must not receive ambient provider credentials");
assert.match(missionRunner, /fetch_http:disabled_use_registered_provider_action/);
assert.match(missionRunner, /source: "providerAction"/);
assert.match(http, /legacy_reminder_retired/);
assert.match(http, /legacy_balance_retired/);
assert.match(http, /legacy_credit_purchase_retired/);
assert.match(http, /public_credit_grant_retired/);
assert.match(http, /debug_endpoint_retired/);
assert.match(
  http,
  /path: "\/api\/discover"[\s\S]*?method: "POST"[\s\S]*?requireApiKeyAuth\(ctx, request\)/,
  "legacy managed discovery must require a verified workspace",
);
assert.match(
  http,
  /path: "\/api\/details"[\s\S]*?method: "POST"[\s\S]*?body\.providerId \|\| body\.name \|\| body\.api_id/,
  "provider details must accept the canonical client aliases",
);
assert.match(
  http,
  /!provider \|\| !isPubliclyAvailableManagedProvider\(String\(providerId\)\)/,
  "provider details must hide internal and unavailable providers",
);
assert.doesNotMatch(
  http,
  /APICLAW_PSEUDONYM_SECRET \|\| process\.env\.APICLAW_INTERNAL_SECRET/,
  "OpenRouter pseudonyms must use a dedicated secret",
);

for (const billingExport of [
  "linkCustomer",
  "updateSubscription",
  "putPaygOnHold",
  "recordUsage",
  "processPayment",
  "incrementCredits",
  "decrementCredits",
  "updateInvoiceStatus",
  "resetUsageOnCancellation",
  "updatePaymentMethodInfo",
  "getInfo",
  "getCurrentUsage",
  "getInvoices",
  "getUnreportedUsage",
  "getByStripeCustomerId",
  "getWorkspace",
]) {
  assert.doesNotMatch(
    billing,
    new RegExp(`export const ${billingExport} = (?:mutation|query)\\(`),
    `${billingExport} must not expose privileged billing state publicly`,
  );
}

assert.match(mcp, /legacy_auth_retired/);
assert.doesNotMatch(workspacePage, /directCall:getDirectCallConfigByApiId/);
assert.doesNotMatch(workspacePage, /workspaceId: wsId/);
assert.doesNotMatch(adminPage, /ADMIN_PASSWORD|admin_auth|nordsym2026/);
assert.match(workspacePage, /defaultModel: defaultModel \|\| null/);
assert.match(workspaceSettings, /args\.defaultModel \?\? undefined/);
assert.match(workspaceCatalog, /fetch\(`\$\{GATEWAY_URL\}\/api\/discover`/);
assert.match(workspaceCatalog, /"X-APIClaw-Session": sessionToken/);
assert.doesNotMatch(workspaceCatalog, /fetch\(`\$\{CONVEX_URL\}\/api\/discover`/);
assert.doesNotMatch(
  directCli,
  /gateway<any>\("\/v1\/discover"[\s\S]*?\}, false\)/,
  "CLI discovery must forward the authenticated local session",
);

assert.match(clerkBridge, /verification\?\.status === "verified"/);
assert.match(clerkBridge, /res\.cookies\.set\("apiclaw_workspace_session", result\.sessionToken,[\s\S]*?httpOnly: true/);
assert.doesNotMatch(clerkBridge, /searchParams\.set\("t", result\.sessionToken\)/);
assert.doesNotMatch(clerkBridge, /console\.error\([^\n]*result\)/);
assert.match(workspaceSessionRoute, /"Cache-Control": "no-store, private"/);
assert.match(workspaceSessionRoute, /path: "workspaces:mintBrowserSession"/);
assert.match(workspaceSessionRoute, /browserToken: result\.browserToken/);
assert.doesNotMatch(workspaceSessionRoute, /workspaceToken:\s*(?:token|ownerToken)/);
assert.doesNotMatch(workspaceSessionRoute, /browserToken:\s*ownerToken/);
assert.doesNotMatch(workspaceSessionRoute, /const token = cookieToken \|\| headerToken/);
assert.match(workspaceSessionClient, /requestBrowserSession\("POST", legacyToken\)/);
assert.match(workspaceSessionClient, /Authorization: `Bearer \$\{legacyToken\}`/);
assert.match(workspaceSessionClient, /localStorage\.removeItem\(LEGACY_STORAGE_KEY\)/);
assert.doesNotMatch(workspaceSessionClient, /localStorage\.setItem\(/);
assert.doesNotMatch(clerkCallback, /useSearchParams|localStorage|\?t=/);
assert.match(clerkCallback, /redirect\("\/workspace"\)/);
assert.match(deviceAuth, /status: "retired" as const/);
assert.match(deviceAuth, /Legacy device linking is retired/);
assert.doesNotMatch(deviceAuth, /ctx\.db\.insert\("deviceAuthCodes"/);
assert.doesNotMatch(deviceAuth, /sessionToken:\s*row\.sessionToken|status:\s*"linked"|linkUrl:/);
assert.doesNotMatch(mcp, /deviceAuth:(?:start|poll|complete)|attemptDeviceLink/);

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
