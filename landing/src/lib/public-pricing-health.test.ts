#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import packageMetadata from "../../../package.json";
import { GET } from "../app/health/route";
import { PLANS } from "./plans";
import { createServiceHealth, SERVICE_VERSION } from "./service-health";

async function main() {
  const now = new Date("2026-10-14T12:00:00.000Z");
  assert.deepEqual(createServiceHealth(now), {
    status: "ok",
    service: "apiclaw-gateway",
    version: packageMetadata.version,
    timestamp: now.toISOString(),
  });
  assert.equal(SERVICE_VERSION, packageMetadata.version);

  const response = await GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  const body = await response.json() as { status: string; version: string };
  assert.equal(body.status, "ok");
  assert.equal(body.version, packageMetadata.version);

  const free = PLANS.find((plan) => plan.id === "free");
  const paid = PLANS.find((plan) => plan.id === "usage_based");
  assert.ok(free?.features.some((feature) => /25 managed calls/.test(feature)));
  assert.ok(free?.features.some((feature) => /\$1 provider cost/.test(feature)));
  assert.ok(paid?.features.some((feature) => /provider cost plus 15%/i.test(feature)));
  for (const provider of ["OpenRouter"]) {
    assert.ok(paid?.features.some((feature) => feature.includes(provider)), `${provider} must be listed on the paid plan`);
  }

  for (const provider of ["xAI", "Anthropic", "Groq", "DeepInfra", "APILayer"]) {
    assert.ok(!paid?.features.some((feature) => feature.includes(provider)), `${provider} is not approved for paid resale`);
  }

  const pricingPage = readFileSync("landing/src/app/pricing/page.tsx", "utf8");
  assert.match(pricingPage, /href="\/workspace\?tab=billing"/);
  assert.doesNotMatch(pricingPage, />API Layer</);

  const header = readFileSync("landing/src/components/home/SiteHeader.tsx", "utf8");
  const footer = readFileSync("landing/src/components/home/SiteFooter.tsx", "utf8");
  const middleware = readFileSync("landing/middleware.ts", "utf8");
  assert.match(header, /href="\/pricing"/);
  assert.match(footer, /href: "\/pricing"/);
  assert.match(middleware, /\["\/health", "\/api\/health"\]/);

  console.log("public pricing and health tests passed");
}

void main();
