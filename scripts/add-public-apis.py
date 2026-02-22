#!/usr/bin/env python3
"""
APIClaw - Public APIs Mass Import
Parses n0shake/Public-APIs and TonnyL/Awesome_APIs lists
"""

import json
import re
from pathlib import Path

REGISTRY_PATH = Path(__file__).parent.parent / "src" / "registry" / "apis.json"

def generate_id(name: str) -> str:
    """Generate clean ID from name"""
    clean = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return clean[:50]

def load_registry() -> dict:
    """Load existing registry"""
    with open(REGISTRY_PATH, 'r') as f:
        return json.load(f)

def save_registry(registry: dict):
    """Save registry"""
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(registry, f, indent=2)

def get_existing_ids(registry: dict) -> set:
    """Get set of existing API IDs"""
    return {api['id'] for api in registry['apis']}

# Parsed from n0shake/Public-APIs and TonnyL/Awesome_APIs
PUBLIC_APIS = [
    # === ADVERTISING ===
    {"name": "Amazon Mobile Ads", "description": "Monetize across platforms with multiple ad formats", "category": "Advertising", "link": "https://developer.amazon.com/mobile-ads", "auth": "apiKey"},
    {"name": "Facebook Marketing API", "description": "Manage ads and campaigns using the Facebook API", "category": "Advertising", "link": "https://developers.facebook.com/docs/marketing-apis", "auth": "OAuth"},
    {"name": "Google AdSense", "description": "Earn money from websites, mobile sites, and site search results", "category": "Advertising", "link": "https://developers.google.com/adsense/", "auth": "OAuth"},
    {"name": "Google AdWords API", "description": "Manage Google AdWords campaigns programmatically", "category": "Advertising", "link": "https://developers.google.com/adwords/api/", "auth": "OAuth"},
    {"name": "Kevel Ad APIs", "description": "Build your own ad server with Kevel's ad APIs", "category": "Advertising", "link": "https://dev.kevel.co", "auth": "apiKey"},
    
    # === ANALYTICS ===
    {"name": "Amazon Mobile Analytics", "description": "Service for collecting, visualizing app usage data", "category": "Analytics", "link": "https://aws.amazon.com/documentation/mobileanalytics/", "auth": "apiKey"},
    {"name": "Clicky", "description": "Extract website traffic data into various formats", "category": "Analytics", "link": "https://clicky.com/help/api", "auth": "apiKey"},
    {"name": "DitchCarbon API", "description": "Company and product carbon emissions disclosures", "category": "Analytics", "link": "https://docs.ditchcarbon.com/", "auth": "apiKey"},
    {"name": "Google Analytics", "description": "Collect, configure, and report on user interactions", "category": "Analytics", "link": "https://developers.google.com/analytics/", "auth": "OAuth"},
    {"name": "Localytics", "description": "Interface to Localytics analytics platform", "category": "Analytics", "link": "http://docs.localytics.com/dev/query-api.html", "auth": "apiKey"},
    {"name": "Matomo", "description": "All-in-one web analytics platform", "category": "Analytics", "link": "https://matomo.org/docs/analytics-api/", "auth": "apiKey"},
    {"name": "MixPanel", "description": "Analytics for mobile and web", "category": "Analytics", "link": "https://developer.mixpanel.com/docs/implement-mixpanel", "auth": "apiKey"},
    {"name": "Open Web Analytics", "description": "Request and work with your data outside OWA", "category": "Analytics", "link": "https://github.com/padams/Open-Web-Analytics", "auth": "apiKey"},
    {"name": "Ticksel", "description": "Friendly website analytics for humans", "category": "Analytics", "link": "https://ticksel.com", "auth": "apiKey"},
    {"name": "Woopra", "description": "Real-time website analysis tool for customer engagement", "category": "Analytics", "link": "https://www.woopra.com/docs/developer/analytics-api/", "auth": "apiKey"},
    
    # === BARCODE ===
    {"name": "Google Barcode", "description": "Detect barcodes in real-time on device", "category": "Utilities", "link": "https://developers.google.com/vision/barcodes-overview", "auth": "apiKey"},
    {"name": "EAN-Search", "description": "Lookup products by EAN, UPC or GTIN barcode", "category": "E-Commerce", "link": "https://www.ean-search.org/ean-database-api.html", "auth": "apiKey"},
    {"name": "QR Code API", "description": "QR Code REST API for creation and reading", "category": "Utilities", "link": "https://fungenerators.com/api/qrcode/", "auth": "apiKey"},
    {"name": "QR Code Generator API", "description": "Static and Dynamic QR code generator", "category": "Utilities", "link": "https://docs.openqr.io/", "auth": "apiKey"},
    
    # === BIG DATA ===
    {"name": "Google Charts", "description": "Visualize data from a website", "category": "Analytics", "link": "https://developers.google.com/chart/", "auth": "none"},
    {"name": "Keen IO", "description": "Powerful, flexible Big Data solution", "category": "Analytics", "link": "https://keen.io/docs/api/", "auth": "apiKey"},
    {"name": "LinkedData.Center", "description": "RDF graph database with SPARQL query API", "category": "Databases", "link": "http://linkeddata.center/home/gdaas", "auth": "apiKey"},
    
    # === CRYPTOCURRENCY ===
    {"name": "Bitcoin", "description": "Bitcoin developer resources and reference material", "category": "Finance", "link": "https://developer.bitcoin.org/", "auth": "none"},
    {"name": "Bitcoincharts", "description": "Markets data for websites, mobile apps", "category": "Finance", "link": "https://bitcoincharts.com/about/markets-api/", "auth": "none"},
    {"name": "BitPay", "description": "Simple RESTful API for bitcoin infrastructure", "category": "Payments", "link": "https://bitpay.com/developers", "auth": "apiKey"},
    {"name": "Block.io", "description": "Most versatile and secure wallet for all coins", "category": "Finance", "link": "https://block.io/", "auth": "apiKey"},
    {"name": "BlockCypher", "description": "Infrastructure fabric for blockchain applications", "category": "Finance", "link": "https://www.blockcypher.com/", "auth": "apiKey"},
    {"name": "BlockFacts.io", "description": "Compliance-first digital asset data", "category": "Finance", "link": "https://blockfacts.io/", "auth": "apiKey"},
    {"name": "Coinbase", "description": "APIs and developer tools for bitcoin and blockchain", "category": "Finance", "link": "https://developers.coinbase.com/", "auth": "OAuth"},
    {"name": "CoinDesk", "description": "Bitcoin Price Index", "category": "Finance", "link": "http://www.coindesk.com/api/", "auth": "none"},
    {"name": "CoinGecko", "description": "Free comprehensive cryptocurrency API", "category": "Finance", "link": "https://coingecko.com/en/api", "auth": "none"},
    {"name": "Coinlore", "description": "Cryptocurrency tick data API", "category": "Finance", "link": "https://www.coinlore.com/cryptocurrency-data-api", "auth": "none"},
    {"name": "CoinMarketCap", "description": "Cryptocurrencies prices", "category": "Finance", "link": "https://coinmarketcap.com/api/", "auth": "apiKey"},
    {"name": "Coinpaprika", "description": "Cryptocurrencies prices, market capitalization, volume", "category": "Finance", "link": "https://api.coinpaprika.com", "auth": "none"},
    {"name": "CryptoCompare", "description": "Cryptocurrencies comparison", "category": "Finance", "link": "https://www.cryptocompare.com/api", "auth": "apiKey"},
    {"name": "Cryptonator", "description": "Cryptocurrencies exchange rates", "category": "Finance", "link": "https://www.cryptonator.com/api/", "auth": "none"},
    {"name": "Coinigy", "description": "Interact with Coinigy and Exchange accounts", "category": "Finance", "link": "https://coinigy.docs.apiary.io", "auth": "apiKey"},
    {"name": "Covalent", "description": "Multi-blockchain data aggregator", "category": "Finance", "link": "https://www.covalenthq.com/docs/api/", "auth": "apiKey"},
    {"name": "PENDAX", "description": "Javascript SDK for Trading, Data, Websockets", "category": "Finance", "link": "https://github.com/CompendiumFi/PENDAX-SDK", "auth": "apiKey"},
    {"name": "Poloniex", "description": "US based digital asset exchange", "category": "Finance", "link": "https://poloniex.com/support/api/", "auth": "apiKey"},
    {"name": "ShapeShift", "description": "Exchange between cryptocurrencies without account", "category": "Finance", "link": "https://shapeshift.io/", "auth": "apiKey"},
    
    # === CALENDAR ===
    {"name": "CalendarIndex", "description": "Worldwide Holidays and Working Days API", "category": "Utilities", "link": "https://www.calendarindex.com", "auth": "apiKey"},
    {"name": "DigiDates API", "description": "REST API for date and time calculations", "category": "Utilities", "link": "https://digidates.de/en/", "auth": "none"},
    {"name": "Holiday API", "description": "Public holiday API for several countries", "category": "Utilities", "link": "https://holidayapi.pl/", "auth": "apiKey"},
    {"name": "OpenHolidays API", "description": "Public and school holidays for European countries", "category": "Utilities", "link": "https://www.openholidaysapi.org/", "auth": "none"},
    
    # === CAPTCHA ===
    {"name": "Anti-Captcha", "description": "Access to Anti-Captcha's API", "category": "Security", "link": "https://anti-captcha.com/apidoc", "auth": "apiKey"},
    {"name": "ProxyCrawl", "description": "Crawl and scrape websites without proxies", "category": "Development", "link": "https://proxycrawl.com", "auth": "apiKey"},
    {"name": "Google reCAPTCHA", "description": "Protect web pages against spam and abuse", "category": "Security", "link": "https://developers.google.com/recaptcha/", "auth": "apiKey"},
    
    # === COMMERCE ===
    {"name": "Commerce Layer", "description": "Headless commerce platform API", "category": "E-Commerce", "link": "https://docs.commercelayer.io/api/", "auth": "OAuth"},
    {"name": "Envoice", "description": "Invoicing for online businesses", "category": "Business", "link": "https://www.envoice.in/reference/api/docs", "auth": "apiKey"},
    {"name": "Moltin", "description": "Unified APIs for inventory, carts, checkout", "category": "E-Commerce", "link": "https://www.moltin.com/developers", "auth": "apiKey"},
    {"name": "Stripe", "description": "Accept payments over the Internet", "category": "Payments", "link": "https://stripe.com/docs/api", "auth": "apiKey"},
    {"name": "Braintree", "description": "Mobile and web payment systems for ecommerce", "category": "Payments", "link": "https://developers.braintreepayments.com", "auth": "apiKey"},
    
    # === COMMUNICATION ===
    {"name": "Africa's Talking", "description": "Access African telco services through HTTP API", "category": "Communication", "link": "https://africastalking.com/", "auth": "apiKey"},
    {"name": "iP1sms", "description": "Send and receive SMS messages worldwide", "category": "Communication", "link": "https://www.ip1sms.com/en/developer/", "auth": "apiKey"},
    {"name": "Eqivo", "description": "Telephony/Programmable-Voice API platform", "category": "Communication", "link": "https://eqivo.org", "auth": "apiKey"},
    {"name": "MailGun", "description": "Transactional Email API for Developers", "category": "Email", "link": "https://mailgun.com", "auth": "apiKey"},
    {"name": "Nexmo", "description": "Phone calls, SMS worldwide with libraries", "category": "Communication", "link": "https://developer.nexmo.com", "auth": "apiKey"},
    {"name": "Sakari", "description": "Send SMS to 200+ countries", "category": "Communication", "link": "https://developer.sakari.io", "auth": "apiKey"},
    {"name": "Telnyx", "description": "Build Voice, SMS, Fax, IoT applications", "category": "Communication", "link": "https://developers.telnyx.com/", "auth": "apiKey"},
    {"name": "The SMS Works", "description": "Low-cost reliable SMS API for developers", "category": "Communication", "link": "https://thesmsworks.co.uk/sms-api", "auth": "apiKey"},
    {"name": "Twilio", "description": "APIs for SMS, Voice, Video and more", "category": "Communication", "link": "https://www.twilio.com/solutions", "auth": "apiKey"},
    
    # === CONTENT ===
    {"name": "Bible API", "description": "Support for 200+ Bible translations", "category": "Content", "link": "https://github.com/wldeh/bible-api", "auth": "none"},
    {"name": "Bible API 2", "description": "JSON API for public domain Bible translations", "category": "Content", "link": "https://bible-api.com/", "auth": "none"},
    {"name": "Fruits API", "description": "GraphQL API with fruit tree information", "category": "Content", "link": "https://github.com/Franqsanz/fruits-api", "auth": "none"},
    {"name": "Jokes API", "description": "Full featured Jokes API", "category": "Entertainment", "link": "https://jokes.one/api/joke/", "auth": "apiKey"},
    {"name": "Perfect Tense API", "description": "AI-powered spelling and grammar checking", "category": "Text Analysis", "link": "https://www.perfecttense.com/developers", "auth": "apiKey"},
    {"name": "Random Data Generator", "description": "Generate telephones, text, numbers, passwords", "category": "Utilities", "link": "https://randommer.io/randommer-api", "auth": "apiKey"},
    {"name": "Random Facts", "description": "Random Facts API", "category": "Content", "link": "https://fungenerators.com/api/facts/", "auth": "apiKey"},
    {"name": "Today in History", "description": "Daily historical events, births and deaths", "category": "Content", "link": "https://history.muffinlabs.com/", "auth": "none"},
    {"name": "Wikipedia API", "description": "Free multilingual Encyclopedia", "category": "Content", "link": "https://en.wikipedia.org/w/api.php", "auth": "none"},
    
    # === CURRENCY ===
    {"name": "1Forge", "description": "Real-time forex and crypto quotes via JSON", "category": "Finance", "link": "https://1forge.com/", "auth": "apiKey"},
    {"name": "Currency-API", "description": "Free Currency Exchange Rates with 150+ currencies", "category": "Finance", "link": "https://github.com/fawazahmed0/currency-api", "auth": "none"},
    {"name": "CurrencyLayer", "description": "Exchange rates and currency conversion API", "category": "Finance", "link": "https://currencylayer.com/documentation", "auth": "apiKey"},
    {"name": "CurrencyScoop", "description": "Real-time and historical currency rates JSON API", "category": "Finance", "link": "https://currencyscoop.com/", "auth": "apiKey"},
    {"name": "ECB Exchange Rates", "description": "Free currency exchange rates from ECB", "category": "Finance", "link": "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", "auth": "none"},
    {"name": "ExchangeRate-API", "description": "Currency conversion API", "category": "Finance", "link": "https://www.exchangerate-api.com/docs/overview", "auth": "apiKey"},
    {"name": "ExchangeRatesAPI.io", "description": "Foreign exchange rates API with conversion", "category": "Finance", "link": "https://exchangeratesapi.io/", "auth": "apiKey"},
    {"name": "Fixer.io", "description": "JSON API for foreign exchange rates", "category": "Finance", "link": "http://fixer.io/", "auth": "apiKey"},
    {"name": "Frankfurter", "description": "Exchange rates and currency data API", "category": "Finance", "link": "https://www.frankfurter.app/docs/", "auth": "none"},
    {"name": "OpenRates", "description": "Live exchange rates and currency conversion", "category": "Finance", "link": "http://www.openrates.io/", "auth": "none"},
    
    # === DESIGN ===
    {"name": "Dribbble", "description": "Community of designers", "category": "Design", "link": "http://developer.dribbble.com/", "auth": "OAuth"},
    {"name": "Icon Horse", "description": "Get favicon logo for any web address", "category": "Design", "link": "https://icon.horse/usage", "auth": "none"},
    {"name": "Pexels", "description": "High quality free stock photos", "category": "Photography", "link": "https://www.pexels.com/api/", "auth": "apiKey"},
    {"name": "PHP-Noise", "description": "Noise background image generator", "category": "Design", "link": "https://php-noise.com/", "auth": "none"},
    
    # === DICTIONARY ===
    {"name": "Cambridge Dictionaries", "description": "Access Cambridge's custom-developed API", "category": "Language", "link": "http://dictionary.cambridge.org/license.html", "auth": "apiKey"},
    {"name": "Datamuse API", "description": "Word-finding query engine", "category": "Language", "link": "https://www.datamuse.com/api/", "auth": "none"},
    {"name": "Free Dictionary API", "description": "Get word definitions for free", "category": "Language", "link": "https://dictionaryapi.dev/", "auth": "none"},
    {"name": "Lingua Robot API", "description": "Definition, pronunciation, synonyms, antonyms", "category": "Language", "link": "https://www.linguarobot.io/", "auth": "apiKey"},
    {"name": "Merriam-Webster API", "description": "Dictionary and thesaurus content", "category": "Language", "link": "http://www.dictionaryapi.com/", "auth": "apiKey"},
    {"name": "Oxford Dictionary API", "description": "Access to Oxford Dictionary services", "category": "Language", "link": "https://developer.oxforddictionaries.com/", "auth": "apiKey"},
    {"name": "Wordnik", "description": "Dictionary functions", "category": "Language", "link": "http://developer.wordnik.com/docs.html", "auth": "apiKey"},
    {"name": "Words API", "description": "Find definitions for 150,000+ words", "category": "Language", "link": "https://www.wordsapi.com/", "auth": "apiKey"},
    {"name": "Wiktionary API", "description": "Free multilingual dictionary", "category": "Language", "link": "https://en.wiktionary.org/w/api.php", "auth": "none"},
    
    # === ENTERTAINMENT ===
    {"name": "AniList", "description": "Access to 500k+ anime and manga entries", "category": "Entertainment", "link": "https://anilist.gitbook.io/anilist-apiv2-docs/", "auth": "OAuth"},
    {"name": "Bob's Burgers API", "description": "Data for characters, episodes, running gags", "category": "Entertainment", "link": "https://www.bobsburgersapi.com/documentation", "auth": "none"},
    {"name": "Breaking Bad API", "description": "Data about characters, episodes, quotes, deaths", "category": "Entertainment", "link": "https://breakingbadapi.com/documentation", "auth": "none"},
    {"name": "CATAAS", "description": "Cat as a Service - cat pictures", "category": "Entertainment", "link": "https://cataas.com/", "auth": "none"},
    {"name": "Comic Vine", "description": "Comic information database", "category": "Entertainment", "link": "http://comicvine.gamespot.com/api/", "auth": "apiKey"},
    {"name": "Danbooru", "description": "Get images categorized by tags", "category": "Entertainment", "link": "https://danbooru.donmai.us/posts", "auth": "apiKey"},
    {"name": "Dune API", "description": "Book, character, movie and quotes JSON data", "category": "Entertainment", "link": "https://github.com/ywalia01/dune-api", "auth": "none"},
    {"name": "Final Space API", "description": "Information and images about Final Space", "category": "Entertainment", "link": "https://finalspaceapi.com/docs/", "auth": "none"},
    {"name": "Fun Translations API", "description": "Translate to 50+ languages from TV/Movies", "category": "Entertainment", "link": "https://funtranslations.com/api/", "auth": "apiKey"},
    {"name": "Lord of the Rings API", "description": "Data about books, movies, characters, quotes", "category": "Entertainment", "link": "https://the-one-api.dev/documentation", "auth": "apiKey"},
    {"name": "Marvel", "description": "Access over 70 years of comic data", "category": "Entertainment", "link": "https://developer.marvel.com/", "auth": "apiKey"},
    {"name": "My Anime List API", "description": "Data about any anime or genre", "category": "Entertainment", "link": "https://jikan.moe/", "auth": "none"},
    {"name": "Owen Wilson Wow API", "description": "Owen Wilson's wow exclamations in movies", "category": "Entertainment", "link": "https://owen-wilson-wow-api.onrender.com/", "auth": "none"},
    {"name": "Pokemon API", "description": "All Pokémon data you'll ever need", "category": "Entertainment", "link": "https://pokeapi.co/", "auth": "none"},
    {"name": "Rick and Morty", "description": "All Rick and Morty information including images", "category": "Entertainment", "link": "https://rickandmortyapi.com/", "auth": "none"},
    {"name": "Riddles API", "description": "API to get random riddles", "category": "Entertainment", "link": "https://riddles-api.vercel.app/", "auth": "none"},
    {"name": "Star Trek API", "description": "STAPI - Star Trek data", "category": "Entertainment", "link": "https://stapi.co/api-documentation", "auth": "none"},
    {"name": "Star Wars API", "description": "All things Star Wars", "category": "Entertainment", "link": "https://www.swapi.tech/", "auth": "none"},
    {"name": "Studio Ghibli", "description": "Resources from Studio Ghibli films", "category": "Entertainment", "link": "https://ghibliapi.vercel.app/", "auth": "none"},
    {"name": "StockX API", "description": "150k+ sneakers and fashion products", "category": "E-Commerce", "link": "https://stockx.vlour.me/", "auth": "apiKey"},
    {"name": "TCGdex", "description": "Multilanguage Pokémon TCG Database", "category": "Entertainment", "link": "https://www.tcgdex.dev/", "auth": "none"},
    
    # === FACE RECOGNITION ===
    {"name": "Kairos", "description": "Face recognition, emotion analysis", "category": "AI/ML", "link": "https://www.kairos.com/", "auth": "apiKey"},
    {"name": "Skybiometry", "description": "Face detection, emotional analysis", "category": "AI/ML", "link": "https://www.skybiometry.com", "auth": "apiKey"},
    
    # === FILE STORAGE ===
    {"name": "Amazon S3", "description": "Access to stored files", "category": "Cloud Storage", "link": "https://aws.amazon.com/de/documentation/s3/", "auth": "apiKey"},
    {"name": "Cloudinary", "description": "Image and video storage and manipulation", "category": "Cloud Storage", "link": "http://cloudinary.com/documentation", "auth": "apiKey"},
    {"name": "DigitalOcean Spaces", "description": "Simple object storage", "category": "Cloud Storage", "link": "https://www.digitalocean.com/products/spaces", "auth": "apiKey"},
    {"name": "Dropbox", "description": "Powerful API for apps that work with files", "category": "Cloud Storage", "link": "https://www.dropbox.com/developers", "auth": "OAuth"},
    {"name": "Filestack", "description": "API for image and file manipulation", "category": "Cloud Storage", "link": "https://filestack.com/docs/", "auth": "apiKey"},
    {"name": "Microsoft Graph", "description": "OneDrive files and photos", "category": "Cloud Storage", "link": "https://graph.microsoft.io/en-us/docs", "auth": "OAuth"},
    {"name": "PDF Blocks", "description": "API for working with PDF documents", "category": "Document", "link": "https://www.pdfblocks.com/docs/api/getting-started", "auth": "apiKey"},
    {"name": "SignNow", "description": "Embed branded eSignature workflows", "category": "Document", "link": "https://docs.signnow.com/docs/signnow/welcome", "auth": "apiKey"},
    {"name": "Smash", "description": "Upload large files on websites, mobile apps", "category": "Cloud Storage", "link": "https://api.fromsmash.com/", "auth": "apiKey"},
    {"name": "Vertopal", "description": "Convert files to a variety of formats", "category": "Document", "link": "https://www.vertopal.com/en/developer/api/introduction", "auth": "apiKey"},
    
    # === FINANCE ===
    {"name": "Alpha Vantage", "description": "Stock, ETF, mutual fund, forex, crypto data", "category": "Finance", "link": "https://www.alphavantage.co/", "auth": "apiKey"},
    {"name": "Atom Finance", "description": "Market, earnings and news data", "category": "Finance", "link": "https://docs.atom.finance/", "auth": "apiKey"},
    {"name": "IEX", "description": "Free Stocks and Market Data", "category": "Finance", "link": "https://iextrading.com/developer/", "auth": "apiKey"},
    {"name": "Twelve Data", "description": "Stock market data real-time and historical", "category": "Finance", "link": "https://twelvedata.com/docs/", "auth": "apiKey"},
    {"name": "IBANAPI", "description": "Validate IBAN number and get bank account", "category": "Finance", "link": "https://ibanapi.com/get-api", "auth": "apiKey"},
    {"name": "Parqet Logo API", "description": "Free Company Logo API for 400k+ stocks", "category": "Finance", "link": "https://developers.parqet.com/docs/assets/logos", "auth": "none"},
    {"name": "Portfolio Optimizer", "description": "API for investment portfolio optimization", "category": "Finance", "link": "https://portfoliooptimizer.io/", "auth": "apiKey"},
    
    # === FITNESS ===
    {"name": "FitBit", "description": "Data from Fitbit activity trackers", "category": "Fitness", "link": "https://dev.fitbit.com/build/reference/", "auth": "OAuth"},
    {"name": "HealthGraph", "description": "RunKeeper's Health Graph data", "category": "Fitness", "link": "https://runkeeper.com/developer/healthgraph", "auth": "OAuth"},
    {"name": "Open Food Facts", "description": "Food products with ingredients, allergens, nutrition", "category": "Food", "link": "https://en.wiki.openfoodfacts.org/API", "auth": "none"},
    {"name": "Strava", "description": "Access and manage athlete data", "category": "Fitness", "link": "https://strava.github.io/api/", "auth": "OAuth"},
    {"name": "VeganCheck", "description": "Information about food products by EAN/UPC", "category": "Food", "link": "https://jokenetwork.de/vegancheck-api", "auth": "none"},
    {"name": "Withings", "description": "Data from Withings activity trackers", "category": "Fitness", "link": "http://oauth.withings.com/api", "auth": "OAuth"},
    
    # === GOOGLE ===
    {"name": "Gmail API", "description": "The Gmail REST API", "category": "Email", "link": "https://developers.google.com/gmail/api/", "auth": "OAuth"},
    {"name": "Google BigQuery API", "description": "Data platform for creating, managing data", "category": "Databases", "link": "https://cloud.google.com/bigquery/docs/reference/rest/v2/", "auth": "OAuth"},
    {"name": "Google Books API", "description": "Search for books and manage library", "category": "Content", "link": "https://developers.google.com/books/", "auth": "apiKey"},
    {"name": "Google Calendar API", "description": "Manipulate events and calendar data", "category": "Utilities", "link": "https://developers.google.com/google-apps/calendar/", "auth": "OAuth"},
    {"name": "Google Classroom API", "description": "The Google Classroom API", "category": "Education", "link": "https://developers.google.com/classroom/", "auth": "OAuth"},
    {"name": "Google Custom Search API", "description": "Search over a website or collection", "category": "Search", "link": "https://developers.google.com/custom-search/json-api/v1/overview", "auth": "apiKey"},
    {"name": "Google Drive API", "description": "Interact with Google Drive", "category": "Cloud Storage", "link": "https://developers.google.com/drive/v2/reference/", "auth": "OAuth"},
    {"name": "Google Fitness API", "description": "The Fit API", "category": "Fitness", "link": "https://developers.google.com/fit/", "auth": "OAuth"},
    {"name": "Google Fonts API", "description": "Add fonts to any web page", "category": "Design", "link": "https://developers.google.com/fonts/", "auth": "apiKey"},
    {"name": "Google Genomics API", "description": "Access to Genomics data", "category": "Health", "link": "https://cloud.google.com/genomics/reference/rest/", "auth": "OAuth"},
    
    # === IDENTITY ===
    {"name": "BlockScore", "description": "Real-time identity verification API", "category": "Security", "link": "https://docs.blockscore.com/", "auth": "apiKey"},
    {"name": "Cognito", "description": "Identity verification and retrieval", "category": "Security", "link": "https://cognitohq.com/docs", "auth": "apiKey"},
    {"name": "Whitepages Pro", "description": "Global Identity Verification API", "category": "Security", "link": "https://pro.whitepages.com/", "auth": "apiKey"},
    
    # === IOT ===
    {"name": "Ably", "description": "Cross-protocol real time communication", "category": "IoT", "link": "https://www.ably.com/documentation", "auth": "apiKey"},
    {"name": "Particle", "description": "Manage Particle devices including Arduino", "category": "IoT", "link": "https://docs.particle.io/reference/api/", "auth": "apiKey"},
    {"name": "PubNub", "description": "Real time applications with hardware devices", "category": "IoT", "link": "https://www.pubnub.com/docs", "auth": "apiKey"},
    {"name": "Philips Hue", "description": "Control Hue brand lights", "category": "IoT", "link": "https://developers.meethue.com/documentation/getting-started", "auth": "apiKey"},
    {"name": "SmartThings", "description": "Samsung SmartThings Smart Home Hub API", "category": "IoT", "link": "http://developer.smartthings.com/", "auth": "OAuth"},
    {"name": "ThingSpeak", "description": "Internet of Things application and API", "category": "IoT", "link": "https://github.com/iobridge/ThingSpeak", "auth": "apiKey"},
    {"name": "Zetta", "description": "Open source platform for creating IoT servers", "category": "IoT", "link": "https://github.com/zettajs/zetta/wiki", "auth": "none"},
    
    # === MACHINE LEARNING ===
    {"name": "Amazon ML API", "description": "Predictions with machine learning models", "category": "AI/ML", "link": "http://docs.aws.amazon.com/machine-learning/latest/APIReference/", "auth": "apiKey"},
    {"name": "AYLIEN", "description": "NLP, Information Retrieval and ML tools", "category": "AI/ML", "link": "http://aylien.com/", "auth": "apiKey"},
    {"name": "BigML", "description": "Machine Learning API for decision trees", "category": "AI/ML", "link": "http://bigml.com/api/", "auth": "apiKey"},
    {"name": "Google Cloud ML", "description": "Cloud-based machine learning", "category": "AI/ML", "link": "https://cloud.google.com/ml-engine/docs/", "auth": "apiKey"},
    {"name": "Microsoft Azure ML", "description": "Cognitive services and machine learning", "category": "AI/ML", "link": "https://azure.microsoft.com/en-us/services/cognitive-services/", "auth": "apiKey"},
    {"name": "ObjectCut", "description": "Automatic background removal powered by AI", "category": "AI/ML", "link": "https://objectcut.com", "auth": "apiKey"},
    {"name": "OVHcloud AI Endpoints", "description": "GenAI & ML integration with secure APIs", "category": "AI/ML", "link": "https://endpoints.ai.cloud.ovh.net/", "auth": "apiKey"},
    
    # === MAPS ===
    {"name": "Amazon Maps API", "description": "Interactive 3D maps for Fire Tablet and phone", "category": "Geocoding", "link": "https://developer.amazon.com/maps", "auth": "apiKey"},
    {"name": "Bing Maps", "description": "Bing Maps APIs", "category": "Geocoding", "link": "https://www.microsoft.com/maps/choose-your-bing-maps-API.aspx", "auth": "apiKey"},
    {"name": "Cartes.io", "description": "Create maps and markers without authentication", "category": "Geocoding", "link": "https://github.com/M-Media-Group/Cartes.io/wiki/API", "auth": "none"},
    {"name": "CartoDB", "description": "Generate maps based on CartoDB data", "category": "Geocoding", "link": "https://carto.com/developers/", "auth": "apiKey"},
    {"name": "Google Maps API", "description": "Google Maps APIs for Android, iOS, web", "category": "Geocoding", "link": "https://developers.google.com/maps/", "auth": "apiKey"},
    {"name": "HERE Maps API", "description": "JavaScript, iOS, Android, or REST services", "category": "Geocoding", "link": "https://developer.here.com/", "auth": "apiKey"},
    {"name": "Leaflet.js", "description": "Open-source JavaScript library for maps", "category": "Geocoding", "link": "http://leafletjs.com/", "auth": "none"},
    {"name": "Mapbox", "description": "Access to MapBox's API", "category": "Geocoding", "link": "https://www.mapbox.com/developers/api/maps/", "auth": "apiKey"},
    {"name": "OpenStreetMap", "description": "API access to OSM", "category": "Geocoding", "link": "http://wiki.openstreetmap.org/wiki/API", "auth": "OAuth"},
    {"name": "Scribble Maps", "description": "Cross browser HTML5/JavaScript map builder", "category": "Geocoding", "link": "https://www.scribblemaps.com/api/", "auth": "apiKey"},
    {"name": "Yandex Maps", "description": "Yandex.Maps tools for web apps", "category": "Geocoding", "link": "https://tech.yandex.com/maps/", "auth": "apiKey"},
    
    # === MATH ===
    {"name": "Newton", "description": "API for Arithmetic and Symbolic Math", "category": "Utilities", "link": "https://newton.now.sh/", "auth": "none"},
    
    # === MEDICAL ===
    {"name": "COVID-19 Data", "description": "Live and historical Coronavirus data", "category": "Health", "link": "https://github.com/M-Media-Group/Covid-19-API", "auth": "none"},
    {"name": "Infermedica", "description": "AI-based patient triage and diagnosis", "category": "Health", "link": "https://developer.infermedica.com/docs/introduction", "auth": "apiKey"},
    
    # === MISCELLANEOUS ===
    {"name": "Mozilla Addons", "description": "Catalogue of addons for Firefox", "category": "Development", "link": "https://addons-server.readthedocs.io/en/latest/topics/api/index.html", "auth": "apiKey"},
    {"name": "Art Institute of Chicago API", "description": "Explore Art Institute public data", "category": "Content", "link": "https://api.artic.edu/docs/", "auth": "none"},
    {"name": "Bored API", "description": "Generates tasks to do when bored", "category": "Entertainment", "link": "https://www.boredapi.com/documentation", "auth": "none"},
    {"name": "BrowserCat", "description": "Headless browser API for automation", "category": "Development", "link": "https://www.browsercat.com/docs", "auth": "apiKey"},
    {"name": "Bruzu", "description": "Dynamically generate Images with URL string", "category": "Design", "link": "https://docs.bruzu.com", "auth": "apiKey"},
    {"name": "ChuckNorris.io", "description": "Hand curated Chuck Norris facts", "category": "Entertainment", "link": "https://api.chucknorris.io", "auth": "none"},
    {"name": "Cloudflare Trace", "description": "Get IP Address, User Agent, Country Code", "category": "Utilities", "link": "https://www.cloudflare.com/cdn-cgi/trace", "auth": "none"},
    {"name": "Cloudlayer.io", "description": "Generate PDFs and Images from websites", "category": "Document", "link": "https://cloudlayer.io", "auth": "apiKey"},
    {"name": "Codewars API", "description": "Coding challenge data and statistics", "category": "Development", "link": "https://dev.codewars.com/", "auth": "none"},
    {"name": "Congress.gov API", "description": "Machine-readable data from Congress.gov", "category": "Government", "link": "https://api.congress.gov", "auth": "apiKey"},
    {"name": "Dataflow Kit", "description": "Web Scraper API to extract information", "category": "Development", "link": "https://dataflowkit.com/doc-api", "auth": "apiKey"},
    {"name": "Domainsdb.info", "description": "Search for registered domain names", "category": "Development", "link": "https://domainsdb.info", "auth": "none"},
    {"name": "Evil Insult Generator", "description": "Generate evil insults", "category": "Entertainment", "link": "https://evilinsult.com/api/", "auth": "none"},
    {"name": "Flowdash", "description": "Create, edit, delete workflow data", "category": "Business", "link": "https://docs.flowdash.com/docs/api-introduction", "auth": "apiKey"},
    {"name": "Game of Thrones Quotes", "description": "Game of Thrones quotes API", "category": "Entertainment", "link": "https://gameofthronesquotes.xyz", "auth": "none"},
    {"name": "Geocodify", "description": "Worldwide geocoding and autocomplete", "category": "Geocoding", "link": "https://geocodify.com", "auth": "apiKey"},
    {"name": "Giphy", "description": "Worlds largest library of GIFs", "category": "Entertainment", "link": "https://developers.giphy.com/docs/", "auth": "apiKey"},
    {"name": "Httpbin", "description": "Simple HTTP Request & Response Service", "category": "Development", "link": "https://httpbin.org/", "auth": "none"},
    {"name": "Image-Charts", "description": "Chart image from URL GET or POST", "category": "Design", "link": "https://www.image-charts.com", "auth": "none"},
    {"name": "Jobicy", "description": "Latest remote job listings", "category": "Business", "link": "https://jobicy.com/jobs-rss-feed", "auth": "none"},
    {"name": "JSONbin.io", "description": "Free JSON data storage service", "category": "Development", "link": "https://jsonbin.io/api-reference", "auth": "apiKey"},
    {"name": "Judge0 API", "description": "Compile and run source code", "category": "Development", "link": "https://api.judge0.com/", "auth": "apiKey"},
    {"name": "Labs64 NetLicensing", "description": "Innovative License Management Solution", "category": "Business", "link": "https://netlicensing.io/wiki/restful-api", "auth": "apiKey"},
    {"name": "LinkPreview", "description": "Returns title, description and preview image", "category": "Development", "link": "https://www.linkpreview.net", "auth": "apiKey"},
    {"name": "LiveChat", "description": "Customer Service software with APIs", "category": "Customer Support", "link": "https://developers.livechatinc.com/", "auth": "apiKey"},
    {"name": "NetworkCalc", "description": "Network calculator tools like subnet calculations", "category": "Development", "link": "https://networkcalc.com/api/docs", "auth": "none"},
    {"name": "PDFmyURL", "description": "Converts web pages to PDF", "category": "Document", "link": "https://pdfmyurl.com/html-to-pdf-api", "auth": "apiKey"},
    {"name": "Pastebin", "description": "Share text or code quickly", "category": "Development", "link": "https://pastebin.com/doc_scraping_api", "auth": "apiKey"},
    {"name": "PhantAuth", "description": "Random User Generator + OpenID Connect", "category": "Security", "link": "https://www.phantauth.net/", "auth": "none"},
    {"name": "QuickChart", "description": "Generate Chart.js images for email", "category": "Design", "link": "https://quickchart.io", "auth": "none"},
    {"name": "Quran API", "description": "RESTful Quran API for Ayah, Surah, Juz", "category": "Content", "link": "https://alquran.cloud/api", "auth": "none"},
    {"name": "Scraper API", "description": "Handles proxies and CAPTCHAs for scraping", "category": "Development", "link": "https://www.scraperapi.com", "auth": "apiKey"},
    {"name": "SearchApi", "description": "Real-time API for scraping search engines", "category": "Search", "link": "https://www.searchapi.io/", "auth": "apiKey"},
    {"name": "Shadify", "description": "Generate data for games and puzzles", "category": "Entertainment", "link": "https://github.com/cheatsnake/shadify", "auth": "none"},
    {"name": "Shotstack Video Editing", "description": "Scalable video automation workflows", "category": "Video", "link": "https://shotstack.io/docs/", "auth": "apiKey"},
    {"name": "StackExchange", "description": "RESTful API for StackExchange sites", "category": "Development", "link": "https://api.stackexchange.com/docs", "auth": "OAuth"},
    {"name": "REST Countries", "description": "Get country information via RESTful API", "category": "Content", "link": "https://restcountries.eu", "auth": "none"},
    {"name": "Typeform", "description": "Create and edit Typeform surveys", "category": "Business", "link": "https://developer.typeform.com/", "auth": "OAuth"},
    {"name": "Wallhaven", "description": "Huge wallpaper library", "category": "Entertainment", "link": "https://wallhaven.cc/help/api", "auth": "apiKey"},
    {"name": "Who Hosts This", "description": "Detect hosting provider of any website", "category": "Development", "link": "https://www.who-hosts-this.com/API", "auth": "apiKey"},
    {"name": "WolframAlpha", "description": "Computational knowledge integration", "category": "AI/ML", "link": "http://products.wolframalpha.com/api/", "auth": "apiKey"},
    
    # === MOVIES ===
    {"name": "OMDB", "description": "Movie metadata from OMDb", "category": "Entertainment", "link": "https://www.omdbapi.com/", "auth": "apiKey"},
    {"name": "TMDb", "description": "Powerful movie searches and discovery", "category": "Entertainment", "link": "https://www.themoviedb.org/documentation/api", "auth": "apiKey"},
    {"name": "Trakt", "description": "TV shows and movies everyone is watching", "category": "Entertainment", "link": "https://trakt.docs.apiary.io/", "auth": "apiKey"},
    {"name": "TVmaze", "description": "TV Show and web series database", "category": "Entertainment", "link": "https://www.tvmaze.com/api", "auth": "none"},
    
    # === MUSIC ===
    {"name": "AI Mastering", "description": "Automated audio mastering service", "category": "Music", "link": "https://aimastering.com/api_docs/", "auth": "apiKey"},
    {"name": "Deezer", "description": "Internet-based music streaming service", "category": "Music", "link": "http://developers.deezer.com/api", "auth": "OAuth"},
    {"name": "Discogs", "description": "Database of artists, labels, releases", "category": "Music", "link": "https://www.discogs.com/developers/", "auth": "OAuth"},
    {"name": "Last.fm", "description": "Build programs using Last.fm data", "category": "Music", "link": "http://www.last.fm/api", "auth": "apiKey"},
    {"name": "NPR API", "description": "NPR stories in structured way", "category": "Content", "link": "https://dev.npr.org/", "auth": "apiKey"},
    {"name": "Rhapsody", "description": "Access metadata and user library", "category": "Music", "link": "https://developer.rhapsody.com/", "auth": "apiKey"},
    {"name": "SearchLy", "description": "Song similarity search based on lyrics", "category": "Music", "link": "https://github.com/AlbertSuarez/searchly", "auth": "none"},
    {"name": "SoundCloud", "description": "Upload and share sounds", "category": "Music", "link": "https://developers.soundcloud.com", "auth": "OAuth"},
    {"name": "Spotify", "description": "Fetch data from Spotify music catalog", "category": "Music", "link": "https://beta.developer.spotify.com/documentation/web-api", "auth": "OAuth"},
    {"name": "TheAudioDB", "description": "Free JSON API for music data", "category": "Music", "link": "http://www.theaudiodb.com", "auth": "none"},
    {"name": "Setlist.fm", "description": "Easy access to setlist data", "category": "Music", "link": "https://api.setlist.fm/docs/1.0/index.html", "auth": "apiKey"},
    {"name": "TuneFind", "description": "Song, show, and movie data", "category": "Music", "link": "http://www.tunefind.com/api", "auth": "apiKey"},
    {"name": "Genius", "description": "Details about Genius artists and songs", "category": "Music", "link": "https://docs.genius.com/", "auth": "OAuth"},
    {"name": "Acoustid", "description": "Fingerprint database search", "category": "Music", "link": "https://acoustid.org/webservice", "auth": "apiKey"},
    {"name": "AudD", "description": "Recognize music in recordings", "category": "Music", "link": "https://docs.audd.io/", "auth": "apiKey"},
    {"name": "Gracenote", "description": "Largest music and video metadata source", "category": "Music", "link": "https://developer.gracenote.com/", "auth": "apiKey"},
    {"name": "ChartLyrics", "description": "Search for lyrics by artist name", "category": "Music", "link": "http://www.chartlyrics.com/api.aspx", "auth": "none"},
    {"name": "Musixmatch", "description": "World's most authoritative lyrics DB", "category": "Music", "link": "https://developer.musixmatch.com/", "auth": "apiKey"},
    {"name": "iTunes Search", "description": "Search iTunes Store content", "category": "Music", "link": "https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/", "auth": "none"},
    {"name": "Reverb", "description": "Sell and buy music merchandise", "category": "E-Commerce", "link": "https://dev.reverb.com/", "auth": "OAuth"},
    
    # === NEWS ===
    {"name": "Faroo", "description": "Alternative to Google News Search API", "category": "News", "link": "http://www.faroo.com/hp/api/api.html", "auth": "apiKey"},
    {"name": "Mediastack", "description": "Scalable JSON API for worldwide news", "category": "News", "link": "https://mediastack.com/documentation", "auth": "apiKey"},
    {"name": "New York Times", "description": "Article search, best sellers, more", "category": "News", "link": "http://developer.nytimes.com/", "auth": "apiKey"},
    {"name": "NewsAPI", "description": "70+ news sources and headlines", "category": "News", "link": "https://newsapi.org/", "auth": "apiKey"},
    {"name": "NewsCatcherAPI", "description": "Find news by topic, country, language", "category": "News", "link": "https://newscatcherapi.com/news-api", "auth": "apiKey"},
    {"name": "RSS API", "description": "Parse and subscribe to RSS Feeds", "category": "News", "link": "https://docs.rssapi.net", "auth": "apiKey"},
    {"name": "The Guardian", "description": "Access content from The Guardian", "category": "News", "link": "http://open-platform.theguardian.com/", "auth": "apiKey"},
    
    # === NLP ===
    {"name": "Cloudmersive NLP", "description": "Unified NLP APIs for translation, sentiment", "category": "AI/ML", "link": "https://cloudmersive.com/nlp-api", "auth": "apiKey"},
    {"name": "Cohere", "description": "Text summarization, extraction, generation", "category": "AI/ML", "link": "https://docs.cohere.com/reference/about", "auth": "apiKey"},
    {"name": "DialogFlow", "description": "Natural Language Interactions for Bots", "category": "AI/ML", "link": "https://dialogflow.com/", "auth": "apiKey"},
    {"name": "Datum Box", "description": "Open-source Machine Learning Framework", "category": "AI/ML", "link": "http://www.datumbox.com/machine-learning-api/", "auth": "apiKey"},
    {"name": "Lemonfox.ai", "description": "Speech-to-text API using Whisper model", "category": "AI/ML", "link": "https://www.lemonfox.ai/apis/speech-to-text", "auth": "apiKey"},
    {"name": "LUIS AI", "description": "Language Understanding for applications", "category": "AI/ML", "link": "https://www.luis.ai/", "auth": "apiKey"},
    {"name": "MeaningCloud", "description": "Text analysis APIs for multiple languages", "category": "AI/ML", "link": "https://www.meaningcloud.com", "auth": "apiKey"},
    {"name": "OpenAI API", "description": "GPT-3 and Codex for NL tasks", "category": "AI/ML", "link": "https://platform.openai.com/docs/introduction", "auth": "apiKey"},
    {"name": "ParallelDots", "description": "Sentiment analysis and emotion detection", "category": "AI/ML", "link": "https://www.paralleldots.com/text-analysis-apis", "auth": "apiKey"},
    {"name": "SpeechText.AI", "description": "Cloud Speech Recognition API", "category": "AI/ML", "link": "https://speechtext.ai/speech-recognition-api", "auth": "apiKey"},
    {"name": "SummarizeBot", "description": "AI web data extraction and analysis", "category": "AI/ML", "link": "https://www.summarizebot.com/summarization_business.html", "auth": "apiKey"},
    {"name": "TextRazor", "description": "Extract Who, What, Why, How from text", "category": "AI/ML", "link": "https://www.textrazor.com/plans", "auth": "apiKey"},
    {"name": "VoiceRSS", "description": "Convert Text to Speech, 15+ languages", "category": "AI/ML", "link": "http://www.voicerss.org/", "auth": "apiKey"},
    {"name": "Wit AI", "description": "Intent-based NLP API for chatbots", "category": "AI/ML", "link": "https://wit.ai/", "auth": "apiKey"},
    {"name": "Word Associations", "description": "Get associations for a word or phrase", "category": "Language", "link": "https://wordassociations.net/en/api", "auth": "apiKey"},
    
    # === PLACEHOLDER IMAGES ===
    {"name": "DummyImage", "description": "Placeholder images with flexibility", "category": "Design", "link": "https://dummyimage.com/", "auth": "none"},
    {"name": "Pixabay", "description": "Restful API for free images and videos", "category": "Photography", "link": "https://pixabay.com/api/docs/", "auth": "apiKey"},
    {"name": "SingleColorImage", "description": "Generate single color images to 5000x5000", "category": "Design", "link": "https://singlecolorimage.com/api.html", "auth": "none"},
    {"name": "Lorem Picsum", "description": "Beautiful placeholders from Unsplash", "category": "Design", "link": "https://picsum.photos/", "auth": "none"},
    
    # === PLACES ===
    {"name": "bng2latlong", "description": "Convert OSGB36 to WGS84 coordinates", "category": "Geocoding", "link": "https://www.getthedata.com/bng2latlong", "auth": "none"},
    {"name": "CountryAPI", "description": "Get all countries with important info", "category": "Content", "link": "https://fabian7593.github.io/CountryAPI/", "auth": "none"},
    {"name": "Factual", "description": "Places search by lat/long and full text", "category": "Geocoding", "link": "https://developer.factual.com/docs/getting-started", "auth": "apiKey"},
    {"name": "Foursquare Venue", "description": "Places search with categories", "category": "Geocoding", "link": "https://developer.foursquare.com/overview/venues", "auth": "apiKey"},
    {"name": "Google Places API", "description": "Places search with various filters", "category": "Geocoding", "link": "https://developers.google.com/maps/documentation/places/", "auth": "apiKey"},
    {"name": "World Wonders API", "description": "Famous wonders from around the world", "category": "Content", "link": "https://github.com/Rolv-Apneseth/world-wonders-api", "auth": "none"},
    {"name": "Yelp", "description": "Search by longitude, latitude, address", "category": "Business", "link": "https://docs.developer.yelp.com/docs/getting-started", "auth": "apiKey"},
    
    # === QUOTES ===
    {"name": "Breaking Bad Quotes", "description": "Quotes from Breaking Bad", "category": "Entertainment", "link": "https://breakingbadquotes.xyz", "auth": "none"},
    {"name": "FavQs", "description": "Collect, discover, share favorite quotes", "category": "Content", "link": "https://favqs.com/api", "auth": "apiKey"},
    {"name": "Forismatic", "description": "Random quote per click", "category": "Content", "link": "http://api.forismatic.com/api/1.0/", "auth": "none"},
    {"name": "Quotable", "description": "Fetch quotes by author, ID, tags", "category": "Content", "link": "https://github.com/lukePeavey/quotable", "auth": "none"},
    {"name": "South Park Quotes", "description": "Quotes from South Park", "category": "Entertainment", "link": "https://github.com/Thatskat/southpark-quotes-api", "auth": "none"},
    
    # === SCIENCE ===
    {"name": "MPDS", "description": "Experimental materials science data", "category": "Science", "link": "https://developer.mpds.io", "auth": "apiKey"},
    {"name": "NASA", "description": "NASA data, imagery, asteroids and more", "category": "Science", "link": "https://api.nasa.gov/index.html", "auth": "apiKey"},
    {"name": "Open Science Framework", "description": "Workflow/project management for research", "category": "Science", "link": "https://osf.io/y9jdt/wiki/home/", "auth": "OAuth"},
    {"name": "Open Access Button", "description": "Free legal research articles", "category": "Science", "link": "https://openaccessbutton.org/api", "auth": "none"},
    {"name": "SHARE", "description": "Free open dataset of scholarly research", "category": "Science", "link": "http://share-research.readthedocs.io/", "auth": "none"},
    
    # === SCREENSHOTS ===
    {"name": "ApiFlash", "description": "Chrome based screenshot API", "category": "Development", "link": "https://apiflash.com/", "auth": "apiKey"},
    {"name": "SavePage.io", "description": "Screenshot any website with Chrome", "category": "Development", "link": "https://docs.savepage.io", "auth": "apiKey"},
    {"name": "ScreenshotAPI.net", "description": "Generate screenshots of any website", "category": "Development", "link": "https://screenshotapi.net", "auth": "apiKey"},
    
    # === SOCIAL MEDIA ===
    {"name": "Ayrshare", "description": "Social media APIs for scheduling, analytics", "category": "Social Media", "link": "https://docs.ayrshare.com", "auth": "apiKey"},
    {"name": "Daily Motion", "description": "Build applications around DailyMotion", "category": "Video", "link": "https://developer.dailymotion.com/", "auth": "OAuth"},
    {"name": "DeviantArt", "description": "Largest social networking for artists", "category": "Social Media", "link": "https://www.deviantart.com/developers/", "auth": "OAuth"},
    {"name": "EventBrite", "description": "Interact with EventBrite API", "category": "Events", "link": "https://github.com/eventbrite/eventbrite-sdk-python", "auth": "OAuth"},
    {"name": "Facebook", "description": "For ads, games, payments, login, sharing", "category": "Social Media", "link": "https://developers.facebook.com/", "auth": "OAuth"},
    {"name": "Flickr", "description": "Search user content, upload photos", "category": "Photography", "link": "https://www.flickr.com/services/api/", "auth": "apiKey"},
    {"name": "Foursquare", "description": "Access Foursquare database and users", "category": "Social Media", "link": "https://developer.foursquare.com/", "auth": "OAuth"},
    {"name": "GoodReads", "description": "Access to Goodreads data for books", "category": "Content", "link": "https://www.goodreads.com/api", "auth": "apiKey"},
    {"name": "Gravatar", "description": "Create profiles and avatars", "category": "Social Media", "link": "https://en.gravatar.com/site/implement/", "auth": "none"},
    {"name": "Hacker News", "description": "Documentation for Official HN API", "category": "News", "link": "https://github.com/HackerNews/API", "auth": "none"},
    {"name": "Imgur", "description": "Imgur's API for entire functionality", "category": "Photography", "link": "https://api.imgur.com/", "auth": "OAuth"},
    {"name": "Instagram", "description": "Search photos by location, user, tags", "category": "Social Media", "link": "https://www.instagram.com/developer/", "auth": "OAuth"},
    {"name": "LinkedIn", "description": "Access user accounts, data, connections", "category": "Social Media", "link": "https://developer.linkedin.com/", "auth": "OAuth"},
    {"name": "Mastodon", "description": "APIs for open-source Twitter competitor", "category": "Social Media", "link": "https://docs.joinmastodon.org/", "auth": "OAuth"},
    {"name": "Microlink", "description": "Take screenshots, extract colors", "category": "Development", "link": "https://microlink.io", "auth": "apiKey"},
    {"name": "Pinterest", "description": "View repinned Pins, user profiles", "category": "Social Media", "link": "https://www.pinterest.com/login/", "auth": "OAuth"},
    {"name": "Reddit", "description": "Build clients, crawlers, extensions", "category": "Social Media", "link": "https://github.com/reddit/reddit/wiki/API", "auth": "OAuth"},
    {"name": "Telegram", "description": "Build customized Telegram clients", "category": "Communication", "link": "https://core.telegram.org/api", "auth": "apiKey"},
    {"name": "TikTok", "description": "Display TikTok creator's videos and profile", "category": "Social Media", "link": "https://developers.tiktok.com/", "auth": "OAuth"},
    {"name": "Trash Nothing", "description": "Build on freecycling and reuse communities", "category": "Social Media", "link": "https://trashnothing.com/developer", "auth": "OAuth"},
    {"name": "Twitch", "description": "Develop with Twitch's rich feature set", "category": "Video", "link": "https://dev.twitch.tv/docs", "auth": "OAuth"},
    {"name": "Twitter", "description": "Interact with Twitter functions", "category": "Social Media", "link": "https://developer.twitter.com/", "auth": "OAuth"},
    {"name": "Tumblr", "description": "Access content, likes, followers, drafts", "category": "Social Media", "link": "https://www.tumblr.com/docs/en/api/v2", "auth": "OAuth"},
    {"name": "Vimeo", "description": "Access to Vimeo's API", "category": "Video", "link": "https://developer.vimeo.com/", "auth": "OAuth"},
    {"name": "Viber", "description": "Create unique experiences for users", "category": "Communication", "link": "https://developers.viber.com/docs/api/", "auth": "apiKey"},
    {"name": "VK", "description": "Access to VKontakte's API", "category": "Social Media", "link": "https://vk.com/dev", "auth": "OAuth"},
    {"name": "WordPress", "description": "Access to Wordpress APIs", "category": "Content", "link": "https://codex.wordpress.org/WordPress_APIs", "auth": "OAuth"},
    {"name": "Untappd", "description": "Socially share beers you're enjoying", "category": "Social Media", "link": "https://untappd.com/api/docs", "auth": "OAuth"},
    {"name": "YouTube", "description": "Add YouTube functionality to sites", "category": "Video", "link": "https://developers.google.com/youtube/", "auth": "OAuth"},
    {"name": "Zomato", "description": "Restaurant information for 1.5M+ restaurants", "category": "Food", "link": "https://developers.zomato.com/api", "auth": "apiKey"},
    
    # === SOURCE CONTROL ===
    {"name": "Bitbucket", "description": "Access to Bitbucket's API", "category": "Development", "link": "https://developer.atlassian.com/bitbucket/api/2/reference/", "auth": "OAuth"},
    {"name": "GitHub", "description": "Build real-world GitHub applications", "category": "Development", "link": "https://developer.github.com/v3/", "auth": "OAuth"},
    {"name": "GitHub Gists", "description": "Access to GitHub's Gists API", "category": "Development", "link": "https://developer.github.com/v3/gists/", "auth": "OAuth"},
    {"name": "GitLab", "description": "Access to GitLab's API", "category": "Development", "link": "https://docs.gitlab.com/ce/api/README.html", "auth": "OAuth"},
    {"name": "Mercurial", "description": "Access to Mercurial's API", "category": "Development", "link": "https://www.mercurial-scm.org/wiki/MercurialApi", "auth": "none"},
    {"name": "SVN", "description": "Collection of modular C libraries", "category": "Development", "link": "https://subversion.apache.org/docs/api/1.8/", "auth": "none"},
    {"name": "Team Foundation Server", "description": "REST, OAuth, Json and service hooks", "category": "Development", "link": "https://docs.microsoft.com/en-us/azure/devops/integrate/", "auth": "OAuth"},
    
    # === SPORT ===
    {"name": "Ergast Formula 1", "description": "F1 race data from 1950 to today", "category": "Sports", "link": "http://ergast.com/mrd/", "auth": "none"},
    {"name": "FIFA Women's World Cup", "description": "FIFA women's world cup matches and results", "category": "Sports", "link": "https://worldcup.sfg.io/", "auth": "none"},
    {"name": "Football Prediction", "description": "Predictions for upcoming matches, odds", "category": "Sports", "link": "https://boggio-analytics.com/fp-api/", "auth": "apiKey"},
    {"name": "LIVE-SCORE API", "description": "Football API for fixtures, standings", "category": "Sports", "link": "https://live-score-api.com/documentation/reference/", "auth": "apiKey"},
    {"name": "NBA GraphQL", "description": "Current and historical NBA Stats", "category": "Sports", "link": "https://nbaapi.com/graphql/", "auth": "none"},
    {"name": "NBA REST API", "description": "Up-to-date NBA Stats and Shot Chart", "category": "Sports", "link": "http://rest.nbaapi.com/index.html", "auth": "none"},
    {"name": "OpenF1", "description": "Real-time Formula 1 data", "category": "Sports", "link": "https://openf1.org/", "auth": "none"},
    {"name": "OpenLigaDB", "description": "Sports data especially football", "category": "Sports", "link": "https://www.openligadb.de/", "auth": "none"},
    {"name": "Roanuz Cricket API", "description": "Cricket scores and player information", "category": "Sports", "link": "https://www.cricketapi.com/v5/docs/", "auth": "apiKey"},
    {"name": "TheSportsDB", "description": "Sports events, results, players, teams", "category": "Sports", "link": "http://www.thesportsdb.com/", "auth": "apiKey"},
    
    # === TEST DATA ===
    {"name": "Faker API", "description": "Generate fake data for web developers", "category": "Development", "link": "https://fakerapi.it", "auth": "none"},
    
    # === TRANSPORTATION ===
    {"name": "ADS-B Exchange", "description": "Real-time and historical aircraft data", "category": "Transportation", "link": "https://www.adsbexchange.com/data/", "auth": "apiKey"},
    {"name": "AfterShip", "description": "Multi-carrier shipment tracking APIs", "category": "Logistics", "link": "https://www.aftership.com/docs/api/4/overview", "auth": "apiKey"},
    {"name": "CarsXE API", "description": "Vehicle records, specs, market values", "category": "Transportation", "link": "https://api.carsxe.com/", "auth": "apiKey"},
    {"name": "Edmunds", "description": "Dataset containing all car makes", "category": "Transportation", "link": "http://developer.edmunds.com/", "auth": "apiKey"},
    {"name": "HyperTrack", "description": "Build applications that track movement", "category": "Logistics", "link": "https://docs.hypertrack.com", "auth": "apiKey"},
    {"name": "Lyft", "description": "Real-time ETAs, availability, price estimates", "category": "Transportation", "link": "https://www.lyft.com/developers", "auth": "OAuth"},
    {"name": "Postmen", "description": "Shipping capability with 40+ carriers", "category": "Logistics", "link": "https://docs.postmen.com/", "auth": "apiKey"},
    {"name": "Ola", "description": "Find, book and track Ola rides", "category": "Transportation", "link": "https://developers.olacabs.com/", "auth": "apiKey"},
    {"name": "Uber", "description": "Trip experiences, ride requests, logistics", "category": "Transportation", "link": "https://developer.uber.com/", "auth": "OAuth"},
    
    # === URL SHORTENERS ===
    {"name": "Bitly", "description": "Access to Bitly's API", "category": "Utilities", "link": "http://dev.bitly.com/links.html", "auth": "OAuth"},
    {"name": "GoTiny", "description": "Lightweight URL shortener with JavaScript SDK", "category": "Utilities", "link": "https://github.com/robvanbakel/gotiny-api", "auth": "none"},
    {"name": "Is.gd", "description": "Simple URL shortener with custom endings", "category": "Utilities", "link": "https://is.gd/developers.php", "auth": "none"},
    {"name": "ShrtURI", "description": "URL shortening API for short URLs", "category": "Utilities", "link": "https://shrturi.com/docs", "auth": "apiKey"},
    {"name": "Tiny.cc", "description": "Easy URL shortener with custom endings", "category": "Utilities", "link": "https://tiny.cc/api-docs", "auth": "apiKey"},
    {"name": "Tiny.UID", "description": "API for shortening long URLs", "category": "Utilities", "link": "https://tinyuid.com/docs", "auth": "apiKey"},
    {"name": "Yourls", "description": "Generate short URLs with custom keywords", "category": "Utilities", "link": "https://yourls.org/", "auth": "apiKey"},
    
    # === VIDEOGAMES ===
    {"name": "CSGO API", "description": "Counter-Strike: Global Offensive data", "category": "Gaming", "link": "https://bymykel.github.io/CSGO-API/", "auth": "none"},
    {"name": "Clash Of Clans", "description": "Information about players, clans, wars", "category": "Gaming", "link": "https://developer.clashofclans.com/", "auth": "apiKey"},
    {"name": "Clash Royale", "description": "Information about Clash Royale", "category": "Gaming", "link": "https://github.com/martincarrera/clash-royale-api", "auth": "apiKey"},
    {"name": "FreeToGame", "description": "Free-to-play games database API", "category": "Gaming", "link": "https://www.freetogame.com/api-doc", "auth": "none"},
    {"name": "GamerPower", "description": "Best giveaways in gaming", "category": "Gaming", "link": "https://www.gamerpower.com/api-read", "auth": "none"},
    {"name": "GiantBomb", "description": "Query videogames, characters, companies", "category": "Gaming", "link": "http://www.giantbomb.com/api/", "auth": "apiKey"},
    {"name": "Hyrule Compendium", "description": "Interactive items in Breath of the Wild", "category": "Gaming", "link": "http://github.com/gadhagod/Hyrule-Compendium-API", "auth": "none"},
    {"name": "IGDB", "description": "Video games, characters, companies info", "category": "Gaming", "link": "https://www.igdb.com/api", "auth": "apiKey"},
    {"name": "MMO Games", "description": "MMO Games database, news, giveaways", "category": "Gaming", "link": "https://www.mmobomb.com/api", "auth": "none"},
    {"name": "RAWG", "description": "Open video game database", "category": "Gaming", "link": "https://rawg.io/apidocs", "auth": "apiKey"},
    {"name": "Riot Games", "description": "League of Legends developer access", "category": "Gaming", "link": "https://developer.riotgames.com/", "auth": "apiKey"},
    
    # === WEATHER ===
    {"name": "AccuWeather", "description": "Hourly and minute by minute forecasts", "category": "Weather", "link": "https://developer.accuweather.com/", "auth": "apiKey"},
    {"name": "AerisWeather", "description": "Global weather data and imagery APIs", "category": "Weather", "link": "http://www.aerisweather.com/develop/", "auth": "apiKey"},
    {"name": "BlueSky API", "description": "Global weather data with free tier", "category": "Weather", "link": "https://blueskyapi.io/docs/api", "auth": "apiKey"},
    {"name": "Open-Meteo", "description": "Global weather forecast API, no API key", "category": "Weather", "link": "https://open-meteo.com/en/docs", "auth": "none"},
    {"name": "OpenWeatherMap", "description": "Weather data for 200,000+ cities", "category": "Weather", "link": "http://openweathermap.org/api", "auth": "apiKey"},
    {"name": "Storm Glass", "description": "Global marine weather data", "category": "Weather", "link": "https://stormglass.io", "auth": "apiKey"},
    {"name": "Weather-API", "description": "Free RESTful API to check weather", "category": "Weather", "link": "https://github.com/robertoduessmann/weather-api", "auth": "none"},
    {"name": "Weatherbit", "description": "Access forecasts for any point on Earth", "category": "Weather", "link": "https://www.weatherbit.io/api", "auth": "apiKey"},
    {"name": "Weather Source", "description": "Powerful Weather API for heavy load", "category": "Weather", "link": "http://weathersource.com/weather-api", "auth": "apiKey"},
    {"name": "Weatherstack", "description": "Real-Time & Historical World Weather", "category": "Weather", "link": "https://weatherstack.com/documentation", "auth": "apiKey"},
    
    # === ADDITIONAL FROM TONNYEL AWESOME APIS ===
    {"name": "Airtable", "description": "Create, read, update, destroy records", "category": "Business", "link": "https://airtable.com/api", "auth": "apiKey"},
    {"name": "Buffer", "description": "Access pending and sent updates", "category": "Social Media", "link": "https://buffer.com/developers/api", "auth": "OAuth"},
    {"name": "Concur Labs", "description": "Access to Concur's RESTful API", "category": "Business", "link": "https://developer.concur.com/api-reference/", "auth": "OAuth"},
    {"name": "Envoy", "description": "Access to Envoy's APIs", "category": "Business", "link": "https://developers.envoy.com/", "auth": "apiKey"},
    {"name": "JotForm", "description": "Connect to form data without website", "category": "Business", "link": "http://api.jotform.com/docs/", "auth": "apiKey"},
    {"name": "MailChimp", "description": "Access to MailChimp's API", "category": "Email", "link": "https://developer.mailchimp.com/", "auth": "apiKey"},
    {"name": "Quip", "description": "Automate processes and integrate Quip", "category": "Business", "link": "https://quip.com/api/", "auth": "OAuth"},
    {"name": "Salesforce", "description": "Access to Salesforce's API", "category": "Business", "link": "https://developer.salesforce.com/page/Salesforce_APIs", "auth": "OAuth"},
    {"name": "Square", "description": "Easy credit card processing", "category": "Payments", "link": "https://connect.squareup.com/", "auth": "OAuth"},
    {"name": "Wolfram Data Drop", "description": "Access to Wolfram Data Drop's RESTful API", "category": "Utilities", "link": "https://www.wolfram.com/datadrop/quick-reference/web-api/", "auth": "apiKey"},
    
    # === BLOGGING ===
    {"name": "Blogger", "description": "Create, edit, delete blog posts", "category": "Content", "link": "https://developers.google.com/blogger/", "auth": "OAuth"},
    {"name": "Medium", "description": "Access to data of medium.com", "category": "Content", "link": "https://github.com/Medium/medium-api-docs", "auth": "OAuth"},
    {"name": "Weebly", "description": "Best-in-class website builder", "category": "Development", "link": "https://cloud-developer.weebly.com/", "auth": "apiKey"},
    {"name": "Telegraph", "description": "Telegram's publishing service", "category": "Content", "link": "http://telegra.ph/api", "auth": "apiKey"},
    
    # === BOOKS ===
    {"name": "An API Of Ice And Fire", "description": "A Song of Ice and Fire data", "category": "Entertainment", "link": "https://anapioficeandfire.com/", "auth": "none"},
    {"name": "Open Library Books API", "description": "Open editable library catalog", "category": "Content", "link": "https://openlibrary.org/developers/api", "auth": "none"},
    {"name": "NYPL Digital Collections", "description": "Trove of rare and unique material", "category": "Content", "link": "http://api.repo.nypl.org/", "auth": "apiKey"},
    {"name": "Bookshare", "description": "Books for print disabilities", "category": "Content", "link": "http://developer.bookshare.org/", "auth": "apiKey"},
    
    # === MESSAGING ===
    {"name": "Cisco Spark", "description": "Create rooms, invite people, post", "category": "Communication", "link": "https://developer.ciscospark.com/", "auth": "OAuth"},
    {"name": "Fleep", "description": "Messenger for teams and projects", "category": "Communication", "link": "https://fleep.io/fleepapi/", "auth": "apiKey"},
    {"name": "GroupMe", "description": "Build with group messaging abilities", "category": "Communication", "link": "https://dev.groupme.com/docs/v3", "auth": "apiKey"},
    {"name": "LINE", "description": "Freeware app for instant communications", "category": "Communication", "link": "https://developers.line.me/", "auth": "OAuth"},
    {"name": "MessageBird", "description": "Integrate SMS, Chat & Voice", "category": "Communication", "link": "https://developers.messagebird.com/", "auth": "apiKey"},
    {"name": "Slack", "description": "Cloud-based team collaboration tools", "category": "Communication", "link": "https://api.slack.com/", "auth": "OAuth"},
    {"name": "Yo", "description": "Simplest notification platform", "category": "Communication", "link": "http://docs.justyo.co/", "auth": "apiKey"},
    
    # === NOTES ===
    {"name": "Evernote", "description": "API references and guides", "category": "Utilities", "link": "https://dev.evernote.com/doc/", "auth": "OAuth"},
    {"name": "OneNote", "description": "RESTful APIs for OneNote", "category": "Utilities", "link": "https://msdn.microsoft.com/en-us/office/office365/howto/onenote-supported-ops", "auth": "OAuth"},
    
    # === PAYMENT ===
    {"name": "PayPal", "description": "Access to PayPal's REST APIs", "category": "Payments", "link": "https://developer.paypal.com/docs/api/", "auth": "OAuth"},
    {"name": "Paymill", "description": "Full API reference for PAYMILL", "category": "Payments", "link": "https://developers.paymill.com/index", "auth": "apiKey"},
    {"name": "Paytm", "description": "Take payments on app/website", "category": "Payments", "link": "https://paytm.com/business/payments/developers", "auth": "apiKey"},
    {"name": "WePay", "description": "Seamless payment for platforms", "category": "Payments", "link": "https://www.wepay.com/", "auth": "OAuth"},
    {"name": "PhonePe", "description": "Cashless payment experience", "category": "Payments", "link": "https://developer.phonepe.com/docs", "auth": "apiKey"},
    
    # === PHOTOGRAPHY ===
    {"name": "500px", "description": "Programmatic access to 500px content", "category": "Photography", "link": "https://github.com/500px/api-documentation", "auth": "OAuth"},
    {"name": "Unsplash", "description": "Most powerful photo engine in the world", "category": "Photography", "link": "https://unsplash.com/documentation", "auth": "OAuth"},
    
    # === TEAMWORK ===
    {"name": "Asana", "description": "Programmatically update and access data", "category": "Business", "link": "https://asana.com/guide/help/api/api", "auth": "OAuth"},
    {"name": "join.me", "description": "Online meeting tool", "category": "Communication", "link": "https://developer.join.me/", "auth": "OAuth"},
    {"name": "Teambition", "description": "Open Platform for project data", "category": "Business", "link": "https://www.teambition.com/developer/open-platform", "auth": "OAuth"},
    {"name": "TeamSnap", "description": "World's best team management solution", "category": "Business", "link": "http://developer.teamsnap.com/", "auth": "OAuth"},
    {"name": "Trello", "description": "Web-based project management", "category": "Business", "link": "https://developers.trello.com/", "auth": "OAuth"},
    
    # === TEXT ANALYSIS ===
    {"name": "Text Analytics API", "description": "Suite of text analytics web services", "category": "AI/ML", "link": "https://azure.microsoft.com/en-us/services/cognitive-services/text-analytics/", "auth": "apiKey"},
    {"name": "Watson NLU", "description": "Natural language processing to analyze text", "category": "AI/ML", "link": "https://www.ibm.com/watson/developercloud/natural-language-understanding/", "auth": "apiKey"},
    
    # === TODO ===
    {"name": "Beeminder", "description": "Access to Beeminder's APIs", "category": "Utilities", "link": "https://www.beeminder.com/api", "auth": "apiKey"},
    {"name": "FollowUp.cc", "description": "Access to FollowUp.cc's APIs", "category": "Utilities", "link": "http://docs.followup.cc/", "auth": "apiKey"},
    {"name": "Todoist", "description": "Sync API for efficient data sync", "category": "Utilities", "link": "https://developer.todoist.com/", "auth": "OAuth"},
    {"name": "Toodledo", "description": "Access to tasks, notes, outlines, lists", "category": "Utilities", "link": "https://api.toodledo.com/3/", "auth": "apiKey"},
    
    # === TRANSLATION ===
    {"name": "Google Translate", "description": "Dynamically translate between languages", "category": "Language", "link": "https://cloud.google.com/translate/docs/", "auth": "apiKey"},
    {"name": "Microsoft Translator", "description": "Machine translation in multiple languages", "category": "Language", "link": "https://www.microsoft.com/en-us/translator/translatorapi.aspx", "auth": "apiKey"},
    {"name": "Yandex Translate", "description": "Supports 70+ languages", "category": "Language", "link": "https://tech.yandex.com/translate/", "auth": "apiKey"},
    
    # === VIDEO ===
    {"name": "Dailymotion", "description": "Second largest video hosting platform", "category": "Video", "link": "https://developer.dailymotion.com/api", "auth": "OAuth"},
    {"name": "Narrative", "description": "Customize your clip, get players", "category": "Video", "link": "http://open.getnarrative.com/", "auth": "OAuth"},
    {"name": "Rotten Tomatoes", "description": "Ratings and reviews from Rotten Tomatoes", "category": "Entertainment", "link": "https://developer.fandango.com/Rotten_Tomatoes", "auth": "apiKey"},
    {"name": "The Movie Database", "description": "Access Top rated, Upcoming, Popular movies", "category": "Entertainment", "link": "https://developers.themoviedb.org", "auth": "apiKey"},
    
    # === VOICE ANALYSIS ===
    {"name": "Cloud Speech API", "description": "Convert audio to text using ML", "category": "AI/ML", "link": "https://cloud.google.com/speech/", "auth": "apiKey"},
    
    # === VISION ANALYSIS ===
    {"name": "CamScanner", "description": "Digitalize paper documents", "category": "AI/ML", "link": "https://dev.camscanner.com/", "auth": "apiKey"},
    {"name": "Clarifai", "description": "Image and video recognition as a service", "category": "AI/ML", "link": "https://clarifai.com/developer/guide/", "auth": "apiKey"},
    {"name": "Google Cloud Vision", "description": "Understand image content with ML", "category": "AI/ML", "link": "https://cloud.google.com/vision/", "auth": "apiKey"},
    {"name": "Microsoft Computer Vision", "description": "State-of-the-art image algorithms", "category": "AI/ML", "link": "https://azure.microsoft.com/en-us/services/cognitive-services/computer-vision/", "auth": "apiKey"},
    {"name": "Face++", "description": "Computer vision for understanding world", "category": "AI/ML", "link": "https://console.faceplusplus.com/documents/5678948", "auth": "apiKey"},
    {"name": "Watson Visual Recognition", "description": "Identifies scenes, objects, celebrity faces", "category": "AI/ML", "link": "https://www.ibm.com/watson/developercloud/visual-recognition/", "auth": "apiKey"},
]

def main():
    print("🦞 APIClaw Public APIs Mass Import")
    print("=" * 50)
    
    registry = load_registry()
    existing_ids = get_existing_ids(registry)
    
    added = 0
    skipped = 0
    
    for api in PUBLIC_APIS:
        api_id = generate_id(api['name'])
        
        if api_id in existing_ids:
            skipped += 1
            continue
        
        registry['apis'].append({
            "id": api_id,
            "name": api['name'],
            "description": api['description'],
            "category": api['category'],
            "auth": api.get('auth', 'apiKey'),
            "https": True,
            "cors": "unknown",
            "link": api['link'],
            "pricing": "unknown",
            "keywords": [],
            "source": "public-apis"
        })
        existing_ids.add(api_id)
        added += 1
    
    save_registry(registry)
    
    print(f"✅ Added: {added} APIs")
    print(f"⏭️  Skipped (duplicates): {skipped}")
    print(f"📊 Total APIs in registry: {len(registry['apis'])}")

if __name__ == "__main__":
    main()
