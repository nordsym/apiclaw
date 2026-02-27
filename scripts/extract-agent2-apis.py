#!/usr/bin/env python3
"""
API Expansion Agent 2 - Extract APIs from Awesome Lists
Sources: TonnyL/Awesome_APIs, n0shake/Public-APIs, Kikobeats/awesome-api
"""

import json
import re
from datetime import datetime

# 22 Categories mapping
CATEGORY_MAP = {
    'anime': 'Entertainment', 'blogging': 'Communication', 'books': 'Books',
    'business': 'Business', 'calendar': 'Utilities', 'carsharing': 'Transportation',
    'cloud': 'Utilities', 'delivery': 'Transportation', 'design': 'Art & Design',
    'development': 'Utilities', 'email': 'Communication', 'fitness': 'Health',
    'wearables': 'Health', 'food': 'Food & Drink', 'forex': 'Finance',
    'currencies': 'Finance', 'games': 'Games', 'iot': 'Utilities',
    'machine learning': 'AI/ML', 'maps': 'Geolocation', 'messaging': 'Communication',
    'music': 'Music', 'news': 'News', 'notes': 'Utilities', 'payment': 'Finance',
    'photography': 'Art & Design', 'places': 'Geolocation', 'social': 'Social',
    'shopping': 'Business', 'takeout': 'Food & Drink', 'teamwork': 'Business',
    'text analysis': 'AI/ML', 'to-dos': 'Utilities', 'tourism': 'Transportation',
    'translation': 'AI/ML', 'video': 'Entertainment', 'voice': 'AI/ML',
    'vision': 'AI/ML', 'weather': 'Weather', 'advertising': 'Business',
    'analytics': 'Analytics', 'augmented reality': 'AI/ML', 'barcode': 'Utilities',
    'big data': 'Analytics', 'cryptocurrency': 'Cryptocurrency', 'crypto': 'Cryptocurrency',
    'captcha': 'Utilities', 'check-in': 'Geolocation', 'commerce': 'Business',
    'communication': 'Communication', 'content': 'Entertainment', 'currency': 'Finance',
    'dictionary': 'Books', 'entertainment': 'Entertainment', 'events': 'Entertainment',
    'face recognition': 'AI/ML', 'file storage': 'Utilities', 'finance': 'Finance',
    'google': 'Utilities', 'identity': 'Utilities', 'image': 'AI/ML',
    'legal': 'Government', 'login': 'Utilities', 'authentication': 'Utilities',
    'math': 'Utilities', 'medical': 'Health', 'miscellaneous': 'Utilities',
    'movies': 'Entertainment', 'music discovery': 'Music', 'music identification': 'Music',
    'music lyrics': 'Music', 'music stores': 'Music', 'natural language': 'AI/ML',
    'nlp': 'AI/ML', 'placeholder': 'Art & Design', 'product': 'Business',
    'quotes': 'Entertainment', 'science': 'Utilities', 'screenshots': 'Utilities',
    'social media': 'Social', 'source control': 'Utilities', 'sport': 'Sports',
    'test data': 'Utilities', 'transportation': 'Transportation', 'url shortener': 'Utilities',
    'videogames': 'Games', 'animals': 'Entertainment',
}

def normalize_category(cat):
    cat_lower = cat.lower().strip()
    for key, value in CATEGORY_MAP.items():
        if key in cat_lower:
            return value
    return 'Utilities'

def generate_id(name):
    clean = re.sub(r'[^a-zA-Z0-9\s]', '', name.lower())
    return '-'.join(clean.split())[:50]

