#!/usr/bin/env python3
"""APIClaw Night Expansion - 2026-02-23 04:00"""

import json
import re
from datetime import datetime

# Load current registry
with open('/Users/gustavhemmingsson/Projects/apiclaw/src/registry/apis.json', 'r') as f:
    registry = json.load(f)

existing_ids = {api['id'] for api in registry['apis']}
new_apis = []

def add_api(name, desc, category, url, auth="unknown"):
    api_id = re.sub(r'[^a-z0-9]', '-', name.lower()).strip('-')
    api_id = re.sub(r'-+', '-', api_id)
    if api_id not in existing_ids and api_id:
        existing_ids.add(api_id)
        new_apis.append({
            "id": api_id,
            "name": name,
            "description": desc[:200],
            "category": category,
            "auth": auth,
            "https": True,
            "cors": "unknown",
            "link": url,
            "pricing": "unknown",
            "keywords": []
        })
        return True
    return False

# ===== NEW APIs from public-apis README =====

# Animals
add_api("Zoo Animals", "Facts and pictures of zoo animals", "Animals", "https://zoo-animal-api.herokuapp.com/")
add_api("xeno-canto", "Bird recordings worldwide", "Animals", "https://xeno-canto.org/explore/api")
add_api("Movebank", "Movement and Migration data of animals", "Animals", "https://movebank.org")
add_api("MeowFacts", "Get random cat facts", "Animals", "https://github.com/wh-iterabb-it/meowfacts")

# Anime
add_api("Trace Moe", "Get exact anime scene from screenshot", "Media", "https://trace.moe")
add_api("Waifu.im", "Anime waifu images archive", "Media", "https://waifu.im/docs")
add_api("NekosBest", "Neko Images & Anime GIFs", "Media", "https://docs.nekos.best")
add_api("Shikimori", "Anime discovery and tracking", "Media", "https://shikimori.one/api/doc")

# Anti-Malware/Security
add_api("AbuseIPDB", "IP domain URL reputation checking", "Security", "https://docs.abuseipdb.com/", "apiKey")
add_api("AlienVault OTX", "Open Threat Exchange intelligence", "Security", "https://otx.alienvault.com/api", "apiKey")
add_api("MalwareBazaar", "Malware samples collection", "Security", "https://bazaar.abuse.ch/api/", "apiKey")
add_api("URLhaus", "Malware URL database", "Security", "https://urlhaus-api.abuse.ch/")
add_api("URLScan.io", "Scan and analyse URLs", "Security", "https://urlscan.io/about-api/", "apiKey")
add_api("VirusTotal", "File and URL analysis", "Security", "https://www.virustotal.com/en/documentation/public-api/", "apiKey")
add_api("CAPEsandbox", "Malware execution analysis", "Security", "https://capev2.readthedocs.io/", "apiKey")

# Art & Design
add_api("Art Institute of Chicago", "Art museum collection API", "Art & Design", "https://api.artic.edu/docs/")
add_api("Colormind", "Color scheme generator AI", "Art & Design", "http://colormind.io/api-access/")
add_api("EmojiHub", "Get emojis by categories", "Art & Design", "https://github.com/cheatsnake/emojihub")
add_api("Metropolitan Museum", "Met Museum of Art collection", "Art & Design", "https://metmuseum.github.io/")
add_api("Rijksmuseum", "Dutch museum collection data", "Art & Design", "https://data.rijksmuseum.nl/", "apiKey")
add_api("Harvard Art Museums", "Harvard art collection", "Art & Design", "https://github.com/harvardartmuseums/api-docs", "apiKey")

# Authentication
add_api("Auth0", "Authentication authorization platform", "Auth", "https://auth0.com", "apiKey")
add_api("Stytch", "User infrastructure auth", "Auth", "https://stytch.com/", "apiKey")
add_api("Warrant", "Authorization access control APIs", "Auth", "https://warrant.dev/", "apiKey")

# Blockchain
add_api("Bitquery", "Onchain GraphQL DEX APIs", "Blockchain", "https://graphql.bitquery.io/ide", "apiKey")
add_api("Chainlink", "Hybrid smart contracts", "Blockchain", "https://chain.link/developer-resources")
add_api("Covalent", "Multi-blockchain data aggregator", "Blockchain", "https://www.covalenthq.com/docs/api/", "apiKey")
add_api("Etherscan", "Ethereum explorer API", "Blockchain", "https://etherscan.io/apis", "apiKey")
add_api("The Graph", "Indexing protocol GraphQL", "Blockchain", "https://thegraph.com", "apiKey")
add_api("Watchdata", "Ethereum blockchain access", "Blockchain", "https://docs.watchdata.io", "apiKey")
add_api("Nownodes", "Blockchain-as-a-service", "Blockchain", "https://nownodes.io/", "apiKey")

# Books
add_api("Wizard World", "Harry Potter universe info", "Books", "https://wizard-world-api.herokuapp.com/")
add_api("Bhagavad Gita", "Sacred Hindu text API", "Books", "https://docs.bhagavadgitaapi.in", "apiKey")
add_api("PoetryDB", "Poetry collection database", "Books", "https://github.com/thundercomb/poetrydb")
add_api("Quran Cloud", "RESTful Quran API", "Books", "https://alquran.cloud/api")
add_api("Gutendex", "Project Gutenberg books", "Books", "https://gutendex.com/")

