#!/usr/bin/env python3
"""
APIClaw Expansion: Parse TonnyL/Awesome_APIs
"""
import json
import re
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
    
    keywords = [category.lower()]
    desc_lower = desc.lower()
    if 'free' in desc_lower:
        keywords.append('free')
    if 'json' in desc_lower:
        keywords.append('json')
    if 'rest' in desc_lower:
        keywords.append('rest')
    
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
        'source': 'tonnyL-awesome'
    })
    existing_ids.add(api_id)
    existing_links.add(link.lower().rstrip('/'))
    existing_names.add(name.lower())
    return True

added = 0

# From TonnyL/Awesome_APIs - extracted unique ones
apis = [
    # Anime
    ("AcgClub", "AcgClub API provides ACG-related aggregation services", "Anime", "https://github.com/Rabtman/AcgClub/wiki/"),
    ("hitokoto", "hitokoto API provides a one-word service from anime", "Anime", "https://hitokoto.cn/api"),
    ("Kitsu API", "Anime discovery platform with tracking features", "Anime", "https://kitsu.docs.apiary.io/#"),
    
    # Blogging
    ("Blogger", "Create new blog posts, edit or delete existing posts", "Blogging", "https://developers.google.com/blogger/"),
    ("Medium", "Access to data of medium.com", "Blogging", "https://github.com/Medium/medium-api-docs"),
    ("Weebly", "Website builder for customers", "Blogging", "https://cloud-developer.weebly.com/"),
    ("Telegraph", "Telegram's publishing service API", "Blogging", "http://telegra.ph/api"),
    
    # Books
    ("An API Of Ice And Fire", "Data about Books, Characters, Houses from A Song of Ice and Fire", "Books", "https://anapioficeandfire.com/"),
    ("Open Library Books API", "Open, editable library catalog", "Books", "https://openlibrary.org/developers/api"),
    ("NYPL Digital Collections", "The NY Public Library rare and unique material", "Books", "http://api.repo.nypl.org/"),
    ("Bookshare", "Books and periodicals for users with print disabilities", "Books", "http://developer.bookshare.org/"),
    
    # Business
    ("Concur Labs", "Access to Concur's RESTful API", "Business", "https://developer.concur.com/api-reference/"),
    ("Envoy", "Access to Envoy's API", "Business", "https://developers.envoy.com/"),
    ("JotForm", "Connect to your form data", "Business", "http://api.jotform.com/docs/"),
    ("Pruvan", "Access to Pruvan's API", "Business", "https://pruvan.com/resources/pruvan-api/"),
    ("Quip", "Automate processes and integrate Quip", "Business", "https://quip.com/api/"),
    ("Wolfram Data Drop", "Access to Wolfram Data Drop's RESTful API", "Business", "https://www.wolfram.com/datadrop/quick-reference/web-api/"),
    
    # Carsharing
    ("Lyft API", "Real-time ETAs, availability, price estimates, ride status", "Transportation", "https://www.lyft.com/developers"),
    
    # Cloud Storage
    ("Amazon Cloud Drive", "Cloud Drive RESTful API and SDKs", "Cloud Storage", "https://developer.amazon.com/amazon-drive"),
    ("Box API", "Search, metadata, granular permission models", "Cloud Storage", "https://developer.box.com/"),
    ("Document Cloud", "Analyze documents with OpenCalais", "Cloud Storage", "http://www.documentcloud.org/help/api"),
    ("QNAP Development Toolkit", "Manage and access files on NAS", "Cloud Storage", "https://www.qnap.com/event/dev/useng/p_about.php"),
    ("Verizon Cloud", "Upload, retrieve, and manage large amounts of data", "Cloud Storage", "http://www.verizonenterprise.com/cloud/documentation/StorageAPIReference.htm"),
    
    # Delivery Tracking
    ("AfterShip", "Shipment tracking for over 200 couriers", "Delivery", "https://docs.aftership.com/api/"),
    ("Aramex", "Parcel, package, and freight delivery via global network", "Delivery", "https://www.aramex.com/developers/aramex-apis"),
    ("Canada Post", "Integrate Canada Post services like shipping, rating, tracking", "Delivery", "http://www.canadapost.ca/cpo/mc/business/productsservices/developers/services/fundamentals.jsf"),
    ("DHL", "DHL XML Services for availability, rates, tracking", "Delivery", "http://www.dhl-usa.com/en/express/resource_center/integrated_shipping_solutions.html"),
    ("FedEx", "FedEx web services for shipping functionality", "Delivery", "https://www.fedex.com/us/developer/web-services/index.html"),
    ("UPS", "UPS shipping functionalities integration", "Delivery", "http://www.ups.com/content/us/en/resources/techsupport/developercenter.html"),
    
    # Design
    ("Behance", "Get information of projects, creatives, fields, users", "Design", "https://www.behance.net/dev/api/endpoints/"),
    ("deviantART", "Allows to get data of deviantart.com", "Design", "https://www.deviantart.com/developers/"),
    
    # Development
    ("ARTIK Cloud", "The ARTIK Cloud API for IoT platform", "Development", "https://developer.artik.cloud/documentation/api-reference/"),
    ("AT&T M2X", "M2X's RESTful API for time-series data analytics", "Development", "https://m2x.att.com/developer/documentation/v2/overview"),
    ("bitly API", "Save, share and discover links", "Development", "https://dev.bitly.com/"),
    ("Buddy CI", "Continuous Integration service for GitHub, Bitbucket, GitLab", "Development", "https://buddy.works/api/reference/getting-started/overview"),
    ("Bugzilla", "Web-based general-purpose bugtracker", "Development", "https://wiki.mozilla.org/Bugzilla:REST_API"),
    ("CircleCI API", "RESTful API for CircleCI", "Development", "https://circleci.com/docs/api/v1-reference/"),
    ("Coding", "Access to coding.net", "Development", "https://open.coding.net/"),
    ("Dataflow kit", "Web Scraping framework for Gophers", "Development", "https://github.com/slotix/dataflowkit"),
    ("gank.io", "Access to gank.io API", "Development", "http://gank.io/api"),
    ("Gitter", "Chat tools for GitHub", "Development", "https://developer.gitter.im/docs/welcome"),
    ("Google Play Developer", "Perform publishing and app-management tasks", "Development", "https://developers.google.com/android-publisher/"),
    ("IPInfo.io", "IP geolocation integration", "Development", "https://ipinfo.io/developers"),
    ("Laravel China", "Access to laravel-china.org", "Development", "https://laravel-china.org/topics/3097"),
    ("MAC Address Vendor Lookup", "Retrieve vendor details from MAC address", "Development", "https://macaddress.io/api-documentation"),
    ("openHAB", "REST API for home automation", "Development", "https://github.com/openhab/openhab1-addons/wiki/REST-API"),
    ("Particle", "The Particle Cloud REST API for IoT", "Development", "https://docs.particle.io/reference/api/"),
    ("QR Code Generator", "Generate and decode QR codes", "Development", "http://goqr.me/api/"),
    ("StackExchange", "Access to Stack Exchange API", "Development", "https://api.stackexchange.com/docs"),
    ("SVN API", "Subversion APIs for 3rd-party applications", "Development", "https://subversion.apache.org/docs/api/1.8/"),
    ("TravisCI", "API used by Travis CI web interface", "Development", "https://docs.travis-ci.com/api/"),
    ("V2EX", "Access to v2ex.com", "Development", "https://www.v2ex.com/p/7v9TEc53"),
    ("W3C", "W3C Web API for specifications, groups, organizations", "Development", "https://github.com/w3c/w3c-api"),
    ("ZenHub", "ZenHub API for project management with GitHub", "Development", "https://github.com/ZenHubIO/API"),
    
    # Email
    ("Context.IO", "Modern, scalable email API", "Email", "http://context.io/"),
    ("Inbox", "Modern RESTful APIs for working with mail providers", "Email", "https://www.inboxapp.com/docs"),
    ("Mandrill", "Transactional, triggered, and personalized email", "Email", "https://mandrillapp.com/api/docs/"),
    ("Outlook Mail", "Mail API for Office 365", "Email", "https://msdn.microsoft.com/en-us/office/office365/api/mail-rest-operations"),
    
    # Fitness
    ("Adidas AG", "Access to Adidas AG's API", "Fitness", "https://developers.adidas.com/services"),
    ("Jawbone UP", "Step, activity, food, and sleep tracking", "Fitness", "https://jawbone.com/up/developer"),
    ("Lifelog", "Sony's lifestyle, fitness and health data", "Fitness", "https://developer.sony.com/develop/services/lifelog-api/"),
    ("Misfit", "Activity tracking, sleep tracking and wearable control", "Fitness", "https://build.misfit.com/"),
    ("Nike+", "Activity Services for user's run details", "Fitness", "https://developer.nike.com/content/nike-developer-cq/us/en_us/index/documentation/api-docs.html"),
    ("Recon", "Access to Recon instruments data", "Fitness", "http://www.reconinstruments.com/developers/develop/for-recon-engage/api-documentation/"),
    
    # Food
    ("Order Pizza REST API", "A RESTful API as pizza restaurant ordering system", "Food", "https://order-pizza-api.herokuapp.com/api/ui"),
    
    # Forex & Currencies
    ("1Forge.com", "Real-time forex and crypto quotes via JSON and WebSocket", "Currency", "https://1forge.com/"),
    ("CurrencyScoop.com", "Free Real-time and historical currency rates JSON API", "Currency", "https://currencyscoop.com/"),
    
    # Games
    ("Battle.net", "Battle.net APIs for D3, WoW, SC2, and more", "Games", "https://dev.battle.net/"),
    ("Clash of Clans", "Near real-time access to game related data", "Games", "https://developer.clashofclans.com/#/"),
    ("EVE Online", "Popular MMORPG CREST and XML APIs", "Games", "https://developers.eveonline.com/"),
    ("Facebook Games Services", "Achievements API, Scores API, App Notifications", "Games", "https://developers.facebook.com/docs/games"),
    ("Google Play Games Services", "Achievements, leaderboards, player stats", "Games", "https://developers.google.com/games/"),
    ("Steam Web APIs", "Item data for Team Fortress 2 and more", "Games", "https://steamcommunity.com/dev"),
    ("Giant Bomb", "Game titles, ratings, videos, companies, themes, genres", "Games", "http://www.giantbomb.com/api/"),
    ("Guild Wars 2", "Access to Guild Wars 2 data", "Games", "https://wiki.guildwars2.com/wiki/API:Main"),
    
    # IoT
    ("Automatic", "REST API, Real-time Event API and Streaming API", "IoT", "https://developer.automatic.com/"),
    ("Amazon Alexa", "Voice-enable connected products", "IoT", "https://developer.amazon.com/public/solutions/alexa/alexa-voice-service/content/avs-api-overview"),
    ("Google Assistant", "Actions on Google for Google Assistant", "IoT", "https://developers.google.com/actions/"),
    ("Home8", "100% wireless IoT System for Smart Alarm", "IoT", "https://developer.home8systems.com/"),
    ("Homey", "Access to Homey's API", "IoT", "https://developers.athom.com/api/"),
    ("HP Print", "Access to HP Print's API", "IoT", "https://developers.hp.com/printos/printos"),
    ("LIFX", "Multi-color smart WiFi-enabled LED lightbulb", "IoT", "https://api.developer.lifx.com/"),
    ("LightwaveRF", "Local command protocols for LightwaveRF system", "IoT", "https://api.lightwaverf.com/"),
    ("microBees", "Execute REST APIs and subscribe for real-time messaging", "IoT", "http://developers.microbees.com/documentation/#reference"),
    ("Mojio", "REST endpoints and PUSH API for car data", "IoT", "https://www.moj.io/developer/"),
    ("myStrom", "REST API for myStrom WLAN Energy Control Switch", "IoT", "https://mystrom.ch/de/mystrom-api"),
    ("Neurio", "Measure your electrical energy consumption", "IoT", "http://neur.io/developers/"),
    ("Smappee", "Measure electrical energy consumption and solar production", "IoT", "https://smappee.atlassian.net/wiki/display/DEVAPI/SmappeeDevAPI+Home"),
    ("Stack Lighting", "Control brightness, color temperature, motion settings", "IoT", "http://developers.stacklighting.com/"),
    ("Vinli", "Platform for building connected car apps", "IoT", "https://dev.vin.li/#/home"),
    ("Yeelight", "Smart LED products remote control through WiFi", "IoT", "http://www.yeelight.com/en_US/developer"),
    
    # Machine Learning
    ("Amazon Machine Learning", "Build smart applications for fraud detection, forecasting", "Machine Learning", "https://aws.amazon.com/cn/documentation/machine-learning/"),
    ("BigML", "Anomaly detection, cluster analysis, SunBurst visualization", "Machine Learning", "https://bigml.com/api"),
    ("Diffbot", "Combination of AI, computer vision, ML, NLP for web data", "Machine Learning", "https://www.diffbot.com/dev/docs/"),
    ("Google Cloud Prediction", "Machine Learning with RESTful API", "Machine Learning", "https://cloud.google.com/prediction/docs/"),
    
    # Maps
    ("Amap", "Access to Amap's web APIs (China)", "Maps", "http://lbs.amap.com/"),
    ("Baidu Map", "Access to Baidu Map's web APIs (China)", "Maps", "http://lbsyun.baidu.com/index.php?title=webapi"),
    ("Bing maps", "Access to Bing maps' APIs", "Maps", "https://www.microsoft.com/maps/choose-your-bing-maps-API.aspx"),
    ("Here Maps", "Simple HTTP GET methods for maps, routing, geocoding", "Maps", "https://developer.here.com/develop/rest-apis"),
    ("Tencent Map", "Access to Tencent Map's WebService APIs", "Maps", "http://lbs.qq.com/webservice_v1/index.html"),
    
    # Messaging
    ("Cisco Spark", "Create rooms, invite people, post messages", "Messaging", "https://developer.ciscospark.com/"),
    ("Dingtalk", "Access to Dingtalk's APIs", "Messaging", "https://open-doc.dingtalk.com/"),
    ("dondeEsta Family", "Access to dondeEsta family API", "Messaging", "http://docs.dondeesta.apiary.io/#introduction/api"),
    ("Fleep", "Messenger for teams and projects", "Messaging", "https://fleep.io/fleepapi/"),
    ("GroupMe", "Group messaging abilities integration", "Messaging", "https://dev.groupme.com/docs/v3"),
    ("indoona", "Send messages to indoona users and groups", "Messaging", "https://developer.indoona.com/"),
    ("LINE", "Freeware app for instant communications", "Messaging", "https://developers.line.me/"),
    ("MessageBird", "Integrate SMS, Chat & Voice", "Messaging", "https://developers.messagebird.com/"),
    ("Yo", "Simplest notification platform", "Messaging", "http://docs.justyo.co/"),
    
    # Music
    ("KaolaFM", "Access to data of KaolaFM", "Music", "https://github.com/kaolafm/api"),
    ("MusicGraph", "World's first knowledge engine for music", "Music", "https://developer.musicgraph.com/"),
    ("One Music", "Metadata about an astonishing range of music", "Music", "http://www.onemusicapi.com/"),
    ("QingtingFM", "Access to data of QingtingFM", "Music", "http://open.qingting.fm/"),
    ("SearchLy", "Similarities search based on song lyrics", "Music", "https://github.com/AlbertSuarez/searchly"),
    
    # News & Information
    ("aztro", "aztro is a REST API for retrieving horoscope information", "News", "https://aztro.sameerkumar.website"),
    ("BreweryDB", "Database of breweries, beers, beer events and guilds", "News", "http://www.brewerydb.com/developers"),
    ("Diigo", "Build apps that interact with Diigo service", "News", "https://www.diigo.com/api_dev"),
    ("Inoreader", "Subscribe to feeds, read articles or catalogue", "News", "https://www.inoreader.com/developers/"),
    ("Instapaper", "Add URLs to Instapaper", "News", "https://www.instapaper.com/api"),
    ("Narro", "Access articles and readings", "News", "https://docs.narro.co/#introduction"),
    ("Newsblur", "Retrieve feeds, feed counts, icons, statistics", "News", "https://newsblur.com/api"),
    ("NPR", "NPR content API", "News", "http://www.npr.org/api/index"),
    ("Pinboard", "Interact with bookmarks, notes and lists", "News", "https://pinboard.in/api"),
    ("Product Hunt", "Access to producthunt.com", "News", "https://api.producthunt.com/v1/docs"),
    ("USA TODAY", "Latest news and stories from USA TODAY", "News", "https://developer.usatoday.com/docs/"),
    
    # Notes
    ("Youdao Note", "Access to Youdao Note's web APIs", "Notes", "http://note.youdao.com/open/"),
    
    # Payment
    ("Paymill", "Implement PAYMILL payment", "Payment", "https://developers.paymill.com/index"),
    ("Paytm", "Take payments using Paytm Wallet", "Payment", "https://paytm.com/business/payments/developers"),
    ("WePay", "Designed for platforms like marketplaces, crowdfunding", "Payment", "https://www.wepay.com/"),
    ("PhonePe", "Cashless and seamless payment experience", "Payment", "https://developer.phonepe.com/docs"),
    
    # Photography
    ("Pixabay", "RESTful interface for searching Pixabay images and videos", "Photography", "https://pixabay.com/api/docs/"),
    ("Unsplash It", "Beautiful placeholders using Unsplash images", "Photography", "https://unsplash.it/"),
    ("Unsplash Resource", "Simple API for embedding Unsplash photos", "Photography", "https://source.unsplash.com/"),
    
    # Places
    ("Zomato", "Restaurant metadata for over 1.5 million restaurants", "Places", "https://developers.zomato.com/api"),
    
    # Social
    ("Disqus", "Social integration, networking, user profiles, spam tools", "Social", "https://disqus.com/api/docs/"),
    ("Flickr", "Online photo management and sharing", "Social", "https://www.flickr.com/services/api/"),
    ("Weibo", "Access to posts, users, comments, favorites", "Social", "http://open.weibo.com/wiki/API"),
    
    # Shopping
    ("Best Buy", "Access to Best Buy's APIs", "Shopping", "https://developer.bestbuy.com/"),
    ("Dangdang", "Access to Dangdang's APIs", "Shopping", "http://open.dangdang.com/"),
    ("Home Depot", "Access to Home Depot's APIs", "Shopping", "https://developer.homedepot.com/"),
    ("JD", "Access to JD's APIs", "Shopping", "https://jos.jd.com/api/index.htm"),
    ("Semantics3", "Access to Semantics3's RESTful APIs", "Shopping", "http://docs.semantics3.com/reference"),
    ("Slice", "Access to Slice's REST APIs", "Shopping", "https://developer.slice.com/"),
    ("Taobao", "Access to Taobao's APIs", "Shopping", "https://open.taobao.com/doc2/api_list.htm"),
    
    # Teamwork
    ("Asana", "Programmatically update and access data on Asana", "Teamwork", "https://asana.com/guide/help/api/api"),
    ("join.me", "Online meeting tool API", "Teamwork", "https://developer.join.me/"),
    ("Teambition", "Open Platform with complete set of Open API", "Teamwork", "https://www.teambition.com/developer/open-platform"),
    ("TeamSnap", "World's best team management solution", "Teamwork", "http://developer.teamsnap.com/"),
    ("Worktile", "Access to Worktile's APIs", "Teamwork", "https://dev.worktile.com/document/overview"),
    
    # Text Analysis
    ("BosonNLP", "Chinese text analysis", "NLP", "http://docs.bosonnlp.com/"),
    ("Detect Language API", "Automatic language identification for any texts", "NLP", "https://rapidapi.com/BigLobster/api/language-identification-prediction"),
    ("Tencent NLP", "Chinese text analysis", "NLP", "http://nlp.qq.com/help.cgi"),
    ("Watson Natural Language Understanding", "Natural language processing to analyze semantic features", "NLP", "https://www.ibm.com/watson/developercloud/natural-language-understanding/api/v1/"),
    
    # To-dos
    ("Beeminder", "Access to Beeminder's APIs", "Productivity", "https://www.beeminder.com/api"),
    ("FollowUp.cc", "Access to FollowUp.cc's APIs", "Productivity", "http://docs.followup.cc/"),
    ("Toodledo", "Access to user's tasks, notes, outlines and lists", "Productivity", "https://api.toodledo.com/3/"),
    
    # Tourism
    ("ctrip", "Access to the data of ctrip", "Tourism", "http://u.ctrip.com/union/help/Termsofuse.aspx"),
    ("elong", "Access to hotels and air tickets data", "Tourism", "http://open.elong.com/home/index"),
    ("qunar", "Access to hotel, train, air tickets and insurance data", "Tourism", "http://open.qunar.com/"),
    ("tuniu", "Access to the data of tuniu", "Tourism", "http://open.tuniu.cn/"),
    
    # Translation
    ("Baidu Translate", "Supports translation between multiple languages", "Translation", "http://api.fanyi.baidu.com/api/trans/product/index"),
    ("iciba", "Support simple translation", "Translation", "http://open.iciba.com/?c=api"),
    ("Shanbay", "Query, adding study records, writing notes", "Translation", "https://www.shanbay.com/help/developer/api_v1/"),
    ("yeekit", "Support translation between several languages", "Translation", "http://api.yeekit.com/"),
    ("Youdao", "Support simple translation", "Translation", "http://fanyi.youdao.com/openapi"),
    
    # Video
    ("Narrative", "Customize your clip, get players, badges", "Video", "http://open.getnarrative.com/"),
    ("iqiyi", "Supports query data of iqiyi", "Video", "http://open.iqiyi.com/lib/scheme.html"),
    ("LeTV", "Allows to query data, upload, download", "Video", "http://www.lecloud.com/zh-cn/help/2016/07/27/150.html?LeftMenu=api_db_guide"),
    ("Rotten Tomatoes", "Access to ratings and reviews from Rotten Tomatoes", "Video", "https://developer.fandango.com/Rotten_Tomatoes"),
    ("Sohu TV", "Allows to query data of Sohu TV", "Video", "http://lm.tv.sohu.com/union/open_platform.do"),
    ("TVmaze", "TV Show and web series database", "Video", "https://www.tvmaze.com/api"),
    ("Youku", "Allows to upload, download, log in", "Video", "https://doc.open.youku.com/"),
    
    # Voice Analysis
    ("Baidu Yuyin", "Access to Baidu Yuyin's voice analysis REST APIs", "Voice", "http://yuyin.baidu.com/docs"),
    
    # Vision Analysis
    ("CamScanner", "Digitalize paper documents with image processing", "Vision", "https://dev.camscanner.com/?language=en-us"),
    ("clarifai", "Image and video recognition as a service", "Vision", "https://clarifai.com/developer/guide/"),
    ("Face++", "Computer vision technologies for reading and understanding", "Vision", "https://console.faceplusplus.com/documents/5678948"),
    ("wozhitu", "Access to wozhitu's vision analysis APIs", "Vision", "http://api1.wozhitu.com/"),
    
    # Weather
    ("Aeris Weather", "Advanced weather API for custom applications", "Weather", "http://www.aerisweather.com/develop/"),
    ("Caiyun Weather", "Weather information of China", "Weather", "https://caiyunapp.com/index.html#api"),
    ("heweather", "Weather information of China", "Weather", "https://www.heweather.com/documents/"),
    ("Weather Unlocked", "Weather driven solutions for digital advertising", "Weather", "https://developer.weatherunlocked.com/documentation"),
    ("Seniverse", "Weather information of China", "Weather", "https://www.seniverse.com/doc"),
    ("Yandex.Weather", "Forecasting technology Meteum for Russia", "Weather", "https://tech.yandex.com/weather/"),
    
    # More platforms
    ("Alidayu", "APIs available in China", "Platform", "http://www.alidayu.com/"),
    ("APiX", "Credit APIs available in China", "Platform", "https://www.apix.cn/"),
    ("Avatar Data", "APIs available in China", "Platform", "http://www.avatardata.cn/Docs"),
    ("Baidu API STORE", "APIs available in China", "Platform", "http://apistore.baidu.com/"),
    ("Datayes", "Financial APIs available in China", "Platform", "https://m.datayes.com/"),
    ("HaoService", "APIs available in China", "Platform", "http://www.haoservice.com/"),
    ("iTunes Search API", "Search content within iTunes Store, App Store", "Platform", "https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/"),
    ("Juhe Data", "APIs available in China", "Platform", "https://www.juhe.cn/"),
]

for name, desc, category, link in apis:
    if add_api(name, desc, category, link):
        added += 1

# Update metadata
registry['count'] = len(registry['apis'])
registry['lastUpdated'] = '2026-02-22'

# Write back
with open(registry_path, 'w') as f:
    json.dump(registry, f, indent=2)

print(f"✅ APIClaw TonnyL Expansion Complete")
print(f"   Added: {added} new APIs")
print(f"   Total: {registry['count']} APIs")