# Full API data extracted from sources
APIS_DATA = [
    # ===== From TonnyL/Awesome_APIs =====
    # Anime
    {"name": "AniList", "url": "https://anilist.co/graphiql", "desc": "GraphQL API for 500k+ anime and manga entries", "cat": "Entertainment"},
    {"name": "Kitsu API", "url": "https://kitsu.docs.apiary.io/", "desc": "Modern anime discovery platform API", "cat": "Entertainment"},
    {"name": "hitokoto", "url": "https://hitokoto.cn/api", "desc": "Anime quotes and one-word service API", "cat": "Entertainment"},
    {"name": "AcgClub", "url": "https://github.com/Rabtman/AcgClub", "desc": "ACG-related aggregation services API", "cat": "Entertainment"},
    
    # Blogging
    {"name": "Blogger API", "url": "https://developers.google.com/blogger/", "desc": "Create and manage blog posts", "cat": "Communication"},
    {"name": "Medium API", "url": "https://github.com/Medium/medium-api-docs", "desc": "Access Medium.com data", "cat": "Communication"},
    {"name": "Weebly Cloud", "url": "https://cloud-developer.weebly.com/", "desc": "Website builder API", "cat": "Communication"},
    {"name": "Telegraph API", "url": "http://telegra.ph/api", "desc": "Telegram's publishing service API", "cat": "Communication"},
    
    # Books
    {"name": "Ice And Fire API", "url": "https://anapioficeandfire.com/", "desc": "Game of Thrones books data", "cat": "Books"},
    {"name": "Open Library API", "url": "https://openlibrary.org/developers/api", "desc": "Open library catalog API", "cat": "Books"},
    {"name": "NYPL Digital Collections", "url": "http://api.repo.nypl.org/", "desc": "NY Public Library collections API", "cat": "Books"},
    {"name": "Bookshare API", "url": "http://developer.bookshare.org/", "desc": "Books for print disabilities", "cat": "Books"},
    
    # Business
    {"name": "Airtable API", "url": "https://airtable.com/api", "desc": "Database and spreadsheet API", "cat": "Business"},
    {"name": "Buffer API", "url": "https://buffer.com/developers/api", "desc": "Social media management API", "cat": "Business"},
    {"name": "Concur Labs", "url": "https://developer.concur.com/api-reference/", "desc": "Travel and expense API", "cat": "Business"},
    {"name": "Envoy API", "url": "https://developers.envoy.com/", "desc": "Visitor management API", "cat": "Business"},
    {"name": "JotForm API", "url": "http://api.jotform.com/docs/", "desc": "Form builder API", "cat": "Business"},
    {"name": "MailChimp API", "url": "https://developer.mailchimp.com/", "desc": "Email marketing API", "cat": "Business"},
    {"name": "Pruvan API", "url": "https://pruvan.com/resources/pruvan-api/", "desc": "Field service management API", "cat": "Business"},
    {"name": "Quip API", "url": "https://quip.com/api/", "desc": "Collaborative documents API", "cat": "Business"},
    {"name": "Salesforce API", "url": "https://developer.salesforce.com/page/Salesforce_APIs", "desc": "CRM platform API", "cat": "Business"},
    {"name": "Square API", "url": "https://connect.squareup.com/", "desc": "Payment processing API", "cat": "Business"},
    {"name": "Wolfram Data Drop", "url": "https://www.wolfram.com/datadrop/", "desc": "Data storage API", "cat": "Business"},
    
    # Calendar
    {"name": "Google Calendar API", "url": "https://developers.google.com/google-apps/calendar/", "desc": "Calendar management API", "cat": "Utilities"},
    {"name": "Outlook Calendar API", "url": "https://docs.microsoft.com/en-us/graph/api/resources/calendar", "desc": "Microsoft calendar API", "cat": "Utilities"},
    
    # Carsharing/Transportation
    {"name": "Lyft API", "url": "https://www.lyft.com/developers", "desc": "Ride-hailing API", "cat": "Transportation"},
    {"name": "Shenzhou API", "url": "http://developer.10101111.com/", "desc": "Chinese carsharing API", "cat": "Transportation"},
    {"name": "Uber API", "url": "https://developer.uber.com/", "desc": "Ride-hailing and delivery API", "cat": "Transportation"},
    
    # Cloud Storage
    {"name": "Amazon Cloud Drive", "url": "https://developer.amazon.com/amazon-drive", "desc": "Cloud storage API", "cat": "Utilities"},
    {"name": "Box API", "url": "https://developer.box.com/", "desc": "Enterprise cloud storage API", "cat": "Utilities"},
    {"name": "Digital Ocean Spaces", "url": "https://developers.digitalocean.com/", "desc": "Object storage API", "cat": "Utilities"},
    {"name": "Document Cloud", "url": "http://www.documentcloud.org/help/api", "desc": "Document analysis API", "cat": "Utilities"},
    {"name": "Dropbox API", "url": "https://www.dropbox.com/developers", "desc": "File storage API", "cat": "Utilities"},
    {"name": "Google Drive API", "url": "https://developers.google.com/drive/", "desc": "Cloud storage API", "cat": "Utilities"},
    {"name": "OneDrive API", "url": "https://dev.onedrive.com/", "desc": "Microsoft cloud storage API", "cat": "Utilities"},
    {"name": "QNAP API", "url": "https://www.qnap.com/en/how-to/tutorial/article/qnap-api", "desc": "NAS device API", "cat": "Utilities"},
    {"name": "Verizon Cloud API", "url": "https://www.verizon.com/support/verizon-cloud/", "desc": "Cloud storage API", "cat": "Utilities"},
    
    # Delivery Tracking
    {"name": "AfterShip API", "url": "https://docs.aftership.com/api/", "desc": "Multi-carrier tracking API", "cat": "Transportation"},
    {"name": "Aramex API", "url": "https://www.aramex.com/developers/aramex-apis", "desc": "Shipping and logistics API", "cat": "Transportation"},
    {"name": "Canada Post API", "url": "https://www.canadapost-postescanada.ca/cpc/en/business/shipping/find-rates-shipping-options/developer-services.page", "desc": "Canada shipping API", "cat": "Transportation"},
    {"name": "DHL API", "url": "https://developer.dhl.com/", "desc": "Global shipping API", "cat": "Transportation"},
    {"name": "FedEx API", "url": "https://www.fedex.com/en-us/developer/web-services.html", "desc": "Shipping services API", "cat": "Transportation"},
    {"name": "kuaidi100 API", "url": "http://www.kuaidi100.com/openapi/", "desc": "Chinese courier tracking API", "cat": "Transportation"},
    {"name": "UPS API", "url": "https://www.ups.com/upsdeveloperkit", "desc": "Shipping services API", "cat": "Transportation"},
    
    # Design
    {"name": "Dribbble API", "url": "http://developer.dribbble.com/v2/", "desc": "Design community API", "cat": "Art & Design"},
    {"name": "Behance API", "url": "https://www.behance.net/dev/api/endpoints/", "desc": "Creative portfolio API", "cat": "Art & Design"},
    {"name": "deviantART API", "url": "https://www.deviantart.com/developers/", "desc": "Art community API", "cat": "Art & Design"},
    
    # Development
    {"name": "ARTIK Cloud API", "url": "https://developer.artik.cloud/documentation/", "desc": "IoT platform API", "cat": "Utilities"},
    {"name": "AT&T M2X", "url": "https://m2x.att.com/developer/documentation/", "desc": "IoT data storage API", "cat": "Utilities"},
    {"name": "Bitbucket API", "url": "https://developer.atlassian.com/cloud/bitbucket/", "desc": "Code repository API", "cat": "Utilities"},
    {"name": "bitly API", "url": "https://dev.bitly.com/", "desc": "URL shortening API", "cat": "Utilities"},
    {"name": "Buddy API", "url": "https://buddy.works/api/reference/getting-started/overview", "desc": "CI/CD API", "cat": "Utilities"},
    {"name": "Bugzilla API", "url": "https://wiki.mozilla.org/Bugzilla:REST_API", "desc": "Bug tracking API", "cat": "Utilities"},
    {"name": "CircleCI API", "url": "https://circleci.com/docs/api/v2/", "desc": "CI/CD API", "cat": "Utilities"},
    {"name": "Coding API", "url": "https://open.coding.net/", "desc": "Chinese dev platform API", "cat": "Utilities"},
    {"name": "Dataflow Kit API", "url": "https://github.com/slotix/dataflowkit", "desc": "Web scraping API", "cat": "Utilities"},
    {"name": "GitHub API", "url": "https://developer.github.com/v3/", "desc": "Code hosting API", "cat": "Utilities"},
    {"name": "Gitter API", "url": "https://developer.gitter.im/docs/welcome", "desc": "Chat for developers API", "cat": "Communication"},
    {"name": "GitLab API", "url": "https://docs.gitlab.com/ee/api/", "desc": "DevOps platform API", "cat": "Utilities"},
    {"name": "Google Play Developer API", "url": "https://developers.google.com/android-publisher/", "desc": "App publishing API", "cat": "Utilities"},
    {"name": "IPInfo.io", "url": "https://ipinfo.io/developers", "desc": "IP geolocation API", "cat": "Geolocation"},
    {"name": "MAC Address Lookup", "url": "https://macaddress.io/api-documentation", "desc": "MAC vendor lookup API", "cat": "Utilities"},
    {"name": "openHAB API", "url": "https://www.openhab.org/docs/configuration/restdocs.html", "desc": "Smart home API", "cat": "Utilities"},
    {"name": "Particle API", "url": "https://docs.particle.io/reference/api/", "desc": "IoT device API", "cat": "Utilities"},
    {"name": "ProxyCrawl API", "url": "https://proxycrawl.com", "desc": "Web scraping API", "cat": "Utilities"},
    {"name": "QR Server API", "url": "http://goqr.me/api/", "desc": "QR code generation API", "cat": "Utilities"},
    {"name": "Scraper API", "url": "https://www.scraperapi.com/documentation", "desc": "Web scraping API", "cat": "Utilities"},
    {"name": "StackExchange API", "url": "https://api.stackexchange.com/docs", "desc": "Q&A platform API", "cat": "Utilities"},
    {"name": "TravisCI API", "url": "https://docs.travis-ci.com/api/", "desc": "CI/CD API", "cat": "Utilities"},
    {"name": "W3C API", "url": "https://api.w3.org/doc", "desc": "W3C specifications API", "cat": "Utilities"},
    {"name": "ZenHub API", "url": "https://github.com/ZenHubIO/API", "desc": "Project management API", "cat": "Business"},
    
    # Email
    {"name": "Context.IO", "url": "http://context.io/", "desc": "Email integration API", "cat": "Communication"},
    {"name": "Gmail API", "url": "https://developers.google.com/gmail/api/", "desc": "Email API", "cat": "Communication"},
    {"name": "Inbox API", "url": "https://www.nylas.com/", "desc": "Email platform API", "cat": "Communication"},
    {"name": "Mandrill API", "url": "https://mailchimp.com/developer/transactional/api/", "desc": "Transactional email API", "cat": "Communication"},
    {"name": "Outlook Mail API", "url": "https://docs.microsoft.com/en-us/graph/api/resources/mail-api-overview", "desc": "Microsoft email API", "cat": "Communication"},
    
    # Fitness & Wearables
    {"name": "Adidas API", "url": "https://developers.adidas.com/", "desc": "Sports and fitness API", "cat": "Health"},
    {"name": "Fitbit API", "url": "https://dev.fitbit.com/", "desc": "Fitness tracking API", "cat": "Health"},
    {"name": "Jawbone UP", "url": "https://jawbone.com/up/developer", "desc": "Activity tracking API", "cat": "Health"},
    {"name": "Lifelog API", "url": "https://developer.sony.com/develop/services/lifelog-api/", "desc": "Sony wearables API", "cat": "Health"},
    {"name": "Misfit API", "url": "https://build.misfit.com/", "desc": "Fitness tracker API", "cat": "Health"},
    {"name": "Nike+ API", "url": "https://developer.nike.com/", "desc": "Running and fitness API", "cat": "Health"},
    {"name": "Recon API", "url": "http://www.reconinstruments.com/developers/", "desc": "Sports optics API", "cat": "Health"},
    {"name": "Strava API", "url": "https://developers.strava.com/", "desc": "Activity tracking API", "cat": "Health"},
    {"name": "Withings API", "url": "https://developer.withings.com/", "desc": "Health devices API", "cat": "Health"},
    
    # Food
    {"name": "Order Pizza API", "url": "https://order-pizza-api.herokuapp.com/api/ui", "desc": "Pizza ordering demo API", "cat": "Food & Drink"},
    {"name": "Zomato API", "url": "https://developers.zomato.com/api", "desc": "Restaurant information API", "cat": "Food & Drink"},
    
    # Forex & Currencies
    {"name": "1Forge", "url": "https://1forge.com/", "desc": "Real-time forex quotes API", "cat": "Finance"},
    {"name": "CurrencyScoop", "url": "https://currencyscoop.com/", "desc": "Currency rates API", "cat": "Finance"},
    
    # Games
    {"name": "Battle.net API", "url": "https://develop.battle.net/", "desc": "Blizzard games API", "cat": "Games"},
    {"name": "Clash of Clans API", "url": "https://developer.clashofclans.com/", "desc": "Mobile game API", "cat": "Games"},
    {"name": "EVE Online API", "url": "https://developers.eveonline.com/", "desc": "MMO game API", "cat": "Games"},
    {"name": "Facebook Games API", "url": "https://developers.facebook.com/docs/games", "desc": "Social gaming API", "cat": "Games"},
    {"name": "Google Play Games API", "url": "https://developers.google.com/games/", "desc": "Mobile gaming API", "cat": "Games"},
    {"name": "Riot Games API", "url": "https://developer.riotgames.com/", "desc": "League of Legends API", "cat": "Games"},
    {"name": "Steam Web API", "url": "https://steamcommunity.com/dev", "desc": "PC gaming platform API", "cat": "Games"},
    {"name": "Giant Bomb API", "url": "http://www.giantbomb.com/api/", "desc": "Video game database API", "cat": "Games"},
    {"name": "Guild Wars 2 API", "url": "https://wiki.guildwars2.com/wiki/API:Main", "desc": "MMO game API", "cat": "Games"},
    
    # IoT
    {"name": "Automatic API", "url": "https://developer.automatic.com/", "desc": "Connected car API", "cat": "Utilities"},
    {"name": "Amazon Alexa API", "url": "https://developer.amazon.com/en-US/alexa", "desc": "Voice assistant API", "cat": "AI/ML"},
    {"name": "Google Assistant API", "url": "https://developers.google.com/assistant", "desc": "Voice assistant API", "cat": "AI/ML"},
    {"name": "Home8 API", "url": "https://developer.home8systems.com/", "desc": "Smart alarm API", "cat": "Utilities"},
    {"name": "Homey API", "url": "https://developer.athom.com/", "desc": "Smart home hub API", "cat": "Utilities"},
    {"name": "HP Print API", "url": "https://developers.hp.com/", "desc": "Print services API", "cat": "Utilities"},
    {"name": "LIFX API", "url": "https://api.developer.lifx.com/", "desc": "Smart lighting API", "cat": "Utilities"},
    {"name": "LightwaveRF API", "url": "https://api.lightwaverf.com/", "desc": "Smart home API", "cat": "Utilities"},
    {"name": "microBees API", "url": "http://developers.microbees.com/", "desc": "IoT platform API", "cat": "Utilities"},
    {"name": "Mojio API", "url": "https://www.moj.io/developer/", "desc": "Connected car API", "cat": "Utilities"},
    {"name": "myStrom API", "url": "https://api.mystrom.ch/", "desc": "Smart home API", "cat": "Utilities"},
    {"name": "Neurio API", "url": "https://my.neur.io/", "desc": "Energy monitoring API", "cat": "Utilities"},
    {"name": "Philips Hue API", "url": "https://developers.meethue.com/", "desc": "Smart lighting API", "cat": "Utilities"},
    {"name": "Smappee API", "url": "https://smappee.atlassian.net/wiki/", "desc": "Energy monitoring API", "cat": "Utilities"},
    {"name": "SmartThings API", "url": "https://developer.smartthings.com/", "desc": "Smart home platform API", "cat": "Utilities"},
    {"name": "Stack Lighting API", "url": "http://developers.stacklighting.com/", "desc": "Smart lighting API", "cat": "Utilities"},
    {"name": "Vinli API", "url": "https://dev.vin.li/", "desc": "Connected car API", "cat": "Utilities"},
    {"name": "Yeelight API", "url": "https://www.yeelight.com/en_US/developer", "desc": "Smart lighting API", "cat": "Utilities"},
    
    # Machine Learning
    {"name": "Amazon ML API", "url": "https://aws.amazon.com/machine-learning/", "desc": "AWS machine learning API", "cat": "AI/ML"},
    {"name": "BigML API", "url": "https://bigml.com/api", "desc": "ML platform API", "cat": "AI/ML"},
    {"name": "Diffbot API", "url": "https://www.diffbot.com/dev/docs/", "desc": "AI data extraction API", "cat": "AI/ML"},
    {"name": "Google Cloud Prediction", "url": "https://cloud.google.com/ai-platform/", "desc": "Google ML API", "cat": "AI/ML"},
    {"name": "IBM Watson", "url": "https://developer.ibm.com/watson/", "desc": "IBM AI services API", "cat": "AI/ML"},
    {"name": "Azure ML API", "url": "https://azure.microsoft.com/en-us/services/machine-learning/", "desc": "Microsoft ML API", "cat": "AI/ML"},
    
    # Maps
    {"name": "Amap API", "url": "http://lbs.amap.com/", "desc": "Chinese maps API", "cat": "Geolocation"},
    {"name": "Baidu Map API", "url": "http://lbsyun.baidu.com/", "desc": "Chinese maps API", "cat": "Geolocation"},
    {"name": "Bing Maps API", "url": "https://www.microsoft.com/en-us/maps/choose-your-bing-maps-API.aspx", "desc": "Microsoft maps API", "cat": "Geolocation"},
    {"name": "Google Maps API", "url": "https://developers.google.com/maps/", "desc": "Google maps API", "cat": "Geolocation"},
    {"name": "HERE Maps API", "url": "https://developer.here.com/", "desc": "Location services API", "cat": "Geolocation"},
    {"name": "Tencent Map API", "url": "http://lbs.qq.com/", "desc": "Chinese maps API", "cat": "Geolocation"},
    
    # Messaging
    {"name": "Cisco Spark API", "url": "https://developer.webex.com/", "desc": "Team collaboration API", "cat": "Communication"},
    {"name": "Dingtalk API", "url": "https://open.dingtalk.com/", "desc": "Chinese messaging API", "cat": "Communication"},
    {"name": "dondeEsta API", "url": "http://docs.dondeesta.apiary.io/", "desc": "Location sharing API", "cat": "Communication"},
    {"name": "Fleep API", "url": "https://fleep.io/fleepapi/", "desc": "Team messaging API", "cat": "Communication"},
    {"name": "GroupMe API", "url": "https://dev.groupme.com/docs/v3", "desc": "Group messaging API", "cat": "Communication"},
    {"name": "indoona API", "url": "https://developer.indoona.com/", "desc": "Messaging platform API", "cat": "Communication"},
    {"name": "LINE API", "url": "https://developers.line.biz/", "desc": "Messaging platform API", "cat": "Communication"},
    {"name": "MessageBird API", "url": "https://developers.messagebird.com/", "desc": "SMS and chat API", "cat": "Communication"},
    {"name": "Slack API", "url": "https://api.slack.com/", "desc": "Team communication API", "cat": "Communication"},
    {"name": "Telegram API", "url": "https://core.telegram.org/api", "desc": "Messaging platform API", "cat": "Communication"},
    {"name": "Yo API", "url": "http://docs.justyo.co/", "desc": "Simple notification API", "cat": "Communication"},
    
    # Music
    {"name": "Deezer API", "url": "http://developers.deezer.com/api", "desc": "Music streaming API", "cat": "Music"},
    {"name": "KaolaFM API", "url": "https://github.com/kaolafm/api", "desc": "Chinese podcast API", "cat": "Music"},
    {"name": "Last.fm API", "url": "http://www.last.fm/api", "desc": "Music scrobbling API", "cat": "Music"},
    {"name": "MusicGraph API", "url": "https://developer.musicgraph.com/", "desc": "Music knowledge API", "cat": "Music"},
    {"name": "Musixmatch API", "url": "https://developer.musixmatch.com/", "desc": "Lyrics API", "cat": "Music"},
    {"name": "One Music API", "url": "http://www.onemusicapi.com/", "desc": "Music metadata API", "cat": "Music"},
    {"name": "QingtingFM API", "url": "http://open.qingting.fm/", "desc": "Chinese audio API", "cat": "Music"},
    {"name": "SearchLy API", "url": "https://github.com/AlbertSuarez/searchly", "desc": "Song similarity API", "cat": "Music"},
    {"name": "SoundCloud API", "url": "https://developers.soundcloud.com/", "desc": "Audio platform API", "cat": "Music"},
    {"name": "Spotify API", "url": "https://developer.spotify.com/documentation/web-api/", "desc": "Music streaming API", "cat": "Music"},
    
    # News & Information
    {"name": "aztro API", "url": "https://aztro.sameerkumar.website", "desc": "Horoscope API", "cat": "Entertainment"},
    {"name": "BreweryDB API", "url": "http://www.brewerydb.com/developers", "desc": "Beer database API", "cat": "Food & Drink"},
    {"name": "Diigo API", "url": "https://www.diigo.com/api_dev", "desc": "Bookmarking API", "cat": "Utilities"},
    {"name": "Feedly API", "url": "https://developer.feedly.com/", "desc": "RSS reader API", "cat": "News"},
    {"name": "Genius API", "url": "https://docs.genius.com/", "desc": "Song lyrics and annotations", "cat": "Music"},
    {"name": "Goodreads API", "url": "https://www.goodreads.com/api", "desc": "Book database API", "cat": "Books"},
    {"name": "HackerNews API", "url": "https://github.com/HackerNews/API", "desc": "Tech news API", "cat": "News"},
    {"name": "Inoreader API", "url": "https://www.inoreader.com/developers/", "desc": "RSS reader API", "cat": "News"},
    {"name": "Instapaper API", "url": "https://www.instapaper.com/api", "desc": "Read-later API", "cat": "Utilities"},
    {"name": "Narro API", "url": "https://docs.narro.co/", "desc": "Article to audio API", "cat": "News"},
    {"name": "Newsblur API", "url": "https://newsblur.com/api", "desc": "RSS reader API", "cat": "News"},
    {"name": "NPR API", "url": "https://dev.npr.org/api/", "desc": "Public radio API", "cat": "News"},
    {"name": "Pinboard API", "url": "https://pinboard.in/api", "desc": "Bookmarking API", "cat": "Utilities"},
    {"name": "Pocket API", "url": "https://getpocket.com/developer/", "desc": "Read-later API", "cat": "Utilities"},
    {"name": "Product Hunt API", "url": "https://api.producthunt.com/v2/docs", "desc": "Product discovery API", "cat": "Business"},
    {"name": "NY Times API", "url": "https://developer.nytimes.com/", "desc": "News API", "cat": "News"},
    {"name": "USA TODAY API", "url": "https://developer.usatoday.com/", "desc": "News API", "cat": "News"},
    
    # Notes
    {"name": "Evernote API", "url": "https://dev.evernote.com/doc/", "desc": "Note-taking API", "cat": "Utilities"},
    {"name": "OneNote API", "url": "https://docs.microsoft.com/en-us/graph/api/resources/onenote-api-overview", "desc": "Microsoft notes API", "cat": "Utilities"},
    {"name": "Youdao Note API", "url": "http://note.youdao.com/open/", "desc": "Chinese notes API", "cat": "Utilities"},
    
    # Payment
    {"name": "PayPal API", "url": "https://developer.paypal.com/docs/api/", "desc": "Payment processing API", "cat": "Finance"},
    {"name": "Paymill API", "url": "https://developers.paymill.com/", "desc": "Payment API", "cat": "Finance"},
    {"name": "Paytm API", "url": "https://developer.paytm.com/", "desc": "Indian payments API", "cat": "Finance"},
    {"name": "WePay API", "url": "https://developer.wepay.com/", "desc": "Payment platform API", "cat": "Finance"},
    {"name": "PhonePe API", "url": "https://developer.phonepe.com/", "desc": "Indian payments API", "cat": "Finance"},
    
    # Photography
    {"name": "500px API", "url": "https://github.com/500px/api-documentation", "desc": "Photography community API", "cat": "Art & Design"},
    {"name": "Giphy API", "url": "https://developers.giphy.com/docs/", "desc": "GIF platform API", "cat": "Art & Design"},
    {"name": "Imgur API", "url": "https://api.imgur.com/", "desc": "Image hosting API", "cat": "Art & Design"},
    {"name": "Pixabay API", "url": "https://pixabay.com/api/docs/", "desc": "Free images API", "cat": "Art & Design"},
    {"name": "Unsplash API", "url": "https://unsplash.com/documentation", "desc": "Stock photos API", "cat": "Art & Design"},
    {"name": "Unsplash Source", "url": "https://source.unsplash.com/", "desc": "Random photos API", "cat": "Art & Design"},
    
    # Places
    {"name": "Yelp API", "url": "https://www.yelp.com/developers", "desc": "Business reviews API", "cat": "Geolocation"},
    {"name": "Foursquare API", "url": "https://developer.foursquare.com/", "desc": "Location discovery API", "cat": "Geolocation"},
    
    # Social
    {"name": "Disqus API", "url": "https://disqus.com/api/docs/", "desc": "Comments platform API", "cat": "Social"},
    {"name": "Facebook API", "url": "https://developers.facebook.com/docs/", "desc": "Social network API", "cat": "Social"},
    {"name": "Flickr API", "url": "https://www.flickr.com/services/api/", "desc": "Photo sharing API", "cat": "Social"},
    {"name": "Foursquare Places API", "url": "https://developer.foursquare.com/", "desc": "Check-in API", "cat": "Social"},
    {"name": "Instagram API", "url": "https://developers.facebook.com/docs/instagram-api/", "desc": "Photo sharing API", "cat": "Social"},
    {"name": "LinkedIn API", "url": "https://developer.linkedin.com/", "desc": "Professional network API", "cat": "Social"},
    {"name": "Pinterest API", "url": "https://developers.pinterest.com/", "desc": "Visual discovery API", "cat": "Social"},
    {"name": "Reddit API", "url": "https://www.reddit.com/dev/api/", "desc": "Social news API", "cat": "Social"},
    {"name": "Tumblr API", "url": "https://www.tumblr.com/docs/en/api/v2", "desc": "Blogging platform API", "cat": "Social"},
    {"name": "Twitter API", "url": "https://developer.twitter.com/", "desc": "Social media API", "cat": "Social"},
    {"name": "Weibo API", "url": "https://open.weibo.com/wiki/API", "desc": "Chinese social media API", "cat": "Social"},
    
    # Shopping
    {"name": "Amazon Product Advertising", "url": "https://affiliate-program.amazon.com/", "desc": "E-commerce API", "cat": "Business"},
    {"name": "Best Buy API", "url": "https://developer.bestbuy.com/", "desc": "Retail API", "cat": "Business"},
    {"name": "Dangdang API", "url": "http://open.dangdang.com/", "desc": "Chinese e-commerce API", "cat": "Business"},
    {"name": "eBay API", "url": "https://developer.ebay.com/", "desc": "Marketplace API", "cat": "Business"},
    {"name": "Home Depot API", "url": "https://developer.homedepot.com/", "desc": "Home improvement API", "cat": "Business"},
    {"name": "JD API", "url": "https://jos.jd.com/", "desc": "Chinese e-commerce API", "cat": "Business"},
    {"name": "Semantics3 API", "url": "http://docs.semantics3.com/", "desc": "Product data API", "cat": "Business"},
    {"name": "Slice API", "url": "https://developer.slice.com/", "desc": "E-commerce tracking API", "cat": "Business"},
    {"name": "Taobao API", "url": "https://open.taobao.com/", "desc": "Chinese e-commerce API", "cat": "Business"},
    
    # Takeout/Food Delivery
    {"name": "Baidu Waimai API", "url": "http://dev.waimai.baidu.com/", "desc": "Chinese food delivery API", "cat": "Food & Drink"},
    {"name": "Dianping API", "url": "https://open.dianping.com/", "desc": "Chinese restaurant API", "cat": "Food & Drink"},
    {"name": "Eleme API", "url": "http://openapi.eleme.io/", "desc": "Chinese food delivery API", "cat": "Food & Drink"},
    {"name": "Meituan API", "url": "https://developer.waimai.meituan.com/", "desc": "Chinese food delivery API", "cat": "Food & Drink"},
    
    # Teamwork
    {"name": "Asana API", "url": "https://developers.asana.com/", "desc": "Project management API", "cat": "Business"},
    {"name": "join.me API", "url": "https://developer.join.me/", "desc": "Online meeting API", "cat": "Business"},
    {"name": "Teambition API", "url": "https://www.teambition.com/developer/", "desc": "Project management API", "cat": "Business"},
    {"name": "TeamSnap API", "url": "https://developer.teamsnap.com/", "desc": "Team management API", "cat": "Business"},
    {"name": "Trello API", "url": "https://developers.trello.com/", "desc": "Project management API", "cat": "Business"},
    {"name": "Worktile API", "url": "https://dev.worktile.com/", "desc": "Project management API", "cat": "Business"},
    
    # Text Analysis
    {"name": "BosonNLP API", "url": "http://docs.bosonnlp.com/", "desc": "Chinese NLP API", "cat": "AI/ML"},
    {"name": "Detect Language API", "url": "https://detectlanguage.com/", "desc": "Language detection API", "cat": "AI/ML"},
    {"name": "Tencent NLP API", "url": "https://cloud.tencent.com/product/nlp", "desc": "Chinese NLP API", "cat": "AI/ML"},
    {"name": "Azure Text Analytics", "url": "https://azure.microsoft.com/en-us/services/cognitive-services/text-analytics/", "desc": "Text analysis API", "cat": "AI/ML"},
    {"name": "Watson NLU API", "url": "https://cloud.ibm.com/apidocs/natural-language-understanding", "desc": "NLP API", "cat": "AI/ML"},
    
    # To-dos
    {"name": "Beeminder API", "url": "https://www.beeminder.com/api", "desc": "Goal tracking API", "cat": "Utilities"},
    {"name": "FollowUp.cc API", "url": "http://docs.followup.cc/", "desc": "Email follow-up API", "cat": "Communication"},
    {"name": "Todoist API", "url": "https://developer.todoist.com/", "desc": "Task management API", "cat": "Utilities"},
    {"name": "Toodledo API", "url": "https://api.toodledo.com/", "desc": "Task management API", "cat": "Utilities"},
    
    # Tourism
    {"name": "ctrip API", "url": "http://u.ctrip.com/", "desc": "Chinese travel API", "cat": "Transportation"},
    {"name": "elong API", "url": "http://open.elong.com/", "desc": "Chinese hotel API", "cat": "Transportation"},
    {"name": "qunar API", "url": "http://open.qunar.com/", "desc": "Chinese travel API", "cat": "Transportation"},
    {"name": "tuniu API", "url": "http://open.tuniu.cn/", "desc": "Chinese travel API", "cat": "Transportation"},
    
    # Translation
    {"name": "Baidu Translate API", "url": "https://api.fanyi.baidu.com/", "desc": "Translation API", "cat": "AI/ML"},
    {"name": "Google Translate API", "url": "https://cloud.google.com/translate/", "desc": "Translation API", "cat": "AI/ML"},
    {"name": "iciba API", "url": "http://open.iciba.com/", "desc": "Chinese translation API", "cat": "AI/ML"},
    {"name": "Microsoft Translator", "url": "https://www.microsoft.com/en-us/translator/", "desc": "Translation API", "cat": "AI/ML"},
    {"name": "Oxford Dictionaries API", "url": "https://developer.oxforddictionaries.com/", "desc": "Dictionary API", "cat": "Books"},
    {"name": "Shanbay API", "url": "https://www.shanbay.com/help/developer/", "desc": "Vocabulary API", "cat": "Books"},
    {"name": "Yandex Translate API", "url": "https://tech.yandex.com/translate/", "desc": "Translation API", "cat": "AI/ML"},
    {"name": "yeekit API", "url": "http://api.yeekit.com/", "desc": "Translation API", "cat": "AI/ML"},
    {"name": "Youdao API", "url": "https://ai.youdao.com/", "desc": "Translation API", "cat": "AI/ML"},
    
    # Video
    {"name": "Dailymotion API", "url": "https://developer.dailymotion.com/api", "desc": "Video platform API", "cat": "Entertainment"},
    {"name": "Narrative API", "url": "http://open.getnarrative.com/", "desc": "Video clips API", "cat": "Entertainment"},
    {"name": "iqiyi API", "url": "http://open.iqiyi.com/", "desc": "Chinese video API", "cat": "Entertainment"},
    {"name": "LeTV API", "url": "http://www.lecloud.com/", "desc": "Chinese video API", "cat": "Entertainment"},
    {"name": "Rotten Tomatoes API", "url": "https://developer.fandango.com/rotten_tomatoes", "desc": "Movie reviews API", "cat": "Entertainment"},
    {"name": "Sohu TV API", "url": "http://lm.tv.sohu.com/", "desc": "Chinese video API", "cat": "Entertainment"},
    {"name": "TMDb API", "url": "https://developers.themoviedb.org/", "desc": "Movie database API", "cat": "Entertainment"},
    {"name": "TVmaze API", "url": "https://www.tvmaze.com/api", "desc": "TV show database API", "cat": "Entertainment"},
    {"name": "Vimeo API", "url": "https://developer.vimeo.com/", "desc": "Video platform API", "cat": "Entertainment"},
    {"name": "YouTube API", "url": "https://developers.google.com/youtube/", "desc": "Video platform API", "cat": "Entertainment"},
    {"name": "Youku API", "url": "https://doc.open.youku.com/", "desc": "Chinese video API", "cat": "Entertainment"},
    
    # Voice Analysis
    {"name": "Baidu Yuyin API", "url": "http://ai.baidu.com/tech/speech", "desc": "Chinese speech API", "cat": "AI/ML"},
    {"name": "Google Cloud Speech", "url": "https://cloud.google.com/speech-to-text/", "desc": "Speech recognition API", "cat": "AI/ML"},
    
    # Vision Analysis
    {"name": "CamScanner API", "url": "https://dev.camscanner.com/", "desc": "Document scanning API", "cat": "AI/ML"},
    {"name": "Clarifai API", "url": "https://clarifai.com/developer/", "desc": "Image recognition API", "cat": "AI/ML"},
    {"name": "Google Cloud Vision", "url": "https://cloud.google.com/vision/", "desc": "Image analysis API", "cat": "AI/ML"},
    {"name": "Azure Computer Vision", "url": "https://azure.microsoft.com/en-us/services/cognitive-services/computer-vision/", "desc": "Image analysis API", "cat": "AI/ML"},
    {"name": "Face++ API", "url": "https://www.faceplusplus.com/", "desc": "Face recognition API", "cat": "AI/ML"},
    {"name": "Watson Visual Recognition", "url": "https://cloud.ibm.com/apidocs/visual-recognition/v3", "desc": "Image recognition API", "cat": "AI/ML"},
    {"name": "wozhitu API", "url": "http://api1.wozhitu.com/", "desc": "Chinese vision API", "cat": "AI/ML"},
    
    # Weather
    {"name": "AccuWeather API", "url": "https://developer.accuweather.com/", "desc": "Weather data API", "cat": "Weather"},
    {"name": "Aeris Weather API", "url": "https://www.aerisweather.com/develop/", "desc": "Weather data API", "cat": "Weather"},
    {"name": "Caiyun Weather API", "url": "https://caiyunapp.com/", "desc": "Chinese weather API", "cat": "Weather"},
    {"name": "heweather API", "url": "https://dev.qweather.com/", "desc": "Chinese weather API", "cat": "Weather"},
    {"name": "OpenWeatherMap API", "url": "https://openweathermap.org/api", "desc": "Weather data API", "cat": "Weather"},
    {"name": "Weather Underground API", "url": "https://www.wunderground.com/weather/api/", "desc": "Weather data API", "cat": "Weather"},
    {"name": "Weather Unlocked API", "url": "https://developer.weatherunlocked.com/", "desc": "Weather data API", "cat": "Weather"},
    {"name": "Seniverse API", "url": "https://www.seniverse.com/", "desc": "Chinese weather API", "cat": "Weather"},
    {"name": "Yandex Weather API", "url": "https://tech.yandex.com/weather/", "desc": "Weather data API", "cat": "Weather"},
    {"name": "Yahoo Weather API", "url": "https://developer.yahoo.com/weather/", "desc": "Weather data API", "cat": "Weather"},
    
    # ===== From n0shake/Public-APIs additional =====
    {"name": "Clicky Analytics", "url": "https://clicky.com/help/api", "desc": "Website analytics API", "cat": "Analytics"},
    {"name": "Matomo Analytics", "url": "https://matomo.org/docs/analytics-api/", "desc": "Web analytics API", "cat": "Analytics"},
    {"name": "MixPanel API", "url": "https://developer.mixpanel.com/", "desc": "Product analytics API", "cat": "Analytics"},
    {"name": "Woopra API", "url": "https://www.woopra.com/docs/api/", "desc": "Real-time analytics API", "cat": "Analytics"},
    {"name": "Vuforia API", "url": "https://library.vuforia.com/", "desc": "AR SDK", "cat": "AI/ML"},
    {"name": "Wikitude API", "url": "https://www.wikitude.com/", "desc": "AR SDK", "cat": "AI/ML"},
    {"name": "EAN-Search API", "url": "https://www.ean-search.org/ean-database-api.html", "desc": "Barcode lookup API", "cat": "Utilities"},
    {"name": "Bitcoin API", "url": "https://developer.bitcoin.org/", "desc": "Bitcoin developer API", "cat": "Cryptocurrency"},
    {"name": "Coinbase API", "url": "https://developers.coinbase.com/", "desc": "Crypto exchange API", "cat": "Cryptocurrency"},
    {"name": "CoinGecko API", "url": "https://coingecko.com/en/api", "desc": "Crypto data API", "cat": "Cryptocurrency"},
    {"name": "CoinMarketCap API", "url": "https://coinmarketcap.com/api/", "desc": "Crypto prices API", "cat": "Cryptocurrency"},
    {"name": "BlockCypher API", "url": "https://www.blockcypher.com/", "desc": "Blockchain API", "cat": "Cryptocurrency"},
    {"name": "Coinlore API", "url": "https://www.coinlore.com/cryptocurrency-data-api", "desc": "Crypto data API", "cat": "Cryptocurrency"},
    {"name": "CryptoCompare API", "url": "https://www.cryptocompare.com/api/", "desc": "Crypto comparison API", "cat": "Cryptocurrency"},
    {"name": "Poloniex API", "url": "https://docs.poloniex.com/", "desc": "Crypto exchange API", "cat": "Cryptocurrency"},
    {"name": "ShapeShift API", "url": "https://shapeshift.com/", "desc": "Crypto exchange API", "cat": "Cryptocurrency"},
    {"name": "CalendarIndex API", "url": "https://www.calendarindex.com", "desc": "Holiday data API", "cat": "Utilities"},
    {"name": "Holiday API", "url": "https://holidayapi.pl/", "desc": "Public holidays API", "cat": "Utilities"},
    {"name": "Anti-Captcha API", "url": "https://anti-captcha.com/apidoc", "desc": "Captcha solving API", "cat": "Utilities"},
    {"name": "Google reCAPTCHA", "url": "https://developers.google.com/recaptcha/", "desc": "Captcha API", "cat": "Utilities"},
    {"name": "Commerce Layer API", "url": "https://docs.commercelayer.io/api/", "desc": "Headless commerce API", "cat": "Business"},
    {"name": "Moltin API", "url": "https://www.moltin.com/developers", "desc": "E-commerce API", "cat": "Business"},
    {"name": "Braintree API", "url": "https://developers.braintreepayments.com/", "desc": "Payments API", "cat": "Finance"},
    {"name": "Africa's Talking API", "url": "https://africastalking.com/", "desc": "African telecom API", "cat": "Communication"},
    {"name": "MailGun API", "url": "https://documentation.mailgun.com/en/latest/", "desc": "Email API", "cat": "Communication"},
    {"name": "Nexmo API", "url": "https://developer.vonage.com/", "desc": "Communications API", "cat": "Communication"},
    {"name": "Telnyx API", "url": "https://developers.telnyx.com/", "desc": "Communications API", "cat": "Communication"},
    {"name": "SMS Works API", "url": "https://thesmsworks.co.uk/sms-api", "desc": "SMS API", "cat": "Communication"},
    {"name": "Twilio API", "url": "https://www.twilio.com/docs", "desc": "Communications API", "cat": "Communication"},
    {"name": "Wikipedia API", "url": "https://en.wikipedia.org/w/api.php", "desc": "Encyclopedia API", "cat": "Entertainment"},
    {"name": "Today in History API", "url": "https://history.muffinlabs.com/", "desc": "Historical events API", "cat": "Entertainment"},
    {"name": "Jokes API", "url": "https://jokes.one/api/joke/", "desc": "Jokes API", "cat": "Entertainment"},
    {"name": "CurrencyLayer API", "url": "https://currencylayer.com/documentation", "desc": "Currency rates API", "cat": "Finance"},
    {"name": "Fixer.io API", "url": "https://fixer.io/", "desc": "Forex rates API", "cat": "Finance"},
    {"name": "ExchangeRatesAPI", "url": "https://exchangeratesapi.io/", "desc": "Currency API", "cat": "Finance"},
    {"name": "OpenRates API", "url": "http://www.openrates.io/", "desc": "Exchange rates API", "cat": "Finance"},
    {"name": "Pexels API", "url": "https://www.pexels.com/api/", "desc": "Stock photos API", "cat": "Art & Design"},
    {"name": "Free Dictionary API", "url": "https://dictionaryapi.dev/", "desc": "Dictionary API", "cat": "Books"},
    {"name": "Wordnik API", "url": "http://developer.wordnik.com/", "desc": "Dictionary API", "cat": "Books"},
    {"name": "Words API", "url": "https://www.wordsapi.com/", "desc": "Dictionary API", "cat": "Books"},
    {"name": "Marvel API", "url": "https://developer.marvel.com/", "desc": "Marvel comics API", "cat": "Entertainment"},
    {"name": "Pokéapi", "url": "https://pokeapi.co/", "desc": "Pokémon data API", "cat": "Entertainment"},
    {"name": "Rick and Morty API", "url": "https://rickandmortyapi.com/", "desc": "Rick and Morty data API", "cat": "Entertainment"},
    {"name": "Star Wars API", "url": "https://swapi.dev/", "desc": "Star Wars data API", "cat": "Entertainment"},
    {"name": "Studio Ghibli API", "url": "https://ghibliapi.herokuapp.com/", "desc": "Ghibli films API", "cat": "Entertainment"},
    {"name": "Breaking Bad API", "url": "https://breakingbadapi.com/", "desc": "Breaking Bad data API", "cat": "Entertainment"},
    {"name": "Kairos API", "url": "https://www.kairos.com/", "desc": "Face recognition API", "cat": "AI/ML"},
    {"name": "Skybiometry API", "url": "https://www.skybiometry.com/", "desc": "Face detection API", "cat": "AI/ML"},
    {"name": "Amazon S3 API", "url": "https://docs.aws.amazon.com/s3/", "desc": "Object storage API", "cat": "Utilities"},
    {"name": "Cloudinary API", "url": "https://cloudinary.com/documentation", "desc": "Media management API", "cat": "Utilities"},
    {"name": "Filestack API", "url": "https://filestack.com/docs/", "desc": "File handling API", "cat": "Utilities"},
    {"name": "Alpha Vantage API", "url": "https://www.alphavantage.co/", "desc": "Stock market API", "cat": "Finance"},
    {"name": "IEX Cloud API", "url": "https://iexcloud.io/", "desc": "Stock data API", "cat": "Finance"},
    {"name": "Twelve Data API", "url": "https://twelvedata.com/", "desc": "Financial data API", "cat": "Finance"},
    {"name": "Open Food Facts API", "url": "https://world.openfoodfacts.org/data", "desc": "Food database API", "cat": "Food & Drink"},
    {"name": "Google BigQuery API", "url": "https://cloud.google.com/bigquery/docs", "desc": "Data warehouse API", "cat": "Analytics"},
    {"name": "Google Books API", "url": "https://developers.google.com/books/", "desc": "Books search API", "cat": "Books"},
    {"name": "Google Fitness API", "url": "https://developers.google.com/fit/", "desc": "Fitness data API", "cat": "Health"},
    {"name": "Google Fonts API", "url": "https://developers.google.com/fonts/", "desc": "Web fonts API", "cat": "Art & Design"},
    {"name": "Google Custom Search", "url": "https://developers.google.com/custom-search/", "desc": "Search API", "cat": "Utilities"},
    {"name": "BlockScore API", "url": "https://docs.blockscore.com/", "desc": "Identity verification API", "cat": "Utilities"},
    {"name": "Cognito API", "url": "https://cognitohq.com/", "desc": "Identity verification API", "cat": "Utilities"},
    {"name": "Whitepages Pro API", "url": "https://pro.whitepages.com/", "desc": "Identity data API", "cat": "Utilities"},
    {"name": "WebPurify API", "url": "https://www.webpurify.com/", "desc": "Image moderation API", "cat": "AI/ML"},
    {"name": "Ably API", "url": "https://www.ably.com/documentation", "desc": "Real-time messaging API", "cat": "Communication"},
    {"name": "PubNub API", "url": "https://www.pubnub.com/docs/", "desc": "Real-time communication API", "cat": "Communication"},
    {"name": "Zetta API", "url": "https://github.com/zettajs/zetta", "desc": "IoT platform API", "cat": "Utilities"},
    {"name": "TosDR API", "url": "https://tosdr.org/api.html", "desc": "Terms of Service API", "cat": "Government"},
    {"name": "Auth0 API", "url": "https://auth0.com/docs/api", "desc": "Authentication API", "cat": "Utilities"},
    {"name": "Firebase API", "url": "https://firebase.google.com/docs/reference", "desc": "Backend as a service API", "cat": "Utilities"},
    {"name": "AYLIEN API", "url": "https://docs.aylien.com/textapi/", "desc": "NLP API", "cat": "AI/ML"},
    {"name": "Cohere API", "url": "https://docs.cohere.ai/", "desc": "NLP API", "cat": "AI/ML"},
    {"name": "DialogFlow API", "url": "https://cloud.google.com/dialogflow/docs", "desc": "Conversational AI API", "cat": "AI/ML"},
    {"name": "OpenAI API", "url": "https://platform.openai.com/docs/", "desc": "GPT and AI API", "cat": "AI/ML"},
    {"name": "LUIS AI API", "url": "https://www.luis.ai/", "desc": "Language understanding API", "cat": "AI/ML"},
    {"name": "MeaningCloud API", "url": "https://www.meaningcloud.com/developer/", "desc": "Text analysis API", "cat": "AI/ML"},
    {"name": "Wit.ai API", "url": "https://wit.ai/docs", "desc": "NLP API", "cat": "AI/ML"},
    {"name": "Amazon Maps API", "url": "https://developer.amazon.com/maps", "desc": "Amazon maps API", "cat": "Geolocation"},
    {"name": "CartoDB API", "url": "https://carto.com/developers/", "desc": "Location intelligence API", "cat": "Geolocation"},
    {"name": "Leaflet.js", "url": "https://leafletjs.com/", "desc": "JS maps library", "cat": "Geolocation"},
    {"name": "Mapbox API", "url": "https://docs.mapbox.com/api/", "desc": "Maps and location API", "cat": "Geolocation"},
    {"name": "OpenStreetMap API", "url": "https://wiki.openstreetmap.org/wiki/API", "desc": "Open maps API", "cat": "Geolocation"},
    {"name": "Yahoo Maps API", "url": "https://developer.yahoo.com/maps/", "desc": "Maps API", "cat": "Geolocation"},
    {"name": "Yandex Maps API", "url": "https://tech.yandex.com/maps/", "desc": "Maps API", "cat": "Geolocation"},
    {"name": "Newton Math API", "url": "https://newton.now.sh/", "desc": "Math calculation API", "cat": "Utilities"},
    {"name": "COVID-19 Data API", "url": "https://disease.sh/", "desc": "COVID data API", "cat": "Health"},
    {"name": "Infermedica API", "url": "https://developer.infermedica.com/", "desc": "Medical diagnosis API", "cat": "Health"},
    {"name": "OMDB API", "url": "https://www.omdbapi.com/", "desc": "Movie database API", "cat": "Entertainment"},
    {"name": "Trakt API", "url": "https://trakt.docs.apiary.io/", "desc": "TV/Movie tracking API", "cat": "Entertainment"},
    {"name": "Discogs API", "url": "https://www.discogs.com/developers/", "desc": "Music database API", "cat": "Music"},
    {"name": "Setlist.fm API", "url": "https://api.setlist.fm/docs/", "desc": "Setlist database API", "cat": "Music"},
    {"name": "TuneFind API", "url": "http://www.tunefind.com/api", "desc": "Music from TV/Movies API", "cat": "Music"},
    {"name": "Acoustid API", "url": "https://acoustid.org/webservice", "desc": "Audio fingerprinting API", "cat": "Music"},
    {"name": "AudD API", "url": "https://docs.audd.io/", "desc": "Music recognition API", "cat": "Music"},
    {"name": "Gracenote API", "url": "https://developer.gracenote.com/", "desc": "Music metadata API", "cat": "Music"},
    {"name": "ChartLyrics API", "url": "http://www.chartlyrics.com/api.aspx", "desc": "Lyrics API", "cat": "Music"},
    {"name": "iTunes Search API", "url": "https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/", "desc": "iTunes search API", "cat": "Music"},
    {"name": "Reverb API", "url": "https://dev.reverb.com/", "desc": "Music gear marketplace API", "cat": "Music"},
    {"name": "NewsAPI", "url": "https://newsapi.org/", "desc": "News aggregation API", "cat": "News"},
    {"name": "The Guardian API", "url": "https://open-platform.theguardian.com/", "desc": "News API", "cat": "News"},
    {"name": "Mediastack API", "url": "https://mediastack.com/", "desc": "News API", "cat": "News"},
    {"name": "Lorem Picsum API", "url": "https://picsum.photos/", "desc": "Placeholder images API", "cat": "Art & Design"},
    {"name": "DummyImage API", "url": "https://dummyimage.com/", "desc": "Placeholder images API", "cat": "Art & Design"},
    {"name": "Google Places API", "url": "https://developers.google.com/maps/documentation/places/", "desc": "Places search API", "cat": "Geolocation"},
    {"name": "FavQs API", "url": "https://favqs.com/api", "desc": "Quotes API", "cat": "Entertainment"},
    {"name": "Quotable API", "url": "https://github.com/lukePeavey/quotable", "desc": "Random quotes API", "cat": "Entertainment"},
    {"name": "NASA API", "url": "https://api.nasa.gov/", "desc": "NASA data API", "cat": "Utilities"},
    {"name": "Open Science Framework API", "url": "https://developer.osf.io/", "desc": "Research data API", "cat": "Utilities"},
    {"name": "ApiFlash API", "url": "https://apiflash.com/", "desc": "Screenshot API", "cat": "Utilities"},
    {"name": "ScreenshotAPI", "url": "https://screenshotapi.net/", "desc": "Screenshot API", "cat": "Utilities"},
    {"name": "Dailymotion API", "url": "https://developer.dailymotion.com/", "desc": "Video platform API", "cat": "Entertainment"},
    {"name": "DeviantArt API", "url": "https://www.deviantart.com/developers/", "desc": "Art community API", "cat": "Social"},
    {"name": "EventBrite API", "url": "https://www.eventbrite.com/platform/api", "desc": "Events platform API", "cat": "Entertainment"},
    {"name": "Gravatar API", "url": "https://en.gravatar.com/site/implement/", "desc": "Avatar API", "cat": "Social"},
    {"name": "Imgur API", "url": "https://apidocs.imgur.com/", "desc": "Image hosting API", "cat": "Social"},
    {"name": "Mastodon API", "url": "https://docs.joinmastodon.org/api/", "desc": "Social network API", "cat": "Social"},
    {"name": "Microlink API", "url": "https://microlink.io/", "desc": "Link preview API", "cat": "Utilities"},
    {"name": "TikTok API", "url": "https://developers.tiktok.com/", "desc": "Social video API", "cat": "Social"},
    {"name": "Twitch API", "url": "https://dev.twitch.tv/docs/api/", "desc": "Streaming platform API", "cat": "Entertainment"},
    {"name": "Viber API", "url": "https://developers.viber.com/docs/api/", "desc": "Messaging API", "cat": "Communication"},
    {"name": "VK API", "url": "https://vk.com/dev/", "desc": "Russian social network API", "cat": "Social"},
    {"name": "WhatsApp API", "url": "https://developers.facebook.com/docs/whatsapp/", "desc": "Messaging API", "cat": "Communication"},
    {"name": "Untappd API", "url": "https://untappd.com/api/docs", "desc": "Beer social API", "cat": "Social"},
    {"name": "Mercurial API", "url": "https://www.mercurial-scm.org/wiki/MercurialApi", "desc": "Version control API", "cat": "Utilities"},
    {"name": "TFS API", "url": "https://docs.microsoft.com/en-us/azure/devops/integrate/", "desc": "DevOps API", "cat": "Utilities"},
    {"name": "Ergast F1 API", "url": "https://ergast.com/mrd/", "desc": "Formula 1 data API", "cat": "Sports"},
    {"name": "Football Prediction API", "url": "https://boggio-analytics.com/fp-api/", "desc": "Football predictions API", "cat": "Sports"},
    {"name": "TheSportsDB API", "url": "https://www.thesportsdb.com/api.php", "desc": "Sports data API", "cat": "Sports"},
    {"name": "OpenF1 API", "url": "https://openf1.org/", "desc": "F1 telemetry API", "cat": "Sports"},
    {"name": "Faker API", "url": "https://fakerapi.it/", "desc": "Fake data API", "cat": "Utilities"},
    {"name": "ADS-B Exchange API", "url": "https://www.adsbexchange.com/data/", "desc": "Flight tracking API", "cat": "Transportation"},
    {"name": "CarsXE API", "url": "https://api.carsxe.com/", "desc": "Vehicle data API", "cat": "Transportation"},
    {"name": "Postmen API", "url": "https://docs.postmen.com/", "desc": "Shipping API", "cat": "Transportation"},
    {"name": "Ola API", "url": "https://developers.olacabs.com/", "desc": "Indian ride-hailing API", "cat": "Transportation"},
    {"name": "Bitly API", "url": "https://dev.bitly.com/", "desc": "URL shortening API", "cat": "Utilities"},
    {"name": "Is.gd API", "url": "https://is.gd/developers.php", "desc": "URL shortening API", "cat": "Utilities"},
    {"name": "Tiny.cc API", "url": "https://tiny.cc/api-docs", "desc": "URL shortening API", "cat": "Utilities"},
    {"name": "Weather Unlocked API", "url": "https://developer.weatherunlocked.com/", "desc": "Weather API", "cat": "Weather"},
]

