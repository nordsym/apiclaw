# Callable API customer verification

## Current result: 2026-10-16

**1,140 distinct free APIs passed real authenticated customer calls through `/v1/execute`.** The catalogue adds the three previously approved managed providers for **1,143 callable cards**. The original customer baseline was 13 free APIs and three managed providers, 16 total. The free rail alone now exceeds the 1,000 target. PR #60 remains a draft, unmerged; this is isolated preview evidence, not a production release.

The full customer batch attempted all 1,154 upstream-qualified candidates, with three workers and globally spaced starts below the workspace rate limit. Eleven candidates had failed the independent native health sweep and were denied with a friendly 503. Three further customer calls timed out. All fourteen were removed from the callable manifest and remain discovery. No credentials or paid calls were used upstream. The retained 1,140 defaults have native health records from the same full sweep, with no disabled or unchecked entries after the final isolated backend deployment.

[Full customer evidence](evidence/2026-10-16/customer-gateway-final.json) records every bounded result and its actual date. Before/after workspace usage, managed allowance, costs, billing ledger and Stripe state were identical. A final post-deployment sample chose three APIs by a fixed hash over the surviving IDs: SunriseSunset, NuGet and BioStudies. Those three and Frankfurter all passed again with unchanged billing. [Selected-call evidence](evidence/2026-10-16/customer-sample-final.json) and [native health readback](evidence/2026-10-16/native-health-final.json) contain the receipts. No workspace identifiers, credentials or response bodies are published.

**Scope matters:** 832 of the 1,140 counted services are restricted to their exact reviewed metadata paths. They search independently operated public catalogues, repositories or scheme/operator information. They do not promise access to every dataset, downloads, private records or unrestricted routes on that host. Each independent service counts once; datasets, actions, aliases, versions and mirrors never add capacity. The [qualification and holds](callable-recovery-queue.md) explain source entitlement and identity boundaries.

Actual HTTP negatives against an otherwise working scoped API confirmed unreviewed same-origin paths return 400, writes return 405, and missing or invalid customer sessions return 401. [Scope/auth evidence](evidence/2026-10-16/scope-auth.json) records these checks. SSRF protection, endpoint restrictions, HTTPS pinning, bounded responses and per-workspace rate limiting remain active. A reproduced Convex concurrent-IO limit above 1,000 entries was fixed with bounded health-record reads and a 1,101-entry regression check. Final snapshot responses took 423, 157 and 81 ms, below the frontend's five-second deadline.

Normal manifest compilation now refuses upstream-only or failed customer evidence. The explicitly named preview-candidate option exists only to prepare isolated verification. Scheduled GitHub upstream checks upload evidence without publishing an unproved candidate manifest; native gateway health checks separately demote unhealthy approved services automatically. No keys, provider accounts or paid calls were required to reach the target. The [50 ranked free-key families](free-api-key-signups.md) remain optional research, not additional verified capacity.

