#!/usr/bin/env python3
"""
APIClaw Night Expansion - 2026-02-24 02:00
Parse n0shake/Public-APIs README and add new APIs
"""

import json
import re
import os
from datetime import datetime

REGISTRY_PATH = os.path.expanduser("~/Projects/apiclaw/src/registry/apis.json")

# Parse the markdown table format from n0shake/Public-APIs
# Format: | [**Name**](url) | Description | Open/Trial |

def parse_api_entry(line, category):
    """Parse a markdown table row into API entry"""
    # Match: | [**Name**](url) | Description | Open/Trial |
    pattern = r'\|\s*\[\*\*([^*]+)\*\*\]\(([^)]+)\)\s*\|\s*([^|]+)\s*\|\s*([^|]*)\s*\|'
    match = re.match(pattern, line.strip())
    
    if match:
        name = match.group(1).strip()
        url = match.group(2).strip()
        description = match.group(3).strip()
        trial_info = match.group(4).strip()
        
        # Generate ID
        api_id = name.lower().replace(' ', '-').replace('.', '-').replace('_', '-')
        api_id = re.sub(r'[^a-z0-9-]', '', api_id)
        api_id = re.sub(r'-+', '-', api_id).strip('-')
        
        # Determine auth/pricing from trial_info
        auth = "apikey"
        pricing = "unknown"
        if "💸" in trial_info:
            pricing = "paid"
        elif "Open Source" in trial_info or "N/A" in trial_info:
            pricing = "free"
            auth = "None"
        
        return {
            "id": api_id,
            "name": name,
            "description": description[:200] if description else f"{name} API",
            "category": category,
            "auth": auth,
            "https": True,
            "cors": "unknown",
            "link": url,
            "pricing": pricing,
            "keywords": extract_keywords(name, description, category)
        }
    return None

def extract_keywords(name, description, category):
    """Extract keywords from name and description"""
    keywords = []
    text = f"{name} {description} {category}".lower()
    
    # Common keywords to extract
    keyword_patterns = [
        'ai', 'ml', 'api', 'rest', 'graphql', 'json', 'xml',
        'free', 'open source', 'real-time', 'realtime',
        'weather', 'crypto', 'blockchain', 'nft', 'bitcoin',
        'sms', 'email', 'voice', 'chat', 'messaging',
        'payment', 'stripe', 'finance', 'bank', 'currency',
        'image', 'video', 'audio', 'music', 'speech',
        'geo', 'map', 'location', 'geocoding',
        'social', 'twitter', 'facebook', 'instagram',
        'auth', 'oauth', 'login', 'identity',
        'search', 'analytics', 'data', 'database',
        'cloud', 'storage', 'file', 'cdn',
        'news', 'content', 'feed', 'rss',
        'health', 'medical', 'fitness',
        'game', 'gaming', 'entertainment',
        'translate', 'language', 'nlp', 'text'
    ]
    
    for kw in keyword_patterns:
        if kw in text and kw not in keywords:
            keywords.append(kw)
    
    return keywords[:5]

