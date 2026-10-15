# Callable API customer verification

Evidence checkpoint: 2026-10-15T18:04:58.383Z. PR: https://github.com/nordsym/apiclaw/pull/60. This document records preview evidence; it does not establish a production deployment or completion of the 1,000-callable-API target.

## What has been established

| Stage | Evidence | Meaning |
| --- | --- | --- |
| Earlier customer journey, 15:05 UTC | [Dated baseline](customer-onboarding-verification.md) | 13 measured free APIs plus three approved managed providers, 16 callable cards. This is historical evidence, not the current count. |
| Full upstream sweep, 17:29:32.497 UTC | [Audit JSON](callable-audit.json), `lastFullSweepAt` | All 1,641 expanded candidate/alias rows were covered. Successful responses required reviewed free eligibility and valid data; websites, unknown pricing and ambiguous authorization errors did not qualify. |
| Canonical review following that sweep | FDA food and drug datasets share canonical ID `fda` | 198 free API identities remained before customer gateway verification. Actions, datasets and aliases do not add extra APIs. |
| Authenticated customer batch, 17:48:31.263 UTC | Per-row `gatewayVerification` in the audit JSON | 195 of those 198 free APIs passed through the isolated preview gateway. Three were disabled by native health checks and remain discovery. |
| Incremental upstream and customer checks, 18:04:58.383 UTC | 20 additional canonical APIs passed both stages | All 20 passed authenticated customer gateway calls; their billing snapshots were unchanged. |
| Merged authenticated evidence | [Sanitized customer proof](evidence/2026-10-15/customer-gateway.json) | 215/215 retained free APIs passed customer gateway verification. With three existing approved managed providers, the reviewed total is 218. The earlier three native-health failures remain discovery. |

The isolated backend is `abundant-goldfish-47`, at https://abundant-goldfish-47.eu-west-1.convex.site. Requests use a real logged-in customer's `X-APIClaw-Session` through `/v1/execute`. The original signup, NASA first-call and exact docs examples are described in the dated baseline. Secrets and workspace identifiers are excluded from committed evidence.

The three native-health failures in the 198-API batch were RandomFox (HTTP 520), Tunisia (no HTTP response, status 0) and Pokémon (HTTP 502). These are observations from the preview environment, not claims that the services are permanently unavailable. A later healthy native recheck can restore an API that remains in the approved manifest; adding a removed API requires reviewed evidence and deployment.

Before/after billing snapshots for the customer batch were byte-equal. The workspace's managed counters and billing records did not change during the free public calls. The evidence compiler separately requires deep equality of the supplied snapshots before accepting customer proof. No paid managed requests, provider account creation or payment operations were part of this audit.

## Evidence boundaries

`checkedAt`, HTTP status, upstream latency and response traces record the upstream probe. `gatewayVerification` records the separate authenticated customer result, preview origin and verification time. A merged batch keeps each previous result's verification date; it must not make an older call appear freshly tested.

The evidence compiler requires a unique result for every currently eligible canonical API. Failure, a discovery response or native health disablement demotes the API; it never promotes an existing discovery row. Successful upstream evidence is retained as `upstreamVerified` and `upstreamOutcome` when the customer gateway check is applied. Canonical aliases follow a failed canonical API.

The 20 verified additions were npm Registry, Codeberg, MMO Games, ITIS, Callook.info, ChEBI, Finnish Meteorological Institute, MedlinePlus, Hong Kong Observatory, Gene Ontology, Human Protein Atlas, Eurostat, DigiDates, isEven, UK Bank Holidays, inspirehep.net, ONS UK, SEC EDGAR, CDC and EPA. All 20 passed the authenticated customer batch at 18:04:58.383 UTC. The merged evidence preserves the earlier 195 successful results at their original verification time, giving 215 free customer-verified APIs. The three existing approved managed providers are counted separately and were not re-audited by keyless probes.

## Keeping the live count honest

The native Convex `publicApiHealth.recheck` job runs every Monday at 05:23 UTC. It checks reviewed canonical GET endpoints in bounded batches using the gateway's shared transport and decoder. Failed checks write an unhealthy state, which disables execution and removes the API from the live callable snapshot. This works without a GitHub merge or website redeployment. It does not add unreviewed APIs.

The public `publicApiHealth:snapshot` response supplies `approvedIds`, `disabledIds` and the oldest complete health-check timestamp. The landing app intersects its local reviewed manifest with the backend's `approvedIds`, then removes `disabledIds`. This prevents a newer website from advertising candidates not yet approved by the deployed backend. If the health snapshot is missing or invalid, availability is shown as unavailable rather than substituting a guessed count. An unprobed approved entry defaults healthy in the native overlay; therefore the snapshot is deployment/health state, not a substitute for the committed customer proof.

The GitHub scheduled audit is a separate review mechanism. It produces an evidence artifact; it does not promote APIs, refresh the manifest, merge or deploy. New upstream successes require reviewed canonical/free eligibility, authenticated customer verification and a deployed manifest before the final public claim.

## Completion still required

The merged customer evidence establishes 215 free APIs plus three approved managed providers, 218 total. The native 215-API health recheck is running on preview; its completed outcome is not yet established in this checkpoint. A fresh signup-to-NASA journey, four selected free API calls, and agreement across the preview homepage, catalog, docs and served skill still require final verification. Record the final preview deployment, health outcome and PR checks before claiming the entire acceptance journey is complete.

The 1,000-callable target is not met by this checkpoint. Remaining unresolved endpoints may yield further APIs. The number of free-key registrations needed to close the gap is unknown; product overlap, credentials, gateway compatibility and redistribution rights must be established rather than inferred from signup pages. [The free-key research](free-api-key-signups.md) is a research shortlist, not measured gateway capacity.
