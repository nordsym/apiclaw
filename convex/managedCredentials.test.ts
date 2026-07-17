#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { resolveManagedCredential } from "./managedCredentials";

assert.equal(
  resolveManagedCredential("46elks", "ELKS_API_KEY", {
    ELKS_API_USER: "user",
    ELKS_API_PASSWORD: "password",
  }),
  "user:password",
);
assert.equal(
  resolveManagedCredential("46elks", "ELKS_API_KEY", { ELKS_API_USER: "user" }),
  undefined,
);
assert.equal(
  resolveManagedCredential("twilio", "TWILIO_AUTH_TOKEN", {
    TWILIO_ACCOUNT_SID: "sid",
    TWILIO_AUTH_TOKEN: "token",
  }),
  "sid:token",
);
assert.equal(
  resolveManagedCredential("openai", "OPENAI_API_KEY", { OPENAI_API_KEY: "key" }),
  "key",
);

console.log("managed credentials: execute and dedicated proxy shapes stay aligned");