# APIs parsed from n0shake/Public-APIs README
PARSED_APIS = [
    # Advertising
    {"name": "Amazon Mobile Ads", "url": "https://developer.amazon.com/mobile-ads", "desc": "Monetize across platforms with multiple ad formats", "cat": "Advertising"},
    {"name": "Facebook Marketing API", "url": "https://developers.facebook.com/docs/marketing-apis", "desc": "Manage ads and campaigns using the Facebook API", "cat": "Advertising"},
    {"name": "Google AdSense", "url": "https://developers.google.com/adsense/", "desc": "Free, flexible way to earn money from your websites", "cat": "Advertising"},
    {"name": "Google AdWords API", "url": "https://developers.google.com/adwords/api/docs/guides/start", "desc": "Manage Google AdWords campaigns programmatically", "cat": "Advertising"},
    {"name": "Kevel Ad APIs", "url": "https://dev.kevel.co", "desc": "Build your own ad server with Kevel ad APIs", "cat": "Advertising"},
    {"name": "Microsoft Bing Ads API", "url": "https://msdn.microsoft.com/en-us/library/bing-ads-api.aspx", "desc": "Programmatic access to various advertising technologies", "cat": "Advertising"},
    
    # Analytics
    {"name": "Amazon Mobile Analytics", "url": "https://aws.amazon.com/documentation/mobileanalytics/", "desc": "Service for collecting, visualizing app usage data", "cat": "Analytics"},
    {"name": "Clicky", "url": "https://clicky.com/help/api", "desc": "Extract website traffic data for integration and analysis", "cat": "Analytics"},
    {"name": "DitchCarbon API", "url": "https://docs.ditchcarbon.com/", "desc": "Company and product carbon emissions disclosures", "cat": "Analytics"},
    {"name": "Fabric Firebase", "url": "https://firebase.google.com/", "desc": "Build better apps, understand users, grow business", "cat": "Analytics"},
    {"name": "Google Analytics", "url": "https://developers.google.com/analytics/", "desc": "Collect, configure, report on user interactions", "cat": "Analytics"},
    {"name": "Localytics", "url": "http://docs.localytics.com/dev/query-api.html", "desc": "Interface to Localytics analytics platform", "cat": "Analytics"},
    {"name": "Matomo", "url": "https://matomo.org/docs/analytics-api/", "desc": "All-in-one premium web analytics platform", "cat": "Analytics"},
    {"name": "MixPanel", "url": "https://developer.mixpanel.com/docs/implement-mixpanel", "desc": "Analytics for mobile and web applications", "cat": "Analytics"},
    {"name": "Open Web Analytics", "url": "https://github.com/padams/Open-Web-Analytics/wiki/Data-Access-API", "desc": "Work with data outside OWA reporting interface", "cat": "Analytics"},
    {"name": "Ticksel", "url": "https://ticksel.com", "desc": "Friendly website analytics made for humans", "cat": "Analytics"},
    {"name": "Woopra", "url": "https://www.woopra.com/docs/developer/analytics-api/", "desc": "Real-time website analysis for customer engagement", "cat": "Analytics"},
    {"name": "Zoho Reports API", "url": "https://zohoreportsapi.wiki.zoho.com/", "desc": "Build powerful reporting and analytical capabilities", "cat": "Analytics"},
    
    # AR/VR
    {"name": "Vuforia", "url": "https://library.vuforia.com/", "desc": "Solid AR SDK with robust development options", "cat": "AR/VR"},
    {"name": "Wikitude", "url": "http://www.wikitude.com/download/", "desc": "All-in-one AR solution with image recognition and 3D rendering", "cat": "AR/VR"},
    
    # Barcode
    {"name": "Dynamic QR Code", "url": "https://rapidapi.com/updeploy-tools/api/qr-code-dynamic-and-static1/", "desc": "Generate dynamic and static QR Codes", "cat": "Utilities"},
    {"name": "Google Barcode", "url": "https://developers.google.com/vision/barcodes-overview", "desc": "Detect barcodes in real-time on device", "cat": "Utilities"},
    {"name": "EAN-Search", "url": "https://www.ean-search.org/ean-database-api.html", "desc": "Lookup products by EAN, UPC or GTIN barcode", "cat": "E-commerce"},
    {"name": "QR Code API", "url": "https://fungenerators.com/api/qrcode/", "desc": "Create QR code images or read existing images", "cat": "Utilities"},
    {"name": "OpenQR", "url": "https://docs.openqr.io/", "desc": "Static and Dynamic QR code generator API", "cat": "Utilities"},
    
    # Big Data
    {"name": "Google Charts", "url": "https://developers.google.com/chart/interactive/docs/", "desc": "Free tool for visualizing data from websites", "cat": "Data & Analytics"},
    {"name": "Keen IO", "url": "https://keen.io/docs/api/", "desc": "Powerful, flexible, scalable Big Data solution", "cat": "Data & Analytics"},
    {"name": "MongoDB", "url": "https://github.com/mongodb", "desc": "Database for handling Big Data", "cat": "Databases"},
    {"name": "LinkedData Center", "url": "http://linkeddata.center/home/gdaas", "desc": "RDF graph database as a service with SPARQL", "cat": "Databases"},
    
    # Cryptocurrency
    {"name": "Bitcoin", "url": "https://developer.bitcoin.org/", "desc": "Resources, guides and reference material for Bitcoin developers", "cat": "Cryptocurrency"},
    {"name": "Bitcoincharts", "url": "https://bitcoincharts.com/about/markets-api/", "desc": "Markets data for websites and mobile apps", "cat": "Cryptocurrency"},
    {"name": "BitPay", "url": "https://bitpay.com/developers", "desc": "RESTful API for powerful bitcoin infrastructure", "cat": "Cryptocurrency"},
    {"name": "Block.io", "url": "https://block.io/", "desc": "Most versatile and secure wallet for all coins", "cat": "Cryptocurrency"},
    {"name": "BlockCypher", "url": "https://www.blockcypher.com/", "desc": "Infrastructure fabric for blockchain applications", "cat": "Cryptocurrency"},
    {"name": "BlockFacts", "url": "https://blockfacts.io/", "desc": "Compliance-first digital asset data with REST and WebSocket", "cat": "Cryptocurrency"},
    {"name": "Coinbase", "url": "https://developers.coinbase.com/", "desc": "APIs and tools for building bitcoin apps", "cat": "Cryptocurrency"},
    {"name": "CoinDesk", "url": "http://www.coindesk.com/api/", "desc": "Bitcoin Price Index", "cat": "Cryptocurrency"},
    {"name": "CoinGecko", "url": "https://coingecko.com/en/api", "desc": "Free public cryptocurrency API without API key", "cat": "Cryptocurrency"},
    {"name": "Coinlore", "url": "https://www.coinlore.com/cryptocurrency-data-api", "desc": "Cryptocurrency tick data API", "cat": "Cryptocurrency"},
    {"name": "CoinMarketCap", "url": "https://coinmarketcap.com/api/", "desc": "Cryptocurrencies prices", "cat": "Cryptocurrency"},
    {"name": "CoinPaprika", "url": "https://api.coinpaprika.com", "desc": "Cryptocurrencies prices, market cap, volume", "cat": "Cryptocurrency"},
    {"name": "CryptoCompare", "url": "https://www.cryptocompare.com/api", "desc": "Cryptocurrencies comparison", "cat": "Cryptocurrency"},
    {"name": "Cryptonator", "url": "https://www.cryptonator.com/api/", "desc": "Cryptocurrencies exchange rates", "cat": "Cryptocurrency"},
    {"name": "Coinigy", "url": "https://coinigy.docs.apiary.io", "desc": "Interact with exchange accounts directly", "cat": "Cryptocurrency"},
    {"name": "Covalent", "url": "https://www.covalenthq.com/docs/api/", "desc": "Multi-blockchain data aggregator unified API", "cat": "Cryptocurrency"},
    {"name": "PENDAX", "url": "https://github.com/CompendiumFi/PENDAX-SDK", "desc": "SDK for trading, data, websockets for crypto exchanges", "cat": "Cryptocurrency"},
    {"name": "Poloniex", "url": "https://poloniex.com/support/api/", "desc": "US based digital asset exchange", "cat": "Cryptocurrency"},
    {"name": "ShapeShift", "url": "https://shapeshift.io/", "desc": "Exchange between cryptocurrencies without account", "cat": "Cryptocurrency"},
    
    # Calendar
    {"name": "CalendarIndex", "url": "https://www.calendarindex.com", "desc": "Worldwide Holidays and Working Days API", "cat": "Calendar"},
    {"name": "DigiDates API", "url": "https://digidates.de/en/", "desc": "Rest API for date and time calculations", "cat": "Calendar"},
    {"name": "Holiday API", "url": "https://holidayapi.pl/", "desc": "Public holiday API for several countries", "cat": "Calendar"},
    {"name": "OpenHolidays API", "url": "https://www.openholidaysapi.org/", "desc": "Public and school holidays for European countries", "cat": "Calendar"},
    
    # Captcha
    {"name": "Anti-Captcha", "url": "https://anti-captcha.com/apidoc", "desc": "Access to Anti-Captcha solving API", "cat": "Security"},
    {"name": "ProxyCrawl", "url": "https://proxycrawl.com", "desc": "Crawl and scrape without proxies, solve captchas", "cat": "Web Scraping"},
    {"name": "Google reCAPTCHA", "url": "https://developers.google.com/recaptcha/intro", "desc": "Embed CAPTCHA to protect against spam", "cat": "Security"},
    
    # Check-In
    {"name": "Facebook Check-In", "url": "https://developers.facebook.com/docs/graph-api/reference/v2.3/checkin", "desc": "Check-in to location-based Pages", "cat": "Social Media"},
    {"name": "Google Places", "url": "https://developers.google.com/places/", "desc": "Access to Google Places API", "cat": "Location"},
    {"name": "Foursquare Check-In", "url": "https://developer.foursquare.com/reference/v2-checkins-add", "desc": "Check in to places", "cat": "Location"},
    
    # Commerce
    {"name": "Commerce Layer", "url": "https://docs.commercelayer.io/api/", "desc": "Headless commerce platform for global ecommerce", "cat": "E-commerce"},
    {"name": "Envoice", "url": "https://www.envoice.in/reference/api/docs", "desc": "Invoicing for online businesses", "cat": "Finance"},
    {"name": "Koomalooma", "url": "http://business.koomalooma.com", "desc": "Loyalty BPaaS for mobile and web companies", "cat": "E-commerce"},
    {"name": "Moltin", "url": "https://www.moltin.com/developers", "desc": "Unified APIs for inventory, carts, checkout, payments", "cat": "E-commerce"},
    {"name": "Stripe", "url": "https://stripe.com/docs/api", "desc": "Accept payments over the Internet", "cat": "Payments"},
    {"name": "Repetiti", "url": "https://developers.repetiti.com", "desc": "3D Printer Management Service", "cat": "IoT"},
    {"name": "Braintree", "url": "https://developers.braintreepayments.com", "desc": "Mobile and web payment systems for ecommerce", "cat": "Payments"},
    {"name": "Yellow Pages API", "url": "https://github.com/Hrushi11/Yellow-Pages-End-API", "desc": "Business data for any city in the US", "cat": "Data & Analytics"},
    
    # Communication
    {"name": "Africa's Talking", "url": "https://africastalking.com/", "desc": "Access African telco services through HTTP API", "cat": "Communication"},
    {"name": "iP1sms", "url": "https://www.ip1sms.com/en/developer/", "desc": "Send and receive SMS messages worldwide", "cat": "Communication"},
    {"name": "Eqivo", "url": "https://eqivo.org", "desc": "Telephony/Programmable-Voice API platform", "cat": "Communication"},
    {"name": "MailGun", "url": "https://mailgun.com", "desc": "Transactional Email API Service", "cat": "Email"},
    {"name": "Nexmo", "url": "https://developer.nexmo.com", "desc": "Phone calls, SMS worldwide", "cat": "Communication"},
    {"name": "Sakari", "url": "https://developer.sakari.io", "desc": "Send and Receive SMS to 200+ countries", "cat": "Communication"},
    {"name": "Telnyx", "url": "https://developers.telnyx.com/", "desc": "Build Voice, SMS, Fax, Networking and IoT apps", "cat": "Communication"},
    {"name": "The SMS Works", "url": "https://thesmsworks.co.uk/sms-api", "desc": "Low-cost, reliable SMS API for developers", "cat": "Communication"},
    {"name": "Twilio", "url": "https://www.twilio.com/solutions", "desc": "APIs for SMS, Voice, Video and more", "cat": "Communication"},
    
    # Content
    {"name": "Bible API", "url": "https://github.com/wldeh/bible-api", "desc": "Bible API with 200+ translations", "cat": "Content"},
    {"name": "Bible API (public domain)", "url": "https://bible-api.com/", "desc": "JSON API for open bible translations", "cat": "Content"},
    {"name": "Fruits API", "url": "https://github.com/Franqsanz/fruits-api", "desc": "GraphQL API with fruit trees info", "cat": "Content"},
    {"name": "Jokes API", "url": "https://jokes.one/api/joke/", "desc": "Full featured Jokes API", "cat": "Entertainment"},
    {"name": "Perfect Tense API", "url": "https://www.perfecttense.com/developers", "desc": "AI spelling and grammar checking", "cat": "AI & ML"},
    {"name": "qKast", "url": "https://github.com/egfx/qKast", "desc": "Live content collections from any page", "cat": "Content"},
    {"name": "Random Data Generator", "url": "https://randommer.io/randommer-api", "desc": "Generate telephones, text, numbers, passwords", "cat": "Utilities"},
    {"name": "Random Facts", "url": "https://fungenerators.com/api/facts/", "desc": "Random Facts API", "cat": "Entertainment"},
    {"name": "SLF", "url": "https://github.com/slftool/slftool.github.io/blob/master/API.md", "desc": "German city, country, river database", "cat": "Data & Analytics"},
    {"name": "Today in History", "url": "https://history.muffinlabs.com/", "desc": "Daily historical events, births and deaths", "cat": "Content"},
    {"name": "Wikipedia", "url": "https://en.wikipedia.org/w/api.php", "desc": "Free multilingual Encyclopedia", "cat": "Content"},
    
    # Currency
    {"name": "1Forge", "url": "https://1forge.com/", "desc": "Real-time forex and crypto quotes", "cat": "Finance"},
    {"name": "Currency API", "url": "https://github.com/fawazahmed0/currency-api", "desc": "Free Currency Exchange Rates API 150+ currencies", "cat": "Finance"},
    {"name": "CurrencyLayer", "url": "https://currencylayer.com/documentation", "desc": "Exchange rates and currency conversion API", "cat": "Finance"},
    {"name": "CurrencyScoop", "url": "https://currencyscoop.com/", "desc": "Real-time and historical currency rates", "cat": "Finance"},
    {"name": "ECB Exchange Rates", "url": "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", "desc": "Free currency exchange rates from ECB", "cat": "Finance"},
    {"name": "ExchangeRate-API", "url": "https://www.exchangerate-api.com/docs/overview", "desc": "Currency conversion API", "cat": "Finance"},
    {"name": "ExchangeRatesAPI", "url": "https://exchangeratesapi.io/", "desc": "Foreign exchange rates with currency conversion", "cat": "Finance"},
    {"name": "Fixer.io", "url": "http://fixer.io/", "desc": "JSON API for foreign exchange rates", "cat": "Finance"},
    {"name": "Frankfurter", "url": "https://www.frankfurter.app/docs/", "desc": "Exchange rates and currency data API", "cat": "Finance"},
    {"name": "OpenRates", "url": "http://www.openrates.io/", "desc": "Live exchange rates and currency conversion", "cat": "Finance"},
    
    # Design
    {"name": "Dribbble", "url": "http://developer.dribbble.com/", "desc": "Community of designers sharing work", "cat": "Design"},
    {"name": "Icon Horse", "url": "https://icon.horse/usage", "desc": "Get favicon logo for any web address", "cat": "Design"},
    {"name": "Pexels", "url": "https://www.pexels.com/api/", "desc": "Free stock photos under CC0 license", "cat": "Media"},
    {"name": "PHP-Noise", "url": "https://php-noise.com/", "desc": "Noise background image generator API", "cat": "Design"},
    
    # Dictionary
    {"name": "Agarathi", "url": "https://agarathi.com/api/dictionary", "desc": "Tamil language Dictionary API", "cat": "Language"},
    {"name": "Cambridge Dictionaries", "url": "http://dictionary.cambridge.org/license.html", "desc": "Access Cambridge custom API", "cat": "Language"},
    {"name": "Datamuse API", "url": "https://www.datamuse.com/api/", "desc": "Word-finding query engine", "cat": "Language"},
    {"name": "Free Dictionary API", "url": "https://dictionaryapi.dev/", "desc": "Get word definitions for free", "cat": "Language"},
    {"name": "Lingua Robot API", "url": "https://www.linguarobot.io/", "desc": "Definition, pronunciation, synonyms, antonyms", "cat": "Language"},
    {"name": "Merriam-Webster", "url": "http://www.dictionaryapi.com/", "desc": "Dictionary and thesaurus content", "cat": "Language"},
    {"name": "Oxford Dictionary", "url": "https://developer.oxforddictionaries.com/", "desc": "Access to Oxford Dictionary services", "cat": "Language"},
    {"name": "Wordnik", "url": "http://developer.wordnik.com/docs.html", "desc": "Dictionary functions", "cat": "Language"},
    {"name": "Words API", "url": "https://www.wordsapi.com/", "desc": "Definitions for 150,000+ words", "cat": "Language"},
    {"name": "Wiktionary", "url": "https://en.wiktionary.org/w/api.php", "desc": "Free multilingual dictionary", "cat": "Language"},
    
    # Entertainment
    {"name": "Anilist", "url": "https://anilist.gitbook.io/anilist-apiv2-docs/", "desc": "Free GraphQL API for anime and manga", "cat": "Entertainment"},
    {"name": "Bob's Burgers API", "url": "https://www.bobsburgersapi.com/documentation", "desc": "Characters, episodes, running gags from the show", "cat": "Entertainment"},
    {"name": "Breaking Bad API", "url": "https://breakingbadapi.com/documentation", "desc": "Characters, episodes, quotes, deaths", "cat": "Entertainment"},
    {"name": "Buffy Angel API", "url": "https://github.com/Thatskat/btvs-angel-api", "desc": "Episode, cast and crew data", "cat": "Entertainment"},
    {"name": "CATAAS", "url": "https://cataas.com/", "desc": "Cat as a Service REST API", "cat": "Entertainment"},
    {"name": "Comic Vine", "url": "http://comicvine.gamespot.com/api/", "desc": "Mature comic information resource", "cat": "Entertainment"},
    {"name": "Comichron Data", "url": "https://github.com/comichron-data/api", "desc": "Comic sales data API", "cat": "Entertainment"},
    {"name": "Danbooru", "url": "https://danbooru.donmai.us/posts", "desc": "Get images categorized by tags", "cat": "Media"},
    {"name": "Dune API", "url": "https://github.com/ywalia01/dune-api", "desc": "Book, character, movie and quotes data", "cat": "Entertainment"},
    {"name": "Final Space API", "url": "https://finalspaceapi.com/docs/", "desc": "RESTful API for Final Space show", "cat": "Entertainment"},
    {"name": "Fun Translations", "url": "https://funtranslations.com/api/", "desc": "Translate to 50+ languages from TV/Movies", "cat": "Language"},
    {"name": "Lord of the Rings API", "url": "https://the-one-api.dev/documentation", "desc": "Books, movies, characters and quotes", "cat": "Entertainment"},
    {"name": "Marvel", "url": "https://developer.marvel.com/", "desc": "Access 70 years of comic data", "cat": "Entertainment"},
    {"name": "Jikan (MyAnimeList)", "url": "https://jikan.moe/", "desc": "Data about any anime or anime genre", "cat": "Entertainment"},
    {"name": "Owen Wilson Wow API", "url": "https://owen-wilson-wow-api.onrender.com/", "desc": "Owen Wilson wow exclamations in movies", "cat": "Entertainment"},
    {"name": "Pokeapi", "url": "https://pokeapi.co/", "desc": "All Pokemon data you'll ever need", "cat": "Entertainment"},
    {"name": "Rick and Morty", "url": "https://rickandmortyapi.com/", "desc": "All Rick and Morty information", "cat": "Entertainment"},
    {"name": "Riddles API", "url": "https://riddles-api.vercel.app/", "desc": "Get random riddles", "cat": "Entertainment"},
    {"name": "STAPI Star Trek", "url": "https://stapi.co/api-documentation", "desc": "Star Trek API", "cat": "Entertainment"},
    {"name": "SWAPI Star Wars", "url": "https://www.swapi.tech/", "desc": "All things Star Wars", "cat": "Entertainment"},
    {"name": "Studio Ghibli", "url": "https://ghibliapi.vercel.app/", "desc": "Resources from Studio Ghibli films", "cat": "Entertainment"},
    {"name": "TCGdex", "url": "https://www.tcgdex.dev/", "desc": "Multilanguage Pokemon TCG Database", "cat": "Entertainment"},
    
    # Events
    {"name": "Picatic", "url": "http://developer.picatic.com/", "desc": "Sell tickets from your app or website", "cat": "Events"},
    
    # Face Recognition
    {"name": "Kairos", "url": "https://www.kairos.com/", "desc": "Face recognition, emotion analysis", "cat": "AI & ML"},
    {"name": "Skybiometry", "url": "https://www.skybiometry.com", "desc": "Face detection, emotional analysis, grouping", "cat": "AI & ML"},
    
    # File Storage
    {"name": "Amazon S3", "url": "https://aws.amazon.com/de/documentation/s3/", "desc": "Access to stored files, free for 12 months", "cat": "Storage"},
    {"name": "Cloudinary", "url": "http://cloudinary.com/documentation", "desc": "Image and video storage and manipulation", "cat": "Media"},
    {"name": "DigitalOcean Spaces", "url": "https://www.digitalocean.com/products/spaces", "desc": "Easy object storage with simple pricing", "cat": "Storage"},
    {"name": "Dropbox", "url": "https://www.dropbox.com/developers", "desc": "Access stored files and pictures", "cat": "Storage"},
    {"name": "Filestack", "url": "https://filestack.com/docs/", "desc": "Image and file manipulation", "cat": "Storage"},
    {"name": "Microsoft Graph OneDrive", "url": "https://graph.microsoft.io/en-us/docs/api-reference/v1.0/resources/onedrive", "desc": "Access stored files and photos", "cat": "Storage"},
    {"name": "PDF Blocks", "url": "https://www.pdfblocks.com/docs/api/getting-started", "desc": "API for working with PDF documents", "cat": "Document"},
    {"name": "SignNow", "url": "https://docs.signnow.com/docs/signnow/welcome", "desc": "Embed branded eSignature workflows", "cat": "Document"},
    {"name": "Smash", "url": "https://api.fromsmash.com/", "desc": "Upload large files on websites and apps", "cat": "Storage"},
    {"name": "Vector Express", "url": "https://github.com/smidyo/vectorexpress-api", "desc": "Convert, process and analyze vector files", "cat": "Document"},
    {"name": "Vertopal", "url": "https://www.vertopal.com/en/developer/api/introduction", "desc": "Convert files to various formats", "cat": "Document"},
    
    # Finance
    {"name": "Alpha Vantage", "url": "https://www.alphavantage.co/", "desc": "Stock, ETF, mutual fund, forex, crypto data", "cat": "Finance"},
    {"name": "Atom Finance", "url": "https://docs.atom.finance/", "desc": "Market, earnings and news data", "cat": "Finance"},
    {"name": "IEX", "url": "https://iextrading.com/developer/", "desc": "Free Stocks and Market Data", "cat": "Finance"},
    {"name": "Twelve Data", "url": "https://twelvedata.com/docs/", "desc": "Stock market data real-time and historical", "cat": "Finance"},
    {"name": "IBANAPI", "url": "https://ibanapi.com/get-api", "desc": "Validate IBAN number and get bank account", "cat": "Finance"},
    {"name": "Portfolio Optimizer", "url": "https://portfoliooptimizer.io/", "desc": "API for investment portfolio optimization", "cat": "Finance"},
    {"name": "Parqet Logo API", "url": "https://developers.parqet.com/docs/assets/logos", "desc": "Company Logo API for 400k+ stocks", "cat": "Finance"},
    
    # Fitness
    {"name": "FitBit", "url": "https://dev.fitbit.com/build/reference/", "desc": "Access data from Fitbit activity trackers", "cat": "Health & Fitness"},
    {"name": "HealthGraph", "url": "https://runkeeper.com/developer/healthgraph/registration-authorization", "desc": "RunKeeper Health Graph data", "cat": "Health & Fitness"},
    {"name": "Open Food Facts", "url": "https://en.wiki.openfoodfacts.org/API", "desc": "Database of food products with ingredients", "cat": "Health & Fitness"},
    {"name": "Strava", "url": "https://strava.github.io/api/", "desc": "Access data about athletes and activities", "cat": "Health & Fitness"},
    {"name": "VeganCheck", "url": "https://jokenetwork.de/vegancheck-api", "desc": "Product info based on EAN/UPC code", "cat": "Health & Fitness"},
    {"name": "Withings", "url": "http://oauth.withings.com/api", "desc": "Activity trackers and body measures", "cat": "Health & Fitness"},
    
    # Google
    {"name": "Gmail API", "url": "https://developers.google.com/gmail/api/", "desc": "The Gmail REST API", "cat": "Email"},
    {"name": "Google BigQuery", "url": "https://cloud.google.com/bigquery/docs/reference/rest/v2/", "desc": "Data platform for creating and managing data", "cat": "Data & Analytics"},
    {"name": "Google Books", "url": "https://developers.google.com/books/", "desc": "Search for books and manage library", "cat": "Content"},
    {"name": "Google Calendar", "url": "https://developers.google.com/google-apps/calendar/", "desc": "Manipulate events and calendar data", "cat": "Calendar"},
    {"name": "Google Classroom", "url": "https://developers.google.com/classroom/", "desc": "The Google Classroom API", "cat": "Education"},
    {"name": "Google Custom Search", "url": "https://developers.google.com/custom-search/json-api/v1/overview", "desc": "Search over websites or collection", "cat": "Search"},
    {"name": "Google Drive", "url": "https://developers.google.com/drive/v2/reference/", "desc": "Interact with Google Drive", "cat": "Storage"},
    {"name": "Google Fitness", "url": "https://developers.google.com/fit/", "desc": "The Google Fit API", "cat": "Health & Fitness"},
    {"name": "Google Fonts", "url": "https://developers.google.com/fonts/", "desc": "Add fonts to any web page", "cat": "Design"},
    {"name": "Google Genomics", "url": "https://cloud.google.com/genomics/reference/rest/", "desc": "Access to Genomics data", "cat": "Science"},
    {"name": "Google Identity Toolkit", "url": "https://developers.google.com/identity/", "desc": "Implement federated login", "cat": "Authentication"},
    {"name": "Google Monitoring", "url": "https://cloud.google.com/monitoring/api/v3/", "desc": "API for accessing Cloud monitoring data", "cat": "DevOps"},
    
    # Identity Verification
    {"name": "BlockScore", "url": "https://docs.blockscore.com/", "desc": "Real-time identity verification API", "cat": "Identity"},
    {"name": "Cognito", "url": "https://cognitohq.com/docs", "desc": "Powerful identity verification API", "cat": "Identity"},
    {"name": "Whitepages Pro", "url": "https://pro.whitepages.com/", "desc": "Global Identity Verification API", "cat": "Identity"},
    
    # Image Moderation
    {"name": "WebPurify", "url": "https://www.webpurify.com/image-moderation/", "desc": "Live image moderation by humans", "cat": "AI & ML"},
    
    # IoT
    {"name": "Ably", "url": "https://www.ably.com/documentation", "desc": "Cross-protocol real time communication", "cat": "IoT"},
    {"name": "Particle", "url": "https://docs.particle.io/reference/api/", "desc": "Manage Particle IoT devices", "cat": "IoT"},
    {"name": "PubNub", "url": "https://www.pubnub.com/docs", "desc": "Real-time applications with hardware devices", "cat": "IoT"},
    {"name": "Philips Hue", "url": "https://developers.meethue.com/documentation/getting-started", "desc": "Control Hue brand lights", "cat": "IoT"},
    {"name": "SmartThings", "url": "http://developer.smartthings.com/", "desc": "Samsung SmartThings Smart Home Hub", "cat": "IoT"},
    {"name": "Temboo SDK", "url": "https://temboo.com/download", "desc": "Layer on top of third-party APIs", "cat": "IoT"},
    {"name": "ThingSpeak", "url": "https://github.com/iobridge/ThingSpeak", "desc": "IoT application and API for storing data", "cat": "IoT"},
    {"name": "Xively", "url": "https://developer.xively.com/reference", "desc": "Connect hardware types to cloud service", "cat": "IoT"},
    {"name": "Zetta", "url": "https://github.com/zettajs/zetta/wiki", "desc": "Open source IoT platform on Node.js", "cat": "IoT"},
    
    # Legal
    {"name": "GitHub Licenses", "url": "https://developer.github.com/v3/licenses/", "desc": "GitHub licenses API", "cat": "Legal"},
    {"name": "ToSDR", "url": "https://tosdr.org/api.html", "desc": "Terms of Service API", "cat": "Legal"},
    
    # Login/Auth
    {"name": "Auth0", "url": "https://auth0.com", "desc": "Authenticate and authorize apps and APIs", "cat": "Authentication"},
    {"name": "Facebook Login", "url": "https://developers.facebook.com/docs/facebook-login", "desc": "Secure, fast login for apps/websites", "cat": "Authentication"},
    {"name": "Firebase Auth", "url": "https://firebase.google.com/docs/reference/", "desc": "Authentication, analytics, crash reporting", "cat": "Authentication"},
    {"name": "GitHub Authentication", "url": "https://developer.github.com/guides/basics-of-authentication/", "desc": "GitHub's Authentication API", "cat": "Authentication"},
    {"name": "Instagram Auth", "url": "https://developers.facebook.com/docs/instagram-api/overview", "desc": "Instagram's OAuth API", "cat": "Authentication"},
    {"name": "LinkedIn Auth", "url": "https://developer.linkedin.com/docs/signin-with-linkedin", "desc": "Sign in with professional identity", "cat": "Authentication"},
    {"name": "PayPal Login", "url": "https://developer.paypal.com/docs/integration/direct/identity/log-in-with-paypal/", "desc": "Sign in with PayPal credentials", "cat": "Authentication"},
    {"name": "Salesforce Auth", "url": "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_authentication.htm", "desc": "OAuth protocol for secure access", "cat": "Authentication"},
    {"name": "Twitter Sign-in", "url": "https://developer.twitter.com/en/docs/authentication/guides/log-in-with-twitter", "desc": "Works on websites, iOS, mobile, desktop", "cat": "Authentication"},
    {"name": "WorkOS", "url": "https://workos.com/docs", "desc": "Support Single Sign-On for Enterprise", "cat": "Authentication"},
    
    # Machine Learning
    {"name": "Amazon ML API", "url": "http://docs.aws.amazon.com/machine-learning/latest/APIReference/Welcome.html", "desc": "Simplifies predictions that require expertise", "cat": "AI & ML"},
    {"name": "AYLIEN", "url": "http://aylien.com/", "desc": "NLP, Information Retrieval, ML tools", "cat": "AI & ML"},
    {"name": "Big ML", "url": "http://bigml.com/api/", "desc": "ML API concentrating on decision trees", "cat": "AI & ML"},
    {"name": "Google Cloud ML", "url": "https://cloud.google.com/ml-engine/docs/", "desc": "Cloud-based machine learning", "cat": "AI & ML"},
    {"name": "Azure ML", "url": "https://azure.microsoft.com/en-us/services/cognitive-services/", "desc": "Azure Machine Learning API", "cat": "AI & ML"},
    {"name": "ObjectCut", "url": "https://objectcut.com", "desc": "Automatic background removal by AI", "cat": "AI & ML"},
    {"name": "OVHcloud AI Endpoints", "url": "https://endpoints.ai.cloud.ovh.net/", "desc": "Simplify GenAI and ML integration", "cat": "AI & ML"},
    {"name": "Unplugg", "url": "http://unplu.gg/test_api.html", "desc": "Automated Forecasting API for timeseries", "cat": "AI & ML"},
    
    # Maps
    {"name": "Amazon Maps", "url": "https://developer.amazon.com/maps", "desc": "Interactive 3D maps for Fire devices", "cat": "Location"},
    {"name": "Bing Maps", "url": "https://www.microsoft.com/maps/choose-your-bing-maps-API.aspx", "desc": "Multiple API options for maps", "cat": "Location"},
    {"name": "Cartes.io", "url": "https://github.com/M-Media-Group/Cartes.io/wiki/API", "desc": "Create maps and markers without auth", "cat": "Location"},
    {"name": "CartoDB", "url": "https://carto.com/developers/", "desc": "Generate maps based on hosted data", "cat": "Location"},
    {"name": "Google Maps", "url": "https://developers.google.com/maps/", "desc": "Google Maps APIs for Android, iOS, web", "cat": "Location"},
    {"name": "HERE Maps", "url": "https://developer.here.com/", "desc": "Range of APIs through JS, iOS, Android, REST", "cat": "Location"},
    {"name": "Leaflet.js", "url": "http://leafletjs.com/", "desc": "Open-source JS library for interactive maps", "cat": "Location"},
    {"name": "Mapbox", "url": "https://www.mapbox.com/developers/api/maps/", "desc": "Access to MapBox API", "cat": "Location"},
    {"name": "OpenStreetMap", "url": "http://wiki.openstreetmap.org/wiki/API", "desc": "API access to OSM", "cat": "Location"},
    {"name": "Scribble Maps", "url": "https://www.scribblemaps.com/api/", "desc": "Cross browser, mobile ready map builder", "cat": "Location"},
    {"name": "Yahoo Maps", "url": "https://developer.yahoo.com/maps/", "desc": "Embed rich and interactive maps", "cat": "Location"},
    {"name": "Yandex Maps", "url": "https://tech.yandex.com/maps/", "desc": "Install Yandex Maps on your web app", "cat": "Location"},
    
    # Math
    {"name": "Newton", "url": "https://newton.now.sh/", "desc": "API for Arithmetic and Symbolic Math", "cat": "Science"},
    
    # Medical
    {"name": "COVID-19 Data", "url": "https://github.com/M-Media-Group/Covid-19-API", "desc": "Live and historical Coronavirus data", "cat": "Health & Fitness"},
    {"name": "Infermedica", "url": "https://developer.infermedica.com/docs/introduction", "desc": "AI-based patient triage and diagnosis", "cat": "Health & Fitness"},
    
    # Movies
    {"name": "OMDB", "url": "https://www.omdbapi.com/", "desc": "Obtain movie information and metadata", "cat": "Entertainment"},
    {"name": "TMDb", "url": "https://www.themoviedb.org/documentation/api", "desc": "Powerful movie searches and discovery", "cat": "Entertainment"},
    {"name": "Trakt", "url": "https://trakt.docs.apiary.io/", "desc": "TV shows and movies everyone is watching", "cat": "Entertainment"},
    {"name": "TVmaze", "url": "https://www.tvmaze.com/api", "desc": "TV Show and web series database", "cat": "Entertainment"},
    
    # Music
    {"name": "AI Mastering", "url": "https://aimastering.com/api_docs/", "desc": "Automated audio mastering service", "cat": "Music"},
    {"name": "Deezer", "url": "http://developers.deezer.com/api", "desc": "Build apps for Deezer music catalogue", "cat": "Music"},
    {"name": "Discogs", "url": "https://www.discogs.com/developers/", "desc": "Database of artists, labels, releases", "cat": "Music"},
    {"name": "Last.fm", "url": "http://www.last.fm/api", "desc": "Build programs using Last.fm data", "cat": "Music"},
    {"name": "musicAPI", "url": "https://github.com/LIU9293/musicAPI", "desc": "Centralized API for top 3 China music providers", "cat": "Music"},
    {"name": "NPR API", "url": "https://dev.npr.org/", "desc": "Structured way to get NPR stories", "cat": "Music"},
    {"name": "Rhapsody", "url": "https://developer.rhapsody.com/", "desc": "Access metadata and user's library", "cat": "Music"},
    {"name": "SearchLy", "url": "https://github.com/AlbertSuarez/searchly", "desc": "Song similarity search based on lyrics", "cat": "Music"},
    {"name": "SoundCloud", "url": "https://developers.soundcloud.com", "desc": "Take sound on web to next level", "cat": "Music"},
    {"name": "Spotify", "url": "https://beta.developer.spotify.com/documentation/web-api", "desc": "Fetch data from Spotify music catalog", "cat": "Music"},
    {"name": "TheAudioDB", "url": "http://www.theaudiodb.com", "desc": "Free JSON API for music data and artwork", "cat": "Music"},
    {"name": "Setlist.fm", "url": "https://api.setlist.fm/docs/1.0/index.html", "desc": "Access to setlist data", "cat": "Music"},
    {"name": "TuneFind", "url": "http://www.tunefind.com/api", "desc": "Song, show, and movie data", "cat": "Music"},
    {"name": "Genius", "url": "https://docs.genius.com/", "desc": "Find details about artists and songs", "cat": "Music"},
    {"name": "Acoustid", "url": "https://acoustid.org/webservice", "desc": "Search fingerprint database", "cat": "Music"},
    {"name": "AudD", "url": "https://docs.audd.io/", "desc": "Recognize music in recordings", "cat": "Music"},
    {"name": "Gracenote", "url": "https://developer.gracenote.com/", "desc": "Largest music and video metadata source", "cat": "Music"},
    {"name": "ChartLyrics", "url": "http://www.chartlyrics.com/api.aspx", "desc": "Search for lyrics by artist and song", "cat": "Music"},
    {"name": "Lololyrics", "url": "http://api.lololyrics.com/", "desc": "Lyrics and metadata for songs", "cat": "Music"},
    {"name": "Musixmatch", "url": "https://developer.musixmatch.com/", "desc": "World's most authoritative lyrics DB", "cat": "Music"},
    {"name": "iTunes Search", "url": "https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/Searching.html", "desc": "Search iTunes Store content", "cat": "Music"},
    {"name": "Reverb", "url": "https://dev.reverb.com/", "desc": "Sell and buy music related merchandise", "cat": "E-commerce"},
    
    # News
    {"name": "Faroo", "url": "http://www.faroo.com/hp/api/api.html", "desc": "Search news within dates, fetch trending", "cat": "News"},
    {"name": "Mediastack", "url": "https://mediastack.com/documentation", "desc": "Scalable JSON API for worldwide news", "cat": "News"},
    {"name": "New York Times", "url": "http://developer.nytimes.com/", "desc": "Article search, best sellers, campaign finance", "cat": "News"},
    {"name": "NewsAPI", "url": "https://newsapi.org/", "desc": "70+ news sources and headlines", "cat": "News"},
    {"name": "NewsCatcher", "url": "https://newscatcherapi.com/news-api", "desc": "Find news by topic, country, language", "cat": "News"},
    {"name": "RSS API", "url": "https://docs.rssapi.net", "desc": "Parse and subscribe to RSS Feeds", "cat": "News"},
    {"name": "The Guardian", "url": "http://open-platform.theguardian.com/", "desc": "Access range of content from The Guardian", "cat": "News"},
    
    # NLP
    {"name": "Cloudmersive NLP", "url": "https://cloudmersive.com/nlp-api", "desc": "Language translation, sentiment analysis", "cat": "AI & ML"},
    {"name": "Cohere", "url": "https://docs.cohere.com/reference/about", "desc": "Text summarization, extraction, generation", "cat": "AI & ML"},
    {"name": "DialogFlow", "url": "https://dialogflow.com/", "desc": "Natural Language Interactions for Bots", "cat": "AI & ML"},
    {"name": "Datum Box", "url": "http://www.datumbox.com/machine-learning-api/", "desc": "Machine Learning Framework in Java", "cat": "AI & ML"},
    {"name": "Lemonfox.ai", "url": "https://www.lemonfox.ai/apis/speech-to-text", "desc": "Speech-to-text powered by Whisper", "cat": "AI & ML"},
    {"name": "LUIS AI", "url": "https://www.luis.ai/", "desc": "Language Understanding for applications", "cat": "AI & ML"},
    {"name": "MeaningCloud", "url": "https://www.meaningcloud.com", "desc": "Topic extraction, sentiment analysis, classification", "cat": "AI & ML"},
    {"name": "OpenAI API", "url": "https://platform.openai.com/docs/introduction", "desc": "Access to GPT-3 and Codex", "cat": "AI & ML"},
    {"name": "ParallelDots", "url": "https://www.paralleldots.com/text-analysis-apis", "desc": "Document classification and NLP APIs", "cat": "AI & ML"},
    {"name": "Shakespeare Translator", "url": "https://funtranslations.com/api/shakespeare", "desc": "Shakespeare English Translation API", "cat": "Language"},
    {"name": "SpeechText.AI", "url": "https://speechtext.ai/speech-recognition-api", "desc": "Cloud Speech Recognition API", "cat": "AI & ML"},
    {"name": "SummarizeBot", "url": "https://www.summarizebot.com/summarization_business.html", "desc": "AI web data extraction and analysis", "cat": "AI & ML"},
    {"name": "Semantria", "url": "https://www.lexalytics.com/", "desc": "SAAS API based on Lexalytics engine", "cat": "AI & ML"},
    {"name": "TextRazor", "url": "https://www.textrazor.com/plans", "desc": "Extract the Who, What, Why from text", "cat": "AI & ML"},
    {"name": "VoiceRSS", "url": "http://www.voicerss.org/", "desc": "Text to Speech supporting 15+ languages", "cat": "AI & ML"},
    {"name": "Wit AI", "url": "https://wit.ai/", "desc": "Intent-based NLP for chat bots", "cat": "AI & ML"},
    {"name": "Word Associations", "url": "https://wordassociations.net/en/api", "desc": "Get associations for words or phrases", "cat": "Language"},
    
    # Placeholder Images
    {"name": "DummyImage", "url": "https://dummyimage.com/", "desc": "Flexible placeholder images", "cat": "Design"},
    {"name": "Pixabay", "url": "https://pixabay.com/api/docs/", "desc": "Search free images and videos", "cat": "Media"},
    {"name": "SingleColorImage", "url": "https://singlecolorimage.com/api.html", "desc": "Generate single color images up to 5000x5000", "cat": "Design"},
    {"name": "Lorem Picsum", "url": "https://picsum.photos/", "desc": "Beautiful placeholders from Unsplash", "cat": "Design"},
    
    # Places
    {"name": "bng2latlong", "url": "https://www.getthedata.com/bng2latlong", "desc": "Convert OSGB36 to WGS84 coordinates", "cat": "Location"},
    {"name": "CountryAPI", "url": "https://fabian7593.github.io/CountryAPI/", "desc": "Get all countries with important info", "cat": "Location"},
    {"name": "Factual", "url": "https://developer.factual.com/docs/getting-started", "desc": "Places search by lat/long and full text", "cat": "Location"},
    {"name": "Foursquare Venue", "url": "https://developer.foursquare.com/overview/venues", "desc": "Places search by categories, coordinates", "cat": "Location"},
    {"name": "Nokia HERE", "url": "https://developer.here.com/develop/javascript-api", "desc": "JavaScript places search", "cat": "Location"},
    {"name": "World Wonders API", "url": "https://github.com/Rolv-Apneseth/world-wonders-api", "desc": "Famous wonders from around the world", "cat": "Location"},
    {"name": "Yelp", "url": "https://docs.developer.yelp.com/docs/getting-started", "desc": "Search location using coordinates or address", "cat": "Location"},
    
    # Product
    {"name": "Product Hunt", "url": "https://api.producthunt.com/v2/docs", "desc": "The best new products every day", "cat": "E-commerce"},
    
    # Quotes
    {"name": "Breaking Bad Quotes", "url": "https://breakingbadquotes.xyz", "desc": "Quotes from Breaking Bad", "cat": "Entertainment"},
    {"name": "FavQs", "url": "https://favqs.com/api", "desc": "Collect, discover, share favorite quotes", "cat": "Content"},
    {"name": "Forismatic", "url": "http://api.forismatic.com/api/1.0/", "desc": "Random quote per click", "cat": "Content"},
    {"name": "Hindi Quotes", "url": "https://hindi-quotes.vercel.app/", "desc": "Random Hindi quotes", "cat": "Content"},
    {"name": "Quotable", "url": "https://github.com/lukePeavey/quotable", "desc": "Fetch quotes by author, ID, tags", "cat": "Content"},
    {"name": "South Park Quotes", "url": "https://github.com/Thatskat/southpark-quotes-api", "desc": "Get and search South Park quotes", "cat": "Entertainment"},
    {"name": "They Said So", "url": "http://quotes.rest/qod.json", "desc": "Random quote per day", "cat": "Content"},
    
    # Retail
    {"name": "Amazon Product Advertising", "url": "http://docs.aws.amazon.com/AWSECommerceService/latest/DG/Welcome.html", "desc": "Items for sale, reviews, promotions", "cat": "E-commerce"},
    
    # Science
    {"name": "MPDS", "url": "https://developer.mpds.io", "desc": "Materials science data from publications", "cat": "Science"},
    {"name": "NASA", "url": "https://api.nasa.gov/index.html", "desc": "NASA data including imagery, asteroids", "cat": "Science"},
    {"name": "Open Science Framework", "url": "https://osf.io/y9jdt/wiki/home/", "desc": "Workflow/project management for research", "cat": "Science"},
    {"name": "Open Access Button", "url": "https://openaccessbutton.org/api", "desc": "Free, legal research articles", "cat": "Science"},
    {"name": "SHARE", "url": "http://share-research.readthedocs.io/en/latest/", "desc": "Scholarly research activity dataset", "cat": "Science"},
    
    # Screenshots
    {"name": "ApiFlash", "url": "https://apiflash.com/", "desc": "Chrome based screenshot API", "cat": "Utilities"},
    {"name": "SavePage.io", "url": "https://docs.savepage.io", "desc": "Screenshot any desktop or mobile website", "cat": "Utilities"},
    {"name": "ScreenshotAPI.net", "url": "https://screenshotapi.net", "desc": "Simple API to generate screenshots", "cat": "Utilities"},
    
    # Social Media
    {"name": "Ayrshare", "url": "https://docs.ayrshare.com", "desc": "Social media APIs for scheduling, analytics", "cat": "Social Media"},
    {"name": "Daily Motion", "url": "https://developer.dailymotion.com/", "desc": "Build apps centered around DailyMotion", "cat": "Social Media"},
    {"name": "DeviantArt", "url": "https://www.deviantart.com/developers/", "desc": "Largest social network for artists", "cat": "Social Media"},
    {"name": "EventBrite", "url": "https://github.com/eventbrite/eventbrite-sdk-python", "desc": "Python SDK for Eventbrite API", "cat": "Events"},
    {"name": "Facebook", "url": "https://developers.facebook.com/", "desc": "Ads, games, payments, login, sharing", "cat": "Social Media"},
    {"name": "Flickr", "url": "https://www.flickr.com/services/api/", "desc": "Search content, contacts, upload photos", "cat": "Media"},
    {"name": "Foursquare", "url": "https://developer.foursquare.com/", "desc": "Access Foursquare database and users", "cat": "Location"},
    {"name": "GoodReads", "url": "https://www.goodreads.com/api", "desc": "Access Goodreads data for books", "cat": "Content"},
    {"name": "Gravatar", "url": "https://en.gravatar.com/site/implement/", "desc": "Create profiles and avatars", "cat": "Social Media"},
    {"name": "Hacker News", "url": "https://github.com/HackerNews/API", "desc": "Anything good hackers find interesting", "cat": "News"},
    {"name": "Hacker News GraphQL", "url": "https://metamate.io/blog/most-advanced-hackernews-api/", "desc": "Convenient HackerNews GraphQL wrapper", "cat": "News"},
    {"name": "Imgur", "url": "https://api.imgur.com/", "desc": "Entire Imgur infrastructure via API", "cat": "Media"},
    {"name": "Instagram", "url": "https://www.instagram.com/developer/", "desc": "Search photos, view trends, make custom items", "cat": "Social Media"},
    {"name": "LinkedIn", "url": "https://developer.linkedin.com/", "desc": "Connect to accounts, data, communications", "cat": "Social Media"},
    {"name": "Mastodon", "url": "https://docs.joinmastodon.org/", "desc": "Access Mastodon APIs", "cat": "Social Media"},
    {"name": "Microlink", "url": "https://microlink.io", "desc": "Turn any link into information", "cat": "Utilities"},
    {"name": "Pinterest", "url": "https://www.pinterest.com/login/", "desc": "View most clicked or repinned Pins", "cat": "Social Media"},
    {"name": "Reddit", "url": "https://github.com/reddit/reddit/wiki/API", "desc": "Build clients, crawlers, scrapers", "cat": "Social Media"},
    {"name": "Snapchat", "url": "https://github.com/mgp25/SC-API", "desc": "PHP library of Snapchat private API", "cat": "Social Media"},
    {"name": "Telegram", "url": "https://core.telegram.org/", "desc": "Build customized Telegram clients", "cat": "Communication"},
    {"name": "TikTok", "url": "https://developers.tiktok.com/", "desc": "Display creator videos and profile info", "cat": "Social Media"},
    {"name": "Trash Nothing", "url": "https://trashnothing.com/developer", "desc": "Build on top of freecycling communities", "cat": "Social Media"},
    {"name": "Twitch", "url": "https://dev.twitch.tv/docs", "desc": "Develop using Twitch feature set", "cat": "Entertainment"},
    {"name": "Twitter", "url": "https://developer.twitter.com/", "desc": "Interact with Twitter functions", "cat": "Social Media"},
    {"name": "Tumblr", "url": "https://www.tumblr.com/docs/en/api/v2", "desc": "Access content, likes, followers, drafts", "cat": "Social Media"},
    {"name": "Vimeo", "url": "https://developer.vimeo.com/", "desc": "Access Vimeo API", "cat": "Media"},
    {"name": "Viber", "url": "https://developers.viber.com/docs/api/", "desc": "Create unique experiences for users", "cat": "Communication"},
    {"name": "VK", "url": "https://vk.com/dev", "desc": "Access VKontakte API", "cat": "Social Media"},
    {"name": "Weibo", "url": "http://open.weibo.com/wiki/API", "desc": "Access to China's microblogging site", "cat": "Social Media"},
    {"name": "WhatsApp", "url": "https://faq.whatsapp.com/en/iphone/23559013", "desc": "Share media using WhatsApp", "cat": "Communication"},
    {"name": "WordPress", "url": "https://codex.wordpress.org/WordPress_APIs", "desc": "Access WordPress API", "cat": "Content"},
    {"name": "Untappd", "url": "https://untappd.com/api/docs", "desc": "Socially share beers", "cat": "Social Media"},
    {"name": "YouTube", "url": "https://developers.google.com/youtube/", "desc": "Add YouTube functionality to sites", "cat": "Media"},
    {"name": "Zomato", "url": "https://developers.zomato.com/api", "desc": "Restaurant info for 1.5M+ restaurants", "cat": "Food & Beverage"},
    
    # Source Control
    {"name": "Bitbucket", "url": "https://developer.atlassian.com/bitbucket/api/2/reference/", "desc": "Access Bitbucket API", "cat": "DevOps"},
    {"name": "GitHub", "url": "https://developer.github.com/v3/", "desc": "Build real-world GitHub applications", "cat": "DevOps"},
    {"name": "GitHub Gists", "url": "https://developer.github.com/v3/gists/", "desc": "Access GitHub Gists API", "cat": "DevOps"},
    {"name": "GitLab", "url": "https://docs.gitlab.com/ce/api/README.html", "desc": "Access GitLab API", "cat": "DevOps"},
    {"name": "Mercurial", "url": "https://www.mercurial-scm.org/wiki/MercurialApi", "desc": "Access Mercurial API", "cat": "DevOps"},
    {"name": "SVN", "url": "https://subversion.apache.org/docs/api/1.8/", "desc": "Modular libraries in C", "cat": "DevOps"},
    {"name": "Team Foundation Server", "url": "https://docs.microsoft.com/en-us/azure/devops/integrate/", "desc": "REST, OAuth, JSON, service hooks", "cat": "DevOps"},
    
    # Sports
    {"name": "Ergast F1", "url": "http://ergast.com/mrd/", "desc": "Formula 1 race data from 1950 to today", "cat": "Sports"},
    {"name": "FIFA WWC 2019", "url": "https://worldcup.sfg.io/", "desc": "FIFA women's world cup 2019 data", "cat": "Sports"},
    {"name": "Football Prediction", "url": "https://boggio-analytics.com/fp-api/", "desc": "Predictions, odds, results, stats", "cat": "Sports"},
    {"name": "LIVE-SCORE API", "url": "https://live-score-api.com/documentation/reference/", "desc": "Football API for live-scores, fixtures", "cat": "Sports"},
    {"name": "NBA GraphQL", "url": "https://nbaapi.com/graphql/", "desc": "Current and historical NBA Stats", "cat": "Sports"},
    {"name": "NBA REST API", "url": "http://rest.nbaapi.com/index.html", "desc": "NBA Stats and Shot Chart API", "cat": "Sports"},
    {"name": "OpenF1", "url": "https://openf1.org/", "desc": "Real-time Formula 1 telemetry data", "cat": "Sports"},
    {"name": "OpenLigaDB", "url": "https://www.openligadb.de/", "desc": "Sports data especially football leagues", "cat": "Sports"},
    {"name": "Roanuz Cricket", "url": "https://www.cricketapi.com/v5/docs/", "desc": "Cricket scores and player info", "cat": "Sports"},
    {"name": "TheSportsDB", "url": "http://www.thesportsdb.com/", "desc": "Sports events, results, players, teams", "cat": "Sports"},
    
    # Test Data
    {"name": "Faker API", "url": "https://fakerapi.it", "desc": "Generate fake data for web developers", "cat": "Development Tools"},
    
    # Transportation
    {"name": "ADS-B Exchange", "url": "https://www.adsbexchange.com/data/", "desc": "Real-time aircraft data", "cat": "Transportation"},
    {"name": "AfterShip", "url": "https://www.aftership.com/docs/api/4/overview", "desc": "Multi-carrier shipment tracking APIs", "cat": "Transportation"},
    {"name": "CarsXE", "url": "https://api.carsxe.com/", "desc": "Millions of vehicle records, specs, values", "cat": "Transportation"},
    {"name": "Edmunds", "url": "http://developer.edmunds.com/", "desc": "Dataset containing all car makes", "cat": "Transportation"},
    {"name": "HyperTrack", "url": "https://docs.hypertrack.com", "desc": "Build applications that track movement", "cat": "Transportation"},
    {"name": "Lyft", "url": "https://www.lyft.com/developers", "desc": "ETAs, availability, price estimates", "cat": "Transportation"},
    {"name": "Postmen", "url": "https://docs.postmen.com/", "desc": "FedEx, UPS, DHL, USPS and 40+ carriers", "cat": "Transportation"},
    {"name": "Ola", "url": "https://developers.olacabs.com/", "desc": "Find, book, track Ola rides in India", "cat": "Transportation"},
    {"name": "Uber", "url": "https://developer.uber.com/", "desc": "Trip experiences, requesting rides, logistics", "cat": "Transportation"},
    
    # URL Shorteners
    {"name": "Bitly", "url": "http://dev.bitly.com/links.html", "desc": "Access Bitly API", "cat": "Utilities"},
    {"name": "GoTiny", "url": "https://github.com/robvanbakel/gotiny-api", "desc": "Lightweight URL shortener with JS SDK", "cat": "Utilities"},
    {"name": "Is.gd", "url": "https://is.gd/developers.php", "desc": "Simple URL shortener", "cat": "Utilities"},
    {"name": "ShrtURI", "url": "https://shrturi.com/docs", "desc": "URL shortening API", "cat": "Utilities"},
    {"name": "Tiny.cc", "url": "https://tiny.cc/api-docs", "desc": "Easy-to-use URL shortener", "cat": "Utilities"},
    {"name": "TinyUID", "url": "https://tinyuid.com/docs", "desc": "API for shortening long URLs", "cat": "Utilities"},
    {"name": "V.gd", "url": "https://v.gd/developers.php", "desc": "Simple URL shortener", "cat": "Utilities"},
    {"name": "Yourls", "url": "https://yourls.org/", "desc": "Generate short URLs with custom keywords", "cat": "Utilities"},
    
    # Videogames
    {"name": "Autochess VNG API", "url": "https://github.com/didadadida93/autochess-vng-api", "desc": "Data about Autochess VNG", "cat": "Gaming"},
    {"name": "CSGO API", "url": "https://bymykel.github.io/CSGO-API/", "desc": "Unofficial CS:GO API", "cat": "Gaming"},
    {"name": "Clash of Clans", "url": "https://developer.clashofclans.com/", "desc": "Info about players, clans, wars", "cat": "Gaming"},
    {"name": "Clash Royale", "url": "https://github.com/martincarrera/clash-royale-api", "desc": "Information about Clash Royale", "cat": "Gaming"},
    {"name": "FreeToGame", "url": "https://www.freetogame.com/api-doc", "desc": "Free-to-play games database API", "cat": "Gaming"},
    {"name": "GamerPower", "url": "https://www.gamerpower.com/api-read", "desc": "Best giveaways in gaming", "cat": "Gaming"},
    {"name": "GiantBomb", "url": "http://www.giantbomb.com/api/", "desc": "Query database for videogames, characters", "cat": "Gaming"},
    {"name": "Hyrule Compendium", "url": "http://github.com/gadhagod/Hyrule-Compendium-API", "desc": "Interactive items in Zelda BOTW", "cat": "Gaming"},
    {"name": "IGDB", "url": "https://www.igdb.com/api", "desc": "International Games Database", "cat": "Gaming"},
    {"name": "MMO Games", "url": "https://www.mmobomb.com/api", "desc": "MMO Games database, news, giveaways", "cat": "Gaming"},
    {"name": "RAWG", "url": "https://rawg.io/apidocs", "desc": "Open video game database", "cat": "Gaming"},
    {"name": "Riot Games", "url": "https://developer.riotgames.com/", "desc": "Riot Games game information API", "cat": "Gaming"},
    
    # Weather
    {"name": "AccuWeather", "url": "https://developer.accuweather.com/", "desc": "Hourly and minute by minute forecasts", "cat": "Weather"},
    {"name": "AerisWeather", "url": "https://www.aerisweather.com", "desc": "Global weather data and imagery APIs", "cat": "Weather"},
    {"name": "BlueSky API", "url": "https://blueskyapi.io/docs/api", "desc": "Global weather data with free tier", "cat": "Weather"},
    {"name": "Open-Meteo", "url": "https://open-meteo.com/en/docs", "desc": "Global weather forecast API, no key", "cat": "Weather"},
    {"name": "OpenWeather", "url": "http://openweathermap.org/api", "desc": "Current weather for 200,000+ cities", "cat": "Weather"},
    {"name": "Storm Glass Marine", "url": "https://stormglass.io", "desc": "Global marine weather from multiple sources", "cat": "Weather"},
    {"name": "Weather-API", "url": "https://github.com/robertoduessmann/weather-api", "desc": "Free RESTful weather API", "cat": "Weather"},
    {"name": "Weatherbit", "url": "https://www.weatherbit.io/api", "desc": "Forecasts, current, historical for any point", "cat": "Weather"},
    {"name": "Weather Source", "url": "http://weathersource.com/weather-api", "desc": "Powerful Weather API for speed and load", "cat": "Weather"},
    {"name": "Weatherstack", "url": "https://weatherstack.com/documentation", "desc": "Real-time and historical world weather", "cat": "Weather"},
    {"name": "Wunderground", "url": "https://www.wunderground.com/weather/api/", "desc": "Reliable data, global coverage in 80 languages", "cat": "Weather"},
    
    # Miscellaneous (extras)
    {"name": "Art Institute of Chicago", "url": "https://api.artic.edu/docs/", "desc": "Art Institute of Chicago public data", "cat": "Content"},
    {"name": "Bored API", "url": "https://www.boredapi.com/documentation", "desc": "Generate tasks to do when bored", "cat": "Entertainment"},
    {"name": "Bhagavad Gita", "url": "https://bhagavadgita.io/", "desc": "Bhagavad Gita in various languages", "cat": "Content"},
    {"name": "BrowserCat", "url": "https://www.browsercat.com/docs", "desc": "Headless browser API for automation", "cat": "Web Scraping"},
    {"name": "Bruzu", "url": "https://docs.bruzu.com", "desc": "Dynamically generate Images with URL", "cat": "Media"},
    {"name": "Callook.info", "url": "https://callook.info", "desc": "US ham radio callsign lookup", "cat": "Utilities"},
    {"name": "ChuckNorris.io", "url": "https://api.chucknorris.io", "desc": "Chuck Norris facts API", "cat": "Entertainment"},
    {"name": "Cloudflare Trace", "url": "https://www.cloudflare.com/cdn-cgi/trace", "desc": "Get IP, User Agent, Country Code", "cat": "Utilities"},
    {"name": "Cloudlayer.io", "url": "https://cloudlayer.io", "desc": "Generate PDFs and Images from websites", "cat": "Document"},
    {"name": "Codewars API", "url": "https://dev.codewars.com/", "desc": "Coding challenge statistics API", "cat": "Development Tools"},
    {"name": "Congress.gov API", "url": "https://api.congress.gov", "desc": "Machine-readable data from Congress.gov", "cat": "Government"},
    {"name": "Dataflow Kit", "url": "https://dataflowkit.com/doc-api", "desc": "Web Scraper API, SERP, PDF, screenshots", "cat": "Web Scraping"},
    {"name": "Data Science Toolkit", "url": "https://github.com/petewarden/dstk", "desc": "Best open data sets for data science", "cat": "Data & Analytics"},
    {"name": "Don't Kill My App", "url": "https://github.com/urbandroid-team/dont-kill-my-app", "desc": "Mobile vendor background activity database", "cat": "Development Tools"},
    {"name": "Domainsdb.info", "url": "https://domainsdb.info", "desc": "Registered domain names search", "cat": "Utilities"},
    {"name": "Evil Insult Generator", "url": "https://evilinsult.com/api/", "desc": "Most evil insults API", "cat": "Entertainment"},
    {"name": "Flowdash", "url": "https://docs.flowdash.com/docs/api-introduction", "desc": "Create, edit, delete workflow data", "cat": "Automation"},
    {"name": "Game of Thrones Quotes", "url": "https://gameofthronesquotes.xyz", "desc": "Game of Thrones quotes API", "cat": "Entertainment"},
    {"name": "Geocodify", "url": "https://geocodify.com", "desc": "Worldwide geocoding, geoparsing, autocomplete", "cat": "Location"},
    {"name": "Giphy", "url": "https://developers.giphy.com/docs/", "desc": "World's largest GIF library", "cat": "Media"},
    {"name": "Httpbin", "url": "https://httpbin.org/", "desc": "Simple HTTP Request and Response Service", "cat": "Development Tools"},
    {"name": "Icanhazepoch", "url": "https://icanhazepoch.com", "desc": "Get Epoch time", "cat": "Utilities"},
    {"name": "Icanhazip", "url": "https://major.io/icanhazip-com-faq/", "desc": "IP Address API", "cat": "Utilities"},
    {"name": "Image-Charts", "url": "https://www.image-charts.com", "desc": "1 URL = 1 Chart image", "cat": "Data & Analytics"},
    {"name": "Jobicy", "url": "https://jobicy.com/jobs-rss-feed", "desc": "Remote job listings RSS feed", "cat": "Jobs"},
    {"name": "JSONbin.io", "url": "https://jsonbin.io/api-reference", "desc": "Free JSON data storage service", "cat": "Storage"},
    {"name": "Judge0", "url": "https://api.judge0.com/", "desc": "Compile and run source code", "cat": "Development Tools"},
    {"name": "Labs64 NetLicensing", "url": "https://netlicensing.io/wiki/restful-api", "desc": "Innovative License Management Solution", "cat": "E-commerce"},
    {"name": "LaunchLibrary", "url": "https://launchlibrary.net/docs/1.3/api.html", "desc": "Aggregated info about space launches", "cat": "Science"},
    {"name": "LetsValidate", "url": "https://github.com/letsvalidate/api", "desc": "Technologies used on websites, thumbnails", "cat": "Web Scraping"},
    {"name": "LinkPreview", "url": "https://www.linkpreview.net", "desc": "RESTful API for URL previews", "cat": "Web Scraping"},
    {"name": "LiveChat", "url": "https://developers.livechatinc.com/", "desc": "Online Customer Service software", "cat": "Communication"},
    {"name": "Lottery Number Generation", "url": "https://fungenerators.com/api/lottery/", "desc": "Generate lottery numbers", "cat": "Entertainment"},
    {"name": "NetworkCalc", "url": "https://networkcalc.com/api/docs", "desc": "Network calculator tools APIs", "cat": "Utilities"},
    {"name": "PDFmyURL", "url": "https://pdfmyurl.com/html-to-pdf-api", "desc": "Convert web pages to PDF", "cat": "Document"},
    {"name": "PDF from URL", "url": "https://api.stakdek.de/blog", "desc": "Convert websites to PDF for free", "cat": "Document"},
    {"name": "Pastebin", "url": "https://pastebin.com/doc_scraping_api", "desc": "Share text or code with syntax highlighting", "cat": "Development Tools"},
    {"name": "PhantAuth", "url": "https://www.phantauth.net/", "desc": "Random User Generator + OpenID Connect", "cat": "Authentication"},
    {"name": "QuickChart", "url": "https://quickchart.io", "desc": "Generate Chart.js image charts", "cat": "Data & Analytics"},
    {"name": "Quran API", "url": "https://alquran.cloud/api", "desc": "RESTful Quran API for Ayah, Surah", "cat": "Content"},
    {"name": "Quran-api", "url": "https://github.com/fawazahmed0/quran-api", "desc": "Free Quran API with 100+ languages", "cat": "Content"},
    {"name": "Rocketium Video", "url": "https://rocketium.com/api/", "desc": "Create Buzzfeed-like videos programmatically", "cat": "Media"},
    {"name": "Scraper API", "url": "https://www.scraperapi.com", "desc": "Handles proxies, browsers, CAPTCHAs", "cat": "Web Scraping"},
    {"name": "SearchApi", "url": "https://www.searchapi.io/", "desc": "Real-time API for scraping search engines", "cat": "Web Scraping"},
    {"name": "Shadify", "url": "https://github.com/cheatsnake/shadify", "desc": "Generate data for games and puzzles", "cat": "Entertainment"},
    {"name": "Shotstack Video", "url": "https://shotstack.io/docs/guide/getting-started/core-concepts/", "desc": "Video automation workflows", "cat": "Media"},
    {"name": "Spreaker", "url": "https://developers.spreaker.com/", "desc": "Read and write data to Spreaker", "cat": "Music"},
    {"name": "SSL-Checker", "url": "https://ssl-checker.io/", "desc": "Collect SSL/TLS information from hosts", "cat": "Security"},
    {"name": "StackExchange", "url": "https://api.stackexchange.com/", "desc": "RESTful services for StackExchange sites", "cat": "Development Tools"},
    {"name": "RestCountries", "url": "https://restcountries.eu", "desc": "Get country information via REST", "cat": "Location"},
    {"name": "Typeform", "url": "https://developer.typeform.com/", "desc": "Create and edit Typeform surveys", "cat": "Survey"},
    {"name": "Wallhaven", "url": "https://wallhaven.cc/help/api", "desc": "Huge wallpaper library", "cat": "Media"},
    {"name": "Who Hosts This", "url": "https://www.who-hosts-this.com/API", "desc": "Detect hosting provider of websites", "cat": "Utilities"},
    {"name": "WolframAlpha", "url": "http://products.wolframalpha.com/api/", "desc": "Integrate computational knowledge", "cat": "AI & ML"},
    
    # Abstract/Resources for APIs
    {"name": "Abstract APIs", "url": "https://www.abstractapi.com", "desc": "Suite of utility APIs", "cat": "Utilities"},
    {"name": "Apiary", "url": "https://apiary.io/", "desc": "Collaborative tool to design APIs", "cat": "Development Tools"},
    {"name": "OpenAPI", "url": "https://www.openapis.org", "desc": "Standard interface to REST APIs", "cat": "Development Tools"},
    {"name": "Swagger", "url": "http://swagger.io/", "desc": "Tools for designing, building RESTful APIs", "cat": "Development Tools"},
]

