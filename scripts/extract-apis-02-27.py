#!/usr/bin/env python3
"""Extract APIs from awesome-apis markdown and add to APIClaw"""
import json
import re
import os

# Existing APIs for dedup
existing_file = os.path.expanduser("~/Projects/apiclaw/data/combined-02-26.json")
with open(existing_file) as f:
    existing = json.load(f)
    
existing_names = {api["name"].lower() for api in existing}
existing_urls = {api.get("baseUrl", "").lower() for api in existing}

new_apis = []

# Category mapping
categories = {
    "advertising": "Advertising",
    "analytics": "Analytics",
    "animals": "Animals",
    "anime": "Entertainment",
    "anti-malware": "Security",
    "art": "Design",
    "design": "Design",
    "authentication": "Authentication",
    "authorization": "Authentication",
    "barcode": "Utilities",
    "big data": "Data",
    "blockchain": "Blockchain",
    "books": "Books",
    "business": "Business",
    "calendar": "Calendar",
    "captcha": "Security",
    "check-in": "Location",
    "commerce": "Commerce",
    "communication": "Communication",
    "content": "Content",
    "cryptocurrency": "Cryptocurrency",
    "currency": "Finance",
    "data validation": "Validation",
    "development": "Development",
    "dictionary": "Reference",
    "dictionaries": "Reference",
    "documents": "Documents",
    "email": "Email",
    "entertainment": "Entertainment",
    "environment": "Environment",
    "events": "Events",
    "face recognition": "AI",
    "file storage": "Storage",
    "finance": "Finance",
    "fitness": "Health",
    "food": "Food",
    "games": "Games",
    "geocoding": "Geolocation",
    "government": "Government",
    "health": "Health",
    "identity": "Identity",
    "image": "Images",
    "iot": "IoT",
    "jobs": "Jobs",
    "legal": "Legal",
    "login": "Authentication",
    "machine learning": "AI",
    "maps": "Maps",
    "math": "Science",
    "medical": "Health",
    "miscellaneous": "Utilities",
    "movies": "Entertainment",
    "music": "Music",
    "natural language": "AI",
    "news": "News",
    "open data": "Data",
    "open source": "Development",
    "patent": "Legal",
    "personality": "Utilities",
    "phone": "Communication",
    "photography": "Images",
    "placeholder images": "Images",
    "places": "Location",
    "product": "Commerce",
    "programming": "Development",
    "quotes": "Content",
    "science": "Science",
    "screenshots": "Utilities",
    "security": "Security",
    "shopping": "Commerce",
    "social": "Social",
    "social media": "Social",
    "source control": "Development",
    "sport": "Sports",
    "sports": "Sports",
    "test data": "Testing",
    "text analysis": "AI",
    "tracking": "Analytics",
    "transportation": "Transportation",
    "url shorteners": "Utilities",
    "vehicle": "Transportation",
    "video": "Video",
    "videogames": "Games",
    "weather": "Weather",
    "google": "Google",
    "augmented reality": "AR/VR",
}

def get_category(cat_name):
    cat_lower = cat_name.lower()
    for key, val in categories.items():
        if key in cat_lower:
            return val
    return "Utilities"

def parse_auth(auth_str):
    auth_lower = auth_str.lower()
    if "oauth" in auth_lower:
        return "oauth"
    elif "apikey" in auth_lower or "api key" in auth_lower:
        return "apiKey"
    elif "no" in auth_lower:
        return "none"
    return "unknown"

# Parse markdown table rows
# Format: | [Name](url) | Description | Auth | HTTPS | CORS |
# Or: | [**Name**](url) | Description | Open/Trial |

