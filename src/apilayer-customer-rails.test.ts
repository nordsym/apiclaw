#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CANON_STATS } from "./canon-stats.js";
import { getConnectedProviders } from "./execute.js";
import {
  APILAYER_CUSTOMER_EXECUTABLE_ACTIONS,
  APILAYER_PAID_PLAN_ONLY_ACTIONS,
  APILAYER_SUBSCRIPTION_BLOCKED_ACTIONS,
  PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT,
  getPublicCustomerExecutableProvider,
  isPublicCustomerExecutableAction,
} from "./product-truth.js";

const apilayer = getPublicCustomerExecutableProvider("apilayer");
assert.equal(apilayer, undefined, "APILayer must stay inventory-only until resale rights and exact costs are verified");
assert.equal(PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT, 3);
assert.equal(CANON_STATS.customer_executable_providers, 3);
const connected = getConnectedProviders();
assert.equal(connected.some((entry) => entry.provider === "apilayer"), false);
for (const action of APILAYER_CUSTOMER_EXECUTABLE_ACTIONS) {
  assert.equal(isPublicCustomerExecutableAction("apilayer", action), false);
}
for (const action of [
  ...APILAYER_SUBSCRIPTION_BLOCKED_ACTIONS,
  ...APILAYER_PAID_PLAN_ONLY_ACTIONS,
  "skills",
]) {
  assert.equal(
    isPublicCustomerExecutableAction("apilayer", action),
    false,
    `${action} must not be advertised as customer-executable`,
  );
}

const catalogRoute = readFileSync("landing/src/app/api/catalog/route.ts", "utf8");
assert.match(catalogRoute, /customerExecutableActions\.length > 0/);
assert.match(catalogRoute, /callable: provider\.customerExecutableActions\.length > 0/);

const publicStats = JSON.parse(readFileSync("landing/public/stats.json", "utf8")) as {
  customerExecutableProviderCount: number;
};
assert.equal(publicStats.customerExecutableProviderCount, 3);

console.log(
  `APILayer customer rails: ${APILAYER_CUSTOMER_EXECUTABLE_ACTIONS.length} inventory actions, 3 customer providers`,
);
