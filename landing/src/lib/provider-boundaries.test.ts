#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { isInternalCatalogEntry, isUnavailableManagedBrand } from "./provider-boundaries";

assert.equal(
  isInternalCatalogEntry({ name: "Twilio API", baseUrl: "https://api.twilio.com" }),
  true,
);
assert.equal(isInternalCatalogEntry({ name: "Brave Search" }), false);

for (const provider of ["Together AI", "Deepgram", "AssemblyAI API", "Replicate", "Stability AI", "E2B API"]) {
  assert.equal(isUnavailableManagedBrand(provider), true, `${provider} must not be advertised as managed`);
}
assert.equal(isUnavailableManagedBrand("OpenAI"), false);

console.log("catalog boundaries: internal infra is hidden and unavailable managed brands are demoted");
