#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { CANON_STATS } from "./canon-stats.js";
import { MANAGED_USAGE_POLICY } from "./product-truth.js";
import {
  CURATED_WORKSPACE_PUBLIC_APIS,
  WORKSPACE_PUBLIC_EXECUTABLE_COUNT,
  buildPinnedPublicApiUrl,
  getWorkspacePublicApi,
  isJunkPublicApiName,
  isNoKeyPublicAuth,
  isSafePublicApiBaseUrl,
  isWorkspacePublicCatalogCard,
  isWorkspacePublicExecutableAction,
  isWorkspacePublicExecutableApi,
  shouldUnlockHarvestedPublicApi,
} from "./workspace-public-apis.js";

assert.equal(MANAGED_USAGE_POLICY.keylessPublicExecutionAvailable, false);
assert.equal(MANAGED_USAGE_POLICY.workspaceAuthenticatedPublicExecutionAvailable, true);
assert.equal(WORKSPACE_PUBLIC_EXECUTABLE_COUNT, CANON_STATS.workspace_public_executable);
assert.equal(
  CANON_STATS.customer_executable_catalog_cards,
  CANON_STATS.customer_executable_providers + CANON_STATS.workspace_public_executable,
);

assert.equal(isNoKeyPublicAuth("None"), true);
assert.equal(isNoKeyPublicAuth("apiKey"), false);
assert.equal(isNoKeyPublicAuth("unknown"), false);
assert.equal(isJunkPublicApiName("${title}"), true);
assert.equal(isSafePublicApiBaseUrl("https://api.frankfurter.dev/v1/latest")?.origin, "https://api.frankfurter.dev");
assert.equal(isSafePublicApiBaseUrl("http://ip-api.com/json"), undefined);
assert.equal(isSafePublicApiBaseUrl("https://api.apis.guru/v2/specs/x.json"), undefined);
assert.equal(isSafePublicApiBaseUrl("https://github.com/public-apis/public-apis"), undefined);

assert.equal(shouldUnlockHarvestedPublicApi({
  name: "Advice Slip API",
  auth: "None",
  baseUrl: "https://api.adviceslip.com",
}), true);
assert.equal(shouldUnlockHarvestedPublicApi({
  name: "Azure junk",
  auth: "apiKey",
  baseUrl: "https://management.azure.com",
}), false);
assert.equal(shouldUnlockHarvestedPublicApi({
  name: "Dead docs",
  auth: "None",
  baseUrl: "https://example.com/docs",
  verificationTier: "dead",
}), false);

assert.equal(isWorkspacePublicExecutableApi("Frankfurter"), true);
assert.equal(isWorkspacePublicExecutableApi("CoinGecko"), true);
assert.equal(isWorkspacePublicExecutableApi("Studio Ghibli API"), true);
assert.equal(isWorkspacePublicCatalogCard("Frankfurter"), true);
assert.equal(isWorkspacePublicCatalogCard("Disney+"), false);
assert.equal(isWorkspacePublicExecutableApi("Disney+"), false);
assert.equal(isWorkspacePublicExecutableApi("frankfurter"), true);
assert.equal(isWorkspacePublicExecutableAction("frankfurter", "call"), true);
assert.equal(isWorkspacePublicExecutableAction("frankfurter", "latest"), true);
assert.equal(isWorkspacePublicExecutableAction("frankfurter", "drop table"), false);

const frankfurter = getWorkspacePublicApi("Frankfurter");
assert.ok(frankfurter);
assert.equal(buildPinnedPublicApiUrl(frankfurter, "https://evil.example/steal"), undefined);
assert.equal(buildPinnedPublicApiUrl(frankfurter, `${frankfurter.origin}/latest`)?.origin, frankfurter.origin);

const curatedFrankfurter = CURATED_WORKSPACE_PUBLIC_APIS.find((api) => api.id === "frankfurter");
assert.ok(curatedFrankfurter);
assert.equal(curatedFrankfurter.baseUrl, "https://api.frankfurter.dev/v1");
assert.equal(curatedFrankfurter.origin, "https://api.frankfurter.dev");
assert.equal(
  buildPinnedPublicApiUrl(curatedFrankfurter, "/latest")?.toString(),
  "https://api.frankfurter.dev/v1/latest",
);

const coingecko = getWorkspacePublicApi("CoinGecko");
assert.ok(coingecko);
assert.equal(coingecko.baseUrl, "https://api.coingecko.com/api/v3");
assert.equal(coingecko.origin, "https://api.coingecko.com");
assert.equal(
  buildPinnedPublicApiUrl(coingecko, "/simple/price")?.toString(),
  "https://api.coingecko.com/api/v3/simple/price",
);
assert.equal(
  buildPinnedPublicApiUrl(coingecko, "/simple/price?ids=solana")?.toString(),
  "https://api.coingecko.com/api/v3/simple/price?ids=solana",
);
assert.equal(buildPinnedPublicApiUrl(coingecko, "https://evil.example/steal"), undefined);
assert.equal(buildPinnedPublicApiUrl(coingecko, "//evil.example/steal"), undefined);
assert.equal(
  buildPinnedPublicApiUrl(coingecko, "https://api.coingecko.com/simple/price")?.toString(),
  "https://api.coingecko.com/simple/price",
);

const executeSource = readFileSync("convex/http.ts", "utf8");
assert.match(executeSource, /workspace_public_/);
assert.match(executeSource, /redirect:\s*"error"/);
assert.match(executeSource, /public_api_requires_workspace_auth/);
assert.doesNotMatch(
  executeSource,
  /keylessPublicExecutionAvailable:\s*true/,
);
assert.match(readFileSync("src/product-truth.ts", "utf8"), /keylessPublicExecutionAvailable: false/);
assert.match(
  readFileSync("landing/src/app/api/catalog/route.ts", "utf8"),
  /workspace-public-apis\.json/,
);
assert.equal(existsSync("src/workspace-public-apis.generated.ts"), false);
assert.doesNotMatch(
  readFileSync("src/workspace-public-apis.data.ts", "utf8"),
  /as const satisfies/,
);

console.log(
  `workspace-public APIs: ${WORKSPACE_PUBLIC_EXECUTABLE_COUNT} origins, anonymous keyless proxy stays off`,
);
