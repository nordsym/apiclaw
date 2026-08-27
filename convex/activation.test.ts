#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  FIRST_EXECUTE_FRANKFURTER,
  FIRST_EXECUTE_NASA,
  FIRST_EXECUTE_PATH,
  FIRST_EXECUTE_RAILS,
  claimFirstExecuteInTransaction,
  classifyFirstCall,
  firstExecuteGatewayUrl,
  firstExecuteIdempotencyKey,
  isFirstExecuteSuccess,
  postFirstExecuteRails,
  recordFirstCallApiSuccessInTransaction,
} from "./activation";
import {
  FIRST_EXECUTE_FRANKFURTER as CLI_FRANKFURTER,
  FIRST_EXECUTE_NASA as CLI_NASA,
  FIRST_EXECUTE_PATH as CLI_PATH,
} from "../src/first-call.js";

type Row = Record<string, any> & { _id: string };

function fakeCtx(options: { workspace?: Row; existing?: Row } = {}) {
  const inserted: Array<{ table: string; value: Record<string, any> }> = [];
  const db = {
    query(table: string) {
      assert.equal(table, "funnelEvents");
      return {
        withIndex(index: string, apply: (q: any) => unknown) {
          assert.equal(index, "by_dedupeKey");
          apply({ eq: (field: string, value: string) => ({ field, value }) });
          return { first: async () => options.existing ?? null };
        },
      };
    },
    async get() {
      return options.workspace ?? null;
    },
    async insert(table: string, value: Record<string, any>) {
      inserted.push({ table, value });
      return "event-new";
    },
  };
  return { ctx: { db } as any, inserted };
}

assert.equal(classifyFirstCall("user@example.com"), "human");
assert.equal(classifyFirstCall("operator@nordsym.com"), "internal");
assert.equal(classifyFirstCall("GUSTAVNORDSYNC@GMAIL.COM"), "internal");

const first = fakeCtx({
  workspace: {
    _id: "ws1",
    email: "user@example.com",
    status: "active",
    usageCount: 1,
  },
});
const firstResult = await recordFirstCallApiSuccessInTransaction(
  first.ctx,
  {
    workspaceId: "ws1" as any,
    path: "/v1/execute",
    authMethod: "session",
    provider: "brave_search",
    action: "search",
  },
  1234
);
assert.deepEqual(firstResult, {
  id: "event-new",
  deduped: false,
  event: "first_call_api_success",
});
assert.equal(first.inserted.length, 1);
assert.deepEqual(first.inserted[0], {
  table: "funnelEvents",
  value: {
    event: "first_call_api_success",
    classification: "human",
    workspaceId: "ws1",
    email: "user@example.com",
    dedupeKey: "first_call:ws1",
    props: {
      path: "/v1/execute",
      auth_method: "session",
      provider: "brave_search",
      action: "search",
      recorded_by: "gateway",
      prior_managed_calls: 0,
    },
    timestamp: 1234,
  },
});

const duplicate = fakeCtx({
  workspace: {
    _id: "ws1",
    email: "user@example.com",
    status: "active",
    usageCount: 1,
  },
  existing: { _id: "event-existing" },
});
const duplicateResult = await recordFirstCallApiSuccessInTransaction(
  duplicate.ctx,
  {
    workspaceId: "ws1" as any,
    path: "/v1/chat/completions",
    authMethod: "api-key",
  }
);
assert.deepEqual(duplicateResult, { id: "event-existing", deduped: true });
assert.equal(duplicate.inserted.length, 0);

const reactivated = fakeCtx({
  workspace: {
    _id: "ws3",
    email: "returning@example.com",
    status: "active",
    managedUsageCount: 8,
    usageCount: 12,
  },
});
const reactivatedResult = await recordFirstCallApiSuccessInTransaction(
  reactivated.ctx,
  {
    workspaceId: "ws3" as any,
    path: "/v1/chat/completions",
    authMethod: "api-key",
    provider: "openrouter",
    action: "chat_completions",
  },
  5678
);
assert.deepEqual(reactivatedResult, {
  id: "event-new",
  deduped: false,
  event: "workspace_reactivated",
});
assert.equal(reactivated.inserted[0].value.event, "workspace_reactivated");
assert.equal(reactivated.inserted[0].value.dedupeKey, "reactivation:ws3");
assert.equal(reactivated.inserted[0].value.props.prior_managed_calls, 7);

