# Callable inventory gap analysis

Analysis date: 2026-10-15. This is a frozen investigation, not the current published count. Read [callable-audit.md](callable-audit.md) and [callable-audit.json](callable-audit.json) for the latest execution evidence.

## Finding

There is demonstrated room to recover more real public APIs, but the evidence does not yet support approximately 1,000 distinct customer-callable APIs. The expanded candidate pool is not exhausted. Its unresolved rows are research leads, not additional working services.

The original 1,002-row cohort cannot itself substantiate 1,000 distinct keyless services under the identities established so far: it collapses to 900 endpoint/canonical groups, of which 49 are wholly classified as non-hosted APIs. Even treating every other group as recoverable yields 851 candidate groups, before excluding keys, restrictive terms, outages, and unsupported outputs. This bound applies to that original cohort and the current grouping, not to all public APIs or the expanded pool.

The strongest alternative explanation, that generated OpenAPI specifications already contain hundreds of executable public endpoints hidden by the current matching rules, was tested against the local generated artifact. There are useful individual rescues, but no demonstrated bulk path from this artifact to the missing 782 services.

## Frozen evidence

Input: `callable-audit.json`, `checkedAt=2026-10-15T17:58:35.900Z`, `lastFullSweepAt=2026-10-15T17:29:32.497Z`. The snapshot is a partial recheck after a completed earlier sweep. SHA-256 of its compact JSON representation: `4eebb058ad0977de7a2eaebeb1da00b71059d445bdf05a5075d2781dc4a569dc`.

| Measure | Snapshot value | Interpretation |
| --- | ---: | --- |
| Expanded candidate rows | 1,641 | Includes aliases and discovery-only entries |
| Canonical free APIs passing upstream checks | 215 | Does not establish authenticated gateway execution by itself |
| Free APIs passing the recorded customer gateway batch | 195 | 195 of 198 attempted; three were demoted |
| Additional upstream successes awaiting customer proof | 20 | Not yet established as customer-callable in this snapshot |
| Existing approved managed APIs | 3 | Separate from the free public rail |
| Catalog count represented by this snapshot | 218 | 215 upstream-verified free plus three managed |
| Gap between 218 and 1,000 | 782 | A target gap, not a forecast of recoverable APIs |

The customer batch timestamp is `2026-10-15T17:48:31.263Z`; its recorded billing snapshots were identical. This report did not repeat that batch or make any production changes.

### Remaining classifications

| Cause | Rows |
| --- | ---: |
| Wrong base URL or path | 747 |
| Unresolved | 77 |
| HTTPS/redirect issue | 186 |
| Duplicate | 173 |
| Dead upstream | 94 |
| Not a hosted API | 63 |
| Timeout | 38 |
| Gateway block | 21 |
| Unknown pricing | 12 |
| Key required | 10 |
| Rate limited | 3 |
| Commercial permission issue | 2 |
| Verified | 215 |
| **Total** | **1,641** |

The 824 wrong-path/unresolved rows contain only five reviewed recipes. Eighty-six already have recorded free-use evidence; 738 do not. The latter figure means evidence is missing, not that all 738 are paid. Twenty-nine share an origin with an already verified service and need identity review before they can increase the count. Origin overlap alone does not prove duplication, just as separate origins do not prove separate services.

## OpenAPI bulk-rescue hypothesis

The local `src/registry/generated-providers.json` contains 25,538 provider/version rows, 6,396 normalized names, and 3,275 origins. Its `callableCount` is 9,478. That number counts provider rows with at least one action declared `GET` and `requiresAuth:false`; it is not an inventory of verified free services.

| Local artifact test | Result |
| --- | ---: |
| Provider/version rows with a declared public GET | 9,478 |
| Distinct normalized names among them | 3,146 |
| Rows with a public GET without path placeholders or required parameters | 5,195 |
| Distinct normalized names in that subset | 2,331 |
| Exact normalized-name matches against the 824 unresolved/wrong-path rows | 1 |
| Public GET candidates in that exact-name match | 0 |
| Exact-host matches, excluding generic documentation/deployment hosts | 19 candidate rows across 18 hosts |
| Exact-host matches with any nominal public GET | 14 candidate rows |
| Looser host-family matches with any nominal public GET | 21 candidate rows |

