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
  scheduleCompleteFirstExecute,
  scheduleCompleteFirstExecuteForSession,
  shouldScheduleFirstExecute,
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

const ownerSession = { sessionKind: "owner" as const, sessionToken: "owner-session-token-value" };
const browserChild = {
  sessionKind: "browser" as const,
  parentSessionId: "owner-id",
  expiresAt: Date.now() + 60_000,
  sessionToken: "browser-child",
};
assert.equal(shouldScheduleFirstExecute(ownerSession), true);
assert.equal(shouldScheduleFirstExecute(browserChild), false, "browser children must not schedule first execute");
assert.equal(shouldScheduleFirstExecute(null), false);

function scheduleCtx(options: { workspace?: Row; throwOnSchedule?: boolean } = {}) {
  const scheduled: Array<{ workspaceId: string }> = [];
  const workspace = options.workspace ?? {
    _id: "ws1",
    email: "user@example.com",
    status: "active",
    updatedAt: 1,
  };
  const ctx = {
    db: {
      async get() {
        return workspace;
      },
    },
    scheduler: {
      async runAfter(_ms: number, _ref: unknown, args: { workspaceId: string }) {
        if (options.throwOnSchedule) throw new Error("scheduler unavailable");
        scheduled.push(args);
      },
    },
  };
  return { ctx: ctx as any, workspace, scheduled };
}

const reuse = scheduleCtx();
assert.equal(
  await scheduleCompleteFirstExecuteForSession(reuse.ctx, ownerSession, "ws1" as any),
  true,
);
assert.deepEqual(reuse.scheduled, [{ workspaceId: "ws1" }]);

const browserReuse = scheduleCtx();
assert.equal(
  await scheduleCompleteFirstExecuteForSession(browserReuse.ctx, browserChild, "ws1" as any),
  false,
);
assert.equal(browserReuse.scheduled.length, 0, "browser session reuse must not schedule");

const alreadyAttemptedReuse = scheduleCtx({
  workspace: { _id: "ws1", status: "active", updatedAt: 1, firstExecuteAttemptedAt: 4000 },
});
assert.equal(
  await scheduleCompleteFirstExecuteForSession(alreadyAttemptedReuse.ctx, ownerSession, "ws1" as any),
  false,
);
assert.equal(alreadyAttemptedReuse.scheduled.length, 0, "already_attempted must not loop");

const alreadyActivatedReuse = scheduleCtx({
  workspace: { _id: "ws1", status: "active", updatedAt: 1, firstExecuteAttemptedAt: 4000 },
});
assert.equal(
  await scheduleCompleteFirstExecuteForSession(alreadyActivatedReuse.ctx, ownerSession, "ws1" as any),
  false,
);
assert.equal(alreadyActivatedReuse.scheduled.length, 0, "already_activated must not loop");

const inactiveReuse = scheduleCtx({
  workspace: { _id: "ws1", status: "unclaimed", updatedAt: 1 },
});
assert.equal(
  await scheduleCompleteFirstExecuteForSession(inactiveReuse.ctx, ownerSession, "ws1" as any),
  false,
);
assert.equal(inactiveReuse.scheduled.length, 0);