const inactive = fakeCtx({
  workspace: { _id: "ws2", email: "user@example.com", status: "unclaimed" },
});
const inactiveResult = await recordFirstCallApiSuccessInTransaction(
  inactive.ctx,
  {
    workspaceId: "ws2" as any,
    path: "/v1/execute",
    authMethod: "internal",
  }
);
assert.deepEqual(inactiveResult, {
  id: null,
  deduped: false,
  skipped: "workspace_not_active",
});
assert.equal(inactive.inserted.length, 0);

assert.equal(FIRST_EXECUTE_PATH, "/v1/execute");
assert.equal(FIRST_EXECUTE_PATH, CLI_PATH);
assert.deepEqual(FIRST_EXECUTE_NASA, CLI_NASA);
assert.deepEqual(FIRST_EXECUTE_FRANKFURTER, CLI_FRANKFURTER);
assert.deepEqual(FIRST_EXECUTE_RAILS, [FIRST_EXECUTE_NASA, FIRST_EXECUTE_FRANKFURTER]);
assert.equal(firstExecuteIdempotencyKey("ws1", "nasa"), "apiclaw-first:ws1:nasa");
assert.equal(isFirstExecuteSuccess(200, { success: true }), true);
assert.equal(isFirstExecuteSuccess(200, { success: false }), false);
assert.equal(isFirstExecuteSuccess(502, { success: true }), false);
assert.equal(
  firstExecuteGatewayUrl({ CONVEX_SITE_URL: "https://gateway.test/" }),
  "https://gateway.test",
);

function firstExecuteCtx(options: {
  workspace?: Row;
  firstCall?: Row;
  sessions?: Row[];
} = {}) {
  const patched: Array<{ id: string; value: Record<string, any> }> = [];
  const workspace = options.workspace ?? {
    _id: "ws1",
    email: "user@example.com",
    status: "active",
    updatedAt: 1,
  };
  const db = {
    async get() {
      return workspace;
    },
    async patch(id: string, value: Record<string, any>) {
      patched.push({ id, value });
      Object.assign(workspace, value);
    },
    query(table: string) {
      if (table === "funnelEvents") {
        return {
          withIndex(index: string, apply: (q: any) => unknown) {
            assert.equal(index, "by_dedupeKey");
            apply({ eq: (field: string, value: string) => ({ field, value }) });
            return { first: async () => options.firstCall ?? null };
          },
        };
      }
      assert.equal(table, "agentSessions");
      return {
        withIndex(index: string, apply: (q: any) => unknown) {
          assert.equal(index, "by_workspaceId");
          apply({ eq: (field: string, value: string) => ({ field, value }) });
          return { collect: async () => options.sessions ?? [] };
        },
      };
    },
  };
  return { ctx: { db } as any, workspace, patched };
}

const claimed = firstExecuteCtx({
  sessions: [{
    sessionToken: "owner-session-token-value",
    sessionKind: "owner",
    lastUsedAt: 20,
  }, {
    sessionToken: "browser-child",
    sessionKind: "browser",
    parentSessionId: "owner-id",
    expiresAt: Date.now() + 60_000,
    lastUsedAt: 99,
  }],
});
const claimedResult = await claimFirstExecuteInTransaction(claimed.ctx, "ws1" as any, 2000);
assert.deepEqual(claimedResult, { claimed: true, sessionToken: "owner-session-token-value" });
assert.equal(claimed.workspace.firstExecuteAttemptedAt, 2000);
assert.equal(claimed.patched.length, 1);

const replay = await claimFirstExecuteInTransaction(claimed.ctx, "ws1" as any, 3000);
assert.deepEqual(replay, { claimed: false, reason: "already_attempted" });

const alreadyActivated = firstExecuteCtx({
  firstCall: { _id: "event-existing" },
  sessions: [{ sessionToken: "owner-session-token-value", sessionKind: "owner", lastUsedAt: 1 }],
});
assert.deepEqual(
  await claimFirstExecuteInTransaction(alreadyActivated.ctx, "ws1" as any, 4000),
  { claimed: false, reason: "already_activated" },
);
assert.equal(alreadyActivated.workspace.firstExecuteAttemptedAt, 4000);

const noSession = firstExecuteCtx({ sessions: [] });
assert.deepEqual(
  await claimFirstExecuteInTransaction(noSession.ctx, "ws1" as any, 5000),
  { claimed: false, reason: "no_session" },
);
assert.equal(noSession.workspace.firstExecuteAttemptedAt, undefined);

