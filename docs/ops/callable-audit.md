# Callable API audit

Checked: 2026-10-16T09:35:11.126Z. Mode: full-sweep. Complete sweep: yes.

**282 canonical free APIs verified from 1668 candidate/alias rows.** The site separately adds its existing approved managed providers; this sweep makes no managed or credentialed calls. The managed-only `customerExecutableProviderCount` is not the full `totalCallable`. Unknown pricing remains discovery even after HTTP 200.

Customer gateway verification: 2026-10-16T09:47:20.708Z, preview https://abundant-goldfish-47.eu-west-1.convex.site. 282/286 authenticated customer calls passed; 4 were demoted. Billing snapshots were identical. 0 newly upstream-verified APIs still await customer gateway verification. Upstream checkedAt/HTTP/latency remain the original upstream evidence; bounded per-row gatewayVerification records the separate customer result.

Catalog arithmetic: 282 measured free APIs + 3 existing approved managed providers = **285 catalog-callable APIs**. This keyless audit does not retest paid managed providers. Reaching 1,000 requires 715 additional distinct verified APIs. **The required number of signups is unknown**, because credentials, rights, working adapters and overlap have not been established. Remaining wrong endpoints/unresolved services may still provide additional APIs; this is not proof of a global maximum.

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

The original cohort has 1002 rows: 13 were verified and **989 originally failed**. 1002 match current evidence by ID and exact normalized name. 177 formerly failing rows now represent independently verified canonical APIs. Current status: 190 verified canonical rows, 110 duplicate rows, 702 discovery rows. These are row counts, not extra APIs per alias.

| Current cause | All original cohort rows | Originally failing rows only |
| --- | ---: | ---: |
| wrong_base_url_path | 372 | 372 |
| ok | 190 | 177 |
| redirect_https | 117 | 117 |
| duplicate | 110 | 110 |
| dead_upstream | 63 | 63 |
| unresolved | 54 | 54 |
| not_hosted_api | 51 | 51 |
| timeout | 17 | 17 |
| unknown_pricing | 10 | 10 |
| needs_key | 7 | 7 |
| commercial_permission | 6 | 6 |
| rate_limit | 3 | 3 |
| gateway_block | 2 | 2 |
| missing_default_params | 0 | 0 |

Cohort matching uses historical ID and exact normalized name, not normalized ID alone. Counts are candidate rows including aliases; expanded candidates are separate. Missing rows are unresolved, not presumed dead or key-required. Current causes do not rewrite original outcomes.

## Expanded sweep: current evidence

The following table covers all 1668 expanded candidate/alias rows. It must not be presented as a breakdown of the original 989 failures. Zeroes are explicit, including missing_default_params when no current response proves that cause.

| Current cause | Expanded rows |
| --- | ---: |
| wrong_base_url_path | 716 |
| ok | 282 |
| redirect_https | 178 |
| duplicate | 172 |
| dead_upstream | 99 |
| unresolved | 76 |
| not_hosted_api | 64 |
| timeout | 27 |
| gateway_block | 18 |
| unknown_pricing | 12 |
| needs_key | 11 |
| commercial_permission | 10 |
| rate_limit | 3 |
| missing_default_params | 0 |

Previously verified still working or represented by a verified canonical alias: 13/13. Previously verified requiring attention: none. Reused rows: 0. Unchecked rows: 0.

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
| citybikes | missing_default_params |
| citygdask | wrong_base_url_path, missing_default_params |
| cityhelsinki | wrong_base_url_path, missing_default_params |
| citytorontoopendata | wrong_base_url_path, missing_default_params |
| clinicaltrialsgov | wrong_base_url_path, missing_default_params |
| codewarsapi | wrong_base_url_path |
| coinlore | wrong_base_url_path |
| colombiaopendataapi | wrong_base_url_path, missing_default_params |
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
| gutendex | missing_default_params |
| harrypotterapi | wrong_base_url_path |
| hebrewcalendar | wrong_base_url_path, missing_default_params |
| hipsteripsum | missing_default_params |
| hongkongdataapi | wrong_base_url_path, missing_default_params |
| humanproteinatlas | wrong_base_url_path |
| icanhazdadjoke | wrong_base_url_path |
| imgflip | wrong_base_url_path |
| indianmutualfund | wrong_base_url_path |
| ipify | wrong_base_url_path |
| iseven | wrong_base_url_path |
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
| brazilianchamberofdeputiesopendata | wrong_base_url_path, missing_default_params |
| cdc | wrong_base_url_path, missing_default_params |
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
| transportforberlingermany | wrong_base_url_path, missing_default_params |
| transportforgrenoblefrance | wrong_base_url_path, missing_default_params |
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

## Full results and sources

Per-hop redirects/retries, original baseline outcomes and bounded error-cause chains are in [the JSON evidence](callable-audit.json). No credentials or upstream response bodies are stored.