Frontend source `20472509e6698634c9011bfa9ecb18276aacb375` is deployed at [the final preview](https://apiclaw-ljvkx0diu-gustavs-projects-0c9f35af.vercel.app), Vercel `dpl_9aLZ15QQA5KqdpMDUZstvD1AGvXC`, with isolated Convex `abundant-goldfish-47`. Homepage, catalog, docs, served SKILL.md and `/api/catalog` all show **1,143 without JavaScript**, including exactly 1,143 unique paginated cards. The hydrated catalogue's callable filter also returns working cards at the same count. Authenticated `/v1/discover` returns 1,143 and callable Frankfurter, using the read-back server-only preview catalog configuration. [SSR/web evidence](evidence/2026-10-16/web-final.json), [interactive catalogue](evidence/2026-10-16/catalog-browser-final.json) and [gateway discovery](evidence/2026-10-16/gateway-discovery-final.json) record these checks. Screenshots with `final` in the filename show this preview; the interactive catalogue screenshot uses JavaScript, while the separate SSR count check disables it.

Validation passed: full npm suite, 39 audit/compiler checks, root and landing builds, Convex typecheck, native health capacity checks and separate code review. [GitHub verification](https://github.com/nordsym/apiclaw/actions/runs/38890355969) and Vercel are green for `2047250`; the subsequent evidence-only commit retains the same executable source and has its own CI checks. Earlier actual signup/NASA/docs and browser funnel checks remain dated below, including NASA's intermittent upstream failures. No production deployment, npm release, billing/Stripe/pricing mutation or Arcmira publication occurred.

Own preview customer sessions were revoked after verification. A captured child session then returned HTTP 401; temporary credential/state files were removed, while workspace and user data were preserved. [Cleanup receipt](evidence/2026-10-16/session-cleanup.json).

## Historical checkpoint: 2026-10-16, 285 cards

PR #60 remains a draft and production is unchanged. **282 free APIs passed real authenticated customer gateway calls**, plus the three previously approved managed providers gives **285 compiled catalogue cards**. The 1,000 target remains unmet.

A fresh identity signed up through the actual Clerk form in isolated bundled headless Chromium. The full 286-candidate customer batch passed 280 calls; two initially health-disabled APIs subsequently passed real retries. Four native health failures remain discovery: Istanbul, Spaceflight News, Tunisia and Switzerland. No paid managed calls were made. Before/after workspace usage, managed allowances, costs, billing ledger and Stripe state were identical. [Bounded customer proof](evidence/2026-10-16/customer-gateway-checkpoint.json) excludes credentials, workspace identifiers and response bodies.

The upstream sweep covered 1,668 candidate/alias rows with shared HTTPS, redirect, retry, timeout and response limits. Digitraffic now passes native customer execution using explicit gzip negotiation with bounded decompression, CRC/size validation and single-member checks. The other default requests retain identity encoding. Newly reviewed metadata capabilities can be limited to exact endpoint paths, including redirects; unreviewed same-origin downloads are denied before a request. Existing unrestricted reviewed rails retain their behavior.

The source snapshot is compiled from the customer proof. Frontend deployment dpl_F3MWULJF48R8sfKGtQrWNUUK83dJ (source 7d423fa) passed all five surfaces without JavaScript at 2026-10-16T10:04:03.073Z, including 285 unique paginated cards. [Web proof](evidence/2026-10-16/web-checkpoint.json) and the October 16 checkpoint screenshots record this count. The older screenshots and frontend proof below describe the historical October 15 checkpoint. Additional scientific, mobility and portal candidates are not included until their entitlement, identity, native health and customer execution are verified. Local full tests, 34 audit tests and focused metadata-path/compression checks pass. No production deployment or npm release has occurred.

## Historical checkpoint: 2026-10-15

Evidence checkpoint: 2026-10-15T18:22:08.067Z. [PR #60](https://github.com/nordsym/apiclaw/pull/60) remains a draft, unmerged. Production is unchanged. The 1,000-callable target is not met.

## Measured capacity

| Checkpoint | Free APIs | Existing managed | Total |
| --- | ---: | ---: | ---: |
| Original customer baseline | 13 | 3 | 16 |
| First expanded authenticated batch | 195 | 3 | 198 |
| Additional 20 authenticated successes | 215 | 3 | 218 |
| Subsequent native health failures excluded | 212 | 3 | 215 |
| Final 18 authenticated additions/repairs | 230 | 3 | 233 |

The complete upstream sweep covered 1,641 candidate/alias rows at 17:29:32.497 UTC. Subsequent targeted checks retain that timestamp and each unchanged result's original date. Aliases, paths, operations and datasets do not add extra services. The final merged proof covers all 230 retained free APIs through authenticated `/v1/execute` calls against isolated Convex `abundant-goldfish-47`. Its complete native health sweep also passed all 230 reviewed defaults. No paid managed calls were made. The three pre-approved managed providers are not re-audited by keyless probes.

[Customer gateway proof](evidence/2026-10-15/customer-gateway.json) contains bounded outcomes, separate verification dates and equal before/after billing snapshots. Workspace identifiers, credentials and raw response bodies are excluded. The proof application requires unique complete coverage and deep-equal billing snapshots; failed/discovery/disabled entries cannot be promoted by it. Upstream evidence and customer evidence remain separate in [the audit](callable-audit.md).

RandomFox, Tunisia, Pokémon and Berlin transport remain discovery after native failures. AviationWeather was repaired with a bounded KJFK request; the UK catalog required a field projection to avoid an oversized response. Both subsequently passed native health and authenticated customer calls. FDA food/drug aliases count as one API.

## Customer journey and actual limitations

A new identity signed up through the real Clerk form in isolated bundled headless Chromium. Clerk's official test helper and reserved OTP were used; users/workspaces were not pre-created administratively. The same customer's NASA APOD result was displayed after retry. NASA returned intermittent real upstream HTTP 500 responses; an admin-only preview probe confirmed that this also occurs directly upstream with valid JSON. The temporary diagnostic function was removed. Do not describe the first-attempt NASA journey as uniformly successful.

The exact documentation curl snippets for NASA APOD and Frankfurter latest passed against preview. Three deterministically selected free APIs (Cat Facts API, Digimon Information and Open Government, Poland) plus `open:frankfurter` all returned successful customer gateway results, with billing counters unchanged. [Selected-call evidence](evidence/2026-10-15/customer-sample.json) and [NASA transport observations](evidence/2026-10-15/nasa-transport.json) record these checks. The browser's 70-second deadline now permits the existing gateway's upstream budget. A reproduced onboarding race was fixed so activation polling cannot hide a pending local response or dismiss its successful result before the explicit Open workspace action. Controlled browser tests cover that race, failure/retry/loading and unchanged external agent completion.

Final frontend preview: `dpl_AGrBQYJoadqJXerevKqKQNHLePkS`, https://apiclaw-r57u4ygqg-gustavs-projects-0c9f35af.vercel.app, source `a43a1f46c3d37ae8bd09fab3c2d893152e9e15e5`. All five live surfaces displayed **233** without JavaScript, with exactly 233 unique paginated callable cards. A controlled health failure reduced every surface to 232 and denied execution with a friendly 503; restoration returned all to 233. The real authenticated `/v1/discover` route also returned 233 and callable Frankfurter after restoration. [Web proof](evidence/2026-10-15/web-surfaces.json), [gateway discovery](evidence/2026-10-15/gateway-discovery.json) and [native health readback](evidence/2026-10-15/native-health.json) record the final checks. Screenshots `home-followup.png`, `catalog-followup.png`, `docs-followup.png` show this frontend; `workspace-followup-nasa.png` records the successful new customer's NASA retry on the earlier preview with the same first-call UI code.

Validation passed: full npm suite, 32 audit tests, root/Convex/landing type checks, both builds, rendered first-call and onboarding-race browser tests, listing E2E and actual docs curl calls. GitHub `verify` and Vercel checks are green for the tested source. Evidence-only follow-up commits must retain their own green checks. No production or npm release was performed.

## Keeping discovery honest

The native Convex `publicApiHealth.recheck` cron runs Monday at 05:23 UTC after deployment. Bounded canonical GET probes use the gateway's transport and response decoder. Failure disables execution and moves the API to discovery through the shared health overlay without a website deployment; a later healthy check can restore only an already approved manifest entry. Unknown IDs cannot be promoted. The separate GitHub audit uploads review evidence and never deploys or publishes additions.

Homepage, catalog, docs, served SKILL.md and `/api/catalog` intersect the frontend manifest with backend `approvedIds`, then remove `disabledIds`. Missing/invalid health state shows unavailable rather than a guessed count. Approved entries without health records default healthy, so the overlay is not a substitute for customer proof. MCP local fallback/category totals now use that same public metadata and fail closed for free callability; remote results require explicit callable true. Managed readiness remains unchanged.

`/v1/discover` defaults to the production catalog. An isolated preview can set server-only `APICLAW_CATALOG_URL` to its HTTPS Vercel `/api/catalog`, with existing `APICLAW_CATALOG_OIDC_TOKEN` for deployment protection. Tokens are never sent to callers, query strings, other hosts or redirects. A preview token can expire and must not become a production dependency; production uses the unchanged public URL.

## Historical October 15 acceptance gap

At that checkpoint, 233 was 767 below 1,000. The expanded pool is not exhausted and no global impossibility claim is justified. [Gap analysis](callable-gap-analysis.md) identifies remaining endpoint, rights and quota work. [Fifty researched free-key account families](free-api-key-signups.md) establish no new customer-callable capacity: entitlements, overlap and shared gateway rights still need verification. The required signup count remains unknown.