const posts: Array<{ url: string; init?: RequestInit }> = [];
const nasaOk = await postFirstExecuteRails({
  sessionToken: "owner-session-token-value",
  workspaceId: "ws1",
  gatewayUrl: "https://gateway.test",
  fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
    posts.push({ url: String(url), init });
    return new Response(JSON.stringify({ success: true, data: { title: "Helix Nebula" } }), { status: 200 });
  }) as typeof fetch,
});
assert.equal(nasaOk.ok, true);
assert.equal(nasaOk.provider, "nasa");
assert.equal(nasaOk.action, "apod");
assert.equal(posts.length, 1);
assert.equal(posts[0].url, "https://gateway.test/v1/execute");
assert.equal(posts[0].init?.method, "POST");
assert.deepEqual(JSON.parse(String(posts[0].init?.body)), {
  provider: "nasa",
  action: "apod",
  params: {},
});
const nasaHeaders = posts[0].init?.headers as Record<string, string>;
assert.equal(nasaHeaders["X-APIClaw-Session"], "owner-session-token-value");
assert.equal(nasaHeaders["Idempotency-Key"], "apiclaw-first:ws1:nasa");
assert.equal(nasaHeaders["X-APIClaw-Internal"], undefined);
assert.doesNotMatch(JSON.stringify(posts), /\/v1\/call|CoinGecko|coingecko/);

posts.length = 0;
const fallback = await postFirstExecuteRails({
  sessionToken: "owner-session-token-value",
  workspaceId: "ws1",
  gatewayUrl: "https://gateway.test",
  fetchImpl: (async (_url: string | URL | Request, init?: RequestInit) => {
    posts.push({ url: "https://gateway.test/v1/execute", init });
    const body = JSON.parse(String(init?.body));
    if (body.provider === "nasa") {
      return new Response(JSON.stringify({ success: false }), { status: 502 });
    }
    return new Response(JSON.stringify({ success: true, data: { rates: { USD: 1.17 } } }), { status: 200 });
  }) as typeof fetch,
});
assert.equal(fallback.ok, true);
assert.equal(fallback.provider, "frankfurter");
assert.equal(fallback.action, "latest");
assert.equal(posts.length, 2);
assert.deepEqual(JSON.parse(String(posts[1].init?.body)), {
  provider: "frankfurter",
  action: "latest",
  params: { path: "/latest" },
});

function source(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
}

const activationSource = source("./activation.ts");
assert.match(activationSource, /export const completeFirstExecute = internalAction\(/);
assert.match(activationSource, /internal\.activation\.claimFirstExecute/);
assert.match(activationSource, /postFirstExecuteRails/);
assert.doesNotMatch(
  activationSource.slice(activationSource.indexOf("export const completeFirstExecute")),
  /first_call_api_success/,
  "session first execute must reuse the gateway first_call rail, not emit a new event",
);
assert.doesNotMatch(activationSource, /\/v1\/call|CoinGecko|apiclaw call/);

const clerkWeb = source("./workspaces.ts");
assert.match(
  clerkWeb,
  /export const getOrCreateForClerk = mutation\([\s\S]*internal\.activation\.completeFirstExecute[\s\S]*workspaceId: workspace\._id/,
  "web Clerk session mint must schedule the one-shot first execute",
);
const mintBrowser = clerkWeb.slice(
  clerkWeb.indexOf("export const mintBrowserSession"),
  clerkWeb.indexOf("export const getSession"),
);
assert.doesNotMatch(
  mintBrowser,
  /completeFirstExecute/,
  "browser child mint is not a Clerk session door and must not loop first execute",
);

const cliAuth = source("./cliAuth.ts");
assert.match(
  cliAuth,
  /export const _exchangeVerified = internalMutation\([\s\S]*internal\.activation\.completeFirstExecute[\s\S]*workspaceId: workspace\._id/,
  "CLI Clerk exchange must schedule the one-shot first execute",
);
assert.match(cliAuth, /event: "cli_browser_callback_success"/);

const clerkCallback = source("../landing/src/app/auth/clerk-callback/page.tsx");
assert.match(clerkCallback, /redirect\("\/workspace"\)/);
assert.doesNotMatch(clerkCallback, /\/v1\/execute|completeFirstExecute/);

console.log("convex activation: first successful gateway call is classified and deduped");
console.log("convex activation: Clerk session mint runs NASA then Frankfurter once per workspace");
