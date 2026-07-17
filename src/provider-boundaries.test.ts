#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  filterPublicConnectedProviders,
  isInternalProviderReference,
  isInternalOnlyProvider,
  isUnavailableManagedProvider,
} from "./provider-boundaries.js";

for (const provider of ["46elks", "46elks API", "Twilio", "Twilio Messaging", "Resend API"]) {
  assert.equal(isInternalOnlyProvider(provider), true, `${provider} must be internal-only`);
}
assert.equal(isInternalOnlyProvider("brave_search"), false);
assert.equal(
  isInternalProviderReference({ name: "Messaging", docsUrl: "https://www.twilio.com/docs/sms" }),
  true,
);
assert.deepEqual(
  filterPublicConnectedProviders([
    { provider: "twilio", actions: ["send_sms"] },
    { provider: "brave_search", actions: ["search"] },
    { provider: "resend", actions: ["send_email"] },
    { provider: "replicate", actions: ["run"] },
    { provider: "assemblyai", actions: ["transcribe"] },
  ]),
  [
    { provider: "brave_search", actions: ["search"] },
    { provider: "replicate", actions: ["run"] },
  ],
);

assert.equal(isUnavailableManagedProvider("AssemblyAI"), true);
assert.equal(isUnavailableManagedProvider("Together AI"), true);
assert.equal(isUnavailableManagedProvider("Brave Search"), false);

console.log("provider boundaries: internal infra is hidden from the public MCP runtime");
