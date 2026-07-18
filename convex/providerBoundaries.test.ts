#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  isInternalProviderReference,
  isPubliclyAvailableManagedProvider,
} from "./providerBoundaries";

assert.equal(isInternalProviderReference("Twilio Messaging API"), true);
assert.equal(isInternalProviderReference("https://api.46elks.com/a1/sms"), true);
assert.equal(isInternalProviderReference("Brave Search"), false);
assert.equal(isPubliclyAvailableManagedProvider("twilio"), false);
assert.equal(isPubliclyAvailableManagedProvider("assemblyai"), true);
assert.equal(isPubliclyAvailableManagedProvider("replicate"), true);
assert.equal(isPubliclyAvailableManagedProvider("Together AI"), false);
assert.equal(isPubliclyAvailableManagedProvider("openai"), true);

console.log("convex provider boundaries: internal and unavailable managed providers stay off public discovery");
