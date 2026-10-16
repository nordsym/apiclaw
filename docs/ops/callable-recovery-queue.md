# Callable API recovery queue

Updated: 2026-10-16. This is the recovery and qualification snapshot, not the callable manifest or a production deployment report.

The isolated preview now verifies **1,140 distinct free APIs through actual authenticated customer execution**, plus three previously approved managed providers for **1,143 catalogue cards**. This exceeds the 1,000 target without upstream keys. The earlier published checkpoint was 282 free APIs plus three managed providers, 285 total. The full expanded upstream audit qualified 1,154 candidates; eleven native health failures and three further customer timeouts remain discovery. Production is unchanged and PR #60 remains a draft.

Use [the callable audit](callable-audit.md) and [customer verification](callable-customer-verification.md) for per-row results, bounded evidence, scope and environment. These source batches qualified candidates; only their surviving customer-tested canonical products entered the manifest.

## Frozen source-qualified cohorts

These files are frozen inputs used by the completed audit and customer test. Their row totals are **not additive improvements to the checkpoint**: earlier science and mobility recoveries can already be represented there, and final canonical reconciliation or failed checks can reduce enrollment.

| Cohort | Frozen rows | Scope and source file | Primary protocol authority |
| --- | ---: | --- | --- |
| CKAN owner portals | 483 | Public catalog metadata search only, constrained to the reviewed `package_search` pathname. [Recipes](../../src/public-api-recipes-oct16-portals.json). | [CKAN API reference](https://docs.ckan.org/en/latest/api/). Each row separately cites an owner declaration and owner API documentation/adoption or substantive government catalog documentation. |
| Socrata owner catalogs | 108 | Public catalog metadata only, exact `/api/views/metadata/v1`. [Recipes](../../src/public-api-recipes-oct16-socrata.json). | [Metadata API](https://dev.socrata.com/docs/other/metadata) and [official metadata specification](https://dev.socrata.com/apis/metadata.yaml). Owner-specific public catalog sources remain necessary. |
| OpenDataSoft owner catalogs | 138 | Public catalog metadata listing/search only, exact `/api/explore/v2.1/catalog/datasets`. [Recipes](../../src/public-api-recipes-oct16-opendatasoft.json). | [Explore v2.1 documentation](https://help.opendatasoft.com/apis/ods-explore-v2/) explicitly distinguishes anonymous public portals from private catalogs and extended authenticated quotas. Each recipe cites its owner's public/open catalog declaration. |
| Dataverse owner repositories | 108 | Published repository metadata search only, exact `/api/search`. No downloads or unpublished/private content. [Recipes](../../src/public-api-recipes-oct16-dataverse.json). | [Dataverse Search API](https://guides.dataverse.org/en/stable/api/search.html). Owner repository/library/about sources identify the independently operated public service. |
| Scientific services, first batch | 17 | Distinct hosted scientific APIs with bounded public reads and resource-specific evidence. [Recipes](../../src/public-api-recipes-oct16-science.json). | Resource-owner documentation and rights sources in each recipe; [EMBL-EBI licensing](https://www.ebi.ac.uk/licencing/) preserves individual data-owner conditions. |
| Scientific services, additional batch | 9 | Additional independent hosted products, including EMPIAR, Cellosaurus, JASPAR, Alliance, Complex Portal, WoRMS, LIPID MAPS, Rhea and STRING. [Recipes](../../src/public-api-recipes-oct16-science-extra.json). | Each recipe's primary documentation and free-access evidence. Product identity, client identification and source attribution remain resource-specific. |
| Mobility | 11 | Independent operator products; reviewed GBFS scheme/operator metadata capability. [Recipes](../../src/public-api-recipes-oct16-mobility.json). | [MobilityData systems registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv), owner declarations and feed license metadata. No claim of live vehicle availability from a metadata-only probe. |

The four large portal cohorts expand **public metadata catalog access**. They do not establish that every dataset, file, record-query route or commercial data product behind those portals is callable. Discovery descriptions must preserve that distinction.

## How source entitlement is established

Qualification combines evidence rather than treating an HTTP 200 response or a software brand as permission:

1. Identify the actual owner and hosted product from its primary portal, institution, library or service page. Require a substantive public/open catalog or search invitation. Generic vendor templates, directory entries and a guessed owner name are insufficient.
2. Establish documented anonymous access to the selected metadata operation. An owner can adopt the platform's official protocol documentation. A missing per-instance API docstring is not a rejection when substantive owner documentation expressly describes public catalog search and the standard documents the anonymous operation.
3. Apply local-language evidence consistently. For example, Thai government catalog documentation describing metadata/Directory Services and search/access for public and private-sector users is substantive owner evidence. A label or a license facet on the first dataset is not equivalent.
4. Make a useful, bounded, keyless GET through the shared transport and decoder. Require valid, nonempty metadata rather than an HTML website, empty collection, schema-only response or health check. Use the shared timeout, response-size bound, safe redirects and rate controls.
5. Limit the runtime to the exact reviewed metadata pathname. Public catalog access must not authorize dataset downloads, private resources, datastore queries or arbitrary paths on the same host.
6. Preserve per-asset licensing, attribution, privacy and access restrictions. A free public metadata lookup does not grant a universal right to reuse or resell downstream datasets. These open reads are unbilled; managed paid providers retain their separate billing rules.

A directory can supply candidates and owner links. It cannot supply a verified count or blanket rights for the services it lists. Unknown pricing, explicit commercial restrictions, credentials or unresolved owner identity keep a candidate in discovery.

## Canonical counting and substantive holds

Count one independently operated API product, not datasets, actions, versions, alternate representations or mirror domains. Shared platform software alone does not make different institutions one owner. Conversely, multiple hostnames alone do not make one owner's thematic catalog views independent products.

The frozen batches apply these boundaries:

- OpenDataSoft aliases, development/qualification environments, Grand Paris Sud and other thematic subportals were withheld where independent product identity was not established. ATIH aliases and Swiss public transport duplicates were consolidated. DILA publication variants were conservatively grouped under one retained owner catalog. A Bologna owner page was withheld because its apparent open-data evidence was only an email address.
- Dataverse excludes the RODBUK umbrella in addition to its institution repositories, groups DANS Data Stations under one retained service and withholds empty repositories. Separately owned institution repositories require their own owner sources; datasets and collections never add identities.
- Mobility groups Beryl feeds and withholds the additional Marseille/Inurba scheme rather than counting another city deployment of the same enterprise API. The retained scope is metadata; broad availability claims require separate evidence.
- CKAN holds include WPRDC agreement requirements, the non-public Berlin register and unresolved EDX qualification. Dataset license facets and generic CKAN marketing were removed as owner-permission evidence. The [source-qualified recipes](../../src/public-api-recipes-oct16-portals.json) retain only the reviewed narrow operations.
- Socrata removed generic/minimal-owner tenants and held Tennessee Health Data, SANDAG, Carson City and CTHRU where restrictions or insufficient owner declarations prevented qualification. A general website restriction is checked against any specific owner open-data policy rather than silently assumed to govern or exempt the API.
- Openverse remains withheld pending required client credit integration. BMRB's required application header and arXiv's global request-spacing requirement need implemented client behavior before enrollment. OpenAIRE timed out during the bounded probe. Noembed's integration examples did not establish sufficient explicit free-service permission during review.
- Documented noncommercial/commercial restrictions, required keys and other existing source-backed exclusions remain in force. See the exclusion evidence used by [the callable audit](callable-audit.md); an otherwise successful request does not override it.

These holds are specific evidence gaps or constraints. They do not establish that the target is globally impossible, nor that every unresolved endpoint has been exhausted.

## Retained verification requirements and future recovery

The isolated preview retested every retained candidate as an actual newly authenticated customer. Future additions require the same complete customer evidence. Keep before/after billing snapshots equal for free reads, verify the native health checker and confirm that only surviving canonical products appear across the homepage, catalog, docs, skill and catalog API. Preserve first-run and NASA first-call behavior. Failed or disabled services remain discovery even if the upstream probe succeeded.

Native Convex health checks can demote failing services automatically. The scheduled GitHub audit produces review evidence; it does not itself promote candidates or deploy a changed callable list. Final enrollment requires the same source snapshot and approved-ID handshake used by the gateway.

For future additions, prioritize remaining owner-qualified failures with a concrete endpoint, decoder, redirect or response-size correction. Continue primary-source directory recovery without converting software installations, datasets, versions or uncertain rights into count padding. No key signups are needed for the current 1,000 target. Any future credentialed expansion must separately establish accounts, available credentials, commercial terms and actual shared-gateway execution.
