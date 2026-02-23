#!/usr/bin/env python3
"""APIClaw Night Expansion 03:00 - Add 1000+ APIs"""

import json
import os
from datetime import datetime

REGISTRY_PATH = os.path.expanduser("~/Projects/apiclaw/src/registry/apis_expanded.json")

def load_registry():
    with open(REGISTRY_PATH) as f:
        return json.load(f)

def save_registry(data):
    with open(REGISTRY_PATH, "w") as f:
        json.dump(data, f, indent=2)

def generate_id(name, category):
    """Generate unique API ID"""
    clean = name.lower().replace(" ", "-").replace(".", "-")
    return f"{category.lower()[:3]}-{clean[:20]}-{hash(name) % 10000}"

# NEW APIs to add - curated from sources
NEW_APIS = [
    # === ADVERTISING ===
    {"name": "Amazon Mobile Ads", "description": "Monetize across platforms with multiple ad formats", "category": "Advertising", "baseUrl": "https://developer.amazon.com/ads", "authType": "apiKey"},
    {"name": "Facebook Marketing API", "description": "Manage ads and campaigns using the Facebook API", "category": "Advertising", "baseUrl": "https://developers.facebook.com/docs/marketing-apis", "authType": "oauth"},
    {"name": "Google AdSense", "description": "Free, flexible way to earn money from websites and apps", "category": "Advertising", "baseUrl": "https://developers.google.com/adsense", "authType": "oauth"},
    {"name": "Google AdWords API", "description": "Manage Google AdWords campaigns programmatically", "category": "Advertising", "baseUrl": "https://developers.google.com/adwords/api", "authType": "oauth"},
    {"name": "Kevel Ad APIs", "description": "Build your own ad server with Kevel's ad APIs", "category": "Advertising", "baseUrl": "https://dev.kevel.co", "authType": "apiKey"},
    {"name": "Microsoft Bing Ads", "description": "Programmatic access to Bing advertising technologies", "category": "Advertising", "baseUrl": "https://docs.microsoft.com/en-us/advertising/", "authType": "oauth"},
    
    # === ANALYTICS ===
    {"name": "Amazon Mobile Analytics", "description": "Collect, visualize, and understand app usage data at scale", "category": "Analytics", "baseUrl": "https://aws.amazon.com/mobileanalytics/", "authType": "apiKey"},
    {"name": "Clicky", "description": "Extract website traffic data into several formats", "category": "Analytics", "baseUrl": "https://clicky.com/help/api", "authType": "apiKey"},
    {"name": "DitchCarbon API", "description": "Company and product carbon emissions disclosures", "category": "Analytics", "baseUrl": "https://docs.ditchcarbon.com/", "authType": "apiKey"},
    {"name": "Matomo", "description": "All-in-one premium web analytics platform", "category": "Analytics", "baseUrl": "https://matomo.org/docs/analytics-api/", "authType": "apiKey"},
    {"name": "MixPanel", "description": "Analytics for mobile and web applications", "category": "Analytics", "baseUrl": "https://developer.mixpanel.com/", "authType": "apiKey"},
    {"name": "Open Web Analytics", "description": "Request and work with data outside OWA interface", "category": "Analytics", "baseUrl": "https://github.com/padams/Open-Web-Analytics", "authType": "none"},
    {"name": "Ticksel", "description": "Friendly website analytics made for humans", "category": "Analytics", "baseUrl": "https://ticksel.com", "authType": "apiKey"},
    {"name": "Woopra", "description": "Real-time website analysis targeting customer engagement", "category": "Analytics", "baseUrl": "https://www.woopra.com/docs/", "authType": "apiKey"},
    {"name": "Zoho Reports API", "description": "Build powerful reporting and analytical capabilities", "category": "Analytics", "baseUrl": "https://www.zoho.com/analytics/api/", "authType": "oauth"},
    
    # === AUGMENTED REALITY ===
    {"name": "Vuforia", "description": "Solid AR SDK with robust development options", "category": "AR/VR", "baseUrl": "https://library.vuforia.com/", "authType": "apiKey"},
    {"name": "Wikitude", "description": "All-in-one AR solution with image recognition & tracking", "category": "AR/VR", "baseUrl": "https://www.wikitude.com/", "authType": "apiKey"},
    {"name": "ARCore", "description": "Google's AR platform for Android", "category": "AR/VR", "baseUrl": "https://developers.google.com/ar", "authType": "apiKey"},
    {"name": "ARKit", "description": "Apple's AR framework for iOS", "category": "AR/VR", "baseUrl": "https://developer.apple.com/arkit/", "authType": "none"},
    {"name": "8th Wall", "description": "WebAR platform for browsers", "category": "AR/VR", "baseUrl": "https://www.8thwall.com/", "authType": "apiKey"},
    
    # === BARCODE ===
    {"name": "Dynamic QR Code", "description": "Generate dynamic and static QR Codes", "category": "Barcode", "baseUrl": "https://rapidapi.com/updeploy-tools/api/qr-code-dynamic-and-static1/", "authType": "apiKey"},
    {"name": "Google Barcode", "description": "Barcode detection in real-time on device", "category": "Barcode", "baseUrl": "https://developers.google.com/ml-kit/vision/barcode-scanning", "authType": "none"},
    {"name": "EAN-Search", "description": "Lookup products by EAN, UPC or GTIN barcode", "category": "Barcode", "baseUrl": "https://www.ean-search.org/ean-database-api.html", "authType": "apiKey"},
    {"name": "QR Code Generator API", "description": "Static and Dynamic QR code generator", "category": "Barcode", "baseUrl": "https://docs.openqr.io/", "authType": "apiKey"},
    
    # === BIG DATA ===
    {"name": "Google Charts", "description": "Free tool for visualizing data from websites", "category": "Big Data", "baseUrl": "https://developers.google.com/chart/", "authType": "none"},
    {"name": "Keen IO", "description": "Powerful, flexible Big Data solution", "category": "Big Data", "baseUrl": "https://keen.io/docs/", "authType": "apiKey"},
    {"name": "MongoDB Atlas", "description": "Global cloud database service", "category": "Big Data", "baseUrl": "https://www.mongodb.com/docs/atlas/", "authType": "apiKey"},
    {"name": "LinkedData.Center", "description": "RDF graph database as a service", "category": "Big Data", "baseUrl": "http://linkeddata.center/", "authType": "apiKey"},
    {"name": "Apache Spark", "description": "Unified analytics engine for big data", "category": "Big Data", "baseUrl": "https://spark.apache.org/docs/latest/api.html", "authType": "none"},
    
    # === CRYPTOCURRENCY ===
    {"name": "Bitcoin Core", "description": "Bitcoin node RPC API", "category": "Cryptocurrency", "baseUrl": "https://developer.bitcoin.org/", "authType": "basic"},
    {"name": "Bitcoincharts", "description": "Markets data for Bitcoin", "category": "Cryptocurrency", "baseUrl": "https://bitcoincharts.com/about/markets-api/", "authType": "none"},
    {"name": "BitPay", "description": "Bitcoin payment processing", "category": "Cryptocurrency", "baseUrl": "https://bitpay.com/api/", "authType": "apiKey"},
    {"name": "Block.io", "description": "Versatile and secure wallet for all coins", "category": "Cryptocurrency", "baseUrl": "https://block.io/api/", "authType": "apiKey"},
    {"name": "BlockCypher", "description": "Infrastructure fabric for blockchain apps", "category": "Cryptocurrency", "baseUrl": "https://www.blockcypher.com/dev/", "authType": "apiKey"},
    {"name": "BlockFacts", "description": "Compliance-first digital asset data", "category": "Cryptocurrency", "baseUrl": "https://blockfacts.io/", "authType": "apiKey"},
    {"name": "Coinbase", "description": "Bitcoin, Ethereum and crypto trading", "category": "Cryptocurrency", "baseUrl": "https://developers.coinbase.com/", "authType": "oauth"},
    {"name": "CoinDesk", "description": "Bitcoin Price Index", "category": "Cryptocurrency", "baseUrl": "https://www.coindesk.com/coindesk-api/", "authType": "none"},
    {"name": "CoinGecko", "description": "Cryptocurrency prices and market data", "category": "Cryptocurrency", "baseUrl": "https://www.coingecko.com/api/", "authType": "none"},
    {"name": "Coinlore", "description": "Cryptocurrency prices and volume", "category": "Cryptocurrency", "baseUrl": "https://www.coinlore.com/cryptocurrency-data-api", "authType": "none"},
    {"name": "CoinMarketCap", "description": "Cryptocurrency prices and rankings", "category": "Cryptocurrency", "baseUrl": "https://coinmarketcap.com/api/", "authType": "apiKey"},
    {"name": "Coinpaprika", "description": "Cryptocurrency prices and market cap", "category": "Cryptocurrency", "baseUrl": "https://api.coinpaprika.com/", "authType": "none"},
    {"name": "CryptoCompare", "description": "Cryptocurrency comparison and data", "category": "Cryptocurrency", "baseUrl": "https://min-api.cryptocompare.com/", "authType": "apiKey"},
    {"name": "Covalent", "description": "Multi-blockchain data aggregator", "category": "Cryptocurrency", "baseUrl": "https://www.covalenthq.com/docs/api/", "authType": "apiKey"},
    {"name": "Etherscan", "description": "Ethereum blockchain explorer API", "category": "Cryptocurrency", "baseUrl": "https://etherscan.io/apis", "authType": "apiKey"},
    {"name": "Solana JSON RPC", "description": "Solana blockchain interaction", "category": "Cryptocurrency", "baseUrl": "https://docs.solana.com/api", "authType": "none"},
    {"name": "The Graph", "description": "GraphQL indexing protocol for blockchains", "category": "Cryptocurrency", "baseUrl": "https://thegraph.com/docs/", "authType": "apiKey"},
    {"name": "Alchemy", "description": "Ethereum Node-as-a-Service", "category": "Cryptocurrency", "baseUrl": "https://docs.alchemy.com/", "authType": "apiKey"},
    {"name": "Infura", "description": "Ethereum and IPFS infrastructure", "category": "Cryptocurrency", "baseUrl": "https://infura.io/docs", "authType": "apiKey"},
    {"name": "Moralis", "description": "Web3 development platform", "category": "Cryptocurrency", "baseUrl": "https://docs.moralis.io/", "authType": "apiKey"},
    
    # === CALENDAR ===
    {"name": "CalendarIndex", "description": "Worldwide Holidays and Working Days API", "category": "Calendar", "baseUrl": "https://www.calendarindex.com/", "authType": "apiKey"},
    {"name": "DigiDates API", "description": "REST API for date and time calculations", "category": "Calendar", "baseUrl": "https://digidates.de/", "authType": "none"},
    {"name": "Holiday API", "description": "Public holiday API for several countries", "category": "Calendar", "baseUrl": "https://holidayapi.com/", "authType": "apiKey"},
    {"name": "OpenHolidays API", "description": "Public and school holidays for European countries", "category": "Calendar", "baseUrl": "https://www.openholidaysapi.org/", "authType": "none"},
    {"name": "Calendarific", "description": "Worldwide holidays API", "category": "Calendar", "baseUrl": "https://calendarific.com/", "authType": "apiKey"},
    {"name": "Nager.Date", "description": "Public holidays for 90+ countries", "category": "Calendar", "baseUrl": "https://date.nager.at/", "authType": "none"},
    
    # === CAPTCHA ===
    {"name": "Anti-Captcha", "description": "CAPTCHA solving service", "category": "Security", "baseUrl": "https://anti-captcha.com/apidoc", "authType": "apiKey"},
    {"name": "Google reCAPTCHA", "description": "Protect websites from spam and abuse", "category": "Security", "baseUrl": "https://developers.google.com/recaptcha/", "authType": "apiKey"},
    {"name": "hCaptcha", "description": "Privacy-focused CAPTCHA alternative", "category": "Security", "baseUrl": "https://docs.hcaptcha.com/", "authType": "apiKey"},
    
    # === COMMERCE ===
    {"name": "Commerce Layer", "description": "Headless commerce platform", "category": "Commerce", "baseUrl": "https://docs.commercelayer.io/", "authType": "oauth"},
    {"name": "Stripe", "description": "Online payment processing", "category": "Commerce", "baseUrl": "https://stripe.com/docs/api", "authType": "apiKey"},
    {"name": "Braintree", "description": "Mobile and web payments", "category": "Commerce", "baseUrl": "https://developers.braintreepayments.com/", "authType": "apiKey"},
    {"name": "Square", "description": "Payment and point of sale", "category": "Commerce", "baseUrl": "https://developer.squareup.com/", "authType": "oauth"},
    {"name": "PayPal", "description": "Online payments system", "category": "Commerce", "baseUrl": "https://developer.paypal.com/api/rest/", "authType": "oauth"},
    {"name": "Shopify", "description": "E-commerce platform API", "category": "Commerce", "baseUrl": "https://shopify.dev/api", "authType": "oauth"},
    {"name": "WooCommerce", "description": "WordPress e-commerce REST API", "category": "Commerce", "baseUrl": "https://woocommerce.github.io/woocommerce-rest-api-docs/", "authType": "oauth"},
    {"name": "Magento", "description": "E-commerce platform API", "category": "Commerce", "baseUrl": "https://devdocs.magento.com/guides/v2.4/rest/", "authType": "oauth"},
    {"name": "Klarna", "description": "Buy now pay later payments", "category": "Commerce", "baseUrl": "https://docs.klarna.com/", "authType": "apiKey"},
    {"name": "Adyen", "description": "Global payment platform", "category": "Commerce", "baseUrl": "https://docs.adyen.com/api-explorer/", "authType": "apiKey"},
    
    # === COMMUNICATION ===
    {"name": "Africa's Talking", "description": "Access African telco services via HTTP", "category": "Communication", "baseUrl": "https://africastalking.com/", "authType": "apiKey"},
    {"name": "iP1sms", "description": "Send and receive SMS worldwide", "category": "Communication", "baseUrl": "https://www.ip1sms.com/", "authType": "apiKey"},
    {"name": "Mailgun", "description": "Transactional Email API", "category": "Communication", "baseUrl": "https://documentation.mailgun.com/", "authType": "apiKey"},
    {"name": "Nexmo/Vonage", "description": "Voice, SMS, and messaging", "category": "Communication", "baseUrl": "https://developer.vonage.com/", "authType": "apiKey"},
    {"name": "Twilio", "description": "SMS, Voice, Video and more", "category": "Communication", "baseUrl": "https://www.twilio.com/docs/", "authType": "apiKey"},
    {"name": "SendGrid", "description": "Email delivery and marketing", "category": "Communication", "baseUrl": "https://docs.sendgrid.com/", "authType": "apiKey"},
    {"name": "Mailchimp", "description": "Email marketing platform", "category": "Communication", "baseUrl": "https://mailchimp.com/developer/", "authType": "apiKey"},
    {"name": "Postmark", "description": "Transactional email service", "category": "Communication", "baseUrl": "https://postmarkapp.com/developer", "authType": "apiKey"},
    {"name": "MessageBird", "description": "Omnichannel messaging platform", "category": "Communication", "baseUrl": "https://developers.messagebird.com/", "authType": "apiKey"},
    {"name": "Plivo", "description": "Cloud communications platform", "category": "Communication", "baseUrl": "https://www.plivo.com/docs/", "authType": "apiKey"},
    
    # === CONTENT ===
    {"name": "Bible API", "description": "Bible translations and verses", "category": "Content", "baseUrl": "https://bible-api.com/", "authType": "none"},
    {"name": "Jokes API", "description": "Full featured jokes database", "category": "Content", "baseUrl": "https://jokes.one/api/joke/", "authType": "apiKey"},
    {"name": "Perfect Tense", "description": "AI spelling and grammar checking", "category": "Content", "baseUrl": "https://www.perfecttense.com/developers", "authType": "apiKey"},
    {"name": "Wikipedia", "description": "Free multilingual encyclopedia", "category": "Content", "baseUrl": "https://en.wikipedia.org/w/api.php", "authType": "none"},
    {"name": "Random Facts", "description": "Random interesting facts", "category": "Content", "baseUrl": "https://fungenerators.com/api/facts/", "authType": "apiKey"},
    {"name": "Quotable", "description": "Random quotes API", "category": "Content", "baseUrl": "https://github.com/lukePeavey/quotable", "authType": "none"},
    {"name": "News API", "description": "Headlines and articles from news sources", "category": "Content", "baseUrl": "https://newsapi.org/", "authType": "apiKey"},
    {"name": "Mediastack", "description": "Live news and blog articles", "category": "Content", "baseUrl": "https://mediastack.com/", "authType": "apiKey"},
    
    # === CURRENCY ===
    {"name": "1Forge", "description": "Forex currency market data", "category": "Currency", "baseUrl": "https://1forge.com/", "authType": "apiKey"},
    {"name": "CurrencyLayer", "description": "Exchange rates and currency conversion", "category": "Currency", "baseUrl": "https://currencylayer.com/", "authType": "apiKey"},
    {"name": "Fixer.io", "description": "Foreign exchange rates and conversion", "category": "Currency", "baseUrl": "https://fixer.io/", "authType": "apiKey"},
    {"name": "Open Exchange Rates", "description": "Real-time and historical exchange rates", "category": "Currency", "baseUrl": "https://openexchangerates.org/", "authType": "apiKey"},
    {"name": "Frankfurter", "description": "Exchange rates and currency data", "category": "Currency", "baseUrl": "https://www.frankfurter.app/", "authType": "none"},
    {"name": "ExchangeRate-API", "description": "Free currency conversion", "category": "Currency", "baseUrl": "https://www.exchangerate-api.com/", "authType": "apiKey"},
    
    # === DESIGN ===
    {"name": "Dribbble", "description": "Design community and portfolio", "category": "Design", "baseUrl": "https://developer.dribbble.com/", "authType": "oauth"},
    {"name": "Icon Horse", "description": "Favicon logos for any website", "category": "Design", "baseUrl": "https://icon.horse/", "authType": "none"},
    {"name": "Pexels", "description": "Free stock photos", "category": "Design", "baseUrl": "https://www.pexels.com/api/", "authType": "apiKey"},
    {"name": "Unsplash", "description": "Beautiful free images", "category": "Design", "baseUrl": "https://unsplash.com/developers", "authType": "apiKey"},
    {"name": "Pixabay", "description": "Free images and videos", "category": "Design", "baseUrl": "https://pixabay.com/api/docs/", "authType": "apiKey"},
    {"name": "Figma", "description": "Design collaboration platform API", "category": "Design", "baseUrl": "https://www.figma.com/developers/api", "authType": "oauth"},
    {"name": "Canva", "description": "Design platform API", "category": "Design", "baseUrl": "https://www.canva.com/developers/", "authType": "oauth"},
    
    # === DICTIONARIES ===
    {"name": "Free Dictionary API", "description": "Word definitions for free", "category": "Dictionary", "baseUrl": "https://dictionaryapi.dev/", "authType": "none"},
    {"name": "Merriam-Webster", "description": "Dictionary and Thesaurus", "category": "Dictionary", "baseUrl": "https://dictionaryapi.com/", "authType": "apiKey"},
    {"name": "Oxford Dictionary", "description": "English dictionary and thesaurus", "category": "Dictionary", "baseUrl": "https://developer.oxforddictionaries.com/", "authType": "apiKey"},
    {"name": "Wordnik", "description": "Dictionary and word data", "category": "Dictionary", "baseUrl": "https://developer.wordnik.com/", "authType": "apiKey"},
    {"name": "Words API", "description": "Definitions for 150,000+ words", "category": "Dictionary", "baseUrl": "https://www.wordsapi.com/", "authType": "apiKey"},
    {"name": "Datamuse", "description": "Word-finding query engine", "category": "Dictionary", "baseUrl": "https://www.datamuse.com/api/", "authType": "none"},
    
    # === ENTERTAINMENT ===
    {"name": "AniList", "description": "Anime discovery and tracking", "category": "Entertainment", "baseUrl": "https://anilist.gitbook.io/anilist-apiv2-docs/", "authType": "oauth"},
    {"name": "Jikan", "description": "Unofficial MyAnimeList API", "category": "Entertainment", "baseUrl": "https://jikan.moe/", "authType": "none"},
    {"name": "TMDB", "description": "Movie and TV database", "category": "Entertainment", "baseUrl": "https://developers.themoviedb.org/", "authType": "apiKey"},
    {"name": "OMDb", "description": "Open Movie Database", "category": "Entertainment", "baseUrl": "https://www.omdbapi.com/", "authType": "apiKey"},
    {"name": "TVmaze", "description": "TV show information", "category": "Entertainment", "baseUrl": "https://www.tvmaze.com/api", "authType": "none"},
    {"name": "IGDB", "description": "Video game database", "category": "Entertainment", "baseUrl": "https://api-docs.igdb.com/", "authType": "oauth"},
    {"name": "RAWG", "description": "Video games database", "category": "Entertainment", "baseUrl": "https://rawg.io/apidocs", "authType": "apiKey"},
    {"name": "Spotify", "description": "Music streaming API", "category": "Entertainment", "baseUrl": "https://developer.spotify.com/documentation/web-api/", "authType": "oauth"},
    {"name": "Last.fm", "description": "Music listening data", "category": "Entertainment", "baseUrl": "https://www.last.fm/api", "authType": "apiKey"},
    {"name": "Deezer", "description": "Music streaming service API", "category": "Entertainment", "baseUrl": "https://developers.deezer.com/api", "authType": "oauth"},
    {"name": "YouTube Data API", "description": "YouTube videos and playlists", "category": "Entertainment", "baseUrl": "https://developers.google.com/youtube/v3", "authType": "apiKey"},
    {"name": "Twitch", "description": "Live streaming platform API", "category": "Entertainment", "baseUrl": "https://dev.twitch.tv/docs/api/", "authType": "oauth"},
    {"name": "Discord", "description": "Chat platform API", "category": "Entertainment", "baseUrl": "https://discord.com/developers/docs/intro", "authType": "oauth"},
    {"name": "Steam", "description": "Gaming platform API", "category": "Entertainment", "baseUrl": "https://steamcommunity.com/dev", "authType": "apiKey"},
    {"name": "Epic Games Store", "description": "Game store API", "category": "Entertainment", "baseUrl": "https://dev.epicgames.com/docs/", "authType": "oauth"},
    
    # === ENVIRONMENT ===
    {"name": "Carbon Interface", "description": "Carbon emissions estimates", "category": "Environment", "baseUrl": "https://docs.carboninterface.com/", "authType": "apiKey"},
    {"name": "Climatiq", "description": "Environmental footprint calculation", "category": "Environment", "baseUrl": "https://docs.climatiq.io/", "authType": "apiKey"},
    {"name": "OpenAQ", "description": "Open air quality data", "category": "Environment", "baseUrl": "https://docs.openaq.org/", "authType": "apiKey"},
    {"name": "IQAir", "description": "Air quality and weather data", "category": "Environment", "baseUrl": "https://www.iqair.com/air-pollution-data-api", "authType": "apiKey"},
    {"name": "UK Carbon Intensity", "description": "Carbon intensity for Great Britain", "category": "Environment", "baseUrl": "https://carbonintensity.org.uk/", "authType": "none"},
    
    # === EVENTS ===
    {"name": "Eventbrite", "description": "Event discovery and ticketing", "category": "Events", "baseUrl": "https://www.eventbrite.com/platform/api/", "authType": "oauth"},
    {"name": "SeatGeek", "description": "Event and ticket search", "category": "Events", "baseUrl": "https://platform.seatgeek.com/", "authType": "apiKey"},
    {"name": "Ticketmaster", "description": "Event discovery and ticketing", "category": "Events", "baseUrl": "https://developer.ticketmaster.com/", "authType": "apiKey"},
    {"name": "Meetup", "description": "Event discovery platform", "category": "Events", "baseUrl": "https://www.meetup.com/api/", "authType": "oauth"},
    
    # === FINANCE ===
    {"name": "Alpha Vantage", "description": "Stock market data", "category": "Finance", "baseUrl": "https://www.alphavantage.co/", "authType": "apiKey"},
    {"name": "IEX Cloud", "description": "Financial market data", "category": "Finance", "baseUrl": "https://iexcloud.io/docs/", "authType": "apiKey"},
    {"name": "Twelve Data", "description": "Stock and forex data", "category": "Finance", "baseUrl": "https://twelvedata.com/docs/", "authType": "apiKey"},
    {"name": "Finnhub", "description": "Real-time stock data", "category": "Finance", "baseUrl": "https://finnhub.io/docs/api/", "authType": "apiKey"},
    {"name": "Polygon.io", "description": "Stock market data", "category": "Finance", "baseUrl": "https://polygon.io/docs/", "authType": "apiKey"},
    {"name": "Yahoo Finance", "description": "Stock and finance data", "category": "Finance", "baseUrl": "https://finance.yahoo.com/", "authType": "apiKey"},
    {"name": "Plaid", "description": "Bank account connections", "category": "Finance", "baseUrl": "https://plaid.com/docs/", "authType": "apiKey"},
    {"name": "Tradier", "description": "Equity and option market data", "category": "Finance", "baseUrl": "https://developer.tradier.com/", "authType": "oauth"},
    {"name": "Alpaca", "description": "Stock trading API", "category": "Finance", "baseUrl": "https://alpaca.markets/docs/", "authType": "apiKey"},
    {"name": "Interactive Brokers", "description": "Trading platform API", "category": "Finance", "baseUrl": "https://www.interactivebrokers.com/en/trading/ib-api.php", "authType": "apiKey"},
    
    # === FOOD & DRINK ===
    {"name": "Edamam Nutrition", "description": "Nutrition analysis API", "category": "Food", "baseUrl": "https://developer.edamam.com/", "authType": "apiKey"},
    {"name": "Edamam Recipes", "description": "Recipe search API", "category": "Food", "baseUrl": "https://developer.edamam.com/", "authType": "apiKey"},
    {"name": "Spoonacular", "description": "Recipes and meal planning", "category": "Food", "baseUrl": "https://spoonacular.com/food-api", "authType": "apiKey"},
    {"name": "TheMealDB", "description": "Meal recipes database", "category": "Food", "baseUrl": "https://www.themealdb.com/api.php", "authType": "apiKey"},
    {"name": "TheCocktailDB", "description": "Cocktail recipes database", "category": "Food", "baseUrl": "https://www.thecocktaildb.com/api.php", "authType": "apiKey"},
    {"name": "Open Food Facts", "description": "Food products database", "category": "Food", "baseUrl": "https://world.openfoodfacts.org/data", "authType": "none"},
    {"name": "Untappd", "description": "Beer discovery and social", "category": "Food", "baseUrl": "https://untappd.com/api/docs", "authType": "oauth"},
    {"name": "Zomato", "description": "Restaurant discovery", "category": "Food", "baseUrl": "https://developers.zomato.com/api", "authType": "apiKey"},
    {"name": "Yelp Fusion", "description": "Local business search", "category": "Food", "baseUrl": "https://www.yelp.com/developers/documentation/v3", "authType": "apiKey"},
    
    # === GAMES ===
    {"name": "Pokemon API", "description": "Pokemon data", "category": "Games", "baseUrl": "https://pokeapi.co/", "authType": "none"},
    {"name": "Marvel", "description": "Marvel comics data", "category": "Games", "baseUrl": "https://developer.marvel.com/", "authType": "apiKey"},
    {"name": "Rick and Morty", "description": "Rick and Morty data", "category": "Games", "baseUrl": "https://rickandmortyapi.com/", "authType": "none"},
    {"name": "Star Wars API", "description": "Star Wars data", "category": "Games", "baseUrl": "https://swapi.dev/", "authType": "none"},
    {"name": "Open Trivia DB", "description": "Trivia questions database", "category": "Games", "baseUrl": "https://opentdb.com/api_config.php", "authType": "none"},
    {"name": "Deck of Cards", "description": "Deck of cards simulation", "category": "Games", "baseUrl": "https://deckofcardsapi.com/", "authType": "none"},
    {"name": "Board Game Geek", "description": "Board game database", "category": "Games", "baseUrl": "https://boardgamegeek.com/wiki/page/BGG_XML_API2", "authType": "none"},
    {"name": "Chess.com", "description": "Chess game data", "category": "Games", "baseUrl": "https://www.chess.com/news/view/published-data-api", "authType": "none"},
    
    # === GEOCODING ===
    {"name": "Google Maps", "description": "Maps and geolocation", "category": "Geocoding", "baseUrl": "https://developers.google.com/maps", "authType": "apiKey"},
    {"name": "Mapbox", "description": "Maps and navigation", "category": "Geocoding", "baseUrl": "https://docs.mapbox.com/", "authType": "apiKey"},
    {"name": "OpenStreetMap", "description": "Open source mapping", "category": "Geocoding", "baseUrl": "https://wiki.openstreetmap.org/wiki/API", "authType": "oauth"},
    {"name": "HERE Maps", "description": "Location and mapping", "category": "Geocoding", "baseUrl": "https://developer.here.com/", "authType": "apiKey"},
    {"name": "OpenCage", "description": "Forward and reverse geocoding", "category": "Geocoding", "baseUrl": "https://opencagedata.com/api", "authType": "apiKey"},
    {"name": "Nominatim", "description": "OpenStreetMap geocoding", "category": "Geocoding", "baseUrl": "https://nominatim.org/release-docs/latest/api/", "authType": "none"},
    {"name": "IP Geolocation", "description": "IP address to location", "category": "Geocoding", "baseUrl": "https://ip-api.com/docs/", "authType": "none"},
    {"name": "ipinfo.io", "description": "IP geolocation and data", "category": "Geocoding", "baseUrl": "https://ipinfo.io/developers", "authType": "apiKey"},
    {"name": "MaxMind GeoIP2", "description": "IP geolocation database", "category": "Geocoding", "baseUrl": "https://dev.maxmind.com/geoip/", "authType": "apiKey"},
    {"name": "What3Words", "description": "Address system using 3 words", "category": "Geocoding", "baseUrl": "https://developer.what3words.com/", "authType": "apiKey"},
    
    # === GOVERNMENT ===
    {"name": "USA.gov", "description": "US government data", "category": "Government", "baseUrl": "https://www.usa.gov/developers/", "authType": "apiKey"},
    {"name": "UK Government", "description": "UK government data", "category": "Government", "baseUrl": "https://www.gov.uk/api/", "authType": "none"},
    {"name": "EU Open Data Portal", "description": "European Union data", "category": "Government", "baseUrl": "https://data.europa.eu/api/hub/search/", "authType": "none"},
    {"name": "Data.gov", "description": "US open data", "category": "Government", "baseUrl": "https://api.data.gov/", "authType": "apiKey"},
    {"name": "SCB (Statistics Sweden)", "description": "Swedish statistics", "category": "Government", "baseUrl": "https://www.scb.se/en/services/open-data-api/", "authType": "none"},
    {"name": "Bolagsverket", "description": "Swedish company register", "category": "Government", "baseUrl": "https://bolagsverket.se/", "authType": "apiKey"},
    
    # === HEALTH ===
    {"name": "OpenFDA", "description": "US FDA drug and device data", "category": "Health", "baseUrl": "https://open.fda.gov/apis/", "authType": "none"},
    {"name": "HealthCare.gov", "description": "US health insurance marketplace", "category": "Health", "baseUrl": "https://www.healthcare.gov/developers/", "authType": "apiKey"},
    {"name": "NPPES NPI Registry", "description": "US healthcare provider registry", "category": "Health", "baseUrl": "https://npiregistry.cms.hhs.gov/api/", "authType": "none"},
    {"name": "BetterDoctor", "description": "Doctor and practice search", "category": "Health", "baseUrl": "https://betterdoctor.com/api/", "authType": "apiKey"},
    {"name": "FHIR", "description": "Healthcare interoperability standard", "category": "Health", "baseUrl": "https://www.hl7.org/fhir/", "authType": "oauth"},
    {"name": "Human API", "description": "Personal health data", "category": "Health", "baseUrl": "https://www.humanapi.co/developers", "authType": "oauth"},
    
    # === IOT ===
    {"name": "Particle", "description": "IoT device management", "category": "IoT", "baseUrl": "https://docs.particle.io/reference/cloud-apis/api/", "authType": "apiKey"},
    {"name": "ThingSpeak", "description": "IoT data platform", "category": "IoT", "baseUrl": "https://thingspeak.com/docs/", "authType": "apiKey"},
    {"name": "Blynk", "description": "IoT platform for hardware", "category": "IoT", "baseUrl": "https://blynk.io/en/developers", "authType": "apiKey"},
    {"name": "Adafruit IO", "description": "IoT cloud service", "category": "IoT", "baseUrl": "https://io.adafruit.com/api/docs/", "authType": "apiKey"},
    {"name": "AWS IoT", "description": "Amazon IoT services", "category": "IoT", "baseUrl": "https://docs.aws.amazon.com/iot/", "authType": "apiKey"},
    {"name": "Azure IoT Hub", "description": "Microsoft IoT services", "category": "IoT", "baseUrl": "https://docs.microsoft.com/en-us/azure/iot-hub/", "authType": "apiKey"},
    {"name": "Google Cloud IoT", "description": "Google IoT services", "category": "IoT", "baseUrl": "https://cloud.google.com/iot-core/docs", "authType": "apiKey"},
    {"name": "Philips Hue", "description": "Smart lighting control", "category": "IoT", "baseUrl": "https://developers.meethue.com/", "authType": "oauth"},
    {"name": "SmartThings", "description": "Smart home platform", "category": "IoT", "baseUrl": "https://developer.smartthings.com/docs/api-ref/", "authType": "oauth"},
    {"name": "Home Assistant", "description": "Home automation platform", "category": "IoT", "baseUrl": "https://developers.home-assistant.io/docs/api/", "authType": "bearer"},
    
    # === JOBS ===
    {"name": "Adzuna", "description": "Job search API", "category": "Jobs", "baseUrl": "https://developer.adzuna.com/", "authType": "apiKey"},
    {"name": "GitHub Jobs", "description": "Tech job listings", "category": "Jobs", "baseUrl": "https://jobs.github.com/api", "authType": "none"},
    {"name": "Indeed", "description": "Job search platform", "category": "Jobs", "baseUrl": "https://www.indeed.com/publisher", "authType": "apiKey"},
    {"name": "LinkedIn Jobs", "description": "Professional job listings", "category": "Jobs", "baseUrl": "https://www.linkedin.com/developers/", "authType": "oauth"},
    {"name": "Remotive", "description": "Remote job listings", "category": "Jobs", "baseUrl": "https://remotive.io/api-documentation", "authType": "none"},
    {"name": "The Muse", "description": "Career and job data", "category": "Jobs", "baseUrl": "https://www.themuse.com/developers/api/v2", "authType": "apiKey"},
    {"name": "Glassdoor", "description": "Company reviews and salaries", "category": "Jobs", "baseUrl": "https://www.glassdoor.com/developer/", "authType": "apiKey"},
    
    # === MACHINE LEARNING ===
    {"name": "OpenAI", "description": "GPT and AI models", "category": "AI/ML", "baseUrl": "https://platform.openai.com/docs/api-reference", "authType": "apiKey"},
    {"name": "Anthropic Claude", "description": "Claude AI assistant", "category": "AI/ML", "baseUrl": "https://docs.anthropic.com/claude/reference/", "authType": "apiKey"},
    {"name": "Google Vertex AI", "description": "Google AI platform", "category": "AI/ML", "baseUrl": "https://cloud.google.com/vertex-ai/docs", "authType": "apiKey"},
    {"name": "AWS Bedrock", "description": "Foundation models on AWS", "category": "AI/ML", "baseUrl": "https://docs.aws.amazon.com/bedrock/", "authType": "apiKey"},
    {"name": "Hugging Face", "description": "ML models and datasets", "category": "AI/ML", "baseUrl": "https://huggingface.co/docs/api-inference/", "authType": "apiKey"},
    {"name": "Replicate", "description": "ML model hosting", "category": "AI/ML", "baseUrl": "https://replicate.com/docs", "authType": "apiKey"},
    {"name": "Cohere", "description": "NLP and language models", "category": "AI/ML", "baseUrl": "https://docs.cohere.ai/reference/", "authType": "apiKey"},
    {"name": "AI21 Labs", "description": "Language models", "category": "AI/ML", "baseUrl": "https://docs.ai21.com/reference/", "authType": "apiKey"},
    {"name": "Stability AI", "description": "Image generation models", "category": "AI/ML", "baseUrl": "https://platform.stability.ai/docs/", "authType": "apiKey"},
    {"name": "Midjourney", "description": "AI image generation", "category": "AI/ML", "baseUrl": "https://docs.midjourney.com/", "authType": "apiKey"},
    {"name": "ElevenLabs", "description": "AI voice synthesis", "category": "AI/ML", "baseUrl": "https://docs.elevenlabs.io/", "authType": "apiKey"},
    {"name": "AssemblyAI", "description": "Speech-to-text API", "category": "AI/ML", "baseUrl": "https://www.assemblyai.com/docs/", "authType": "apiKey"},
    {"name": "Deepgram", "description": "Speech recognition API", "category": "AI/ML", "baseUrl": "https://developers.deepgram.com/", "authType": "apiKey"},
    {"name": "Whisper (OpenAI)", "description": "Speech recognition model", "category": "AI/ML", "baseUrl": "https://platform.openai.com/docs/guides/speech-to-text", "authType": "apiKey"},
    {"name": "DALL-E", "description": "AI image generation", "category": "AI/ML", "baseUrl": "https://platform.openai.com/docs/guides/images", "authType": "apiKey"},
    {"name": "GPT-4 Vision", "description": "AI vision analysis", "category": "AI/ML", "baseUrl": "https://platform.openai.com/docs/guides/vision", "authType": "apiKey"},
    {"name": "Clarifai", "description": "Computer vision AI", "category": "AI/ML", "baseUrl": "https://docs.clarifai.com/", "authType": "apiKey"},
    {"name": "AWS Rekognition", "description": "Image and video analysis", "category": "AI/ML", "baseUrl": "https://docs.aws.amazon.com/rekognition/", "authType": "apiKey"},
    {"name": "Google Vision AI", "description": "Image analysis", "category": "AI/ML", "baseUrl": "https://cloud.google.com/vision/docs", "authType": "apiKey"},
    {"name": "Azure Computer Vision", "description": "Image analysis API", "category": "AI/ML", "baseUrl": "https://docs.microsoft.com/en-us/azure/cognitive-services/computer-vision/", "authType": "apiKey"},
    
    # === MAPS ===
    {"name": "TomTom", "description": "Maps and navigation", "category": "Maps", "baseUrl": "https://developer.tomtom.com/", "authType": "apiKey"},
    {"name": "Bing Maps", "description": "Microsoft maps platform", "category": "Maps", "baseUrl": "https://docs.microsoft.com/en-us/bingmaps/", "authType": "apiKey"},
    {"name": "Yandex Maps", "description": "Russian maps platform", "category": "Maps", "baseUrl": "https://yandex.com/dev/maps/", "authType": "apiKey"},
    {"name": "Leaflet", "description": "Open source JS maps library", "category": "Maps", "baseUrl": "https://leafletjs.com/reference.html", "authType": "none"},
    {"name": "OpenLayers", "description": "Open source map library", "category": "Maps", "baseUrl": "https://openlayers.org/en/latest/apidoc/", "authType": "none"},
    
    # === MUSIC ===
    {"name": "Genius", "description": "Song lyrics and annotations", "category": "Music", "baseUrl": "https://docs.genius.com/", "authType": "oauth"},
    {"name": "Musixmatch", "description": "Lyrics database", "category": "Music", "baseUrl": "https://developer.musixmatch.com/", "authType": "apiKey"},
    {"name": "SoundCloud", "description": "Audio streaming platform", "category": "Music", "baseUrl": "https://developers.soundcloud.com/", "authType": "oauth"},
    {"name": "Bandcamp", "description": "Music and merchandise", "category": "Music", "baseUrl": "https://bandcamp.com/developer", "authType": "oauth"},
    {"name": "MusicBrainz", "description": "Music metadata database", "category": "Music", "baseUrl": "https://musicbrainz.org/doc/MusicBrainz_API", "authType": "none"},
    {"name": "AudioScrobbler (Last.fm)", "description": "Music scrobbling data", "category": "Music", "baseUrl": "https://www.last.fm/api", "authType": "apiKey"},
    {"name": "Shazam", "description": "Music recognition", "category": "Music", "baseUrl": "https://rapidapi.com/shazam/api/shazam", "authType": "apiKey"},
    {"name": "Apple Music", "description": "Music streaming service", "category": "Music", "baseUrl": "https://developer.apple.com/documentation/applemusicapi", "authType": "oauth"},
    
    # === NEWS ===
    {"name": "New York Times", "description": "NYT articles and data", "category": "News", "baseUrl": "https://developer.nytimes.com/", "authType": "apiKey"},
    {"name": "The Guardian", "description": "Guardian news API", "category": "News", "baseUrl": "https://open-platform.theguardian.com/", "authType": "apiKey"},
    {"name": "Currents API", "description": "Latest news articles", "category": "News", "baseUrl": "https://currentsapi.services/en", "authType": "apiKey"},
    {"name": "GNews", "description": "Google News aggregation", "category": "News", "baseUrl": "https://gnews.io/docs/", "authType": "apiKey"},
    {"name": "Hacker News", "description": "Tech news and discussions", "category": "News", "baseUrl": "https://github.com/HackerNews/API", "authType": "none"},
    {"name": "Reddit", "description": "Social news aggregation", "category": "News", "baseUrl": "https://www.reddit.com/dev/api/", "authType": "oauth"},
    {"name": "Dev.to", "description": "Developer community", "category": "News", "baseUrl": "https://developers.forem.com/api", "authType": "apiKey"},
    {"name": "Product Hunt", "description": "Tech product launches", "category": "News", "baseUrl": "https://api.producthunt.com/v2/docs", "authType": "oauth"},
    
    # === OPEN DATA ===
    {"name": "World Bank", "description": "Global development data", "category": "Open Data", "baseUrl": "https://datahelpdesk.worldbank.org/knowledgebase/topics/125589", "authType": "none"},
    {"name": "UN Data", "description": "United Nations statistics", "category": "Open Data", "baseUrl": "https://data.un.org/", "authType": "none"},
    {"name": "OECD", "description": "Economic data", "category": "Open Data", "baseUrl": "https://data.oecd.org/api/", "authType": "none"},
    {"name": "NASA", "description": "Space and science data", "category": "Open Data", "baseUrl": "https://api.nasa.gov/", "authType": "apiKey"},
    {"name": "USGS", "description": "US geological data", "category": "Open Data", "baseUrl": "https://www.usgs.gov/products/data-and-tools/apis", "authType": "none"},
    {"name": "NOAA", "description": "Weather and climate data", "category": "Open Data", "baseUrl": "https://www.ncdc.noaa.gov/cdo-web/webservices/v2", "authType": "apiKey"},
    
    # === PAYMENTS ===
    {"name": "Swish", "description": "Swedish mobile payments", "category": "Payments", "baseUrl": "https://developer.swish.nu/", "authType": "certificate"},
    {"name": "iDEAL", "description": "Dutch online payments", "category": "Payments", "baseUrl": "https://www.ideal.nl/en/developers/", "authType": "certificate"},
    {"name": "Bancontact", "description": "Belgian payment system", "category": "Payments", "baseUrl": "https://developer.bancontact.com/", "authType": "apiKey"},
    {"name": "MobilePay", "description": "Danish mobile payments", "category": "Payments", "baseUrl": "https://developer.mobilepay.dk/", "authType": "oauth"},
    {"name": "Vipps", "description": "Norwegian mobile payments", "category": "Payments", "baseUrl": "https://vippsas.github.io/vipps-developers/", "authType": "oauth"},
    {"name": "Revolut", "description": "Digital banking API", "category": "Payments", "baseUrl": "https://developer.revolut.com/", "authType": "oauth"},
    {"name": "Wise (TransferWise)", "description": "International transfers", "category": "Payments", "baseUrl": "https://api-docs.wise.com/", "authType": "oauth"},
    {"name": "Checkout.com", "description": "Payment processing", "category": "Payments", "baseUrl": "https://api-reference.checkout.com/", "authType": "apiKey"},
    {"name": "Mollie", "description": "European payments", "category": "Payments", "baseUrl": "https://docs.mollie.com/", "authType": "apiKey"},
    {"name": "GoCardless", "description": "Direct debit payments", "category": "Payments", "baseUrl": "https://developer.gocardless.com/", "authType": "apiKey"},
    
    # === PHOTOGRAPHY ===
    {"name": "Flickr", "description": "Photo sharing platform", "category": "Photography", "baseUrl": "https://www.flickr.com/services/api/", "authType": "oauth"},
    {"name": "500px", "description": "Photography community", "category": "Photography", "baseUrl": "https://github.com/500px/legacy-api-documentation", "authType": "oauth"},
    {"name": "Getty Images", "description": "Stock photography", "category": "Photography", "baseUrl": "https://developers.gettyimages.com/", "authType": "apiKey"},
    {"name": "Shutterstock", "description": "Stock images and videos", "category": "Photography", "baseUrl": "https://developers.shutterstock.com/", "authType": "oauth"},
    {"name": "Adobe Stock", "description": "Stock content", "category": "Photography", "baseUrl": "https://www.adobe.io/apis/creativecloud/stock.html", "authType": "oauth"},
    {"name": "Lorem Picsum", "description": "Random placeholder images", "category": "Photography", "baseUrl": "https://picsum.photos/", "authType": "none"},
    {"name": "PlaceImg", "description": "Placeholder images by category", "category": "Photography", "baseUrl": "https://placeimg.com/", "authType": "none"},
    
    # === SCIENCE ===
    {"name": "arXiv", "description": "Scientific papers", "category": "Science", "baseUrl": "https://arxiv.org/help/api/", "authType": "none"},
    {"name": "PubMed", "description": "Biomedical literature", "category": "Science", "baseUrl": "https://www.ncbi.nlm.nih.gov/home/develop/api/", "authType": "apiKey"},
    {"name": "Crossref", "description": "Scholarly metadata", "category": "Science", "baseUrl": "https://www.crossref.org/services/metadata-retrieval/", "authType": "none"},
    {"name": "Semantic Scholar", "description": "AI-powered paper search", "category": "Science", "baseUrl": "https://api.semanticscholar.org/", "authType": "apiKey"},
    {"name": "CORE", "description": "Open access papers", "category": "Science", "baseUrl": "https://core.ac.uk/services/api/", "authType": "apiKey"},
    {"name": "SpaceX", "description": "SpaceX launch data", "category": "Science", "baseUrl": "https://github.com/r-spacex/SpaceX-API", "authType": "none"},
    {"name": "Launch Library 2", "description": "Space launch data", "category": "Science", "baseUrl": "https://thespacedevs.com/llapi", "authType": "none"},
    {"name": "Wolfram Alpha", "description": "Computational knowledge", "category": "Science", "baseUrl": "https://products.wolframalpha.com/api/", "authType": "apiKey"},
    {"name": "Newton", "description": "Math calculations API", "category": "Science", "baseUrl": "https://newton.vercel.app/", "authType": "none"},
    {"name": "NumbersAPI", "description": "Facts about numbers", "category": "Science", "baseUrl": "http://numbersapi.com/", "authType": "none"},
    
    # === SECURITY ===
    {"name": "VirusTotal", "description": "File and URL analysis", "category": "Security", "baseUrl": "https://developers.virustotal.com/", "authType": "apiKey"},
    {"name": "Have I Been Pwned", "description": "Data breach checking", "category": "Security", "baseUrl": "https://haveibeenpwned.com/API/", "authType": "apiKey"},
    {"name": "Shodan", "description": "Internet-connected devices search", "category": "Security", "baseUrl": "https://developer.shodan.io/", "authType": "apiKey"},
    {"name": "AbuseIPDB", "description": "IP reputation database", "category": "Security", "baseUrl": "https://docs.abuseipdb.com/", "authType": "apiKey"},
    {"name": "SecurityTrails", "description": "DNS and domain intelligence", "category": "Security", "baseUrl": "https://securitytrails.com/corp/apidocs", "authType": "apiKey"},
    {"name": "Censys", "description": "Internet security data", "category": "Security", "baseUrl": "https://censys.io/api", "authType": "apiKey"},
    {"name": "CIRCL", "description": "Threat intelligence", "category": "Security", "baseUrl": "https://www.circl.lu/services/", "authType": "apiKey"},
    {"name": "AlienVault OTX", "description": "Open threat exchange", "category": "Security", "baseUrl": "https://otx.alienvault.com/api", "authType": "apiKey"},
    {"name": "URLScan", "description": "URL analysis service", "category": "Security", "baseUrl": "https://urlscan.io/docs/api/", "authType": "apiKey"},
    
    # === SOCIAL ===
    {"name": "Twitter/X", "description": "Social media platform API", "category": "Social", "baseUrl": "https://developer.twitter.com/en/docs", "authType": "oauth"},
    {"name": "Facebook Graph", "description": "Facebook data API", "category": "Social", "baseUrl": "https://developers.facebook.com/docs/graph-api/", "authType": "oauth"},
    {"name": "Instagram Basic Display", "description": "Instagram user data", "category": "Social", "baseUrl": "https://developers.facebook.com/docs/instagram-basic-display-api/", "authType": "oauth"},
    {"name": "LinkedIn", "description": "Professional network API", "category": "Social", "baseUrl": "https://www.linkedin.com/developers/", "authType": "oauth"},
    {"name": "Pinterest", "description": "Visual discovery platform", "category": "Social", "baseUrl": "https://developers.pinterest.com/docs/api/v5/", "authType": "oauth"},
    {"name": "Snapchat", "description": "Snap Kit APIs", "category": "Social", "baseUrl": "https://kit.snapchat.com/", "authType": "oauth"},
    {"name": "TikTok", "description": "TikTok for developers", "category": "Social", "baseUrl": "https://developers.tiktok.com/doc/", "authType": "oauth"},
    {"name": "Mastodon", "description": "Decentralized social network", "category": "Social", "baseUrl": "https://docs.joinmastodon.org/api/", "authType": "oauth"},
    {"name": "Bluesky", "description": "Decentralized social network", "category": "Social", "baseUrl": "https://atproto.com/docs/", "authType": "oauth"},
    {"name": "Threads", "description": "Meta's text-based social app", "category": "Social", "baseUrl": "https://developers.facebook.com/docs/threads/", "authType": "oauth"},
    {"name": "Telegram Bot", "description": "Telegram messaging bots", "category": "Social", "baseUrl": "https://core.telegram.org/bots/api", "authType": "apiKey"},
    {"name": "Slack", "description": "Team communication API", "category": "Social", "baseUrl": "https://api.slack.com/", "authType": "oauth"},
    {"name": "WhatsApp Business", "description": "WhatsApp messaging", "category": "Social", "baseUrl": "https://developers.facebook.com/docs/whatsapp/", "authType": "oauth"},
    {"name": "Signal", "description": "Encrypted messaging", "category": "Social", "baseUrl": "https://signal.org/docs/", "authType": "none"},
    
    # === SPORTS ===
    {"name": "ESPN", "description": "Sports data and scores", "category": "Sports", "baseUrl": "https://www.espn.com/apis/devcenter/", "authType": "apiKey"},
    {"name": "Sportmonks", "description": "Football/soccer data", "category": "Sports", "baseUrl": "https://docs.sportmonks.com/football/", "authType": "apiKey"},
    {"name": "API-FOOTBALL", "description": "Football statistics", "category": "Sports", "baseUrl": "https://www.api-football.com/documentation-v3", "authType": "apiKey"},
    {"name": "NBA Stats", "description": "NBA basketball data", "category": "Sports", "baseUrl": "https://github.com/swar/nba_api", "authType": "none"},
    {"name": "MLB Stats", "description": "Baseball statistics", "category": "Sports", "baseUrl": "https://statsapi.mlb.com/docs/", "authType": "none"},
    {"name": "NHL Stats", "description": "Hockey statistics", "category": "Sports", "baseUrl": "https://gitlab.com/dword4/nhlapi", "authType": "none"},
    {"name": "OpenLigaDB", "description": "German football data", "category": "Sports", "baseUrl": "https://www.openligadb.de/", "authType": "none"},
    {"name": "Strava", "description": "Fitness activity data", "category": "Sports", "baseUrl": "https://developers.strava.com/", "authType": "oauth"},
    {"name": "Fitbit", "description": "Fitness tracking data", "category": "Sports", "baseUrl": "https://dev.fitbit.com/", "authType": "oauth"},
    {"name": "Withings", "description": "Health and fitness devices", "category": "Sports", "baseUrl": "https://developer.withings.com/api-reference", "authType": "oauth"},
    
    # === TRANSPORTATION ===
    {"name": "Google Directions", "description": "Route planning", "category": "Transportation", "baseUrl": "https://developers.google.com/maps/documentation/directions/", "authType": "apiKey"},
    {"name": "OpenRouteService", "description": "Open source routing", "category": "Transportation", "baseUrl": "https://openrouteservice.org/dev/", "authType": "apiKey"},
    {"name": "OSRM", "description": "Open source routing machine", "category": "Transportation", "baseUrl": "http://project-osrm.org/docs/v5.24.0/api/", "authType": "none"},
    {"name": "Uber", "description": "Ride-sharing API", "category": "Transportation", "baseUrl": "https://developer.uber.com/docs/", "authType": "oauth"},
    {"name": "Lyft", "description": "Ride-sharing service", "category": "Transportation", "baseUrl": "https://www.lyft.com/developers", "authType": "oauth"},
    {"name": "Citymapper", "description": "Urban navigation", "category": "Transportation", "baseUrl": "https://citymapper.com/developers", "authType": "apiKey"},
    {"name": "Rome2Rio", "description": "Multi-modal travel search", "category": "Transportation", "baseUrl": "https://www.rome2rio.com/documentation/", "authType": "apiKey"},
    {"name": "FlightAware", "description": "Flight tracking data", "category": "Transportation", "baseUrl": "https://flightaware.com/commercial/aeroapi/", "authType": "apiKey"},
    {"name": "AviationStack", "description": "Real-time flight data", "category": "Transportation", "baseUrl": "https://aviationstack.com/documentation", "authType": "apiKey"},
    {"name": "ADS-B Exchange", "description": "Aircraft tracking data", "category": "Transportation", "baseUrl": "https://www.adsbexchange.com/data/", "authType": "apiKey"},
    {"name": "OpenSky Network", "description": "Flight tracking network", "category": "Transportation", "baseUrl": "https://opensky-network.org/apidoc/", "authType": "none"},
    {"name": "Transport API", "description": "UK public transport", "category": "Transportation", "baseUrl": "https://developer.transportapi.com/", "authType": "apiKey"},
    {"name": "Deutsche Bahn", "description": "German railways", "category": "Transportation", "baseUrl": "https://developer.deutschebahn.com/", "authType": "apiKey"},
    {"name": "SL (Stockholm)", "description": "Stockholm public transport", "category": "Transportation", "baseUrl": "https://www.trafiklab.se/api", "authType": "apiKey"},
    {"name": "Västtrafik", "description": "Swedish public transport", "category": "Transportation", "baseUrl": "https://developer.vasttrafik.se/", "authType": "oauth"},
    {"name": "Skånetrafiken", "description": "Swedish public transport", "category": "Transportation", "baseUrl": "https://www.skanetrafiken.se/", "authType": "apiKey"},
    {"name": "Marine Traffic", "description": "Ship tracking", "category": "Transportation", "baseUrl": "https://www.marinetraffic.com/en/ais-api-services", "authType": "apiKey"},
    {"name": "VesselFinder", "description": "Ship tracking API", "category": "Transportation", "baseUrl": "https://api.vesselfinder.com/docs/", "authType": "apiKey"},
    
    # === URL SHORTENERS ===
    {"name": "Bitly", "description": "URL shortening service", "category": "URL Shorteners", "baseUrl": "https://dev.bitly.com/", "authType": "oauth"},
    {"name": "Rebrandly", "description": "Branded link management", "category": "URL Shorteners", "baseUrl": "https://developers.rebrandly.com/", "authType": "apiKey"},
    {"name": "TinyURL", "description": "Simple URL shortener", "category": "URL Shorteners", "baseUrl": "https://tinyurl.com/app/dev", "authType": "apiKey"},
    {"name": "Short.io", "description": "White label URL shortener", "category": "URL Shorteners", "baseUrl": "https://developers.short.io/", "authType": "apiKey"},
    {"name": "Kutt", "description": "Open source URL shortener", "category": "URL Shorteners", "baseUrl": "https://kutt.it/", "authType": "apiKey"},
    
    # === VEHICLE ===
    {"name": "NHTSA", "description": "US vehicle safety data", "category": "Vehicle", "baseUrl": "https://vpic.nhtsa.dot.gov/api/", "authType": "none"},
    {"name": "Tesla", "description": "Tesla vehicle API", "category": "Vehicle", "baseUrl": "https://tesla-api.timdorr.com/", "authType": "oauth"},
    {"name": "Smartcar", "description": "Connected car platform", "category": "Vehicle", "baseUrl": "https://smartcar.com/docs/", "authType": "oauth"},
    {"name": "Edmunds", "description": "Vehicle data and pricing", "category": "Vehicle", "baseUrl": "https://developer.edmunds.com/", "authType": "apiKey"},
    {"name": "CarMD", "description": "Vehicle diagnostics", "category": "Vehicle", "baseUrl": "https://www.carmd.com/api/", "authType": "apiKey"},
    {"name": "VIN Decoder", "description": "Vehicle identification", "category": "Vehicle", "baseUrl": "https://vindecoder.eu/api", "authType": "apiKey"},
    
    # === VIDEO ===
    {"name": "Vimeo", "description": "Video hosting platform", "category": "Video", "baseUrl": "https://developer.vimeo.com/api", "authType": "oauth"},
    {"name": "Dailymotion", "description": "Video platform API", "category": "Video", "baseUrl": "https://developer.dailymotion.com/", "authType": "oauth"},
    {"name": "Mux", "description": "Video streaming API", "category": "Video", "baseUrl": "https://docs.mux.com/", "authType": "apiKey"},
    {"name": "Cloudflare Stream", "description": "Video streaming platform", "category": "Video", "baseUrl": "https://developers.cloudflare.com/stream/", "authType": "apiKey"},
    {"name": "Brightcove", "description": "Video hosting and CDN", "category": "Video", "baseUrl": "https://apis.support.brightcove.com/", "authType": "oauth"},
    {"name": "JW Player", "description": "Video player platform", "category": "Video", "baseUrl": "https://developer.jwplayer.com/", "authType": "apiKey"},
    {"name": "Wistia", "description": "Business video hosting", "category": "Video", "baseUrl": "https://wistia.com/support/developers", "authType": "apiKey"},
    {"name": "Kaltura", "description": "Video platform", "category": "Video", "baseUrl": "https://developer.kaltura.com/api-docs/", "authType": "apiKey"},
    
    # === WEATHER ===
    {"name": "OpenWeatherMap", "description": "Weather data and forecasts", "category": "Weather", "baseUrl": "https://openweathermap.org/api", "authType": "apiKey"},
    {"name": "WeatherAPI", "description": "Weather and geo data", "category": "Weather", "baseUrl": "https://www.weatherapi.com/docs/", "authType": "apiKey"},
    {"name": "Weather Underground", "description": "Weather data network", "category": "Weather", "baseUrl": "https://www.wunderground.com/weather/api/", "authType": "apiKey"},
    {"name": "AccuWeather", "description": "Weather forecasting", "category": "Weather", "baseUrl": "https://developer.accuweather.com/", "authType": "apiKey"},
    {"name": "Dark Sky", "description": "Weather forecasts (Apple)", "category": "Weather", "baseUrl": "https://darksky.net/dev", "authType": "apiKey"},
    {"name": "ClimaCell/Tomorrow.io", "description": "Weather intelligence", "category": "Weather", "baseUrl": "https://docs.tomorrow.io/", "authType": "apiKey"},
    {"name": "Visual Crossing", "description": "Historical weather data", "category": "Weather", "baseUrl": "https://www.visualcrossing.com/weather-api", "authType": "apiKey"},
    {"name": "Open-Meteo", "description": "Free weather API", "category": "Weather", "baseUrl": "https://open-meteo.com/", "authType": "none"},
    {"name": "Met.no", "description": "Norwegian weather service", "category": "Weather", "baseUrl": "https://api.met.no/", "authType": "none"},
    {"name": "SMHI", "description": "Swedish weather data", "category": "Weather", "baseUrl": "https://opendata.smhi.se/apidocs/", "authType": "none"},
    {"name": "DMI (Denmark)", "description": "Danish weather service", "category": "Weather", "baseUrl": "https://opendatadocs.dmi.govcloud.dk/", "authType": "apiKey"},
    
    # === DEVELOPMENT ===
    {"name": "GitHub", "description": "Code hosting and collaboration", "category": "Development", "baseUrl": "https://docs.github.com/rest", "authType": "oauth"},
    {"name": "GitLab", "description": "DevOps platform", "category": "Development", "baseUrl": "https://docs.gitlab.com/ee/api/", "authType": "oauth"},
    {"name": "Bitbucket", "description": "Git repository hosting", "category": "Development", "baseUrl": "https://developer.atlassian.com/cloud/bitbucket/", "authType": "oauth"},
    {"name": "Jira", "description": "Project management", "category": "Development", "baseUrl": "https://developer.atlassian.com/cloud/jira/platform/", "authType": "oauth"},
    {"name": "Confluence", "description": "Team documentation", "category": "Development", "baseUrl": "https://developer.atlassian.com/cloud/confluence/", "authType": "oauth"},
    {"name": "Notion", "description": "Workspace platform", "category": "Development", "baseUrl": "https://developers.notion.com/", "authType": "bearer"},
    {"name": "Airtable", "description": "Spreadsheet database", "category": "Development", "baseUrl": "https://airtable.com/api", "authType": "apiKey"},
    {"name": "Supabase", "description": "Open source Firebase alternative", "category": "Development", "baseUrl": "https://supabase.com/docs/reference", "authType": "apiKey"},
    {"name": "Firebase", "description": "App development platform", "category": "Development", "baseUrl": "https://firebase.google.com/docs/reference", "authType": "apiKey"},
    {"name": "Heroku", "description": "Cloud platform", "category": "Development", "baseUrl": "https://devcenter.heroku.com/articles/platform-api-reference", "authType": "oauth"},
    {"name": "Vercel", "description": "Frontend deployment platform", "category": "Development", "baseUrl": "https://vercel.com/docs/api", "authType": "bearer"},
    {"name": "Netlify", "description": "Web deployment platform", "category": "Development", "baseUrl": "https://docs.netlify.com/api/", "authType": "bearer"},
    {"name": "Railway", "description": "Infrastructure platform", "category": "Development", "baseUrl": "https://docs.railway.app/reference/public-api", "authType": "bearer"},
    {"name": "Render", "description": "Cloud platform", "category": "Development", "baseUrl": "https://api-docs.render.com/", "authType": "apiKey"},
    {"name": "DigitalOcean", "description": "Cloud infrastructure", "category": "Development", "baseUrl": "https://docs.digitalocean.com/reference/api/", "authType": "bearer"},
    {"name": "Linode", "description": "Cloud hosting", "category": "Development", "baseUrl": "https://www.linode.com/docs/api/", "authType": "bearer"},
    {"name": "Vultr", "description": "Cloud compute", "category": "Development", "baseUrl": "https://www.vultr.com/api/", "authType": "apiKey"},
    {"name": "AWS", "description": "Amazon Web Services", "category": "Development", "baseUrl": "https://docs.aws.amazon.com/", "authType": "apiKey"},
    {"name": "Google Cloud", "description": "Google Cloud Platform", "category": "Development", "baseUrl": "https://cloud.google.com/apis/docs/overview", "authType": "oauth"},
    {"name": "Azure", "description": "Microsoft Azure", "category": "Development", "baseUrl": "https://docs.microsoft.com/en-us/rest/api/azure/", "authType": "oauth"},
    {"name": "npm Registry", "description": "JavaScript package registry", "category": "Development", "baseUrl": "https://docs.npmjs.com/api", "authType": "apiKey"},
    {"name": "PyPI", "description": "Python package index", "category": "Development", "baseUrl": "https://warehouse.pypa.io/api-reference/", "authType": "apiKey"},
    {"name": "RubyGems", "description": "Ruby package manager", "category": "Development", "baseUrl": "https://guides.rubygems.org/rubygems-org-api/", "authType": "apiKey"},
    {"name": "Docker Hub", "description": "Container registry", "category": "Development", "baseUrl": "https://docs.docker.com/docker-hub/api/latest/", "authType": "bearer"},
    {"name": "CircleCI", "description": "CI/CD platform", "category": "Development", "baseUrl": "https://circleci.com/docs/api/v2/", "authType": "apiKey"},
    {"name": "Travis CI", "description": "CI service", "category": "Development", "baseUrl": "https://docs.travis-ci.com/api/", "authType": "apiKey"},
    {"name": "GitHub Actions", "description": "CI/CD for GitHub", "category": "Development", "baseUrl": "https://docs.github.com/en/rest/actions", "authType": "bearer"},
    {"name": "Sentry", "description": "Error tracking", "category": "Development", "baseUrl": "https://docs.sentry.io/api/", "authType": "bearer"},
    {"name": "Datadog", "description": "Monitoring platform", "category": "Development", "baseUrl": "https://docs.datadoghq.com/api/latest/", "authType": "apiKey"},
    {"name": "New Relic", "description": "Application monitoring", "category": "Development", "baseUrl": "https://docs.newrelic.com/docs/apis/", "authType": "apiKey"},
    {"name": "PagerDuty", "description": "Incident management", "category": "Development", "baseUrl": "https://developer.pagerduty.com/api-reference/", "authType": "apiKey"},
    {"name": "Segment", "description": "Customer data platform", "category": "Development", "baseUrl": "https://segment.com/docs/api/", "authType": "apiKey"},
    {"name": "Amplitude", "description": "Product analytics", "category": "Development", "baseUrl": "https://developers.amplitude.com/docs/", "authType": "apiKey"},
    {"name": "Mixpanel", "description": "Product analytics", "category": "Development", "baseUrl": "https://developer.mixpanel.com/reference", "authType": "apiKey"},
    {"name": "PostHog", "description": "Product analytics", "category": "Development", "baseUrl": "https://posthog.com/docs/api", "authType": "apiKey"},
    {"name": "LaunchDarkly", "description": "Feature management", "category": "Development", "baseUrl": "https://apidocs.launchdarkly.com/", "authType": "apiKey"},
    {"name": "Split.io", "description": "Feature flagging", "category": "Development", "baseUrl": "https://help.split.io/hc/en-us/articles/360020548491-API", "authType": "apiKey"},
    {"name": "Flagsmith", "description": "Feature flags", "category": "Development", "baseUrl": "https://docs.flagsmith.com/basic-features/managing-features", "authType": "apiKey"},
    {"name": "Linear", "description": "Issue tracking", "category": "Development", "baseUrl": "https://developers.linear.app/", "authType": "oauth"},
    {"name": "Asana", "description": "Work management", "category": "Development", "baseUrl": "https://developers.asana.com/docs", "authType": "oauth"},
    {"name": "Monday.com", "description": "Work OS", "category": "Development", "baseUrl": "https://api.developer.monday.com/docs", "authType": "apiKey"},
    {"name": "ClickUp", "description": "Project management", "category": "Development", "baseUrl": "https://clickup.com/api", "authType": "oauth"},
    {"name": "Trello", "description": "Kanban boards", "category": "Development", "baseUrl": "https://developer.atlassian.com/cloud/trello/", "authType": "oauth"},
    {"name": "Todoist", "description": "Task management", "category": "Development", "baseUrl": "https://developer.todoist.com/rest/v2/", "authType": "oauth"},
    {"name": "Zapier", "description": "Workflow automation", "category": "Development", "baseUrl": "https://zapier.com/apps/zapier/integrations", "authType": "oauth"},
    {"name": "Make (Integromat)", "description": "Automation platform", "category": "Development", "baseUrl": "https://www.make.com/en/api-documentation", "authType": "apiKey"},
    {"name": "n8n", "description": "Workflow automation", "category": "Development", "baseUrl": "https://docs.n8n.io/api/", "authType": "apiKey"},
    {"name": "Pipedream", "description": "Integration platform", "category": "Development", "baseUrl": "https://pipedream.com/docs/api/rest/", "authType": "apiKey"},
    {"name": "Intercom", "description": "Customer messaging", "category": "Development", "baseUrl": "https://developers.intercom.com/docs/references/rest-api/", "authType": "bearer"},
    {"name": "Zendesk", "description": "Customer service", "category": "Development", "baseUrl": "https://developer.zendesk.com/api-reference/", "authType": "oauth"},
    {"name": "Freshdesk", "description": "Helpdesk software", "category": "Development", "baseUrl": "https://developers.freshdesk.com/api/", "authType": "apiKey"},
    {"name": "HubSpot", "description": "CRM and marketing", "category": "Development", "baseUrl": "https://developers.hubspot.com/docs/api/overview", "authType": "oauth"},
    {"name": "Salesforce", "description": "CRM platform", "category": "Development", "baseUrl": "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/", "authType": "oauth"},
    {"name": "Pipedrive", "description": "Sales CRM", "category": "Development", "baseUrl": "https://developers.pipedrive.com/docs/api/v1", "authType": "oauth"},
    {"name": "Close.com", "description": "Sales CRM", "category": "Development", "baseUrl": "https://developer.close.com/", "authType": "apiKey"},
    {"name": "Calendly", "description": "Scheduling platform", "category": "Development", "baseUrl": "https://developer.calendly.com/api-docs", "authType": "oauth"},
    {"name": "Cal.com", "description": "Open source scheduling", "category": "Development", "baseUrl": "https://cal.com/docs/api-reference/v1", "authType": "apiKey"},
    {"name": "Typeform", "description": "Forms and surveys", "category": "Development", "baseUrl": "https://developer.typeform.com/", "authType": "oauth"},
    {"name": "SurveyMonkey", "description": "Survey platform", "category": "Development", "baseUrl": "https://developer.surveymonkey.com/api/v3/", "authType": "oauth"},
    {"name": "Google Forms", "description": "Form builder", "category": "Development", "baseUrl": "https://developers.google.com/forms/api", "authType": "oauth"},
]

