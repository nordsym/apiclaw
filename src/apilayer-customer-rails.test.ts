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
assert.ok(apilayer, "APILayer must be a customer-executable managed provider");
assert.deepEqual(
  [...apilayer.customerExecutableActions],
  [...APILAYER_CUSTOMER_EXECUTABLE_ACTIONS],
);
assert.equal(PUBLIC_CUSTOMER_EXECUTABLE_PROVIDER_COUNT, 5);
assert.equal(CANON_STATS.customer_executable_providers, 5);

const connected = getConnectedProviders();
const connectedApilayer = connected.find((entry) => entry.provider === "apilayer");
assert.ok(connectedApilayer, "list_connected / execute surface must expose APILayer");
assert.deepEqual(connectedApilayer.actions, [...APILAYER_CUSTOMER_EXECUTABLE_ACTIONS]);

for (const action of APILAYER_CUSTOMER_EXECUTABLE_ACTIONS) {
  assert.equal(
    isPublicCustomerExecutableAction("apilayer", action),
    true,
    `${action} must be customer-executable`,
  );
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
assert.equal(publicStats.customerExecutableProviderCount, 5);

console.log(
  `APILayer customer rails: ${APILAYER_CUSTOMER_EXECUTABLE_ACTIONS.length} executable actions, 5 providers`,
);
