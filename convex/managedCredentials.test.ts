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
assert.equal(
  resolveManagedCredential("nasa", "NASA_API_KEY", { NASA_API_KEY: "live-nasa-key" }),
  "live-nasa-key",
  "configured NASA_API_KEY must win over DEMO_KEY",
);
assert.equal(
  resolveManagedCredential("nasa", "NASA_API_KEY", {}),
  "DEMO_KEY",
  "NASA first-execute must still resolve when NASA_API_KEY is unset",
);
assert.equal(
  resolveManagedCredential("nasa", "NASA_API_KEY", { NASA_API_KEY: "   " }),
  "DEMO_KEY",
);

console.log("managed credentials: execute and dedicated proxy shapes stay aligned");
