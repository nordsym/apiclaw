#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = readFileSync(
  fileURLToPath(new URL("./logs.ts", import.meta.url)),
  "utf8",
);

for (const name of [
  "createLogInternal",
  "logProviderCall",
  "createLogWithSpend",
  "createProxyLog",
  "attachCost",
  "scrubStoredSessionTokens",
]) {
  assert.match(
    source,
    new RegExp(`export const ${name} = internalMutation\\(`),
    `${name} must not be callable from the public Convex API`,
  );
}

assert.doesNotMatch(
  source,
  /sessionToken:\s*(?:args\.token|args\.sessionToken|sessionToken\s*\|\|)/,
  "API logs must never persist reusable bearer tokens",
);

console.log("log security: server-only writers and credential-free analytics rows");
