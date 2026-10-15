# Callable API audit

Checked: 2026-10-15T17:20:56.227Z. Mode: partial-recheck. Complete sweep: no.

**198 canonical free APIs verified from 1641 candidate/alias rows.** The site separately adds its existing approved managed providers; this sweep makes no managed or credentialed calls. The managed-only `customerExecutableProviderCount` is not the full `totalCallable`. Unknown pricing remains discovery even after HTTP 200.

Catalog arithmetic: 198 measured free APIs + 3 existing approved managed providers = **201 catalog-callable APIs**. This keyless audit does not retest paid managed providers. Reaching 1,000 requires 799 additional distinct verified APIs. **The required number of signups is unknown**, because credentials, rights, working adapters and overlap have not been established. Remaining wrong endpoints/unresolved services may still provide additional APIs; this is not proof of a global maximum.

Policy: Keyless HTTPS GET only; shared 20-second gateway transport; one retry at most; reviewed redirects only; 256 KiB body; eight workers; at least one second between requests per origin. A callable API needs a valid reviewed response, explicit free evidence and one canonical identity.

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

The original cohort has 1002 rows: 13 were verified and **989 originally failed**. 1002 match current evidence by ID and exact normalized name. 141 formerly failing rows now represent independently verified canonical APIs. Current status: 154 verified canonical rows, 110 duplicate rows, 738 discovery rows. These are row counts, not extra APIs per alias.

| Current cause | All original cohort rows | Originally failing rows only |
| --- | ---: | ---: |
| wrong_base_url_path | 408 | 408 |
| ok | 154 | 141 |
| redirect_https | 124 | 124 |
| duplicate | 110 | 110 |
| dead_upstream | 61 | 61 |
| unresolved | 56 | 56 |
| not_hosted_api | 31 | 31 |
| timeout | 24 | 24 |
| gateway_block | 12 | 12 |
| unknown_pricing | 11 | 11 |
| needs_key | 5 | 5 |
| rate_limit | 4 | 4 |
| commercial_permission | 2 | 2 |
| missing_default_params | 0 | 0 |

Cohort matching uses historical ID and exact normalized name, not normalized ID alone. Counts are candidate rows including aliases; expanded candidates are separate. Missing rows are unresolved, not presumed dead or key-required. Current causes do not rewrite original outcomes.

## Expanded sweep: current evidence

The following table covers all 1641 expanded candidate/alias rows. It must not be presented as a breakdown of the original 989 failures. Zeroes are explicit, including missing_default_params when no current response proves that cause.

| Current cause | Expanded rows |
| --- | ---: |
| wrong_base_url_path | 774 |
| ok | 198 |
| redirect_https | 183 |
| duplicate | 171 |
| dead_upstream | 97 |
| unresolved | 79 |
| not_hosted_api | 41 |
| gateway_block | 38 |
| timeout | 33 |
| unknown_pricing | 13 |
| needs_key | 8 |
| rate_limit | 4 |
| commercial_permission | 2 |
| missing_default_params | 0 |

Previously verified still working or represented by a verified canonical alias: 13/13. Previously verified requiring attention: none. Reused rows: 1634. Unchecked rows: 0.

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
| brazil | wrong_base_url_path |
| brnnysundregistrene | wrong_base_url_path |
| catasaservice | wrong_base_url_path, missing_default_params |
| cdnjs | wrong_base_url_path, missing_default_params |
| cheapshark | wrong_base_url_path |
| chesscom | wrong_base_url_path |
| citybikes | missing_default_params |
| citygdask | wrong_base_url_path, missing_default_params |
| cityhelsinki | wrong_base_url_path, missing_default_params |
| citytorontoopendata | wrong_base_url_path, missing_default_params |
| clinicaltrialsgov | wrong_base_url_path, missing_default_params |
| codewarsapi | wrong_base_url_path |
| coinlore | wrong_base_url_path |
| countriesgraphql | missing_default_params |
| countryis | wrong_base_url_path |
| crossref | missing_default_params |
| danishdataserviceenergi | wrong_base_url_path, missing_default_params |
| datausa | wrong_base_url_path, missing_default_params |
| datamuse | wrong_base_url_path, missing_default_params |
| deckofcardsapi | wrong_base_url_path, missing_default_params |
| digimoninformation | wrong_base_url_path |
| disify | wrong_base_url_path |
| disney | wrong_base_url_path, missing_default_params |
| dogceo | wrong_base_url_path |
| dsbstatisticsdenmark | missing_default_params |
| dungeonsanddragonsalternate | wrong_base_url_path, missing_default_params |
| environmentagency | wrong_base_url_path, missing_default_params |
| fakestoreapi | missing_default_params |
| fbiwanted | wrong_base_url_path, missing_default_params |
| fda | wrong_base_url_path, missing_default_params |
| federalregister | wrong_base_url_path, missing_default_params |
| ffxivcollect | wrong_base_url_path |
| freedictionary | wrong_base_url_path |
| freetogame | wrong_base_url_path, missing_default_params |
| fruityvice | wrong_base_url_path |
| fueleconomygov | wrong_base_url_path |
| gamerpower | wrong_base_url_path, missing_default_params |
| gbif | wrong_base_url_path, missing_default_params |
| genrenator | wrong_base_url_path |
| geojs | wrong_base_url_path |
| gutendex | missing_default_params |
| harrypotterapi | wrong_base_url_path |
| hebrewcalendar | wrong_base_url_path, missing_default_params |
| hipsteripsum | missing_default_params |
| icanhazdadjoke | wrong_base_url_path |
| indianmutualfund | wrong_base_url_path |
| ipify | wrong_base_url_path |
| jokeapi | wrong_base_url_path, missing_default_params |
| kanyerest | wrong_base_url_path |
| lorempicsum | missing_default_params |
| malaysiaopendataapi | wrong_base_url_path, missing_default_params |
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
| openbrewerydb | wrong_base_url_path |
| openfoodfacts | wrong_base_url_path, missing_default_params |
| opengovernmentargentina | missing_default_params |
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
| openfdadrug | wrong_base_url_path, missing_default_params |
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
| smhi | wrong_base_url_path |
| squiggle | missing_default_params |
| statisticsfinland | wrong_base_url_path |
| statisticsnorway | wrong_base_url_path, missing_default_params |
| statisticsswedenscb | wrong_base_url_path |
| sunrisesunsetapi | wrong_base_url_path, missing_default_params |
| sunrisesunsetio | wrong_base_url_path, missing_default_params |
| tunisiaopendataapi | wrong_base_url_path, missing_default_params |
| uniprotapi | wrong_base_url_path, missing_default_params |
| usgs | wrong_base_url_path, missing_default_params |
| wgerworkoutmanager | wrong_base_url_path, missing_default_params |
| wolnelektury | wrong_base_url_path |
| worldbank | wrong_base_url_path, missing_default_params |
| yesno | wrong_base_url_path |
| yugioh | wrong_base_url_path, missing_default_params |
| artinstituteofchicagoapi | wrong_base_url_path, missing_default_params |
| bobsburgersapi | wrong_base_url_path, missing_default_params |
| chemblapi | wrong_base_url_path, missing_default_params |
| currencyapi | wrong_base_url_path |
| diseasesh | wrong_base_url_path, missing_default_params |
| finalspaceapi | wrong_base_url_path |
| hackernewsapi | wrong_base_url_path |
| magicthegatheringapi | wrong_base_url_path, missing_default_params |
| nasaexoplanetarchive | wrong_base_url_path, missing_default_params |
| networkcalc | wrong_base_url_path, missing_default_params |
| opengovernmentcanada | wrong_base_url_path, missing_default_params |
| opengovernmentireland | wrong_base_url_path, missing_default_params |
| opengovernmentswitzerland | wrong_base_url_path, missing_default_params |
| openlibrary | wrong_base_url_path |
| openscienceframework | wrong_base_url_path, missing_default_params |
| poetrydb | wrong_base_url_path |
| pokemontcg | wrong_base_url_path |
| postalpincode | wrong_base_url_path |
| purgomalum | redirect_https, missing_default_params |
| razorpayifsc | wrong_base_url_path |
| ronswansonquotes | wrong_base_url_path |
| tcgdex | wrong_base_url_path |
| transportforbelgium | wrong_base_url_path, missing_default_params |
| transportforberlingermany | wrong_base_url_path, missing_default_params |
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
| zippopotamus | wrong_base_url_path |
| arbetsfrmedlingenapi | missing_default_params |
| bluesky | missing_default_params |
| devtoapi | missing_default_params |
| huggingfacehubapi | missing_default_params |
| inaturalistapi | missing_default_params |

## Full results and sources

Per-hop redirects/retries, original baseline outcomes and bounded error-cause chains are in [the JSON evidence](callable-audit.json). No credentials or upstream response bodies are stored.

