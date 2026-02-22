#!/usr/bin/env python3
"""
APIClaw Night Expansion - Batch 05:00
Target: Add 1000+ APIs from curated sources
"""

import json
import os
from datetime import datetime

REGISTRY_PATH = os.path.expanduser("~/Projects/apiclaw/src/registry/apis.json")

# Curated API batch from n0shake/Public-APIs + additional sources
NEW_APIS = [
    # Advertising
    {"name": "Amazon Mobile Ads", "description": "Monetize across platforms with multiple ad formats", "category": "Advertising", "baseUrl": "https://developer.amazon.com/mobile-ads", "authType": "apiKey"},
    {"name": "Facebook Marketing API", "description": "Manage ads and campaigns using the Facebook API", "category": "Advertising", "baseUrl": "https://developers.facebook.com/docs/marketing-apis", "authType": "oauth2"},
    {"name": "Google AdSense API", "description": "Free, flexible way to earn money from websites and mobile sites", "category": "Advertising", "baseUrl": "https://developers.google.com/adsense", "authType": "oauth2"},
    {"name": "Google AdWords API", "description": "Manage Google AdWords campaigns programmatically", "category": "Advertising", "baseUrl": "https://developers.google.com/adwords/api", "authType": "oauth2"},
    {"name": "Kevel Ad APIs", "description": "Build your own ad server with Kevel's ad APIs", "category": "Advertising", "baseUrl": "https://dev.kevel.co", "authType": "apiKey"},
    {"name": "Microsoft Bing Ads API", "description": "Programmatic access to advertising technologies", "category": "Advertising", "baseUrl": "https://learn.microsoft.com/en-us/advertising/guides", "authType": "oauth2"},
    
    # Analytics
    {"name": "Amazon Mobile Analytics", "description": "Service for collecting, visualizing app usage data at scale", "category": "Analytics", "baseUrl": "https://aws.amazon.com/mobileanalytics", "authType": "apiKey"},
    {"name": "Clicky Analytics API", "description": "Extract website traffic data into several formats", "category": "Analytics", "baseUrl": "https://clicky.com/help/api", "authType": "apiKey"},
    {"name": "DitchCarbon API", "description": "Company and product carbon emissions disclosures API", "category": "Analytics", "baseUrl": "https://docs.ditchcarbon.com", "authType": "apiKey"},
    {"name": "Fabric Analytics", "description": "Mobile analytics platform for building better apps", "category": "Analytics", "baseUrl": "https://firebase.google.com", "authType": "apiKey"},
    {"name": "Localytics API", "description": "Interface to Localytics analytics platform", "category": "Analytics", "baseUrl": "https://docs.localytics.com/dev/query-api.html", "authType": "apiKey"},
    {"name": "Matomo Analytics API", "description": "All-in-one premium web analytics platform", "category": "Analytics", "baseUrl": "https://matomo.org/docs/analytics-api", "authType": "apiKey"},
    {"name": "MixPanel API", "description": "Analytics for mobile and web applications", "category": "Analytics", "baseUrl": "https://developer.mixpanel.com", "authType": "apiKey"},
    {"name": "Open Web Analytics", "description": "Request and work with OWA data outside reporting interface", "category": "Analytics", "baseUrl": "https://github.com/padams/Open-Web-Analytics", "authType": "none"},
    {"name": "Ticksel Analytics", "description": "Friendly website analytics made for humans", "category": "Analytics", "baseUrl": "https://ticksel.com", "authType": "apiKey"},
    {"name": "Woopra Analytics API", "description": "Real-time website analysis targeting customer engagement", "category": "Analytics", "baseUrl": "https://www.woopra.com/docs/developer/analytics-api", "authType": "apiKey"},
    {"name": "Zoho Reports API", "description": "Build powerful reporting and analytical capabilities", "category": "Analytics", "baseUrl": "https://www.zoho.com/analytics/api", "authType": "oauth2"},
    
    # AR/VR
    {"name": "Vuforia AR SDK", "description": "Solid SDK with robust AR development options", "category": "Augmented Reality", "baseUrl": "https://library.vuforia.com", "authType": "apiKey"},
    {"name": "Wikitude AR SDK", "description": "All-in-one AR solution with image recognition and 3D rendering", "category": "Augmented Reality", "baseUrl": "https://www.wikitude.com/download", "authType": "apiKey"},
    
    # Barcode
    {"name": "Dynamic QR Code API", "description": "Generate dynamic and static QR Codes", "category": "Barcode", "baseUrl": "https://rapidapi.com/updeploy-tools/api/qr-code-dynamic-and-static1", "authType": "apiKey"},
    {"name": "Google Barcode API", "description": "Detects barcodes in real-time on device", "category": "Barcode", "baseUrl": "https://developers.google.com/vision/barcodes-overview", "authType": "apiKey"},
    {"name": "EAN-Search API", "description": "Lookup products by EAN, UPC or GTIN barcode", "category": "Barcode", "baseUrl": "https://www.ean-search.org/ean-database-api.html", "authType": "apiKey"},
    {"name": "QR Code Generator API", "description": "Static and Dynamic QR code generator", "category": "Barcode", "baseUrl": "https://docs.openqr.io", "authType": "apiKey"},
    {"name": "FunGenerators QR API", "description": "QR Code REST API for creating and reading QR codes", "category": "Barcode", "baseUrl": "https://fungenerators.com/api/qrcode", "authType": "apiKey"},
    
    # Big Data
    {"name": "Google Charts API", "description": "Free tool for visualizing data from websites", "category": "Big Data", "baseUrl": "https://developers.google.com/chart", "authType": "none"},
    {"name": "Keen IO API", "description": "Powerful, flexible Big Data solution", "category": "Big Data", "baseUrl": "https://keen.io/docs/api", "authType": "apiKey"},
    {"name": "LinkedData.Center", "description": "RDF graph database as a service with SPARQL APIs", "category": "Big Data", "baseUrl": "http://linkeddata.center", "authType": "apiKey"},
    
    # Cryptocurrency
    {"name": "Bitcoin Developer API", "description": "Resources and guides for Bitcoin development", "category": "Cryptocurrency", "baseUrl": "https://developer.bitcoin.org", "authType": "none"},
    {"name": "Bitcoincharts API", "description": "Markets data for websites and apps", "category": "Cryptocurrency", "baseUrl": "https://bitcoincharts.com/about/markets-api", "authType": "none"},
    {"name": "BitPay API", "description": "RESTful API to Bitcoin infrastructure", "category": "Cryptocurrency", "baseUrl": "https://bitpay.com/developers", "authType": "apiKey"},
    {"name": "Block.io", "description": "Versatile and secure wallet for all coins", "category": "Cryptocurrency", "baseUrl": "https://block.io", "authType": "apiKey"},
    {"name": "BlockCypher", "description": "Infrastructure fabric for blockchain applications", "category": "Cryptocurrency", "baseUrl": "https://www.blockcypher.com", "authType": "apiKey"},
    {"name": "BlockFacts.io", "description": "Compliance-first digital asset data with REST and WebSocket", "category": "Cryptocurrency", "baseUrl": "https://blockfacts.io", "authType": "apiKey"},
    {"name": "Coinbase API", "description": "APIs and developer tools for bitcoin and blockchain apps", "category": "Cryptocurrency", "baseUrl": "https://developers.coinbase.com", "authType": "oauth2"},
    {"name": "CoinDesk Bitcoin Price Index", "description": "Bitcoin Price Index API", "category": "Cryptocurrency", "baseUrl": "http://www.coindesk.com/api", "authType": "none"},
    {"name": "CoinGecko API", "description": "Free cryptocurrency API without API key", "category": "Cryptocurrency", "baseUrl": "https://www.coingecko.com/en/api", "authType": "none"},
    {"name": "Coinlore API", "description": "Cryptocurrency tick data API", "category": "Cryptocurrency", "baseUrl": "https://www.coinlore.com/cryptocurrency-data-api", "authType": "none"},
    {"name": "CoinMarketCap API", "description": "Cryptocurrencies prices API", "category": "Cryptocurrency", "baseUrl": "https://coinmarketcap.com/api", "authType": "apiKey"},
    {"name": "CoinPaprika API", "description": "Cryptocurrencies prices, market cap, volume and more", "category": "Cryptocurrency", "baseUrl": "https://api.coinpaprika.com", "authType": "none"},
    {"name": "CryptoCompare API", "description": "Cryptocurrencies comparison data", "category": "Cryptocurrency", "baseUrl": "https://www.cryptocompare.com/api", "authType": "apiKey"},
    {"name": "Cryptonator API", "description": "Cryptocurrencies exchange rates", "category": "Cryptocurrency", "baseUrl": "https://www.cryptonator.com/api", "authType": "none"},
    {"name": "Coinigy API", "description": "Interact with Coinigy and Exchange accounts", "category": "Cryptocurrency", "baseUrl": "https://coinigy.docs.apiary.io", "authType": "apiKey"},
    {"name": "Covalent API", "description": "Multi-blockchain data aggregator unified API", "category": "Cryptocurrency", "baseUrl": "https://www.covalenthq.com/docs/api", "authType": "apiKey"},
    {"name": "Blockchain Exchange Rates", "description": "Market prices and exchange rates API", "category": "Cryptocurrency", "baseUrl": "https://blockchain.info/api/exchange_rates_api", "authType": "none"},
    {"name": "PENDAX SDK", "description": "SDK for Trading, Data, Websockets for FTX, OKX, Bybit", "category": "Cryptocurrency", "baseUrl": "https://github.com/CompendiumFi/PENDAX-SDK", "authType": "apiKey"},
    {"name": "Poloniex API", "description": "US based digital asset exchange", "category": "Cryptocurrency", "baseUrl": "https://poloniex.com/support/api", "authType": "apiKey"},
    {"name": "ShapeShift API", "description": "Exchange between cryptocurrencies without account", "category": "Cryptocurrency", "baseUrl": "https://shapeshift.io", "authType": "none"},
    {"name": "Technical Analysis Crypto", "description": "Cryptocurrency prices, technical analysis and sentiment", "category": "Cryptocurrency", "baseUrl": "https://technical-analysis-api.com", "authType": "apiKey"},
    
    # Calendar
    {"name": "CalendarIndex API", "description": "Worldwide Holidays and Working Days API", "category": "Calendar", "baseUrl": "https://www.calendarindex.com", "authType": "apiKey"},
    {"name": "DigiDates API", "description": "REST API for date and time calculations", "category": "Calendar", "baseUrl": "https://digidates.de/en", "authType": "none"},
    {"name": "Holiday API", "description": "Public holiday API for several countries", "category": "Calendar", "baseUrl": "https://holidayapi.com", "authType": "apiKey"},
    {"name": "OpenHolidays API", "description": "Public and school holidays for European countries", "category": "Calendar", "baseUrl": "https://www.openholidaysapi.org", "authType": "none"},
    
    # Captcha
    {"name": "Anti-Captcha API", "description": "Access to Anti-Captcha solving service", "category": "Security", "baseUrl": "https://anti-captcha.com/apidoc", "authType": "apiKey"},
    {"name": "ProxyCrawl API", "description": "Crawl and scrape websites without proxies", "category": "Web Scraping", "baseUrl": "https://proxycrawl.com", "authType": "apiKey"},
    {"name": "Google reCAPTCHA", "description": "Embed CAPTCHA in web pages against spam", "category": "Security", "baseUrl": "https://developers.google.com/recaptcha", "authType": "apiKey"},
    
    # Check-In
    {"name": "Facebook Check-In API", "description": "Check-in to location-based Pages", "category": "Social", "baseUrl": "https://developers.facebook.com/docs/graph-api", "authType": "oauth2"},
    {"name": "Google Places API", "description": "Access to Google Places data", "category": "Maps", "baseUrl": "https://developers.google.com/places", "authType": "apiKey"},
    {"name": "Foursquare Check-In API", "description": "Check in to places programmatically", "category": "Social", "baseUrl": "https://developer.foursquare.com", "authType": "oauth2"},
    
    # Commerce
    {"name": "Commerce Layer API", "description": "Headless commerce platform for global ecommerce", "category": "E-Commerce", "baseUrl": "https://docs.commercelayer.io/api", "authType": "oauth2"},
    {"name": "Envoice API", "description": "Invoicing for online businesses", "category": "Finance", "baseUrl": "https://www.envoice.in/reference/api/docs", "authType": "apiKey"},
    {"name": "Koomalooma BPaaS", "description": "Loyalty Business Process as a Service", "category": "E-Commerce", "baseUrl": "http://business.koomalooma.com", "authType": "apiKey"},
    {"name": "Moltin E-Commerce", "description": "Unified APIs for inventory, carts, checkout, payments", "category": "E-Commerce", "baseUrl": "https://www.moltin.com/developers", "authType": "apiKey"},
    {"name": "Repetiti 3D Printer API", "description": "3D Printer Management Service API", "category": "IoT", "baseUrl": "https://developers.repetiti.com", "authType": "apiKey"},
    {"name": "Braintree Payments", "description": "Mobile and web payment systems for ecommerce", "category": "Payments", "baseUrl": "https://developers.braintreepayments.com", "authType": "apiKey"},
    {"name": "Yellow Pages API", "description": "Data for all business categories in US cities", "category": "Business", "baseUrl": "https://github.com/Hrushi11/Yellow-Pages-End-API", "authType": "none"},
    
    # Communication
    {"name": "Africa's Talking", "description": "Access African telco services via HTTP API", "category": "Communication", "baseUrl": "https://africastalking.com", "authType": "apiKey"},
    {"name": "iP1sms API", "description": "Send and receive SMS worldwide", "category": "SMS", "baseUrl": "https://www.ip1sms.com/en/developer", "authType": "apiKey"},
    {"name": "Eqivo Telephony", "description": "Telephony/Programmable-Voice API platform", "category": "Communication", "baseUrl": "https://eqivo.org", "authType": "apiKey"},
    {"name": "MailGun API", "description": "Transactional Email API Service For Developers", "category": "Email", "baseUrl": "https://mailgun.com", "authType": "apiKey"},
    {"name": "Nexmo API", "description": "Make and receive phone calls, send SMS worldwide", "category": "Communication", "baseUrl": "https://developer.nexmo.com", "authType": "apiKey"},
    {"name": "Sakari SMS API", "description": "Send and Receive SMS to 200+ countries", "category": "SMS", "baseUrl": "https://developer.sakari.io", "authType": "apiKey"},
    {"name": "Telnyx Communication API", "description": "Build Voice, SMS, Fax, Networking and IoT applications", "category": "Communication", "baseUrl": "https://developers.telnyx.com", "authType": "apiKey"},
    {"name": "The SMS Works", "description": "Low-cost, reliable SMS API for developers", "category": "SMS", "baseUrl": "https://thesmsworks.co.uk/sms-api", "authType": "apiKey"},
    
    # Content
    {"name": "Bible API", "description": "Lightning-fast Bible API with 200+ translations", "category": "Content", "baseUrl": "https://github.com/wldeh/bible-api", "authType": "none"},
    {"name": "Bible JSON API", "description": "JSON API for public domain bible translations", "category": "Content", "baseUrl": "https://bible-api.com", "authType": "none"},
    {"name": "Fruits API GraphQL", "description": "GraphQL API with fruit trees information", "category": "Content", "baseUrl": "https://github.com/Franqsanz/fruits-api", "authType": "none"},
    {"name": "Jokes API", "description": "Full featured Jokes API", "category": "Entertainment", "baseUrl": "https://jokes.one/api/joke", "authType": "apiKey"},
    {"name": "Perfect Tense API", "description": "AI-powered spelling and grammar checking", "category": "Text", "baseUrl": "https://www.perfecttense.com/developers", "authType": "apiKey"},
    {"name": "qKast Channel Content", "description": "Access live content collections from web pages", "category": "Content", "baseUrl": "https://github.com/egfx/qKast", "authType": "apiKey"},
    {"name": "Randommer API", "description": "Generator for phones, text, numbers, passwords, names", "category": "Data Generation", "baseUrl": "https://randommer.io/randommer-api", "authType": "apiKey"},
    {"name": "Random Facts API", "description": "Random Facts API service", "category": "Entertainment", "baseUrl": "https://fungenerators.com/api/facts", "authType": "apiKey"},
    {"name": "SLF German Database", "description": "German city, country, river database", "category": "Reference", "baseUrl": "https://github.com/slftool/slftool.github.io", "authType": "none"},
    {"name": "Today in History API", "description": "Daily historical events, births and deaths", "category": "History", "baseUrl": "https://history.muffinlabs.com", "authType": "none"},
    {"name": "Wikipedia API", "description": "Free multilingual Encyclopedia API", "category": "Reference", "baseUrl": "https://en.wikipedia.org/w/api.php", "authType": "none"},
    
    # Currency
    {"name": "1Forge Forex API", "description": "Real-time forex and crypto quotes via JSON and WebSocket", "category": "Finance", "baseUrl": "https://1forge.com", "authType": "apiKey"},
    {"name": "Currency-API", "description": "Free Currency Exchange Rates API with 150+ currencies", "category": "Finance", "baseUrl": "https://github.com/fawazahmed0/currency-api", "authType": "none"},
    {"name": "CurrencyLayer API", "description": "Exchange rates and currency conversion API", "category": "Finance", "baseUrl": "https://currencylayer.com/documentation", "authType": "apiKey"},
    {"name": "CurrencyScoop API", "description": "Real-time and historical currency rates JSON API", "category": "Finance", "baseUrl": "https://currencyscoop.com", "authType": "apiKey"},
    {"name": "ECB Exchange Rates", "description": "Free currency exchange rates from European Central Bank", "category": "Finance", "baseUrl": "https://www.ecb.europa.eu/stats/eurofxref", "authType": "none"},
    {"name": "ExchangeRate-API", "description": "Currency conversion API", "category": "Finance", "baseUrl": "https://www.exchangerate-api.com/docs", "authType": "apiKey"},
    {"name": "ExchangeRatesAPI.io", "description": "Foreign exchange rates API with conversion", "category": "Finance", "baseUrl": "https://exchangeratesapi.io", "authType": "apiKey"},
    {"name": "Fixer.io", "description": "JSON API for exchange rates and currency conversion", "category": "Finance", "baseUrl": "http://fixer.io", "authType": "apiKey"},
    {"name": "Frankfurter API", "description": "Exchange rates and currency data API", "category": "Finance", "baseUrl": "https://www.frankfurter.app/docs", "authType": "none"},
    {"name": "OpenRates.io", "description": "Live exchange rates and currency conversion", "category": "Finance", "baseUrl": "http://www.openrates.io", "authType": "none"},
    
    # Design
    {"name": "Dribbble API", "description": "Community of designers API", "category": "Design", "baseUrl": "http://developer.dribbble.com", "authType": "oauth2"},
    {"name": "Icon Horse API", "description": "Get favicon logo for any web address", "category": "Design", "baseUrl": "https://icon.horse/usage", "authType": "none"},
    {"name": "Pexels API", "description": "High quality free stock photos API", "category": "Media", "baseUrl": "https://www.pexels.com/api", "authType": "apiKey"},
    {"name": "PHP-Noise Generator", "description": "Noise background image generator API", "category": "Design", "baseUrl": "https://php-noise.com", "authType": "none"},
    
    # Dictionary
    {"name": "Agarathi Tamil Dictionary", "description": "Tamil language Dictionary API", "category": "Dictionary", "baseUrl": "https://agarathi.com/api/dictionary", "authType": "apiKey"},
    {"name": "Cambridge Dictionary API", "description": "Access to Cambridge's dictionary API", "category": "Dictionary", "baseUrl": "http://dictionary.cambridge.org/license.html", "authType": "apiKey"},
    {"name": "Datamuse API", "description": "Word-finding query engine", "category": "Dictionary", "baseUrl": "https://www.datamuse.com/api", "authType": "none"},
    {"name": "Free Dictionary API", "description": "Get word definitions for free", "category": "Dictionary", "baseUrl": "https://dictionaryapi.dev", "authType": "none"},
    {"name": "Lingua Robot API", "description": "Definitions, pronunciations, synonyms, antonyms", "category": "Dictionary", "baseUrl": "https://www.linguarobot.io", "authType": "apiKey"},
    {"name": "Merriam-Webster API", "description": "Dictionary and thesaurus content API", "category": "Dictionary", "baseUrl": "http://www.dictionaryapi.com", "authType": "apiKey"},
    {"name": "Oxford Dictionary API", "description": "Access to Oxford Dictionary services", "category": "Dictionary", "baseUrl": "https://developer.oxforddictionaries.com", "authType": "apiKey"},
    {"name": "Wordnik API", "description": "Dictionary functions API", "category": "Dictionary", "baseUrl": "http://developer.wordnik.com/docs", "authType": "apiKey"},
    {"name": "Words API", "description": "Definitions for 150,000+ words", "category": "Dictionary", "baseUrl": "https://www.wordsapi.com", "authType": "apiKey"},
    {"name": "Wiktionary API", "description": "Collaborative multilingual dictionary", "category": "Dictionary", "baseUrl": "https://en.wiktionary.org/w/api.php", "authType": "none"},
    
    # Entertainment
    {"name": "AniList API", "description": "Free GraphQL API for anime and manga", "category": "Entertainment", "baseUrl": "https://anilist.gitbook.io/anilist-apiv2-docs", "authType": "oauth2"},
    {"name": "Bob's Burgers API", "description": "Data for characters, episodes from the show", "category": "Entertainment", "baseUrl": "https://www.bobsburgersapi.com/documentation", "authType": "none"},
    {"name": "Breaking Bad API", "description": "Data about characters, episodes, quotes, deaths", "category": "Entertainment", "baseUrl": "https://breakingbadapi.com/documentation", "authType": "none"},
    {"name": "CATAAS", "description": "Cat as a Service REST API", "category": "Entertainment", "baseUrl": "https://cataas.com", "authType": "none"},
    {"name": "Comic Vine API", "description": "Mature comic information resource", "category": "Entertainment", "baseUrl": "http://comicvine.gamespot.com/api", "authType": "apiKey"},
    {"name": "Comichron Data API", "description": "API for comic sales data", "category": "Entertainment", "baseUrl": "https://github.com/comichron-data/api", "authType": "none"},
    {"name": "Danbooru API", "description": "Get images categorized by tags", "category": "Media", "baseUrl": "https://danbooru.donmai.us/posts", "authType": "apiKey"},
    {"name": "Dune API", "description": "Book, character, movie and quotes JSON data", "category": "Entertainment", "baseUrl": "https://github.com/ywalia01/dune-api", "authType": "none"},
    {"name": "Final Space API", "description": "Information and images about Final Space show", "category": "Entertainment", "baseUrl": "https://finalspaceapi.com/docs", "authType": "none"},
    {"name": "Fun Translations API", "description": "Translate to 50+ languages from TV/Movies", "category": "Entertainment", "baseUrl": "https://funtranslations.com/api", "authType": "apiKey"},
    {"name": "Lord of the Rings API", "description": "Data about books, movies, characters, quotes", "category": "Entertainment", "baseUrl": "https://the-one-api.dev/documentation", "authType": "apiKey"},
    {"name": "Marvel API", "description": "Access over 70 years of Marvel comic data", "category": "Entertainment", "baseUrl": "https://developer.marvel.com", "authType": "apiKey"},
    {"name": "Jikan MyAnimeList API", "description": "Unofficial MyAnimeList API", "category": "Entertainment", "baseUrl": "https://jikan.moe", "authType": "none"},
    {"name": "Owen Wilson Wow API", "description": "Owen Wilson's wow exclamations in movies", "category": "Entertainment", "baseUrl": "https://owen-wilson-wow-api.onrender.com", "authType": "none"},
    {"name": "PokéAPI", "description": "All the Pokémon data you'll ever need", "category": "Entertainment", "baseUrl": "https://pokeapi.co", "authType": "none"},
    {"name": "Rick and Morty API", "description": "Rick and Morty information including images", "category": "Entertainment", "baseUrl": "https://rickandmortyapi.com", "authType": "none"},
    {"name": "Riddles API", "description": "Get random riddles", "category": "Entertainment", "baseUrl": "https://riddles-api.vercel.app", "authType": "none"},
    {"name": "STAPI Star Trek", "description": "Star Trek API", "category": "Entertainment", "baseUrl": "https://stapi.co/api-documentation", "authType": "none"},
    {"name": "SWAPI Star Wars", "description": "All things Star Wars API", "category": "Entertainment", "baseUrl": "https://www.swapi.tech", "authType": "none"},
    {"name": "Studio Ghibli API", "description": "Resources from Studio Ghibli films", "category": "Entertainment", "baseUrl": "https://ghibliapi.vercel.app", "authType": "none"},
    {"name": "StockX API", "description": "150k+ sneakers and fashion products with prices", "category": "E-Commerce", "baseUrl": "https://stockx.vlour.me", "authType": "apiKey"},
    {"name": "TCGdex Pokémon TCG", "description": "Multilanguage Pokémon TCG Database", "category": "Entertainment", "baseUrl": "https://www.tcgdex.dev", "authType": "none"},
    
    # Events
    {"name": "Picatic Events API", "description": "Sell tickets directly from app or website", "category": "Events", "baseUrl": "http://developer.picatic.com", "authType": "apiKey"},
    
    # Face Recognition
    {"name": "Kairos Face Recognition", "description": "Face recognition, emotion analysis API", "category": "AI", "baseUrl": "https://www.kairos.com", "authType": "apiKey"},
    {"name": "Skybiometry", "description": "Face detection, emotional analysis, recognition", "category": "AI", "baseUrl": "https://www.skybiometry.com", "authType": "apiKey"},
    
    # File Storage
    {"name": "Amazon S3 API", "description": "API for stored files access", "category": "Storage", "baseUrl": "https://aws.amazon.com/s3", "authType": "apiKey"},
    {"name": "Cloudinary API", "description": "Image and video storage and manipulation", "category": "Media", "baseUrl": "http://cloudinary.com/documentation", "authType": "apiKey"},
    {"name": "DigitalOcean Spaces", "description": "Simple object storage API", "category": "Storage", "baseUrl": "https://www.digitalocean.com/products/spaces", "authType": "apiKey"},
    {"name": "Dropbox API", "description": "Access stored files and pictures", "category": "Storage", "baseUrl": "https://www.dropbox.com/developers", "authType": "oauth2"},
    {"name": "Filestack API", "description": "Image and file manipulation with CDN", "category": "Media", "baseUrl": "https://filestack.com/docs", "authType": "apiKey"},
    {"name": "Microsoft OneDrive API", "description": "Access stored files for personal and enterprise users", "category": "Storage", "baseUrl": "https://graph.microsoft.io/en-us/docs/api-reference", "authType": "oauth2"},
    {"name": "PDF Blocks API", "description": "API for working with PDF documents", "category": "Documents", "baseUrl": "https://www.pdfblocks.com/docs/api", "authType": "apiKey"},
    {"name": "SignNow eSign API", "description": "Embed branded eSignature workflows", "category": "Documents", "baseUrl": "https://docs.signnow.com", "authType": "oauth2"},
    {"name": "Smash File Transfer API", "description": "Upload large files on websites and apps", "category": "Storage", "baseUrl": "https://api.fromsmash.com", "authType": "apiKey"},
    {"name": "Vector Express API", "description": "Converting, processing vector files", "category": "Design", "baseUrl": "https://github.com/smidyo/vectorexpress-api", "authType": "apiKey"},
    {"name": "Vertopal File Converter", "description": "Convert files to various formats", "category": "Documents", "baseUrl": "https://www.vertopal.com/en/developer/api", "authType": "apiKey"},
    
    # Finance
    {"name": "Alpha Vantage API", "description": "Stock, ETF, mutual fund, forex, crypto data", "category": "Finance", "baseUrl": "https://www.alphavantage.co", "authType": "apiKey"},
    {"name": "Atom Finance API", "description": "Market, earnings and news data", "category": "Finance", "baseUrl": "https://docs.atom.finance", "authType": "apiKey"},
    {"name": "IEX Cloud", "description": "Free Stocks and Market Data", "category": "Finance", "baseUrl": "https://iextrading.com/developer", "authType": "apiKey"},
    {"name": "Twelve Data API", "description": "Stock market data real-time and historical", "category": "Finance", "baseUrl": "https://twelvedata.com/docs", "authType": "apiKey"},
    {"name": "RBA Australia Data", "description": "Australian financial data in CSV format", "category": "Finance", "baseUrl": "https://www.rba.gov.au/statistics/tables", "authType": "none"},
    {"name": "Bank of Canada Rates", "description": "Daily exchange rates and statistical data", "category": "Finance", "baseUrl": "https://www.bankofcanada.ca/rates", "authType": "none"},
    {"name": "IBAN API", "description": "Validate IBAN number and get bank account", "category": "Finance", "baseUrl": "https://ibanapi.com/get-api", "authType": "apiKey"},
    {"name": "Central Bank Ireland Data", "description": "Irish financial data", "category": "Finance", "baseUrl": "https://data.gov.ie/data/search", "authType": "none"},
    {"name": "CBM Myanmar Forex", "description": "Myanmar currency exchange rates", "category": "Finance", "baseUrl": "http://forex.cbm.gov.mm/api", "authType": "none"},
    {"name": "BNM Moldova Rates", "description": "Moldova currency exchange rates", "category": "Finance", "baseUrl": "https://bnm.md/en/content/official-exchange-rates", "authType": "none"},
    {"name": "RBNZ New Zealand Data", "description": "New Zealand financial data", "category": "Finance", "baseUrl": "https://www.rbnz.govt.nz/statistics", "authType": "none"},
    {"name": "CBN Nigeria Rates", "description": "Nigerian exchange rates", "category": "Finance", "baseUrl": "https://www.cbn.gov.ng/rates", "authType": "none"},
    {"name": "Parqet Logo API", "description": "Company Logo API for 400k+ stocks", "category": "Finance", "baseUrl": "https://developers.parqet.com/docs/assets/logos", "authType": "none"},
    {"name": "NBP Poland API", "description": "Polish currency exchange rates and gold prices", "category": "Finance", "baseUrl": "https://api.nbp.pl", "authType": "none"},
    {"name": "CBR Russia API", "description": "Russian exchange rates via REST/SOAP", "category": "Finance", "baseUrl": "https://www.cbr.ru/development", "authType": "none"},
    {"name": "SNB Switzerland Data", "description": "Swiss financial data", "category": "Finance", "baseUrl": "https://data.snb.ch/en", "authType": "none"},
    {"name": "NBU Ukraine API", "description": "Ukrainian exchange rates and bond placements", "category": "Finance", "baseUrl": "https://bank.gov.ua/control/en/publish/article", "authType": "none"},
    {"name": "Portfolio Optimizer API", "description": "Investment portfolio optimization", "category": "Finance", "baseUrl": "https://portfoliooptimizer.io", "authType": "apiKey"},
    
    # Fitness
    {"name": "FitBit API", "description": "Access Fitbit activity tracker data", "category": "Health", "baseUrl": "https://dev.fitbit.com/build/reference", "authType": "oauth2"},
    {"name": "RunKeeper HealthGraph", "description": "Health Graph data and user information", "category": "Health", "baseUrl": "https://runkeeper.com/developer/healthgraph", "authType": "oauth2"},
    {"name": "Open Food Facts", "description": "Food products database with nutrition facts", "category": "Health", "baseUrl": "https://en.wiki.openfoodfacts.org/API", "authType": "none"},
    {"name": "Strava API", "description": "Access data about athletes and activities", "category": "Health", "baseUrl": "https://strava.github.io/api", "authType": "oauth2"},
    {"name": "VeganCheck API", "description": "Information about food products via EAN/UPC", "category": "Health", "baseUrl": "https://jokenetwork.de/vegancheck-api", "authType": "none"},
    {"name": "Withings API", "description": "Access Withings activity trackers data", "category": "Health", "baseUrl": "http://oauth.withings.com/api", "authType": "oauth2"},
    
    # Google APIs
    {"name": "Gmail API", "description": "The Gmail REST API", "category": "Email", "baseUrl": "https://developers.google.com/gmail/api", "authType": "oauth2"},
    {"name": "Google BigQuery API", "description": "Data platform for creating and querying data", "category": "Big Data", "baseUrl": "https://cloud.google.com/bigquery/docs/reference/rest", "authType": "oauth2"},
    {"name": "Google Books API", "description": "Search for books and manage library", "category": "Content", "baseUrl": "https://developers.google.com/books", "authType": "apiKey"},
    {"name": "Google Calendar API", "description": "Manipulate events and calendar data", "category": "Calendar", "baseUrl": "https://developers.google.com/calendar", "authType": "oauth2"},
    {"name": "Google Classroom API", "description": "Google Classroom integration", "category": "Education", "baseUrl": "https://developers.google.com/classroom", "authType": "oauth2"},
    {"name": "Google Custom Search API", "description": "Search over websites or collections", "category": "Search", "baseUrl": "https://developers.google.com/custom-search/json-api", "authType": "apiKey"},
    {"name": "Google Drive API", "description": "Interact with Google Drive", "category": "Storage", "baseUrl": "https://developers.google.com/drive", "authType": "oauth2"},
    {"name": "Google Fit API", "description": "Google Fitness platform", "category": "Health", "baseUrl": "https://developers.google.com/fit", "authType": "oauth2"},
    {"name": "Google Fonts API", "description": "Add fonts to web pages", "category": "Design", "baseUrl": "https://developers.google.com/fonts", "authType": "apiKey"},
    {"name": "Google Genomics API", "description": "Access to Genomics data", "category": "Science", "baseUrl": "https://cloud.google.com/genomics/reference/rest", "authType": "oauth2"},
    {"name": "Google Identity Toolkit", "description": "Federated login implementation", "category": "Authentication", "baseUrl": "https://developers.google.com/identity", "authType": "oauth2"},
    {"name": "Google Monitoring API", "description": "Google Cloud monitoring data", "category": "DevOps", "baseUrl": "https://cloud.google.com/monitoring/api", "authType": "oauth2"},
    
    # Identity Verification
    {"name": "BlockScore Identity", "description": "Real-time identity verification API", "category": "Security", "baseUrl": "https://docs.blockscore.com", "authType": "apiKey"},
    {"name": "Cognito Identity API", "description": "Identity verification and retrieval", "category": "Security", "baseUrl": "https://cognitohq.com/docs", "authType": "apiKey"},
    {"name": "Whitepages Pro", "description": "Global Identity Verification API", "category": "Security", "baseUrl": "https://pro.whitepages.com", "authType": "apiKey"},
    
    # Image Moderation
    {"name": "WebPurify Image Moderation", "description": "Live image moderation by humans", "category": "AI", "baseUrl": "https://www.webpurify.com/image-moderation", "authType": "apiKey"},
    
    # IoT
    {"name": "Ably Realtime API", "description": "Cross-protocol real time communication", "category": "IoT", "baseUrl": "https://www.ably.com/documentation", "authType": "apiKey"},
    {"name": "Particle IoT API", "description": "Manage and control Particle devices", "category": "IoT", "baseUrl": "https://docs.particle.io/reference/api", "authType": "apiKey"},
    {"name": "PubNub Realtime API", "description": "Real time applications with hardware devices", "category": "IoT", "baseUrl": "https://www.pubnub.com/docs", "authType": "apiKey"},
    {"name": "Philips Hue API", "description": "Control Philips Hue smart lights", "category": "IoT", "baseUrl": "https://developers.meethue.com/documentation", "authType": "apiKey"},
    {"name": "SmartThings API", "description": "Samsung SmartThings Smart Home Hub API", "category": "IoT", "baseUrl": "http://developer.smartthings.com", "authType": "oauth2"},
    {"name": "Temboo SDK", "description": "Layer on top of third-party APIs", "category": "IoT", "baseUrl": "https://temboo.com/download", "authType": "apiKey"},
    {"name": "ThingSpeak IoT", "description": "Store and retrieve IoT data via HTTP", "category": "IoT", "baseUrl": "https://github.com/iobridge/ThingSpeak", "authType": "apiKey"},
    {"name": "Xively IoT Platform", "description": "Connect hardware using various languages", "category": "IoT", "baseUrl": "https://developer.xively.com/reference", "authType": "apiKey"},
    {"name": "Zetta IoT", "description": "Open source IoT platform on Node.js", "category": "IoT", "baseUrl": "https://github.com/zettajs/zetta/wiki", "authType": "none"},
    
    # Login/Auth
    {"name": "Auth0 Authentication", "description": "Authenticate apps with any identity provider", "category": "Authentication", "baseUrl": "https://auth0.com", "authType": "oauth2"},
    {"name": "Facebook Login", "description": "Secure, fast login for apps/websites", "category": "Authentication", "baseUrl": "https://developers.facebook.com/docs/facebook-login", "authType": "oauth2"},
    {"name": "Firebase Auth", "description": "Authentication and analytics platform", "category": "Authentication", "baseUrl": "https://firebase.google.com/docs/reference", "authType": "apiKey"},
    {"name": "GitHub Authentication", "description": "GitHub authentication API", "category": "Authentication", "baseUrl": "https://developer.github.com/guides/basics-of-authentication", "authType": "oauth2"},
    {"name": "Instagram OAuth", "description": "Instagram authentication API", "category": "Authentication", "baseUrl": "https://developers.facebook.com/docs/instagram-api/overview", "authType": "oauth2"},
    {"name": "LinkedIn Sign-In", "description": "Sign in with professional identity", "category": "Authentication", "baseUrl": "https://developer.linkedin.com/docs/signin-with-linkedin", "authType": "oauth2"},
    {"name": "PayPal Login", "description": "Sign in with PayPal credentials", "category": "Authentication", "baseUrl": "https://developer.paypal.com/docs/integration/direct/identity", "authType": "oauth2"},
    {"name": "Salesforce OAuth", "description": "Salesforce secure data access", "category": "Authentication", "baseUrl": "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta", "authType": "oauth2"},
    {"name": "Twitter Sign-in", "description": "Twitter OAuth for websites and apps", "category": "Authentication", "baseUrl": "https://developer.twitter.com/en/docs/authentication", "authType": "oauth2"},
    {"name": "WorkOS SSO", "description": "Enterprise Single Sign-On support", "category": "Authentication", "baseUrl": "https://workos.com/docs", "authType": "apiKey"},
    
    # Machine Learning
    {"name": "Amazon ML API", "description": "Amazon Machine Learning predictions API", "category": "AI", "baseUrl": "http://docs.aws.amazon.com/machine-learning/latest/APIReference", "authType": "apiKey"},
    {"name": "AYLIEN Text Analysis", "description": "NLP and Machine Learning tools", "category": "AI", "baseUrl": "http://aylien.com", "authType": "apiKey"},
    {"name": "BigML API", "description": "Machine learning API for decision trees", "category": "AI", "baseUrl": "http://bigml.com/api", "authType": "apiKey"},
    {"name": "Google Cloud ML Engine", "description": "Cloud-based machine learning", "category": "AI", "baseUrl": "https://cloud.google.com/ml-engine/docs", "authType": "oauth2"},
    {"name": "Azure Cognitive Services", "description": "Microsoft AI and machine learning APIs", "category": "AI", "baseUrl": "https://azure.microsoft.com/en-us/services/cognitive-services", "authType": "apiKey"},
    {"name": "ObjectCut Background Removal", "description": "Automatic background removal by AI", "category": "AI", "baseUrl": "https://objectcut.com", "authType": "apiKey"},
    {"name": "OVHcloud AI Endpoints", "description": "GenAI and ML integration APIs", "category": "AI", "baseUrl": "https://endpoints.ai.cloud.ovh.net", "authType": "apiKey"},
    {"name": "Unplugg Forecasting", "description": "Automated Forecasting API for timeseries", "category": "AI", "baseUrl": "http://unplu.gg/test_api.html", "authType": "apiKey"},
    
    # Maps
    {"name": "Amazon Maps API", "description": "Interactive 3D maps for Fire devices", "category": "Maps", "baseUrl": "https://developer.amazon.com/maps", "authType": "apiKey"},
    {"name": "Bing Maps API", "description": "Multiple map API options", "category": "Maps", "baseUrl": "https://www.microsoft.com/maps", "authType": "apiKey"},
    {"name": "Cartes.io", "description": "Create maps and markers without auth", "category": "Maps", "baseUrl": "https://github.com/M-Media-Group/Cartes.io/wiki/API", "authType": "none"},
    {"name": "CARTO API", "description": "Generate maps based on hosted data", "category": "Maps", "baseUrl": "https://carto.com/developers", "authType": "apiKey"},
    {"name": "Daum Maps API", "description": "Korean map APIs", "category": "Maps", "baseUrl": "http://apis.map.daum.net", "authType": "apiKey"},
    {"name": "Google Maps API", "description": "Google Maps for all platforms", "category": "Maps", "baseUrl": "https://developers.google.com/maps", "authType": "apiKey"},
    {"name": "HERE Maps API", "description": "Wide range of map APIs", "category": "Maps", "baseUrl": "https://developer.here.com", "authType": "apiKey"},
    {"name": "Leaflet.js", "description": "Mobile-friendly interactive maps", "category": "Maps", "baseUrl": "http://leafletjs.com", "authType": "none"},
    {"name": "Mapbox API", "description": "Access to MapBox maps", "category": "Maps", "baseUrl": "https://www.mapbox.com/developers/api/maps", "authType": "apiKey"},
    {"name": "OpenStreetMap API", "description": "API access to OSM", "category": "Maps", "baseUrl": "http://wiki.openstreetmap.org/wiki/API", "authType": "none"},
    {"name": "Scribble Maps API", "description": "Cross browser interactive map builder", "category": "Maps", "baseUrl": "https://www.scribblemaps.com/api", "authType": "apiKey"},
    {"name": "Yahoo Maps API", "description": "Embed rich interactive maps", "category": "Maps", "baseUrl": "https://developer.yahoo.com/maps", "authType": "apiKey"},
    {"name": "Yandex Maps API", "description": "Install Yandex.Maps on web apps", "category": "Maps", "baseUrl": "https://tech.yandex.com/maps", "authType": "apiKey"},
    
    # Math
    {"name": "Newton Math API", "description": "Arithmetic and Symbolic Math API", "category": "Science", "baseUrl": "https://newton.now.sh", "authType": "none"},
    
    # Medical
    {"name": "COVID-19 Data API", "description": "Live and historical Coronavirus data", "category": "Health", "baseUrl": "https://github.com/M-Media-Group/Covid-19-API", "authType": "none"},
    {"name": "Infermedica API", "description": "AI-based patient triage and diagnosis", "category": "Health", "baseUrl": "https://developer.infermedica.com/docs", "authType": "apiKey"},
    
    # Additional APIs from various sources
    {"name": "OpenWeatherMap", "description": "Current weather and forecasts API", "category": "Weather", "baseUrl": "https://openweathermap.org/api", "authType": "apiKey"},
    {"name": "WeatherAPI", "description": "Weather and geo data API", "category": "Weather", "baseUrl": "https://www.weatherapi.com", "authType": "apiKey"},
    {"name": "Tomorrow.io Weather", "description": "Weather intelligence API", "category": "Weather", "baseUrl": "https://www.tomorrow.io/weather-api", "authType": "apiKey"},
    {"name": "Visual Crossing Weather", "description": "Historical and forecast weather data", "category": "Weather", "baseUrl": "https://www.visualcrossing.com/weather-api", "authType": "apiKey"},
    {"name": "Weatherstack API", "description": "Real-time weather data API", "category": "Weather", "baseUrl": "https://weatherstack.com", "authType": "apiKey"},
    {"name": "AccuWeather API", "description": "AccuWeather weather data", "category": "Weather", "baseUrl": "https://developer.accuweather.com", "authType": "apiKey"},
    {"name": "Aeris Weather API", "description": "Advanced weather data and mapping", "category": "Weather", "baseUrl": "https://www.aerisweather.com/support/docs/api", "authType": "apiKey"},
    {"name": "Open-Meteo", "description": "Free weather API for non-commercial use", "category": "Weather", "baseUrl": "https://open-meteo.com", "authType": "none"},
    
    # News
    {"name": "NewsAPI", "description": "Search worldwide news", "category": "News", "baseUrl": "https://newsapi.org", "authType": "apiKey"},
    {"name": "GNews API", "description": "Search for news articles", "category": "News", "baseUrl": "https://gnews.io", "authType": "apiKey"},
    {"name": "Currents API", "description": "Breaking news API", "category": "News", "baseUrl": "https://currentsapi.services", "authType": "apiKey"},
    {"name": "Mediastack", "description": "Free news API", "category": "News", "baseUrl": "https://mediastack.com", "authType": "apiKey"},
    {"name": "TheNewsAPI", "description": "News aggregation API", "category": "News", "baseUrl": "https://www.thenewsapi.com", "authType": "apiKey"},
    {"name": "World News API", "description": "News from around the world", "category": "News", "baseUrl": "https://worldnewsapi.com", "authType": "apiKey"},
    {"name": "Bing News Search API", "description": "Search news with Bing", "category": "News", "baseUrl": "https://www.microsoft.com/en-us/bing/apis/bing-news-search-api", "authType": "apiKey"},
    {"name": "HackerNews API", "description": "Access Hacker News data", "category": "News", "baseUrl": "https://github.com/HackerNews/API", "authType": "none"},
    
    # Sports
    {"name": "ESPN API", "description": "Sports data from ESPN", "category": "Sports", "baseUrl": "https://www.espn.com/apis/devcenter", "authType": "apiKey"},
    {"name": "SportDataAPI", "description": "Football/Soccer statistics", "category": "Sports", "baseUrl": "https://sportdataapi.com", "authType": "apiKey"},
    {"name": "API-Football", "description": "Football data API", "category": "Sports", "baseUrl": "https://www.api-football.com", "authType": "apiKey"},
    {"name": "SportsDB", "description": "Free sports data API", "category": "Sports", "baseUrl": "https://www.thesportsdb.com/api.php", "authType": "none"},
    {"name": "Sportradar API", "description": "Sports data and odds", "category": "Sports", "baseUrl": "https://developer.sportradar.com", "authType": "apiKey"},
    {"name": "Football-Data.org", "description": "Football data for competitions", "category": "Sports", "baseUrl": "https://www.football-data.org", "authType": "apiKey"},
    {"name": "NBA API", "description": "Unofficial NBA stats API", "category": "Sports", "baseUrl": "https://github.com/swar/nba_api", "authType": "none"},
    {"name": "MLB Stats API", "description": "Official MLB stats", "category": "Sports", "baseUrl": "https://statsapi.mlb.com", "authType": "none"},
    
    # Music
    {"name": "Spotify Web API", "description": "Music data and playback control", "category": "Music", "baseUrl": "https://developer.spotify.com/documentation/web-api", "authType": "oauth2"},
    {"name": "Last.fm API", "description": "Music discovery and scrobbling", "category": "Music", "baseUrl": "https://www.last.fm/api", "authType": "apiKey"},
    {"name": "Deezer API", "description": "Access Deezer music catalog", "category": "Music", "baseUrl": "https://developers.deezer.com/api", "authType": "oauth2"},
    {"name": "Musixmatch API", "description": "Lyrics and music metadata", "category": "Music", "baseUrl": "https://developer.musixmatch.com", "authType": "apiKey"},
    {"name": "Genius API", "description": "Song lyrics and annotations", "category": "Music", "baseUrl": "https://docs.genius.com", "authType": "oauth2"},
    {"name": "SoundCloud API", "description": "Audio platform API", "category": "Music", "baseUrl": "https://developers.soundcloud.com", "authType": "oauth2"},
    {"name": "Bandcamp API", "description": "Independent music platform", "category": "Music", "baseUrl": "https://bandcamp.com/developer", "authType": "oauth2"},
    {"name": "MusicBrainz API", "description": "Open music encyclopedia", "category": "Music", "baseUrl": "https://musicbrainz.org/doc/MusicBrainz_API", "authType": "none"},
    {"name": "Discogs API", "description": "Music database and marketplace", "category": "Music", "baseUrl": "https://www.discogs.com/developers", "authType": "oauth2"},
    {"name": "Shazam API", "description": "Music recognition service", "category": "Music", "baseUrl": "https://rapidapi.com/apidojo/api/shazam", "authType": "apiKey"},
    
    # Video
    {"name": "YouTube Data API", "description": "Access YouTube functionality", "category": "Video", "baseUrl": "https://developers.google.com/youtube/v3", "authType": "oauth2"},
    {"name": "Vimeo API", "description": "Video hosting platform API", "category": "Video", "baseUrl": "https://developer.vimeo.com", "authType": "oauth2"},
    {"name": "Dailymotion API", "description": "Video sharing platform API", "category": "Video", "baseUrl": "https://developer.dailymotion.com", "authType": "oauth2"},
    {"name": "Twitch API", "description": "Live streaming platform API", "category": "Video", "baseUrl": "https://dev.twitch.tv/docs/api", "authType": "oauth2"},
    {"name": "IMDB API", "description": "Movie and TV database", "category": "Entertainment", "baseUrl": "https://imdb-api.com", "authType": "apiKey"},
    {"name": "TMDB API", "description": "The Movie Database API", "category": "Entertainment", "baseUrl": "https://developers.themoviedb.org/3", "authType": "apiKey"},
    {"name": "OMDB API", "description": "Open Movie Database API", "category": "Entertainment", "baseUrl": "http://www.omdbapi.com", "authType": "apiKey"},
    {"name": "TVmaze API", "description": "TV shows information", "category": "Entertainment", "baseUrl": "https://www.tvmaze.com/api", "authType": "none"},
    
    # Social Media
    {"name": "Twitter API v2", "description": "Twitter data and posting API", "category": "Social", "baseUrl": "https://developer.twitter.com/en/docs/twitter-api", "authType": "oauth2"},
    {"name": "Instagram Basic Display API", "description": "Access Instagram media", "category": "Social", "baseUrl": "https://developers.facebook.com/docs/instagram-basic-display-api", "authType": "oauth2"},
    {"name": "LinkedIn API", "description": "LinkedIn professional network API", "category": "Social", "baseUrl": "https://developer.linkedin.com", "authType": "oauth2"},
    {"name": "Reddit API", "description": "Reddit data and posting", "category": "Social", "baseUrl": "https://www.reddit.com/dev/api", "authType": "oauth2"},
    {"name": "Pinterest API", "description": "Pinterest visual discovery", "category": "Social", "baseUrl": "https://developers.pinterest.com", "authType": "oauth2"},
    {"name": "TikTok API", "description": "TikTok video platform API", "category": "Social", "baseUrl": "https://developers.tiktok.com", "authType": "oauth2"},
    {"name": "Discord API", "description": "Discord chat platform API", "category": "Social", "baseUrl": "https://discord.com/developers/docs", "authType": "oauth2"},
    {"name": "Slack API", "description": "Slack workspace API", "category": "Social", "baseUrl": "https://api.slack.com", "authType": "oauth2"},
    {"name": "Telegram Bot API", "description": "Telegram messaging API", "category": "Social", "baseUrl": "https://core.telegram.org/bots/api", "authType": "apiKey"},
    {"name": "WhatsApp Business API", "description": "WhatsApp messaging for business", "category": "Social", "baseUrl": "https://developers.facebook.com/docs/whatsapp", "authType": "oauth2"},
    
    # Developer Tools
    {"name": "GitHub API", "description": "GitHub platform API", "category": "Development", "baseUrl": "https://docs.github.com/en/rest", "authType": "oauth2"},
    {"name": "GitLab API", "description": "GitLab platform API", "category": "Development", "baseUrl": "https://docs.gitlab.com/ee/api", "authType": "oauth2"},
    {"name": "Bitbucket API", "description": "Bitbucket code hosting API", "category": "Development", "baseUrl": "https://developer.atlassian.com/bitbucket/api", "authType": "oauth2"},
    {"name": "NPM Registry API", "description": "npm package registry", "category": "Development", "baseUrl": "https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md", "authType": "none"},
    {"name": "PyPI API", "description": "Python Package Index API", "category": "Development", "baseUrl": "https://warehouse.pypa.io/api-reference", "authType": "none"},
    {"name": "Postman API", "description": "Postman API platform", "category": "Development", "baseUrl": "https://www.postman.com/postman/workspace/postman-public-workspace", "authType": "apiKey"},
    {"name": "Vercel API", "description": "Vercel deployment platform", "category": "Development", "baseUrl": "https://vercel.com/docs/rest-api", "authType": "apiKey"},
    {"name": "Netlify API", "description": "Netlify deployment platform", "category": "Development", "baseUrl": "https://docs.netlify.com/api/get-started", "authType": "oauth2"},
    {"name": "Heroku Platform API", "description": "Heroku cloud platform", "category": "Development", "baseUrl": "https://devcenter.heroku.com/articles/platform-api-reference", "authType": "oauth2"},
    {"name": "CircleCI API", "description": "CI/CD platform API", "category": "DevOps", "baseUrl": "https://circleci.com/docs/api", "authType": "apiKey"},
    {"name": "Travis CI API", "description": "CI/CD platform API", "category": "DevOps", "baseUrl": "https://developer.travis-ci.com", "authType": "apiKey"},
    {"name": "Jenkins API", "description": "Automation server API", "category": "DevOps", "baseUrl": "https://www.jenkins.io/doc/book/using/remote-access-api", "authType": "apiKey"},
    
    # E-commerce
    {"name": "Shopify API", "description": "E-commerce platform API", "category": "E-Commerce", "baseUrl": "https://shopify.dev/api", "authType": "oauth2"},
    {"name": "WooCommerce API", "description": "WordPress e-commerce API", "category": "E-Commerce", "baseUrl": "https://woocommerce.github.io/woocommerce-rest-api-docs", "authType": "oauth2"},
    {"name": "Magento API", "description": "Adobe Commerce API", "category": "E-Commerce", "baseUrl": "https://devdocs.magento.com/guides/v2.4/rest/bk-rest.html", "authType": "oauth2"},
    {"name": "BigCommerce API", "description": "E-commerce platform API", "category": "E-Commerce", "baseUrl": "https://developer.bigcommerce.com/api-docs", "authType": "oauth2"},
    {"name": "Etsy API", "description": "Handmade marketplace API", "category": "E-Commerce", "baseUrl": "https://www.etsy.com/developers/documentation", "authType": "oauth2"},
    {"name": "eBay API", "description": "Online marketplace API", "category": "E-Commerce", "baseUrl": "https://developer.ebay.com/api-docs", "authType": "oauth2"},
    {"name": "Amazon SP-API", "description": "Amazon Selling Partner API", "category": "E-Commerce", "baseUrl": "https://developer-docs.amazon.com/sp-api", "authType": "oauth2"},
    {"name": "Square API", "description": "Payments and commerce API", "category": "Payments", "baseUrl": "https://developer.squareup.com/docs", "authType": "oauth2"},
    
    # Payments
    {"name": "PayPal REST API", "description": "PayPal payments API", "category": "Payments", "baseUrl": "https://developer.paypal.com/docs/api", "authType": "oauth2"},
    {"name": "Razorpay API", "description": "Indian payments gateway", "category": "Payments", "baseUrl": "https://razorpay.com/docs/api", "authType": "apiKey"},
    {"name": "Klarna API", "description": "Buy now pay later API", "category": "Payments", "baseUrl": "https://docs.klarna.com", "authType": "apiKey"},
    {"name": "Afterpay API", "description": "Buy now pay later API", "category": "Payments", "baseUrl": "https://developers.afterpay.com", "authType": "oauth2"},
    {"name": "Wise API", "description": "International money transfers", "category": "Payments", "baseUrl": "https://api-docs.transferwise.com", "authType": "apiKey"},
    {"name": "Plaid API", "description": "Financial services API", "category": "Finance", "baseUrl": "https://plaid.com/docs/api", "authType": "apiKey"},
    {"name": "Dwolla API", "description": "ACH bank transfers API", "category": "Payments", "baseUrl": "https://developers.dwolla.com", "authType": "oauth2"},
    {"name": "GoCardless API", "description": "Bank payment API", "category": "Payments", "baseUrl": "https://developer.gocardless.com", "authType": "oauth2"},
    
    # Shipping/Logistics
    {"name": "Shippo API", "description": "Multi-carrier shipping API", "category": "Logistics", "baseUrl": "https://goshippo.com/docs", "authType": "apiKey"},
    {"name": "EasyPost API", "description": "Shipping API", "category": "Logistics", "baseUrl": "https://www.easypost.com/docs/api", "authType": "apiKey"},
    {"name": "ShipStation API", "description": "Order and shipping management", "category": "Logistics", "baseUrl": "https://www.shipstation.com/docs/api", "authType": "apiKey"},
    {"name": "UPS API", "description": "UPS shipping services", "category": "Logistics", "baseUrl": "https://developer.ups.com", "authType": "oauth2"},
    {"name": "FedEx API", "description": "FedEx shipping services", "category": "Logistics", "baseUrl": "https://developer.fedex.com", "authType": "oauth2"},
    {"name": "DHL API", "description": "DHL shipping services", "category": "Logistics", "baseUrl": "https://developer.dhl.com", "authType": "apiKey"},
    {"name": "USPS API", "description": "US Postal Service API", "category": "Logistics", "baseUrl": "https://www.usps.com/business/web-tools-apis", "authType": "apiKey"},
    {"name": "Postmark API", "description": "Transactional email API", "category": "Email", "baseUrl": "https://postmarkapp.com/developer", "authType": "apiKey"},
    
    # CRM/Marketing
    {"name": "HubSpot API", "description": "CRM and marketing platform", "category": "CRM", "baseUrl": "https://developers.hubspot.com/docs/api", "authType": "oauth2"},
    {"name": "Salesforce REST API", "description": "CRM platform API", "category": "CRM", "baseUrl": "https://developer.salesforce.com/docs/apis", "authType": "oauth2"},
    {"name": "Mailchimp API", "description": "Email marketing API", "category": "Marketing", "baseUrl": "https://mailchimp.com/developer", "authType": "oauth2"},
    {"name": "SendGrid API", "description": "Email delivery API", "category": "Email", "baseUrl": "https://docs.sendgrid.com/api-reference", "authType": "apiKey"},
    {"name": "Constant Contact API", "description": "Email marketing API", "category": "Marketing", "baseUrl": "https://developer.constantcontact.com", "authType": "oauth2"},
    {"name": "ActiveCampaign API", "description": "Marketing automation API", "category": "Marketing", "baseUrl": "https://developers.activecampaign.com/reference", "authType": "apiKey"},
    {"name": "Intercom API", "description": "Customer messaging platform", "category": "CRM", "baseUrl": "https://developers.intercom.com", "authType": "oauth2"},
    {"name": "Zendesk API", "description": "Customer service platform", "category": "CRM", "baseUrl": "https://developer.zendesk.com/api-reference", "authType": "oauth2"},
    {"name": "Freshdesk API", "description": "Customer support platform", "category": "CRM", "baseUrl": "https://developers.freshdesk.com/api", "authType": "apiKey"},
    {"name": "Pipedrive API", "description": "Sales CRM API", "category": "CRM", "baseUrl": "https://developers.pipedrive.com/docs/api", "authType": "oauth2"},
    
    # AI/ML Services
    {"name": "OpenAI API", "description": "GPT and AI models", "category": "AI", "baseUrl": "https://platform.openai.com/docs/api-reference", "authType": "apiKey"},
    {"name": "Anthropic API", "description": "Claude AI models", "category": "AI", "baseUrl": "https://docs.anthropic.com/claude/reference", "authType": "apiKey"},
    {"name": "Cohere API", "description": "NLP AI platform", "category": "AI", "baseUrl": "https://docs.cohere.ai", "authType": "apiKey"},
    {"name": "Hugging Face API", "description": "ML models and datasets", "category": "AI", "baseUrl": "https://huggingface.co/docs/api-inference", "authType": "apiKey"},
    {"name": "Replicate API", "description": "Run ML models in cloud", "category": "AI", "baseUrl": "https://replicate.com/docs", "authType": "apiKey"},
    {"name": "Stability AI", "description": "Image generation API", "category": "AI", "baseUrl": "https://platform.stability.ai/docs/api-reference", "authType": "apiKey"},
    {"name": "Deepgram API", "description": "Speech recognition API", "category": "AI", "baseUrl": "https://developers.deepgram.com", "authType": "apiKey"},
    {"name": "AssemblyAI", "description": "Speech-to-text API", "category": "AI", "baseUrl": "https://www.assemblyai.com/docs", "authType": "apiKey"},
    {"name": "Clarifai API", "description": "Computer vision API", "category": "AI", "baseUrl": "https://docs.clarifai.com", "authType": "apiKey"},
    {"name": "Roboflow API", "description": "Computer vision platform", "category": "AI", "baseUrl": "https://docs.roboflow.com", "authType": "apiKey"},
    
    # Government/Civic
    {"name": "USAspending API", "description": "US Government spending data", "category": "Government", "baseUrl": "https://api.usaspending.gov", "authType": "none"},
    {"name": "Data.gov API", "description": "US Government open data", "category": "Government", "baseUrl": "https://www.data.gov/developers", "authType": "apiKey"},
    {"name": "OpenFEC API", "description": "Federal Election Commission data", "category": "Government", "baseUrl": "https://api.open.fec.gov", "authType": "apiKey"},
    {"name": "Congress.gov API", "description": "US Congress data", "category": "Government", "baseUrl": "https://api.congress.gov", "authType": "apiKey"},
    {"name": "UK Parliament API", "description": "UK Parliament data", "category": "Government", "baseUrl": "https://developer.parliament.uk", "authType": "none"},
    {"name": "EU Open Data Portal", "description": "European Union open data", "category": "Government", "baseUrl": "https://data.europa.eu/euodp/en/developerscorner", "authType": "none"},
    {"name": "World Bank API", "description": "Global development data", "category": "Government", "baseUrl": "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392", "authType": "none"},
    {"name": "UN Data API", "description": "United Nations statistics", "category": "Government", "baseUrl": "https://data.un.org", "authType": "none"},
    
    # Environment/Science
    {"name": "NASA API", "description": "NASA data and imagery", "category": "Science", "baseUrl": "https://api.nasa.gov", "authType": "apiKey"},
    {"name": "NOAA API", "description": "Weather and climate data", "category": "Science", "baseUrl": "https://www.ncdc.noaa.gov/cdo-web/webservices", "authType": "apiKey"},
    {"name": "EPA API", "description": "Environmental data", "category": "Science", "baseUrl": "https://www.epa.gov/data", "authType": "none"},
    {"name": "AirVisual API", "description": "Air quality data", "category": "Environment", "baseUrl": "https://www.iqair.com/air-pollution-data-api", "authType": "apiKey"},
    {"name": "AQICN API", "description": "World air quality index", "category": "Environment", "baseUrl": "https://aqicn.org/api", "authType": "apiKey"},
    {"name": "Sunrise-Sunset API", "description": "Sunrise and sunset times", "category": "Science", "baseUrl": "https://sunrise-sunset.org/api", "authType": "none"},
    {"name": "USGS Earthquake API", "description": "Earthquake data", "category": "Science", "baseUrl": "https://earthquake.usgs.gov/fdsnws/event/1", "authType": "none"},
    {"name": "SpaceX API", "description": "SpaceX launch data", "category": "Science", "baseUrl": "https://github.com/r-spacex/SpaceX-API", "authType": "none"},
    
    # URL/Link Services
    {"name": "Bitly API", "description": "URL shortening service", "category": "Utilities", "baseUrl": "https://dev.bitly.com", "authType": "oauth2"},
    {"name": "TinyURL API", "description": "URL shortening", "category": "Utilities", "baseUrl": "https://tinyurl.com/app/dev", "authType": "apiKey"},
    {"name": "Rebrandly API", "description": "Custom URL shortener", "category": "Utilities", "baseUrl": "https://developers.rebrandly.com", "authType": "apiKey"},
    {"name": "Short.io API", "description": "URL shortening platform", "category": "Utilities", "baseUrl": "https://developers.short.io", "authType": "apiKey"},
    {"name": "LinkPreview API", "description": "Generate link previews", "category": "Utilities", "baseUrl": "https://www.linkpreview.net", "authType": "apiKey"},
    {"name": "URLMeta API", "description": "Extract metadata from URLs", "category": "Utilities", "baseUrl": "https://urlmeta.org", "authType": "apiKey"},
    
    # IP/Network
    {"name": "IPinfo API", "description": "IP geolocation and data", "category": "Network", "baseUrl": "https://ipinfo.io/developers", "authType": "apiKey"},
    {"name": "IP-API", "description": "Free IP geolocation", "category": "Network", "baseUrl": "https://ip-api.com", "authType": "none"},
    {"name": "ipstack API", "description": "IP to geolocation API", "category": "Network", "baseUrl": "https://ipstack.com", "authType": "apiKey"},
    {"name": "IP2Location API", "description": "IP geolocation service", "category": "Network", "baseUrl": "https://www.ip2location.com/web-service", "authType": "apiKey"},
    {"name": "MaxMind GeoIP2", "description": "IP geolocation database", "category": "Network", "baseUrl": "https://dev.maxmind.com", "authType": "apiKey"},
    {"name": "Abstract IP API", "description": "IP geolocation API", "category": "Network", "baseUrl": "https://www.abstractapi.com/ip-geolocation-api", "authType": "apiKey"},
    
    # Communication/Real-time
    {"name": "Pusher API", "description": "Real-time messaging", "category": "Real-time", "baseUrl": "https://pusher.com/docs", "authType": "apiKey"},
    {"name": "Socket.io", "description": "Real-time bidirectional events", "category": "Real-time", "baseUrl": "https://socket.io/docs", "authType": "none"},
    {"name": "Stream API", "description": "Activity feeds and chat", "category": "Real-time", "baseUrl": "https://getstream.io/docs", "authType": "apiKey"},
    {"name": "Sendbird API", "description": "Chat and messaging API", "category": "Real-time", "baseUrl": "https://sendbird.com/docs", "authType": "apiKey"},
    {"name": "CometChat API", "description": "Chat SDK and API", "category": "Real-time", "baseUrl": "https://www.cometchat.com/docs", "authType": "apiKey"},
    {"name": "Vonage API", "description": "Communications APIs", "category": "Communication", "baseUrl": "https://developer.vonage.com", "authType": "apiKey"},
    
    # PDF/Document
    {"name": "PDF.co API", "description": "PDF generation and conversion", "category": "Documents", "baseUrl": "https://pdf.co/documentation/api", "authType": "apiKey"},
    {"name": "PDFShift API", "description": "HTML to PDF conversion", "category": "Documents", "baseUrl": "https://pdfshift.io", "authType": "apiKey"},
    {"name": "DocuSign API", "description": "Electronic signature API", "category": "Documents", "baseUrl": "https://developers.docusign.com", "authType": "oauth2"},
    {"name": "HelloSign API", "description": "eSignature API", "category": "Documents", "baseUrl": "https://developers.hellosign.com", "authType": "apiKey"},
    {"name": "PandaDoc API", "description": "Document automation", "category": "Documents", "baseUrl": "https://developers.pandadoc.com", "authType": "apiKey"},
    {"name": "DocParser API", "description": "Extract data from documents", "category": "Documents", "baseUrl": "https://docparser.com/api", "authType": "apiKey"},
]