| API / canonical ID | Tested GET | HTTP | Cause / outcome | Free evidence | Latency ms | Result |
| --- | --- | ---: | --- | --- | ---: | --- |
| 0x / 0x | - | 0 | needs_key / reviewed_exclusion | unknown | 0 | discovery |
| 0x API / 0x | - | 0 | duplicate / duplicate | unknown | - | discovery |
| 1Forge.com / 1forgecom | - | 0 | needs_key / reviewed_exclusion | unknown | 0 | discovery |
| 1inch / 1inch | - | 0 | needs_key / reviewed_exclusion | unknown | 0 | discovery |
| 24 Pull Requests / 24pullrequests | [GET](https://24pullrequests.com/api/) | 406 | unresolved / http_error | unknown | 617 | discovery |
| A-Frame / aframe | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| ABS Statistics / absstatistics | [GET](https://api.data.abs.gov.au/) | 0 | dead_upstream / network_error | unknown | 53 | discovery |
| adresse.data.gouv.fr / adressedatagouvfr | [GET](https://adresse.data.gouv.fr/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 718 | discovery |
| ADS-B Exchange / adsbexchange | [GET](https://www.adsbexchange.com/data/) | 301 | redirect_https / redirect_not_approved | unknown | 624 | discovery |
| Advice Slip API / adviceslipapi | [GET](https://api.adviceslip.com/advice) | 200 | ok / ok_json | [free](https://api.adviceslip.com/) | 246 | callable |
| Age of Empires II / ageofempiresii | [GET](https://age-of-empires-2-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 621 | discovery |
| Agify / agify | [GET](https://agify.io/) | 406 | unresolved / http_error | unknown | 642 | discovery |
| Agify.io / agify | [GET](https://agify.io/) | 406 | duplicate / duplicate | unknown | - | discovery |
| Airtel IP / airtelip | [GET](https://sys.airtel.lv/ip2country/1.1.1.1/?full=true) | 200 | unresolved / invalid_response | unknown | 177 | discovery |
| AllStar / allstar | [GET](https://openssf.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 209 | discovery |
| Altinn / altinn | [GET](https://altinn.no/api/) | 301 | redirect_https / redirect_not_approved | unknown | 77 | discovery |
| AmiiboAPI / amiiboapi | [GET](https://amiiboapi.com/api/amiibo?name=mario) | 404 | dead_upstream / http_error | [free](https://amiiboapi.com/docs/) | 627 | discovery |
| An API of Ice and Fire / anapioficeandfire | [GET](https://anapioficeandfire.com/api/books/1) | 200 | ok / ok_json | [free](https://anapioficeandfire.com/Documentation) | 107 | callable |
| AnimeNewsNetwork / animenewsnetwork | [GET](https://www.animenewsnetwork.com/encyclopedia/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1383 | discovery |
| Anki / anki | [GET](https://apps.ankiweb.net/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://apps.ankiweb.net) | 97 | discovery |
| Anki API / ankiapi | [GET](https://foosoft.net/projects/anki-connect/) | 404 | wrong_base_url_path / http_error | unknown | 235 | discovery |
| AnonFiles / anonfiles | [GET](https://anonfiles.com/docs/api/) | 0 | dead_upstream / network_error | unknown | 33 | discovery |
| Anytype / anytype | [GET](https://anytype.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 403 | discovery |
| API Grátis / apigrtis | [GET](https://apigratis.com.br/) | 429 | rate_limit / rate_limited | unknown | 1065 | discovery |
| API Setu / apisetu | [GET](https://www.apisetu.gov.in/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1235 | discovery |
| ApicAgent / apicagent | [GET](https://www.apicagent.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 521 | discovery |
| apilayer screenshotlayer / apilayerscreenshotlayer | [GET](https://screenshotlayer.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 725 | discovery |
| APiX / apix | [GET](https://www.apix.cn/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1995 | discovery |
| Apoteket / apoteket | [GET](https://www.apoteket.se/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 481 | discovery |
| AppFlowy / appflowy | [GET](https://appflowy.io/) | 301 | redirect_https / redirect_not_approved | unknown | 165 | discovery |
| Appium API / appiumapi | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| arcsecond.io / arcsecondio | [GET](https://api.arcsecond.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 212 | discovery |
| Argentina Open Data API / argentinaopendataapi-9c9e04f3 | [GET](https://datos.gob.ar/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://datos.gob.ar) | 863 | discovery |
| arXiv / arxiv | [GET](https://arxiv.org/help/api/user-manual/) | 301 | redirect_https / redirect_not_approved | unknown | 74 | discovery |
| Atlantis / atlantis | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Atom / atom | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Australia Data API / australiadataapi-4658e2bd | [GET](https://data.gov.au/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gov.au) | 335 | discovery |
| Australia Government API / australiagovernmentapi | [GET](https://data.gov.au/data/api/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 1318 | discovery |
| Australian Bureau of Statistics / australianbureauofstatistics | [GET](https://abs.gov.au/) | 301 | redirect_https / redirect_not_approved | unknown | 420 | discovery |
| Australian Open Data / australiadataapi-4658e2bd | [GET](https://data.gov.au/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Auth.js / authjs | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Automerge / automerge | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Aviationstack / aviationstack | [GET](https://aviationstack.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 735 | discovery |
| AviationWeather / aviationweather | [GET](https://aviationweather.gov/api/data/metar?ids=KJFK&format=json) | 200 | ok / ok_json | [free](https://www.weather.gov/disclaimer) | 267 | callable |
| Axolotl / axolotl | [GET](https://theaxolotlapi.netlify.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 516 | discovery |
| Axolotl API / axolotl | [GET](https://theaxolotlapi.netlify.app/) | 200 | duplicate / duplicate | unknown | - | discovery |
| aztro / aztro | [GET](https://aztro.sameerkumar.website/) | 404 | wrong_base_url_path / http_error | unknown | 443 | discovery |
| Babylon.js / babylonjs | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Backstage / backstage | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Bacon Ipsum / baconipsum | [GET](https://baconipsum.com/api/?type=all-meat&sentences=1) | 200 | ok / ok_json | [free](https://baconipsum.com/json-api/) | 570 | callable |
| BaconMockup / baconmockup | [GET](https://baconmockup.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 560 | discovery |
| Banca d'Italia / bancaditalia | [GET](https://www.bancaditalia.it/statistiche/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 490 | discovery |
| Banco Central Brazil / bancocentralbrazil | [GET](https://dadosabertos.bcb.gov.br/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2423 | discovery |
| Bandsintown / bandsintown | [GET](https://app.swaggerhub.com/apis/Bandsintown/PublicAPI/3.0.0/) | 404 | wrong_base_url_path / http_error | unknown | 436 | discovery |
| Bangladesh Open Data API / bangladeshopendataapi | [GET](https://data.gov.bd/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gov.bd) | 1003 | discovery |
| Bank Negara Malaysia Open Data / banknegaramalaysiaopendata | [GET](https://apikijangportal.bnm.gov.my/) | 403 | unresolved / access_denied | unknown | 114 | discovery |
| Bank of Canada / bankofcanada | [GET](https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1) | 200 | ok / ok_json | [free](https://www.bankofcanada.ca/valet-api-how-to/) | 216 | callable |
| Bank of Canada Rates / bankofcanadarates | [GET](https://www.bankofcanada.ca/rates/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1076 | discovery |
| Bank of Israel / bankofisrael | [GET](https://www.boi.org.il/en/DataAndStatistics/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 363 | discovery |
| Bank of Russia / bankofrussia | [GET](https://www.cbr.ru/development/SXML/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 313 | discovery |
| Banque de France / banquedefrance | [GET](https://webstat.banque-france.fr/ws/) | 404 | wrong_base_url_path / http_error | unknown | 703 | discovery |
| Barcode Generator API / barcodegeneratorapi | [GET](https://bwipjs-api.metafloor.com/) | 200 | unresolved / invalid_response | [free](https://bwipjs-api.metafloor.com) | 499 | discovery |
| BayFiles / bayfiles | [GET](https://bayfiles.com/docs/api/) | 0 | dead_upstream / network_error | unknown | 21 | discovery |
| BC Ferries / bcferries | [GET](https://www.bcferriesapi.ca/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 554 | discovery |
| Beeceptor / beeceptor | [GET](https://beeceptor.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 124 | discovery |
| Beeminder / beeminder | [GET](https://www.beeminder.com/api/) | 301 | redirect_https / redirect_not_approved | unknown | 463 | discovery |
| Behance / behance | [GET](https://www.behance.net/dev/api/endpoints/) | 404 | wrong_base_url_path / http_error | unknown | 437 | discovery |
| Bhagavad Gita telugu / bhagavadgitatelugu | [GET](https://gita-api.vercel.app/) | 200 | unresolved / invalid_response | unknown | 1617 | discovery |
| Bible / bible | [GET](https://bible-api.com/john+3:16) | 200 | ok / ok_json | [free](https://bible-api.com/) | 441 | callable |
| Bible API / bibleapi | [GET](https://bible-api.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1054 | discovery |
| Bible API 2 / bibleapi | [GET](https://bible-api.com/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Bible API Public / bibleapi | [GET](https://bible-api.com/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Bible JSON API / bibleapi | [GET](https://bible-api.com/) | 200 | duplicate / duplicate | unknown | - | discovery |
| BigML / bigml | [GET](https://bigml.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 327 | discovery |
| Billogram / billogram | [GET](https://billogram.com/api/) | 308 | redirect_https / redirect_not_approved | unknown | 275 | discovery |
| Binlist / binlist | [GET](https://binlist.net/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 125 | discovery |
| BioThings / biothings | [GET](https://mygene.info/v3/gene/1017?fields=symbol,name) | 200 | ok / ok_json | [free](https://mygene.info/terms) | 873 | callable |
| Biriyani As A Service / biriyaniasaservice | [GET](https://biriyani.anoram.com/) | 503 | dead_upstream / http_error | unknown | 1249 | discovery |
| BitcoinCharts / bitcoincharts | [GET](https://bitcoincharts.com/about/exchanges/) | 0 | timeout / timeout | unknown | 256 | discovery |
| Bitcoincharts API / bitcoinchartsapi | [GET](https://bitcoincharts.com/about/markets-api/) | 0 | timeout / timeout | unknown | 1253 | discovery |
| Block.io / blockio | [GET](https://block.io/) | 302 | redirect_https / redirect_not_approved | unknown | 76 | discovery |
| Blockchain Exchange Rates / blockchainexchangerates | [GET](https://blockchain.info/api/exchange_rates_api/) | 301 | redirect_https / redirect_not_approved | unknown | 133 | discovery |
| BNM Moldova Rates / bnmmoldovarates | [GET](https://bnm.md/en/content/official-exchange-rates/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1959 | discovery |
| Board Game Geek / boardgamegeek | [GET](https://boardgamegeek.com/wiki/page/BGG_XML_API2/) | 403 | unresolved / access_denied | unknown | 102 | discovery |
| Bob's Burgers / bobsburgers | [GET](https://bobs-burgers-api-ui.herokuapp.com/) | 503 | dead_upstream / http_error | unknown | 1214 | discovery |
| Bokio / bokio | [GET](https://www.bokio.se/integrations/) | 404 | wrong_base_url_path / http_error | unknown | 426 | discovery |
| BOM Australia Weather / bomapi | [GET](https://www.bom.gov.au/catalogue/data-feeds.shtml/) | 403 | duplicate / duplicate | unknown | - | discovery |
| Bored / bored | [GET](https://www.boredapi.com/api/activity) | 0 | dead_upstream / network_error | unknown | 3 | discovery |
| BoredAPI / bored | [GET](https://www.boredapi.com/api/activity) | 0 | duplicate / duplicate | unknown | - | discovery |
| Brackets / brackets | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Brazil / brazil | [GET](https://brasilapi.com.br/api/feriados/v1/2026) | 200 | ok / ok_json | [free](https://brasilapi.com.br/docs) | 148 | callable |
| Brazil Central Bank Open Data / bancocentralbrazil | [GET](https://dadosabertos.bcb.gov.br/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Brazil Data API / brazildataapi | [GET](https://dados.gov.br/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 406 | discovery |
| Brazil Open Data API / brazildataapi | [GET](https://dados.gov.br/) | 200 | duplicate / duplicate | [free](https://dados.gov.br) | - | discovery |
| Brazil Receita WS / brazilreceitaws | [GET](https://www.receitaws.com.br/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 569 | discovery |
| Brønnøysundregistrene / brnnysundregistrene | [GET](https://data.brreg.no/enhetsregisteret/api/organisasjonsformer) | 200 | ok / ok_json | [free](https://data.brreg.no/enhetsregisteret/api/docs/index.html) | 295 | callable |
| Brreg / brnnysundregistrene | [GET](https://data.brreg.no/enhetsregisteret/api/organisasjonsformer) | 200 | duplicate / duplicate | [free](https://www.brreg.no/en/use-of-data-from-the-bronnoysund-register-centre/) | - | alias of brnnysundregistrene |
| Buddy CI / buddyci | [GET](https://buddy.works/api/reference/getting-started/overview/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2575 | discovery |
| Bugsnax / bugsnax | [GET](https://www.bugsnaxapi.com/) | 0 | dead_upstream / network_error | unknown | 5 | discovery |
| Bugzilla / bugzilla | [GET](https://wiki.mozilla.org/Bugzilla:REST_API/) | 404 | wrong_base_url_path / http_error | unknown | 477 | discovery |
| Bundesbank API / bundesbankapi | [GET](https://api.statistiken.bundesbank.de/rest/data/BBEX3/D.USD.EUR.BB.AC.000?lastNObservations=1) | 200 | ok / ok_xml | [free](https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.de.html) | 162 | callable |
| Callook.info / callookinfo | [GET](https://callook.info/W1AW/json) | 200 | ok / ok_json | [free](https://callook.info/api_reference.php) | 398 | callable |
| CamScanner / camscanner | [GET](https://dev.camscanner.com/?language=en-us) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1044 | discovery |
| Canada Government API / canadagovernmentapi | [GET](https://open.canada.ca/en/access-our-application-programming-interface-api/) | 301 | redirect_https / redirect_not_approved | unknown | 684 | discovery |
| Canada Open Data API / canadaopendataapi | [GET](https://open.canada.ca/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://open.canada.ca) | 2109 | discovery |
| Canadian Open Data / canadaopendataapi | [GET](https://open.canada.ca/) | 200 | duplicate / duplicate | unknown | - | discovery |
| CapRover / caprover | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Carbon API / carbonapi | [GET](https://carbon.now.sh/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://carbon.now.sh) | 108 | discovery |
| Cat as a Service / catasaservice | [GET](https://cataas.com/api/tags?limit=1) | 200 | ok / ok_json | [free](https://cataas.com/) | 368 | callable |
| Cat Facts API / catfactsapi | [GET](https://catfact.ninja/fact) | 200 | ok / ok_json | [free](https://catfact.ninja/) | 190 | callable |
| Cataas / cataas | [GET](https://cataas.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1017 | discovery |
| Catastro Spain / catastrospain | [GET](https://www.catastro.meh.es/) | 0 | dead_upstream / network_error | unknown | 5 | discovery |
| Catboy / catboy | [GET](https://api.catboys.com/img) | 0 | redirect_https / tls_error | [free](https://catboys.com/api) | 331 | discovery |
| Catboy API / catboyapi | [GET](https://catboys.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 423 | discovery |
| CBE Egypt / cbeegypt | [GET](https://www.cbe.org.eg/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 121 | discovery |
| CBK Kenya / cbkkenya | [GET](https://www.centralbank.go.ke/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1909 | discovery |
| CBN Nigeria / cbnnigeria | [GET](https://www.cbn.gov.ng/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 167 | discovery |
| CBN Nigeria Rates / cbnnigeriarates | [GET](https://www.cbn.gov.ng/rates/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1057 | discovery |
| CBR Russia / cbrrussia | [GET](https://cbr.ru/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 309 | discovery |
| CBR Russia API / cbrrussiaapi | [GET](https://www.cbr.ru/development/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 208 | discovery |
| CBS Netherlands / cbsnetherlands | [GET](https://opendata.cbs.nl/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 245 | discovery |
| CBUAE UAE / cbuaeuae | [GET](https://www.centralbank.ae/) | 301 | redirect_https / redirect_not_approved | unknown | 75 | discovery |
| CDNJS / cdnjs | [GET](https://api.cdnjs.com/libraries/jquery?fields=name,version) | 200 | ok / ok_json | [free](https://cdnjs.com/api) | 79 | callable |
| Central Bank Ireland Data / centralbankirelanddata | [GET](https://data.gov.ie/data/search/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1495 | discovery |
| Chainlink / chainlink | [GET](https://chain.link/developer-resources/) | 301 | redirect_https / redirect_not_approved | unknown | 1222 | discovery |
| Chainpoint / chainpoint | [GET](https://tierion.com/chainpoint/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 561 | discovery |
| Changelogs.md / changelogsmd | [GET](https://changelogs.md/) | 301 | redirect_https / redirect_not_approved | unknown | 694 | discovery |
| CheapShark / cheapshark | [GET](https://www.cheapshark.com/api/1.0/stores) | 200 | ok / ok_json | [free](https://apidocs.cheapshark.com/) | 164 | callable |
| ChEBI / chebi | [GET](https://www.ebi.ac.uk/chebi/backend/api/public/compound/15377/) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/chebi/about) | 508 | callable |
| Chess.com / chesscom | [GET](https://api.chess.com/pub/player/hikaru) | 200 | ok / ok_json | [free](https://www.chess.com/news/view/published-data-api) | 255 | callable |
| Chess.com API / chesscomapi | [GET](https://www.chess.com/news/view/published-data-api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1838 | discovery |
| Chicago Data Portal API / chicagodataportalapi | [GET](https://data.cityofchicago.org/api/views/metadata/v1?limit=1&page=1) | 200 | ok / ok_json | [free](https://www.chicago.gov/city/en/narr/foia/data_disclaimer.html) | 1851 | callable |
| Chile Open Data API / chileopendataapi | [GET](https://datos.gob.cl/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://datos.gob.cl) | 2295 | discovery |
| Chinese Text Project / chinesetextproject | [GET](https://ctext.org/tools/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 496 | discovery |
| chucknorris.io / chucknorrisio | [GET](https://api.chucknorris.io/jokes/random) | 200 | ok / ok_json | [free](https://api.chucknorris.io/) | 195 | callable |
| City Bikes / citybikes-121fa4c9 | [GET](https://api.citybik.es/v2/networks?fields=id,name) | 200 | ok / ok_json | [free](https://api.citybik.es/v2/) | 325 | callable |
| City, Berlin / cityberlin | [GET](https://daten.berlin.de/) | 403 | unresolved / access_denied | unknown | 255 | discovery |
| City, Gdańsk / citygdask | [GET](https://ckan.multimediagdansk.pl/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.multimediagdansk.pl/about) | 266 | callable |
| City, Helsinki / cityhelsinki | [GET](https://hri.fi/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://hri.fi/en_gb/terms-and-conditions/) | 323 | callable |
| City, Lviv / citylviv | [GET](https://opendata.city-adm.lviv.ua/) | 403 | unresolved / access_denied | unknown | 83 | discovery |
| City, New York Open Data / citynewyorkopendata | [GET](https://opendata.cityofnewyork.us/) | 301 | redirect_https / redirect_not_approved | unknown | 276 | discovery |
| City, Toronto Open Data / citytorontoopendata | [GET](https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://open.toronto.ca/open-data-licence/) | 112 | callable |
| Classify / classify | [GET](https://classify-web.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 442 | discovery |
| ClinicalTrials.gov / clinicaltrialsgov | [GET](https://clinicaltrials.gov/api/v2/studies?pageSize=1&format=json) | 200 | ok / ok_json | [free](https://clinicaltrials.gov/data-api/api) | 232 | callable |
| CNMV Spain / cnmvspain | [GET](https://www.cnmv.es/) | 302 | redirect_https / redirect_not_approved | unknown | 349 | discovery |
| CocktailDB API / cocktaildbapi | [GET](https://www.thecocktaildb.com/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 205 | discovery |
| CocoaPods / cocoapods | - | 0 | commercial_permission / reviewed_exclusion | [free](https://cocoapods.org) | 0 | discovery |
| Codeberg / codeberg | [GET](https://codeberg.org/api/v1/repos/forgejo/forgejo) | 200 | ok / ok_json | [free](https://docs.codeberg.org/getting-started/what-is-codeberg/) | 201 | callable |
| Codeium / codeium | [GET](https://codeium.com/api/) | 301 | redirect_https / redirect_not_approved | unknown | 194 | discovery |
| Codewars API / codewarsapi | [GET](https://www.codewars.com/api/v1/code-challenges/valid-braces) | 200 | ok / ok_json | [free](https://dev.codewars.com/) | 521 | callable |
| Coding / coding | [GET](https://open.coding.net/) | 302 | redirect_https / redirect_not_approved | unknown | 1310 | discovery |
| Coffee / coffee | [GET](https://coffee.alexflipnote.dev/random.json) | 200 | ok / ok_json | [free](https://coffee.alexflipnote.dev/) | 519 | callable |
| Coffee API / coffeeapi | [GET](https://coffee.alexflipnote.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1180 | discovery |
| CoinDesk / coindesk | [GET](https://old.coindesk.com/coindesk-api/) | 0 | dead_upstream / network_error | unknown | 14 | discovery |
| CoinDesk API / coindesk | [GET](https://old.coindesk.com/coindesk-api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Coinlore / coinlore | [GET](https://api.coinlore.net/api/global/) | 200 | ok / ok_json | [free](https://www.coinlore.com/cryptocurrency-data-api) | 153 | callable |
| Coinlore API / coinloreapi | [GET](https://www.coinlore.com/cryptocurrency-data-api/) | 301 | redirect_https / redirect_not_approved | unknown | 158 | discovery |
| Coinpaprika / coinpaprika | [GET](https://api.coinpaprika.com/) | 302 | redirect_https / redirect_not_approved | unknown | 167 | discovery |
| CoinPaprika API / coinpaprika | [GET](https://api.coinpaprika.com/) | 302 | duplicate / duplicate | unknown | - | discovery |
| CollegeScoreCard / collegescorecard | [GET](https://collegescorecard.ed.gov/data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 122 | discovery |
| CollegeScoreCard.ed.gov / collegescorecard | [GET](https://collegescorecard.ed.gov/data/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Colombia Open Data API / colombiaopendataapi | [GET](https://api.us.socrata.com/api/catalog/v1?domains=www.datos.gov.co&limit=1) | 200 | ok / ok_json | [free](https://herramientas.datos.gov.co/terminos) | 825 | callable |
| Color API / colorapi | [GET](https://www.thecolorapi.com/id?hex=0047AB) | 200 | ok / ok_json | [free](https://www.thecolorapi.com/docs) | 503 | callable |
| Colorado Information Marketplace / coloradoinformationmarketplace | [GET](https://data.colorado.gov/) | 406 | unresolved / http_error | unknown | 717 | discovery |
| Coronavirus / coronavirus | [GET](https://pipedream.com/@pravin/http-api-for-latest-wuhan-coronavirus-data-2019-ncov-p_G6CLVM/readme/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 423 | discovery |
| Corporate BS / corporatebs | [GET](https://corporatebs-generator.sameerkumar.website/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 598 | discovery |
| Cosign / sigstore | [GET](https://sigstore.dev/) | 301 | duplicate / duplicate | unknown | - | discovery |
| CountAPI / countapi | [GET](https://countapi.xyz/) | 0 | dead_upstream / network_error | unknown | 193 | discovery |
| Countly / countly | [GET](https://api.count.ly/reference/) | 404 | wrong_base_url_path / http_error | unknown | 103 | discovery |
| Countries GraphQL / countriesgraphql | [GET](https://countries.trevorblades.com/?query=%7Bcountry(code%3A%22SE%22)%7Bname%7D%7D) | 200 | ok / ok_json | [free](https://github.com/trevorblades/countries) | 119 | callable |
| Country Flags API / countryflagsapi | [GET](https://flagcdn.com/en/codes.json) | 200 | ok / ok_json | [free](https://flagpedia.net/download/api) | 87 | callable |
| Country.is / countryis | [GET](https://api.country.is/8.8.8.8) | 200 | ok / ok_json | [free](https://country.is/) | 76 | callable |
| Covid Tracking Project / covidtrackingproject | [GET](https://covidtracking.com/data/api/version-2/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 340 | discovery |
| Covid-19 Datenhub / covid19datenhub | [GET](https://npgeo-corona-npgeo-de.hub.arcgis.com/) | 404 | wrong_base_url_path / http_error | unknown | 564 | discovery |
| Covid-19 Government Response / covid19governmentresponse | [GET](https://covidtracker.bsg.ox.ac.uk/) | 301 | redirect_https / redirect_not_approved | unknown | 342 | discovery |
| Covid-19 India / covid19india | [GET](https://data.covid19india.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 611 | discovery |
| Covid-19 JHU CSSE / covid19jhucsse | [GET](https://nuttaphat.com/covid19-api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 139 | discovery |
| COVID-19 Tracker Canada / covid19trackercanada | [GET](https://api.covid19tracker.ca/docs/1.0/overview/) | 200 | unresolved / invalid_response | unknown | 773 | discovery |
| COVID-19 Tracker Sri Lanka / covid19trackersrilanka | [GET](https://www.hpb.health.gov.lk/en/api-documentation/) | 0 | redirect_https / tls_error | unknown | 528 | discovery |
| COVID-ID / covidid | [GET](https://data.covid19.go.id/public/api/prov.json/) | 0 | timeout / timeout | unknown | 10180 | discovery |
| Crafatar / crafatar | [GET](https://crafatar.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 236 | discovery |
| Creatomate / creatomate | [GET](https://creatomate.com/docs/api/introduction/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2461 | discovery |
| CrossRef / crossref | [GET](https://api.crossref.org/works?rows=1) | 200 | ok / ok_json | [free](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) | 1658 | callable |
| CryptingUp / cryptingup | [GET](https://www.cryptingup.com/apidoc/) | 302 | redirect_https / redirect_not_approved | unknown | 495 | discovery |
| CryptoCompare / cryptocompare | [GET](https://www.cryptocompare.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 307 | discovery |
| Cryptonator / cryptonator | [GET](https://www.cryptonator.com/api/) | 0 | dead_upstream / network_error | unknown | 247 | discovery |
| Cryptonator API / cryptonator | [GET](https://www.cryptonator.com/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| CurrencyScoop.com / currencyscoopcom | [GET](https://currencyscoop.com/) | 301 | redirect_https / redirect_not_approved | unknown | 189 | discovery |
| Cursor / cursor | [GET](https://cursor.sh/) | 308 | redirect_https / redirect_not_approved | freemium | 98 | discovery |
| Curve / curve | [GET](https://api.curve.finance/v1/getETHprice) | 200 | ok / ok_json | [free](https://docs.curve.finance/developer/integration/api/curve-api/) | 275 | callable |
| CVR / cvr | [GET](https://datacvr.virk.dk/) | 403 | unresolved / access_denied | unknown | 84 | discovery |
| CVR API / cvr | [GET](https://datacvr.virk.dk/) | 403 | duplicate / duplicate | [free](https://datacvr.virk.dk) | - | discovery |
| Czech Namedays / czechnamedays | [GET](https://svatky.adresa.info/) | 402 | unresolved / http_error | unknown | 259 | discovery |
| Czech Namedays Calendar / czechnamedays | [GET](https://svatky.adresa.info/) | 402 | duplicate / duplicate | unknown | - | discovery |
| Czech National Bank / czechnationalbank | [GET](https://www.cnb.cz/en/financial_markets/foreign_exchange_market/exchange_rate_fixing/daily.txt) | 200 | ok / ok_text | [free](https://www.cnb.cz/en/privacy-statement-and-disclaimer/disclaimer-copyright/) | 181 | callable |
| Danbooru / danbooru | [GET](https://danbooru.donmai.us/posts?tags=help%3Aapi) | 200 | unresolved / invalid_response | unknown | 201 | discovery |
| Danish data service Energi / danishdataserviceenergi | [GET](https://api.energidataservice.dk/dataset/CO2Emis?start=now-PT15M&limit=1) | 200 | ok / ok_json | [free](https://www.energidataservice.dk/guides/api-guides) | 219 | callable |
| Danish Energi Data / danishenergidata | [GET](https://www.energidataservice.dk/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 357 | discovery |
| Data USA / datausa | [GET](https://api.datausa.io/tesseract/data.jsonrecords?cube=acs_yg_total_population_5&drilldowns=State,Year&measures=Population&include=Year:2023&limit=1,0) | 200 | ok / ok_json | [free](https://datausa.io/about/api/) | 89 | callable |
| data.gov.dk / datagovdk | [GET](https://data.gov.dk/api/) | 404 | wrong_base_url_path / http_error | unknown | 175 | discovery |
| Data.gov.sg / datagovsg | [GET](https://data.gov.sg/developer/) | 302 | redirect_https / redirect_not_approved | unknown | 1023 | discovery |
| data.norge.no / datanorgeno | [GET](https://data.norge.no/api/) | 301 | redirect_https / redirect_not_approved | unknown | 181 | discovery |
| Data.parliament.uk / ukparliamentapi | [GET](https://members-api.parliament.uk/api/Members/Search?skip=0&take=1) | 200 | duplicate / duplicate | [free](https://www.parliament.uk/site-information/copyright-parliament/open-parliament-licence/) | - | alias of ukparliamentapi |
| Dataflow Kit COVID-19 / dataflowkitcovid19 | [GET](https://covid-19.dataflowkit.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 245 | discovery |
| Datamuse / datamuse | [GET](https://api.datamuse.com/words?ml=star&max=1) | 200 | ok / ok_json | [free](https://www.datamuse.com/api/) | 106 | callable |
| Datamuse API / datamuseapi | [GET](https://www.datamuse.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 459 | discovery |
| Datayes / datayes | [GET](https://m.datayes.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1045 | discovery |
| Deck of Cards API / deckofcardsapi | [GET](https://deckofcardsapi.com/api/deck/new/draw/?count=1) | 200 | ok / ok_json | [free](https://deckofcardsapi.com/) | 228 | callable |
| Deepcode / deepcode | [GET](https://www.deepcode.ai/) | 301 | redirect_https / redirect_not_approved | unknown | 685 | discovery |
| DeFiLlama API / defillamaapi | [GET](https://api.llama.fi/v2/chains) | 200 | ok / ok_json | [free](https://api-docs.defillama.com/) | 181 | callable |
| Dendron / dendron | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Destatis API / destatisapi | [GET](https://www-genesis.destatis.de/genesis/online/) | 307 | redirect_https / redirect_not_approved | unknown | 284 | discovery |
| Destatis Germany / destatisgermany | [GET](https://destatis.de/) | 302 | redirect_https / redirect_not_approved | unknown | 144 | discovery |
| Detect Language API / detectlanguageapi | [GET](https://rapidapi.com/BigLobster/api/language-identification-prediction/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1557 | discovery |
| DevITjobs UK / devitjobsuk | [GET](https://devitjobs.uk/job_feed.xml/) | 200 | gateway_block / body_limit | unknown | 1109 | discovery |
| Devpod / devpod | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| DIBS / dibs | [GET](https://tech.dibspayment.com/) | 0 | dead_upstream / network_error | unknown | 30 | discovery |
| Dicebear Avatars / dicebearavatars | - | 0 | commercial_permission / reviewed_exclusion | unknown | 0 | discovery |
| DigiDates / digidates | [GET](https://digidates.de/api/v1/unixtime) | 200 | ok / ok_json | [free](https://digidates.de/en/) | 274 | callable |
| DigiDates API / digidatesapi | [GET](https://digidates.de/en/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://digidates.de/en) | 1056 | discovery |
| Digimon Information / digimoninformation | [GET](https://digimon-api.vercel.app/api/digimon/name/agumon) | 200 | ok / ok_json | [free](https://digimon-api.vercel.app/) | 397 | callable |
| DigitalOcean Spaces / digitaloceanspaces | [GET](https://www.digitalocean.com/products/spaces/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1069 | discovery |
| DigitalOcean Status / digitaloceanstatus | [GET](https://status.digitalocean.com/api/) | 406 | unresolved / http_error | unknown | 708 | discovery |
| Digitraffic Finland / digitrafficfinland | [GET](https://rata.digitraffic.fi/api/v1/metadata/train-types) | 200 | ok / ok_json | [free](https://www.digitraffic.fi/en/terms-of-service/) | 319 | callable |
| Diigo / diigo | [GET](https://www.diigo.com/api_dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1025 | discovery |
| Dingtalk / dingtalk | [GET](https://open-doc.dingtalk.com/) | 302 | redirect_https / redirect_not_approved | unknown | 658 | discovery |
| Disify / disify | [GET](https://disify.com/api/email/example@example.com) | 200 | ok / ok_json | [free](https://disify.com/) | 352 | callable |
| Disney / disney | [GET](https://api.disneyapi.dev/character?pageSize=1) | 200 | ok / ok_json | [free](https://disneyapi.dev/docs/) | 352 | callable |
| Disney API / disneyapi | [GET](https://disneyapi.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 86 | discovery |
| DMI / dmi | [GET](https://www.dmi.dk/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 251 | discovery |
| Dog CEO / dogceo | [GET](https://dog.ceo/api/breeds/image/random) | 200 | ok / ok_json | [free](https://dog.ceo/dog-api/) | 103 | callable |
| Dogs / dogs | [GET](https://dog.ceo/dog-api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1049 | discovery |
| Dogs API / dogs | [GET](https://dog.ceo/dog-api/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Dokku / dokku | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| DomainDb Info / domaindbinfo | [GET](https://api.domainsdb.info/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 375 | discovery |
| Domainsdb.info / domainsdbinfo | [GET](https://domainsdb.info/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 212 | discovery |
| Domoticz / domoticz | [GET](https://domoticz.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 211 | discovery |
| Driver.js / driverjs | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Drivet URL Shortener / driveturlshortener | [GET](https://wiki.drivet.xyz/en/url-shortener/add-links/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 212 | discovery |
| Drizzle ORM / drizzleorm | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| DropMail / dropmail | [GET](https://dropmail.me/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 316 | discovery |
| Drupal.org / drupalorg | [GET](https://www.drupal.org/api-d7/node.json?type=project_module&limit=1) | 200 | ok / ok_json | [free](https://www.drupal.org/about/licensing) | 202 | callable |
| DSB Statistics Denmark / dsbstatisticsdenmark | [GET](https://api.statbank.dk/v1/subjects?lang=en&format=JSON) | 200 | ok / ok_json | [free](https://api.statbank.dk/console) | 242 | callable |
| DuckDuckGo / duckduckgo | [GET](https://duckduckgo.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1287 | discovery |
| Ducks Unlimited / ducksunlimited | [GET](https://gis.ducks.org/datasets/du-university-chapters/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 672 | discovery |
| Dungeons and Dragons (Alternate) / dungeonsanddragonsalternate | [GET](https://api.open5e.com/v2/creatures/?limit=1&fields=key,name) | 200 | ok / ok_json | [free](https://open5e.com/api-docs) | 83 | callable |
| Duolingo API / duolingoapi | [GET](https://www.duolingo.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 522 | discovery |
| Dutch CBS API / dutchcbsapi | [GET](https://opendata.cbs.nl/ODataApi/OData/37296ned/TableInfos?$format=json) | 200 | ok / ok_json | [free](https://www.cbs.nl/en-gb/about-us/website/copyright) | 160 | callable |
| DVC / dvc | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://dvc.org) | 0 | discovery |
| Dynamic QR Code / dynamicqrcode | [GET](https://rapidapi.com/updeploy-tools/api/qr-code-dynamic-and-static1/details/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1262 | discovery |
| ECB API / ecbapi | [GET](https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?lastNObservations=1&format=csvdata) | 200 | ok / ok_csv | [free](https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.de.html) | 195 | callable |
| ECB Exchange Rates / ecbapi | [GET](https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?lastNObservations=1&format=csvdata) | 200 | duplicate / duplicate | [free](https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.de.html) | - | alias of ecbapi |
| Econdb / econdb | [GET](https://www.econdb.com/api/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 320 | discovery |
| Ecuador Open Data API / ecuadoropendataapi | [GET](https://datosabiertos.gob.ec/) | 403 | unresolved / access_denied | [free](https://datosabiertos.gob.ec) | 988 | discovery |
| Egypt Open Data API / egyptopendataapi | [GET](https://data.gov.eg/) | 0 | dead_upstream / network_error | [free](https://data.gov.eg) | 392 | discovery |
| EnergyStar / energystar | [GET](https://energystar.gov/) | 301 | redirect_https / redirect_not_approved | unknown | 525 | discovery |
| English Random Words / englishrandomwords | [GET](https://random-words-api.vercel.app/word/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 499 | discovery |
| Ensembl / ensembl | [GET](https://rest.ensembl.org/lookup/id/ENSG00000139618?content-type=application/json) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/about/terms-of-use/) | 4719 | callable |
| Ensembl API / ensemblapi | [GET](https://rest.ensembl.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 19069 | discovery |
| Entur / entur | [GET](https://api.entur.io/) | 404 | wrong_base_url_path / http_error | unknown | 129 | discovery |
| Environment Agency / environmentagency | [GET](https://environment.data.gov.uk/flood-monitoring/id/stations?_limit=1) | 200 | ok / ok_json | [free](https://environment.data.gov.uk/flood-monitoring/doc/reference) | 285 | callable |
| Environment Canada API / environmentcanadaapi | [GET](https://api.weather.gc.ca/collections/hydrometric-stations?f=json) | 200 | ok / ok_json | [free](https://eccc-msc.github.io/open-data/licence/readme_en/) | 414 | callable |
| EPA API / epaapi | [GET](https://www.epa.gov/enviro/web-services/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.epa.gov/enviro/web-services) | 1077 | discovery |
| Ergast F1 API / ergastf1 | [GET](https://ergast.com/mrd/) | 200 | duplicate / duplicate | [free](https://ergast.com/mrd) | - | discovery |
| ESPN / espn | [GET](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b/) | 404 | wrong_base_url_path / http_error | [free](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b) | 475 | discovery |
| Ethiopia Open Data API / ethiopiaopendataapi | [GET](https://data.gov.et/) | 0 | dead_upstream / network_error | [free](https://data.gov.et) | 5 | discovery |
| EU Data Portal API / eudataportalapi | [GET](https://data.europa.eu/api/hub/repo/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 125 | discovery |
| EU Open Data / euopendata | [GET](https://data.europa.eu/en/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 3995 | discovery |
| EU Open Data Portal / euopendata | [GET](https://data.europa.eu/en/) | 200 | duplicate / duplicate | [free](https://data.europa.eu/en) | - | discovery |
| EU Open Data Portal API / euopendataportalapi | [GET](https://data.europa.eu/en/publications/dataeuropa-academy/) | 404 | wrong_base_url_path / http_error | [free](https://data.europa.eu/en/publications/dataeuropa-academy) | 1913 | discovery |
| Euromap 77 / euromap77 | [GET](https://www.euromap.org/euromap77/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 414 | discovery |
| European Space Agency API / europeanspaceagencyapi | [GET](https://api.esa.int/) | 0 | dead_upstream / network_error | [free](https://api.esa.int) | 3 | discovery |
| European Union / europeanunion | [GET](https://data.europa.eu/api/) | 404 | wrong_base_url_path / http_error | unknown | 2200 | discovery |
| Eurostat API / eurostatapi | [GET](https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_pjan?geo=SE&sex=T&age=TOTAL&time=2025) | 200 | ok / ok_json | [free](https://ec.europa.eu/eurostat/web/user-guides/data-browser/api-data-access/api-introduction) | 177 | callable |
| EVA / eva | [GET](https://eva.pingutil.com/) | 0 | dead_upstream / network_error | unknown | 4 | discovery |
| EVA Email Validation / eva | [GET](https://eva.pingutil.com/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Evil Insult Generator / evilinsultgenerator | [GET](https://evilinsult.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 164 | discovery |
| Exchangerate.host / exchangeratehost | [GET](https://exchangerate.host/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 750 | discovery |
| Excuser / excuser | [GET](https://excuser.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 395 | discovery |
| Excuser API / excuser | [GET](https://excuser.herokuapp.com/) | 404 | duplicate / duplicate | unknown | - | discovery |
| F1 Data / f1data | [GET](https://formula1.com/) | 301 | redirect_https / redirect_not_approved | unknown | 296 | discovery |
| Fabric (Firebase) / fabricfirebase | [GET](https://firebase.google.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 842 | discovery |
| Faker / faker | [GET](https://fakerapi.it/) | 502 | dead_upstream / http_error | unknown | 2093 | discovery |
| Faker API / fakerapi-e867d1cb | [GET](https://fakerapi.it/api/v2/persons?_quantity=1) | 502 | dead_upstream / http_error | [free](https://fakerapi.it/en) | 2854 | discovery |
| FakeStoreAPI / fakestoreapi | [GET](https://fakestoreapi.com/products?limit=1) | 200 | ok / ok_json | [free](https://fakestoreapi.com/docs) | 187 | callable |
| Falco / falco | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| FAO / fao | [GET](https://fao.org/) | 301 | redirect_https / redirect_not_approved | unknown | 82 | discovery |
| FAO API / faoapi | [GET](https://www.fao.org/faostat/en/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.fao.org/faostat/en) | 171 | discovery |
| FASS / fass | [GET](https://www.fass.se/LIF/developer/) | 301 | redirect_https / redirect_not_approved | unknown | 110 | discovery |
| FBI Wanted / fbiwanted | [GET](https://api.fbi.gov/wanted/v1/list?pageSize=1) | 200 | ok / ok_json | [free](https://www.fbi.gov/wanted/api) | 111 | callable |
| FDA / fda | [GET](https://api.fda.gov/food/enforcement.json?limit=1) | 200 | ok / ok_json | [free](https://open.fda.gov/apis/authentication/) | 996 | callable |
| FDA API / fdaapi | [GET](https://open.fda.gov/apis/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://open.fda.gov/apis) | 276 | discovery |
| FDA Drug API / fdadrugapi | [GET](https://open.fda.gov/apis/drug/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 769 | discovery |
| FDA Food / fdafood | [GET](https://api.fda.gov/) | 404 | wrong_base_url_path / http_error | unknown | 560 | discovery |
| Fed Treasury / fedtreasury | [GET](https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/rates_of_exchange?page%5Bsize%5D=1) | 200 | ok / ok_json | [free](https://fiscaldata.treasury.gov/api-documentation/) | 764 | callable |
| Federal Register / federalregister | [GET](https://www.federalregister.gov/api/v1/documents.json?per_page=1) | 200 | ok / ok_json | [free](https://www.federalregister.gov/developers/documentation/api/v1) | 433 | callable |
| Feodo Tracker API / feodotrackerapi | [GET](https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.json) | 200 | ok / ok_json | [free](https://feodotracker.abuse.ch/blocklist/) | 234 | callable |
| FFXIV Collect / ffxivcollect | [GET](https://ffxivcollect.com/api/mounts/186) | 200 | ok / ok_json | [free](https://ffxivcollect.com/) | 304 | callable |
| FIFA Ultimate Team / fifaultimateteam | [GET](https://www.easports.com/fifa/ultimate-team/api/fut/item/) | 503 | dead_upstream / http_error | unknown | 1158 | discovery |
| FIFA Women's World Cup / fifawomensworldcup | [GET](https://worldcup.sfg.io/) | 0 | dead_upstream / network_error | unknown | 4 | discovery |
| FIFA World Cup / fifawomensworldcup | [GET](https://worldcup.sfg.io/) | 0 | duplicate / duplicate | unknown | - | discovery |
| File.io / fileio | [GET](https://www.file.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 132 | discovery |
| FilterLists / filterlists | [GET](https://filterlists.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 258 | discovery |
| Final Fantasy XIV / finalfantasyxiv | [GET](https://xivapi.com/) | 302 | redirect_https / redirect_not_approved | unknown | 87 | discovery |
| Finnish Meteorological Institute / finnishmeteorologicalinstitute | [GET](https://opendata.fmi.fi/wfs?request=getFeature&storedquery_id=fmi::observations::weather::simple&place=Helsinki&parameters=t2m&timestep=60&maxlocations=1) | 200 | ok / ok_xml | [free](https://en.ilmatieteenlaitos.fi/open-data) | 103 | callable |
| Fixer / fixer | - | 0 | needs_key / reviewed_exclusion | unknown | 0 | discovery |
| Fleep / fleep | [GET](https://fleep.io/fleepapi/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 274 | discovery |
| Focalboard / focalboard | [GET](https://focalboard.com/) | 530 | dead_upstream / http_error | unknown | 1034 | discovery |
| Football (Soccer) Videos / footballsoccervideos | [GET](https://www.scorebat.com/video-api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 463 | discovery |
| Forgejo / forgejo | [GET](https://forgejo.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 323 | discovery |
| France Data API / francedataapi | [GET](https://www.data.gouv.fr/en/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1261 | discovery |
| Frankfurter / frankfurter | [GET](https://api.frankfurter.dev/v1/latest) | 200 | ok / ok_json | [free](https://frankfurter.dev/) | 74 | callable |
| Frankfurter API / frankfurter | [GET](https://api.frankfurter.dev/v1/latest) | 200 | duplicate / duplicate | unknown | - | alias of frankfurter |
| Free Dictionary / freedictionary | [GET](https://api.dictionaryapi.dev/api/v2/entries/en/hello) | 200 | ok / ok_json | [free](https://dictionaryapi.dev/) | 86 | callable |
| Free Dictionary API / freedictionaryapi | [GET](https://dictionaryapi.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 148 | discovery |
| freeCodeCamp / freecodecamp | [GET](https://www.freecodecamp.org/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.freecodecamp.org) | 431 | discovery |
| freeCodeCamp API / freecodecampapi | [GET](https://www.freecodecamp.org/news/the-freecodecamp-api/) | 404 | wrong_base_url_path / http_error | unknown | 1175 | discovery |
| FreeForexAPI / freeforexapi | [GET](https://freeforexapi.com/Home/Api/) | 522 | dead_upstream / http_error | unknown | 19654 | discovery |
| FreeToGame / freetogame | [GET](https://www.freetogame.com/api/game?id=452) | 200 | ok / ok_json | [free](https://www.freetogame.com/api-doc) | 251 | callable |
| French Address Search / frenchaddresssearch | [GET](https://geo.api.gouv.fr/adresse/) | 404 | wrong_base_url_path / http_error | unknown | 173 | discovery |
| French INSEE API / frenchinseeapi | [GET](https://api.insee.fr/) | 0 | unresolved / network_error | [free](https://api.insee.fr) | 238 | discovery |
| Fruityvice / fruityvice | [GET](https://www.fruityvice.com/api/fruit/apple) | 200 | ok / ok_json | [free](https://www.fruityvice.com/) | 247 | callable |
| Fuck Off as a Service / foaas | [GET](https://www.foaas.com/) | 200 | duplicate / duplicate | unknown | - | discovery |
| FuelEconomy.gov / fueleconomygov | [GET](https://www.fueleconomy.gov/ws/rest/vehicle/31873) | 200 | ok / ok_json | [free](https://www.fueleconomy.gov/feg/ws/) | 930 | callable |
| Fun Fact / funfact | [GET](https://api.aakhilv.me/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 267 | discovery |
| Fun Fact API / funfact | [GET](https://api.aakhilv.me/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Fun Facts / funfacts | [GET](https://asli-fun-fact-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 455 | discovery |
| FunTranslations / funtranslations | [GET](https://api.funtranslations.com/) | 403 | unresolved / access_denied | unknown | 224 | discovery |
| Game of Thrones Quotes / gameofthronesquotes | [GET](https://api.gameofthronesquotes.xyz/v1/random) | 429 | rate_limit / rate_limited | [free](https://gameofthronesquotes.xyz/) | 1030 | discovery |
| GamerPower / gamerpower | [GET](https://www.gamerpower.com/api/giveaways?platform=steam) | 200 | ok / ok_json | [free](https://www.gamerpower.com/api-read) | 95 | callable |
| GBIF / gbif | [GET](https://api.gbif.org/v1/species/match?name=Puma%20concolor) | 200 | ok / ok_json | [free](https://www.gbif.org/developer/summary) | 128 | callable |
| GBIF API / gbifapi | [GET](https://www.gbif.org/developer/summary/) | 403 | unresolved / access_denied | unknown | 111 | discovery |
| GDBrowser / gdbrowser | - | 0 | unresolved / reviewed_exclusion | unknown | 0 | discovery |
| GDPR API / gdprapi | [GET](https://gdpr-info.eu/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 388 | discovery |
| Genderize / genderize | [GET](https://genderize.io/) | 406 | unresolved / http_error | unknown | 494 | discovery |
| Genderize.io / genderize | [GET](https://genderize.io/) | 406 | duplicate / duplicate | unknown | - | discovery |
| Genrenator / genrenator | [GET](https://binaryjazz.us/wp-json/genrenator/v1/genre/) | 200 | ok / ok_json | [free](https://binaryjazz.us/genrenator-api/) | 878 | callable |
| Genshin Impact / genshinimpact | [GET](https://genshin.jmp.blue/characters/amber) | 200 | ok / ok_json | [free](https://github.com/genshindev/api/blob/mistress/LICENSE) | 205 | callable |
| Genshin Impact API / genshinimpactapi | [GET](https://genshin.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 138 | discovery |
| Geocode.xyz / geocodexyz | [GET](https://geocode.xyz/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1043 | discovery |
| Geodata.gov.gr / geodatagovgr | [GET](https://geodata.gov.gr/en/) | 0 | timeout / timeout | unknown | 256 | discovery |
| GeographQL / geographql | [GET](https://geographql.netlify.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 155 | discovery |
| GeoJS / geojs | [GET](https://get.geojs.io/v1/ip/geo/8.8.8.8.json) | 200 | ok / ok_json | [free](https://www.geojs.io/docs/v1/endpoints/ip/) | 96 | callable |
| Geokeo / geokeo | [GET](https://geokeo.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 969 | discovery |
| geoPlugin / geoplugin | [GET](https://www.geoplugin.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 720 | discovery |
| Germany Data API / germanydataapi | [GET](https://www.govdata.de/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 373 | discovery |
| Ghana Open Data API / ghanaopendataapi | [GET](https://data.gov.gh/) | 0 | dead_upstream / network_error | [free](https://data.gov.gh) | 142 | discovery |
| Ghostwriter / ghostwriter | [GET](https://ghostwriter.kde.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 196 | discovery |
| Git.io / gitio | [GET](https://github.blog/2011-11-10-git-io-github-url-shortener/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2083 | discovery |
| Gitea / gitea | [GET](https://gitea.io/) | 301 | redirect_https / redirect_not_approved | unknown | 91 | discovery |
| GitHub Contribution Chart Generator / githubcontributionchartgenerator | [GET](https://github-contributions.vercel.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 90 | discovery |
| GitHub Contributions / githubcontributionchartgenerator | [GET](https://github-contributions.vercel.app/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Gogs / gogs | [GET](https://gogs.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1111 | discovery |
| Google BigQuery API / googlebigqueryapi | [GET](https://cloud.google.com/bigquery/docs/reference/rest/v2/) | 301 | redirect_https / redirect_not_approved | unknown | 1050 | discovery |
| goQR.me / goqrme | [GET](https://goqr.me/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 296 | discovery |
| GPT4All / gpt4all | [GET](https://gpt4all.io/) | 302 | redirect_https / redirect_not_approved | [free](https://gpt4all.io) | 90 | discovery |
| GraphQL Jobs / graphqljobs | [GET](https://graphql.jobs/docs/api/) | 0 | dead_upstream / network_error | unknown | 4 | discovery |
| Graphs for Coronavirus / graphsforcoronavirus | [GET](https://corona.dnsforfamily.com/api.txt/) | 0 | dead_upstream / network_error | unknown | 2 | discovery |
| Gravatar / gravatar | [GET](https://gravatar.com/99511d6010af8c574c31f94e1b327bba5e25086dd7b92a4b6f3e132b579cc8d1.json) | 200 | ok / ok_json | [free](https://docs.gravatar.com/guides/llms-txt/) | 529 | callable |
| Gravatar API / gravatar | [GET](https://gravatar.com/99511d6010af8c574c31f94e1b327bba5e25086dd7b92a4b6f3e132b579cc8d1.json) | 200 | duplicate / duplicate | [free](https://docs.gravatar.com/guides/llms-txt/) | - | alias of gravatar |
| GroupMe / groupme | [GET](https://dev.groupme.com/docs/v3/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 683 | discovery |
| GrünstromIndex / grnstromindex | [GET](https://gruenstromindex.de/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 207 | discovery |
| Grype / grype | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| GTFS Regional / gtfsregional | [GET](https://www.trafiklab.se/api/gtfs-regional/) | 404 | wrong_base_url_path / http_error | unknown | 133 | discovery |
| Gutendex / gutendex | [GET](https://gutendex.com/books/?ids=1342) | 200 | ok / ok_json | [free](https://gutendex.com/) | 87 | callable |
| HAPI FHIR / hapifhir | [GET](https://hapifhir.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 837 | discovery |
| Harry Potter API / harrypotterapi | [GET](https://hp-api.onrender.com/api/characters/staff) | 200 | ok / ok_json | [free](https://hp-api.onrender.com/) | 289 | callable |
| Harry Potter Charactes / harrypottercharactes | [GET](https://hp-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 504 | discovery |
| Hashable / hashable | [GET](https://hashable.space/pages/api/) | 0 | redirect_https / tls_error | unknown | 361 | discovery |
| Hashnode / hashnode | [GET](https://hashnode.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 774 | discovery |
| HealthData.gov / healthdatagov | [GET](https://healthdata.gov/) | 406 | unresolved / http_error | unknown | 654 | discovery |
| Hebrew Calendar / hebrewcalendar | [GET](https://www.hebcal.com/converter?cfg=json&gy=2026&gm=10&gd=15&g2h=1) | 200 | ok / ok_json | [free](https://www.hebcal.com/home/developer-apis) | 408 | callable |
| Helix / helix | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| HelloSalut / hellosalut | [GET](https://fourtonfish.com/project/hellosalut-api/) | 301 | redirect_https / redirect_not_approved | unknown | 665 | discovery |
| Hemingway Editor / hemingwayeditor | [GET](https://hemingwayapp.com/) | 200 | wrong_base_url_path / html_instead_of_api | freemium | 566 | discovery |
| heweather / heweather | [GET](https://www.heweather.com/documents/) | 404 | wrong_base_url_path / http_error | unknown | 413 | discovery |
| Hipster Ipsum / hipsteripsum | [GET](https://hipsum.co/api/?type=hipster-centric&sentences=1) | 200 | ok / ok_json | [free](https://hipsum.co/the-api/) | 616 | callable |
| hitokoto / hitokoto | [GET](https://hitokoto.cn/api/) | 302 | redirect_https / redirect_not_approved | unknown | 3375 | discovery |
| Homebrew / homebrew | [GET](https://formulae.brew.sh/api/formula/git.json) | 200 | ok / ok_json | [free](https://formulae.brew.sh/docs/api/) | 218 | callable |
| Hong Kong Data API / hongkongdataapi | [GET](https://data.gov.hk/en-data/api/3/action/package_list?limit=1) | 200 | ok / ok_json | [free](https://data.gov.hk/en/faq) | 762 | callable |
| Hong Kong GeoData Store / hongkonggeodatastore | [GET](https://geodata.gov.hk/gs/) | 0 | dead_upstream / network_error | unknown | 3 | discovery |
| Hong Kong Open Data API / hongkongopendataapi | [GET](https://data.gov.hk/en/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1330 | discovery |
| host-t.com / hosttcom | [GET](https://host-t.com/) | 301 | redirect_https / redirect_not_approved | unknown | 711 | discovery |
| HTTP Cat / httpcat | [GET](https://http.cat/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 103 | discovery |
| HTTP Dog / httpdog | [GET](https://http.dog/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 142 | discovery |
| HTTP2.Pro / http2pro | [GET](https://http2.pro/doc/api/) | 301 | redirect_https / redirect_not_approved | unknown | 91 | discovery |
| Httpbin / httpbin | [GET](https://httpbin.org/get) | 200 | ok / ok_json | [free](https://httpbin.org/) | 749 | callable |
| httpbin API / httpbinapi | [GET](https://httpbin.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1929 | discovery |
| Httpbin Cloudflare / httpbincloudflare | [GET](https://cloudflare-quic.com/b/) | 404 | wrong_base_url_path / http_error | unknown | 605 | discovery |
| Human Protein Atlas / humanproteinatlas | [GET](https://www.proteinatlas.org/ENSG00000141510.json) | 200 | ok / ok_json | [free](https://www.proteinatlas.org/about/licence) | 96 | callable |
| Humanitarian Data Exchange / humanitariandataexchange | [GET](https://data.humdata.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1004 | discovery |
| Hytale / hytale | [GET](https://hytale-api.com/) | 522 | dead_upstream / http_error | unknown | 19925 | discovery |
| Hytale API / hytale | [GET](https://hytale-api.com/) | 522 | duplicate / duplicate | unknown | - | discovery |
| IBGE Brazil Stats / ibgebrazilstats | [GET](https://servicodados.ibge.gov.br/api/v1/localidades/estados/33) | 0 | redirect_https / tls_error | [free](https://servicodados.ibge.gov.br/api/docs/localidades) | 725 | discovery |
| icanhazdadjoke / icanhazdadjoke | [GET](https://icanhazdadjoke.com/) | 200 | ok / ok_json | [free](https://icanhazdadjoke.com/api) | 241 | callable |
| Icanhazepoch / icanhazepoch | [GET](https://icanhazepoch.com/) | 301 | redirect_https / redirect_not_approved | unknown | 715 | discovery |
| Icanhazip / icanhazip | [GET](https://major.io/icanhazip-com-faq/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 70 | discovery |
| Iceland Inspire API / icelandinspireapi | [GET](https://www.lmi.is/is/gagnaveita/) | 301 | redirect_https / redirect_not_approved | unknown | 284 | discovery |
| Icelandic Met Office / icelandicmetoffice | [GET](https://en.vedur.is/about-imo/apis/) | 404 | wrong_base_url_path / http_error | unknown | 406 | discovery |
| Icon Horse / iconhorse | [GET](https://icon.horse/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 610 | discovery |
| Icon Horse API / iconhorseapi | [GET](https://icon.horse/usage/) | 404 | wrong_base_url_path / http_error | unknown | 1314 | discovery |
| Icons8 / icons8 | [GET](https://img.icons8.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 128 | discovery |
| IEA / iea | [GET](https://iea.org/) | 301 | redirect_https / redirect_not_approved | unknown | 172 | discovery |
| IFTTT / ifttt | [GET](https://platform.ifttt.com/docs/connect_api/) | 301 | redirect_https / redirect_not_approved | unknown | 226 | discovery |
| IMD India Weather / imdindiaweather | [GET](https://mausam.imd.gov.in/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1909 | discovery |
| IMF / imf | [GET](https://datahelp.imf.org/knowledgebase/topics/125587/) | 0 | dead_upstream / network_error | unknown | 4 | discovery |
| IMF Data API / imfdataapi | [GET](https://datahelp.imf.org/knowledgebase/articles/667681/) | 0 | dead_upstream / network_error | [free](https://datahelp.imf.org/knowledgebase/articles/667681) | 1004 | discovery |
| Imgflip / imgflip | [GET](https://api.imgflip.com/get_memes) | 200 | ok / ok_json | [free](https://imgflip.com/api) | 78 | callable |
| Imsea / imsea | [GET](https://imsea.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 411 | discovery |
| Indian Mutual Fund / indianmutualfund | [GET](https://api.mfapi.in/mf/100027/latest) | 200 | ok / ok_json | [free](https://www.mfapi.in/) | 687 | callable |
| Indonesia Dictionary / indonesiadictionary | [GET](https://new-kbbi-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 401 | discovery |
| Indonesia Open Data API / indonesiaopendataapi | [GET](https://data.go.id/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.go.id) | 1687 | discovery |
| INSEE France / inseefrance | [GET](https://insee.fr/) | 302 | redirect_https / redirect_not_approved | unknown | 239 | discovery |
| Instabox / instabox | [GET](https://www.instabox.se/) | 301 | redirect_https / redirect_not_approved | unknown | 67 | discovery |
| Instapaper / instapaper | [GET](https://www.instapaper.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1910 | discovery |
| Interpol Red Notices / interpolrednotices | [GET](https://interpol.api.bund.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 139 | discovery |
| Intro.js / introjs | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| IP 2 Country / ip2country | [GET](https://ip2country.info/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 112 | discovery |
| IP Address Details / ipaddressdetails | [GET](https://ipinfo.io/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 293 | discovery |
| IP Vigilante / ipvigilante | [GET](https://www.ipvigilante.com/) | 301 | redirect_https / redirect_not_approved | unknown | 85 | discovery |
| ipapi.co / ipapico | [GET](https://ipapi.co/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 933 | discovery |
| IPGEO / ipgeo | [GET](https://api.techniknews.net/ipgeo/) | 200 | unresolved / invalid_response | unknown | 1101 | discovery |
| IPify / ipify | [GET](https://api.ipify.org/?format=json) | 200 | ok / ok_json | [free](https://www.ipify.org/) | 284 | callable |
| IRENA / irena | [GET](https://irena.org/) | 301 | redirect_https / redirect_not_approved | unknown | 179 | discovery |
| ISA-95 / isa95 | [GET](https://www.isa.org/isa95/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1399 | discovery |
| isEven / iseven | [GET](https://api.isevenapi.xyz/api/iseven/6/) | 200 | ok / ok_json | [free](https://isevenapi.xyz/) | 592 | callable |
| isEven (humor) / isevenhumor | [GET](https://isevenapi.xyz/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 735 | discovery |
| ISRO / isro | [GET](https://isro.vercel.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 105 | discovery |
| ISRO API / isro | [GET](https://isro.vercel.app/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Istanbul (İBB) Open Data / istanbulibbopendata | [GET](https://data.ibb.gov.tr/api/3/action/package_search?rows=1&fl=id,name,title,license_id) | 200 | unresolved / customer_gateway_failed | [free](https://data.ibb.gov.tr/license) | 1254 | discovery |
| ItsThisForThat / itsthisforthat | [GET](https://itsthisforthat.com/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 249 | discovery |
| Ivory Coast Data API / ivorycoastdataapi | [GET](https://data.gouv.ci/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gouv.ci) | 681 | discovery |
| Jan AI / janai | [GET](https://jan.ai/) | 301 | redirect_https / redirect_not_approved | unknown | 85 | discovery |
| Japan Statistics / japanstatistics | [GET](https://stat.go.jp/) | 0 | dead_upstream / network_error | unknown | 4 | discovery |
| Jawbone UP / jawboneup | [GET](https://jawbone.com/up/developer/) | 301 | redirect_https / redirect_not_approved | unknown | 215 | discovery |
| Jikan / jikan | [GET](https://api.jikan.moe/v4/anime/1) | 0 | timeout / timeout | [free](https://docs.api.jikan.moe/) | 284 | discovery |
| Jikan MyAnimeList / jikanmyanimelist | [GET](https://jikan.moe/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 339 | discovery |
| Jikan MyAnimeList API / jikanmyanimelist | [GET](https://jikan.moe/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Jina Reader / jinareader | [GET](https://jina.ai/reader/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 158 | discovery |
| Jitsi / jitsi | [GET](https://jitsi.org/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://jitsi.org) | 219 | discovery |
| JMA API / jmaapi | [GET](https://www.jma.go.jp/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.jma.go.jp) | 1062 | discovery |
| JokeAPI / jokeapi | [GET](https://v2.jokeapi.dev/joke/Programming?safe-mode) | 200 | ok / ok_json | [free](https://sv443.net/jokeapi/v2/) | 123 | callable |
| Joplin / joplin | - | 0 | needs_key / reviewed_exclusion | unknown | 0 | discovery |
| JSON 2 JSONP / json2jsonp | [GET](https://json2jsonp.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 122 | discovery |
| JSON Placeholder / jsonplaceholder-19df6db5 | [GET](https://jsonplaceholder.typicode.com/todos/1) | 200 | ok / ok_json | [free](https://jsonplaceholder.typicode.com/guide/) | 72 | callable |
| Juhe Data / juhedata | [GET](https://www.juhe.cn/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2501 | discovery |
| Kadaster Netherlands / kadasternetherlands | [GET](https://www.pdok.nl/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 534 | discovery |
| Kakoune / kakoune | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| kanye.rest / kanyerest | [GET](https://api.kanye.rest/) | 200 | ok / ok_json | [free](https://kanye.rest/) | 80 | callable |
| Kapiche / kapiche | [GET](https://www.kapiche.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 218 | discovery |
| Kartverket / kartverket | [GET](https://kartkatalog.geonorge.no/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 185 | discovery |
| Kenya Open Data API / kenyaopendataapi | [GET](https://opendata.go.ke/) | 0 | timeout / timeout | [free](https://opendata.go.ke) | 10471 | discovery |
| Kickbox / kickbox | [GET](https://open.kickbox.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 602 | discovery |
| kimiquotes / kimiquotes | [GET](https://kimiquotes.herokuapp.com/doc/) | 404 | wrong_base_url_path / http_error | unknown | 486 | discovery |
| KNBS Kenya Stats / knbskenyastats | [GET](https://www.knbs.or.ke/) | 0 | redirect_https / tls_error | unknown | 578 | discovery |
| KNX / knx | [GET](https://www.knx.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 463 | discovery |
| KONTESTS / kontests | [GET](https://kontests.net/api/) | 0 | dead_upstream / network_error | unknown | 3 | discovery |
| Korean Statistics / koreanstatistics | [GET](https://kostat.go.kr/) | 301 | redirect_https / redirect_not_approved | unknown | 1029 | discovery |
| Kroki / kroki | [GET](https://kroki.io/health) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 129 | discovery |
| Kube-bench / kubebench | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Kubeflow / kubeflow | [GET](https://kubeflow.org/) | 301 | redirect_https / redirect_not_approved | unknown | 633 | discovery |
| Kubescape / kubescape | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| LA Open Data API / laopendataapi | [GET](https://data.lacity.org/api/views/metadata/v1?limit=1&page=1) | 200 | ok / ok_json | [free](https://data.lacity.org/terms-of-use) | 2011 | callable |
| Lantmäteriet / lantmteriet | [GET](https://www.lantmateriet.se/sv/Om-Lantmateriet/Oppna-data/) | 404 | wrong_base_url_path / http_error | unknown | 195 | discovery |
| Lapce / lapce | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| LAPIS / lapis | [GET](https://cov-spectrum.ethz.ch/public/) | 0 | redirect_https / tls_error | unknown | 99 | discovery |
| Laravel China / laravelchina | [GET](https://laravel-china.org/topics/3097/) | 0 | timeout / timeout | unknown | 10092 | discovery |
| Launch Library / launchlibrary | [GET](https://thespacedevs.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 878 | discovery |
| Launch Library 2 / launchlibrary2 | [GET](https://ll.thespacedevs.com/2.3.0/launches/?limit=1) | 200 | ok / ok_json | [free](https://thespacedevs.com/llapi) | 466 | callable |
| Leaflet / leaflet | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://leafletjs.com) | 0 | discovery |
| Lido / lido | [GET](https://lido.fi/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 135 | discovery |
| LightwaveRF / lightwaverf | [GET](https://api.lightwaverf.com/) | 301 | redirect_https / redirect_not_approved | unknown | 260 | discovery |
| LM Studio / lmstudio | [GET](https://lmstudio.ai/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 321 | discovery |
| Lobsters API / lobstersapi | [GET](https://lobste.rs/newest.json) | 200 | ok / ok_json | [free](https://lobste.rs) | 524 | callable |
| LocalAI / localai | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://localai.io) | 0 | discovery |
| Localbitcoins / localbitcoins | [GET](https://localbitcoins.com/api-docs/) | 404 | wrong_base_url_path / http_error | unknown | 140 | discovery |
| Logseq / logseq | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://logseq.com) | 0 | discovery |
| LonWorks / lonworks | [GET](https://www.echelon.com/) | 301 | redirect_https / redirect_not_approved | unknown | 929 | discovery |
| LoRaWAN / lorawan | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Lordicon / lordicon | [GET](https://lordicon.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 374 | discovery |
| Lorem Ipsum / loremipsum | [GET](https://loremipsum.io/api/) | 404 | wrong_base_url_path / http_error | [free](https://loremipsum.io/api) | 304 | discovery |
| Lorem Ipsum API / loremipsumapi | [GET](https://loripsum.net/api/1/short/plaintext) | 0 | dead_upstream / network_error | [free](https://loripsum.net/) | 3 | discovery |
| Lorem Picsum / lorempicsum | [GET](https://picsum.photos/v2/list?page=1&limit=1) | 200 | ok / ok_json | [free](https://picsum.photos/) | 91 | callable |
| Lorem Space / loremspace | [GET](https://lorem.space/api/) | 0 | unresolved / network_error | unknown | 565 | discovery |
| Lua Decompiler / luadecompiler | [GET](https://lua-decompiler.ferib.dev/) | 0 | dead_upstream / network_error | unknown | 2 | discovery |
| Luchtmeetnet / luchtmeetnet | [GET](https://api-docs.luchtmeetnet.nl/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 909 | discovery |
| Lucia Auth / luciaauth | [GET](https://lucia-auth.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 70 | discovery |
| Lyrics.ovh / lyricsovh | [GET](https://lyricsovh.docs.apiary.io/) | 502 | dead_upstream / http_error | unknown | 1196 | discovery |
| MailCheck.ai / mailcheckai | [GET](https://www.mailcheck.ai/) | 301 | redirect_https / redirect_not_approved | unknown | 93 | discovery |
| Malaysia Open Data API / malaysiaopendataapi | [GET](https://api.data.gov.my/data-catalogue?id=fuelprice&limit=1) | 200 | ok / ok_json | [free](https://developer.data.gov.my/quickstart) | 1657 | callable |
| Mark Text / marktext | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| markerapi / markerapi | [GET](https://markerapi.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 227 | discovery |
| Marketstack / marketstack | [GET](https://marketstack.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 652 | discovery |
| Maven Central / mavencentral | - | 0 | commercial_permission / reviewed_exclusion | [free](https://search.maven.org) | 0 | discovery |
| MealDB API / mealdbapi | [GET](https://www.themealdb.com/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 127 | discovery |
| Mempool / mempool | [GET](https://mempool.space/api/v1/fees/recommended) | 200 | ok / ok_json | [free](https://mempool.space/docs/api/rest) | 136 | callable |
| Mempool API / mempoolapi | [GET](https://mempool.space/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1912 | discovery |
| MercadoBitcoin / mercadobitcoin | [GET](https://www.mercadobitcoin.com.br/api-doc/) | 404 | wrong_base_url_path / http_error | unknown | 207 | discovery |
| Messari / messari | [GET](https://messari.io/api/) | 429 | rate_limit / rate_limited | unknown | 1036 | discovery |
| Messari API / messari | [GET](https://messari.io/api/) | 429 | duplicate / duplicate | unknown | - | discovery |
| MET Norway / metnorway | [GET](https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75) | 200 | duplicate / duplicate | [free](https://api.met.no/doc/TermsOfService) | - | alias of yr |
| Metabase / metabase | [GET](https://www.metabase.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 215 | discovery |
| MetaWeather / metaweather | [GET](https://www.metaweather.com/api/) | 0 | dead_upstream / network_error | unknown | 49 | discovery |
| Meteoam Italy / meteoamitaly | [GET](https://www.meteoam.it/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2297 | discovery |
| Mexico Open Data API / mexicoopendataapi | [GET](https://datos.gob.mx/) | 403 | unresolved / access_denied | [free](https://datos.gob.mx) | 188 | discovery |
| MicroENV / microenv | [GET](https://microenv.com/) | 0 | redirect_https / tls_error | unknown | 1211 | discovery |
| Microlink.io / microlink | [GET](https://api.microlink.io/?url=https%3A%2F%2Fexample.com) | 200 | ok / ok_json | [free](https://microlink.io/skills/microlink) | 91 | callable |
| Microsoft Graph OneDrive / microsoftgraphonedrive | [GET](https://graph.microsoft.io/en-us/docs/api-reference/v1.0/resources/onedrive/) | 301 | redirect_https / redirect_not_approved | unknown | 175 | discovery |
| Microsoft Security Response Center (MSRC) / microsoftsecurityresponsecentermsrc | [GET](https://msrc.microsoft.com/report/developer/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 371 | discovery |
| Minecraft Server Status / minecraftserverstatus | [GET](https://api.mcsrvstat.us/3/mc.hypixel.net) | 200 | ok / ok_json | [free](https://api.mcsrvstat.us/) | 102 | callable |
| Mineral Database API / mineraldatabaseapi | [GET](https://www.mindat.org/api.php/) | 403 | unresolved / access_denied | unknown | 95 | discovery |
| Mirage JS / miragejs | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://miragejs.com) | 0 | discovery |
| Mirror Networking / mirrornetworking | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Misfit / misfit | [GET](https://build.misfit.com/) | 0 | dead_upstream / network_error | unknown | 1155 | discovery |
| MLB API / mlbapi | [GET](https://statsapi.mlb.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 600 | discovery |
| MLB Data API / mlbdataapi | [GET](https://statsapi.mlb.com/api/v1/sports) | 200 | ok / ok_json | [free](https://statsapi.mlb.com) | 756 | callable |
| MLB StatsAPI / mlbstatsapi-265d31bd | [GET](https://statsapi.mlb.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 1528 | discovery |
| MMO Games / mmogames | [GET](https://www.mmobomb.com/api1/game?id=452) | 200 | ok / ok_json | [free](https://www.mmobomb.com/api) | 75 | callable |
| Mockoon / mockoon | - | 0 | unresolved / reviewed_exclusion | [free](https://mockoon.com) | 0 | discovery |
| Mocky / mocky | [GET](https://designer.mocky.io/) | 0 | redirect_https / tls_error | unknown | 181 | discovery |
| Mojio / mojio | [GET](https://www.moj.io/developer/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 300 | discovery |
| Moodle / moodle | [GET](https://moodle.org/) | 403 | unresolved / access_denied | unknown | 199 | discovery |
| Moon Phase API / moonphaseapi | [GET](https://www.farmsense.net/api/astro-widgets/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 797 | discovery |
| Morocco Open Data API / moroccoopendataapi | [GET](https://data.gov.ma/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.gov.ma/index.php/fr/Comment_exploiter_les_donn%C3%A9es) | 439 | callable |
| Motivational Quotes / motivationalquotes | [GET](https://nodejs-quoteapp.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 396 | discovery |
| MovieGlu / movieglu | [GET](https://www.movieglu.com/) | 301 | redirect_https / redirect_not_approved | unknown | 774 | discovery |
| MSW / msw | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://mswjs.io) | 0 | discovery |
| MTConnect / mtconnect | [GET](https://www.mtconnect.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 218 | discovery |
| MusicBrainz / musicbrainz | [GET](https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1276 | discovery |
| My Anime List API / jikanmyanimelist | [GET](https://jikan.moe/) | 200 | duplicate / duplicate | unknown | - | discovery |
| MY IP / myip | [GET](https://www.myip.com/api-docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 426 | discovery |
| MY IP API / myip | [GET](https://www.myip.com/api-docs/) | 200 | duplicate / duplicate | unknown | - | discovery |
| myStrom / mystrom | [GET](https://mystrom.ch/de/mystrom-api/) | 404 | wrong_base_url_path / http_error | unknown | 908 | discovery |
| myStrom API / mystrom | [GET](https://mystrom.ch/de/mystrom-api/) | 404 | duplicate / duplicate | [free](https://mystrom.ch/de/mystrom-api) | - | discovery |
| Nager Date / nagerdate | - | 0 | commercial_permission / reviewed_exclusion | unknown | 0 | discovery |
| Nager.Date API / nagerdateapi | - | 0 | commercial_permission / reviewed_exclusion | [free](https://date.nager.at/Api) | 0 | discovery |
| Namedays Calendar / namedayscalendar | [GET](https://nameday.abalin.net/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 178 | discovery |
| NASA EONET / nasaeonet | [GET](https://eonet.gsfc.nasa.gov/api/v3/events?limit=1) | 200 | ok / ok_json | [free](https://eonet.gsfc.nasa.gov/docs/v3) | 721 | callable |
| NASA POWER API / nasapowerapi | [GET](https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M&community=RE&longitude=10&latitude=59&start=20240101&end=20240101&format=JSON) | 200 | ok / ok_json | [free](https://power.larc.nasa.gov/docs/services/api/) | 823 | callable |
| National Grid ESO / nationalgrideso | [GET](https://data.nationalgrideso.com/) | 0 | dead_upstream / network_error | unknown | 38 | discovery |
| National Vulnerability Database / nationalvulnerabilitydatabase | [GET](https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=1) | 200 | ok / ok_json | [free](https://nvd.nist.gov/developers/vulnerabilities) | 541 | callable |
| Nationalize / nationalize | [GET](https://nationalize.io/) | 406 | unresolved / http_error | unknown | 517 | discovery |
| Nationalize.io / nationalize | [GET](https://nationalize.io/) | 406 | duplicate / duplicate | unknown | - | discovery |
| NBA Stats / nbastats | [GET](https://any-api.com/nba_com/nba_com/docs/API_Description/) | 301 | redirect_https / redirect_not_approved | unknown | 134 | discovery |
| NBB Belgium / nbbbelgium | [GET](https://www.nbb.be/en/statistics/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1149 | discovery |
| NBP Poland API / nbppolandapi | [GET](https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=json) | 200 | ok / ok_json | [free](https://api.nbp.pl/en.html) | 376 | callable |
| NBS China / nbschina | [GET](https://stats.gov.cn/) | 0 | dead_upstream / network_error | unknown | 4 | discovery |
| NBS Nigeria Stats / nbsnigeriastats | [GET](https://nigerianstat.gov.ng/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1042 | discovery |
| NBU Ukraine API / nbuukraineapi | [GET](https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json) | 200 | ok / ok_json | [free](https://bank.gov.ua/en/open-data/api-dev) | 339 | callable |
| NemID / nemid | [GET](https://www.nets.eu/developer/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 999 | discovery |
| Neovim / neovim | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Netherlands Data API / netherlandsdataapi | [GET](https://data.overheid.nl/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.overheid.nl/data) | 356 | callable |
| Newsblur / newsblur | [GET](https://newsblur.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 527 | discovery |
| Newton / newton | [GET](https://newton.vercel.app/api/v2/simplify/2%2B2) | 200 | ok / ok_json | [free](https://github.com/aunyks/newton) | 289 | callable |
| Newton Math / newton | [GET](https://newton.vercel.app/api/v2/simplify/2%2B2) | 200 | duplicate / duplicate | [free](https://github.com/aunyks/newton) | - | alias of newton |
| Newton Math API / newton | [GET](https://newton.vercel.app/api/v2/simplify/2%2B2) | 200 | duplicate / duplicate | [free](https://github.com/aunyks/newton) | - | alias of newton |
| Nexchange / nexchange | [GET](https://nexchange2.docs.apiary.io/) | 502 | dead_upstream / http_error | unknown | 1129 | discovery |
| NHL API / nhlapi | [GET](https://api-web.nhle.com/v1/) | 404 | wrong_base_url_path / http_error | unknown | 283 | discovery |
| NHTSA / nhtsa | [GET](https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/1M8GDM9AXKP042788?format=json) | 200 | ok / ok_json | [free](https://vpic.nhtsa.dot.gov/api/) | 345 | callable |
| Nick Cannon Baby API / nickcannonbabyapi | [GET](https://nick-cannon-baby-api.onrender.com/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://nick-cannon-baby-api.onrender.com) | 451 | discovery |
| Nigeria Open Data API / nbsnigeriastats | [GET](https://nigerianstat.gov.ng/) | 200 | duplicate / duplicate | [free](https://nigerianstat.gov.ng) | - | discovery |
| NIST Chemistry WebBook / nistchemistrywebbook | [GET](https://webbook.nist.gov/) | 406 | unresolved / http_error | unknown | 491 | discovery |
| NMBS/SNCB Belgium / nmbssncbbelgium | [GET](https://www.belgiantrain.be/en/travel-info/preparing-for-your-journey/use-data/) | 403 | unresolved / access_denied | unknown | 85 | discovery |
| Nobel Prize / nobelprize | [GET](https://api.nobelprize.org/2.1/nobelPrizes?limit=1) | 200 | ok / ok_json | [free](https://nobelprize.readme.io/reference/getting-started) | 81 | callable |
| Nobel Prize API / nobelprize | [GET](https://api.nobelprize.org/2.1/nobelPrizes?limit=1) | 200 | duplicate / duplicate | [free](https://nobelprize.readme.io/reference/getting-started) | - | alias of nobelprize |
| Noctua / noctua | [GET](https://api.noctuasky.com/api/v1/swaggerdoc/) | 404 | wrong_base_url_path / http_error | unknown | 440 | discovery |
| Node-RED / nodered | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Nominatim / nominatim | [GET](https://nominatim.org/release-docs/latest/api/Overview/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 264 | discovery |
| Nominatim API / nominatim | [GET](https://nominatim.org/release-docs/latest/api/Overview/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Non-Working Days / nonworkingdays | [GET](https://isdayoff.ru/20260101) | 200 | ok / ok_text | [free](https://isdayoff.ru/extapi/) | 174 | callable |
| Non-Working Days 2 / nonworkingdays | [GET](https://isdayoff.ru/20260101) | 200 | duplicate / duplicate | [free](https://isdayoff.ru/extapi/) | - | alias of nonworkingdays |
| Norwegian MET Weather / metnorway | [GET](https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75) | 200 | duplicate / duplicate | [free](https://api.met.no/doc/TermsOfService) | - | alias of yr |
| Notation / notation | [GET](https://notaryproject.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 342 | discovery |
| Notifee API / notifeeapi | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| NPPES / nppes | [GET](https://npiregistry.cms.hhs.gov/api/?version=2.1&organization_name=Mayo%20Clinic&limit=1) | 200 | ok / ok_json | [free](https://npiregistry.cms.hhs.gov/api-page) | 470 | callable |
| Numverify / numverify | [GET](https://numverify.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 834 | discovery |
| NYC Open Data API / citynewyorkopendata | [GET](https://opendata.cityofnewyork.us/) | 301 | duplicate / duplicate | unknown | - | discovery |
| NZ Open Data API / nzopendataapi | [GET](https://catalogue.data.govt.nz/api/3/action/package_search?rows=1) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://catalogue.data.govt.nz) | 197 | discovery |
| Obsidian / obsidian | - | 0 | not_hosted_api / reviewed_exclusion | freemium | 0 | discovery |
| Ocean Biogeographic / oceanbiogeographic | [GET](https://api.obis.org/v3/occurrence?size=1) | 200 | ok / ok_json | [free](https://manual.obis.org/policy.html) | 229 | callable |
| Ocean Facts / oceanfacts | [GET](https://oceanfacts.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 463 | discovery |
| OceanCurrent / oceancurrent | [GET](https://imos.org.au/facilities/oceandata/) | 404 | wrong_base_url_path / http_error | unknown | 2054 | discovery |
| Oddsmagnet / oddsmagnet | [GET](https://data.oddsmagnet.com/) | 301 | redirect_https / redirect_not_approved | unknown | 243 | discovery |
| OECD / oecd | [GET](https://data.oecd.org/) | 403 | unresolved / access_denied | [free](https://data.oecd.org) | 91 | discovery |
| OECD API / oecdapi | [GET](https://data.oecd.org/api/) | 403 | unresolved / access_denied | [free](https://data.oecd.org/api) | 1025 | discovery |
| Official Joke API / officialjokeapi | [GET](https://official-joke-api.appspot.com/random_joke) | 200 | ok / ok_json | [free](https://official-joke-api.appspot.com) | 726 | callable |
| Ollama / ollama | [GET](https://ollama.ai/) | 301 | redirect_https / redirect_not_approved | [free](https://ollama.ai) | 61 | discovery |
| ONS UK / onsuk | [GET](https://api.beta.ons.gov.uk/v1/datasets?limit=1) | 200 | ok / ok_json | [free](https://developer.ons.gov.uk/) | 278 | callable |
| ONS UK Statistics / onsukstatistics | [GET](https://api.ons.gov.uk/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 170 | discovery |
| OnWater / onwater | [GET](https://onwater.io/) | 301 | redirect_https / redirect_not_approved | unknown | 90 | discovery |
| OPC UA / opcua | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Open Ag Data / openagdata | [GET](https://openag.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 72 | discovery |
| Open Brewery DB / openbrewerydb | [GET](https://api.openbrewerydb.org/v1/breweries?per_page=1) | 200 | ok / ok_json | [free](https://www.openbrewerydb.org/documentation) | 110 | callable |
| Open Charge Map / openchargemap | [GET](https://openchargemap.org/site/develop/api/) | 302 | redirect_https / redirect_not_approved | unknown | 3064 | discovery |
| Open Data Minneapolis / opendataminneapolis | [GET](https://opendata.minneapolismn.gov/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 886 | discovery |
| Open Data NHS Scotland / opendatanhsscotland | [GET](https://www.opendata.nhs.scot/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.opendata.nhs.scot/api/3/action/help_show?name=package_search) | 730 | callable |
| Open Disease / opendisease | [GET](https://disease.sh/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 292 | discovery |
| Open Food Facts / openfoodfacts | [GET](https://world.openfoodfacts.org/api/v2/product/737628064502.json?fields=product_name) | 200 | ok / ok_json | [free](https://openfoodfacts.github.io/openfoodfacts-server/api/) | 222 | callable |
| Open Food Facts API / openfoodfactsapi | [GET](https://world.openfoodfacts.org/data/) | 403 | unresolved / access_denied | unknown | 1092 | discovery |
| Open Government, ACT / opengovernmentact | [GET](https://www.data.act.gov.au/) | 406 | unresolved / http_error | unknown | 719 | discovery |
| Open Government, Argentina / argentinaopendataapi-9c9e04f3 | [GET](https://datos.gob.ar/api/3/action/package_search?rows=1) | 502 | dead_upstream / http_error | [free](https://datos.gob.ar/api/3/action/help_show?name=package_search) | 427 | discovery |
| Open Government, Australia / australiadataapi-50671063 | [GET](https://data.gov.au/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.gov.au/data/api/3/action/help_show?name=package_search) | 515 | callable |
| Open Government, Austria / opengovernmentaustria | [GET](https://www.data.gv.at/katalog/api/3/action/package_search?rows=1) | 404 | dead_upstream / http_error | [free](https://www.data.gv.at/katalog/api/3/action/help_show?name=package_search) | 195 | discovery |
| Open Government, Belgium / opengovernmentbelgium | [GET](https://data.gov.be/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1121 | discovery |
| Open Government, Colombia / opengovernmentcolombia | [GET](https://www.dane.gov.co/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1224 | discovery |
| Open Government, Cyprus / opengovernmentcyprus | [GET](https://data.gov.cy/?language=en) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 522 | discovery |
| Open Government, Czech Republic / opengovernmentczechrepublic | [GET](https://data.gov.cz/english/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 388 | discovery |
| Open Government, Denmark / opengovernmentdenmark | [GET](https://admin.opendata.dk/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://admin.opendata.dk/api/3/action/help_show?name=package_search) | 334 | callable |
| Open Government, Finland / opengovernmentfinland | [GET](https://avoindata.suomi.fi/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://avoindata.suomi.fi/fi/kayttoohjeet/kaytto-rajapinnan-api-kautta) | 314 | callable |
| Open Government, Germany / opengovernmentgermany | [GET](https://ckan.govdata.de/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://ckan.govdata.de/api/3/action/help_show?name=package_search) | 284 | callable |
| Open Government, Italy / opengovernmentitaly | [GET](https://www.dati.gov.it/opendata/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.dati.gov.it/opendata/api/3/action/help_show?name=package_search) | 351 | callable |
| Open Government, Lithuania / opengovernmentlithuania | [GET](https://data.gov.lt/public/api/1/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 251 | discovery |
| Open Government, Mexico / mexicoopendataapi | [GET](https://datos.gob.mx/) | 403 | duplicate / duplicate | unknown | - | discovery |
| Open Government, Netherlands / netherlandsdataapi | [GET](https://data.overheid.nl/data/api/3/action/package_search?rows=1) | 200 | duplicate / duplicate | [free](https://data.overheid.nl/data) | - | alias of netherlandsdataapi |
| Open Government, New Zealand / nzopendataapi | [GET](https://catalogue.data.govt.nz/api/3/action/package_search?rows=1) | 200 | duplicate / duplicate | [free](https://catalogue.data.govt.nz) | - | discovery |
| Open Government, Norway / opengovernmentnorway | [GET](https://data.norge.no/dataservices/) | 301 | redirect_https / redirect_not_approved | unknown | 193 | discovery |
| Open Government, Peru / opengovernmentperu | [GET](https://www.datosabiertos.gob.pe/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2198 | discovery |
| Open Government, Poland / opengovernmentpoland | [GET](https://api.dane.gov.pl/1.4/datasets?page=1&per_page=1) | 200 | ok / ok_json | [free](https://api.dane.gov.pl/1.4/doc) | 367 | callable |
| Open Government, Portugal / opengovernmentportugal | [GET](https://dados.gov.pt/api/1/datasets/?page_size=1) | 200 | ok / ok_json | [free](https://dados.gov.pt/en/docapi/) | 666 | callable |
| Open Government, Queensland Government / opengovernmentqueenslandgovernment | [GET](https://www.data.qld.gov.au/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://www.data.qld.gov.au/api/3/action/help_show?name=package_search) | 307 | callable |
| Open Government, Saudi Arabia / opengovernmentsaudiarabia | [GET](https://data.gov.sa/) | 0 | timeout / timeout | unknown | 367 | discovery |
| Open Government, Singapore / opengovernmentsingapore | [GET](https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast) | 200 | ok / ok_json | [free](https://guide.data.gov.sg/developer-guide/api-overview/api-rate-limits) | 287 | callable |
| Open Government, Slovakia / opengovernmentslovakia | [GET](https://data.gov.sk/en/) | 302 | redirect_https / redirect_not_approved | unknown | 277 | discovery |
| Open Government, Slovenia / opengovernmentslovenia | [GET](https://podatki.gov.si/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://podatki.gov.si/api/3/action/help_show?name=package_search) | 538 | callable |
| Open Government, South Australian Government / opengovernmentsouthaustraliangovernment | [GET](https://data.sa.gov.au/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.sa.gov.au/data/api/3/action/help_show?name=package_search) | 1838 | callable |
| Open Government, Spain / opengovernmentspain | [GET](https://datos.gob.es/apidata/catalog/dataset.json?_pageSize=1) | 200 | ok / ok_json | [free](https://datos.gob.es/en/apidata) | 375 | callable |
| Open Government, Sweden / opengovernmentsweden | [GET](https://www.dataportal.se/en/dataservice/91_29789/api-for-the-statistical-database/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2366 | discovery |
| Open Government, Taiwan / opengovernmenttaiwan | [GET](https://data.gov.tw/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 3310 | discovery |
| Open Government, UK / opengovernmentuk | [GET](https://ckan.publishing.service.gov.uk/api/3/action/package_search?rows=1&fl=id,name,title,license_id) | 200 | ok / ok_json | [free](https://www.data.gov.uk/about/) | 214 | callable |
| Open Government, USA / opengovernmentusa | [GET](https://www.data.gov/) | 301 | redirect_https / redirect_not_approved | unknown | 887 | discovery |
| Open Government, Victoria State Government / opengovernmentvictoriastategovernment | [GET](https://discover.data.vic.gov.au/api/3/action/package_search?rows=1&fl=id,name,title,license_id) | 200 | ok / ok_json | [free](https://www.data.vic.gov.au/copyright-datavic) | 3476 | callable |
| Open Government, West Australia / opengovernmentwestaustralia | [GET](https://catalogue.data.wa.gov.au/api/3/action/package_search?rows=1&fl=id,name,title,license_id&fq=license_id%3Acc-by) | 200 | ok / ok_json | [free](https://catalogue.data.wa.gov.au/en/dataset/mining-tenements-dmirs-003) | 2218 | callable |
| Open Power System Data / openpowersystemdata | [GET](https://open-power-system-data.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 230 | discovery |
| Open Topo Data / opentopodata | [GET](https://api.opentopodata.org/v1/test-dataset?locations=56,123) | 200 | ok / ok_json | [free](https://www.opentopodata.org/) | 108 | callable |
| Open Trivia / opentrivia | [GET](https://opentdb.com/api.php?amount=1&type=multiple) | 200 | ok / ok_json | [free](https://opentdb.com/api_config.php) | 749 | callable |
| Open Trivia Database / opentrivia | [GET](https://opentdb.com/api.php?amount=1&type=multiple) | 200 | duplicate / duplicate | [free](https://opentdb.com/api_config.php) | - | alias of opentrivia |
| Open Trivia DB / opentrivia | [GET](https://opentdb.com/api.php?amount=1&type=multiple) | 200 | duplicate / duplicate | [free](https://opentdb.com/api_config.php) | - | alias of opentrivia |
| Open-Meteo / openmeteo | [GET](https://open-meteo.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 117 | discovery |
| openAFRICA / openafrica | [GET](https://africaopendata.org/) | 301 | redirect_https / redirect_not_approved | unknown | 84 | discovery |
| OpenAPI Generator / openapigenerator | [GET](https://api.openapi-generator.tech/api/gen/clients) | 200 | ok / ok_json | [free](https://openapi-generator.tech/docs/online/) | 554 | callable |
| OpenCitations / opencitations | [GET](https://api.opencitations.net/index/v2/citation-count/doi:10.1108/jd-12-2013-0166) | 200 | ok / ok_json | [free](https://opencitations.net/index/api/v2) | 282 | callable |
| OpenCitations API / opencitations | [GET](https://api.opencitations.net/index/v2/citation-count/doi:10.1108/jd-12-2013-0166) | 200 | duplicate / duplicate | [free](https://opencitations.net/index/api/v2) | - | alias of opencitations |
| Opendatasoft API / opendatasoftapi | [GET](https://help.opendatasoft.com/apis/ods-search-v2/) | 404 | wrong_base_url_path / http_error | [free](https://help.opendatasoft.com/apis/ods-search-v2) | 237 | discovery |
| OpenDota / opendota | [GET](https://api.opendota.com/api/heroes) | 200 | ok / ok_json | [free](https://docs.opendota.com/) | 264 | callable |
| OpenFDA Drug / fda | [GET](https://api.fda.gov/food/enforcement.json?limit=1) | 200 | duplicate / duplicate | [free](https://open.fda.gov/apis/authentication/) | - | alias of fda |
| openFDA Drug Labels / fda | [GET](https://api.fda.gov/food/enforcement.json?limit=1) | 200 | duplicate / duplicate | [free](https://open.fda.gov/apis/authentication/) | - | alias of fda |
| OpenHolidays / openholidays | [GET](https://openholidaysapi.org/PublicHolidays?countryIsoCode=SE&validFrom=2026-01-01&validTo=2026-01-02) | 200 | ok / ok_json | [free](https://www.openholidaysapi.org/en/) | 264 | callable |
| OpenHolidays API / openholidays | [GET](https://openholidaysapi.org/PublicHolidays?countryIsoCode=SE&validFrom=2026-01-01&validTo=2026-01-02) | 200 | duplicate / duplicate | [free](https://www.openholidaysapi.org/en/) | - | alias of openholidays |
| OpenIndoor / openindoor | [GET](https://openindoor.io/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://openindoor.io) | 1731 | discovery |
| OpenLEI API / openleiapi | [GET](https://api.gleif.org/api/v1/lei-records?page%5Bsize%5D=1) | 200 | ok / ok_json | [free](https://www.gleif.org/en/meta/lei-data-terms-of-use) | 362 | callable |
| OpenLigaDB / openligadb | [GET](https://api.openligadb.de/getavailableleagues) | 200 | ok / ok_json | [free](https://www.openligadb.de/) | 420 | callable |
| OpenLigaDB API / openligadb | [GET](https://api.openligadb.de/getavailableleagues) | 200 | duplicate / duplicate | [free](https://www.openligadb.de/) | - | alias of openligadb |
| OpenSanctions / opensanctions | [GET](https://www.opensanctions.org/docs/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 175 | discovery |
| openSenseMap / opensensemap | [GET](https://api.opensensemap.org/stats) | 200 | ok / ok_json | [free](https://docs.opensensemap.org/) | 271 | callable |
| OpenStreetMap Nominatim / openstreetmapnominatim | [GET](https://nominatim.org/release-docs/develop/api/) | 403 | unresolved / access_denied | [free](https://nominatim.org/release-docs/develop/api) | 272 | discovery |
| OpenStreetMap Nominatim API / nominatim | [GET](https://nominatim.org/release-docs/latest/api/Overview/) | 200 | duplicate / duplicate | [free](https://nominatim.org/release-docs/latest/api/Overview) | - | discovery |
| OpenTripPlanner / opentripplanner | [GET](https://opentripplanner.org/) | 301 | redirect_https / redirect_not_approved | unknown | 79 | discovery |
| OpenVisionAPI / openvisionapi | [GET](https://openvisionapi.com/) | 0 | redirect_https / tls_error | unknown | 229 | discovery |
| OpenWeatherMap API / openweathermapapi | [GET](https://openweathermap.org/api/) | 0 | needs_key / key_documented | unknown | 0 | discovery |
| OpenXR / openxr | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Öppna Data Sverige / ppnadatasverige | [GET](https://www.dataportal.se/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.dataportal.se) | 719 | discovery |
| Order Pizza REST API / orderpizzarestapi | [GET](https://order-pizza-api.herokuapp.com/api/ui/) | 404 | wrong_base_url_path / http_error | unknown | 524 | discovery |
| OSRM / osrm | [GET](https://osrm.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 200 | discovery |
| OSRS API / osrsapi | [GET](https://oldschool.runescape.wiki/w/API/) | 404 | wrong_base_url_path / http_error | unknown | 117 | discovery |
| Outlook Mail / outlookmail | [GET](https://msdn.microsoft.com/en-us/office/office365/api/mail-rest-operations/) | 301 | redirect_https / redirect_not_approved | unknown | 171 | discovery |
| OV-API Netherlands / ovapinetherlands | [GET](https://ovapi.nl/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 215 | discovery |
| OVHcloud AI Endpoints / ovhcloudaiendpoints | [GET](https://endpoints.ai.cloud.ovh.net/) | 301 | redirect_https / redirect_not_approved | unknown | 197 | discovery |
| Owen Wilson Wow / owenwilsonwow | [GET](https://owen-wilson-wow-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 433 | discovery |
| Owen Wilson Wow API / owenwilsonwowapi | [GET](https://owen-wilson-wow-api.onrender.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 215 | discovery |
| owo / owo | [GET](https://owo.vc/api/) | 404 | wrong_base_url_path / http_error | unknown | 196 | discovery |
| oyyi / oyyi | [GET](https://oyyi.xyz/docs/1.0/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1637 | discovery |
| Packagist / packagist | [GET](https://packagist.org/search.json?q=monolog&per_page=1) | 200 | ok / ok_json | [free](https://packagist.org/apidoc) | 180 | callable |
| PackML / packml | [GET](https://www.omac.org/packml/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1074 | discovery |
| Pantry / pantry | [GET](https://getpantry.cloud/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 455 | discovery |
| PDB / rcsbpdbapi | [GET](https://data.rcsb.org/rest/v1/core/entry/4HHB) | 200 | duplicate / duplicate | [free](https://data.rcsb.org/) | - | alias of rcsbpdbapi |
| PDF Blocks / pdfblocks | [GET](https://www.pdfblocks.com/docs/api/getting-started/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2082 | discovery |
| Peru Open Data API / opengovernmentperu | [GET](https://www.datosabiertos.gob.pe/) | 200 | duplicate / duplicate | [free](https://www.datosabiertos.gob.pe) | - | discovery |
| Phabricator / phabricator | [GET](https://phacility.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1046 | discovery |
| Philippines Open Data API / philippinesopendataapi | [GET](https://data.gov.ph/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gov.ph) | 836 | discovery |
| PhishStats / phishstats | [GET](https://phishstats.info/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 261 | discovery |
| PHP-Noise / phpnoise | [GET](https://php-noise.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 160 | discovery |
| PHP-Noise Generator / phpnoise | [GET](https://php-noise.com/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Pinboard / pinboard | [GET](https://pinboard.in/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 876 | discovery |
| Pinterest API / pinterestapi | [GET](https://www.pinterest.com/login/?next=http%3A%2F%2Fdevelopers.pinterest.com%2Fapi_docs%2F) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 346 | discovery |
| Pirate Ipsum / pirateipsum | [GET](https://pirateipsum.me/api/) | 404 | wrong_base_url_path / http_error | unknown | 370 | discovery |
| Pirate Ship / pirateship | [GET](https://ship.pirateship.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 314 | discovery |
| Pixel Encounter / pixelencounter | [GET](https://pixelencounter.com/api/) | 0 | redirect_https / tls_error | unknown | 294 | discovery |
| PlaceBear / placebear | [GET](https://placebear.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 400 | discovery |
| PlaceDog / placedog | [GET](https://place.dog/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 230 | discovery |
| Placeholder.com / placeholdercom | [GET](https://placeholder.com/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://placeholder.com) | 93 | discovery |
| PlaceKeanu / placekeanu | [GET](https://placekeanu.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 324 | discovery |
| PlaceKitten / placekitten | [GET](https://placekitten.com/) | 521 | dead_upstream / http_error | unknown | 184 | discovery |
| Plaid Identity / plaididentity | [GET](https://plaid.com/docs/identity-verification/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 402 | discovery |
| PlayerDB / playerdb | [GET](https://playerdb.co/api/player/minecraft/Notch) | 200 | ok / ok_json | [free](https://playerdb.co/) | 84 | callable |
| Plusgiro / plusgiro | [GET](https://www.plusgirot.se/) | 0 | redirect_https / tls_error | unknown | 64 | discovery |
| PM2.5 Open Data Portal / pm25opendataportal | [GET](https://pm25.lass-net.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1258 | discovery |
| PM2.5 Portal / pm25opendataportal | [GET](https://pm25.lass-net.org/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Pokéapi / pokapi | [GET](https://pokeapi.co/api/v2/berry/1) | 200 | ok / ok_json | [free](https://pokeapi.co/docs/v2) | 100 | callable |
| Pokemon / pokapi | [GET](https://pokeapi.co/api/v2/berry/1) | 200 | duplicate / duplicate | [free](https://pokeapi.co/docs/v2) | - | alias of pokapi |
| Pokemon API / pokapi | [GET](https://pokeapi.co/api/v2/berry/1) | 200 | duplicate / duplicate | [free](https://pokeapi.co/docs/v2) | - | alias of pokapi |
| Pokémon TCG / pokemontcgapi | [GET](https://pokemontcg.io/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Pokemon TCG API / pokemontcgapi | [GET](https://pokemontcg.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 341 | discovery |
| Pokémon TCG API / pokemontcgapi | [GET](https://pokemontcg.io/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Postali / postali | [GET](https://postali.app/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1044 | discovery |
| Postcodes.io / postcodesio | [GET](https://api.postcodes.io/postcodes/SW1A1AA) | 200 | ok / ok_json | [free](https://postcodes.io/) | 88 | callable |
| PostgREST / postgrest | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Postman Echo / postmanecho | [GET](https://postman-echo.com/get?hello=apiclaw) | 200 | ok / ok_json | [free](https://www.postman.com/echo) | 201 | callable |
| PRH / prh | [GET](https://www.prh.fi/en/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1098 | discovery |
| PRH Finland / prhfinland | [GET](https://avoindata.prh.fi/opendata-ytj-api/v3/companies?businessId=0112038-9) | 200 | ok / ok_json | [free](https://www.prh.fi/en/companiesandorganisations/tietopalvelut/prhopendata.html) | 129 | callable |
| Prism / prism | [GET](https://stoplight.io/prism/) | 301 | redirect_https / redirect_not_approved | [free](https://stoplight.io/prism) | 97 | discovery |
| Pruvan / pruvan | [GET](https://pruvan.com/resources/pruvan-api/) | 301 | redirect_https / redirect_not_approved | unknown | 195 | discovery |
| PRV / prv | [GET](https://www.prv.se/sv/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 310 | discovery |
| Psychonauts / psychonauts | [GET](https://psychonauts-api.netlify.app/) | 401 | unresolved / access_denied | unknown | 419 | discovery |
| PubChem / pubchem | [GET](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2244/property/MolecularFormula/JSON) | 200 | ok / ok_json | [free](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest) | 373 | callable |
| PubChem API / pubchem | [GET](https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2244/property/MolecularFormula/JSON) | 200 | duplicate / duplicate | [free](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest) | - | alias of pubchem |
| PunkAPI / punkapi | [GET](https://punkapi.com/) | 0 | dead_upstream / network_error | unknown | 4 | discovery |
| Purple Air / purpleair | [GET](https://www2.purpleair.com/) | 301 | redirect_https / redirect_not_approved | unknown | 253 | discovery |
| PyPI / pypi | [GET](https://pypi.org/pypi/pip/25.0/json) | 200 | ok / ok_json | [free](https://docs.pypi.org/api/json/) | 72 | callable |
| PyPI API / pypi | [GET](https://pypi.org/pypi/pip/25.0/json) | 200 | duplicate / duplicate | [free](https://docs.pypi.org/api/json/) | - | alias of pypi |
| QNAP Development Toolkit / qnapdevelopmenttoolkit | [GET](https://www.qnap.com/event/dev/useng/p_about.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 4134 | discovery |
| QOwnNotes / qownnotes | [GET](https://qownnotes.org/) | 301 | redirect_https / redirect_not_approved | unknown | 207 | discovery |
| QR Code Generator / qrcode | [GET](https://goqr.me/api/) | 200 | duplicate / duplicate | [free](https://goqr.me/api) | - | discovery |
| QR code qrtag / qrcodeqrtag | [GET](https://www.qrtag.net/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 323 | discovery |
| Qrcode Monkey / qrcodemonkey | [GET](https://www.qrcode-monkey.com/qr-code-api-with-logo/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 128 | discovery |
| Quarantine / quarantine | [GET](https://quarantine.country/coronavirus/api/) | 0 | dead_upstream / network_error | unknown | 2 | discovery |
| Quarantine API / quarantine | [GET](https://quarantine.country/coronavirus/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Queimadas INPE / queimadasinpe | [GET](https://queimadas.dgi.inpe.br/queimadas/dados-abertos/) | 301 | redirect_https / redirect_not_approved | unknown | 784 | discovery |
| QuickChart / quickchart | [GET](https://quickchart.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 267 | discovery |
| QuickMocker / quickmocker | [GET](https://quickmocker.com/) | 0 | dead_upstream / network_error | unknown | 2 | discovery |
| quoteclear / quoteclear | [GET](https://quoteclear.web.app/) | 404 | wrong_base_url_path / http_error | unknown | 70 | discovery |
| Quotes on Design / quotesondesign | [GET](https://quotesondesign.com/wp-json/wp/v2/posts?per_page=1) | 200 | ok / ok_json | [free](https://quotesondesign.com/api/) | 80 | callable |
| Quran / quran | [GET](https://api.alquran.cloud/v1/ayah/1/en.asad) | 200 | ok / ok_json | [free](https://alquran.cloud/api) | 292 | callable |
| Quran API / quran | [GET](https://api.alquran.cloud/v1/ayah/1/en.asad) | 200 | duplicate / duplicate | [free](https://alquran.cloud/api) | - | alias of quran |
| Quran Cloud / quran | [GET](https://api.alquran.cloud/v1/ayah/1/en.asad) | 200 | duplicate / duplicate | [free](https://alquran.cloud/api) | - | alias of quran |
| Radicle / radicle | [GET](https://radicle.xyz/) | 307 | redirect_https / redirect_not_approved | unknown | 78 | discovery |
| Radio Browser / radiobrowser | [GET](https://de1.api.radio-browser.info/json/stations/topvote/1) | 200 | ok / ok_json | [free](https://www.radio-browser.info/) | 211 | callable |
| Raider / raider | [GET](https://raider.io/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2231 | discovery |
| Random Data / randomdata | [GET](https://random-data-api.com/api/v2/users?size=1) | 0 | dead_upstream / network_error | [free](https://random-data-api.com/documentation) | 902 | discovery |
| Random Facts / randomfacts | [GET](https://fungenerators.com/api/facts/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2693 | discovery |
| Random Useless Facts / randomuselessfacts | [GET](https://uselessfacts.jsph.pl/api/v2/facts/random?language=en) | 200 | ok / ok_json | [free](https://uselessfacts.jsph.pl/) | 173 | callable |
| RandomDog / randomdog | [GET](https://random.dog/woof.json) | 200 | ok / ok_json | [free](https://random.dog/) | 695 | callable |
| RandomDuck / randomduck | [GET](https://random-d.uk/api/random) | 200 | ok / ok_json | [free](https://random-d.uk/api) | 164 | callable |
| RandomFox / randomfox | [GET](https://randomfox.ca/floof/) | 200 | ok / ok_json | [free](https://randomfox.ca/) | 992 | callable |
| RandomUser / randomuser-c51bc20a | [GET](https://randomuser.me/api/?results=1&inc=name,nat&noinfo) | 200 | ok / ok_json | [free](https://randomuser.me/documentation) | 220 | callable |
| RATP Paris Transit / ratpparistransit | [GET](https://data.ratp.fr/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1298 | discovery |
| RBA Australia / rbaaustralia | [GET](https://www.rba.gov.au/statistics/tables/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 542 | discovery |
| RBA Australia Data / rbaaustralia | [GET](https://www.rba.gov.au/statistics/tables/) | 200 | duplicate / duplicate | unknown | - | discovery |
| RBNZ New Zealand Data / rbnznewzealanddata | [GET](https://www.rbnz.govt.nz/statistics/) | 403 | unresolved / access_denied | unknown | 105 | discovery |
| RCSB PDB API / rcsbpdbapi | [GET](https://data.rcsb.org/rest/v1/core/entry/4HHB) | 200 | ok / ok_json | [free](https://data.rcsb.org/) | 526 | callable |
| Redmine / redmine | [GET](https://redmine.org/) | 301 | redirect_https / redirect_not_approved | unknown | 160 | discovery |
| Rejseplanen / rejseplanen | [GET](https://help.rejseplanen.dk/hc/da/articles/214174465/) | 301 | redirect_https / redirect_not_approved | unknown | 1032 | discovery |
| RemoteOK API / remoteokapi | [GET](https://remoteok.com/api/) | 200 | gateway_block / body_limit | [free](https://remoteok.com/api) | 923 | discovery |
| Remotive / remotive | [GET](https://remotive.io/api-documentation/) | 301 | redirect_https / redirect_not_approved | unknown | 97 | discovery |
| Renfe Railway Spain / renferailwayspain | [GET](https://www.renfe.com/es/es/grupo-renfe/otras-webs/Open-data/) | 301 | redirect_https / redirect_not_approved | unknown | 181 | discovery |
| Represent by Open North / representbyopennorth | [GET](https://represent.opennorth.ca/representatives/?limit=1) | 200 | ok / ok_json | [free](https://represent.opennorth.ca/api/) | 559 | callable |
| ReqRes / reqres | [GET](https://reqres.in/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 312 | discovery |
| ReqRes API / reqres | [GET](https://reqres.in/) | 200 | duplicate / duplicate | [free](https://reqres.in) | - | discovery |
| RescueGroups / rescuegroups | [GET](https://userguide.rescuegroups.org/display/APIDG/API+Developers+Guide+Home/) | 301 | redirect_https / redirect_not_approved | unknown | 507 | discovery |
| ReSmush.it / resmushit | [GET](https://resmush.it/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 290 | discovery |
| Resrobot / resrobot | [GET](https://www.trafiklab.se/api/resrobot-reseplanerare/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 168 | discovery |
| REST Countries / restcountries-e252b887 | [GET](https://restcountries.com/v3.1/all?fields=name) | 301 | redirect_https / redirect_not_approved | unknown | 73 | discovery |
| Reykjavik Open Data / reykjavikopendata | [GET](https://opingogn.is/api/) | 301 | redirect_https / redirect_not_approved | unknown | 231 | discovery |
| Rick and Morty / rickandmorty | [GET](https://rickandmortyapi.com/api/character/1) | 200 | ok / ok_json | [free](https://rickandmortyapi.com/documentation) | 97 | callable |
| Rick and Morty API / rickandmorty | [GET](https://rickandmortyapi.com/api/character/1) | 200 | duplicate / duplicate | [free](https://rickandmortyapi.com/documentation) | - | alias of rickandmorty |
| Riksarkivet / riksarkivet | [GET](https://riksarkivet.se/oppna-data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1093 | discovery |
| Riksbanken API / riksbankenapi | [GET](https://www.riksbank.se/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.riksbank.se) | 253 | discovery |
| Riksdagen Open Data / riksdagenopendata | [GET](https://data.riksdagen.se/dokumentlista/?sz=1&utformat=json) | 200 | ok / ok_json | [free](https://data.riksdagen.se/) | 338 | callable |
| RoboHash / robohash | [GET](https://robohash.org/) | 200 | unresolved / invalid_response | unknown | 237 | discovery |
| Rocket Pool / rocketpool | [GET](https://rocketpool.net/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 85 | discovery |
| RPS 101 / rps101 | [GET](https://rps101.pythonanywhere.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 506 | discovery |
| RSS feed to JSON / rssfeedtojson | [GET](https://rss-to-json-serverless-api.vercel.app/) | 402 | unresolved / http_error | unknown | 178 | discovery |
| RubyGems / rubygems | [GET](https://rubygems.org/api/v1/gems/rails.json) | 200 | ok / ok_json | [free](https://guides.rubygems.org/rubygems-org-api/) | 187 | callable |
| RuneScape / runescape | [GET](https://runescape.wiki/w/Application_programming_interface/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 120 | discovery |
| Rustybeer / rustybeer | [GET](https://rustybeer.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 521 | discovery |
| Ruter / ruter | [GET](https://api.entur.io/journey-planner/) | 404 | wrong_base_url_path / http_error | unknown | 127 | discovery |
| Rwanda Locations / rwandalocations | [GET](https://rapidapi.com/victorkarangwa4/api/rwanda/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1498 | discovery |
| Rwanda Open Data API / rwandaopendataapi | [GET](https://statistics.gov.rw/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://statistics.gov.rw) | 1352 | discovery |
| RxNorm / rxnorm | [GET](https://rxnav.nlm.nih.gov/REST/rxcui.json?name=aspirin) | 200 | ok / ok_json | [free](https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html) | 665 | callable |
| SAMA Saudi Arabia / samasaudiarabia | [GET](https://www.sama.gov.sa/) | 0 | redirect_https / tls_error | unknown | 372 | discovery |
| Samtrafiken / samtrafiken | [GET](https://www.samtrafiken.se/) | 301 | redirect_https / redirect_not_approved | unknown | 286 | discovery |
| Samuel L Ipsum / samuellipsum | [GET](https://slipsum.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 96 | discovery |
| Saudi Aramco Data / saudiaramcodata | [GET](https://www.aramco.com/en/investors/data-and-insights/) | 500 | dead_upstream / http_error | unknown | 2986 | discovery |
| SCB / scb | [GET](https://www.scb.se/vara-tjanster/oppna-data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 221 | discovery |
| SCB API / scbapi | [GET](https://www.scb.se/vara-tjanster/oppna-data/api-for-statistikdatabasen/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2042 | discovery |
| SCB Statistics Sweden / statisticsswedenscb | [GET](https://api.scb.se/OV0104/v1/doris/en/ssd) | 200 | duplicate / duplicate | [free](https://www.scb.se/en/services/open-data-api/) | - | alias of statisticsswedenscb |
| Scorecard / scorecard | [GET](https://securityscorecards.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 319 | discovery |
| Scryfall / scryfall | [GET](https://api.scryfall.com/cards/named?exact=Black%20Lotus) | 200 | ok / ok_json | [free](https://scryfall.com/docs/api) | 97 | callable |
| Scryfall MTG / scryfallmtg | [GET](https://scryfall.com/docs/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 82 | discovery |
| SEC EDGAR / secedgar | [GET](https://data.sec.gov/submissions/CIK0000320193.json) | 200 | ok / ok_json | [free](https://www.sec.gov/about/webmaster-frequently-asked-questions) | 246 | callable |
| SEC EDGAR API / secedgarapi | [GET](https://www.sec.gov/developer/) | 404 | wrong_base_url_path / http_error | unknown | 221 | discovery |
| SEC EDGAR Data / secedgardata | [GET](https://www.sec.gov/edgar/sec-api-documentation/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1885 | discovery |
| Semantic Scholar / semanticscholar | - | 0 | commercial_permission / reviewed_exclusion | [free](https://api.semanticscholar.org) | 0 | discovery |
| Senegal Open Data API / senegalopendataapi | [GET](https://data.gouv.sn/) | 0 | dead_upstream / network_error | [free](https://data.gouv.sn) | 5 | discovery |
| Seniverse / seniverse | [GET](https://www.seniverse.com/doc/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2316 | discovery |
| Serialif Color / serialifcolor | [GET](https://color.serialif.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 651 | discovery |
| Shanbay / shanbay | [GET](https://www.shanbay.com/help/developer/api_v1/) | 302 | redirect_https / redirect_not_approved | unknown | 1054 | discovery |
| ShapeShift API / shapeshiftapi | [GET](https://shapeshift.io/) | 0 | dead_upstream / network_error | unknown | 6 | discovery |
| SHARE / share | [GET](https://share.osf.io/api/v2/) | 406 | unresolved / http_error | unknown | 294 | discovery |
| Sharp / sharp | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Shepherd.js / shepherdjs | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Shields / shields | [GET](https://shields.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 81 | discovery |
| Shields.io / shields | [GET](https://shields.io/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Signal Protocol / signalprotocol | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://signal.org) | 0 | discovery |
| Sigstore / sigstore | [GET](https://sigstore.dev/) | 301 | not_hosted_api / reviewed_exclusion | unknown | 350 | discovery |
| SilverBullet / silverbullet | [GET](https://silverbullet.md/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 95 | discovery |
| Singapore Data API / singaporedataapi | [GET](https://data.gov.sg/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.gov.sg) | 547 | discovery |
| Sitebulb / sitebulb | [GET](https://sitebulb.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 172 | discovery |
| SL API / slapi | [GET](https://www.trafiklab.se/api/sl-realtidsinformation-4/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 32 | discovery |
| SLSA / slsa | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Smappee / smappee | [GET](https://smappee.atlassian.net/wiki/display/DEVAPI/SmappeeDevAPI+Home/) | 404 | wrong_base_url_path / http_error | unknown | 284 | discovery |
| Smash / smash | [GET](https://api.fromsmash.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 353 | discovery |
| SMHI / smhi | [GET](https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/98210.json) | 200 | ok / ok_json | [free](https://www.smhi.se/data/oppna-data) | 79 | callable |
| SMHI API / smhiapi | [GET](https://opendata.smhi.se/apidocs/) | 404 | wrong_base_url_path / http_error | unknown | 85 | discovery |
| SMHI Open Data / smhiopendata | [GET](https://opendata-download-metobs.smhi.se/api/) | 200 | unresolved / invalid_response | unknown | 918 | discovery |
| SMHI Weather API / smhiapi | [GET](https://opendata.smhi.se/apidocs/) | 404 | duplicate / duplicate | unknown | - | discovery |
| SMN Argentina API / smnargentinaapi | [GET](https://www.smn.gob.ar/) | 403 | unresolved / access_denied | [free](https://www.smn.gob.ar) | 89 | discovery |
| SNB Switzerland / snbswitzerland | [GET](https://data.snb.ch/) | 400 | unresolved / http_error | unknown | 163 | discovery |
| SNB Switzerland Data / snbswitzerlanddata | [GET](https://data.snb.ch/en/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2051 | discovery |
| Songsterr / songsterr | [GET](https://www.songsterr.com/a/wa/api/) | 404 | wrong_base_url_path / http_error | unknown | 1299 | discovery |
| South Africa Data API / southafricadataapi | [GET](https://data.gov.za/) | 0 | dead_upstream / network_error | [free](https://data.gov.za) | 1306 | discovery |
| South African Reserve Bank / southafricanreservebank | [GET](https://www.resbank.co.za/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 3077 | discovery |
| Spaceflight News / spaceflightnews | [GET](https://api.spaceflightnewsapi.net/v4/articles/?limit=1) | 200 | unresolved / customer_gateway_failed | [free](https://thespacedevs.com/privacy) | 646 | discovery |
| SpaceX / spacex | [GET](https://api.spacexdata.com/v4/launches/latest) | 0 | timeout / timeout | [free](https://github.com/r-spacex/SpaceX-API) | 20002 | discovery |
| Spain INE Statistics / spanishineapi | [GET](https://servicios.ine.es/wstempus/js/ES/OPERACIONES_DISPONIBLES) | 200 | duplicate / duplicate | [free](https://www.ine.es/datosabiertos/) | - | alias of spanishineapi |
| Spanish random names / spanishrandomnames | [GET](https://random-names-api.herokuapp.com/public/) | 404 | wrong_base_url_path / http_error | unknown | 489 | discovery |
| Spanish random words / spanishrandomwords | [GET](https://palabras-aleatorias-public-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 418 | discovery |
| Squiggle / squiggle | [GET](https://api.squiggle.com.au/?q=teams;team=1) | 200 | ok / ok_json | [free](https://api.squiggle.com.au/) | 301 | callable |
| SSB / ssb | [GET](https://www.ssb.no/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 564 | discovery |
| SSB Norway / ssbnorway | [GET](https://data.ssb.no/api/v0/) | 410 | unresolved / http_error | unknown | 308 | discovery |
| Stakdek QR Generator / stakdekqrgenerator | [GET](https://api.stakdek.de/blog?id=1006) | 0 | timeout / timeout | unknown | 10386 | discovery |
| STAPI Star Trek / stapistartrek | [GET](https://stapi.co/api-documentation/) | 404 | wrong_base_url_path / http_error | unknown | 237 | discovery |
| Star Trek API (STAPI) / stapistartrek | [GET](https://stapi.co/api-documentation/) | 404 | duplicate / duplicate | unknown | - | discovery |
| StatBel Belgium / statbelbelgium | [GET](https://statbel.fgov.be/en/open-data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2265 | discovery |
| Statically / statically | [GET](https://statically.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 96 | discovery |
| Statistics Denmark / statisticsdenmark | [GET](https://dst.dk/) | 301 | redirect_https / redirect_not_approved | unknown | 1037 | discovery |
| Statistics Finland / statisticsfinland | [GET](https://pxweb2.stat.fi/PXWeb/api/v1/en/StatFin) | 200 | ok / ok_json | [free](https://stat.fi/en/statistics/open-data) | 138 | callable |
| Statistics Norway / statisticsnorway | [GET](https://data.ssb.no/api/v0/en/table/?query=07459) | 200 | ok / ok_json | [free](https://www.ssb.no/en/api) | 629 | callable |
| Statistics Sweden / statisticsswedenscb | [GET](https://api.scb.se/OV0104/v1/doris/en/ssd) | 200 | duplicate / duplicate | [free](https://www.scb.se/en/services/open-data-api/) | - | alias of statisticsswedenscb |
| Statistics Sweden (SCB) / statisticsswedenscb | [GET](https://api.scb.se/OV0104/v1/doris/en/ssd) | 200 | ok / ok_json | [free](https://www.scb.se/en/services/open-data-api/) | 173 | callable |
| Stoplight Prism / stoplightprism | [GET](https://stoplight.io/open-source/prism/) | 301 | redirect_https / redirect_not_approved | [free](https://stoplight.io/open-source/prism) | 212 | discovery |
| Stromberg Quotes / strombergquotes | [GET](https://www.stromberg-api.de/) | 301 | redirect_https / redirect_not_approved | unknown | 212 | discovery |
| Studio Ghibli / studioghibli | [GET](https://ghibliapi.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 215 | discovery |
| Studio Ghibli API / studioghibliapi | [GET](https://ghibliapi.vercel.app/films) | 200 | ok / ok_json | [free](https://ghibliapi.vercel.app) | 227 | callable |
| Sunrise and Sunset / sunriseandsunset | [GET](https://sunrise-sunset.org/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1495 | discovery |
| Sunrise-Sunset API / sunrisesunsetapi | [GET](https://api.sunrise-sunset.org/json?lat=59.3293&lng=18.0686&formatted=0) | 200 | ok / ok_json | [free](https://sunrise-sunset.org/api) | 236 | callable |
| SunriseSunset.io / sunrisesunsetio | [GET](https://api.sunrisesunset.io/json?lat=38.9&lng=-77) | 200 | ok / ok_json | [free](https://sunrisesunset.io/api/) | 92 | callable |
| Suomi.fi / suomifi | [GET](https://www.suomi.fi/palvelut/apis/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1127 | discovery |
| SuredBits / suredbits | [GET](https://suredbits.com/api/) | 522 | dead_upstream / http_error | unknown | 19565 | discovery |
| Svea / svea | [GET](https://www.svea.com/se/sv/foretag/integrationer/) | 404 | wrong_base_url_path / http_error | unknown | 1096 | discovery |
| Sveriges Dataportal / sverigesdataportal | [GET](https://www.dataportal.se/api/) | 404 | wrong_base_url_path / http_error | unknown | 1214 | discovery |
| SVN API / svnapi | [GET](https://subversion.apache.org/docs/api/1.8/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://subversion.apache.org/docs/api/1.8) | 69 | discovery |
| SWAPI GraphQL / swapigraphql | [GET](https://graphql.org/swapi-graphql/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 261 | discovery |
| SWAPI Star Wars / swapistarwars | [GET](https://www.swapi.tech/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 432 | discovery |
| Sweden Data API / ppnadatasverige | [GET](https://www.dataportal.se/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Swedish Parliament / swedishparliament | [GET](https://data.riksdagen.se/) | 301 | redirect_https / redirect_not_approved | unknown | 61 | discovery |
| Swiss Federal Stats / swissfederalstats | [GET](https://www.pxweb.bfs.admin.ch/api/v1/en/) | 200 | ok / ok_json | [free](https://www.bfs.admin.ch/bfs/en/home/services/ogd.html) | 701 | callable |
| Swisstopo Geodata / swisstopogeodata | [GET](https://api3.geo.admin.ch/) | 302 | redirect_https / redirect_not_approved | unknown | 188 | discovery |
| Syft / grype | - | 0 | duplicate / duplicate | unknown | - | discovery |
| Taiga / taiga | [GET](https://taiga.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 362 | discovery |
| Taiwan Open Data API / opengovernmenttaiwan | [GET](https://data.gov.tw/) | 200 | duplicate / duplicate | [free](https://data.gov.tw) | - | discovery |
| Taylor Swift API / taylorswiftapi | [GET](https://taylor.rest/) | 0 | dead_upstream / network_error | [free](https://taylor.rest) | 3 | discovery |
| TCGdex Pokémon / tcgdexpokmon | [GET](https://www.tcgdex.dev/) | 301 | redirect_https / redirect_not_approved | unknown | 163 | discovery |
| TCGdex Pokémon TCG / tcgdexpokmon | [GET](https://www.tcgdex.dev/) | 301 | duplicate / duplicate | unknown | - | discovery |
| Teambition / teambition | [GET](https://www.teambition.com/developer/open-platform/) | 302 | redirect_https / redirect_not_approved | unknown | 2261 | discovery |
| Techy / techy | [GET](https://techy-api.vercel.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 311 | discovery |
| Techy API / techy | [GET](https://techy-api.vercel.app/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Telegram API / telegramapi | [GET](https://core.telegram.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 173 | discovery |
| Tenders Hungary / tendershungary | [GET](https://tenders.guru/hu/api/) | 0 | timeout / timeout | unknown | 10265 | discovery |
| Tenders in Hungary / tendershungary | [GET](https://tenders.guru/hu/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Tenders in Poland / tendersinpoland | [GET](https://tenders.guru/pl/api/) | 0 | timeout / timeout | unknown | 20001 | discovery |
| Tenders in Romania / tendersinromania | [GET](https://tenders.guru/ro/api/) | 0 | timeout / timeout | unknown | 20001 | discovery |
| Tenders in Spain / tendersinspain | [GET](https://tenders.guru/es/api/) | 0 | timeout / timeout | unknown | 20872 | discovery |
| Tenders in Ukraine / tendersinukraine | [GET](https://tenders.guru/ua/api/) | 0 | timeout / timeout | unknown | 20001 | discovery |
| Tenders Poland / tendersinpoland | [GET](https://tenders.guru/pl/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Tenders Romania / tendersinromania | [GET](https://tenders.guru/ro/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Tenders Spain / tendersinspain | [GET](https://tenders.guru/es/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Tenders Ukraine / tendersinukraine | [GET](https://tenders.guru/ua/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Terraform Registry / terraformregistry | [GET](https://registry.terraform.io/v1/providers?limit=1) | 200 | ok / ok_json | [free](https://registry.terraform.io) | 232 | callable |
| TETR.IO / tetrio | [GET](https://tetr.io/about/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 106 | discovery |
| TextMate / textmate | [GET](https://macromates.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 148 | discovery |
| Thailand Open Data API / thailandopendataapi | [GET](https://data.go.th/) | 403 | unresolved / access_denied | [free](https://data.go.th) | 106 | discovery |
| The Null Pointer / thenullpointer | [GET](https://0x0.st/) | 200 | unresolved / invalid_response | unknown | 314 | discovery |
| The SMS Works / thesmsworks | [GET](https://thesmsworks.co.uk/sms-api/) | 404 | wrong_base_url_path / http_error | unknown | 196 | discovery |
| They Said So Quotes / theysaidsoquotes | [GET](https://theysaidso.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1778 | discovery |
| Things API / thingsapi | [GET](https://culturedcode.com/things/support/articles/2803573/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 132 | discovery |
| Thirukkural / thirukkural | [GET](https://api-thirukkural.web.app/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 63 | discovery |
| This Person Does not Exist / thispersondoesnotexist | [GET](https://thispersondoesnotexist.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 85 | discovery |
| Thread / thread | [GET](https://threadgroup.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 849 | discovery |
| ThronesApi / thronesapi | [GET](https://thronesapi.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 534 | discovery |
| Thumbor / thumbor | [GET](https://thumbor.readthedocs.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1039 | discovery |
| TLE / tle | [GET](https://tle.ivanstanojevic.me/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 215 | discovery |
| TLE API / tle | [GET](https://tle.ivanstanojevic.me/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Today in History API / todayinhistoryapi | [GET](https://history.muffinlabs.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 568 | discovery |
| Toodledo / toodledo | [GET](https://api.toodledo.com/3/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 280 | discovery |
| Toolcarton / toolcarton | [GET](https://testimonialapi.toolcarton.com/) | 0 | dead_upstream / network_error | unknown | 5 | discovery |
| TradingView / tradingview | [GET](https://tradingview.com/) | 301 | redirect_https / redirect_not_approved | [free](https://tradingview.com) | 290 | discovery |
| Trafikverket Open API / trafikverketopenapi | [GET](https://api.trafikinfo.trafikverket.se/) | 404 | wrong_base_url_path / http_error | unknown | 122 | discovery |
| Traitify / traitify | [GET](https://app.traitify.com/developer/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 624 | discovery |
| Transfermarkt API / transfermarktapi | [GET](https://transfermarkt-api.vercel.app/) | 402 | unresolved / http_error | unknown | 94 | discovery |
| TransLink Queensland / translinkqueensland | [GET](https://translink.com.au/about-translink/open-data/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2897 | discovery |
| Transport for Auckland, New Zealand / transportforaucklandnewzealand | [GET](https://dev-portal.at.govt.nz/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1715 | discovery |
| Transport for Budapest, Hungary / transportforbudapesthungary | [GET](https://bkkfutar.docs.apiary.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 14918 | discovery |
| Transport for Czech Republic / transportforczechrepublic | [GET](https://www.chaps.cz/eng/products/idos-internet/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 223 | discovery |
| Transport for Switzerland / transportforswitzerland | [GET](https://transport.opendata.ch/v1/locations?query=Basel&fields%5B%5D=stations/id&fields%5B%5D=stations/name) | 200 | ok / ok_json | [free](https://transport.opendata.ch/) | 299 | callable |
| Transport for United States / transportforunitedstates | [GET](https://retro.umoiq.com/xmlFeedDocs/NextBusXMLFeed.pdf/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 802 | discovery |
| transport.rest / transportrest | [GET](https://v6.db.transport.rest/locations?query=Berlin&results=1) | 503 | timeout / timeout | [free](https://v6.db.transport.rest/api.html) | 20001 | discovery |
| Trivy / trivy | [GET](https://trivy.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 96 | discovery |
| Tronald Dump / tronalddump | [GET](https://www.tronalddump.io/) | 521 | dead_upstream / http_error | unknown | 424 | discovery |
| Tunisia Open Data API / tunisiaopendataapi | [GET](https://catalog.agridata.tn/api/3/action/package_search?rows=1) | 200 | unresolved / customer_gateway_failed | [free](https://catalog.agridata.tn) | 344 | discovery |
| TVMaze API / tvmazeapi | [GET](https://tvmaze.com/api/) | 301 | redirect_https / redirect_not_approved | unknown | 156 | discovery |
| Uganda Open Data API / ugandaopendataapi | [GET](https://data.ug/) | 301 | redirect_https / redirect_not_approved | [free](https://data.ug) | 79 | discovery |
| UI Avatars / uiavatars | [GET](https://ui-avatars.com/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://ui-avatars.com) | 99 | discovery |
| UK Bank Holidays / ukbankholidays | [GET](https://www.gov.uk/bank-holidays.json) | 200 | ok / ok_json | [free](https://www.gov.uk/bank-holidays) | 192 | callable |
| UK Government / opengovernmentuk | [GET](https://ckan.publishing.service.gov.uk/api/3/action/package_search?rows=1&fl=id,name,title,license_id) | 200 | duplicate / duplicate | [free](https://www.data.gov.uk/about/) | - | alias of opengovernmentuk |
| UK Government API / opengovernmentuk | [GET](https://ckan.publishing.service.gov.uk/api/3/action/package_search?rows=1&fl=id,name,title,license_id) | 200 | duplicate / duplicate | [free](https://www.data.gov.uk/about/) | - | alias of opengovernmentuk |
| Ultraleap Tracking / ultraleaptracking | [GET](https://www.ultraleap.com/tracking/) | 404 | wrong_base_url_path / http_error | unknown | 292 | discovery |
| umati / umati | [GET](https://umati.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1269 | discovery |
| Umeå Open Data / umeopendata | [GET](https://opendata.umea.se/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2427 | discovery |
| UN Data / undata | [GET](https://data.un.org/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://data.un.org) | 271 | discovery |
| UN Data API / undata | [GET](https://data.un.org/) | 200 | duplicate / duplicate | [free](https://data.un.org) | - | discovery |
| UniProt API / uniprotapi | [GET](https://rest.uniprot.org/uniprotkb/search?query=accession%3AP69905&format=json&size=1&fields=accession) | 200 | ok / ok_json | [free](https://www.uniprot.org/help/programmatic_access) | 214 | callable |
| University of Oslo / universityofoslo | [GET](https://data.uio.no/) | 406 | unresolved / http_error | unknown | 87 | discovery |
| Unsplash It / unsplashit | [GET](https://unsplash.it/) | 301 | redirect_https / redirect_not_approved | unknown | 88 | discovery |
| Unsplash Resource / unsplashresource | [GET](https://source.unsplash.com/) | 503 | dead_upstream / http_error | unknown | 1157 | discovery |
| Urban Observatory / urbanobservatory | [GET](https://urbanobservatory.ac.uk/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 284 | discovery |
| URLhaus / urlhaus | [GET](https://urlhaus-api.abuse.ch/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 286 | discovery |
| Uruguay Open Data API / uruguayopendataapi | [GET](https://catalogodatos.gub.uy/api/3/action/package_search?rows=1) | 0 | timeout / timeout | [free](https://catalogodatos.gub.uy) | 532 | discovery |
| US Presidential Election Data by TogaTech / uspresidentialelectiondatabytogatech | [GET](https://uselection.togatech.org/api/) | 404 | wrong_base_url_path / http_error | unknown | 589 | discovery |
| USAspending / usaspending | [GET](https://api.usaspending.gov/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 855 | discovery |
| USAspending API / usaspending | [GET](https://api.usaspending.gov/) | 200 | duplicate / duplicate | unknown | - | discovery |
| USAspending.gov / usaspending | [GET](https://api.usaspending.gov/) | 200 | duplicate / duplicate | unknown | - | discovery |
| UserAgent / useragent | [GET](https://useragent.api.io/) | 0 | dead_upstream / network_error | unknown | 2 | discovery |
| USGS / usgs | [GET](https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=1&orderby=time) | 200 | ok / ok_json | [free](https://earthquake.usgs.gov/fdsnws/event/1/) | 435 | callable |
| USGS Earthquake / usgsearthquake | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1303 | discovery |
| USGS Earthquake API / usgsearthquake | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | duplicate / duplicate | unknown | - | discovery |
| USGS Earthquake Hazards / usgsearthquake | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | duplicate / duplicate | unknown | - | discovery |
| USGS Earthquake Hazards Program / usgsearthquake | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | duplicate / duplicate | unknown | - | discovery |
| USGS Water Services / usgswaterservices | [GET](https://waterservices.usgs.gov/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 934 | discovery |
| USPTO / uspto | [GET](https://www.uspto.gov/learning-and-resources/open-data-and-mobility/) | 404 | wrong_base_url_path / http_error | unknown | 144 | discovery |
| USPTO API / uspto | [GET](https://www.uspto.gov/learning-and-resources/open-data-and-mobility/) | 404 | duplicate / duplicate | unknown | - | discovery |
| V2EX / v2ex | [GET](https://www.v2ex.com/p/7v9TEc53/) | 404 | wrong_base_url_path / http_error | unknown | 260 | discovery |
| Vadivelu HTTP Codes / vadiveluhttpcodes | [GET](https://vadivelu.anoram.com/) | 0 | dead_upstream / network_error | unknown | 3 | discovery |
| Valorant (non-official) / valorantapi | [GET](https://valorant-api.com/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Valorant API / valorantapi | [GET](https://valorant-api.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 244 | discovery |
| VCR.py / vcrpy | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://vcrpy.readthedocs.io) | 0 | discovery |
| Vector Express v2.0 / vectorexpressv20 | [GET](https://vector.express/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 100 | discovery |
| VeganCheck API / vegancheckapi | [GET](https://jokenetwork.de/vegancheck-api/) | 303 | redirect_https / redirect_not_approved | unknown | 230 | discovery |
| Velib metropolis, Paris, France / velibmetropolisparisfrance | [GET](https://www.velib-metropole.fr/donnees-open-data-gbfs-du-service-velib-metropole/) | 403 | unresolved / access_denied | unknown | 238 | discovery |
| Vercel AI SDK / vercelaisdk | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://sdk.vercel.ai) | 0 | discovery |
| ViaCep / viacep | [GET](https://viacep.com.br/ws/01001000/json/) | 200 | ok / ok_json | [free](https://viacep.com.br/) | 458 | callable |
| Vietnam Open Data API / vietnamopendataapi | [GET](https://data.gov.vn/) | 0 | dead_upstream / network_error | [free](https://data.gov.vn) | 3 | discovery |
| VIN Decoder / vindecoder | [GET](https://vpic.nhtsa.dot.gov/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 465 | discovery |
| Vinli / vinli | [GET](https://dev.vin.li/) | 0 | dead_upstream / network_error | unknown | 3 | discovery |
| Virushee / virushee | [GET](https://api.virushee.com/) | 0 | dead_upstream / network_error | unknown | 2 | discovery |
| VK API / vkapi | [GET](https://vk.com/dev/) | 302 | redirect_https / redirect_not_approved | unknown | 137 | discovery |
| Vy / vy | [GET](https://www.vy.no/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 988 | discovery |
| WallstreetBets / wallstreetbets | [GET](https://dashboard.nbshare.io/apps/reddit/api/) | 301 | redirect_https / redirect_not_approved | unknown | 97 | discovery |
| Warface (non-official) / warfacenonofficial | [GET](https://api.wfstats.cf/) | 0 | dead_upstream / network_error | unknown | 159 | discovery |
| Weatherstack / weatherstack | - | 0 | needs_key / reviewed_exclusion | unknown | 0 | discovery |
| Web3Modal / web3modal | [GET](https://web3modal.com/) | 308 | redirect_https / redirect_not_approved | unknown | 137 | discovery |
| Website Carbon / websitecarbon | [GET](https://api.websitecarbon.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 178 | discovery |
| WebXR / webxr | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Weebly / weebly | [GET](https://cloud-developer.weebly.com/) | 404 | wrong_base_url_path / http_error | unknown | 63 | discovery |
| WePay / wepay | [GET](https://www.wepay.com/) | 0 | dead_upstream / network_error | unknown | 391 | discovery |
| Wger Workout Manager / wgerworkoutmanager | [GET](https://wger.de/api/v2/exerciseinfo/?limit=1) | 200 | ok / ok_json | [free](https://wger.readthedocs.io/en/latest/index.html) | 203 | callable |
| WhiskyHunter / whiskyhunter | [GET](https://whiskyhunter.net/api/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 194 | discovery |
| Whitepages Pro / whitepagespro | [GET](https://pro.whitepages.com/) | 301 | redirect_https / redirect_not_approved | unknown | 71 | discovery |
| WHO / who | [GET](https://who.int/) | 301 | redirect_https / redirect_not_approved | unknown | 84 | discovery |
| Wikipedia / wikipedia | [GET](https://en.wikipedia.org/w/api.php?action=query&format=json&titles=Earth&prop=info) | 200 | ok / ok_json | [free](https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use) | 373 | callable |
| Wikipedia API / wikipediaapi | [GET](https://en.wikipedia.org/w/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2757 | discovery |
| Wiktionary / wiktionary | [GET](https://en.wiktionary.org/w/api.php/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1898 | discovery |
| Wiktionary API / wiktionary | [GET](https://en.wiktionary.org/w/api.php/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Wolne Lektury / wolnelektury | [GET](https://wolnelektury.pl/api/kinds/) | 200 | ok / ok_json | [free](https://wolnelektury.pl/info/zasady-wykorzystania/) | 353 | callable |
| Working Nomads / workingnomads | [GET](https://www.workingnomads.co/api/exposed_jobs/) | 301 | redirect_https / redirect_not_approved | unknown | 473 | discovery |
| Worktile / worktile | [GET](https://dev.worktile.com/document/overview/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1052 | discovery |
| World Bank / worldbank | [GET](https://api.worldbank.org/v2/country?format=json&per_page=1) | 200 | ok / ok_json | [free](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation) | 76 | callable |
| World Bank API / worldbank | [GET](https://api.worldbank.org/v2/country?format=json&per_page=1) | 200 | duplicate / duplicate | [free](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation) | - | alias of worldbank |
| World Flora Online / worldfloraonline | [GET](https://worldfloraonline.org/) | 0 | redirect_https / tls_error | unknown | 270 | discovery |
| WorldTimeAPI / worldtimeapi | [GET](https://worldtimeapi.org/api/timezone/Etc/UTC) | 0 | unresolved / network_error | [free](https://worldtimeapi.org/) | 210 | discovery |
| Wunderground / wunderground | [GET](https://www.wunderground.com/weather/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2266 | discovery |
| xColors / xcolors | [GET](https://x-colors.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 270 | discovery |
| xeno-canto / xenocanto | [GET](https://xeno-canto.org/explore/api/) | 404 | wrong_base_url_path / http_error | unknown | 460 | discovery |
| xMath / xmath | [GET](https://x-math.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 166 | discovery |
| XMPP / xmpp | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://xmpp.org) | 0 | discovery |
| Y.js / yjs | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Yandex / yandex | [GET](https://tech.yandex.com/maps/) | 301 | redirect_https / redirect_not_approved | unknown | 459 | discovery |
| Yes No / yesno | [GET](https://yesno.wtf/api) | 200 | ok / ok_json | [free](https://yesno.wtf/) | 253 | callable |
| Youku / youku | [GET](https://doc.open.youku.com/) | 404 | wrong_base_url_path / http_error | unknown | 1044 | discovery |
| YR / metnorway | [GET](https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75) | 200 | ok / ok_json | [free](https://api.met.no/doc/TermsOfService) | 132 | callable |
| Yr.no / yrno | [GET](https://api.met.no/weatherapi/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 164 | discovery |
| Yu-Gi-Oh / yugioh-3632c0c5 | [GET](https://db.ygoprodeck.com/api/v7/cardinfo.php?id=6983839) | 200 | ok / ok_json | [free](https://ygoprodeck.com/api-guide/) | 79 | callable |
| Yu-Gi-Oh! API / yugioh-87bf1c6d | [GET](https://db.ygoprodeck.com/api-guide/) | 301 | duplicate / duplicate | unknown | - | discovery |
| Z-Wave / zwave | [GET](https://z-wavealliance.org/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 308 | discovery |
| Zed / zed | [GET](https://zed.dev/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1040 | discovery |
| Zen Quotes / zenquotes | [GET](https://zenquotes.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1289 | discovery |
| Zen Quotes API / zenquotesapi | [GET](https://zenquotes.io/api/) | 200 | ok / ok_json | [free](https://zenquotes.io/api) | 2337 | callable |
| Zettlr / zettlr | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Zigbee / zigbee | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Ziptastic / ziptastic | [GET](https://ziptasticapi.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 484 | discovery |
| ZMOK / zmok | [GET](https://zmok.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 698 | discovery |
| Zoo Animals / zooanimals | [GET](https://zoo-animal-api.herokuapp.com/) | 404 | wrong_base_url_path / http_error | unknown | 419 | discovery |
| Zoo Animals API / zooanimals | [GET](https://zoo-animal-api.herokuapp.com/) | 404 | duplicate / duplicate | unknown | - | discovery |
| 0x API Protocol API / 0xapiprotocolapi | - | 0 | needs_key / reviewed_exclusion | [free](https://0xapi.finance/docs) | 0 | discovery |
| 18F / 18f | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| 1inch API / 1inchapi | - | 0 | needs_key / reviewed_exclusion | [free](https://docs.1inch.io) | 0 | discovery |
| 1inch Protocol API / 1inchprotocolapi | - | 0 | needs_key / reviewed_exclusion | [free](https://1inch.finance/docs) | 0 | discovery |
| 1pt / 1pt | [GET](https://github.com/1pt-co/api/blob/main/README.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| 4chan / 4chan | [GET](https://github.com/4chan/4chan-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| 7Timer! / 7timer | - | 0 | commercial_permission / reviewed_exclusion | unknown | 0 | discovery |
| Aave API / aaveapi | [GET](https://docs.aave.com/developers/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Aave Protocol API / aaveprotocolapi | [GET](https://aave.finance/docs/) | 301 | redirect_https / redirect_not_approved | [free](https://aave.finance/docs) | 92 | discovery |
| AcgClub / acgclub | [GET](https://github.com/Rabtman/AcgClub/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Adidas AG / adidasag | [GET](https://developers.adidas.com/services/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| administrative-divisons-db / administrativedivisonsdb | [GET](https://github.com/kamikazechaser/administrative-divisions-db/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Adorable Avatars / adorableavatars | [GET](https://avatars.adorable.io/) | 0 | dead_upstream / network_error | [free](http://avatars.adorable.io) | 3 | discovery |
| Advice Slip / adviceslip | [GET](https://api.adviceslip.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 209 | discovery |
| Aeris Weather / aerisweather | [GET](https://www.aerisweather.com/develop/) | 301 | redirect_https / redirect_not_approved | unknown | 93 | discovery |
| Alidayu / alidayu | [GET](https://www.alidayu.com/) | 404 | wrong_base_url_path / http_error | unknown | 1283 | discovery |
| Amap / amap | [GET](https://lbs.amap.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2501 | discovery |
| Amazon Alexa / amazonalexa | [GET](https://developer.amazon.com/public/solutions/alexa/alexa-voice-service/content/avs-api-overview/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Amazon Cloud Drive / amazonclouddrive | [GET](https://developer.amazon.com/amazon-drive/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Amazon Maps API / amazonmapsapi | [GET](https://developer.amazon.com/maps/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Amazon Mobile Ads / amazonmobileads | [GET](https://developer.amazon.com/mobile-ads/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Amazon S3 / amazons3 | [GET](https://aws.amazon.com/de/documentation/s3/) | 301 | redirect_https / redirect_not_approved | unknown | 524 | discovery |
| Animal Crossing NH / animalcrossingnewhorizons | [GET](https://acnhapi.com/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Animal Crossing: New Horizons / animalcrossingnewhorizons | [GET](https://acnhapi.com/) | 0 | redirect_https / tls_error | unknown | 285 | discovery |
| AnimeChan / animechan | [GET](https://github.com/RocktimSaikia/anime-chan/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| AnimeFacts / animefacts | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Apple Vision Pro SDK / applevisionprosdk | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Apprise API / appriseapi | [GET](https://github.com/caronc/apprise/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Aramex / aramex | [GET](https://www.aramex.com/developers/aramex-apis/) | 403 | unresolved / access_denied | unknown | 132 | discovery |
| Arbeitnow / arbeitnow | [GET](https://documenter.getpostman.com/view/18545278/UVJbJdKh/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Archive.org / archiveorg | [GET](https://archive.org/metadata/opensource_movies?output=json&fields=metadata) | 200 | ok / ok_json | [free](https://archive.org/developers/md-read.html) | 629 | callable |
| Arize AI / arizeai | [GET](https://docs.arize.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Art Institute of Chicago / artinstituteofchicago | [GET](https://api.artic.edu/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 178 | discovery |
| Art Institute of Chicago API / artinstituteofchicagoapi | [GET](https://api.artic.edu/api/v1/artworks?limit=1&fields=id,title) | 200 | ok / ok_json | [free](https://api.artic.edu/docs/) | 869 | callable |
| Arthur AI / arthurai | [GET](https://docs.arthur.ai/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| ARTIK Cloud / artikcloud | [GET](https://developer.artik.cloud/documentation/api-reference/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| AT&T M2X / attm2x | [GET](https://m2x.att.com/developer/documentation/v2/overview/) | 0 | dead_upstream / network_error | unknown | 2 | discovery |
| Atom Finance / atomfinance | [GET](https://docs.atom.finance/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Autochess VNG / autochessvng | [GET](https://github.com/didadadida93/autochess-vng-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Autochess VNG API / autochessvng | [GET](https://github.com/didadadida93/autochess-vng-api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| AutoGen / autogen | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://github.com/microsoft/autogen) | 0 | discovery |
| Automatic / automatic | [GET](https://developer.automatic.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Avatar Data / avatardata | [GET](https://www.avatardata.cn/Docs/) | 0 | redirect_https / tls_error | unknown | 365 | discovery |
| AviationAPI / aviationapi | [GET](https://api.aviationapi.com/v1/airports?apt=JFK) | 0 | dead_upstream / network_error | [free](https://docs.aviationapi.com/) | 2 | discovery |
| BackstopJS API / backstopjsapi | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| BACnet / bacnet | [GET](https://www.bacnet.org/) | 301 | redirect_https / redirect_not_approved | unknown | 109 | discovery |
| Baidu API STORE / baiduapistore | [GET](https://apistore.baidu.com/) | 301 | redirect_https / redirect_not_approved | unknown | 1069 | discovery |
| Baidu Map / baidumap | [GET](https://lbsyun.baidu.com/index.php?title=webapi) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2572 | discovery |
| Baidu Translate / baidutranslate | [GET](https://api.fanyi.baidu.com/api/trans/product/index/) | 301 | redirect_https / redirect_not_approved | unknown | 1255 | discovery |
| Baidu Yuyin / baiduyuyin | [GET](https://yuyin.baidu.com/docs/) | 301 | redirect_https / redirect_not_approved | unknown | 1269 | discovery |
| Balancer Protocol API / balancerprotocolapi | [GET](https://balancer.finance/docs/) | 301 | redirect_https / redirect_not_approved | [free](https://balancer.finance/docs) | 84 | discovery |
| Bambora / bambora | [GET](https://developer.bambora.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bannerbear / bannerbear | [GET](https://www.bannerbear.com/docs/) | 404 | wrong_base_url_path / http_error | unknown | 314 | discovery |
| Bark / bark | [GET](https://github.com/suno-ai/bark/) | 0 | wrong_base_url_path / documentation_url | [free](https://github.com/suno-ai/bark) | 0 | discovery |
| Barter.VG / bartervg | [GET](https://github.com/bartervg/barter.vg/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| BCLaws / bclaws | [GET](https://www.bclaws.gov.bc.ca/civix/template/complete/api/index.html/) | 406 | unresolved / http_error | unknown | 594 | discovery |
| Besin API (Turkish) / besinapiturkish | [GET](https://github.com/topics/food-database/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bible API wldeh / bibleapiwldeh | [GET](https://github.com/wldeh/bible-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bible-api / bibleapi | [GET](https://bible-api.com/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Bitcambio / bitcambio | [GET](https://nova.bitcambio.com.br/api/v3/) | 403 | unresolved / access_denied | unknown | 90 | discovery |
| Bitcoin / bitcoin | [GET](https://developer.bitcoin.org/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bitcoin Developer / bitcoin | [GET](https://developer.bitcoin.org/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Bitcoin Developer API / bitcoin | [GET](https://developer.bitcoin.org/) | 0 | duplicate / duplicate | unknown | - | discovery |
| BlockScore / blockscore | [GET](https://docs.blockscore.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| BNB Chain API / bnbchainapi | [GET](https://docs.bnbchain.org/docs/beaconchain/develop/api-reference/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bob's Burgers API / bobsburgersapi | [GET](https://bobsburgers-api.herokuapp.com/characters?limit=1) | 200 | ok / ok_json | [free](https://www.bobsburgersapi.com/documentation) | 431 | callable |
| BOM API / bomapi | [GET](https://www.bom.gov.au/catalogue/data-feeds.shtml/) | 403 | unresolved / access_denied | [free](http://www.bom.gov.au/catalogue/data-feeds.shtml) | 164 | discovery |
| Bond / bond | [GET](https://docs.bond.tech/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bookshare / bookshare | [GET](https://developer.bookshare.org/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Bored API / boredapi | [GET](https://www.boredapi.com/documentation/) | 0 | dead_upstream / network_error | [free](https://www.boredapi.com/documentation) | 2 | discovery |
| BosonNLP / bosonnlp | [GET](https://docs.bosonnlp.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| BotsArchive / botsarchive | [GET](https://botsarchive.com/docs.html/) | 404 | wrong_base_url_path / http_error | unknown | 142 | discovery |
| Brazilian Chamber of Deputies Open Data / brazilianchamberofdeputiesopendata | [GET](https://dadosabertos.camara.leg.br/api/v2/partidos?itens=1) | 200 | ok / ok_json | [free](https://dadosabertos.camara.leg.br/faq/faq-home.html) | 1377 | callable |
| Brazilian Vehicles and Prices / brazilianvehiclesandprices | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Breaking Bad / breakingbad | [GET](https://breakingbadapi.com/documentation/) | 0 | dead_upstream / network_error | unknown | 3 | discovery |
| Breaking Bad API / breakingbad | [GET](https://breakingbadapi.com/documentation/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Breaking Bad Quotes / breakingbadquotes | [GET](https://github.com/shevabam/breaking-bad-quotes/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| BreweryDB / brewerydb | [GET](https://www.brewerydb.com/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2594 | discovery |
| British National Bibliography / britishnationalbibliography | [GET](https://bnb.data.bl.uk/) | 0 | unresolved / network_error | unknown | 4053 | discovery |
| Budbee / budbee | [GET](https://developer.budbee.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Buffy the Vampire Slayer API / buffythevampireslayerapi | [GET](https://github.com/Thatskat/btvs-angel-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Caiyun Weather / caiyunweather | [GET](https://caiyunapp.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 738 | discovery |
| Canada Post / canadapost | [GET](https://www.canadapost.ca/cpo/mc/business/productsservices/developers/services/fundamentals.jsf/) | 302 | redirect_https / redirect_not_approved | unknown | 189 | discovery |
| CarQuery / carquery | [GET](https://www.carqueryapi.com/documentation/) | 0 | redirect_https / tls_error | unknown | 272 | discovery |
| Cartes.io / cartesio | [GET](https://github.com/M-Media-Group/Cartes.io/wiki/API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| CartoDB / cartodb | [GET](https://carto.com/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1111 | discovery |
| Cat Facts / catfacts | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Cat Ipsum / catipsum | [GET](https://www.catipsum.com/) | 0 | redirect_https / tls_error | unknown | 326 | discovery |
| Catalogopolis / catalogopolis | [GET](https://api.catalogopolis.xyz/docs/) | 0 | dead_upstream / network_error | unknown | 3 | discovery |
| Catch The Show / catchtheshow | [GET](https://catchtheshow.herokuapp.com/api/documentation/) | 404 | wrong_base_url_path / http_error | unknown | 487 | discovery |
| CBM Myanmar Forex / cbmmyanmarforex | [GET](https://forex.cbm.gov.mm/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 566 | discovery |
| CDC / cdc | [GET](https://data.cdc.gov/resource/bi63-dtpu.json?%24limit=1) | 200 | ok / ok_json | [free](https://catalog.data.gov/dataset/cdc-open-data-api) | 774 | callable |
| Census.gov / censusgov | - | 0 | needs_key / reviewed_exclusion | unknown | 0 | discovery |
| Cep.la / cepla | [GET](https://cep.la/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 631 | discovery |
| CERN Open Data / cernopendata | [GET](https://opendata.cern.ch/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 455 | discovery |
| Chainlink API / chainlinkapi | [GET](https://docs.chain.link/) | 0 | wrong_base_url_path / documentation_url | [free](https://docs.chain.link) | 0 | discovery |
| ChartLyrics / chartlyrics | [GET](https://www.chartlyrics.com/api.aspx/) | 0 | redirect_https / tls_error | unknown | 230 | discovery |
| Cheese Ipsum / cheeseipsum | [GET](https://www.cheeseipsum.co.uk/) | 301 | redirect_https / redirect_not_approved | unknown | 253 | discovery |
| ChEMBL API / chemblapi | [GET](https://www.ebi.ac.uk/chembl/api/data/molecule.json?limit=1) | 0 | timeout / timeout | [free](https://www.ebi.ac.uk/chembl/api/data/docs) | 20001 | discovery |
| Chinese Character Web / chinesecharacterweb | [GET](https://ccdb.hemiola.com/) | 0 | redirect_https / tls_error | unknown | 412 | discovery |
| Chroma / chroma | [GET](https://docs.trychroma.com/) | 0 | wrong_base_url_path / documentation_url | [free](https://docs.trychroma.com) | 0 | discovery |
| Chronicling America / chroniclingamerica | [GET](https://chroniclingamerica.loc.gov/about/api/) | 308 | redirect_https / redirect_not_approved | unknown | 66 | discovery |
| Chuck Norris Database / chucknorrisdatabase | [GET](https://www.icndb.com/api/) | 301 | redirect_https / redirect_not_approved | unknown | 446 | discovery |
| Church Calendar / churchcalendar | [GET](https://calapi.inadiutorium.cz/) | 0 | dead_upstream / network_error | unknown | 55 | discovery |
| Ciprand / ciprand | [GET](https://github.com/polarspetroll/ciprand/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| City, Gdynia / citygdynia | [GET](https://otwartedane.gdynia.pl/en/api_doc.html/) | 404 | wrong_base_url_path / http_error | unknown | 1062 | discovery |
| City, Prague Open Data / citypragueopendata | [GET](https://opendata.praha.eu/en/) | 301 | redirect_https / redirect_not_approved | unknown | 138 | discovery |
| Citybikes / citybikes-5671f659 | [GET](https://citybik.es/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 289 | discovery |
| CitySDK / citysdk | [GET](https://www.citysdk.eu/citysdk-toolkit/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1301 | discovery |
| CleanURI / cleanuri | [GET](https://cleanuri.com/docs/) | 0 | timeout / timeout | unknown | 20005 | discovery |
| Cloud Machine Learning Engine / cloudmachinelearningengine | [GET](https://cloud.google.com/ml-engine/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1238 | discovery |
| Cloudflare Trace / cloudflaretrace | [GET](https://github.com/fawazahmed0/cloudflare-trace-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| CO2 Offset / co2offset | [GET](https://co2offset.io/api.html/) | 302 | redirect_https / redirect_not_approved | unknown | 83 | discovery |
| CO2 Offset API / co2offset | [GET](https://co2offset.io/api.html/) | 302 | duplicate / duplicate | unknown | - | discovery |
| Coactive AI / coactiveai | [GET](https://coactive.ai/developers/) | 301 | redirect_https / redirect_not_approved | unknown | 1271 | discovery |
| Codestral / codestral | [GET](https://docs.mistral.ai/capabilities/code_generation/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Codex / codex | [GET](https://github.com/Jaagrav/CodeX/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| CodeX Compiler / codex | [GET](https://github.com/Jaagrav/CodeX/) | 0 | duplicate / duplicate | unknown | - | discovery |
| CoinCap / coincap | [GET](https://docs.coincap.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| CoinDesk Bitcoin Price Index / coindeskbitcoinpriceindex | [GET](https://www.coindesk.com/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1059 | discovery |
| CoinDesk BPI / coindeskbitcoinpriceindex | [GET](https://www.coindesk.com/api/) | 200 | duplicate / duplicate | unknown | - | discovery |
| CoinGecko / coingecko | [GET](https://www.coingecko.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 4203 | discovery |
| CoinGecko API / coingeckoapi | [GET](https://www.coingecko.com/en/api/documentation/) | 301 | redirect_https / redirect_not_approved | freemium | 3118 | discovery |
| CoinStats / coinstats | [GET](https://documenter.getpostman.com/view/5734027/RzZ6Hzr3?version=latest) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Collector Bank / collectorbank | [GET](https://developer.collectorbank.se/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Colormind / colormind | [GET](https://colormind.io/api-access/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 338 | discovery |
| ColourLovers / colourlovers | [GET](https://www.colourlovers.com/api/) | 403 | unresolved / access_denied | unknown | 1033 | discovery |
| Comic Vine / comicvine | [GET](https://comicvine.gamespot.com/api/documentation/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1069 | discovery |
| Comichron Data / comichrondata | [GET](https://github.com/comichron-data/api/) | 0 | wrong_base_url_path / documentation_url | [free](https://github.com/comichron-data/api) | 0 | discovery |
| Comichron Data API / comichrondata | [GET](https://github.com/comichron-data/api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Commerce Layer / commercelayer | [GET](https://docs.commercelayer.io/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Community Transit / communitytransit | [GET](https://github.com/transitland/transitland-datastore/blob/master/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Compound API / compoundapi | [GET](https://compound.finance/docs/) | 302 | redirect_https / redirect_not_approved | unknown | 83 | discovery |
| Compound Protocol API / compoundapi | [GET](https://compound.finance/docs/) | 302 | duplicate / duplicate | [free](https://compound.finance/docs) | - | discovery |
| Concur Labs / concurlabs | [GET](https://developer.concur.com/api-reference/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Context.IO / contextio | [GET](https://context.io/) | 0 | dead_upstream / network_error | unknown | 353 | discovery |
| Continue / continue | [GET](https://docs.continue.dev/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Convex Finance Protocol API / convexfinanceprotocolapi | [GET](https://convex.finance/docs/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://convex.finance/docs) | 408 | discovery |
| Coronavirus in the UK / coronavirusintheuk | [GET](https://coronavirus.data.gov.uk/details/developers-guide/) | 301 | redirect_https / redirect_not_approved | unknown | 121 | discovery |
| Corporate Buzz Words / corporatebuzzwords | [GET](https://github.com/sameerkumar18/corporate-bs-generator-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| CORS Proxy / corsproxy | [GET](https://github.com/burhanuday/cors-proxy/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Cosmos API / cosmosapi | [GET](https://docs.cosmos.network/main/modules/staking/05_client/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Country / country | [GET](https://country.is/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 399 | discovery |
| Country.io / countryio | [GET](https://country.io/) | 200 | wrong_base_url_path / html_instead_of_api | [free](http://country.io) | 139 | discovery |
| Country.io API / countryio | [GET](https://country.io/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Covid-19 / covid19 | [GET](https://github.com/M-Media-Group/Covid-19-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| COVID-19 Data / covid19 | [GET](https://github.com/M-Media-Group/Covid-19-API/) | 0 | duplicate / duplicate | unknown | - | discovery |
| COVID-19 Data API / covid19 | [GET](https://github.com/M-Media-Group/Covid-19-API/) | 0 | duplicate / duplicate | [free](https://github.com/M-Media-Group/Covid-19-API) | - | discovery |
| Covid-19 Live Data / covid19livedata | [GET](https://github.com/mathdroid/covid-19-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Covid-19 Philippines / covid19philippines | [GET](https://github.com/Simperfy/Covid-19-API-Philippines-DOH/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Cross Universe / crossuniverse | [GET](https://crossuniverse.psychpsyo.com/apiDocs.html/) | 522 | dead_upstream / http_error | unknown | 19400 | discovery |
| Crossref Metadata / crossrefmetadata | [GET](https://github.com/CrossRef/rest-api-doc/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Crossref Metadata Search / crossrefmetadata | [GET](https://github.com/CrossRef/rest-api-doc/) | 0 | duplicate / duplicate | unknown | - | discovery |
| CryptAPI / cryptapi | [GET](https://docs.cryptapi.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| ctrip / ctrip | [GET](https://u.ctrip.com/union/help/Termsofuse.aspx/) | 302 | redirect_https / redirect_not_approved | unknown | 1006 | discovery |
| Cupcake Ipsum / cupcakeipsum | [GET](https://www.cupcakeipsum.com/) | 301 | redirect_https / redirect_not_approved | unknown | 147 | discovery |
| Currency-api / currencyapi | [GET](https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json) | 200 | ok / ok_json | [free](https://github.com/fawazahmed0/exchange-api) | 95 | callable |
| Curve Finance Protocol API / curve | [GET](https://api.curve.finance/v1/getETHprice) | 200 | duplicate / duplicate | [free](https://docs.curve.finance/developer/integration/api/curve-api/) | - | alias of curve |
| Czech Television / czechtelevision | [GET](https://www.ceskatelevize.cz/xml/tv-program/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1228 | discovery |
| Dangdang / dangdang | [GET](https://open.dangdang.com/) | 405 | unresolved / http_error | unknown | 803 | discovery |
| Data.gov API / datagovapi | [GET](https://www.data.gov/developers/apis/) | 301 | redirect_https / redirect_not_approved | unknown | 827 | discovery |
| Daum Maps API / daummapsapi | [GET](https://apis.map.daum.net/) | 0 | dead_upstream / network_error | unknown | 4 | discovery |
| Deck of Cards / deckofcards | [GET](https://deckofcardsapi.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 626 | discovery |
| Dehash.lt / dehashlt | [GET](https://github.com/Dehash-lt/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Detox API / detoxapi | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| DeviantArt API / deviantartapi | [GET](https://www.deviantart.com/developers/) | 301 | redirect_https / redirect_not_approved | unknown | 255 | discovery |
| DHL / dhl | [GET](https://www.dhl-usa.com/en/express/resource_center/integrated_shipping_solutions.html/) | 0 | timeout / timeout | unknown | 20000 | discovery |
| Dictum / dictum | [GET](https://github.com/fisenkodv/dictum/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Digimon TCG / digimontcg | [GET](https://documenter.getpostman.com/view/14059948/TzecB4fH/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Disease.sh / diseasesh | [GET](https://disease.sh/v3/covid-19/countries/Sweden?strict=true) | 200 | ok / ok_json | [free](https://disease.sh/docs/) | 115 | callable |
| District of Columbia Open Data / districtofcolumbiaopendata | [GET](https://opendata.dc.gov/pages/using-apis/) | 404 | wrong_base_url_path / http_error | unknown | 722 | discovery |
| Document Cloud / documentcloud | [GET](https://www.documentcloud.org/help/api/) | 301 | redirect_https / redirect_not_approved | unknown | 88 | discovery |
| Dog Facts / dogfacts | - | 0 | commercial_permission / reviewed_exclusion | unknown | 0 | discovery |
| Dog Facts API / dogfactsapi | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Doge-Meme / dogememe | [GET](https://api.doge-meme.lol/docs/) | 0 | dead_upstream / network_error | unknown | 5 | discovery |
| dondeEsta Family / dondeestafamily | [GET](https://docs.dondeesta.apiary.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Dotdigital / dotdigital | [GET](https://developer.dotdigital.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Dune / dune | [GET](https://github.com/ywalia01/dune-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Dune API / dune | [GET](https://github.com/ywalia01/dune-api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Dungeons and Dragons / dungeonsanddragons | [GET](https://www.dnd5eapi.co/docs/) | 302 | redirect_https / redirect_not_approved | unknown | 450 | discovery |
| DWD API / dwdapi | [GET](https://www.dwd.de/DE/leistungen/opendata/opendata.html/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.dwd.de/DE/leistungen/opendata/opendata.html) | 598 | discovery |
| Dyte / dyte | [GET](https://docs.dyte.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Economia.Awesome / economiaawesome | [GET](https://docs.awesomeapi.com.br/api-de-moedas/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Eden AI / edenai | [GET](https://docs.edenai.co/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| elong / elong | [GET](https://open.elong.com/home/index/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 883 | discovery |
| EmailRep / emailrep | [GET](https://docs.emailrep.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| EmojiHub / emojihub | [GET](https://github.com/cheatsnake/emojihub/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| envoice / envoice | [GET](https://www.envoice.in/reference/api/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 183 | discovery |
| Envoy / envoy | [GET](https://developers.envoy.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| EPA / epa | [GET](https://data.epa.gov/dmapservice/sems.envirofacts_site/0:1/json) | 200 | ok / ok_json | [free](https://www.epa.gov/web-policies-and-procedures/epa-disclaimers) | 1714 | callable |
| Ergast F1 / ergastf1 | [GET](https://ergast.com/mrd/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1058 | discovery |
| Ergast Formula 1 / ergastf1 | [GET](https://ergast.com/mrd/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Escape / escape | [GET](https://github.com/polarspetroll/EscapeAPI/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| ESP8266 Sensors API / esp8266sensorsapi | [GET](https://github.com/wouterds/esp8266-nodemcu-sensors/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| ExtendsClass JSON Storage / extendsclassjsonstorage | [GET](https://extendsclass.com/json-storage.html/) | 404 | wrong_base_url_path / http_error | unknown | 334 | discovery |
| EXUDE-API / exudeapi | [GET](https://uttesh.com/exude-api/) | 404 | wrong_base_url_path / http_error | unknown | 202 | discovery |
| Facebook API / facebookapi | [GET](https://developers.facebook.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Facebook Games Services / facebookgamesservices | [GET](https://developers.facebook.com/docs/games/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Facebook Login / facebooklogin | [GET](https://developers.facebook.com/docs/facebook-login/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| FakerAPI / fakerapi-db40a6a8 | [GET](https://fakerapi.it/en/) | 502 | dead_upstream / http_error | unknown | 1109 | discovery |
| FCC API / fccapi | [GET](https://www.fcc.gov/developers/) | 403 | unresolved / access_denied | unknown | 179 | discovery |
| Federal Register API / federalregisterapi | [GET](https://www.federalregister.gov/developers/api/v1/) | 302 | redirect_https / redirect_not_approved | unknown | 549 | discovery |
| Final Space / finalspace | [GET](https://finalspaceapi.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 269 | discovery |
| Final Space API / finalspaceapi | [GET](https://finalspaceapi.com/api/v0/character/1) | 200 | ok / ok_json | [free](https://finalspaceapi.com/docs/) | 1001 | callable |
| FishWatch / fishwatch | [GET](https://www.fishwatch.gov/developers/) | 301 | redirect_https / redirect_not_approved | unknown | 155 | discovery |
| FishWatch API / fishwatch | [GET](https://www.fishwatch.gov/developers/) | 301 | duplicate / duplicate | unknown | - | discovery |
| Fit-n-Bites API / fitnbitesapi | [GET](https://github.com/topics/food-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Flowise / flowise | [GET](https://docs.flowiseai.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| FOAAS / foaas | [GET](https://www.foaas.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 168 | discovery |
| Foam / foam | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| FollowUp.cc / followupcc | [GET](https://docs.followup.cc/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Food Standards Agency / foodstandardsagency | [GET](https://ratings.food.gov.uk/open-data/en-GB/) | 404 | wrong_base_url_path / http_error | unknown | 1157 | discovery |
| Foodish / foodish | [GET](https://github.com/surhud004/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Football Database / footballdatabase | [GET](https://github.com/oritzio/football-database/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Football Standings / footballstandings | [GET](https://github.com/azharimm/football-standings-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Forismatic / forismatic | [GET](https://forismatic.com/en/api/) | 520 | dead_upstream / http_error | unknown | 112 | discovery |
| Fortnox / fortnox | [GET](https://developer.fortnox.se/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Forza / forza | [GET](https://docs.forza-api.tk/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Free Url Shortener / freeurlshortener | [GET](https://ulvis.net/developer.html/) | 404 | wrong_base_url_path / http_error | unknown | 354 | discovery |
| Fruits API / fruitsapi | [GET](https://github.com/Franqsanz/fruits-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Fruits API GraphQL / fruitsapi | [GET](https://github.com/Franqsanz/fruits-api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Gaana / gaana | [GET](https://github.com/cyberboysumanjay/GaanaAPI/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Gaana API / gaana | [GET](https://github.com/cyberboysumanjay/GaanaAPI/) | 0 | duplicate / duplicate | unknown | - | discovery |
| gank.io / gankio | [GET](https://gank.io/api/) | 0 | timeout / timeout | unknown | 10452 | discovery |
| Geek-Jokes / geekjokes | [GET](https://github.com/sameerkumar18/geek-joke-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Gemini / gemini | [GET](https://docs.gemini.com/rest-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Gemini API / gemini | [GET](https://docs.gemini.com/rest-api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Gene Ontology API / geneontologyapi | [GET](https://api.geneontology.org/api/ontology/term/GO%3A0008150) | 200 | ok / ok_json | [free](https://geneontology.org/docs/go-citation-policy/) | 94 | callable |
| GeoApi / geoapi | [GET](https://api.gouv.fr/api/geoapi.html/) | 301 | redirect_https / redirect_not_approved | unknown | 166 | discovery |
| GeoApi France / geoapi | [GET](https://api.gouv.fr/api/geoapi.html/) | 301 | duplicate / duplicate | unknown | - | discovery |
| GeoNames / geonames | [GET](https://www.geonames.org/export/web-services.html/) | 404 | wrong_base_url_path / http_error | unknown | 209 | discovery |
| GitHub Authentication / githubauthentication | [GET](https://developer.github.com/guides/basics-of-authentication/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GitHub Licenses API / githublicensesapi | [GET](https://developer.github.com/v3/licenses/) | 0 | wrong_base_url_path / documentation_url | [free](https://developer.github.com/v3/licenses) | 0 | discovery |
| GitHub ReadMe Stats / githubreadmestats | [GET](https://github.com/anuraghazra/github-readme-stats/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GMX Protocol API / gmxprotocolapi | [GET](https://gmx.finance/docs/) | 0 | timeout / timeout | [free](https://gmx.finance/docs) | 10176 | discovery |
| Google AdSense / googleadsense | [GET](https://developers.google.com/adsense/?hl=en) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Assistant / googleassistant | [GET](https://developers.google.com/actions/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Barcode / googlebarcode | [GET](https://developers.google.com/vision/barcodes-overview?hl=en) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Charts / googlecharts | [GET](https://developers.google.com/chart/interactive/docs/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Cloud Prediction / googlecloudprediction | [GET](https://cloud.google.com/prediction/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2230 | discovery |
| Google CustomSearch API / googlecustomsearchapi | [GET](https://developers.google.com/custom-search/json-api/v1/overview/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Fitness API / googlefitnessapi | [GET](https://developers.google.com/fit/?hl=en) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Fonts API / googlefontsapi | [GET](https://developers.google.com/fonts/?hl=en) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Maps Directions / googlemapsdirections | [GET](https://developers.google.com/maps/documentation/directions/overview/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Play Developer / googleplaydeveloper | [GET](https://developers.google.com/android-publisher/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Google Play Games Services / googleplaygamesservices | [GET](https://developers.google.com/games/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GoTiny / gotiny | [GET](https://github.com/robvanbakel/gotiny-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GovTrack / govtrack | [GET](https://www.govtrack.us/developers/api/) | 403 | unresolved / access_denied | unknown | 173 | discovery |
| Graph Countries / graphcountries | [GET](https://github.com/lennertVanSever/graphcountries/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GraphQL Pokemon / graphqlpokemon | [GET](https://github.com/favware/graphql-pokemon/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GTFS / gtfs | [GET](https://gtfs.org/documentation/) | 403 | unresolved / access_denied | [free](https://gtfs.org/documentation) | 483 | discovery |
| Guerrilla Mail / guerrillamail | [GET](https://www.guerrillamail.com/GuerrillaMailAPI.html/) | 404 | wrong_base_url_path / http_error | unknown | 276 | discovery |
| GurbaniNow / gurbaninow | [GET](https://github.com/GurbaniNow/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| GW2Spidy / gw2spidy | [GET](https://github.com/rubensayshi/gw2spidy/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Hacker News / hackernews | [GET](https://github.com/HackerNews/API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Hacker News API / hackernewsapi | [GET](https://hacker-news.firebaseio.com/v0/item/8863.json) | 200 | ok / ok_json | [free](https://github.com/HackerNews/API) | 401 | callable |
| HackerNews / hackernews | [GET](https://github.com/HackerNews/API/) | 0 | duplicate / duplicate | unknown | - | discovery |
| HaoService / haoservice | [GET](https://www.haoservice.com/) | 0 | dead_upstream / network_error | unknown | 3 | discovery |
| Healthcare.gov / healthcaregov | [GET](https://www.healthcare.gov/accessibility.json) | 200 | ok / ok_json | [free](https://www.healthcare.gov/developers/) | 165 | callable |
| Helium / helium | [GET](https://docs.helium.com/api/blockchain/introduction/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Helium API / helium | [GET](https://docs.helium.com/api/blockchain/introduction/) | 0 | duplicate / duplicate | unknown | - | discovery |
| HERE Routing / hererouting | [GET](https://developer.here.com/documentation/routing-api/dev_guide/index.html/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Home Depot / homedepot | [GET](https://developer.homedepot.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Home8 / home8 | [GET](https://developer.home8systems.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Homey / homey | [GET](https://developers.athom.com/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Hong Kong Obervatory / hongkongobervatory | [GET](https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en) | 200 | ok / ok_json | [free](https://data.gov.hk/en/terms-and-conditions) | 1543 | callable |
| HP Print / hpprint | [GET](https://developers.hp.com/printos/printos/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| HSL / hsl | [GET](https://digitransit.fi/en/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 295 | discovery |
| HTTPCat / httpcat | [GET](https://http.cat/) | 200 | duplicate / duplicate | unknown | - | discovery |
| HTTPDog / httpdog | [GET](https://http.dog/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Hume AI / humeai | [GET](https://dev.hume.ai/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2663 | discovery |
| Hyrule Compendium / hyrulecompendium | [GET](https://github.com/gadhagod/Hyrule-Compendium-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| IBGE / ibge | [GET](https://servicodados.ibge.gov.br/api/docs/) | 0 | redirect_https / tls_error | unknown | 763 | discovery |
| Icelandic APIs / icelandicapis | [GET](https://docs.apis.is/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| iciba / iciba | [GET](https://open.iciba.com/?c=api) | 666 | dead_upstream / http_error | unknown | 744 | discovery |
| iDigBio / idigbio | [GET](https://github.com/idigbio/idigbio-search-api/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| IMDbOT / imdbot | [GET](https://github.com/SpEcHiDe/IMDbOT/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Inbox / inbox | [GET](https://www.inboxapp.com/docs/) | 307 | redirect_https / redirect_not_approved | unknown | 147 | discovery |
| indoona / indoona | [GET](https://developer.indoona.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Indrz / indrz | [GET](https://github.com/indrz/indrz/) | 0 | wrong_base_url_path / documentation_url | [free](https://github.com/indrz/indrz) | 0 | discovery |
| INEGI Mexico Stats / inegimexicostats | [GET](https://www.inegi.org.mx/servicios/api_indicadores.html/) | 406 | unresolved / http_error | unknown | 1051 | discovery |
| INEI / inei | [GET](https://iinei.inei.gob.pe/microdatos/) | 0 | timeout / timeout | unknown | 10361 | discovery |
| Inoreader / inoreader | [GET](https://www.inoreader.com/developers/) | 200 | unresolved / invalid_response | unknown | 212 | discovery |
| INPE Brazil Weather / inpebrazilweather | [GET](https://servicos.cptec.inpe.br/XML/) | 403 | unresolved / access_denied | unknown | 746 | discovery |
| Inshorts News / inshortsnews | [GET](https://github.com/cyberboysumanjay/Inshorts-News-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Inspiration / inspiration | [GET](https://inspiration.goprogram.ai/docs/) | 0 | dead_upstream / network_error | unknown | 2 | discovery |
| inspirehep.net / inspirehepnet | [GET](https://inspirehep.net/api/literature?fields=titles&q=recid%3A4328&size=1) | 200 | ok / ok_json | [free](https://github.com/inspirehep/rest-api-doc) | 309 | callable |
| Instathings Gate / instathingsgate | [GET](https://github.com/Instathings/gate/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Instructor / instructor | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| ip-api / ipapi | [GET](https://ip-api.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 276 | discovery |
| ip-fast.com / ipfastcom | [GET](https://ip-fast.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 277 | discovery |
| IPinfo / ipinfo | [GET](https://ipinfo.io/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1424 | discovery |
| iqiyi / iqiyi | [GET](https://open.iqiyi.com/lib/scheme.html/) | 503 | dead_upstream / http_error | unknown | 1281 | discovery |
| ISTAT Italy / istatitaly | [GET](https://www.istat.it/en/information-and-services/developers/) | 404 | wrong_base_url_path / http_error | unknown | 2116 | discovery |
| Italian ISTAT API / istatitaly | [GET](https://www.istat.it/en/information-and-services/developers/) | 404 | duplicate / duplicate | [free](https://www.istat.it/en/information-and-services/developers) | - | discovery |
| ITIS / itis | [GET](https://www.itis.gov/ITISWebService/jsonservice/getFullRecordFromTSN?tsn=180543) | 200 | ok / ok_json | [free](https://www.itis.gov/privacy.html) | 668 | callable |
| iTunes Search / itunessearch | [GET](https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/) | 0 | dead_upstream / network_error | unknown | 3 | discovery |
| Jandapress API / jandapressapi | [GET](https://github.com/sinkaroid/jandapress/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Japan Post API / japanpostapi | [GET](https://www.post.japanpost.jp/zipcode/download.html/) | 404 | wrong_base_url_path / http_error | unknown | 1655 | discovery |
| JD / jd | [GET](https://jos.jd.com/api/index.htm/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1370 | discovery |
| Jina AI / jinaai | [GET](https://docs.jina.ai/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| JioSaavn / jiosaavn | [GET](https://github.com/cyberboysumanjay/JioSaavnAPI/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| JioSaavn API / jiosaavn | [GET](https://github.com/cyberboysumanjay/JioSaavnAPI/) | 0 | duplicate / duplicate | unknown | - | discovery |
| JMA Japan Weather / jmajapanweather | [GET](https://www.jma.go.jp/jma/en/Activities/apis.html/) | 404 | wrong_base_url_path / http_error | unknown | 863 | discovery |
| join.me / joinme | [GET](https://developer.join.me/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| jsDelivr / jsdelivr | [GET](https://github.com/jsdelivr/data.jsdelivr.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Jservice / jservice | [GET](https://jservice.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 727 | discovery |
| JSON Server / jsonserver | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://github.com/typicode/json-server) | 0 | discovery |
| JSONPlaceholder / jsonplaceholder-c2644e5c | [GET](https://jsonplaceholder.typicode.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 92 | discovery |
| Jupiter Protocol API / jupiterprotocolapi | [GET](https://jupiterag.finance/docs/) | 0 | dead_upstream / network_error | [free](https://jupiterag.finance/docs) | 8 | discovery |
| KaolaFM / kaolafm | [GET](https://github.com/kaolafm/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Keystatic / keystatic | [GET](https://keystatic.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2101 | discovery |
| Kooora Unofficial API / koooraunofficialapi | [GET](https://github.com/n-eq/kooora-unofficial-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| KyberSwap Protocol API / kyberswapprotocolapi | [GET](https://kyberswap.finance/docs/) | 0 | dead_upstream / network_error | [free](https://kyberswap.finance/docs) | 28 | discovery |
| LangSmith / langsmith | [GET](https://docs.smith.langchain.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lanyard / lanyard | [GET](https://github.com/Phineas/lanyard/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| LectServe / lectserve | [GET](https://www.lectserve.com/) | 502 | dead_upstream / http_error | unknown | 1157 | discovery |
| LeTV / letv | [GET](https://www.lecloud.com/zh-cn/help/2016/07/27/150.html?LeftMenu=api_db_guide) | 0 | redirect_https / tls_error | unknown | 126 | discovery |
| LibreTranslate API / libretranslateapi | [GET](https://libretranslate.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 196 | discovery |
| License-API / licenseapi | [GET](https://github.com/cmccandless/license-api/blob/master/README.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lido Protocol API / lidoprotocolapi | [GET](https://eth-api.lido.fi/v1/protocol/steth/apr/sma) | 200 | ok / ok_json | [free](https://docs.lido.fi/integrations/api/) | 80 | callable |
| Lifelog / lifelog | [GET](https://developer.sony.com/develop/services/lifelog-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lingva / lingva | [GET](https://github.com/thedaviddelta/lingva-translate/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Llama.cpp / llamacpp | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Lob / lob | [GET](https://docs.lob.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Localytics / localytics | [GET](https://docs.localytics.com/dev/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lololyrics / lololyrics | [GET](https://api.lololyrics.com/) | 404 | wrong_base_url_path / http_error | unknown | 102 | discovery |
| Lololyrics API / lololyrics | [GET](https://api.lololyrics.com/) | 404 | duplicate / duplicate | unknown | - | discovery |
| Loripsum / loripsum | [GET](https://loripsum.net/) | 0 | dead_upstream / network_error | unknown | 4 | discovery |
| Lowy Asia Power Index / lowyasiapowerindex | [GET](https://github.com/0x0is1/lowy-index-api-docs/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Lucifer Quotes / luciferquotes | [GET](https://github.com/shadowoff09/lucifer-quotes/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Magic The Gathering / magicthegathering | [GET](https://magicthegathering.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 377 | discovery |
| Magic: The Gathering API / magicthegatheringapi | [GET](https://api.magicthegathering.io/v1/cards?pageSize=1) | 200 | ok / ok_json | [free](https://docs.magicthegathering.io/) | 351 | callable |
| mail.gw / mailgw | [GET](https://docs.mail.gw/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| mail.tm / mailtm | [GET](https://docs.mail.tm/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| MakerDAO Protocol API / makerdaoprotocolapi | [GET](https://maker.finance/docs/) | 0 | redirect_https / tls_error | [free](https://maker.finance/docs) | 417 | discovery |
| Makeup / makeup | [GET](https://makeup-api.herokuapp.com/) | 406 | unresolved / http_error | unknown | 480 | discovery |
| Marvin / marvin | [GET](https://www.askmarvin.ai/docs/) | 0 | dead_upstream / network_error | unknown | 6 | discovery |
| MCU Countdown / mcucountdown | [GET](https://github.com/DiljotSG/MCU-Countdown/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| MedlinePlus / medlineplus | [GET](https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=asthma&retmax=1) | 200 | ok / ok_xml | [free](https://medlineplus.gov/about/developers/webservices/) | 107 | callable |
| Meme Maker / mememaker | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Meme Maker API / mememaker | - | 0 | duplicate / duplicate | unknown | - | discovery |
| MeowFacts / meowfacts | [GET](https://meowfacts.herokuapp.com/?count=1) | 200 | ok / ok_json | [free](https://github.com/wh-iterabb-it/meowfacts/blob/main/LICENSE) | 478 | callable |
| MetaMask SDK / metamasksdk | [GET](https://docs.metamask.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Metaphorsum / metaphorsum | [GET](https://metaphorpsum.com/) | 0 | redirect_https / tls_error | unknown | 253 | discovery |
| MeteoSwiss API / meteoswissapi | [GET](https://www.meteoswiss.admin.ch/services-and-publications/service/open-government-data.html/) | 404 | wrong_base_url_path / http_error | unknown | 128 | discovery |
| Metro Lisboa / metrolisboa | [GET](https://app.metrolisboa.pt/status/getLinhas.php/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 318 | discovery |
| Metropolitan Museum of Art / metropolitanmuseumofart | [GET](https://collectionapi.metmuseum.org/public/collection/v1/departments) | 200 | ok / ok_json | [free](https://metmuseum.github.io/) | 613 | callable |
| Mexico / mexico | [GET](https://github.com/IcaliaLabs/sepomex/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Mgnet.me / mgnetme | [GET](https://mgnet.me/api.html/) | 0 | redirect_https / tls_error | unknown | 976 | discovery |
| microBees / microbees | [GET](https://developers.microbees.com/documentation/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Microsoft MRTK / microsoftmrtk | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Milvus / milvus | [GET](https://milvus.io/docs/) | 302 | redirect_https / redirect_not_approved | unknown | 3181 | discovery |
| Minor Planet Center / minorplanetcenter | [GET](https://www.asterank.com/mpc/) | 404 | wrong_base_url_path / http_error | unknown | 192 | discovery |
| MLB Data / mlbdata | [GET](https://statsapi.mlb.com/docs/) | 301 | redirect_https / redirect_not_approved | unknown | 532 | discovery |
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
| Narrative / narrative | [GET](https://open.getnarrative.com/) | 0 | dead_upstream / network_error | unknown | 4 | discovery |
| Narro / narro | [GET](https://docs.narro.co/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| NASA Exoplanet Archive / nasaexoplanetarchive | [GET](https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+top+1+pl_name+from+ps&format=json) | 200 | ok / ok_json | [free](https://exoplanetarchive.ipac.caltech.edu/docs/TAP/usingTAP.html) | 1635 | callable |
| National Bank of Poland / nbppolandapi | [GET](https://api.nbp.pl/api/exchangerates/rates/a/usd/?format=json) | 200 | duplicate / duplicate | [free](https://api.nbp.pl/en.html) | - | alias of nbppolandapi |
| NBA API / nbaapi | [GET](https://github.com/swar/nba_api/) | 0 | wrong_base_url_path / documentation_url | [free](https://github.com/swar/nba_api) | 0 | discovery |
| NBA REST API / nbarestapi | [GET](https://rest.nbaapi.com/index.html/) | 0 | redirect_https / tls_error | unknown | 577 | discovery |
| NekosBest / nekosbest | - | 0 | commercial_permission / reviewed_exclusion | unknown | 0 | discovery |
| NetworkCalc / networkcalc | [GET](https://networkcalc.com/api/binary/10?from=10&to=2) | 200 | ok / ok_json | [free](https://networkcalc.com/) | 203 | callable |
| Neurio / neurio | [GET](https://neur.io/developers/) | 301 | redirect_https / redirect_not_approved | unknown | 239 | discovery |
| NHL Records and Stats / nhlrecordsandstats | [GET](https://gitlab.com/dword4/nhlapi/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Nike+ / nike | [GET](https://developer.nike.com/content/nike-developer-cq/us/en_us/index/documentation/api-docs.html/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| NOAA / usweather | [GET](https://api.weather.gov/points/39.7456,-97.0892) | 200 | duplicate / duplicate | [free](https://www.weather.gov/documentation/services-web-api) | - | alias of usweather |
| Node Deliveroo / nodedeliveroo | [GET](https://github.com/jzarca01/node-deliveroo/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Node UberEats / nodeubereats | [GET](https://github.com/jzarca01/node-ubereats/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Non-Working Days ICS / nonworkingdaysics | [GET](https://github.com/gadael/icsdb/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| npm Registry / npmregistry | [GET](https://registry.npmjs.org/typescript/latest) | 200 | ok / ok_json | [free](https://docs.npmjs.com/policies/terms/) | 113 | callable |
| NPM Registry API / npmregistryapi | [GET](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| NPR / npr | [GET](https://www.npr.org/api/index/) | 0 | timeout / timeout | unknown | 20000 | discovery |
| Ntfy API / ntfyapi | [GET](https://ntfy.sh/docs/) | 302 | redirect_https / redirect_not_approved | unknown | 358 | discovery |
| Numbers / numbers | [GET](https://numbersapi.com/) | 0 | redirect_https / tls_error | unknown | 276 | discovery |
| NWS API / usweather | [GET](https://api.weather.gov/points/39.7456,-97.0892) | 200 | duplicate / duplicate | [free](https://www.weather.gov/documentation/services-web-api) | - | alias of usweather |
| OeNB Austria / oenbaustria | [GET](https://www.oenb.at/Statistik/Standardisierte-Tabellen.html/) | 404 | wrong_base_url_path / http_error | unknown | 426 | discovery |
| Office Ipsum / officeipsum | [GET](https://officeipsum.com/) | 0 | redirect_https / tls_error | unknown | 322 | discovery |
| One Music / onemusic | [GET](https://www.onemusicapi.com/) | 0 | timeout / timeout | unknown | 10143 | discovery |
| Open Collective / opencollective | [GET](https://docs.opencollective.com/help/developers/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Open Government, Canada / opengovernmentcanada | [GET](https://open.canada.ca/data/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://open.canada.ca/data) | 781 | callable |
| Open Government, Ireland / opengovernmentireland | [GET](https://data.gov.ie/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.gov.ie) | 212 | callable |
| Open Government, Romania / opengovernmentromania | [GET](https://data.gov.ro/api/3/action/package_search?rows=1) | 200 | ok / ok_json | [free](https://data.gov.ro) | 1034 | callable |
| Open Government, Switzerland / opengovernmentswitzerland | [GET](https://opendata.swiss/api/3/action/package_search?rows=1) | 200 | unresolved / customer_gateway_failed | [free](https://opendata.swiss) | 192 | discovery |
| Open Library / openlibrary | [GET](https://openlibrary.org/search.json?q=the+hobbit&limit=1) | 200 | ok / ok_json | [free](https://openlibrary.org/developers) | 724 | callable |
| Open Library Books / openlibrary | [GET](https://openlibrary.org/search.json?q=the+hobbit&limit=1) | 200 | duplicate / duplicate | [free](https://openlibrary.org/developers/api) | - | alias of openlibrary |
| Open Library Books API / openlibrary | [GET](https://openlibrary.org/search.json?q=the+hobbit&limit=1) | 200 | duplicate / duplicate | [free](https://openlibrary.org/developers/api) | - | alias of openlibrary |
| Open Notify / opennotify | [GET](https://open-notify.org/Open-Notify-API/) | 0 | redirect_https / tls_error | unknown | 339 | discovery |
| Open Notify ISS / opennotify | [GET](https://open-notify.org/Open-Notify-API/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Open Science Framework / openscienceframework | [GET](https://api.osf.io/v2/nodes/?page%5Bsize%5D=1) | 200 | ok / ok_json | [free](https://developer.osf.io/) | 888 | callable |
| Open Skills / openskills | [GET](https://github.com/workforce-data-initiative/skills-api/wiki/API-Overview/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Open Web Analytics / openwebanalytics | [GET](https://github.com/padams/Open-Web-Analytics/wiki/Data-Access-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Open-Meteo API / openmeteoapi | [GET](https://open-meteo.com/en/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1106 | discovery |
| OpenDota API / opendota | [GET](https://api.opendota.com/api/heroes) | 200 | duplicate / duplicate | [free](https://docs.opendota.com/) | - | alias of opendota |
| OpenFlights / openflights | [GET](https://openflights.org/data.html/) | 404 | wrong_base_url_path / http_error | [free](https://openflights.org/data.html) | 640 | discovery |
| openHAB / openhab | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| openHAB API / openhab | - | 0 | duplicate / duplicate | [free](https://github.com/openhab/openhab1-addons/wiki/REST-API) | - | discovery |
| OpenRates / openrates | [GET](https://www.openrates.io/) | 301 | redirect_https / redirect_not_approved | unknown | 170 | discovery |
| OpenSky Network / openskynetwork | [GET](https://opensky-network.org/apidoc/index.html/) | 404 | wrong_base_url_path / http_error | unknown | 474 | discovery |
| OpenVR / openvr | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Openwhyd / openwhyd | [GET](https://openwhyd.org/hot?format=json&limit=1) | 200 | ok / ok_json | [free](https://openwhyd.github.io/openwhyd/API) | 160 | callable |
| Orca Protocol API / orcaprotocolapi | [GET](https://api.orca.so/v2/solana/pools?size=1) | 200 | ok / ok_json | [free](https://docs.orca.so/api-reference/overview) | 721 | callable |
| Ordoro / ordoro | [GET](https://www.ordoro.com/developers/) | 301 | redirect_https / redirect_not_approved | unknown | 589 | discovery |
| OSRM API / osrmapi | [GET](https://project-osrm.org/docs/v5.24.0/api/) | 200 | wrong_base_url_path / html_instead_of_api | [free](http://project-osrm.org/docs/v5.24.0/api) | 215 | discovery |
| Outstatic / outstatic | [GET](https://outstatic.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1623 | discovery |
| PancakeSwap Protocol API / pancakeswapprotocolapi | [GET](https://pancakeswap.finance/docs/) | 404 | wrong_base_url_path / http_error | [free](https://pancakeswap.finance/docs) | 1507 | discovery |
| Papercup / papercup | [GET](https://www.papercup.com/developers/) | 301 | redirect_https / redirect_not_approved | unknown | 252 | discovery |
| ParaSwap Protocol API / paraswapprotocolapi | [GET](https://paraswap.finance/docs/) | 0 | timeout / timeout | [free](https://paraswap.finance/docs) | 10360 | discovery |
| Parqet Logo API / parqetlogoapi | [GET](https://developers.parqet.com/docs/assets/logos/) | 0 | wrong_base_url_path / documentation_url | [free](https://developers.parqet.com/docs/assets/logos) | 0 | discovery |
| Passwordinator / passwordinator | [GET](https://github.com/fawazsullia/password-generator/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Patents API / patentsapi | [GET](https://developer.uspto.gov/api-catalog/) | 0 | wrong_base_url_path / documentation_url | [free](https://developer.uspto.gov/api-catalog) | 0 | discovery |
| Paymill / paymill | [GET](https://developers.paymill.com/index/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| PayPal Login / paypallogin | [GET](https://developer.paypal.com/docs/integration/direct/identity/log-in-with-paypal/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Payson / payson | [GET](https://developers.payson.se/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Paytm / paytm | [GET](https://paytm.com/business/payments/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1562 | discovery |
| PE Accounting / peaccounting | [GET](https://docs.accounting.pe/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Pelias API / peliasapi | [GET](https://github.com/pelias/documentation/) | 0 | wrong_base_url_path / documentation_url | [free](https://github.com/pelias/documentation) | 0 | discovery |
| PENDAX / pendax | [GET](https://github.com/CompendiumFi/PENDAX-SDK/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Penguin Publishing / penguinpublishing | [GET](https://www.penguinrandomhouse.biz/webservices/rest/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1157 | discovery |
| Phone Specification / phonespecification | [GET](https://github.com/azharimm/phone-specs-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| PhonePe / phonepe | [GET](https://developer.phonepe.com/docs/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Picatic / picatic | [GET](https://developer.picatic.com/?utm_medium=web) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Pinball Map / pinballmap | [GET](https://pinballmap.com/api/v1/docs/) | 200 | unknown_pricing / valid_response_unknown_pricing | unknown | 1230 | discovery |
| Placid / placid | [GET](https://placid.app/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1156 | discovery |
| PoetryDB / poetrydb | [GET](https://poetrydb.org/title/Ozymandias) | 200 | ok / ok_json | [free](https://github.com/thundercomb/poetrydb) | 537 | callable |
| Pokemon TCG / pokemontcg | [GET](https://api.pokemontcg.io/v2/cards/base1-1) | 500 | dead_upstream / http_error | [free](https://docs.pokemontcg.io/) | 1197 | discovery |
| PokéAPI (GraphQL) / pokapigraphql | [GET](https://github.com/mazipan/graphql-pokeapi/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Polly.JS / pollyjs | - | 0 | not_hosted_api / reviewed_exclusion | [free](https://netflix.github.io/pollyjs) | 0 | discovery |
| PostalPinCode / postalpincode | [GET](https://api.postalpincode.in/pincode/110001) | 200 | ok / ok_json | [free](https://www.postalpincode.in/Api-Details) | 891 | callable |
| Postcode.io API / postcodesio | [GET](https://api.postcodes.io/postcodes/SW1A1AA) | 200 | duplicate / duplicate | [free](https://postcodes.io/) | - | alias of postcodesio |
| PostcodeData.nl / postcodedatanl | [GET](https://api.postcodedata.nl/v1/postcode/?postcode=1211EP&streetnumber=60&ref=domeinnaam.nl&type=json) | 0 | dead_upstream / network_error | unknown | 140 | discovery |
| Postmon / postmon | [GET](https://api.postmon.com.br/v1/cep/01001000) | 0 | dead_upstream / network_error | [free](https://postmon.com.br/) | 3 | discovery |
| PRC Exam Schedule / prcexamschedule | [GET](https://api.whenisthenextboardexam.com/docs/) | 0 | dead_upstream / network_error | unknown | 2 | discovery |
| Programming Quotes / programmingquotes | [GET](https://github.com/skolakoda/programming-quotes-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Promptflow / promptflow | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| PurgoMalum / purgomalum | [GET](https://www.purgomalum.com/service/json?text=hello) | 200 | ok / ok_json | [free](https://www.purgomalum.com/) | 523 | callable |
| Puyo Nexus / puyonexus | [GET](https://github.com/deltadex7/puyodb-api-deno/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| QingtingFM / qingtingfm | [GET](https://open.qingting.fm/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 809 | discovery |
| qKast Channel Content / qkastchannelcontent | [GET](https://github.com/egfx/qKast/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| QR code / qrcode | [GET](https://goqr.me/api/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 275 | discovery |
| QR code goqr / qrcode | [GET](https://goqr.me/api/) | 200 | duplicate / duplicate | unknown | - | discovery |
| qunar / qunar | [GET](https://open.qunar.com/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1279 | discovery |
| Quotable / quotable | [GET](https://github.com/lukePeavey/quotable/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Quotable Quotes / quotable | [GET](https://github.com/lukePeavey/quotable/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Quote Garden / quotegarden | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Quran-api / quranapi | [GET](https://github.com/fawazahmed0/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| RainViewer / rainviewer | [GET](https://www.rainviewer.com/api.html/) | 404 | wrong_base_url_path / http_error | unknown | 661 | discovery |
| Random Data API / randomdata | [GET](https://random-data-api.com/api/v2/users?size=1) | 0 | duplicate / duplicate | [free](https://random-data-api.com/documentation) | - | discovery |
| Random User / randomuser-9b425277 | [GET](https://randomuser.me/documentation/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://randomuser.me/documentation) | 186 | discovery |
| Random User API / randomuser-c51bc20a | [GET](https://randomuser.me/api/?results=1&inc=name,nat&noinfo) | 200 | duplicate / duplicate | [free](https://randomuser.me/documentation) | - | alias of randomuser |
| RandomUser API / randomuser-9b425277 | [GET](https://randomuser.me/documentation/) | 200 | duplicate / duplicate | [free](https://randomuser.me/documentation) | - | discovery |
| Ray Serve / rayserve | [GET](https://docs.ray.io/en/latest/serve/) | 0 | wrong_base_url_path / documentation_url | [free](https://docs.ray.io/en/latest/serve) | 0 | discovery |
| Raydium Protocol API / raydiumprotocolapi | [GET](https://api-v3.raydium.io/main/info) | 200 | ok / ok_json | [free](https://github.com/raydium-io/raydium-docs-v1/blob/main/sdk-api/rest-api.mdx) | 363 | callable |
| Razorpay IFSC / razorpayifsc | [GET](https://ifsc.razorpay.com/HDFC0000001) | 200 | ok / ok_json | [free](https://github.com/razorpay/ifsc) | 741 | callable |
| Readme typing SVG / readmetypingsvg | [GET](https://github.com/DenverCoder1/readme-typing-svg/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| RealityKit / realitykit | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Recipe Puppy API / recipepuppyapi | [GET](https://www.recipepuppy.com/about/api/) | 404 | wrong_base_url_path / http_error | unknown | 881 | discovery |
| RecipePuppy / recipepuppy | [GET](https://www.recipepuppy.com/api/) | 404 | wrong_base_url_path / http_error | unknown | 1035 | discovery |
| Recon / recon | [GET](https://www.reconinstruments.com/developers/develop/for-recon-engage/api-documentation/) | 0 | dead_upstream / network_error | unknown | 3 | discovery |
| REFUGE Restrooms / refugerestrooms | [GET](https://www.refugerestrooms.org/api/v1/restrooms?per_page=1) | 200 | ok / ok_json | [free](https://github.com/RefugeRestrooms/refugerestrooms) | 2996 | callable |
| Relevance AI / relevanceai | [GET](https://docs.relevanceai.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Remote Calc / remotecalc | [GET](https://github.com/elizabethadegbaju/remotecalc/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Repetiti / repetiti | [GET](https://developers.repetiti.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Resolve Team / resolveteam | [GET](https://github.com/fearandesire/resolve-team/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| RestCountries / restcountries-e252b887 | [GET](https://restcountries.com/v3.1/all) | 301 | redirect_https / redirect_not_approved | [free](https://restcountries.com) | 76 | discovery |
| Rig Veda / rigveda | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Roku API / rokuapi | [GET](https://developer.roku.com/docs/developer-program/debugging/external-control-api.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Ron Swanson Quotes / ronswansonquotes | [GET](https://ron-swanson-quotes.herokuapp.com/v2/quotes) | 200 | ok / ok_json | [free](https://github.com/jamesseanwright/ron-swanson-quotes) | 453 | callable |
| Russian Calendar / russiancalendar | [GET](https://github.com/egno/work-calendar/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Sakura CardCaptor / sakuracardcaptor | [GET](https://github.com/JessVel/sakura-card-captor-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Salesforce Auth / salesforceauth | [GET](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_authentication.htm/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Scenario / scenario | [GET](https://docs.scenario.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SearchLy / searchly | [GET](https://github.com/AlbertSuarez/searchly/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Semantics3 / semantics3 | [GET](https://docs.semantics3.com/reference/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Seon / seon | [GET](https://docs.seon.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Shadify / shadify | [GET](https://github.com/cheatsnake/shadify/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Shibe Online / shibeonline-07ebe720 | [GET](https://shibe.online/api/shibes?count=1&urls=true&httpsUrls=true) | 0 | redirect_https / tls_error | [free](https://shibe.online/) | 340 | discovery |
| Shibe.Online / shibeonline-07ebe720 | [GET](https://shibe.online/) | 0 | redirect_https / tls_error | unknown | 1242 | discovery |
| Short Link / shortlink | [GET](https://github.com/FayasNoushad/Short-Link-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SHOUTCLOUD / shoutcloud | [GET](https://shoutcloud.io/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 702 | discovery |
| Shrtcode / shrtcode | [GET](https://shrtco.de/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 135 | discovery |
| SLF / slf | [GET](https://github.com/slftool/slftool.github.io/blob/master/API.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SLF Database / slf | [GET](https://github.com/slftool/slftool.github.io/blob/master/API.md/) | 0 | duplicate / duplicate | unknown | - | discovery |
| SLF German Database / slfgermandatabase | [GET](https://github.com/slftool/slftool.github.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Slice / slice | [GET](https://developer.slice.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Sohu TV / sohutv | [GET](https://lm.tv.sohu.com/union/open_platform.do/) | 404 | wrong_base_url_path / http_error | unknown | 1364 | discovery |
| Solana JSON RPC / solanajsonrpc | [GET](https://docs.solana.com/developing/clients/jsonrpc-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Solana JSON-RPC / solanajsonrpc | [GET](https://docs.solana.com/developing/clients/jsonrpc-api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Solana RPC API / solanarpcapi | [GET](https://docs.solana.com/api/) | 0 | wrong_base_url_path / documentation_url | [free](https://docs.solana.com/api) | 0 | discovery |
| Solana Web3.js / solanaweb3js | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Sonar / sonar | [GET](https://github.com/Cgboal/SonarSearch/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| South Park Quotes / southparkquotes | [GET](https://github.com/Thatskat/southpark-quotes-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Spanish INE API / spanishineapi | [GET](https://servicios.ine.es/wstempus/js/ES/OPERACIONES_DISPONIBLES) | 200 | ok / ok_json | [free](https://www.ine.es/datosabiertos/) | 1897 | callable |
| Sport List & Data / sportlistdata | [GET](https://developers.decathlon.com/products/sports/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Sport Places / sportplaces | [GET](https://developers.decathlon.com/products/sport-places/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Sportscaster API / sportscasterapi | [GET](https://github.com/roysti10/sportscaster/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Sportsipy / sportsipy | [GET](https://github.com/roclark/sportsipy/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SSL Labs API / ssllabsapi | - | 0 | commercial_permission / reviewed_exclusion | [free](https://github.com/ssllabs/ssllabs-scan/blob/master/ssllabs-api-docs-v3.md) | 0 | discovery |
| SST / sst | [GET](https://docs.sst.dev/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stack AI / stackai | [GET](https://docs.stack-ai.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stack Lighting / stacklighting | [GET](https://developers.stacklighting.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stamps.com / stampscom | [GET](https://developer.stamps.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| STAPI / stapi | [GET](https://stapi.co/api/v1/rest/season/search?pageSize=1) | 200 | ok / ok_json | [free](https://github.com/cezarykluczynski/stapi) | 338 | callable |
| StatCan Statistics / statcanstatistics | [GET](https://www150.statcan.gc.ca/t1/wds/rest/getFullTableDownloadCSV/17100005/en) | 200 | ok / ok_json | [free](https://www.statcan.gc.ca/en/terms-conditions/open-licence-faq) | 596 | callable |
| StatLine / statline | [GET](https://github.com/amillolive/StatLine/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stats SA / statssa | [GET](https://www.statssa.gov.za/?cat=15) | 302 | redirect_https / redirect_not_approved | unknown | 3345 | discovery |
| Steam / steam | [GET](https://github.com/Revadike/InternalSteamWebAPI/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SteamVR / steamvr | [GET](https://github.com/ValveSoftware/steamvr_unity_plugin/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Steem / steem | [GET](https://developers.steem.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stoicism Quote / stoicismquote | [GET](https://github.com/tlcheah2/stoic-quote-lambda-public-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Stranger Things Quotes / strangerthingsquotes | [GET](https://github.com/shadowoff09/strangerthings-quotes/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| SushiSwap Protocol API / sushiswapprotocolapi | [GET](https://sushiswap.finance/docs/) | 0 | dead_upstream / network_error | [free](https://sushiswap.finance/docs) | 2 | discovery |
| SWAPI / swapi | [GET](https://www.swapi.tech/api/people/1) | 200 | ok / ok_json | [free](https://www.swapi.tech/documentation) | 665 | callable |
| Symbl.ai / symblai | [GET](https://docs.symbl.ai/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Synthetix Protocol API / synthetixprotocolapi | [GET](https://synthetix.finance/docs/) | 301 | redirect_https / redirect_not_approved | [free](https://synthetix.finance/docs) | 236 | discovery |
| TacoFancy / tacofancy | [GET](https://github.com/evz/tacofancy-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| TacoFancy API / tacofancy | [GET](https://github.com/evz/tacofancy-api/) | 0 | duplicate / duplicate | unknown | - | discovery |
| TalkJS / talkjs | [GET](https://talkjs.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 81 | discovery |
| Tanzania Open Data API / tanzaniaopendataapi | [GET](https://opendata.go.tz/) | 0 | dead_upstream / network_error | [free](http://opendata.go.tz) | 3 | discovery |
| Taobao / taobao | [GET](https://open.taobao.com/doc2/api_list.htm/) | 0 | timeout / timeout | unknown | 10461 | discovery |
| TCGdex / tcgdex | [GET](https://api.tcgdex.net/v2/en/sets/base1) | 200 | ok / ok_json | [free](https://tcgdex.dev/) | 257 | callable |
| TeamSnap / teamsnap | [GET](https://developer.teamsnap.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Teleport / teleport | [GET](https://developers.teleport.org/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Tencent Map / tencentmap | [GET](https://lbs.qq.com/webservice_v1/index.html/) | 404 | wrong_base_url_path / http_error | unknown | 1010 | discovery |
| Tencent NLP / tencentnlp | [GET](https://nlp.qq.com/help.cgi/) | 0 | unresolved / network_error | unknown | 6 | discovery |
| The Report of the Week / thereportoftheweek | [GET](https://github.com/andyklimczak/TheReportOfTheWeek-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| They Said So / theysaidso | [GET](https://quotes.rest/qod.json?category=inspire) | 401 | unresolved / access_denied | unknown | 807 | discovery |
| Times Adder / timesadder | [GET](https://github.com/FranP-code/API-Times-Adder/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| ToS;DR API / tosdrapi | [GET](https://api.tosdr.org/service/v3?id=190) | 200 | ok / ok_json | [free](https://docs.tosdr.org/site-policy/tosdr-terms/tosdr.org-terms-of-contribution) | 202 | callable |
| Trace Moe / tracemoe | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| TransitLand / transitland | [GET](https://www.transit.land/documentation/datastore/api-endpoints.html/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 187 | discovery |
| Transitland API / transitlandapi | [GET](https://www.transit.land/documentation/) | 200 | wrong_base_url_path / html_instead_of_api | [free](https://www.transit.land/documentation) | 924 | discovery |
| Transloadit / transloadit | [GET](https://transloadit.com/docs/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 260 | discovery |
| Transport for Atlanta, US / transportforatlantaus | [GET](https://www.itsmarta.com/app-developer-resources.aspx/) | 301 | redirect_https / redirect_not_approved | unknown | 362 | discovery |
| Transport for Belgium / transportforbelgium | [GET](https://api.irail.be/v1/stations?format=json) | 200 | ok / ok_json | [free](https://docs.irail.be/) | 151 | callable |
| Transport for Berlin, Germany / transportforberlingermany | [GET](https://v6.vbb.transport.rest/locations?query=Berlin&results=1) | 200 | ok / ok_json | [free](https://v6.vbb.transport.rest/api.html) | 267 | callable |
| Transport for Denver, US / transportfordenverus | [GET](https://www.rtd-denver.com/gtfs-developer-guide.shtml/) | 404 | wrong_base_url_path / http_error | unknown | 1289 | discovery |
| Transport for Finland / hsl | [GET](https://digitransit.fi/en/developers/) | 200 | duplicate / duplicate | unknown | - | discovery |
| Transport for Grenoble, France / transportforgrenoblefrance | [GET](https://data.mobilites-m.fr/api/lines/json?types=ligne&codes=SEM%3AA) | 200 | ok / ok_json | [free](https://data.mobilites-m.fr/blog/licence-d-utilisation-des-donnees) | 251 | callable |
| Transport for Hessen, Germany / transportforhessengermany | [GET](https://opendata.rmv.de/site/start.html/) | 301 | redirect_https / redirect_not_approved | unknown | 218 | discovery |
| Transport for Los Angeles, US / transportforlosangelesus | [GET](https://developer.metro.net/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Transport for Norway / transportfornorway | [GET](https://developer.entur.org/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Transport for Paris, France / transportforparisfrance | [GET](https://data.ratp.fr/api/v1/console/datasets/1.0/search/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2310 | discovery |
| Transport for Philadelphia, US / transportforphiladelphiaus | [GET](https://www3.septa.org/hackathon/) | 403 | unresolved / access_denied | unknown | 666 | discovery |
| Transport for Spain / transportforspain | [GET](https://data.renfe.com/api/1/util/snippet/api_info.html?resource_id=a2368cff-1562-4dde-8466-9635ea3a572a) | 200 | unresolved / invalid_response | unknown | 232 | discovery |
| Transport for The Netherlands / transportforthenetherlands | [GET](https://github.com/skywave/KV78Turbo-OVAPI/wiki/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Transport for Toronto, Canada / transportfortorontocanada | [GET](https://myttc.ca/developers/) | 406 | unresolved / http_error | unknown | 18851 | discovery |
| Treasury Prime / treasuryprime | [GET](https://docs.treasuryprime.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Trilium / trilium | [GET](https://github.com/zadam/trilium/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| tuniu / tuniu | [GET](https://open.tuniu.cn/) | 200 | unresolved / invalid_response | unknown | 3247 | discovery |
| TVMaze / tvmaze | [GET](https://api.tvmaze.com/shows/1) | 200 | ok / ok_json | [free](https://www.tvmaze.com/api) | 150 | callable |
| Twelve Labs / twelvelabs | [GET](https://docs.twelvelabs.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Typebot / typebot | [GET](https://docs.typebot.io/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| UK Carbon Intensity / ukcarbonintensity | [GET](https://api.carbonintensity.org.uk/intensity) | 200 | ok / ok_json | [free](https://carbon-intensity.github.io/api-definitions/) | 368 | callable |
| UK Parliament API / ukparliamentapi | [GET](https://members-api.parliament.uk/api/Members/Search?skip=0&take=1) | 200 | ok / ok_json | [free](https://developer.parliament.uk/) | 168 | callable |
| UK Police / ukpolice | [GET](https://data.police.uk/api/forces) | 200 | ok / ok_json | [free](https://data.police.uk/docs/) | 290 | callable |
| UK Police API / ukpolice | [GET](https://data.police.uk/api/forces) | 200 | duplicate / duplicate | [free](https://data.police.uk/docs/) | - | alias of ukpolice |
| Ultralytics / ultralytics | [GET](https://docs.ultralytics.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Uniswap / uniswap | [GET](https://docs.uniswap.org/) | 0 | wrong_base_url_path / documentation_url | [free](https://docs.uniswap.org) | 0 | discovery |
| Uniswap API / uniswap | [GET](https://docs.uniswap.org/) | 0 | duplicate / duplicate | [free](https://docs.uniswap.org) | - | discovery |
| Uniswap Protocol API / uniswapprotocolapi | [GET](https://uniswap.finance/docs/) | 0 | dead_upstream / network_error | [free](https://uniswap.finance/docs) | 3 | discovery |
| Unity XR / unityxr | [GET](https://docs.unity3d.com/Packages/com.unity.xr.interaction.toolkit/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Universalis / universalis | [GET](https://universalis.app/api/v2/data-centers) | 200 | ok / ok_json | [free](https://docs.universalis.app/) | 122 | callable |
| Universalis FFXIV / universalis | [GET](https://universalis.app/api/v2/data-centers) | 200 | duplicate / duplicate | [free](https://docs.universalis.app/) | - | alias of universalis |
| Universities List / universitieslist | [GET](https://github.com/Hipo/university-domains-list/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| University Domains / universitieslist | [GET](https://github.com/Hipo/university-domains-list/) | 0 | duplicate / duplicate | unknown | - | discovery |
| Unstructured / unstructured | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| US Weather / usweather | [GET](https://api.weather.gov/points/39.7456,-97.0892) | 200 | ok / ok_json | [free](https://www.weather.gov/documentation/services-web-api) | 117 | callable |
| USA TODAY / usatoday | [GET](https://developer.usatoday.com/docs/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| UUID Generator / uuidgenerator | [GET](https://www.uuidtools.com/api/generate/v4/count/1) | 200 | ok / ok_json | [free](https://www.uuidtools.com/docs) | 186 | callable |
| Valhalla Routing / valhallarouting | - | 0 | gateway_block / unsafe_url | [free](https://valhalla.github.io/valhalla/api) | 0 | discovery |
| VATComply / vatcomply | [GET](https://api.vatcomply.com/rates?base=EUR) | 200 | ok / ok_json | [free](https://www.vatcomply.com/documentation) | 154 | callable |
| VATComply.com / vatcomply | [GET](https://api.vatcomply.com/rates?base=EUR) | 200 | duplicate / duplicate | [free](https://www.vatcomply.com/documentation) | - | alias of vatcomply |
| Vectara / vectara | [GET](https://docs.vectara.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Vector Express / vectorexpress | [GET](https://github.com/smidyo/vectorexpress-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Vedic Society / vedicsociety | - | 0 | gateway_block / unsafe_url | unknown | 0 | discovery |
| Vespa / vespa | [GET](https://docs.vespa.ai/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Viber API / viberapi | [GET](https://developers.viber.com/docs/api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Visma / visma | [GET](https://developer.visma.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| W3C / w3c | [GET](https://github.com/w3c/w3c-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| W3C API / w3c | [GET](https://github.com/w3c/w3c-api/) | 0 | duplicate / duplicate | [free](https://github.com/w3c/w3c-api) | - | discovery |
| Waifu.im / waifuim | [GET](https://waifu.im/docs/) | 301 | redirect_https / redirect_not_approved | unknown | 202 | discovery |
| Waifu.pics / waifupics | [GET](https://waifu.pics/docs/) | 301 | redirect_https / redirect_not_approved | unknown | 642 | discovery |
| WakaTime / wakatime | [GET](https://wakatime.com/developers/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 1438 | discovery |
| Walley / walley | [GET](https://docs.walley.se/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Walltime / walltime | [GET](https://walltime.info/api.html/) | 0 | dead_upstream / network_error | unknown | 333 | discovery |
| Wandbox / wandbox | [GET](https://wandbox.org/api/list.json) | 200 | ok / ok_json | [free](https://github.com/melpon/wandbox) | 135 | callable |
| Weather Unlocked / weatherunlocked | [GET](https://developer.weatherunlocked.com/documentation/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| weather-api / weatherapi | [GET](https://github.com/robertoduessmann/weather-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Web Series Quotes Generator / webseriesquotesgenerator | [GET](https://github.com/yogeshwaran01/web-series-quotes/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Weibo / weibo | [GET](https://open.weibo.com/wiki/API/) | 404 | wrong_base_url_path / http_error | unknown | 1615 | discovery |
| Weibo API / weiboapi | [GET](https://open.weibo.com/wiki/API%E6%96%87%E6%A1%A3/en/) | 404 | wrong_base_url_path / http_error | unknown | 2597 | discovery |
| What The Commit / whatthecommit | [GET](https://whatthecommit.com/index.txt) | 200 | ok / ok_text | [free](https://github.com/ngerakines/commitment) | 456 | callable |
| WhatPulse / whatpulse | [GET](https://developer.whatpulse.org/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| When is next MCU film / whenisnextmcufilm | [GET](https://github.com/DiljotSG/MCU-Countdown/blob/develop/docs/API.md/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Wizard World / wizardworld | [GET](https://wizard-world-api.herokuapp.com/swagger/index.html/) | 404 | wrong_base_url_path / http_error | unknown | 268 | discovery |
| Wizard World API / wizardworld | [GET](https://wizard-world-api.herokuapp.com/swagger/index.html/) | 404 | duplicate / duplicate | unknown | - | discovery |
| World Wonders API / worldwondersapi | [GET](https://github.com/Rolv-Apneseth/world-wonders-api/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| wozhitu / wozhitu | [GET](https://api1.wozhitu.com/) | 0 | dead_upstream / network_error | unknown | 5 | discovery |
| Xively / xively | [GET](https://developer.xively.com/reference/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Yahoo Maps / yahoomaps | [GET](https://developer.yahoo.com/maps/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Yearn Finance Protocol API / yearnfinanceprotocolapi | [GET](https://ydaemon.yearn.fi/1/vaults/0x5f18C75AbDAe578b483E5F43f12a39cF75b973a9) | 200 | ok / ok_json | [free](https://docs.yearn.fi/developers/building-on-yearn) | 363 | callable |
| yeekit / yeekit | [GET](https://api.yeekit.com/) | 0 | dead_upstream / network_error | unknown | 2 | discovery |
| Yeelight / yeelight | [GET](https://www.yeelight.com/en_US/developer/) | 500 | dead_upstream / http_error | unknown | 3137 | discovery |
| Yellow Pages API / yellowpagesapi | [GET](https://github.com/Hrushi11/Yellow-Pages-End-API/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Yo / yo | [GET](https://docs.justyo.co/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Yo Momma Jokes / yomommajokes | [GET](https://github.com/beanboi7/yomomma-apiv2/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Youdao / youdao | [GET](https://fanyi.youdao.com/openapi/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 2013 | discovery |
| Youdao Note / youdaonote | [GET](https://note.youdao.com/open/) | 200 | wrong_base_url_path / html_instead_of_api | unknown | 419 | discovery |
| YouTube API / youtubeapi | [GET](https://developers.google.com/youtube/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Yr.no API / metnorway | [GET](https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75) | 200 | duplicate / duplicate | [free](https://api.met.no/doc/TermsOfService) | - | alias of yr |
| Yu-Gi-Oh! / yugioh-87bf1c6d | [GET](https://db.ygoprodeck.com/api-guide/) | 301 | redirect_https / redirect_not_approved | unknown | 996 | discovery |
| Zetta / zetta | - | 0 | not_hosted_api / reviewed_exclusion | unknown | 0 | discovery |
| Zetta IoT / zetta | - | 0 | duplicate / duplicate | unknown | - | discovery |
| Zettle / zettle | [GET](https://developer.zettle.com/) | 0 | wrong_base_url_path / documentation_url | unknown | 0 | discovery |
| Zippopotam.us / zippopotamus-5d8e78ff | [GET](https://api.zippopotam.us/us/90210) | 200 | ok / ok_json | [free](https://www.zippopotam.us/) | 85 | callable |
| Zippopotamus / zippopotamus-5d8e78ff | [GET](https://www.zippopotam.us/) | 200 | unresolved / invalid_response | unknown | 84 | discovery |
| Zombie Ipsum / zombieipsum | [GET](https://www.zombieipsum.com/) | 0 | redirect_https / tls_error | unknown | 356 | discovery |
| Arbetsförmedlingen API / arbetsfrmedlingenapi | [GET](https://jobsearch.api.jobtechdev.se/search?q=developer&limit=1) | 200 | ok / ok_json | [free](https://jobsearch.api.jobtechdev.se/) | 243 | callable |
| Bluesky / bluesky | [GET](https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=bsky.app) | 200 | ok / ok_json | [free](https://docs.bsky.app/docs/advanced-guides/api-directory) | 263 | callable |
| Crates.io / cratesio | [GET](https://crates.io/api/v1/crates/serde/1.0.228) | 200 | ok / ok_json | [free](https://crates.io/data-access) | 549 | callable |
| Dev.to API / devtoapi | [GET](https://dev.to/api/articles?per_page=1) | 200 | ok / ok_json | [free](https://developers.forem.com/api/v1) | 182 | callable |
| Guild Wars 2 API / guildwars2api | [GET](https://api.guildwars2.com/v2/build) | 200 | ok / ok_json | [free](https://wiki.guildwars2.com/wiki/API:Main) | 199 | callable |
| Hugging Face Hub API / huggingfacehubapi | [GET](https://huggingface.co/api/models?limit=1) | 200 | ok / ok_json | [free](https://huggingface.co/docs/hub/api) | 216 | callable |
| iNaturalist API / inaturalistapi | [GET](https://api.inaturalist.org/v1/taxa?per_page=1) | 200 | ok / ok_json | [free](https://api.inaturalist.org/v1/docs/) | 828 | callable |
| Lichess.org API reference / lichessorgapireference | [GET](https://lichess.org/api/puzzle/daily) | 200 | ok / ok_json | [free](https://lichess.org/api) | 113 | callable |
| UniProt / uniprotapi | [GET](https://rest.uniprot.org/uniprotkb/search?query=accession%3AP69905&format=json&size=1&fields=accession) | 200 | duplicate / duplicate | [free](https://www.uniprot.org/help/license) | - | alias of uniprotapi |
| Norwegian Central Bank / norwegiancentralbank | [GET](https://data.norges-bank.no/api/data/EXR/B.USD.NOK.SP?format=csv&lastNObservations=1) | 200 | ok / ok_csv | [free](https://www.norges-bank.no/en/disclaimer/) | 157 | callable |
| Data.gouv.fr / datagouvfr | [GET](https://www.data.gouv.fr/api/1/datasets/?page_size=1) | 200 | ok / ok_json | [free](https://www.data.gouv.fr/datasets/catalogue-des-donnees-de-data-gouv-fr) | 528 | callable |
| Open Government, Luxembourg / opengovernmentluxembourg | [GET](https://data.public.lu/api/1/datasets/?page_size=1) | 200 | ok / ok_json | [free](https://data.public.lu/en/pages/api-tutorial/) | 637 | callable |
| Open Government, New South Wales / opengovernmentnewsouthwales | [GET](https://data.nsw.gov.au/data/api/3/action/package_search?rows=1&fl=id,name,title,license_id&fq=license_id%3Acc-by) | 200 | ok / ok_json | [free](https://data.nsw.gov.au/data/dataset/collections) | 5381 | callable |
| Austrian Central Bank / austriancentralbank | [GET](https://www.oenb.at/isadataservice/content?lang=en) | 200 | ok / ok_xml | [free](https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.de.html) | 254 | callable |
| Portuguese Central Bank / portuguesecentralbank | [GET](https://bpstat.bportugal.pt/data/v1/domains/29) | 200 | ok / ok_json | [free](https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.de.html) | 1130 | callable |
| Peruvian Central Bank / peruviancentralbank | [GET](https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PN01288PM/json/2016-09/2016-09) | 200 | ok / ok_json | [free](https://estadisticas.bcrp.gob.pe/estadisticas/series/ayuda/condiciones-de-uso) | 728 | callable |
| Europe PMC / europepmc | [GET](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:1&format=json&pageSize=1) | 200 | ok / ok_json | [free](https://www.ebi.ac.uk/about/terms-of-use/) | 276 | callable |
| DataCite API / dataciteapi | [GET](https://api.datacite.org/dois?page%5Bsize%5D=1) | 200 | ok / ok_json | [free](https://support.datacite.org/docs/datacite-data-file-use-policy) | 632 | callable |
| Wikidata / wikidata | [GET](https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q1&props=labels&languages=en&format=json) | 200 | ok / ok_json | [free](https://www.wikidata.org/wiki/Wikidata:Licensing) | 342 | callable |
| Zenodo / zenodo | [GET](https://zenodo.org/api/records?size=1) | 200 | ok / ok_json | [free](https://about.zenodo.org/terms/) | 1380 | callable |
| Figshare / figshare | [GET](https://api.figshare.com/v2/articles?page_size=1) | 200 | ok / ok_json | [free](https://help.figshare.com/article/copyright-and-license-policy) | 709 | callable |
| Bitbucket / bitbucket | [GET](https://api.bitbucket.org/2.0/repositories/atlassian?pagelen=1&fields=values.full_name) | 200 | ok / ok_json | [free](https://developer.atlassian.com/cloud/bitbucket/rest/intro/#authentication) | 325 | callable |
| Color Name API / colornameapi | [GET](https://api.color.pizza/v1/ff0000) | 200 | ok / ok_json | [free](https://github.com/meodai/color-names#api-) | 91 | callable |
| versionhistory.googleapis.com API / chromeversionhistory | [GET](https://versionhistory.googleapis.com/v1/chrome/platforms) | 200 | ok / ok_json | [free](https://developer.chrome.com/docs/web-platform/versionhistory/guide) | 249 | callable |
| StackExchange API / stackexchange | [GET](https://api.stackexchange.com/2.3/info?site=stackoverflow) | 200 | ok / ok_json | [free](https://api.stackexchange.com/docs/throttle) | 244 | callable |
| Swagger Generator / swaggergenerator | [GET](https://generator.swagger.io/api/gen/clients) | 200 | ok / ok_json | [free](https://github.com/swagger-api/swagger-codegen/blob/master/docs/online-generators.md) | 650 | callable |
| Bitbucket API / bitbucket | [GET](https://api.bitbucket.org/2.0/repositories/atlassian?pagelen=1&fields=values.full_name) | 200 | duplicate / duplicate | [free](https://developer.atlassian.com/cloud/bitbucket/rest/) | - | alias of bitbucket |
| Linode API / linodepublic | [GET](https://api.linode.com/v4/regions?page_size=25) | 200 | ok / ok_json | [free](https://techdocs.akamai.com/linode-api/reference/get-regions) | 545 | callable |
| Groundhog Day API / groundhogday | [GET](https://groundhog-day.com/api/v1/groundhogs/punxsutawney-phil) | 200 | ok / ok_json | [free](https://groundhog-day.com/api) | 254 | callable |
| DummyJSON / dummyjson | [GET](https://dummyjson.com/products/1) | 200 | ok / ok_json | [free](https://dummyjson.com/) | 74 | callable |
| restful-api.dev / restfulapidev | [GET](https://api.restful-api.dev/objects/7) | 200 | ok / ok_json | [free](https://restful-api.dev/) | 408 | callable |
| NuGet / nuget | [GET](https://api.nuget.org/v3-flatcontainer/newtonsoft.json/index.json) | 200 | ok / ok_json | [free](https://learn.microsoft.com/en-us/nuget/api/overview) | 371 | callable |
| Mozilla Addons / mozillaaddons | [GET](https://addons.mozilla.org/api/v5/addons/addon/ublock-origin/) | 200 | ok / ok_json | [free](https://mozilla.github.io/addons-server/topics/api/addons) | 392 | callable |
| Mastodon / mastodon | [GET](https://mastodon.social/api/v2/instance) | 200 | ok / ok_json | [free](https://docs.joinmastodon.org/methods/instance/) | 95 | callable |
| Wikimedia / wikimediaanalytics | [GET](https://wikimedia.org/api/rest_v1/metrics/pageviews/aggregate/en.wikipedia/all-access/all-agents/daily/2026100100/2026100100) | 200 | ok / ok_json | [free](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/documentation/access-policy.html) | 177 | callable |
| Affirmations / affirmations | [GET](https://www.affirmations.dev/) | 200 | ok / ok_json | [free](https://github.com/annthurium/affirmations) | 517 | callable |