# Business
add_api("Apache Superset", "BI dashboards management", "Business", "https://superset.apache.org/docs/api", "apiKey")
add_api("Clearbit Logo", "Company logo search", "Business", "https://clearbit.com/docs#logo-api", "apiKey")
add_api("Gmail API", "Gmail programmatic access", "Communication", "https://developers.google.com/gmail/api/", "OAuth")
add_api("Google Analytics", "Analytics data collection", "Analytics", "https://developers.google.com/analytics/", "OAuth")
add_api("Mailchimp", "Marketing email campaigns", "Marketing", "https://mailchimp.com/developer/", "apiKey")
add_api("Redash", "Query dashboards access", "Analytics", "https://redash.io/help/user-guide/integrations-and-api/api", "apiKey")
add_api("Square", "Payment and business tools", "Payment", "https://developer.squareup.com/reference/square", "OAuth")
add_api("Trello", "Project board management", "Productivity", "https://developers.trello.com/", "OAuth")
add_api("Tomba Email Finder", "B2B email finder verifier", "Business", "https://tomba.io/api", "apiKey")

# Calendar
add_api("Calendarific", "Worldwide holidays API", "Calendar", "https://calendarific.com/", "apiKey")
add_api("Nager.Date", "Public holidays 90+ countries", "Calendar", "https://date.nager.at")
add_api("Abstract Holidays", "Holiday data via API", "Calendar", "https://www.abstractapi.com/holidays-api", "apiKey")

# Cloud Storage
add_api("Box", "Enterprise file sharing", "Storage", "https://developer.box.com/", "OAuth")
add_api("Dropbox", "File sync and sharing", "Storage", "https://www.dropbox.com/developers", "OAuth")
add_api("Google Drive", "Cloud file storage", "Storage", "https://developers.google.com/drive/", "OAuth")
add_api("OneDrive", "Microsoft cloud storage", "Storage", "https://developer.microsoft.com/onedrive", "OAuth")
add_api("GoFile", "Unlimited file uploads", "Storage", "https://gofile.io/api", "apiKey")
add_api("File.io", "Simple file sharing", "Storage", "https://www.file.io")
add_api("Pinata", "IPFS pinning services", "Storage", "https://docs.pinata.cloud/", "apiKey")
add_api("Web3 Storage", "Free 1TB cloud storage", "Storage", "https://web3.storage/", "apiKey")

# Cryptocurrency - Extended
add_api("0x Protocol", "Token pool stats DEX", "Cryptocurrency", "https://0x.org/api")
add_api("1inch", "Decentralized exchange API", "Cryptocurrency", "https://1inch.io/api/")
add_api("Alchemy Ethereum", "Ethereum node service", "Cryptocurrency", "https://docs.alchemy.com/alchemy/", "apiKey")
add_api("CoinCap", "Real-time crypto prices", "Cryptocurrency", "https://docs.coincap.io/")
add_api("CoinGecko", "Crypto price market data", "Cryptocurrency", "https://www.coingecko.com/api")
add_api("CoinMarketCap", "Cryptocurrency prices", "Cryptocurrency", "https://coinmarketcap.com/api/", "apiKey")
add_api("Coinpaprika", "Crypto prices volume", "Cryptocurrency", "https://api.coinpaprika.com")
add_api("CoinRanking", "Live crypto data", "Cryptocurrency", "https://developers.coinranking.com/api/documentation", "apiKey")
add_api("CryptoCompare", "Crypto comparison rates", "Cryptocurrency", "https://www.cryptocompare.com/api#")
add_api("Messari", "Crypto assets data", "Cryptocurrency", "https://messari.io/api")
add_api("dYdX", "Decentralized crypto exchange", "Cryptocurrency", "https://docs.dydx.exchange/", "apiKey")
add_api("Mempool", "Bitcoin transaction fee API", "Cryptocurrency", "https://mempool.space/api")
add_api("Solana JSON RPC", "Solana blockchain API", "Cryptocurrency", "https://docs.solana.com/developing/clients/jsonrpc-api")

# Currency Exchange
add_api("ExchangeRate-API", "Free currency conversion", "Finance", "https://www.exchangerate-api.com", "apiKey")
add_api("Frankfurter", "Exchange rates time series", "Finance", "https://www.frankfurter.app/docs")
add_api("Currency-api", "150+ currencies no limits", "Finance", "https://github.com/fawazahmed0/currency-api")