def load_registry():
    """Load existing registry"""
    with open(REGISTRY_PATH, 'r') as f:
        return json.load(f)

def save_registry(registry):
    """Save registry"""
    with open(REGISTRY_PATH, 'w') as f:
        json.dump(registry, f, indent=2)

def normalize_name(name):
    """Normalize API name for comparison"""
    return name.lower().replace(" ", "").replace("-", "").replace("_", "")

def main():
    print(f"🦞 APIClaw Night Expansion - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    
    # Load registry
    registry = load_registry()
    existing_apis = registry.get('apis', [])
    existing_count = len(existing_apis)
    print(f"📊 Current registry: {existing_count} APIs")
    
    # Build set of existing normalized names
    existing_names = set()
    for api in existing_apis:
        existing_names.add(normalize_name(api.get('name', '')))
    
    # Add new APIs
    added = 0
    skipped = 0
    
    for api in NEW_APIS:
        normalized = normalize_name(api['name'])
        if normalized not in existing_names:
            existing_apis.append(api)
            existing_names.add(normalized)
            added += 1
        else:
            skipped += 1
    
    # Update registry
    registry['apis'] = existing_apis
    registry['count'] = len(existing_apis)
    registry['lastUpdated'] = datetime.now().strftime('%Y-%m-%d')
    registry['version'] = '3.2.0'
    
    # Save
    save_registry(registry)
    
    print(f"✅ Added: {added} new APIs")
    print(f"⏭️ Skipped (duplicates): {skipped}")
    print(f"📊 New total: {len(existing_apis)} APIs")
    
    return added

if __name__ == "__main__":
    added = main()
    print(f"\n🎯 Result: +{added} APIs")