The exact-name match is Google Play Developer, whose matched specs do not declare a public GET. Host-family matching strips one `www`, `api`, `docs`, `developer`, or `developers` prefix and is only a triage aid. It must not grant execution or establish identity.

Useful matches include HealthCare.gov, Swiss Transport, Raider.IO and REFUGE Restrooms. Several others are already counted aliases, including httpbin, MLB and JSONPlaceholder. QuickChart's image output does not fit the current structured-response rail. ExtendsClass JSON storage requires an existing resource identifier. These conditions are not solved by changing a hostname matcher.

Two counterexamples invalidate automatically trusting the generated auth flag:

- Envoice's generated `GET /api/client/all` has `requiresAuth:false` but also requires `x-auth-key` and `x-auth-secret` headers. No authenticated request was attempted.
- Historical ReqRes specs declare public GETs, while the [current official docs](https://reqres.in/docs) require an API key for every request. A free signup is not keyless access.

A safe bulk import therefore still needs current official source matching, required-header inspection, a bounded public default request, free-use evidence, service deduplication and customer execution proof. The 2,331 names are a wider research pool, not a defensible callable count.

## Largest actionable queues

These queues overlap and their row counts must not be added. Labels are manual triage of candidate names, not claims that their endpoints work or their terms permit use.

| Queue in the 824 wrong-path/unresolved rows | Rows | Practical recovery mechanism |
| --- | ---: | --- |
| Existing free-use evidence | 86 | Resolve official API host/path and required default parameters before investigating uncertain commercial services |
| Government, statistics and open-data-labelled entries | 60 | Resolve portal pages to operator-documented CKAN, SDMX or other public read APIs; review each operator's terms |
| Transit-labelled entries | 26 | Resolve official timetable/real-time REST or feed endpoints, then distinguish public access from registration/key-based feeds |
| Exact-host OpenAPI matches with nominal public GET | 14 | Review a small, bounded set of specifications instead of widening global execution rules |

The government queue includes `bancaditalia`, `bundesbankapi`, `banquedefrance`, `bankofisrael`, `czechnationalbank`, `statcanstatistics`, `spaininestatistics`, `datagovdk`, `hongkongopendataapi`, `istanbulibbopendata`, `chicagodataportalapi`, and multiple national open-data portals. Aliases such as three EU portal names and multiple Russian central-bank names need consolidation first. Census is a counterexample within this queue: the [May 2026 official guide](https://www.census.gov/data/developers/guidance/api-user-guide.Query_Limits.html) requires a key for all data queries.

[CKAN's API documentation](https://docs.ckan.org/en/2.11/api/) supplies a reusable read pattern, `/api/3/action/package_search?rows=1`. Each actual portal still needs a documented host and permission check. Check `success:true`, not HTTP 200 alone. Multiple datasets returned by one portal remain one service, not hundreds of APIs. The government queue is not a claim that all 60 portals use CKAN.

The transit queue includes `digitrafficfinland`, `entur`, `ruter`, `transportforswitzerland`, `ovapinetherlands`, `ratpparistransit`, `resrobot`, `trafikverketopenapi`, `hsl`, `transitland`, and regional transport entries. The [Swiss Transport API](https://transport.opendata.ch/) and [Digitraffic's official railway docs](https://www.digitraffic.fi/en/railway-traffic/) are concrete public-source starting points. Entur/Ruter/Norway, Netherlands/OVAPI and Transitland's duplicate labels require identity review; a row is not necessarily another operator/API. Do not assume that a public transit website implies an anonymous feed.

### Concrete next investigations

| Candidate | Primary evidence or existing response | Missing condition before promotion |
| --- | --- | --- |
| HealthCare.gov | [Official developer docs](https://www.healthcare.gov/developers/) explicitly allow everyone to embed machine-readable content and document `https://www.healthcare.gov/accessibility.json` | One bounded structured response and authenticated gateway proof; this investigation did not probe it |
| Swiss Transport | [Official public API docs](https://transport.opendata.ch/); official spec at `https://transport.opendata.ch/swagger.json` | Resolve a small default query, confirm usage conditions and gateway response |
| Raider.IO | [Official API](https://raider.io/api), spec at `https://raider.io/openapi.json` | Review current spec/security and hosted-use terms; historical generated GETs alone are insufficient |
| REFUGE Restrooms | [Official API docs](https://www.refugerestrooms.org/api/docs/), generated GET collection exists | Current free hosted-use evidence and cheap valid collection response |
| arXiv metadata | [Official terms](https://info.arxiv.org/help/api/tou.html) provide free APIs and CC0 descriptive metadata; a prior bounded request returned Atom XML | Enforce the operator's aggregate one request per three seconds and single-connection policy before routing customer traffic |
| iDigBio | Prior bounded summary-count response was valid JSON; [operator API documentation](https://github.com/idigbio/idigbio-search-api/wiki) exists | Establish current hosted API/data reuse entitlement; an old license URL failed |
| Czech National Bank | Prior official `daily.txt` request returned a small exchange-rate text response | Current reuse evidence and a supported structured interpretation of the pipe-separated response |
| Maven Central | Prior bounded request to `central.sonatype.com/solrsearch/select` returned JSON | Resolve proxy/commercial-use implications in [current terms](https://central.sonatype.org/terms.html); a free public consumption tier alone does not settle these |

Prior responses in the last four rows are exploratory upstream observations from recipe research, not additions to the frozen verified count or authenticated customer proof. No new broad sweep, account, key or paid call was made for this report.

## What should remain discovery

Keyless HTTP access does not establish permission for APIClaw to expose a service. [7Timer's documentation](https://www.7timer.info/doc.php?lang=en) limits free redistribution to non-commercial use. [GDBrowser's API page](https://gdbrowser.com/api) asks developers not to use its hosted API. [Huwise/Opendatasoft's terms](https://legal.opendatasoft.com/en/terms-of-use.html) restrict automated access/reuse without prior written authorization; platform documentation does not override an operator's applicable terms. These require a different authorization basis before promotion, even if a probe returns data.

Likewise, a free account requiring a key does not meet this task's anonymous keyless rail. Do not create accounts or borrow keys to close the numerical gap. Public source repositories, installable packages, broken demos, image generators and duplicate listing labels cannot be turned into additional hosted services merely by assigning them an execution ID.

## Next decision and completion evidence

Continue recovery in bounded batches, starting with the 86 rows that already have free-use evidence, current official spec matches, and the government/transit queues. Add providers from the larger discovery catalog where current official evidence supports them; the original 1,002 rows are insufficient on their own under established identities. Keep the published number equal to the verified inventory throughout.

A service increases the customer-callable count only after all of the following hold:

1. Its canonical identity is distinct from counted aliases, versions, datasets and actions.
2. Current operator docs identify a public keyless read endpoint and the default request is useful and bounded.
3. Applicable terms support the intended free gateway use, with attribution and operator rate limits represented.
4. The upstream responds with valid supported data rather than an HTML page or an embedded API error.
5. A logged-in preview customer successfully executes it through `/v1/execute`, with billing unchanged and first-run behavior preserved.

Approximately 1,000 remains a product target. This investigation establishes a measured gap and concrete recoverable research groups. It neither verifies 1,000 nor establishes that further recovery is impossible.

## Reproduction notes

All numeric analysis was local and read-only. Filter `results` by `cause` from the frozen audit; use `freeVerified` for recorded entitlement evidence and `reviewedRecipe` for manually reviewed endpoint recipes. Match original rows by `(id, trimmed lower-case name)` against embedded `baseline.results`. Apply exported `canonicalGroups` from `scripts/audit-callable.mjs` to that original subset; subtract groups whose every row has `cause=not_hosted_api`. This yields `1002 -> 900 -> 851` for this snapshot.

For generated-spec analysis, inspect `providers[].actions` in `src/registry/generated-providers.json`: public GET means `method === 'GET' && requiresAuth === false`; the no-required-parameter subset additionally rejects path placeholders and any required parameter. Counts deliberately precede entitlement, identity and live-response checks. The government queue is a curated name-based triage list; the transit queue is likewise name-based. Neither is a newly verified capability inventory.
