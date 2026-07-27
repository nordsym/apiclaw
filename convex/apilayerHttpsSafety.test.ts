#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import { buildManagedRequest, buildVerifiedApilayerHttpsUrl } from "./http";

assert.equal(
  buildVerifiedApilayerHttpsUrl(
    "https://api.apilayer.com/email_verification/check",
    {
      email: "user@example.net",
    },
  ),
  "https://api.apilayer.com/email_verification/check?email=user%40example.net",
);
assert.throws(
  () =>
    buildVerifiedApilayerHttpsUrl(
      "http://api.apilayer.com/email_verification/check",
    ),
  RangeError,
);
assert.throws(
  () =>
    buildVerifiedApilayerHttpsUrl(
      "https://api.apilayer.com.evil.example/check",
    ),
  RangeError,
);
assert.throws(
  () => buildVerifiedApilayerHttpsUrl("https://key@api.apilayer.com/check"),
  RangeError,
);

const previousKey = process.env.APILAYER_API_KEY;
process.env.APILAYER_API_KEY = "apilayer-test-key";
try {
  const secureActions: Array<[string, Record<string, unknown>]> = [
    ["exchange_rates", { base: "USD" }],
    ["verify_email", { email: "user@example.net" }],
    ["verify_number", { number: "+46700000000" }],
    ["world_news", { url: "https://example.net/article" }],
    ["finance_news", { tickers: "AAPL" }],
    ["scrape", { url: "https://example.net" }],
    ["skills", { q: "security" }],
    ["image_crop", { url: "https://example.net/image.png" }],
    ["form_submit", { endpoint: "safe-form", data: { name: "Ada" } }],
    ["pdf_generate", { document_url: "https://example.net/page" }],
    ["screenshot", { url: "https://example.net" }],
    ["ipapi_lookup", { ip: "203.0.113.8" }],
    ["exchangeratehost_latest", { source: "USD" }],
  ];
  for (const [action, params] of secureActions) {
    const request = buildManagedRequest("apilayer", action, params);
    assert.ok(request, `${action} should remain available over verified HTTPS`);
    assert.equal(
      new URL(request.url).protocol,
      "https:",
      `${action} must use HTTPS`,
    );
  }

  const plaintextLegacyActions = [
    "vat_check",
    "market_data",
    "aviation",
    "weatherstack_current",
    "weather",
    "weatherstack_forecast",
    "ipstack_lookup",
    "currencylayer_live",
    "currencylayer_convert",
    "coinlayer_live",
    "positionstack_forward",
    "positionstack_reverse",
    "fixer_latest",
    "fixer_convert",
    "languagelayer_detect",
    "scrapestack_scrape",
    "serpstack_search",
    "mediastack_news",
    "userstack_detect",
  ];
  for (const action of plaintextLegacyActions) {
    assert.equal(
      buildManagedRequest("apilayer", action, {
        query: "customer-data",
        amount: 1,
      }),
      null,
      `${action} must fail closed until verified HTTPS support exists`,
    );
  }

  assert.equal(
    buildManagedRequest("apilayer", "form_submit", {
      endpoint: "../other-route",
      data: { private: true },
    }),
    null,
    "dynamic APILayer form paths must stay within one encoded path segment",
  );
} finally {
  if (previousKey === undefined) delete process.env.APILAYER_API_KEY;
  else process.env.APILAYER_API_KEY = previousKey;
}

console.log("APILayer managed actions use verified HTTPS or fail closed");
