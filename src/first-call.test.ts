#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AUTH_FIRST_CALL_COMMAND,
  FIRST_EXECUTE_FRANKFURTER,
  FIRST_EXECUTE_NASA,
  FIRST_EXECUTE_PATH,
  completeFirstExecute,
  defaultFirstExecute,
  formatApodTitle,
  formatFirstCallResult,
  formatFrankfurterRate,
} from "./first-call.js";
import { EXECUTE_SESSION_HEADER } from "./execute-auth.js";
import { completeFirstRunAuth, FIRST_CALL_CLI, firstRunCompleteMessage } from "./first-run.js";

assert.equal(FIRST_EXECUTE_PATH, "/v1/execute");
assert.deepEqual(FIRST_EXECUTE_NASA, { provider: "nasa", action: "apod", params: {} });
assert.deepEqual(FIRST_EXECUTE_FRANKFURTER, {
  provider: "frankfurter",
  action: "latest",
  params: { path: "/latest" },
});
assert.equal(AUTH_FIRST_CALL_COMMAND, "npx @nordsym/apiclaw auth first-call");
assert.doesNotMatch(AUTH_FIRST_CALL_COMMAND, /CoinGecko|\/v1\/call/);

assert.equal(
  formatApodTitle({ success: true, data: { title: "Helix Nebula" } }),
  "Helix Nebula",
);
assert.equal(formatFrankfurterRate({ data: { base: "EUR", rates: { USD: 1.0842 } } }), "EUR/USD 1.0842");
assert.equal(formatFirstCallResult("nasa", { data: { title: "Helix Nebula" } }), "NASA APOD: Helix Nebula");
assert.equal(formatFirstCallResult("frankfurter", { rates: { USD: 1.08 } }), "EUR/USD 1.08");
assert.equal(formatFirstCallResult("nasa", { data: {} }), undefined);

const attempts: Array<{ url?: string; path: string; body: unknown; headers?: Record<string, string> }> = [];

const nasaOk = await completeFirstExecute({
  sessionToken: "session-test",
  execute: async (attempt, options) => {
    attempts.push({ path: options.path, body: attempt, headers: { "Idempotency-Key": options.idempotencyKey } });
    assert.equal(options.path, "/v1/execute");
    assert.equal(attempt.provider, "nasa");
    assert.equal(attempt.action, "apod");
    return { status: 200, body: { success: true, provider: "nasa", action: "apod", data: { title: "Helix Nebula" } } };
  },
});
assert.equal(nasaOk.ok, true);
assert.equal(nasaOk.provider, "nasa");
assert.equal(nasaOk.summary, "NASA APOD: Helix Nebula");
assert.equal(attempts.length, 1, "NASA 200 must not fall through to Frankfurter");
assert.doesNotMatch(JSON.stringify(attempts), /\/v1\/call|CoinGecko|coingecko/);

attempts.length = 0;
const fallback = await completeFirstExecute({
  sessionToken: "session-test",
  execute: async (attempt, options) => {
    attempts.push({ path: options.path, body: attempt });
    if (attempt.provider === "nasa") {
      return { status: 502, body: { success: false, error: { message: "nasa_unavailable" } } };
    }
    assert.equal(attempt.provider, "frankfurter");
    assert.equal(attempt.action, "latest");
    assert.deepEqual(attempt.params, { path: "/latest" });
    return { status: 200, body: { success: true, data: { base: "EUR", rates: { USD: 1.17 } } } };
  },
});
assert.equal(fallback.ok, true);
assert.equal(fallback.provider, "frankfurter");
assert.equal(fallback.summary, "EUR/USD 1.17");
assert.equal(attempts.length, 2);

const bothFailed = await completeFirstExecute({
  sessionToken: "session-test",
  execute: async () => ({ status: 401, body: { error: { code: "unauth" } } }),
});
assert.equal(bothFailed.ok, false);
assert.doesNotMatch(bothFailed.summary ?? "", /\bDone\b/);

const unsigned = await completeFirstExecute({
  sessionToken: "",
  execute: async () => {
    throw new Error("must not execute without a session");
  },
});
assert.equal(unsigned.ok, false);
assert.equal(unsigned.error, "not_signed_in");

const unsignedWs = await completeFirstExecute({
  sessionToken: "   ",
  execute: async () => {
    throw new Error("must not execute with a whitespace session");
  },
});
assert.equal(unsignedWs.ok, false);
assert.equal(unsignedWs.error, "not_signed_in");

const emptyTransport: Array<{ url: string }> = [];
const unsignedDefault = await defaultFirstExecute(
  FIRST_EXECUTE_NASA,
  { sessionToken: "", idempotencyKey: "apiclaw-first-nasa-unsigned", path: FIRST_EXECUTE_PATH },
  (async (url: string | URL | Request) => {
    emptyTransport.push({ url: String(url) });
    return new Response("{}", { status: 200 });
  }) as typeof fetch,
  "https://gateway.test",
);
assert.equal(unsignedDefault.status, 0);
assert.equal(emptyTransport.length, 0, "unsigned defaultFirstExecute must not hit the gateway");

