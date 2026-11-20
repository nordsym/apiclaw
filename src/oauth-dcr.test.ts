#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assertCanRegisterDynamicClient,
  BUILTIN_DCR_REDIRECT_URIS,
  CURSOR_DESKTOP_REDIRECT_URI,
  isAllowlistedPublicDynamicRedirect,
  initialAccessTokenMatches,
  isAllowlistedDynamicRedirect,
  MIN_INITIAL_ACCESS_TOKEN_LENGTH,
  registrationDecision,
} from "./oauth-dcr.js";

const TOKEN = "a".repeat(MIN_INITIAL_ACCESS_TOKEN_LENGTH);
const EVIL = ["https://evil.example/callback"];

function unauthenticated(redirectUris: string[] = EVIL) {
  return registrationDecision({
    authorizationHeader: null,
    configuredToken: undefined,
    redirectUris,
  });
}

const closed = unauthenticated();
assert.equal(closed.ok, false);
if (!closed.ok) {
  assert.equal(closed.status, 401);
  assert.equal(closed.error, "invalid_token");
}

const configuredButAnonymous = registrationDecision({
  authorizationHeader: null,
  configuredToken: TOKEN,
  redirectUris: ["http://127.0.0.1:43110/callback"],
});
assert.equal(configuredButAnonymous.ok, false);
if (!configuredButAnonymous.ok) assert.equal(configuredButAnonymous.status, 401);

const wrongToken = registrationDecision({
  authorizationHeader: `Bearer ${"b".repeat(MIN_INITIAL_ACCESS_TOKEN_LENGTH)}`,
  configuredToken: TOKEN,
  redirectUris: ["http://127.0.0.1:43110/callback"],
});
assert.equal(wrongToken.ok, false);
if (!wrongToken.ok) assert.equal(wrongToken.status, 401);

const shortConfigured = "c".repeat(MIN_INITIAL_ACCESS_TOKEN_LENGTH - 1);
assert.equal(initialAccessTokenMatches(shortConfigured, shortConfigured), false);
assert.equal(
  registrationDecision({
    authorizationHeader: `Bearer ${shortConfigured}`,
    configuredToken: shortConfigured,
    redirectUris: ["http://127.0.0.1/callback"],
  }).ok,
  false,
  "a short initial access token must not reopen registration",
);

const evilWithToken = registrationDecision({
  authorizationHeader: `Bearer ${TOKEN}`,
  configuredToken: TOKEN,
  redirectUris: EVIL,
});
assert.equal(evilWithToken.ok, false);
if (!evilWithToken.ok) {
  assert.equal(evilWithToken.status, 400);
  assert.equal(evilWithToken.error, "invalid_redirect_uri");
}
assert.throws(
  () => assertCanRegisterDynamicClient({
    presentedToken: undefined,
    configuredToken: TOKEN,
    redirectUris: EVIL,
  }),
  /dynamic_client_registration_closed/,
);
assert.throws(
  () => assertCanRegisterDynamicClient({
    presentedToken: TOKEN,
    configuredToken: TOKEN,
    redirectUris: EVIL,
  }),
  /invalid_redirect_uri/,
);

for (const allowed of [
  "http://localhost:43110/callback",
  "http://127.0.0.1:43110/callback",
  "http://[::1]:43110/callback",
  "https://grok.com/connectors-oauth/callback",
  "https://chat.openai.com/connector_callback",
  "https://chatgpt.com/connector_platform_oauth_redirect",
  "https://chatgpt.com/connector/oauth/abc_123",
]) {
  const decision = registrationDecision({
    authorizationHeader: `Bearer ${TOKEN}`,
    configuredToken: TOKEN,
    redirectUris: [allowed],
  });
  assert.equal(decision.ok, true, `${allowed} should be accepted with a valid initial access token`);
}

for (const blocked of [
  "https://evil.example/callback",
  "https://grok.com.evil.example/callback",
  "https://chatgpt.com.evil.example/connector/oauth/abc",
  "https://user:password@grok.com/connectors-oauth/callback",
  "https://grok.com/connectors-oauth/callback#token",
  "https://grok.com/connectors-oauth/callback?next=https://evil.example",
  "http://example.com/callback",
  "javascript://%0Adocument.title='PWNED'//",
  "cursor://oauth/callback",
]) {
  assert.equal(isAllowlistedDynamicRedirect(blocked, undefined), false, `${blocked} must stay blocked`);
}

const extra = registrationDecision({
  authorizationHeader: `Bearer ${TOKEN}`,
  configuredToken: TOKEN,
  redirectUris: ["https://client.example/callback"],
  extraAllowlistRaw: "https://client.example/callback, javascript:alert(1)",
});
assert.equal(extra.ok, true, "an operator allowlist entry may add one exact https redirect");

assert.equal(
  readFileSync("landing/src/lib/oauth-dcr.generated.ts", "utf8"),
  readFileSync("src/oauth-dcr.ts", "utf8"),
  "landing OAuth DCR policy must be synced from src/oauth-dcr.ts",
);