| API / canonical ID | Tested GET | HTTP | Cause / outcome | Free evidence | Latency ms | Result |
| --- | --- | ---: | --- | --- | ---: | --- |
| 0x / 0x | - | 301 | needs_key / reviewed_exclusion | unknown | 443 | discovery |
| 0x API / 0x | - | 301 | duplicate / duplicate | unknown | - | alias of 0x |
| 1Forge.com / 1forgecom | [GET](https://1forge.com/) | 200 | needs_key / reviewed_exclusion | unknown | 431 | discovery |
| 1inch / 1inch | - | 301 | needs_key / reviewed_exclusion | unknown | 326 | discovery |
| 24 Pull Requests / 24pullrequests | [GET](https://24pullrequests.com/api/) | 406 | unresolved / http_error | unknown | 745 | discovery |
| A-Frame / aframe | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| ABS Statistics / absstatistics | - | 0 | dead_upstream / network_error | unknown | 330 | discovery |
| adresse.data.gouv.fr / adressedatagouvfr | [GET](https://adresse.data.gouv.fr/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1083 | discovery |
| ADS-B Exchange / adsbexchange | - | 301 | redirect_https / redirect_not_approved | unknown | 854 | discovery |
| Advice Slip API / adviceslipapi | [GET](https://api.adviceslip.com/advice) | 200 | ok / ok_json | [free](https://api.adviceslip.com/) | 326 | callable |
| Age of Empires II / ageofempiresii | [GET](https://age-of-empires-2-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 658 | discovery |
| Agify / agify | [GET](https://agify.io/) | 406 | unresolved / http_error | unknown | 1166 | discovery |
| Agify.io / agify | [GET](https://agify.io/) | 406 | duplicate / duplicate | unknown | - | alias of agify |
| Airtel IP / airtelip | [GET](https://sys.airtel.lv/ip2country/1.1.1.1/?full=true) | 200 | unresolved / invalid_response | unknown | 222 | discovery |
| AllStar / allstar | [GET](https://openssf.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 290 | discovery |
| Altinn / altinn | - | 301 | redirect_https / redirect_not_approved | unknown | 190 | discovery |
| AmiiboAPI / amiiboapi | [GET](https://amiiboapi.com/api/amiibo?name=mario) | 404 | dead_upstream / http_error | [free](https://amiiboapi.com/docs/) | 762 | discovery |
| An API of Ice and Fire / anapioficeandfire | [GET](https://anapioficeandfire.com/api/books/1) | 200 | ok / ok_json | [free](https://anapioficeandfire.com/Documentation) | 280 | callable |
| AnimeNewsNetwork / animenewsnetwork | [GET](https://www.animenewsnetwork.com/encyclopedia/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1340 | discovery |
| Anki / anki | [GET](https://apps.ankiweb.net/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://apps.ankiweb.net) | 244 | discovery |
| Anki API / ankiapi | [GET](https://foosoft.net/projects/anki-connect/) | 404 | wrong_base_url_path / http_error | unknown | 322 | discovery |
| AnonFiles / anonfiles | - | 0 | dead_upstream / network_error | unknown | 41 | discovery |
| Anytype / anytype | [GET](https://anytype.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 605 | discovery |
| API Grátis / apigrtis | [GET](https://apigratis.com.br/) | 429 | rate_limit / rate_limited | unknown | 1038 | discovery |
| API Setu / apisetu | [GET](https://www.apisetu.gov.in/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1465 | discovery |
| ApicAgent / apicagent | [GET](https://www.apicagent.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 912 | discovery |
| apilayer screenshotlayer / apilayerscreenshotlayer | [GET](https://screenshotlayer.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 912 | discovery |
| APiX / apix | [GET](https://www.apix.cn/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1381 | discovery |
| Apoteket / apoteket | [GET](https://www.apoteket.se/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 490 | discovery |
| AppFlowy / appflowy | - | 301 | redirect_https / redirect_not_approved | unknown | 350 | discovery |
| Appium API / appiumapi | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| arcsecond.io / arcsecondio | [GET](https://api.arcsecond.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 289 | discovery |
| Argentina Open Data API / argentinaopendataapi-9c9e04f3-9c9e04f3-9c9e04f3 | [GET](https://datos.gob.ar/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://datos.gob.ar) | 1558 | discovery |
| arXiv / arxiv | - | 301 | redirect_https / redirect_not_approved | unknown | 110 | discovery |
| Atlantis / atlantis | - | 301 | redirect_https / redirect_not_approved | unknown | 621 | discovery |
| Atom / atom | - | 301 | redirect_https / redirect_not_approved | unknown | 674 | discovery |
| Australia Data API / australiadataapi-4658e2bd | [GET](https://data.gov.au/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gov.au) | 1735 | discovery |
| Australia Government API / australiagovernmentapi | [GET](https://data.gov.au/data/api/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 1690 | discovery |
| Australian Bureau of Statistics / australianbureauofstatistics | - | 301 | redirect_https / redirect_not_approved | unknown | 562 | discovery |
| Australian Open Data / australiadataapi-4658e2bd | [GET](https://data.gov.au/) | 200 | duplicate / duplicate | unknown | - | alias of australiadataapi |
| Auth.js / authjs | [GET](https://authjs.dev/getting-started/introduction/) | 404 | not_hosted_api / reviewed_exclusion | unknown | 1042 | discovery |
| Automerge / automerge | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Aviationstack / aviationstack | [GET](https://aviationstack.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 963 | discovery |
| AviationWeather / aviationweather | [GET](https://aviationweather.gov/api/data/metar?ids=KMCI&format=json) | 200 | ok / ok_json | [free](https://aviationweather.gov/data/api/) | 634 | callable |
| Axolotl / axolotl | [GET](https://theaxolotlapi.netlify.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 699 | discovery |
| Axolotl API / axolotl | [GET](https://theaxolotlapi.netlify.app/) | 200 | duplicate / duplicate | unknown | - | alias of axolotl |
| aztro / aztro | [GET](https://aztro.sameerkumar.website/) | 404 | wrong_base_url_path / http_error | unknown | 678 | discovery |
| Babylon.js / babylonjs | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Backstage / backstage | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Bacon Ipsum / baconipsum | [GET](https://baconipsum.com/api/?type=all-meat&sentences=1) | 200 | ok / ok_json | [free](https://baconipsum.com/json-api/) | 689 | callable |
| BaconMockup / baconmockup | [GET](https://baconmockup.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 519 | discovery |
| Banca d'Italia / bancaditalia | [GET](https://www.bancaditalia.it/statistiche/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 847 | discovery |
| Banco Central Brazil / bancocentralbrazil | [GET](https://dadosabertos.bcb.gov.br/) | 403 | unresolved / access_denied | unknown | 153 | discovery |
| Bandsintown / bandsintown | [GET](https://app.swaggerhub.com/apis/Bandsintown/PublicAPI/3.0.0/) | 404 | wrong_base_url_path / http_error | unknown | 576 | discovery |
| Bangladesh Open Data API / bangladeshopendataapi | [GET](https://data.gov.bd/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gov.bd) | 602 | discovery |
| Bank Negara Malaysia Open Data / banknegaramalaysiaopendata | [GET](https://apikijangportal.bnm.gov.my/) | 403 | unresolved / access_denied | unknown | 232 | discovery |
| Bank of Canada / bankofcanada | [GET](https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1) | 200 | ok / ok_json | [free](https://www.bankofcanada.ca/valet-api-how-to/) | 274 | callable |
| Bank of Canada Rates / bankofcanadarates | [GET](https://www.bankofcanada.ca/rates/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1097 | discovery |
| Bank of Israel / bankofisrael | [GET](https://www.boi.org.il/en/DataAndStatistics/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 392 | discovery |
| Bank of Russia / bankofrussia | [GET](https://www.cbr.ru/development/SXML/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 447 | discovery |
| Banque de France / banquedefrance | [GET](https://webstat.banque-france.fr/ws/) | 404 | wrong_base_url_path / http_error | unknown | 601 | discovery |
| Barcode Generator API / barcodegeneratorapi | [GET](https://bwipjs-api.metafloor.com/) | 200 | unresolved / invalid_response | [free](https://bwipjs-api.metafloor.com) | 528 | discovery |
| BayFiles / bayfiles | - | 0 | dead_upstream / network_error | unknown | 38 | discovery |
| BC Ferries / bcferries | [GET](https://www.bcferriesapi.ca/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 696 | discovery |
| Beeceptor / beeceptor | [GET](https://beeceptor.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 311 | discovery |
| Beeminder / beeminder | - | 301 | redirect_https / redirect_not_approved | unknown | 630 | discovery |
| Behance / behance | [GET](https://www.behance.net/dev/api/endpoints/) | 404 | gateway_block / body_limit | unknown | 1064 | discovery |
| Bhagavad Gita telugu / bhagavadgitatelugu | [GET](https://gita-api.vercel.app/) | 200 | unresolved / invalid_response | unknown | 348 | discovery |
| Bible / bible | [GET](https://bible-api.com/john+3:16) | 200 | ok / ok_json | [free](https://bible-api.com/) | 772 | callable |
| Bible API / bibleapi | [GET](https://bible-api.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 523 | discovery |
| Bible API 2 / bibleapi | [GET](https://bible-api.com/) | 200 | duplicate / duplicate | unknown | - | alias of bibleapi |
| Bible API Public / bibleapi | [GET](https://bible-api.com/) | 200 | duplicate / duplicate | unknown | - | alias of bibleapi |
| Bible JSON API / bibleapi | [GET](https://bible-api.com/) | 200 | duplicate / duplicate | unknown | - | alias of bibleapi |
| BigML / bigml | [GET](https://bigml.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 320 | discovery |
| Billogram / billogram | - | 308 | gateway_block / gateway_block | unknown | 251 | discovery |
| Binlist / binlist | [GET](https://binlist.net/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 236 | discovery |
| BioThings / biothings | [GET](https://biothings.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1263 | discovery |
| Biriyani As A Service / biriyaniasaservice | [GET](https://biriyani.anoram.com/) | 503 | dead_upstream / http_error | unknown | 1269 | discovery |
| BitcoinCharts / bitcoincharts | - | 0 | timeout / timeout | unknown | 343 | discovery |
| Bitcoincharts API / bitcoinchartsapi | - | 0 | timeout / timeout | unknown | 1248 | discovery |
| Block.io / blockio | - | 302 | redirect_https / redirect_not_approved | unknown | 236 | discovery |
| Blockchain Exchange Rates / blockchainexchangerates | - | 301 | redirect_https / redirect_not_approved | unknown | 297 | discovery |
| BNM Moldova Rates / bnmmoldovarates | [GET](https://bnm.md/en/content/official-exchange-rates/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1796 | discovery |
| Board Game Geek / boardgamegeek | [GET](https://boardgamegeek.com/wiki/page/BGG_XML_API2/) | 403 | unresolved / access_denied | unknown | 114 | discovery |
| Bob's Burgers / bobsburgers | [GET](https://bobs-burgers-api-ui.herokuapp.com/) | 503 | dead_upstream / http_error | unknown | 1132 | discovery |
| Bokio / bokio | [GET](https://www.bokio.se/integrations/) | 404 | wrong_base_url_path / http_error | unknown | 540 | discovery |
| BOM Australia Weather / bomapi | [GET](https://www.bom.gov.au/catalogue/data-feeds.shtml/) | 403 | duplicate / duplicate | unknown | - | alias of bomapi |
| Bored / bored | - | 0 | dead_upstream / network_error | unknown | 32 | discovery |
| BoredAPI / bored | - | 0 | duplicate / duplicate | unknown | - | alias of bored |
| Brackets / brackets | [GET](https://brackets.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 218 | discovery |
| Brazil / brazil | [GET](https://brasilapi.com.br/api/feriados/v1/2026) | 200 | ok / ok_json | [free](https://brasilapi.com.br/docs) | 304 | callable |
| Brazil Central Bank Open Data / bancocentralbrazil | [GET](https://dadosabertos.bcb.gov.br/) | 403 | duplicate / duplicate | unknown | - | alias of bancocentralbrazil |
| Brazil Data API / brazildataapi | [GET](https://dados.gov.br/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 789 | discovery |
| Brazil Open Data API / brazildataapi | [GET](https://dados.gov.br/) | 200 | duplicate / duplicate | [free](https://dados.gov.br) | - | alias of brazildataapi |
| Brazil Receita WS / brazilreceitaws | [GET](https://www.receitaws.com.br/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 230 | discovery |
| Brønnøysundregistrene / brnnysundregistrene | [GET](https://data.brreg.no/enhetsregisteret/api/organisasjonsformer) | 200 | ok / ok_json | [free](https://data.brreg.no/enhetsregisteret/api/docs/index.html) | 490 | callable |
| Brreg / brnnysundregistrene | [GET](https://data.brreg.no/enhetsregisteret/api/organisasjonsformer) | 200 | duplicate / duplicate | [free](https://www.brreg.no/en/use-of-data-from-the-bronnoysund-register-centre/) | - | alias of brnnysundregistrene |
| Buddy CI / buddyci | [GET](https://buddy.works/api/reference/getting-started/overview/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2179 | discovery |
| Bugsnax / bugsnax | - | 0 | dead_upstream / network_error | unknown | 37 | discovery |
| Bugzilla / bugzilla | [GET](https://wiki.mozilla.org/Bugzilla:REST_API/) | 404 | wrong_base_url_path / http_error | unknown | 569 | discovery |
| Bundesbank API / bundesbankapi | [GET](https://www.bundesbank.de/dynamic/action/de/statistiken/zeitreihen-datenbanken/) | 404 | wrong_base_url_path / http_error | unknown | 337 | discovery |
| Callook.info / callookinfo | [GET](https://callook.info/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 499 | discovery |
| CamScanner / camscanner | [GET](https://dev.camscanner.com/?language=en-us) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1872 | discovery |
| Canada Government API / canadagovernmentapi | - | 301 | redirect_https / redirect_not_approved | unknown | 1129 | discovery |
| Canada Open Data API / canadaopendataapi | [GET](https://open.canada.ca/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://open.canada.ca) | 2238 | discovery |
| Canadian Open Data / canadaopendataapi | [GET](https://open.canada.ca/) | 200 | duplicate / duplicate | unknown | - | alias of canadaopendataapi |
| CapRover / caprover | [GET](https://caprover.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 111 | discovery |
| Carbon API / carbonapi | [GET](https://carbon.now.sh/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://carbon.now.sh) | 200 | discovery |
| Cat as a Service / catasaservice | [GET](https://cataas.com/api/tags?limit=1) | 200 | ok / ok_json | [free](https://cataas.com/) | 701 | callable |
| Cat Facts API / catfactsapi | [GET](https://catfact.ninja/fact) | 200 | ok / ok_json | [free](https://catfact.ninja/) | 367 | callable |
| Cataas / cataas | [GET](https://cataas.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1204 | discovery |
| Catastro Spain / catastrospain | - | 0 | dead_upstream / network_error | unknown | 46 | discovery |
| Catboy / catboy | - | 0 | redirect_https / tls_error | [free](https://catboys.com/api) | 304 | discovery |
| Catboy API / catboyapi | [GET](https://catboys.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 531 | discovery |
| CBE Egypt / cbeegypt | [GET](https://www.cbe.org.eg/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 370 | discovery |
| CBK Kenya / cbkkenya | [GET](https://www.centralbank.go.ke/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 288 | discovery |
| CBN Nigeria / cbnnigeria | [GET](https://www.cbn.gov.ng/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 183 | discovery |
| CBN Nigeria Rates / cbnnigeriarates | [GET](https://www.cbn.gov.ng/rates/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1147 | discovery |
| CBR Russia / cbrrussia | [GET](https://cbr.ru/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 519 | discovery |
| CBR Russia API / cbrrussiaapi | [GET](https://www.cbr.ru/development/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 221 | discovery |
| CBS Netherlands / cbsnetherlands | [GET](https://opendata.cbs.nl/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 335 | discovery |
| CBUAE UAE / cbuaeuae | - | 301 | redirect_https / redirect_not_approved | unknown | 261 | discovery |
| CDNJS / cdnjs | [GET](https://api.cdnjs.com/libraries/jquery?fields=name,version) | 200 | ok / ok_json | [free](https://cdnjs.com/api) | 213 | callable |
| Central Bank Ireland Data / centralbankirelanddata | [GET](https://data.gov.ie/data/search/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1619 | discovery |
| Chainlink / chainlink | - | 301 | redirect_https / redirect_not_approved | unknown | 1237 | discovery |
| Chainpoint / chainpoint | [GET](https://tierion.com/chainpoint/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 749 | discovery |
| Changelogs.md / changelogsmd | - | 301 | redirect_https / redirect_not_approved | unknown | 965 | discovery |
| CheapShark / cheapshark | [GET](https://www.cheapshark.com/api/1.0/stores) | 200 | ok / ok_json | [free](https://apidocs.cheapshark.com/) | 216 | callable |
| ChEBI / chebi | - | 301 | redirect_https / redirect_not_approved | unknown | 456 | discovery |
| Chess.com / chesscom | [GET](https://api.chess.com/pub/player/hikaru) | 200 | ok / ok_json | [free](https://www.chess.com/news/view/published-data-api) | 464 | callable |
| Chess.com API / chesscomapi | [GET](https://www.chess.com/news/view/published-data-api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2106 | discovery |
| Chicago Data Portal API / chicagodataportalapi | [GET](https://data.cityofchicago.org/) | 406 | unresolved / http_error | unknown | 994 | discovery |
| Chile Open Data API / chileopendataapi | [GET](https://datos.gob.cl/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://datos.gob.cl) | 1576 | discovery |
| Chinese Text Project / chinesetextproject | [GET](https://ctext.org/tools/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 476 | discovery |
| chucknorris.io / chucknorrisio | [GET](https://api.chucknorris.io/jokes/random) | 200 | ok / ok_json | [free](https://api.chucknorris.io/) | 317 | callable |
| City Bikes / citybikes-121fa4c9 | [GET](https://api.citybik.es/v2/networks?fields=id,name) | 200 | ok / ok_json | [free](https://api.citybik.es/v2/) | 630 | callable |
| City, Berlin / cityberlin | [GET](https://daten.berlin.de/) | 403 | unresolved / access_denied | unknown | 257 | discovery |
| City, Gdańsk / citygdask | [GET](https://ckan.multimediagdansk.pl/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.multimediagdansk.pl/about) | 411 | callable |
| City, Helsinki / cityhelsinki | [GET](https://hri.fi/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://hri.fi/en_gb/terms-and-conditions/) | 544 | callable |
| City, Lviv / citylviv | [GET](https://opendata.city-adm.lviv.ua/) | 403 | unresolved / access_denied | unknown | 246 | discovery |
| City, New York Open Data / citynewyorkopendata | - | 301 | redirect_https / redirect_not_approved | unknown | 633 | discovery |
| City, Toronto Open Data / citytorontoopendata | [GET](https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://open.toronto.ca/open-data-licence/) | 314 | callable |
| Classify / classify | [GET](https://classify-web.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 545 | discovery |
| ClinicalTrials.gov / clinicaltrialsgov | [GET](https://clinicaltrials.gov/api/v2/studies?pageSize=1&format=json) | 200 | ok / ok_json | [free](https://clinicaltrials.gov/data-api/api) | 344 | callable |
| CNMV Spain / cnmvspain | - | 302 | redirect_https / redirect_not_approved | unknown | 739 | discovery |
| CocktailDB API / cocktaildbapi | [GET](https://www.thecocktaildb.com/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 245 | discovery |
| CocoaPods / cocoapods | [GET](https://cocoapods.org/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://cocoapods.org) | 118 | discovery |
| Codeberg / codeberg | [GET](https://codeberg.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 314 | discovery |
| Codeium / codeium | - | 301 | redirect_https / redirect_not_approved | unknown | 207 | discovery |
| Codewars API / codewarsapi | [GET](https://www.codewars.com/api/v1/code-challenges/valid-braces) | 200 | ok / ok_json | [free](https://dev.codewars.com/) | 338 | callable |
| Coding / coding | - | 302 | redirect_https / redirect_not_approved | unknown | 1568 | discovery |
| Coffee / coffee | [GET](https://coffee.alexflipnote.dev/random.json) | 200 | ok / ok_json | [free](https://coffee.alexflipnote.dev/) | 521 | callable |
| Coffee API / coffeeapi | [GET](https://coffee.alexflipnote.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1455 | discovery |
| CoinDesk / coindesk | - | 0 | dead_upstream / network_error | unknown | 71 | discovery |
| CoinDesk API / coindesk | - | 0 | duplicate / duplicate | unknown | - | alias of coindesk |
| Coinlore / coinlore | [GET](https://api.coinlore.net/api/global/) | 200 | ok / ok_json | [free](https://www.coinlore.com/cryptocurrency-data-api) | 207 | callable |
| Coinlore API / coinloreapi | - | 301 | redirect_https / redirect_not_approved | unknown | 313 | discovery |
| Coinpaprika / coinpaprika | - | 302 | gateway_block / gateway_block | unknown | 212 | discovery |
| CoinPaprika API / coinpaprika | - | 302 | duplicate / duplicate | unknown | - | alias of coinpaprika |
| CollegeScoreCard / collegescorecard | [GET](https://collegescorecard.ed.gov/data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 200 | discovery |
| CollegeScoreCard.ed.gov / collegescorecard | [GET](https://collegescorecard.ed.gov/data/) | 200 | duplicate / duplicate | unknown | - | alias of collegescorecard |
| Colombia Open Data API / colombiaopendataapi | [GET](https://www.datos.gov.co/) | 406 | unresolved / http_error | [free](https://www.datos.gov.co) | 772 | discovery |
| Color API / colorapi | [GET](https://www.thecolorapi.com/id?hex=0047AB) | 200 | ok / ok_json | [free](https://www.thecolorapi.com/docs) | 627 | callable |
| Colorado Information Marketplace / coloradoinformationmarketplace | [GET](https://data.colorado.gov/) | 406 | unresolved / http_error | unknown | 916 | discovery |
| Coronavirus / coronavirus | [GET](https://pipedream.com/@pravin/http-api-for-latest-wuhan-coronavirus-data-2019-ncov-p_G6CLVM/readme/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 519 | discovery |
| Corporate BS / corporatebs | [GET](https://corporatebs-generator.sameerkumar.website/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 518 | discovery |
| Cosign / cosign | - | 301 | redirect_https / redirect_not_approved | unknown | 365 | discovery |
| CountAPI / countapi | - | 0 | dead_upstream / network_error | unknown | 389 | discovery |
| Countly / countly | [GET](https://api.count.ly/reference/) | 404 | wrong_base_url_path / http_error | unknown | 317 | discovery |
| Countries GraphQL / countriesgraphql | [GET](https://countries.trevorblades.com/?query=%7Bcountry(code%3A%22SE%22)%7Bname%7D%7D) | 200 | ok / ok_json | [free](https://github.com/trevorblades/countries) | 190 | callable |
| Country Flags API / countryflagsapi | [GET](https://flagcdn.com/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://flagcdn.com) | 202 | discovery |
| Country.is / countryis | [GET](https://api.country.is/8.8.8.8) | 200 | ok / ok_json | [free](https://country.is/) | 183 | callable |
| Covid Tracking Project / covidtrackingproject | [GET](https://covidtracking.com/data/api/version-2/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 337 | discovery |
| Covid-19 Datenhub / covid19datenhub | [GET](https://npgeo-corona-npgeo-de.hub.arcgis.com/) | 404 | wrong_base_url_path / http_error | unknown | 519 | discovery |
| Covid-19 Government Response / covid19governmentresponse | - | 301 | redirect_https / redirect_not_approved | unknown | 1148 | discovery |
| Covid-19 India / covid19india | [GET](https://data.covid19india.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 606 | discovery |
| Covid-19 JHU CSSE / covid19jhucsse | [GET](https://nuttaphat.com/covid19-api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 510 | discovery |
| COVID-19 Tracker Canada / covid19trackercanada | [GET](https://api.covid19tracker.ca/docs/1.0/overview/) | 200 | unresolved / invalid_response | unknown | 975 | discovery |
| COVID-19 Tracker Sri Lanka / covid19trackersrilanka | - | 0 | redirect_https / tls_error | unknown | 1161 | discovery |
| COVID-ID / covidid | - | 0 | timeout / timeout | unknown | 10340 | discovery |
| Crafatar / crafatar | [GET](https://crafatar.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1050 | discovery |
| Creatomate / creatomate | [GET](https://creatomate.com/docs/api/introduction/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2966 | discovery |
| CrossRef / crossref | [GET](https://api.crossref.org/works?rows=1) | 200 | ok / ok_json | [free](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) | 1040 | callable |
| CryptingUp / cryptingup | - | 0 | unresolved / network_error | unknown | 740 | discovery |
| CryptoCompare / cryptocompare | - | 301 | redirect_https / redirect_not_approved | unknown | 214 | discovery |
| Cryptonator / cryptonator | - | 0 | dead_upstream / network_error | unknown | 281 | discovery |
| Cryptonator API / cryptonator | - | 0 | duplicate / duplicate | unknown | - | alias of cryptonator |
| CurrencyScoop.com / currencyscoopcom | - | 301 | redirect_https / redirect_not_approved | unknown | 205 | discovery |
| Cursor / cursor | - | 308 | redirect_https / redirect_not_approved | freemium | 197 | discovery |
| Curve / curve | - | 301 | redirect_https / redirect_not_approved | unknown | 212 | discovery |
| CVR / cvr | [GET](https://datacvr.virk.dk/) | 403 | unresolved / access_denied | unknown | 235 | discovery |
| CVR API / cvr | [GET](https://datacvr.virk.dk/) | 403 | duplicate / duplicate | [free](https://datacvr.virk.dk) | - | alias of cvr |
| Czech Namedays / czechnamedays | [GET](https://svatky.adresa.info/) | 402 | unresolved / http_error | unknown | 342 | discovery |
| Czech Namedays Calendar / czechnamedays | [GET](https://svatky.adresa.info/) | 402 | duplicate / duplicate | unknown | - | alias of czechnamedays |
| Czech National Bank / czechnationalbank | [GET](https://www.cnb.cz/cs/financni_trhy/devizovy_trh/kurzy_devizoveho_trhu/denni_kurz.xml/) | 200 | unresolved / invalid_response | unknown | 300 | discovery |
| Danbooru / danbooru | [GET](https://danbooru.donmai.us/posts?tags=help%3Aapi) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 231 | discovery |
| Danish data service Energi / danishdataserviceenergi | [GET](https://api.energidataservice.dk/dataset/CO2Emis?start=now-PT15M&limit=1) | 200 | ok / ok_json | [free](https://www.energidataservice.dk/guides/api-guides) | 342 | callable |
| Danish Energi Data / danishenergidata | [GET](https://www.energidataservice.dk/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 470 | discovery |
| Data USA / datausa | [GET](https://api.datausa.io/tesseract/data.jsonrecords?cube=acs_yg_total_population_5&drilldowns=State,Year&measures=Population&include=Year:2023&limit=1,0) | 200 | ok / ok_json | [free](https://datausa.io/about/api/) | 271 | callable |
| data.gov.dk / datagovdk | [GET](https://data.gov.dk/api/) | 404 | wrong_base_url_path / http_error | unknown | 342 | discovery |
| Data.gov.sg / datagovsg | - | 302 | redirect_https / redirect_not_approved | unknown | 1187 | discovery |
| data.norge.no / datanorgeno | - | 301 | redirect_https / redirect_not_approved | unknown | 257 | discovery |
| Data.parliament.uk / ukparliamentapi | [GET](https://members-api.parliament.uk/api/Members/Search?skip=0&take=1) | 200 | duplicate / duplicate | [free](https://www.parliament.uk/site-information/copyright-parliament/open-parliament-licence/) | - | alias of ukparliamentapi |
| Dataflow Kit COVID-19 / dataflowkitcovid19 | [GET](https://covid-19.dataflowkit.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 415 | discovery |
| Datamuse / datamuse | [GET](https://api.datamuse.com/words?ml=star&max=1) | 200 | ok / ok_json | [free](https://www.datamuse.com/api/) | 124 | callable |
| Datamuse API / datamuseapi | [GET](https://www.datamuse.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 452 | discovery |
| Datayes / datayes | [GET](https://m.datayes.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1255 | discovery |
| Deck of Cards API / deckofcardsapi | [GET](https://deckofcardsapi.com/api/deck/new/draw/?count=1) | 200 | ok / ok_json | [free](https://deckofcardsapi.com/) | 323 | callable |
| Deepcode / deepcode | - | 301 | redirect_https / redirect_not_approved | unknown | 779 | discovery |
| DeFiLlama API / defillamaapi | - | 308 | redirect_https / redirect_not_approved | [free](https://defillama.com/docs/api) | 1182 | discovery |
| Dendron / dendron | [GET](https://dendron.so/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 189 | discovery |
| Destatis API / destatisapi | - | 307 | redirect_https / redirect_not_approved | unknown | 587 | discovery |
| Destatis Germany / destatisgermany | - | 302 | redirect_https / redirect_not_approved | unknown | 308 | discovery |
| Detect Language API / detectlanguageapi | [GET](https://rapidapi.com/BigLobster/api/language-identification-prediction/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1283 | discovery |
| DevITjobs UK / devitjobsuk | [GET](https://devitjobs.uk/job_feed.xml/) | 200 | gateway_block / body_limit | unknown | 1079 | discovery |
| Devpod / devpod | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| DIBS / dibs | - | 0 | dead_upstream / network_error | unknown | 53 | discovery |
| Dicebear Avatars / dicebearavatars | - | 301 | redirect_https / redirect_not_approved | unknown | 87 | discovery |
| DigiDates / digidates | [GET](https://digidates.de/en/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 290 | discovery |
| DigiDates API / digidates | [GET](https://digidates.de/en/) | 200 | duplicate / duplicate | [free](https://digidates.de/en) | - | alias of digidates |
| Digimon Information / digimoninformation | [GET](https://digimon-api.vercel.app/api/digimon/name/agumon) | 200 | ok / ok_json | [free](https://digimon-api.vercel.app/) | 364 | callable |
| DigitalOcean Spaces / digitaloceanspaces | [GET](https://www.digitalocean.com/products/spaces/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1117 | discovery |
| DigitalOcean Status / digitaloceanstatus | [GET](https://status.digitalocean.com/api/) | 406 | unresolved / http_error | unknown | 745 | discovery |
| Digitraffic Finland / digitrafficfinland | [GET](https://www.digitraffic.fi/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 335 | discovery |
| Diigo / diigo | [GET](https://www.diigo.com/api_dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 945 | discovery |
| Dingtalk / dingtalk | - | 302 | redirect_https / redirect_not_approved | unknown | 802 | discovery |
| Disify / disify | [GET](https://disify.com/api/email/example@example.com) | 200 | ok / ok_json | [free](https://disify.com/) | 438 | callable |
| Disney / disney | [GET](https://api.disneyapi.dev/character?pageSize=1) | 200 | ok / ok_json | [free](https://disneyapi.dev/docs/) | 262 | callable |
| Disney API / disneyapi | [GET](https://disneyapi.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 329 | discovery |
| DMI / dmi | [GET](https://www.dmi.dk/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 132 | discovery |
| Dog CEO / dogceo | [GET](https://dog.ceo/api/breeds/image/random) | 200 | ok / ok_json | [free](https://dog.ceo/dog-api/) | 201 | callable |
| Dogs / dogs | [GET](https://dog.ceo/dog-api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 971 | discovery |
| Dogs API / dogs | [GET](https://dog.ceo/dog-api/) | 200 | duplicate / duplicate | unknown | - | alias of dogs |
| Dokku / dokku | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| DomainDb Info / domaindbinfo | [GET](https://api.domainsdb.info/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 325 | discovery |
| Domainsdb.info / domainsdbinfo | [GET](https://domainsdb.info/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 257 | discovery |
| Domoticz / domoticz | [GET](https://domoticz.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 239 | discovery |
| Driver.js / driverjs | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Drivet URL Shortener / driveturlshortener | [GET](https://wiki.drivet.xyz/en/url-shortener/add-links/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 340 | discovery |
| Drizzle ORM / drizzleorm | [GET](https://orm.drizzle.team/docs/overview/) | 200 | not_hosted_api / reviewed_exclusion | unknown | 1187 | discovery |
| DropMail / dropmail | [GET](https://dropmail.me/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 477 | discovery |
| Drupal.org / drupalorg | [GET](https://www.drupal.org/drupalorg/docs/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2804 | discovery |
| DSB Statistics Denmark / dsbstatisticsdenmark | [GET](https://api.statbank.dk/v1/subjects?lang=en&format=JSON) | 200 | ok / ok_json | [free](https://api.statbank.dk/console) | 250 | callable |
| DuckDuckGo / duckduckgo | [GET](https://duckduckgo.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1125 | discovery |
| Ducks Unlimited / ducksunlimited | [GET](https://gis.ducks.org/datasets/du-university-chapters/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 945 | discovery |
| Dungeons and Dragons (Alternate) / dungeonsanddragonsalternate | [GET](https://api.open5e.com/v2/creatures/?limit=1&fields=key,name) | 200 | ok / ok_json | [free](https://open5e.com/api-docs) | 207 | callable |
| Duolingo API / duolingoapi | [GET](https://www.duolingo.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 305 | discovery |
| Dutch CBS API / dutchcbsapi | [GET](https://www.cbs.nl/en-gb/our-services/open-data/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.cbs.nl/en-gb/our-services/open-data) | 331 | discovery |
| DVC / dvc | [GET](https://dvc.org/) | 200 | not_hosted_api / reviewed_exclusion | [free](https://dvc.org) | 2038 | discovery |
| Dynamic QR Code / dynamicqrcode | [GET](https://rapidapi.com/updeploy-tools/api/qr-code-dynamic-and-static1/details/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1277 | discovery |
| ECB API / ecbapi | [GET](https://data.ecb.europa.eu/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.ecb.europa.eu) | 899 | discovery |
| ECB Exchange Rates / ecbexchangerates | [GET](https://www.ecb.europa.eu/stats/eurofxref/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.ecb.europa.eu/stats/eurofxref) | 1113 | discovery |
| Econdb / econdb | [GET](https://www.econdb.com/api/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 317 | discovery |
| Ecuador Open Data API / ecuadoropendataapi | [GET](https://datosabiertos.gob.ec/) | 403 | unresolved / access_denied | [free](https://datosabiertos.gob.ec) | 1248 | discovery |
| Egypt Open Data API / egyptopendataapi | - | 0 | dead_upstream / network_error | [free](https://data.gov.eg) | 733 | discovery |
| EnergyStar / energystar | - | 301 | redirect_https / redirect_not_approved | unknown | 1193 | discovery |
| English Random Words / englishrandomwords | [GET](https://random-words-api.vercel.app/word/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 1203 | discovery |
| Ensembl / ensembl | - | 0 | timeout / timeout | [free](https://rest.ensembl.org/) | 20006 | discovery |
| Ensembl API / ensemblapi | - | 0 | timeout / timeout | unknown | 20001 | discovery |
| Entur / entur | [GET](https://api.entur.io/) | 404 | wrong_base_url_path / http_error | unknown | 418 | discovery |
| Environment Agency / environmentagency | [GET](https://environment.data.gov.uk/flood-monitoring/id/stations?_limit=1) | 200 | ok / ok_json | [free](https://environment.data.gov.uk/flood-monitoring/doc/reference) | 347 | callable |
| Environment Canada API / environmentcanadaapi | [GET](https://dd.weather.gc.ca/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://dd.weather.gc.ca) | 847 | discovery |
| EPA API / epaapi | [GET](https://www.epa.gov/enviro/web-services/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.epa.gov/enviro/web-services) | 1916 | discovery |
| Ergast F1 API / ergastf1 | [GET](https://ergast.com/mrd/) | 200 | duplicate / duplicate | [free](https://ergast.com/mrd) | - | alias of ergastf1 |
| ESPN / espn | [GET](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b/) | 404 | wrong_base_url_path / http_error | [free](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b) | 315 | discovery |
| Ethiopia Open Data API / ethiopiaopendataapi | - | 0 | dead_upstream / network_error | [free](https://data.gov.et) | 197 | discovery |
| EU Data Portal API / eudataportalapi | [GET](https://data.europa.eu/api/hub/repo/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 201 | discovery |
| EU Open Data / euopendata | [GET](https://data.europa.eu/en/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 4013 | discovery |
| EU Open Data Portal / euopendata | [GET](https://data.europa.eu/en/) | 200 | duplicate / duplicate | [free](https://data.europa.eu/en) | - | alias of euopendata |
| EU Open Data Portal API / euopendataportalapi | [GET](https://data.europa.eu/en/publications/dataeuropa-academy/) | 404 | wrong_base_url_path / http_error | [free](https://data.europa.eu/en/publications/dataeuropa-academy) | 2647 | discovery |
| Euromap 77 / euromap77 | [GET](https://www.euromap.org/euromap77/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 284 | discovery |
| European Space Agency API / europeanspaceagencyapi | - | 0 | dead_upstream / network_error | [free](https://api.esa.int) | 149 | discovery |
| European Union / europeanunion | [GET](https://data.europa.eu/api/) | 404 | wrong_base_url_path / http_error | unknown | 2629 | discovery |
| Eurostat API / eurostatapi | [GET](https://ec.europa.eu/eurostat/web/main/data/web-services/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://ec.europa.eu/eurostat/web/main/data/web-services) | 418 | discovery |
| EVA / eva | - | 0 | dead_upstream / network_error | unknown | 109 | discovery |
| EVA Email Validation / eva | - | 0 | duplicate / duplicate | unknown | - | alias of eva |
| Evil Insult Generator / evilinsultgenerator | [GET](https://evilinsult.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 327 | discovery |
| Exchangerate.host / exchangeratehost | [GET](https://exchangerate.host/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 829 | discovery |
| Excuser / excuser | [GET](https://excuser.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 519 | discovery |
| Excuser API / excuser | [GET](https://excuser.herokuapp.com/) | 404 | duplicate / duplicate | unknown | - | alias of excuser |
| F1 Data / f1data | - | 301 | redirect_https / redirect_not_approved | unknown | 325 | discovery |
| Fabric (Firebase) / fabricfirebase | [GET](https://firebase.google.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1065 | discovery |
| Faker / faker | [GET](https://fakerapi.it/) | 502 | dead_upstream / http_error | unknown | 2115 | discovery |
| Faker API / fakerapi-e867d1cb | [GET](https://fakerapi.it/api/v2/persons?_quantity=1) | 502 | dead_upstream / http_error | [free](https://fakerapi.it/en) | 3091 | discovery |
| FakeStoreAPI / fakestoreapi | [GET](https://fakestoreapi.com/products?limit=1) | 200 | ok / ok_json | [free](https://fakestoreapi.com/docs) | 208 | callable |
| Falco / falco | [GET](https://falco.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 394 | discovery |
| FAO / fao | - | 301 | redirect_https / redirect_not_approved | unknown | 193 | discovery |
| FAO API / faoapi | [GET](https://www.fao.org/faostat/en/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.fao.org/faostat/en) | 294 | discovery |
| FASS / fass | - | 301 | redirect_https / redirect_not_approved | unknown | 105 | discovery |
| FBI Wanted / fbiwanted | [GET](https://api.fbi.gov/wanted/v1/list?pageSize=1) | 200 | ok / ok_json | [free](https://www.fbi.gov/wanted/api) | 203 | callable |
| FDA / fda-e876707f | [GET](https://api.fda.gov/food/enforcement.json?limit=1) | 200 | ok / ok_json | [free](https://open.fda.gov/apis/authentication/) | 1173 | callable |
| FDA API / fdaapi | [GET](https://open.fda.gov/apis/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://open.fda.gov/apis) | 387 | discovery |
| FDA Drug API / fdadrugapi | [GET](https://open.fda.gov/apis/drug/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1108 | discovery |
| FDA Food / fdafood | [GET](https://api.fda.gov/) | 404 | wrong_base_url_path / http_error | unknown | 1554 | discovery |
| Fed Treasury / fedtreasury | [GET](https://fiscaldata.treasury.gov/api-documentation/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1036 | discovery |
| Federal Register / federalregister | [GET](https://www.federalregister.gov/api/v1/documents.json?per_page=1) | 200 | ok / ok_json | [free](https://www.federalregister.gov/developers/documentation/api/v1) | 643 | callable |
| Feodo Tracker API / feodotrackerapi | [GET](https://feodotracker.abuse.ch/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://feodotracker.abuse.ch) | 243 | discovery |
| FFXIV Collect / ffxivcollect | [GET](https://ffxivcollect.com/api/mounts/186) | 200 | ok / ok_json | [free](https://ffxivcollect.com/) | 332 | callable |
| FIFA Ultimate Team / fifaultimateteam | [GET](https://www.easports.com/fifa/ultimate-team/api/fut/item/) | 503 | dead_upstream / http_error | unknown | 1189 | discovery |
| FIFA Women's World Cup / fifawomensworldcup | - | 0 | dead_upstream / network_error | unknown | 163 | discovery |
| FIFA World Cup / fifawomensworldcup | - | 0 | duplicate / duplicate | unknown | - | alias of fifawomensworldcup |
| File.io / fileio | [GET](https://www.file.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 266 | discovery |
| FilterLists / filterlists | [GET](https://filterlists.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 323 | discovery |
| Final Fantasy XIV / finalfantasyxiv | - | 302 | redirect_https / redirect_not_approved | unknown | 193 | discovery |
| Finnish Meteorological Institute / finnishmeteorologicalinstitute | [GET](https://en.ilmatieteenlaitos.fi/open-data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 971 | discovery |
| Fixer / fixer | [GET](https://fixer.io/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 695 | discovery |
| Fleep / fleep | [GET](https://fleep.io/fleepapi/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 383 | discovery |
| Focalboard / focalboard | [GET](https://focalboard.com/) | 530 | dead_upstream / http_error | unknown | 1062 | discovery |
| Football (Soccer) Videos / footballsoccervideos | [GET](https://www.scorebat.com/video-api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 443 | discovery |
| Forgejo / forgejo | [GET](https://forgejo.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 309 | discovery |
| France Data API / francedataapi | [GET](https://www.data.gouv.fr/en/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1378 | discovery |
| Frankfurter / frankfurter | [GET](https://api.frankfurter.dev/v1/latest) | 200 | ok / ok_json | [free](https://frankfurter.dev/) | 108 | callable |
| Frankfurter API / frankfurter | [GET](https://api.frankfurter.dev/v1/latest) | 200 | duplicate / duplicate | unknown | - | alias of frankfurter |
| Free Dictionary / freedictionary | [GET](https://api.dictionaryapi.dev/api/v2/entries/en/hello) | 200 | ok / ok_json | [free](https://dictionaryapi.dev/) | 160 | callable |
| Free Dictionary API / freedictionaryapi | [GET](https://dictionaryapi.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 442 | discovery |
| freeCodeCamp / freecodecamp | [GET](https://www.freecodecamp.org/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.freecodecamp.org) | 580 | discovery |
| freeCodeCamp API / freecodecampapi | [GET](https://www.freecodecamp.org/news/the-freecodecamp-api/) | 404 | wrong_base_url_path / http_error | unknown | 1023 | discovery |
| FreeForexAPI / freeforexapi | [GET](https://freeforexapi.com/Home/Api/) | 522 | dead_upstream / http_error | unknown | 19886 | discovery |
| FreeToGame / freetogame | [GET](https://www.freetogame.com/api/game?id=452) | 200 | ok / ok_json | [free](https://www.freetogame.com/api-doc) | 105 | callable |
| French Address Search / frenchaddresssearch | [GET](https://geo.api.gouv.fr/adresse/) | 404 | wrong_base_url_path / http_error | unknown | 768 | discovery |
| French INSEE API / frenchinseeapi | - | 0 | unresolved / network_error | [free](https://api.insee.fr) | 429 | discovery |
| Fruityvice / fruityvice | [GET](https://www.fruityvice.com/api/fruit/apple) | 200 | ok / ok_json | [free](https://www.fruityvice.com/) | 469 | callable |
| Fuck Off as a Service / foaas | [GET](https://www.foaas.com/) | 200 | duplicate / duplicate | unknown | - | alias of foaas |
| FuelEconomy.gov / fueleconomygov | [GET](https://www.fueleconomy.gov/ws/rest/vehicle/31873) | 200 | ok / ok_json | [free](https://www.fueleconomy.gov/feg/ws/) | 907 | callable |
| Fun Fact / funfact | [GET](https://api.aakhilv.me/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 306 | discovery |
| Fun Fact API / funfact | [GET](https://api.aakhilv.me/) | 200 | duplicate / duplicate | unknown | - | alias of funfact |
| Fun Facts / funfacts | [GET](https://asli-fun-fact-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 718 | discovery |
| FunTranslations / funtranslations | [GET](https://api.funtranslations.com/) | 403 | unresolved / access_denied | unknown | 280 | discovery |
| Game of Thrones Quotes / gameofthronesquotes | [GET](https://api.gameofthronesquotes.xyz/v1/random) | 429 | rate_limit / rate_limited | [free](https://gameofthronesquotes.xyz/) | 1242 | discovery |
| GamerPower / gamerpower | [GET](https://www.gamerpower.com/api/giveaways?platform=steam) | 200 | ok / ok_json | [free](https://www.gamerpower.com/api-read) | 387 | callable |
| GBIF / gbif | [GET](https://api.gbif.org/v1/species/match?name=Puma%20concolor) | 200 | ok / ok_json | [free](https://www.gbif.org/developer/summary) | 350 | callable |
| GBIF API / gbifapi | [GET](https://www.gbif.org/developer/summary/) | 403 | unresolved / access_denied | unknown | 195 | discovery |
| GDBrowser / gdbrowser | [GET](https://gdbrowser.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 298 | discovery |
| GDPR API / gdprapi | [GET](https://gdpr-info.eu/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 341 | discovery |
| Genderize / genderize | [GET](https://genderize.io/) | 406 | unresolved / http_error | unknown | 657 | discovery |
| Genderize.io / genderize | [GET](https://genderize.io/) | 406 | duplicate / duplicate | unknown | - | alias of genderize |
| Genrenator / genrenator | [GET](https://binaryjazz.us/wp-json/genrenator/v1/genre/) | 200 | ok / ok_json | [free](https://binaryjazz.us/genrenator-api/) | 912 | callable |
| Genshin Impact / genshinimpact | [GET](https://genshin.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 213 | discovery |
| Genshin Impact API / genshinimpact | [GET](https://genshin.dev/) | 200 | duplicate / duplicate | unknown | - | alias of genshinimpact |
| Geocode.xyz / geocodexyz | [GET](https://geocode.xyz/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1161 | discovery |
| Geodata.gov.gr / geodatagovgr | - | 0 | timeout / timeout | unknown | 365 | discovery |
| GeographQL / geographql | [GET](https://geographql.netlify.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 634 | discovery |
| GeoJS / geojs | [GET](https://get.geojs.io/v1/ip/geo/8.8.8.8.json) | 200 | ok / ok_json | [free](https://www.geojs.io/docs/v1/endpoints/ip/) | 192 | callable |
| Geokeo / geokeo | [GET](https://geokeo.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 732 | discovery |
| geoPlugin / geoplugin | [GET](https://www.geoplugin.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 782 | discovery |
| Germany Data API / germanydataapi | [GET](https://www.govdata.de/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 539 | discovery |
| Ghana Open Data API / ghanaopendataapi | - | 0 | dead_upstream / network_error | [free](https://data.gov.gh) | 414 | discovery |
| Ghostwriter / ghostwriter | [GET](https://ghostwriter.kde.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 290 | discovery |
| Git.io / gitio | [GET](https://github.blog/2011-11-10-git-io-github-url-shortener/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 3154 | discovery |
| Gitea / gitea | - | 301 | redirect_https / redirect_not_approved | unknown | 173 | discovery |
| GitHub Contribution Chart Generator / githubcontributionchartgenerator | [GET](https://github-contributions.vercel.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 621 | discovery |
| GitHub Contributions / githubcontributionchartgenerator | [GET](https://github-contributions.vercel.app/) | 200 | duplicate / duplicate | unknown | - | alias of githubcontributionchartgenerator |
| Gogs / gogs | [GET](https://gogs.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1094 | discovery |
| Google BigQuery API / googlebigqueryapi | - | 301 | gateway_block / gateway_block | unknown | 1040 | discovery |
| goQR.me / goqrme | [GET](https://goqr.me/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 526 | discovery |
| GPT4All / gpt4all | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://gpt4all.io) | 0 | discovery |
| GraphQL Jobs / graphqljobs | - | 0 | dead_upstream / network_error | unknown | 124 | discovery |
| Graphs for Coronavirus / graphsforcoronavirus | - | 0 | dead_upstream / network_error | unknown | 32 | discovery |
| Gravatar / gravatar | - | 302 | redirect_https / redirect_not_approved | unknown | 571 | discovery |
| Gravatar API / gravatarapi | - | 302 | redirect_https / redirect_not_approved | [free](https://en.gravatar.com/site/implement) | 2173 | discovery |
| GroupMe / groupme | [GET](https://dev.groupme.com/docs/v3/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 860 | discovery |
| GrünstromIndex / grnstromindex | [GET](https://gruenstromindex.de/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 278 | discovery |
| Grype / grype | [GET](https://anchore.com/) | 200 | not_hosted_api / reviewed_exclusion | unknown | 975 | discovery |
| GTFS Regional / gtfsregional | [GET](https://www.trafiklab.se/api/gtfs-regional/) | 404 | wrong_base_url_path / http_error | unknown | 296 | discovery |
| Gutendex / gutendex | [GET](https://gutendex.com/books/?ids=1342) | 200 | ok / ok_json | [free](https://gutendex.com/) | 131 | callable |
| HAPI FHIR / hapifhir | [GET](https://hapifhir.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1135 | discovery |
| Harry Potter API / harrypotterapi | [GET](https://hp-api.onrender.com/api/characters/staff) | 200 | ok / ok_json | [free](https://hp-api.onrender.com/) | 162 | callable |
| Harry Potter Charactes / harrypottercharactes | [GET](https://hp-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 553 | discovery |
| Hashable / hashable | - | 0 | redirect_https / tls_error | unknown | 538 | discovery |
| Hashnode / hashnode | [GET](https://hashnode.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 217 | discovery |
| HealthData.gov / healthdatagov | [GET](https://healthdata.gov/) | 406 | unresolved / http_error | unknown | 868 | discovery |
| Hebrew Calendar / hebrewcalendar | [GET](https://www.hebcal.com/converter?cfg=json&gy=2026&gm=10&gd=15&g2h=1) | 200 | ok / ok_json | [free](https://www.hebcal.com/home/developer-apis) | 511 | callable |
| Helix / helix | [GET](https://helix-editor.com/) | 200 | not_hosted_api / reviewed_exclusion | unknown | 200 | discovery |
| HelloSalut / hellosalut | - | 301 | redirect_https / redirect_not_approved | unknown | 718 | discovery |
| Hemingway Editor / hemingwayeditor | [GET](https://hemingwayapp.com/) | 200 | wrong_base_url_path / html_instead_of_api | freemium | 384 | discovery |
| heweather / heweather | [GET](https://www.heweather.com/documents/) | 404 | wrong_base_url_path / http_error | unknown | 1987 | discovery |
| Hipster Ipsum / hipsteripsum | [GET](https://hipsum.co/api/?type=hipster-centric&sentences=1) | 200 | ok / ok_json | [free](https://hipsum.co/the-api/) | 840 | callable |
| hitokoto / hitokoto | - | 302 | gateway_block / gateway_block | unknown | 2934 | discovery |
| Homebrew / homebrew | [GET](https://formulae.brew.sh/api/formula/git.json) | 200 | ok / ok_json | [free](https://formulae.brew.sh/docs/api/) | 64 | callable |
| Hong Kong Data API / hongkongdataapi | - | 0 | timeout / timeout | [free](https://data.gov.hk) | 285 | discovery |
| Hong Kong GeoData Store / hongkonggeodatastore | - | 0 | dead_upstream / network_error | unknown | 34 | discovery |
| Hong Kong Open Data API / hongkongopendataapi | - | 0 | timeout / timeout | unknown | 1041 | discovery |
| host-t.com / hosttcom | - | 301 | redirect_https / redirect_not_approved | unknown | 760 | discovery |
| HTTP Cat / httpcat | [GET](https://http.cat/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 244 | discovery |
| HTTP Dog / httpdog | [GET](https://http.dog/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 487 | discovery |
| HTTP2.Pro / http2pro | - | 301 | redirect_https / redirect_not_approved | unknown | 330 | discovery |
| Httpbin / httpbin | [GET](https://httpbin.org/get) | 200 | ok / ok_json | [free](https://httpbin.org/) | 736 | callable |
| httpbin API / httpbinapi | [GET](https://httpbin.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1027 | discovery |
| Httpbin Cloudflare / httpbincloudflare | [GET](https://cloudflare-quic.com/b/) | 404 | wrong_base_url_path / http_error | unknown | 613 | discovery |
| Human Protein Atlas / humanproteinatlas | [GET](https://www.proteinatlas.org/about/help/dataaccess/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1173 | discovery |
| Humanitarian Data Exchange / humanitariandataexchange | [GET](https://data.humdata.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 908 | discovery |
| Hytale / hytale | [GET](https://hytale-api.com/) | 522 | dead_upstream / http_error | unknown | 19827 | discovery |
| Hytale API / hytale | [GET](https://hytale-api.com/) | 522 | duplicate / duplicate | unknown | - | alias of hytale |
| IBGE Brazil Stats / ibgebrazilstats | - | 0 | redirect_https / tls_error | [free](https://servicodados.ibge.gov.br/api/docs/localidades) | 896 | discovery |
| icanhazdadjoke / icanhazdadjoke | [GET](https://icanhazdadjoke.com/) | 200 | ok / ok_json | [free](https://icanhazdadjoke.com/api) | 218 | callable |
| Icanhazepoch / icanhazepoch | - | 301 | redirect_https / redirect_not_approved | unknown | 732 | discovery |
| Icanhazip / icanhazip | [GET](https://major.io/icanhazip-com-faq/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 314 | discovery |
| Iceland Inspire API / icelandinspireapi | - | 301 | redirect_https / redirect_not_approved | unknown | 561 | discovery |
| Icelandic Met Office / icelandicmetoffice | [GET](https://en.vedur.is/about-imo/apis/) | 404 | wrong_base_url_path / http_error | unknown | 613 | discovery |
| Icon Horse / iconhorse | [GET](https://icon.horse/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 565 | discovery |
| Icon Horse API / iconhorseapi | [GET](https://icon.horse/usage/) | 404 | wrong_base_url_path / http_error | unknown | 1022 | discovery |
| Icons8 / icons8 | [GET](https://img.icons8.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 209 | discovery |
| IEA / iea | - | 301 | redirect_https / redirect_not_approved | unknown | 282 | discovery |
| IFTTT / ifttt | - | 301 | redirect_https / redirect_not_approved | unknown | 279 | discovery |
| IMD India Weather / imdindiaweather | [GET](https://mausam.imd.gov.in/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1666 | discovery |
| IMF / imf | - | 0 | dead_upstream / network_error | unknown | 149 | discovery |
| IMF Data API / imfdataapi | - | 0 | dead_upstream / network_error | [free](https://datahelp.imf.org/knowledgebase/articles/667681) | 854 | discovery |
| Imgflip / imgflip | [GET](https://imgflip.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1252 | discovery |
| Imsea / imsea | [GET](https://imsea.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 481 | discovery |
| Indian Mutual Fund / indianmutualfund | [GET](https://api.mfapi.in/mf/100027/latest) | 200 | ok / ok_json | [free](https://www.mfapi.in/) | 589 | callable |
| Indonesia Dictionary / indonesiadictionary | [GET](https://new-kbbi-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 523 | discovery |
| Indonesia Open Data API / indonesiaopendataapi | [GET](https://data.go.id/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.go.id) | 1248 | discovery |
| INSEE France / inseefrance | - | 302 | redirect_https / redirect_not_approved | unknown | 407 | discovery |
| Instabox / instabox | - | 301 | redirect_https / redirect_not_approved | unknown | 218 | discovery |
| Instapaper / instapaper | [GET](https://www.instapaper.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1211 | discovery |
| Interpol Red Notices / interpolrednotices | [GET](https://interpol.api.bund.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 371 | discovery |
| Intro.js / introjs | [GET](https://introjs.com/) | 200 | not_hosted_api / reviewed_exclusion | unknown | 246 | discovery |
| IP 2 Country / ip2country | [GET](https://ip2country.info/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 227 | discovery |
| IP Address Details / ipaddressdetails | [GET](https://ipinfo.io/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 320 | discovery |
| IP Vigilante / ipvigilante | - | 301 | redirect_https / redirect_not_approved | unknown | 112 | discovery |
| ipapi.co / ipapico | [GET](https://ipapi.co/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1381 | discovery |
| IPGEO / ipgeo | [GET](https://api.techniknews.net/ipgeo/) | 200 | unresolved / invalid_response | unknown | 3104 | discovery |
| IPify / ipify | [GET](https://api.ipify.org/?format=json) | 200 | ok / ok_json | [free](https://www.ipify.org/) | 364 | callable |
| IRENA / irena | - | 301 | redirect_https / redirect_not_approved | unknown | 267 | discovery |
| ISA-95 / isa95 | [GET](https://www.isa.org/isa95/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1355 | discovery |
| isEven / iseven | [GET](https://isevenapi.xyz/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 664 | discovery |
| isEven (humor) / iseven | [GET](https://isevenapi.xyz/) | 200 | duplicate / duplicate | unknown | - | alias of iseven |
| ISRO / isro | [GET](https://isro.vercel.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 516 | discovery |
| ISRO API / isro | [GET](https://isro.vercel.app/) | 200 | duplicate / duplicate | unknown | - | alias of isro |
| Istanbul (İBB) Open Data / istanbulibbopendata | [GET](https://data.ibb.gov.tr/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1253 | discovery |
| ItsThisForThat / itsthisforthat | [GET](https://itsthisforthat.com/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 360 | discovery |
| Ivory Coast Data API / ivorycoastdataapi | [GET](https://data.gouv.ci/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gouv.ci) | 1169 | discovery |
| Jan AI / janai | - | 301 | redirect_https / redirect_not_approved | unknown | 235 | discovery |
| Japan Statistics / japanstatistics | - | 0 | dead_upstream / network_error | unknown | 64 | discovery |
| Jawbone UP / jawboneup | - | 301 | redirect_https / redirect_not_approved | unknown | 220 | discovery |
| Jikan / jikan | - | 0 | timeout / timeout | [free](https://docs.api.jikan.moe/) | 288 | discovery |
| Jikan MyAnimeList / jikanmyanimelist | [GET](https://jikan.moe/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 311 | discovery |
| Jikan MyAnimeList API / jikanmyanimelist | [GET](https://jikan.moe/) | 200 | duplicate / duplicate | unknown | - | alias of jikanmyanimelist |
| Jina Reader / jinareader | [GET](https://jina.ai/reader/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 285 | discovery |
| Jitsi / jitsi | [GET](https://jitsi.org/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://jitsi.org) | 311 | discovery |
| JMA API / jmaapi | [GET](https://www.jma.go.jp/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.jma.go.jp) | 1052 | discovery |
| JokeAPI / jokeapi | [GET](https://v2.jokeapi.dev/joke/Programming?safe-mode) | 200 | ok / ok_json | [free](https://sv443.net/jokeapi/v2/) | 157 | callable |
| Joplin / joplin | - | 0 | needs_key / reviewed_exclusion | unknown | 0 | discovery |
| JSON 2 JSONP / json2jsonp | [GET](https://json2jsonp.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 241 | discovery |
| JSON Placeholder / jsonplaceholder-19df6db5 | [GET](https://jsonplaceholder.typicode.com/todos/1) | 200 | ok / ok_json | [free](https://jsonplaceholder.typicode.com/guide/) | 116 | callable |
| Juhe Data / juhedata | [GET](https://www.juhe.cn/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1709 | discovery |
| Kadaster Netherlands / kadasternetherlands | [GET](https://www.pdok.nl/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 571 | discovery |
| Kakoune / kakoune | [GET](https://kakoune.org/) | 200 | not_hosted_api / reviewed_exclusion | unknown | 531 | discovery |
| kanye.rest / kanyerest | [GET](https://api.kanye.rest/) | 200 | ok / ok_json | [free](https://kanye.rest/) | 154 | callable |
| Kapiche / kapiche | [GET](https://www.kapiche.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 283 | discovery |
| Kartverket / kartverket | [GET](https://kartkatalog.geonorge.no/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 226 | discovery |
| Kenya Open Data API / kenyaopendataapi | - | 0 | timeout / timeout | [free](https://opendata.go.ke) | 10424 | discovery |
| Kickbox / kickbox | [GET](https://open.kickbox.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 813 | discovery |
| kimiquotes / kimiquotes | [GET](https://kimiquotes.herokuapp.com/doc/) | 404 | wrong_base_url_path / http_error | unknown | 620 | discovery |
| KNBS Kenya Stats / knbskenyastats | - | 0 | redirect_https / tls_error | unknown | 504 | discovery |
| KNX / knx | [GET](https://www.knx.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 474 | discovery |
| KONTESTS / kontests | - | 0 | dead_upstream / network_error | unknown | 28 | discovery |
| Korean Statistics / koreanstatistics | - | 301 | redirect_https / redirect_not_approved | unknown | 1401 | discovery |
| Kroki / kroki | [GET](https://kroki.io/health) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 314 | discovery |
| Kube-bench / kubebench | - | 301 | redirect_https / redirect_not_approved | unknown | 366 | discovery |
| Kubeflow / kubeflow | - | 301 | redirect_https / redirect_not_approved | unknown | 609 | discovery |
| Kubescape / kubescape | [GET](https://kubescape.io/) | 200 | not_hosted_api / reviewed_exclusion | unknown | 411 | discovery |
| LA Open Data API / laopendataapi | [GET](https://data.lacity.org/) | 406 | unresolved / http_error | unknown | 939 | discovery |
| Lantmäteriet / lantmteriet | [GET](https://www.lantmateriet.se/sv/Om-Lantmateriet/Oppna-data/) | 404 | wrong_base_url_path / http_error | unknown | 303 | discovery |
| Lapce / lapce | - | 301 | redirect_https / redirect_not_approved | unknown | 222 | discovery |
| LAPIS / lapis | - | 0 | redirect_https / tls_error | unknown | 306 | discovery |
| Laravel China / laravelchina | - | 0 | timeout / timeout | unknown | 10498 | discovery |
| Launch Library / launchlibrary | [GET](https://thespacedevs.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 975 | discovery |
| Launch Library 2 / launchlibrary2 | [GET](https://thespacedevs.com/llapi/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1155 | discovery |
| Leaflet / leaflet | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://leafletjs.com) | 0 | discovery |
| Lido / lido | [GET](https://lido.fi/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 350 | discovery |
| LightwaveRF / lightwaverf | - | 301 | redirect_https / redirect_not_approved | unknown | 683 | discovery |
| LM Studio / lmstudio | [GET](https://lmstudio.ai/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 479 | discovery |
| Lobsters API / lobstersapi | [GET](https://lobste.rs/newest.json) | 200 | ok / ok_json | [free](https://lobste.rs) | 526 | callable |
| LocalAI / localai | [GET](https://localai.io/) | 200 | not_hosted_api / reviewed_exclusion | [free](https://localai.io) | 333 | discovery |
| Localbitcoins / localbitcoins | [GET](https://localbitcoins.com/api-docs/) | 404 | wrong_base_url_path / http_error | unknown | 142 | discovery |
| Logseq / logseq | [GET](https://logseq.com/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://logseq.com) | 106 | discovery |
| LonWorks / lonworks | - | 301 | redirect_https / redirect_not_approved | unknown | 1229 | discovery |
| LoRaWAN / lorawan | [GET](https://lora-alliance.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 330 | discovery |
| Lordicon / lordicon | [GET](https://lordicon.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 298 | discovery |
| Lorem Ipsum / loremipsum | [GET](https://loremipsum.io/api/) | 404 | wrong_base_url_path / http_error | [free](https://loremipsum.io/api) | 769 | discovery |
| Lorem Ipsum API / loremipsumapi | - | 0 | dead_upstream / network_error | [free](https://loripsum.net/) | 15 | discovery |
| Lorem Picsum / lorempicsum | [GET](https://picsum.photos/v2/list?page=1&limit=1) | 200 | ok / ok_json | [free](https://picsum.photos/) | 223 | callable |
| Lorem Space / loremspace | - | 0 | unresolved / network_error | unknown | 996 | discovery |
| Lua Decompiler / luadecompiler | - | 0 | dead_upstream / network_error | unknown | 121 | discovery |
| Luchtmeetnet / luchtmeetnet | [GET](https://api-docs.luchtmeetnet.nl/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 1304 | discovery |
| Lucia Auth / luciaauth | [GET](https://lucia-auth.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 114 | discovery |
| Lyrics.ovh / lyricsovh | [GET](https://lyricsovh.docs.apiary.io/) | 502 | dead_upstream / http_error | unknown | 1210 | discovery |
| MailCheck.ai / mailcheckai | - | 301 | redirect_https / redirect_not_approved | unknown | 241 | discovery |
| Malaysia Open Data API / malaysiaopendataapi | [GET](https://api.data.gov.my/data-catalogue?id=fuelprice&limit=1) | 200 | ok / ok_json | [free](https://developer.data.gov.my/quickstart) | 1732 | callable |
| Mark Text / marktext | [GET](https://marktext.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1021 | discovery |
| markerapi / markerapi | [GET](https://markerapi.com/) | 521 | dead_upstream / http_error | unknown | 284 | discovery |
| Marketstack / marketstack | [GET](https://marketstack.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 716 | discovery |
| Maven Central / mavencentral | [GET](https://search.maven.org/) | 200 | unresolved / invalid_response | [free](https://search.maven.org) | 116 | discovery |
| MealDB API / mealdbapi | [GET](https://www.themealdb.com/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 224 | discovery |
| Mempool / mempool | [GET](https://mempool.space/api/v1/fees/recommended) | 200 | ok / ok_json | [free](https://mempool.space/docs/api/rest) | 374 | callable |
| Mempool API / mempoolapi | [GET](https://mempool.space/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2066 | discovery |
| MercadoBitcoin / mercadobitcoin | [GET](https://www.mercadobitcoin.com.br/api-doc/) | 404 | wrong_base_url_path / http_error | unknown | 327 | discovery |
| Messari / messari | [GET](https://messari.io/api/) | 429 | rate_limit / rate_limited | unknown | 1054 | discovery |
| Messari API / messari | [GET](https://messari.io/api/) | 429 | duplicate / duplicate | unknown | - | alias of messari |
| MET Norway / metnorway | [GET](https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75) | 200 | duplicate / duplicate | [free](https://api.met.no/doc/TermsOfService) | - | alias of yr |
| Metabase / metabase | [GET](https://www.metabase.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 253 | discovery |
| MetaWeather / metaweather | - | 0 | dead_upstream / network_error | unknown | 29 | discovery |
| Meteoam Italy / meteoamitaly | [GET](https://www.meteoam.it/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2267 | discovery |
| Mexico Open Data API / mexicoopendataapi | [GET](https://datos.gob.mx/) | 403 | unresolved / access_denied | [free](https://datos.gob.mx) | 179 | discovery |
| MicroENV / microenv | - | 0 | redirect_https / tls_error | unknown | 307 | discovery |
| Microlink.io / microlinkio | [GET](https://microlink.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 311 | discovery |
| Microsoft Graph OneDrive / microsoftgraphonedrive | - | 301 | gateway_block / gateway_block | unknown | 673 | discovery |
| Microsoft Security Response Center (MSRC) / microsoftsecurityresponsecentermsrc | [GET](https://msrc.microsoft.com/report/developer/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 316 | discovery |
| Minecraft Server Status / minecraftserverstatus | [GET](https://api.mcsrvstat.us/3/mc.hypixel.net) | 200 | ok / ok_json | [free](https://api.mcsrvstat.us/) | 291 | callable |
| Mineral Database API / mineraldatabaseapi | [GET](https://www.mindat.org/api.php/) | 403 | unresolved / access_denied | unknown | 197 | discovery |
| Mirage JS / miragejs | [GET](https://miragejs.com/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://miragejs.com) | 404 | discovery |
| Mirror Networking / mirrornetworking | [GET](https://mirror-networking.com/) | 200 | not_hosted_api / reviewed_exclusion | unknown | 1194 | discovery |
| Misfit / misfit | - | 0 | dead_upstream / network_error | unknown | 230 | discovery |
| MLB API / mlbapi | [GET](https://statsapi.mlb.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 773 | discovery |
| MLB Data API / mlbdataapi | [GET](https://statsapi.mlb.com/api/v1/sports) | 200 | ok / ok_json | [free](https://statsapi.mlb.com) | 544 | callable |
| MLB StatsAPI / mlbstatsapi-265d31bd | [GET](https://statsapi.mlb.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 1893 | discovery |
| MMO Games / mmogames | [GET](https://www.mmobomb.com/api/) | 403 | unresolved / access_denied | unknown | 120 | discovery |
| Mockoon / mockoon | [GET](https://mockoon.com/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://mockoon.com) | 214 | discovery |
| Mocky / mocky | - | 0 | redirect_https / tls_error | unknown | 258 | discovery |
| Mojio / mojio | [GET](https://www.moj.io/developer/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 460 | discovery |
| Moodle / moodle | [GET](https://moodle.org/) | 403 | unresolved / access_denied | unknown | 197 | discovery |
| Moon Phase API / moonphaseapi | [GET](https://www.farmsense.net/api/astro-widgets/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 994 | discovery |
| Morocco Open Data API / moroccoopendataapi | [GET](https://data.gov.ma/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gov.ma) | 616 | discovery |
| Motivational Quotes / motivationalquotes | [GET](https://nodejs-quoteapp.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 517 | discovery |
| MovieGlu / movieglu | - | 301 | redirect_https / redirect_not_approved | unknown | 955 | discovery |
| MSW / msw | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://mswjs.io) | 0 | discovery |
| MTConnect / mtconnect | [GET](https://www.mtconnect.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 386 | discovery |
| MusicBrainz / musicbrainz | [GET](https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1137 | discovery |
| My Anime List API / jikanmyanimelist | [GET](https://jikan.moe/) | 200 | duplicate / duplicate | unknown | - | alias of jikanmyanimelist |
| MY IP / myip | [GET](https://www.myip.com/api-docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 588 | discovery |
| MY IP API / myip | [GET](https://www.myip.com/api-docs/) | 200 | duplicate / duplicate | unknown | - | alias of myip |
| myStrom / mystrom | [GET](https://mystrom.ch/de/mystrom-api/) | 404 | wrong_base_url_path / http_error | unknown | 988 | discovery |
| myStrom API / mystrom | [GET](https://mystrom.ch/de/mystrom-api/) | 404 | duplicate / duplicate | [free](https://mystrom.ch/de/mystrom-api) | - | alias of mystrom |
| Nager Date / nagerdate | - | 301 | commercial_permission / reviewed_exclusion | unknown | 174 | discovery |
| Nager.Date API / nagerdateapi | - | 301 | commercial_permission / reviewed_exclusion | [free](https://date.nager.at/Api) | 1148 | discovery |
| Namedays Calendar / namedayscalendar | [GET](https://nameday.abalin.net/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 356 | discovery |
| NASA EONET / nasaeonet | [GET](https://eonet.gsfc.nasa.gov/api/v3/events?limit=1) | 200 | ok / ok_json | [free](https://eonet.gsfc.nasa.gov/docs/v3) | 707 | callable |
| NASA POWER API / nasapowerapi | [GET](https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M&community=RE&longitude=10&latitude=59&start=20240101&end=20240101&format=JSON) | 200 | ok / ok_json | [free](https://power.larc.nasa.gov/docs/services/api/) | 771 | callable |
| National Grid ESO / nationalgrideso | - | 0 | dead_upstream / network_error | unknown | 28 | discovery |
| National Vulnerability Database / nationalvulnerabilitydatabase | [GET](https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=1) | 200 | ok / ok_json | [free](https://nvd.nist.gov/developers/vulnerabilities) | 640 | callable |
| Nationalize / nationalize | [GET](https://nationalize.io/) | 406 | unresolved / http_error | unknown | 740 | discovery |
| Nationalize.io / nationalize | [GET](https://nationalize.io/) | 406 | duplicate / duplicate | unknown | - | alias of nationalize |
| NBA Stats / nbastats | - | 301 | redirect_https / redirect_not_approved | unknown | 206 | discovery |
| NBB Belgium / nbbbelgium | [GET](https://www.nbb.be/en/statistics/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1176 | discovery |
| NBP Poland API / nbppolandapi | [GET](https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=json) | 200 | ok / ok_json | [free](https://api.nbp.pl/en.html) | 410 | callable |
| NBS China / nbschina | - | 0 | dead_upstream / network_error | unknown | 1045 | discovery |
| NBS Nigeria Stats / nbsnigeriastats | [GET](https://nigerianstat.gov.ng/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1763 | discovery |
| NBU Ukraine API / nbuukraineapi | [GET](https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json) | 200 | ok / ok_json | [free](https://bank.gov.ua/en/open-data/api-dev) | 311 | callable |
| NemID / nemid | [GET](https://www.nets.eu/developer/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 15207 | discovery |
| Neovim / neovim | [GET](https://neovim.io/) | 200 | not_hosted_api / reviewed_exclusion | unknown | 341 | discovery |
| Netherlands Data API / netherlandsdataapi | [GET](https://data.overheid.nl/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.overheid.nl/data) | 396 | callable |
| Newsblur / newsblur | [GET](https://newsblur.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 714 | discovery |
| Newton / newton | [GET](https://newton.vercel.app/api/v2/simplify/2%2B2) | 200 | ok / ok_json | [free](https://github.com/aunyks/newton) | 335 | callable |
| Newton Math / newton | [GET](https://newton.vercel.app/api/v2/simplify/2%2B2) | 200 | duplicate / duplicate | [free](https://github.com/aunyks/newton) | - | alias of newton |
| Newton Math API / newton | [GET](https://newton.vercel.app/api/v2/simplify/2%2B2) | 200 | duplicate / duplicate | [free](https://github.com/aunyks/newton) | - | alias of newton |
| Nexchange / nexchange | [GET](https://nexchange2.docs.apiary.io/) | 502 | dead_upstream / http_error | unknown | 1241 | discovery |
| NHL API / nhlapi | [GET](https://api-web.nhle.com/v1/) | 404 | wrong_base_url_path / http_error | unknown | 344 | discovery |
| NHTSA / nhtsa | [GET](https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/1M8GDM9AXKP042788?format=json) | 200 | ok / ok_json | [free](https://vpic.nhtsa.dot.gov/api/) | 706 | callable |
| Nick Cannon Baby API / nickcannonbabyapi | [GET](https://nick-cannon-baby-api.onrender.com/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://nick-cannon-baby-api.onrender.com) | 401 | discovery |
| Nigeria Open Data API / nbsnigeriastats | [GET](https://nigerianstat.gov.ng/) | 200 | duplicate / duplicate | [free](https://nigerianstat.gov.ng) | - | alias of nbsnigeriastats |
| NIST Chemistry WebBook / nistchemistrywebbook | [GET](https://webbook.nist.gov/) | 406 | unresolved / http_error | unknown | 519 | discovery |
| NMBS/SNCB Belgium / nmbssncbbelgium | [GET](https://www.belgiantrain.be/en/travel-info/preparing-for-your-journey/use-data/) | 403 | unresolved / access_denied | unknown | 238 | discovery |
| Nobel Prize / nobelprize | [GET](https://api.nobelprize.org/2.1/nobelPrizes?limit=1) | 200 | ok / ok_json | [free](https://nobelprize.readme.io/reference/getting-started) | 204 | callable |
| Nobel Prize API / nobelprize | [GET](https://api.nobelprize.org/2.1/nobelPrizes?limit=1) | 200 | duplicate / duplicate | [free](https://nobelprize.readme.io/reference/getting-started) | - | alias of nobelprize |
| Noctua / noctua | [GET](https://api.noctuasky.com/api/v1/swaggerdoc/) | 404 | wrong_base_url_path / http_error | unknown | 691 | discovery |
| Node-RED / nodered | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Nominatim / nominatim | [GET](https://nominatim.org/release-docs/latest/api/Overview/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 377 | discovery |
| Nominatim API / nominatim | [GET](https://nominatim.org/release-docs/latest/api/Overview/) | 200 | duplicate / duplicate | unknown | - | alias of nominatim |
| Non-Working Days / nonworkingdays | [GET](https://isdayoff.ru/20260101) | 200 | ok / ok_text | [free](https://isdayoff.ru/extapi/) | 184 | callable |
| Non-Working Days 2 / nonworkingdays | [GET](https://isdayoff.ru/20260101) | 200 | duplicate / duplicate | [free](https://isdayoff.ru/extapi/) | - | alias of nonworkingdays |
| Norwegian MET Weather / metnorway | [GET](https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75) | 200 | duplicate / duplicate | [free](https://api.met.no/doc/TermsOfService) | - | alias of yr |
| Notation / notation | [GET](https://notaryproject.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 288 | discovery |
| Notifee API / notifeeapi | [GET](https://notifee.app/) | 200 | not_hosted_api / reviewed_exclusion | unknown | 784 | discovery |
| NPPES / nppes | [GET](https://npiregistry.cms.hhs.gov/api/?version=2.1&organization_name=Mayo%20Clinic&limit=1) | 200 | ok / ok_json | [free](https://npiregistry.cms.hhs.gov/api-page) | 523 | callable |
| Numverify / numverify | [GET](https://numverify.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 802 | discovery |
| NYC Open Data API / citynewyorkopendata | - | 301 | duplicate / duplicate | unknown | - | alias of citynewyorkopendata |
| NZ Open Data API / nzopendataapi | [GET](https://catalogue.data.govt.nz/api/3/action/package_search?rows=1) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://catalogue.data.govt.nz) | 219 | discovery |
| Obsidian / obsidian | [GET](https://obsidian.md/) | 200 | wrong_base_url_path / html_instead_of_api | freemium | 225 | discovery |
| Ocean Biogeographic / oceanbiogeographic | [GET](https://api.obis.org/v3/occurrence?size=1) | 200 | ok / ok_json | [free](https://manual.obis.org/policy.html) | 324 | callable |
| Ocean Facts / oceanfacts | [GET](https://oceanfacts.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 566 | discovery |
| OceanCurrent / oceancurrent | [GET](https://imos.org.au/facilities/oceandata/) | 404 | wrong_base_url_path / http_error | unknown | 2077 | discovery |
| Oddsmagnet / oddsmagnet | - | 301 | redirect_https / redirect_not_approved | unknown | 333 | discovery |
| OECD / oecd | [GET](https://data.oecd.org/) | 403 | unresolved / access_denied | [free](https://data.oecd.org) | 199 | discovery |
| OECD API / oecdapi | [GET](https://data.oecd.org/api/) | 403 | unresolved / access_denied | [free](https://data.oecd.org/api) | 1130 | discovery |
| Official Joke API / officialjokeapi | [GET](https://official-joke-api.appspot.com/random_joke) | 200 | ok / ok_json | [free](https://official-joke-api.appspot.com) | 766 | callable |
| Ollama / ollama | - | 301 | redirect_https / redirect_not_approved | [free](https://ollama.ai) | 107 | discovery |
| ONS UK / onsuk | - | 301 | redirect_https / redirect_not_approved | unknown | 387 | discovery |
| ONS UK Statistics / onsukstatistics | [GET](https://api.ons.gov.uk/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 249 | discovery |
| OnWater / onwater | - | 301 | redirect_https / redirect_not_approved | unknown | 580 | discovery |
| OPC UA / opcua | [GET](https://opcfoundation.org/developer-tools/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 947 | discovery |
| Open Ag Data / openagdata | [GET](https://openag.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 365 | discovery |
| Open Brewery DB / openbrewerydb | [GET](https://api.openbrewerydb.org/v1/breweries?per_page=1) | 200 | ok / ok_json | [free](https://www.openbrewerydb.org/documentation) | 429 | callable |
| Open Charge Map / openchargemap | - | 302 | redirect_https / redirect_not_approved | unknown | 3054 | discovery |
| Open Data Minneapolis / opendataminneapolis | [GET](https://opendata.minneapolismn.gov/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 574 | discovery |
| Open Data NHS Scotland / opendatanhsscotland | - | 0 | unresolved / network_error | [free](https://www.opendata.nhs.scot/api/3/action/help_show?name=package_search) | 326 | discovery |
| Open Disease / opendisease | [GET](https://disease.sh/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 525 | discovery |
| Open Food Facts / openfoodfacts | [GET](https://world.openfoodfacts.org/api/v2/product/737628064502.json?fields=product_name) | 200 | ok / ok_json | [free](https://openfoodfacts.github.io/openfoodfacts-server/api/) | 427 | callable |
| Open Food Facts API / openfoodfactsapi | [GET](https://world.openfoodfacts.org/data/) | 403 | unresolved / access_denied | unknown | 938 | discovery |
| Open Government, ACT / opengovernmentact | [GET](https://www.data.act.gov.au/) | 406 | unresolved / http_error | unknown | 1976 | discovery |
| Open Government, Argentina / argentinaopendataapi-9c9e04f3-9c9e04f3-9c9e04f3 | [GET](https://datos.gob.ar/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://datos.gob.ar/api/3/action/help_show?name=package_search) | 883 | callable |
| Open Government, Australia / australiadataapi-50671063 | [GET](https://data.gov.au/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.gov.au/data/api/3/action/help_show?name=package_search) | 568 | callable |
| Open Government, Austria / opengovernmentaustria | [GET](https://www.data.gv.at/katalog/api/3/action/package_search?rows=1) | 404 | dead_upstream / http_error | [free](https://www.data.gv.at/katalog/api/3/action/help_show?name=package_search) | 314 | discovery |
| Open Government, Belgium / opengovernmentbelgium | [GET](https://data.gov.be/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1945 | discovery |
| Open Government, Colombia / opengovernmentcolombia | [GET](https://www.dane.gov.co/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1567 | discovery |
| Open Government, Cyprus / opengovernmentcyprus | [GET](https://data.gov.cy/?language=en) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 522 | discovery |
| Open Government, Czech Republic / opengovernmentczechrepublic | [GET](https://data.gov.cz/english/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 379 | discovery |
| Open Government, Denmark / opengovernmentdenmark | [GET](https://admin.opendata.dk/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://admin.opendata.dk/api/3/action/help_show?name=package_search) | 326 | callable |
| Open Government, Finland / opengovernmentfinland | [GET](https://avoindata.suomi.fi/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://avoindata.suomi.fi/fi/kayttoohjeet/kaytto-rajapinnan-api-kautta) | 321 | callable |
| Open Government, Germany / opengovernmentgermany | [GET](https://ckan.govdata.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.govdata.de/api/3/action/help_show?name=package_search) | 316 | callable |
| Open Government, Italy / opengovernmentitaly | [GET](https://www.dati.gov.it/opendata/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.dati.gov.it/opendata/api/3/action/help_show?name=package_search) | 348 | callable |
| Open Government, Lithuania / opengovernmentlithuania | [GET](https://data.gov.lt/public/api/1/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 268 | discovery |
| Open Government, Mexico / mexicoopendataapi | [GET](https://datos.gob.mx/) | 403 | duplicate / duplicate | unknown | - | alias of mexicoopendataapi |
| Open Government, Netherlands / netherlandsdataapi | [GET](https://data.overheid.nl/data/api/3/action/package_search?rows=1) | 200 | duplicate / duplicate | [free](https://data.overheid.nl/data) | - | alias of netherlandsdataapi |
| Open Government, New Zealand / nzopendataapi | [GET](https://catalogue.data.govt.nz/api/3/action/package_search?rows=1) | 200 | duplicate / duplicate | [free](https://catalogue.data.govt.nz) | - | alias of nzopendataapi |
| Open Government, Norway / opengovernmentnorway | - | 301 | redirect_https / redirect_not_approved | unknown | 106 | discovery |
| Open Government, Peru / opengovernmentperu | [GET](https://www.datosabiertos.gob.pe/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1962 | discovery |
| Open Government, Poland / opengovernmentpoland | [GET](https://api.dane.gov.pl/1.4/datasets?page=1&per_page=1) | 200 | ok / ok_json | [free](https://api.dane.gov.pl/1.4/doc) | 525 | callable |
| Open Government, Portugal / opengovernmentportugal | [GET](https://dados.gov.pt/api/1/datasets/?page_size=1) | 200 | ok / ok_json | [free](https://dados.gov.pt/en/docapi/) | 396 | callable |
| Open Government, Queensland Government / opengovernmentqueenslandgovernment | [GET](https://www.data.qld.gov.au/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.data.qld.gov.au/api/3/action/help_show?name=package_search) | 314 | callable |
| Open Government, Saudi Arabia / opengovernmentsaudiarabia | - | 0 | timeout / timeout | unknown | 390 | discovery |
| Open Government, Singapore / opengovernmentsingapore | [GET](https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast) | 200 | ok / ok_json | [free](https://guide.data.gov.sg/developer-guide/api-overview/api-rate-limits) | 421 | callable |
| Open Government, Slovakia / opengovernmentslovakia | - | 302 | redirect_https / redirect_not_approved | unknown | 392 | discovery |
| Open Government, Slovenia / opengovernmentslovenia | [GET](https://podatki.gov.si/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://podatki.gov.si/api/3/action/help_show?name=package_search) | 583 | callable |
| Open Government, South Australian Government / opengovernmentsouthaustraliangovernment | [GET](https://data.sa.gov.au/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.sa.gov.au/data/api/3/action/help_show?name=package_search) | 1928 | callable |
| Open Government, Spain / opengovernmentspain | [GET](https://datos.gob.es/apidata/catalog/dataset.json?_pageSize=1) | 200 | ok / ok_json | [free](https://datos.gob.es/en/apidata) | 277 | callable |
| Open Government, Sweden / opengovernmentsweden | [GET](https://www.dataportal.se/en/dataservice/91_29789/api-for-the-statistical-database/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2081 | discovery |
| Open Government, Taiwan / opengovernmenttaiwan | [GET](https://data.gov.tw/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 3048 | discovery |
| Open Government, UK / opengovernmentuk | [GET](https://ckan.publishing.service.gov.uk/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.publishing.service.gov.uk) | 358 | callable |
| Open Government, USA / opengovernmentusa | - | 301 | redirect_https / redirect_not_approved | unknown | 934 | discovery |
| Open Government, Victoria State Government / opengovernmentvictoriastategovernment | [GET](https://discover.data.vic.gov.au/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://discover.data.vic.gov.au/api/3/action/help_show?name=package_search) | 3057 | callable |
| Open Government, West Australia / opengovernmentwestaustralia | [GET](https://catalogue.data.wa.gov.au/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalogue.data.wa.gov.au/api/3/action/help_show?name=package_search) | 2469 | callable |
| Open Power System Data / openpowersystemdata | [GET](https://open-power-system-data.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 478 | discovery |
| Open Topo Data / opentopodata | [GET](https://api.opentopodata.org/v1/test-dataset?locations=56,123) | 200 | ok / ok_json | [free](https://www.opentopodata.org/) | 326 | callable |
| Open Trivia / opentrivia | [GET](https://opentdb.com/api.php?amount=1&type=multiple) | 200 | ok / ok_json | [free](https://opentdb.com/api_config.php) | 828 | callable |
| Open Trivia Database / opentrivia | [GET](https://opentdb.com/api.php?amount=1&type=multiple) | 200 | duplicate / duplicate | [free](https://opentdb.com/api_config.php) | - | alias of opentrivia |
| Open Trivia DB / opentrivia | [GET](https://opentdb.com/api.php?amount=1&type=multiple) | 200 | duplicate / duplicate | [free](https://opentdb.com/api_config.php) | - | alias of opentrivia |
| Open-Meteo / openmeteo | [GET](https://open-meteo.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 162 | discovery |
| openAFRICA / openafrica | - | 301 | redirect_https / redirect_not_approved | unknown | 236 | discovery |
| OpenAPI Generator / openapigenerator | [GET](https://api.openapi-generator.tech/api/gen/clients) | 200 | ok / ok_json | [free](https://openapi-generator.tech/docs/online/) | 411 | callable |
| OpenCitations / opencitations | [GET](https://api.opencitations.net/index/v2/citation-count/doi:10.1108/jd-12-2013-0166) | 200 | ok / ok_json | [free](https://opencitations.net/index/api/v2) | 472 | callable |
| OpenCitations API / opencitations | [GET](https://api.opencitations.net/index/v2/citation-count/doi:10.1108/jd-12-2013-0166) | 200 | duplicate / duplicate | [free](https://opencitations.net/index/api/v2) | - | alias of opencitations |
| Opendatasoft API / opendatasoftapi | [GET](https://help.opendatasoft.com/apis/ods-search-v2/) | 404 | wrong_base_url_path / http_error | [free](https://help.opendatasoft.com/apis/ods-search-v2) | 301 | discovery |
| OpenDota / opendota | [GET](https://api.opendota.com/api/heroes) | 200 | ok / ok_json | [free](https://docs.opendota.com/) | 357 | callable |
| OpenFDA Drug / fda-1e910dd4 | [GET](https://api.fda.gov/drug/label.json?limit=1) | 200 | ok / ok_json | [free](https://open.fda.gov/apis/authentication/) | 332 | callable |
| openFDA Drug Labels / fda-1e910dd4 | [GET](https://api.fda.gov/drug/label.json?limit=1) | 200 | duplicate / duplicate | [free](https://open.fda.gov/apis/authentication/) | - | alias of openfdadrug |
| OpenHolidays / openholidays | [GET](https://openholidaysapi.org/PublicHolidays?countryIsoCode=SE&validFrom=2026-01-01&validTo=2026-01-02) | 200 | ok / ok_json | [free](https://www.openholidaysapi.org/en/) | 310 | callable |
| OpenHolidays API / openholidays | [GET](https://openholidaysapi.org/PublicHolidays?countryIsoCode=SE&validFrom=2026-01-01&validTo=2026-01-02) | 200 | duplicate / duplicate | [free](https://www.openholidaysapi.org/en/) | - | alias of openholidays |
| OpenIndoor / openindoor | [GET](https://openindoor.io/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://openindoor.io) | 1777 | discovery |
| OpenLEI API / openleiapi | [GET](https://api.gleif.org/api/v1/lei-records?page%5Bsize%5D=1) | 200 | ok / ok_json | [free](https://www.gleif.org/en/meta/lei-data-terms-of-use) | 396 | callable |
| OpenLigaDB / openligadb | [GET](https://api.openligadb.de/getavailableleagues) | 200 | ok / ok_json | [free](https://www.openligadb.de/) | 321 | callable |
| OpenLigaDB API / openligadb | [GET](https://api.openligadb.de/getavailableleagues) | 200 | duplicate / duplicate | [free](https://www.openligadb.de/) | - | alias of openligadb |
| OpenSanctions / opensanctions | [GET](https://www.opensanctions.org/docs/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 214 | discovery |
| openSenseMap / opensensemap | [GET](https://api.opensensemap.org/stats) | 200 | ok / ok_json | [free](https://docs.opensensemap.org/) | 262 | callable |
| OpenStreetMap Nominatim / openstreetmapnominatim | [GET](https://nominatim.org/release-docs/develop/api/) | 403 | unresolved / access_denied | [free](https://nominatim.org/release-docs/develop/api) | 278 | discovery |
| OpenStreetMap Nominatim API / nominatim | [GET](https://nominatim.org/release-docs/latest/api/Overview/) | 200 | duplicate / duplicate | [free](https://nominatim.org/release-docs/latest/api/Overview) | - | alias of nominatim |
| OpenTripPlanner / opentripplanner | - | 301 | redirect_https / redirect_not_approved | unknown | 369 | discovery |
| OpenVisionAPI / openvisionapi | - | 0 | redirect_https / tls_error | unknown | 245 | discovery |
| OpenWeatherMap API / openweathermapapi | [GET](https://openweathermap.org/api/) | 0 | needs_key / key_documented | unknown | 0 | discovery |
| OpenXR / openxr | [GET](https://www.khronos.org/openxr/) | 200 | not_hosted_api / reviewed_exclusion | unknown | 1195 | discovery |
| Öppna Data Sverige / ppnadatasverige | [GET](https://www.dataportal.se/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.dataportal.se) | 135 | discovery |
| Order Pizza REST API / orderpizzarestapi | [GET](https://order-pizza-api.herokuapp.com/api/ui/) | 404 | wrong_base_url_path / http_error | unknown | 520 | discovery |
| OSRM / osrm | [GET](https://osrm.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 541 | discovery |
| OSRS API / osrsapi | [GET](https://oldschool.runescape.wiki/w/API/) | 404 | wrong_base_url_path / http_error | unknown | 117 | discovery |
| Outlook Mail / outlookmail | - | 301 | redirect_https / redirect_not_approved | unknown | 312 | discovery |
| OV-API Netherlands / ovapinetherlands | [GET](https://ovapi.nl/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 377 | discovery |
| OVHcloud AI Endpoints / ovhcloudaiendpoints | - | 301 | redirect_https / redirect_not_approved | unknown | 694 | discovery |
| Owen Wilson Wow / owenwilsonwow | [GET](https://owen-wilson-wow-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 521 | discovery |
| Owen Wilson Wow API / owenwilsonwowapi | [GET](https://owen-wilson-wow-api.onrender.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 526 | discovery |
| owo / owo | [GET](https://owo.vc/api/) | 404 | wrong_base_url_path / http_error | unknown | 335 | discovery |
| oyyi / oyyi | [GET](https://oyyi.xyz/docs/1.0/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1895 | discovery |
| Packagist / packagist | [GET](https://packagist.org/search.json?q=monolog&per_page=1) | 200 | ok / ok_json | [free](https://packagist.org/apidoc) | 218 | callable |
| PackML / packml | [GET](https://www.omac.org/packml/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1239 | discovery |
| Pantry / pantry | [GET](https://getpantry.cloud/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 574 | discovery |
| PDB / rcsbpdbapi | [GET](https://data.rcsb.org/rest/v1/core/entry/4HHB) | 200 | duplicate / duplicate | [free](https://data.rcsb.org/) | - | alias of rcsbpdbapi |
| PDF Blocks / pdfblocks | [GET](https://www.pdfblocks.com/docs/api/getting-started/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2185 | discovery |
| Peru Open Data API / opengovernmentperu | [GET](https://www.datosabiertos.gob.pe/) | 200 | duplicate / duplicate | [free](https://www.datosabiertos.gob.pe) | - | alias of opengovernmentperu |
| Phabricator / phabricator | [GET](https://phacility.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 896 | discovery |
| Philippines Open Data API / philippinesopendataapi | [GET](https://data.gov.ph/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gov.ph) | 1127 | discovery |
| PhishStats / phishstats | [GET](https://phishstats.info/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 318 | discovery |
| PHP-Noise / phpnoise | [GET](https://php-noise.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 334 | discovery |
| PHP-Noise Generator / phpnoise | [GET](https://php-noise.com/) | 200 | duplicate / duplicate | unknown | - | alias of phpnoise |
| Pinboard / pinboard | [GET](https://pinboard.in/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1129 | discovery |
| Pinterest API / pinterestapi | [GET](https://www.pinterest.com/login/?next=http%3A%2F%2Fdevelopers.pinterest.com%2Fapi_docs%2F) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 461 | discovery |
| Pirate Ipsum / pirateipsum | [GET](https://pirateipsum.me/api/) | 404 | wrong_base_url_path / http_error | unknown | 852 | discovery |
| Pirate Ship / pirateship | [GET](https://ship.pirateship.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 802 | discovery |
| Pixel Encounter / pixelencounter | - | 0 | redirect_https / tls_error | unknown | 584 | discovery |
| PlaceBear / placebear | [GET](https://placebear.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 735 | discovery |
| PlaceDog / placedog | [GET](https://place.dog/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 332 | discovery |
| Placeholder.com / placeholdercom | [GET](https://placeholder.com/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://placeholder.com) | 142 | discovery |
| PlaceKeanu / placekeanu | [GET](https://placekeanu.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 508 | discovery |
| PlaceKitten / placekitten | [GET](https://placekitten.com/) | 521 | dead_upstream / http_error | unknown | 197 | discovery |
| Plaid Identity / plaididentity | [GET](https://plaid.com/docs/identity-verification/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 976 | discovery |
| PlayerDB / playerdb | [GET](https://playerdb.co/api/player/minecraft/Notch) | 200 | ok / ok_json | [free](https://playerdb.co/) | 113 | callable |
| Plusgiro / plusgiro | - | 0 | redirect_https / tls_error | unknown | 229 | discovery |
| PM2.5 Open Data Portal / pm25opendataportal | [GET](https://pm25.lass-net.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1050 | discovery |
| PM2.5 Portal / pm25opendataportal | [GET](https://pm25.lass-net.org/) | 200 | duplicate / duplicate | unknown | - | alias of pm25opendataportal |
| Pokéapi / pokapi | [GET](https://pokeapi.co/api/v2/berry/1) | 200 | ok / ok_json | [free](https://pokeapi.co/docs/v2) | 115 | callable |
| Pokemon / pokapi | [GET](https://pokeapi.co/api/v2/berry/1) | 200 | duplicate / duplicate | [free](https://pokeapi.co/docs/v2) | - | alias of pokapi |
| Pokemon API / pokapi | [GET](https://pokeapi.co/api/v2/berry/1) | 200 | duplicate / duplicate | [free](https://pokeapi.co/docs/v2) | - | alias of pokapi |
| Pokémon TCG / pokemontcgapi | [GET](https://pokemontcg.io/) | 200 | duplicate / duplicate | unknown | - | alias of pokemontcgapi |
| Pokemon TCG API / pokemontcgapi | [GET](https://pokemontcg.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 397 | discovery |
| Pokémon TCG API / pokemontcgapi | [GET](https://pokemontcg.io/) | 200 | duplicate / duplicate | unknown | - | alias of pokemontcgapi |
| Postali / postali | [GET](https://postali.app/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1059 | discovery |
| Postcodes.io / postcodesio | [GET](https://api.postcodes.io/postcodes/SW1A1AA) | 200 | ok / ok_json | [free](https://postcodes.io/) | 210 | callable |
| PostgREST / postgrest | - | 301 | gateway_block / gateway_block | unknown | 253 | discovery |
| Postman Echo / postmanecho | [GET](https://postman-echo.com/get?hello=apiclaw) | 200 | ok / ok_json | [free](https://www.postman.com/echo) | 348 | callable |
| PRH / prh | [GET](https://www.prh.fi/en/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1101 | discovery |
| PRH Finland / prhfinland | [GET](https://avoindata.prh.fi/opendata-ytj-api/v3/companies?businessId=0112038-9) | 200 | ok / ok_json | [free](https://www.prh.fi/en/companiesandorganisations/tietopalvelut/prhopendata.html) | 318 | callable |
| Prism / prism | - | 301 | redirect_https / redirect_not_approved | [free](https://stoplight.io/prism) | 455 | discovery |
| Pruvan / pruvan | - | 301 | redirect_https / redirect_not_approved | unknown | 597 | discovery |
| PRV / prv | [GET](https://www.prv.se/sv/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 281 | discovery |
| Psychonauts / psychonauts | [GET](https://psychonauts-api.netlify.app/) | 401 | unresolved / access_denied | unknown | 246 | discovery |
| PubChem / pubchem | [GET](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2244/property/MolecularFormula/JSON) | 200 | ok / ok_json | [free](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest) | 392 | callable |
| PubChem API / pubchem | [GET](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2244/property/MolecularFormula/JSON) | 200 | duplicate / duplicate | [free](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest) | - | alias of pubchem |
| PunkAPI / punkapi | - | 0 | dead_upstream / network_error | unknown | 45 | discovery |
| Purple Air / purpleair | - | 301 | redirect_https / redirect_not_approved | unknown | 357 | discovery |
| PyPI / pypi | [GET](https://pypi.org/pypi/pip/25.0/json) | 200 | ok / ok_json | [free](https://docs.pypi.org/api/json/) | 69 | callable |
| PyPI API / pypi | [GET](https://pypi.org/pypi/pip/25.0/json) | 200 | duplicate / duplicate | [free](https://docs.pypi.org/api/json/) | - | alias of pypi |
| QNAP Development Toolkit / qnapdevelopmenttoolkit | [GET](https://www.qnap.com/event/dev/useng/p_about.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 3188 | discovery |
| QOwnNotes / qownnotes | - | 301 | redirect_https / redirect_not_approved | unknown | 270 | discovery |
| QR Code Generator / qrcode | [GET](https://goqr.me/api/) | 200 | duplicate / duplicate | [free](https://goqr.me/api) | - | alias of qrcode |
| QR code qrtag / qrcodeqrtag | [GET](https://www.qrtag.net/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 624 | discovery |
| Qrcode Monkey / qrcodemonkey | [GET](https://www.qrcode-monkey.com/qr-code-api-with-logo/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 208 | discovery |
| Quarantine / quarantine | - | 0 | dead_upstream / network_error | unknown | 139 | discovery |
| Quarantine API / quarantine | - | 0 | duplicate / duplicate | unknown | - | alias of quarantine |
| Queimadas INPE / queimadasinpe | - | 301 | redirect_https / redirect_not_approved | unknown | 1381 | discovery |
| QuickChart / quickchart | [GET](https://quickchart.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 198 | discovery |
| QuickMocker / quickmocker | - | 0 | dead_upstream / network_error | unknown | 48 | discovery |
| quoteclear / quoteclear | [GET](https://quoteclear.web.app/) | 404 | wrong_base_url_path / http_error | unknown | 138 | discovery |
| Quotes on Design / quotesondesign | [GET](https://quotesondesign.com/wp-json/wp/v2/posts?per_page=1) | 200 | ok / ok_json | [free](https://quotesondesign.com/api/) | 157 | callable |
| Quran / quran | [GET](https://api.alquran.cloud/v1/ayah/1/en.asad) | 200 | ok / ok_json | [free](https://alquran.cloud/api) | 328 | callable |
| Quran API / quran | [GET](https://api.alquran.cloud/v1/ayah/1/en.asad) | 200 | duplicate / duplicate | [free](https://alquran.cloud/api) | - | alias of quran |
| Quran Cloud / quran | [GET](https://api.alquran.cloud/v1/ayah/1/en.asad) | 200 | duplicate / duplicate | [free](https://alquran.cloud/api) | - | alias of quran |
| Radicle / radicle | - | 307 | redirect_https / redirect_not_approved | unknown | 230 | discovery |
| Radio Browser / radiobrowser | [GET](https://de1.api.radio-browser.info/json/stations/topvote/1) | 200 | ok / ok_json | [free](https://www.radio-browser.info/) | 322 | callable |
| Raider / raider | [GET](https://raider.io/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 398 | discovery |
| Random Data / randomdata | - | 0 | dead_upstream / network_error | [free](https://random-data-api.com/documentation) | 697 | discovery |
| Random Facts / randomfacts | [GET](https://fungenerators.com/api/facts/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2838 | discovery |
| Random Useless Facts / randomuselessfacts | [GET](https://uselessfacts.jsph.pl/api/v2/facts/random?language=en) | 200 | ok / ok_json | [free](https://uselessfacts.jsph.pl/) | 200 | callable |
| RandomDog / randomdog | [GET](https://random.dog/woof.json) | 200 | ok / ok_json | [free](https://random.dog/) | 815 | callable |
| RandomDuck / randomduck | [GET](https://random-d.uk/api/random) | 200 | ok / ok_json | [free](https://random-d.uk/api) | 249 | callable |
| RandomFox / randomfox | [GET](https://randomfox.ca/floof/) | 200 | ok / ok_json | [free](https://randomfox.ca/) | 1171 | callable |
| RandomUser / randomuser-c51bc20a | [GET](https://randomuser.me/api/?results=1&inc=name,nat&noinfo) | 200 | ok / ok_json | [free](https://randomuser.me/documentation) | 316 | callable |
| RATP Paris Transit / ratpparistransit | [GET](https://data.ratp.fr/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1323 | discovery |
| RBA Australia / rbaaustralia | [GET](https://www.rba.gov.au/statistics/tables/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 800 | discovery |
| RBA Australia Data / rbaaustralia | [GET](https://www.rba.gov.au/statistics/tables/) | 200 | duplicate / duplicate | unknown | - | alias of rbaaustralia |
| RBNZ New Zealand Data / rbnznewzealanddata | [GET](https://www.rbnz.govt.nz/statistics/) | 403 | unresolved / access_denied | unknown | 146 | discovery |
| RCSB PDB API / rcsbpdbapi | [GET](https://data.rcsb.org/rest/v1/core/entry/4HHB) | 200 | ok / ok_json | [free](https://data.rcsb.org/) | 530 | callable |
| Redmine / redmine | - | 301 | redirect_https / redirect_not_approved | unknown | 239 | discovery |
| Rejseplanen / rejseplanen | - | 301 | redirect_https / redirect_not_approved | unknown | 1071 | discovery |
| RemoteOK API / remoteokapi | [GET](https://remoteok.com/api/) | 200 | gateway_block / body_limit | [free](https://remoteok.com/api) | 840 | discovery |
| Remotive / remotive | - | 301 | redirect_https / redirect_not_approved | unknown | 232 | discovery |
| Renfe Railway Spain / renferailwayspain | - | 301 | redirect_https / redirect_not_approved | unknown | 116 | discovery |
| Represent by Open North / representbyopennorth | [GET](https://represent.opennorth.ca/representatives/?limit=1) | 200 | ok / ok_json | [free](https://represent.opennorth.ca/api/) | 770 | callable |
| ReqRes / reqres | [GET](https://reqres.in/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 418 | discovery |
| ReqRes API / reqres | [GET](https://reqres.in/) | 200 | duplicate / duplicate | [free](https://reqres.in) | - | alias of reqres |
| RescueGroups / rescuegroups | - | 301 | redirect_https / redirect_not_approved | unknown | 528 | discovery |
| ReSmush.it / resmushit | [GET](https://resmush.it/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 269 | discovery |
| Resrobot / resrobot | [GET](https://www.trafiklab.se/api/resrobot-reseplanerare/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 252 | discovery |
| REST Countries / restcountries-e252b887-e252b887-e252b887 | - | 301 | redirect_https / redirect_not_approved | unknown | 184 | discovery |
| Reykjavik Open Data / reykjavikopendata | - | 301 | redirect_https / redirect_not_approved | unknown | 365 | discovery |
| Rick and Morty / rickandmorty | [GET](https://rickandmortyapi.com/api/character/1) | 200 | ok / ok_json | [free](https://rickandmortyapi.com/documentation) | 188 | callable |
| Rick and Morty API / rickandmorty | [GET](https://rickandmortyapi.com/api/character/1) | 200 | duplicate / duplicate | [free](https://rickandmortyapi.com/documentation) | - | alias of rickandmorty |
| Riksarkivet / riksarkivet | [GET](https://riksarkivet.se/oppna-data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2624 | discovery |
| Riksbanken API / riksbankenapi | [GET](https://www.riksbank.se/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.riksbank.se) | 389 | discovery |
| Riksdagen Open Data / riksdagenopendata | [GET](https://data.riksdagen.se/dokumentlista/?sz=1&utformat=json) | 200 | ok / ok_json | [free](https://data.riksdagen.se/) | 280 | callable |
| RoboHash / robohash | [GET](https://robohash.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 329 | discovery |
| Rocket Pool / rocketpool | [GET](https://rocketpool.net/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 138 | discovery |
| RPS 101 / rps101 | [GET](https://rps101.pythonanywhere.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 574 | discovery |
| RSS feed to JSON / rssfeedtojson | [GET](https://rss-to-json-serverless-api.vercel.app/) | 402 | unresolved / http_error | unknown | 299 | discovery |
| RubyGems / rubygems | [GET](https://rubygems.org/api/v1/gems/rails.json) | 200 | ok / ok_json | [free](https://guides.rubygems.org/rubygems-org-api/) | 193 | callable |
| RuneScape / runescape | [GET](https://runescape.wiki/w/Application_programming_interface/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 210 | discovery |
| Rustybeer / rustybeer | [GET](https://rustybeer.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 633 | discovery |
| Ruter / ruter | [GET](https://api.entur.io/journey-planner/) | 404 | wrong_base_url_path / http_error | unknown | 191 | discovery |
| Rwanda Locations / rwandalocations | [GET](https://rapidapi.com/victorkarangwa4/api/rwanda/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 14511 | discovery |
| Rwanda Open Data API / rwandaopendataapi | [GET](https://statistics.gov.rw/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://statistics.gov.rw) | 864 | discovery |
| RxNorm / rxnorm | [GET](https://rxnav.nlm.nih.gov/REST/rxcui.json?name=aspirin) | 200 | ok / ok_json | [free](https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html) | 849 | callable |
| SAMA Saudi Arabia / samasaudiarabia | - | 0 | redirect_https / tls_error | unknown | 519 | discovery |
| Samtrafiken / samtrafiken | - | 301 | redirect_https / redirect_not_approved | unknown | 333 | discovery |
| Samuel L Ipsum / samuellipsum | [GET](https://slipsum.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 191 | discovery |
| Saudi Aramco Data / saudiaramcodata | [GET](https://www.aramco.com/en/investors/data-and-insights/) | 404 | gateway_block / body_limit | unknown | 2095 | discovery |
| SCB / scb | [GET](https://www.scb.se/vara-tjanster/oppna-data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 253 | discovery |
| SCB API / scbapi | [GET](https://www.scb.se/vara-tjanster/oppna-data/api-for-statistikdatabasen/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2111 | discovery |
| SCB Statistics Sweden / statisticsswedenscb | [GET](https://api.scb.se/OV0104/v1/doris/en/ssd) | 200 | duplicate / duplicate | [free](https://www.scb.se/en/services/open-data-api/) | - | alias of statisticsswedenscb |
| Scorecard / scorecard | [GET](https://securityscorecards.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 348 | discovery |
| Scryfall / scryfall | [GET](https://api.scryfall.com/cards/named?exact=Black%20Lotus) | 200 | ok / ok_json | [free](https://scryfall.com/docs/api) | 206 | callable |
| Scryfall MTG / scryfallmtg | [GET](https://scryfall.com/docs/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 363 | discovery |
| SEC EDGAR / secedgar | [GET](https://www.sec.gov/developer/) | 404 | wrong_base_url_path / http_error | [free](https://www.sec.gov/developer) | 916 | discovery |
| SEC EDGAR API / secedgar | [GET](https://www.sec.gov/developer/) | 404 | duplicate / duplicate | unknown | - | alias of secedgar |
| SEC EDGAR Data / secedgardata | [GET](https://www.sec.gov/edgar/sec-api-documentation/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2127 | discovery |
| Semantic Scholar / semanticscholar | [GET](https://api.semanticscholar.org/) | 429 | rate_limit / rate_limited | [free](https://api.semanticscholar.org) | 1212 | discovery |
| Senegal Open Data API / senegalopendataapi | - | 0 | dead_upstream / network_error | [free](https://data.gouv.sn) | 350 | discovery |
| Seniverse / seniverse | [GET](https://www.seniverse.com/doc/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2079 | discovery |
| Serialif Color / serialifcolor | [GET](https://color.serialif.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 485 | discovery |
| Shanbay / shanbay | - | 0 | timeout / timeout | unknown | 303 | discovery |
| ShapeShift API / shapeshiftapi | - | 0 | dead_upstream / network_error | unknown | 70 | discovery |
| SHARE / share | [GET](https://share.osf.io/api/v2/) | 406 | unresolved / http_error | unknown | 321 | discovery |
| Sharp / sharp | [GET](https://sharp.pixelplumbing.com/api/) | 404 | not_hosted_api / reviewed_exclusion | unknown | 250 | discovery |
| Shepherd.js / shepherdjs | - | 308 | redirect_https / redirect_not_approved | unknown | 398 | discovery |
| Shields / shields | [GET](https://shields.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 218 | discovery |
| Shields.io / shields | [GET](https://shields.io/) | 200 | duplicate / duplicate | unknown | - | alias of shields |
| Signal Protocol / signalprotocol | [GET](https://signal.org/) | 200 | not_hosted_api / reviewed_exclusion | [free](https://signal.org) | 217 | discovery |
| Sigstore / cosign | - | 301 | duplicate / duplicate | unknown | - | alias of cosign |
| SilverBullet / silverbullet | [GET](https://silverbullet.md/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 830 | discovery |
| Singapore Data API / singaporedataapi | [GET](https://data.gov.sg/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gov.sg) | 1235 | discovery |
| Sitebulb / sitebulb | [GET](https://sitebulb.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 153 | discovery |
| SL API / slapi | [GET](https://www.trafiklab.se/api/sl-realtidsinformation-4/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 33 | discovery |
| SLSA / slsa | [GET](https://slsa.dev/) | 200 | not_hosted_api / reviewed_exclusion | unknown | 211 | discovery |
| Smappee / smappee | [GET](https://smappee.atlassian.net/wiki/display/DEVAPI/SmappeeDevAPI+Home/) | 404 | wrong_base_url_path / http_error | unknown | 512 | discovery |
| Smash / smash | [GET](https://api.fromsmash.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 929 | discovery |
| SMHI / smhi | [GET](https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/98210.json) | 200 | ok / ok_json | [free](https://www.smhi.se/data/oppna-data) | 79 | callable |
| SMHI API / smhiapi | [GET](https://opendata.smhi.se/apidocs/) | 404 | wrong_base_url_path / http_error | unknown | 191 | discovery |
| SMHI Open Data / smhiopendata | [GET](https://opendata-download-metobs.smhi.se/api/) | 200 | unresolved / invalid_response | unknown | 841 | discovery |
| SMHI Weather API / smhiapi | [GET](https://opendata.smhi.se/apidocs/) | 404 | duplicate / duplicate | unknown | - | alias of smhiapi |
| SMN Argentina API / smnargentinaapi | [GET](https://www.smn.gob.ar/) | 403 | unresolved / access_denied | [free](https://www.smn.gob.ar) | 144 | discovery |
| SNB Switzerland / snbswitzerland | [GET](https://data.snb.ch/) | 400 | unresolved / http_error | unknown | 292 | discovery |
| SNB Switzerland Data / snbswitzerlanddata | [GET](https://data.snb.ch/en/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2046 | discovery |
| Songsterr / songsterr | [GET](https://www.songsterr.com/a/wa/api/) | 404 | wrong_base_url_path / http_error | unknown | 1594 | discovery |
| South Africa Data API / southafricadataapi | - | 0 | timeout / timeout | [free](https://data.gov.za) | 10424 | discovery |
| South African Reserve Bank / southafricanreservebank | [GET](https://www.resbank.co.za/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2476 | discovery |
| Spaceflight News / spaceflightnews | [GET](https://spaceflightnewsapi.net/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 206 | discovery |
| SpaceX / spacex | [GET](https://api.spacexdata.com/v4/launches/latest) | 522 | dead_upstream / http_error | [free](https://github.com/r-spacex/SpaceX-API) | 19722 | discovery |
| Spain INE Statistics / spaininestatistics | [GET](https://www.ine.es/dyngs/DataLab/) | 404 | wrong_base_url_path / http_error | unknown | 929 | discovery |
| Spanish random names / spanishrandomnames | [GET](https://random-names-api.herokuapp.com/public/) | 404 | wrong_base_url_path / http_error | unknown | 1046 | discovery |
| Spanish random words / spanishrandomwords | [GET](https://palabras-aleatorias-public-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 571 | discovery |
| Squiggle / squiggle | [GET](https://api.squiggle.com.au/?q=teams;team=1) | 200 | ok / ok_json | [free](https://api.squiggle.com.au/) | 266 | callable |
| SSB / ssb | [GET](https://www.ssb.no/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 845 | discovery |
| SSB Norway / ssbnorway | [GET](https://data.ssb.no/api/v0/) | 410 | unresolved / http_error | unknown | 356 | discovery |
| Stakdek QR Generator / stakdekqrgenerator | - | 0 | timeout / timeout | unknown | 10048 | discovery |
| STAPI Star Trek / stapistartrek | [GET](https://stapi.co/api-documentation/) | 404 | wrong_base_url_path / http_error | unknown | 911 | discovery |
| Star Trek API (STAPI) / stapistartrek | [GET](https://stapi.co/api-documentation/) | 404 | duplicate / duplicate | unknown | - | alias of stapistartrek |
| StatBel Belgium / statbelbelgium | [GET](https://statbel.fgov.be/en/open-data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1227 | discovery |
| Statically / statically | [GET](https://statically.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 181 | discovery |
| Statistics Denmark / statisticsdenmark | - | 301 | redirect_https / redirect_not_approved | unknown | 1041 | discovery |
| Statistics Finland / statisticsfinland | [GET](https://pxweb2.stat.fi/PXWeb/api/v1/en/StatFin) | 200 | ok / ok_json | [free](https://stat.fi/en/statistics/open-data) | 233 | callable |
| Statistics Norway / statisticsnorway | [GET](https://data.ssb.no/api/v0/en/table/?query=07459) | 200 | ok / ok_json | [free](https://www.ssb.no/en/api) | 249 | callable |
| Statistics Sweden / statisticsswedenscb | [GET](https://api.scb.se/OV0104/v1/doris/en/ssd) | 200 | duplicate / duplicate | [free](https://www.scb.se/en/services/open-data-api/) | - | alias of statisticsswedenscb |
| Statistics Sweden (SCB) / statisticsswedenscb | [GET](https://api.scb.se/OV0104/v1/doris/en/ssd) | 200 | ok / ok_json | [free](https://www.scb.se/en/services/open-data-api/) | 258 | callable |
| Stoplight Prism / stoplightprism | - | 301 | redirect_https / redirect_not_approved | [free](https://stoplight.io/open-source/prism) | 258 | discovery |
| Stromberg Quotes / strombergquotes | - | 301 | redirect_https / redirect_not_approved | unknown | 319 | discovery |
| Studio Ghibli / studioghibli | [GET](https://ghibliapi.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 713 | discovery |
| Studio Ghibli API / studioghibliapi | [GET](https://ghibliapi.vercel.app/films) | 200 | ok / ok_json | [free](https://ghibliapi.vercel.app) | 318 | callable |
| Sunrise and Sunset / sunriseandsunset | [GET](https://sunrise-sunset.org/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1179 | discovery |
| Sunrise-Sunset API / sunrisesunsetapi | [GET](https://api.sunrise-sunset.org/json?lat=59.3293&lng=18.0686&formatted=0) | 200 | ok / ok_json | [free](https://sunrise-sunset.org/api) | 275 | callable |
| SunriseSunset.io / sunrisesunsetio | [GET](https://api.sunrisesunset.io/json?lat=38.9&lng=-77) | 200 | ok / ok_json | [free](https://sunrisesunset.io/api/) | 108 | callable |
| Suomi.fi / suomifi | [GET](https://www.suomi.fi/palvelut/apis/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1201 | discovery |
| SuredBits / suredbits | [GET](https://suredbits.com/api/) | 522 | dead_upstream / http_error | unknown | 19919 | discovery |
| Svea / svea | [GET](https://www.svea.com/se/sv/foretag/integrationer/) | 404 | wrong_base_url_path / http_error | unknown | 1064 | discovery |
| Sveriges Dataportal / sverigesdataportal | [GET](https://www.dataportal.se/api/) | 404 | wrong_base_url_path / http_error | unknown | 1185 | discovery |
| SVN API / svnapi | [GET](https://subversion.apache.org/docs/api/1.8/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://subversion.apache.org/docs/api/1.8) | 237 | discovery |
| SWAPI GraphQL / swapigraphql | [GET](https://graphql.org/swapi-graphql/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 468 | discovery |
| SWAPI Star Wars / swapistarwars | [GET](https://www.swapi.tech/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 672 | discovery |
| Sweden Data API / ppnadatasverige | [GET](https://www.dataportal.se/) | 200 | duplicate / duplicate | unknown | - | alias of ppnadatasverige |
| Swedish Parliament / swedishparliament | - | 301 | redirect_https / redirect_not_approved | unknown | 78 | discovery |
| Swiss Federal Stats / swissfederalstats | [GET](https://www.pxweb.bfs.admin.ch/api/v1/en/) | 200 | ok / ok_json | [free](https://www.bfs.admin.ch/bfs/en/home/services/ogd.html) | 427 | callable |
| Swisstopo Geodata / swisstopogeodata | - | 302 | gateway_block / gateway_block | unknown | 219 | discovery |
| Syft / grype | [GET](https://anchore.com/) | 200 | duplicate / duplicate | unknown | - | alias of grype |
| Taiga / taiga | [GET](https://taiga.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 515 | discovery |
| Taiwan Open Data API / opengovernmenttaiwan | [GET](https://data.gov.tw/) | 200 | duplicate / duplicate | [free](https://data.gov.tw) | - | alias of opengovernmenttaiwan |
| Taylor Swift API / taylorswiftapi | - | 0 | dead_upstream / network_error | [free](https://taylor.rest) | 92 | discovery |
| TCGdex Pokémon / tcgdexpokmon | - | 0 | timeout / timeout | unknown | 361 | discovery |
| TCGdex Pokémon TCG / tcgdexpokmon | - | 0 | duplicate / duplicate | unknown | - | alias of tcgdexpokmon |
| Teambition / teambition | - | 302 | gateway_block / gateway_block | unknown | 3583 | discovery |
| Techy / techy | [GET](https://techy-api.vercel.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 359 | discovery |
| Techy API / techy | [GET](https://techy-api.vercel.app/) | 200 | duplicate / duplicate | unknown | - | alias of techy |
| Telegram API / telegramapi | [GET](https://core.telegram.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 212 | discovery |
| Tenders Hungary / tendershungary | - | 0 | timeout / timeout | unknown | 10229 | discovery |
| Tenders in Hungary / tendershungary | - | 0 | duplicate / duplicate | unknown | - | alias of tendershungary |
| Tenders in Poland / tendersinpoland | - | 0 | timeout / timeout | unknown | 20003 | discovery |
| Tenders in Romania / tendersinromania | - | 0 | timeout / timeout | unknown | 20004 | discovery |
| Tenders in Spain / tendersinspain | - | 0 | timeout / timeout | unknown | 20000 | discovery |
| Tenders in Ukraine / tendersinukraine | - | 0 | timeout / timeout | unknown | 20000 | discovery |
| Tenders Poland / tendersinpoland | - | 0 | duplicate / duplicate | unknown | - | alias of tendersinpoland |
| Tenders Romania / tendersinromania | - | 0 | duplicate / duplicate | unknown | - | alias of tendersinromania |
| Tenders Spain / tendersinspain | - | 0 | duplicate / duplicate | unknown | - | alias of tendersinspain |
| Tenders Ukraine / tendersinukraine | - | 0 | duplicate / duplicate | unknown | - | alias of tendersinukraine |
| Terraform Registry / terraformregistry | [GET](https://registry.terraform.io/v1/providers?limit=1) | 200 | ok / ok_json | [free](https://registry.terraform.io) | 240 | callable |
| TETR.IO / tetrio | [GET](https://tetr.io/about/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 197 | discovery |
| TextMate / textmate | [GET](https://macromates.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 442 | discovery |
| Thailand Open Data API / thailandopendataapi | [GET](https://data.go.th/) | 403 | unresolved / access_denied | [free](https://data.go.th) | 201 | discovery |
| The Null Pointer / thenullpointer | [GET](https://0x0.st/) | 200 | unresolved / invalid_response | unknown | 354 | discovery |
| The SMS Works / thesmsworks | [GET](https://thesmsworks.co.uk/sms-api/) | 404 | wrong_base_url_path / http_error | unknown | 366 | discovery |
| They Said So Quotes / theysaidsoquotes | [GET](https://theysaidso.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1576 | discovery |
| Things API / thingsapi | [GET](https://culturedcode.com/things/support/articles/2803573/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 117 | discovery |
| Thirukkural / thirukkural | [GET](https://api-thirukkural.web.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 96 | discovery |
| This Person Does not Exist / thispersondoesnotexist | [GET](https://thispersondoesnotexist.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 311 | discovery |
| Thread / thread | [GET](https://threadgroup.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 698 | discovery |
| ThronesApi / thronesapi | [GET](https://thronesapi.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 868 | discovery |
| Thumbor / thumbor | [GET](https://thumbor.readthedocs.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1243 | discovery |
| TLE / tle | [GET](https://tle.ivanstanojevic.me/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 333 | discovery |
| TLE API / tle | [GET](https://tle.ivanstanojevic.me/) | 200 | duplicate / duplicate | unknown | - | alias of tle |
| Today in History API / todayinhistoryapi | [GET](https://history.muffinlabs.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 719 | discovery |
| Toodledo / toodledo | [GET](https://api.toodledo.com/3/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 404 | discovery |
| Toolcarton / toolcarton | - | 0 | dead_upstream / network_error | unknown | 48 | discovery |
| TradingView / tradingview | - | 301 | redirect_https / redirect_not_approved | [free](https://tradingview.com) | 110 | discovery |
| Trafikverket Open API / trafikverketopenapi | [GET](https://api.trafikinfo.trafikverket.se/) | 404 | wrong_base_url_path / http_error | unknown | 145 | discovery |
| Traitify / traitify | [GET](https://app.traitify.com/developer/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 711 | discovery |
| Transfermarkt API / transfermarktapi | [GET](https://transfermarkt-api.vercel.app/) | 402 | unresolved / http_error | unknown | 351 | discovery |
| TransLink Queensland / translinkqueensland | [GET](https://translink.com.au/about-translink/open-data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2689 | discovery |
| Transport for Auckland, New Zealand / transportforaucklandnewzealand | [GET](https://dev-portal.at.govt.nz/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2199 | discovery |
| Transport for Budapest, Hungary / transportforbudapesthungary | - | 0 | timeout / timeout | unknown | 20003 | discovery |
| Transport for Czech Republic / transportforczechrepublic | [GET](https://www.chaps.cz/eng/products/idos-internet/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 619 | discovery |
| Transport for Switzerland / transportforswitzerland | [GET](https://transport.opendata.ch/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 314 | discovery |
| Transport for United States / transportforunitedstates | [GET](https://retro.umoiq.com/xmlFeedDocs/NextBusXMLFeed.pdf/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1258 | discovery |
| transport.rest / transportrest | - | 503 | timeout / timeout | [free](https://v6.db.transport.rest/api.html) | 20001 | discovery |
| Trivy / trivy | [GET](https://trivy.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 126 | discovery |
| Tronald Dump / tronalddump | [GET](https://www.tronalddump.io/) | 521 | dead_upstream / http_error | unknown | 617 | discovery |
| Tunisia Open Data API / tunisiaopendataapi | [GET](https://catalog.agridata.tn/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://catalog.agridata.tn) | 413 | callable |
| TVMaze API / tvmazeapi | - | 301 | redirect_https / redirect_not_approved | unknown | 265 | discovery |
| Uganda Open Data API / ugandaopendataapi | - | 301 | redirect_https / redirect_not_approved | [free](https://data.ug) | 212 | discovery |
| UI Avatars / uiavatars | [GET](https://ui-avatars.com/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://ui-avatars.com) | 114 | discovery |
| UK Bank Holidays / ukbankholidays | - | 301 | redirect_https / redirect_not_approved | unknown | 232 | discovery |
| UK Government / opengovernmentuk | [GET](https://ckan.publishing.service.gov.uk/api/3/action/package_search?rows=1) | 200 | duplicate / duplicate | [free](https://ckan.publishing.service.gov.uk) | - | alias of opengovernmentuk |
| UK Government API / opengovernmentuk | [GET](https://ckan.publishing.service.gov.uk/api/3/action/package_search?rows=1) | 200 | duplicate / duplicate | [free](https://ckan.publishing.service.gov.uk) | - | alias of opengovernmentuk |
| Ultraleap Tracking / ultraleaptracking | [GET](https://www.ultraleap.com/tracking/) | 404 | wrong_base_url_path / http_error | unknown | 347 | discovery |
| umati / umati | [GET](https://umati.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 354 | discovery |
| Umeå Open Data / umeopendata | [GET](https://opendata.umea.se/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2512 | discovery |
| UN Data / undata | [GET](https://data.un.org/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.un.org) | 435 | discovery |
| UN Data API / undata | [GET](https://data.un.org/) | 200 | duplicate / duplicate | [free](https://data.un.org) | - | alias of undata |
| UniProt API / uniprotapi | [GET](https://rest.uniprot.org/uniprotkb/search?query=accession%3AP69905&format=json&size=1&fields=accession) | 200 | ok / ok_json | [free](https://www.uniprot.org/help/programmatic_access) | 310 | callable |
| University of Oslo / universityofoslo | [GET](https://data.uio.no/) | 406 | unresolved / http_error | unknown | 194 | discovery |
| Unsplash It / unsplashit | - | 301 | redirect_https / redirect_not_approved | unknown | 143 | discovery |
| Unsplash Resource / unsplashresource | [GET](https://source.unsplash.com/) | 503 | dead_upstream / http_error | unknown | 1176 | discovery |
| Urban Observatory / urbanobservatory | [GET](https://urbanobservatory.ac.uk/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 438 | discovery |
| URLhaus / urlhaus | [GET](https://urlhaus-api.abuse.ch/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 254 | discovery |
| Uruguay Open Data API / uruguayopendataapi | - | 0 | timeout / timeout | [free](https://catalogodatos.gub.uy) | 526 | discovery |
| US Presidential Election Data by TogaTech / uspresidentialelectiondatabytogatech | [GET](https://uselection.togatech.org/api/) | 404 | wrong_base_url_path / http_error | unknown | 742 | discovery |
| USAspending / usaspending | [GET](https://api.usaspending.gov/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1176 | discovery |
| USAspending API / usaspending | [GET](https://api.usaspending.gov/) | 200 | duplicate / duplicate | unknown | - | alias of usaspending |
| USAspending.gov / usaspending | [GET](https://api.usaspending.gov/) | 200 | duplicate / duplicate | unknown | - | alias of usaspending |
| UserAgent / useragent | - | 0 | dead_upstream / network_error | unknown | 78 | discovery |
| USGS / usgs | [GET](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=1&orderby=time) | 200 | ok / ok_json | [free](https://earthquake.usgs.gov/fdsnws/event/1/) | 2620 | callable |
| USGS Earthquake / usgsearthquake | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1027 | discovery |
| USGS Earthquake API / usgsearthquake | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | duplicate / duplicate | unknown | - | alias of usgsearthquake |
| USGS Earthquake Hazards / usgsearthquake | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | duplicate / duplicate | unknown | - | alias of usgsearthquake |
| USGS Earthquake Hazards Program / usgsearthquake | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | duplicate / duplicate | unknown | - | alias of usgsearthquake |
| USGS Water Services / usgswaterservices | [GET](https://waterservices.usgs.gov/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 739 | discovery |
| USPTO / uspto | [GET](https://www.uspto.gov/learning-and-resources/open-data-and-mobility/) | 404 | wrong_base_url_path / http_error | unknown | 427 | discovery |
| USPTO API / uspto | [GET](https://www.uspto.gov/learning-and-resources/open-data-and-mobility/) | 404 | duplicate / duplicate | unknown | - | alias of uspto |
| V2EX / v2ex | [GET](https://www.v2ex.com/p/7v9TEc53/) | 404 | wrong_base_url_path / http_error | unknown | 361 | discovery |
| Vadivelu HTTP Codes / vadiveluhttpcodes | - | 0 | dead_upstream / network_error | unknown | 36 | discovery |
| Valorant (non-official) / valorantapi | [GET](https://valorant-api.com/) | 200 | duplicate / duplicate | unknown | - | alias of valorantapi |
| Valorant API / valorantapi | [GET](https://valorant-api.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 322 | discovery |
| VCR.py / vcrpy | [GET](https://vcrpy.readthedocs.io/) | 200 | not_hosted_api / reviewed_exclusion | [free](https://vcrpy.readthedocs.io) | 1270 | discovery |
| Vector Express v2.0 / vectorexpressv20 | [GET](https://vector.express/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 572 | discovery |
| VeganCheck API / vegancheckapi | - | 303 | redirect_https / redirect_not_approved | unknown | 289 | discovery |
| Velib metropolis, Paris, France / velibmetropolisparisfrance | [GET](https://www.velib-metropole.fr/donnees-open-data-gbfs-du-service-velib-metropole/) | 403 | unresolved / access_denied | unknown | 218 | discovery |
| Vercel AI SDK / vercelaisdk | - | 301 | redirect_https / redirect_not_approved | [free](https://sdk.vercel.ai) | 369 | discovery |
| ViaCep / viacep | [GET](https://viacep.com.br/ws/01001000/json/) | 200 | ok / ok_json | [free](https://viacep.com.br/) | 519 | callable |
| Vietnam Open Data API / vietnamopendataapi | - | 0 | dead_upstream / network_error | [free](https://data.gov.vn) | 273 | discovery |
| VIN Decoder / vindecoder | [GET](https://vpic.nhtsa.dot.gov/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 547 | discovery |
| Vinli / vinli | - | 0 | dead_upstream / network_error | unknown | 37 | discovery |
| Virushee / virushee | - | 0 | dead_upstream / network_error | unknown | 35 | discovery |
| VK API / vkapi | - | 302 | redirect_https / redirect_not_approved | unknown | 874 | discovery |
| Vy / vy | [GET](https://www.vy.no/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 751 | discovery |
| WallstreetBets / wallstreetbets | - | 301 | redirect_https / redirect_not_approved | unknown | 264 | discovery |
| Warface (non-official) / warfacenonofficial | - | 0 | dead_upstream / network_error | unknown | 72 | discovery |
| Weatherstack / weatherstack | [GET](https://weatherstack.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 672 | discovery |
| Web3Modal / web3modal | - | 308 | redirect_https / redirect_not_approved | unknown | 99 | discovery |
| Website Carbon / websitecarbon | [GET](https://api.websitecarbon.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 113 | discovery |
| WebXR / webxr | [GET](https://immersiveweb.dev/) | 200 | not_hosted_api / reviewed_exclusion | unknown | 377 | discovery |
| Weebly / weebly | [GET](https://cloud-developer.weebly.com/) | 404 | wrong_base_url_path / http_error | unknown | 324 | discovery |
| WePay / wepay | - | 0 | redirect_https / tls_error | unknown | 269 | discovery |
| Wger Workout Manager / wgerworkoutmanager | [GET](https://wger.de/api/v2/exerciseinfo/?limit=1) | 200 | ok / ok_json | [free](https://wger.readthedocs.io/en/latest/index.html) | 290 | callable |
| WhiskyHunter / whiskyhunter | [GET](https://whiskyhunter.net/api/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 206 | discovery |
| Whitepages Pro / whitepagespro | - | 301 | redirect_https / redirect_not_approved | unknown | 122 | discovery |
| WHO / who | - | 301 | redirect_https / redirect_not_approved | unknown | 182 | discovery |
| Wikipedia / wikipedia | [GET](https://www.mediawiki.org/wiki/API:Main_page/) | 404 | wrong_base_url_path / http_error | unknown | 524 | discovery |
| Wikipedia API / wikipediaapi | [GET](https://en.wikipedia.org/w/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1616 | discovery |
| Wiktionary / wiktionary | [GET](https://en.wiktionary.org/w/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1580 | discovery |
| Wiktionary API / wiktionary | [GET](https://en.wiktionary.org/w/api.php/) | 200 | duplicate / duplicate | unknown | - | alias of wiktionary |
| Wolne Lektury / wolnelektury | [GET](https://wolnelektury.pl/api/kinds/) | 200 | ok / ok_json | [free](https://wolnelektury.pl/info/zasady-wykorzystania/) | 535 | callable |
| Working Nomads / workingnomads | - | 301 | redirect_https / redirect_not_approved | unknown | 826 | discovery |
| Worktile / worktile | [GET](https://dev.worktile.com/document/overview/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1145 | discovery |
| World Bank / worldbank | [GET](https://api.worldbank.org/v2/country?format=json&per_page=1) | 200 | ok / ok_json | [free](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation) | 129 | callable |
| World Bank API / worldbank | [GET](https://api.worldbank.org/v2/country?format=json&per_page=1) | 200 | duplicate / duplicate | [free](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation) | - | alias of worldbank |
| World Flora Online / worldfloraonline | - | 0 | redirect_https / tls_error | unknown | 859 | discovery |
| WorldTimeAPI / worldtimeapi | - | 0 | unresolved / network_error | [free](https://worldtimeapi.org/) | 149 | discovery |
| Wunderground / wunderground | [GET](https://www.wunderground.com/weather/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2066 | discovery |
| xColors / xcolors | [GET](https://x-colors.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 527 | discovery |
| xeno-canto / xenocanto | [GET](https://xeno-canto.org/explore/api/) | 404 | wrong_base_url_path / http_error | unknown | 199 | discovery |
| xMath / xmath | [GET](https://x-math.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 592 | discovery |
| XMPP / xmpp | [GET](https://xmpp.org/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://xmpp.org) | 848 | discovery |
| Y.js / yjs | [GET](https://yjs.dev/) | 200 | not_hosted_api / reviewed_exclusion | unknown | 337 | discovery |
| Yandex / yandex | - | 301 | redirect_https / redirect_not_approved | unknown | 528 | discovery |
| Yes No / yesno | [GET](https://yesno.wtf/api) | 200 | ok / ok_json | [free](https://yesno.wtf/) | 348 | callable |
| Youku / youku | [GET](https://doc.open.youku.com/) | 404 | wrong_base_url_path / http_error | unknown | 1079 | discovery |
| YR / metnorway | [GET](https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75) | 200 | ok / ok_json | [free](https://api.met.no/doc/TermsOfService) | 213 | callable |
| Yr.no / yrno | [GET](https://api.met.no/weatherapi/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 204 | discovery |
| Yu-Gi-Oh / yugioh-3632c0c5 | [GET](https://db.ygoprodeck.com/api/v7/cardinfo.php?id=6983839) | 200 | ok / ok_json | [free](https://ygoprodeck.com/api-guide/) | 118 | callable |
| Yu-Gi-Oh! API / yugioh-87bf1c6d | [GET](https://db.ygoprodeck.com/api-guide/) | 301 | duplicate / duplicate | unknown | - | alias of yugioh |
| Z-Wave / zwave | [GET](https://z-wavealliance.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 522 | discovery |
| Zed / zed | [GET](https://zed.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 683 | discovery |
| Zen Quotes / zenquotes | [GET](https://zenquotes.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2639 | discovery |
| Zen Quotes API / zenquotesapi | [GET](https://zenquotes.io/api/) | 200 | ok / ok_json | [free](https://zenquotes.io/api) | 1467 | callable |
| Zettlr / zettlr | [GET](https://zettlr.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 325 | discovery |
| Zigbee / zigbee | - | 301 | redirect_https / redirect_not_approved | unknown | 286 | discovery |
| Ziptastic / ziptastic | [GET](https://ziptasticapi.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 757 | discovery |
| ZMOK / zmok | [GET](https://zmok.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 999 | discovery |
| Zoo Animals / zooanimals | [GET](https://zoo-animal-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 519 | discovery |
| Zoo Animals API / zooanimals | [GET](https://zoo-animal-api.herokuapp.com/) | 404 | duplicate / duplicate | unknown | - | alias of zooanimals |
| 0x API Protocol API / 0xapiprotocolapi | - | 0 | needs_key / reviewed_exclusion | [free](https://0xapi.finance/docs) | 310 | discovery |
| 18F / 18f | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| 1inch API / 1inchapi | [GET](https://docs.1inch.io/) | 0 | needs_key / reviewed_exclusion | [free](https://docs.1inch.io) | 0 | discovery |
| 1inch Protocol API / 1inchprotocolapi | - | 0 | needs_key / reviewed_exclusion | [free](https://1inch.finance/docs) | 480 | discovery |
| 1pt / 1pt | [GET](https://github.com/1pt-co/api/blob/main/README.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| 4chan / 4chan | [GET](https://github.com/4chan/4chan-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| 7Timer! / 7timer | [GET](https://www.7timer.info/doc.php?lang=en) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 316 | discovery |
| Aave API / aaveapi | [GET](https://docs.aave.com/developers/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Aave Protocol API / aaveprotocolapi | - | 301 | redirect_https / redirect_not_approved | [free](https://aave.finance/docs) | 538 | discovery |
| AcgClub / acgclub | [GET](https://github.com/Rabtman/AcgClub/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Adidas AG / adidasag | [GET](https://developers.adidas.com/services/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| administrative-divisons-db / administrativedivisonsdb | [GET](https://github.com/kamikazechaser/administrative-divisions-db/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Adorable Avatars / adorableavatars | - | 0 | dead_upstream / network_error | [free](http://avatars.adorable.io) | 75 | discovery |
| Advice Slip / adviceslip | [GET](https://api.adviceslip.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 310 | discovery |
| Aeris Weather / aerisweather | - | 301 | redirect_https / redirect_not_approved | unknown | 439 | discovery |
| Alidayu / alidayu | [GET](https://www.alidayu.com/) | 404 | wrong_base_url_path / http_error | unknown | 1324 | discovery |
| Amap / amap | - | 0 | timeout / timeout | unknown | 1195 | discovery |
| Amazon Alexa / amazonalexa | [GET](https://developer.amazon.com/public/solutions/alexa/alexa-voice-service/content/avs-api-overview/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Amazon Cloud Drive / amazonclouddrive | [GET](https://developer.amazon.com/amazon-drive/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Amazon Maps API / amazonmapsapi | [GET](https://developer.amazon.com/maps/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Amazon Mobile Ads / amazonmobileads | [GET](https://developer.amazon.com/mobile-ads/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Amazon S3 / amazons3 | - | 301 | gateway_block / gateway_block | unknown | 305 | discovery |
| Animal Crossing NH / animalcrossingnewhorizons | - | 0 | duplicate / duplicate | unknown | - | alias of animalcrossingnewhorizons |
| Animal Crossing: New Horizons / animalcrossingnewhorizons | - | 0 | redirect_https / tls_error | unknown | 503 | discovery |
| AnimeChan / animechan | [GET](https://github.com/RocktimSaikia/anime-chan/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| AnimeFacts / animefacts | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Apple Vision Pro SDK / applevisionprosdk | [GET](https://developer.apple.com/visionos/) | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Apprise API / appriseapi | [GET](https://github.com/caronc/apprise/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Aramex / aramex | [GET](https://www.aramex.com/developers/aramex-apis/) | 403 | unresolved / access_denied | unknown | 359 | discovery |
| Arbeitnow / arbeitnow | [GET](https://documenter.getpostman.com/view/18545278/UVJbJdKh/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Archive.org / archiveorg | [GET](https://archive.readme.io/docs/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Arize AI / arizeai | [GET](https://docs.arize.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Art Institute of Chicago / artinstituteofchicago | [GET](https://api.artic.edu/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 838 | discovery |
| Art Institute of Chicago API / artinstituteofchicagoapi | [GET](https://api.artic.edu/api/v1/artworks?limit=1&fields=id,title) | 200 | ok / ok_json | [free](https://api.artic.edu/docs/) | 287 | callable |
| Arthur AI / arthurai | [GET](https://docs.arthur.ai/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| ARTIK Cloud / artikcloud | [GET](https://developer.artik.cloud/documentation/api-reference/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| AT&T M2X / attm2x | - | 0 | dead_upstream / network_error | unknown | 28 | discovery |
| Atom Finance / atomfinance | [GET](https://docs.atom.finance/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Autochess VNG / autochessvng | [GET](https://github.com/didadadida93/autochess-vng-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Autochess VNG API / autochessvng | [GET](https://github.com/didadadida93/autochess-vng-api/) | 0 | duplicate / duplicate | unknown | - | alias of autochessvng |
| AutoGen / autogen | [GET](https://github.com/microsoft/autogen/) | 0 | not_hosted_api / reviewed_exclusion | [free](https://github.com/microsoft/autogen) | 0 | discovery |
| Automatic / automatic | [GET](https://developer.automatic.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Avatar Data / avatardata | - | 0 | redirect_https / tls_error | unknown | 695 | discovery |
| AviationAPI / aviationapi | - | 0 | dead_upstream / network_error | [free](https://docs.aviationapi.com/) | 4 | discovery |
| BackstopJS API / backstopjsapi | [GET](https://github.com/garris/BackstopJS/) | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| BACnet / bacnet | - | 301 | redirect_https / redirect_not_approved | unknown | 233 | discovery |
| Baidu API STORE / baiduapistore | - | 301 | redirect_https / redirect_not_approved | unknown | 2100 | discovery |
| Baidu Map / baidumap | [GET](https://lbsyun.baidu.com/index.php?title=webapi) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 3676 | discovery |
| Baidu Translate / baidutranslate | - | 301 | redirect_https / redirect_not_approved | unknown | 2202 | discovery |
| Baidu Yuyin / baiduyuyin | - | 301 | redirect_https / redirect_not_approved | unknown | 2360 | discovery |
| Balancer Protocol API / balancerprotocolapi | - | 301 | redirect_https / redirect_not_approved | [free](https://balancer.finance/docs) | 248 | discovery |
| Bambora / bambora | [GET](https://developer.bambora.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bannerbear / bannerbear | [GET](https://www.bannerbear.com/docs/) | 404 | wrong_base_url_path / http_error | unknown | 473 | discovery |
| Bark / bark | [GET](https://github.com/suno-ai/bark/) | 0 | wrong_base_url_path / documentation_url | [free](https://github.com/suno-ai/bark) | 0 | discovery |
| Barter.VG / bartervg | [GET](https://github.com/bartervg/barter.vg/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| BCLaws / bclaws | [GET](https://www.bclaws.gov.bc.ca/civix/template/complete/api/index.html/) | 406 | unresolved / http_error | unknown | 933 | discovery |
| Besin API (Turkish) / besinapiturkish | [GET](https://github.com/topics/food-database/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bible API wldeh / bibleapiwldeh | [GET](https://github.com/wldeh/bible-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bible-api / bibleapi | [GET](https://bible-api.com/) | 200 | duplicate / duplicate | unknown | - | alias of bibleapi |
| Bitcambio / bitcambio | [GET](https://nova.bitcambio.com.br/api/v3/docs) | 403 | unresolved / access_denied | unknown | 193 | discovery |
| Bitcoin / bitcoin | [GET](https://developer.bitcoin.org/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bitcoin Developer / bitcoin | [GET](https://developer.bitcoin.org/) | 0 | duplicate / duplicate | unknown | - | alias of bitcoin |
| Bitcoin Developer API / bitcoin | [GET](https://developer.bitcoin.org/) | 0 | duplicate / duplicate | unknown | - | alias of bitcoin |
| BlockScore / blockscore | [GET](https://docs.blockscore.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| BNB Chain API / bnbchainapi | [GET](https://docs.bnbchain.org/docs/beaconchain/develop/api-reference/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bob's Burgers API / bobsburgersapi | [GET](https://bobsburgers-api.herokuapp.com/characters?limit=1) | 200 | ok / ok_json | [free](https://www.bobsburgersapi.com/documentation) | 638 | callable |
| BOM API / bomapi | [GET](https://www.bom.gov.au/catalogue/data-feeds.shtml/) | 403 | unresolved / access_denied | [free](http://www.bom.gov.au/catalogue/data-feeds.shtml) | 214 | discovery |
| Bond / bond | [GET](https://docs.bond.tech/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bookshare / bookshare | [GET](https://developer.bookshare.org/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bored API / boredapi | - | 0 | dead_upstream / network_error | [free](https://www.boredapi.com/documentation) | 3 | discovery |
| BosonNLP / bosonnlp | [GET](https://docs.bosonnlp.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| BotsArchive / botsarchive | [GET](https://botsarchive.com/docs.html/) | 404 | wrong_base_url_path / http_error | unknown | 208 | discovery |
| Brazilian Chamber of Deputies Open Data / brazilianchamberofdeputiesopendata | [GET](https://dadosabertos.camara.leg.br/swagger/api.html/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 3987 | discovery |
| Brazilian Vehicles and Prices / brazilianvehiclesandprices | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Breaking Bad / breakingbad | - | 0 | dead_upstream / network_error | unknown | 26 | discovery |
| Breaking Bad API / breakingbad | - | 0 | duplicate / duplicate | unknown | - | alias of breakingbad |
| Breaking Bad Quotes / breakingbadquotes | [GET](https://github.com/shevabam/breaking-bad-quotes/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| BreweryDB / brewerydb | [GET](https://www.brewerydb.com/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2727 | discovery |
| British National Bibliography / britishnationalbibliography | - | 0 | unresolved / network_error | unknown | 4194 | discovery |
| Budbee / budbee | [GET](https://developer.budbee.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Buffy the Vampire Slayer API / buffythevampireslayerapi | [GET](https://github.com/Thatskat/btvs-angel-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Caiyun Weather / caiyunweather | [GET](https://caiyunapp.com/index.html) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1165 | discovery |
| Canada Post / canadapost | - | 302 | redirect_https / redirect_not_approved | unknown | 238 | discovery |
| CarQuery / carquery | - | 0 | redirect_https / tls_error | unknown | 362 | discovery |
| Cartes.io / cartesio | [GET](https://github.com/M-Media-Group/Cartes.io/wiki/API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| CartoDB / cartodb | [GET](https://carto.com/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1273 | discovery |
| Cat Facts / catfacts | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Cat Ipsum / catipsum | - | 0 | redirect_https / tls_error | unknown | 379 | discovery |
| Catalogopolis / catalogopolis | - | 0 | dead_upstream / network_error | unknown | 80 | discovery |
| Catch The Show / catchtheshow | [GET](https://catchtheshow.herokuapp.com/api/documentation/) | 404 | wrong_base_url_path / http_error | unknown | 524 | discovery |
| CBM Myanmar Forex / cbmmyanmarforex | [GET](https://forex.cbm.gov.mm/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 565 | discovery |
| CDC / cdc | [GET](https://www.cdc.gov/apis.html/) | 404 | wrong_base_url_path / http_error | unknown | 392 | discovery |
| Census.gov / censusgov | [GET](https://www.census.gov/data/developers/data-sets.html/) | 404 | wrong_base_url_path / http_error | unknown | 566 | discovery |
| Cep.la / cepla | [GET](https://cep.la/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 633 | discovery |
| CERN Open Data / cernopendata | [GET](https://opendata.cern.ch/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 461 | discovery |
| Chainlink API / chainlinkapi | [GET](https://docs.chain.link/) | 0 | wrong_base_url_path / documentation_url | [free](https://docs.chain.link) | 0 | discovery |
| ChartLyrics / chartlyrics | - | 0 | redirect_https / tls_error | unknown | 253 | discovery |
| Cheese Ipsum / cheeseipsum | - | 301 | redirect_https / redirect_not_approved | unknown | 352 | discovery |
| ChEMBL API / chemblapi | [GET](https://www.ebi.ac.uk/chembl/api/data/molecule.json?limit=1) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/chembl/api/data/docs) | 2491 | callable |
| Chinese Character Web / chinesecharacterweb | - | 0 | redirect_https / tls_error | unknown | 526 | discovery |
| Chroma / chroma | [GET](https://docs.trychroma.com/) | 0 | wrong_base_url_path / documentation_url | [free](https://docs.trychroma.com) | 0 | discovery |
| Chronicling America / chroniclingamerica | - | 308 | redirect_https / redirect_not_approved | unknown | 238 | discovery |
| Chuck Norris Database / chucknorrisdatabase | - | 301 | redirect_https / redirect_not_approved | unknown | 708 | discovery |
| Church Calendar / churchcalendar | - | 0 | dead_upstream / network_error | unknown | 83 | discovery |
| Ciprand / ciprand | [GET](https://github.com/polarspetroll/ciprand/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| City, Gdynia / citygdynia | [GET](https://otwartedane.gdynia.pl/en/api_doc.html/) | 404 | wrong_base_url_path / http_error | unknown | 1059 | discovery |
| City, Prague Open Data / citypragueopendata | - | 301 | redirect_https / redirect_not_approved | unknown | 276 | discovery |
| Citybikes / citybikes-5671f659 | [GET](https://citybik.es/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 491 | discovery |
| CitySDK / citysdk | [GET](https://www.citysdk.eu/citysdk-toolkit/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1276 | discovery |
| CleanURI / cleanuri | - | 0 | timeout / timeout | unknown | 20001 | discovery |
| Cloud Machine Learning Engine / cloudmachinelearningengine | [GET](https://cloud.google.com/ml-engine/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1258 | discovery |
| Cloudflare Trace / cloudflaretrace | [GET](https://github.com/fawazahmed0/cloudflare-trace-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| CO2 Offset / co2offset | - | 302 | redirect_https / redirect_not_approved | unknown | 165 | discovery |
| CO2 Offset API / co2offset | - | 302 | duplicate / duplicate | unknown | - | alias of co2offset |
| Coactive AI / coactiveai | - | 301 | redirect_https / redirect_not_approved | unknown | 1250 | discovery |
| Codestral / codestral | [GET](https://docs.mistral.ai/capabilities/code_generation/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Codex / codex | [GET](https://github.com/Jaagrav/CodeX/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| CodeX Compiler / codex | [GET](https://github.com/Jaagrav/CodeX/) | 0 | duplicate / duplicate | unknown | - | alias of codex |
| CoinCap / coincap | [GET](https://docs.coincap.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| CoinDesk Bitcoin Price Index / coindeskbitcoinpriceindex | [GET](https://www.coindesk.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1143 | discovery |
| CoinDesk BPI / coindeskbitcoinpriceindex | [GET](https://www.coindesk.com/api/) | 200 | duplicate / duplicate | unknown | - | alias of coindeskbitcoinpriceindex |
| CoinGecko / coingecko | [GET](https://www.coingecko.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 2304 | discovery |
| CoinGecko API / coingeckoapi | - | 301 | gateway_block / gateway_block | freemium | 2954 | discovery |
| CoinStats / coinstats | [GET](https://documenter.getpostman.com/view/5734027/RzZ6Hzr3?version=latest) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Collector Bank / collectorbank | [GET](https://developer.collectorbank.se/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Colormind / colormind | [GET](https://colormind.io/api-access/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 487 | discovery |
| ColourLovers / colourlovers | [GET](https://www.colourlovers.com/api/) | 403 | unresolved / access_denied | unknown | 1030 | discovery |
| Comic Vine / comicvine | [GET](https://comicvine.gamespot.com/api/documentation/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1460 | discovery |
| Comichron Data / comichrondata | [GET](https://github.com/comichron-data/api/) | 0 | wrong_base_url_path / documentation_url | [free](https://github.com/comichron-data/api) | 0 | discovery |
| Comichron Data API / comichrondata | [GET](https://github.com/comichron-data/api/) | 0 | duplicate / duplicate | unknown | - | alias of comichrondata |
| Commerce Layer / commercelayer | [GET](https://docs.commercelayer.io/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Community Transit / communitytransit | [GET](https://github.com/transitland/transitland-datastore/blob/master/README.md) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Compound API / compoundapi | - | 302 | redirect_https / redirect_not_approved | unknown | 208 | discovery |
| Compound Protocol API / compoundapi | - | 302 | duplicate / duplicate | [free](https://compound.finance/docs) | - | alias of compoundapi |
| Concur Labs / concurlabs | [GET](https://developer.concur.com/api-reference/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Context.IO / contextio | - | 0 | dead_upstream / network_error | unknown | 580 | discovery |
| Continue / continue | [GET](https://docs.continue.dev/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Convex Finance Protocol API / convexfinanceprotocolapi | [GET](https://convex.finance/docs/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://convex.finance/docs) | 516 | discovery |
| Coronavirus in the UK / coronavirusintheuk | - | 301 | redirect_https / redirect_not_approved | unknown | 196 | discovery |
| Corporate Buzz Words / corporatebuzzwords | [GET](https://github.com/sameerkumar18/corporate-bs-generator-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| CORS Proxy / corsproxy | [GET](https://github.com/burhanuday/cors-proxy/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Cosmos API / cosmosapi | [GET](https://docs.cosmos.network/main/modules/staking/05_client/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Country / country | [GET](https://country.is/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 137 | discovery |
| Country.io / countryio | [GET](https://country.io/) | 200 | wrong_base_url_path / html_instead_of_api | [free](http://country.io) | 396 | discovery |
| Country.io API / countryio | [GET](https://country.io/) | 200 | duplicate / duplicate | unknown | - | alias of countryio |
| Covid-19 / covid19 | [GET](https://github.com/M-Media-Group/Covid-19-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| COVID-19 Data / covid19 | [GET](https://github.com/M-Media-Group/Covid-19-API/) | 0 | duplicate / duplicate | unknown | - | alias of covid19 |
| COVID-19 Data API / covid19 | [GET](https://github.com/M-Media-Group/Covid-19-API/) | 0 | duplicate / duplicate | [free](https://github.com/M-Media-Group/Covid-19-API) | - | alias of covid19 |
| Covid-19 Live Data / covid19livedata | [GET](https://github.com/mathdroid/covid-19-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Covid-19 Philippines / covid19philippines | [GET](https://github.com/Simperfy/Covid-19-API-Philippines-DOH/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Cross Universe / crossuniverse | [GET](https://crossuniverse.psychpsyo.com/apiDocs.html/) | 522 | dead_upstream / http_error | unknown | 19910 | discovery |
| Crossref Metadata / crossrefmetadata | [GET](https://github.com/CrossRef/rest-api-doc/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Crossref Metadata Search / crossrefmetadata | [GET](https://github.com/CrossRef/rest-api-doc/) | 0 | duplicate / duplicate | unknown | - | alias of crossrefmetadata |
| CryptAPI / cryptapi | [GET](https://docs.cryptapi.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| ctrip / ctrip | - | 302 | redirect_https / redirect_not_approved | unknown | 1316 | discovery |
| Cupcake Ipsum / cupcakeipsum | - | 301 | redirect_https / redirect_not_approved | unknown | 575 | discovery |
| Currency-api / currencyapi | [GET](https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json) | 200 | ok / ok_json | [free](https://github.com/fawazahmed0/exchange-api) | 181 | callable |
| Curve Finance Protocol API / curvefinanceprotocolapi | - | 307 | redirect_https / redirect_not_approved | [free](https://curve.finance/docs) | 234 | discovery |
| Czech Television / czechtelevision | [GET](https://www.ceskatelevize.cz/xml/tv-program/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1186 | discovery |
| Dangdang / dangdang | [GET](https://open.dangdang.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1218 | discovery |
| Data.gov API / datagovapi | - | 301 | redirect_https / redirect_not_approved | unknown | 950 | discovery |
| Daum Maps API / daummapsapi | - | 0 | dead_upstream / network_error | unknown | 84 | discovery |
| Deck of Cards / deckofcards | [GET](https://deckofcardsapi.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 299 | discovery |
| Dehash.lt / dehashlt | [GET](https://github.com/Dehash-lt/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Detox API / detoxapi | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| DeviantArt API / deviantartapi | - | 301 | gateway_block / gateway_block | unknown | 323 | discovery |
| DHL / dhl | - | 0 | timeout / timeout | unknown | 20005 | discovery |
| Dictum / dictum | [GET](https://github.com/fisenkodv/dictum/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Digimon TCG / digimontcg | [GET](https://documenter.getpostman.com/view/14059948/TzecB4fH/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Disease.sh / diseasesh | [GET](https://disease.sh/v3/covid-19/countries/Sweden?strict=true) | 200 | ok / ok_json | [free](https://disease.sh/docs/) | 257 | callable |
| District of Columbia Open Data / districtofcolumbiaopendata | [GET](https://opendata.dc.gov/pages/using-apis/) | 404 | wrong_base_url_path / http_error | unknown | 653 | discovery |
| Document Cloud / documentcloud | - | 301 | redirect_https / redirect_not_approved | unknown | 108 | discovery |
| Dog Facts / dogfacts | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Dog Facts API / dogfactsapi | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Doge-Meme / dogememe | - | 0 | dead_upstream / network_error | unknown | 81 | discovery |
| dondeEsta Family / dondeestafamily | [GET](https://docs.dondeesta.apiary.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Dotdigital / dotdigital | [GET](https://developer.dotdigital.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Dune / dune | [GET](https://github.com/ywalia01/dune-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Dune API / dune | [GET](https://github.com/ywalia01/dune-api/) | 0 | duplicate / duplicate | unknown | - | alias of dune |
| Dungeons and Dragons / dungeonsanddragons | - | 302 | gateway_block / gateway_block | unknown | 731 | discovery |
| DWD API / dwdapi | [GET](https://www.dwd.de/DE/leistungen/opendata/opendata.html/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.dwd.de/DE/leistungen/opendata/opendata.html) | 580 | discovery |
| Dyte / dyte | [GET](https://docs.dyte.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Economia.Awesome / economiaawesome | [GET](https://docs.awesomeapi.com.br/api-de-moedas/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Eden AI / edenai | [GET](https://docs.edenai.co/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| elong / elong | [GET](https://open.elong.com/home/index/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1473 | discovery |
| EmailRep / emailrep | [GET](https://docs.emailrep.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| EmojiHub / emojihub | [GET](https://github.com/cheatsnake/emojihub/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| envoice / envoice | [GET](https://www.envoice.in/reference/api/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 334 | discovery |
| Envoy / envoy | [GET](https://developers.envoy.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| EPA / epa | [GET](https://www.epa.gov/developers/data-data-products) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1785 | discovery |
| Ergast F1 / ergastf1 | [GET](https://ergast.com/mrd/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1096 | discovery |
| Ergast Formula 1 / ergastf1 | [GET](https://ergast.com/mrd/) | 200 | duplicate / duplicate | unknown | - | alias of ergastf1 |
| Escape / escape | [GET](https://github.com/polarspetroll/EscapeAPI/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| ESP8266 Sensors API / esp8266sensorsapi | [GET](https://github.com/wouterds/esp8266-nodemcu-sensors/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| ExtendsClass JSON Storage / extendsclassjsonstorage | [GET](https://extendsclass.com/json-storage.html/) | 404 | wrong_base_url_path / http_error | unknown | 746 | discovery |
| EXUDE-API / exudeapi | [GET](https://uttesh.com/exude-api/) | 404 | wrong_base_url_path / http_error | unknown | 348 | discovery |
| Facebook API / facebookapi | [GET](https://developers.facebook.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Facebook Games Services / facebookgamesservices | [GET](https://developers.facebook.com/docs/games/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Facebook Login / facebooklogin | [GET](https://developers.facebook.com/docs/facebook-login/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| FakerAPI / fakerapi-db40a6a8 | [GET](https://fakerapi.it/en/) | 502 | dead_upstream / http_error | unknown | 1236 | discovery |
| FCC API / fccapi | [GET](https://www.fcc.gov/developers/) | 403 | unresolved / access_denied | unknown | 108 | discovery |
| Federal Register API / federalregisterapi | - | 302 | redirect_https / redirect_not_approved | unknown | 388 | discovery |
| Final Space / finalspace | [GET](https://finalspaceapi.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 495 | discovery |
| Final Space API / finalspaceapi | [GET](https://finalspaceapi.com/api/v0/character/1) | 200 | ok / ok_json | [free](https://finalspaceapi.com/docs/) | 99 | callable |
| FishWatch / fishwatch | - | 301 | redirect_https / redirect_not_approved | unknown | 488 | discovery |
| FishWatch API / fishwatch | - | 301 | duplicate / duplicate | unknown | - | alias of fishwatch |
| Fit-n-Bites API / fitnbitesapi | [GET](https://github.com/topics/food-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Flowise / flowise | [GET](https://docs.flowiseai.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| FOAAS / foaas | [GET](https://www.foaas.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 271 | discovery |
| Foam / foam | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| FollowUp.cc / followupcc | [GET](https://docs.followup.cc/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Food Standards Agency / foodstandardsagency | [GET](https://ratings.food.gov.uk/open-data/en-GB/) | 404 | wrong_base_url_path / http_error | unknown | 1064 | discovery |
| Foodish / foodish | [GET](https://github.com/surhud004/Foodish) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Football Database / footballdatabase | [GET](https://github.com/oritzio/football-database/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Football Standings / footballstandings | [GET](https://github.com/azharimm/football-standings-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Forismatic / forismatic | [GET](https://forismatic.com/en/api/) | 520 | dead_upstream / http_error | unknown | 181 | discovery |
| Fortnox / fortnox | [GET](https://developer.fortnox.se/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Forza / forza | [GET](https://docs.forza-api.tk/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Free Url Shortener / freeurlshortener | [GET](https://ulvis.net/developer.html/) | 404 | wrong_base_url_path / http_error | unknown | 450 | discovery |
| Fruits API / fruitsapi | [GET](https://github.com/Franqsanz/fruits-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Fruits API GraphQL / fruitsapi | [GET](https://github.com/Franqsanz/fruits-api/) | 0 | duplicate / duplicate | unknown | - | alias of fruitsapi |
| Gaana / gaana | [GET](https://github.com/cyberboysumanjay/GaanaAPI/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Gaana API / gaana | [GET](https://github.com/cyberboysumanjay/GaanaAPI/) | 0 | duplicate / duplicate | unknown | - | alias of gaana |
| gank.io / gankio | - | 0 | timeout / timeout | unknown | 10279 | discovery |
| Geek-Jokes / geekjokes | [GET](https://github.com/sameerkumar18/geek-joke-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Gemini / gemini | [GET](https://docs.gemini.com/rest-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Gemini API / gemini | [GET](https://docs.gemini.com/rest-api/) | 0 | duplicate / duplicate | unknown | - | alias of gemini |
| Gene Ontology API / geneontologyapi | [GET](https://api.geneontology.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 312 | discovery |
| GeoApi / geoapi | - | 301 | redirect_https / redirect_not_approved | unknown | 631 | discovery |
| GeoApi France / geoapi | - | 301 | duplicate / duplicate | unknown | - | alias of geoapi |
| GeoNames / geonames | [GET](https://www.geonames.org/export/web-services.html/) | 404 | wrong_base_url_path / http_error | unknown | 343 | discovery |
| GitHub Authentication / githubauthentication | [GET](https://developer.github.com/guides/basics-of-authentication/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GitHub Licenses API / githublicensesapi | [GET](https://developer.github.com/v3/licenses/) | 0 | wrong_base_url_path / documentation_url | [free](https://developer.github.com/v3/licenses) | 0 | discovery |
| GitHub ReadMe Stats / githubreadmestats | [GET](https://github.com/anuraghazra/github-readme-stats/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GMX Protocol API / gmxprotocolapi | - | 0 | timeout / timeout | [free](https://gmx.finance/docs) | 10439 | discovery |
| Google AdSense / googleadsense | [GET](https://developers.google.com/adsense/?hl=en) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Assistant / googleassistant | [GET](https://developers.google.com/actions/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Barcode / googlebarcode | [GET](https://developers.google.com/vision/barcodes-overview?hl=en) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Charts / googlecharts | [GET](https://developers.google.com/chart/interactive/docs/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Cloud Prediction / googlecloudprediction | [GET](https://cloud.google.com/prediction/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2405 | discovery |
| Google CustomSearch API / googlecustomsearchapi | [GET](https://developers.google.com/custom-search/json-api/v1/overview/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Fitness API / googlefitnessapi | [GET](https://developers.google.com/fit/?hl=en) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Fonts API / googlefontsapi | [GET](https://developers.google.com/fonts/?hl=en) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Maps Directions / googlemapsdirections | [GET](https://developers.google.com/maps/documentation/directions/overview/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Play Developer / googleplaydeveloper | [GET](https://developers.google.com/android-publisher/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Play Games Services / googleplaygamesservices | [GET](https://developers.google.com/games/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GoTiny / gotiny | [GET](https://github.com/robvanbakel/gotiny-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GovTrack / govtrack | [GET](https://www.govtrack.us/developers/api/) | 403 | unresolved / access_denied | unknown | 163 | discovery |
| Graph Countries / graphcountries | [GET](https://github.com/lennertVanSever/graphcountries/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GraphQL Pokemon / graphqlpokemon | [GET](https://github.com/favware/graphql-pokemon/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GTFS / gtfs | [GET](https://gtfs.org/documentation/) | 403 | unresolved / access_denied | [free](https://gtfs.org/documentation) | 560 | discovery |
| Guerrilla Mail / guerrillamail | [GET](https://www.guerrillamail.com/GuerrillaMailAPI.html/) | 404 | wrong_base_url_path / http_error | unknown | 495 | discovery |
| GurbaniNow / gurbaninow | [GET](https://github.com/GurbaniNow/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GW2Spidy / gw2spidy | [GET](https://github.com/rubensayshi/gw2spidy/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Hacker News / hackernews | [GET](https://github.com/HackerNews/API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Hacker News API / hackernewsapi | [GET](https://hacker-news.firebaseio.com/v0/item/8863.json) | 200 | ok / ok_json | [free](https://github.com/HackerNews/API) | 382 | callable |
| HackerNews / hackernews | [GET](https://github.com/HackerNews/API/) | 0 | duplicate / duplicate | unknown | - | alias of hackernews |
| HaoService / haoservice | - | 0 | dead_upstream / network_error | unknown | 297 | discovery |
| Healthcare.gov / healthcaregov | [GET](https://www.healthcare.gov/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 409 | discovery |
| Helium / helium | [GET](https://docs.helium.com/api/blockchain/introduction/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Helium API / helium | [GET](https://docs.helium.com/api/blockchain/introduction/) | 0 | duplicate / duplicate | unknown | - | alias of helium |
| HERE Routing / hererouting | [GET](https://developer.here.com/documentation/routing-api/dev_guide/index.html/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Home Depot / homedepot | [GET](https://developer.homedepot.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Home8 / home8 | [GET](https://developer.home8systems.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Homey / homey | [GET](https://developers.athom.com/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Hong Kong Obervatory / hongkongobervatory | [GET](https://www.hko.gov.hk/en/abouthko/opendata_intro.htm/) | 404 | wrong_base_url_path / http_error | unknown | 1997 | discovery |
| HP Print / hpprint | [GET](https://developers.hp.com/printos/printos/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| HSL / hsl | [GET](https://digitransit.fi/en/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 317 | discovery |
| HTTPCat / httpcat | [GET](https://http.cat/) | 200 | duplicate / duplicate | unknown | - | alias of httpcat |
| HTTPDog / httpdog | [GET](https://http.dog/) | 200 | duplicate / duplicate | unknown | - | alias of httpdog |
| Hume AI / humeai | [GET](https://dev.hume.ai/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2956 | discovery |
| Hyrule Compendium / hyrulecompendium | [GET](https://github.com/gadhagod/Hyrule-Compendium-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| IBGE / ibge | - | 0 | redirect_https / tls_error | unknown | 777 | discovery |
| Icelandic APIs / icelandicapis | [GET](https://docs.apis.is/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| iciba / iciba | [GET](https://open.iciba.com/?c=api) | 666 | dead_upstream / http_error | unknown | 1295 | discovery |
| iDigBio / idigbio | [GET](https://github.com/idigbio/idigbio-search-api/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| IMDbOT / imdbot | [GET](https://github.com/SpEcHiDe/IMDbOT/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Inbox / inbox | - | 307 | redirect_https / redirect_not_approved | unknown | 244 | discovery |
| indoona / indoona | [GET](https://developer.indoona.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Indrz / indrz | [GET](https://github.com/indrz/indrz/) | 0 | wrong_base_url_path / documentation_url | [free](https://github.com/indrz/indrz) | 0 | discovery |
| INEGI Mexico Stats / inegimexicostats | [GET](https://www.inegi.org.mx/servicios/api_indicadores.html/) | 406 | unresolved / http_error | unknown | 1571 | discovery |
| INEI / inei | - | 0 | timeout / timeout | unknown | 10125 | discovery |
| Inoreader / inoreader | [GET](https://www.inoreader.com/developers/) | 200 | unresolved / invalid_response | unknown | 864 | discovery |
| INPE Brazil Weather / inpebrazilweather | [GET](https://servicos.cptec.inpe.br/XML/) | 403 | unresolved / access_denied | unknown | 2348 | discovery |
| Inshorts News / inshortsnews | [GET](https://github.com/cyberboysumanjay/Inshorts-News-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Inspiration / inspiration | - | 0 | dead_upstream / network_error | unknown | 276 | discovery |
| inspirehep.net / inspirehepnet | [GET](https://github.com/inspirehep/rest-api-doc/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Instathings Gate / instathingsgate | [GET](https://github.com/Instathings/gate/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Instructor / instructor | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| ip-api / ipapi | [GET](https://ip-api.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1329 | discovery |
| ip-fast.com / ipfastcom | - | 302 | redirect_https / redirect_not_approved | unknown | 989 | discovery |
| IPinfo / ipinfo | [GET](https://ipinfo.io/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1225 | discovery |
| iqiyi / iqiyi | [GET](https://open.iqiyi.com/lib/scheme.html/) | 503 | dead_upstream / http_error | unknown | 1742 | discovery |
| ISTAT Italy / istatitaly | [GET](https://www.istat.it/en/information-and-services/developers/) | 404 | wrong_base_url_path / http_error | unknown | 2165 | discovery |
| Italian ISTAT API / istatitaly | [GET](https://www.istat.it/en/information-and-services/developers/) | 404 | duplicate / duplicate | [free](https://www.istat.it/en/information-and-services/developers) | - | alias of istatitaly |
| ITIS / itis | [GET](https://www.itis.gov/ws_description.html/) | 404 | wrong_base_url_path / http_error | unknown | 872 | discovery |
| iTunes Search / itunessearch | - | 0 | dead_upstream / network_error | unknown | 22 | discovery |
| Jandapress API / jandapressapi | [GET](https://github.com/sinkaroid/jandapress/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Japan Post API / japanpostapi | [GET](https://www.post.japanpost.jp/zipcode/download.html/) | 404 | wrong_base_url_path / http_error | unknown | 2960 | discovery |
| JD / jd | [GET](https://jos.jd.com/api/index.htm/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1447 | discovery |
| Jina AI / jinaai | [GET](https://docs.jina.ai/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| JioSaavn / jiosaavn | [GET](https://github.com/cyberboysumanjay/JioSaavnAPI/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| JioSaavn API / jiosaavn | [GET](https://github.com/cyberboysumanjay/JioSaavnAPI/) | 0 | duplicate / duplicate | unknown | - | alias of jiosaavn |
| JMA Japan Weather / jmajapanweather | [GET](https://www.jma.go.jp/jma/en/Activities/apis.html/) | 404 | wrong_base_url_path / http_error | unknown | 1133 | discovery |
| join.me / joinme | [GET](https://developer.join.me/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| jsDelivr / jsdelivr | [GET](https://github.com/jsdelivr/data.jsdelivr.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Jservice / jservice | [GET](https://jservice.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1048 | discovery |
| JSON Server / jsonserver | [GET](https://github.com/typicode/json-server/) | 0 | not_hosted_api / reviewed_exclusion | [free](https://github.com/typicode/json-server) | 0 | discovery |
| JSONPlaceholder / jsonplaceholder-c2644e5c | [GET](https://jsonplaceholder.typicode.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 167 | discovery |
| Jupiter Protocol API / jupiterprotocolapi | - | 0 | dead_upstream / network_error | [free](https://jupiterag.finance/docs) | 112 | discovery |
| KaolaFM / kaolafm | [GET](https://github.com/kaolafm/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Keystatic / keystatic | [GET](https://keystatic.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2212 | discovery |
| Kooora Unofficial API / koooraunofficialapi | [GET](https://github.com/n-eq/kooora-unofficial-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| KyberSwap Protocol API / kyberswapprotocolapi | - | 0 | dead_upstream / network_error | [free](https://kyberswap.finance/docs) | 47 | discovery |
| LangSmith / langsmith | [GET](https://docs.smith.langchain.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lanyard / lanyard | [GET](https://github.com/Phineas/lanyard/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| LectServe / lectserve | [GET](https://www.lectserve.com/) | 502 | dead_upstream / http_error | unknown | 1157 | discovery |
| LeTV / letv | - | 0 | redirect_https / tls_error | unknown | 97 | discovery |
| LibreTranslate API / libretranslateapi | [GET](https://libretranslate.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 301 | discovery |
| License-API / licenseapi | [GET](https://github.com/cmccandless/license-api/blob/master/README.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lido Protocol API / lidoprotocolapi | [GET](https://lido.finance/docs/) | 403 | unresolved / access_denied | [free](https://lido.finance/docs) | 171 | discovery |
| Lifelog / lifelog | [GET](https://developer.sony.com/develop/services/lifelog-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lingva / lingva | [GET](https://github.com/thedaviddelta/lingva-translate/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Llama.cpp / llamacpp | [GET](https://github.com/ggerganov/llama.cpp/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lob / lob | [GET](https://docs.lob.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Localytics / localytics | [GET](https://docs.localytics.com/dev/query-api.html) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lololyrics / lololyrics | [GET](https://api.lololyrics.com/) | 404 | wrong_base_url_path / http_error | unknown | 232 | discovery |
| Lololyrics API / lololyrics | [GET](https://api.lololyrics.com/) | 404 | duplicate / duplicate | unknown | - | alias of lololyrics |
| Loripsum / loripsum | - | 0 | dead_upstream / network_error | unknown | 3 | discovery |
| Lowy Asia Power Index / lowyasiapowerindex | [GET](https://github.com/0x0is1/lowy-index-api-docs/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lucifer Quotes / luciferquotes | [GET](https://github.com/shadowoff09/lucifer-quotes/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Magic The Gathering / magicthegathering | [GET](https://magicthegathering.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 490 | discovery |
| Magic: The Gathering API / magicthegatheringapi | [GET](https://api.magicthegathering.io/v1/cards?pageSize=1) | 200 | ok / ok_json | [free](https://docs.magicthegathering.io/) | 538 | callable |
| mail.gw / mailgw | [GET](https://docs.mail.gw/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| mail.tm / mailtm | [GET](https://docs.mail.tm/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| MakerDAO Protocol API / makerdaoprotocolapi | - | 0 | redirect_https / tls_error | [free](https://maker.finance/docs) | 537 | discovery |
| Makeup / makeup | [GET](https://makeup-api.herokuapp.com/) | 406 | unresolved / http_error | unknown | 646 | discovery |
| Marvin / marvin | - | 0 | dead_upstream / network_error | unknown | 148 | discovery |
| MCU Countdown / mcucountdown | [GET](https://github.com/DiljotSG/MCU-Countdown/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| MedlinePlus / medlineplus | [GET](https://medlineplus.gov/webservices.html/) | 404 | wrong_base_url_path / http_error | unknown | 1439 | discovery |
| Meme Maker / mememaker | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Meme Maker API / mememaker | - | 0 | duplicate / duplicate | unknown | - | alias of mememaker |
| MeowFacts / meowfacts | [GET](https://github.com/wh-iterabb-it/meowfacts/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| MetaMask SDK / metamasksdk | [GET](https://docs.metamask.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Metaphorsum / metaphorsum | - | 0 | redirect_https / tls_error | unknown | 522 | discovery |
| MeteoSwiss API / meteoswissapi | [GET](https://www.meteoswiss.admin.ch/services-and-publications/service/open-government-data.html/) | 404 | wrong_base_url_path / http_error | unknown | 355 | discovery |
| Metro Lisboa / metrolisboa | [GET](https://app.metrolisboa.pt/status/getLinhas.php/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 527 | discovery |
| Metropolitan Museum of Art / metropolitanmuseumofart | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Mexico / mexico | [GET](https://github.com/IcaliaLabs/sepomex/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Mgnet.me / mgnetme | - | 0 | redirect_https / tls_error | unknown | 1402 | discovery |
| microBees / microbees | [GET](https://developers.microbees.com/documentation/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Microsoft MRTK / microsoftmrtk | [GET](https://github.com/microsoft/MixedRealityToolkit-Unity/) | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Milvus / milvus | - | 302 | redirect_https / redirect_not_approved | unknown | 3167 | discovery |
| Minor Planet Center / minorplanetcenter | [GET](https://www.asterank.com/mpc/) | 404 | wrong_base_url_path / http_error | unknown | 246 | discovery |
| MLB Data / mlbdata | - | 301 | gateway_block / gateway_block | unknown | 716 | discovery |
| MLB Records and Stats / mlbrecordsandstats | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| MLB-StatsAPI / mlbstatsapi-ca2f33f7 | [GET](https://github.com/toddrob99/MLB-StatsAPI/) | 0 | wrong_base_url_path / documentation_url | [free](https://github.com/toddrob99/MLB-StatsAPI) | 0 | discovery |
| Monster Hunter World / monsterhunterworld | [GET](https://docs.mhw-db.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Movebank / movebank | [GET](https://github.com/movebank/movebank-api-doc/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Movebank API / movebank | [GET](https://github.com/movebank/movebank-api-doc/) | 0 | duplicate / duplicate | unknown | - | alias of movebank |
| Movie Quote / moviequote | [GET](https://github.com/F4R4N/movie-quote/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Mozilla http scanner / mozillahttpscanner | [GET](https://github.com/mozilla/http-observatory/blob/master/httpobs/docs/api.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Mozilla tls scanner / mozillatlsscanner | [GET](https://github.com/mozilla/tls-observatory) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| MusicGraph / musicgraph | [GET](https://developer.musicgraph.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| MyVaccination / myvaccination | [GET](https://documenter.getpostman.com/view/16605343/Tzm8GG7u/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Nager.Date / nagerdate | - | 301 | duplicate / duplicate | unknown | - | alias of nagerdate |
| NaMoMemes / namomemes | [GET](https://github.com/theIYD/NaMoMemes/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Narrative / narrative | - | 0 | dead_upstream / network_error | unknown | 58 | discovery |
| Narro / narro | [GET](https://docs.narro.co/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| NASA Exoplanet Archive / nasaexoplanetarchive | [GET](https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+top+1+pl_name+from+ps&format=json) | 200 | ok / ok_json | [free](https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html) | 1597 | callable |
| National Bank of Poland / nbppolandapi | [GET](https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=json) | 200 | duplicate / duplicate | [free](https://api.nbp.pl/en.html) | - | alias of nbppolandapi |
| NBA API / nbaapi | [GET](https://github.com/swar/nba_api/) | 0 | wrong_base_url_path / documentation_url | [free](https://github.com/swar/nba_api) | 0 | discovery |
| NBA REST API / nbarestapi | - | 0 | redirect_https / tls_error | unknown | 682 | discovery |
| NekosBest / nekosbest | [GET](https://docs.nekos.best/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| NetworkCalc / networkcalc | [GET](https://networkcalc.com/api/binary/10?from=10&to=2) | 200 | ok / ok_json | [free](https://networkcalc.com/) | 376 | callable |
| Neurio / neurio | - | 301 | redirect_https / redirect_not_approved | unknown | 381 | discovery |
| NHL Records and Stats / nhlrecordsandstats | [GET](https://gitlab.com/dword4/nhlapi/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Nike+ / nike | [GET](https://developer.nike.com/content/nike-developer-cq/us/en_us/index/documentation/api-docs.html/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| NOAA / usweather | [GET](https://api.weather.gov/points/39.7456,-97.0892) | 200 | duplicate / duplicate | [free](https://www.weather.gov/documentation/services-web-api) | - | alias of usweather |
| Node Deliveroo / nodedeliveroo | [GET](https://github.com/jzarca01/node-deliveroo/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Node UberEats / nodeubereats | [GET](https://github.com/jzarca01/node-ubereats/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Non-Working Days ICS / nonworkingdaysics | [GET](https://github.com/gadael/icsdb/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| npm Registry / npmregistry | [GET](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| NPM Registry API / npmregistry | [GET](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md/) | 0 | duplicate / duplicate | unknown | - | alias of npmregistry |
| NPR / npr | - | 0 | timeout / timeout | unknown | 20003 | discovery |
| Ntfy API / ntfyapi | - | 302 | gateway_block / gateway_block | unknown | 705 | discovery |
| Numbers / numbers | - | 0 | redirect_https / tls_error | unknown | 309 | discovery |
| NWS API / usweather | [GET](https://api.weather.gov/points/39.7456,-97.0892) | 200 | duplicate / duplicate | [free](https://www.weather.gov/documentation/services-web-api) | - | alias of usweather |
| OeNB Austria / oenbaustria | [GET](https://www.oenb.at/Statistik/Standardisierte-Tabellen.html/) | 404 | wrong_base_url_path / http_error | unknown | 553 | discovery |
| Office Ipsum / officeipsum | - | 0 | redirect_https / tls_error | unknown | 504 | discovery |
| One Music / onemusic | - | 0 | timeout / timeout | unknown | 10424 | discovery |
| Open Collective / opencollective | [GET](https://docs.opencollective.com/help/developers/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Open Government, Canada / opengovernmentcanada | [GET](https://open.canada.ca/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://open.canada.ca/data) | 776 | callable |
| Open Government, Ireland / opengovernmentireland | [GET](https://data.gov.ie/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.gov.ie) | 288 | callable |
| Open Government, Romania / opengovernmentromania | [GET](https://data.gov.ro/api/3/action/package_search?rows=1) | 502 | dead_upstream / http_error | [free](https://data.gov.ro) | 1213 | discovery |
| Open Government, Switzerland / opengovernmentswitzerland | [GET](https://opendata.swiss/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://opendata.swiss) | 536 | callable |
| Open Library / openlibrary | [GET](https://openlibrary.org/books/OL7353617M.json) | 200 | ok / ok_json | [free](https://openlibrary.org/developers/api) | 769 | callable |
| Open Library Books / openlibrary | [GET](https://openlibrary.org/books/OL7353617M.json) | 200 | duplicate / duplicate | [free](https://openlibrary.org/developers/api) | - | alias of openlibrary |
| Open Library Books API / openlibrary | [GET](https://openlibrary.org/books/OL7353617M.json) | 200 | duplicate / duplicate | [free](https://openlibrary.org/developers/api) | - | alias of openlibrary |
| Open Notify / opennotify | - | 0 | redirect_https / tls_error | unknown | 504 | discovery |
| Open Notify ISS / opennotify | - | 0 | duplicate / duplicate | unknown | - | alias of opennotify |
| Open Science Framework / openscienceframework | [GET](https://api.osf.io/v2/nodes/?page%5Bsize%5D=1) | 200 | ok / ok_json | [free](https://developer.osf.io/) | 1174 | callable |
| Open Skills / openskills | [GET](https://github.com/workforce-data-initiative/skills-api/wiki/API-Overview/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Open Web Analytics / openwebanalytics | [GET](https://github.com/padams/Open-Web-Analytics/wiki/Data-Access-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Open-Meteo API / openmeteoapi | [GET](https://open-meteo.com/en/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1111 | discovery |
| OpenDota API / opendota | [GET](https://api.opendota.com/api/heroes) | 200 | duplicate / duplicate | [free](https://docs.opendota.com/) | - | alias of opendota |
| OpenFlights / openflights | [GET](https://openflights.org/data.html/) | 404 | wrong_base_url_path / http_error | [free](https://openflights.org/data.html) | 668 | discovery |
| openHAB / openhab | [GET](https://github.com/openhab/openhab1-addons/wiki/REST-API/) | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| openHAB API / openhab | [GET](https://github.com/openhab/openhab1-addons/wiki/REST-API/) | 0 | duplicate / duplicate | [free](https://github.com/openhab/openhab1-addons/wiki/REST-API) | - | alias of openhab |
| OpenRates / openrates | - | 301 | redirect_https / redirect_not_approved | unknown | 471 | discovery |
| OpenSky Network / openskynetwork | [GET](https://opensky-network.org/apidoc/index.html/) | 404 | wrong_base_url_path / http_error | unknown | 256 | discovery |
| OpenVR / openvr | [GET](https://github.com/ValveSoftware/openvr/) | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Openwhyd / openwhyd | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Orca Protocol API / orcaprotocolapi | [GET](https://orca.finance/docs/) | 403 | unresolved / access_denied | [free](https://orca.finance/docs) | 527 | discovery |
| Ordoro / ordoro | - | 301 | redirect_https / redirect_not_approved | unknown | 661 | discovery |
| OSRM API / osrmapi | [GET](https://project-osrm.org/docs/v5.24.0/api/) | 200 | wrong_base_url_path / html_instead_of_api | [free](http://project-osrm.org/docs/v5.24.0/api) | 385 | discovery |
| Outstatic / outstatic | [GET](https://outstatic.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 3377 | discovery |
| PancakeSwap Protocol API / pancakeswapprotocolapi | [GET](https://pancakeswap.finance/docs/) | 404 | wrong_base_url_path / http_error | [free](https://pancakeswap.finance/docs) | 1445 | discovery |
| Papercup / papercup | - | 301 | redirect_https / redirect_not_approved | unknown | 292 | discovery |
| ParaSwap Protocol API / paraswapprotocolapi | - | 0 | timeout / timeout | [free](https://paraswap.finance/docs) | 10072 | discovery |
| Parqet Logo API / parqetlogoapi | [GET](https://developers.parqet.com/docs/assets/logos/) | 0 | wrong_base_url_path / documentation_url | [free](https://developers.parqet.com/docs/assets/logos) | 0 | discovery |
| Passwordinator / passwordinator | [GET](https://github.com/fawazsullia/password-generator/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Patents API / patentsapi | [GET](https://developer.uspto.gov/api-catalog/) | 0 | wrong_base_url_path / documentation_url | [free](https://developer.uspto.gov/api-catalog) | 0 | discovery |
| Paymill / paymill | [GET](https://developers.paymill.com/index/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| PayPal Login / paypallogin | [GET](https://developer.paypal.com/docs/integration/direct/identity/log-in-with-paypal/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Payson / payson | [GET](https://developers.payson.se/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Paytm / paytm | [GET](https://paytm.com/business/payments/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1275 | discovery |
| PE Accounting / peaccounting | [GET](https://docs.accounting.pe/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Pelias API / peliasapi | [GET](https://github.com/pelias/documentation/) | 0 | wrong_base_url_path / documentation_url | [free](https://github.com/pelias/documentation) | 0 | discovery |
| PENDAX / pendax | [GET](https://github.com/CompendiumFi/PENDAX-SDK/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Penguin Publishing / penguinpublishing | [GET](https://www.penguinrandomhouse.biz/webservices/rest/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2098 | discovery |
| Phone Specification / phonespecification | [GET](https://github.com/azharimm/phone-specs-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| PhonePe / phonepe | [GET](https://developer.phonepe.com/docs/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Picatic / picatic | [GET](https://developer.picatic.com/?utm_medium=web) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Pinball Map / pinballmap | [GET](https://pinballmap.com/api/v1/docs/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 739 | discovery |
| Placid / placid | [GET](https://placid.app/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1124 | discovery |
| PoetryDB / poetrydb | [GET](https://poetrydb.org/title/Ozymandias) | 200 | ok / ok_json | [free](https://github.com/thundercomb/poetrydb) | 1594 | callable |
| Pokemon TCG / pokemontcg | [GET](https://api.pokemontcg.io/v2/cards/base1-1) | 200 | ok / ok_json | [free](https://docs.pokemontcg.io/) | 417 | callable |
| PokéAPI (GraphQL) / pokapigraphql | [GET](https://github.com/mazipan/graphql-pokeapi/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Polly.JS / pollyjs | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://netflix.github.io/pollyjs) | 0 | discovery |
| PostalPinCode / postalpincode | [GET](https://api.postalpincode.in/pincode/110001) | 200 | ok / ok_json | [free](https://www.postalpincode.in/Api-Details) | 816 | callable |
| Postcode.io API / postcodesio | [GET](https://api.postcodes.io/postcodes/SW1A1AA) | 200 | duplicate / duplicate | [free](https://postcodes.io/) | - | alias of postcodesio |
| PostcodeData.nl / postcodedatanl | - | 0 | dead_upstream / network_error | unknown | 125 | discovery |
| Postmon / postmon | - | 0 | dead_upstream / network_error | [free](https://postmon.com.br/) | 4 | discovery |
| PRC Exam Schedule / prcexamschedule | - | 0 | dead_upstream / network_error | unknown | 105 | discovery |
| Programming Quotes / programmingquotes | [GET](https://github.com/skolakoda/programming-quotes-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Promptflow / promptflow | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| PurgoMalum / purgomalum | [GET](https://www.purgomalum.com/service/json?text=hello) | 200 | ok / ok_json | [free](https://www.purgomalum.com/) | 17111 | callable |
| Puyo Nexus / puyonexus | [GET](https://github.com/deltadex7/puyodb-api-deno/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| QingtingFM / qingtingfm | [GET](https://open.qingting.fm/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 825 | discovery |
| qKast Channel Content / qkastchannelcontent | [GET](https://github.com/egfx/qKast/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| QR code / qrcode | [GET](https://goqr.me/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 392 | discovery |
| QR code goqr / qrcode | [GET](https://goqr.me/api/) | 200 | duplicate / duplicate | unknown | - | alias of qrcode |
| qunar / qunar | [GET](https://open.qunar.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2082 | discovery |
| Quotable / quotable | [GET](https://github.com/lukePeavey/quotable/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Quotable Quotes / quotable | [GET](https://github.com/lukePeavey/quotable/) | 0 | duplicate / duplicate | unknown | - | alias of quotable |
| Quote Garden / quotegarden | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Quran-api / quranapi | [GET](https://github.com/fawazahmed0/quran-api) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| RainViewer / rainviewer | [GET](https://www.rainviewer.com/api.html/) | 404 | wrong_base_url_path / http_error | unknown | 636 | discovery |
| Random Data API / randomdata | - | 0 | duplicate / duplicate | [free](https://random-data-api.com/documentation) | - | alias of randomdata |
| Random User / randomuser-9b425277 | [GET](https://randomuser.me/documentation/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://randomuser.me/documentation) | 131 | discovery |
| Random User API / randomuser-c51bc20a | [GET](https://randomuser.me/api/?results=1&inc=name,nat&noinfo) | 200 | duplicate / duplicate | [free](https://randomuser.me/documentation) | - | alias of randomuser |
| RandomUser API / randomuser-9b425277 | [GET](https://randomuser.me/documentation/) | 200 | duplicate / duplicate | [free](https://randomuser.me/documentation) | - | alias of randomuser |
| Ray Serve / rayserve | [GET](https://docs.ray.io/en/latest/serve/) | 0 | wrong_base_url_path / documentation_url | [free](https://docs.ray.io/en/latest/serve) | 0 | discovery |
| Raydium Protocol API / raydiumprotocolapi | [GET](https://raydium.finance/docs/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://raydium.finance/docs) | 655 | discovery |
| Razorpay IFSC / razorpayifsc | [GET](https://ifsc.razorpay.com/HDFC0000001) | 200 | ok / ok_json | [free](https://github.com/razorpay/ifsc) | 850 | callable |
| Readme typing SVG / readmetypingsvg | [GET](https://github.com/DenverCoder1/readme-typing-svg/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| RealityKit / realitykit | [GET](https://developer.apple.com/documentation/realitykit/) | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Recipe Puppy API / recipepuppyapi | [GET](https://www.recipepuppy.com/about/api/) | 404 | wrong_base_url_path / http_error | unknown | 1155 | discovery |
| RecipePuppy / recipepuppy | [GET](https://www.recipepuppy.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 1636 | discovery |
| Recon / recon | - | 0 | dead_upstream / network_error | unknown | 34 | discovery |
| REFUGE Restrooms / refugerestrooms | [GET](https://www.refugerestrooms.org/api/docs/) | 200 | unresolved / invalid_response | unknown | 796 | discovery |
| Relevance AI / relevanceai | [GET](https://docs.relevanceai.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Remote Calc / remotecalc | [GET](https://github.com/elizabethadegbaju/remotecalc/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Repetiti / repetiti | [GET](https://developers.repetiti.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Resolve Team / resolveteam | [GET](https://github.com/fearandesire/resolve-team/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| RestCountries / restcountries-e252b887-e252b887-e252b887 | - | 301 | redirect_https / redirect_not_approved | [free](https://restcountries.com) | 87 | discovery |
| Rig Veda / rigveda | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Roku API / rokuapi | [GET](https://developer.roku.com/docs/developer-program/debugging/external-control-api.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Ron Swanson Quotes / ronswansonquotes | [GET](https://ron-swanson-quotes.herokuapp.com/v2/quotes) | 200 | ok / ok_json | [free](https://github.com/jamesseanwright/ron-swanson-quotes) | 527 | callable |
| Russian Calendar / russiancalendar | [GET](https://github.com/egno/work-calendar/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Sakura CardCaptor / sakuracardcaptor | [GET](https://github.com/JessVel/sakura-card-captor-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Salesforce Auth / salesforceauth | [GET](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_authentication.htm/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Scenario / scenario | [GET](https://docs.scenario.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SearchLy / searchly | [GET](https://github.com/AlbertSuarez/searchly/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Semantics3 / semantics3 | [GET](https://docs.semantics3.com/reference/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Seon / seon | [GET](https://docs.seon.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Shadify / shadify | [GET](https://github.com/cheatsnake/shadify/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Shibe Online / shibeonline-07ebe720-07ebe720-07ebe720 | - | 0 | redirect_https / tls_error | [free](https://shibe.online/) | 366 | discovery |
| Shibe.Online / shibeonline-07ebe720-07ebe720-07ebe720 | - | 0 | redirect_https / tls_error | unknown | 1042 | discovery |
| Short Link / shortlink | [GET](https://github.com/FayasNoushad/Short-Link-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SHOUTCLOUD / shoutcloud | [GET](https://shoutcloud.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1606 | discovery |
| Shrtcode / shrtcode | [GET](https://shrtco.de/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 229 | discovery |
| SLF / slf | [GET](https://github.com/slftool/slftool.github.io/blob/master/API.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SLF Database / slf | [GET](https://github.com/slftool/slftool.github.io/blob/master/API.md/) | 0 | duplicate / duplicate | unknown | - | alias of slf |
| SLF German Database / slfgermandatabase | [GET](https://github.com/slftool/slftool.github.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Slice / slice | [GET](https://developer.slice.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Sohu TV / sohutv | [GET](https://lm.tv.sohu.com/union/open_platform.do/) | 404 | wrong_base_url_path / http_error | unknown | 1364 | discovery |
| Solana JSON RPC / solanajsonrpc | [GET](https://docs.solana.com/developing/clients/jsonrpc-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Solana JSON-RPC / solanajsonrpc | [GET](https://docs.solana.com/developing/clients/jsonrpc-api/) | 0 | duplicate / duplicate | unknown | - | alias of solanajsonrpc |
| Solana RPC API / solanarpcapi | [GET](https://docs.solana.com/api/) | 0 | wrong_base_url_path / documentation_url | [free](https://docs.solana.com/api) | 0 | discovery |
| Solana Web3.js / solanaweb3js | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Sonar / sonar | [GET](https://github.com/Cgboal/SonarSearch/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| South Park Quotes / southparkquotes | [GET](https://github.com/Thatskat/southpark-quotes-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Spanish INE API / spanishineapi | [GET](https://www.ine.es/dyngs/DataLab/en/manual.html?cid=66) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.ine.es/dyngs/DataLab/en/manual.html?cid=66) | 1122 | discovery |
| Sport List & Data / sportlistdata | [GET](https://developers.decathlon.com/products/sports/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Sport Places / sportplaces | [GET](https://developers.decathlon.com/products/sport-places/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Sportscaster API / sportscasterapi | [GET](https://github.com/roysti10/sportscaster/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Sportsipy / sportsipy | [GET](https://github.com/roclark/sportsipy/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SSL Labs API / ssllabsapi | [GET](https://github.com/ssllabs/ssllabs-scan/blob/master/ssllabs-api-docs-v3.md/) | 0 | wrong_base_url_path / documentation_url | [free](https://github.com/ssllabs/ssllabs-scan/blob/master/ssllabs-api-docs-v3.md) | 0 | discovery |
| SST / sst | [GET](https://docs.sst.dev/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stack AI / stackai | [GET](https://docs.stack-ai.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stack Lighting / stacklighting | [GET](https://developers.stacklighting.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stamps.com / stampscom | [GET](https://developer.stamps.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| STAPI / stapi | [GET](https://stapi.co/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 593 | discovery |
| StatCan Statistics / statcanstatistics | [GET](https://www.statcan.gc.ca/eng/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2182 | discovery |
| StatLine / statline | [GET](https://github.com/amillolive/StatLine/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stats SA / statssa | - | 302 | redirect_https / redirect_not_approved | unknown | 3373 | discovery |
| Steam / steam | [GET](https://github.com/Revadike/InternalSteamWebAPI/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SteamVR / steamvr | [GET](https://github.com/ValveSoftware/steamvr_unity_plugin/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Steem / steem | [GET](https://developers.steem.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stoicism Quote / stoicismquote | [GET](https://github.com/tlcheah2/stoic-quote-lambda-public-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stranger Things Quotes / strangerthingsquotes | [GET](https://github.com/shadowoff09/strangerthings-quotes/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SushiSwap Protocol API / sushiswapprotocolapi | - | 0 | dead_upstream / network_error | [free](https://sushiswap.finance/docs) | 56 | discovery |
| SWAPI / swapi | [GET](https://www.swapi.tech/api/people/1) | 200 | ok / ok_json | [free](https://www.swapi.tech/documentation) | 508 | callable |
| Symbl.ai / symblai | [GET](https://docs.symbl.ai/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Synthetix Protocol API / synthetixprotocolapi | - | 301 | redirect_https / redirect_not_approved | [free](https://synthetix.finance/docs) | 375 | discovery |
| TacoFancy / tacofancy | [GET](https://github.com/evz/tacofancy-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| TacoFancy API / tacofancy | [GET](https://github.com/evz/tacofancy-api/) | 0 | duplicate / duplicate | unknown | - | alias of tacofancy |
| TalkJS / talkjs | [GET](https://talkjs.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 287 | discovery |
| Tanzania Open Data API / tanzaniaopendataapi | - | 0 | dead_upstream / network_error | [free](http://opendata.go.tz) | 33 | discovery |
| Taobao / taobao | - | 302 | redirect_https / redirect_not_approved | unknown | 1170 | discovery |
| TCGdex / tcgdex | [GET](https://api.tcgdex.net/v2/en/sets/base1) | 200 | ok / ok_json | [free](https://tcgdex.dev/) | 547 | callable |
| TeamSnap / teamsnap | [GET](https://developer.teamsnap.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Teleport / teleport | [GET](https://developers.teleport.org/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Tencent Map / tencentmap | [GET](https://lbs.qq.com/webservice_v1/index.html/) | 404 | wrong_base_url_path / http_error | unknown | 1895 | discovery |
| Tencent NLP / tencentnlp | - | 0 | unresolved / network_error | unknown | 272 | discovery |
| The Report of the Week / thereportoftheweek | [GET](https://github.com/andyklimczak/TheReportOfTheWeek-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| They Said So / theysaidso | [GET](https://quotes.rest/qod.json?category=inspire) | 401 | unresolved / access_denied | unknown | 762 | discovery |
| Times Adder / timesadder | [GET](https://github.com/FranP-code/API-Times-Adder/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| ToS;DR API / tosdrapi | [GET](https://tosdr.org/api.html/) | 404 | wrong_base_url_path / http_error | [free](https://tosdr.org/api.html) | 489 | discovery |
| Trace Moe / tracemoe | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| TransitLand / transitland | [GET](https://www.transit.land/documentation/datastore/api-endpoints.html/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 330 | discovery |
| Transitland API / transitlandapi | [GET](https://www.transit.land/documentation/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.transit.land/documentation) | 1102 | discovery |
| Transloadit / transloadit | [GET](https://transloadit.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 933 | discovery |
| Transport for Atlanta, US / transportforatlantaus | - | 301 | redirect_https / redirect_not_approved | unknown | 522 | discovery |
| Transport for Belgium / transportforbelgium | [GET](https://api.irail.be/v1/stations?format=json) | 200 | ok / ok_json | [free](https://docs.irail.be/) | 247 | callable |
| Transport for Berlin, Germany / transportforberlingermany | [GET](https://v6.vbb.transport.rest/locations?query=Berlin&results=1) | 200 | ok / ok_json | [free](https://v6.vbb.transport.rest/api.html) | 350 | callable |
| Transport for Denver, US / transportfordenverus | [GET](https://www.rtd-denver.com/gtfs-developer-guide.shtml/) | 404 | wrong_base_url_path / http_error | unknown | 1308 | discovery |
| Transport for Finland / hsl | [GET](https://digitransit.fi/en/developers/) | 200 | duplicate / duplicate | unknown | - | alias of hsl |
| Transport for Grenoble, France / transportforgrenoblefrance | [GET](https://www.mobilites-m.fr/pages/opendata/OpenDataApi.html/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 379 | discovery |
| Transport for Hessen, Germany / transportforhessengermany | - | 301 | redirect_https / redirect_not_approved | unknown | 265 | discovery |
| Transport for Los Angeles, US / transportforlosangelesus | [GET](https://developer.metro.net/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Transport for Norway / transportfornorway | [GET](https://developer.entur.org/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Transport for Paris, France / transportforparisfrance | [GET](https://data.ratp.fr/api/v1/console/datasets/1.0/search/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1553 | discovery |
| Transport for Philadelphia, US / transportforphiladelphiaus | [GET](https://www3.septa.org/hackathon/) | 403 | unresolved / access_denied | unknown | 744 | discovery |
| Transport for Spain / transportforspain | [GET](https://data.renfe.com/api/1/util/snippet/api_info.html?resource_id=a2368cff-1562-4dde-8466-9635ea3a572a) | 200 | unresolved / invalid_response | unknown | 377 | discovery |
| Transport for The Netherlands / transportforthenetherlands | [GET](https://github.com/skywave/KV78Turbo-OVAPI/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Transport for Toronto, Canada / transportfortorontocanada | [GET](https://myttc.ca/developers/) | 406 | unresolved / http_error | unknown | 970 | discovery |
| Treasury Prime / treasuryprime | [GET](https://docs.treasuryprime.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Trilium / trilium | [GET](https://github.com/zadam/trilium/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| tuniu / tuniu | [GET](https://open.tuniu.cn/) | 200 | unresolved / invalid_response | unknown | 1351 | discovery |
| TVMaze / tvmaze | [GET](https://api.tvmaze.com/shows/1) | 200 | ok / ok_json | [free](https://www.tvmaze.com/api) | 251 | callable |
| Twelve Labs / twelvelabs | [GET](https://docs.twelvelabs.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Typebot / typebot | [GET](https://docs.typebot.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| UK Carbon Intensity / ukcarbonintensity | [GET](https://api.carbonintensity.org.uk/intensity) | 200 | ok / ok_json | [free](https://carbon-intensity.github.io/api-definitions/) | 509 | callable |
| UK Parliament API / ukparliamentapi | [GET](https://members-api.parliament.uk/api/Members/Search?skip=0&take=1) | 200 | ok / ok_json | [free](https://developer.parliament.uk/) | 317 | callable |
| UK Police / ukpolice | [GET](https://data.police.uk/api/forces) | 200 | ok / ok_json | [free](https://data.police.uk/docs/) | 211 | callable |
| UK Police API / ukpolice | [GET](https://data.police.uk/api/forces) | 200 | duplicate / duplicate | [free](https://data.police.uk/docs/) | - | alias of ukpolice |
| Ultralytics / ultralytics | [GET](https://docs.ultralytics.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Uniswap / uniswap | [GET](https://docs.uniswap.org/) | 0 | wrong_base_url_path / documentation_url | [free](https://docs.uniswap.org) | 0 | discovery |
| Uniswap API / uniswap | [GET](https://docs.uniswap.org/) | 0 | duplicate / duplicate | [free](https://docs.uniswap.org) | - | alias of uniswap |
| Uniswap Protocol API / uniswapprotocolapi | - | 0 | dead_upstream / network_error | [free](https://uniswap.finance/docs) | 62 | discovery |
| Unity XR / unityxr | [GET](https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Universalis / universalis | [GET](https://universalis.app/api/v2/data-centers) | 200 | ok / ok_json | [free](https://docs.universalis.app/) | 125 | callable |
| Universalis FFXIV / universalis | [GET](https://universalis.app/api/v2/data-centers) | 200 | duplicate / duplicate | [free](https://docs.universalis.app/) | - | alias of universalis |
| Universities List / universitieslist | [GET](https://github.com/Hipo/university-domains-list/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| University Domains / universitieslist | [GET](https://github.com/Hipo/university-domains-list/) | 0 | duplicate / duplicate | unknown | - | alias of universitieslist |
| Unstructured / unstructured | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| US Weather / usweather | [GET](https://api.weather.gov/points/39.7456,-97.0892) | 200 | ok / ok_json | [free](https://www.weather.gov/documentation/services-web-api) | 112 | callable |
| USA TODAY / usatoday | [GET](https://developer.usatoday.com/docs/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| UUID Generator / uuidgenerator | [GET](https://www.uuidtools.com/api/generate/v4/count/1) | 200 | ok / ok_json | [free](https://www.uuidtools.com/docs) | 302 | callable |
| Valhalla Routing / valhallarouting | - | 0 | gateway_block / unsafe_url | [free](https://valhalla.github.io/valhalla/api) | 0 | discovery |
| VATComply / vatcomply | [GET](https://api.vatcomply.com/rates?base=EUR) | 200 | ok / ok_json | [free](https://www.vatcomply.com/documentation) | 298 | callable |
| VATComply.com / vatcomply | [GET](https://api.vatcomply.com/rates?base=EUR) | 200 | duplicate / duplicate | [free](https://www.vatcomply.com/documentation) | - | alias of vatcomply |
| Vectara / vectara | [GET](https://docs.vectara.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Vector Express / vectorexpress | [GET](https://github.com/smidyo/vectorexpress-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Vedic Society / vedicsociety | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Vespa / vespa | [GET](https://docs.vespa.ai/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Viber API / viberapi | [GET](https://developers.viber.com/docs/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Visma / visma | [GET](https://developer.visma.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| W3C / w3c | [GET](https://github.com/w3c/w3c-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| W3C API / w3c | [GET](https://github.com/w3c/w3c-api/) | 0 | duplicate / duplicate | [free](https://github.com/w3c/w3c-api) | - | alias of w3c |
| Waifu.im / waifuim | - | 301 | redirect_https / redirect_not_approved | unknown | 320 | discovery |
| Waifu.pics / waifupics | - | 301 | redirect_https / redirect_not_approved | unknown | 852 | discovery |
| WakaTime / wakatime | [GET](https://wakatime.com/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1230 | discovery |
| Walley / walley | [GET](https://docs.walley.se/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Walltime / walltime | - | 0 | dead_upstream / network_error | unknown | 548 | discovery |
| Wandbox / wandbox | [GET](https://wandbox.org/api/list.json) | 200 | ok / ok_json | [free](https://github.com/melpon/wandbox) | 169 | callable |
| Weather Unlocked / weatherunlocked | [GET](https://developer.weatherunlocked.com/documentation/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| weather-api / weatherapi | [GET](https://github.com/robertoduessmann/weather-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Web Series Quotes Generator / webseriesquotesgenerator | [GET](https://github.com/yogeshwaran01/web-series-quotes/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Weibo / weibo | [GET](https://open.weibo.com/wiki/API/) | 404 | wrong_base_url_path / http_error | unknown | 1708 | discovery |
| Weibo API / weiboapi | [GET](https://open.weibo.com/wiki/API%E6%96%87%E6%A1%A3/en/) | 404 | wrong_base_url_path / http_error | unknown | 2630 | discovery |
| What The Commit / whatthecommit | [GET](https://whatthecommit.com/index.txt) | 200 | ok / ok_text | [free](https://github.com/ngerakines/commitment) | 503 | callable |
| WhatPulse / whatpulse | [GET](https://developer.whatpulse.org/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| When is next MCU film / whenisnextmcufilm | [GET](https://github.com/DiljotSG/MCU-Countdown/blob/develop/docs/API.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Wizard World / wizardworld | [GET](https://wizard-world-api.herokuapp.com/swagger/index.html/) | 404 | wrong_base_url_path / http_error | unknown | 321 | discovery |
| Wizard World API / wizardworld | [GET](https://wizard-world-api.herokuapp.com/swagger/index.html/) | 404 | duplicate / duplicate | unknown | - | alias of wizardworld |
| World Wonders API / worldwondersapi | [GET](https://github.com/Rolv-Apneseth/world-wonders-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| wozhitu / wozhitu | - | 0 | dead_upstream / network_error | unknown | 303 | discovery |
| Xively / xively | [GET](https://developer.xively.com/reference/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Yahoo Maps / yahoomaps | [GET](https://developer.yahoo.com/maps/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Yearn Finance Protocol API / yearnfinanceprotocolapi | - | 307 | redirect_https / redirect_not_approved | [free](https://yearn.finance/docs) | 240 | discovery |
| yeekit / yeekit | - | 0 | dead_upstream / network_error | unknown | 233 | discovery |
| Yeelight / yeelight | [GET](https://www.yeelight.com/en_US/developer/) | 500 | dead_upstream / http_error | unknown | 1569 | discovery |
| Yellow Pages API / yellowpagesapi | [GET](https://github.com/Hrushi11/Yellow-Pages-End-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Yo / yo | [GET](https://docs.justyo.co/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Yo Momma Jokes / yomommajokes | [GET](https://github.com/beanboi7/yomomma-apiv2/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Youdao / youdao | [GET](https://fanyi.youdao.com/openapi/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2399 | discovery |
| Youdao Note / youdaonote | [GET](https://note.youdao.com/open/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1165 | discovery |
| YouTube API / youtubeapi | [GET](https://developers.google.com/youtube/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Yr.no API / metnorway | [GET](https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75) | 200 | duplicate / duplicate | [free](https://api.met.no/doc/TermsOfService) | - | alias of yr |
| Yu-Gi-Oh! / yugioh-87bf1c6d | [GET](https://db.ygoprodeck.com/api-guide/) | 301 | redirect_https / redirect_not_approved | unknown | 1033 | discovery |
| Zetta / zetta | [GET](https://github.com/zettajs/zetta/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Zetta IoT / zetta | [GET](https://github.com/zettajs/zetta/wiki/) | 0 | duplicate / duplicate | unknown | - | alias of zetta |
| Zettle / zettle | [GET](https://developer.zettle.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Zippopotam.us / zippopotamus-5d8e78ff-5d8e78ff-5d8e78ff | [GET](https://api.zippopotam.us/us/90210) | 200 | ok / ok_json | [free](https://www.zippopotam.us/) | 299 | callable |
| Zippopotamus / zippopotamus-5d8e78ff-5d8e78ff-5d8e78ff | [GET](https://www.zippopotam.us/) | 200 | unresolved / invalid_response | unknown | 290 | discovery |
| Zombie Ipsum / zombieipsum | - | 0 | redirect_https / tls_error | unknown | 554 | discovery |
| Arbetsförmedlingen API / arbetsfrmedlingenapi | [GET](https://jobsearch.api.jobtechdev.se/search?q=developer&limit=1) | 200 | ok / ok_json | [free](https://jobsearch.api.jobtechdev.se/) | 274 | callable |
| Bluesky / bluesky | [GET](https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=bsky.app) | 200 | ok / ok_json | [free](https://docs.bsky.app/docs/advanced-guides/api-directory) | 323 | callable |
| Crates.io / cratesio | [GET](https://crates.io/api/v1/crates/serde/1.0.228) | 200 | ok / ok_json | [free](https://crates.io/data-access) | 349 | callable |
| Dev.to API / devtoapi | [GET](https://dev.to/api/articles?per_page=1) | 200 | ok / ok_json | [free](https://developers.forem.com/api/v1) | 111 | callable |
| Guild Wars 2 API / guildwars2api | [GET](https://api.guildwars2.com/v2/build) | 200 | ok / ok_json | [free](https://wiki.guildwars2.com/wiki/API:Main) | 328 | callable |
| Hugging Face Hub API / huggingfacehubapi | [GET](https://huggingface.co/api/models?limit=1) | 200 | ok / ok_json | [free](https://huggingface.co/docs/hub/api) | 218 | callable |
| iNaturalist API / inaturalistapi | [GET](https://api.inaturalist.org/v1/taxa?per_page=1) | 200 | ok / ok_json | [free](https://api.inaturalist.org/v1/docs/) | 1076 | callable |
| Lichess.org API reference / lichessorgapireference | [GET](https://lichess.org/api/puzzle/daily) | 200 | ok / ok_json | [free](https://lichess.org/api) | 218 | callable |
| UniProt / uniprotapi | [GET](https://rest.uniprot.org/uniprotkb/search?query=accession%3AP69905&format=json&size=1&fields=accession) | 200 | duplicate / duplicate | [free](https://www.uniprot.org/help/license) | - | alias of uniprotapi |
