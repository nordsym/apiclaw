# Callable API audit

Checked: 2026-10-16T10:22:43.388Z. Mode: full-sweep. Complete sweep: yes.

**1133 canonical free APIs verified from 2537 candidate/alias rows.** The site separately adds its existing approved managed providers; this sweep makes no managed or credentialed calls. The managed-only `customerExecutableProviderCount` is not the full `totalCallable`. Unknown pricing remains discovery even after HTTP 200.

Customer gateway verification: 2026-10-16T10:49:03.509Z, preview https://abundant-goldfish-47.eu-west-1.convex.site. 1140/1154 authenticated customer calls passed; 14 were demoted. Billing snapshots were identical. 0 newly upstream-verified APIs still await customer gateway verification. Upstream checkedAt/HTTP/latency remain the original upstream evidence; bounded per-row gatewayVerification records the separate customer result.

Catalog arithmetic: 1133 measured free APIs + 3 existing approved managed providers = **1136 catalog-callable APIs**. This keyless audit does not retest paid managed providers. Reaching 1,000 requires 0 additional distinct verified APIs. No additional key signups are needed for the 1,000 target. Remaining wrong endpoints/unresolved services may still provide additional APIs; this is not proof of a global maximum.

Eligibility recheck: On 2026-10-26 the scheduled sweep reported 64 snapshot removals and 19 additions. Independent retries with the shared gateway transport recovered 27 removals, including FakeStoreAPI, Free Dictionary, Open Brewery DB, Ensembl, RNAcentral, ToS;DR, Final Space and several catalogues that had timed out or returned 403/5xx once. Seven endpoints stayed unverified for a stable reason and were demoted: Denpasar open data no longer resolves (ENOTFOUND); UFS, UFPB, eThekwini Edge, La Vega Innova and USACH Dataverse present an expired certificate; Aragón open data fails TLS chain verification (UNABLE_TO_VERIFY_LEAF_SIGNATURE). Timeouts, HTTP 401/403, rate limits and single-run 5xx stays were kept. UUID Generator was kept by approving its www-to-apex redirect. The 19 newly upstream-verified candidates stay out of this manifest until an authenticated customer batch proves them. October 16 customer-gateway receipts remain on demoted rows and do not keep a broken endpoint callable.

Policy: Keyless HTTPS GET only; shared 20-second gateway transport; one retry at most; reviewed redirects only; 256 KiB body; eight workers; at least one second between requests per origin. A callable API needs a valid reviewed response, explicit free evidence and one canonical identity.

Verified scope: 825 counted API products are restricted to their reviewed metadata endpoint paths. Their useful calls search public catalogues or read scheme/operator information. Each independent service is counted once; aliases, datasets, versions and operations do not add extra APIs. Dataset downloads and reuse require separate source entitlements.

CORS is a browser rule and does not block server-to-server gateway execution. HTTP 401/403 alone does not establish a key requirement. Documentation/spec URLs are not hosted API endpoints. HTML, malformed/unsupported responses and oversized bodies do not qualify.

## Baseline and current evidence

Immutable baseline: commit 2ef36ab, 2026-10-15T14:57:51.605Z; 1002 rows, 13 working free APIs (16 site cards after three managed providers). The old advertised ~1,005 figure described eligibility guesses, not successful calls.

| Original outcome | Rows |
| --- | ---: |
| not_json | 469 |
| network_error | 312 |
| http_error | 133 |
| ok_json | 33 |
| auth_required | 26 |
| timeout | 23 |
| rate_limited | 4 |
| duplicate_frankfurter | 1 |
| invalid_response | 1 |

## Original cohort: current evidence

The original cohort has 1002 rows: 13 were verified and **989 originally failed**. 1002 match current evidence by ID and exact normalized name. 182 formerly failing rows now represent independently verified canonical APIs. Current status: 195 verified canonical rows, 109 duplicate rows, 698 discovery rows. These are row counts, not extra APIs per alias.

| Current cause | All original cohort rows | Originally failing rows only |
| --- | ---: | ---: |
| wrong_base_url_path | 348 | 348 |
| ok | 195 | 182 |
| duplicate | 109 | 109 |
| redirect_https | 103 | 103 |
| not_hosted_api | 78 | 78 |
| dead_upstream | 61 | 61 |
| unresolved | 51 | 51 |
| timeout | 22 | 22 |
| gateway_block | 9 | 9 |
| unknown_pricing | 9 | 9 |
| needs_key | 7 | 7 |
| commercial_permission | 6 | 6 |
| rate_limit | 4 | 4 |
| missing_default_params | 0 | 0 |

Cohort matching uses historical ID and exact normalized name, not normalized ID alone. Counts are candidate rows including aliases; expanded candidates are separate. Missing rows are unresolved, not presumed dead or key-required. Current causes do not rewrite original outcomes.

## Expanded sweep: current evidence

The following table covers all 2537 expanded candidate/alias rows. It must not be presented as a breakdown of the original 989 failures. Zeroes are explicit, including missing_default_params when no current response proves that cause.

| Current cause | Expanded rows |
| --- | ---: |
| ok | 1133 |
| wrong_base_url_path | 672 |
| duplicate | 171 |
| redirect_https | 165 |
| not_hosted_api | 115 |
| dead_upstream | 97 |
| unresolved | 82 |
| timeout | 38 |
| gateway_block | 28 |
| needs_key | 11 |
| unknown_pricing | 11 |
| commercial_permission | 10 |
| rate_limit | 4 |
| missing_default_params | 0 |

Previously verified still working or represented by a verified canonical alias: 13/13. Previously verified requiring attention: none. Reused rows: 1672. Unchecked rows: 0.

Baseline preserves the original 1,002-row outcomes. Their old network/403 errors lack sufficient evidence for retrospective key/CORS/root-cause claims. Current rows provide traces and specific causes.

## Re-run

Install dependencies with `npm ci`, then run `node scripts/audit-callable.mjs` (loads the shared TypeScript transport through tsx). First run `node --check scripts/audit-callable.mjs` and `node --test scripts/audit-callable.test.mjs`.

A targeted check uses `--only=frankfurter,nagerdate --output-dir=/tmp/apiclaw-targeted-audit`. Unselected rows retain previous evidence and timestamps when ID and name match; rows without prior evidence stay explicitly unchecked. `--resume` reuses only rows with matching definition hashes. `--checkpoint=/tmp/apiclaw-callable-checkpoint.json` writes bounded progress snapshots for restart with the same option plus `--resume`. A partial check is not a new full-sweep proof; lastFullSweepAt preserves the last full coverage timestamp. The GitHub scheduled audit uploads evidence for review and does not promote or deploy new entries. Separately, the native Convex publicApiHealth.recheck weekly job can automatically demote unhealthy free APIs through the live health overlay. Successful audit additions still require a reviewed manifest refresh and deployment.

## Canonical endpoints repaired and verified

| API | Repaired cause |
| --- | --- |
| anapioficeandfire | wrong_base_url_path |
| aviationweather | wrong_base_url_path, missing_default_params |
| baconipsum | wrong_base_url_path, missing_default_params |
| bankofcanada | wrong_base_url_path, missing_default_params |
| biothings | wrong_base_url_path, missing_default_params |
| brazil | wrong_base_url_path |
| brnnysundregistrene | wrong_base_url_path |
| bundesbankapi | wrong_base_url_path, missing_default_params |
| catasaservice | wrong_base_url_path, missing_default_params |
| cdnjs | wrong_base_url_path, missing_default_params |
| cheapshark | wrong_base_url_path |
| chebi | wrong_base_url_path |
| chesscom | wrong_base_url_path |
| chicagodataportalapi | missing_default_params |
| chileopendataapi | missing_default_params |
| citybikes | missing_default_params |
| citygdask | wrong_base_url_path, missing_default_params |
| cityhelsinki | wrong_base_url_path, missing_default_params |
| citynewyorkopendata | wrong_base_url_path, missing_default_params |
| citytorontoopendata | wrong_base_url_path, missing_default_params |
| clinicaltrialsgov | wrong_base_url_path, missing_default_params |
| codewarsapi | wrong_base_url_path |
| coinlore | wrong_base_url_path |
| colombiaopendataapi | wrong_base_url_path, missing_default_params |
| coloradoinformationmarketplace | missing_default_params |
| countriesgraphql | missing_default_params |
| countryis | wrong_base_url_path |
| crossref | missing_default_params |
| curve | wrong_base_url_path |
| czechnationalbank | wrong_base_url_path |
| danishdataserviceenergi | wrong_base_url_path, missing_default_params |
| datausa | wrong_base_url_path, missing_default_params |
| datamuse | wrong_base_url_path, missing_default_params |
| deckofcardsapi | wrong_base_url_path, missing_default_params |
| defillamaapi | wrong_base_url_path |
| digidates | wrong_base_url_path |
| digimoninformation | wrong_base_url_path |
| digitrafficfinland | wrong_base_url_path |
| disify | wrong_base_url_path |
| disney | wrong_base_url_path, missing_default_params |
| dogceo | wrong_base_url_path |
| drupalorg | wrong_base_url_path, missing_default_params |
| dsbstatisticsdenmark | missing_default_params |
| dungeonsanddragonsalternate | wrong_base_url_path, missing_default_params |
| dutchcbsapi | wrong_base_url_path, missing_default_params |
| ecbapi | wrong_base_url_path, missing_default_params |
| ensembl | wrong_base_url_path, missing_default_params |
| environmentagency | wrong_base_url_path, missing_default_params |
| environmentcanadaapi | wrong_base_url_path, missing_default_params |
| eurostatapi | wrong_base_url_path, missing_default_params |
| fakestoreapi | missing_default_params |
| fbiwanted | wrong_base_url_path, missing_default_params |
| fda | wrong_base_url_path, missing_default_params |
| fedtreasury | wrong_base_url_path, missing_default_params |
| federalregister | wrong_base_url_path, missing_default_params |
| ffxivcollect | wrong_base_url_path |
| finnishmeteorologicalinstitute | wrong_base_url_path, missing_default_params |
| freedictionary | wrong_base_url_path |
| freetogame | wrong_base_url_path, missing_default_params |
| fruityvice | wrong_base_url_path |
| fueleconomygov | wrong_base_url_path |
| gamerpower | wrong_base_url_path, missing_default_params |
| gbif | wrong_base_url_path, missing_default_params |
| genrenator | wrong_base_url_path |
| genshinimpact | wrong_base_url_path |
| geojs | wrong_base_url_path |
| gravatar | wrong_base_url_path |
| harrypotterapi | wrong_base_url_path |
| healthdatagov | missing_default_params |
| hebrewcalendar | wrong_base_url_path, missing_default_params |
| hipsteripsum | missing_default_params |
| hongkongdataapi | wrong_base_url_path, missing_default_params |
| humanproteinatlas | wrong_base_url_path |
| icanhazdadjoke | wrong_base_url_path |
| imgflip | wrong_base_url_path |
| indianmutualfund | wrong_base_url_path |
| ipify | wrong_base_url_path |
| iseven | wrong_base_url_path |
| istanbulibbopendata | missing_default_params |
| jokeapi | wrong_base_url_path, missing_default_params |
| kanyerest | wrong_base_url_path |
| laopendataapi | missing_default_params |
| launchlibrary2 | wrong_base_url_path, missing_default_params |
| lorempicsum | missing_default_params |
| malaysiaopendataapi | wrong_base_url_path, missing_default_params |
| microlinkio | wrong_base_url_path, missing_default_params |
| mmogames | wrong_base_url_path, missing_default_params |
| moroccoopendataapi | wrong_base_url_path, missing_default_params |
| nasaeonet | wrong_base_url_path, missing_default_params |
| nasapowerapi | wrong_base_url_path, missing_default_params |
| nationalvulnerabilitydatabase | wrong_base_url_path, missing_default_params |
| nbppolandapi | missing_default_params |
| nbuukraineapi | wrong_base_url_path, missing_default_params |
| netherlandsdataapi | wrong_base_url_path, missing_default_params |
| nhtsa | wrong_base_url_path, missing_default_params |
| nobelprize | wrong_base_url_path, missing_default_params |
| nppes | wrong_base_url_path, missing_default_params |
| oceanbiogeographic | wrong_base_url_path, missing_default_params |
| onsuk | wrong_base_url_path, missing_default_params |
| openbrewerydb | wrong_base_url_path |
| opendatanhsscotland | missing_default_params |
| openfoodfacts | wrong_base_url_path, missing_default_params |
| opengovernmentaustralia | wrong_base_url_path, missing_default_params |
| opengovernmentdenmark | wrong_base_url_path, missing_default_params |
| opengovernmentfinland | wrong_base_url_path, missing_default_params |
| opengovernmentgermany | wrong_base_url_path, missing_default_params |
| opengovernmentitaly | wrong_base_url_path, missing_default_params |
| opengovernmentpoland | wrong_base_url_path, missing_default_params |
| opengovernmentportugal | wrong_base_url_path, missing_default_params |
| opengovernmentqueenslandgovernment | missing_default_params |
| opengovernmentsingapore | wrong_base_url_path |
| opengovernmentslovenia | missing_default_params |
| opengovernmentsouthaustraliangovernment | wrong_base_url_path, missing_default_params |
| opengovernmentspain | wrong_base_url_path, missing_default_params |
| opengovernmentuk | wrong_base_url_path, missing_default_params |
| opengovernmentvictoriastategovernment | wrong_base_url_path, missing_default_params |
| opengovernmentwestaustralia | wrong_base_url_path, missing_default_params |
| opentopodata | wrong_base_url_path, missing_default_params |
| opentrivia | wrong_base_url_path, missing_default_params |
| openapigenerator | wrong_base_url_path |
| opencitations | wrong_base_url_path |
| opendota | wrong_base_url_path |
| openholidays | wrong_base_url_path, missing_default_params |
| openleiapi | wrong_base_url_path, missing_default_params |
| openligadb | wrong_base_url_path |
| packagist | wrong_base_url_path, missing_default_params |
| postcodesio | wrong_base_url_path |
| postmanecho | wrong_base_url_path, missing_default_params |
| prhfinland | wrong_base_url_path, missing_default_params |
| pubchem | wrong_base_url_path |
| pypi | wrong_base_url_path |
| quotesondesign | wrong_base_url_path, missing_default_params |
| quran | wrong_base_url_path |
| radiobrowser | wrong_base_url_path |
| randomuselessfacts | missing_default_params |
| randomdog | wrong_base_url_path |
| randomduck | wrong_base_url_path |
| randomfox | wrong_base_url_path |
| randomuser | missing_default_params |
| representbyopennorth | missing_default_params |
| riksdagenopendata | missing_default_params |
| rubygems | wrong_base_url_path |
| rxnorm | wrong_base_url_path, missing_default_params |
| scryfall | wrong_base_url_path, missing_default_params |
| secedgar | wrong_base_url_path |
| smhi | wrong_base_url_path |
| spaceflightnews | wrong_base_url_path, missing_default_params |
| squiggle | missing_default_params |
| statisticsfinland | wrong_base_url_path |
| statisticsnorway | wrong_base_url_path, missing_default_params |
| statisticsswedenscb | wrong_base_url_path |
| sunrisesunsetapi | wrong_base_url_path, missing_default_params |
| sunrisesunsetio | wrong_base_url_path, missing_default_params |
| transportforswitzerland | wrong_base_url_path, missing_default_params |
| ukbankholidays | wrong_base_url_path |
| uniprotapi | wrong_base_url_path, missing_default_params |
| usgs | wrong_base_url_path, missing_default_params |
| wgerworkoutmanager | wrong_base_url_path, missing_default_params |
| wikipedia | wrong_base_url_path, missing_default_params |
| wolnelektury | wrong_base_url_path |
| worldbank | wrong_base_url_path, missing_default_params |
| yesno | wrong_base_url_path |
| yugioh | wrong_base_url_path, missing_default_params |
| archiveorg | wrong_base_url_path, missing_default_params |
| artinstituteofchicagoapi | wrong_base_url_path, missing_default_params |
| bobsburgersapi | wrong_base_url_path, missing_default_params |
| cdc | wrong_base_url_path, missing_default_params |
| chemblapi | wrong_base_url_path, missing_default_params |
| currencyapi | wrong_base_url_path |
| diseasesh | wrong_base_url_path, missing_default_params |
| epa | wrong_base_url_path |
| finalspaceapi | wrong_base_url_path |
| geneontologyapi | redirect_https |
| hackernewsapi | wrong_base_url_path |
| healthcaregov | wrong_base_url_path |
| hongkongobervatory | wrong_base_url_path, missing_default_params |
| inspirehepnet | wrong_base_url_path, missing_default_params |
| itis | wrong_base_url_path, missing_default_params |
| lidoprotocolapi | wrong_base_url_path |
| magicthegatheringapi | wrong_base_url_path, missing_default_params |
| medlineplus | wrong_base_url_path, missing_default_params |
| meowfacts | wrong_base_url_path, missing_default_params |
| metropolitanmuseumofart | wrong_base_url_path |
| nasaexoplanetarchive | wrong_base_url_path, missing_default_params |
| networkcalc | wrong_base_url_path, missing_default_params |
| npmregistry | wrong_base_url_path |
| opengovernmentcanada | wrong_base_url_path, missing_default_params |
| opengovernmentireland | wrong_base_url_path, missing_default_params |
| opengovernmentromania | redirect_https, missing_default_params |
| opengovernmentswitzerland | wrong_base_url_path, missing_default_params |
| openlibrary | wrong_base_url_path, missing_default_params |
| openscienceframework | wrong_base_url_path, missing_default_params |
| openwhyd | wrong_base_url_path, missing_default_params |
| orcaprotocolapi | wrong_base_url_path, missing_default_params |
| poetrydb | wrong_base_url_path |
| postalpincode | wrong_base_url_path |
| purgomalum | redirect_https, missing_default_params |
| raydiumprotocolapi | wrong_base_url_path |
| razorpayifsc | wrong_base_url_path |
| refugerestrooms | wrong_base_url_path, missing_default_params |
| ronswansonquotes | wrong_base_url_path |
| spanishineapi | wrong_base_url_path |
| stapi | wrong_base_url_path, missing_default_params |
| statcanstatistics | wrong_base_url_path |
| tcgdex | wrong_base_url_path |
| tosdrapi | wrong_base_url_path, missing_default_params |
| transportforbelgium | wrong_base_url_path, missing_default_params |
| transportforgrenoblefrance | wrong_base_url_path, missing_default_params |
| transportforspain | wrong_base_url_path, missing_default_params |
| tvmaze | wrong_base_url_path |
| ukcarbonintensity | wrong_base_url_path |
| ukparliamentapi | wrong_base_url_path, missing_default_params |
| ukpolice | wrong_base_url_path |
| universalis | wrong_base_url_path |
| usweather | wrong_base_url_path |
| uuidgenerator | wrong_base_url_path |
| vatcomply | wrong_base_url_path, missing_default_params |
| wandbox | wrong_base_url_path |
| whatthecommit | wrong_base_url_path |
| yearnfinanceprotocolapi | wrong_base_url_path |
| zippopotamus | wrong_base_url_path |
| arbetsfrmedlingenapi | missing_default_params |
| bluesky | missing_default_params |
| devtoapi | missing_default_params |
| huggingfacehubapi | missing_default_params |
| inaturalistapi | missing_default_params |
| norwegiancentralbank | missing_default_params |
| datagouvfr | missing_default_params |
| opengovernmentluxembourg | missing_default_params |
| opengovernmentnewsouthwales | missing_default_params |
| austriancentralbank | missing_default_params |
| europepmc | missing_default_params |
| dataciteapi | missing_default_params |
| wikidata | missing_default_params |
| zenodo | missing_default_params |
| figshare | missing_default_params |
| bitbucket | missing_default_params |
| stackexchange | missing_default_params |
| linodepublic | missing_default_params |
| biosamples | missing_default_params |
| doaj | missing_default_params |
| biomodels | missing_default_params |
| cellosaurus | missing_default_params |
| jaspar | missing_default_params |
| rhea | missing_default_params |
| stringdb | missing_default_params |
| ckan-data-ontario-ca | missing_default_params |
| ckan-donneesquebec-ca | missing_default_params |
| ckan-donnees-montreal-ca | missing_default_params |
| ckan-catalogue-data-gov-bc-ca | missing_default_params |
| ckan-data-boston-gov | missing_default_params |
| ckan-opendata-schleswig-holstein-de | missing_default_params |
| ckan-offenedaten-aachen-de | missing_default_params |
| ckan-datosabiertos-malaga-eu | missing_default_params |
| ckan-data-malangkota-go-id | missing_default_params |
| ckan-data-jatengprov-go-id | missing_default_params |
| ckan-data-gov-gr | missing_default_params |
| ckan-gdcatalog-go-th | missing_default_params |
| ckan-data-cnra-ca-gov | missing_default_params |
| ckan-data-e-gov-go-jp | missing_default_params |
| ckan-data-kaltimprov-go-id | missing_default_params |
| ckan-opendata-kebumenkab-go-id | missing_default_params |
| ckan-data-batangkab-go-id | missing_default_params |
| ckan-data-ca-gov | missing_default_params |
| ckan-catalogo-datosabiertos-gob-pe | missing_default_params |
| ckan-dadosabertos-bcb-gov-br | missing_default_params |
| ckan-satudata-kapuaskab-go-id | missing_default_params |
| ckan-data-acehprov-go-id | missing_default_params |
| ckan-data-sukoharjokab-go-id | missing_default_params |
| ckan-opendata-rsadhyatma-jatengprov-go-id | missing_default_params |
| ckan-opendata-magelangkab-go-id | missing_default_params |
| ckan-data-purworejokab-go-id | missing_default_params |
| ckan-opendata-bcb-gov-br | missing_default_params |
| ckan-data-tegalkab-go-id | missing_default_params |
| ckan-gifu-opendata-pref-gifu-lg-jp | missing_default_params |
| ckan-opendata-brebeskab-go-id | missing_default_params |
| ckan-data-gov-lv | missing_default_params |
| ckan-data-salatiga-go-id | missing_default_params |
| ckan-datacatalogue-gov-ie | missing_default_params |
| ckan-data-lhokseumawekota-go-id | missing_default_params |
| ckan-data-kendalkab-go-id | missing_default_params |
| ckan-data-gov-kg | missing_default_params |
| ckan-opendata-malinau-go-id | missing_default_params |
| ckan-opendata-klaten-go-id | missing_default_params |
| ckan-phichit-gdcatalog-go-th | missing_default_params |
| ckan-data-balikpapan-go-id | missing_default_params |
| ckan-admin-opendatani-gov-uk | missing_default_params |
| ckan-satudata-landakkab-go-id | missing_default_params |
| ckan-datos-gob-do | missing_default_params |
| ckan-data-nt-gov-au | missing_default_params |
| ckan-dataset-jogjakota-go-id | missing_default_params |
| ckan-opendata-hawaii-gov | missing_default_params |
| ckan-data-gov-me | missing_default_params |
| ckan-data-simeuluekab-go-id | missing_default_params |
| ckan-data-grobogan-go-id | missing_default_params |
| ckan-data-acehtimurkab-go-id | missing_default_params |
| ckan-data-beltim-go-id | missing_default_params |
| ckan-data-mahakamulukab-go-id | missing_default_params |
| ckan-ckan-sampangkab-go-id | missing_default_params |
| ckan-phitsanulok-gdcatalog-go-th | missing_default_params |
| ckan-data-acehbaratkab-go-id | missing_default_params |
| ckan-sisaket-gdcatalog-go-th | missing_default_params |
| ckan-surin-gdcatalog-go-th | missing_default_params |
| ckan-data-city-yokohama-lg-jp | missing_default_params |
| ckan-satudata-kendarikota-go-id | missing_default_params |
| ckan-lopburi-gdcatalog-go-th | missing_default_params |
| ckan-nakhonratchasima-gdcatalog-go-th | missing_default_params |
| ckan-opendata-samarindakota-go-id | missing_default_params |
| ckan-datagov-mot-go-th | missing_default_params |
| ckan-mahasarakham-gdcatalog-go-th | missing_default_params |
| ckan-dados-ciga-sc-gov-br | missing_default_params |
| ckan-data-pidiekab-go-id | missing_default_params |
| ckan-tak-gdcatalog-go-th | missing_default_params |
| ckan-khonkaen-gdcatalog-go-th | missing_default_params |
| ckan-data-stat-pref-miyazaki-lg-jp | missing_default_params |
| ckan-dados-es-gov-br | missing_default_params |
| ckan-sisada-pematangsiantar-go-id | missing_default_params |
| ckan-chiangmai-gdcatalog-go-th | missing_default_params |
| ckan-opendata-penghu-gov-tw | missing_default_params |
| ckan-opendata-bolmongkab-go-id | missing_default_params |
| ckan-data-chhs-ca-gov | missing_default_params |
| ckan-buengkan-gdcatalog-go-th | missing_default_params |
| ckan-dados-prefeitura-sp-gov-br | missing_default_params |
| ckan-kanchanaburi-gdcatalog-go-th | missing_default_params |
| ckan-suphanburi-gdcatalog-go-th | missing_default_params |
| ckan-sakonnakhon-gdcatalog-go-th | missing_default_params |
| ckan-opendata-housing-gov-ie | missing_default_params |
| ckan-data-treasury-ri-gov | missing_default_params |
| ckan-nongbualamphu-gdcatalog-go-th | missing_default_params |
| ckan-saraburi-gdcatalog-go-th | missing_default_params |
| ckan-satudata-padang-go-id | missing_default_params |
| ckan-dadosabertos-sp-gov-br | missing_default_params |
| ckan-dadosabertos-go-gov-br | missing_default_params |
| ckan-uttaradit-gdcatalog-go-th | missing_default_params |
| ckan-satudata-dharmasrayakab-go-id | missing_default_params |
| ckan-lampang-gdcatalog-go-th | missing_default_params |
| ckan-samutsongkhram-gdcatalog-go-th | missing_default_params |
| ckan-nakhonpathom-gdcatalog-go-th | missing_default_params |
| ckan-suratthani-gdcatalog-go-th | missing_default_params |
| ckan-chachoengsao-gdcatalog-go-th | missing_default_params |
| ckan-kalasin-gdcatalog-go-th | missing_default_params |
| ckan-sukhothai-gdcatalog-go-th | missing_default_params |
| ckan-maehongson-gdcatalog-go-th | missing_default_params |
| ckan-narathiwat-gdcatalog-go-th | missing_default_params |
| ckan-data-ok-gov | missing_default_params |
| ckan-datos-slp-gob-mx | missing_default_params |
| ckan-yasothon-gdcatalog-go-th | missing_default_params |
| ckan-prachuapkhirikhan-gdcatalog-go-th | missing_default_params |
| ckan-krabi-gdcatalog-go-th | missing_default_params |
| ckan-chonburi-gdcatalog-go-th | missing_default_params |
| ckan-ubonratchathani-gdcatalog-go-th | missing_default_params |
| ckan-datos-veracruzmunicipio-gob-mx | missing_default_params |
| ckan-sakaeo-gdcatalog-go-th | missing_default_params |
| ckan-pathumthani-gdcatalog-go-th | missing_default_params |
| ckan-chiangrai-gdcatalog-go-th | missing_default_params |
| ckan-amnatcharoen-gdcatalog-go-th | missing_default_params |
| ckan-singburi-gdcatalog-go-th | missing_default_params |
| ckan-lamphun-gdcatalog-go-th | missing_default_params |
| ckan-trat-gdcatalog-go-th | missing_default_params |
| ckan-chanthaburi-gdcatalog-go-th | missing_default_params |
| ckan-nongkhai-gdcatalog-go-th | missing_default_params |
| ckan-uthaithani-gdcatalog-go-th | missing_default_params |
| ckan-phayao-gdcatalog-go-th | missing_default_params |
| ckan-chaiyaphum-gdcatalog-go-th | missing_default_params |
| ckan-kamphaengphet-gdcatalog-go-th | missing_default_params |
| ckan-pattani-gdcatalog-go-th | missing_default_params |
| ckan-nonthaburi-gdcatalog-go-th | missing_default_params |
| ckan-chumphon-gdcatalog-go-th | missing_default_params |
| ckan-phetchaburi-gdcatalog-go-th | missing_default_params |
| ckan-chainat-gdcatalog-go-th | missing_default_params |
| ckan-ranong-gdcatalog-go-th | missing_default_params |
| ckan-loei-gdcatalog-go-th | missing_default_params |
| ckan-satun-gdcatalog-go-th | missing_default_params |
| ckan-buriram-gdcatalog-go-th | missing_default_params |
| ckan-datosabiertos-mercedes-gob-ar | missing_default_params |
| ckan-phetchabun-gdcatalog-go-th | missing_default_params |
| ckan-phrae-gdcatalog-go-th | missing_default_params |
| ckan-samutprakan-gdcatalog-go-th | missing_default_params |
| ckan-data-sabangkota-go-id | missing_default_params |
| ckan-nakhonphanom-gdcatalog-go-th | missing_default_params |
| ckan-phranakhonsiayutthaya-gdcatalog-go-th | missing_default_params |
| ckan-phatthalung-gdcatalog-go-th | missing_default_params |
| ckan-trang-gdcatalog-go-th | missing_default_params |
| ckan-data-acehbaratdayakab-go-id | missing_default_params |
| ckan-yala-gdcatalog-go-th | missing_default_params |
| ckan-nakhonsithammarat-gdcatalog-go-th | missing_default_params |
| ckan-songkhla-gdcatalog-go-th | missing_default_params |
| ckan-samutsakhon-gdcatalog-go-th | missing_default_params |
| ckan-nakhonnayok-gdcatalog-go-th | missing_default_params |
| ckan-opendata-thanhhoa-gov-vn | missing_default_params |
| ckan-ckan-pref-akita-lg-jp | missing_default_params |
| ckan-rayong-gdcatalog-go-th | missing_default_params |
| ckan-data-pidiejayakab-go-id | missing_default_params |
| ckan-opendata-slavuta-mvk-gov-ua | missing_default_params |
| ckan-phuket-gdcatalog-go-th | missing_default_params |
| ckan-nan-gdcatalog-go-th | missing_default_params |
| ckan-udonthani-gdcatalog-go-th | missing_default_params |
| ckan-opendata-transport-nsw-gov-au | missing_default_params |
| ckan-mukdahan-gdcatalog-go-th | missing_default_params |
| ckan-datos-estadistica-ec-gba-gov-ar | missing_default_params |
| ckan-datos-bahia-gob-ar | missing_default_params |
| ckan-gdcatalog-energy-go-th | missing_default_params |
| ckan-data-pesisirselatankab-go-id | missing_default_params |
| ckan-catalog-oae-go-th | missing_default_params |
| ckan-datosabiertos-mendoza-gov-ar | missing_default_params |
| ckan-satudata-acehutara-go-id | missing_default_params |
| ckan-data-acehjayakab-go-id | missing_default_params |
| ckan-data-milwaukee-gov | missing_default_params |
| ckan-ckan-ciudaddemendoza-gob-ar | missing_default_params |
| ckan-data-sanjoseca-gov | missing_default_params |
| ckan-data-sanantonio-gov | missing_default_params |
| ckan-data-lutskrada-gov-ua | missing_default_params |
| ckan-portal-data-kemenkum-go-id | missing_default_params |
| ckan-data-manggaraikab-go-id | missing_default_params |
| ckan-sdi-palukota-go-id | missing_default_params |
| ckan-data-sugarlandtx-gov | missing_default_params |
| ckan-gdcatalog-dft-go-th | missing_default_params |
| ckan-opdt-city-toyama-lg-jp | missing_default_params |
| ckan-catalogodatos-nl-gob-mx | missing_default_params |
| ckan-opendata-nikaia-rentis-gov-gr | missing_default_params |
| ckan-opendata-gov-je | missing_default_params |
| ckan-catalog-city-kobe-lg-jp | missing_default_params |
| ckan-opendata-cifs-go-th | missing_default_params |
| ckan-dados-sc-gov-br | missing_default_params |
| ckan-catalogo-datos-gba-gob-ar | missing_default_params |
| ckan-data-houstontx-gov | missing_default_params |
| ckan-dados-mg-gov-br | missing_default_params |
| ckan-dados-mogidascruzes-sp-gov-br | missing_default_params |
| ckan-data-santamonica-gov | missing_default_params |
| ckan-opendata-obec-go-th | missing_default_params |
| ckan-datos-ciudaddecorrientes-gov-ar | missing_default_params |
| ckan-satudata-solokkab-go-id | missing_default_params |
| ckan-dataportal-opdc-go-th | missing_default_params |
| ckan-datos-jus-gob-ar | missing_default_params |
| ckan-dados-florestal-gov-br | missing_default_params |
| ckan-dadosabertos-tce-go-gov-br | missing_default_params |
| ckan-datacatalog-bde-go-th | missing_default_params |
| ckan-opendata-agriculture-gov-ie | missing_default_params |
| ckan-dados-transportes-gov-br | missing_default_params |
| ckan-dados-turismo-gov-br | missing_default_params |
| ckan-dados-cvm-gov-br | missing_default_params |
| ckan-data-payakumbuhkota-go-id | missing_default_params |
| ckan-data-mhesi-go-th | missing_default_params |
| ckan-datosabiertos-valledelcauca-gov-co | missing_default_params |
| ckan-dadosabertos-bndes-gov-br | missing_default_params |
| ckan-satudata-palembang-go-id | missing_default_params |
| ckan-dadosabertos-urbis-prefeitura-sp-gov-br | missing_default_params |
| ckan-gdc-dtam-moph-go-th | missing_default_params |
| ckan-datos-cnbs-gob-hn | missing_default_params |
| ckan-dadosabertos-inss-gov-br | missing_default_params |
| ckan-data-dss-go-th | missing_default_params |
| ckan-opendata-dla-go-th | missing_default_params |
| ckan-satudata-dpd-go-id | missing_default_params |
| ckan-opendata-tampa-gov | missing_default_params |
| ckan-catalog-royalrain-go-th | missing_default_params |
| ckan-data-acehbesarkab-go-id | missing_default_params |
| ckan-datos-acumar-gob-ar | missing_default_params |
| ckan-indicepa-gov-it | missing_default_params |
| ckan-datos-abiertos-venadotuerto-gob-ar | missing_default_params |
| ckan-dadosabertos-mt-gov-br | missing_default_params |
| ckan-opendata-dsd-go-th | missing_default_params |
| ckan-opendata-sbcountyatc-gov | missing_default_params |
| ckan-datosabiertos-mspas-gob-gt | missing_default_params |
| ckan-datos-legislaturaneuquen-gob-ar | missing_default_params |
| ckan-datosretc-mma-gob-cl | missing_default_params |
| ckan-data-se-df-gov-br | missing_default_params |
| ckan-datos-tsjbaires-gov-ar | missing_default_params |
| ckan-data-rd-go-th | missing_default_params |
| ckan-datos-yvera-gob-ar | missing_default_params |
| ckan-datos-misiones-gob-ar | missing_default_params |
| ckan-ckan-dsi-go-th | missing_default_params |
| ckan-dados-agricultura-gov-br | missing_default_params |
| ckan-opendata-ercolano-cultura-gov-it | missing_default_params |
| ckan-datos-conred-gob-gt | missing_default_params |
| ckan-catalog-parliament-go-th | missing_default_params |
| ckan-catalog-data-faa-gov | missing_default_params |
| ckan-ndotdata-nebraska-gov | missing_default_params |
| ckan-datosabiertos-muniguarco-go-cr | missing_default_params |
| ckan-data-city-sumoto-lg-jp | missing_default_params |
| ckan-data-malevizi-gov-gr | missing_default_params |
| ckan-transparencia-enargas-gob-ar | missing_default_params |
| ckan-data-nbco-gov-ie | missing_default_params |
| ckan-datasets-datos-mincyt-gob-ar | missing_default_params |
| ckan-opendata-vin-gov-ua | missing_default_params |
| ckan-suche-transparenz-hamburg-de | missing_default_params |
| ckan-data-amerigeoss-org | missing_default_params |
| ckan-procurdat-de | missing_default_params |
| ckan-donnees-iriu-ca | missing_default_params |
| ckan-data-opendevelopmentmekong-net | missing_default_params |
| ckan-dati-toscana-it | missing_default_params |
| ckan-data-apps-fao-org | missing_default_params |
| ckan-open-nrw | missing_default_params |
| ckan-datamx-io | missing_default_params |
| ckan-opendata-maggioli-cloud | missing_default_params |
| ckan-cryptodata-center | missing_default_params |
| ckan-dati-emilia-romagna-it | missing_default_params |
| ckan-ecosystem-ckan-org | missing_default_params |
| ckan-kozadatportal-hu | missing_default_params |
| ckan-opendata-nhsbsa-net | missing_default_params |
| ckan-detroitdata-org | missing_default_params |
| ckan-ckan-odp-jig-jp | missing_default_params |
| ckan-opendata-com-pk | missing_default_params |
| ckan-datacatalog-tusla-ie | missing_default_params |
| ckan-data-skeenasalmon-info | missing_default_params |
| ckan-data-yorkopendata-org | missing_default_params |
| ckan-dadesobertes-gva-es | missing_default_params |
| ckan-offenesdatenportal-de | missing_default_params |
| ckan-datosabiertos-regiondemurcia-es | missing_default_params |
| ckan-data-stadt-zuerich-ch | missing_default_params |
| ckan-data-smartdublin-ie | missing_default_params |
| ckan-data-civis-bz-it | missing_default_params |
| ckan-data-ingv-it | missing_default_params |
| ckan-juntadeandalucia-es | missing_default_params |
| ckan-data-opendata-am | missing_default_params |
| ckan-catalog-opendata-pref-kanagawa-jp | missing_default_params |
| ckan-data-gmob-ca | missing_default_params |
| ckan-opendata-city-minato-tokyo-jp | missing_default_params |
| ckan-dati-comune-lecce-it | missing_default_params |
| ckan-opendata-cityofathens-gr | missing_default_params |
| ckan-opendata-nasu-opendatastack-jp | missing_default_params |
| ckan-ballaratopendata-org-au | missing_default_params |
| ckan-data-cbwaterhub-ca | missing_default_params |
| ckan-ckan-hoda-jp | missing_default_params |
| ckan-opendata-eawag-ch | missing_default_params |
| ckan-openga-giustizia-amministrativa-it | missing_default_params |
| ckan-opendata-leipzig-de | missing_default_params |
| ckan-opencom-no | missing_default_params |
| ckan-opendata-gov-nt-ca | missing_default_params |
| ckan-opendata-muenchen-de | missing_default_params |
| ckan-catalog-data-city-kanazawa-ishikawa-jp | missing_default_params |
| ckan-veri-sakarya-bel-tr | missing_default_params |
| ckan-catalog-dataplatform-yamanashi-jp | missing_default_params |
| ckan-datos-um-es | missing_default_params |
| ckan-opendata-vlci-valencia-es | missing_default_params |
| ckan-catalog-city-utsunomiya-tochigi-jp | missing_default_params |
| ckan-datos-icane-es | missing_default_params |
| ckan-ckan-tirana-al | missing_default_params |
| ckan-acikveri-bizizmir-com | missing_default_params |
| ckan-opendata-comune-re-it | missing_default_params |
| ckan-doi-nioz-nl | missing_default_params |
| ckan-acikveri-konya-bel-tr | missing_default_params |
| ckan-justicehub-in | missing_default_params |
| ckan-opendata-readi-de | missing_default_params |
| ckan-data-zagreb-hr | missing_default_params |
| ckan-datalatih-siat-web-id | missing_default_params |
| ckan-dadosabertos-tse-jus-br | missing_default_params |
| ckan-opendataprijedor-ba | missing_default_params |
| ckan-oeirasinterativa-oeiras-pt | missing_default_params |
| ckan-opendata-sitcan-es | missing_default_params |
| ckan-plymouth-thedata-place | missing_default_params |
| ckan-rdm-inesctec-pt | missing_default_params |
| ckan-opendata-city-imizu-toyama-jp | missing_default_params |
| ckan-opendata-ual-es | missing_default_params |
| ckan-data-wu-ac-at | missing_default_params |
| ckan-acikveri-kadikoy-bel-tr | missing_default_params |
| ckan-ckan-montevideo-gub-uy | missing_default_params |
| ckan-transparenz-karlsruhe-de | missing_default_params |
| ckan-mobidata-bw-de | missing_default_params |
| ckan-phoenixopendata-com | missing_default_params |
| ckan-donostia-eus | missing_default_params |
| ckan-opendata-city-machida-tokyo-jp | missing_default_params |
| ckan-data-hub-geosphere-at | missing_default_params |
| ckan-ckan-urbanedatenplattform-potsdam-de | missing_default_params |
| ckan-dati-regione-liguria-it | missing_default_params |
| ckan-opendata-comune-messina-it | missing_default_params |
| ckan-datosabiertos-dip-badajoz-es | missing_default_params |
| ckan-opendata-euroinfosicilia-it | missing_default_params |
| ckan-opendata-uniba-it | missing_default_params |
| ckan-opendata-olpe-de | missing_default_params |
| ckan-santacruzdetenerife-es | missing_default_params |
| ckan-data-ncku-edu-tw | missing_default_params |
| ckan-bochum-opendata-ruhr | missing_default_params |
| ckan-data-ctb-eus | missing_default_params |
| ckan-upvtransparent-upv-es | missing_default_params |
| ckan-ckan-indiadataportal-com | missing_default_params |
| ckan-veri-tuzla-bel-tr | missing_default_params |
| ckan-data-openstate-eu | missing_default_params |
| ckan-opendata-sjgov-org | missing_default_params |
| ckan-dadosabertos-cimvdl-pt | missing_default_params |
| ckan-corona-open-data-ckan-de | missing_default_params |
| ckan-data-harvestportal-org | missing_default_params |
| ckan-data-wto-org | missing_default_params |
| ckan-datacatalog-limerick-ie | missing_default_params |
| ckan-ckan-sabasi-io | missing_default_params |
| ckan-data-kildarecoco-ie | missing_default_params |
| ckan-data-neolaiacampus-eu | missing_default_params |
| ckan-catalog-data-patras-gr | missing_default_params |
| ckan-opendata-mea-or-th | missing_default_params |
| ckan-opendata-comune-rimini-it | missing_default_params |
| ckan-opendata-hu | missing_default_params |
| ckan-data-thaihealth-or-th | missing_default_params |
| ckan-ckan-puertosdetenerife-org | missing_default_params |
| ckan-dadosabertos-cm-porto-pt | missing_default_params |
| ckan-datosabiertos-infocdmx-org-mx | missing_default_params |
| ckan-opendata-ugr-es | missing_default_params |
| ckan-dados-unb-br | missing_default_params |
| ckan-opendata-ncse-ie | missing_default_params |
| ckan-klimakonform-dmp-geo-tu-dresden-de | missing_default_params |
| ckan-repo-dainst-org | missing_default_params |
| ckan-dados-ibict-br | missing_default_params |
| ckan-dadosabertos-poa-br | missing_default_params |
| ckan-lcrdigitalcommons-com | missing_default_params |
| ckan-data-city-fukuyama-hiroshima-jp | missing_default_params |
| ckan-ckan-mmhk-cz | missing_default_params |
| ckan-dados-ufv-br | missing_default_params |
| ckan-dados-ufrb-edu-br | missing_default_params |
| ckan-opendata-hsri-or-th | missing_default_params |
| ckan-datosabiertos-aytosanlorenzo-es | missing_default_params |
| ckan-acikyesil-bursa-bel-tr | missing_default_params |
| ckan-data-waterpathogens-org | missing_default_params |
| ckan-dadosabertos-ifal-edu-br | missing_default_params |
| ckan-opendata-oepnv-de | missing_default_params |
| ckan-opendatabozp-cz | missing_default_params |
| ckan-dados-ufvjm-edu-br | missing_default_params |
| ckan-datasets-wri-org | missing_default_params |
| ckan-catalog-growthfund-gr | missing_default_params |
| ckan-opendata-ayto-alcaladehenares-es | missing_default_params |
| ckan-traffic4cyprus-org-cy | missing_default_params |
| ckan-opendata-greifswald-de | missing_default_params |
| ckan-opendata-kreis-guetersloh-de | missing_default_params |
| ckan-hardmin-heal-link-gr | missing_default_params |
| ckan-dati-arpacampania-it | missing_default_params |
| ckan-open-data-ble-de | missing_default_params |
| ckan-dati-comune-napoli-it | missing_default_params |
| ckan-opendata-gistda-or-th | missing_default_params |
| ckan-opendata-mzv-sk | missing_default_params |
| ckan-data-corkcity-ie | missing_default_params |
| ckan-opendata-comuni-nemea-cloud | missing_default_params |
| ckan-dados-ufg-br | missing_default_params |
| ckan-data-cityofdenton-com | missing_default_params |
| ckan-opendata-alcoi-org | missing_default_params |
| ckan-opendata-gera-de | missing_default_params |
| ckan-open-scayle-es | missing_default_params |
| ckan-dados-cefet-rj-br | missing_default_params |
| ckan-datos-chduero-es | missing_default_params |
| ckan-dados-ifrr-edu-br | missing_default_params |
| ckan-open-data-musterstadt-ckan-de | missing_default_params |
| ckan-centroservizi-opendata-arionline-cloud | missing_default_params |
| ckan-dados-uffs-edu-br | missing_default_params |
| ckan-data-tokyo-omy-w-jp | missing_default_params |
| ckan-datahub-openscience-eu | missing_default_params |
| ckan-dados-ifro-edu-br | missing_default_params |
| ckan-opendatacomunideimessapi-it | missing_default_params |
| ckan-gdcatalog-codi-or-th | missing_default_params |
| ckan-dati-enea-it | missing_default_params |
| ckan-dados-ufca-edu-br | missing_default_params |
| ckan-data-waarismijnstemlokaal-nl | missing_default_params |
| ckan-catalog-zoothailand-org | missing_default_params |
| ckan-opendata-comune-forli-fc-it | missing_default_params |
| ckan-vital-healthdata-org | missing_default_params |
| ckan-dati-consip-it | missing_default_params |
| ckan-dados-ufpe-br | missing_default_params |
| ckan-geodata-sandviken-se | missing_default_params |
| ckan-dati-comune-catanzaro-it | missing_default_params |
| ckan-opendata-univaq-it | missing_default_params |
| ckan-dati-comune-copertino-le-it | missing_default_params |
| ckan-espaidedades-dadess-cat | missing_default_params |
| ckan-dados-ifsc-edu-br | missing_default_params |
| ckan-dadosabertos-ufdpar-edu-br | missing_default_params |
| ckan-aspal-opendata-consulmedia-it | missing_default_params |
| ckan-dadosabertos-ufersa-edu-br | missing_default_params |
| ckan-dados-ifpb-edu-br | missing_default_params |
| ckan-opendata-kaaw-de | missing_default_params |
| ckan-opendata-vag-de | missing_default_params |
| ckan-datos-arsat-com-ar | missing_default_params |
| ckan-data-genderdatalab-org | missing_default_params |
| ckan-opendata-chalandri-gr | missing_default_params |
| ckan-dados-iff-edu-br | missing_default_params |
| ckan-dados-ufpa-br | missing_default_params |
| ckan-data-agglo-royan-fr | missing_default_params |
| ckan-opendata-depa-or-th | missing_default_params |
| ckan-opendata-asmenet-it | missing_default_params |
| ckan-dados-ifrn-edu-br | missing_default_params |
| ckan-dati-adspmam-it | missing_default_params |
| ckan-datosabiertos-puertollano-es | missing_default_params |
| ckan-opendata-mwa-co-th | missing_default_params |
| ckan-data-svk-se | missing_default_params |
| ckan-ckan-nishiawakura-mulabo-jp | missing_default_params |
| ckan-dados-ufscar-br | missing_default_params |
| ckan-opendata-upplandsvasby-se | missing_default_params |
| ckan-opendata-unifg-it | missing_default_params |
| ckan-nwgpdataportal-ca | missing_default_params |
| ckan-dati-port-taranto-it | missing_default_params |
| ckan-data-housingagency-ie | missing_default_params |
| ckan-opendata-constitutionalcourt-or-th | missing_default_params |
| ckan-dados-emel-pt | missing_default_params |
| ckan-datos-usinatandil-com-ar | missing_default_params |
| ckan-datosabiertos-lastorresdecotillas-es | missing_default_params |
| ckan-opendata-hameln-pyrmont-de | missing_default_params |
| ckan-dati-sian-it | missing_default_params |
| ckan-data-mait-ai-in-th | missing_default_params |
| ckan-danube-data-eu | missing_default_params |
| ckan-data-tsri-or-th | missing_default_params |
| ckan-acikveri-uskudar-bel-tr | missing_default_params |
| ckan-ladamas-laimburg-it | missing_default_params |
| ckan-datosabiertos-elhierro-es | missing_default_params |
| ckan-opendata-aiguesmanresa-cat | missing_default_params |
| ckan-opendata-cmu-ac-th | missing_default_params |
| ckan-dados-ufes-br | missing_default_params |
| ckan-dados-ifto-edu-br | missing_default_params |
| ckan-opendata-engelholm-se | missing_default_params |
| ckan-opendata-nu-ac-th | missing_default_params |
| ckan-opendata-cro-ie | missing_default_params |
| ckan-data-kalamazoocity-org | missing_default_params |
| ckan-dados-lncc-br | missing_default_params |
| ckan-opendata-bastad-se | missing_default_params |
| ckan-dados-esposende-pt | missing_default_params |
| ckan-opendata-tkpark-or-th | missing_default_params |
| seattleopendata | missing_default_params |
| austinopendata | missing_default_params |
| calgaryopendata | missing_default_params |
| edmontonopendata | missing_default_params |
| winnipegopendata | missing_default_params |
| marylandopendata | missing_default_params |
| newyorkstateopendata | missing_default_params |
| vermontopendata | missing_default_params |
| connecticutopendata | missing_default_params |
| washingtonstateopendata | missing_default_params |
| oregonopendata | missing_default_params |
| pennsylvaniaopendata | missing_default_params |
| newjerseyopendata | missing_default_params |
| missouriopendata | missing_default_params |
| michiganopendata | missing_default_params |
| montgomerycountymarylandopendata | missing_default_params |
| kingcountyopendata | missing_default_params |
| sanfranciscoopendata | missing_default_params |
| princegeorgescountyopendata | missing_default_params |
| sonomacountyopendata | missing_default_params |
| fultoncountygeorgiaopendata | missing_default_params |
| sanmateocountyopendata | missing_default_params |
| honoluluopendata | missing_default_params |
| dallasopendata | missing_default_params |
| neworleansopendata | missing_default_params |
| batonrougeopendata | missing_default_params |
| kansascitymissouriopendata | missing_default_params |
| cincinnatiopendata | missing_default_params |
| buffaloopendata | missing_default_params |
| mesaopendata | missing_default_params |
| providenceopendata | missing_default_params |
| somervilleopendata | missing_default_params |
| cambridgemassachusettsopendata | missing_default_params |
| norfolkopendata | missing_default_params |
| richmondvirginiaopendata | missing_default_params |
| novascotiaopendata | missing_default_params |
| santaclaracountyopendata | missing_default_params |
| oaklandopendata | missing_default_params |
| marincountyopendata | missing_default_params |
| piercecountyopendata | missing_default_params |
| riversidecountyopendata | missing_default_params |
| howardcountymarylandopendata | missing_default_params |
| transportationdepartmentopendata | missing_default_params |
| cataloniaopendataapi | missing_default_params |
| regionelombardiaopendata | missing_default_params |
| clermontcountyopendataapi | missing_default_params |
| macoupincountyopendataapi | missing_default_params |
| cookcountyopendatacatalogapi | missing_default_params |
| everettopendataportalapi | missing_default_params |
| auburnopendataapi | missing_default_params |
| puertoricoelectoralcomptrolleropendataapi | missing_default_params |
| fiscalfocuspittsburghapi | missing_default_params |
| readingpennsylvaniaopendataapi | missing_default_params |
| zerofatalitiesnvopendataapi | missing_default_params |
| newjerseyhealthdataapi | missing_default_params |
| richmondcaliforniaopendataapi | missing_default_params |
| opennassauapi | missing_default_params |
| hawaiicampaignspendingcommissiondataapi | missing_default_params |
| healthdatanyapi | missing_default_params |
| stateofhawaiidepartmentoftransportationapi | missing_default_params |
| montgomerycountypublicschoolsdatacatalogapi | missing_default_params |
| cityofbloomingtonopendataportalapi | missing_default_params |
| queenannescountyopendataapi | missing_default_params |
| fortlauderdalepoliceopendataapi | missing_default_params |
| cityoforlandoopendataportalapi | missing_default_params |
| cityofdubuqueopendataapi | missing_default_params |
| gainesvilleopendataapi | missing_default_params |
| cityofwesthollywoodopendatacatalogapi | missing_default_params |
| encinitasdatainsightsapi | missing_default_params |
| rosevilleopendataapi | missing_default_params |
| morenovalleyopendataapi | missing_default_params |
| coronaopenperformanceapi | missing_default_params |
| modestocityviewapi | missing_default_params |
| santamonicasustainablecityplanapi | missing_default_params |
| californiastatecontrolleropendataapi | missing_default_params |
| stocktoncitydatacatalogapi | missing_default_params |
| napacountyhhsaopendataportalapi | missing_default_params |
| sandiegocountydataportalapi | missing_default_params |
| bayareametroopendataapi | missing_default_params |
| townofparkeropendataapi | missing_default_params |
| mesquitetexasopendataportalapi | missing_default_params |
| collegestationopendataapi | missing_default_params |
| williamsoncentralappraisaldistrictopendataapi | missing_default_params |
| fccopendataapi | missing_default_params |
| nationallibraryofmedicineopendataapi | missing_default_params |
| usacopendataapi | missing_default_params |
| americorpsopendataapi | missing_default_params |
| townofmountpleasantopendataapi | missing_default_params |
| massachusettseducationtocareerresearchanddatahubapi | missing_default_params |
| framinghamopendataapi | missing_default_params |
| impactstlcoapi | missing_default_params |
| springfieldopendataapi | missing_default_params |
| mississippimedicalcannabisprogramdataportalapi | missing_default_params |
| johnscreekpolicedepartmentapi | missing_default_params |
| cityofalpharettaopendataapi | missing_default_params |
| metropolitanairportscommissionopendataapi | missing_default_params |
| ramseycountyminnesotaopendataapi | missing_default_params |
| mischooldataopendataportalapi | missing_default_params |
| opendatanewbrunswickapi | missing_default_params |
| friuliveneziagiuliaopendataapi | missing_default_params |
| novascotiapropertyvaluationopendataapi | missing_default_params |
| australiancapitalterritoryopendataapi | missing_default_params |
| camdenopendataportalapi | missing_default_params |
| rdwopenmobilitydataapi | missing_default_params |
| cohesionopendataapi | missing_default_params |
| odscatalogaixenprovenceopendatasoftcom | missing_default_params |
| odscataloganalisisdatosabiertosjcyles | missing_default_params |
| odscataloganruopendataopendatasoftcom | missing_default_params |
| odscatalogaresdigitalwalloniaopendatasoftcom | missing_default_params |
| odscatalogarpaeopendatasoftcom | missing_default_params |
| odscatalogbasedocdiplomatiegouvfr | missing_default_params |
| odscatalogbpceopendatasoftcom | missing_default_params |
| odscatalogcachanopendatasoftcom | missing_default_params |
| odscatalogcadentgasopendatasoftcom | missing_default_params |
| odscatalogccphvaopendatasoftcom | missing_default_params |
| odscatalogcityofsalinasopendatasoftcom | missing_default_params |
| odscatalogdadesobertesfgccat | missing_default_params |
| odscatalogdata82amenagementfr | missing_default_params |
| odscatalogdataaidedeveloppementgouvfr | missing_default_params |
| odscatalogdataampmetropolefr | missing_default_params |
| odscatalogdataangersfr | missing_default_params |
| odscatalogdataanrfr | missing_default_params |
| odscatalogdataautonomiecnsafr | missing_default_params |
| odscatalogdatabepbe | missing_default_params |
| odscatalogdatabloisagglopolysfr | missing_default_params |
| odscatalogdatabourgesplusfr | missing_default_params |
| odscatalogdatabretagnebzh | missing_default_params |
| odscatalogdatabrisbaneqldgovau | missing_default_params |
| odscatalogdatabruggebe | missing_default_params |
| odscatalogdatacamdennswgovau | missing_default_params |
| odscatalogdatacampbelltownnswgovau | missing_default_params |
| odscatalogdatacapatlantiquefr | missing_default_params |
| odscatalogdataccegfr | missing_default_params |
| odscatalogdatachateaurouxmetropolefr | missing_default_params |
| odscatalogdatadarestravailemploigouvfr | missing_default_params |
| odscatalogdatadepartement41fr | missing_default_params |
| odscatalogdataeconomiegouvfr | missing_default_params |
| odscatalogdataeducationgouvfr | missing_default_params |
| odscatalogdataenseignementsuprecherchegouvfr | missing_default_params |
| odscatalogdataessentielatihsantefr | missing_default_params |
| odscatalogdataeurelienfr | missing_default_params |
| odscatalogdatafairfieldcitynswgovau | missing_default_params |
| odscatalogdatafleurysurornefr | missing_default_params |
| odscatalogdatagersfr | missing_default_params |
| odscatalogdatagouvnc | missing_default_params |
| odscatalogdatagrandparisgrandestfr | missing_default_params |
| odscatalogdatahautegaronnefr | missing_default_params |
| odscatalogdatahawkesburynswgovau | missing_default_params |
| odscatalogdataidelisfr | missing_default_params |
| odscatalogdatailedefrancefr | missing_default_params |
| odscatalogdatailedefrancemobilitesfr | missing_default_params |
| odscatalogdatajerseycitynjgov | missing_default_params |
| odscatalogdatalamayennefr | missing_default_params |
| odscatalogdatalarochesuryonfr | missing_default_params |
| odscatalogdatale64fr | missing_default_params |
| odscatalogdataleicestergovuk | missing_default_params |
| odscatalogdataliverpoolnswgovau | missing_default_params |
| odscatalogdataloireatlantiquefr | missing_default_params |
| odscatalogdatamaineetloirefr | missing_default_params |
| odscatalogdatamaugescommunautefr | missing_default_params |
| odscatalogdatamelbournevicgovau | missing_default_params |
| odscatalogdatamulhousealsacefr | missing_default_params |
| odscatalogdatanamurbe | missing_default_params |
| odscatalogdatanantesmetropolefr | missing_default_params |
| odscatalogdatanimesmetropolefr | missing_default_params |
| odscatalogdataoevinfoch | missing_default_params |
| odscatalogdataorleansmetropolefr | missing_default_params |
| odscatalogdatapaysdelaloirefr | missing_default_params |
| odscatalogdataratpfr | missing_default_params |
| odscatalogdataregionreunioncom | missing_default_params |
| odscatalogdatarennesmetropolefr | missing_default_params |
| odscatalogdatarotterdamnl | missing_default_params |
| odscatalogdatasaintnazaireagglofr | missing_default_params |
| odscatalogdatasarthefr | missing_default_params |
| odscatalogdataseinesaintdenisfr | missing_default_params |
| odscatalogdatasicovalfr | missing_default_params |
| odscatalogdatasourcekapsarcorg | missing_default_params |
| odscatalogdatasportsgouvfr | missing_default_params |
| odscatalogdatastadgent | missing_default_params |
| odscatalogdatastmaloagglomerationfr | missing_default_params |
| odscatalogdatastrasbourgeu | missing_default_params |
| odscatalogdatatcore | missing_default_params |
| odscatalogdatate44fr | missing_default_params |
| odscatalogdatateopaysdelaloirefr | missing_default_params |
| odscatalogdatatgch | missing_default_params |
| odscatalogdatatoulousemetropolefr | missing_default_params |
| odscatalogdatatownofcaryorg | missing_default_params |
| odscatalogdataunedicorg | missing_default_params |
| odscatalogdatavendeefr | missing_default_params |
| odscatalogdatawpcouncilsnswgovau | missing_default_params |
| odscatalogdatosabiertosdipcases | missing_default_params |
| odscatalogdenhaagopendataopendatasoftcom | missing_default_params |
| odscatalogdonneeshydroquebeccom | missing_default_params |
| odscataloggpseoopendatasoftcom | missing_default_params |
| odscatalogleforemdigitalwalloniaopendatasoftcom | missing_default_params |
| odscatalogmannheimopendatasoftcom | missing_default_params |
| odscatalognienetworksopendatasoftcom | missing_default_params |
| odscatalognihropendatasoftcom | missing_default_params |
| odscatalogodreopendatasoftcom | missing_default_params |
| odscatalogopendataaudefr | missing_default_params |
| odscatalogopendataaveyronfr | missing_default_params |
| odscatalogopendatabrusselsbe | missing_default_params |
| odscatalogopendatacangtfr | missing_default_params |
| odscatalogopendataclermontmetropoleeu | missing_default_params |
| odscatalogopendatadatainfogreffefr | missing_default_params |
| odscatalogopendatadortmundde | missing_default_params |
| odscatalogopendataeliabe | missing_default_params |
| odscatalogopendatafluviusbe | missing_default_params |
| odscatalogopendatafrch | missing_default_params |
| odscatalogopendatagrdffr | missing_default_params |
| odscatalogopendatahapyfr | missing_default_params |
| odscatalogopendatahautsdeseinefr | missing_default_params |
| odscatalogopendatainfrabelbe | missing_default_params |
| odscatalogopendataiserefr | missing_default_params |
| odscatalogopendataliegebe | missing_default_params |
| odscatalogopendatanoisylegrandfr | missing_default_params |
| odscatalogopendataportphillipvicgovau | missing_default_params |
| odscatalogopendatarcrcgovsa | missing_default_params |
| odscatalogopendatarheinkreisneussde | missing_default_params |
| odscatalogopendatasaemesfr | missing_default_params |
| odscatalogopendatasoregiesfr | missing_default_params |
| odscatalogopendatastbgov | missing_default_params |
| odscatalogopendatatownofmorrisvilleorg | missing_default_params |
| odscatalogopendatatpgch | missing_default_params |
| odscatalogopendataumease | missing_default_params |
| odscatalogopendatavancouverca | missing_default_params |
| odscatalogopendatawestofenglandcagovuk | missing_default_params |
| odscatalogopendatawewisvlaanderenbe | missing_default_params |
| odscatalogopendatawuerzburgde | missing_default_params |
| odscatalogopenurssaffr | missing_default_params |
| odscatalogressourcesdatasncfcom | missing_default_params |
| odscatalogsaintlouisaggloopendatasoftcom | missing_default_params |
| odscatalogsedifopendatasoftcom | missing_default_params |
| odscatalogspenergynetworksopendatasoftcom | missing_default_params |
| odscatalogssentransmissionopendatasoftcom | missing_default_params |
| odscatalogwebstatbanquefrancefr | missing_default_params |
| odscatalogwwwbodaccfr | missing_default_params |
| odscatalogwwwdatagovbh | missing_default_params |
| odscatalogwwwezybwbe | missing_default_params |
| odscatalogwwwheraultdatafr | missing_default_params |
| odscatalogwwwodwbbe | missing_default_params |
| odscatalogwwwopendata56fr | missing_default_params |
| odscatalogwwwopendatapaysbasquefr | missing_default_params |
| adpsloveniansocialsciencedataarchivessearchapi | missing_default_params |
| acssdataversesearchapi | missing_default_params |
| arpresearchdatasearchapi | missing_default_params |
| asulibraryresearchdatarepositorysearchapi | missing_default_params |
| arcadadossearchapi | missing_default_params |
| aussdadataversesearchapi | missing_default_params |
| bonndatasearchapi | missing_default_params |
| borealissearchapi | missing_default_params |
| biodataptdatamanagementportaldmportalsearchapi | missing_default_params |
| bscdataversesearchapi | missing_default_params |
| brindataversesearchapi | missing_default_params |
| cesaresearchdatasearchapi | missing_default_params |
| cbpfresearchdatasearchapi | missing_default_params |
| cedapdadossearchapi | missing_default_params |
| cidacssearchapi | missing_default_params |
| crossdasearchapi | missing_default_params |
| csdadataversesearchapi | missing_default_params |
| danebadawczeuwsearchapi | missing_default_params |
| dadosipbsearchapi | missing_default_params |
| daresearchapi | missing_default_params |
| darussearchapi | missing_default_params |
| dartmouthdataversesearchapi | missing_default_params |
| datasudssearchapi | missing_default_params |
| datasciencesposearchapi | missing_default_params |
| datadoisearchapi | missing_default_params |
| dataportalingpanplsearchapi | missing_default_params |
| datapbsearchapi | missing_default_params |
| dataverseecienciadatossearchapi | missing_default_params |
| dataverselvsearchapi | missing_default_params |
| dataversenlsearchapi | missing_default_params |
| dataversenosearchapi | missing_default_params |
| dataverseuasearchapi | missing_default_params |
| datospararesilienciasearchapi | missing_default_params |
| deicdataversesearchapi | missing_default_params |
| dunassearchapi | missing_default_params |
| floridainternationaluniversityresearchdataportalsearchapi | missing_default_params |
| georgemasonuniversitydataversesearchapi | missing_default_params |
| gttingenresearchonlinesearchapi | missing_default_params |
| harvarddataversesearchapi | missing_default_params |
| heidatasearchapi | missing_default_params |
| idscdataversesearchapi | missing_default_params |
| ibictresearchdatasearchapi | missing_default_params |
| indatasearchapi | missing_default_params |
| instituteofrussianliteraturedataversesearchapi | missing_default_params |
| internationalpotatocentersearchapi | missing_default_params |
| ioerdatasearchapi | missing_default_params |
| issdadataversesearchapi | missing_default_params |
| ipgpresearchcollectionsearchapi | missing_default_params |
| iitdataversesearchapi | missing_default_params |
| jlichdatasearchapi | missing_default_params |
| keendatamanagementplatformsearchapi | missing_default_params |
| kuleuvenrdrsearchapi | missing_default_params |
| lithuaniandataarchiveforsocialsciencesandhumanitieslidasearchapi | missing_default_params |
| jplopenrepositorysearchapi | missing_default_params |
| libradatasearchapi | missing_default_params |
| lorelistopenrepositorysearchapi | missing_default_params |
| mblwhoilibrarydataversesearchapi | missing_default_params |
| meldatasearchapi | missing_default_params |
| ministeriodelasculturaslasartesylossaberessearchapi | missing_default_params |
| niedatarepositorysearchapi | missing_default_params |
| nycudataversesearchapi | missing_default_params |
| odisseiportalsearchapi | missing_default_params |
| opendatauclouvainsearchapi | missing_default_params |
| osnadatasearchapi | missing_default_params |
| openforestdatasearchapi | missing_default_params |
| papyrussearchapi | missing_default_params |
| polendatahubsearchapi | missing_default_params |
| polyuresearchdatarepositorysearchapi | missing_default_params |
| pontificiauniversidadcatolicadelperuresearchdatasearchapi | missing_default_params |
| recherchedatagouvsearchapi | missing_default_params |
| qdrmaincollectionsearchapi | missing_default_params |
| repodsearchapi | missing_default_params |
| repositoriodedatosabiertosdeinvestigacinredatasearchapi | missing_default_params |
| repositoriodedatosdeinvestigacindelauniversidaddechilesearchapi | missing_default_params |
| repositoriodedatosdeinvestigacindelauniversidadnacionaldelaplatasearchapi | missing_default_params |
| repositoriodedatosdelauniversidaddelpacficodatasetsupsearchapi | missing_default_params |
| repositoriodedatosdelauniversidaddeconcepcinsearchapi | missing_default_params |
| repositoriodedatospontificiauniversidadjaverianasearchapi | missing_default_params |
| repositoriodedatosuniversidaddistritalfranciscojosdecaldassearchapi | missing_default_params |
| repositoriotecdatossearchapi | missing_default_params |
| repostoriosoildatasearchapi | missing_default_params |
| universityofthenationaleducationcommissionresearchdatasearchapi | missing_default_params |
| rodbukaghsearchapi | missing_default_params |
| rodbukpksearchapi | missing_default_params |
| rodbukueksearchapi | missing_default_params |
| rodbukujsearchapi | missing_default_params |
| rsudataversesearchapi | missing_default_params |
| sanoresearchdatasearchapi | missing_default_params |
| sodhasearchapi | missing_default_params |
| tecnolgicodemonterreydatahubsearchapi | missing_default_params |
| thehenrykniewodniczaskiinstituteofnuclearphysicspolishacademyofsciencessearchapi | missing_default_params |
| trr170dbsearchapi | missing_default_params |
| tudodatasearchapi | missing_default_params |
| ucberkeleylibrarydataversesearchapi | missing_default_params |
| uddataversesearchapi | missing_default_params |
| uligeopendatarepositorysearchapi | missing_default_params |
| unblibrariesdataversesearchapi | missing_default_params |
| universityofphysicalculturekrakowresearchdatasearchapi | missing_default_params |
| universitcafoscariveneziadatarepositorysearchapi | missing_default_params |
| universityofwroclawresearchdatasearchapi | missing_default_params |
| universityofmilanresearchdatasearchapi | missing_default_params |
| vttisearchapi | missing_default_params |
| yaledataversesearchapi | missing_default_params |
| wyomingdatarepositorysearchapi | missing_default_params |

## Full results and sources

Per-hop redirects/retries, original baseline outcomes and bounded error-cause chains are in [the JSON evidence](callable-audit.json). No credentials or upstream response bodies are stored.

| API / canonical ID | Tested GET | HTTP | Cause / outcome | Free evidence | Latency ms | Result |
| --- | --- | ---: | --- | --- | ---: | --- |
| 0x / 0x | - | 0 | needs_key / reviewed_exclusion | unknown | 0 | discovery |
| 0x API / 0x | - | 0 | duplicate / duplicate | unknown | - | discovery |
| 1Forge.com / 1forgecom | - | 0 | needs_key / reviewed_exclusion | unknown | 0 | discovery |
| 1inch / 1inch | - | 0 | needs_key / reviewed_exclusion | unknown | 0 | discovery |
| 24 Pull Requests / 24pullrequests | [GET](https://24pullrequests.com/api/) | 406 | unresolved / http_error | unknown | 1100 | discovery |
| A-Frame / aframe | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| ABS Statistics / absstatistics | [GET](https://api.data.abs.gov.au/) | 0 | dead_upstream / network_error | unknown | 587 | discovery |
| adresse.data.gouv.fr / adressedatagouvfr | [GET](https://adresse.data.gouv.fr/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1151 | discovery |
| ADS-B Exchange / adsbexchange | [GET](https://www.adsbexchange.com/data/) | 301 | redirect_https / redirect_not_approved | unknown | 1119 | discovery |
| Advice Slip API / adviceslipapi | [GET](https://api.adviceslip.com/advice) | 200 | ok / ok_json | [free](https://api.adviceslip.com/) | 846 | callable |
| Age of Empires II / ageofempiresii | [GET](https://age-of-empires-2-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 1164 | discovery |
| Agify / agify | [GET](https://agify.io/) | 406 | unresolved / http_error | unknown | 1271 | discovery |
| Agify.io / agify | [GET](https://agify.io/) | 406 | duplicate / duplicate | unknown | - | discovery |
| Airtel IP / airtelip | [GET](https://sys.airtel.lv/ip2country/1.1.1.1/?full=true) | 200 | unresolved / invalid_response | unknown | 456 | discovery |
| AllStar / allstar | [GET](https://openssf.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 456 | discovery |
| Altinn / altinn | [GET](https://altinn.no/api/) | 301 | redirect_https / redirect_not_approved | unknown | 179 | discovery |
| AmiiboAPI / amiiboapi | [GET](https://amiiboapi.com/api/amiibo?name=mario) | 404 | dead_upstream / http_error | [free](https://amiiboapi.com/docs/) | 758 | discovery |
| An API of Ice and Fire / anapioficeandfire | [GET](https://anapioficeandfire.com/api/books/1) | 200 | ok / ok_json | [free](https://anapioficeandfire.com/Documentation) | 130 | callable |
| AnimeNewsNetwork / animenewsnetwork | [GET](https://www.animenewsnetwork.com/encyclopedia/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1362 | discovery |
| Anki / anki | [GET](https://apps.ankiweb.net/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://apps.ankiweb.net) | 978 | discovery |
| Anki API / ankiapi | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| AnonFiles / anonfiles | [GET](https://anonfiles.com/docs/api/) | 0 | dead_upstream / network_error | unknown | 781 | discovery |
| Anytype / anytype | [GET](https://anytype.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1224 | discovery |
| API Grátis / apigrtis | [GET](https://apigratis.com.br/) | 429 | rate_limit / rate_limited | unknown | 1235 | discovery |
| API Setu / apisetu | [GET](https://www.apisetu.gov.in/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2696 | discovery |
| ApicAgent / apicagent | [GET](https://www.apicagent.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1473 | discovery |
| apilayer screenshotlayer / apilayerscreenshotlayer | [GET](https://screenshotlayer.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1182 | discovery |
| APiX / apix | [GET](https://www.apix.cn/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2081 | discovery |
| Apoteket / apoteket | [GET](https://www.apoteket.se/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 733 | discovery |
| AppFlowy / appflowy | [GET](https://appflowy.io/) | 301 | redirect_https / redirect_not_approved | unknown | 214 | discovery |
| Appium API / appiumapi | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| arcsecond.io / arcsecondio | [GET](https://api.arcsecond.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 548 | discovery |
| Argentina Open Data API / argentinaopendataapi-9c9e04f3 | [GET](https://datos.gob.ar/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://datos.gob.ar) | 16008 | discovery |
| arXiv / arxiv | [GET](https://arxiv.org/help/api/user-manual/) | 301 | redirect_https / redirect_not_approved | unknown | 125 | discovery |
| Atlantis / atlantis | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Atom / atom | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Australia Data API / australiadataapi-4658e2bd | [GET](https://data.gov.au/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gov.au) | 177 | discovery |
| Australia Government API / australiagovernmentapi | [GET](https://data.gov.au/data/api/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 1955 | discovery |
| Australian Bureau of Statistics / australianbureauofstatistics | [GET](https://abs.gov.au/) | 301 | redirect_https / redirect_not_approved | unknown | 431 | discovery |
| Australian Open Data / australiadataapi-4658e2bd | [GET](https://data.gov.au/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Auth.js / authjs | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Automerge / automerge | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Aviationstack / aviationstack | [GET](https://aviationstack.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 842 | discovery |
| AviationWeather / aviationweather | [GET](https://aviationweather.gov/api/data/metar?ids=KJFK&format=json) | 200 | ok / ok_json | [free](https://www.weather.gov/disclaimer) | 282 | callable |
| Axolotl / axolotl | [GET](https://theaxolotlapi.netlify.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 868 | discovery |
| Axolotl API / axolotl | [GET](https://theaxolotlapi.netlify.app/) | 200 | duplicate / duplicate | unknown | - | discovery |
| aztro / aztro | [GET](https://aztro.sameerkumar.website/) | 404 | wrong_base_url_path / http_error | unknown | 521 | discovery |
| Babylon.js / babylonjs | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Backstage / backstage | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Bacon Ipsum / baconipsum | [GET](https://baconipsum.com/api/?type=all-meat&sentences=1) | 200 | ok / ok_json | [free](https://baconipsum.com/json-api/) | 491 | callable |
| BaconMockup / baconmockup | [GET](https://baconmockup.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 635 | discovery |
| Banca d'Italia / bancaditalia | [GET](https://www.bancaditalia.it/statistiche/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1127 | discovery |
| Banco Central Brazil / bancocentralbrazil | [GET](https://dadosabertos.bcb.gov.br/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2569 | discovery |
| Bandsintown / bandsintown | [GET](https://app.swaggerhub.com/apis/Bandsintown/PublicAPI/3.0.0/) | 404 | wrong_base_url_path / http_error | unknown | 499 | discovery |
| Bangladesh Open Data API / bangladeshopendataapi | [GET](https://data.gov.bd/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gov.bd) | 1016 | discovery |
| Bank Negara Malaysia Open Data / banknegaramalaysiaopendata | [GET](https://apikijangportal.bnm.gov.my/) | 403 | unresolved / access_denied | unknown | 224 | discovery |
| Bank of Canada / bankofcanada | [GET](https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1) | 200 | ok / ok_json | [free](https://www.bankofcanada.ca/valet-api-how-to/) | 183 | callable |
| Bank of Canada Rates / bankofcanadarates | [GET](https://www.bankofcanada.ca/rates/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1025 | discovery |
| Bank of Israel / bankofisrael | [GET](https://www.boi.org.il/en/DataAndStatistics/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 533 | discovery |
| Bank of Russia / bankofrussia | [GET](https://www.cbr.ru/development/SXML/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 376 | discovery |
| Banque de France / banquedefrance | [GET](https://webstat.banque-france.fr/ws/) | 404 | wrong_base_url_path / http_error | unknown | 890 | discovery |
| Barcode Generator API / barcodegeneratorapi | [GET](https://bwipjs-api.metafloor.com/) | 200 | unresolved / invalid_response | [free](https://bwipjs-api.metafloor.com) | 506 | discovery |
| BayFiles / bayfiles | [GET](https://bayfiles.com/docs/api/) | 0 | dead_upstream / network_error | unknown | 8 | discovery |
| BC Ferries / bcferries | [GET](https://www.bcferriesapi.ca/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 612 | discovery |
| Beeceptor / beeceptor | [GET](https://beeceptor.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 154 | discovery |
| Beeminder / beeminder | [GET](https://www.beeminder.com/api/) | 301 | redirect_https / redirect_not_approved | unknown | 480 | discovery |
| Behance / behance | [GET](https://www.behance.net/dev/api/endpoints/) | 404 | wrong_base_url_path / http_error | unknown | 435 | discovery |
| Bhagavad Gita telugu / bhagavadgitatelugu | [GET](https://gita-api.vercel.app/) | 200 | unresolved / invalid_response | unknown | 285 | discovery |
| Bible / bible | [GET](https://bible-api.com/john+3:16) | 200 | ok / ok_json | [free](https://bible-api.com/) | 525 | callable |
| Bible API / bibleapi | [GET](https://bible-api.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1158 | discovery |
| Bible API 2 / bibleapi | [GET](https://bible-api.com/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Bible API Public / bibleapi | [GET](https://bible-api.com/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Bible JSON API / bibleapi | [GET](https://bible-api.com/) | 200 | duplicate / duplicate | unknown | - | discovery |
| BigML / bigml | [GET](https://bigml.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 299 | discovery |
| Billogram / billogram | [GET](https://billogram.com/api/) | 308 | gateway_block / gateway_block | unknown | 287 | discovery |
| Binlist / binlist | [GET](https://binlist.net/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 242 | discovery |
| BioThings / biothings | [GET](https://mygene.info/v3/gene/1017?fields=symbol,name) | 200 | ok / ok_json | [free](https://mygene.info/terms) | 1462 | callable |
| Biriyani As A Service / biriyaniasaservice | [GET](https://biriyani.anoram.com/) | 503 | dead_upstream / http_error | unknown | 1284 | discovery |
| BitcoinCharts / bitcoincharts | [GET](https://bitcoincharts.com/about/exchanges/) | 0 | timeout / timeout | unknown | 263 | discovery |
| Bitcoincharts API / bitcoinchartsapi | [GET](https://bitcoincharts.com/about/markets-api/) | 0 | timeout / timeout | unknown | 1177 | discovery |
| Block.io / blockio | [GET](https://block.io/) | 302 | redirect_https / redirect_not_approved | unknown | 115 | discovery |
| Blockchain Exchange Rates / blockchainexchangerates | [GET](https://blockchain.info/api/exchange_rates_api/) | 301 | redirect_https / redirect_not_approved | unknown | 152 | discovery |
| BNM Moldova Rates / bnmmoldovarates | [GET](https://bnm.md/en/content/official-exchange-rates/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1913 | discovery |
| Board Game Geek / boardgamegeek | [GET](https://boardgamegeek.com/wiki/page/BGG_XML_API2/) | 403 | unresolved / access_denied | unknown | 215 | discovery |
| Bob's Burgers / bobsburgers | [GET](https://bobs-burgers-api-ui.herokuapp.com/) | 503 | dead_upstream / http_error | unknown | 1146 | discovery |
| Bokio / bokio | [GET](https://www.bokio.se/integrations/) | 404 | wrong_base_url_path / http_error | unknown | 481 | discovery |
| BOM Australia Weather / bomapi | [GET](https://www.bom.gov.au/catalogue/data-feeds.shtml/) | 403 | duplicate / duplicate | unknown | - | discovery |
| Bored / bored | [GET](https://www.boredapi.com/api/activity) | 0 | dead_upstream / network_error | unknown | 140 | discovery |
| BoredAPI / bored | [GET](https://www.boredapi.com/api/activity) | 0 | duplicate / duplicate | unknown | - | discovery |
| Brackets / brackets | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Brazil / brazil | [GET](https://brasilapi.com.br/api/feriados/v1/2026) | 200 | ok / ok_json | [free](https://brasilapi.com.br/docs) | 154 | callable |
| Brazil Central Bank Open Data / bancocentralbrazil | [GET](https://dadosabertos.bcb.gov.br/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Brazil Data API / brazildataapi | [GET](https://dados.gov.br/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 791 | discovery |
| Brazil Open Data API / brazildataapi | [GET](https://dados.gov.br/) | 200 | duplicate / duplicate | [free](https://dados.gov.br) | - | discovery |
| Brazil Receita WS / brazilreceitaws | [GET](https://www.receitaws.com.br/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 895 | discovery |
| Brønnøysundregistrene / brnnysundregistrene | [GET](https://data.brreg.no/enhetsregisteret/api/organisasjonsformer) | 200 | ok / ok_json | [free](https://data.brreg.no/enhetsregisteret/api/docs/index.html) | 435 | callable |
| Brreg / brnnysundregistrene | [GET](https://data.brreg.no/enhetsregisteret/api/organisasjonsformer) | 200 | duplicate / duplicate | [free](https://www.brreg.no/en/use-of-data-from-the-bronnoysund-register-centre/) | - | alias of brnnysundregistrene |
| Buddy CI / buddyci | [GET](https://buddy.works/api/reference/getting-started/overview/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2704 | discovery |
| Bugsnax / bugsnax | [GET](https://www.bugsnaxapi.com/) | 0 | dead_upstream / network_error | unknown | 78 | discovery |
| Bugzilla / bugzilla | [GET](https://wiki.mozilla.org/Bugzilla:REST_API/) | 404 | wrong_base_url_path / http_error | unknown | 587 | discovery |
| Bundesbank API / bundesbankapi | [GET](https://api.statistiken.bundesbank.de/rest/data/BBEX3/D.USD.EUR.BB.AC.000?lastNObservations=1) | 200 | ok / ok_xml | [free](https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.de.html) | 547 | callable |
| Callook.info / callookinfo | [GET](https://callook.info/W1AW/json) | 200 | ok / ok_json | [free](https://callook.info/api_reference.php) | 412 | callable |
| CamScanner / camscanner | [GET](https://dev.camscanner.com/?language=en-us) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1370 | discovery |
| Canada Government API / canadagovernmentapi | [GET](https://open.canada.ca/en/access-our-application-programming-interface-api/) | 301 | redirect_https / redirect_not_approved | unknown | 741 | discovery |
| Canada Open Data API / canadaopendataapi | [GET](https://open.canada.ca/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://open.canada.ca) | 2195 | discovery |
| Canadian Open Data / canadaopendataapi | [GET](https://open.canada.ca/) | 200 | duplicate / duplicate | unknown | - | discovery |
| CapRover / caprover | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Carbon API / carbonapi | [GET](https://carbon.now.sh/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://carbon.now.sh) | 170 | discovery |
| Cat as a Service / catasaservice | [GET](https://cataas.com/api/tags?limit=1) | 200 | ok / ok_json | [free](https://cataas.com/) | 455 | callable |
| Cat Facts API / catfactsapi | [GET](https://catfact.ninja/fact) | 200 | ok / ok_json | [free](https://catfact.ninja/) | 370 | callable |
| Cataas / cataas | [GET](https://cataas.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1028 | discovery |
| Catastro Spain / catastrospain | [GET](https://www.catastro.meh.es/) | 0 | dead_upstream / network_error | unknown | 60 | discovery |
| Catboy / catboy | [GET](https://api.catboys.com/img) | 0 | redirect_https / tls_error | [free](https://catboys.com/api) | 327 | discovery |
| Catboy API / catboyapi | [GET](https://catboys.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 606 | discovery |
| CBE Egypt / cbeegypt | [GET](https://www.cbe.org.eg/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 247 | discovery |
| CBK Kenya / cbkkenya | [GET](https://www.centralbank.go.ke/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 365 | discovery |
| CBN Nigeria / cbnnigeria | [GET](https://www.cbn.gov.ng/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 263 | discovery |
| CBN Nigeria Rates / cbnnigeriarates | [GET](https://www.cbn.gov.ng/rates/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 807 | discovery |
| CBR Russia / cbrrussia | [GET](https://cbr.ru/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 320 | discovery |
| CBR Russia API / cbrrussiaapi | [GET](https://www.cbr.ru/development/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 203 | discovery |
| CBS Netherlands / cbsnetherlands | [GET](https://opendata.cbs.nl/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 174 | discovery |
| CBUAE UAE / cbuaeuae | [GET](https://www.centralbank.ae/) | 301 | redirect_https / redirect_not_approved | unknown | 130 | discovery |
| CDNJS / cdnjs | [GET](https://api.cdnjs.com/libraries/jquery?fields=name,version) | 200 | ok / ok_json | [free](https://cdnjs.com/api) | 252 | callable |
| Central Bank Ireland Data / centralbankirelanddata | [GET](https://data.gov.ie/data/search/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1405 | discovery |
| Chainlink / chainlink | [GET](https://chain.link/developer-resources/) | 301 | redirect_https / redirect_not_approved | unknown | 1230 | discovery |
| Chainpoint / chainpoint | [GET](https://tierion.com/chainpoint/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 768 | discovery |
| Changelogs.md / changelogsmd | [GET](https://changelogs.md/) | 301 | redirect_https / redirect_not_approved | unknown | 650 | discovery |
| CheapShark / cheapshark | [GET](https://www.cheapshark.com/api/1.0/stores) | 200 | ok / ok_json | [free](https://apidocs.cheapshark.com/) | 223 | callable |
| ChEBI / chebi | [GET](https://www.ebi.ac.uk/chebi/backend/api/public/compound/15377/) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/chebi/about) | 509 | callable |
| Chess.com / chesscom | [GET](https://api.chess.com/pub/player/hikaru) | 200 | ok / ok_json | [free](https://www.chess.com/news/view/published-data-api) | 263 | callable |
| Chess.com API / chesscomapi | [GET](https://www.chess.com/news/view/published-data-api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2209 | discovery |
| Chicago Data Portal API / chicagodataportalapi | [GET](https://data.cityofchicago.org/api/views/metadata/v1?limit=1&page=1) | 200 | ok / ok_json | [free](https://www.chicago.gov/city/en/narr/foia/data_disclaimer.html) | 1520 | callable |
| Chile Open Data API / ckan-datos-gob-cl | [GET](https://datos.gob.cl/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.gob.cl/) | 1625 | callable |
| Chinese Text Project / chinesetextproject | [GET](https://ctext.org/tools/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 597 | discovery |
| chucknorris.io / chucknorrisio | [GET](https://api.chucknorris.io/jokes/random) | 200 | ok / ok_json | [free](https://api.chucknorris.io/) | 326 | callable |
| City Bikes / citybikes-121fa4c9 | [GET](https://api.citybik.es/v2/networks?fields=id,name) | 200 | ok / ok_json | [free](https://api.citybik.es/v2/) | 278 | callable |
| City, Berlin / cityberlin | [GET](https://daten.berlin.de/) | 403 | unresolved / access_denied | unknown | 247 | discovery |
| City, Gdańsk / citygdask | [GET](https://ckan.multimediagdansk.pl/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.multimediagdansk.pl/about) | 386 | callable |
| City, Helsinki / cityhelsinki | [GET](https://hri.fi/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://hri.fi/en_gb/terms-and-conditions/) | 504 | callable |
| City, Lviv / citylviv | [GET](https://opendata.city-adm.lviv.ua/) | 403 | unresolved / access_denied | unknown | 270 | discovery |
| City, New York Open Data / citynewyorkopendata | [GET](https://data.cityofnewyork.us/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.cityofnewyork.us/) | 3089 | callable |
| City, Toronto Open Data / citytorontoopendata | [GET](https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://open.toronto.ca/open-data-licence/) | 668 | callable |
| Classify / classify | [GET](https://classify-web.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 645 | discovery |
| ClinicalTrials.gov / clinicaltrialsgov | [GET](https://clinicaltrials.gov/api/v2/studies?pageSize=1&format=json) | 200 | ok / ok_json | [free](https://clinicaltrials.gov/data-api/api) | 294 | callable |
| CNMV Spain / cnmvspain | [GET](https://www.cnmv.es/) | 302 | redirect_https / redirect_not_approved | unknown | 448 | discovery |
| CocktailDB API / cocktaildbapi | [GET](https://www.thecocktaildb.com/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 206 | discovery |
| CocoaPods / cocoapods | - | 0 | commercial_permission / reviewed_exclusion | [free](https://cocoapods.org) | 0 | discovery |
| Codeberg / codeberg | [GET](https://codeberg.org/api/v1/repos/forgejo/forgejo) | 200 | ok / ok_json | [free](https://docs.codeberg.org/getting-started/what-is-codeberg/) | 189 | callable |
| Codeium / codeium | [GET](https://codeium.com/api/) | 301 | redirect_https / redirect_not_approved | unknown | 143 | discovery |
| Codewars API / codewarsapi | [GET](https://www.codewars.com/api/v1/code-challenges/valid-braces) | 200 | ok / ok_json | [free](https://dev.codewars.com/) | 323 | callable |
| Coding / coding | [GET](https://open.coding.net/) | 302 | redirect_https / redirect_not_approved | unknown | 1613 | discovery |
| Coffee / coffee | [GET](https://coffee.alexflipnote.dev/random.json) | 200 | ok / ok_json | [free](https://coffee.alexflipnote.dev/) | 694 | callable |
| Coffee API / coffeeapi | [GET](https://coffee.alexflipnote.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1224 | discovery |
| CoinDesk / coindesk | [GET](https://old.coindesk.com/coindesk-api/) | 0 | dead_upstream / network_error | unknown | 54 | discovery |
| CoinDesk API / coindesk | [GET](https://old.coindesk.com/coindesk-api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Coinlore / coinlore | [GET](https://api.coinlore.net/api/global/) | 200 | ok / ok_json | [free](https://www.coinlore.com/cryptocurrency-data-api) | 119 | callable |
| Coinlore API / coinloreapi | [GET](https://www.coinlore.com/cryptocurrency-data-api/) | 301 | redirect_https / redirect_not_approved | unknown | 209 | discovery |
| Coinpaprika / coinpaprika | [GET](https://api.coinpaprika.com/) | 302 | gateway_block / gateway_block | unknown | 112 | discovery |
| CoinPaprika API / coinpaprika | [GET](https://api.coinpaprika.com/) | 302 | duplicate / duplicate | unknown | - | discovery |
| CollegeScoreCard / collegescorecard | [GET](https://collegescorecard.ed.gov/data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 172 | discovery |
| CollegeScoreCard.ed.gov / collegescorecard | [GET](https://collegescorecard.ed.gov/data/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Colombia Open Data API / colombiaopendataapi | [GET](https://api.us.socrata.com/api/catalog/v1?domains=www.datos.gov.co&limit=1) | 200 | ok / ok_json | [free](https://herramientas.datos.gov.co/terminos) | 856 | callable |
| Color API / colorapi | [GET](https://www.thecolorapi.com/id?hex=0047AB) | 200 | ok / ok_json | [free](https://www.thecolorapi.com/docs) | 548 | callable |
| Colorado Information Marketplace / coloradoinformationmarketplace | [GET](https://data.colorado.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.colorado.gov/) | 2447 | callable |
| Coronavirus / coronavirus | [GET](https://pipedream.com/@pravin/http-api-for-latest-wuhan-coronavirus-data-2019-ncov-p_G6CLVM/readme/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 578 | discovery |
| Corporate BS / corporatebs | [GET](https://corporatebs-generator.sameerkumar.website/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 768 | discovery |
| Cosign / sigstore | [GET](https://sigstore.dev/) | 301 | duplicate / duplicate | unknown | - | discovery |
| CountAPI / countapi | [GET](https://countapi.xyz/) | 0 | dead_upstream / network_error | unknown | 200 | discovery |
| Countly / countly | [GET](https://api.count.ly/reference/) | 404 | wrong_base_url_path / http_error | unknown | 156 | discovery |
| Countries GraphQL / countriesgraphql | [GET](https://countries.trevorblades.com/?query=%7Bcountry(code%3A%22SE%22)%7Bname%7D%7D) | 200 | ok / ok_json | [free](https://github.com/trevorblades/countries) | 150 | callable |
| Country Flags API / countryflagsapi | [GET](https://flagcdn.com/en/codes.json) | 200 | ok / ok_json | [free](https://flagpedia.net/download/api) | 156 | callable |
| Country.is / countryis | [GET](https://api.country.is/8.8.8.8) | 200 | ok / ok_json | [free](https://country.is/) | 218 | callable |
| Covid Tracking Project / covidtrackingproject | [GET](https://covidtracking.com/data/api/version-2/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 416 | discovery |
| Covid-19 Datenhub / covid19datenhub | [GET](https://npgeo-corona-npgeo-de.hub.arcgis.com/) | 404 | wrong_base_url_path / http_error | unknown | 464 | discovery |
| Covid-19 Government Response / covid19governmentresponse | [GET](https://covidtracker.bsg.ox.ac.uk/) | 301 | redirect_https / redirect_not_approved | unknown | 239 | discovery |
| Covid-19 India / covid19india | [GET](https://data.covid19india.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 362 | discovery |
| Covid-19 JHU CSSE / covid19jhucsse | [GET](https://nuttaphat.com/covid19-api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 343 | discovery |
| COVID-19 Tracker Canada / covid19trackercanada | [GET](https://api.covid19tracker.ca/docs/1.0/overview/) | 200 | unresolved / invalid_response | unknown | 685 | discovery |
| COVID-19 Tracker Sri Lanka / covid19trackersrilanka | [GET](https://www.hpb.health.gov.lk/en/api-documentation/) | 0 | redirect_https / tls_error | unknown | 487 | discovery |
| COVID-ID / covidid | [GET](https://data.covid19.go.id/public/api/prov.json/) | 0 | timeout / timeout | unknown | 10041 | discovery |
| Crafatar / crafatar | [GET](https://crafatar.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 198 | discovery |
| Creatomate / creatomate | [GET](https://creatomate.com/docs/api/introduction/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2414 | discovery |
| CrossRef / crossref | [GET](https://api.crossref.org/works?rows=1) | 200 | ok / ok_json | [free](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) | 946 | callable |
| CryptingUp / cryptingup | [GET](https://www.cryptingup.com/apidoc/) | 0 | unresolved / network_error | unknown | 270 | discovery |
| CryptoCompare / cryptocompare | [GET](https://www.cryptocompare.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 332 | discovery |
| Cryptonator / cryptonator | [GET](https://www.cryptonator.com/api/) | 0 | dead_upstream / network_error | unknown | 289 | discovery |
| Cryptonator API / cryptonator | [GET](https://www.cryptonator.com/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| CurrencyScoop.com / currencyscoopcom | [GET](https://currencyscoop.com/) | 301 | redirect_https / redirect_not_approved | unknown | 122 | discovery |
| Cursor / cursor | [GET](https://cursor.sh/) | 308 | redirect_https / redirect_not_approved | freemium | 233 | discovery |
| Curve / curve | [GET](https://api.curve.finance/v1/getETHprice) | 200 | ok / ok_json | [free](https://docs.curve.finance/developer/integration/api/curve-api/) | 488 | callable |
| CVR / cvr | [GET](https://datacvr.virk.dk/) | 403 | unresolved / access_denied | unknown | 96 | discovery |
| CVR API / cvr | [GET](https://datacvr.virk.dk/) | 403 | duplicate / duplicate | [free](https://datacvr.virk.dk) | - | discovery |
| Czech Namedays / czechnamedays | [GET](https://svatky.adresa.info/) | 402 | unresolved / http_error | unknown | 270 | discovery |
| Czech Namedays Calendar / czechnamedays | [GET](https://svatky.adresa.info/) | 402 | duplicate / duplicate | unknown | - | discovery |
| Czech National Bank / czechnationalbank | [GET](https://www.cnb.cz/en/financial_markets/foreign_exchange_market/exchange_rate_fixing/daily.txt) | 200 | ok / ok_text | [free](https://www.cnb.cz/en/privacy-statement-and-disclaimer/disclaimer-copyright/) | 219 | callable |
| Danbooru / danbooru | [GET](https://danbooru.donmai.us/posts?tags=help%3Aapi) | 200 | unresolved / invalid_response | unknown | 291 | discovery |
| Danish data service Energi / danishdataserviceenergi | [GET](https://api.energidataservice.dk/dataset/CO2Emis?start=now-PT15M&limit=1) | 200 | ok / ok_json | [free](https://www.energidataservice.dk/guides/api-guides) | 355 | callable |
| Danish Energi Data / danishenergidata | [GET](https://www.energidataservice.dk/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 367 | discovery |
| Data USA / datausa | [GET](https://api.datausa.io/tesseract/data.jsonrecords?cube=acs_yg_total_population_5&drilldowns=State,Year&measures=Population&include=Year:2023&limit=1,0) | 200 | ok / ok_json | [free](https://datausa.io/about/api/) | 228 | callable |
| data.gov.dk / datagovdk | [GET](https://data.gov.dk/api/) | 404 | wrong_base_url_path / http_error | unknown | 182 | discovery |
| Data.gov.sg / datagovsg | [GET](https://data.gov.sg/developer/) | 302 | redirect_https / redirect_not_approved | unknown | 1062 | discovery |
| data.norge.no / datanorgeno | [GET](https://data.norge.no/api/) | 301 | redirect_https / redirect_not_approved | unknown | 113 | discovery |
| Data.parliament.uk / ukparliamentapi | [GET](https://members-api.parliament.uk/api/Members/Search?skip=0&take=1) | 200 | duplicate / duplicate | [free](https://www.parliament.uk/site-information/copyright-parliament/open-parliament-licence/) | - | alias of ukparliamentapi |
| Dataflow Kit COVID-19 / dataflowkitcovid19 | [GET](https://covid-19.dataflowkit.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 342 | discovery |
| Datamuse / datamuse | [GET](https://api.datamuse.com/words?ml=star&max=1) | 200 | ok / ok_json | [free](https://www.datamuse.com/api/) | 103 | callable |
| Datamuse API / datamuseapi | [GET](https://www.datamuse.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 425 | discovery |
| Datayes / datayes | [GET](https://m.datayes.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1007 | discovery |
| Deck of Cards API / deckofcardsapi | [GET](https://deckofcardsapi.com/api/deck/new/draw/?count=1) | 200 | ok / ok_json | [free](https://deckofcardsapi.com/) | 281 | callable |
| Deepcode / deepcode | [GET](https://www.deepcode.ai/) | 301 | redirect_https / redirect_not_approved | unknown | 647 | discovery |
| DeFiLlama API / defillamaapi | [GET](https://api.llama.fi/v2/chains) | 200 | ok / ok_json | [free](https://api-docs.defillama.com/) | 119 | callable |
| Dendron / dendron | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Destatis API / destatisapi | [GET](https://www-genesis.destatis.de/genesis/online/) | 307 | redirect_https / redirect_not_approved | unknown | 346 | discovery |
| Destatis Germany / destatisgermany | [GET](https://destatis.de/) | 302 | redirect_https / redirect_not_approved | unknown | 138 | discovery |
| Detect Language API / detectlanguageapi | [GET](https://rapidapi.com/BigLobster/api/language-identification-prediction/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 3812 | discovery |
| DevITjobs UK / devitjobsuk | [GET](https://devitjobs.uk/job_feed.xml/) | 200 | gateway_block / body_limit | unknown | 1113 | discovery |
| Devpod / devpod | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| DIBS / dibs | [GET](https://tech.dibspayment.com/) | 0 | dead_upstream / network_error | unknown | 36 | discovery |
| Dicebear Avatars / dicebearavatars | - | 0 | commercial_permission / reviewed_exclusion | unknown | 0 | discovery |
| DigiDates / digidates | [GET](https://digidates.de/api/v1/unixtime) | 200 | ok / ok_json | [free](https://digidates.de/en/) | 189 | callable |
| DigiDates API / digidatesapi | [GET](https://digidates.de/en/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://digidates.de/en) | 1059 | discovery |
| Digimon Information / digimoninformation | [GET](https://digimon-api.vercel.app/api/digimon/name/agumon) | 200 | ok / ok_json | [free](https://digimon-api.vercel.app/) | 322 | callable |
| DigitalOcean Spaces / digitaloceanspaces | [GET](https://www.digitalocean.com/products/spaces/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1179 | discovery |
| DigitalOcean Status / digitaloceanstatus | [GET](https://status.digitalocean.com/api/) | 406 | unresolved / http_error | unknown | 432 | discovery |
| Digitraffic Finland / digitrafficfinland | [GET](https://rata.digitraffic.fi/api/v1/metadata/train-types) | 200 | ok / ok_json | [free](https://www.digitraffic.fi/en/terms-of-service/) | 280 | callable |
| Diigo / diigo | [GET](https://www.diigo.com/api_dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1084 | discovery |
| Dingtalk / dingtalk | [GET](https://open-doc.dingtalk.com/) | 302 | redirect_https / redirect_not_approved | unknown | 933 | discovery |
| Disify / disify | [GET](https://disify.com/api/email/example@example.com) | 200 | ok / ok_json | [free](https://disify.com/) | 313 | callable |
| Disney / disney | [GET](https://api.disneyapi.dev/character?pageSize=1) | 200 | ok / ok_json | [free](https://disneyapi.dev/docs/) | 311 | callable |
| Disney API / disneyapi | [GET](https://disneyapi.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 218 | discovery |
| DMI / dmi | [GET](https://www.dmi.dk/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 189 | discovery |
| Dog CEO / dogceo | [GET](https://dog.ceo/api/breeds/image/random) | 200 | ok / ok_json | [free](https://dog.ceo/dog-api/) | 195 | callable |
| Dogs / dogs | [GET](https://dog.ceo/dog-api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 899 | discovery |
| Dogs API / dogs | [GET](https://dog.ceo/dog-api/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Dokku / dokku | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| DomainDb Info / domaindbinfo | [GET](https://api.domainsdb.info/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 329 | discovery |
| Domainsdb.info / domainsdbinfo | [GET](https://domainsdb.info/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 277 | discovery |
| Domoticz / domoticz | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Driver.js / driverjs | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Drivet URL Shortener / driveturlshortener | [GET](https://wiki.drivet.xyz/en/url-shortener/add-links/) | 302 | redirect_https / redirect_not_approved | unknown | 729 | discovery |
| Drizzle ORM / drizzleorm | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| DropMail / dropmail | [GET](https://dropmail.me/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 393 | discovery |
| Drupal.org / drupalorg | [GET](https://www.drupal.org/api-d7/node.json?type=project_module&limit=1) | 200 | ok / ok_json | [free](https://www.drupal.org/about/licensing) | 950 | callable |
| DSB Statistics Denmark / dsbstatisticsdenmark | [GET](https://api.statbank.dk/v1/subjects?lang=en&format=JSON) | 200 | ok / ok_json | [free](https://api.statbank.dk/console) | 211 | callable |
| DuckDuckGo / duckduckgo | [GET](https://duckduckgo.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1210 | discovery |
| Ducks Unlimited / ducksunlimited | [GET](https://gis.ducks.org/datasets/du-university-chapters/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 809 | discovery |
| Dungeons and Dragons (Alternate) / dungeonsanddragonsalternate | [GET](https://api.open5e.com/v2/creatures/?limit=1&fields=key,name) | 200 | ok / ok_json | [free](https://open5e.com/api-docs) | 112 | callable |
| Duolingo API / duolingoapi | [GET](https://www.duolingo.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 345 | discovery |
| Dutch CBS API / dutchcbsapi | [GET](https://opendata.cbs.nl/ODataApi/OData/37296ned/TableInfos?$format=json) | 200 | ok / ok_json | [free](https://www.cbs.nl/en-gb/about-us/website/copyright) | 171 | callable |
| DVC / dvc | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://dvc.org) | 0 | discovery |
| Dynamic QR Code / dynamicqrcode | [GET](https://rapidapi.com/updeploy-tools/api/qr-code-dynamic-and-static1/details/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1302 | discovery |
| ECB API / ecbapi | [GET](https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?lastNObservations=1&format=csvdata) | 200 | ok / ok_csv | [free](https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.de.html) | 250 | callable |
| ECB Exchange Rates / ecbapi | [GET](https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?lastNObservations=1&format=csvdata) | 200 | duplicate / duplicate | [free](https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.de.html) | - | alias of ecbapi |
| Econdb / econdb | [GET](https://www.econdb.com/api/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 320 | discovery |
| Ecuador Open Data API / ecuadoropendataapi | [GET](https://datosabiertos.gob.ec/) | 403 | unresolved / access_denied | [free](https://datosabiertos.gob.ec) | 859 | discovery |
| Egypt Open Data API / egyptopendataapi | [GET](https://data.gov.eg/) | 0 | dead_upstream / network_error | [free](https://data.gov.eg) | 940 | discovery |
| EnergyStar / energystar | [GET](https://energystar.gov/) | 301 | redirect_https / redirect_not_approved | unknown | 657 | discovery |
| English Random Words / englishrandomwords | [GET](https://random-words-api.vercel.app/word/) | 429 | rate_limit / rate_limited | unknown | 540 | discovery |
| Ensembl / ensembl | [GET](https://rest.ensembl.org/lookup/id/ENSG00000139618?content-type=application/json) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/about/terms-of-use/) | 2607 | callable |
| Ensembl API / ensemblapi | [GET](https://rest.ensembl.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 19952 | discovery |
| Entur / entur | [GET](https://api.entur.io/) | 404 | wrong_base_url_path / http_error | unknown | 213 | discovery |
| Environment Agency / environmentagency | [GET](https://environment.data.gov.uk/flood-monitoring/id/stations?_limit=1) | 200 | ok / ok_json | [free](https://environment.data.gov.uk/flood-monitoring/doc/reference) | 3058 | callable |
| Environment Canada API / environmentcanadaapi | [GET](https://api.weather.gc.ca/collections/hydrometric-stations?f=json) | 200 | ok / ok_json | [free](https://eccc-msc.github.io/open-data/licence/readme_en/) | 531 | callable |
| EPA API / epaapi | [GET](https://www.epa.gov/enviro/web-services/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.epa.gov/enviro/web-services) | 1085 | discovery |
| Ergast F1 API / ergastf1 | [GET](https://ergast.com/mrd/) | 200 | duplicate / duplicate | [free](https://ergast.com/mrd) | - | discovery |
| ESPN / espn | [GET](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b/) | 404 | wrong_base_url_path / http_error | [free](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b) | 570 | discovery |
| Ethiopia Open Data API / ethiopiaopendataapi | [GET](https://data.gov.et/) | 0 | dead_upstream / network_error | [free](https://data.gov.et) | 7 | discovery |
| EU Data Portal API / eudataportalapi | [GET](https://data.europa.eu/api/hub/repo/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 197 | discovery |
| EU Open Data / euopendata | [GET](https://data.europa.eu/en/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 4054 | discovery |
| EU Open Data Portal / euopendata | [GET](https://data.europa.eu/en/) | 200 | duplicate / duplicate | [free](https://data.europa.eu/en) | - | discovery |
| EU Open Data Portal API / euopendataportalapi | [GET](https://data.europa.eu/en/publications/dataeuropa-academy/) | 404 | wrong_base_url_path / http_error | [free](https://data.europa.eu/en/publications/dataeuropa-academy) | 1925 | discovery |
| Euromap 77 / euromap77 | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| European Space Agency API / europeanspaceagencyapi | [GET](https://api.esa.int/) | 0 | dead_upstream / network_error | [free](https://api.esa.int) | 22 | discovery |
| European Union / europeanunion | [GET](https://data.europa.eu/api/) | 404 | wrong_base_url_path / http_error | unknown | 2510 | discovery |
| Eurostat API / eurostatapi | [GET](https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_pjan?geo=SE&sex=T&age=TOTAL&time=2025) | 200 | ok / ok_json | [free](https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-introduction) | 315 | callable |
| EVA / eva | [GET](https://eva.pingutil.com/) | 0 | dead_upstream / network_error | unknown | 53 | discovery |
| EVA Email Validation / eva | [GET](https://eva.pingutil.com/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Evil Insult Generator / evilinsultgenerator | [GET](https://evilinsult.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 326 | discovery |
| Exchangerate.host / exchangeratehost | [GET](https://exchangerate.host/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 871 | discovery |
| Excuser / excuser | [GET](https://excuser.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 452 | discovery |
| Excuser API / excuser | [GET](https://excuser.herokuapp.com/) | 404 | duplicate / duplicate | unknown | - | discovery |
| F1 Data / f1data | [GET](https://formula1.com/) | 301 | redirect_https / redirect_not_approved | unknown | 348 | discovery |
| Fabric (Firebase) / fabricfirebase | [GET](https://firebase.google.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 888 | discovery |
| Faker / faker | [GET](https://fakerapi.it/) | 502 | dead_upstream / http_error | unknown | 2066 | discovery |
| Faker API / fakerapi-e867d1cb | [GET](https://fakerapi.it/api/v2/persons?_quantity=1) | 502 | dead_upstream / http_error | [free](https://fakerapi.it/en) | 2944 | discovery |
| FakeStoreAPI / fakestoreapi | [GET](https://fakestoreapi.com/products?limit=1) | 200 | ok / ok_json | [free](https://fakestoreapi.com/docs) | 219 | callable |
| Falco / falco | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| FAO / fao | [GET](https://fao.org/) | 301 | redirect_https / redirect_not_approved | unknown | 207 | discovery |
| FAO API / faoapi | [GET](https://www.fao.org/faostat/en/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.fao.org/faostat/en) | 218 | discovery |
| FASS / fass | [GET](https://www.fass.se/LIF/developer/) | 301 | redirect_https / redirect_not_approved | unknown | 137 | discovery |
| FBI Wanted / fbiwanted | [GET](https://api.fbi.gov/wanted/v1/list?pageSize=1) | 200 | ok / ok_json | [free](https://www.fbi.gov/wanted/api) | 145 | callable |
| FDA / fda | [GET](https://api.fda.gov/food/enforcement.json?limit=1) | 200 | ok / ok_json | [free](https://open.fda.gov/apis/authentication/) | 1075 | callable |
| FDA API / fdaapi | [GET](https://open.fda.gov/apis/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://open.fda.gov/apis) | 556 | discovery |
| FDA Drug API / fdadrugapi | [GET](https://open.fda.gov/apis/drug/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1241 | discovery |
| FDA Food / fdafood | [GET](https://api.fda.gov/) | 404 | wrong_base_url_path / http_error | unknown | 1822 | discovery |
| Fed Treasury / fedtreasury | [GET](https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/rates_of_exchange?page%5Bsize%5D=1) | 200 | ok / ok_json | [free](https://fiscaldata.treasury.gov/api-documentation/) | 800 | callable |
| Federal Register / federalregister | [GET](https://www.federalregister.gov/api/v1/documents.json?per_page=1) | 200 | ok / ok_json | [free](https://www.federalregister.gov/developers/documentation/api/v1) | 476 | callable |
| Feodo Tracker API / feodotrackerapi | [GET](https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.json) | 200 | ok / ok_json | [free](https://feodotracker.abuse.ch/blocklist/) | 258 | callable |
| FFXIV Collect / ffxivcollect | [GET](https://ffxivcollect.com/api/mounts/186) | 200 | ok / ok_json | [free](https://ffxivcollect.com/) | 601 | callable |
| FIFA Ultimate Team / fifaultimateteam | [GET](https://www.easports.com/fifa/ultimate-team/api/fut/item/) | 503 | dead_upstream / http_error | unknown | 1164 | discovery |
| FIFA Women's World Cup / fifawomensworldcup | [GET](https://worldcup.sfg.io/) | 0 | dead_upstream / network_error | unknown | 77 | discovery |
| FIFA World Cup / fifawomensworldcup | [GET](https://worldcup.sfg.io/) | 0 | duplicate / duplicate | unknown | - | discovery |
| File.io / fileio | [GET](https://www.file.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 228 | discovery |
| FilterLists / filterlists | [GET](https://filterlists.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 696 | discovery |
| Final Fantasy XIV / finalfantasyxiv | [GET](https://xivapi.com/) | 302 | redirect_https / redirect_not_approved | unknown | 160 | discovery |
| Finnish Meteorological Institute / finnishmeteorologicalinstitute | [GET](https://opendata.fmi.fi/wfs?request=getFeature&storedquery_id=fmi::observations::weather::simple&place=Helsinki&parameters=t2m&timestep=60&maxlocations=1) | 200 | ok / ok_xml | [free](https://en.ilmatieteenlaitos.fi/open-data) | 290 | callable |
| Fixer / fixer | - | 0 | needs_key / reviewed_exclusion | unknown | 0 | discovery |
| Fleep / fleep | [GET](https://fleep.io/fleepapi/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 395 | discovery |
| Focalboard / focalboard | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Football (Soccer) Videos / footballsoccervideos | [GET](https://www.scorebat.com/video-api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 707 | discovery |
| Forgejo / forgejo | [GET](https://forgejo.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 287 | discovery |
| France Data API / francedataapi | [GET](https://www.data.gouv.fr/en/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1269 | discovery |
| Frankfurter / frankfurter | [GET](https://api.frankfurter.dev/v1/latest) | 200 | ok / ok_json | [free](https://frankfurter.dev/) | 119 | callable |
| Frankfurter API / frankfurter | [GET](https://api.frankfurter.dev/v1/latest) | 200 | duplicate / duplicate | unknown | - | alias of frankfurter |
| Free Dictionary / freedictionary | [GET](https://api.dictionaryapi.dev/api/v2/entries/en/hello) | 200 | ok / ok_json | [free](https://dictionaryapi.dev/) | 258 | callable |
| Free Dictionary API / freedictionaryapi | [GET](https://dictionaryapi.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 276 | discovery |
| freeCodeCamp / freecodecamp | [GET](https://www.freecodecamp.org/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.freecodecamp.org) | 545 | discovery |
| freeCodeCamp API / freecodecampapi | [GET](https://www.freecodecamp.org/news/the-freecodecamp-api/) | 404 | wrong_base_url_path / http_error | unknown | 1176 | discovery |
| FreeForexAPI / freeforexapi | [GET](https://freeforexapi.com/Home/Api/) | 522 | dead_upstream / http_error | unknown | 19875 | discovery |
| FreeToGame / freetogame | [GET](https://www.freetogame.com/api/game?id=452) | 200 | ok / ok_json | [free](https://www.freetogame.com/api-doc) | 163 | callable |
| French Address Search / frenchaddresssearch | [GET](https://geo.api.gouv.fr/adresse/) | 404 | wrong_base_url_path / http_error | unknown | 317 | discovery |
| French INSEE API / frenchinseeapi | [GET](https://api.insee.fr/) | 0 | unresolved / network_error | [free](https://api.insee.fr) | 387 | discovery |
| Fruityvice / fruityvice | [GET](https://www.fruityvice.com/api/fruit/apple) | 200 | ok / ok_json | [free](https://www.fruityvice.com/) | 409 | callable |
| Fuck Off as a Service / foaas | [GET](https://www.foaas.com/) | 200 | duplicate / duplicate | unknown | - | discovery |
| FuelEconomy.gov / fueleconomygov | [GET](https://www.fueleconomy.gov/ws/rest/vehicle/31873) | 200 | ok / ok_json | [free](https://www.fueleconomy.gov/feg/ws/) | 1170 | callable |
| Fun Fact / funfact | [GET](https://api.aakhilv.me/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 263 | discovery |
| Fun Fact API / funfact | [GET](https://api.aakhilv.me/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Fun Facts / funfacts | [GET](https://asli-fun-fact-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 603 | discovery |
| FunTranslations / funtranslations | [GET](https://api.funtranslations.com/) | 403 | unresolved / access_denied | unknown | 165 | discovery |
| Game of Thrones Quotes / gameofthronesquotes | [GET](https://api.gameofthronesquotes.xyz/v1/random) | 429 | rate_limit / rate_limited | [free](https://gameofthronesquotes.xyz/) | 1040 | discovery |
| GamerPower / gamerpower | [GET](https://www.gamerpower.com/api/giveaways?platform=steam) | 200 | ok / ok_json | [free](https://www.gamerpower.com/api-read) | 359 | callable |
| GBIF / gbif | [GET](https://api.gbif.org/v1/species/match?name=Puma%20concolor) | 200 | ok / ok_json | [free](https://www.gbif.org/developer/summary) | 263 | callable |
| GBIF API / gbifapi | [GET](https://www.gbif.org/developer/summary/) | 403 | unresolved / access_denied | unknown | 161 | discovery |
| GDBrowser / gdbrowser | - | 0 | unresolved / reviewed_exclusion | unknown | 0 | discovery |
| GDPR API / gdprapi | [GET](https://gdpr-info.eu/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 466 | discovery |
| Genderize / genderize | [GET](https://genderize.io/) | 406 | unresolved / http_error | unknown | 601 | discovery |
| Genderize.io / genderize | [GET](https://genderize.io/) | 406 | duplicate / duplicate | unknown | - | discovery |
| Genrenator / genrenator | [GET](https://binaryjazz.us/wp-json/genrenator/v1/genre/) | 200 | ok / ok_json | [free](https://binaryjazz.us/genrenator-api/) | 924 | callable |
| Genshin Impact / genshinimpact | [GET](https://genshin.jmp.blue/characters/amber) | 200 | ok / ok_json | [free](https://github.com/genshindev/api/blob/mistress/LICENSE) | 317 | callable |
| Genshin Impact API / genshinimpactapi | [GET](https://genshin.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 165 | discovery |
| Geocode.xyz / geocodexyz | [GET](https://geocode.xyz/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 828 | discovery |
| Geodata.gov.gr / geodatagovgr | [GET](https://geodata.gov.gr/en/) | 0 | timeout / timeout | unknown | 257 | discovery |
| GeographQL / geographql | [GET](https://geographql.netlify.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 888 | discovery |
| GeoJS / geojs | [GET](https://get.geojs.io/v1/ip/geo/8.8.8.8.json) | 200 | ok / ok_json | [free](https://www.geojs.io/docs/v1/endpoints/ip/) | 282 | callable |
| Geokeo / geokeo | [GET](https://geokeo.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1031 | discovery |
| geoPlugin / geoplugin | [GET](https://www.geoplugin.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 729 | discovery |
| Germany Data API / germanydataapi | [GET](https://www.govdata.de/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 300 | discovery |
| Ghana Open Data API / ghanaopendataapi | [GET](https://data.gov.gh/) | 0 | dead_upstream / network_error | [free](https://data.gov.gh) | 291 | discovery |
| Ghostwriter / ghostwriter | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Git.io / gitio | [GET](https://github.blog/2011-11-10-git-io-github-url-shortener/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 3432 | discovery |
| Gitea / gitea | [GET](https://gitea.io/) | 301 | redirect_https / redirect_not_approved | unknown | 100 | discovery |
| GitHub Contribution Chart Generator / githubcontributionchartgenerator | [GET](https://github-contributions.vercel.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 203 | discovery |
| GitHub Contributions / githubcontributionchartgenerator | [GET](https://github-contributions.vercel.app/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Gogs / gogs | [GET](https://gogs.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1216 | discovery |
| Google BigQuery API / googlebigqueryapi | [GET](https://cloud.google.com/bigquery/docs/reference/rest/v2/) | 301 | gateway_block / gateway_block | unknown | 1079 | discovery |
| goQR.me / goqrme | [GET](https://goqr.me/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 332 | discovery |
| GPT4All / gpt4all | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://gpt4all.io) | 0 | discovery |
| GraphQL Jobs / graphqljobs | [GET](https://graphql.jobs/docs/api/) | 0 | dead_upstream / network_error | unknown | 3 | discovery |
| Graphs for Coronavirus / graphsforcoronavirus | [GET](https://corona.dnsforfamily.com/api.txt/) | 0 | dead_upstream / network_error | unknown | 33 | discovery |
| Gravatar / gravatar | [GET](https://gravatar.com/99511d6010af8c574c31f94e1b327bba5e25086dd7b92a4b6f3e132b579cc8d1.json) | 200 | ok / ok_json | [free](https://docs.gravatar.com/guides/llms-txt/) | 629 | callable |
| Gravatar API / gravatar | [GET](https://gravatar.com/99511d6010af8c574c31f94e1b327bba5e25086dd7b92a4b6f3e132b579cc8d1.json) | 200 | duplicate / duplicate | [free](https://docs.gravatar.com/guides/llms-txt/) | - | alias of gravatar |
| GroupMe / groupme | [GET](https://dev.groupme.com/docs/v3/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1054 | discovery |
| GrünstromIndex / grnstromindex | [GET](https://gruenstromindex.de/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 315 | discovery |
| Grype / grype | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| GTFS Regional / gtfsregional | [GET](https://www.trafiklab.se/api/gtfs-regional/) | 404 | wrong_base_url_path / http_error | unknown | 131 | discovery |
| Gutendex / gutendex | [GET](https://gutendex.com/books/?ids=1342) | 0 | timeout / timeout | [free](https://gutendex.com/) | 20012 | discovery |
| HAPI FHIR / hapifhir | [GET](https://hapifhir.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1053 | discovery |
| Harry Potter API / harrypotterapi | [GET](https://hp-api.onrender.com/api/characters/staff) | 200 | ok / ok_json | [free](https://hp-api.onrender.com/) | 178 | callable |
| Harry Potter Charactes / harrypottercharactes | [GET](https://hp-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 471 | discovery |
| Hashable / hashable | [GET](https://hashable.space/pages/api/) | 0 | redirect_https / tls_error | unknown | 502 | discovery |
| Hashnode / hashnode | [GET](https://hashnode.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 271 | discovery |
| HealthData.gov / healthdatagov | [GET](https://healthdata.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://healthdata.gov/) | 13118 | callable |
| Hebrew Calendar / hebrewcalendar | [GET](https://www.hebcal.com/converter?cfg=json&gy=2026&gm=10&gd=15&g2h=1) | 200 | ok / ok_json | [free](https://www.hebcal.com/home/developer-apis) | 429 | callable |
| Helix / helix | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| HelloSalut / hellosalut | [GET](https://fourtonfish.com/project/hellosalut-api/) | 301 | redirect_https / redirect_not_approved | unknown | 725 | discovery |
| Hemingway Editor / hemingwayeditor | [GET](https://hemingwayapp.com/) | 200 | wrong_base_url_path / html_instead_of_api | freemium | 341 | discovery |
| heweather / heweather | [GET](https://www.heweather.com/documents/) | 404 | wrong_base_url_path / http_error | unknown | 1137 | discovery |
| Hipster Ipsum / hipsteripsum | [GET](https://hipsum.co/api/?type=hipster-centric&sentences=1) | 200 | ok / ok_json | [free](https://hipsum.co/the-api/) | 633 | callable |
| hitokoto / hitokoto | [GET](https://hitokoto.cn/api/) | 302 | gateway_block / gateway_block | unknown | 2631 | discovery |
| Homebrew / homebrew | [GET](https://formulae.brew.sh/api/formula/git.json) | 200 | ok / ok_json | [free](https://formulae.brew.sh/docs/api/) | 179 | callable |
| Hong Kong Data API / hongkongdataapi | [GET](https://data.gov.hk/en-data/api/3/action/package_list?limit=1) | 200 | ok / ok_json | [free](https://data.gov.hk/en/faq) | 765 | callable |
| Hong Kong GeoData Store / hongkonggeodatastore | [GET](https://geodata.gov.hk/gs/) | 0 | dead_upstream / network_error | unknown | 33 | discovery |
| Hong Kong Open Data API / hongkongopendataapi | [GET](https://data.gov.hk/en/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1326 | discovery |
| host-t.com / hosttcom | [GET](https://host-t.com/) | 301 | redirect_https / redirect_not_approved | unknown | 667 | discovery |
| HTTP Cat / httpcat | [GET](https://http.cat/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 128 | discovery |
| HTTP Dog / httpdog | [GET](https://http.dog/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 144 | discovery |
| HTTP2.Pro / http2pro | [GET](https://http2.pro/doc/api/) | 301 | redirect_https / redirect_not_approved | unknown | 113 | discovery |
| Httpbin / httpbin | [GET](https://httpbin.org/get) | 200 | ok / ok_json | [free](https://httpbin.org/) | 700 | callable |
| httpbin API / httpbinapi | [GET](https://httpbin.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1999 | discovery |
| Httpbin Cloudflare / httpbincloudflare | [GET](https://cloudflare-quic.com/b/) | 404 | wrong_base_url_path / http_error | unknown | 760 | discovery |
| Human Protein Atlas / humanproteinatlas | [GET](https://www.proteinatlas.org/ENSG00000141510.json) | 200 | ok / ok_json | [free](https://www.proteinatlas.org/about/licence) | 122 | callable |
| Humanitarian Data Exchange / humanitariandataexchange | [GET](https://data.humdata.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1054 | discovery |
| Hytale / hytale | [GET](https://hytale-api.com/) | 0 | timeout / timeout | unknown | 20004 | discovery |
| Hytale API / hytale | [GET](https://hytale-api.com/) | 0 | duplicate / duplicate | unknown | - | discovery |
| IBGE Brazil Stats / ibgebrazilstats | [GET](https://servicodados.ibge.gov.br/api/v1/localidades/estados/33) | 0 | redirect_https / tls_error | [free](https://servicodados.ibge.gov.br/api/docs/localidades) | 741 | discovery |
| icanhazdadjoke / icanhazdadjoke | [GET](https://icanhazdadjoke.com/) | 200 | ok / ok_json | [free](https://icanhazdadjoke.com/api) | 218 | callable |
| Icanhazepoch / icanhazepoch | [GET](https://icanhazepoch.com/) | 301 | redirect_https / redirect_not_approved | unknown | 1225 | discovery |
| Icanhazip / icanhazip | [GET](https://major.io/icanhazip-com-faq/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 287 | discovery |
| Iceland Inspire API / icelandinspireapi | [GET](https://www.lmi.is/is/gagnaveita/) | 301 | redirect_https / redirect_not_approved | unknown | 352 | discovery |
| Icelandic Met Office / icelandicmetoffice | [GET](https://en.vedur.is/about-imo/apis/) | 404 | wrong_base_url_path / http_error | unknown | 594 | discovery |
| Icon Horse / iconhorse | [GET](https://icon.horse/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 595 | discovery |
| Icon Horse API / iconhorseapi | [GET](https://icon.horse/usage/) | 404 | wrong_base_url_path / http_error | unknown | 694 | discovery |
| Icons8 / icons8 | [GET](https://img.icons8.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 120 | discovery |
| IEA / iea | [GET](https://iea.org/) | 301 | redirect_https / redirect_not_approved | unknown | 279 | discovery |
| IFTTT / ifttt | [GET](https://platform.ifttt.com/docs/connect_api/) | 301 | redirect_https / redirect_not_approved | unknown | 292 | discovery |
| IMD India Weather / imdindiaweather | [GET](https://mausam.imd.gov.in/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1990 | discovery |
| IMF / imf | [GET](https://datahelp.imf.org/knowledgebase/topics/125587/) | 0 | dead_upstream / network_error | unknown | 2 | discovery |
| IMF Data API / imfdataapi | [GET](https://datahelp.imf.org/knowledgebase/articles/667681/) | 0 | dead_upstream / network_error | [free](https://datahelp.imf.org/knowledgebase/articles/667681) | 1001 | discovery |
| Imgflip / imgflip | [GET](https://api.imgflip.com/get_memes) | 200 | ok / ok_json | [free](https://imgflip.com/api) | 94 | callable |
| Imsea / imsea | [GET](https://imsea.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 341 | discovery |
| Indian Mutual Fund / indianmutualfund | [GET](https://api.mfapi.in/mf/100027/latest) | 200 | ok / ok_json | [free](https://www.mfapi.in/) | 720 | callable |
| Indonesia Dictionary / indonesiadictionary | [GET](https://new-kbbi-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 215 | discovery |
| Indonesia Open Data API / indonesiaopendataapi | [GET](https://data.go.id/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.go.id) | 1518 | discovery |
| INSEE France / inseefrance | [GET](https://insee.fr/) | 302 | redirect_https / redirect_not_approved | unknown | 355 | discovery |
| Instabox / instabox | [GET](https://www.instabox.se/) | 301 | redirect_https / redirect_not_approved | unknown | 201 | discovery |
| Instapaper / instapaper | [GET](https://www.instapaper.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1162 | discovery |
| Interpol Red Notices / interpolrednotices | [GET](https://interpol.api.bund.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 241 | discovery |
| Intro.js / introjs | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| IP 2 Country / ip2country | [GET](https://ip2country.info/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 119 | discovery |
| IP Address Details / ipaddressdetails | [GET](https://ipinfo.io/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 306 | discovery |
| IP Vigilante / ipvigilante | [GET](https://www.ipvigilante.com/) | 301 | redirect_https / redirect_not_approved | unknown | 143 | discovery |
| ipapi.co / ipapico | [GET](https://ipapi.co/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1311 | discovery |
| IPGEO / ipgeo | [GET](https://api.techniknews.net/ipgeo/) | 200 | unresolved / invalid_response | unknown | 3116 | discovery |
| IPify / ipify | [GET](https://api.ipify.org/?format=json) | 200 | ok / ok_json | [free](https://www.ipify.org/) | 182 | callable |
| IRENA / irena | [GET](https://irena.org/) | 301 | redirect_https / redirect_not_approved | unknown | 208 | discovery |
| ISA-95 / isa95 | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| isEven / iseven | [GET](https://api.isevenapi.xyz/api/iseven/6/) | 200 | ok / ok_json | [free](https://isevenapi.xyz/) | 689 | callable |
| isEven (humor) / isevenhumor | [GET](https://isevenapi.xyz/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 822 | discovery |
| ISRO / isro | [GET](https://isro.vercel.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 308 | discovery |
| ISRO API / isro | [GET](https://isro.vercel.app/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Istanbul (İBB) Open Data / istanbulibbopendata | [GET](https://data.ibb.gov.tr/api/3/action/package_search?rows=1&fl=id,name,title,license_id) | 200 | ok / ok_json | [free](https://data.ibb.gov.tr/license) | 623 | callable |
| ItsThisForThat / itsthisforthat | [GET](https://itsthisforthat.com/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 253 | discovery |
| Ivory Coast Data API / ivorycoastdataapi | [GET](https://data.gouv.ci/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gouv.ci) | 978 | discovery |
| Jan AI / janai | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Japan Statistics / japanstatistics | [GET](https://stat.go.jp/) | 0 | dead_upstream / network_error | unknown | 27 | discovery |
| Jawbone UP / jawboneup | [GET](https://jawbone.com/up/developer/) | 301 | redirect_https / redirect_not_approved | unknown | 158 | discovery |
| Jikan / jikan | [GET](https://api.jikan.moe/v4/anime/1) | 0 | timeout / timeout | [free](https://docs.api.jikan.moe/) | 285 | discovery |
| Jikan MyAnimeList / jikanmyanimelist | [GET](https://jikan.moe/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 438 | discovery |
| Jikan MyAnimeList API / jikanmyanimelist | [GET](https://jikan.moe/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Jina Reader / jinareader | [GET](https://jina.ai/reader/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 362 | discovery |
| Jitsi / jitsi | [GET](https://jitsi.org/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://jitsi.org) | 768 | discovery |
| JMA API / jmaapi | [GET](https://www.jma.go.jp/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.jma.go.jp) | 1841 | discovery |
| JokeAPI / jokeapi | [GET](https://v2.jokeapi.dev/joke/Programming?safe-mode) | 200 | ok / ok_json | [free](https://sv443.net/jokeapi/v2/) | 136 | callable |
| Joplin / joplin | - | 0 | needs_key / reviewed_exclusion | unknown | 0 | discovery |
| JSON 2 JSONP / json2jsonp | [GET](https://json2jsonp.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 223 | discovery |
| JSON Placeholder / jsonplaceholder-19df6db5 | [GET](https://jsonplaceholder.typicode.com/todos/1) | 200 | ok / ok_json | [free](https://jsonplaceholder.typicode.com/guide/) | 113 | callable |
| Juhe Data / juhedata | [GET](https://www.juhe.cn/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 4510 | discovery |
| Kadaster Netherlands / kadasternetherlands | [GET](https://www.pdok.nl/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 526 | discovery |
| Kakoune / kakoune | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| kanye.rest / kanyerest | [GET](https://api.kanye.rest/) | 200 | ok / ok_json | [free](https://kanye.rest/) | 238 | callable |
| Kapiche / kapiche | [GET](https://www.kapiche.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 198 | discovery |
| Kartverket / kartverket | [GET](https://kartkatalog.geonorge.no/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 140 | discovery |
| Kenya Open Data API / kenyaopendataapi | [GET](https://opendata.go.ke/) | 0 | timeout / timeout | [free](https://opendata.go.ke) | 10435 | discovery |
| Kickbox / kickbox | [GET](https://open.kickbox.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 765 | discovery |
| kimiquotes / kimiquotes | [GET](https://kimiquotes.herokuapp.com/doc/) | 404 | wrong_base_url_path / http_error | unknown | 252 | discovery |
| KNBS Kenya Stats / knbskenyastats | [GET](https://www.knbs.or.ke/) | 0 | redirect_https / tls_error | unknown | 514 | discovery |
| KNX / knx | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| KONTESTS / kontests | [GET](https://kontests.net/api/) | 0 | dead_upstream / network_error | unknown | 39 | discovery |
| Korean Statistics / koreanstatistics | [GET](https://kostat.go.kr/) | 301 | redirect_https / redirect_not_approved | unknown | 971 | discovery |
| Kroki / kroki | [GET](https://kroki.io/health) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 287 | discovery |
| Kube-bench / kubebench | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Kubeflow / kubeflow | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Kubescape / kubescape | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| LA Open Data API / laopendataapi | [GET](https://data.lacity.org/api/views/metadata/v1?limit=1&page=1) | 200 | ok / ok_json | [free](https://data.lacity.org/terms-of-use) | 1575 | callable |
| Lantmäteriet / lantmteriet | [GET](https://www.lantmateriet.se/sv/Om-Lantmateriet/Oppna-data/) | 404 | wrong_base_url_path / http_error | unknown | 207 | discovery |
| Lapce / lapce | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| LAPIS / lapis | [GET](https://cov-spectrum.ethz.ch/public/) | 0 | redirect_https / tls_error | unknown | 391 | discovery |
| Laravel China / laravelchina | [GET](https://laravel-china.org/topics/3097/) | 0 | timeout / timeout | unknown | 10588 | discovery |
| Launch Library / launchlibrary | [GET](https://thespacedevs.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 842 | discovery |
| Launch Library 2 / launchlibrary2 | [GET](https://ll.thespacedevs.com/2.3.0/launches/?limit=1) | 200 | ok / ok_json | [free](https://thespacedevs.com/llapi) | 716 | callable |
| Leaflet / leaflet | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://leafletjs.com) | 0 | discovery |
| Lido / lido | [GET](https://lido.fi/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 157 | discovery |
| LightwaveRF / lightwaverf | [GET](https://api.lightwaverf.com/) | 301 | redirect_https / redirect_not_approved | unknown | 258 | discovery |
| LM Studio / lmstudio | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Lobsters API / lobstersapi | [GET](https://lobste.rs/newest.json) | 200 | ok / ok_json | [free](https://lobste.rs) | 830 | callable |
| LocalAI / localai | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://localai.io) | 0 | discovery |
| Localbitcoins / localbitcoins | [GET](https://localbitcoins.com/api-docs/) | 404 | wrong_base_url_path / http_error | unknown | 172 | discovery |
| Logseq / logseq | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://logseq.com) | 0 | discovery |
| LonWorks / lonworks | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| LoRaWAN / lorawan | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Lordicon / lordicon | [GET](https://lordicon.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 418 | discovery |
| Lorem Ipsum / loremipsum | [GET](https://loremipsum.io/api/) | 404 | wrong_base_url_path / http_error | [free](https://loremipsum.io/api) | 872 | discovery |
| Lorem Ipsum API / loremipsumapi | [GET](https://loripsum.net/api/1/short/plaintext) | 0 | dead_upstream / network_error | [free](https://loripsum.net/) | 76 | discovery |
| Lorem Picsum / lorempicsum | [GET](https://picsum.photos/v2/list?page=1&limit=1) | 200 | ok / ok_json | [free](https://picsum.photos/) | 138 | callable |
| Lorem Space / loremspace | [GET](https://lorem.space/api/) | 0 | unresolved / network_error | unknown | 1116 | discovery |
| Lua Decompiler / luadecompiler | [GET](https://lua-decompiler.ferib.dev/) | 0 | dead_upstream / network_error | unknown | 87 | discovery |
| Luchtmeetnet / luchtmeetnet | [GET](https://api-docs.luchtmeetnet.nl/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 1203 | discovery |
| Lucia Auth / luciaauth | [GET](https://lucia-auth.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 300 | discovery |
| Lyrics.ovh / lyricsovh | [GET](https://lyricsovh.docs.apiary.io/) | 502 | dead_upstream / http_error | unknown | 1169 | discovery |
| MailCheck.ai / mailcheckai | [GET](https://www.mailcheck.ai/) | 301 | redirect_https / redirect_not_approved | unknown | 242 | discovery |
| Malaysia Open Data API / malaysiaopendataapi | [GET](https://api.data.gov.my/data-catalogue?id=fuelprice&limit=1) | 200 | ok / ok_json | [free](https://developer.data.gov.my/quickstart) | 1970 | callable |
| Mark Text / marktext | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| markerapi / markerapi | [GET](https://markerapi.com/) | 521 | dead_upstream / http_error | unknown | 223 | discovery |
| Marketstack / marketstack | [GET](https://marketstack.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 810 | discovery |
| Maven Central / mavencentral | - | 0 | commercial_permission / reviewed_exclusion | [free](https://search.maven.org) | 0 | discovery |
| MealDB API / mealdbapi | [GET](https://www.themealdb.com/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 271 | discovery |
| Mempool / mempool | [GET](https://mempool.space/api/v1/fees/recommended) | 200 | ok / ok_json | [free](https://mempool.space/docs/api/rest) | 196 | callable |
| Mempool API / mempoolapi | [GET](https://mempool.space/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2104 | discovery |
| MercadoBitcoin / mercadobitcoin | [GET](https://www.mercadobitcoin.com.br/api-doc/) | 404 | wrong_base_url_path / http_error | unknown | 277 | discovery |
| Messari / messari | [GET](https://messari.io/api/) | 429 | rate_limit / rate_limited | unknown | 1277 | discovery |
| Messari API / messari | [GET](https://messari.io/api/) | 429 | duplicate / duplicate | unknown | - | discovery |
| MET Norway / metnorway | [GET](https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75) | 200 | duplicate / duplicate | [free](https://api.met.no/doc/TermsOfService) | - | alias of yr |
| Metabase / metabase | [GET](https://www.metabase.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 299 | discovery |
| MetaWeather / metaweather | [GET](https://www.metaweather.com/api/) | 0 | dead_upstream / network_error | unknown | 40 | discovery |
| Meteoam Italy / meteoamitaly | [GET](https://www.meteoam.it/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2588 | discovery |
| Mexico Open Data API / mexicoopendataapi | [GET](https://datos.gob.mx/) | 403 | unresolved / access_denied | [free](https://datos.gob.mx) | 202 | discovery |
| MicroENV / microenv | [GET](https://microenv.com/) | 0 | redirect_https / tls_error | unknown | 414 | discovery |
| Microlink.io / microlink | [GET](https://api.microlink.io/?url=https%3A%2F%2Fexample.com) | 200 | ok / ok_json | [free](https://microlink.io/skills/microlink) | 440 | callable |
| Microsoft Graph OneDrive / microsoftgraphonedrive | [GET](https://graph.microsoft.io/en-us/docs/api-reference/v1.0/resources/onedrive/) | 301 | gateway_block / gateway_block | unknown | 951 | discovery |
| Microsoft Security Response Center (MSRC) / microsoftsecurityresponsecentermsrc | [GET](https://msrc.microsoft.com/report/developer/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 800 | discovery |
| Minecraft Server Status / minecraftserverstatus | [GET](https://api.mcsrvstat.us/3/mc.hypixel.net) | 200 | ok / ok_json | [free](https://api.mcsrvstat.us/) | 741 | callable |
| Mineral Database API / mineraldatabaseapi | [GET](https://www.mindat.org/api.php/) | 403 | unresolved / access_denied | unknown | 649 | discovery |
| Mirage JS / miragejs | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://miragejs.com) | 0 | discovery |
| Mirror Networking / mirrornetworking | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Misfit / misfit | [GET](https://build.misfit.com/) | 0 | dead_upstream / network_error | unknown | 1707 | discovery |
| MLB API / mlbapi | [GET](https://statsapi.mlb.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 820 | discovery |
| MLB Data API / mlbdataapi | [GET](https://statsapi.mlb.com/api/v1/sports) | 200 | ok / ok_json | [free](https://statsapi.mlb.com) | 1145 | callable |
| MLB StatsAPI / mlbstatsapi-265d31bd | [GET](https://statsapi.mlb.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 2036 | discovery |
| MMO Games / mmogames | [GET](https://www.mmobomb.com/api1/game?id=452) | 200 | ok / ok_json | [free](https://www.mmobomb.com/api) | 192 | callable |
| Mockoon / mockoon | - | 0 | unresolved / reviewed_exclusion | [free](https://mockoon.com) | 0 | discovery |
| Mocky / mocky | [GET](https://designer.mocky.io/) | 0 | redirect_https / tls_error | unknown | 341 | discovery |
| Mojio / mojio | [GET](https://www.moj.io/developer/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 383 | discovery |
| Moodle / moodle | [GET](https://moodle.org/) | 403 | unresolved / access_denied | unknown | 750 | discovery |
| Moon Phase API / moonphaseapi | [GET](https://www.farmsense.net/api/astro-widgets/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1564 | discovery |
| Morocco Open Data API / moroccoopendataapi | [GET](https://data.gov.ma/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.gov.ma/index.php/fr/Comment_exploiter_les_donn%C3%A9es) | 1272 | callable |
| Motivational Quotes / motivationalquotes | [GET](https://nodejs-quoteapp.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 713 | discovery |
| MovieGlu / movieglu | [GET](https://www.movieglu.com/) | 301 | redirect_https / redirect_not_approved | unknown | 1212 | discovery |
| MSW / msw | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://mswjs.io) | 0 | discovery |
| MTConnect / mtconnect | [GET](https://www.mtconnect.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 875 | discovery |
| MusicBrainz / musicbrainz | [GET](https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1225 | discovery |
| My Anime List API / jikanmyanimelist | [GET](https://jikan.moe/) | 200 | duplicate / duplicate | unknown | - | discovery |
| MY IP / myip | [GET](https://www.myip.com/api-docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 955 | discovery |
| MY IP API / myip | [GET](https://www.myip.com/api-docs/) | 200 | duplicate / duplicate | unknown | - | discovery |
| myStrom / mystrom | [GET](https://mystrom.ch/de/mystrom-api/) | 404 | wrong_base_url_path / http_error | unknown | 1142 | discovery |
| myStrom API / mystrom | [GET](https://mystrom.ch/de/mystrom-api/) | 404 | duplicate / duplicate | [free](https://mystrom.ch/de/mystrom-api) | - | discovery |
| Nager Date / nagerdate | - | 0 | commercial_permission / reviewed_exclusion | unknown | 0 | discovery |
| Nager.Date API / nagerdateapi | - | 0 | commercial_permission / reviewed_exclusion | [free](https://date.nager.at/Api) | 0 | discovery |
| Namedays Calendar / namedayscalendar | [GET](https://nameday.abalin.net/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 290 | discovery |
| NASA EONET / nasaeonet | [GET](https://eonet.gsfc.nasa.gov/api/v3/events?limit=1) | 200 | ok / ok_json | [free](https://eonet.gsfc.nasa.gov/docs/v3) | 777 | callable |
| NASA POWER API / nasapowerapi | [GET](https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M&community=RE&longitude=10&latitude=59&start=20240101&end=20240101&format=JSON) | 200 | ok / ok_json | [free](https://power.larc.nasa.gov/docs/services/api/) | 505 | callable |
| National Grid ESO / nationalgrideso | [GET](https://data.nationalgrideso.com/) | 0 | dead_upstream / network_error | unknown | 19 | discovery |
| National Vulnerability Database / nationalvulnerabilitydatabase | [GET](https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=1) | 200 | ok / ok_json | [free](https://nvd.nist.gov/developers/vulnerabilities) | 619 | callable |
| Nationalize / nationalize | [GET](https://nationalize.io/) | 406 | unresolved / http_error | unknown | 681 | discovery |
| Nationalize.io / nationalize | [GET](https://nationalize.io/) | 406 | duplicate / duplicate | unknown | - | discovery |
| NBA Stats / nbastats | [GET](https://any-api.com/nba_com/nba_com/docs/API_Description/) | 301 | redirect_https / redirect_not_approved | unknown | 142 | discovery |
| NBB Belgium / nbbbelgium | [GET](https://www.nbb.be/en/statistics/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1164 | discovery |
| NBP Poland API / nbppolandapi | [GET](https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=json) | 200 | ok / ok_json | [free](https://api.nbp.pl/en.html) | 374 | callable |
| NBS China / nbschina | [GET](https://stats.gov.cn/) | 0 | dead_upstream / network_error | unknown | 1074 | discovery |
| NBS Nigeria Stats / nbsnigeriastats | [GET](https://nigerianstat.gov.ng/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1234 | discovery |
| NBU Ukraine API / nbuukraineapi | [GET](https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json) | 200 | ok / ok_json | [free](https://bank.gov.ua/en/open-data/api-dev) | 467 | callable |
| NemID / nemid | [GET](https://www.nets.eu/developer/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1542 | discovery |
| Neovim / neovim | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Netherlands Data API / netherlandsdataapi | [GET](https://data.overheid.nl/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.overheid.nl/data) | 505 | callable |
| Newsblur / newsblur | [GET](https://newsblur.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 794 | discovery |
| Newton / newton | [GET](https://newton.vercel.app/api/v2/simplify/2%2B2) | 200 | ok / ok_json | [free](https://github.com/aunyks/newton) | 378 | callable |
| Newton Math / newton | [GET](https://newton.vercel.app/api/v2/simplify/2%2B2) | 200 | duplicate / duplicate | [free](https://github.com/aunyks/newton) | - | alias of newton |
| Newton Math API / newton | [GET](https://newton.vercel.app/api/v2/simplify/2%2B2) | 200 | duplicate / duplicate | [free](https://github.com/aunyks/newton) | - | alias of newton |
| Nexchange / nexchange | [GET](https://nexchange2.docs.apiary.io/) | 502 | dead_upstream / http_error | unknown | 1132 | discovery |
| NHL API / nhlapi | [GET](https://api-web.nhle.com/v1/) | 404 | wrong_base_url_path / http_error | unknown | 255 | discovery |
| NHTSA / nhtsa | [GET](https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/1M8GDM9AXKP042788?format=json) | 200 | ok / ok_json | [free](https://vpic.nhtsa.dot.gov/api/) | 411 | callable |
| Nick Cannon Baby API / nickcannonbabyapi | [GET](https://nick-cannon-baby-api.onrender.com/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://nick-cannon-baby-api.onrender.com) | 258 | discovery |
| Nigeria Open Data API / nbsnigeriastats | [GET](https://nigerianstat.gov.ng/) | 200 | duplicate / duplicate | [free](https://nigerianstat.gov.ng) | - | discovery |
| NIST Chemistry WebBook / nistchemistrywebbook | [GET](https://webbook.nist.gov/) | 406 | unresolved / http_error | unknown | 696 | discovery |
| NMBS/SNCB Belgium / nmbssncbbelgium | [GET](https://www.belgiantrain.be/en/travel-info/preparing-for-your-journey/use-data/) | 403 | unresolved / access_denied | unknown | 221 | discovery |
| Nobel Prize / nobelprize | [GET](https://api.nobelprize.org/2.1/nobelPrizes?limit=1) | 200 | ok / ok_json | [free](https://nobelprize.readme.io/reference/getting-started) | 214 | callable |
| Nobel Prize API / nobelprize | [GET](https://api.nobelprize.org/2.1/nobelPrizes?limit=1) | 200 | duplicate / duplicate | [free](https://nobelprize.readme.io/reference/getting-started) | - | alias of nobelprize |
| Noctua / noctua | [GET](https://api.noctuasky.com/api/v1/swaggerdoc/) | 404 | wrong_base_url_path / http_error | unknown | 507 | discovery |
| Node-RED / nodered | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Nominatim / nominatim | [GET](https://nominatim.org/release-docs/latest/api/Overview/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 452 | discovery |
| Nominatim API / nominatim | [GET](https://nominatim.org/release-docs/latest/api/Overview/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Non-Working Days / nonworkingdays | [GET](https://isdayoff.ru/20260101) | 200 | ok / ok_text | [free](https://isdayoff.ru/extapi/) | 375 | callable |
| Non-Working Days 2 / nonworkingdays | [GET](https://isdayoff.ru/20260101) | 200 | duplicate / duplicate | [free](https://isdayoff.ru/extapi/) | - | alias of nonworkingdays |
| Norwegian MET Weather / metnorway | [GET](https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75) | 200 | duplicate / duplicate | [free](https://api.met.no/doc/TermsOfService) | - | alias of yr |
| Notation / notation | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Notifee API / notifeeapi | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| NPPES / nppes | [GET](https://npiregistry.cms.hhs.gov/api/?version=2.1&organization_name=Mayo%20Clinic&limit=1) | 200 | ok / ok_json | [free](https://npiregistry.cms.hhs.gov/api-page) | 541 | callable |
| Numverify / numverify | [GET](https://numverify.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 976 | discovery |
| NYC Open Data API / nycopendataapi | [GET](https://opendata.cityofnewyork.us/) | 301 | redirect_https / redirect_not_approved | unknown | 459 | discovery |
| NZ Open Data API / nzopendataapi | [GET](https://catalogue.data.govt.nz/api/3/action/package_search?rows=1) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://catalogue.data.govt.nz) | 105 | discovery |
| Obsidian / obsidian | - | 0 | not_hosted_api / reviewed_exclusion | freemium | 0 | discovery |
| Ocean Biogeographic / oceanbiogeographic | [GET](https://api.obis.org/v3/occurrence?size=1) | 200 | ok / ok_json | [free](https://manual.obis.org/policy.html) | 315 | callable |
| Ocean Facts / oceanfacts | [GET](https://oceanfacts.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 585 | discovery |
| OceanCurrent / oceancurrent | [GET](https://imos.org.au/facilities/oceandata/) | 404 | wrong_base_url_path / http_error | unknown | 2232 | discovery |
| Oddsmagnet / oddsmagnet | [GET](https://data.oddsmagnet.com/) | 301 | redirect_https / redirect_not_approved | unknown | 416 | discovery |
| OECD / oecd | [GET](https://data.oecd.org/) | 403 | unresolved / access_denied | [free](https://data.oecd.org) | 266 | discovery |
| OECD API / oecdapi | [GET](https://data.oecd.org/api/) | 403 | unresolved / access_denied | [free](https://data.oecd.org/api) | 1005 | discovery |
| Official Joke API / officialjokeapi | [GET](https://official-joke-api.appspot.com/random_joke) | 200 | ok / ok_json | [free](https://official-joke-api.appspot.com) | 319 | callable |
| Ollama / ollama | [GET](https://ollama.ai/) | 301 | redirect_https / redirect_not_approved | [free](https://ollama.ai) | 136 | discovery |
| ONS UK / onsuk | [GET](https://api.beta.ons.gov.uk/v1/datasets?limit=1) | 200 | ok / ok_json | [free](https://developer.ons.gov.uk/) | 238 | callable |
| ONS UK Statistics / onsukstatistics | [GET](https://api.ons.gov.uk/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 226 | discovery |
| OnWater / onwater | [GET](https://onwater.io/) | 301 | redirect_https / redirect_not_approved | unknown | 175 | discovery |
| OPC UA / opcua | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Open Ag Data / openagdata | [GET](https://openag.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 402 | discovery |
| Open Brewery DB / openbrewerydb | [GET](https://api.openbrewerydb.org/v1/breweries?per_page=1) | 200 | ok / ok_json | [free](https://www.openbrewerydb.org/documentation) | 722 | callable |
| Open Charge Map / openchargemap | [GET](https://openchargemap.org/site/develop/api/) | 302 | redirect_https / redirect_not_approved | unknown | 3062 | discovery |
| Open Data Minneapolis / opendataminneapolis | [GET](https://opendata.minneapolismn.gov/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 883 | discovery |
| Open Data NHS Scotland / opendatanhsscotland | [GET](https://www.opendata.nhs.scot/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.opendata.nhs.scot/api/3/action/help_show?name=package_search) | 906 | callable |
| Open Disease / opendisease | [GET](https://disease.sh/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 448 | discovery |
| Open Food Facts / openfoodfacts | [GET](https://world.openfoodfacts.org/api/v2/product/737628064502.json?fields=product_name) | 200 | ok / ok_json | [free](https://openfoodfacts.github.io/openfoodfacts-server/api/) | 257 | callable |
| Open Food Facts API / openfoodfactsapi | [GET](https://world.openfoodfacts.org/data/) | 403 | unresolved / access_denied | unknown | 909 | discovery |
| Open Government, ACT / opengovernmentact | [GET](https://www.data.act.gov.au/) | 406 | unresolved / http_error | unknown | 780 | discovery |
| Open Government, Argentina / argentinaopendataapi-9c9e04f3 | [GET](https://datos.gob.ar/api/3/action/package_search?rows=1) | 502 | dead_upstream / http_error | [free](https://datos.gob.ar/api/3/action/help_show?name=package_search) | 394 | discovery |
| Open Government, Australia / australiadataapi-50671063 | [GET](https://data.gov.au/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.gov.au/data/api/3/action/help_show?name=package_search) | 516 | callable |
| Open Government, Austria / opengovernmentaustria | [GET](https://www.data.gv.at/katalog/api/3/action/package_search?rows=1) | 404 | dead_upstream / http_error | [free](https://www.data.gv.at/katalog/api/3/action/help_show?name=package_search) | 213 | discovery |
| Open Government, Belgium / opengovernmentbelgium | [GET](https://data.gov.be/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2567 | discovery |
| Open Government, Colombia / opengovernmentcolombia | [GET](https://www.dane.gov.co/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1269 | discovery |
| Open Government, Cyprus / opengovernmentcyprus | [GET](https://data.gov.cy/?language=en) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 528 | discovery |
| Open Government, Czech Republic / opengovernmentczechrepublic | [GET](https://data.gov.cz/english/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 304 | discovery |
| Open Government, Denmark / opengovernmentdenmark | [GET](https://admin.opendata.dk/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://admin.opendata.dk/api/3/action/help_show?name=package_search) | 458 | callable |
| Open Government, Finland / opengovernmentfinland | [GET](https://avoindata.suomi.fi/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://avoindata.suomi.fi/fi/kayttoohjeet/kaytto-rajapinnan-api-kautta) | 345 | callable |
| Open Government, Germany / opengovernmentgermany | [GET](https://ckan.govdata.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.govdata.de/api/3/action/help_show?name=package_search) | 231 | callable |
| Open Government, Italy / opengovernmentitaly | [GET](https://www.dati.gov.it/opendata/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.dati.gov.it/opendata/api/3/action/help_show?name=package_search) | 348 | callable |
| Open Government, Lithuania / opengovernmentlithuania | [GET](https://data.gov.lt/public/api/1/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 278 | discovery |
| Open Government, Mexico / mexicoopendataapi | [GET](https://datos.gob.mx/) | 403 | duplicate / duplicate | unknown | - | discovery |
| Open Government, Netherlands / netherlandsdataapi | [GET](https://data.overheid.nl/data/api/3/action/package_search?rows=1) | 200 | duplicate / duplicate | [free](https://data.overheid.nl/data) | - | alias of netherlandsdataapi |
| Open Government, New Zealand / nzopendataapi | [GET](https://catalogue.data.govt.nz/api/3/action/package_search?rows=1) | 200 | duplicate / duplicate | [free](https://catalogue.data.govt.nz) | - | discovery |
| Open Government, Norway / opengovernmentnorway | [GET](https://data.norge.no/dataservices/) | 301 | redirect_https / redirect_not_approved | unknown | 115 | discovery |
| Open Government, Peru / opengovernmentperu | [GET](https://www.datosabiertos.gob.pe/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2141 | discovery |
| Open Government, Poland / opengovernmentpoland | [GET](https://api.dane.gov.pl/1.4/datasets?page=1&per_page=1) | 200 | ok / ok_json | [free](https://api.dane.gov.pl/1.4/doc) | 516 | callable |
| Open Government, Portugal / opengovernmentportugal | [GET](https://dados.gov.pt/api/1/datasets/?page_size=1) | 200 | ok / ok_json | [free](https://dados.gov.pt/en/docapi/) | 414 | callable |
| Open Government, Queensland Government / opengovernmentqueenslandgovernment | [GET](https://www.data.qld.gov.au/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.data.qld.gov.au/api/3/action/help_show?name=package_search) | 1158 | callable |
| Open Government, Saudi Arabia / opengovernmentsaudiarabia | [GET](https://data.gov.sa/) | 0 | timeout / timeout | unknown | 371 | discovery |
| Open Government, Singapore / opengovernmentsingapore | [GET](https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast) | 200 | ok / ok_json | [free](https://guide.data.gov.sg/developer-guide/api-overview/api-rate-limits) | 291 | callable |
| Open Government, Slovakia / opengovernmentslovakia | [GET](https://data.gov.sk/en/) | 302 | redirect_https / redirect_not_approved | unknown | 202 | discovery |
| Open Government, Slovenia / opengovernmentslovenia | [GET](https://podatki.gov.si/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://podatki.gov.si/api/3/action/help_show?name=package_search) | 529 | callable |
| Open Government, South Australian Government / opengovernmentsouthaustraliangovernment | [GET](https://data.sa.gov.au/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.sa.gov.au/data/api/3/action/help_show?name=package_search) | 1590 | callable |
| Open Government, Spain / opengovernmentspain | [GET](https://datos.gob.es/apidata/catalog/dataset.json?_pageSize=1) | 200 | ok / ok_json | [free](https://datos.gob.es/en/apidata) | 161 | callable |
| Open Government, Sweden / opengovernmentsweden | [GET](https://www.dataportal.se/en/dataservice/91_29789/api-for-the-statistical-database/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2188 | discovery |
| Open Government, Taiwan / opengovernmenttaiwan | [GET](https://data.gov.tw/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2861 | discovery |
| Open Government, UK / opengovernmentuk | [GET](https://ckan.publishing.service.gov.uk/api/3/action/package_search?rows=1&fl=id,name,title,license_id) | 200 | ok / ok_json | [free](https://www.data.gov.uk/about/) | 266 | callable |
| Open Government, USA / opengovernmentusa | [GET](https://www.data.gov/) | 301 | redirect_https / redirect_not_approved | unknown | 875 | discovery |
| Open Government, Victoria State Government / opengovernmentvictoriastategovernment | [GET](https://discover.data.vic.gov.au/api/3/action/package_search?rows=1&fl=id,name,title,license_id) | 200 | ok / ok_json | [free](https://www.data.vic.gov.au/copyright-datavic) | 2940 | callable |
| Open Government, West Australia / opengovernmentwestaustralia | [GET](https://catalogue.data.wa.gov.au/api/3/action/package_search?rows=1&fl=id,name,title,license_id&fq=license_id%3Acc-by) | 200 | ok / ok_json | [free](https://catalogue.data.wa.gov.au/en/dataset/mining-tenements-dmirs-003) | 1823 | callable |
| Open Power System Data / openpowersystemdata | [GET](https://open-power-system-data.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 236 | discovery |
| Open Topo Data / opentopodata | [GET](https://api.opentopodata.org/v1/test-dataset?locations=56,123) | 200 | ok / ok_json | [free](https://www.opentopodata.org/) | 236 | callable |
| Open Trivia / opentrivia | [GET](https://opentdb.com/api.php?amount=1&type=multiple) | 200 | ok / ok_json | [free](https://opentdb.com/api_config.php) | 634 | callable |
| Open Trivia Database / opentrivia | [GET](https://opentdb.com/api.php?amount=1&type=multiple) | 200 | duplicate / duplicate | [free](https://opentdb.com/api_config.php) | - | alias of opentrivia |
| Open Trivia DB / opentrivia | [GET](https://opentdb.com/api.php?amount=1&type=multiple) | 200 | duplicate / duplicate | [free](https://opentdb.com/api_config.php) | - | alias of opentrivia |
| Open-Meteo / openmeteo | [GET](https://open-meteo.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 119 | discovery |
| openAFRICA / openafrica | [GET](https://africaopendata.org/) | 301 | redirect_https / redirect_not_approved | unknown | 100 | discovery |
| OpenAPI Generator / openapigenerator | [GET](https://api.openapi-generator.tech/api/gen/clients) | 200 | ok / ok_json | [free](https://openapi-generator.tech/docs/online/) | 411 | callable |
| OpenCitations / opencitations | [GET](https://api.opencitations.net/index/v2/citation-count/doi:10.1108/jd-12-2013-0166) | 200 | ok / ok_json | [free](https://opencitations.net/index/api/v2) | 401 | callable |
| OpenCitations API / opencitations | [GET](https://api.opencitations.net/index/v2/citation-count/doi:10.1108/jd-12-2013-0166) | 200 | duplicate / duplicate | [free](https://opencitations.net/index/api/v2) | - | alias of opencitations |
| Opendatasoft API / opendatasoftapi | [GET](https://help.opendatasoft.com/apis/ods-search-v2/) | 404 | wrong_base_url_path / http_error | [free](https://help.opendatasoft.com/apis/ods-search-v2) | 322 | discovery |
| OpenDota / opendota | [GET](https://api.opendota.com/api/heroes) | 200 | ok / ok_json | [free](https://docs.opendota.com/) | 216 | callable |
| OpenFDA Drug / fda | [GET](https://api.fda.gov/food/enforcement.json?limit=1) | 200 | duplicate / duplicate | [free](https://open.fda.gov/apis/authentication/) | - | alias of fda |
| openFDA Drug Labels / fda | [GET](https://api.fda.gov/food/enforcement.json?limit=1) | 200 | duplicate / duplicate | [free](https://open.fda.gov/apis/authentication/) | - | alias of fda |
| OpenHolidays / openholidays | [GET](https://openholidaysapi.org/PublicHolidays?countryIsoCode=SE&validFrom=2026-01-01&validTo=2026-01-02) | 200 | ok / ok_json | [free](https://www.openholidaysapi.org/en/) | 170 | callable |
| OpenHolidays API / openholidays | [GET](https://openholidaysapi.org/PublicHolidays?countryIsoCode=SE&validFrom=2026-01-01&validTo=2026-01-02) | 200 | duplicate / duplicate | [free](https://www.openholidaysapi.org/en/) | - | alias of openholidays |
| OpenIndoor / openindoor | [GET](https://openindoor.io/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://openindoor.io) | 1576 | discovery |
| OpenLEI API / openleiapi | [GET](https://api.gleif.org/api/v1/lei-records?page%5Bsize%5D=1) | 200 | ok / ok_json | [free](https://www.gleif.org/en/meta/lei-data-terms-of-use) | 363 | callable |
| OpenLigaDB / openligadb | [GET](https://api.openligadb.de/getavailableleagues) | 200 | ok / ok_json | [free](https://www.openligadb.de/) | 448 | callable |
| OpenLigaDB API / openligadb | [GET](https://api.openligadb.de/getavailableleagues) | 200 | duplicate / duplicate | [free](https://www.openligadb.de/) | - | alias of openligadb |
| OpenSanctions / opensanctions | [GET](https://www.opensanctions.org/docs/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 205 | discovery |
| openSenseMap / opensensemap | [GET](https://api.opensensemap.org/stats) | 200 | ok / ok_json | [free](https://docs.opensensemap.org/) | 289 | callable |
| OpenStreetMap Nominatim / openstreetmapnominatim | [GET](https://nominatim.org/release-docs/develop/api/) | 403 | unresolved / access_denied | [free](https://nominatim.org/release-docs/develop/api) | 218 | discovery |
| OpenStreetMap Nominatim API / nominatim | [GET](https://nominatim.org/release-docs/latest/api/Overview/) | 200 | duplicate / duplicate | [free](https://nominatim.org/release-docs/latest/api/Overview) | - | discovery |
| OpenTripPlanner / opentripplanner | [GET](https://opentripplanner.org/) | 301 | redirect_https / redirect_not_approved | unknown | 74 | discovery |
| OpenVisionAPI / openvisionapi | [GET](https://openvisionapi.com/) | 0 | redirect_https / tls_error | unknown | 174 | discovery |
| OpenWeatherMap API / openweathermapapi | [GET](https://openweathermap.org/api/) | 0 | needs_key / key_documented | unknown | 0 | discovery |
| OpenXR / openxr | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Öppna Data Sverige / ppnadatasverige | [GET](https://www.dataportal.se/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.dataportal.se) | 717 | discovery |
| Order Pizza REST API / orderpizzarestapi | [GET](https://order-pizza-api.herokuapp.com/api/ui/) | 404 | wrong_base_url_path / http_error | unknown | 211 | discovery |
| OSRM / osrm | [GET](https://osrm.org/) | 302 | redirect_https / redirect_not_approved | unknown | 960 | discovery |
| OSRS API / osrsapi | [GET](https://oldschool.runescape.wiki/w/API/) | 404 | wrong_base_url_path / http_error | unknown | 110 | discovery |
| Outlook Mail / outlookmail | [GET](https://msdn.microsoft.com/en-us/office/office365/api/mail-rest-operations/) | 301 | redirect_https / redirect_not_approved | unknown | 343 | discovery |
| OV-API Netherlands / ovapinetherlands | [GET](https://ovapi.nl/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 318 | discovery |
| OVHcloud AI Endpoints / ovhcloudaiendpoints | [GET](https://endpoints.ai.cloud.ovh.net/) | 301 | redirect_https / redirect_not_approved | unknown | 328 | discovery |
| Owen Wilson Wow / owenwilsonwow | [GET](https://owen-wilson-wow-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 523 | discovery |
| Owen Wilson Wow API / owenwilsonwowapi | [GET](https://owen-wilson-wow-api.onrender.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 261 | discovery |
| owo / owo | [GET](https://owo.vc/api/) | 404 | wrong_base_url_path / http_error | unknown | 242 | discovery |
| oyyi / oyyi | [GET](https://oyyi.xyz/docs/1.0/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2113 | discovery |
| Packagist / packagist | [GET](https://packagist.org/search.json?q=monolog&per_page=1) | 200 | ok / ok_json | [free](https://packagist.org/apidoc) | 263 | callable |
| PackML / packml | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Pantry / pantry | [GET](https://getpantry.cloud/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 596 | discovery |
| PDB / rcsbpdbapi | [GET](https://data.rcsb.org/rest/v1/core/entry/4HHB) | 200 | duplicate / duplicate | [free](https://data.rcsb.org/) | - | alias of rcsbpdbapi |
| PDF Blocks / pdfblocks | [GET](https://www.pdfblocks.com/docs/api/getting-started/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2185 | discovery |
| Peru Open Data API / opengovernmentperu | [GET](https://www.datosabiertos.gob.pe/) | 200 | duplicate / duplicate | [free](https://www.datosabiertos.gob.pe) | - | discovery |
| Phabricator / phabricator | [GET](https://phacility.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1036 | discovery |
| Philippines Open Data API / philippinesopendataapi | [GET](https://data.gov.ph/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gov.ph) | 1131 | discovery |
| PhishStats / phishstats | [GET](https://phishstats.info/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 358 | discovery |
| PHP-Noise / phpnoise | [GET](https://php-noise.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 165 | discovery |
| PHP-Noise Generator / phpnoise | [GET](https://php-noise.com/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Pinboard / pinboard | [GET](https://pinboard.in/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 998 | discovery |
| Pinterest API / pinterestapi | [GET](https://www.pinterest.com/login/?next=http%3A%2F%2Fdevelopers.pinterest.com%2Fapi_docs%2F) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 497 | discovery |
| Pirate Ipsum / pirateipsum | [GET](https://pirateipsum.me/api/) | 404 | wrong_base_url_path / http_error | unknown | 541 | discovery |
| Pirate Ship / pirateship | [GET](https://ship.pirateship.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 629 | discovery |
| Pixel Encounter / pixelencounter | [GET](https://pixelencounter.com/api/) | 0 | redirect_https / tls_error | unknown | 489 | discovery |
| PlaceBear / placebear | [GET](https://placebear.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 548 | discovery |
| PlaceDog / placedog | [GET](https://place.dog/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 422 | discovery |
| Placeholder.com / placeholdercom | [GET](https://placeholder.com/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://placeholder.com) | 151 | discovery |
| PlaceKeanu / placekeanu | [GET](https://placekeanu.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 466 | discovery |
| PlaceKitten / placekitten | [GET](https://placekitten.com/) | 521 | dead_upstream / http_error | unknown | 152 | discovery |
| Plaid Identity / plaididentity | [GET](https://plaid.com/docs/identity-verification/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 437 | discovery |
| PlayerDB / playerdb | [GET](https://playerdb.co/api/player/minecraft/Notch) | 200 | ok / ok_json | [free](https://playerdb.co/) | 108 | callable |
| Plusgiro / plusgiro | [GET](https://www.plusgirot.se/) | 0 | redirect_https / tls_error | unknown | 105 | discovery |
| PM2.5 Open Data Portal / pm25opendataportal | [GET](https://pm25.lass-net.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1454 | discovery |
| PM2.5 Portal / pm25opendataportal | [GET](https://pm25.lass-net.org/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Pokéapi / pokapi | [GET](https://pokeapi.co/api/v2/berry/1) | 200 | ok / ok_json | [free](https://pokeapi.co/docs/v2) | 231 | callable |
| Pokemon / pokapi | [GET](https://pokeapi.co/api/v2/berry/1) | 200 | duplicate / duplicate | [free](https://pokeapi.co/docs/v2) | - | alias of pokapi |
| Pokemon API / pokapi | [GET](https://pokeapi.co/api/v2/berry/1) | 200 | duplicate / duplicate | [free](https://pokeapi.co/docs/v2) | - | alias of pokapi |
| Pokémon TCG / pokemontcgapi | [GET](https://pokemontcg.io/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Pokemon TCG API / pokemontcgapi | [GET](https://pokemontcg.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 628 | discovery |
| Pokémon TCG API / pokemontcgapi | [GET](https://pokemontcg.io/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Postali / postali | [GET](https://postali.app/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1320 | discovery |
| Postcodes.io / postcodesio | [GET](https://api.postcodes.io/postcodes/SW1A1AA) | 200 | ok / ok_json | [free](https://postcodes.io/) | 201 | callable |
| PostgREST / postgrest | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Postman Echo / postmanecho | [GET](https://postman-echo.com/get?hello=apiclaw) | 200 | ok / ok_json | [free](https://www.postman.com/echo) | 255 | callable |
| PRH / prh | [GET](https://www.prh.fi/en/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1221 | discovery |
| PRH Finland / prhfinland | [GET](https://avoindata.prh.fi/opendata-ytj-api/v3/companies?businessId=0112038-9) | 200 | ok / ok_json | [free](https://www.prh.fi/en/companiesandorganisations/tietopalvelut/prhopendata.html) | 204 | callable |
| Prism / prism | [GET](https://stoplight.io/prism/) | 301 | redirect_https / redirect_not_approved | [free](https://stoplight.io/prism) | 292 | discovery |
| Pruvan / pruvan | [GET](https://pruvan.com/resources/pruvan-api/) | 301 | redirect_https / redirect_not_approved | unknown | 692 | discovery |
| PRV / prv | [GET](https://www.prv.se/sv/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 355 | discovery |
| Psychonauts / psychonauts | [GET](https://psychonauts-api.netlify.app/) | 401 | unresolved / access_denied | unknown | 174 | discovery |
| PubChem / pubchem | [GET](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2244/property/MolecularFormula/JSON) | 200 | ok / ok_json | [free](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest) | 505 | callable |
| PubChem API / pubchem | [GET](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2244/property/MolecularFormula/JSON) | 200 | duplicate / duplicate | [free](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest) | - | alias of pubchem |
| PunkAPI / punkapi | [GET](https://punkapi.com/) | 0 | dead_upstream / network_error | unknown | 35 | discovery |
| Purple Air / purpleair | [GET](https://www2.purpleair.com/) | 301 | redirect_https / redirect_not_approved | unknown | 597 | discovery |
| PyPI / pypi | [GET](https://pypi.org/pypi/pip/25.0/json) | 200 | ok / ok_json | [free](https://docs.pypi.org/api/json/) | 426 | callable |
| PyPI API / pypi | [GET](https://pypi.org/pypi/pip/25.0/json) | 200 | duplicate / duplicate | [free](https://docs.pypi.org/api/json/) | - | alias of pypi |
| QNAP Development Toolkit / qnapdevelopmenttoolkit | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| QOwnNotes / qownnotes | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| QR Code Generator / qrcode | [GET](https://goqr.me/api/) | 200 | duplicate / duplicate | [free](https://goqr.me/api) | - | discovery |
| QR code qrtag / qrcodeqrtag | [GET](https://www.qrtag.net/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 589 | discovery |
| Qrcode Monkey / qrcodemonkey | [GET](https://www.qrcode-monkey.com/qr-code-api-with-logo/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 345 | discovery |
| Quarantine / quarantine | [GET](https://quarantine.country/coronavirus/api/) | 0 | dead_upstream / network_error | unknown | 99 | discovery |
| Quarantine API / quarantine | [GET](https://quarantine.country/coronavirus/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Queimadas INPE / queimadasinpe | [GET](https://queimadas.dgi.inpe.br/queimadas/dados-abertos/) | 301 | redirect_https / redirect_not_approved | unknown | 957 | discovery |
| QuickChart / quickchart | [GET](https://quickchart.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 551 | discovery |
| QuickMocker / quickmocker | [GET](https://quickmocker.com/) | 0 | dead_upstream / network_error | unknown | 164 | discovery |
| quoteclear / quoteclear | [GET](https://quoteclear.web.app/) | 404 | wrong_base_url_path / http_error | unknown | 274 | discovery |
| Quotes on Design / quotesondesign | [GET](https://quotesondesign.com/wp-json/wp/v2/posts?per_page=1) | 200 | ok / ok_json | [free](https://quotesondesign.com/api/) | 505 | callable |
| Quran / quran | [GET](https://api.alquran.cloud/v1/ayah/1/en.asad) | 200 | ok / ok_json | [free](https://alquran.cloud/api) | 601 | callable |
| Quran API / quran | [GET](https://api.alquran.cloud/v1/ayah/1/en.asad) | 200 | duplicate / duplicate | [free](https://alquran.cloud/api) | - | alias of quran |
| Quran Cloud / quran | [GET](https://api.alquran.cloud/v1/ayah/1/en.asad) | 200 | duplicate / duplicate | [free](https://alquran.cloud/api) | - | alias of quran |
| Radicle / radicle | [GET](https://radicle.xyz/) | 307 | redirect_https / redirect_not_approved | unknown | 414 | discovery |
| Radio Browser / radiobrowser | [GET](https://de1.api.radio-browser.info/json/stations/topvote/1) | 200 | ok / ok_json | [free](https://www.radio-browser.info/) | 702 | callable |
| Raider / raider | [GET](https://raider.io/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 524 | discovery |
| Random Data / randomdata | [GET](https://random-data-api.com/api/v2/users?size=1) | 0 | dead_upstream / network_error | [free](https://random-data-api.com/documentation) | 792 | discovery |
| Random Facts / randomfacts | [GET](https://fungenerators.com/api/facts/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2653 | discovery |
| Random Useless Facts / randomuselessfacts | [GET](https://uselessfacts.jsph.pl/api/v2/facts/random?language=en) | 200 | ok / ok_json | [free](https://uselessfacts.jsph.pl/) | 356 | callable |
| RandomDog / randomdog | [GET](https://random.dog/woof.json) | 200 | ok / ok_json | [free](https://random.dog/) | 946 | callable |
| RandomDuck / randomduck | [GET](https://random-d.uk/api/random) | 200 | ok / ok_json | [free](https://random-d.uk/api) | 364 | callable |
| RandomFox / randomfox | [GET](https://randomfox.ca/floof/) | 200 | ok / ok_json | [free](https://randomfox.ca/) | 836 | callable |
| RandomUser / randomuser-c51bc20a | [GET](https://randomuser.me/api/?results=1&inc=name,nat&noinfo) | 200 | ok / ok_json | [free](https://randomuser.me/documentation) | 251 | callable |
| RATP Paris Transit / ratpparistransit | [GET](https://data.ratp.fr/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1562 | discovery |
| RBA Australia / rbaaustralia | [GET](https://www.rba.gov.au/statistics/tables/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1074 | discovery |
| RBA Australia Data / rbaaustralia | [GET](https://www.rba.gov.au/statistics/tables/) | 200 | duplicate / duplicate | unknown | - | discovery |
| RBNZ New Zealand Data / rbnznewzealanddata | [GET](https://www.rbnz.govt.nz/statistics/) | 403 | unresolved / access_denied | unknown | 386 | discovery |
| RCSB PDB API / rcsbpdbapi | [GET](https://data.rcsb.org/rest/v1/core/entry/4HHB) | 200 | ok / ok_json | [free](https://data.rcsb.org/) | 549 | callable |
| Redmine / redmine | [GET](https://redmine.org/) | 301 | redirect_https / redirect_not_approved | unknown | 484 | discovery |
| Rejseplanen / rejseplanen | [GET](https://help.rejseplanen.dk/hc/da/articles/214174465/) | 301 | redirect_https / redirect_not_approved | unknown | 1376 | discovery |
| RemoteOK API / remoteokapi | [GET](https://remoteok.com/api/) | 200 | gateway_block / body_limit | [free](https://remoteok.com/api) | 885 | discovery |
| Remotive / remotive | [GET](https://remotive.io/api-documentation/) | 301 | redirect_https / redirect_not_approved | unknown | 167 | discovery |
| Renfe Railway Spain / renferailwayspain | [GET](https://www.renfe.com/es/es/grupo-renfe/otras-webs/Open-data/) | 301 | redirect_https / redirect_not_approved | unknown | 190 | discovery |
| Represent by Open North / representbyopennorth | [GET](https://represent.opennorth.ca/representatives/?limit=1) | 200 | ok / ok_json | [free](https://represent.opennorth.ca/api/) | 1032 | callable |
| ReqRes / reqres | [GET](https://reqres.in/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 474 | discovery |
| ReqRes API / reqres | [GET](https://reqres.in/) | 200 | duplicate / duplicate | [free](https://reqres.in) | - | discovery |
| RescueGroups / rescuegroups | [GET](https://userguide.rescuegroups.org/display/APIDG/API+Developers+Guide+Home/) | 301 | redirect_https / redirect_not_approved | unknown | 936 | discovery |
| ReSmush.it / resmushit | [GET](https://resmush.it/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 637 | discovery |
| Resrobot / resrobot | [GET](https://www.trafiklab.se/api/resrobot-reseplanerare/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 474 | discovery |
| REST Countries / restcountries-e252b887 | [GET](https://restcountries.com/v3.1/all?fields=name) | 301 | redirect_https / redirect_not_approved | unknown | 321 | discovery |
| Reykjavik Open Data / reykjavikopendata | [GET](https://opingogn.is/api/) | 301 | redirect_https / redirect_not_approved | unknown | 602 | discovery |
| Rick and Morty / rickandmorty | [GET](https://rickandmortyapi.com/api/character/1) | 200 | ok / ok_json | [free](https://rickandmortyapi.com/documentation) | 305 | callable |
| Rick and Morty API / rickandmorty | [GET](https://rickandmortyapi.com/api/character/1) | 200 | duplicate / duplicate | [free](https://rickandmortyapi.com/documentation) | - | alias of rickandmorty |
| Riksarkivet / riksarkivet | [GET](https://riksarkivet.se/oppna-data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1150 | discovery |
| Riksbanken API / riksbankenapi | [GET](https://www.riksbank.se/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.riksbank.se) | 403 | discovery |
| Riksdagen Open Data / riksdagenopendata | [GET](https://data.riksdagen.se/dokumentlista/?sz=1&utformat=json) | 200 | ok / ok_json | [free](https://data.riksdagen.se/) | 523 | callable |
| RoboHash / robohash | [GET](https://robohash.org/) | 200 | unresolved / invalid_response | unknown | 674 | discovery |
| Rocket Pool / rocketpool | [GET](https://rocketpool.net/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 521 | discovery |
| RPS 101 / rps101 | [GET](https://rps101.pythonanywhere.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 935 | discovery |
| RSS feed to JSON / rssfeedtojson | [GET](https://rss-to-json-serverless-api.vercel.app/) | 402 | unresolved / http_error | unknown | 571 | discovery |
| RubyGems / rubygems | [GET](https://rubygems.org/api/v1/gems/rails.json) | 200 | ok / ok_json | [free](https://guides.rubygems.org/rubygems-org-api/) | 387 | callable |
| RuneScape / runescape | [GET](https://runescape.wiki/w/Application_programming_interface/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 366 | discovery |
| Rustybeer / rustybeer | [GET](https://rustybeer.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 1025 | discovery |
| Ruter / ruter | [GET](https://api.entur.io/journey-planner/) | 404 | wrong_base_url_path / http_error | unknown | 403 | discovery |
| Rwanda Locations / rwandalocations | [GET](https://rapidapi.com/victorkarangwa4/api/rwanda/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 6400 | discovery |
| Rwanda Open Data API / rwandaopendataapi | [GET](https://statistics.gov.rw/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://statistics.gov.rw) | 1802 | discovery |
| RxNorm / rxnorm | [GET](https://rxnav.nlm.nih.gov/REST/rxcui.json?name=aspirin) | 200 | ok / ok_json | [free](https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html) | 1246 | callable |
| SAMA Saudi Arabia / samasaudiarabia | [GET](https://www.sama.gov.sa/) | 0 | timeout / timeout | unknown | 599 | discovery |
| Samtrafiken / samtrafiken | [GET](https://www.samtrafiken.se/) | 301 | redirect_https / redirect_not_approved | unknown | 865 | discovery |
| Samuel L Ipsum / samuellipsum | [GET](https://slipsum.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 560 | discovery |
| Saudi Aramco Data / saudiaramcodata | [GET](https://www.aramco.com/en/investors/data-and-insights/) | 500 | dead_upstream / http_error | unknown | 2563 | discovery |
| SCB / scb | [GET](https://www.scb.se/vara-tjanster/oppna-data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 307 | discovery |
| SCB API / scbapi | [GET](https://www.scb.se/vara-tjanster/oppna-data/api-for-statistikdatabasen/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2072 | discovery |
| SCB Statistics Sweden / statisticsswedenscb | [GET](https://api.scb.se/OV0104/v1/doris/en/ssd) | 200 | duplicate / duplicate | [free](https://www.scb.se/en/services/open-data-api/) | - | alias of statisticsswedenscb |
| Scorecard / scorecard | [GET](https://securityscorecards.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 389 | discovery |
| Scryfall / scryfall | [GET](https://api.scryfall.com/cards/named?exact=Black%20Lotus) | 200 | ok / ok_json | [free](https://scryfall.com/docs/api) | 112 | callable |
| Scryfall MTG / scryfallmtg | [GET](https://scryfall.com/docs/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 135 | discovery |
| SEC EDGAR / secedgar | [GET](https://data.sec.gov/submissions/CIK0000320193.json) | 200 | ok / ok_json | [free](https://www.sec.gov/about/webmaster-frequently-asked-questions) | 251 | callable |
| SEC EDGAR API / secedgarapi | [GET](https://www.sec.gov/developer/) | 404 | wrong_base_url_path / http_error | unknown | 772 | discovery |
| SEC EDGAR Data / secedgardata | [GET](https://www.sec.gov/edgar/sec-api-documentation/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1966 | discovery |
| Semantic Scholar / semanticscholar | - | 0 | commercial_permission / reviewed_exclusion | [free](https://api.semanticscholar.org) | 0 | discovery |
| Senegal Open Data API / senegalopendataapi | [GET](https://data.gouv.sn/) | 0 | dead_upstream / network_error | [free](https://data.gouv.sn) | 202 | discovery |
| Seniverse / seniverse | [GET](https://www.seniverse.com/doc/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2494 | discovery |
| Serialif Color / serialifcolor | [GET](https://color.serialif.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 446 | discovery |
| Shanbay / shanbay | [GET](https://www.shanbay.com/help/developer/api_v1/) | 0 | timeout / timeout | unknown | 326 | discovery |
| ShapeShift API / shapeshiftapi | [GET](https://shapeshift.io/) | 0 | dead_upstream / network_error | unknown | 115 | discovery |
| SHARE / share | [GET](https://share.osf.io/api/v2/) | 406 | unresolved / http_error | unknown | 248 | discovery |
| Sharp / sharp | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Shepherd.js / shepherdjs | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Shields / shields | [GET](https://shields.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 220 | discovery |
| Shields.io / shields | [GET](https://shields.io/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Signal Protocol / signalprotocol | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://signal.org) | 0 | discovery |
| Sigstore / sigstore | [GET](https://sigstore.dev/) | 301 | not_hosted_api / reviewed_exclusion | unknown | 360 | discovery |
| SilverBullet / silverbullet | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Singapore Data API / singaporedataapi | [GET](https://data.gov.sg/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gov.sg) | 1242 | discovery |
| Sitebulb / sitebulb | [GET](https://sitebulb.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 190 | discovery |
| SL API / slapi | [GET](https://www.trafiklab.se/api/sl-realtidsinformation-4/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 31 | discovery |
| SLSA / slsa | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Smappee / smappee | [GET](https://smappee.atlassian.net/wiki/display/DEVAPI/SmappeeDevAPI+Home/) | 404 | wrong_base_url_path / http_error | unknown | 394 | discovery |
| Smash / smash | [GET](https://api.fromsmash.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 419 | discovery |
| SMHI / smhi | [GET](https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/98210.json) | 200 | ok / ok_json | [free](https://www.smhi.se/data/oppna-data) | 107 | callable |
| SMHI API / smhiapi | [GET](https://opendata.smhi.se/apidocs/) | 404 | wrong_base_url_path / http_error | unknown | 102 | discovery |
| SMHI Open Data / smhiopendata | [GET](https://opendata-download-metobs.smhi.se/api/) | 200 | unresolved / invalid_response | unknown | 916 | discovery |
| SMHI Weather API / smhiapi | [GET](https://opendata.smhi.se/apidocs/) | 404 | duplicate / duplicate | unknown | - | discovery |
| SMN Argentina API / smnargentinaapi | [GET](https://www.smn.gob.ar/) | 403 | unresolved / access_denied | [free](https://www.smn.gob.ar) | 144 | discovery |
| SNB Switzerland / snbswitzerland | [GET](https://data.snb.ch/) | 400 | unresolved / http_error | unknown | 309 | discovery |
| SNB Switzerland Data / snbswitzerlanddata | [GET](https://data.snb.ch/en/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2040 | discovery |
| Songsterr / songsterr | [GET](https://www.songsterr.com/a/wa/api/) | 404 | wrong_base_url_path / http_error | unknown | 1303 | discovery |
| South Africa Data API / southafricadataapi | [GET](https://data.gov.za/) | 0 | dead_upstream / network_error | [free](https://data.gov.za) | 1475 | discovery |
| South African Reserve Bank / southafricanreservebank | [GET](https://www.resbank.co.za/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2887 | discovery |
| Spaceflight News / spaceflightnews | [GET](https://api.spaceflightnewsapi.net/v4/articles/?limit=1) | 200 | ok / ok_json | [free](https://thespacedevs.com/privacy) | 535 | callable |
| SpaceX / spacex | [GET](https://api.spacexdata.com/v4/launches/latest) | 0 | timeout / timeout | [free](https://github.com/r-spacex/SpaceX-API) | 20185 | discovery |
| Spain INE Statistics / spanishineapi | [GET](https://servicios.ine.es/wstempus/js/ES/OPERACIONES_DISPONIBLES) | 200 | duplicate / duplicate | [free](https://www.ine.es/datosabiertos/) | - | alias of spanishineapi |
| Spanish random names / spanishrandomnames | [GET](https://random-names-api.herokuapp.com/public/) | 404 | wrong_base_url_path / http_error | unknown | 309 | discovery |
| Spanish random words / spanishrandomwords | [GET](https://palabras-aleatorias-public-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 205 | discovery |
| Squiggle / squiggle | [GET](https://api.squiggle.com.au/?q=teams;team=1) | 200 | ok / ok_json | [free](https://api.squiggle.com.au/) | 383 | callable |
| SSB / ssb | [GET](https://www.ssb.no/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 626 | discovery |
| SSB Norway / ssbnorway | [GET](https://data.ssb.no/api/v0/) | 410 | unresolved / http_error | unknown | 256 | discovery |
| Stakdek QR Generator / stakdekqrgenerator | [GET](https://api.stakdek.de/blog?id=1006) | 0 | timeout / timeout | unknown | 10055 | discovery |
| STAPI Star Trek / stapistartrek | [GET](https://stapi.co/api-documentation/) | 404 | wrong_base_url_path / http_error | unknown | 271 | discovery |
| Star Trek API (STAPI) / stapistartrek | [GET](https://stapi.co/api-documentation/) | 404 | duplicate / duplicate | unknown | - | discovery |
| StatBel Belgium / statbelbelgium | [GET](https://statbel.fgov.be/en/open-data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1788 | discovery |
| Statically / statically | [GET](https://statically.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 319 | discovery |
| Statistics Denmark / statisticsdenmark | [GET](https://dst.dk/) | 301 | redirect_https / redirect_not_approved | unknown | 1091 | discovery |
| Statistics Finland / statisticsfinland | [GET](https://pxweb2.stat.fi/PXWeb/api/v1/en/StatFin) | 200 | ok / ok_json | [free](https://stat.fi/en/statistics/open-data) | 365 | callable |
| Statistics Norway / statisticsnorway | [GET](https://data.ssb.no/api/v0/en/table/?query=07459) | 200 | ok / ok_json | [free](https://www.ssb.no/en/api) | 352 | callable |
| Statistics Sweden / statisticsswedenscb | [GET](https://api.scb.se/OV0104/v1/doris/en/ssd) | 200 | duplicate / duplicate | [free](https://www.scb.se/en/services/open-data-api/) | - | alias of statisticsswedenscb |
| Statistics Sweden (SCB) / statisticsswedenscb | [GET](https://api.scb.se/OV0104/v1/doris/en/ssd) | 200 | ok / ok_json | [free](https://www.scb.se/en/services/open-data-api/) | 219 | callable |
| Stoplight Prism / stoplightprism | [GET](https://stoplight.io/open-source/prism/) | 301 | redirect_https / redirect_not_approved | [free](https://stoplight.io/open-source/prism) | 245 | discovery |
| Stromberg Quotes / strombergquotes | [GET](https://www.stromberg-api.de/) | 301 | redirect_https / redirect_not_approved | unknown | 206 | discovery |
| Studio Ghibli / studioghibli | [GET](https://ghibliapi.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 539 | discovery |
| Studio Ghibli API / studioghibliapi | [GET](https://ghibliapi.vercel.app/films) | 200 | ok / ok_json | [free](https://ghibliapi.vercel.app) | 253 | callable |
| Sunrise and Sunset / sunriseandsunset | [GET](https://sunrise-sunset.org/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1193 | discovery |
| Sunrise-Sunset API / sunrisesunsetapi | [GET](https://api.sunrise-sunset.org/json?lat=59.3293&lng=18.0686&formatted=0) | 200 | ok / ok_json | [free](https://sunrise-sunset.org/api) | 234 | callable |
| SunriseSunset.io / sunrisesunsetio | [GET](https://api.sunrisesunset.io/json?lat=38.9&lng=-77) | 200 | ok / ok_json | [free](https://sunrisesunset.io/api/) | 157 | callable |
| Suomi.fi / suomifi | [GET](https://www.suomi.fi/palvelut/apis/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1173 | discovery |
| SuredBits / suredbits | [GET](https://suredbits.com/api/) | 522 | dead_upstream / http_error | unknown | 19574 | discovery |
| Svea / svea | [GET](https://www.svea.com/se/sv/foretag/integrationer/) | 404 | wrong_base_url_path / http_error | unknown | 1070 | discovery |
| Sveriges Dataportal / sverigesdataportal | [GET](https://www.dataportal.se/api/) | 404 | wrong_base_url_path / http_error | unknown | 1170 | discovery |
| SVN API / svnapi | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://subversion.apache.org/docs/api/1.8) | 0 | discovery |
| SWAPI GraphQL / swapigraphql | [GET](https://graphql.org/swapi-graphql/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 250 | discovery |
| SWAPI Star Wars / swapistarwars | [GET](https://www.swapi.tech/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 526 | discovery |
| Sweden Data API / ppnadatasverige | [GET](https://www.dataportal.se/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Swedish Parliament / swedishparliament | [GET](https://data.riksdagen.se/) | 301 | redirect_https / redirect_not_approved | unknown | 224 | discovery |
| Swiss Federal Stats / swissfederalstats | [GET](https://www.pxweb.bfs.admin.ch/api/v1/en/) | 200 | ok / ok_json | [free](https://www.bfs.admin.ch/bfs/en/home/services/ogd.html) | 1036 | callable |
| Swisstopo Geodata / swisstopogeodata | [GET](https://api3.geo.admin.ch/) | 302 | gateway_block / gateway_block | unknown | 123 | discovery |
| Syft / grype | - | 0 | duplicate / duplicate | unknown | - | discovery |
| Taiga / taiga | [GET](https://taiga.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 625 | discovery |
| Taiwan Open Data API / opengovernmenttaiwan | [GET](https://data.gov.tw/) | 200 | duplicate / duplicate | [free](https://data.gov.tw) | - | discovery |
| Taylor Swift API / taylorswiftapi | [GET](https://taylor.rest/) | 0 | dead_upstream / network_error | [free](https://taylor.rest) | 54 | discovery |
| TCGdex Pokémon / tcgdexpokmon | [GET](https://www.tcgdex.dev/) | 301 | redirect_https / redirect_not_approved | unknown | 255 | discovery |
| TCGdex Pokémon TCG / tcgdexpokmon | [GET](https://www.tcgdex.dev/) | 301 | duplicate / duplicate | unknown | - | discovery |
| Teambition / teambition | [GET](https://www.teambition.com/developer/open-platform/) | 302 | gateway_block / gateway_block | unknown | 2241 | discovery |
| Techy / techy | [GET](https://techy-api.vercel.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 277 | discovery |
| Techy API / techy | [GET](https://techy-api.vercel.app/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Telegram API / telegramapi | [GET](https://core.telegram.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 211 | discovery |
| Tenders Hungary / tendershungary | [GET](https://tenders.guru/hu/api/) | 0 | timeout / timeout | unknown | 10302 | discovery |
| Tenders in Hungary / tendershungary | [GET](https://tenders.guru/hu/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Tenders in Poland / tendersinpoland | [GET](https://tenders.guru/pl/api/) | 0 | timeout / timeout | unknown | 20002 | discovery |
| Tenders in Romania / tendersinromania | [GET](https://tenders.guru/ro/api/) | 0 | timeout / timeout | unknown | 20001 | discovery |
| Tenders in Spain / tendersinspain | [GET](https://tenders.guru/es/api/) | 0 | timeout / timeout | unknown | 20590 | discovery |
| Tenders in Ukraine / tendersinukraine | [GET](https://tenders.guru/ua/api/) | 0 | timeout / timeout | unknown | 20001 | discovery |
| Tenders Poland / tendersinpoland | [GET](https://tenders.guru/pl/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Tenders Romania / tendersinromania | [GET](https://tenders.guru/ro/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Tenders Spain / tendersinspain | [GET](https://tenders.guru/es/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Tenders Ukraine / tendersinukraine | [GET](https://tenders.guru/ua/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Terraform Registry / terraformregistry | [GET](https://registry.terraform.io/v1/providers?limit=1) | 200 | ok / ok_json | [free](https://registry.terraform.io) | 296 | callable |
| TETR.IO / tetrio | [GET](https://tetr.io/about/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 292 | discovery |
| TextMate / textmate | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Thailand Open Data API / thailandopendataapi | [GET](https://data.go.th/) | 403 | unresolved / access_denied | [free](https://data.go.th) | 208 | discovery |
| The Null Pointer / thenullpointer | [GET](https://0x0.st/) | 200 | unresolved / invalid_response | unknown | 405 | discovery |
| The SMS Works / thesmsworks | [GET](https://thesmsworks.co.uk/sms-api/) | 404 | wrong_base_url_path / http_error | unknown | 283 | discovery |
| They Said So Quotes / theysaidsoquotes | [GET](https://theysaidso.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1419 | discovery |
| Things API / thingsapi | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Thirukkural / thirukkural | [GET](https://api-thirukkural.web.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 229 | discovery |
| This Person Does not Exist / thispersondoesnotexist | [GET](https://thispersondoesnotexist.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 195 | discovery |
| Thread / thread | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| ThronesApi / thronesapi | [GET](https://thronesapi.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 881 | discovery |
| Thumbor / thumbor | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| TLE / tle | [GET](https://tle.ivanstanojevic.me/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 497 | discovery |
| TLE API / tle | [GET](https://tle.ivanstanojevic.me/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Today in History API / todayinhistoryapi | [GET](https://history.muffinlabs.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1699 | discovery |
| Toodledo / toodledo | [GET](https://api.toodledo.com/3/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 475 | discovery |
| Toolcarton / toolcarton | [GET](https://testimonialapi.toolcarton.com/) | 0 | dead_upstream / network_error | unknown | 108 | discovery |
| TradingView / tradingview | [GET](https://tradingview.com/) | 301 | redirect_https / redirect_not_approved | [free](https://tradingview.com) | 348 | discovery |
| Trafikverket Open API / trafikverketopenapi | [GET](https://api.trafikinfo.trafikverket.se/) | 404 | wrong_base_url_path / http_error | unknown | 180 | discovery |
| Traitify / traitify | [GET](https://app.traitify.com/developer/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 818 | discovery |
| Transfermarkt API / transfermarktapi | [GET](https://transfermarkt-api.vercel.app/) | 402 | unresolved / http_error | unknown | 559 | discovery |
| TransLink Queensland / translinkqueensland | [GET](https://translink.com.au/about-translink/open-data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 3590 | discovery |
| Transport for Auckland, New Zealand / transportforaucklandnewzealand | [GET](https://dev-portal.at.govt.nz/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2280 | discovery |
| Transport for Budapest, Hungary / transportforbudapesthungary | [GET](https://bkkfutar.docs.apiary.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 16788 | discovery |
| Transport for Czech Republic / transportforczechrepublic | [GET](https://www.chaps.cz/eng/products/idos-internet/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1251 | discovery |
| Transport for Switzerland / transportforswitzerland | [GET](https://transport.opendata.ch/v1/locations?query=Basel&fields%5B%5D=stations/id&fields%5B%5D=stations/name) | 200 | ok / ok_json | [free](https://transport.opendata.ch/) | 403 | callable |
| Transport for United States / transportforunitedstates | [GET](https://retro.umoiq.com/xmlFeedDocs/NextBusXMLFeed.pdf/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 984 | discovery |
| transport.rest / transportrest | [GET](https://v6.db.transport.rest/locations?query=Berlin&results=1) | 503 | timeout / timeout | [free](https://v6.db.transport.rest/api.html) | 20004 | discovery |
| Trivy / trivy | [GET](https://trivy.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 242 | discovery |
| Tronald Dump / tronalddump | [GET](https://www.tronalddump.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1075 | discovery |
| Tunisia Open Data API / tunisiaopendataapi | [GET](https://catalog.agridata.tn/api/3/action/package_search?rows=1) | 200 | unresolved / customer_gateway_failed | [free](https://catalog.agridata.tn) | 444 | discovery |
| TVMaze API / tvmazeapi | [GET](https://tvmaze.com/api/) | 301 | redirect_https / redirect_not_approved | unknown | 191 | discovery |
| Uganda Open Data API / ugandaopendataapi | [GET](https://data.ug/) | 301 | redirect_https / redirect_not_approved | [free](https://data.ug) | 129 | discovery |
| UI Avatars / uiavatars | [GET](https://ui-avatars.com/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://ui-avatars.com) | 214 | discovery |
| UK Bank Holidays / ukbankholidays | [GET](https://www.gov.uk/bank-holidays.json) | 200 | ok / ok_json | [free](https://www.gov.uk/bank-holidays) | 118 | callable |
| UK Government / opengovernmentuk | [GET](https://ckan.publishing.service.gov.uk/api/3/action/package_search?rows=1&fl=id,name,title,license_id) | 200 | duplicate / duplicate | [free](https://www.data.gov.uk/about/) | - | alias of opengovernmentuk |
| UK Government API / opengovernmentuk | [GET](https://ckan.publishing.service.gov.uk/api/3/action/package_search?rows=1&fl=id,name,title,license_id) | 200 | duplicate / duplicate | [free](https://www.data.gov.uk/about/) | - | alias of opengovernmentuk |
| Ultraleap Tracking / ultraleaptracking | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| umati / umati | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Umeå Open Data / umeopendata | [GET](https://opendata.umea.se/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1389 | discovery |
| UN Data / undata | [GET](https://data.un.org/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.un.org) | 428 | discovery |
| UN Data API / undata | [GET](https://data.un.org/) | 200 | duplicate / duplicate | [free](https://data.un.org) | - | discovery |
| UniProt API / uniprotapi | [GET](https://rest.uniprot.org/uniprotkb/search?query=accession%3AP69905&format=json&size=1&fields=accession) | 200 | ok / ok_json | [free](https://www.uniprot.org/help/programmatic_access) | 267 | callable |
| University of Oslo / universityofoslo | [GET](https://data.uio.no/) | 406 | unresolved / http_error | unknown | 207 | discovery |
| Unsplash It / unsplashit | [GET](https://unsplash.it/) | 301 | redirect_https / redirect_not_approved | unknown | 205 | discovery |
| Unsplash Resource / unsplashresource | [GET](https://source.unsplash.com/) | 503 | dead_upstream / http_error | unknown | 1201 | discovery |
| Urban Observatory / urbanobservatory | [GET](https://urbanobservatory.ac.uk/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 361 | discovery |
| URLhaus / urlhaus | [GET](https://urlhaus-api.abuse.ch/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 319 | discovery |
| Uruguay Open Data API / uruguayopendataapi | [GET](https://catalogodatos.gub.uy/api/3/action/package_search?rows=1) | 0 | timeout / timeout | [free](https://catalogodatos.gub.uy) | 733 | discovery |
| US Presidential Election Data by TogaTech / uspresidentialelectiondatabytogatech | [GET](https://uselection.togatech.org/api/) | 404 | wrong_base_url_path / http_error | unknown | 761 | discovery |
| USAspending / usaspending | [GET](https://api.usaspending.gov/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1018 | discovery |
| USAspending API / usaspending | [GET](https://api.usaspending.gov/) | 200 | duplicate / duplicate | unknown | - | discovery |
| USAspending.gov / usaspending | [GET](https://api.usaspending.gov/) | 200 | duplicate / duplicate | unknown | - | discovery |
| UserAgent / useragent | [GET](https://useragent.api.io/) | 0 | dead_upstream / network_error | unknown | 30 | discovery |
| USGS / usgs | [GET](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=1&orderby=time) | 200 | ok / ok_json | [free](https://earthquake.usgs.gov/fdsnws/event/1/) | 546 | callable |
| USGS Earthquake / usgsearthquake | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1302 | discovery |
| USGS Earthquake API / usgsearthquake | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | duplicate / duplicate | unknown | - | discovery |
| USGS Earthquake Hazards / usgsearthquake | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | duplicate / duplicate | unknown | - | discovery |
| USGS Earthquake Hazards Program / usgsearthquake | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | duplicate / duplicate | unknown | - | discovery |
| USGS Water Services / usgswaterservices | [GET](https://waterservices.usgs.gov/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 738 | discovery |
| USPTO / uspto | [GET](https://www.uspto.gov/learning-and-resources/open-data-and-mobility/) | 404 | wrong_base_url_path / http_error | unknown | 400 | discovery |
| USPTO API / uspto | [GET](https://www.uspto.gov/learning-and-resources/open-data-and-mobility/) | 404 | duplicate / duplicate | unknown | - | discovery |
| V2EX / v2ex | [GET](https://www.v2ex.com/p/7v9TEc53/) | 404 | wrong_base_url_path / http_error | unknown | 278 | discovery |
| Vadivelu HTTP Codes / vadiveluhttpcodes | [GET](https://vadivelu.anoram.com/) | 0 | dead_upstream / network_error | unknown | 25 | discovery |
| Valorant (non-official) / valorantapi | [GET](https://valorant-api.com/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Valorant API / valorantapi | [GET](https://valorant-api.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 370 | discovery |
| VCR.py / vcrpy | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://vcrpy.readthedocs.io) | 0 | discovery |
| Vector Express v2.0 / vectorexpressv20 | [GET](https://vector.express/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 127 | discovery |
| VeganCheck API / vegancheckapi | [GET](https://jokenetwork.de/vegancheck-api/) | 303 | redirect_https / redirect_not_approved | unknown | 196 | discovery |
| Velib metropolis, Paris, France / velibmetropolisparisfrance | [GET](https://www.velib-metropole.fr/donnees-open-data-gbfs-du-service-velib-metropole/) | 403 | unresolved / access_denied | unknown | 140 | discovery |
| Vercel AI SDK / vercelaisdk | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://sdk.vercel.ai) | 0 | discovery |
| ViaCep / viacep | [GET](https://viacep.com.br/ws/01001000/json/) | 200 | ok / ok_json | [free](https://viacep.com.br/) | 638 | callable |
| Vietnam Open Data API / vietnamopendataapi | [GET](https://data.gov.vn/) | 0 | dead_upstream / network_error | [free](https://data.gov.vn) | 35 | discovery |
| VIN Decoder / vindecoder | [GET](https://vpic.nhtsa.dot.gov/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 403 | discovery |
| Vinli / vinli | [GET](https://dev.vin.li/) | 0 | dead_upstream / network_error | unknown | 83 | discovery |
| Virushee / virushee | [GET](https://api.virushee.com/) | 0 | dead_upstream / network_error | unknown | 108 | discovery |
| VK API / vkapi | [GET](https://vk.com/dev/) | 302 | redirect_https / redirect_not_approved | unknown | 347 | discovery |
| Vy / vy | [GET](https://www.vy.no/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 770 | discovery |
| WallstreetBets / wallstreetbets | [GET](https://dashboard.nbshare.io/apps/reddit/api/) | 301 | redirect_https / redirect_not_approved | unknown | 227 | discovery |
| Warface (non-official) / warfacenonofficial | [GET](https://api.wfstats.cf/) | 0 | dead_upstream / network_error | unknown | 75 | discovery |
| Weatherstack / weatherstack | - | 0 | needs_key / reviewed_exclusion | unknown | 0 | discovery |
| Web3Modal / web3modal | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Website Carbon / websitecarbon | [GET](https://api.websitecarbon.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 115 | discovery |
| WebXR / webxr | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Weebly / weebly | [GET](https://cloud-developer.weebly.com/) | 404 | wrong_base_url_path / http_error | unknown | 121 | discovery |
| WePay / wepay | [GET](https://www.wepay.com/) | 0 | dead_upstream / network_error | unknown | 466 | discovery |
| Wger Workout Manager / wgerworkoutmanager | [GET](https://wger.de/api/v2/exerciseinfo/?limit=1) | 200 | ok / ok_json | [free](https://wger.readthedocs.io/en/latest/index.html) | 210 | callable |
| WhiskyHunter / whiskyhunter | [GET](https://whiskyhunter.net/api/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 295 | discovery |
| Whitepages Pro / whitepagespro | [GET](https://pro.whitepages.com/) | 301 | redirect_https / redirect_not_approved | unknown | 176 | discovery |
| WHO / who | [GET](https://who.int/) | 301 | redirect_https / redirect_not_approved | unknown | 313 | discovery |
| Wikipedia / wikipedia | [GET](https://en.wikipedia.org/w/api.php?action=query&format=json&titles=Earth&prop=info) | 200 | ok / ok_json | [free](https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use) | 431 | callable |
| Wikipedia API / wikipediaapi | [GET](https://en.wikipedia.org/w/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2716 | discovery |
| Wiktionary / wiktionary | [GET](https://en.wiktionary.org/w/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1676 | discovery |
| Wiktionary API / wiktionary | [GET](https://en.wiktionary.org/w/api.php/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Wolne Lektury / wolnelektury | [GET](https://wolnelektury.pl/api/kinds/) | 200 | ok / ok_json | [free](https://wolnelektury.pl/info/zasady-wykorzystania/) | 3819 | callable |
| Working Nomads / workingnomads | [GET](https://www.workingnomads.co/api/exposed_jobs/) | 301 | redirect_https / redirect_not_approved | unknown | 575 | discovery |
| Worktile / worktile | [GET](https://dev.worktile.com/document/overview/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1211 | discovery |
| World Bank / worldbank | [GET](https://api.worldbank.org/v2/country?format=json&per_page=1) | 200 | ok / ok_json | [free](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation) | 201 | callable |
| World Bank API / worldbank | [GET](https://api.worldbank.org/v2/country?format=json&per_page=1) | 200 | duplicate / duplicate | [free](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation) | - | alias of worldbank |
| World Flora Online / worldfloraonline | [GET](https://worldfloraonline.org/) | 0 | redirect_https / tls_error | unknown | 294 | discovery |
| WorldTimeAPI / worldtimeapi | [GET](https://worldtimeapi.org/api/timezone/Etc/UTC) | 0 | unresolved / network_error | [free](https://worldtimeapi.org/) | 177 | discovery |
| Wunderground / wunderground | [GET](https://www.wunderground.com/weather/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2199 | discovery |
| xColors / xcolors | [GET](https://x-colors.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 333 | discovery |
| xeno-canto / xenocanto | [GET](https://xeno-canto.org/explore/api/) | 404 | wrong_base_url_path / http_error | unknown | 455 | discovery |
| xMath / xmath | [GET](https://x-math.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 307 | discovery |
| XMPP / xmpp | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://xmpp.org) | 0 | discovery |
| Y.js / yjs | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Yandex / yandex | [GET](https://tech.yandex.com/maps/) | 301 | redirect_https / redirect_not_approved | unknown | 281 | discovery |
| Yes No / yesno | [GET](https://yesno.wtf/api) | 200 | ok / ok_json | [free](https://yesno.wtf/) | 241 | callable |
| Youku / youku | [GET](https://doc.open.youku.com/) | 0 | timeout / timeout | unknown | 389 | discovery |
| YR / metnorway | [GET](https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75) | 200 | ok / ok_json | [free](https://api.met.no/doc/TermsOfService) | 303 | callable |
| Yr.no / yrno | [GET](https://api.met.no/weatherapi/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 353 | discovery |
| Yu-Gi-Oh / yugioh-3632c0c5 | [GET](https://db.ygoprodeck.com/api/v7/cardinfo.php?id=6983839) | 200 | ok / ok_json | [free](https://ygoprodeck.com/api-guide/) | 227 | callable |
| Yu-Gi-Oh! API / yugioh-87bf1c6d | [GET](https://db.ygoprodeck.com/api-guide/) | 301 | duplicate / duplicate | unknown | - | discovery |
| Z-Wave / zwave | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Zed / zed | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Zen Quotes / zenquotes | [GET](https://zenquotes.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 630 | discovery |
| Zen Quotes API / zenquotesapi | [GET](https://zenquotes.io/api/) | 200 | ok / ok_json | [free](https://zenquotes.io/api) | 2324 | callable |
| Zettlr / zettlr | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Zigbee / zigbee | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Ziptastic / ziptastic | [GET](https://ziptasticapi.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 489 | discovery |
| ZMOK / zmok | [GET](https://zmok.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 749 | discovery |
| Zoo Animals / zooanimals | [GET](https://zoo-animal-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 734 | discovery |
| Zoo Animals API / zooanimals | [GET](https://zoo-animal-api.herokuapp.com/) | 404 | duplicate / duplicate | unknown | - | discovery |
| 0x API Protocol API / 0xapiprotocolapi | - | 0 | needs_key / reviewed_exclusion | [free](https://0xapi.finance/docs) | 0 | discovery |
| 18F / 18f | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| 1inch API / 1inchapi | - | 0 | needs_key / reviewed_exclusion | [free](https://docs.1inch.io) | 0 | discovery |
| 1inch Protocol API / 1inchprotocolapi | - | 0 | needs_key / reviewed_exclusion | [free](https://1inch.finance/docs) | 0 | discovery |
| 1pt / 1pt | [GET](https://github.com/1pt-co/api/blob/main/README.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| 4chan / 4chan | [GET](https://github.com/4chan/4chan-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| 7Timer! / 7timer | - | 0 | commercial_permission / reviewed_exclusion | unknown | 0 | discovery |
| Aave API / aaveapi | [GET](https://docs.aave.com/developers/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Aave Protocol API / aaveprotocolapi | [GET](https://aave.finance/docs/) | 301 | redirect_https / redirect_not_approved | [free](https://aave.finance/docs) | 182 | discovery |
| AcgClub / acgclub | [GET](https://github.com/Rabtman/AcgClub/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Adidas AG / adidasag | [GET](https://developers.adidas.com/services/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| administrative-divisons-db / administrativedivisonsdb | [GET](https://github.com/kamikazechaser/administrative-divisions-db/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Adorable Avatars / adorableavatars | [GET](https://avatars.adorable.io/) | 0 | dead_upstream / network_error | [free](http://avatars.adorable.io) | 58 | discovery |
| Advice Slip / adviceslip | [GET](https://api.adviceslip.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 285 | discovery |
| Aeris Weather / aerisweather | [GET](https://www.aerisweather.com/develop/) | 301 | redirect_https / redirect_not_approved | unknown | 193 | discovery |
| Alidayu / alidayu | [GET](https://www.alidayu.com/) | 404 | wrong_base_url_path / http_error | unknown | 1506 | discovery |
| Amap / amap | [GET](https://lbs.amap.com/) | 0 | timeout / timeout | unknown | 10244 | discovery |
| Amazon Alexa / amazonalexa | [GET](https://developer.amazon.com/public/solutions/alexa/alexa-voice-service/content/avs-api-overview/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Amazon Cloud Drive / amazonclouddrive | [GET](https://developer.amazon.com/amazon-drive/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Amazon Maps API / amazonmapsapi | [GET](https://developer.amazon.com/maps/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Amazon Mobile Ads / amazonmobileads | [GET](https://developer.amazon.com/mobile-ads/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Amazon S3 / amazons3 | [GET](https://aws.amazon.com/de/documentation/s3/) | 301 | gateway_block / gateway_block | unknown | 408 | discovery |
| Animal Crossing NH / animalcrossingnewhorizons | [GET](https://acnhapi.com/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Animal Crossing: New Horizons / animalcrossingnewhorizons | [GET](https://acnhapi.com/) | 0 | redirect_https / tls_error | unknown | 525 | discovery |
| AnimeChan / animechan | [GET](https://github.com/RocktimSaikia/anime-chan/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| AnimeFacts / animefacts | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Apple Vision Pro SDK / applevisionprosdk | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Apprise API / appriseapi | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Aramex / aramex | [GET](https://www.aramex.com/developers/aramex-apis/) | 403 | unresolved / access_denied | unknown | 113 | discovery |
| Arbeitnow / arbeitnow | [GET](https://documenter.getpostman.com/view/18545278/UVJbJdKh/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Archive.org / archiveorg | [GET](https://archive.org/metadata/opensource_movies?output=json&fields=metadata) | 200 | ok / ok_json | [free](https://archive.org/developers/md-read.html) | 718 | callable |
| Arize AI / arizeai | [GET](https://docs.arize.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Art Institute of Chicago / artinstituteofchicago | [GET](https://api.artic.edu/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1427 | discovery |
| Art Institute of Chicago API / artinstituteofchicagoapi | [GET](https://api.artic.edu/api/v1/artworks?limit=1&fields=id,title) | 200 | ok / ok_json | [free](https://api.artic.edu/docs/) | 1581 | callable |
| Arthur AI / arthurai | [GET](https://docs.arthur.ai/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| ARTIK Cloud / artikcloud | [GET](https://developer.artik.cloud/documentation/api-reference/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| AT&T M2X / attm2x | [GET](https://m2x.att.com/developer/documentation/v2/overview/) | 0 | dead_upstream / network_error | unknown | 89 | discovery |
| Atom Finance / atomfinance | [GET](https://docs.atom.finance/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Autochess VNG / autochessvng | [GET](https://github.com/didadadida93/autochess-vng-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Autochess VNG API / autochessvng | [GET](https://github.com/didadadida93/autochess-vng-api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| AutoGen / autogen | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://github.com/microsoft/autogen) | 0 | discovery |
| Automatic / automatic | [GET](https://developer.automatic.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Avatar Data / avatardata | [GET](https://www.avatardata.cn/Docs/) | 0 | redirect_https / tls_error | unknown | 628 | discovery |
| AviationAPI / aviationapi | [GET](https://api.aviationapi.com/v1/airports?apt=JFK) | 0 | dead_upstream / network_error | [free](https://docs.aviationapi.com/) | 101 | discovery |
| BackstopJS API / backstopjsapi | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| BACnet / bacnet | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Baidu API STORE / baiduapistore | [GET](https://apistore.baidu.com/) | 301 | redirect_https / redirect_not_approved | unknown | 2148 | discovery |
| Baidu Map / baidumap | [GET](https://lbsyun.baidu.com/index.php?title=webapi) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 3002 | discovery |
| Baidu Translate / baidutranslate | [GET](https://api.fanyi.baidu.com/api/trans/product/index/) | 301 | redirect_https / redirect_not_approved | unknown | 1672 | discovery |
| Baidu Yuyin / baiduyuyin | [GET](https://yuyin.baidu.com/docs/) | 301 | redirect_https / redirect_not_approved | unknown | 1576 | discovery |
| Balancer Protocol API / balancerprotocolapi | [GET](https://balancer.finance/docs/) | 301 | redirect_https / redirect_not_approved | [free](https://balancer.finance/docs) | 259 | discovery |
| Bambora / bambora | [GET](https://developer.bambora.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bannerbear / bannerbear | [GET](https://www.bannerbear.com/docs/) | 404 | wrong_base_url_path / http_error | unknown | 267 | discovery |
| Bark / bark | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://github.com/suno-ai/bark) | 0 | discovery |
| Barter.VG / bartervg | [GET](https://github.com/bartervg/barter.vg/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| BCLaws / bclaws | [GET](https://www.bclaws.gov.bc.ca/civix/template/complete/api/index.html/) | 406 | unresolved / http_error | unknown | 917 | discovery |
| Besin API (Turkish) / besinapiturkish | [GET](https://github.com/topics/food-database/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bible API wldeh / bibleapiwldeh | [GET](https://github.com/wldeh/bible-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bible-api / bibleapi | [GET](https://bible-api.com/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Bitcambio / bitcambio | [GET](https://nova.bitcambio.com.br/api/v3/) | 403 | unresolved / access_denied | unknown | 229 | discovery |
| Bitcoin / bitcoin | [GET](https://developer.bitcoin.org/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bitcoin Developer / bitcoin | [GET](https://developer.bitcoin.org/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Bitcoin Developer API / bitcoin | [GET](https://developer.bitcoin.org/) | 0 | duplicate / duplicate | unknown | - | discovery |
| BlockScore / blockscore | [GET](https://docs.blockscore.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| BNB Chain API / bnbchainapi | [GET](https://docs.bnbchain.org/docs/beaconchain/develop/api-reference/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bob's Burgers API / bobsburgersapi | [GET](https://bobsburgers-api.herokuapp.com/characters?limit=1) | 200 | ok / ok_json | [free](https://www.bobsburgersapi.com/documentation) | 485 | callable |
| BOM API / bomapi | [GET](https://www.bom.gov.au/catalogue/data-feeds.shtml/) | 403 | unresolved / access_denied | [free](http://www.bom.gov.au/catalogue/data-feeds.shtml) | 136 | discovery |
| Bond / bond | [GET](https://docs.bond.tech/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bookshare / bookshare | [GET](https://developer.bookshare.org/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bored API / boredapi | [GET](https://www.boredapi.com/documentation/) | 0 | dead_upstream / network_error | [free](https://www.boredapi.com/documentation) | 41 | discovery |
| BosonNLP / bosonnlp | [GET](https://docs.bosonnlp.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| BotsArchive / botsarchive | [GET](https://botsarchive.com/docs.html/) | 404 | wrong_base_url_path / http_error | unknown | 304 | discovery |
| Brazilian Chamber of Deputies Open Data / brazilianchamberofdeputiesopendata | [GET](https://dadosabertos.camara.leg.br/api/v2/partidos?itens=1) | 0 | timeout / timeout | [free](https://dadosabertos.camara.leg.br/faq/faq-home.html) | 10194 | discovery |
| Brazilian Vehicles and Prices / brazilianvehiclesandprices | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Breaking Bad / breakingbad | [GET](https://breakingbadapi.com/documentation/) | 0 | dead_upstream / network_error | unknown | 125 | discovery |
| Breaking Bad API / breakingbad | [GET](https://breakingbadapi.com/documentation/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Breaking Bad Quotes / breakingbadquotes | [GET](https://github.com/shevabam/breaking-bad-quotes/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| BreweryDB / brewerydb | [GET](https://www.brewerydb.com/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2511 | discovery |
| British National Bibliography / britishnationalbibliography | [GET](https://bnb.data.bl.uk/) | 0 | unresolved / network_error | unknown | 4229 | discovery |
| Budbee / budbee | [GET](https://developer.budbee.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Buffy the Vampire Slayer API / buffythevampireslayerapi | [GET](https://github.com/Thatskat/btvs-angel-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Caiyun Weather / caiyunweather | [GET](https://caiyunapp.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1428 | discovery |
| Canada Post / canadapost | [GET](https://www.canadapost.ca/cpo/mc/business/productsservices/developers/services/fundamentals.jsf/) | 302 | redirect_https / redirect_not_approved | unknown | 189 | discovery |
| CarQuery / carquery | [GET](https://www.carqueryapi.com/documentation/) | 0 | redirect_https / tls_error | unknown | 357 | discovery |
| Cartes.io / cartesio | [GET](https://github.com/M-Media-Group/Cartes.io/wiki/API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| CartoDB / cartodb | [GET](https://carto.com/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1496 | discovery |
| Cat Facts / catfacts | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Cat Ipsum / catipsum | [GET](https://www.catipsum.com/) | 0 | redirect_https / tls_error | unknown | 415 | discovery |
| Catalogopolis / catalogopolis | [GET](https://api.catalogopolis.xyz/docs/) | 0 | dead_upstream / network_error | unknown | 155 | discovery |
| Catch The Show / catchtheshow | [GET](https://catchtheshow.herokuapp.com/api/documentation/) | 404 | wrong_base_url_path / http_error | unknown | 553 | discovery |
| CBM Myanmar Forex / cbmmyanmarforex | [GET](https://forex.cbm.gov.mm/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 595 | discovery |
| CDC / cdc | [GET](https://data.cdc.gov/resource/bi63-dtpu.json?%24limit=1) | 200 | ok / ok_json | [free](https://catalog.data.gov/dataset/cdc-open-data-api) | 858 | callable |
| Census.gov / censusgov | - | 0 | needs_key / reviewed_exclusion | unknown | 0 | discovery |
| Cep.la / cepla | [GET](https://cep.la/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 657 | discovery |
| CERN Open Data / cernopendata | [GET](https://opendata.cern.ch/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 456 | discovery |
| Chainlink API / chainlinkapi | [GET](https://docs.chain.link/) | 0 | wrong_base_url_path / documentation_url | [free](https://docs.chain.link) | 0 | discovery |
| ChartLyrics / chartlyrics | [GET](https://www.chartlyrics.com/api.aspx/) | 0 | redirect_https / tls_error | unknown | 241 | discovery |
| Cheese Ipsum / cheeseipsum | [GET](https://www.cheeseipsum.co.uk/) | 301 | redirect_https / redirect_not_approved | unknown | 214 | discovery |
| ChEMBL API / chemblapi | [GET](https://www.ebi.ac.uk/chembl/api/data/molecule.json?limit=1) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/chembl/api/data/docs) | 3988 | callable |
| Chinese Character Web / chinesecharacterweb | [GET](https://ccdb.hemiola.com/) | 0 | redirect_https / tls_error | unknown | 563 | discovery |
| Chroma / chroma | [GET](https://docs.trychroma.com/) | 0 | wrong_base_url_path / documentation_url | [free](https://docs.trychroma.com) | 0 | discovery |
| Chronicling America / chroniclingamerica | [GET](https://chroniclingamerica.loc.gov/about/api/) | 308 | redirect_https / redirect_not_approved | unknown | 109 | discovery |
| Chuck Norris Database / chucknorrisdatabase | [GET](https://www.icndb.com/api/) | 301 | redirect_https / redirect_not_approved | unknown | 495 | discovery |
| Church Calendar / churchcalendar | [GET](https://calapi.inadiutorium.cz/) | 0 | dead_upstream / network_error | unknown | 72 | discovery |
| Ciprand / ciprand | [GET](https://github.com/polarspetroll/ciprand/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| City, Gdynia / citygdynia | [GET](https://otwartedane.gdynia.pl/en/api_doc.html/) | 404 | wrong_base_url_path / http_error | unknown | 1207 | discovery |
| City, Prague Open Data / citypragueopendata | [GET](https://opendata.praha.eu/en/) | 301 | redirect_https / redirect_not_approved | unknown | 183 | discovery |
| Citybikes / citybikes-5671f659 | [GET](https://citybik.es/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 387 | discovery |
| CitySDK / citysdk | [GET](https://www.citysdk.eu/citysdk-toolkit/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1203 | discovery |
| CleanURI / cleanuri | [GET](https://cleanuri.com/docs/) | 0 | timeout / timeout | unknown | 20014 | discovery |
| Cloud Machine Learning Engine / cloudmachinelearningengine | [GET](https://cloud.google.com/ml-engine/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1352 | discovery |
| Cloudflare Trace / cloudflaretrace | [GET](https://github.com/fawazahmed0/cloudflare-trace-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| CO2 Offset / co2offset | [GET](https://co2offset.io/api.html/) | 302 | redirect_https / redirect_not_approved | unknown | 184 | discovery |
| CO2 Offset API / co2offset | [GET](https://co2offset.io/api.html/) | 302 | duplicate / duplicate | unknown | - | discovery |
| Coactive AI / coactiveai | [GET](https://coactive.ai/developers/) | 301 | redirect_https / redirect_not_approved | unknown | 1195 | discovery |
| Codestral / codestral | [GET](https://docs.mistral.ai/capabilities/code_generation/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Codex / codex | [GET](https://github.com/Jaagrav/CodeX/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| CodeX Compiler / codex | [GET](https://github.com/Jaagrav/CodeX/) | 0 | duplicate / duplicate | unknown | - | discovery |
| CoinCap / coincap | [GET](https://docs.coincap.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| CoinDesk Bitcoin Price Index / coindeskbitcoinpriceindex | [GET](https://www.coindesk.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1051 | discovery |
| CoinDesk BPI / coindeskbitcoinpriceindex | [GET](https://www.coindesk.com/api/) | 200 | duplicate / duplicate | unknown | - | discovery |
| CoinGecko / coingecko | [GET](https://www.coingecko.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 3280 | discovery |
| CoinGecko API / coingeckoapi | [GET](https://www.coingecko.com/en/api/documentation/) | 301 | gateway_block / gateway_block | freemium | 4872 | discovery |
| CoinStats / coinstats | [GET](https://documenter.getpostman.com/view/5734027/RzZ6Hzr3?version=latest) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Collector Bank / collectorbank | [GET](https://developer.collectorbank.se/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Colormind / colormind | [GET](https://colormind.io/api-access/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 437 | discovery |
| ColourLovers / colourlovers | [GET](https://www.colourlovers.com/api/) | 403 | unresolved / access_denied | unknown | 1044 | discovery |
| Comic Vine / comicvine | [GET](https://comicvine.gamespot.com/api/documentation/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1630 | discovery |
| Comichron Data / comichrondata | [GET](https://github.com/comichron-data/api/) | 0 | wrong_base_url_path / documentation_url | [free](https://github.com/comichron-data/api) | 0 | discovery |
| Comichron Data API / comichrondata | [GET](https://github.com/comichron-data/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Commerce Layer / commercelayer | [GET](https://docs.commercelayer.io/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Community Transit / communitytransit | [GET](https://github.com/transitland/transitland-datastore/blob/master/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Compound API / compoundapi | [GET](https://compound.finance/docs/) | 302 | redirect_https / redirect_not_approved | unknown | 109 | discovery |
| Compound Protocol API / compoundapi | [GET](https://compound.finance/docs/) | 302 | duplicate / duplicate | [free](https://compound.finance/docs) | - | discovery |
| Concur Labs / concurlabs | [GET](https://developer.concur.com/api-reference/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Context.IO / contextio | [GET](https://context.io/) | 0 | dead_upstream / network_error | unknown | 448 | discovery |
| Continue / continue | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Convex Finance Protocol API / convexfinanceprotocolapi | [GET](https://convex.finance/docs/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://convex.finance/docs) | 537 | discovery |
| Coronavirus in the UK / coronavirusintheuk | [GET](https://coronavirus.data.gov.uk/details/developers-guide/) | 301 | redirect_https / redirect_not_approved | unknown | 118 | discovery |
| Corporate Buzz Words / corporatebuzzwords | [GET](https://github.com/sameerkumar18/corporate-bs-generator-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| CORS Proxy / corsproxy | [GET](https://github.com/burhanuday/cors-proxy/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Cosmos API / cosmosapi | [GET](https://docs.cosmos.network/main/modules/staking/05_client/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Country / country | [GET](https://country.is/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 122 | discovery |
| Country.io / countryio | [GET](https://country.io/) | 200 | wrong_base_url_path / html_instead_of_api | [free](http://country.io) | 272 | discovery |
| Country.io API / countryio | [GET](https://country.io/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Covid-19 / covid19 | [GET](https://github.com/M-Media-Group/Covid-19-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| COVID-19 Data / covid19 | [GET](https://github.com/M-Media-Group/Covid-19-API/) | 0 | duplicate / duplicate | unknown | - | discovery |
| COVID-19 Data API / covid19 | [GET](https://github.com/M-Media-Group/Covid-19-API/) | 0 | duplicate / duplicate | [free](https://github.com/M-Media-Group/Covid-19-API) | - | discovery |
| Covid-19 Live Data / covid19livedata | [GET](https://github.com/mathdroid/covid-19-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Covid-19 Philippines / covid19philippines | [GET](https://github.com/Simperfy/Covid-19-API-Philippines-DOH/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Cross Universe / crossuniverse | [GET](https://crossuniverse.psychpsyo.com/apiDocs.html/) | 522 | dead_upstream / http_error | unknown | 19748 | discovery |
| Crossref Metadata / crossrefmetadata | [GET](https://github.com/CrossRef/rest-api-doc/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Crossref Metadata Search / crossrefmetadata | [GET](https://github.com/CrossRef/rest-api-doc/) | 0 | duplicate / duplicate | unknown | - | discovery |
| CryptAPI / cryptapi | [GET](https://docs.cryptapi.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| ctrip / ctrip | [GET](https://u.ctrip.com/union/help/Termsofuse.aspx/) | 302 | redirect_https / redirect_not_approved | unknown | 694 | discovery |
| Cupcake Ipsum / cupcakeipsum | [GET](https://www.cupcakeipsum.com/) | 301 | redirect_https / redirect_not_approved | unknown | 177 | discovery |
| Currency-api / currencyapi | [GET](https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json) | 200 | ok / ok_json | [free](https://github.com/fawazahmed0/exchange-api) | 118 | callable |
| Curve Finance Protocol API / curve | [GET](https://api.curve.finance/v1/getETHprice) | 200 | duplicate / duplicate | [free](https://docs.curve.finance/developer/integration/api/curve-api/) | - | alias of curve |
| Czech Television / czechtelevision | [GET](https://www.ceskatelevize.cz/xml/tv-program/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1383 | discovery |
| Dangdang / dangdang | [GET](https://open.dangdang.com/) | 405 | unresolved / http_error | unknown | 1242 | discovery |
| Data.gov API / datagovapi | [GET](https://www.data.gov/developers/apis/) | 301 | redirect_https / redirect_not_approved | unknown | 899 | discovery |
| Daum Maps API / daummapsapi | [GET](https://apis.map.daum.net/) | 0 | dead_upstream / network_error | unknown | 78 | discovery |
| Deck of Cards / deckofcards | [GET](https://deckofcardsapi.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 619 | discovery |
| Dehash.lt / dehashlt | [GET](https://github.com/Dehash-lt/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Detox API / detoxapi | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| DeviantArt API / deviantartapi | [GET](https://www.deviantart.com/developers/) | 301 | gateway_block / gateway_block | unknown | 343 | discovery |
| DHL / dhl | [GET](https://www.dhl-usa.com/en/express/resource_center/integrated_shipping_solutions.html/) | 0 | timeout / timeout | unknown | 20109 | discovery |
| Dictum / dictum | [GET](https://github.com/fisenkodv/dictum/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Digimon TCG / digimontcg | [GET](https://documenter.getpostman.com/view/14059948/TzecB4fH/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Disease.sh / diseasesh | [GET](https://disease.sh/v3/covid-19/countries/Sweden?strict=true) | 200 | ok / ok_json | [free](https://disease.sh/docs/) | 182 | callable |
| District of Columbia Open Data / districtofcolumbiaopendata | [GET](https://opendata.dc.gov/pages/using-apis/) | 404 | wrong_base_url_path / http_error | unknown | 628 | discovery |
| Document Cloud / documentcloud | [GET](https://www.documentcloud.org/help/api/) | 301 | redirect_https / redirect_not_approved | unknown | 328 | discovery |
| Dog Facts / dogfacts | - | 0 | commercial_permission / reviewed_exclusion | unknown | 0 | discovery |
| Dog Facts API / dogfactsapi | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Doge-Meme / dogememe | [GET](https://api.doge-meme.lol/docs/) | 0 | dead_upstream / network_error | unknown | 187 | discovery |
| dondeEsta Family / dondeestafamily | [GET](https://docs.dondeesta.apiary.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Dotdigital / dotdigital | [GET](https://developer.dotdigital.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Dune / dune | [GET](https://github.com/ywalia01/dune-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Dune API / dune | [GET](https://github.com/ywalia01/dune-api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Dungeons and Dragons / dungeonsanddragons | [GET](https://www.dnd5eapi.co/docs/) | 302 | gateway_block / gateway_block | unknown | 511 | discovery |
| DWD API / dwdapi | [GET](https://www.dwd.de/DE/leistungen/opendata/opendata.html/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.dwd.de/DE/leistungen/opendata/opendata.html) | 1424 | discovery |
| Dyte / dyte | [GET](https://docs.dyte.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Economia.Awesome / economiaawesome | [GET](https://docs.awesomeapi.com.br/api-de-moedas/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Eden AI / edenai | [GET](https://docs.edenai.co/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| elong / elong | [GET](https://open.elong.com/home/index/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1349 | discovery |
| EmailRep / emailrep | [GET](https://docs.emailrep.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| EmojiHub / emojihub | [GET](https://github.com/cheatsnake/emojihub/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| envoice / envoice | [GET](https://www.envoice.in/reference/api/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 352 | discovery |
| Envoy / envoy | [GET](https://developers.envoy.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| EPA / epa | [GET](https://data.epa.gov/dmapservice/sems.envirofacts_site/0:1/json) | 200 | ok / ok_json | [free](https://www.epa.gov/web-policies-and-procedures/epa-disclaimers) | 1573 | callable |
| Ergast F1 / ergastf1 | [GET](https://ergast.com/mrd/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1114 | discovery |
| Ergast Formula 1 / ergastf1 | [GET](https://ergast.com/mrd/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Escape / escape | [GET](https://github.com/polarspetroll/EscapeAPI/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| ESP8266 Sensors API / esp8266sensorsapi | [GET](https://github.com/wouterds/esp8266-nodemcu-sensors/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| ExtendsClass JSON Storage / extendsclassjsonstorage | [GET](https://extendsclass.com/json-storage.html/) | 404 | wrong_base_url_path / http_error | unknown | 496 | discovery |
| EXUDE-API / exudeapi | [GET](https://uttesh.com/exude-api/) | 404 | wrong_base_url_path / http_error | unknown | 153 | discovery |
| Facebook API / facebookapi | [GET](https://developers.facebook.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Facebook Games Services / facebookgamesservices | [GET](https://developers.facebook.com/docs/games/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Facebook Login / facebooklogin | [GET](https://developers.facebook.com/docs/facebook-login/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| FakerAPI / fakerapi-db40a6a8 | [GET](https://fakerapi.it/en/) | 502 | dead_upstream / http_error | unknown | 1094 | discovery |
| FCC API / fccapi | [GET](https://www.fcc.gov/developers/) | 403 | unresolved / access_denied | unknown | 219 | discovery |
| Federal Register API / federalregisterapi | [GET](https://www.federalregister.gov/developers/api/v1/) | 302 | redirect_https / redirect_not_approved | unknown | 566 | discovery |
| Final Space / finalspace | [GET](https://finalspaceapi.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 395 | discovery |
| Final Space API / finalspaceapi | [GET](https://finalspaceapi.com/api/v0/character/1) | 200 | ok / ok_json | [free](https://finalspaceapi.com/docs/) | 12681 | callable |
| FishWatch / fishwatch | [GET](https://www.fishwatch.gov/developers/) | 301 | redirect_https / redirect_not_approved | unknown | 375 | discovery |
| FishWatch API / fishwatch | [GET](https://www.fishwatch.gov/developers/) | 301 | duplicate / duplicate | unknown | - | discovery |
| Fit-n-Bites API / fitnbitesapi | [GET](https://github.com/topics/food-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Flowise / flowise | [GET](https://docs.flowiseai.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| FOAAS / foaas | [GET](https://www.foaas.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 344 | discovery |
| Foam / foam | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| FollowUp.cc / followupcc | [GET](https://docs.followup.cc/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Food Standards Agency / foodstandardsagency | [GET](https://ratings.food.gov.uk/open-data/en-GB/) | 404 | wrong_base_url_path / http_error | unknown | 1720 | discovery |
| Foodish / foodish | [GET](https://github.com/surhud004/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Football Database / footballdatabase | [GET](https://github.com/oritzio/football-database/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Football Standings / footballstandings | [GET](https://github.com/azharimm/football-standings-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Forismatic / forismatic | [GET](https://forismatic.com/en/api/) | 520 | dead_upstream / http_error | unknown | 212 | discovery |
| Fortnox / fortnox | [GET](https://developer.fortnox.se/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Forza / forza | [GET](https://docs.forza-api.tk/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Free Url Shortener / freeurlshortener | [GET](https://ulvis.net/developer.html/) | 404 | wrong_base_url_path / http_error | unknown | 401 | discovery |
| Fruits API / fruitsapi | [GET](https://github.com/Franqsanz/fruits-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Fruits API GraphQL / fruitsapi | [GET](https://github.com/Franqsanz/fruits-api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Gaana / gaana | [GET](https://github.com/cyberboysumanjay/GaanaAPI/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Gaana API / gaana | [GET](https://github.com/cyberboysumanjay/GaanaAPI/) | 0 | duplicate / duplicate | unknown | - | discovery |
| gank.io / gankio | [GET](https://gank.io/api/) | 0 | timeout / timeout | unknown | 10844 | discovery |
| Geek-Jokes / geekjokes | [GET](https://github.com/sameerkumar18/geek-joke-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Gemini / gemini | [GET](https://docs.gemini.com/rest-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Gemini API / gemini | [GET](https://docs.gemini.com/rest-api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Gene Ontology API / geneontologyapi | [GET](https://api.geneontology.org/api/ontology/term/GO%3A0008150) | 200 | ok / ok_json | [free](https://geneontology.org/docs/go-citation-policy/) | 307 | callable |
| GeoApi / geoapi | [GET](https://api.gouv.fr/api/geoapi.html/) | 301 | redirect_https / redirect_not_approved | unknown | 387 | discovery |
| GeoApi France / geoapi | [GET](https://api.gouv.fr/api/geoapi.html/) | 301 | duplicate / duplicate | unknown | - | discovery |
| GeoNames / geonames | [GET](https://www.geonames.org/export/web-services.html/) | 404 | wrong_base_url_path / http_error | unknown | 776 | discovery |
| GitHub Authentication / githubauthentication | [GET](https://developer.github.com/guides/basics-of-authentication/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GitHub Licenses API / githublicensesapi | [GET](https://developer.github.com/v3/licenses/) | 0 | wrong_base_url_path / documentation_url | [free](https://developer.github.com/v3/licenses) | 0 | discovery |
| GitHub ReadMe Stats / githubreadmestats | [GET](https://github.com/anuraghazra/github-readme-stats/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GMX Protocol API / gmxprotocolapi | [GET](https://gmx.finance/docs/) | 0 | timeout / timeout | [free](https://gmx.finance/docs) | 10185 | discovery |
| Google AdSense / googleadsense | [GET](https://developers.google.com/adsense/?hl=en) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Assistant / googleassistant | [GET](https://developers.google.com/actions/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Barcode / googlebarcode | [GET](https://developers.google.com/vision/barcodes-overview?hl=en) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Charts / googlecharts | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Google Cloud Prediction / googlecloudprediction | [GET](https://cloud.google.com/prediction/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2327 | discovery |
| Google CustomSearch API / googlecustomsearchapi | [GET](https://developers.google.com/custom-search/json-api/v1/overview/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Fitness API / googlefitnessapi | [GET](https://developers.google.com/fit/?hl=en) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Fonts API / googlefontsapi | [GET](https://developers.google.com/fonts/?hl=en) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Maps Directions / googlemapsdirections | [GET](https://developers.google.com/maps/documentation/directions/overview/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Play Developer / googleplaydeveloper | [GET](https://developers.google.com/android-publisher/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Play Games Services / googleplaygamesservices | [GET](https://developers.google.com/games/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GoTiny / gotiny | [GET](https://github.com/robvanbakel/gotiny-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GovTrack / govtrack | [GET](https://www.govtrack.us/developers/api/) | 403 | unresolved / access_denied | unknown | 160 | discovery |
| Graph Countries / graphcountries | [GET](https://github.com/lennertVanSever/graphcountries/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GraphQL Pokemon / graphqlpokemon | [GET](https://github.com/favware/graphql-pokemon/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GTFS / gtfs | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://gtfs.org/documentation) | 0 | discovery |
| Guerrilla Mail / guerrillamail | [GET](https://www.guerrillamail.com/GuerrillaMailAPI.html/) | 404 | wrong_base_url_path / http_error | unknown | 422 | discovery |
| GurbaniNow / gurbaninow | [GET](https://github.com/GurbaniNow/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GW2Spidy / gw2spidy | [GET](https://github.com/rubensayshi/gw2spidy/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Hacker News / hackernews | [GET](https://github.com/HackerNews/API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Hacker News API / hackernewsapi | [GET](https://hacker-news.firebaseio.com/v0/item/8863.json) | 200 | ok / ok_json | [free](https://github.com/HackerNews/API) | 441 | callable |
| HackerNews / hackernews | [GET](https://github.com/HackerNews/API/) | 0 | duplicate / duplicate | unknown | - | discovery |
| HaoService / haoservice | [GET](https://www.haoservice.com/) | 0 | dead_upstream / network_error | unknown | 305 | discovery |
| Healthcare.gov / healthcaregov | [GET](https://www.healthcare.gov/accessibility.json) | 200 | ok / ok_json | [free](https://www.healthcare.gov/developers/) | 317 | callable |
| Helium / helium | [GET](https://docs.helium.com/api/blockchain/introduction/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Helium API / helium | [GET](https://docs.helium.com/api/blockchain/introduction/) | 0 | duplicate / duplicate | unknown | - | discovery |
| HERE Routing / hererouting | [GET](https://developer.here.com/documentation/routing-api/dev_guide/index.html/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Home Depot / homedepot | [GET](https://developer.homedepot.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Home8 / home8 | [GET](https://developer.home8systems.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Homey / homey | [GET](https://developers.athom.com/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Hong Kong Obervatory / hongkongobervatory | [GET](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en) | 200 | ok / ok_json | [free](https://data.gov.hk/en/terms-and-conditions) | 2744 | callable |
| HP Print / hpprint | [GET](https://developers.hp.com/printos/printos/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| HSL / hsl | [GET](https://digitransit.fi/en/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 234 | discovery |
| HTTPCat / httpcat | [GET](https://http.cat/) | 200 | duplicate / duplicate | unknown | - | discovery |
| HTTPDog / httpdog | [GET](https://http.dog/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Hume AI / humeai | [GET](https://dev.hume.ai/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2543 | discovery |
| Hyrule Compendium / hyrulecompendium | [GET](https://github.com/gadhagod/Hyrule-Compendium-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| IBGE / ibge | [GET](https://servicodados.ibge.gov.br/api/docs/) | 0 | redirect_https / tls_error | unknown | 1042 | discovery |
| Icelandic APIs / icelandicapis | [GET](https://docs.apis.is/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| iciba / iciba | [GET](https://open.iciba.com/?c=api) | 666 | dead_upstream / http_error | unknown | 1790 | discovery |
| iDigBio / idigbio | [GET](https://github.com/idigbio/idigbio-search-api/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| IMDbOT / imdbot | [GET](https://github.com/SpEcHiDe/IMDbOT/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Inbox / inbox | [GET](https://www.inboxapp.com/docs/) | 307 | redirect_https / redirect_not_approved | unknown | 320 | discovery |
| indoona / indoona | [GET](https://developer.indoona.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Indrz / indrz | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://github.com/indrz/indrz) | 0 | discovery |
| INEGI Mexico Stats / inegimexicostats | [GET](https://www.inegi.org.mx/servicios/api_indicadores.html/) | 406 | unresolved / http_error | unknown | 1423 | discovery |
| INEI / inei | [GET](https://iinei.inei.gob.pe/microdatos/) | 0 | timeout / timeout | unknown | 10910 | discovery |
| Inoreader / inoreader | [GET](https://www.inoreader.com/developers/) | 200 | unresolved / invalid_response | unknown | 227 | discovery |
| INPE Brazil Weather / inpebrazilweather | [GET](https://servicos.cptec.inpe.br/XML/) | 403 | unresolved / access_denied | unknown | 1343 | discovery |
| Inshorts News / inshortsnews | [GET](https://github.com/cyberboysumanjay/Inshorts-News-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Inspiration / inspiration | [GET](https://inspiration.goprogram.ai/docs/) | 0 | dead_upstream / network_error | unknown | 32 | discovery |
| inspirehep.net / inspirehepnet | [GET](https://inspirehep.net/api/literature?fields=titles&q=recid%3A4328&size=1) | 200 | ok / ok_json | [free](https://github.com/inspirehep/rest-api-doc) | 1282 | callable |
| Instathings Gate / instathingsgate | [GET](https://github.com/Instathings/gate/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Instructor / instructor | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| ip-api / ipapi | [GET](https://ip-api.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 687 | discovery |
| ip-fast.com / ipfastcom | [GET](https://ip-fast.com/docs/) | 302 | redirect_https / redirect_not_approved | unknown | 808 | discovery |
| IPinfo / ipinfo | [GET](https://ipinfo.io/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1623 | discovery |
| iqiyi / iqiyi | [GET](https://open.iqiyi.com/lib/scheme.html/) | 503 | dead_upstream / http_error | unknown | 2208 | discovery |
| ISTAT Italy / istatitaly | [GET](https://www.istat.it/en/information-and-services/developers/) | 404 | wrong_base_url_path / http_error | unknown | 732 | discovery |
| Italian ISTAT API / istatitaly | [GET](https://www.istat.it/en/information-and-services/developers/) | 404 | duplicate / duplicate | [free](https://www.istat.it/en/information-and-services/developers) | - | discovery |
| ITIS / itis | [GET](https://www.itis.gov/ITISWebService/jsonservice/getFullRecordFromTSN?tsn=180543) | 200 | ok / ok_json | [free](https://www.itis.gov/privacy.html) | 1110 | callable |
| iTunes Search / itunessearch | [GET](https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/) | 0 | dead_upstream / network_error | unknown | 84 | discovery |
| Jandapress API / jandapressapi | [GET](https://github.com/sinkaroid/jandapress/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Japan Post API / japanpostapi | [GET](https://www.post.japanpost.jp/zipcode/download.html/) | 404 | wrong_base_url_path / http_error | unknown | 2978 | discovery |
| JD / jd | [GET](https://jos.jd.com/api/index.htm/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2405 | discovery |
| Jina AI / jinaai | [GET](https://docs.jina.ai/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| JioSaavn / jiosaavn | [GET](https://github.com/cyberboysumanjay/JioSaavnAPI/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| JioSaavn API / jiosaavn | [GET](https://github.com/cyberboysumanjay/JioSaavnAPI/) | 0 | duplicate / duplicate | unknown | - | discovery |
| JMA Japan Weather / jmajapanweather | [GET](https://www.jma.go.jp/jma/en/Activities/apis.html/) | 404 | wrong_base_url_path / http_error | unknown | 680 | discovery |
| join.me / joinme | [GET](https://developer.join.me/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| jsDelivr / jsdelivr | [GET](https://github.com/jsdelivr/data.jsdelivr.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Jservice / jservice | [GET](https://jservice.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 841 | discovery |
| JSON Server / jsonserver | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://github.com/typicode/json-server) | 0 | discovery |
| JSONPlaceholder / jsonplaceholder-c2644e5c | [GET](https://jsonplaceholder.typicode.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 406 | discovery |
| Jupiter Protocol API / jupiterprotocolapi | [GET](https://jupiterag.finance/docs/) | 0 | dead_upstream / network_error | [free](https://jupiterag.finance/docs) | 75 | discovery |
| KaolaFM / kaolafm | [GET](https://github.com/kaolafm/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Keystatic / keystatic | [GET](https://keystatic.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2198 | discovery |
| Kooora Unofficial API / koooraunofficialapi | [GET](https://github.com/n-eq/kooora-unofficial-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| KyberSwap Protocol API / kyberswapprotocolapi | [GET](https://kyberswap.finance/docs/) | 0 | dead_upstream / network_error | [free](https://kyberswap.finance/docs) | 228 | discovery |
| LangSmith / langsmith | [GET](https://docs.smith.langchain.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lanyard / lanyard | [GET](https://github.com/Phineas/lanyard/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| LectServe / lectserve | [GET](https://www.lectserve.com/) | 502 | dead_upstream / http_error | unknown | 1224 | discovery |
| LeTV / letv | [GET](https://www.lecloud.com/zh-cn/help/2016/07/27/150.html?LeftMenu=api_db_guide) | 0 | redirect_https / tls_error | unknown | 255 | discovery |
| LibreTranslate API / libretranslateapi | [GET](https://libretranslate.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 465 | discovery |
| License-API / licenseapi | [GET](https://github.com/cmccandless/license-api/blob/master/README.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lido Protocol API / lidoprotocolapi | [GET](https://eth-api.lido.fi/v1/protocol/steth/apr/sma) | 200 | ok / ok_json | [free](https://docs.lido.fi/integrations/api/) | 347 | callable |
| Lifelog / lifelog | [GET](https://developer.sony.com/develop/services/lifelog-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lingva / lingva | [GET](https://github.com/thedaviddelta/lingva-translate/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Llama.cpp / llamacpp | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Lob / lob | [GET](https://docs.lob.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Localytics / localytics | [GET](https://docs.localytics.com/dev/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lololyrics / lololyrics | [GET](https://api.lololyrics.com/) | 404 | wrong_base_url_path / http_error | unknown | 459 | discovery |
| Lololyrics API / lololyrics | [GET](https://api.lololyrics.com/) | 404 | duplicate / duplicate | unknown | - | discovery |
| Loripsum / loripsum | [GET](https://loripsum.net/) | 0 | dead_upstream / network_error | unknown | 148 | discovery |
| Lowy Asia Power Index / lowyasiapowerindex | [GET](https://github.com/0x0is1/lowy-index-api-docs/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lucifer Quotes / luciferquotes | [GET](https://github.com/shadowoff09/lucifer-quotes/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Magic The Gathering / magicthegathering | [GET](https://magicthegathering.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 483 | discovery |
| Magic: The Gathering API / magicthegatheringapi | [GET](https://api.magicthegathering.io/v1/cards?pageSize=1) | 200 | ok / ok_json | [free](https://docs.magicthegathering.io/) | 649 | callable |
| mail.gw / mailgw | [GET](https://docs.mail.gw/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| mail.tm / mailtm | [GET](https://docs.mail.tm/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| MakerDAO Protocol API / makerdaoprotocolapi | [GET](https://maker.finance/docs/) | 0 | redirect_https / tls_error | [free](https://maker.finance/docs) | 623 | discovery |
| Makeup / makeup | [GET](https://makeup-api.herokuapp.com/) | 406 | unresolved / http_error | unknown | 830 | discovery |
| Marvin / marvin | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| MCU Countdown / mcucountdown | [GET](https://github.com/DiljotSG/MCU-Countdown/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| MedlinePlus / medlineplus | [GET](https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=asthma&retmax=1) | 200 | ok / ok_xml | [free](https://medlineplus.gov/about/developers/webservices/) | 519 | callable |
| Meme Maker / mememaker | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Meme Maker API / mememaker | - | 0 | duplicate / duplicate | unknown | - | discovery |
| MeowFacts / meowfacts | [GET](https://meowfacts.herokuapp.com/?count=1) | 200 | ok / ok_json | [free](https://github.com/wh-iterabb-it/meowfacts/blob/main/LICENSE) | 629 | callable |
| MetaMask SDK / metamasksdk | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Metaphorsum / metaphorsum | [GET](https://metaphorpsum.com/) | 0 | redirect_https / tls_error | unknown | 398 | discovery |
| MeteoSwiss API / meteoswissapi | [GET](https://www.meteoswiss.admin.ch/services-and-publications/service/open-government-data.html/) | 404 | wrong_base_url_path / http_error | unknown | 314 | discovery |
| Metro Lisboa / metrolisboa | [GET](https://app.metrolisboa.pt/status/getLinhas.php/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 483 | discovery |
| Metropolitan Museum of Art / metropolitanmuseumofart | [GET](https://collectionapi.metmuseum.org/public/collection/v1/departments) | 200 | ok / ok_json | [free](https://metmuseum.github.io/) | 1005 | callable |
| Mexico / mexico | [GET](https://github.com/IcaliaLabs/sepomex/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Mgnet.me / mgnetme | [GET](https://mgnet.me/api.html/) | 0 | redirect_https / tls_error | unknown | 1989 | discovery |
| microBees / microbees | [GET](https://developers.microbees.com/documentation/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Microsoft MRTK / microsoftmrtk | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Milvus / milvus | [GET](https://milvus.io/docs/) | 302 | redirect_https / redirect_not_approved | unknown | 6027 | discovery |
| Minor Planet Center / minorplanetcenter | [GET](https://www.asterank.com/mpc/) | 404 | wrong_base_url_path / http_error | unknown | 1007 | discovery |
| MLB Data / mlbdata | [GET](https://statsapi.mlb.com/docs/) | 301 | gateway_block / gateway_block | unknown | 1329 | discovery |
| MLB Records and Stats / mlbrecordsandstats | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| MLB-StatsAPI / mlbstatsapi-ca2f33f7 | [GET](https://github.com/toddrob99/MLB-StatsAPI/) | 0 | wrong_base_url_path / documentation_url | [free](https://github.com/toddrob99/MLB-StatsAPI) | 0 | discovery |
| Monster Hunter World / monsterhunterworld | [GET](https://docs.mhw-db.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Movebank / movebank | [GET](https://github.com/movebank/movebank-api-doc/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Movebank API / movebank | [GET](https://github.com/movebank/movebank-api-doc/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Movie Quote / moviequote | [GET](https://github.com/F4R4N/movie-quote/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Mozilla http scanner / mozillahttpscanner | [GET](https://github.com/mozilla/http-observatory/blob/master/httpobs/docs/api.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Mozilla tls scanner / mozillatlsscanner | [GET](https://github.com/mozilla/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| MusicGraph / musicgraph | [GET](https://developer.musicgraph.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| MyVaccination / myvaccination | [GET](https://documenter.getpostman.com/view/16605343/Tzm8GG7u/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Nager.Date / nagerdate | - | 0 | duplicate / duplicate | unknown | - | discovery |
| NaMoMemes / namomemes | [GET](https://github.com/theIYD/NaMoMemes/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Narrative / narrative | [GET](https://open.getnarrative.com/) | 0 | dead_upstream / network_error | unknown | 76 | discovery |
| Narro / narro | [GET](https://docs.narro.co/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| NASA Exoplanet Archive / nasaexoplanetarchive | [GET](https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+top+1+pl_name+from+ps&format=json) | 200 | ok / ok_json | [free](https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html) | 5367 | callable |
| National Bank of Poland / nbppolandapi | [GET](https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=json) | 200 | duplicate / duplicate | [free](https://api.nbp.pl/en.html) | - | alias of nbppolandapi |
| NBA API / nbaapi | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://github.com/swar/nba_api) | 0 | discovery |
| NBA REST API / nbarestapi | [GET](https://rest.nbaapi.com/index.html/) | 0 | redirect_https / tls_error | unknown | 989 | discovery |
| NekosBest / nekosbest | - | 0 | commercial_permission / reviewed_exclusion | unknown | 0 | discovery |
| NetworkCalc / networkcalc | [GET](https://networkcalc.com/api/binary/10?from=10&to=2) | 200 | ok / ok_json | [free](https://networkcalc.com/) | 492 | callable |
| Neurio / neurio | [GET](https://neur.io/developers/) | 301 | redirect_https / redirect_not_approved | unknown | 536 | discovery |
| NHL Records and Stats / nhlrecordsandstats | [GET](https://gitlab.com/dword4/nhlapi/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Nike+ / nike | [GET](https://developer.nike.com/content/nike-developer-cq/us/en_us/index/documentation/api-docs.html/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| NOAA / usweather | [GET](https://api.weather.gov/points/39.7456,-97.0892) | 200 | duplicate / duplicate | [free](https://www.weather.gov/documentation/services-web-api) | - | alias of usweather |
| Node Deliveroo / nodedeliveroo | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Node UberEats / nodeubereats | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Non-Working Days ICS / nonworkingdaysics | [GET](https://github.com/gadael/icsdb/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| npm Registry / npmregistry | [GET](https://registry.npmjs.org/typescript/latest) | 200 | ok / ok_json | [free](https://docs.npmjs.com/policies/terms/) | 514 | callable |
| NPM Registry API / npmregistryapi | [GET](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| NPR / npr | [GET](https://www.npr.org/api/index/) | 0 | timeout / timeout | unknown | 20046 | discovery |
| Ntfy API / ntfyapi | [GET](https://ntfy.sh/docs/) | 302 | gateway_block / gateway_block | unknown | 566 | discovery |
| Numbers / numbers | [GET](https://numbersapi.com/) | 0 | redirect_https / tls_error | unknown | 397 | discovery |
| NWS API / usweather | [GET](https://api.weather.gov/points/39.7456,-97.0892) | 200 | duplicate / duplicate | [free](https://www.weather.gov/documentation/services-web-api) | - | alias of usweather |
| OeNB Austria / oenbaustria | [GET](https://www.oenb.at/Statistik/Standardisierte-Tabellen.html/) | 404 | wrong_base_url_path / http_error | unknown | 560 | discovery |
| Office Ipsum / officeipsum | [GET](https://officeipsum.com/) | 0 | redirect_https / tls_error | unknown | 552 | discovery |
| One Music / onemusic | [GET](https://www.onemusicapi.com/) | 0 | timeout / timeout | unknown | 13666 | discovery |
| Open Collective / opencollective | [GET](https://docs.opencollective.com/help/developers/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Open Government, Canada / opengovernmentcanada | [GET](https://open.canada.ca/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://open.canada.ca/data) | 4258 | callable |
| Open Government, Ireland / opengovernmentireland | [GET](https://data.gov.ie/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.gov.ie) | 3803 | callable |
| Open Government, Romania / opengovernmentromania | [GET](https://data.gov.ro/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.gov.ro) | 3831 | callable |
| Open Government, Switzerland / opengovernmentswitzerland | [GET](https://opendata.swiss/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.swiss) | 14101 | callable |
| Open Library / openlibrary | [GET](https://openlibrary.org/search.json?q=the+hobbit&limit=1) | 200 | ok / ok_json | [free](https://openlibrary.org/developers) | 2911 | callable |
| Open Library Books / openlibrary | [GET](https://openlibrary.org/search.json?q=the+hobbit&limit=1) | 200 | duplicate / duplicate | [free](https://openlibrary.org/developers/api) | - | alias of openlibrary |
| Open Library Books API / openlibrary | [GET](https://openlibrary.org/search.json?q=the+hobbit&limit=1) | 200 | duplicate / duplicate | [free](https://openlibrary.org/developers/api) | - | alias of openlibrary |
| Open Notify / opennotify | [GET](https://open-notify.org/Open-Notify-API/) | 0 | redirect_https / tls_error | unknown | 604 | discovery |
| Open Notify ISS / opennotify | [GET](https://open-notify.org/Open-Notify-API/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Open Science Framework / openscienceframework | [GET](https://api.osf.io/v2/nodes/?page%5Bsize%5D=1) | 200 | ok / ok_json | [free](https://developer.osf.io/) | 1249 | callable |
| Open Skills / openskills | [GET](https://github.com/workforce-data-initiative/skills-api/wiki/API-Overview/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Open Web Analytics / openwebanalytics | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Open-Meteo API / openmeteoapi | [GET](https://open-meteo.com/en/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1268 | discovery |
| OpenDota API / opendota | [GET](https://api.opendota.com/api/heroes) | 200 | duplicate / duplicate | [free](https://docs.opendota.com/) | - | alias of opendota |
| OpenFlights / openflights | [GET](https://openflights.org/data.html/) | 404 | wrong_base_url_path / http_error | [free](https://openflights.org/data.html) | 614 | discovery |
| openHAB / openhab | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| openHAB API / openhab | - | 0 | duplicate / duplicate | [free](https://github.com/openhab/openhab1-addons/wiki/REST-API) | - | discovery |
| OpenRates / openrates | [GET](https://www.openrates.io/) | 301 | redirect_https / redirect_not_approved | unknown | 846 | discovery |
| OpenSky Network / openskynetwork | [GET](https://opensky-network.org/apidoc/index.html/) | 404 | wrong_base_url_path / http_error | unknown | 505 | discovery |
| OpenVR / openvr | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Openwhyd / openwhyd | [GET](https://openwhyd.org/hot?format=json&limit=1) | 200 | ok / ok_json | [free](https://openwhyd.github.io/openwhyd/API) | 196 | callable |
| Orca Protocol API / orcaprotocolapi | [GET](https://api.orca.so/v2/solana/pools?size=1) | 200 | ok / ok_json | [free](https://docs.orca.so/api-reference/overview) | 380 | callable |
| Ordoro / ordoro | [GET](https://www.ordoro.com/developers/) | 301 | redirect_https / redirect_not_approved | unknown | 637 | discovery |
| OSRM API / osrmapi | [GET](https://project-osrm.org/docs/v5.24.0/api/) | 200 | wrong_base_url_path / html_instead_of_api | [free](http://project-osrm.org/docs/v5.24.0/api) | 358 | discovery |
| Outstatic / outstatic | [GET](https://outstatic.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2716 | discovery |
| PancakeSwap Protocol API / pancakeswapprotocolapi | [GET](https://pancakeswap.finance/docs/) | 404 | wrong_base_url_path / http_error | [free](https://pancakeswap.finance/docs) | 1547 | discovery |
| Papercup / papercup | [GET](https://www.papercup.com/developers/) | 301 | redirect_https / redirect_not_approved | unknown | 287 | discovery |
| ParaSwap Protocol API / paraswapprotocolapi | [GET](https://paraswap.finance/docs/) | 0 | timeout / timeout | [free](https://paraswap.finance/docs) | 10674 | discovery |
| Parqet Logo API / parqetlogoapi | [GET](https://developers.parqet.com/docs/assets/logos/) | 0 | wrong_base_url_path / documentation_url | [free](https://developers.parqet.com/docs/assets/logos) | 0 | discovery |
| Passwordinator / passwordinator | [GET](https://github.com/fawazsullia/password-generator/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Patents API / patentsapi | [GET](https://developer.uspto.gov/api-catalog/) | 0 | wrong_base_url_path / documentation_url | [free](https://developer.uspto.gov/api-catalog) | 0 | discovery |
| Paymill / paymill | [GET](https://developers.paymill.com/index/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| PayPal Login / paypallogin | [GET](https://developer.paypal.com/docs/integration/direct/identity/log-in-with-paypal/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Payson / payson | [GET](https://developers.payson.se/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Paytm / paytm | [GET](https://paytm.com/business/payments/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1726 | discovery |
| PE Accounting / peaccounting | [GET](https://docs.accounting.pe/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Pelias API / peliasapi | [GET](https://github.com/pelias/documentation/) | 0 | wrong_base_url_path / documentation_url | [free](https://github.com/pelias/documentation) | 0 | discovery |
| PENDAX / pendax | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Penguin Publishing / penguinpublishing | [GET](https://www.penguinrandomhouse.biz/webservices/rest/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1265 | discovery |
| Phone Specification / phonespecification | [GET](https://github.com/azharimm/phone-specs-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| PhonePe / phonepe | [GET](https://developer.phonepe.com/docs/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Picatic / picatic | [GET](https://developer.picatic.com/?utm_medium=web) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Pinball Map / pinballmap | [GET](https://pinballmap.com/api/v1/docs/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 1405 | discovery |
| Placid / placid | [GET](https://placid.app/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1218 | discovery |
| PoetryDB / poetrydb | [GET](https://poetrydb.org/title/Ozymandias) | 200 | ok / ok_json | [free](https://github.com/thundercomb/poetrydb) | 1240 | callable |
| Pokemon TCG / pokemontcg | [GET](https://api.pokemontcg.io/v2/cards/base1-1) | 502 | dead_upstream / http_error | [free](https://docs.pokemontcg.io/) | 371 | discovery |
| PokéAPI (GraphQL) / pokapigraphql | [GET](https://github.com/mazipan/graphql-pokeapi/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Polly.JS / pollyjs | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://netflix.github.io/pollyjs) | 0 | discovery |
| PostalPinCode / postalpincode | [GET](https://api.postalpincode.in/pincode/110001) | 200 | ok / ok_json | [free](https://www.postalpincode.in/Api-Details) | 1454 | callable |
| Postcode.io API / postcodesio | [GET](https://api.postcodes.io/postcodes/SW1A1AA) | 200 | duplicate / duplicate | [free](https://postcodes.io/) | - | alias of postcodesio |
| PostcodeData.nl / postcodedatanl | [GET](https://api.postcodedata.nl/v1/postcode/?postcode=1211EP&streetnumber=60&ref=domeinnaam.nl&type=json) | 0 | dead_upstream / network_error | unknown | 131 | discovery |
| Postmon / postmon | [GET](https://api.postmon.com.br/v1/cep/01001000) | 0 | dead_upstream / network_error | [free](https://postmon.com.br/) | 65 | discovery |
| PRC Exam Schedule / prcexamschedule | [GET](https://api.whenisthenextboardexam.com/docs/) | 0 | dead_upstream / network_error | unknown | 137 | discovery |
| Programming Quotes / programmingquotes | [GET](https://github.com/skolakoda/programming-quotes-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Promptflow / promptflow | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| PurgoMalum / purgomalum | [GET](https://www.purgomalum.com/service/json?text=hello) | 200 | ok / ok_json | [free](https://www.purgomalum.com/) | 8947 | callable |
| Puyo Nexus / puyonexus | [GET](https://github.com/deltadex7/puyodb-api-deno/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| QingtingFM / qingtingfm | [GET](https://open.qingting.fm/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2109 | discovery |
| qKast Channel Content / qkastchannelcontent | [GET](https://github.com/egfx/qKast/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| QR code / qrcode | [GET](https://goqr.me/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 643 | discovery |
| QR code goqr / qrcode | [GET](https://goqr.me/api/) | 200 | duplicate / duplicate | unknown | - | discovery |
| qunar / qunar | [GET](https://open.qunar.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2494 | discovery |
| Quotable / quotable | [GET](https://github.com/lukePeavey/quotable/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Quotable Quotes / quotable | [GET](https://github.com/lukePeavey/quotable/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Quote Garden / quotegarden | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Quran-api / quranapi | [GET](https://github.com/fawazahmed0/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| RainViewer / rainviewer | [GET](https://www.rainviewer.com/api.html/) | 404 | wrong_base_url_path / http_error | unknown | 820 | discovery |
| Random Data API / randomdata | [GET](https://random-data-api.com/api/v2/users?size=1) | 0 | duplicate / duplicate | [free](https://random-data-api.com/documentation) | - | discovery |
| Random User / randomuser-9b425277 | [GET](https://randomuser.me/documentation/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://randomuser.me/documentation) | 389 | discovery |
| Random User API / randomuser-c51bc20a | [GET](https://randomuser.me/api/?results=1&inc=name,nat&noinfo) | 200 | duplicate / duplicate | [free](https://randomuser.me/documentation) | - | alias of randomuser |
| RandomUser API / randomuser-9b425277 | [GET](https://randomuser.me/documentation/) | 200 | duplicate / duplicate | [free](https://randomuser.me/documentation) | - | discovery |
| Ray Serve / rayserve | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://docs.ray.io/en/latest/serve) | 0 | discovery |
| Raydium Protocol API / raydiumprotocolapi | [GET](https://api-v3.raydium.io/main/info) | 200 | ok / ok_json | [free](https://github.com/raydium-io/raydium-docs-v1/blob/main/sdk-api/rest-api.mdx) | 500 | callable |
| Razorpay IFSC / razorpayifsc | [GET](https://ifsc.razorpay.com/HDFC0000001) | 200 | ok / ok_json | [free](https://github.com/razorpay/ifsc) | 874 | callable |
| Readme typing SVG / readmetypingsvg | [GET](https://github.com/DenverCoder1/readme-typing-svg/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| RealityKit / realitykit | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Recipe Puppy API / recipepuppyapi | [GET](https://www.recipepuppy.com/about/api/) | 404 | wrong_base_url_path / http_error | unknown | 1078 | discovery |
| RecipePuppy / recipepuppy | [GET](https://www.recipepuppy.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 1857 | discovery |
| Recon / recon | [GET](https://www.reconinstruments.com/developers/develop/for-recon-engage/api-documentation/) | 0 | dead_upstream / network_error | unknown | 54 | discovery |
| REFUGE Restrooms / refugerestrooms | [GET](https://www.refugerestrooms.org/api/v1/restrooms?per_page=1) | 200 | ok / ok_json | [free](https://github.com/RefugeRestrooms/refugerestrooms) | 1596 | callable |
| Relevance AI / relevanceai | [GET](https://docs.relevanceai.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Remote Calc / remotecalc | [GET](https://github.com/elizabethadegbaju/remotecalc/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Repetiti / repetiti | [GET](https://developers.repetiti.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Resolve Team / resolveteam | [GET](https://github.com/fearandesire/resolve-team/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| RestCountries / restcountries-e252b887 | [GET](https://restcountries.com/v3.1/all) | 301 | redirect_https / redirect_not_approved | [free](https://restcountries.com) | 216 | discovery |
| Rig Veda / rigveda | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Roku API / rokuapi | [GET](https://developer.roku.com/docs/developer-program/debugging/external-control-api.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Ron Swanson Quotes / ronswansonquotes | [GET](https://ron-swanson-quotes.herokuapp.com/v2/quotes) | 200 | ok / ok_json | [free](https://github.com/jamesseanwright/ron-swanson-quotes) | 495 | callable |
| Russian Calendar / russiancalendar | [GET](https://github.com/egno/work-calendar/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Sakura CardCaptor / sakuracardcaptor | [GET](https://github.com/JessVel/sakura-card-captor-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Salesforce Auth / salesforceauth | [GET](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_authentication.htm/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Scenario / scenario | [GET](https://docs.scenario.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SearchLy / searchly | [GET](https://github.com/AlbertSuarez/searchly/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Semantics3 / semantics3 | [GET](https://docs.semantics3.com/reference/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Seon / seon | [GET](https://docs.seon.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Shadify / shadify | [GET](https://github.com/cheatsnake/shadify/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Shibe Online / shibeonline-07ebe720 | [GET](https://shibe.online/api/shibes?count=1&urls=true&httpsUrls=true) | 0 | redirect_https / tls_error | [free](https://shibe.online/) | 378 | discovery |
| Shibe.Online / shibeonline-07ebe720 | [GET](https://shibe.online/) | 0 | redirect_https / tls_error | unknown | 1515 | discovery |
| Short Link / shortlink | [GET](https://github.com/FayasNoushad/Short-Link-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SHOUTCLOUD / shoutcloud | [GET](https://shoutcloud.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 898 | discovery |
| Shrtcode / shrtcode | [GET](https://shrtco.de/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 193 | discovery |
| SLF / slf | [GET](https://github.com/slftool/slftool.github.io/blob/master/API.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SLF Database / slf | [GET](https://github.com/slftool/slftool.github.io/blob/master/API.md/) | 0 | duplicate / duplicate | unknown | - | discovery |
| SLF German Database / slfgermandatabase | [GET](https://github.com/slftool/slftool.github.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Slice / slice | [GET](https://developer.slice.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Sohu TV / sohutv | [GET](https://lm.tv.sohu.com/union/open_platform.do/) | 404 | wrong_base_url_path / http_error | unknown | 2101 | discovery |
| Solana JSON RPC / solanajsonrpc | [GET](https://docs.solana.com/developing/clients/jsonrpc-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Solana JSON-RPC / solanajsonrpc | [GET](https://docs.solana.com/developing/clients/jsonrpc-api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Solana RPC API / solanarpcapi | [GET](https://docs.solana.com/api/) | 0 | wrong_base_url_path / documentation_url | [free](https://docs.solana.com/api) | 0 | discovery |
| Solana Web3.js / solanaweb3js | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Sonar / sonar | [GET](https://github.com/Cgboal/SonarSearch/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| South Park Quotes / southparkquotes | [GET](https://github.com/Thatskat/southpark-quotes-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Spanish INE API / spanishineapi | [GET](https://servicios.ine.es/wstempus/js/ES/OPERACIONES_DISPONIBLES) | 200 | ok / ok_json | [free](https://www.ine.es/datosabiertos/) | 1574 | callable |
| Sport List & Data / sportlistdata | [GET](https://developers.decathlon.com/products/sports/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Sport Places / sportplaces | [GET](https://developers.decathlon.com/products/sport-places/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Sportscaster API / sportscasterapi | [GET](https://github.com/roysti10/sportscaster/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Sportsipy / sportsipy | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| SSL Labs API / ssllabsapi | - | 0 | commercial_permission / reviewed_exclusion | [free](https://github.com/ssllabs/ssllabs-scan/blob/master/ssllabs-api-docs-v3.md) | 0 | discovery |
| SST / sst | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Stack AI / stackai | [GET](https://docs.stack-ai.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stack Lighting / stacklighting | [GET](https://developers.stacklighting.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stamps.com / stampscom | [GET](https://developer.stamps.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| STAPI / stapi | [GET](https://stapi.co/api/v1/rest/season/search?pageSize=1) | 200 | ok / ok_json | [free](https://github.com/cezarykluczynski/stapi) | 342 | callable |
| StatCan Statistics / statcanstatistics | [GET](https://www150.statcan.gc.ca/t1/wds/rest/getFullTableDownloadCSV/17100005/en) | 200 | ok / ok_json | [free](https://www.statcan.gc.ca/en/terms-conditions/open-licence-faq) | 641 | callable |
| StatLine / statline | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Stats SA / statssa | [GET](https://www.statssa.gov.za/?cat=15) | 302 | redirect_https / redirect_not_approved | unknown | 3358 | discovery |
| Steam / steam | [GET](https://github.com/Revadike/InternalSteamWebAPI/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SteamVR / steamvr | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Steem / steem | [GET](https://developers.steem.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stoicism Quote / stoicismquote | [GET](https://github.com/tlcheah2/stoic-quote-lambda-public-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stranger Things Quotes / strangerthingsquotes | [GET](https://github.com/shadowoff09/strangerthings-quotes/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SushiSwap Protocol API / sushiswapprotocolapi | [GET](https://sushiswap.finance/docs/) | 0 | dead_upstream / network_error | [free](https://sushiswap.finance/docs) | 122 | discovery |
| SWAPI / swapi | [GET](https://www.swapi.tech/api/people/1) | 200 | ok / ok_json | [free](https://www.swapi.tech/documentation) | 718 | callable |
| Symbl.ai / symblai | [GET](https://docs.symbl.ai/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Synthetix Protocol API / synthetixprotocolapi | [GET](https://synthetix.finance/docs/) | 301 | redirect_https / redirect_not_approved | [free](https://synthetix.finance/docs) | 534 | discovery |
| TacoFancy / tacofancy | [GET](https://github.com/evz/tacofancy-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| TacoFancy API / tacofancy | [GET](https://github.com/evz/tacofancy-api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| TalkJS / talkjs | [GET](https://talkjs.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 293 | discovery |
| Tanzania Open Data API / tanzaniaopendataapi | [GET](https://opendata.go.tz/) | 0 | dead_upstream / network_error | [free](http://opendata.go.tz) | 40 | discovery |
| Taobao / taobao | [GET](https://open.taobao.com/doc2/api_list.htm/) | 302 | redirect_https / redirect_not_approved | unknown | 1126 | discovery |
| TCGdex / tcgdex | [GET](https://api.tcgdex.net/v2/en/sets/base1) | 200 | ok / ok_json | [free](https://tcgdex.dev/) | 328 | callable |
| TeamSnap / teamsnap | [GET](https://developer.teamsnap.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Teleport / teleport | [GET](https://developers.teleport.org/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Tencent Map / tencentmap | [GET](https://lbs.qq.com/webservice_v1/index.html/) | 404 | wrong_base_url_path / http_error | unknown | 1800 | discovery |
| Tencent NLP / tencentnlp | [GET](https://nlp.qq.com/help.cgi/) | 0 | unresolved / network_error | unknown | 142 | discovery |
| The Report of the Week / thereportoftheweek | [GET](https://github.com/andyklimczak/TheReportOfTheWeek-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| They Said So / theysaidso | [GET](https://quotes.rest/qod.json?category=inspire) | 401 | unresolved / access_denied | unknown | 657 | discovery |
| Times Adder / timesadder | [GET](https://github.com/FranP-code/API-Times-Adder/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| ToS;DR API / tosdrapi | [GET](https://api.tosdr.org/service/v3?id=190) | 200 | ok / ok_json | [free](https://docs.tosdr.org/site-policy/tosdr-terms/tosdr.org-terms-of-contribution) | 454 | callable |
| Trace Moe / tracemoe | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| TransitLand / transitland | [GET](https://www.transit.land/documentation/datastore/api-endpoints.html/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 405 | discovery |
| Transitland API / transitlandapi | [GET](https://www.transit.land/documentation/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.transit.land/documentation) | 1220 | discovery |
| Transloadit / transloadit | [GET](https://transloadit.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 337 | discovery |
| Transport for Atlanta, US / transportforatlantaus | [GET](https://www.itsmarta.com/app-developer-resources.aspx/) | 301 | redirect_https / redirect_not_approved | unknown | 633 | discovery |
| Transport for Belgium / transportforbelgium | [GET](https://api.irail.be/v1/stations?format=json) | 200 | ok / ok_json | [free](https://docs.irail.be/) | 335 | callable |
| Transport for Berlin, Germany / transportforberlingermany | [GET](https://v6.vbb.transport.rest/locations?query=Berlin&results=1) | 0 | timeout / timeout | [free](https://v6.vbb.transport.rest/api.html) | 20033 | discovery |
| Transport for Denver, US / transportfordenverus | [GET](https://www.rtd-denver.com/gtfs-developer-guide.shtml/) | 404 | wrong_base_url_path / http_error | unknown | 1554 | discovery |
| Transport for Finland / hsl | [GET](https://digitransit.fi/en/developers/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Transport for Grenoble, France / transportforgrenoblefrance | [GET](https://data.mobilites-m.fr/api/lines/json?types=ligne&codes=SEM%3AA) | 200 | ok / ok_json | [free](https://data.mobilites-m.fr/blog/licence-d-utilisation-des-donnees) | 580 | callable |
| Transport for Hessen, Germany / transportforhessengermany | [GET](https://opendata.rmv.de/site/start.html/) | 301 | redirect_https / redirect_not_approved | unknown | 250 | discovery |
| Transport for Los Angeles, US / transportforlosangelesus | [GET](https://developer.metro.net/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Transport for Norway / transportfornorway | [GET](https://developer.entur.org/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Transport for Paris, France / transportforparisfrance | [GET](https://data.ratp.fr/api/v1/console/datasets/1.0/search/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1563 | discovery |
| Transport for Philadelphia, US / transportforphiladelphiaus | [GET](https://www3.septa.org/hackathon/) | 403 | unresolved / access_denied | unknown | 982 | discovery |
| Transport for Spain / ckan-data-renfe-com | [GET](https://data.renfe.com/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.renfe.com/) | 452 | callable |
| Transport for The Netherlands / transportforthenetherlands | [GET](https://github.com/skywave/KV78Turbo-OVAPI/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Transport for Toronto, Canada / transportfortorontocanada | [GET](https://myttc.ca/developers/) | 406 | unresolved / http_error | unknown | 18896 | discovery |
| Treasury Prime / treasuryprime | [GET](https://docs.treasuryprime.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Trilium / trilium | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| tuniu / tuniu | [GET](https://open.tuniu.cn/) | 0 | timeout / timeout | unknown | 12988 | discovery |
| TVMaze / tvmaze | [GET](https://api.tvmaze.com/shows/1) | 200 | ok / ok_json | [free](https://www.tvmaze.com/api) | 465 | callable |
| Twelve Labs / twelvelabs | [GET](https://docs.twelvelabs.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Typebot / typebot | [GET](https://docs.typebot.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| UK Carbon Intensity / ukcarbonintensity | [GET](https://api.carbonintensity.org.uk/intensity) | 200 | ok / ok_json | [free](https://carbon-intensity.github.io/api-definitions/) | 678 | callable |
| UK Parliament API / ukparliamentapi | [GET](https://members-api.parliament.uk/api/Members/Search?skip=0&take=1) | 200 | ok / ok_json | [free](https://developer.parliament.uk/) | 1463 | callable |
| UK Police / ukpolice | [GET](https://data.police.uk/api/forces) | 200 | ok / ok_json | [free](https://data.police.uk/docs/) | 539 | callable |
| UK Police API / ukpolice | [GET](https://data.police.uk/api/forces) | 200 | duplicate / duplicate | [free](https://data.police.uk/docs/) | - | alias of ukpolice |
| Ultralytics / ultralytics | [GET](https://docs.ultralytics.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Uniswap / uniswap | [GET](https://docs.uniswap.org/) | 0 | wrong_base_url_path / documentation_url | [free](https://docs.uniswap.org) | 0 | discovery |
| Uniswap API / uniswap | [GET](https://docs.uniswap.org/) | 0 | duplicate / duplicate | [free](https://docs.uniswap.org) | - | discovery |
| Uniswap Protocol API / uniswapprotocolapi | [GET](https://uniswap.finance/docs/) | 0 | dead_upstream / network_error | [free](https://uniswap.finance/docs) | 87 | discovery |
| Unity XR / unityxr | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Universalis / universalis | [GET](https://universalis.app/api/v2/data-centers) | 200 | ok / ok_json | [free](https://docs.universalis.app/) | 256 | callable |
| Universalis FFXIV / universalis | [GET](https://universalis.app/api/v2/data-centers) | 200 | duplicate / duplicate | [free](https://docs.universalis.app/) | - | alias of universalis |
| Universities List / universitieslist | [GET](https://github.com/Hipo/university-domains-list/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| University Domains / universitieslist | [GET](https://github.com/Hipo/university-domains-list/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Unstructured / unstructured | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| US Weather / usweather | [GET](https://api.weather.gov/points/39.7456,-97.0892) | 200 | ok / ok_json | [free](https://www.weather.gov/documentation/services-web-api) | 407 | callable |
| USA TODAY / usatoday | [GET](https://developer.usatoday.com/docs/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| UUID Generator / uuidgenerator | [GET](https://www.uuidtools.com/api/generate/v4/count/1) | 200 | ok / ok_json | [free](https://www.uuidtools.com/docs) | 600 | callable |
| Valhalla Routing / valhallarouting | - | 0 | gateway_block / unsafe_url | [free](https://valhalla.github.io/valhalla/api) | 0 | discovery |
| VATComply / vatcomply | [GET](https://api.vatcomply.com/rates?base=EUR) | 200 | ok / ok_json | [free](https://www.vatcomply.com/documentation) | 590 | callable |
| VATComply.com / vatcomply | [GET](https://api.vatcomply.com/rates?base=EUR) | 200 | duplicate / duplicate | [free](https://www.vatcomply.com/documentation) | - | alias of vatcomply |
| Vectara / vectara | [GET](https://docs.vectara.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Vector Express / vectorexpress | [GET](https://github.com/smidyo/vectorexpress-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Vedic Society / vedicsociety | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Vespa / vespa | [GET](https://docs.vespa.ai/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Viber API / viberapi | [GET](https://developers.viber.com/docs/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Visma / visma | [GET](https://developer.visma.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| W3C / w3c | [GET](https://github.com/w3c/w3c-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| W3C API / w3c | [GET](https://github.com/w3c/w3c-api/) | 0 | duplicate / duplicate | [free](https://github.com/w3c/w3c-api) | - | discovery |
| Waifu.im / waifuim | [GET](https://waifu.im/docs/) | 301 | redirect_https / redirect_not_approved | unknown | 628 | discovery |
| Waifu.pics / waifupics | [GET](https://waifu.pics/docs/) | 301 | redirect_https / redirect_not_approved | unknown | 1049 | discovery |
| WakaTime / wakatime | [GET](https://wakatime.com/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1692 | discovery |
| Walley / walley | [GET](https://docs.walley.se/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Walltime / walltime | [GET](https://walltime.info/api.html/) | 0 | dead_upstream / network_error | unknown | 449 | discovery |
| Wandbox / wandbox | [GET](https://wandbox.org/api/list.json) | 200 | ok / ok_json | [free](https://github.com/melpon/wandbox) | 529 | callable |
| Weather Unlocked / weatherunlocked | [GET](https://developer.weatherunlocked.com/documentation/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| weather-api / weatherapi | [GET](https://github.com/robertoduessmann/weather-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Web Series Quotes Generator / webseriesquotesgenerator | [GET](https://github.com/yogeshwaran01/web-series-quotes/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Weibo / weibo | [GET](https://open.weibo.com/wiki/API/) | 404 | wrong_base_url_path / http_error | unknown | 2558 | discovery |
| Weibo API / weiboapi | [GET](https://open.weibo.com/wiki/API%E6%96%87%E6%A1%A3/en/) | 404 | wrong_base_url_path / http_error | unknown | 3528 | discovery |
| What The Commit / whatthecommit | [GET](https://whatthecommit.com/index.txt) | 200 | ok / ok_text | [free](https://github.com/ngerakines/commitment) | 492 | callable |
| WhatPulse / whatpulse | [GET](https://developer.whatpulse.org/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| When is next MCU film / whenisnextmcufilm | [GET](https://github.com/DiljotSG/MCU-Countdown/blob/develop/docs/API.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Wizard World / wizardworld | [GET](https://wizard-world-api.herokuapp.com/swagger/index.html/) | 404 | wrong_base_url_path / http_error | unknown | 332 | discovery |
| Wizard World API / wizardworld | [GET](https://wizard-world-api.herokuapp.com/swagger/index.html/) | 404 | duplicate / duplicate | unknown | - | discovery |
| World Wonders API / worldwondersapi | [GET](https://github.com/Rolv-Apneseth/world-wonders-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| wozhitu / wozhitu | [GET](https://api1.wozhitu.com/) | 0 | dead_upstream / network_error | unknown | 223 | discovery |
| Xively / xively | [GET](https://developer.xively.com/reference/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Yahoo Maps / yahoomaps | [GET](https://developer.yahoo.com/maps/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Yearn Finance Protocol API / yearnfinanceprotocolapi | [GET](https://ydaemon.yearn.fi/1/vaults/0x5f18C75AbDAe578b483E5F43f12a39cF75b973a9) | 200 | ok / ok_json | [free](https://docs.yearn.fi/developers/building-on-yearn) | 818 | callable |
| yeekit / yeekit | [GET](https://api.yeekit.com/) | 0 | dead_upstream / network_error | unknown | 300 | discovery |
| Yeelight / yeelight | [GET](https://www.yeelight.com/en_US/developer/) | 500 | dead_upstream / http_error | unknown | 2602 | discovery |
| Yellow Pages API / yellowpagesapi | [GET](https://github.com/Hrushi11/Yellow-Pages-End-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Yo / yo | [GET](https://docs.justyo.co/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Yo Momma Jokes / yomommajokes | [GET](https://github.com/beanboi7/yomomma-apiv2/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Youdao / youdao | [GET](https://fanyi.youdao.com/openapi/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2697 | discovery |
| Youdao Note / youdaonote | [GET](https://note.youdao.com/open/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1516 | discovery |
| YouTube API / youtubeapi | [GET](https://developers.google.com/youtube/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Yr.no API / metnorway | [GET](https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75) | 200 | duplicate / duplicate | [free](https://api.met.no/doc/TermsOfService) | - | alias of yr |
| Yu-Gi-Oh! / yugioh-87bf1c6d | [GET](https://db.ygoprodeck.com/api-guide/) | 301 | redirect_https / redirect_not_approved | unknown | 865 | discovery |
| Zetta / zetta | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Zetta IoT / zetta | - | 0 | duplicate / duplicate | unknown | - | discovery |
| Zettle / zettle | [GET](https://developer.zettle.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Zippopotam.us / zippopotamus-5d8e78ff | [GET](https://api.zippopotam.us/us/90210) | 200 | ok / ok_json | [free](https://www.zippopotam.us/) | 154 | callable |
| Zippopotamus / zippopotamus-5d8e78ff | [GET](https://www.zippopotam.us/) | 200 | unresolved / invalid_response | unknown | 119 | discovery |
| Zombie Ipsum / zombieipsum | [GET](https://www.zombieipsum.com/) | 0 | redirect_https / tls_error | unknown | 504 | discovery |
| Arbetsförmedlingen API / arbetsfrmedlingenapi | [GET](https://jobsearch.api.jobtechdev.se/search?q=developer&limit=1) | 200 | ok / ok_json | [free](https://jobsearch.api.jobtechdev.se/) | 315 | callable |
| Bluesky / bluesky | [GET](https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=bsky.app) | 200 | ok / ok_json | [free](https://docs.bsky.app/docs/advanced-guides/api-directory) | 334 | callable |
| Crates.io / cratesio | [GET](https://crates.io/api/v1/crates/serde/1.0.228) | 200 | ok / ok_json | [free](https://crates.io/data-access) | 571 | callable |
| Dev.to API / devtoapi | [GET](https://dev.to/api/articles?per_page=1) | 200 | ok / ok_json | [free](https://developers.forem.com/api/v1) | 349 | callable |
| Guild Wars 2 API / guildwars2api | [GET](https://api.guildwars2.com/v2/build) | 200 | ok / ok_json | [free](https://wiki.guildwars2.com/wiki/API:Main) | 213 | callable |
| Hugging Face Hub API / huggingfacehubapi | [GET](https://huggingface.co/api/models?limit=1) | 200 | ok / ok_json | [free](https://huggingface.co/docs/hub/api) | 216 | callable |
| iNaturalist API / inaturalistapi | [GET](https://api.inaturalist.org/v1/taxa?per_page=1) | 200 | ok / ok_json | [free](https://api.inaturalist.org/v1/docs/) | 1074 | callable |
| Lichess.org API reference / lichessorgapireference | [GET](https://lichess.org/api/puzzle/daily) | 200 | ok / ok_json | [free](https://lichess.org/api) | 138 | callable |
| UniProt / uniprotapi | [GET](https://rest.uniprot.org/uniprotkb/search?query=accession%3AP69905&format=json&size=1&fields=accession) | 200 | duplicate / duplicate | [free](https://www.uniprot.org/help/license) | - | alias of uniprotapi |
| Norwegian Central Bank / norwegiancentralbank | [GET](https://data.norges-bank.no/api/data/EXR/B.USD.NOK.SP?format=csv&lastNObservations=1) | 200 | ok / ok_csv | [free](https://www.norges-bank.no/en/disclaimer/) | 269 | callable |
| Data.gouv.fr / datagouvfr | [GET](https://www.data.gouv.fr/api/1/datasets/?page_size=1) | 200 | ok / ok_json | [free](https://www.data.gouv.fr/datasets/catalogue-des-donnees-de-data-gouv-fr) | 671 | callable |
| Open Government, Luxembourg / opengovernmentluxembourg | [GET](https://data.public.lu/api/1/datasets/?page_size=1) | 200 | ok / ok_json | [free](https://data.public.lu/en/pages/api-tutorial/) | 440 | callable |
| Open Government, New South Wales / opengovernmentnewsouthwales | [GET](https://data.nsw.gov.au/data/api/3/action/package_search?rows=1&fl=id,name,title,license_id&fq=license_id%3Acc-by) | 200 | ok / ok_json | [free](https://data.nsw.gov.au/data/dataset/collections) | 1288 | callable |
| Austrian Central Bank / austriancentralbank | [GET](https://www.oenb.at/isadataservice/content?lang=en) | 200 | ok / ok_xml | [free](https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.de.html) | 269 | callable |
| Portuguese Central Bank / portuguesecentralbank | [GET](https://bpstat.bportugal.pt/data/v1/domains/29) | 200 | ok / ok_json | [free](https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.de.html) | 1415 | callable |
| Peruvian Central Bank / peruviancentralbank | [GET](https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PN01288PM/json/2016-09/2016-09) | 200 | ok / ok_json | [free](https://estadisticas.bcrp.gob.pe/estadisticas/series/ayuda/condiciones-de-uso) | 1143 | callable |
| Europe PMC / europepmc | [GET](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:1&format=json&pageSize=1) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/about/terms-of-use/) | 375 | callable |
| DataCite API / dataciteapi | [GET](https://api.datacite.org/dois?page%5Bsize%5D=1) | 200 | ok / ok_json | [free](https://support.datacite.org/docs/datacite-data-file-use-policy) | 664 | callable |
| Wikidata / wikidata | [GET](https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q1&props=labels&languages=en&format=json) | 200 | ok / ok_json | [free](https://www.wikidata.org/wiki/Wikidata:Licensing) | 401 | callable |
| Zenodo / zenodo | [GET](https://zenodo.org/api/records?size=1) | 200 | ok / ok_json | [free](https://about.zenodo.org/terms/) | 1608 | callable |
| Figshare / figshare | [GET](https://api.figshare.com/v2/articles?page_size=1) | 200 | ok / ok_json | [free](https://help.figshare.com/article/copyright-and-license-policy) | 712 | callable |
| Bitbucket / bitbucket | [GET](https://api.bitbucket.org/2.0/repositories/atlassian?pagelen=1&fields=values.full_name) | 200 | ok / ok_json | [free](https://developer.atlassian.com/cloud/bitbucket/rest/intro/#authentication) | 495 | callable |
| Color Name API / colornameapi | [GET](https://api.color.pizza/v1/ff0000) | 200 | ok / ok_json | [free](https://github.com/meodai/color-names#api-) | 205 | callable |
| versionhistory.googleapis.com API / chromeversionhistory | [GET](https://versionhistory.googleapis.com/v1/chrome/platforms) | 200 | ok / ok_json | [free](https://developer.chrome.com/docs/web-platform/versionhistory/guide) | 298 | callable |
| StackExchange API / stackexchange | [GET](https://api.stackexchange.com/2.3/info?site=stackoverflow) | 200 | ok / ok_json | [free](https://api.stackexchange.com/docs/throttle) | 270 | callable |
| Swagger Generator / swaggergenerator | [GET](https://generator.swagger.io/api/gen/clients) | 200 | ok / ok_json | [free](https://github.com/swagger-api/swagger-codegen/blob/master/docs/online-generators.md) | 611 | callable |
| Bitbucket API / bitbucket | [GET](https://api.bitbucket.org/2.0/repositories/atlassian?pagelen=1&fields=values.full_name) | 200 | duplicate / duplicate | [free](https://developer.atlassian.com/cloud/bitbucket/rest/) | - | alias of bitbucket |
| Linode API / linodepublic | [GET](https://api.linode.com/v4/regions?page_size=25) | 200 | ok / ok_json | [free](https://techdocs.akamai.com/linode-api/reference/get-regions) | 761 | callable |
| Groundhog Day API / groundhogday | [GET](https://groundhog-day.com/api/v1/groundhogs/punxsutawney-phil) | 200 | ok / ok_json | [free](https://groundhog-day.com/api) | 421 | callable |
| DummyJSON / dummyjson | [GET](https://dummyjson.com/products/1) | 200 | ok / ok_json | [free](https://dummyjson.com/) | 178 | callable |
| restful-api.dev / restfulapidev | [GET](https://api.restful-api.dev/objects/7) | 200 | ok / ok_json | [free](https://restful-api.dev/) | 362 | callable |
| NuGet / nuget | [GET](https://api.nuget.org/v3-flatcontainer/newtonsoft.json/index.json) | 200 | ok / ok_json | [free](https://learn.microsoft.com/en-us/nuget/api/overview) | 150 | callable |
| Mozilla Addons / mozillaaddons | [GET](https://addons.mozilla.org/api/v5/addons/addon/ublock-origin/) | 200 | ok / ok_json | [free](https://mozilla.github.io/addons-server/topics/api/addons) | 626 | callable |
| Mastodon / mastodon | [GET](https://mastodon.social/api/v2/instance) | 200 | ok / ok_json | [free](https://docs.joinmastodon.org/methods/instance/) | 709 | callable |
| Wikimedia / wikimediaanalytics | [GET](https://wikimedia.org/api/rest_v1/metrics/pageviews/aggregate/en.wikipedia/all-access/all-agents/daily/2026100100/2026100100) | 0 | timeout / timeout | [free](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/documentation/access-policy.html) | 377 | discovery |
| Affirmations / affirmations | [GET](https://www.affirmations.dev/) | 200 | ok / ok_json | [free](https://github.com/annthurium/affirmations) | 4043 | callable |
| Research Organization Registry / researchorganizationregistry | [GET](https://api.ror.org/v2/organizations/03yrm5c26) | 200 | ok / ok_json | [free](https://ror.org/about/terms/) | 438 | callable |
| Reactome / reactome | [GET](https://reactome.org/ContentService/data/query/R-HSA-141409) | 200 | ok / ok_json | [free](https://www.reactome.org/about/news/97-updated-license-agreement) | 400 | callable |
| RNAcentral / rnacentral | [GET](https://rnacentral.org/api/v1/rna/URS000075A546) | 200 | ok / ok_json | [free](https://rnacentral.org/help/) | 509 | callable |
| AlphaFold Protein Structure Database / alphafolddb | [GET](https://alphafold.ebi.ac.uk/api/prediction/P69905) | 200 | ok / ok_json | [free](https://alphafold.ebi.ac.uk/assets/License-Disclaimer.pdf) | 454 | callable |
| QuickGO / quickgo | [GET](https://www.ebi.ac.uk/QuickGO/services/ontology/go/terms/GO:0008150) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/about/terms-of-use/) | 541 | callable |
| InterPro / interpro | [GET](https://www.ebi.ac.uk/interpro/api/entry/interpro/IPR000001/) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/about/terms-of-use/) | 1155 | callable |
| Ontology Lookup Service / ontologylookupservice | [GET](https://www.ebi.ac.uk/ols4/api/ontologies/efo) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/about/terms-of-use/) | 2141 | callable |
| PRIDE Archive / pridearchive | [GET](https://www.ebi.ac.uk/pride/ws/archive/v2/projects/PXD000001) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/about/terms-of-use/) | 3139 | callable |
| BioStudies / biostudies | [GET](https://www.ebi.ac.uk/biostudies/api/v1/studies/S-BSST7/info) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/biostudies/RH3R/help) | 3748 | callable |
| BioSamples / biosamples | [GET](https://www.ebi.ac.uk/biosamples/samples?size=1) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/about/terms-of-use/) | 5879 | callable |
| MGnify / mgnify | [GET](https://www.ebi.ac.uk/metagenomics/api/v2/studies/MGYS00010397) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/training/online/courses/mgnify-quick-tour/what-is-mgnify/) | 6046 | callable |
| UniChem / unichem | [GET](https://www.ebi.ac.uk/unichem/api/v1/sources/1) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/about/terms-of-use/) | 6850 | callable |
| MetaboLights / metabolights | [GET](https://www.ebi.ac.uk/metabolights/ws/studies/MTBLS1) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/about/terms-of-use/) | 8010 | callable |
| Directory of Open Access Journals / doaj | [GET](https://doaj.org/api/search/journals/biology?pageSize=1) | 200 | ok / ok_json | [free](https://doaj.org/terms/) | 249 | callable |
| HUGO Gene Nomenclature Committee / hgnc | [GET](https://rest.genenames.org/fetch/symbol/ZNF3) | 200 | ok / ok_json | [free](https://hgnc.genenames.org/about/license/) | 193 | callable |
| Electron Microscopy Data Bank / electronmicroscopydatabank | [GET](https://www.ebi.ac.uk/emdb/api/entry/EMD-1001) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/emdb/documentation/policies) | 7858 | callable |
| BioModels / biomodels | [GET](https://www.biomodels.org/BIOMD0000000001?format=json) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/training/online/courses/biomodels-quick-tour/what-is-biomodels/) | 711 | callable |
| Electron Microscopy Public Image Archive / empiar | [GET](https://www.ebi.ac.uk/empiar/api/entry/EMPIAR-10050/) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/empiar/policies/) | 7610 | callable |
| Cellosaurus / cellosaurus | [GET](https://api.cellosaurus.org/cell-line/CVCL_VG99?fields=ac,str&format=json) | 200 | ok / ok_json | [free](https://www.cellosaurus.org/faq) | 195 | callable |
| JASPAR / jaspar | [GET](https://jaspar.elixir.no/api/v1/matrix/MA0001.1/?format=json) | 200 | ok / ok_json | [free](https://jaspar.elixir.no/faq/) | 284 | callable |
| Alliance of Genome Resources / alliancegenome | [GET](https://www.alliancegenome.org/api/gene/FB:FBgn0000001) | 200 | ok / ok_json | [free](https://github.com/alliance-genome/agr_open_data) | 255 | callable |
| Complex Portal / complexportal | [GET](https://www.ebi.ac.uk/intact/complex-ws/complex/CPX-2158) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/about/terms-of-use/) | 7817 | callable |
| World Register of Marine Species / worldregistermarinespecies | [GET](https://www.marinespecies.org/rest/AphiaRecordByAphiaID/127160) | 200 | ok / ok_json | [free](https://www.marinespecies.org/about.php) | 924 | callable |
| LIPID MAPS / lipidmaps | [GET](https://www.lipidmaps.org/rest/compound/lm_id/LMFA01010001/all/json) | 200 | ok / ok_json | [free](https://www.lipidmaps.org/terms-of-use) | 285 | callable |
| Rhea / rhea | [GET](https://www.rhea-db.org/rhea/?query=&columns=rhea-id,equation&format=tsv&limit=1) | 200 | ok / ok_csv | [free](https://www.rhea-db.org/help/license-disclaimer) | 239 | callable |
| STRING / stringdb | [GET](https://version-12-5.string-db.org/api/json/get_string_ids?identifiers=TP53&species=9606&caller_identity=apiclaw.cloud) | 200 | ok / ok_json | [free](https://en.string-db.org/cgi/access?footer_active_subpage=apis) | 273 | callable |
| Nextbike / nextbike | [GET](https://gbfs.nextbike.net/maps/gbfs/v2/nextbike_al/de/system_information.json) | 200 | ok / ok_json | [free](https://gbfs.nextbike.net/maps/gbfs/v2/nextbike_al/de/system_information.json) | 762 | callable |
| Donkey Republic GBFS / donkeyrepublicgbfs | [GET](https://stables.donkey.bike/api/public/gbfs/3.0/donkey_antwerp/system_information.json) | 200 | ok / ok_json | [free](https://stables.donkey.bike/api/public/gbfs/3.0/donkey_antwerp/system_information.json) | 634 | callable |
| Mobi Bike Share GBFS / mobibikesharegbfs | [GET](https://gbfs.kappa.fifteen.eu/gbfs/2.2/mobi/en/system_information.json) | 200 | ok / ok_json | [free](https://gbfs.kappa.fifteen.eu/gbfs/2.2/mobi/en/system_information.json) | 468 | callable |
| esel.ac GBFS / eselacgbfs | [GET](https://di.esel.ac/gbfs/system_information.json) | 200 | ok / ok_json | [free](https://di.esel.ac/gbfs/system_information.json) | 341 | callable |
| swabi - augsburg GBFS / swabiaugsburggbfs | [GET](https://gbfs.partners.fifteen.eu/gbfs/2.2/swabi/en/system_information.json) | 200 | ok / ok_json | [free](https://gbfs.partners.fifteen.eu/gbfs/2.2/swabi/en/system_information.json) | 267 | callable |
| City Bikes Helsinki GBFS / citybikeshelsinkigbfs | [GET](https://gbfs.theta.fifteen.eu/gbfs/2.2/helsinki/en/system_information.json) | 200 | ok / ok_json | [free](https://gbfs.theta.fifteen.eu/gbfs/2.2/helsinki/en/system_information.json) | 210 | callable |
| Auto-en-Velay GBFS / autoenvelaygbfs | [GET](https://backend.citiz.fr/public/provider/23/gbfs/v3.0/system_information.json) | 200 | ok / ok_json | [free](https://backend.citiz.fr/public/provider/23/gbfs/v3.0/system_information.json) | 245 | callable |
| Optymo Belfort GBFS / optymobelfortgbfs | [GET](https://data.optymo.fr/vls/system_information.json) | 200 | ok / ok_json | [free](https://data.optymo.fr/vls/system_information.json) | 446 | callable |
| Vélivert GBFS / vlivertgbfs | [GET](https://api.saint-etienne-metropole.fr/velivert/api/system_information.json) | 200 | ok / ok_json | [free](https://api.saint-etienne-metropole.fr/velivert/api/system_information.json) | 356 | callable |
| Beryl GBFS / berylgbfs | [GET](https://beryl-gbfs-production.web.app/v2_2/BCP/system_information.json) | 200 | ok / ok_json | [free](https://beryl-gbfs-production.web.app/v2_2/BCP/system_information.json) | 247 | callable |
| Flamingo Auckland GBFS / flamingoaucklandgbfs | [GET](https://data.rideflamingo.com/gbfs/3/auckland/system_information.json) | 200 | ok / ok_json | [free](https://data.rideflamingo.com/gbfs/3/auckland/system_information.json) | 1322 | callable |
| Ontario Data Catalogue / ckan-data-ontario-ca | [GET](https://data.ontario.ca/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.ontario.ca/) | 975 | callable |
| Données Québec / ckan-donneesquebec-ca | [GET](https://www.donneesquebec.ca/recherche/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.donneesquebec.ca/page-api/) | 870 | callable |
| Montréal Open Data / ckan-donnees-montreal-ca | [GET](https://donnees.montreal.ca/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://donnees.montreal.ca/) | 345 | callable |
| BC Data Catalogue API / ckan-catalogue-data-gov-bc-ca | [GET](https://catalogue.data.gov.bc.ca/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www2.gov.bc.ca/gov/content/data/finding-and-sharing/bc-data-catalogue/find) | 3860 | callable |
| Analyze Boston / ckan-data-boston-gov | [GET](https://data.boston.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.boston.gov/) | 574 | callable |
| Schleswig-Holstein Open Data / ckan-opendata-schleswig-holstein-de | [GET](https://opendata.schleswig-holstein.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.schleswig-holstein.de/about) | 217 | callable |
| Aachen Open Data / ckan-offenedaten-aachen-de | [GET](https://offenedaten.aachen.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://offenedaten.aachen.de/about) | 465 | callable |
| Málaga Open Data / ckan-datosabiertos-malaga-eu | [GET](https://datosabiertos.malaga.eu/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datosabiertos.malaga.eu/) | 541 | callable |
| Public Data Catalogue (data.malangkota.go.id) / ckan-data-malangkota-go-id | [GET](https://data.malangkota.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.malangkota.go.id/) | 1056 | callable |
| Public Data Catalogue (data.jatengprov.go.id) / ckan-data-jatengprov-go-id | [GET](https://data.jatengprov.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.jatengprov.go.id/) | 3150 | callable |
| Open Government, Greece / ckan-data-gov-gr | [GET](https://data.gov.gr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.gov.gr/) | 3424 | callable |
| Public Data Catalogue (gdcatalog.go.th) / ckan-gdcatalog-go-th | [GET](https://gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://gdcatalog.go.th/about) | 1036 | callable |
| Public Data Catalogue (data.cnra.ca.gov) / ckan-data-cnra-ca-gov | [GET](https://data.cnra.ca.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.cnra.ca.gov/) | 547 | callable |
| Public Data Catalogue (data.e-gov.go.jp) / ckan-data-e-gov-go-jp | [GET](https://data.e-gov.go.jp/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.e-gov.go.jp/data/) | 482 | callable |
| Public Data Catalogue (data.kaltimprov.go.id) / ckan-data-kaltimprov-go-id | [GET](https://data.kaltimprov.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.kaltimprov.go.id/about) | 1128 | callable |
| Public Data Catalogue (opendata.kebumenkab.go.id) / ckan-opendata-kebumenkab-go-id | [GET](https://opendata.kebumenkab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.kebumenkab.go.id/) | 1012 | callable |
| Public Data Catalogue (data.batangkab.go.id) / ckan-data-batangkab-go-id | [GET](https://data.batangkab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.batangkab.go.id/) | 1165 | callable |
| Public Data Catalogue (data.ca.gov) / ckan-data-ca-gov | [GET](https://data.ca.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.ca.gov/) | 699 | callable |
| Public Data Catalogue (catalogo.datosabiertos.gob.pe) / ckan-catalogo-datosabiertos-gob-pe | [GET](https://catalogo.datosabiertos.gob.pe/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalogo.datosabiertos.gob.pe/) | 999 | callable |
| Public Data Catalogue (dadosabertos.bcb.gov.br) / ckan-dadosabertos-bcb-gov-br | [GET](https://dadosabertos.bcb.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadosabertos.bcb.gov.br/) | 1795 | callable |
| Public Data Catalogue (satudata.kapuaskab.go.id) / ckan-satudata-kapuaskab-go-id | [GET](https://satudata.kapuaskab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://satudata.kapuaskab.go.id/about) | 799 | callable |
| Public Data Catalogue (data.acehprov.go.id) / ckan-data-acehprov-go-id | [GET](https://data.acehprov.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.acehprov.go.id/) | 1741 | callable |
| Public Data Catalogue (data.sukoharjokab.go.id) / ckan-data-sukoharjokab-go-id | [GET](https://data.sukoharjokab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.sukoharjokab.go.id/) | 716 | callable |
| Public Data Catalogue (opendata.rsadhyatma.jatengprov.go.id) / ckan-opendata-rsadhyatma-jatengprov-go-id | [GET](https://opendata.rsadhyatma.jatengprov.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.rsadhyatma.jatengprov.go.id/about) | 1354 | callable |
| Public Data Catalogue (opendata.magelangkab.go.id) / ckan-opendata-magelangkab-go-id | [GET](https://opendata.magelangkab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.magelangkab.go.id/about) | 955 | callable |
| Public Data Catalogue (data.purworejokab.go.id) / ckan-data-purworejokab-go-id | [GET](https://data.purworejokab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.purworejokab.go.id/) | 1300 | callable |
| Public Data Catalogue (opendata.bcb.gov.br) / ckan-opendata-bcb-gov-br | [GET](https://opendata.bcb.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.bcb.gov.br/) | 1243 | callable |
| Public Data Catalogue (data.tegalkab.go.id) / ckan-data-tegalkab-go-id | [GET](https://data.tegalkab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.tegalkab.go.id/) | 808 | callable |
| Public Data Catalogue (gifu-opendata.pref.gifu.lg.jp) / ckan-gifu-opendata-pref-gifu-lg-jp | [GET](https://gifu-opendata.pref.gifu.lg.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://gifu-opendata.pref.gifu.lg.jp/) | 1419 | callable |
| Public Data Catalogue (opendata.brebeskab.go.id) / ckan-opendata-brebeskab-go-id | [GET](https://opendata.brebeskab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.brebeskab.go.id/) | 769 | callable |
| Public Data Catalogue (opendata.nesdc.go.th) / ckan-opendata-nesdc-go-th | [GET](https://opendata.nesdc.go.th/api/3/action/package_search?rows=1) | 200 | unresolved / customer_gateway_failed | [free](https://opendata.nesdc.go.th/about) | 7766 | discovery |
| Public Data Catalogue (data.gov.lv) / ckan-data-gov-lv | [GET](https://data.gov.lv/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.gov.lv/) | 216 | callable |
| Public Data Catalogue (data.salatiga.go.id) / ckan-data-salatiga-go-id | [GET](https://data.salatiga.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.salatiga.go.id/) | 1326 | callable |
| Public Data Catalogue (datacatalogue.gov.ie) / ckan-datacatalogue-gov-ie | [GET](https://datacatalogue.gov.ie/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datacatalogue.gov.ie/) | 264 | callable |
| Public Data Catalogue (data.lhokseumawekota.go.id) / ckan-data-lhokseumawekota-go-id | [GET](https://data.lhokseumawekota.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.lhokseumawekota.go.id/) | 1300 | callable |
| Public Data Catalogue (data.kendalkab.go.id) / ckan-data-kendalkab-go-id | [GET](https://data.kendalkab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.kendalkab.go.id/) | 2415 | callable |
| Public Data Catalogue (data.gov.kg) / ckan-data-gov-kg | [GET](https://data.gov.kg/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.gov.kg/) | 2623 | callable |
| Public Data Catalogue (opendata.malinau.go.id) / ckan-opendata-malinau-go-id | [GET](https://opendata.malinau.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.malinau.go.id/about) | 2358 | callable |
| Public Data Catalogue (dataset.gov.md) / ckan-dataset-gov-md | [GET](https://dataset.gov.md/api/3/action/package_search?rows=1) | 200 | unresolved / customer_gateway_failed | [free](https://dataset.gov.md/about) | 2308 | discovery |
| Public Data Catalogue (opendata.klaten.go.id) / ckan-opendata-klaten-go-id | [GET](https://opendata.klaten.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.klaten.go.id/) | 1689 | callable |
| Public Data Catalogue (phichit.gdcatalog.go.th) / ckan-phichit-gdcatalog-go-th | [GET](https://phichit.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://phichit.gdcatalog.go.th/about) | 1621 | callable |
| Public Data Catalogue (data.balikpapan.go.id) / ckan-data-balikpapan-go-id | [GET](https://data.balikpapan.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.balikpapan.go.id/) | 1636 | callable |
| Public Data Catalogue (admin.opendatani.gov.uk) / ckan-admin-opendatani-gov-uk | [GET](https://admin.opendatani.gov.uk/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://admin.opendatani.gov.uk/about) | 385 | callable |
| Public Data Catalogue (satudata.landakkab.go.id) / ckan-satudata-landakkab-go-id | [GET](https://satudata.landakkab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://satudata.landakkab.go.id/) | 998 | callable |
| Public Data Catalogue (datos.gob.do) / ckan-datos-gob-do | [GET](https://datos.gob.do/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.gob.do/) | 732 | callable |
| Public Data Catalogue (data.nt.gov.au) / ckan-data-nt-gov-au | [GET](https://data.nt.gov.au/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.nt.gov.au/) | 1404 | callable |
| Public Data Catalogue (satudata.denpasarkota.go.id) / ckan-satudata-denpasarkota-go-id | [GET](https://satudata.denpasarkota.go.id/api/3/action/package_search?rows=1) | 0 | dead_upstream / network_error | [free](https://satudata.denpasarkota.go.id/) | 115 | discovery |
| Public Data Catalogue (dataset.jogjakota.go.id) / ckan-dataset-jogjakota-go-id | [GET](https://dataset.jogjakota.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dataset.jogjakota.go.id/) | 2026 | callable |
| Public Data Catalogue (opendata.hawaii.gov) / ckan-opendata-hawaii-gov | [GET](https://opendata.hawaii.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.hawaii.gov/) | 614 | callable |
| Public Data Catalogue (data.gov.me) / ckan-data-gov-me | [GET](https://data.gov.me/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.gov.me/about) | 1153 | callable |
| Public Data Catalogue (data.simeuluekab.go.id) / ckan-data-simeuluekab-go-id | [GET](https://data.simeuluekab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.simeuluekab.go.id/) | 1429 | callable |
| Public Data Catalogue (data.grobogan.go.id) / ckan-data-grobogan-go-id | [GET](https://data.grobogan.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.grobogan.go.id/) | 1345 | callable |
| Public Data Catalogue (data.acehtimurkab.go.id) / ckan-data-acehtimurkab-go-id | [GET](https://data.acehtimurkab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.acehtimurkab.go.id/) | 1462 | callable |
| Public Data Catalogue (data.beltim.go.id) / ckan-data-beltim-go-id | [GET](https://data.beltim.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.beltim.go.id/about) | 1825 | callable |
| Public Data Catalogue (data.mahakamulukab.go.id) / ckan-data-mahakamulukab-go-id | [GET](https://data.mahakamulukab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.mahakamulukab.go.id/) | 908 | callable |
| Public Data Catalogue (ckan.sampangkab.go.id) / ckan-ckan-sampangkab-go-id | [GET](https://ckan.sampangkab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.sampangkab.go.id/) | 998 | callable |
| Public Data Catalogue (phitsanulok.gdcatalog.go.th) / ckan-phitsanulok-gdcatalog-go-th | [GET](https://phitsanulok.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://phitsanulok.gdcatalog.go.th/about) | 1196 | callable |
| Public Data Catalogue (data.acehbaratkab.go.id) / ckan-data-acehbaratkab-go-id | [GET](https://data.acehbaratkab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.acehbaratkab.go.id/) | 1572 | callable |
| Public Data Catalogue (sisaket.gdcatalog.go.th) / ckan-sisaket-gdcatalog-go-th | [GET](https://sisaket.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://sisaket.gdcatalog.go.th/about) | 1046 | callable |
| Public Data Catalogue (surin.gdcatalog.go.th) / ckan-surin-gdcatalog-go-th | [GET](https://surin.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://surin.gdcatalog.go.th/about) | 1055 | callable |
| Public Data Catalogue (data.city.yokohama.lg.jp) / ckan-data-city-yokohama-lg-jp | [GET](https://data.city.yokohama.lg.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.city.yokohama.lg.jp/) | 1332 | callable |
| Public Data Catalogue (satudata.kendarikota.go.id) / ckan-satudata-kendarikota-go-id | [GET](https://satudata.kendarikota.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://satudata.kendarikota.go.id/) | 702 | callable |
| Public Data Catalogue (lopburi.gdcatalog.go.th) / ckan-lopburi-gdcatalog-go-th | [GET](https://lopburi.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://lopburi.gdcatalog.go.th/about) | 1032 | callable |
| Public Data Catalogue (nakhonratchasima.gdcatalog.go.th) / ckan-nakhonratchasima-gdcatalog-go-th | [GET](https://nakhonratchasima.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://nakhonratchasima.gdcatalog.go.th/about) | 801 | callable |
| Public Data Catalogue (opendata.samarindakota.go.id) / ckan-opendata-samarindakota-go-id | [GET](https://opendata.samarindakota.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.samarindakota.go.id/) | 797 | callable |
| Public Data Catalogue (datagov.mot.go.th) / ckan-datagov-mot-go-th | [GET](https://datagov.mot.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datagov.mot.go.th/) | 2080 | callable |
| Public Data Catalogue (mahasarakham.gdcatalog.go.th) / ckan-mahasarakham-gdcatalog-go-th | [GET](https://mahasarakham.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://mahasarakham.gdcatalog.go.th/about) | 1021 | callable |
| Public Data Catalogue (dados.ciga.sc.gov.br) / ckan-dados-ciga-sc-gov-br | [GET](https://dados.ciga.sc.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ciga.sc.gov.br/) | 1070 | callable |
| Public Data Catalogue (data.pidiekab.go.id) / ckan-data-pidiekab-go-id | [GET](https://data.pidiekab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.pidiekab.go.id/) | 1279 | callable |
| Public Data Catalogue (tak.gdcatalog.go.th) / ckan-tak-gdcatalog-go-th | [GET](https://tak.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://tak.gdcatalog.go.th/about) | 1056 | callable |
| Public Data Catalogue (khonkaen.gdcatalog.go.th) / ckan-khonkaen-gdcatalog-go-th | [GET](https://khonkaen.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://khonkaen.gdcatalog.go.th/about) | 1031 | callable |
| Public Data Catalogue (data.stat.pref.miyazaki.lg.jp) / ckan-data-stat-pref-miyazaki-lg-jp | [GET](https://data.stat.pref.miyazaki.lg.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.stat.pref.miyazaki.lg.jp/about) | 2230 | callable |
| Public Data Catalogue (dados.es.gov.br) / ckan-dados-es-gov-br | [GET](https://dados.es.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.es.gov.br/) | 1314 | callable |
| Public Data Catalogue (sisada.pematangsiantar.go.id) / ckan-sisada-pematangsiantar-go-id | [GET](https://sisada.pematangsiantar.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://sisada.pematangsiantar.go.id/about) | 734 | callable |
| Public Data Catalogue (chiangmai.gdcatalog.go.th) / ckan-chiangmai-gdcatalog-go-th | [GET](https://chiangmai.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://chiangmai.gdcatalog.go.th/about) | 801 | callable |
| Public Data Catalogue (opendata.penghu.gov.tw) / ckan-opendata-penghu-gov-tw | [GET](https://opendata.penghu.gov.tw/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.penghu.gov.tw/) | 2437 | callable |
| Public Data Catalogue (opendata.bolmongkab.go.id) / ckan-opendata-bolmongkab-go-id | [GET](https://opendata.bolmongkab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.bolmongkab.go.id/) | 808 | callable |
| Public Data Catalogue (data.chhs.ca.gov) / ckan-data-chhs-ca-gov | [GET](https://data.chhs.ca.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.chhs.ca.gov/) | 606 | callable |
| Public Data Catalogue (buengkan.gdcatalog.go.th) / ckan-buengkan-gdcatalog-go-th | [GET](https://buengkan.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://buengkan.gdcatalog.go.th/about) | 787 | callable |
| Public Data Catalogue (dados.prefeitura.sp.gov.br) / ckan-dados-prefeitura-sp-gov-br | [GET](https://dados.prefeitura.sp.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.prefeitura.sp.gov.br/) | 2108 | callable |
| Public Data Catalogue (kanchanaburi.gdcatalog.go.th) / ckan-kanchanaburi-gdcatalog-go-th | [GET](https://kanchanaburi.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://kanchanaburi.gdcatalog.go.th/about) | 822 | callable |
| Public Data Catalogue (suphanburi.gdcatalog.go.th) / ckan-suphanburi-gdcatalog-go-th | [GET](https://suphanburi.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://suphanburi.gdcatalog.go.th/about) | 845 | callable |
| Public Data Catalogue (sakonnakhon.gdcatalog.go.th) / ckan-sakonnakhon-gdcatalog-go-th | [GET](https://sakonnakhon.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://sakonnakhon.gdcatalog.go.th/about) | 806 | callable |
| Public Data Catalogue (opendata.housing.gov.ie) / ckan-opendata-housing-gov-ie | [GET](https://opendata.housing.gov.ie/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.housing.gov.ie/) | 225 | callable |
| Public Data Catalogue (data.treasury.ri.gov) / ckan-data-treasury-ri-gov | [GET](https://data.treasury.ri.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.treasury.ri.gov/) | 823 | callable |
| Public Data Catalogue (nongbualamphu.gdcatalog.go.th) / ckan-nongbualamphu-gdcatalog-go-th | [GET](https://nongbualamphu.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://nongbualamphu.gdcatalog.go.th/about) | 1115 | callable |
| Public Data Catalogue (saraburi.gdcatalog.go.th) / ckan-saraburi-gdcatalog-go-th | [GET](https://saraburi.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://saraburi.gdcatalog.go.th/about) | 1202 | callable |
| Public Data Catalogue (satudata.padang.go.id) / ckan-satudata-padang-go-id | [GET](https://satudata.padang.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://satudata.padang.go.id/) | 790 | callable |
| Public Data Catalogue (dadosabertos.sp.gov.br) / ckan-dadosabertos-sp-gov-br | [GET](https://dadosabertos.sp.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadosabertos.sp.gov.br/) | 953 | callable |
| Public Data Catalogue (dadosabertos.go.gov.br) / ckan-dadosabertos-go-gov-br | [GET](https://dadosabertos.go.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadosabertos.go.gov.br/) | 1784 | callable |
| Public Data Catalogue (uttaradit.gdcatalog.go.th) / ckan-uttaradit-gdcatalog-go-th | [GET](https://uttaradit.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://uttaradit.gdcatalog.go.th/about) | 1043 | callable |
| Public Data Catalogue (satudata.dharmasrayakab.go.id) / ckan-satudata-dharmasrayakab-go-id | [GET](https://satudata.dharmasrayakab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://satudata.dharmasrayakab.go.id/about) | 740 | callable |
| Public Data Catalogue (lampang.gdcatalog.go.th) / ckan-lampang-gdcatalog-go-th | [GET](https://lampang.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://lampang.gdcatalog.go.th/about) | 1032 | callable |
| Public Data Catalogue (samutsongkhram.gdcatalog.go.th) / ckan-samutsongkhram-gdcatalog-go-th | [GET](https://samutsongkhram.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://samutsongkhram.gdcatalog.go.th/about) | 1053 | callable |
| Public Data Catalogue (nakhonpathom.gdcatalog.go.th) / ckan-nakhonpathom-gdcatalog-go-th | [GET](https://nakhonpathom.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://nakhonpathom.gdcatalog.go.th/about) | 1025 | callable |
| Public Data Catalogue (suratthani.gdcatalog.go.th) / ckan-suratthani-gdcatalog-go-th | [GET](https://suratthani.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://suratthani.gdcatalog.go.th/about) | 1024 | callable |
| Public Data Catalogue (chachoengsao.gdcatalog.go.th) / ckan-chachoengsao-gdcatalog-go-th | [GET](https://chachoengsao.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://chachoengsao.gdcatalog.go.th/about) | 820 | callable |
| Public Data Catalogue (kalasin.gdcatalog.go.th) / ckan-kalasin-gdcatalog-go-th | [GET](https://kalasin.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://kalasin.gdcatalog.go.th/about) | 792 | callable |
| Public Data Catalogue (sukhothai.gdcatalog.go.th) / ckan-sukhothai-gdcatalog-go-th | [GET](https://sukhothai.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://sukhothai.gdcatalog.go.th/about) | 1035 | callable |
| Public Data Catalogue (dados.rs.gov.br) / ckan-dados-rs-gov-br | [GET](https://dados.rs.gov.br/api/3/action/package_search?rows=1) | 200 | unresolved / customer_gateway_failed | [free](https://dados.rs.gov.br/) | 2363 | discovery |
| Public Data Catalogue (maehongson.gdcatalog.go.th) / ckan-maehongson-gdcatalog-go-th | [GET](https://maehongson.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://maehongson.gdcatalog.go.th/about) | 1028 | callable |
| Public Data Catalogue (narathiwat.gdcatalog.go.th) / ckan-narathiwat-gdcatalog-go-th | [GET](https://narathiwat.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://narathiwat.gdcatalog.go.th/about) | 783 | callable |
| Public Data Catalogue (data.ok.gov) / ckan-data-ok-gov | [GET](https://data.ok.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.ok.gov/) | 696 | callable |
| Public Data Catalogue (datos.slp.gob.mx) / ckan-datos-slp-gob-mx | [GET](https://datos.slp.gob.mx/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.slp.gob.mx/) | 3489 | callable |
| Public Data Catalogue (yasothon.gdcatalog.go.th) / ckan-yasothon-gdcatalog-go-th | [GET](https://yasothon.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://yasothon.gdcatalog.go.th/about) | 1074 | callable |
| Public Data Catalogue (prachuapkhirikhan.gdcatalog.go.th) / ckan-prachuapkhirikhan-gdcatalog-go-th | [GET](https://prachuapkhirikhan.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://prachuapkhirikhan.gdcatalog.go.th/about) | 1032 | callable |
| Public Data Catalogue (krabi.gdcatalog.go.th) / ckan-krabi-gdcatalog-go-th | [GET](https://krabi.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://krabi.gdcatalog.go.th/about) | 1044 | callable |
| Public Data Catalogue (chonburi.gdcatalog.go.th) / ckan-chonburi-gdcatalog-go-th | [GET](https://chonburi.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://chonburi.gdcatalog.go.th/about) | 1108 | callable |
| Public Data Catalogue (ubonratchathani.gdcatalog.go.th) / ckan-ubonratchathani-gdcatalog-go-th | [GET](https://ubonratchathani.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ubonratchathani.gdcatalog.go.th/about) | 1028 | callable |
| Public Data Catalogue (datos.veracruzmunicipio.gob.mx) / ckan-datos-veracruzmunicipio-gob-mx | [GET](https://datos.veracruzmunicipio.gob.mx/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.veracruzmunicipio.gob.mx/) | 844 | callable |
| Public Data Catalogue (sakaeo.gdcatalog.go.th) / ckan-sakaeo-gdcatalog-go-th | [GET](https://sakaeo.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://sakaeo.gdcatalog.go.th/about) | 779 | callable |
| Public Data Catalogue (pathumthani.gdcatalog.go.th) / ckan-pathumthani-gdcatalog-go-th | [GET](https://pathumthani.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://pathumthani.gdcatalog.go.th/about) | 1036 | callable |
| Public Data Catalogue (chiangrai.gdcatalog.go.th) / ckan-chiangrai-gdcatalog-go-th | [GET](https://chiangrai.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://chiangrai.gdcatalog.go.th/about) | 1045 | callable |
| Public Data Catalogue (amnatcharoen.gdcatalog.go.th) / ckan-amnatcharoen-gdcatalog-go-th | [GET](https://amnatcharoen.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://amnatcharoen.gdcatalog.go.th/about) | 1019 | callable |
| Public Data Catalogue (singburi.gdcatalog.go.th) / ckan-singburi-gdcatalog-go-th | [GET](https://singburi.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://singburi.gdcatalog.go.th/about) | 1053 | callable |
| Public Data Catalogue (lamphun.gdcatalog.go.th) / ckan-lamphun-gdcatalog-go-th | [GET](https://lamphun.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://lamphun.gdcatalog.go.th/about) | 1053 | callable |
| Public Data Catalogue (trat.gdcatalog.go.th) / ckan-trat-gdcatalog-go-th | [GET](https://trat.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://trat.gdcatalog.go.th/about) | 793 | callable |
| Public Data Catalogue (chanthaburi.gdcatalog.go.th) / ckan-chanthaburi-gdcatalog-go-th | [GET](https://chanthaburi.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://chanthaburi.gdcatalog.go.th/about) | 1016 | callable |
| Public Data Catalogue (nongkhai.gdcatalog.go.th) / ckan-nongkhai-gdcatalog-go-th | [GET](https://nongkhai.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://nongkhai.gdcatalog.go.th/about) | 1056 | callable |
| Public Data Catalogue (uthaithani.gdcatalog.go.th) / ckan-uthaithani-gdcatalog-go-th | [GET](https://uthaithani.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://uthaithani.gdcatalog.go.th/about) | 1052 | callable |
| Public Data Catalogue (phayao.gdcatalog.go.th) / ckan-phayao-gdcatalog-go-th | [GET](https://phayao.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://phayao.gdcatalog.go.th/about) | 1017 | callable |
| Public Data Catalogue (chaiyaphum.gdcatalog.go.th) / ckan-chaiyaphum-gdcatalog-go-th | [GET](https://chaiyaphum.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://chaiyaphum.gdcatalog.go.th/about) | 783 | callable |
| Public Data Catalogue (kamphaengphet.gdcatalog.go.th) / ckan-kamphaengphet-gdcatalog-go-th | [GET](https://kamphaengphet.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://kamphaengphet.gdcatalog.go.th/about) | 1048 | callable |
| Public Data Catalogue (pattani.gdcatalog.go.th) / ckan-pattani-gdcatalog-go-th | [GET](https://pattani.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://pattani.gdcatalog.go.th/about) | 1015 | callable |
| Public Data Catalogue (nonthaburi.gdcatalog.go.th) / ckan-nonthaburi-gdcatalog-go-th | [GET](https://nonthaburi.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://nonthaburi.gdcatalog.go.th/about) | 1035 | callable |
| Public Data Catalogue (chumphon.gdcatalog.go.th) / ckan-chumphon-gdcatalog-go-th | [GET](https://chumphon.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://chumphon.gdcatalog.go.th/about) | 1036 | callable |
| Public Data Catalogue (phetchaburi.gdcatalog.go.th) / ckan-phetchaburi-gdcatalog-go-th | [GET](https://phetchaburi.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://phetchaburi.gdcatalog.go.th/about) | 1023 | callable |
| Public Data Catalogue (chainat.gdcatalog.go.th) / ckan-chainat-gdcatalog-go-th | [GET](https://chainat.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://chainat.gdcatalog.go.th/about) | 1012 | callable |
| Public Data Catalogue (ranong.gdcatalog.go.th) / ckan-ranong-gdcatalog-go-th | [GET](https://ranong.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ranong.gdcatalog.go.th/about) | 778 | callable |
| Public Data Catalogue (loei.gdcatalog.go.th) / ckan-loei-gdcatalog-go-th | [GET](https://loei.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://loei.gdcatalog.go.th/about) | 1031 | callable |
| Public Data Catalogue (satun.gdcatalog.go.th) / ckan-satun-gdcatalog-go-th | [GET](https://satun.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://satun.gdcatalog.go.th/about) | 1051 | callable |
| Public Data Catalogue (buriram.gdcatalog.go.th) / ckan-buriram-gdcatalog-go-th | [GET](https://buriram.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://buriram.gdcatalog.go.th/about) | 1048 | callable |
| Public Data Catalogue (datosabiertos.mercedes.gob.ar) / ckan-datosabiertos-mercedes-gob-ar | [GET](https://datosabiertos.mercedes.gob.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datosabiertos.mercedes.gob.ar/) | 1606 | callable |
| Public Data Catalogue (phetchabun.gdcatalog.go.th) / ckan-phetchabun-gdcatalog-go-th | [GET](https://phetchabun.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://phetchabun.gdcatalog.go.th/about) | 1055 | callable |
| Public Data Catalogue (phrae.gdcatalog.go.th) / ckan-phrae-gdcatalog-go-th | [GET](https://phrae.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://phrae.gdcatalog.go.th/about) | 1030 | callable |
| Public Data Catalogue (samutprakan.gdcatalog.go.th) / ckan-samutprakan-gdcatalog-go-th | [GET](https://samutprakan.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://samutprakan.gdcatalog.go.th/about) | 1001 | callable |
| Public Data Catalogue (datos.csjn.gov.ar) / ckan-datos-csjn-gov-ar | [GET](https://datos.csjn.gov.ar/api/3/action/package_search?rows=1) | 200 | unresolved / customer_gateway_failed | [free](https://datos.csjn.gov.ar/) | 1516 | discovery |
| Public Data Catalogue (data.sabangkota.go.id) / ckan-data-sabangkota-go-id | [GET](https://data.sabangkota.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.sabangkota.go.id/) | 1311 | callable |
| Public Data Catalogue (nakhonphanom.gdcatalog.go.th) / ckan-nakhonphanom-gdcatalog-go-th | [GET](https://nakhonphanom.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://nakhonphanom.gdcatalog.go.th/about) | 863 | callable |
| Public Data Catalogue (phranakhonsiayutthaya.gdcatalog.go.th) / ckan-phranakhonsiayutthaya-gdcatalog-go-th | [GET](https://phranakhonsiayutthaya.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://phranakhonsiayutthaya.gdcatalog.go.th/about) | 1047 | callable |
| Public Data Catalogue (phatthalung.gdcatalog.go.th) / ckan-phatthalung-gdcatalog-go-th | [GET](https://phatthalung.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://phatthalung.gdcatalog.go.th/about) | 1104 | callable |
| Public Data Catalogue (trang.gdcatalog.go.th) / ckan-trang-gdcatalog-go-th | [GET](https://trang.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://trang.gdcatalog.go.th/about) | 1073 | callable |
| Public Data Catalogue (data.acehbaratdayakab.go.id) / ckan-data-acehbaratdayakab-go-id | [GET](https://data.acehbaratdayakab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.acehbaratdayakab.go.id/) | 1330 | callable |
| Public Data Catalogue (yala.gdcatalog.go.th) / ckan-yala-gdcatalog-go-th | [GET](https://yala.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://yala.gdcatalog.go.th/about) | 1036 | callable |
| Public Data Catalogue (nakhonsithammarat.gdcatalog.go.th) / ckan-nakhonsithammarat-gdcatalog-go-th | [GET](https://nakhonsithammarat.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://nakhonsithammarat.gdcatalog.go.th/about) | 781 | callable |
| Public Data Catalogue (songkhla.gdcatalog.go.th) / ckan-songkhla-gdcatalog-go-th | [GET](https://songkhla.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://songkhla.gdcatalog.go.th/about) | 808 | callable |
| Public Data Catalogue (samutsakhon.gdcatalog.go.th) / ckan-samutsakhon-gdcatalog-go-th | [GET](https://samutsakhon.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://samutsakhon.gdcatalog.go.th/about) | 789 | callable |
| Public Data Catalogue (nakhonnayok.gdcatalog.go.th) / ckan-nakhonnayok-gdcatalog-go-th | [GET](https://nakhonnayok.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://nakhonnayok.gdcatalog.go.th/about) | 1024 | callable |
| Public Data Catalogue (opendata.thanhhoa.gov.vn) / ckan-opendata-thanhhoa-gov-vn | [GET](https://opendata.thanhhoa.gov.vn/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.thanhhoa.gov.vn/about) | 1298 | callable |
| Public Data Catalogue (ckan.pref.akita.lg.jp) / ckan-ckan-pref-akita-lg-jp | [GET](https://ckan.pref.akita.lg.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.pref.akita.lg.jp/) | 1395 | callable |
| Public Data Catalogue (rayong.gdcatalog.go.th) / ckan-rayong-gdcatalog-go-th | [GET](https://rayong.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://rayong.gdcatalog.go.th/about) | 1509 | callable |
| Public Data Catalogue (data.pidiejayakab.go.id) / ckan-data-pidiejayakab-go-id | [GET](https://data.pidiejayakab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.pidiejayakab.go.id/) | 1574 | callable |
| Public Data Catalogue (opendata.slavuta-mvk.gov.ua) / ckan-opendata-slavuta-mvk-gov-ua | [GET](https://opendata.slavuta-mvk.gov.ua/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.slavuta-mvk.gov.ua/about) | 706 | callable |
| Public Data Catalogue (phuket.gdcatalog.go.th) / ckan-phuket-gdcatalog-go-th | [GET](https://phuket.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://phuket.gdcatalog.go.th/about) | 1284 | callable |
| Public Data Catalogue (nan.gdcatalog.go.th) / ckan-nan-gdcatalog-go-th | [GET](https://nan.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://nan.gdcatalog.go.th/about) | 1788 | callable |
| Public Data Catalogue (udonthani.gdcatalog.go.th) / ckan-udonthani-gdcatalog-go-th | [GET](https://udonthani.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://udonthani.gdcatalog.go.th/about) | 1352 | callable |
| Transport NSW / ckan-opendata-transport-nsw-gov-au | [GET](https://opendata.transport.nsw.gov.au/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.transport.nsw.gov.au/) | 3720 | callable |
| Public Data Catalogue (mukdahan.gdcatalog.go.th) / ckan-mukdahan-gdcatalog-go-th | [GET](https://mukdahan.gdcatalog.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://mukdahan.gdcatalog.go.th/about) | 1159 | callable |
| Public Data Catalogue (datos.estadistica.ec.gba.gov.ar) / ckan-datos-estadistica-ec-gba-gov-ar | [GET](https://datos.estadistica.ec.gba.gov.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.estadistica.ec.gba.gov.ar/) | 1144 | callable |
| Public Data Catalogue (datos.bahia.gob.ar) / ckan-datos-bahia-gob-ar | [GET](https://datos.bahia.gob.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.bahia.gob.ar/) | 1465 | callable |
| Public Data Catalogue (gdcatalog.energy.go.th) / ckan-gdcatalog-energy-go-th | [GET](https://gdcatalog.energy.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://gdcatalog.energy.go.th/about) | 2684 | callable |
| Public Data Catalogue (data.pesisirselatankab.go.id) / ckan-data-pesisirselatankab-go-id | [GET](https://data.pesisirselatankab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.pesisirselatankab.go.id/) | 1043 | callable |
| Public Data Catalogue (catalog.oae.go.th) / ckan-catalog-oae-go-th | [GET](https://catalog.oae.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalog.oae.go.th/) | 1300 | callable |
| Public Data Catalogue (datosabiertos.mendoza.gov.ar) / ckan-datosabiertos-mendoza-gov-ar | [GET](https://datosabiertos.mendoza.gov.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datosabiertos.mendoza.gov.ar/) | 1818 | callable |
| Public Data Catalogue (satudata.acehutara.go.id) / ckan-satudata-acehutara-go-id | [GET](https://satudata.acehutara.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://satudata.acehutara.go.id/) | 1350 | callable |
| Public Data Catalogue (data.acehjayakab.go.id) / ckan-data-acehjayakab-go-id | [GET](https://data.acehjayakab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.acehjayakab.go.id/) | 1798 | callable |
| Public Data Catalogue (data.milwaukee.gov) / ckan-data-milwaukee-gov | [GET](https://data.milwaukee.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.milwaukee.gov/) | 948 | callable |
| Public Data Catalogue (ckan.ciudaddemendoza.gob.ar) / ckan-ckan-ciudaddemendoza-gob-ar | [GET](https://ckan.ciudaddemendoza.gob.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.ciudaddemendoza.gob.ar/) | 2571 | callable |
| Public Data Catalogue (data.sanjoseca.gov) / ckan-data-sanjoseca-gov | [GET](https://data.sanjoseca.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.sanjoseca.gov/) | 788 | callable |
| Public Data Catalogue (data.sanantonio.gov) / ckan-data-sanantonio-gov | [GET](https://data.sanantonio.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.sanantonio.gov/) | 823 | callable |
| Public Data Catalogue (data.lutskrada.gov.ua) / ckan-data-lutskrada-gov-ua | [GET](https://data.lutskrada.gov.ua/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.lutskrada.gov.ua/about) | 328 | callable |
| Public Data Catalogue (portal-data.kemenkum.go.id) / ckan-portal-data-kemenkum-go-id | [GET](https://portal-data.kemenkum.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://portal-data.kemenkum.go.id/about) | 2270 | callable |
| Public Data Catalogue (data.manggaraikab.go.id) / ckan-data-manggaraikab-go-id | [GET](https://data.manggaraikab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.manggaraikab.go.id/) | 1135 | callable |
| Public Data Catalogue (sdi.palukota.go.id) / ckan-sdi-palukota-go-id | [GET](https://sdi.palukota.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://sdi.palukota.go.id/) | 1190 | callable |
| Public Data Catalogue (data.sugarlandtx.gov) / ckan-data-sugarlandtx-gov | [GET](https://data.sugarlandtx.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.sugarlandtx.gov/) | 967 | callable |
| Public Data Catalogue (gdcatalog.dft.go.th) / ckan-gdcatalog-dft-go-th | [GET](https://gdcatalog.dft.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://gdcatalog.dft.go.th/) | 3680 | callable |
| Public Data Catalogue (opdt.city.toyama.lg.jp) / ckan-opdt-city-toyama-lg-jp | [GET](https://opdt.city.toyama.lg.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opdt.city.toyama.lg.jp/) | 2269 | callable |
| Public Data Catalogue (catalogodatos.nl.gob.mx) / ckan-catalogodatos-nl-gob-mx | [GET](https://catalogodatos.nl.gob.mx/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalogodatos.nl.gob.mx/) | 2000 | callable |
| Public Data Catalogue (opendata.nikaia-rentis.gov.gr) / ckan-opendata-nikaia-rentis-gov-gr | [GET](https://opendata.nikaia-rentis.gov.gr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.nikaia-rentis.gov.gr/) | 366 | callable |
| Public Data Catalogue (opendata.gov.je) / ckan-opendata-gov-je | [GET](https://opendata.gov.je/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.gov.je/about) | 365 | callable |
| Public Data Catalogue (catalog.city.kobe.lg.jp) / ckan-catalog-city-kobe-lg-jp | [GET](https://catalog.city.kobe.lg.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalog.city.kobe.lg.jp/about) | 1670 | callable |
| Public Data Catalogue (opendata.cifs.go.th) / ckan-opendata-cifs-go-th | [GET](https://opendata.cifs.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.cifs.go.th/) | 3054 | callable |
| Public Data Catalogue (dados.sc.gov.br) / ckan-dados-sc-gov-br | [GET](https://dados.sc.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.sc.gov.br/) | 1380 | callable |
| Public Data Catalogue (catalogo.datos.gba.gob.ar) / ckan-catalogo-datos-gba-gob-ar | [GET](https://catalogo.datos.gba.gob.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalogo.datos.gba.gob.ar/) | 1930 | callable |
| Public Data Catalogue (data.houstontx.gov) / ckan-data-houstontx-gov | [GET](https://data.houstontx.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.houstontx.gov/) | 8922 | callable |
| Public Data Catalogue (dados.mg.gov.br) / ckan-dados-mg-gov-br | [GET](https://dados.mg.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.mg.gov.br/) | 1113 | callable |
| Public Data Catalogue (dados.mogidascruzes.sp.gov.br) / ckan-dados-mogidascruzes-sp-gov-br | [GET](https://dados.mogidascruzes.sp.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.mogidascruzes.sp.gov.br/) | 1171 | callable |
| Public Data Catalogue (data.santamonica.gov) / ckan-data-santamonica-gov | [GET](https://data.santamonica.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.santamonica.gov/) | 919 | callable |
| Public Data Catalogue (opendata.obec.go.th) / ckan-opendata-obec-go-th | [GET](https://opendata.obec.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.obec.go.th/about) | 1407 | callable |
| Public Data Catalogue (datos.ciudaddecorrientes.gov.ar) / ckan-datos-ciudaddecorrientes-gov-ar | [GET](https://datos.ciudaddecorrientes.gov.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.ciudaddecorrientes.gov.ar/) | 1226 | callable |
| Public Data Catalogue (satudata.solokkab.go.id) / ckan-satudata-solokkab-go-id | [GET](https://satudata.solokkab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://satudata.solokkab.go.id/about) | 1063 | callable |
| Public Data Catalogue (dataportal.opdc.go.th) / ckan-dataportal-opdc-go-th | [GET](https://dataportal.opdc.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dataportal.opdc.go.th/about) | 528 | callable |
| Public Data Catalogue (datos.jus.gob.ar) / ckan-datos-jus-gob-ar | [GET](https://datos.jus.gob.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.jus.gob.ar/) | 2852 | callable |
| Public Data Catalogue (dados.florestal.gov.br) / ckan-dados-florestal-gov-br | [GET](https://dados.florestal.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.florestal.gov.br/) | 1071 | callable |
| Public Data Catalogue (dadosabertos.tce.go.gov.br) / ckan-dadosabertos-tce-go-gov-br | [GET](https://dadosabertos.tce.go.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadosabertos.tce.go.gov.br/) | 2895 | callable |
| Public Data Catalogue (datacatalog.bde.go.th) / ckan-datacatalog-bde-go-th | [GET](https://datacatalog.bde.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datacatalog.bde.go.th/) | 4030 | callable |
| Public Data Catalogue (opendata.agriculture.gov.ie) / ckan-opendata-agriculture-gov-ie | [GET](https://opendata.agriculture.gov.ie/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.agriculture.gov.ie/) | 1898 | callable |
| Public Data Catalogue (dados.transportes.gov.br) / ckan-dados-transportes-gov-br | [GET](https://dados.transportes.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.transportes.gov.br/about) | 5573 | callable |
| Public Data Catalogue (dados.turismo.gov.br) / ckan-dados-turismo-gov-br | [GET](https://dados.turismo.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.turismo.gov.br/) | 9903 | callable |
| Public Data Catalogue (dados.mma.gov.br) / ckan-dados-mma-gov-br | [GET](https://dados.mma.gov.br/api/3/action/package_search?rows=1) | 0 | timeout / timeout | [free](https://dados.mma.gov.br/) | 1527 | discovery |
| Public Data Catalogue (dados.cvm.gov.br) / ckan-dados-cvm-gov-br | [GET](https://dados.cvm.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.cvm.gov.br/) | 744 | callable |
| Public Data Catalogue (data.payakumbuhkota.go.id) / ckan-data-payakumbuhkota-go-id | [GET](https://data.payakumbuhkota.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.payakumbuhkota.go.id/) | 975 | callable |
| Public Data Catalogue (data.mhesi.go.th) / ckan-data-mhesi-go-th | [GET](https://data.mhesi.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.mhesi.go.th/) | 1472 | callable |
| Public Data Catalogue (datosabiertos.valledelcauca.gov.co) / ckan-datosabiertos-valledelcauca-gov-co | [GET](https://datosabiertos.valledelcauca.gov.co/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datosabiertos.valledelcauca.gov.co/) | 777 | callable |
| Public Data Catalogue (dadosabertos.bndes.gov.br) / ckan-dadosabertos-bndes-gov-br | [GET](https://dadosabertos.bndes.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadosabertos.bndes.gov.br/) | 1808 | callable |
| Public Data Catalogue (datos.transporte.gob.ar) / ckan-datos-transporte-gob-ar | [GET](https://datos.transporte.gob.ar/api/3/action/package_search?rows=1) | 200 | unresolved / customer_gateway_failed | [free](https://datos.transporte.gob.ar/) | 1337 | discovery |
| Public Data Catalogue (satudata.palembang.go.id) / ckan-satudata-palembang-go-id | [GET](https://satudata.palembang.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://satudata.palembang.go.id/about) | 1052 | callable |
| Public Data Catalogue (dadosabertos.urbis.prefeitura.sp.gov.br) / ckan-dadosabertos-urbis-prefeitura-sp-gov-br | [GET](https://dadosabertos.urbis.prefeitura.sp.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadosabertos.urbis.prefeitura.sp.gov.br/) | 785 | callable |
| Public Data Catalogue (gdc.dtam.moph.go.th) / ckan-gdc-dtam-moph-go-th | [GET](https://gdc.dtam.moph.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://gdc.dtam.moph.go.th/) | 1717 | callable |
| Public Data Catalogue (datos.cnbs.gob.hn) / ckan-datos-cnbs-gob-hn | [GET](https://datos.cnbs.gob.hn/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.cnbs.gob.hn/) | 523 | callable |
| Public Data Catalogue (dadosabertos.inss.gov.br) / ckan-dadosabertos-inss-gov-br | [GET](https://dadosabertos.inss.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadosabertos.inss.gov.br/) | 1854 | callable |
| Public Data Catalogue (data.dss.go.th) / ckan-data-dss-go-th | [GET](https://data.dss.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.dss.go.th/) | 965 | callable |
| Public Data Catalogue (opendata.dla.go.th) / ckan-opendata-dla-go-th | [GET](https://opendata.dla.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.dla.go.th/) | 1783 | callable |
| Public Data Catalogue (satudata.dpd.go.id) / ckan-satudata-dpd-go-id | [GET](https://satudata.dpd.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://satudata.dpd.go.id/) | 855 | callable |
| Public Data Catalogue (opendata.tampa.gov) / ckan-opendata-tampa-gov | [GET](https://opendata.tampa.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.tampa.gov/) | 649 | callable |
| Public Data Catalogue (catalog.royalrain.go.th) / ckan-catalog-royalrain-go-th | [GET](https://catalog.royalrain.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalog.royalrain.go.th/about) | 1240 | callable |
| Public Data Catalogue (data.acehbesarkab.go.id) / ckan-data-acehbesarkab-go-id | [GET](https://data.acehbesarkab.go.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.acehbesarkab.go.id/) | 2417 | callable |
| Public Data Catalogue (datos.acumar.gob.ar) / ckan-datos-acumar-gob-ar | [GET](https://datos.acumar.gob.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.acumar.gob.ar/about) | 1314 | callable |
| Public Data Catalogue (indicepa.gov.it) / ckan-indicepa-gov-it | [GET](https://indicepa.gov.it/ipa-dati/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://indicepa.gov.it/ipa-dati/) | 500 | callable |
| Public Data Catalogue (datos-abiertos.venadotuerto.gob.ar) / ckan-datos-abiertos-venadotuerto-gob-ar | [GET](https://datos-abiertos.venadotuerto.gob.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos-abiertos.venadotuerto.gob.ar/) | 730 | callable |
| Public Data Catalogue (dadosabertos.mt.gov.br) / ckan-dadosabertos-mt-gov-br | [GET](https://dadosabertos.mt.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadosabertos.mt.gov.br/) | 1059 | callable |
| Public Data Catalogue (opendata.dsd.go.th) / ckan-opendata-dsd-go-th | [GET](https://opendata.dsd.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.dsd.go.th/) | 2229 | callable |
| Public Data Catalogue (opendata.sbcountyatc.gov) / ckan-opendata-sbcountyatc-gov | [GET](https://opendata.sbcountyatc.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.sbcountyatc.gov/) | 751 | callable |
| Public Data Catalogue (datosabiertos.mspas.gob.gt) / ckan-datosabiertos-mspas-gob-gt | [GET](https://datosabiertos.mspas.gob.gt/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datosabiertos.mspas.gob.gt/) | 675 | callable |
| Public Data Catalogue (datos.legislaturaneuquen.gob.ar) / ckan-datos-legislaturaneuquen-gob-ar | [GET](https://datos.legislaturaneuquen.gob.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.legislaturaneuquen.gob.ar/) | 3850 | callable |
| Public Data Catalogue (datosretc.mma.gob.cl) / ckan-datosretc-mma-gob-cl | [GET](https://datosretc.mma.gob.cl/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datosretc.mma.gob.cl/) | 1821 | callable |
| Public Data Catalogue (data.se.df.gov.br) / ckan-data-se-df-gov-br | [GET](https://data.se.df.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.se.df.gov.br/) | 1574 | callable |
| Public Data Catalogue (datos.tsjbaires.gov.ar) / ckan-datos-tsjbaires-gov-ar | [GET](https://datos.tsjbaires.gov.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.tsjbaires.gov.ar/) | 743 | callable |
| Public Data Catalogue (data.rd.go.th) / ckan-data-rd-go-th | [GET](https://data.rd.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.rd.go.th/) | 1760 | callable |
| Public Data Catalogue (datos.yvera.gob.ar) / ckan-datos-yvera-gob-ar | [GET](https://datos.yvera.gob.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.yvera.gob.ar/) | 1639 | callable |
| Public Data Catalogue (www.datos.misiones.gob.ar) / ckan-datos-misiones-gob-ar | [GET](https://www.datos.misiones.gob.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.datos.misiones.gob.ar/) | 6054 | callable |
| Public Data Catalogue (ckan.dsi.go.th) / ckan-ckan-dsi-go-th | [GET](https://ckan.dsi.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.dsi.go.th/) | 2533 | callable |
| Public Data Catalogue (dados.agricultura.gov.br) / ckan-dados-agricultura-gov-br | [GET](https://dados.agricultura.gov.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.agricultura.gov.br/) | 2121 | callable |
| Public Data Catalogue (opendata-ercolano.cultura.gov.it) / ckan-opendata-ercolano-cultura-gov-it | [GET](https://opendata-ercolano.cultura.gov.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata-ercolano.cultura.gov.it/) | 1763 | callable |
| Public Data Catalogue (datos.conred.gob.gt) / ckan-datos-conred-gob-gt | [GET](https://datos.conred.gob.gt/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.conred.gob.gt/) | 1709 | callable |
| Public Data Catalogue (catalog.parliament.go.th) / ckan-catalog-parliament-go-th | [GET](https://catalog.parliament.go.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalog.parliament.go.th/about) | 2415 | callable |
| Public Data Catalogue (catalog.data.faa.gov) / ckan-catalog-data-faa-gov | [GET](https://catalog.data.faa.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalog.data.faa.gov/about) | 1554 | callable |
| Public Data Catalogue (ndotdata.nebraska.gov) / ckan-ndotdata-nebraska-gov | [GET](https://ndotdata.nebraska.gov/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ndotdata.nebraska.gov/) | 2662 | callable |
| Public Data Catalogue (datosabiertos.muniguarco.go.cr) / ckan-datosabiertos-muniguarco-go-cr | [GET](https://datosabiertos.muniguarco.go.cr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datosabiertos.muniguarco.go.cr/) | 2035 | callable |
| Public Data Catalogue (data.city.sumoto.lg.jp) / ckan-data-city-sumoto-lg-jp | [GET](https://data.city.sumoto.lg.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.city.sumoto.lg.jp/) | 3390 | callable |
| Public Data Catalogue (data.malevizi.gov.gr) / ckan-data-malevizi-gov-gr | [GET](https://data.malevizi.gov.gr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.malevizi.gov.gr/) | 2348 | callable |
| Public Data Catalogue (transparencia.enargas.gob.ar) / ckan-transparencia-enargas-gob-ar | [GET](https://transparencia.enargas.gob.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://transparencia.enargas.gob.ar/) | 2902 | callable |
| Public Data Catalogue (data.nbco.gov.ie) / ckan-data-nbco-gov-ie | [GET](https://data.nbco.gov.ie/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.nbco.gov.ie/) | 1600 | callable |
| Public Data Catalogue (datasets.datos.mincyt.gob.ar) / ckan-datasets-datos-mincyt-gob-ar | [GET](https://datasets.datos.mincyt.gob.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datasets.datos.mincyt.gob.ar/) | 5668 | callable |
| Public Data Catalogue (opendata.vin.gov.ua) / ckan-opendata-vin-gov-ua | [GET](https://opendata.vin.gov.ua/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.vin.gov.ua/) | 1249 | callable |
| Public Data Catalogue (suche.transparenz.hamburg.de) / ckan-suche-transparenz-hamburg-de | [GET](https://suche.transparenz.hamburg.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://suche.transparenz.hamburg.de/) | 628 | callable |
| Public Data Catalogue (data.amerigeoss.org) / ckan-data-amerigeoss-org | [GET](https://data.amerigeoss.org/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.amerigeoss.org/about) | 1012 | callable |
| Public Data Catalogue (procurdat.de) / ckan-procurdat-de | [GET](https://procurdat.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://procurdat.de/) | 721 | callable |
| Public Data Catalogue (donnees.iriu.ca) / ckan-donnees-iriu-ca | [GET](https://donnees.iriu.ca/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://donnees.iriu.ca/) | 628 | callable |
| Public Data Catalogue (data.opendevelopmentmekong.net) / ckan-data-opendevelopmentmekong-net | [GET](https://data.opendevelopmentmekong.net/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.opendevelopmentmekong.net/about) | 1671 | callable |
| Public Data Catalogue (dati.toscana.it) / ckan-dati-toscana-it | [GET](https://dati.toscana.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dati.toscana.it/) | 534 | callable |
| Public Data Catalogue (data.apps.fao.org) / ckan-data-apps-fao-org | [GET](https://data.apps.fao.org/catalog/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.apps.fao.org/catalog/about) | 750 | callable |
| Public Data Catalogue (open.nrw) / ckan-open-nrw | [GET](https://open.nrw/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://open.nrw/) | 335 | callable |
| Public Data Catalogue (datamx.io) / ckan-datamx-io | [GET](https://datamx.io/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datamx.io/) | 397 | callable |
| Public Data Catalogue (www.opendata.maggioli.cloud) / ckan-opendata-maggioli-cloud | [GET](https://www.opendata.maggioli.cloud/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.opendata.maggioli.cloud/) | 350 | callable |
| Public Data Catalogue (cryptodata.center) / ckan-cryptodata-center | [GET](https://cryptodata.center/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://cryptodata.center/) | 331 | callable |
| Public Data Catalogue (dati.emilia-romagna.it) / ckan-dati-emilia-romagna-it | [GET](https://dati.emilia-romagna.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dati.emilia-romagna.it/) | 399 | callable |
| Public Data Catalogue (ecosystem.ckan.org) / ckan-ecosystem-ckan-org | [GET](https://ecosystem.ckan.org/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ecosystem.ckan.org/) | 693 | callable |
| Public Data Catalogue (opendata.aragon.es) / ckan-opendata-aragon-es | [GET](https://opendata.aragon.es/api/3/action/package_search?rows=1) | 0 | redirect_https / tls_error | [free](https://opendata.aragon.es/) | 361 | discovery |
| Public Data Catalogue (kozadatportal.hu) / ckan-kozadatportal-hu | [GET](https://kozadatportal.hu/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://kozadatportal.hu/about) | 648 | callable |
| Public Data Catalogue (opendata.nhsbsa.net) / ckan-opendata-nhsbsa-net | [GET](https://opendata.nhsbsa.net/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.nhsbsa.net/) | 512 | callable |
| Public Data Catalogue (detroitdata.org) / ckan-detroitdata-org | [GET](https://detroitdata.org/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://detroitdata.org/) | 664 | callable |
| Public Data Catalogue (ckan.odp.jig.jp) / ckan-ckan-odp-jig-jp | [GET](https://ckan.odp.jig.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.odp.jig.jp/) | 1289 | callable |
| Public Data Catalogue (opendata.com.pk) / ckan-opendata-com-pk | [GET](https://opendata.com.pk/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.com.pk/) | 1034 | callable |
| Public Data Catalogue (datacatalog.tusla.ie) / ckan-datacatalog-tusla-ie | [GET](https://datacatalog.tusla.ie/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datacatalog.tusla.ie/about) | 322 | callable |
| Public Data Catalogue (data.skeenasalmon.info) / ckan-data-skeenasalmon-info | [GET](https://data.skeenasalmon.info/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.skeenasalmon.info/about) | 893 | callable |
| Public Data Catalogue (data.yorkopendata.org) / ckan-data-yorkopendata-org | [GET](https://data.yorkopendata.org/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.yorkopendata.org/) | 499 | callable |
| Public Data Catalogue (dadesobertes.gva.es) / ckan-dadesobertes-gva-es | [GET](https://dadesobertes.gva.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadesobertes.gva.es/about) | 1935 | callable |
| Public Data Catalogue (www.offenesdatenportal.de) / ckan-offenesdatenportal-de | [GET](https://www.offenesdatenportal.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.offenesdatenportal.de/) | 382 | callable |
| Public Data Catalogue (datosabiertos.regiondemurcia.es) / ckan-datosabiertos-regiondemurcia-es | [GET](https://datosabiertos.regiondemurcia.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datosabiertos.regiondemurcia.es/) | 674 | callable |
| Public Data Catalogue (data.stadt-zuerich.ch) / ckan-data-stadt-zuerich-ch | [GET](https://data.stadt-zuerich.ch/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.stadt-zuerich.ch/) | 218 | callable |
| Public Data Catalogue (data.smartdublin.ie) / ckan-data-smartdublin-ie | [GET](https://data.smartdublin.ie/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.smartdublin.ie/) | 369 | callable |
| Public Data Catalogue (data.civis.bz.it) / ckan-data-civis-bz-it | [GET](https://data.civis.bz.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.civis.bz.it/) | 635 | callable |
| Public Data Catalogue (data.ingv.it) / ckan-data-ingv-it | [GET](https://data.ingv.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.ingv.it/) | 658 | callable |
| Public Data Catalogue (www.juntadeandalucia.es) / ckan-juntadeandalucia-es | [GET](https://www.juntadeandalucia.es/datosabiertos/portal/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.juntadeandalucia.es/datosabiertos/portal/) | 597 | callable |
| Public Data Catalogue (data.opendata.am) / ckan-data-opendata-am | [GET](https://data.opendata.am/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.opendata.am/) | 580 | callable |
| Public Data Catalogue (catalog.opendata.pref.kanagawa.jp) / ckan-catalog-opendata-pref-kanagawa-jp | [GET](https://catalog.opendata.pref.kanagawa.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalog.opendata.pref.kanagawa.jp/) | 1470 | callable |
| Public Data Catalogue (data.gmob.ca) / ckan-data-gmob-ca | [GET](https://data.gmob.ca/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.gmob.ca/) | 818 | callable |
| Public Data Catalogue (opendata.city.minato.tokyo.jp) / ckan-opendata-city-minato-tokyo-jp | [GET](https://opendata.city.minato.tokyo.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.city.minato.tokyo.jp/) | 1779 | callable |
| Public Data Catalogue (dati.comune.lecce.it) / ckan-dati-comune-lecce-it | [GET](https://dati.comune.lecce.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dati.comune.lecce.it/) | 328 | callable |
| Public Data Catalogue (opendata.cityofathens.gr) / ckan-opendata-cityofathens-gr | [GET](https://opendata.cityofathens.gr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.cityofathens.gr/) | 318 | callable |
| Public Data Catalogue (opendata-nasu.opendatastack.jp) / ckan-opendata-nasu-opendatastack-jp | [GET](https://opendata-nasu.opendatastack.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata-nasu.opendatastack.jp/) | 2049 | callable |
| Public Data Catalogue (ballaratopendata.org.au) / ckan-ballaratopendata-org-au | [GET](https://ballaratopendata.org.au/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ballaratopendata.org.au/) | 2171 | callable |
| Public Data Catalogue (data.cbwaterhub.ca) / ckan-data-cbwaterhub-ca | [GET](https://data.cbwaterhub.ca/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.cbwaterhub.ca/) | 770 | callable |
| Public Data Catalogue (ckan.hoda.jp) / ckan-ckan-hoda-jp | [GET](https://ckan.hoda.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.hoda.jp/) | 1943 | callable |
| Public Data Catalogue (opendata.eawag.ch) / ckan-opendata-eawag-ch | [GET](https://opendata.eawag.ch/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.eawag.ch/about) | 542 | callable |
| Public Data Catalogue (openga.giustizia-amministrativa.it) / ckan-openga-giustizia-amministrativa-it | [GET](https://openga.giustizia-amministrativa.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://openga.giustizia-amministrativa.it/about) | 1918 | callable |
| Public Data Catalogue (civicdata.com) / ckan-civicdata-com | [GET](https://civicdata.com/api/3/action/package_search?rows=1) | 200 | unresolved / customer_gateway_failed | [free](https://civicdata.com/) | 640 | discovery |
| Public Data Catalogue (opendata.leipzig.de) / ckan-opendata-leipzig-de | [GET](https://opendata.leipzig.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.leipzig.de/) | 306 | callable |
| Public Data Catalogue (dati.lazio.it) / ckan-dati-lazio-it | [GET](https://dati.lazio.it/api/3/action/package_search?rows=1) | 200 | unresolved / customer_gateway_failed | [free](https://dati.lazio.it/) | 994 | discovery |
| Public Data Catalogue (opencom.no) / ckan-opencom-no | [GET](https://opencom.no/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opencom.no/) | 336 | callable |
| Public Data Catalogue (opendata.gov.nt.ca) / ckan-opendata-gov-nt-ca | [GET](https://opendata.gov.nt.ca/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.gov.nt.ca/) | 850 | callable |
| Public Data Catalogue (opendata.muenchen.de) / ckan-opendata-muenchen-de | [GET](https://opendata.muenchen.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.muenchen.de/) | 316 | callable |
| Public Data Catalogue (catalog-data.city.kanazawa.ishikawa.jp) / ckan-catalog-data-city-kanazawa-ishikawa-jp | [GET](https://catalog-data.city.kanazawa.ishikawa.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalog-data.city.kanazawa.ishikawa.jp/about) | 1430 | callable |
| Public Data Catalogue (veri.sakarya.bel.tr) / ckan-veri-sakarya-bel-tr | [GET](https://veri.sakarya.bel.tr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://veri.sakarya.bel.tr/) | 563 | callable |
| Public Data Catalogue (catalog.dataplatform-yamanashi.jp) / ckan-catalog-dataplatform-yamanashi-jp | [GET](https://catalog.dataplatform-yamanashi.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalog.dataplatform-yamanashi.jp/) | 1570 | callable |
| Public Data Catalogue (datos.um.es) / ckan-datos-um-es | [GET](https://datos.um.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.um.es/) | 618 | callable |
| Public Data Catalogue (opendata.vlci.valencia.es) / ckan-opendata-vlci-valencia-es | [GET](https://opendata.vlci.valencia.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.vlci.valencia.es/) | 487 | callable |
| Public Data Catalogue (catalog.city.utsunomiya.tochigi.jp) / ckan-catalog-city-utsunomiya-tochigi-jp | [GET](https://catalog.city.utsunomiya.tochigi.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalog.city.utsunomiya.tochigi.jp/about) | 1729 | callable |
| Public Data Catalogue (datos.icane.es) / ckan-datos-icane-es | [GET](https://datos.icane.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.icane.es/) | 483 | callable |
| Public Data Catalogue (dati.comune.fe.it) / ckan-dati-comune-fe-it | [GET](https://dati.comune.fe.it/api/3/action/package_search?rows=1) | 0 | timeout / timeout | [free](https://dati.comune.fe.it/) | 20003 | discovery |
| Public Data Catalogue (ckan.tirana.al) / ckan-ckan-tirana-al | [GET](https://ckan.tirana.al/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.tirana.al/) | 433 | callable |
| Public Data Catalogue (acikveri.bizizmir.com) / ckan-acikveri-bizizmir-com | [GET](https://acikveri.bizizmir.com/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://acikveri.bizizmir.com/) | 518 | callable |
| Public Data Catalogue (opendata.comune.re.it) / ckan-opendata-comune-re-it | [GET](https://opendata.comune.re.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.comune.re.it/) | 672 | callable |
| Public Data Catalogue (doi.nioz.nl) / ckan-doi-nioz-nl | [GET](https://doi.nioz.nl/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://doi.nioz.nl/about) | 266 | callable |
| Public Data Catalogue (acikveri.konya.bel.tr) / ckan-acikveri-konya-bel-tr | [GET](https://acikveri.konya.bel.tr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://acikveri.konya.bel.tr/) | 381 | callable |
| Public Data Catalogue (justicehub.in) / ckan-justicehub-in | [GET](https://justicehub.in/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://justicehub.in/about) | 1039 | callable |
| Public Data Catalogue (opendata.readi.de) / ckan-opendata-readi-de | [GET](https://opendata.readi.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.readi.de/) | 341 | callable |
| Public Data Catalogue (data.zagreb.hr) / ckan-data-zagreb-hr | [GET](https://data.zagreb.hr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.zagreb.hr/about) | 457 | callable |
| Public Data Catalogue (dati.arpae.it) / ckan-dati-arpae-it | [GET](https://dati.arpae.it/api/3/action/package_search?rows=1) | 200 | unresolved / customer_gateway_failed | [free](https://dati.arpae.it/) | 5553 | discovery |
| Public Data Catalogue (datalatih.siat.web.id) / ckan-datalatih-siat-web-id | [GET](https://datalatih.siat.web.id/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datalatih.siat.web.id/) | 996 | callable |
| Public Data Catalogue (dadosabertos.tse.jus.br) / ckan-dadosabertos-tse-jus-br | [GET](https://dadosabertos.tse.jus.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadosabertos.tse.jus.br/) | 221 | callable |
| Public Data Catalogue (opendataprijedor.ba) / ckan-opendataprijedor-ba | [GET](https://opendataprijedor.ba/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendataprijedor.ba/) | 389 | callable |
| Public Data Catalogue (oeirasinterativa.oeiras.pt) / ckan-oeirasinterativa-oeiras-pt | [GET](https://oeirasinterativa.oeiras.pt/dadosabertos/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://oeirasinterativa.oeiras.pt/dadosabertos/) | 1290 | callable |
| Public Data Catalogue (opendata.sitcan.es) / ckan-opendata-sitcan-es | [GET](https://opendata.sitcan.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.sitcan.es/) | 534 | callable |
| Public Data Catalogue (plymouth.thedata.place) / ckan-plymouth-thedata-place | [GET](https://plymouth.thedata.place/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://plymouth.thedata.place/about) | 325 | callable |
| Public Data Catalogue (rdm.inesctec.pt) / ckan-rdm-inesctec-pt | [GET](https://rdm.inesctec.pt/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://rdm.inesctec.pt/) | 424 | callable |
| Public Data Catalogue (opendata.city.imizu.toyama.jp) / ckan-opendata-city-imizu-toyama-jp | [GET](https://opendata.city.imizu.toyama.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.city.imizu.toyama.jp/) | 1390 | callable |
| Public Data Catalogue (opendata.ual.es) / ckan-opendata-ual-es | [GET](https://opendata.ual.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.ual.es/) | 415 | callable |
| Public Data Catalogue (data.wu.ac.at) / ckan-data-wu-ac-at | [GET](https://data.wu.ac.at/portal/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.wu.ac.at/portal/) | 334 | callable |
| Public Data Catalogue (acikveri.kadikoy.bel.tr) / ckan-acikveri-kadikoy-bel-tr | [GET](https://acikveri.kadikoy.bel.tr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://acikveri.kadikoy.bel.tr/) | 385 | callable |
| Public Data Catalogue (ckan.montevideo.gub.uy) / ckan-ckan-montevideo-gub-uy | [GET](https://ckan.montevideo.gub.uy/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.montevideo.gub.uy/) | 1267 | callable |
| Public Data Catalogue (transparenz.karlsruhe.de) / ckan-transparenz-karlsruhe-de | [GET](https://transparenz.karlsruhe.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://transparenz.karlsruhe.de/) | 336 | callable |
| Public Data Catalogue (mobidata-bw.de) / ckan-mobidata-bw-de | [GET](https://mobidata-bw.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://mobidata-bw.de/) | 313 | callable |
| Public Data Catalogue (phoenixopendata.com) / ckan-phoenixopendata-com | [GET](https://phoenixopendata.com/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://phoenixopendata.com/) | 855 | callable |
| Public Data Catalogue (www.donostia.eus) / ckan-donostia-eus | [GET](https://www.donostia.eus/datosabiertos/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.donostia.eus/datosabiertos/) | 723 | callable |
| Public Data Catalogue (opendata.city.machida.tokyo.jp) / ckan-opendata-city-machida-tokyo-jp | [GET](https://opendata.city.machida.tokyo.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.city.machida.tokyo.jp/) | 1255 | callable |
| Public Data Catalogue (data.hub.geosphere.at) / ckan-data-hub-geosphere-at | [GET](https://data.hub.geosphere.at/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.hub.geosphere.at/about) | 440 | callable |
| Public Data Catalogue (ckan.urbanedatenplattform-potsdam.de) / ckan-ckan-urbanedatenplattform-potsdam-de | [GET](https://ckan.urbanedatenplattform-potsdam.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.urbanedatenplattform-potsdam.de/) | 354 | callable |
| Public Data Catalogue (dati.regione.liguria.it) / ckan-dati-regione-liguria-it | [GET](https://dati.regione.liguria.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dati.regione.liguria.it/) | 1890 | callable |
| Public Data Catalogue (opendata.comune.messina.it) / ckan-opendata-comune-messina-it | [GET](https://opendata.comune.messina.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.comune.messina.it/) | 363 | callable |
| Public Data Catalogue (datosabiertos.dip-badajoz.es) / ckan-datosabiertos-dip-badajoz-es | [GET](https://datosabiertos.dip-badajoz.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datosabiertos.dip-badajoz.es/) | 600 | callable |
| Public Data Catalogue (opendata.euroinfosicilia.it) / ckan-opendata-euroinfosicilia-it | [GET](https://opendata.euroinfosicilia.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.euroinfosicilia.it/) | 347 | callable |
| Public Data Catalogue (opendata.uniba.it) / ckan-opendata-uniba-it | [GET](https://opendata.uniba.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.uniba.it/) | 556 | callable |
| Public Data Catalogue (opendata.olpe.de) / ckan-opendata-olpe-de | [GET](https://opendata.olpe.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.olpe.de/) | 1891 | callable |
| Public Data Catalogue (www.santacruzdetenerife.es) / ckan-santacruzdetenerife-es | [GET](https://www.santacruzdetenerife.es/opendata/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.santacruzdetenerife.es/opendata/) | 429 | callable |
| Public Data Catalogue (data.ncku.edu.tw) / ckan-data-ncku-edu-tw | [GET](https://data.ncku.edu.tw/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.ncku.edu.tw/) | 1389 | callable |
| Public Data Catalogue (bochum.opendata.ruhr) / ckan-bochum-opendata-ruhr | [GET](https://bochum.opendata.ruhr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://bochum.opendata.ruhr/) | 251 | callable |
| Public Data Catalogue (data.ctb.eus) / ckan-data-ctb-eus | [GET](https://data.ctb.eus/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.ctb.eus/) | 495 | callable |
| Public Data Catalogue (upvtransparent.upv.es) / ckan-upvtransparent-upv-es | [GET](https://upvtransparent.upv.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://upvtransparent.upv.es/) | 528 | callable |
| Public Data Catalogue (ckan.indiadataportal.com) / ckan-ckan-indiadataportal-com | [GET](https://ckan.indiadataportal.com/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.indiadataportal.com/) | 919 | callable |
| Public Data Catalogue (veri.tuzla.bel.tr) / ckan-veri-tuzla-bel-tr | [GET](https://veri.tuzla.bel.tr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://veri.tuzla.bel.tr/) | 559 | callable |
| Public Data Catalogue (data.openstate.eu) / ckan-data-openstate-eu | [GET](https://data.openstate.eu/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.openstate.eu/) | 314 | callable |
| Public Data Catalogue (opendata.sjgov.org) / ckan-opendata-sjgov-org | [GET](https://opendata.sjgov.org/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.sjgov.org/) | 564 | callable |
| Public Data Catalogue (dadosabertos.cimvdl.pt) / ckan-dadosabertos-cimvdl-pt | [GET](https://dadosabertos.cimvdl.pt/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadosabertos.cimvdl.pt/) | 728 | callable |
| Public Data Catalogue (corona-open-data.ckan.de) / ckan-corona-open-data-ckan-de | [GET](https://corona-open-data.ckan.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://corona-open-data.ckan.de/) | 450 | callable |
| Public Data Catalogue (data.harvestportal.org) / ckan-data-harvestportal-org | [GET](https://data.harvestportal.org/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.harvestportal.org/) | 665 | callable |
| Public Data Catalogue (data.wto.org) / ckan-data-wto-org | [GET](https://data.wto.org/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.wto.org/about) | 323 | callable |
| Public Data Catalogue (datacatalog.limerick.ie) / ckan-datacatalog-limerick-ie | [GET](https://datacatalog.limerick.ie/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datacatalog.limerick.ie/) | 477 | callable |
| Public Data Catalogue (ckan.sabasi.io) / ckan-ckan-sabasi-io | [GET](https://ckan.sabasi.io/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.sabasi.io/) | 382 | callable |
| Public Data Catalogue (data.kildarecoco.ie) / ckan-data-kildarecoco-ie | [GET](https://data.kildarecoco.ie/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.kildarecoco.ie/) | 438 | callable |
| Public Data Catalogue (data.neolaiacampus.eu) / ckan-data-neolaiacampus-eu | [GET](https://data.neolaiacampus.eu/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.neolaiacampus.eu/) | 540 | callable |
| Public Data Catalogue (catalog.data.patras.gr) / ckan-catalog-data-patras-gr | [GET](https://catalog.data.patras.gr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalog.data.patras.gr/) | 254 | callable |
| Public Data Catalogue (opendata.mea.or.th) / ckan-opendata-mea-or-th | [GET](https://opendata.mea.or.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.mea.or.th/) | 1383 | callable |
| Public Data Catalogue (opendata.comune.rimini.it) / ckan-opendata-comune-rimini-it | [GET](https://opendata.comune.rimini.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.comune.rimini.it/) | 317 | callable |
| Public Data Catalogue (opendata.hu) / ckan-opendata-hu | [GET](https://opendata.hu/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.hu/) | 169 | callable |
| Public Data Catalogue (data.thaihealth.or.th) / ckan-data-thaihealth-or-th | [GET](https://data.thaihealth.or.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.thaihealth.or.th/) | 1314 | callable |
| Public Data Catalogue (ckan.puertosdetenerife.org) / ckan-ckan-puertosdetenerife-org | [GET](https://ckan.puertosdetenerife.org/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.puertosdetenerife.org/) | 1306 | callable |
| Public Data Catalogue (dadosabertos.cm-porto.pt) / ckan-dadosabertos-cm-porto-pt | [GET](https://dadosabertos.cm-porto.pt/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadosabertos.cm-porto.pt/) | 690 | callable |
| Public Data Catalogue (datosabiertos.infocdmx.org.mx) / ckan-datosabiertos-infocdmx-org-mx | [GET](https://datosabiertos.infocdmx.org.mx/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datosabiertos.infocdmx.org.mx/) | 894 | callable |
| Public Data Catalogue (opendata.ugr.es) / ckan-opendata-ugr-es | [GET](https://opendata.ugr.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.ugr.es/) | 685 | callable |
| Public Data Catalogue (dados.unb.br) / ckan-dados-unb-br | [GET](https://dados.unb.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.unb.br/) | 3367 | callable |
| Public Data Catalogue (opendata.ncse.ie) / ckan-opendata-ncse-ie | [GET](https://opendata.ncse.ie/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.ncse.ie/) | 335 | callable |
| Public Data Catalogue (klimakonform-dmp.geo.tu-dresden.de) / ckan-klimakonform-dmp-geo-tu-dresden-de | [GET](https://klimakonform-dmp.geo.tu-dresden.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://klimakonform-dmp.geo.tu-dresden.de/) | 884 | callable |
| Public Data Catalogue (repo.dainst.org) / ckan-repo-dainst-org | [GET](https://repo.dainst.org/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://repo.dainst.org/) | 413 | callable |
| Public Data Catalogue (dados.ibict.br) / ckan-dados-ibict-br | [GET](https://dados.ibict.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ibict.br/) | 1777 | callable |
| Public Data Catalogue (dadosabertos.poa.br) / ckan-dadosabertos-poa-br | [GET](https://dadosabertos.poa.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadosabertos.poa.br/) | 1753 | callable |
| Public Data Catalogue (lcrdigitalcommons.com) / ckan-lcrdigitalcommons-com | [GET](https://lcrdigitalcommons.com/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://lcrdigitalcommons.com/) | 754 | callable |
| Public Data Catalogue (data.city.fukuyama.hiroshima.jp) / ckan-data-city-fukuyama-hiroshima-jp | [GET](https://data.city.fukuyama.hiroshima.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.city.fukuyama.hiroshima.jp/) | 1905 | callable |
| Public Data Catalogue (ckan.mmhk.cz) / ckan-ckan-mmhk-cz | [GET](https://ckan.mmhk.cz/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.mmhk.cz/) | 722 | callable |
| Public Data Catalogue (dados.ufv.br) / ckan-dados-ufv-br | [GET](https://dados.ufv.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ufv.br/) | 1863 | callable |
| Public Data Catalogue (dados.ufrb.edu.br) / ckan-dados-ufrb-edu-br | [GET](https://dados.ufrb.edu.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ufrb.edu.br/) | 1127 | callable |
| Public Data Catalogue (opendata.hsri.or.th) / ckan-opendata-hsri-or-th | [GET](https://opendata.hsri.or.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.hsri.or.th/) | 1232 | callable |
| Public Data Catalogue (datosabiertos.aytosanlorenzo.es) / ckan-datosabiertos-aytosanlorenzo-es | [GET](https://datosabiertos.aytosanlorenzo.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datosabiertos.aytosanlorenzo.es/) | 503 | callable |
| Public Data Catalogue (acikyesil.bursa.bel.tr) / ckan-acikyesil-bursa-bel-tr | [GET](https://acikyesil.bursa.bel.tr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://acikyesil.bursa.bel.tr/) | 1028 | callable |
| Public Data Catalogue (data.waterpathogens.org) / ckan-data-waterpathogens-org | [GET](https://data.waterpathogens.org/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.waterpathogens.org/) | 913 | callable |
| Public Data Catalogue (dadosabertos.ifal.edu.br) / ckan-dadosabertos-ifal-edu-br | [GET](https://dadosabertos.ifal.edu.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadosabertos.ifal.edu.br/) | 1500 | callable |
| Public Data Catalogue (www.opendata-oepnv.de) / ckan-opendata-oepnv-de | [GET](https://www.opendata-oepnv.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.opendata-oepnv.de/) | 576 | callable |
| Public Data Catalogue (opendatabozp.cz) / ckan-opendatabozp-cz | [GET](https://opendatabozp.cz/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendatabozp.cz/) | 623 | callable |
| Public Data Catalogue (dados.ufvjm.edu.br) / ckan-dados-ufvjm-edu-br | [GET](https://dados.ufvjm.edu.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ufvjm.edu.br/) | 1654 | callable |
| Public Data Catalogue (datasets.wri.org) / ckan-datasets-wri-org | [GET](https://datasets.wri.org/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datasets.wri.org/) | 1046 | callable |
| Public Data Catalogue (catalog.growthfund.gr) / ckan-catalog-growthfund-gr | [GET](https://catalog.growthfund.gr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalog.growthfund.gr/about) | 522 | callable |
| Public Data Catalogue (opendata.ayto-alcaladehenares.es) / ckan-opendata-ayto-alcaladehenares-es | [GET](https://opendata.ayto-alcaladehenares.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.ayto-alcaladehenares.es/) | 575 | callable |
| Public Data Catalogue (www.traffic4cyprus.org.cy) / ckan-traffic4cyprus-org-cy | [GET](https://www.traffic4cyprus.org.cy/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.traffic4cyprus.org.cy/about) | 582 | callable |
| Public Data Catalogue (opendata.greifswald.de) / ckan-opendata-greifswald-de | [GET](https://opendata.greifswald.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.greifswald.de/) | 429 | callable |
| Public Data Catalogue (opendata.kreis-guetersloh.de) / ckan-opendata-kreis-guetersloh-de | [GET](https://opendata.kreis-guetersloh.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.kreis-guetersloh.de/) | 525 | callable |
| Public Data Catalogue (hardmin.heal-link.gr) / ckan-hardmin-heal-link-gr | [GET](https://hardmin.heal-link.gr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://hardmin.heal-link.gr/about) | 566 | callable |
| Public Data Catalogue (dati.arpacampania.it) / ckan-dati-arpacampania-it | [GET](https://dati.arpacampania.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dati.arpacampania.it/) | 573 | callable |
| Public Data Catalogue (open-data.ble.de) / ckan-open-data-ble-de | [GET](https://open-data.ble.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://open-data.ble.de/) | 674 | callable |
| Public Data Catalogue (dati.comune.napoli.it) / ckan-dati-comune-napoli-it | [GET](https://dati.comune.napoli.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dati.comune.napoli.it/) | 789 | callable |
| Public Data Catalogue (opendata.gistda.or.th) / ckan-opendata-gistda-or-th | [GET](https://opendata.gistda.or.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.gistda.or.th/) | 1849 | callable |
| Public Data Catalogue (opendata.mzv.sk) / ckan-opendata-mzv-sk | [GET](https://opendata.mzv.sk/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.mzv.sk/) | 519 | callable |
| Public Data Catalogue (data.corkcity.ie) / ckan-data-corkcity-ie | [GET](https://data.corkcity.ie/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.corkcity.ie/) | 407 | callable |
| Public Data Catalogue (opendata.comuni.nemea.cloud) / ckan-opendata-comuni-nemea-cloud | [GET](https://opendata.comuni.nemea.cloud/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.comuni.nemea.cloud/) | 535 | callable |
| Public Data Catalogue (dados.ufg.br) / ckan-dados-ufg-br | [GET](https://dados.ufg.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ufg.br/) | 2117 | callable |
| Public Data Catalogue (data.cityofdenton.com) / ckan-data-cityofdenton-com | [GET](https://data.cityofdenton.com/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.cityofdenton.com/) | 822 | callable |
| Public Data Catalogue (opendata.alcoi.org) / ckan-opendata-alcoi-org | [GET](https://opendata.alcoi.org/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.alcoi.org/data/about) | 784 | callable |
| Public Data Catalogue (opendata.gera.de) / ckan-opendata-gera-de | [GET](https://opendata.gera.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.gera.de/) | 646 | callable |
| Public Data Catalogue (dados.ufs.br) / ckan-dados-ufs-br | [GET](https://dados.ufs.br/api/3/action/package_search?rows=1) | 0 | redirect_https / tls_error | [free](https://dados.ufs.br/) | 529 | discovery |
| Public Data Catalogue (open.scayle.es) / ckan-open-scayle-es | [GET](https://open.scayle.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://open.scayle.es/) | 694 | callable |
| Public Data Catalogue (dados.cefet-rj.br) / ckan-dados-cefet-rj-br | [GET](https://dados.cefet-rj.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.cefet-rj.br/) | 1981 | callable |
| Public Data Catalogue (opendata.lavegainnova.es) / ckan-opendata-lavegainnova-es | [GET](https://opendata.lavegainnova.es/api/3/action/package_search?rows=1) | 0 | redirect_https / tls_error | [free](https://opendata.lavegainnova.es/) | 340 | discovery |
| Public Data Catalogue (datos.chduero.es) / ckan-datos-chduero-es | [GET](https://datos.chduero.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.chduero.es/) | 468 | callable |
| Public Data Catalogue (dados.ifrr.edu.br) / ckan-dados-ifrr-edu-br | [GET](https://dados.ifrr.edu.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ifrr.edu.br/) | 1245 | callable |
| Public Data Catalogue (datasets.edge.durban) / ckan-datasets-edge-durban | [GET](https://datasets.edge.durban/api/3/action/package_search?rows=1) | 0 | redirect_https / tls_error | [free](https://datasets.edge.durban/) | 232 | discovery |
| Public Data Catalogue (open-data-musterstadt.ckan.de) / ckan-open-data-musterstadt-ckan-de | [GET](https://open-data-musterstadt.ckan.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://open-data-musterstadt.ckan.de/) | 323 | callable |
| Public Data Catalogue (centroservizi-opendata.arionline.cloud) / ckan-centroservizi-opendata-arionline-cloud | [GET](https://centroservizi-opendata.arionline.cloud/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://centroservizi-opendata.arionline.cloud/) | 616 | callable |
| Public Data Catalogue (dados.uffs.edu.br) / ckan-dados-uffs-edu-br | [GET](https://dados.uffs.edu.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.uffs.edu.br/) | 1058 | callable |
| Public Data Catalogue (dados.uff.br) / ckan-dados-uff-br | [GET](https://dados.uff.br/api/3/action/package_search?rows=1) | 0 | timeout / timeout | [free](https://dados.uff.br/) | 20015 | discovery |
| Public Data Catalogue (dadosabertos.ufpb.br) / ckan-dadosabertos-ufpb-br | [GET](https://dadosabertos.ufpb.br/api/3/action/package_search?rows=1) | 0 | redirect_https / tls_error | [free](https://dadosabertos.ufpb.br/) | 411 | discovery |
| Public Data Catalogue (data.tokyo-omy-w.jp) / ckan-data-tokyo-omy-w-jp | [GET](https://data.tokyo-omy-w.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.tokyo-omy-w.jp/) | 1249 | callable |
| Public Data Catalogue (datahub.openscience.eu) / ckan-datahub-openscience-eu | [GET](https://datahub.openscience.eu/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datahub.openscience.eu/) | 335 | callable |
| Public Data Catalogue (dados.ifro.edu.br) / ckan-dados-ifro-edu-br | [GET](https://dados.ifro.edu.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ifro.edu.br/) | 1586 | callable |
| Public Data Catalogue (opendatacomunideimessapi.it) / ckan-opendatacomunideimessapi-it | [GET](https://opendatacomunideimessapi.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendatacomunideimessapi.it/) | 451 | callable |
| Public Data Catalogue (gdcatalog.codi.or.th) / ckan-gdcatalog-codi-or-th | [GET](https://gdcatalog.codi.or.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://gdcatalog.codi.or.th/) | 2104 | callable |
| Public Data Catalogue (dati.enea.it) / ckan-dati-enea-it | [GET](https://dati.enea.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dati.enea.it/) | 515 | callable |
| Public Data Catalogue (dados.ufca.edu.br) / ckan-dados-ufca-edu-br | [GET](https://dados.ufca.edu.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ufca.edu.br/) | 1251 | callable |
| Public Data Catalogue (data.waarismijnstemlokaal.nl) / ckan-data-waarismijnstemlokaal-nl | [GET](https://data.waarismijnstemlokaal.nl/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.waarismijnstemlokaal.nl/) | 458 | callable |
| Public Data Catalogue (catalog.zoothailand.org) / ckan-catalog-zoothailand-org | [GET](https://catalog.zoothailand.org/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalog.zoothailand.org/about) | 1076 | callable |
| Public Data Catalogue (opendata.comune.forli.fc.it) / ckan-opendata-comune-forli-fc-it | [GET](https://opendata.comune.forli.fc.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.comune.forli.fc.it/) | 530 | callable |
| Public Data Catalogue (vital-healthdata.org) / ckan-vital-healthdata-org | [GET](https://vital-healthdata.org/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://vital-healthdata.org/about) | 995 | callable |
| Public Data Catalogue (dati.consip.it) / ckan-dati-consip-it | [GET](https://dati.consip.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dati.consip.it/) | 511 | callable |
| Public Data Catalogue (dados.ufpe.br) / ckan-dados-ufpe-br | [GET](https://dados.ufpe.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ufpe.br/) | 1361 | callable |
| Public Data Catalogue (geodata.sandviken.se) / ckan-geodata-sandviken-se | [GET](https://geodata.sandviken.se/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://geodata.sandviken.se/) | 330 | callable |
| Public Data Catalogue (dati.comune.catanzaro.it) / ckan-dati-comune-catanzaro-it | [GET](https://dati.comune.catanzaro.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dati.comune.catanzaro.it/) | 537 | callable |
| Public Data Catalogue (opendata.univaq.it) / ckan-opendata-univaq-it | [GET](https://opendata.univaq.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.univaq.it/) | 548 | callable |
| Public Data Catalogue (dati.comune.copertino.le.it) / ckan-dati-comune-copertino-le-it | [GET](https://dati.comune.copertino.le.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dati.comune.copertino.le.it/) | 916 | callable |
| Public Data Catalogue (espaidedades.dadess.cat) / ckan-espaidedades-dadess-cat | [GET](https://espaidedades.dadess.cat/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://espaidedades.dadess.cat/about) | 448 | callable |
| Public Data Catalogue (dados.ifsc.edu.br) / ckan-dados-ifsc-edu-br | [GET](https://dados.ifsc.edu.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ifsc.edu.br/) | 873 | callable |
| Public Data Catalogue (dadosabertos.ufdpar.edu.br) / ckan-dadosabertos-ufdpar-edu-br | [GET](https://dadosabertos.ufdpar.edu.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadosabertos.ufdpar.edu.br/) | 1155 | callable |
| Public Data Catalogue (aspal-opendata.consulmedia.it) / ckan-aspal-opendata-consulmedia-it | [GET](https://aspal-opendata.consulmedia.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://aspal-opendata.consulmedia.it/) | 479 | callable |
| Public Data Catalogue (dadosabertos.ufersa.edu.br) / ckan-dadosabertos-ufersa-edu-br | [GET](https://dadosabertos.ufersa.edu.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dadosabertos.ufersa.edu.br/) | 1043 | callable |
| Public Data Catalogue (dados.ifpb.edu.br) / ckan-dados-ifpb-edu-br | [GET](https://dados.ifpb.edu.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ifpb.edu.br/) | 1765 | callable |
| Public Data Catalogue (opendata.kaaw.de) / ckan-opendata-kaaw-de | [GET](https://opendata.kaaw.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.kaaw.de/) | 284 | callable |
| Public Data Catalogue (opendata.vag.de) / ckan-opendata-vag-de | [GET](https://opendata.vag.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.vag.de/) | 861 | callable |
| Public Data Catalogue (datos.arsat.com.ar) / ckan-datos-arsat-com-ar | [GET](https://datos.arsat.com.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.arsat.com.ar/) | 1342 | callable |
| Public Data Catalogue (data.genderdatalab.org) / ckan-data-genderdatalab-org | [GET](https://data.genderdatalab.org/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.genderdatalab.org/) | 498 | callable |
| Public Data Catalogue (opendata.chalandri.gr) / ckan-opendata-chalandri-gr | [GET](https://opendata.chalandri.gr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.chalandri.gr/) | 249 | callable |
| Public Data Catalogue (dados.iff.edu.br) / ckan-dados-iff-edu-br | [GET](https://dados.iff.edu.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.iff.edu.br/) | 1065 | callable |
| Public Data Catalogue (dados.ufpa.br) / ckan-dados-ufpa-br | [GET](https://dados.ufpa.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ufpa.br/) | 1895 | callable |
| Public Data Catalogue (data.agglo-royan.fr) / ckan-data-agglo-royan-fr | [GET](https://data.agglo-royan.fr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.agglo-royan.fr/) | 320 | callable |
| Public Data Catalogue (opendata.depa.or.th) / ckan-opendata-depa-or-th | [GET](https://opendata.depa.or.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.depa.or.th/) | 947 | callable |
| Public Data Catalogue (opendata.asmenet.it) / ckan-opendata-asmenet-it | [GET](https://opendata.asmenet.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.asmenet.it/) | 278 | callable |
| Public Data Catalogue (dados.ifrn.edu.br) / ckan-dados-ifrn-edu-br | [GET](https://dados.ifrn.edu.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ifrn.edu.br/) | 1536 | callable |
| Public Data Catalogue (dati.adspmam.it) / ckan-dati-adspmam-it | [GET](https://dati.adspmam.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dati.adspmam.it/about) | 667 | callable |
| Public Data Catalogue (data.narit.or.th) / ckan-data-narit-or-th | [GET](https://data.narit.or.th/api/3/action/package_search?rows=1) | 200 | unresolved / customer_gateway_failed | [free](https://data.narit.or.th/) | 2694 | discovery |
| Public Data Catalogue (datosabiertos.puertollano.es) / ckan-datosabiertos-puertollano-es | [GET](https://datosabiertos.puertollano.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datosabiertos.puertollano.es/) | 740 | callable |
| Public Data Catalogue (opendata.mwa.co.th) / ckan-opendata-mwa-co-th | [GET](https://opendata.mwa.co.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.mwa.co.th/) | 1606 | callable |
| Public Data Catalogue (data.svk.se) / ckan-data-svk-se | [GET](https://data.svk.se/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.svk.se/) | 349 | callable |
| Public Data Catalogue (ckan.nishiawakura-mulabo.jp) / ckan-ckan-nishiawakura-mulabo-jp | [GET](https://ckan.nishiawakura-mulabo.jp/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.nishiawakura-mulabo.jp/) | 990 | callable |
| Public Data Catalogue (dados.ufscar.br) / ckan-dados-ufscar-br | [GET](https://dados.ufscar.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ufscar.br/) | 1052 | callable |
| Public Data Catalogue (opendata.upplandsvasby.se) / ckan-opendata-upplandsvasby-se | [GET](https://opendata.upplandsvasby.se/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.upplandsvasby.se/) | 121 | callable |
| Public Data Catalogue (opendata.unifg.it) / ckan-opendata-unifg-it | [GET](https://opendata.unifg.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.unifg.it/) | 361 | callable |
| Public Data Catalogue (nwgpdataportal.ca) / ckan-nwgpdataportal-ca | [GET](https://nwgpdataportal.ca/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://nwgpdataportal.ca/) | 759 | callable |
| Public Data Catalogue (dati.port.taranto.it) / ckan-dati-port-taranto-it | [GET](https://dati.port.taranto.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dati.port.taranto.it/) | 431 | callable |
| Public Data Catalogue (data.housingagency.ie) / ckan-data-housingagency-ie | [GET](https://data.housingagency.ie/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.housingagency.ie/) | 227 | callable |
| Public Data Catalogue (opendata.constitutionalcourt.or.th) / ckan-opendata-constitutionalcourt-or-th | [GET](https://opendata.constitutionalcourt.or.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.constitutionalcourt.or.th/) | 3423 | callable |
| Public Data Catalogue (dados.emel.pt) / ckan-dados-emel-pt | [GET](https://dados.emel.pt/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.emel.pt/about) | 3262 | callable |
| Public Data Catalogue (datos.usinatandil.com.ar) / ckan-datos-usinatandil-com-ar | [GET](https://datos.usinatandil.com.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.usinatandil.com.ar/about) | 1400 | callable |
| Public Data Catalogue (datosabiertos.lastorresdecotillas.es) / ckan-datosabiertos-lastorresdecotillas-es | [GET](https://datosabiertos.lastorresdecotillas.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datosabiertos.lastorresdecotillas.es/) | 248 | callable |
| Public Data Catalogue (opendata.hameln-pyrmont.de) / ckan-opendata-hameln-pyrmont-de | [GET](https://opendata.hameln-pyrmont.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.hameln-pyrmont.de/) | 317 | callable |
| Public Data Catalogue (dati.sian.it) / ckan-dati-sian-it | [GET](https://dati.sian.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dati.sian.it/) | 317 | callable |
| Public Data Catalogue (data.mait.ai.in.th) / ckan-data-mait-ai-in-th | [GET](https://data.mait.ai.in.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.mait.ai.in.th/) | 1446 | callable |
| Public Data Catalogue (danube-data.eu) / ckan-danube-data-eu | [GET](https://danube-data.eu/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://danube-data.eu/about) | 272 | callable |
| Public Data Catalogue (data.tsri.or.th) / ckan-data-tsri-or-th | [GET](https://data.tsri.or.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.tsri.or.th/) | 2040 | callable |
| Public Data Catalogue (mistral-cat.hpc.cineca.it) / ckan-mistral-cat-hpc-cineca-it | [GET](https://mistral-cat.hpc.cineca.it/api/3/action/package_search?rows=1) | 200 | unresolved / customer_gateway_failed | [free](https://mistral-cat.hpc.cineca.it/) | 1184 | discovery |
| Public Data Catalogue (acikveri.uskudar.bel.tr) / ckan-acikveri-uskudar-bel-tr | [GET](https://acikveri.uskudar.bel.tr/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://acikveri.uskudar.bel.tr/) | 1838 | callable |
| Public Data Catalogue (ladamas.laimburg.it) / ckan-ladamas-laimburg-it | [GET](https://ladamas.laimburg.it/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ladamas.laimburg.it/) | 969 | callable |
| Public Data Catalogue (datosabiertos.elhierro.es) / ckan-datosabiertos-elhierro-es | [GET](https://datosabiertos.elhierro.es/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datosabiertos.elhierro.es/) | 924 | callable |
| Public Data Catalogue (opendata.aiguesmanresa.cat) / ckan-opendata-aiguesmanresa-cat | [GET](https://opendata.aiguesmanresa.cat/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.aiguesmanresa.cat/) | 635 | callable |
| Public Data Catalogue (opendata.cmu.ac.th) / ckan-opendata-cmu-ac-th | [GET](https://opendata.cmu.ac.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.cmu.ac.th/) | 930 | callable |
| Public Data Catalogue (dados.ufes.br) / ckan-dados-ufes-br | [GET](https://dados.ufes.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ufes.br/) | 1289 | callable |
| Public Data Catalogue (dados.ifto.edu.br) / ckan-dados-ifto-edu-br | [GET](https://dados.ifto.edu.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.ifto.edu.br/) | 1312 | callable |
| Public Data Catalogue (opendata.engelholm.se) / ckan-opendata-engelholm-se | [GET](https://opendata.engelholm.se/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.engelholm.se/about) | 332 | callable |
| Public Data Catalogue (opendata.nu.ac.th) / ckan-opendata-nu-ac-th | [GET](https://opendata.nu.ac.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.nu.ac.th/) | 916 | callable |
| Public Data Catalogue (opendata.cro.ie) / ckan-opendata-cro-ie | [GET](https://opendata.cro.ie/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.cro.ie/) | 277 | callable |
| Public Data Catalogue (data.kalamazoocity.org) / ckan-data-kalamazoocity-org | [GET](https://data.kalamazoocity.org/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.kalamazoocity.org/) | 658 | callable |
| Public Data Catalogue (dados.lncc.br) / ckan-dados-lncc-br | [GET](https://dados.lncc.br/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.lncc.br/) | 1568 | callable |
| Public Data Catalogue (opendata.bastad.se) / ckan-opendata-bastad-se | [GET](https://opendata.bastad.se/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.bastad.se/about) | 216 | callable |
| Public Data Catalogue (dados.esposende.pt) / ckan-dados-esposende-pt | [GET](https://dados.esposende.pt/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://dados.esposende.pt/) | 490 | callable |
| Public Data Catalogue (opendata.tkpark.or.th) / ckan-opendata-tkpark-or-th | [GET](https://opendata.tkpark.or.th/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.tkpark.or.th/) | 2106 | callable |
| Seattle Open Data / seattleopendata | [GET](https://data.seattle.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.seattle.gov/stories/s/Data-Policy/6ukr-wvup/) | 1191 | callable |
| Austin Open Data / austinopendata | [GET](https://data.austintexas.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.austintexas.gov/stories/s/ranj-cccq) | 2749 | callable |
| Calgary Open Data / calgaryopendata | [GET](https://data.calgary.ca/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.calgary.ca/stories/s/u45n-7awa/) | 1062 | callable |
| Edmonton Open Data / edmontonopendata | [GET](https://data.edmonton.ca/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.edmonton.ca/stories/s/qcsu-n5wv/) | 2298 | callable |
| Winnipeg Open Data / winnipegopendata | [GET](https://data.winnipeg.ca/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.winnipeg.ca/stories/s/Open-Data-Licence/rwzh-4ijx/) | 1031 | callable |
| Maryland Open Data / marylandopendata | [GET](https://opendata.maryland.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://opendata.maryland.gov/) | 5622 | callable |
| New York State Open Data / newyorkstateopendata | [GET](https://data.ny.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.ny.gov/) | 5764 | callable |
| Vermont Open Data / vermontopendata | [GET](https://data.vermont.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.vermont.gov/) | 869 | callable |
| Connecticut Open Data / connecticutopendata | [GET](https://data.ct.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.ct.gov/) | 3156 | callable |
| Washington State Open Data / washingtonstateopendata | [GET](https://data.wa.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.wa.gov/) | 1866 | callable |
| Oregon Open Data / oregonopendata | [GET](https://data.oregon.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.oregon.gov/) | 1233 | callable |
| Pennsylvania Open Data / pennsylvaniaopendata | [GET](https://data.pa.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.pa.gov/data-policy) | 1337 | callable |
| New Jersey Open Data / newjerseyopendata | [GET](https://data.nj.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.nj.gov/) | 1974 | callable |
| Missouri Open Data / missouriopendata | [GET](https://data.mo.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.mo.gov/) | 1008 | callable |
| Michigan Open Data / michiganopendata | [GET](https://data.michigan.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.michigan.gov/) | 1103 | callable |
| Montgomery County Maryland Open Data / montgomerycountymarylandopendata | [GET](https://data.montgomerycountymd.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.montgomerycountymd.gov/) | 1605 | callable |
| King County Open Data / kingcountyopendata | [GET](https://data.kingcounty.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.kingcounty.gov/) | 2096 | callable |
| San Francisco Open Data / sanfranciscoopendata | [GET](https://data.sf.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.sf.gov/) | 2616 | callable |
| Prince George's County Open Data / princegeorgescountyopendata | [GET](https://data.princegeorgescountymd.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.princegeorgescountymd.gov/) | 1191 | callable |
| Sonoma County Open Data / sonomacountyopendata | [GET](https://data.sonomacounty.ca.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.sonomacounty.ca.gov/) | 1641 | callable |
| Fulton County Georgia Open Data / fultoncountygeorgiaopendata | [GET](https://data.fultoncountyga.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.fultoncountyga.gov/) | 1317 | callable |
| San Mateo County Open Data / sanmateocountyopendata | [GET](https://data.smcgov.org/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.smcgov.org/) | 3248 | callable |
| Honolulu Open Data / honoluluopendata | [GET](https://data.honolulu.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.honolulu.gov/) | 1828 | callable |
| Dallas Open Data / dallasopendata | [GET](https://www.dallasopendata.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://www.dallasopendata.com/) | 2671 | callable |
| New Orleans Open Data / neworleansopendata | [GET](https://data.nola.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.nola.gov/) | 926 | callable |
| Baton Rouge Open Data / batonrougeopendata | [GET](https://data.brla.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.brla.gov/about) | 1808 | callable |
| Kansas City Missouri Open Data / kansascitymissouriopendata | [GET](https://data.kcmo.org/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.kcmo.org/) | 1156 | callable |
| Cincinnati Open Data / cincinnatiopendata | [GET](https://data.cincinnati-oh.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.cincinnati-oh.gov/) | 939 | callable |
| Buffalo Open Data / buffaloopendata | [GET](https://data.buffalony.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.buffalony.gov/) | 2194 | callable |
| Mesa Open Data / mesaopendata | [GET](https://data.mesaaz.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.mesaaz.gov/) | 1226 | callable |
| Providence Open Data / providenceopendata | [GET](https://data.providenceri.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.providenceri.gov/) | 1670 | callable |
| Somerville Open Data / somervilleopendata | [GET](https://data.somervillema.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.somervillema.gov/) | 1521 | callable |
| Cambridge Massachusetts Open Data / cambridgemassachusettsopendata | [GET](https://data.cambridgema.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.cambridgema.gov/) | 1172 | callable |
| Norfolk Open Data / norfolkopendata | [GET](https://data.norfolk.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.norfolk.gov/) | 982 | callable |
| Richmond Virginia Open Data / richmondvirginiaopendata | [GET](https://data.richmondgov.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.richmondgov.com/) | 874 | callable |
| Nova Scotia Open Data / novascotiaopendata | [GET](https://data.novascotia.ca/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.novascotia.ca/) | 1162 | callable |
| Santa Clara County Open Data / santaclaracountyopendata | [GET](https://data.sccgov.org/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.sccgov.org/) | 1563 | callable |
| Oakland Open Data / oaklandopendata | [GET](https://data.oaklandca.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.oaklandca.gov/) | 1060 | callable |
| Marin County Open Data / marincountyopendata | [GET](https://data.marincounty.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.marincounty.gov/) | 847 | callable |
| Pierce County Open Data / piercecountyopendata | [GET](https://open.piercecountywa.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://open.piercecountywa.gov/) | 3109 | callable |
| Riverside County Open Data / riversidecountyopendata | [GET](https://data.countyofriverside.us/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.countyofriverside.us/) | 1057 | callable |
| Howard County Maryland Open Data / howardcountymarylandopendata | [GET](https://opendata.howardcountymd.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://opendata.howardcountymd.gov/about) | 2007 | callable |
| Transportation Department Open Data / transportationdepartmentopendata | [GET](https://data.transportation.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.transportation.gov/) | 2541 | callable |
| Catalonia Open Data API / cataloniaopendataapi | [GET](https://analisi.transparenciacatalunya.cat/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://analisi.transparenciacatalunya.cat/) | 5313 | callable |
| Regione Lombardia Open Data / regionelombardiaopendata | [GET](https://www.dati.lombardia.it/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://www.dati.lombardia.it/) | 16515 | callable |
| Clermont County Open Data API / clermontcountyopendataapi | [GET](https://opendata.clermontauditor.org/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://opendata.clermontauditor.org/) | 1898 | callable |
| Macoupin County Open Data API / macoupincountyopendataapi | [GET](https://data.macoupincountyil.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.macoupincountyil.gov/) | 809 | callable |
| Cook County Open Data Catalog API / cookcountyopendatacatalogapi | [GET](https://cookcounty.data.socrata.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://cookcounty.data.socrata.com/) | 862 | callable |
| Everett Open Data Portal API / everettopendataportalapi | [GET](https://data.everettwa.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.everettwa.gov/) | 908 | callable |
| Auburn Open Data API / auburnopendataapi | [GET](https://data.auburnwa.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.auburnwa.gov/) | 948 | callable |
| Puerto Rico Electoral Comptroller Open Data API / puertoricoelectoralcomptrolleropendataapi | [GET](https://data.oce.pr.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.oce.pr.gov/) | 1673 | callable |
| Fiscal Focus Pittsburgh API / fiscalfocuspittsburghapi | [GET](https://fiscalfocus.pittsburghpa.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://fiscalfocus.pittsburghpa.gov/) | 1499 | callable |
| Reading Pennsylvania Open Data API / readingpennsylvaniaopendataapi | [GET](https://data.readingpa.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.readingpa.gov/) | 828 | callable |
| Zero Fatalities NV Open Data API / zerofatalitiesnvopendataapi | [GET](https://opendata.zerofatalitiesnv.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://opendata.zerofatalitiesnv.com/) | 840 | callable |
| New Jersey Health Data API / newjerseyhealthdataapi | [GET](https://healthdata.nj.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://healthdata.nj.gov/) | 827 | callable |
| Richmond California Open Data API / richmondcaliforniaopendataapi | [GET](https://www.transparentrichmond.org/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://www.transparentrichmond.org/) | 928 | callable |
| Open Nassau API / opennassauapi | [GET](https://opendata.nassaucountyny.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://opendata.nassaucountyny.gov/) | 830 | callable |
| Hawaii Campaign Spending Commission Data API / hawaiicampaignspendingcommissiondataapi | [GET](https://hicscdata.hawaii.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://hicscdata.hawaii.gov/) | 1025 | callable |
| Health Data NY API / healthdatanyapi | [GET](https://health.data.ny.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://health.data.ny.gov/) | 1343 | callable |
| State of Hawaii Department of Transportation API / stateofhawaiidepartmentoftransportationapi | [GET](https://highways.hidot.hawaii.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://highways.hidot.hawaii.gov/) | 1958 | callable |
| Montgomery County Public Schools data catalog API / montgomerycountypublicschoolsdatacatalogapi | [GET](https://data.montgomeryschoolsmd.org/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.montgomeryschoolsmd.org/) | 989 | callable |
| City of Bloomington Open Data Portal API / cityofbloomingtonopendataportalapi | [GET](https://data.bloomington.in.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.bloomington.in.gov/) | 913 | callable |
| Queen Anne's County Open Data API / queenannescountyopendataapi | [GET](https://data.qac.org/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.qac.org/) | 720 | callable |
| Fort Lauderdale Police Open Data API / fortlauderdalepoliceopendataapi | [GET](https://fortlauderdale.data.socrata.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://fortlauderdale.data.socrata.com/) | 1020 | callable |
| City of Orlando Open Data Portal API / cityoforlandoopendataportalapi | [GET](https://data.cityoforlando.net/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.cityoforlando.net/) | 539 | callable |
| City of Dubuque Open Data API / cityofdubuqueopendataapi | [GET](https://dubuque.data.socrata.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://dubuque.data.socrata.com/) | 726 | callable |
| Gainesville Open Data API / gainesvilleopendataapi | [GET](https://data.cityofgainesville.org/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.cityofgainesville.org/) | 871 | callable |
| City of West Hollywood Open Data Catalog API / cityofwesthollywoodopendatacatalogapi | [GET](https://data.weho.org/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.weho.org/) | 759 | callable |
| Encinitas Data & Insights API / encinitasdatainsightsapi | [GET](https://datainsights.encinitasca.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://datainsights.encinitasca.gov/) | 841 | callable |
| Roseville Open Data API / rosevilleopendataapi | [GET](https://data.roseville.ca.us/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.roseville.ca.us/) | 1144 | callable |
| Moreno Valley Open Data API / morenovalleyopendataapi | [GET](https://moreno-valley.data.socrata.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://moreno-valley.data.socrata.com/) | 773 | callable |
| Corona Open Performance API / coronaopenperformanceapi | [GET](https://corstat.coronaca.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://corstat.coronaca.gov/) | 810 | callable |
| Modesto City View API / modestocityviewapi | [GET](https://data.modestogov.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.modestogov.com/) | 1004 | callable |
| Santa Monica Sustainable City Plan API / santamonicasustainablecityplanapi | [GET](https://data.sustainablesm.org/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.sustainablesm.org/) | 904 | callable |
| California State Controller Open Data API / californiastatecontrolleropendataapi | [GET](https://www.bythenumbers.sco.ca.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://www.bythenumbers.sco.ca.gov/) | 777 | callable |
| Stockton City Data Catalog API / stocktoncitydatacatalogapi | [GET](https://data.stocktonca.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.stocktonca.gov/) | 774 | callable |
| Napa County HHSA Open Data Portal API / napacountyhhsaopendataportalapi | [GET](https://data.napacounty.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.napacounty.gov/) | 867 | callable |
| San Diego County Data Portal API / sandiegocountydataportalapi | [GET](https://data.sandiegocounty.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.sandiegocounty.gov/) | 1321 | callable |
| Bay Area Metro Open Data API / bayareametroopendataapi | [GET](https://data.bayareametro.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.bayareametro.gov/) | 2708 | callable |
| Town of Parker Open Data API / townofparkeropendataapi | [GET](https://parkeronline.data.socrata.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://parkeronline.data.socrata.com/) | 790 | callable |
| Mesquite Texas Open Data Portal API / mesquitetexasopendataportalapi | [GET](https://opendata.cityofmesquite.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://opendata.cityofmesquite.com/) | 733 | callable |
| College Station Open Data API / collegestationopendataapi | [GET](https://data.cstx.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.cstx.gov/) | 722 | callable |
| Williamson Central Appraisal District Open Data API / williamsoncentralappraisaldistrictopendataapi | [GET](https://data.wcad.org/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.wcad.org/) | 757 | callable |
| FCC Open Data API / fccopendataapi | [GET](https://opendata.fcc.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://opendata.fcc.gov/) | 743 | callable |
| National Library of Medicine Open Data API / nationallibraryofmedicineopendataapi | [GET](https://datadiscovery.nlm.nih.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://datadiscovery.nlm.nih.gov/) | 875 | callable |
| USAC Open Data API / usacopendataapi | [GET](https://opendata.usac.org/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://opendata.usac.org/) | 810 | callable |
| AmeriCorps Open Data API / americorpsopendataapi | [GET](https://data.americorps.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.americorps.gov/) | 1014 | callable |
| Town of Mount Pleasant Open Data API / townofmountpleasantopendataapi | [GET](https://data.tompsc.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.tompsc.com/) | 778 | callable |
| Massachusetts Education-to-Career Research and Data Hub API / massachusettseducationtocareerresearchanddatahubapi | [GET](https://educationtocareer.data.mass.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://educationtocareer.data.mass.gov/) | 984 | callable |
| Framingham Open Data API / framinghamopendataapi | [GET](https://data.framinghamma.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.framinghamma.gov/) | 778 | callable |
| Impact STLCO API / impactstlcoapi | [GET](https://impact.stlouisco.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://impact.stlouisco.com/) | 810 | callable |
| Springfield Open Data API / springfieldopendataapi | [GET](https://springfield.data.socrata.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://springfield.data.socrata.com/) | 842 | callable |
| Mississippi Medical Cannabis Program Data Portal API / mississippimedicalcannabisprogramdataportalapi | [GET](https://data.mmcp.ms.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://data.mmcp.ms.gov/) | 746 | callable |
| Johns Creek Police Department API / johnscreekpolicedepartmentapi | [GET](https://policeview.johnscreekga.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://policeview.johnscreekga.gov/) | 742 | callable |
| City of Alpharetta Open Data API / cityofalpharettaopendataapi | [GET](https://alpharetta.data.socrata.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://alpharetta.data.socrata.com/) | 772 | callable |
| Metropolitan Airports Commission Open Data API / metropolitanairportscommissionopendataapi | [GET](https://metroairports.data.socrata.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://metroairports.data.socrata.com/) | 800 | callable |
| Ramsey County Minnesota Open Data API / ramseycountyminnesotaopendataapi | [GET](https://opendata.ramseycountymn.gov/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://opendata.ramseycountymn.gov/) | 1816 | callable |
| MI School Data Open Data Portal API / mischooldataopendataportalapi | [GET](https://mischooldata.data.socrata.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://mischooldata.data.socrata.com/) | 855 | callable |
| Open Data New Brunswick API / opendatanewbrunswickapi | [GET](https://gnb.socrata.com/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://gnb.socrata.com/) | 1135 | callable |
| Friuli Venezia Giulia Open Data API / friuliveneziagiuliaopendataapi | [GET](https://www.dati.friuliveneziagiulia.it/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://www.dati.friuliveneziagiulia.it/) | 6223 | callable |
| Nova Scotia Property Valuation Open Data API / novascotiapropertyvaluationopendataapi | [GET](https://www.thedatazone.ca/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://www.thedatazone.ca/) | 739 | callable |
| Australian Capital Territory Open Data API / australiancapitalterritoryopendataapi | [GET](https://www.data.act.gov.au/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://www.data.act.gov.au/) | 1038 | callable |
| Camden Open Data Portal API / camdenopendataportalapi | [GET](https://opendata.camden.gov.uk/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://opendata.camden.gov.uk/) | 2003 | callable |
| RDW Open Mobility Data API / rdwopenmobilitydataapi | [GET](https://opendata.rdw.nl/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://opendata.rdw.nl/) | 903 | callable |
| Cohesion Open Data API / cohesionopendataapi | [GET](https://cohesiondata.ec.europa.eu/api/views/metadata/v1?limit=1) | 200 | ok / ok_json | [free](https://cohesiondata.ec.europa.eu/) | 3324 | callable |
| OpenDataAixEnProvence Public Catalog / odscatalogaixenprovenceopendatasoftcom | [GET](https://aix-en-provence.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://aix-en-provence.opendatasoft.com/pages/home0/) | 462 | callable |
| Análisis de datos abiertos JCyL Public Catalog / odscataloganalisisdatosabiertosjcyles | [GET](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://analisis.datosabiertos.jcyl.es/pages/home/) | 537 | callable |
| ANRU Public Catalog / odscataloganruopendataopendatasoftcom | [GET](https://anruopendata.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://anruopendata.opendatasoft.com/explore/) | 763 | callable |
| ARES Higher Education Public Catalog / odscatalogaresdigitalwalloniaopendatasoftcom | [GET](https://ares-digitalwallonia.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://ares-digitalwallonia.opendatasoft.com/pages/home/) | 1484 | callable |
| Arpae Public Catalog / odscatalogarpaeopendatasoftcom | [GET](https://arpae.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://arpae.opendatasoft.com/pages/home/) | 715 | callable |
| French Foreign Affairs Documentary Service Public Catalog / odscatalogbasedocdiplomatiegouvfr | [GET](https://basedoc.diplomatie.gouv.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://basedoc.diplomatie.gouv.fr/pages/accueil-recherche/) | 385 | callable |
| Groupe BPCE Public Catalog / odscatalogbpceopendatasoftcom | [GET](https://bpce.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://bpce.opendatasoft.com/pages/home/) | 410 | callable |
| City of Cachan Public Catalog / odscatalogcachanopendatasoftcom | [GET](https://cachan.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://cachan.opendatasoft.com/pages/accueil/) | 528 | callable |
| Cadent Gas Ltd Public Catalog / odscatalogcadentgasopendatasoftcom | [GET](https://cadentgas.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://cadentgas.opendatasoft.com/pages/home/) | 630 | callable |
| CCPHVA Public Catalog / odscatalogccphvaopendatasoftcom | [GET](https://ccphva.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://ccphva.opendatasoft.com/pages/accueil0/) | 489 | callable |
| City of Salinas Public Catalog / odscatalogcityofsalinasopendatasoftcom | [GET](https://cityofsalinas.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://cityofsalinas.opendatasoft.com/pages/newfrontpage/) | 760 | callable |
| Ferrocarrils Generalitat Catalunya Public Catalog / odscatalogdadesobertesfgccat | [GET](https://dadesobertes.fgc.cat/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://dadesobertes.fgc.cat/pages/frontpage/) | 405 | callable |
| Tarn et Garonne Public Catalog / odscatalogdata82amenagementfr | [GET](https://data.82amenagement.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.82amenagement.fr/pages/accueil/) | 490 | callable |
| French Development Assistance Public Catalog / odscatalogdataaidedeveloppementgouvfr | [GET](https://data.aide-developpement.gouv.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.aide-developpement.gouv.fr/pages/accueil/) | 316 | callable |
| Métropole Aix-Marseille Provence Public Catalog / odscatalogdataampmetropolefr | [GET](https://data.ampmetropole.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.ampmetropole.fr/pages/accueil/) | 1572 | callable |
| Angers Loire Métropole Public Catalog / odscatalogdataangersfr | [GET](https://data.angers.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.angers.fr/pages/home/) | 476 | callable |
| French National Research Agency Public Catalog / odscatalogdataanrfr | [GET](https://data.anr.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.anr.fr/pages/accueil/) | 621 | callable |
| CNSA Autonomy Public Catalog / odscatalogdataautonomiecnsafr | [GET](https://data-autonomie.cnsa.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data-autonomie.cnsa.fr/pages/accueil-accessibilite/) | 584 | callable |
| BEP Namur Economic Development Public Catalog / odscatalogdatabepbe | [GET](https://data.bep.be/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.bep.be/pages/accueil/) | 756 | callable |
| Blois Agglopolys Public Catalog / odscatalogdatabloisagglopolysfr | [GET](https://data.blois.agglopolys.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.blois.agglopolys.fr/pages/accueil/) | 550 | callable |
| Bourges Plus Public Catalog / odscatalogdatabourgesplusfr | [GET](https://data.bourgesplus.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.bourgesplus.fr/pages/accueil/) | 1136 | callable |
| Région Bretagne Public Catalog / odscatalogdatabretagnebzh | [GET](https://data.bretagne.bzh/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.bretagne.bzh/pages/home-page/) | 494 | callable |
| Brisbane City Council Public Catalog / odscatalogdatabrisbaneqldgovau | [GET](https://data.brisbane.qld.gov.au/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.brisbane.qld.gov.au/pages/home/) | 2002 | callable |
| City of Bruges Public Catalog / odscatalogdatabruggebe | [GET](https://data.brugge.be/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.brugge.be/explore/) | 5068 | callable |
| Camden Council Public Catalog / odscatalogdatacamdennswgovau | [GET](https://data.camden.nsw.gov.au/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.camden.nsw.gov.au/pages/home/) | 1742 | callable |
| Campbelltown City Council Public Catalog / odscatalogdatacampbelltownnswgovau | [GET](https://data.campbelltown.nsw.gov.au/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.campbelltown.nsw.gov.au/pages/home/) | 1684 | callable |
| Cap Atlantique Public Catalog / odscatalogdatacapatlantiquefr | [GET](https://data.capatlantique.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.capatlantique.fr/pages/home/) | 461 | callable |
| CC Erdre et Gesvres Public Catalog / odscatalogdataccegfr | [GET](https://data.cceg.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.cceg.fr/pages/home/) | 334 | callable |
| Chateauroux Metropole Public Catalog / odscatalogdatachateaurouxmetropolefr | [GET](https://data.chateauroux-metropole.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.chateauroux-metropole.fr/explore/) | 669 | callable |
| DARES Labor Statistics Public Catalog / odscatalogdatadarestravailemploigouvfr | [GET](https://data.dares.travail-emploi.gouv.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.dares.travail-emploi.gouv.fr/explore/) | 621 | callable |
| Loir-et-Cher Public Catalog / odscatalogdatadepartement41fr | [GET](https://data.departement41.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.departement41.fr/pages/accueil/) | 619 | callable |
| French Economy Ministry Public Catalog / odscatalogdataeconomiegouvfr | [GET](https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.economie.gouv.fr/pages/accueil/) | 287 | callable |
| French National Education Public Catalog / odscatalogdataeducationgouvfr | [GET](https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.education.gouv.fr/pages/accueil/) | 242 | callable |
| French Higher Education and Research Public Catalog / odscatalogdataenseignementsuprecherchegouvfr | [GET](https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.enseignementsup-recherche.gouv.fr/pages/home/) | 740 | callable |
| ATIH Hospital and Social Care Public Catalog / odscatalogdataessentielatihsantefr | [GET](https://data-essentiel.atih.sante.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data-essentiel.atih.sante.fr/pages/accueil/) | 402 | callable |
| Eure-et-Loir Public Catalog / odscatalogdataeurelienfr | [GET](https://data.eurelien.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.eurelien.fr/pages/home/) | 576 | callable |
| Fairfield City Council Public Catalog / odscatalogdatafairfieldcitynswgovau | [GET](https://data.fairfieldcity.nsw.gov.au/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.fairfieldcity.nsw.gov.au/pages/homepage/) | 1394 | callable |
| Fleury-sur-Orne Public Catalog / odscatalogdatafleurysurornefr | [GET](https://data.fleurysurorne.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.fleurysurorne.fr/pages/accueil/) | 1090 | callable |
| Gers Public Catalog / odscatalogdatagersfr | [GET](https://data.gers.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.gers.fr/pages/accueil/) | 678 | callable |
| New Caledonia Public Catalog / odscatalogdatagouvnc | [GET](https://data.gouv.nc/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.gouv.nc/pages/accueil/) | 1014 | callable |
| Grand Paris Grand Est Public Catalog / odscatalogdatagrandparisgrandestfr | [GET](https://data.grandparisgrandest.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.grandparisgrandest.fr/pages/accueil/) | 600 | callable |
| Haute-Garonne Public Catalog / odscatalogdatahautegaronnefr | [GET](https://data.haute-garonne.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.haute-garonne.fr/pages/accueil/) | 902 | callable |
| Hawkesbury City Council Public Catalog / odscatalogdatahawkesburynswgovau | [GET](https://data.hawkesbury.nsw.gov.au/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.hawkesbury.nsw.gov.au/pages/home/) | 1712 | callable |
| IDELIS Public Catalog / odscatalogdataidelisfr | [GET](https://data.idelis.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.idelis.fr/pages/accueil-data-idelis/) | 404 | callable |
| Ile-de-France Region Public Catalog / odscatalogdatailedefrancefr | [GET](https://data.iledefrance.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.iledefrance.fr/pages/home2026/) | 720 | callable |
| Ile-de-France Mobilites Public Catalog / odscatalogdatailedefrancemobilitesfr | [GET](https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.iledefrance-mobilites.fr/pages/home/) | 317 | callable |
| Jersey City Public Catalog / odscatalogdatajerseycitynjgov | [GET](https://data.jerseycitynj.gov/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.jerseycitynj.gov/pages/home-page/) | 782 | callable |
| La Mayenne Public Catalog / odscatalogdatalamayennefr | [GET](https://data.lamayenne.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.lamayenne.fr/pages/home/) | 866 | callable |
| La Roche-sur-Yon Public Catalog / odscatalogdatalarochesuryonfr | [GET](https://data.larochesuryon.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.larochesuryon.fr/pages/home/) | 836 | callable |
| Pyrenees-Atlantiques Public Catalog / odscatalogdatale64fr | [GET](https://data.le64.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.le64.fr/pages/accueil/) | 781 | callable |
| Leicester Public Catalog / odscatalogdataleicestergovuk | [GET](https://data.leicester.gov.uk/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.leicester.gov.uk/pages/home/) | 558 | callable |
| Liverpool City Council Australia Public Catalog / odscatalogdataliverpoolnswgovau | [GET](https://data.liverpool.nsw.gov.au/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.liverpool.nsw.gov.au/pages/home/) | 1559 | callable |
| Loire-Atlantique Public Catalog / odscatalogdataloireatlantiquefr | [GET](https://data.loire-atlantique.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.loire-atlantique.fr/pages/home/) | 531 | callable |
| Maine-et-Loire Department Public Catalog / odscatalogdatamaineetloirefr | [GET](https://data.maine-et-loire.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.maine-et-loire.fr/pages/accueil/) | 601 | callable |
| Mauges communauté Public Catalog / odscatalogdatamaugescommunautefr | [GET](https://data.maugescommunaute.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.maugescommunaute.fr/pages/accueil/) | 411 | callable |
| City of Melbourne Public Catalog / odscatalogdatamelbournevicgovau | [GET](https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.melbourne.vic.gov.au/pages/home/) | 1667 | callable |
| Mulhouse Alsace Agglomeration Public Catalog / odscatalogdatamulhousealsacefr | [GET](https://data.mulhouse-alsace.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.mulhouse-alsace.fr/pages/accueil/) | 1556 | callable |
| Namur Public Catalog / odscatalogdatanamurbe | [GET](https://data.namur.be/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.namur.be/pages/accueil/) | 1630 | callable |
| Nantes Métropole Public Catalog / odscatalogdatanantesmetropolefr | [GET](https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.nantesmetropole.fr/pages/home/) | 496 | callable |
| Nimes Metropole Public Catalog / odscatalogdatanimesmetropolefr | [GET](https://data.nimes-metropole.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.nimes-metropole.fr/pages/home/) | 698 | callable |
| Swiss Public Transport Public Catalog / odscatalogdataoevinfoch | [GET](https://data.oev-info.ch/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.oev-info.ch/explore/) | 633 | callable |
| Orléans Métropole Public Catalog / odscatalogdataorleansmetropolefr | [GET](https://data.orleans-metropole.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.orleans-metropole.fr/pages/home/) | 669 | callable |
| Pays de la Loire Public Catalog / odscatalogdatapaysdelaloirefr | [GET](https://data.paysdelaloire.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.paysdelaloire.fr/pages/home/) | 1216 | callable |
| RATP Public Catalog / odscatalogdataratpfr | [GET](https://data.ratp.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.ratp.fr/explore/) | 412 | callable |
| La Réunion Public Catalog / odscatalogdataregionreunioncom | [GET](https://data.regionreunion.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.regionreunion.com/pages/accueil/) | 788 | callable |
| Rennes Public Catalog / odscatalogdatarennesmetropolefr | [GET](https://data.rennesmetropole.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.rennesmetropole.fr/explore/) | 671 | callable |
| Rotterdam Public Catalog / odscatalogdatarotterdamnl | [GET](https://data.rotterdam.nl/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.rotterdam.nl/pages/home/) | 496 | callable |
| Saint-Nazaire Agglo Public Catalog / odscatalogdatasaintnazaireagglofr | [GET](https://data.saintnazaireagglo.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.saintnazaireagglo.fr/pages/home/) | 847 | callable |
| Sarthe Public Catalog / odscatalogdatasarthefr | [GET](https://data.sarthe.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.sarthe.fr/pages/home/) | 755 | callable |
| Seine-Saint-Denis Department Public Catalog / odscatalogdataseinesaintdenisfr | [GET](https://data.seinesaintdenis.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.seinesaintdenis.fr/pages/accueil/) | 1156 | callable |
| OpenDataSicoval Public Catalog / odscatalogdatasicovalfr | [GET](https://data.sicoval.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.sicoval.fr/pages/accueil2/) | 576 | callable |
| KAPSARC Public Catalog / odscatalogdatasourcekapsarcorg | [GET](https://datasource.kapsarc.org/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://datasource.kapsarc.org/pages/home/) | 916 | callable |
| French Sports Ministry Public Catalog / odscatalogdatasportsgouvfr | [GET](https://data.sports.gouv.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.sports.gouv.fr/pages/accueil/) | 1324 | callable |
| City of Ghent Public Catalog / odscatalogdatastadgent | [GET](https://data.stad.gent/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.stad.gent/explore/) | 1499 | callable |
| Saint-Malo Agglomeration Public Catalog / odscatalogdatastmaloagglomerationfr | [GET](https://data.stmalo-agglomeration.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.stmalo-agglomeration.fr/page/accueil/) | 1766 | callable |
| Strasbourg Public Catalog / odscatalogdatastrasbourgeu | [GET](https://data.strasbourg.eu/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.strasbourg.eu/pages/accueil/) | 656 | callable |
| TCO Public Catalog / odscatalogdatatcore | [GET](https://data.tco.re/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.tco.re/pages/accueil/) | 811 | callable |
| Territoire d’énergie Loire-Atlantique Public Catalog / odscatalogdatate44fr | [GET](https://data.te44.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.te44.fr/pages/home/) | 490 | callable |
| TEO Pays de la Loire Public Catalog / odscatalogdatateopaysdelaloirefr | [GET](https://data.teo-paysdelaloire.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.teo-paysdelaloire.fr/pages/accueil/) | 649 | callable |
| Kanton Thurgau Public Catalog / odscatalogdatatgch | [GET](https://data.tg.ch/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.tg.ch/pages/start/) | 1370 | callable |
| Toulouse Metropole Public Catalog / odscatalogdatatoulousemetropolefr | [GET](https://data.toulouse-metropole.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.toulouse-metropole.fr/pages/accueil/) | 552 | callable |
| Cary, NC Public Catalog / odscatalogdatatownofcaryorg | [GET](https://data.townofcary.org/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.townofcary.org/pages/homepage/) | 1104 | callable |
| Unedic Public Catalog / odscatalogdataunedicorg | [GET](https://data.unedic.org/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.unedic.org/pages/home/) | 588 | callable |
| Vendée Public Catalog / odscatalogdatavendeefr | [GET](https://data.vendee.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.vendee.fr/pages/home0/) | 521 | callable |
| Western Parkland Councils Public Catalog / odscatalogdatawpcouncilsnswgovau | [GET](https://data.wpcouncils.nsw.gov.au/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://data.wpcouncils.nsw.gov.au/pages/home/) | 3145 | callable |
| Castellon Provincial Council Public Catalog / odscatalogdatosabiertosdipcases | [GET](https://datosabiertos.dipcas.es/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://datosabiertos.dipcas.es/pages/portada/) | 746 | callable |
| Den Haag Public Catalog / odscatalogdenhaagopendataopendatasoftcom | [GET](https://den-haag-opendata.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://den-haag-opendata.opendatasoft.com/pages/home/) | 1168 | callable |
| Données ouvertes Hydro-Québec Public Catalog / odscatalogdonneeshydroquebeccom | [GET](https://donnees.hydroquebec.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://donnees.hydroquebec.com/explore/) | 540 | callable |
| Grand Paris Seine et Oise Public Catalog / odscataloggpseoopendatasoftcom | [GET](https://gpseo.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://gpseo.opendatasoft.com/pages/accueilv2/) | 509 | callable |
| Le Forem Public Catalog / odscatalogleforemdigitalwalloniaopendatasoftcom | [GET](https://leforem-digitalwallonia.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://leforem-digitalwallonia.opendatasoft.com/p/le-forem/) | 368 | callable |
| Stadt Mannheim Public Catalog / odscatalogmannheimopendatasoftcom | [GET](https://mannheim.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://mannheim.opendatasoft.com/page/home/) | 673 | callable |
| NIE Networks Public Catalog / odscatalognienetworksopendatasoftcom | [GET](https://nienetworks.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://nienetworks.opendatasoft.com/pages/home/) | 640 | callable |
| NIHR Public Catalog / odscatalognihropendatasoftcom | [GET](https://nihr.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://nihr.opendatasoft.com/pages/homepage/) | 577 | callable |
| ODRE Energy Networks Public Catalog / odscatalogodreopendatasoftcom | [GET](https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://odre.opendatasoft.com/explore/) | 1237 | callable |
| Aude Department Public Catalog / odscatalogopendataaudefr | [GET](https://opendata.aude.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.aude.fr/pages/accueil/) | 749 | callable |
| Aveyron Public Catalog / odscatalogopendataaveyronfr | [GET](https://opendata.aveyron.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.aveyron.fr/pages/accueil_2/) | 748 | callable |
| City of Brussels Public Catalog / odscatalogopendatabrusselsbe | [GET](https://opendata.brussels.be/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.brussels.be/pages/home/) | 960 | callable |
| CANGT Public Catalog / odscatalogopendatacangtfr | [GET](https://opendata.cangt.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.cangt.fr/pages/accueil/) | 702 | callable |
| Clermont Auvergne Métropole Public Catalog / odscatalogopendataclermontmetropoleeu | [GET](https://opendata.clermontmetropole.eu/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.clermontmetropole.eu/pages/accueil/) | 700 | callable |
| Infogreffe Public Catalog / odscatalogopendatadatainfogreffefr | [GET](https://opendata.datainfogreffe.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.datainfogreffe.fr/pages/offre-open-data/) | 474 | callable |
| Dortmund Public Catalog / odscatalogopendatadortmundde | [GET](https://open-data.dortmund.de/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://open-data.dortmund.de/pages/start/) | 1362 | callable |
| Elia Public Catalog / odscatalogopendataeliabe | [GET](https://opendata.elia.be/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.elia.be/pages/home/) | 538 | callable |
| Fluvius Public Catalog / odscatalogopendatafluviusbe | [GET](https://opendata.fluvius.be/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.fluvius.be/pages/homepage_v30/) | 523 | callable |
| Canton Fribourg Public Catalog / odscatalogopendatafrch | [GET](https://opendata.fr.ch/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.fr.ch/pages/home/) | 598 | callable |
| GRDF Public Catalog / odscatalogopendatagrdffr | [GET](https://opendata.grdf.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.grdf.fr/pages/accueil/) | 345 | callable |
| Hautes-Pyrenees Public Catalog / odscatalogopendatahapyfr | [GET](https://opendata.ha-py.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.ha-py.fr/pages/accueil/) | 548 | callable |
| Hauts-de-Seine Public Catalog / odscatalogopendatahautsdeseinefr | [GET](https://opendata.hauts-de-seine.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.hauts-de-seine.fr/pages/accueil/) | 782 | callable |
| Infrabel Public Catalog / odscatalogopendatainfrabelbe | [GET](https://opendata.infrabel.be/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.infrabel.be/pages/home/) | 1011 | callable |
| OpendataIsere Public Catalog / odscatalogopendataiserefr | [GET](https://opendata.isere.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.isere.fr/pages/accueil/) | 726 | callable |
| Liège Public Catalog / odscatalogopendataliegebe | [GET](https://opendata.liege.be/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.liege.be/pages/accueil/) | 566 | callable |
| Noisy-le-Grand Public Catalog / odscatalogopendatanoisylegrandfr | [GET](https://opendata.noisylegrand.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.noisylegrand.fr/pages/accueil/) | 1110 | callable |
| City of Port Phillip Public Catalog / odscatalogopendataportphillipvicgovau | [GET](https://opendata.portphillip.vic.gov.au/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.portphillip.vic.gov.au/pages/emissions-inventory/) | 1501 | callable |
| Royal Commission for Riyadh City Public Catalog / odscatalogopendatarcrcgovsa | [GET](https://opendata.rcrc.gov.sa/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.rcrc.gov.sa/pages/home-page/) | 846 | callable |
| Rhein-Kreis Neuss Public Catalog / odscatalogopendatarheinkreisneussde | [GET](https://opendata.rhein-kreis-neuss.de/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.rhein-kreis-neuss.de/pages/home/) | 666 | callable |
| Saemes Public Catalog / odscatalogopendatasaemesfr | [GET](https://opendata.saemes.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.saemes.fr/pages/home/) | 517 | callable |
| SOREGIES Public Catalog / odscatalogopendatasoregiesfr | [GET](https://opendata.soregies.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.soregies.fr/pages/page-accueil/) | 524 | callable |
| US Surface Transportation Board Public Catalog / odscatalogopendatastbgov | [GET](https://opendata.stb.gov/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.stb.gov/pages/homepage/) | 884 | callable |
| Morrisville Public Catalog / odscatalogopendatatownofmorrisvilleorg | [GET](https://opendata.townofmorrisville.org/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.townofmorrisville.org/pages/hub/) | 702 | callable |
| tpg Public Catalog / odscatalogopendatatpgch | [GET](https://opendata.tpg.ch/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.tpg.ch/pages/accueil/) | 473 | callable |
| OpenDataUmea Public Catalog / odscatalogopendataumease | [GET](https://opendata.umea.se/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.umea.se/pages/startsida/) | 1430 | callable |
| City of Vancouver Public Catalog / odscatalogopendatavancouverca | [GET](https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.vancouver.ca/pages/home/) | 856 | callable |
| West of England Combined Authority Public Catalog / odscatalogopendatawestofenglandcagovuk | [GET](https://opendata.westofengland-ca.gov.uk/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.westofengland-ca.gov.uk/pages/homepage/) | 640 | callable |
| Flanders WEWIS Public Catalog / odscatalogopendatawewisvlaanderenbe | [GET](https://opendata.wewis.vlaanderen.be/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.wewis.vlaanderen.be/pages/homepage/) | 673 | callable |
| City of Wuerzburg Public Catalog / odscatalogopendatawuerzburgde | [GET](https://opendata.wuerzburg.de/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://opendata.wuerzburg.de/pages/home/) | 626 | callable |
| Urssaf Public Catalog / odscatalogopenurssaffr | [GET](https://open.urssaf.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://open.urssaf.fr/pages/home/) | 893 | callable |
| SNCF Public Catalog / odscatalogressourcesdatasncfcom | [GET](https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://ressources.data.sncf.com/pages/accueil/) | 581 | callable |
| Saint-Louis Agglo Public Catalog / odscatalogsaintlouisaggloopendatasoftcom | [GET](https://saint-louis-agglo.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://saint-louis-agglo.opendatasoft.com/pages/accueil/) | 526 | callable |
| SEDIF Public Catalog / odscatalogsedifopendatasoftcom | [GET](https://sedif.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://sedif.opendatasoft.com/pages/accueil/) | 413 | callable |
| SP Energy Networks Public Catalog / odscatalogspenergynetworksopendatasoftcom | [GET](https://spenergynetworks.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://spenergynetworks.opendatasoft.com/pages/home/) | 793 | callable |
| SSEN Transmission Public Catalog / odscatalogssentransmissionopendatasoftcom | [GET](https://ssentransmission.opendatasoft.com/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://ssentransmission.opendatasoft.com/pages/homepage/) | 1064 | callable |
| Banque de France Webstat Public Catalog / odscatalogwebstatbanquefrancefr | [GET](https://webstat.banque-france.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://webstat.banque-france.fr/fr/) | 760 | callable |
| DILA French Legal Publications Public Catalog / odscatalogwwwbodaccfr | [GET](https://www.bodacc.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://www.bodacc.fr/pages/home/) | 430 | callable |
| Bahrain Government Public Catalog / odscatalogwwwdatagovbh | [GET](https://www.data.gov.bh/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://www.data.gov.bh/pages/homepage/) | 596 | callable |
| Brabant Wallon Public Catalog / odscatalogwwwezybwbe | [GET](https://www.e-zybw.be/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://www.e-zybw.be/pages/homepage/) | 485 | callable |
| Hérault Data Public Catalog / odscatalogwwwheraultdatafr | [GET](https://www.herault-data.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://www.herault-data.fr/pages/accueil/) | 1532 | callable |
| Wallonia Brussels Public Catalog / odscatalogwwwodwbbe | [GET](https://www.odwb.be/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://www.odwb.be/pages/home/) | 950 | callable |
| Morbihan Public Catalog / odscatalogwwwopendata56fr | [GET](https://www.opendata56.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://www.opendata56.fr/pages/home/) | 854 | callable |
| Pays Basque Public Catalog / odscatalogwwwopendatapaysbasquefr | [GET](https://www.opendata-paysbasque.fr/api/explore/v2.1/catalog/datasets?limit=1) | 200 | ok / ok_json | [free](https://www.opendata-paysbasque.fr/explore/) | 552 | callable |
| ADP - Slovenian Social Science Data Archives Search API / adpsloveniansocialsciencedataarchivessearchapi | [GET](https://dataverse.adp.fdv.uni-lj.si/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.adp.fdv.uni-lj.si/) | 358 | callable |
| ACSS Dataverse Search API / acssdataversesearchapi | [GET](https://dataverse.theacss.org/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.theacss.org/) | 627 | callable |
| ARP Research Data Search API / arpresearchdatasearchapi | [GET](https://repo.researchdata.hu/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://researchdata.hu/en/service-map) | 465 | callable |
| ASU Library Research Data Repository Search API / asulibraryresearchdatarepositorysearchapi | [GET](https://dataverse.asu.edu/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://lib.asu.edu/research/research-data-repository) | 347 | callable |
| Arca Dados Search API / arcadadossearchapi | [GET](https://arcadados.fiocruz.br/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://arcadados.fiocruz.br/) | 951 | callable |
| AUSSDA Dataverse Search API / aussdadataversesearchapi | [GET](https://data.aussda.at/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://data.aussda.at/) | 390 | callable |
| bonndata Search API / bonndatasearchapi | [GET](https://bonndata.uni-bonn.de/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://bonndata.uni-bonn.de/) | 504 | callable |
| Borealis Search API / borealissearchapi | [GET](https://borealisdata.ca/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://borealisdata.ca/) | 586 | callable |
| BioData.pt Data Management Portal (DMPortal) Search API / biodataptdatamanagementportaldmportalsearchapi | [GET](https://dmportal.biodata.pt/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dmportal.biodata.pt/) | 498 | callable |
| BSC Dataverse Search API / bscdataversesearchapi | [GET](https://dataverse.bsc.es/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.bsc.es/) | 446 | callable |
| BRIN Dataverse Search API / brindataversesearchapi | [GET](https://data.brin.go.id/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://data.brin.go.id/) | 1923 | callable |
| CESA Research Data Search API / cesaresearchdatasearchapi | [GET](https://opendata.cesa.edu.co/api/search?q=%2A&per_page=1&type=dataset) | 200 | ok / ok_json | [free](https://opendata.cesa.edu.co/) | 830 | callable |
| CBPF Research Data Search API / cbpfresearchdatasearchapi | [GET](https://dataverse.cbpf.br/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.cbpf.br/) | 789 | callable |
| CedapDados Search API / cedapdadossearchapi | [GET](https://cedapdados.ufrgs.br/api/search?q=%2A&per_page=1&type=dataset) | 200 | ok / ok_json | [free](https://cedapdados.ufrgs.br/) | 1125 | callable |
| CIDACS Search API / cidacssearchapi | [GET](https://dataverse.cidacs.org/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.cidacs.org/) | 915 | callable |
| CROSSDA Search API / crossdasearchapi | [GET](https://data.crossda.hr/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://data.crossda.hr/) | 714 | callable |
| CSDA Dataverse Search API / csdadataversesearchapi | [GET](https://archivdv.soc.cas.cz/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://archivdv.soc.cas.cz/) | 815 | callable |
| Dane Badawcze UW Search API / danebadawczeuwsearchapi | [GET](https://danebadawcze.uw.edu.pl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://danebadawcze.uw.edu.pl/) | 616 | callable |
| DADOS IPB Search API / dadosipbsearchapi | [GET](https://dados.ipb.pt/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dados.ipb.pt/) | 536 | callable |
| dare Search API / daresearchapi | [GET](https://dare.uol.de/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dare.uol.de/) | 347 | callable |
| DaRUS Search API / darussearchapi | [GET](https://darus.uni-stuttgart.de/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://darus.uni-stuttgart.de/) | 1318 | callable |
| Dartmouth Dataverse Search API / dartmouthdataversesearchapi | [GET](https://dataverse.dartmouth.edu/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.dartmouth.edu/) | 1163 | callable |
| Data Suds Search API / datasudssearchapi | [GET](https://dataverse.ird.fr/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.ird.fr/) | 337 | callable |
| data.sciencespo Search API / datasciencesposearchapi | [GET](https://data.sciencespo.fr/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://data.sciencespo.fr/) | 534 | callable |
| DATADOI Search API / datadoisearchapi | [GET](https://datadoi.ee/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://datadoi.ee/) | 240 | callable |
| dataportal.ing.pan.pl Search API / dataportalingpanplsearchapi | [GET](https://dataportal.ing.pan.pl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataportal.ing.pan.pl/) | 472 | callable |
| DataPB Search API / datapbsearchapi | [GET](https://dataverse.ideal.ufpb.br/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.ideal.ufpb.br/) | 1037 | callable |
| Dataverse e-cienciaDatos Search API / dataverseecienciadatossearchapi | [GET](https://edatos.consorciomadrono.es/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://edatos.consorciomadrono.es/) | 421 | callable |
| DataverseLV Search API / dataverselvsearchapi | [GET](https://dv.dataverse.lv/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dv.dataverse.lv/) | 284 | callable |
| DataverseNL Search API / dataversenlsearchapi | [GET](https://dataverse.nl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.nl/) | 318 | callable |
| DataverseNO Search API / dataversenosearchapi | [GET](https://dataverse.no/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://site.uit.no/dataverseno/about/policy-framework/access-and-use-policy/) | 276 | callable |
| DataverseUA Search API / dataverseuasearchapi | [GET](https://opendata.nas.gov.ua/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://opendata.nas.gov.ua/) | 410 | callable |
| Datos para Resiliencia Search API / datospararesilienciasearchapi | [GET](https://datospararesiliencia.cl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://datospararesiliencia.cl/) | 567 | callable |
| DeiC Dataverse Search API / deicdataversesearchapi | [GET](https://dataverse.deic.dk/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.deic.dk/) | 388 | callable |
| DUnAs Search API / dunassearchapi | [GET](https://dunas.ua.pt/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dunas.ua.pt/) | 948 | callable |
| DR-NTU (Data) Search API / drntudatasearchapi | [GET](https://researchdata.ntu.edu.sg/api/search?q=%2A&per_page=1&type=dataverse) | 200 | unresolved / customer_gateway_failed | [free](https://researchdata.ntu.edu.sg/) | 1044 | discovery |
| Florida International University Research Data Portal Search API / floridainternationaluniversityresearchdataportalsearchapi | [GET](https://dataverse.fiu.edu/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.fiu.edu/) | 845 | callable |
| George Mason University Dataverse Search API / georgemasonuniversitydataversesearchapi | [GET](https://dataverse.orc.gmu.edu/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.orc.gmu.edu/) | 510 | callable |
| Göttingen Research Online Search API / gttingenresearchonlinesearchapi | [GET](https://data.goettingen-research-online.de/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://www.sub.uni-goettingen.de/en/research/research-data/research-data-repositories) | 316 | callable |
| Harvard Dataverse Search API / harvarddataversesearchapi | [GET](https://dataverse.harvard.edu/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://datamanagement.hms.harvard.edu/share-publish/data-repositories/harvard-dataverse) | 984 | callable |
| HeiDATA Search API / heidatasearchapi | [GET](https://heidata.uni-heidelberg.de/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://heidata.uni-heidelberg.de/) | 338 | callable |
| IDSC Dataverse Search API / idscdataversesearchapi | [GET](https://dataverse.iza.org/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.iza.org/) | 440 | callable |
| IBICT Research Data Search API / ibictresearchdatasearchapi | [GET](https://repositoriopesquisas.ibict.br/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://repositoriopesquisas.ibict.br/) | 2118 | callable |
| Indata Search API / indatasearchapi | [GET](https://indata.cedia.edu.ec/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://indata.cedia.edu.ec/) | 1072 | callable |
| Institute of Russian Literature Dataverse Search API / instituteofrussianliteraturedataversesearchapi | [GET](https://dataverse.pushdom.ru/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.pushdom.ru/) | 327 | callable |
| International Potato Center Search API / internationalpotatocentersearchapi | [GET](https://data.cipotato.org/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://data.cipotato.org/) | 1076 | callable |
| ioerDATA Search API / ioerdatasearchapi | [GET](https://data.fdz.ioer.de/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://data.fdz.ioer.de/) | 466 | callable |
| ISSDA Dataverse Search API / issdadataversesearchapi | [GET](https://issda.ucd.ie/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://issda.ucd.ie/) | 327 | callable |
| IPGP Research Collection Search API / ipgpresearchcollectionsearchapi | [GET](https://dataverse.ipgp.fr/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.ipgp.fr/) | 539 | callable |
| IIT Dataverse Search API / iitdataversesearchapi | [GET](https://dataverse.iit.it/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.iit.it/) | 480 | callable |
| Jülich DATA Search API / jlichdatasearchapi | [GET](https://data.fz-juelich.de/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://data.fz-juelich.de/) | 387 | callable |
| KEEN Data Management Platform Search API / keendatamanagementplatformsearchapi | [GET](https://infraverse.zih.tu-dresden.de/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://infraverse.zih.tu-dresden.de/) | 396 | callable |
| KU Leuven RDR Search API / kuleuvenrdrsearchapi | [GET](https://rdr.kuleuven.be/api/search?q=%2A&per_page=1&type=dataset) | 200 | ok / ok_json | [free](https://rdr.kuleuven.be/) | 890 | callable |
| Lithuanian Data Archive for Social Sciences and Humanities (LiDA) Search API / lithuaniandataarchiveforsocialsciencesandhumanitieslidasearchapi | [GET](https://lida.dataverse.lt/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://lida.dataverse.lt/) | 319 | callable |
| JPL Open Repository Search API / jplopenrepositorysearchapi | [GET](https://dataverse.jpl.nasa.gov/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.jpl.nasa.gov/) | 1027 | callable |
| Libra Data Search API / libradatasearchapi | [GET](https://dataverse.lib.virginia.edu/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.lib.virginia.edu/) | 818 | callable |
| LORE - LIST Open Repository Search API / lorelistopenrepositorysearchapi | [GET](https://lore.list.lu/api/search?q=%2A&per_page=1&type=dataset) | 200 | ok / ok_json | [free](https://lore.list.lu/) | 327 | callable |
| MBLWHOI Library Dataverse Search API / mblwhoilibrarydataversesearchapi | [GET](https://dataverse.whoi.edu/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.whoi.edu/) | 559 | callable |
| MELDATA Search API / meldatasearchapi | [GET](https://data.mel.cgiar.org/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://data.mel.cgiar.org/) | 725 | callable |
| Ministerio de las Culturas, las Artes y los Saberes Search API / ministeriodelasculturaslasartesylossaberessearchapi | [GET](https://investigacionartes.mincultura.gov.co/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://investigacionartes.mincultura.gov.co/) | 692 | callable |
| NIE Data Repository Search API / niedatarepositorysearchapi | [GET](https://researchdata.nie.edu.sg/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://researchdata.nie.edu.sg/) | 554 | callable |
| NYCU Dataverse Search API / nycudataversesearchapi | [GET](https://dataverse.lib.nycu.edu.tw/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.lib.nycu.edu.tw/) | 622 | callable |
| ODISSEI Portal Search API / odisseiportalsearchapi | [GET](https://portal.odissei.nl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://portal.odissei.nl/) | 1843 | callable |
| Open Data @ UCLouvain Search API / opendatauclouvainsearchapi | [GET](https://dataverse.uclouvain.be/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.uclouvain.be/) | 335 | callable |
| osnaData Search API / osnadatasearchapi | [GET](https://osnadata.ub.uni-osnabrueck.de/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://osnadata.ub.uni-osnabrueck.de/) | 416 | callable |
| Open Forest Data Search API / openforestdatasearchapi | [GET](https://dataverse.openforestdata.pl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.openforestdata.pl/) | 422 | callable |
| PAPYRUS Search API / papyrussearchapi | [GET](https://papyrus-datos.co/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://papyrus-datos.co/) | 857 | callable |
| POLEN DataHub Search API / polendatahubsearchapi | [GET](https://datahub.polen.fccn.pt/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://datahub.polen.fccn.pt/) | 690 | callable |
| Peking University Open Research Data Search API / pekinguniversityopenresearchdatasearchapi | [GET](https://opendata.pku.edu.cn/api/search?q=%2A&per_page=1&type=dataverse) | 200 | unresolved / customer_gateway_failed | [free](https://lib.pku.edu.cn/portal/en) | 2524 | discovery |
| PolyU Research Data Repository Search API / polyuresearchdatarepositorysearchapi | [GET](https://researchdata.lib.polyu.edu.hk/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://researchdata.lib.polyu.edu.hk/) | 867 | callable |
| Pontificia Universidad Catolica del Peru Research Data Search API / pontificiauniversidadcatolicadelperuresearchdatasearchapi | [GET](https://datos.pucp.edu.pe/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://datos.pucp.edu.pe/) | 599 | callable |
| Recherche Data Gouv Search API / recherchedatagouvsearchapi | [GET](https://entrepot.recherche.data.gouv.fr/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://entrepot.recherche.data.gouv.fr/) | 520 | callable |
| QDR Main Collection Search API / qdrmaincollectionsearchapi | [GET](https://data.qdr.syr.edu/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://qdr.syr.edu/about) | 844 | callable |
| RepOD Search API / repodsearchapi | [GET](https://repod.icm.edu.pl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://repod.icm.edu.pl/) | 524 | callable |
| Repositorio de Datos Abiertos de Investigación (Redata) Search API / repositoriodedatosabiertosdeinvestigacinredatasearchapi | [GET](https://redata.anii.org.uy/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://redata.anii.org.uy/) | 986 | callable |
| Repositorio de datos de investigación de la Universidad de Chile Search API / repositoriodedatosdeinvestigacindelauniversidaddechilesearchapi | [GET](https://datos.uchile.cl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://datos.uchile.cl/) | 3084 | callable |
| Repositorio de Datos de Investigación de la Universidad Nacional de La Plata Search API / repositoriodedatosdeinvestigacindelauniversidadnacionaldelaplatasearchapi | [GET](https://datos.unlp.edu.ar/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://datos.unlp.edu.ar/) | 2534 | callable |
| Repositorio de Datos de Investigación USACH Search API / repositoriodedatosdeinvestigacinusachsearchapi | [GET](https://datos.usach.cl/api/search?q=%2A&per_page=1&type=dataverse) | 0 | redirect_https / tls_error | [free](https://datos.usach.cl/) | 386 | discovery |
| Repositorio de Datos de la Universidad del Pacífico (DatasetsUP) Search API / repositoriodedatosdelauniversidaddelpacficodatasetsupsearchapi | [GET](https://datasets.up.edu.pe/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://datasets.up.edu.pe/) | 2162 | callable |
| Repositorio de datos de la Universidad de Concepción Search API / repositoriodedatosdelauniversidaddeconcepcinsearchapi | [GET](https://datav.udec.cl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://datav.udec.cl/) | 2597 | callable |
| Repositorio de Datos Pontificia Universidad Javeriana Search API / repositoriodedatospontificiauniversidadjaverianasearchapi | [GET](https://dataverse.javeriana.edu.co/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.javeriana.edu.co/) | 2335 | callable |
| Repositorio de Datos Universidad Distrital Francisco José de Caldas Search API / repositoriodedatosuniversidaddistritalfranciscojosdecaldassearchapi | [GET](https://datosinvestigacion.udistrital.edu.co/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://datosinvestigacion.udistrital.edu.co/) | 1810 | callable |
| Repositorio TECdatos Search API / repositoriotecdatossearchapi | [GET](https://dataverse.tec.ac.cr/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.tec.ac.cr/) | 1458 | callable |
| Reposítorio SoilData Search API / repostoriosoildatasearchapi | [GET](https://repositorio.soildata.mapbiomas.org/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://repositorio.soildata.mapbiomas.org/) | 659 | callable |
| University of the National Education Commission Research Data Search API / universityofthenationaleducationcommissionresearchdatasearchapi | [GET](https://uken.rodbuk.pl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://uken.rodbuk.pl/) | 434 | callable |
| RODBUK AGH Search API / rodbukaghsearchapi | [GET](https://agh.rodbuk.pl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://agh.rodbuk.pl/) | 383 | callable |
| RODBUK PK Search API / rodbukpksearchapi | [GET](https://pk.rodbuk.pl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://pk.rodbuk.pl/) | 527 | callable |
| RODBUK UEK Search API / rodbukueksearchapi | [GET](https://uek.rodbuk.pl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://uek.rodbuk.pl/) | 521 | callable |
| RODBUK UJ Search API / rodbukujsearchapi | [GET](https://uj.rodbuk.pl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://uj.rodbuk.pl/) | 516 | callable |
| RSU Dataverse Search API / rsudataversesearchapi | [GET](https://dataverse.rsu.lv/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.rsu.lv/) | 172 | callable |
| Sano Research Data Search API / sanoresearchdatasearchapi | [GET](https://sano.rodbuk.pl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://sano.rodbuk.pl/) | 480 | callable |
| SODHA Search API / sodhasearchapi | [GET](https://www.sodha.be/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://www.sodha.be/) | 402 | callable |
| Tecnológico de Monterrey Data Hub Search API / tecnolgicodemonterreydatahubsearchapi | [GET](https://datahub.tec.mx/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://datahub.tec.mx/) | 704 | callable |
| The Henryk Niewodniczański Institute of Nuclear Physics Polish Academy of Sciences Search API / thehenrykniewodniczaskiinstituteofnuclearphysicspolishacademyofsciencessearchapi | [GET](https://ifj.rodbuk.pl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://ifj.rodbuk.pl/) | 459 | callable |
| TRR170-DB Search API / trr170dbsearchapi | [GET](https://planetary-data-portal.org/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://planetary-data-portal.org/) | 471 | callable |
| TUDOdata Search API / tudodatasearchapi | [GET](https://data.tu-dortmund.de/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://data.tu-dortmund.de/) | 531 | callable |
| UC Berkeley Library Dataverse Search API / ucberkeleylibrarydataversesearchapi | [GET](https://datasets.lib.berkeley.edu/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://datasets.lib.berkeley.edu/) | 1385 | callable |
| UCLA Dataverse Search API / ucladataversesearchapi | [GET](https://dataverse.ucla.edu/api/search?q=%2A&per_page=1&type=dataverse) | 200 | unresolved / customer_gateway_failed | [free](https://dataverse.ucla.edu/) | 944 | discovery |
| UD Dataverse Search API / uddataversesearchapi | [GET](https://dataverse.udel.edu/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.udel.edu/) | 857 | callable |
| ULiège Open Data Repository Search API / uligeopendatarepositorysearchapi | [GET](https://dataverse.uliege.be/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.uliege.be/) | 694 | callable |
| UNB Libraries Dataverse Search API / unblibrariesdataversesearchapi | [GET](https://dataverse.lib.unb.ca/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.lib.unb.ca/) | 906 | callable |
| University of Physical Culture Krakow Research Data Search API / universityofphysicalculturekrakowresearchdatasearchapi | [GET](https://akf.rodbuk.pl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://akf.rodbuk.pl/) | 704 | callable |
| Università Ca’ Foscari Venezia Datarepository Search API / universitcafoscariveneziadatarepositorysearchapi | [GET](https://datarepository.unive.it/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://datarepository.unive.it/) | 416 | callable |
| University of Wroclaw Research Data Search API / universityofwroclawresearchdatasearchapi | [GET](https://uwr.rodbuk.pl/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://uwr.rodbuk.pl/) | 668 | callable |
| University of Milan Research Data Search API / universityofmilanresearchdatasearchapi | [GET](https://dataverse.unimi.it/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.unimi.it/) | 394 | callable |
| VTTI Search API / vttisearchapi | [GET](https://dataverse.vtti.vt.edu/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.vtti.vt.edu/) | 1151 | callable |
| Yale Dataverse Search API / yaledataversesearchapi | [GET](https://dataverse.yale.edu/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.yale.edu/) | 714 | callable |
| Wyoming Data Repository Search API / wyomingdatarepositorysearchapi | [GET](https://dataverse.arcc.uwyo.edu/api/search?q=%2A&per_page=1&type=dataverse) | 200 | ok / ok_json | [free](https://dataverse.arcc.uwyo.edu/) | 1306 | callable |