# Development Tools
add_api("GitHub API", "GitHub data and operations", "Development", "https://docs.github.com/en/rest", "OAuth")
add_api("GitLab API", "GitLab automation", "Development", "https://docs.gitlab.com/ee/api/", "OAuth")
add_api("Bitbucket", "Source code hosting", "Development", "https://developer.atlassian.com/cloud/bitbucket/", "OAuth")
add_api("CircleCI", "CI/CD automation", "Development", "https://circleci.com/docs/api/v1-reference/", "apiKey")
add_api("TravisCI", "CI platform API", "Development", "https://docs.travis-ci.com/api/", "apiKey")
add_api("Docker Hub", "Container registry", "Development", "https://docs.docker.com/docker-hub/api/latest/", "apiKey")
add_api("Heroku", "Platform-as-a-service", "Development", "https://devcenter.heroku.com/articles/platform-api-reference/", "OAuth")
add_api("Google Firebase", "Mobile app platform", "Development", "https://firebase.google.com/docs", "apiKey")
add_api("Google Fonts", "Web fonts metadata", "Development", "https://developers.google.com/fonts/docs/developer_api", "apiKey")
add_api("QR Code Generator", "QR code creation decode", "Development", "http://goqr.me/api/")
add_api("IPInfo.io", "IP geolocation lookup", "Development", "https://ipinfo.io/developers", "apiKey")
add_api("Postman Echo", "Test API server", "Development", "https://www.postman-echo.com")
add_api("Httpbin", "HTTP request testing", "Development", "https://httpbin.org/")
add_api("CountAPI", "Free counting service", "Development", "https://countapi.xyz")

# Documents & Productivity
add_api("Google Docs", "Documents API", "Productivity", "https://developers.google.com/docs/api/reference/rest", "OAuth")
add_api("Google Sheets", "Spreadsheets API", "Productivity", "https://developers.google.com/sheets/api/reference/rest", "OAuth")
add_api("Google Slides", "Presentations API", "Productivity", "https://developers.google.com/slides/api/reference/rest", "OAuth")
add_api("Google Keep", "Notes API", "Productivity", "https://developers.google.com/keep/api/reference/rest", "OAuth")

# Email Services
add_api("Context.IO", "Modern email API", "Email", "http://context.io/", "apiKey")
add_api("Inbox", "RESTful email API", "Email", "https://www.inboxapp.com/docs", "apiKey")
add_api("Mandrill", "Transactional email", "Email", "https://mandrillapp.com/api/docs/", "apiKey")
add_api("Outlook Mail", "Office 365 mail API", "Email", "https://msdn.microsoft.com/en-us/office/office365/api/mail-rest-operations", "OAuth")

# Entertainment
add_api("Chuck Norris Jokes", "Random Chuck Norris jokes", "Entertainment", "https://api.chucknorris.io/")
add_api("Dad Jokes", "Random dad jokes", "Entertainment", "https://icanhazdadjoke.com/api")
add_api("JokeAPI", "Programming jokes API", "Entertainment", "https://jokeapi.dev/")
add_api("Bored API", "Random activities", "Entertainment", "https://www.boredapi.com/")

# Finance Extended
add_api("Alpha Vantage", "Stock market data", "Finance", "https://www.alphavantage.co/documentation/", "apiKey")
add_api("IEX Cloud", "Financial data platform", "Finance", "https://iexcloud.io/docs/api/", "apiKey")
add_api("Polygon.io", "Stock crypto forex data", "Finance", "https://polygon.io/docs/", "apiKey")
add_api("Finnhub", "Real-time stock data", "Finance", "https://finnhub.io/docs/api", "apiKey")
add_api("Yahoo Finance", "Stock market quotes", "Finance", "https://finance.yahoo.com/")
add_api("EODHD", "End of day historical data", "Finance", "https://eodhistoricaldata.com/", "apiKey")

# Food & Drink
add_api("TheMealDB", "Meal recipes database", "Food", "https://www.themealdb.com/api.php")
add_api("TheCocktailDB", "Cocktail recipes", "Food", "https://www.thecocktaildb.com/api.php")
add_api("Open Food Facts", "Food products database", "Food", "https://world.openfoodfacts.org/data")
add_api("Spoonacular", "Recipe nutrition API", "Food", "https://spoonacular.com/food-api", "apiKey")
add_api("Edamam", "Food nutrition analysis", "Food", "https://developer.edamam.com/", "apiKey")

# Games Extended
add_api("Giant Bomb", "Video game database", "Gaming", "https://www.giantbomb.com/api/")
add_api("IGDB", "Internet game database", "Gaming", "https://api-docs.igdb.com/", "apiKey")
add_api("RAWG", "Video games database", "Gaming", "https://rawg.io/apidocs", "apiKey")
add_api("Steam Web API", "Steam platform data", "Gaming", "https://steamcommunity.com/dev", "apiKey")
add_api("Twitch API", "Live streaming platform", "Gaming", "https://dev.twitch.tv/docs/api/", "OAuth")
add_api("Discord API", "Chat platform API", "Gaming", "https://discord.com/developers/docs/intro", "OAuth")
add_api("Pokemon API", "Pokemon data", "Gaming", "https://pokeapi.co/")
add_api("Marvel API", "Marvel comics universe", "Gaming", "https://developer.marvel.com/", "apiKey")
add_api("Star Wars API", "Star Wars universe data", "Gaming", "https://swapi.dev/")

# Geocoding & Maps
add_api("OpenCage", "Geocoding API", "Geolocation", "https://opencagedata.com/api", "apiKey")
add_api("Mapbox", "Maps and location", "Geolocation", "https://docs.mapbox.com/api/", "apiKey")
add_api("HERE Maps", "Location platform", "Geolocation", "https://developer.here.com/develop/rest-apis", "apiKey")
add_api("Nominatim", "OpenStreetMap geocoding", "Geolocation", "https://nominatim.org/release-docs/develop/api/Overview/")
add_api("IP Geolocation", "IP to location", "Geolocation", "https://ipgeolocation.io/documentation", "apiKey")
add_api("ipstack", "IP geolocation API", "Geolocation", "https://ipstack.com/documentation", "apiKey")

