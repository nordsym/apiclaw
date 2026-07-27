#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { parseSafeOAuthRedirectUri } from "./oauth-redirect";

assert.equal(parseSafeOAuthRedirectUri("https://client.example/callback")?.protocol, "https:");
assert.equal(parseSafeOAuthRedirectUri("http://127.0.0.1:44123/callback")?.hostname, "127.0.0.1");
for (const unsafe of [
  "javascript://%0Adocument.title='PWNED'//",
  "data:text/html,pwned",
  "file:///tmp/callback",
  "http://attacker.example/callback",
  "https://client.example/callback#fragment",
]) {
  assert.equal(parseSafeOAuthRedirectUri(unsafe), null);
}

console.log("OAuth consent redirects fail closed before approve or deny navigation");
