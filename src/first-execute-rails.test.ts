#!/usr/bin/env npx tsx
/**
 * First-execute preference and fallback.
 *
 * NASA APOD is the default research rail (zero-cost, no card).
 * Frankfurter is the last-resort free rail so first_call still lands.
 * Brave / Serper / Firecrawl stay out — they are billed and card-gated.
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
import {
  estimateManagedProviderCostUsd,
  hasBillingGradeManagedCost,
} from "../convex/managedCostPolicy.js";
import { evaluateManagedUsage } from "../convex/managedUsagePolicy.js";

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

for (const billed of FIRST_EXECUTE_BILLED_RESEARCH_PROVIDERS) {
  assert.equal(
    FIRST_EXECUTE_RAILS.some((rail) => rail.provider === billed),
    false,
    `${billed} is billed research and must not be an automatic first-execute rail`,
  );
}

const newWorkspace = { tier: "free" };

const nasaCost = estimateManagedProviderCostUsd({ provider: "nasa", action: "apod" });
assert.equal(nasaCost, 0);
assert.equal(hasBillingGradeManagedCost({ provider: "nasa", action: "apod" }), true);
const nasaUsage = evaluateManagedUsage(newWorkspace, {
  estimatedProviderCostUsd: nasaCost,
  billingGradeCost: true,
});
assert.equal(nasaUsage.allowed, true, "NASA APOD must activate a workspace with no card");
assert.equal(nasaUsage.reason, null);

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
assert.equal(isWorkspacePublicZeroCost("frankfurter"), true);

function isWorkspacePublicZeroCost(provider: string): boolean {
  return estimateManagedProviderCostUsd({ provider, action: "latest" }) === 0
    && hasBillingGradeManagedCost({ provider, action: "latest" });
}

const frankfurterUsage = evaluateManagedUsage(newWorkspace, {
  estimatedProviderCostUsd: 0,
  billingGradeCost: true,
});
assert.equal(frankfurterUsage.allowed, true, "Frankfurter must activate a workspace with no card");

for (const billed of FIRST_EXECUTE_BILLED_RESEARCH_PROVIDERS) {
  const action = billed === "firecrawl" ? "scrape" : "search";
  const cost = estimateManagedProviderCostUsd({ provider: billed, action });
  assert.ok(cost !== undefined && cost > 0, `${billed} must have real provider cost`);
  const billedUsage = evaluateManagedUsage(newWorkspace, {
    estimatedProviderCostUsd: cost,
    billingGradeCost: hasBillingGradeManagedCost({ provider: billed, action }),
  });
  assert.equal(
    billedUsage.allowed,
    false,
    `${billed} must not be allowed for a new workspace with no card`,
  );
  assert.equal(
    billedUsage.reason,
    "payment_required",
    `${billed} is why Frankfurter stays as the free fallback`,
  );
}

assert.equal(isFirstExecuteSuccess(200, { success: true }), true);
assert.equal(isFirstExecuteSuccess(200, { success: false }), false);
assert.equal(isFirstExecuteSuccess(402, { success: true }), false);
assert.equal(formatFirstCallResult("nasa", { data: { title: "Helix Nebula" } }), "NASA APOD: Helix Nebula");
assert.equal(formatFirstCallResult("frankfurter", { rates: { USD: 1.17 } }), "EUR/USD 1.17");
assert.equal(firstExecuteFallbackSummary("nasa"), "NASA APOD received");
assert.equal(firstExecuteFallbackSummary("frankfurter"), "EUR FX rate received");

console.log("first-execute rails: NASA APOD default (zero-cost research); Frankfurter fallback; billed research excluded");