# Government & Open Data
add_api("Data.gov", "US government open data", "Government", "https://api.data.gov/")
add_api("UK Government", "UK public data", "Government", "https://www.gov.uk/help/reuse-govuk-content")
add_api("EU Open Data", "European Union data", "Government", "https://data.europa.eu/euodp/en/data")
add_api("World Bank", "Development indicators", "Government", "https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information")
add_api("USGS", "US Geological Survey", "Government", "https://earthquake.usgs.gov/fdsnws/event/1/")

# Health
add_api("OpenFDA", "FDA public data", "Health", "https://open.fda.gov/apis/")
add_api("NPPES", "Healthcare provider lookup", "Health", "https://npiregistry.cms.hhs.gov/api-page")
add_api("Healthcare.gov", "US healthcare marketplace", "Health", "https://www.healthcare.gov/developers/")
add_api("COVID-19 API", "Coronavirus statistics", "Health", "https://covid19api.com/")

# Jobs
add_api("GitHub Jobs", "Tech job listings", "Jobs", "https://jobs.github.com/api")
add_api("Indeed", "Job search aggregator", "Jobs", "https://opensource.indeedeng.io/api-documentation/")
add_api("The Muse", "Job listings API", "Jobs", "https://www.themuse.com/developers/api/v2")
add_api("Adzuna", "Job search engine", "Jobs", "https://developer.adzuna.com/overview", "apiKey")

# Machine Learning Extended
add_api("OpenAI", "GPT language models", "AI & ML", "https://platform.openai.com/docs/api-reference", "apiKey")
add_api("Anthropic Claude", "AI assistant API", "AI & ML", "https://docs.anthropic.com/claude/reference", "apiKey")
add_api("Hugging Face", "ML models hub", "AI & ML", "https://huggingface.co/docs/api-inference/", "apiKey")
add_api("Cohere", "NLP language AI", "AI & ML", "https://docs.cohere.ai/", "apiKey")
add_api("Stability AI", "Image generation Stable Diffusion", "AI & ML", "https://platform.stability.ai/docs", "apiKey")
add_api("Replicate", "Run ML models API", "AI & ML", "https://replicate.com/docs", "apiKey")
add_api("AssemblyAI", "Speech-to-text API", "AI & ML", "https://www.assemblyai.com/docs/", "apiKey")
add_api("Deepgram", "Speech recognition", "AI & ML", "https://developers.deepgram.com/docs/", "apiKey")
add_api("Clarifai", "Visual recognition AI", "AI & ML", "https://docs.clarifai.com/api-guide/api-overview", "apiKey")

# Music Extended
add_api("Spotify API", "Music streaming platform", "Music", "https://developer.spotify.com/documentation/web-api/", "OAuth")
add_api("Last.fm", "Music discovery scrobbling", "Music", "https://www.last.fm/api", "apiKey")
add_api("Deezer", "Music streaming service", "Music", "https://developers.deezer.com/")
add_api("Musixmatch", "Lyrics database", "Music", "https://developer.musixmatch.com/", "apiKey")
add_api("SoundCloud", "Audio sharing platform", "Music", "https://developers.soundcloud.com/", "OAuth")
add_api("Genius", "Song lyrics annotations", "Music", "https://docs.genius.com/", "apiKey")
add_api("AudioDB", "Music metadata database", "Music", "https://www.theaudiodb.com/api_guide.php")

# News
add_api("NewsAPI", "News aggregation", "News", "https://newsapi.org/docs/", "apiKey")
add_api("New York Times", "NYT article search", "News", "https://developer.nytimes.com/", "apiKey")
add_api("Guardian", "UK Guardian news", "News", "https://open-platform.theguardian.com/documentation/", "apiKey")
add_api("Hacker News", "Tech news community", "News", "https://github.com/HackerNews/API")
add_api("Reddit", "Social news aggregation", "News", "https://www.reddit.com/dev/api/", "OAuth")
add_api("Dev.to", "Developer community", "News", "https://developers.forem.com/api")
add_api("Product Hunt", "Tech product launches", "News", "https://api.producthunt.com/v2/docs", "OAuth")

# Photos Extended
add_api("Unsplash", "Free high-res photos", "Photos", "https://unsplash.com/documentation", "apiKey")
add_api("Pexels", "Free stock photos", "Photos", "https://www.pexels.com/api/documentation/", "apiKey")
add_api("Pixabay", "Free images videos", "Photos", "https://pixabay.com/api/docs/", "apiKey")
add_api("Flickr", "Photo sharing platform", "Photos", "https://www.flickr.com/services/api/", "apiKey")
add_api("Lorem Picsum", "Placeholder images", "Photos", "https://picsum.photos/")
add_api("PlaceKitten", "Kitten placeholders", "Photos", "https://placekitten.com/")