def main():
    print("🦞 APIClaw Night Expansion 03:00")
    print("=" * 50)
    
    # Load current registry
    registry = load_registry()
    current_count = registry.get("count", 0)
    apis = registry.get("apis", [])
    
    print(f"Current count: {current_count}")
    
    # Get existing API names to avoid duplicates
    existing_names = set(api.get("name", "").lower() for api in apis)
    
    # Add new APIs
    added = 0
    for new_api in NEW_APIS:
        if new_api["name"].lower() not in existing_names:
            api_entry = {
                "id": generate_id(new_api["name"], new_api["category"]),
                "name": new_api["name"],
                "description": new_api["description"],
                "category": new_api["category"],
                "baseUrl": new_api["baseUrl"],
                "authType": new_api["authType"],
                "pricingModel": "freemium",
                "source": "night-expansion-03"
            }
            apis.append(api_entry)
            existing_names.add(new_api["name"].lower())
            added += 1
    
    # Update registry
    registry["apis"] = apis
    registry["count"] = len(apis)
    registry["lastUpdated"] = datetime.now().isoformat()
    registry["source"] = "night-expansion-03"
    
    # Save
    save_registry(registry)
    
    print(f"✅ Added: {added} APIs")
    print(f"📊 New total: {len(apis)}")
    
    # Return stats for logging
    return {
        "before": current_count,
        "after": len(apis),
        "added": added
    }

if __name__ == "__main__":
    stats = main()
    print(f"\n📈 Progress: {stats['before']} → {stats['after']} (+{stats['added']})")
