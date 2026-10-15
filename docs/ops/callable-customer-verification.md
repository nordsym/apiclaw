# Callable API customer verification

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

## Remaining acceptance gap

233 is 767 below 1,000. The expanded pool is not exhausted and no global impossibility claim is justified. [Gap analysis](callable-gap-analysis.md) identifies remaining endpoint, rights and quota work. [Fifty researched free-key account families](free-api-key-signups.md) establish no new customer-callable capacity: entitlements, overlap and shared gateway rights still need verification. The required signup count remains unknown.