def main():
    print("="*60)
    print("APIClaw Night Expansion - 2026-02-24 02:00")
    print("="*60)
    
    # Load existing registry
    with open(REGISTRY_PATH, 'r') as f:
        registry = json.load(f)
    
    existing_ids = {api['id'] for api in registry['apis']}
    existing_names = {api['name'].lower() for api in registry['apis']}
    initial_count = len(registry['apis'])
    
    print(f"Current registry: {initial_count} APIs")
    print(f"Processing {len(PARSED_APIS)} APIs from n0shake/Public-APIs...")
    
    added = 0
    skipped = 0
    
    for entry in PARSED_APIS:
        # Generate ID
        api_id = entry['name'].lower().replace(' ', '-').replace('.', '-').replace('_', '-')
        api_id = re.sub(r'[^a-z0-9-]', '', api_id)
        api_id = re.sub(r'-+', '-', api_id).strip('-')
        
        # Skip if already exists
        if api_id in existing_ids or entry['name'].lower() in existing_names:
            skipped += 1
            continue
        
        # Create API entry
        api_entry = {
            "id": api_id,
            "name": entry['name'],
            "description": entry.get('desc', f"{entry['name']} API"),
            "category": entry.get('cat', 'Other'),
            "auth": "apikey",
            "https": True,
            "cors": "unknown",
            "link": entry.get('url', ''),
            "pricing": "unknown",
            "keywords": extract_keywords(entry['name'], entry.get('desc', ''), entry.get('cat', ''))
        }
        
        registry['apis'].append(api_entry)
        existing_ids.add(api_id)
        existing_names.add(entry['name'].lower())
        added += 1
    
    # Update metadata
    registry['count'] = len(registry['apis'])
    registry['lastUpdated'] = datetime.now().isoformat()
    registry['version'] = "3.2.2"
    
    # Save registry
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(registry, f, indent=2)
    
    final_count = len(registry['apis'])
    
    print(f"\nResults:")
    print(f"  Added: {added}")
    print(f"  Skipped (duplicates): {skipped}")
    print(f"  Total APIs: {initial_count} → {final_count}")
    print(f"\nRegistry updated!")

if __name__ == "__main__":
    main()
