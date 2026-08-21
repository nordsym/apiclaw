#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import {
  APILAYER_CUSTOMER_EXECUTABLE_ACTIONS,
  APILAYER_PAID_PLAN_ONLY_ACTIONS,
  APILAYER_SUBSCRIPTION_BLOCKED_ACTIONS,
  isPublicCustomerExecutableAction,
} from "../src/product-truth";
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
    ["vat_check", { vat_number: "SE5560000000" }],
    ["market_data", { symbols: "AAPL" }],
    ["aviation", { flight_iata: "SK123" }],
    ["weatherstack_current", { query: "Stockholm" }],
    ["weatherstack_forecast", { query: "Stockholm" }],
    ["ipstack_lookup", { ip: "203.0.113.8" }],
    ["currencylayer_live", { source: "USD" }],
    ["currencylayer_convert", { from: "USD", to: "EUR", amount: 1 }],
    ["coinlayer_live", { target: "USD" }],
    ["positionstack_forward", { query: "Stockholm" }],
    ["positionstack_reverse", { query: "59.33,18.07" }],
    ["fixer_latest", {}],
    ["languagelayer_detect", { query: "hello" }],
    ["scrapestack_scrape", { url: "https://example.net" }],
    ["serpstack_search", { query: "APIClaw" }],
    ["mediastack_news", { keywords: "markets" }],
    ["userstack_detect", { ua: "Mozilla/5.0" }],
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
    "weather",
    "fixer_convert",
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

  const requiredParams: Record<string, Record<string, unknown>> = {
    exchange_rates: { base: "EUR" },
    market_data: { symbols: "AAPL" },
    aviation: {},
    pdf_generate: { document_url: "https://example.net/page" },
    screenshot: { url: "https://example.net" },
    verify_email: { email: "user@example.net" },
    finance_news: {},
    scrape: { url: "https://example.net" },
    vat_check: { vat_number: "SE5560000000" },
    currencylayer_live: {},
    currencylayer_convert: { from: "USD", to: "EUR", amount: 1 },
    coinlayer_live: {},
    exchangeratehost_latest: {},
    weatherstack_current: { query: "Stockholm" },
    weatherstack_forecast: { query: "Stockholm" },
    ipstack_lookup: { ip: "203.0.113.8" },
    ipapi_lookup: { ip: "203.0.113.8" },
    positionstack_forward: { query: "Stockholm" },
    positionstack_reverse: { query: "59.33,18.07" },
    languagelayer_detect: { query: "hello" },
    scrapestack_scrape: { url: "https://example.net" },
    serpstack_search: { query: "APIClaw" },
    mediastack_news: {},
    userstack_detect: { ua: "Mozilla/5.0" },
    fixer_latest: {},
  };
  for (const action of APILAYER_CUSTOMER_EXECUTABLE_ACTIONS) {
    assert.equal(isPublicCustomerExecutableAction("apilayer", action), true);
    const request = buildManagedRequest("apilayer", action, requiredParams[action] ?? {});
    assert.ok(request, `${action} must be executable over verified HTTPS`);
    assert.equal(new URL(request.url).protocol, "https:");
  }
  for (const action of [
    ...APILAYER_SUBSCRIPTION_BLOCKED_ACTIONS,
    ...APILAYER_PAID_PLAN_ONLY_ACTIONS,
  ]) {
    assert.equal(isPublicCustomerExecutableAction("apilayer", action), false);
  }
} finally {
  if (previousKey === undefined) delete process.env.APILAYER_API_KEY;
  else process.env.APILAYER_API_KEY = previousKey;
}

console.log("APILayer managed actions use verified HTTPS or fail closed");
