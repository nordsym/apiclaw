# APILayer Integration Status

**Last verified:** 2026-08-21. Customer execution is gated by `src/product-truth.ts` plus the HTTPS execute builders in `convex/http.ts`. May 2026 gateway checks proved the rails live; this update exposes the contracted HTTPS subset to signed-in workspaces.

## Summary

22 of 27 APILayer APIs are customer-executable through `POST /v1/execute` as provider `apilayer`. 1 of those (`fixer_latest`) is callable with an EUR-base constraint. 4 remain blocked by the APILayer subscription. 1 paid-plan-only convert action stays inventory-only. 2 products are deprecated upstream.

## Customer-executable (22 APIs / 25 actions)

**Unified (apikey header):** `exchange_rates`, `market_data`, `aviation`, `pdf_generate`, `screenshot`, `verify_email`, `finance_news`, `scrape`

**Legacy (access_key qs, HTTPS):** `vat_check`, `currencylayer_live`, `currencylayer_convert`, `coinlayer_live`, `exchangeratehost_latest`, `weatherstack_current`, `weatherstack_forecast`, `ipstack_lookup`, `ipapi_lookup`, `positionstack_forward`, `positionstack_reverse`, `languagelayer_detect`, `scrapestack_scrape`, `serpstack_search`, `mediastack_news`, `userstack_detect`

## Live with constraint (1)

- `fixer_latest` — callable. Gateway sends `base=EUR` by default. Free plan locks base to EUR; non-EUR base raises 400. `fixer_convert` is a separate paid-plan-only action and is not customer-executable.

## Blocked by subscription (4)

These handlers exist but must not be advertised or authorized as customer-executable:

- `verify_number`
- `world_news`
- `image_crop`
- `form_submit`

## Deprecated upstream (2)

- Zenscrape
- Zenserp

## Why these were hidden before 2026-08-21

APILayer was inventoried as a managed adapter with an empty `customerExecutableActions` list. Catalog and `/v1/execute` both fail closed unless that list is populated **and** `hasBillingGradeManagedCost` is true. The existing `$0.01` reservation is now the billing-grade per-call cost for customer-executable APILayer actions only.

A later HTTPS pin also fail-closed legacy Idera hosts that the May 2026 verification had called over HTTP. Those hosts now answer on verified HTTPS origins, so the existing actions are wired over TLS instead of being re-enabled as a plaintext proxy.

## Caveats

- `pdf_generate` is rate-limited in registry. Functional today but may 429 under load.
- `finance_news` returns 2021-vintage data. Endpoint live, dataset stale.
- `ipstack` and `ipapi` return identical responses from the same backend.
- `serpstack` has high latency variance (12s timeout observed once; 0.3s on retry). Gateway timeout may surface intermittently.
- `fixer_latest` free-plan monthly cap is 100 requests.
- Keyless public APIs remain discovery-only. That is a hardened-egress security decision, not an APILayer filter.