markdown_apis = [
    # Advertising
    {"name": "Amazon Mobile Ads", "description": "Monetize across platforms with multiple ad formats", "category": "Advertising", "authType": "apiKey", "baseUrl": "https://developer.amazon.com/mobile-ads"},
    {"name": "Facebook Marketing API", "description": "Manage ads and campaigns using the Facebook API", "category": "Advertising", "authType": "oauth", "baseUrl": "https://developers.facebook.com/docs/marketing-apis"},
    {"name": "Google AdSense", "description": "Free, flexible way to earn money from websites", "category": "Advertising", "authType": "apiKey", "baseUrl": "https://developers.google.com/adsense/"},
    {"name": "Google AdWords API", "description": "Manage Google AdWords campaigns programmatically", "category": "Advertising", "authType": "apiKey", "baseUrl": "https://developers.google.com/adwords/api/"},
    {"name": "Kevel Ad APIs", "description": "Build your own ad server with Kevel's ad APIs", "category": "Advertising", "authType": "apiKey", "baseUrl": "https://dev.kevel.co"},
    {"name": "Microsoft Bing Ads API", "description": "Programmatic access to advertising technologies", "category": "Advertising", "authType": "apiKey", "baseUrl": "https://learn.microsoft.com/en-us/advertising/"},
    
    # Analytics
    {"name": "Amazon Mobile Analytics", "description": "Service for collecting and visualizing app usage data", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://aws.amazon.com/mobileanalytics/"},
    {"name": "Clicky", "description": "Extract website traffic data in multiple formats", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://clicky.com/help/api"},
    {"name": "DitchCarbon API", "description": "Company and product carbon emissions disclosures", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://docs.ditchcarbon.com/"},
    {"name": "Matomo Analytics", "description": "All-in-one premium web analytics platform", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://matomo.org/docs/analytics-api/"},
    {"name": "MixPanel", "description": "Analytics for mobile and web applications", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://developer.mixpanel.com/"},
    {"name": "Open Web Analytics", "description": "Work with your data outside the OWA interface", "category": "Analytics", "authType": "none", "baseUrl": "https://github.com/padams/Open-Web-Analytics"},
    {"name": "Ticksel", "description": "Friendly website analytics made for humans", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://ticksel.com"},
    {"name": "Woopra", "description": "Real-time website analysis for customer engagement", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://www.woopra.com/docs/"},
    {"name": "Zoho Reports API", "description": "Build reporting and analytical capabilities", "category": "Analytics", "authType": "apiKey", "baseUrl": "https://www.zoho.com/analytics/"},
    
    # AR/VR
    {"name": "Vuforia", "description": "Solid AR SDK with robust development options", "category": "AR/VR", "authType": "apiKey", "baseUrl": "https://library.vuforia.com/"},
    {"name": "Wikitude", "description": "All-in-one AR solution with image recognition", "category": "AR/VR", "authType": "apiKey", "baseUrl": "https://www.wikitude.com/"},
    
    # Barcode/QR
    {"name": "Dynamic QR Code", "description": "Generate dynamic and static QR Codes", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://rapidapi.com/updeploy-tools/api/qr-code-dynamic-and-static1/"},
    {"name": "Google Barcode", "description": "Detect barcodes in real-time on device", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://developers.google.com/ml-kit/vision/barcode-scanning"},
    {"name": "EAN-Search", "description": "Lookup products by EAN, UPC or GTIN barcode", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://www.ean-search.org/"},
    {"name": "QR Code API FunGenerators", "description": "Create QR code images or read existing images", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://fungenerators.com/api/qrcode/"},
    {"name": "OpenQR Generator API", "description": "Static and Dynamic QR code generator", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://docs.openqr.io/"},
    
    # Cryptocurrency
    {"name": "Bitcoin Developer", "description": "Resources and reference material for Bitcoin developers", "category": "Cryptocurrency", "authType": "none", "baseUrl": "https://developer.bitcoin.org/"},
    {"name": "Bitcoincharts", "description": "Bitcoin markets data for websites and apps", "category": "Cryptocurrency", "authType": "none", "baseUrl": "https://bitcoincharts.com/about/markets-api/"},
    {"name": "BitPay", "description": "Simple RESTful API for Bitcoin infrastructure", "category": "Cryptocurrency", "authType": "apiKey", "baseUrl": "https://bitpay.com/developers"},
    {"name": "Block.io", "description": "Versatile and secure wallet for all coins", "category": "Cryptocurrency", "authType": "apiKey", "baseUrl": "https://block.io/"},
    {"name": "BlockCypher", "description": "Infrastructure fabric for blockchain applications", "category": "Cryptocurrency", "authType": "apiKey", "baseUrl": "https://www.blockcypher.com/"},
    {"name": "BlockFacts.io", "description": "Digital asset data with REST and WebSocket support", "category": "Cryptocurrency", "authType": "apiKey", "baseUrl": "https://blockfacts.io/"},
    {"name": "CoinDesk", "description": "Bitcoin Price Index API", "category": "Cryptocurrency", "authType": "none", "baseUrl": "https://www.coindesk.com/"},
    {"name": "CoinGecko", "description": "Free cryptocurrency API without API key", "category": "Cryptocurrency", "authType": "none", "baseUrl": "https://www.coingecko.com/en/api"},
    {"name": "Coinlore", "description": "Cryptocurrency tick data API", "category": "Cryptocurrency", "authType": "none", "baseUrl": "https://www.coinlore.com/cryptocurrency-data-api"},
    {"name": "CoinPaprika", "description": "Cryptocurrency prices, market cap and volume", "category": "Cryptocurrency", "authType": "none", "baseUrl": "https://api.coinpaprika.com"},
    {"name": "CryptoCompare", "description": "Cryptocurrencies comparison and data", "category": "Cryptocurrency", "authType": "none", "baseUrl": "https://www.cryptocompare.com/api"},
    {"name": "Cryptonator", "description": "Cryptocurrencies exchange rates", "category": "Cryptocurrency", "authType": "none", "baseUrl": "https://www.cryptonator.com/api/"},
    {"name": "Coinigy", "description": "Interact with exchange accounts directly", "category": "Cryptocurrency", "authType": "apiKey", "baseUrl": "https://coinigy.docs.apiary.io"},
    {"name": "Covalent", "description": "Multi-blockchain data aggregator API", "category": "Cryptocurrency", "authType": "apiKey", "baseUrl": "https://www.covalenthq.com/docs/api/"},
    {"name": "PENDAX SDK", "description": "SDK for Trading on FTX, OKX, Bybit and more", "category": "Cryptocurrency", "authType": "apiKey", "baseUrl": "https://github.com/CompendiumFi/PENDAX-SDK"},
    {"name": "Poloniex", "description": "US based digital asset exchange", "category": "Cryptocurrency", "authType": "apiKey", "baseUrl": "https://poloniex.com/support/api/"},
    {"name": "ShapeShift", "description": "Exchange between cryptocurrencies without account", "category": "Cryptocurrency", "authType": "none", "baseUrl": "https://shapeshift.io/"},
    {"name": "Technical Analysis API", "description": "Cryptocurrency prices and sentiment detection", "category": "Cryptocurrency", "authType": "apiKey", "baseUrl": "https://technical-analysis-api.com"},
    
    # Calendar
    {"name": "CalendarIndex", "description": "Worldwide Holidays and Working Days API", "category": "Calendar", "authType": "apiKey", "baseUrl": "https://www.calendarindex.com"},
    {"name": "DigiDates API", "description": "REST API for date and time calculations", "category": "Calendar", "authType": "none", "baseUrl": "https://digidates.de/en/"},
    {"name": "Holiday API", "description": "Public holiday API for several countries", "category": "Calendar", "authType": "apiKey", "baseUrl": "https://holidayapi.pl/"},
    {"name": "OpenHolidays API", "description": "Public and school holidays for European countries", "category": "Calendar", "authType": "none", "baseUrl": "https://www.openholidaysapi.org/"},
    
    # Captcha
    {"name": "Anti-Captcha", "description": "Access to Anti-Captcha's solving service", "category": "Security", "authType": "apiKey", "baseUrl": "https://anti-captcha.com/apidoc"},
    {"name": "ProxyCrawl", "description": "Crawl websites without proxies, solve captchas", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://proxycrawl.com"},
    {"name": "Google reCAPTCHA", "description": "Protect web pages against spam and abuse", "category": "Security", "authType": "apiKey", "baseUrl": "https://developers.google.com/recaptcha/"},
    
    # Commerce
    {"name": "Commerce Layer", "description": "Headless commerce platform for global ecommerce", "category": "Commerce", "authType": "apiKey", "baseUrl": "https://docs.commercelayer.io/api/"},
    {"name": "Envoice", "description": "Invoicing for online businesses", "category": "Commerce", "authType": "apiKey", "baseUrl": "https://www.envoice.in/"},
    {"name": "Koomalooma", "description": "Loyalty BPaaS for mobile and web companies", "category": "Commerce", "authType": "apiKey", "baseUrl": "https://business.koomalooma.com"},
    {"name": "Moltin", "description": "Unified APIs for inventory, carts and payments", "category": "Commerce", "authType": "apiKey", "baseUrl": "https://www.elasticpath.com/"},
    {"name": "Repetiti", "description": "3D Printer Management Service API", "category": "IoT", "authType": "apiKey", "baseUrl": "https://developers.repetiti.com"},
    {"name": "Braintree", "description": "Mobile and web payment systems for ecommerce", "category": "Commerce", "authType": "apiKey", "baseUrl": "https://developers.braintreepayments.com"},
    {"name": "Yellow Pages API", "description": "Business data for any city in the US", "category": "Business", "authType": "none", "baseUrl": "https://github.com/Hrushi11/Yellow-Pages-End-API"},
    
    # Communication
    {"name": "Africa's Talking", "description": "Access African telco services through HTTP API", "category": "Communication", "authType": "apiKey", "baseUrl": "https://africastalking.com/"},
    {"name": "iP1sms", "description": "Send and receive SMS messages worldwide", "category": "Communication", "authType": "apiKey", "baseUrl": "https://www.ip1sms.com/en/developer/"},
    {"name": "Eqivo", "description": "Telephony/Programmable-Voice API platform", "category": "Communication", "authType": "apiKey", "baseUrl": "https://eqivo.org"},
    {"name": "MailGun", "description": "Transactional Email API for developers", "category": "Email", "authType": "apiKey", "baseUrl": "https://mailgun.com"},
    {"name": "Nexmo", "description": "Phone calls and SMS worldwide", "category": "Communication", "authType": "apiKey", "baseUrl": "https://developer.vonage.com"},
    {"name": "Sakari", "description": "Send and Receive SMS to 200+ countries", "category": "Communication", "authType": "apiKey", "baseUrl": "https://developer.sakari.io"},
    {"name": "Telnyx", "description": "Build Voice, SMS, Fax and IoT applications", "category": "Communication", "authType": "apiKey", "baseUrl": "https://developers.telnyx.com/"},
    {"name": "The SMS Works", "description": "Low-cost reliable SMS API for developers", "category": "Communication", "authType": "apiKey", "baseUrl": "https://thesmsworks.co.uk/sms-api"},
    
    # Content
    {"name": "Bible API wldeh", "description": "Support for 200+ Bible translations", "category": "Books", "authType": "none", "baseUrl": "https://github.com/wldeh/bible-api"},
    {"name": "Bible API", "description": "JSON API for public domain Bible translations", "category": "Books", "authType": "none", "baseUrl": "https://bible-api.com/"},
    {"name": "Fruits API", "description": "GraphQL API with fruit tree information", "category": "Food", "authType": "none", "baseUrl": "https://github.com/Franqsanz/fruits-api"},
    {"name": "Jokes One API", "description": "Full featured Jokes API", "category": "Entertainment", "authType": "apiKey", "baseUrl": "https://jokes.one/api/joke/"},
    {"name": "Perfect Tense API", "description": "AI spelling and grammar checking API", "category": "AI", "authType": "apiKey", "baseUrl": "https://www.perfecttense.com/"},
    {"name": "Random Data Generator", "description": "API for phones, text, passwords, names, SSN", "category": "Testing", "authType": "apiKey", "baseUrl": "https://randommer.io/randommer-api"},
    {"name": "Random Facts API", "description": "Random Facts API", "category": "Content", "authType": "apiKey", "baseUrl": "https://fungenerators.com/api/facts/"},
    {"name": "SLF German Database", "description": "German city, country, river database", "category": "Data", "authType": "none", "baseUrl": "https://github.com/slftool/slftool.github.io"},
    {"name": "Today in History", "description": "Daily historical events, births and deaths", "category": "Content", "authType": "none", "baseUrl": "https://history.muffinlabs.com/"},
    {"name": "Wikipedia API", "description": "Free multilingual Encyclopedia API", "category": "Content", "authType": "none", "baseUrl": "https://en.wikipedia.org/w/api.php"},
    
    # Currency
    {"name": "1Forge Currency", "description": "Real-time forex and crypto quotes", "category": "Finance", "authType": "apiKey", "baseUrl": "https://1forge.com/"},
    {"name": "Currency-api", "description": "Free currency rates with 150+ currencies", "category": "Finance", "authType": "none", "baseUrl": "https://github.com/fawazahmed0/currency-api"},
    {"name": "CurrencyLayer", "description": "Exchange rates and currency conversion", "category": "Finance", "authType": "apiKey", "baseUrl": "https://currencylayer.com/"},
    {"name": "CurrencyScoop", "description": "Real-time and historical currency rates JSON API", "category": "Finance", "authType": "apiKey", "baseUrl": "https://currencyscoop.com/"},
    {"name": "ECB Exchange Rates", "description": "Free currency rates from European Central Bank", "category": "Finance", "authType": "none", "baseUrl": "https://www.ecb.europa.eu/stats/"},
    {"name": "ExchangeRate-API", "description": "Currency conversion API", "category": "Finance", "authType": "apiKey", "baseUrl": "https://www.exchangerate-api.com/"},
    {"name": "ExchangeRatesAPI.io", "description": "Foreign exchange rates with conversion", "category": "Finance", "authType": "apiKey", "baseUrl": "https://exchangeratesapi.io/"},
    {"name": "Fixer.io", "description": "JSON API for foreign exchange rates", "category": "Finance", "authType": "apiKey", "baseUrl": "https://fixer.io/"},
    {"name": "Frankfurter", "description": "Exchange rates and currency data API", "category": "Finance", "authType": "none", "baseUrl": "https://www.frankfurter.app/"},
    {"name": "OpenRates", "description": "Live exchange rates and currency conversion", "category": "Finance", "authType": "none", "baseUrl": "https://openrates.io/"},
    
    # Design
    {"name": "Dribbble", "description": "Community of designers sharing work", "category": "Design", "authType": "oauth", "baseUrl": "https://developer.dribbble.com/"},
    {"name": "Icon Horse", "description": "Get favicon logo for any web address", "category": "Design", "authType": "none", "baseUrl": "https://icon.horse/"},
    {"name": "Pexels", "description": "High quality free stock photos CC0 licensed", "category": "Images", "authType": "apiKey", "baseUrl": "https://www.pexels.com/api/"},
    {"name": "PHP-Noise", "description": "Noise background image generator API", "category": "Images", "authType": "none", "baseUrl": "https://php-noise.com/"},
    
    # Dictionary
    {"name": "Agarathi", "description": "Tamil language Dictionary API", "category": "Reference", "authType": "apiKey", "baseUrl": "https://agarathi.com/api/dictionary"},
    {"name": "Cambridge Dictionaries", "description": "Access to Cambridge dictionary data", "category": "Reference", "authType": "apiKey", "baseUrl": "https://dictionary.cambridge.org/"},
    {"name": "Datamuse API", "description": "Word-finding query engine", "category": "Reference", "authType": "none", "baseUrl": "https://www.datamuse.com/api/"},
    {"name": "Free Dictionary API", "description": "Get word definitions for free", "category": "Reference", "authType": "none", "baseUrl": "https://dictionaryapi.dev/"},
    {"name": "Lingua Robot", "description": "Definitions, pronunciations, synonyms", "category": "Reference", "authType": "apiKey", "baseUrl": "https://www.linguarobot.io/"},
    {"name": "Merriam-Webster API", "description": "Dictionary and thesaurus content", "category": "Reference", "authType": "apiKey", "baseUrl": "https://dictionaryapi.com/"},
    {"name": "Oxford Dictionary API", "description": "Access to Oxford Dictionary services", "category": "Reference", "authType": "apiKey", "baseUrl": "https://developer.oxforddictionaries.com/"},
    {"name": "Wordnik", "description": "Dictionary functions API", "category": "Reference", "authType": "apiKey", "baseUrl": "https://developer.wordnik.com/"},
    {"name": "Words API", "description": "Find definitions for 150,000+ words", "category": "Reference", "authType": "apiKey", "baseUrl": "https://www.wordsapi.com/"},
    {"name": "Wiktionary API", "description": "Free multilingual dictionary", "category": "Reference", "authType": "none", "baseUrl": "https://en.wiktionary.org/w/api.php"},
    
    # Entertainment
    {"name": "AniList", "description": "Anime discovery and tracking with GraphQL", "category": "Entertainment", "authType": "oauth", "baseUrl": "https://anilist.gitbook.io/"},
    {"name": "Bob's Burgers API", "description": "Data from the Bob's Burgers show", "category": "Entertainment", "authType": "none", "baseUrl": "https://www.bobsburgersapi.com/"},
    {"name": "Breaking Bad API", "description": "Characters, episodes, quotes from Breaking Bad", "category": "Entertainment", "authType": "none", "baseUrl": "https://breakingbadapi.com/"},
    {"name": "Cat as a Service", "description": "REST API for cat pictures", "category": "Entertainment", "authType": "none", "baseUrl": "https://cataas.com/"},
    {"name": "Comic Vine", "description": "Comic information resource", "category": "Entertainment", "authType": "apiKey", "baseUrl": "https://comicvine.gamespot.com/api/"},
    {"name": "Comichron Data", "description": "Comic sales data API", "category": "Entertainment", "authType": "none", "baseUrl": "https://github.com/comichron-data/api"},
    {"name": "Danbooru", "description": "Anime images categorized by tags", "category": "Entertainment", "authType": "apiKey", "baseUrl": "https://danbooru.donmai.us/"},
    {"name": "Dune API", "description": "Book, character, movie and quotes data", "category": "Entertainment", "authType": "none", "baseUrl": "https://github.com/ywalia01/dune-api"},
    {"name": "Final Space API", "description": "RESTful API for Final Space show", "category": "Entertainment", "authType": "none", "baseUrl": "https://finalspaceapi.com/"},
    {"name": "Fun Translations API", "description": "Translate to 50+ languages from TV/Movies", "category": "Entertainment", "authType": "apiKey", "baseUrl": "https://funtranslations.com/api/"},
    {"name": "Lord of the Rings API", "description": "Data from LOTR books and movies", "category": "Entertainment", "authType": "apiKey", "baseUrl": "https://the-one-api.dev/"},
    {"name": "Marvel API", "description": "Access 70+ years of Marvel comic data", "category": "Entertainment", "authType": "apiKey", "baseUrl": "https://developer.marvel.com/"},
    {"name": "Jikan MyAnimeList", "description": "Unofficial MyAnimeList API", "category": "Entertainment", "authType": "none", "baseUrl": "https://jikan.moe"},
    {"name": "Nick Cannon Baby API", "description": "Nick Cannon's children data", "category": "Entertainment", "authType": "none", "baseUrl": "https://nick-cannon-baby-api.onrender.com/"},
    {"name": "Owen Wilson Wow API", "description": "Owen Wilson wow exclamations in movies", "category": "Entertainment", "authType": "none", "baseUrl": "https://owen-wilson-wow-api.onrender.com/"},
    {"name": "Pokéapi", "description": "All Pokémon data you'll ever need", "category": "Games", "authType": "none", "baseUrl": "https://pokeapi.co/"},
    {"name": "Rick and Morty API", "description": "All Rick and Morty information", "category": "Entertainment", "authType": "none", "baseUrl": "https://rickandmortyapi.com/"},
    {"name": "Riddles API", "description": "API to get random riddles", "category": "Entertainment", "authType": "none", "baseUrl": "https://riddles-api.vercel.app/"},
    {"name": "STAPI Star Trek", "description": "Star Trek API", "category": "Entertainment", "authType": "none", "baseUrl": "https://stapi.co/"},
    {"name": "SWAPI Star Wars", "description": "All things Star Wars", "category": "Entertainment", "authType": "none", "baseUrl": "https://www.swapi.tech/"},
    {"name": "Studio Ghibli API", "description": "Resources from Studio Ghibli films", "category": "Entertainment", "authType": "none", "baseUrl": "https://ghibliapi.vercel.app/"},
    {"name": "StockX API", "description": "150k+ sneakers and fashion products", "category": "Commerce", "authType": "apiKey", "baseUrl": "https://stockx.vlour.me/"},
    {"name": "TCGdex Pokémon", "description": "Multilanguage Pokémon TCG Database", "category": "Games", "authType": "none", "baseUrl": "https://www.tcgdex.dev/"},
    
    # Face Recognition
    {"name": "Kairos", "description": "Face recognition and emotion analysis", "category": "AI", "authType": "apiKey", "baseUrl": "https://www.kairos.com/"},
    {"name": "Skybiometry", "description": "Face detection and recognition service", "category": "AI", "authType": "apiKey", "baseUrl": "https://www.skybiometry.com"},
    
    # File Storage
    {"name": "Amazon S3", "description": "API for stored files access", "category": "Storage", "authType": "apiKey", "baseUrl": "https://aws.amazon.com/s3/"},
    {"name": "Cloudinary", "description": "Image and video storage and manipulation", "category": "Storage", "authType": "apiKey", "baseUrl": "https://cloudinary.com/documentation"},
    {"name": "DigitalOcean Spaces", "description": "Easy object storage with simple pricing", "category": "Storage", "authType": "apiKey", "baseUrl": "https://www.digitalocean.com/products/spaces"},
    {"name": "Filestack", "description": "Image and file manipulation API", "category": "Storage", "authType": "apiKey", "baseUrl": "https://filestack.com/docs/"},
    {"name": "Microsoft Graph OneDrive", "description": "Access OneDrive files and photos", "category": "Storage", "authType": "oauth", "baseUrl": "https://graph.microsoft.com/"},
    {"name": "PDF Blocks", "description": "API for working with PDF documents", "category": "Documents", "authType": "apiKey", "baseUrl": "https://www.pdfblocks.com/"},
    {"name": "SignNow eSign API", "description": "Embed eSignature workflows in apps", "category": "Documents", "authType": "apiKey", "baseUrl": "https://docs.signnow.com/"},
    {"name": "Smash Upload", "description": "API for uploading large files", "category": "Storage", "authType": "apiKey", "baseUrl": "https://api.fromsmash.com/"},
    {"name": "Vector Express", "description": "API for vector file conversion", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://github.com/smidyo/vectorexpress-api"},
    {"name": "Vertopal Converter", "description": "Convert files to various formats", "category": "Utilities", "authType": "apiKey", "baseUrl": "https://www.vertopal.com/"},
    
    # Finance
    {"name": "Alpha Vantage", "description": "Stock, ETF, mutual fund, forex and crypto data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://www.alphavantage.co/"},
    {"name": "Atom Finance", "description": "Market, earnings and news data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://docs.atom.finance/"},
    {"name": "IEX Cloud", "description": "Free stocks and market data", "category": "Finance", "authType": "apiKey", "baseUrl": "https://iexcloud.io/"},
    {"name": "Twelve Data", "description": "Stock market data real-time and historical", "category": "Finance", "authType": "apiKey", "baseUrl": "https://twelvedata.com/"},
    {"name": "Bank of Canada", "description": "Daily exchange rates and statistics", "category": "Finance", "authType": "none", "baseUrl": "https://www.bankofcanada.ca/rates/"},
    {"name": "IBANAPI", "description": "Validate IBAN number and get bank info", "category": "Finance", "authType": "apiKey", "baseUrl": "https://ibanapi.com/"},
    {"name": "Parqet Logo API", "description": "Free company logo API for 400k+ stocks", "category": "Finance", "authType": "none", "baseUrl": "https://developers.parqet.com/"},
    {"name": "Portfolio Optimizer", "description": "API for investment portfolio optimization", "category": "Finance", "authType": "apiKey", "baseUrl": "https://portfoliooptimizer.io/"},
    
    # Fitness
    {"name": "FitBit API", "description": "Access Fitbit activity tracker data", "category": "Health", "authType": "oauth", "baseUrl": "https://dev.fitbit.com/"},
    {"name": "HealthGraph RunKeeper", "description": "RunKeeper's Health Graph data", "category": "Health", "authType": "oauth", "baseUrl": "https://runkeeper.com/developer/"},
    {"name": "Open Food Facts", "description": "Food product database with ingredients", "category": "Food", "authType": "none", "baseUrl": "https://world.openfoodfacts.org/data"},
    {"name": "Strava API", "description": "Athletes, activities and segments data", "category": "Health", "authType": "oauth", "baseUrl": "https://developers.strava.com/"},
    {"name": "VeganCheck", "description": "Check if product is vegan via EAN/UPC", "category": "Food", "authType": "none", "baseUrl": "https://jokenetwork.de/vegancheck-api"},
    {"name": "Withings API", "description": "Withings activity tracker data", "category": "Health", "authType": "oauth", "baseUrl": "https://developer.withings.com/"},
    
    # Google
    {"name": "Gmail API", "description": "Gmail REST API", "category": "Email", "authType": "oauth", "baseUrl": "https://developers.google.com/gmail/api/"},
    {"name": "Google BigQuery", "description": "Data platform for creating and querying data", "category": "Data", "authType": "oauth", "baseUrl": "https://cloud.google.com/bigquery/"},
    {"name": "Google Books API", "description": "Search for books and manage library", "category": "Books", "authType": "oauth", "baseUrl": "https://developers.google.com/books/"},
    {"name": "Google Calendar API", "description": "Manipulate events and calendar data", "category": "Calendar", "authType": "oauth", "baseUrl": "https://developers.google.com/calendar/"},
    {"name": "Google Classroom API", "description": "Google Classroom API", "category": "Education", "authType": "oauth", "baseUrl": "https://developers.google.com/classroom/"},
    {"name": "Google Custom Search", "description": "Search over websites or collections", "category": "Search", "authType": "apiKey", "baseUrl": "https://developers.google.com/custom-search/"},
    {"name": "Google Drive API", "description": "Interact with Google Drive", "category": "Storage", "authType": "oauth", "baseUrl": "https://developers.google.com/drive/"},
    {"name": "Google Fit API", "description": "Google Fitness API", "category": "Health", "authType": "oauth", "baseUrl": "https://developers.google.com/fit/"},
    {"name": "Google Fonts API", "description": "Add fonts to web pages", "category": "Design", "authType": "apiKey", "baseUrl": "https://developers.google.com/fonts/"},
    {"name": "Google Genomics", "description": "Access to Genomics data", "category": "Science", "authType": "oauth", "baseUrl": "https://cloud.google.com/genomics/"},
    {"name": "Google Identity Toolkit", "description": "Federated login implementation", "category": "Authentication", "authType": "apiKey", "baseUrl": "https://developers.google.com/identity/"},
    {"name": "Google Cloud Monitoring", "description": "Access Google Cloud monitoring data", "category": "Analytics", "authType": "oauth", "baseUrl": "https://cloud.google.com/monitoring/"},
    
    # Identity
    {"name": "BlockScore", "description": "Identity verification API", "category": "Identity", "authType": "apiKey", "baseUrl": "https://blockscore.com/"},
    {"name": "Cognito Identity", "description": "Verify and retrieve identity information", "category": "Identity", "authType": "apiKey", "baseUrl": "https://cognitohq.com/"},
    {"name": "Whitepages Pro", "description": "Global Identity Verification API", "category": "Identity", "authType": "apiKey", "baseUrl": "https://pro.whitepages.com/"},
    
    # Image Moderation
    {"name": "WebPurify", "description": "Live image moderation by humans", "category": "AI", "authType": "apiKey", "baseUrl": "https://www.webpurify.com/"},
    
    # IoT
    {"name": "Particle", "description": "Manage Particle devices and Raspberry Pi", "category": "IoT", "authType": "apiKey", "baseUrl": "https://docs.particle.io/reference/"},
    {"name": "PubNub", "description": "Real time apps with hardware devices", "category": "IoT", "authType": "apiKey", "baseUrl": "https://www.pubnub.com/docs"},
    {"name": "Philips Hue", "description": "Control Hue brand smart lights", "category": "IoT", "authType": "apiKey", "baseUrl": "https://developers.meethue.com/"},
    {"name": "SmartThings", "description": "Samsung SmartThings Smart Home Hub API", "category": "IoT", "authType": "oauth", "baseUrl": "https://developer.smartthings.com/"},
    {"name": "Temboo SDK", "description": "Layer on top of third-party APIs", "category": "Development", "authType": "apiKey", "baseUrl": "https://temboo.com/"},
    {"name": "ThingSpeak", "description": "IoT application to store and retrieve data", "category": "IoT", "authType": "apiKey", "baseUrl": "https://thingspeak.com/"},
    {"name": "Zetta", "description": "Open source IoT platform on Node.js", "category": "IoT", "authType": "none", "baseUrl": "https://www.zettajs.org/"},
    
    # Login Authentication
    {"name": "Auth0", "description": "Authenticate and authorize apps and APIs", "category": "Authentication", "authType": "apiKey", "baseUrl": "https://auth0.com"},
    {"name": "Facebook Login", "description": "Secure convenient way to login", "category": "Authentication", "authType": "oauth", "baseUrl": "https://developers.facebook.com/docs/facebook-login"},
    {"name": "Firebase Auth", "description": "Authentication analytics and messaging", "category": "Authentication", "authType": "apiKey", "baseUrl": "https://firebase.google.com/"},
    {"name": "GitHub Authentication", "description": "GitHub's Authentication API", "category": "Authentication", "authType": "oauth", "baseUrl": "https://docs.github.com/en/developers"},
    {"name": "Instagram Login", "description": "Instagram's OAuth API", "category": "Authentication", "authType": "oauth", "baseUrl": "https://developers.facebook.com/docs/instagram-api/"},
    {"name": "LinkedIn Sign In", "description": "Sign in with professional identity", "category": "Authentication", "authType": "oauth", "baseUrl": "https://developer.linkedin.com/"},
    {"name": "PayPal Login", "description": "Sign in with PayPal credentials", "category": "Authentication", "authType": "oauth", "baseUrl": "https://developer.paypal.com/"},
    {"name": "Salesforce Auth", "description": "OAuth protocol for Salesforce users", "category": "Authentication", "authType": "oauth", "baseUrl": "https://developer.salesforce.com/"},
    {"name": "Twitter Sign-in", "description": "Sign in with Twitter", "category": "Authentication", "authType": "oauth", "baseUrl": "https://developer.twitter.com/"},
    {"name": "WorkOS", "description": "Enterprise SSO with Okta, Azure, OneLogin", "category": "Authentication", "authType": "apiKey", "baseUrl": "https://workos.com/"},
    
    # Machine Learning
    {"name": "Amazon ML API", "description": "Amazon Machine Learning API", "category": "AI", "authType": "apiKey", "baseUrl": "https://aws.amazon.com/machine-learning/"},
    {"name": "AYLIEN Text Analysis", "description": "NLP and Machine Learning tools", "category": "AI", "authType": "apiKey", "baseUrl": "https://aylien.com/"},
    {"name": "BigML", "description": "Machine learning API for decision trees", "category": "AI", "authType": "apiKey", "baseUrl": "https://bigml.com/api/"},
    {"name": "Google Cloud ML", "description": "Cloud-based machine learning tools", "category": "AI", "authType": "oauth", "baseUrl": "https://cloud.google.com/ai-platform/"},
    {"name": "Azure Cognitive Services", "description": "Microsoft Azure Machine Learning", "category": "AI", "authType": "apiKey", "baseUrl": "https://azure.microsoft.com/en-us/services/cognitive-services/"},
    {"name": "ObjectCut", "description": "Automatic background removal with AI", "category": "AI", "authType": "apiKey", "baseUrl": "https://objectcut.com"},
    {"name": "OVHcloud AI Endpoints", "description": "Simplify GenAI and ML integration", "category": "AI", "authType": "apiKey", "baseUrl": "https://endpoints.ai.cloud.ovh.net/"},
    {"name": "Unplugg Forecasting", "description": "Automated Forecasting API for timeseries", "category": "AI", "authType": "apiKey", "baseUrl": "https://unplu.gg/"},
    
    # Maps
    {"name": "Amazon Maps API", "description": "Interactive 3D maps for Fire devices", "category": "Maps", "authType": "apiKey", "baseUrl": "https://developer.amazon.com/maps"},
    {"name": "Bing Maps", "description": "Microsoft Bing Maps platform", "category": "Maps", "authType": "apiKey", "baseUrl": "https://www.microsoft.com/en-us/maps"},
    {"name": "Cartes.io", "description": "Create maps and markers without auth", "category": "Maps", "authType": "none", "baseUrl": "https://cartes.io/"},
    {"name": "CartoDB", "description": "Generate maps based on CartoDB data", "category": "Maps", "authType": "apiKey", "baseUrl": "https://carto.com/"},
    {"name": "Daum Maps", "description": "Multiple APIs for Korean maps", "category": "Maps", "authType": "apiKey", "baseUrl": "https://apis.map.daum.net/"},
    {"name": "Google Maps API", "description": "Google Maps for Android, iOS and web", "category": "Maps", "authType": "apiKey", "baseUrl": "https://developers.google.com/maps/"},
    {"name": "HERE Maps", "description": "Wide range of map APIs", "category": "Maps", "authType": "apiKey", "baseUrl": "https://developer.here.com/"},
    {"name": "Leaflet.js", "description": "Mobile-friendly interactive maps", "category": "Maps", "authType": "none", "baseUrl": "https://leafletjs.com/"},
    {"name": "Mapbox", "description": "Access to MapBox's API", "category": "Maps", "authType": "apiKey", "baseUrl": "https://www.mapbox.com/"},
    {"name": "OpenStreetMap", "description": "API access to OSM", "category": "Maps", "authType": "none", "baseUrl": "https://www.openstreetmap.org/"},
    {"name": "Scribble Maps", "description": "Interactive map builder", "category": "Maps", "authType": "apiKey", "baseUrl": "https://www.scribblemaps.com/"},
    {"name": "Yandex Maps", "description": "Install Yandex Maps on web apps", "category": "Maps", "authType": "apiKey", "baseUrl": "https://tech.yandex.com/maps/"},
    
    # Math
    {"name": "Newton Math API", "description": "API for Arithmetic and Symbolic Math", "category": "Science", "authType": "none", "baseUrl": "https://newton.vercel.app/"},
    
    # Medical
    {"name": "COVID-19 Data", "description": "Live and historical Coronavirus data", "category": "Health", "authType": "none", "baseUrl": "https://github.com/M-Media-Group/Covid-19-API"},
    {"name": "Infermedica", "description": "AI-based patient triage and diagnosis", "category": "Health", "authType": "apiKey", "baseUrl": "https://developer.infermedica.com/"},
    
    # Animals from public-apis
    {"name": "AdoptAPet", "description": "Resource to help get pets adopted", "category": "Animals", "authType": "apiKey", "baseUrl": "https://www.adoptapet.com/public/apis/"},
    {"name": "Axolotl API", "description": "Collection of axolotl pictures and facts", "category": "Animals", "authType": "none", "baseUrl": "https://theaxolotlapi.netlify.app/"},
    {"name": "Cat Facts", "description": "Daily cat facts", "category": "Animals", "authType": "none", "baseUrl": "https://alexwohlbruck.github.io/cat-facts/"},
    {"name": "The Cat API", "description": "Pictures of cats from Tumblr", "category": "Animals", "authType": "apiKey", "baseUrl": "https://thecatapi.com/"},
    {"name": "Dog Facts API", "description": "Random dog facts", "category": "Animals", "authType": "none", "baseUrl": "https://dukengn.github.io/Dog-facts-API/"},
    {"name": "Dog CEO", "description": "Based on Stanford Dogs Dataset", "category": "Animals", "authType": "none", "baseUrl": "https://dog.ceo/dog-api/"},
    {"name": "eBird", "description": "Birding observations API", "category": "Animals", "authType": "apiKey", "baseUrl": "https://documenter.getpostman.com/view/664302/S1ENwy59"},
    {"name": "FishWatch", "description": "Information about fish species", "category": "Animals", "authType": "none", "baseUrl": "https://www.fishwatch.gov/developers"},
    {"name": "HTTP Cat", "description": "Cat for every HTTP Status", "category": "Animals", "authType": "none", "baseUrl": "https://http.cat/"},
    {"name": "HTTP Dog", "description": "Dogs for every HTTP status code", "category": "Animals", "authType": "none", "baseUrl": "https://http.dog/"},
    {"name": "IUCN Red List", "description": "IUCN Red List of Threatened Species", "category": "Animals", "authType": "apiKey", "baseUrl": "https://apiv3.iucnredlist.org/"},
    {"name": "MeowFacts", "description": "Get random cat facts", "category": "Animals", "authType": "none", "baseUrl": "https://github.com/wh-iterabb-it/meowfacts"},
    {"name": "Movebank", "description": "Movement and Migration data of animals", "category": "Animals", "authType": "none", "baseUrl": "https://github.com/movebank/movebank-api-doc"},
    {"name": "Petfinder", "description": "Helping pets find homes", "category": "Animals", "authType": "apiKey", "baseUrl": "https://www.petfinder.com/developers/"},
    {"name": "PlaceBear", "description": "Placeholder bear pictures", "category": "Animals", "authType": "none", "baseUrl": "https://placebear.com/"},
    {"name": "PlaceDog", "description": "Placeholder Dog pictures", "category": "Animals", "authType": "none", "baseUrl": "https://place.dog"},
    {"name": "PlaceKitten", "description": "Placeholder Kitten pictures", "category": "Animals", "authType": "none", "baseUrl": "https://placekitten.com/"},
    {"name": "RandomDog", "description": "Random pictures of dogs", "category": "Animals", "authType": "none", "baseUrl": "https://random.dog/"},
    {"name": "RandomDuck", "description": "Random pictures of ducks", "category": "Animals", "authType": "none", "baseUrl": "https://random-d.uk/api"},
    {"name": "RandomFox", "description": "Random pictures of foxes", "category": "Animals", "authType": "none", "baseUrl": "https://randomfox.ca/"},
    {"name": "RescueGroups", "description": "Adoption API", "category": "Animals", "authType": "none", "baseUrl": "https://userguide.rescuegroups.org/"},
    {"name": "Shibe.Online", "description": "Random pictures of Shiba Inu, cats, birds", "category": "Animals", "authType": "none", "baseUrl": "https://shibe.online/"},
    {"name": "The Dog API", "description": "Dogs pictures and info", "category": "Animals", "authType": "apiKey", "baseUrl": "https://thedogapi.com/"},
    {"name": "Xeno-canto", "description": "Bird recordings", "category": "Animals", "authType": "none", "baseUrl": "https://xeno-canto.org/"},
    {"name": "Zoo Animals", "description": "Facts and pictures of zoo animals", "category": "Animals", "authType": "none", "baseUrl": "https://zoo-animal-api.herokuapp.com/"},
    
    # Anime
    {"name": "AniAPI", "description": "Anime discovery and streaming", "category": "Entertainment", "authType": "oauth", "baseUrl": "https://aniapi.com/"},
    {"name": "AniDB", "description": "Anime Database", "category": "Entertainment", "authType": "apiKey", "baseUrl": "https://wiki.anidb.net/"},
    {"name": "AnimeChan", "description": "Anime quotes over 10k", "category": "Entertainment", "authType": "none", "baseUrl": "https://github.com/RocktimSaikia/anime-chan"},
    {"name": "AnimeFacts", "description": "Anime Facts over 100", "category": "Entertainment", "authType": "none", "baseUrl": "https://chandan-02.github.io/anime-facts-rest-api/"},
    {"name": "AnimeNewsNetwork", "description": "Anime industry news", "category": "Entertainment", "authType": "none", "baseUrl": "https://www.animenewsnetwork.com/encyclopedia/api.php"},
    {"name": "Catboy", "description": "Neko images and funny GIFs", "category": "Entertainment", "authType": "none", "baseUrl": "https://catboys.com/api"},
    {"name": "Danbooru Anime", "description": "Anime artist database", "category": "Entertainment", "authType": "apiKey", "baseUrl": "https://danbooru.donmai.us/"},
    {"name": "Kitsu", "description": "Anime discovery platform", "category": "Entertainment", "authType": "oauth", "baseUrl": "https://kitsu.io/"},
    {"name": "MangaDex", "description": "Manga Database and Community", "category": "Entertainment", "authType": "apiKey", "baseUrl": "https://api.mangadex.org/"},
    {"name": "Mangapi", "description": "Translate manga pages between languages", "category": "Entertainment", "authType": "apiKey", "baseUrl": "https://rapidapi.com/"},
    {"name": "MyAnimeList", "description": "Anime and Manga Database", "category": "Entertainment", "authType": "oauth", "baseUrl": "https://myanimelist.net/"},
    {"name": "NekosBest", "description": "Neko Images and Anime GIFs", "category": "Entertainment", "authType": "none", "baseUrl": "https://docs.nekos.best"},
    {"name": "Shikimori", "description": "Anime discovery and tracking", "category": "Entertainment", "authType": "oauth", "baseUrl": "https://shikimori.one/"},
    {"name": "Trace Moe", "description": "Get exact anime scene from screenshot", "category": "Entertainment", "authType": "none", "baseUrl": "https://soruly.github.io/trace.moe-api/"},
    {"name": "Waifu.im", "description": "Waifu pictures archive", "category": "Entertainment", "authType": "none", "baseUrl": "https://waifu.im/"},
    {"name": "Waifu.pics", "description": "Image sharing platform for anime", "category": "Entertainment", "authType": "none", "baseUrl": "https://waifu.pics/"},
    
    # Anti-Malware
    {"name": "AbuseIPDB", "description": "IP/domain/URL reputation", "category": "Security", "authType": "apiKey", "baseUrl": "https://www.abuseipdb.com/"},
    {"name": "AlienVault OTX", "description": "IP/domain/URL reputation", "category": "Security", "authType": "apiKey", "baseUrl": "https://otx.alienvault.com/"},
    {"name": "CAPEsandbox", "description": "Malware execution and analysis", "category": "Security", "authType": "apiKey", "baseUrl": "https://capev2.readthedocs.io/"},
    {"name": "Google Safe Browsing", "description": "Google Link/Domain Flagging", "category": "Security", "authType": "apiKey", "baseUrl": "https://developers.google.com/safe-browsing/"},
    {"name": "MalDatabase", "description": "Malware datasets and threat intelligence", "category": "Security", "authType": "apiKey", "baseUrl": "https://maldatabase.com/"},
    {"name": "MalShare", "description": "Malware Archive / file sourcing", "category": "Security", "authType": "apiKey", "baseUrl": "https://malshare.com/"},
    {"name": "MalwareBazaar", "description": "Collect and share malware samples", "category": "Security", "authType": "apiKey", "baseUrl": "https://bazaar.abuse.ch/"},
    {"name": "Metacert", "description": "Metacert Link Flagging", "category": "Security", "authType": "apiKey", "baseUrl": "https://metacert.com/"},
    {"name": "NoPhishy", "description": "Check links for phishing attempts", "category": "Security", "authType": "apiKey", "baseUrl": "https://rapidapi.com/"},
    {"name": "Phisherman", "description": "IP/domain/URL reputation", "category": "Security", "authType": "apiKey", "baseUrl": "https://phisherman.gg/"},
    {"name": "Scanii", "description": "Scan documents for threats", "category": "Security", "authType": "apiKey", "baseUrl": "https://docs.scanii.com/"},
    {"name": "URLhaus", "description": "Download Malware Samples", "category": "Security", "authType": "none", "baseUrl": "https://urlhaus-api.abuse.ch/"},
    {"name": "URLScan.io", "description": "Scan and Analyse URLs", "category": "Security", "authType": "apiKey", "baseUrl": "https://urlscan.io/"},
    {"name": "VirusTotal", "description": "VirusTotal File/URL Analysis", "category": "Security", "authType": "apiKey", "baseUrl": "https://www.virustotal.com/"},
    {"name": "Web of Trust", "description": "IP/domain/URL reputation", "category": "Security", "authType": "apiKey", "baseUrl": "https://www.mywot.com/"},
    
    # Art & Design
    {"name": "Améthyste", "description": "Generate images for Discord users", "category": "Design", "authType": "apiKey", "baseUrl": "https://api.amethyste.moe/"},
    {"name": "Art Institute of Chicago", "description": "Art museum API", "category": "Design", "authType": "none", "baseUrl": "https://api.artic.edu/"},
    {"name": "Colormind", "description": "Color scheme generator", "category": "Design", "authType": "none", "baseUrl": "http://colormind.io/"},
    {"name": "ColourLovers", "description": "Get patterns, palettes and images", "category": "Design", "authType": "none", "baseUrl": "http://www.colourlovers.com/api"},
    {"name": "Cooper Hewitt", "description": "Smithsonian Design Museum", "category": "Design", "authType": "apiKey", "baseUrl": "https://collection.cooperhewitt.org/"},
    {"name": "EmojiHub", "description": "Get emojis by categories", "category": "Design", "authType": "none", "baseUrl": "https://github.com/cheatsnake/emojihub"},
    {"name": "Europeana", "description": "European Museum content", "category": "Design", "authType": "apiKey", "baseUrl": "https://pro.europeana.eu/"},
    {"name": "Harvard Art Museums", "description": "Art museum API", "category": "Design", "authType": "apiKey", "baseUrl": "https://github.com/harvardartmuseums/api-docs"},
    {"name": "Iconfinder", "description": "Icons API", "category": "Design", "authType": "apiKey", "baseUrl": "https://developer.iconfinder.com"},
    {"name": "Icons8", "description": "Icons search", "category": "Design", "authType": "none", "baseUrl": "https://icons8.com/"},
    {"name": "Lordicon", "description": "Icons with Animations", "category": "Design", "authType": "none", "baseUrl": "https://lordicon.com/"},
    {"name": "Metropolitan Museum", "description": "Met Museum of Art API", "category": "Design", "authType": "none", "baseUrl": "https://metmuseum.github.io/"},
    {"name": "Noun Project", "description": "Icons API", "category": "Design", "authType": "oauth", "baseUrl": "https://api.thenounproject.com/"},
    {"name": "Pixel Encounter", "description": "SVG Icon Generator", "category": "Design", "authType": "none", "baseUrl": "https://pixelencounter.com/"},
    {"name": "Rijksmuseum", "description": "RijksMuseum Data API", "category": "Design", "authType": "apiKey", "baseUrl": "https://data.rijksmuseum.nl/"},
    {"name": "Word Cloud API", "description": "Easily create word clouds", "category": "Design", "authType": "apiKey", "baseUrl": "https://wordcloudapi.com/"},
    {"name": "xColors", "description": "Generate and convert colors", "category": "Design", "authType": "none", "baseUrl": "https://x-colors.herokuapp.com/"},
    
    # Auth
    {"name": "GetOTP", "description": "Implement OTP flow quickly", "category": "Authentication", "authType": "apiKey", "baseUrl": "https://otp.dev/"},
    {"name": "Micro User Service", "description": "User management and authentication", "category": "Authentication", "authType": "apiKey", "baseUrl": "https://m3o.com/user"},
    {"name": "MojoAuth", "description": "Passwordless authentication platform", "category": "Authentication", "authType": "apiKey", "baseUrl": "https://mojoauth.com"},
    {"name": "SAWO Labs", "description": "Passwordless authentication integration", "category": "Authentication", "authType": "apiKey", "baseUrl": "https://sawolabs.com"},
    {"name": "Stytch", "description": "User infrastructure for modern apps", "category": "Authentication", "authType": "apiKey", "baseUrl": "https://stytch.com/"},
    {"name": "Warrant", "description": "APIs for authorization and access control", "category": "Authentication", "authType": "apiKey", "baseUrl": "https://warrant.dev/"},
    
    # Blockchain
    {"name": "Bitquery", "description": "Onchain GraphQL APIs and DEX APIs", "category": "Blockchain", "authType": "apiKey", "baseUrl": "https://graphql.bitquery.io/"},
    {"name": "Chainlink", "description": "Build hybrid smart contracts", "category": "Blockchain", "authType": "none", "baseUrl": "https://chain.link/"},
    {"name": "Chainpoint", "description": "Anchor data to Bitcoin blockchain", "category": "Blockchain", "authType": "none", "baseUrl": "https://tierion.com/chainpoint/"},
    {"name": "Etherscan", "description": "Ethereum explorer API", "category": "Blockchain", "authType": "apiKey", "baseUrl": "https://etherscan.io/"},
    {"name": "Helium", "description": "Helium distributed network API", "category": "Blockchain", "authType": "none", "baseUrl": "https://docs.helium.com/"},
    {"name": "Nownodes", "description": "Blockchain-as-a-service provider", "category": "Blockchain", "authType": "apiKey", "baseUrl": "https://nownodes.io/"},
    {"name": "Steem", "description": "Blockchain-based social media", "category": "Blockchain", "authType": "none", "baseUrl": "https://developers.steem.io/"},
    {"name": "The Graph", "description": "Indexing protocol with GraphQL", "category": "Blockchain", "authType": "apiKey", "baseUrl": "https://thegraph.com"},
    {"name": "Walltime", "description": "Walltime's market info", "category": "Blockchain", "authType": "none", "baseUrl": "https://walltime.info/"},
    {"name": "Watchdata", "description": "Ethereum blockchain API access", "category": "Blockchain", "authType": "apiKey", "baseUrl": "https://docs.watchdata.io"},
    
    # Books
    {"name": "A Bíblia Digital", "description": "Bible versions management", "category": "Books", "authType": "apiKey", "baseUrl": "https://www.abibliadigital.com.br/"},
    {"name": "Bhagavad Gita API", "description": "Shrimad Bhagavad Gita translations", "category": "Books", "authType": "apiKey", "baseUrl": "https://docs.bhagavadgitaapi.in"},
    {"name": "Bhagavad Gita telugu", "description": "Bhagavad Gita in telugu and odia", "category": "Books", "authType": "none", "baseUrl": "https://gita-api.vercel.app"},
    {"name": "Bible-api", "description": "Free Bible API", "category": "Books", "authType": "none", "baseUrl": "https://bible-api.com/"},
    {"name": "British National Bibliography", "description": "Books data", "category": "Books", "authType": "none", "baseUrl": "https://bnb.data.bl.uk/"},
    {"name": "Crossref Metadata", "description": "Books and Articles Metadata", "category": "Books", "authType": "none", "baseUrl": "https://www.crossref.org/"},
    {"name": "Ganjoor", "description": "Classic Persian poetry works", "category": "Books", "authType": "oauth", "baseUrl": "https://api.ganjoor.net"},
    {"name": "GurbaniNow", "description": "Fast Gurbani RESTful API", "category": "Books", "authType": "none", "baseUrl": "https://github.com/GurbaniNow/api"},
    {"name": "Gutendex", "description": "Project Gutenberg Books Library", "category": "Books", "authType": "none", "baseUrl": "https://gutendex.com/"},
    {"name": "Open Library", "description": "Books and covers data", "category": "Books", "authType": "none", "baseUrl": "https://openlibrary.org/developers/api"},
    {"name": "Penguin Publishing", "description": "Books and covers data", "category": "Books", "authType": "none", "baseUrl": "https://www.penguinrandomhouse.com/"},
    {"name": "PoetryDB", "description": "Vast poetry collection", "category": "Books", "authType": "none", "baseUrl": "https://poetrydb.org/"},
    {"name": "Quran API", "description": "RESTful Quran API multiple languages", "category": "Books", "authType": "none", "baseUrl": "https://quran.api-docs.io/"},
    {"name": "Quran Cloud", "description": "Retrieve Ayah, Surah, Juz", "category": "Books", "authType": "none", "baseUrl": "https://alquran.cloud/api"},
    {"name": "Quran-api", "description": "Quran with 400+ translations", "category": "Books", "authType": "none", "baseUrl": "https://github.com/fawazahmed0/quran-api"},
    {"name": "Rig Veda", "description": "Gods, poets and verse meters", "category": "Books", "authType": "none", "baseUrl": "https://aninditabasu.github.io/indica/"},
    {"name": "The Bible API", "description": "Everything from the Bible", "category": "Books", "authType": "apiKey", "baseUrl": "https://docs.api.bible"},
    {"name": "Thirukkural", "description": "Thirukkural poems and explanation", "category": "Books", "authType": "none", "baseUrl": "https://api-thirukkural.web.app/"},
    {"name": "Vedic Society", "description": "Nouns from vedic literature", "category": "Books", "authType": "none", "baseUrl": "https://aninditabasu.github.io/indica/"},
    {"name": "Wizard World", "description": "Harry Potter universe data", "category": "Books", "authType": "none", "baseUrl": "https://wizard-world-api.herokuapp.com/"},
    {"name": "Wolne Lektury", "description": "Polish e-books information", "category": "Books", "authType": "none", "baseUrl": "https://wolnelektury.pl/api/"},
    
    # Business
    {"name": "Apache Superset", "description": "Manage BI dashboards and data sources", "category": "Business", "authType": "apiKey", "baseUrl": "https://superset.apache.org/"},
    {"name": "Charity Search", "description": "Non-profit charity data", "category": "Business", "authType": "apiKey", "baseUrl": "https://charityapi.orghunter.com/"},
    {"name": "Clearbit Logo", "description": "Search for company logos", "category": "Business", "authType": "apiKey", "baseUrl": "https://clearbit.com/"},
    {"name": "Domainsdb.info", "description": "Registered Domain Names Search", "category": "Business", "authType": "none", "baseUrl": "https://domainsdb.info/"},
    {"name": "Freelancer", "description": "Hire freelancers to get work done", "category": "Business", "authType": "oauth", "baseUrl": "https://developers.freelancer.com"},
    {"name": "Instatus", "description": "Status page API", "category": "Business", "authType": "apiKey", "baseUrl": "https://instatus.com/"},
    {"name": "Mailchimp", "description": "Marketing campaigns and mail", "category": "Business", "authType": "apiKey", "baseUrl": "https://mailchimp.com/developer/"},
    {"name": "Mailjet", "description": "Marketing email with MJML templates", "category": "Email", "authType": "apiKey", "baseUrl": "https://www.mailjet.com/"},
    {"name": "Markerapi", "description": "Trademark Search", "category": "Business", "authType": "none", "baseUrl": "https://markerapi.com"},
    {"name": "ORB Intelligence", "description": "Company lookup API", "category": "Business", "authType": "apiKey", "baseUrl": "https://api.orb-intelligence.com/"},
    {"name": "Redash", "description": "Access queries and dashboards", "category": "Business", "authType": "apiKey", "baseUrl": "https://redash.io/"},
    {"name": "Smartsheet", "description": "Access Smartsheet data", "category": "Business", "authType": "oauth", "baseUrl": "https://smartsheet.redoc.ly/"},
    {"name": "Square", "description": "Payments and refunds", "category": "Commerce", "authType": "oauth", "baseUrl": "https://developer.squareup.com/"},
    {"name": "SwiftKanban", "description": "Kanban software API", "category": "Business", "authType": "apiKey", "baseUrl": "https://www.digite.com/"},
    {"name": "Tenders Hungary", "description": "Procurement data for Hungary", "category": "Government", "authType": "none", "baseUrl": "https://tenders.guru/hu/api"},
    {"name": "Tenders Poland", "description": "Procurement data for Poland", "category": "Government", "authType": "none", "baseUrl": "https://tenders.guru/pl/api"},
    {"name": "Tenders Romania", "description": "Procurement data for Romania", "category": "Government", "authType": "none", "baseUrl": "https://tenders.guru/ro/api"},
    {"name": "Tenders Spain", "description": "Procurement data for Spain", "category": "Government", "authType": "none", "baseUrl": "https://tenders.guru/es/api"},
    {"name": "Tenders Ukraine", "description": "Procurement data for Ukraine", "category": "Government", "authType": "none", "baseUrl": "https://tenders.guru/ua/api"},
    {"name": "Tomba Email Finder", "description": "Email Finder for B2B sales", "category": "Business", "authType": "apiKey", "baseUrl": "https://tomba.io/"},
    {"name": "Trello", "description": "Boards, lists and cards API", "category": "Business", "authType": "oauth", "baseUrl": "https://developers.trello.com/"},
    
    # Calendar from public-apis
    {"name": "Abstract Public Holidays", "description": "Holidays data via API", "category": "Calendar", "authType": "apiKey", "baseUrl": "https://www.abstractapi.com/holidays-api"},
    {"name": "Calendarific", "description": "Worldwide Holidays API", "category": "Calendar", "authType": "apiKey", "baseUrl": "https://calendarific.com/"},
    {"name": "Church Calendar", "description": "Catholic liturgical calendar", "category": "Calendar", "authType": "none", "baseUrl": "http://calapi.inadiutorium.cz/"},
    {"name": "Czech Namedays", "description": "Nameday date lookup", "category": "Calendar", "authType": "none", "baseUrl": "https://svatky.adresa.info"},
    {"name": "Festivo Public Holidays", "description": "Public holiday service", "category": "Calendar", "authType": "apiKey", "baseUrl": "https://docs.getfestivo.com/"},
    {"name": "Hebrew Calendar", "description": "Convert Gregorian and Hebrew dates", "category": "Calendar", "authType": "none", "baseUrl": "https://www.hebcal.com/"},
    {"name": "Holidays API", "description": "Historical holiday data", "category": "Calendar", "authType": "apiKey", "baseUrl": "https://holidayapi.com/"},
    {"name": "LectServe", "description": "Protestant liturgical calendar", "category": "Calendar", "authType": "none", "baseUrl": "http://www.lectserve.com"},
    {"name": "Nager.Date", "description": "Public holidays for 90+ countries", "category": "Calendar", "authType": "none", "baseUrl": "https://date.nager.at"},
    {"name": "Namedays Calendar", "description": "Namedays for multiple countries", "category": "Calendar", "authType": "none", "baseUrl": "https://nameday.abalin.net"},
    {"name": "Non-Working Days ICS", "description": "ICS files for non working days", "category": "Calendar", "authType": "none", "baseUrl": "https://github.com/gadael/icsdb"},
    {"name": "Russian Calendar", "description": "Check Russian holidays", "category": "Calendar", "authType": "none", "baseUrl": "https://github.com/egno/work-calendar"},
    {"name": "UK Bank Holidays", "description": "Bank holidays in UK", "category": "Calendar", "authType": "none", "baseUrl": "https://www.gov.uk/bank-holidays.json"},
    
    # Cloud Storage from public-apis
    {"name": "AnonFiles", "description": "Upload files anonymously", "category": "Storage", "authType": "none", "baseUrl": "https://anonfiles.com/"},
    {"name": "BayFiles", "description": "Upload and share files", "category": "Storage", "authType": "none", "baseUrl": "https://bayfiles.com/"},
    {"name": "Box", "description": "File Sharing and Storage", "category": "Storage", "authType": "oauth", "baseUrl": "https://developer.box.com/"},
    {"name": "ddownload", "description": "File Sharing and Storage", "category": "Storage", "authType": "apiKey", "baseUrl": "https://ddownload.com/"},
    {"name": "File.io", "description": "Simple file sharing", "category": "Storage", "authType": "none", "baseUrl": "https://www.file.io"},
    {"name": "GoFile", "description": "Unlimited size file uploads", "category": "Storage", "authType": "apiKey", "baseUrl": "https://gofile.io/api"},
    {"name": "Gyazo", "description": "Save and Share screen captures", "category": "Storage", "authType": "apiKey", "baseUrl": "https://gyazo.com/api/docs"},
    {"name": "Imgbb", "description": "Quick private image sharing", "category": "Images", "authType": "apiKey", "baseUrl": "https://api.imgbb.com/"},
    {"name": "Pantry", "description": "Free JSON storage for small projects", "category": "Storage", "authType": "none", "baseUrl": "https://getpantry.cloud/"},
    {"name": "Pastebin", "description": "Plain Text Storage", "category": "Storage", "authType": "apiKey", "baseUrl": "https://pastebin.com/"},
    {"name": "Pinata", "description": "IPFS Pinning Services API", "category": "Storage", "authType": "apiKey", "baseUrl": "https://docs.pinata.cloud/"},
    {"name": "Quip", "description": "File Sharing for groups", "category": "Storage", "authType": "apiKey", "baseUrl": "https://quip.com/"},
    {"name": "Storj", "description": "Decentralized Cloud Storage", "category": "Storage", "authType": "apiKey", "baseUrl": "https://docs.storj.io/"},
    {"name": "The Null Pointer", "description": "File hosting and URL shortening", "category": "Storage", "authType": "none", "baseUrl": "https://0x0.st"},
    {"name": "Web3 Storage", "description": "File Storage with 1TB Space", "category": "Storage", "authType": "apiKey", "baseUrl": "https://web3.storage/"},
    
    # CI/CD
    {"name": "Azure DevOps Health", "description": "Azure resource health", "category": "Development", "authType": "apiKey", "baseUrl": "https://docs.microsoft.com/en-us/rest/api/resourcehealth"},
    {"name": "Bitrise", "description": "Build tool and integrations", "category": "Development", "authType": "apiKey", "baseUrl": "https://api-docs.bitrise.io/"},
    {"name": "Buddy CI/CD", "description": "Continuous integration and delivery", "category": "Development", "authType": "oauth", "baseUrl": "https://buddy.works/"},
    {"name": "CircleCI", "description": "Automate software development", "category": "Development", "authType": "apiKey", "baseUrl": "https://circleci.com/docs/api/"},
    {"name": "Codeship", "description": "Continuous Integration Platform", "category": "Development", "authType": "apiKey", "baseUrl": "https://docs.cloudbees.com/docs/cloudbees-codeship/"},
    {"name": "Travis CI", "description": "Sync GitHub projects with Travis", "category": "Development", "authType": "apiKey", "baseUrl": "https://docs.travis-ci.com/api/"},
]

# Filter out duplicates
for api in markdown_apis:
    name_lower = api["name"].lower()
    url_lower = api.get("baseUrl", "").lower()
    
    # Skip if already exists
    if name_lower in existing_names:
        continue
    if url_lower and url_lower in existing_urls:
        continue
    
    new_apis.append(api)
    existing_names.add(name_lower)
    existing_urls.add(url_lower)

# Save new batch
output_file = os.path.expanduser("~/Projects/apiclaw/data/night-expansion-02-27.json")
with open(output_file, "w") as f:
    json.dump(new_apis, f, indent=2)

print(f"New APIs extracted: {len(new_apis)}")
print(f"Output saved to: {output_file}")

# Create combined file
combined = existing + new_apis
combined_file = os.path.expanduser("~/Projects/apiclaw/data/combined-02-27.json")
with open(combined_file, "w") as f:
    json.dump(combined, f, indent=2)

print(f"Total APIs in combined: {len(combined)}")
print(f"Combined saved to: {combined_file}")