# Science
add_api("NASA", "Space science data", "Science", "https://api.nasa.gov/", "apiKey")
add_api("SpaceX", "SpaceX launch data", "Science", "https://github.com/r-spacex/SpaceX-API")
add_api("Open Notify", "ISS location tracking", "Science", "http://open-notify.org/Open-Notify-API/")
add_api("CERN", "Particle physics data", "Science", "http://opendata.cern.ch/")
add_api("arXiv", "Scientific papers", "Science", "https://arxiv.org/help/api/")
add_api("PubChem", "Chemistry database", "Science", "https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest")
add_api("Numbers API", "Facts about numbers", "Science", "http://numbersapi.com/")

# Social Media Extended
add_api("Facebook Graph", "Facebook platform API", "Social", "https://developers.facebook.com/docs/graph-api/", "OAuth")
add_api("Twitter API", "Twitter platform data", "Social", "https://developer.twitter.com/en/docs/twitter-api", "OAuth")
add_api("Instagram Basic", "Instagram user media", "Social", "https://developers.facebook.com/docs/instagram-basic-display-api/", "OAuth")
add_api("LinkedIn", "Professional network", "Social", "https://developer.linkedin.com/", "OAuth")
add_api("Pinterest", "Visual discovery", "Social", "https://developers.pinterest.com/", "OAuth")
add_api("TikTok", "Short video platform", "Social", "https://developers.tiktok.com/doc/", "OAuth")
add_api("Mastodon", "Decentralized social", "Social", "https://docs.joinmastodon.org/api/")
add_api("Tumblr", "Microblogging platform", "Social", "https://www.tumblr.com/docs/en/api/v2", "OAuth")

# Sports
add_api("NBA Stats", "Basketball statistics", "Sports", "https://www.nba.com/stats/")
add_api("ESPN", "Sports news stats", "Sports", "https://www.espn.com/apis/devcenter/docs/")
add_api("Football-Data", "Soccer competition data", "Sports", "https://www.football-data.org/documentation/", "apiKey")
add_api("API-Football", "Football statistics", "Sports", "https://www.api-football.com/documentation-v3", "apiKey")
add_api("TheSportsDB", "Sports database", "Sports", "https://www.thesportsdb.com/api.php")
add_api("Balldontlie", "NBA data API", "Sports", "https://www.balldontlie.io/")
add_api("NHL API", "Hockey statistics", "Sports", "https://gitlab.com/dword4/nhlapi")
add_api("F1 API", "Formula 1 data", "Sports", "https://ergast.com/mrd/")

# Transportation
add_api("Uber", "Ride-sharing platform", "Transportation", "https://developer.uber.com/", "OAuth")
add_api("Lyft", "Ride-sharing service", "Transportation", "https://www.lyft.com/developers", "OAuth")
add_api("FlightAware", "Flight tracking", "Transportation", "https://flightaware.com/commercial/flightxml/", "apiKey")
add_api("AviationStack", "Flight data API", "Transportation", "https://aviationstack.com/documentation", "apiKey")
add_api("OpenSky", "Air traffic data", "Transportation", "https://openskynetwork.github.io/opensky-api/")
add_api("Ship24", "Parcel tracking", "Transportation", "https://www.ship24.com/docs/api", "apiKey")
add_api("AfterShip", "Shipment tracking", "Transportation", "https://docs.aftership.com/api/", "apiKey")

# URL Shorteners
add_api("Bitly", "URL shortening service", "Utilities", "https://dev.bitly.com/", "OAuth")
add_api("TinyURL", "URL shortener", "Utilities", "https://tinyurl.com/api-create.php")
add_api("Rebrandly", "Branded short URLs", "Utilities", "https://developers.rebrandly.com/docs", "apiKey")

# Video
add_api("YouTube Data", "YouTube platform API", "Video", "https://developers.google.com/youtube/v3", "apiKey")
add_api("Vimeo", "Video hosting platform", "Video", "https://developer.vimeo.com/api/start", "OAuth")
add_api("Dailymotion", "Video sharing platform", "Video", "https://developer.dailymotion.com/api", "apiKey")
add_api("TMDb", "Movie database API", "Video", "https://developers.themoviedb.org/3", "apiKey")
add_api("OMDb", "Open movie database", "Video", "https://www.omdbapi.com/", "apiKey")
add_api("TVmaze", "TV show information", "Video", "https://www.tvmaze.com/api")
add_api("Trakt", "TV movie tracking", "Video", "https://trakt.docs.apiary.io/", "apiKey")

# Weather Extended
add_api("OpenWeatherMap", "Weather data worldwide", "Weather", "https://openweathermap.org/api", "apiKey")
add_api("WeatherAPI", "Real-time weather", "Weather", "https://www.weatherapi.com/docs/", "apiKey")
add_api("Visual Crossing", "Historical weather", "Weather", "https://www.visualcrossing.com/resources/documentation/", "apiKey")
add_api("Tomorrow.io", "Weather intelligence", "Weather", "https://docs.tomorrow.io/", "apiKey")
add_api("Weatherstack", "Weather data API", "Weather", "https://weatherstack.com/documentation", "apiKey")
add_api("MetaWeather", "Weather data aggregator", "Weather", "https://www.metaweather.com/api/")
add_api("National Weather Service", "US weather forecasts", "Weather", "https://www.weather.gov/documentation/services-web-api")