def main():
    # Load existing APIs for dedup
    existing_keys = set()
    try:
        with open('/Users/gustavhemmingsson/Projects/apiclaw/src/registry/apis.json') as f:
            existing = json.load(f)
            for api in existing.get('apis', []):
                name_key = api.get('name', '').lower().replace(' ', '').replace('-', '')
                url_key = api.get('link', '').lower().replace('https://', '').replace('http://', '').rstrip('/')
                existing_keys.add(name_key)
                existing_keys.add(url_key)
            print(f"Loaded {len(existing.get('apis', []))} existing APIs for dedup")
    except Exception as e:
        print(f"Could not load existing APIs: {e}")
    
    # Convert to standard format and deduplicate
    seen = set()
    unique_apis = []
    
    for api_data in APIS_DATA:
        name_key = api_data['name'].lower().replace(' ', '').replace('-', '')
        url_key = api_data['url'].lower().replace('https://', '').replace('http://', '').rstrip('/')
        
        # Skip if exists
        if name_key in existing_keys or url_key in existing_keys:
            continue
        if name_key in seen or url_key in seen:
            continue
            
        seen.add(name_key)
        seen.add(url_key)
        
        api = {
            'id': generate_id(api_data['name']),
            'name': api_data['name'],
            'description': api_data['desc'],
            'category': api_data['cat'],
            'auth': 'unknown',
            'https': api_data['url'].startswith('https'),
            'cors': 'unknown',
            'link': api_data['url'],
            'pricing': 'unknown',
            'keywords': [api_data['cat'].lower()],
            'source': 'Expansion Agent 2 - Awesome Lists'
        }
        unique_apis.append(api)
    
    print(f"\nExtracted {len(APIS_DATA)} total APIs from sources")
    print(f"Found {len(unique_apis)} NEW unique APIs (after dedup)")
    
    # Category distribution
    cat_dist = {}
    for api in unique_apis:
        cat = api['category']
        cat_dist[cat] = cat_dist.get(cat, 0) + 1
    
    print("\nCategory distribution:")
    for cat, count in sorted(cat_dist.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")
    
    # Save
    output = {
        "version": "1.0.0",
        "source": "Expansion Agent 2 - Awesome Lists (TonnyL, n0shake, Kikobeats)",
        "generatedAt": datetime.now().isoformat(),
        "count": len(unique_apis),
        "apis": unique_apis
    }
    
    output_file = f"/Users/gustavhemmingsson/Projects/apiclaw/data/expansion-agent2-{datetime.now().strftime('%Y%m%d')}.json"
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n✅ Saved {len(unique_apis)} APIs to: {output_file}")
    return unique_apis

if __name__ == '__main__':
    main()