const registerRoute = readFileSync("landing/src/app/api/oauth/register/route.ts", "utf8");
assert.match(registerRoute, /registrationDecision\(/);
assert.ok(
  registerRoute.indexOf("registrationDecision(") < registerRoute.indexOf("await convexMutation"),
  "the route must check registration policy before calling Convex",
);
assert.match(registerRoute, /status:\s*401/);
assert.match(registerRoute, /initialAccessToken:\s*decision\.initialAccessToken/);
assert.doesNotMatch(registerRoute, /Open per spec/);

const oauthState = readFileSync("convex/mcpOAuth.ts", "utf8");
assert.match(
  oauthState,
  /export const registerDynamicClient = mutation\(\{[\s\S]*?initialAccessToken: v\.optional\(v\.string\(\)\)[\s\S]*?assertCanRegisterDynamicClient\([\s\S]*?ctx\.db\.insert\("mcpOAuthClients"/,
  "Convex registration must enforce the shared policy before inserting a client",
);
assert.match(
  oauthState,
  /export const getClientForAuthorize = query\(\{[\s\S]*?unboundDynamicRedirectRejected\(/,
  "unbound dynamic clients with untrusted redirects must not reach the consent screen",
);
assert.match(
  oauthState,
  /export const mintAuthCode = mutation\(\{[\s\S]*?unboundDynamicRedirectRejected\(/,
);
assert.match(oauthState, /if \(args\.codeChallengeMethod !== "S256"\)/);

const authorizeRoute = readFileSync("landing/src/app/api/oauth/authorize/route.ts", "utf8");
assert.match(authorizeRoute, /\(code_challenge_method \?\? "S256"\) !== "S256"/);
const authorizePage = readFileSync("landing/src/app/oauth/authorize/page.tsx", "utf8");
assert.match(authorizePage, /codeChallengeMethod !== "S256"/);

const metadata = readFileSync("landing/src/app/.well-known/oauth-authorization-server/route.ts", "utf8");
assert.ok(metadata.includes("registration_endpoint: `${ISSUER}/api/oauth/register`"));
const mcpMetadata = readFileSync("landing/src/app/.well-known/mcp/route.ts", "utf8");
assert.match(mcpMetadata, /dynamic_client_registration:\s*true/);

for (const allowed of [...BUILTIN_DCR_REDIRECT_URIS, "https://chatgpt.com/connector/oauth/abc_123"]) {
  assert.equal(unauthenticated([allowed]).ok, true, `${allowed} permits anonymous registration`);
  assert.equal(registrationDecision({
    authorizationHeader: null, configuredToken: TOKEN, redirectUris: [allowed],
  }).ok, true, "configuring an operator token must not disable allowlisted public clients");
}
assert.equal(unauthenticated([
  "https://www.cursor.com/agents/mcp/oauth/callback",
  "http://localhost:8787/callback",
  CURSOR_DESKTOP_REDIRECT_URI,
]).ok, true, "Cursor can register its callbacks together");
for (const blocked of [
  "http://localhost:8788/callback",
  "http://127.0.0.1:8787/callback",
  "http://localhost:8787/other",
  "https://www.cursor.com.evil.example/agents/mcp/oauth/callback",
  "https://cursor.com/agents/mcp/oauth/callback",
  "https://www.cursor.com/agents/mcp/oauth/callback/extra",
  "https://www.cursor.com/agents/mcp/oauth/callback?next=https://evil.example",
  "https://www.cursor.com/agents/mcp/oauth/callback#fragment",
  "https://www.cursor.com/agents/mcp/oauth/../oauth/callback",
  "https://www.cursor.com:443/agents/mcp/oauth/callback",
  "https://user:password@www.cursor.com/agents/mcp/oauth/callback",
  "https://chatgpt.com/connector/oauth/abc/extra",
  "https://chatgpt.com/connector/oauth/abc?next=evil",
  "cursor://anysphere.cursor-mcp/oauth/callback/extra",
  "cursor://anysphere.cursor-mcp/oauth/callback?next=evil",
  "cursor://anysphere.cursor-mcp.evil.example/oauth/callback",
  "cursor://other/oauth/callback",
  "cursor-nightly://anysphere.cursor-mcp/oauth/callback",
]) {
  assert.equal(isAllowlistedPublicDynamicRedirect(blocked, undefined), false, blocked);
  assert.equal(unauthenticated([blocked]).ok, false, blocked);
}
for (const redirects of [[], [CURSOR_DESKTOP_REDIRECT_URI, ...EVIL], [CURSOR_DESKTOP_REDIRECT_URI, 42] as unknown as string[]]) {
  assert.equal(unauthenticated(redirects).ok, false, "every redirect must be on the exact allowlist");
}
assert.equal(registrationDecision({
  authorizationHeader: null, configuredToken: undefined,
  redirectUris: ["https://client.example/callback"],
  extraAllowlistRaw: "https://client.example/callback, javascript:alert(1)",
}).ok, true, "operators can extend public DCR with one exact safe callback");
assert.equal(registrationDecision({
  authorizationHeader: "Basic invalid", configuredToken: TOKEN,
  redirectUris: [CURSOR_DESKTOP_REDIRECT_URI],
}).ok, false, "explicit invalid authentication must fail closed");
const anonymousCursor = unauthenticated([CURSOR_DESKTOP_REDIRECT_URI]);
assert.equal(anonymousCursor.ok, true);
if (anonymousCursor.ok) assert.equal(anonymousCursor.initialAccessToken, undefined);
console.log("OAuth DCR permits exact allowlisted anonymous callbacks and keeps open registration closed");
