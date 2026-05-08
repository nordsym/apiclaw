# APILayer Integration Status

**Last verified:** 2026-05-08 gateway URL verification (`/tmp/verify-22.mjs`).

## Summary

22 of 27 APILayer APIs callable via APIClaw live gateway. 1 callable with constraint. 4 blocked upstream by subscription.

## Live, no constraint (21)

**Unified (apikey header):** exchange_rates, market_data, aviation, pdf_generate, screenshot, verify_email, finance_news, scrape

**Legacy (access_key qs):** vat_check, currencylayer (live + convert), coinlayer, exchangeratehost, weatherstack (current + forecast), ipstack, ipapi, positionstack (forward + reverse), languagelayer, scrapestack, serpstack, mediastack, userstack

## Live with constraint (1)

- fixer_latest -- callable. Gateway sends `base=EUR` by default. Free plan locks base to EUR; non-EUR base raises 400. `fixer_convert` is a separate paid-plan-only action and is not callable on the current subscription.

## Blocked by subscription (4)

- verify_number
- world_news
- image_crop
- form_submit

## Deprecated upstream (2)

- Zenscrape
- Zenserp

## Caveats

- `pdf_generate` is rate-limited in registry. Functional today but may 429 under load.
- `finance_news` returns 2021-vintage data. Endpoint live, dataset stale.
- `ipstack` and `ipapi` return identical responses from the same backend.
- `serpstack` has high latency variance (12s timeout observed once; 0.3s on retry). Gateway timeout may surface intermittently.
- `fixer_latest` free-plan monthly cap is 100 requests. Verification testing consumed a portion of this month's allocation.
