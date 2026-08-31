#!/usr/bin/env npx tsx
/**
 * First-execute preference and fallback.
 *
 * NASA APOD is the default research rail (zero-cost, no card).
 * Frankfurter is the last-resort free rail so first_call still lands.
 * Brave / Serper / Firecrawl stay out — they are billed and card-gated
 * (see convex/activation.test.ts for the payment_required proof).
 */
import assert from "node:assert/strict";
import {
  FIRST_EXECUTE_BILLED_RESEARCH_PROVIDERS,
  FIRST_EXECUTE_FRANKFURTER,
  FIRST_EXECUTE_NASA,
  FIRST_EXECUTE_PATH,
  FIRST_EXECUTE_RAILS,
  firstExecuteFallbackSummary,
  formatFirstCallResult,
  isFirstExecuteSuccess,
} from "./first-execute-rails.js";
import { buildPinnedPublicApiUrl, getWorkspacePublicApi } from "./workspace-public-apis.js";

assert.equal(FIRST_EXECUTE_PATH, "/v1/execute");
assert.deepEqual(
  FIRST_EXECUTE_RAILS.map((rail) => rail.provider),
  ["nasa", "frankfurter"],
  "NASA APOD first, Frankfurter last-resort",
);
assert.deepEqual(FIRST_EXECUTE_RAILS[0], FIRST_EXECUTE_NASA);
assert.deepEqual(FIRST_EXECUTE_RAILS[1], FIRST_EXECUTE_FRANKFURTER);
assert.deepEqual(FIRST_EXECUTE_NASA, { provider: "nasa", action: "apod", params: {} });
assert.deepEqual(FIRST_EXECUTE_FRANKFURTER, {
  provider: "frankfurter",
  action: "latest",
  params: { path: "/latest" },
});
assert.deepEqual(
  [...FIRST_EXECUTE_BILLED_RESEARCH_PROVIDERS],
  ["brave_search", "serper", "firecrawl"],
);
assert.equal(
  FIRST_EXECUTE_RAILS.some((rail) =>
    (FIRST_EXECUTE_BILLED_RESEARCH_PROVIDERS as readonly string[]).includes(rail.provider),
  ),
  false,
  "billed research must not be an automatic first-execute rail",
);

const frankfurter = getWorkspacePublicApi("frankfurter");
assert.ok(frankfurter);
assert.equal(frankfurter.origin, "https://api.frankfurter.dev");
assert.equal(frankfurter.baseUrl, "https://api.frankfurter.dev/v1");
const frankfurterUrl = buildPinnedPublicApiUrl(frankfurter, FIRST_EXECUTE_FRANKFURTER.params.path);
assert.equal(
  frankfurterUrl?.toString(),
  "https://api.frankfurter.dev/v1/latest",
  "first-execute Frankfurter path must pin to the no-redirect /v1/latest URL",
);

assert.equal(isFirstExecuteSuccess(200, { success: true }), true);
assert.equal(isFirstExecuteSuccess(200, { success: false }), false);
assert.equal(isFirstExecuteSuccess(402, { success: true }), false);
assert.equal(formatFirstCallResult("nasa", { data: { title: "Helix Nebula" } }), "NASA APOD: Helix Nebula");
assert.equal(formatFirstCallResult("frankfurter", { rates: { USD: 1.17 } }), "EUR/USD 1.17");
assert.equal(firstExecuteFallbackSummary("nasa"), "NASA APOD received");
assert.equal(firstExecuteFallbackSummary("frankfurter"), "EUR FX rate received");

console.log("first-execute rails: NASA APOD default; Frankfurter fallback; billed research excluded");
