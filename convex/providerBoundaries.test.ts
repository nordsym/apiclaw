#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  isCustomerExecutableManagedAction,
  isInternalProviderReference,
  isManagedActionAllowedForTraffic,
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
assert.equal(isCustomerExecutableManagedAction("openrouter", "chat"), true);
assert.equal(isCustomerExecutableManagedAction("openrouter", "chat_completions"), true);
assert.equal(isCustomerExecutableManagedAction("brave_search", "search"), true);
assert.equal(isCustomerExecutableManagedAction("github", "get_file"), true);
assert.equal(isCustomerExecutableManagedAction("nasa", "apod"), true);
assert.equal(isCustomerExecutableManagedAction("apilayer", "exchange_rates"), true);
assert.equal(isCustomerExecutableManagedAction("apilayer", "weatherstack_current"), true);
assert.equal(isCustomerExecutableManagedAction("apilayer", "fixer_latest"), true);
assert.equal(isCustomerExecutableManagedAction("apilayer", "verify_number"), false);
assert.equal(isCustomerExecutableManagedAction("apilayer", "world_news"), false);
assert.equal(isCustomerExecutableManagedAction("apilayer", "image_crop"), false);
assert.equal(isCustomerExecutableManagedAction("apilayer", "form_submit"), false);
assert.equal(isCustomerExecutableManagedAction("apilayer", "fixer_convert"), false);
for (const [provider, action] of [
  ["openai", "chat"],
  ["anthropic", "messages"],
  ["replicate", "run"],
  ["assemblyai", "transcribe"],
] as const) {
  assert.equal(
    isCustomerExecutableManagedAction(provider, action),
    true,
    `${provider}/${action} is customer-executable`,
  );
}
assert.equal(
  isCustomerExecutableManagedAction("github", "create_issue"),
  false,
  "github/create_issue must remain inventory-only for customer execution",
);
assert.equal(isManagedActionAllowedForTraffic("replicate", "run", "internal"), true);
assert.equal(isManagedActionAllowedForTraffic("replicate", "run", "customer"), true);

console.log("convex provider boundaries: internal and unavailable managed providers stay off public discovery");