const scheduleFailure = scheduleCtx({ throwOnSchedule: true });
await scheduleCompleteFirstExecute(scheduleFailure.ctx, "ws1" as any);
assert.equal(scheduleFailure.scheduled.length, 0, "scheduler failure must not throw");

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
  /export const getOrCreateForClerk = mutation\([\s\S]*scheduleCompleteFirstExecute\(ctx, workspace\._id\)/,
  "web Clerk session mint must schedule the one-shot first execute",
);
assert.match(
  clerkWeb,
  /export const getOrCreateForClerk = mutation\([\s\S]*if \(isNewUser\) \{[\s\S]*scheduleFounderSignupMail\(/,
  "web Clerk first mint must schedule Gustav's founder signup note",
);
assert.doesNotMatch(
  clerkWeb.slice(
    clerkWeb.indexOf("export const verifySession"),
    clerkWeb.indexOf("export const getOrCreateForClerk"),
  ),
  /scheduleFounderSignupMail|founderSignupMail/,
  "session reuse and whoami must not send the founder signup note",
);
assert.match(
  clerkWeb,
  /export const verifySession = mutation\([\s\S]*scheduleCompleteFirstExecuteForSession\(ctx, session, session\.workspaceId\)/,
  "HTTP execute session reuse must schedule the one-shot first execute",
);
assert.match(
  clerkWeb,
  /export const getSession = mutation\([\s\S]*scheduleCompleteFirstExecuteForSession\(ctx, session, session\.workspaceId\)/,
  "workspace session read must schedule the one-shot first execute",
);
assert.match(
  clerkWeb,
  /export const touchSession = mutation\([\s\S]*audience: "durable"[\s\S]*scheduleCompleteFirstExecuteForSession\(ctx, session, session\.workspaceId\)/,
  "whoami / lastUsed durable reuse must schedule the one-shot first execute",
);
assert.match(
  clerkWeb,
  /export const getWorkspaceStatus = query\([\s\S]*audience: "durable"/,
  "legacy MCP whoami stays a query; touchSession is the schedule door",
);
const mintBrowser = clerkWeb.slice(
  clerkWeb.indexOf("export const mintBrowserSession"),
  clerkWeb.indexOf("export const getSession"),
);
assert.doesNotMatch(
  mintBrowser,
  /completeFirstExecute|scheduleCompleteFirstExecute/,
  "browser child mint is not a Clerk session door and must not loop first execute",
);

const cliAuth = source("./cliAuth.ts");
assert.match(
  cliAuth,
  /export const _exchangeVerified = internalMutation\([\s\S]*scheduleCompleteFirstExecute\(ctx, workspace\._id\)/,
  "CLI Clerk exchange must schedule the one-shot first execute",
);
assert.match(cliAuth, /event: "cli_browser_callback_success"/);

const httpAuth = source("./http.ts");
assert.match(
  httpAuth,
  /credential\.method === "session"[\s\S]*runMutation\(api\.workspaces\.verifySession/,
  "HTTP execute must accept an existing session through the scheduling mutation",
);
assert.doesNotMatch(
  httpAuth.slice(httpAuth.indexOf("credential.method === \"session\"")),
  /runQuery\(api\.workspaces\.verifySession/,
);

const middleware = source("../landing/middleware.ts");
assert.match(
  middleware,
  /\/api\/mutation[\s\S]*workspaces:getSession/,
  "workspace session read must hit the scheduling mutation",
);

const cliWhoami = source("../src/cli/commands/auth.ts");
assert.match(
  cliWhoami,
  /export async function authWhoamiCommand[\s\S]*workspaces:touchSession/,
  "CLI whoami reuses the durable session lastUsed door",
);
const whoamiFn = cliWhoami.slice(cliWhoami.indexOf("export async function authWhoamiCommand"));
assert.doesNotMatch(
  whoamiFn.slice(0, whoamiFn.indexOf("export async function authFirstCallCommand") === -1
    ? whoamiFn.length
    : whoamiFn.indexOf("export async function authLogoutCommand")),
  /console\.(log|error|info|debug).*sessionToken/,
  "whoami must not log the session token",
);

const mcpWhoami = source("../src/index.ts");
assert.match(
  mcpWhoami,
  /case 'check_workspace_status':[\s\S]*workspaces:touchSession/,
  "MCP whoami reuses the durable session lastUsed door",
);

const clerkCallback = source("../landing/src/app/auth/clerk-callback/page.tsx");
assert.match(clerkCallback, /redirect\("\/workspace"\)/);
assert.doesNotMatch(clerkCallback, /\/v1\/execute|completeFirstExecute/);

console.log("convex activation: first successful gateway call is classified and deduped");
console.log("convex activation: Clerk session mint runs NASA then Frankfurter once per workspace");
console.log("convex activation: session reuse schedules first execute; browser sessions do not");
