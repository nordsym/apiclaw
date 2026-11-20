import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { convexTest } from "convex-test";
import { anyApi } from "convex/server";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { NextRequest } = require("../landing/node_modules/next/server.js");
import schema from "../convex/schema";
const { POST: register } = require("../landing/src/app/api/oauth/register/route.ts");
const { POST: authorize } = require("../landing/src/app/api/oauth/authorize/route.ts");
const { POST: token } = require("../landing/src/app/api/oauth/token/route.ts");
const { GET: authorizationMetadata } = require("../landing/src/app/.well-known/oauth-authorization-server/route.ts");
const { GET: resourceMetadata } = require("../landing/src/app/.well-known/oauth-protected-resource/route.ts");
import { CURSOR_DESKTOP_REDIRECT_URI } from "../src/oauth-dcr";

// Real route handlers and Convex mutations, with all backend calls confined to
// convex-test. No live service or credentials are used by this test.
const t = convexTest(schema, {
  "./mcpOAuth.ts": () => import("../convex/mcpOAuth"),
  "./_generated/server.ts": () => import("../convex/_generated/server"),
});
const oauth = anyApi.mcpOAuth;
const cursorWeb = "https://www.cursor.com/agents/mcp/oauth/callback";
const cursorLocal = "http://localhost:8787/callback";
const callbacks = [cursorWeb, cursorLocal, CURSOR_DESKTOP_REDIRECT_URI];
const originalFetch = globalThis.fetch;
const originalNow = Date.now;
const previousToken = process.env.OAUTH_DCR_INITIAL_ACCESS_TOKEN;
const previousAllowlist = process.env.OAUTH_DCR_REDIRECT_ALLOWLIST;
let now = originalNow();
Date.now = () => now;
delete process.env.OAUTH_DCR_INITIAL_ACCESS_TOKEN;
delete process.env.OAUTH_DCR_REDIRECT_ALLOWLIST;
let backendCalls = 0;
let registrationArgs: Record<string, unknown> = {};
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input));
  assert.equal(url.pathname, "/api/mutation", "unexpected network call");
  const body = JSON.parse(String(init?.body)) as { path: string; args: Record<string, unknown> };
  assert.ok(body.path.startsWith("mcpOAuth:"));
  const name = body.path.slice("mcpOAuth:".length);
  if (name === "registerDynamicClient") registrationArgs = body.args;
  backendCalls++;
  try {
    const value = await t.mutation(oauth[name], body.args);
    return Response.json({ status: "success", value });
  } catch (error) {
    return Response.json({ status: "error", errorMessage: String(error) });
  }
};
const registrationRequest = (redirects: unknown, extra: Record<string, unknown> = {}) =>
  new NextRequest("https://apiclaw.cloud/api/oauth/register", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ redirect_uris: redirects, token_endpoint_auth_method: "none", ...extra }),
  });
