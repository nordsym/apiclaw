#!/usr/bin/env python3
"""
APIClaw Expansion: Parse GitHub awesome-apis lists
"""
import json
import re
import hashlib
from pathlib import Path

registry_path = Path(__file__).parent.parent / 'src/registry/apis.json'

# Load existing registry
with open(registry_path) as f:
    registry = json.load(f)

existing_ids = {a['id'].lower() for a in registry['apis']}
existing_links = {a.get('link', '').lower().rstrip('/') for a in registry['apis']}
existing_names = {a['name'].lower() for a in registry['apis']}

def make_id(name):
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return slug[:50] if len(slug) > 50 else slug

def add_api(name, desc, category, link, auth='None', https=True, cors='unknown'):
    api_id = make_id(name)
    
    # Skip if exists
    if api_id in existing_ids:
        return False
    if link.lower().rstrip('/') in existing_links:
        return False
    if name.lower() in existing_names:
        return False
    
    # Generate unique ID if collision
    if api_id in existing_ids:
        api_id = f"{api_id}-{hashlib.md5(link.encode()).hexdigest()[:6]}"
    
    keywords = [category.lower()]
    desc_lower = desc.lower()
    if 'free' in desc_lower:
        keywords.append('free')
    if 'json' in desc_lower:
        keywords.append('json')
    if 'rest' in desc_lower:
        keywords.append('rest')
    if 'open' in desc_lower:
        keywords.append('opensource')
    
    registry['apis'].append({
        'id': api_id,
        'name': name,
        'description': desc[:500],
        'category': category,
        'auth': auth,
        'https': https,
        'cors': cors,
        'link': link,
        'pricing': 'unknown',
        'keywords': list(set(keywords)),
        'source': 'github-awesome'
    })
    existing_ids.add(api_id)
    existing_links.add(link.lower().rstrip('/'))
    existing_names.add(name.lower())
    return True

added = 0

# ======================
# n0shake/Public-APIs extra additions
# ======================

