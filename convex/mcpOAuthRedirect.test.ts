#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { validateRedirectUris } from "./mcpOAuth";

for (const safe of [
  "https://client.example/callback?source=apiclaw",
  "http://localhost:43110/callback",
  "http://127.0.0.1:43110/callback",
  "http://[::1]:43110/callback",
]) {
  assert.equal(validateRedirectUris([safe]).ok, true, `${safe} should be accepted`);
}

for (const unsafe of [
  "javascript://%0Adocument.title='PWNED'//",
  "data:text/html,<script>alert(1)</script>",
  "file:///tmp/callback",
  "vscode://oauth/callback",
  "http://example.com/callback",
  "http://localhost.evil.example/callback",
  "https://user:password@example.com/callback",
  "https://client.example/callback#token",
]) {
  assert.equal(validateRedirectUris([unsafe]).ok, false, `${unsafe} must be rejected`);
}

console.log("OAuth redirect registration permits only HTTPS and loopback HTTP");