try {
  const resource = await (await resourceMetadata()).json();
  assert.equal(resource.resource, "https://apiclaw.cloud/mcp");
  assert.deepEqual(resource.authorization_servers, ["https://apiclaw.cloud"]);
  const metadata = await (await authorizationMetadata()).json();
  assert.equal(metadata.registration_endpoint, "https://apiclaw.cloud/api/oauth/register");
  assert.deepEqual(metadata.code_challenge_methods_supported, ["S256"]);

  for (const redirects of [
    ["https://random.example/callback"], [],
    [cursorWeb, "https://random.example/callback"],
    [cursorWeb, 42], ["http://localhost:8788/callback"],
    ["https://www.cursor.com/agents/mcp/oauth/callback?next=evil"],
  ]) {
    const response = await register(registrationRequest(redirects));
    assert.ok([400, 401].includes(response.status));
  }
  assert.equal((await register(new NextRequest("https://apiclaw.cloud/api/oauth/register", {
    method: "POST", body: "null",
  }))).status, 400);
  assert.equal(backendCalls, 0, "blocked HTTP registrations must not call Convex");
  await assert.rejects(t.mutation(oauth.registerDynamicClient, {
    name: "Untrusted", redirectUris: ["https://random.example/callback"],
  }), /dynamic_client_registration_closed/);
  await assert.rejects(t.mutation(oauth.registerDynamicClient, {
    name: "Untrusted", redirectUris: [cursorWeb, "https://random.example/callback"],
  }), /dynamic_client_registration_closed/);
  assert.equal(await t.run(async (ctx) => (await ctx.db.query("mcpOAuthClients").collect()).length), 0);

  // A single multi-redirect registration supports every verified Cursor surface.
  const registration = await register(registrationRequest(callbacks, { client_name: "Cursor MCP fixture" }));
  assert.equal(registration.status, 201);
  const client = await registration.json();
  assert.deepEqual(client.redirect_uris, callbacks);
  assert.equal(client.token_endpoint_auth_method, "none");
  assert.equal(client.client_secret, undefined);
  assert.equal(client.scope, "mcp", "same default maximum as dashboard connectors");
  assert.equal(registrationArgs.initialAccessToken, undefined);
  assert.equal(await t.run(async (ctx) => (await ctx.db.query("mcpOAuthTokens").collect()).length), 0);

  const sessionToken = "oauth-session-fixture";
  const workspaceId = await t.run(async (ctx) => {
    const id = await ctx.db.insert("workspaces", {
      email: "oauth-owner-fixture", status: "active", tier: "free",
      usageCount: 0, usageLimit: 0, createdAt: now, updatedAt: now,
    });
    await ctx.db.insert("agentSessions", {
      workspaceId: id, sessionToken, sessionKind: "owner", lastUsedAt: now, createdAt: now,
    });
    return id;
  });
  const verifier = "v".repeat(43);
  const codeChallenge = createHash("sha256").update(verifier).digest("base64url");
  const authorizationRequest = (redirect: string, signedIn: boolean) => new NextRequest(metadata.authorization_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(signedIn ? { Cookie: `apiclaw_workspace_session=${sessionToken}` } : {}) },
    body: JSON.stringify({
      client_id: client.client_id, redirect_uri: redirect, code_challenge: codeChallenge,
      code_challenge_method: "S256", state: "opaque-fixture-state", scope: "mcp:read",
    }),
  });
  assert.equal((await authorize(authorizationRequest(cursorWeb, false))).status, 401);
  await assert.rejects(t.mutation(oauth.mintAuthCode, {
    sessionToken: "invalid-fixture", clientId: client.client_id, redirectUri: cursorWeb,
    codeChallenge, codeChallengeMethod: "S256",
  }), /invalid_session/);

  for (const callback of callbacks) {
    assert.ok(await t.query(oauth.getClientForAuthorize, { clientId: client.client_id, redirectUri: callback }));
    const response = await authorize(authorizationRequest(callback, true));
    assert.equal(response.status, 200);
    const redirect = new URL((await response.json()).redirect);
    assert.equal(redirect.searchParams.get("state"), "opaque-fixture-state");
    const code = redirect.searchParams.get("code");
    assert.ok(code);
    const exchange = (redirectUri: string, codeVerifier: string) => token(new NextRequest(metadata.token_endpoint, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code", client_id: client.client_id, code,
        redirect_uri: redirectUri, code_verifier: codeVerifier,
      }).toString(),
    }));
    assert.equal((await exchange("https://random.example/callback", verifier)).status, 400);
    assert.equal((await exchange(callback, "wrong-verifier")).status, 400);
    const tokens = await exchange(callback, verifier);
    assert.equal(tokens.status, 200);
    const pair = await tokens.json();
    assert.equal(pair.scope, "mcp:read");
    const bearer = await t.query(oauth.resolveBearerToken, { token: pair.access_token });
    assert.equal(bearer.ok, true);
    assert.equal(bearer.workspaceId, workspaceId);
    assert.equal(bearer.scope, "mcp:read");
    assert.equal((await exchange(callback, verifier)).status, 400, "code is single use");
  }
  const otherSession = "other-oauth-fixture";
  await t.run(async (ctx) => {
    const other = await ctx.db.insert("workspaces", {
      email: "other-owner-fixture", status: "active", tier: "free",
      usageCount: 0, usageLimit: 0, createdAt: now, updatedAt: now,
    });
    await ctx.db.insert("agentSessions", {
      workspaceId: other, sessionToken: otherSession, lastUsedAt: now, createdAt: now,
    });
  });
  await assert.rejects(t.mutation(oauth.mintAuthCode, {
    sessionToken: otherSession, clientId: client.client_id, redirectUri: cursorWeb,
    codeChallenge, codeChallengeMethod: "S256",
  }), /client_bound_to_other_workspace/);

  const scoped = await register(registrationRequest([cursorWeb], { scope: "mcp:read" }));
  const scopedClient = await scoped.json();
  assert.equal(scoped.status, 201);
  await assert.rejects(t.mutation(oauth.mintAuthCode, {
    sessionToken, clientId: scopedClient.client_id, redirectUri: cursorWeb,
    codeChallenge, codeChallengeMethod: "S256", scope: "mcp",
  }), /exceeds/);
  assert.equal((await register(registrationRequest([cursorWeb], { scope: "admin" }))).status, 400);

  // The existing env allowlist is enforced independently by route and Convex.
  process.env.OAUTH_DCR_REDIRECT_ALLOWLIST = "https://verified-client.example/callback";
  assert.equal((await register(registrationRequest(["https://verified-client.example/callback"]))).status, 201);
  assert.equal((await register(registrationRequest(["https://verified-client.example/other"]))).status, 401);

  // A durable global bucket cannot be bypassed by a new name or callback ID.
  const bucketCount = await t.run(async (ctx) => (await ctx.db.query("rateLimits").collect())[0].count);
  for (let i = bucketCount; i < 60; i++) {
    await t.mutation(oauth.registerDynamicClient, {
      name: `Rate fixture ${i}`, redirectUris: [cursorWeb], tokenEndpointAuthMethod: "none",
    });
  }
  await assert.rejects(t.mutation(oauth.registerDynamicClient, {
    name: "Over limit", redirectUris: [cursorLocal],
  }), /dynamic_client_registration_rate_limited/);
  const limited = await register(registrationRequest([cursorWeb]));
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("Retry-After"), "60");
  assert.equal(await t.run(async (ctx) => (await ctx.db.query("mcpOAuthClients").collect()).length), 60);
  now += 60_000;
  assert.equal((await register(registrationRequest([cursorWeb]))).status, 201);
} finally {
  globalThis.fetch = originalFetch;
  Date.now = originalNow;
  if (previousToken === undefined) delete process.env.OAUTH_DCR_INITIAL_ACCESS_TOKEN;
  else process.env.OAUTH_DCR_INITIAL_ACCESS_TOKEN = previousToken;
  if (previousAllowlist === undefined) delete process.env.OAUTH_DCR_REDIRECT_ALLOWLIST;
  else process.env.OAUTH_DCR_REDIRECT_ALLOWLIST = previousAllowlist;
}
console.log("MCP OAuth: metadata, allowlisted DCR, consent, workspace binding, PKCE, scope and durable rate limit passed locally");
