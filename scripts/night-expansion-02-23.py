#!/usr/bin/env python3
"""
APIClaw Night Expansion - 2026-02-23 02:00
Goal: Add 1000+ APIs from curated lists
"""

import json
import re
from pathlib import Path
from datetime import datetime

REGISTRY_PATH = Path(__file__).parent.parent / "src" / "registry" / "apis.json"

# New APIs to add - curated from awesome-apis lists
NEW_APIS = [
    # From n0shake/Public-APIs - Advertising
    {"id": "amazon-mobile-ads", "name": "Amazon Mobile Ads", "description": "Monetize across platforms with multiple ad formats", "category": "Advertising", "auth": "apiKey", "https": True, "link": "https://developer.amazon.com/mobile-ads", "pricing": "freemium", "keywords": ["advertising", "mobile", "amazon"]},
    {"id": "facebook-marketing-api", "name": "Facebook Marketing API", "description": "Manage ads and campaigns using the Facebook API", "category": "Advertising", "auth": "OAuth", "https": True, "link": "https://developers.facebook.com/docs/marketing-apis", "pricing": "freemium", "keywords": ["advertising", "facebook", "social"]},
    {"id": "google-adsense", "name": "Google AdSense", "description": "Earn money from websites, mobile sites, and search results", "category": "Advertising", "auth": "OAuth", "https": True, "link": "https://developers.google.com/adsense/", "pricing": "freemium", "keywords": ["advertising", "google", "monetization"]},
    {"id": "google-adwords", "name": "Google AdWords API", "description": "Manage Google AdWords campaigns programmatically", "category": "Advertising", "auth": "OAuth", "https": True, "link": "https://developers.google.com/adwords/api/", "pricing": "paid", "keywords": ["advertising", "google", "ppc"]},
    {"id": "kevel-ad", "name": "Kevel Ad APIs", "description": "Build your own ad server with Kevel's ad APIs", "category": "Advertising", "auth": "apiKey", "https": True, "link": "https://dev.kevel.co", "pricing": "paid", "keywords": ["advertising", "adtech"]},
    {"id": "bing-ads", "name": "Microsoft Bing Ads API", "description": "Programmatic access to advertising technologies", "category": "Advertising", "auth": "apiKey", "https": True, "link": "https://msdn.microsoft.com/en-us/library/bing-ads-api.aspx", "pricing": "freemium", "keywords": ["advertising", "microsoft", "bing"]},

    # Analytics
    {"id": "clicky-analytics", "name": "Clicky Analytics", "description": "Extract website traffic data into multiple formats", "category": "Analytics", "auth": "apiKey", "https": True, "link": "https://clicky.com/help/api", "pricing": "freemium", "keywords": ["analytics", "traffic"]},
    {"id": "ditchcarbon", "name": "DitchCarbon API", "description": "Company and product carbon emissions data", "category": "Analytics", "auth": "apiKey", "https": True, "link": "https://docs.ditchcarbon.com/", "pricing": "paid", "keywords": ["analytics", "carbon", "sustainability"]},
    {"id": "localytics", "name": "Localytics", "description": "Interface to Localytics analytics platform", "category": "Analytics", "auth": "apiKey", "https": True, "link": "http://docs.localytics.com/dev/query-api.html", "pricing": "paid", "keywords": ["analytics", "mobile"]},
    {"id": "matomo-analytics", "name": "Matomo Analytics", "description": "All-in-one premium web analytics platform", "category": "Analytics", "auth": "apiKey", "https": True, "link": "https://matomo.org/docs/analytics-api/", "pricing": "freemium", "keywords": ["analytics", "privacy", "open-source"]},
    {"id": "open-web-analytics", "name": "Open Web Analytics", "description": "Request and work with data outside OWA interface", "category": "Analytics", "auth": "None", "https": True, "link": "https://github.com/padams/Open-Web-Analytics/wiki/Data-Access-API", "pricing": "free", "keywords": ["analytics", "open-source"]},
    {"id": "ticksel", "name": "Ticksel Analytics", "description": "Friendly website analytics made for humans", "category": "Analytics", "auth": "apiKey", "https": True, "link": "https://ticksel.com", "pricing": "freemium", "keywords": ["analytics", "simple"]},
    {"id": "woopra", "name": "Woopra", "description": "Real-time website analysis for customer engagement", "category": "Analytics", "auth": "apiKey", "https": True, "link": "https://www.woopra.com/docs/developer/analytics-api/", "pricing": "freemium", "keywords": ["analytics", "realtime", "engagement"]},

    # AR/VR
    {"id": "vuforia", "name": "Vuforia AR SDK", "description": "Solid SDK with robust AR development options", "category": "AR/VR", "auth": "apiKey", "https": True, "link": "https://library.vuforia.com/", "pricing": "paid", "keywords": ["ar", "augmented-reality", "sdk"]},
    {"id": "wikitude", "name": "Wikitude AR", "description": "All-in-one AR solution with image recognition and tracking", "category": "AR/VR", "auth": "apiKey", "https": True, "link": "http://www.wikitude.com/download/", "pricing": "paid", "keywords": ["ar", "augmented-reality", "3d"]},

    # Barcode
    {"id": "google-barcode", "name": "Google Barcode API", "description": "Detects barcodes in real-time on device", "category": "Utilities", "auth": "apiKey", "https": True, "link": "https://developers.google.com/vision/barcodes-overview", "pricing": "free", "keywords": ["barcode", "qr", "scanner"]},
    {"id": "ean-search", "name": "EAN-Search", "description": "Lookup products by EAN, UPC or GTIN barcode", "category": "Utilities", "auth": "apiKey", "https": True, "link": "https://www.ean-search.org/ean-database-api.html", "pricing": "paid", "keywords": ["barcode", "ean", "product"]},
    {"id": "qr-code-api", "name": "QR Code API", "description": "Create and read QR code images", "category": "Utilities", "auth": "apiKey", "https": True, "link": "https://fungenerators.com/api/qrcode/", "pricing": "freemium", "keywords": ["qr", "barcode", "generator"]},
    {"id": "openqr", "name": "OpenQR API", "description": "Static and Dynamic QR code generator API", "category": "Utilities", "auth": "apiKey", "https": True, "link": "https://docs.openqr.io/", "pricing": "freemium", "keywords": ["qr", "dynamic", "generator"]},

    # Big Data
    {"id": "google-charts", "name": "Google Charts", "description": "Wide range of data visualization capabilities", "category": "Data Visualization", "auth": "None", "https": True, "link": "https://developers.google.com/chart/interactive/docs/", "pricing": "free", "keywords": ["charts", "visualization", "google"]},
    {"id": "keen-io", "name": "Keen IO", "description": "Big Data easy-to-implement analytics solution", "category": "Analytics", "auth": "apiKey", "https": True, "link": "https://keen.io/docs/api/", "pricing": "freemium", "keywords": ["analytics", "big-data", "events"]},
    {"id": "linkeddata-center", "name": "LinkedData.Center", "description": "RDF graph database with SPARQL APIs", "category": "Database", "auth": "apiKey", "https": True, "link": "http://linkeddata.center/home/gdaas", "pricing": "paid", "keywords": ["rdf", "sparql", "linked-data"]},

    # Cryptocurrency - additional
    {"id": "blockchain-info", "name": "Blockchain.info API", "description": "Bitcoin blockchain data and wallet services", "category": "Crypto", "auth": "apiKey", "https": True, "link": "https://www.blockchain.com/api", "pricing": "freemium", "keywords": ["bitcoin", "blockchain", "wallet"]},
    {"id": "blockcypher", "name": "BlockCypher", "description": "Infrastructure fabric for blockchain applications", "category": "Crypto", "auth": "apiKey", "https": True, "link": "https://www.blockcypher.com/", "pricing": "freemium", "keywords": ["blockchain", "bitcoin", "ethereum"]},
    {"id": "blockfacts", "name": "BlockFacts.io", "description": "Compliance-first digital asset data with REST and WebSocket", "category": "Crypto", "auth": "apiKey", "https": True, "link": "https://blockfacts.io/", "pricing": "freemium", "keywords": ["crypto", "compliance", "market-data"]},
    {"id": "coinpaprika", "name": "Coinpaprika", "description": "Cryptocurrency prices, market cap, volume and more", "category": "Crypto", "auth": "None", "https": True, "link": "https://api.coinpaprika.com", "pricing": "free", "keywords": ["crypto", "prices", "market"]},
    {"id": "cryptocompare", "name": "CryptoCompare", "description": "Cryptocurrencies comparison and data", "category": "Crypto", "auth": "apiKey", "https": True, "link": "https://www.cryptocompare.com/api", "pricing": "freemium", "keywords": ["crypto", "comparison", "data"]},
    {"id": "coinigy", "name": "Coinigy", "description": "Interact with exchange accounts directly", "category": "Crypto", "auth": "apiKey", "https": True, "link": "https://coinigy.docs.apiary.io", "pricing": "paid", "keywords": ["crypto", "trading", "exchange"]},
    {"id": "pendax-sdk", "name": "PENDAX SDK", "description": "Trading, Data, and Websockets for FTX, OKX, Bybit and more", "category": "Crypto", "auth": "apiKey", "https": True, "link": "https://github.com/CompendiumFi/PENDAX-SDK", "pricing": "free", "keywords": ["crypto", "trading", "sdk"]},
    {"id": "technical-analysis-api", "name": "Technical Analysis API", "description": "Cryptocurrency prices, technical analysis and sentiment", "category": "Crypto", "auth": "apiKey", "https": True, "link": "https://technical-analysis-api.com", "pricing": "freemium", "keywords": ["crypto", "technical-analysis", "sentiment"]},

    # Calendar
    {"id": "calendarindex", "name": "CalendarIndex", "description": "Worldwide Holidays and Working Days API", "category": "Calendar", "auth": "apiKey", "https": True, "link": "https://www.calendarindex.com", "pricing": "freemium", "keywords": ["calendar", "holidays", "working-days"]},
    {"id": "digidates", "name": "DigiDates API", "description": "Date and time calculations REST API", "category": "Calendar", "auth": "None", "https": True, "link": "https://digidates.de/en/", "pricing": "free", "keywords": ["calendar", "date", "calculations"]},
    {"id": "holiday-api", "name": "Holiday API", "description": "Public holiday API for supported countries", "category": "Calendar", "auth": "apiKey", "https": True, "link": "https://holidayapi.pl/", "pricing": "freemium", "keywords": ["calendar", "holidays", "public"]},
    {"id": "openholidays", "name": "OpenHolidays API", "description": "Public and school holidays for European countries", "category": "Calendar", "auth": "None", "https": True, "link": "https://www.openholidaysapi.org/", "pricing": "free", "keywords": ["calendar", "holidays", "europe"]},

    # Captcha
    {"id": "anti-captcha", "name": "Anti-Captcha", "description": "Captcha solving service API", "category": "Security", "auth": "apiKey", "https": True, "link": "https://anti-captcha.com/apidoc", "pricing": "paid", "keywords": ["captcha", "solving", "automation"]},
    {"id": "proxycrawl", "name": "ProxyCrawl", "description": "Crawl and scrape without proxies or captcha issues", "category": "Scraping", "auth": "apiKey", "https": True, "link": "https://proxycrawl.com", "pricing": "paid", "keywords": ["scraping", "proxy", "captcha"]},
    {"id": "google-recaptcha", "name": "Google reCAPTCHA", "description": "Embed CAPTCHA to protect against spam and abuse", "category": "Security", "auth": "apiKey", "https": True, "link": "https://developers.google.com/recaptcha/", "pricing": "free", "keywords": ["captcha", "security", "google"]},

    # Check-In
    {"id": "facebook-checkin", "name": "Facebook Check-In", "description": "Check-in to location-based Pages", "category": "Social", "auth": "OAuth", "https": True, "link": "https://developers.facebook.com/docs/graph-api/reference/checkin", "pricing": "free", "keywords": ["facebook", "checkin", "location"]},
    {"id": "foursquare-checkin", "name": "Foursquare Check-In", "description": "Check in to places via Foursquare", "category": "Places", "auth": "OAuth", "https": True, "link": "https://developer.foursquare.com/reference/v2-checkins-add", "pricing": "freemium", "keywords": ["foursquare", "checkin", "places"]},

    # Commerce
    {"id": "commerce-layer", "name": "Commerce Layer", "description": "Headless commerce platform for any website or app", "category": "E-commerce", "auth": "apiKey", "https": True, "link": "https://docs.commercelayer.io/api/", "pricing": "freemium", "keywords": ["ecommerce", "headless", "api-first"]},
    {"id": "envoice", "name": "Envoice", "description": "Invoicing for online businesses", "category": "Finance", "auth": "apiKey", "https": True, "link": "https://www.envoice.in/reference/api/docs", "pricing": "paid", "keywords": ["invoicing", "payments", "business"]},
    {"id": "koomalooma", "name": "koomalooma", "description": "Loyalty BPaaS for mobile and web companies", "category": "Business", "auth": "apiKey", "https": True, "link": "http://business.koomalooma.com", "pricing": "paid", "keywords": ["loyalty", "rewards", "points"]},
    {"id": "moltin", "name": "Moltin", "description": "Unified APIs for inventory, carts, checkout and payments", "category": "E-commerce", "auth": "apiKey", "https": True, "link": "https://www.moltin.com/developers", "pricing": "freemium", "keywords": ["ecommerce", "api", "commerce"]},
    {"id": "repetiti", "name": "Repetiti", "description": "3D Printer Management Service API", "category": "IoT", "auth": "apiKey", "https": True, "link": "https://developers.repetiti.com", "pricing": "free", "keywords": ["3d-printing", "iot", "management"]},
    {"id": "yellow-pages-api", "name": "Yellow Pages API", "description": "Business data for all categories in US cities", "category": "Business", "auth": "None", "https": True, "link": "https://github.com/Hrushi11/Yellow-Pages-End-API", "pricing": "free", "keywords": ["business", "directory", "yellow-pages"]},

    # Communication
    {"id": "africas-talking", "name": "Africa's Talking", "description": "Access African telco services through HTTP API", "category": "Communication", "auth": "apiKey", "https": True, "link": "https://africastalking.com/", "pricing": "paid", "keywords": ["sms", "voice", "africa"]},
    {"id": "ip1sms", "name": "iP1sms", "description": "Send and receive SMS worldwide", "category": "Communication", "auth": "apiKey", "https": True, "link": "https://www.ip1sms.com/en/developer/", "pricing": "paid", "keywords": ["sms", "global", "messaging"]},
    {"id": "eqivo", "name": "Eqivo", "description": "Telephony/Programmable-Voice API platform", "category": "Communication", "auth": "apiKey", "https": True, "link": "https://eqivo.org", "pricing": "free", "keywords": ["voice", "telephony", "open-source"]},
    {"id": "sakari", "name": "Sakari", "description": "Send and Receive SMS to 200+ countries", "category": "Communication", "auth": "apiKey", "https": True, "link": "https://developer.sakari.io", "pricing": "paid", "keywords": ["sms", "global", "bulk"]},
    {"id": "telnyx", "name": "Telnyx", "description": "Voice, SMS, Fax, Networking and Cellular IoT APIs", "category": "Communication", "auth": "apiKey", "https": True, "link": "https://developers.telnyx.com/", "pricing": "paid", "keywords": ["voice", "sms", "iot"]},
    {"id": "the-sms-works", "name": "The SMS Works", "description": "Low-cost reliable SMS API for developers", "category": "Communication", "auth": "apiKey", "https": True, "link": "https://thesmsworks.co.uk/sms-api", "pricing": "paid", "keywords": ["sms", "uk", "reliable"]},

    # Content
    {"id": "bible-api", "name": "Bible API", "description": "Support for 200+ translations of the Bible", "category": "Content", "auth": "None", "https": True, "link": "https://github.com/wldeh/bible-api", "pricing": "free", "keywords": ["bible", "religion", "text"]},
    {"id": "fruits-api", "name": "Fruits API", "description": "GraphQL API with fruit tree information", "category": "Content", "auth": "None", "https": True, "link": "https://github.com/Franqsanz/fruits-api", "pricing": "free", "keywords": ["fruits", "graphql", "food"]},
    {"id": "jokes-api", "name": "Jokes API", "description": "Full featured Jokes API", "category": "Content", "auth": "apiKey", "https": True, "link": "https://jokes.one/api/joke/", "pricing": "freemium", "keywords": ["jokes", "humor", "entertainment"]},
    {"id": "perfect-tense", "name": "Perfect Tense API", "description": "AI-powered spelling and grammar checking", "category": "Content", "auth": "apiKey", "https": True, "link": "https://www.perfecttense.com/developers", "pricing": "paid", "keywords": ["grammar", "spelling", "ai"]},
    {"id": "random-data-generator", "name": "Randommer API", "description": "Generate telephones, text, numbers, passwords, names", "category": "Utilities", "auth": "apiKey", "https": True, "link": "https://randommer.io/randommer-api", "pricing": "freemium", "keywords": ["random", "generator", "data"]},
    {"id": "random-facts", "name": "Random Facts API", "description": "Generate random facts", "category": "Content", "auth": "apiKey", "https": True, "link": "https://fungenerators.com/api/facts/", "pricing": "freemium", "keywords": ["facts", "random", "trivia"]},
    {"id": "today-in-history", "name": "Today in History", "description": "Daily historical events, births and deaths", "category": "Content", "auth": "None", "https": True, "link": "https://history.muffinlabs.com/", "pricing": "free", "keywords": ["history", "events", "daily"]},

    # Currency
    {"id": "1forge", "name": "1Forge", "description": "Real-time forex and crypto quotes via JSON and WebSocket", "category": "Finance", "auth": "apiKey", "https": True, "link": "https://1forge.com/", "pricing": "freemium", "keywords": ["forex", "crypto", "realtime"]},
    {"id": "currency-api", "name": "Currency-api", "description": "Free Currency Exchange Rates with 150+ currencies", "category": "Finance", "auth": "None", "https": True, "link": "https://github.com/fawazahmed0/currency-api", "pricing": "free", "keywords": ["currency", "exchange", "free"]},
    {"id": "currencylayer", "name": "CurrencyLayer", "description": "Exchange rates and currency conversion API", "category": "Finance", "auth": "apiKey", "https": True, "link": "https://currencylayer.com/documentation", "pricing": "freemium", "keywords": ["currency", "exchange", "conversion"]},
    {"id": "currencyscoop", "name": "CurrencyScoop", "description": "Real-time and historical currency rates", "category": "Finance", "auth": "apiKey", "https": True, "link": "https://currencyscoop.com/", "pricing": "freemium", "keywords": ["currency", "rates", "historical"]},
    {"id": "ecb-rates", "name": "ECB Exchange Rates", "description": "Free currency rates from European Central Bank", "category": "Finance", "auth": "None", "https": True, "link": "https://www.ecb.europa.eu/stats/eurofxref/", "pricing": "free", "keywords": ["currency", "ecb", "europe"]},
    {"id": "exchangerate-api", "name": "ExchangeRate-API", "description": "Currency conversion API", "category": "Finance", "auth": "apiKey", "https": True, "link": "https://www.exchangerate-api.com/docs/overview", "pricing": "freemium", "keywords": ["currency", "exchange", "api"]},
    {"id": "frankfurter", "name": "Frankfurter", "description": "Exchange rates and currency data API", "category": "Finance", "auth": "None", "https": True, "link": "https://www.frankfurter.app/docs/", "pricing": "free", "keywords": ["currency", "exchange", "open-source"]},
    {"id": "openrates", "name": "OpenRates", "description": "Live exchange rates and currency conversion", "category": "Finance", "auth": "None", "https": True, "link": "http://www.openrates.io/", "pricing": "free", "keywords": ["currency", "rates", "live"]},

    # Design
    {"id": "icon-horse", "name": "Icon Horse", "description": "Get favicon logo for any web address", "category": "Design", "auth": "None", "https": True, "link": "https://icon.horse/usage", "pricing": "free", "keywords": ["favicon", "icons", "logo"]},
    {"id": "pexels", "name": "Pexels", "description": "High quality free stock photos (CC0)", "category": "Design", "auth": "apiKey", "https": True, "link": "https://www.pexels.com/api/", "pricing": "free", "keywords": ["photos", "stock", "free"]},
    {"id": "php-noise", "name": "PHP-Noise", "description": "Noise background image generator", "category": "Design", "auth": "None", "https": True, "link": "https://php-noise.com/", "pricing": "free", "keywords": ["background", "noise", "generator"]},

    # Dictionary
    {"id": "agarathi", "name": "Agarathi", "description": "Tamil language Dictionary API", "category": "Content", "auth": "apiKey", "https": True, "link": "https://agarathi.com/api/dictionary", "pricing": "paid", "keywords": ["dictionary", "tamil", "language"]},
    {"id": "datamuse", "name": "Datamuse API", "description": "Word-finding query engine", "category": "Content", "auth": "None", "https": True, "link": "https://www.datamuse.com/api/", "pricing": "free", "keywords": ["words", "dictionary", "rhymes"]},
    {"id": "free-dictionary", "name": "Free Dictionary API", "description": "Get word definitions for free", "category": "Content", "auth": "None", "https": True, "link": "https://dictionaryapi.dev/", "pricing": "free", "keywords": ["dictionary", "definitions", "free"]},
    {"id": "lingua-robot", "name": "Lingua Robot API", "description": "Definitions, pronunciations, synonyms and antonyms", "category": "Content", "auth": "apiKey", "https": True, "link": "https://www.linguarobot.io/", "pricing": "freemium", "keywords": ["dictionary", "nlp", "morphology"]},
    {"id": "merriam-webster", "name": "Merriam-Webster API", "description": "Dictionary and thesaurus content", "category": "Content", "auth": "apiKey", "https": True, "link": "http://www.dictionaryapi.com/", "pricing": "freemium", "keywords": ["dictionary", "thesaurus", "english"]},
    {"id": "oxford-dictionary", "name": "Oxford Dictionary API", "description": "Access to Oxford Dictionary services", "category": "Content", "auth": "apiKey", "https": True, "link": "https://developer.oxforddictionaries.com/", "pricing": "paid", "keywords": ["dictionary", "oxford", "premium"]},
    {"id": "wordnik", "name": "Wordnik", "description": "Dictionary functions for words", "category": "Content", "auth": "apiKey", "https": True, "link": "http://developer.wordnik.com/docs.html", "pricing": "freemium", "keywords": ["dictionary", "words", "definitions"]},
    {"id": "words-api", "name": "Words API", "description": "Definitions for 150,000+ words", "category": "Content", "auth": "apiKey", "https": True, "link": "https://www.wordsapi.com/", "pricing": "freemium", "keywords": ["words", "dictionary", "definitions"]},
    {"id": "wiktionary", "name": "Wiktionary API", "description": "Free multilingual dictionary", "category": "Content", "auth": "None", "https": True, "link": "https://en.wiktionary.org/w/api.php", "pricing": "free", "keywords": ["dictionary", "multilingual", "wiki"]},

    # Entertainment
    {"id": "anilist", "name": "AniList", "description": "Anime and manga GraphQL API", "category": "Entertainment", "auth": "None", "https": True, "link": "https://anilist.gitbook.io/anilist-apiv2-docs/", "pricing": "free", "keywords": ["anime", "manga", "graphql"]},
    {"id": "bobs-burgers", "name": "Bob's Burgers API", "description": "Characters, episodes, running gags from the show", "category": "Entertainment", "auth": "None", "https": True, "link": "https://www.bobsburgersapi.com/documentation", "pricing": "free", "keywords": ["tv", "animation", "comedy"]},
    {"id": "breaking-bad", "name": "Breaking Bad API", "description": "Characters, episodes, quotes and deaths data", "category": "Entertainment", "auth": "None", "https": True, "link": "https://breakingbadapi.com/documentation", "pricing": "free", "keywords": ["tv", "drama", "data"]},
    {"id": "cataas", "name": "Cat as a Service", "description": "REST API for cat images", "category": "Entertainment", "auth": "None", "https": True, "link": "https://cataas.com/", "pricing": "free", "keywords": ["cats", "images", "fun"]},
    {"id": "comic-vine", "name": "Comic Vine", "description": "Mature comic information database", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "http://comicvine.gamespot.com/api/", "pricing": "free", "keywords": ["comics", "database", "information"]},
    {"id": "comichron", "name": "Comichron Data", "description": "API for comic sales data", "category": "Entertainment", "auth": "None", "https": True, "link": "https://github.com/comichron-data/api", "pricing": "free", "keywords": ["comics", "sales", "data"]},
    {"id": "danbooru", "name": "Danbooru", "description": "Images categorized by tags", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "https://danbooru.donmai.us/posts", "pricing": "freemium", "keywords": ["images", "tags", "anime"]},
    {"id": "dune-api", "name": "Dune API", "description": "Book, character, movie and quotes JSON data", "category": "Entertainment", "auth": "None", "https": True, "link": "https://github.com/ywalia01/dune-api", "pricing": "free", "keywords": ["dune", "scifi", "movies"]},
    {"id": "final-space", "name": "Final Space API", "description": "Information and images about Final Space show", "category": "Entertainment", "auth": "None", "https": True, "link": "https://finalspaceapi.com/docs/", "pricing": "free", "keywords": ["tv", "animation", "scifi"]},
    {"id": "fun-translations", "name": "Fun Translations API", "description": "Translate to 50+ languages from TV and movies", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "https://funtranslations.com/api/", "pricing": "freemium", "keywords": ["translation", "fun", "languages"]},
    {"id": "lord-of-rings", "name": "Lord of the Rings API", "description": "Data about books, movies, characters and quotes", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "https://the-one-api.dev/documentation", "pricing": "freemium", "keywords": ["lotr", "movies", "books"]},
    {"id": "marvel-api", "name": "Marvel API", "description": "Access 70+ years of comic data", "category": "Entertainment", "auth": "apiKey", "https": True, "link": "https://developer.marvel.com/", "pricing": "free", "keywords": ["marvel", "comics", "superheroes"]},
    {"id": "jikan", "name": "Jikan (MyAnimeList)", "description": "Anime and manga data from MyAnimeList", "category": "Entertainment", "auth": "None", "https": True, "link": "https://jikan.moe/", "pricing": "free", "keywords": ["anime", "manga", "myanimelist"]},
    {"id": "nick-cannon-baby", "name": "Nick Cannon Baby API", "description": "Nick Cannon's children and baby mamas", "category": "Entertainment", "auth": "None", "https": True, "link": "https://nick-cannon-baby-api.onrender.com/", "pricing": "free", "keywords": ["celebrity", "humor", "api"]},
    {"id": "owen-wilson-wow", "name": "Owen Wilson Wow API", "description": "Owen Wilson's wow exclamations in movies", "category": "Entertainment", "auth": "None", "https": True, "link": "https://owen-wilson-wow-api.onrender.com/", "pricing": "free", "keywords": ["movies", "humor", "celebrity"]},
    {"id": "pokeapi", "name": "PokéAPI", "description": "All Pokémon data you'll ever need", "category": "Entertainment", "auth": "None", "https": True, "link": "https://pokeapi.co/", "pricing": "free", "keywords": ["pokemon", "games", "data"]},
    {"id": "rick-and-morty", "name": "Rick and Morty API", "description": "Rick and Morty information and images", "category": "Entertainment", "auth": "None", "https": True, "link": "https://rickandmortyapi.com/", "pricing": "free", "keywords": ["tv", "animation", "comedy"]},
    {"id": "riddles-api", "name": "Riddles API", "description": "Get random riddles", "category": "Entertainment", "auth": "None", "https": True, "link": "https://riddles-api.vercel.app/", "pricing": "free", "keywords": ["riddles", "puzzles", "fun"]},
    {"id": "stapi", "name": "STAPI (Star Trek)", "description": "Star Trek API", "category": "Entertainment", "auth": "None", "https": True, "link": "https://stapi.co/api-documentation", "pricing": "free", "keywords": ["startrek", "scifi", "tv"]},
    {"id": "swapi", "name": "SWAPI (Star Wars)", "description": "All things Star Wars", "category": "Entertainment", "auth": "None", "https": True, "link": "https://www.swapi.tech/", "pricing": "free", "keywords": ["starwars", "movies", "scifi"]},
    {"id": "studio-ghibli", "name": "Studio Ghibli API", "description": "Resources from Studio Ghibli films", "category": "Entertainment", "auth": "None", "https": True, "link": "https://ghibliapi.vercel.app/", "pricing": "free", "keywords": ["ghibli", "anime", "movies"]},
    {"id": "stockx-api", "name": "StockX API", "description": "150k+ sneakers and fashion products with prices", "category": "E-commerce", "auth": "apiKey", "https": True, "link": "https://stockx.vlour.me/", "pricing": "freemium", "keywords": ["sneakers", "fashion", "prices"]},
    {"id": "tcgdex", "name": "TCGdex", "description": "Multilanguage Pokémon TCG Database", "category": "Entertainment", "auth": "None", "https": True, "link": "https://www.tcgdex.dev/", "pricing": "free", "keywords": ["pokemon", "tcg", "cards"]},

    # Events
    {"id": "picatic", "name": "Picatic", "description": "Sell tickets from your app or website", "category": "Events", "auth": "apiKey", "https": True, "link": "http://developer.picatic.com/", "pricing": "paid", "keywords": ["events", "tickets", "sales"]},

    # Face Recognition
    {"id": "kairos", "name": "Kairos", "description": "Face recognition and emotion analysis", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://www.kairos.com/", "pricing": "paid", "keywords": ["face", "recognition", "emotion"]},
    {"id": "skybiometry", "name": "SkyBiometry", "description": "Face detection, emotion analysis, recognition", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://www.skybiometry.com", "pricing": "freemium", "keywords": ["face", "detection", "biometry"]},

    # File Storage
    {"id": "cloudinary", "name": "Cloudinary", "description": "Image and video storage and manipulation", "category": "Cloud", "auth": "apiKey", "https": True, "link": "http://cloudinary.com/documentation", "pricing": "freemium", "keywords": ["images", "video", "cdn"]},
    {"id": "digitalocean-spaces", "name": "DigitalOcean Spaces", "description": "Simple object storage with easy pricing", "category": "Cloud", "auth": "apiKey", "https": True, "link": "https://www.digitalocean.com/products/spaces", "pricing": "paid", "keywords": ["storage", "s3", "cloud"]},
    {"id": "filestack", "name": "Filestack", "description": "Image and file manipulation with CDN", "category": "Cloud", "auth": "apiKey", "https": True, "link": "https://filestack.com/docs/", "pricing": "freemium", "keywords": ["files", "upload", "cdn"]},
    {"id": "pdf-blocks", "name": "PDF Blocks", "description": "Work with PDF documents (merge, watermark, etc)", "category": "Utilities", "auth": "apiKey", "https": True, "link": "https://www.pdfblocks.com/docs/api/getting-started", "pricing": "paid", "keywords": ["pdf", "documents", "manipulation"]},
    {"id": "signnow", "name": "SignNow API", "description": "Embed branded eSignature workflows", "category": "Business", "auth": "apiKey", "https": True, "link": "https://docs.signnow.com/docs/signnow/welcome", "pricing": "paid", "keywords": ["esignature", "documents", "workflow"]},
    {"id": "smash", "name": "Smash API", "description": "Upload large files on websites and apps", "category": "Cloud", "auth": "apiKey", "https": True, "link": "https://api.fromsmash.com/", "pricing": "freemium", "keywords": ["files", "upload", "large"]},
    {"id": "vector-express", "name": "Vector Express", "description": "Convert, process and analyze vector files", "category": "Utilities", "auth": "apiKey", "https": True, "link": "https://github.com/smidyo/vectorexpress-api", "pricing": "freemium", "keywords": ["vector", "svg", "conversion"]},
    {"id": "vertopal", "name": "Vertopal", "description": "Convert files to various formats", "category": "Utilities", "auth": "apiKey", "https": True, "link": "https://www.vertopal.com/en/developer/api/introduction", "pricing": "paid", "keywords": ["files", "conversion", "formats"]},

    # Finance
    {"id": "alpha-vantage", "name": "Alpha Vantage", "description": "Stock, ETF, mutual fund, forex, and crypto data", "category": "Finance", "auth": "apiKey", "https": True, "link": "https://www.alphavantage.co/", "pricing": "freemium", "keywords": ["stocks", "forex", "crypto"]},
    {"id": "atom-finance", "name": "Atom Finance", "description": "Market, earnings and news data", "category": "Finance", "auth": "apiKey", "https": True, "link": "https://docs.atom.finance/", "pricing": "paid", "keywords": ["stocks", "earnings", "news"]},
    {"id": "iex", "name": "IEX Cloud", "description": "Free Stocks and Market Data", "category": "Finance", "auth": "apiKey", "https": True, "link": "https://iextrading.com/developer/", "pricing": "freemium", "keywords": ["stocks", "market", "free"]},
    {"id": "twelve-data", "name": "Twelve Data", "description": "Stock market data (real-time and historical)", "category": "Finance", "auth": "apiKey", "https": True, "link": "https://twelvedata.com/docs/", "pricing": "freemium", "keywords": ["stocks", "market", "historical"]},
    {"id": "ibanapi", "name": "IBANAPI", "description": "Validate IBAN number and get bank account info", "category": "Finance", "auth": "apiKey", "https": True, "link": "https://ibanapi.com/get-api", "pricing": "paid", "keywords": ["iban", "banking", "validation"]},
    {"id": "parqet-logo", "name": "Parqet Logo API", "description": "Company logos for 400k+ stocks, ETF, crypto", "category": "Finance", "auth": "None", "https": True, "link": "https://developers.parqet.com/docs/assets/logos", "pricing": "free", "keywords": ["logos", "stocks", "assets"]},
    {"id": "portfolio-optimizer", "name": "Portfolio Optimizer", "description": "Investment portfolio optimization API", "category": "Finance", "auth": "apiKey", "https": True, "link": "https://portfoliooptimizer.io/", "pricing": "freemium", "keywords": ["portfolio", "investment", "optimization"]},

    # Fitness
    {"id": "fitbit", "name": "FitBit API", "description": "Access data from Fitbit activity trackers", "category": "Health", "auth": "OAuth", "https": True, "link": "https://dev.fitbit.com/build/reference/", "pricing": "free", "keywords": ["fitness", "health", "wearables"]},
    {"id": "healthgraph", "name": "HealthGraph (RunKeeper)", "description": "Health Graph data and user information", "category": "Health", "auth": "OAuth", "https": True, "link": "https://runkeeper.com/developer/healthgraph/", "pricing": "free", "keywords": ["fitness", "running", "health"]},
    {"id": "open-food-facts", "name": "Open Food Facts", "description": "Food products database with nutrition info", "category": "Health", "auth": "None", "https": True, "link": "https://en.wiki.openfoodfacts.org/API", "pricing": "free", "keywords": ["food", "nutrition", "database"]},
    {"id": "strava", "name": "Strava API", "description": "Access athletes, activities and segments data", "category": "Health", "auth": "OAuth", "https": True, "link": "https://strava.github.io/api/", "pricing": "freemium", "keywords": ["fitness", "cycling", "running"]},
    {"id": "vegancheck", "name": "VeganCheck", "description": "Check if products are vegan by EAN/UPC", "category": "Health", "auth": "None", "https": True, "link": "https://jokenetwork.de/vegancheck-api", "pricing": "free", "keywords": ["vegan", "food", "products"]},
    {"id": "withings", "name": "Withings API", "description": "Access Withings activity trackers and body measures", "category": "Health", "auth": "OAuth", "https": True, "link": "http://oauth.withings.com/api", "pricing": "free", "keywords": ["health", "wearables", "body"]},

    # Google APIs
    {"id": "gmail-api", "name": "Gmail API", "description": "The Gmail REST API", "category": "Communication", "auth": "OAuth", "https": True, "link": "https://developers.google.com/gmail/api/", "pricing": "free", "keywords": ["email", "gmail", "google"]},
    {"id": "google-bigquery", "name": "Google BigQuery API", "description": "Data platform for creating and querying data", "category": "Database", "auth": "OAuth", "https": True, "link": "https://cloud.google.com/bigquery/docs/reference/rest/v2/", "pricing": "paid", "keywords": ["bigdata", "analytics", "google"]},
    {"id": "google-books", "name": "Google Books API", "description": "Search for books and manage library", "category": "Content", "auth": "apiKey", "https": True, "link": "https://developers.google.com/books/", "pricing": "free", "keywords": ["books", "library", "google"]},
    {"id": "google-classroom", "name": "Google Classroom API", "description": "The Google Classroom API", "category": "Education", "auth": "OAuth", "https": True, "link": "https://developers.google.com/classroom/", "pricing": "free", "keywords": ["education", "classroom", "google"]},
    {"id": "google-customsearch", "name": "Google Custom Search API", "description": "Search over websites or collections", "category": "Search", "auth": "apiKey", "https": True, "link": "https://developers.google.com/custom-search/", "pricing": "freemium", "keywords": ["search", "google", "custom"]},
    {"id": "google-fonts", "name": "Google Fonts API", "description": "Add fonts to any web page", "category": "Design", "auth": "None", "https": True, "link": "https://developers.google.com/fonts/", "pricing": "free", "keywords": ["fonts", "typography", "google"]},
    {"id": "google-genomics", "name": "Google Genomics API", "description": "Access to Genomics data", "category": "Health", "auth": "OAuth", "https": True, "link": "https://cloud.google.com/genomics/reference/rest/", "pricing": "paid", "keywords": ["genomics", "health", "science"]},
    {"id": "google-identity", "name": "Google Identity Toolkit", "description": "Federated login implementation", "category": "Security", "auth": "OAuth", "https": True, "link": "https://developers.google.com/identity/", "pricing": "free", "keywords": ["auth", "identity", "google"]},
    {"id": "google-monitoring", "name": "Google Monitoring API", "description": "Access Google Cloud monitoring data", "category": "Cloud", "auth": "OAuth", "https": True, "link": "https://cloud.google.com/monitoring/api/v3/", "pricing": "paid", "keywords": ["monitoring", "cloud", "google"]},

    # Identity Verification
    {"id": "blockscore", "name": "BlockScore", "description": "Real-time identity verification by name, address, SSN", "category": "Security", "auth": "apiKey", "https": True, "link": "https://docs.blockscore.com/", "pricing": "paid", "keywords": ["identity", "verification", "kyc"]},
    {"id": "cognito", "name": "Cognito", "description": "Verify and retrieve identity information", "category": "Security", "auth": "apiKey", "https": True, "link": "https://cognitohq.com/docs", "pricing": "paid", "keywords": ["identity", "verification", "kyc"]},
    {"id": "whitepages-pro", "name": "Whitepages Pro", "description": "Global Identity Verification API", "category": "Security", "auth": "apiKey", "https": True, "link": "https://pro.whitepages.com/", "pricing": "paid", "keywords": ["identity", "verification", "global"]},

    # Image Moderation
    {"id": "webpurify", "name": "WebPurify", "description": "Live image moderation by humans", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://www.webpurify.com/image-moderation/", "pricing": "paid", "keywords": ["moderation", "images", "content"]},

    # IoT
    {"id": "ably", "name": "Ably", "description": "Cross-protocol real-time communication API", "category": "IoT", "auth": "apiKey", "https": True, "link": "https://www.ably.com/documentation", "pricing": "freemium", "keywords": ["realtime", "iot", "websocket"]},
    {"id": "particle-io", "name": "Particle", "description": "Manage Particle devices including Arduino and RPi", "category": "IoT", "auth": "apiKey", "https": True, "link": "https://docs.particle.io/reference/api/", "pricing": "freemium", "keywords": ["iot", "hardware", "arduino"]},
    {"id": "pubnub", "name": "PubNub", "description": "Real-time apps with various hardware devices", "category": "IoT", "auth": "apiKey", "https": True, "link": "https://www.pubnub.com/docs", "pricing": "freemium", "keywords": ["realtime", "iot", "messaging"]},
    {"id": "philips-hue", "name": "Philips Hue", "description": "Control Hue brand lights", "category": "IoT", "auth": "apiKey", "https": True, "link": "https://developers.meethue.com/documentation/getting-started", "pricing": "free", "keywords": ["lights", "smart-home", "hue"]},
    {"id": "smartthings", "name": "SmartThings", "description": "Samsung SmartThings Smart Home Hub API", "category": "IoT", "auth": "OAuth", "https": True, "link": "http://developer.smartthings.com/", "pricing": "free", "keywords": ["smart-home", "samsung", "hub"]},
    {"id": "temboo", "name": "Temboo SDK", "description": "Code snippets for complex cloud processes", "category": "IoT", "auth": "apiKey", "https": True, "link": "https://temboo.com/download", "pricing": "freemium", "keywords": ["iot", "automation", "cloud"]},
    {"id": "thingspeak", "name": "ThingSpeak", "description": "IoT application to store and retrieve data", "category": "IoT", "auth": "apiKey", "https": True, "link": "https://github.com/iobridge/ThingSpeak", "pricing": "freemium", "keywords": ["iot", "data", "storage"]},
    {"id": "xively", "name": "Xively", "description": "Connect different hardware types to cloud", "category": "IoT", "auth": "apiKey", "https": True, "link": "https://developer.xively.com/reference", "pricing": "paid", "keywords": ["iot", "cloud", "hardware"]},
    {"id": "zetta", "name": "Zetta", "description": "Open source IoT platform built on Node.js", "category": "IoT", "auth": "None", "https": True, "link": "https://github.com/zettajs/zetta/wiki", "pricing": "free", "keywords": ["iot", "nodejs", "open-source"]},

    # Legal
    {"id": "github-licenses", "name": "GitHub Licenses API", "description": "Access open source license information", "category": "Development", "auth": "None", "https": True, "link": "https://developer.github.com/v3/licenses/", "pricing": "free", "keywords": ["licenses", "github", "open-source"]},
    {"id": "tosdr", "name": "ToS;DR API", "description": "Terms of Service ratings and analysis", "category": "Content", "auth": "None", "https": True, "link": "https://tosdr.org/api.html", "pricing": "free", "keywords": ["tos", "legal", "privacy"]},

    # Login Authentication
    {"id": "auth0", "name": "Auth0", "description": "Authenticate and authorize with any identity provider", "category": "Security", "auth": "apiKey", "https": True, "link": "https://auth0.com", "pricing": "freemium", "keywords": ["auth", "identity", "oauth"]},
    {"id": "firebase-auth", "name": "Firebase Auth", "description": "Authentication, analytics, messaging and more", "category": "Security", "auth": "apiKey", "https": True, "link": "https://firebase.google.com/docs/reference/", "pricing": "freemium", "keywords": ["auth", "firebase", "google"]},
    {"id": "linkedin-login", "name": "LinkedIn Sign-in", "description": "Sign in with professional identity", "category": "Security", "auth": "OAuth", "https": True, "link": "https://developer.linkedin.com/docs/signin-with-linkedin", "pricing": "free", "keywords": ["auth", "linkedin", "professional"]},
    {"id": "paypal-login", "name": "PayPal Login", "description": "Sign in with PayPal credentials", "category": "Security", "auth": "OAuth", "https": True, "link": "https://developer.paypal.com/docs/integration/direct/identity/log-in-with-paypal/", "pricing": "free", "keywords": ["auth", "paypal", "payments"]},
    {"id": "salesforce-auth", "name": "Salesforce Auth", "description": "OAuth authentication for Salesforce", "category": "Security", "auth": "OAuth", "https": True, "link": "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/", "pricing": "free", "keywords": ["auth", "salesforce", "enterprise"]},
    {"id": "workos", "name": "WorkOS", "description": "Single Sign-On for Enterprise Identity Providers", "category": "Security", "auth": "apiKey", "https": True, "link": "https://workos.com/docs", "pricing": "freemium", "keywords": ["sso", "enterprise", "identity"]},

    # Machine Learning
    {"id": "amazon-ml", "name": "Amazon ML API", "description": "Machine learning predictions without expertise", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "http://docs.aws.amazon.com/machine-learning/latest/APIReference/", "pricing": "paid", "keywords": ["ml", "aws", "predictions"]},
    {"id": "aylien", "name": "AYLIEN", "description": "NLP and ML tools for text analysis", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "http://aylien.com/", "pricing": "freemium", "keywords": ["nlp", "text", "analysis"]},
    {"id": "bigml", "name": "BigML", "description": "Machine learning focused on decision trees", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "http://bigml.com/api/", "pricing": "freemium", "keywords": ["ml", "decision-trees", "predictions"]},
    {"id": "google-ml-engine", "name": "Google Cloud ML Engine", "description": "Cloud-based machine learning and pattern matching", "category": "AI & ML", "auth": "OAuth", "https": True, "link": "https://cloud.google.com/ml-engine/docs/", "pricing": "paid", "keywords": ["ml", "google", "cloud"]},
    {"id": "objectcut", "name": "ObjectCut", "description": "Automatic background removal powered by AI", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://objectcut.com", "pricing": "freemium", "keywords": ["background", "removal", "ai"]},
    {"id": "ovh-ai-endpoints", "name": "OVH AI Endpoints", "description": "Simplify GenAI and ML integration with secure APIs", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "https://endpoints.ai.cloud.ovh.net/", "pricing": "freemium", "keywords": ["ai", "ml", "genai"]},
    {"id": "unplugg", "name": "Unplugg", "description": "Automated Forecasting API for timeseries data", "category": "AI & ML", "auth": "apiKey", "https": True, "link": "http://unplu.gg/test_api.html", "pricing": "freemium", "keywords": ["forecasting", "timeseries", "energy"]},

    # Maps
    {"id": "cartodb", "name": "CARTO", "description": "Generate maps based on CartoDB data", "category": "Maps", "auth": "apiKey", "https": True, "link": "https://carto.com/developers/", "pricing": "freemium", "keywords": ["maps", "gis", "visualization"]},
    {"id": "here-maps", "name": "HERE Maps", "description": "Wide range of map APIs via JavaScript, iOS, Android", "category": "Maps", "auth": "apiKey", "https": True, "link": "https://developer.here.com/", "pricing": "freemium", "keywords": ["maps", "navigation", "routing"]},
    {"id": "leaflet", "name": "Leaflet.js", "description": "Open-source JavaScript library for mobile-friendly maps", "category": "Maps", "auth": "None", "https": True, "link": "http://leafletjs.com/", "pricing": "free", "keywords": ["maps", "javascript", "open-source"]},
    {"id": "mapbox", "name": "Mapbox", "description": "Access to Mapbox's maps API", "category": "Maps", "auth": "apiKey", "https": True, "link": "https://www.mapbox.com/developers/api/maps/", "pricing": "freemium", "keywords": ["maps", "tiles", "customization"]},
    {"id": "openstreetmap", "name": "OpenStreetMap", "description": "API access to OpenStreetMap data", "category": "Maps", "auth": "None", "https": True, "link": "http://wiki.openstreetmap.org/wiki/API", "pricing": "free", "keywords": ["maps", "open-source", "osm"]},
    {"id": "scribble-maps", "name": "Scribble Maps", "description": "Cross browser HTML5/JavaScript map builder", "category": "Maps", "auth": "apiKey", "https": True, "link": "https://www.scribblemaps.com/api/", "pricing": "freemium", "keywords": ["maps", "drawing", "interactive"]},
    {"id": "yandex-maps", "name": "Yandex Maps", "description": "Install Yandex.Maps on your web app", "category": "Maps", "auth": "apiKey", "https": True, "link": "https://tech.yandex.com/maps/", "pricing": "freemium", "keywords": ["maps", "russia", "yandex"]},

    # Math
    {"id": "newton-api", "name": "Newton API", "description": "Arithmetic and Symbolic Math", "category": "Utilities", "auth": "None", "https": True, "link": "https://newton.now.sh/", "pricing": "free", "keywords": ["math", "calculus", "algebra"]},

    # Medical
    {"id": "covid19-data", "name": "COVID-19 Data API", "description": "Live and historical Coronavirus data by country", "category": "Health", "auth": "None", "https": True, "link": "https://github.com/M-Media-Group/Covid-19-API", "pricing": "free", "keywords": ["covid", "health", "pandemic"]},
    {"id": "infermedica", "name": "Infermedica", "description": "AI-based patient triage and preliminary diagnosis", "category": "Health", "auth": "apiKey", "https": True, "link": "https://developer.infermedica.com/docs/introduction", "pricing": "paid", "keywords": ["health", "ai", "diagnosis"]},

    # TonnyL/Awesome_APIs additions
    # Anime
    {"id": "acgclub", "name": "AcgClub API", "description": "ACG-related aggregation services", "category": "Entertainment", "auth": "None", "https": True, "link": "https://github.com/Rabtman/AcgClub/wiki/", "pricing": "free", "keywords": ["anime", "acg", "aggregation"]},
    {"id": "hitokoto", "name": "Hitokoto API", "description": "One-word service from anime and paragraphs", "category": "Content", "auth": "None", "https": True, "link": "https://hitokoto.cn/api", "pricing": "free", "keywords": ["anime", "quotes", "chinese"]},
    {"id": "kitsu", "name": "Kitsu API", "description": "Modern anime discovery platform", "category": "Entertainment", "auth": "OAuth", "https": True, "link": "https://kitsu.docs.apiary.io/", "pricing": "free", "keywords": ["anime", "discovery", "social"]},

    # Blogging
    {"id": "medium-api", "name": "Medium API", "description": "Access to medium.com data", "category": "Content", "auth": "OAuth", "https": True, "link": "https://github.com/Medium/medium-api-docs", "pricing": "free", "keywords": ["blogging", "medium", "writing"]},
    {"id": "weebly-cloud", "name": "Weebly Cloud", "description": "Website builder for customers", "category": "Development", "auth": "OAuth", "https": True, "link": "https://cloud-developer.weebly.com/", "pricing": "paid", "keywords": ["website", "builder", "hosting"]},
    {"id": "telegraph", "name": "Telegraph API", "description": "Telegram's publishing service API", "category": "Content", "auth": "None", "https": True, "link": "http://telegra.ph/api", "pricing": "free", "keywords": ["publishing", "telegram", "articles"]},

    # Books
    {"id": "ice-fire-api", "name": "An API of Ice and Fire", "description": "A Song of Ice and Fire data", "category": "Entertainment", "auth": "None", "https": True, "link": "https://anapioficeandfire.com/", "pricing": "free", "keywords": ["got", "books", "fantasy"]},
    {"id": "openlibrary", "name": "Open Library Books API", "description": "Open editable library catalog", "category": "Content", "auth": "None", "https": True, "link": "https://openlibrary.org/developers/api", "pricing": "free", "keywords": ["books", "library", "open"]},
    {"id": "nypl-digital", "name": "NYPL Digital Collections", "description": "NY Public Library rare materials API", "category": "Content", "auth": "apiKey", "https": True, "link": "http://api.repo.nypl.org/", "pricing": "free", "keywords": ["library", "nypl", "collections"]},
    {"id": "bookshare", "name": "Bookshare API", "description": "Books for customers with print disabilities", "category": "Content", "auth": "apiKey", "https": True, "link": "http://developer.bookshare.org/", "pricing": "free", "keywords": ["books", "accessibility", "reading"]},

    # Business
    {"id": "airtable-api", "name": "Airtable API", "description": "Create, read, update, and destroy records", "category": "Business", "auth": "apiKey", "https": True, "link": "https://airtable.com/api", "pricing": "freemium", "keywords": ["database", "spreadsheet", "collaboration"]},
    {"id": "buffer-api", "name": "Buffer API", "description": "Access pending and sent updates, profiles, scheduled times", "category": "Business", "auth": "OAuth", "https": True, "link": "https://buffer.com/developers/api", "pricing": "freemium", "keywords": ["social", "scheduling", "marketing"]},
    {"id": "concur", "name": "Concur Labs", "description": "Access to Concur's RESTful API", "category": "Business", "auth": "OAuth", "https": True, "link": "https://developer.concur.com/api-reference/", "pricing": "paid", "keywords": ["travel", "expense", "enterprise"]},
    {"id": "envoy", "name": "Envoy API", "description": "Access to Envoy's visitor management API", "category": "Business", "auth": "apiKey", "https": True, "link": "https://developers.envoy.com/", "pricing": "paid", "keywords": ["visitors", "office", "management"]},
    {"id": "jotform", "name": "JotForm API", "description": "Connect to form data without web site", "category": "Business", "auth": "apiKey", "https": True, "link": "http://api.jotform.com/docs/", "pricing": "freemium", "keywords": ["forms", "surveys", "data"]},
    {"id": "pruvan", "name": "Pruvan API", "description": "Access to Pruvan's field service API", "category": "Business", "auth": "apiKey", "https": True, "link": "https://pruvan.com/resources/pruvan-api/", "pricing": "paid", "keywords": ["field-service", "mobile", "work"]},
    {"id": "quip-api", "name": "Quip API", "description": "Automate processes and integrate Quip", "category": "Business", "auth": "apiKey", "https": True, "link": "https://quip.com/api/", "pricing": "freemium", "keywords": ["documents", "collaboration", "productivity"]},
    {"id": "square-api", "name": "Square API", "description": "Credit card processing and business solutions", "category": "Finance", "auth": "apiKey", "https": True, "link": "https://connect.squareup.com/", "pricing": "freemium", "keywords": ["payments", "pos", "commerce"]},
    {"id": "wolfram-datadrop", "name": "Wolfram Data Drop", "description": "Access to Wolfram Data Drop's RESTful API", "category": "Data", "auth": "apiKey", "https": True, "link": "https://www.wolfram.com/datadrop/quick-reference/web-api/", "pricing": "freemium", "keywords": ["data", "wolfram", "storage"]},

    # More from TonnyL
    {"id": "lyft", "name": "Lyft API", "description": "Real-time ETAs, availability, price estimates, ride status", "category": "Transport", "auth": "OAuth", "https": True, "link": "https://www.lyft.com/developers", "pricing": "freemium", "keywords": ["rideshare", "transportation", "mobility"]},
    {"id": "uber", "name": "Uber API", "description": "Customize trip experiences, request rides, power logistics", "category": "Transport", "auth": "OAuth", "https": True, "link": "https://developer.uber.com/", "pricing": "freemium", "keywords": ["rideshare", "transportation", "delivery"]},

    # Cloud Storage
    {"id": "box-api", "name": "Box API", "description": "Search, metadata, permissions, enterprise security", "category": "Cloud", "auth": "OAuth", "https": True, "link": "https://developer.box.com/", "pricing": "freemium", "keywords": ["storage", "enterprise", "collaboration"]},
    {"id": "document-cloud", "name": "DocumentCloud", "description": "Document processing with OpenCalais integration", "category": "Content", "auth": "apiKey", "https": True, "link": "http://www.documentcloud.org/help/api", "pricing": "freemium", "keywords": ["documents", "journalism", "analysis"]},
    {"id": "google-drive-api", "name": "Google Drive API", "description": "Read, write, and sync files in Google Drive", "category": "Cloud", "auth": "OAuth", "https": True, "link": "https://developers.google.com/drive/", "pricing": "free", "keywords": ["storage", "google", "files"]},
    {"id": "onedrive-api", "name": "OneDrive API", "description": "Access to OneDrive files", "category": "Cloud", "auth": "OAuth", "https": True, "link": "https://dev.onedrive.com/", "pricing": "free", "keywords": ["storage", "microsoft", "files"]},
    {"id": "qnap", "name": "QNAP API", "description": "Manage and access files on QNAP NAS", "category": "Cloud", "auth": "apiKey", "https": True, "link": "https://www.qnap.com/event/dev/", "pricing": "free", "keywords": ["nas", "storage", "hardware"]},

    # Delivery Tracking
    {"id": "aftership", "name": "AfterShip", "description": "Shipment tracking for 200+ couriers", "category": "Transport", "auth": "apiKey", "https": True, "link": "https://docs.aftership.com/api/", "pricing": "freemium", "keywords": ["shipping", "tracking", "logistics"]},
    {"id": "aramex", "name": "Aramex", "description": "Parcel, package, and freight delivery API", "category": "Transport", "auth": "apiKey", "https": True, "link": "https://www.aramex.com/developers/aramex-apis", "pricing": "paid", "keywords": ["shipping", "logistics", "global"]},
    {"id": "canada-post", "name": "Canada Post", "description": "Shipping, rating and tracking integration", "category": "Transport", "auth": "apiKey", "https": True, "link": "http://www.canadapost.ca/cpo/mc/business/productsservices/developers/", "pricing": "freemium", "keywords": ["shipping", "canada", "postal"]},
    {"id": "dhl", "name": "DHL API", "description": "Service availability, transit times, rates, shipment tracking", "category": "Transport", "auth": "apiKey", "https": True, "link": "http://www.dhl-usa.com/en/express/resource_center/integrated_shipping_solutions.html", "pricing": "freemium", "keywords": ["shipping", "global", "express"]},
    {"id": "fedex", "name": "FedEx API", "description": "FedEx shipping functionality integration", "category": "Transport", "auth": "apiKey", "https": True, "link": "https://www.fedex.com/us/developer/web-services/index.html", "pricing": "freemium", "keywords": ["shipping", "express", "global"]},
    {"id": "ups", "name": "UPS API", "description": "UPS shipping functionalities integration", "category": "Transport", "auth": "apiKey", "https": True, "link": "http://www.ups.com/content/us/en/resources/techsupport/developercenter.html", "pricing": "freemium", "keywords": ["shipping", "express", "global"]},

    # Design
    {"id": "dribbble", "name": "Dribbble API", "description": "Access buckets, projects, shots, teams, users data", "category": "Design", "auth": "OAuth", "https": True, "link": "http://developer.dribbble.com/v1/", "pricing": "free", "keywords": ["design", "portfolio", "creative"]},
    {"id": "behance", "name": "Behance API", "description": "Projects, creatives, creative fields, collections", "category": "Design", "auth": "apiKey", "https": True, "link": "https://www.behance.net/dev/api/endpoints/", "pricing": "free", "keywords": ["design", "portfolio", "adobe"]},
    {"id": "deviantart", "name": "DeviantART API", "description": "Access to deviantart.com data", "category": "Design", "auth": "OAuth", "https": True, "link": "https://www.deviantart.com/developers/", "pricing": "free", "keywords": ["art", "community", "creative"]},
]

def load_registry():
    """Load the current registry"""
    with open(REGISTRY_PATH, "r") as f:
        return json.load(f)

def save_registry(data):
    """Save the registry"""
    with open(REGISTRY_PATH, "w") as f:
        json.dump(data, f, separators=(',', ':'))

def generate_id(name):
    """Generate an ID from name"""
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

def main():
    print(f"🦞 APIClaw Night Expansion - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    
    # Load current registry
    registry = load_registry()
    current_apis = registry.get("apis", [])
    
    # Fix APIs without IDs
    fixed = 0
    for api in current_apis:
        if "id" not in api or not api["id"]:
            api["id"] = generate_id(api.get("name", f"api-{fixed}"))
            fixed += 1
    
    if fixed > 0:
        print(f"🔧 Fixed {fixed} APIs missing IDs")
    
    current_ids = {api["id"] for api in current_apis}
    
    print(f"📊 Current APIs: {len(current_apis)}")
    
    # Add new APIs
    added = 0
    skipped = 0
    
    for api in NEW_APIS:
        if api["id"] not in current_ids:
            # Add cors field if missing
            if "cors" not in api:
                api["cors"] = "unknown"
            current_apis.append(api)
            current_ids.add(api["id"])
            added += 1
        else:
            skipped += 1
    
    print(f"✅ Added: {added} APIs")
    print(f"⏭️ Skipped (duplicates): {skipped}")
    
    # Update registry
    registry["apis"] = current_apis
    registry["count"] = len(current_apis)
    registry["lastUpdated"] = datetime.now().isoformat()
    
    # Count categories
    categories = {}
    for api in current_apis:
        cat = api.get("category", "Other")
        categories[cat] = categories.get(cat, 0) + 1
    registry["categoryCount"] = len(categories)
    
    # Save
    save_registry(registry)
    
    print(f"\n📊 Final count: {len(current_apis)} APIs")
    print(f"📁 Categories: {len(categories)}")
    print(f"\n🔝 Top 5 categories:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1])[:5]:
        print(f"   {cat}: {count}")
    
    print(f"\n✅ Saved to {REGISTRY_PATH}")
    return added

if __name__ == "__main__":
    added = main()
    print(f"\n🎉 Night expansion complete! +{added} APIs")