# ===== apis.guru APIs =====
add_api("1Forge Finance", "Stock forex realtime quotes", "Finance", "https://1forge.com/", "apiKey")
add_api("1Password Events", "1Password audit events", "Security", "https://developer.1password.com/docs/events-api", "apiKey")
add_api("1Password Connect", "Secrets management API", "Security", "https://developer.1password.com/docs/connect", "apiKey")
add_api("Authentiq", "Strong passwordless auth", "Auth", "https://www.authentiq.com/", "OAuth")
add_api("Ably Platform", "Realtime messaging", "Communication", "https://ably.com/docs/api", "apiKey")
add_api("Ably Control", "Platform management", "Communication", "https://ably.com/docs/api/control-api", "apiKey")
add_api("Abstract Geolocation", "IP geolocation API", "Geolocation", "https://www.abstractapi.com/api/ip-geolocation-api", "apiKey")
add_api("Adafruit IO", "IoT data platform", "IoT", "https://io.adafruit.com/api/docs/", "apiKey")
add_api("Adobe AEM", "Adobe Experience Manager", "CMS", "https://experienceleague.adobe.com/docs/experience-manager-cloud-service/content/implementing/developing/reference-materials/apis/overview.html")
add_api("Adyen Checkout", "Payment processing", "Payment", "https://docs.adyen.com/api-explorer/Checkout/", "apiKey")
add_api("Adyen Balance", "Balance platform API", "Payment", "https://docs.adyen.com/api-explorer/BalancePlatform/", "apiKey")

# ===== MORE AI/ML APIs =====
add_api("Google Cloud Vision", "Image analysis AI", "AI & ML", "https://cloud.google.com/vision/docs", "apiKey")
add_api("Google Cloud NLP", "Natural language processing", "AI & ML", "https://cloud.google.com/natural-language/docs", "apiKey")
add_api("Google Cloud Speech", "Speech-to-text AI", "AI & ML", "https://cloud.google.com/speech-to-text/docs", "apiKey")
add_api("Google Cloud Translation", "Text translation AI", "AI & ML", "https://cloud.google.com/translate/docs", "apiKey")
add_api("AWS Rekognition", "Image video analysis", "AI & ML", "https://docs.aws.amazon.com/rekognition/", "apiKey")
add_api("AWS Comprehend", "NLP text analysis", "AI & ML", "https://docs.aws.amazon.com/comprehend/", "apiKey")
add_api("AWS Polly", "Text-to-speech AI", "AI & ML", "https://docs.aws.amazon.com/polly/", "apiKey")
add_api("AWS Transcribe", "Speech recognition", "AI & ML", "https://docs.aws.amazon.com/transcribe/", "apiKey")
add_api("Azure Computer Vision", "Image AI analysis", "AI & ML", "https://docs.microsoft.com/azure/cognitive-services/computer-vision/", "apiKey")
add_api("Azure Text Analytics", "NLP text services", "AI & ML", "https://docs.microsoft.com/azure/cognitive-services/text-analytics/", "apiKey")
add_api("Azure Speech", "Speech services AI", "AI & ML", "https://docs.microsoft.com/azure/cognitive-services/speech-service/", "apiKey")
add_api("Azure Translator", "Text translation AI", "AI & ML", "https://docs.microsoft.com/azure/cognitive-services/translator/", "apiKey")
add_api("IBM Watson NLU", "Natural language understanding", "AI & ML", "https://cloud.ibm.com/apidocs/natural-language-understanding", "apiKey")
add_api("IBM Watson Assistant", "Conversational AI", "AI & ML", "https://cloud.ibm.com/apidocs/assistant/assistant-v2", "apiKey")
add_api("Wit.ai", "NLP for apps", "AI & ML", "https://wit.ai/docs", "apiKey")
add_api("Dialogflow", "Conversational AI Google", "AI & ML", "https://cloud.google.com/dialogflow/docs", "apiKey")
add_api("Rasa", "Open source conversational AI", "AI & ML", "https://rasa.com/docs/rasa/api/")
add_api("Perplexity", "AI search engine API", "AI & ML", "https://docs.perplexity.ai/", "apiKey")
add_api("Groq", "Fast AI inference", "AI & ML", "https://console.groq.com/docs", "apiKey")
add_api("Together AI", "Open source AI platform", "AI & ML", "https://docs.together.ai/", "apiKey")
add_api("Fireworks AI", "Fast AI inference", "AI & ML", "https://readme.fireworks.ai/", "apiKey")
add_api("Mistral AI", "Mistral language models", "AI & ML", "https://docs.mistral.ai/", "apiKey")

