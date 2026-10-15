# Callable API audit

Checked: 2026-10-15T14:57:51.605Z.

13 of 1002 public candidates passed. Managed providers are reported separately. A website returning HTML is not a successful API call. Unknown pricing, authentication errors and unverified responses remain discovery only. This sweep makes no requests using provider credentials.

Policy: HTTPS GET; origin pinned; no auth; no redirects; valid JSON; explicit free pricing required. Eight concurrent requests maximum, serialized per origin with a 150 ms delay, eight-second timeout, bounded response reads.

Re-run: `node scripts/audit-callable.mjs`. Each row records the exact tested path. Results reflect this runner and time; preview gateway calls are verified separately in the PR.

## Execution defect

PR #7 unlocked a separate open/no-key registry, but `/v1/execute` still passed those providers through managed quota authorization. The stricter managed action/cost allowlist in #57/#58 made this coupling reject public calls. The 3-provider metric describes managed adapters, not all executable catalog entries. `open:frankfurter` also failed lookup because its prefix was never normalized.

The repair dispatches authenticated public GETs before managed reservations, usage ledger and Stripe. Origin pinning, redirect rejection, response limits and scoped sessions remain enforced. A separate workspace rate limit protects the free rail. The regression test exercises the registered HTTP route with an exhausted managed trial and verifies zero managed ledger operations.

The site total is 13 measured free APIs plus the 3 existing approved managed providers from the [managed audit](managed-api-audit.md). This sweep makes no paid managed requests. The original target of approximately 1,000 is not supported by this candidate inventory. Unknown pricing remains discovery, even when a public URL returns JSON.

## Rechecks

`.github/workflows/callable-recheck.yml` repeats the keyless sweep each Monday and supports manual dispatch after merge. It uploads full evidence and fails visibly when verified membership changes. `node scripts/refresh-callable.mjs` compiles a reviewed result into gateway eligibility, catalog metadata, counts and public docs. The workflow deliberately cannot publish a changed snapshot itself. The audit is a dated measurement, not an uptime guarantee.

