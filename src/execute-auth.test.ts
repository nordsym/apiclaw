#!/usr/bin/env npx tsx
/**
 * Session read/write contract for POST /v1/execute.
 * Login writes session_token; execute sends X-APIClaw-Session.
 */
import { strict as assert } from "node:assert";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "apiclaw-execute-auth-"));
process.env.HOME = tmpHome;
process.env.USERPROFILE = tmpHome;

const { writeAuthConfig, readAuthConfig, clearAuthConfig, SESSION_TOKEN_TOML_KEY, AUTH_CONFIG_PATH } =
  await import("./auth-config.js");
const {
  EXECUTE_SESSION_HEADER,
  EXECUTE_SESSION_TOML_KEY,
  UnsignedExecuteError,
  clearPendingLoginUrl,
  executeSessionHeaders,
  readExecuteSessionHeaders,
  readExecuteSessionToken,
  readPendingLogin,
  readPendingLoginUrl,
  requireExecuteSession,
  resolveExecuteAuthHeaders,
  writePendingLogin,
  writePendingLoginUrl,
} = await import("./execute-auth.js");

assert.equal(EXECUTE_SESSION_TOML_KEY, "session_token");
assert.equal(SESSION_TOKEN_TOML_KEY, "session_token");
assert.equal(EXECUTE_SESSION_HEADER, "X-APIClaw-Session");

clearAuthConfig();
clearPendingLoginUrl();
assert.equal(readExecuteSessionToken(), null);
assert.equal(readExecuteSessionHeaders(), null);
assert.equal(requireExecuteSession().ok, false);
assert.throws(() => executeSessionHeaders(""), (error: unknown) => error instanceof UnsignedExecuteError);
assert.throws(() => executeSessionHeaders("   "), (error: unknown) => error instanceof UnsignedExecuteError);
assert.throws(
  () => resolveExecuteAuthHeaders({ "X-APIClaw-Session": "" }),
  (error: unknown) => error instanceof UnsignedExecuteError,
);
assert.throws(
  () => resolveExecuteAuthHeaders({}),
  (error: unknown) => error instanceof UnsignedExecuteError,
);

writePendingLoginUrl("https://apiclaw.cloud/auth/cli?authId=pending-test");
assert.equal(readPendingLoginUrl(), "https://apiclaw.cloud/auth/cli?authId=pending-test");
assert.equal(readPendingLogin(), null, "URL-only pending cannot redeem without the PKCE verifier");
writePendingLogin({
  browserUrl: "https://apiclaw.cloud/auth/cli?authId=pending-test",
  authId: "pending-test-authid12",
  codeVerifier: "verifier-on-this-machine",
  state: "csrf-state",
  startedAt: Date.now(),
  expiresAt: Date.now() + 60_000,
});
assert.equal(readPendingLogin()?.authId, "pending-test-authid12");
assert.equal(readPendingLogin()?.codeVerifier, "verifier-on-this-machine");
const unsigned = requireExecuteSession();
assert.equal(unsigned.ok, false);
if (!unsigned.ok) {
  assert.equal(unsigned.pendingLoginUrl, "https://apiclaw.cloud/auth/cli?authId=pending-test");
}
assert.throws(
  () => resolveExecuteAuthHeaders(),
  (error: unknown) =>
    error instanceof UnsignedExecuteError &&
    error.pendingLoginUrl === "https://apiclaw.cloud/auth/cli?authId=pending-test",
);
writePendingLoginUrl("http://localhost/not-https");
assert.equal(readPendingLoginUrl(), "https://apiclaw.cloud/auth/cli?authId=pending-test");
clearPendingLoginUrl();
assert.equal(readPendingLoginUrl(), null);

const now = Date.now();
writeAuthConfig({
  workspaceId: "ws_exec",
  email: "agent@nordsym.com",
  sessionToken: "st_login_wrote_this",
  apiKey: "sk-claw-not-for-execute",
  createdAt: now,
  lastUsedAt: now,
});

const raw = fs.readFileSync(AUTH_CONFIG_PATH, "utf8");
assert.match(raw, /session_token = "st_login_wrote_this"/);
assert.match(raw, /api_key = "sk-claw-not-for-execute"/);

const cfg = readAuthConfig();
assert(cfg);
assert.equal(cfg.sessionToken, "st_login_wrote_this");
assert.equal(cfg.apiKey, "sk-claw-not-for-execute");
assert.equal(readExecuteSessionToken(), "st_login_wrote_this");
assert.deepEqual(readExecuteSessionHeaders(), {
  "X-APIClaw-Session": "st_login_wrote_this",
});
const signedIn = requireExecuteSession();
assert.equal(signedIn.ok, true);
if (signedIn.ok) {
  assert.equal(signedIn.token, "st_login_wrote_this");
}
assert.deepEqual(resolveExecuteAuthHeaders(), {
  "X-APIClaw-Session": "st_login_wrote_this",
});
assert.deepEqual(executeSessionHeaders(cfg.sessionToken), {
  "X-APIClaw-Session": cfg.sessionToken,
});
assert.notEqual(
  readExecuteSessionHeaders()?.[EXECUTE_SESSION_HEADER],
  cfg.apiKey,
  "execute must send session_token, not api_key",
);

clearAuthConfig();
writeAuthConfig({
  workspaceId: "ws_session_only",
  email: "only@x.com",
  sessionToken: "st_only_session",
  createdAt: now,
});
assert.equal(readExecuteSessionToken(), "st_only_session");
assert.equal(readAuthConfig()?.apiKey, undefined);

fs.rmSync(tmpHome, { recursive: true, force: true });
console.log("execute-auth: login session_token is the execute X-APIClaw-Session value");