# ===== E-commerce APIs =====
add_api("Shopify", "E-commerce platform", "E-commerce", "https://shopify.dev/docs/api", "apiKey")
add_api("WooCommerce", "WordPress e-commerce", "E-commerce", "https://woocommerce.github.io/woocommerce-rest-api-docs/", "apiKey")
add_api("BigCommerce", "E-commerce platform", "E-commerce", "https://developer.bigcommerce.com/docs", "apiKey")
add_api("Magento", "Adobe Commerce API", "E-commerce", "https://developer.adobe.com/commerce/webapi/", "apiKey")
add_api("eBay", "Online marketplace", "E-commerce", "https://developer.ebay.com/api-docs", "OAuth")
add_api("Amazon SP-API", "Amazon Selling Partner", "E-commerce", "https://developer-docs.amazon.com/sp-api/", "apiKey")
add_api("Etsy", "Handmade marketplace", "E-commerce", "https://developers.etsy.com/documentation/", "OAuth")
add_api("Klarna", "Buy now pay later", "E-commerce", "https://docs.klarna.com/", "apiKey")
add_api("Afterpay", "Pay in installments", "E-commerce", "https://developers.afterpay.com/", "apiKey")

# ===== Marketing & Analytics =====
add_api("Google Ads", "Advertising platform", "Marketing", "https://developers.google.com/google-ads/api/docs/start", "OAuth")
add_api("Facebook Ads", "Social advertising", "Marketing", "https://developers.facebook.com/docs/marketing-apis/", "OAuth")
add_api("HubSpot", "CRM marketing platform", "Marketing", "https://developers.hubspot.com/docs/api/overview", "apiKey")
add_api("Salesforce", "CRM platform", "Marketing", "https://developer.salesforce.com/docs/apis", "OAuth")
add_api("Mixpanel", "Product analytics", "Analytics", "https://developer.mixpanel.com/reference/overview", "apiKey")
add_api("Amplitude", "Product analytics", "Analytics", "https://www.docs.developers.amplitude.com/", "apiKey")
add_api("Segment", "Customer data platform", "Analytics", "https://segment.com/docs/api/", "apiKey")
add_api("Hotjar", "User behavior analytics", "Analytics", "https://help.hotjar.com/hc/en-us/categories/115001355687-Hotjar-API", "apiKey")
add_api("Intercom", "Customer messaging", "Marketing", "https://developers.intercom.com/docs/", "apiKey")
add_api("Zendesk", "Customer service platform", "Marketing", "https://developer.zendesk.com/api-reference/", "apiKey")
add_api("Drift", "Conversational marketing", "Marketing", "https://devdocs.drift.com/docs/", "apiKey")
add_api("Crisp", "Customer messaging", "Marketing", "https://docs.crisp.chat/api/v1/", "apiKey")
add_api("Freshdesk", "Customer support", "Marketing", "https://developers.freshdesk.com/api/", "apiKey")
add_api("Pipedrive", "Sales CRM", "Marketing", "https://developers.pipedrive.com/docs/api/v1", "apiKey")

# ===== DevOps & Infrastructure =====
add_api("AWS", "Amazon Web Services", "Cloud", "https://docs.aws.amazon.com/", "apiKey")
add_api("Google Cloud", "Google Cloud Platform", "Cloud", "https://cloud.google.com/apis", "apiKey")
add_api("Azure", "Microsoft Azure", "Cloud", "https://docs.microsoft.com/azure/", "apiKey")
add_api("DigitalOcean", "Cloud infrastructure", "Cloud", "https://docs.digitalocean.com/reference/api/", "apiKey")
add_api("Linode", "Cloud computing", "Cloud", "https://www.linode.com/docs/api/", "apiKey")
add_api("Vultr", "Cloud infrastructure", "Cloud", "https://www.vultr.com/api/", "apiKey")
add_api("Cloudflare", "CDN security platform", "Cloud", "https://api.cloudflare.com/", "apiKey")
add_api("Netlify", "Web deployment platform", "Cloud", "https://docs.netlify.com/api/get-started/", "apiKey")
add_api("Vercel", "Frontend deployment", "Cloud", "https://vercel.com/docs/rest-api", "apiKey")
add_api("Railway", "App deployment platform", "Cloud", "https://docs.railway.app/reference/public-api", "apiKey")
add_api("Render", "Cloud application hosting", "Cloud", "https://api-docs.render.com/", "apiKey")
add_api("Fly.io", "Global app platform", "Cloud", "https://fly.io/docs/reference/machines/", "apiKey")
add_api("PlanetScale", "Serverless MySQL", "Database", "https://api-docs.planetscale.com/", "apiKey")
add_api("Supabase", "Open source Firebase alt", "Database", "https://supabase.com/docs/guides/api", "apiKey")
add_api("Upstash", "Serverless Redis Kafka", "Database", "https://docs.upstash.com/redis/rest/", "apiKey")
add_api("Neon", "Serverless Postgres", "Database", "https://api-docs.neon.tech/", "apiKey")
add_api("MongoDB Atlas", "Cloud database service", "Database", "https://www.mongodb.com/docs/atlas/api/", "apiKey")
add_api("Fauna", "Serverless database", "Database", "https://docs.fauna.com/fauna/current/api/", "apiKey")
add_api("CockroachDB", "Distributed SQL database", "Database", "https://www.cockroachlabs.com/docs/api/", "apiKey")
add_api("Datadog", "Monitoring observability", "Monitoring", "https://docs.datadoghq.com/api/", "apiKey")
add_api("New Relic", "Observability platform", "Monitoring", "https://docs.newrelic.com/docs/apis/", "apiKey")
add_api("Sentry", "Error tracking", "Monitoring", "https://docs.sentry.io/api/", "apiKey")
add_api("PagerDuty", "Incident management", "Monitoring", "https://developer.pagerduty.com/docs/", "apiKey")
add_api("StatusPage", "Status page hosting", "Monitoring", "https://developer.statuspage.io/", "apiKey")

