#!/usr/bin/env python3
"""
APIClaw Night Expansion - 2026-02-27 06:00
Parses the n0shake/Public-APIs README and extracts new APIs
"""

import json
import re
import os
from datetime import datetime

# APIs parsed from n0shake/Public-APIs README
# Format: {"name": str, "description": str, "category": str, "url": str, "authType": str}

new_apis = [
    # Advertising
    {"name": "Amazon Mobile Ads", "description": "Monetize across platforms with multiple ad formats", "category": "Advertising", "url": "https://developer.amazon.com/mobile-ads", "authType": "apiKey"},
    {"name": "Facebook Marketing API", "description": "Manage ads and campaigns using the Facebook API", "category": "Advertising", "url": "https://developers.facebook.com/docs/marketing-apis", "authType": "oauth"},
    {"name": "Google AdSense", "description": "Free, flexible way to earn money from your websites and mobile sites", "category": "Advertising", "url": "https://developers.google.com/adsense/", "authType": "oauth"},
    {"name": "Google AdWords API", "description": "Manage Google AdWords campaigns programmatically", "category": "Advertising", "url": "https://developers.google.com/adwords/api/docs/guides/start", "authType": "oauth"},
    {"name": "Kevel Ad APIs", "description": "Build your own ad server with Kevel's ad APIs", "category": "Advertising", "url": "https://dev.kevel.co", "authType": "apiKey"},
    {"name": "Microsoft Bing Ads API", "description": "Provides programmatic access to various advertising technologies", "category": "Advertising", "url": "https://msdn.microsoft.com/en-us/library/bing-ads-api.aspx", "authType": "apiKey"},
    {"name": "Yahoo Gemini API", "description": "Manage complex Gemini accounts and campaigns efficiently", "category": "Advertising", "url": "https://developer.yahoo.com/gemini/", "authType": "oauth"},
    
    # Analytics
    {"name": "Amazon Mobile Analytics", "description": "Service for collecting, visualizing, and understanding app usage data at scale", "category": "Analytics", "url": "https://aws.amazon.com/documentation/mobileanalytics/", "authType": "apiKey"},
    {"name": "Clicky Analytics", "description": "Extract website traffic data in multiple formats", "category": "Analytics", "url": "https://clicky.com/help/api", "authType": "apiKey"},
    {"name": "DitchCarbon API", "description": "Company and product carbon emissions disclosures", "category": "Analytics", "url": "https://docs.ditchcarbon.com/", "authType": "apiKey"},
    {"name": "Fabric Analytics", "description": "Build better apps, understand users, and grow business", "category": "Analytics", "url": "https://firebase.google.com/", "authType": "apiKey"},
    {"name": "Localytics", "description": "Interface to Localytics analytics platform", "category": "Analytics", "url": "http://docs.localytics.com/dev/query-api.html", "authType": "apiKey"},
    {"name": "Matomo Analytics", "description": "All-in-one premium web analytics platform", "category": "Analytics", "url": "https://matomo.org/docs/analytics-api/", "authType": "apiKey"},
    {"name": "MixPanel", "description": "Analytics for mobile and web to analyze user actions", "category": "Analytics", "url": "https://developer.mixpanel.com/docs/implement-mixpanel", "authType": "apiKey"},
    {"name": "Open Web Analytics", "description": "Work with analytics data outside the OWA reporting interface", "category": "Analytics", "url": "https://github.com/padams/Open-Web-Analytics/wiki/Data-Access-API", "authType": "apiKey"},
    {"name": "Ticksel", "description": "Friendly website analytics made for humans", "category": "Analytics", "url": "https://ticksel.com", "authType": "apiKey"},
    {"name": "Woopra", "description": "Real-time website analysis tool for customer engagement", "category": "Analytics", "url": "https://www.woopra.com/docs/developer/analytics-api/", "authType": "apiKey"},
    {"name": "Zoho Reports API", "description": "Build powerful reporting and analytical capabilities", "category": "Analytics", "url": "https://zohoreportsapi.wiki.zoho.com/", "authType": "apiKey"},
    
    # AR
    {"name": "Vuforia AR SDK", "description": "Solid SDK with robust AR development options", "category": "Augmented Reality", "url": "https://library.vuforia.com/", "authType": "apiKey"},
    {"name": "Wikitude AR", "description": "Image recognition, tracking, 3D model rendering, video overlay, location AR", "category": "Augmented Reality", "url": "http://www.wikitude.com/download/", "authType": "apiKey"},
    
    # Barcode
    {"name": "Dynamic QR Code", "description": "Generate dynamic and static QR Codes", "category": "Barcode", "url": "https://rapidapi.com/updeploy-tools/api/qr-code-dynamic-and-static1/details", "authType": "apiKey"},
    {"name": "Google Barcode", "description": "Barcode API detects barcodes in real-time on device", "category": "Barcode", "url": "https://developers.google.com/vision/barcodes-overview", "authType": "none"},
    {"name": "EAN-Search", "description": "Lookup products by EAN, UPC or GTIN barcode", "category": "Barcode", "url": "https://www.ean-search.org/ean-database-api.html", "authType": "apiKey"},
    {"name": "QR Code Generator API", "description": "Static and Dynamic QR code generator API", "category": "Barcode", "url": "https://docs.openqr.io/", "authType": "apiKey"},
    {"name": "Stakdek QR Generator", "description": "Returns QR code image using python qrcode", "category": "Barcode", "url": "https://api.stakdek.de/blog?id=1006", "authType": "none"},
    
    # Big Data
    {"name": "Google Charts", "description": "Free tool for visualizing data from websites", "category": "Big Data", "url": "https://developers.google.com/chart/interactive/docs/", "authType": "none"},
    {"name": "Keen IO", "description": "Powerful, flexible Big Data analytics solution", "category": "Big Data", "url": "https://keen.io/docs/api/", "authType": "apiKey"},
    {"name": "MongoDB Atlas", "description": "Ideal for developers wanting control over Big Data processing", "category": "Big Data", "url": "https://github.com/mongodb", "authType": "apiKey"},
    {"name": "LinkedData.Center", "description": "RDF graph database with W3C SPARQL query APIs", "category": "Big Data", "url": "http://linkeddata.center/home/gdaas", "authType": "apiKey"},
    
    # Cryptocurrency
    {"name": "Bitcoin Developer API", "description": "Resources, guides and reference for Bitcoin developers", "category": "Cryptocurrency", "url": "https://developer.bitcoin.org/", "authType": "none"},
    {"name": "Bitcoincharts", "description": "Markets data for websites, mobile apps, desktop applets", "category": "Cryptocurrency", "url": "https://bitcoincharts.com/about/markets-api/", "authType": "none"},
    {"name": "bitpay", "description": "Simple RESTful API to powerful bitcoin infrastructure", "category": "Cryptocurrency", "url": "https://bitpay.com/developers", "authType": "apiKey"},
    {"name": "Block.io Wallet", "description": "Versatile and secure wallet for all coins", "category": "Cryptocurrency", "url": "https://block.io/", "authType": "apiKey"},
    {"name": "BlockCypher", "description": "Infrastructure fabric for blockchain applications", "category": "Cryptocurrency", "url": "https://www.blockcypher.com/", "authType": "apiKey"},
    {"name": "BlockFacts.io", "description": "Compliance-first digital asset data with REST and WebSocket", "category": "Cryptocurrency", "url": "https://blockfacts.io/", "authType": "apiKey"},
    {"name": "CoinDesk BPI", "description": "Bitcoin Price Index", "category": "Cryptocurrency", "url": "http://www.coindesk.com/api/", "authType": "none"},
    {"name": "Coingecko", "description": "Free and Public Cryptocurrency API without API key", "category": "Cryptocurrency", "url": "https://coingecko.com/en/api", "authType": "none"},
    {"name": "Coinlore", "description": "Cryptocurrency tick data API", "category": "Cryptocurrency", "url": "https://www.coinlore.com/cryptocurrency-data-api", "authType": "none"},
    {"name": "CoinMarketCap", "description": "Cryptocurrencies Prices", "category": "Cryptocurrency", "url": "https://coinmarketcap.com/api/", "authType": "apiKey"},
    {"name": "coinpaprika", "description": "Cryptocurrencies prices, market capitalization, volume", "category": "Cryptocurrency", "url": "https://api.coinpaprika.com", "authType": "none"},
    {"name": "CryptoCompare", "description": "Cryptocurrencies Comparison", "category": "Cryptocurrency", "url": "https://www.cryptocompare.com/api", "authType": "apiKey"},
    {"name": "Cryptonator", "description": "Cryptocurrencies Exchange Rates", "category": "Cryptocurrency", "url": "https://www.cryptonator.com/api/", "authType": "none"},
    {"name": "Coinigy", "description": "Interact with Coinigy and Exchange Accounts", "category": "Cryptocurrency", "url": "https://coinigy.docs.apiary.io", "authType": "apiKey"},
    {"name": "Covalent", "description": "Multi-blockchain data aggregator at one unified API", "category": "Cryptocurrency", "url": "https://www.covalenthq.com/docs/api/", "authType": "apiKey"},
    {"name": "Blockchain Exchange Rates", "description": "Market Prices and exchanges rates", "category": "Cryptocurrency", "url": "https://blockchain.info/api/exchange_rates_api", "authType": "none"},
    {"name": "PENDAX SDK", "description": "SDK for Trading, Data, WebSockets for FTX, OKX, Bybit", "category": "Cryptocurrency", "url": "https://github.com/CompendiumFi/PENDAX-SDK", "authType": "apiKey"},
    {"name": "Poloniex", "description": "US based digital asset exchange", "category": "Cryptocurrency", "url": "https://poloniex.com/support/api/", "authType": "apiKey"},
    {"name": "ShapeShift.io", "description": "Exchange between cryptocurrencies without an account", "category": "Cryptocurrency", "url": "https://shapeshift.io/", "authType": "none"},
    {"name": "Technical Analysis API", "description": "Cryptocurrency prices, technical analysis and sentiment", "category": "Cryptocurrency", "url": "https://technical-analysis-api.com", "authType": "apiKey"},
    
    # Calendar
    {"name": "CalendarIndex", "description": "Worldwide Holidays and Working Days API", "category": "Calendar", "url": "https://www.calendarindex.com", "authType": "apiKey"},
    {"name": "DigiDates API", "description": "REST API for date and time calculations", "category": "Calendar", "url": "https://digidates.de/en/", "authType": "none"},
    {"name": "Holiday API", "description": "Public holiday API for several supported countries", "category": "Calendar", "url": "https://holidayapi.pl/", "authType": "apiKey"},
    {"name": "OpenHolidays API", "description": "Public and school holidays for European countries", "category": "Calendar", "url": "https://www.openholidaysapi.org/", "authType": "none"},
    
    # Captcha
    {"name": "Anti-Captcha", "description": "Access to Anti-Captcha's solving API", "category": "Captcha", "url": "https://anti-captcha.com/apidoc", "authType": "apiKey"},
    {"name": "ProxyCrawl", "description": "Crawl and scrape without proxies, solve captchas", "category": "Captcha", "url": "https://proxycrawl.com", "authType": "apiKey"},
    {"name": "Google reCAPTCHA", "description": "Protect web pages against spam and automated abuse", "category": "Captcha", "url": "https://developers.google.com/recaptcha/intro", "authType": "apiKey"},
    
    # Commerce
    {"name": "Commerce Layer", "description": "Headless commerce platform for global ecommerce", "category": "Commerce", "url": "https://docs.commercelayer.io/api/", "authType": "oauth"},
    {"name": "envoice", "description": "Invoicing for online businesses", "category": "Commerce", "url": "https://www.envoice.in/reference/api/docs", "authType": "apiKey"},
    {"name": "koomalooma", "description": "Loyalty BPaaS for mobile and web companies", "category": "Commerce", "url": "http://business.koomalooma.com", "authType": "apiKey"},
    {"name": "Moltin", "description": "Unified APIs for inventory, carts, checkout, payments", "category": "Commerce", "url": "https://www.moltin.com/developers", "authType": "oauth"},
    {"name": "Stripe Payments", "description": "Accept payments over the Internet", "category": "Commerce", "url": "https://stripe.com/docs/api", "authType": "apiKey"},
    {"name": "Repetiti", "description": "3D Printer Management Service API", "category": "Commerce", "url": "https://developers.repetiti.com", "authType": "apiKey"},
    {"name": "Braintree", "description": "Mobile and web payment systems for ecommerce", "category": "Commerce", "url": "https://developers.braintreepayments.com", "authType": "apiKey"},
    {"name": "Yellow Pages API", "description": "Data for all business categories in US cities", "category": "Commerce", "url": "https://github.com/Hrushi11/Yellow-Pages-End-API", "authType": "none"},
    
    # Communication
    {"name": "Africa's Talking", "description": "Access African telco services through HTTP API", "category": "Communication", "url": "https://africastalking.com/", "authType": "apiKey"},
    {"name": "iP1sms", "description": "Send and receive SMS messages worldwide", "category": "Communication", "url": "https://www.ip1sms.com/en/developer/", "authType": "apiKey"},
    {"name": "Eqivo", "description": "Telephony/Programmable-Voice API platform", "category": "Communication", "url": "https://eqivo.org", "authType": "apiKey"},
    {"name": "MailGun", "description": "Transactional Email API for Developers", "category": "Communication", "url": "https://mailgun.com", "authType": "apiKey"},
    {"name": "Nexmo", "description": "Make and receive phone calls, send SMS worldwide", "category": "Communication", "url": "https://developer.nexmo.com", "authType": "apiKey"},
    {"name": "Sakari SMS", "description": "Send and Receive SMS to over 200+ countries", "category": "Communication", "url": "https://developer.sakari.io", "authType": "apiKey"},
    {"name": "Telnyx", "description": "Build Voice, SMS, Fax, Networking and IoT applications", "category": "Communication", "url": "https://developers.telnyx.com/", "authType": "apiKey"},
    {"name": "The SMS Works", "description": "Low-cost, reliable SMS API for developers", "category": "Communication", "url": "https://thesmsworks.co.uk/sms-api", "authType": "apiKey"},
    {"name": "Twilio", "description": "APIs for SMS, Voice, Video and more", "category": "Communication", "url": "https://www.twilio.com/solutions", "authType": "apiKey"},
    
    # Content
    {"name": "Bible API", "description": "Lightning-fast Bible API with 200+ translations", "category": "Content", "url": "https://github.com/wldeh/bible-api", "authType": "none"},
    {"name": "Bible API Public", "description": "JSON API for public domain bible translations", "category": "Content", "url": "https://bible-api.com/", "authType": "none"},
    {"name": "Fruits API", "description": "GraphQL API with fruit trees information", "category": "Content", "url": "https://github.com/Franqsanz/fruits-api", "authType": "none"},
    {"name": "Jokes API", "description": "Full featured Jokes API", "category": "Content", "url": "https://jokes.one/api/joke/", "authType": "apiKey"},
    {"name": "Perfect Tense", "description": "AI spelling and grammar checking API", "category": "Content", "url": "https://www.perfecttense.com/developers", "authType": "apiKey"},
    {"name": "qKast Channel Content", "description": "Access live content collections from the web", "category": "Content", "url": "https://github.com/egfx/qKast", "authType": "apiKey"},
    {"name": "Random Data Generator", "description": "Generator for phones, text, numbers, passwords, names", "category": "Content", "url": "https://randommer.io/randommer-api", "authType": "apiKey"},
    {"name": "Random Facts API", "description": "Random Facts API", "category": "Content", "url": "https://fungenerators.com/api/facts/", "authType": "apiKey"},
    {"name": "SLF Database", "description": "German city, country, river database", "category": "Content", "url": "https://github.com/slftool/slftool.github.io/blob/master/API.md", "authType": "none"},
    {"name": "Today in History", "description": "Daily historical events, births and deaths", "category": "Content", "url": "https://history.muffinlabs.com/", "authType": "none"},
    {"name": "Wikipedia API", "description": "Free multilingual Encyclopedia", "category": "Content", "url": "https://en.wikipedia.org/w/api.php", "authType": "none"},
    
    # Currency
    {"name": "1Forge", "description": "Real-time forex and crypto quotes via JSON and WebSocket", "category": "Currency", "url": "https://1forge.com/", "authType": "apiKey"},
    {"name": "Currency-api", "description": "Free Currency Exchange Rates with 150+ Currencies", "category": "Currency", "url": "https://github.com/fawazahmed0/currency-api", "authType": "none"},
    {"name": "CurrencyLayer", "description": "Exchange rates and currency conversion API", "category": "Currency", "url": "https://currencylayer.com/documentation", "authType": "apiKey"},
    {"name": "CurrencyScoop", "description": "Real-time and historical currency rates JSON API", "category": "Currency", "url": "https://currencyscoop.com/", "authType": "apiKey"},
    {"name": "ECB Exchange Rates", "description": "Free currency rates from European Central Bank", "category": "Currency", "url": "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", "authType": "none"},
    {"name": "ExchangeRate-API", "description": "Currency conversion API", "category": "Currency", "url": "https://www.exchangerate-api.com/docs/overview", "authType": "apiKey"},
    {"name": "Fixer.io", "description": "Foreign exchange rates and currency conversion", "category": "Currency", "url": "http://fixer.io/", "authType": "apiKey"},
    {"name": "Frankfurter", "description": "Exchange rates and currency data API", "category": "Currency", "url": "https://www.frankfurter.app/docs/", "authType": "none"},
    {"name": "OpenRates", "description": "Live exchange rates and currency conversion", "category": "Currency", "url": "http://www.openrates.io/", "authType": "none"},
    {"name": "ratesapi.io", "description": "Free foreign currency exchange rates", "category": "Currency", "url": "https://ratesapi.io/", "authType": "none"},
    
    # Design
    {"name": "Dribbble", "description": "Community of designers", "category": "Design", "url": "http://developer.dribbble.com/", "authType": "oauth"},
    {"name": "Icon Horse", "description": "Get favicon logo for any web address", "category": "Design", "url": "https://icon.horse/usage", "authType": "none"},
    {"name": "Pexels", "description": "High quality free stock photos under CC0", "category": "Design", "url": "https://www.pexels.com/api/", "authType": "apiKey"},
    {"name": "PHP-Noise", "description": "Noise background image generator api", "category": "Design", "url": "https://php-noise.com/", "authType": "none"},
    
    # Dictionary
    {"name": "Agarathi Tamil", "description": "Tamil language Dictionary API", "category": "Dictionary", "url": "https://agarathi.com/api/dictionary", "authType": "apiKey"},
    {"name": "Cambridge Dictionaries", "description": "Access to Cambridge's custom-developed API", "category": "Dictionary", "url": "http://dictionary.cambridge.org/license.html", "authType": "apiKey"},
    {"name": "Datamuse", "description": "Word-finding query engine", "category": "Dictionary", "url": "https://www.datamuse.com/api/", "authType": "none"},
    {"name": "Free Dictionary API", "description": "Get word definitions for free", "category": "Dictionary", "url": "https://dictionaryapi.dev/", "authType": "none"},
    {"name": "Lingua Robot", "description": "Definitions, pronunciations, synonyms, antonyms", "category": "Dictionary", "url": "https://www.linguarobot.io/", "authType": "apiKey"},
    {"name": "Merriam-Webster", "description": "Dictionary and thesaurus content", "category": "Dictionary", "url": "http://www.dictionaryapi.com/", "authType": "apiKey"},
    {"name": "Oxford Dictionary", "description": "Access to Oxford Dictionary services", "category": "Dictionary", "url": "https://developer.oxforddictionaries.com/", "authType": "apiKey"},
    {"name": "Wordnik", "description": "Dictionary functions", "category": "Dictionary", "url": "http://developer.wordnik.com/docs.html", "authType": "apiKey"},
    {"name": "Words API", "description": "Definitions for over 150,000 words", "category": "Dictionary", "url": "https://www.wordsapi.com/", "authType": "apiKey"},
    {"name": "Wiktionary API", "description": "Free-content multilingual dictionary", "category": "Dictionary", "url": "https://en.wiktionary.org/w/api.php", "authType": "none"},
    
    # Entertainment
    {"name": "Anilist", "description": "Free GraphQL API for animes, mangas, characters", "category": "Entertainment", "url": "https://anilist.gitbook.io/anilist-apiv2-docs/", "authType": "none"},
    {"name": "Bob's Burgers API", "description": "Data for characters, episodes, running gags", "category": "Entertainment", "url": "https://www.bobsburgersapi.com/documentation", "authType": "none"},
    {"name": "Breaking Bad API", "description": "Data about characters, episodes, quotes, deaths", "category": "Entertainment", "url": "https://breakingbadapi.com/documentation", "authType": "none"},
    {"name": "Buffy the Vampire Slayer API", "description": "Episode, cast and crew data", "category": "Entertainment", "url": "https://github.com/Thatskat/btvs-angel-api", "authType": "none"},
    {"name": "Cat as a Service", "description": "REST API to spread peace with cats", "category": "Entertainment", "url": "https://cataas.com/", "authType": "none"},
    {"name": "Comic Vine", "description": "Mature, well organized comic information", "category": "Entertainment", "url": "http://comicvine.gamespot.com/api/", "authType": "apiKey"},
    {"name": "Comichron Data", "description": "Comic sales data from comichron.com", "category": "Entertainment", "url": "https://github.com/comichron-data/api", "authType": "none"},
    {"name": "Danbooru", "description": "Get images categorized by tags", "category": "Entertainment", "url": "https://danbooru.donmai.us/posts?tags=help%3Aapi", "authType": "apiKey"},
    {"name": "Dune API", "description": "Book, character, movie and quotes JSON data", "category": "Entertainment", "url": "https://github.com/ywalia01/dune-api", "authType": "none"},
    {"name": "Final Space API", "description": "Information and images about Final Space show", "category": "Entertainment", "url": "https://finalspaceapi.com/docs/", "authType": "none"},
    {"name": "Fun Translations", "description": "Translate to 50+ languages from TV/Movies", "category": "Entertainment", "url": "https://funtranslations.com/api/", "authType": "apiKey"},
    {"name": "Lord of the Rings API", "description": "Data about books, movies, characters, quotes", "category": "Entertainment", "url": "https://the-one-api.dev/documentation", "authType": "apiKey"},
    {"name": "Marvel API", "description": "Access over 70 years of comic data", "category": "Entertainment", "url": "https://developer.marvel.com/", "authType": "apiKey"},
    {"name": "Jikan MyAnimeList", "description": "Data about any anime or anime genre", "category": "Entertainment", "url": "https://jikan.moe/", "authType": "none"},
    {"name": "Nick Cannon Baby API", "description": "Nick Cannon's children and baby mamas", "category": "Entertainment", "url": "https://nick-cannon-baby-api.onrender.com/", "authType": "none"},
    {"name": "Owen Wilson Wow API", "description": "Owen Wilson's wow exclamations in movies", "category": "Entertainment", "url": "https://owen-wilson-wow-api.onrender.com/", "authType": "none"},
    {"name": "Pokéapi", "description": "All Pokémon data you'll ever need", "category": "Entertainment", "url": "https://pokeapi.co/", "authType": "none"},
    {"name": "Rick and Morty API", "description": "All Rick and Morty information including images", "category": "Entertainment", "url": "https://rickandmortyapi.com/", "authType": "none"},
    {"name": "Riddles API", "description": "Get random riddles", "category": "Entertainment", "url": "https://riddles-api.vercel.app/", "authType": "none"},
    {"name": "Star Trek API", "description": "STAPI - Star Trek data", "category": "Entertainment", "url": "https://stapi.co/api-documentation", "authType": "none"},
    {"name": "Star Wars API", "description": "All things Star Wars based on Wookipedia", "category": "Entertainment", "url": "https://www.swapi.tech/", "authType": "none"},
    {"name": "Studio Ghibli", "description": "Resources from Studio Ghibli films", "category": "Entertainment", "url": "https://ghibliapi.vercel.app/", "authType": "none"},
    {"name": "StockX API", "description": "150k+ sneakers and fashion products", "category": "Entertainment", "url": "https://stockx.vlour.me/", "authType": "apiKey"},
    {"name": "TCGdex", "description": "Multilanguage Pokémon TCG Database", "category": "Entertainment", "url": "https://www.tcgdex.dev/", "authType": "none"},
    
    # Face Recognition
    {"name": "Kairos Face Recognition", "description": "Face recognition, emotion analysis, measuring engagement", "category": "Face Recognition", "url": "https://www.kairos.com/", "authType": "apiKey"},
    {"name": "Skybiometry", "description": "Face detection, emotional analysis, recognition", "category": "Face Recognition", "url": "https://www.skybiometry.com", "authType": "apiKey"},
    
    # File Storage
    {"name": "Amazon S3", "description": "Access to stored files, free for twelve months", "category": "File Storage", "url": "https://aws.amazon.com/de/documentation/s3/", "authType": "apiKey"},
    {"name": "Cloudinary", "description": "Image and video storage and manipulation", "category": "File Storage", "url": "http://cloudinary.com/documentation", "authType": "apiKey"},
    {"name": "DigitalOcean Spaces", "description": "Simple object storage with easy pricing", "category": "File Storage", "url": "https://www.digitalocean.com/products/spaces", "authType": "apiKey"},
    {"name": "Dropbox API", "description": "Access stored files and pictures", "category": "File Storage", "url": "https://www.dropbox.com/developers", "authType": "oauth"},
    {"name": "Filestack", "description": "Image and file manipulation with free CDN", "category": "File Storage", "url": "https://filestack.com/docs/", "authType": "apiKey"},
    {"name": "Microsoft OneDrive", "description": "Access stored files with high resolution thumbnails", "category": "File Storage", "url": "https://graph.microsoft.io/en-us/docs/api-reference/v1.0/resources/onedrive", "authType": "oauth"},
    {"name": "PDF Blocks", "description": "Working with PDF documents (merge, password, watermark)", "category": "File Storage", "url": "https://www.pdfblocks.com/docs/api/getting-started", "authType": "apiKey"},
    {"name": "SignNow API", "description": "Embed branded eSignature workflows", "category": "File Storage", "url": "https://docs.signnow.com/docs/signnow/welcome", "authType": "apiKey"},
    {"name": "Smash", "description": "Upload large files on websites and apps", "category": "File Storage", "url": "https://api.fromsmash.com/", "authType": "apiKey"},
    {"name": "Vector Express", "description": "Converting, processing and analyzing vector files", "category": "File Storage", "url": "https://github.com/smidyo/vectorexpress-api", "authType": "apiKey"},
    {"name": "Vertopal", "description": "Convert files to a variety of formats", "category": "File Storage", "url": "https://www.vertopal.com/en/developer/api/introduction", "authType": "apiKey"},
    
    # Finance
    {"name": "Alpha Vantage", "description": "Stock, ETF, mutual fund, forex, and crypto data", "category": "Finance", "url": "https://www.alphavantage.co/", "authType": "apiKey"},
    {"name": "Atom Finance", "description": "Market, earnings and news data", "category": "Finance", "url": "https://docs.atom.finance/", "authType": "apiKey"},
    {"name": "IEX Cloud", "description": "Free Stocks and Market Data", "category": "Finance", "url": "https://iextrading.com/developer/", "authType": "apiKey"},
    {"name": "Twelve Data", "description": "Stock market data real-time and historical", "category": "Finance", "url": "https://twelvedata.com/docs/", "authType": "apiKey"},
    {"name": "IBANAPI", "description": "Validate IBAN number and get bank account", "category": "Finance", "url": "https://ibanapi.com/get-api", "authType": "apiKey"},
    {"name": "Parqet Logo API", "description": "Company Logo API for 400k+ stocks, ETF, crypto", "category": "Finance", "url": "https://developers.parqet.com/docs/assets/logos", "authType": "none"},
    {"name": "Portfolio Optimizer", "description": "API for investment portfolio optimization", "category": "Finance", "url": "https://portfoliooptimizer.io/", "authType": "apiKey"},
    
    # Fitness
    {"name": "FitBit", "description": "Data from Fitbit activity trackers and Aria scale", "category": "Fitness", "url": "https://dev.fitbit.com/build/reference/", "authType": "oauth"},
    {"name": "HealthGraph RunKeeper", "description": "Health Graph data, user and friends info", "category": "Fitness", "url": "https://runkeeper.com/developer/healthgraph/registration-authorization", "authType": "oauth"},
    {"name": "Open Food Facts", "description": "Database of food products with ingredients", "category": "Fitness", "url": "https://en.wiki.openfoodfacts.org/API", "authType": "none"},
    {"name": "Strava", "description": "Accessing and managing athletes, activities, segments", "category": "Fitness", "url": "https://strava.github.io/api/", "authType": "oauth"},
    {"name": "VeganCheck", "description": "Information about food or non-food products by EAN/UPC", "category": "Fitness", "url": "https://jokenetwork.de/vegancheck-api", "authType": "none"},
    {"name": "Withings", "description": "Data from Withings activity trackers and body measures", "category": "Fitness", "url": "http://oauth.withings.com/api", "authType": "oauth"},
    
    # Google Services
    {"name": "Gmail API", "description": "The Gmail REST API v1", "category": "Google", "url": "https://developers.google.com/gmail/api/", "authType": "oauth"},
    {"name": "Google BigQuery", "description": "Data platform for creating, managing, querying data", "category": "Google", "url": "https://cloud.google.com/bigquery/docs/reference/rest/v2/", "authType": "oauth"},
    {"name": "Google Books", "description": "Search for books and manage Google Books library", "category": "Google", "url": "https://developers.google.com/books/", "authType": "oauth"},
    {"name": "Google Calendar", "description": "Manipulate events and other calendar data", "category": "Google", "url": "https://developers.google.com/google-apps/calendar/", "authType": "oauth"},
    {"name": "Google Classroom", "description": "The Google Classroom API v1", "category": "Google", "url": "https://developers.google.com/classroom/", "authType": "oauth"},
    {"name": "Google Custom Search", "description": "Search over websites or collections of websites", "category": "Google", "url": "https://developers.google.com/custom-search/json-api/v1/overview", "authType": "apiKey"},
    {"name": "Google Drive API", "description": "Interact with Google Drive v3", "category": "Google", "url": "https://developers.google.com/drive/v2/reference/", "authType": "oauth"},
    {"name": "Google Fit API", "description": "The Fit API v1", "category": "Google", "url": "https://developers.google.com/fit/", "authType": "oauth"},
    {"name": "Google Fonts", "description": "Add fonts to any web page", "category": "Google", "url": "https://developers.google.com/fonts/", "authType": "none"},
    {"name": "Google Genomics", "description": "Provides access to Genomics data", "category": "Google", "url": "https://cloud.google.com/genomics/reference/rest/", "authType": "oauth"},
    {"name": "Google Identity Toolkit", "description": "Helps sites implement federated login", "category": "Google", "url": "https://developers.google.com/identity/", "authType": "oauth"},
    {"name": "Google Monitoring", "description": "Accessing Google Cloud and API monitoring data", "category": "Google", "url": "https://cloud.google.com/monitoring/api/v3/", "authType": "oauth"},
    
    # Identity Verification
    {"name": "BlockScore", "description": "Real-time identity verification by name, address, DOB, SSN", "category": "Identity", "url": "https://docs.blockscore.com/", "authType": "apiKey"},
    {"name": "Cognito", "description": "Verifying and retrieving identity information", "category": "Identity", "url": "https://cognitohq.com/docs", "authType": "apiKey"},
    {"name": "Whitepages Pro", "description": "Global Identity Verification API", "category": "Identity", "url": "https://pro.whitepages.com/", "authType": "apiKey"},
    
    # Image Moderation
    {"name": "WebPurify", "description": "Live image moderation by humans", "category": "Image Moderation", "url": "https://www.webpurify.com/image-moderation/", "authType": "apiKey"},
    
    # IoT
    {"name": "Ably", "description": "Cross-protocol real time communication between devices", "category": "IoT", "url": "https://www.ably.com/documentation", "authType": "apiKey"},
    {"name": "Particle", "description": "Manage Particle devices including Arduino and RPi", "category": "IoT", "url": "https://docs.particle.io/reference/api/", "authType": "apiKey"},
    {"name": "PubNub", "description": "Real time applications with various hardware devices", "category": "IoT", "url": "https://www.pubnub.com/docs", "authType": "apiKey"},
    {"name": "Philips Hue", "description": "Control Hue brand lights made by Philips", "category": "IoT", "url": "https://developers.meethue.com/documentation/getting-started", "authType": "apiKey"},
    {"name": "SmartThings", "description": "Samsung SmartThings Smart Home Hub products", "category": "IoT", "url": "http://developer.smartthings.com/", "authType": "oauth"},
    {"name": "Temboo SDK", "description": "Code snippets to trigger complex processes", "category": "IoT", "url": "https://temboo.com/download", "authType": "apiKey"},
    {"name": "ThingSpeak", "description": "Internet of Things application and API", "category": "IoT", "url": "https://github.com/iobridge/ThingSpeak", "authType": "apiKey"},
    {"name": "Xively", "description": "Connect hardware using a variety of languages", "category": "IoT", "url": "https://developer.xively.com/reference", "authType": "apiKey"},
    {"name": "Zetta", "description": "Open source platform built on Node.js for IoT", "category": "IoT", "url": "https://github.com/zettajs/zetta/wiki", "authType": "none"},
    
    # Machine Learning
    {"name": "Amazon ML API", "description": "Simplifies model building, data cleansing, statistical analysis", "category": "Machine Learning", "url": "http://docs.aws.amazon.com/machine-learning/latest/APIReference/Welcome.html", "authType": "apiKey"},
    {"name": "AYLIEN Text Analysis", "description": "NLP, IR and ML tools for extracting meaning from content", "category": "Machine Learning", "url": "http://aylien.com/", "authType": "apiKey"},
    {"name": "Big ML", "description": "Machine learning API concentrating on decision trees", "category": "Machine Learning", "url": "http://bigml.com/api/", "authType": "apiKey"},
    {"name": "Cloud ML Engine", "description": "Cloud-based machine learning and pattern matching", "category": "Machine Learning", "url": "https://cloud.google.com/ml-engine/docs/", "authType": "oauth"},
    {"name": "Microsoft Azure ML", "description": "Publish in minutes what used to take days", "category": "Machine Learning", "url": "https://azure.microsoft.com/en-us/services/cognitive-services/", "authType": "apiKey"},
    {"name": "ObjectCut", "description": "Automatic background removal service powered by AI", "category": "Machine Learning", "url": "https://objectcut.com", "authType": "apiKey"},
    {"name": "OVHcloud AI Endpoints", "description": "Simplify GenAI and ML integration with secure APIs", "category": "Machine Learning", "url": "https://endpoints.ai.cloud.ovh.net/", "authType": "apiKey"},
    {"name": "Unplugg Forecasting", "description": "Automated Forecasting API for timeseries data", "category": "Machine Learning", "url": "http://unplu.gg/test_api.html", "authType": "apiKey"},
    
    # More categories continue...
    # Maps
    {"name": "Amazon Maps API", "description": "Interactive 3D maps for Fire Tablet and phone apps", "category": "Maps", "url": "https://developer.amazon.com/maps", "authType": "apiKey"},
    {"name": "Bing Maps", "description": "Multiple API options for your application", "category": "Maps", "url": "https://www.microsoft.com/maps/choose-your-bing-maps-API.aspx", "authType": "apiKey"},
    {"name": "Cartes.io", "description": "Create maps and markers without authentication", "category": "Maps", "url": "https://github.com/M-Media-Group/Cartes.io/wiki/API", "authType": "none"},
    {"name": "CartoDB", "description": "Generate maps based on CartoDB account data", "category": "Maps", "url": "https://carto.com/developers/", "authType": "apiKey"},
    {"name": "Daum Maps", "description": "Multiple APIs for Korean maps", "category": "Maps", "url": "http://apis.map.daum.net/", "authType": "apiKey"},
    {"name": "HERE Maps", "description": "Wide range of APIs via JavaScript, iOS, Android, REST", "category": "Maps", "url": "https://developer.here.com/", "authType": "apiKey"},
    {"name": "Leaflet.js", "description": "Open-source JavaScript library for interactive maps", "category": "Maps", "url": "http://leafletjs.com/", "authType": "none"},
    {"name": "Mapbox", "description": "Access to MapBox's API", "category": "Maps", "url": "https://www.mapbox.com/developers/api/maps/", "authType": "apiKey"},
    {"name": "OpenStreetMap", "description": "API access to OSM", "category": "Maps", "url": "http://wiki.openstreetmap.org/wiki/API", "authType": "none"},
    {"name": "Scribble Maps", "description": "Cross browser, mobile ready, interactive map builder", "category": "Maps", "url": "https://www.scribblemaps.com/api/", "authType": "apiKey"},
    {"name": "Yahoo Maps", "description": "Embed rich and interactive maps", "category": "Maps", "url": "https://developer.yahoo.com/maps/", "authType": "apiKey"},
    {"name": "Yandex Maps", "description": "Install Yandex.Maps on your web app", "category": "Maps", "url": "https://tech.yandex.com/maps/", "authType": "apiKey"},
    
    # Medical
    {"name": "COVID-19 Data API", "description": "Live and historical Coronavirus cases per country", "category": "Medical", "url": "https://github.com/M-Media-Group/Covid-19-API", "authType": "none"},
    {"name": "Infermedica", "description": "AI-based engine for patient triage and diagnosis", "category": "Medical", "url": "https://developer.infermedica.com/docs/introduction", "authType": "apiKey"},
    
    # Math
    {"name": "Newton Math", "description": "API for Arithmetic and Symbolic Math", "category": "Math", "url": "https://newton.now.sh/", "authType": "none"},
    
    # Miscellaneous
    {"name": "Mozilla Addons", "description": "Catalogue of addons for Firefox-compatible browsers", "category": "Miscellaneous", "url": "https://addons-server.readthedocs.io/en/latest/topics/api/index.html", "authType": "apiKey"},
    {"name": "Art Institute of Chicago", "description": "Explore and integrate public art data", "category": "Miscellaneous", "url": "https://api.artic.edu/docs/", "authType": "none"},
    {"name": "Bored API", "description": "Generates tasks to do when bored", "category": "Miscellaneous", "url": "https://www.boredapi.com/documentation", "authType": "none"},
    {"name": "Bhagavad Gita", "description": "Bhagavad Gita in various languages", "category": "Miscellaneous", "url": "https://bhagavadgita.io/", "authType": "none"},
    {"name": "BrowserCat", "description": "Headless browser API for automation, scraping, AI", "category": "Miscellaneous", "url": "https://www.browsercat.com/docs", "authType": "apiKey"},
    {"name": "Bruzu", "description": "Dynamically generate Images with a URL string", "category": "Miscellaneous", "url": "https://docs.bruzu.com", "authType": "apiKey"},
    {"name": "Callook.info", "description": "US ham radio callsign information", "category": "Miscellaneous", "url": "https://callook.info", "authType": "none"},
    {"name": "ChuckNorris.io", "description": "Hand curated Chuck Norris facts", "category": "Miscellaneous", "url": "https://api.chucknorris.io", "authType": "none"},
    {"name": "Cloudflare Trace", "description": "Get IP Address, Timestamp, User Agent, Country Code", "category": "Miscellaneous", "url": "https://www.cloudflare.com/cdn-cgi/trace", "authType": "none"},
    {"name": "Cloudlayer.io", "description": "Generate PDFs and Images from websites and HTML", "category": "Miscellaneous", "url": "https://cloudlayer.io", "authType": "apiKey"},
    {"name": "Codewars API", "description": "Coding challenge statistics and leaderboards", "category": "Miscellaneous", "url": "https://dev.codewars.com/", "authType": "none"},
    {"name": "Congress.gov API", "description": "Congress and public data from Congress.gov", "category": "Miscellaneous", "url": "https://api.congress.gov", "authType": "apiKey"},
    {"name": "Dataflow Kit", "description": "Web Scraper API, extract info, convert to PDF", "category": "Miscellaneous", "url": "https://dataflowkit.com/doc-api", "authType": "apiKey"},
    {"name": "Evil Insult Generator", "description": "Offers the most evil insults", "category": "Miscellaneous", "url": "https://evilinsult.com/api/", "authType": "none"},
    {"name": "Flowdash", "description": "Create, edit, delete workflow data on demand", "category": "Miscellaneous", "url": "https://docs.flowdash.com/docs/api-introduction", "authType": "apiKey"},
    {"name": "Game of Thrones Quotes", "description": "Free API to retrieve GoT quotes", "category": "Miscellaneous", "url": "https://gameofthronesquotes.xyz", "authType": "none"},
    {"name": "Geocodify", "description": "Worldwide geocoding, geoparsing and autocomplete", "category": "Miscellaneous", "url": "https://geocodify.com", "authType": "apiKey"},
    {"name": "Giphy", "description": "World's largest library of GIFs", "category": "Miscellaneous", "url": "https://developers.giphy.com/docs/", "authType": "apiKey"},
    {"name": "Httpbin", "description": "Simple HTTP Request and Response Service", "category": "Miscellaneous", "url": "https://httpbin.org/", "authType": "none"},
    {"name": "Icanhazepoch", "description": "Get Epoch time", "category": "Miscellaneous", "url": "https://icanhazepoch.com", "authType": "none"},
    {"name": "Icanhazip", "description": "IP Address API", "category": "Miscellaneous", "url": "https://major.io/icanhazip-com-faq/", "authType": "none"},
    {"name": "Image-Charts", "description": "Get chart image via URL GET or POST request", "category": "Miscellaneous", "url": "https://www.image-charts.com", "authType": "none"},
    {"name": "Jobicy", "description": "Latest remote job listings from diverse industries", "category": "Miscellaneous", "url": "https://jobicy.com/jobs-rss-feed", "authType": "none"},
    {"name": "JSONbin.io", "description": "Free JSON data storage for small scale apps", "category": "Miscellaneous", "url": "https://jsonbin.io/api-reference", "authType": "apiKey"},
    {"name": "Judge0", "description": "Compile and run source code", "category": "Miscellaneous", "url": "https://api.judge0.com/", "authType": "apiKey"},
    {"name": "LaunchLibrary", "description": "Aggregated info about space launches", "category": "Miscellaneous", "url": "https://launchlibrary.net/docs/1.3/api.html", "authType": "none"},
    {"name": "LinkPreview", "description": "JSON formatted summary with title, description, preview image", "category": "Miscellaneous", "url": "https://www.linkpreview.net", "authType": "apiKey"},
    {"name": "LiveChat", "description": "Customer Service software with webhooks and SDKs", "category": "Miscellaneous", "url": "https://developers.livechatinc.com/", "authType": "apiKey"},
    {"name": "NetworkCalc", "description": "Network calculator tools like subnet calculations", "category": "Miscellaneous", "url": "https://networkcalc.com/api/docs", "authType": "none"},
    {"name": "PDFmyURL", "description": "Converts web pages to PDF quickly", "category": "Miscellaneous", "url": "https://pdfmyurl.com/html-to-pdf-api", "authType": "apiKey"},
    {"name": "Pastebin", "description": "Share text or code with 250+ language syntax highlighting", "category": "Miscellaneous", "url": "https://pastebin.com/doc_scraping_api", "authType": "apiKey"},
    {"name": "PhantAuth", "description": "Random User Generator + OpenID Connect Provider", "category": "Miscellaneous", "url": "https://www.phantauth.net/", "authType": "none"},
    {"name": "QuickChart", "description": "Generate Chart.js image charts for email, dashboards", "category": "Miscellaneous", "url": "https://quickchart.io", "authType": "none"},
    {"name": "Quran API", "description": "RESTful Quran API for Ayah, Surah, Juz or entire Quran", "category": "Miscellaneous", "url": "https://alquran.cloud/api", "authType": "none"},
    {"name": "Scraper API", "description": "Handles proxies, browsers, and CAPTCHAs for web scraping", "category": "Miscellaneous", "url": "https://www.scraperapi.com", "authType": "apiKey"},
    {"name": "SearchApi", "description": "Real-time API for scraping search engine data", "category": "Miscellaneous", "url": "https://www.searchapi.io/", "authType": "apiKey"},
    {"name": "Shadify", "description": "Generate data and logic for games and puzzles", "category": "Miscellaneous", "url": "https://github.com/cheatsnake/shadify", "authType": "none"},
    {"name": "Shotstack Video Editing", "description": "Edit and generate thousands of customized videos", "category": "Miscellaneous", "url": "https://shotstack.io/docs/guide/getting-started/core-concepts/", "authType": "apiKey"},
    {"name": "Spreaker", "description": "Read and write data to Spreaker", "category": "Miscellaneous", "url": "https://developers.spreaker.com/", "authType": "apiKey"},
    {"name": "SSL-Checker", "description": "Collect SSL/TLS information from hosts", "category": "Miscellaneous", "url": "https://ssl-checker.io/", "authType": "none"},
    {"name": "StackExchange", "description": "RESTful services to all StackExchange sites", "category": "Miscellaneous", "url": "https://api.stackexchange.com/", "authType": "apiKey"},
    {"name": "RestCountries", "description": "Get information about countries via REST API", "category": "Miscellaneous", "url": "https://restcountries.eu", "authType": "none"},
    {"name": "Typeform", "description": "Create and edit Typeform surveys, retrieve responses", "category": "Miscellaneous", "url": "https://developer.typeform.com/", "authType": "oauth"},
    {"name": "Wallhaven", "description": "Huge wallpaper library", "category": "Miscellaneous", "url": "https://wallhaven.cc/help/api", "authType": "apiKey"},
    {"name": "Who Hosts This", "description": "Detect the hosting provider of any website", "category": "Miscellaneous", "url": "https://www.who-hosts-this.com/API", "authType": "apiKey"},
    {"name": "WolframAlpha", "description": "Computational knowledge for applications", "category": "Miscellaneous", "url": "http://products.wolframalpha.com/api/", "authType": "apiKey"},
    
    # Movies
    {"name": "OMDB", "description": "Information and metadata about movies", "category": "Movies", "url": "https://www.omdbapi.com/", "authType": "apiKey"},
    {"name": "TMDb", "description": "Powerful movie searches and discovery", "category": "Movies", "url": "https://www.themoviedb.org/documentation/api", "authType": "apiKey"},
    {"name": "Trakt", "description": "TV shows and movies everyone is watching", "category": "Movies", "url": "https://trakt.docs.apiary.io/", "authType": "apiKey"},
    {"name": "TVmaze", "description": "TV Show and web series database", "category": "Movies", "url": "https://www.tvmaze.com/api", "authType": "none"},
    
    # Music
    {"name": "AI Mastering", "description": "Automated audio mastering service", "category": "Music", "url": "https://aimastering.com/api_docs/", "authType": "apiKey"},
    {"name": "Deezer", "description": "Build applications with Deezer's music catalogue", "category": "Music", "url": "http://developers.deezer.com/api", "authType": "oauth"},
    {"name": "Discogs", "description": "Database of artists, labels, releases, marketplace", "category": "Music", "url": "https://www.discogs.com/developers/", "authType": "oauth"},
    {"name": "Last.fm", "description": "Build programs using Last.fm data", "category": "Music", "url": "http://www.last.fm/api", "authType": "apiKey"},
    {"name": "musicApi", "description": "Centralized API SDK for top 3 Chinese music providers", "category": "Music", "url": "https://github.com/LIU9293/musicAPI", "authType": "apiKey"},
    {"name": "NPR API", "description": "Get NPR stories in predictable, flexible way", "category": "Music", "url": "https://dev.npr.org/", "authType": "apiKey"},
    {"name": "Rhapsody", "description": "Access metadata and user's music library", "category": "Music", "url": "https://developer.rhapsody.com/", "authType": "oauth"},
    {"name": "SearchLy", "description": "Song similarity search based on lyrics", "category": "Music", "url": "https://github.com/AlbertSuarez/searchly", "authType": "none"},
    {"name": "SoundCloud", "description": "Take sound on the web to the next level", "category": "Music", "url": "https://developers.soundcloud.com", "authType": "oauth"},
    {"name": "Spotify Web API", "description": "Fetch data, manage playlists, control Spotify Connect", "category": "Music", "url": "https://beta.developer.spotify.com/documentation/web-api", "authType": "oauth"},
    {"name": "TheAudioDB", "description": "Free JSON API for music data, artwork, charting, ratings", "category": "Music", "url": "http://www.theaudiodb.com", "authType": "none"},
    
    # Music Discovery/Identification/Lyrics
    {"name": "Setlist.fm", "description": "Easy access to setlist data", "category": "Music", "url": "https://api.setlist.fm/docs/1.0/index.html", "authType": "apiKey"},
    {"name": "TuneFind", "description": "Song, show, and movie data from TuneFind", "category": "Music", "url": "http://www.tunefind.com/api", "authType": "apiKey"},
    {"name": "Genius", "description": "Details about artists and songs", "category": "Music", "url": "https://docs.genius.com/", "authType": "oauth"},
    {"name": "Acoustid", "description": "Search through fingerprint database", "category": "Music", "url": "https://acoustid.org/webservice", "authType": "apiKey"},
    {"name": "AudD", "description": "Recognize music in recordings and audio files", "category": "Music", "url": "https://docs.audd.io/", "authType": "apiKey"},
    {"name": "Gracenote", "description": "Largest source of music and video metadata", "category": "Music", "url": "https://developer.gracenote.com/", "authType": "apiKey"},
    {"name": "ChartLyrics", "description": "Search lyrics by artist name, song title, or lyric text", "category": "Music", "url": "http://www.chartlyrics.com/api.aspx", "authType": "none"},
    {"name": "Lololyrics", "description": "Lyrics and metadata for songs", "category": "Music", "url": "http://api.lololyrics.com/", "authType": "none"},
    {"name": "Musixmatch", "description": "World's most authoritative lyrics database", "category": "Music", "url": "https://developer.musixmatch.com/", "authType": "apiKey"},
    {"name": "iTunes Search", "description": "Search content in iTunes, App Store, iBooks Store", "category": "Music", "url": "https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/Searching.html", "authType": "none"},
    {"name": "Reverb", "description": "Sell and buy music related merchandise", "category": "Music", "url": "https://dev.reverb.com/", "authType": "oauth"},
    
    # News
    {"name": "Faroo News", "description": "Alternative to Google News Search API", "category": "News", "url": "http://www.faroo.com/hp/api/api.html", "authType": "apiKey"},
    {"name": "Mediastack", "description": "Scalable JSON API delivering worldwide news", "category": "News", "url": "https://mediastack.com/documentation", "authType": "apiKey"},
    {"name": "New York Times", "description": "Article search, best sellers, campaign finance, and more", "category": "News", "url": "http://developer.nytimes.com/", "authType": "apiKey"},
    {"name": "NewsAPI", "description": "70+ news sources and their headlines, one API", "category": "News", "url": "https://newsapi.org/", "authType": "apiKey"},
    {"name": "NewsCatcher", "description": "News API by any topic, country, language, website", "category": "News", "url": "https://newscatcherapi.com/news-api", "authType": "apiKey"},
    {"name": "RSS API", "description": "Parse and subscribe to RSS Feeds for webhooks", "category": "News", "url": "https://docs.rssapi.net", "authType": "apiKey"},
    {"name": "The Guardian", "description": "Access content from The Guardian", "category": "News", "url": "http://open-platform.theguardian.com/", "authType": "apiKey"},
    
    # NLP
    {"name": "Cloudmersive NLP", "description": "Unified NLP APIs including translation, sentiment", "category": "NLP", "url": "https://cloudmersive.com/nlp-api", "authType": "apiKey"},
    {"name": "Cohere", "description": "Text summarization, entity extraction, text generation", "category": "NLP", "url": "https://docs.cohere.com/reference/about", "authType": "apiKey"},
    {"name": "DialogFlow", "description": "Natural Language Interactions for Bots, Applications", "category": "NLP", "url": "https://dialogflow.com/", "authType": "oauth"},
    {"name": "Datum Box", "description": "Open-source Machine Learning Framework in Java", "category": "NLP", "url": "http://www.datumbox.com/machine-learning-api/", "authType": "apiKey"},
    {"name": "Lemonfox.ai", "description": "Speech-to-text API with 100+ languages", "category": "NLP", "url": "https://www.lemonfox.ai/apis/speech-to-text", "authType": "apiKey"},
    {"name": "LUIS AI", "description": "Language Understanding for applications", "category": "NLP", "url": "https://www.luis.ai/", "authType": "apiKey"},
    {"name": "MeaningCloud", "description": "Text analysis APIs for topic extraction, sentiment", "category": "NLP", "url": "https://www.meaningcloud.com", "authType": "apiKey"},
    {"name": "OpenAI API", "description": "Access to GPT-3 and Codex for natural language tasks", "category": "NLP", "url": "https://platform.openai.com/docs/introduction", "authType": "apiKey"},
    {"name": "ParallelDots", "description": "NLP APIs for sentiment analysis and emotion detection", "category": "NLP", "url": "https://www.paralleldots.com/text-analysis-apis", "authType": "apiKey"},
    {"name": "Shakespeare Translator", "description": "Shakespeare English Translation API", "category": "NLP", "url": "https://funtranslations.com/api/shakespeare", "authType": "apiKey"},
    {"name": "SpeechText.AI", "description": "Cloud Speech Recognition API", "category": "NLP", "url": "https://speechtext.ai/speech-recognition-api", "authType": "apiKey"},
    {"name": "SummarizeBot", "description": "Multilingual summarization, keywords, sentiment", "category": "NLP", "url": "https://www.summarizebot.com/summarization_business.html", "authType": "apiKey"},
    {"name": "TextRazor", "description": "Extract Who, What, Why, How from text", "category": "NLP", "url": "https://www.textrazor.com/plans", "authType": "apiKey"},
    {"name": "VoiceRSS", "description": "Convert Text to Speech in 15+ major languages", "category": "NLP", "url": "http://www.voicerss.org/", "authType": "apiKey"},
    {"name": "Wit AI", "description": "Intent-based NLP API for chat bots", "category": "NLP", "url": "https://wit.ai/", "authType": "apiKey"},
    {"name": "Word Associations", "description": "Get associations for words or phrases", "category": "NLP", "url": "https://wordassociations.net/en/api", "authType": "apiKey"},
    
    # Placeholder Images
    {"name": "DummyImage", "description": "Flexible placeholder images", "category": "Placeholder Images", "url": "https://dummyimage.com/", "authType": "none"},
    {"name": "Pixabay", "description": "Search and retrieve free images and videos", "category": "Placeholder Images", "url": "https://pixabay.com/api/docs/", "authType": "apiKey"},
    {"name": "SingleColorImage", "description": "Generate single color images up to 5000x5000", "category": "Placeholder Images", "url": "https://singlecolorimage.com/api.html", "authType": "none"},
    {"name": "Lorem Picsum", "description": "Beautiful placeholders using Unsplash images", "category": "Placeholder Images", "url": "https://picsum.photos/", "authType": "none"},
    
    # Places
    {"name": "bng2latlong", "description": "Convert British National Grid to WGS84 coordinates", "category": "Places", "url": "https://www.getthedata.com/bng2latlong", "authType": "none"},
    {"name": "CountryAPI", "description": "Get all countries with important information", "category": "Places", "url": "https://fabian7593.github.io/CountryAPI/", "authType": "none"},
    {"name": "Factual", "description": "Places search by lat/long and full text query", "category": "Places", "url": "https://developer.factual.com/docs/getting-started", "authType": "apiKey"},
    {"name": "Foursquare Venue", "description": "Places search by categories, coordinates", "category": "Places", "url": "https://developer.foursquare.com/overview/venues", "authType": "oauth"},
    {"name": "Google Places API", "description": "Places search by lat/long, keyword, name, type", "category": "Places", "url": "https://developers.google.com/maps/documentation/places/web-service/overview", "authType": "apiKey"},
    {"name": "Nokia Places", "description": "JavaScript places search and detail display", "category": "Places", "url": "https://developer.here.com/develop/javascript-api", "authType": "apiKey"},
    {"name": "World Wonders API", "description": "Information about famous wonders from around the world", "category": "Places", "url": "https://github.com/Rolv-Apneseth/world-wonders-api", "authType": "none"},
    {"name": "Yelp", "description": "Search by location, neighborhood, address or city", "category": "Places", "url": "https://docs.developer.yelp.com/docs/getting-started", "authType": "apiKey"},
    
    # Product
    {"name": "Product Hunt API", "description": "The best new products, every day", "category": "Product", "url": "https://api.producthunt.com/v2/docs", "authType": "oauth"},
    
    # Quotes
    {"name": "Breaking Bad Quotes", "description": "Quotes from Breaking Bad", "category": "Quotes", "url": "https://breakingbadquotes.xyz", "authType": "none"},
    {"name": "FavQs", "description": "Collect, discover, and share favorite quotes", "category": "Quotes", "url": "https://favqs.com/api", "authType": "apiKey"},
    {"name": "Forismatic", "description": "Random quote per click", "category": "Quotes", "url": "http://api.forismatic.com/api/1.0/", "authType": "none"},
    {"name": "Hindi Quotes", "description": "Random Hindi quotes of different categories", "category": "Quotes", "url": "https://hindi-quotes.vercel.app/", "authType": "none"},
    {"name": "Quotable", "description": "Fetch quotes by author, ID, tags", "category": "Quotes", "url": "https://github.com/lukePeavey/quotable", "authType": "none"},
    {"name": "South Park Quotes", "description": "Get and search quotes from South Park", "category": "Quotes", "url": "https://github.com/Thatskat/southpark-quotes-api", "authType": "none"},
    {"name": "They Said So", "description": "Random quote per day", "category": "Quotes", "url": "http://quotes.rest/qod.json?category=inspire", "authType": "none"},
    
    # Science
    {"name": "MPDS", "description": "Experimental materials science data from publications", "category": "Science", "url": "https://developer.mpds.io", "authType": "apiKey"},
    {"name": "NASA API", "description": "NASA data including imagery and asteroid data", "category": "Science", "url": "https://api.nasa.gov/index.html", "authType": "apiKey"},
    {"name": "Open Science Framework", "description": "Workflow management for research", "category": "Science", "url": "https://osf.io/y9jdt/wiki/home/", "authType": "oauth"},
    {"name": "Open Access Button", "description": "Free legal research articles instantly", "category": "Science", "url": "https://openaccessbutton.org/api", "authType": "apiKey"},
    {"name": "SHARE", "description": "Free dataset of scholarly research activity", "category": "Science", "url": "http://share-research.readthedocs.io/en/latest/", "authType": "none"},
    
    # Screenshots
    {"name": "ApiFlash", "description": "Chrome based screenshot API to convert URLs to images", "category": "Screenshots", "url": "https://apiflash.com/", "authType": "apiKey"},
    {"name": "SavePage.io", "description": "Free RESTful API for screenshots", "category": "Screenshots", "url": "https://docs.savepage.io", "authType": "apiKey"},
    {"name": "ScreenshotAPI.net", "description": "Screenshot any website with one API call", "category": "Screenshots", "url": "https://screenshotapi.net", "authType": "apiKey"},
    
    # Social Media
    {"name": "Ayrshare", "description": "Social media APIs for scheduling, analytics", "category": "Social Media", "url": "https://docs.ayrshare.com", "authType": "apiKey"},
    {"name": "Daily Motion", "description": "Build applications centered around DailyMotion", "category": "Social Media", "url": "https://developer.dailymotion.com/", "authType": "oauth"},
    {"name": "Delicious", "description": "Access to Delicious's bookmarking API", "category": "Social Media", "url": "https://github.com/domainersuitedev/delicious-api", "authType": "oauth"},
    {"name": "DeviantArt", "description": "Largest social networking website for artists", "category": "Social Media", "url": "https://www.deviantart.com/developers/", "authType": "oauth"},
    {"name": "EventBrite", "description": "Interact with the Eventbrite API", "category": "Social Media", "url": "https://github.com/eventbrite/eventbrite-sdk-python", "authType": "oauth"},
    {"name": "Flickr", "description": "Search user content, contacts, upload photos", "category": "Social Media", "url": "https://www.flickr.com/services/api/", "authType": "oauth"},
    {"name": "GoodReads", "description": "Access to Goodreads data for book applications", "category": "Social Media", "url": "https://www.goodreads.com/api", "authType": "apiKey"},
    {"name": "Gravatar", "description": "Create profiles and avatars", "category": "Social Media", "url": "https://en.gravatar.com/site/implement/", "authType": "none"},
    {"name": "Hacker News", "description": "Anything good hackers would find interesting", "category": "Social Media", "url": "https://github.com/HackerNews/API", "authType": "none"},
    {"name": "Imgur", "description": "Entire Imgur infrastructure via standardized interface", "category": "Social Media", "url": "https://api.imgur.com/", "authType": "oauth"},
    {"name": "Mastodon", "description": "Access to open-source Twitter competitor APIs", "category": "Social Media", "url": "https://docs.joinmastodon.org/", "authType": "oauth"},
    {"name": "Microlink", "description": "Turn any link into information, take screenshots", "category": "Social Media", "url": "https://microlink.io", "authType": "apiKey"},
    {"name": "Pinterest", "description": "View clicked-through Pins, related posts, user profiles", "category": "Social Media", "url": "https://developers.pinterest.com/", "authType": "oauth"},
    {"name": "Reddit", "description": "API to build clients, crawlers, scrapers, extensions", "category": "Social Media", "url": "https://github.com/reddit/reddit/wiki/API", "authType": "oauth"},
    {"name": "Telegram", "description": "Build customized Telegram clients", "category": "Social Media", "url": "https://core.telegram.org/", "authType": "apiKey"},
    {"name": "TikTok Display API", "description": "Display TikTok creator videos and profile info", "category": "Social Media", "url": "https://developers.tiktok.com/", "authType": "oauth"},
    {"name": "Twitch", "description": "Develop using rich Twitch feature set", "category": "Social Media", "url": "https://dev.twitch.tv/docs", "authType": "oauth"},
    {"name": "Twitter API", "description": "Interact with many Twitter functions", "category": "Social Media", "url": "https://developer.twitter.com/", "authType": "oauth"},
    {"name": "Tumblr", "description": "Create with content, likes, followers, and drafts", "category": "Social Media", "url": "https://www.tumblr.com/docs/en/api/v2", "authType": "oauth"},
    {"name": "Vimeo", "description": "Access to Vimeo's API", "category": "Social Media", "url": "https://developer.vimeo.com/", "authType": "oauth"},
    {"name": "Viber", "description": "Create unique experiences for users at scale", "category": "Social Media", "url": "https://developers.viber.com/docs/api/", "authType": "apiKey"},
    {"name": "VK", "description": "Access to VKontakte's API", "category": "Social Media", "url": "https://vk.com/dev", "authType": "oauth"},
    {"name": "Weibo", "description": "Programmatic access to China's microblogging site", "category": "Social Media", "url": "http://open.weibo.com/wiki/API%E6%96%87%E6%A1%A3/en", "authType": "oauth"},
    {"name": "WhatsApp Document Interaction", "description": "Share media using WhatsApp", "category": "Social Media", "url": "https://faq.whatsapp.com/en/iphone/23559013", "authType": "none"},
    {"name": "WordPress", "description": "Access to WordPress APIs", "category": "Social Media", "url": "https://codex.wordpress.org/WordPress_APIs", "authType": "oauth"},
    {"name": "Untappd", "description": "Socially share beers you're enjoying", "category": "Social Media", "url": "https://untappd.com/api/docs", "authType": "oauth"},
    {"name": "YouTube Data API", "description": "Add YouTube functionality to sites and apps", "category": "Social Media", "url": "https://developers.google.com/youtube/", "authType": "oauth"},
    {"name": "Zomato", "description": "Restaurant info for 1.5 million restaurants globally", "category": "Social Media", "url": "https://developers.zomato.com/api", "authType": "apiKey"},
    
    # Source Control
    {"name": "Bitbucket", "description": "Access to Bitbucket's API", "category": "Source Control", "url": "https://developer.atlassian.com/bitbucket/api/2/reference/", "authType": "oauth"},
    {"name": "GitHub", "description": "Build real-world GitHub applications", "category": "Source Control", "url": "https://developer.github.com/v3/", "authType": "oauth"},
    {"name": "GitHub Gists", "description": "Access to GitHub's Gists API", "category": "Source Control", "url": "https://developer.github.com/v3/gists/", "authType": "oauth"},
    {"name": "GitLab", "description": "Access to GitLab's API", "category": "Source Control", "url": "https://docs.gitlab.com/ce/api/README.html", "authType": "oauth"},
    {"name": "Mercurial", "description": "Access to Mercurial's API", "category": "Source Control", "url": "https://www.mercurial-scm.org/wiki/MercurialApi", "authType": "none"},
    {"name": "SVN", "description": "Collection of modular libraries in C", "category": "Source Control", "url": "https://subversion.apache.org/docs/api/1.8/", "authType": "none"},
    {"name": "Azure DevOps", "description": "TFS APIs based on REST, OAuth, Json", "category": "Source Control", "url": "https://docs.microsoft.com/en-us/azure/devops/integrate/", "authType": "oauth"},
    
    # Sport
    {"name": "Ergast Formula 1", "description": "Current and historical Formula 1 race data", "category": "Sport", "url": "http://ergast.com/mrd/", "authType": "none"},
    {"name": "FIFA World Cup", "description": "FIFA women's world cup 2019 matches and results", "category": "Sport", "url": "https://worldcup.sfg.io/", "authType": "none"},
    {"name": "Football Prediction", "description": "Predictions for upcoming football matches, odds", "category": "Sport", "url": "https://boggio-analytics.com/fp-api/", "authType": "apiKey"},
    {"name": "LIVE-SCORE API", "description": "Football API for live-scores, fixtures, standings", "category": "Sport", "url": "https://live-score-api.com/documentation/reference/", "authType": "apiKey"},
    {"name": "NBA GraphQL", "description": "Current and historical NBA Stats", "category": "Sport", "url": "https://nbaapi.com/graphql/", "authType": "none"},
    {"name": "NBA REST API", "description": "Current and Historical NBA Stats and Shot Chart", "category": "Sport", "url": "http://rest.nbaapi.com/index.html", "authType": "none"},
    {"name": "OpenF1", "description": "Real-time and historical Formula 1 data", "category": "Sport", "url": "https://openf1.org/", "authType": "none"},
    {"name": "OpenLigaDB", "description": "Sports data especially football league info", "category": "Sport", "url": "https://www.openligadb.de/", "authType": "none"},
    {"name": "Roanuz Cricket", "description": "Cricket scores and player information", "category": "Sport", "url": "https://www.cricketapi.com/v5/docs/", "authType": "apiKey"},
    {"name": "TheSportsDB", "description": "Sports events, results, players, teams, artwork", "category": "Sport", "url": "http://www.thesportsdb.com/", "authType": "apiKey"},
    
    # Transportation
    {"name": "ADS-B Exchange", "description": "Real-time and historical aircraft data", "category": "Transportation", "url": "https://www.adsbexchange.com/data/", "authType": "apiKey"},
    {"name": "AfterShip", "description": "Multi-carrier shipment tracking APIs", "category": "Transportation", "url": "https://www.aftership.com/docs/api/4/overview", "authType": "apiKey"},
    {"name": "CarsXE API", "description": "Millions of vehicle records, specs, ownership costs", "category": "Transportation", "url": "https://api.carsxe.com/", "authType": "apiKey"},
    {"name": "Edmunds", "description": "Dataset containing all car makes", "category": "Transportation", "url": "http://developer.edmunds.com/", "authType": "apiKey"},
    {"name": "HyperTrack", "description": "Build applications that track business movement", "category": "Transportation", "url": "https://docs.hypertrack.com", "authType": "apiKey"},
    {"name": "Lyft", "description": "Real-time ETAs, availability, price estimates", "category": "Transportation", "url": "https://www.lyft.com/developers", "authType": "oauth"},
    {"name": "Postmen", "description": "Add shipping capability of FedEx, UPS, DHL, USPS", "category": "Transportation", "url": "https://docs.postmen.com/", "authType": "apiKey"},
    {"name": "Ola", "description": "Find, book and track Ola rides in India", "category": "Transportation", "url": "https://developers.olacabs.com/", "authType": "apiKey"},
    {"name": "Uber", "description": "Customizing trips, requesting rides, powering logistics", "category": "Transportation", "url": "https://developer.uber.com/", "authType": "oauth"},
    
    # URL Shorteners
    {"name": "Bitly", "description": "Access to Bitly's URL shortening API", "category": "URL Shorteners", "url": "http://dev.bitly.com/links.html", "authType": "oauth"},
    {"name": "GoTiny", "description": "Lightweight URL shortener with JavaScript SDK", "category": "URL Shorteners", "url": "https://github.com/robvanbakel/gotiny-api", "authType": "none"},
    {"name": "Is.gd", "description": "Simple URL shortener with custom links", "category": "URL Shorteners", "url": "https://is.gd/developers.php", "authType": "none"},
    {"name": "ShrtURI", "description": "API for shortening long URLs", "category": "URL Shorteners", "url": "https://shrturi.com/docs", "authType": "apiKey"},
    {"name": "Tiny.cc", "description": "Easy-to-use URL shortener", "category": "URL Shorteners", "url": "https://tiny.cc/api-docs", "authType": "apiKey"},
    {"name": "Tiny.UID", "description": "API for shortening long URLs", "category": "URL Shorteners", "url": "https://tinyuid.com/docs", "authType": "apiKey"},
    {"name": "V.gd", "description": "Simple URL shortener with custom ending", "category": "URL Shorteners", "url": "https://v.gd/developers.php", "authType": "none"},
    {"name": "Yourls", "description": "Generate or get short URLs with custom keywords", "category": "URL Shorteners", "url": "https://yourls.org/", "authType": "apiKey"},
    
    # Videogames
    {"name": "Autochess VNG API", "description": "Data about Autochess VNG", "category": "Videogames", "url": "https://github.com/didadadida93/autochess-vng-api", "authType": "none"},
    {"name": "CSGO API", "description": "Unofficial JSON API for Counter-Strike", "category": "Videogames", "url": "https://bymykel.github.io/CSGO-API/", "authType": "none"},
    {"name": "Clash Of Clans", "description": "Information about players, clans, wars", "category": "Videogames", "url": "https://developer.clashofclans.com/", "authType": "apiKey"},
    {"name": "Clash Royale", "description": "Information about Clash Royale game", "category": "Videogames", "url": "https://github.com/martincarrera/clash-royale-api", "authType": "apiKey"},
    {"name": "FreeToGame", "description": "Free-to-play games database API", "category": "Videogames", "url": "https://www.freetogame.com/api-doc", "authType": "none"},
    {"name": "GamerPower", "description": "Best giveaways in gaming, free games to beta keys", "category": "Videogames", "url": "https://www.gamerpower.com/api-read", "authType": "none"},
    {"name": "GiantBomb", "description": "Query database for videogames, characters, companies", "category": "Videogames", "url": "http://www.giantbomb.com/api/", "authType": "apiKey"},
    {"name": "Hyrule Compendium", "description": "Data on all items in Breath of the Wild", "category": "Videogames", "url": "http://github.com/gadhagod/Hyrule-Compendium-API", "authType": "none"},
    {"name": "IGDB", "description": "International Games Database", "category": "Videogames", "url": "https://www.igdb.com/api", "authType": "apiKey"},
    {"name": "MMO Games", "description": "MMO Games database, news and giveaways", "category": "Videogames", "url": "https://www.mmobomb.com/api", "authType": "none"},
    {"name": "RAWG", "description": "Open video game database by platform, genre, company", "category": "Videogames", "url": "https://rawg.io/apidocs", "authType": "apiKey"},
    {"name": "Riot Games", "description": "Riot Games game information API", "category": "Videogames", "url": "https://developer.riotgames.com/", "authType": "apiKey"},
    
    # Weather
    {"name": "AccuWeather", "description": "Hourly and minute by minute forecasts", "category": "Weather", "url": "https://developer.accuweather.com/", "authType": "apiKey"},
    {"name": "AerisWeather", "description": "Global weather data and imagery APIs", "category": "Weather", "url": "https://www.aerisweather.com", "authType": "apiKey"},
    {"name": "BlueSky Weather", "description": "Global weather data with free tier", "category": "Weather", "url": "https://blueskyapi.io/docs/api", "authType": "apiKey"},
    {"name": "Open-Meteo", "description": "Global weather forecast API, free for non-commercial", "category": "Weather", "url": "https://open-meteo.com/en/docs", "authType": "none"},
    {"name": "OpenWeatherMap", "description": "Current weather data for 200,000+ cities", "category": "Weather", "url": "http://openweathermap.org/api", "authType": "apiKey"},
    {"name": "Storm Glass Marine", "description": "Global marine weather data from multiple sources", "category": "Weather", "url": "https://stormglass.io", "authType": "apiKey"},
    {"name": "Weather-API", "description": "Free RESTful API to check the weather", "category": "Weather", "url": "https://github.com/robertoduessmann/weather-api", "authType": "none"},
    {"name": "Weatherbit", "description": "Forecasts, current weather, historical weather", "category": "Weather", "url": "https://www.weatherbit.io/api", "authType": "apiKey"},
    {"name": "Weather Source", "description": "Powerful Weather API for heavy load", "category": "Weather", "url": "http://weathersource.com/weather-api", "authType": "apiKey"},
    {"name": "Weatherstack", "description": "Real-Time and Historical World Weather Data", "category": "Weather", "url": "https://weatherstack.com/documentation", "authType": "apiKey"},
    {"name": "Wunderground", "description": "Reliable data in 80 languages", "category": "Weather", "url": "https://www.wunderground.com/weather/api/", "authType": "apiKey"},
]

# Output path
output_file = "/Users/gustavhemmingsson/Projects/apiclaw/data/night-expansion-02-27-06.json"

# Write to file
print(f"Writing {len(new_apis)} APIs to {output_file}...")
with open(output_file, 'w') as f:
    json.dump(new_apis, f, indent=2)

print(f"✅ Done! Wrote {len(new_apis)} APIs")
print(f"Categories covered: {len(set(api['category'] for api in new_apis))}")

# Also output stats
categories = {}
for api in new_apis:
    cat = api['category']
    categories[cat] = categories.get(cat, 0) + 1

print("\nCategory breakdown:")
for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
    print(f"  {cat}: {count}")