| API | Probe | HTTP | Result | Pricing | Latency ms | Callable |
|---|---|---:|---|---|---:|---|
| 0x | [GET](https://0x.org/api/) | 0 | network_error | unknown | 488 | discovery |
| 0x API | [GET](https://0x.org/api/) | 0 | network_error | unknown | 50 | discovery |
| 1Forge.com | [GET](https://1forge.com/) | 200 | not_json | unknown | 498 | discovery |
| 1inch | [GET](https://1inch.io/api/) | 0 | network_error | unknown | 292 | discovery |
| 24 Pull Requests | [GET](https://24pullrequests.com/api/) | 406 | http_error | unknown | 784 | discovery |
| A-Frame | [GET](https://aframe.io/) | 200 | not_json | unknown | 784 | discovery |
| ABS Statistics | [GET](https://api.data.abs.gov.au/) | 0 | network_error | unknown | 126 | discovery |
| adresse.data.gouv.fr | [GET](https://adresse.data.gouv.fr/) | 200 | not_json | unknown | 615 | discovery |
| ADS-B Exchange | [GET](https://www.adsbexchange.com/data/) | 0 | network_error | unknown | 493 | discovery |
| Advice Slip API | [GET](https://api.adviceslip.com/advice) | 200 | ok_json | free | 243 | yes |
| Age of Empires II | [GET](https://age-of-empires-2-api.herokuapp.com/) | 404 | http_error | unknown | 482 | discovery |
| Agify | [GET](https://agify.io/) | 406 | http_error | unknown | 534 | discovery |
| Agify.io | [GET](https://agify.io/) | 406 | http_error | unknown | 117 | discovery |
| Airtel IP | [GET](https://sys.airtel.lv/ip2country/1.1.1.1/?full=true/) | 200 | invalid_response | unknown | 231 | discovery |
| AllStar | [GET](https://openssf.org/) | 200 | not_json | unknown | 150 | discovery |
| Altinn | [GET](https://altinn.no/api/) | 0 | network_error | unknown | 134 | discovery |
| AmiiboAPI | [GET](https://amiiboapi.com/) | 200 | not_json | unknown | 919 | discovery |
| An API of Ice and Fire | [GET](https://anapioficeandfire.com/api/books/1) | 200 | ok_json | free | 188 | yes |
| AnimeNewsNetwork | [GET](https://www.animenewsnetwork.com/encyclopedia/api.php/) | 0 | network_error | unknown | 511 | discovery |
| Anki | [GET](https://apps.ankiweb.net/) | 200 | not_json | free | 232 | discovery |
| Anki API | [GET](https://foosoft.net/projects/anki-connect/) | 404 | http_error | unknown | 259 | discovery |
| AnonFiles | [GET](https://anonfiles.com/docs/api/) | 0 | network_error | unknown | 4 | discovery |
| Anytype | [GET](https://anytype.io/) | 200 | not_json | unknown | 313 | discovery |
| API Grátis | [GET](https://apigratis.com.br/) | 429 | rate_limited | unknown | 269 | discovery |
| API Setu | [GET](https://www.apisetu.gov.in/) | 200 | not_json | unknown | 705 | discovery |
| ApicAgent | [GET](https://www.apicagent.com/) | 200 | not_json | unknown | 620 | discovery |
| apilayer screenshotlayer | [GET](https://screenshotlayer.com/) | 200 | not_json | unknown | 790 | discovery |
| APiX | [GET](https://www.apix.cn/) | 200 | not_json | unknown | 2034 | discovery |
| Apoteket | [GET](https://www.apoteket.se/) | 200 | not_json | unknown | 418 | discovery |
| AppFlowy | [GET](https://appflowy.io/) | 0 | network_error | unknown | 208 | discovery |
| Appium API | [GET](https://appium.io/docs/en/latest/) | 200 | not_json | unknown | 600 | discovery |
| arcsecond.io | [GET](https://api.arcsecond.io/) | 200 | not_json | unknown | 341 | discovery |
| Argentina Open Data API | [GET](https://datos.gob.ar/) | 200 | not_json | free | 1292 | discovery |
| arXiv | [GET](https://arxiv.org/help/api/user-manual/) | 0 | network_error | unknown | 213 | discovery |
| Atlantis | [GET](https://runatlantis.io/) | 0 | network_error | unknown | 623 | discovery |
| Atom | [GET](https://atom.io/) | 0 | network_error | unknown | 558 | discovery |
| Australia Data API | [GET](https://data.gov.au/) | 200 | not_json | free | 166 | discovery |
| Australia Government API | [GET](https://data.gov.au/data/api/) | 200 | ok_json | unknown | 964 | discovery |
| Australian Bureau of Statistics | [GET](https://abs.gov.au/) | 0 | network_error | unknown | 440 | discovery |
| Australian Open Data | [GET](https://data.gov.au/) | 200 | not_json | unknown | 128 | discovery |
| Auth.js | [GET](https://authjs.dev/getting-started/introduction/) | 0 | network_error | unknown | 133 | discovery |
| Automerge | [GET](https://automerge.org/) | 200 | not_json | unknown | 157 | discovery |
| Aviationstack | [GET](https://aviationstack.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers/) | 200 | not_json | unknown | 902 | discovery |
| AviationWeather | [GET](https://www.aviationweather.gov/dataserver/) | 0 | network_error | unknown | 149 | discovery |
| Axolotl | [GET](https://theaxolotlapi.netlify.app/) | 200 | not_json | unknown | 448 | discovery |
| Axolotl API | [GET](https://theaxolotlapi.netlify.app/) | 200 | not_json | unknown | 53 | discovery |
| aztro | [GET](https://aztro.sameerkumar.website/) | 404 | http_error | unknown | 547 | discovery |
| Babylon.js | [GET](https://www.babylonjs.com/) | 200 | not_json | unknown | 174 | discovery |
| Backstage | [GET](https://backstage.io/) | 200 | not_json | unknown | 248 | discovery |
| Bacon Ipsum | [GET](https://baconipsum.com/json-api/) | 200 | not_json | unknown | 697 | discovery |
| BaconMockup | [GET](https://baconmockup.com/) | 200 | not_json | unknown | 604 | discovery |
| Banca d'Italia | [GET](https://www.bancaditalia.it/statistiche/) | 200 | not_json | unknown | 721 | discovery |
| Banco Central Brazil | [GET](https://dadosabertos.bcb.gov.br/) | 200 | not_json | unknown | 5290 | discovery |
| Bandsintown | [GET](https://app.swaggerhub.com/apis/Bandsintown/PublicAPI/3.0.0/) | 404 | http_error | unknown | 490 | discovery |
| Bangladesh Open Data API | [GET](https://data.gov.bd/) | 200 | not_json | free | 859 | discovery |
| Bank Negara Malaysia Open Data | [GET](https://apikijangportal.bnm.gov.my/) | 403 | auth_required | unknown | 151 | discovery |
| Bank of Canada | [GET](https://www.bankofcanada.ca/rates/) | 200 | not_json | unknown | 262 | discovery |
| Bank of Canada Rates | [GET](https://www.bankofcanada.ca/rates/) | 200 | not_json | unknown | 49 | discovery |
| Bank of Israel | [GET](https://www.boi.org.il/en/DataAndStatistics/) | 200 | not_json | unknown | 442 | discovery |
| Bank of Russia | [GET](https://www.cbr.ru/development/SXML/) | 200 | not_json | unknown | 345 | discovery |
| Banque de France | [GET](https://webstat.banque-france.fr/ws/) | 404 | http_error | unknown | 742 | discovery |
| Barcode Generator API | [GET](https://bwipjs-api.metafloor.com/) | 200 | not_json | free | 484 | discovery |
| BayFiles | [GET](https://bayfiles.com/docs/api/) | 0 | network_error | unknown | 3 | discovery |
| BC Ferries | [GET](https://www.bcferriesapi.ca/) | 200 | not_json | unknown | 700 | discovery |
| Beeceptor | [GET](https://beeceptor.com/) | 200 | not_json | unknown | 125 | discovery |
| Beeminder | [GET](https://www.beeminder.com/api/) | 0 | network_error | unknown | 505 | discovery |
| Behance | [GET](https://www.behance.net/dev/api/endpoints/) | 404 | http_error | unknown | 471 | discovery |
| Bhagavad Gita telugu | [GET](https://gita-api.vercel.app/) | 200 | not_json | unknown | 391 | discovery |
| Bible | [GET](https://bible-api.com/) | 200 | not_json | unknown | 567 | discovery |
| Bible API | [GET](https://bible-api.com/) | 200 | not_json | unknown | 229 | discovery |
| Bible API 2 | [GET](https://bible-api.com/) | 200 | not_json | unknown | 220 | discovery |
| Bible API Public | [GET](https://bible-api.com/) | 200 | not_json | unknown | 156 | discovery |
| Bible JSON API | [GET](https://bible-api.com/) | 200 | not_json | unknown | 253 | discovery |
| BigML | [GET](https://bigml.com/api/) | 200 | not_json | unknown | 258 | discovery |
| Billogram | [GET](https://billogram.com/api/) | 0 | network_error | unknown | 299 | discovery |
| Binlist | [GET](https://binlist.net/) | 200 | not_json | unknown | 247 | discovery |
| BioThings | [GET](https://biothings.io/) | 200 | not_json | unknown | 1207 | discovery |
| Biriyani As A Service | [GET](https://biriyani.anoram.com/) | 503 | http_error | unknown | 360 | discovery |
| BitcoinCharts | [GET](https://bitcoincharts.com/about/exchanges/) | 0 | network_error | unknown | 257 | discovery |
| Bitcoincharts API | [GET](https://bitcoincharts.com/about/markets-api/) | 0 | network_error | unknown | 256 | discovery |
| Block.io | [GET](https://block.io/) | 0 | network_error | unknown | 125 | discovery |
| Blockchain Exchange Rates | [GET](https://blockchain.info/api/exchange_rates_api/) | 0 | network_error | unknown | 164 | discovery |
| BNM Moldova Rates | [GET](https://bnm.md/en/content/official-exchange-rates/) | 200 | not_json | unknown | 409 | discovery |
| Board Game Geek | [GET](https://boardgamegeek.com/wiki/page/BGG_XML_API2/) | 403 | auth_required | unknown | 192 | discovery |
| Bob's Burgers | [GET](https://bobs-burgers-api-ui.herokuapp.com/) | 503 | http_error | unknown | 590 | discovery |
| Bokio | [GET](https://www.bokio.se/integrations/) | 404 | http_error | unknown | 416 | discovery |
| BOM Australia Weather | [GET](https://www.bom.gov.au/catalogue/data-feeds.shtml/) | 403 | auth_required | unknown | 110 | discovery |
| Bored | [GET](https://www.boredapi.com/api/activity) | 0 | network_error | unknown | 3 | discovery |
| BoredAPI | [GET](https://www.boredapi.com/api/activity) | 0 | network_error | unknown | 3 | discovery |
| Brackets | [GET](https://brackets.io/) | 200 | not_json | unknown | 248 | discovery |
| Brazil | [GET](https://brasilapi.com.br/) | 200 | not_json | unknown | 188 | discovery |
| Brazil Central Bank Open Data | [GET](https://dadosabertos.bcb.gov.br/) | 200 | not_json | unknown | 323 | discovery |
| Brazil Data API | [GET](https://dados.gov.br/) | 200 | not_json | unknown | 839 | discovery |
| Brazil Open Data API | [GET](https://dados.gov.br/) | 200 | not_json | free | 249 | discovery |
| Brazil Receita WS | [GET](https://www.receitaws.com.br/) | 200 | not_json | unknown | 512 | discovery |
| Brønnøysundregistrene | [GET](https://data.brreg.no/) | 0 | network_error | unknown | 381 | discovery |
| Brreg | [GET](https://data.brreg.no/) | 0 | network_error | unknown | 221 | discovery |
| Buddy CI | [GET](https://buddy.works/api/reference/getting-started/overview/) | 0 | network_error | unknown | 432 | discovery |
| Bugsnax | [GET](https://www.bugsnaxapi.com/) | 0 | network_error | unknown | 8 | discovery |
| Bugzilla | [GET](https://wiki.mozilla.org/Bugzilla:REST_API/) | 404 | http_error | unknown | 471 | discovery |
| Bundesbank API | [GET](https://www.bundesbank.de/dynamic/action/de/statistiken/zeitreihen-datenbanken/) | 404 | http_error | unknown | 263 | discovery |
| Callook.info | [GET](https://callook.info/) | 200 | not_json | unknown | 464 | discovery |
| CamScanner | [GET](https://dev.camscanner.com/?language=en-us/) | 200 | not_json | unknown | 2024 | discovery |
| Canada Government API | [GET](https://open.canada.ca/en/access-our-application-programming-interface-api/) | 0 | network_error | unknown | 806 | discovery |
| Canada Open Data API | [GET](https://open.canada.ca/) | 0 | network_error | free | 210 | discovery |
| Canadian Open Data | [GET](https://open.canada.ca/) | 0 | network_error | unknown | 140 | discovery |
| CapRover | [GET](https://caprover.com/) | 200 | not_json | unknown | 329 | discovery |
| Carbon API | [GET](https://carbon.now.sh/) | 200 | not_json | free | 301 | discovery |
| Cat as a Service | [GET](https://cataas.com/) | 0 | timeout | unknown | 8001 | discovery |
| Cat Facts API | [GET](https://catfact.ninja/fact) | 200 | ok_json | free | 374 | yes |
| Cataas | [GET](https://cataas.com/) | 0 | timeout | unknown | 8002 | discovery |
| Catastro Spain | [GET](https://www.catastro.meh.es/) | 0 | network_error | unknown | 15 | discovery |
| Catboy | [GET](https://catboys.com/api/) | 404 | http_error | unknown | 589 | discovery |
| Catboy API | [GET](https://catboys.com/api/) | 404 | http_error | unknown | 132 | discovery |
| CBE Egypt | [GET](https://www.cbe.org.eg/) | 200 | not_json | unknown | 352 | discovery |
| CBK Kenya | [GET](https://www.centralbank.go.ke/) | 200 | not_json | unknown | 2640 | discovery |
| CBN Nigeria | [GET](https://www.cbn.gov.ng/) | 200 | not_json | unknown | 178 | discovery |
| CBN Nigeria Rates | [GET](https://www.cbn.gov.ng/rates/) | 200 | not_json | unknown | 156 | discovery |
| CBR Russia | [GET](https://cbr.ru/) | 200 | not_json | unknown | 406 | discovery |
| CBR Russia API | [GET](https://www.cbr.ru/development/) | 200 | not_json | unknown | 221 | discovery |
| CBS Netherlands | [GET](https://opendata.cbs.nl/) | 200 | not_json | unknown | 239 | discovery |
| CBUAE UAE | [GET](https://www.centralbank.ae/) | 0 | network_error | unknown | 177 | discovery |
| CDNJS | [GET](https://api.cdnjs.com/libraries/jquery/) | 200 | ok_json | unknown | 214 | discovery |
| Central Bank Ireland Data | [GET](https://data.gov.ie/data/search/) | 0 | network_error | unknown | 302 | discovery |
| Chainlink | [GET](https://chain.link/developer-resources/) | 0 | network_error | unknown | 234 | discovery |
| Chainpoint | [GET](https://tierion.com/chainpoint/) | 200 | not_json | unknown | 800 | discovery |
| Changelogs.md | [GET](https://changelogs.md/) | 0 | network_error | unknown | 665 | discovery |
| CheapShark | [GET](https://www.cheapshark.com/api/) | 0 | network_error | unknown | 145 | discovery |
| ChEBI | [GET](https://ebi.ac.uk/chebi/) | 0 | network_error | unknown | 237 | discovery |
| Chess.com | [GET](https://www.chess.com/news/view/published-data-api/) | 0 | network_error | unknown | 326 | discovery |
| Chess.com API | [GET](https://www.chess.com/news/view/published-data-api/) | 0 | network_error | unknown | 171 | discovery |
| Chicago Data Portal API | [GET](https://data.cityofchicago.org/) | 406 | http_error | unknown | 1552 | discovery |
| Chile Open Data API | [GET](https://datos.gob.cl/) | 200 | not_json | free | 2268 | discovery |
| Chinese Text Project | [GET](https://ctext.org/tools/api/) | 200 | not_json | unknown | 513 | discovery |
| chucknorris.io | [GET](https://api.chucknorris.io/) | 406 | http_error | unknown | 275 | discovery |
| City Bikes | [GET](https://api.citybik.es/v2/) | 200 | not_json | unknown | 202 | discovery |
| City, Berlin | [GET](https://daten.berlin.de/) | 403 | auth_required | unknown | 201 | discovery |
| City, Gdańsk | [GET](https://ckan.multimediagdansk.pl/en/) | 200 | not_json | unknown | 416 | discovery |
| City, Helsinki | [GET](https://hri.fi/en_gb/) | 200 | not_json | unknown | 902 | discovery |
| City, Lviv | [GET](https://opendata.city-adm.lviv.ua/) | 403 | auth_required | unknown | 221 | discovery |
| City, New York Open Data | [GET](https://opendata.cityofnewyork.us/) | 0 | network_error | unknown | 338 | discovery |
| City, Toronto Open Data | [GET](https://open.toronto.ca/) | 200 | not_json | unknown | 845 | discovery |
| Classify | [GET](https://classify-web.herokuapp.com/) | 404 | http_error | unknown | 487 | discovery |
| ClinicalTrials.gov | [GET](https://clinicaltrials.gov/api/) | 200 | ok_json | unknown | 290 | discovery |
| CNMV Spain | [GET](https://www.cnmv.es/) | 0 | network_error | unknown | 375 | discovery |
| CocktailDB API | [GET](https://www.thecocktaildb.com/api.php/) | 200 | not_json | unknown | 222 | discovery |
| CocoaPods | [GET](https://cocoapods.org/) | 200 | not_json | free | 564 | discovery |
| Codeberg | [GET](https://codeberg.org/) | 200 | not_json | unknown | 268 | discovery |
| Codeium | [GET](https://codeium.com/api/) | 0 | network_error | unknown | 146 | discovery |
| Codewars API | [GET](https://dev.codewars.com/) | 200 | not_json | unknown | 379 | discovery |
| Coding | [GET](https://open.coding.net/) | 0 | network_error | unknown | 1135 | discovery |
| Coffee | [GET](https://coffee.alexflipnote.dev/) | 200 | not_json | unknown | 700 | discovery |
| Coffee API | [GET](https://coffee.alexflipnote.dev/) | 200 | not_json | unknown | 141 | discovery |
| CoinDesk | [GET](https://old.coindesk.com/coindesk-api/) | 0 | network_error | unknown | 19 | discovery |
| CoinDesk API | [GET](https://old.coindesk.com/coindesk-api/) | 0 | network_error | unknown | 19 | discovery |
| Coinlore | [GET](https://www.coinlore.com/cryptocurrency-data-api/) | 0 | network_error | unknown | 209 | discovery |
| Coinlore API | [GET](https://www.coinlore.com/cryptocurrency-data-api/) | 0 | network_error | unknown | 52 | discovery |
| Coinpaprika | [GET](https://api.coinpaprika.com/) | 0 | network_error | unknown | 99 | discovery |
| CoinPaprika API | [GET](https://api.coinpaprika.com/) | 0 | network_error | unknown | 25 | discovery |
| CollegeScoreCard | [GET](https://collegescorecard.ed.gov/data/) | 200 | not_json | unknown | 178 | discovery |
| CollegeScoreCard.ed.gov | [GET](https://collegescorecard.ed.gov/data/) | 200 | not_json | unknown | 30 | discovery |
| Colombia Open Data API | [GET](https://www.datos.gov.co/) | 406 | http_error | free | 716 | discovery |
| Color API | [GET](https://www.thecolorapi.com/id?hex=0047AB) | 200 | ok_json | free | 479 | yes |
| Colorado Information Marketplace | [GET](https://data.colorado.gov/) | 406 | http_error | unknown | 730 | discovery |
| Coronavirus | [GET](https://pipedream.com/@pravin/http-api-for-latest-wuhan-coronavirus-data-2019-ncov-p_G6CLVM/readme/) | 200 | not_json | unknown | 606 | discovery |
| Corporate BS | [GET](https://corporatebs-generator.sameerkumar.website/) | 200 | ok_json | unknown | 647 | discovery |
| Cosign | [GET](https://sigstore.dev/) | 0 | network_error | unknown | 208 | discovery |
| CountAPI | [GET](https://countapi.xyz/) | 0 | network_error | unknown | 295 | discovery |
| Countly | [GET](https://api.count.ly/reference/) | 404 | http_error | unknown | 176 | discovery |
| Countries GraphQL | [GET](https://countries.trevorblades.com/) | 204 | not_json | free | 89 | discovery |
| Country Flags API | [GET](https://flagcdn.com/) | 200 | not_json | free | 105 | discovery |
| Country.is | [GET](https://country.is/json) | 404 | http_error | free | 110 | discovery |
| Covid Tracking Project | [GET](https://covidtracking.com/data/api/version-2/) | 200 | not_json | unknown | 127 | discovery |
| Covid-19 Datenhub | [GET](https://npgeo-corona-npgeo-de.hub.arcgis.com/) | 404 | http_error | unknown | 475 | discovery |
| Covid-19 Government Response | [GET](https://covidtracker.bsg.ox.ac.uk/) | 0 | network_error | unknown | 155 | discovery |
| Covid-19 India | [GET](https://data.covid19india.org/) | 200 | not_json | unknown | 436 | discovery |
| Covid-19 JHU CSSE | [GET](https://nuttaphat.com/covid19-api/) | 200 | not_json | unknown | 362 | discovery |
| COVID-19 Tracker Canada | [GET](https://api.covid19tracker.ca/docs/1.0/overview/) | 200 | not_json | unknown | 766 | discovery |
| COVID-19 Tracker Sri Lanka | [GET](https://www.hpb.health.gov.lk/en/api-documentation/) | 0 | network_error | unknown | 497 | discovery |
| COVID-ID | [GET](https://data.covid19.go.id/public/api/prov.json/) | 0 | timeout | unknown | 8002 | discovery |
| Crafatar | [GET](https://crafatar.com/) | 200 | not_json | unknown | 96 | discovery |
| Creatomate | [GET](https://creatomate.com/docs/api/introduction/) | 0 | network_error | unknown | 727 | discovery |
| CrossRef | [GET](https://api.crossref.org/) | 0 | network_error | free | 652 | discovery |
| CryptingUp | [GET](https://www.cryptingup.com/apidoc/) | 0 | network_error | unknown | 486 | discovery |
| CryptoCompare | [GET](https://www.cryptocompare.com/api) | 0 | network_error | unknown | 205 | discovery |
| Cryptonator | [GET](https://www.cryptonator.com/api/) | 0 | network_error | unknown | 276 | discovery |
| Cryptonator API | [GET](https://www.cryptonator.com/api/) | 0 | network_error | unknown | 3 | discovery |
| CurrencyScoop.com | [GET](https://currencyscoop.com/) | 0 | network_error | unknown | 109 | discovery |
| Cursor | [GET](https://cursor.sh/) | 0 | network_error | freemium | 133 | discovery |
| Curve | [GET](https://curve.fi/) | 0 | network_error | unknown | 112 | discovery |
| CVR | [GET](https://datacvr.virk.dk/) | 403 | auth_required | unknown | 130 | discovery |
| CVR API | [GET](https://datacvr.virk.dk/) | 403 | auth_required | free | 169 | discovery |
| Czech Namedays | [GET](https://svatky.adresa.info/) | 402 | http_error | unknown | 288 | discovery |
| Czech Namedays Calendar | [GET](https://svatky.adresa.info/) | 402 | http_error | unknown | 33 | discovery |
| Czech National Bank | [GET](https://www.cnb.cz/cs/financni_trhy/devizovy_trh/kurzy_devizoveho_trhu/denni_kurz.xml/) | 200 | not_json | unknown | 249 | discovery |
| Danbooru | [GET](https://danbooru.donmai.us/posts?tags=help%3Aapi/) | 200 | ok_json | unknown | 310 | discovery |
| Danish data service Energi | [GET](https://www.energidataservice.dk/) | 200 | not_json | unknown | 405 | discovery |
| Danish Energi Data | [GET](https://www.energidataservice.dk/) | 200 | not_json | unknown | 178 | discovery |
| Data USA | [GET](https://datausa.io/about/api/) | 200 | not_json | unknown | 139 | discovery |
| data.gov.dk | [GET](https://data.gov.dk/api/) | 404 | http_error | unknown | 109 | discovery |
| Data.gov.sg | [GET](https://data.gov.sg/developer/) | 0 | network_error | unknown | 936 | discovery |
| data.norge.no | [GET](https://data.norge.no/api/) | 0 | network_error | unknown | 192 | discovery |
| Data.parliament.uk | [GET](https://explore.data.parliament.uk/?learnmore=Members/) | 406 | http_error | unknown | 242 | discovery |
| Dataflow Kit COVID-19 | [GET](https://covid-19.dataflowkit.com/) | 200 | not_json | unknown | 267 | discovery |
| Datamuse | [GET](https://www.datamuse.com/api/) | 200 | not_json | unknown | 498 | discovery |
| Datamuse API | [GET](https://www.datamuse.com/api/) | 200 | not_json | unknown | 240 | discovery |
| Datayes | [GET](https://m.datayes.com/) | 200 | not_json | unknown | 1111 | discovery |
| Deck of Cards API | [GET](https://deckofcardsapi.com/) | 200 | not_json | free | 244 | discovery |
| Deepcode | [GET](https://www.deepcode.ai/) | 0 | network_error | unknown | 798 | discovery |
| DeFiLlama API | [GET](https://defillama.com/docs/api/) | 0 | network_error | free | 238 | discovery |
| Dendron | [GET](https://dendron.so/) | 200 | not_json | unknown | 109 | discovery |
| Destatis API | [GET](https://www-genesis.destatis.de/genesis/online/) | 0 | network_error | unknown | 354 | discovery |
| Destatis Germany | [GET](https://destatis.de/) | 0 | network_error | unknown | 216 | discovery |
| Detect Language API | [GET](https://rapidapi.com/BigLobster/api/language-identification-prediction/) | 0 | network_error | unknown | 294 | discovery |
| DevITjobs UK | [GET](https://devitjobs.uk/job_feed.xml/) | 0 | network_error | unknown | 150 | discovery |
| Devpod | [GET](https://devpod.sh/) | 200 | not_json | unknown | 346 | discovery |
| DIBS | [GET](https://tech.dibspayment.com/) | 0 | network_error | unknown | 46 | discovery |
| Dicebear Avatars | [GET](https://avatars.dicebear.com/) | 0 | network_error | unknown | 230 | discovery |
| DigiDates | [GET](https://digidates.de/en/) | 200 | not_json | unknown | 282 | discovery |
| DigiDates API | [GET](https://digidates.de/en/) | 200 | not_json | free | 69 | discovery |
| Digimon Information | [GET](https://digimon-api.vercel.app/) | 200 | not_json | unknown | 350 | discovery |
| DigitalOcean Spaces | [GET](https://www.digitalocean.com/products/spaces/) | 0 | network_error | unknown | 114 | discovery |
| DigitalOcean Status | [GET](https://status.digitalocean.com/api/) | 406 | http_error | unknown | 446 | discovery |
| Digitraffic Finland | [GET](https://www.digitraffic.fi/) | 200 | not_json | unknown | 105 | discovery |
| Diigo | [GET](https://www.diigo.com/api_dev/) | 200 | not_json | unknown | 863 | discovery |
| Dingtalk | [GET](https://open-doc.dingtalk.com/) | 0 | network_error | unknown | 841 | discovery |
| Disify | [GET](https://www.disify.com/) | 0 | network_error | unknown | 259 | discovery |
| Disney | [GET](https://disneyapi.dev/) | 200 | not_json | unknown | 235 | discovery |
| Disney API | [GET](https://disneyapi.dev/) | 200 | not_json | unknown | 42 | discovery |
| DMI | [GET](https://www.dmi.dk/) | 200 | not_json | unknown | 103 | discovery |
| Dog CEO | [GET](https://dog.ceo/api/breeds/image/random) | 200 | ok_json | unknown | 240 | discovery |
| Dogs | [GET](https://dog.ceo/dog-api/) | 200 | not_json | unknown | 72 | discovery |
| Dogs API | [GET](https://dog.ceo/dog-api/) | 200 | not_json | unknown | 115 | discovery |
| Dokku | [GET](https://dokku.com/) | 200 | not_json | unknown | 613 | discovery |
| DomainDb Info | [GET](https://api.domainsdb.info/) | 200 | ok_json | unknown | 340 | discovery |
| Domainsdb.info | [GET](https://domainsdb.info/) | 200 | not_json | unknown | 314 | discovery |
| Domoticz | [GET](https://domoticz.com/) | 200 | not_json | unknown | 306 | discovery |
| Driver.js | [GET](https://driverjs.com/) | 200 | not_json | unknown | 389 | discovery |
| Drivet URL Shortener | [GET](https://wiki.drivet.xyz/en/url-shortener/add-links/) | 0 | network_error | unknown | 492 | discovery |
| Drizzle ORM | [GET](https://orm.drizzle.team/docs/overview/) | 0 | network_error | unknown | 142 | discovery |
| DropMail | [GET](https://dropmail.me/api/) | 200 | not_json | unknown | 230 | discovery |
| Drupal.org | [GET](https://www.drupal.org/drupalorg/docs/api/) | 0 | network_error | unknown | 859 | discovery |
| DSB Statistics Denmark | [GET](https://api.statbank.dk/v1/) | 404 | http_error | unknown | 241 | discovery |
| DuckDuckGo | [GET](https://duckduckgo.com/api/) | 0 | network_error | unknown | 195 | discovery |
| Ducks Unlimited | [GET](https://gis.ducks.org/datasets/du-university-chapters/api/) | 200 | not_json | unknown | 743 | discovery |
| Dungeons and Dragons (Alternate) | [GET](https://open5e.com/) | 200 | not_json | unknown | 307 | discovery |
| Duolingo API | [GET](https://www.duolingo.com/) | 200 | not_json | unknown | 223 | discovery |
| Dutch CBS API | [GET](https://www.cbs.nl/en-gb/our-services/open-data/) | 200 | not_json | free | 308 | discovery |
| DVC | [GET](https://dvc.org/) | 200 | not_json | free | 121 | discovery |
| Dynamic QR Code | [GET](https://rapidapi.com/updeploy-tools/api/qr-code-dynamic-and-static1/details/) | 0 | network_error | unknown | 218 | discovery |
| ECB API | [GET](https://data.ecb.europa.eu/) | 200 | not_json | free | 867 | discovery |
| ECB Exchange Rates | [GET](https://www.ecb.europa.eu/stats/eurofxref/) | 0 | network_error | free | 218 | discovery |
| Econdb | [GET](https://www.econdb.com/api/) | 200 | ok_json | unknown | 354 | discovery |
| Ecuador Open Data API | [GET](https://datosabiertos.gob.ec/) | 403 | auth_required | free | 1037 | discovery |
| Egypt Open Data API | [GET](https://data.gov.eg/) | 0 | network_error | free | 475 | discovery |
| EnergyStar | [GET](https://energystar.gov/) | 0 | network_error | unknown | 579 | discovery |
| English Random Words | [GET](https://random-words-api.vercel.app/word/) | 200 | ok_json | unknown | 693 | discovery |
| Ensembl | [GET](https://ensembl.org/) | 0 | network_error | unknown | 195 | discovery |
| Ensembl API | [GET](https://rest.ensembl.org/) | 200 | not_json | unknown | 620 | discovery |
| Entur | [GET](https://api.entur.io/) | 404 | http_error | unknown | 234 | discovery |
| Environment Agency | [GET](https://environment.data.gov.uk/) | 200 | not_json | unknown | 422 | discovery |
| Environment Canada API | [GET](https://dd.weather.gc.ca/) | 200 | not_json | free | 479 | discovery |
| EPA API | [GET](https://www.epa.gov/enviro/web-services/) | 0 | network_error | free | 166 | discovery |
| Ergast F1 API | [GET](https://ergast.com/mrd/) | 0 | network_error | free | 216 | discovery |
| ESPN | [GET](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b/) | 404 | http_error | free | 395 | discovery |
| Ethiopia Open Data API | [GET](https://data.gov.et/) | 0 | network_error | free | 12 | discovery |
| EU Data Portal API | [GET](https://data.europa.eu/api/hub/repo/) | 200 | not_json | unknown | 198 | discovery |
| EU Open Data | [GET](https://data.europa.eu/en/) | 0 | network_error | unknown | 130 | discovery |
| EU Open Data Portal | [GET](https://data.europa.eu/en/) | 0 | network_error | free | 15 | discovery |
| EU Open Data Portal API | [GET](https://data.europa.eu/en/publications/dataeuropa-academy/) | 404 | http_error | free | 78 | discovery |
| Euromap 77 | [GET](https://www.euromap.org/euromap77/) | 200 | not_json | unknown | 171 | discovery |
| European Space Agency API | [GET](https://api.esa.int/) | 0 | network_error | free | 5 | discovery |
| European Union | [GET](https://data.europa.eu/api/) | 404 | http_error | unknown | 65 | discovery |
| Eurostat API | [GET](https://ec.europa.eu/eurostat/web/main/data/web-services/) | 200 | not_json | free | 347 | discovery |
| EVA | [GET](https://eva.pingutil.com/) | 0 | network_error | unknown | 4 | discovery |
| EVA Email Validation | [GET](https://eva.pingutil.com/) | 0 | network_error | unknown | 5 | discovery |
| Evil Insult Generator | [GET](https://evilinsult.com/api/) | 200 | not_json | unknown | 154 | discovery |
| Exchangerate.host | [GET](https://exchangerate.host/) | 200 | not_json | unknown | 903 | discovery |
| Excuser | [GET](https://excuser.herokuapp.com/) | 404 | http_error | unknown | 281 | discovery |
| Excuser API | [GET](https://excuser.herokuapp.com/) | 404 | http_error | unknown | 56 | discovery |
| F1 Data | [GET](https://formula1.com/) | 0 | network_error | unknown | 255 | discovery |
| Fabric (Firebase) | [GET](https://firebase.google.com/) | 200 | not_json | unknown | 743 | discovery |
| Faker | [GET](https://fakerapi.it/) | 502 | http_error | unknown | 227 | discovery |
| Faker API | [GET](https://fakerapi.it/) | 502 | http_error | unknown | 128 | discovery |
| FakeStoreAPI | [GET](https://fakestoreapi.com/) | 200 | not_json | unknown | 171 | discovery |
| Falco | [GET](https://falco.org/) | 200 | not_json | unknown | 170 | discovery |
| FAO | [GET](https://fao.org/) | 0 | network_error | unknown | 119 | discovery |
| FAO API | [GET](https://www.fao.org/faostat/en/) | 200 | not_json | free | 275 | discovery |
| FASS | [GET](https://www.fass.se/LIF/developer/) | 0 | network_error | unknown | 183 | discovery |
| FBI Wanted | [GET](https://www.fbi.gov/wanted/api/) | 200 | not_json | unknown | 503 | discovery |
| FDA | [GET](https://open.fda.gov/apis/) | 200 | not_json | free | 382 | discovery |
| FDA API | [GET](https://open.fda.gov/apis/) | 200 | not_json | free | 37 | discovery |
| FDA Drug API | [GET](https://open.fda.gov/apis/drug/) | 200 | not_json | unknown | 291 | discovery |
| FDA Food | [GET](https://api.fda.gov/) | 404 | http_error | unknown | 974 | discovery |
| Fed Treasury | [GET](https://fiscaldata.treasury.gov/api-documentation/) | 200 | not_json | unknown | 1097 | discovery |
| Federal Register | [GET](https://www.federalregister.gov/reader-aids/developer-resources/rest-api/) | 0 | network_error | unknown | 419 | discovery |
| Feodo Tracker API | [GET](https://feodotracker.abuse.ch/) | 200 | not_json | free | 159 | discovery |
| FFXIV Collect | [GET](https://ffxivcollect.com/) | 406 | http_error | unknown | 233 | discovery |
| FIFA Ultimate Team | [GET](https://www.easports.com/fifa/ultimate-team/api/fut/item/) | 503 | http_error | unknown | 194 | discovery |
| FIFA Women's World Cup | [GET](https://worldcup.sfg.io/) | 0 | network_error | unknown | 56 | discovery |
| FIFA World Cup | [GET](https://worldcup.sfg.io/) | 0 | network_error | unknown | 4 | discovery |
| File.io | [GET](https://www.file.io/) | 200 | not_json | unknown | 399 | discovery |
| FilterLists | [GET](https://filterlists.com/) | 200 | not_json | unknown | 685 | discovery |
| Final Fantasy XIV | [GET](https://xivapi.com/) | 0 | network_error | unknown | 180 | discovery |
| Finnish Meteorological Institute | [GET](https://en.ilmatieteenlaitos.fi/open-data/) | 200 | not_json | unknown | 1002 | discovery |
| Fixer | [GET](https://fixer.io/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers/) | 200 | not_json | unknown | 690 | discovery |
| Fleep | [GET](https://fleep.io/fleepapi/) | 200 | not_json | unknown | 229 | discovery |
| Focalboard | [GET](https://focalboard.com/) | 530 | http_error | unknown | 139 | discovery |
| Football (Soccer) Videos | [GET](https://www.scorebat.com/video-api/) | 200 | not_json | unknown | 517 | discovery |
| Forgejo | [GET](https://forgejo.org/) | 200 | not_json | unknown | 250 | discovery |
| France Data API | [GET](https://www.data.gouv.fr/en/) | 0 | network_error | unknown | 298 | discovery |
| Frankfurter | [GET](https://api.frankfurter.dev/v1/latest) | 200 | ok_json | free | 140 | yes |
| Frankfurter API | [GET](https://api.frankfurter.dev/v1/latest) | 200 | duplicate_frankfurter | unknown | 28 | discovery |
| Free Dictionary | [GET](https://dictionaryapi.dev/) | 200 | not_json | unknown | 258 | discovery |
| Free Dictionary API | [GET](https://dictionaryapi.dev/) | 200 | not_json | unknown | 57 | discovery |
| freeCodeCamp | [GET](https://www.freecodecamp.org/) | 200 | not_json | free | 414 | discovery |
| freeCodeCamp API | [GET](https://www.freecodecamp.org/news/the-freecodecamp-api/) | 404 | http_error | unknown | 240 | discovery |
| FreeForexAPI | [GET](https://freeforexapi.com/Home/Api/) | 0 | timeout | unknown | 8001 | discovery |
| FreeToGame | [GET](https://www.freetogame.com/api-doc/) | 200 | not_json | unknown | 197 | discovery |
| French Address Search | [GET](https://geo.api.gouv.fr/adresse/) | 404 | http_error | unknown | 314 | discovery |
| French INSEE API | [GET](https://api.insee.fr/) | 0 | network_error | free | 242 | discovery |
| Fruityvice | [GET](https://www.fruityvice.com/) | 200 | not_json | unknown | 272 | discovery |
| Fuck Off as a Service | [GET](https://www.foaas.com/) | 200 | not_json | unknown | 202 | discovery |
| FuelEconomy.gov | [GET](https://www.fueleconomy.gov/feg/ws/) | 200 | not_json | unknown | 802 | discovery |
| Fun Fact | [GET](https://api.aakhilv.me/) | 200 | not_json | unknown | 416 | discovery |
| Fun Fact API | [GET](https://api.aakhilv.me/) | 200 | not_json | unknown | 244 | discovery |
| Fun Facts | [GET](https://asli-fun-fact-api.herokuapp.com/) | 404 | http_error | unknown | 295 | discovery |
| FunTranslations | [GET](https://api.funtranslations.com/) | 403 | auth_required | unknown | 194 | discovery |
| Game of Thrones Quotes | [GET](https://gameofthronesquotes.xyz/) | 200 | not_json | unknown | 226 | discovery |
| GamerPower | [GET](https://www.gamerpower.com/api-read/) | 0 | network_error | unknown | 190 | discovery |
| GBIF | [GET](https://www.gbif.org/developer/summary/) | 403 | auth_required | unknown | 321 | discovery |
| GBIF API | [GET](https://www.gbif.org/developer/summary/) | 403 | auth_required | unknown | 96 | discovery |
| GDBrowser | [GET](https://gdbrowser.com/api/) | 200 | not_json | unknown | 2482 | discovery |
| GDPR API | [GET](https://gdpr-info.eu/) | 200 | not_json | unknown | 300 | discovery |
| Genderize | [GET](https://genderize.io/) | 406 | http_error | unknown | 535 | discovery |
| Genderize.io | [GET](https://genderize.io/) | 406 | http_error | unknown | 122 | discovery |
| Genrenator | [GET](https://binaryjazz.us/genrenator-api/) | 200 | not_json | unknown | 993 | discovery |
| Genshin Impact | [GET](https://genshin.dev/) | 200 | not_json | unknown | 170 | discovery |
| Genshin Impact API | [GET](https://genshin.dev/) | 200 | not_json | unknown | 84 | discovery |
| Geocode.xyz | [GET](https://geocode.xyz/api/) | 200 | not_json | unknown | 760 | discovery |
| Geodata.gov.gr | [GET](https://geodata.gov.gr/en/) | 0 | network_error | unknown | 257 | discovery |
| GeographQL | [GET](https://geographql.netlify.app/) | 200 | not_json | unknown | 615 | discovery |
| GeoJS | [GET](https://www.geojs.io/) | 200 | not_json | unknown | 650 | discovery |
| Geokeo | [GET](https://geokeo.com/) | 200 | not_json | unknown | 874 | discovery |
| geoPlugin | [GET](https://www.geoplugin.com/) | 200 | not_json | unknown | 777 | discovery |
| Germany Data API | [GET](https://www.govdata.de/) | 200 | not_json | unknown | 536 | discovery |
| Ghana Open Data API | [GET](https://data.gov.gh/) | 0 | network_error | free | 188 | discovery |
| Ghostwriter | [GET](https://ghostwriter.kde.org/) | 200 | not_json | unknown | 302 | discovery |
| Git.io | [GET](https://github.blog/2011-11-10-git-io-github-url-shortener/) | 0 | network_error | unknown | 324 | discovery |
| Gitea | [GET](https://gitea.io/) | 0 | network_error | unknown | 117 | discovery |
| GitHub Contribution Chart Generator | [GET](https://github-contributions.vercel.app/) | 200 | not_json | unknown | 268 | discovery |
| GitHub Contributions | [GET](https://github-contributions.vercel.app/) | 200 | not_json | unknown | 170 | discovery |
| Gogs | [GET](https://gogs.io/) | 0 | network_error | unknown | 264 | discovery |
| Google BigQuery API | [GET](https://cloud.google.com/bigquery/docs/reference/rest/v2/) | 0 | network_error | unknown | 212 | discovery |
| goQR.me | [GET](https://goqr.me/) | 200 | not_json | unknown | 371 | discovery |
| GPT4All | [GET](https://gpt4all.io/) | 0 | network_error | free | 161 | discovery |
| GraphQL Jobs | [GET](https://graphql.jobs/docs/api/) | 0 | network_error | unknown | 2 | discovery |
| Graphs for Coronavirus | [GET](https://corona.dnsforfamily.com/api.txt/) | 0 | network_error | unknown | 2 | discovery |
| Gravatar | [GET](https://en.gravatar.com/) | 0 | network_error | unknown | 593 | discovery |
| Gravatar API | [GET](https://en.gravatar.com/site/implement/) | 0 | network_error | free | 216 | discovery |
| GroupMe | [GET](https://dev.groupme.com/docs/v3/) | 200 | not_json | unknown | 587 | discovery |
| GrünstromIndex | [GET](https://gruenstromindex.de/) | 200 | not_json | unknown | 325 | discovery |
| Grype | [GET](https://anchore.com/) | 200 | not_json | unknown | 923 | discovery |
| GTFS Regional | [GET](https://www.trafiklab.se/api/gtfs-regional/) | 404 | http_error | unknown | 177 | discovery |
| Gutendex | [GET](https://gutendex.com/) | 200 | not_json | unknown | 119 | discovery |
| HAPI FHIR | [GET](https://hapifhir.io/) | 200 | not_json | unknown | 781 | discovery |
| Harry Potter API | [GET](https://hp-api.onrender.com/) | 200 | not_json | free | 145 | discovery |
| Harry Potter Charactes | [GET](https://hp-api.herokuapp.com/) | 404 | http_error | unknown | 499 | discovery |
| Hashable | [GET](https://hashable.space/pages/api/) | 0 | network_error | unknown | 554 | discovery |
| Hashnode | [GET](https://hashnode.com/) | 200 | not_json | unknown | 676 | discovery |
| HealthData.gov | [GET](https://healthdata.gov/) | 406 | http_error | unknown | 865 | discovery |
| Hebrew Calendar | [GET](https://www.hebcal.com/home/developer-apis/) | 0 | network_error | unknown | 493 | discovery |
| Helix | [GET](https://helix-editor.com/) | 200 | not_json | unknown | 167 | discovery |
| HelloSalut | [GET](https://fourtonfish.com/project/hellosalut-api/) | 0 | network_error | unknown | 829 | discovery |
| Hemingway Editor | [GET](https://hemingwayapp.com/) | 200 | not_json | freemium | 572 | discovery |
| heweather | [GET](https://www.heweather.com/documents/) | 404 | http_error | unknown | 444 | discovery |
| Hipster Ipsum | [GET](https://hipsum.co/api/) | 200 | not_json | unknown | 668 | discovery |
| hitokoto | [GET](https://hitokoto.cn/api/) | 0 | network_error | unknown | 2152 | discovery |
| Homebrew | [GET](https://formulae.brew.sh/api/formula/git.json) | 200 | ok_json | free | 234 | yes |
| Hong Kong Data API | [GET](https://data.gov.hk/) | 0 | network_error | free | 752 | discovery |
| Hong Kong GeoData Store | [GET](https://geodata.gov.hk/gs/) | 0 | network_error | unknown | 4 | discovery |
| Hong Kong Open Data API | [GET](https://data.gov.hk/en/) | 200 | not_json | unknown | 243 | discovery |
| host-t.com | [GET](https://host-t.com/) | 0 | network_error | unknown | 687 | discovery |
| HTTP Cat | [GET](https://http.cat/) | 200 | not_json | unknown | 184 | discovery |
| HTTP Dog | [GET](https://http.dog/) | 200 | not_json | unknown | 237 | discovery |
| HTTP2.Pro | [GET](https://http2.pro/doc/api/) | 0 | network_error | unknown | 133 | discovery |
| Httpbin | [GET](https://httpbin.org/) | 200 | not_json | unknown | 643 | discovery |
| httpbin API | [GET](https://httpbin.org/) | 200 | not_json | unknown | 202 | discovery |
| Httpbin Cloudflare | [GET](https://cloudflare-quic.com/b/) | 404 | http_error | unknown | 602 | discovery |
| Human Protein Atlas | [GET](https://www.proteinatlas.org/about/help/dataaccess/) | 0 | network_error | unknown | 179 | discovery |
| Humanitarian Data Exchange | [GET](https://data.humdata.org/) | 200 | not_json | unknown | 1033 | discovery |
| Hytale | [GET](https://hytale-api.com/) | 0 | timeout | unknown | 8002 | discovery |
| Hytale API | [GET](https://hytale-api.com/) | 0 | timeout | unknown | 8074 | discovery |
| IBGE Brazil Stats | [GET](https://servicodados.ibge.gov.br/api/) | 0 | network_error | unknown | 827 | discovery |
| icanhazdadjoke | [GET](https://icanhazdadjoke.com/api/) | 404 | http_error | unknown | 215 | discovery |
| Icanhazepoch | [GET](https://icanhazepoch.com/) | 0 | network_error | unknown | 650 | discovery |
| Icanhazip | [GET](https://major.io/icanhazip-com-faq/) | 200 | not_json | unknown | 198 | discovery |
| Iceland Inspire API | [GET](https://www.lmi.is/is/gagnaveita/) | 0 | network_error | unknown | 257 | discovery |
| Icelandic Met Office | [GET](https://en.vedur.is/about-imo/apis/) | 404 | http_error | unknown | 438 | discovery |
| Icon Horse | [GET](https://icon.horse/) | 200 | not_json | unknown | 447 | discovery |
| Icon Horse API | [GET](https://icon.horse/usage/) | 404 | http_error | unknown | 161 | discovery |
| Icons8 | [GET](https://img.icons8.com/) | 200 | not_json | unknown | 190 | discovery |
| IEA | [GET](https://iea.org/) | 0 | network_error | unknown | 193 | discovery |
| IFTTT | [GET](https://platform.ifttt.com/docs/connect_api/) | 0 | network_error | unknown | 229 | discovery |
| IMD India Weather | [GET](https://mausam.imd.gov.in/) | 200 | not_json | unknown | 1555 | discovery |
| IMF | [GET](https://datahelp.imf.org/knowledgebase/topics/125587/) | 0 | network_error | unknown | 3 | discovery |
| IMF Data API | [GET](https://datahelp.imf.org/knowledgebase/articles/667681/) | 0 | network_error | free | 3 | discovery |
| Imgflip | [GET](https://imgflip.com/api/) | 0 | network_error | unknown | 354 | discovery |
| Imsea | [GET](https://imsea.herokuapp.com/) | 404 | http_error | unknown | 543 | discovery |
| Indian Mutual Fund | [GET](https://www.mfapi.in/) | 200 | not_json | unknown | 750 | discovery |
| Indonesia Dictionary | [GET](https://new-kbbi-api.herokuapp.com/) | 404 | http_error | unknown | 482 | discovery |
| Indonesia Open Data API | [GET](https://data.go.id/) | 200 | not_json | free | 1015 | discovery |
| INSEE France | [GET](https://insee.fr/) | 0 | network_error | unknown | 285 | discovery |
| Instabox | [GET](https://www.instabox.se/) | 0 | network_error | unknown | 101 | discovery |
| Instapaper | [GET](https://www.instapaper.com/api/) | 200 | not_json | unknown | 898 | discovery |
| Interpol Red Notices | [GET](https://interpol.api.bund.dev/) | 200 | not_json | unknown | 291 | discovery |
| Intro.js | [GET](https://introjs.com/) | 200 | not_json | unknown | 300 | discovery |
| IP 2 Country | [GET](https://ip2country.info/) | 200 | not_json | unknown | 274 | discovery |
| IP Address Details | [GET](https://ipinfo.io/) | 200 | ok_json | unknown | 342 | discovery |
| IP Vigilante | [GET](https://www.ipvigilante.com/) | 0 | network_error | unknown | 88 | discovery |
| ipapi.co | [GET](https://ipapi.co/api/) | 200 | not_json | unknown | 1390 | discovery |
| IPGEO | [GET](https://api.techniknews.net/ipgeo/) | 0 | network_error | unknown | 150 | discovery |
| IPify | [GET](https://www.ipify.org/?format=json) | 200 | not_json | unknown | 194 | discovery |
| IRENA | [GET](https://irena.org/) | 0 | network_error | unknown | 251 | discovery |
| ISA-95 | [GET](https://www.isa.org/isa95/) | 0 | network_error | unknown | 607 | discovery |
| isEven | [GET](https://isevenapi.xyz/) | 200 | not_json | unknown | 566 | discovery |
| isEven (humor) | [GET](https://isevenapi.xyz/) | 200 | not_json | unknown | 199 | discovery |
| ISRO | [GET](https://isro.vercel.app/) | 200 | not_json | unknown | 91 | discovery |
| ISRO API | [GET](https://isro.vercel.app/) | 200 | not_json | unknown | 117 | discovery |
| Istanbul (İBB) Open Data | [GET](https://data.ibb.gov.tr/) | 200 | not_json | unknown | 1037 | discovery |
| ItsThisForThat | [GET](https://itsthisforthat.com/api.php/) | 200 | not_json | unknown | 361 | discovery |
| Ivory Coast Data API | [GET](https://data.gouv.ci/) | 200 | not_json | free | 604 | discovery |
| Jan AI | [GET](https://jan.ai/) | 0 | network_error | unknown | 189 | discovery |
| Japan Statistics | [GET](https://stat.go.jp/) | 0 | network_error | unknown | 5 | discovery |
| Jawbone UP | [GET](https://jawbone.com/up/developer/) | 0 | network_error | unknown | 230 | discovery |
| Jikan | [GET](https://jikan.moe/) | 200 | not_json | unknown | 411 | discovery |
| Jikan MyAnimeList | [GET](https://jikan.moe/) | 200 | not_json | unknown | 57 | discovery |
| Jikan MyAnimeList API | [GET](https://jikan.moe/) | 200 | not_json | unknown | 109 | discovery |
| Jina Reader | [GET](https://jina.ai/reader/) | 200 | not_json | unknown | 106 | discovery |
| Jitsi | [GET](https://jitsi.org/) | 200 | not_json | free | 681 | discovery |
| JMA API | [GET](https://www.jma.go.jp/) | 0 | network_error | free | 112 | discovery |
| JokeAPI | [GET](https://sv443.net/jokeapi/v2/) | 200 | not_json | unknown | 319 | discovery |
| Joplin | [GET](https://joplinapp.org/) | 200 | not_json | unknown | 82 | discovery |
| JSON 2 JSONP | [GET](https://json2jsonp.com/) | 200 | not_json | unknown | 198 | discovery |
| JSON Placeholder | [GET](https://jsonplaceholder.typicode.com/todos/1) | 200 | ok_json | free | 169 | yes |
| Juhe Data | [GET](https://www.juhe.cn/) | 200 | not_json | unknown | 2232 | discovery |
| Kadaster Netherlands | [GET](https://www.pdok.nl/) | 200 | not_json | unknown | 419 | discovery |
| Kakoune | [GET](https://kakoune.org/) | 200 | not_json | unknown | 83 | discovery |
| kanye.rest | [GET](https://kanye.rest/) | 200 | not_json | unknown | 133 | discovery |
| Kapiche | [GET](https://www.kapiche.com/api/) | 404 | http_error | unknown | 165 | discovery |
| Kartverket | [GET](https://kartkatalog.geonorge.no/) | 200 | not_json | unknown | 192 | discovery |
| Kenya Open Data API | [GET](https://opendata.go.ke/) | 0 | timeout | free | 8002 | discovery |
| Kickbox | [GET](https://open.kickbox.com/) | 200 | not_json | unknown | 757 | discovery |
| kimiquotes | [GET](https://kimiquotes.herokuapp.com/doc/) | 404 | http_error | unknown | 402 | discovery |
| KNBS Kenya Stats | [GET](https://www.knbs.or.ke/) | 0 | network_error | unknown | 435 | discovery |
| KNX | [GET](https://www.knx.org/) | 200 | not_json | unknown | 381 | discovery |
| KONTESTS | [GET](https://kontests.net/api/) | 0 | network_error | unknown | 6 | discovery |
| Korean Statistics | [GET](https://kostat.go.kr/) | 0 | network_error | unknown | 952 | discovery |
| Kroki | [GET](https://kroki.io/health) | 200 | ok_json | unknown | 211 | discovery |
| Kube-bench | [GET](https://aquasec.com/) | 0 | network_error | unknown | 311 | discovery |
| Kubeflow | [GET](https://kubeflow.org/) | 0 | network_error | unknown | 589 | discovery |
| Kubescape | [GET](https://kubescape.io/) | 200 | not_json | unknown | 321 | discovery |
| LA Open Data API | [GET](https://data.lacity.org/) | 406 | http_error | unknown | 2202 | discovery |
| Lantmäteriet | [GET](https://www.lantmateriet.se/sv/Om-Lantmateriet/Oppna-data/) | 404 | http_error | unknown | 235 | discovery |
| Lapce | [GET](https://lapce.dev/) | 0 | network_error | unknown | 142 | discovery |
| LAPIS | [GET](https://cov-spectrum.ethz.ch/public/) | 0 | network_error | unknown | 115 | discovery |
| Laravel China | [GET](https://laravel-china.org/topics/3097/) | 0 | timeout | unknown | 8006 | discovery |
| Launch Library | [GET](https://thespacedevs.com/) | 200 | not_json | unknown | 788 | discovery |
| Launch Library 2 | [GET](https://thespacedevs.com/llapi/) | 200 | not_json | unknown | 349 | discovery |
| Leaflet | [GET](https://leafletjs.com/) | 200 | not_json | free | 114 | discovery |
| Lido | [GET](https://lido.fi/) | 200 | not_json | unknown | 285 | discovery |
| LightwaveRF | [GET](https://api.lightwaverf.com/) | 0 | network_error | unknown | 203 | discovery |
| LM Studio | [GET](https://lmstudio.ai/) | 200 | not_json | unknown | 629 | discovery |
| Lobsters API | [GET](https://lobste.rs/newest.json) | 200 | ok_json | free | 375 | yes |
| LocalAI | [GET](https://localai.io/) | 200 | not_json | free | 76 | discovery |
| Localbitcoins | [GET](https://localbitcoins.com/api-docs/) | 404 | http_error | unknown | 336 | discovery |
| Logseq | [GET](https://logseq.com/) | 200 | not_json | free | 115 | discovery |
| LonWorks | [GET](https://www.echelon.com/) | 0 | network_error | unknown | 1200 | discovery |
| LoRaWAN | [GET](https://lora-alliance.org/) | 200 | not_json | unknown | 130 | discovery |
| Lordicon | [GET](https://lordicon.com/) | 200 | not_json | unknown | 380 | discovery |
| Lorem Ipsum | [GET](https://loremipsum.io/api/) | 404 | http_error | free | 532 | discovery |
| Lorem Ipsum API | [GET](https://loripsum.net/) | 0 | network_error | free | 3 | discovery |
| Lorem Picsum | [GET](https://picsum.photos/) | 200 | not_json | unknown | 344 | discovery |
| Lorem Space | [GET](https://lorem.space/api/) | 0 | network_error | unknown | 1083 | discovery |
| Lua Decompiler | [GET](https://lua-decompiler.ferib.dev/) | 0 | network_error | unknown | 2 | discovery |
| Luchtmeetnet | [GET](https://api-docs.luchtmeetnet.nl/) | 200 | ok_json | unknown | 654 | discovery |
| Lucia Auth | [GET](https://lucia-auth.com/) | 200 | not_json | unknown | 255 | discovery |
| Lyrics.ovh | [GET](https://lyricsovh.docs.apiary.io/) | 502 | http_error | unknown | 234 | discovery |
| MailCheck.ai | [GET](https://www.mailcheck.ai/) | 0 | network_error | unknown | 155 | discovery |
| Malaysia Open Data API | [GET](https://data.gov.my/) | 200 | not_json | free | 260 | discovery |
| Mark Text | [GET](https://marktext.app/) | 200 | not_json | unknown | 845 | discovery |
| markerapi | [GET](https://markerapi.com/) | 521 | http_error | unknown | 190 | discovery |
| Marketstack | [GET](https://marketstack.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers/) | 200 | not_json | unknown | 662 | discovery |
| Maven Central | [GET](https://search.maven.org/) | 200 | not_json | free | 109 | discovery |
| MealDB API | [GET](https://www.themealdb.com/api.php/) | 200 | not_json | unknown | 346 | discovery |
| Mempool | [GET](https://mempool.space/api/) | 0 | network_error | unknown | 197 | discovery |
| Mempool API | [GET](https://mempool.space/api/) | 0 | network_error | unknown | 61 | discovery |
| MercadoBitcoin | [GET](https://www.mercadobitcoin.com.br/api-doc/) | 404 | http_error | unknown | 281 | discovery |
| Messari | [GET](https://messari.io/api/) | 429 | rate_limited | unknown | 98 | discovery |
| Messari API | [GET](https://messari.io/api/) | 429 | rate_limited | unknown | 53 | discovery |
| MET Norway | [GET](https://api.met.no/) | 200 | not_json | unknown | 209 | discovery |
| Metabase | [GET](https://www.metabase.com/) | 200 | not_json | unknown | 117 | discovery |
| MetaWeather | [GET](https://www.metaweather.com/api/) | 0 | network_error | unknown | 3 | discovery |
| Meteoam Italy | [GET](https://www.meteoam.it/) | 0 | network_error | unknown | 372 | discovery |
| Mexico Open Data API | [GET](https://datos.gob.mx/) | 403 | auth_required | free | 94 | discovery |
| MicroENV | [GET](https://microenv.com/) | 0 | network_error | unknown | 175 | discovery |
| Microlink.io | [GET](https://microlink.io/) | 200 | not_json | unknown | 466 | discovery |
| Microsoft Graph OneDrive | [GET](https://graph.microsoft.io/en-us/docs/api-reference/v1.0/resources/onedrive/) | 0 | network_error | unknown | 647 | discovery |
| Microsoft Security Response Center (MSRC) | [GET](https://msrc.microsoft.com/report/developer/) | 200 | not_json | unknown | 434 | discovery |
| Minecraft Server Status | [GET](https://api.mcsrvstat.us/) | 200 | not_json | unknown | 109 | discovery |
| Mineral Database API | [GET](https://www.mindat.org/api.php/) | 403 | auth_required | unknown | 127 | discovery |
| Mirage JS | [GET](https://miragejs.com/) | 200 | not_json | free | 1100 | discovery |
| Mirror Networking | [GET](https://mirror-networking.com/) | 200 | not_json | unknown | 1367 | discovery |
| Misfit | [GET](https://build.misfit.com/) | 0 | network_error | unknown | 998 | discovery |
| MLB API | [GET](https://statsapi.mlb.com/) | 200 | not_json | unknown | 1263 | discovery |
| MLB Data API | [GET](https://statsapi.mlb.com/api/v1/sports) | 200 | ok_json | free | 240 | yes |
| MLB StatsAPI | [GET](https://statsapi.mlb.com/api/) | 404 | http_error | unknown | 148 | discovery |
| MMO Games | [GET](https://www.mmobomb.com/api/) | 403 | auth_required | unknown | 118 | discovery |
| Mockoon | [GET](https://mockoon.com/) | 200 | not_json | free | 133 | discovery |
| Mocky | [GET](https://designer.mocky.io/) | 0 | network_error | unknown | 156 | discovery |
| Mojio | [GET](https://www.moj.io/developer/) | 200 | not_json | unknown | 276 | discovery |
| Moodle | [GET](https://moodle.org/) | 403 | auth_required | unknown | 258 | discovery |
| Moon Phase API | [GET](https://www.farmsense.net/api/astro-widgets/) | 200 | not_json | unknown | 1670 | discovery |
| Morocco Open Data API | [GET](https://data.gov.ma/) | 200 | not_json | free | 1242 | discovery |
| Motivational Quotes | [GET](https://nodejs-quoteapp.herokuapp.com/) | 404 | http_error | unknown | 1260 | discovery |
| MovieGlu | [GET](https://www.movieglu.com/) | 0 | network_error | unknown | 1571 | discovery |
| MSW | [GET](https://mswjs.io/) | 200 | not_json | free | 206 | discovery |
| MTConnect | [GET](https://www.mtconnect.org/) | 200 | not_json | unknown | 1082 | discovery |
| MusicBrainz | [GET](https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2/) | 0 | network_error | unknown | 484 | discovery |
| My Anime List API | [GET](https://jikan.moe/) | 200 | not_json | unknown | 788 | discovery |
| MY IP | [GET](https://www.myip.com/api-docs/) | 200 | not_json | unknown | 665 | discovery |
| MY IP API | [GET](https://www.myip.com/api-docs/) | 200 | not_json | unknown | 231 | discovery |
| myStrom | [GET](https://mystrom.ch/de/mystrom-api/) | 404 | http_error | unknown | 1673 | discovery |
| myStrom API | [GET](https://mystrom.ch/de/mystrom-api/) | 404 | http_error | free | 566 | discovery |
| Nager Date | [GET](https://date.nager.at/) | 0 | network_error | unknown | 956 | discovery |
| Nager.Date API | [GET](https://date.nager.at/Api/) | 0 | network_error | free | 87 | discovery |
| Namedays Calendar | [GET](https://nameday.abalin.net/) | 200 | not_json | unknown | 1118 | discovery |
| NASA EONET | [GET](https://eonet.gsfc.nasa.gov/docs/v3/) | 0 | network_error | unknown | 1362 | discovery |
| NASA POWER API | [GET](https://power.larc.nasa.gov/docs/services/api/) | 200 | not_json | unknown | 238 | discovery |
| National Grid ESO | [GET](https://data.nationalgrideso.com/) | 0 | network_error | unknown | 31 | discovery |
| National Vulnerability Database | [GET](https://nvd.nist.gov/vuln/Data-Feeds/JSON-feed-changelog/) | 0 | network_error | unknown | 644 | discovery |
| Nationalize | [GET](https://nationalize.io/) | 406 | http_error | unknown | 592 | discovery |
| Nationalize.io | [GET](https://nationalize.io/) | 406 | http_error | unknown | 127 | discovery |
| NBA Stats | [GET](https://any-api.com/nba_com/nba_com/docs/API_Description/) | 0 | network_error | unknown | 155 | discovery |
| NBB Belgium | [GET](https://www.nbb.be/en/statistics/) | 0 | network_error | unknown | 324 | discovery |
| NBP Poland API | [GET](https://api.nbp.pl/) | 406 | http_error | unknown | 349 | discovery |
| NBS China | [GET](https://stats.gov.cn/) | 0 | network_error | unknown | 41 | discovery |
| NBS Nigeria Stats | [GET](https://nigerianstat.gov.ng/) | 0 | timeout | unknown | 8002 | discovery |
| NBU Ukraine API | [GET](https://bank.gov.ua/control/en/publish/article/) | 0 | network_error | unknown | 408 | discovery |
| NemID | [GET](https://www.nets.eu/developer/) | 200 | not_json | unknown | 1257 | discovery |
| Neovim | [GET](https://neovim.io/) | 200 | not_json | unknown | 197 | discovery |
| Netherlands Data API | [GET](https://data.overheid.nl/) | 200 | not_json | unknown | 645 | discovery |
| Newsblur | [GET](https://newsblur.com/api/) | 200 | not_json | unknown | 449 | discovery |
| Newton | [GET](https://newton.vercel.app/) | 200 | not_json | unknown | 375 | discovery |
| Newton Math | [GET](https://newton.vercel.app/) | 200 | not_json | unknown | 28 | discovery |
| Newton Math API | [GET](https://newton.vercel.app/) | 200 | not_json | unknown | 167 | discovery |
| Nexchange | [GET](https://nexchange2.docs.apiary.io/) | 200 | not_json | unknown | 440 | discovery |
| NHL API | [GET](https://api-web.nhle.com/v1/) | 404 | http_error | unknown | 214 | discovery |
| NHTSA | [GET](https://vpic.nhtsa.dot.gov/api/) | 200 | not_json | unknown | 366 | discovery |
| Nick Cannon Baby API | [GET](https://nick-cannon-baby-api.onrender.com/) | 200 | not_json | free | 296 | discovery |
| Nigeria Open Data API | [GET](https://nigerianstat.gov.ng/) | 0 | timeout | free | 8001 | discovery |
| NIST Chemistry WebBook | [GET](https://webbook.nist.gov/) | 406 | http_error | unknown | 672 | discovery |
| NMBS/SNCB Belgium | [GET](https://www.belgiantrain.be/en/travel-info/preparing-for-your-journey/use-data/) | 403 | auth_required | unknown | 103 | discovery |
| Nobel Prize | [GET](https://www.nobelprize.org/about/developer-zone-2/) | 200 | not_json | unknown | 225 | discovery |
| Nobel Prize API | [GET](https://www.nobelprize.org/about/developer-zone-2/) | 200 | not_json | unknown | 61 | discovery |
| Noctua | [GET](https://api.noctuasky.com/api/v1/swaggerdoc/) | 404 | http_error | unknown | 500 | discovery |
| Node-RED | [GET](https://nodered.org/) | 200 | not_json | unknown | 136 | discovery |
| Nominatim | [GET](https://nominatim.org/release-docs/latest/api/Overview/) | 200 | not_json | unknown | 341 | discovery |
| Nominatim API | [GET](https://nominatim.org/release-docs/latest/api/Overview/) | 200 | not_json | unknown | 53 | discovery |
| Non-Working Days | [GET](https://isdayoff.ru/) | 0 | network_error | unknown | 1116 | discovery |
| Non-Working Days 2 | [GET](https://isdayoff.ru/) | 0 | network_error | unknown | 301 | discovery |
| Norwegian MET Weather | [GET](https://api.met.no/) | 200 | not_json | unknown | 132 | discovery |
| Notation | [GET](https://notaryproject.dev/) | 200 | not_json | unknown | 244 | discovery |
| Notifee API | [GET](https://notifee.app/) | 200 | not_json | unknown | 700 | discovery |
| NPPES | [GET](https://npiregistry.cms.hhs.gov/registry/help-api/) | 200 | not_json | unknown | 572 | discovery |
| Numverify | [GET](https://numverify.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers/) | 200 | not_json | unknown | 1143 | discovery |
| NYC Open Data API | [GET](https://opendata.cityofnewyork.us/) | 0 | network_error | unknown | 529 | discovery |
| NZ Open Data API | [GET](https://data.govt.nz/) | 200 | not_json | free | 117 | discovery |
| Obsidian | [GET](https://obsidian.md/) | 200 | not_json | freemium | 154 | discovery |
| Ocean Biogeographic | [GET](https://obis.org/) | 200 | not_json | unknown | 284 | discovery |
| Ocean Facts | [GET](https://oceanfacts.herokuapp.com/) | 404 | http_error | unknown | 288 | discovery |
| OceanCurrent | [GET](https://imos.org.au/facilities/oceandata/) | 404 | http_error | unknown | 2208 | discovery |
| Oddsmagnet | [GET](https://data.oddsmagnet.com/) | 0 | network_error | unknown | 290 | discovery |
| OECD | [GET](https://data.oecd.org/) | 403 | auth_required | free | 99 | discovery |
| OECD API | [GET](https://data.oecd.org/api/) | 403 | auth_required | free | 163 | discovery |
| Official Joke API | [GET](https://official-joke-api.appspot.com/random_joke) | 200 | ok_json | free | 827 | yes |
| Ollama | [GET](https://ollama.ai/) | 0 | network_error | free | 104 | discovery |
| ONS UK | [GET](https://ons.gov.uk/) | 0 | network_error | unknown | 239 | discovery |
| ONS UK Statistics | [GET](https://api.ons.gov.uk/) | 200 | ok_json | unknown | 290 | discovery |
| OnWater | [GET](https://onwater.io/) | 0 | network_error | unknown | 149 | discovery |
| OPC UA | [GET](https://opcfoundation.org/developer-tools/) | 200 | not_json | unknown | 328 | discovery |
| Open Ag Data | [GET](https://openag.io/) | 200 | not_json | unknown | 287 | discovery |
| Open Brewery DB | [GET](https://www.openbrewerydb.org/v1/breweries?per_page=1) | 404 | http_error | unknown | 155 | discovery |
| Open Charge Map | [GET](https://openchargemap.org/site/develop/api/) | 0 | network_error | unknown | 247 | discovery |
| Open Data Minneapolis | [GET](https://opendata.minneapolismn.gov/) | 200 | not_json | unknown | 566 | discovery |
| Open Data NHS Scotland | [GET](https://www.opendata.nhs.scot/) | 0 | network_error | unknown | 374 | discovery |
| Open Disease | [GET](https://disease.sh/) | 200 | not_json | unknown | 195 | discovery |
| Open Food Facts | [GET](https://world.openfoodfacts.org/api/) | 404 | http_error | unknown | 366 | discovery |
| Open Food Facts API | [GET](https://world.openfoodfacts.org/data/) | 403 | auth_required | unknown | 53 | discovery |
| Open Government, ACT | [GET](https://www.data.act.gov.au/) | 406 | http_error | unknown | 785 | discovery |
| Open Government, Argentina | [GET](https://datos.gob.ar/) | 200 | not_json | unknown | 915 | discovery |
| Open Government, Australia | [GET](https://www.data.gov.au/) | 200 | not_json | unknown | 214 | discovery |
| Open Government, Austria | [GET](https://www.data.gv.at/) | 200 | not_json | unknown | 283 | discovery |
| Open Government, Belgium | [GET](https://data.gov.be/) | 0 | network_error | unknown | 411 | discovery |
| Open Government, Colombia | [GET](https://www.dane.gov.co/) | 200 | not_json | unknown | 866 | discovery |
| Open Government, Cyprus | [GET](https://data.gov.cy/?language=en/) | 200 | not_json | unknown | 410 | discovery |
| Open Government, Czech Republic | [GET](https://data.gov.cz/english/) | 200 | not_json | unknown | 223 | discovery |
| Open Government, Denmark | [GET](https://www.opendata.dk/) | 200 | not_json | unknown | 433 | discovery |
| Open Government, Finland | [GET](https://www.avoindata.fi/en/) | 0 | network_error | unknown | 306 | discovery |
| Open Government, Germany | [GET](https://www.govdata.de/daten/-/details/govdata-metadatenkatalog/) | 0 | network_error | unknown | 185 | discovery |
| Open Government, Italy | [GET](https://www.dati.gov.it/) | 200 | not_json | unknown | 405 | discovery |
| Open Government, Lithuania | [GET](https://data.gov.lt/public/api/1/) | 200 | not_json | unknown | 215 | discovery |
| Open Government, Mexico | [GET](https://datos.gob.mx/) | 403 | auth_required | unknown | 102 | discovery |
| Open Government, Netherlands | [GET](https://data.overheid.nl/en/ondersteuning/data-publiceren/api/) | 0 | network_error | unknown | 323 | discovery |
| Open Government, New Zealand | [GET](https://www.data.govt.nz/) | 200 | not_json | unknown | 1683 | discovery |
| Open Government, Norway | [GET](https://data.norge.no/dataservices/) | 0 | network_error | unknown | 139 | discovery |
| Open Government, Peru | [GET](https://www.datosabiertos.gob.pe/) | 200 | not_json | unknown | 2631 | discovery |
| Open Government, Poland | [GET](https://dane.gov.pl/en/) | 200 | not_json | unknown | 660 | discovery |
| Open Government, Portugal | [GET](https://dados.gov.pt/en/docapi/) | 404 | http_error | unknown | 607 | discovery |
| Open Government, Queensland Government | [GET](https://www.data.qld.gov.au/) | 200 | not_json | unknown | 556 | discovery |
| Open Government, Saudi Arabia | [GET](https://data.gov.sa/) | 0 | network_error | unknown | 557 | discovery |
| Open Government, Singapore | [GET](https://data.gov.sg/developer/) | 0 | network_error | unknown | 862 | discovery |
| Open Government, Slovakia | [GET](https://data.gov.sk/en/) | 0 | network_error | unknown | 298 | discovery |
| Open Government, Slovenia | [GET](https://podatki.gov.si/) | 200 | not_json | unknown | 1028 | discovery |
| Open Government, South Australian Government | [GET](https://data.sa.gov.au/) | 200 | not_json | unknown | 2017 | discovery |
| Open Government, Spain | [GET](https://datos.gob.es/en/) | 200 | not_json | unknown | 305 | discovery |
| Open Government, Sweden | [GET](https://www.dataportal.se/en/dataservice/91_29789/api-for-the-statistical-database/) | 0 | network_error | unknown | 211 | discovery |
| Open Government, Taiwan | [GET](https://data.gov.tw/) | 200 | not_json | unknown | 2957 | discovery |
| Open Government, UK | [GET](https://data.gov.uk/) | 0 | network_error | unknown | 235 | discovery |
| Open Government, USA | [GET](https://www.data.gov/) | 0 | network_error | unknown | 984 | discovery |
| Open Government, Victoria State Government | [GET](https://www.data.vic.gov.au/) | 200 | not_json | unknown | 3432 | discovery |
| Open Government, West Australia | [GET](https://data.wa.gov.au/) | 200 | not_json | unknown | 2204 | discovery |
| Open Power System Data | [GET](https://open-power-system-data.org/) | 200 | not_json | unknown | 449 | discovery |
| Open Topo Data | [GET](https://www.opentopodata.org/) | 200 | not_json | unknown | 127 | discovery |
| Open Trivia | [GET](https://opentdb.com/api_config.php/) | 200 | not_json | unknown | 567 | discovery |
| Open Trivia Database | [GET](https://opentdb.com/api_config.php/) | 200 | not_json | unknown | 142 | discovery |
| Open Trivia DB | [GET](https://opentdb.com/api_config.php/) | 200 | not_json | unknown | 136 | discovery |
| Open-Meteo | [GET](https://open-meteo.com/) | 200 | not_json | unknown | 150 | discovery |
| openAFRICA | [GET](https://africaopendata.org/) | 0 | network_error | unknown | 111 | discovery |
| OpenAPI Generator | [GET](https://openapi-generator.tech/) | 200 | not_json | free | 234 | discovery |
| OpenCitations | [GET](https://opencitations.net/) | 200 | not_json | unknown | 305 | discovery |
| OpenCitations API | [GET](https://opencitations.net/index/api/v2/) | 0 | network_error | free | 74 | discovery |
| Opendatasoft API | [GET](https://help.opendatasoft.com/apis/ods-search-v2/) | 404 | http_error | free | 293 | discovery |
| OpenDota | [GET](https://opendota.com/) | 0 | network_error | unknown | 144 | discovery |
| OpenFDA Drug | [GET](https://open.fda.gov/apis/drug/) | 200 | not_json | unknown | 160 | discovery |
| openFDA Drug Labels | [GET](https://open.fda.gov/apis/drug/label/) | 200 | not_json | unknown | 272 | discovery |
| OpenHolidays | [GET](https://www.openholidaysapi.org/) | 0 | network_error | unknown | 194 | discovery |
| OpenHolidays API | [GET](https://www.openholidaysapi.org/) | 0 | network_error | free | 55 | discovery |
| OpenIndoor | [GET](https://openindoor.io/) | 200 | not_json | free | 1570 | discovery |
| OpenLEI API | [GET](https://www.gleif.org/en/lei-data/gleif-concatenated-file/download-the-concatenated-file/) | 200 | not_json | unknown | 5514 | discovery |
| OpenLigaDB | [GET](https://www.openligadb.de/) | 200 | not_json | unknown | 331 | discovery |
| OpenLigaDB API | [GET](https://www.openligadb.de/) | 200 | not_json | unknown | 67 | discovery |
| OpenSanctions | [GET](https://www.opensanctions.org/docs/api/) | 200 | not_json | unknown | 137 | discovery |
| openSenseMap | [GET](https://api.opensensemap.org/) | 200 | not_json | unknown | 284 | discovery |
| OpenStreetMap Nominatim | [GET](https://nominatim.org/release-docs/develop/api/) | 403 | auth_required | free | 258 | discovery |
| OpenStreetMap Nominatim API | [GET](https://nominatim.org/release-docs/latest/api/Overview/) | 200 | not_json | free | 55 | discovery |
| OpenTripPlanner | [GET](https://opentripplanner.org/) | 0 | network_error | unknown | 114 | discovery |
| OpenVisionAPI | [GET](https://openvisionapi.com/) | 0 | network_error | unknown | 179 | discovery |
| OpenWeatherMap API | [GET](https://openweathermap.org/api/) | 0 | network_error | unknown | 194 | discovery |
| OpenXR | [GET](https://www.khronos.org/openxr/) | 200 | not_json | unknown | 819 | discovery |
| Öppna Data Sverige | [GET](https://www.dataportal.se/) | 200 | not_json | free | 114 | discovery |
| Order Pizza REST API | [GET](https://order-pizza-api.herokuapp.com/api/ui/) | 404 | http_error | unknown | 511 | discovery |
| OSRM | [GET](https://osrm.org/) | 200 | not_json | unknown | 320 | discovery |
| OSRS API | [GET](https://oldschool.runescape.wiki/w/API/) | 404 | http_error | unknown | 145 | discovery |
| Outlook Mail | [GET](https://msdn.microsoft.com/en-us/office/office365/api/mail-rest-operations/) | 0 | network_error | unknown | 370 | discovery |
| OV-API Netherlands | [GET](https://ovapi.nl/) | 200 | not_json | unknown | 282 | discovery |
| OVHcloud AI Endpoints | [GET](https://endpoints.ai.cloud.ovh.net/) | 0 | network_error | unknown | 499 | discovery |
| Owen Wilson Wow | [GET](https://owen-wilson-wow-api.herokuapp.com/) | 404 | http_error | unknown | 549 | discovery |
| Owen Wilson Wow API | [GET](https://owen-wilson-wow-api.onrender.com/) | 200 | not_json | unknown | 523 | discovery |
| owo | [GET](https://owo.vc/api/) | 404 | http_error | unknown | 274 | discovery |
| oyyi | [GET](https://oyyi.xyz/docs/1.0/) | 0 | network_error | unknown | 685 | discovery |
| Packagist | [GET](https://packagist.org/apidoc/) | 0 | network_error | free | 240 | discovery |
| PackML | [GET](https://www.omac.org/packml/) | 0 | network_error | unknown | 186 | discovery |
| Pantry | [GET](https://getpantry.cloud/) | 200 | not_json | unknown | 527 | discovery |
| PDB | [GET](https://rcsb.org/) | 200 | not_json | unknown | 781 | discovery |
| PDF Blocks | [GET](https://www.pdfblocks.com/docs/api/getting-started/) | 0 | network_error | unknown | 140 | discovery |
| Peru Open Data API | [GET](https://www.datosabiertos.gob.pe/) | 200 | not_json | free | 1477 | discovery |
| Phabricator | [GET](https://phacility.com/) | 200 | not_json | unknown | 909 | discovery |
| Philippines Open Data API | [GET](https://data.gov.ph/) | 200 | not_json | free | 917 | discovery |
| PhishStats | [GET](https://phishstats.info/) | 200 | not_json | unknown | 315 | discovery |
| PHP-Noise | [GET](https://php-noise.com/) | 200 | not_json | unknown | 187 | discovery |
| PHP-Noise Generator | [GET](https://php-noise.com/) | 200 | not_json | unknown | 58 | discovery |
| Pinboard | [GET](https://pinboard.in/api/) | 200 | not_json | unknown | 867 | discovery |
| Pinterest API | [GET](https://www.pinterest.com/login/?next=http%3A%2F%2Fdevelopers.pinterest.com%2Fapi_docs%2F/) | 200 | not_json | unknown | 379 | discovery |
| Pirate Ipsum | [GET](https://pirateipsum.me/api/) | 404 | http_error | unknown | 543 | discovery |
| Pirate Ship | [GET](https://ship.pirateship.com/) | 200 | not_json | unknown | 438 | discovery |
| Pixel Encounter | [GET](https://pixelencounter.com/api/) | 0 | network_error | unknown | 340 | discovery |
| PlaceBear | [GET](https://placebear.com/) | 200 | not_json | unknown | 509 | discovery |
| PlaceDog | [GET](https://place.dog/) | 200 | not_json | unknown | 371 | discovery |
| Placeholder.com | [GET](https://placeholder.com/) | 200 | not_json | free | 209 | discovery |
| PlaceKeanu | [GET](https://placekeanu.com/) | 200 | not_json | unknown | 507 | discovery |
| PlaceKitten | [GET](https://placekitten.com/) | 521 | http_error | unknown | 208 | discovery |
| Plaid Identity | [GET](https://plaid.com/docs/identity-verification/) | 200 | not_json | unknown | 305 | discovery |
| PlayerDB | [GET](https://playerdb.co/) | 200 | not_json | unknown | 107 | discovery |
| Plusgiro | [GET](https://www.plusgirot.se/) | 0 | network_error | unknown | 114 | discovery |
| PM2.5 Open Data Portal | [GET](https://pm25.lass-net.org/) | 200 | not_json | unknown | 786 | discovery |
| PM2.5 Portal | [GET](https://pm25.lass-net.org/) | 200 | not_json | unknown | 337 | discovery |
| Pokéapi | [GET](https://pokeapi.co/) | 200 | not_json | unknown | 210 | discovery |
| Pokemon | [GET](https://pokeapi.co/) | 200 | not_json | unknown | 29 | discovery |
| Pokemon API | [GET](https://pokeapi.co/) | 200 | not_json | unknown | 87 | discovery |
| Pokémon TCG | [GET](https://pokemontcg.io/) | 200 | not_json | unknown | 468 | discovery |
| Pokemon TCG API | [GET](https://pokemontcg.io/) | 200 | not_json | unknown | 165 | discovery |
| Pokémon TCG API | [GET](https://pokemontcg.io/) | 200 | not_json | unknown | 224 | discovery |
| Postali | [GET](https://postali.app/api/) | 0 | network_error | unknown | 340 | discovery |
| Postcodes.io | [GET](https://postcodes.io/) | 200 | not_json | unknown | 141 | discovery |
| PostgREST | [GET](https://postgrest.org/) | 0 | network_error | unknown | 232 | discovery |
| Postman Echo | [GET](https://www.postman-echo.com/) | 0 | network_error | unknown | 335 | discovery |
| PRH | [GET](https://www.prh.fi/en/) | 0 | network_error | unknown | 159 | discovery |
| PRH Finland | [GET](https://avoindata.prh.fi/opendata/) | 0 | network_error | unknown | 263 | discovery |
| Prism | [GET](https://stoplight.io/prism/) | 0 | network_error | free | 217 | discovery |
| Pruvan | [GET](https://pruvan.com/resources/pruvan-api/) | 0 | network_error | unknown | 199 | discovery |
| PRV | [GET](https://www.prv.se/sv/) | 200 | not_json | unknown | 270 | discovery |
| Psychonauts | [GET](https://psychonauts-api.netlify.app/) | 401 | auth_required | unknown | 344 | discovery |
| PubChem | [GET](https://pubchemdocs.ncbi.nlm.nih.gov/pug-rest/) | 0 | network_error | unknown | 397 | discovery |
| PubChem API | [GET](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest/) | 200 | not_json | free | 395 | discovery |
| PunkAPI | [GET](https://punkapi.com/) | 0 | network_error | unknown | 40 | discovery |
| Purple Air | [GET](https://www2.purpleair.com/) | 0 | network_error | unknown | 283 | discovery |
| PyPI | [GET](https://warehouse.pypa.io/api-reference/) | 200 | not_json | free | 224 | discovery |
| PyPI API | [GET](https://warehouse.pypa.io/api-reference/) | 200 | not_json | free | 42 | discovery |
| QNAP Development Toolkit | [GET](https://www.qnap.com/event/dev/useng/p_about.php/) | 0 | network_error | unknown | 249 | discovery |
| QOwnNotes | [GET](https://qownnotes.org/) | 0 | network_error | unknown | 288 | discovery |
| QR Code Generator | [GET](https://goqr.me/api/) | 200 | not_json | free | 256 | discovery |
| QR code qrtag | [GET](https://www.qrtag.net/api/) | 200 | not_json | unknown | 393 | discovery |
| Qrcode Monkey | [GET](https://www.qrcode-monkey.com/qr-code-api-with-logo/) | 200 | not_json | unknown | 130 | discovery |
| Quarantine | [GET](https://quarantine.country/coronavirus/api/) | 0 | network_error | unknown | 118 | discovery |
| Quarantine API | [GET](https://quarantine.country/coronavirus/api/) | 0 | network_error | unknown | 109 | discovery |
| Queimadas INPE | [GET](https://queimadas.dgi.inpe.br/queimadas/dados-abertos/) | 0 | network_error | unknown | 1590 | discovery |
| QuickChart | [GET](https://quickchart.io/) | 200 | not_json | unknown | 285 | discovery |
| QuickMocker | [GET](https://quickmocker.com/) | 0 | network_error | unknown | 30 | discovery |
| quoteclear | [GET](https://quoteclear.web.app/) | 404 | http_error | unknown | 211 | discovery |
| Quotes on Design | [GET](https://quotesondesign.com/api/) | 200 | not_json | unknown | 218 | discovery |
| Quran | [GET](https://quran.api-docs.io/) | 0 | network_error | unknown | 290 | discovery |
| Quran API | [GET](https://alquran.cloud/api/) | 0 | network_error | unknown | 324 | discovery |
| Quran Cloud | [GET](https://alquran.cloud/api/) | 0 | network_error | unknown | 59 | discovery |
| Radicle | [GET](https://radicle.xyz/) | 0 | network_error | unknown | 152 | discovery |
| Radio Browser | [GET](https://api.radio-browser.info/) | 200 | not_json | unknown | 658 | discovery |
| Raider | [GET](https://raider.io/api/) | 200 | not_json | unknown | 1141 | discovery |
| Random Data | [GET](https://random-data-api.com/) | 0 | network_error | unknown | 765 | discovery |
| Random Facts | [GET](https://fungenerators.com/api/facts/) | 0 | network_error | unknown | 701 | discovery |
| Random Useless Facts | [GET](https://uselessfacts.jsph.pl/) | 200 | not_json | unknown | 287 | discovery |
| RandomDog | [GET](https://random.dog/woof.json/) | 200 | ok_json | unknown | 787 | discovery |
| RandomDuck | [GET](https://random-d.uk/api/) | 404 | http_error | unknown | 317 | discovery |
| RandomFox | [GET](https://randomfox.ca/floof/) | 200 | ok_json | unknown | 1178 | discovery |
| RandomUser | [GET](https://randomuser.me/api/) | 200 | ok_json | unknown | 313 | discovery |
| RATP Paris Transit | [GET](https://data.ratp.fr/) | 0 | network_error | unknown | 267 | discovery |
| RBA Australia | [GET](https://www.rba.gov.au/statistics/tables/) | 200 | not_json | unknown | 907 | discovery |
| RBA Australia Data | [GET](https://www.rba.gov.au/statistics/tables/) | 200 | not_json | unknown | 424 | discovery |
| RBNZ New Zealand Data | [GET](https://www.rbnz.govt.nz/statistics/) | 403 | auth_required | unknown | 324 | discovery |
| RCSB PDB API | [GET](https://data.rcsb.org/) | 406 | http_error | free | 608 | discovery |
| Redmine | [GET](https://redmine.org/) | 0 | network_error | unknown | 465 | discovery |
| Rejseplanen | [GET](https://help.rejseplanen.dk/hc/da/articles/214174465/) | 0 | network_error | unknown | 350 | discovery |
| RemoteOK API | [GET](https://remoteok.com/api/) | 200 | not_json | free | 1199 | discovery |
| Remotive | [GET](https://remotive.io/api-documentation/) | 0 | network_error | unknown | 220 | discovery |
| Renfe Railway Spain | [GET](https://www.renfe.com/es/es/grupo-renfe/otras-webs/Open-data/) | 0 | network_error | unknown | 160 | discovery |
| Represent by Open North | [GET](https://represent.opennorth.ca/) | 200 | not_json | unknown | 639 | discovery |
| ReqRes | [GET](https://reqres.in/) | 200 | not_json | unknown | 547 | discovery |
| ReqRes API | [GET](https://reqres.in/) | 200 | not_json | free | 201 | discovery |
| RescueGroups | [GET](https://userguide.rescuegroups.org/display/APIDG/API+Developers+Guide+Home/) | 0 | network_error | unknown | 525 | discovery |
| ReSmush.it | [GET](https://resmush.it/api/) | 200 | not_json | unknown | 157 | discovery |
| Resrobot | [GET](https://www.trafiklab.se/api/resrobot-reseplanerare/) | 200 | not_json | unknown | 287 | discovery |
| REST Countries | [GET](https://restcountries.com/v3.1/all?fields=name) | 0 | network_error | unknown | 142 | discovery |
| Reykjavik Open Data | [GET](https://opingogn.is/api/) | 0 | network_error | unknown | 391 | discovery |
| Rick and Morty | [GET](https://rickandmortyapi.com/) | 200 | not_json | unknown | 166 | discovery |
| Rick and Morty API | [GET](https://rickandmortyapi.com/) | 200 | not_json | unknown | 53 | discovery |
| Riksarkivet | [GET](https://riksarkivet.se/oppna-data/) | 0 | network_error | unknown | 109 | discovery |
| Riksbanken API | [GET](https://www.riksbank.se/) | 200 | not_json | free | 466 | discovery |
| Riksdagen Open Data | [GET](https://data.riksdagen.se/) | 0 | network_error | unknown | 238 | discovery |
| RoboHash | [GET](https://robohash.org/) | 200 | not_json | unknown | 418 | discovery |
| Rocket Pool | [GET](https://rocketpool.net/) | 200 | not_json | unknown | 244 | discovery |
| RPS 101 | [GET](https://rps101.pythonanywhere.com/api/) | 404 | http_error | unknown | 679 | discovery |
| RSS feed to JSON | [GET](https://rss-to-json-serverless-api.vercel.app/) | 402 | http_error | unknown | 382 | discovery |
| RubyGems | [GET](https://guides.rubygems.org/rubygems-org-api/) | 200 | not_json | unknown | 337 | discovery |
| RuneScape | [GET](https://runescape.wiki/w/Application_programming_interface/) | 200 | not_json | unknown | 195 | discovery |
| Rustybeer | [GET](https://rustybeer.herokuapp.com/) | 404 | http_error | unknown | 608 | discovery |
| Ruter | [GET](https://api.entur.io/journey-planner/) | 404 | http_error | unknown | 291 | discovery |
| Rwanda Locations | [GET](https://rapidapi.com/victorkarangwa4/api/rwanda/) | 0 | network_error | unknown | 427 | discovery |
| Rwanda Open Data API | [GET](https://statistics.gov.rw/) | 200 | not_json | free | 1344 | discovery |
| RxNorm | [GET](https://lhncbc.nlm.nih.gov/RxNav/APIs/) | 200 | not_json | unknown | 146 | discovery |
| SAMA Saudi Arabia | [GET](https://www.sama.gov.sa/) | 0 | network_error | unknown | 475 | discovery |
| Samtrafiken | [GET](https://www.samtrafiken.se/) | 0 | network_error | unknown | 563 | discovery |
| Samuel L Ipsum | [GET](https://slipsum.com/) | 200 | not_json | unknown | 293 | discovery |
| Saudi Aramco Data | [GET](https://www.aramco.com/en/investors/data-and-insights/) | 0 | network_error | unknown | 706 | discovery |
| SCB | [GET](https://www.scb.se/vara-tjanster/oppna-data/) | 200 | not_json | unknown | 403 | discovery |
| SCB API | [GET](https://www.scb.se/vara-tjanster/oppna-data/api-for-statistikdatabasen/) | 0 | network_error | unknown | 98 | discovery |
| SCB Statistics Sweden | [GET](https://www.scb.se/api/) | 200 | not_json | unknown | 28 | discovery |
| Scorecard | [GET](https://securityscorecards.dev/) | 200 | not_json | unknown | 437 | discovery |
| Scryfall | [GET](https://scryfall.com/docs/api/) | 200 | not_json | unknown | 101 | discovery |
| Scryfall MTG | [GET](https://scryfall.com/docs/api/) | 200 | not_json | unknown | 35 | discovery |
| SEC EDGAR | [GET](https://www.sec.gov/developer/) | 404 | http_error | free | 732 | discovery |
| SEC EDGAR API | [GET](https://www.sec.gov/developer/) | 404 | http_error | unknown | 77 | discovery |
| SEC EDGAR Data | [GET](https://www.sec.gov/edgar/sec-api-documentation/) | 0 | network_error | unknown | 499 | discovery |
| Semantic Scholar | [GET](https://api.semanticscholar.org/) | 429 | rate_limited | free | 598 | discovery |
| Senegal Open Data API | [GET](https://data.gouv.sn/) | 0 | network_error | free | 31 | discovery |
| Seniverse | [GET](https://www.seniverse.com/doc/) | 200 | not_json | unknown | 2295 | discovery |
| Serialif Color | [GET](https://color.serialif.com/) | 200 | not_json | unknown | 443 | discovery |
| Shanbay | [GET](https://www.shanbay.com/help/developer/api_v1/) | 0 | network_error | unknown | 305 | discovery |
| ShapeShift API | [GET](https://shapeshift.io/) | 0 | network_error | unknown | 36 | discovery |
| SHARE | [GET](https://share.osf.io/api/v2/) | 406 | http_error | unknown | 246 | discovery |
| Sharp | [GET](https://sharp.pixelplumbing.com/api/) | 404 | http_error | unknown | 316 | discovery |
| Shepherd.js | [GET](https://shepherdjs.dev/) | 0 | network_error | unknown | 751 | discovery |
| Shields | [GET](https://shields.io/) | 200 | not_json | unknown | 659 | discovery |
| Shields.io | [GET](https://shields.io/) | 200 | not_json | unknown | 111 | discovery |
| Signal Protocol | [GET](https://signal.org/) | 200 | not_json | free | 633 | discovery |
| Sigstore | [GET](https://sigstore.dev/) | 0 | network_error | unknown | 1008 | discovery |
| SilverBullet | [GET](https://silverbullet.md/) | 200 | not_json | unknown | 2350 | discovery |
| Singapore Data API | [GET](https://data.gov.sg/) | 200 | not_json | free | 1657 | discovery |
| Sitebulb | [GET](https://sitebulb.com/) | 200 | not_json | unknown | 275 | discovery |
| SL API | [GET](https://www.trafiklab.se/api/sl-realtidsinformation-4/) | 200 | not_json | unknown | 106 | discovery |
| SLSA | [GET](https://slsa.dev/) | 200 | not_json | unknown | 605 | discovery |
| Smappee | [GET](https://smappee.atlassian.net/wiki/display/DEVAPI/SmappeeDevAPI+Home/) | 404 | http_error | unknown | 482 | discovery |
| Smash | [GET](https://api.fromsmash.com/) | 200 | not_json | unknown | 407 | discovery |
| SMHI | [GET](https://opendata.smhi.se/apidocs/) | 404 | http_error | free | 141 | discovery |
| SMHI API | [GET](https://opendata.smhi.se/apidocs/) | 404 | http_error | unknown | 76 | discovery |
| SMHI Open Data | [GET](https://opendata-download-metobs.smhi.se/api/) | 200 | not_json | unknown | 151 | discovery |
| SMHI Weather API | [GET](https://opendata.smhi.se/apidocs/) | 404 | http_error | unknown | 28 | discovery |
| SMN Argentina API | [GET](https://www.smn.gob.ar/) | 403 | auth_required | free | 174 | discovery |
| SNB Switzerland | [GET](https://data.snb.ch/) | 400 | http_error | unknown | 254 | discovery |
| SNB Switzerland Data | [GET](https://data.snb.ch/en/) | 0 | network_error | unknown | 215 | discovery |
| Songsterr | [GET](https://www.songsterr.com/a/wa/api/) | 0 | network_error | unknown | 589 | discovery |
| South Africa Data API | [GET](https://data.gov.za/) | 0 | network_error | free | 1738 | discovery |
| South African Reserve Bank | [GET](https://www.resbank.co.za/) | 200 | not_json | unknown | 2711 | discovery |
| Spaceflight News | [GET](https://spaceflightnewsapi.net/) | 200 | not_json | unknown | 324 | discovery |
| SpaceX | [GET](https://api.spacex.land/graphql/) | 0 | network_error | unknown | 187 | discovery |
| Spain INE Statistics | [GET](https://www.ine.es/dyngs/DataLab/) | 404 | http_error | unknown | 653 | discovery |
| Spanish random names | [GET](https://random-names-api.herokuapp.com/public/) | 404 | http_error | unknown | 658 | discovery |
| Spanish random words | [GET](https://palabras-aleatorias-public-api.herokuapp.com/) | 404 | http_error | unknown | 634 | discovery |
| Squiggle | [GET](https://api.squiggle.com.au/) | 200 | not_json | unknown | 626 | discovery |
| SSB | [GET](https://www.ssb.no/api/) | 200 | not_json | unknown | 660 | discovery |
| SSB Norway | [GET](https://data.ssb.no/api/v0/) | 410 | http_error | unknown | 342 | discovery |
| Stakdek QR Generator | [GET](https://api.stakdek.de/blog?id=1006/) | 0 | timeout | unknown | 8007 | discovery |
| STAPI Star Trek | [GET](https://stapi.co/api-documentation/) | 404 | http_error | unknown | 383 | discovery |
| Star Trek API (STAPI) | [GET](https://stapi.co/api-documentation/) | 404 | http_error | unknown | 167 | discovery |
| StatBel Belgium | [GET](https://statbel.fgov.be/en/open-data/) | 0 | network_error | unknown | 739 | discovery |
| Statically | [GET](https://statically.io/) | 200 | not_json | unknown | 417 | discovery |
| Statistics Denmark | [GET](https://dst.dk/) | 0 | network_error | unknown | 719 | discovery |
| Statistics Finland | [GET](https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/) | 200 | ok_json | unknown | 618 | discovery |
| Statistics Norway | [GET](https://ssb.no/) | 0 | network_error | unknown | 346 | discovery |
| Statistics Sweden | [GET](https://scb.se/) | 0 | network_error | unknown | 438 | discovery |
| Statistics Sweden (SCB) | [GET](https://api.scb.se/OV0104/v1/doris/en/ssd/) | 200 | ok_json | unknown | 322 | discovery |
| Stoplight Prism | [GET](https://stoplight.io/open-source/prism/) | 0 | network_error | free | 120 | discovery |
| Stromberg Quotes | [GET](https://www.stromberg-api.de/) | 0 | network_error | unknown | 391 | discovery |
| Studio Ghibli | [GET](https://ghibliapi.herokuapp.com/) | 404 | http_error | unknown | 315 | discovery |
| Studio Ghibli API | [GET](https://ghibliapi.vercel.app/films) | 200 | ok_json | free | 407 | yes |
| Sunrise and Sunset | [GET](https://sunrise-sunset.org/api/) | 0 | network_error | unknown | 598 | discovery |
| Sunrise-Sunset API | [GET](https://sunrise-sunset.org/api/) | 0 | network_error | unknown | 141 | discovery |
| SunriseSunset.io | [GET](https://sunrisesunset.io/api/) | 200 | not_json | unknown | 250 | discovery |
| Suomi.fi | [GET](https://www.suomi.fi/palvelut/apis/) | 0 | network_error | unknown | 245 | discovery |
| SuredBits | [GET](https://suredbits.com/api/) | 0 | timeout | unknown | 8029 | discovery |
| Svea | [GET](https://www.svea.com/se/sv/foretag/integrationer/) | 0 | network_error | unknown | 128 | discovery |
| Sveriges Dataportal | [GET](https://www.dataportal.se/api/) | 0 | network_error | unknown | 226 | discovery |
| SVN API | [GET](https://subversion.apache.org/docs/api/1.8/) | 200 | not_json | free | 222 | discovery |
| SWAPI GraphQL | [GET](https://graphql.org/swapi-graphql/) | 200 | not_json | unknown | 430 | discovery |
| SWAPI Star Wars | [GET](https://www.swapi.tech/) | 200 | not_json | unknown | 582 | discovery |
| Sweden Data API | [GET](https://www.dataportal.se/) | 200 | not_json | unknown | 107 | discovery |
| Swedish Parliament | [GET](https://data.riksdagen.se/) | 0 | network_error | unknown | 115 | discovery |
| Swiss Federal Stats | [GET](https://www.pxweb.bfs.admin.ch/) | 0 | network_error | unknown | 382 | discovery |
| Swisstopo Geodata | [GET](https://api3.geo.admin.ch/) | 0 | network_error | unknown | 189 | discovery |
| Syft | [GET](https://anchore.com/) | 200 | not_json | unknown | 596 | discovery |
| Taiga | [GET](https://taiga.io/) | 200 | not_json | unknown | 402 | discovery |
| Taiwan Open Data API | [GET](https://data.gov.tw/) | 200 | not_json | free | 3128 | discovery |
| Taylor Swift API | [GET](https://taylor.rest/) | 0 | network_error | free | 56 | discovery |
| TCGdex Pokémon | [GET](https://www.tcgdex.dev/) | 0 | network_error | unknown | 288 | discovery |
| TCGdex Pokémon TCG | [GET](https://www.tcgdex.dev/) | 0 | network_error | unknown | 55 | discovery |
| Teambition | [GET](https://www.teambition.com/developer/open-platform/) | 0 | network_error | unknown | 507 | discovery |
| Techy | [GET](https://techy-api.vercel.app/) | 200 | not_json | unknown | 275 | discovery |
| Techy API | [GET](https://techy-api.vercel.app/) | 200 | not_json | unknown | 217 | discovery |
| Telegram API | [GET](https://core.telegram.org/) | 200 | not_json | unknown | 169 | discovery |
| Tenders Hungary | [GET](https://tenders.guru/hu/api/) | 0 | timeout | unknown | 8002 | discovery |
| Tenders in Hungary | [GET](https://tenders.guru/hu/api/) | 0 | timeout | unknown | 8064 | discovery |
| Tenders in Poland | [GET](https://tenders.guru/pl/api/) | 0 | timeout | unknown | 8041 | discovery |
| Tenders in Romania | [GET](https://tenders.guru/ro/api/) | 0 | timeout | unknown | 8002 | discovery |
| Tenders in Spain | [GET](https://tenders.guru/es/api/) | 0 | timeout | unknown | 8005 | discovery |
| Tenders in Ukraine | [GET](https://tenders.guru/ua/api/) | 0 | timeout | unknown | 8002 | discovery |
| Tenders Poland | [GET](https://tenders.guru/pl/api/) | 0 | timeout | unknown | 8001 | discovery |
| Tenders Romania | [GET](https://tenders.guru/ro/api/) | 0 | timeout | unknown | 8056 | discovery |
| Tenders Spain | [GET](https://tenders.guru/es/api/) | 0 | timeout | unknown | 8027 | discovery |
| Tenders Ukraine | [GET](https://tenders.guru/ua/api/) | 0 | timeout | unknown | 8004 | discovery |
| Terraform Registry | [GET](https://registry.terraform.io/v1/providers?limit=1) | 200 | ok_json | free | 251 | yes |
| TETR.IO | [GET](https://tetr.io/about/api/) | 200 | not_json | unknown | 223 | discovery |
| TextMate | [GET](https://macromates.com/) | 200 | not_json | unknown | 249 | discovery |
| Thailand Open Data API | [GET](https://data.go.th/) | 403 | auth_required | free | 233 | discovery |
| The Null Pointer | [GET](https://0x0.st/) | 200 | not_json | unknown | 347 | discovery |
| The SMS Works | [GET](https://thesmsworks.co.uk/sms-api/) | 404 | http_error | unknown | 258 | discovery |
| They Said So Quotes | [GET](https://theysaidso.com/api/) | 0 | network_error | unknown | 703 | discovery |
| Things API | [GET](https://culturedcode.com/things/support/articles/2803573/) | 200 | not_json | unknown | 140 | discovery |
| Thirukkural | [GET](https://api-thirukkural.web.app/) | 200 | not_json | unknown | 105 | discovery |
| This Person Does not Exist | [GET](https://thispersondoesnotexist.com/) | 200 | not_json | unknown | 156 | discovery |
| Thread | [GET](https://threadgroup.org/) | 200 | not_json | unknown | 1827 | discovery |
| ThronesApi | [GET](https://thronesapi.com/) | 200 | not_json | unknown | 874 | discovery |
| Thumbor | [GET](https://thumbor.readthedocs.io/) | 0 | network_error | unknown | 379 | discovery |
| TLE | [GET](https://tle.ivanstanojevic.me/) | 200 | not_json | unknown | 357 | discovery |
| TLE API | [GET](https://tle.ivanstanojevic.me/) | 200 | not_json | unknown | 84 | discovery |
| Today in History API | [GET](https://history.muffinlabs.com/) | 200 | not_json | unknown | 633 | discovery |
| Toodledo | [GET](https://api.toodledo.com/3/) | 200 | not_json | unknown | 411 | discovery |
| Toolcarton | [GET](https://testimonialapi.toolcarton.com/) | 0 | network_error | unknown | 119 | discovery |
| TradingView | [GET](https://tradingview.com/) | 0 | network_error | free | 192 | discovery |
| Trafikverket Open API | [GET](https://api.trafikinfo.trafikverket.se/) | 404 | http_error | unknown | 159 | discovery |
| Traitify | [GET](https://app.traitify.com/developer/) | 200 | not_json | unknown | 564 | discovery |
| Transfermarkt API | [GET](https://transfermarkt-api.vercel.app/) | 402 | http_error | unknown | 370 | discovery |
| TransLink Queensland | [GET](https://translink.com.au/about-translink/open-data/) | 0 | network_error | unknown | 1275 | discovery |
| Transport for Auckland, New Zealand | [GET](https://dev-portal.at.govt.nz/) | 200 | not_json | unknown | 2248 | discovery |
| Transport for Budapest, Hungary | [GET](https://bkkfutar.docs.apiary.io/) | 0 | timeout | unknown | 8009 | discovery |
| Transport for Czech Republic | [GET](https://www.chaps.cz/eng/products/idos-internet/) | 200 | not_json | unknown | 399 | discovery |
| Transport for Switzerland | [GET](https://transport.opendata.ch/) | 200 | not_json | unknown | 364 | discovery |
| Transport for United States | [GET](https://retro.umoiq.com/xmlFeedDocs/NextBusXMLFeed.pdf/) | 200 | not_json | unknown | 1075 | discovery |
| transport.rest | [GET](https://transport.rest/) | 200 | not_json | unknown | 434 | discovery |
| Trivy | [GET](https://trivy.dev/) | 200 | not_json | unknown | 194 | discovery |
| Tronald Dump | [GET](https://www.tronalddump.io/) | 521 | http_error | unknown | 444 | discovery |
| Tunisia Open Data API | [GET](https://data.gov.tn/) | 0 | network_error | free | 468 | discovery |
| TVMaze API | [GET](https://tvmaze.com/api/) | 0 | network_error | unknown | 250 | discovery |
| Uganda Open Data API | [GET](https://data.ug/) | 0 | network_error | free | 195 | discovery |
| UI Avatars | [GET](https://ui-avatars.com/) | 200 | not_json | free | 182 | discovery |
| UK Bank Holidays | [GET](https://www.gov.uk/bank-holidays.json/) | 0 | network_error | unknown | 102 | discovery |
| UK Government | [GET](https://www.api.gov.uk/) | 200 | not_json | free | 130 | discovery |
| UK Government API | [GET](https://www.api.gov.uk/) | 200 | not_json | free | 46 | discovery |
| Ultraleap Tracking | [GET](https://www.ultraleap.com/tracking/) | 404 | http_error | unknown | 206 | discovery |
| umati | [GET](https://umati.org/) | 200 | not_json | unknown | 609 | discovery |
| Umeå Open Data | [GET](https://opendata.umea.se/api/) | 0 | network_error | unknown | 375 | discovery |
| UN Data | [GET](https://data.un.org/) | 200 | not_json | free | 400 | discovery |
| UN Data API | [GET](https://data.un.org/) | 200 | not_json | free | 203 | discovery |
| UniProt API | [GET](https://www.uniprot.org/help/api/) | 200 | not_json | free | 305 | discovery |
| University of Oslo | [GET](https://data.uio.no/) | 406 | http_error | unknown | 131 | discovery |
| Unsplash It | [GET](https://unsplash.it/) | 0 | network_error | unknown | 233 | discovery |
| Unsplash Resource | [GET](https://source.unsplash.com/) | 503 | http_error | unknown | 524 | discovery |
| Urban Observatory | [GET](https://urbanobservatory.ac.uk/) | 200 | not_json | unknown | 547 | discovery |
| URLhaus | [GET](https://urlhaus-api.abuse.ch/) | 200 | not_json | unknown | 304 | discovery |
| Uruguay Open Data API | [GET](https://catalogodatos.gub.uy/) | 0 | network_error | free | 622 | discovery |
| US Presidential Election Data by TogaTech | [GET](https://uselection.togatech.org/api/) | 404 | http_error | unknown | 650 | discovery |
| USAspending | [GET](https://api.usaspending.gov/) | 200 | not_json | unknown | 970 | discovery |
| USAspending API | [GET](https://api.usaspending.gov/) | 200 | not_json | unknown | 296 | discovery |
| USAspending.gov | [GET](https://api.usaspending.gov/) | 200 | not_json | unknown | 1927 | discovery |
| UserAgent | [GET](https://useragent.api.io/) | 0 | network_error | unknown | 126 | discovery |
| USGS | [GET](https://www.usgs.gov/products/web-tools/apis/) | 200 | not_json | free | 148 | discovery |
| USGS Earthquake | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | not_json | unknown | 5435 | discovery |
| USGS Earthquake API | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | not_json | unknown | 31 | discovery |
| USGS Earthquake Hazards | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | not_json | unknown | 156 | discovery |
| USGS Earthquake Hazards Program | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | not_json | unknown | 29 | discovery |
| USGS Water Services | [GET](https://waterservices.usgs.gov/) | 200 | not_json | unknown | 704 | discovery |
| USPTO | [GET](https://www.uspto.gov/learning-and-resources/open-data-and-mobility/) | 404 | http_error | unknown | 281 | discovery |
| USPTO API | [GET](https://www.uspto.gov/learning-and-resources/open-data-and-mobility/) | 404 | http_error | unknown | 44 | discovery |
| V2EX | [GET](https://www.v2ex.com/p/7v9TEc53/) | 404 | http_error | unknown | 317 | discovery |
| Vadivelu HTTP Codes | [GET](https://vadivelu.anoram.com/) | 0 | network_error | unknown | 38 | discovery |
| Valorant (non-official) | [GET](https://valorant-api.com/) | 200 | not_json | unknown | 321 | discovery |
| Valorant API | [GET](https://valorant-api.com/) | 200 | not_json | unknown | 200 | discovery |
| VCR.py | [GET](https://vcrpy.readthedocs.io/) | 0 | network_error | free | 341 | discovery |
| Vector Express v2.0 | [GET](https://vector.express/) | 200 | not_json | unknown | 173 | discovery |
| VeganCheck API | [GET](https://jokenetwork.de/vegancheck-api/) | 0 | network_error | unknown | 321 | discovery |
| Velib metropolis, Paris, France | [GET](https://www.velib-metropole.fr/donnees-open-data-gbfs-du-service-velib-metropole/) | 403 | auth_required | unknown | 280 | discovery |
| Vercel AI SDK | [GET](https://sdk.vercel.ai/) | 0 | network_error | free | 221 | discovery |
| ViaCep | [GET](https://viacep.com.br/) | 200 | not_json | unknown | 629 | discovery |
| Vietnam Open Data API | [GET](https://data.gov.vn/) | 0 | network_error | free | 31 | discovery |
| VIN Decoder | [GET](https://vpic.nhtsa.dot.gov/api/) | 200 | not_json | unknown | 460 | discovery |
| Vinli | [GET](https://dev.vin.li/) | 0 | network_error | unknown | 144 | discovery |
| Virushee | [GET](https://api.virushee.com/) | 0 | network_error | unknown | 51 | discovery |
| VK API | [GET](https://vk.com/dev/) | 0 | network_error | unknown | 988 | discovery |
| Vy | [GET](https://www.vy.no/) | 200 | not_json | unknown | 1431 | discovery |
| WallstreetBets | [GET](https://dashboard.nbshare.io/apps/reddit/api/) | 0 | network_error | unknown | 158 | discovery |
| Warface (non-official) | [GET](https://api.wfstats.cf/) | 0 | network_error | unknown | 94 | discovery |
| Weatherstack | [GET](https://weatherstack.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers/) | 200 | not_json | unknown | 652 | discovery |
| Web3Modal | [GET](https://web3modal.com/) | 0 | network_error | unknown | 103 | discovery |
| Website Carbon | [GET](https://api.websitecarbon.com/) | 200 | not_json | unknown | 135 | discovery |
| WebXR | [GET](https://immersiveweb.dev/) | 200 | not_json | unknown | 246 | discovery |
| Weebly | [GET](https://cloud-developer.weebly.com/) | 404 | http_error | unknown | 120 | discovery |
| WePay | [GET](https://www.wepay.com/) | 0 | network_error | unknown | 131 | discovery |
| Wger Workout Manager | [GET](https://wger.de/en/software/api/) | 200 | not_json | unknown | 200 | discovery |
| WhiskyHunter | [GET](https://whiskyhunter.net/api/) | 200 | ok_json | unknown | 277 | discovery |
| Whitepages Pro | [GET](https://pro.whitepages.com/) | 0 | network_error | unknown | 111 | discovery |
| WHO | [GET](https://who.int/) | 0 | network_error | unknown | 238 | discovery |
| Wikipedia | [GET](https://www.mediawiki.org/wiki/API:Main_page/) | 404 | http_error | unknown | 297 | discovery |
| Wikipedia API | [GET](https://en.wikipedia.org/w/api.php/) | 0 | network_error | unknown | 293 | discovery |
| Wiktionary | [GET](https://en.wiktionary.org/w/api.php/) | 0 | network_error | unknown | 295 | discovery |
| Wiktionary API | [GET](https://en.wiktionary.org/w/api.php/) | 0 | network_error | unknown | 192 | discovery |
| Wolne Lektury | [GET](https://wolnelektury.pl/api/) | 200 | not_json | unknown | 414 | discovery |
| Working Nomads | [GET](https://www.workingnomads.co/api/exposed_jobs/) | 0 | network_error | unknown | 601 | discovery |
| Worktile | [GET](https://dev.worktile.com/document/overview/) | 200 | not_json | unknown | 1064 | discovery |
| World Bank | [GET](https://datahelpdesk.worldbank.org/knowledgebase/topics/125589/) | 404 | http_error | unknown | 723 | discovery |
| World Bank API | [GET](https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information/) | 404 | http_error | unknown | 418 | discovery |
| World Flora Online | [GET](https://worldfloraonline.org/) | 0 | network_error | unknown | 381 | discovery |
| WorldTimeAPI | [GET](https://worldtimeapi.org/) | 0 | network_error | free | 205 | discovery |
| Wunderground | [GET](https://www.wunderground.com/weather/api/) | 0 | network_error | unknown | 202 | discovery |
| xColors | [GET](https://x-colors.herokuapp.com/) | 404 | http_error | unknown | 568 | discovery |
| xeno-canto | [GET](https://xeno-canto.org/explore/api/) | 404 | http_error | unknown | 222 | discovery |
| xMath | [GET](https://x-math.herokuapp.com/) | 404 | http_error | unknown | 515 | discovery |
| XMPP | [GET](https://xmpp.org/) | 200 | not_json | free | 557 | discovery |
| Y.js | [GET](https://yjs.dev/) | 200 | not_json | unknown | 320 | discovery |
| Yandex | [GET](https://tech.yandex.com/maps/) | 0 | network_error | unknown | 226 | discovery |
| Yes No | [GET](https://yesno.wtf/api/) | 200 | ok_json | unknown | 370 | discovery |
| Youku | [GET](https://doc.open.youku.com/) | 404 | http_error | unknown | 1062 | discovery |
| YR | [GET](https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75) | 200 | ok_json | free | 211 | yes |
| Yr.no | [GET](https://api.met.no/weatherapi/) | 200 | not_json | unknown | 48 | discovery |
| Yu-Gi-Oh | [GET](https://ygoprodeck.com/) | 200 | not_json | unknown | 237 | discovery |
| Yu-Gi-Oh! API | [GET](https://db.ygoprodeck.com/api-guide/) | 0 | network_error | unknown | 115 | discovery |
| Z-Wave | [GET](https://z-wavealliance.org/) | 200 | not_json | unknown | 507 | discovery |
| Zed | [GET](https://zed.dev/) | 200 | not_json | unknown | 531 | discovery |
| Zen Quotes | [GET](https://zenquotes.io/) | 200 | not_json | unknown | 468 | discovery |
| Zen Quotes API | [GET](https://zenquotes.io/api/) | 0 | network_error | free | 375 | discovery |
| Zettlr | [GET](https://zettlr.com/) | 200 | not_json | unknown | 329 | discovery |
| Zigbee | [GET](https://zigbeealliance.org/) | 0 | network_error | unknown | 205 | discovery |
| Ziptastic | [GET](https://ziptasticapi.com/) | 200 | not_json | unknown | 784 | discovery |
| ZMOK | [GET](https://zmok.io/) | 200 | not_json | unknown | 757 | discovery |
| Zoo Animals | [GET](https://zoo-animal-api.herokuapp.com/) | 404 | http_error | unknown | 354 | discovery |
| Zoo Animals API | [GET](https://zoo-animal-api.herokuapp.com/) | 404 | http_error | unknown | 58 | discovery |
