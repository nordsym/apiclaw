# New customer preview verification

Verified 2026-10-15T15:05:49.620Z. PR: https://github.com/nordsym/apiclaw/pull/60 . Production was not changed.

Preview app: https://apiclaw-a8nfh6bo4-gustavs-projects-0c9f35af.vercel.app

Isolated Convex: abundant-goldfish-47, https://abundant-goldfish-47.eu-west-1.convex.site. Preview uses Clerk development credentials and NASA only, with no Stripe credentials.

## Real customer journey

A fresh isolated headless Chromium context opened the landing page, clicked Sign up, submitted a new test identity through the actual Clerk form, verified its email, reached its Free workspace, clicked Try NASA free and displayed the real APOD result. Clerk's [official testing helper](https://clerk.com/docs/guides/development/testing/playwright/test-sign-up-flows) supplied a testing token and the reserved test OTP. No Clerk user or workspace was pre-created through an admin API; no API response or authentication session was mocked.

The same customer's session then called every measured free API through /v1/execute, including the open:frankfurter alias. Exact docs curl snippets for NASA APOD and Frankfurter latest also succeeded against this preview. All requests used X-APIClaw-Session. No provider keys were exposed to the customer.

| API | HTTP | Gateway success | Latency ms |
|---|---:|---|---:|
| adviceslipapi | 200 | true | 420 |
| anapioficeandfire | 200 | true | 195 |
| catfactsapi | 200 | true | 327 |
| colorapi | 200 | true | 339 |
| frankfurter | 200 | true | 111 |
| homebrew | 200 | true | 317 |
| jsonplaceholder | 200 | true | 260 |
| lobstersapi | 200 | true | 461 |
| mlbdataapi | 200 | true | 482 |
| officialjokeapi | 200 | true | 307 |
| studioghibliapi | 200 | true | 244 |
| terraformregistry | 200 | true | 233 |
| yr | 200 | true | 241 |

## Billing boundary

The workspace remained Free and had no Stripe customer or subscription. Before and after the 13 public calls: managed call count 1, activation managed count 1, activation provider cost 0 micro USD, managed ledger rows 2, usage reporting rows 0. Every value was identical after the batch. NASA's existing zero-charge managed path was retained. Public reads did not reserve managed usage or create billing records.

## Catalog and web checks

/api/catalog returned 16 callable cards: 13 measured free APIs plus 3 existing approved managed providers. Filtering returned exactly 16 cards and excluded 0x, 1inch, 1Forge and the duplicate Frankfurter alias. Preview has 26618 indexed definitions and no submitted community listing; production's submitted listings are separate discovery metadata and were not changed. Homepage and docs label the static indexed count; the catalog includes its current community count. canonGeneratedAt: 2026-10-15.

The initial catalog render uses the same checked-in measured callable count, with no fallback to 3. Browser filter, server-rendered booking with JavaScript disabled and404 navigation all passed on preview. Before/after screenshots and NASA result are in evidence/2026-10-15/.

## Scope and limitation

The approximately 1,000 callable target was not established. All 1,002 prior public candidates were probed; many pointed to websites or had unknown pricing, unavailable endpoints or auth requirements. The complete results and measurement policy are in [callable-audit.md](callable-audit.md). The public count is the measured snapshot, not a claim that untested providers work. The three managed providers were reviewed separately in [managed-api-audit.md](managed-api-audit.md); no paid managed requests were made during this keyless audit.

The weekly recheck becomes active after merge, uploads evidence and flags membership changes for reviewed refresh. It does not publish, merge or deploy changes.

Local checks passed: full npm suite, root/Convex/landing TypeScript, CLI first_run/login/first-call regressions, gateway auth/SSRF/rate-limit/no-billing tests, exact docs curl contract tests, rendered web first-call retry/loading, listing E2E and both builds. PR checks and final preview deployment are tracked on the PR.
