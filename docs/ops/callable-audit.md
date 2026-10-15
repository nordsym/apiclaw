# Callable API audit

Checked: 2026-10-15T14:53:29.458Z.

13 of 1002 public candidates passed. Managed providers are reported separately. A website returning HTML is not a successful API call. Unknown pricing, authentication errors and unverified responses remain discovery only. This sweep makes no requests using provider credentials.

Policy: HTTPS GET; origin pinned; no auth; no redirects; valid JSON; explicit free pricing required. Eight concurrent requests maximum, serialized per origin with a 150 ms delay, eight-second timeout, bounded response reads.

Re-run: `node scripts/audit-callable.mjs`. Each row records the exact tested path. Results reflect this runner and time; preview gateway calls are verified separately in the PR.

| API | Probe | HTTP | Result | Pricing | Latency ms | Callable |
|---|---|---:|---|---|---:|---|
| 0x | [GET](https://0x.org/api/) | 0 | network_error | unknown | 749 | discovery |
| 0x API | [GET](https://0x.org/api/) | 0 | network_error | unknown | 94 | discovery |
| 1Forge.com | [GET](https://1forge.com/) | 200 | not_json | unknown | 660 | discovery |
| 1inch | [GET](https://1inch.io/api/) | 0 | network_error | unknown | 393 | discovery |
| 24 Pull Requests | [GET](https://24pullrequests.com/api/) | 406 | http_error | unknown | 806 | discovery |
| A-Frame | [GET](https://aframe.io/) | 200 | not_json | unknown | 822 | discovery |
| ABS Statistics | [GET](https://api.data.abs.gov.au/) | 0 | network_error | unknown | 300 | discovery |
| adresse.data.gouv.fr | [GET](https://adresse.data.gouv.fr/) | 200 | not_json | unknown | 1149 | discovery |
| ADS-B Exchange | [GET](https://www.adsbexchange.com/data/) | 0 | network_error | unknown | 746 | discovery |
| Advice Slip API | [GET](https://api.adviceslip.com/advice) | 200 | ok_json | free | 430 | yes |
| Age of Empires II | [GET](https://age-of-empires-2-api.herokuapp.com/) | 404 | http_error | unknown | 864 | discovery |
| Agify | [GET](https://agify.io/) | 406 | http_error | unknown | 906 | discovery |
| Agify.io | [GET](https://agify.io/) | 406 | http_error | unknown | 149 | discovery |
| Airtel IP | [GET](https://sys.airtel.lv/ip2country/1.1.1.1/?full=true/) | 200 | invalid_response | unknown | 433 | discovery |
| AllStar | [GET](https://openssf.org/) | 200 | not_json | unknown | 1165 | discovery |
| Altinn | [GET](https://altinn.no/api/) | 0 | network_error | unknown | 254 | discovery |
| AmiiboAPI | [GET](https://amiiboapi.com/) | 200 | not_json | unknown | 1091 | discovery |
| An API of Ice and Fire | [GET](https://anapioficeandfire.com/api/books/1) | 200 | ok_json | free | 444 | yes |
| AnimeNewsNetwork | [GET](https://www.animenewsnetwork.com/encyclopedia/api.php/) | 0 | network_error | unknown | 700 | discovery |
| Anki | [GET](https://apps.ankiweb.net/) | 200 | not_json | free | 399 | discovery |
| Anki API | [GET](https://foosoft.net/projects/anki-connect/) | 404 | http_error | unknown | 406 | discovery |
| AnonFiles | [GET](https://anonfiles.com/docs/api/) | 0 | network_error | unknown | 86 | discovery |
| Anytype | [GET](https://anytype.io/) | 200 | not_json | unknown | 831 | discovery |
| API Grátis | [GET](https://apigratis.com.br/) | 429 | rate_limited | unknown | 634 | discovery |
| API Setu | [GET](https://www.apisetu.gov.in/) | 200 | not_json | unknown | 1831 | discovery |
| ApicAgent | [GET](https://www.apicagent.com/) | 200 | not_json | unknown | 360 | discovery |
| apilayer screenshotlayer | [GET](https://screenshotlayer.com/) | 200 | not_json | unknown | 1159 | discovery |
| APiX | [GET](https://www.apix.cn/) | 200 | not_json | unknown | 4322 | discovery |
| Apoteket | [GET](https://www.apoteket.se/) | 200 | not_json | unknown | 1110 | discovery |
| AppFlowy | [GET](https://appflowy.io/) | 0 | network_error | unknown | 530 | discovery |
| Appium API | [GET](https://appium.io/docs/en/latest/) | 200 | not_json | unknown | 1257 | discovery |
| arcsecond.io | [GET](https://api.arcsecond.io/) | 200 | not_json | unknown | 1075 | discovery |
| Argentina Open Data API | [GET](https://datos.gob.ar/) | 200 | not_json | free | 1285 | discovery |
| arXiv | [GET](https://arxiv.org/help/api/user-manual/) | 0 | network_error | unknown | 774 | discovery |
| Atlantis | [GET](https://runatlantis.io/) | 0 | network_error | unknown | 813 | discovery |
| Atom | [GET](https://atom.io/) | 0 | network_error | unknown | 930 | discovery |
| Australia Data API | [GET](https://data.gov.au/) | 200 | not_json | free | 1707 | discovery |
| Australia Government API | [GET](https://data.gov.au/data/api/) | 200 | ok_json | unknown | 532 | discovery |
| Australian Bureau of Statistics | [GET](https://abs.gov.au/) | 0 | network_error | unknown | 677 | discovery |
| Australian Open Data | [GET](https://data.gov.au/) | 200 | not_json | unknown | 209 | discovery |
| Auth.js | [GET](https://authjs.dev/getting-started/introduction/) | 0 | network_error | unknown | 325 | discovery |
| Automerge | [GET](https://automerge.org/) | 200 | not_json | unknown | 587 | discovery |
| Aviationstack | [GET](https://aviationstack.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers/) | 200 | not_json | unknown | 1069 | discovery |
| AviationWeather | [GET](https://www.aviationweather.gov/dataserver/) | 0 | network_error | unknown | 422 | discovery |
| Axolotl | [GET](https://theaxolotlapi.netlify.app/) | 200 | not_json | unknown | 531 | discovery |
| Axolotl API | [GET](https://theaxolotlapi.netlify.app/) | 200 | not_json | unknown | 176 | discovery |
| aztro | [GET](https://aztro.sameerkumar.website/) | 404 | http_error | unknown | 808 | discovery |
| Babylon.js | [GET](https://www.babylonjs.com/) | 200 | not_json | unknown | 412 | discovery |
| Backstage | [GET](https://backstage.io/) | 200 | not_json | unknown | 336 | discovery |
| Bacon Ipsum | [GET](https://baconipsum.com/json-api/) | 200 | not_json | unknown | 635 | discovery |
| BaconMockup | [GET](https://baconmockup.com/) | 200 | not_json | unknown | 698 | discovery |
| Banca d'Italia | [GET](https://www.bancaditalia.it/statistiche/) | 200 | not_json | unknown | 919 | discovery |
| Banco Central Brazil | [GET](https://dadosabertos.bcb.gov.br/) | 200 | not_json | unknown | 1284 | discovery |
| Bandsintown | [GET](https://app.swaggerhub.com/apis/Bandsintown/PublicAPI/3.0.0/) | 404 | http_error | unknown | 637 | discovery |
| Bangladesh Open Data API | [GET](https://data.gov.bd/) | 200 | not_json | free | 1560 | discovery |
| Bank Negara Malaysia Open Data | [GET](https://apikijangportal.bnm.gov.my/) | 403 | auth_required | unknown | 232 | discovery |
| Bank of Canada | [GET](https://www.bankofcanada.ca/rates/) | 200 | not_json | unknown | 1661 | discovery |
| Bank of Canada Rates | [GET](https://www.bankofcanada.ca/rates/) | 200 | not_json | unknown | 81 | discovery |
| Bank of Israel | [GET](https://www.boi.org.il/en/DataAndStatistics/) | 200 | not_json | unknown | 578 | discovery |
| Bank of Russia | [GET](https://www.cbr.ru/development/SXML/) | 200 | not_json | unknown | 773 | discovery |
| Banque de France | [GET](https://webstat.banque-france.fr/ws/) | 404 | http_error | unknown | 784 | discovery |
| Barcode Generator API | [GET](https://bwipjs-api.metafloor.com/) | 200 | not_json | free | 819 | discovery |
| BayFiles | [GET](https://bayfiles.com/docs/api/) | 0 | network_error | unknown | 180 | discovery |
| BC Ferries | [GET](https://www.bcferriesapi.ca/) | 200 | not_json | unknown | 691 | discovery |
| Beeceptor | [GET](https://beeceptor.com/) | 200 | not_json | unknown | 859 | discovery |
| Beeminder | [GET](https://www.beeminder.com/api/) | 0 | network_error | unknown | 450 | discovery |
| Behance | [GET](https://www.behance.net/dev/api/endpoints/) | 404 | http_error | unknown | 699 | discovery |
| Bhagavad Gita telugu | [GET](https://gita-api.vercel.app/) | 200 | not_json | unknown | 2006 | discovery |
| Bible | [GET](https://bible-api.com/) | 200 | not_json | unknown | 569 | discovery |
| Bible API | [GET](https://bible-api.com/) | 200 | not_json | unknown | 184 | discovery |
| Bible API 2 | [GET](https://bible-api.com/) | 200 | not_json | unknown | 204 | discovery |
| Bible API Public | [GET](https://bible-api.com/) | 200 | not_json | unknown | 208 | discovery |
| Bible JSON API | [GET](https://bible-api.com/) | 200 | not_json | unknown | 210 | discovery |
| BigML | [GET](https://bigml.com/api/) | 200 | not_json | unknown | 366 | discovery |
| Billogram | [GET](https://billogram.com/api/) | 0 | network_error | unknown | 221 | discovery |
| Binlist | [GET](https://binlist.net/) | 200 | not_json | unknown | 183 | discovery |
| BioThings | [GET](https://biothings.io/) | 200 | not_json | unknown | 1385 | discovery |
| Biriyani As A Service | [GET](https://biriyani.anoram.com/) | 503 | http_error | unknown | 378 | discovery |
| BitcoinCharts | [GET](https://bitcoincharts.com/about/exchanges/) | 0 | network_error | unknown | 345 | discovery |
| Bitcoincharts API | [GET](https://bitcoincharts.com/about/markets-api/) | 0 | network_error | unknown | 267 | discovery |
| Block.io | [GET](https://block.io/) | 0 | network_error | unknown | 316 | discovery |
| Blockchain Exchange Rates | [GET](https://blockchain.info/api/exchange_rates_api/) | 0 | network_error | unknown | 241 | discovery |
| BNM Moldova Rates | [GET](https://bnm.md/en/content/official-exchange-rates/) | 200 | not_json | unknown | 1674 | discovery |
| Board Game Geek | [GET](https://boardgamegeek.com/wiki/page/BGG_XML_API2/) | 403 | auth_required | unknown | 193 | discovery |
| Bob's Burgers | [GET](https://bobs-burgers-api-ui.herokuapp.com/) | 503 | http_error | unknown | 511 | discovery |
| Bokio | [GET](https://www.bokio.se/integrations/) | 404 | http_error | unknown | 714 | discovery |
| BOM Australia Weather | [GET](https://www.bom.gov.au/catalogue/data-feeds.shtml/) | 403 | auth_required | unknown | 251 | discovery |
| Bored | [GET](https://www.boredapi.com/api/activity) | 0 | network_error | unknown | 166 | discovery |
| BoredAPI | [GET](https://www.boredapi.com/api/activity) | 0 | network_error | unknown | 7 | discovery |
| Brackets | [GET](https://brackets.io/) | 200 | not_json | unknown | 271 | discovery |
| Brazil | [GET](https://brasilapi.com.br/) | 200 | not_json | unknown | 355 | discovery |
| Brazil Central Bank Open Data | [GET](https://dadosabertos.bcb.gov.br/) | 200 | not_json | unknown | 1002 | discovery |
| Brazil Data API | [GET](https://dados.gov.br/) | 200 | not_json | unknown | 512 | discovery |
| Brazil Open Data API | [GET](https://dados.gov.br/) | 200 | not_json | free | 257 | discovery |
| Brazil Receita WS | [GET](https://www.receitaws.com.br/) | 200 | not_json | unknown | 629 | discovery |
| Brønnøysundregistrene | [GET](https://data.brreg.no/) | 0 | network_error | unknown | 434 | discovery |
| Brreg | [GET](https://data.brreg.no/) | 0 | network_error | unknown | 254 | discovery |
| Buddy CI | [GET](https://buddy.works/api/reference/getting-started/overview/) | 0 | network_error | unknown | 279 | discovery |
| Bugsnax | [GET](https://www.bugsnaxapi.com/) | 0 | network_error | unknown | 33 | discovery |
| Bugzilla | [GET](https://wiki.mozilla.org/Bugzilla:REST_API/) | 404 | http_error | unknown | 630 | discovery |
| Bundesbank API | [GET](https://www.bundesbank.de/dynamic/action/de/statistiken/zeitreihen-datenbanken/) | 404 | http_error | unknown | 306 | discovery |
| Callook.info | [GET](https://callook.info/) | 200 | not_json | unknown | 547 | discovery |
| CamScanner | [GET](https://dev.camscanner.com/?language=en-us/) | 200 | not_json | unknown | 5835 | discovery |
| Canada Government API | [GET](https://open.canada.ca/en/access-our-application-programming-interface-api/) | 0 | network_error | unknown | 986 | discovery |
| Canada Open Data API | [GET](https://open.canada.ca/) | 0 | network_error | free | 185 | discovery |
| Canadian Open Data | [GET](https://open.canada.ca/) | 0 | network_error | unknown | 131 | discovery |
| CapRover | [GET](https://caprover.com/) | 200 | not_json | unknown | 315 | discovery |
| Carbon API | [GET](https://carbon.now.sh/) | 200 | not_json | free | 117 | discovery |
| Cat as a Service | [GET](https://cataas.com/) | 200 | not_json | unknown | 454 | discovery |
| Cat Facts API | [GET](https://catfact.ninja/fact) | 200 | ok_json | free | 405 | yes |
| Cataas | [GET](https://cataas.com/) | 200 | not_json | unknown | 178 | discovery |
| Catastro Spain | [GET](https://www.catastro.meh.es/) | 0 | network_error | unknown | 122 | discovery |
| Catboy | [GET](https://catboys.com/api/) | 404 | http_error | unknown | 747 | discovery |
| Catboy API | [GET](https://catboys.com/api/) | 404 | http_error | unknown | 132 | discovery |
| CBE Egypt | [GET](https://www.cbe.org.eg/) | 200 | not_json | unknown | 348 | discovery |
| CBK Kenya | [GET](https://www.centralbank.go.ke/) | 200 | not_json | unknown | 717 | discovery |
| CBN Nigeria | [GET](https://www.cbn.gov.ng/) | 200 | not_json | unknown | 292 | discovery |
| CBN Nigeria Rates | [GET](https://www.cbn.gov.ng/rates/) | 200 | not_json | unknown | 59 | discovery |
| CBR Russia | [GET](https://cbr.ru/) | 200 | not_json | unknown | 1362 | discovery |
| CBR Russia API | [GET](https://www.cbr.ru/development/) | 200 | not_json | unknown | 219 | discovery |
| CBS Netherlands | [GET](https://opendata.cbs.nl/) | 200 | not_json | unknown | 228 | discovery |
| CBUAE UAE | [GET](https://www.centralbank.ae/) | 0 | network_error | unknown | 267 | discovery |
| CDNJS | [GET](https://api.cdnjs.com/libraries/jquery/) | 200 | ok_json | unknown | 134 | discovery |
| Central Bank Ireland Data | [GET](https://data.gov.ie/data/search/) | 0 | network_error | unknown | 286 | discovery |
| Chainlink | [GET](https://chain.link/developer-resources/) | 0 | network_error | unknown | 399 | discovery |
| Chainpoint | [GET](https://tierion.com/chainpoint/) | 200 | not_json | unknown | 720 | discovery |
| Changelogs.md | [GET](https://changelogs.md/) | 0 | network_error | unknown | 922 | discovery |
| CheapShark | [GET](https://www.cheapshark.com/api/) | 0 | network_error | unknown | 221 | discovery |
| ChEBI | [GET](https://ebi.ac.uk/chebi/) | 0 | network_error | unknown | 282 | discovery |
| Chess.com | [GET](https://www.chess.com/news/view/published-data-api/) | 0 | network_error | unknown | 258 | discovery |
| Chess.com API | [GET](https://www.chess.com/news/view/published-data-api/) | 0 | network_error | unknown | 158 | discovery |
| Chicago Data Portal API | [GET](https://data.cityofchicago.org/) | 406 | http_error | unknown | 4391 | discovery |
| Chile Open Data API | [GET](https://datos.gob.cl/) | 200 | not_json | free | 2462 | discovery |
| Chinese Text Project | [GET](https://ctext.org/tools/api/) | 200 | not_json | unknown | 568 | discovery |
| chucknorris.io | [GET](https://api.chucknorris.io/) | 406 | http_error | unknown | 230 | discovery |
| City Bikes | [GET](https://api.citybik.es/v2/) | 200 | not_json | unknown | 330 | discovery |
| City, Berlin | [GET](https://daten.berlin.de/) | 403 | auth_required | unknown | 233 | discovery |
| City, Gdańsk | [GET](https://ckan.multimediagdansk.pl/en/) | 200 | not_json | unknown | 470 | discovery |
| City, Helsinki | [GET](https://hri.fi/en_gb/) | 200 | not_json | unknown | 842 | discovery |
| City, Lviv | [GET](https://opendata.city-adm.lviv.ua/) | 403 | auth_required | unknown | 221 | discovery |
| City, New York Open Data | [GET](https://opendata.cityofnewyork.us/) | 0 | network_error | unknown | 472 | discovery |
| City, Toronto Open Data | [GET](https://open.toronto.ca/) | 200 | not_json | unknown | 888 | discovery |
| Classify | [GET](https://classify-web.herokuapp.com/) | 404 | http_error | unknown | 512 | discovery |
| ClinicalTrials.gov | [GET](https://clinicaltrials.gov/api/) | 200 | ok_json | unknown | 244 | discovery |
| CNMV Spain | [GET](https://www.cnmv.es/) | 0 | network_error | unknown | 581 | discovery |
| CocktailDB API | [GET](https://www.thecocktaildb.com/api.php/) | 200 | not_json | unknown | 179 | discovery |
| CocoaPods | [GET](https://cocoapods.org/) | 200 | not_json | free | 571 | discovery |
| Codeberg | [GET](https://codeberg.org/) | 200 | not_json | unknown | 267 | discovery |
| Codeium | [GET](https://codeium.com/api/) | 0 | network_error | unknown | 214 | discovery |
| Codewars API | [GET](https://dev.codewars.com/) | 200 | not_json | unknown | 373 | discovery |
| Coding | [GET](https://open.coding.net/) | 0 | network_error | unknown | 1581 | discovery |
| Coffee | [GET](https://coffee.alexflipnote.dev/) | 200 | not_json | unknown | 590 | discovery |
| Coffee API | [GET](https://coffee.alexflipnote.dev/) | 200 | not_json | unknown | 253 | discovery |
| CoinDesk | [GET](https://old.coindesk.com/coindesk-api/) | 0 | network_error | unknown | 37 | discovery |
| CoinDesk API | [GET](https://old.coindesk.com/coindesk-api/) | 0 | network_error | unknown | 8 | discovery |
| Coinlore | [GET](https://www.coinlore.com/cryptocurrency-data-api/) | 0 | network_error | unknown | 349 | discovery |
| Coinlore API | [GET](https://www.coinlore.com/cryptocurrency-data-api/) | 0 | network_error | unknown | 136 | discovery |
| Coinpaprika | [GET](https://api.coinpaprika.com/) | 0 | network_error | unknown | 197 | discovery |
| CoinPaprika API | [GET](https://api.coinpaprika.com/) | 0 | network_error | unknown | 91 | discovery |
| CollegeScoreCard | [GET](https://collegescorecard.ed.gov/data/) | 200 | not_json | unknown | 349 | discovery |
| CollegeScoreCard.ed.gov | [GET](https://collegescorecard.ed.gov/data/) | 200 | not_json | unknown | 158 | discovery |
| Colombia Open Data API | [GET](https://www.datos.gov.co/) | 406 | http_error | free | 1695 | discovery |
| Color API | [GET](https://www.thecolorapi.com/id?hex=0047AB) | 200 | ok_json | free | 597 | yes |
| Colorado Information Marketplace | [GET](https://data.colorado.gov/) | 406 | http_error | unknown | 3540 | discovery |
| Coronavirus | [GET](https://pipedream.com/@pravin/http-api-for-latest-wuhan-coronavirus-data-2019-ncov-p_G6CLVM/readme/) | 200 | not_json | unknown | 753 | discovery |
| Corporate BS | [GET](https://corporatebs-generator.sameerkumar.website/) | 200 | ok_json | unknown | 668 | discovery |
| Cosign | [GET](https://sigstore.dev/) | 0 | network_error | unknown | 333 | discovery |
| CountAPI | [GET](https://countapi.xyz/) | 0 | network_error | unknown | 554 | discovery |
| Countly | [GET](https://api.count.ly/reference/) | 404 | http_error | unknown | 362 | discovery |
| Countries GraphQL | [GET](https://countries.trevorblades.com/) | 204 | not_json | free | 246 | discovery |
| Country Flags API | [GET](https://flagcdn.com/) | 200 | not_json | free | 319 | discovery |
| Country.is | [GET](https://country.is/json) | 404 | http_error | free | 298 | discovery |
| Covid Tracking Project | [GET](https://covidtracking.com/data/api/version-2/) | 200 | not_json | unknown | 583 | discovery |
| Covid-19 Datenhub | [GET](https://npgeo-corona-npgeo-de.hub.arcgis.com/) | 404 | http_error | unknown | 739 | discovery |
| Covid-19 Government Response | [GET](https://covidtracker.bsg.ox.ac.uk/) | 0 | network_error | unknown | 435 | discovery |
| Covid-19 India | [GET](https://data.covid19india.org/) | 200 | not_json | unknown | 592 | discovery |
| Covid-19 JHU CSSE | [GET](https://nuttaphat.com/covid19-api/) | 200 | not_json | unknown | 588 | discovery |
| COVID-19 Tracker Canada | [GET](https://api.covid19tracker.ca/docs/1.0/overview/) | 200 | not_json | unknown | 818 | discovery |
| COVID-19 Tracker Sri Lanka | [GET](https://www.hpb.health.gov.lk/en/api-documentation/) | 0 | network_error | unknown | 1006 | discovery |
| COVID-ID | [GET](https://data.covid19.go.id/public/api/prov.json/) | 0 | timeout | unknown | 8006 | discovery |
| Crafatar | [GET](https://crafatar.com/) | 200 | not_json | unknown | 512 | discovery |
| Creatomate | [GET](https://creatomate.com/docs/api/introduction/) | 0 | network_error | unknown | 796 | discovery |
| CrossRef | [GET](https://api.crossref.org/) | 0 | network_error | free | 576 | discovery |
| CryptingUp | [GET](https://www.cryptingup.com/apidoc/) | 0 | network_error | unknown | 615 | discovery |
| CryptoCompare | [GET](https://www.cryptocompare.com/api) | 0 | network_error | unknown | 364 | discovery |
| Cryptonator | [GET](https://www.cryptonator.com/api/) | 0 | network_error | unknown | 423 | discovery |
| Cryptonator API | [GET](https://www.cryptonator.com/api/) | 0 | network_error | unknown | 7 | discovery |
| CurrencyScoop.com | [GET](https://currencyscoop.com/) | 0 | network_error | unknown | 165 | discovery |
| Cursor | [GET](https://cursor.sh/) | 0 | network_error | freemium | 207 | discovery |
| Curve | [GET](https://curve.fi/) | 0 | network_error | unknown | 171 | discovery |
| CVR | [GET](https://datacvr.virk.dk/) | 403 | auth_required | unknown | 203 | discovery |
| CVR API | [GET](https://datacvr.virk.dk/) | 403 | auth_required | free | 161 | discovery |
| Czech Namedays | [GET](https://svatky.adresa.info/) | 402 | http_error | unknown | 779 | discovery |
| Czech Namedays Calendar | [GET](https://svatky.adresa.info/) | 402 | http_error | unknown | 288 | discovery |
| Czech National Bank | [GET](https://www.cnb.cz/cs/financni_trhy/devizovy_trh/kurzy_devizoveho_trhu/denni_kurz.xml/) | 200 | not_json | unknown | 427 | discovery |
| Danbooru | [GET](https://danbooru.donmai.us/posts?tags=help%3Aapi/) | 200 | ok_json | unknown | 317 | discovery |
| Danish data service Energi | [GET](https://www.energidataservice.dk/) | 200 | not_json | unknown | 537 | discovery |
| Danish Energi Data | [GET](https://www.energidataservice.dk/) | 200 | not_json | unknown | 57 | discovery |
| Data USA | [GET](https://datausa.io/about/api/) | 200 | not_json | unknown | 254 | discovery |
| data.gov.dk | [GET](https://data.gov.dk/api/) | 404 | http_error | unknown | 312 | discovery |
| Data.gov.sg | [GET](https://data.gov.sg/developer/) | 0 | network_error | unknown | 973 | discovery |
| data.norge.no | [GET](https://data.norge.no/api/) | 0 | network_error | unknown | 279 | discovery |
| Data.parliament.uk | [GET](https://explore.data.parliament.uk/?learnmore=Members/) | 406 | http_error | unknown | 259 | discovery |
| Dataflow Kit COVID-19 | [GET](https://covid-19.dataflowkit.com/) | 200 | not_json | unknown | 458 | discovery |
| Datamuse | [GET](https://www.datamuse.com/api/) | 200 | not_json | unknown | 583 | discovery |
| Datamuse API | [GET](https://www.datamuse.com/api/) | 200 | not_json | unknown | 388 | discovery |
| Datayes | [GET](https://m.datayes.com/) | 200 | not_json | unknown | 1230 | discovery |
| Deck of Cards API | [GET](https://deckofcardsapi.com/) | 200 | not_json | free | 645 | discovery |
| Deepcode | [GET](https://www.deepcode.ai/) | 0 | network_error | unknown | 929 | discovery |
| DeFiLlama API | [GET](https://defillama.com/docs/api/) | 0 | network_error | free | 288 | discovery |
| Dendron | [GET](https://dendron.so/) | 200 | not_json | unknown | 148 | discovery |
| Destatis API | [GET](https://www-genesis.destatis.de/genesis/online/) | 0 | network_error | unknown | 605 | discovery |
| Destatis Germany | [GET](https://destatis.de/) | 0 | network_error | unknown | 456 | discovery |
| Detect Language API | [GET](https://rapidapi.com/BigLobster/api/language-identification-prediction/) | 0 | network_error | unknown | 612 | discovery |
| DevITjobs UK | [GET](https://devitjobs.uk/job_feed.xml/) | 0 | network_error | unknown | 329 | discovery |
| Devpod | [GET](https://devpod.sh/) | 200 | not_json | unknown | 620 | discovery |
| DIBS | [GET](https://tech.dibspayment.com/) | 0 | network_error | unknown | 119 | discovery |
| Dicebear Avatars | [GET](https://avatars.dicebear.com/) | 0 | network_error | unknown | 263 | discovery |
| DigiDates | [GET](https://digidates.de/en/) | 200 | not_json | unknown | 365 | discovery |
| DigiDates API | [GET](https://digidates.de/en/) | 200 | not_json | free | 118 | discovery |
| Digimon Information | [GET](https://digimon-api.vercel.app/) | 200 | not_json | unknown | 684 | discovery |
| DigitalOcean Spaces | [GET](https://www.digitalocean.com/products/spaces/) | 0 | network_error | unknown | 540 | discovery |
| DigitalOcean Status | [GET](https://status.digitalocean.com/api/) | 406 | http_error | unknown | 901 | discovery |
| Digitraffic Finland | [GET](https://www.digitraffic.fi/) | 200 | not_json | unknown | 406 | discovery |
| Diigo | [GET](https://www.diigo.com/api_dev/) | 200 | not_json | unknown | 1162 | discovery |
| Dingtalk | [GET](https://open-doc.dingtalk.com/) | 0 | network_error | unknown | 1364 | discovery |
| Disify | [GET](https://www.disify.com/) | 0 | network_error | unknown | 416 | discovery |
| Disney | [GET](https://disneyapi.dev/) | 200 | not_json | unknown | 364 | discovery |
| Disney API | [GET](https://disneyapi.dev/) | 200 | not_json | unknown | 66 | discovery |
| DMI | [GET](https://www.dmi.dk/) | 200 | not_json | unknown | 366 | discovery |
| Dog CEO | [GET](https://dog.ceo/api/breeds/image/random) | 200 | ok_json | unknown | 387 | discovery |
| Dogs | [GET](https://dog.ceo/dog-api/) | 200 | not_json | unknown | 139 | discovery |
| Dogs API | [GET](https://dog.ceo/dog-api/) | 200 | not_json | unknown | 144 | discovery |
| Dokku | [GET](https://dokku.com/) | 200 | not_json | unknown | 857 | discovery |
| DomainDb Info | [GET](https://api.domainsdb.info/) | 200 | ok_json | unknown | 645 | discovery |
| Domainsdb.info | [GET](https://domainsdb.info/) | 200 | not_json | unknown | 517 | discovery |
| Domoticz | [GET](https://domoticz.com/) | 200 | not_json | unknown | 507 | discovery |
| Driver.js | [GET](https://driverjs.com/) | 200 | not_json | unknown | 416 | discovery |
| Drivet URL Shortener | [GET](https://wiki.drivet.xyz/en/url-shortener/add-links/) | 0 | network_error | unknown | 727 | discovery |
| Drizzle ORM | [GET](https://orm.drizzle.team/docs/overview/) | 0 | network_error | unknown | 532 | discovery |
| DropMail | [GET](https://dropmail.me/api/) | 200 | not_json | unknown | 6710 | discovery |
| Drupal.org | [GET](https://www.drupal.org/drupalorg/docs/api/) | 0 | network_error | unknown | 1185 | discovery |
| DSB Statistics Denmark | [GET](https://api.statbank.dk/v1/) | 404 | http_error | unknown | 889 | discovery |
| DuckDuckGo | [GET](https://duckduckgo.com/api/) | 0 | network_error | unknown | 1205 | discovery |
| Ducks Unlimited | [GET](https://gis.ducks.org/datasets/du-university-chapters/api/) | 200 | not_json | unknown | 3076 | discovery |
| Dungeons and Dragons (Alternate) | [GET](https://open5e.com/) | 200 | not_json | unknown | 2521 | discovery |
| Duolingo API | [GET](https://www.duolingo.com/) | 200 | not_json | unknown | 1259 | discovery |
| Dutch CBS API | [GET](https://www.cbs.nl/en-gb/our-services/open-data/) | 200 | not_json | free | 1414 | discovery |
| DVC | [GET](https://dvc.org/) | 200 | not_json | free | 5657 | discovery |
| Dynamic QR Code | [GET](https://rapidapi.com/updeploy-tools/api/qr-code-dynamic-and-static1/details/) | 0 | network_error | unknown | 1386 | discovery |
| ECB API | [GET](https://data.ecb.europa.eu/) | 200 | not_json | free | 3241 | discovery |
| ECB Exchange Rates | [GET](https://www.ecb.europa.eu/stats/eurofxref/) | 0 | network_error | free | 1122 | discovery |
| Econdb | [GET](https://www.econdb.com/api/) | 200 | ok_json | unknown | 2179 | discovery |
| Ecuador Open Data API | [GET](https://datosabiertos.gob.ec/) | 403 | auth_required | free | 2331 | discovery |
| Egypt Open Data API | [GET](https://data.gov.eg/) | 0 | timeout | free | 8008 | discovery |
| EnergyStar | [GET](https://energystar.gov/) | 0 | network_error | unknown | 1877 | discovery |
| English Random Words | [GET](https://random-words-api.vercel.app/word/) | 200 | ok_json | unknown | 2224 | discovery |
| Ensembl | [GET](https://ensembl.org/) | 0 | network_error | unknown | 260 | discovery |
| Ensembl API | [GET](https://rest.ensembl.org/) | 0 | timeout | unknown | 8249 | discovery |
| Entur | [GET](https://api.entur.io/) | 404 | http_error | unknown | 317 | discovery |
| Environment Agency | [GET](https://environment.data.gov.uk/) | 200 | not_json | unknown | 549 | discovery |
| Environment Canada API | [GET](https://dd.weather.gc.ca/) | 200 | not_json | free | 665 | discovery |
| EPA API | [GET](https://www.epa.gov/enviro/web-services/) | 0 | network_error | free | 563 | discovery |
| Ergast F1 API | [GET](https://ergast.com/mrd/) | 0 | network_error | free | 290 | discovery |
| ESPN | [GET](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b/) | 404 | http_error | free | 542 | discovery |
| Ethiopia Open Data API | [GET](https://data.gov.et/) | 0 | network_error | free | 510 | discovery |
| EU Data Portal API | [GET](https://data.europa.eu/api/hub/repo/) | 200 | not_json | unknown | 703 | discovery |
| EU Open Data | [GET](https://data.europa.eu/en/) | 0 | network_error | unknown | 80 | discovery |
| EU Open Data Portal | [GET](https://data.europa.eu/en/) | 0 | network_error | free | 116 | discovery |
| EU Open Data Portal API | [GET](https://data.europa.eu/en/publications/dataeuropa-academy/) | 404 | http_error | free | 724 | discovery |
| Euromap 77 | [GET](https://www.euromap.org/euromap77/) | 200 | not_json | unknown | 303 | discovery |
| European Space Agency API | [GET](https://api.esa.int/) | 0 | network_error | free | 61 | discovery |
| European Union | [GET](https://data.europa.eu/api/) | 404 | http_error | unknown | 70 | discovery |
| Eurostat API | [GET](https://ec.europa.eu/eurostat/web/main/data/web-services/) | 200 | not_json | free | 352 | discovery |
| EVA | [GET](https://eva.pingutil.com/) | 0 | network_error | unknown | 118 | discovery |
| EVA Email Validation | [GET](https://eva.pingutil.com/) | 0 | network_error | unknown | 28 | discovery |
| Evil Insult Generator | [GET](https://evilinsult.com/api/) | 200 | not_json | unknown | 315 | discovery |
| Exchangerate.host | [GET](https://exchangerate.host/) | 200 | not_json | unknown | 898 | discovery |
| Excuser | [GET](https://excuser.herokuapp.com/) | 404 | http_error | unknown | 808 | discovery |
| Excuser API | [GET](https://excuser.herokuapp.com/) | 404 | http_error | unknown | 200 | discovery |
| F1 Data | [GET](https://formula1.com/) | 0 | network_error | unknown | 422 | discovery |
| Fabric (Firebase) | [GET](https://firebase.google.com/) | 200 | not_json | unknown | 587 | discovery |
| Faker | [GET](https://fakerapi.it/) | 502 | http_error | unknown | 365 | discovery |
| Faker API | [GET](https://fakerapi.it/) | 502 | http_error | unknown | 54 | discovery |
| FakeStoreAPI | [GET](https://fakestoreapi.com/) | 200 | not_json | unknown | 275 | discovery |
| Falco | [GET](https://falco.org/) | 200 | not_json | unknown | 280 | discovery |
| FAO | [GET](https://fao.org/) | 0 | network_error | unknown | 116 | discovery |
| FAO API | [GET](https://www.fao.org/faostat/en/) | 200 | not_json | free | 289 | discovery |
| FASS | [GET](https://www.fass.se/LIF/developer/) | 0 | network_error | unknown | 275 | discovery |
| FBI Wanted | [GET](https://www.fbi.gov/wanted/api/) | 200 | not_json | unknown | 759 | discovery |
| FDA | [GET](https://open.fda.gov/apis/) | 200 | not_json | free | 472 | discovery |
| FDA API | [GET](https://open.fda.gov/apis/) | 200 | not_json | free | 81 | discovery |
| FDA Drug API | [GET](https://open.fda.gov/apis/drug/) | 200 | not_json | unknown | 372 | discovery |
| FDA Food | [GET](https://api.fda.gov/) | 404 | http_error | unknown | 1472 | discovery |
| Fed Treasury | [GET](https://fiscaldata.treasury.gov/api-documentation/) | 200 | not_json | unknown | 1140 | discovery |
| Federal Register | [GET](https://www.federalregister.gov/reader-aids/developer-resources/rest-api/) | 0 | network_error | unknown | 611 | discovery |
| Feodo Tracker API | [GET](https://feodotracker.abuse.ch/) | 200 | not_json | free | 210 | discovery |
| FFXIV Collect | [GET](https://ffxivcollect.com/) | 406 | http_error | unknown | 366 | discovery |
| FIFA Ultimate Team | [GET](https://www.easports.com/fifa/ultimate-team/api/fut/item/) | 503 | http_error | unknown | 304 | discovery |
| FIFA Women's World Cup | [GET](https://worldcup.sfg.io/) | 0 | network_error | unknown | 118 | discovery |
| FIFA World Cup | [GET](https://worldcup.sfg.io/) | 0 | network_error | unknown | 103 | discovery |
| File.io | [GET](https://www.file.io/) | 200 | not_json | unknown | 464 | discovery |
| FilterLists | [GET](https://filterlists.com/) | 200 | not_json | unknown | 2224 | discovery |
| Final Fantasy XIV | [GET](https://xivapi.com/) | 0 | network_error | unknown | 226 | discovery |
| Finnish Meteorological Institute | [GET](https://en.ilmatieteenlaitos.fi/open-data/) | 200 | not_json | unknown | 2113 | discovery |
| Fixer | [GET](https://fixer.io/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers/) | 200 | not_json | unknown | 2617 | discovery |
| Fleep | [GET](https://fleep.io/fleepapi/) | 200 | not_json | unknown | 1969 | discovery |
| Focalboard | [GET](https://focalboard.com/) | 530 | http_error | unknown | 885 | discovery |
| Football (Soccer) Videos | [GET](https://www.scorebat.com/video-api/) | 200 | not_json | unknown | 549 | discovery |
| Forgejo | [GET](https://forgejo.org/) | 200 | not_json | unknown | 336 | discovery |
| France Data API | [GET](https://www.data.gouv.fr/en/) | 0 | network_error | unknown | 416 | discovery |
| Frankfurter | [GET](https://api.frankfurter.dev/v1/latest) | 200 | ok_json | free | 331 | yes |
| Frankfurter API | [GET](https://api.frankfurter.dev/v1/latest) | 200 | duplicate_frankfurter | free | 28 | discovery |
| Free Dictionary | [GET](https://dictionaryapi.dev/) | 200 | not_json | unknown | 483 | discovery |
| Free Dictionary API | [GET](https://dictionaryapi.dev/) | 200 | not_json | unknown | 109 | discovery |
| freeCodeCamp | [GET](https://www.freecodecamp.org/) | 200 | not_json | free | 546 | discovery |
| freeCodeCamp API | [GET](https://www.freecodecamp.org/news/the-freecodecamp-api/) | 404 | http_error | unknown | 378 | discovery |
| FreeForexAPI | [GET](https://freeforexapi.com/Home/Api/) | 0 | timeout | unknown | 8010 | discovery |
| FreeToGame | [GET](https://www.freetogame.com/api-doc/) | 200 | not_json | unknown | 284 | discovery |
| French Address Search | [GET](https://geo.api.gouv.fr/adresse/) | 404 | http_error | unknown | 339 | discovery |
| French INSEE API | [GET](https://api.insee.fr/) | 0 | network_error | free | 425 | discovery |
| Fruityvice | [GET](https://www.fruityvice.com/) | 200 | not_json | unknown | 435 | discovery |
| Fuck Off as a Service | [GET](https://www.foaas.com/) | 200 | not_json | unknown | 211 | discovery |
| FuelEconomy.gov | [GET](https://www.fueleconomy.gov/feg/ws/) | 200 | not_json | unknown | 1025 | discovery |
| Fun Fact | [GET](https://api.aakhilv.me/) | 200 | not_json | unknown | 470 | discovery |
| Fun Fact API | [GET](https://api.aakhilv.me/) | 200 | not_json | unknown | 238 | discovery |
| Fun Facts | [GET](https://asli-fun-fact-api.herokuapp.com/) | 404 | http_error | unknown | 517 | discovery |
| FunTranslations | [GET](https://api.funtranslations.com/) | 403 | auth_required | unknown | 123 | discovery |
| Game of Thrones Quotes | [GET](https://gameofthronesquotes.xyz/) | 200 | not_json | unknown | 377 | discovery |
| GamerPower | [GET](https://www.gamerpower.com/api-read/) | 0 | network_error | unknown | 216 | discovery |
| GBIF | [GET](https://www.gbif.org/developer/summary/) | 403 | auth_required | unknown | 212 | discovery |
| GBIF API | [GET](https://www.gbif.org/developer/summary/) | 403 | auth_required | unknown | 96 | discovery |
| GDBrowser | [GET](https://gdbrowser.com/api/) | 200 | not_json | unknown | 247 | discovery |
| GDPR API | [GET](https://gdpr-info.eu/) | 200 | not_json | unknown | 304 | discovery |
| Genderize | [GET](https://genderize.io/) | 406 | http_error | unknown | 710 | discovery |
| Genderize.io | [GET](https://genderize.io/) | 406 | http_error | unknown | 143 | discovery |
| Genrenator | [GET](https://binaryjazz.us/genrenator-api/) | 200 | not_json | unknown | 1408 | discovery |
| Genshin Impact | [GET](https://genshin.dev/) | 200 | not_json | unknown | 289 | discovery |
| Genshin Impact API | [GET](https://genshin.dev/) | 200 | not_json | unknown | 85 | discovery |
| Geocode.xyz | [GET](https://geocode.xyz/api/) | 200 | not_json | unknown | 912 | discovery |
| Geodata.gov.gr | [GET](https://geodata.gov.gr/en/) | 0 | network_error | unknown | 359 | discovery |
| GeographQL | [GET](https://geographql.netlify.app/) | 200 | not_json | unknown | 260 | discovery |
| GeoJS | [GET](https://www.geojs.io/) | 200 | not_json | unknown | 321 | discovery |
| Geokeo | [GET](https://geokeo.com/) | 200 | not_json | unknown | 815 | discovery |
| geoPlugin | [GET](https://www.geoplugin.com/) | 200 | not_json | unknown | 761 | discovery |
| Germany Data API | [GET](https://www.govdata.de/) | 200 | not_json | unknown | 482 | discovery |
| Ghana Open Data API | [GET](https://data.gov.gh/) | 0 | network_error | free | 666 | discovery |
| Ghostwriter | [GET](https://ghostwriter.kde.org/) | 200 | not_json | unknown | 315 | discovery |
| Git.io | [GET](https://github.blog/2011-11-10-git-io-github-url-shortener/) | 0 | network_error | unknown | 334 | discovery |
| Gitea | [GET](https://gitea.io/) | 0 | network_error | unknown | 119 | discovery |
| GitHub Contribution Chart Generator | [GET](https://github-contributions.vercel.app/) | 200 | not_json | unknown | 500 | discovery |
| GitHub Contributions | [GET](https://github-contributions.vercel.app/) | 200 | not_json | unknown | 180 | discovery |
| Gogs | [GET](https://gogs.io/) | 0 | network_error | unknown | 254 | discovery |
| Google BigQuery API | [GET](https://cloud.google.com/bigquery/docs/reference/rest/v2/) | 0 | network_error | unknown | 192 | discovery |
| goQR.me | [GET](https://goqr.me/) | 200 | not_json | unknown | 387 | discovery |
| GPT4All | [GET](https://gpt4all.io/) | 0 | network_error | free | 251 | discovery |
| GraphQL Jobs | [GET](https://graphql.jobs/docs/api/) | 0 | network_error | unknown | 37 | discovery |
| Graphs for Coronavirus | [GET](https://corona.dnsforfamily.com/api.txt/) | 0 | network_error | unknown | 33 | discovery |
| Gravatar | [GET](https://en.gravatar.com/) | 0 | network_error | unknown | 559 | discovery |
| Gravatar API | [GET](https://en.gravatar.com/site/implement/) | 0 | network_error | free | 182 | discovery |
| GroupMe | [GET](https://dev.groupme.com/docs/v3/) | 200 | not_json | unknown | 784 | discovery |
| GrünstromIndex | [GET](https://gruenstromindex.de/) | 200 | not_json | unknown | 362 | discovery |
| Grype | [GET](https://anchore.com/) | 200 | not_json | unknown | 952 | discovery |
| GTFS Regional | [GET](https://www.trafiklab.se/api/gtfs-regional/) | 404 | http_error | unknown | 282 | discovery |
| Gutendex | [GET](https://gutendex.com/) | 200 | not_json | unknown | 151 | discovery |
| HAPI FHIR | [GET](https://hapifhir.io/) | 200 | not_json | unknown | 978 | discovery |
| Harry Potter API | [GET](https://hp-api.onrender.com/) | 200 | not_json | free | 289 | discovery |
| Harry Potter Charactes | [GET](https://hp-api.herokuapp.com/) | 404 | http_error | unknown | 331 | discovery |
| Hashable | [GET](https://hashable.space/pages/api/) | 0 | network_error | unknown | 545 | discovery |
| Hashnode | [GET](https://hashnode.com/) | 200 | not_json | unknown | 285 | discovery |
| HealthData.gov | [GET](https://healthdata.gov/) | 406 | http_error | unknown | 966 | discovery |
| Hebrew Calendar | [GET](https://www.hebcal.com/home/developer-apis/) | 0 | network_error | unknown | 670 | discovery |
| Helix | [GET](https://helix-editor.com/) | 200 | not_json | unknown | 196 | discovery |
| HelloSalut | [GET](https://fourtonfish.com/project/hellosalut-api/) | 0 | network_error | unknown | 746 | discovery |
| Hemingway Editor | [GET](https://hemingwayapp.com/) | 200 | not_json | freemium | 683 | discovery |
| heweather | [GET](https://www.heweather.com/documents/) | 404 | http_error | unknown | 1044 | discovery |
| Hipster Ipsum | [GET](https://hipsum.co/api/) | 200 | not_json | unknown | 721 | discovery |
| hitokoto | [GET](https://hitokoto.cn/api/) | 0 | network_error | unknown | 4952 | discovery |
| Homebrew | [GET](https://formulae.brew.sh/api/formula/git.json) | 200 | ok_json | free | 250 | yes |
| Hong Kong Data API | [GET](https://data.gov.hk/) | 0 | network_error | free | 891 | discovery |
| Hong Kong GeoData Store | [GET](https://geodata.gov.hk/gs/) | 0 | network_error | unknown | 165 | discovery |
| Hong Kong Open Data API | [GET](https://data.gov.hk/en/) | 200 | not_json | unknown | 250 | discovery |
| host-t.com | [GET](https://host-t.com/) | 0 | network_error | unknown | 701 | discovery |
| HTTP Cat | [GET](https://http.cat/) | 200 | not_json | unknown | 421 | discovery |
| HTTP Dog | [GET](https://http.dog/) | 200 | not_json | unknown | 356 | discovery |
| HTTP2.Pro | [GET](https://http2.pro/doc/api/) | 0 | network_error | unknown | 347 | discovery |
| Httpbin | [GET](https://httpbin.org/) | 200 | not_json | unknown | 826 | discovery |
| httpbin API | [GET](https://httpbin.org/) | 200 | not_json | unknown | 142 | discovery |
| Httpbin Cloudflare | [GET](https://cloudflare-quic.com/b/) | 404 | http_error | unknown | 715 | discovery |
| Human Protein Atlas | [GET](https://www.proteinatlas.org/about/help/dataaccess/) | 0 | network_error | unknown | 247 | discovery |
| Humanitarian Data Exchange | [GET](https://data.humdata.org/) | 200 | not_json | unknown | 896 | discovery |
| Hytale | [GET](https://hytale-api.com/) | 0 | timeout | unknown | 8014 | discovery |
| Hytale API | [GET](https://hytale-api.com/) | 0 | timeout | unknown | 8021 | discovery |
| IBGE Brazil Stats | [GET](https://servicodados.ibge.gov.br/api/) | 0 | network_error | unknown | 922 | discovery |
| icanhazdadjoke | [GET](https://icanhazdadjoke.com/api/) | 404 | http_error | unknown | 306 | discovery |
| Icanhazepoch | [GET](https://icanhazepoch.com/) | 0 | network_error | unknown | 849 | discovery |
| Icanhazip | [GET](https://major.io/icanhazip-com-faq/) | 200 | not_json | unknown | 331 | discovery |
| Iceland Inspire API | [GET](https://www.lmi.is/is/gagnaveita/) | 0 | network_error | unknown | 367 | discovery |
| Icelandic Met Office | [GET](https://en.vedur.is/about-imo/apis/) | 404 | http_error | unknown | 619 | discovery |
| Icon Horse | [GET](https://icon.horse/) | 200 | not_json | unknown | 593 | discovery |
| Icon Horse API | [GET](https://icon.horse/usage/) | 404 | http_error | unknown | 153 | discovery |
| Icons8 | [GET](https://img.icons8.com/) | 200 | not_json | unknown | 142 | discovery |
| IEA | [GET](https://iea.org/) | 0 | network_error | unknown | 287 | discovery |
| IFTTT | [GET](https://platform.ifttt.com/docs/connect_api/) | 0 | network_error | unknown | 284 | discovery |
| IMD India Weather | [GET](https://mausam.imd.gov.in/) | 200 | not_json | unknown | 2587 | discovery |
| IMF | [GET](https://datahelp.imf.org/knowledgebase/topics/125587/) | 0 | network_error | unknown | 33 | discovery |
| IMF Data API | [GET](https://datahelp.imf.org/knowledgebase/articles/667681/) | 0 | network_error | free | 72 | discovery |
| Imgflip | [GET](https://imgflip.com/api/) | 0 | network_error | unknown | 343 | discovery |
| Imsea | [GET](https://imsea.herokuapp.com/) | 404 | http_error | unknown | 561 | discovery |
| Indian Mutual Fund | [GET](https://www.mfapi.in/) | 200 | not_json | unknown | 760 | discovery |
| Indonesia Dictionary | [GET](https://new-kbbi-api.herokuapp.com/) | 404 | http_error | unknown | 489 | discovery |
| Indonesia Open Data API | [GET](https://data.go.id/) | 200 | not_json | free | 2001 | discovery |
| INSEE France | [GET](https://insee.fr/) | 0 | network_error | unknown | 406 | discovery |
| Instabox | [GET](https://www.instabox.se/) | 0 | network_error | unknown | 275 | discovery |
| Instapaper | [GET](https://www.instapaper.com/api/) | 200 | not_json | unknown | 1161 | discovery |
| Interpol Red Notices | [GET](https://interpol.api.bund.dev/) | 200 | not_json | unknown | 335 | discovery |
| Intro.js | [GET](https://introjs.com/) | 200 | not_json | unknown | 376 | discovery |
| IP 2 Country | [GET](https://ip2country.info/) | 200 | not_json | unknown | 289 | discovery |
| IP Address Details | [GET](https://ipinfo.io/) | 200 | ok_json | unknown | 1168 | discovery |
| IP Vigilante | [GET](https://www.ipvigilante.com/) | 0 | network_error | unknown | 695 | discovery |
| ipapi.co | [GET](https://ipapi.co/api/) | 200 | not_json | unknown | 1459 | discovery |
| IPGEO | [GET](https://api.techniknews.net/ipgeo/) | 0 | network_error | unknown | 379 | discovery |
| IPify | [GET](https://www.ipify.org/?format=json) | 200 | not_json | unknown | 262 | discovery |
| IRENA | [GET](https://irena.org/) | 0 | network_error | unknown | 239 | discovery |
| ISA-95 | [GET](https://www.isa.org/isa95/) | 0 | network_error | unknown | 667 | discovery |
| isEven | [GET](https://isevenapi.xyz/) | 200 | not_json | unknown | 724 | discovery |
| isEven (humor) | [GET](https://isevenapi.xyz/) | 200 | not_json | unknown | 279 | discovery |
| ISRO | [GET](https://isro.vercel.app/) | 200 | not_json | unknown | 296 | discovery |
| ISRO API | [GET](https://isro.vercel.app/) | 200 | not_json | unknown | 182 | discovery |
| Istanbul (İBB) Open Data | [GET](https://data.ibb.gov.tr/) | 200 | not_json | unknown | 1647 | discovery |
| ItsThisForThat | [GET](https://itsthisforthat.com/api.php/) | 200 | not_json | unknown | 326 | discovery |
| Ivory Coast Data API | [GET](https://data.gouv.ci/) | 200 | not_json | free | 2928 | discovery |
| Jan AI | [GET](https://jan.ai/) | 0 | network_error | unknown | 218 | discovery |
| Japan Statistics | [GET](https://stat.go.jp/) | 0 | network_error | unknown | 93 | discovery |
| Jawbone UP | [GET](https://jawbone.com/up/developer/) | 0 | network_error | unknown | 310 | discovery |
| Jikan | [GET](https://jikan.moe/) | 200 | not_json | unknown | 603 | discovery |
| Jikan MyAnimeList | [GET](https://jikan.moe/) | 200 | not_json | unknown | 262 | discovery |
| Jikan MyAnimeList API | [GET](https://jikan.moe/) | 200 | not_json | unknown | 240 | discovery |
| Jina Reader | [GET](https://jina.ai/reader/) | 200 | not_json | unknown | 594 | discovery |
| Jitsi | [GET](https://jitsi.org/) | 200 | not_json | free | 1038 | discovery |
| JMA API | [GET](https://www.jma.go.jp/) | 0 | network_error | free | 401 | discovery |
| JokeAPI | [GET](https://sv443.net/jokeapi/v2/) | 200 | not_json | unknown | 690 | discovery |
| Joplin | [GET](https://joplinapp.org/) | 200 | not_json | unknown | 619 | discovery |
| JSON 2 JSONP | [GET](https://json2jsonp.com/) | 200 | not_json | unknown | 370 | discovery |
| JSON Placeholder | [GET](https://jsonplaceholder.typicode.com/todos/1) | 200 | ok_json | free | 147 | yes |
| Juhe Data | [GET](https://www.juhe.cn/) | 200 | not_json | unknown | 2483 | discovery |
| Kadaster Netherlands | [GET](https://www.pdok.nl/) | 200 | not_json | unknown | 473 | discovery |
| Kakoune | [GET](https://kakoune.org/) | 200 | not_json | unknown | 394 | discovery |
| kanye.rest | [GET](https://kanye.rest/) | 200 | not_json | unknown | 303 | discovery |
| Kapiche | [GET](https://www.kapiche.com/api/) | 404 | http_error | unknown | 383 | discovery |
| Kartverket | [GET](https://kartkatalog.geonorge.no/) | 200 | not_json | unknown | 290 | discovery |
| Kenya Open Data API | [GET](https://opendata.go.ke/) | 0 | timeout | free | 8017 | discovery |
| Kickbox | [GET](https://open.kickbox.com/) | 200 | not_json | unknown | 798 | discovery |
| kimiquotes | [GET](https://kimiquotes.herokuapp.com/doc/) | 404 | http_error | unknown | 593 | discovery |
| KNBS Kenya Stats | [GET](https://www.knbs.or.ke/) | 0 | network_error | unknown | 586 | discovery |
| KNX | [GET](https://www.knx.org/) | 200 | not_json | unknown | 587 | discovery |
| KONTESTS | [GET](https://kontests.net/api/) | 0 | network_error | unknown | 126 | discovery |
| Korean Statistics | [GET](https://kostat.go.kr/) | 0 | network_error | unknown | 1427 | discovery |
| Kroki | [GET](https://kroki.io/health) | 200 | ok_json | unknown | 294 | discovery |
| Kube-bench | [GET](https://aquasec.com/) | 0 | network_error | unknown | 343 | discovery |
| Kubeflow | [GET](https://kubeflow.org/) | 0 | network_error | unknown | 703 | discovery |
| Kubescape | [GET](https://kubescape.io/) | 200 | not_json | unknown | 456 | discovery |
| LA Open Data API | [GET](https://data.lacity.org/) | 406 | http_error | unknown | 750 | discovery |
| Lantmäteriet | [GET](https://www.lantmateriet.se/sv/Om-Lantmateriet/Oppna-data/) | 404 | http_error | unknown | 214 | discovery |
| Lapce | [GET](https://lapce.dev/) | 0 | network_error | unknown | 229 | discovery |
| LAPIS | [GET](https://cov-spectrum.ethz.ch/public/) | 0 | network_error | unknown | 316 | discovery |
| Laravel China | [GET](https://laravel-china.org/topics/3097/) | 0 | timeout | unknown | 8153 | discovery |
| Launch Library | [GET](https://thespacedevs.com/) | 200 | not_json | unknown | 929 | discovery |
| Launch Library 2 | [GET](https://thespacedevs.com/llapi/) | 200 | not_json | unknown | 269 | discovery |
| Leaflet | [GET](https://leafletjs.com/) | 200 | not_json | free | 230 | discovery |
| Lido | [GET](https://lido.fi/) | 200 | not_json | unknown | 317 | discovery |
| LightwaveRF | [GET](https://api.lightwaverf.com/) | 0 | network_error | unknown | 281 | discovery |
| LM Studio | [GET](https://lmstudio.ai/) | 200 | not_json | unknown | 366 | discovery |
| Lobsters API | [GET](https://lobste.rs/newest.json) | 200 | ok_json | free | 458 | yes |
| LocalAI | [GET](https://localai.io/) | 200 | not_json | free | 237 | discovery |
| Localbitcoins | [GET](https://localbitcoins.com/api-docs/) | 404 | http_error | unknown | 157 | discovery |
| Logseq | [GET](https://logseq.com/) | 200 | not_json | free | 247 | discovery |
| LonWorks | [GET](https://www.echelon.com/) | 0 | network_error | unknown | 1246 | discovery |
| LoRaWAN | [GET](https://lora-alliance.org/) | 200 | not_json | unknown | 261 | discovery |
| Lordicon | [GET](https://lordicon.com/) | 200 | not_json | unknown | 241 | discovery |
| Lorem Ipsum | [GET](https://loremipsum.io/api/) | 404 | http_error | free | 755 | discovery |
| Lorem Ipsum API | [GET](https://loripsum.net/) | 0 | network_error | free | 297 | discovery |
| Lorem Picsum | [GET](https://picsum.photos/) | 200 | not_json | unknown | 232 | discovery |
| Lorem Space | [GET](https://lorem.space/api/) | 0 | timeout | unknown | 8320 | discovery |
| Lua Decompiler | [GET](https://lua-decompiler.ferib.dev/) | 0 | network_error | unknown | 67 | discovery |
| Luchtmeetnet | [GET](https://api-docs.luchtmeetnet.nl/) | 200 | ok_json | unknown | 1378 | discovery |
| Lucia Auth | [GET](https://lucia-auth.com/) | 200 | not_json | unknown | 381 | discovery |
| Lyrics.ovh | [GET](https://lyricsovh.docs.apiary.io/) | 0 | timeout | unknown | 8044 | discovery |
| MailCheck.ai | [GET](https://www.mailcheck.ai/) | 0 | network_error | unknown | 395 | discovery |
| Malaysia Open Data API | [GET](https://data.gov.my/) | 200 | not_json | free | 952 | discovery |
| Mark Text | [GET](https://marktext.app/) | 200 | not_json | unknown | 928 | discovery |
| markerapi | [GET](https://markerapi.com/) | 521 | http_error | unknown | 360 | discovery |
| Marketstack | [GET](https://marketstack.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers/) | 200 | not_json | unknown | 746 | discovery |
| Maven Central | [GET](https://search.maven.org/) | 200 | not_json | free | 172 | discovery |
| MealDB API | [GET](https://www.themealdb.com/api.php/) | 200 | not_json | unknown | 241 | discovery |
| Mempool | [GET](https://mempool.space/api/) | 0 | network_error | unknown | 433 | discovery |
| Mempool API | [GET](https://mempool.space/api/) | 0 | network_error | unknown | 99 | discovery |
| MercadoBitcoin | [GET](https://www.mercadobitcoin.com.br/api-doc/) | 404 | http_error | unknown | 314 | discovery |
| Messari | [GET](https://messari.io/api/) | 429 | rate_limited | unknown | 221 | discovery |
| Messari API | [GET](https://messari.io/api/) | 429 | rate_limited | unknown | 31 | discovery |
| MET Norway | [GET](https://api.met.no/) | 200 | not_json | unknown | 1800 | discovery |
| Metabase | [GET](https://www.metabase.com/) | 200 | not_json | unknown | 2113 | discovery |
| MetaWeather | [GET](https://www.metaweather.com/api/) | 0 | network_error | unknown | 78 | discovery |
| Meteoam Italy | [GET](https://www.meteoam.it/) | 0 | network_error | unknown | 2227 | discovery |
| Mexico Open Data API | [GET](https://datos.gob.mx/) | 403 | auth_required | free | 2165 | discovery |
| MicroENV | [GET](https://microenv.com/) | 0 | network_error | unknown | 897 | discovery |
| Microlink.io | [GET](https://microlink.io/) | 200 | not_json | unknown | 1169 | discovery |
| Microsoft Graph OneDrive | [GET](https://graph.microsoft.io/en-us/docs/api-reference/v1.0/resources/onedrive/) | 0 | network_error | unknown | 781 | discovery |
| Microsoft Security Response Center (MSRC) | [GET](https://msrc.microsoft.com/report/developer/) | 200 | not_json | unknown | 420 | discovery |
| Minecraft Server Status | [GET](https://api.mcsrvstat.us/) | 200 | not_json | unknown | 3625 | discovery |
| Mineral Database API | [GET](https://www.mindat.org/api.php/) | 403 | auth_required | unknown | 440 | discovery |
| Mirage JS | [GET](https://miragejs.com/) | 200 | not_json | free | 1038 | discovery |
| Mirror Networking | [GET](https://mirror-networking.com/) | 200 | not_json | unknown | 1305 | discovery |
| Misfit | [GET](https://build.misfit.com/) | 0 | network_error | unknown | 255 | discovery |
| MLB API | [GET](https://statsapi.mlb.com/) | 200 | not_json | unknown | 894 | discovery |
| MLB Data API | [GET](https://statsapi.mlb.com/api/v1/sports) | 200 | ok_json | free | 716 | yes |
| MLB StatsAPI | [GET](https://statsapi.mlb.com/api/) | 404 | http_error | unknown | 724 | discovery |
| MMO Games | [GET](https://www.mmobomb.com/api/) | 403 | auth_required | unknown | 483 | discovery |
| Mockoon | [GET](https://mockoon.com/) | 200 | not_json | free | 1661 | discovery |
| Mocky | [GET](https://designer.mocky.io/) | 0 | network_error | unknown | 1046 | discovery |
| Mojio | [GET](https://www.moj.io/developer/) | 200 | not_json | unknown | 1534 | discovery |
| Moodle | [GET](https://moodle.org/) | 403 | auth_required | unknown | 1830 | discovery |
| Moon Phase API | [GET](https://www.farmsense.net/api/astro-widgets/) | 200 | not_json | unknown | 1751 | discovery |
| Morocco Open Data API | [GET](https://data.gov.ma/) | 200 | not_json | free | 1584 | discovery |
| Motivational Quotes | [GET](https://nodejs-quoteapp.herokuapp.com/) | 404 | http_error | unknown | 913 | discovery |
| MovieGlu | [GET](https://www.movieglu.com/) | 0 | network_error | unknown | 1090 | discovery |
| MSW | [GET](https://mswjs.io/) | 200 | not_json | free | 228 | discovery |
| MTConnect | [GET](https://www.mtconnect.org/) | 200 | not_json | unknown | 717 | discovery |
| MusicBrainz | [GET](https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2/) | 0 | network_error | unknown | 478 | discovery |
| My Anime List API | [GET](https://jikan.moe/) | 200 | not_json | unknown | 467 | discovery |
| MY IP | [GET](https://www.myip.com/api-docs/) | 200 | not_json | unknown | 744 | discovery |
| MY IP API | [GET](https://www.myip.com/api-docs/) | 200 | not_json | unknown | 210 | discovery |
| myStrom | [GET](https://mystrom.ch/de/mystrom-api/) | 404 | http_error | unknown | 1084 | discovery |
| myStrom API | [GET](https://mystrom.ch/de/mystrom-api/) | 404 | http_error | free | 609 | discovery |
| Nager Date | [GET](https://date.nager.at/) | 0 | network_error | unknown | 221 | discovery |
| Nager.Date API | [GET](https://date.nager.at/Api/) | 0 | network_error | free | 198 | discovery |
| Namedays Calendar | [GET](https://nameday.abalin.net/) | 200 | not_json | unknown | 262 | discovery |
| NASA EONET | [GET](https://eonet.gsfc.nasa.gov/docs/v3/) | 0 | network_error | unknown | 645 | discovery |
| NASA POWER API | [GET](https://power.larc.nasa.gov/docs/services/api/) | 200 | not_json | unknown | 190 | discovery |
| National Grid ESO | [GET](https://data.nationalgrideso.com/) | 0 | network_error | unknown | 96 | discovery |
| National Vulnerability Database | [GET](https://nvd.nist.gov/vuln/Data-Feeds/JSON-feed-changelog/) | 0 | network_error | unknown | 609 | discovery |
| Nationalize | [GET](https://nationalize.io/) | 406 | http_error | unknown | 693 | discovery |
| Nationalize.io | [GET](https://nationalize.io/) | 406 | http_error | unknown | 173 | discovery |
| NBA Stats | [GET](https://any-api.com/nba_com/nba_com/docs/API_Description/) | 0 | network_error | unknown | 144 | discovery |
| NBB Belgium | [GET](https://www.nbb.be/en/statistics/) | 0 | network_error | unknown | 249 | discovery |
| NBP Poland API | [GET](https://api.nbp.pl/) | 406 | http_error | unknown | 411 | discovery |
| NBS China | [GET](https://stats.gov.cn/) | 0 | network_error | unknown | 1088 | discovery |
| NBS Nigeria Stats | [GET](https://nigerianstat.gov.ng/) | 0 | timeout | unknown | 8016 | discovery |
| NBU Ukraine API | [GET](https://bank.gov.ua/control/en/publish/article/) | 0 | network_error | unknown | 687 | discovery |
| NemID | [GET](https://www.nets.eu/developer/) | 200 | not_json | unknown | 1339 | discovery |
| Neovim | [GET](https://neovim.io/) | 200 | not_json | unknown | 391 | discovery |
| Netherlands Data API | [GET](https://data.overheid.nl/) | 200 | not_json | unknown | 911 | discovery |
| Newsblur | [GET](https://newsblur.com/api/) | 200 | not_json | unknown | 457 | discovery |
| Newton | [GET](https://newton.vercel.app/) | 200 | not_json | unknown | 769 | discovery |
| Newton Math | [GET](https://newton.vercel.app/) | 200 | not_json | unknown | 39 | discovery |
| Newton Math API | [GET](https://newton.vercel.app/) | 200 | not_json | unknown | 112 | discovery |
| Nexchange | [GET](https://nexchange2.docs.apiary.io/) | 0 | timeout | unknown | 8003 | discovery |
| NHL API | [GET](https://api-web.nhle.com/v1/) | 404 | http_error | unknown | 339 | discovery |
| NHTSA | [GET](https://vpic.nhtsa.dot.gov/api/) | 200 | not_json | unknown | 480 | discovery |
| Nick Cannon Baby API | [GET](https://nick-cannon-baby-api.onrender.com/) | 200 | not_json | free | 343 | discovery |
| Nigeria Open Data API | [GET](https://nigerianstat.gov.ng/) | 0 | timeout | free | 8001 | discovery |
| NIST Chemistry WebBook | [GET](https://webbook.nist.gov/) | 406 | http_error | unknown | 522 | discovery |
| NMBS/SNCB Belgium | [GET](https://www.belgiantrain.be/en/travel-info/preparing-for-your-journey/use-data/) | 403 | auth_required | unknown | 185 | discovery |
| Nobel Prize | [GET](https://www.nobelprize.org/about/developer-zone-2/) | 200 | not_json | unknown | 220 | discovery |
| Nobel Prize API | [GET](https://www.nobelprize.org/about/developer-zone-2/) | 200 | not_json | unknown | 37 | discovery |
| Noctua | [GET](https://api.noctuasky.com/api/v1/swaggerdoc/) | 404 | http_error | unknown | 527 | discovery |
| Node-RED | [GET](https://nodered.org/) | 200 | not_json | unknown | 283 | discovery |
| Nominatim | [GET](https://nominatim.org/release-docs/latest/api/Overview/) | 200 | not_json | unknown | 365 | discovery |
| Nominatim API | [GET](https://nominatim.org/release-docs/latest/api/Overview/) | 200 | not_json | unknown | 94 | discovery |
| Non-Working Days | [GET](https://isdayoff.ru/) | 0 | network_error | unknown | 327 | discovery |
| Non-Working Days 2 | [GET](https://isdayoff.ru/) | 0 | network_error | unknown | 93 | discovery |
| Norwegian MET Weather | [GET](https://api.met.no/) | 200 | not_json | unknown | 174 | discovery |
| Notation | [GET](https://notaryproject.dev/) | 200 | not_json | unknown | 442 | discovery |
| Notifee API | [GET](https://notifee.app/) | 200 | not_json | unknown | 432 | discovery |
| NPPES | [GET](https://npiregistry.cms.hhs.gov/registry/help-api/) | 200 | not_json | unknown | 642 | discovery |
| Numverify | [GET](https://numverify.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers/) | 200 | not_json | unknown | 990 | discovery |
| NYC Open Data API | [GET](https://opendata.cityofnewyork.us/) | 0 | network_error | unknown | 374 | discovery |
| NZ Open Data API | [GET](https://data.govt.nz/) | 200 | not_json | free | 791 | discovery |
| Obsidian | [GET](https://obsidian.md/) | 200 | not_json | freemium | 116 | discovery |
| Ocean Biogeographic | [GET](https://obis.org/) | 200 | not_json | unknown | 290 | discovery |
| Ocean Facts | [GET](https://oceanfacts.herokuapp.com/) | 404 | http_error | unknown | 553 | discovery |
| OceanCurrent | [GET](https://imos.org.au/facilities/oceandata/) | 404 | http_error | unknown | 2249 | discovery |
| Oddsmagnet | [GET](https://data.oddsmagnet.com/) | 0 | network_error | unknown | 246 | discovery |
| OECD | [GET](https://data.oecd.org/) | 403 | auth_required | free | 207 | discovery |
| OECD API | [GET](https://data.oecd.org/api/) | 403 | auth_required | free | 92 | discovery |
| Official Joke API | [GET](https://official-joke-api.appspot.com/random_joke) | 200 | ok_json | free | 856 | yes |
| Ollama | [GET](https://ollama.ai/) | 0 | network_error | free | 103 | discovery |
| ONS UK | [GET](https://ons.gov.uk/) | 0 | network_error | unknown | 213 | discovery |
| ONS UK Statistics | [GET](https://api.ons.gov.uk/) | 200 | ok_json | unknown | 351 | discovery |
| OnWater | [GET](https://onwater.io/) | 0 | network_error | unknown | 238 | discovery |
| OPC UA | [GET](https://opcfoundation.org/developer-tools/) | 200 | not_json | unknown | 1928 | discovery |
| Open Ag Data | [GET](https://openag.io/) | 200 | not_json | unknown | 368 | discovery |
| Open Brewery DB | [GET](https://www.openbrewerydb.org/v1/breweries?per_page=1) | 404 | http_error | unknown | 240 | discovery |
| Open Charge Map | [GET](https://openchargemap.org/site/develop/api/) | 0 | network_error | unknown | 227 | discovery |
| Open Data Minneapolis | [GET](https://opendata.minneapolismn.gov/) | 200 | not_json | unknown | 629 | discovery |
| Open Data NHS Scotland | [GET](https://www.opendata.nhs.scot/) | 200 | not_json | unknown | 1666 | discovery |
| Open Disease | [GET](https://disease.sh/) | 200 | not_json | unknown | 656 | discovery |
| Open Food Facts | [GET](https://world.openfoodfacts.org/api/) | 404 | http_error | unknown | 333 | discovery |
| Open Food Facts API | [GET](https://world.openfoodfacts.org/data/) | 403 | auth_required | unknown | 84 | discovery |
| Open Government, ACT | [GET](https://www.data.act.gov.au/) | 406 | http_error | unknown | 1465 | discovery |
| Open Government, Argentina | [GET](https://datos.gob.ar/) | 200 | not_json | unknown | 1442 | discovery |
| Open Government, Australia | [GET](https://www.data.gov.au/) | 200 | not_json | unknown | 528 | discovery |
| Open Government, Austria | [GET](https://www.data.gv.at/) | 200 | not_json | unknown | 264 | discovery |
| Open Government, Belgium | [GET](https://data.gov.be/) | 0 | network_error | unknown | 355 | discovery |
| Open Government, Colombia | [GET](https://www.dane.gov.co/) | 200 | not_json | unknown | 1014 | discovery |
| Open Government, Cyprus | [GET](https://data.gov.cy/?language=en/) | 200 | not_json | unknown | 910 | discovery |
| Open Government, Czech Republic | [GET](https://data.gov.cz/english/) | 200 | not_json | unknown | 368 | discovery |
| Open Government, Denmark | [GET](https://www.opendata.dk/) | 200 | not_json | unknown | 370 | discovery |
| Open Government, Finland | [GET](https://www.avoindata.fi/en/) | 0 | network_error | unknown | 352 | discovery |
| Open Government, Germany | [GET](https://www.govdata.de/daten/-/details/govdata-metadatenkatalog/) | 0 | network_error | unknown | 243 | discovery |
| Open Government, Italy | [GET](https://www.dati.gov.it/) | 200 | not_json | unknown | 437 | discovery |
| Open Government, Lithuania | [GET](https://data.gov.lt/public/api/1/) | 200 | not_json | unknown | 236 | discovery |
| Open Government, Mexico | [GET](https://datos.gob.mx/) | 403 | auth_required | unknown | 663 | discovery |
| Open Government, Netherlands | [GET](https://data.overheid.nl/en/ondersteuning/data-publiceren/api/) | 0 | network_error | unknown | 298 | discovery |
| Open Government, New Zealand | [GET](https://www.data.govt.nz/) | 200 | not_json | unknown | 448 | discovery |
| Open Government, Norway | [GET](https://data.norge.no/dataservices/) | 0 | network_error | unknown | 221 | discovery |
| Open Government, Peru | [GET](https://www.datosabiertos.gob.pe/) | 200 | not_json | unknown | 1907 | discovery |
| Open Government, Poland | [GET](https://dane.gov.pl/en/) | 200 | not_json | unknown | 645 | discovery |
| Open Government, Portugal | [GET](https://dados.gov.pt/en/docapi/) | 0 | timeout | unknown | 8004 | discovery |
| Open Government, Queensland Government | [GET](https://www.data.qld.gov.au/) | 200 | not_json | unknown | 1167 | discovery |
| Open Government, Saudi Arabia | [GET](https://data.gov.sa/) | 0 | network_error | unknown | 579 | discovery |
| Open Government, Singapore | [GET](https://data.gov.sg/developer/) | 0 | network_error | unknown | 953 | discovery |
| Open Government, Slovakia | [GET](https://data.gov.sk/en/) | 0 | network_error | unknown | 381 | discovery |
| Open Government, Slovenia | [GET](https://podatki.gov.si/) | 200 | not_json | unknown | 1195 | discovery |
| Open Government, South Australian Government | [GET](https://data.sa.gov.au/) | 200 | not_json | unknown | 2186 | discovery |
| Open Government, Spain | [GET](https://datos.gob.es/en/) | 200 | not_json | unknown | 208 | discovery |
| Open Government, Sweden | [GET](https://www.dataportal.se/en/dataservice/91_29789/api-for-the-statistical-database/) | 0 | network_error | unknown | 268 | discovery |
| Open Government, Taiwan | [GET](https://data.gov.tw/) | 200 | not_json | unknown | 5337 | discovery |
| Open Government, UK | [GET](https://data.gov.uk/) | 0 | network_error | unknown | 154 | discovery |
| Open Government, USA | [GET](https://www.data.gov/) | 0 | network_error | unknown | 922 | discovery |
| Open Government, Victoria State Government | [GET](https://www.data.vic.gov.au/) | 200 | not_json | unknown | 3399 | discovery |
| Open Government, West Australia | [GET](https://data.wa.gov.au/) | 200 | not_json | unknown | 2052 | discovery |
| Open Power System Data | [GET](https://open-power-system-data.org/) | 200 | not_json | unknown | 276 | discovery |
| Open Topo Data | [GET](https://www.opentopodata.org/) | 200 | not_json | unknown | 323 | discovery |
| Open Trivia | [GET](https://opentdb.com/api_config.php/) | 200 | not_json | unknown | 542 | discovery |
| Open Trivia Database | [GET](https://opentdb.com/api_config.php/) | 200 | not_json | unknown | 202 | discovery |
| Open Trivia DB | [GET](https://opentdb.com/api_config.php/) | 200 | not_json | unknown | 134 | discovery |
| Open-Meteo | [GET](https://open-meteo.com/) | 200 | not_json | unknown | 197 | discovery |
| openAFRICA | [GET](https://africaopendata.org/) | 0 | network_error | unknown | 235 | discovery |
| OpenAPI Generator | [GET](https://openapi-generator.tech/) | 200 | not_json | free | 304 | discovery |
| OpenCitations | [GET](https://opencitations.net/) | 200 | not_json | unknown | 403 | discovery |
| OpenCitations API | [GET](https://opencitations.net/index/api/v2/) | 0 | network_error | free | 71 | discovery |
| Opendatasoft API | [GET](https://help.opendatasoft.com/apis/ods-search-v2/) | 404 | http_error | free | 220 | discovery |
| OpenDota | [GET](https://opendota.com/) | 0 | network_error | unknown | 93 | discovery |
| OpenFDA Drug | [GET](https://open.fda.gov/apis/drug/) | 200 | not_json | unknown | 151 | discovery |
| openFDA Drug Labels | [GET](https://open.fda.gov/apis/drug/label/) | 200 | not_json | unknown | 278 | discovery |
| OpenHolidays | [GET](https://www.openholidaysapi.org/) | 0 | network_error | unknown | 203 | discovery |
| OpenHolidays API | [GET](https://www.openholidaysapi.org/) | 0 | network_error | free | 55 | discovery |
| OpenIndoor | [GET](https://openindoor.io/) | 200 | not_json | free | 1318 | discovery |
| OpenLEI API | [GET](https://www.gleif.org/en/lei-data/gleif-concatenated-file/download-the-concatenated-file/) | 200 | not_json | unknown | 5109 | discovery |
| OpenLigaDB | [GET](https://www.openligadb.de/) | 200 | not_json | unknown | 355 | discovery |
| OpenLigaDB API | [GET](https://www.openligadb.de/) | 200 | not_json | unknown | 65 | discovery |
| OpenSanctions | [GET](https://www.opensanctions.org/docs/api/) | 200 | not_json | unknown | 380 | discovery |
| openSenseMap | [GET](https://api.opensensemap.org/) | 200 | not_json | unknown | 263 | discovery |
| OpenStreetMap Nominatim | [GET](https://nominatim.org/release-docs/develop/api/) | 403 | auth_required | free | 157 | discovery |
| OpenStreetMap Nominatim API | [GET](https://nominatim.org/release-docs/latest/api/Overview/) | 200 | not_json | free | 75 | discovery |
| OpenTripPlanner | [GET](https://opentripplanner.org/) | 0 | network_error | unknown | 289 | discovery |
| OpenVisionAPI | [GET](https://openvisionapi.com/) | 0 | network_error | unknown | 170 | discovery |
| OpenWeatherMap API | [GET](https://openweathermap.org/api/) | 0 | network_error | unknown | 240 | discovery |
| OpenXR | [GET](https://www.khronos.org/openxr/) | 200 | not_json | unknown | 1011 | discovery |
| Öppna Data Sverige | [GET](https://www.dataportal.se/) | 200 | not_json | free | 230 | discovery |
| Order Pizza REST API | [GET](https://order-pizza-api.herokuapp.com/api/ui/) | 404 | http_error | unknown | 521 | discovery |
| OSRM | [GET](https://osrm.org/) | 0 | network_error | unknown | 652 | discovery |
| OSRS API | [GET](https://oldschool.runescape.wiki/w/API/) | 404 | http_error | unknown | 200 | discovery |
| Outlook Mail | [GET](https://msdn.microsoft.com/en-us/office/office365/api/mail-rest-operations/) | 0 | network_error | unknown | 254 | discovery |
| OV-API Netherlands | [GET](https://ovapi.nl/) | 200 | not_json | unknown | 236 | discovery |
| OVHcloud AI Endpoints | [GET](https://endpoints.ai.cloud.ovh.net/) | 0 | network_error | unknown | 423 | discovery |
| Owen Wilson Wow | [GET](https://owen-wilson-wow-api.herokuapp.com/) | 404 | http_error | unknown | 497 | discovery |
| Owen Wilson Wow API | [GET](https://owen-wilson-wow-api.onrender.com/) | 200 | not_json | unknown | 821 | discovery |
| owo | [GET](https://owo.vc/api/) | 404 | http_error | unknown | 792 | discovery |
| oyyi | [GET](https://oyyi.xyz/docs/1.0/) | 0 | network_error | unknown | 1235 | discovery |
| Packagist | [GET](https://packagist.org/apidoc/) | 0 | network_error | free | 530 | discovery |
| PackML | [GET](https://www.omac.org/packml/) | 0 | network_error | unknown | 1128 | discovery |
| Pantry | [GET](https://getpantry.cloud/) | 200 | not_json | unknown | 2646 | discovery |
| PDB | [GET](https://rcsb.org/) | 200 | not_json | unknown | 2934 | discovery |
| PDF Blocks | [GET](https://www.pdfblocks.com/docs/api/getting-started/) | 0 | network_error | unknown | 668 | discovery |
| Peru Open Data API | [GET](https://www.datosabiertos.gob.pe/) | 200 | not_json | free | 2121 | discovery |
| Phabricator | [GET](https://phacility.com/) | 200 | not_json | unknown | 1528 | discovery |
| Philippines Open Data API | [GET](https://data.gov.ph/) | 200 | not_json | free | 1702 | discovery |
| PhishStats | [GET](https://phishstats.info/) | 200 | not_json | unknown | 1026 | discovery |
| PHP-Noise | [GET](https://php-noise.com/) | 200 | not_json | unknown | 915 | discovery |
| PHP-Noise Generator | [GET](https://php-noise.com/) | 200 | not_json | unknown | 123 | discovery |
| Pinboard | [GET](https://pinboard.in/api/) | 200 | not_json | unknown | 1166 | discovery |
| Pinterest API | [GET](https://www.pinterest.com/login/?next=http%3A%2F%2Fdevelopers.pinterest.com%2Fapi_docs%2F/) | 200 | not_json | unknown | 358 | discovery |
| Pirate Ipsum | [GET](https://pirateipsum.me/api/) | 404 | http_error | unknown | 6993 | discovery |
| Pirate Ship | [GET](https://ship.pirateship.com/) | 200 | not_json | unknown | 883 | discovery |
| Pixel Encounter | [GET](https://pixelencounter.com/api/) | 0 | network_error | unknown | 522 | discovery |
| PlaceBear | [GET](https://placebear.com/) | 200 | not_json | unknown | 593 | discovery |
| PlaceDog | [GET](https://place.dog/) | 200 | not_json | unknown | 308 | discovery |
| Placeholder.com | [GET](https://placeholder.com/) | 200 | not_json | free | 223 | discovery |
| PlaceKeanu | [GET](https://placekeanu.com/) | 200 | not_json | unknown | 502 | discovery |
| PlaceKitten | [GET](https://placekitten.com/) | 521 | http_error | unknown | 247 | discovery |
| Plaid Identity | [GET](https://plaid.com/docs/identity-verification/) | 200 | not_json | unknown | 834 | discovery |
| PlayerDB | [GET](https://playerdb.co/) | 200 | not_json | unknown | 123 | discovery |
| Plusgiro | [GET](https://www.plusgirot.se/) | 0 | network_error | unknown | 117 | discovery |
| PM2.5 Open Data Portal | [GET](https://pm25.lass-net.org/) | 200 | not_json | unknown | 853 | discovery |
| PM2.5 Portal | [GET](https://pm25.lass-net.org/) | 200 | not_json | unknown | 347 | discovery |
| Pokéapi | [GET](https://pokeapi.co/) | 200 | not_json | unknown | 98 | discovery |
| Pokemon | [GET](https://pokeapi.co/) | 200 | not_json | unknown | 29 | discovery |
| Pokemon API | [GET](https://pokeapi.co/) | 200 | not_json | unknown | 32 | discovery |
| Pokémon TCG | [GET](https://pokemontcg.io/) | 200 | not_json | unknown | 407 | discovery |
| Pokemon TCG API | [GET](https://pokemontcg.io/) | 200 | not_json | unknown | 162 | discovery |
| Pokémon TCG API | [GET](https://pokemontcg.io/) | 200 | not_json | unknown | 218 | discovery |
| Postali | [GET](https://postali.app/api/) | 0 | network_error | unknown | 382 | discovery |
| Postcodes.io | [GET](https://postcodes.io/) | 200 | not_json | unknown | 218 | discovery |
| PostgREST | [GET](https://postgrest.org/) | 0 | network_error | unknown | 340 | discovery |
| Postman Echo | [GET](https://www.postman-echo.com/) | 0 | network_error | unknown | 518 | discovery |
| PRH | [GET](https://www.prh.fi/en/) | 0 | network_error | unknown | 305 | discovery |
| PRH Finland | [GET](https://avoindata.prh.fi/opendata/) | 0 | network_error | unknown | 295 | discovery |
| Prism | [GET](https://stoplight.io/prism/) | 0 | network_error | free | 426 | discovery |
| Pruvan | [GET](https://pruvan.com/resources/pruvan-api/) | 0 | network_error | unknown | 652 | discovery |
| PRV | [GET](https://www.prv.se/sv/) | 200 | not_json | unknown | 231 | discovery |
| Psychonauts | [GET](https://psychonauts-api.netlify.app/) | 401 | auth_required | unknown | 338 | discovery |
| PubChem | [GET](https://pubchemdocs.ncbi.nlm.nih.gov/pug-rest/) | 0 | network_error | unknown | 648 | discovery |
| PubChem API | [GET](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest/) | 200 | not_json | free | 377 | discovery |
| PunkAPI | [GET](https://punkapi.com/) | 0 | network_error | unknown | 221 | discovery |
| Purple Air | [GET](https://www2.purpleair.com/) | 0 | network_error | unknown | 360 | discovery |
| PyPI | [GET](https://warehouse.pypa.io/api-reference/) | 200 | not_json | free | 625 | discovery |
| PyPI API | [GET](https://warehouse.pypa.io/api-reference/) | 200 | not_json | free | 47 | discovery |
| QNAP Development Toolkit | [GET](https://www.qnap.com/event/dev/useng/p_about.php/) | 0 | network_error | unknown | 396 | discovery |
| QOwnNotes | [GET](https://qownnotes.org/) | 0 | network_error | unknown | 528 | discovery |
| QR Code Generator | [GET](https://goqr.me/api/) | 200 | not_json | free | 335 | discovery |
| QR code qrtag | [GET](https://www.qrtag.net/api/) | 200 | not_json | unknown | 591 | discovery |
| Qrcode Monkey | [GET](https://www.qrcode-monkey.com/qr-code-api-with-logo/) | 200 | not_json | unknown | 137 | discovery |
| Quarantine | [GET](https://quarantine.country/coronavirus/api/) | 0 | network_error | unknown | 111 | discovery |
| Quarantine API | [GET](https://quarantine.country/coronavirus/api/) | 0 | network_error | unknown | 26 | discovery |
| Queimadas INPE | [GET](https://queimadas.dgi.inpe.br/queimadas/dados-abertos/) | 0 | network_error | unknown | 1379 | discovery |
| QuickChart | [GET](https://quickchart.io/) | 200 | not_json | unknown | 411 | discovery |
| QuickMocker | [GET](https://quickmocker.com/) | 0 | network_error | unknown | 132 | discovery |
| quoteclear | [GET](https://quoteclear.web.app/) | 404 | http_error | unknown | 170 | discovery |
| Quotes on Design | [GET](https://quotesondesign.com/api/) | 200 | not_json | unknown | 565 | discovery |
| Quran | [GET](https://quran.api-docs.io/) | 0 | network_error | unknown | 248 | discovery |
| Quran API | [GET](https://alquran.cloud/api/) | 0 | network_error | unknown | 412 | discovery |
| Quran Cloud | [GET](https://alquran.cloud/api/) | 0 | network_error | unknown | 56 | discovery |
| Radicle | [GET](https://radicle.xyz/) | 0 | network_error | unknown | 242 | discovery |
| Radio Browser | [GET](https://api.radio-browser.info/) | 200 | not_json | unknown | 582 | discovery |
| Raider | [GET](https://raider.io/api/) | 200 | not_json | unknown | 270 | discovery |
| Random Data | [GET](https://random-data-api.com/) | 0 | network_error | unknown | 811 | discovery |
| Random Facts | [GET](https://fungenerators.com/api/facts/) | 0 | network_error | unknown | 711 | discovery |
| Random Useless Facts | [GET](https://uselessfacts.jsph.pl/) | 200 | not_json | unknown | 336 | discovery |
| RandomDog | [GET](https://random.dog/woof.json/) | 200 | ok_json | unknown | 714 | discovery |
| RandomDuck | [GET](https://random-d.uk/api/) | 404 | http_error | unknown | 323 | discovery |
| RandomFox | [GET](https://randomfox.ca/floof/) | 200 | ok_json | unknown | 1135 | discovery |
| RandomUser | [GET](https://randomuser.me/api/) | 200 | ok_json | unknown | 360 | discovery |
| RATP Paris Transit | [GET](https://data.ratp.fr/) | 0 | network_error | unknown | 439 | discovery |
| RBA Australia | [GET](https://www.rba.gov.au/statistics/tables/) | 200 | not_json | unknown | 4514 | discovery |
| RBA Australia Data | [GET](https://www.rba.gov.au/statistics/tables/) | 200 | not_json | unknown | 507 | discovery |
| RBNZ New Zealand Data | [GET](https://www.rbnz.govt.nz/statistics/) | 403 | auth_required | unknown | 193 | discovery |
| RCSB PDB API | [GET](https://data.rcsb.org/) | 406 | http_error | free | 433 | discovery |
| Redmine | [GET](https://redmine.org/) | 0 | network_error | unknown | 322 | discovery |
| Rejseplanen | [GET](https://help.rejseplanen.dk/hc/da/articles/214174465/) | 0 | network_error | unknown | 265 | discovery |
| RemoteOK API | [GET](https://remoteok.com/api/) | 200 | not_json | free | 817 | discovery |
| Remotive | [GET](https://remotive.io/api-documentation/) | 0 | network_error | unknown | 250 | discovery |
| Renfe Railway Spain | [GET](https://www.renfe.com/es/es/grupo-renfe/otras-webs/Open-data/) | 0 | network_error | unknown | 238 | discovery |
| Represent by Open North | [GET](https://represent.opennorth.ca/) | 200 | not_json | unknown | 832 | discovery |
| ReqRes | [GET](https://reqres.in/) | 200 | not_json | unknown | 460 | discovery |
| ReqRes API | [GET](https://reqres.in/) | 200 | not_json | free | 126 | discovery |
| RescueGroups | [GET](https://userguide.rescuegroups.org/display/APIDG/API+Developers+Guide+Home/) | 0 | network_error | unknown | 637 | discovery |
| ReSmush.it | [GET](https://resmush.it/api/) | 200 | not_json | unknown | 364 | discovery |
| Resrobot | [GET](https://www.trafiklab.se/api/resrobot-reseplanerare/) | 200 | not_json | unknown | 227 | discovery |
| REST Countries | [GET](https://restcountries.com/v3.1/all?fields=name) | 0 | network_error | unknown | 113 | discovery |
| Reykjavik Open Data | [GET](https://opingogn.is/api/) | 0 | network_error | unknown | 2415 | discovery |
| Rick and Morty | [GET](https://rickandmortyapi.com/) | 200 | not_json | unknown | 2203 | discovery |
| Rick and Morty API | [GET](https://rickandmortyapi.com/) | 200 | not_json | unknown | 62 | discovery |
| Riksarkivet | [GET](https://riksarkivet.se/oppna-data/) | 0 | network_error | unknown | 2238 | discovery |
| Riksbanken API | [GET](https://www.riksbank.se/) | 200 | not_json | free | 2422 | discovery |
| Riksdagen Open Data | [GET](https://data.riksdagen.se/) | 0 | network_error | unknown | 2130 | discovery |
| RoboHash | [GET](https://robohash.org/) | 200 | not_json | unknown | 1058 | discovery |
| Rocket Pool | [GET](https://rocketpool.net/) | 200 | not_json | unknown | 112 | discovery |
| RPS 101 | [GET](https://rps101.pythonanywhere.com/api/) | 404 | http_error | unknown | 750 | discovery |
| RSS feed to JSON | [GET](https://rss-to-json-serverless-api.vercel.app/) | 402 | http_error | unknown | 388 | discovery |
| RubyGems | [GET](https://guides.rubygems.org/rubygems-org-api/) | 200 | not_json | unknown | 332 | discovery |
| RuneScape | [GET](https://runescape.wiki/w/Application_programming_interface/) | 200 | not_json | unknown | 168 | discovery |
| Rustybeer | [GET](https://rustybeer.herokuapp.com/) | 404 | http_error | unknown | 548 | discovery |
| Ruter | [GET](https://api.entur.io/journey-planner/) | 404 | http_error | unknown | 153 | discovery |
| Rwanda Locations | [GET](https://rapidapi.com/victorkarangwa4/api/rwanda/) | 0 | network_error | unknown | 374 | discovery |
| Rwanda Open Data API | [GET](https://statistics.gov.rw/) | 200 | not_json | free | 4522 | discovery |
| RxNorm | [GET](https://lhncbc.nlm.nih.gov/RxNav/APIs/) | 200 | not_json | unknown | 1909 | discovery |
| SAMA Saudi Arabia | [GET](https://www.sama.gov.sa/) | 0 | network_error | unknown | 2065 | discovery |
| Samtrafiken | [GET](https://www.samtrafiken.se/) | 0 | network_error | unknown | 449 | discovery |
| Samuel L Ipsum | [GET](https://slipsum.com/) | 200 | not_json | unknown | 338 | discovery |
| Saudi Aramco Data | [GET](https://www.aramco.com/en/investors/data-and-insights/) | 0 | network_error | unknown | 1832 | discovery |
| SCB | [GET](https://www.scb.se/vara-tjanster/oppna-data/) | 200 | not_json | unknown | 2920 | discovery |
| SCB API | [GET](https://www.scb.se/vara-tjanster/oppna-data/api-for-statistikdatabasen/) | 0 | network_error | unknown | 80 | discovery |
| SCB Statistics Sweden | [GET](https://www.scb.se/api/) | 200 | not_json | unknown | 1690 | discovery |
| Scorecard | [GET](https://securityscorecards.dev/) | 200 | not_json | unknown | 1975 | discovery |
| Scryfall | [GET](https://scryfall.com/docs/api/) | 200 | not_json | unknown | 3411 | discovery |
| Scryfall MTG | [GET](https://scryfall.com/docs/api/) | 200 | not_json | unknown | 61 | discovery |
| SEC EDGAR | [GET](https://www.sec.gov/developer/) | 404 | http_error | free | 1122 | discovery |
| SEC EDGAR API | [GET](https://www.sec.gov/developer/) | 404 | http_error | unknown | 779 | discovery |
| SEC EDGAR Data | [GET](https://www.sec.gov/edgar/sec-api-documentation/) | 0 | network_error | unknown | 624 | discovery |
| Semantic Scholar | [GET](https://api.semanticscholar.org/) | 429 | rate_limited | free | 2150 | discovery |
| Senegal Open Data API | [GET](https://data.gouv.sn/) | 0 | network_error | free | 908 | discovery |
| Seniverse | [GET](https://www.seniverse.com/doc/) | 200 | not_json | unknown | 3903 | discovery |
| Serialif Color | [GET](https://color.serialif.com/) | 200 | not_json | unknown | 930 | discovery |
| Shanbay | [GET](https://www.shanbay.com/help/developer/api_v1/) | 0 | network_error | unknown | 323 | discovery |
| ShapeShift API | [GET](https://shapeshift.io/) | 0 | network_error | unknown | 79 | discovery |
| SHARE | [GET](https://share.osf.io/api/v2/) | 406 | http_error | unknown | 288 | discovery |
| Sharp | [GET](https://sharp.pixelplumbing.com/api/) | 404 | http_error | unknown | 302 | discovery |
| Shepherd.js | [GET](https://shepherdjs.dev/) | 0 | network_error | unknown | 447 | discovery |
| Shields | [GET](https://shields.io/) | 200 | not_json | unknown | 211 | discovery |
| Shields.io | [GET](https://shields.io/) | 200 | not_json | unknown | 92 | discovery |
| Signal Protocol | [GET](https://signal.org/) | 200 | not_json | free | 235 | discovery |
| Sigstore | [GET](https://sigstore.dev/) | 0 | network_error | unknown | 417 | discovery |
| SilverBullet | [GET](https://silverbullet.md/) | 200 | not_json | unknown | 1149 | discovery |
| Singapore Data API | [GET](https://data.gov.sg/) | 200 | not_json | free | 512 | discovery |
| Sitebulb | [GET](https://sitebulb.com/) | 200 | not_json | unknown | 301 | discovery |
| SL API | [GET](https://www.trafiklab.se/api/sl-realtidsinformation-4/) | 200 | not_json | unknown | 227 | discovery |
| SLSA | [GET](https://slsa.dev/) | 200 | not_json | unknown | 333 | discovery |
| Smappee | [GET](https://smappee.atlassian.net/wiki/display/DEVAPI/SmappeeDevAPI+Home/) | 404 | http_error | unknown | 776 | discovery |
| Smash | [GET](https://api.fromsmash.com/) | 200 | not_json | unknown | 392 | discovery |
| SMHI | [GET](https://opendata.smhi.se/apidocs/) | 404 | http_error | free | 235 | discovery |
| SMHI API | [GET](https://opendata.smhi.se/apidocs/) | 404 | http_error | unknown | 65 | discovery |
| SMHI Open Data | [GET](https://opendata-download-metobs.smhi.se/api/) | 200 | not_json | unknown | 121 | discovery |
| SMHI Weather API | [GET](https://opendata.smhi.se/apidocs/) | 404 | http_error | unknown | 199 | discovery |
| SMN Argentina API | [GET](https://www.smn.gob.ar/) | 403 | auth_required | free | 147 | discovery |
| SNB Switzerland | [GET](https://data.snb.ch/) | 400 | http_error | unknown | 380 | discovery |
| SNB Switzerland Data | [GET](https://data.snb.ch/en/) | 0 | network_error | unknown | 313 | discovery |
| Songsterr | [GET](https://www.songsterr.com/a/wa/api/) | 0 | network_error | unknown | 644 | discovery |
| South Africa Data API | [GET](https://data.gov.za/) | 0 | network_error | free | 3495 | discovery |
| South African Reserve Bank | [GET](https://www.resbank.co.za/) | 200 | not_json | unknown | 3899 | discovery |
| Spaceflight News | [GET](https://spaceflightnewsapi.net/) | 200 | not_json | unknown | 556 | discovery |
| SpaceX | [GET](https://api.spacex.land/graphql/) | 0 | network_error | unknown | 294 | discovery |
| Spain INE Statistics | [GET](https://www.ine.es/dyngs/DataLab/) | 404 | http_error | unknown | 674 | discovery |
| Spanish random names | [GET](https://random-names-api.herokuapp.com/public/) | 404 | http_error | unknown | 514 | discovery |
| Spanish random words | [GET](https://palabras-aleatorias-public-api.herokuapp.com/) | 404 | http_error | unknown | 629 | discovery |
| Squiggle | [GET](https://api.squiggle.com.au/) | 200 | not_json | unknown | 516 | discovery |
| SSB | [GET](https://www.ssb.no/api/) | 200 | not_json | unknown | 767 | discovery |
| SSB Norway | [GET](https://data.ssb.no/api/v0/) | 410 | http_error | unknown | 267 | discovery |
| Stakdek QR Generator | [GET](https://api.stakdek.de/blog?id=1006/) | 0 | timeout | unknown | 8002 | discovery |
| STAPI Star Trek | [GET](https://stapi.co/api-documentation/) | 404 | http_error | unknown | 426 | discovery |
| Star Trek API (STAPI) | [GET](https://stapi.co/api-documentation/) | 404 | http_error | unknown | 63 | discovery |
| StatBel Belgium | [GET](https://statbel.fgov.be/en/open-data/) | 0 | network_error | unknown | 600 | discovery |
| Statically | [GET](https://statically.io/) | 200 | not_json | unknown | 298 | discovery |
| Statistics Denmark | [GET](https://dst.dk/) | 0 | network_error | unknown | 355 | discovery |
| Statistics Finland | [GET](https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/) | 200 | ok_json | unknown | 1387 | discovery |
| Statistics Norway | [GET](https://ssb.no/) | 0 | network_error | unknown | 1806 | discovery |
| Statistics Sweden | [GET](https://scb.se/) | 0 | network_error | unknown | 1311 | discovery |
| Statistics Sweden (SCB) | [GET](https://api.scb.se/OV0104/v1/doris/en/ssd/) | 200 | ok_json | unknown | 823 | discovery |
| Stoplight Prism | [GET](https://stoplight.io/open-source/prism/) | 0 | network_error | free | 724 | discovery |
| Stromberg Quotes | [GET](https://www.stromberg-api.de/) | 0 | network_error | unknown | 345 | discovery |
| Studio Ghibli | [GET](https://ghibliapi.herokuapp.com/) | 404 | http_error | unknown | 527 | discovery |
| Studio Ghibli API | [GET](https://ghibliapi.vercel.app/films) | 200 | ok_json | free | 355 | yes |
| Sunrise and Sunset | [GET](https://sunrise-sunset.org/api/) | 0 | network_error | unknown | 276 | discovery |
| Sunrise-Sunset API | [GET](https://sunrise-sunset.org/api/) | 0 | network_error | unknown | 140 | discovery |
| SunriseSunset.io | [GET](https://sunrisesunset.io/api/) | 200 | not_json | unknown | 284 | discovery |
| Suomi.fi | [GET](https://www.suomi.fi/palvelut/apis/) | 0 | network_error | unknown | 235 | discovery |
| SuredBits | [GET](https://suredbits.com/api/) | 0 | timeout | unknown | 8007 | discovery |
| Svea | [GET](https://www.svea.com/se/sv/foretag/integrationer/) | 0 | network_error | unknown | 232 | discovery |
| Sveriges Dataportal | [GET](https://www.dataportal.se/api/) | 0 | network_error | unknown | 247 | discovery |
| SVN API | [GET](https://subversion.apache.org/docs/api/1.8/) | 200 | not_json | free | 192 | discovery |
| SWAPI GraphQL | [GET](https://graphql.org/swapi-graphql/) | 200 | not_json | unknown | 270 | discovery |
| SWAPI Star Wars | [GET](https://www.swapi.tech/) | 200 | not_json | unknown | 538 | discovery |
| Sweden Data API | [GET](https://www.dataportal.se/) | 200 | not_json | unknown | 39 | discovery |
| Swedish Parliament | [GET](https://data.riksdagen.se/) | 0 | network_error | unknown | 88 | discovery |
| Swiss Federal Stats | [GET](https://www.pxweb.bfs.admin.ch/) | 0 | network_error | unknown | 385 | discovery |
| Swisstopo Geodata | [GET](https://api3.geo.admin.ch/) | 0 | network_error | unknown | 215 | discovery |
| Syft | [GET](https://anchore.com/) | 200 | not_json | unknown | 895 | discovery |
| Taiga | [GET](https://taiga.io/) | 200 | not_json | unknown | 529 | discovery |
| Taiwan Open Data API | [GET](https://data.gov.tw/) | 200 | not_json | free | 2759 | discovery |
| Taylor Swift API | [GET](https://taylor.rest/) | 0 | network_error | free | 93 | discovery |
| TCGdex Pokémon | [GET](https://www.tcgdex.dev/) | 0 | network_error | unknown | 328 | discovery |
| TCGdex Pokémon TCG | [GET](https://www.tcgdex.dev/) | 0 | network_error | unknown | 69 | discovery |
| Teambition | [GET](https://www.teambition.com/developer/open-platform/) | 0 | network_error | unknown | 615 | discovery |
| Techy | [GET](https://techy-api.vercel.app/) | 200 | not_json | unknown | 442 | discovery |
| Techy API | [GET](https://techy-api.vercel.app/) | 200 | not_json | unknown | 176 | discovery |
| Telegram API | [GET](https://core.telegram.org/) | 200 | not_json | unknown | 249 | discovery |
| Tenders Hungary | [GET](https://tenders.guru/hu/api/) | 0 | timeout | unknown | 8003 | discovery |
| Tenders in Hungary | [GET](https://tenders.guru/hu/api/) | 0 | timeout | unknown | 8017 | discovery |
| Tenders in Poland | [GET](https://tenders.guru/pl/api/) | 0 | timeout | unknown | 8003 | discovery |
| Tenders in Romania | [GET](https://tenders.guru/ro/api/) | 0 | timeout | unknown | 8002 | discovery |
| Tenders in Spain | [GET](https://tenders.guru/es/api/) | 0 | timeout | unknown | 8001 | discovery |
| Tenders in Ukraine | [GET](https://tenders.guru/ua/api/) | 0 | timeout | unknown | 8001 | discovery |
| Tenders Poland | [GET](https://tenders.guru/pl/api/) | 0 | timeout | unknown | 8002 | discovery |
| Tenders Romania | [GET](https://tenders.guru/ro/api/) | 0 | timeout | unknown | 8002 | discovery |
| Tenders Spain | [GET](https://tenders.guru/es/api/) | 0 | timeout | unknown | 8002 | discovery |
| Tenders Ukraine | [GET](https://tenders.guru/ua/api/) | 0 | timeout | unknown | 8004 | discovery |
| Terraform Registry | [GET](https://registry.terraform.io/v1/providers?limit=1) | 200 | ok_json | free | 322 | yes |
| TETR.IO | [GET](https://tetr.io/about/api/) | 200 | not_json | unknown | 258 | discovery |
| TextMate | [GET](https://macromates.com/) | 200 | not_json | unknown | 283 | discovery |
| Thailand Open Data API | [GET](https://data.go.th/) | 403 | auth_required | free | 109 | discovery |
| The Null Pointer | [GET](https://0x0.st/) | 200 | not_json | unknown | 313 | discovery |
| The SMS Works | [GET](https://thesmsworks.co.uk/sms-api/) | 404 | http_error | unknown | 343 | discovery |
| They Said So Quotes | [GET](https://theysaidso.com/api/) | 0 | network_error | unknown | 467 | discovery |
| Things API | [GET](https://culturedcode.com/things/support/articles/2803573/) | 200 | not_json | unknown | 145 | discovery |
| Thirukkural | [GET](https://api-thirukkural.web.app/) | 200 | not_json | unknown | 111 | discovery |
| This Person Does not Exist | [GET](https://thispersondoesnotexist.com/) | 200 | not_json | unknown | 227 | discovery |
| Thread | [GET](https://threadgroup.org/) | 200 | not_json | unknown | 720 | discovery |
| ThronesApi | [GET](https://thronesapi.com/) | 200 | not_json | unknown | 773 | discovery |
| Thumbor | [GET](https://thumbor.readthedocs.io/) | 0 | network_error | unknown | 334 | discovery |
| TLE | [GET](https://tle.ivanstanojevic.me/) | 200 | not_json | unknown | 503 | discovery |
| TLE API | [GET](https://tle.ivanstanojevic.me/) | 200 | not_json | unknown | 250 | discovery |
| Today in History API | [GET](https://history.muffinlabs.com/) | 200 | not_json | unknown | 619 | discovery |
| Toodledo | [GET](https://api.toodledo.com/3/) | 200 | not_json | unknown | 339 | discovery |
| Toolcarton | [GET](https://testimonialapi.toolcarton.com/) | 0 | network_error | unknown | 103 | discovery |
| TradingView | [GET](https://tradingview.com/) | 0 | network_error | free | 95 | discovery |
| Trafikverket Open API | [GET](https://api.trafikinfo.trafikverket.se/) | 404 | http_error | unknown | 142 | discovery |
| Traitify | [GET](https://app.traitify.com/developer/) | 200 | not_json | unknown | 647 | discovery |
| Transfermarkt API | [GET](https://transfermarkt-api.vercel.app/) | 402 | http_error | unknown | 389 | discovery |
| TransLink Queensland | [GET](https://translink.com.au/about-translink/open-data/) | 0 | network_error | unknown | 1650 | discovery |
| Transport for Auckland, New Zealand | [GET](https://dev-portal.at.govt.nz/) | 200 | not_json | unknown | 2089 | discovery |
| Transport for Budapest, Hungary | [GET](https://bkkfutar.docs.apiary.io/) | 0 | timeout | unknown | 8004 | discovery |
| Transport for Czech Republic | [GET](https://www.chaps.cz/eng/products/idos-internet/) | 200 | not_json | unknown | 483 | discovery |
| Transport for Switzerland | [GET](https://transport.opendata.ch/) | 200 | not_json | unknown | 327 | discovery |
| Transport for United States | [GET](https://retro.umoiq.com/xmlFeedDocs/NextBusXMLFeed.pdf/) | 200 | not_json | unknown | 954 | discovery |
| transport.rest | [GET](https://transport.rest/) | 200 | not_json | unknown | 295 | discovery |
| Trivy | [GET](https://trivy.dev/) | 200 | not_json | unknown | 220 | discovery |
| Tronald Dump | [GET](https://www.tronalddump.io/) | 200 | not_json | unknown | 1049 | discovery |
| Tunisia Open Data API | [GET](https://data.gov.tn/) | 0 | network_error | free | 418 | discovery |
| TVMaze API | [GET](https://tvmaze.com/api/) | 0 | network_error | unknown | 226 | discovery |
| Uganda Open Data API | [GET](https://data.ug/) | 0 | network_error | free | 323 | discovery |
| UI Avatars | [GET](https://ui-avatars.com/) | 200 | not_json | free | 169 | discovery |
| UK Bank Holidays | [GET](https://www.gov.uk/bank-holidays.json/) | 0 | network_error | unknown | 235 | discovery |
| UK Government | [GET](https://www.api.gov.uk/) | 200 | not_json | free | 372 | discovery |
| UK Government API | [GET](https://www.api.gov.uk/) | 200 | not_json | free | 22 | discovery |
| Ultraleap Tracking | [GET](https://www.ultraleap.com/tracking/) | 404 | http_error | unknown | 234 | discovery |
| umati | [GET](https://umati.org/) | 200 | not_json | unknown | 290 | discovery |
| Umeå Open Data | [GET](https://opendata.umea.se/api/) | 0 | network_error | unknown | 424 | discovery |
| UN Data | [GET](https://data.un.org/) | 200 | not_json | free | 565 | discovery |
| UN Data API | [GET](https://data.un.org/) | 200 | not_json | free | 217 | discovery |
| UniProt API | [GET](https://www.uniprot.org/help/api/) | 200 | not_json | free | 349 | discovery |
| University of Oslo | [GET](https://data.uio.no/) | 406 | http_error | unknown | 119 | discovery |
| Unsplash It | [GET](https://unsplash.it/) | 0 | network_error | unknown | 138 | discovery |
| Unsplash Resource | [GET](https://source.unsplash.com/) | 503 | http_error | unknown | 513 | discovery |
| Urban Observatory | [GET](https://urbanobservatory.ac.uk/) | 200 | not_json | unknown | 449 | discovery |
| URLhaus | [GET](https://urlhaus-api.abuse.ch/) | 200 | not_json | unknown | 269 | discovery |
| Uruguay Open Data API | [GET](https://catalogodatos.gub.uy/) | 0 | network_error | free | 965 | discovery |
| US Presidential Election Data by TogaTech | [GET](https://uselection.togatech.org/api/) | 404 | http_error | unknown | 755 | discovery |
| USAspending | [GET](https://api.usaspending.gov/) | 200 | not_json | unknown | 1139 | discovery |
| USAspending API | [GET](https://api.usaspending.gov/) | 200 | not_json | unknown | 219 | discovery |
| USAspending.gov | [GET](https://api.usaspending.gov/) | 200 | not_json | unknown | 227 | discovery |
| UserAgent | [GET](https://useragent.api.io/) | 0 | network_error | unknown | 69 | discovery |
| USGS | [GET](https://www.usgs.gov/products/web-tools/apis/) | 200 | not_json | free | 2765 | discovery |
| USGS Earthquake | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | not_json | unknown | 5501 | discovery |
| USGS Earthquake API | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | not_json | unknown | 109 | discovery |
| USGS Earthquake Hazards | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | not_json | unknown | 22 | discovery |
| USGS Earthquake Hazards Program | [GET](https://earthquake.usgs.gov/fdsnws/event/1/) | 200 | not_json | unknown | 25 | discovery |
| USGS Water Services | [GET](https://waterservices.usgs.gov/) | 200 | not_json | unknown | 773 | discovery |
| USPTO | [GET](https://www.uspto.gov/learning-and-resources/open-data-and-mobility/) | 404 | http_error | unknown | 364 | discovery |
| USPTO API | [GET](https://www.uspto.gov/learning-and-resources/open-data-and-mobility/) | 404 | http_error | unknown | 79 | discovery |
| V2EX | [GET](https://www.v2ex.com/p/7v9TEc53/) | 404 | http_error | unknown | 288 | discovery |
| Vadivelu HTTP Codes | [GET](https://vadivelu.anoram.com/) | 0 | network_error | unknown | 30 | discovery |
| Valorant (non-official) | [GET](https://valorant-api.com/) | 200 | not_json | unknown | 289 | discovery |
| Valorant API | [GET](https://valorant-api.com/) | 200 | not_json | unknown | 89 | discovery |
| VCR.py | [GET](https://vcrpy.readthedocs.io/) | 0 | network_error | free | 386 | discovery |
| Vector Express v2.0 | [GET](https://vector.express/) | 200 | not_json | unknown | 457 | discovery |
| VeganCheck API | [GET](https://jokenetwork.de/vegancheck-api/) | 0 | network_error | unknown | 313 | discovery |
| Velib metropolis, Paris, France | [GET](https://www.velib-metropole.fr/donnees-open-data-gbfs-du-service-velib-metropole/) | 403 | auth_required | unknown | 159 | discovery |
| Vercel AI SDK | [GET](https://sdk.vercel.ai/) | 0 | network_error | free | 185 | discovery |
| ViaCep | [GET](https://viacep.com.br/) | 200 | not_json | unknown | 872 | discovery |
| Vietnam Open Data API | [GET](https://data.gov.vn/) | 0 | network_error | free | 473 | discovery |
| VIN Decoder | [GET](https://vpic.nhtsa.dot.gov/api/) | 200 | not_json | unknown | 641 | discovery |
| Vinli | [GET](https://dev.vin.li/) | 0 | network_error | unknown | 243 | discovery |
| Virushee | [GET](https://api.virushee.com/) | 0 | network_error | unknown | 31 | discovery |
| VK API | [GET](https://vk.com/dev/) | 0 | network_error | unknown | 851 | discovery |
| Vy | [GET](https://www.vy.no/) | 200 | not_json | unknown | 810 | discovery |
| WallstreetBets | [GET](https://dashboard.nbshare.io/apps/reddit/api/) | 0 | network_error | unknown | 143 | discovery |
| Warface (non-official) | [GET](https://api.wfstats.cf/) | 0 | network_error | unknown | 69 | discovery |
| Weatherstack | [GET](https://weatherstack.com/?utm_source=Github&utm_medium=Referral&utm_campaign=Public-apis-repo-Best-sellers/) | 200 | not_json | unknown | 777 | discovery |
| Web3Modal | [GET](https://web3modal.com/) | 0 | network_error | unknown | 188 | discovery |
| Website Carbon | [GET](https://api.websitecarbon.com/) | 200 | not_json | unknown | 128 | discovery |
| WebXR | [GET](https://immersiveweb.dev/) | 200 | not_json | unknown | 272 | discovery |
| Weebly | [GET](https://cloud-developer.weebly.com/) | 404 | http_error | unknown | 331 | discovery |
| WePay | [GET](https://www.wepay.com/) | 0 | network_error | unknown | 194 | discovery |
| Wger Workout Manager | [GET](https://wger.de/en/software/api/) | 200 | not_json | unknown | 396 | discovery |
| WhiskyHunter | [GET](https://whiskyhunter.net/api/) | 200 | ok_json | unknown | 342 | discovery |
| Whitepages Pro | [GET](https://pro.whitepages.com/) | 0 | network_error | unknown | 255 | discovery |
| WHO | [GET](https://who.int/) | 0 | network_error | unknown | 259 | discovery |
| Wikipedia | [GET](https://www.mediawiki.org/wiki/API:Main_page/) | 404 | http_error | unknown | 366 | discovery |
| Wikipedia API | [GET](https://en.wikipedia.org/w/api.php/) | 0 | network_error | unknown | 339 | discovery |
| Wiktionary | [GET](https://en.wiktionary.org/w/api.php/) | 0 | network_error | unknown | 334 | discovery |
| Wiktionary API | [GET](https://en.wiktionary.org/w/api.php/) | 0 | network_error | unknown | 162 | discovery |
| Wolne Lektury | [GET](https://wolnelektury.pl/api/) | 200 | not_json | unknown | 270 | discovery |
| Working Nomads | [GET](https://www.workingnomads.co/api/exposed_jobs/) | 0 | network_error | unknown | 602 | discovery |
| Worktile | [GET](https://dev.worktile.com/document/overview/) | 200 | not_json | unknown | 1201 | discovery |
| World Bank | [GET](https://datahelpdesk.worldbank.org/knowledgebase/topics/125589/) | 404 | http_error | unknown | 785 | discovery |
| World Bank API | [GET](https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information/) | 404 | http_error | unknown | 338 | discovery |
| World Flora Online | [GET](https://worldfloraonline.org/) | 0 | network_error | unknown | 459 | discovery |
| WorldTimeAPI | [GET](https://worldtimeapi.org/) | 0 | network_error | free | 291 | discovery |
| Wunderground | [GET](https://www.wunderground.com/weather/api/) | 0 | network_error | unknown | 84 | discovery |
| xColors | [GET](https://x-colors.herokuapp.com/) | 404 | http_error | unknown | 459 | discovery |
| xeno-canto | [GET](https://xeno-canto.org/explore/api/) | 404 | http_error | unknown | 246 | discovery |
| xMath | [GET](https://x-math.herokuapp.com/) | 404 | http_error | unknown | 328 | discovery |
| XMPP | [GET](https://xmpp.org/) | 200 | not_json | free | 699 | discovery |
| Y.js | [GET](https://yjs.dev/) | 200 | not_json | unknown | 182 | discovery |
| Yandex | [GET](https://tech.yandex.com/maps/) | 0 | network_error | unknown | 262 | discovery |
| Yes No | [GET](https://yesno.wtf/api/) | 200 | ok_json | unknown | 365 | discovery |
| Youku | [GET](https://doc.open.youku.com/) | 404 | http_error | unknown | 1007 | discovery |
| YR | [GET](https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=59.91&lon=10.75) | 200 | ok_json | free | 195 | yes |
| Yr.no | [GET](https://api.met.no/weatherapi/) | 200 | not_json | unknown | 33 | discovery |
| Yu-Gi-Oh | [GET](https://ygoprodeck.com/) | 200 | not_json | unknown | 253 | discovery |
| Yu-Gi-Oh! API | [GET](https://db.ygoprodeck.com/api-guide/) | 0 | network_error | unknown | 105 | discovery |
| Z-Wave | [GET](https://z-wavealliance.org/) | 200 | not_json | unknown | 256 | discovery |
| Zed | [GET](https://zed.dev/) | 200 | not_json | unknown | 385 | discovery |
| Zen Quotes | [GET](https://zenquotes.io/) | 200 | not_json | unknown | 485 | discovery |
| Zen Quotes API | [GET](https://zenquotes.io/api/) | 0 | network_error | free | 371 | discovery |
| Zettlr | [GET](https://zettlr.com/) | 200 | not_json | unknown | 653 | discovery |
| Zigbee | [GET](https://zigbeealliance.org/) | 0 | network_error | unknown | 231 | discovery |
| Ziptastic | [GET](https://ziptasticapi.com/) | 200 | not_json | unknown | 520 | discovery |
| ZMOK | [GET](https://zmok.io/) | 200 | not_json | unknown | 989 | discovery |
| Zoo Animals | [GET](https://zoo-animal-api.herokuapp.com/) | 404 | http_error | unknown | 278 | discovery |
| Zoo Animals API | [GET](https://zoo-animal-api.herokuapp.com/) | 404 | http_error | unknown | 56 | discovery |