# Advertising
new_apis = [
    ("Amazon Mobile Ads", "Monetize across platforms with multiple ad formats", "Advertising", "https://developer.amazon.com/mobile-ads"),
    ("Facebook Marketing API", "Manage ads and campaigns using the Facebook API", "Advertising", "https://developers.facebook.com/docs/marketing-apis"),
    ("Google AdSense", "Free, flexible way to earn money from your websites", "Advertising", "https://developers.google.com/adsense/?hl=en"),
    ("Google AdWords API", "Manage Google AdWords campaigns programmatically", "Advertising", "https://developers.google.com/adwords/api/docs/guides/start"),
    ("Kevel Ad APIs", "Build your own ad server with Kevel's ad APIs", "Advertising", "https://dev.kevel.co"),
    
    # Analytics additions
    ("Amazon Mobile Analytics", "Service for collecting, visualizing, and understanding app usage data", "Analytics", "https://aws.amazon.com/documentation/mobileanalytics/"),
    ("Clicky", "Extract your website's traffic data into several formats", "Analytics", "https://clicky.com/help/api"),
    ("Fabric (Firebase)", "Platform that helps your mobile team build better apps", "Analytics", "https://firebase.google.com/"),
    ("Localytics", "Interface to Localytics analytics platform", "Analytics", "http://docs.localytics.com/dev/query-api.html#query-api"),
    ("Matomo", "All-in-one premium web analytics platform", "Analytics", "https://matomo.org/docs/analytics-api/"),
    ("Open Web Analytics", "Way to request and work with your data outside of OWA", "Analytics", "https://github.com/padams/Open-Web-Analytics/wiki/Data-Access-API"),
    ("Ticksel", "Friendly website analytics made for humans", "Analytics", "https://ticksel.com"),
    ("Woopra", "Real-time website analysis tool that targets customer engagement", "Analytics", "https://www.woopra.com/docs/developer/analytics-api/"),
    
    # AR/VR
    ("Vuforia", "Solid SDK with robust development options for AR", "AR/VR", "https://library.vuforia.com/"),
    ("Wikitude", "All-in-one AR solution includes image recognition & tracking", "AR/VR", "http://www.wikitude.com/download/"),
    
    # Barcode
    ("Dynamic QR Code", "Generate dynamic and static QR Codes", "Barcode", "https://rapidapi.com/updeploy-tools/api/qr-code-dynamic-and-static1/details"),
    ("Google Barcode", "Barcode API detects barcodes in real-time", "Barcode", "https://developers.google.com/vision/barcodes-overview?hl=en"),
    ("EAN-Search", "Lookup products by EAN, UPC or GTIN barcode", "Barcode", "https://www.ean-search.org/ean-database-api.html"),
    ("QR Code Generator API", "Static and Dynamic QR code generator API", "Barcode", "https://docs.openqr.io/"),
    
    # Big Data
    ("Google Charts", "Free tool with wide range of capabilities for visualizing data", "Big Data", "https://developers.google.com/chart/interactive/docs/"),
    ("Keen IO", "Powerful, flexible, and scalable Big Data solution", "Big Data", "https://keen.io/docs/api/"),
    ("LinkedData.Center", "RDF graph database as a service with SPARQL", "Big Data", "http://linkeddata.center/home/gdaas"),
    
    # Cryptocurrency additional
    ("Block.io", "Most versatile and secure wallet for all your coins", "Cryptocurrency", "https://block.io/"),
    ("BlockCypher", "Infrastructure fabric for blockchain applications", "Cryptocurrency", "https://www.blockcypher.com/"),
    ("BlockFacts.io", "Compliance-first digital asset data", "Cryptocurrency", "https://blockfacts.io/"),
    ("Coinigy", "Interacting with Coinigy Accounts and Exchange Directly", "Cryptocurrency", "https://coinigy.docs.apiary.io"),
    ("Covalent", "Multi-blockchain data aggregator", "Cryptocurrency", "https://www.covalenthq.com/docs/api/"),
    ("PENDAX", "SDK for Trading, Data, and Websockets", "Cryptocurrency", "https://github.com/CompendiumFi/PENDAX-SDK"),
    ("ShapeShift.io", "Exchange between cryptocurrencies without an account", "Cryptocurrency", "https://shapeshift.io/"),
    ("Technical Analysis API", "Cryptocurrency prices, technical analysis and sentiment", "Cryptocurrency", "https://technical-analysis-api.com"),
    
    # Calendar
    ("CalendarIndex", "Worldwide Holidays and Working Days API", "Calendar", "https://www.calendarindex.com"),
    ("DigiDates API", "Rest API for date and time calculations", "Calendar", "https://digidates.de/en/"),
    ("Holiday API", "Public holiday API service for several supported countries", "Calendar", "https://holidayapi.pl/"),
    ("OpenHolidays API", "Public and school holidays for European countries", "Calendar", "https://www.openholidaysapi.org/"),
    
    # Captcha
    ("Anti-Captcha", "Access to Anti-Captcha's API", "Captcha", "https://anti-captcha.com/apidoc"),
    ("ProxyCrawl", "Crawl and scrape websites without proxies", "Captcha", "https://proxycrawl.com"),
    
    # Check-In
    ("Facebook Check-In", "A check-in made to a location-based Page", "Location", "https://developers.facebook.com/docs/graph-api/reference/v2.3/checkin"),
    ("Google Places", "Access to Google Places' API", "Location", "https://developers.google.com/places/?hl=en"),
    ("Foursquare Check-In", "Allows you to check in to a place", "Location", "https://developer.foursquare.com/reference/v2-checkins-add"),
    
    # Commerce
    ("Commerce Layer", "Headless commerce platform", "Commerce", "https://docs.commercelayer.io/api/"),
    ("envoice", "Invoicing for online businesses", "Commerce", "https://www.envoice.in/reference/api/docs"),
    ("koomalooma", "Loyalty BPaaS for mobile and web companies", "Commerce", "http://business.koomalooma.com"),
    ("Moltin", "Unified APIs for inventory, carts, checkout, payments", "Commerce", "https://www.moltin.com/developers"),
    ("Repetiti", "3d Printer Management Service", "Commerce", "https://developers.repetiti.com"),
    ("Yellow Pages API", "Get data for all categories of businesses", "Commerce", "https://github.com/Hrushi11/Yellow-Pages-End-API"),
    
    # Communication
    ("Africa's Talking", "Access African telco services through HTTP API", "Communication", "https://africastalking.com/"),
    ("iP1sms", "Send and receive SMS messages worldwide", "Communication", "https://www.ip1sms.com/en/developer/"),
    ("Eqivo", "Telephony/Programmable-Voice API platform", "Communication", "https://eqivo.org"),
    ("Sakari", "Send and Receive SMS to over 200+ countries", "Communication", "https://developer.sakari.io"),
    ("Telnyx", "Build Voice, SMS, Fax, Networking and Cellular IoT", "Communication", "https://developers.telnyx.com/"),
    ("The SMS Works", "Low-cost, reliable SMS API for developers", "Communication", "https://thesmsworks.co.uk/sms-api"),
    
    # Content
    ("Bible API", "Lightning-fast Bible API, 200+ translations", "Content", "https://github.com/wldeh/bible-api"),
    ("Bible API Alt", "JSON API for public domain and open bible translations", "Content", "https://bible-api.com/"),
    ("Fruits API", "API GraphQL with information on fruit trees", "Content", "https://github.com/Franqsanz/fruits-api"),
    ("Jokes One", "Full featured Jokes API", "Content", "https://jokes.one/api/joke/"),
    ("Perfect Tense API", "Grammar checking API using AI", "Content", "https://www.perfecttense.com/developers"),
    ("Random Data Generator", "API Generator for telephones, text, numbers", "Content", "https://randommer.io/randommer-api"),
    ("Random Facts", "Random Facts API", "Content", "https://fungenerators.com/api/facts/"),
    ("Today in History", "Daily historical events, births and deaths API", "Content", "https://history.muffinlabs.com/"),
    
    # Currency
    ("Currency-api", "Free Currency Exchange Rates API with 150+ Currencies", "Currency", "https://github.com/fawazahmed0/currency-api#readme"),
    ("Frankfurter", "Exchange rates and currency data API", "Currency", "https://www.frankfurter.app/docs/"),
    
    # Design
    ("Dribbble", "Discover the world's top designers & creatives", "Design", "http://developer.dribbble.com/"),
    ("Icon Horse", "Get favicon logo for any web address", "Design", "https://icon.horse/usage"),
    ("Pexels", "High quality and completely free stock photos", "Design", "https://www.pexels.com/api/"),
    ("PHP-Noise", "Noise background image generator api", "Design", "https://php-noise.com/"),
    
    # Dictionary
    ("Agarathi", "Tamil language Dictionary API", "Dictionary", "https://agarathi.com/api/dictionary"),
    ("Cambridge Dictionaries", "Access to Cambridge's custom-developed API", "Dictionary", "http://dictionary.cambridge.org/license.html"),
    ("Datamuse API", "Word-finding query engine", "Dictionary", "https://www.datamuse.com/api/"),
    ("Free Dictionary API", "Get word definitions for free", "Dictionary", "https://dictionaryapi.dev/"),
    ("Lingua Robot API", "Definition of words, pronunciations, synonyms", "Dictionary", "https://www.linguarobot.io/"),
    ("Oxford Dictionary API", "Access to Oxford Dictionary services", "Dictionary", "https://developer.oxforddictionaries.com/"),
    ("Wordnik", "Dictionary functions", "Dictionary", "http://developer.wordnik.com/docs.html#!/word"),
    ("Words API", "Definitions for more than 150,000 words", "Dictionary", "https://www.wordsapi.com/"),
    
    # Entertainment
    ("AniList", "Anime discovery & tracking GraphQL API", "Entertainment", "https://github.com/AniList/ApiV2-GraphQL-Docs"),
    ("Bob's Burgers API", "Data for Bob's Burgers characters, episodes", "Entertainment", "https://www.bobsburgersapi.com/documentation"),
    ("Breaking Bad API", "Get data about characters, episodes, quotes", "Entertainment", "https://breakingbadapi.com/documentation"),
    ("Cat as a Service", "REST API to spread peace and love with cats", "Entertainment", "https://cataas.com/#/"),
    ("Comic Vine", "Extremely mature comic information resource", "Entertainment", "http://comicvine.gamespot.com/api/"),
    ("Danbooru", "Get images categorized by tags", "Entertainment", "https://danbooru.donmai.us/posts?tags=help%3Aapi"),
    ("Dune API", "Book, character, movie and quotes JSON data", "Entertainment", "https://github.com/ywalia01/dune-api"),
    ("Final Space API", "Information and images about Final Space", "Entertainment", "https://finalspaceapi.com/docs/"),
    ("Fun Translations API", "Translate to over 50+ languages from TV Series", "Entertainment", "https://funtranslations.com/api/"),
    ("Jandapress API", "A doujinshi API with gather in mind", "Entertainment", "https://github.com/sinkaroid/jandapress"),
    ("Lord of the Rings API", "Data about books, movies, characters, quotes", "Entertainment", "https://the-one-api.dev/documentation"),
    ("Marvel", "Access over 70 years of comic data", "Entertainment", "https://developer.marvel.com/"),
    ("My Anime List API (Jikan)", "Data about any specific anime", "Entertainment", "https://jikan.moe/"),
    ("Nick Cannon Baby API", "JSON API for entertainer Nick Cannon's children", "Entertainment", "https://nick-cannon-baby-api.onrender.com/"),
    ("Owen Wilson Wow API", "JSON API for Owen Wilson's wow exclamations", "Entertainment", "https://owen-wilson-wow-api.onrender.com/"),
    ("Pokéapi", "All the Pokémon data you'll ever need", "Entertainment", "https://pokeapi.co/"),
    ("Rick and Morty", "All Rick and Morty information, including images", "Entertainment", "https://rickandmortyapi.com/"),
    ("Riddles API", "An API to get random riddles", "Entertainment", "https://riddles-api.vercel.app/"),
    ("Star Trek API (STAPI)", "Star Trek data API", "Entertainment", "https://stapi.co/api-documentation"),
    ("Star Wars API (SWAPI)", "All things Star Wars", "Entertainment", "https://www.swapi.tech/"),
    ("Studio Ghibli", "Resources from Studio Ghibli films", "Entertainment", "https://ghibliapi.vercel.app/"),
    ("TCGdex", "Multilanguage Pokémon TCG Database", "Entertainment", "https://www.tcgdex.dev/"),
    
    # Events
    ("Picatic", "Sell tickets directly from your app or website", "Events", "http://developer.picatic.com/?utm_medium=web"),
    
    # Face Recognition
    ("Kairos", "Face recognition, emotion analysis", "Face Recognition", "https://www.kairos.com/"),
    ("Skybiometry", "Face detection, emotional analysis", "Face Recognition", "https://www.skybiometry.com"),
    
    # File Storage
    ("Amazon S3", "API that provides access to stored files", "File Storage", "https://aws.amazon.com/de/documentation/s3/"),
    ("Cloudinary", "Image and video storage and manipulation", "File Storage", "http://cloudinary.com/documentation"),
    ("DigitalOcean Spaces", "Easy access to store and receive files", "File Storage", "https://www.digitalocean.com/products/spaces"),
    ("Filestack", "APIs for image and file manipulation", "File Storage", "https://filestack.com/docs/"),
    ("Microsoft Graph OneDrive", "Access stored files and photos", "File Storage", "https://graph.microsoft.io/en-us/docs/api-reference/v1.0/resources/onedrive"),
    ("PDF Blocks", "API for working with PDF documents", "File Storage", "https://www.pdfblocks.com/docs/api/getting-started"),
    ("SignNow API", "Embed branded eSignature workflows", "File Storage", "https://docs.signnow.com/docs/signnow/welcome"),
    ("Smash", "Upload large files on websites, mobile apps", "File Storage", "https://api.fromsmash.com/"),
    ("Vector Express", "API for converting, processing vector files", "File Storage", "https://github.com/smidyo/vectorexpress-api"),
    ("Vertopal", "Convert files to various formats", "File Storage", "https://www.vertopal.com/en/developer/api/introduction"),
    
    # Finance additions
    ("Alpha Vantage", "Y Combinator backed API for stock data", "Finance", "https://www.alphavantage.co/"),
    ("Atom Finance", "Market, earnings and news data", "Finance", "https://docs.atom.finance/"),
    ("IEX", "Free Stocks and Market Data", "Finance", "https://iextrading.com/developer/"),
    ("Twelve Data", "Stock market data (real-time & historical)", "Finance", "https://twelvedata.com/docs/"),
    ("Exchange Rates", "Foreign exchange rates and currency conversion", "Finance", "https://exchangeratesapi.io/"),
    ("IBANAPI", "Validate IBAN number & get bank account from it", "Finance", "https://ibanapi.com/get-api"),
    ("Portfolio Optimizer", "Portfolio analysis and optimization", "Finance", "https://portfoliooptimizer.io/"),
    
    # Fitness
    ("FitBit", "Access data from Fitbit activity trackers", "Fitness", "https://dev.fitbit.com/build/reference/"),
    ("HealthGraph", "RunKeeper's HealthGraph API", "Fitness", "https://runkeeper.com/developer/healthgraph/registration-authorization"),
    ("Open Food Facts", "Database of food products", "Fitness", "https://en.wiki.openfoodfacts.org/API"),
    ("Strava", "API for accessing athlete and activity data", "Fitness", "https://strava.github.io/api/"),
    ("VeganCheck", "Information about food based on EAN/UPC code", "Fitness", "https://jokenetwork.de/vegancheck-api"),
    ("Withings", "Access to data from Withings activity trackers", "Fitness", "http://oauth.withings.com/api"),
    
    # Google APIs
    ("Gmail API", "The Gmail REST API", "Google", "https://developers.google.com/gmail/api/?hl=en"),
    ("Google BigQuery API", "Data platform for create, manage, query data", "Google", "https://cloud.google.com/bigquery/docs/reference/rest/v2/"),
    ("Google Books API", "Search for books and manage library", "Google", "https://developers.google.com/books/"),
    ("Google Calendar API", "Manipulate events and calendar data", "Google", "https://developers.google.com/google-apps/calendar/?hl=en"),
    ("Google Classroom API", "Google Classroom API", "Google", "https://developers.google.com/classroom/?hl=en"),
    ("Google CustomSearch API", "Search over a website or collection", "Google", "https://developers.google.com/custom-search/json-api/v1/overview"),
    ("Google Drive API", "Interact with Google Drive", "Google", "https://developers.google.com/drive/v2/reference/"),
    ("Google Fitness API", "The Fit API", "Google", "https://developers.google.com/fit/?hl=en"),
    ("Google Fonts API", "Add fonts to any web page", "Google", "https://developers.google.com/fonts/?hl=en"),
    ("Google Genomics API", "Access to Genomics data", "Google", "https://cloud.google.com/genomics/reference/rest/"),
    ("Google Monitoring API", "Access Google Cloud monitoring data", "Google", "https://cloud.google.com/monitoring/api/v3/"),
    
    # Identity Verification
    ("BlockScore", "Real-time identity verification API", "Identity", "https://docs.blockscore.com/"),
    ("Cognito", "Powerful identity verification API", "Identity", "https://cognitohq.com/docs"),
    ("Whitepages Pro", "Global Identity Verification API", "Identity", "https://pro.whitepages.com/"),
    
    # Image Moderation
    ("WebPurify", "Live image moderation by humans", "Image Moderation", "https://www.webpurify.com/image-moderation/"),
    
    # IoT
    ("Ably", "API for cross-protocol real time communication", "IoT", "https://www.ably.com/documentation"),
    ("Particle", "API to manage Particle devices", "IoT", "https://docs.particle.io/reference/api/"),
    ("PubNub", "API to make real time applications", "IoT", "https://www.pubnub.com/docs"),
    ("Philips Hue", "Control Hue brand lights", "IoT", "https://developers.meethue.com/documentation/getting-started"),
    ("SmartThings", "API for Samsung SmartThings", "IoT", "http://developer.smartthings.com/"),
    ("Temboo SDK", "Code snippets to trigger complex processes", "IoT", "https://temboo.com/download"),
    ("ThingSpeak", "Internet of Things application and API", "IoT", "https://github.com/iobridge/ThingSpeak"),
    ("Xively", "Free libraries to connect hardware to cloud", "IoT", "https://developer.xively.com/reference"),
    ("Zetta", "Open source platform for creating IoT servers", "IoT", "https://github.com/zettajs/zetta/wiki"),
    
    # Legal
    ("GitHub Licenses API", "Get license information", "Legal", "https://developer.github.com/v3/licenses/"),
    ("ToSDR API", "Terms of Service; Didn't Read", "Legal", "https://tosdr.org/api.html"),
    
    # Login/Auth
    ("Auth0", "Authenticate and authorize apps and APIs", "Authentication", "https://auth0.com"),
    ("Facebook Login", "Secure, fast, convenient login", "Authentication", "https://developers.facebook.com/docs/facebook-login"),
    ("Firebase", "Authentication, analytics, cloud messaging", "Authentication", "https://firebase.google.com/docs/reference/"),
    ("GitHub Authentication", "GitHub's Authentication API", "Authentication", "https://developer.github.com/guides/basics-of-authentication/"),
    ("LinkedIn Sign-in", "Sign in with professional identity", "Authentication", "https://developer.linkedin.com/docs/signin-with-linkedin"),
    ("PayPal Login", "Sign in with PayPal credentials", "Authentication", "https://developer.paypal.com/docs/integration/direct/identity/log-in-with-paypal/"),
    ("Salesforce Auth", "OAuth protocol for secure access", "Authentication", "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_authentication.htm"),
    ("WorkOS", "Support Single Sign-On for Enterprise", "Authentication", "https://workos.com/docs"),
    
    # Machine Learning
    ("Amazon ML API", "Simplifies process of making predictions", "Machine Learning", "http://docs.aws.amazon.com/machine-learning/latest/APIReference/Welcome.html"),
    ("AYLIEN", "NLP, Information Retrieval and ML tools", "Machine Learning", "http://aylien.com/"),
    ("Big ML", "Machine learning API focusing on decision trees", "Machine Learning", "http://bigml.com/api/"),
    ("Cloud Machine Learning Engine", "Cloud-based ML platform", "Machine Learning", "https://cloud.google.com/ml-engine/docs/"),
    ("Microsoft Azure ML", "Helps publish ML models in minutes", "Machine Learning", "https://azure.microsoft.com/en-us/services/cognitive-services/"),
    ("ObjectCut", "Automatic background removal service by AI", "Machine Learning", "https://objectcut.com"),
    ("OVHcloud AI Endpoints", "Simplify GenAI & ML integration", "Machine Learning", "https://endpoints.ai.cloud.ovh.net/"),
    ("Unplugg", "Automated Forecasting API for timeseries", "Machine Learning", "http://unplu.gg/test_api.html"),
    
    # Maps
    ("Amazon Maps API", "Add interactive 3D maps to Fire apps", "Maps", "https://developer.amazon.com/maps"),
    ("CartoDB", "Generate maps based on CartoDB data", "Maps", "https://carto.com/developers/#apis"),
    ("Daum Maps API", "Multiple APIs for Korean maps", "Maps", "http://apis.map.daum.net/"),
    ("HERE Maps API", "Wide range of map APIs", "Maps", "https://developer.here.com/"),
    ("Leaflet.js", "Open-source JavaScript library for maps", "Maps", "http://leafletjs.com/"),
    ("Mapbox", "Access to MapBox's API", "Maps", "https://www.mapbox.com/developers/api/maps/"),
    ("Open Street Map", "API access to OSM", "Maps", "http://wiki.openstreetmap.org/wiki/API"),
    ("Scribble", "Cross browser, mobile ready map builder", "Maps", "https://www.scribblemaps.com/api/"),
    ("Yahoo Maps", "Embed rich and interactive maps", "Maps", "https://developer.yahoo.com/maps/"),
    ("Yandex", "API for Yandex.Maps", "Maps", "https://tech.yandex.com/maps/"),
    
    # Math
    ("Newton", "API for Arithmetic and Symbolic Math", "Math", "https://newton.now.sh/"),
    
    # Medical
    ("COVID-19 Data", "Get live and historical Coronavirus data", "Medical", "https://github.com/M-Media-Group/Covid-19-API"),
    ("Infermedica", "AI-based engine for patient triage", "Medical", "https://developer.infermedica.com/docs/introduction"),
    
    # Miscellaneous
    ("qKast Channel Content", "Access live content collections", "Content", "https://github.com/egfx/qKast"),
    ("SLF", "German city, country, river database", "Open Data", "https://github.com/slftool/slftool.github.io/blob/master/API.md"),
    ("Wikipedia", "Free multilingual Encyclopedia", "Open Data", "https://en.wikipedia.org/w/api.php"),
    
    # Movies
    ("TMDb", "The Movie Database API", "Movies", "https://developers.themoviedb.org/3"),
    ("OMDb", "Open Movie Database API", "Movies", "http://www.omdbapi.com/"),
    ("MovieGlu", "Cinema information", "Movies", "https://www.movieglu.com/"),
    
    # Music
    ("Spotify", "Spotify Web API", "Music", "https://developer.spotify.com/documentation/web-api/"),
    ("Deezer", "Music streaming API", "Music", "https://developers.deezer.com/api"),
    ("SoundCloud", "SoundCloud API", "Music", "https://developers.soundcloud.com/docs/api/guide"),
    ("Last.fm", "Music recommendations and scrobbling", "Music", "https://www.last.fm/api"),
    ("Musixmatch", "Lyrics API", "Music", "https://developer.musixmatch.com/"),
    ("Genius", "Song lyrics and annotations", "Music", "https://docs.genius.com/"),
    
    # Natural Language Processing
    ("Wit.ai", "Natural language processing", "NLP", "https://wit.ai/"),
    ("TextRazor", "Text analysis API", "NLP", "https://www.textrazor.com/docs"),
    ("Aylien Text Analysis", "NLP and text analysis", "NLP", "https://aylien.com/text-api/"),
    ("MonkeyLearn", "Machine learning text analysis", "NLP", "https://monkeylearn.com/api/"),
    
    # News
    ("News API", "Headlines and articles from news sources", "News", "https://newsapi.org/"),
    ("GNews", "Search for articles from various sources", "News", "https://gnews.io/"),
    ("Currents API", "Latest news", "News", "https://currentsapi.services/en"),
    ("MediaStack", "Real-time worldwide news data", "News", "https://mediastack.com/"),
    
    # Placeholder Images
    ("Lorem Picsum", "Random images for developers", "Images", "https://picsum.photos/"),
    ("Unsplash API", "Beautiful free images", "Images", "https://unsplash.com/developers"),
    ("Lorem Space", "Placeholder images from popular TV shows", "Images", "https://lorem.space/api"),
    ("DiceBear", "Avatar generator", "Images", "https://avatars.dicebear.com/"),
    
    # Product
    ("UPC Database", "Product barcode database", "Product", "https://www.upcdatabase.com/api.asp"),
    ("Barcode Lookup", "Barcode and product data", "Product", "https://www.barcodelookup.com/api"),
    
    # Quotes
    ("Quotable", "Random quotes API", "Quotes", "https://github.com/lukePeavey/quotable"),
    ("ZenQuotes", "Random inspirational quotes", "Quotes", "https://zenquotes.io/"),
    ("FavQs", "Quotes API", "Quotes", "https://favqs.com/api"),
    ("TheySaidSo", "Famous quotes API", "Quotes", "https://theysaidso.com/api/"),
    
    # Science
    ("NASA", "NASA open data", "Science", "https://api.nasa.gov/"),
    ("SpaceX", "SpaceX API", "Science", "https://github.com/r-spacex/SpaceX-API"),
    ("Open Notify", "ISS location and astronauts in space", "Science", "http://open-notify.org/"),
    ("Launch Library 2", "Space launches", "Science", "https://thespacedevs.com/llapi"),
    ("USGS Earthquake Hazards", "Real-time earthquake data", "Science", "https://earthquake.usgs.gov/fdsnws/event/1/"),
    ("arXiv", "Open access research papers", "Science", "https://arxiv.org/help/api/"),
    ("PubChem", "Open chemistry database", "Science", "https://pubchemdocs.ncbi.nlm.nih.gov/pug-rest"),
    
    # Screenshots
    ("APIFlash", "Chrome based screenshot API", "Screenshots", "https://apiflash.com/"),
    ("Browshot", "Easy screenshots of web pages", "Screenshots", "https://browshot.com/api/documentation"),
    ("ScreenshotAPI", "Create screenshots of web pages", "Screenshots", "https://screenshotapi.net/"),
    
    # Security
    ("Have I Been Pwned", "Data breaches", "Security", "https://haveibeenpwned.com/API/v3"),
    ("SecurityTrails", "Domain and DNS data", "Security", "https://securitytrails.com/corp/api"),
    ("Shodan", "Search engine for internet-connected devices", "Security", "https://developer.shodan.io/"),
    ("VirusTotal", "File and URL analysis", "Security", "https://developers.virustotal.com/reference"),
    ("URLScan", "Scan and analyze URLs", "Security", "https://urlscan.io/about-api/"),
    
    # Shopping
    ("eBay", "eBay API", "Shopping", "https://developer.ebay.com/"),
    ("Amazon Product Advertising", "Product data from Amazon", "Shopping", "https://webservices.amazon.com/paapi5/documentation/"),
    ("Etsy", "Etsy API", "Shopping", "https://www.etsy.com/developers/documentation"),
    ("WooCommerce", "WooCommerce REST API", "Shopping", "https://woocommerce.github.io/woocommerce-rest-api-docs/"),
    ("Shopify", "Shopify API", "Shopping", "https://shopify.dev/api"),
    
    # Social
    ("Twitter API", "Twitter API v2", "Social", "https://developer.twitter.com/en/docs/twitter-api"),
    ("Facebook Graph", "Facebook Graph API", "Social", "https://developers.facebook.com/docs/graph-api/"),
    ("Instagram Graph", "Instagram Graph API", "Social", "https://developers.facebook.com/docs/instagram-api/"),
    ("LinkedIn API", "LinkedIn API", "Social", "https://docs.microsoft.com/en-us/linkedin/"),
    ("Reddit API", "Reddit API", "Social", "https://www.reddit.com/dev/api/"),
    ("Tumblr API", "Tumblr API", "Social", "https://www.tumblr.com/docs/en/api/v2"),
    ("Pinterest API", "Pinterest API", "Social", "https://developers.pinterest.com/docs/getting-started/introduction/"),
    ("TikTok API", "TikTok for Developers", "Social", "https://developers.tiktok.com/"),
    ("Discord API", "Discord API", "Social", "https://discord.com/developers/docs/intro"),
    ("Slack API", "Slack API", "Social", "https://api.slack.com/"),
    ("Telegram Bot API", "Telegram Bot API", "Social", "https://core.telegram.org/bots/api"),
    ("WhatsApp Business", "WhatsApp Business API", "Social", "https://developers.facebook.com/docs/whatsapp/"),
    
    # Sports
    ("ESPN", "ESPN API", "Sports", "https://www.espn.com/apis/devcenter/docs/"),
    ("SportRadar", "Sports data", "Sports", "https://developer.sportradar.com/"),
    ("Football-Data", "Football data API", "Sports", "https://www.football-data.org/"),
    ("API-Football", "Football API", "Sports", "https://www.api-football.com/"),
    ("NBA API", "NBA statistics", "Sports", "https://github.com/swar/nba_api"),
    ("MLB Data", "MLB statistics", "Sports", "https://statsapi.mlb.com/docs"),
    ("TheSportsDB", "Sports database", "Sports", "https://www.thesportsdb.com/api.php"),
    
    # Test Data
    ("Faker", "Generate fake data", "Test Data", "https://fakerapi.it/en"),
    ("Random User", "Random user generator", "Test Data", "https://randomuser.me/"),
    ("JSONPlaceholder", "Fake online REST API", "Test Data", "https://jsonplaceholder.typicode.com/"),
    ("Mockaroo", "Realistic test data", "Test Data", "https://mockaroo.com/api/docs"),
    ("UUID Generator", "Generate UUIDs", "Test Data", "https://www.uuidtools.com/api"),
    
    # Transportation
    ("OpenSky", "Aircraft tracking", "Transportation", "https://opensky-network.org/apidoc/"),
    ("FlightAware", "Flight tracking", "Transportation", "https://flightaware.com/commercial/flightxml/"),
    ("Rome2Rio", "Travel routes", "Transportation", "https://www.rome2rio.com/documentation/"),
    ("Google Maps Directions", "Directions API", "Transportation", "https://developers.google.com/maps/documentation/directions/overview"),
    ("HERE Routing", "Routing API", "Transportation", "https://developer.here.com/documentation/routing-api/dev_guide/index.html"),
    ("OpenRouteService", "Open source routing", "Transportation", "https://openrouteservice.org/dev/#/api-docs"),
    
    # URL Shorteners
    ("Bitly", "URL shortener", "URL Shorteners", "https://dev.bitly.com/"),
    ("TinyURL", "URL shortener", "URL Shorteners", "https://tinyurl.com/app/dev"),
    ("Rebrandly", "Custom URL shortener", "URL Shorteners", "https://developers.rebrandly.com/"),
    ("Short.io", "URL shortener API", "URL Shorteners", "https://developers.short.io/"),
    
    # Video
    ("YouTube Data", "YouTube Data API", "Video", "https://developers.google.com/youtube/v3"),
    ("Vimeo", "Vimeo API", "Video", "https://developer.vimeo.com/"),
    ("Dailymotion", "Dailymotion API", "Video", "https://developer.dailymotion.com/api"),
    ("Twitch", "Twitch API", "Video", "https://dev.twitch.tv/docs/api/"),
    ("JW Player", "Video hosting", "Video", "https://developer.jwplayer.com/"),
    
    # Weather
    ("OpenWeatherMap", "Weather data", "Weather", "https://openweathermap.org/api"),
    ("Weather API", "Weather data", "Weather", "https://www.weatherapi.com/"),
    ("Visual Crossing", "Historical and forecast weather", "Weather", "https://www.visualcrossing.com/weather-api"),
    ("Tomorrow.io", "Weather API", "Weather", "https://www.tomorrow.io/weather-api/"),
    ("NOAA", "US weather data", "Weather", "https://www.weather.gov/documentation/services-web-api"),
]

for name, desc, category, link in new_apis:
    if add_api(name, desc, category, link):
        added += 1

# Update metadata
registry['count'] = len(registry['apis'])
registry['lastUpdated'] = '2026-02-22'

# Write back
with open(registry_path, 'w') as f:
    json.dump(registry, f, indent=2)

print(f"✅ APIClaw GitHub Expansion Complete")
print(f"   Added: {added} new APIs")
print(f"   Total: {registry['count']} APIs")
