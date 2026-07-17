#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { isInternalCatalogEntry, isUnavailableManagedBrand } from "./provider-boundaries";

assert.equal(
  isInternalCatalogEntry({ name: "Twilio API", baseUrl: "https://api.twilio.com" }),
  true,
);
assert.equal(isInternalCatalogEntry({ name: "Brave Search" }), false);

assert.equal(isUnavailableManagedBrand("AssemblyAI API"), true);
assert.equal(isUnavailableManagedBrand("Together AI"), true);
for (const provider of ["Deepgram", "Replicate", "Stability AI", "E2B API"]) {
  assert.equal(isUnavailableManagedBrand(provider), false, `${provider} must be advertised as managed`);
}
assert.equal(isUnavailableManagedBrand("OpenAI"), false);

console.log("catalog boundaries: internal infra is hidden and unavailable managed brands are demoted");
