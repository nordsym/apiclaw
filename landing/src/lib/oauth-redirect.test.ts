#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { CURSOR_DESKTOP_REDIRECT_URI } from "./oauth-dcr.generated";
import { parseSafeOAuthRedirectUri } from "./oauth-redirect";

assert.equal(parseSafeOAuthRedirectUri("https://client.example/callback")?.protocol, "https:");
assert.equal(parseSafeOAuthRedirectUri("http://127.0.0.1:44123/callback")?.hostname, "127.0.0.1");
assert.equal(parseSafeOAuthRedirectUri(CURSOR_DESKTOP_REDIRECT_URI)?.protocol, "cursor:");
assert.equal(parseSafeOAuthRedirectUri(`${CURSOR_DESKTOP_REDIRECT_URI}?code=fixture&state=fixture`)?.hostname, "anysphere.cursor-mcp");
for (const unsafe of [
  "cursor://other/oauth/callback?code=fixture",
  "cursor://anysphere.cursor-mcp/oauth/callback/extra",
  "cursor://anysphere.cursor-mcp/oauth/callback#fragment",
  "cursor-nightly://anysphere.cursor-mcp/oauth/callback",
  "javascript://%0Adocument.title='PWNED'//",
  "data:text/html,pwned",
  "file:///tmp/callback",
  "http://attacker.example/callback",
  "https://client.example/callback#fragment",
]) {
  assert.equal(parseSafeOAuthRedirectUri(unsafe), null);
}

console.log("OAuth consent redirects fail closed before approve or deny navigation");
