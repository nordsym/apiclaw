#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Doc } from "./_generated/dataModel";
import type { DatabaseReader } from "./_generated/server";
import { findUsableAgentSession } from "./sessionSecurity";

function fakeDb(session: Doc<"agentSessions"> | null): DatabaseReader {
  return {
    query: () => ({
      withIndex: (_name: string, select: (q: { eq: (field: string, value: string) => unknown }) => unknown) => {
        select({ eq: () => ({}) });
        return { first: async () => session };
      },
    }),
  } as unknown as DatabaseReader;
}

const now = Date.UTC(2026, 6, 19, 12);
const base = {
  _id: "session-id",
  _creationTime: now,
  workspaceId: "workspace-id",
  sessionToken: "session-token",
  lastUsedAt: now,
  createdAt: now,
} as unknown as Doc<"agentSessions">;
const owner = { ...base, sessionKind: "owner" as const } as Doc<"agentSessions">;
const browser = {
  ...base,
  sessionKind: "browser" as const,
  parentSessionId: "parent-id",
  expiresAt: now + 60_000,
} as unknown as Doc<"agentSessions">;
const expiredBrowser = { ...browser, expiresAt: now } as Doc<"agentSessions">;

assert.equal(await findUsableAgentSession(fakeDb(owner), owner.sessionToken, { now }), owner);
assert.equal(await findUsableAgentSession(fakeDb(browser), browser.sessionToken, { now }), browser);
assert.equal(
  await findUsableAgentSession(fakeDb(browser), browser.sessionToken, { audience: "durable", now }),
  null,
  "CLI and MCP durable-session entrypoints reject browser children",
);
assert.equal(
  await findUsableAgentSession(fakeDb(expiredBrowser), expiredBrowser.sessionToken, { now }),
  null,
  "every shared verifier rejects an expired browser child before scheduled cleanup",
);

const convexDir = dirname(fileURLToPath(import.meta.url));
const directLookupFiles = readdirSync(convexDir)
  .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts") && name !== "sessionSecurity.ts")
  .filter((name) => readFileSync(join(convexDir, name), "utf8").includes('withIndex("by_sessionToken"'));
assert.deepEqual(
  directLookupFiles,
  [],
  "session-token consumers must not bypass the shared expiry verifier",
);

const agentsSource = readFileSync(join(convexDir, "agents.ts"), "utf8");
const apiKeysSource = readFileSync(join(convexDir, "apiKeys.ts"), "utf8");
const httpSource = readFileSync(join(convexDir, "http.ts"), "utf8");
const mcpOAuthSource = readFileSync(join(convexDir, "mcpOAuth.ts"), "utf8");
const workspacesSource = readFileSync(join(convexDir, "workspaces.ts"), "utf8");
const apiKeyRouteSource = readFileSync(
  join(convexDir, "../landing/src/app/api/workspace/api-keys/route.ts"),
  "utf8",
);
const connectorRouteSource = readFileSync(
  join(convexDir, "../landing/src/app/api/workspace/connectors/route.ts"),
  "utf8",
);
const oauthAuthorizeRouteSource = readFileSync(
  join(convexDir, "../landing/src/app/api/oauth/authorize/route.ts"),
  "utf8",
);
// Workspace rebuild (137d5c4, 2026-08-23) split page.tsx into views/*.tsx.
// Agents-home restructure (2026-08-24) dissolved views/Connections.tsx; the
// API key mint call now lives in views/Settings.tsx. The same day's
// Integrations fold moved connector minting into views/Agents.tsx;
// /workspace/integrations is a bookmark redirect only.
const workspacePageSource = readFileSync(
  join(convexDir, "../landing/src/app/workspace/page.tsx"),
  "utf8",
) + readFileSync(
  join(convexDir, "../landing/src/app/workspace/views/Settings.tsx"),
  "utf8",
);
const agentsViewSource = readFileSync(
  join(convexDir, "../landing/src/app/workspace/views/Agents.tsx"),
  "utf8",
);
const integrationsRedirectSource = readFileSync(
  join(convexDir, "../landing/src/app/workspace/integrations/page.tsx"),
  "utf8",
);
assert.match(
  agentsSource,
  /findUsableAgentSession\(ctx\.db, sessionToken, \{ audience: "durable" \}\)/,
);
assert.match(
  workspacesSource,
  /findUsableAgentSession\(ctx\.db, args\.sessionToken, \{ audience: "durable" \}\)/,
);
assert.match(
  apiKeysSource,
  /export const generateKey[\s\S]*?findUsableAgentSession\(ctx\.db, args\.token, \{ audience: "durable" \}\)/,
  "browser sessions must never mint permanent API keys",
);
assert.match(
  mcpOAuthSource,
  /export const createDashboardConnector[\s\S]*?findUsableAgentSession\(ctx\.db, args\.sessionToken, \{ audience: "durable" \}\)/,
  "browser sessions must never create long-lived OAuth connectors",
);
assert.match(
  mcpOAuthSource,
  /export const mintAuthCode[\s\S]*?findUsableAgentSession\(ctx\.db, args\.sessionToken, \{ audience: "durable" \}\)/,
  "browser sessions must never mint an OAuth code that can become a refresh token",
);
assert.doesNotMatch(httpSource, /path: "\/workspace\/poll"/);
assert.doesNotMatch(httpSource, /path: "\/workspace\/verify-session"/);
assert.doesNotMatch(workspacesSource, /export const pollMagicLink/);
assert.doesNotMatch(workspacesSource, /magicLink[\s\S]*?sessionToken: session\?\.sessionToken/);
for (const [source, mutation] of [
  [apiKeyRouteSource, "apiKeys:generateKey"],
  [connectorRouteSource, "mcpOAuth:createDashboardConnector"],
  [oauthAuthorizeRouteSource, "mcpOAuth:mintAuthCode"],
] as const) {
  assert.match(source, /cookies\.get\("apiclaw_workspace_session"\)\?\.value/);
  assert.match(source, new RegExp(mutation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.doesNotMatch(workspacePageSource, /apiKeys:generateKey/);
assert.match(workspacePageSource, /fetch\("\/api\/workspace\/api-keys"/);
assert.doesNotMatch(agentsViewSource, /mcpOAuth:createDashboardConnector/);
assert.match(agentsViewSource, /fetch\("\/api\/workspace\/connectors"/);
assert.match(
  integrationsRedirectSource,
  /router\.replace\("\/workspace\?tab=agents"\)/,
  "retired /workspace/integrations must redirect to Agents, not own connector calls",
);
assert.doesNotMatch(
  integrationsRedirectSource,
  /fetch\("\/api\/workspace\/connectors"/,
  "retired /workspace/integrations must not mint connectors",
);
assert.match(
  workspacesSource,
  /export const verifySession[\s\S]*?findUsableAgentSession\(ctx\.db, sessionToken\);/,
  "the HTTP gateway keeps short-lived browser access for the golden managed first call",
);
assert.match(
  workspacesSource,
  /const sessionFingerprint = fingerprint\?\.trim\(\) \|\| `clerk:\$\{clerkUserId\}`/,
  "Clerk sign-ins must always reuse a stable owner-session fingerprint",
);
assert.match(
  workspacesSource,
  /const \[existingSession, \.\.\.duplicateOwnerSessions\][\s\S]*?for \(const duplicate of duplicateOwnerSessions\)[\s\S]*?ctx\.db\.delete\(duplicate\._id\)/,
  "legacy duplicate Clerk owner sessions must be consolidated during rotation",
);

console.log("all bearer consumers share expiry enforcement and CLI/MCP reject browser children");
