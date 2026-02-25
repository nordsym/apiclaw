#!/usr/bin/env python3
"""
APIClaw Night Expansion - 2026-02-24 03:00 Batch 2
Mål: +1000 APIs från TonnyL/Awesome_APIs + more sources
"""

import json
import os
from datetime import datetime

# More APIs from various sources
NEW_APIS_BATCH2 = [
    # === FROM TONNY'S AWESOME APIS ===
    # BLOGGING
    {"name": "Blogger API", "description": "Create new blog posts, edit or delete existing posts", "category": "Blogging", "authType": "oauth", "baseUrl": "https://developers.google.com/blogger/"},
    {"name": "Medium API", "description": "Access to Medium.com data", "category": "Blogging", "authType": "oauth", "baseUrl": "https://github.com/Medium/medium-api-docs"},
    {"name": "Weebly Cloud", "description": "Website builder API", "category": "Blogging", "authType": "apiKey", "baseUrl": "https://cloud-developer.weebly.com/"},
    {"name": "WordPress APIs", "description": "WordPress platform APIs", "category": "Blogging", "authType": "oauth", "baseUrl": "https://codex.wordpress.org/WordPress_APIs"},
    {"name": "Telegraph API", "description": "Telegram's publishing service", "category": "Blogging", "authType": "none", "baseUrl": "http://telegra.ph/api"},

    # BOOKS
    {"name": "An API of Ice and Fire", "description": "Game of Thrones book data", "category": "Books", "authType": "none", "baseUrl": "https://anapioficeandfire.com/"},
    {"name": "NYPL Digital Collections", "description": "NY Public Library digital archive", "category": "Books", "authType": "apiKey", "baseUrl": "http://api.repo.nypl.org/"},
    {"name": "Bookshare", "description": "Book access for print disabilities", "category": "Books", "authType": "apiKey", "baseUrl": "http://developer.bookshare.org/"},

    # BUSINESS
    {"name": "Airtable API", "description": "Spreadsheet database API", "category": "Business", "authType": "apiKey", "baseUrl": "https://airtable.com/api"},
    {"name": "Buffer", "description": "Social media management API", "category": "Business", "authType": "oauth", "baseUrl": "https://buffer.com/developers/api"},
    {"name": "Concur Labs", "description": "Expense and travel management", "category": "Business", "authType": "oauth", "baseUrl": "https://developer.concur.com/api-reference/"},
    {"name": "Envoy API", "description": "Visitor management", "category": "Business", "authType": "apiKey", "baseUrl": "https://developers.envoy.com/"},
    {"name": "JotForm", "description": "Form builder API", "category": "Business", "authType": "apiKey", "baseUrl": "http://api.jotform.com/docs/"},
    {"name": "Pruvan", "description": "Field service management", "category": "Business", "authType": "apiKey", "baseUrl": "https://pruvan.com/resources/pruvan-api/"},
    {"name": "Quip API", "description": "Collaborative documents API", "category": "Business", "authType": "oauth", "baseUrl": "https://quip.com/api/"},
    {"name": "Wolfram Data Drop", "description": "Data storage and analysis", "category": "Business", "authType": "apiKey", "baseUrl": "https://www.wolfram.com/datadrop/quick-reference/web-api/"},

    # CARSHARING
    {"name": "Lyft API", "description": "Rideshare ETAs and pricing", "category": "Transportation", "authType": "oauth", "baseUrl": "https://www.lyft.com/developers"},
    {"name": "Uber API", "description": "Rideshare trips and logistics", "category": "Transportation", "authType": "oauth", "baseUrl": "https://developer.uber.com/"},

    # CLOUD
    {"name": "Google Cloud Platform", "description": "Google cloud services APIs", "category": "Cloud", "authType": "apiKey", "baseUrl": "https://cloud.google.com/apis/docs/overview"},
    {"name": "Oracle Cloud", "description": "Oracle cloud services", "category": "Cloud", "authType": "apiKey", "baseUrl": "https://cloud.oracle.com/home"},
    {"name": "Tencent Cloud", "description": "Tencent cloud services", "category": "Cloud", "authType": "apiKey", "baseUrl": "https://cloud.tencent.com/document/api"},
    {"name": "Alibaba Cloud", "description": "Alibaba cloud services", "category": "Cloud", "authType": "apiKey", "baseUrl": "https://develop.aliyun.com/api/"},
    {"name": "Baidu Cloud", "description": "Baidu cloud services", "category": "Cloud", "authType": "apiKey", "baseUrl": "https://cloud.baidu.com/doc/index.html"},
    {"name": "LeanCloud", "description": "Backend as a service", "category": "Cloud", "authType": "apiKey", "baseUrl": "https://leancloud.cn/"},
    {"name": "Wilddog", "description": "Real-time backend service", "category": "Cloud", "authType": "apiKey", "baseUrl": "https://www.wilddog.com/"},
    {"name": "Qiniu Cloud", "description": "Cloud storage service", "category": "Cloud", "authType": "apiKey", "baseUrl": "http://www.qiniu.com/"},
    {"name": "Upyun", "description": "CDN and cloud storage", "category": "Cloud", "authType": "apiKey", "baseUrl": "https://www.upyun.com/"},
    {"name": "Bmob", "description": "Backend as a service", "category": "Cloud", "authType": "apiKey", "baseUrl": "http://www.bmob.cn/"},

    # CLOUD STORAGE
    {"name": "Amazon Cloud Drive", "description": "Amazon cloud file storage", "category": "Cloud Storage", "authType": "oauth", "baseUrl": "https://developer.amazon.com/amazon-drive"},
    {"name": "DocumentCloud", "description": "Document analysis and storage", "category": "Cloud Storage", "authType": "apiKey", "baseUrl": "http://www.documentcloud.org/help/api"},
    {"name": "QNAP API", "description": "NAS device management", "category": "Cloud Storage", "authType": "apiKey", "baseUrl": "https://www.qnap.com/event/dev/useng/p_about.php"},
    {"name": "Verizon Cloud", "description": "Enterprise cloud storage", "category": "Cloud Storage", "authType": "apiKey", "baseUrl": "http://www.verizonenterprise.com/cloud/documentation/StorageAPIReference.htm"},

    # DELIVERY TRACKING
    {"name": "AfterShip", "description": "Shipment tracking 200+ couriers", "category": "Logistics", "authType": "apiKey", "baseUrl": "https://docs.aftership.com/api/"},
    {"name": "Aramex", "description": "Global shipping delivery", "category": "Logistics", "authType": "apiKey", "baseUrl": "https://www.aramex.com/developers/aramex-apis"},
    {"name": "Canada Post", "description": "Canadian shipping API", "category": "Logistics", "authType": "apiKey", "baseUrl": "http://www.canadapost.ca/cpo/mc/business/productsservices/developers/services/fundamentals.jsf"},
    {"name": "DHL API", "description": "Global shipping services", "category": "Logistics", "authType": "apiKey", "baseUrl": "http://www.dhl-usa.com/en/express/resource_center/integrated_shipping_solutions.html"},
    {"name": "FedEx API", "description": "FedEx shipping integration", "category": "Logistics", "authType": "apiKey", "baseUrl": "https://www.fedex.com/us/developer/web-services/index.html"},
    {"name": "UPS API", "description": "UPS shipping services", "category": "Logistics", "authType": "apiKey", "baseUrl": "http://www.ups.com/content/us/en/resources/techsupport/developercenter.html"},
    {"name": "Kuaidi100", "description": "China courier tracking", "category": "Logistics", "authType": "apiKey", "baseUrl": "http://www.kuaidi100.com/openapi/"},
    {"name": "Kdniao", "description": "China logistics API", "category": "Logistics", "authType": "apiKey", "baseUrl": "http://www.kdniao.com/"},

    # DESIGN
    {"name": "Behance API", "description": "Creative portfolio platform", "category": "Design", "authType": "apiKey", "baseUrl": "https://www.behance.net/dev/api/endpoints/"},
    {"name": "DeviantART API", "description": "Art community platform", "category": "Design", "authType": "oauth", "baseUrl": "https://www.deviantart.com/developers/"},

    # DEVELOPMENT
    {"name": "ARTIK Cloud", "description": "Samsung IoT platform", "category": "IoT", "authType": "apiKey", "baseUrl": "https://developer.artik.cloud/documentation/api-reference/"},
    {"name": "AT&T M2X", "description": "IoT time series data", "category": "IoT", "authType": "apiKey", "baseUrl": "https://m2x.att.com/developer/documentation/v2/overview"},
    {"name": "Bitbucket API", "description": "Git hosting platform", "category": "Development", "authType": "oauth", "baseUrl": "https://developer.atlassian.com/cloud/bitbucket/"},
    {"name": "Bitly API", "description": "URL shortening service", "category": "Development", "authType": "oauth", "baseUrl": "https://dev.bitly.com/"},
    {"name": "Buddy CI", "description": "Continuous integration platform", "category": "Development", "authType": "oauth", "baseUrl": "https://buddy.works/api/reference/getting-started/overview"},
    {"name": "Bugzilla API", "description": "Bug tracking system", "category": "Development", "authType": "apiKey", "baseUrl": "https://wiki.mozilla.org/Bugzilla:REST_API"},
    {"name": "Dataflow Kit", "description": "Web scraping framework", "category": "Development", "authType": "apiKey", "baseUrl": "https://github.com/slotix/dataflowkit"},
    {"name": "Gitter API", "description": "Chat for developers", "category": "Development", "authType": "oauth", "baseUrl": "https://developer.gitter.im/docs/welcome"},
    {"name": "Google Play Developer", "description": "App publishing API", "category": "Development", "authType": "oauth", "baseUrl": "https://developers.google.com/android-publisher/"},
    {"name": "IPInfo.io", "description": "IP geolocation API", "category": "Development", "authType": "apiKey", "baseUrl": "https://ipinfo.io/developers"},
    {"name": "MAC Address Lookup", "description": "MAC vendor lookup", "category": "Development", "authType": "apiKey", "baseUrl": "https://macaddress.io/api-documentation"},
    {"name": "openHAB", "description": "Home automation REST API", "category": "IoT", "authType": "none", "baseUrl": "https://github.com/openhab/openhab1-addons/wiki/REST-API"},
    {"name": "Particle Cloud", "description": "IoT device cloud", "category": "IoT", "authType": "apiKey", "baseUrl": "https://docs.particle.io/reference/api/"},
    {"name": "QR Server API", "description": "QR code generator", "category": "Development", "authType": "none", "baseUrl": "http://goqr.me/api/"},
    {"name": "Scraper API", "description": "Web scraping proxy", "category": "Development", "authType": "apiKey", "baseUrl": "https://www.scraperapi.com/documentation"},
    {"name": "StackExchange API", "description": "Stack Overflow data", "category": "Development", "authType": "apiKey", "baseUrl": "https://api.stackexchange.com/docs"},
    {"name": "SVN API", "description": "Subversion libraries", "category": "Development", "authType": "none", "baseUrl": "https://subversion.apache.org/docs/api/1.8/"},
    {"name": "W3C API", "description": "W3C specifications data", "category": "Development", "authType": "none", "baseUrl": "https://github.com/w3c/w3c-api"},
    {"name": "ZenHub API", "description": "GitHub project management", "category": "Development", "authType": "apiKey", "baseUrl": "https://github.com/ZenHubIO/API"},
    {"name": "V2EX API", "description": "Developer community forum", "category": "Development", "authType": "none", "baseUrl": "https://www.v2ex.com/p/7v9TEc53"},
    {"name": "Coding.net", "description": "Code hosting platform", "category": "Development", "authType": "oauth", "baseUrl": "https://open.coding.net/"},
    {"name": "Diycode", "description": "Developer community", "category": "Development", "authType": "apiKey", "baseUrl": "https://www.diycode.cc/api"},
    {"name": "Gank.io", "description": "Developer resources API", "category": "Development", "authType": "none", "baseUrl": "http://gank.io/api"},
    {"name": "Laravel China", "description": "Laravel community API", "category": "Development", "authType": "apiKey", "baseUrl": "https://laravel-china.org/topics/3097"},
    {"name": "Oschina API", "description": "Chinese dev community", "category": "Development", "authType": "oauth", "baseUrl": "http://www.oschina.net/openapi"},
    {"name": "Ruby China", "description": "Ruby community API", "category": "Development", "authType": "apiKey", "baseUrl": "https://ruby-china.org/api-doc/"},

    # EMAIL
    {"name": "Context.IO", "description": "Email API for developers", "category": "Email", "authType": "oauth", "baseUrl": "http://context.io/"},
    {"name": "Inbox by Nylas", "description": "Modern email API", "category": "Email", "authType": "oauth", "baseUrl": "https://www.inboxapp.com/docs"},
    {"name": "Mandrill", "description": "Transactional email API", "category": "Email", "authType": "apiKey", "baseUrl": "https://mandrillapp.com/api/docs/"},
    {"name": "Outlook Mail API", "description": "Microsoft email API", "category": "Email", "authType": "oauth", "baseUrl": "https://msdn.microsoft.com/en-us/office/office365/api/mail-rest-operations"},

    # FITNESS & WEARABLES
    {"name": "Adidas API", "description": "Adidas services API", "category": "Fitness", "authType": "apiKey", "baseUrl": "https://developers.adidas.com/services"},
    {"name": "Fitbit API", "description": "Fitness tracker data", "category": "Fitness", "authType": "oauth", "baseUrl": "https://dev.fitbit.com/"},
    {"name": "Jawbone UP", "description": "Activity tracking API", "category": "Fitness", "authType": "oauth", "baseUrl": "https://jawbone.com/up/developer"},
    {"name": "Sony Lifelog", "description": "Sony wearable data", "category": "Fitness", "authType": "oauth", "baseUrl": "https://developer.sony.com/develop/services/lifelog-api/"},
    {"name": "Misfit API", "description": "Activity tracker API", "category": "Fitness", "authType": "oauth", "baseUrl": "https://build.misfit.com/"},
    {"name": "Nike+ API", "description": "Nike fitness data", "category": "Fitness", "authType": "oauth", "baseUrl": "https://developer.nike.com/content/nike-developer-cq/us/en_us/index/documentation/api-docs.html"},
    {"name": "Recon API", "description": "Sports instruments data", "category": "Fitness", "authType": "apiKey", "baseUrl": "http://www.reconinstruments.com/developers/develop/for-recon-engage/api-documentation/"},
    {"name": "Strava API", "description": "Athletic activity API", "category": "Fitness", "authType": "oauth", "baseUrl": "https://strava.github.io/api/"},
    {"name": "Withings API", "description": "Health device data", "category": "Fitness", "authType": "oauth", "baseUrl": "http://www.withings.com/us/en/developers"},

    # FOOD
    {"name": "Pizza Order API", "description": "Restaurant ordering API", "category": "Food", "authType": "none", "baseUrl": "https://order-pizza-api.herokuapp.com/api/ui"},

    # FOREX
    {"name": "1Forge Forex", "description": "Real-time forex quotes", "category": "Finance", "authType": "apiKey", "baseUrl": "https://1forge.com/"},
    {"name": "CurrencyScoop", "description": "Currency rates API", "category": "Finance", "authType": "apiKey", "baseUrl": "https://currencyscoop.com/"},

    # GAMES
    {"name": "Battle.net", "description": "Blizzard games API", "category": "Games", "authType": "apiKey", "baseUrl": "https://dev.battle.net/"},
    {"name": "Clash of Clans API", "description": "Game data API", "category": "Games", "authType": "apiKey", "baseUrl": "https://developer.clashofclans.com/"},
    {"name": "EVE Online API", "description": "Space MMORPG API", "category": "Games", "authType": "apiKey", "baseUrl": "https://developers.eveonline.com/"},
    {"name": "Facebook Games", "description": "Facebook gaming APIs", "category": "Games", "authType": "oauth", "baseUrl": "https://developers.facebook.com/docs/games"},
    {"name": "Google Play Games", "description": "Google gaming services", "category": "Games", "authType": "oauth", "baseUrl": "https://developers.google.com/games/"},
    {"name": "Riot Games API", "description": "League of Legends data", "category": "Games", "authType": "apiKey", "baseUrl": "https://developer.riotgames.com/"},
    {"name": "Steam Web API", "description": "Steam gaming platform", "category": "Games", "authType": "apiKey", "baseUrl": "https://steamcommunity.com/dev"},
    {"name": "Giant Bomb API", "description": "Video game database", "category": "Games", "authType": "apiKey", "baseUrl": "http://www.giantbomb.com/api/"},
    {"name": "Guild Wars 2 API", "description": "Guild Wars 2 game data", "category": "Games", "authType": "apiKey", "baseUrl": "https://wiki.guildwars2.com/wiki/API:Main"},

    # IOT
    {"name": "Automatic API", "description": "Connected car data", "category": "IoT", "authType": "oauth", "baseUrl": "https://developer.automatic.com/"},
    {"name": "Amazon Alexa API", "description": "Voice assistant API", "category": "IoT", "authType": "oauth", "baseUrl": "https://developer.amazon.com/public/solutions/alexa/alexa-voice-service/content/avs-api-overview"},
    {"name": "Google Assistant", "description": "Google voice assistant", "category": "IoT", "authType": "oauth", "baseUrl": "https://developers.google.com/actions/"},
    {"name": "Home8 API", "description": "IoT alarm system", "category": "IoT", "authType": "apiKey", "baseUrl": "https://developer.home8systems.com/"},
    {"name": "Homey API", "description": "Smart home platform", "category": "IoT", "authType": "oauth", "baseUrl": "https://developers.athom.com/api/"},
    {"name": "HP Print API", "description": "Printer services", "category": "IoT", "authType": "apiKey", "baseUrl": "https://developers.hp.com/printos/printos"},
    {"name": "LIFX API", "description": "Smart lightbulb control", "category": "IoT", "authType": "apiKey", "baseUrl": "https://api.developer.lifx.com/"},
    {"name": "LightwaveRF API", "description": "Smart home lighting", "category": "IoT", "authType": "apiKey", "baseUrl": "https://api.lightwaverf.com/"},
    {"name": "MicroBees API", "description": "IoT messaging platform", "category": "IoT", "authType": "apiKey", "baseUrl": "http://developers.microbees.com/documentation/"},
    {"name": "Mojio API", "description": "Connected car platform", "category": "IoT", "authType": "oauth", "baseUrl": "https://www.moj.io/developer/"},
    {"name": "MyStrom API", "description": "Smart plug control", "category": "IoT", "authType": "none", "baseUrl": "https://mystrom.ch/de/mystrom-api"},
    {"name": "Neurio API", "description": "Energy monitoring", "category": "IoT", "authType": "oauth", "baseUrl": "http://neur.io/developers/"},
    {"name": "Philips Hue API", "description": "Smart lighting control", "category": "IoT", "authType": "apiKey", "baseUrl": "https://developers.meethue.com/"},
    {"name": "Smappee API", "description": "Energy monitoring", "category": "IoT", "authType": "oauth", "baseUrl": "https://smappee.atlassian.net/wiki/display/DEVAPI/SmappeeDevAPI+Home"},
    {"name": "SmartThings API", "description": "Samsung smart home", "category": "IoT", "authType": "oauth", "baseUrl": "https://developers.athom.com/api/"},
    {"name": "Stack Lighting API", "description": "Responsive lighting", "category": "IoT", "authType": "apiKey", "baseUrl": "http://developers.stacklighting.com/"},
    {"name": "Vinli API", "description": "Connected car apps", "category": "IoT", "authType": "oauth", "baseUrl": "https://dev.vin.li/"},
    {"name": "Yeelight API", "description": "Smart LED control", "category": "IoT", "authType": "none", "baseUrl": "http://www.yeelight.com/en_US/developer"},

    # MACHINE LEARNING
    {"name": "Amazon ML API", "description": "AWS machine learning", "category": "AI/ML", "authType": "apiKey", "baseUrl": "https://aws.amazon.com/cn/documentation/machine-learning/"},
    {"name": "BigML API", "description": "ML platform API", "category": "AI/ML", "authType": "apiKey", "baseUrl": "https://bigml.com/api"},
    {"name": "Diffbot API", "description": "AI web extraction", "category": "AI/ML", "authType": "apiKey", "baseUrl": "https://www.diffbot.com/dev/docs/"},
    {"name": "Google Cloud Prediction", "description": "Google ML API", "category": "AI/ML", "authType": "oauth", "baseUrl": "https://cloud.google.com/prediction/docs/"},
    {"name": "IBM Watson", "description": "Watson AI services", "category": "AI/ML", "authType": "apiKey", "baseUrl": "https://developer.ibm.com/watson/"},
    {"name": "Azure ML", "description": "Microsoft ML services", "category": "AI/ML", "authType": "apiKey", "baseUrl": "https://azure.microsoft.com/en-us/services/cognitive-services/"},

    # MAPS
    {"name": "Amap API", "description": "Chinese mapping service", "category": "Maps", "authType": "apiKey", "baseUrl": "http://lbs.amap.com/"},
    {"name": "Baidu Map API", "description": "Baidu mapping service", "category": "Maps", "authType": "apiKey", "baseUrl": "http://lbsyun.baidu.com/index.php"},
    {"name": "Bing Maps", "description": "Microsoft mapping", "category": "Maps", "authType": "apiKey", "baseUrl": "https://www.microsoft.com/maps/choose-your-bing-maps-API.aspx"},
    {"name": "Google Maps API", "description": "Google mapping service", "category": "Maps", "authType": "apiKey", "baseUrl": "https://developers.google.com/maps/web-services/"},
    {"name": "HERE Maps API", "description": "HERE mapping services", "category": "Maps", "authType": "apiKey", "baseUrl": "https://developer.here.com/develop/rest-apis"},
    {"name": "Tencent Map API", "description": "Tencent mapping", "category": "Maps", "authType": "apiKey", "baseUrl": "http://lbs.qq.com/webservice_v1/index.html"},

    # MESSAGING
    {"name": "Cisco Spark API", "description": "Team collaboration", "category": "Messaging", "authType": "oauth", "baseUrl": "https://developer.ciscospark.com/"},
    {"name": "DingTalk API", "description": "Business messaging", "category": "Messaging", "authType": "apiKey", "baseUrl": "https://open-doc.dingtalk.com/"},
    {"name": "dondeEsta API", "description": "Family tracking", "category": "Messaging", "authType": "apiKey", "baseUrl": "http://docs.dondeesta.apiary.io/"},
    {"name": "Fleep API", "description": "Team messenger", "category": "Messaging", "authType": "apiKey", "baseUrl": "https://fleep.io/fleepapi/"},
    {"name": "GroupMe API", "description": "Group messaging", "category": "Messaging", "authType": "oauth", "baseUrl": "https://dev.groupme.com/docs/v3"},
    {"name": "Indoona API", "description": "Messaging platform", "category": "Messaging", "authType": "apiKey", "baseUrl": "https://developer.indoona.com/"},
    {"name": "LINE API", "description": "LINE messaging platform", "category": "Messaging", "authType": "oauth", "baseUrl": "https://developers.line.me/"},
    {"name": "MessageBird API", "description": "SMS and voice API", "category": "Messaging", "authType": "apiKey", "baseUrl": "https://developers.messagebird.com/"},
    {"name": "Slack API", "description": "Team collaboration API", "category": "Messaging", "authType": "oauth", "baseUrl": "https://api.slack.com/"},
    {"name": "Telegram Bot API", "description": "Telegram messaging", "category": "Messaging", "authType": "apiKey", "baseUrl": "https://core.telegram.org/api"},
    {"name": "Yo API", "description": "Simple notifications", "category": "Messaging", "authType": "apiKey", "baseUrl": "http://docs.justyo.co/"},

    # MUSIC
    {"name": "Deezer API", "description": "Music streaming", "category": "Music", "authType": "oauth", "baseUrl": "https://developers.deezer.com/"},
    {"name": "Last.fm API", "description": "Music data and scrobbling", "category": "Music", "authType": "apiKey", "baseUrl": "http://www.last.fm/zh/api"},
    {"name": "MusicGraph API", "description": "Music knowledge engine", "category": "Music", "authType": "apiKey", "baseUrl": "https://developer.musicgraph.com/"},
    {"name": "Musixmatch API", "description": "Lyrics database", "category": "Music", "authType": "apiKey", "baseUrl": "https://developer.musixmatch.com/"},
    {"name": "OneMusicAPI", "description": "Music metadata", "category": "Music", "authType": "apiKey", "baseUrl": "http://www.onemusicapi.com/"},
    {"name": "SearchLy", "description": "Song lyrics search", "category": "Music", "authType": "none", "baseUrl": "https://github.com/AlbertSuarez/searchly"},
    {"name": "SoundCloud API", "description": "Audio sharing platform", "category": "Music", "authType": "oauth", "baseUrl": "https://developers.soundcloud.com/"},
    {"name": "Spotify Web API", "description": "Music streaming API", "category": "Music", "authType": "oauth", "baseUrl": "https://developer.spotify.com/web-api/"},

    # NEWS
    {"name": "Aztro API", "description": "Horoscope information", "category": "News", "authType": "none", "baseUrl": "https://aztro.sameerkumar.website"},
    {"name": "BreweryDB", "description": "Brewery database", "category": "News", "authType": "apiKey", "baseUrl": "http://www.brewerydb.com/developers"},
    {"name": "Diigo API", "description": "Bookmark manager", "category": "News", "authType": "apiKey", "baseUrl": "https://www.diigo.com/api_dev"},
    {"name": "Feedly API", "description": "News aggregator", "category": "News", "authType": "oauth", "baseUrl": "https://developer.feedly.com/"},
    {"name": "Genius API", "description": "Music and lyrics knowledge", "category": "News", "authType": "oauth", "baseUrl": "https://docs.genius.com/"},
    {"name": "Goodreads API", "description": "Book recommendations", "category": "News", "authType": "apiKey", "baseUrl": "https://www.goodreads.com/api"},
    {"name": "HackerNews API", "description": "Tech news and discussions", "category": "News", "authType": "none", "baseUrl": "https://github.com/HackerNews/API"},
    {"name": "Inoreader API", "description": "RSS reader", "category": "News", "authType": "oauth", "baseUrl": "https://www.inoreader.com/developers/"},
    {"name": "Instapaper API", "description": "Read later service", "category": "News", "authType": "oauth", "baseUrl": "https://www.instapaper.com/api"},
    {"name": "Narro API", "description": "Audio articles", "category": "News", "authType": "apiKey", "baseUrl": "https://docs.narro.co/"},
    {"name": "NewsBlur API", "description": "RSS reader", "category": "News", "authType": "apiKey", "baseUrl": "https://newsblur.com/api"},
    {"name": "NPR API", "description": "NPR content access", "category": "News", "authType": "apiKey", "baseUrl": "http://www.npr.org/api/index"},
    {"name": "Pinboard API", "description": "Bookmarking service", "category": "News", "authType": "apiKey", "baseUrl": "https://pinboard.in/api"},
    {"name": "Pocket API", "description": "Save for later", "category": "News", "authType": "oauth", "baseUrl": "https://getpocket.com/developer/"},
    {"name": "Product Hunt API", "description": "Product discovery", "category": "News", "authType": "oauth", "baseUrl": "https://api.producthunt.com/v1/docs"},
    {"name": "NY Times API", "description": "NY Times content", "category": "News", "authType": "apiKey", "baseUrl": "https://developer.nytimes.com/"},
    {"name": "USA Today API", "description": "USA Today content", "category": "News", "authType": "apiKey", "baseUrl": "https://developer.usatoday.com/docs/"},

    # NOTES
    {"name": "Evernote API", "description": "Note-taking platform", "category": "Productivity", "authType": "oauth", "baseUrl": "https://dev.evernote.com/doc/"},
    {"name": "OneNote API", "description": "Microsoft notes", "category": "Productivity", "authType": "oauth", "baseUrl": "https://msdn.microsoft.com/en-us/office/office365/howto/onenote-supported-ops"},
    {"name": "Youdao Note API", "description": "Chinese note service", "category": "Productivity", "authType": "apiKey", "baseUrl": "http://note.youdao.com/open/"},

    # PAYMENT
    {"name": "PayPal API", "description": "Payment processing", "category": "Payment", "authType": "oauth", "baseUrl": "https://developer.paypal.com/docs/api/"},
    {"name": "Paymill API", "description": "Payment gateway", "category": "Payment", "authType": "apiKey", "baseUrl": "https://developers.paymill.com/index"},
    {"name": "Paytm API", "description": "Indian payment gateway", "category": "Payment", "authType": "apiKey", "baseUrl": "https://paytm.com/business/payments/developers"},
    {"name": "WePay API", "description": "Payment platform", "category": "Payment", "authType": "oauth", "baseUrl": "https://www.wepay.com/"},
    {"name": "PhonePe API", "description": "Indian UPI payments", "category": "Payment", "authType": "apiKey", "baseUrl": "https://developer.phonepe.com/docs"},

    # PHOTOGRAPHY
    {"name": "500px API", "description": "Photography community", "category": "Photography", "authType": "oauth", "baseUrl": "https://github.com/500px/api-documentation"},
    {"name": "Giphy API", "description": "GIF library", "category": "Photography", "authType": "apiKey", "baseUrl": "https://developers.giphy.com/docs/"},
    {"name": "Imgur API", "description": "Image hosting", "category": "Photography", "authType": "oauth", "baseUrl": "https://api.imgur.com/"},
    {"name": "Pixabay API", "description": "Free stock photos", "category": "Photography", "authType": "apiKey", "baseUrl": "https://pixabay.com/api/docs/"},
    {"name": "Unsplash API", "description": "Free high-res photos", "category": "Photography", "authType": "apiKey", "baseUrl": "https://unsplash.com/documentation"},
    {"name": "Unsplash Source", "description": "Random photo embeds", "category": "Photography", "authType": "none", "baseUrl": "https://source.unsplash.com/"},

    # PLACES
    {"name": "Yelp API", "description": "Local business reviews", "category": "Places", "authType": "apiKey", "baseUrl": "https://www.yelp.com/developers/documentation/v2/overview"},
    {"name": "Zomato API", "description": "Restaurant database", "category": "Places", "authType": "apiKey", "baseUrl": "https://developers.zomato.com/api"},

    # SOCIAL
    {"name": "Disqus API", "description": "Comments platform", "category": "Social", "authType": "oauth", "baseUrl": "https://disqus.com/api/docs/"},
    {"name": "Facebook API", "description": "Social networking", "category": "Social", "authType": "oauth", "baseUrl": "https://developers.facebook.com/docs/"},
    {"name": "Flickr API", "description": "Photo sharing", "category": "Social", "authType": "apiKey", "baseUrl": "https://www.flickr.com/services/api/"},
    {"name": "Foursquare API", "description": "Location-based social", "category": "Social", "authType": "oauth", "baseUrl": "https://developer.foursquare.com/"},
    {"name": "Instagram API", "description": "Photo sharing social", "category": "Social", "authType": "oauth", "baseUrl": "https://www.instagram.com/developer/"},
    {"name": "LinkedIn API", "description": "Professional network", "category": "Social", "authType": "oauth", "baseUrl": "https://developer.linkedin.com/"},
    {"name": "Pinterest API", "description": "Visual discovery", "category": "Social", "authType": "oauth", "baseUrl": "https://developers.pinterest.com/"},
    {"name": "Reddit API", "description": "Social news aggregation", "category": "Social", "authType": "oauth", "baseUrl": "https://www.reddit.com/dev/api/"},
    {"name": "Tumblr API", "description": "Microblogging platform", "category": "Social", "authType": "oauth", "baseUrl": "https://www.tumblr.com/docs/en/api/v2"},
    {"name": "Twitter API", "description": "Social media platform", "category": "Social", "authType": "oauth", "baseUrl": "https://dev.twitter.com/"},
    {"name": "Weibo API", "description": "Chinese social media", "category": "Social", "authType": "oauth", "baseUrl": "http://open.weibo.com/wiki/API"},

    # SHOPPING
    {"name": "Amazon Developer", "description": "Amazon services API", "category": "Shopping", "authType": "oauth", "baseUrl": "https://developer.amazon.com/services-and-apis"},
    {"name": "Best Buy API", "description": "Retail products", "category": "Shopping", "authType": "apiKey", "baseUrl": "https://developer.bestbuy.com/"},
    {"name": "eBay API", "description": "Online marketplace", "category": "Shopping", "authType": "oauth", "baseUrl": "https://go.developer.ebay.com/"},
    {"name": "Home Depot API", "description": "Home improvement retail", "category": "Shopping", "authType": "apiKey", "baseUrl": "https://developer.homedepot.com/"},
    {"name": "Semantics3 API", "description": "Product data", "category": "Shopping", "authType": "apiKey", "baseUrl": "http://docs.semantics3.com/reference"},
    {"name": "Slice API", "description": "Purchase data", "category": "Shopping", "authType": "apiKey", "baseUrl": "https://developer.slice.com/"},

    # TEAMWORK
    {"name": "Asana API", "description": "Project management", "category": "Productivity", "authType": "oauth", "baseUrl": "https://asana.com/guide/help/api/api"},
    {"name": "Join.me API", "description": "Online meetings", "category": "Productivity", "authType": "oauth", "baseUrl": "https://developer.join.me/"},
    {"name": "Teambition API", "description": "Project collaboration", "category": "Productivity", "authType": "oauth", "baseUrl": "https://www.teambition.com/developer/open-platform"},
    {"name": "TeamSnap API", "description": "Team management", "category": "Productivity", "authType": "oauth", "baseUrl": "http://developer.teamsnap.com/"},
    {"name": "Trello API", "description": "Kanban board", "category": "Productivity", "authType": "oauth", "baseUrl": "https://developers.trello.com/"},
    {"name": "Worktile API", "description": "Project collaboration", "category": "Productivity", "authType": "apiKey", "baseUrl": "https://dev.worktile.com/document/overview"},

    # TEXT ANALYSIS
    {"name": "BosonNLP", "description": "Chinese NLP", "category": "AI/ML", "authType": "apiKey", "baseUrl": "http://docs.bosonnlp.com/"},
    {"name": "Detect Language API", "description": "Language detection", "category": "AI/ML", "authType": "apiKey", "baseUrl": "https://rapidapi.com/BigLobster/api/language-identification-prediction"},
    {"name": "Tencent NLP", "description": "Chinese NLP", "category": "AI/ML", "authType": "apiKey", "baseUrl": "http://nlp.qq.com/help.cgi"},
    {"name": "Azure Text Analytics", "description": "Microsoft NLP", "category": "AI/ML", "authType": "apiKey", "baseUrl": "https://azure.microsoft.com/en-us/services/cognitive-services/text-analytics/"},
    {"name": "Watson NLU", "description": "IBM NLP", "category": "AI/ML", "authType": "apiKey", "baseUrl": "https://www.ibm.com/watson/developercloud/natural-language-understanding/api/v1/"},

    # TO-DOS
    {"name": "Beeminder API", "description": "Goal tracking", "category": "Productivity", "authType": "apiKey", "baseUrl": "https://www.beeminder.com/api"},
    {"name": "FollowUp.cc API", "description": "Email follow-ups", "category": "Productivity", "authType": "apiKey", "baseUrl": "http://docs.followup.cc/"},
    {"name": "Todoist API", "description": "Task management", "category": "Productivity", "authType": "oauth", "baseUrl": "https://developer.todoist.com/"},
    {"name": "Toodledo API", "description": "Tasks and notes", "category": "Productivity", "authType": "apiKey", "baseUrl": "https://api.toodledo.com/3/"},

    # TRANSLATION
    {"name": "Baidu Translate", "description": "Chinese translation", "category": "Translation", "authType": "apiKey", "baseUrl": "http://api.fanyi.baidu.com/api/trans/product/index"},
    {"name": "Google Translate", "description": "Machine translation", "category": "Translation", "authType": "apiKey", "baseUrl": "https://cloud.google.com/translate/docs/"},
    {"name": "Microsoft Translator", "description": "Microsoft translation", "category": "Translation", "authType": "apiKey", "baseUrl": "https://www.microsoft.com/en-us/translator/translatorapi.aspx"},
    {"name": "Oxford Dictionaries API", "description": "Dictionary and thesaurus", "category": "Translation", "authType": "apiKey", "baseUrl": "https://developer.oxforddictionaries.com/"},
    {"name": "Yandex Translate", "description": "Russian translation", "category": "Translation", "authType": "apiKey", "baseUrl": "https://tech.yandex.com/translate/"},

    # VIDEO
    {"name": "Dailymotion API", "description": "Video hosting", "category": "Video", "authType": "oauth", "baseUrl": "https://developer.dailymotion.com/api"},
    {"name": "Narrative API", "description": "Video clips", "category": "Video", "authType": "apiKey", "baseUrl": "http://open.getnarrative.com/"},
    {"name": "Rotten Tomatoes API", "description": "Movie ratings", "category": "Video", "authType": "apiKey", "baseUrl": "https://developer.fandango.com/Rotten_Tomatoes"},
    {"name": "TMDb API", "description": "Movie database", "category": "Video", "authType": "apiKey", "baseUrl": "https://developers.themoviedb.org"},
    {"name": "TVmaze API", "description": "TV show database", "category": "Video", "authType": "none", "baseUrl": "https://www.tvmaze.com/api"},
    {"name": "Vimeo API", "description": "Video hosting HD", "category": "Video", "authType": "oauth", "baseUrl": "https://developer.vimeo.com/"},
    {"name": "YouTube API", "description": "Video platform", "category": "Video", "authType": "oauth", "baseUrl": "https://developers.google.com/youtube/documentation/"},

    # VOICE ANALYSIS
    {"name": "Baidu Yuyin", "description": "Chinese speech API", "category": "AI/ML", "authType": "apiKey", "baseUrl": "http://yuyin.baidu.com/docs"},
    {"name": "Google Cloud Speech", "description": "Speech to text", "category": "AI/ML", "authType": "apiKey", "baseUrl": "https://cloud.google.com/speech/"},

    # VISION
    {"name": "CamScanner API", "description": "Document scanning", "category": "AI/ML", "authType": "apiKey", "baseUrl": "https://dev.camscanner.com/"},
    {"name": "Clarifai API", "description": "Image recognition", "category": "AI/ML", "authType": "apiKey", "baseUrl": "https://clarifai.com/developer/guide/"},
    {"name": "Google Cloud Vision", "description": "Image analysis", "category": "AI/ML", "authType": "apiKey", "baseUrl": "https://cloud.google.com/vision/"},
    {"name": "Azure Computer Vision", "description": "Microsoft image AI", "category": "AI/ML", "authType": "apiKey", "baseUrl": "https://azure.microsoft.com/en-us/services/cognitive-services/computer-vision/"},
    {"name": "Face++ API", "description": "Face recognition", "category": "AI/ML", "authType": "apiKey", "baseUrl": "https://console.faceplusplus.com/documents/5678948"},
    {"name": "Watson Visual Recognition", "description": "IBM image AI", "category": "AI/ML", "authType": "apiKey", "baseUrl": "https://www.ibm.com/watson/developercloud/visual-recognition/api/v3/"},

    # WEATHER
    {"name": "AccuWeather API", "description": "Weather forecasts", "category": "Weather", "authType": "apiKey", "baseUrl": "http://apidev.accuweather.com/developers/"},
    {"name": "Aeris Weather", "description": "Weather data API", "category": "Weather", "authType": "apiKey", "baseUrl": "http://www.aerisweather.com/develop/"},
    {"name": "OpenWeatherMap", "description": "Weather data API", "category": "Weather", "authType": "apiKey", "baseUrl": "https://openweathermap.org/api"},
    {"name": "Weather Underground", "description": "Weather data API", "category": "Weather", "authType": "apiKey", "baseUrl": "https://www.wunderground.com/weather/api/"},
    {"name": "Weather Unlocked", "description": "Weather for advertising", "category": "Weather", "authType": "apiKey", "baseUrl": "https://developer.weatherunlocked.com/documentation"},
    {"name": "Yandex Weather", "description": "Russian weather API", "category": "Weather", "authType": "apiKey", "baseUrl": "https://tech.yandex.com/weather/"},
    {"name": "Yahoo Weather", "description": "Weather forecasts", "category": "Weather", "authType": "none", "baseUrl": "https://developer.yahoo.com/weather/"},

    # MORE UNIQUE APIs
    {"name": "iTunes Search API", "description": "Search iTunes content", "category": "Media", "authType": "none", "baseUrl": "https://affiliate.itunes.apple.com/resources/documentation/itunes-store-web-service-search-api/"},
    {"name": "ProgrammableWeb", "description": "API directory", "category": "Development", "authType": "none", "baseUrl": "https://www.programmableweb.com/"},
    {"name": "Yahoo Developer", "description": "Yahoo services API", "category": "Development", "authType": "oauth", "baseUrl": "https://developer.yahoo.com/everything.html"},
]