# ===== Communication APIs =====
add_api("Twilio", "Communication APIs", "Communication", "https://www.twilio.com/docs/", "apiKey")
add_api("SendGrid", "Email delivery", "Communication", "https://docs.sendgrid.com/api-reference/", "apiKey")
add_api("Mailgun", "Email API service", "Communication", "https://documentation.mailgun.com/en/latest/api_reference.html", "apiKey")
add_api("Postmark", "Transactional email", "Communication", "https://postmarkapp.com/developer", "apiKey")
add_api("Amazon SES", "Email sending service", "Communication", "https://docs.aws.amazon.com/ses/", "apiKey")
add_api("Vonage", "Communication APIs", "Communication", "https://developer.vonage.com/", "apiKey")
add_api("Plivo", "Voice SMS APIs", "Communication", "https://www.plivo.com/docs/", "apiKey")
add_api("MessageBird", "Omnichannel messaging", "Communication", "https://developers.messagebird.com/", "apiKey")
add_api("Sinch", "Communication platform", "Communication", "https://developers.sinch.com/", "apiKey")
add_api("Telnyx", "Communication APIs", "Communication", "https://developers.telnyx.com/docs/v2", "apiKey")

# ===== Productivity & Collaboration =====
add_api("Notion", "Workspace productivity", "Productivity", "https://developers.notion.com/", "apiKey")
add_api("Airtable", "Spreadsheet database", "Productivity", "https://airtable.com/developers/web/api/", "apiKey")
add_api("Asana", "Project management", "Productivity", "https://developers.asana.com/docs/overview", "apiKey")
add_api("Monday.com", "Work management", "Productivity", "https://developer.monday.com/api-reference/docs", "apiKey")
add_api("Jira", "Issue tracking", "Productivity", "https://developer.atlassian.com/cloud/jira/platform/rest/", "apiKey")
add_api("Confluence", "Team workspace", "Productivity", "https://developer.atlassian.com/cloud/confluence/rest/", "apiKey")
add_api("Linear", "Issue tracking", "Productivity", "https://developers.linear.app/docs/", "apiKey")
add_api("ClickUp", "Project management", "Productivity", "https://clickup.com/api", "apiKey")
add_api("Basecamp", "Project management", "Productivity", "https://github.com/basecamp/bc3-api", "OAuth")
add_api("Todoist", "Task management", "Productivity", "https://developer.todoist.com/rest/", "apiKey")
add_api("Calendly", "Scheduling platform", "Productivity", "https://developer.calendly.com/", "apiKey")
add_api("Cal.com", "Open source scheduling", "Productivity", "https://cal.com/docs/api-reference/", "apiKey")
add_api("Loom", "Video messaging", "Productivity", "https://dev.loom.com/docs/", "apiKey")
add_api("Miro", "Visual collaboration", "Productivity", "https://developers.miro.com/docs/", "OAuth")
add_api("Figma", "Design platform", "Design", "https://www.figma.com/developers/api", "OAuth")
add_api("Canva", "Design platform", "Design", "https://www.canva.com/developers/", "OAuth")

# ===== Swedish/Nordic APIs =====
add_api("Swish", "Swedish mobile payments", "Payment", "https://developer.swish.nu/", "certificate")
add_api("BankID", "Swedish e-ID", "Auth", "https://www.bankid.com/utvecklare/", "certificate")
add_api("Freja eID", "Nordic e-ID", "Auth", "https://frejaeid.com/developers/", "apiKey")
add_api("Klarna Checkout", "Swedish payment checkout", "Payment", "https://docs.klarna.com/", "apiKey")
add_api("Trafiklab", "Swedish transport data", "Transportation", "https://www.trafiklab.se/api", "apiKey")
add_api("SMHI", "Swedish weather data", "Weather", "https://opendata.smhi.se/apidocs/")
add_api("SCB", "Statistics Sweden", "Government", "https://www.scb.se/en/services/open-data-api/")
add_api("Bolagsverket", "Swedish company register", "Government", "https://bolagsverket.se/om/oss/oppna-data")
add_api("Skatteverket", "Swedish tax authority", "Government", "https://www.skatteverket.se/foretag/etjanster/apier.4.html")
add_api("PostNord", "Nordic postal service", "Transportation", "https://developer.postnord.com/", "apiKey")
add_api("Vipps MobilePay", "Nordic mobile payments", "Payment", "https://developer.vippsmobilepay.com/", "apiKey")

# Add all new APIs to registry
registry['apis'].extend(new_apis)
registry['count'] = len(registry['apis'])
registry['lastUpdated'] = datetime.utcnow().isoformat()

# Save updated registry
with open('/Users/gustavhemmingsson/Projects/apiclaw/src/registry/apis.json', 'w') as f:
    json.dump(registry, f, indent=2)

print(f"✅ Added {len(new_apis)} new APIs")
print(f"📊 Total APIs: {registry['count']}")