const transport: Array<{ url: string; init?: RequestInit }> = [];
const posted = await defaultFirstExecute(
  FIRST_EXECUTE_NASA,
  { sessionToken: "session-live", idempotencyKey: "apiclaw-first-nasa-test", path: FIRST_EXECUTE_PATH },
  (async (url: string | URL | Request, init?: RequestInit) => {
    transport.push({ url: String(url), init });
    return new Response(JSON.stringify({ success: true, data: { title: "Test" } }), { status: 200 });
  }) as typeof fetch,
  "https://gateway.test",
);
assert.equal(posted.status, 200);
assert.equal(transport.length, 1);
assert.equal(transport[0].url, "https://gateway.test/v1/execute");
assert.equal(transport[0].init?.method, "POST");
assert.deepEqual(JSON.parse(String(transport[0].init?.body)), {
  provider: "nasa",
  action: "apod",
  params: {},
});
const sentHeaders = transport[0].init?.headers as Record<string, string>;
assert.equal(EXECUTE_SESSION_HEADER, "X-APIClaw-Session");
assert.equal(sentHeaders[EXECUTE_SESSION_HEADER], "session-live");
assert.equal(sentHeaders["Authorization"], undefined);
assert.equal(sentHeaders["Idempotency-Key"], "apiclaw-first-nasa-test");
assert.equal(sentHeaders["X-APIClaw-Internal"], undefined);
assert.match(FIRST_CALL_CLI, /npx @nordsym\/apiclaw call nasa\/apod/);
assert.match(FIRST_CALL_CLI, /--idempotency-key/);

const whoamiOnly = await completeFirstRunAuth({
  whoami: () => true,
  firstExecute: async () => ({ ok: false, error: "first_execute_failed" }),
  launch: async () => {
    throw new Error("launch must not run when whoami already works");
  },
});
assert.equal(whoamiOnly.complete, false, "whoami alone is not Done");

const logs: string[] = [];
const originalLog = console.log;
console.log = (...args: unknown[]) => {
  logs.push(args.map(String).join(" "));
};
try {
  const activated = await completeFirstRunAuth({
    whoami: () => true,
    firstExecute: async () => ({
      ok: true,
      provider: "nasa",
      action: "apod",
      summary: "NASA APOD: Helix Nebula",
      status: 200,
    }),
  });
  assert.equal(activated.complete, true);
  assert.match(logs.join("\n"), /\bDone\b/);
  assert.match(logs.join("\n"), /NASA APOD: Helix Nebula/);
} finally {
  console.log = originalLog;
}

logs.length = 0;
console.log = (...args: unknown[]) => {
  logs.push(args.map(String).join(" "));
};
try {
  await completeFirstRunAuth({
    whoami: () => true,
    firstExecute: async () => ({ ok: false, error: "first_execute_failed" }),
  });
  assert.doesNotMatch(logs.join("\n"), /\bDone\b/);
  assert.match(logs.join("\n"), /Not done/);
} finally {
  console.log = originalLog;
}

const complete = firstRunCompleteMessage("ada@example.com", "NASA APOD: Helix Nebula");
assert.match(complete, /Done/);
assert.match(complete, /ada@example.com/);
assert.match(complete, /NASA APOD: Helix Nebula/);

const firstCallFiles = [
  "src/first-call.ts",
  "src/first-run.ts",
  "src/cli/commands/auth.ts",
  "install.sh",
  "landing/public/install.sh",
  "landing/public/install.ps1",
  "landing/public/SKILL.md",
  "landing/src/lib/onboarding-first-call.ts",
];
for (const file of firstCallFiles) {
  const source = readFileSync(file, "utf8");
  assert.match(source, /\/v1\/execute/, `${file} must issue POST /v1/execute`);
  assert.match(source, /nasa/, `${file} must prefer NASA APOD`);
  assert.match(source, /apod/, `${file} must prefer NASA APOD`);
  assert.match(source, /frankfurter/i, `${file} must fall back to Frankfurter`);
  assert.doesNotMatch(
    source,
    /call brave_search|provider":"brave_search"|provider: "brave_search"/,
    `${file} must not send first execute to billed Brave`,
  );
  assert.doesNotMatch(source, /apiclaw call CoinGecko/, `${file} must not use catalog-name /v1/call`);
  assert.doesNotMatch(
    source,
    /twilio|resend|46elks|together/i,
    `${file} must not expose reserved providers`,
  );
}

const authLogin = readFileSync("src/cli/commands/auth.ts", "utf8");
assert.match(authLogin, /completeFirstExecute/);
assert.match(authLogin, /authFirstCallCommand/);
assert.match(authLogin, /session_token from that file as X-APIClaw-Session/);
assert.doesNotMatch(authLogin, /export APICLAW_API_KEY=\$\{result\.apiKey\}/);

const cli = readFileSync("src/cli/index.ts", "utf8");
assert.match(cli, /authFirstCallCommand/);
assert.match(cli, /first-call/);

console.log("first-call: POST /v1/execute NASA APOD, Frankfurter fallback, billed research excluded");