def get_current_count():
    """Get current API count from registry"""
    registry_file = os.path.expanduser("~/Projects/apiclaw/src/registry/apis.json")
    try:
        with open(registry_file, 'r') as f:
            registry = json.load(f)
            return registry.get('count', len(registry.get('apis', [])))
    except:
        return 0

def add_apis_to_registry(apis):
    """Add APIs to the registry"""
    registry_file = os.path.expanduser("~/Projects/apiclaw/src/registry/apis.json")
    
    try:
        with open(registry_file, 'r') as f:
            registry = json.load(f)
    except:
        registry = {"version": "3.2.3", "source": "APIClaw aggregated registry", "apis": [], "count": 0}
    
    existing_names = {api.get('name', '').lower() for api in registry.get('apis', [])}
    existing_ids = {api.get('id', '').lower() for api in registry.get('apis', [])}
    
    added = 0
    for api in apis:
        api_id = api['name'].lower().replace(' ', '-').replace('_', '-')
        api_id = ''.join(c for c in api_id if c.isalnum() or c == '-')
        
        name_lower = api['name'].lower()
        
        if name_lower not in existing_names and api_id not in existing_ids:
            new_api = {
                "id": api_id,
                "name": api['name'],
                "description": api['description'],
                "category": api['category'],
                "auth": api.get('authType', 'None'),
                "https": True,
                "cors": "unknown",
                "link": api.get('baseUrl', ''),
                "pricing": "unknown",
                "keywords": []
            }
            registry['apis'].append(new_api)
            existing_names.add(name_lower)
            existing_ids.add(api_id)
            added += 1
    
    registry['lastUpdated'] = datetime.now().isoformat()
    registry['count'] = len(registry['apis'])
    
    with open(registry_file, 'w') as f:
        json.dump(registry, f, indent=2)
    
    return added, len(registry['apis'])

if __name__ == "__main__":
    before = get_current_count()
    print(f"🦞 APIClaw Night Expansion - 2026-02-24 03:00 Batch 2")
    print(f"Before: {before} APIs")
    
    added, total = add_apis_to_registry(NEW_APIS_BATCH2)
    
    print(f"Added: {added} new APIs")
    print(f"Total: {total} APIs")
    print(f"✅ Done!")
